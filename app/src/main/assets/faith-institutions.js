/* Community property and cash belong to the institution. Only explicit gifts
   and building commissions draw from a personal or movement balance. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const Model=node?require('./model.js').PocketModel:root.PocketModel;
  const History=node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  const World=node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;
  const Geo=node?require('./geography.js').PocketGeography:root.PocketGeography;
  function market(){return node?require('./market.js').PocketMarket:root.PocketMarket;}
  function catalog(){return node?require('./faith-catalog.js').PocketFaithCatalog:root.PocketFaithCatalog;}
  const year=l=>l.born+l.age;
  const count=n=>Math.max(0,Math.round(n));
  const percent=n=>Math.max(0,Math.min(100,Math.round(n)));
  const kinds={
    assembly:{title:'Meeting house',use:'gathering',size:.85,role:'Community coordinator'},
    temple:{title:'Temple',use:'gathering',size:1.3,role:'Temple caretaker'},
    church:{title:'Church',use:'gathering',size:1.22,role:'Parish coordinator'},
    mosque:{title:'Mosque',use:'gathering',size:1.20,role:'Community organizer'},
    synagogue:{title:'Synagogue',use:'gathering',size:1.18,role:'Community coordinator'},
    monastery:{title:'Monastery',use:'learning',size:1.7,role:'Resident teacher'},
    shrine:{title:'Shrine',use:'art',size:.52,role:'Shrine custodian'},
    school:{title:'School',use:'learning',size:1.1,role:'Teacher'},
    library:{title:'Library',use:'learning',size:1,role:'Librarian'},
    charity:{title:'Charity kitchen',use:'relief',size:.67,role:'Kitchen coordinator'},
    hospital:{title:'Hospital',use:'health',size:2.15,role:'Care worker'},
    community:{title:'Community center',use:'gathering',size:.91,role:'Community coordinator'},
    arts:{title:'Arts workshop',use:'art',size:.79,role:'Arts instructor'}
  };
  function association(l,id){
    const m=l.sim.faithWorld?.movements?.[id];
    if(m)return {id,name:m.name,custom:true,institution:'Meeting house'};
    const t=catalog().get(id);
    return t?{...t,id:t.id||id,custom:false}:null;
  }
  function ownerId(l,id){
    const movements=node?require('./faith-movements.js').PocketFaithMovements:root.PocketFaithMovements;
    return movements.organization(l,id);
  }
  function affiliation(l){return ownerId(l,l.sim.faith?.id||'unaffiliated');}
  // Institution forms are keyed to the catalog's tradition family. A shared
  // adjective in two denomination names does not establish shared practices.
  const worshipForms={
    Christianity:'church',Islam:'mosque',Judaism:'synagogue','Hindu traditions':'temple',
    Buddhism:'temple',Jainism:'temple',Daoism:'temple',Shinto:'shrine','Personal outlook':'community'
  };
  const monasticDenominations=new Set(['catholic','orthodox','oriental-orthodox']);
  const monasticFamilies=new Set(['Buddhism','Jainism','Hindu traditions','Daoism']);
  function principal(a){
    if(!a)return 'community';
    if(a.custom)return 'assembly';
    if(a.id==='theravada')return 'monastery';
    return worshipForms[a.family]||'assembly';
  }
  function buildKinds(a){
    const first=principal(a);
    const ids=[first,'school','library','charity','hospital','community','arts'];
    if(a?.custom)ids.push('temple','shrine','monastery');
    if(monasticDenominations.has(a?.id)||monasticFamilies.has(a?.family))ids.push('monastery');
    if(first==='temple'||a?.family==='Buddhism')ids.push('shrine');
    return [...new Set(ids)];
  }
  function label(kind,a){
    if(kind==='assembly'&&!a?.custom&&typeof a?.institution==='string'&&a.institution.length<80)return a.institution;
    return kinds[kind].title;
  }
  function prices(l,town=l.town){
    const p=History.profile(l,l.age,town);
    return {land:count((p.food*1.65+p.housing)*p.home),build:count((p.food*2.45+p.housing)*p.cost),
      wage:Math.max(60,count(p.food*.42*p.pay)),materials:Math.max(12,count(p.food*.11*p.cost)),
      gift:Math.max(5,count(p.food*.035*p.cost)),programme:Math.max(1,count(p.food*.003*p.cost))};
  }
  function makeSite(l,{id,kind,faithId,town,name,founderId,founderName,founded,landValue,construction,treasury,seeded}){
    return {id,kind,faithId,movementId:l.sim.faithWorld.movements?.[faithId]?faithId:null,town,name,founderId,founderName,founded,
      stewardId:seeded?null:founderId,stewardName:seeded?'Local trustees':founderName,landValue,construction,propertyValue:landValue+construction,
      treasury,condition:seeded?81:100,reputation:seeded?52:35,level:1,staff:seeded?[{id:id+'-keeper',personId:null,name:'Local caretaker',role:kinds[kind].role}]:[],
      seeded:!!seeded,appointments:[],nextHire:0,priority:'balanced',serviceTotal:0,lastAccounts:null,unpaidYears:0,board:[],lastYear:seeded?year(l):founded};
  }
  function initialize(l){
    if(!l.sim.faithWorld)l.sim.faithWorld={};
    const w=l.sim.faithWorld;
    if(!w.institutions)w.institutions={sites:[],lots:[],sequence:0,lastYear:year(l),seededTowns:[],funding:'personal',fundingOwner:l.id};
    const s=w.institutions;
    if(!s.seededTowns.includes(l.town)){
      s.seededTowns.push(l.town);
      const c=catalog();
      const choices=c.options(year(l),l.town).map(o=>typeof o==='string'?c.get(o):o).filter(t=>t&&principal(t)!=='community'&&c.local(t.id,l.town,year(l)));
      // This represents a simulated neighborhood group. It is not a claim that a particular historical building existed here.
      const locals=choices.slice().sort((a,b)=>Model.hash(l.town+a.id)-Model.hash(l.town+b.id));
      const a=locals[0],kind=a?principal(a):'community',faithId=a?.id||'unaffiliated',q=prices(l),y=year(l);
      const town=World.place(l.town,y).city;
      const site=makeSite(l,{id:'site-'+(++s.sequence),kind,faithId,town:l.town,name:town+' '+label(kind,a),founderId:null,founderName:'Local residents',founded:y,
        landValue:q.land,construction:count(q.build*kinds[kind].size),treasury:q.wage*2,seeded:true});
      s.sites.push(site);
    }
    return s;
  }
  const records=(l,town=null)=>(l.sim.faithWorld?.institutions?.sites||[]).filter(s=>!town||s.town===town);
  function forecast(l,site){
    const q=prices(l,site.town),level=site.level,staff=site.staff.length;
    const boom=.83+(Model.hash(site.id+'/'+site.town+'/'+year(l))%36)/100;
    const region=World.region(site.town),movement=l.sim.faithWorld?.movements?.[ownerId(l,site.faithId)];
    const outreach=movement?Math.min(1.3,.38+(movement.regions?.[region]?.followers||0)/65):1;
    const audience=Math.max(0,count((14+site.reputation*.66)*level*boom*outreach));
    // A congregation contributes and supports local dues even in a year without a playable steward.
    const contributions=count(audience*q.programme*(2.6+site.reputation*.027));
    const maintenance=count(q.materials*kinds[site.kind].size*(.7+level*.3)*(site.condition<40?1.3:1));
    const available=site.treasury+contributions;
    const repairFirst=site.priority==='preservation';
    const upkeep=Math.min(available,maintenance);
    const repairAllowance=repairFirst?available-upkeep:site.priority==='balanced'&&site.condition<76?Math.max(0,available-upkeep-q.wage*staff):0;
    const conservation=Math.min(repairAllowance,count(maintenance*.7));
    const wageBill=q.wage*staff,paid=Math.min(available-upkeep-conservation,wageBill);
    const staffRatio=wageBill?paid/wageBill:0;
    const capacity=site.condition<15?0:count((staff*32+8)*level*(.4+site.condition*.006));
    // Volunteer-run sites can open on a smaller scale; unpaid staff do not deliver full services.
    const attendance=Math.min(audience,count(capacity*(staff?staffRatio:0.42)));
    const communityFirst=site.priority==='outreach';
    const reserve=communityFirst?0:Math.floor(q.wage*.25);
    const remaining=available-upkeep-conservation-paid;
    const served=Math.min(attendance,Math.floor(Math.max(0,remaining-reserve)/q.programme));
    const programmes=served*q.programme,closing=remaining-programmes;
    return {year:year(l),opening:site.treasury,contributions,maintenance,upkeep,conservation,wageBill,paid,programmes,served,closing};
  }
  function summary(l,town=l.town,faithId=null){
    const sites=records(l,town).filter(s=>!faithId||ownerId(l,s.faithId)===faithId);
    const totals={count:sites.length,active:0,treasury:0,staff:0,annualServices:0,landValue:0,propertyValue:0,localInfluence:0,education:0,health:0,relief:0};
    for(const s of sites){
      totals.treasury+=s.treasury;totals.landValue+=s.landValue;totals.propertyValue+=s.propertyValue;totals.staff+=s.staff.length;
      const served=s.lastAccounts?.served||0,kind=kinds[s.kind].use;
      if(served>0)totals.active++;totals.annualServices+=served;
      if(kind==='learning')totals.education+=served;if(kind==='health')totals.health+=served;if(kind==='relief')totals.relief+=served;
      totals.localInfluence+=Math.round(s.reputation*Math.min(1,served/32)*.34);
    }
    const plots=(l.sim.faithWorld?.institutions?.lots||[]).filter(p=>(!town||p.town===town)&&(!faithId||ownerId(l,p.faithId)===faithId));
    const unbuilt=plots.reduce((n,p)=>n+p.landValue,0);
    totals.pendingPlots=plots.length;totals.landValue+=unbuilt;totals.propertyValue+=unbuilt;
    totals.localInfluence=Math.min(100,totals.localInfluence);
    totals.text=sites.length+' '+(sites.length===1?'institution':'institutions')+' · '+totals.staff+' staff · '+totals.annualServices+' visits funded last year';
    return totals;
  }
  function boardMember(s,id){return s.board.find(b=>b.id===id);}
  function credit(s,l,n){let b=boardMember(s,l.id);if(!b){b={id:l.id,service:0};s.board.push(b);if(s.board.length>12)s.board.shift();}b.service=Math.min(100,b.service+n);}
  function activeNPCs(l,town){
    return Object.values(l.people).filter(p=>p.met&&p.active&&!Number.isInteger(p.diedAt)&&(p.town||l.town)===town);
  }
  function updateService(l,site,r){
    if(!r.served)return;
    const q=prices(l,site.town),npcs=activeNPCs(l,site.town).slice().sort((a,b)=>Model.hash(a.id+r.year+site.id)-Model.hash(b.id+r.year+site.id));
    const use=kinds[site.kind].use,targets=npcs.slice(0,Math.min(4,Math.ceil(r.served/10)));
    for(const p of targets){
      if(use==='relief')p.wealth+=Math.min(q.programme,Math.floor(r.programmes/Math.max(1,targets.length)));
      if(use==='learning'||use==='art'){p.communityEducation=percent((p.communityEducation||0)+2);p.trust=percent((p.trust??p.bond)+1);}
      if(use==='health'){p.communityCare=percent((p.communityCare||0)+2);p.bond=percent(p.bond+1);}
      if(use==='gathering')p.loyalty=percent((p.loyalty??p.bond)+1);
    }
    if(!l.ended&&site.town===l.town&&Model.hash(l.id+'/'+site.id+'/'+r.year)%100<Math.min(40,r.served)){
      if(use==='learning'&&l.age>=5&&l.age<18){l.world.grade=percent(l.world.grade+1);l.stats.smarts=percent(l.stats.smarts+1);}
      if(use==='health'||use==='relief')l.stats.health=percent(l.stats.health+1);
      if(use==='art'||use==='gathering')l.stats.joy=percent(l.stats.joy+1);
    }
  }
  function nominateSuccessor(l,site,previous,api){
    const tree=l.sim.expansion?.family||{},y=year(l);
    const present=new Map(Object.values(l.people).map(p=>[p.id,p]));
    const choices=Object.values(tree).filter(n=>n.id!==previous&&n.parents?.includes(previous)&&n.town===site.town&&
      !Number.isInteger(n.died)&&y-n.born>=18&&y-n.born<=100&&!Number.isInteger(present.get(n.id)?.diedAt)&&!(n.id===l.id&&l.ended));
    choices.sort((a,b)=>(boardMember(site,b.id)?.service||0)-(boardMember(site,a.id)?.service||0)||a.born-b.born||a.id.localeCompare(b.id));
    const next=choices.find(n=>n.id===site.nominee)||choices[0];
    site.stewardId=next?.id||null;site.stewardName=next?.name||'Local trustees';delete site.nominee;
    const history=site.appointments||(site.appointments=[]);history.push({year:y,from:previous,to:site.stewardId,name:site.stewardName});
    if(history.length>16)history.shift();
    if(api?.log&&site.town===l.town)api.log(l,'Community',site.name,'The trustees appointed '+site.stewardName+' to oversee the accounts.');
  }
  function privateBenefactor(l,s,api){
    const y=year(l);
    for(const person of Object.values(l.people)){
      if(!person.met||!person.active||person.cutOff||!Model.isFamily(person)||Number.isInteger(person.diedAt)||Model.ageOf(l,person)<30||
         person.generosity<53||Model.hash(person.id+'/'+y+'/local-endowment')%53!==0||s.sites.some(v=>v.founderId===person.id))continue;
      const town=person.town||l.town,faithId=person.faith?.id||'unaffiliated',a=association(l,faithId);
      if(!Geo.cities[town]||!a||!a.custom&&!catalog().local(faithId,town,y)||a.custom&&!(l.sim.faithWorld.movements[faithId]?.regions?.[World.region(town)]?.followers>0))continue;
      const possible=[principal(a),'charity','library','school'].filter(k=>!s.sites.some(st=>ownerId(l,st.faithId)===faithId&&st.town===town&&st.kind===k));
      if(!possible.length)continue;
      const kind=possible[Model.hash(person.id+y)%possible.length],q=prices(l,town),construction=count(q.build*kinds[kind].size),treasury=q.wage*2;
      const cost=q.land+construction+treasury;
      if(person.wealth<cost*2.5)continue;
      person.wealth-=cost;
      const site=makeSite(l,{id:'site-'+(++s.sequence),kind,faithId,town,name:World.place(town,y).city+' '+label(kind,a),
        founderId:person.id,founderName:person.fullName||person.name,founded:y,landValue:q.land,construction,treasury,seeded:false});
      site.staff.push({id:site.id+'-keeper',personId:null,name:'Local '+kinds[kind].role.toLowerCase(),role:kinds[kind].role});
      s.sites.push(site);
      if(api?.log)api.log(l,'Family','A community endowment',site.founderName+' used personal savings to open '+site.name+'.');
      break;
    }
  }
  function annual(l,api={}){
    const s=initialize(l),y=year(l);if(s.lastYear>=y)return false;
    s.lastYear=y;
    for(const site of s.sites){
      if(site.lastYear>=y)continue;
      const workers=activeNPCs(l,site.town),tree=l.sim.expansion?.family||{};
      if(site.stewardId){
        const previous=site.stewardId,steward=Object.values(l.people).find(p=>p.id===previous);
        if((previous===l.id&&l.ended)||Number.isInteger(tree[previous]?.died)||Number.isInteger(steward?.diedAt))nominateSuccessor(l,site,previous,api);
      }
      // Named staff leave on death or departure; community hires represent other local residents.
      site.staff=site.staff.filter(st=>!st.personId||workers.some(p=>p.id===st.personId)||tree[st.personId]?.town===site.town&&
        !Number.isInteger(tree[st.personId]?.died)&&!Object.values(l.people).some(p=>p.id===st.personId));
      const r=forecast(l,site);
      site.lastYear=y;site.lastAccounts=r;site.treasury=r.closing;site.serviceTotal+=r.served;
      const conditionBefore=site.condition;
      site.condition=percent(site.condition+(r.upkeep<r.maintenance?-8:r.conservation>0?3:-1));
      site.propertyValue=site.landValue+count(site.construction*(.24+.0076*site.condition));
      site.reputation=percent(site.reputation+(r.served>=10?2:r.served===0?-2:0)-(r.paid<r.wageBill?3:0));
      let rest=r.paid;
      site.staff.forEach((st,i)=>{
        const pay=Math.floor(rest/(site.staff.length-i));rest-=pay;
        const p=workers.find(n=>n.id===st.personId);if(p){p.wealth+=pay;p.communityEmployer=site.name;}
      });
      site.unpaidYears=r.paid<r.wageBill?site.unpaidYears+1:0;
      if(site.unpaidYears>=2&&site.staff.length){const lost=site.staff.pop();const p=workers.find(n=>n.id===lost.personId);if(p)delete p.communityEmployer;site.unpaidYears=0;}
      updateService(l,site,r);
      if(api.log&&site.town===l.town&&site.stewardId===l.id&&((conditionBefore>=15&&site.condition<15)||r.paid<r.wageBill&&site.unpaidYears===1))
        api.log(l,'Community',site.name,site.condition<15?'The doors closed for repairs.':'The treasury could not cover the full staff bill.');
    }
    privateBenefactor(l,s,api);
    return true;
  }
  function account(l,s,group){
    const m=l.sim.faithWorld?.movements?.[group],use=s.funding==='movement'&&s.fundingOwner===l.id&&m?.leaderId===l.id;
    return {available:use?m.treasury:l.cash,name:use?'Movement treasury':'Personal funds',movement:use,
      pay(amount){if(use)m.treasury-=amount;else l.cash-=amount;}};
  }
  function managed(l,site){
    const m=l.sim.faithWorld?.movements?.[ownerId(l,site.faithId)];
    return l.id===site.stewardId||!!m&&m.leaderId===l.id;
  }
  function options(l,area){
    const s=l.sim.faithWorld?.institutions;
    if(!s)return [];
    const group=affiliation(l),a=association(l,group),m=l.sim.faithWorld?.movements?.[group];
    const q=prices(l),y=year(l),fund=account(l,s,group),rows=[];
    const locked=l.ended?'Life complete':l.sim.review||l.sim.court||l.event&&!l.event.resolved?'Finish the current decision':l.sim.prison?'Unavailable in custody':'';
    const money=n=>History.money(l,n);
    function add(id,title,description,icon,reason,cost,run,once=true){
      const key='faith-site/'+area+'/'+id;
      rows.push({id,title,description,desc:description,icon,cost:cost||0,reason:locked||reason||(once&&l.used.includes(key)?'Done this year':''),run,key,once});
    }
    const adult=l.age>=18?'':'Opens at 18';
    if(area==='institutions'){
      const owner=a?.id||'unaffiliated',name=a?.name||'Neighborhood community';
      const lot=s.lots.find(p=>p.town===l.town&&ownerId(l,p.faithId)===owner),limit=buildKinds(a).filter(k=>!s.sites.some(site=>!site.seeded&&site.town===l.town&&ownerId(l,site.faithId)===owner&&site.kind===k));
      if(m?.leaderId===l.id)add('funding',fund.movement?'Pay for new construction personally':'Pay for new construction from movement funds',
        'Current source: '+fund.name+' · '+money(fund.available)+'.','wallet',adult,0,()=>{
          s.fundingOwner=l.id;s.funding=fund.movement?'personal':'movement';return 'I selected '+(fund.movement?'personal funds':'the movement treasury')+' for new property purchases.';},false);
      if(!lot&&limit.length){
        add('land','Acquire a community plot','Dedicate land to '+name+' · '+money(q.land)+' from '+fund.name.toLowerCase()+'.','home',
          adult||(fund.available<q.land?'Insufficient '+fund.name.toLowerCase():''),q.land,()=>{
            fund.pay(q.land);s.lots.push({id:'plot-'+(++s.sequence),town:l.town,faithId:owner,year:y,landValue:q.land,donor:l.name,donorId:l.id});
            return 'I secured land for '+name+'. The deed belongs to the community.';});
      }
      for(const [assetId,owned] of Object.entries(l.world.owned)){
        const marketItem=market().ownedItem(assetId,owned);
        if(marketItem?.category!=='Property')continue;
        const town=marketItem.town||owned.town||owned.acquiredTown||l.town;
        const occupied=s.lots.some(p=>p.town===town&&ownerId(l,p.faithId)===owner);
        const possible=buildKinds(a).some(k=>!s.sites.some(site=>!site.seeded&&site.town===town&&ownerId(l,site.faithId)===owner&&site.kind===k));
        const deedTitle=market().title(marketItem);
        const restriction=adult||((l.sim.loans[assetId]?.balance||0)>0?'Pay off the outstanding loan first':
          (owned.share??1)!==1?'Only the sole owner can donate':owned.tenant?'An active tenant occupies the property':
          !Number.isSafeInteger(owned.value)||owned.value<1?'Requires a positive property value':occupied?'This community already has an unbuilt plot here':!possible?'This community has all available facilities here':'');
        add('deed/'+assetId,'Dedicate '+deedTitle,
          'Permanently transfer sole title in '+World.place(town,y).city+' to '+name+'. Its '+money(owned.value)+' value leaves your estate. Construction takes place in that settlement.',
          'key',restriction,0,()=>{
            const transferred={assetId,title:deedTitle,town,donorId:l.id,donorName:l.name,year:y,value:owned.value,
              acquiredTown:owned.acquiredTown||town,acquiredYear:owned.acquiredYear??l.born+(owned.at||0),built:marketItem.built??null};
            delete l.world.owned[assetId];delete l.sim.loans[assetId];
            s.lots.push({id:'plot-'+(++s.sequence),town,faithId:owner,year:y,landValue:transferred.value,donor:l.name,donorId:l.id,deed:transferred});
            return 'I signed the deed for '+deedTitle+' over to '+name+'. The property left my estate.';});
      }
      if(lot){
        for(const kind of limit){
          const title=label(kind,a),build=count(q.build*kinds[kind].size),reserve=q.wage+q.materials,cost=build+reserve;
          add('build-'+kind,'Build '+title.toLowerCase(),name+' · construction '+money(build)+' and opening reserve '+money(reserve)+' from '+fund.name.toLowerCase()+'.','tools',
            adult||(fund.available<cost?'Insufficient '+fund.name.toLowerCase():''),cost,()=>{
              fund.pay(cost);s.lots.splice(s.lots.indexOf(lot),1);
              const site=makeSite(l,{id:'site-'+(++s.sequence),kind,faithId:owner,town:l.town,name:(l.name.split(' ').slice(-1)[0]||World.place(l.town,y).city)+' '+title,
                founderId:l.id,founderName:l.name,founded:y,landValue:lot.landValue,construction:build,treasury:reserve,seeded:false});
              if(lot.deed)site.deed={...lot.deed};
              s.sites.push(site);return 'I opened '+site.name+'. Its first account held '+money(reserve)+'.';});
        }
      }
      return rows;
    }
    if(!area.startsWith('institution:'))return rows;
    const id=area.slice('institution:'.length),site=s.sites.find(v=>v.id===id);
    if(!site)return rows;
    const current=site.town===l.town,manage=managed(l,site),local=current?'':'Visit this settlement first';
    const admin=adult||(!manage?'A steward or movement leader is required':'');
    const sq=prices(l,site.town),use=kinds[site.kind].use,member=boardMember(site,l.id);
    const spend=(amount)=>site.treasury<amount?'Insufficient institutional funds':'';
    const put=(key,n)=>{l.stats[key]=percent(l.stats[key]+n);};
    const ticket={
      gathering:['Attend a community gathering','Neighbors set out benches. We filled them.'],
      learning:['Attend a lesson','I learned something. The teacher made me explain it back.'],
      relief:['Share a community meal','The kitchen served everybody at the table.'],
      health:['Visit the care service','The care team checked my symptoms and made time for questions.'],
      art:['Join the arts workshop','I took my work home before anyone could grade it.']
    }[use];
    add('visit',ticket[0],'Take part in the service at '+site.name+'.','people',local||(l.age<4?'Opens at 4':site.condition<15?'Closed for repairs':'')||
      (site.treasury<sq.programme?'No programme funds available':''),0,()=>{
        site.treasury-=sq.programme;site.serviceTotal++;site.reputation=percent(site.reputation+1);credit(site,l,1);
        if(use==='learning'){put('smarts',4);l.world.grade=percent(l.world.grade+2);}
        if(use==='art'){put('smarts',2);put('joy',3);}
        if(use==='relief'){put('health',2);put('joy',2);}
        if(use==='health'){
          put('health',3);const condition=l.sim.illnesses.slice().sort((a,b)=>b.severity-a.severity)[0];if(condition&&site.staff.length){condition.severity=Math.max(1,condition.severity-3);condition.treated=true;}
        }
        if(use==='gathering'){put('joy',4);put('bonds',2);}
        return ticket[1];});
    add('volunteer','Volunteer for a shift','Help with services and earn a record of service with the trustees.','heart',local||(l.age<12?'Opens at 12':''),0,()=>{
      const helped=Math.max(1,Math.min(8,site.level*2));site.serviceTotal+=helped;site.condition=percent(site.condition+2);site.reputation=percent(site.reputation+2);
      credit(site,l,2);put('bonds',3);l.hidden.karma=percent(l.hidden.karma+2);
      const p=activeNPCs(l,l.town).find(p=>p.bond<95);if(p)p.bond=percent(p.bond+2);
      return 'I worked a shift at '+site.name+'. We helped '+helped+' neighbors.';});
    add('give','Make a personal donation','Move '+money(sq.gift)+' from your balance into this institution’s treasury.','coin',
      l.age<12?'Opens at 12':l.cash<sq.gift?'Insufficient personal funds':'',sq.gift,()=>{
        l.cash-=sq.gift;site.treasury+=sq.gift;credit(site,l,1);site.reputation=percent(site.reputation+1);
        return 'I gave '+money(sq.gift)+' to '+site.name+'. The treasurer kept the receipt.';});
    const capitalGift=sq.build;
    add('endow','Endow a building fund','Move '+money(capitalGift)+' of personal savings to the institutional treasury.','home',
      adult||(l.cash<capitalGift?'Insufficient personal funds':''),capitalGift,()=>{
        l.cash-=capitalGift;site.treasury+=capitalGift;site.reputation=percent(site.reputation+3);credit(site,l,2);
        return 'I endowed the building fund with '+money(capitalGift)+'. The trustees recorded the gift.';});
    const grant=sq.wage*2,organization=l.sim.faithWorld?.movements?.[ownerId(l,site.faithId)];
    if(organization?.leaderId===l.id)add('grant','Award a movement grant','Transfer '+money(grant)+' from '+organization.name+' to the institution.','wallet',
      adult||(organization.treasury<grant?'Insufficient movement funds':''),grant,()=>{
        organization.treasury-=grant;site.treasury+=grant;return 'The movement transferred '+money(grant)+' to '+site.name+'.';});
    add('raise','Organize a neighborhood fundraiser','Support depends on reputation, local prices, and past service.','people',local||(l.age<14?'Opens at 14':''),0,()=>{
      const donors=3+Math.floor(site.reputation/6)+Math.min(8,member?.service||0)+Model.hash(id+'/'+y+'/raise')%6;
      const raised=donors*Math.max(1,count(sq.gift*.26));site.treasury+=raised;site.reputation=percent(site.reputation+2);credit(site,l,2);put('bonds',2);
      return donors+' neighbors contributed '+money(raised)+'. The proceeds went to '+site.name+'.';});
    if(!manage)add('board','Stand for the stewardship','Requires four service points. Your record is '+(member?.service||0)+'.','flag',
      local||adult||((member?.service||0)<4?'More service is required':''),0,()=>{
        site.stewardId=l.id;site.stewardName=l.name;return 'The local board appointed me steward. The treasury still belongs to the institution.';});
    if(!manage)return rows;
    const paid=forecast(l,site),maxStaff=2+site.level;
    const busy=new Set(s.sites.flatMap(st=>st.staff.map(e=>e.personId).filter(Boolean)));
    const candidates=activeNPCs(l,site.town).filter(p=>!busy.has(p.id)&&p.id!==l.id&&Model.ageOf(l,p)>=18);
    const preferKin=candidates.slice().sort((a,b)=>b.bond-a.bond||String(a.id).localeCompare(String(b.id)))[0];
    const hires=[{id:'staff',p:null,name:'local resident'},...(preferKin?[{id:'staff-person',p:preferKin,name:preferKin.name}]:[])];
    for(const h of hires){
      const role=kinds[site.kind].role,fee=sq.gift;
      add(h.id,'Hire '+(h.p?h.name:'a '+role.toLowerCase()),'Treasury pays '+money(fee)+' to recruit, then up to '+money(sq.wage)+' per year.','bag',
        admin||(site.staff.length>=maxStaff?'All staff positions filled':'')||spend(fee+sq.wage),fee,()=>{
          site.treasury-=fee;site.staff.push({id:id+'-employee-'+(++site.nextHire),personId:h.p?.id||null,name:h.p?.fullName||'Local '+role.toLowerCase(),role});if(h.p)h.p.communityEmployer=site.name;
          return 'I filled the '+role.toLowerCase()+' post. Payroll starts next birthday.';});
    }
    if(site.staff.length)add('release-staff','Leave one position vacant','Release the most recent hire and reduce the annual wage bill.','exit',admin,0,()=>{
      const departed=site.staff.pop(),p=Object.values(l.people).find(n=>n.id===departed.personId);if(p)delete p.communityEmployer;return departed.name+' left the roster. The board kept the position vacant.';});
    const repair=Math.max(sq.gift,count(sq.materials*(100-site.condition)/14));
    add('repair','Restore the building','Pay '+money(repair)+' from the treasury to restore full condition.','tools',admin||(site.condition===100?'Already in full condition':'')||spend(repair),repair,()=>{
      site.treasury-=repair;site.condition=100;site.propertyValue=site.landValue+site.construction;return 'The repairs passed inspection. The doors open properly now.';});
    const build=count(sq.build*kinds[site.kind].size*(.32+.08*site.level));
    add('extend','Expand the institution','Pay '+money(build)+' from the treasury for more service capacity and another staff position.','home',
      admin||(site.level>=5?'All five expansions are in place':'')||spend(build),build,()=>{
        site.treasury-=build;site.construction+=build;site.propertyValue+=build;site.level++;site.condition=percent(site.condition+5);
        return 'The new wing opened. '+site.name+' is now level '+site.level+'.';});
    for(const [key,name] of [['balanced','Balanced budget'],['preservation','Prioritize preservation'],['outreach','Prioritize public services']]){
      add('budget-'+key,name,'Operating forecast · upkeep '+money(paid.maintenance)+' · wages '+money(paid.wageBill)+' per year.','wallet',
        admin||(site.priority===key?'Current budget':''),0,()=>{site.priority=key;return 'The trustees adopted the '+name.toLowerCase()+' policy.';},false);
    }
    return rows;
  }
  function actions(l,area='institutions'){
    return options(l,area).map(({run,key,once,...r})=>r);
  }
  function perform(l,area,id,api={}){
    if(!l.sim.faithWorld?.institutions||typeof area!=='string'||typeof id!=='string')return null;
    const row=options(l,area).find(r=>r.id===id);if(!row||row.reason)return null;
    const worth=api.world?.netWorth(l);
    const before={cash:l.cash,...l.stats,...l.hidden},text=row.run(),after={cash:l.cash,...l.stats,...l.hidden},delta={};
    if(id.startsWith('deed/')&&Number.isFinite(worth))delta.netWorth=api.world.netWorth(l)-worth;
    for(const k of Object.keys(before))if(after[k]!==before[k])delta[k]=after[k]-before[k];
    if(row.once)l.used.push(row.key);l.turns++;
    if(api.log)api.log(l,'Community',row.title,text,delta);else l.log.push({age:l.age,kind:'Community',title:row.title,body:text,delta});
    return {title:row.title,text,delta,accent:'Community'};
  }
  function inherit(parent,child){
    const src=parent.sim.faithWorld?.institutions;
    if(!src)return initialize(child);
    const w=child.sim.faithWorld||(child.sim.faithWorld={});
    if(!w.institutions||w.institutions===src)w.institutions=JSON.parse(JSON.stringify(src));
    const dest=w.institutions;dest.funding='personal';dest.fundingOwner=child.id;
    for(const site of dest.sites){
      if(site.stewardId===parent.id)nominateSuccessor(child,site,parent.id);
      site.staff=site.staff.filter(p=>p.personId!==child.id&&p.personId!==parent.id);
    }
    return initialize(child);
  }
  const safe=n=>Number.isSafeInteger(n)&&n>=0;
  function validate(l){
    const v=l.sim.faithWorld?.institutions;if(!v)return true;
    const bad=()=>{throw Error('Invalid community institution records.');};
    if(!Array.isArray(v.sites)||!Array.isArray(v.lots)||!Array.isArray(v.seededTowns)||!safe(v.sequence)||!safe(v.lastYear)||v.lastYear>year(l)||!['movement','personal'].includes(v.funding))bad();
    const ids=new Set(),staff=new Set(),sites=new Set(),plots=new Set(),deeds=new Set();
    for(const t of v.seededTowns)if(!Geo.cities[t])bad();
    for(const entry of [...v.lots,...v.sites]){
      if(!entry||typeof entry.id!=='string'||ids.has(entry.id)||typeof entry.faithId!=='string'||!Geo.cities[entry.town]||!safe(entry.landValue))bad();
      const d=entry.deed;
      if(d&&(typeof d.assetId!=='string'||typeof d.title!=='string'||typeof d.donorId!=='string'||d.town!==entry.town||!Geo.cities[d.acquiredTown]||
        !safe(d.acquiredYear)||!safe(d.year)||d.acquiredYear>d.year||d.year>year(l)||d.value!==entry.landValue||l.world.owned[d.assetId]||
        (d.built!==null&&(!safe(d.built)||d.built>d.year))))bad();
      if(d){if(deeds.has(d.assetId))bad();deeds.add(d.assetId);}
      ids.add(entry.id);
    }
    for(const plot of v.lots){const key=plot.town+'/'+plot.faithId;if(plots.has(key)||!safe(plot.year)||plot.year>year(l))bad();plots.add(key);}
    for(const site of v.sites){
      const key=site.town+'/'+site.faithId+'/'+site.kind+(site.seeded?'/existing':'/chartered');
      if(!Object.hasOwn(kinds,site.kind)||sites.has(key)||typeof site.name!=='string'||!site.name.length||site.name.length>180||!safe(site.founded)||site.founded>year(l)||
          !safe(site.condition)||site.condition>100||!safe(site.reputation)||site.reputation>100||!Number.isInteger(site.level)||site.level<1||site.level>5||
          !safe(site.treasury)||!safe(site.propertyValue)||!safe(site.construction)||!safe(site.serviceTotal)||!safe(site.lastYear)||!safe(site.nextHire)||!safe(site.unpaidYears)||
          !['balanced','preservation','outreach'].includes(site.priority)||!Array.isArray(site.staff)||site.staff.length>2+site.level||!Array.isArray(site.board)||site.board.length>12)bad();
      sites.add(key);
      for(const p of site.staff){if(!p||typeof p.name!=='string'||typeof p.role!=='string'||p.personId&&(typeof p.personId!=='string'||staff.has(p.personId)))bad();if(p.personId)staff.add(p.personId);}
      for(const b of site.board)if(!b||typeof b.id!=='string'||!safe(b.service)||b.service>100)bad();
      const r=site.lastAccounts;if(r){
        for(const k of ['year','opening','contributions','maintenance','upkeep','conservation','wageBill','paid','programmes','served','closing'])if(!safe(r[k]))bad();
        if(r.opening+r.contributions-r.upkeep-r.conservation-r.paid-r.programmes!==r.closing)bad();
      }
    }
    return true;
  }
  root.PocketFaithInstitutions={actions,perform,summary,records,forecast,initialize,annual,inherit,validate,kinds,prices};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
