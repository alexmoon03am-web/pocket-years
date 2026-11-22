'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine;
const catalog=E.education;
const save=require(path.join(base,'save.js')).PocketSaves.open({getItem(){return null;},setItem(){}},E,'school');
function candidate(born=2000,town='london'){
  const l=E.makeLife({name:'Miri Hill',seed:1843,birthYear:born,town});
  l.age=25;l.track='gap';l.cash=155000;l.world.grade=92;l.stats.smarts=85;l.hidden.discipline=80;
  l.event={id:null,resolved:true};
  return l;
}
function submit(l,id,method){
  assert.equal(catalog.quote(l,id,method).reason,'');
  l.rng=7;const out=E.educationApply(l,id,method);
  assert(out&&!out.title.includes('declined'));assert.equal(l.sim.program.field,id);return out;
}
function advance(l){
  assert(E.advance(l));
  while(E.blocking(l)){
    if(l.sim.review)assert(E.acknowledge(l));
    else if(l.sim.court)assert(E.sim.court(l,'plea'));
    else assert(E.decide(l,0));
  }
}
function pass(l,years){
  for(let i=0;i<years;i++){l.world.grade=92;advance(l);assert(!l.ended);}
}
function stored(l){
  const g={active:l,archive:[],settings:{motion:'system'},version:4};
  return save.inspectFile(save.exportFile(g)).active;
}
const workshop=candidate(1260);
assert(catalog.eligible(workshop).some(p=>p.id==='workshop-craft'));
assert(catalog.eligible(workshop).every(p=>p.level==='certificate'));
assert(catalog.quote(workshop,'biology','cash').reason);
assert(!catalog.methods(workshop,'workshop-craft').includes('loan'));
assert.equal(E.educationApply(workshop,'emergency-response','loan'),null);
workshop.sim.dropped=true;submit(workshop,'workshop-craft','cash');
assert.equal(E.state(workshop).currentSchool,'Local workshop');
assert(!E.state(workshop).jobTitle.includes('College'));
pass(workshop,2);assert(workshop.world.tradeQualified);
assert(catalog.hasCredential(workshop,'craft','certificate'));
assert(!catalog.hasCredential(workshop,'craft','bachelor'));
assert(catalog.quote(workshop,'workshop-craft').reason);
const regional=candidate(1570,'london');assert(catalog.methods(regional,'workshop-printing').length);
const other=candidate(1570,E.historyWorld.choices(1570).find(p=>E.historyWorld.region(p.id)==='americas').id);
assert.equal(catalog.methods(other,'workshop-printing').length,0);
const futuristic=candidate(2500);
assert(catalog.eligible(futuristic).some(p=>p.id==='deep-range-navigation'));
assert.equal(catalog.eligible(futuristic).length,Object.keys(catalog.programs).length);
for(const p of catalog.eligible(futuristic)){
  assert(p.years>0&&p.description&&p.icon&&catalog.levels[p.level]);
  assert(Number.isSafeInteger(catalog.quote(futuristic,p.id).tuition));
}
const junior=candidate();junior.age=17;assert.match(catalog.quote(junior,'biology','cash').reason,/18/);
const nursing=candidate();assert.match(catalog.quote(nursing,'advanced-nursing','loan').reason,/undergraduate/);
const bank=nursing.cash,q=catalog.quote(nursing,'nursing-associate','cash');
const stable=structuredClone(nursing);catalog.eligible(nursing);catalog.quote(nursing,'nursing-associate','aid');
assert.deepEqual(nursing,stable,'browsing must leave state and RNG untouched');
submit(nursing,'nursing-associate','cash');assert.equal(nursing.cash,bank-q.fee);
assert.equal(E.educationApply(nursing,'nursing-associate','loan'),null);
const firstCampus=nursing.sim.campusKey;
assert(E.educationAction(nursing,'transfer'));assert.notEqual(nursing.sim.campusKey,firstCampus);
assert.equal(E.educationAction(nursing,'transfer'),null);
pass(nursing,2);assert(catalog.hasProgram(nursing,'nursing-associate'));
assert.equal(E.state(nursing).educationLevel,'Nursing foundations');
assert.equal(catalog.hasCredential(nursing,'nursing','bachelor'),false);
const transfer=catalog.quote(nursing,'nursing-bachelor','loan');assert.equal(transfer.transferCredits,2);assert.equal(transfer.years,2);
submit(nursing,'nursing-bachelor','loan');assert.equal(nursing.sim.loans.tuition.balance,transfer.fee);
assert.equal(nursing.sim.program.credits,2);assert.deepEqual(stored(nursing).sim.program,nursing.sim.program);
pass(nursing,2);assert(catalog.hasCredential(nursing,'nursing','bachelor'));assert(!nursing.sim.program);
assert(catalog.records(nursing).some(r=>r.id==='nursing-bachelor'&&r.honors));
assert.equal(catalog.quote(nursing,'advanced-nursing','loan').reason,'');
assert.match(catalog.quote(nursing,'engineering-master','loan').reason,/undergraduate/);
const debtTerms=candidate();
debtTerms.sim.loans.tuition={balance:1000,principal:100,rate:.025,misses:1};
const extraLoan=catalog.quote(debtTerms,'biology','loan').fee;
submit(debtTerms,'biology','loan');
assert.deepEqual(debtTerms.sim.loans.tuition,{balance:1000+extraLoan,principal:100+Math.ceil(extraLoan/10),rate:.025,misses:1});
const merit=candidate();submit(merit,'biology','scholarship');
assert(merit.sim.lifeTags.includes('scholarship'));assert.equal(merit.sim.loans.tuition,undefined);
const academic=candidate();submit(academic,'civil-engineering','cash');pass(academic,1);
assert.equal(catalog.quote(academic,'mechanical-engineering','cash').transferCredits,1);
submit(academic,'mechanical-engineering','cash');pass(academic,3);
submit(academic,'engineering-master','cash');pass(academic,2);
assert(!catalog.hasCredential(academic,'engineering','doctorate'));
submit(academic,'engineering-doctorate','loan');pass(academic,4);
assert(catalog.hasCredential(academic,'engineering','doctorate'));assert(!catalog.hasCredential(academic,'engineering','professional'));
assert.deepEqual(stored(academic).sim.transcript,academic.sim.transcript);
const dismissal=candidate();submit(dismissal,'biology','loan');dismissal.world.grade=10;advance(dismissal);
assert(dismissal.sim.program.probation);assert.equal(dismissal.sim.program.credits,0);
dismissal.world.grade=19;advance(dismissal);assert.equal(dismissal.sim.program,null);assert.equal(dismissal.job,null);
assert(!catalog.hasProgram(dismissal,'biology'));assert(dismissal.log.some(e=>e.title==='Academic dismissal'));
assert.match(catalog.quote(dismissal,'chemistry','loan').reason,/Readmission/);
assert(catalog.actions(dismissal).some(o=>o.id==='return-study'));
assert(E.educationAction(dismissal,'return-study'));assert.equal(E.educationAction(dismissal,'return-study'),null);
assert.deepEqual(stored(dismissal).sim.academicReturn,dismissal.sim.academicReturn);
advance(dismissal);assert(E.educationAction(dismissal,'return-study'));
assert(dismissal.world.grade>=50);submit(dismissal,'biology','loan');
assert.equal(dismissal.sim.academicReturn,undefined);
const support=candidate();support.cash=0;assert.equal(catalog.quote(support,'biology','aid').fee,0);
assert(catalog.quote(support,'biology','cash').reason);submit(support,'biology','aid');
assert.equal(support.cash,0);assert.equal(support.sim.loans.tuition,undefined);
const rehabilitation=candidate();submit(rehabilitation,'biology','cash');rehabilitation.world.grade=42;advance(rehabilitation);
assert(rehabilitation.sim.program.probation);
assert(E.educationAction(rehabilitation,'tutorial'));assert.equal(E.educationAction(rehabilitation,'tutorial'),null);
advance(rehabilitation);assert(!rehabilitation.sim.program.probation);assert(rehabilitation.sim.program.credits>0);
assert(E.educationAction(rehabilitation,'withdraw'));assert.equal(E.educationAction(rehabilitation,'withdraw'),null);
const rejected=candidate();rejected.world.grade=27;rejected.stats.smarts=20;rejected.hidden.discipline=12;
assert(catalog.quote(rejected,'biology','scholarship').reason);
const cutoff=catalog.quote(rejected,'biology','cash').chance/100;
for(let seed=1;;seed++){
  let v=seed;v^=v<<13;v^=v>>>17;v^=v<<5;
  if((v>>>0)/4294967296>=cutoff){rejected.rng=seed;break;}
}
const before=rejected.cash,r=E.educationApply(rejected,'biology','cash');
assert.equal(r.title,'Application declined');assert.equal(rejected.cash,before);assert.equal(rejected.sim.program,null);
assert.equal(E.educationApply(rejected,'chemistry','loan'),null);
const legacy=candidate();legacy.sim.degree='Science';legacy.sim.degrees=['Science'];
assert(catalog.hasCredential(legacy,'science','bachelor'));assert.equal(catalog.quote(legacy,'clinical-medicine','cash').reason,'');
function retiredStudent(id){
  const l=candidate(1950);l.age=62;
  assert(E.sim.perform(l,'retire-now'));
  // An older save may carry a different agreed pension; the contract must survive intact.
  l.extraPay=675;
  const pension=E.sim.budget(l).pension;
  assert(pension>0);submit(l,id,'cash');
  const summary=E.sim.budget(l);
  assert.equal(summary.pension,pension);assert.equal(summary.wages,0);assert.equal(summary.gross,pension);
  assert.equal(E.state(l).retired,true);assert.equal(E.sim.perform(l,'retire-now'),null);
  assert.equal(E.educationApply(l,id,'cash'),null);assert.equal(l.sim.studyPension,pension);
  return {l,pension};
}
function checkRetired(l,pension){
  assert.equal(l.job,'retired');assert.equal(l.sim.program,null);assert.equal(l.sim.studyPension,undefined);
  assert.equal(E.sim.budget(l).wages,0);assert.equal(E.sim.budget(l).pension,pension);
}
const later=retiredStudent('civil-engineering');pass(later.l,1);
assert.equal(later.l.sim.lastBudget.pension,later.pension);assert.equal(later.l.sim.lastBudget.wages,0);
submit(later.l,'mechanical-engineering','cash');assert(E.educationAction(later.l,'transfer'));
const loaded=stored(later.l);assert.equal(E.sim.budget(loaded).pension,later.pension);
assert(E.educationAction(loaded,'withdraw'));checkRetired(loaded,later.pension);
pass(later.l,3);checkRetired(later.l,later.pension);
const olderFail=retiredStudent('biology');olderFail.l.world.grade=9;advance(olderFail.l);
olderFail.l.world.grade=8;advance(olderFail.l);checkRetired(olderFail.l,olderFail.pension);
const prisoner=retiredStudent('biology');
prisoner.l.sim.court={id:'theft',term:2,fine:50};
assert(E.sim.court(prisoner.l,'plea'));
assert.equal(prisoner.l.sim.prison,1);assert.equal(prisoner.l.job,'retired');
assert.equal(prisoner.l.sim.program,null);assert.equal(prisoner.l.sim.studyPension,undefined);
assert.equal(E.sim.budget(prisoner.l).pension,0);
E.acknowledge(prisoner.l);advance(prisoner.l);checkRetired(prisoner.l,prisoner.pension);
assert.throws(()=>catalog.validate({...loaded,sim:{...loaded.sim,studyPension:900}}));
const olderTrade=candidate();olderTrade.world.credential='trade';olderTrade.world.tradeQualified=true;
assert(catalog.hasCredential(olderTrade,'craft','certificate'));
submit(olderTrade,'clinical-support','cash');pass(olderTrade,2);
assert(catalog.hasCredential(olderTrade,'craft','certificate'));assert(catalog.hasCredential(olderTrade,'health','certificate'));
const firstTrade=candidate();submit(firstTrade,'clinical-support','cash');pass(firstTrade,2);
assert(!catalog.hasCredential(firstTrade,'craft','certificate'));
const bad=structuredClone(academic);bad.sim.transcript.push({...bad.sim.transcript[0]});assert.throws(()=>catalog.validate(bad));
const corrupted=structuredClone(nursing);corrupted.sim.program={pathway:true,field:'invented'};assert.throws(()=>catalog.validate(corrupted));
console.log('PASS '+Object.keys(catalog.programs).length+' programs, historical and regional access, grants, loans, admissions, credit transfers, two postgraduate levels, probation, dismissal, withdrawal, transcripts and save round-trip.');
