/* Life systems shared by the journal, command menus and birthday simulation. */
(function(root){
  'use strict';
  const PocketKinship=typeof module!=='undefined'&&module.exports?require('./kinship.js').PocketKinship:root.PocketKinship;
  const PocketExpansion=typeof module!=='undefined'&&module.exports?require('./expansion.js').PocketExpansion:root.PocketExpansion;
  const PocketExpansionData=typeof module!=='undefined'&&module.exports?require('./expansion-data.js').PocketExpansionData:root.PocketExpansionData;
  const PocketEconomy=typeof module!=='undefined'&&module.exports?require('./economy.js').PocketEconomy:root.PocketEconomy;
  const M=typeof module!=='undefined'&&module.exports?require('./model.js').PocketModel:root.PocketModel;
  const shopping=typeof module!=='undefined'&&module.exports?require('./market.js').PocketMarket:root.PocketMarket;
  const era=typeof module!=='undefined'&&module.exports?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  const early=life=>era.historical(life);
  function householdPrice(l,modern,portion){
    if(!early(l))return modern;
    const p=era.profile(l);
    return Math.max(1,Math.round(p.food*p.cost*portion));
  }
  const familyCost=l=>householdPrice(l,400,.08);
  const dateCost=l=>l.age<18||early(l)?0:35;
  const introductionCost=15;
  const giftCost=l=>householdPrice(l,25,.005);
  const moneyGift=l=>householdPrice(l,50,.012);
  const weddingCost=l=>householdPrice(l,120,.035);
  const market=shopping.catalog;
  const openings={
    barista:['Corner Café','any',0],cashier:['Bay Market','any',0],custodian:['City Services','any',0],
    courier:['Parcel Line','any',0],assistant:['West & North','any',0],receptionist:['Bell Hotel','any',0],
    manager:['Corner Shop','work',0],organizer:['Town Hall','any',0],photographer:['The Weekly','any',0],
    baker:['Dawn Bakery','trade',0],electrician:['Coastal Electric','trade',0],luthier:['Bridge Street Strings','trade',0],
    teacher:['Community School','college',0],researcher:['Field Station','college',0],designer:['Paperhouse Press','college',0],
    developer:['Pixel Foundry','college',65],performer:['Harbor Arts','stage',0],guide:['Greenway Tours','any',0],physician:['Westside Hospital','medicine',65],
    lawyer:['Town Chambers','law',65],nurse:['Riverside Clinic','science',55],journalist:['The Evening Post','college',45],
    actor:['Lantern Theatre','stage',0],athlete:['City Athletics','athletics',0],chef:['Sunday Kitchen','trade',0],accountant:['West & North','business',50]
  };
  for(const [id,p] of Object.entries(PocketExpansionData.professions))openings[id]=[p[2],p[3],p[4]];
  const parts={paper:['Paper route',260],cafe:['Saturday café',460],odd:['Neighborhood odd jobs',340]};
  const partEmployers={paper:'The Weekly',cafe:'Corner Café',odd:'Neighborhood households'};
  const dates=['Arden','Parker','Rio','Frankie','Wren','Cameron','Taylor','Indigo','Harper','Dylan'];
  const kids=['Skye','Milo','Ira','Sunny','Cory','Mae','Finley','Remi'];
  const partnerRoles=['Partner','Engaged partner','Spouse'];
  function createWorld(api){
    const {jobs,apply,log,clamp,random,rngItem,actionReason,keepsake,cleanName}=api;
    function initialize(life){
      if(!life.world){
        life.world={grade:clamp(Math.round((life.stats.smarts+58)/2)),performance:56,level:0,since:life.job?life.age:0,
          partJob:null,reputation:0,owned:{},events:[],scheduled:{},credential:null,customCareer:false,lastPartner:0,childCount:0};
        if(life.age>=22 && ['college','trade'].includes(life.track))life.world.credential=life.track;
        if(life.people.love.role==='Partner')life.people.love.since=Math.min(life.age,25);
      }
    }
    function schedule(life,id,inYears,person){
      const w=life.world,token=id+(person?'-'+person:'');
      if(w.scheduled[token])return;
      w.scheduled[token]=true;w.events.push({id,at:life.age+inYears,person:person||null,token});
    }
    function nextEvent(life){
      const w=life.world;
      for(let i=0;i<w.events.length;){
        const event=w.events[i];
        if(event.at>life.age){i++;continue;}
        w.events.splice(i,1);
        if(event.id==='first-keys'&&!Object.entries(w.owned).some(([id,asset])=>shopping.ownedItem(id,asset).category==='Property')){
          delete w.scheduled[event.token];continue;
        }
        return event;
      }
      return null;
    }
    function metrics(life,effects){
      const w=life.world,actual={};
      for(const k of ['grade','performance','reputation']){
        if(effects[k]){const before=w[k];w[k]=clamp(before+effects[k]);if(before!==w[k])actual[k]=w[k]-before;}
      }
      return actual;
    }
    function changeJob(life,id,custom){
      if(life.job===id){life.world.customCareer=!!custom;return;}
      if(life.sim?.expansion){delete life.sim.expansion.employer;life.sim.expansion.discipline=0;}
      life.job=id;life.world.contractRole=id;delete life.world.legacyPayFactor;life.extraPay=0;life.world.level=0;life.world.performance=56;life.world.since=life.age;
      life.world.customCareer=!!custom;if(life.hidden)api.staff(life);
    }
    function transferEmployer(life,name){
      life.sim.expansion.employer=name;life.world.since=life.age;life.world.performance=58;
      life.sim.staffJob=null;api.staff(life);
    }
    function setShift(life,id){
      const w=life.world;if(id&&life.sim.timeline)delete life.sim.timeline.youthShift;
      if(w.partJob===id)return;
      w.partJob=id;w.partSince=id?life.age:null;
    }
    function periodAssetIndex(life,item,age,field){
      const town=item.town||life.town,y=life.born+age;
      if(y>=2000&&item.listedYear<2000){
        // Earlier deeds keep their appraisal basis when digital-era listings
        // begin quoting the modern urban land and goods markets.
        const last=era.profile(life,1999-life.born,town)[field];
        return last*era.profile(life,age,town)[field]/era.profile(life,2000-life.born,town)[field];
      }
      return era.profile(life,age,town)[field];
    }
    function appraisal(life,id,age=life.age+1){
      const asset=life.world.owned[id];if(!asset)return null;
      const item=shopping.ownedItem(id,asset),property=item.category==='Property',vehicle=item.category==='Vehicle';
      const condition=asset.condition??90,share=asset.share||1;
      const nextCondition=Math.max(item.historical?10:12,condition-(property?item.historical?1:2:vehicle&&!item.historical?5:2));
      const town=item.town||life.town,y=life.born+age;
      let market=1;
      if(item.historical){
        const field=property?'home':'cost';
        market=periodAssetIndex(life,item,age,field)/periodAssetIndex(life,item,age-1,field);
      }else if(life.sim.expansion){
        const field=property?'home':vehicle?'vehicle':'priceIndex';
        market=PocketEconomy.local(life,town,age)[field]/PocketEconomy.local(life,town,age-1)[field];
      }
      // The purchase already paid for its location. Apply only the change in
      // the local market and condition since last year to the assessed value.
      const quality=n=>.55+.0045*n;
      const years=Math.max(0,y-(item.built||y));
      const vintage=n=>1+.18*(1-Math.exp(-Math.max(0,n)/80));
      const realReturn=property?vintage(years)/vintage(years-1):1+(item.change||0);
      const salvage=property?1:Math.max(1,Math.round(item.price*share*(vehicle?.055:.025)));
      const value=Math.max(salvage,Math.round(asset.value*market*realReturn*quality(nextCondition)/quality(condition)));
      return {value,condition:nextCondition};
    }
    function birthday(life){
      const w=life.world;
      if(life.age>18&&w.experienceYear!==life.born+life.age&&life.job&&!life.sim.prison&&!['student','retired'].includes(life.job)){
        const experience=w.roleYears||(w.roleYears={});
        experience[life.job]=(experience[life.job]||0)+1;w.experienceYear=life.born+life.age;
      }
      if(life.age===18)setShift(life,null);
      if(life.job==='trainee'&&life.age>=w.since+4&&w.credential!=='trade'){
        w.credential='trade';w.tradeQualified=true;
        log(life,'School','Earned a trade certificate','My apprenticeship is complete. Skilled trade vacancies are now open to me.');
      }
      if(life.age<=18)w.grade=clamp(w.grade+Math.round((64-w.grade)*.07));
      if(life.job)w.performance=clamp(w.performance+Math.round((60-w.performance)*.06));
      for(const [id,asset] of Object.entries(w.owned)){
        const item=shopping.ownedItem(id,asset);
        if(item.type==='era-horse'&&life.born+life.age-item.built>22+M.hash(id)%10){
          delete w.owned[id];log(life,'Assets','Horse died','My riding horse died. I kept the saddle.');continue;
        }
        if(Number.isFinite(asset.odometer)&&life.sim.license&&!life.sim.prison)asset.odometer+=3000+M.hash(id+'/'+life.age+'/miles')%8501;
        Object.assign(asset,appraisal(life,id,life.age));
      }
    }
    function homeId(life){
      return Object.keys(life.world.owned).find(id=>{
        const asset=life.world.owned[id], item=shopping.ownedItem(id,asset);
        return item.category==='Property'&&!item.commercial&&!asset.tenant&&!asset.vacant&&(!item.town||item.town===life.town);
      });
    }
    function propertyUse(life,id){
      const asset=life.world.owned[id], item=shopping.ownedItem(id,asset);
      if(!asset||item.category!=='Property')return '';
      return asset.tenant?'Rented out':homeId(life)===id?'Live here':item.commercial&&!asset.vacant?'Operating':'Vacant';
    }
    function assetRent(life,id,asset,age=life.age){
      const item=shopping.ownedItem(id,asset);if(!item.rent||asset.vacant||(item.category==='Property'&&!item.commercial&&!asset.tenant))return 0;
      const index=item.rentIndex?PocketEconomy.local(life,item.town||life.town,age).cost/item.rentIndex:
        item.historical?periodAssetIndex(life,item,age,'cost')/periodAssetIndex(life,item,item.listedYear-life.born,'cost'):1;
      return Math.floor(item.rent*(asset.share||1)*(asset.condition<45?.6:1)*(asset.tenant?1.38:1)*(1+(asset.renovations||0)*.13)*index);
    }
    function rent(life,age=life.age){return Object.entries(life.world.owned).reduce((n,[id,a])=>n+assetRent(life,id,a,age),0);}
    function extras(life){
      if(life.age>=18)return rent(life);
      const shift=parts[life.world.partJob];
      return shift?shift[1]:0;
    }
    function possessions(life){return Object.values(life.world.owned).reduce((n,a)=>n+a.value,0);}
    function separationAmount(life){return life.people.love.role==='Spouse'?Math.floor(life.cash/2):0;}
    function netWorth(life){
      const debt=life.sim?Object.values(life.sim.loans).reduce((n,loan)=>n+loan.balance,0):0;
      return life.cash+(life.sim?life.sim.trust+(life.sim.fund||0):0)+possessions(life)+PocketExpansion.portfolio(life)+PocketExpansion.companyValue(life)+(life.sim?.expansion?.dispute?.amount||0)-debt;
    }
    function possessionReason(life,id,side){
      if(!['buy','sell'].includes(side))return 'Unavailable';
      if(life.ended)return 'Life complete';
      if(api.blocking(life))return 'Finish the current decision';
      if(life.sim.prison||life.sim.court)return 'Unavailable during legal proceedings';
      const own=life.world.owned[id];
      if(side==='sell'){
        if(!own)return 'Already sold';if(own.inherited&&life.age<18)return 'Held until 18';
        const loan=life.sim.loans[id];return loan&&loan.balance>own.value+life.cash?'Insufficient equity':'';
      }
      if(own)return 'Already owned';
      const item=shopping.offer(life,id);
      if(!item)return 'Listing no longer available';
      if(item.category==='Vehicle'&&!life.sim.license)return 'Driver’s license required';
      if(life.cash<item.price)return 'Save '+era.money(life,item.price-life.cash)+' more';
      return '';
    }
    function trade(life,id,side){
      if(possessionReason(life,id,side))return null;
      const w=life.world,loan=life.sim.loans[id],item=side==='buy'?shopping.offer(life,id):shopping.ownedItem(id,w.owned[id]);
      const amount=side==='buy'?-item.price:w.owned[id].value-(loan?loan.balance:0);
      if(side==='buy'){
        shopping.take(life,item);
        if(item.category==='Property')schedule(life,'first-keys',1);
      }else{delete w.owned[id];delete life.sim.loans[id];}
      // Move the purchase price or resale value between assets and cash.
      life.cash+=amount;
      const delta={cash:amount};
      const name=shopping.inSentence(item),title=(side==='buy'?'Bought ':'Sold ')+name;
      const text=side==='buy'?'I bought '+name+' for '+era.money(life,item.price)+'.':loan?'I sold '+name+' and settled its loan. My bank balance changed by '+era.money(life,amount)+'.':'I sold '+name+' for '+era.money(life,amount)+'.';
      log(life,'Assets',title,text,delta);
      return {title,text,delta};
    }
    function repairQuote(life,id){
      const a=life.world.owned[id];return a?Math.max(15,Math.round(shopping.ownedItem(id,a).price*(a.share||1)*(100-a.condition)*.00035)):0;
    }
    function repairReason(life,id){
      const a=life.world.owned[id];if(!a||a.condition>=100)return 'Already in full condition';
      if(a.inherited&&life.age<18)return 'Held until 18';return actionReason(life,'repair-'+id,repairQuote(life,id));
    }
    function repair(life,id){
      if(repairReason(life,id))return null;const a=life.world.owned[id],cost=repairQuote(life,id);a.condition=100;
      a.value+=Math.floor(cost*.45);return commit(life,'repair-'+id,'Assets','Repairs complete',shopping.title(shopping.ownedItem(id,a))+' is back in full condition.',{cash:-cost},{});
    }
    function commit(life,key,kind,title,text,effects,progress){
      life.used.push(key);
      const delta=Object.assign(apply(life,effects||{}),metrics(life,progress||{}));
      log(life,kind,title,text,delta);return {title,text,delta};
    }
    function payBase(l){
      const base=PocketEconomy.contractBase(l,l.job,jobs);
      return l.job?.startsWith('faith-')&&early(l)?base*era.profile(l).food/7500:base;
    }
    function reviewReason(l,promotion=false){return era.reviewReason(l,payBase(l),promotion);}
    function settleReview(l,rate,approved,promotion=false){return era.settleReview(l,payBase(l),rate,approved,promotion);}
    function careerOptions(life){
      if(early(life))return [];
      const age=life.age,w=life.world,job=life.job,rows=[];
      function option(id,title,desc,icon,blocked){
        rows.push({id,title,desc,icon,reason:blocked||actionReason(life,'career-'+id)});
      }
      if(age<5){option('discover','Explore the toy box','Practice noticing patterns and shapes.','grid');return rows;}
      if((age<18&&!life.sim.dropped) || job==='student'){
        option('study','Study harder','Build your grades and smarts.','book');
        if(age>=7 && age<17)option('science','Enter the science fair','Build a working circuit for the town exhibition.','flask',w.scheduled['project-invite']?'Already entered':'');
        if(age>=14 && age<18){
          for(const [id,[name,pay]] of Object.entries(parts)){
            option(id,name,'Part-time · '+era.money(life,pay)+' a year, paid on your next birthday.',id==='paper'?'newspaper':id==='odd'?'tools':'coffee',w.partJob===id?'Current job':'');
          }
          if(w.partJob)option('leave-shift','Leave your part-time job','Stop receiving this job’s birthday paycheck.','exit');
        }
        return rows;
      }
      if(age<18){if(age>=14){for(const [key,[name,pay]] of Object.entries(parts))option(key,name,'Part-time · '+era.money(life,pay)+' a year.','coin',w.partJob===key?'Current job':'');if(w.partJob)option('leave-shift','Leave your shift','Stop future paychecks.','exit');}return rows;}
      if(job==='retired'){option('mentor','Mentor a newcomer','Give a young worker the time someone once gave you.','people');return rows;}
      if(job){
        option('practice',job==='trainee'?'Practice your trade':'Put in extra effort','Raise performance at a small cost to your energy.',job==='trainee'?'tools':'bag');
        if(!['trainee','parttime'].includes(job))option('promote','Ask for a promotion','Earn a permanent pay rise in this role.','trend',reviewReason(life,true));
      }else option('train','Take a skills workshop','Build your smarts while exploring the job board.','book');
      return rows;
    }
    function career(life,id){
      const item=careerOptions(life).find(x=>x.id===id);if(!item||item.reason)return null;
      const key='career-'+id,kind=life.age<18||life.job==='student'?'School':'Career',w=life.world;
      const go=(title,body,effects,gains)=>commit(life,key,kind,title,body,effects,gains);
      if(id==='discover')return go('The shape sorter','The square block fit. I tested it twice.',{smarts:4,joy:2},{grade:2});
      if(id==='study')return go('An extra hour of study','I studied an extra hour. The quiz noticed.',{smarts:5,joy:-1},{grade:10});
      if(id==='science'){schedule(life,'project-invite',2);return go('A working circuit','The circuit worked. The museum took my name.',{smarts:6},{grade:8});}
      if(id==='leave-shift'){
        const name=parts[w.partJob][0];setShift(life,null);
        return go('Last shift · '+name,'I hand in my notice and finish my last shift.',{},{});
      }
      if(parts[id]){setShift(life,id);return go('Started a part-time job',parts[id][0]+' pays '+era.money(life,parts[id][1])+' on my next birthday.',{bonds:2},{});}
      if(id==='promote'){
        settleReview(life,.095,true,true);
        return go('Promoted at work','I moved up to rank '+(w.level+1)+'. Annual pay is '+era.money(life,PocketEconomy.salary(life,life.job,jobs))+'.',{joy:7},{performance:-9});
      }
      if(id==='practice')return go('A good day at work','I finish the job that everybody else had been putting off.',{smarts:3,health:-2},{performance:16});
      if(id==='mentor')return go('Passed on a skill','My protégé texts a picture of their first finished project.',{bonds:6,joy:3},{reputation:3});
      return go('Skills workshop','I leave with a new skill and a page of useful contacts.',{smarts:6,bonds:2},{performance:6});
    }
    function jobReason(life,id){
      if(early(life))return "This opening is unavailable this year";
      const row=openings[id];if(!row)return 'Unavailable';
      if(life.ended)return 'Life complete';
      if(life.job===id)return 'Current job';
      if(life.age<18)return 'Opens at 18';
      if(id==='courier'&&!life.sim.license)return 'Driver’s license required';
      if(life.sim.program)return 'Finish or leave your course';
      if(life.job==='trainee'&&life.world.credential!=='trade'&&!life.world.tradeQualified)return 'Finish or leave your apprenticeship';
      if(life.sim.record&&['physician','lawyer'].includes(id))return 'Clean record required';
      const years=life.sim.workYears||0;
      const apprenticeship={dispatcher:1,photographer:1,organizer:2,manager:3,chef:4,engineerqa:2,architect:2,engineer:2,pharmacist:2};
      const need=apprenticeship[id]||0;
      if(years<need)return 'Needs '+need+' '+(need===1?'year':'years')+' of work experience';
      if(id==='manager'&&life.world.performance<70&&!life.sim.expansion?.certs.includes('Commerce')&&life.sim.degree!=='Business')return 'Needs 70% work performance, a business degree or financial certification';
      if(row[1]==='medicine'&&life.sim.professional!=='Medicine')return 'Medical degree required';
      if(row[1]==='law'&&life.sim.professional!=='Law')return 'Law degree required';
      if(row[1]==='business'&&!['Business','General studies'].includes(life.sim.degree))return 'Business degree required';
      if(row[1]==='science'&&!['Science','General studies'].includes(life.sim.degree))return 'Science degree required';
      if(row[1]==='athletics'){
        if(life.stats.health<80)return 'Needs 80% health';
        const running=life.sim.expansion?.hobbies?.running||0;
        if(running<55&&!(life.sim.activities.includes('track')&&running>=25))return 'Needs 55 running skill, or track club and 25 running skill';
        if(life.world.reputation<12)return 'Needs 12% reputation';
      }
      if(life.used.includes('application-'+id))return 'Applied this year';
      if(row[1]==='college' && life.world.credential!=='college' && !life.sim.degree)return 'College degree required';
      if(row[1]==='trade' && life.world.credential!=='trade' && !life.world.tradeQualified)return 'Trade certificate required';
      if(row[1]==='stage' && life.world.reputation<15)return 'Needs 15% reputation';
      if(row[2] && life.stats.smarts<row[2])return 'Needs '+row[2]+'% smarts';
      if(life.sim.expansion){
        const paper=PocketEconomy.papers(life,life.town);
        if(!paper.citizen&&!paper.valid)return 'Renew your work authorization';
        if(!paper.citizen&&paper.permit?.kind==='Study visa')return 'A work or settlement visa is required';
        if(['pharmacist','therapist','auditor'].includes(id)&&life.sim.record)return 'Clean record required';
        if(life.sim.record&&['dispatcher','manager','director','executive'].includes(id)&&!M.hasWorkReference(life))return 'Needs a post-sentence work reference';
        if(id==='director'&&(years<7||life.world.reputation<15||life.world.performance<70))return 'Needs 7 years of work, 15% reputation and 70% performance';
        if(id==='executive'&&(years<12||life.world.reputation<30||life.world.performance<78||!life.sim.expansion.certs.includes('Commerce')))return 'Needs 12 years, 78% performance, 30% reputation and financial certification';
        if(id==='director'||id==='executive'){
          const yearsAt=key=>life.world.roleYears?.[key]??(life.job===key?Math.max(0,life.age-life.world.since):0);
          const ledCompany=Object.values(life.sim.expansion.companies).some(c=>c.level>=3&&c.clients>=3);
          if(id==='director'&&yearsAt('manager')<2&&life.world.level<2&&!ledCompany)return 'Needs supervisory experience or an established enterprise';
          if(id==='executive'&&yearsAt('director')<2&&yearsAt('manager')<6&&!ledCompany)return 'Needs director experience, 6 years as a manager or an established enterprise';
        }
        const local=PocketEconomy.local(life),sector=PocketExpansionData.sector(id);
        if(id!=='barista'&&local.sector!==sector&&PocketEconomy.sample(life.town,id+'/'+local.year)<local.unemployment*(local.decline===sector?2:1))return 'No vacancy this year';
      }
      if(id!=='barista'&&(M.hash(life.id+'/'+id)%5+life.age)%5===0)return 'No vacancy this year';
      return actionReason(life,'job-change');
    }
    function hire(life,id){
      if(jobReason(life,id))return null;
      changeJob(life,id,true);
      return commit(life,'job-change','Career','Hired as '+jobs[id][0].toLowerCase(),
        'My first day at '+openings[id][0]+' is on the calendar. Annual salary is '+era.money(life,PocketEconomy.salary(life,id,jobs))+'.',{joy:4},{});
    }
    function interview(life,id,answer){
      if(jobReason(life,id)||!['example','honest','bluff'].includes(answer))return null;
      const chance=answer==='example'?.87:answer==='honest'?.68:.25;
      if(random(life)<Math.min(.98,chance+(life.stats.smarts-50)/300+(life.stats.looks-50)/550))return hire(life,id);
      return commit(life,'application-'+id,'Career','My application was declined',
        openings[id][0]+' filled the vacancy. I can apply elsewhere this year.',{joy:-2},{});
    }
    function specialActivities(life){
      const a=[],age=life.age,own=life.world.owned;
      if(age>=8)a.push(['style','Try a new look','Experiment with your style.','spark',{looks:6,joy:2},'Someone asked where I got the idea. I said it was mine.']);
      if(age>=12)a.push(['openmic','Play an open mic','Try a live set and start building a reputation.','mic',{},'']);
      if(age>=10 && age<18)a.push(['prank','Pull a harmless prank','See how your class takes a little mischief.','dice',{},'']);
      if(own.bike)a.push(['greenway','Ride the greenway','My bicycle opens the longer trail.','bike',{health:8,joy:3},'I rode the whole trail and walked the last hill.']);
      if(own.camera){
        if(age<18)a.push(['shoot','Practice portraits','Try photographing a friend in natural light.','camera',{smarts:3},'My friend picked the one unposed photo.']);
        else a.push(['shoot','Book a portrait session','Use your camera to earn '+era.money(life,220)+'.','camera',{cash:220,smarts:3},'My client buys the photograph with the accidental laugh.']);
      }
      const vehicles=Object.entries(own).map(([id,a])=>shopping.ownedItem(id,a)).filter(item=>item.category==='Vehicle');
      if(vehicles.length&&life.sim.license)a.push(['road','Take a road trip','Spend '+era.money(life,45)+' on fuel and pick a turnoff.','car',{cash:-45,joy:9,bonds:3},'I spent '+era.money(life,45)+' on fuel and stopped for pie.']);
      if(vehicles.some(item=>item.type==='van'))a.push(['supper','Host a camper supper','Make room for four more around a folding table.','bowl',{joy:5,bonds:7},'Everybody brings a plate. Somehow all four are dessert.']);
      return a;
    }
    function special(life,key){
      if(key==='openmic'){
        schedule(life,'festival-invite',3);
        const fee=life.world.owned.keys?140:65;
        return commit(life,key,'Activity','The open mic','The back row sang along. Someone kept a recording.',{cash:fee,joy:5},{reputation:8});
      }
      if(key==='prank'){
        const laughed=random(life)<.60;
        return commit(life,key,'Activity','The rubber duck incident',laughed?'The head teacher finds the row of rubber ducks extremely funny. One stays on the desk.':'The head teacher made me collect every duck before lunch.',laughed?{joy:7,bonds:3}:{joy:-3,smarts:2},laughed?{reputation:3}:{grade:-4});
      }
      return null;
    }
    function isPartner(life){return life.people.love.active&&partnerRoles.includes(life.people.love.role);}
    function familyReason(life){
      if(life.ended)return 'Life complete';
      if(life.age<21)return 'Opens at 21';
      if(life.world.childCount+(life.sim.expecting?1:0)>=5)return 'Family is full';
      return actionReason(life,'adopt',familyCost(life));
    }
    function adopt(life,input){
      if(familyReason(life))return null;
      const w=life.world, key='kid'+(++w.childCount),name=cleanName(input)||rngItem(life,kids);
      life.people[key]={name,role:'Child',bond:74,active:true,met:true,bornAt:life.age,birthTown:life.town,otherParent:isPartner(life)?life.people.love.name:null};
      if(life.sim.expansion){
        const child=life.people[key];child.town=life.town;if(isPartner(life))child.otherParentId=life.people.love.id;
        M.person(life,key,child);PocketKinship.sync(life);
      }
      if(!early(life))schedule(life,'first-curtain',5,key);
      return commit(life,'adopt','Family','Welcomed '+name,'I bring '+name+' home. A very small sock is missing before bedtime.',{cash:-familyCost(life),bonds:8,joy:6},{});
    }
    function dateReason(life){
      if(life.ended)return 'Life complete';
      if(life.age<14)return 'Opens at 14';
      if(isPartner(life))return 'In a relationship';
      if(life.event && life.event.id==='coffee' && !life.event.resolved)return 'Answer this year’s invitation first';
      return actionReason(life,'date',dateCost(life));
    }
    function meet(life){
      if(dateReason(life))return null;
      const w=life.world,old=life.people.love;
      if(old.met){life.people['past'+(++w.lastPartner)]=Object.assign({},old);}
      const taken=Object.values(life.people).map(p=>p.name);
      const available=dates.filter(n=>!taken.includes(n));const name=rngItem(life,available.length?available:dates);
      life.people.love={name,role:'Partner',bond:54,active:true,met:true,since:life.age,bornYear:life.born};
      return commit(life,'date','People','A first date with '+name,early(life)?'We took the long way home. We agreed to do it again.':life.age<18?'I walked home together. A second date made the schedule.':'Coffee cost '+era.money(life,dateCost(life))+'. A second date was agreed.',{cash:-dateCost(life),joy:5,bonds:4},{});
    }
    function matches(l){
      if(l.sim.timeline?.historicalRules&&l.born+l.age<2009)return [];
      return [0,1,2].map(i=>{
        const h=M.hash(l.id+'/'+l.age+'/dating/'+i),name=dates[(h%dates.length+i)%dates.length];
        const last=['King','Bell','Wood','Lane','Chen','Reed','Shah'][(h>>>10)%7],age=Math.max(18,l.age+(h%11)-5);
        return {id:'match-'+l.age+'-'+i,name,fullName:name+' '+last,age,
          gender:['woman','man','nonbinary'][(h>>>7)%3],trait:['patient','blunt','generous','frugal','easygoing'][(h>>>12)%5],
          job:['Editor','Electrician','Office clerk','Chef','Manager','Artist'][(h>>>15)%6]};
      });
    }
    function matchReason(l,index){
      if(l.sim.timeline?.historicalRules&&l.born+l.age<2009)return 'Dating apps are unavailable this year';
      if(!Number.isInteger(index)||index<0||index>2)return 'Unknown profile';
      if(l.age<18)return 'Opens at 18';if(isPartner(l))return 'In a relationship';
      return actionReason(l,'app-match-'+index,introductionCost);
    }
    function match(l,index){
      if(matchReason(l,index))return null;const m=matches(l)[index],yes=random(l)<.32+(l.stats.looks+l.stats.smarts)*.0025;
      if(yes){
        const old=l.people.love;if(old.met)l.people['past'+(++l.world.lastPartner)]={...old};
        l.people.love={id:m.id+'-'+l.id,name:m.name,fullName:m.fullName,role:'Partner',bond:53,active:true,met:true,since:l.age,gender:m.gender,bornYear:l.born+l.age-m.age,job:m.job,traits:[m.trait]};
      }
      return commit(l,'app-match-'+index,'People',yes?'Matched with '+m.name:'No reply',yes?'I met '+m.fullName+' for coffee. Both phones went back in pockets.':'The app marked my message as seen. That was the whole conversation.',{cash:-introductionCost,joy:yes?5:-2},{});
    }
    function interviewPrompt(id){
      const opening=openings[id];if(!opening)return null;const group=opening[1];
      let question='A teammate is behind on a deadline. What do you do?',example='Describe a time you split the work',honest='Ask what they need';
      if(['medicine','science'].includes(group)){question='A patient is worried about the next visit. How do you respond?';example='Describe a similar conversation';honest='Listen and check the care plan';}
      if(['trade','athletics','stage'].includes(group)){question='Something goes wrong just before a deadline. What do you do?';example='Describe how you fixed a past mistake';honest='Tell the team and ask for help';}
      return {question,answers:[['example',example,'journal'],['honest',honest,'chat'],['bluff','Claim this never happens to you','spark']]};
    }
    const visitGain=10;
    function visitEffects(life,count){
      const previous=life.used.filter(key=>key.startsWith('visit-')).length;
      // Keep individual bonds independent. A large family shares one social afternoon.
      const total=(n,initial)=>Math.min(n,2)*initial+Math.min(4,Math.max(0,n-2));
      return {joy:total(previous+count,3)-total(previous,3),bonds:total(previous+count,5)-total(previous,5)};
    }
    function inContact(p){return p&&p.met&&p.active&&!p.cutOff&&M.isAlive(p);}
    function changeBond(life,p,interaction,gain){
      const previous=p.bond;
      p.bond=clamp(previous+gain);
      if(life.sim.expansion)PocketKinship.remember(life,p,interaction,gain);
      return p.bond-previous;
    }
    function visitPlan(life){
      const keys=[],seen=new Set();
      if(life.ended||api.blocking(life))return {keys,reason:life.ended?'Life complete':'Finish the current decision'};
      for(const [key,p] of Object.entries(life.people)){
        if(!inContact(p)||seen.has(p.id||key))continue;
        seen.add(p.id||key);
        if(!actionReason(life,'visit-'+key))keys.push(key);
      }
      const reason=keys.length?'':seen.size?'Everyone has used their visits this year':'No one is available';
      return {keys,reason};
    }
    function visitAll(life){
      const {keys,reason}=visitPlan(life);if(reason)return null;
      const effects=visitEffects(life,keys.length);
      let closer=0;
      for(const key of keys){
        if(changeBond(life,life.people[key],'visit',visitGain)>0)closer++;
        life.used.push('visit-'+key);
      }
      const count=keys.length,who=count===1?life.people[keys[0]].name:count+' people';
      const title='Spent time with everyone';
      let outcome='We were already close.';
      if(closer===count)outcome=count===1?'We grew a little closer.':'Everyone felt a little closer.';
      else if(closer)outcome=closer===1?'One relationship grew closer.':closer+' relationships grew closer.';
      const text='I caught up with '+who+'. '+outcome;
      const delta=apply(life,effects);
      log(life,'People',title,text,delta);
      return {title,text,delta,count,closer};
    }
    function socialOptions(life,key){
      const person=life.people[key];if(!inContact(person))return [];
      const items=[];
      function add(id,title,text,ic,block,cost){
        const used=id==='visit'?'visit-'+key:'social-'+key+'-'+id;
        items.push({id,title,desc:text,icon:ic,reason:block||actionReason(life,used,cost||0)});
      }
      if(person.atSchool&&person.job==='Student'){
        if(person.role==='Classmate')add('befriend','Befriend','Ask to hang out after class.','people');
        add('study-pair','Study together','Prepare for the next test together.','book');
      }
      if(person.atSchool&&person.role==='Teacher')add('help-school','Ask for extra help','Work through a subject after class.','school');
      if(person.role==='Boss')add('feedback','Ask for feedback','Discuss your performance with your supervisor.','bag');
      if(person.role==='Coworker')add('collaborate','Work together','Share a task with your colleague.','tools');
      add('visit','Spend time together','Give each other an unhurried afternoon.','people');
      if(life.age>=4)add('compliment','Give a compliment','Tell them something you appreciate.','heart');
      if(life.age>=10)add('argue','Pick an argument','Say the thing that has been bothering you.','chat');
      if(life.age>=4)add('talk','Have a conversation','Ask about their week.','chat');
      if(life.age>=8){add('gift','Give a gift','Choose a gift worth '+era.money(life,giftCost(life))+'.','gift','',giftCost(life));add('money','Give money','Give them '+era.money(life,moneyGift(life))+'.','wallet','',moneyGift(life));}
      if(life.age>=8)add('insult','Insult','Say something they will remember.','bolt');
      const age=M.ageOf(life,person),eligible=life.age>=14&&((life.age>=18&&age>=18)||(life.age<18&&age>=14&&age<18&&Math.abs(age-life.age)<=2));
      if(eligible&&!M.isFamily(person)&&!isPartner(life)&&!['Former spouse','Former partner','Boss','Former boss','Teacher','Former teacher'].includes(person.role))
        add('askout','Ask out','Ask if this could be a date.','heart');
      if(life.age>=12&&(!M.isFamily(person)||life.age>=18)&&person.role!=='Child'&&!(key==='love'&&isPartner(life)))
        add('cutoff','Cut off contact','End contact with this person.','exit');
      if(key==='love'&&isPartner(life)){
        if(life.age>=18&&person.role==='Partner')add('propose','Propose','Ask if they want to build a life together.','rings',person.bond<70?'Needs 70% closeness':life.age<=person.since?'Give it a year':'');
        if(person.role==='Engaged partner')add('marry','Get married','A ceremony costs '+era.money(life,weddingCost(life))+'.','rings',life.age<=person.engagedAt?'Plan for next year':'',weddingCost(life));
        add('separate',person.role==='Spouse'?'File for divorce':'End the relationship',person.role==='Spouse'?'Divide your current bank balance equally.':'Close this chapter together.','broken-heart');
      }
      return items;
    }
    function social(life,key,id){
      const option=socialOptions(life,key).find(x=>x.id===id);if(!option||option.reason)return null;
      const p=life.people[key],used=id==='visit'?'visit-'+key:'social-'+key+'-'+id;
      let title,text,delta={},progress={},bond=0;
      if(id==='befriend'){
        const yes=random(life)<.24+p.bond*.009;
        if(yes){p.role='Friend';p.befriended=true;}
        title=yes?'New friend':'Turned down';text=yes?'I made friends with '+p.name+' at school.':p.name+' already had plans. Apparently for the whole year.';
        bond=yes?12:-2;delta={joy:yes?5:-2};
      }else if(id==='study-pair'){
        title='Study session';text=p.name+' and I compared notes. Only one of us had the right chapter.';bond=6;progress={grade:5};delta={smarts:3,discipline:2};
      }else if(id==='help-school'){
        title='Extra help';text='I stayed after class with '+p.name+'. This time I understood the question.';bond=5;progress={grade:7};delta={smarts:3};
      }else if(id==='feedback'){
        title='Performance feedback';text='I asked '+p.name+' how I was doing. They brought a list.';bond=3;progress={performance:7};delta={discipline:2};
      }else if(id==='collaborate'){
        title='Worked together';text=p.name+' and I finished the job before anyone could schedule another meeting.';bond=6;progress={performance:4};delta={joy:2};
      }else if(id==='talk'){title='A conversation with '+p.name;text='I compared weeks. Theirs also contained a meeting.';bond=p.traits.includes('blunt')?6:8;delta={joy:2,bonds:3};}
      else if(id==='gift'||id==='money'){const amt=id==='gift'?giftCost(life):moneyGift(life);p.wealth+=id==='money'?amt:0;title=id==='gift'?'A gift for '+p.name:'Gave money to '+p.name;
        text=early(life)?(id==='gift'?'I carried the gift there in person.':'I counted the money twice.') :id==='gift'?'I spent '+era.money(life,amt)+'. They kept the gift receipt.':'I transferred '+era.money(life,amt)+'. They saw the notification.';bond=5+Math.floor(p.generosity/20);delta={cash:-amt,karma:3};}
      else if(id==='insult'){title='Insulted '+p.name;text='They heard me the first time.';bond=-12-Math.floor(p.craziness/20);delta={karma:-4,notoriety:2};}
      else if(id==='cutoff'){p.cutOff=true;p.active=false;title='Cut off '+p.name;text=early(life)?'I stopped visiting.':'I stopped returning their calls.';bond=-25;delta={joy:-2,willpower:3};}
      else if(id==='askout'){
        const yes=random(life)<.15+p.bond*.007+life.stats.looks*.001;
        if(yes){
          if(key!=='love'){const old=life.people.love;life.people.love=p;
            if(old.met)life.people[key]=old;else if(key==='friend')life.people[key]=Object.assign({},old,{role:'Childhood friend'});else delete life.people[key];}
          p.role='Partner';p.since=life.age;
        }
        title=yes?'Dating '+p.name:'Turned down';text=yes?'They said yes. I both checked my calendars.':p.name+' would rather keep things as they are.';bond=yes?9:-3;delta={joy:yes?6:-3};
      }else if(id==='visit'){
        title='Time with '+p.name;bond=visitGain;delta=visitEffects(life,1);
        text=life.age<2?p.name+' showed me the birds outside the kitchen window.':p.role==='Child'&&life.age-p.bornAt<5?p.name+' and I built a very unsteady tower of wooden blocks.':'I spent the afternoon with '+p.name+'. Only one of us checked the time.';
      }else if(id==='compliment'){
        title='A kind word for '+p.name;text='I complimented '+p.name+'. They asked me to repeat it.';bond=7;delta={bonds:4,joy:2};
      }else if(id==='argue'){
        title='An argument with '+p.name;text='We both kept receipts. Neither of us won.';bond=-15;delta={bonds:-5,joy:-3};
      }else if(id==='propose'){
        title='Engaged to '+p.name;text='They said yes. I got off the floor.';p.role='Engaged partner';p.engagedAt=life.age;bond=9;delta={joy:8,bonds:6};keepsake(life,'Engagement note');
      }else if(id==='marry'){
        title='Married '+p.name;text=early(life)?'Our families witnessed the ceremony. Everyone had an opinion about dinner.':'The registrar lent me a pen. That made it official.';p.role='Spouse';bond=9;delta={cash:-weddingCost(life),joy:8,bonds:7};keepsake(life,early(life)?'Wedding keepsake':'Town hall photograph');
      }else{
        const married=p.role==='Spouse',share=separationAmount(life);
        title=(married?'Divorced ':'Separated from ')+p.name;
        text=early(life)?(married?'We divided the household. My former spouse received '+era.money(life,share)+'.':'We parted company. The walk home was quiet.'):married?'I finalized the divorce. My former spouse received '+era.money(life,share)+' from my bank balance.':'I broke up. The shared playlist is now awkward.';
        if(married)p.wealth+=share;p.role=married?'Former spouse':'Former partner';p.active=false;bond=-20;delta={cash:-share,joy:-5,bonds:-4};
      }
      const closeness=changeBond(life,p,id,bond);
      if(life.sim.expansion){if(id==='marry')PocketKinship.partners(life,p);else if(id==='separate')PocketKinship.sync(life);}
      const result=commit(life,used,'People',title,text,delta,progress);
      result.closeness=closeness;return result;
    }
    return {initialize,familyCost,market,shopping,openings,parts,partEmployers,setShift,transferEmployer,schedule,nextEvent,metrics,changeJob,birthday,appraisal,rent,assetRent,homeId,propertyUse,extras,netWorth,
      possessions,separationAmount,reviewReason,settleReview,repair,repairReason,repairQuote,possessionReason,trade,careerOptions,career,jobReason,hire,interview,interviewPrompt,matches,matchReason,match,specialActivities,special,isPartner,familyReason,adopt,dateReason,meet,visitPlan,visitAll,socialOptions,social,dateCost,introductionCost};
  }
  root.PocketWorld={createWorld};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
