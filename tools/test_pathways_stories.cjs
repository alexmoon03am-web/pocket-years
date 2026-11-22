'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const assets = process.env.POCKET_ASSET_DIR || path.resolve(__dirname, '../app/src/main/assets');
const E = require(path.join(assets, 'engine.js')).PocketEngine;
const Saves = require(path.join(assets, 'save.js')).PocketSaves;
const P = E.pathways;
const game = active => ({version: 4, active, archive: [], settings: {motion: 'system'}});
const restore = l => E.decodeGame(structuredClone(E.encodeGame(game(l)))).active;
const story = suffix => E.stories['path-' + suffix];
const runtime = new Map();
const disk = Saves.open({getItem: k => runtime.get(k) ?? null, setItem: (k, v) => runtime.set(k, v),
  removeItem: k => runtime.delete(k)}, E, 'pathway-test');
function clear(l) {
  while (E.blocking(l)) {
    if (l.sim.review) assert(E.acknowledge(l));
    else if (l.sim.court) assert(E.sim.court(l, 'plea'));
    else assert(E.decide(l, 0));
  }
}
function character(birth, age) {
  const l = E.makeLife({seed: 1001, birthYear: birth, town: 'cedar'});
  l.age = age;
  E.year.campus(l);
  return l;
}
function decide(l, event, index, person = null) {
  l.event = {id: event.id, resolved: false, person};
  assert(E.decide(l, index));
  assert.equal(E.decide(l, index), false);
  return l.sim.review;
}

const school = character(1484, 13);
assert(E.events.eligible(school, story('bench')));
assert(!E.events.eligible(school, story('caption')));
school.sim.dropped = true;
assert(!E.events.eligible(school, story('bench')));
school.sim.dropped = false;
school.sim.expansion.personality = 'Methodical';
assert(E.events.eligible(school, story('rehearsal')));
school.sim.expansion.personality = 'Outgoing';
assert(!E.events.eligible(school, story('rehearsal')));
const review = decide(school, story('bench'), 0);
assert.equal(review.from, story('bench').id);
const due = school.world.events.find(e => e.id === 'path-bench-mark');
assert.equal(due.at, 18);
assert(E.acknowledge(school));
decide(school, story('bench'), 0);
assert.equal(school.world.events.filter(e => e.id === due.id).length, 1);
assert(E.acknowledge(school));

const restoredSchool = restore(school);
school.sim.dropped = restoredSchool.sim.dropped = true;
for (let i = 0; i < 5; i++) {
  clear(school); clear(restoredSchool);
  assert(E.advance(school)); assert(E.advance(restoredSchool));
  assert.deepEqual(school, restoredSchool);
  if (school.age < due.at) assert(![school.event, ...school.eventQueue].some(e => e.id === due.id));
}
assert.equal(E.calendar(school), 1502);
assert.equal(school.event.id, due.id);
const savedDecision = disk.inspectFile(disk.exportFile(game(school)));
assert(savedDecision);
assert(E.decide(savedDecision.active, 2));
assert(savedDecision.active.keepsakes.some(k => k.title === 'Rubbing of a workshop bench'));
assert(!savedDecision.active.world.events.some(e => e.id === due.id));

const learner = character(2000, 15);
learner.world.grade = 64;
learner.hidden.discipline = 80;
const exercise = story('partial-credit');
assert(E.events.eligible(learner, exercise));
assert(E.events.choose(learner, exercise.choices[0], () => 0).change.grade === 8);
assert(E.events.choose(learner, exercise.choices[0], () => .99).change.grade === 2);
learner.world.grade = 65;
assert(!E.events.eligible(learner, exercise));
assert(!E.events.eligible(learner, story('relay')));
delete learner.sim.timeline;
assert(!E.events.fitsYear(learner, story('relay')), 'legacy calendar admits modern scenarios only at their actual date');
learner.sim.expansion.start = 'A tight household budget';
assert(E.events.eligible(learner, story('bursary')));
learner.sim.expansion.start = 'A comfortable household';
assert(!E.events.eligible(learner, story('bursary')));
learner.sim.faith.involvement = 49;
assert(!E.events.eligible(learner, story('assembly')));
learner.sim.faith.involvement = 50;
assert(E.events.eligible(learner, story('assembly')));
learner.sim.residences = [];
assert(!E.events.eligible(learner, story('translation')));
const formerTown = E.sim.geography.countries.JP.cities[0].id;
learner.sim.residences = [{from: formerTown, to: learner.town, age: 12}];
assert(E.events.eligible(learner, story('translation')));

