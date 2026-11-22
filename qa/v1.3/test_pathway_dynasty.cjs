'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const assets = path.resolve(process.env.POCKET_ASSET_DIR || path.join(__dirname, '../../app/src/main/assets'));
const E = require(path.join(assets, 'engine.js')).PocketEngine;
const disk = require(path.join(assets, 'save.js')).PocketSaves.open({getItem: () => null, setItem() {}}, E, 'lineage');
function resolve(l) {
  while (E.blocking(l)) {
    if (l.sim.review) assert(E.acknowledge(l));
    else if (l.sim.court) assert(E.sim.court(l,'plea'));
    else {
      const event=E.stories[l.event.id];
      const gap=event.choices.findIndex(choice=>choice.change?.gap||choice.change?.jobSearch);
      assert(E.decide(l,gap>=0?gap:0));
    }
  }
}
let transfers=0, qualified=0, hires=0, archiveReloads=0;
const generations=4;
for (const seed of [7,101,223,337,541,751]) {
  let game={active:E.makeLife({birthYear:1991,town:'london',seed}),archive:[],settings:{motion:'reduced'}};
  const parents=new Set();
  while (game.archive.length<generations) {
    const l=game.active;
    if (l.ended) {
      const children=E.sim.children(l).sort((a,b)=>Math.abs(E.sim.ageOf(l,a[1])-26)-Math.abs(E.sim.ageOf(l,b[1])-26));
      if (!children.length) break;
      const [id,person]=children[0];
      const year=E.calendar(l), oldId=l.id;
      const transcript=E.education.records(l).map(({title,year,honors})=>({title,year,honors}));
      const journal=l.log.filter(entry=>entry.kind==='School' && entry.title.startsWith('Qualified in '));
      if (journal.length) qualified++;
      const child=E.continueAs(l,id);
      assert(child && child.id===person.id && !parents.has(child.id));
      assert.equal(E.calendar(child),year);
      assert.equal(E.continueAs(l,id),null,'Two estate claims');
      assert(E.startNext(game,child));
      parents.add(oldId);transfers++;
      assert(!E.education.hasProgram(child,'workshop-craft'),'Personal training passed as property');
      const raw=disk.exportFile(game);
      const loaded=disk.inspectFile(raw);
      assert(loaded,'Successor save unreadable in '+year);
      assert.equal(loaded.active.id,person.id);
      assert.deepEqual(loaded.archive.map(a=>a.id),game.archive.map(a=>a.id));
      assert.deepEqual(loaded.archive[0].studies||[],transcript);
      for (const entry of journal) assert(loaded.archive[0].log.some(e=>e.age===entry.age && e.title===entry.title));
      assert.equal(loaded.active.cash,child.cash);
      assert.equal(E.world.netWorth(loaded.active),E.world.netWorth(child));
      archiveReloads++;game=loaded;continue;
    }
    resolve(l);
    if (l.age>=5 && l.age<18) E.world.career(l,'study');
    if (l.age>=18 && l.age<=65 && !l.sim.program && !E.education.hasProgram(l,'workshop-craft')) {
      if (!E.education.quote(l,'workshop-craft','loan').reason) E.educationApply(l,'workshop-craft','loan');
    }
    if (l.sim.program?.pathway) E.educationAction(l,'tutorial');
    if (l.age>=18 && l.age<65 && !l.sim.program) {
      if (l.job!=='occ-cabinetmaker' && !E.world.jobReason(l,'occ-cabinetmaker')) {
        E.world.interview(l,'occ-cabinetmaker','example');if(l.job==='occ-cabinetmaker')hires++;
      } else if (!l.job && !E.world.jobReason(l,'occ-room-attendant')) E.world.interview(l,'occ-room-attendant','example');
    }
    if (l.age>=23 && l.age<=58 && (!E.sim.children(l).length || l.age%10===0)) E.world.adopt(l,'Sid '+l.age);
    assert(E.advance(l));
  }
}
assert(transfers>=generations && qualified>=3 && hires>=2 && archiveReloads===transfers);
console.log(`PASS ${transfers} successions, ${qualified} archived graduates, ${hires} credentialed hires and ${archiveReloads} successor reloads across six independently seeded family lines.`);
