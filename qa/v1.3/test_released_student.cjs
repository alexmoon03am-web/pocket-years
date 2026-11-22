'use strict';

// The fixture was exported through the public v1.2.3 engine at 8baa84a.
// Born in London in 1991 (seed 1), Sam studied, delivered papers at 14,
// borrowed for science at 18 and saved during an unresolved event at 19.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {gunzipSync} = require('node:zlib');
const assets = path.resolve(process.env.POCKET_ASSET_DIR || path.join(__dirname, '../../app/src/main/assets'));
const E = require(path.join(assets, 'engine.js')).PocketEngine;
const Saves = require(path.join(assets, 'save.js')).PocketSaves;
const raw = gunzipSync(fs.readFileSync(path.join(__dirname, 'released-student-v1.2.3.json.gz'))).toString('utf8');
const prior = JSON.parse(raw).game;
const store = new Map();
const slots = Saves.open({getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value)}, E, 'qa');
const game = slots.importFile(raw);
assert(game, 'Could not import authentic v1.2.3 student save');
const current = E.encodeGame(game);
assert.deepEqual(current.settings, prior.settings);
assert.deepEqual(current.archive, prior.archive);
for (const key of ['id', 'age', 'bankBalance', 'debt', 'netWorth', 'stats', 'hiddenStats', 'npcs']) {
  assert.deepEqual(current.active[key], prior.active[key], key);
}
const l = game.active;
assert.deepEqual(l.log, prior.active.run.log);
assert.equal(l.rng, prior.active.run.rng);
assert.deepEqual(l.event, prior.active.run.event);
assert.equal(l.sim.program.field, 'science');
assert.equal(l.sim.program.end, 22);
assert.deepEqual(l.sim.loans, prior.active.run.simulation.loans);
assert.equal(l.sim.loans.tuition.balance, 6240);
assert.deepEqual(l.world.owned, prior.active.run.world.owned);
assert.deepEqual(l.sim.expansion.family, prior.active.run.simulation.expansion.family);
assert.equal(E.advance(l), false);
assert(E.decide(l, 0));
assert.equal(E.decide(l, 0), false);
assert(slots.save(game));
const result = slots.exportFile(game);
const clean = slots.inspectFile(result);
assert.equal(clean.active.sim.review.from, l.event.id);
const broken = JSON.parse(result);
broken.game.active.bankBalance += 50;
assert.equal(slots.importFile(JSON.stringify(broken)), null);
assert.equal(slots.load().active.sim.review.from, l.event.id);
store.set('qa', '{broken');
const recovered = slots.load();
assert.deepEqual(recovered.active.event, prior.active.run.event);
assert.equal(recovered.active.sim.review, null);
while (!l.ended && l.age < 22) {
  while (E.blocking(l)) {
    if (l.sim.review) assert(E.acknowledge(l));
    else if (l.sim.court) assert(E.sim.court(l, 'plea'));
    else assert(E.decide(l, 0));
  }
  assert(E.advance(l));
}
assert.equal(l.sim.degree, 'Science');
assert.equal(l.sim.degrees.filter(id => id === 'Science').length, 1);
assert.equal(l.sim.program, null);
assert(slots.inspectFile(slots.exportFile(game)));
console.log('PASS released v1.2.3 student loan, family and finances, pending event and study timeline survive migration; one graduation, corrupt import rejection and backup recovery.');
