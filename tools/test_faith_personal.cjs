'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const dir=process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets');
const E=require(path.join(dir,'engine.js')).PocketEngine;
const P=E.faithPersonal;
const start=(faithId='catholic',year=1250)=>E.makeLife({seed:14758,name:'Ari Field',town:'london',birthYear:year,faithId});
const act=(l,group,id)=>E.faithPerform(l,{group,id});
function clear(l){
  while(E.blocking(l)){
    if(l.sim.review)assert(E.acknowledge(l));
    else if(l.sim.court)assert(E.sim.court(l,'plea'));
    else assert(E.decide(l,0));
  }
}
function birthday(l){clear(l);assert(E.advance(l));clear(l);}
function roundTrip(l){
  return E.decodeGame(JSON.parse(JSON.stringify(E.encodeGame({version:4,active:l,archive:[]})))).active;
}
const inherited=start('family'),explorer=start('exploring'),chosen=start(),unaffiliated=start('unaffiliated');
assert.equal(P.profile(inherited).backgroundChoice,'family');
assert(['carer','parent2'].some(k=>P.npc(inherited,k)?.id===P.profile(inherited).id));
assert.equal(P.profile(explorer).status,'questioning');
assert.equal(P.profile(unaffiliated).id,'unaffiliated');
assert.equal(P.profile(chosen).originalId,'catholic');
assert.equal(chosen.rng,explorer.rng);
assert(!P.birthOptions(1500,'london').some(r=>r.id==='protestant'));
assert(P.birthOptions(1517,'london').some(r=>r.id==='protestant'));
assert.throws(()=>start('protestant',1500),RangeError);
assert.equal(act(chosen,'practice','prayer'),null);
assert.equal(P.customize(chosen,{faithId:'exploring'}),true);
assert.equal(P.profile(chosen).backgroundChoice,'exploring');

const life=start('sunni',1980);
life.age=18;life.cash=2000;
const initial=JSON.stringify(life);
for(const group of ['practice','career','family','belief'])P.actions(life,group);
P.profile(life);P.npc(life,'carer');assert.equal(JSON.stringify(life),initial);
assert(act(life,'practice','fast'));
const prayer=act(life,'practice','prayer');
assert.equal(prayer.delta.devotion,5);assert.equal(prayer.delta.conviction,1);
assert.equal(act(life,'practice','prayer'),null);assert(act(life,'practice','enroll'));
assert.equal(P.profile(life).openHouse,true);
const cash=life.cash,gift=act(life,'practice','charity');assert(gift.delta.cash<0);
assert.equal(life.cash,cash+gift.delta.cash);assert.equal(life.sim.faith.service,1);
assert(act(life,'practice','study'));assert(act(life,'practice','service'));
assert(act(life,'career','train'));
assert.equal(act(life,'career','take-faith-sunni-leadership-3'),null);
assert(act(life,'career','take-faith-community-assistant'));
const initialPay=E.sim.budget(life).wages;
assert(initialPay>0);assert.equal(initialPay,P.wage(life,life.job));
assert.equal(E.jobs[life.job][0],'Community assistant');
assert(act(life,'career','duty'));
birthday(life);assert.equal(life.sim.faith.experience,1);
for(let attempts=0;attempts<3&&life.sim.faith.knowledge<24;attempts++){
  act(life,'practice','study');act(life,'career','train');birthday(life);
}
const post='take-faith-sunni-service-1';
for(let years=0;years<5&&P.actions(life,'career').find(r=>r.id===post).reason;years++){
  for(const action of ['gather','service','study'])act(life,'practice',action);
  act(life,'career','duty');act(life,'career','train');birthday(life);
}
assert(act(life,'career',post));assert(P.wage(life,life.job)>0);
assert(act(life,'belief','status-questioning'));
assert(act(life,'belief','join-unaffiliated'));
assert.equal(life.job,null);assert.equal(life.sim.faith.openHouse,false);
assert.equal(E.sim.budget(life).wages,0);assert.equal(life.sim.faith.originalId,'sunni');
assert(!P.actions(life,'practice').some(r=>r.id==='fast'));
assert.equal(act(life,'belief','join-judaism'),null);
assert.deepEqual(roundTrip(life).sim.faith,life.sim.faith);

