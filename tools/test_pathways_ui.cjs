'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {base,start}=require('./interface_host.cjs');
const E=require(path.join(base,'engine.js')).PocketEngine;
const diskKey='studio.pocketyears.save.v1';
function character(birthYear,age){
  const life=E.makeLife({seed:392,birthYear,town:'cedar'});
  Object.assign(life,{age,cash:100000,job:null,rng:1});
  life.world.grade=91;life.stats.smarts=91;life.hidden.discipline=90;
  E.year.campus(life);return life;
}
function launch(life,tab){
  const game=E.encodeGame({active:life,archive:[],settings:{motion:'reduced'}});
  return start(new Map([[diskKey,JSON.stringify(game)]]),{hash:'#'+tab,asyncBack:true});
}
function state(u){return E.decodeGame(u.state()).active;}
function settle(u){u.flushBack();u.tick();}
function sheet(u,id){u.click('sheet',id);settle(u);}
function submitOnce(u,act,id){
  const original=u.button(act,id);
  assert(original&&!original.disabled);
  u.click(act,id);settle(u);
  const saved=u.state();
  u.dispatch(original,1,80);settle(u);
  assert.deepEqual(u.state(),saved,'Detached controls must not spend money or repeat decisions');
}
const adult=character(2000,26);
let u=launch(adult,'school');
sheet(u,'path-programs');
const program=E.education.eligible(adult).find(p=>p.level==='bachelor'&&!E.education.quote(adult,p.id,'loan').reason);
assert(program,'An adult with strong grades can apply for a degree');
sheet(u,'path-level~'+program.level);sheet(u,'path-program~'+program.id);
assert(u.el('sheet-title').textContent===program.title);
assert(u.visible().textContent.includes('Entry requirements')&&u.visible().textContent.includes('tuition')&&!/undefined|NaN/.test(u.visible().textContent));
u.history.back();settle(u);
assert(u.button('sheet','path-program~'+program.id),'Android Back resolves a program to its catalog level');
u.key('Escape');settle(u);assert(u.button('sheet','path-level~'+program.level));
sheet(u,'path-level~'+program.level);sheet(u,'path-program~'+program.id);
submitOnce(u,'path-apply',program.id+'~loan');
assert(state(u).sim.program?.pathway,'Application enrolled the candidate and saved the admission');
const enrolled=state(u);
assert(E.sim.debt(enrolled)>0);
sheet(u,'hub-education');assert(u.visible().textContent.includes(program.title));u.click('close');settle(u);
sheet(u,'path-programs');
assert(u.visible().textContent.includes(program.title));
sheet(u,'path-withdraw');submitOnce(u,'path-school-action','withdraw');
assert(!state(u).sim.program&&E.sim.debt(state(u))===E.sim.debt(enrolled));
const retiree=character(1950,70);retiree.job='retired';
const retireeUI=launch(retiree,'school');sheet(retireeUI,'path-programs');
sheet(retireeUI,'path-level~'+program.level);sheet(retireeUI,'path-program~'+program.id);
assert(retireeUI.visible().textContent.includes('You keep your pension while studying and return to retirement when the course ends.'));
console.log('PASS degree catalog, native and keyboard Back, admissions, real tuition debt, active program, withdrawal and duplicate taps');

u=launch(adult,'career');
sheet(u,'jobs');sheet(u,'path-fields');
const entries=Object.entries(E.occupations.entries);
const [jobId,job]=entries.find(([id])=>E.occupations.eligibleYear(adult,id)&&!E.world.jobReason(adult,id));
const field='path-sector~'+encodeURIComponent(job.category);
sheet(u,field);sheet(u,'job-'+jobId);
assert(u.visible().textContent.includes('Entry requirements')&&u.visible().textContent.includes(job.employer));
u.key('Escape');settle(u);assert(u.button('sheet','job-'+jobId));
sheet(u,'job-'+jobId);submitOnce(u,'interview',jobId+'~example');
assert.equal(state(u).job,jobId);
const assignment=E.occupations.caseFor(state(u));assert(assignment);
sheet(u,'path-assignment');const last=state(u).log.length;
submitOnce(u,'path-work-choice',assignment.choices[0].id);
assert(state(u).log.length>last);
assert(!u.button('sheet','path-assignment'));
console.log('PASS career fields, qualification details, interview, contextual assignment and duplicate taps');

