'use strict';
const assert=require('node:assert/strict');
const {E,game,life,storageKey}=require('./minigame_test_helpers.cjs');
const {start}=require('./interface_host.cjs');

const inmate=life();
inmate.sim.prison=3;
const storage=l=>new Map([[storageKey,JSON.stringify(E.encodeGame(game(l)))]]);
const internal=ui=>E.decodeGame(ui.state()).active;
const captions=ui=>ui.visible().textContent;

let ui=start(storage(inmate),{hash:'#people'});
assert.match(captions(ui),/Visiting hours/);
assert(!ui.button('visit-all')&&!ui.button('sheet','date')&&!ui.button('sim','friend'));
ui.click('sheet','person-carer');
assert.match(ui.button('social','carer~visit').textContent,/supervised visit/);
assert(!ui.button('social','carer~gift')&&!ui.button('social','carer~askout'));
ui.click('social','carer~visit');
assert.match(internal(ui).log.at(-1).body,/visiting room/);
ui.click('sheet','xp-family');
assert(!ui.button('xp-run','holiday')&&!ui.button('xp-run','reunion'));
assert(!captions(ui).includes('Family decisions'));

const stale={id:'coffee',resolved:false}, prison={id:'prison-friend',resolved:false};
inmate.event=stale;
assert.equal(E.blocking(inmate),null);
assert.equal(E.decide(inmate,0),false);
ui=start(storage(inmate),{hash:'#life/decision'});
assert(!ui.button('choose'));
inmate.sim.review={title:'Prior decision',text:'Finished.',delta:{},from:'coffee'};
inmate.eventQueue=[{id:'first-curtain',resolved:false},prison];
assert(E.acknowledge(inmate));
assert.equal(inmate.event.id,prison.id);
ui=start(storage(inmate),{hash:'#life'});
assert.match(ui.button('choose','0').textContent,/Offer a seat at your table/);
ui.click('choose','0');
assert.match(captions(ui),/prison dining hall/);
console.log('PASS custody relationships, supervised visits, release, home gathering guards, and queued/outdated story decisions.');
