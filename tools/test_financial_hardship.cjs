'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const base=process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine,X=E.expansion,W=E.world,S=E.sim,Ec=X.economy;
const clone=v=>JSON.parse(JSON.stringify(v));
const london=S.geography.countries.GB.cities.find(c=>c.name==='London').id;
function household(year=2026,job=null){
  const l=E.makeLife({seed:738499,town:london,birthYear:year-32});
  Object.assign(l,{age:32,job,track:'gap',cash:0,event:{id:null,resolved:true}});
  l.sim.license=true;return l;
}
function year(l){
  const age=l.age,b=S.budget(l,age),cash=l.cash;
  l.age++;const actual=S.settle(l,age);
  assert.equal(l.cash,cash+b.net);assert.equal(actual.support,b.support);
  assert.equal(l.sim.lastBudget.earnedAge,age);assert.equal(l.sim.lastBudget.town,l.town);
  assert(Number.isSafeInteger(l.cash)&&l.cash>=0);return actual;
}
function act(l,id){
  const offer=S.hardshipOptions(l).find(o=>o.id===id);
  assert(offer,id);assert.equal(offer.reason,'',id+': '+offer.reason);
  const result=S.relief(l,id);assert(result?.text&&result?.title);return result;
}
function denied(l,id){
  const snapshot=JSON.stringify(l);assert.equal(S.relief(l,id),null);assert.equal(JSON.stringify(l),snapshot);
}

const poor=household(),start=S.budget(poor),snapshot=JSON.stringify(poor);
S.hardshipOptions(poor);S.budget(poor);assert.equal(JSON.stringify(poor),snapshot);
assert(start.support>0&&start.support<=start.living+start.housing);assert(start.warnings.length);
const preview=S.reliefPreview(poor,'shared');
assert(preview&&preview.after.housing<preview.before.housing);
assert.equal(JSON.stringify(poor),snapshot);
const assisted=clone(poor);act(assisted,'aid');assert.equal(assisted.cash,0);denied(assisted,'aid');
act(assisted,'essentials');act(assisted,'shared');
const assistedQuote=S.budget(assisted);assert(assistedQuote.living<start.living&&assistedQuote.housing<start.housing&&assistedQuote.arrears<start.arrears);
const ended=clone(assisted);act(ended,'essentials');act(ended,'shared');assert.equal(S.budget(ended).housing,start.housing);
let unmet=false;
for(let i=0;i<27;i++){
  const previous=S.debt(poor);
  const b=year(poor);unmet||=b.uncovered>0;
  assert.equal(poor.cash,0);
  const rentDebt=poor.sim.loans['housing-arrears'];
  assert((poor.sim.loans.living?.balance||0)<=Math.max(previous,b.creditLimit));
  if(rentDebt){
    assert.equal(rentDebt.rate,0);
    assert(rentDebt.balance<=Math.max(previous,Math.round(b.housing*2.3)));
  }
}
assert(unmet&&poor.stats.joy<60);assert(poor.sim.loans['housing-arrears']?.balance>0);
const enormous=household();enormous.sim.loans.living={principal:400,balance:329337};
const old=S.debt(enormous);for(let i=0;i<4;i++)year(enormous);assert.equal(enormous.sim.loans.living.balance,old);
const workout=S.reliefPreview(poor,'workout');assert(workout);
assert.equal(workout.after.interest,0);
act(poor,'workout');assert.equal(S.budget(poor).interest,0);denied(poor,'workout');
poor.job='clerk';for(let i=0;i<12;i++)year(poor);assert.equal(S.debt(poor),0);assert(poor.cash>0);

const creditor=household();creditor.sim.loans.living={balance:7600,principal:220};creditor.cash=5400;
act(creditor,'negotiate');assert.equal(creditor.cash,80);assert.equal(S.debt(creditor),0);denied(creditor,'negotiate');
const estate=household();estate.sim.loans={living:{balance:40000,principal:300},tuition:{balance:9000,principal:900},fines:{balance:1500,principal:500}};
estate.sim.fund=500;estate.cash=90;estate.sim.expansion.portfolio={industry:2};const previousWorth=W.netWorth(estate);assert(previousWorth<0);
act(estate,'bankruptcy');assert.equal(estate.sim.fund,0);assert.equal(X.portfolio(estate),0);assert(!estate.sim.loans.living);assert(estate.sim.loans.tuition&&estate.sim.loans.fines);
assert(estate.sim.finance.filedUntil===2033&&X.credit(estate)<40);denied(estate,'bankruptcy');assert.equal(S.budget(estate).arrears,0);
const medieval=household(1260);assert(!S.hardshipOptions(medieval).some(o=>o.id==='bankruptcy'));denied(medieval,'bankruptcy');
const child=household();child.age=12;denied(child,'aid');assert.equal(S.budget(child).support,0);assert.equal(S.budget(child).gross,0);

