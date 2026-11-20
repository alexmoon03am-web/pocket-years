/* Annual budgets, education, health, family and the choices available between birthdays. */
(function(root){
  'use strict';
  const PocketEconomy=typeof module!=='undefined'&&module.exports?require('./economy.js').PocketEconomy:root.PocketEconomy;
  const M=typeof module!=='undefined'&&module.exports?require('./model.js').PocketModel:root.PocketModel;
  const ledgerFactory=typeof module!=='undefined'&&module.exports?require('./ledger.js').PocketLedger:root.PocketLedger;
  const extraActivities=typeof module!=='undefined'&&module.exports?require('./activities.js').PocketActivities:root.PocketActivities;
  const majors={science:'Science',arts:'Arts',business:'Business'};
  const programs={
    science:{title:'Study science',degree:'Science',years:4,fee:6000,icon:'flask'},
    arts:{title:'Study arts',degree:'Arts',years:4,fee:6000,icon:'palette'},
    business:{title:'Study business',degree:'Business',years:4,fee:6000,icon:'bag'},
    medicine:{title:'Attend medical school',degree:'Medicine',years:4,fee:24000,icon:'heart'},
    law:{title:'Attend law school',degree:'Law',years:3,fee:15000,icon:'book'}
  };
  const offences={
    fare:{name:'Skip a fare',icon:'ticket',reward:55,chance:.37,term:1,fine:140},
    theft:{name:'Shoplift',icon:'shop',reward:360,chance:.52,term:2,fine:380},
    pickpocket:{name:'Pickpocket',icon:'wallet',reward:85,chance:.38,term:1,fine:280},
    auto:{name:'Grand theft auto',icon:'car',reward:1900,chance:.64,term:4,fine:2400},
    burglary:{name:'Burglary',icon:'key',reward:950,chance:.55,term:3,fine:1200},
    robbery:{name:'Bank robbery',icon:'coin',reward:5800,chance:.82,term:8,fine:7000},
    fraud:{name:'Take part in a fraud',icon:'wallet',reward:1900,chance:.68,term:4,fine:1400}
  };
  const illness=['a lingering cough','a recurring headache','a stubborn backache','a fatigue spell'];
  const names=['Luca','Sal','Micah','Val','Ivy','Tess','Remi','Ash','Sasha','Owen','Zoe','Milo','Nia','Leo'];
  // The first choice also supports older callers that supply only a pet name.
  const petBreeds=Object.freeze({
    dog:Object.freeze([
      'Mixed-breed dog','Afghan Hound','Akita','Alaskan Malamute','American Pit Bull Terrier','American Staffordshire Terrier',
      'Australian Cattle Dog','Australian Shepherd','Basenji','Basset Hound','Beagle','Belgian Malinois','Bernese Mountain Dog',
      'Bichon Frisé','Border Collie','Boston Terrier','Boxer','Bulldog','Cane Corso','Cavalier King Charles Spaniel',
      'Chihuahua','Chow Chow','Cocker Spaniel','Dachshund','Dalmatian','Doberman Pinscher','English Springer Spaniel',
      'French Bulldog','German Shepherd','German Shorthaired Pointer','Golden Retriever','Great Dane','Great Pyrenees',
      'Greyhound','Havanese','Jack Russell Terrier','Labrador Retriever','Maltese','Miniature Schnauzer','Newfoundland',
      'Papillon','Pembroke Welsh Corgi','Pomeranian','Poodle','Pug','Rhodesian Ridgeback','Rottweiler','Saint Bernard',
      'Samoyed','Shetland Sheepdog','Shiba Inu','Shih Tzu','Siberian Husky','Staffordshire Bull Terrier','Weimaraner',
      'Whippet','Yorkshire Terrier'
    ]),
    cat:Object.freeze([
      'Mixed-breed cat','Abyssinian','American Bobtail','American Curl','American Shorthair','Balinese','Bengal','Birman',
      'Bombay','British Shorthair','Burmese','Burmilla','Chartreux','Cornish Rex','Devon Rex','Domestic Longhair',
      'Domestic Shorthair','Egyptian Mau','Exotic Shorthair','Havana Brown','Japanese Bobtail','Korat','LaPerm',
      'Maine Coon','Manx','Norwegian Forest Cat','Ocicat','Oriental Shorthair','Persian','Ragdoll','Russian Blue',
      'Savannah','Scottish Fold','Selkirk Rex','Siamese','Siberian','Singapura','Snowshoe','Somali','Sphynx',
      'Tonkinese','Turkish Angora','Turkish Van'
    ])
  });
  const geography=typeof module!=='undefined'&&module.exports?require('./geography.js').PocketGeography:root.PocketGeography;
  const places=geography.places;
  const movingFee=1800;
  const identities={woman:'Woman',man:'Man',nonbinary:'Nonbinary'};
  const money=n=>(n<0?'−$':'$')+Math.abs(n).toLocaleString('en-US');
  function create(api){
    const {world,jobs,random,rngItem,apply,log,actionReason,cleanName,clamp}=api;
    function initialize(l){
      if(l.sim)return;
      // Existing saves acquire the new fields without consuming a random draw or changing their history.
      const code=Array.from(l.name).reduce((a,c)=>a+c.codePointAt(0),l.born);
      l.sim={generation:1,ancestors:[],identity:Object.keys(identities)[code%3],birthday:1+code%28,month:1+Math.floor(code/3)%12,
        birthplace:l.town,license:Object.entries(l.world.owned).some(([id,a])=>world.shopping.ownedItem(id,a).category==='Vehicle'),program:null,degree:l.world.credential==='college'?'General studies':null,professional:null,loans:{},condition:null,
        court:null,prison:0,record:0,appealed:false,expecting:null,will:'equal',trust:0,followers:0,account:false,pet:null,lastBudget:null};
      if(l.job==='student'&&l.track==='college'&&l.age<22)l.sim.program={field:'general',end:22};
      l.people.carer.bornYear=l.born-22-code%16;
      if(!l.people.friend.bornYear)l.people.friend.bornYear=l.born;
      if(!l.people.love.bornYear)l.people.love.bornYear=l.born-1;
    }
    function populateFamily(l){
      const others=names.filter(n=>!Object.values(l.people).some(p=>p.name===n)&&n!==l.name.split(' ')[0]);
      l.people.carer.role='Mother';l.people.carer.gender='woman';
      l.people.parent2={name:rngItem(l,others),role:'Father',gender:'man',bond:61,active:true,met:true,bornYear:l.born-24-Math.floor(random(l)*14)};
      if(random(l)<.55)l.people.sibling={name:rngItem(l,others.filter(n=>!l.people.parent2||n!==l.people.parent2.name)),role:'Sibling',bond:54,active:true,met:true,bornYear:l.born-1-Math.floor(random(l)*8)};
    }
    function children(l){return Object.entries(l.people).filter(([,p])=>p.role==='Child'&&M.isAlive(p));}
    function debt(l){return Object.values(l.sim.loans).reduce((n,x)=>n+x.balance,0);}
    function ageOf(l,p){
      const at=Number.isInteger(p.diedAt)?p.diedAt:l.age;
      return Number.isInteger(p.bornAt)?at-p.bornAt:Number.isInteger(p.bornYear)?l.born+at-p.bornYear:null;
    }
    function addLoan(l,id,amount,years){
      const prior=l.sim.loans[id],balance=amount+(prior?prior.balance:0);
      l.sim.loans[id]={balance,principal:Math.ceil(balance/years)};
    }
    const {budget,settle,plan:estate,tax}=ledgerFactory.create(world,jobs,ageOf);
    function downPayment(item){return Math.ceil(item.price/5);}
    function mortgageReason(l,id){
      const item=world.shopping.offer(l,id);
      if(!item||item.category!=='Property'||l.age<18||l.ended||l.sim.prison||l.sim.court||api.blocking(l))return 'Unavailable';
      const down=downPayment(item);
      if(l.cash<down)return 'Needs '+money(down)+' down';
      if(budget(l).wages+world.rent(l)<Math.ceil((item.price-down)/15)*2)return 'More annual income needed';
      return '';
    }
    function mortgage(l,id){
      if(mortgageReason(l,id))return null;
      const item=world.shopping.offer(l,id),down=downPayment(item);
      world.shopping.take(l,item);
      addLoan(l,id,item.price-down,15);if(l.sim.expansion)l.sim.loans[id].rate=PocketEconomy.local(l).rate;world.schedule(l,'first-keys',1);
      const delta=apply(l,{cash:-down}),title='Financed '+world.shopping.inSentence(item);
      const text='I put '+money(down)+' down on '+world.shopping.inSentence(item)+'. The first payment is due on my next birthday.';
      log(l,'Assets',title,text,delta);return {title,text,delta};
    }
    function finish(l,key,kind,title,text,effects={},progress={}){
      l.used.push('sim-'+key);const delta=Object.assign(apply(l,effects),world.metrics(l,progress));
      log(l,kind,title,text,delta);return {title,text,delta};
    }
    function startCourse(l,field,end){
      l.sim.program={field,end};l.track='college';world.changeJob(l,'student',true);
    }
    function programReason(l,field){
      if(l.age<18)return 'Opens at 18';
      if(l.sim.dropped)return 'School equivalency required';
      if(l.sim.program)return 'Already enrolled';
      if(['paths','paths-standard'].includes(l.event.id)&&!l.event.resolved)return 'Choose your path first';
      if(l.job==='trainee'&&l.world.credential!=='trade'&&!l.world.tradeQualified)return 'Finish or leave your apprenticeship';
      if(l.sim.professional===programs[field].degree||l.sim.degree===programs[field].degree)return 'Already qualified';
      if(field==='medicine'||field==='law'){
        if(!l.sim.degree)return 'Undergraduate degree required';
        if(field==='medicine'&&!['Science','General studies'].includes(l.sim.degree))return 'Science degree required';
        if(l.stats.smarts<60)return 'Needs 60% smarts';
      }
      return '';
    }
    const actions={};
    function add(id,group,title,icon,desc,run,rule){actions[id]={id,group,title,icon,desc,run,rule};}
    for(const [field,p] of Object.entries(programs)){
      add('course-'+field,'education',p.title,p.icon,p.years+' years · '+money(p.fee)+' total tuition.',(l,method='loan')=>{
        if(method==='scholarship'&&random(l)>Math.min(.97,.14+l.world.grade*.005+l.stats.smarts*.002+l.hidden.discipline*.001)){
          const result=finish(l,'scholarship','School','Scholarship declined','My scholarship application was turned down. My place is still available.',{joy:-2});
          result.declined=true;return result;
        }
        if(method==='loan')addLoan(l,'tuition',p.fee,10);
        startCourse(l,field,l.age+p.years);l.sim.program.funding=method;
        if(method==='scholarship')M.tag(l,'scholarship');
        const payment=method==='loan'?'I took out a '+money(p.fee)+' student loan.':method==='cash'?'I paid '+money(p.fee)+' in tuition.':'A scholarship covered all '+money(p.fee)+' of my tuition.';
        return finish(l,'course-'+field,'School','Enrolled in '+p.degree,'I enrolled in '+p.degree+'. '+payment,{smarts:3,cash:method==='cash'?-p.fee:0});
      },l=>programReason(l,field));
    }
    for(const [field,name] of Object.entries(majors)){
      add('major-'+field,'education','Major in '+name,programs[field].icon,'Choose a field for your undergraduate program.',l=>{
        l.sim.program.field=field;return finish(l,'major-'+field,'School','Declared a major','I picked '+name+' for my undergraduate degree.',{smarts:2});
      },l=>!l.sim.program||l.sim.program.field!=='general'?'Choose during your undergraduate program':'');
    }
    add('apprentice','education','Start an apprenticeship','tools','Train for four years in a paid position and earn a trade certificate.',l=>{
      l.track='trade';world.changeJob(l,'trainee',true);
      return finish(l,'apprentice','School','Began a paid apprenticeship','I signed on with a workshop. My trade certificate is due at age '+(l.age+4)+'.',{smarts:2});
    },l=>l.age<18?'Opens at 18':['paths','paths-standard'].includes(l.event.id)&&!l.event.resolved?'Choose your path first':
      l.sim.program?'Finish or leave your course':l.job==='trainee'?'Already an apprentice':l.world.credential==='trade'||l.world.tradeQualified?'Already qualified':'');
    add('leave-course','education','Leave your course','exit','Withdraw and look for work. Outstanding tuition stays on your account.',l=>{
      l.sim.program=null;l.track=l.sim.degree?'college':'gap';world.changeJob(l,null,true);
      return finish(l,'leave-course','School','Withdrew from school','I collected my transcript and cleared out my locker.');
    },l=>!l.sim.program?'Not enrolled':'');
    add('resign','work','Resign from your job','exit','Your next birthday will have no wages from this job.',l=>{
      const name=jobs[l.job][0];world.changeJob(l,null,true);
      return finish(l,'resign','Career','Resigned','I handed in my notice as a '+name.toLowerCase()+'.');
    },l=>!l.job||l.job==='student'||l.job==='retired'?'No job to leave':'');
    add('doctor','health','Visit the doctor','heart','A clinic visit costs $45. Care is free under 18 and in custody.',l=>{
      const fee=l.age<18||l.sim.prison?0:45,conditions=l.sim.illnesses.concat(l.sim.injuries).sort((a,b)=>b.severity-a.severity),patient=conditions[0];
      if(patient){
        const name=patient.name;
        if(patient.chronic){patient.treated=true;patient.severity=Math.max(1,patient.severity-25);}
        else {l.sim.illnesses=l.sim.illnesses.filter(x=>x!==patient);l.sim.injuries=l.sim.injuries.filter(x=>x!==patient);}
        return finish(l,'doctor','Health','Clinic visit',patient.chronic?'Treatment started for '+name+'. Follow-up is on the calendar.':'My '+name+' was treated. The bill was legible.',{cash:-fee,health:12,joy:2});
      }
      return finish(l,'doctor','Health','Annual checkup','The doctor found nothing urgent. I got a receipt.',{cash:-fee,health:3});
    },l=>l.age>=18&&!l.sim.prison&&l.cash<45?'Needs $45':'');
    add('gym','health','Go to the gym','shoe','Train your fitness. Membership for this visit costs $25.',l=>
      finish(l,'gym','Health','An afternoon at the gym','I finished one more set than I thought I could.',{cash:-25,health:8,looks:3}),l=>l.age<14?'Opens at 14':l.cash<25?'Needs $25':'');
    add('meditate','health','Meditate','leaf','Take a quiet break and work on your happiness.',l=>
      finish(l,'meditate','Health','A quieter afternoon','I sat still. My phone objected twice.',{joy:5,health:2}),l=>l.age<5?'Opens at 5':'');
    add('counsel','health','Talk to a counselor','chat','Talk through a difficult year. School sessions are free.',l=>
      finish(l,'counsel','Health','Someone listened','I spoke for fifty minutes. The counselor took notes.',{cash:l.age<18?0:-60,joy:10}),l=>l.age<6?'Opens at 6':l.age>=18&&l.cash<60?'Needs $60':'');
    add('friend','company','Make a new friend','people','Meet someone at school, at work or in your neighborhood.',l=>{
      const taken=Object.values(l.people).map(p=>p.name),available=names.filter(n=>!taken.includes(n));
      const name=rngItem(l,available.length?available:names.map(n=>n+' Lee').filter(n=>!taken.includes(n))),id='friend-'+l.age;
      l.people[id]={name,role:'Friend',met:true,active:true,bond:52,bornYear:l.born};
      return finish(l,'friend','People','Became friends with '+name,'I exchanged numbers and made plans for next week.',{joy:4,bonds:3});
    },l=>l.age<5?'Opens at 5':Object.values(l.people).filter(p=>p.role==='Friend'&&p.active).length>=6?'Your circle is full':'');
    add('baby','family','Try for a baby','baby','If your family is expecting, the baby arrives on your next birthday.',(l,input)=>{
      if(random(l)<Math.max(.1,.38+l.hidden.fertility*.005-Math.max(0,l.age-42)*.012)){
        l.sim.expecting={name:cleanName(input)||rngItem(l,names),parent:l.people.love.name,...(l.sim.expansion?{parentId:l.people.love.id}:{})};
        return finish(l,'baby','Family','A baby is on the way',l.people.love.name+' and I are expecting a child next year.',{joy:7,bonds:5});
      }
      return finish(l,'baby','Family','Family plans','There is no baby news this year. I can try again after my birthday.',{bonds:2});
    },l=>l.age<18?'Opens at 18':!world.isPartner(l)?'Partner required':l.sim.expecting?'Already expecting':children(l).length>=5?'Family is full':'');
    for(const type of ['cat','dog']){
      add('pet-'+type,'pets','Adopt a '+type,type,'Choose a breed. Adoption costs $80 and yearly care costs $95.',(l,input)=>{
        const choice=typeof input==='string'||input===undefined?{name:input,breed:petBreeds[type][0]}:input;
        if(!choice||!petBreeds[type].includes(choice.breed)||(choice.name!==undefined&&typeof choice.name!=='string'))return null;
        const name=cleanName(choice.name)||(type==='cat'?'Olive':'Pepper');
        l.sim.pet={type,name,breed:choice.breed,years:0,lifespan:10+Math.floor(random(l)*8)};
        const text='I brought home '+name+' ('+choice.breed+'). '+(type==='dog'?'The welcome mat lasted an hour.':'The cat kept the box the bed came in.');
        return finish(l,'pet-'+type,'Family','Adopted '+name,text,{cash:-80,joy:7});
      },l=>l.age<18?'Opens at 18':l.sim.pet?'One pet at a time':l.cash<80?'Needs $80':'');
    }
    add('record-pet-breed','pets','Choose your pet’s breed','pencil','Add the breed to your existing pet’s record.',(l,breed)=>{
      const pet=l.sim.pet;
      if(!petBreeds[pet.type].includes(breed))return null;
      pet.breed=breed;
      return finish(l,'record-pet-breed','Family','Updated '+pet.name+'’s record',pet.name+' is listed as '+breed+' on the paperwork.');
    },l=>!l.sim.pet?'Adopt a pet first':l.sim.pet.breed?'Breed already recorded':'');
    add('play-pet','pets','Play with your pet','heart','Make time for your companion.',l=>
      finish(l,'play-pet','Family','Time with '+l.sim.pet.name,'My pet won. The rules were unclear.',{joy:7,health:2}),l=>!l.sim.pet?'Adopt a pet first':'');
    add('account','fame','Join social media','phone','Create a public profile and start with your friends.',l=>{
      l.sim.account=true;l.sim.followers=12;
      return finish(l,'account','Activity','Opened a social account','Twelve friends followed my new profile.',{joy:2});
    },l=>l.age<13?'Opens at 13':l.sim.account?'Account is active':'');
    add('post','fame','Publish a post','camera','Reach new followers. An occasional post can take off.',l=>{
      const viral=random(l)<.17,gain=Math.floor((viral?800:35)+random(l)*(viral?8000:290)+l.sim.followers*.09);
      l.sim.followers+=gain;return finish(l,'post','Activity',viral?'My post went viral':'Published a new post','I gained '+gain.toLocaleString('en-US')+' followers.',{joy:3},{reputation:viral?12:3});
    },l=>!l.sim.account?'Create an account first':'');
    add('sponsor','fame','Take a sponsorship','tag','Accept a paid offer once you reach 1,000 followers.',l=>{
      const fee=Math.min(25000,Math.round(150+l.sim.followers*.12));
      return finish(l,'sponsor','Career','A paid collaboration','The sponsor requested one tiny edit. It paid '+money(fee)+'.',{cash:fee},{reputation:2});
    },l=>l.age<18?'Opens at 18':l.sim.followers<1000?'Needs 1,000 followers':'');
    for(const [id,o] of Object.entries(offences)){
      add(id,'crime',o.name,o.icon,'Risk a court hearing, a fine or a sentence.',l=>{
        const idTag='crime-'+id;M.tag(l,idTag);
        apply(l,{karma:-5,notoriety:4,craziness:2});
        if(random(l)<Math.min(.95,o.chance+l.hidden.notoriety*.0015)){
          l.sim.court={id,term:o.term,fine:o.fine};
          return finish(l,id,'Justice','Summoned to court','I must answer a charge before my next birthday.',{joy:-5},{reputation:-7});
        }
        return finish(l,id,'Justice','Took a risk','I came away with '+money(o.reward)+'. I kept the money.',{cash:o.reward,joy:-2});
      },l=>l.age<18?'Opens at 18':l.sim.court?'Hearing pending':!l.event.resolved?'Answer your current decision first':'');
    }
    add('library','custody','Use the prison library','book','Read and work toward your return home.',l=>
      finish(l,'library','Justice','A library shift','Working in the prison library gave your week a routine.',{smarts:5,joy:2}));
    add('yard','custody','Exercise in the yard','shoe','Look after your health while serving your sentence.',l=>
      finish(l,'yard','Justice','Time in the yard','I joined a regular walking group.',{health:5,joy:2}));
    add('appeal','custody','Appeal your sentence','letter','Ask for a review once during this sentence.',l=>{
      l.sim.appealed=true;const won=random(l)<.40;if(won)l.sim.prison=Math.max(0,l.sim.prison-1);
      return finish(l,'appeal','Justice',won?'Appeal granted':'Appeal denied',won?(l.sim.prison?'One year came off my sentence.':'I was released today.'):'My original release date stands.',{joy:won?6:-2});
    },l=>l.sim.appealed?'Already reviewed':'');
    add('repay','money','Make an extra loan payment','wallet','Pay up to $1,000 toward your largest outstanding balance.',l=>{
      const [id,loan]=Object.entries(l.sim.loans).sort((a,b)=>b[1].balance-a[1].balance)[0],amount=Math.min(1000,l.cash,loan.balance);
      loan.balance-=amount;if(!loan.balance)delete l.sim.loans[id];
      return finish(l,'repay','Assets','An extra loan payment','My outstanding principal fell by '+money(amount)+'.',{cash:-amount});
    },l=>!debt(l)?'No outstanding loans':l.cash<=0?'No cash available':'');
    extraActivities.install({add,finish,random,world,jobs,dependence:api.dependence});
    function reason(l,id){
      const a=actions[id];if(!a||l.ended)return 'Life complete';
      if(a.group==='custody'&&!l.sim.prison)return 'Only available in custody';
      if(l.sim.prison && a.group!=='custody' && id!=='doctor')return 'In custody';
      if(l.sim.court)return 'Hearing pending';
      return (a.rule&&a.rule(l))||actionReason(l,'sim-'+id);
    }
    function options(l,group){
      return Object.values(actions).filter(a=>a.group===group&&(a.id!=='record-pet-breed'||l.sim.pet&&!l.sim.pet.breed))
        .map(a=>({id:a.id,title:a.title,icon:a.icon,desc:a.desc,reason:reason(l,a.id)}));
    }
    function fundingReason(l,id,method){
      if(!id.startsWith('course-')||!['loan','cash','scholarship'].includes(method))return 'Unavailable';
      const p=programs[id.slice(7)],base=reason(l,id);if(!p||base)return base||'Unknown course';
      if(method==='cash'&&l.cash<p.fee)return 'Needs '+money(p.fee);
      if(method==='scholarship'&&l.used.includes('sim-scholarship'))return 'Already applied this year';
      return '';
    }
    function perform(l,id,input){
      if(reason(l,id)||(id.startsWith('course-')&&fundingReason(l,id,input===undefined?'loan':input)))return null;
      const before=M.metrics(l,world.netWorth,budget),result=actions[id].run(l,input);
      if(!result)return null;
      if(id==='gym')l.sim.habits.exercise+=3;if(id==='meditate')apply(l,{willpower:2});
      api.campus(l);result.delta=M.diff(before,M.metrics(l,world.netWorth,budget));l.log[l.log.length-1].delta=result.delta;return result;
    }
    function court(l,plea){
      const c=l.sim.court;if(!c||l.ended||!['plea','trial','counsel'].includes(plea))return null;
      const before=M.metrics(l,world.netWorth,budget);
      const guilty=plea==='plea'||random(l)<(plea==='counsel'?.36:.55),years=guilty?(plea==='plea'?Math.max(0,c.term-1):c.term):0;
      l.sim.court=null;
      let text='The court dismissed the charge.',title='Cleared in court',effects={joy:6};
      if(guilty){
        l.sim.record++;M.tag(l,'convicted');l.sim.prison=years;l.sim.appealed=false;
        const paid=Math.min(l.cash,c.fine);if(paid<c.fine)addLoan(l,'fines',c.fine-paid,3);
        effects={cash:-paid,joy:-6};title=years?'Sentenced in court':'Released with a fine';
        text='The court ordered a '+money(c.fine)+' fine'+(years?' and '+years+' '+(years===1?'year':'years')+' in custody.':'.');
        if(years){if(l.sim.program)l.sim.program=null;world.changeJob(l,null,true);}
      }
      if(plea==='counsel'){const fee=Math.min(120,Math.max(0,l.cash+(effects.cash||0)));effects.cash=(effects.cash||0)-fee;if(fee<120)addLoan(l,'fines',120-fee,3);text+=' My lawyer billed $120.';}
      l.sim.offenses.push({offense:actions[c.id].title,age:l.age,verdict:guilty?'Convicted':'Acquitted',fine:guilty?c.fine:0,sentence:years});
      api.campus(l);const result=finish(l,'hearing','Justice',title,text,effects);result.delta=M.diff(before,M.metrics(l,world.netWorth,budget));l.log[l.log.length-1].delta=result.delta;l.sim.review={...result,from:'court'};return result;
    }
    function birthday(l){
      const s=l.sim;
      if(s.prison){s.prison--;if(!s.prison)log(l,'Justice','Released from custody','The gate opened. My sentence was served.');}
      if(s.program&&l.age>=s.program.end){
        const field=s.program.field,degree=programs[field]?programs[field].degree:'General studies';s.program=null;
        if(['medicine','law'].includes(field))s.professional=degree;else s.degree=degree;if(!s.degrees.includes(degree))s.degrees.push(degree);
        if(l.world.credential==='trade')l.world.tradeQualified=true;
        l.world.credential='college';if(l.job==='student')world.changeJob(l,null,false);
        log(l,'School','Graduated in '+degree,'I received the degree. My résumé got one line longer.');
      }
      if(s.expecting){
        const baby=s.expecting,key='kid'+(++l.world.childCount);s.expecting=null;
        l.people[key]={name:baby.name,role:'Child',bond:78,active:true,met:true,bornAt:l.age,birthTown:l.town,otherParent:baby.parent,...(baby.parentId?{otherParentId:baby.parentId,town:l.town}:{})};
        world.schedule(l,'first-curtain',5,key);log(l,'Family','Welcomed '+baby.name,'The baby arrived. Nobody slept.');
      }
      if(s.pet&&++s.pet.years>=s.pet.lifespan){
        const p=s.pet;
        const text=p.breed?p.name+' ('+p.breed+') was with me for '+p.years+' years.':'My family remembered my '+p.type+' and the years we had together.';
        log(l,'Family','Goodbye to '+p.name,text);s.pet=null;apply(l,{joy:-8});
      }
    }
    function licenseReason(l){
      if(l.age<16)return 'Opens at 16';
      if(l.sim.license)return 'License earned';
      return actionReason(l,'license',l.age<18?0:30);
    }
    const drivingTest={
      question:'Which sign has eight sides?',
      answers:[['bus','Bus stop sign','pin'],['stop','Stop sign','car'],['route','Route marker','map']],
      correct:'stop'
    };
    function takeTest(l,answer){
      if(licenseReason(l)||!drivingTest.answers.some(([key])=>key===answer))return null;
      l.used.push('license');const passed=answer===drivingTest.correct;if(passed)l.sim.license=true;
      const delta=apply(l,{cash:l.age<18?0:-30,joy:passed?4:-2}),title=passed?'Earned a driver’s license':'Driving test result';
      const text=passed?'I passed the road-sign test and received my license. I can now buy a car.':'I missed the sign question. I can try again next year.';
      log(l,'Milestone',title,text,delta);return {title,text,delta};
    }
    function moveReason(l,town){
      if(l.age<18)return 'Opens at 18';
      if(!geography.cities[town])return 'Unknown destination';
      if(l.town===town)return 'Current home';
      const base=actionReason(l,'relocate',movingFee);if(base)return base;
      if(geography.international(l.town,town)){const p=PocketEconomy.papers(l,town);if(!p.citizen&&!p.valid&&!p.eligible)return p.reason;}
      return '';
    }
    function townAtAge(l,age){
      let town=l.sim.birthplace;
      // Older versions recorded relocation as a journal entry without a city key.
      for(const entry of l.log){
        if(entry.age>age)break;
        if(entry.kind==='Milestone'&&entry.title.startsWith('Moved to ')){
          const id=geography.oldTownLabels[entry.title.slice(9)];if(id)town=id;
        }
      }
      for(const move of l.sim.residences||[])if(move.age<=age)town=move.to;
      return geography.cities[town]?town:l.town;
    }
    function childBirthplace(l,p){
      return geography.cities[p.birthTown]?p.birthTown:townAtAge(l,p.bornAt);
    }
    function relocate(l,town){
      if(moveReason(l,town))return null;
      const from=l.town,abroad=geography.international(from,town);
      for(const [,child] of children(l))if(!child.birthTown)child.birthTown=childBirthplace(l,child);
      for(const [id,asset] of Object.entries(l.world.owned)){
        const item=world.shopping.ownedItem(id,asset);
        if(item.category==='Property'&&!item.town)asset.town=asset.inherited?from:townAtAge(l,asset.at);
      }
      if(!l.sim.residences)l.sim.residences=[];
      l.sim.residences.push({age:l.age,from,to:town});
      api.moved(l,from,town);l.town=town;if(l.sim.expansion?.family[l.id])l.sim.expansion.family[l.id].town=town;api.campus(l);l.used.push('relocate');
      const destination=geography.label(town),title=(abroad?'Immigrated to ':'Moved to ')+destination;
      const text='I moved from '+geography.label(from)+' to '+destination+'. Moving cost '+money(movingFee)+'.';
      const delta=apply(l,{cash:-movingFee,joy:4});
      log(l,'Milestone',title,text,delta);return {title,text,delta};
    }
    function setWill(l,key){
      if(api.blocking(l)||l.ended||l.age<18||(key!=='equal'&&!children(l).some(([id])=>id===key)))return null;
      if(l.sim.will===key&&!l.sim.expansion?.double)return null;l.sim.will=key;if(l.sim.expansion){delete l.sim.expansion.double;delete l.sim.expansion.witness;}
      return finish(l,'will','Family','Updated my will',key==='equal'?'My children will share the estate equally.':'I named '+l.people[key].name+' as the beneficiary.');
    }
    function share(l,key){const part=estate(l)[key];return part?part.total:0;}
    function ribbon(l){
      if(l.sim.followers>=10000)return 'In the spotlight';
      if(l.sim.record>=3)return 'A notorious name';
      if(world.netWorth(l)>=1000000)return 'Fortune builder';
      if(l.sim.professional)return 'A life of learning';
      if(children(l).length>=3)return 'Heart of the family';
      return null;
    }
    return {initialize,populateFamily,majors,programs,places,geography,movingFee,childBirthplace,identities,petBreeds,children,debt,ageOf,fundingReason,budget,settle,mortgageReason,mortgage,startCourse,addLoan,estate,tax,downPayment,licenseReason,drivingTest,takeTest,moveReason,relocate,actions,options,reason,perform,court,birthday,setWill,share,ribbon,money};
  }
  root.PocketSystems={create,places,identities};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
