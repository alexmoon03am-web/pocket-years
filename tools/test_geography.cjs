'use strict';
const {expectedLegacySnapshot}=require('./legacy_projection.cjs');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const base=process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine,S=E.sim,W=E.world,G=S.geography;
const clone=x=>JSON.parse(JSON.stringify(x));
const serialize=l=>clone(E.encodeGame({active:l,archive:[],settings:{motion:'system'}}));
const resume=l=>E.decodeGame(serialize(l)).active;
const codes='AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW'.split(' ');
assert.equal(new Set(codes).size,195);
assert(codes.every(code=>G.countries[code]&&G.countries[code].cities.some(c=>!c.legacy)));
assert.equal(G.countryList.length,243);
assert(G.countries.XK&&G.countries.TW&&G.countries.HK&&G.countries.PR&&G.countries.GL);
for(const code of ['AQ','BV','TF','UM','GS','HM','IO'])assert(!G.countries[code]);
assert.equal(new Set(Object.values(G.cities).map(c=>c.id)).size,G.realCount+3);
const real=Object.values(G.cities).filter(c=>!c.legacy);
assert.equal(real.length,G.realCount);assert(real.length>=4500);
const search=(q,code)=>G.search(q,'',15).find(c=>c.kind==='city'&&c.code===code);
for(const [q,code,name] of [['Washington DC','US','Washington, D.C.'],['Sao Paulo','BR','São Paulo'],['東京','JP','Tokyo'],
  ['Bombay','IN','Mumbai'],['Paris, France','FR','Paris'],['Lagos Nigeria','NG','Lagos'],['Ngerulmud','PW','Ngerulmud'],['Denigomodu','NR','Denigomodu']]){
  assert.equal(G.cities[search(q,code).id].name,name,q);
}
assert.equal(G.search('UAE')[0].id,'AE');assert.equal(G.search('Holy See')[0].id,'VA');
assert.equal(G.search('country that does not exist').length,0);assert.deepEqual(G.search(''),[]);
assert(!G.international('seattle','atlanta'));assert(!G.international('seattle',G.countries.PR.cities[0].id));
assert(G.international('seattle','osaka'));assert.equal(G.cities['__proto__'],undefined);
const randomCodes=new Set(Array.from({length:G.countryList.length},(_,i)=>G.cities[G.randomCity((i+.5)/G.countryList.length)].code));
assert.equal(randomCodes.size,G.countryList.length);
const origin=E.makeLife({town:'cedar',name:'Rowan Reed',seed:72});
Object.assign(origin,{age:30,cash:80500,job:'physician',track:'work'});E.year.workplace(origin);
let checked=0;
for(const c of real){
  const l=clone(origin),rng=l.rng;
  assert.equal(E.makeLife({seed:79,town:c.id}).town,c.id);
  assert(!S.moveReason(l,c.id));const move=S.relocate(l,c.id);assert(move,c.id);
  assert.equal(l.cash,origin.cash-S.movingFee);assert.equal(l.town,c.id);assert.equal(l.sim.birthplace,'cedar');
  assert.equal(l.rng,rng);assert.equal(l.sim.residences[0].to,c.id);assert(l.log.at(-1).body.includes(G.label(c.id)));
  const state=E.state(l);assert.equal(state.city,c.name);assert.equal(state.country,G.stateCountry(c.id));
  if(checked++%55===0)assert.deepEqual(serialize(resume(l)),serialize(l));
}
assert.equal(checked,G.realCount);
const missing=clone(origin);for(const bad of ['missing','__proto__','constructor',null]){
  assert.equal(S.relocate(missing,bad),null);assert.deepEqual(missing,origin);
}
for(const mut of [l=>l.age=17,l=>l.cash=S.movingFee-1,l=>l.sim.prison=1,l=>l.ended=true,
  l=>l.event={id:'lost-wallet',resolved:false},l=>l.used.push('relocate')]){
  const l=clone(origin);mut(l);const previous=clone(l);
  assert.equal(S.relocate(l,'osaka'),null);assert.deepEqual(l,previous);
}
const l=clone(origin);assert(S.relocate(l,'atlanta'));assert.match(l.log.at(-1).title,/^Moved to /);
let before=clone(l);assert.equal(S.relocate(l,'osaka'),null);assert.deepEqual(l,before);
const testLife=clone(origin);assert(W.adopt(testLife,'Sage'));
const home=W.shopping.inventory(testLife,'maple')[0],previousStock=W.shopping.inventory(testLife,'field')[0];
assert(S.mortgage(testLife,home.id));assert.equal(S.budget(testLife).housing,0);
const principal=S.debt(testLife),rent=W.rent(testLife),holding=clone(testLife.world.owned[home.id]);
assert(S.relocate(testLife,'osaka'));assert.equal(S.debt(testLife),principal);assert.equal(W.rent(testLife),rent);
assert.deepEqual(testLife.world.owned[home.id],holding);assert(S.budget(testLife).housing>0);
assert.equal(W.shopping.offer(testLife,previousStock.id),null);
const secondHome=W.shopping.inventory(testLife,'keyline')[0];assert.equal(secondHome.listing.town,'osaka');
assert(S.mortgage(testLife,secondHome.id));assert.equal(S.budget(testLife).housing,0);
assert.equal(testLife.people.kid1.birthTown,'cedar');testLife.ended=true;testLife.sim.cause='Old age';
const child=E.continueAs(testLife,'kid1');
assert.equal(child.sim.birthplace,'cedar');assert.equal(child.town,'osaka');
assert.equal(child.world.owned[home.id].listing.town,'cedar');assert.equal(child.world.owned[secondHome.id].listing.town,'osaka');

const old=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/upgrade-0.6.0-residence.json'),'utf8'));
const loaded=E.decodeGame(clone(old));assert.deepEqual(E.encodeGame(loaded),expectedLegacySnapshot(E,old));
const active=loaded.active;assert.equal(active.town,'osaka');assert.equal(active.sim.birthplace,'toronto');
assert.equal(S.childBirthplace(active,active.people.kid1),'toronto');
function settle(x){while(E.blocking(x)){if(x.sim.review)E.acknowledge(x);else if(x.sim.court)S.court(x,'plea');else E.decide(x,0);}}
assert(E.advance(active));settle(active);
const balance=active.cash,uk=search('London','GB').id,asset=Object.values(active.world.owned)[0];
assert(S.relocate(active,uk));assert.equal(active.cash,balance-S.movingFee);assert.equal(asset.town,'toronto');
assert.equal(active.people.kid1.birthTown,'toronto');assert.equal(E.state(active).country,'UK');
assert.deepEqual(E.encodeGame(loaded).archive,expectedLegacySnapshot(E,old).archive);assert.deepEqual(serialize(resume(active)),serialize(active));
console.log('PASS '+checked+' real destinations in '+G.countryList.length+' countries and territories, all 195 UN member and observer states, worldwide births, searches, residence changes and local saves.');
console.log('PASS domestic and international moves, fee and annual limits, household and child birthplace, local housing, property abroad, and an exact v0.6.0 save upgrade.');
