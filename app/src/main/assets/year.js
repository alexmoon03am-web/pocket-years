/* Annual passes and their persistent side effects. All draws use the character's seed. */
(function(root){
  'use strict';
  const PocketEconomy=typeof module!=='undefined'&&module.exports?require('./economy.js').PocketEconomy:root.PocketEconomy;
  const M=typeof module!=='undefined'&&module.exports?require('./model.js').PocketModel:root.PocketModel;
  const node=typeof module!=='undefined'&&module.exports;
  function kin(){return node?require('./kinship.js').PocketKinship:root.PocketKinship;}
  function period(l){return !!l.sim?.timeline?.historicalRules&&l.born+l.age<2000;}
  function money(l,n){return period(l)?(node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy).money(l,n):M.cash(n);}
  const workerNames=['Devin','Nora','Mel','Inez','Raj','Dale','Cass','Bo','Mira','Gus','Anya','Kai'];
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
      const current=name?[l.town,name,program?program.end:''].join('/'):null;
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
      const s=l.sim;
      for(const p of Object.values(l.people)){
        if(!p.met||!M.isAlive(p))continue;
        const age=M.ageOf(l,p);
        if(age===5)p.job='Student';if(age===18&&p.job==='Student'&&!p.atSchool)p.job=kin().adultTitle(l,p);if(age===67)p.job='Retired';
        if(!p.town&&l.sim.expansion)p.town=l.town;
        if(age>=18)p.wealth+=kin().annualSavings(l,p,age);
        const risk=age<55?.0006:age<75?.0025+(age-55)*.0006:.016+(age-75)*.0055;
        if(age<103){
          // A newly materialized class roster must not reroll an existing character's mortality.
          let roll;
          if(p.school||p.kinExtra){
            let bits=M.hash(p.id+'/'+(l.born+l.age));bits=Math.imul(bits^(bits>>>16),0x85ebca6b);
            roll=((bits^(bits>>>13))>>>0)/4294967296;
          }else roll=random(l);
          if(roll>=risk)continue;
        }
        const relative=['Mother','Father','Parent','Guardian','Spouse'].includes(p.role);
        const inLife=p.active||M.isFamily(p)||relative;
        p.active=false;p.diedAt=l.age;
        if(inLife)log(l,'Family',p.name+' died',p.fullName+' died at '+age+'.');
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
      const accident=random(l)<(l.age<5?.0001:.00035+l.hidden.craziness/80000);
      if(!accident&&l.age<110&&random(l)>=risk+fragile+conditions)return false;
      l.ended=true;l.event={id:null,resolved:true};l.eventQueue=[];s.review=null;
      s.cause=accident?'An accident':severity>=35?'Complications of '+s.illnesses.slice().sort((a,b)=>b.severity-a.severity)[0].name:addiction>=40?'Addiction complications':l.age>=68?'Old age':'Sudden illness';
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
      for(const c of s.illnesses.slice()){
        c.years++;c.severity=M.clamp(c.severity+(c.chronic?(c.treated?-5:6):-13));
        if(!c.severity){s.illnesses.splice(s.illnesses.indexOf(c),1);log(l,'Health','Symptoms cleared','My '+c.name+' cleared up.');}
      }
      for(const i of s.injuries.slice()){
        i.years++;i.severity=Math.max(0,i.severity-18);
        if(!i.severity){s.injuries.splice(s.injuries.indexOf(i),1);log(l,'Health','Injury healed','My '+i.name+' healed.');}
      }
      if(l.age>=3&&s.illnesses.length<3&&random(l)<(l.age>63?.095:.043)){
        const chronic=l.age>27&&random(l)<.23,name=chronic?'joint condition':rngItem(l,['chest cold','stomach bug','sinus infection']);
        if(!s.illnesses.some(c=>c.name===name)){s.illnesses.push({name,chronic,severity:chronic?38:21,years:0,treated:false});
          log(l,'Health','Diagnosis','I developed a '+name+(period(l)?'. I stayed home.':'. The clinic has my file.'),apply(l,{health:-3}));}
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
    return {mortality,drift,conditions,workplace,campus,addiction};
  }
  root.PocketYear={create};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
