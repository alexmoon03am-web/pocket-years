'use strict';
const assert=require('node:assert/strict');
const {E,game,life,storageKey,takeExam}=require('./minigame_test_helpers.cjs');
const {start}=require('./interface_host.cjs');
const safe=l=>JSON.stringify(E.encodeGame(game(l)));
const state=u=>E.decodeGame(u.state()).active;
const board=u=>E.minigames.current(state(u)).board;
const txt=u=>u.visible().textContent;
function boot(l,hash,settings={motion:'reduced'},extra={}){
  const store=new Map([[storageKey,JSON.stringify(E.encodeGame(game(l,settings)))]]);
  return start(store,{hash,asyncBack:true,...extra});
}
function exam(l,extra={}){
  return boot(l,'#activities/hub-travel',null,extra);
}
const adult=life({town:'cedar'});let ui=exam(adult);
ui.click('sheet','license');assert.match(txt(ui),/Test fee\$30/);
const begin=ui.button('mini-start','driving~0');
ui.click('mini-start','driving~0');ui.dispatch(begin,2,111);
assert.equal(state(ui).cash,3970);
assert.equal(E.blocking(state(ui)),'minigame');assert.match(txt(ui),/Course question 1/);
const before=ui.button('mini-input','a0');
ui.click('mini-input','a0');ui.dispatch(before,2,120);
assert.equal(board(ui).question,1);
ui.history.back();ui.flushBack();ui.tick(50);
assert.match(txt(ui),/Paused/);assert.equal(board(ui).question,1);
assert.equal(ui.loc.hash,'#life/minigame');
ui.click('mini-input','resume');
ui.setHidden(true);assert.match(txt(ui),/Paused/);assert.equal(board(ui).question,1);
const tab=start(ui.store,{hash:'#life',asyncBack:true});
assert.match(txt(tab),/Paused/);assert.equal(board(tab).question,1);tab.setHidden(false);
tab.click('mini-input','restart');assert.equal(board(tab).question,0);
tab.key('Escape');assert.match(txt(tab),/Paused/);assert(!tab.button('mini-input','restart'));
tab.click('mini-input','resume');takeExam(tab);assert.match(txt(tab),/Earned a driver’s license/);
assert(state(tab).sim.license);
tab.click('ack','minigame');tab.flushBack();assert.equal(E.blocking(state(tab)),null);
assert.equal(state(tab).cash,3970);

const inmate=life({town:'cedar'});inmate.sim.prison=4;
ui=boot(inmate,'#activities');
ui.click('sheet','hub-custody');ui.click('sheet','mini-intro~escape');assert.match(txt(ui),/striped gates/i);
ui.click('mini-start','escape~0');
assert(ui.visible().querySelector('.mini-grid'));const b=board(ui),step=b.actions.find(a=>['up','left','right','down'].includes(a));
const cell=ui.visible().querySelectorAll('button[data-do="mini-input"]').find(k=>k.dataset.key===step&&k.classList.contains('mini-cell'));
assert(cell,'Touch tile is available');
ui.visible().querySelector('[data-mini-map]').setAttribute('open','');
ui.dispatch(cell,1,200);assert.notEqual(board(ui).player,b.player);
assert.equal(ui.visible().querySelector('[data-mini-map]').getAttribute('open'),'');
ui.dispatch(cell,1,210);assert.equal(board(ui).used,1);
const next=board(ui).actions.find(a=>['up','left','right','down'].includes(a));
ui.key('Arrow'+next[0].toUpperCase()+next.slice(1));assert.equal(board(ui).used,2);
ui.click('mini-input','pause');ui.click('mini-input','ask-exit');assert.match(txt(ui),/extends the sentence/);
ui.click('mini-input','keep');assert.match(txt(ui),/Paused/);
ui.click('mini-input','ask-exit');const stale=ui.button('mini-input','exit');
ui.click('mini-input','exit');ui.dispatch(stale,2,250);
assert.equal(state(ui).sim.prison,5);assert.match(txt(ui),/Escape attempt failed/);
ui.click('ack','minigame');ui.flushBack();
assert.equal(state(ui).sim.prison,5);

