'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine,S=E.sim,W=E.world,M=E.model;
const Save=require(path.join(base,'save.js')).PocketSaves;
const clone=x=>JSON.parse(JSON.stringify(x));
function at(age,settings={}){
  const l=E.makeLife({seed:314,name:'Rae Lane',town:'cedar'});Object.assign(l,{age,track:age<18?null:'gap',cash:age<18?0:65000,...settings});
  E.year.workplace(l);E.year.campus(l);return l;
}
function answer(l,index=0){while(E.blocking(l)){if(l.sim.review)assert(E.acknowledge(l));else if(l.sim.court)assert(S.court(l,'plea'));else assert(E.decide(l,Math.min(index,E.stories[l.event.id].choices.length-1)));}}
function step(l){answer(l);assert(E.advance(l));answer(l);}
function ageTo(l,n){while(l.age<n){assert(!l.ended);step(l);}}
const req=['id','firstName','lastName','gender','country','city','age','alive','causeOfDeath','bankBalance','debt','monthlyExpenses','netWorth',
  'stats','hiddenStats','educationLevel','currentSchool','major','gpa','schoolActivities','jobTitle','employer','salary','jobPerformance','yearsAtJob','retired',
  'criminalRecord','inPrison','prisonSentenceYears','illnesses','injuries','addictions','lifeTags','npcs'];
const npcFields=['id','fullName','relation','gender','age','alive','relationship','generosity','craziness','wealth','job','traits'];
const baseLife=at(0),view=E.state(baseLife);
for(const k of req)assert(Object.prototype.hasOwnProperty.call(view,k),k);
assert.deepEqual(Object.keys(view.stats).sort(),['happiness','health','looks','smarts']);
assert.equal(Object.keys(view.hiddenStats).length,7);
for(const p of view.npcs)for(const k of npcFields)assert(Object.prototype.hasOwnProperty.call(p,k),k);
assert(view.npcs.some(p=>p.relation==='Mother')&&view.npcs.some(p=>p.relation==='Father'));
for(const a of Object.values(S.actions))assert(fs.existsSync(path.join(base,'art',a.icon+'.png')),a.id);
assert.equal(S.tax(13000),0);assert.equal(S.tax(36000),2760);assert.equal(S.tax(85000),12560);assert(S.tax(200000)/200000>S.tax(50000)/50000);

