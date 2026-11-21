'use strict';
const {expectedLegacySnapshot}=require('./legacy_projection.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine;
const W=E.world,S=E.sim,shop=W.shopping;
const clone=value=>JSON.parse(JSON.stringify(value));
function adult(){
  const life=E.makeLife({seed:1701,name:'Ari Lake',town:'cedar'});
  Object.assign(life,{age:30,track:'work',job:'physician',cash:1000000});
  life.sim.license=true;
  E.year.workplace(life);
  return life;
}
function save(life){return clone(E.encodeGame({active:life,archive:[],settings:{motion:'system'}}));}
function resume(life){return E.decodeGame(save(life)).active;}
function settle(life){
  while(E.blocking(life)){
    if(life.sim.review)E.acknowledge(life);
    else if(life.sim.court)S.court(life,'plea');
    else E.decide(life,0);
  }
}
const allStocks=life=>Object.keys(shop.shops).flatMap(id=>shop.inventory(life,id));
const live=adult(),original=JSON.stringify(live);
assert.equal(Object.keys(shop.shops).length,14);
assert.equal(allStocks(live).length,42);
assert.deepEqual(allStocks(live),allStocks(resume(live)));
assert.equal(JSON.stringify(live),original,'Browsing or saving changed the world');
assert(!shop.offer(live,'flat'));
assert.equal(W.trade(live,'flat','buy'),null);
const second=E.makeLife({seed:276,name:'Cory Park'});second.age=live.age;
assert.notDeepEqual(allStocks(live).map(o=>o.price),allStocks(second).map(o=>o.price));
assert.equal(shop.offer(second,allStocks(live)[0].id),null);
const minor=adult();minor.age=15;assert.equal(allStocks(minor).length,0);
minor.age=16;assert.deepEqual([...new Set(allStocks(minor).map(i=>i.shop))],['corner']);
minor.sim.license=false;
const teenCar=shop.inventory(minor,'corner')[0];
assert.match(W.possessionReason(minor,teenCar.id,'buy'),/license/);
assert.equal(W.trade(minor,teenCar.id,'buy'),null);
minor.cash=0;assert.equal(S.budget(minor).gross,0);

const seen={Property:new Set(),Vehicle:new Set()},models=new Set(),conditions=new Set(),carYears=new Set();
let foundNew=false,foundUsed=false;
const sample=adult();
for(let age=18;age<=91;age++){
  sample.age=age;
  for(const [id,dealer] of Object.entries(shop.shops)){
    const items=shop.inventory(sample,id);
    assert.equal(items.length,3);
    assert.equal(new Set(items.map(i=>i.type)).size,3);
    sample.age--;const past=shop.inventory(sample,id);sample.age++;
    if(age>18){
      assert(items.some(i=>!past.some(x=>x.type===i.type)));
      assert(past.some(i=>!items.some(x=>x.type===i.type)));
      assert(past.every(i=>shop.offer(sample,i.id)===null));
    }
    for(const item of items){
      assert.equal(shop.offer(sample,item.id).price,item.price);
      assert(Number.isInteger(item.price)&&item.price>0);
      assert(item.condition>0&&item.condition<=100);
      assert.equal(item.shop,id);seen[dealer.category].add(item.type);conditions.add(item.condition);
      if(item.category==='Vehicle'){
        models.add(item.model);carYears.add(item.modelYear);
        assert(item.modelYear<=item.listedYear&&Number.isInteger(item.miles));
        if(item.newCar){foundNew=true;assert.equal(item.condition,100);assert(item.miles<35);}
        else{foundUsed=true;assert(item.miles>4000);}
      }else{assert(item.address&&Number.isInteger(item.beds)&&item.baths>=1&&item.built<item.listedYear&&item.rent>0);}
    }
  }
}
assert.equal(seen.Property.size,48);assert.equal(seen.Vehicle.size,64);assert.equal(models.size,128);
assert(foundNew&&foundUsed&&conditions.size>35&&carYears.size>40);

const buyer=adult(),stock=shop.inventory(buyer,'maple'),deed=stock[0],car=shop.inventory(buyer,'ridge')[0];
const money=buyer.cash;
assert(S.mortgage(buyer,deed.id));assert.equal(buyer.cash,money-S.downPayment(deed));
assert.equal(buyer.sim.loans[deed.id].balance,deed.price-S.downPayment(deed));
assert.equal(buyer.world.owned[deed.id].condition,deed.condition);
assert.deepEqual(shop.inventory(buyer,'maple').map(x=>x.id),stock.slice(1).map(x=>x.id));
assert.equal(S.mortgage(buyer,deed.id),null);assert.equal(W.trade(buyer,deed.id,'buy'),null);
assert(W.trade(buyer,car.id,'buy'));assert.equal(buyer.cash,money-S.downPayment(deed)-car.price);
assert.equal(buyer.world.owned[car.id].odometer,car.miles);assert(E.actionList(buyer).some(x=>x[0]==='road'));
const tape=save(buyer);assert.deepEqual(save(E.decodeGame(tape).active),tape);
assert(S.budget(buyer).rent===0&&S.budget(buyer).upkeep>0&&!S.budget(buyer).housing);
const peer=resume(buyer),unbought=stock[1],beforeOdometer=buyer.world.owned[car.id].odometer;
assert(E.advance(buyer)&&E.advance(peer));settle(buyer);settle(peer);assert.deepEqual(save(peer),save(buyer));
assert.equal(shop.offer(buyer,unbought.id),null);assert.equal(W.trade(buyer,unbought.id,'buy'),null);assert.equal(S.mortgage(buyer,unbought.id),null);
assert.equal(buyer.world.owned[deed.id].listing.address,deed.address);
assert(buyer.world.owned[car.id].odometer>beforeOdometer);
const originalName=shop.title(shop.ownedItem(car.id,buyer.world.owned[car.id]));
assert.equal(originalName,shop.title(car));
assert(W.repair(buyer,car.id));assert.equal(buyer.world.owned[car.id].condition,100);
const vehicleValue=buyer.world.owned[car.id].value;
const preSale=buyer.cash;assert(W.trade(buyer,car.id,'sell'));assert.equal(buyer.cash,preSale+vehicleValue);
const fresh=shop.inventory(buyer,'corner')[0];assert(W.trade(buyer,fresh.id,'buy'));assert(W.trade(buyer,fresh.id,'sell'));
assert.equal(shop.offer(resume(buyer),fresh.id),null,'Sold stock reappeared within the same year');

let another;
for(let elapsed=0;elapsed<12&&!another;elapsed++){
  another=shop.inventory(buyer,'maple').find(i=>i.type===deed.type);
  if(!another){assert(E.advance(buyer));settle(buyer);}
}
assert(another&&another.id!==deed.id&&another.address!==deed.address);
assert(S.mortgage(buyer,another.id));assert(buyer.sim.loans[deed.id]&&buyer.sim.loans[another.id]);
const borrow2=buyer.sim.loans[another.id].balance,worth=W.netWorth(buyer);
assert(W.trade(buyer,deed.id,'sell'));assert.equal(W.netWorth(buyer),worth);assert(!buyer.sim.loans[deed.id]);
assert.equal(buyer.sim.loans[another.id].balance,borrow2);
assert(W.adopt(buyer,'Casey'));const portion=S.estate(buyer).kid1;
assert.deepEqual(portion.assets[another.id].listing,another.listing);
buyer.ended=true;buyer.sim.cause='Old age';const child=E.continueAs(buyer,'kid1');
assert.deepEqual(child.world.owned[another.id].listing,another.listing);assert.equal(child.sim.loans[another.id].balance,borrow2);
assert.equal(shop.title(shop.ownedItem(another.id,child.world.owned[another.id])),shop.title(another));
assert.equal(W.trade(child,another.id,'sell'),null);

const previous=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/upgrade-0.5.0-market.json'),'utf8'));
const older=E.decodeGame(clone(previous));assert.deepEqual(E.encodeGame(older),expectedLegacySnapshot(E,previous));
const legacy=older.active;
assert.equal(shop.ownedItem('rowhouse',legacy.world.owned.rowhouse).name,'Brick row house');
assert.equal(shop.ownedItem('van',legacy.world.owned.van).name,'Camper van');
assert(E.actionList(legacy).some(i=>i[0]==='supper')&&E.actionList(legacy).some(i=>i[0]==='road'));
assert.equal(S.budget(legacy).rent,0);assert.equal(S.budget(legacy).housing,0);
assert.equal(legacy.sim.loans.rowhouse.balance,102400);const olderWorth=W.netWorth(legacy);
assert(W.trade(legacy,'rowhouse','sell'));assert.equal(W.netWorth(legacy),olderWorth);
console.log('PASS 14 shops, 48 home types, 64 vehicle types, 128 fictional models, new and used inventory, ages, and guaranteed annual turnover.');
console.log('PASS listing identity, asking prices, save and reload, independent mortgages, repair, resale, mileage, inheritance and exact v0.5.0 financial migration.');
