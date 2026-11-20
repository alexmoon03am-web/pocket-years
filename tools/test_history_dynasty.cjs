'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine,D=E.historyDynasty,W=E.world;
const Saves=require(path.join(base,'save.js')).PocketSaves;
const make=(birthYear=1200)=>E.makeLife({birthYear,town:'kyoto',name:'Ren Kato',seed:51});
const game=active=>({version:4,active,archive:[],settings:{motion:'system'}});
const copy=x=>JSON.parse(JSON.stringify(x));
const store=new Map(),disk=Saves.open({getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},E,'dynasty-test');
function settle(l){
  let count=0;
  while(E.blocking(l)){
    assert(++count<12);
    if(l.sim.review)assert(E.acknowledge(l));
    else if(l.sim.court)assert(E.sim.court(l,'plea'));
    else assert(E.decide(l,0));
  }
}
const family=game(make()),founder=family.active;
founder.cash=400000;settle(founder);
const artifact=D.offers(founder)[0];
assert.equal(D.perform(founder,artifact.id),null);
founder.age=24;
assert(D.perform(founder,artifact.id));assert.equal(founder.cash,400000-artifact.cost);
assert.equal(D.perform(founder,artifact.id),null);
const item=D.items(founder)[0];assert.equal(item.owners[0].name,founder.name);assert.equal(item.origin,E.historyWorld.place('kyoto',1224).label);assert.equal(item.year,1224);
founder.keepsakes.push({title:'A mark on the map',age:20});
const note=D.actions(founder).find(x=>x.id.startsWith('record/award/'));assert(note);assert(D.perform(founder,note.id));assert.equal(D.perform(founder,note.id),null);
assert(W.adopt(founder,'Jun'));founder.age=57;
const costBefore=founder.cash;
const repair=D.actions(founder).find(x=>x.id.startsWith('restore/'));assert(repair);assert(D.perform(founder,repair.id));assert(founder.cash<costBefore);assert.equal(D.items(founder)[0].condition,100);
founder.sim.chronicleWorld={lastYear:1257,events:[{year:1225,title:'Local change',witness:founder.id},{year:1199,title:'Earlier generation',witness:'other'}].map((e,i)=>({...e,id:'event-'+i,town:'kyoto',description:'The local market changed.',kind:'Local simulation'}))};
founder.log.push({age:55,kind:'Year',title:'Annual statement',body:'A quiet year.',diary:'I patched the roof.',delta:{cash:-51}});
const heirProperty=E.historyEconomy.listings(founder).find(q=>q.category==='Property');
const heirNpc=founder.people.kid1;
heirNpc.home='kyoto';heirNpc.homeEquity=800;heirNpc.homeDeed={id:heirProperty.id,listing:heirProperty,value:800,condition:75,share:.2,acquiredYear:1253,town:'kyoto'};
heirNpc.enterprise={name:'Jun Pottery',type:'era-medieval-pottery',capital:4200,initial:3500,founder:heirNpc.fullName,founded:1251,town:'kyoto'};
founder.ended=true;const calendar=E.calendar(founder),child=E.continueAs(founder,'kid1');assert(child);assert.equal(E.calendar(child),calendar);
assert.equal(child.world.owned[heirProperty.id].value,800);assert.equal(Object.values(child.sim.expansion.companies).find(c=>c.name==='Jun Pottery').capital,4200);
assert(E.startNext(family,child));assert.deepEqual(D.items(child)[0].owners.map(x=>x.name),[founder.name,child.name]);assert.equal(D.items(child)[0].owners[1].year,calendar);
assert.equal(D.items(founder)[0].owners.length,1);assert.equal(D.familyArchive(family).length,1);
const archive=family.archive[0];
assert.equal(archive.born,1200);assert.deepEqual(archive.events,['1225 · Local change']);assert.equal(archive.log.at(-1).diary,'I patched the roof.');
assert.deepEqual(D.journal(archive).at(-1).delta,{cash:-51});assert.equal(archive.historicalRules,true);
assert(!archive.sim&&!archive.world&&!archive.people);assert.equal(D.validateArchive(archive),archive);
const saved=disk.exportFile(family);assert.deepEqual(E.encodeGame(disk.importFile(saved)),E.encodeGame(family));
const invalid=copy(E.encodeGame(family));invalid.archive[0].log[0].body=123;assert.equal(disk.importFile(JSON.stringify(invalid)),null);
const other=game(make(2050));other.archive=family.archive;assert.equal(D.familyArchive(other).length,0);
// A donated holding leaves the actual estate; a mortgage or another shareholder blocks the transfer.
const curator=make(1500);curator.age=40;settle(curator);
const property=E.historyEconomy.listings(curator).find(a=>a.category==='Property');property.built=1430;
curator.world.owned[property.id]={listing:property,at:31,acquiredYear:1531,value:2400,share:1,condition:72};
curator.sim.loans[property.id]={balance:300,principal:300};
assert.equal(D.perform(curator,'donate/'+property.id),null);
delete curator.sim.loans[property.id];curator.world.owned[property.id].share=.5;
assert.equal(D.perform(curator,'donate/'+property.id),null);curator.world.owned[property.id].share=1;
const transfer=D.perform(curator,'donate/'+property.id);assert(transfer);assert.equal(transfer.delta.netWorth,-2400);
assert(!curator.world.owned[property.id]);assert.equal(D.perform(curator,'donate/'+property.id),null);
const deed=D.items(curator)[0];assert.equal(deed.category,'Historic properties');assert.equal(deed.createdYear,1430);
assert.equal(deed.year,1531);assert.equal(deed.value,2400);assert.equal(deed.owners[0].year,1531);
// Nine centuries without skipping a birthday. Supply the adoption fee when needed so this
// fixture stresses succession, rather than ending when a household cannot pay for adoption.
const centuries=game(E.makeLife({birthYear:1200,town:'kyoto',seed:3}));
let rites=0,ticks=0;
while(E.calendar(centuries.active)<2100){
  const l=centuries.active,now=E.calendar(l);settle(l);
  if(l.age>=21&&l.age<=95&&E.sim.children(l).length<2){
    l.cash=Math.max(500,l.cash);W.adopt(l,'Heir '+rites);
  }
  if(l.age>=18&&!D.items(l).length){
    const offer=D.offers(l)[0];l.cash=Math.max(offer.cost,l.cash);assert(D.perform(l,offer.id));
  }
  assert(E.advance(l));assert.equal(E.calendar(l),now+1);ticks++;
  if(l.ended){
    const candidates=E.sim.children(l).sort(([,a],[,b])=>Math.abs(E.model.ageOf(l,a)-30)-Math.abs(E.model.ageOf(l,b)-30));
    assert(candidates.length,'Surviving child in '+E.calendar(l));
    const next=E.continueAs(l,candidates[0][0]);assert(next);assert.equal(E.calendar(next),E.calendar(l));
    assert(E.startNext(centuries,next));rites++;
    assert.equal(D.items(next)[0].owners.length,rites+1);
    const roundtrip=disk.inspectFile(disk.exportFile(centuries));assert(roundtrip,'readable save in '+E.calendar(l));
    assert.equal(E.calendar(roundtrip.active),E.calendar(l));assert.equal(roundtrip.archive.length,rites);
  }
}
const archiveBytes=Buffer.byteLength(disk.exportFile(centuries));
assert.equal(ticks,900);assert(rites>10);assert(archiveBytes<2100000,'centuries should fit on a phone: '+archiveBytes);
assert.equal(D.familyArchive(centuries).length,rites);
console.log('PASS family museum, conservation, provenance, time capsules, bequests, corruption handling and '+rites+' successions across '+ticks+' consecutive birthdays ('+archiveBytes+' UTF-8 bytes).');