const teacher=life({job:'teacher'});ui=boot(teacher,'#career');
ui.click('sheet','mini-intro~career');ui.click('mini-start','career~0');
const plan=board(ui).solution;
for(const n of plan)ui.click('mini-input','pick'+n);
ui.click('mini-input','undo');assert(ui.button('mini-input','submit').disabled);
ui.click('mini-input','pick'+plan.at(-1));ui.click('mini-input','submit');assert.match(txt(ui),/Every rule satisfied/);
assert(state(ui).world.performance>teacher.world.performance);

ui=boot(life({town:'cedar'}),'#life/menu');
ui.click('sheet','mini-settings');
ui.click('mini-pref','controls~buttons');ui.click('mini-pref','assistance~off');ui.click('mini-pref','difficulty~challenging');
ui.click('mini-pref','enabled~off');assert.equal(ui.state().settings.minigames.enabled,false);
ui.click('close');ui.flushBack();ui.click('tab','activities');ui.click('sheet','hub-crime');
ui.click('sheet','mini-intro~burglary');assert.match(txt(ui),/Resolve skills check/);assert(!txt(ui).includes('How to play'));
ui.click('mini-start','burglary~0');assert(E.blocking(state(ui))==='outcome');assert(!ui.visible().querySelector('.mini-grid'));
assert.equal(state(ui).sim.minigames.records.burglary.turns,1);

const musician=life({age:19});ui=boot(musician,'#activities',{motion:'system',minigames:{timing:'timed'}});
ui.click('sheet','mini-menu');ui.click('sheet','mini-intro~music');ui.click('mini-start','music~0');assert(ui.visible().querySelector('.mini-track'));
const cycle=board(ui).cycle;
ui.tick(cycle+30);assert.equal(board(ui).index,1);assert.equal(board(ui).hits,0);
ui.setHidden(true);const progress=state(ui).sim.minigames.active.inputs;ui.tick(cycle*3);
assert.deepEqual(state(ui).sim.minigames.active.inputs,progress);
ui.setHidden(false);ui.click('mini-input','resume');
while(E.minigames.active(state(ui))){
  const next=board(ui);ui.tick(next.offset);
  ui.click('mini-input','hit'+next.pattern[next.index]);
}
assert.match(txt(ui),/Drill complete/);
assert(state(ui).sim.expansion.hobbies.music>0);
const timed=life({age:19});E.minigames.start(timed,'sport',{timing:'timed'},0);
const fallback=boot(timed,'#life',{motion:'reduced'});
fallback.click('mini-input','resume');
fallback.tick(board(fallback).offset);
assert.equal(fallback.el('mini-beat-status').textContent,'Tap now');

ui=boot(life({age:19}),'#activities',{motion:'reduced',minigames:{timing:'timed'}});
ui.click('sheet','mini-menu');ui.click('sheet','mini-intro~sport');ui.click('mini-start','sport~0');
assert(!ui.visible().querySelector('.mini-track'));assert.match(txt(ui),/New cue group/);
const round=board(ui);ui.tick(6000);assert.equal(board(ui).index,0);
ui.click('mini-input','hit'+round.pattern[0]);assert.equal(board(ui).hits,1);
ui.click('mini-input','pause');assert.match(txt(ui),/Cue reminder/);

const pilgrim=life({age:19,born:1290});ui=boot(pilgrim,'#activities');
ui.click('sheet','mini-menu');assert(ui.button('sheet','mini-intro~historical'));assert(!ui.button('sheet','license'));
ui.click('sheet','mini-intro~historical');assert.match(txt(ui),/Market commission/);
assert.equal(JSON.parse(safe(pilgrim)).active.bankBalance,4000);
console.log('PASS rendered touch tile and buttons, keyboard directions, settings, gated menus, result/court routing, stale taps, Android-style Back, visibility pause, WebView recreation, timed/untimed play and test parking.');