const child=character(2008,10);
u=launch(child,'school');sheet(u,'path-community');
const club=E.schoolCommunity.view(child).options.find(o=>o.id.startsWith('join-')&&!o.reason);
assert(club);submitOnce(u,'path-community-action',club.id);
assert(E.schoolCommunity.view(state(u)).options.some(o=>o.id.startsWith('practice-')));
assert(!u.button('sheet','path-programs'));
console.log('PASS school community actions, club membership and age gates');

const old=character(1280,22);
u=launch(old,'school');
sheet(u,'path-programs');
assert(!u.visible().textContent.match(/university of technology|aerospace engineering|doctoral program in computing/i));
u.click('close');settle(u);
u.click('tab','career');settle(u);assert(!u.button('sheet','jobs'));
const tracks=E.performanceStudio.view(old).tracks;
assert(tracks.length);sheet(u,'path-studio');sheet(u,'path-season~'+tracks[0].id);
assert(u.visible().textContent.includes(tracks[0].title));
assert(!/undefined|NaN/.test(u.visible().textContent));
u.key('Escape');settle(u);assert(u.button('sheet','path-season~'+tracks[0].id));
console.log('PASS period study catalog and period-specific performance opportunities');

u=launch(adult,'activities');sheet(u,'xp-hobbies');sheet(u,'path-challenges');
const challenge=E.pathways.challenges(adult).find(c=>!c.reason&&c.status==='available');
assert(challenge);submitOnce(u,'path-challenge',challenge.id);
assert.equal(E.pathways.challenges(state(u)).find(c=>c.id===challenge.id).status,'active');
console.log('PASS challenge conditions, voluntary enrollment and saved progress');

const parent=character(2000,48);
parent.sim.transcript=[{id:program.id,year:2025,honors:true}];
parent.job=jobId;parent.world.level=2;
parent.sim.expansion.awards.push('Ensemble Merit');
parent.sim.performanceStudio={tracks:{music:{skill:45,following:75,completed:3,member:true,history:[]}},rights:[]};
assert(E.world.adopt(parent,'Sol'));
parent.ended=true;
const next=E.continueAs(parent,'kid1');
assert(next);const family={active:parent,archive:[],settings:{motion:'reduced'}};
assert(E.startNext(family,next));
const archive=family.archive[0];
assert.deepEqual(archive.studies,[{title:program.title,year:2025,honors:true}]);
assert.deepEqual(archive.performed,[{id:'music',seasons:3,audience:75}]);
assert(archive.achievements.includes('Ensemble Merit')&&archive.lastSpecialistRole.includes(job.title));
assert.equal(E.education.records(next).length,0);
assert(!next.sim.performanceStudio?.tracks.music);
const saved=E.encodeGame(family);
const archived=start(new Map([[diskKey,JSON.stringify(saved)]]),{hash:'#journal/hist-capsule~0'});
assert(archived.visible().textContent.includes(program.title)&&archived.visible().textContent.includes('With honors'));
assert(archived.visible().textContent.includes('3 seasons completed')&&archived.visible().textContent.includes(job.title));
for(const corrupt of [{studies:[{title:program.title,year:3200,honors:true}]},{performed:[{id:'music',seasons:-3,audience:75}]},{lastSpecialistRole:42}]){
  const invalid=JSON.parse(JSON.stringify(saved));
  Object.assign(invalid.archive[0],corrupt);assert.throws(()=>E.decodeGame(invalid));
}
console.log('PASS dynasty archive, dated qualification, career rank, performance seasons and awards, rejection of damaged records');

const dismissed=character(2000,28);
dismissed.world.grade=38;dismissed.sim.academicReturn={[program.field+'/'+program.level]:E.calendar(dismissed)};
const recovery=launch(dismissed,'school');sheet(recovery,'path-programs');
assert(!state(recovery).sim.program&&recovery.button('path-school-action','return-study'));
submitOnce(recovery,'path-school-action','return-study');
assert(state(recovery).world.grade>dismissed.world.grade);
assert.equal(state(recovery).cash,dismissed.cash);
sheet(recovery,'path-programs');
const repeat=recovery.button('path-school-action','return-study');
assert(!repeat||repeat.disabled);
const associate=E.education.eligible(adult).find(p=>p.level==='associate');
const graduate=character(2000,25);
graduate.sim.transcript=[{id:associate.id,year:2022,honors:false}];
const originalHub=launch(graduate,'school');sheet(originalHub,'hub-education');
assert(originalHub.visible().textContent.includes(associate.title));
console.log('PASS free revision after dismissal through Study and qualifications, duplicate-tap protection, and associate degree display in original university menu');
