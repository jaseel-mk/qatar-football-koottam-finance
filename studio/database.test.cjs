const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('./database.js'),M=require('./model.js');
const fixture=()=>({version:1,players:[],formations:[M.formation()],matches:[]});
const response=(body,status=200)=>({ok:status<400,json:async()=>body});
test('database saves the entire builder and poster snapshot in a single revision-checked request',async()=>{
  const data=fixture(),match=M.createMatch(1,data.formations);data.matches.push(match);M.addPlayerToMatch(data,match,'Test player',7);
  match.posters.push({id:M.id(),snapshot:structuredClone({...match,posters:[]})});
  const calls=[],db=D.create({url:'https://example.test',key:'public',fetcher:async(url,options)=>{calls.push({url,options});return response(options.method?2:[{revision:1,payload:data}]);}});
  assert.deepEqual(await db.load(),data);await db.save(data);
  assert.match(calls[0].url,/qfk_matchday_workspace_v1\?/);assert.match(calls[1].url,/rpc\/qfk_save_matchday_workspace_v1$/);
  const sent=JSON.parse(calls[1].options.body);assert.equal(sent.p_expected_revision,1);assert.deepEqual(sent.p_payload,data);assert.equal(calls[1].options.headers.apikey,'public');
});
test('stale save fails without advancing revision and preserves caller data',async()=>{
  const data=fixture();let fail=true,expected=[];
  const db=D.create({url:'https://example.test',key:'public',fetcher:async(u,o)=>{if(!o.method)return response([{revision:4,payload:data}]);expected.push(JSON.parse(o.body).p_expected_revision);return fail?response({code:'40001'},409):response(5);}});
  await db.load();await assert.rejects(db.save(data),/newer Studio changes/);fail=false;await db.save(data);assert.deepEqual(expected,[4,4]);assert.equal(data.formations.length,1);
});
test('missing setup cannot be reported as a successful save',async()=>{
  const db=D.create({url:'https://example.test',key:'public',fetcher:async()=>response({code:'PGRST205'},404)});
  await assert.rejects(db.load(),/setup is required/);await assert.rejects(db.save(fixture()),/Load the database/);
});
test('empty database starts revision zero, while ambiguous save response blocks subsequent retry',async()=>{
  let posts=0;const db=D.create({url:'https://example.test',key:'public',fetcher:async(u,o)=>o.method?(posts++,response(null)):response([])});
  assert.equal(await db.load(),null);await assert.rejects(db.save(fixture()),/not confirmed/);assert.equal(posts,1);
});
test('invalid backups and duplicate match numbers are rejected before network writes',()=>{
  const d=fixture(),m=M.createMatch(1,d.formations);d.matches.push(m,{...structuredClone(m),id:M.id()});assert.throws(()=>D.validate(d),/Invalid match/);
  const bad=fixture();bad.formations[0].slots[0].x=101;assert.throws(()=>D.validate(bad),/position/);
});