assert.deepEqual(E.makeLife({seed:0}),E.makeLife({seed:0}));
const gated=at(18),rule={rule:{minAge:18,maxAge:22,lifeStage:['adult'],requiredStats:{smarts:75},requiredTags:['invited'],excludedTags:['declined'],relation:'partner'}};
gated.stats.smarts=80;M.tag(gated,'invited');assert(!E.events.eligible(gated,rule));
assert(W.meet(gated));assert(E.events.eligible(gated,rule));gated.stats.smarts=70;assert(!E.events.eligible(gated,rule));
gated.stats.smarts=80;M.tag(gated,'declined');assert(!E.events.eligible(gated,rule));
const weighted={branches:[{weight:1,stat:'smarts',scale:.10,text:'first'},{weight:3,text:'second'}]};
gated.stats.smarts=0;assert.equal(E.events.choose(gated,weighted,()=>.5).text,'second');
gated.stats.smarts=100;assert.equal(E.events.choose(gated,weighted,()=>.5).text,'first');
const beginnings=new Set();
for(let seed=1;seed<=35;seed++){
  const first=E.makeLife({seed:Math.imul(seed,238967),thread:'box'});assert(first.log[0].body.startsWith('I was born'));
  assert(E.advance(first));beginnings.add(first.event.id);assert(!['box','lens-start','atlas-start'].includes(first.event.id));
}
assert(beginnings.has(null)&&beginnings.size>1);
const school=at(4);ageTo(school,5);assert.equal(E.state(school).currentSchool,'Maple Elementary');
ageTo(school,11);assert.equal(E.state(school).currentSchool,'Eastside Middle');assert(S.perform(school,'club-debate'));assert(S.perform(school,'skip-class'));assert.equal(S.perform(school,'skip-class'),null);
ageTo(school,14);assert.equal(E.state(school).currentSchool,'Central High');assert(W.career(school,'odd'));assert.equal(school.cash,0);
step(school);assert.equal(school.cash,340);assert.equal(E.state(school).yearsAtJob,1);assert.equal(E.state(school).employer,'Neighborhood households');assert(W.career(school,'leave-shift'));assert(E.act(school,'openmic'));assert.equal(school.cash,340);
step(school);if(school.world.partJob)assert(W.career(school,'leave-shift'));assert(S.perform(school,'drop-school'));
ageTo(school,18);assert.equal(E.state(school).currentSchool,null);assert.equal(S.perform(school,'course-science'),null);
school.cash=5000;assert(S.perform(school,'equivalency'));assert(S.perform(school,'course-science'));assert.equal(S.debt(school),6000);assert.equal(W.interview(school,'guide','honest'),null);
ageTo(school,22);assert.equal(school.sim.degree,'Science');school.stats.smarts=92;assert(S.perform(school,'course-medicine'));
ageTo(school,26);assert.equal(school.sim.professional,'Medicine');school.stats.smarts=92;if(W.jobReason(school,'physician')==='No vacancy this year')step(school);school.rng=3;assert(W.interview(school,'physician','example'));
assert.equal(school.job,'physician');assert(E.state(school).npcs.some(n=>n.relation==='Boss'));assert(E.state(school).npcs.some(n=>n.relation==='Coworker'));
const oldStaff=school.people[Object.keys(school.people).find(id=>school.people[id].role==='Boss')].id;
assert(W.career(school,'practice'));assert(W.career(school,'practice'));assert(W.career(school,'promote'));school.rng=5;assert(S.perform(school,'raise'));
assert(school.sim.peak.salary>154000);assert(S.perform(school,'resign'));assert(E.state(school).npcs.some(n=>n.id===oldStaff&&n.relation==='Former boss'));
const sixty=at(62,{job:'clerk'});assert(S.perform(sixty,'retire-now'));assert(S.budget(sixty).pension>0);assert.equal(S.budget(sixty).wages,0);
const fired=at(35,{job:'guide'});fired.world.performance=15;assert(S.perform(fired,'work-slack'));assert.equal(fired.job,null);assert(fired.sim.lifeTags.includes('fired'));

const owner=at(34,{job:'physician'}),home=W.shopping.inventory(owner,'maple')[0],car=W.shopping.inventory(owner,'corner')[0];
assert(S.mortgage(owner,home.id));const cost=home.price,down=S.downPayment(home),funds=65000-down;
assert.equal(owner.cash,funds);assert.equal(S.debt(owner),cost-down);assert.equal(S.mortgage(owner,home.id),null);
assert(S.perform(owner,'invest'));assert(S.perform(owner,'side-hustle'));assert(S.takeTest(owner,'stop'));assert(W.trade(owner,car.id,'buy'));
const b=S.budget(owner),opening=owner.cash,debt=S.debt(owner),condition=owner.world.owned[car.id].condition;
assert.equal(b.housing,0);assert.equal(b.yieldIncome,Math.floor(owner.sim.fund*E.expansion.economy.local(owner).yield));assert.equal(b.side,1200);assert.equal(b.tax,Math.floor(S.tax(b.gross)*E.expansion.economy.local(owner).tax));assert(b.upkeep>0&&b.interest>0);
assert(E.advance(owner));assert.equal(owner.cash,opening+b.net);assert.equal(S.debt(owner),debt+b.interest-b.payment);assert(owner.world.owned[car.id].condition<condition);answer(owner);
const quote=W.repairQuote(owner,car.id),pre=owner.cash;assert(W.repair(owner,car.id));assert.equal(owner.cash,pre-quote);assert.equal(owner.world.owned[car.id].condition,100);
const beforeSale=W.netWorth(owner);assert(W.trade(owner,home.id,'sell'));assert.equal(W.netWorth(owner),beforeSale);assert.equal(S.debt(owner),0);
assert(S.perform(owner,'redeem'));assert.equal(owner.sim.fund,0);assert(S.relocate(owner,'osaka'));assert.equal(E.state(owner).country,'Japan');assert.equal(owner.sim.birthplace,'cedar');
const broke=at(32,{cash:0});const charges=S.budget(broke);assert(charges.housing>0&&charges.living>0);step(broke);assert.equal(broke.cash,0);assert(S.debt(broke)>0);
const student=at(22);student.world.grade=78;assert(S.perform(student,'apprentice'));ageTo(student,26);assert.equal(student.world.credential,'trade');

