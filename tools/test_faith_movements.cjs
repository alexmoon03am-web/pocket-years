'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const dir=process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../app/src/main/assets');
const E=require(path.join(dir,'engine.js')).PocketEngine;
const F=E.faithMovements;
const clone=o=>JSON.parse(JSON.stringify(o));
const l=E.makeLife({seed:430,birthYear:1200,town:'london',name:'Ari Reed'});
const cmd=(life,group,id,payload)=>E.faithPerform(life,{group,id,payload});
const draft={...F.defaultDraft(l),name:'Fellowship of the Spring',adherentName:'Springkeeper',symbol:'Three reeds',
  values:'Kindness',teachings:'Welcome travelers',writings:'The North Road',holidays:'First planting',ceremonies:'Dawn meal',
  worship:'A common room',rules:'Guests eat first',clothing:'A green thread',governance:'central',sharing:'writing'};
assert.equal(cmd(l,'movement','found',draft),null);
l.age=25;l.cash=3000;
assert.match(F.validateDraft(l,{...draft,sharing:'online'}),/available/);
assert.match(F.validateDraft(l,{...draft,name:''}),/Enter/);
const created=cmd(l,'movement','found',draft);assert(created);
const m=F.get(l,created.movementId),charter=clone(m.original);
assert.equal(m.founderId,l.id);assert.equal(m.foundedYear,1225);assert.equal(m.originRegion,'europe');
assert.equal(l.sim.faith.id,m.id);assert(F.followers(m)>=1&&F.followers(m)<=4);
const operation=(op,payload)=>cmd(l,'movement',m.id+'/'+op,payload);
const next=()=>{l.age++;l.used=[];F.annual(l,{});};
assert.equal(cmd(l,'movement','found',{name:'Second society'}),null);
assert(operation('gather'));assert.equal(operation('gather'),null);
assert(operation('book',{title:'The Two Roads'}));assert.equal(m.works[0].title,'The Two Roads');
const cash=l.cash;assert.equal(operation('visit',{region:'americas'}),null);
assert.equal(l.cash,cash);assert(operation('visit',{region:'westAsia'}));assert(l.cash<cash);assert(m.regions.westAsia.town);
assert(operation('rename',{name:'Fellowship of Two Springs'}));
assert(operation('reform',{teachings:'Share water with visitors',governance:'central'}));
assert.equal(m.teachings,'Share water with visitors');assert.deepEqual(m.original,charter);
for(let i=0;i<16;i++){next();operation('gather');operation('service');}
assert(m.treasury>0);
const oldAccounts=clone(m.lastAccounts);F.annual(l,{});assert.deepEqual(oldAccounts,m.lastAccounts);
assert.equal(oldAccounts.opening+oldAccounts.contributions-oldAccounts.expenses,oldAccounts.closing);
const antes=F.followers(m),funds=m.treasury;
assert(operation('split',{name:'Southern Springs',teachings:'Travel in pairs'}));const branch=F.get(l,l.sim.faith.id);
assert.equal(branch.parentId,m.id);assert.notEqual(branch.id,m.id);assert.equal(branch.original.name,'Southern Springs');
assert.equal(F.followers(m)+F.followers(branch),antes);assert.equal(m.treasury+branch.treasury,funds);
let merged=false;
for(let i=0;i<20&&!merged;i++){
  next();const n=F.followers(m)+F.followers(branch),cash=m.treasury+branch.treasury;
  assert(cmd(l,'movement',branch.id+'/unite',{targetId:m.id}));
  if(m.unitedWith){assert.equal(F.followers(branch),n);assert.equal(branch.treasury,cash);merged=true;}
}
assert(merged);assert.equal(F.followers(m),0);assert(F.validate(l));
for(let i=0;i<240;i++){F.record(branch,year(l)+i,'reform','Charter amendment '+i);F.record(branch,year(l)+i,'gather','Routine assembly');}
assert.equal(branch.history.filter(e=>e.kind==='reform').length,240);
assert(branch.history.some(e=>e.kind==='found'));assert(branch.history.filter(e=>e.kind==='gather').length<=120);
function year(person){return person.born+person.age;}
const l2=clone(l);next();l2.age++;l2.used=[];F.annual(l2,{});assert.deepEqual(l.sim.faithWorld.movements,l2.sim.faithWorld.movements);
const growing=F.followers(branch);const pop=branch.regions.europe;pop.followers=200000;pop.influence=pop.teachers=pop.trust=0;
next();assert(F.followers(branch)<200000+growing);
const bad=clone(l);bad.sim.faithWorld.movements[branch.id].regions.europe.followers=-1;
assert.throws(()=>F.validate(bad));
console.log('PASS founding, original charter, voluntary outreach, regional reach, personal and treasury accounting, reform, branches, reunion, annual decline, permanent milestones and deterministic saves.');

