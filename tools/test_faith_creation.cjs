'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {start,base}=require('./interface_host.cjs');
const E=require(path.join(base,'engine.js')).PocketEngine;
const starts=[['medieval',1250,'family'],['renaissance',1600,'sikh'],['industrial',1880,'bahai'],['century',1920,'agnostic'],['digital',2026,'exploring'],['future',2090,'orbital-commons']];
for(const [era,year,choice] of starts){
  const u=start(new Map(),{asyncBack:true});
  u.click('edit-form','');
  u.change('birth-era',era);u.change('birth-year',String(year));
  const select=u.el('birth-faith');assert(select.querySelector('option[value="'+choice+'"]'));
  if(year<1863)assert.equal(select.querySelector('option[value="bahai"]'),null);
  u.change('birth-faith',choice);u.submit('character-form');u.flushBack();u.tick();
  const l=E.decodeGame(u.state()).active;
  assert.equal(E.calendar(l),year);assert.equal(l.sim.faith.backgroundChoice,choice);
  if(choice==='exploring')assert.equal(l.sim.faith.status,'questioning');
  else if(choice!=='family')assert.equal(l.sim.faith.id,choice);
  u.click('tab','activities');u.click('sheet','faith-home');
  assert.equal(u.visible().querySelectorAll('progress').length,4);
}
const u=start(new Map(),{asyncBack:true});
u.click('edit-form','');u.change('birth-faith','bahai');u.change('birth-era','medieval');
assert.equal(u.el('birth-faith').value,'family');
const l=E.makeLife({seed:2,birthYear:2026,faithId:'bahai'}),saved=structuredClone(l);
assert.equal(E.customizeBirth(l,{name:l.name,town:'london',skin:l.skin,thread:l.thread,birthYear:1250,faithId:'bahai'}),false);
assert.deepEqual(l,saved);
assert.throws(()=>E.makeLife({birthYear:1250,faithId:'bahai'}),RangeError);
console.log('PASS faith creation controls in every starting era, family and exploring choices, birth-year changes and atomic rejection of invalid background.');