const rel=at(28);assert(S.perform(rel,'friend'));const who='friend-'+rel.age,p=rel.people[who],id=p.id;
assert(W.social(rel,who,'talk'));assert(W.social(rel,who,'compliment'));assert(W.social(rel,who,'gift'));
const wealth=p.wealth;assert(W.social(rel,who,'money'));assert.equal(p.wealth,wealth+50);
assert(W.social(rel,who,'insult'));assert(W.social(rel,who,'argue'));rel.rng=7;assert(W.social(rel,who,'askout'));assert.equal(rel.people.love.id,id);
step(rel);for(let i=0;i<3;i++)assert(W.social(rel,'love','visit'));assert(W.social(rel,'love','propose'));step(rel);assert(W.social(rel,'love','marry'));
rel.rng=2;assert(S.perform(rel,'baby','Devon'));assert.equal(rel.sim.expecting.name,'Devon');step(rel);assert.equal(rel.people.kid1.name,'Devon');
const beforeDiv=rel.cash,spouseWealth=rel.people.love.wealth;assert(W.social(rel,'love','separate'));assert.equal(rel.cash,beforeDiv-Math.floor(beforeDiv/2));assert.equal(rel.people.love.wealth,spouseWealth+Math.floor(beforeDiv/2));
assert(W.social(rel,'carer','cutoff'));assert.equal(W.social(rel,'carer','visit'),null);
const relative=at(12);relative.people.carer.bornYear=relative.born-94;relative.people.carer.wealth=5000;
step(relative);assert(relative.people.carer.diedAt);assert(relative.sim.trust>0);assert.equal(relative.cash,0);
const left=relative.sim.trust;ageTo(relative,18);assert(relative.cash>=left);assert.equal(relative.sim.trust,0);
const widow=at(45);assert(W.meet(widow));const late=widow.people.love;
late.role='Spouse';late.bornYear=widow.born+widow.age-102;late.wealth=12000;
const fullName=late.fullName,age=widow.age,credit=Math.floor((late.wealth+120+(late.generosity<50?450:180))*.8);
step(widow);assert.equal(late.fullName,fullName);assert.equal(late.diedAt,age+1);
assert(widow.log.some(e=>e.age===age+1&&e.title==='An inheritance'&&e.delta.cash===credit));
assert(!W.isPartner(widow));assert.equal(E.state(widow).npcs.find(n=>n.id===late.id).age,103);
const single=at(45);const profiles=W.matches(single);assert.deepEqual(W.matches(single),profiles);single.rng=2;
const oldBank=single.cash;assert(W.match(single,1));assert.equal(single.cash,oldBank-15);assert.equal(single.people.love.fullName,profiles[1].fullName);
assert.equal(M.ageOf(single,single.people.love),profiles[1].age);assert.equal(W.match(single,2),null);assert(W.matchReason(at(14),0));
const heirs=at(80,{cash:21871,job:'guide'});assert(W.adopt(heirs,'Mia'));heirs.used=[];assert(W.adopt(heirs,'Noel'));heirs.people.kid2.bornAt=51;
const familyHome=W.shopping.inventory(heirs,'maple')[0];assert(S.mortgage(heirs,familyHome.id));assert(W.trade(heirs,'camera','buy'));heirs.sim.fund=777;heirs.sim.trust=420;
const equalPlan=S.estate(heirs);assert.equal(equalPlan.kid1.total+equalPlan.kid2.total,W.netWorth(heirs));assert(equalPlan.kid1.assets[familyHome.id]&&equalPlan.kid1.loans[familyHome.id]);
assert(S.setWill(heirs,'kid1'));assert.equal(S.share(heirs,'kid2'),0);assert.equal(S.share(heirs,'kid1'),W.netWorth(heirs));
heirs.ended=true;heirs.sim.cause='Old age';const kidId=heirs.people.kid1.id,inherit=S.estate(heirs).kid1,heir=E.continueAs(heirs,'kid1');
assert.equal(heir.id,kidId);assert.equal(heir.age,0);assert.equal(heir.cash,0);assert.equal(heir.sim.trust,inherit.cash);assert.equal(heir.world.owned[familyHome.id].value,inherit.assets[familyHome.id].value);
assert.equal(W.netWorth(heir),inherit.total);assert.equal(W.trade(heir,'camera','sell'),null);assert.equal(E.continueAs(heirs,'kid1'),null);assert.equal(heir.sim.generation,2);
const insolvent=at(82,{cash:0});insolvent.people.kid1=clone(heirs.people.kid1);insolvent.sim.loans.living={balance:6800,principal:350};
assert.equal(S.estate(insolvent).kid1.total,0);

