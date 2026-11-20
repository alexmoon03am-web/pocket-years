'use strict';

// Examples from the project root (Node.js 18+):
// node tools/benchmark_balance.cjs --assets /path/to/v1.1/app/src/main/assets --output baseline.json
// node tools/benchmark_balance.cjs --compare baseline.json --verify-balance --output candidate.json
// The same policies use only player-facing commands. No age, money, or health grants.
// A quick diagnostic can use --suite london --london-seeds 4 without release checks.
// Change only the era sample city with e.g. --suite era --town kyoto --seeds 12.
// JSON contains the engine digest, policy aggregates, percentiles and per-life traces.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const argv = process.argv.slice(2);
function option(name, fallback) {
  const i = argv.indexOf(name);
  if (i < 0) return fallback;
  assert(argv[i + 1] && !argv[i + 1].startsWith('--'), 'Missing value for ' + name);
  return argv[i + 1];
}
const assets = path.resolve(option('--assets', process.env.POCKET_ASSET_DIR || path.join(__dirname,'../app/src/main/assets')));
const E = require(path.join(assets, 'engine.js')).PocketEngine;
const years = [1200,1400,1550,1800,1910,1980,2026,2080,3000];
const count = Number(option('--seeds', 32));
const londonCount = Number(option('--london-seeds', 40));
const dynastyCount = Number(option('--dynasties', 8));
const selected = option('--suite', 'all');
const eraTown = option('--town','london');
assert(['all','era','london','dynasty'].includes(selected));
for (const n of [count,londonCount,dynastyCount]) assert(Number.isInteger(n) && n > 0);
// Every amount is in the engine's integer accounting unit. Historical and
// fictional period display denominations differ. At-age percentiles include
// only living players; the paired comparison uses survivors in both versions.
const ages = [18,25,30,35,40,45,50,65,80];
const salary = (l, job) => E.expansion.economy.salary(l,job,E.jobs);
const seedFor = i => (Math.imul(i + 1, 2654435761) >>> 0) || 1;
const employed = l => !!l.job && !['retired','student'].includes(l.job);
const companyIds = l => Object.keys(l.sim.expansion?.companies || {});

function decide(l, policy) {
  while (E.blocking(l)) {
    if (l.sim.review) { assert(E.acknowledge(l)); continue; }
    if (l.sim.court) { assert(E.sim.court(l, 'plea')); continue; }
    const e = E.stories[l.event.id];
    // Career path events never silently employ the unemployed control. All other
    // ordinary choices are a repeatable mix independent of the simulation RNG.
    let i = e.choices.findIndex(c => c.change?.gap || c.change?.jobSearch);
    if (e.id === 'retire') i = policy === 'unemployed' ? 2 : 0;
    if (i < 0) i = E.model.hash(l.id + '/' + l.age + '/' + e.id) % e.choices.length;
    assert(E.decide(l,i), e.id);
  }
}

