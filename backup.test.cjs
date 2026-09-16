const assert = require('node:assert/strict');
const B = require('./backup.js');
const ExcelJS = require('./vendor/exceljs.min.js');
const id = n => '00000000-0000-0000-0000-' + String(n).padStart(12, '0');
const audit = {created_at: '2026-09-17T10:00:00Z', created_by: 'Tester'};
const fixture = {application: 'QFK Finance Classic', version: 1, createdAt: audit.created_at, settings: {currency: 'QAR'}, data: {
  members: [{...audit, id: id(1), name: 'Active', active: true}, {...audit, id: id(2), name: 'Hidden', active: false, deleted_at: audit.created_at}],
  matches: [{...audit, id: id(3), match_number: 10, match_date: '2026-09-17', players: 20, collection_per_player: 10, total_collected: 200}],
  expenses: [{...audit, id: id(4), expense_date: '2026-09-17', match_id: id(3), category: 'Water', amount: 10, paid_by: id(2), deleted_at: audit.created_at}],
  cash_transactions: [{...audit, id: id(5), transaction_date: '2026-09-17', type: 'match_collection', amount: 200, to_member_id: id(2), match_id: id(3)}]
}};
module.exports = fixture;
async function test() {
  const calls = [];
  const client = {from: table => ({select: () => ({order: () => ({range: async start => ({data: fixture.data[table].slice(start, start + 1)})})}), upsert: rows => ({select: async () => { calls.push(table); return {data: rows}; }})})};
  const collected = await B.collect(client);
  assert.deepEqual(collected.data, fixture.data, 'read all rows even with server page cap of one');
  for (const mutate of [b => delete b.data.expenses, b => b.version++, b => b.data.members.push(b.data.members[0]), b => b.data.expenses[0].paid_by = id(99), b => b.data.matches[0].match_date = '2026-02-30', b => b.data.cash_transactions[0].amount = -1]) {
    const bad = structuredClone(fixture); mutate(bad); assert.throws(() => B.validate(bad));
  }
  const conflicting = structuredClone(fixture); conflicting.data.members[0].id = id(8);
  assert.throws(() => B.conflicts(fixture, conflicting), /conflicting/);
  assert.equal(await B.restore(client, fixture), 5);
  assert.deepEqual(calls, B.tables, 'parents restored before linked rows');
  const broken = {from: () => ({upsert: () => ({select: async () => ({error: {message: 'offline'}})})})};
  await assert.rejects(B.restore(broken, fixture), /0 records already restored/);
  const book = B.workbook(ExcelJS, fixture);
  const roundTrip = new ExcelJS.Workbook(); await roundTrip.xlsx.load(await book.xlsx.writeBuffer());
  assert.equal(roundTrip.getWorksheet('Members').rowCount, 3);
  assert.equal(roundTrip.getWorksheet('Expenses').rowCount, 2);
  assert.equal(roundTrip.getWorksheet('Income').rowCount, 2);
  assert.ok(roundTrip.getWorksheet('Transfers'));
  // Stateful fake database: exercise real merge semantics and retry batches.
  const large = structuredClone(fixture);
  large.data.members.push(...Array.from({length:1201}, (_, n) => ({...audit, id:id(100+n), name:'Member '+n, active:n%2===0})));
  const database = Object.fromEntries(B.tables.map(t => [t, []]));
  database.members.push({...audit, id:id(9999), name:'Newer member', active:true});
  let batches = 0, failBatch = 3;
  const stateful = {from: table => ({
    select: () => ({order: () => ({range: async (start,end) => ({data: database[table].slice().sort((a,b)=>a.id.localeCompare(b.id)).slice(start, Math.min(end+1,start+137))})})}),
    upsert: rows => ({select: async () => {
      batches++;
      if (batches === failBatch) throw new Error('Connection lost');
      for (const row of rows) { const at=database[table].findIndex(r=>r.id===row.id); if(at<0) database[table].push(structuredClone(row)); else database[table][at]=structuredClone(row); }
      return {data:rows.map(r=>({id:r.id}))};
    }})
  })};
  await assert.rejects(B.restore(stateful,large), /200 records already restored and confirmed/);
  failBatch = -1;
  assert.equal(await B.restore(stateful,large),1206);
  assert.equal(await B.restore(stateful,large),1206, 'retry is idempotent');
  assert.equal(database.members.length,1204, 'newer member retained without duplicates');
  const reread = await B.collect(stateful);
  assert.equal(reread.data.members.length,1204, 'all pages beyond 1000 rows read');
  assert.deepEqual(reread.data.expenses,fixture.data.expenses);
  const empty = structuredClone(fixture); B.tables.forEach(t=>empty.data[t]=[]);
  assert.equal(await B.restore(stateful,empty),0);
  assert.equal(database.members.length,1204);
  await assert.rejects(B.collect({from:()=>({select:()=>({order:()=>({range:async()=>({error:{message:'Denied'}})})})})}),/Denied/);
  for (const mutate of [b=>b.data.members[0].deleted_at='not-a-date',b=>b.data.matches[0].notes=true,b=>b.data.members[0].unknown='x']) {
    const bad=structuredClone(fixture);mutate(bad);assert.throws(()=>B.validate(bad));
  }
  const textNumbers=structuredClone(fixture);textNumbers.data.expenses[0].amount='10.25';textNumbers.data.members[0].name='=1+1';
  const numericBook=new ExcelJS.Workbook();await numericBook.xlsx.load(await B.workbook(ExcelJS,textNumbers).xlsx.writeBuffer());
  assert.equal(numericBook.getWorksheet('Expenses').getRow(2).getCell(4).value,10.25);
  assert.equal(numericBook.getWorksheet('Members').getRow(2).getCell(1).type,ExcelJS.ValueType.String,'user text is not an Excel formula');
  console.log('PASS 1206-record merge, pagination, interrupted restore, idempotent retry, retained newer data, empty backup, denied reads, audit validation, numeric Excel cells and formula-like text');
  console.log('PASS backup pagination, hidden/deleted rows, validation, restore ordering/failure, XLSX round trip');
}
if (require.main === module) test().catch(e => { console.error(e); process.exitCode = 1; });
