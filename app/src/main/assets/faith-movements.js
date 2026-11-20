/* Fictional player-founded movements. Population and accounts are aggregated by
   region; no annual pass creates one character per follower. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const M=node?require('./model.js').PocketModel:root.PocketModel;
  const H=node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;
  const regions=['europe','africa','westAsia','centralAsia','southAsia','eastAsia','southeastAsia','americas','oceania'];
  const regionNames={europe:'Europe',africa:'Africa',westAsia:'West Asia',centralAsia:'Central Asia',southAsia:'South Asia',eastAsia:'East Asia',southeastAsia:'Southeast Asia',americas:'The Americas',oceania:'Oceania'};
  const economy=node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  const year=l=>l.born+l.age;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const num=n=>n.toLocaleString('en-US');
  function chance(seed){
    let n=M.hash(seed);n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);
    return ((n^(n>>>16))>>>0)/4294967296;
  }
  function pick(key,label,list){return {key,label,type:'select',required:true,choices:list.map(([id,label])=>({id,label}))};}
  function input(key,label,maxLength,type='text',required=false){return {key,label,type,maxLength,required};}
  const fields=[
    input('name','Movement name',60,'text',true),input('adherentName','Name for a follower',42),input('symbol','Symbol or emblem',48),
    pick('type','Kind of movement',[['community','Community fellowship'],['devotional','Devotional tradition'],['philosophy','Philosophical school'],['reform','Reform movement'],['service','Service fellowship'],['contemplative','Contemplative order'],['revival','Revival movement'],['denomination','New denomination'],['secular','Secular association']]),
    input('spirituality','Spiritual outlook',180,'textarea'),input('teachings','Foundational teaching',280,'textarea'),
    input('writings','Sacred writings or oral tradition',120),input('holidays','Holidays and observances',120),input('ceremonies','Ceremonies',160),
    pick('governance','Organization of leadership',[['central','Central leader'],['council','Council'],['elected','Elected leadership'],['hereditary','Hereditary leadership'],['local','Independent local communities']]),
    input('values','Shared values',160),input('rules','Community rules',180,'textarea'),input('worship','Worship or gathering place',110),
    input('clothing','Clothing or symbols worn',110),
    pick('sharing','How teachings are shared',[['example','Personal example'],['meetings','Open gatherings'],['travel','Traveling teachers'],['writing','Written or dictated works'],['service','Community service'],['broadcast','Broadcast talks'],['online','Online meetings']])
  ];
  function schema(l){
    return fields.map(f=>f.key==='sharing'?{...f,choices:f.choices.filter(c=>!(c.id==='broadcast'&&year(l)<1920)&&!(c.id==='online'&&year(l)<1993))}:f);
  }
  function defaultDraft(){
    return {name:'',adherentName:'Member',symbol:'An open hand',type:'community',spirituality:'Open to personal interpretation',teachings:'Practice mutual care.',
      writings:'Oral teachings',holidays:'Founding day',ceremonies:'A welcome gathering',governance:'council',values:'Hospitality',rules:'Participation is voluntary.',
      worship:'A shared meeting place',clothing:'Everyday clothing',sharing:'meetings'};
  }
  function clean(v){return String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ');}
  function world(l){return l.sim.faithWorld||null;}
  function initialize(l){
    const w=l.sim.faithWorld||(l.sim.faithWorld={});
    if(!w.movements)w.movements={};
    if(!Number.isSafeInteger(w.movementSequence))w.movementSequence=0;
    return w;
  }
  const list=l=>Object.values(world(l)?.movements||{});
  function get(l,id){const m=world(l)?.movements;return m&&Object.prototype.hasOwnProperty.call(m,id)?m[id]:null;}
  const followers=m=>Object.values(m?.regions||{}).reduce((n,r)=>n+r.followers,0);
  function regional(l,id){const m=get(l,id);return Object.entries(m?.regions||{}).map(([region,r])=>({region,label:regionNames[region],...r})).sort((a,b)=>b.followers-a.followers||a.region.localeCompare(b.region));}
  function log(l,ctx,title,text,delta={}){
    if(ctx?.log)ctx.log(l,'Faith',title,text,delta);
    else l.log.push({age:l.age,kind:'Faith',title,body:text,delta});
    return {title,text,delta};
  }
  function record(m,year,kind,text){
    m.history.push({year,kind,text});
    // Everyday outreach can repeat, while every structural change and
    // milestone remains part of the permanent organizational archive.
    const routine=new Set(['gather','visit','service','teacher','charity','assembly']);
    if(routine.has(kind)&&m.history.length>120){
      let count=0;
      for(let i=m.history.length-1;i>=0;i--){
        if(routine.has(m.history[i].kind)&&++count>120){m.history.splice(i,1);break;}
      }
    }
  }
  function locked(l){if(l.ended)return 'Life complete';if(l.sim.review||l.sim.court||l.event&&!l.event.resolved)return 'Finish the current decision';return l.sim.prison?'In custody':'';}
  function foundReason(l){return locked(l)||(l.age<18?'Opens at 18':l.used.includes('faith-found')?'Already founded a movement this year':'');}
  function uniqueName(l,text,except=''){return !list(l).some(m=>m.id!==except&&m.name.toLowerCase()===text.toLowerCase());}
  function validateDraft(l,draft){
    const reason=foundReason(l);if(reason)return reason;
    if(!draft||typeof draft!=='object'||Array.isArray(draft))return 'Enter the founding details';
    const merged={...defaultDraft(),...draft};
    for(const f of schema(l)){
      const value=merged[f.key];
      if(typeof value!=='string')return 'Check '+f.label.toLowerCase();
      if(f.required&&!clean(value))return 'Enter '+f.label.toLowerCase();
      if(f.maxLength&&Array.from(clean(value)).length>f.maxLength)return f.label+' is too long';
      if(f.choices&&!f.choices.some(c=>c.id===value))return 'Choose an available '+f.label.toLowerCase();
    }
    return uniqueName(l,clean(merged.name))?'':'That movement name is already in use';
  }
  function charter(l,draft){
    const defaults=defaultDraft(),result={};
    for(const f of fields)result[f.key]=clean(draft[f.key]??defaults[f.key])||defaults[f.key];
    return result;
  }
  function regionFor(l){return H.region(l.town);}
  let anchorTowns;
  function anchor(region,m){
    if(region===m.originRegion)return m.town;
    if(!anchorTowns){
      anchorTowns={};
      for(const p of H.choices(1200))if(!anchorTowns[p.region])anchorTowns[p.region]=p.id;
    }
    return anchorTowns[region]||null;
  }
  function local(m,r){
    return m.regions[r]||(m.regions[r]={followers:0,trust:50,influence:0,teachers:0,carry:0,town:anchor(r,m)});
  }
  function make(l,data,parentId){
    const w=initialize(l),y=year(l);let id;
    do{id='movement-'+l.id+'-'+(++w.movementSequence).toString(36);}while(w.movements[id]);
    const originRegion=regionFor(l),meta={founderId:l.id,founderName:l.name,foundedYear:y,town:l.town,originRegion};
    const m={...data,...meta,id,original:Object.freeze({...data,...meta}),parentId,unitedWith:null,leadership:data.governance,
      leaderId:l.id,leaderName:l.name,successorId:null,regions:{},known:{},treasury:0,works:[],history:[],lastYear:y,lastChange:0,stability:65,status:'active',summary:data.teachings};
    w.movements[id]=m;local(m,originRegion).followers=1;
    return m;
  }
  function affiliate(l,m,ctx){
    const p=node?require('./faith-personal.js').PocketFaithPersonal:root.PocketFaithPersonal;
    p.affiliateMovement(l,m.id,ctx);
  }
  function found(l,draft,ctx){
    if(validateDraft(l,draft))return null;
    const m=make(l,charter(l,draft),null);affiliate(l,m,ctx);m.known[l.id]=m.originRegion;
    const invited=Object.entries(l.people).filter(([,p])=>p.met&&p.active&&!p.cutOff&&M.isAlive(p)&&M.ageOf(l,p)>=18&&(p.town||l.town)===l.town)
      .sort((a,b)=>b[1].bond-a[1].bond||a[0].localeCompare(b[0])).slice(0,3);
    const personal=node?require('./faith-personal.js').PocketFaithPersonal:root.PocketFaithPersonal;
    let joined=0;
    for(const [key,p] of invited){
      const identity=personal.npc(l,p,key);
      const willingness=.08+p.bond*.002+(identity.status==='questioning'?.16:0)-identity.conviction*.001;
      if(chance(m.id+'/'+p.id+'/invitation')>=willingness)continue;
      m.known[p.id]=m.originRegion;
      p.faith={...(p.faith||identity),id:m.id,status:'practicing'};
      delete p.faith.statusLabel;delete p.faith.name;delete p.faith.intensity;
      joined++;
    }
    local(m,m.originRegion).followers+=joined;syncAffiliations(l);m.previousCensus=followers(m);
    const text='I founded '+m.name+' in '+H.place(l.town,year(l)).city+'. '+(joined?joined+' of '+invited.length+' invited neighbors chose to join.':'The first member was me.');
    record(m,year(l),'found',text);l.used.push('faith-found');l.turns++;
    return {...log(l,ctx,'Movement founded',text),movementId:m.id};
  }
  function personal(l){
    const f=l.sim.faith||{};
    return {knowledge:Number(f.knowledge)||35,involvement:Number(f.involvement)||30};
  }
  function budget(m){return Math.max(0,Math.floor(m.treasury));}
  function canon(l,m){
    const active=new Set();let n=m;
    while(n?.unitedWith&&!active.has(n.id)){active.add(n.id);n=get(l,n.unitedWith);}
    return n;
  }
  function organization(l,id){
    // Preserve the original denomination on its deeds and founding records.
    return canon(l,get(l,id))?.id||id;
  }
  function related(l,a,b){
    const parents=m=>{const seen=new Set();while(m&&!seen.has(m.id)){seen.add(m.id);m=get(l,m.parentId);}return seen;};
    const pa=parents(a);return Array.from(parents(b)).some(id=>pa.has(id));
  }
  function rows(l,group){
    const out=[],home=regionFor(l),y=year(l),f=l.sim.faith||{};
    for(const m of list(l)){
      if(m.unitedWith)continue;
      const leader=m.leaderId===l.id,affiliated=canon(l,get(l,f.id))?.id===m.id;
      const crowd=followers(m),line=l.sim.dynasty?.curators||[];
      const relatedFounder=l.id===m.founderId||line.some(c=>c.id===m.founderId)||(l.sim.ancestors||[]).some(p=>p.name===m.founderName&&p.born<=m.foundedYear);
      const revival=crowd===0&&relatedFounder;
      if(!leader&&!affiliated&&!revival)continue;
      function add(section,op,title,description,icon,reason='',extra={}){
        if(!['movement','movements',section].includes(group))return;
        const id=m.id+'/'+op,token='faith-action/'+id;
        out.push({id,movementId:m.id,title,description,icon,section,reason:locked(l)||(l.used.includes(token)?'Done this year':'')||reason,...extra});
      }
      if(revival)add('outreach','revive','Revive the family movement','Reopen the old charter, join the community, and invite a new generation.','book',l.age<18?'Opens at 18':'');
      if(!leader&&!affiliated)continue;
      add('outreach','gather','Hold an open gathering','Speak locally. Attendance and membership are voluntary.','people',l.age<12?'Opens at 12':'');
      const contacts=Object.entries(l.people).filter(([,p])=>p.met&&p.active&&!p.cutOff&&M.isAlive(p)&&M.ageOf(l,p)>=18&&(p.town||l.town)===l.town&&p.faith?.id!==m.id);
      if(contacts.length)add('outreach','invite','Invite a contact','Offer a local contact an invitation. They decide whether to accept.','chat',l.age<16?'Opens at 16':'',
        {fields:[pick('contact','Contact',contacts.map(([key,p])=>[key,p.fullName||p.name]))]});
      if(y>=1920)add('outreach','broadcast',y>=1993?'Host an online discussion':'Give a broadcast talk','Reach listeners in another congregation.','mic',l.age<16?'Opens at 16':'');
      add('outreach','book',y<1450?'Dictate a work':'Publish a work','Record a teaching that can travel beyond your home.','book',l.age<16?'Opens at 16':'',{fields:[input('title','Title of the work',72)]});
      add('outreach','service','Organize community service','Work with neighbors. A successful project earns local trust.','heart',l.age<12?'Opens at 12':'');
      const others=regions.filter(r=>r!==home);
      add('outreach','visit','Visit another region','Travel and discuss the movement with interested residents.','compass',l.age<18?'Opens at 18':'',{fields:[pick('region','Destination region',others.map(r=>[r,regionNames[r]]))]});
      add('outreach','teacher','Support a traveling teacher','Use '+economy.money(l,24)+' in community funds to sustain a voluntary teaching post.','bag',!leader?'Requires leadership':budget(m)<24?'Needs '+economy.money(l,24)+' in the community treasury':'',{fields:[pick('region','Teaching region',regions.map(r=>[r,regionNames[r]]))]});
      add('outreach','revival','Hold a revival gathering','Invite former members and interested neighbors back.','music',crowd<12?'Needs 12 followers':'');
      add('governance','assembly','Convene a community assembly','Hear grievances and spend a year building trust in local leadership.','people',leader?'':'Requires leadership');
      add('governance','charity','Release community relief funds','Distribute up to '+economy.money(l,120)+' from the treasury and improve local welfare.','heart',!leader?'Requires leadership':budget(m)<10?'Needs '+economy.money(l,10)+' in the community treasury':'');
      add('reform','rename','Rename the movement','Update the public name. The founding charter retains its original wording.','journal',leader?'':'Requires leadership',{fields:[input('name','New name',60,'text',true)]});
      add('reform','reform','Propose a reform','Revise a teaching or leadership model. Some members may leave.','book',leader?'':'Requires leadership',{fields:schema(l).filter(f=>f.key!=='name').map(f=>({...f,default:m[f.key]}))});
      add('reform','split','Form an independent branch','Invite willing followers to support a separate charter.','family-tree',crowd<8?'Needs 8 followers':foundReason(l),{fields:[input('name','Branch name',60,'text',true),input('teachings','Branch teaching',280,'textarea',true)]});
      const relatives=list(l).filter(n=>n!==m&&!n.unitedWith&&related(l,m,n));
      if(relatives.length)add('reform','unite','Seek reconciliation','Propose a union with a related branch. Each community keeps its founding record.','people',leader?'':'Requires leadership',{fields:[pick('targetId','Related movement',relatives.map(n=>[n.id,n.name]))]});
    }
    return out;
  }

  function transferPart(from,to,frac){
    let total=0;
    for(const [r,src] of Object.entries(from.regions)){
      const n=Math.floor(src.followers*frac),t=Math.floor(src.teachers*frac);if(!n&&!t)continue;
      const dest=local(to,r),before=dest.followers;
      dest.trust=Math.round((dest.trust*before+src.trust*n)/Math.max(1,before+n));
      dest.followers+=n;src.followers-=n;total+=n;
      dest.teachers+=t;src.teachers-=t;dest.influence=Math.max(dest.influence,src.influence*.7);
    }
    const amount=Math.floor(from.treasury*frac);from.treasury-=amount;to.treasury+=amount;
    return total;
  }
  const nearby={
    europe:['westAsia','africa'],africa:['europe','westAsia','southAsia'],westAsia:['europe','africa','centralAsia','southAsia'],
    centralAsia:['westAsia','eastAsia','southAsia'],southAsia:['westAsia','centralAsia','eastAsia','southeastAsia','africa'],
    eastAsia:['centralAsia','southAsia','southeastAsia'],southeastAsia:['eastAsia','southAsia','oceania'],oceania:['southeastAsia'],americas:[]
  };
  function reachable(home,y){return y>=1500?regions.filter(r=>r!==home):nearby[home]||[];}
  function spend(l,n,ctx){
    if(n<=0)return {};
    if(ctx?.apply)return ctx.apply(l,{cash:-n});
    l.cash-=n;return {cash:-n};
  }
  function influence(r,n){r.influence=clamp(r.influence+n,0,100);}
  function trust(r,n){r.trust=clamp(r.trust+n,0,100);}
  function introduce(m,region,capacity,seed,y){
    const r=local(m,region),interest=chance(seed);
    const maximum=capacityFor(region,y),room=Math.max(0,maximum-r.followers);
    const reception=interest<.12+(100-r.trust)*.001?0:(.20+.63*interest+r.trust/350);
    const joined=Math.min(room,Math.floor(capacity*reception*Math.sqrt(room/maximum)));
    r.followers+=joined;influence(r,2+Math.ceil(joined/3));
    return joined;
  }
  function selectable(l,group,id){return routeRows(l,group).find(a=>a.id===id);}
  function payloadValues(action,payload){
    const result={};
    for(const field of action.fields||[]){
      let v=payload?.[field.key];
      if(v===undefined||v===null)v=field.default??'';
      if(typeof v!=='string')return null;
      v=clean(v);
      if(field.required&&!v||field.maxLength&&Array.from(v).length>field.maxLength)return null;
      if(field.choices&&!field.choices.some(c=>c.id===v))return null;
      result[field.key]=v;
    }
    return result;
  }
  function perform(l,group,id,ctx,payload={}){
    if(id==='found')return found(l,payload,ctx);
    const row=selectable(l,group,id);
    if(!row||row.reason)return null;
    const values=payloadValues(row,payload);if(!values)return null;
    const m=get(l,row.movementId),op=id.slice(m.id.length+1),home=regionFor(l),y=year(l),r=['gather','service','revival','assembly','charity'].includes(op)?local(m,home):m.regions[home];
    const seed=[l.id,m.id,op,y].join('/'),roll=chance(seed),f=personal(l);
    const capacity=2+Math.floor((f.knowledge+f.involvement+l.world.reputation*.35+l.stats.smarts*.35)/28);
    let title=row.title,text='',delta={};
    if(op==='revive'){
      affiliate(l,m,ctx);syncAffiliations(l);
      const n=introduce(m,home,capacity,seed,y);
      if(!m.leaderId){m.leaderId=l.id;m.leaderName=l.name;m.office=null;}
      m.status='active';m.stability=clamp(m.stability+8,0,100);
      text='I reopened the charter of '+m.name+'. '+num(n)+' other people chose to join the first gathering.';
      record(m,y,'revival',text);
    }else if(op==='gather'){
      const n=introduce(m,home,capacity+(m.sharing==='meetings'?3:0),seed,y);
      text=num(n)+' people chose to join '+m.name+' after the gathering.';trust(r,1);
    }else if(op==='service'){
      trust(r,5);influence(r,4);
      const n=introduce(m,home,3+(m.type==='service'||m.sharing==='service'?4:0),seed,y);
      text='Neighbors organized a day of service. '+num(n)+' asked to join. Everyone got help.';
    }else if(op==='invite'){
      const p=l.people[values.contact],personal=node?require('./faith-personal.js').PocketFaithPersonal:root.PocketFaithPersonal;
      const f=personal.npc(l,p,values.contact),openness=.10+p.bond*.003+(f.status==='questioning'?.24:0)-f.conviction*.0016;
      if(chance(seed+p.id)<openness){
        p.faith={...(p.faith||f),id:m.id,status:'practicing'};
        delete p.faith.name;delete p.faith.statusLabel;delete p.faith.intensity;
        syncAffiliations(l);text=p.name+' accepted the invitation and joined '+m.name+'.';
      }else{
        p.bond=clamp(p.bond+1,0,100);text=p.name+' declined the invitation. We kept talking about other things.';
      }
    }else if(op==='broadcast'){
      const targets=Object.keys(m.regions);
      const target=targets[M.hash(seed)%targets.length]||home;
      const n=introduce(m,target,capacity+(m.sharing==='online'||m.sharing==='broadcast'?8:3),seed,y);
      text='Listeners in '+regionNames[target]+' heard the discussion. '+num(n)+' joined afterward.';
    }else if(op==='book'){
      const work=values.title||m.name+' · Collected teachings '+(m.works.length+1);
      m.works.push({year:y,title:work,author:l.name,authorId:l.id,town:l.town});
      const n=introduce(m,home,capacity+(m.sharing==='writing'?4:0),seed,y);
      text=work+' circulated locally. '+num(n)+' readers joined the community.';
    }else if(op==='visit'){
      const destination=values.region;
      if(!reachable(home,y).includes(destination))return null;
      const fare=travelFare(l);if(l.cash<fare)return null;
      delta=spend(l,fare,ctx);
      const n=introduce(m,destination,capacity+(m.sharing==='travel'?5:0),seed,y);
      const town=local(m,destination).town;
      text='I visited '+(town?H.place(town,y).city+', ':'')+regionNames[destination]+'. '+num(n)+' residents chose to join.';
      if(town&&!m.history.some(h=>h.kind==='regional-visit'&&h.town===town)){
        record(m,y,'regional-visit',text);m.history[m.history.length-1].town=town;
      }
    }else if(op==='teacher'){
      if(values.region!==home&&!reachable(home,y).includes(values.region))return null;
      m.treasury-=24;const out=local(m,values.region);out.teachers++;influence(out,5);
      const n=introduce(m,values.region,3,seed,y);text='A volunteer began teaching in '+regionNames[values.region]+'. '+num(n)+' people enrolled as members.';
    }else if(op==='revival'){
      const n=introduce(m,home,capacity+Math.min(48,Math.floor(Math.sqrt(r.followers))),seed,y);
      trust(r,3);text=num(n)+' people joined after the revival. Several already knew the songs.';
    }else if(op==='assembly'){
      trust(r,m.governance==='council'||m.governance==='elected'?7:4);m.stability=clamp(m.stability+8,0,100);
      text='The assembly heard local concerns and agreed on next year’s priorities.';
    }else if(op==='charity'){
      const amount=Math.min(120,Math.floor(m.treasury*.6));m.treasury-=amount;trust(r,7);influence(r,3);
      text='The community distributed '+economy.money(l,amount)+' from its treasury. Local trust rose.';
    }else if(op==='rename'){
      if(!uniqueName(l,values.name,m.id)||m.name===values.name)return null;
      const old=m.name;m.name=values.name;text=old+' became '+m.name+'. The original charter is still on file.';
    }else if(op==='reform'){
      const edits=Object.entries(values).filter(([k,v])=>v&&v!==m[k]);
      if(!edits.length)return null;
      const gov=values.governance||m.governance;
      const vote=['council','elected','local'].includes(m.governance);
      if(vote&&roll>(.49+m.stability/230)){
        m.stability=clamp(m.stability-3,0,100);text='The proposed reform did not receive enough support. The current charter stands.';
      }else{
        const changed=gov!==m.governance;
        for(const [k,v] of edits)m[k]=v;
        m.leadership=gov;m.summary=m.teachings;
        let left=0;for(const reg of Object.values(m.regions)){
          const exits=Math.floor(reg.followers*(changed?.025:.009)*(1+roll));reg.followers-=exits;left+=exits;
          trust(reg,changed?-3:-1);
        }
        m.stability=clamp(m.stability-(changed?11:5),0,100);const revised=edits.map(([k,v])=>fields.find(f=>f.key===k).label+' became “'+v+'”').join('. ');
        text='The reform passed. '+revised+'. '+num(left)+' members chose to leave.';
      }
    }else if(op==='split'){
      if(!uniqueName(l,values.name))return null;
      const b=make(l,charter(l,{...m,name:values.name,teachings:values.teachings}),m.id);
      b.regions[home].followers=0;
      let joined=transferPart(m,b,.16+.23*roll);
      if(!joined){const src=regional(l,m.id).find(x=>x.followers>0);m.regions[src.region].followers--;local(b,src.region).followers++;joined=1;}
      if(m.leaderId===l.id){
        m.leaderId=null;m.leaderName='Interim council';m.successorId=null;m.office=null;
      }
      // The founder is one of the transferred members, even when the
      // proportional split rounded their local group down to zero.
      if(!b.regions[home].followers){
        const other=regional(l,b.id).find(e=>e.followers);
        if(other){b.regions[other.region].followers--;local(m,other.region).followers++;}
        if(local(m,home).followers>0){m.regions[home].followers--;b.regions[home].followers++;}
      }
      if(m.known)delete m.known[l.id];b.known[l.id]=home;
      affiliate(l,b,ctx);l.used.push('faith-found');
      text=num(joined)+' members established '+b.name+' as an independent branch of '+m.name+'.';
      record(b,y,'found',text);m.stability=clamp(m.stability-7,0,100);record(m,y,'schism',text);
    }else if(op==='unite'){
      const branch=get(l,values.targetId);
      if(!branch||branch===m||branch.unitedWith||!related(l,m,branch))return null;
      const agreed=chance(seed+branch.id)<.30+(branch.stability+m.stability)/280;
      if(agreed){
        const n=transferPart(branch,m,1);branch.unitedWith=m.id;branch.status='united';branch.leaderId=null;branch.leaderName='';branch.successorId=null;branch.office=null;
        Object.assign(m.known||(m.known={}),branch.known||{});branch.known={};
        if(l.sim.faith?.id===branch.id)l.sim.faith.id=m.id;
        for(const p of Object.values(l.people))if(p.faith?.id===branch.id&&M.isAlive(p))p.faith.id=m.id;
        text=branch.name+' voted to reunite with '+m.name+'. '+num(n)+' members are now counted together.';
        record(branch,y,'reunion',text);m.stability=clamp(m.stability+8,0,100);record(m,y,'reunion',text);
      }else{
        branch.stability=clamp(branch.stability+2,0,100);text=branch.name+' voted to remain independent. The two communities agreed to keep talking.';
      }
    }
    l.used.push('faith-action/'+id);l.turns++;
    if(!['split','unite','revive'].includes(op))record(m,y,op,text);
    return {...log(l,ctx,title,text,delta),movementId:m.id};
  }
  function travelFare(l){const y=year(l);return y<1500?90:y<1900?130:y<2000?160:220;}
  function routeRows(l,group='movement'){
    const out=rows(l,group),home=regionFor(l),y=year(l),routes=reachable(home,y);
    for(const r of out){
      if(r.id.endsWith('/visit')){
        r.fields=[pick('region','Destination region',routes.map(id=>[id,regionNames[id]]))];
        r.reason=r.reason||(!routes.length?'No route to another modeled region this year':'')||(l.cash<travelFare(l)?'Insufficient travel funds':'');
        r.description+=' Personal fare '+economy.money(l,travelFare(l))+'.';
      }else if(r.id.endsWith('/teacher'))r.fields=[pick('region','Teaching region',[home,...routes].map(id=>[id,regionNames[id]]))];
    }
    return out;
  }
  function capacityFor(region,y){
    // Simulated regional saturation. These are gameplay capacities, not census estimates.
    const base={europe:180000,africa:170000,westAsia:95000,centralAsia:62000,southAsia:290000,eastAsia:340000,southeastAsia:134000,americas:190000,oceania:22000}[region];
    return Math.round(base*(1+clamp((y-1400)/240,0,8)));
  }
  function syncAffiliations(l){
    const movements=list(l);if(!movements.length)return;
    const people=[[l.id,l.sim.faith?.id,l.town,!l.ended]];
    for(const p of Object.values(l.people))if(p.met)people.push([p.id,p.faith?.id,p.town||l.town,M.isAlive(p)]);
    const observed=new Map(people.map(p=>[p[0],p]));
    for(const m of movements){
      if(m.unitedWith)continue;
      const known=m.known||(m.known={}),counts={};
      for(const [pid,region] of Object.entries(known)){
        const row=observed.get(pid);
        if(!row){delete known[pid];continue;}
        const affiliated=canon(l,get(l,row[1]))?.id===m.id&&row[3];
        if(affiliated&&H.region(row[2])===region)continue;
        const reg=m.regions[region];if(reg)reg.followers=Math.max(0,reg.followers-1);
        delete known[pid];
      }
      for(const [pid,id,town,living] of observed.values()){
        if(!living||canon(l,get(l,id))?.id!==m.id)continue;
        const region=H.region(town),r=local(m,region);
        if(!known[pid]){known[pid]=region;r.followers++;}
        counts[region]=(counts[region]||0)+1;
      }
      for(const [region,count] of Object.entries(counts))local(m,region).followers=Math.max(m.regions[region].followers,count);
    }
  }
  function annual(l,ctx){
    const w=world(l),y=year(l);if(!w?.movements||w.lastMovementYear>=y)return;
    w.lastMovementYear=y;syncAffiliations(l);
    const sites=w.institutions?.sites||[];
    for(const m of list(l)){
      if(m.unitedWith||m.lastYear>=y)continue;
      const before=followers(m),contacts=[],regionKeys=Object.keys(m.regions),floors={};
      for(const region of Object.values(m.known||{}))floors[region]=(floors[region]||0)+1;
      let gain=0,expenses=0;
      for(const region of regionKeys){
        const r=m.regions[region],current=r.followers,seed=m.id+'/'+region+'/'+y;
        const served=Array.isArray(sites)?sites.reduce((n,s)=>n+(organization(l,s.faithId)===m.id&&H.region(s.town)===region?(s.lastAccounts?.served||0):0),0):0;
        const works=Math.min(6,m.works.length),localActivity=r.influence*.044+r.teachers*.8+works*.21+Math.min(9,served*.012);
        const reception=chance(seed+'reception'),turnover=.013+chance(seed+'turnover')*.025;
        const fx=r.town?H.marketEffects(l,r.town,y):{cost:1,pay:1,travel:1};
        const hardship=clamp(Math.max(0,fx.cost-1)+Math.max(0,1-fx.pay),0,.6);
        const networks=Math.min(.027,works*.0012+r.teachers*.0022+Math.min(.009,served*.00008));
        const communication=(m.sharing==='online'&&y>=1993?.006:m.sharing==='broadcast'&&y>=1920?.004:0);
        const attract=(.007+r.trust*.00027+m.stability*.00017+networks+communication+(m.sharing==='example'?.003:0))*
          (.45+reception)*Math.max(0,1-current/capacityFor(region,y));
        const disruption=chance(seed+'disruption')<.045?.035:0;
        const expected=r.carry+current*(attract-turnover-disruption-hardship*.14)+localActivity*(.45+reception);
        const change=Math.trunc(expected);r.carry=expected-change;
        r.followers=clamp(current+change,floors[region]||0,Math.max(current,capacityFor(region,y)));
        trust(r,reception<.25?-1:reception>.80?1:0);r.influence=clamp(r.influence*.82,0,100);
        if(r.teachers&&m.treasury+gain<r.teachers*2&&chance(seed+'teacher')<.22)r.teachers--;
        expenses+=r.teachers*2+(current?1:0);
        gain+=Math.floor(r.followers*(.07+r.trust*.0004)*(m.type==='service'?1.1:1));
        const reachableRegions=reachable(region,y).filter(target=>!m.regions[target]);
        if(reachableRegions.length&&current>=30&&chance(seed+'spread')<Math.min(.24,.012+works*.009+r.teachers*.02+(m.sharing==='travel'?.022:0))){
          contacts.push(reachableRegions[M.hash(seed+'destination')%reachableRegions.length]);
        }
      }
      for(const r of new Set(contacts))introduce(m,r,3,m.id+y+r,y);
      const opening=m.treasury,paid=Math.min(opening+gain,expenses);
      m.treasury=opening+gain-paid;
      m.lastAccounts={year:y,opening,contributions:gain,expenses:paid,unpaid:expenses-paid,surplus:gain-paid,closing:m.treasury};
      if(m.stability<55&&before>=90&&!m.parentId&&y-m.foundedYear>=18&&(!m.lastAutonomousSplit||y-m.lastAutonomousSplit>=40)&&
        list(l).filter(n=>n.parentId===m.id&&!n.unitedWith).length<4&&chance(m.id+'/assembly/'+y)<.14){
        autonomousSplit(l,m,y,ctx);
      }
      const total=followers(m),previous=m.previousCensus??before,oldStatus=m.status;
      m.lastChange=total-previous;m.previousCensus=total;m.lastYear=y;m.status=total?'active':'dormant';
      if(oldStatus!==m.status)record(m,y,total?'revival':'dormant',total?'Membership resumed in '+m.name+'.':'The last congregation of '+m.name+' became inactive. The charter survived.');
      const milestone=[10,100,1000,10000,100000,1000000,10000000].filter(n=>n>(m.highWater||0)&&n<=total).pop();
      m.highWater=Math.max(m.highWater||0,total);
      if(milestone||(y-m.foundedYear)%25===0){
        const census={year:y,total,regions:Object.fromEntries(Object.entries(m.regions).filter(([,r])=>r.followers).map(([id,r])=>[id,r.followers]))};
        (m.census||(m.census=[])).push(census);
        const counts=Object.entries(census.regions).map(([region,n])=>regionNames[region]+' '+num(n));
        record(m,y,'census',(milestone?'Reached '+num(milestone)+' members. ':'')+'Membership was '+num(total)+(counts.length?' ('+counts.join(', ')+').':'.'));
      }
      if((m.lastChange<0||contacts.length)&&m.leaderId===l.id&&ctx?.log&&y%5===0){
        const text=m.name+' now has '+num(followers(m))+' members in '+Object.values(m.regions).filter(r=>r.followers).length+' modeled regions.';
        log(l,ctx,'Community census',text);
      }
    }
  }
  function autonomousSplit(l,m,y,ctx){
    const candidates=Object.entries(m.regions).filter(([,r])=>r.followers>=18);
    if(!candidates.length)return;
    const [region,source]=candidates[M.hash(m.id+y)%candidates.length],town=source.town||m.town;
    const key=m.id+'-delegate-'+y,localName=H.place(town,y).city;
    const data=charter(l,{...m,governance:'council',name:(m.name.slice(0,25)+' · '+localName.slice(0,19)+' '+y),teachings:m.teachings});
    const delegate={...l,id:key,name:'Assembly of '+localName,born:y-38,age:38,town};
    const b=make(delegate,data,m.id);b.regions[region].followers=0;
    const known=Object.values(m.known||{}).filter(x=>x===region).length;
    const moved=Math.min(source.followers-known,Math.max(2,Math.floor(source.followers*.18)));
    if(moved<1){delete world(l).movements[b.id];return;}
    source.followers-=moved;local(b,region).followers=moved;
    const amount=Math.floor(m.treasury*moved/(followers(m)+moved));m.treasury-=amount;b.treasury=amount;
    m.lastAutonomousSplit=y;m.stability=clamp(m.stability+6,0,100);b.stability=55;b.governance=b.leadership='council';
    const text=num(moved)+' members in '+localName+' formed '+b.name+' after a dispute about local authority.';
    record(m,y,'schism',text);record(b,y,'found',text);
    if(l.sim.faith?.id===m.id||m.leaderId===l.id)log(l,ctx,'Independent branch',text);
  }
  function validate(l){
    const w=world(l);if(!w||w.movements===undefined)return true;
    if(!w.movements||typeof w.movements!=='object'||Array.isArray(w.movements))throw Error('Invalid movement registry.');
    for(const [id,m] of Object.entries(w.movements)){
      if(!m||m.id!==id||typeof m.name!=='string'||!m.name||!Number.isSafeInteger(m.foundedYear)||!regions.includes(m.originRegion)||!m.original||
        !m.regions||Array.isArray(m.regions)||typeof m.regions!=='object'||!Number.isSafeInteger(m.treasury)||m.treasury<0||
        !Array.isArray(m.history)||!Array.isArray(m.works)||m.parentId&&!w.movements[m.parentId]||m.unitedWith&&!w.movements[m.unitedWith])throw Error('Invalid movement record.');
      const savedCharter=c=>c&&fields.every(f=>typeof c[f.key]==='string'&&(!f.maxLength||Array.from(c[f.key]).length<=f.maxLength)&&
        (!f.choices||f.choices.some(v=>v.id===c[f.key])));
      if(!savedCharter(m)||!savedCharter(m.original)||m.original.founderId!==m.founderId||m.original.foundedYear!==m.foundedYear||
        !Number.isSafeInteger(m.lastYear)||!Number.isFinite(m.stability)||m.stability<0||m.stability>100||
        m.history.some(e=>!e||!Number.isSafeInteger(e.year)||typeof e.kind!=='string'||typeof e.text!=='string')||
        m.works.some(e=>!e||!Number.isSafeInteger(e.year)||typeof e.title!=='string'||typeof e.author!=='string')||
        m.known&&Object.values(m.known).some(r=>!regions.includes(r))||
        m.census&&(!Array.isArray(m.census)||m.census.some(c=>!c||!Number.isSafeInteger(c.year)||!Number.isSafeInteger(c.total)||c.total<0||
          !c.regions||Object.entries(c.regions).some(([r,n])=>!regions.includes(r)||!Number.isSafeInteger(n)||n<0))))throw Error('Invalid movement archive.');
      for(const link of ['parentId','unitedWith']){
        const path=new Set();let n=m;while(n){if(path.has(n.id))throw Error('Invalid movement links.');path.add(n.id);n=n[link]?w.movements[n[link]]:null;}
      }
      for(const [key,r] of Object.entries(m.regions)){
        if(!regions.includes(key)||!r||!Number.isSafeInteger(r.followers)||r.followers<0||!Number.isFinite(r.trust)||r.trust<0||r.trust>100||
          !Number.isSafeInteger(r.teachers)||r.teachers<0||!Number.isFinite(r.influence)||!Number.isFinite(r.carry))throw Error('Invalid regional congregation.');
      }
    }
    return true;
  }
  root.PocketFaithMovements={initialize,annual,found,foundReason,validateDraft,schema,defaultDraft,list,get,regional,followers,record,
    actions:routeRows,perform,validate,syncAffiliations,organization,regionNames};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
