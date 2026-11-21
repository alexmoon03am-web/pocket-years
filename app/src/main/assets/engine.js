(function (root) {
  'use strict';
  const PocketEconomy=typeof module!=='undefined'&&module.exports?require('./economy.js').PocketEconomy:root.PocketEconomy;
  const PocketExpansion=typeof module!=='undefined'&&module.exports?require('./expansion.js').PocketExpansion:root.PocketExpansion;
  const PocketExpansionData=typeof module!=='undefined'&&module.exports?require('./expansion-data.js').PocketExpansionData:root.PocketExpansionData;
  const catalog = typeof module !== 'undefined' && module.exports ? require('./stories.js').PocketStories : root.PocketStories;
  const {stories}=catalog;
  const node=typeof module!=='undefined'&&module.exports;
  const historyWorld=node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;
  const historyEconomy=node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  const historyDynasty=node?require('./history-dynasty.js').PocketHistoryDynasty:root.PocketHistoryDynasty;
  const faithCatalog=node?require('./faith-catalog.js').PocketFaithCatalog:root.PocketFaithCatalog;
  const faithPersonal=node?require('./faith-personal.js').PocketFaithPersonal:root.PocketFaithPersonal;
  const faithMovements=node?require('./faith-movements.js').PocketFaithMovements:root.PocketFaithMovements;
  const faithInstitutions=node?require('./faith-institutions.js').PocketFaithInstitutions:root.PocketFaithInstitutions;
  const faithLegacy=node?require('./faith-legacy.js').PocketFaithLegacy:root.PocketFaithLegacy;
  const faithEncounters=node?require('./faith-encounters.js').PocketFaithEncounters:root.PocketFaithEncounters;
  const faithCommunity=node?require('./faith-community.js').PocketFaithCommunity:root.PocketFaithCommunity;
  function faithPerform(l,command){
    if(l.ended||blocking(l)||!command)return null;
    const {group,id,payload}=command,ctx=context();
    if(group==='encounter')return faithEncounters.perform(l,id,ctx);
    if(group==='found')return faithMovements.found(l,payload,ctx);
    if(['movement','outreach','governance','reform'].includes(group))return faithMovements.perform(l,group,id,ctx,payload);
    if(group==='institutions'||group?.startsWith('institution:'))return faithInstitutions.perform(l,group,id,ctx);
    if(group==='legacy')return faithLegacy.perform(l,payload?.movementId,id,ctx);
    const outcome=faithPersonal.perform(l,group,id,ctx,payload);
    if(outcome)faithMovements.syncAffiliations(l);
    return outcome;
  }
  function annualFaith(l){
    const ctx=context();
    if(!l.ended)faithPersonal.annual(l,ctx);
    faithInstitutions.annual(l,ctx);
    faithMovements.annual(l,ctx);
    faithCommunity.annual(l);
    faithLegacy.annual(l,ctx);
  }
  const calendar=l=>l.born+l.age;
  const isHistorical=l=>!!l.sim?.timeline?.historicalRules&&calendar(l)<2000;
  const birthYear=opts=>opts.birthYear??opts.born;
  const validStart=y=>Number.isInteger(y)&&y>=1200&&y<=3000;
  function context(){return {jobs,world,sim,log,apply,blocking,random,actionReason,keepsake};}
  function historyPerform(l,area,id){
    if(l.ended||blocking(l))return null;
    return area==='museum'?historyDynasty.perform(l,id,context()):historyEconomy.perform(l,area,id,context());
  }
  function birthplace(l){
    return isHistorical(l)?historyWorld.place(l.town,l.born).city:towns[l.town];
  }
  function birthEntry(l){
    if(!isHistorical(l))return daily.birth(l,sim.geography);
    const place=historyWorld.place(l.town,l.born);
    return 'I was born in '+place.label+' in '+l.born+'. My name is '+l.name+'.';
  }
  const model=typeof module!=='undefined'&&module.exports?require('./model.js').PocketModel:root.PocketModel;
  const events=typeof module!=='undefined'&&module.exports?require('./events.js').PocketEvents:root.PocketEvents;
  const daily=typeof module!=='undefined'&&module.exports?require('./daily.js').PocketDaily:root.PocketDaily;
  const yearFactory=typeof module!=='undefined'&&module.exports?require('./year.js').PocketYear:root.PocketYear;
  const worldFactory = typeof module !== 'undefined' && module.exports ? require('./world.js').PocketWorld : root.PocketWorld;
  const statNames = {joy:'Happiness', health:'Health', smarts:'Smarts', looks:'Looks', bonds:'Bonds'};
  const systemsFactory=typeof module!=='undefined'&&module.exports?require('./life-systems.js').PocketSystems:root.PocketSystems;
  const households=[
    ['Night-shift baker','comes home with flour on their sleeves and a bun set aside for later.'],
    ['Ferry deckhand','hangs a tiny paper boat above your bed. You fall asleep to the gulls outside.'],
    ['Librarian','brings home a board book that already has your name inside the cover.'],
    ['Bus driver','waves from the driver’s seat whenever the number eight turns into your street.'],
    ['Costume maker','sews a crooked felt star onto the first blanket you ever own.'],
    ['Market gardener','puts a seed in a jar on the windowsill the morning you come home.']
  ];
  function householdFor(life){return (life.born+Array.from(life.people.carer.name).reduce((a,c)=>a+c.charCodeAt(0),0))%households.length;}
  const origins={box:'Music box',lens:'Instant camera',atlas:'Hand-drawn map'};
  const towns=Object.create(null);for(const [id,data] of Object.entries(systemsFactory.places))towns[id]=data[0];
  // Gross annual salaries in the game's currency. The budget itemizes each year's deductions.
  const jobs={
    barista:['Barista',25700],cashier:['Cashier',26800],custodian:['Custodian',31700],courier:['Delivery driver',35100],assistant:['Office assistant',32400],receptionist:['Receptionist',34600],
    student:['College student',0],trainee:['Apprentice',21000],clerk:['Shop assistant',29000],
    teacher:['Teacher',48500],researcher:['Field researcher',61200],designer:['Book designer',52500],
    luthier:['Instrument maker',47500],electrician:['Electrician',62200],baker:['Baker',37600],
    manager:['Shop manager',53000],photographer:['Photographer',44500],organizer:['Events coordinator',48700],
    retired:['Retired',19400],parttime:['Part-time mentor',24500],developer:['Software developer',89300],
    performer:['Touring musician',52800],guide:['Trail guide',34100],physician:['Physician',154000],
    lawyer:['Lawyer',112000],nurse:['Clinical nurse',68500],journalist:['Reporter',47000],actor:['Actor',63000],
    athlete:['Professional athlete',78000],chef:['Head chef',56500],accountant:['Accountant',64200]
  };
  for(const [id,p] of Object.entries(PocketExpansionData.professions))jobs[id]=[p[0],p[1]];
  Object.assign(jobs,historyEconomy.jobs,faithPersonal.jobs);
  const given = ['Robin','Ellis','Jules','Avery','Reese','Kit','Nico','Emery','Quinn','Sage','Rowan','Morgan'];
  const family = ['Lane','Reed','Finch','Brooks','Bell','Vale','Park','Ellery','Shaw','Moss'];
  const carerNames = ['June','Mina','Jo','Kit','Ellis','Fran','Remy','Robin'];
  const friendNames = ['Cleo','Sam','River','Max','Lou','Jamie','Pip','Lark'];
  const loveNames = ['Charlie','Alex','Marlowe','Blair','Billie','Noa','Ash','Drew'];
  const clamp = v => Math.min(100,Math.max(0,v));
  const world=worldFactory.createWorld({jobs,apply,log,clamp,random,rngItem,actionReason,keepsake,cleanName,blocking,staff:l=>year.workplace(l)});
  const sim=systemsFactory.create({world,jobs,apply,log,clamp,random,rngItem,actionReason,cleanName,blocking,campus:l=>year.campus(l),moved:(l,from,to)=>expansion.moved(l,from,to),arrived:faithInstitutions.initialize,dependence:(l,k,n)=>year.addiction(l,k,n)});
  const year=yearFactory.create({random,rngItem,apply,log,world,sim,jobs});
  const expansion=PocketExpansion.create({world,sim,jobs,log,apply,actionReason,blocking});
  function random(life) {
    let a = life.rng >>> 0;
    a ^= a << 13; a ^= a >>> 17; a ^= a << 5;
    life.rng = a >>> 0;
    return life.rng / 4294967296;
  }
  function rngItem(life, items) { return items[Math.floor(random(life)*items.length)]; }
  function seed() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0] || 1;
    return (Date.now() ^ Math.floor(Math.random()*0xffffffff)) >>> 0 || 1;
  }
  function nickname(name) { return name.trim().split(/\s+/)[0]; }
  function stage(age) { return age<5?0:age<13?1:age<18?2:age<40?3:age<65?4:5; }
  function chapter(age) { return ['First days','Childhood','Teen years','Young adulthood','Middle years','Later years'][stage(age)]; }
  function occupation(l){if(l.ended)return 'Deceased';if(l.sim.prison)return 'In custody';return l.age<18&&l.sim.timeline?.youthShift?historyEconomy.shiftName(l):l.job?jobs[l.job][0]:model.school(l).name||(l.age===0?'Newborn':l.age<5?'Early childhood':l.age<18?'Left school':'Between jobs');}
  function portrait(life) { return life.age<4?0:life.age<18?1:life.age<65?2:3; }
  function copy(l,line){
    const actor=l.event&&l.people[l.event.person],words={contact:actor?actor.name:'the other person',child:actor?actor.name:'Your child',home:towns[l.town],name:l.name,carer:l.people.carer.name,friend:l.people.friend.name,love:l.people.love.name};
    return historyEconomy.priceText(l,typeof line==='string'?line:l.age<18?line.youth:line.adult).replace(/\{(\w+)\}/g,(m,k)=>words[k]===undefined?m:words[k]);
  }
  function cleanName(name) { return Array.from(String(name||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ')).slice(0,32).join(''); }
  function generatedName(life) { return rngItem(life,given)+' '+rngItem(life,family); }
  function makeLife(opts={}) {
    const selected=birthYear(opts);
    if(selected!==undefined&&!validStart(selected))throw RangeError('Choose a birth year from 1200 through 3000.');
    const life = {version:4,rng:Number.isFinite(opts.seed)?(opts.seed>>>0)||1:seed(),age:0,name:'',town:'cedar',skin:0,born:2000,stats:{},cash:0,job:null,extraPay:0,track:null,flags:{},people:{},seen:[],quietSeen:{},keepsakes:[],log:[],used:[],outcome:null,event:null,ended:false,turns:0};
    life.name=cleanName(opts.name)||generatedName(life);
    life.town=towns[opts.town]?opts.town:sim.geography.randomCity(random(life));
    life.skin=Number.isInteger(opts.skin) && opts.skin>=0 && opts.skin<4?opts.skin:Math.floor(random(life)*4);
    life.born=1996+Math.floor(random(life)*10);
    if(selected!==undefined){
      life.born=selected;
      if(selected<2000&&!historyWorld.available(opts.town,selected)){
        const places=historyWorld.choices(selected);
        life.town=rngItem(life,places).id;
      }
    }
    life.lifeSpan=79+Math.floor(random(life)*15);
    for (const k of Object.keys(statNames)) life.stats[k]=50+Math.floor(random(life)*26);
    const distinct=(items,others)=>rngItem(life,items.filter(v=>!others.includes(v.toLowerCase())));
    let taken = [nickname(life.name).toLowerCase()];
    const carer=opts.first?'June':distinct(carerNames,taken);
    taken.push(carer.toLowerCase());
    const best=distinct(friendNames,taken); taken.push(best.toLowerCase());
    const other=distinct(loveNames,taken);
    life.people={carer:{name:carer,role:'Guardian',bond:64,active:true,met:true},friend:{name:best,role:'Childhood friend',bond:46,active:false,met:false},love:{name:other,role:'Friend',bond:46,active:false,met:false}};
    life.thread=Object.prototype.hasOwnProperty.call(origins,opts.thread)?opts.thread:rngItem(life,Object.keys(origins));
    life.household=householdFor(life);world.initialize(life);sim.initialize(life);
    if(selected!==undefined)life.sim.timeline={historicalRules:true};
    if(Object.prototype.hasOwnProperty.call(sim.identities,opts.identity))life.sim.identity=opts.identity;
    if(opts.realism!==undefined)year.setRealism(life,opts.realism);
    if(!opts.successor)sim.populateFamily(life);
    model.initialize(life);life.event={id:null,resolved:true};
    if(!opts.successor){
      expansion.activate(life,true);
      log(life,'Milestone','Born in '+birthplace(life),birthEntry(life));
      for(const p of Object.values(life.people).filter(p=>p.met))log(life,'Family',p.fullName,daily.relative(life,p));
    }
    historyDynasty.initialize(life);
    if(!opts.successor){
      if(!faithPersonal.allowedBirth(life.born,life.town,opts))throw RangeError('That belief is unavailable in the selected year.');
      faithPersonal.initialize(life,opts);
      faithInstitutions.initialize(life);
    }
    return life;
  }
  function customizeBirth(life,opts){
    if(life.ended||blocking(life)||life.sim.generation>1||life.age!==0||life.turns||life.used.length)return false;
    if(!cleanName(opts.name)||!towns[opts.town]||!origins[opts.thread]||![0,1,2,3].includes(opts.skin))return false;
    const selected=birthYear(opts);
    const faithOptions={...opts,faithId:opts.faithId??life.sim.faith?.backgroundChoice??'family'};
    if(!faithPersonal.allowedBirth(selected??life.born,opts.town,faithOptions))return false;
    if(selected!==undefined&&(!validStart(selected)||(selected<2000&&!historyWorld.available(opts.town,selected))))return false;
    if(selected!==undefined){
      const offset=selected-life.born;
      life.born=selected;
      life.sim.timeline={historicalRules:true};
      for(const p of Object.values(life.people))if(Number.isInteger(p.bornYear))p.bornYear+=offset;
      for(const node of Object.values(life.sim.expansion?.family||{})){
        node.born+=offset;
        if(Number.isInteger(node.died))node.died+=offset;
      }
    }
    const former=life.name.split(' ').slice(1).join(' '),next=cleanName(opts.name).split(' ').slice(1).join(' ');
    if(former&&next&&former!==next)for(const p of Object.values(life.people)){
      if(!model.isFamily(p)||p.fullName!==p.name+' '+former)continue;
      const entry=life.log.find(e=>e.kind==='Family'&&e.title===p.fullName);p.fullName=p.name+' '+next;
      if(entry)entry.title=p.fullName;
    }
    life.name=cleanName(opts.name);life.town=opts.town;life.sim.birthplace=opts.town;life.skin=opts.skin;life.thread=opts.thread;
    if(Object.prototype.hasOwnProperty.call(sim.identities,opts.identity))life.sim.identity=opts.identity;
    if(life.sim.expansion){const x=life.sim.expansion;x.passports=[PocketEconomy.keyOf(life)];x.since=life.born;for(const p of Object.values(life.people))if(p.met)p.town=life.town;expansion.kin.sync(life);}
    expansion.reconcileBirthAmbition(life);
    if(selected!==undefined){
      for(const [key,p] of Object.entries(life.people)){
        if(!p.met)continue;
        delete p.job;delete p.wealth;
        model.person(life,key,p);
      }
    }
    if(opts.realism!==undefined)year.setRealism(life,opts.realism);
    faithPersonal.customize(life,faithOptions);
    if(life.sim.faithWorld)delete life.sim.faithWorld.institutions;
    faithInstitutions.initialize(life);
    life.log[0].title='Born in '+birthplace(life);
    life.log[0].body=birthEntry(life);
    for(const p of Object.values(life.people)){
      const note=life.log.find(e=>e.kind==='Family'&&e.title===p.fullName);if(note)note.body=daily.relative(life,p);
    }
    if(life.event.id){life.event.id=isHistorical(life)?'era_birth':({box:'box',lens:'lens-start',atlas:'atlas-start'})[life.thread];}
    return true;
  }
  function log(life,kind,title,body,delta={}){
    if(life.id){
      model.people(life);
      if(life.job&&jobs[life.job]&&!['retired','student'].includes(life.job)){
        const salary=PocketEconomy.salary(life,life.job,jobs);if(salary>life.sim.peak.salary)life.sim.peak={title:life.job,salary};
      }
    }
    (life._yearEntries||life.log).push({age:life.age,kind,title,body,delta});
  }
  function apply(life,effects) {
    const actual={};
    for (const [key, amount] of Object.entries(effects)) {
      let delta;
      if(key==='cash'){
        // Under-18 earnings go through birthday payroll. Story and activity rewards can still change other stats.
        if(life.age<18 && amount>0)continue;
        const old=life.cash;life.cash=Math.max(0,old+amount);delta=life.cash-old;
      }
      else if(Object.prototype.hasOwnProperty.call(statNames,key)){ const old=life.stats[key];life.stats[key]=clamp(old+amount);delta=life.stats[key]-old; }
      else if(life.hidden&&Object.prototype.hasOwnProperty.call(life.hidden,key)){const old=life.hidden[key];life.hidden[key]=clamp(old+amount);delta=life.hidden[key]-old;}
      if(delta)actual[key]=delta;
    }
    return actual;
  }
  function keepsake(life,title) { if(!life.keepsakes.some(k=>k.title===title)) life.keepsakes.push({title,age:life.age}); }
  function migrate(saved,archived=false){
    const life=model.decode(saved);
    if(life.sim?.timeline&&(typeof life.sim.timeline.historicalRules!=='boolean'||!Number.isSafeInteger(life.born)||life.born<1200)){
      throw Error('Invalid historical timeline.');
    }
    if(life.version===1){
      life.thread='box';
      if(!Number.isFinite(life.stats.looks))life.stats.looks=45+((life.rng>>>0)%32);
    }
    if(!Number.isInteger(life.household))life.household=householdFor(life);
    world.initialize(life);sim.initialize(life);model.initialize(life);historyDynasty.initialize(life);if(!life.ended&&!archived){year.workplace(life);year.campus(life);}life.version=4;delete life.actions;
    // An imported future contract may predate the city's new economic history.
    // Preserve its recorded pay basis once, while subsequent years still respond to the local market.
    if(life.born+life.age>=2050&&life.age>=18&&life.job&&life.job!=='retired'&&
        life.world.contractRole===undefined&&life.world.legacyPayFactor===undefined&&Number.isSafeInteger(saved.salary)&&saved.salary>0){
      const quoted=PocketEconomy.salary(life,life.job,jobs);
      if(quoted>0&&quoted!==saved.salary){
        const factor=saved.salary/quoted;
        if(factor>=.5&&factor<=2)life.world={...life.world,legacyPayFactor:factor};
      }
    }
    return life;
  }
  function blocking(l){if(!l.sim)return null;if(l.sim.review)return 'outcome';if(l.sim.court)return 'court';return l.event&&!l.event.resolved?'decision':null;}
  function acknowledge(l){
    if(!l.sim.review)return false;
    l.sim.review=null;
    while(l.eventQueue.length){
      const next=l.eventQueue.shift();if(!next.person||l.people[next.person]&&model.isAlive(l.people[next.person])){
        if(!stories[next.id].random||events.eligible(l,stories[next.id])){l.event=next;return true;}
      }
    }
    l.event={id:null,resolved:true};return true;
  }
  function decide(life,index) {
    if(life.ended||blocking(life)!=='decision'||!Number.isInteger(index))return false;
    const e=stories[life.event.id],opt=e.choices[index];if(!opt)return false;
    const before=model.metrics(life,world.netWorth,sim.budget),branch=events.choose(life,opt,random),c=branch.change||{};
    apply(life,branch.effects||{});world.metrics(life,c);
    if(c.tag)model.tag(life,c.tag);
    if(c.care){const h=life.sim.illnesses[0]||life.sim.injuries[0];if(h){h.treated=true;h.severity=Math.max(1,h.severity-10);}}
    if(c.injury)life.sim.injuries.push({name:c.injury,severity:32,years:0});
    if(c.origin)life.flags.origin=c.origin;
    if(c.club){life.flags.club=c.club;if(!life.sim.activities.includes(c.club))life.sim.activities.push(c.club);}
    if(c.track)life.track=c.track;
    if(c.track==='college')sim.startCourse(life,'general',life.age+4);
    if(c.tuition)sim.addLoan(life,'tuition',c.tuition,10);
    if(c.gap||c.jobSearch)world.changeJob(life,null,true);
    if(c.partJob)world.setShift(life,c.partJob);
    if(c.job){if(c.job!=='student')life.sim.program=null;world.changeJob(life,c.job,false);}
    if(c.raise)life.extraPay+=c.raise;
    if(c.boxFuture)life.flags.boxFuture=c.boxFuture;
    if(c.endingNote)life.flags.endingNote=c.endingNote;
    if(c.keepsake)keepsake(life,c.keepsake);
    if(c.relationship){const p=life.people.love;p.role=c.relationship;p.met=c.relationship!=='Acquaintance';p.active=p.met;if(c.relationship==='Partner')p.since=life.age;}
    if(c.person){const p=life.people[c.person==='$contact'?life.event.person:c.person];if(p&&p.active)p.bond=clamp(p.bond+(c.bondAmount||8));}
    year.campus(life);life.event.resolved=true;life.turns++;
    model.tag(life,'event-'+e.id);const delta=model.diff(before,model.metrics(life,world.netWorth,sim.budget));
    life.outcome={title:copy(life,opt.label),text:copy(life,branch.text),delta,keepsake:c.keepsake||null};
    life.sim.review={...life.outcome,from:e.id};
    log(life,['An old choice returns','Because of your choice'].includes(e.label)?'Echo':'Choice',copy(life,e.title),life.outcome.text,delta);
    return true;
  }
  function income(life) {
    return sim.budget(life).net;
  }
  function advance(life) {
    if(life.ended||blocking(life))return false;
    expansion.activate(life);
    const earnedAge=life.age,openingCash=life.cash,statsBefore={...life.stats};
    life._yearEntries=[];life.used=[];life.outcome=null;
    life.age++;
    const died=year.mortality(life);if(died)expansion.kin.sync(life);
    // Pre-expansion lives keep their original dates and existing pending decisions.
    if(!life.sim.timeline&&calendar(life)>=2050)life.sim.timeline={historicalRules:true};
    if(life.sim.timeline?.historicalRules){
      const from=historyWorld.era(calendar(life)-1),to=historyWorld.era(calendar(life));
      if(from!==to){
        const labels={renaissance:'Renaissance',industrial:'Industrial Era',twentieth:'20th Century',digital:'Digital Age',future:'Future Era'};
        log(life,'World',labels[to]||'A new era','The calendar reached '+calendar(life)+'.');
      }
      historyWorld.annual(life,context());
    }
    if(!died){
      year.drift(life);
      const b=sim.settle(life,earnedAge);
      if(earnedAge<18&&b.wages){
        const shift=world.parts[life.world.partJob]?.[0]||historyEconomy.shiftName(life,earnedAge)||'My part-time job';
        log(life,'School','Part-time payday',shift+' paid '+historyEconomy.money(life,b.wages)+'.',{cash:b.wages});
      }
      if(life.age===18&&life.sim.timeline)delete life.sim.timeline.youthShift;
      year.conditions(life);
      expansion.annual(life,b,earnedAge);
      annualFaith(life);
      events.queue(life,stories,world,random);
      const changes=model.diff(statsBefore,life.stats),net=life.cash-openingCash;
      const details=Object.entries(changes).filter(([k])=>k!=='bonds').map(([k,n])=>statNames[k]+' '+(n>0?'+':'')+n).join(', ');
      const summary='Age '+life.age+'. '+occupation(life)+'. '+(details||'Stats held steady')+(isHistorical(life)?'. Household cash ':'. Bank ')+(net>0?'+':'')+historyEconomy.money(life,net)+'.';
      const hasNews=life._yearEntries.length>0;
      log(life,'Year','Annual statement',summary,{...changes,cash:net});
      const entry=life._yearEntries[life._yearEntries.length-1];
      entry.diary=hasNews||life.event.id?'':isHistorical(life)?daily.historical(life):daily.ordinary(life);
      entry.role=occupation(life);
    }
    if(died)annualFaith(life);
    historyDynasty.annual(life,context());
    life.log.push(...life._yearEntries);delete life._yearEntries;return true;
  }
  function actionList(life) {
    const {age}=life;
    if(isHistorical(life)&&age>=5)return [
      ['move','Go for a walk','Spend an hour outside.','shoe',{health:4,joy:2},'I walked home by the long road. Same house.'],
      ['read','Learn from a neighbor','Ask someone to teach you a skill.','book',{smarts:4,bonds:2},'I learned how to mend a seam. Mine bends left.'],
      ['play','Make something','Try your hand at a small project.','music',{joy:6,smarts:1},'I made something with my hands. It holds together.']
    ];
    if(age<5) return [
      ['rest','Blanket nap','Take a nap.','moon',{health:5},'I slept for an hour. Three adults called it a miracle.'],
      ['listen','Follow a sound','Track the noises around the house.','music',{smarts:4, joy:2},'I identified the squeaky door. I requested an encore.'],
      ['play','Play peekaboo','Recruit someone for a very serious game.','sun',{joy:5,bonds:2},'The face disappears. The face returns. A classic.']
    ];
    const list=[
      ['move',age<13?'Ride your bike':'Take a long walk','Spend an hour outdoors.','shoe',{health:5,joy:2},'I got outside. My shoes collected evidence.'],
      ['read','Visit the library','Read something new.','book',{smarts:6},'I read a chapter and retained a surprising amount.'],
      ['play',age<18?'Make something':'Work on a hobby','Make room for a project of your own.','music',{joy:6,smarts:1},'I finished the project. One screw is unexplained.']
    ];
    if(age>=12 && age<18)list.push(['earn','Volunteer at the market','Help a neighbor set up their stall.','people',{bonds:3,health:-2},'I held the awning. The work was unpaid and windy.']);
    if(age>=18 && age<65)list.push(['earn','Take a side gig','Trade a little energy for pocket money.','coin',{cash:180,health:-2},'The work is done and the money is mine to keep.']);
    if(age>=12)list.push(['trip',age<18?'Go to the pictures':'Take a day trip',age<18?'A ticket costs '+historyEconomy.money(life,12)+'.':'A return ticket costs '+historyEconomy.money(life,65)+'.','ticket',{cash:age<18?-12:-65,joy:9,bonds:2},'I kept the ticket. Nobody requested a full trip report.']);
    return list.concat(world.specialActivities(life));
  }
  function actionReason(life,key,cost=0) {
    if(life.ended)return 'Life complete';
    if(blocking(life))return 'Finish the current decision';
    if(life.sim && life.sim.prison && !key.startsWith('visit-')&&!key.startsWith('social-')&&!['sim-doctor','sim-library','sim-yard','sim-appeal'].includes(key))return 'In custody';
    const repeat=['move','read','play','career-study','career-practice','sim-meditate'].includes(key)||key.startsWith('visit-');
    if(life.used.filter(id=>id===key).length>=(repeat?3:1))return repeat?'Try again next year':'Done this year';
    if(cost>life.cash)return 'Need '+(life.sim.timeline?.historicalRules?historyEconomy.money(life,cost):'$'+cost);
    return '';
  }
  function act(life,key) {
    const a=actionList(life).find(i=>i[0]===key);
    if(!a||actionReason(life,key,-(a[4].cash||0)))return null;
    if(key==='read')life.sim.habits.reading+=2;if(['move','greenway'].includes(key))life.sim.habits.exercise+=2;
    const generated=world.special(life,key);if(generated)return generated;
    const delta=apply(life,a[4]);life.used.push(key);
    log(life,'Activity',a[1],a[5],delta);
    return {title:a[1],text:a[5],delta};
  }
  function visit(life,key){return world.social(life,key,'visit');}
  function legacyTitle(life){
    if(sim.ribbon(life))return sim.ribbon(life);
    const best=Object.keys(statNames).reduce((a,b)=>life.stats[b]>life.stats[a]?b:a,'joy');
    return {joy:'Generally content',health:'Still had steps left',smarts:'Read the fine print',bonds:'People person',looks:'Well put together'}[best];
  }
  function eligibleHeirs(parent){
    const children=sim.children(parent);
    if(children.length)return children;
    // A sibling, cousin, niece or nephew is a branch continuation, not a child
    // and not an automatic beneficiary of the deceased character's estate.
    return Object.entries(parent.people).filter(([,p])=>p.met&&model.isAlive(p)&&
      ['Sibling','Cousin','Niece','Nephew'].includes(p.role)&&sim.ageOf(parent,p)<=70&&
      (!parent.sim.timeline?.historicalRules||p.bornYear>=1200));
  }
  function continueAs(parent,key){
    const p=parent.people[key];
    if(!parent.ended||parent.sim.successor||!p||!eligibleHeirs(parent).some(([id])=>id===key))return null;
    const direct=p.role==='Child';
    const age=sim.ageOf(parent,p);if(age===null||age<0)return null;
    const surname=parent.name.trim().split(/\s+/).slice(1).join(' ');
    const name=p.name.includes(' ')||!surname?p.name:p.name+' '+surname;
    const portion=direct?(sim.estate(parent)[key]||{cash:0,loans:{},assets:{},total:0}):{cash:0,loans:{},assets:{},total:0};
    const inherited=portion.cash;
    const birthToken=Number.isInteger(p.bornAt)?p.bornAt+1:Number.isInteger(p.bornYear)?p.bornYear:age;
    const child=makeLife({seed:(parent.rng^Math.imul(birthToken,2654435761)^model.hash(key))>>>0||1,
      name,town:p.town&&sim.geography.cities[p.town]?p.town:parent.town,skin:parent.skin,thread:parent.thread,successor:true});
    child.born=parent.born+parent.age-age;child.age=age;child.lifeSpan=Math.max(age+4,child.lifeSpan);
    if(parent.sim.timeline){
      child.sim.timeline={historicalRules:!!parent.sim.timeline.historicalRules};
      if(parent.sim.timeline.nobleHouse&&Object.values(portion.assets).some(a=>a.listing?.type==='era-estate')){
        child.sim.timeline.nobleHouse=true;
        model.tag(child,'landed-house');
      }
    }
    year.inheritRealism(parent,child);
    if(parent.sim.chronicleWorld)child.sim.chronicleWorld=JSON.parse(JSON.stringify(parent.sim.chronicleWorld));
    child.id=p.id;child.name=p.fullName||child.name;child.sim.identity=p.gender||child.sim.identity;
    child.world.owned=portion.assets;child.sim.loans=portion.loans;for(const a of Object.values(child.world.owned))a.at=age;
    child.sim.generation=parent.sim.generation+(direct||['Niece','Nephew'].includes(p.role)?1:0);
    child.sim.birthplace=direct?sim.childBirthplace(parent,p):p.birthTown||p.town||parent.town;
    child.sim.ancestors=direct?parent.sim.ancestors.concat({name:parent.name,born:parent.born,died:parent.born+parent.age}):[];
    child.log=[];child.seen=[];child.keepsakes=[];child.event=null;
    const late={id:parent.id,fullName:parent.name,gender:parent.sim.identity,name:parent.name,role:'Parent',met:true,active:false,bond:p.bond,bornYear:parent.born,diedAt:age};
    const coparent=direct?expansion.kin.coparent(parent,p):null;
    if(!direct){
      // The original guardian generated with this relative is retained.
      child.people.carer.role='Guardian';
      child.people.carer.bornYear=child.born-29;
    }else if(coparent){
      child.people.carer={...coparent,name:coparent.name,role:'Parent',met:true,active:coparent.diedAt===undefined,
        bond:67,bornYear:coparent.bornYear||parent.born};
      if(coparent.diedAt!==undefined)child.people.carer.diedAt=parent.born+coparent.diedAt-child.born;
      child.people.lateparent=late;
    }else if(age<18){
      const relative=Object.values(parent.people).find(person=>person.active&&['Guardian','Parent','Mother','Father','Sibling'].includes(person.role)&&sim.ageOf(parent,person)>=18);
      if(relative){child.people.carer={...relative,role:'Guardian',active:true,met:true};}
      else child.people.carer.bornYear=child.born-29;
      child.people.lateparent=late;
    }else child.people.carer=late;
    child.people.friend.met=child.people.friend.active=age>=5;
    child.people.friend.bornYear=child.born;child.people.love.bornYear=child.born;
    if(direct)for(const [id,sibling] of sim.children(parent))if(id!==key)child.people['sibling-'+id]={...sibling,role:'Sibling',met:true,active:true,bond:55,bornYear:parent.born+sibling.bornAt};
    for(const member of Object.values(child.people))if(member.role==='Sibling')delete member.bornAt;
    if(age>=18){child.cash=inherited+(p.wealth||0);child.track='gap';}else child.sim.trust=inherited+(p.wealth||0);
    log(child,'Family',direct?'A new generation':'A different family branch',direct?
      'I am '+child.name+', age '+age+', the child of '+parent.name+'.':
      'I am '+child.name+', age '+age+', '+p.role.toLowerCase()+' of '+parent.name+'. The family story continues without an automatic estate transfer.');
    if(inherited)log(child,'Family',age<18?'An inheritance in trust':'My inheritance',historyEconomy.money(child,inherited)+(age<18?' is held until my eighteenth birthday.':' was transferred from the estate.'),age<18?{}:{cash:inherited});
    child.event={id:null,resolved:true};expansion.inherit(parent,child,portion);
    if(age>=18&&p.career&&jobs[p.career]){world.changeJob(child,p.career,true);child.track='work';}
    year.campus(child);
    if(Object.keys(portion.assets).length)log(child,'Assets','Inherited assets',Object.entries(portion.assets).map(([id,asset])=>world.shopping.title(world.shopping.ownedItem(id,asset))).join(', ')+'. I inherited the ownership share.');
    model.people(child);historyDynasty.inherit(parent,child,portion,key);
    for(const field of ['faithWorld','faithCongregations','faithEncounters']){
      if(parent.sim[field])child.sim[field]=JSON.parse(JSON.stringify(parent.sim[field]));
    }
    faithPersonal.inherit(parent,child,key);
    faithInstitutions.inherit(parent,child);
    faithLegacy.inherit(parent,child,key,context());
    parent.sim.successor=child.name;return child;
  }
  function startNext(game,next){
    if(!next||next===game.active)return false;
    game.archive.unshift(historyDynasty.archive(game.active,world,jobs));game.active=next;return true;
  }
  function state(l){return model.view(l,world,sim,jobs);}
  function encodeGame(g){return {version:4,settings:{...g.settings},active:model.encode(g.active,world,sim,jobs),archive:g.archive.map(l=>historyDynasty.isArchive(l)?l:model.encode(l,world,sim,jobs))};}
  function decodeGame(data){
    if(!data||![1,2,3,4].includes(data.version)||!data.active||!Array.isArray(data.archive))throw Error('Unrecognized save');
    const active=migrate(data.active),archive=data.archive.map(saved=>{if(!historyDynasty.isArchive(saved))return migrate(saved,true);historyDynasty.validateArchive(saved);return saved;});
    if(!Number.isInteger(active.age)||!Number.isFinite(active.cash)||!Array.isArray(active.log))throw Error('Incomplete save');
    return {version:4,active,archive,settings:{motion:'system',...(data.settings||{})}};
  }
  root.PocketEngine={faithEncounters,faithCatalog,faithPersonal,faithMovements,faithInstitutions,faithLegacy,faithCommunity,faithPerform,calendar,isHistorical,historyWorld,historyEconomy,historyDynasty,historyPerform,eligibleHeirs,expansion,state,startNext,model,events,year,blocking,acknowledge,encodeGame,decodeGame,stories,statNames,towns,jobs,origins,households,world,sim,continueAs,migrate,makeLife,customizeBirth,copy,chapter,occupation,portrait,decide,advance,actionList,actionReason,act,visit,income,legacyTitle,cleanName,seed};
})(typeof module !== 'undefined' && module.exports ? module.exports : window);
