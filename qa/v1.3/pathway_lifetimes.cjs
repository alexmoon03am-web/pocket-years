'use strict';

// This balance panel uses the same commands as the game. No age, grades,
// starting money, qualifications, family members or employment are injected.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const assets = path.resolve(process.env.POCKET_ASSET_DIR || path.join(__dirname, '../../app/src/main/assets'));
const E = require(path.join(assets, 'engine.js')).PocketEngine;
const Saves = require(path.join(assets, 'save.js')).PocketSaves;
const count = Number(process.argv[2] || 64);
assert(Number.isInteger(count) && count >= 1 && count <= 2000);
const disk = Saves.open({getItem: () => null, setItem() {}}, E, 'benchmark');
const jobs = Object.keys(E.occupations.entries);
const townIds = {cairo:'n1159151603', delhi:'n1159151405', london:'london', kyoto:'kyoto'};
const cases = [
  {town:'kyoto', year:1200, courses:['workshop-craft']},
  {town:'cairo', year:1550, courses:['market-books']},
  {town:'delhi', year:1800, courses:['timber-framing']},
  {town:'london', year:1910, courses:['biology','clinical-medicine']},
  {town:'cairo', year:1991, courses:['nursing-associate','nursing-bachelor']},
  {town:'london', year:2000, courses:['biology','clinical-medicine'], target:'occ-pediatrician'},
  {town:'kyoto', year:2026, courses:['workshop-craft'], target:'occ-cabinetmaker'},
  {town:'delhi', year:2026, courses:['civil-engineering','engineering-master','engineering-doctorate']},
  {town:'london', year:2026, courses:['biology'], withdraw:true},
  {town:'delhi', year:2026, courses:['nursing-associate'], lowEffort:true},
  {town:'delhi', year:2026, courses:['nursing-associate'], lowEffort:true, rebuild:true},
  {town:'kyoto', year:2080, courses:['orbital-systems']},
  {town:'cairo', year:2500, courses:['orbital-systems','space-master','space-doctorate']},
  {town:'london', year:3000, courses:['nursing-associate','nursing-bachelor']}
];
function decisions(l) {
  while (E.blocking(l)) {
    if (l.sim.review) assert(E.acknowledge(l));
    else if (l.sim.court) assert(E.sim.court(l,'plea'));
    else {
      const event = E.stories[l.event.id];
      const independent = event.choices.findIndex(c => c.change?.gap || c.change?.jobSearch);
      const index = independent >= 0 ? independent : E.model.hash(l.id + '/' + l.age + '/' + event.id) % event.choices.length;
      assert(E.decide(l, index));
    }
  }
}
function getJob(l, policy, spin) {
  if (l.sim.program || l.sim.prison || l.age < 18 || l.age > 64 || l.job === 'retired') return;
  if (E.isHistorical(l)) {
    if (l.job) return;
    const offer = E.historyEconomy.actions(l, 'work').find(row => row.id.startsWith('job-') && !row.reason);
    if (offer) E.historyPerform(l, 'work', offer.id);
    return;
  }
  if (policy.target && l.job !== policy.target && !E.world.jobReason(l,policy.target)) {
    E.world.interview(l,policy.target,'example');
  }
  if (l.job) return;
  for (let i=0; i<jobs.length; i++) {
    const id=jobs[(spin + i) % jobs.length];
    if (E.occupations.eligibleYear(l,id) && !E.world.jobReason(l,id)) {
      E.world.interview(l,id,'example');
      break;
    }
  }
}
function lifetime(policy, index) {
  const seed=Math.imul(index+1, 2246822519) >>> 0;
  let l=E.makeLife({seed,birthYear:policy.year,town:townIds[policy.town]});
  assert.equal(l.town,townIds[policy.town]);
  const trace={graduated:0,finishedTrack:0,admitted:0,declined:0,withdrew:0,dismissals:0,jobs:[],cases:0,target:0,roundTrips:0,pay35:null};
  while (!l.ended) {
    decisions(l);
    const recovering = policy.rebuild && trace.dismissals>0;
    if (l.age >= 5 && l.age < 18) {
      if (E.isHistorical(l)) E.historyPerform(l,'school','lesson-0');
      else if (policy.lowEffort) E.sim.perform(l,'school-slack');
      else E.world.career(l,'study');
    }
    if (l.age === 14) {
      if (E.isHistorical(l)) E.historyPerform(l,'work','shift');
      else E.world.career(l,'paper');
    }
    if (l.age >=18 && l.age<60 && !trace.withdrew) {
      if (recovering && !l.sim.program) E.educationAction(l,'return-study');
      const next = policy.courses.find(id=>!E.education.hasProgram(l,id));
      if (next && !l.sim.program) {
        const funding = E.education.methods(l,next);
        const preference = index%2 ? ['aid','loan','scholarship','cash'] : ['scholarship','loan','aid','cash'];
        const method = preference.find(m => funding.includes(m) && !E.education.quote(l,next,m).reason);
        if (method) {
          assert(E.educationApply(l,next,method));
          if (l.sim.program?.field === next) trace.admitted++;
          else trace.declined++;
          assert(!E.educationApply(l,next,method),'Duplicate application at '+E.calendar(l));
        }
      }
      if (l.sim.program?.pathway) {
        if (policy.withdraw && E.calendar(l)>l.sim.program.start) {
          assert(E.educationAction(l,'withdraw')); trace.withdrew++;
        } else if (policy.lowEffort && !recovering) E.sim.perform(l,'school-slack');
        else assert(E.educationAction(l,'tutorial'));
      }
    }
    getJob(l,policy,(seed % jobs.length+l.age) % jobs.length);
    if (l.job?.startsWith('occ-') && !trace.jobs.includes(l.job)) trace.jobs.push(l.job);
    if (policy.target && l.job===policy.target) trace.target=1;
    const work=E.occupations.caseFor(l);
    if (work) {
      const id=work.choices[(index+l.age)%work.choices.length].id;
      assert(E.occupationChoice(l,id));
      assert(!E.occupationChoice(l,id),'Duplicate workplace decision');
      trace.cases++;
    }
    if (l.age===35) trace.pay35=E.sim.budget(l).wages;
    const age=l.age,logLength=l.log.length;
    assert(Number.isSafeInteger(l.cash) && l.cash>=0 && Number.isSafeInteger(E.world.netWorth(l)));
    assert(E.advance(l)); assert.equal(l.age,age+1); assert(l.age<=110);
    trace.dismissals+=l.log.slice(logLength).filter(row=>row.title==='Academic dismissal').length;
    if (index%8===0 && l.age%10===0) {
      const raw=disk.exportFile({version:4,active:l,archive:[],settings:{motion:'reduced'}});
      const restored=disk.inspectFile(raw);
      assert(restored,'Unplayable save '+[policy.year,policy.town,seed,l.age,l.job].join('/'));
      assert.deepEqual(restored.active.sim.transcript,l.sim.transcript);
      assert.equal(restored.active.rng,l.rng);assert.equal(restored.active.cash,l.cash);
      assert.deepEqual(restored.active.sim.program,l.sim.program);
      l=restored.active;trace.roundTrips++;
    }
  }
  assert(l.sim.cause && !E.advance(l));
  trace.graduated=policy.courses.filter(id=>E.education.hasProgram(l,id)).length;
  trace.finishedTrack=Number(trace.graduated===policy.courses.length);
  trace.age=l.age;
  return trace;
}
function summarize(policy) {
  for (const id of policy.courses) assert(E.education.programs[id],id);
  if (policy.target) assert(E.occupations.entries[policy.target],policy.target);
  const sample=Array.from({length:count},(_,i)=>lifetime(policy,i));
  assert.deepEqual(lifetime(policy,0),sample[0],'Seeded replay mismatch');
  const ages=sample.map(t=>t.age).sort((a,b)=>a-b);
  const wages=sample.map(t=>t.pay35).filter(Number.isFinite).sort((a,b)=>a-b);
  const total=id=>sample.reduce((n,t)=>n+t[id],0);
  const result={...policy,lives:count,birthdays:total('age'),admissions:total('admitted'),admissionRefusals:total('declined'),
    credentials:total('graduated'),completedPaths:total('finishedTrack'),withdrawals:total('withdrew'),dismissals:total('dismissals'),
    newJobs:new Set(sample.flatMap(t=>t.jobs)).size,workDecisions:total('cases'),reachedTarget:total('target'),
    saveImports:total('roundTrips'),medianDeathAge:ages[Math.floor(ages.length/2)],medianWage35:wages[Math.floor(wages.length/2)]??null};
  console.error(result.year,result.town,result.courses.join('→'),result.completedPaths+'/'+count,'completed',result.workDecisions,'work decisions');
  return result;
}
const report=cases.map(summarize);
if (count>=32) {
  assert(report.some(c=>c.admissionRefusals>0));
  for (const c of report) {
    if (c.withdraw) assert(c.withdrawals>0 && c.completedPaths===0);
    else if (c.rebuild) assert(c.dismissals>0 && c.completedPaths>0,'The returning-student path is unreachable');
    else if (c.lowEffort) assert(c.dismissals>0,'No academic dismissals in the low-effort cohort');
    else assert(c.completedPaths>0, 'Unreachable pathway '+c.courses.join('→')+' in '+c.year+' '+c.town);
    if (c.target) assert(c.reachedTarget>0,'Nobody reached '+c.target);
  }
}
console.log(JSON.stringify(report,null,2));
