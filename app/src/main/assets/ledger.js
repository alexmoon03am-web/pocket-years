/* Game currency is integer dollars. Quotes and estate plans never move money. */
(function(root){
  'use strict';
  const PocketEconomy=typeof module!=='undefined'&&module.exports?require('./economy.js').PocketEconomy:root.PocketEconomy;
  const PocketExpansion=typeof module!=='undefined'&&module.exports?require('./expansion.js').PocketExpansion:root.PocketExpansion;
  function tax(gross){
    const brackets=[[13000,0],[36000,.12],[85000,.20],[155000,.28],[Infinity,.34]];
    let total=0,lower=0;
    for(const [upper,rate] of brackets){total+=Math.max(0,Math.min(gross,upper)-lower)*rate;if(gross<=upper)break;lower=upper;}
    return Math.floor(total);
  }
  function create(world,jobs,ageOf){
    function budget(l,earnedAge=l.age){
      const s=l.sim,w=l.world,adult=earnedAge>=18,shift=world.parts[w.partJob],working=adult&&!s.prison&&l.job;
      const x=s.expansion,e=x?PocketEconomy.local(l,l.town,earnedAge):null;
      const pay=working?PocketEconomy.salary(l,l.job,jobs,earnedAge):0,pension=l.job==='retired'?pay:0;
      const wages=adult?pay-pension:shift?shift[1]:0,side=adult&&!s.prison?(s.sideHustle||0)+(s.expansion?.royalties||0):0;
      const rent=adult?world.rent(l,earnedAge):0,yieldIncome=adult?Math.floor((s.fund||0)*(e?e.yield:.035)):0;
      const company=x&&adult?PocketExpansion.businessYear(l,earnedAge):{income:0,loss:0,rows:[]};
      const recurring=PocketExpansion.expenses(l,earnedAge);
      const gross=wages+pension+side+rent+yieldIncome+company.income,taxes=adult?Math.floor(tax(gross)*(e?e.tax:1)):0;
      const hasLocalHome=Object.entries(w.owned).some(([id,a])=>{
        const item=world.shopping.ownedItem(id,a);
        return item.category==='Property'&&!item.commercial&&!a.tenant&&(!item.town||item.town===l.town);
      });
      const familyRate=earnedAge<23||l.job==='student';
      const housing=!adult||s.prison||hasLocalHome?0:Math.round((familyRate?1200:5400)*(e?e.cost:1));
      const living=!adult||s.prison?0:Math.round((familyRate?1050:Math.min(15000,2400+Math.floor(gross*.13)))*(e?e.cost:1));
      const dependents=adult?Object.values(l.people).filter(p=>p.role==='Child'&&!Number.isInteger(p.diedAt)&&ageOf(l,p)<18).length*320:0;
      const upkeep=adult?Object.entries(w.owned).reduce((n,[id,a])=>{
        const item=world.shopping.ownedItem(id,a),rate=item.category==='Property'?.011:item.category==='Vehicle'?.045:.004;
        return n+Math.ceil(item.price*(a.share||1)*rate*(1+(100-(a.condition||80))/125));
      },s.pet?95:0):0;
      const funds=l.cash+gross-taxes-housing-living-dependents-upkeep-recurring.insurance-recurring.management-recurring.lifestyle-company.loss;
      let available=Math.max(0,funds),payment=0,interest=0,skipped=0;
      const loans={},payments={};
      for(const [id,loan] of Object.entries(s.loans)){
        const fee=adult?Math.ceil(loan.balance*(loan.rate??(id==='living'?.015:.04))):0,owed=loan.balance+fee;
        const due=Math.min(owed,loan.principal+fee),manual=x&&x.policies.autopay===false;
        const paid=adult&&!manual?Math.min(available,due):0;if(adult&&paid<due&&loan.paidYear!==l.born+earnedAge)skipped++;
        interest+=fee;payment+=paid;payments[id]=paid;available-=paid;
        if(owed>paid)loans[id]={...loan,balance:owed-paid};
      }
      const arrears=Math.max(0,-funds);
      if(arrears){const bill=loans.living||{balance:0,principal:250};bill.balance+=arrears;loans.living=bill;}
      return {wages,pension,side,rent,yieldIncome,gross,tax:taxes,housing,living,dependents,upkeep,interest,payment,payments,arrears,net:available-l.cash,loans,...(x?{...recurring,businessIncome:company.income,operatingLoss:company.loss,businessRows:company.rows,skipped}: {})};
    }
    function settle(l,earnedAge){
      const {loans,...b}=budget(l,earnedAge);l.cash+=b.net;l.sim.loans=loans;
      l.sim.lastBudget={year:l.born+l.age,...b};return b;
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
    return {budget,settle,plan,tax};
  }
  root.PocketLedger={create};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
