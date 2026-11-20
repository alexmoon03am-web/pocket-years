'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const E=require(path.join(process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../app/src/main/assets'),'engine.js')).PocketEngine;
const game=active=>({version:4,settings:{motion:'system'},archive:[],active});
const copy=g=>E.decodeGame(JSON.parse(JSON.stringify(E.encodeGame(g))));
function clear(l){
  while(E.blocking(l)){
    if(l.sim.review)assert(E.acknowledge(l));
    else if(l.sim.court)assert(E.sim.court(l,'plea'));
    else assert(E.decide(l,0));
  }
}
for(const y of [1199,3001,1200.5,'1200'])assert.throws(()=>E.makeLife({birthYear:y}),RangeError);
for(const [start,era] of [[1200,'medieval'],[1500,'renaissance'],[1700,'industrial'],[1900,'twentieth'],[2000,'digital'],[2050,'future'],[3000,'future']]){
  const l=E.makeLife({birthYear:start,seed:7315});assert.equal(E.calendar(l),start);assert.equal(E.historyWorld.era(start),era);
  assert.equal(l.sim.timeline.historicalRules,true);assert(l.log[0].body.includes(String(start)));
  if(start<2000)assert(!Object.values(l.people).filter(p=>p.met).some(p=>p.job==='Bus driver'));
  const restored=copy(game(l)).active;assert.deepEqual(restored,l);
  for(let i=0;i<8&&!l.ended;i++){
    clear(l);clear(restored);assert(E.advance(l));assert(E.advance(restored));assert.deepEqual(l,restored);
    if(start<1900&&l.event.id)assert(l.event.id.startsWith('era_'));
  }
}
for(const year of [1500,1700,1900,2000,2050]){
  const l=E.makeLife({birthYear:year-1,seed:1343});assert(E.advance(l));
  assert.equal(E.calendar(l),year);
  assert(l.log.some(e=>e.body==='The calendar reached '+year+'.'));
  const after=copy(game(l));assert.deepEqual(after.active,l);
  assert.equal(after.active.log.filter(e=>e.body==='The calendar reached '+year+'.').length,1);
}
const newborn=E.makeLife({seed:45311});
const before=structuredClone(newborn);
const target=E.historyWorld.choices(1350)[0].id;
const options={name:newborn.name,town:target,thread:'atlas',skin:1};
assert.equal(E.customizeBirth(newborn,{...options,birthYear:1100}),false);assert.deepEqual(newborn,before);
assert(E.customizeBirth(newborn,{...options,birthYear:1350}));
assert.equal(newborn.sim.birthplace,target);
for(const [key,p] of Object.entries(newborn.people))assert.equal(p.bornYear-newborn.born,before.people[key].bornYear-before.born);
assert(newborn.log[0].body.includes('1350'));
assert.deepEqual(copy(game(newborn)).active,newborn);
console.log('PASS exact year selection, historical birthplaces, six era starts, all five era boundaries, legacy birth customization and deterministic replay.');
