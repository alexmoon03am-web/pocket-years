'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {E,base,life,game,grid,puzzles,parkingPath,storageKey}=require('./minigame_test_helpers.cjs');
const {PocketSaves}=require(path.join(base,'save.js'));
const G=E.minigames;
const snapshot=l=>JSON.stringify(E.encodeGame(game(l)));
const current=l=>G.current(l).board;
function start(l,id,opts={}){
  const result=G.start(l,id,opts,G.revision(l));assert(result,G.entry(l,id)?.reason);
  return result;
}
function input(l,cmd){
  const result=G.input(l,G.revision(l),cmd);assert(result,'Invalid input '+cmd);return result;
}
function ack(l){assert(E.acknowledge(l));}
function walk(l,x,y){
  const b=current(l),axes=[[b.player%b.w,x,'left','right'],[Math.floor(b.player/b.w),y,'up','down']];
  for(const [start,target,neg,pos] of axes){
    for(let n=start;n!==target;n+=n<target?1:-1){
      const direction=target>n?pos:neg;
      while(!current(l).actions.includes(direction))input(l,'wait');
      input(l,direction);
    }
  }
}
function escape(l){
  const b=current(l),objective=b.burg?b.prizes[0].p:b.markers[0],x=objective%b.w;
  walk(l,x,Math.floor(b.start/b.w));walk(l,x,Math.floor(objective/b.w));
  if(b.burg)input(l,'take');
  walk(l,x,1);walk(l,b.exit%b.w,1);
}
function sentence(){
  const l=life({seed:18});l.sim.record=1;l.sim.prison=5;
  return l;
}
const earn=life();
const bank=earn.cash;
start(earn,'burglary');
assert.equal(E.blocking(earn),'minigame');
assert.equal(E.advance(earn),false);
assert.equal(E.sim.perform(earn,'burglary'),null);
assert.equal(E.performSeason(earn,'sport','practice'),null);
assert.equal(G.start(earn,'driving',{},G.revision(earn)),null);
const discarded=G.revision(earn);
input(earn,'decoy');assert.equal(G.input(earn,discarded,'decoy'),null);
input(earn,'pause');input(earn,'restart');
assert.equal(current(earn).used,0);
escape(earn);
assert(earn.cash>bank&&earn.cash-bank<=950);
assert(earn.log.at(-1).title==='Left with the haul');
assert.equal(earn.sim.review.delta.cash,earn.cash-bank);
assert.equal(G.input(earn,G.revision(earn),'right'),null);
ack(earn);assert.match(G.entry(earn,'burglary').reason,/Done this year/);
assert.equal(E.sim.perform(earn,'burglary'),null);

const caught=life();start(caught,'burglary');while(G.active(caught))input(caught,'wait');
assert.equal(E.blocking(caught),'outcome');
assert.equal(caught.cash,4000);ack(caught);
assert.equal(E.blocking(caught),'court');
assert.equal(caught.sim.court.id,'burglary');
assert(E.sim.court(caught,'plea'));ack(caught);
assert.equal(caught.sim.record,1);assert.equal(caught.sim.prison,2);

const flee=sentence();start(flee,'escape');escape(flee);
assert.equal(flee.sim.prison,0);assert.equal(G.wanted(flee).sentence,5);ack(flee);
assert.match(E.world.jobReason(flee,'barista'),/outstanding sentence|No vacancy/);
assert.match(E.sim.moveReason(flee,'atlanta'),/outstanding sentence/);
assert.equal(E.sim.perform(flee,'burglary'),null);
const older=G.revision(flee);assert(G.surrender(flee,older));assert.equal(flee.sim.prison,5);
assert.equal(G.surrender(flee,older),null);
const hard=sentence();hard.sim.prison=9;
start(hard,'escape',{difficulty:'challenging'});assert.equal(G.current(hard).level,'High security');
input(hard,'pause');input(hard,'exit');assert.equal(hard.sim.prison,11);
const gone=sentence();start(gone,'escape');escape(gone);ack(gone);
for(let i=0;i<3&&G.wanted(gone);i++){
  assert(E.advance(gone));
  while(E.blocking(gone)==='decision'||E.blocking(gone)==='outcome'){
    if(E.blocking(gone)==='decision')E.decide(gone,0);else ack(gone);
  }
}
assert(!G.wanted(gone));assert(gone.sim.prison>5||gone.ended);
assert(gone.log.some(row=>row.title==='Captured after escape')||gone.ended);
const finalWarrant=sentence();start(finalWarrant,'escape');escape(finalWarrant);ack(finalWarrant);
finalWarrant.age+=3;finalWarrant.ended=true;
G.validate(finalWarrant);

