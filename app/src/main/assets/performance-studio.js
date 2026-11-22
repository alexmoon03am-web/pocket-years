/* Selective one-season engagements. All fees settle in the household ledger. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const H=node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  const M=node?require('./model.js').PocketModel:root.PocketModel;
  const catalog={
    acting:{title:'Acting',icon:'people',practice:'Rehearse a scene',apply:'Read for a part',team:'Join a company',role:'actor',
      plain:'Work with the ensemble',bold:'Ask for the lead',teamName:'Company member',win:'The audience stayed for the curtain call.',miss:'I missed my cue. The scenery got the laugh.'},
    music:{title:'Music',icon:'music',practice:'Practice an instrument',apply:'Play a trial set',team:'Form an ensemble',role:'performer',
      plain:'Arrange a familiar set',bold:'Debut an original piece',teamName:'Ensemble member',win:'They requested another verse. This time I had one.',miss:'I heard every chair scrape between songs.'},
    sport:{title:'Competitive sport',icon:'shoe',practice:'Train with a coach',apply:'Enter a selection trial',team:'Join a training club',role:'athlete',
      plain:'Pace the season',bold:'Compete for the top place',teamName:'Club member',win:'My name moved up the results board.',miss:'I limped home. The ice was my best equipment.'}
  };
  const seasons={
    acting:[['Traveling players','Market-day drama','A courtyard comedy'],['The Spare Chair','Evening at Number Nine','The Wrong Platform'],['Station Repertory','The Long Transit','Second Orbit']],
    music:[['Harvest gathering','Riverside concert','The evening dances'],['Small Hours Sessions','Night Bus Trio','The Back Room Sessions'],['Relay Sessions','Two Moons Ensemble','The Habitat Circuit']],
    sport:[['The long footrace','Riverbank games','The town meet'],['Park Athletics','Harbor Invitational','Northside Circuit'],['Low-gravity relay','Habitat Cup','Orbital Athletics']]
  };
  const ids=Object.keys(catalog),clamp=M.clamp,year=l=>l.born+l.age;
  function period(l){return year(l)<1900?0:year(l)<2150?1:2;}
  function groupName(l,id,regional){
    const town=(node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld).place(l.town,year(l)).city;
    const groups=year(l)<1850?
      {acting:['Players','Festival Players'],music:['Musicians','Traveling Musicians'],sport:['Runners','Festival Runners']}:
      {acting:['Players','Repertory'],music:['Ensemble','Touring Ensemble'],sport:['Athletics Club','District Squad']};
    return town+' '+groups[id][regional?1:0];
  }
  function proposed(l,id){
    const options=seasons[id][period(l)],y=year(l);
    const name=options[M.hash(l.town+'/'+id+'/'+y)%options.length];
    const r=record(l,id),profile=H.profile(l),base=profile.food*profile.pay;
    const fee=Math.max(1,Math.round(base*(.07+.0024*r.skill+.018*Math.min(8,r.completed))*(r.circuit?1.35:1)));
    return {name,year:y,fee};
  }
  function empty(){return {skill:0,following:0,completed:0,member:false,history:[]};}
  function record(l,id){return l.sim.performanceStudio?.tracks[id]||empty();}
  function state(l){
    return l.sim.performanceStudio||(l.sim.performanceStudio={tracks:{},rights:[]});
  }
  function track(l,id){
    const s=state(l);return s.tracks[id]||(s.tracks[id]=empty());
  }
  function otherContract(l){
    return ids.find(k=>record(l,k).contract);
  }
  function validOffer(l,r){return r.offer?.year===year(l)&&r.offer.town===l.town;}
  function options(l,id){
    const r=record(l,id),cfg=catalog[id],offer=validOffer(l,r)?r.offer:null;
    const contract=r.contract,rows=[];
    if(!cfg||l.age<12)return rows;
    const used=l.used;
    const common=l.ended?'Life complete':l.sim.prison?'In custody':l.sim.review||l.sim.court||l.event&&!l.event.resolved?'Finish the current decision':'';
    function add(key,title,desc,reason){
      rows.push({id:key,title,desc,icon:cfg.icon,reason:common||reason||(used.includes('season-'+id+'-'+key)?'Done this year':'')});
    }
    add('practice',cfg.practice,'Develop skill and discipline. Once per year.',id==='sport'&&l.sim.injuries.length?'Recover from your injury first':'');
    const early=year(l)<1850;
    const join=early?{acting:'Join the local players',music:'Play with other musicians',sport:'Train with other runners'}[id]:cfg.team;
    if(!r.member)add('team',join,'Share the work with other members. They help at selection and take 15% of a signed fee.',r.skill<18?'Needs 18 skill':'');
    else if(!contract&&!offer){
      if(!r.circuit)add('circuit',id==='acting'?(early?'Travel with the festival players':'Seek regional representation'):id==='music'?'Book a regional tour':early?'Enter the regional games':'Transfer to a district squad',
        'Two completed engagements open auditions for the regional circuit. It offers higher fees and tougher competition.',
        l.age<18?'Opens at 18':r.completed<2?'Finish two seasons first':'');
      add('leave','Go independent','Leave the group and its circuit. Keep your history, skill and supporters.');
    }
    if(contract){
      if(contract.plan)return rows;
      add('plain',cfg.plain,'Prepare a reliable performance and earn the full agreed fee.');
      add('bold',cfg.bold,'A standout showing earns a bonus. A poor showing reduces the fee'+(id==='sport'?' and risks an injury.':'.'));
    }else if(offer){
      add('sign','Sign for '+offer.name,H.money(l,offer.fee)+' for a prepared season. An unprepared season pays half. Settlement is at your next birthday.',otherContract(l)?'Already committed to a season':'');
      add('decline','Decline the offer','Release the place. Another trial opens next year.');
    }else{
      const oldAge=id==='sport'&&l.age>55;
      add('apply',cfg.apply,proposed(l,id).name+' · '+(l.age<18?'unpaid junior selection':'one-season engagement. Quoted fees depend on skill and local pay.'),
        oldAge?'Competitive seasons end at 55':id==='sport'&&l.sim.injuries.length?'Recover from your injury first':otherContract(l)?'Already committed to a season':r.skill<8?'Needs 8 skill':'');
    }
    return rows;
  }
  function view(l){
    if(l.age<12)return {tracks:[]};
    return {tracks:ids.map(id=>{
      const cfg=catalog[id],r=record(l,id);
      const status=r.contract?r.contract.name+' · '+(r.contract.plan?'season prepared':'choose a season plan'):validOffer(l,r)?'An offer is waiting':r.member?(r.group||cfg.teamName):'Independent';
      return {id,title:cfg.title,summary:'Skill '+r.skill+'% · '+r.completed+' seasons',detail:status+' · '+r.following.toLocaleString('en-US')+' supporters',
        items:options(l,id),history:r.history.slice().reverse().map(h=>h.year+' · '+h.text)};
    })};
  }
  function note(l,r,text){r.history.push({year:year(l),text});if(r.history.length>8)r.history.shift();}
  function perform(l,id,key,ctx){
    if(!ids.includes(id)||ctx.blocking(l))return null;
    const row=options(l,id).find(item=>item.id===key);
    if(!row||row.reason)return null;
    const r=track(l,id),cfg=catalog[id];let text,delta={},workDelta={};
    if(key==='practice'){
      const hobby={music:'music',sport:'running'}[id],hobbies=l.sim.expansion?.hobbies;
      if(hobby&&hobbies)hobbies[hobby]=clamp((hobbies[hobby]||0)+3);
      const talent=l.sim.expansion?.talent,fit=talent===({acting:'People',music:'Music',sport:'Endurance'})[id];
      const gain=5+Math.floor(l.hidden.discipline/25)+(fit?3:0);
      r.skill=clamp(r.skill+gain);delta=ctx.apply(l,id==='sport'?{health:2,discipline:1}:{smarts:1,discipline:1});
      text='I practiced. My '+cfg.title.toLowerCase()+' skill reached '+r.skill+'%.';
    }else if(key==='team'||key==='leave'){
      r.member=key==='team';r.circuit=false;
      if(r.member)r.group=groupName(l,id,false);else delete r.group;
      text=r.member?'I joined '+r.group+'. Our agreement sets aside 15% of each fee for the group.':'I left the group. My next fee is mine to keep.';
    }else if(key==='circuit'){
      const accepted=ctx.random(l)<.26+r.skill*.005+Math.min(.18,r.completed*.025);
      if(accepted){
        r.circuit=true;r.group=groupName(l,id,true);
        text=r.group+' signed me to its circuit. My next trial will be for a bigger engagement.';
      }else text='The regional panel passed. I kept my current place.';
    }else if(key==='apply'){
      const chance=Math.min(.93,.20+r.skill*.005+l.world.reputation*.0015+(r.member?.12:0)-(r.circuit?.10:0)+(l.job===cfg.role?.12:0));
      if(ctx.random(l)>=chance){
        delta=ctx.apply(l,{joy:-2});text='My name was missing from the list. I checked twice.';
      }else if(l.age<18){
        r.following+=4;r.skill=clamp(r.skill+3);workDelta=ctx.world.metrics(l,{reputation:2});text='I made the junior selection. Four people promised to come. The place was unpaid.';
      }else{
        const p=proposed(l,id);p.fee=Math.max(1,Math.round(p.fee*(r.member?.85:1)));p.town=l.town;
        r.offer=p;text=p.name+' offered me one season. My share for a prepared season is '+H.money(l,p.fee)+'.';
      }
    }else if(key==='decline'){
      delete r.offer;text='I passed on the engagement. Someone else got the call.';
    }else if(key==='sign'){
      const p=r.offer;r.contract={year:p.year,name:p.name,fee:p.fee,plan:null,rate:50};delete r.offer;
      text='I signed for '+p.name+'. My fee settles next birthday.';
    }else{
      const c=r.contract;c.plan=key;
      if(key==='plain'){
        c.rate=100;r.skill=clamp(r.skill+2);text='I prepared what we agreed to deliver. The full fee is due.';
      }else{
        const success=ctx.random(l)<Math.min(.90,.27+r.skill*.006+(r.member?.07:0));
        c.rate=success?145:65;text=success?cfg.win:cfg.miss;
        workDelta=ctx.world.metrics(l,{reputation:success?4:-2,performance:l.job===cfg.role?(success?6:-3):0});
        if(!success&&id==='sport'&&!l.sim.injuries.length)l.sim.injuries.push({name:'training strain',severity:26,years:0});
        delta=ctx.apply(l,{joy:success?4:-3});
      }
    }
    Object.assign(delta,workDelta);
    l.used.push('season-'+id+'-'+key);
    if(key!=='practice')note(l,r,text);
    ctx.log(l,'Career',row.title,text,delta);return {title:row.title,text,delta};
  }
  function pay(l,age){
    if(!l.sim.performanceStudio||age<18||l.sim.prison)return 0;
    const y=l.born+age,s=l.sim.performanceStudio;
    const fees=Object.values(s.tracks).reduce((n,r)=>{
      const c=r.contract;return n+(c?.year===y?Math.floor(c.fee*c.rate/100):0);
    },0);
    return fees+s.rights.reduce((n,p)=>n+(p.from<=y&&y<p.until?p.fee:0),0);
  }
  function settle(l,earnedAge,ctx){
    const s=l.sim.performanceStudio;if(!s)return;
    const y=l.born+earnedAge;
    s.rights=s.rights.filter(p=>p.until>y+1);
    for(const [id,r] of Object.entries(s.tracks)){
      if(r.offer&&r.offer.year<=y)delete r.offer;
      const c=r.contract;if(!c||c.year>y)continue;
      delete r.contract;
      if(l.sim.prison){
        const text=c.name+' canceled my contract while I was in custody.';note(l,r,text);ctx.log(l,'Career','Season canceled',text);continue;
      }
      r.completed++;const funds=Math.floor(c.fee*c.rate/100);
      const audience=5+Math.floor(r.skill*c.rate/80);r.following=Math.min(1000000,r.following+audience);
      let text=c.name+' closed. My share of gross household income was '+H.money(l,funds)+'.';
      if(id==='music'&&y>=1900&&c.plan==='bold'&&c.rate>100){
        const fee=Math.max(1,Math.round(c.fee*.12));
        s.rights.push({from:y+1,until:y+4,fee});text+=' The recording also earns '+H.money(l,fee)+' in each of the next three years.';
      }
      if(r.completed>=3&&r.following>=60&&l.sim.expansion){
        const award={acting:'Company Players’ Citation',music:'Three Billings Music Prize',sport:'Circuit Merit Medal'}[id];
        if(!l.sim.expansion.awards.includes(award)){
          l.sim.expansion.awards.push(award);ctx.keepsake(l,award);text+=' I received the '+award+'.';
        }
      }
      note(l,r,text);ctx.log(l,'Career','Season completed',text);
    }
  }
  function validate(l){
    const s=l.sim.performanceStudio;if(s===undefined)return;
    const bounded=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
    const string=v=>typeof v==='string'&&v.length>0&&v.length<=512;
    const bad=()=>{throw Error('Invalid performance contract history.');};
    if(!s||!s.tracks||typeof s.tracks!=='object'||Array.isArray(s.tracks)||!Array.isArray(s.rights)||s.rights.length>3)bad();
    if(s.rights.some(p=>!p||!Number.isSafeInteger(p.from)||p.from>year(l)||p.until!==p.from+3||!bounded(p.fee,Number.MAX_SAFE_INTEGER/500)))bad();
    let contracts=0;
    for(const [id,r] of Object.entries(s.tracks)){
      if(!ids.includes(id)||!r||!bounded(r.skill,100)||!bounded(r.completed,l.age)||!bounded(r.following,1000000)||typeof r.member!=='boolean'||!Array.isArray(r.history)||r.history.length>8)bad();
      if(r.group!==undefined&&(!r.member||!string(r.group))||r.circuit!==undefined&&(typeof r.circuit!=='boolean'||r.circuit&&!r.member))bad();
      if(r.history.some(h=>!h||!Number.isSafeInteger(h.year)||h.year<l.born||h.year>year(l)||!string(h.text)))bad();
      for(const c of [r.offer,r.contract].filter(Boolean))if(!Number.isSafeInteger(c.year)||c.year>year(l)||c.year<l.born+18||!string(c.name)||!bounded(c.fee,Number.MAX_SAFE_INTEGER/500))bad();
      if(r.offer&&(!string(r.offer.town)||r.contract))bad();
      if(r.contract){
        contracts++;const c=r.contract;
        if(!(c.plan===null&&c.rate===50||c.plan==='plain'&&c.rate===100||c.plan==='bold'&&[65,145].includes(c.rate)))bad();
      }
    }
    if(contracts>1)bad();
  }
  root.PocketPerformanceStudio={view,perform,pay,settle,validate};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
