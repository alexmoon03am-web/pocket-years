'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine;
const H=E.historyEconomy;
function life(year,age=24,town='london'){
  const l=E.makeLife({seed:733,name:'Ada Vale',town,birthYear:year-age});
  l.age=age;l.cash=1250000;l.sim.timeline.training=4;
  return l;
}
function buy(l,area,id){
  const oldCash=l.cash,oldLog=l.log.length;
  const row=H.actions(l,area).find(r=>r.id===id);
  assert.ok(row,'Option '+id);assert.equal(row.reason,'');
  const result=E.historyPerform(l,area,id);
  assert.ok(result?.text);assert.equal(l.log.length,oldLog+1);
  if(row.cost)assert.equal(oldCash-l.cash,row.cost);
  return result;
}
for(const year of [1240,1612,1850,1922,1973,1988,2026,2080,3010]){
  const l=life(year),untouched=JSON.stringify(l);
  for(const area of ['activities','work','business','school','market']){
    const rows=H.actions(l,area);assert.ok(rows.length>0,year+'/'+area);
    assert.equal(rows.length,new Set(rows.map(a=>a.id)).size);
  }
  assert.equal(JSON.stringify(l),untouched,'Browsing must not advance state.');
  if(year<2000)assert.deepEqual(E.world.shopping.inventory(l,'apex'),[]);
  const opening=H.actions(l,'work').find(a=>!a.reason);
  buy(l,'work',opening.id);assert.equal(E.sim.budget(l).wages,H.wage(l,l.job));
  const initialWage=E.sim.budget(l).wages;
  buy(l,'work','practice');buy(l,'work','advance');assert.ok(E.sim.budget(l).wages>initialWage);
  const stock=H.listings(l),product=stock[0];
  assert.equal(H.validListing(product.id,product),true);
  buy(l,'market',product.id);assert.equal(E.historyPerform(l,'market',product.id),null);
  assert.equal(E.world.shopping.title(E.world.shopping.ownedItem(product.id,l.world.owned[product.id])),product.name);
  assert.equal(E.sim.budget(l).rent>=0,true);
  buy(l,'business',H.actions(l,'business').find(o=>o.id.startsWith('open-')).id);
  const firm=Object.values(l.sim.expansion.companies)[0],before=firm.capital;
  const forecast=E.expansion.businessYear(l).rows.find(r=>r.id===firm.id);
  assert.ok(Number.isFinite(forecast.net));
  const yearAge=l.age;l.age++;const b=E.sim.settle(l,yearAge);
  E.expansion.annual(l,b,yearAge);const settled=firm.capital;
  E.expansion.annual(l,b,yearAge);assert.equal(firm.capital,settled);assert.equal(settled,before+forecast.retained);
  assert.deepEqual(l.world.owned[product.id].listing,product);
  assert.equal(E.historyPerform(l,'market',stock[1].id),null,'Stale quotes must fail.');
  const game={active:l,archive:[],settings:{motion:'system'}};
  const saved=JSON.parse(JSON.stringify(E.encodeGame(game)));
  const newLife=E.decodeGame(saved).active;
  assert.deepEqual(newLife.world.owned,l.world.owned);
  assert.deepEqual(newLife.sim.expansion.companies,l.sim.expansion.companies);
  assert.ok(H.validListing(product.id,newLife.world.owned[product.id].listing));
}
const worker=life(1355,14);assert.equal(E.sim.budget(worker).wages,0);buy(worker,'work','shift');assert.ok(E.sim.budget(worker).wages>0);
buy(worker,'work','endshift');assert.equal(E.sim.budget(worker).wages,0);
const old=life(1499);const offer=H.actions(old,'business')[0];buy(old,'business',offer.id);
const firm=Object.values(old.sim.expansion.companies)[0];
const wealthBefore=E.world.netWorth(old),firmType=firm.type;old.age++;
assert.equal(E.world.netWorth(old),wealthBefore,'Calendar denomination must not create or destroy purchasing power.');
assert.equal(firm.type,firmType,'Firms are not converted automatically.');
buy(old,'business','adapt-'+firm.id);
assert.equal(firm.originYear,1499);assert.notEqual(firm.type,firmType);
old.age+=540;
assert.ok(Number.isFinite(E.expansion.businessYear(old).rows[0].payout),'An old firm still trades in a modern year.');
assert.notEqual(H.money(life(1300),1000),H.money(life(2026),1000));
const venue=E.historyWorld.choices(1300).find(p=>p.region==='americas');
assert.ok(venue);const remote=life(1350,24,venue.id);
for(let i=0;i<25;i++){
  remote.age++;
  assert.ok(H.listings(remote).every(a=>!['era-horse','era-goats','era-estate'].includes(a.type)));
  assert.ok(H.actions(remote,'work').every(a=>!['job-era-knight','job-era-retainer'].includes(a.id)));
}
const modern=life(2001);
for(const store of ['apex','summit','ridge','parkway']){
  for(const a of E.world.shopping.inventory(modern,store))assert.ok(!['evsuv','electrictruck','evsport','hyperhybrid','electricgt','evhatch'].includes(a.type));
}
console.log('Historical economy verified across nine dates, payroll, pricing, assets, companies, regional offerings, succession-ready holdings, and save round trips.');