const health=at(33);health.sim.injuries.push({name:'sprain',severity:32,years:0});health.sim.illnesses.push({name:'joint condition',severity:50,chronic:true,years:3,treated:false});
assert(S.perform(health,'doctor'));assert(health.sim.illnesses[0].treated);const oldSeverity=health.sim.illnesses[0].severity;step(health);assert(health.sim.illnesses[0].severity<oldSeverity);step(health);assert(!health.sim.injuries.length);
health.rng=1;assert(S.perform(health,'surgery'));assert(health.sim.injuries.some(x=>x.name==='surgical injury'));assert(health.sim.lifeTags.includes('botched-surgery'));
health.hidden.addictionRisk=100;health.rng=1;assert(S.perform(health,'nightclub'));assert(health.sim.addictions.some(x=>x.substance==='alcohol'));assert(S.perform(health,'therapy'));
assert(S.perform(health,'rehab'));assert(health.sim.addictions[0].sober);const bank=health.cash;health.rng=1;assert(S.perform(health,'lottery'));assert.equal(health.cash,bank+395);
health.rng=3;assert(S.perform(health,'casino'));assert.equal(health.cash,bank+495);
const bad=at(28,{cash:80,job:'guide'});bad.rng=1;assert(S.perform(bad,'robbery'));assert.equal(E.blocking(bad),'court');assert(!E.advance(bad));assert.equal(W.trade(bad,'flat','buy'),null);
assert(S.court(bad,'plea'));assert.equal(E.blocking(bad),'outcome');assert.equal(bad.sim.offenses[0].offense,'Bank robbery');assert.equal(bad.sim.prison,7);
assert(bad.sim.review.delta.debt>0);assert(E.acknowledge(bad));assert(S.perform(bad,'yard'));assert(S.perform(bad,'library'));assert.equal(S.perform(bad,'nightclub'),null);
for(let n=0;n<7;n++)step(bad);assert.equal(bad.sim.prison,0);assert(W.jobReason(bad,'physician').includes('Clean record'));
for(const id of ['pickpocket','theft','auto','burglary','robbery']){const a=at(22);a.rng=3;assert(S.perform(a,id));assert(a.sim.court);assert(S.court(a,'counsel'));assert(a.sim.review);}
const storing=new Map(),disk=Save.open({getItem:k=>storing.get(k),setItem:(k,v)=>storing.set(k,v)},E,'test-game');
const g={version:4,active:owner,archive:[heirs],settings:{motion:'reduced'}};assert(disk.manual(g));const now=clone(E.encodeGame(g));step(owner);assert(disk.save(g));const restored=disk.restore();
assert.deepEqual(E.encodeGame(restored),now);assert.deepEqual(E.encodeGame(disk.load()),now);
storing.set('test-game.manual','broken');assert.equal(disk.restore(),null);assert.deepEqual(E.encodeGame(disk.load()),now);
const enrolled=at(12),classEntries=Object.entries(enrolled.people).filter(([,p])=>p.atSchool);
const [teacherKey,tutor]=classEntries.find(([,p])=>p.role==='Teacher'),[peerKey,peer]=classEntries.find(([,p])=>p.role==='Classmate');
const peerId=peer.id,tutorId=tutor.id,grade=enrolled.world.grade;
assert(W.social(enrolled,teacherKey,'help-school'));assert.equal(enrolled.world.grade,Math.min(100,grade+7));
assert(W.social(enrolled,peerKey,'study-pair'));enrolled.rng=1;assert(W.social(enrolled,peerKey,'befriend'));assert.equal(peer.role,'Friend');
enrolled.event={id:'lunch-seat',resolved:true};
const reloadCampus=E.decodeGame(clone(E.encodeGame({active:enrolled,archive:[],settings:{}}))).active;
assert.equal(reloadCampus.people[peerKey].id,peerId);assert.equal(reloadCampus.people[teacherKey].id,tutorId);
enrolled.event={id:'group-lab',resolved:false,person:peerKey};const oldBond=peer.bond;
assert(E.decide(enrolled,0));assert.equal(peer.bond,Math.min(100,oldBond+8));assert(E.acknowledge(enrolled));
ageTo(enrolled,14);assert.equal(peer.role,'Friend');assert(!peer.atSchool&&peer.active);
assert(!tutor.active);assert.equal(tutor.role,'Former teacher');assert(Object.values(enrolled.people).some(p=>p.role==='Teacher'&&p.id!==tutorId));
const employed=at(31,{job:'barista'}),bossKey=Object.keys(employed.people).find(k=>employed.people[k].role==='Boss'),workPeer=Object.keys(employed.people).find(k=>employed.people[k].role==='Coworker');
const performance=employed.world.performance;assert(W.social(employed,bossKey,'feedback'));assert(W.social(employed,workPeer,'collaborate'));assert.equal(employed.world.performance,performance+11);
const ordinary=at(17,{job:null,cash:0});step(ordinary);assert.equal(ordinary.track,'gap');assert.equal(ordinary.job,null);assert.equal(ordinary.sim.program,null);
const hireable=Object.keys(W.openings).filter(k=>!W.jobReason(ordinary,k));assert(hireable.includes('barista'));
assert.equal(ordinary.cash,0);ordinary.rng=1;assert(W.interview(ordinary,'barista','example'));assert.equal(E.state(ordinary).salary,Math.round(25700*E.expansion.economy.local(ordinary).pay));
const posting=at(32),lists=[];for(let yr=0;yr<4;yr++){posting.age++;lists.push(Object.keys(W.openings).filter(k=>!W.jobReason(posting,k)).sort().join('/'));}
assert(new Set(lists).size>=3);
for(const [age,job] of [[21,null],[24,null],[64,'guide']]){const independent=at(age,{job});assert(E.advance(independent));assert.equal(independent.job,job);assert(!W.isPartner(independent));assert(!['retire','coffee','college-career','work-career','trade-career'].includes(independent.event.id));}
const applicant=at(19,{cash:6500});applicant.world.grade=90;applicant.stats.smarts=91;
applicant.rng=15872;const rejected=S.perform(applicant,'course-science','scholarship');assert(rejected.declined);assert.equal(applicant.sim.program,null);assert.equal(applicant.cash,6500);assert.equal(S.debt(applicant),0);
assert.equal(S.perform(applicant,'course-arts','scholarship'),null);assert(S.perform(applicant,'course-science','cash'));assert.equal(applicant.cash,500);assert.equal(S.debt(applicant),0);assert.equal(applicant.sim.program.funding,'cash');
const scholar=at(19,{cash:0});scholar.rng=1;assert(S.perform(scholar,'course-arts','scholarship'));assert.equal(S.debt(scholar),0);assert.equal(scholar.cash,0);
assert(scholar.sim.lifeTags.includes('scholarship'));assert(Object.values(scholar.people).some(p=>p.atSchool));
const borrower=at(18,{cash:0});assert.equal(S.perform(borrower,'course-business','cash'),null);assert.equal(S.perform(borrower,'course-business','invalid'),null);
assert(S.perform(borrower,'course-business','loan'));assert.equal(S.debt(borrower),6000);
console.log('PASS independent adulthood milestones, persistent school/work rosters, bound contact outcomes, rotating jobs and all three university funding routes.');
console.log('PASS complete player/NPC schema, progressive taxes, gated schools and jobs, wage boundary and professional qualifications.');
console.log('PASS mortgages, depreciation, repairs, investment yield, debt, persistent NPCs, relationships, parent and spouse estates and in-kind child succession.');
console.log('PASS injury/chronic progression, addiction recovery, gambling, crime choices, sentencing, prison release and manual save/load.');