for (const event of P.list) {
  assert.equal(E.stories[event.id], event);
  for (const opt of event.choices) {
    const f = opt.change?.followup;
    if (f) {
      assert(f.years >= 2);
      assert(!E.stories[f.id].random);
      assert(E.stories[f.id].maxYear === undefined);
    }
  }
}

const career = character(2000, 22);
E.world.changeJob(career, 'clerk', true);
career.world.since = 19;
career.world.tradeQualified = true;
career.world.performance = 95;
const challengeBefore = structuredClone(career);
assert.equal(P.challenges(career).length, 4);
assert.deepEqual(career, challengeBefore, 'browsing challenges is pure');
assert.equal(E.pathwayChallenge(career, 'missing'), null);
assert(E.pathwayChallenge(career, 'practice'));
assert.equal(E.pathwayChallenge(career, 'practice'), null);
assert.equal(E.pathwayChallenge(career, 'crew'), null);
assert.equal(P.challenges(career).find(g => g.id === 'practice').steps.filter(s => s.done).length, 0);
const malformed = E.encodeGame(game(restore(career)));
malformed.active.run.simulation.pathwayChallenges.step = 77;
assert.equal(disk.inspectFile(JSON.stringify(malformed)), null);
const saved = disk.inspectFile(disk.exportFile(game(career)));
assert(saved);
for (const l of [career, saved.active]) {
  for (let n = 1; n <= 3; n++) {
    clear(l);
    assert(E.advance(l));
    if (n < 3) assert.equal(l.sim.pathwayChallenges.step, n);
  }
  const award = P.challenges(l).find(g => g.id === 'practice');
  assert.equal(award.status, 'complete');
  assert(award.steps.every(s => s.done));
  assert.equal(l.sim.expansion.awards.filter(s => s === award.title).length, 1);
  assert.equal(l.keepsakes.filter(s => s.title === award.title).length, 1);
  assert.equal(l.log.filter(entry => entry.kind === 'Achievement' && entry.title === award.title).length, 1);
  assert(E.historyDynasty.archive(l, E.world, E.jobs).achievements.includes(award.title));
  clear(l);
  assert.equal(E.pathwayChallenge(l, 'practice'), null);
}
assert.deepEqual(career, saved.active);

for (const id of ['fresh-start', 'crew', 'service']) {
  const adult = character(2000, 27);
  E.world.changeJob(adult, 'clerk', true);
  adult.cash = 22000;
  adult.world.performance = 95;
  adult.sim.workYears = 5;
  adult.hidden.karma = 80;
  adult.sim.faith.involvement = 63;
  for (const p of Object.values(adult.people)) if (p.active) p.bond = 88;
  if (id === 'fresh-start') E.sim.addLoan(adult, 'tuition', 3000, 3);
  assert(E.pathwayChallenge(adult, id));
  for (let year = 1; year <= 3; year++) {
    clear(adult);
    assert(E.advance(adult));
    if (year < 3) assert.equal(adult.sim.pathwayChallenges.step, year);
    if (id === 'fresh-start') assert.equal(E.sim.debt(adult), (3 - year) * 1000);
  }
  assert.equal(P.challenges(adult).find(g => g.id === id).status, 'complete');
}

const focus = character(2026, 12);
assert(E.pathwayChallenge(focus, 'crew'));
assert(E.pathwayChallenge(focus, 'withdraw'));
assert.equal(E.pathwayChallenge(focus, 'withdraw'), null);
assert.equal(E.pathwayChallenge(focus, 'fresh-start'), null);
assert(E.advance(focus)); clear(focus);
assert(E.pathwayChallenge(focus, 'fresh-start'));
assert(E.advance(focus));
assert.equal(focus.sim.pathwayChallenges.step, 0, 'the challenge does not grant credit for nonexistent debt');
const future = character(2500, 25);
E.world.changeJob(future, 'clerk', true);
assert(E.events.eligible(future, story('relay')));
assert(!E.events.eligible(future, story('caption')));

console.log('PASS ' + P.list.length + ' Pathways stories, ' + P.list.reduce((n, e) => n + e.choices.length, 0) +
  ' choices and '+ P.list.filter(e => !e.random).length +' dated follow-ups. Explicit calendar gates, personality, ties, household, performance, community, study and replay.');
console.log('PASS ordered birthday challenges, school-to-work qualification, withdrawal cooldown, idempotent awards, museum archive and malformed-progress rejection.');
