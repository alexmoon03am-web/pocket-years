'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const base=process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine,I=E.faithInstitutions;
const clone=o=>JSON.parse(JSON.stringify(o));
function create(birthYear=1400,faithId='catholic',town='london',seed=2567){
  const l=E.makeLife({seed,name:'Morgan Woods',town,birthYear,faithId});
  l.age=35;l.cash=300000;I.initialize(l);
  return l;
}
function act(l,group,id){
  const row=I.actions(l,group).find(a=>a.id===id);assert.ok(row,'Missing action '+id);
  assert.equal(row.reason,'',id+' must be actionable');
  const before=l.log.length,res=E.faithPerform(l,{group,id});
  assert.ok(res?.text,id);assert.equal(l.log.length,before+1);
  return res;
}
for(const by of [1280,1500,1730,1900,2000,2100]){
  const l=create(by),s=l.sim.faithWorld.institutions,q=I.prices(l);
  // This donor fixture exercises funding and operation across different price levels.
  // First check the refusal at one unit below the current land quote.
  l.cash=q.land-1;
  assert(I.actions(l,'institutions').find(a=>a.id==='land').reason);
  assert.equal(E.faithPerform(l,{group:'institutions',id:'land'}),null);
  assert.equal(l.cash,q.land-1);
  l.cash=q.land+q.build*3+q.wage*4+q.materials*4+300000;
  const old=JSON.stringify(s);I.actions(l,'institutions');I.records(l);I.summary(l);assert.equal(JSON.stringify(s),old,'Browsing changes the ledger');
  const worth=E.world.netWorth(l),cash=l.cash,oldExpenses=E.sim.budget(l).housing;
  act(l,'institutions','land');assert.equal(l.cash,cash-q.land);
  const types=I.actions(l,'institutions').map(a=>a.id);
  for(const k of ['build-church','build-monastery','build-school','build-library','build-charity','build-hospital','build-community'])assert.ok(types.includes(k),k);
  act(l,'institutions','build-school');const site=I.records(l,l.town).find(r=>r.kind==='school'),g='institution:'+site.id;
  assert.equal(s.lots.length,0);assert.equal(site.stewardId,l.id);
  assert.equal(E.world.netWorth(l),worth-(cash-l.cash),'The player cannot inherit the institution through personal net worth');
  assert.equal(E.sim.budget(l).housing,oldExpenses,'Community land is not personal housing');
  const grade=l.world.grade,treasury=site.treasury;
  act(l,g,'visit');assert.ok(l.world.grade>grade);assert.ok(site.treasury<treasury);
  assert.equal(E.faithPerform(l,{group:g,id:'visit'}),null);
  act(l,g,'raise');assert.ok(site.treasury>treasury);
  const beforeCash=l.cash,beforeFund=site.treasury;act(l,g,'endow');assert.equal(beforeCash-l.cash,site.treasury-beforeFund);
  const employeeAction=I.actions(l,g).find(a=>a.id==='staff-person');assert.ok(employeeAction);
  act(l,g,'staff-person');const p=Object.values(l.people).find(p=>p.id===site.staff[0].personId);assert.ok(p);
  const payBefore=p.wealth,opening=site.treasury,bank=l.cash; l.age++;l.used=[];
  I.annual(l);const accounts=site.lastAccounts;
  assert.equal(l.cash,bank);assert.equal(site.treasury,opening+accounts.contributions-accounts.upkeep-accounts.conservation-accounts.paid-accounts.programmes);
  assert.ok(p.wealth>=payBefore+accounts.paid);assert.ok(accounts.served>0);assert.equal(I.summary(l,l.town,site.faithId).education>=accounts.served,true);
  const stable=JSON.stringify({s,p:p.wealth});assert.equal(I.annual(l),false);assert.equal(JSON.stringify({s,p:p.wealth}),stable);
  act(l,g,'extend');assert.equal(site.level,2);site.condition=61;act(l,g,'repair');assert.equal(site.condition,100);
  const good=JSON.stringify(E.encodeGame({active:l,archive:[],settings:{motion:'system'}}));
  const round=E.decodeGame(JSON.parse(good)).active;assert.ok(I.validate(round));assert.deepEqual(I.records(round),I.records(l));
  const bad=clone(round);bad.sim.faithWorld.institutions.sites[0].lastAccounts.closing++;assert.throws(()=>I.validate(bad));
}
const traditionForms={Christianity:'church',Islam:'mosque',Judaism:'synagogue','Hindu traditions':'temple',Buddhism:'temple',Jainism:'temple',Shinto:'shrine',Daoism:'temple','Personal outlook':'community'};
for(const tradition of E.faithCatalog.traditions){
  const l=create(2200,tradition.id);
  act(l,'institutions','land');
  const forms=I.actions(l,'institutions').map(r=>r.id);
  const expected=tradition.id==='theravada'?'monastery':traditionForms[tradition.family]||'assembly';
  assert.ok(forms.includes('build-'+expected),tradition.id+' should offer '+expected);
  if(tradition.family!=='Christianity')assert.ok(!forms.includes('build-church'),tradition.id+' incorrectly offers a church');
  if(tradition.family!=='Judaism')assert.ok(!forms.includes('build-synagogue'),tradition.id+' incorrectly offers a synagogue');
  if(tradition.family!=='Islam')assert.ok(!forms.includes('build-mosque'),tradition.id+' incorrectly offers a mosque');
  if(tradition.family==='Judaism'||tradition.family==='Personal outlook'||tradition.family==='Islam')assert.ok(!forms.includes('build-monastery'),tradition.id+' incorrectly offers a monastery');
}
const donor=create(1450),offer=E.historyEconomy.listings(donor).find(a=>a.category==='Property');
assert.ok(E.historyPerform(donor,'market',offer.id));
const holding=donor.world.owned[offer.id],donationId='deed/'+offer.id;
const foreignTown=E.historyWorld.choices(donor.born+donor.age).find(t=>t.id!==donor.town).id;
donor.town=foreignTown;I.initialize(donor);
const permitted=()=>I.actions(donor,'institutions').find(r=>r.id===donationId)?.reason;
holding.share=.5;assert.match(permitted(),/sole owner/);holding.share=1;
donor.sim.loans[offer.id]={balance:50,principal:10};assert.match(permitted(),/loan/);
assert.equal(E.faithPerform(donor,{group:'institutions',id:donationId}),null);delete donor.sim.loans[offer.id];
holding.tenant={name:'Tenant'};assert.match(permitted(),/tenant/);delete holding.tenant;
const donorBank=donor.cash,personalWorth=E.world.netWorth(donor);
const gift=act(donor,'institutions',donationId);
assert.equal(gift.delta.netWorth,-holding.value);assert.equal(donor.cash,donorBank);assert.equal(E.world.netWorth(donor),personalWorth-holding.value);
assert.ok(!donor.world.owned[offer.id]);assert.equal(E.faithPerform(donor,{group:'institutions',id:donationId}),null);
const transferred=donor.sim.faithWorld.institutions.lots[0];
assert.equal(transferred.town,offer.town);assert.equal(transferred.deed.assetId,offer.id);
assert.equal(I.summary(donor,offer.town).pendingPlots,1);
assert.ok(!I.actions(donor,'institutions').some(r=>r.id==='build-library'));
donor.town=offer.town;act(donor,'institutions','build-library');
const built=I.records(donor).find(site=>site.deed?.assetId===offer.id);
assert.equal(built.deed.title,offer.name);assert.equal(built.deed.town,offer.town);assert.equal(built.landValue,holding.value);
assert.equal(I.summary(donor,offer.town).pendingPlots,0);assert.ok(I.validate(donor));
const movement=create(1900);
const drafted=E.faithMovements.defaultDraft();drafted.name='North Field Circle';
assert.ok(E.faithPerform(movement,{group:'found',payload:drafted}));
const m=movement.sim.faithWorld.movements[movement.sim.faith.id];m.treasury=175000;
const wallet=movement.cash;act(movement,'institutions','funding');
const t=m.treasury;act(movement,'institutions','land');assert.ok(m.treasury<t);assert.equal(movement.cash,wallet);
act(movement,'institutions','build-temple');
const temple=I.records(movement).find(r=>r.movementId===m.id);
const org=m.treasury,local=temple.treasury;act(movement,'institution:'+temple.id,'grant');
assert.equal(org-m.treasury,temple.treasury-local);assert.equal(movement.cash,wallet);
const npcLife=create(1500,'catholic','london',2568),npc=npcLife.people.carer;
npc.faith={id:'catholic'};npc.generosity=99;npc.wealth=200000;npc.town=npcLife.town;
npc.bornYear=npcLife.born-10;
for(const p of Object.values(npcLife.people))if(p!==npc)p.generosity=0;
let testYear=npcLife.born+npcLife.age+1;while(E.model.hash(npc.id+'/'+testYear+'/local-endowment')%53!==0)testYear++;
npcLife.age=testYear-npcLife.born;npcLife.sim.faithWorld.institutions.lastYear=testYear-1;
const oldNPC=npc.wealth,oldPlayer=npcLife.cash;I.annual(npcLife);
const benefaction=I.records(npcLife).find(r=>r.founderId===npc.id);assert.ok(benefaction,'A relative can found a local institution');
assert.equal(oldNPC-npc.wealth,benefaction.landValue+benefaction.construction+benefaction.treasury);assert.equal(npcLife.cash,oldPlayer);
const tree=npcLife.sim.expansion.family;
tree[npcLife.id].parents=[npc.id];tree[npcLife.id].town=npcLife.town;tree[npcLife.id].born=npcLife.born;
npc.diedAt=npcLife.age;tree[npc.id].died=testYear;npcLife.age++;I.annual(npcLife);
assert.ok(tree[benefaction.stewardId].parents.includes(npc.id));assert.ok(benefaction.appointments.some(a=>a.from===npc.id&&a.to===benefaction.stewardId));
const child=create(1510);child.age=npcLife.born+npcLife.age-child.born;child.sim.faithWorld=clone(npcLife.sim.faithWorld);
I.inherit(npcLife,child);assert.ok(I.records(child).some(v=>v.id===benefaction.id&&v.founderId===npc.id));assert.ok(I.validate(child));
const unknown=E.historyWorld.choices(1200).find(t=>!E.faithCatalog.options(1200,t.id).some(a=>!a.secular&&E.faithCatalog.local(a.id,t.id,1200)));
if(unknown){const here=create(1200,'unaffiliated',unknown.id);assert.equal(I.records(here)[0].faithId,'unaffiliated');}
console.log('PASS institutional land, six eras, construction, treasury conservation, personal and movement funding, regional presence, named NPC payroll, actual services, repairs, expansion, wealthy NPC founders, stewardship succession, saved properties and idempotent annual accounting.');