const early=life({born:1230,age:18,town:'london'});
assert.equal(G.entry(early,'driving'),null);
assert.equal(G.entry(early,'historical').title,'Market commission');
assert.equal(G.entry(life({born:1450,age:90,town:'london'}),'historical').title,'Studio commission');
assert.equal(G.entry(life({born:1800,age:35}),'historical').title,'Factory tally');
assert.equal(G.entry(life({born:1913,age:16}),'driving'),null);
assert.equal(G.entry(life({born:1913,age:17}),'driving').reason,'');
assert.match(G.entry(life({age:17,town:'kyoto'}),'driving').reason,/Opens at 18/);
assert.equal(G.entry(life({age:16,town:'cedar'}),'driving').fee,0);
const future=life({born:2300});assert.equal(G.entry(future,'historical').title,'Habitat relay');
const drive=life();
start(drive,'driving');assert.equal(drive.cash,3970);
while(!current(drive).parking){const b=current(drive);input(drive,'a'+b.exams[b.question].answers.findIndex(a=>a.ok));}
for(const command of parkingPath(current(drive)))input(drive,command);
assert(drive.sim.license&&drive.sim.review.delta.cash===-30);ack(drive);
assert.equal(G.entry(drive,'driving').reason,'License earned');

for(const [job,type] of [['teacher','ordering'],['physician','ordering'],['lawyer','ordering'],['chef','ordering'],
  ['developer','circuit'],['electrician','circuit'],['manager','budget']]){
  const l=life({job}),before=l.world.performance;start(l,'career');const b=current(l);
  assert.equal(b.type,type);
  if(type==='circuit'){
    for(const cell of b.witness)if(G.active(l))input(l,'toggle'+cell);
  }else{
    for(const card of b.solution)input(l,'pick'+card);
    input(l,'submit');
  }
  assert(l.world.performance>before&&l.log.at(-1).kind==='Career'&&l.cash>4000&&l.cash-4000<=125);
  ack(l);assert.match(G.entry(l,'career').reason,/Done/);
}
const bad=life({job:'teacher'});start(bad,'career');
for(const card of current(bad).solution.slice().reverse())input(bad,'pick'+card);
input(bad,'submit');assert(bad.world.performance<56);
const serviceId=Object.keys(E.occupations.entries).find(id=>E.occupations.categoryOf(id)==='Uniformed service');
const trainee=life({job:serviceId});start(trainee,'service');const b=current(trainee);
for(const cell of b.safe.slice(1)){
  const diff=cell-current(trainee).player;
  input(trainee,diff===1?'right':'up');
}
assert.equal(trainee.sim.minigames.records.service.wins,1);
const junior=life({age:15,born:1390,cash:0});start(junior,'historical');
for(const card of current(junior).solution)input(junior,'pick'+card);
input(junior,'submit');assert.equal(junior.cash,0);assert.equal(junior.sim.timeline.training,1);
const athlete=life({age:16,born:2000});start(athlete,'sport',{timing:'untimed'});
while(G.active(athlete)){const s=current(athlete);input(athlete,'hit'+s.pattern[s.index]);}
assert(athlete.sim.expansion.hobbies.running>=6&&E.performanceStudio.skill(athlete,'sport')>=6);
assert.equal(athlete.cash,4000);
const injury=life({age:18});injury.sim.injuries.push({name:'sprain',severity:10,years:0});
assert.match(G.entry(injury,'sport').reason,/injury/);

