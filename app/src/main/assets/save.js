/* Each slot has an atomic current snapshot, a previous snapshot and a manual checkpoint. */
(function(root){
  'use strict';
  const maxLength=8*1024*1024;
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  function checksum(s){
    let a=1,b=0;for(let i=0;i<s.length;i++){a=(a+s.charCodeAt(i))%65521;b=(b+a)%65521;}
    return ((b*65536+a)>>>0).toString(16).padStart(8,'0');
  }
  function parse(raw){
    if(typeof raw!=='string'||!raw.length||raw.length>maxLength)throw Error('The save file is empty or too large.');
    return JSON.parse(raw,(k,v)=>{if(['__proto__','constructor','prototype'].includes(k))throw Error('Unsupported save field.');return v;});
  }
  function open(storage,engine,key){
    let selected=1,failed=false,message='';const checked=new Map();
    try{const n=Number(storage.getItem(key+'.selected'));if([1,2,3].includes(n))selected=n;}catch{failed=true;}
    const slot=n=>n===1?key:key+'.slot.'+n;
    const get=k=>{try{return storage.getItem(k);}catch{return null;}};
    const blank=()=>({version:4,active:engine.makeLife({birthYear:2026}),archive:[],settings:{motion:'system'}});
    function decode(raw){
      const game=engine.decodeGame(parse(raw));
      const dynasty=typeof module!=='undefined'&&module.exports?require('./history-dynasty.js').PocketHistoryDynasty:root.PocketHistoryDynasty;
      for(const l of [game.active,...game.archive]){
        if(dynasty?.isArchive(l)){if(l===game.active)throw Error('A closed archive cannot be an active life.');dynasty.validateArchive(l);continue;}
        dynasty?.validate(l);engine.historyWorld?.validate(l);
        for(const field of ['faithWorld','faith','faithLegacy','faithCongregations']){
          if(l.sim[field]!==undefined&&(!l.sim[field]||typeof l.sim[field]!=='object'||Array.isArray(l.sim[field])))throw Error('Invalid belief history.');
        }
        for(const module of [engine.faithMovements,engine.faithPersonal,engine.faithInstitutions,engine.faithLegacy,engine.faithCommunity,engine.faithEncounters])module.validate(l);
        if(l.sim.realism!==undefined&&!['guided','historical'].includes(l.sim.realism))throw Error('Unknown historical realism setting.');
        const {contractRole,experienceYear,payReviewYear,roleYears,legacyPayFactor}=l.world;
        if(legacyPayFactor!==undefined&&(!Number.isFinite(legacyPayFactor)||legacyPayFactor<.5||legacyPayFactor>2||contractRole!==undefined))throw Error('Invalid inherited pay basis.');
        if(contractRole!==undefined&&contractRole!==null&&(typeof contractRole!=='string'||!own(engine.jobs,contractRole)))throw Error('Invalid employment contract.');
        for(const y of [experienceYear,payReviewYear])if(y!==undefined&&(!Number.isSafeInteger(y)||y<l.born||y>l.born+l.age))throw Error('Invalid career year.');
        if(roleYears!==undefined&&(!roleYears||typeof roleYears!=='object'||Array.isArray(roleYears)||
            Object.entries(roleYears).some(([id,n])=>!own(engine.jobs,id)||!Number.isSafeInteger(n)||n<0||n>l.age)))throw Error('Invalid work history.');
        const era=engine.historyEconomy;
        if(!Number.isInteger(l.age)||l.age<0||l.age>150||!Number.isSafeInteger(l.cash)||l.cash<0||!engine.sim.geography.cities[l.town]||l.job&&!own(engine.jobs,l.job)||!Array.isArray(l.log)||!l.people.carer||!l.people.love||!l.people.friend)throw Error('Incomplete life record.');
        if(!Array.isArray(l.used)||!Array.isArray(l.seen)||!Array.isArray(l.eventQueue)||!Array.isArray(l.sim.illnesses)||!Array.isArray(l.sim.offenses))throw Error('Incomplete simulation record.');
        const pet=l.sim.pet;
        if(pet){
          const breeds=typeof pet.type==='string'&&own(engine.sim.petBreeds,pet.type)&&engine.sim.petBreeds[pet.type];
          if(!breeds||typeof pet.name!=='string'||!Number.isInteger(pet.years)||pet.years<0||!Number.isInteger(pet.lifespan)||pet.lifespan<1)throw Error('Invalid pet record.');
          if(pet.breed!==undefined&&!breeds.includes(pet.breed))throw Error('Unrecognized pet breed.');
        }
        const pending=[l.event,...l.eventQueue,...(l.world.events||[])].filter(Boolean);
        if(pending.some(e=>e.id&&!own(engine.stories,e.id)))throw Error('Unrecognized life event.');
        function validHolding(id,a){
          if(!a||!Number.isFinite(a.value)||a.value<0)return false;
          const type=a.listing?a.listing.type:id;
          return a.listing?.historical?!!(era?.validListing(id,a.listing)&&engine.sim.geography.cities[a.listing.town]):
            own(engine.world.market,type)&&(!a.listing||engine.world.shopping.shops[a.listing.shop]&&Number.isFinite(a.listing.price));
        }
        for(const [id,a] of Object.entries(l.world.owned))if(!validHolding(id,a))throw Error('Invalid asset record.');
        engine.sim.validateFinance(l);
        const x=l.sim.expansion;if(x){
          for(const field of ['companies','policies','hobbies','permits','portfolio','family'])if(!x[field]||typeof x[field]!=='object'||Array.isArray(x[field]))throw Error('Incomplete expansion record.');
          for(const field of ['certs','passports','awards'])if(!Array.isArray(x[field]))throw Error('Incomplete expansion record.');
          for(const [id,c] of Object.entries(x.companies))if(c.id!==id||(!own(engine.expansion.data.businesses,c.type)&&!(era?.businesses&&own(era.businesses,c.type)))||!engine.sim.geography.cities[c.town]||!Number.isFinite(c.capital)||c.capital<0)throw Error('Invalid business record.');
          for(const [id,q] of Object.entries(x.portfolio))if(!own(engine.expansion.funds,id)||!Number.isSafeInteger(q)||q<0)throw Error('Invalid investment.');
          for(const [id,n] of Object.entries(x.family))if(!n||n.id!==id||typeof n.name!=='string'||!Number.isInteger(n.born)||!Array.isArray(n.parents)||n.parents.some(p=>!own(x.family,p))||n.spouse&&!own(x.family,n.spouse))throw Error('Invalid family tree.');
          if(x.worldHistory&&(!Array.isArray(x.worldHistory)||x.worldHistory.some(r=>!r||!engine.sim.geography.cities[r.town]||!Number.isInteger(r.year)||!Number.isFinite(r.unemployment))))throw Error('Invalid market report.');
          for(const n of Object.values(x.family))if(n.history&&(!Array.isArray(n.history)||n.history.some(m=>!m||!Number.isInteger(m.year)||typeof m.act!=='string')))throw Error('Invalid family history.');
          if(x.dispute&&(!Number.isSafeInteger(x.dispute.amount)||x.dispute.amount<0))throw Error('Invalid estate claim.');
          if(typeof x.policies.autopay!=='boolean'||!['Simple','Comfortable','Luxury'].includes(x.policies.lifestyle))throw Error('Invalid payment policies.');
          for(const c of Object.values(x.companies))if(!Number.isInteger(c.level)||c.level<1||c.level>6||!Number.isInteger(c.clients)||c.clients<0||c.clients>8||!Number.isFinite(c.share)||c.share<=0||c.share>1)throw Error('Invalid business accounts.');
          for(const p of Object.values(l.people)){
            if(p.town&&!engine.sim.geography.cities[p.town]||p.home&&!engine.sim.geography.cities[p.home])throw Error('Invalid family address.');
            if(p.homeDeed&&(!validHolding(p.homeDeed.id,p.homeDeed)||!Number.isFinite(p.homeDeed.share)||p.homeDeed.share<=0||p.homeDeed.share>1))throw Error('Invalid household deed.');
            const f=p.enterprise;
            if(f&&(!Number.isInteger(f.founded)||typeof f.name!=='string'||!engine.sim.geography.cities[f.town]||
              !Number.isFinite(f.capital)||f.capital<0||!Number.isFinite(f.initial)||f.initial<=0||
              !(own(engine.expansion.data.businesses,f.type)||era?.businesses&&own(era.businesses,f.type))))throw Error('Invalid household business.');
          }
        }
        engine.state(l);
      }
      return game;
    }
    function valid(raw){if(!raw)return null;try{return decode(raw);}catch{return null;}}
    function put(k,v){try{storage.setItem(k,v);return true;}catch{failed=true;message='Storage is full or unavailable. Export your current life.';return false;}}
    // Prepare both valid fingerprints first. A closure on either side of setItem leaves a readable snapshot.
    function stored(k){
      const raw=get(k),record=get(k+'.check');if(!raw)return null;
      if(record&&!record.split('/').includes(checksum(raw)))return null;
      return valid(raw);
    }
    function putSnapshot(k,raw){
      const old=get(k),fingerprint=checksum(raw),before=old?checksum(old):'';
      if(!put(k+'.check',before+'/'+fingerprint))return false;
      return put(k,raw);
    }
    function readSlot(n){
      const k=slot(n),raw=get(k),current=stored(k);
      if(current){checked.set(k,raw);return current;}
      const previous=stored(k+'.backup')||stored(k+'.manual');
      if(raw){put(k+'.recovery',raw);message=previous?'Recovered the last readable save.':'The damaged save was kept for recovery.';failed=!previous;}
      if(previous)putSnapshot(k,JSON.stringify(engine.encodeGame(previous)));
      return previous;
    }
    function write(game,k,backup=true){
      let raw;try{raw=JSON.stringify(engine.encodeGame(game));}catch{failed=true;return false;}
      if(raw.length>maxLength){failed=true;message='This save is too large for device storage.';return false;}
      const old=get(k);if(old===raw){failed=false;return true;}
      if(backup&&old){
        // A bad generation must never replace a known-good backup.
        if(checked.get(k)===old||stored(k))putSnapshot(k+'.backup',old);
      }
      if(!putSnapshot(k,raw))return false;
      checked.set(k,raw);failed=false;return true;
    }
    function load(){return readSlot(selected)||blank();}
    function checkpoint(){return stored(slot(selected)+'.manual');}
    function restore(){const next=checkpoint();return next&&write(next,slot(selected))?next:null;}
    function recover(){const next=stored(slot(selected)+'.backup');return next&&write(next,slot(selected))?next:null;}
    function slots(){return [1,2,3].map(n=>{
      const raw=get(slot(n));let v=null;try{if(raw)v=JSON.parse(raw).active;}catch{}return {n,active:n===selected,name:v?(v.run?[v.firstName,v.lastName].filter(Boolean).join(' '):v.name):'',age:v?.age,occupied:!!raw};
    });}
    function select(n,current){
      if(![1,2,3].includes(n)||n===selected||!write(current,slot(selected)))return null;
      const target=readSlot(n);if(!target&&get(slot(n)))return null;
      const next=target||blank();if(!target&&!write(next,slot(n),false))return null;
      if(!put(key+'.selected',String(n)))return null;selected=n;return next;
    }
    function exportFile(game){
      const snapshot=JSON.stringify(engine.encodeGame(game));return JSON.stringify({format:'Pocket Years backup',version:1,checksum:checksum(snapshot),game:JSON.parse(snapshot)});
    }
    function inspectFile(raw){
      try{
        const data=parse(raw);
        if(data.format==='Pocket Years backup'){
          const payload=JSON.stringify(data.game);
          if(data.version!==1||typeof payload!=='string'||checksum(payload)!==data.checksum)throw Error('Backup checksum does not match.');
          return decode(payload);
        }
        return decode(raw);
      }catch{message='This file could not be read. Your current life is safe.';return null;}
    }
    function importFile(raw){
      const next=inspectFile(raw);if(!next||!write(next,slot(selected)))return null;
      message='Imported into slot '+selected+'.';return next;
    }
    return {load,save:g=>write(g,slot(selected)),manual:g=>write(g,slot(selected)+'.manual',false),checkpoint,restore,recover,slots,select,exportFile,importFile,inspectFile,
      get hasBackup(){return !!get(slot(selected)+'.backup');},get current(){return selected;},get message(){return message;},get failed(){return failed;}};
  }
  root.PocketSaves={open};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
