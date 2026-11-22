/* Family collections belong to the dynasty. The personal estate and its debts remain separate. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const M=node?require('./model.js').PocketModel:root.PocketModel;
  const G=node?require('./geography.js').PocketGeography:root.PocketGeography;
  const education=node?require('./education.js').PocketEducation:root.PocketEducation;
  const occupations=node?require('./occupations.js').PocketOccupations:root.PocketOccupations;
  const year=l=>l.born+l.age;
  function faith(){return node?require('./faith-legacy.js').PocketFaithLegacy:root.PocketFaithLegacy;}
  const catalog=[
    [1200,1499,'Family seal','Family jewelry',210], [1200,1699,'Woven ceremonial sash','Historical clothing',145],
    [1200,1499,'Mail coif','Arms and armor',360], [1200,1699,'Hand-bound account book','Rare books',115],
    [1500,1699,'Painted family portrait','Paintings',480], [1500,1899,'Carved writing chest','Antique furniture',340],
    [1500,1699,'Hand-copied star chart','Family documents',160], [1700,1899,'Workshop sample case','Business memorabilia',230],
    [1700,1899,'Enamel pocket watch','Family jewelry',310], [1700,1999,'Embroidered wedding coat','Historical clothing',180],
    [1900,1999,'Signed first edition','Rare books',320], [1900,2049,'Silver locket','Family jewelry',245],
    [1900,2049,'Factory opening photograph','Business memorabilia',150], [2000,2049,'Original exhibition print','Paintings',425],
    [2000,2049,'Handmade studio chair','Furniture',350], [2050,Infinity,'First-orbit mission patch','Historical clothing',330],
    [2050,Infinity,'Light-field family portrait','Paintings',460], [2050,Infinity,'Seed vault edition','Family documents',220],
    [1200,1699,'Hand-carved family pendant','Family jewelry',190], [1200,1899,'Painted storage vessel','Decorative arts',135]
  ];
  function location(town,at){
    const world=node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;
    return world?.place(town,at)?.label||G.cities[town]?.name||town;
  }
  function money(l,n){
    const economy=node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
    return economy?.money(l,n)||M.cash(n);
  }
  function initialize(l){if(l.sim.dynasty)validate(l);return l.sim.dynasty;}
  function ensure(l){
    if(!l.sim.dynasty)l.sim.dynasty={line:l.id,curators:[{id:l.id,name:l.name,year:l.born}],collection:[]};
    return l.sim.dynasty;
  }
  function offers(l){
    const y=year(l);
    const world=node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;
    const region=world.region(l.town);
    return catalog.flatMap(([start,end,title,category,base],index)=>{
      if(y<start||y>end)return [];
      if(title==='Mail coif'&&!['europe','westAsia','centralAsia'].includes(region))return [];
      if((title==='Family seal'||title==='Hand-bound account book')&&['oceania','americas'].includes(region))return [];
      const units=y<1500?.4:y<1700?.55:y<1900?.73:y<2000?.9:y<2050?1:1.22;
      const cost=Math.round(base*units*(.92+(M.hash(l.town+title)%19)/100));
      return [{id:'catalog-'+index,title,category,cost}];
    });
  }
  function condition(l,item){return Math.max(20,item.condition-Math.floor(Math.max(0,year(l)-item.cared)/6));}
  function estimatedValue(l,item){
    return Math.round(item.base*(1+Math.min(600,Math.max(0,year(l)-(item.valuationYear??item.year)))*.004)*condition(l,item)/100);
  }
  function items(l){
    const d=l.sim.dynasty;
    return (d?.collection||[]).map(item=>({...item,condition:condition(l,item),value:estimatedValue(l,item),
      origin:location(item.town,item.year),owners:d.curators.slice(item.first).map((p,i)=>({...p,year:i?p.year:(item.ownedSince??item.accession)}))}));
  }
  function propertyName(id,a){
    const q=a.listing||{};
    if(q.category==='Vehicle'&&q.model)return [q.modelYear,q.model].filter(Boolean).join(' ');
    if(q.name)return [q.name,q.address].filter(Boolean).join(' · ');
    return id.replace(/-/g,' ');
  }
  function evidence(l){
    const keeps=(l.keepsakes||[]).map(k=>({ref:'award/'+l.id+'/'+k.age+'/'+k.title,title:k.title,category:'Family achievements',year:l.born+k.age,base:0}));
    const holdings=Object.entries(l.world.owned).map(([id,a])=>{
      const q=a.listing||{},vehicle=q.category==='Vehicle'||Number.isFinite(a.odometer);
      return {ref:'property/'+id+'/'+(q.listedYear||q.built||l.born),title:(vehicle?'Registration for ':'Ownership record for ')+propertyName(id,a),
        category:vehicle?'Vehicle records':'Property records',year:a.acquiredYear??q.listedYear??(l.born+(a.at||0)),town:q.town||a.town||l.town,base:0};
    });
    const firms=Object.values(l.sim.expansion?.companies||{}).map(c=>({ref:'company/'+c.id,title:'Company papers · '+c.name,
      category:'Business memorabilia',year:c.originYear||l.born+(c.started||0),town:c.town||l.town,base:0}));
    return keeps.concat(holdings,firms,faith().exhibits(l));
  }
  function commands(l){
    const y=year(l),d=l.sim.dynasty,collection=d?.collection||[],list=[];
    for(const offer of offers(l)){
      const ref=l.id+'/'+offer.id;
      if(collection.some(item=>item.ref===ref))continue;
      list.push({id:offer.id,title:'Acquire '+offer.title.toLowerCase(),description:offer.category+' · '+money(l,offer.cost)+' for the family collection.',cost:offer.cost,age:18,
        add:{ref,title:offer.title,category:offer.category,year:y,base:offer.cost}});
    }
    for(const e of evidence(l)){
      if(collection.some(item=>item.ref===e.ref))continue;
      list.push({id:'record/'+e.ref,title:'Preserve '+e.title,description:'File a permanent record dated '+e.year+'.',cost:0,age:5,add:e});
    }
    for(const [id,a] of Object.entries(l.world.owned)){
      const q=a.listing||{},made=q.modelYear??q.built??q.listedYear;
      const vehicle=q.category==='Vehicle'||Number.isFinite(a.odometer);
      const property=q.category==='Property'||Number.isInteger(q.beds);
      const eligible=property?y-made>=75:vehicle?y-made>=25:q.historical&&y-made>=15;
      if(!eligible)continue;
      const title=propertyName(id,a),ownedSince=a.acquiredYear??(l.born+(a.at||0)),cond=M.clamp(a.condition||90,20,100);
      list.push({id:'donate/'+id,title:'Donate '+title,description:'Move the actual '+(property?'property':vehicle?'vehicle':'object')+
        ' permanently from your estate to the family collection. It will pass to future curators.',age:18,cost:0,donate:id,
        restriction:(l.sim.loans[id]?.balance||0)>0?'Pay off the outstanding loan first':(a.share??1)<1?'Only the sole owner can donate':a.tenant?'An active tenant occupies the property':'',
        add:{ref:'donation/'+id,title,category:property?'Historic properties':vehicle?'Vintage vehicles':'Historical equipment',
          year:ownedSince,town:q.town||a.acquiredTown||a.town||l.town,ownedSince,valuationYear:y,condition:cond,
          base:Math.round(a.value*100/cond),createdYear:made}});
    }
    for(const item of collection){
      const wear=100-condition(l,item);
      if(wear<5||!item.base)continue;
      const cost=Math.max(1,Math.ceil(item.base*wear/160));
      list.push({id:'restore/'+item.id,title:'Conserve '+item.title,description:'Restore its condition to 100% for '+money(l,cost)+'.',cost,age:18,restore:item.id});
    }
    return list;
  }
  function reason(l,cmd){
    if(l.ended)return 'Life complete';
    if((l.event?.id&&!l.event.resolved)||l.sim.review||l.sim.court)return 'Finish the current decision';
    if(l.sim.prison)return 'In custody';
    if(l.age<cmd.age)return 'Available at age '+cmd.age;
    if(cmd.restriction)return cmd.restriction;
    return l.cash<cmd.cost?'Need '+money(l,cmd.cost):'';
  }
  function actions(l){return commands(l).map(c=>({id:c.id,title:c.title,description:c.description,disabled:reason(l,c)}));}
  function perform(l,id,context={}){
    const c=commands(l).find(o=>o.id===id);
    if(!c||reason(l,c)||context.blocking?.(l))return null;
    const y=year(l),d=ensure(l);
    l.cash-=c.cost;
    let text,donatedValue=0;
    if(c.restore){
      const item=d.collection.find(e=>e.id===c.restore);item.condition=100;item.cared=y;
      text='The conservator returned '+item.title+'. The invoice was considerably newer.';
    }else{
      const e=c.add;
      let first=d.curators.length-1;
      if(c.donate){
        donatedValue=l.world.owned[c.donate].value;delete l.world.owned[c.donate];delete l.sim.loans[c.donate];
        while(first>0&&d.curators[first].year>e.ownedSince)first--;
      }
      d.collection.push({id:'exhibit-'+(d.collection.length+1),ref:e.ref,title:e.title,category:e.category,year:e.year,town:e.town||l.town,
        accession:y,first,base:e.base,condition:e.condition||100,cared:y,...(c.donate?{ownedSince:e.ownedSince,createdYear:e.createdYear,valuationYear:y}:{}),
        source:c.donate?'Donated from the private estate':c.cost?'Acquired for the family collection':'Filed in the family archive'});
      text=e.title+' entered the family collection. The label is in my handwriting.';
    }
    const delta=c.cost?{cash:-c.cost}:donatedValue?{netWorth:-donatedValue}:{};
    if(context.log)context.log(l,'Museum',c.title,text,delta);
    else (l._yearEntries||l.log).push({age:l.age,kind:'Museum',title:c.title,body:text,delta});
    return {title:c.title,text,delta};
  }
  function inherit(parent,child,part,key){
    const d=parent.sim.dynasty||{line:parent.id,curators:[{id:parent.id,name:parent.name,year:parent.born}],collection:[]};
    child.sim.dynasty={line:d.line,curators:[...d.curators.map(p=>({...p})),{id:child.id,name:child.name,year:year(child)}],collection:d.collection.map(i=>({...i}))};
    const person=parent.people[key],firm=person?.enterprise,deed=person?.homeDeed;
    if(firm?.type&&firm.capital>0){
      const x=child.sim.expansion,id='firm-'+(++x.sequence);
      x.companies[id]={id,type:firm.type,name:firm.name,originYear:firm.founded,town:firm.town,founder:firm.founder,capital:firm.capital,
        historical:firm.type.startsWith('era-'),level:1,staff:0,clients:0,manager:false,share:1};
    }
    if(deed&&!child.world.owned[deed.id]){
      child.world.owned[deed.id]={...deed,listing:{...deed.listing},at:child.age,inherited:false};
    }
    for(const [id,a] of Object.entries(child.world.owned)){
      const inherited=parent.world.owned[id];
      if(!inherited)continue;
      a.acquiredYear=inherited.acquiredYear??(parent.born+(inherited.at||0));a.acquiredTown=inherited.acquiredTown||inherited.listing?.town||inherited.town||parent.town;
    }
  }
  function annual(l,context={}){
    const y=year(l);
    for(const [id,a] of Object.entries(l.world.owned)){
      if(!Number.isInteger(a.acquiredYear))a.acquiredYear=l.born+(a.at||0);
      const q=a.listing, built=q?.built||q?.listedYear||a.acquiredYear;
      if(l.ended||!(q?.category==='Property'||Number.isInteger(q?.beds))||y-built<80||a.condition>20||a.manager||a.lastSurvey===y)continue;
      a.lastSurvey=y;
      if(M.hash(id+'/structural failure/'+y)%30)continue;
      delete l.world.owned[id];
      if(context.log)context.log(l,'Assets','An estate was condemned',propertyName(id,a)+' became unsafe. I lost my share of the property.'+
        (l.sim.loans[id]?.balance?' The outstanding debt is still due.':''),{});
    }
  }
  const isArchive=r=>r?.archiveRecord===1;
  function personalRecord(l){
    const studies=education.records(l).map(({title,year,honors})=>({title,year,honors}));
    const performed=Object.entries(l.sim.performanceStudio?.tracks||{}).filter(([,r])=>r.completed>0)
      .map(([id,r])=>({id,seasons:r.completed,audience:r.following}));
    const employment=occupations.entries[l.job];
    return {
      ...(studies.length?{studies}:{}),...(performed.length?{performed}:{}),
      ...(employment?{lastSpecialistRole:occupations.rank(l,l.job)+' · '+employment.title}:{})
    };
  }
  function record(l,world,jobs){
    if(isArchive(l))return l;
    const s=l.sim,job=s.peak?.title||l.job,career=jobs?.[job]?.[0]||job||'No recorded occupation';
    const assets=Object.entries(l.world.owned).map(([id,a])=>propertyName(id,a));
    const businesses=Object.values(s.expansion?.companies||{}).map(c=>c.name);
    const exhibits=(s.dynasty?.collection||[]).filter(e=>s.dynasty.curators[e.first]?.id===l.id).map(e=>e.title);
    const log=l.log.map(e=>{const row={...e};if(row.delta&&!Object.keys(row.delta).length)delete row.delta;return row;});
    const faithLegacy=faith().archive(l);
    return {archiveRecord:1,...personalRecord(l),...(faithLegacy?{faithLegacy}:{}),historicalRules:!!s.timeline?.historicalRules,line:s.dynasty?.line||l.id,id:l.id,name:l.name,born:l.born,age:l.age,ended:!!l.ended,town:l.town,
      career,wealth:world?.netWorth?world.netWorth(l):l.cash,cause:s.cause||'',achievements:[...new Set([...(l.keepsakes||[]).map(k=>k.title),...(s.expansion?.awards||[])])],
      relationships:Object.values(l.people).filter(p=>p.met&&(M.isFamily(p)||['Spouse','Partner','Engaged partner','Friend','Childhood friend'].includes(p.role)))
        .filter(p=>p.role!=='Relative'||p.bond>=75).map(p=>p.role+' · '+p.fullName),
      possessions:[...new Set([...assets,...businesses,...exhibits])],events:(s.chronicleWorld?.events||[]).filter(e=>e.witness?e.witness===l.id:e.year>=l.born&&e.year<=year(l)).map(e=>e.year+' · '+e.title),log};
  }
  function familyArchive(game,world,jobs){
    const l=game.active,line=l.sim.dynasty?.line||l.id,ancestors=new Set((l.sim.ancestors||[]).map(a=>a.name+'/'+a.born));
    return game.archive.filter(r=>(r.line||r.sim?.dynasty?.line||r.id)===line||ancestors.has(r.name+'/'+r.born)).map(r=>record(r,world,jobs));
  }
  function validateArchive(r){
    if(!isArchive(r)||!Number.isInteger(r.age)||r.age<0||r.age>150||!Number.isSafeInteger(r.born)||!G.cities[r.town]||
      typeof r.name!=='string'||typeof r.id!=='string'||typeof r.line!=='string'||typeof r.career!=='string'||!Number.isFinite(r.wealth)||
      !Array.isArray(r.log)||r.log.some(e=>!e||!Number.isInteger(e.age)||typeof e.title!=='string'||typeof e.body!=='string')||
      ['achievements','relationships','possessions','events'].some(k=>!Array.isArray(r[k])||r[k].some(v=>typeof v!=='string')))throw Error('Invalid family archive.');
    const title=v=>typeof v==='string'&&v.length>0&&v.length<=160;
    if(r.studies!==undefined&&(!Array.isArray(r.studies)||r.studies.length>128||r.studies.some(s=>!s||!title(s.title)||typeof s.honors!=='boolean'||
      !(s.year===null||Number.isSafeInteger(s.year)&&s.year>=r.born&&s.year<=r.born+r.age))))throw Error('Invalid archived qualification.');
    if(r.performed!==undefined&&(!Array.isArray(r.performed)||r.performed.length>3||r.performed.some(s=>!s||!['acting','music','sport'].includes(s.id)||
      !Number.isSafeInteger(s.seasons)||s.seasons<1||s.seasons>r.age||!Number.isSafeInteger(s.audience)||s.audience<0||s.audience>1000000)||
      new Set(r.performed.map(s=>s.id)).size!==r.performed.length))throw Error('Invalid archived performance record.');
    if(r.lastSpecialistRole!==undefined&&!title(r.lastSpecialistRole))throw Error('Invalid archived occupation.');
    faith().validateArchive(r.faithLegacy);return r;
  }
  function validate(l){
    const d=l.sim.dynasty;if(!d)return;
    if(typeof d.line!=='string'||!Array.isArray(d.curators)||!d.curators.length||!Array.isArray(d.collection)||
      d.curators.some((p,i)=>!p||typeof p.id!=='string'||typeof p.name!=='string'||!Number.isSafeInteger(p.year)||(i&&p.year<d.curators[i-1].year))||
      d.collection.some(e=>!e||typeof e.id!=='string'||typeof e.title!=='string'||typeof e.ref!=='string'||!G.cities[e.town]||typeof e.category!=='string'||
        !Number.isInteger(e.year)||!Number.isInteger(e.cared)||!Number.isInteger(e.first)||e.first<0||e.first>=d.curators.length||!Number.isFinite(e.base)||e.base<0||
        !Number.isInteger(e.condition)||e.condition<0||e.condition>100)||new Set(d.collection.map(e=>e.id)).size!==d.collection.length)throw Error('Invalid family collection.');
  }
  root.PocketHistoryDynasty={initialize,items,offers,estimatedValue,actions,perform,annual,inherit,archive:record,record,personalRecord,isArchive,validateArchive,validate,
    journal:r=>r.log||[],familyArchive};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
