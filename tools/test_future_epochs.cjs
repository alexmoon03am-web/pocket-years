'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const dir=process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets');
const E=require(path.join(dir,'engine.js')).PocketEngine,H=E.historyEconomy,W=E.historyWorld;
const F=require(path.join(dir,'future-epochs.js')).PocketFuture,U=require(path.join(dir,'era-ui.js'));
const storage=new Map();
const saves=require(path.join(dir,'save.js')).PocketSaves.open({
  getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)
},E,'future-test');
function make(y){
  const l=E.makeLife({seed:5274,birthYear:y-24,town:'london'});
  l.age=24;l.cash=Math.round(2000000*H.profile(l).home);l.sim.timeline.training=5;l.sim.workYears=5;
  return l;
}
function act(l,area,id){const result=E.historyPerform(l,area,id);assert(result,area+'/'+id);return result;}
function roundTrip(l,lock='auto'){
  const game={version:4,active:l,archive:[],settings:{motion:'reduced',theme:lock}};
  const restored=saves.inspectFile(saves.exportFile(game));
  assert(restored,'exported future save must pass strict import');assert.equal(restored.settings.theme,lock);
  return restored.active;
}
const runs=[];
for(const [y,id,activity] of [[2080,'future','lab'],[2200,'planetary','reclaim'],[3000,'stellar','starclass']]){
  const l=make(y),p=H.profile(l);assert.equal(p.period,id);assert.equal(U.themeForYear(y),id);
  const quote=E.sim.moveFare(l,'bristol');
  const local=W.place(l.town,y),initialBudget=E.sim.budget(l);
  const jobs=H.actions(l,'work').filter(a=>!a.reason&&a.id.startsWith('job-'));
  assert(jobs.length>=3);act(l,'work',jobs[0].id);assert(E.sim.budget(l).wages>0);
  const lesson=H.actions(l,'school')[0];act(l,'school',lesson.id);
  act(l,'activities',activity);assert.equal(E.historyPerform(l,'activities',activity),null);
  l.sim.injuries.push({id:'test-sprain',name:'Sprain',severity:48,years:1});act(l,'activities','clinic');
  assert(l.sim.injuries[0].treated);assert(l.sim.injuries[0].severity<48);
  const listings=H.listings(l);assert(listings.every(a=>H.validListing(a.id,a)));
  const home=listings.find(a=>a.category==='Property'&&!a.commercial);assert(home);
  const productive=listings.find(a=>F.contracts[id].types.includes(a.type));assert(productive);
  assert(initialBudget.housing>0);act(l,'market',home.id);assert.equal(E.sim.budget(l).housing,0);
  act(l,'market',productive.id);const held=l.world.owned[productive.id],condition=held.condition;
  const contract=act(l,'activities','supply-order');assert(contract.delta.cash>0);assert.equal(held.condition,condition-4);
  const firm=H.actions(l,'business').find(a=>a.id.startsWith('open-')&&!a.reason);act(l,'business',firm.id);
  assert(E.expansion.businessYear(l).rows[0].revenue>0);
  const before=l.cash;assert(E.sim.relocate(l,'bristol'));
  assert.equal(l.cash,before-quote);assert.equal(held.town,'london');assert(E.sim.budget(l).housing>0);
  const loaded=roundTrip(l,'planetary');assert.equal(loaded.town,'bristol');
  assert.deepEqual(loaded.world.owned,l.world.owned);assert.deepEqual(loaded.sim.expansion.companies,l.sim.expansion.companies);
  runs.push({jobs:jobs.map(a=>a.id),listings:listings.map(a=>a.type),firm:firm.id,lesson:lesson.title,clinic:l.sim.injuries[0].severity,
    industry:local.industry,route:local.transport,fare:quote,housing:p.housing,food:p.food});
}
for(let i=1;i<runs.length;i++){
  const old=runs[i-1],next=runs[i];
  assert(!next.jobs.some(k=>old.jobs.includes(k))&&!next.listings.some(k=>old.listings.includes(k)));
  for(const key of ['firm','lesson','clinic','industry','route','housing','food'])assert.notEqual(next[key],old[key],key);
  assert(next.fare<old.fare);
}
for(const y of [2150,2500]){
  const l=make(y-1),prior=H.listings(l)[0];act(l,'market',prior.id);
  const company=H.actions(l,'business').find(a=>a.id.startsWith('open-'));act(l,'business',company.id);
  const firm=Object.values(l.sim.expansion.companies)[0],oldType=firm.type;
  assert(E.advance(l));assert.equal(E.calendar(l),y);
  assert.equal(U.activeTheme(l,'auto'),F.chapter(y).theme);assert.equal(U.activeTheme(l,'future'),'future');
  const shock=W.activeEvents(l,l.town,y).find(e=>e.id==='future-'+y);
  assert(shock&&shock.kind==='Future fiction');assert.notEqual(W.marketEffects(l,l.town,y).pay,1);
  assert.equal(l.sim.chronicleWorld.events.filter(e=>e.id===shock.id).length,1);
  const before=JSON.stringify(l);assert.deepEqual(W.annual(l,{}),[]);assert.equal(JSON.stringify(l),before);
  assert.equal(l.world.owned[prior.id].listing.id,prior.id);assert.equal(firm.type,oldType);
  assert(H.validListing(prior.id,prior));assert(roundTrip(l).world.owned[prior.id]);
}
// v1.1 offered the original future inventory even in the year 3000.
const old=make(2080),deed=H.listings(old)[0];act(old,'market',deed.id);
const oldHolding=old.world.owned[deed.id],newId=deed.id.replace('_2080_','_3000_');
old.born=2976;delete old.world.owned[deed.id];old.world.owned[newId]=oldHolding;
Object.assign(oldHolding.listing,{id:newId,listedYear:3000,built:2990});
assert(roundTrip(old).world.owned[newId]);
console.log('PASS 2080/2200/3000 gameplay, two birthday boundaries, old future deeds, medical care, fares, supply contracts and single settlement of breakthroughs.');
