'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const assets = process.env.POCKET_ASSET_DIR || path.resolve(__dirname, '../app/src/main/assets');
const E = require(path.join(assets, 'engine.js')).PocketEngine;
const Saves = require(path.join(assets, 'save.js')).PocketSaves;

function decide(life) {
  while (E.blocking(life)) {
    if (life.sim.review) assert(E.acknowledge(life));
    else if (life.sim.court) assert(E.sim.court(life, 'plea'));
    else assert(E.decide(life, 0));
  }
}
function game(life) { return {version: 4, active: life, archive: [], settings: {motion: 'system'}}; }
const mem = new Map();
const storage = { getItem: k => mem.get(k) ?? null, setItem: (k,v) => mem.set(k,v) };
const slots = Saves.open(storage,E,'centuries');
const old = JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','upgrade-0.8.1.json'),'utf8'));
const upgraded = slots.importFile(JSON.stringify(old));
assert(upgraded, 'v0.8.1 import failed');
assert.equal(upgraded.active.born, old.active.run.born);
assert.equal(upgraded.active.cash, old.active.bankBalance);
assert.equal(upgraded.active.age, old.active.age);
assert.deepEqual(upgraded.active.log, old.active.run.log);
assert.equal(upgraded.active.id, old.active.id);
assert.equal(upgraded.settings.motion, old.settings.motion);
decide(upgraded.active);
assert(E.advance(upgraded.active));
assert(slots.inspectFile(slots.exportFile(upgraded)));
console.log('PASS public v0.8.1 save imports, preserves its calendar, cash, journal and settings, and resumes.');

const dynasty = game(E.makeLife({seed: 26084, birthYear: 1200, town: 'london', name: 'Rowan Vale'}));
// A funded household isolates estate transfer, rather than testing wages a second time.
dynasty.active.cash = 25000000;
let year = 1200;
let generations = 1;
let largest = 0;
const epochs = new Set();
while (year < 2100) {
  let life = dynasty.active;
  decide(life);
  if (life.ended) {
    const heirs = E.sim.children(life).sort((a,b) => Math.abs(E.sim.ageOf(life,a[1])-35) - Math.abs(E.sim.ageOf(life,b[1])-35));
    assert(heirs.length,'No living child at year '+year+', age '+life.age+', cash '+life.cash+', cause '+life.sim.cause+', children '+life.world.childCount);
    const child = E.continueAs(life,heirs[0][0]);
    assert(child);
    assert.equal(E.calendar(child),year,'Succession rewound the calendar');
    assert.equal(E.continueAs(life,heirs[0][0]),null,'Second claim on the same estate');
    assert(E.startNext(dynasty,child));
    generations++;
    continue;
  }
  if (life.age>=18 && !life.job) {
    const job=E.historyEconomy.actions(life,'work').find(a=>a.id.startsWith('job-')&&!a.reason);
    if (job) E.historyPerform(life,'work',job.id);
    else if (!E.isHistorical(life)) {
      const choice=Object.keys(E.world.openings).find(id=>!E.world.jobReason(life,id));
      if(choice) E.world.interview(life,choice,'honest');
    }
  }
  if (life.age >= 23 && (!E.sim.children(life).length || life.age === 44 || life.age === 61)) {
    E.world.adopt(life,'Vale '+generations+'-'+life.age);
  }
  epochs.add(E.historyWorld.era(year));
  assert(E.advance(life),'Blocked birthday in '+year);
  assert.equal(E.calendar(life),++year);
  if (year % 25 === 0) {
    const raw = slots.exportFile(dynasty);
    const loaded = slots.inspectFile(raw);
    assert(loaded,'Round trip failed in '+year);
    assert.equal(loaded.active.id,life.id);
    assert.equal(loaded.active.cash,life.cash);
    assert.equal(loaded.active.rng,life.rng);
    assert.deepEqual(loaded.active.event,life.event);
    assert.equal(loaded.archive.length,dynasty.archive.length);
    assert.equal(E.calendar(loaded.active),year);
    largest = Math.max(largest,Buffer.byteLength(raw));
    Object.assign(dynasty,loaded);
  }
}
assert.equal(epochs.size,6);
assert(generations>=10 && dynasty.archive.length===generations-1);
assert(largest<4*1024*1024,'A single 900-year dynasty must fit comfortably in an offline export');
console.log('PASS 900 consecutive birthdays across all six eras, '+generations+' generations, 36 save imports; largest export '+largest+' bytes.');