assert.equal(G.entry(life({town:'london'}),'cards'),null);
assert.match(G.entry(life({age:20,town:'cedar'}),'cards').reason,/Opens at 21/);
const wager=life({town:'cedar'}),fee=G.entry(wager,'cards').fee;
start(wager,'cards');
input(wager,'pause');assert.equal(G.input(wager,G.revision(wager),'restart'),null);input(wager,'resume');
input(wager,'a'+current(wager).winning);assert.equal(wager.cash,4000+fee);
assert.equal(wager.sim.review.delta.cash,fee);
const depart=life({town:'briar'});start(depart,'cards');input(depart,'pause');input(depart,'exit');assert(depart.sim.review.delta.cash<0);
let simWins=0;
for(let i=1;i<=320;i++){
  const a=life({seed:i}),b=life({seed:i});
  assert.deepEqual(start(a,'burglary',{enabled:false}),start(b,'burglary',{enabled:false}));
  assert.deepEqual(snapshot(a),snapshot(b));assert(!G.active(a));
  if(a.sim.court)assert.equal(a.cash,4000);else{
    simWins++;assert(a.cash-4000>0&&a.cash-4000<=326);
  }
}
assert(simWins>60&&simWins<240);

// Keep the rollback watermark outside exports and within the same device's slots.
const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
const disk=PocketSaves.open(storage,E,storageKey), one=life({seed:69});
const pre=disk.exportFile(game(one));assert(disk.save(game(one)));assert(disk.manual(game(one)));
start(one,'driving');assert(disk.saveChallenge(game(one),0));
const first=disk.exportFile(game(one));
assert.equal(disk.inspectFile(pre),null);
assert.equal(disk.restore(),null);
assert.match(disk.message,/predates/);
assert.equal(disk.load().active.cash,3970);
const exam=current(one),cmd='a'+exam.exams[0].answers.findIndex(a=>a.ok);
let rev=G.revision(one);input(one,cmd);
assert(disk.saveChallenge(game(one),rev));
assert.equal(disk.inspectFile(first),null);
assert.equal(disk.saveChallenge(game(one),rev),false);
assert.equal(G.current(disk.load().active).board.question,1);
const good=memory.get(storageKey);
memory.set(storageKey,'{lost');
assert.equal(G.current(disk.load().active).board.question,1);
assert.equal(memory.get(storageKey),good);
assert(disk.select(2,game(one)));
assert.equal(disk.importFile(first),null);
assert(disk.importFile(disk.exportFile(game(one))));
const owner=life({cash:200000});
assert(E.expansion.perform(owner,'business','','open-studio'));
start(owner,'career');
const business=current(owner),firm=Object.values(owner.sim.expansion.companies)[0];
for(const item of business.solution)input(owner,'pick'+item);
input(owner,'submit');
assert.equal(firm.clients,1);

const blank=PocketSaves.open({getItem:()=>null,setItem:()=>{}},E,storageKey);
assert(blank.inspectFile(first));
const forged=E.encodeGame(game(one));forged.active.run.simulation.minigames.active.inputs=['teleport'];
assert.equal(blank.inspectFile(JSON.stringify(forged)),null);
const wrongSettings=E.encodeGame(game(one,{minigames:{difficulty:'impossible'}}));
assert.equal(blank.inspectFile(JSON.stringify(wrongSettings)),null);

// Interrupt the protected write before and after committing its matching snapshot.
const testStore=new Map(),fault=(mode)=>({
  getItem:k=>testStore.get(k)||null,
  setItem(k,value){
    if(mode==='before'&&k===storageKey)throw Error('interrupted');
    if(mode==='after'&&k.includes('.minis.')&&JSON.parse(value).pending===undefined)throw Error('interrupted');
    testStore.set(k,value);
  }
});
const checkpoint=PocketSaves.open(fault(''),E,storageKey),two=life({seed:90});
assert(checkpoint.save(game(two)));
start(two,'driving');
assert.equal(PocketSaves.open(fault('before'),E,storageKey).saveChallenge(game(two),0),false);
assert.equal(checkpoint.load().active.cash,4000);
assert(PocketSaves.open(fault('after'),E,storageKey).saveChallenge(game(two),0));
assert.equal(checkpoint.load().active.cash,3970);
assert.equal(checkpoint.inspectFile(snapshot(life({seed:90}))),null);
console.log('PASS justice, licensing, role-specific work, training, historical rewards, sports practice, bounded odds, 320 seeded skill checks, blocked mutations and protected resume/rollback/recovery.');
