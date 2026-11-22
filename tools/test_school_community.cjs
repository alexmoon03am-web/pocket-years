'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine;
const C=E.schoolCommunity;
const clone=x=>JSON.parse(JSON.stringify(x));
function pupil(age=12,birthYear=2000,seed=32){
  const l=E.makeLife({seed,birthYear,name:'Remy Hill',town:birthYear<1900?'london':'cedar'});
  l.age=age;E.year.campus(l);
  return l;
}
function prepare(l){
  while(E.blocking(l)){
    if(l.sim.review)assert(E.acknowledge(l));
    else if(l.sim.court)assert(E.sim.court(l,'plea'));
    else assert(E.decide(l,0));
  }
}
const tick=l=>{prepare(l);assert(E.advance(l));assert(!l.ended);prepare(l);};
const save=l=>clone(E.encodeGame({active:l,archive:[],settings:{}}));
function offer(l,kind,end){
  for(let y=l.age;y<=end;y++){
    C.annual(l);
    if(l.sim.schoolCommunity?.pending?.kind===kind)return true;
    if(y>=end)break;
    l.age++;l.used=[];E.year.campus(l);
  }
  return false;
}
function pending(l){return C.view(l).options.filter(o=>o.id.startsWith('case-'));}
function cleanCall(l,id){
  const a=C.perform(l,id);assert(a,id);assert.equal(C.perform(l,id),null,id);return a;
}
const nursery=pupil(2);
assert.equal(C.view(nursery).enrolled,false);
tick(nursery);
assert.equal(E.state(nursery).educationLevel,'Preschool');
assert.equal(nursery.log.filter(e=>e.title==='Preschool began').length,1);
const child=Object.values(nursery.people).find(p=>p.atSchool&&p.job==='Student');
assert(child);const bond=child.bond;
cleanCall(nursery,'circle');assert(child.bond>bond);
const saved=save(nursery),copy=E.decodeGame(clone(saved)).active;
assert.deepEqual(C.view(copy),C.view(nursery));
const empty=pupil(8);
delete empty.sim.schoolCommunity;
const digest=JSON.stringify(empty);
C.view(empty);C.view(empty);
assert.equal(JSON.stringify(empty),digest,'reading a menu must not alter a save');
assert(!E.decodeGame(save(empty)).active.sim.schoolCommunity,'older saves should load without manufactured school history');

const adult=pupil(20);
adult.cash=50000;adult.rng=1;adult.sim.dropped=true;
assert(E.educationApply(adult,'timber-framing','cash'));
assert(C.view(adult).enrolled,'Vocational students can participate after leaving secondary school');
const originalCampus=adult.sim.campusKey;
const ids=l=>Object.values(l.people).filter(p=>p.atSchool&&p.active).map(p=>p.id).sort();
const classmates=ids(adult);
assert(classmates.length>1);
adult.world.grade=0;
tick(adult);
assert(adult.sim.program.probation);
assert.equal(adult.sim.campusKey,originalCampus);
assert.deepEqual(ids(adult),classmates,'A repeat assessment must not replace the class');
assert(E.educationAction(adult,'transfer'));
assert.notEqual(adult.sim.campusKey,originalCampus);
assert(!ids(adult).some(id=>classmates.includes(id)),'An institution transfer changes the current roster');

const past=pupil(9,1280);
cleanCall(past,'join-handwork');assert(past.sim.activities.includes('handwork'));
assert(!C.view(past).options.some(o=>o.id==='join-service'));
assert.equal(C.perform(past,'join-service'),null);
const alternative=new Set();
for(const y of [1200,1550,1790,1928,2018,2500]){
  const life=pupil(7,y);C.annual(life);
  const page=C.view(life);
  assert(page.enrolled);alternative.add(page.options.find(o=>o.id.startsWith('join-')).id);
}
assert.deepEqual([...alternative].sort(),['join-handwork','join-service']);
assert.equal(C.view(pupil(3,1290)).enrolled,false);
const learner=pupil(11,1280);
cleanCall(learner,'miss');assert.equal(learner.sim.schoolCommunity.absences,1);
tick(learner);cleanCall(learner,'miss');
assert.equal(C.view(learner).caseTitle,'A meeting over missed lessons');

const club=pupil(15);
cleanCall(club,'join-service');assert(E.sim.perform(club,'club-track'));
cleanCall(club,'practice-track');assert.equal(C.perform(club,'practice-service'),null);
for(let i=0;i<2;i++){tick(club);cleanCall(club,'practice-service');}
club.rng=2;cleanCall(club,'lead');
assert.equal(club.sim.schoolCommunity.captaincies,1);
assert(club.sim.lifeTags.includes('school-group-leader'));
assert.equal(club.sim.schoolCommunity.practices,3);
tick(club);assert(!C.view(club).options.length);
assert(C.view(club).record.length);

