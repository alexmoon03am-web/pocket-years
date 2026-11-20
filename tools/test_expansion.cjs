'use strict';
const {expectedLegacySnapshot}=require('./legacy_projection.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine,S=E.sim,W=E.world,X=E.expansion,G=S.geography,shop=W.shopping;
const Saves=require(path.join(base,'save.js')).PocketSaves,K='studio.pocketyears.save.v1';
const clone=o=>JSON.parse(JSON.stringify(o));
const game=l=>({active:l,archive:[],settings:{motion:'reduced'}});
const reload=l=>E.decodeGame(clone(E.encodeGame(game(l)))).active;
function adult(seed=182,age=32,job='physician'){
  const l=E.makeLife({seed,town:'cedar',name:'Mina Lake'});Object.assign(l,{age,job,track:'work',cash:1500000});
  l.sim.license=true;l.stats.smarts=85;E.year.workplace(l);E.year.campus(l);return l;
}
function action(l,area,id,ref=''){
  const quote=X.actions(l,area,ref).find(a=>a.id===id);
  assert(quote,area+'/'+ref+'/'+id);assert.equal(quote.reason,'',quote.title+': '+quote.reason);
  const n=l.log.length;const result=X.perform(l,area,ref,id);
  assert(result&&l.log.length>n);return result;
}
function rejected(l,area,id,ref=''){
  const before=JSON.stringify(l);assert.equal(X.perform(l,area,ref,id),null);assert.equal(JSON.stringify(l),before);
}
function conclude(l){
  while(E.blocking(l)){
    if(l.sim.court)assert(S.court(l,'plea'));else if(l.sim.review)assert(E.acknowledge(l));else assert(E.decide(l,0));
  }
}
const life=adult(),e=X.economy,city=(name,code)=>G.countries[code].cities.find(v=>v.name===name).id;
const ny=city('New York City','US'),tokyo=city('Tokyo','JP'),london=city('London','GB');
const towns=[ny,tokyo,london,'cedar'];
const markets=towns.map(t=>e.local(life,t));
for(const field of ['pay','cost','home','unemployment'])assert.equal(new Set(markets.map(m=>m[field])).size,4);
const years=Array.from({length:65},(_,i)=>e.local(life,ny,i));assert(years.some(m=>m.phase==='Recession')&&years.some(m=>m.phase==='Boom'));
assert(years.every(m=>m.unemployment>0&&m.rate>0&&m.sector!==m.decline));
assert(years[64].cost>years[0].cost);
const stock=Object.keys(shop.shops).map(id=>shop.inventory(life,id));assert.equal(stock.flat().length,42);
const original=JSON.stringify(life);for(const area of ['business','estate','career','hobbies','bills','portfolio','family'])X.actions(life,area);
assert.equal(JSON.stringify(life),original);assert.deepEqual(stock,Object.keys(shop.shops).map(id=>shop.inventory(reload(life),id)));
const owned=shop.inventory(life,'velo')[0],down=Math.ceil(owned.price*.2),startCash=life.cash;
action(life,'offer','finance',owned.id);const car=life.world.owned[owned.id];
assert.equal(life.cash,startCash-down);assert.equal(life.sim.loans[owned.id].balance,owned.price-down);assert(!shop.offer(life,owned.id));rejected(life,'offer','finance',owned.id);
action(life,'asset','paint-red',owned.id);action(life,'asset','tune',owned.id);action(life,'asset','cover',owned.id);
assert(car.insured&&car.tuned&&car.paint==='racing red');assert.equal(S.budget(life).insurance,Math.max(90,Math.round(car.value*.022)));
car.condition=41;const repair=W.repairQuote(life,owned.id),beforeService=life.cash;action(life,'bills','bulk-Vehicle');
assert.equal(life.cash,beforeService-repair);assert.equal(car.condition,100);rejected(life,'bills','bulk-Vehicle');
const oldTitle=clone(car.listing);life.age++;assert(shop.inventory(life,'velo').every(o=>o.id!==owned.id));assert.deepEqual(car.listing,oldTitle);
const next=shop.inventory(life,'freight')[1],owed=life.sim.loans[owned.id].balance,tradeCash=life.cash;
action(life,'offer','trade-'+owned.id,next.id);assert(!life.world.owned[owned.id]&&!life.sim.loans[owned.id]);assert(life.world.owned[next.id]);
assert.equal(life.cash,tradeCash+car.value-owed-next.price);rejected(life,'offer','trade-'+owned.id,next.id);
const badLoan=adult();badLoan.cash=0;badLoan.job=null;rejected(badLoan,'offer','finance',shop.inventory(badLoan,'summit')[0].id);
const debtLife=adult(),home=shop.inventory(debtLife,'maple')[0];assert(S.mortgage(debtLife,home.id));
const house=debtLife.world.owned[home.id],principal=debtLife.sim.loans[home.id].balance;
action(debtLife,'asset','refi',home.id);assert.equal(debtLife.sim.loans[home.id].balance,principal);assert.equal(debtLife.sim.loans[home.id].rate,e.local(debtLife,home.town).rate);
const prevRent=W.rent(debtLife);action(debtLife,'asset','tenant',home.id);assert(W.rent(debtLife)>prevRent);const leaseRent=W.rent(debtLife);
action(debtLife,'asset','renovate',home.id);assert(W.rent(debtLife)>leaseRent);action(debtLife,'asset','manager',home.id);assert(S.budget(debtLife).management>0);
action(debtLife,'asset','tenant',home.id);assert.equal(W.rent(debtLife),0);X.annual(debtLife,S.budget(debtLife),debtLife.age);assert(house.tenant&&!house.vacant);
action(debtLife,'bills','auto');assert.equal(S.budget(debtLife).payment,0);
const manual=debtLife.cash;action(debtLife,'bills','pay-'+home.id);assert(debtLife.cash<manual);assert.equal(S.budget(debtLife).skipped,0);
action(debtLife,'bills','auto');assert(S.budget(debtLife).payment>0);
const net=W.netWorth(debtLife);action(debtLife,'portfolio','buy-tech');assert.equal(W.netWorth(debtLife),net);assert.equal(X.portfolio(debtLife),10*X.shares(debtLife,'tech'));
action(debtLife,'portfolio','sell-tech');assert.equal(W.netWorth(debtLife),net);rejected(debtLife,'portfolio','sell-tech');
console.log('PASS year-stable specialist markets, regional inflation, vehicle financing and trade-in, insurance, bulk service, renovation, tenants, refinancing, manual bills and portfolio accounting.');

const mover=adult(),asset=shop.inventory(mover,'maple')[0];assert(W.trade(mover,asset.id,'buy'));assert(W.adopt(mover,'Jo'));
const branch=clone(mover.world.owned[asset.id]);
mover.sim.offenses.push({offense:'Theft',verdict:'Convicted',age:mover.age});
assert.match(S.moveReason(mover,tokyo),/conviction/);rejected(mover,'visa','work',tokyo);
assert(!S.moveReason(mover,ny));const motherTown=mover.people.carer.town;
assert(S.relocate(mover,ny));assert.equal(mover.people.kid1.town,ny);assert.equal(mover.people.carer.town,motherTown);
mover.age+=3;mover.used=[];const funds=mover.cash;action(mover,'visa','work',tokyo);
assert(e.papers(mover,tokyo).valid);assert(S.relocate(mover,tokyo));assert.equal(mover.cash,funds-1950);
assert.equal(mover.people.kid1.town,tokyo);assert.deepEqual(mover.world.owned[asset.id],branch);
assert(S.budget(mover).housing>0);assert.equal(S.budget(mover).wages,e.salary(mover,mover.job,E.jobs));
rejected(mover,'visa','residence',tokyo);mover.age+=2;mover.used=[];action(mover,'visa','work',tokyo);
mover.age++;mover.used=[];action(mover,'visa','residence',tokyo);rejected(mover,'visa','citizen',tokyo);
mover.age+=2;action(mover,'visa','citizen',tokyo);assert(e.papers(mover,tokyo).citizen);assert(e.papers(mover,'cedar').citizen);
assert(mover.sim.lifeTags.includes('naturalized'));assert.deepEqual(reload(mover).sim.expansion.passports,mover.sim.expansion.passports);
const solo=adult();assert(W.adopt(solo,'Sky'));assert(solo.sim.expansion.family[solo.people.kid1.id].parents.includes(solo.id));
action(solo,'travel','household');assert(S.relocate(solo,tokyo));assert.equal(solo.people.kid1.town,'cedar');
solo.used=[];solo.age++;action(solo,'travel','household');assert(S.relocate(solo,ny));assert.equal(solo.people.kid1.town,ny);
const expiring=adult();action(expiring,'visa','independent',london);assert(S.relocate(expiring,london));expiring.age+=3;expiring.used=[];X.annual(expiring,S.budget(expiring),expiring.age);
assert.equal(expiring.job,null);assert(W.jobReason(expiring,'barista').includes('authorization'));
console.log('PASS domestic and international moves, independent relatives, foreign deeds, work and savings visas, expired work authorization, continuous residence and multiple citizenships.');

const worker=adult(732,31,'designer'),x=worker.sim.expansion;
action(worker,'career','assignment');assert.equal(x.royalties,60);assert(S.budget(worker).side>=60);rejected(worker,'career','assignment');
action(worker,'career','cert');assert(x.certs.includes('Creative'));worker.world.performance=89;const pay=E.state(worker).salary;
action(worker,'career','negotiate');assert(E.state(worker).salary>pay);
const olds=Object.values(worker.people).filter(p=>p.role==='Boss').map(p=>p.id);
action(worker,'career','employer');assert(Object.values(worker.people).some(p=>p.role==='Former boss'&&olds.includes(p.id)));
assert.equal(E.state(worker).employer,x.employer);assert(Object.values(worker.people).some(p=>p.role==='Boss'&&!olds.includes(p.id)));
const clinic=adult();clinic.sim.illnesses.push({name:'injury follow-up',severity:45,chronic:true,treated:false,years:1});
action(clinic,'career','assignment');assert(clinic.sim.illnesses[0].treated);
const techno=adult(81,29,'analyst');action(techno,'career','assignment');assert(techno.sim.lifeTags.includes('reference-release'));
const sectorTitles=new Set();for(const id of Object.keys(W.openings)){const a=adult(83,35,id);const offer=X.actions(a,'career').find(c=>c.id==='assignment');assert(offer);sectorTitles.add(offer.title);}
assert(sectorTitles.size>=40);assert(W.jobReason(techno,'executive'));const former=worker.cash;
action(worker,'business','open-studio');const firm=Object.values(x.companies)[0];
assert.equal(X.companyValue(worker),former-worker.cash);action(worker,'company','clients',firm.id);action(worker,'company','expand',firm.id);
worker.people.carer.trust=70;action(worker,'company','hire-carer',firm.id);assert.equal(firm.managerId,worker.people.carer.id);
const oldCapital=firm.capital,oldWealth=worker.people.carer.wealth,forecast=S.budget(worker),row=forecast.businessRows[0],cash=worker.cash,b=S.settle(worker,worker.age);
assert.equal(worker.cash,cash+forecast.net);assert.equal(row.net,row.payout+row.retained);assert.equal(b.businessIncome,Math.max(0,row.payout));
X.annual(worker,b,worker.age);assert.equal(firm.capital,oldCapital+row.retained);assert(worker.people.carer.wealth>=oldWealth+row.managerPay);
assert(x.awards.includes('Build a family business'));assert(x.worldHistory.length);const after=JSON.stringify(worker);X.annual(worker,b,worker.age);assert.equal(JSON.stringify(worker),after);
const storm=adult(21,27,'dispatcher');action(storm,'business','open-studio');const failing=Object.values(storm.sim.expansion.companies)[0];
failing.capital=1;failing.staff=35;failing.clients=0;storm.world.performance=22;storm.sim.expansion.discipline=2;
for(let i=0;i<30&&e.local(storm).phase!=='Recession';i++)storm.age++;
assert.equal(e.local(storm).phase,'Recession');const loss=S.budget(storm);assert(loss.operatingLoss>0);
X.annual(storm,loss,storm.age);assert(!storm.sim.expansion.companies[failing.id]);assert.equal(storm.job,null);
assert(storm.log.some(n=>n.title==='Business closed')&&storm.log.some(n=>n.title==='Made redundant'));
console.log('PASS specialized professional actions, credentials, local salary, new employer and team, family company manager payroll, balanced statements, recession layoffs and insolvency.');

const multi=adult();multi.sim.degree='Science';action(multi,'business','open-clinic');action(multi,'business','open-hotel');
for(const h of shop.inventory(multi,'keyline').slice(0,2))assert(W.trade(multi,h.id,'buy'));
action(multi,'bills','manage-business');assert(Object.values(multi.sim.expansion.companies).every(c=>c.manager));
action(multi,'bills','release-business');assert(Object.values(multi.sim.expansion.companies).every(c=>!c.manager));
action(multi,'bills','manage-property');assert(S.budget(multi).management>0);action(multi,'bills','release-property');assert.equal(S.budget(multi).management,0);
const dates=adult();let prewar;for(let i=0;i<16&&!prewar;i++){dates.age++;prewar=shop.inventory(dates,'chrome').find(c=>c.type==='prewar');}
assert(prewar&&prewar.modelYear>=1920&&prewar.modelYear<=1939);
const callback=adult();action(callback,'business','open-studio');assert(!E.events.eligible(callback,E.stories['repeat-customer']));
callback.event={id:'founder-invoice',resolved:false};assert(E.decide(callback,2));conclude(callback);assert(E.events.eligible(callback,E.stories['repeat-customer']));
const family=adult(143,49);const tree=family.sim.expansion.family;const self=tree[family.id];
assert(self.parents.length>=1);for(const r of ['Grandparent','Aunt','Uncle','Cousin'])assert(Object.values(tree).some(n=>X.kin.relationship(tree,self.id,n.id)===r),r);
const parent=family.people.carer,bond=parent.bond;
action(family,'relative','argue','carer');assert(parent.rivalry&&parent.bond<bond);const trust=parent.trust;
action(family,'relative','reconcile','carer');assert(!parent.rivalry&&parent.trust>trust);
action(family,'relative','loan','carer');assert.equal(parent.favor.amount,600);const beforeRepay=family.cash;family.age=parent.favor.due;
X.kin.annual(family,()=>{});assert.equal(family.cash,beforeRepay+600);assert(!parent.favor);
action(family,'family','reunion');assert(family.sim.lifeTags.includes('hosted-family'));
assert(W.adopt(family,'Mira'));family.used=[];assert(W.adopt(family,'Remy'));
const eldest=family.people.kid1;eldest.bornAt=family.age-23;eldest.bornYear=family.born+eldest.bornAt;eldest.town=tokyo;eldest.career='mechanic';X.kin.sync(family);
action(family,'business','open-clinic');action(family,'portfolio','buy-bonds');action(family,'estate','weight-kid1');
const plan=S.estate(family);assert(plan.kid1.total>plan.kid2.total&&plan.kid1.contested);assert.equal(plan.kid1.total+plan.kid2.total,W.netWorth(family));
const signed=reload(family);action(signed,'estate','witness');assert.equal(S.estate(signed).kid1.contested,0);
const overdrawn=reload(family);overdrawn.cash=0;overdrawn.sim.loans.living={balance:90000000,principal:250};assert.equal(S.estate(overdrawn).kid1.total,0);
family.ended=true;family.sim.cause='Old age';const heir=E.continueAs(family,'kid1');assert(heir&&heir.age===23);assert.equal(heir.id,eldest.id);assert(heir.sim.expansion.family[family.people.carer.id].history.some(m=>m.act==='loan'&&m.with===family.id));assert.equal(heir.town,tokyo);assert.equal(heir.job,'mechanic');
assert(heir.sim.expansion.family[family.id].died&&heir.sim.expansion.dispute);
assert.equal(W.netWorth(heir),plan.kid1.total+(eldest.wealth||0));assert.equal(X.companyValue(heir),Object.values(plan.kid1.companies)[0].capital);
const held=heir.sim.expansion.dispute.amount,current=heir.cash;action(heir,'family','mediate');assert.equal(heir.cash,current+Math.floor(held*.55));assert(!heir.sim.expansion.dispute);rejected(heir,'family','mediate');assert.deepEqual(reload(heir).sim.expansion.family,heir.sim.expansion.family);
const births=adult(154,22);assert(W.adopt(births,'Jo'));births.people.kid1.bornAt=0;births.people.kid1.bornYear=births.born;
const offspring=births.people.kid1;const firstYear=births.born+births.age;
let found=false;
for(let i=0;i<1000&&!found;i++){
  births.born=firstYear+i-24;births.age=24;offspring.bornYear=births.born;
  const y=births.born+births.age;if(E.model.hash(offspring.id+'/'+y+'/independent')%6===4&&e.sample(offspring.id,y)<.042){X.kin.annual(births,()=>{});found=true;}
}
assert(found);const gc=Object.values(births.people).find(p=>p.role==='Grandchild');assert(gc&&births.sim.expansion.family[gc.id].parents.includes(offspring.id));
const hobby=adult();const change=X.actions(hobby,'hobbies').find(v=>v.id.startsWith('goal-')&&!v.reason);action(hobby,'hobbies',change.id);action(hobby,'hobbies','music');assert(hobby.sim.expansion.hobbies.music>0);
action(hobby,'hobbies','lifeLuxury');assert(S.budget(hobby).lifestyle>0);assert(new Set(Array.from({length:36},(_,i)=>E.makeLife({seed:1136*i+1}).sim.expansion.personality)).size>=5);
console.log('PASS family tree, grandchildren, loan memories, reconciliations, inherited firms, creditor priority, weighted and witnessed wills, probate cases, successor identity, location and profession, hobbies and ambitions.');

const store=new Map(),storage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)};
const legacy=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/upgrade-0.7.1.json'),'utf8'));
store.set(K,JSON.stringify(legacy));let disk=Saves.open(storage,E,K),g=disk.load();
assert.deepEqual(E.encodeGame(g),expectedLegacySnapshot(E,legacy));assert(!g.active.sim.expansion);assert(disk.manual(g));
const from071=JSON.stringify(legacy.active.run.world.owned);
conclude(g.active);assert(E.advance(g.active));assert(g.active.sim.expansion);assert.deepEqual(Object.keys(g.active.world.owned),Object.keys(JSON.parse(from071)));
assert(disk.save(g));const a=JSON.stringify(E.encodeGame(g));
const slot2=disk.select(2,g);assert(slot2&&disk.current===2);assert(!disk.checkpoint());assert(disk.save(game(heir)));assert(disk.manual(game(heir)));
const secondExport=disk.exportFile(game(heir));assert(disk.select(3,game(heir)));assert.equal(disk.current,3);
const imported=disk.importFile(secondExport);assert(imported);assert.deepEqual(E.encodeGame(imported),E.encodeGame(game(heir)));const beforeBad=store.get(K+'.slot.3');
const bad=JSON.parse(secondExport);bad.game.active.age++;assert.equal(disk.importFile(JSON.stringify(bad)),null);
assert.equal(disk.importFile('{"__proto__":{}}'),null);assert.equal(disk.importFile('incomplete'),null);
assert.equal(store.get(K+'.slot.3'),beforeBad);
assert.equal(JSON.stringify(E.encodeGame(disk.select(1,imported))),a);assert.deepEqual(E.encodeGame(disk.restore()),expectedLegacySnapshot(E,legacy));
const restored=disk.recover();assert.equal(JSON.stringify(E.encodeGame(restored)),a);
store.set(K,'{interrupted');disk=Saves.open(storage,E,K);const recovered=disk.load();assert(recovered);assert.equal(store.get(K+'.recovery'),'{interrupted');
assert.deepEqual(E.encodeGame(recovered),expectedLegacySnapshot(E,legacy));assert.match(disk.message,/Recovered/);
const garbled=clone(E.encodeGame(game(heir)));garbled.active.run.simulation.expansion.portfolio.unknown=10;assert.equal(disk.importFile(JSON.stringify(garbled)),null);
const legacyImport=disk.importFile(JSON.stringify(legacy));assert(legacyImport);assert.equal(legacyImport.archive.length,1);assert.equal(legacyImport.active.event.id,'group-lab');
const integrity=JSON.parse(store.get(K));integrity.active.firstName='Damaged name';store.set(K,JSON.stringify(integrity));
assert.notEqual(Saves.open(storage,E,K).load().active.name,'Damaged name Park');
const full=Saves.open({getItem:storage.getItem,setItem:()=>{throw Error('QuotaExceededError');}},E,K);
assert(!full.save(game(heir)));assert(full.failed);assert.equal(full.select(2,game(heir)),null);
console.log('PASS actual 0.7.1 save, archive and pending event migration, exact expanded state round trips, independent slots, recoverable corruption, bad checksums, invalid files, quota failure, and offline transfer.');
