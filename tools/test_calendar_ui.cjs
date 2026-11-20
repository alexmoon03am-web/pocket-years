'use strict';
const assert=require('node:assert/strict');
const {start,base}=require('./interface_host.cjs');
const path=require('node:path');
const U=require(path.join(base,'era-ui.js'));
const expected=[[1200,'medieval'],[1500,'renaissance'],[1700,'industrial'],[1900,'press'],[1950,'midcentury'],[1980,'terminal'],[2000,'web'],[2020,'modern'],[2050,'future'],[2150,'planetary'],[2500,'stellar']];
for(const [i,[year,id]] of expected.entries()){
  assert.equal(U.themeForYear(year),id);
  if(i)assert.equal(U.themeForYear(year-1),expected[i-1][1]);
}
for(const era of U.eras){
  for(const year of [era.first,era.last,era.start])assert(U.validYear(era,year));
  for(const year of [era.first-1,era.last+1,'',null,era.first+.5])assert(!U.validYear(era,year));
}
assert.equal(U.themeForYear(3889),'stellar');
assert.equal(U.activeTheme({born:1200,age:1,sim:{}},'unknown'),'modern');
const key='studio.pocketyears.save.v1';
const storage=new Map();
const ui=start(storage);
const root=ui.doc.documentElement;
assert.equal(root.dataset.theme,'modern');
ui.click('edit-form');
ui.change('birth-era','medieval');
assert.equal(ui.el('birth-year').value,'1200');
assert(ui.el('town').querySelectorAll('option').length>2);
ui.change('birth-year','1199');
ui.submit('character-form');
assert(ui.el('character-form'),'Birth year below minimum must keep the form open');
ui.change('birth-year','1499');
ui.el('person-name').value='Rowan True';
ui.submit('character-form');
ui.flushBack();ui.tick();
assert.equal(root.dataset.theme,'medieval');
assert.equal(ui.el('calendar-year').textContent,'1499');
assert.equal(ui.el('who-name').textContent,'Rowan True');
assert.equal(ui.el('landscape').getAttribute('src'),'art/era-medieval.png');
assert(!/instant camera|smartphone|bus driver|headphones/i.test(ui.el('feed-scroll').textContent));
ui.click('sheet','menu');ui.click('sheet','appearance');ui.click('pick-theme','terminal');
assert.equal(root.dataset.theme,'terminal');
assert.equal(ui.state().settings.theme,'terminal');
assert.equal(ui.el('calendar-year').textContent,'1499');
const restored=start(new Map(storage));assert.equal(restored.doc.documentElement.dataset.theme,'terminal');
ui.click('pick-theme','auto');ui.click('close');ui.flushBack();ui.tick();
ui.click('central');
assert.equal(ui.el('calendar-year').textContent,'1500');
assert.equal(root.dataset.theme,'renaissance');
assert(storage.has(key));
const E=require(path.join(base,'engine.js')).PocketEngine;
const fixture=JSON.parse(require('node:fs').readFileSync(path.join(__dirname,'fixtures/upgrade-0.8.1.json'),'utf8'));
const old=E.decodeGame(fixture);
old.active.age=2049-old.active.born;
assert(!old.active.sim.timeline);
const imported=start(new Map([[key,JSON.stringify(E.encodeGame(old))]]));
assert.equal(imported.doc.documentElement.dataset.theme,'modern');
imported.click('central');
assert.equal(imported.el('calendar-year').textContent,'2050');
assert.equal(imported.doc.documentElement.dataset.theme,'future');
assert(E.decodeGame(imported.state()).active.sim.timeline.historicalRules);
for(const [birthYear,theme] of expected){
  const one=start();
  one.click('edit-form');one.change('birth-era',U.eraForYear(birthYear).id);
  one.change('birth-year',String(birthYear));one.submit('character-form');one.flushBack();
  assert.equal(one.doc.documentElement.dataset.theme,theme);
  assert.equal(one.el('calendar-year').textContent,String(birthYear));
}
console.log('PASS all eleven calendar styles, six start periods, exact-year and settlement selection, saved visual overrides and birthday transition.');
for(const year of [1300,1850]){
  const period=E.makeLife({seed:48,birthYear:year-22});
  period.age=22;period.cash=12000;period.sim.expansion.ambition='Master a hobby';
  period.sim.expansion.hobbies.music=79;
  const store=new Map([[key,JSON.stringify(E.encodeGame({active:period,archive:[],settings:{motion:'reduced'}}))]]);
  const session=start(store,{hash:'#activities'});
  assert.equal(session.el('bank-caption').textContent,'Cash on hand');
  session.click('sheet','xp-hobbies');
  assert(!/boardroom|Luxury lifestyle/i.test(session.visible().textContent));
  session.click('xp-run','music');session.flushBack();session.tick();
  const practiced=E.decodeGame(session.state()).active;
  assert(practiced.sim.expansion.hobbies.music>=80);
  assert(E.advance(practiced));
  assert(practiced.sim.expansion.awards.includes('Master a hobby'));
}
console.log('PASS historical hobby actions and anniversary achievement awards in 1300 and 1850.');
