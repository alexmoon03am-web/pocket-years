'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets');
const E=require(path.join(dir,'engine.js')).PocketEngine;
const Saves=require(path.join(dir,'save.js')).PocketSaves;
const disk=Saves.open({getItem:()=>null,setItem:()=>{}},E,'faith-tests');
const raw=fs.readFileSync(path.join(__dirname,'fixtures/upgrade-1.0.json'),'utf8');
const legacy=disk.inspectFile(raw);
assert(legacy);
assert.equal(E.calendar(legacy.active),1499);
assert.deepEqual(legacy.active.log,JSON.parse(raw).active.run.log);
function clear(l){
  while(E.blocking(l)){
    if(l.sim.review)assert(E.acknowledge(l));
    else if(l.sim.court)assert(E.sim.court(l,'plea'));
    else assert(E.decide(l,0));
  }
}
clear(legacy.active);assert(E.advance(legacy.active));
assert.equal(E.calendar(legacy.active),1500);
assert(disk.inspectFile(disk.exportFile(legacy)));
const cases=[[1430,'london',null],[1455,'london','type'],[1455,'kyoto',null],[1947,'kyoto','article20'],[2050,'london','orbital']];
for(const [date,place,id] of cases){
  const l=E.makeLife({seed:56,town:place,birthYear:date-18});l.age=18;
  const encounter=E.faithEncounters.current(l);
  assert.equal(encounter?.id||null,id);
  if(id){
    assert(E.faithPerform(l,{group:'encounter',id:'help'}));
    assert.equal(l.keepsakes.at(-1).title,encounter.artifact);
    assert.equal(E.faithPerform(l,{group:'encounter',id:'help'}),null);
  }
}
const founder=E.makeLife({seed:26084,birthYear:1230,town:'london',name:'Rowan Vale',faithId:'exploring'});
founder.age=20;
const charter={...E.faithMovements.defaultDraft(founder),name:'The Open Table',teachings:'Make room at meals.'};
const founding=E.faithPerform(founder,{group:'found',payload:charter});
assert(founding);
const id=founding.movementId;
const game={version:4,active:founder,archive:[],settings:{motion:'reduced'}};
let ticks=0,successions=0,maximum=0;
while(E.calendar(game.active)<2051){
  const l=game.active;clear(l);
  if(l.ended){
    const heirs=E.sim.children(l).sort((a,b)=>Math.abs(E.sim.ageOf(l,a[1])-30)-Math.abs(E.sim.ageOf(l,b[1])-30));
    assert(heirs.length,'Test family lost all surviving heirs at '+E.calendar(l));
    const child=E.continueAs(l,heirs[0][0]);assert(child);
    assert.equal(E.calendar(child),E.calendar(l));
    assert.notEqual(child.sim.faithWorld,l.sim.faithWorld);
    assert(E.startNext(game,child));
    const encoded=disk.exportFile(game),roundtrip=disk.inspectFile(encoded);
    assert(roundtrip,'Unreadable faith save after succession in '+E.calendar(child));
    assert.deepEqual(roundtrip.active.sim.faithWorld,child.sim.faithWorld);
    maximum=Math.max(maximum,encoded.length);successions++;continue;
  }
  // Keep the fixture supplied with adoptees, independent of household cash flow.
  if(l.age>=20&&E.sim.children(l).length<3){
    l.cash=Math.max(l.cash,100000);E.world.adopt(l,'Heir '+successions);
  }
  assert(E.advance(l));ticks++;
  const m=E.faithMovements.get(l,id);
  assert.equal(m.original.teachings,charter.teachings);
  assert.equal(m.original.foundedYear,1250);
  assert(m.history.some(h=>h.kind==='found'));
  assert(Number.isSafeInteger(E.faithMovements.followers(m)));
  assert(E.faithMovements.followers(m)>=0);
}
assert.equal(ticks,801);assert(successions>=8);
const restored=disk.inspectFile(disk.exportFile(game));
assert(restored);
const malformed=JSON.parse(JSON.stringify(E.encodeGame(game)));
malformed.active.run.simulation.faithWorld.movements[id].treasury=-1;
assert.equal(disk.inspectFile(JSON.stringify(malformed)),null);
console.log('PASS v1.0 migration, historical encounters, founder charter and '+successions+' successions over '+ticks+' annual ticks; peak checkpoint '+maximum+' characters.');
