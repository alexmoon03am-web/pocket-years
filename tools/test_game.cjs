'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const base=process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine,S=E.sim,W=E.world,M=E.model;
const art=new Set(fs.readdirSync(path.join(base,'art')));
const clone=o=>JSON.parse(JSON.stringify(o));
const game=l=>({version:4,active:l,archive:[],settings:{motion:'system'}});
function resume(l){return E.decodeGame(clone(E.encodeGame(game(l)))).active;}
function random(seed){return n=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)%n;};}
function settle(l,roll){
  while(E.blocking(l)){
    if(l.sim.review){assert(E.acknowledge(l));continue;}
    if(l.sim.court){assert(S.court(l,'plea'));continue;}
    const event=E.stories[l.event.id],i=roll(event.choices.length);
    assert(E.decide(l,i));assert(!E.decide(l,i));
  }
}
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/legacy-save.json')));
const migrated=E.decodeGame(clone(fixture));
for(const [v,l] of [[fixture.active,migrated.active],...fixture.archive.map((a,i)=>[a,migrated.archive[i]])]){
  for(const k of ['age','cash','name','rng','log','event','keepsakes'])assert.deepEqual(l[k],v[k],k);
}
assert.deepEqual(resume(migrated.active),migrated.active);
assert.deepEqual(E.decodeGame(clone(E.encodeGame(migrated))).archive,migrated.archive);
let lives=0,years=0,roundTrips=0,empty=0,double=0,oldest=0;
const observed=new Set(),options=Object.values(E.stories);
for(const ev of options){
  assert(ev.choices.length>=3&&ev.choices.length<=4,ev.id);
  assert.equal(new Set(ev.choices.map(c=>c.label)).size,ev.choices.length);
  for(const [i,c] of ev.choices.entries()){
    assert(art.has(c.icon+'.png'),c.icon);const l=E.makeLife({seed:171});
    Object.assign(l,{age:27,track:'work',cash:10000,event:{id:ev.id,resolved:false}});
    const before=M.metrics(l,W.netWorth,S.budget);assert(E.decide(l,i));assert.equal(l.sim.review.from,ev.id);
    assert.deepEqual(l.sim.review.delta,M.diff(before,M.metrics(l,W.netWorth,S.budget)));
    assert(!/[{}]/.test(l.sim.review.text),ev.id);assert.equal(E.advance(l),false);
    assert.equal(E.act(l,'read'),null);assert.equal(W.trade(l,'bike','buy'),null);
    assert.deepEqual(resume(l),l);assert(E.acknowledge(l));assert(!E.acknowledge(l));
  }
}
for(let seed=1;seed<=720;seed++){
  const roll=random((Math.imul(seed,2246822519)>>>0)||1);
  const l=E.makeLife({seed:(Math.imul(seed,2654435761)>>>0)||1});assert(l.id);
  while(!l.ended){
    const age=l.age;settle(l,roll);
    if(age===7&&seed%2)W.career(l,'science');
    if(age===14&&seed%3)W.career(l,['paper','cafe','odd'][seed%3]);
    if(age===16&&seed%7)S.takeTest(l,'stop');
    if(age>=8&&seed%6===0)E.act(l,'openmic');
    if(age>=14&&age<32&&!W.isPartner(l)&&seed%2)W.meet(l);
    if(age>=20&&age<39&&seed%3===1&&l.world.childCount===0)W.adopt(l,'Kit');
    if(age>=20&&age%8===0&&seed%13===0)S.perform(l,'pickpocket');
    if(l.sim.court)settle(l,roll);
    if(age>=18&&age%6===0&&seed%4===1){const choices=Object.keys(W.openings).filter(k=>!W.jobReason(l,k));if(choices.length)W.interview(l,choices[roll(choices.length)],'honest');}
    if(seed%4===0&&(l.sim.illnesses.length||l.sim.injuries.length))S.perform(l,'doctor');
    if(seed%3===0){const a=E.actionList(l).filter(x=>!E.actionReason(l,x[0],-(x[4].cash||0)));if(a.length)E.act(l,a[roll(a.length)][0]);}
    if(seed%9===0&&age>=24&&age%11===0){const stock=[...W.shopping.gear(l),...Object.keys(W.shopping.shops).flatMap(shop=>W.shopping.inventory(l,shop))];if(stock.length)W.trade(l,stock[roll(stock.length)].id,'buy');}
    const balance=l.cash,shift=l.world.partJob,copy=(seed%19===0&&age%5===0)?resume(l):null;
    if(copy){assert.deepEqual(copy,l);roundTrips++;}
    assert(E.advance(l));assert.equal(l.age,age+1);years++;
    if(copy){assert(E.advance(copy));assert.deepEqual(l,copy,'future changed after restoration');}
    if(age<17)assert.equal(l.cash,balance+(!l.ended&&shift?W.parts[shift][1]:0),'unauthorized minor income');
    assert(Number.isInteger(l.cash)&&l.cash>=0);assert(!l._yearEntries);
    for(const v of [...Object.values(l.stats),...Object.values(l.hidden)])assert(Number.isInteger(v)&&v>=0&&v<=100);
    if(l.ended)continue;
    const n=(l.event.id?1:0)+l.eventQueue.length;assert(n>=0&&n<=2);if(n===0)empty++;if(n===2)double++;
    for(const evt of [l.event,...l.eventQueue])if(evt.id)observed.add(evt.id);
    assert(l.log.some(e=>e.age===l.age&&e.kind==='Year'));
    assert(l.age<=110);
  }
  assert(l.sim.cause);assert(!E.advance(l));oldest=Math.max(oldest,l.age);lives++;
}
assert(empty>0&&double>0&&oldest>=80&&observed.size>75);
console.log('PASS '+lives+' completed lives, '+years+' birthdays, '+roundTrips+' identical serialized futures. Oldest age '+oldest+'.');
console.log('PASS '+options.length+' events, '+options.reduce((n,e)=>n+e.choices.length,0)+' individually checked choices. '+observed.size+' distinct events appeared during play.');
console.log('PASS zero- and two-event years, exact outcome deltas, locked decisions, seed determinism, old saves, teen payroll and bounded stats.');
