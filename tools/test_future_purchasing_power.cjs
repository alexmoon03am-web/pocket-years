'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const dir=process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../app/src/main/assets');
const E=require(path.join(dir,'engine.js')).PocketEngine,H=E.historyEconomy,X=E.expansion.economy;
function median(a){return [...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];}
function at(y,seed,job,town='london'){
  const l=E.makeLife({name:'Robin Lane',seed,town,birthYear:y-32});
  Object.assign(l,{age:32,cash:25000});
  E.world.changeJob(l,job,true);
  return l;
}
const panels={};
for(const y of [2049,2050,2080,2200,3000]){
  const metrics={essentials:[],housing:[],surplus:[],property:[],wageIndex:[]};
  for(let i=0;i<36;i++){
    const l=at(y,12345+i*85199,'manager'),b=E.sim.budget(l),m=X.local(l),p=H.profile(l);
    const prices=H.listings(l).filter(i=>i.category==='Property').map(a=>a.price);
    metrics.essentials.push((b.housing+b.living)/(b.wages-b.tax));metrics.housing.push(b.housing/b.wages);
    metrics.surplus.push(b.net/b.wages);metrics.property.push(Math.min(...prices)/b.wages);
    metrics.wageIndex.push(p.pay);
    assert.equal(p.pay,X.wageIndex(l));
    assert.equal(m.year,y);
    if(y>=2050){
      const entry=at(y,33139+i*18191,'clerk');entry.cash=0;const eb=E.sim.budget(entry);
      assert(eb.gross-eb.tax-eb.housing-eb.living>=0,'An employed renter cannot meet basic costs in '+y);
    }
  }
  const result=Object.fromEntries(Object.entries(metrics).map(([key,values])=>[key,median(values)]));
  panels[y]=result;
  assert(result.essentials>.52&&result.essentials<.90,y+' essentials/after-tax pay '+result.essentials);
  assert(result.housing>.22&&result.housing<.43,y+' housing/gross pay '+result.housing);
  assert(result.surplus>.04&&result.surplus<.34,y+' disposable share '+result.surplus);
  assert(result.property>3&&result.property<16,y+' cheapest property in years of salary '+result.property);
}
for(const key of ['essentials','housing','surplus','property']){
  const ratio=panels[2050][key]/panels[2049][key];
  assert(ratio>.78&&ratio<1.24,key+' moved discontinuously at 2050: '+ratio);
}
const boundary=at(2049,184,'manager');
const cash=boundary.cash,offers=H.listings(boundary);
const deed=offers.find(x=>x.category==='Property');boundary.cash+=deed.price;
assert(E.historyPerform(boundary,'market',deed.id));
const owned=boundary.world.owned[deed.id],beforeValue=owned.value,value=E.world.appraisal(boundary,deed.id).value;
assert.equal(boundary.cash,cash);assert.deepEqual(owned.listing,deed);
assert(value>beforeValue*.73&&value<beforeValue*1.37);
const before=E.sim.budget(boundary);boundary.age++;
const after=E.sim.budget(boundary);assert(after.wages>before.wages*.7&&after.wages<before.wages*1.32);
assert.equal(boundary.world.contractRole,'manager');assert.equal(boundary.cash,cash);
const inland=at(2200,33,'clerk','cedar'),metro=at(2200,33,'clerk');
assert.notEqual(H.profile(metro).home,H.profile(inland).home);assert.notEqual(E.sim.budget(metro).housing,E.sim.budget(inland).housing);
console.log('PASS London purchasing power for 36 seeds at each of 2049, 2050, 2080, 2200 and 3000; continuous contract and deed, city variation, entry pay and 21–22% median manager surplus.');