const borrower=household(2026,'physician');borrower.cash=1500000;
const property=W.shopping.inventory(borrower,'maple')[0];assert(S.mortgage(borrower,property.id));
const car=W.shopping.inventory(borrower,'corner')[0];assert(X.perform(borrower,'offer',car.id,'finance'));
const four=clone(borrower);four.cash=0;four.job=null;four.sim.expansion.policies.autopay=false;
for(const a of Object.values(four.world.owned)){a.vacant=true;}
const beforeLoan=four.sim.loans[property.id].balance;
let b=year(four);assert(b.warnings.length&&b.foreclosures.length===0&&four.sim.loans[property.id].balance>beforeLoan);
b=year(four);assert(b.warnings.some(w=>w.includes('One more missed')));const rescued=clone(four);act(rescued,'forbear');
assert.equal(rescued.sim.loans[property.id].misses,0);assert.equal(year(rescued).foreclosures.length,0);
b=year(four);assert.equal(b.foreclosures.length,2);assert(!four.world.owned[property.id]&&!four.sim.loans[car.id]);assert.equal(year(four).foreclosures.length,0);
const stagger=clone(borrower);stagger.cash=property.price;stagger.sim.loans.living={balance:999999,principal:450000};
assert(S.mortgageReason(stagger,W.shopping.inventory(stagger,'maple')[0].id));assert(S.borrowingCapacity(stagger,0)<5000);

const futureKid=household(2200);futureKid.age=15;futureKid.sim.timeline.youthShift=true;
assert(S.budget(futureKid).wages>0);delete futureKid.sim.timeline.youthShift;assert.equal(S.budget(futureKid).gross,0);

const idx=y=>Ec.priceIndex(98110,'GB',y);
for(const y of [2121,2200,2500,3000,4000,18000])assert(Number.isFinite(idx(y))&&idx(y)>idx(2050)&&idx(y)<50);
assert(idx(3000)>idx(2120)*1.15);assert.notEqual(idx(2121),idx(2120));
const series=Array.from({length:25},(_,i)=>idx(2400+i));assert.equal(new Set(series).size,25);
const portfolio=household();for(const y of [2090,2120,2500,3000])assert(X.shares(portfolio,'bonds',y-portfolio.born)>0);
assert(X.shares(portfolio,'bonds',3000-portfolio.born)>X.shares(portfolio,'bonds',2120-portfolio.born));
const owned=household(2070,'physician');owned.cash=20000000;const deed=W.shopping.inventory(owned,'maple')[0];assert(W.trade(owned,deed.id,'buy'));
const copy=clone(owned.world.owned[deed.id].listing),initial=owned.world.owned[deed.id].value,initialIndex=Ec.local(owned,owned.town).home;
for(let i=0;i<940;i++){
  const expected=W.appraisal(owned,deed.id);
  owned.age++;W.birthday(owned);assert.equal(owned.world.owned[deed.id].value,expected.value);
  assert(Number.isSafeInteger(expected.value)&&expected.value>0);
}
const indexedValue=owned.world.owned[deed.id].value/Ec.local(owned,owned.town).home;
assert(indexedValue/(initial/initialIndex)>.35&&indexedValue/(initial/initialIndex)<1.3);
assert.deepEqual(owned.world.owned[deed.id].listing,copy);
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/upgrade-0.5.0-market.json'),'utf8'));
const upgraded=E.decodeGame(clone(baseline)),again=E.encodeGame(upgraded);
for(const key of ['bankBalance','debt','netWorth'])assert.equal(again.active[key],baseline.active[key]);
assert.deepEqual(again.active.run.world.owned,baseline.active.run.world.owned);
assert.deepEqual(again.active.run.simulation.loans,baseline.active.run.simulation.loans);
assert.deepEqual(again.active.run.simulation.lastBudget,baseline.active.run.simulation.lastBudget);
const reload=E.decodeGame(clone(E.encodeGame({active:estate,archive:[],settings:{}}))).active;assert.deepEqual(reload.sim.finance,estate.sim.finance);S.validateFinance(reload);
reload.sim.loans.tuition.rate=-.2;assert.throws(()=>S.validateFinance(reload),/rate/);
console.log('PASS sustainable household credit, means-tested support, recovery, settlements, insolvency, secured delinquency, future youth payroll, real asset prices and 940-year appraisals.');
