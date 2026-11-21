/* Household beliefs, voluntary practice and paid service. Reads do not advance the life RNG. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const model=node?require('./model.js').PocketModel:root.PocketModel;
  const economy=node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  const world=node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;
  const catalog=()=>node?require('./faith-catalog.js').PocketFaithCatalog:root.PocketFaithCatalog;
  const year=l=>l.born+l.age;
  const score=n=>Math.round(Math.max(0,Math.min(100,n)));
  const roll=(...parts)=>model.hash(parts.join('|'));
  const statusOptions=[
    {id:'practicing',title:'Practicing'},{id:'cultural',title:'Culturally connected'},
    {id:'questioning',title:'Questioning'},{id:'private',title:'Private'}
  ];
  const metrics=['devotion','knowledge','involvement','conviction'];
  const neutral=new Set(['unaffiliated','secular','agnostic','atheist']);
  const fasts=new Map([
    ['sunni','Ramadan'],['shia','Ramadan'],['ibadi','Ramadan'],['judaism','Yom Kippur'],
    ['catholic','Lent'],['orthodox','Great Lent'],['oriental-orthodox','a community fast'],['bahai','the Nineteen-Day Fast']
  ]);
  function movements(l){return Object.values(l.sim.faithWorld?.movements||{});}
  function tradition(l,id){
    const established=catalog().get(id);
    if(established)return established;
    const m=movements(l).find(m=>m.id===id);
    if(!m)return null;
    return {id:m.id,name:m.name,summary:m.teachings||m.summary,secular:m.type==='philosophy',
      institution:m.worship||m.name,roles:[],movement:m,
      rites:[{id:'gathering',name:m.ceremonies,description:'Take part in the observance recorded in the charter.'},
        {id:'writing',name:'Study the founding teachings',description:m.writings}],
      holidays:[{name:m.holidays,timing:'Community observance recorded in the charter.'}]};
  }
  function name(l,id){return tradition(l,id)?.name||'Unaffiliated';}
  function statusName(s){return statusOptions.find(o=>o.id===s)?.title||'Private';}
  function birthOptions(y,town){
    return [{id:'family',title:'Inherit a family tradition',description:'Start with a tradition from your household.'},
      {id:'exploring',title:'Explore beliefs',description:'Begin without an affiliation and decide for yourself.'},
      ...catalog().options(y,town).map(t=>({id:t.id,title:t.name,description:t.summary}))];
  }
  function allowedBirth(y,town,opts){
    const id=opts.faithId??'family',status=opts.faithStatus;
    return (id==='family'||id==='exploring'||catalog().available(id,y))&&(!status||statusOptions.some(s=>s.id===status));
  }
  function localBelief(l,p,key,y){
    const h=roll(l.id,p.id||key,'household faith');
    if(h%7===0)return 'unaffiliated';
    const code=p.town||l.town;
    const local=catalog().options(y,code).filter(t=>!neutral.has(t.id)&&catalog().local(t.id,code,y));
    return local.length?local[h%local.length].id:'unaffiliated';
  }
  function makeIdentity(id,seed,status){
    const state=status||statusOptions[seed%statusOptions.length].id;
    return {id,status:state,devotion:18+seed%58,knowledge:12+(seed>>>6)%54,involvement:10+(seed>>>12)%58,conviction:16+(seed>>>18)%60};
  }
  function npcState(l,key,p,defaults=false){
    if(p.faith&&!defaults)return p.faith;
    const seed=roll(l.id,p.id||key,'personal faith');
    let id='unaffiliated';
    if(l.sim.faith||defaults){
      const y=p.bornYear||l.born+(p.bornAt??l.age);
      if(['Child','Stepchild'].includes(p.role)&&l.sim.faith){
        const f=l.sim.faith,partner=l.people.love?.faith;
        const upbringing=f.upbringing||'shared';
        id=upbringing==='open'?'unaffiliated':upbringing==='my-tradition'?f.id:partner&&seed%2?partner.id:f.id;
      }else id=localBelief(l,p,key,Math.min(year(l),Math.max(1200,y+12)));
    }
    return makeIdentity(id,seed);
  }
  function npc(l,person,key){
    const p=typeof person==='string'?l.people[person]:person;if(!p)return null;
    const k=typeof person==='string'?person:key||p.id||p.name;
    const f=npcState(l,k,p);
    return {...f,name:name(l,f.id),statusLabel:statusName(f.status),intensity:f.devotion};
  }
  function create(l,opts,legacy){
    if(!allowedBirth(l.born,l.town,opts))return null;
    const seed=roll(l.id,l.born,'starting faith');
    const parentKeys=['carer','parent2'].filter(k=>l.people[k]);
    let id=opts.faithId||'family',status=opts.faithStatus;
    const inherited=id==='family';
    if(inherited){
      const key=parentKeys[seed%Math.max(1,parentKeys.length)];
      id=legacy||!key?'unaffiliated':npcState(l,key,l.people[key],true).id;
    }
    if(id==='exploring'){id='unaffiliated';status='questioning';}
    const f=Object.assign(makeIdentity(id,seed,status),{service:0,training:0,experience:0,openHouse:false,originalId:id,backgroundChoice:opts.faithId||'family',upbringing:'shared',history:[],rituals:[]});
    if(l.age<5){f.knowledge=0;f.involvement=0;f.conviction=12;f.devotion=Math.min(f.devotion,25);}
    l.sim.faith=f;
    for(const [key,p] of Object.entries(l.people)){
      if(legacy)p.faith=p.faith||makeIdentity('unaffiliated',roll(l.id,p.id||key,'personal faith'));
      else p.faith=npcState(l,key,p,true);
    }
    return f;
  }
  function initialize(l,opts={}){
    if(l.sim.faith)return l.sim.faith;
    return create(l,opts,false);
  }
  function customize(l,opts={}){
    if(l.age||l.turns||l.used.length||l.sim.generation>1||l.ended)return false;
    const selection=opts.faithId??l.sim.faith?.backgroundChoice??'family';
    return !!create(l,{...opts,faithId:selection},false);
  }
  function state(l){
    if(l.sim.faith)return l.sim.faith;
    const f=makeIdentity('unaffiliated',roll(l.id,l.born,'starting faith'),'private');
    if(l.age<5){f.knowledge=0;f.involvement=0;f.conviction=12;f.devotion=Math.min(f.devotion,25);}
    return {...f,service:0,training:0,experience:0,originalId:'unaffiliated',backgroundChoice:'unaffiliated',openHouse:false,history:[],rituals:[],upbringing:'shared'};
  }
  function ensure(l){return l.sim.faith||create(l,{faithId:'unaffiliated',faithStatus:'private'},true);}
  function profile(l){
    const f=state(l),t=tradition(l,f.id);
    const familyIds=new Set([f.id]);
    for(const [k,p] of Object.entries(l.people)){
      if(p.met&&model.isAlive(p)&&(model.isFamily(p)||p.role==='Spouse'))familyIds.add(npcState(l,k,p).id);
    }
    const career=role(l.job);
    return {...f,history:(f.history||[]).map(e=>({...e})),rituals:[...(f.rituals||[])],name:t?.name||'Unaffiliated',statusLabel:statusName(f.status),intensity:f.devotion,
      career:career?.name||null,family:[...familyIds].map(id=>name(l,id)).join(' · ')};
  }
  function remember(l,f,id,text){
    f.history.push({year:year(l),id,text});
    if(f.history.length>48)f.history.splice(0,f.history.length-48);
  }
  let rolesTable,jobTable;
  function buildRoles(){
    if(rolesTable)return;
    rolesTable={};jobTable={};
    function add(id,title,level,stipend=false,start=null){
      const salary=[18500,26500,35000,43000][level]*(stipend?.62:1);
      rolesTable[id]={id,name:title,level,stipend,start};jobTable[id]=[title,Math.round(salary)];
    }
    add('faith-community-assistant','Community assistant',0);
    add('faith-community-organizer','Community organizer',1);
    add('faith-community-educator','Community educator',2);
    add('faith-community-director','Community director',3);
    for(const t of catalog().traditions){
      (t.roles||[]).forEach((r,i)=>add('faith-'+t.id+'-'+r.id,r.name,
        Math.max(1,Math.min(3,i+1)),/monastic|monk|nun|novice/i.test(r.kind+' '+r.name),r.start||null));
    }
  }
  function role(id){if(!id?.startsWith('faith-'))return null;buildRoles();return rolesTable[id]||null;}
  function wage(l,id,age=l.age,town=l.town,raise=l.job===id?l.extraPay||0:0,npc=false){
    const r=role(id);if(!r)return 0;
    const p=economy.profile(l,age,town),salary=jobTable[id][1];
    const scale=economy.historical(l,age)?p.food/7500:1;
    const existing=!npc&&l.job===id&&l.world.contractRole!==id;
    const amount=(salary*scale+raise)*(existing?(p.legacyPay??p.pay):p.pay);
    return npc?Math.round(amount):economy.contractPay(l,id,amount);
  }
  function leaveOffice(l,ctx){
    if(!role(l.job))return;
    ctx.world.changeJob(l,null,true);
    if(l.sim.expansion)delete l.sim.expansion.employer;
  }
  function affiliate(l,id,status,ctx){
    const f=ensure(l),previous=f.id;
    if(previous!==id){leaveOffice(l,ctx);f.id=id;f.openHouse=false;f.involvement=score(f.involvement*.65);}
    f.status=status;
    const text=previous===id?'I chose a different way to take part.':'I changed my affiliation from '+name(l,previous)+' to '+name(l,id)+'.';
    remember(l,f,'belief',text);return text;
  }
  function affiliateMovement(l,id,ctx){
    if(!movementIdKnown(l,id))return false;
    affiliate(l,id,'practicing',ctx);return true;
  }
  function movementIdKnown(l,id){return movements(l).some(m=>m.id===id);}
  function requirements(l,r,f){
    if(l.age<18)return 'Available at 18';
    if(l.sim.prison)return 'Unavailable in custody';
    if(l.sim.program||l.job==='student')return 'Complete or leave your course';
    if(l.job===r.id)return 'Current role';
    if(r.start&&year(l)<r.start)return 'Unavailable this year';
    if(!r.id.startsWith('faith-community-')&&!catalog().local(f.id,l.town,year(l))&&
        !l.sim.faithWorld?.institutions?.sites?.some(s=>s.town===l.town&&s.faithId===f.id)&&f.involvement<50)
      return 'Build a local community or reach 50 involvement';
    const thresholds=[[0,0,0,0],[24,1,1,0],[45,2,3,1],[66,3,5,3]][r.level];
    if(f.knowledge<thresholds[0])return 'Needs '+thresholds[0]+' knowledge';
    if(f.training<thresholds[1]&&!(r.level<=2&&(l.sim.degree||l.world.tradeQualified)))return 'Needs '+thresholds[1]+' training sessions';
    if(f.service<thresholds[2])return 'Needs '+thresholds[2]+' service activities';
    if(f.experience<thresholds[3])return 'Needs '+thresholds[3]+' years of community employment';
    if(r.level>=2&&(l.world.performance<43||l.world.reputation<r.level*2))return 'Needs strong work and community references';
    return '';
  }
  function options(l,group){
    const f=state(l),t=tradition(l,f.id),isSecular=neutral.has(f.id)||t?.secular,choices=[];
    const hasCommunity=!isSecular&&!!t,age=l.age,y=year(l);
    const price=n=>economy.money(l,n);
    const factor=economy.historical(l)?economy.profile(l).food/7500:1;
    const fee=n=>Math.max(1,Math.round(n*factor));
    function add(id,title,description,icon,config){
      const {min=5,cost=0,why='',effects={},progress={},run,category='',privateAct=false}=config;
      const token='faith/'+group+'/'+id,shared=category?'faith-limit/'+category:null;
      const reason=l.ended?'Life complete':(l.event&&!l.event.resolved)||l.sim.review||l.sim.court?'Finish the current decision':
        age<min?'Available at '+min:l.sim.prison&&!privateAct?'Unavailable in custody':why||
        (l.used.includes(token)||shared&&l.used.includes(shared)?'Already done this year':'')||(l.cash<cost?'Needs '+price(cost):'');
      choices.push({id,title,description:description+(cost?' · '+price(cost):''),icon,reason,token,shared,run,cost,effects,progress});
    }
    if(group==='practice'){
      add('reflect',isSecular?'Reflect on your values':'Spend time in reflection','Set aside time to consider what matters to you.','leaf',
        {progress:{conviction:3},effects:{joy:2},privateAct:true,run:()=> 'I sat quietly with a question. I brought it home with me.'});
      add('meditate','Meditate','Practice paying attention.','sun',
        {progress:{devotion:2},effects:{discipline:2,joy:2},privateAct:true,run:()=> 'I lost track of my thoughts. This time it was intentional.'});
      if(t){
        if(hasCommunity)add('prayer','Personal prayer or contemplation','Observe a private practice in your own way.','leaf',
          {progress:{devotion:5,conviction:1},privateAct:true,run:()=> 'I made time for a private observance.'});
        for(const r of t.rites||[]){
          add('rite-'+r.id,r.name,r.description||'Join this observance voluntarily.','sun',{progress:{devotion:3,knowledge:1,involvement:3},
            run:()=> 'I took part in '+r.name+'. I remembered the people who taught me.'});
        }
        for(const [index,h] of (t.holidays||[]).entries()){
          add('holiday-'+index,'Observe '+h.name,h.timing||'An annual community observance.','sprout',{progress:{knowledge:2,involvement:3},effects:{bonds:2},
            run:()=> 'I made room for '+h.name+' in the household calendar.'});
        }
        if(fasts.has(f.id))add('fast','Observe a fast','Take part in a personal observance during '+fasts.get(f.id)+'.','leaf',
          {min:18,progress:{devotion:4,knowledge:1},privateAct:true,run:()=> 'I set aside time for a fast during '+fasts.get(f.id)+'.'});
        if(hasCommunity)add('sacred-visit','Visit a place of significance','Set aside a day to visit and learn about its history.','map',
          {min:12,cost:fee(12),progress:{knowledge:3,devotion:3},run:()=> 'I spent the day listening to people who cared for the place.'});
        if(hasCommunity)add('pilgrimage','Make a pilgrimage','Plan and fund a longer journey tied to your beliefs.','compass',
          {min:18,cost:fee(260),progress:{devotion:8,conviction:3},effects:{joy:5},run:()=> 'The journey took longer than I expected. I kept a page from my travel journal.'});
      }
      add(f.openHouse?'withdraw':'enroll',f.openHouse?'Leave the local circle':'Join a local circle',
        f.openHouse?'End your regular commitment to the group.':'Join a voluntary local study and service group.','people',
        {min:12,category:'membership',progress:{involvement:f.openHouse?-3:5},run:v=>{
          v.openHouse=!v.openHouse;return v.openHouse?'I joined the local circle. They put my name on the rota.':'I left the circle and handed over my rota.';
        }});
      add('gather','Attend a community gathering','Meet people who share an interest in belief or ethics.','people',
        {progress:{involvement:5,knowledge:1},effects:{bonds:3},run:()=> 'I stayed after the gathering. The chairs still needed stacking.'});
      add('study',hasCommunity?'Study your tradition':'Study ethics and traditions','Build knowledge through reading, listening or discussion.','book',
        {progress:{knowledge:7},effects:{smarts:2},privateAct:true,run:()=> 'I studied the subject and wrote down a better question.'});
      add('service','Volunteer locally','Help with a community project and earn service experience.','tools',
        {min:9,progress:{involvement:6},effects:{bonds:2},run:(v)=>{v.service++;l.world.reputation=score(l.world.reputation+2);return 'I took the shift nobody wanted. The work got done.';}});
      add('charity','Support community aid','Help a household fund food or supplies.','gift',
        {min:14,cost:fee(35),progress:{involvement:3},effects:{bonds:2},run:(v)=>{v.service++;return 'I contributed to the community fund. The next delivery went ahead.';}});
      add('teach','Lead a study circle','Teach what you know and take questions.','school',
        {min:16,why:f.knowledge<40?'Needs 40 knowledge':'',progress:{knowledge:2,involvement:4},run:(v)=>{v.service++;l.world.reputation=score(l.world.reputation+3);return 'The first question was harder than the lesson.';}});
    }
    if(group==='belief'){
      for(const s of statusOptions){
        add('status-'+s.id,s.title,'Choose how you relate to your current beliefs.','journal',
          {min:12,why:f.status===s.id?'Current outlook':'',category:'outlook',privateAct:true,progress:s.id==='questioning'?{conviction:-5,knowledge:2}:{conviction:2},
            run:(v)=>{v.status=s.id;const line='I described my outlook as '+s.title.toLowerCase()+'.';remember(l,v,'outlook',line);return line;}});
      }
      const available=[...catalog().options(y,l.town),...movements(l).filter(m=>!m.unitedWith&&m.foundedYear<=y).map(m=>tradition(l,m.id))];
      for(const a of available){
        if(a.id===f.id)continue;
        const action=a.id==='unaffiliated'?'Leave formal affiliation':a.communityRooted?'Record an affiliation with '+a.name:a.name;
        const leaving=!!role(l.job)?' This ends your current community post.':'';
        add('join-'+a.id,action,(a.summary||'Change personal affiliation.')+leaving,'people',
          {min:12,category:'affiliation',privateAct:true,run:(_v,ctx)=>affiliate(l,a.id,a.secular||neutral.has(a.id)?'private':'practicing',ctx)});
      }
    }
    if(group==='family'){
      const family=Object.entries(l.people).filter(([,p])=>p.met&&(model.isFamily(p)||['Partner','Engaged partner','Spouse'].includes(p.role)));
      const stages=['shared','open','my-tradition'];
      const names=['Share household traditions','Let children explore','Teach my own tradition'];
      if(family.some(([,p])=>p.role==='Child'&&model.isAlive(p)&&model.ageOf(l,p)<18)){
        stages.forEach((v,i)=>add('upbringing-'+v,names[i],'Decide how your household introduces young children to belief.','home',
          {min:16,why:(f.upbringing||'shared')===v?'Current approach':'',category:'upbringing',run:s=>{s.upbringing=v;
            for(const [k,p] of family)if(p.role==='Child'&&model.isAlive(p)&&model.ageOf(l,p)<12){
              const identity=assignNpc(l,k,p);
              if(v==='open'){identity.status='questioning';identity.conviction=score(identity.conviction-2);}
              else if(v==='my-tradition'){identity.id=s.id;identity.knowledge=score(identity.knowledge+2);}
              else{identity.knowledge=score(identity.knowledge+2);identity.status='cultural';}
            }
            const text='I chose to '+names[i].toLowerCase()+' at home.';remember(l,s,'upbringing',text);return text;}}));
      }
      for(const [key,p] of family){
        const personal=npcState(l,key,p),different=personal.id!==f.id,who=p.name;
        const record=(id,title,description,min,run)=>add(id+'-'+key,title,description,'family-tree',{min,why:
          (f.rituals||[]).includes(id+'@'+(p.id||key))?'Already recorded':'',effects:{bonds:3},progress:{involvement:2},run:(v)=>{
            v.rituals.push(id+'@'+(p.id||key));const text=run();remember(l,v,id,text);return text;}});
        if(!model.isAlive(p)){
          if(p.diedAt!==undefined||p.diedYear!==undefined)record('funeral','Hold a remembrance for '+who,'Mark this relative’s death in the family record.',8,()=> 'We shared stories about '+who+'. One story was told twice.');
          continue;
        }
        if(p.role==='Spouse')record('wedding','Mark the marriage with '+who,'Choose a family observance for your marriage.',18,()=>{p.bond=score(p.bond+4);return 'We marked our marriage in a way we both agreed to.';});
        if(p.role==='Child'&&model.ageOf(l,p)<5)record('welcome','Hold a welcome for '+who,'Invite relatives to welcome the child.',16,()=>{p.bond=score(p.bond+3);return 'We introduced '+who+' to the family. The guest of honor slept.';});
        if(different||personal.tension){
          add('listen-'+key,'Discuss beliefs with '+who,'Listen to their view and build trust across differences.','chat',
            {min:8,category:'conversation/'+key,effects:{bonds:2},progress:{knowledge:2},run:()=>{const n=assignNpc(l,key,p);
              const tense=n.tension||0;n.tension=Math.max(0,tense-5);p.bond=score(p.bond+(tense?6:3));p.trust=score((p.trust??p.bond)+4);
              return tense?'We reconciled over our disagreement. Our beliefs stayed our own.':who+' explained their view. I let them finish.';}});
          add('press-'+key,'Press '+who+' to agree','Risk an argument by insisting they follow your practice.','chat',
            {min:13,category:'conversation/'+key,effects:{bonds:-2},progress:{conviction:1},run:()=>{const n=assignNpc(l,key,p);
              n.tension=Math.min(20,(n.tension||0)+5);p.bond=score(p.bond-5);p.trust=score((p.trust??p.bond)-3);
              return who+' asked me to stop deciding for them.';}});
        }
      }
    }
    if(group==='career'){
      buildRoles();
      add('train','Study for community service','Complete a session in ethics, administration or your own tradition.','book',
        {min:14,progress:{knowledge:6},effects:{smarts:2},run:v=>{v.training++;return 'I finished a training session. My notes were more legible this time.';}});
      const special=t?.roles?.map(r=>'faith-'+f.id+'-'+r.id)||[];
      const tracks=['faith-community-assistant',...special,...(!special.length?['faith-community-organizer','faith-community-educator','faith-community-director']:[])];
      for(const job of tracks){
        const r=role(job);if(!r)continue;
        add('take-'+job,r.name,'Annual '+(r.stipend?'stipend ':'pay ')+price(wage(l,job))+' · '+(t?.institution||'community service'),'bag',
          {min:18,why:requirements(l,r,f),category:'appointment',run:(_v,ctx)=>{ctx.world.changeJob(l,job,true);
            if(l.sim.expansion)l.sim.expansion.employer=t?.institution||'Community service';
            l.track='work';return 'I accepted a post as '+r.name.toLowerCase()+'. My duties start this year.';}});
      }
      if(role(l.job)){
        add('duty','Carry out your duties','Improve performance and build professional standing.','people',{min:18,progress:{involvement:3,knowledge:2},
          run:v=>{v.service++;l.world.performance=score(l.world.performance+7);l.world.reputation=score(l.world.reputation+3);return 'I finished my duties. There were more chairs than volunteers.';}});
        add('resign','Resign from the post','Give up this position and its future pay.','exit',{min:18,run:(_v,ctx)=>{leaveOffice(l,ctx);return 'I handed over the keys. The next shift belongs to somebody else.';}});
      }
    }
    return choices;
  }
  function actions(l,group){return options(l,group).map(({id,title,description,icon,reason})=>({id,title,description,icon,reason}));}
  function perform(l,group,id,ctx){
    if(!ctx||ctx.blocking(l))return null;
    const o=options(l,group).find(a=>a.id===id);
    if(!o||o.reason)return null;
    const f=ensure(l),before=Object.fromEntries([...metrics,'training','service'].map(k=>[k,f[k]]));
    const standing={performance:l.world.performance,reputation:l.world.reputation};
    l.used.push(o.token);if(o.shared)l.used.push(o.shared);
    const delta=ctx.apply(l,{...o.effects,...(o.cost?{cash:-o.cost}:{})});
    for(const [key,v] of Object.entries(o.progress))f[key]=score(f[key]+v);
    const text=o.run(f,ctx);
    for(const [key,value] of Object.entries(before))if(f[key]!==value)delta[key]=f[key]-value;
    for(const [key,value] of Object.entries(standing))if(l.world[key]!==value)delta[key]=l.world[key]-value;
    f.lastParticipation=year(l);l.turns++;
    ctx.log(l,'Faith',o.title,text,delta);
    return {title:o.title,text,delta};
  }
  function assignNpc(l,key,p){
    if(!p.faith)p.faith=npcState(l,key,p);
    return p.faith;
  }
  function inherit(parent,child,key){
    const heir=parent.people[key],personal=heir?npcState(parent,key,heir):state(parent);
    const f=child.sim.faith||(child.sim.faith=state(child));
    for(const k of ['id','status',...metrics])f[k]=personal[k];
    f.originalId=personal.id;f.backgroundChoice=personal.id;f.openHouse=false;f.history=[];f.rituals=[];f.experience=personal.serviceYears||0;f.service=0;f.training=0;f.upbringing='shared';delete f.lastAnnual;
    const known=new Map(Object.entries(parent.people).filter(([,p])=>p.id).map(([k,p])=>[p.id,npcState(parent,k,p)]));
    for(const [k,p] of Object.entries(child.people)){
      if(p.id===parent.id)p.faith=Object.fromEntries(['id','status',...metrics].map(key=>[key,state(parent)[key]]));
      else if(known.has(p.id))p.faith={...known.get(p.id)};
      else if(!p.faith)p.faith=npcState(child,k,p);
    }
    return f;
  }
  function npcVocation(l,p,n,age,h,ctx){
    const previous=role(p.career);
    if(previous){
      if(age>=67||p.job==='Retired'){
        p.career='retired';p.job='Retired';return;
      }
      n.serviceYears=(n.serviceYears||0)+1;
      n.knowledge=score(n.knowledge+1);
      n.involvement=score(n.involvement+1);
      if(!p.communityEmployer){
        const earnings=wage(l,p.career,l.age,p.town||l.town,0,true);
        p.wealth=Math.max(0,(p.wealth||0)+Math.round(earnings*.035));
      }
    }
    if(age<20||age>=62||n.status==='questioning'||!previous&&h%97!==0)return;
    if((n.knowledge<32||n.involvement<27)&&!previous)return;
    const t=tradition(l,n.id),special=(t?.roles||[]).map(r=>'faith-'+n.id+'-'+r.id);
    const track=special.length?special:['faith-community-organizer','faith-community-educator','faith-community-director'];
    let next='faith-community-assistant';
    if(previous){
      if(previous.level>=3||h%7!==0||n.serviceYears<previous.level*3+2||n.knowledge<30+previous.level*12)return;
      next=track[previous.level];if(!next)return;
    }
    const r=role(next);if(!r)return;
    p.career=next;p.job=r.name;
    if(!previous)n.serviceYears=0;
    if(model.isFamily(p)||p.bond>=60)ctx.log(l,'Faith',p.name+' took a community post',p.name+' now works as '+r.name.toLowerCase()+'.');
  }
  function annual(l,ctx){
    if(l.ended)return;
    const f=ensure(l),y=year(l);
    if(f.lastAnnual===y)return;
    f.lastAnnual=y;
    const working=role(l.job);
    if(f.openHouse)f.involvement=score(f.involvement+1);
    if(working){f.experience++;f.knowledge=score(f.knowledge+1);f.involvement=score(f.involvement+1);}
    if(Number.isInteger(f.lastParticipation)&&y-f.lastParticipation>=3)f.involvement=score(f.involvement-1);
    for(const [k,p] of Object.entries(l.people)){
      if(!p.met||!model.isAlive(p))continue;
      const n=assignNpc(l,k,p),age=model.ageOf(l,p);
      if(age<14||age===null)continue;
      const h=roll(l.id,p.id||k,y,'personal outlook');
      npcVocation(l,p,n,age,roll(l.id,p.id||k,y,'community work'),ctx);
      if(h%59===0){
        n.status=n.status==='questioning'?'private':'questioning';
        n.conviction=score(n.conviction+(n.status==='questioning'?-6:3));
        if(model.isFamily(p)||p.role==='Spouse')ctx.log(l,'Faith',p.name+' reconsidered a belief',p.name+' described their outlook as '+statusName(n.status).toLowerCase()+'.');
      }else if(n.status==='questioning'&&h%31===0){
        const localGroups=movements(l).filter(m=>!m.unitedWith&&m.regions[world.region(p.town||l.town)]?.followers>0);
        const target=localGroups.length&&h%3===0?localGroups[h%localGroups.length].id:
          h%2?'unaffiliated':localBelief(l,p,k,y);
        if(target!==n.id){
          n.id=target;n.status=neutral.has(target)?'private':'practicing';n.conviction=score(n.conviction+3);
          if(role(p.career)&&!p.career.startsWith('faith-community-')){
            p.career='faith-community-assistant';p.job=role(p.career).name;
          }
          if(model.isFamily(p)||p.role==='Spouse')ctx.log(l,'Faith',p.name+' chose a new affiliation',p.name+' now identifies as '+name(l,target)+'.');
        }
      }else if(h%19===0){n.knowledge=score(n.knowledge+2);n.involvement=score(n.involvement+(h%2?2:-1));}
    }
  }
  function validate(l){
    const f=l.sim.faith;if(!f)return true;
    function check(n){
      if(!n||typeof n.id!=='string'||!n.id||n.id.length>180||!tradition(l,n.id)||!statusOptions.some(s=>s.id===n.status)||
         metrics.some(k=>!Number.isInteger(n[k])||n[k]<0||n[k]>100)||
         n.serviceYears!==undefined&&(!Number.isSafeInteger(n.serviceYears)||n.serviceYears<0)||
         n.tension!==undefined&&(!Number.isInteger(n.tension)||n.tension<0||n.tension>20))throw Error('Invalid personal belief record');
    }
    check(f);
    if(!['shared','open','my-tradition'].includes(f.upbringing)||typeof f.openHouse!=='boolean'||
      f.backgroundChoice!==undefined&&(typeof f.backgroundChoice!=='string'||f.backgroundChoice.length>180)||
      !['training','service','experience'].every(k=>Number.isSafeInteger(f[k])&&f[k]>=0)||
      !Array.isArray(f.rituals)||f.rituals.some(e=>typeof e!=='string')||
      !Array.isArray(f.history)||f.history.length>48||f.history.some(e=>!e||!Number.isSafeInteger(e.year)||typeof e.id!=='string'||typeof e.text!=='string'))throw Error('Invalid personal faith history');
    for(const p of Object.values(l.people))if(p.faith)check(p.faith);
    return true;
  }
  root.PocketFaithPersonal={get jobs(){buildRoles();return jobTable;},role,wage,initialize,customize,allowedBirth,profile,name,npc,actions,perform,annual,inherit,
    affiliateMovement,birthOptions,statusOptions,validate};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
