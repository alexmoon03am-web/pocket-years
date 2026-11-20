/* Offline regional economy. Rates and permits are game rules, in a single currency. */
(function(root){
  'use strict';
  const M=typeof module!=='undefined'&&module.exports?require('./model.js').PocketModel:root.PocketModel;
  const G=typeof module!=='undefined'&&module.exports?require('./geography.js').PocketGeography:root.PocketGeography;
  const H=typeof module!=='undefined'&&module.exports?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  const Future=typeof module!=='undefined'&&module.exports?require('./future-epochs.js').PocketFuture:root.PocketFuture;
  const groups=[
    ['US CA AU NZ DE GB FR NL BE AT SE DK NO FI IE CH IS LU JP KR SG HK MO QA AE IL',1.12,1.10],
    ['ES PT IT SI CZ EE MT CY SA BH KW OM TW PL SK LT LV GR',.90,.91],
    ['BR MX AR CL UY CR PA MY CN TR RO BG HR ZA HU TH KZ CO RS',.72,.75],
    ['IN ID PH VN MA EG NG KE PK BD LK PE EC GH TZ UG NP ET KH',.58,.62]
  ];
  const metros={'New York City':[1.45,2.15],'Tokyo':[1.18,1.38],'London':[1.26,1.85],'Singapore':[1.35,1.95],'San Francisco':[1.51,2.20],'Mumbai':[1.24,1.54],'Paris':[1.20,1.62],'Toronto':[1.14,1.45],'Osaka':[1.06,1.18]};
  const sectors=['Services','Industry','Technology','Care','Creative','Commerce'];
  const keyOf=(l,town)=>G.countries[G.cities[town||l.town].code].group;
  const bound=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  function sample(seed,label){let n=M.hash(seed+'/'+label);n=Math.imul(n^(n>>>16),0x85ebca6b);return ((n^(n>>>13))>>>0)/4294967296;}
  const cache=new Map(),priceCache=new Map();
  function conditions(seed,code,year){
    const cycle=Math.sin((year+sample(seed,'global')*15)*.63)*.62+Math.sin((year+sample(seed,code)*19)*.87)*.38;
    return {cycle,inflation:bound(.020+cycle*.015+(sample(code,year)-.5)*.012,.002,.055)};
  }
  function costIndex(seed,code,year){
    const key=seed+'/'+code+'/'+year;if(priceCache.has(key))return priceCache.get(key);
    let index;
    if(year<=2050){
      const start=Math.max(1990,Math.min(2005,year)),end=Math.max(2005,year);
      index=1;
      for(let y=start;y<end;y++)index*=1+conditions(seed,code,y).inflation;
      if(year<2005)index=Math.max(.7,1/index);
    }else{
      // Long dynasties keep accounts in a common purchasing-power unit. Future
      // price levels compound in that unit at a gradually damped local rate.
      const years=year-2050,start=costIndex(seed,code,2050);
      const drift=.017+sample(code,'long-run prices')*.006;
      const path=y=>.009*Math.sin(y*.31+sample(seed,code)*8)+.005*Math.sin(y*.73+sample(code,'cycle')*7);
      index=start*(1+.70*Math.log1p(years*drift/.70))*Math.exp(path(year)-path(2050));
    }
    if(priceCache.size>6000)priceCache.clear();priceCache.set(key,index);return index;
  }
  function local(l,town=l.town,age=l.age){
    const year=l.born+age,city=G.cities[town],code=city.code,x=l.sim.expansion;
    const seed=x?x.seed:l.id,cacheKey=[seed,town,year,H.enabled(l)?'historical':'standard'].join('/');
    if(cache.has(cacheKey))return cache.get(cacheKey);
    const group=groups.find(g=>g[0].split(' ').includes(code)),national=sample(code,'wages');
    const wages=(group?group[1]:.72)+national*.16,expenses=(group?group[2]:.77)+sample(code,'living')*.15;
    const metro=metros[city.name]||[city.legacy?.93:1.03+sample(town,'jobs')*.20,city.legacy?.81:.91+sample(town,'housing')*.48];
    const {cycle,inflation:nearInflation}=conditions(seed,code,year);
    const phase=cycle<-.42?'Recession':cycle>.45?'Boom':'Steady';
    const block=Math.floor(year/4),sector=sectors[Math.floor(sample(seed,code+'/'+block)*sectors.length)];
    const development=sample(seed,town+'/'+block),project=development>.70?'Rail extension':development<.26?'Factory closure':'Local investment';
    const change=project==='Rail extension'?.045:project==='Factory closure'?-.055:.012;
    const index=costIndex(seed,code,year),decline=sectors[(sectors.indexOf(sector)+2+Math.floor(sample(code,block)*3))%sectors.length];
    const profile={code,year,phase,sector,decline,project,cycle,development,baseYear:block*4,
      pay:wages*metro[0]*(1+cycle*.12+change)*index,cost:expenses*metro[1]*(1+cycle*.07+change)*index,
      home:expenses*Math.pow(metro[1],1.23)*(1+cycle*.23+change)*index,
      vehicle:(.72+expenses*.31)*(1+cycle*.09)*index,
      tax:.71+sample(code,'tax')*.60+(sample(town,'localTax')-.5)*.09,unemployment:bound(.065-cycle*.043-change*.24+(1-wages)*.035+(sample(town,'localJobs')-.5)*.011,.018,.18),
      rate:bound(.048+cycle*.017+(1-wages)*.019,.021,.11),yield:bound(.034+cycle*.031,.002,.083),
      priceIndex:index,inflation:year<2050?nearInflation:costIndex(seed,code,year+1)/index-1,appreciation:cycle*.061+nearInflation-.015+change*.29};
    if(H.enabled(l)){
      const chapter=Future.chapter(year);
      if(chapter){
        const field=Future.industries[chapter.id];
        profile.hiringName=field[sector];profile.decliningName=field[decline];
        profile.project=Future.projects[chapter.id][development>.70?0:development<.26?1:2];
      }
      const fx=H.marketEffects(l,town,year);
      profile.pay*=fx.pay;profile.cost*=fx.cost;profile.home*=fx.home;profile.vehicle*=fx.travel;
      profile.appreciation+=Math.max(-.05,Math.min(.05,(fx.home-1)*.18));
    }
    if(cache.size>1800)cache.clear();cache.set(cacheKey,profile);return profile;
  }
  function contractBase(l,job,jobs){
    const base=jobs[job]?.[1]||0;
    // Existing contracts retain their agreed salary when an older save is opened.
    if(!base||!l.sim.expansion||job===l.job&&l.world.contractRole!==job||job==='retired'||job.startsWith('faith-')||H.jobs[job])return base;
    const experience=l.world.roleYears?.[job]||0;
    let entry=1,step=0;
    if(['physician','lawyer','pharmacist'].includes(job)){entry=.50;step=.024;}
    else if(['director','executive'].includes(job)){entry=.76;step=.018;}
    else if(base>=65000){entry=.70;step=.021;}
    else if(base>=40000){entry=.77;step=.015;}
    return Math.round(base*Math.min(1,entry+step*experience));
  }
  function wageIndex(l,town=l.town,age=l.age){
    const market=local(l,town,age),seed=l.sim.expansion?.seed||l.id;
    return market.pay/costIndex(seed,G.cities[town].code,2016);
  }
  function existingWageIndex(l,age){
    const market=local(l,l.town,age),y=l.born+age;
    if(y<=2050)return market.pay;
    const seed=l.sim.expansion.seed||l.id,code=G.cities[l.town].code,end=Math.min(2120,y);
    const key='v1-wages/'+seed+'/'+code+'/'+end;
    if(!priceCache.has(key)){
      let index=costIndex(seed,code,2050);
      for(let t=2050;t<end&&index<6;t++)index*=1+conditions(seed,code,t).inflation;
      priceCache.set(key,Math.min(6,index));
    }
    return market.pay/market.priceIndex*priceCache.get(key);
  }
  function salary(l,job,jobs,age=l.age){
    if(!job||!jobs[job])return 0;
    if(job.startsWith('faith-')){
      const faith=typeof module!=='undefined'&&module.exports?require('./faith-personal.js').PocketFaithPersonal:root.PocketFaithPersonal;
      return faith.wage(l,job,age);
    }
    if(H.jobs[job])return H.wage(l,job,age);
    const base=contractBase(l,job,jobs)+(job===l.job?l.extraPay:0);
    if(!l.sim.expansion||job==='retired')return base;
    // Job-table salaries are quoted in 2016 units. Apply local changes from that
    // reference date; a worker carrying an older contract keeps its original basis.
    const established=job===l.job&&l.world.contractRole!==job;
    const factor=established?existingWageIndex(l,age):wageIndex(l,l.town,age);
    return H.contractPay(l,job,base*factor);
  }
  function nationality(l){return l.sim.expansion?l.sim.expansion.passports:[keyOf(l,l.sim.birthplace||l.town)];}
  function papers(l,town){
    const country=keyOf(l,town),home=keyOf(l),x=l.sim.expansion;
    const permits=x?x.permits:{},permit=permits[country];
    const citizen=nationality(l).includes(country),permanent=permit&&permit.kind==='Resident';
    const valid=!!(permit&&(permanent||permit.until>=l.born+l.age));
    const past=(l.sim.offenses||[]).filter(o=>o.verdict==='Convicted'),last=past.reduce((n,o)=>Math.max(n,o.age??0),-99);
    const reserve=Math.round(local(l,town).cost*1400/100)*100;
    const employed=!!l.job&&!['retired','student'].includes(l.job)||!!(x&&Object.keys(x.companies).length);
    const qualified=employed||!!l.sim.degree||!!l.world.credential||l.cash>=reserve*4;
    const restriction=past.length&&l.age-last<3?'Three years since the last conviction required':!qualified?'Job, qualification or settlement savings required':l.cash<reserve+1800?'Keep '+H.money(l,reserve)+' after the moving fee':'';
    return {country,citizen,valid,permanent,permit,reserve,home:home===country,eligible:!restriction,reason:restriction};
  }
  root.PocketEconomy={local,priceIndex:costIndex,wageIndex,salary,contractBase,sample,keyOf,papers,nationality,sectors};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
