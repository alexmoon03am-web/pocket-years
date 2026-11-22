/* Serializable facts, deterministic migration, and read-only projections shared by every client. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  function economy(){return node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;}
  function historical(l){return !!l.sim?.timeline?.historicalRules&&l.born+l.age<2000;}
  const hiddenKeys=['karma','craziness','discipline','willpower','fertility','notoriety','addictionRisk'];
  const traits=['punctual','generous','blunt','competitive','nosy','patient','frugal','easygoing'];
  const surnames=['Shaw','Brooks','Reed','Park','Lane','Finch','Silva','Bell','Patel','Stone','Vale','Wells'];
  const adultJobs=['Postal worker','Office clerk','Nurse','Mechanic','Teacher','Shopkeeper','Cook','Bus driver'];
  const cash=n=>(n<0?'−$':'$')+Math.abs(n).toLocaleString('en-US');
  const clamp=(n,a=0,b=100)=>Math.min(b,Math.max(a,n));
  function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.codePointAt(0),16777619);return h>>>0;}
  function tag(l,id){if(id&&!l.sim.lifeTags.includes(id))l.sim.lifeTags.push(id);}
  function ageOf(l,p){
    const at=Number.isInteger(p.diedAt)?p.diedAt:l.age;
    return Math.max(0,Number.isInteger(p.bornAt)?at-p.bornAt:l.born+at-p.bornYear);
  }
  function isAlive(p){return !Number.isInteger(p.diedAt);}
  function isFamily(p){return ['Mother','Father','Parent','Guardian','Sibling','Child','Grandparent','Grandchild','Aunt','Uncle','Cousin','Niece','Nephew','Stepparent','Stepchild','Stepsibling','Parent-in-law','Sibling-in-law','Child-in-law','Relative'].includes(p.role);}
  function person(l,key,p){
    if(p.id&&p.fullName&&p.gender&&p.traits&&p.job&&Number.isInteger(p.bornYear)&&Number.isFinite(p.wealth)&&Number.isFinite(p.generosity)&&Number.isFinite(p.craziness))return p;
    const h=hash(l.id+'/'+key+'/'+p.name+'/'+(p.since||p.bornAt||0)),pick=(items,d)=>items[Math.floor(h/d)%items.length];
    if(!Number.isInteger(p.bornYear))p.bornYear=Number.isInteger(p.bornAt)?l.born+p.bornAt:l.born;
    if(!p.id)p.id='n-'+h.toString(36);
    if(!p.gender)p.gender=p.role==='Mother'?'woman':p.role==='Father'?'man':pick(['woman','man','nonbinary'],11);
    if(!p.fullName)p.fullName=p.name.includes(' ')?p.name:p.name+' '+(isFamily(p)?l.name.split(' ').slice(1).join(' ')||pick(surnames,7):pick(surnames,9));
    if(p.generosity===undefined)p.generosity=12+h%83;
    if(p.craziness===undefined)p.craziness=Math.floor(h/19)%100;
    const historicalJob=(historical(l)||economy().isFuture(l))&&ageOf(l,p)>=18?economy().npcJob(l,h,p.town||l.town):null;
    if(p.wealth===undefined)p.wealth=historicalJob?Math.round(historicalJob.annual*(.18+h%240/100)):ageOf(l,p)>=18?2000+Math.floor(h/37)%115000:0;
    if(!p.traits)p.traits=[pick(traits,17),pick(traits,283)].filter((x,i,a)=>a.indexOf(x)===i);
    if(!p.job)p.job=ageOf(l,p)>=65?'Retired':ageOf(l,p)>=18?(historicalJob?historicalJob.title:pick(adultJobs,43)):ageOf(l,p)>=5?'Student':'At home';
    return p;
  }
  // The reference belongs to a completed sentence; a later conviction invalidates it.
  function hasWorkReference(l){
    return l.sim.record>0 && l.sim.referenceFor===l.sim.record;
  }
  function people(l){for(const [k,p] of Object.entries(l.people))person(l,k,p);}
  function initialize(l){
    const s=l.sim,w=l.world;
    l.id=l.id||'p-'+hash(l.name+'/'+l.born+'/'+l.rng).toString(36);
    if(!l.hidden)l.hidden={};
    for(const k of hiddenKeys)if(!Number.isFinite(l.hidden[k]))l.hidden[k]=k==='notoriety'?Math.min(90,(s.record||0)*11):k==='karma'?50:20+hash(l.id+k)%61;
    if(!Array.isArray(s.illnesses))s.illnesses=s.condition?[{name:s.condition.name,severity:s.condition.serious?46:16,chronic:!!s.condition.serious,years:s.condition.years||0}]:[];
    delete s.condition;
    if(!s.injuries)s.injuries=[];
    if(!s.addictions)s.addictions=[];
    if(!s.offenses)s.offenses=Array.from({length:s.record||0},()=>({offense:'Prior conviction',age:null,verdict:'Convicted',fine:null,sentence:null}));
    if(!s.lifeTags)s.lifeTags=[];
    if(!s.activities)s.activities=l.flags.club?[l.flags.club]:[];
    if(!s.degrees)s.degrees=[s.degree,s.professional].filter(Boolean);
    if(!s.habits)s.habits={exercise:0,reading:0,nightlife:0};
    if(!s.fund)s.fund=0;
    if(!s.peak)s.peak={title:l.job&&!['student','retired'].includes(l.job)?l.job:null,salary:0};
    if(!Number.isInteger(s.workYears))s.workYears=Math.max(0,l.job&&!['student','retired'].includes(l.job)&&l.age>=18?l.age-Math.max(18,w.since):0);
    if(!l.eventQueue)l.eventQueue=[];
    if(s.review===undefined)s.review=null;
    if(!w.schoolHistory)w.schoolHistory=[];
    if(w.partSince===undefined){
      const previous=w.partJob&&l.log.slice().reverse().find(e=>e.title==='Started a part-time job'||e.age===16&&e.kind==='Choice'&&/caf[eé]/i.test(e.body));
      w.partSince=w.partJob?(previous?previous.age:l.age):null;
    }
    for(const a of Object.values(w.owned)){if(!Number.isFinite(a.condition))a.condition=88;if(!a.share)a.share=1;}
    people(l);
  }
  function school(l){
    if(l.sim.program?.pathway||!l.sim.program&&l.sim.transcript?.length){
      const catalog=node?require('./education.js').PocketEducation:root.PocketEducation;
      const place=catalog.school(l);if(place)return place;
      const qualification=catalog.attainment(l);if(qualification)return {level:qualification.title,name:null};
    }
    if(l.age>=3&&l.age<5&&!l.sim.dropped&&(!historical(l)||l.born+l.age>=1970))return {level:'Preschool',name:'Neighborhood preschool'};
    if(historical(l)){
      const year=l.born+l.age;
      if(year<1900){
        if(l.age<5)return {level:'Early childhood',name:null};
        if(l.age>=18||l.sim.dropped)return {level:l.world.credential||'Household education',name:null};
        if(l.age<11)return {level:'Household education',name:'Household lessons'};
        return {level:'Practical education',name:l.age<14?'Local lessons':'Trade instruction'};
      }
      if(l.age>=5&&l.age<18&&!l.sim.dropped)return {level:l.age<12?'Primary school':'Secondary school',name:l.age<12?'Local primary school':'Local secondary school'};
    }
    if(l.sim.program)return {level:'University',name:['law','medicine'].includes(l.sim.program.field)?'Graduate school':'City University'};
    if(l.age<5)return {level:'Early childhood',name:null};
    if(l.age>=18||l.sim.dropped)return {level:l.sim.professional||l.sim.degree||(!l.sim.dropped?'High school diploma':'Left school'),name:null};
    if(l.age<11)return {level:'Elementary school',name:'Maple Elementary'};
    if(l.age<14)return {level:'Middle school',name:'Eastside Middle'};
    return {level:'High school',name:'Central High'};
  }
  function stage(l){
    if(l.sim.prison)return 'prison';
    if(l.age<5)return 'infant';if(l.age<13)return 'child';if(l.age<18)return 'teen';
    if(l.sim.program)return 'college';if(l.age>=65||l.job==='retired')return 'elder';return l.job?'career':'adult';
  }
  function metrics(l,worth,budget){
    const out=Object.assign({},l.stats,l.hidden,{cash:l.cash,debt:Object.values(l.sim.loans).reduce((n,x)=>n+x.balance,0),trust:l.sim.trust,
      netWorth:worth(l),grade:l.world.grade,performance:l.world.performance,reputation:l.world.reputation,followers:l.sim.followers});
    const b=budget(l);Object.assign(out,{annualWages:b.wages,annualPension:b.pension,annualSide:b.side,fund:l.sim.fund});
    for(const p of Object.values(l.people))if(p.met)out['bond/'+p.id]=p.bond;
    return out;
  }
  function diff(before,after){
    const d={};for(const k of Object.keys(after))if(Number.isFinite(before[k])&&after[k]!==before[k])d[k]=after[k]-before[k];return d;
  }
  function npc(l,slot,p){
    const {name,role,bond,id,gender,fullName,generosity,craziness,wealth,job,traits,...facts}=p;
    return {id,fullName,relation:role,gender,age:ageOf(l,p),alive:isAlive(p),relationship:bond,generosity,craziness,wealth,job,traits,slot,givenName:name,facts};
  }
  function view(l,world,sim,jobs){
    const schoolInfo=school(l),s=l.sim,w=l.world,names=l.name.split(/\s+/),place=sim.geography.cities[l.town];
    const b=sim.budget(l),minor=l.age<18,shift=minor&&world.parts[w.partJob],job=l.job&&jobs[l.job];
    const periodShift=minor&&s.timeline?.youthShift;
    const employer=world.openings[l.job]?world.openings[l.job][0]:({clerk:'Corner Shop',trainee:'Town Workshop',parttime:'Community Center'}[l.job]||null);
    const historicalPlace=historical(l)?(node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld).place(l.town,l.born+l.age):null;
    return {id:l.id,firstName:names[0],lastName:names.slice(1).join(' '),gender:s.identity,country:historicalPlace?historicalPlace.country:sim.geography.stateCountry(l.town),city:historicalPlace?historicalPlace.city:place.name,age:l.age,alive:!l.ended,causeOfDeath:s.cause||null,
      bankBalance:l.cash,debt:sim.debt(l),monthlyExpenses:Math.round((b.living+b.housing+b.dependents+b.upkeep+b.payment+(b.insurance||0)+(b.management||0)+(b.lifestyle||0)+(b.operatingLoss||0))/12),netWorth:world.netWorth(l),
      stats:{happiness:l.stats.joy,health:l.stats.health,smarts:l.stats.smarts,looks:l.stats.looks},hiddenStats:{...l.hidden},
      educationLevel:schoolInfo.level,currentSchool:schoolInfo.name,major:s.program?.pathway?schoolInfo.level:s.program?s.program.field:s.degree,gpa:Math.round(w.grade*4)/100,schoolActivities:s.activities,
      jobTitle:s.program?.pathway?schoolInfo.level+' student':periodShift?economy().shiftName(l):shift?shift[0]:job?job[0]:null,employer:periodShift?'Local household':shift?world.partEmployers[w.partJob]:(s.expansion?.employer||employer),salary:b.wages,jobPerformance:w.performance,yearsAtJob:shift?Math.max(0,l.age-w.partSince):job&&!['student','retired'].includes(l.job)?Math.max(0,l.age-w.since):0,retired:l.job==='retired'||s.studyPension!==undefined,
      criminalRecord:s.offenses,inPrison:s.prison>0,prisonSentenceYears:s.prison,illnesses:s.illnesses,injuries:s.injuries,addictions:s.addictions,lifeTags:s.lifeTags,
      npcs:Object.entries(l.people).map(([k,p])=>npc(l,k,p))};
  }
  function encode(l,world,sim,jobs){
    const {cash:bank,stats,hidden,people,name,age,ended,id,sim:state,...run}=l;
    const {identity,cause,offenses,prison,illnesses,injuries,addictions,activities,lifeTags,...extras}=state;
    return Object.assign(view(l,world,sim,jobs),{version:4,run:{...run,bonds:stats.bonds,simulation:extras}});
  }
  function decode(v){
    if(!v.run)return v;
    const {bonds,simulation,...run}=v.run;
    const l={...run,version:4,id:v.id,name:[v.firstName,v.lastName].filter(Boolean).join(' '),age:v.age,ended:!v.alive,cash:v.bankBalance,
      stats:{joy:v.stats.happiness,health:v.stats.health,smarts:v.stats.smarts,looks:v.stats.looks,bonds},hidden:{...v.hiddenStats},people:{},
      sim:{...simulation,identity:v.gender,prison:v.prisonSentenceYears,offenses:v.criminalRecord,illnesses:v.illnesses,injuries:v.injuries,addictions:v.addictions,activities:v.schoolActivities,lifeTags:v.lifeTags}};
    if(v.causeOfDeath)l.sim.cause=v.causeOfDeath;
    for(const n of v.npcs)l.people[n.slot]={...n.facts,name:n.givenName,role:n.relation,bond:n.relationship,id:n.id,gender:n.gender,fullName:n.fullName,generosity:n.generosity,craziness:n.craziness,wealth:n.wealth,job:n.job,traits:n.traits};
    return l;
  }
  root.PocketModel={hiddenKeys,hash,cash,clamp,tag,hasWorkReference,ageOf,isAlive,isFamily,person,people,initialize,school,stage,metrics,diff,view,encode,decode};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
