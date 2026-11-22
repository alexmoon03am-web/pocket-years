/* Tuition, admissions and transcripts. Browsing never advances the life RNG or changes a record. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const economy=node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  const geography=node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;
  const levels={
    certificate:{label:'Trade & vocational training',years:2,annual:1450,selectivity:29},
    associate:{label:'Community college',years:2,annual:2600,selectivity:36},
    bachelor:{label:'Undergraduate degrees',years:4,annual:4100,selectivity:51},
    master:{label:'Graduate school',years:2,annual:5200,selectivity:61},
    doctorate:{label:'Doctoral school',years:4,annual:4600,selectivity:65},
    professional:{label:'Professional school',years:4,annual:8200,selectivity:67}
  };
  const icons={agriculture:'sprout',craft:'tools',construction:'home',manufacturing:'tools',transport:'compass',hospitality:'bowl','public-safety':'flag',health:'heart',nursing:'heart',medicine:'heart',law:'book',business:'bag',finance:'wallet',accounting:'wallet',education:'school',arts:'palette',media:'newspaper',music:'music',history:'archive',politics:'flag',faith:'book',athletics:'shoe',space:'flask',computing:'code',engineering:'tools',mathematics:'book',science:'flask',environment:'leaf','social-work':'people',psychology:'chat'};
  const programs=Object.create(null);
  // Curriculum descriptions double as catalog copy. Dates are availability bands in the simulation.
  function offer(level,id,title,field,since,description,extra={}){
    programs[id]={id,level,title,field,since,description,icon:icons[field],years:levels[level].years,...extra};
  }
  function courses(level,rows){for(const row of rows)offer(level,...row);}
  courses('certificate',[
    ['workshop-craft','Workshop craft','craft',1200,'Shape, finish and price a commissioned object.'],
    ['field-husbandry','Field husbandry','agriculture',1200,'Keep seed stock and plan the next planting.'],
    ['timber-framing','Timber framing','construction',1200,'Measure timber and fit load-bearing joints.'],
    ['coastal-pilotage','Coastal pilotage','transport',1200,'Read local currents and keep a passage log.'],
    ['market-books','Merchant bookkeeping','business',1200,'Close a set of accounts under a local trader.'],
    ['applied-arts','Decorative arts','arts',1200,'Prepare pigments, finish surfaces and complete commissions.'],
    ['workshop-printing','Print workshop','media',1500,'Set type, correct a proof and run an edition.',{regions:['europe','eastAsia','westAsia']}],
    ['kiln-operations','Kiln operations','manufacturing',1200,'Fire repeatable batches and track material losses.'],
    ['pattern-weaving','Pattern weaving','craft',1200,'Design a repeat and finish a marketable length of cloth.'],
    ['culinary-craft','Kitchen craft','hospitality',1400,'Plan a large meal around a small kitchen.'],
    ['steam-fitting','Steam fitting','engineering',1830,'Fit and inspect pressure lines on working machinery.'],
    ['electrical-installation','Electrical installation','construction',1900,'Wire a practice panel and complete the inspection.'],
    ['emergency-response','Emergency response','public-safety',1950,'Practice dispatch coordination and supervised incident response.'],
    ['clinical-support','Clinical support','health',1950,'Practice patient transport and ward administration.'],
    ['network-support','Network support','computing',1990,'Maintain small networks and diagnose service interruptions.'],
    ['habitat-service','Habitat service','space',2050,'Inspect environmental controls on a sealed habitat.']
  ]);
  courses('associate',[
    ['nursing-associate','Nursing foundations','nursing',1950,'Combine anatomy classes with supervised patient care.'],
    ['business-associate','Business administration','business',1920,'Build accounts, purchasing plans and a small operating budget.'],
    ['computing-associate','Systems support','computing',1970,'Maintain a working lab and document each repair.'],
    ['environment-associate','Field ecology','environment',1960,'Survey habitats and keep a field sample register.'],
    ['engineering-associate','Engineering technology','engineering',1930,'Prototype parts and test them against drawings.'],
    ['media-associate','Production technology','media',1950,'Record, assemble and deliver a short production.'],
    ['health-associate','Allied health','health',1950,'Study patient services and complete a supervised placement.'],
    ['construction-associate','Building technology','construction',1920,'Estimate materials and inspect a small building project.']
  ]);
  courses('bachelor',[
    ['agricultural-science','Agricultural science','agriculture',1850,'Run crop trials and compare yields.'],
    ['construction-management','Construction management','construction',1940,'Sequence inspections, crews and site deliveries.'],
    ['industrial-production','Industrial production','manufacturing',1900,'Model production lines and measure waste.'],
    ['logistics','Transport logistics','transport',1930,'Build workable schedules for freight and passengers.'],
    ['public-service','Public safety administration','public-safety',1960,'Plan local emergency services under a fixed budget.'],
    ['public-health','Public health','health',1900,'Study sanitation, prevention and population health.'],
    ['nursing-bachelor','Nursing science','nursing',1920,'Complete clinical placements and design patient care plans.'],
    ['legal-studies','Legal studies','law',1900,'Read decisions, research precedent and write reasoned briefs.'],
    ['biology','Biology','science',1850,'Keep a lab notebook and defend a field study.'],
    ['chemistry','Chemistry','science',1830,'Separate samples and account for experimental error.'],
    ['conservation','Environmental science','environment',1960,'Balance land use against field measurements.'],
    ['mechanical-engineering','Mechanical engineering','engineering',1850,'Design and test a moving assembly.'],
    ['civil-engineering','Civil engineering','engineering',1850,'Survey sites and calculate structural loads.'],
    ['computer-science','Computer science','computing',1960,'Design algorithms and examine how software fails.'],
    ['mathematics','Mathematics','mathematics',1850,'Build proofs and test numerical methods.'],
    ['commerce','Commerce','business',1900,'Study pricing, contracts and enterprise operations.'],
    ['finance','Finance','finance',1900,'Value investments and measure cash-flow risk.'],
    ['accounting','Accountancy','accounting',1900,'Audit a ledger and trace unexplained balances.'],
    ['teaching','Teacher education','education',1900,'Plan lessons and teach under observation.'],
    ['fine-arts','Fine arts','arts',1850,'Develop a portfolio and mount a small exhibition.'],
    ['journalism','Journalism','media',1900,'Verify reports, interview sources and meet a deadline.'],
    ['composition','Music composition','music',1850,'Score a piece and revise it after rehearsal.'],
    ['history','History','history',1850,'Build an argument from surviving records.'],
    ['public-policy','Public policy','politics',1900,'Compare budgets, incentives and public outcomes.'],
    ['hospitality','Hospitality management','hospitality',1920,'Design service schedules and control food costs.'],
    ['social-work','Social work','social-work',1920,'Complete supervised casework and practice referral decisions.'],
    ['religious-studies','Religious studies','faith',1900,'Compare traditions and document community practices.'],
    ['sport-science','Sport science','athletics',1960,'Measure training loads and recovery.'],
    ['psychology','Psychology','psychology',1900,'Design behavioral studies and interpret the results.'],
    ['orbital-systems','Orbital systems','space',2050,'Model station operations and habitat maintenance.'],
    ['deep-range-navigation','Deep-range navigation','space',2200,'Plan long journeys with limited communications.']
  ]);
  courses('master',[
    ['education-master','Curriculum design','education',1920,'Design a curriculum and evaluate its classroom results.'],
    ['engineering-master','Engineering design','engineering',1900,'Lead a design review and build a working prototype.'],
    ['business-master','Enterprise management','business',1920,'Manage staffing, creditors and growth in a case enterprise.'],
    ['social-work-master','Community practice','social-work',1940,'Complete advanced placements and supervise case conferences.'],
    ['psychology-master','Applied psychology','psychology',1930,'Design and evaluate a behavioral intervention.'],
    ['computing-master','Advanced computing','computing',1970,'Build a distributed system and measure its limits.'],
    ['finance-master','Financial analysis','finance',1930,'Stress-test portfolios and credit assumptions.'],
    ['faith-master','Religion and society','faith',1920,'Research the relationship between local institutions and belief.'],
    ['science-master','Experimental science','science',1870,'Run an independent experiment with an adviser.'],
    ['mathematics-master','Applied mathematics','mathematics',1880,'Develop and validate a numerical model.'],
    ['history-master','Archival research','history',1880,'Identify, collate and annotate a primary-source collection.'],
    ['space-master','Habitat engineering','space',2070,'Design a settlement with finite energy and material reserves.']
  ]);
  courses('doctorate',[
    ['science-doctorate','Experimental science doctorate','science',1900,'Defend original experimental research.'],
    ['mathematics-doctorate','Mathematics doctorate','mathematics',1900,'Defend an original mathematical result.'],
    ['psychology-doctorate','Psychology doctorate','psychology',1940,'Complete a longitudinal behavioral study.'],
    ['computing-doctorate','Computing doctorate','computing',1970,'Test a new computing method against existing results.'],
    ['engineering-doctorate','Engineering doctorate','engineering',1910,'Develop and defend a new engineering method.'],
    ['history-doctorate','History doctorate','history',1900,'Defend a substantial archival investigation.'],
    ['faith-doctorate','Religious studies doctorate','faith',1940,'Defend an original study of a religious community.'],
    ['space-doctorate','Offworld systems doctorate','space',2120,'Defend research on long-lived settlement systems.']
  ]);
  courses('professional',[
    ['clinical-medicine','Clinical medicine','medicine',1910,'Complete clinical rotations and a supervised final examination.',{accepts:['science','health','nursing','medicine']}],
    ['legal-practice','Legal practice','law',1900,'Handle supervised cases and complete a professional examination.',{years:3,accepts:['any']}],
    ['pharmacy-practice','Pharmacy practice','health',1950,'Study medicines and complete supervised pharmacy practice.',{accepts:['science','health','nursing']}],
    ['advanced-nursing','Advanced nursing practice','nursing',1970,'Complete advanced clinical training as a nursing graduate.',{years:3,accepts:['nursing']}]
  ]);
  const methodIds=['cash','loan','aid','scholarship'];
  const rank={certificate:1,associate:2,bachelor:3,master:4,professional:4,doctorate:5};
  const legacy={
    'General studies':['general','bachelor'],Science:['science','bachelor'],Arts:['arts','bachelor'],Business:['business','bachelor'],
    Medicine:['medicine','professional'],Law:['law','professional'],'Trade certificate':['craft','certificate']
  };
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const year=l=>l.born+l.age;
  function available(l,p){
    if(!p||year(l)<p.since)return false;
    return !p.regions||year(l)>=1900||p.regions.includes(geography.region(l.town));
  }
  function eligible(l){return Object.values(programs).filter(p=>available(l,p));}
  function records(l){
    const list=(l.sim.transcript||[]).map(r=>{
      const p=programs[r.id];return {id:r.id,title:p.title,field:p.field,level:p.level,year:r.year,honors:r.honors};
    });
    const legacyNames=new Set([...(l.sim.degrees||[]),l.sim.degree,l.sim.professional]);
    const newTrade=list.some(r=>r.level==='certificate');
    if(!newTrade&&(l.world.credential==='trade'||l.world.tradeQualified))legacyNames.add('Trade certificate');
    for(const name of legacyNames){
      if(!own(legacy,name)||list.some(r=>r.title===name))continue;
      const [field,level]=legacy[name];
      if(!l.sim.degrees?.includes(name)&&list.some(r=>r.field===field&&r.level===level))continue;
      list.push({id:'legacy-'+field,title:name,field,level,year:null,honors:false});
    }
    return list;
  }
  function attainment(l){
    const completed=records(l);
    return completed.reduce((best,r)=>!best||rank[r.level]>rank[best.level]||
      rank[r.level]===rank[best.level]&&(r.year||0)>(best.year||0)?r:best,null);
  }
  function hasProgram(l,id){return (l.sim.transcript||[]).some(r=>r.id===id);}
  function hasCredential(l,field,level){
    if(!own(rank,level))return false;
    return records(l).some(r=>(field==='any'||r.field===field)&&(level==='professional'?r.level===level:rank[r.level]>=rank[level]));
  }
  function methods(l,id){
    const p=programs[id];
    if(!available(l,p))return [];
    return year(l)>=1950?methodIds.slice():['cash','aid','scholarship'];
  }
  function required(l,p){
    if(p.level==='certificate')return '';
    if(l.sim.dropped&&!l.sim.degree)return 'Finish secondary school or earn an equivalency';
    const previous={master:'bachelor',professional:'bachelor',doctorate:'master'}[p.level];
    if(!previous)return '';
    const fields=p.accepts||[p.field];
    return fields.some(f=>hasCredential(l,f,previous))?'':'Requires '+(previous==='master'?'a master’s degree':'an undergraduate degree')+(fields.includes('any')?'':' in '+fields.map(f=>f.replace(/-/g,' ')).join(' or '));
  }
  function terms(l,p){
    const current=l.sim.program,active=programs[current?.field],same=!!(current?.pathway&&active?.field===p.field&&active.level===p.level);
    const earned=same?current.credits:0;
    const fromAssociate=p.level==='bachelor'&&records(l).some(r=>r.level==='associate'&&r.field===p.field)?2:0;
    return Math.min(p.years-1,Math.max(earned,fromAssociate));
  }
  function score(l){
    return l.world.grade*.48+l.stats.smarts*.26+l.hidden.discipline*.16+l.stats.health*.05+Math.min(5,(l.sim.activities||[]).length*1.5);
  }
  function conditions(p){
    if(p.level==='certificate')return 'Adult applicants can enter with or without a school diploma.';
    if(p.level==='doctorate')return 'A master’s degree in '+p.field.replace(/-/g,' ')+' is required.';
    if(['professional','master'].includes(p.level)){
      const fields=p.accepts||[p.field];
      return 'An undergraduate degree'+(fields.includes('any')?'':' in '+fields.map(f=>f.replace(/-/g,' ')).join(' or '))+' is required.';
    }
    return 'Complete secondary school or an equivalency. Grades and study habits influence admission.';
  }
  function blocked(l){
    if(l.ended)return 'Life complete';
    if(l.sim.prison)return 'In custody';
    if(l.sim.court||l.sim.review||l.event&&!l.event.resolved)return 'Finish the current decision';
    return '';
  }
  function quote(l,id,method='cash'){
    const p=programs[id];
    if(!available(l,p))return {reason:'Unavailable in this time and place',method,tuition:0,aid:0,fee:0,years:0,transferCredits:0,chance:0,conditions:''};
    const profile=economy.profile(l),transferCredits=terms(l,p),years=p.years-transferCredits;
    const historical=year(l)<1850,cost=historical?.38:year(l)<1950?.68:1;
    const tuition=Math.max(1,Math.round(levels[p.level].annual*years*profile.cost*cost));
    const debt=Object.values(l.sim.loans||{}).reduce((sum,q)=>sum+q.balance,0);
    const investments=node?require('./expansion.js').PocketExpansion:root.PocketExpansion;
    const holdings=Object.values(l.world.owned).reduce((sum,a)=>sum+a.value,0);
    const resources=l.cash+(l.sim.fund||0)+investments.portfolio(l)+investments.companyValue(l)*.5+holdings*.35;
    const reserve=Math.max(0,resources-debt*.35);
    const need=clamp(1-reserve/(tuition*2+2000*profile.cost),0,1);
    const aid=method==='scholarship'?tuition:method==='aid'?Math.round(tuition*need):0;
    const fee=tuition-aid,marks=score(l),chance=Math.round(clamp(79+(marks-levels[p.level].selectivity)*.8,16,98));
    let reason=blocked(l);
    if(!reason&&l.age<18)reason='Opens at 18';
    if(!reason&&!methods(l,id).includes(method))reason='Funding method unavailable';
    if(!reason&&(hasProgram(l,id)||p.level==='professional'&&hasCredential(l,p.field,'professional')))reason='Qualification already earned';
    if(!reason&&l.sim.program){
      const previous=programs[l.sim.program.field];
      if(l.sim.program.field===id)reason='Already enrolled';
      else if(!l.sim.program.pathway||previous?.field!==p.field||previous?.level!==p.level)reason='Finish or withdraw from your current course';
    }
    if(!reason&&l.job==='trainee'&&!l.world.tradeQualified&&l.world.credential!=='trade')reason='Finish or leave your paid apprenticeship';
    if(!reason)reason=required(l,p);
    const dismissal=l.sim.academicReturn?.[p.field+'/'+p.level];
    if(!reason&&dismissal!==undefined&&(year(l)<=dismissal||l.world.grade<50)){
      reason='Readmission needs a year away and grades of 50%. Open Study and qualifications for free preparation.';
    }
    if(!reason&&l.used.includes('path-application'))reason='One admissions decision per year';
    if(!reason&&method==='scholarship'&&marks<72)reason='Merit funding needs a stronger academic record';
    if(!reason&&method==='aid'&&aid===0)reason='Household resources exceed the aid limit';
    if(!reason&&['cash','aid'].includes(method)&&l.cash<fee)reason='Needs '+economy.money(l,fee)+' for tuition';
    if(!reason&&method==='loan'&&(l.sim.loans.tuition?.balance||0)+tuition>Math.max(48000,Math.round(profile.cost*90000)))reason='Student borrowing limit reached';
    if(!reason&&method==='loan'&&(l.sim.finance?.creditUntil||0)>year(l))reason='Credit is restricted';
    if(!reason&&method==='loan'&&(l.sim.loans.tuition?.workoutUntil||0)>year(l))reason='Finish the current tuition repayment arrangement';
    return {method,fee,tuition,aid,reason,chance,years,transferCredits,conditions:conditions(p)};
  }
  function result(l,ctx,title,text,effects={},extra={}){
    const delta=Object.assign(ctx.apply(l,effects),extra);
    ctx.log(l,'School',title,text,delta);return {title,text,delta};
  }
  function apply(l,id,method,ctx){
    const q=quote(l,id,method),p=programs[id];
    if(q.reason||!ctx)return null;
    l.used.push('path-application');
    if(ctx.random(l)*100>=q.chance){
      const msg='The admissions panel declined my application. '+(l.sim.program?'I kept my current place.':'I can apply again next year.');
      return result(l,ctx,'Application declined',msg,{joy:-2});
    }
    const funding=q.method,prior=l.sim.program?.pathway;
    if(l.sim.academicReturn){
      delete l.sim.academicReturn[p.field+'/'+p.level];
      if(!Object.keys(l.sim.academicReturn).length)delete l.sim.academicReturn;
    }
    if(funding==='loan')ctx.sim.addLoan(l,'tuition',q.fee,10,true);
    if(funding==='scholarship'&&!l.sim.lifeTags.includes('scholarship'))l.sim.lifeTags.push('scholarship');
    if(l.job==='retired')l.sim.studyPension=ctx.sim.budget(l).pension;
    l.sim.program={field:id,pathway:true,end:l.age+q.years,credits:q.transferCredits,start:year(l),lastYear:year(l),funding,probation:false,campus:0};
    l.track='college';ctx.world.changeJob(l,'student',true);
    ctx.campus?.(l);
    const payment=funding==='loan'?'My tuition loan is '+economy.money(l,q.fee)+'.':funding==='scholarship'?'Merit funding covered the whole bill.':q.aid?'Aid covered '+economy.money(l,q.aid)+'. I paid '+economy.money(l,q.fee)+'.':'I paid '+economy.money(l,q.fee)+' in tuition.';
    const transfer=q.transferCredits?' They recognized '+q.transferCredits+' '+(q.transferCredits===1?'year':'years')+' of credit.':'';
    return result(l,ctx,prior?'Transferred to '+p.title:'Admitted to '+p.title,'I accepted a place. '+payment+transfer,
      {cash:funding==='loan'?0:-q.fee},funding==='loan'?{debt:q.fee}:{});
  }
  function school(l){
    const enrollment=l.sim.program;
    if(!enrollment?.pathway)return null;
    const p=programs[enrollment.field];
    if(!p)return null;
    const early=year(l)<1850;
    const places={certificate:early?['Local workshop','Neighboring workshop']:['Technical school','Training cooperative'],associate:['Community college','Regional college'],bachelor:['City university','Regional university'],master:['Graduate institute','Regional graduate school'],doctorate:['Research institute','Regional research school'],professional:['Professional school','Teaching institute']};
    return {level:p.title,name:places[p.level][enrollment.campus]};
  }
  function transferFee(l){return Math.max(1,Math.round((year(l)<1850?45:180)*economy.profile(l).cost));}
  function actions(l){
    const current=l.sim.program;
    if(!current?.pathway){
      if(current||!l.sim.academicReturn||l.world.grade>=50)return [];
      const reason=blocked(l)||(l.used.includes('path-return-study')?'Done this year':'');
      return [{id:'return-study',title:'Prepare to return to study',desc:'Free guided revision. Improve your grades by up to 18 points for readmission.',icon:'book',reason}];
    }
    const fee=transferFee(l),reason=blocked(l);
    return [
      {id:'tutorial',title:'Arrange a tutorial',desc:'Improve your marks and prepare for the next assessment.',icon:'book'},
      {id:'transfer',title:'Transfer institution',desc:'Keep earned credits. Transfer charge '+economy.money(l,fee)+'.',icon:'map'},
      {id:'withdraw',title:'Withdraw from the program',desc:'Leave without a qualification. Tuition and loans remain due.',icon:'exit'}
    ].map(o=>({...o,reason:reason||(l.used.includes('path-'+o.id)?'Done this year':o.id==='transfer'&&l.cash<fee?'Needs '+economy.money(l,fee):'')}));
  }
  function action(l,id,ctx){
    const option=actions(l).find(a=>a.id===id);if(!option||option.reason||!ctx)return null;
    const current=l.sim.program;l.used.push('path-'+id);
    if(id==='return-study'){
      const delta=ctx.world.metrics(l,{grade:18});
      return result(l,ctx,'Prepared to return to study','I worked through the exercises I used to leave blank.',{discipline:2},delta);
    }
    if(id==='tutorial'){
      const delta=ctx.world.metrics(l,{grade:8});
      return result(l,ctx,'One-to-one tutorial','I brought my worst assignment. It required a second sheet.',{smarts:2,joy:-1},delta);
    }
    if(id==='transfer'){
      const fee=transferFee(l);current.campus=1-current.campus;ctx.campus?.(l);
      return result(l,ctx,'Institution transfer','I moved to '+school(l).name+'. My credits arrived with me.',{cash:-fee});
    }
    leave(l,ctx);
    return result(l,ctx,'Withdrew from '+programs[current.field].title,'I returned my course materials. My tuition account stayed open.');
  }
  function leave(l,ctx){
    l.sim.program=null;l.track=l.sim.degree?'college':l.world.tradeQualified?'trade':'gap';
    if(l.job==='student')ctx.world.changeJob(l,null,true);
    ctx.campus?.(l);
  }
  function annual(l,ctx){
    const current=l.sim.program;if(!current?.pathway||current.lastYear>=year(l)||l.ended)return;
    current.lastYear=year(l);
    const p=programs[current.field],mark=l.world.grade;
    if(mark<45){
      if(current.probation){
        if(!l.sim.academicReturn)l.sim.academicReturn={};
        l.sim.academicReturn[p.field+'/'+p.level]=year(l);
        leave(l,ctx);result(l,ctx,'Academic dismissal','Two assessments below the pass mark ended my place. Readmission takes a year away and grades of 50%. Free revision is available.',{joy:-4});
        return;
      }
      current.probation=true;current.end++;
      result(l,ctx,'Academic probation','I missed the pass mark. I have one year to bring my grades to 45%.',{joy:-2});return;
    }
    if(current.probation)result(l,ctx,'Academic standing restored','I passed the repeat assessment. The warning came off my file.');
    current.probation=false;current.credits++;
    if(current.credits<p.years)return;
    const honors=mark>=86;
    if(p.level==='certificate'&&records(l).some(r=>r.id==='legacy-craft')&&!l.sim.degrees.includes('Trade certificate')){
      l.sim.degrees.push('Trade certificate');
    }
    if(!l.sim.transcript)l.sim.transcript=[];
    if(!hasProgram(l,p.id))l.sim.transcript.push({id:p.id,year:year(l),honors});
    if(!l.sim.degrees.includes(p.title))l.sim.degrees.push(p.title);
    if(p.level==='certificate'){l.world.tradeQualified=true;if(!l.world.credential)l.world.credential='trade';}
    if(['bachelor','master','doctorate','professional'].includes(p.level)){
      if(l.world.credential==='trade')l.world.tradeQualified=true;
      l.world.credential='college';
      if(p.level==='bachelor')l.sim.degree=p.title;
      if(p.level==='professional')l.sim.professional=p.field==='medicine'?'Medicine':p.field==='law'?'Law':p.title;
    }
    if(honors&&!l.sim.lifeTags.includes('academic-honors'))l.sim.lifeTags.push('academic-honors');
    leave(l,ctx);
    result(l,ctx,'Qualified in '+p.title,'I completed '+p.title+(honors?' with honors.':'.'),{joy:honors?5:3});
  }
  function validate(l){
    const pension=l.sim.studyPension;
    if(pension!==undefined&&(!Number.isSafeInteger(pension)||pension<0||l.age<18||l.job!=='student'||!l.sim.program?.pathway))throw Error('Invalid retired student pension.');
    const reentry=l.sim.academicReturn;
    if(reentry!==undefined){
      const keys=new Set(Object.values(programs).map(p=>p.field+'/'+p.level));
      if(!reentry||typeof reentry!=='object'||Array.isArray(reentry)||Object.entries(reentry).some(([key,y])=>!keys.has(key)||!Number.isSafeInteger(y)||y<l.born+18||y>year(l)))throw Error('Invalid academic readmission record.');
    }
    const list=l.sim.transcript;
    if(list!==undefined&&(!Array.isArray(list)||list.length>Object.keys(programs).length||list.some(r=>!r||!own(programs,r.id)||!Number.isSafeInteger(r.year)||r.year<l.born+18||r.year>year(l)||typeof r.honors!=='boolean')||new Set(list.map(r=>r.id)).size!==list.length))throw Error('Invalid academic transcript.');
    const p=l.sim.program;
    if(!p)return;
    if(p.pathway===undefined){
      if(!['general','arts','business','science','medicine','law'].includes(p.field))throw Error('Unknown academic enrollment.');
      return;
    }
    const spec=programs[p.field];
    if(p.pathway!==true||!spec||!Number.isSafeInteger(p.start)||p.start<l.born+18||p.start>year(l)||!Number.isSafeInteger(p.lastYear)||p.lastYear<p.start||p.lastYear>year(l)||!Number.isInteger(p.end)||p.end<l.age||!Number.isInteger(p.credits)||p.credits<0||p.credits>=spec.years||![0,1].includes(p.campus)||!methodIds.includes(p.funding)||typeof p.probation!=='boolean')throw Error('Invalid academic enrollment.');
  }
  root.PocketEducation={programs,levels,eligible,records,attainment,hasProgram,hasCredential,quote,methods,apply,action,actions,school,annual,validate};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