function bestJob(l) {
  if (l.sim.prison || l.job === 'retired' || l.sim.program) return;
  const offers = [];
  if (!E.isHistorical(l)) {
    for (const id of Object.keys(E.world.openings)) {
      if (!E.world.jobReason(l,id)) offers.push({id, pay:salary(l,id), history:false});
    }
  }
  if (E.isHistorical(l) || E.calendar(l) >= 2050) {
    for (const r of E.historyEconomy.actions(l,'work')) {
      if (r.id.startsWith('job-') && !r.reason) {
        const id = r.id.slice(4);
        offers.push({id, pay:salary(l,id), history:true});
      }
    }
  }
  offers.sort((a,b) => b.pay-a.pay || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const best = offers[0];
  if (!best || best.pay <= salary(l,l.job)) return;
  if (best.history) E.historyPerform(l, 'work', 'job-' + best.id);
  else E.world.interview(l, best.id, 'example');
}

function investor(l, stat) {
  if (E.isHistorical(l) || l.age < 23) return;
  const x = E.expansion;
  // Preserve an operating reserve and limit opening opportunities to one firm
  // per working life. Business failures still count and are never rolled back.
  if (!stat.startedFirm && l.cash > 24000) {
    const opening = x.actions(l,'business').filter(a=>a.id.startsWith('open-') && !a.reason && a.cost <= l.cash / 3)
      .sort((a,b)=>a.cost-b.cost)[0];
    if (opening && x.perform(l,'business','',opening.id)) stat.startedFirm = true;
  }
  const firm = companyIds(l)[0];
  if (firm) {
    x.perform(l,'company',firm,'clients');
    if (l.cash > 60000 && l.age % 3 === 0) x.perform(l,'company',firm,'expand');
  }
  if (l.cash > 30000 && l.age < 66) {
    const order = x.actions(l,'portfolio').find(a=>a.id.startsWith('buy-') && !a.reason && a.cost < l.cash / 8);
    if (order) x.perform(l,'portfolio','',order.id);
  }
}

function recovering(policy) { return policy === 'recovery' || policy === 'assistedRecovery'; }
function claimAssistance(l,stat) {
  if (!E.sim.relief || (!l.sim.loans.living && l.age >= 30)) return;
  // Prefer lean spending and a shared home. Use a workout or in-kind support
  // only while eligible. Never toggle a chosen policy back to its dearer form.
  for (const id of ['essentials','shared','aid','workout']) {
    if (['essentials','shared'].includes(id) && stat.assistance[id]) continue;
    if (E.sim.relief(l,id)) stat.assistance[id] = (stat.assistance[id] || 0) + 1;
  }
}
function act(l, policy, stat) {
  if (l.age < 18) {
    if (policy === 'professional' && l.age >= 5) E.world.career(l,'study');
    return;
  }
  if (policy === 'assistedRecovery') claimAssistance(l,stat);
  if (policy === 'unemployed' || (recovering(policy) && l.age < 30)) {
    if (l.sim.program) E.sim.perform(l,'leave-course');
    if (employed(l)) E.sim.perform(l,'resign');
    return;
  }
  if (policy === 'professional') {
    if (!l.sim.degree && !l.sim.program) E.sim.perform(l,'course-science','loan');
    if (l.sim.degree && !l.sim.professional && !l.sim.program) {
      E.act(l,'read');
      E.sim.perform(l,'course-medicine','loan');
    }
  }
  bestJob(l);
  if (policy === 'wealthy') investor(l,stat);
}

function affordability(l,b) {
  // Compare like-for-like shares across currencies. Take-home excludes all
  // taxes; the basic basket excludes optional spending, assets and debt service.
  const takeHome = b.gross-b.tax;
  if (l.age < 18 || !b.wages || takeHome<=0) return {};
  const essential = b.living+b.housing+b.dependents;
  const pct = n=>Math.round(n/takeHome*100);
  const result = {basicSharePct:pct(essential),potentialSavingsPct:pct(takeHome-essential)};
  if (l.age!==35) return result;
  const dated = E.isHistorical(l) || E.calendar(l)>=2050;
  const market = E.world.shopping;
  const rows = dated ? E.historyEconomy.listings(l)
    : [...market.inventory(l,'keyline'),...market.inventory(l,'corner')];
  // A rotating industrial/future market can have only commercial properties.
  // Retain that as no observation; never substitute an invented home price.
  for (const [kind,key] of [['Property','homeMonths'],['Vehicle','vehicleMonths']]) {
    const prices = rows.filter(r=>r.category===kind && !r.commercial).map(r=>r.price);
    if (prices.length) result[key] = Math.round(12*Math.min(...prices)/takeHome);
  }
  return result;
}
function observation(l) {
  const b = E.sim.budget(l);
  return {
    net:E.world.netWorth(l), cash:l.cash, debt:E.sim.debt(l), pay:b.wages,
    living:b.living, housing:b.housing, job:l.job, professional:l.sim.professional,
    firms:companyIds(l).length,
    portfolio:E.expansion.portfolio(l),...affordability(l,b),
    arrears:l.sim.loans.living?.balance || 0
  };
}

function lifeRun(born, seed, policy, realism='guided', town='london') {
  const l = E.makeLife({seed,birthYear:born,town,realism});
  assert.equal(l.town,town,'Unavailable starting town in '+born);
  const r = {seed, born, town, policy, realism:l.sim.realism || (E.year.realism?'guided':'v1.1 default'), at:{}, assistance:{}, childhoodCashViolations:0, yearsPaid:0, firstRecovery:null, worstNet:0, startedFirm:false};
  while (!l.ended) {
    decide(l,policy);
    act(l,policy,r);
    if (ages.includes(l.age)) r.at[l.age] = observation(l);
    if (policy === 'unemployed' || (recovering(policy) && l.age < 30)) assert.equal(employed(l),false);
    const net = E.world.netWorth(l);
    assert(Number.isSafeInteger(net) && Number.isSafeInteger(l.cash) && l.cash >= 0);
    r.worstNet = Math.min(r.worstNet,net);
    if (recovering(policy) && l.age >= 30 && r.worstNet < 0 && net >= 0 && r.firstRecovery === null) r.firstRecovery = l.age;
    const age = l.age, shift = l.world.partJob || l.sim.timeline?.youthShift;
    if (employed(l)) r.yearsPaid++;
    assert(E.advance(l) && l.age === age+1 && l.age <= 110);
    if (age < 18 && !shift && !l.ended && l.sim.lastBudget?.wages > 0) r.childhoodCashViolations++;
  }
  assert(!E.advance(l));
  assert.equal(r.childhoodCashViolations,0);
  r.end = {age:l.age,cause:l.sim.cause, net:E.world.netWorth(l), debt:E.sim.debt(l), firms:companyIds(l).length};
  assert(r.end.cause);
  return r;
}

function familyRun(seed) {
  let g = {version:4,active:E.makeLife({seed,birthYear:1200,town:'london'}),archive:[],settings:{motion:'system'}};
  const transfers = [], seen = new Set(), stat = {};
  let ticks = 0, saveChecks = 0, largestSave = 0, noHeir = false;
  while (ticks < 900) {
    const l = g.active;
    decide(l,'dynasty');
    if (l.ended) {
      const children = E.sim.children(l).sort((a,b) => Math.abs(E.sim.ageOf(l,a[1])-30) - Math.abs(E.sim.ageOf(l,b[1])-30));
      if (!children.length) { noHeir=true; break; }
      assert(!seen.has(l.id)); seen.add(l.id);
      const child = E.continueAs(l,children[0][0]);
      assert(child && E.calendar(child) === E.calendar(l));
      assert(E.startNext(g,child));
      transfers.push({year:E.calendar(child),total:E.world.netWorth(child)});
      continue;
    }
    act(l,'dynasty',stat);
    if (l.age >= 23 && l.age <= 75 && (E.sim.children(l).length === 0 || l.age % 12 === 0))
      E.world.adopt(l,'Vale ' + (g.archive.length+1) + '-' + l.age);
    assert(E.advance(l));
    assert.equal(E.calendar(l),1200 + ++ticks);
    if (ticks % 50 === 0) {
      const raw = JSON.stringify(E.encodeGame(g));
      largestSave = Math.max(largestSave,Buffer.byteLength(raw));
      const loaded = E.decodeGame(JSON.parse(raw));
      assert.equal(loaded.archive.length,g.archive.length);
      assert.equal(loaded.active.rng,l.rng);
      assert.equal(E.world.netWorth(loaded.active),E.world.netWorth(l));
      assert.equal(E.calendar(loaded.active),E.calendar(l));
      g = loaded; saveChecks++;
    }
  }
  return {seed,ticks,generations:transfers.length+1,reason:noHeir?'No living eligible child':'900 years completed',saveChecks,largestSave,transfers};
}

function quantiles(values) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a,b)=>a-b);
  const get = q => {
    const at = q*(sorted.length-1), low=Math.floor(at), high=Math.ceil(at);
    return Math.round(sorted[low] + (sorted[high]-sorted[low])*(at-low));
  };
  return {min:sorted[0],p10:get(.1),p50:get(.5),p90:get(.9),max:sorted.at(-1)};
}
function summarize(rows) {
  const causes = {};
  for (const r of rows) causes[r.end.cause] = (causes[r.end.cause] || 0) + 1;
  const at = {};
  for (const age of ages) {
    const obs = rows.map(r=>r.at[age]).filter(Boolean);
    const entry = {survived:obs.length,negativeNet:obs.filter(v=>v.net<0).length,withDebt:obs.filter(v=>v.debt>0).length,professionallyQualified:obs.filter(v=>v.professional).length};
    for (const k of ['net','cash','pay','debt','arrears','living','housing','portfolio'])
      entry[k] = quantiles(obs.map(v=>v[k]));
    for (const k of ['basicSharePct','potentialSavingsPct','homeMonths','vehicleMonths']) {
      const market = obs.map(v=>v[k]).filter(Number.isFinite);
      entry[k] = quantiles(market);
      entry[k+'Count'] = market.length;
    }
    entry.jobs = {};
    for (const o of obs) {const key = o.job || 'unemployed';entry.jobs[key] = (entry.jobs[key] || 0) + 1;}
    at[age] = entry;
  }
  const adverse = rows.slice().sort((a,b)=>a.worstNet-b.worstNet).slice(0,3).map(r=>({seed:r.seed,worstNet:r.worstNet,ageAtDeath:r.end.age}));
  const recovery = rows.filter(r=>recovering(r.policy) && r.at[30]?.net<0);
  return {lives:rows.length,birthdays:rows.reduce((a,r)=>a+r.end.age,0),childDeaths:rows.filter(r=>r.end.age<18).length,
    deathAge:quantiles(rows.map(r=>r.end.age)),endNet:quantiles(rows.map(r=>r.end.net)),causes,adverse,
    openedBusiness:rows.filter(r=>r.startedFirm).length, inNegativeAt30:recovery.length,
    recoveredBeforeDeath:recovery.filter(r=>r.firstRecovery!==null).length,recoveryAge:quantiles(recovery.filter(r=>r.firstRecovery!==null).map(r=>r.firstRecovery)),at};
}
function assetDigest() {
  const hash = crypto.createHash('sha256');
  for (const file of fs.readdirSync(assets).filter(f=>f.endsWith('.js')).sort())
    hash.update(file).update(fs.readFileSync(path.join(assets,file)));
  return hash.digest('hex');
}
const report = {engineDigest:assetDigest(),eraTown,seedCount:count,londonCount,dynastyCount,checkedReplays:0,cohorts:{},runs:{},dynasties:[]};
function cohort(name,year,policy,n,realism) {
  const town = name.startsWith('london_') ? 'london' : eraTown;
  const runs = Array.from({length:n},(_,i)=>lifeRun(year,seedFor(i),policy,realism,town));
  assert.deepEqual(lifeRun(year,seedFor(0),policy,realism,town),runs[0],'Seeded replay diverged in '+name);
  report.checkedReplays++;
  report.cohorts[name] = summarize(runs);
  report.runs[name] = runs;
  const s = report.cohorts[name], a = s.at[35];
  console.error(name, n+' complete', 'deaths under 18 '+s.childDeaths, 'age 35 survivors '+a.survived, 'median pay/net',a.pay?.p50,a.net?.p50);
}
if (['all','era'].includes(selected)) for (const year of years) cohort('era_'+year,year,'ordinary',count);
if (['all','era'].includes(selected) && E.year.realism) {
  for (const year of [1200,1400,1550]) cohort('historical_'+year,year,'ordinary',count,'historical');
}
if (['all','london'].includes(selected)) for (const p of ['ordinary','unemployed','professional','wealthy','recovery','assistedRecovery']) cohort('london_'+p,1991,p,londonCount);
if (['all','dynasty'].includes(selected)) {
  report.dynasties = Array.from({length:dynastyCount},(_,i)=>familyRun(seedFor(i)));
  for (const d of report.dynasties) console.error('family',d.seed,d.ticks,d.generations,d.reason);
}
const comparisonFile = option('--compare', null);
if (comparisonFile) {
  const prior = JSON.parse(fs.readFileSync(comparisonFile, 'utf8'));
  report.pairedComparison = {};
  for (const [group,rows] of Object.entries(report.runs)) {
    // v1.1 had a single risk model. Both v1.2 settings use that identical
    // launch policy/seed panel as their reference.
    const source = prior.runs[group] || (group.startsWith('historical_') && prior.runs[group.replace('historical_','era_')]);
    assert(source,'Missing comparison cohort: '+group);
    const old = new Map(source.map(r=>[r.seed,r]));
    assert(rows.every(r=>old.get(r.seed)?.born === r.born && (old.get(r.seed).town || 'london')===r.town), 'Different birth panel: '+group);
    const pairs = rows.map(r=>[old.get(r.seed),r]);
    const aliveAt35 = pairs.filter(([a,b])=>a.at[35] && b.at[35]);
    const difference = metric=>quantiles(aliveAt35.map(([a,b])=>b.at[35][metric]-a.at[35][metric]));
    report.pairedComparison[group] = {
      baselineDigest:prior.engineDigest, pairedSeeds:pairs.length, mutualSurvivors35:aliveAt35.length,
      age35NetChange:difference('net'), age35PayChange:difference('pay'), age35DebtChange:difference('debt'),
      ageAtDeathChange:quantiles(pairs.map(([a,b])=>b.end.age-a.end.age))
    };
  }
}
// Optional release checks use broad gameplay relationships, not fixed salaries
// or exact random counts. Small smoke runs can omit this flag.
if (argv.includes('--verify-balance')) {
  assert(selected === 'all' && eraTown === 'london' && count >= 32 && londonCount >= 32 && dynastyCount >= 4 && comparisonFile,
    '--verify-balance needs the full release panel and a baseline');
  const {cohorts:c} = report;
  const ordinary = c.london_ordinary.at[35], idle = c.london_unemployed.at[35];
  assert.equal(idle.pay.max,0,'The unemployment controls earned wages');
  assert(idle.debt.p90 <= ordinary.pay.p50,'Most unemployed households owe more than an annual full-time wage');
  assert(ordinary.net.p50 > 0 && report.pairedComparison.london_ordinary.age35NetChange.p50 < 0,
    'Ordinary workers should accumulate savings more slowly than in v1.1');
  assert(c.london_professional.at[35].pay.p50 > ordinary.pay.p50 && c.london_professional.at[25].debt.p50 > 0,
    'The longer course of education should cost money and improve later earnings');
  assert(c.london_recovery.recoveredBeforeDeath > c.london_recovery.inNegativeAt30 / 2,
    'Most returning workers did not escape negative net worth');
  // Even with new technologies, a modestly employed tenant in these sample
  // cities should not save nearly their whole pay simply by crossing 2050.
  for (const born of [2026,2080,3000]) {
    const a = c['era_'+born].at[35];
    assert(a.basicSharePctCount >= count/2 && a.basicSharePct.p50 >= ordinary.basicSharePct.p50/2,
      'Future basics have become implausibly cheap against local pay: '+(born+35));
    assert(a.basicSharePct.p50 < 100,'Ordinary workers cannot meet basic costs in '+(born+35));
  }
  const earlyDeaths = prefix => [1200,1400,1550].reduce((n,y)=>n+c[prefix+y].childDeaths,0);
  assert(earlyDeaths('historical_') > earlyDeaths('era_'), 'Historical risk did not separate from guided risk');
  assert(report.dynasties.some(d=>d.ticks===900 && d.saveChecks===18),'No family completed the nine-century save/reload trial');
  assert.equal(assetDigest(),report.engineDigest,'Asset scripts changed during the release measurement');
  report.balanceChecks = 'passed';
}
const out = option('--output', null);
if (out) fs.writeFileSync(out,JSON.stringify(report)+'\n');
else process.stdout.write(JSON.stringify(report)+'\n');
