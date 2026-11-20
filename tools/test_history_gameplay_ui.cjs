'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {start,base}=require('./interface_host.cjs');
const E=require(path.join(base,'engine.js')).PocketEngine;
const K='studio.pocketyears.save.v1';
function boot(birthYear,archive=[]){
  const life=E.makeLife({seed:673,birthYear});
  life.age=22;life.cash=250000;
  return start(new Map([[K,JSON.stringify(E.encodeGame({active:life,archive,settings:{motion:'reduced'}}))]]),{asyncBack:true});
}
const read=u=>E.decodeGame(u.state()).active;
function hit(u,action,key){u.click(action,key);u.flushBack();u.tick();}
function runFirst(u,group,identify=()=>true){
  const choice=u.visible().querySelectorAll('button[data-do="sheet"]').find(b=>!b.disabled&&b.dataset.key.startsWith('hist-review~'+group+'~')&&identify(b.dataset.key));
  assert(choice,'No enabled action in '+group);
  hit(u,'sheet',choice.dataset.key);hit(u,'hist-run',choice.dataset.key);
}
for(const y of [1230,1540,1810,1910,2000,2090]){
  const u=boot(y),historical=y<2000,year=y+22;
  hit(u,'occupation');hit(u,'tab','school');
  if(!historical)hit(u,'sheet','hist-school');
  runFirst(u,'school');
  if(!historical)hit(u,'sheet','hist-school');
  runFirst(u,'school');
  hit(u,'tab','career');
  if(!historical)hit(u,'sheet','hist-work');
  runFirst(u,'work',id=>id.includes('job-era-'));
  assert(read(u).job.startsWith('era-'),'Job did not persist for '+year);
  hit(u,'tab','assets');
  assert.equal(!!u.button('sheet','dealerships'),!historical);
  hit(u,'sheet','hist-market');
  const balance=read(u).cash;
  runFirst(u,'market');
  assert(read(u).cash<balance&&Object.keys(read(u).world.owned).length===1);
  hit(u,'sheet','hist-museum');
  runFirst(u,'museum',key=>key.includes('catalog'));
  hit(u,'sheet','hist-museum');hit(u,'sheet','hist-item~0');
  assert(u.visible().textContent.includes('Ownership history'));
  hit(u,'close');hit(u,'tab','activities');
  if(!historical)hit(u,'sheet','hist-activities');
  runFirst(u,'activities');
  if(historical){
    hit(u,'sheet','hist-world');assert(u.visible().textContent.includes('Population index'));hit(u,'close');
    hit(u,'sheet','hist-move');
    const before=read(u),to=E.historyWorld.choices(year).find(p=>!E.sim.moveReason(before,p.id));
    assert(to);
    hit(u,'sheet','hist-settle~'+to.id);hit(u,'hist-relocate',to.id);assert.equal(read(u).town,to.id);
    hit(u,'sheet','hub-crime');assert(!u.visible().textContent.includes('Grand theft auto'));hit(u,'close');
  }
  hit(u,'tab','journal');hit(u,'sheet','hist-archive');hit(u,'sheet','hist-capsule~current');
  assert(u.visible().textContent.includes('Time Capsule'));
  assert(u.visible().querySelector('.time-capsule').dataset.theme);
  console.log('PASS calendar '+year+' jobs, asset purchase, museum accession, relationships archive, period activities');
}

const teen=E.makeLife({seed:76,birthYear:1310});
Object.assign(teen,{age:17,cash:700});
assert.equal(E.sim.perform(teen,'account'),null);
assert.equal(E.world.interview(teen,'developer','example'),null);
assert.equal(E.sim.takeTest(teen,'stop'),null);
assert.equal(E.world.match(teen,0),null);
assert.equal(E.sim.perform(teen,'auto'),null);
assert.equal(E.world.shopping.inventory(teen,'apex').length,0);
teen.age=22;
assert.equal(E.sim.perform(teen,'pet-cat',{name:'Moss',breed:'Bengal'}),null);
assert(E.sim.perform(teen,'pet-cat',{name:'Moss',breed:'Mixed-breed cat'}));
const beforeWalk=teen.cash;
assert(E.world.meet(teen));
assert.equal(teen.cash,beforeWalk);
assert(E.world.isPartner(teen));
const earlyWeb=E.makeLife({seed:50,birthYear:1980});
earlyWeb.age=22;
assert.equal(E.world.matches(earlyWeb).length,0);
assert.equal(E.sim.options(earlyWeb,'fame').length,0);
earlyWeb.age=32;
assert.equal(E.world.matches(earlyWeb).length,3);
assert(E.sim.options(earlyWeb,'fame').length);
console.log('PASS direct historical and early-web technology guards, era-appropriate adoption and courtship');
