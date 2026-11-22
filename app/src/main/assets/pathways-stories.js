/* Original Pathways stories, birthday milestones and voluntary personal challenges. */
(function (root) {
  'use strict';

  const node = typeof module !== 'undefined' && module.exports;
  const model = node ? require('./model.js').PocketModel : root.PocketModel;
  const school = l => !!model.school(l).name;
  const employed = l => !!l.job && !['student', 'retired'].includes(l.job);
  const debts = l => Object.values(l.sim.loans).some(loan => loan.balance > 0);

  function choice(icon, label, result, effects, change = {}) {
    return {icon, label, result, effects, change};
  }
  function later(id, years) {
    return {followup: {id: 'path-' + id, years}};
  }
  function chance(icon, label, favorable, adverse, stat) {
    return {icon, label, branches: [
      {...favorable, weight: 3, stat, scale: .065},
      {...adverse, weight: 5}
    ]};
  }
  function scene(id, title, body, rule, choices, minYear = 1200, maxYear) {
    return {id: 'path-' + id, title, body, rule, choices, minYear, maxYear,
      random: true, weight: 8, label: 'Crossroads'};
  }
  function echo(id, title, body, choices) {
    // A promise can outlast the player's enrollment, job, address and original era.
    return {...scene(id, title, body, {}, choices), random: false, label: 'An old choice returns'};
  }

  const list = [
    scene('knots', 'A short measure', 'Two pupils measure the same table with the same string. They submit three answers.',
      {minAge: 6, maxAge: 13, pathGate: 'school'}, [
        choice('pencil', 'Mark the string', 'I marked the lengths. The table stopped changing size.', {smarts: 3}, {grade: 3}),
        choice('people', 'Compare how we measured', 'One pupil counted the knots. One counted the spaces.', {bonds: 4, smarts: 2}),
        choice('clock', 'Measure the string instead', 'The string was one string long. I wrote that down.', {joy: 3}, {grade: -2})
      ]),
    scene('rough-copy', 'The rough copy', 'A schoolmate has the answer, the wrong working and a request to see your page.',
      {minAge: 9, maxAge: 17, contact: 'classmate', pathGate: 'school'}, [
        choice('book', 'Work through it together', 'We found the error. It had a smaller error living inside it.',
          {discipline: 3}, {person: '$contact', bondAmount: 6, ...later('return-lesson', 4)}),
        choice('pencil', 'Hand over the page', 'Two people handed in my misspelling.', {joy: -2}, {grade: -3, person: '$contact', bondAmount: 2}),
        choice('chat', 'Point out the faulty line', 'One line came out. The answer finally fit.', {smarts: 3}, {grade: 2})
      ]),
    echo('return-lesson', 'A lesson returned', 'A former study partner remembers the afternoon you spent untangling their sums. They brought a puzzle this time.', [
      choice('book', 'Solve it together', 'This time I was the one who counted wrong.', {smarts: 5, bonds: 3}),
      choice('heart', 'Ask how they have been', 'We never opened the puzzle. We needed the whole afternoon.', {joy: 4, bonds: 4}),
      choice('pencil', 'Write a solution', 'I kept both drafts. The first one is funnier.', {discipline: 4}, {keepsake: 'A much-corrected puzzle'})
    ]),
    scene('bench', 'The borrowed bench', 'At the workshop, an uneven bench makes every piece look crooked. The pieces are getting blamed.',
      {minAge: 12, maxAge: 21, pathGate: 'school'}, [
        choice('tools', 'Fit a wedge', 'The bench stopped rocking. The wedge immediately went missing.',
          {smarts: 3}, {grade: 3, ...later('bench-mark', 5)}),
        choice('people', 'Work in pairs', 'One person held the bench. One got the credit.', {bonds: 4, karma: 2}),
        choice('pencil', 'Mark the straight pieces', 'I made a small pile and a rather larger pile.', {discipline: 4}, {grade: 2})
      ], 1200, 1899),
    echo('bench-mark', 'Three little notches', 'An old workshop bench has turned up. Your three measuring marks are still underneath.', [
      choice('tools', 'Make a fresh straightedge', 'It came out straight. I checked against something else this time.', {smarts: 4, joy: 2}),
      choice('people', 'Show someone how to use it', 'My pupil found a fourth notch. It was my thumbprint.', {karma: 4, bonds: 3}),
      choice('pencil', 'Keep a rubbing', 'The bench stayed put. I took the useful part home.', {discipline: 3}, {keepsake: 'Rubbing of a workshop bench'})
    ]),
    scene('partial-credit', 'Room for a correction', 'Your teacher will accept one corrected assignment. Half your folder has volunteered.',
      {minAge: 10, contact: 'teacher', pathGate: 'low-grade'}, [
        chance('pencil', 'Redo the hardest one',
          {text: 'I showed every step. One entire page was crossing out.', effects: {smarts: 4}, change: {grade: 8}},
          {text: 'I improved the first half. The second half remains under investigation.', effects: {discipline: 3}, change: {grade: 2}}, 'discipline'),
        choice('chat', 'Ask for a shorter exercise', 'I got four smaller questions and finished three.', {smarts: 2}, {grade: 4, person: '$contact', bondAmount: 3}),
        choice('exit', 'Hand it in as it is', 'The teacher recognized my work from the first time.', {joy: 2}, {grade: -2})
      ], 1850),
    scene('bursary', 'The spare place', 'A local study group has a place for a student whose household is short of money.',
      {minAge: 12, pathGate: 'study-hardship'}, [
        choice('letter', 'Explain your circumstances', 'They covered the books. I still had to read them.', {smarts: 4, joy: 2}, {grade: 3}),
        choice('people', 'Trade help for lessons', 'I put the chairs away. The tutor saved me one.', {discipline: 3, bonds: 2}, later('study-circle', 3)),
        choice('exit', 'Keep studying at home', 'I kept my evening free. I used most of it studying.', {willpower: 4, joy: -1})
      ]),
    echo('study-circle', 'The chair by the door', 'The people who once saved a place for you have a new learner waiting outside.', [
      choice('people', 'Offer to teach a lesson', 'I knew how to start. Someone else knew how to finish.', {karma: 4, smarts: 3}),
      choice('book', 'Pass along your notes', 'I crossed out the answer I was no longer sure about.', {discipline: 3}, {reputation: 4}),
      choice('heart', 'Introduce the learner', 'I made the introduction and let them speak for themselves.', {bonds: 4, joy: 2})
    ]),
    scene('field-notes', 'Two sets of field notes', 'Your study group disagrees about one observation. Everyone has signed the page except you.',
      {lifeStage: ['college']}, [
        choice('pencil', 'Record the disagreement', 'The margin got the most careful writing in the whole report.', {discipline: 3}, {grade: 3, ...later('margin', 6)}),
        chance('flask', 'Repeat the observation',
          {text: 'We saw it again. Several people suddenly remembered seeing it the first time.', effects: {smarts: 4}, change: {grade: 7}},
          {text: 'Nothing happened on the second visit. We recorded that too.', effects: {discipline: 3}, change: {grade: 1}}, 'smarts'),
        choice('people', 'Let the majority sign', 'The report was unanimous after my name came off it.', {joy: 2}, {grade: -2})
      ]),
    echo('margin', 'In the margin', 'Somebody tracing an old report found the disagreement you wrote down. They want to know what happened next.', [
      choice('book', 'Send both accounts', 'The two versions finally appeared on the same page.', {smarts: 4}, {reputation: 4}),
      choice('chat', 'Describe the uncertainty', 'My reply began and ended with “possibly.” It was accurate.', {discipline: 4, karma: 2}),
      choice('letter', 'Point them to the original group', 'It took longer to find the addresses than to write my answer.', {bonds: 4, joy: 2})
    ]),
    scene('translation', 'Words for the same tool', 'In this town, people use a different name for a tool you learned about at home. Your instructor thinks you brought the wrong one.',
      {minAge: 8, migrant: true, pathGate: 'school'}, [
        choice('tools', 'Show how it works', 'Three turns later, we had two names for a useful tool.', {smarts: 3}, {grade: 3}),
        choice('pencil', 'Start a word list', 'I wrote down both names. The next tool had four.', {discipline: 4}, {keepsake: 'A list in two vocabularies'}),
        choice('chat', 'Learn the local name', 'I got it right by lunchtime. My accent held out until dinner.', {bonds: 4, willpower: 2})
      ]),
    scene('assembly', 'A room for everyone', 'Your community and a group of learners both need the meeting room the same evening.',
      {minAge: 12, pathGate: 'community'}, [
        choice('clock', 'Split the evening', 'Both groups started on time. This surprised both groups.', {karma: 4, discipline: 2}),
        choice('people', 'Host a joint lesson', 'A newcomer stayed behind to stack chairs and ask questions.', {bonds: 4}, later('guest-teacher', 3)),
        choice('home', 'Find a second room', 'It had a low ceiling and excellent attendance.', {joy: 2}, {reputation: 3})
      ]),
    echo('guest-teacher', 'The guest teacher', 'A visitor from an old community lesson now runs a gathering. They offer you the opening remarks.', [
      choice('chat', 'Take questions first', 'I used up my whole speech answering the first one.', {bonds: 4, smarts: 2}),
      choice('book', 'Read from your old notes', 'My notes improved considerably in the telling.', {joy: 4}, {reputation: 3}),
      choice('people', 'Give the visitor the floor', 'They knew the room. I knew where to put the chairs.', {karma: 4, discipline: 2})
    ]),
    scene('handover', 'The handover', 'A new worker needs directions for the part everyone says is obvious. Nobody can agree which part that is.',
      {minAge: 18, contact: 'coworker', pathGate: 'employed'}, [
        choice('pencil', 'Write the steps down', 'I got to step seven before anything became obvious.', {discipline: 4}, {performance: 3, ...later('handover-copy', 3)}),
        choice('people', 'Work alongside them', 'By lunch, they could do it and I could explain it.', {bonds: 3}, {person: '$contact', bondAmount: 6, performance: 2}),
        choice('clock', 'Send them to the supervisor', 'The supervisor sent them back with a chair.', {joy: -2}, {performance: -3})
      ]),
    echo('handover-copy', 'A familiar set of instructions', 'Someone has copied the instructions you once wrote for a new worker. Your spelling mistake has survived three revisions.', [
      choice('pencil', 'Correct the new copy', 'I fixed the spelling. Someone had already fixed step seven.', {discipline: 4}, {reputation: 3}),
      choice('people', 'Credit the later editors', 'The newest edition has more names than steps.', {karma: 4, bonds: 2}),
      choice('archive', 'Save the first edition', 'I kept the mistake. It proves authorship.', {joy: 3}, {keepsake: 'First edition of a handover note'})
    ]),
    scene('rota', 'The quiet bargain', 'You have kept your own work tidy for months. Your supervisor asks if you can bring the whole team up to the same standard.',
      {minAge: 18, contact: 'boss', requiredStats: {jobPerformance: 70}, pathGate: 'employed'}, [
        chance('tools', 'Trial a smaller change',
          {text: 'The team adopted one change. It was the one with less paperwork.', effects: {discipline: 3}, change: {performance: 6, reputation: 3}},
          {text: 'The trial lasted a morning. We kept the spare storage shelf.', effects: {smarts: 3}, change: {performance: -2}}, 'discipline'),
        choice('people', 'Ask the team first', 'The people doing the job had been waiting to be asked.', {karma: 3, bonds: 2}, {reputation: 4}),
        choice('exit', 'Keep your current duties', 'I handed back the extra responsibility while it was still extra.', {joy: 3}, {person: '$contact', bondAmount: -2})
      ]),
    scene('spill', 'The missing stock', 'The count is short. A damaged crate explains most of it, including the smell.',
      {minAge: 18, contact: 'coworker', pathGate: 'employed'}, [
        choice('pencil', 'Record the damage', 'My account balanced. The crate did not.', {discipline: 3}, {performance: 4}),
        choice('people', 'Help sort the salvage', 'We saved the top layer and our least favorite apron.', {health: -1}, {person: '$contact', bondAmount: 6}),
        choice('exit', 'Leave the next shift a surprise', 'The next shift traced the smell and my handwriting.', {joy: 2}, {reputation: -4, performance: -2})
      ], 1200, 1899),
    scene('caption', 'An extra line', 'The training video has captions for everything except the sentence that explains the job.',
      {minAge: 18, pathGate: 'employed'}, [
        choice('keyboard', 'Write the missing caption', 'The line took seven words. The request form took seventy.', {discipline: 3}, {performance: 4}),
        choice('people', 'Ask a colleague to review it', 'We found two more gaps and one very confident wrong word.', {smarts: 3}, {reputation: 3}),
        choice('mic', 'Record a fresh explanation', 'The new clip begins with the actual instruction.', {joy: 3}, {performance: 2})
      ], 1995, 2149),
    scene('relay', 'A long-distance supervisor', 'The work relay delivers a correction after the shift has ended. The supervisor who sent it is still at breakfast.',
      {minAge: 18, pathGate: 'employed'}, [
        choice('clock', 'Date the handovers', 'Everyone now knows which yesterday they mean.', {discipline: 4}, {performance: 3}),
        choice('pencil', 'Send a worked example', 'The return message was a single, beautifully dated tick.', {smarts: 3}, {reputation: 3}),
        choice('people', 'Ask the local team', 'The local team finished the job before breakfast arrived.', {bonds: 3}, {performance: 2})
      ], 2150),
    scene('rehearsal', 'Instructions without a voice', 'A quiet rehearsal suits you. Then the group asks you to explain how you spotted the mistake.',
      {minAge: 11, pathGate: 'careful-learner'}, [
        choice('pencil', 'Draw the sequence', 'The drawing looked terrible. Everyone followed it.', {smarts: 4}, {grade: 2}),
        choice('people', 'Let each learner try it', 'The last person found a different mistake. It was mine.', {karma: 3, bonds: 3}),
        choice('chat', 'Speak from memory', 'My introduction was longer than the explanation.', {willpower: 4, joy: 2})
      ])
  ];

  function eligible(l, gate) {
    switch (gate) {
      case 'school': return school(l);
      case 'low-grade': return school(l) && l.world.grade < 65;
      case 'study-hardship': return school(l) && (debts(l) || l.age < 18 && l.sim.expansion?.start === 'A tight household budget');
      case 'community': return (l.sim.faith?.involvement || 0) >= 50;
      case 'employed': return employed(l);
      case 'careful-learner': return school(l) && ['Patient', 'Methodical'].includes(l.sim.expansion?.personality);
      default: return false;
    }
  }

  const employedWell = l => employed(l) && l.world.performance >= 70;
  const hasQualification = l => !!(l.sim.transcript?.length || l.sim.degrees.length ||
    l.world.tradeQualified || l.world.credential === 'trade' || l.sim.expansion?.certs.length);
  const qualifiedAdult = l => l.age >= 18 && hasQualification(l);
  function closeRelative(l) {
    return Object.values(l.people).some(p => model.isFamily(p) && model.isAlive(p) && p.active && p.bond >= 70);
  }
  function closeColleague(l) {
    return Object.values(l.people).some(p => ['Coworker', 'Boss'].includes(p.role) && model.isAlive(p) && p.active && p.bond >= 65);
  }
  const step = (label, met) => ({label, met});
  const goals = [
    {id: 'practice', title: 'From lessons to a living', description: 'Turn a qualification into a steady career.', steps: [
      step('Hold a degree, trade qualification or career certification as an adult', qualifiedAdult),
      step('Hold a paid occupation', employed),
      step('Spend three years in your current role and reach 70% performance', l => employedWell(l) && l.age - l.world.since >= 3)
    ]},
    {id: 'fresh-start', title: 'Back in the black', description: 'Build a way out of personal debt.', steps: [
      step('Finish a year with an outstanding loan', debts),
      step('Hold a paid occupation', employed),
      step('Finish a year with all loans repaid and cash in hand', l => !debts(l) && l.cash > 0)
    ]},
    {id: 'crew', title: 'The reliable one', description: 'Find a place on a team and earn its trust.', steps: [
      step('Hold a paid occupation', employed),
      step('Reach a 65% bond with a current colleague or supervisor', closeColleague),
      step('Reach six years of work experience and 70% job performance', l => l.sim.workYears >= 6 && employedWell(l))
    ]},
    {id: 'service', title: 'Leave the door open', description: 'Build lasting connections at home and in the community.', steps: [
      step('Reach a 70% bond with a living relative', closeRelative),
      step('Reach 55% involvement in a belief or secular community', l => (l.sim.faith?.involvement || 0) >= 55),
      step('Have a close living relative and at least 65 karma', l => closeRelative(l) && l.hidden.karma >= 65)
    ]}
  ];
  const byId = new Map(goals.map(g => [g.id, g]));

  function challenges(l) {
    const record = l.sim.pathwayChallenges;
    const year = l.born + l.age;
    return goals.map(g => {
      const active = record?.id === g.id;
      const completed = l.keepsakes.some(k => k.title === g.title);
      const reason = completed ? 'Already completed' : active ? 'In progress' : l.ended ? 'This life has ended' :
        l.age < 6 ? 'Available from age 6' : record?.id ? 'Finish or leave your current challenge' :
        record?.changed === year ? 'Choose again after your next birthday' : '';
      return {id: g.id, title: g.title, description: g.description, reason,
        status: completed ? 'complete' : active ? 'active' : 'available',
        steps: g.steps.map((s, i) => ({label: s.label, done: completed || active && i < record.step}))};
    });
  }

  function start(l, id, ctx) {
    if (l.ended || ctx.blocking(l)) return null;
    const record = l.sim.pathwayChallenges;
    const year = l.born + l.age;
    let title, text;
    if (id === 'withdraw') {
      if (!record?.id) return null;
      title = byId.get(record.id).title;
      text = 'I took the challenge off my list.';
      l.sim.pathwayChallenges = {changed: year};
    } else {
      const goal = challenges(l).find(g => g.id === id);
      if (!goal || goal.reason) return null;
      title = goal.title;
      text = 'I took on a challenge. My first goal is to ' + goal.steps[0].label.toLowerCase() + '.';
      l.sim.pathwayChallenges = {id, changed: year, step: 0, checked: year};
    }
    l.turns++;
    ctx.log(l, 'Milestone', title, text);
    return {title, text, delta: {}, accent: 'Milestone'};
  }

  function annual(l, ctx) {
    const r = l.sim.pathwayChallenges;
    const year = l.born + l.age;
    if (!r?.id || l.ended || r.checked >= year) return;
    r.checked = year;
    const g = byId.get(r.id);
    const target = g.steps[r.step];
    if (!target.met(l)) return;
    r.step++;
    if (r.step < g.steps.length) {
      ctx.log(l, 'Milestone', g.title, 'I checked off step ' + r.step + '. My next goal is to ' + g.steps[r.step].label.toLowerCase() + '.');
      return;
    }
    ctx.keepsake(l, g.title);
    const awards = l.sim.expansion?.awards;
    if (awards && !awards.includes(g.title)) awards.push(g.title);
    ctx.log(l, 'Achievement', g.title, 'I finished the last step. This one goes in the family archive.', ctx.apply(l, {joy: 4}));
    l.sim.pathwayChallenges = {changed: year};
  }

  function validate(l) {
    const r = l.sim.pathwayChallenges;
    if (r === undefined) return;
    const year = l.born + l.age;
    const validYear = n => Number.isSafeInteger(n) && n >= l.born && n <= year;
    const valid = r && typeof r === 'object' && !Array.isArray(r) && validYear(r.changed) &&
      (r.id === undefined ? r.step === undefined && r.checked === undefined :
        byId.has(r.id) && Number.isInteger(r.step) && r.step >= 0 && r.step < byId.get(r.id).steps.length &&
        validYear(r.checked) && r.checked >= r.changed && r.step <= r.checked - r.changed);
    if (!valid) throw Error('Invalid life challenge progress.');
  }

  root.PocketPathwaysStories = {list, eligible, challenges, start, annual, validate};
})(typeof module !== 'undefined' && module.exports ? module.exports : window);
