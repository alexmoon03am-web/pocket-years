'use strict';
const {expectedLegacySnapshot}=require('./legacy_projection.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,base}=require('./interface_host.cjs');
const E=require(path.join(base,'engine.js')).PocketEngine,W=E.world,S=E.sim;
const Saves=require(path.join(base,'save.js')).PocketSaves,K='studio.pocketyears.save.v1';
const game=l=>({active:l,archive:[],settings:{motion:'reduced'}});
const pack=l=>E.encodeGame(game(l)),clone=o=>JSON.parse(JSON.stringify(o)),resume=l=>E.decodeGame(clone(pack(l))).active;
const oldSave=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/upgrade-0.8.0-pet.json'),'utf8'));
function adult(seed=1964){
  const l=E.makeLife({seed,name:'Jo Lake',town:'cedar'});
  Object.assign(l,{age:24,track:'work',job:'clerk',cash:6600});
  E.year.workplace(l);E.year.campus(l);return l;
}
function noChange(l,command){const before=JSON.stringify(l);assert.equal(command(),null);assert.equal(JSON.stringify(l),before);}
function settle(l){while(E.blocking(l)){if(l.sim.review)E.acknowledge(l);else if(l.sim.court)S.court(l,'plea');else E.decide(l,0);}}

assert.equal(S.petBreeds.dog.length,57);assert.equal(S.petBreeds.cat.length,43);
for(const type of ['dog','cat']){
  const breeds=S.petBreeds[type];
  assert.equal(new Set(breeds).size,breeds.length);assert.equal(breeds[0],'Mixed-breed '+type);
  const original=adult(),beforeUpkeep=S.budget(original).upkeep,states=new Set();
  for(const breed of breeds){
    const l=resume(original),n=l.log.length;
    const outcome=S.perform(l,'pet-'+type,{name:'  Pickle  ',breed});
    assert(outcome,breed);assert.equal(l.sim.pet.name,'Pickle');assert.equal(l.sim.pet.breed,breed);
    assert.equal(l.sim.pet.type,type);assert.equal(l.log.length,n+1);assert(l.log[n].body.includes(breed));
    assert.equal(l.cash,original.cash-80);assert.equal(S.budget(l).upkeep-beforeUpkeep,95);assert.equal(l.sim.pet.years,0);
    assert(l.sim.pet.lifespan>=10&&l.sim.pet.lifespan<=17);states.add(l.rng+'/'+l.sim.pet.lifespan);
    assert.deepEqual(resume(l).sim.pet,l.sim.pet);noChange(l,()=>S.perform(l,'pet-dog',{breed:'Beagle'}));
  }
  assert.equal(states.size,1,'Breed selection or browsing consumed extra RNG');
  for(const input of [null,42,{},[],{breed:'Unknown'},{breed:S.petBreeds[type==='dog'?'cat':'dog'][1]},{name:{},breed:breeds[1]}]){
    const l=adult();noChange(l,()=>S.perform(l,'pet-'+type,input));
  }
  const oldCaller=adult();assert(S.perform(oldCaller,'pet-'+type,'Tiny'));assert.equal(oldCaller.sim.pet.breed,breeds[0]);assert.equal(oldCaller.sim.pet.name,'Tiny');
  const surprise=adult();assert(S.perform(surprise,'pet-'+type,{breed:breeds[2]}));assert.equal(surprise.sim.pet.name,type==='cat'?'Olive':'Pepper');
  assert(S.perform(surprise,'play-pet'));const pet=surprise.sim.pet;pet.years=pet.lifespan-1;S.birthday(surprise);assert.equal(surprise.sim.pet,null);
  assert(surprise.log.some(r=>r.title==='Goodbye to '+pet.name&&r.body.includes(pet.breed)));
}
for(const makeUnavailable of [l=>{l.age=17;},l=>{l.cash=79;},l=>{l.sim.prison=1;},l=>{l.ended=true;},l=>{l.event={id:'lost-wallet',resolved:false};}]){
  const l=adult();makeUnavailable(l);noChange(l,()=>S.perform(l,'pet-dog',{name:'Biscuit',breed:'Beagle'}));
}
const oldGame=E.decodeGame(clone(oldSave));assert.deepEqual(E.encodeGame(oldGame),expectedLegacySnapshot(E,oldSave));
const oldDog=oldGame.active,oldPet=clone(oldDog.sim.pet),oldCash=oldDog.cash,oldRng=oldDog.rng;
assert(!oldPet.breed);assert(S.options(oldDog,'pets').some(a=>a.id==='record-pet-breed'&&!a.reason));
noChange(oldDog,()=>S.perform(oldDog,'record-pet-breed','Bengal'));
assert(S.perform(oldDog,'record-pet-breed','Beagle'));assert.deepEqual(oldDog.sim.pet,{...oldPet,breed:'Beagle'});
assert.equal(oldDog.cash,oldCash);assert.equal(oldDog.rng,oldRng);noChange(oldDog,()=>S.perform(oldDog,'record-pet-breed','Pug'));
assert(!S.options(oldDog,'pets').some(a=>a.id==='record-pet-breed'));
const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
const disk=Saves.open(storage,E,K);assert(disk.importFile(JSON.stringify(oldSave)));
const exported=disk.exportFile(oldGame);assert.equal(disk.importFile(exported).active.sim.pet.breed,'Beagle');
const damaged=clone(E.encodeGame(oldGame));damaged.active.run.simulation.pet.breed='Siamese';
const beforeBad=memory.get(K);assert.equal(disk.importFile(JSON.stringify(damaged)),null);assert.equal(memory.get(K),beforeBad);
console.log('PASS all 100 species-specific breed choices, adoption fees, care costs, seeded lifespans, labels in journal and backup, prior name-only calls and authentic 0.8.0 pets.');

const group=adult(),carer=group.people.carer;group.stats.bonds=25;group.stats.joy=30;carer.bond=96;
const cappedKey=Object.keys(group.people).find(k=>k!=='carer'&&group.people[k].met&&group.people[k].active);
for(let i=0;i<3;i++)assert(E.visit(group,cappedKey));
const beforeQuery=JSON.stringify(group),eligible=W.visitPlan(group).keys;
assert(eligible.includes('carer')&&!eligible.includes(cappedKey));assert.equal(JSON.stringify(group),beforeQuery);
assert(eligible.some(k=>group.people[k].role==='Coworker'));
const manual=resume(group),startingLog=group.log.length,startingRng=group.rng,startingCash=group.cash;
for(const key of eligible)assert(E.visit(manual,key));
const total=W.visitAll(group);assert.equal(total.count,eligible.length);assert(group.log.at(-1).body.includes(String(eligible.length)));
assert.equal(group.log.length,startingLog+1);assert.equal(carer.bond,100);assert(carer.memories.some(m=>m.act==='visit'));
assert.deepEqual(group.people,manual.people);assert.deepEqual(group.stats,manual.stats);assert.deepEqual(group.used,manual.used);
assert.equal(group.cash,startingCash);assert.equal(group.rng,startingRng);assert.deepEqual(resume(group).people,group.people);
assert(W.visitAll(group));assert(W.visitAll(group));assert(W.visitPlan(group).reason);noChange(group,()=>W.visitAll(group));
assert.equal(E.visit(group,'carer'),null);assert(E.advance(group));settle(group);assert(W.visitPlan(group).keys.length>0);
const school=adult();school.age=12;E.year.campus(school);
assert(W.visitPlan(school).keys.some(k=>school.people[k].role==='Classmate'));
const isolates=adult(),originalKeys=W.visitPlan(isolates).keys;
const skip={deceased:{diedAt:18,active:true},unmet:{met:false},inactive:{active:false},estranged:{cutOff:true}};
for(const [key,fields] of Object.entries(skip))isolates.people[key]={...clone(isolates.people.carer),id:'test-'+key,...fields};
isolates.people.alias={...clone(isolates.people.carer)};
assert.deepEqual(W.visitPlan(isolates).keys,originalKeys);
const ignore=Object.fromEntries(Object.keys(skip).map(k=>[k,clone(isolates.people[k])]));
W.visitAll(isolates);for(const [k,p] of Object.entries(ignore))assert.deepEqual(isolates.people[k],p);
for(const k of Object.keys(skip))assert.equal(E.visit(isolates,k),null);
for(const l of [Object.assign(adult(),{ended:true}),Object.assign(adult(),{event:{id:'lost-wallet',resolved:false}})]){
  noChange(l,()=>W.visitAll(l));assert(W.visitPlan(l).reason);
}
const nobody=adult();for(const p of Object.values(nobody.people))p.active=false;
assert(W.visitPlan(nobody).reason);noChange(nobody,()=>W.visitAll(nobody));
const jailed=adult();jailed.sim.prison=2;
assert.match(E.visit(jailed,'carer').title,/Supervised visit/);
assert.deepEqual(W.socialOptions(jailed,'carer').map(o=>o.id),['visit']);
noChange(jailed,()=>W.visitAll(jailed));
for(const action of ['askout','propose','marry','gift','study-pair','talk']){
  noChange(jailed,()=>W.social(jailed,'carer',action));
}
noChange(jailed,()=>S.perform(jailed,'friend'));
noChange(jailed,()=>E.expansion.perform(jailed,'family','','holiday'));
jailed.sim.prison=0;assert(W.visitAll(jailed));
assert(W.socialOptions(jailed,'carer').some(o=>o.id==='talk'));
console.log('PASS one journal entry per bulk visit, exact equivalence with individual visits, trust and loyalty, eligibility, repeat limits, birthday reset and pending-decision guards.');

const inline=fs.readFileSync(process.env.POCKET_PREVIEW||path.join(__dirname,'../build/Pocket-Years-Play.html'),'utf8');
const scripts=[...inline.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);assert(scripts.length>0);
const mem=l=>new Map([[K,JSON.stringify(pack(l))]]);
const internal=u=>E.decodeGame(u.state()).active;
function click(u,act,key){u.click(act,key);u.flushBack();u.tick();}
function openPets(u){click(u,'tab','activities');click(u,'sheet','hub-pets');}
for(const edition of [undefined,scripts]){
  const l=adult(),u=start(mem(l),{scripts:edition,asyncBack:true});openPets(u);click(u,'sheet','do-pet-dog');
  assert(u.el('confirm-pet').disabled);assert.equal(u.el('pet-breed').children.length,58);assert(!u.el('pet-breed').textContent.includes('Siamese'));
  const desc=u.el('confirm-pet').querySelector('img').getAttribute('src');assert(edition?desc.startsWith('data:image/png;'):desc==='art/dog.png');
  u.input('pet-name','Pepper Bean');u.input('breed-filter','  FRISE ');assert.equal(u.el('pet-breed').children.length,2);assert(u.el('pet-breed').textContent.includes('Bichon Frisé'));
  assert.equal(u.el('pet-breed').value,'Bichon Frisé');assert(!u.el('confirm-pet').disabled);assert.equal(internal(u).sim.pet,null);
  u.input('breed-filter','snowshoe');assert(u.el('confirm-pet').disabled);assert(u.el('pet-breed').textContent.includes('No matching breeds'));
  const unchanged=JSON.stringify(u.state());u.submit('pet-form');assert.equal(JSON.stringify(u.state()),unchanged);
  u.input('breed-filter','golden');u.change('pet-breed','Golden Retriever');assert.equal(u.el('pet-name').value,'Pepper Bean');
  u.submit('pet-form');u.flushBack();u.tick();assert.equal(internal(u).cash,l.cash-80);assert.equal(internal(u).sim.pet.breed,'Golden Retriever');
  click(u,'sheet','hub-pets');assert(u.visible().textContent.includes('Golden Retriever')&&u.visible().textContent.includes('Pepper Bean'));
  assert(!u.button('sheet','do-record-pet-breed'));assert(u.button('sheet','do-pet-cat').disabled);click(u,'close');
  click(u,'tab','people');const single=W.visitPlan(internal(u)).keys.length,button=u.button('visit-all'),log=internal(u).log.length;
  assert(button&&button.textContent.includes(String(single)));click(u,'visit-all');u.dispatch(button);u.tick();
  assert.equal(internal(u).log.length,log+1);assert.equal(internal(u).used.filter(k=>k==='visit-carer').length,1);
  click(u,'visit-all');click(u,'visit-all');assert(u.button('visit-all').disabled);
  const fresh=start(u.store,{scripts:edition,hash:'#people'});assert(fresh.button('visit-all').disabled);assert.equal(internal(fresh).sim.pet.name,'Pepper Bean');
  const restored=start(new Map([[K,JSON.stringify(oldSave)]]),{scripts:edition,asyncBack:true});openPets(restored);
  assert(restored.visible().textContent.includes('Breed unrecorded'));click(restored,'sheet','do-record-pet-breed');assert(!restored.el('pet-name'));
  restored.change('pet-breed','Samoyed');restored.submit('pet-form');restored.flushBack();restored.tick();
  assert.deepEqual(internal(restored).sim.pet,{...oldPet,breed:'Samoyed'});assert.equal(internal(restored).cash,oldCash);
  const kitten=start(mem(adult()),{scripts:edition});openPets(kitten);click(kitten,'sheet','do-pet-cat');assert.equal(kitten.el('pet-breed').children.length,44);
  kitten.input('breed-filter','maine');kitten.change('pet-breed','Maine Coon');kitten.submit('pet-form');kitten.tick();
  assert.equal(internal(kitten).sim.pet.breed,'Maine Coon');assert.equal(internal(kitten).sim.pet.name,'Olive');
}
console.log('PASS Android and standalone UI paths for breed filtering, naming, adoption, existing pets, double taps, group actions, autosaves and restored visit limits.');
