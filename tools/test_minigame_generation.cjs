'use strict';
const assert=require('node:assert/strict');
const {grid,puzzles,parkingPath}=require('./minigame_test_helpers.cjs');

function walk(s,to,stepper){
  const dx=to%s.w-s.player%s.w,dy=Math.floor(to/s.w)-Math.floor(s.player/s.w);
  let current=s;
  for(const [units,pos,neg] of [[dx,'right','left'],[dy,'down','up']]){
    for(let i=0;i<Math.abs(units);i++){
      assert(!current.result,JSON.stringify(current.result));
      const cmd=units>0?pos:neg;
      let next=stepper(current,cmd);
      for(let closed=0;!next&&current.type==='grid'&&closed<4;closed++){
        current=stepper(current,'wait');
        next=stepper(current,cmd);
      }
      assert(next,'Blocked route');
      current=next;
    }
  }
  return current;
}
function escapeWalk(s){
  assert.equal(grid.step(s,'teleport'),null);
  const objective=s.burg?s.prizes[0].p:s.markers[0];
  const x=objective%s.w;
  let state=walk(s,Math.floor(s.start/s.w)*s.w+x,grid.step);
  state=walk(state,objective,grid.step);
  if(s.burg)state=grid.step(state,'take');
  state=walk(state,s.w+x,grid.step);
  return walk(state,s.exit,grid.step);
}
const shape=new Set();
for(let i=0;i<1800;i++){
  const seed=(i*2654435761)>>>0,skill=i%101;
  for(const id of ['escape','burglary']){
    const run={id,seed,skill,level:id==='escape'?1+i%4:1+i%3},s=grid.create(run);
    assert.deepEqual(s,grid.create(run));
    assert(s.floor[s.start]&&s.floor[s.exit]);
    shape.add(s.floor.map(Number).join('')+s.start+'/'+s.exit);
    assert(escapeWalk(s).result.won);
  }
}
assert(shape.size>2000);
const patrolling=grid.create({id:'burglary',seed:45,skill:0,level:3});
const first=grid.step(patrolling,'wait');
assert.notDeepEqual(first.guards,patrolling.guards);
const decoy=grid.step(patrolling,'decoy');
assert.deepEqual(decoy.guards,patrolling.guards);
assert.equal(decoy.decoys,patrolling.decoys-1);
assert.equal(grid.step(decoy,'decoy'),null);
let expired=patrolling;
while(!expired.result)expired=grid.step(expired,'wait');
assert.equal(expired.result.won,false);
assert.equal(expired.result.reason,'Ran out of turns');
assert.equal(grid.step(expired,'take'),null);
// Ensure the risky inner route really incurs detection and can end in capture.
let captured=0,detected=0,withdrawn=0;
for(let i=0;i<300;i++){
  let s=grid.create({id:'burglary',seed:i*719,skill:45,level:2});
  const roll=grid.rng(i+9643);
  while(!s.result){
    const commands=grid.view(s).actions.filter(c=>c!=='wait'&&c!=='hide'&&c!=='decoy');
    const former=s.guards;
    s=grid.step(s,commands.includes('take')?'take':commands.length?commands[roll(commands.length)]:'wait');
    assert(s.guards.every((p,i)=>p===former[i]||Object.values(grid.dirs).some(d=>grid.move(former[i],d,s.w,s.h)===p)));
    if(s.alert>0)detected++;
  }
  if(s.result.reason==='Captured')captured++;
  if(s.result.won)withdrawn++;
}
assert(captured>100&&detected>300);
for(let i=0;i<1200;i++){
  const run={id:'driving',seed:(i*429496729)>>>0,skill:i%101,level:1+i%3},b=puzzles.create(run);
  assert.equal(new Set(b.exams.map(q=>q.id)).size,b.exams.length);
  let s=b;
  for(const q of b.exams)s=puzzles.step(s,'a'+q.answers.findIndex(a=>a.ok));
  const actions=parkingPath(s);
  assert(actions&&actions.length<=b.limit);
  for(const action of actions)s=puzzles.step(s,action);
  assert(s.result.won&&s.result.score===100&&s.faults===0);
}
let wrong=puzzles.create({id:'driving',seed:21,skill:100,level:1});
for(const q of wrong.exams)wrong=puzzles.step(wrong,'a'+q.answers.findIndex(a=>!a.ok));
assert.equal(parkingPath(wrong),null);
const n=650;
for(let i=0;i<n;i++){
  const run={id:'career',seed:i*44219,skill:i%101,level:1+i%3,variant:'teaching'},s=puzzles.create(run);
  assert(s.clues.length>1&&puzzles.step(s,'submit')===null);
  let ready=s;
  for(const id of s.solution)ready=puzzles.step(ready,'pick'+id);
  assert.equal(puzzles.step(ready,'pick'+s.solution[0]),null);
  assert(puzzles.step(ready,'submit').result.won);
  assert.equal(puzzles.step(puzzles.step(ready,'undo'),'submit'),null);

  const plan=puzzles.create({...run,variant:'business'});
  ready=plan;
  for(const item of plan.solution)ready=puzzles.step(ready,'pick'+item);
  assert(ready.remaining>=0&&puzzles.step(ready,'submit').result.won);
  assert.equal(puzzles.step(plan,'submit').result.won,false);

  const panel=puzzles.create({...run,variant:'engineering'});
  ready=panel;assert.notEqual(ready.lamps,ready.target);
  for(const cell of panel.witness){
    if(!ready.result)ready=puzzles.step(ready,'toggle'+cell);
  }
  assert(ready.result.won);

  let training=puzzles.create({...run,id:'service'});
  const witness=training.safe;
  for(const p of witness.slice(1))training=walk(training,p,puzzles.step);
  assert(training.result.won);
}
for(const id of ['sport','music']){
  const run={id,seed:11,skill:25,level:2,untimed:false};
  let misses=puzzles.create(run),hits=puzzles.create(run);
  assert(puzzles.create({...run,skill:90}).window>hits.window);
  assert(puzzles.create({...run,level:3}).cycle<hits.cycle);
  assert.equal(puzzles.step(hits,'hit1'),null);
  assert.equal(puzzles.step(hits,'hit1@-120'),null);
  while(!hits.result){
    const idx=hits.index;
    hits=puzzles.step(hits,'hit'+hits.pattern[idx]+'@0');
    misses=puzzles.step(misses,'miss');
  }
  assert(hits.result.won&&!misses.result.won);
}
const cardTotals=[0,0,0];
for(let i=0;i<1200;i++){
  const card=puzzles.create({id:'cards',seed:i*19768});
  cardTotals[card.winning]++;
  assert(puzzles.step(card,'a'+card.winning).result.won);
}
assert(cardTotals.every(n=>n>=360&&n<=440));
console.log('PASS 7,400 seeded layouts with playable witnesses (3,600 stealth, 1,200 driving, 2,600 career/training), '+shape.size+
  ' stealth layouts, '+captured+'/300 experimental inner-route captures, score timing and 1,200 reproducible card draws.');
module.exports={escapeWalk};
