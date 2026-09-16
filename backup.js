/* Complete raw-table backups; report filters never apply here. */
(function (root) {
  'use strict';
  const tables = ['members', 'matches', 'expenses', 'cash_transactions'];
  const audit = ['id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by'];
  const fields = {
    members: ['name', 'active', ...audit],
    matches: ['match_number', 'match_date', 'players', 'collection_per_player', 'total_collected', 'notes', ...audit],
    expenses: ['expense_date', 'match_id', 'category', 'amount', 'paid_by', 'description', ...audit],
    cash_transactions: ['transaction_date', 'type', 'amount', 'from_member_id', 'to_member_id', 'match_id', 'description', ...audit]
  };
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function validate(b) {
    const fail = message => { throw new Error('Invalid backup: ' + message); };
    if (!b || b.application !== 'QFK Finance Classic' || b.version !== 1 || !b.data || !Number.isFinite(Date.parse(b.createdAt))) fail('unsupported format or version.');
    const ids = {};
    for (const table of tables) {
      if (!Array.isArray(b.data[table])) fail('missing ' + table + '.');
      ids[table] = new Set();
      for (const row of b.data[table]) {
        if (!row || !uuid.test(row.id) || ids[table].has(row.id)) fail(table + ' has an invalid or duplicate ID.');
        ids[table].add(row.id);
        for (const [key, value] of Object.entries(row)) {
          if (!fields[table].includes(key)) fail('unsupported field ' + table + '.' + key + '.');
          if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) fail('invalid field value.');
        }
        if (typeof row.created_by !== 'string' || !Number.isFinite(Date.parse(row.created_at))) fail('missing creation history.');
        for (const key of ['updated_at', 'deleted_at']) if (row[key] != null && (typeof row[key] !== 'string' || !Number.isFinite(Date.parse(row[key])))) fail('invalid ' + key + '.');
        for (const key of ['created_at', 'created_by', 'updated_by', 'deleted_by', 'notes', 'description']) if (row[key] != null && typeof row[key] !== 'string') fail('invalid text field ' + key + '.');
      }
    }
    const date = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
    const number = (v, min) => (typeof v === 'number' || typeof v === 'string' && v.trim() !== '') && Number.isFinite(Number(v)) && Number(v) >= min && Number(v) < 100000000;
    const ref = (table, id, optional = false) => optional && id == null || ids[table].has(id);
    const names = new Set(), numbers = new Set();
    for (const m of b.data.members) {
      if (typeof m.name !== 'string' || !m.name.trim() || typeof m.active !== 'boolean' || names.has(m.name)) fail('invalid or duplicate member.');
      names.add(m.name);
    }
    for (const m of b.data.matches) {
      if (!Number.isInteger(m.match_number) || m.match_number < 1 || numbers.has(m.match_number) || !date(m.match_date) || !Number.isInteger(m.players) || m.players < 0 || !number(m.total_collected, 0) || !number(m.collection_per_player, 0)) fail('invalid match.');
      numbers.add(m.match_number);
    }
    for (const e of b.data.expenses) {
      if (!date(e.expense_date) || !number(e.amount, 0.01) || !['Ground', 'Water', 'Equipment', 'Food', 'Other'].includes(e.category) || !ref('members', e.paid_by) || !ref('matches', e.match_id)) fail('invalid expense or missing linked record.');
    }
    for (const t of b.data.cash_transactions) {
      if (!date(t.transaction_date) || !number(t.amount, 0.01) || !['match_collection', 'expense_payment', 'cash_transfer', 'cash_adjustment'].includes(t.type) || !ref('members', t.from_member_id, true) || !ref('members', t.to_member_id, true) || !ref('matches', t.match_id, true) || (!t.from_member_id && !t.to_member_id) || (t.from_member_id && t.from_member_id === t.to_member_id)) fail('invalid cash transaction or missing linked record.');
    }
    return b;
  }
  async function collect(client) {
    if (!client) throw new Error('Database is not configured.');
    const data = {};
    for (const table of tables) {
      data[table] = [];
      // Advance by the actual count: server row limits can be below 1,000.
      for (;;) {
        const offset = data[table].length;
        const result = await client.from(table).select('*').order('id').range(offset, offset + 499);
        if (result.error) throw new Error(table + ': ' + result.error.message);
        if (!Array.isArray(result.data)) throw new Error('Could not read ' + table);
        if (!result.data.length) break;
        data[table].push(...result.data);
      }
    }
    return validate({application: 'QFK Finance Classic', version: 1, createdAt: new Date().toISOString(), settings: {currency: 'QAR'}, data});
  }
  function conflicts(backup, current) {
    for (const [table, key] of [['members', 'name'], ['matches', 'match_number']]) {
      for (const row of backup.data[table]) {
        if (current.data[table].some(existing => existing[key] === row[key] && existing.id !== row.id)) throw new Error('Restore stopped: ' + table + ' contains a conflicting ' + key + ' (' + row[key] + '). No records changed.');
      }
    }
  }
  async function restore(client, backup, progress) {
    validate(backup);
    let completed = 0;
    for (const table of tables) {
      for (let offset = 0; offset < backup.data[table].length; offset += 100) {
        const rows = backup.data[table].slice(offset, offset + 100);
        try {
          const result = await client.from(table).upsert(rows, {onConflict: 'id'}).select('id');
          if (result.error || result.data?.length !== rows.length) throw new Error(result.error?.message || 'The database did not confirm every record.');
        } catch (e) {
          throw new Error('Restore stopped at ' + table + '. ' + completed + ' records already restored and confirmed. The last batch may also have been saved. Keep the safety backup; fix the error and retry. ' + e.message);
        }
        completed += rows.length;
        progress?.('Restored ' + completed + ' records…');
      }
    }
    return completed;
  }
  function workbook(ExcelJS, backup) {
    const book = new ExcelJS.Workbook();
    book.creator = 'QFK Finance Classic';
    function sheet(name, rows, keys) {
      const s = book.addWorksheet(name);
      s.columns = keys.map(key => ({header: key, key, width: key.includes('id') ? 38 : 24}));
      rows.forEach(row => s.addRow(Object.fromEntries(keys.map(k => [k, ['amount', 'total_collected', 'collection_per_player'].includes(k) && row[k] != null ? Number(row[k]) : row[k] ?? '']))));
      s.views = [{state: 'frozen', ySplit: 1}];
      s.getRow(1).font = {bold: true, color: {argb: 'FFFFFFFF'}};
      s.getRow(1).fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FF890D43'}};
      s.autoFilter = {from: {row: 1, column: 1}, to: {row: Math.max(1, s.rowCount), column: keys.length}};
      for (const key of ['amount', 'total_collected', 'collection_per_player']) if (keys.includes(key)) s.getColumn(key).numFmt = '#,##0.00';
    }
    sheet('Settings', [{key: 'Application', value: backup.application}, {key: 'Created at', value: backup.createdAt}, {key: 'Currency', value: 'QAR'}, {key: 'Restore', value: 'Use JSON to restore. Excel is for reference.'}, {key: 'Scope', value: 'All records including hidden and deleted'}], ['key', 'value']);
    const names = {members: 'Members', matches: 'Matches', expenses: 'Expenses', cash_transactions: 'Cash Transactions'};
    for (const table of tables) sheet(names[table], backup.data[table], fields[table]);
    sheet('Income', backup.data.cash_transactions.filter(t => !t.from_member_id && t.to_member_id), fields.cash_transactions);
    sheet('Transfers', backup.data.cash_transactions.filter(t => t.type === 'cash_transfer'), fields.cash_transactions);
    return book;
  }
  root.QFKBackup = {tables, validate, collect, conflicts, restore, workbook};
  if (typeof module !== 'undefined') module.exports = root.QFKBackup;
})(typeof window === 'undefined' ? globalThis : window);

