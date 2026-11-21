'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {start,base}=require('./interface_host.cjs'),E=require(path.join(base,'engine.js')).PocketEngine;
const slot='studio.pocketyears.save.v1';
const state=u=>E.decodeGame(u.state()).active,text=u=>u.visible().textContent;
function life(birthYear,age,cash=4000){
  const l=E.makeLife({seed:431,name:'Cedar $42',birthYear,town:'london'});
  Object.assign(l,{age,cash,event:{id:null,resolved:true},eventQueue:[]});
  return l;
}
function storage(l,motion='reduced'){
  return new Map([[slot,JSON.stringify(E.encodeGame({active:l,archive:[],settings:{motion}}))]]);
}
function boot(l,hash,opts={}){
  return start(storage(l,opts.motion),{hash,asyncBack:true,...opts});
}
const wait=u=>{u.flushBack();u.tick();};
const future=life(2085,25);
let u=boot(future,'#people');
assert(u.button('sheet','date').textContent.includes('35 credits'));
u.click('sheet','date');assert(text(u).includes('35 credits')&&!text(u).includes('$35'));
const staleDate=u.button('date');u.click('date');u.dispatch(staleDate);wait(u);
assert.equal(state(u).cash,3965);assert.match(state(u).log.at(-1).body,/35 credits/);
assert.equal(state(u).name,'Cedar $42');
u=boot(future,'#activities/hub-travel');
assert.match(u.button('sheet','license').textContent,/30 credits/);u.click('sheet','license');
assert.match(text(u),/Test fee30 credits/);u.click('license','stop');wait(u);
assert.equal(state(u).cash,3970);
u=boot(future,'#activities/match-0');
assert.match(u.button('match','0').textContent,/15 credits/);
u.click('match','0');wait(u);assert.equal(state(u).cash,3985);
u=boot(future,'#activities/hub-nightlife');
assert.match(u.button('sheet','do-casino').textContent,/100 credits/);u.click('sheet','do-casino');
assert(!text(u).includes('$100')&&text(u).includes('200 credits'));u.click('sim','casino');wait(u);
assert.equal(Math.abs(state(u).cash-4000),100);assert.match(state(u).log.at(-1).body,/100 credits/);

const owner=life(2085,25);
const home=E.world.shopping.inventory(owner,'maple')[0];E.world.shopping.take(owner,home);
const appraisal=E.world.appraisal(owner,home.id);
u=boot(owner,'#assets/sell-'+home.id);
assert(text(u).includes('Next birthday appraisal')&&text(u).includes(E.historyEconomy.money(owner,appraisal.value,owner.age+1)));
const employee=life(2085,25);
E.world.changeJob(employee,'clerk',true);
employee.world.since=18;employee.world.performance=98;employee.rng=1;
u=boot(employee,'#career/hub-work');u.click('sim','raise');wait(u);
const raised=state(u);
assert(raised.extraPay>0);
assert(raised.log.at(-1).body.includes(E.historyEconomy.money(raised,E.expansion.economy.salary(raised,raised.job,E.jobs))));
const under=life(2085,16);u=boot(under,'#activities/license');assert(text(u).includes('Test feeFree'));
u.click('license','stop');wait(u);assert.equal(state(u).cash,under.cash);
const poor=life(2085,25,0);u=boot(poor,'#activities/hub-travel');
assert(u.button('sheet','license').disabled&&u.button('sheet','license').textContent.includes('30 credits'));
u=boot(life(2024,26),'#assets/budget');
const records=state(u);records.sim.lastBudget={...E.sim.budget(records),year:2050,earnedAge:25,town:records.town};
u=boot(records,'#assets/budget');const ledgers=u.visible().querySelectorAll('.ledger');
assert.match(ledgers[0].textContent,/credits/);assert.match(ledgers[1].textContent,/\$/);assert(!ledgers[1].textContent.includes('credits'));
u=boot(life(1800,28),'#career');
const action=u.visible().querySelectorAll('button[data-do="sheet"]').find(b=>!b.disabled&&b.dataset.key.includes('hist-review~work~job-era-'));
assert(action);u.click('sheet',action.dataset.key);const staleConfirmation=u.button('hist-run',action.dataset.key);
u.click('close');u.flushBack();u.dispatch(staleConfirmation);assert.equal(state(u).job,null);
u.click('sheet',action.dataset.key);const confirm=u.button('hist-run',action.dataset.key);
u.click('hist-run',action.dataset.key);u.dispatch(confirm);wait(u);
assert(state(u).job.startsWith('era-'));assert.equal(state(u).log.filter(e=>e.kind==='Career'&&e.title===state(u).log.at(-1).title).length,1);
u=boot(life(1600,1),'#life/menu');u.click('sheet','realism');const staleMode=u.button('set-realism','historical');
u.click('set-realism','historical');u.dispatch(staleMode);assert.equal(E.year.realism(state(u)),'historical');
u.click('set-realism','guided');assert.equal(E.year.realism(state(u)),'guided');
u=boot(life(2026,0),'#life/edit');u.el('birth-realism').value='historical';u.submit('character-form');wait(u);assert.equal(E.year.realism(state(u)),'historical');
const ageing=life(2026,28);u=boot(ageing,'#life');const ageButton=u.el('age-control');
u.dispatch(ageButton,1,1000);u.dispatch(ageButton,1,1040);assert.equal(state(u).age,ageing.age+1);
if(!E.blocking(state(u))){
  u.click('sheet','stats');assert(u.el('sheet-title'));u.click('close');wait(u);
  u.dispatch(ageButton,1,1400);assert.equal(state(u).age,ageing.age+2);
}
assert.equal(u.records.length,0);
const preexisting=life(2026,28);preexisting.event={id:'lost-wallet',resolved:false};
u=boot(preexisting,'#life');const previous=u.button('choose','1');
u.click('choose','1');const first=state(u).cash;u.dispatch(previous);assert.equal(state(u).cash,first);
assert(u.button('ack','lost-wallet'));u.click('ack','lost-wallet');wait(u);
assert.equal(state(u).turns,1);
const distressed=life(2026,41,0);distressed.sim.loans.living={balance:24000,principal:1800,rate:.025};
distressed.sim.loans['housing-arrears']={balance:7200,principal:720,rate:0};
u=boot(distressed,'#assets/budget');assert.match(text(u),/Housing arrears.*7,200/);
assert.match(text(u),/Outstanding balances/);u.click('sheet','household-help');
const snapshot=u.state();
u.click('sheet','relief-shared');assert.match(text(u),/Next annual housing bill/);
assert.match(text(u),/New rent arrears next birthday/);assert.deepEqual(u.state(),snapshot);
u.click('sheet','household-help');wait(u);
const choice=E.sim.hardshipOptions(state(u)).find(o=>o.id==='essentials');assert(choice&&!choice.reason);
u.click('sheet','relief-essentials');assert(text(u).includes(choice.desc));
const old=u.button('relief','essentials');u.click('relief','essentials');u.dispatch(old);wait(u);
assert(E.sim.budget(state(u)).living<E.sim.budget(distressed).living);
console.log('PASS future prices, receipts and cash deltas; past-currency ledger; Android stale confirmations and rapid taps; saved realism controls and household assistance.');
