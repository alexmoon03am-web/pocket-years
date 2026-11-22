'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const assets = process.env.POCKET_ASSET_DIR || path.join(__dirname,'../app/src/main/assets');
const E = require(path.join(assets,'engine.js')).PocketEngine;
const O=E.occupations, W=E.world, D=E.education, H=E.historyEconomy;
const saves=require(path.join(assets,'save.js')).PocketSaves.open({getItem:()=>null,setItem:()=>{}},E,'occupations');
function adult(year=2026,town='london') {
  const l=E.makeLife({seed:791,town,birthYear:year-22}); l.age=22; l.stats.smarts=85; return l;
}
function transcript(l,id) { (l.sim.transcript??=[]).push({id,year:l.born+l.age,honors:false}); }
function later(l) { l.age++; l.used=[]; W.birthday(l); }
function opening(l,id) {
  for(let i=0;i<12&&W.jobReason(l,id)==='No vacancy this year';i++)later(l);
  assert.equal(W.jobReason(l,id),'',id);
}
function roundTrip(l) {
  const saved=saves.exportFile({version:4,settings:{motion:'system'},active:l,archive:[]});
  const restored=saves.inspectFile(saved);assert(restored);return restored.active;
}
const modern=adult(), medieval=adult(1360), far=adult(3000);
const ids=Object.keys(O.entries);
for(const invalid of ['unknown-application','constructor','__proto__',null]) {
  const before=JSON.stringify(modern);
  assert.equal(W.hire(modern,invalid),null);assert.equal(W.interviewPrompt(invalid),null);
  assert.equal(JSON.stringify(modern),before);
}
assert.equal(new Set(ids).size,ids.length);assert(ids.length>=170);
for(const id of ids){
  const role=O.entries[id];
  assert(Object.hasOwn(W.openings,id));assert.equal(E.jobs[id][0],role.title);
  if(role.level)assert(Object.values(D.programs).some(p=>p.level===role.level&&p.field===role.field),id);
  assert(O.categories.includes(role.category));assert(W.interviewPrompt(id).question.includes(role.assignment.slice(1)));
  assert(O.describe(id));assert(O.rank(modern,id));assert(!O.eligibleYear(medieval,id));
  assert.equal(O.eligibleYear(modern,id),role.year<=2026);
}
assert.match(W.jobReason(medieval,'occ-room-attendant'),/unavailable/);
assert.match(W.jobReason(modern,'occ-light-sail-materials-fellow'),/2900/);
assert.match(W.jobReason(far,'occ-light-sail-materials-fellow'),/doctorate/);
const historicalIds=Object.values(O.historicalRoles).flat().map(row=>'era-'+row[0]);
assert.equal(new Set(historicalIds).size,historicalIds.length);
for(const id of historicalIds)assert(Object.hasOwn(H.jobs,id));
const europe=adult(1320),water=O.historicalRoles.medieval.find(row=>row[0]==='waterkeeper');
assert(!water[6].includes('europe'));
for(let i=0;i<10;i++){assert(!H.actions(europe,'work').some(row=>row.id==='job-era-waterkeeper')); later(europe);}
const beijing=adult(1875,'n1159151595'),london=adult(1875,'london');
const railRoles=new Set(['job-era-railhand','job-era-signals','job-era-stationclerk']);
assert(!E.historyWorld.place(beijing.town,1875).transport.includes('rail'));assert(E.historyWorld.place(london.town,1875).transport.includes('rail'));
assert(H.actions(beijing,'work').every(row=>!railRoles.has(row.id)));
assert(H.actions(london,'work').some(row=>row.id==='job-era-stationclerk'));
for(let seed=0;seed<60;seed++)assert(!railRoles.has('job-'+H.npcJob(beijing,seed).id));
const student=adult(1350);student.stats.smarts=99;student.world.grade=95;student.cash=100000;student.rng=1;
assert(E.educationApply(student,'timber-framing','cash'));assert(student.sim.program);
const activeCourse=JSON.stringify(student);
const denied=H.actions(student,'work').filter(a=>a.id.startsWith('job-era-'));
assert(denied.length>0&&denied.every(a=>a.reason==='Finish or leave your course'));
assert.equal(E.historyPerform(student,'work',denied[0].id),null);
assert.equal(JSON.stringify(student),activeCourse);
const trade=adult(1350);trade.sim.timeline.training=1;
const manual=H.actions(trade,'work').find(row=>historicalIds.includes(row.id.replace('job-',''))&&!row.reason);
assert(manual);assert(E.historyPerform(trade,'work',manual.id));assert(E.sim.budget(trade).wages>0);
const doctor='occ-pediatrician',engineering='occ-structural-engineer';
assert.match(W.jobReason(modern,doctor),/professional qualification/);
transcript(modern,'clinical-medicine');assert.match(W.jobReason(modern,doctor),/3 years/);
modern.sim.workYears=3;modern.sim.record=true;assert.match(W.jobReason(modern,doctor),/record/);
modern.sim.record=false;opening(modern,doctor);
assert.match(W.jobReason(modern,engineering),/engineering/);
transcript(modern,'civil-engineering');opening(modern,engineering);
const guild='occ-site-superintendent';transcript(modern,'timber-framing');modern.sim.workYears=8;
assert.match(W.jobReason(modern,guild),/years in building/);
modern.world.roleYears={electrician:2};opening(modern,guild);
const dual=adult();transcript(dual,'clinical-medicine');transcript(dual,'legal-practice');dual.sim.professional='Law';opening(dual,'physician');
dual.sim.professional='Medicine';opening(dual,'lawyer');
const former=adult();former.sim.degrees=['Law','Medicine'];former.sim.professional='Medicine';opening(former,'lawyer');
const specialist=adult();transcript(specialist,'clinical-medicine');specialist.sim.workYears=9;specialist.world.roleYears={barista:9};
assert.match(W.jobReason(specialist,'occ-anesthesiologist'),/physician practice/);
specialist.world.roleYears.physician=3;opening(specialist,'occ-anesthesiologist');
assert.match(W.jobReason(specialist,'occ-league-official'),/sport & recreation/);
specialist.world.roleYears['occ-recreation-assistant']=2;specialist.world.reputation=10;opening(specialist,'occ-league-official');
const old=adult();old.sim.degree='Science';old.sim.workYears=4;opening(old,'nurse');
const nurse=adult();transcript(nurse,'nursing-associate');opening(nurse,'nurse');
const pharmacy=adult();pharmacy.sim.workYears=5;transcript(pharmacy,'nursing-associate');
assert.match(W.jobReason(pharmacy,'pharmacist'),/degree/);
const cashier=adult(),role='occ-room-attendant';
opening(cashier,role);const quote=E.expansion.economy.salary(cashier,role,E.jobs);
cashier.rng=1;assert(W.interview(cashier,role,'example'));assert.equal(cashier.job,role);
assert.equal(E.sim.budget(cashier).wages,quote);assert(W.jobReason(cashier,role));
assert.equal(E.occupations.categoryOf(role),'Food & hospitality');
const wages=E.expansion.economy;
assert.equal(cashier.world.offerTown,'london');
const transferred=structuredClone(cashier);
W.transferEmployer(transferred,'Northgate Services');
assert.equal(E.sim.budget(transferred).wages,quote,'Employer reassignment keeps agreed terms');
transferred.town='kyoto';
assert.equal(E.sim.budget(transferred).wages,quote,'Relocating cannot reroll an accepted offer');
const reloaded=roundTrip(transferred);assert.equal(E.sim.budget(reloaded).wages,quote);
W.changeJob(transferred,'barista',true);assert.equal(transferred.world.offerTown,undefined);
const qualifiedOffers=[],reference=adult();
for(let i=1;i<=48;i++){
  const person=E.makeLife({seed:i,town:'london',birthYear:2000});person.age=22;
  const base=wages.contractBase(person,role,E.jobs);
  const ratio=base/E.jobs[role][1];assert(ratio>=.709&&ratio<=1.041);
  qualifiedOffers.push(base);
  assert.equal(wages.contractBase(person,'barista',E.jobs),E.jobs.barista[1]);
}
assert(new Set(qualifiedOffers).size>36,'Candidates should receive distinct offers');
const q1=wages.salary(reference,role,E.jobs), rngBefore=reference.rng;
reference.town='kyoto';assert.notEqual(wages.salary(reference,role,E.jobs),q1);
reference.town='london';assert.equal(wages.salary(reference,role,E.jobs),q1);assert.equal(reference.rng,rngBefore);
reference.sim.identity='nonbinary';reference.skin=3;reference.name='Changed name';
assert.equal(wages.salary(reference,role,E.jobs),q1,'Appearance, name and identity cannot change an offer');
const normalSalary=E.sim.budget(cashier).wages;
for(const invalid of ['missing-town',null,{},'constructor']){
  const pack=structuredClone(E.encodeGame({active:cashier,archive:[],settings:{}}));
  pack.active.run.world.offerTown=invalid;assert.equal(saves.inspectFile(JSON.stringify(pack)),null);
}
const mismatched=structuredClone(E.encodeGame({active:cashier,archive:[],settings:{}}));
mismatched.active.run.world.contractRole='barista';assert.equal(saves.inspectFile(JSON.stringify(mismatched)),null);
assert.equal(E.sim.budget(cashier).wages,normalSalary);
const first=O.caseFor(cashier);assert.equal(first.choices.length,3);
const state=JSON.stringify(cashier);assert.equal(E.occupationChoice(cashier,'invented'),null);assert.equal(JSON.stringify(cashier),state);
const colleague=Object.values(cashier.people).find(p=>p.role==='Coworker'&&p.active);assert(colleague);
const before=colleague.bond;const joint=E.occupationChoice(cashier,'delegate');assert(joint);assert(colleague.bond>before);
assert.equal(O.caseFor(cashier),null);assert.equal(E.occupationChoice(cashier,'check'),null);
const restored=roundTrip(cashier);assert.equal(restored.job,cashier.job);assert.equal(O.caseFor(restored),null);
later(cashier);assert.equal(O.caseFor(cashier),null);
later(cashier);assert.notEqual(O.caseFor(cashier).title,first.title);
const quiet=E.occupationChoice(cashier,'check');assert(quiet.delta.smarts>0);assert(quiet.delta.reputation>0);
assert(W.career(cashier,'practice'));assert(W.career(cashier,'promote'));assert.equal(O.rank(cashier,role),'Senior staff');
const pay=E.sim.budget(cashier).wages;assert(pay>quote&&pay<quote*1.6);
function pressFailure(ranked) {
  const l=adult(); W.changeJob(l,role,true);l.sim.expansion.discipline=2;l.world.performance=5;l.hidden.discipline=5;
  l.world.level=ranked?1:0;l.extraPay=ranked?4000:0;
  // Same starting state must give the same risk outcome after import.
  l.rng=0xffffffff>>>8;
  for(let i=0;i<100;i++){
    const trial=structuredClone(l);trial.rng=(l.rng+i*1928371)>>>0;
    const again=structuredClone(trial),result=E.occupationChoice(trial,'press');
    assert(result);assert.deepEqual(E.occupationChoice(again,'press'),result);assert.deepEqual(trial,again);
    if(result.text.includes('written warning'))return trial;
  }
  throw Error('No adverse outcome reached');
}
const demoted=pressFailure(true);assert.equal(demoted.world.level,0);assert(demoted.extraPay<4000);assert.equal(demoted.job,role);
const fired=pressFailure(false);assert.equal(fired.job,null);assert.equal(E.sim.budget(fired).wages,0);
// With every obtainable award and experience, each title must be hireable via normal entry points
// in some calendar year. This catches unreachable prerequisites and malformed job-board IDs.
const qualified=adult(3000);qualified.stats.health=99;qualified.sim.workYears=22;qualified.sim.license=true;
qualified.world.reputation=100;qualified.world.roleYears=Object.fromEntries(ids.map(id=>[id,3]));
for(const program of Object.values(D.programs))transcript(qualified,program.id);
for(const id of ids){
  const life=structuredClone(qualified);opening(life,id);
  assert(W.hire(life,id));assert.equal(life.job,id);assert(E.sim.budget(life).wages>0);
  assert(O.caseFor(life),id);
}
console.log('PASS',ids.length,'new modern/future openings,',historicalIds.length,'period roles,',O.categories.length,
  'career categories; credential gates, regional employment, team trust, promotion, demotion, dismissal, payroll and saved contracts.');
