'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine;
const Year=require(path.join(base,'year.js')).PocketYear;
const Saves=require(path.join(base,'save.js')).PocketSaves;
const clone=x=>JSON.parse(JSON.stringify(x));
const make=(birthYear=1200,realism='historical',town='london')=>E.makeLife({birthYear,realism,town,seed:37});
const game=active=>({version:4,active,archive:[],settings:{motion:'system'}});
const store=new Map();
const disk=Saves.open({getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},E,'health-tests');

// Keep the production annual risk, trust and probate implementation. Substitute a
// chosen quantile for each draw to cover rare branches without depending on luck.
function mortality(l,rolls){
  const year=Year.create({world:E.world,jobs:E.jobs,sim:E.sim,
    random(){assert(rolls.length,'Unexpected random draw');return rolls.shift();},
    apply(life,delta){for(const [id,n] of Object.entries(delta))life.stats[id]+=n;return delta;},
    log(life,kind,title,body,delta){life.log.push({age:life.age,kind,title,body,delta});}});
  const result=year.mortality(l);
  assert.deepEqual(rolls,[],'Every expected draw consumed');
  return result;
}
function onlyMet(l,...keys){for(const [key,p] of Object.entries(l.people))p.met=keys.includes(key);}
function playerDies(template,q){
  const l=clone(template);
  onlyMet(l);
  const died=mortality(l,[.95,q]);
  return died?l.sim.cause:null;
}
const guided=make(1200,'guided');
assert.equal(E.year.realism(guided),'guided');
assert.equal(guided.sim.realism,undefined);
assert(!E.year.setRealism(guided,'extreme'));
const infant=clone(guided);infant.age=1;
assert.equal(playerDies(infant,.075),null);
assert(E.year.setRealism(infant,'historical'));
assert.equal(playerDies(infant,.075),'Sudden illness');
const modern=make(2026);modern.age=1;
assert.equal(playerDies(modern,.075),null);

// Child risk is lower after the first year. Reaching adulthood matters even
// in the oldest eras. A household with bills in arrears has greater exposure.
const child=make();child.age=8;
assert.equal(playerDies(child,.08),null);
const adult=make();adult.age=35;
assert(E.year.healthContext(adult).careAccess);
assert.equal(playerDies(adult,.06),null);
adult.sim.loans.living={balance:400,principal:400};
assert(E.year.healthContext(adult).riskFactors.includes('Strained household budget'));
delete adult.sim.loans.living;
adult.job='era-knight';
assert(E.year.healthContext(adult).riskFactors.includes('Hazardous work'));
assert.equal(playerDies(adult,.002),'A workplace accident');
adult.job='era-retainer';
assert(!E.year.healthContext(adult).riskFactors.includes('Hazardous work'));
assert.notEqual(playerDies(adult,.002),'A workplace accident');

const old=make();old.age=66;
assert(playerDies(old,.036));
const newer=make(1980);newer.age=66;
assert.equal(playerDies(newer,.036),null);
const plague=make(1320);plague.age=28;
assert(E.year.healthContext(plague).riskFactors.includes('Local disease outbreak'));
assert.equal(playerDies(plague,.012),'Illness during a local outbreak');
plague.town='kyoto';
assert(!E.year.healthContext(plague).riskFactors.includes('Local disease outbreak'));
assert.equal(playerDies(plague,.012),null);
const sick=make();sick.age=30;sick.sim.illnesses.push({name:'joint condition',severity:80,chronic:true,years:3,treated:false});
assert(playerDies(sick,.036));
sick.sim.illnesses[0].treated=true;assert.equal(playerDies(sick,.036),null);
assert(!E.year.healthContext(sick).riskFactors.includes('Untreated illness'));
sick.sim.faithWorld.institutions.sites.push({kind:'hospital',town:sick.town,staff:[{}],condition:71});
assert.equal(E.year.healthContext(sick).careAccess,'Staffed local hospital');

