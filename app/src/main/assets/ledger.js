/* Game currency is integer dollars. Quotes and estate plans never move money. */
(function(root){
  'use strict';
  const PocketEconomy=typeof module!=='undefined'&&module.exports?require('./economy.js').PocketEconomy:root.PocketEconomy;
  const PocketExpansion=typeof module!=='undefined'&&module.exports?require('./expansion.js').PocketExpansion:root.PocketExpansion;
  const H=typeof module!=='undefined'&&module.exports?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  function tax(gross){
    const brackets=[[13000,0],[36000,.12],[85000,.20],[155000,.28],[Infinity,.34]];
    let total=0,lower=0;
    for(const [upper,rate] of brackets){total+=Math.max(0,Math.min(gross,upper)-lower)*rate;if(gross<=upper)break;lower=upper;}
    return Math.floor(total);
  }
  function create(world,jobs,ageOf,hooks){
    const {log,apply,blocking}=hooks;
    const round=Math.round;
    function housingFamily(l,age){
      return (age<23||l.job==='student')&&Object.values(l.people).some(p=>
        ['Mother','Father','Parent','Carer','Grandparent'].includes(p.role)&&p.active&&(!p.town||p.town===l.town)&&p.bond>=35&&!Number.isInteger(p.diedAt));
    }
    function eligibleLoan(l,id){
      return !l.world.owned[id]&&id!=='fines';
    }
    function household(l,earnedAge,period,e,gross,hasHome){
      const f=l.sim.finance||{},adult=earnedAge>=18&&!l.sim.prison;
      const future=period&&l.born+earnedAge>=2050,earlier=period&&!future?period:null;
      const cost=earlier?.cost||e?.cost||1;
      const family=housingFamily(l,earnedAge),income=gross/cost;
      const reserves=l.cash+(l.sim.fund||0)+PocketExpansion.portfolio(l);
      const poor=income<6500&&reserves/cost<4500;
      const space=future&&period.period==='stellar'?1.10:future&&period.period==='planetary'?1.05:1;
      const staples=future&&period.period==='stellar'?.86:future&&period.period==='planetary'?.93:1;
      const housingBase=earlier?earlier.housing:(6800+Math.min(5400,income*.12))*space;
      const livingBase=earlier?earlier.food:(3600+Math.min(10400,income*.155))*staples;
      const room=family?.33:f.shared?.44:poor?.55:1;
      const food=(poor?.67:family?.70:1)*(f.essentials?.76:1);
      let housing=adult&&!hasHome?round(housingBase*room*cost):0;
      const living=adult?round(livingBase*food*cost):0;
      // Lower earners can take a smaller room without consuming the reserve
      // for food. The discount tapers instead of vanishing at an income cutoff.
      if(!earlier&&income>0&&income<29000&&reserves<cost*6500){
        const minimum=round(2400*cost),share=round(gross*(.28+.055*income/29000));
        housing=Math.min(housing,Math.max(minimum,share));
      }
      const children=adult?Object.values(l.people).filter(p=>p.role==='Child'&&!Number.isInteger(p.diedAt)&&ageOf(l,p)<18).length:0;
      const dependents=children*round((earlier?earlier.food*.13:820)*cost);
      const essential=housing+living+dependents;
      const short=Math.max(0,essential-reserves-gross);
      // Family, shared lodging and community kitchens meet costs in kind. A
      // character can lose housing quality without borrowing the full local rent.
      const aid=Number.isInteger(f.aidUntil)&&f.aidUntil>=l.born+earnedAge;
      const support=short?Math.min(short,round(essential*(aid?.94:family?.80:poor?.65:.24))):0;
      const creditLimit=Math.max(850,round(((earlier?.food||3600)*.64+Math.min(4800,income*.10))*cost));
      return {housing,living,dependents,support,creditLimit,shared:!!f.shared||poor,familyHousing:family};
    }
    function budget(l,earnedAge=l.age){
      const s=l.sim,w=l.world,adult=earnedAge>=18,shift=world.parts[w.partJob],working=adult&&!s.prison&&l.job;
      const x=s.expansion,e=x?PocketEconomy.local(l,l.town,earnedAge):null;
      const periodBudget=H.historical(l,earnedAge)||(H.enabled(l)&&H.year(l,earnedAge)>=2050);
      const period=periodBudget?H.profile(l,earnedAge):null;
      const pay=working?PocketEconomy.salary(l,l.job,jobs,earnedAge):0,pension=l.job==='retired'?pay:0;
      const wages=adult?pay-pension:H.youthPay(l,earnedAge)||(shift?shift[1]:0),side=adult&&!s.prison?(s.sideHustle||0)+(s.expansion?.royalties||0):0;
      const rent=adult?world.rent(l,earnedAge):0,yieldIncome=adult?Math.floor((s.fund||0)*(e?e.yield:.035)):0;
      const company=x&&adult?PocketExpansion.businessYear(l,earnedAge):{income:0,loss:0,rows:[]};
      const recurring=PocketExpansion.expenses(l,earnedAge);
      const gross=wages+pension+side+rent+yieldIncome+company.income;
      let taxes=0;
      if(adult){
        const future=period&&l.born+earnedAge>=2050;
        if(future&&e){
          // Carry today's local brackets across the first future birthday,
          // then index thresholds for further changes in purchasing power.
          const basis=e.priceIndex/PocketEconomy.priceIndex(x.seed||l.id,e.code,2050);
          taxes=Math.floor(tax(gross/basis)*basis*e.tax+Math.max(0,gross-20000*basis)*(period.tax-.17));
        }else taxes=Math.floor(period?gross*period.tax+Math.max(0,gross-period.food*9)*.055:tax(gross)*(e?e.tax:1));
      }
      const hasLocalHome=!!world.homeId(l);
      const home=household(l,earnedAge,period,e,gross,hasLocalHome);
      const {housing,living,dependents,support,creditLimit}=home;
      const upkeep=adult?Object.entries(w.owned).reduce((n,[id,a])=>{
        const item=world.shopping.ownedItem(id,a),rate=item.category==='Property'?.011:item.category==='Vehicle'?.045:.004;
        const basis=item.category==='Property'?a.value:Math.max(a.value,item.price*(a.share||1)*.35);
        return n+Math.ceil(basis*rate*(1+(100-(a.condition??80))/125));
      },s.pet?95:0):0;
      const funds=l.cash+gross+support-taxes-housing-living-dependents-upkeep-recurring.insurance-recurring.management-recurring.lifestyle-company.loss;
      let available=Math.max(0,funds),payment=0,interest=0,skipped=0;
      let shortfall=Math.max(0,-funds);
      const loans={},payments={},foreclosures=[],warnings=[],year=l.born+earnedAge;
      // Protect collateral first and give borrowers two full missed installments
      // to catch up, negotiate, refinance or sell before a forced sale.
      const ordered=Object.entries(s.loans).sort(([a],[b])=>Number(!!w.owned[b])-Number(!!w.owned[a]));
      for(const [id,loan] of ordered){
        const secured=!!w.owned[id],inWorkout=year<(loan.workoutUntil||0);
        const rate=inWorkout?0:(loan.rate??(id==='living'?.015:.04));
        let fee=adult?Math.ceil(loan.balance*rate):0;
        if(!secured&&(loan.misses||0)>=2)fee=0;
        if(id==='living')fee=Math.min(fee,Math.max(0,creditLimit-loan.balance));
        const owed=loan.balance+fee;
        const prepaid=loan.paidYear===year?loan.manualPaid??loan.principal:0;
        const due=Math.min(owed,Math.max(0,loan.principal+fee-prepaid));
        const manual=x?.policies.autopay===false,paid=adult&&!manual?Math.min(available,due):0;
        const missed=adult&&paid<due&&prepaid<loan.principal;
        const misses=adult?(missed?(loan.misses||0)+1:0):(loan.misses||0);
        if(missed)skipped++;
        interest+=fee;payment+=paid;payments[id]=paid;available-=paid;
        const balance=owed-paid;
        if(!balance)continue;
        if(secured&&misses>=3){
          const item=world.shopping.ownedItem(id,w.owned[id]),value=w.owned[id].value;
          const sale=Math.floor(value*.90),proceeds=Math.max(0,sale-balance),deficiency=Math.max(0,balance-sale);
          foreclosures.push({id,name:world.shopping.title(item),value,balance,proceeds,shortfall:deficiency});
          available+=proceeds;shortfall+=deficiency;continue;
        }
        if(secured&&misses)warnings.push(misses===2?'One more missed payment can trigger a forced sale of '+world.shopping.title(world.shopping.ownedItem(id,w.owned[id]))+'.':'A secured payment will be overdue.');
        loans[id]={...loan,balance,misses};
      }
      const offset=Math.min(available,shortfall);available-=offset;shortfall-=offset;
      const creditRoom=year<(s.finance?.creditUntil||0)?0:Math.max(0,creditLimit-(loans.living?.balance||0));
      const arrears=Math.min(shortfall,creditRoom),uncovered=shortfall-arrears;
      if(arrears){
        const bill=loans.living||{balance:0,principal:Math.max(100,round(creditLimit*.12))};
        bill.balance+=arrears;loans.living=bill;
      }
      // Rent can remain owing when the local support system cannot cover the
      // household. Only the housing share of unpaid essentials becomes debt;
      // food is never billed retroactively. Never add interest to rent arrears.
      const unpaidHousing=housing>0&&uncovered>0?
        Math.floor(uncovered*housing/Math.max(1,housing+living+dependents)):0;
      const existingHousing=loans['housing-arrears']?.balance||0;
      const housingCap=Math.round(housing*2.3);
      const housingArrears=Math.max(0,Math.min(unpaidHousing,housingCap-existingHousing));
      if(housingArrears){
        const bill=loans['housing-arrears']||{balance:0,principal:Math.max(100,Math.round(housingCap/10)),rate:0,misses:0};
        bill.balance+=housingArrears;
        loans['housing-arrears']=bill;
        warnings.push('Unpaid housing charges will remain due until repaid or settled.');
      }
      const unmet=uncovered-housingArrears;
      if(unmet)warnings.push('The credit limit is reached. Some essential costs will go unmet.');
      else if(arrears)warnings.push('Cash will run out. The remaining bills will use household credit.');
      if(foreclosures.length)warnings.push('A lender will sell collateral this year.');
      return {wages,pension,side,rent,yieldIncome,gross,tax:taxes,...home,upkeep,interest,payment,payments,arrears,housingArrears,uncovered:unmet,foreclosures,warnings,net:available-l.cash,loans,...(x?{...recurring,businessIncome:company.income,operatingLoss:company.loss,businessRows:company.rows,skipped}: {})};
    }
    function settle(l,earnedAge=l.age){
      const prior=l.sim.lastBudget,{loans,...b}=budget(l,earnedAge);l.cash+=b.net;l.sim.loans=loans;
      for(const f of b.foreclosures){
        delete l.world.owned[f.id];
        log(l,'Assets','Collateral sold',f.name+' was sold after three missed payments. The lender took its share.');
      }
      const f=l.sim.finance||(l.sim.finance={});
      if(b.uncovered||b.housingArrears){
        f.hardshipYears=Math.min(40,(f.hardshipYears||0)+1);
        if(b.uncovered){
          apply(l,{joy:-2,health:f.hardshipYears>=3?-1:0});
          if(!prior?.uncovered)log(l,'Money','Household credit exhausted','I had to cut back. The shops stopped putting things on my tab.');
          if(b.upkeep)for(const a of Object.values(l.world.owned))a.condition=Math.max(10,(a.condition??80)-2);
          if(l.sim.expansion&&b.lifestyle)l.sim.expansion.policies.lifestyle='Simple';
        }
        if(b.housingArrears&&!prior?.housingArrears)log(l,'Money','Housing payments overdue','The part of my rent that nobody could cover became a repayable housing balance.');
        if(f.hardshipYears===3)log(l,'Money','Housing instability','Repeated unpaid essentials left my household less secure. Finding stable work and housing matters.');
      }else if(f.hardshipYears){
        f.hardshipYears=Math.max(0,f.hardshipYears-2);
        if(f.hardshipYears===0)log(l,'Money','Household stability restored','I have put the worst of the housing disruption behind me.');
      }
      if(!b.uncovered&&b.arrears&&!prior?.arrears)log(l,'Money','Bills came up short','I borrowed to cover the bills. The household accounts have repayment and support options.');
      l.sim.lastBudget={year:l.born+l.age,earnedAge,town:l.town,...b};return b;
    }
    function hardshipOptions(l){
      const f=l.sim.finance||{},b=budget(l),year=l.born+l.age,debts=Object.entries(l.sim.loans);
      const eligible=debts.filter(([id])=>eligibleLoan(l,id)),unsecured=eligible.reduce((n,[,d])=>n+d.balance,0);
      const hardship=b.arrears||b.housingArrears||b.uncovered||b.skipped||unsecured>b.creditLimit*.50;
      const reason=l.ended?'Life complete':blocking(l)?'Finish the current decision':l.age<18?'Opens at 18':l.sim.prison?'Unavailable in custody':'';
      const opts=[],offer=(id,title,desc,why)=>opts.push({id,title,desc,reason:reason||why||''});
      offer('essentials',f.essentials?'End the essentials budget':'Use an essentials budget',f.essentials?'Restore the usual grocery allowance.':'Buy basic groceries and reduce food costs by 24%.');
      offer('shared',f.shared?'Look for your own place':'Choose shared accommodation',f.shared?'Return to the standard local rent, or a lower-cost room when funds are short.':'Arrange a shared room for 44% of the standard local rent.',!f.shared&&!b.housing?'No separate housing bill':!f.shared&&b.familyHousing?'Already sharing with family':'');
      offer('aid','Apply for household support','Three years of in-kind help with basic food and housing when household funds run short.',f.aidUntil>=year?'Support already active':b.support<=0?'Current income and savings cover basic needs':'');
      const secured=debts.filter(([key,d])=>l.world.owned[key]&&(d.misses||b.loans[key]?.misses||b.foreclosures.some(row=>row.id===key)));
      const cooling=year<(f.workoutUntil||0);
      offer('forbear','Seek secured loan forbearance','Reschedule overdue vehicle or property installments over a longer term. Secured interest continues. This stops an immediate forced sale.',
        !secured.length?'No secured installments at risk':cooling?'Recent agreement remains in effect':'');
      offer('workout','Request a repayment plan','Spread eligible unsecured balances over eight years. Interest pauses for two years. Credit access is restricted.',!eligible.length?'No eligible unsecured debt':cooling?'Recent agreement remains in effect':!hardship?'Current payments are affordable':'');
      const candidate=eligible.filter(([id])=>id!=='tuition').sort((a,b)=>a[1].balance-b[1].balance)[0];
      const settlement=candidate?Math.ceil(candidate[1].balance*.7):0;
      offer('negotiate','Negotiate a cash settlement',candidate?'Offer '+H.money(l,settlement)+' now to settle the '+(candidate[0]==='housing-arrears'?'housing arrears':candidate[0]==='living'?'household credit':candidate[0])+' balance.':'Offer a reduced lump sum to a household creditor.',!candidate?'No eligible settlement':!hardship?'Current payments are affordable':l.cash<settlement?'More cash needed for a settlement':'');
      const modern=year>=1900;
      if(modern)offer('bankruptcy','File for personal insolvency','Sell holdings, funds and businesses. Eligible balances are discharged. Fines and study loans remain. Credit closes for seven years.',
        year<(f.filedUntil||0)?'A recent filing remains on record':!eligible.some(([id])=>id!=='tuition')?'No dischargeable debt':world.netWorth(l)>=0?'The estate can cover its debts':unsecured<Math.max(600,b.creditLimit*.5)?'Seek a repayment plan first':'');
      return opts;
    }
    function relief(l,id){
      const opt=hardshipOptions(l).find(o=>o.id===id);
      if(!opt||opt.reason)return null;
      const f=l.sim.finance||(l.sim.finance={}),s=l.sim,year=l.born+l.age,opening=l.cash;
      let text,delta={};
      if(id==='essentials'){f.essentials=!f.essentials;text=f.essentials?'I switched to basic groceries. The shopping list got shorter.':'I went back to my usual grocery budget.';}
      if(id==='shared'){f.shared=!f.shared;text=f.shared?'I arranged to share my housing costs. I also share the sink.':'I ended my shared housing arrangement.';}
      if(id==='aid'){f.aidUntil=year+2;text='The community agreed to help with basic food and housing for three years.';}
      if(id==='workout'){
        for(const [key,d] of Object.entries(s.loans))if(eligibleLoan(l,key)){d.principal=Math.max(1,Math.ceil(d.balance/8));d.workoutUntil=year+2;d.misses=0;}
        f.workoutUntil=year+5;f.creditUntil=Math.max(f.creditUntil||0,year+2);
        text='My unsecured lenders accepted an eight-year repayment plan and paused interest for two years.';
      }
      if(id==='forbear'){
        const b=budget(l);
        for(const [key,d] of Object.entries(s.loans))if(l.world.owned[key]&&(d.misses||b.loans[key]?.misses||b.foreclosures.some(row=>row.id===key))){
          const item=world.shopping.ownedItem(key,l.world.owned[key]);
          d.principal=Math.max(1,Math.ceil(d.balance/(item.category==='Property'?25:8)));d.misses=0;
        }
        f.workoutUntil=year+5;f.creditUntil=Math.max(f.creditUntil||0,year+2);
        text='The lender extended the term. The interest rate stayed put. The missed payments are still in the balance.';
      }
      if(id==='negotiate'){
        const [key,d]=Object.entries(s.loans).filter(([key])=>eligibleLoan(l,key)&&key!=='tuition').sort((a,b)=>a[1].balance-b[1].balance)[0];
        const amount=Math.ceil(d.balance*.70);l.cash-=amount;delete s.loans[key];f.creditUntil=Math.max(f.creditUntil||0,year+3);
        text='I paid '+H.money(l,amount)+'. The lender closed the account and recorded the settlement.';
      }
      if(id==='bankruptcy'){
        const x=s.expansion;let proceeds=l.cash+(s.fund||0)+PocketExpansion.portfolio(l)+PocketExpansion.companyValue(l);
        s.fund=0;
        if(x){x.portfolio={};x.companies={};x.policies.lifestyle='Simple';}
        for(const [key,a] of Object.entries(l.world.owned)){
          proceeds+=Math.max(0,Math.floor(a.value*.9)-(s.loans[key]?.balance||0));
          delete l.world.owned[key];delete s.loans[key];
        }
        const exempt=Math.min(proceeds,Math.round(budget(l).creditLimit*.25));proceeds-=exempt;
        for(const [key,d] of Object.entries(s.loans)){
          const paid=Math.min(proceeds,d.balance);proceeds-=paid;d.balance-=paid;
          if(!d.balance||(key!=='fines'&&key!=='tuition'))delete s.loans[key];
        }
        l.cash=exempt+proceeds;f.filedUntil=f.creditUntil=year+7;f.essentials=true;f.shared=true;
        text='The court settled my estate. I kept a small living allowance. My credit is restricted until '+f.creditUntil+'.';
      }
      if(l.cash!==opening)delta.cash=l.cash-opening;
      log(l,'Money',opt.title,text,delta);return {title:opt.title,text,delta};
    }
    function reliefPreview(l,id){
      if(!['shared','workout'].includes(id))return null;
      const copy=JSON.parse(JSON.stringify(l));
      if(!relief(copy,id))return null;
      const before=budget(l), after=budget(copy);
      return {before,after};
    }
    function validateFinance(l){
      const f=l.sim.finance;
      if(f!==undefined){
        if(!f||typeof f!=='object'||Array.isArray(f))throw Error('Invalid household policy.');
        for(const key of ['essentials','shared'])if(f[key]!==undefined&&typeof f[key]!=='boolean')throw Error('Invalid household policy.');
        for(const key of ['aidUntil','creditUntil','workoutUntil','filedUntil'])if(f[key]!==undefined&&!Number.isSafeInteger(f[key]))throw Error('Invalid household agreement.');
        if(f.hardshipYears!==undefined&&(!Number.isInteger(f.hardshipYears)||f.hardshipYears<0||f.hardshipYears>40))throw Error('Invalid hardship history.');
      }
      for(const d of Object.values(l.sim.loans)){
        if(!d||!Number.isFinite(d.balance)||d.balance<0||!Number.isFinite(d.principal)||d.principal<0)throw Error('Invalid loan balance.');
        if(d.rate!==undefined&&(!Number.isFinite(d.rate)||d.rate<0||d.rate>1))throw Error('Invalid loan rate.');
        for(const key of ['paidYear','manualPaid','workoutUntil','misses'])if(d[key]!==undefined&&(!Number.isSafeInteger(d[key])||d[key]<0))throw Error('Invalid loan history.');
      }
    }
    function plan(l){
      const kids=Object.entries(l.people).filter(([,p])=>p.role==='Child'&&!Number.isInteger(p.diedAt));
      const beneficiaries=kids.some(([id])=>id===l.sim.will)?kids.filter(([id])=>id===l.sim.will):kids;
      const count=beneficiaries.length,plan={};if(!count)return plan;
      const x=l.sim.expansion;
      let cash=l.cash+l.sim.trust+(l.sim.fund||0)+PocketExpansion.portfolio(l)+(x?.dispute?.amount||0),unsecured=0;
      const items={};
      for(const [id,loan] of Object.entries(l.sim.loans))if(!l.world.owned[id])unsecured+=loan.balance;
      for(const [id,a] of Object.entries(l.world.owned)){
        const loan=l.sim.loans[id],balance=loan?loan.balance:0;
        if(a.value<=balance)unsecured+=balance-a.value;
        else items[id]={...a,balance,principal:loan?loan.principal:0};
      }
      cash-=unsecured;
      for(const [id,a] of Object.entries(items).sort((a,b)=>a[1].value-b[1].value)){
        if(cash>=0)break;cash+=a.value-a.balance;delete items[id];
      }
      // Settle unsecured liabilities against company equity before distributing the estate.
      const firms=Object.entries(x?.companies||{}).map(([key,c])=>{
        const settlement=Math.min(c.capital,Math.max(0,-cash));cash+=settlement;
        return [key,{...c,capital:c.capital-settlement}];
      });
      cash=Math.max(0,cash);
      const weights=beneficiaries.map(([id])=>x?.double===id&&l.sim.will==='equal'?2:1),weight=weights.reduce((a,b)=>a+b,0);
      function part(amount,i){
        const before=weights.slice(0,i).reduce((a,b)=>a+b,0),remainder=amount%weight;
        return Math.floor(amount/weight)*weights[i]+Math.max(0,Math.min(weights[i],remainder-before));
      }
      beneficiaries.forEach(([id],i)=>{
        const assets={},loans={};let total=part(cash,i);
        for(const [asset,a] of Object.entries(items)){
          const equity=part(a.value-a.balance,i),balance=part(a.balance,i);
          if(!equity&&!balance)continue;
          assets[asset]={at:0,value:equity+balance,condition:a.condition||85,share:(a.share||1)*weights[i]/weight,inherited:true};
          for(const field of ['manager','insured','renovations','paint','tuned','vacant'])if(a[field]!==undefined)assets[asset][field]=a[field];
          if(a.tenant)assets[asset].tenant={...a.tenant};
          if(a.listing)assets[asset].listing={...a.listing};
          if(a.town)assets[asset].town=a.town;
          if(Number.isFinite(a.odometer))assets[asset].odometer=a.odometer;
          if(balance)loans[asset]={...l.sim.loans[asset],balance,principal:Math.max(1,part(a.principal,i))};
          total+=equity;
        }
        const companies={};
        for(const [key,c] of firms){
          const capital=part(c.capital,i);if(!capital)continue;
          companies[key]={...c,capital,share:(c.share??1)*weights[i]/weight};total+=capital;
        }
        const inheritance=part(cash,i),disputed=x&&kids.length>1&&(x.double||l.sim.will!=='equal')&&x.witness!==l.sim.will;
        const contested=disputed?Math.floor(inheritance*.12):0;
        plan[id]={cash:inheritance-contested,assets,loans,total,...(x?{companies,contested}:{})};
      });
      return plan;
    }
    return {budget,settle,hardshipOptions,relief,reliefPreview,validateFinance,plan,tax};
  }
  root.PocketLedger={create};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
