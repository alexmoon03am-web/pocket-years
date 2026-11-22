'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const assets = process.env.POCKET_ASSET_DIR || path.join(__dirname, '../app/src/main/assets');
const E = require(path.join(assets, 'engine.js')).PocketEngine;
const saves = require(path.join(assets,'save.js')).PocketSaves.open({getItem:()=>null,setItem(){}}, E, 'studio');
const snapshot = l => JSON.stringify(E.encodeGame({active:l,archive:[],settings:{}}));
const studio = E.performanceStudio;
const perform = E.performSeason;
function player(age, birthYear = 2000, seed=11) {
  const l = E.makeLife({seed, birthYear, town:'london'});
  l.age=age;
  return l;
}
function audition(id, birthYear = 2000) {
  for(let seed=1;seed<1000;seed++){
    const l=player(24,birthYear,seed);
    E.world.changeJob(l,'clerk',true);
    l.cash=25000;
    l.hidden.discipline=82;
    assert(perform(l,id,'practice'));
    assert(perform(l,id,'apply'));
    if(l.sim.performanceStudio.tracks[id].offer)return l;
  }
  throw Error('No accepted applicant in sample');
}
const infant=player(4);
assert.deepEqual(studio.view(infant).tracks,[]);
assert.equal(perform(infant,'music','practice'),null);
const teen=player(13);
teen.hidden.discipline=86;
assert(perform(teen,'music','practice'));
assert(perform(teen,'music','apply'));
assert(!teen.sim.performanceStudio.tracks.music.offer);
assert.equal(studio.pay(teen,13),0);
assert.equal(perform(teen,'music','practice'),null);
assert.equal(perform(teen,'toString','practice'),null);
const locked=player(25);
locked.event={id:'box',resolved:false};
const before=snapshot(locked);
assert.equal(perform(locked,'acting','practice'),null);
assert.equal(before,snapshot(locked));
for(const born of [1200,1500,1750,1920,2000,2220,3000]){
  for(const id of ['acting','music','sport']){
    const l=audition(id,born),quote=l.sim.performanceStudio.tracks[id].offer;
    const before=E.sim.budget(l);
    assert(perform(l,id,'sign'));assert(perform(l,id,'plain'));
    const duplicate=snapshot(l);
    assert.equal(perform(l,id,'bold'),null);assert.equal(duplicate,snapshot(l));
    const book=E.sim.budget(l);
    assert.equal(book.gross-before.gross,quote.fee);
    assert.equal(book.side-before.side,quote.fee);
    assert.equal(book.performanceIncome,quote.fee);
    assert(book.tax>=before.tax);
    assert.equal(l.cash,25000);
    const imported=saves.inspectFile(snapshot(l));assert(imported,'Contract failed import');
    E.advance(l);E.advance(imported.active);
    assert.deepEqual(snapshot(imported.active),snapshot(l),'Contract changed the replay');
    assert(!l.ended);
    assert.equal(l.sim.lastBudget.performanceIncome,quote.fee);
    const r=l.sim.performanceStudio.tracks[id];
    assert.equal(r.completed,1);assert(!r.contract);assert(r.following>0);
    assert(l.log.some(row=>row.title==='Season completed'));
    assert(!studio.pay(l,l.age));
  }
}
const cross=audition('acting');
cross.town='cedar';
assert.equal(perform(cross,'acting','sign'),null,'Travel must expire a local offer');
assert(studio.view(player(20,1300)).tracks.find(t=>t.id==='sport').items.some(o=>o.title==='Train with other runners'));
const injured=player(20);injured.sim.injuries=[{name:'strain',severity:20,years:0}];
assert.equal(perform(injured,'sport','practice'),null);assert.equal(perform(injured,'sport','apply'),null);
const canceled=audition('sport');
assert(perform(canceled,'sport','sign'));canceled.sim.prison=2;
assert.equal(studio.pay(canceled,canceled.age),0);
assert(E.advance(canceled));assert.equal(canceled.sim.performanceStudio.tracks.sport.completed,0);
assert(canceled.log.some(e=>e.title==='Season canceled'));
const corrupt=audition('music');assert(perform(corrupt,'music','sign'));
corrupt.sim.performanceStudio.tracks.music.contract.rate=1000000;
assert.equal(saves.inspectFile(snapshot(corrupt)),null);
let music;
for(let seed=1;seed<=200;seed++){
  const l=player(22,2000,seed);l.hidden.discipline=100;
  assert(perform(l,'music','practice'));assert(perform(l,'music','apply'));
  if(!l.sim.performanceStudio.tracks.music.offer)continue;
  assert(perform(l,'music','sign'));const rep=l.world.reputation,receipt=perform(l,'music','bold');
  assert(receipt);assert.equal(receipt.delta.reputation||0,l.world.reputation-rep);
  if(l.sim.performanceStudio.tracks.music.contract.rate===145){music=l;break;}
}
assert(music);
assert(E.advance(music));assert(!music.ended);
const recording=music.sim.performanceStudio.rights[0];assert(recording);
for(let i=0;i<=3;i++)assert.equal(studio.pay(music,music.age+i),i<3?recording.fee:0);
assert(saves.inspectFile(snapshot(music)));
// Play from birth through regional selection without seeding experience, money or skill.
let advanced=false;
for(let seed=1;seed<=20&&!advanced;seed++){
  const l=E.makeLife({seed,birthYear:2000,town:'london'});
  while(!l.ended&&l.age<=46&&!advanced){
    while(E.blocking(l)){
      if(E.blocking(l)==='outcome')E.acknowledge(l);
      else if(E.blocking(l)==='decision')E.decide(l,0);
      else assert(E.sim.court(l,'plea'));
    }
    if(l.age>=12){
      const take=(key)=>perform(l,'music',key);
      take('practice');
      const r=l.sim.performanceStudio?.tracks.music;
      if(r&&!r.member)take('team');
      if(r?.completed>=2&&r.member&&!r.circuit){
        take('circuit');
        if(r.circuit){
          advanced=true;
          assert(r.group.includes('Touring Ensemble'));
          assert(saves.inspectFile(snapshot(l)));
        }
      }
      take('apply');take('sign');take('plain');
    }
    E.advance(l);
  }
}
assert(advanced,'At least one natural life should reach the regional music circuit');
console.log('PASS acting, music and sport in seven periods, junior eligibility, quote-to-ledger settlement, expiration, injury restrictions, custody, import rejection, action locks, replay and time-limited recording income.');