const maternity=make();maternity.age=28;maternity.sim.identity='woman';
maternity.people.love.role='Spouse';maternity.people.love.gender='man';maternity.people.love.active=true;
maternity.sim.expecting={name:'Jun',parent:maternity.people.love.name,parentId:maternity.people.love.id};
assert(E.year.healthContext(maternity).riskFactors.includes('Childbirth this year'));
maternity.cash=6000;
onlyMet(maternity,'love');
assert(mortality(maternity,[.95,.95,.002]));
assert.equal(maternity.sim.cause,'Childbirth complications');
assert.equal(maternity.sim.expecting,null);
assert.equal(maternity.people.kid1.name,'Jun');assert(maternity.people.kid1.id);
assert(!maternity.people.kid2);
E.expansion.kin.sync(maternity);
const daughter=E.continueAs(maternity,'kid1');
assert(daughter&&daughter.age===0);
assert.equal(daughter.sim.realism,'historical');
assert.equal(daughter.sim.trust,6000);
assert.equal(daughter.sim.expansion.family[daughter.id].born,E.calendar(maternity));
assert(daughter.sim.expansion.family[daughter.id].parents.includes(maternity.id));
assert.equal(E.calendar(daughter),E.calendar(maternity));
assert.equal(E.continueAs(maternity,'kid1'),null);

const orphan=make();orphan.age=7;
const mother=orphan.people.carer;mother.bornYear=orphan.born-17;
mother.wealth=10000;mother.role='Mother';
onlyMet(orphan,'carer');
assert(!mortality(orphan,[.00001,.95,.95]));
const trust=orphan.sim.trust;
assert(trust>0&&orphan.cash===0);
assert.equal(mother.diedAt,7);
const frozenAge=E.model.ageOf(orphan,mother);
orphan.age=8;assert(!mortality(orphan,[.95,.95]));
assert.equal(orphan.sim.trust,trust);assert.equal(E.model.ageOf(orphan,mother),frozenAge);
orphan.age=18;assert(!mortality(orphan,[.95,.95]));assert.equal(orphan.cash,trust);assert.equal(orphan.sim.trust,0);
const exported=disk.exportFile(game(daughter));
const imported=disk.importFile(exported);assert(imported);
assert.equal(imported.active.sim.realism,'historical');
assert.equal(imported.active.sim.trust,daughter.sim.trust);
const invalid=game(clone(daughter));invalid.active.sim.realism='unknown';
assert(!disk.inspectFile(JSON.stringify(E.encodeGame(invalid))));
assert(E.year.setRealism(daughter,'guided'));
assert.equal(daughter.sim.realism,undefined);
assert.equal(E.year.realism(disk.importFile(disk.exportFile(game(daughter))).active),'guided');
console.log('PASS era, age, hardship, local events, work, treatment, childbirth, survivor estates and realism save settings.');

// Fixed NPC ID yields independent births in 2001, 2012 and 2021 and a marriage
// in 2017. Only the first child can have the spouse who died in 2001 as a parent.
const branch=make(1950,'guided');
branch.age=51;
const widowed=branch.people.branch={id:'widowed-1623',name:'Nia',role:'Child',bornYear:1980,met:true,active:true,bond:60};
const late=branch.people.late={id:'first-spouse',name:'Jae',role:'Child-in-law',bornYear:1980,met:true,active:false,diedAt:51,bond:40};
E.model.person(branch,'branch',widowed);E.model.person(branch,'late',late);
const kin=E.expansion.kin,tree=kin.sync(branch);
tree[widowed.id].spouse=late.id;tree[late.id].spouse=widowed.id;
function independentYear(year){
  branch.age=year-branch.born;
  kin.annual(branch,(life,kind,title,body)=>life.log.push({age:life.age,kind,title,body}));
}
function grandchild(year){
  const match=Object.values(tree).find(n=>n.born===year&&n.parents.includes(widowed.id));
  assert(match,'Expected a child born in '+year);
  return match;
}
independentYear(2001);
const first=grandchild(2001);
assert.deepEqual(first.parents,[widowed.id,late.id]);
independentYear(2012);
const second=grandchild(2012);
assert.deepEqual(second.parents,[widowed.id]);
independentYear(2017);
const remarried=tree[widowed.id].spouse;
assert(remarried&&remarried!==late.id);
independentYear(2021);
assert.deepEqual(grandchild(2021).parents,[widowed.id,remarried]);
assert.deepEqual(first.parents,[widowed.id,late.id]);
assert.deepEqual(second.parents,[widowed.id]);
console.log('PASS same-year posthumous birth, widowed NPC parentage, remarriage and earlier family links.');
