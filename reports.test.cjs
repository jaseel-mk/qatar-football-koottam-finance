const assert = require('node:assert/strict');
const {build} = require('./reports.js');
const data={allMembers:[{id:'a',name:'Jaseel',active:false},{id:'b',name:'Nashid',active:true}],matches:[{id:'m',match_number:10,match_date:'2026-09-15',total_collected:200}],expenses:[{id:'e',match_id:'m',expense_date:'2026-09-15',amount:150}],ledger:[
{type:'cash_adjustment',transaction_date:'2026-09-01',amount:100,to_member_id:'a'},
{type:'match_collection',transaction_date:'2026-09-15',amount:200,to_member_id:'b',match_id:'m'},
{type:'expense_payment',transaction_date:'2026-09-15',amount:150,from_member_id:'b',match_id:'m'},
{type:'cash_transfer',transaction_date:'2026-09-15',amount:100,from_member_id:'a',to_member_id:'b'},
{type:'cash_adjustment',transaction_date:'2026-09-16',amount:999,to_member_id:'b'},
{type:'cash_adjustment',transaction_date:'2026-09-15',amount:999,to_member_id:'b',deleted_at:'deleted'}]};
const r=build(data,{matchId:'m'});
assert.equal(r.opening,10000);assert.equal(r.closing,15000);assert.equal(r.difference,0);assert.equal(r.warnings.length,0);assert.deepEqual(r.members.map(x=>x.balance),[15000]);
const full=build(data,{start:'2026-09-15',end:'2026-09-15'});assert.equal(full.closing,r.closing);
assert.throws(()=>build(data,{start:'2026-09-16',end:'2026-09-15'}));
const broken=structuredClone(data);broken.ledger[1].amount=190;assert.ok(build(broken,{matchId:'m'}).warnings.length);assert.equal(build(broken,{matchId:'m'}).difference,-1000);
const other=structuredClone(data);other.ledger.push({type:'cash_adjustment',transaction_date:'2026-09-15',amount:0.1,to_member_id:'a'});assert.equal(build(other,{matchId:'m'}).closing,15010);
const missing=structuredClone(data);missing.ledger[0].to_member_id='unknown';assert.ok(build(missing,{matchId:'m'}).warnings.some(x=>x.includes('unknown')));
console.log('PASS: opening and closing cash, date cutoff, transfers, inactive holders, deleted records, invalid range, reconciliation, cents, unknown holders');
