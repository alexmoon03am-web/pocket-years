/* Annual passes and their persistent side effects. All draws use the character's seed. */
(function(root){
  'use strict';
  const PocketEconomy=typeof module!=='undefined'&&module.exports?require('./economy.js').PocketEconomy:root.PocketEconomy;
  const M=typeof module!=='undefined'&&module.exports?require('./model.js').PocketModel:root.PocketModel;
  const node=typeof module!=='undefined'&&module.exports;
  function kin(){return node?require('./kinship.js').PocketKinship:root.PocketKinship;}
  function period(l){return !!l.sim?.timeline?.historicalRules&&l.born+l.age<2000;}
  function money(l,n){return (node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy).money(l,n);}
  const workerNames=['Devin','Nora','Mel','Inez','Raj','Dale','Cass','Bo','Mira','Gus','Anya','Kai'];
  function realism(l){return l.sim.realism==='historical'?'historical':'guided';}
  function setRealism(l,mode){
    if(mode!=='guided'&&mode!=='historical')return false;
    if(mode==='guided')delete l.sim.realism;else l.sim.realism=mode;
    return true;
  }
  function inheritRealism(parent,child){setRealism(child,realism(parent));}
  // Balance curves describe a fictional household. Child and adult hazards are separate:
  // https://ourworldindata.org/how-do-the-risks-of-death-change-as-people-age
  const pressureByYear=[[1200,1],[1500,.97],[1750,.90],[1850,.80],[1900,.58],[1940,.32],[1970,.12],[2000,0]];
  function eraPressure(y){
    for(let i=1;i<pressureByYear.length;i++){
      const [end,next]=pressureByYear[i],[start,last]=pressureByYear[i-1];
      if(y<=end)return last+(next-last)*Math.max(0,y-start)/(end-start);
    }
    return 0;
  }
  function birthParent(l){
    if(!l.sim.expecting)return null;
    if(l.sim.identity==='woman')return l.id;
    const expecting=l.sim.expecting;
    const p=Object.values(l.people).find(n=>expecting.parentId?n.id===expecting.parentId:
      n.name===expecting.parent&&['Partner','Spouse','Engaged partner'].includes(n.role));
    return p?.gender==='woman'?p.id:null;
  }
  function placeHealth(l,town){
    const y=l.born+l.age,H=node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;
    const place=H.place(town,y),events=H.activeEvents?H.activeEvents(l,town,y):[];
    const has=effect=>events.some(e=>e.effect===effect);
    const disruption=has('conflict')||has('lean')||has('fire'),outbreak=has('disease');
    const hospital=(l.sim.faithWorld?.institutions?.sites||[]).some(s=>s.kind==='hospital'&&s.town===town&&s.condition>=35&&s.staff?.length);
    const careAccess=hospital?'Staffed local hospital':has('medical')?'Expanded local health services':y>=1950?'Community medical services':place?.travelIndex<1?'Practitioners on regional routes':'Household and local practitioners';
    return {disruption,outbreak,hospital,careAccess,access:hospital?.77:has('medical')?.84:place?.travelIndex<1?.97:1.04};
  }
  const namedHazards=[
    ['childbirth','Childbirth complications'],
    ['occupational','A workplace accident'],
    ['outbreak','Illness during a local outbreak']
  ];
  const ageBands=[[1,.135],[4,.027],[11,.005],[17,.0036],[39,.0045],[54,.013],[69,.034],[Infinity,.051]];
  function hazardCause(roll,h){
    if(!h)return {remaining:roll,cause:''};
    for(const [name,cause] of namedHazards){
      const weight=h[name];
      if(roll<weight)return {remaining:0,cause};
      roll-=weight;
    }
    return {remaining:roll,cause:''};
  }
  function occupationExposure(title){
    if(/foundry|railhand|railway|miner|knight|warrior|guard|navigator|fishing|aviator|firefight|construction|oil rig/i.test(title))return 1;
    if(/grower|farmer|smith|porter|dyer|spinner|textile|mechanic|carter|freight|carpenter|machinist|enginewright|boatwright|boatbuilder|kiln/i.test(title))return .5;
    return 0;
  }
  function careProfile(l,p=null,local=null,carrier=birthParent(l)){
    const y=l.born+l.age,s=l.sim,mode=realism(l);
    const age=p?M.ageOf(l,p):l.age,town=p?.town||l.town,place=local||placeHealth(l,town);
    const early=s.timeline?.historicalRules?eraPressure(y):0;
    const adjusted=early>0||mode==='historical';
    // Guided mode protects the opening years of a newly created historical life.
    // It does not change risks for NPCs or for Historical Realism playthroughs.
    const earlyGuidance=mode==='guided'&&!p&&s.timeline?.historicalRules&&age<=4?
      (age<=1?.18:age===2?.42:.65):1;
    const intensity=(mode==='historical'?1:.26)*earlyGuidance;
    const livingDebt=(s.loans?.living?.balance||0)>0||(s.expansion?.missed||0)>1;
    const hardship=livingDebt&&(!p||age<18&&town===l.town);
    const childBudget=age<18&&town===l.town&&s.expansion?.start==='A tight household budget';
    const noGuardian=age<18&&!p&&!Object.values(l.people).some(n=>['Mother','Father','Parent','Guardian','Stepparent'].includes(n.role)&&M.isAlive(n));
    const hardshipFactor=1+(hardship?.20:0)+(childBudget?.09:0)+(noGuardian?.12:0);
    const work=age>=14&&age<85?occupationExposure(p?p.job:l.job):0;
    const care=place.access*(1-Math.min(.15,(p?.communityCare||0)/300));
    const ageBand=ageBands.find(([lastAge])=>age<=lastAge)[1];
    const expecting=!!carrier&&carrier===(p?p.id:l.id);
    const scale=(.12+.88*early)*intensity;
    const excess=early*ageBand*intensity*hardshipFactor*care;
    const disruption=adjusted&&place.disruption?.0035*scale*care:0;
    const outbreak=adjusted&&place.outbreak?(age<=5||age>=60?.032:.016)*scale*care:0;
    const occupational=adjusted?work*.0045*scale:0;
    const childbirth=adjusted&&expecting?(.00014+.011*early)*intensity*hardshipFactor*care:0;
    return {mode,early,excess,occupational,childbirth,outbreak,disruption,care,hardshipFactor,work,
      place,expecting,noGuardian,strained:hardship||childBudget};
  }
  function healthContext(l){
    const p=careProfile(l),factors=[];
    if(l.age<=4)factors.push('Early childhood');
    if(p.early>.5)factors.push('Limited treatment options');
    if(p.strained)factors.push('Strained household budget');
    if(p.noGuardian)factors.push('No surviving parent or guardian');
    if(p.place.outbreak)factors.push('Local disease outbreak');
    if(p.place.disruption)factors.push('Disrupted local supplies');
    if(p.work)factors.push('Hazardous work');
    if(p.expecting)factors.push('Childbirth this year');
    if(l.sim.illnesses.some(c=>!c.treated&&c.severity>=30))factors.push('Untreated illness');
    if(l.sim.injuries.length)factors.push('Recovering from injury');
    return {mode:p.mode,label:p.mode==='historical'?'Historical Realism':'Guided',
      description:p.mode==='historical'?'Childhood, childbirth and untreated illness carry greater risks, especially in earlier centuries.':'Age and local conditions shape health. The first four birthdays of a historical life are gentler, though severe outcomes remain possible.',
      riskFactors:factors,careAccess:p.place.careAccess};
  }
  function create({random,rngItem,apply,log,world,sim,jobs}){
    function workplace(l){
      const job=l.job&&!['student','retired'].includes(l.job)?l.job:null;
      if((l.sim.staffJob||null)===job)return;
      for(const p of Object.values(l.people)){
        if(['Coworker','Boss'].includes(p.role)){p.role=p.role==='Boss'?'Former boss':'Former coworker';}
      }
      l.sim.staffJob=job;if(!job)return;
      const company=l.sim.expansion?.employer||(world.openings[job]?world.openings[job][0]:job==='trainee'?'Town Workshop':'Corner Shop');
      const existing=new Set(Object.values(l.people).map(p=>p.name)),sequence=(l.sim.staffSequence||0)+1;
      l.sim.staffSequence=sequence;
      for(const role of ['Boss','Coworker']){
        let names=workerNames.filter(n=>!existing.has(n));if(!names.length)names=workerNames;
        const which=M.hash(l.id+job+sequence+role),name=names[which%names.length];existing.add(name);
        const key='staff-'+sequence+'-'+role.toLowerCase();
        l.people[key]={name,role,bond:role==='Boss'?48:52,met:true,active:true,bornYear:l.born+l.age-(25+which%31),job:role==='Boss'?'Manager at '+company:jobs[job][0]+' at '+company};
        M.person(l,key,l.people[key]);
      }
      const salary=PocketEconomy.salary(l,job,jobs);
      if(salary>l.sim.peak.salary)l.sim.peak={title:job,salary};
    }
    function campus(l){
      const school=M.school(l),program=l.sim.program;
      const name=!l.ended&&!l.sim.prison&&school.name;
      // An assessment can delay completion without changing the institution or its people.
      const enrollment=program?.pathway?[program.field,program.start].join('/'):program?.end??'';
      const current=name?[l.town,name,enrollment].join('/'):null;
      if((l.sim.campusKey||null)===current)return;
      for(const p of Object.values(l.people)){
        if(!p.atSchool)continue;p.atSchool=false;
        if(p.job==='Student'&&M.ageOf(l,p)>=18)p.job=kin().adultTitle(l,p);
        if(p.role==='Classmate'||p.role==='Teacher'){
          p.role=p.role==='Teacher'?'Former teacher':'Former classmate';p.active=false;
        }
      }
      l.sim.campusKey=current;if(!current)return;
      const taken=new Set(Object.values(l.people).map(p=>p.name));
      const names=['Alex','Hannah','Isaac','Maya','Leah','Jasper','Chloe','Theo','Sonia','Omar','Kai','Asha','Logan','Beatrice','Miles','Sofia','Caleb','Tariq','Erin','Lena','Marcus','Hugo','Tessa','Gabe','Ida','Wes'];
      const count=program?3:4;
      for(let i=0;i<count;i++){
        const key='class-'+M.hash(current).toString(36)+'-'+i;
        if(l.people[key]){
          const p=l.people[key];if(!M.isAlive(p)||p.cutOff)continue;
          p.atSchool=p.active=true;if(p.role==='Former teacher'||p.role==='Former classmate')p.role=i===0?'Teacher':'Classmate';
          continue;
        }
        const h=M.hash(l.id+current+i),available=names.filter(n=>!taken.has(n)),catalog=available.length?available:names;
        const first=catalog[h%catalog.length],role=i===0?'Teacher':'Classmate';taken.add(first);
        const age=i===0?29+h%30:program?Math.max(18,l.age+h%5-2):l.age;
        l.people[key]={name:first,role,job:i===0?(program?'Lecturer':'Teacher'):'Student',bornYear:l.born+l.age-age,
          met:true,active:true,atSchool:true,bond:25+(h>>>8)%31,school:name};
        M.person(l,key,l.people[key]);
      }
    }
    function mortality(l){
      const s=l.sim,adjusted=realism(l)==='historical'||period(l),locations=new Map(),carrier=birthParent(l);
      function profile(p){
        const town=p?.town||l.town;
        if(!locations.has(town))locations.set(town,placeHealth(l,town));
        return careProfile(l,p,locations.get(town),carrier);
      }
      for(const p of Object.values(l.people)){
        if(!p.met||!M.isAlive(p))continue;
        const age=M.ageOf(l,p);
        if(age===5)p.job='Student';if(age===18&&p.job==='Student'&&!p.atSchool)p.job=kin().adultTitle(l,p);if(age===67)p.job='Retired';
        if(!p.town&&l.sim.expansion)p.town=l.town;
        if(age>=18)p.wealth+=kin().annualSavings(l,p,age);
        const risk=age<55?.0006:age<75?.0025+(age-55)*.0006:.016+(age-75)*.0055;
        const h=adjusted?profile(p):null;
        let cause='';
        if(age<103){
          // A newly materialized class roster must not reroll an existing character's mortality.
          let roll;
          if(p.school||p.kinExtra){
            let bits=M.hash(p.id+'/'+(l.born+l.age));bits=Math.imul(bits^(bits>>>16),0x85ebca6b);
            roll=((bits^(bits>>>13))>>>0)/4294967296;
          }else roll=random(l);
          const outcome=hazardCause(roll,h);
          cause=outcome.cause;
          if(!cause&&outcome.remaining>=Math.min(.65,risk+(h?h.excess+h.disruption:0)))continue;
        }
        const relative=['Mother','Father','Parent','Guardian','Spouse'].includes(p.role);
        const inLife=p.active||M.isFamily(p)||relative;
        p.active=false;p.diedAt=l.age;
        if(cause)p.causeOfDeath=cause;
        if(inLife)log(l,'Family',p.name+' died',p.fullName+' died at '+age+'.'+(cause?' Cause of death: '+cause+'.':''));
        if(relative&&!p.cutOff){
          const siblings=Object.values(l.people).filter(n=>n.role==='Sibling'&&M.isAlive(n)).length;
          const amount=Math.floor(p.wealth*(p.role==='Spouse'?.8:.62)/(p.role==='Spouse'?1:1+siblings));
          p.wealth-=amount;
          if(amount){if(l.age<18)s.trust+=amount;else l.cash+=amount;
            log(l,'Family','An inheritance',money(l,amount)+(l.age<18?' went into trust until 18.':period(l)?' came to me from the estate.':' cleared probate. The bank spelled my name right.'),l.age<18?{trust:amount}:{cash:amount});}
        }
        if(p.bond>=60)apply(l,{joy:-4});
      }
      if(l.age>=18&&s.trust){const sum=s.trust;s.trust=0;l.cash+=sum;log(l,'Family','Trust released',money(l,sum)+' arrived. I can now disappoint the trustees.',{cash:sum,trust:-sum});}
      const severity=s.illnesses.reduce((n,c)=>n+c.severity*(c.chronic?1:.22),0);
      const addiction=s.addictions.reduce((n,a)=>n+(a.sober?0:a.severity),0);
      const risk=l.age<40?.00025:l.age<65?.001+(l.age-40)*.00028:l.age<80?.009+(l.age-65)*.0015:.032+(l.age-80)*.007;
      const fragile=Math.max(0,46-l.stats.health)/1250,conditions=severity/2600+addiction/3900+s.injuries.reduce((n,x)=>n+x.severity,0)/7000;
      const h=adjusted?profile(null):null;
      const accident=random(l)<(l.age<5?.0001:.00035+l.hidden.craziness/80000);
      let cause='';
      if(!accident&&l.age<110){
        const outcome=hazardCause(random(l),h);
        cause=outcome.cause;
        if(!cause){
          const managed=s.illnesses.reduce((n,c)=>n+(c.treated?c.severity*(c.chronic?1:.22):0),0);
          const conditionRisk=h?Math.max(0,conditions-managed/5200)*(1+h.early*.42)*h.care:conditions;
          if(outcome.remaining>=Math.min(.75,risk+fragile+conditionRisk+(h?h.excess+h.disruption:0)))return false;
        }
      }
      // The birth and estate can share a calendar year. Register the newborn before probate.
      if(s.expecting&&h)sim.deliver(l);
      l.ended=true;l.event={id:null,resolved:true};l.eventQueue=[];s.review=null;
      s.cause=accident?'An accident':cause|| (severity>=35?'Complications of '+s.illnesses.slice().sort((a,b)=>b.severity-a.severity)[0].name:addiction>=40?'Addiction complications':l.age>=68?'Old age':'Sudden illness');
      log(l,'Milestone','Death','I died at '+l.age+'. Cause of death: '+s.cause+'.');return true;
    }
    function drift(l){
      const s=l.sim,age=l.age,debts=sim.debt(l);
      for(const k of ['joy','health','smarts','looks','bonds']){
        const anchor=k==='health'&&age>65?49:k==='looks'&&age>49?48:65;
        const change=Math.round((anchor-l.stats[k])*.055)+Math.floor(random(l)*5)-2;apply(l,{[k]:change});
      }
      const severity=s.illnesses.concat(s.injuries).reduce((n,a)=>n+a.severity,0);
      const dependence=s.addictions.filter(a=>!a.sober).reduce((n,a)=>n+a.severity,0);
      apply(l,{health:Math.min(3,s.habits.exercise)-Math.ceil(severity/25)-Math.ceil(dependence/35)-(s.prison?1:0),
        joy:(s.prison?-3:0)-(debts>Math.max(20000,l.cash*2)?3:0),
        smarts:Math.min(2,s.habits.reading),looks:s.habits.nightlife>2?-1:0});
      for(const k of Object.keys(s.habits))s.habits[k]=Math.max(0,s.habits[k]-1);
      for(const p of Object.values(l.people))if(p.active&&p.met)p.bond=M.clamp(p.bond-(p.bond>12?1:0));
      if(l.hidden.notoriety>0&&!s.prison)l.hidden.notoriety--;
    }
    function addiction(l,substance,amount){
      const s=l.sim;
      const a=s.addictions.find(x=>x.substance===substance);
      if(a){a.sober=false;a.severity=M.clamp(a.severity+amount);return true;}
      if(random(l)<.10+l.hidden.addictionRisk*.005){s.addictions.push({substance,severity:amount+13,sober:false,years:0});M.tag(l,'dependence');return true;}
      return false;
    }
    function conditions(l){
      const s=l.sim;
      const h=realism(l)==='historical'||period(l)?careProfile(l):null;
      const difficult=h&&h.early*(h.mode==='historical'?1:.35);
      for(const c of s.illnesses.slice()){
        c.years++;c.severity=M.clamp(c.severity+(c.chronic?(c.treated?-5:6+Math.round(2*difficult)):c.treated?-18:-13+Math.round(4*difficult)));
        if(!c.severity){s.illnesses.splice(s.illnesses.indexOf(c),1);log(l,'Health','Symptoms cleared','My '+c.name+' cleared up.');}
      }
      for(const i of s.injuries.slice()){
        i.years++;i.severity=Math.max(0,i.severity-18);
        if(!i.severity){s.injuries.splice(s.injuries.indexOf(i),1);log(l,'Health','Injury healed','My '+i.name+' healed.');}
      }
      const illnessChance=(l.age>63?.095:.043)+(h?(h.early*(l.age<5?.11:.052)+h.outbreak*2+h.disruption)*h.hardshipFactor*h.care:0);
      if((l.age>=3||h&&difficult>.25)&&s.illnesses.length<3&&random(l)<illnessChance){
        const chronic=l.age>27&&random(l)<.23,name=chronic?'joint condition':rngItem(l,['chest cold','stomach bug','sinus infection']);
        if(!s.illnesses.some(c=>c.name===name)){s.illnesses.push({name,chronic,severity:chronic?38:21,years:0,treated:false});
          log(l,'Health','Diagnosis','I developed a '+name+(period(l)?'. I stayed home.':'. The clinic has my file.'),apply(l,{health:-3}));}
      }
      if(h&&h.work&&s.injuries.length===0){
        const injuryChance=h.work*(.004+.055*h.early)*(h.mode==='historical'?1:.3);
        if(random(l)<injuryChance){
          s.injuries.push({name:'work injury',severity:36,years:0});
          log(l,'Health','Injured at work','I came home hurt. My usual duties had to wait.',apply(l,{health:-5}));
        }
      }
      for(const a of s.addictions){
        a.years++;
        if(a.sober){
          if(random(l)<Math.max(.015,(a.severity+65-l.hidden.willpower)/650)){a.sober=false;log(l,'Health','Relapse','My '+a.substance+' problem returned.',apply(l,{joy:-3}));}
          else a.severity=Math.max(1,a.severity-5);
        }else if(random(l)<.33){a.severity=M.clamp(a.severity+7);log(l,'Health','Cravings','My '+a.substance+' cravings got worse.',apply(l,{health:-2,willpower:-1}));}
      }
      if(l.age>=18&&l.job&&!['student','retired'].includes(l.job))s.workYears++;
      if(l.age===5){l.people.friend.met=l.people.friend.active=M.isAlive(l.people.friend);}
      if([5,11,14].includes(l.age)&&!s.dropped){const name=M.school(l).name;l.world.schoolHistory.push(name);if(period(l)&&l.born+l.age<1900)log(l,'School',name,'I began '+name.toLowerCase()+'. My first task was to watch.');
        else log(l,'School','Enrolled at '+name,'I started at '+name+'. They issued a timetable.');}
      if(l.age===18)l.track=l.track||'gap';
      if(s.activities.length&&M.school(l).name)apply(l,{[s.activities.includes('track')?'health':'smarts']:1,bonds:1});
      if(l.age===18&&!s.dropped){
        if(period(l)&&l.born+l.age<1900)log(l,'School','Finished my training','My years of instruction ended. They let me keep my mistakes.');
        else log(l,'School','High school graduation','I received a diploma. My locker still smelled bad.');
      }
      world.birthday(l);sim.birthday(l);workplace(l);campus(l);
    }
    return {mortality,drift,conditions,workplace,campus,addiction,realism,setRealism,inheritRealism,healthContext};
  }
  root.PocketYear={create};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
