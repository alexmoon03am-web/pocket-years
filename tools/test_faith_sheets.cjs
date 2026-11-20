'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {start,base}=require('./interface_host.cjs');
const E=require(path.join(base,'engine.js')).PocketEngine;
const slot='studio.pocketyears.save.v1';
const decoded=u=>E.decodeGame(u.state()).active;
const page=u=>u.visible().textContent;
const at=(storage,sheet)=>start(storage,{hash:'#activities/'+sheet,asyncBack:true});
const finish=u=>{u.flushBack();u.tick();};
function storeFor(age,born=1350){
  const l=E.makeLife({name:'Kit Vale',birthYear:born,seed:88,town:'london',faithId:'unaffiliated'});
  l.age=age;l.cash=32000;
  return new Map([[slot,JSON.stringify(E.encodeGame({active:l,archive:[],settings:{motion:'reduce'}}))]]);
}
function icons(u){
  for(const image of u.visible().querySelectorAll('img')){
    assert(fs.existsSync(path.join(base,image.getAttribute('src'))),image.getAttribute('src'));
  }
}
const infant=at(storeFor(0),'faith-home');
assert(infant.button('sheet','faith-found').disabled);
assert.match(page(at(infant.store,'faith-found')),/18/);
const memory=storeFor(24);
let u=at(memory,'faith-home');
assert.equal(u.visible().querySelectorAll('progress').length,4);
icons(u);
u.click('sheet','faith-practice');
const stale=u.button('faith-run','study'),initial=decoded(u).sim.faith.knowledge;
u.click('faith-run','study');u.dispatch(stale);finish(u);
assert.equal(decoded(u).sim.faith.knowledge,initial+7);

u=at(memory,'faith-directory');assert(u.button('sheet','faith-tradition~catholic'));
assert(!u.button('sheet','faith-tradition~methodist'));
u.click('sheet','faith-tradition~catholic');
for(const label of ['Origins','Simulated communities','Observances','Community roles'])assert(page(u).includes(label));
u.click('faith-run','join-catholic');finish(u);
assert.equal(decoded(u).sim.faith.id,'catholic');

u=at(memory,'faith-found');
for(const name of Object.keys(E.faithMovements.defaultDraft(decoded(u))))assert(u.el('faith-field-'+name),name);
assert(!u.el('faith-field-sharing').querySelector('option[value="online"]'));
u.submit('faith-form');assert.match(u.el('faith-form').querySelector('.faith-error').textContent,/name/i);
const marked='<b>Orchard & Vale</b>';
u.el('faith-field-name').value=marked;
u.el('faith-field-teachings').value='Bring a spare chair.';
u.el('faith-field-governance').value='elected';
u.submit('faith-form');finish(u);
let life=decoded(u);
const m=E.faithMovements.list(life)[0],id=m.id,dashboard='faith-movement~'+id;
assert.equal(m.name,marked);assert.equal(m.original.teachings,'Bring a spare chair.');
u=at(memory,dashboard);
assert(u.el('sheet-title').textContent===marked&&!u.el('sheet-title').querySelector('b'));
assert(page(u).includes('Reputation'));assert(page(u).includes('Regional membership'));icons(u);
u.click('sheet','faith-charter~'+id);assert(page(u).includes('Bring a spare chair.'));
u=at(memory,'faith-manage~'+id);icons(u);
const reform=u.visible().querySelectorAll('button[data-do="sheet"]').find(b=>b.textContent.includes('Propose a reform'));
u.click('sheet',reform.dataset.key);
assert.equal(u.el('faith-field-governance').value,'elected');
u=at(memory,'faith-manage~'+id);
const rename=u.visible().querySelectorAll('button[data-do="sheet"]').find(b=>b.textContent.includes('Rename the movement'));
u.click('sheet',rename.dataset.key);u.el('faith-field-name').value='New Orchard Assembly';u.submit('faith-form');finish(u);
life=decoded(u);assert.equal(E.faithMovements.get(life,id).original.name,marked);assert.equal(E.faithMovements.get(life,id).name,'New Orchard Assembly');
u=at(memory,'faith-leadership~'+id);assert(page(u).includes('Leader'));icons(u);
u=at(memory,'faith-institutions');
const s=E.faithInstitutions.records(decoded(u),life.town)[0];u.click('sheet','faith-site~'+s.id);
assert(page(u).includes('Annual forecast'));icons(u);
const cash=decoded(u).cash;
const donation=E.faithInstitutions.actions(decoded(u),'institution:'+s.id).find(a=>a.title.includes('personal donation'));
u.click('faith-run',donation.id);finish(u);
life=decoded(u);assert.equal(life.cash,cash-donation.cost);
assert.equal(E.faithInstitutions.records(life).find(v=>v.id===s.id).treasury,s.treasury+donation.cost);
for(const key of ['faith-family','faith-career','faith-museum','faith-npc~carer','faith-belief']){
  u=at(memory,key);assert(u.visible().querySelector('.sheet'));icons(u);
}
u=at(memory,'hist-capsule~current');
assert(page(u).includes('Starting outlook')&&page(u).includes('New Orchard Assembly'));
assert.equal(at(storeFor(20,2050),'faith-found').el('faith-field-sharing').querySelector('option[value="online"]').value,'online');
// A millennium of councils must remain browsable on a phone without a millennium of DOM nodes.
const oldAssembly=E.faithMovements.get(life,id);
const raw=Array.from({length:1049},(_,i)=>({year:1350+i,kind:i%7===0?'reform':'local succession',text:'Resolution '+i+'.'}));
oldAssembly.history=raw;oldAssembly.works=raw.slice(0,24).map((r,i)=>({year:r.year,title:'Work '+i,author:'A. Author'}));
const archives=new Map([[slot,JSON.stringify(E.encodeGame({active:life,archive:[],settings:{motion:'reduce'}}))]]);
u=at(archives,dashboard);
assert(page(u).includes('Resolution 1048.')&&!page(u).includes('Resolution 1044.'));
const archivePage=(section,n)=>'faith-chronicle~'+id+'~'+section+'~'+n;
u.click('sheet',archivePage('all',0));assert(page(u).includes('Future Era'));
const allRead=[];
for(let n=0;;n++){
  const entries=u.visible().querySelectorAll('li');assert(entries.length>0&&entries.length<=20);
  allRead.push(...entries.map(e=>Number(e.textContent.match(/Resolution (\d+)\./)[1])));
  if(!u.button('sheet',archivePage('all',n+1)))break;
  u.click('sheet',archivePage('all',n+1));
}
assert.deepEqual(allRead,raw.map((_,i)=>raw.length-1-i));
assert(page(u).includes('Medieval Era'));
u.click('sheet',archivePage('all',0));assert(page(u).includes('Resolution 1048.'));
u=at(archives,'faith-leadership~'+id);u.click('sheet',archivePage('leadership',0));
const successions=raw.filter(e=>e.kind==='local succession'),last=Math.ceil(successions.length/20)-1;
u.click('sheet',archivePage('leadership',last));assert(page(u).includes(successions[0].text)&&!page(u).includes(raw[0].text));
u.key('Escape');assert(u.button('sheet',archivePage('leadership',0)));
u=at(archives,dashboard);u.click('sheet',archivePage('works',0));
u.click('sheet',archivePage('works',1));assert(page(u).includes('Work 0')&&u.visible().querySelectorAll('li').length===4);
console.log('Faith sheets: age gates, practice, affiliation, founding, charter, reform defaults, rename, succession, institution funds, archived outlook, era checks and full paged millennial movement histories passed.');
