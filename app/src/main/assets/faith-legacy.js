/* Succession in a community is independent of the player's personal estate and succession. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const M=node?require('./model.js').PocketModel:root.PocketModel;
  const year=l=>l.born+l.age;
  const movements=l=>Object.values(l.sim.faithWorld?.movements||{});
  const sites=l=>Object.values(l.sim.faithWorld?.institutions?.sites||{});
  const family=p=>M.isFamily(p)||['Spouse','Partner','Engaged partner'].includes(p.role);
  const offices={central:'Community leader',council:'Council chair',elected:'Elected representative',hereditary:'Family steward',local:'Local convenor'};
  const customs={
    meal:['Annual family meal','We set one more place at the table.'],
    reading:['Family reading day','Three generations had left notes in the margins.'],
    service:['Family service day','We helped the neighbors. Someone remembered to bring enough chairs.']
  };
  const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
  const validGovernance=m=>own(offices,m.governance)?m.governance:'council';
  const members=m=>Object.values(m.regions||{}).reduce((n,r)=>n+(r.followers||0),0);
  const personName=p=>p.fullName||p.name;
  function name(l,id){
    if(!id)return 'Unrecorded';
    const m=l.sim.faithWorld?.movements?.[id];if(m)return m.name;
    const api=node?require('./faith-personal.js').PocketFaithPersonal:root.PocketFaithPersonal;
    return api.name(l,id);
  }
  function fresh(l){return {line:l.sim.dynasty?.line||l.id,customs:[],memories:[],original:l.sim.faith?.originalId||l.sim.faith?.id||'',lastYear:null};}
  function data(l){return l.sim.faithLegacy||(l.sim.faithLegacy=fresh(l));}
  function remember(l,kind,text,faithId='',person=l.id){
    const d=data(l),y=year(l),last=d.memories[d.memories.length-1];
    if(last?.year===y&&last.kind===kind&&last.text===text)return;
    d.memories.push({year:y,kind,text,faithId,person,town:l.town});if(d.memories.length>72)d.memories.shift();
  }
  function movementRecord(m,y,kind,text){
    const api=node?require('./faith-movements.js').PocketFaithMovements:root.PocketFaithMovements;
    api.record(m,y,kind,text);
  }
  function journal(l,ctx,title,text,delta={}){
    if(ctx?.log)ctx.log(l,'Faith',title,text,delta);
    else (l._yearEntries||l.log).push({age:l.age,kind:'Faith',title,body:text,delta});
  }
  function known(l,id){
    if(!id)return null;
    if(id===l.id)return {id,name:l.name,born:l.born,town:l.town,faith:l.sim.faith?.id,dead:!!l.ended,devotion:l.sim.faith?.devotion||0};
    const p=Object.values(l.people).find(x=>x.id===id);
    if(!p)return null;
    return {id,name:personName(p),born:p.bornYear??(l.born+(p.bornAt||0)),town:p.town||l.town,faith:p.faith?.id,
      dead:!M.isAlive(p),devotion:p.faith?.devotion||0};
  }
  function recordLeader(l,m){
    const person=known(l,m.leaderId),old=m.office;
    if(old?.id===m.leaderId)return old;
    if(!m.leaderId)return null;
    return {id:m.leaderId,name:person?.name||m.leaderName||'Community leader',born:person?.born??(year(l)-40),
      town:person?.town||m.town,since:m.foundedYear||year(l),end:person?.born?person.born+75+M.hash(person.id)%21:year(l)+36};
  }
  function eligible(l,m,c){return c&&!c.dead&&c.faith===m.id&&year(l)-c.born>=18&&year(l)-c.born<=102;}
  function candidates(l,m){
    const result=[],seen=new Set();
    for(const id of [l.id,...Object.values(l.people).filter(p=>p.met).map(p=>p.id)]){
      if(seen.has(id))continue;seen.add(id);
      const c=known(l,id);if(eligible(l,m,c))result.push(c);
    }
    return result;
  }
  const delegateNames=['Ren','Imani','Anu','Sol','Pia','Issa','Amal','Ari','Lian','Nell','Mina','Iona','Kit','Nuri','Remy','Sora'];
  function slate(l,m,outgoing=''){
    const y=year(l),knownMembers=candidates(l,m),list=knownMembers.filter(c=>c.id!==outgoing);
    // Additional delegates represent existing simulated followers, never a new influx of members.
    const seats=Math.min(3,Math.max(0,members(m)-knownMembers.length-(outgoing&&!knownMembers.some(c=>c.id===outgoing)?1:0)));
    for(let i=0;i<seats;i++){
      const id='delegate-'+M.hash(m.id+'/'+y+'/'+i).toString(36),h=M.hash(id);
      list.push({id,name:delegateNames[h%delegateNames.length]+' '+['Reed','Vale','Bell','Lane','River','Shaw'][(h>>>5)%6],
        born:y-26-(h%31),town:m.town,faith:m.id,devotion:45+h%49,delegate:true});
    }
    return list;
  }
  function descendant(l,a,b){return !!l.sim.expansion?.family?.[b]?.parents?.includes(a);}
  function select(l,m,pool,former){
    const g=validGovernance(m),y=year(l);
    function score(c){
      const roll=M.hash(m.id+'/'+y+'/'+c.id)%31,senior=Math.min(65,y-c.born),kin=descendant(l,former,c.id),nom=c.id===m.successorId;
      if(g==='central')return (nom?1000:0)+c.devotion+senior+roll;
      if(g==='hereditary')return (kin?1000:0)+(nom&&kin?500:0)+senior+c.devotion*.1+roll*.01;
      if(g==='council')return c.devotion*.65+senior*.5+roll+(nom?12:0);
      if(g==='local')return (c.town===m.town?100:0)+roll+c.devotion*.3;
      return roll*3+c.devotion*.4+(nom?12:0);
    }
    return pool.slice().sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id))[0];
  }
  function appoint(l,m,ctx,reason,force=false){
    if(m.unitedWith)return false;
    const y=year(l),old=recordLeader(l,m),former=m.leaderId||'',g=validGovernance(m);
    const oldPerson=known(l,former),died=oldPerson?oldPerson.dead:old&&y>=old.end;
    const resigned=oldPerson?.faith&&oldPerson.faith!==m.id;
    const term=g==='elected'?6:g==='local'?4:0;
    if(old&&!force&&!died&&!resigned&&(!term||y-old.since<term)){m.office=old;return false;}
    if(!old&&!members(m)&&!m.successorId)return false;
    const pool=slate(l,m,former);
    if(old&&!died&&!resigned&&!force&&term&&oldPerson&&eligible(l,m,oldPerson))pool.push(oldPerson);
    const selected=select(l,m,pool,former),label=offices[g];
    if(!selected){
      if(!former)return false;
      m.leaderId=null;m.leaderName='';m.office=null;
    }else{
      m.leaderId=selected.id;m.leaderName=selected.name;
      m.office={id:selected.id,name:selected.name,born:selected.born,town:selected.town,since:y,end:selected.born+75+M.hash(selected.id)%21};
      if(selected.delegate&&l.sim.faith?.id===m.id&&selected.town===l.town&&Object.values(l.people).filter(p=>p.communityDelegate).length<16){
        const p={id:selected.id,name:selected.name,fullName:selected.name,bornYear:selected.born,town:selected.town,
          role:'Community representative',job:label,met:true,active:true,bond:45,communityDelegate:true,faith:{id:m.id,status:'practicing',devotion:selected.devotion,knowledge:54,involvement:64,conviction:55}};
        M.person(l,selected.id,p);l.people[selected.id]=p;
      }
    }
    const reasonText=reason||(died?'after a death':resigned?'after a change of belief':term?'at the end of the term':'to fill a vacancy');
    const verb=g==='elected'?'The members elected ':g==='council'?'The council appointed ':g==='local'?'The local assembly chose ':g==='hereditary'&&selected&&descendant(l,former,selected.id)?'The family office passed to ':'The community appointed ';
    const text=selected?verb+selected.name+' as '+label.toLowerCase()+' '+reasonText+'.':label+' fell vacant. No eligible member took office.';
    m.successorId=null;movementRecord(m,y,'succession',text);
    if(l.sim.faith?.id===m.id||m.founderId===l.id||former===l.id||selected?.id===l.id){
      remember(l,'succession',m.name+' · '+text,m.id);journal(l,ctx,m.name+' succession',text);
    }
    return true;
  }
  function changedFamily(l){
    const tree=l.sim.expansion?.family;if(!tree)return;
    for(const p of Object.values(l.people)){
      if(!p.met||!p.faith?.id||!family(p))continue;
      const n=tree[p.id];if(!n)continue;
      if(!n.firstFaith){
        n.firstFaith=p.faith.id;
        if(p.bornYear===year(l))remember(l,'birth',personName(p)+' was welcomed into a household with '+name(l,p.faith.id)+'.',p.faith.id,p.id);
      }
      if(p.diedAt===l.age&&n.faithMemorial!==year(l)){
        n.faithMemorial=year(l);
        remember(l,'death',personName(p)+' died. The family recorded their outlook as '+name(l,p.faith.id)+'.',p.faith.id,p.id);
      }
      if(n.faithId&&n.faithId!==p.faith.id){
        const text=personName(p)+' now identifies with '+name(l,p.faith.id)+'.';
        remember(l,'family belief',text,p.faith.id,p.id);
      }
      n.faithId=p.faith.id;
    }
  }
  function regionalSeats(l,m){
    const seats=m.localSeats||(m.localSeats={}),y=year(l);
    for(const [region,area] of Object.entries(m.regions||{})){
      if(!area.followers){delete seats[region];continue;}
      const previous=seats[region];if(previous&&y<previous.year+5)continue;
      // Each congregation names its own contact, independently of the movement-wide convenor.
      const term=previous?previous.term+1:1,h=M.hash(m.id+'/'+region+'/'+term);
      seats[region]={id:'seat-'+h.toString(36),name:delegateNames[h%delegateNames.length],year:y,term};
      if(previous||region!==m.originRegion){
        movementRecord(m,y,'local succession',seats[region].name+' began a five-year term as local convenor in '+region+'.');
      }
    }
  }
  function annual(l,ctx={}){
    if(!l.sim.faith&&!l.sim.faithWorld&&!l.sim.faithLegacy)return;
    const d=data(l),y=year(l);if(d.lastYear===y)return;
    d.lastYear=y;changedFamily(l);
    for(const m of movements(l)){
      if(m.unitedWith)continue;
      if(validGovernance(m)==='local')regionalSeats(l,m);
      appoint(l,m,ctx);
    }
  }
  function inherit(parent,child,key,ctx={}){
    if(!parent.sim.faithLegacy&&!parent.sim.faithWorld&&!parent.sim.faith)return;
    // Death can be established outside the annual tick (for example a restored end-of-life save).
    // Reconcile the child's independent movement records against the same known deceased parent.
    const prev=parent.sim.faithLegacy||fresh(parent),d=child.sim.faithLegacy=fresh(child);
    d.line=prev.line;d.customs=prev.customs.map(c=>({...c}));d.original=child.sim.faith?.id||'';
    d.lastYear=year(child);changedFamily(child);
    for(const m of movements(child)){
      if(m.leaderId===parent.id)appoint(child,m,ctx,'after the previous leader died',true);
    }
    for(const c of d.customs)if(c.active){
      c.generations++;remember(child,'family tradition',c.label+' came down from '+parent.name+'.',c.faithId);
    }
  }
  function blocked(l){return l.ended?'Life complete':l.sim.review||l.sim.court||l.event&&!l.event.resolved?'Finish the current decision':'';}
  function actions(l,group){
    const out=[],d=l.sim.faithLegacy||fresh(l),y=year(l),stop=blocked(l);
    function add(id,title,description,reason=''){out.push({id,title,description,reason:stop||reason});}
    if(group==='family'||!group){
      for(const [kind,[title]] of Object.entries(customs)){
        if(d.customs.some(c=>c.kind===kind&&c.active))continue;
        const prior=d.customs.find(c=>c.kind===kind);
        add('begin/'+kind,(prior?'Revive ':'Start ')+title.toLowerCase(),'Pass a voluntary household custom to your descendants.',l.age<12?'Opens at 12':prior?.retiredYear===y?'Recorded this year':'');
      }
      for(const c of d.customs.filter(c=>c.active)){
        add('observe/'+c.id,'Observe '+c.label.toLowerCase(),'Spend the day with willing relatives.',l.age<5?'Opens at 5':c.last===y?'Already observed this year':'');
        if(!c.open)add('adapt/'+c.id,'Open '+c.label.toLowerCase()+' to every outlook','Keep the family custom open to relatives of any faith or none.',l.age<12?'Opens at 12':'');
        add('retire/'+c.id,'Archive '+c.label.toLowerCase(),'Keep its history and end annual observances.',l.age<16?'Opens at 16':'');
      }
      return out;
    }
    const m=l.sim.faithWorld?.movements?.[group];
    if(!m||m.unitedWith||m.leaderId!==l.id)return out;
    const g=validGovernance(m);
    const options=candidates(l,m).filter(c=>c.id!==l.id&&(g!=='hereditary'||descendant(l,l.id,c.id)));
    for(const c of options){
      if(c.id===m.successorId)continue;
      add('nominate/'+c.id,(g==='elected'||g==='council'?'Nominate ':'Designate ')+c.name,
        g==='elected'||g==='council'?'Members weigh the nomination when choosing a successor.':'Record a succession preference.',m.lastNominationYear===y?'Already nominated this year':'');
    }
    add('step-down','Step down','Give up your office and let the community choose its next leader.');
    return out;
  }
  function perform(l,group,id,ctx={}){
    const option=actions(l,group).find(a=>a.id===id);if(!option||option.reason)return null;
    const y=year(l),d=data(l);let text='',delta={};
    if(group==='family'||!group){
      const [cmd,key]=id.split('/');let c=d.customs.find(v=>v.id===key);
      if(cmd==='begin'){
        c=d.customs.find(v=>v.kind===key);
        if(c){c.active=true;c.revivals++;text=c.label+' returned to the family calendar.';}
        else{c={id:'custom-'+key,kind:key,label:customs[key][0],faithId:l.sim.faith?.id||'',founder:l.id,founderName:l.name,town:l.town,since:y,count:0,revivals:0,generations:1,last:null,open:false,active:true};
          d.customs.push(c);text='I started '+c.label.toLowerCase()+'. Attendance is voluntary.';}
      }else if(cmd==='observe'){
        c.last=y;c.count++;
        let guests=0;
        for(const p of Object.values(l.people)){
          if(!p.met||!M.isAlive(p)||p.cutOff||!family(p)||!p.active)continue;
          if(!c.open&&p.faith?.id&&p.faith.id!==c.faithId)continue;
          if((p.town||l.town)!==l.town)continue;
          p.bond=Math.min(100,p.bond+2);guests++;
        }
        const previous=l.stats.joy;l.stats.joy=M.clamp(previous+2);delta={joy:l.stats.joy-previous};
        text=guests?customs[c.kind][1]+' '+guests+' relatives took part.':'I kept the custom on my own this year.';
      }else if(cmd==='adapt'){c.open=true;text='Relatives of any outlook are welcome at '+c.label.toLowerCase()+'.';}
      else{c.active=false;c.retiredYear=y;text='I recorded '+c.label.toLowerCase()+' in the archive. Its last count was '+c.count+'.';}
      remember(l,'family tradition',text,c.faithId);journal(l,ctx,option.title,text,delta);
    }else{
      const m=l.sim.faithWorld.movements[group];
      if(id==='step-down'){
        appoint(l,m,ctx,'after a resignation',true);text=m.leaderName?m.leaderName+' took office.':'The office is vacant.';
      }else{
        m.successorId=id.slice('nominate/'.length);m.lastNominationYear=y;const c=known(l,m.successorId);
        text='I recorded '+c.name+' as my preferred successor.';
        movementRecord(m,y,'nomination',text);remember(l,'nomination',text,m.id);journal(l,ctx,option.title,text);
      }
    }
    return {title:option.title,text,delta,accent:'People'};
  }
  function leadership(l,id){
    const m=l.sim.faithWorld?.movements?.[id];if(!m)return null;
    const g=validGovernance(m),seat=recordLeader(l,m),nominee=known(l,m.successorId);
    return {leader:m.leaderName||'Vacant',office:offices[g],successor:nominee?.name||'Undesignated',
      term:seat?(g==='elected'?'Ballot due '+(seat.since+6):g==='local'?'Local selection due '+(seat.since+4):'In office since '+seat.since):'Vacant',
      history:[...(g==='local'?Object.entries(m.localSeats||{}).map(([r,s])=>r+' · '+s.name+' (since '+s.year+')'):[]),
        ...(m.history||[]).filter(h=>['succession','nomination','local succession'].includes(h.kind)).slice(-12).map(h=>h.year+' · '+h.text)]};
  }
  function archive(l){
    const f=l.sim.faith,d=l.sim.faithLegacy,all=movements(l);
    if(!f&&!d&&!all.length)return null;
    const movementDetails=all.filter(m=>m.founderId===l.id||m.leaderId===l.id||m.id===f?.id).map(m=>{
      const role=[m.founderId===l.id?'Founder':'',m.leaderId===l.id?offices[validGovernance(m)]:''].filter(Boolean).join(', ')||'Member';
      const original=m.founderId===l.id&&m.original?.teachings?' · Original teaching: '+m.original.teachings:'';
      return m.name+' · '+role+' · founded '+m.foundedYear+(m.parentId?' · branch of '+(l.sim.faithWorld.movements[m.parentId]?.name||m.parentId):'')+original;
    });
    const relatives=Object.values(l.people).filter(p=>p.met&&family(p)&&p.faith?.id).slice(0,18).map(p=>personName(p)+' · '+name(l,p.faith.id));
    const history=(f?.history||[]).map(a=>a.year+' · '+a.text);
    const memories=[...history,...(d?.memories||[]).map(a=>a.year+' · '+a.text),...(d?.customs||[]).map(c=>c.since+' · '+c.label+' · '+c.count+' observances in '+c.generations+' generations')];
    const institutions=sites(l).filter(i=>i.founderId===l.id||i.stewardId===l.id).map(i=>i.name+' · '+(i.founderId===l.id?'Founder':'Steward')+' · '+i.founded);
    return {identity:name(l,f?.id),commitment:f?Math.round(f.devotion||0)+' / 100':'Unrecorded',original:name(l,f?.originalId||d?.original||f?.id),
      movements:movementDetails.concat(institutions),memories:memories.slice(-36),relatives};
  }
  function describe(l){
    const summary=l.archiveRecord?l.faithLegacy:archive(l);
    return summary||{identity:'Unrecorded',original:'Unrecorded',commitment:'Unrecorded',movements:[],memories:[],relatives:[]};
  }
  function exhibits(l){
    const out=[],line=new Set([l.id,...(l.sim.dynasty?.curators||[]).map(p=>p.id)]),names=new Set([l.name,...(l.sim.dynasty?.curators||[]).map(p=>p.name)]);
    for(const c of l.sim.faithLegacy?.customs||[]){
      out.push({ref:'custom/'+c.founder+'/'+c.kind,title:c.label+' register',category:'Family religious history',year:c.since,town:c.town,base:0});
    }
    for(const m of movements(l)){
      for(const [i,w] of (m.works||[]).entries())if(w.authorId?line.has(w.authorId):names.has(w.author)){
        out.push({ref:'written/'+m.id+'/'+i,title:w.title,category:'Religious writings',year:w.year,town:w.town||m.town,base:0});
      }
      if(!line.has(m.founderId))continue;
      out.push({ref:'movement/'+m.id,title:m.name+' founding charter',category:'Community documents',year:m.foundedYear,town:m.town,base:0});
    }
    for(const i of sites(l))if(line.has(i.founderId))out.push({ref:'institution/'+i.id,title:i.name+' foundation papers',category:'Community documents',year:i.founded,town:i.town,base:0});
    return out;
  }
  function validateArchive(a){
    if(a===undefined)return;
    if(!a||['identity','commitment','original'].some(k=>typeof a[k]!=='string')||
      ['movements','memories','relatives'].some(k=>!Array.isArray(a[k])||a[k].some(v=>typeof v!=='string')))throw Error('Invalid archived belief record.');
  }
  function validate(l){
    for(const m of movements(l)){
      const seat=m.office;
      if(seat&&(!Number.isSafeInteger(seat.born)||!Number.isSafeInteger(seat.since)||!Number.isSafeInteger(seat.end)||typeof seat.id!=='string'||typeof seat.name!=='string'))throw Error('Invalid movement leadership record.');
      if(m.localSeats&&Object.values(m.localSeats).some(s=>!s||typeof s.name!=='string'||typeof s.id!=='string'||!Number.isSafeInteger(s.year)||!Number.isSafeInteger(s.term)))throw Error('Invalid regional leadership record.');
    }
    const d=l.sim.faithLegacy;if(!d)return;
    if(!d||typeof d.line!=='string'||typeof d.original!=='string'||!Array.isArray(d.customs)||d.customs.length>3||!Array.isArray(d.memories)||d.memories.length>72||
      d.lastYear!==null&&!Number.isSafeInteger(d.lastYear)||d.customs.some(c=>!c||!own(customs,c.kind)||c.id!=='custom-'+c.kind||
        !Number.isSafeInteger(c.since)||typeof c.label!=='string'||!Number.isSafeInteger(c.count)||c.count<0||!Number.isSafeInteger(c.generations)||c.generations<1||
        typeof c.active!=='boolean'||typeof c.open!=='boolean')||
      d.memories.some(e=>!e||typeof e.text!=='string'||typeof e.kind!=='string'||!Number.isSafeInteger(e.year)))throw Error('Invalid faith legacy.');
  }
  root.PocketFaithLegacy={annual,inherit,actions,perform,leadership,archive,describe,exhibits,validate,validateArchive};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