if (typeof window !== 'undefined') {
  (() => {
    let selected = null, busy = false;
    const status = message => { $('backupStatus').textContent = message; };
    function lock(value) {
      busy = value;
      ['backupDownload', 'backupFormat', 'backupFile'].forEach(id => { $(id).disabled = value; });
      $('backupRestore').disabled = value || !selected;
    }
    function download(blob, name) {
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
    const json = b => new Blob([JSON.stringify(b, null, 2)], {type: 'application/json'});
    const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
    $('backupDownload').addEventListener('click', async () => {
      if (busy) return;
      lock(true); status('Reading all saved records…');
      try {
        const b = await QFKBackup.collect(sb);
        if ($('backupFormat').value === 'excel') {
          const book = QFKBackup.workbook(ExcelJS, b);
          download(new Blob([await book.xlsx.writeBuffer()], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), 'QFK-Backup-' + stamp() + '.xlsx');
        } else download(json(b), 'QFK-Backup-' + stamp() + '.json');
        status('Backup download started. Includes all ' + QFKBackup.tables.reduce((n, t) => n + b.data[t].length, 0) + ' records.');
      } catch (e) { status('Backup failed: ' + e.message); }
      finally { lock(false); }
    });
    $('backupFile').addEventListener('change', async () => {
      selected = null; $('backupRestore').disabled = true; $('backupPreview').textContent = '';
      const file = $('backupFile').files[0];
      if (!file) return;
      lock(true);
      try {
        if (file.size > 25 * 1024 * 1024) throw new Error('Choose a JSON backup smaller than 25 MB.');
        selected = QFKBackup.validate(JSON.parse(await file.text()));
        $('backupPreview').textContent = 'Backup from ' + new Date(selected.createdAt).toLocaleString() + ' — ' + QFKBackup.tables.map(t => selected.data[t].length + ' ' + t.replaceAll('_', ' ')).join(', ') + '. Includes hidden/deleted records.';
        status('Backup validated. Review the counts before restoring.');
      } catch (e) { selected = null; status(e.message); }
      finally { lock(false); }
    });
    $('backupRestore').addEventListener('click', async () => {
      if (busy || !selected) return;
      if (!confirm('Restore this backup to the shared database? Matching records will be overwritten. Newer records not in the backup will remain.')) return;
      lock(true); status('Preparing safety backup…');
      try {
        const safety = await QFKBackup.collect(sb);
        QFKBackup.conflicts(selected, safety);
        download(json(safety), 'QFK-Before-Restore-' + stamp() + '.json');
        if (!confirm('Check that the safety JSON backup downloaded successfully. Continue with restore?')) { status('Restore cancelled. No records changed.'); return; }
        const count = await QFKBackup.restore(sb, selected, status);
        await loadData();
        status('Restore complete: ' + count + ' records restored. Records outside the backup were retained.');
      } catch (e) { status(e.message); await loadData(); }
      finally { lock(false); }
    });
  })();
}