const family=start();family.age=27;family.cash=5000;
const carer=family.people.carer;carer.faith.id='judaism';const bond=carer.bond;
assert(act(family,'family','press-carer'));assert(carer.bond<bond&&carer.faith.tension>0);
assert.equal(act(family,'family','listen-carer'),null);
birthday(family);assert(act(family,'family','listen-carer'));assert.equal(carer.faith.tension,0);
assert.equal(carer.faith.id,'judaism');
family.age=35;family.cash=50000;
assert(E.world.adopt(family,'River'));
const [key,child]=E.sim.children(family)[0];
assert(act(family,'family','upbringing-open'));
assert.equal(child.faith.status,'questioning');
assert(act(family,'family','welcome-'+key));
assert.equal(act(family,'family','welcome-'+key),null);
carer.diedAt=family.age;carer.active=false;
assert(act(family,'family','funeral-carer'));assert.equal(act(family,'family','funeral-carer'),null);
child.faith.id='judaism';
family.ended=true;const next=E.continueAs(family,key);
assert.equal(P.profile(next).id,'judaism');
assert.equal(next.sim.faith.originalId,'judaism');
assert(!next.sim.faith.history.length);
const late=Object.values(next.people).find(p=>p.id===family.id);
assert(late&&P.npc(next,late).id==='catholic');

const founder=start('exploring');founder.age=25;
const founded=E.faithPerform(founder,{group:'found',payload:{...E.faithMovements.defaultDraft(founder),name:'Harbor Circle',ceremonies:'Read names from the harbor roll',holidays:'Lantern Day'}});
assert(founded&&founder.sim.faith.id===founded.movementId);
const observance=act(founder,'practice','rite-gathering');assert(observance.title.includes('harbor roll'));
assert(act(founder,'practice','holiday-0').title.includes('Lantern Day'));
const legacy=start();delete legacy.sim.faith;
for(const p of Object.values(legacy.people))delete p.faith;
const beforeView=JSON.stringify(legacy);
assert.equal(P.profile(legacy).id,'unaffiliated');assert.equal(P.npc(legacy,'carer').id,'unaffiliated');
assert.equal(JSON.stringify(legacy),beforeView);
const seed=legacy.rng;legacy.age=14;
assert(act(legacy,'practice','reflect'));assert.equal(legacy.rng,seed);P.validate(legacy);
const corrupted=structuredClone(legacy);corrupted.sim.faith.conviction=450;
assert.throws(()=>P.validate(corrupted));
const worker=start();worker.age=20;
const w=worker.people.carer;w.faith={id:'catholic',status:'practicing',devotion:57,involvement:60,knowledge:60,conviction:48};w.bornYear=worker.born-20;
const copy=structuredClone(worker),ctx={log(){}};
for(let k=0;k<20;k++){
  worker.age++;copy.age++;P.annual(worker,ctx);P.annual(copy,ctx);
  const state=JSON.stringify(worker.sim.faith);P.annual(worker,ctx);assert.equal(JSON.stringify(worker.sim.faith),state);
}
assert.deepEqual(worker.people,copy.people);assert.equal(worker.rng,copy.rng);
const appointed=start();appointed.age=21;
const employee=appointed.people.carer;employee.bornYear=appointed.born-5;
employee.career='faith-community-assistant';employee.job=E.jobs[employee.career][0];
employee.faith={id:'catholic',status:'practicing',devotion:70,knowledge:75,involvement:65,conviction:60};
const wealth=employee.wealth;
for(let years=0;years<22;years++){appointed.age++;P.annual(appointed,ctx);}
assert(employee.faith.serviceYears>=22&&employee.wealth>wealth);
assert(P.role(employee.career).level>=1);
console.log('PASS birth choice, regional and dated beliefs, practice, conversion, paid ministry, family ceremonies and trust, successor identity, NPC vocations, deterministic updates and save validation.');
