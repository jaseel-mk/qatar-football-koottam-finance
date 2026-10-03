const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
test('Finance navigation serves a built module with relative assets and return navigation', () => {
 assert.match(fs.readFileSync('index.html','utf8'), /href="matchday\/index.html"/);
 const page=fs.readFileSync('matchday/index.html','utf8');
 assert.match(page, /src="\.\/config.js"/);
 const refs=[...page.matchAll(/(?:src|href)="(\.\/assets\/[^\"]+)"/g)].map(m=>m[1]);
 assert.ok(refs.length>=2);
 refs.forEach(ref=>assert.ok(fs.existsSync(path.join('matchday',ref)),ref));
 const code=fs.readFileSync(path.join('matchday',refs.find(ref=>ref.endsWith('.js'))),'utf8');
 assert.ok(code.includes('../index.html'));
 assert.ok(code.includes('Add Players to Lineup'));
 assert.ok(code.includes('data-lineup-target'));
 assert.ok(fs.existsSync('studio/model.js'));
});
test('All 16 presets include one goalkeeper and the expected player count', () => {
 const sql=fs.readFileSync('migrations/matchday-general-formations.sql','utf8');
 const blocks=sql.split('DO $$').slice(1);
 assert.equal(blocks.length,16);
 for(const block of blocks){
  const [,size,code]=block.match(/SELECT '(\d)-a-side — ([\d-]+)'/);
  assert.equal(code.split('-').map(Number).reduce((a,b)=>a+b,1),Number(size));
  assert.equal([...block.matchAll(/\(formation_id, '/g)].length,Number(size));
  assert.equal([...block.matchAll(/\(formation_id, 'GK'/g)].length,1);
 }
});
