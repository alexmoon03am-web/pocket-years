'use strict';

// Old snapshots store the journal and contracts alongside two forecasts. Only
// those forecasts are re-rendered using the release's annual budget rules.
function expectedLegacySnapshot(engine, fixture) {
  const expected=JSON.parse(JSON.stringify(fixture));
  const decoded=engine.decodeGame(JSON.parse(JSON.stringify(fixture)));
  const annualCharges=['living','housing','dependents','upkeep','payment','insurance','management','lifestyle','operatingLoss'];
  function project(record,life) {
    if(engine.historyDynasty.isArchive(record))return;
    const budget=engine.sim.budget(life);
    const expenses=annualCharges.reduce((total,category)=>total+(budget[category]??0),0);
    record.monthlyExpenses=Math.round(expenses/12);
    record.salary=budget.wages;
  }
  project(expected.active,decoded.active);
  expected.archive.forEach((entry,i)=>project(entry,decoded.archive[i]));
  return expected;
}

module.exports={expectedLegacySnapshot};
