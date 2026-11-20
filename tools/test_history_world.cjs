'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const base=process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets');
const W=require(path.join(base,'history-world.js')).PocketHistoryWorld;
const G=require(path.join(base,'geography.js')).PocketGeography;
const E=require(path.join(base,'engine.js')).PocketEngine;

for(const [y,e] of [[1200,'medieval'],[1499,'medieval'],[1500,'renaissance'],[1699,'renaissance'],[1700,'industrial'],[1899,'industrial'],[1900,'twentieth'],[1999,'twentieth'],[2000,'digital'],[2049,'digital'],[2050,'future'],[7000,'future']])assert.equal(W.era(y),e);
const tokyo='n1159151609',mexico='n1159151587',istanbul='n1159151579',warrane='n1159151623';
assert.equal(W.available(mexico,1324),false);
assert.equal(W.available(mexico,1325),true);
assert.equal(W.place(mexico,1500).city,'Tenochtitlan');
assert.equal(W.place(mexico,1522).city,'Mexico City');
assert.equal(W.place(istanbul,1452).country,'Byzantine Empire');
assert.equal(W.place(istanbul,1453).country,'Ottoman Empire');
assert.equal(W.place(tokyo,1867).city,'Edo');
assert.equal(W.place(tokyo,1868).city,'Tokyo');
assert.equal(W.place(warrane,1200).city,'Warrane');
assert.equal(W.place(warrane,1800).city,'Sydney');
assert(W.choices(1200).every(p=>G.cities[p.id]&&W.available(p.id,1200)&&p.country&&p.industry&&p.transport));
assert.equal(new Set(W.choices(1200).map(p=>p.region)).size,9);
assert.equal(W.choices(2000).length,G.realCount+3);
assert(!W.available('__proto__',1800));
assert.equal(W.place('absent',2026),null);
assert(W.nearby('london',1200).every(id=>id!=='london'&&W.region(id)==='europe'));
assert(W.place('london',1348).populationIndex<W.place('london',1347).populationIndex);
assert(W.place('london',1864).transport.includes('rail'));
assert.notEqual(W.place('london',2050).government,W.place('london',2300).government);
assert.notEqual(W.place('london',2050).industry,W.place('london',2500).industry);

const copy=x=>JSON.parse(JSON.stringify(x));
function life(town,born,age,seed=561){
  const l=E.makeLife({name:'Jo Waters',seed,birthYear:born,town});
  l.age=age;l.cash=4000;l.event=null;l.sim.review=null;l.used=[];
  return l;
}
const ctx={
  apply(l,d){
    const actual={};
    for(const [k,n] of Object.entries(d)){
      if(k==='cash'){l.cash+=n;actual.cash=n;}
      else{const old=l.stats[k];l.stats[k]=Math.max(0,Math.min(100,old+n));actual[k]=l.stats[k]-old;}
    }
    return actual;
  },
  log(l,kind,title,body,delta){l.log.push({age:l.age,kind,title,body,delta});}
};
const l=life('london',1644,22),company={town:'london',capital:1000};
l.sim.expansion.companies.fireTest=company;
l.world.owned.local={condition:90,value:500,town:'london'};
l.world.owned.abroad={condition:90,value:500,town:tokyo};
const market=W.marketEffects(l);
assert(market.cost>1&&market.home<1);
assert(W.annual(l,ctx).some(e=>e.id==='londonFire'));
assert.equal(l.world.owned.local.condition,73);
assert.equal(l.world.owned.abroad.condition,90);
assert.equal(company.capital,940);
assert(l.sim.chronicleWorld.events.some(e=>e.year===1666&&e.witness===l.id&&e.kind==='Historical record'&&e.source.startsWith('https://')));
const once=copy(l);
assert.deepEqual(W.annual(l,ctx),[]);assert.deepEqual(l,once);
const far=life('kyoto',1644,22);
assert(W.annual(far,ctx).every(e=>e.id!=='londonFire'));
const imm=life('london',1210,25),child={name:'Kit Waters',role:'Child',id:'kid',met:true,bornYear:1231,bornAt:21,active:true,bond:70};
imm.people.testKid=child;
imm.world.owned.estate={town:'london',condition:98,value:400};
const q=W.quote(imm,'bristol');
assert.equal(q.reason,'');assert(q.cost>0);
assert(W.quote(imm,warrane).reason.includes('route'));
assert.equal(W.move(imm,warrane,ctx),null);
const prevCash=imm.cash;const moved=E.sim.relocate(imm,'bristol');
assert(moved);assert.equal(imm.cash,prevCash-q.cost);assert.equal(imm.town,'bristol');
assert.equal(child.town,'bristol');assert.equal(child.birthTown,'london');
assert.equal(imm.world.owned.estate.town,'london');
assert.equal(imm.sim.residences.at(-1).from,'london');
assert(W.quote(imm,'london').reason);
const sameAfter=copy(imm);assert.equal(W.move(imm,'london',ctx),null);assert.deepEqual(imm,sameAfter);

const long=life('london',1200,0),twin=copy(long);
for(const sim of [long,twin]){
  for(let year=1201;year<=3800;year++){sim.age=year-sim.born;W.annual(sim,ctx);}
}
assert.deepEqual(long.sim.chronicleWorld,twin.sim.chronicleWorld);
assert.equal(long.sim.chronicleWorld.lastYear,3800);
assert(long.sim.chronicleWorld.events.length<=180&&long.sim.chronicleWorld.events.some(e=>e.kind==='Future fiction'));
assert.equal(long.sim.chronicleWorld.events.length,new Set(long.sim.chronicleWorld.events.map(e=>e.id)).size);
W.validate(long);
assert.throws(()=>W.validate({born:1200,age:1,sim:{chronicleWorld:{events:[],lastYear:1500}}}),/historical world/);
const playable=life('london',1643,22);
assert(E.advance(playable));
assert.equal(playable.sim.chronicleWorld.events.filter(e=>e.id==='londonFire').length,1);
const restored=E.decodeGame(E.encodeGame({active:playable,archive:[],settings:{}})).active;
assert.deepEqual(restored.sim.chronicleWorld,playable.sim.chronicleWorld);
console.log('Historical geography, regional events, damages, relocation, dates and 2,600 years of local history passed.');