// Follow real household members independently of the statistical population.
const lone=E.makeLife({seed:4,birthYear:1230,town:'london',name:'Jo Finch'});lone.age=26;
for(const p of Object.values(lone.people))p.active=false;
const id=cmd(lone,'found','found',{name:'Signal Hill'}).movementId,order=F.get(lone,id);
assert.equal(F.followers(order),1);
lone.ended=true;lone.age++;F.annual(lone,{});
assert.equal(F.followers(order),0);assert.equal(order.status,'dormant');assert(order.history.some(e=>e.kind==='dormant'));
const heir=E.makeLife({seed:773,birthYear:1242,town:'london',name:'Jo Finch Junior'});
heir.age=25;heir.sim.dynasty={line:lone.id,curators:[{id:lone.id,name:lone.name,year:1230},{id:heir.id,name:heir.name,year:1267}],collection:[]};
heir.sim.faithWorld=clone(lone.sim.faithWorld);
assert(F.actions(heir,'movement').some(a=>a.id===id+'/revive'&&!a.reason));
assert(cmd(heir,'movement',id+'/revive'));const revived=F.get(heir,id);
assert.equal(heir.sim.faith.id,id);assert.equal(revived.status,'active');assert.equal(revived.original.founderId,lone.id);
assert(revived.history.some(e=>e.kind==='revival'));
const count=F.followers(revived);heir.sim.faith.id='unaffiliated';F.syncAffiliations(heir);assert.equal(F.followers(revived),count-1);
heir.sim.faith.id=id;F.syncAffiliations(heir);assert.equal(F.followers(revived),count);
for(let i=0;i<45;i++){heir.age++;F.annual(heir,{});}
assert(revived.census.some(c=>(c.year-revived.foundedYear)%25===0));
assert(F.validate(heir));

// Keep other inputs identical to isolate the documented city shock and services.
const scenario=()=>{const a=clone(heir),m=F.get(a,id);a.born=1636;a.age=30;a.ended=false;a.sim.faithWorld.lastMovementYear=1665;m.lastYear=1665;
  const r=m.regions.europe;r.followers=12000;r.trust=64;r.influence=0;r.teachers=0;r.carry=0;r.town='london';m.stability=70;return a;};
const fire=scenario(),normal=scenario(),services=scenario();
F.get(normal,id).regions.europe.town='bristol';
services.sim.faithWorld.institutions={sites:[{town:'london',faithId:id,lastAccounts:{served:900}}]};
for(const a of [fire,normal,services])F.annual(a,{});
assert(F.followers(F.get(fire,id))<F.followers(F.get(normal,id)),'Local fire should affect the congregation in its city');
assert(F.followers(F.get(services,id))>F.followers(F.get(fire,id)),'Funded services should affect outreach');
const unstable=scenario();const unstableM=F.get(unstable,id);unstableM.stability=31;unstableM.treasury=15000;
for(let i=0;i<130&&!F.list(unstable).some(n=>n.parentId===id);i++){unstable.age++;F.annual(unstable,{});}
const independent=F.list(unstable).find(n=>n.parentId===id);
assert(independent);assert.notEqual(independent.founderId,unstable.id);assert(independent.original.founderName.includes('Assembly'));assert(F.validate(unstable));
console.log('PASS founder death, descendant-led revival, observed conversions, historical shocks, service-funded outreach, 25-year censuses and independent regional schism.');
