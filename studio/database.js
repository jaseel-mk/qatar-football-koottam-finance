(function (root) {
  'use strict';
  const TABLE = 'qfk_matchday_workspace_v1';
  function validate(data) {
    if (!data || data.version !== 1 || !['players', 'formations', 'matches'].every(k => Array.isArray(data[k]))) throw Error('Invalid Studio backup.');
    for (const key of ['players', 'formations', 'matches']) {
      const ids = new Set();
      for (const item of data[key]) {
        if (!item || typeof item.id !== 'string' || ids.has(item.id)) throw Error('Invalid or duplicate ' + key + ' identifier.');
        ids.add(item.id);
      }
    }
    for (const p of data.players) if (typeof p.name !== 'string' || !p.name.trim()) throw Error('Invalid player name.');
    const formation = f => {
      if (!f || typeof f.name !== 'string' || typeof f.code !== 'string' || !Array.isArray(f.slots)) throw Error('Invalid formation.');
      const ids = new Set();
      for (const s of f.slots) {
        if (!s || typeof s.id !== 'string' || ids.has(s.id) || typeof s.label !== 'string' || !Number.isFinite(s.x) || !Number.isFinite(s.y) || s.x < 0 || s.x > 100 || s.y < 0 || s.y > 100) throw Error('Invalid formation position.');
        ids.add(s.id);
      }
    };
    data.formations.forEach(formation);
    const numbers = new Set();
    for (const m of data.matches) {
      if (!Number.isInteger(m.number) || m.number < 1 || numbers.has(m.number) || !['DRAFT', 'READY', 'ARCHIVED'].includes(m.status) || !['title', 'date', 'start', 'end', 'venue'].every(k => typeof m[k] === 'string') || !Array.isArray(m.teams) || m.teams.length !== 2 || !Array.isArray(m.roster) || !Array.isArray(m.posters)) throw Error('Invalid match.');
      numbers.add(m.number);
      if (m.teams[0].side !== 'A' || m.teams[1].side !== 'B') throw Error('Invalid teams.');
      for (const t of m.teams) { formation(t.formation); for (const key of ['color', 'secondary', 'text', 'goalkeeper']) if (!/^#[0-9a-f]{6}$/i.test(t[key])) throw Error('Invalid team colour.'); }
      for (const p of m.roster) if (!p || typeof p.name !== 'string' || !['STARTER', 'SUBSTITUTE', 'UNASSIGNED'].includes(p.status)) throw Error('Invalid match player.');
      // Saved SVG is never trusted: rebuild previews from each stored snapshot.
      for (const p of m.posters) if (!p || !p.snapshot || !Array.isArray(p.snapshot.teams) || !Array.isArray(p.snapshot.roster)) throw Error('Invalid poster snapshot.');
    }
    return data;
  }
  function create({url, key, fetcher = root.fetch.bind(root)}) {
    const endpoint = url.replace(/\/$/, '') + '/rest/v1/';
    let revision = null;
    async function request(path, options = {}) {
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetcher(endpoint + path, {...options, signal: controller.signal, headers: {apikey: key, 'Content-Type': 'application/json', ...options.headers}});
        const body = await response.json();
        if (!response.ok) {
          if (body.code === '40001') throw Error('Someone saved newer Studio changes. Export your edits, then reload before saving again.');
          if (['PGRST202', 'PGRST205', '42P01'].includes(body.code)) throw Error('Database setup is required. Run studio/matchday-database.sql in the QFK Supabase SQL Editor.');
          throw Error(body.message || 'Database request failed.');
        }
        return body;
      } catch (error) {
        if (error.name === 'AbortError') throw Error('Database connection timed out. Your edits remain unsaved; retry saving.');
        throw error;
      } finally { clearTimeout(timeout); }
    }
    return {
      async load() {
        const rows = await request(TABLE + '?id=eq.qfk&select=revision,payload');
        if (!Array.isArray(rows) || rows.length > 1) throw Error('Invalid database response.');
        if (!rows.length) { revision = 0; return null; }
        const data = validate(rows[0].payload);
        if (!Number.isSafeInteger(rows[0].revision) || rows[0].revision < 1) throw Error('Invalid database revision.');
        revision = rows[0].revision;
        return data;
      },
      async save(data) {
        if (revision === null) throw Error('Load the database before saving.');
        validate(data);
        const body = await request('rpc/qfk_save_matchday_workspace_v1', {method: 'POST', body: JSON.stringify({p_expected_revision: revision, p_payload: data})});
        if (!Number.isSafeInteger(body) || body !== revision + 1) throw Error('Save was not confirmed. Reload before retrying.');
        revision = body;
      }
    };
  }
  const api = {create, validate, TABLE};
  root.StudioDatabase = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