const hearing=pupil(12);
assert(E.sim.perform(hearing,'skip-class'));
assert.equal(hearing.sim.schoolCommunity.absences,1);
assert.equal(E.sim.perform(hearing,'skip-class'),null);
tick(hearing);
assert(E.sim.perform(hearing,'skip-class'));
assert.equal(hearing.sim.schoolCommunity.pending.kind,'hearing');
const choices=pending(hearing);assert.equal(choices.length,3);
const make=choices.find(o=>o.id.endsWith('-plan')).id;
const accepted=E.decodeGame(save(hearing)).active;
cleanCall(accepted,make);assert(accepted.sim.schoolCommunity.plan);
const missed=E.decodeGame(save(accepted)).active;
cleanCall(accepted,'makeup');assert(accepted.sim.schoolCommunity.plan.done);
tick(accepted);tick(missed);
assert.equal(accepted.sim.schoolCommunity.plan,null);
assert(accepted.log.some(e=>e.title==='Attendance agreement closed'&&/marked complete/.test(e.body)));
assert(missed.log.some(e=>e.title==='Attendance agreement closed'&&e.delta.grade===-3));
assert.equal(accepted.sim.schoolCommunity.absences,0);
const ignored=E.decodeGame(save(hearing)).active;
tick(ignored);assert(ignored.log.some(e=>e.title==='Hearing concluded'&&e.delta.grade===-4));
for(const [seed,excused] of [[4,true],[0x12121212,false]]){
  const student=E.decodeGame(save(hearing)).active;
  student.rng=seed;student.world.grade=0;
  const t=Object.values(student.people).find(n=>n.role==='Teacher'&&n.atSchool);t.bond=0;t.trust=0;
  const result=cleanCall(student,pending(student).find(o=>o.id.endsWith('-explain')).id);
  assert.equal(/excused/.test(result.text),excused);
}
const missedTown=E.decodeGame(save(hearing)).active;
missedTown.town='osaka';E.year.campus(missedTown);
assert.equal(C.perform(missedTown,make),null,'a different campus cannot answer the old hearing');
const parentSave=save(hearing);
const disk=require(path.join(base,'save.js')).PocketSaves.open({getItem:()=>null,setItem:()=>{}},E,'school-test');
assert(disk.inspectFile(JSON.stringify(parentSave)));
for(const tweak of [s=>s.record='bad',s=>s.plan={due:Infinity,done:false},s=>s.pending.kind='unknown',s=>s.practices=-1]){
  const invalid=clone(parentSave);tweak(invalid.active.run.simulation.schoolCommunity);
  assert.throws(()=>C.validate(E.model.decode(invalid.active)),/Invalid school community/);
  assert.equal(disk.inspectFile(JSON.stringify(invalid)),null);
}

const caseKinds=['credit','exclusion','materials','missed-lesson','demonstration'];
for(const kind of caseKinds){
  let found=null;
  for(let seed=1;seed<150&&!found;seed++){
    const l=pupil(7,2010,seed);if(offer(l,kind,10))found=l;
  }
  assert(found,kind);
  const s=found.sim.schoolCommunity,c=s.pending,n=Object.values(found.people).find(p=>p.id===c.person);
  const l=E.decodeGame(save(found)).active,answered=pending(l);
  assert.equal(answered.length,3);
  for(const answer of answered){
    const run=E.decodeGame(save(l)).active;
    const before=run.rng;
    const result=cleanCall(run,answer.id);
    assert(result.text);assert(run.log.some(e=>e.body===result.text));
    assert(run.sim.schoolCommunity.record.some(x=>x.text===result.text));
    assert.equal(run.sim.schoolCommunity.pending,null);
    assert.equal(run.rng,before);
  }
  // A helpful response creates a bounded, persistent invitation for this NPC next year.
  n.bond=80;n.town=found.town;
  cleanCall(found,pending(found)[0].id);
  assert.equal(s.invitation.person,c.person);
  const originalId=n.id;tick(found);assert.equal(s.invitation,null);
  if(n.atSchool&&n.active){assert.equal(n.id,originalId);assert.equal(n.role,'Friend');}
  // Stale responses cannot affect a former classmate or a deceased/cut-off contact.
  const stale=E.decodeGame(save(l)).active;
  Object.values(stale.people).find(p=>p.id===c.person).cutOff=true;
  assert.equal(C.perform(stale,answered[0].id),null);
}
for(const yes of [true,false]){
  const l=pupil(8,2026);
  for(const p of Object.values(l.people).filter(p=>p.atSchool&&p.job==='Student'))p.rivalry=true;
  assert(offer(l,'truce',10));
  const n=Object.values(l.people).find(p=>p.id===l.sim.schoolCommunity.pending.person);
  l.rng=yes?2:0x12121212;n.trust=yes?90:0;n.generosity=yes?90:0;
  cleanCall(l,pending(l).find(o=>o.id.endsWith('-repair')).id);
  assert.equal(n.rivalry,!yes);
}
const blocked=pupil(11);
blocked.event={id:'lost-wallet',resolved:false};assert.equal(C.perform(blocked,'join-service'),null);
blocked.event={id:null,resolved:true};blocked.sim.prison=2;assert.equal(C.perform(blocked,'join-service'),null);
console.log('School community passed: 6 eras, preschool, clubs, attendance, 5 three-way encounters, peer memory, truce outcomes, old saves and corruption rejection.');
