/* Congregations encountered by this family. Counts describe the game world, not census data. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const history=node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;
  const catalog=node?require('./faith-catalog.js').PocketFaithCatalog:root.PocketFaithCatalog;
  const personal=node?require('./faith-personal.js').PocketFaithPersonal:root.PocketFaithPersonal;
  const model=node?require('./model.js').PocketModel:root.PocketModel;
  const geo=node?require('./geography.js').PocketGeography:root.PocketGeography;
  const year=l=>l.born+l.age;
  function members(l){
    const network={};
    function add(person,town){
      if(!catalog.get(person.id)||!geo.cities[town]||person.id==='unaffiliated'||person.status==='private')return;
      const places=network[person.id]||(network[person.id]={});
      const group=places[town]||(places[town]={members:0,involvement:0});
      group.members++;
      group.involvement+=person.involvement||0;
    }
    if(!l.ended)add(personal.profile(l),l.town);
    for(const [key,p] of Object.entries(l.people)){
      if(p.met&&model.isAlive(p)&&!p.cutOff)add(personal.npc(l,key),p.town||l.town);
    }
    return network;
  }
  function annual(l){
    const now=year(l);
    if(l.sim.faithCongregations?.year===now)return;
    const network=members(l);
    const state=l.sim.faithCongregations||(l.sim.faithCongregations={groups:{},year:now});
    state.year=now;
    for(const [id,places] of Object.entries(network)){
      const groups=state.groups[id]||(state.groups[id]={});
      for(const town of Object.keys(places)){
        if(!groups[town])groups[town]={members:0,change:0,first:now};
      }
    }
    for(const [id,places] of Object.entries(state.groups)){
      for(const [town,p] of Object.entries(places)){
        const contact=network[id]?.[town];
        const place=history.place(town,now);
        const capacity=Math.max(20,place.populationIndex*(catalog.local(id,town,now)?3:1));
        const fluctuation=((model.hash(id+'/'+town+'/'+now)%1000)/999-.5)*.11;
        const pressure=history.marketEffects(l,town,now).cost-1;
        const attendance=contact?(contact.members+contact.involvement/65):0;
        const previous=p.members;
        const rate=.025*(1-previous/capacity)+fluctuation-Math.max(0,pressure)*.12;
        p.members=Math.max(contact?.members||0,Math.min(capacity,Math.round(previous*(1+rate)+attendance-(contact?0:1))));
        p.change=p.members-previous;
      }
    }
  }
  function summary(l,id){
    const rows=l.sim.faithCongregations?.groups?.[id]||{};
    const regions=new Map();
    let total=0,annualChange=0;
    const events=[];
    for(const [town,group] of Object.entries(rows)){
      const p=history.place(town,year(l));
      const name=p.country;
      const r=regions.get(name)||{country:name,name,followers:0,change:0};
      r.followers+=group.members;r.change+=group.change;regions.set(name,r);
      total+=group.members;annualChange+=group.change;
      events.push({year:group.first,text:'The family first recorded a community in '+history.place(town,group.first).label+'.'});
    }
    const localSites=l.sim.faithWorld?.institutions?.sites||[];
    const trustees=[...new Set(localSites.filter(s=>s.town===l.town&&s.faithId===id).map(s=>s.stewardName).filter(Boolean))];
    const leader=trustees.join(', ')||'No local office recorded';
    return {total,annualChange,regions:[...regions.values()],history:events.sort((a,b)=>a.year-b.year),leader,label:'Members of simulated communities'};
  }
  function validate(l){
    const s=l.sim.faithCongregations;if(s===undefined)return;
    if(!s||!Number.isSafeInteger(s.year)||s.year>year(l)||!s.groups||typeof s.groups!=='object'||Array.isArray(s.groups))throw Error('Invalid local community history.');
    for(const [id,places] of Object.entries(s.groups)){
      if(!catalog.get(id)||!places||typeof places!=='object'||Array.isArray(places))throw Error('Unknown local community.');
      for(const [town,g] of Object.entries(places)){
        if(!geo.cities[town]||!g||!Number.isSafeInteger(g.members)||g.members<0||!Number.isSafeInteger(g.change)||!Number.isSafeInteger(g.first)||g.first>s.year)throw Error('Invalid local participation.');
      }
    }
  }
  root.PocketFaithCommunity={annual,summary,validate};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
