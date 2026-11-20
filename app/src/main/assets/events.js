(function(root){
  'use strict';
  const M=typeof module!=='undefined'&&module.exports?require('./model.js').PocketModel:root.PocketModel;
  const data=typeof module!=='undefined'&&module.exports?require('./expansion-data.js').PocketExpansionData:root.PocketExpansionData;
  function stat(l,key){
    if(key==='happiness')return l.stats.joy;if(key==='jobPerformance')return l.world.performance;
    if(key==='grade')return l.world.grade;
    return Object.prototype.hasOwnProperty.call(l.hidden,key)?l.hidden[key]:l.stats[key];
  }
  const techYear={'viral-photo':2004,'last-minute-shift':2008,'tech-release':2008,'long-distance':2009};
  function fitsYear(l,event){
    if(!event)return false;
    const historic=!!l.sim.timeline?.historicalRules,y=l.born+l.age;
    const eraEvent=typeof event.id==='string'&&event.id.startsWith('era_');
    if(eraEvent&&!historic)return false;
    if(!historic)return true;
    if(y<2000&&event.id&&!eraEvent&&event.minYear===undefined&&event.maxYear===undefined)return false;
    if(techYear[event.id]&&y<techYear[event.id])return false;
    return (event.minYear===undefined||y>=event.minYear)&&(event.maxYear===undefined||y<=event.maxYear);
  }
  function eligible(l,event){
    if(!fitsYear(l,event))return false;
    const r=event.rule||{};
    if((r.minAge!==undefined&&l.age<r.minAge)||(r.maxAge!==undefined&&l.age>r.maxAge))return false;
    if(r.lifeStage&&!r.lifeStage.includes(M.stage(l)))return false;
    if(l.sim.prison&&!(r.lifeStage||[]).includes('prison'))return false;
    if(r.requiredTags&&!r.requiredTags.every(t=>l.sim.lifeTags.includes(t)))return false;
    if(r.excludedTags&&r.excludedTags.some(t=>l.sim.lifeTags.includes(t)))return false;
    if(r.requiredStats&&Object.entries(r.requiredStats).some(([k,v])=>!Number.isFinite(stat(l,k))||stat(l,k)<v))return false;
    if(r.hasCondition&&!l.sim.illnesses.length&&!l.sim.injuries.length)return false;
    if(r.contact&&!contacts(l,r.contact).length)return false;
    const x=l.sim.expansion;
    if(r.phase&&(!x||x.phase!==r.phase))return false;
    if(r.sector&&(!l.job||l.job==='student'||l.job==='retired'||data.sector(l.job)!==r.sector))return false;
    if(r.lease&&!Object.values(l.world.owned).some(a=>a.tenant))return false;
    if(r.company&&(!x||!Object.keys(x.companies).length))return false;
    if(r.hobby&&(!x||!Object.keys(x.hobbies).length))return false;
    if(r.migrant&&!l.sim.residences?.length)return false;
    if(r.noShift&&l.world.partJob)return false;
    const partner=l.people.love;
    if(r.relation==='partner'&&!(partner.active&&['Partner','Engaged partner','Spouse'].includes(partner.role)))return false;
    if(r.relation==='spouse'&&!(partner.active&&partner.role==='Spouse'))return false;
    return true;
  }
  function draw(l,items,weight,random){
    if(!items.length)return null;
    const weights=items.map(v=>Math.max(.01,weight(v)));let n=random(l)*weights.reduce((a,b)=>a+b,0);
    for(let i=0;i<items.length;i++){n-=weights[i];if(n<0)return items[i];}return items[items.length-1];
  }
  function contacts(l,role){
    return Object.entries(l.people).filter(([,p])=>p.met&&p.active&&M.isAlive(p)&&(role==='classmate'?p.atSchool&&p.job==='Student':
      role==='relative'?M.isFamily(p):role==='teacher'?p.atSchool&&p.role==='Teacher':role==='boss'?p.role==='Boss':role==='coworker'?p.role==='Coworker':
      role==='child'?p.role==='Child'&&M.ageOf(l,p)>=5&&M.ageOf(l,p)<18:false)).map(([id])=>id);
  }
  function queue(l,stories,world,random){
    const list=[],chosen=new Set();
    function take(id,person=null){list.push({id,resolved:false,person});chosen.add(id);l.seen.push(id);}
    const roll=random(l),rate=(l.age<4?.25:.46)+(l.hidden.craziness-50)*.0011+Math.abs(l.hidden.karma-50)*.0006;
    const count=roll<.024+l.hidden.craziness*.0007?2:roll<rate?1:0;
    if(!l.sim.prison&&list.length<2){
      let prior;
      while((prior=world.nextEvent(l))){
        if(!fitsYear(l,stories[prior.id])||(prior.person&&(!l.people[prior.person]||!M.isAlive(l.people[prior.person]))))continue;
        take(prior.id,prior.person);
        break;
      }
    }
    if(l.age===1&&l.sim.timeline?.historicalRules&&l.born+l.age<2000&&stories.era_birth&&!l.seen.includes('era_birth'))take('era_birth');
    while(list.length<count){
      const candidates=Object.values(stories).filter(e=>e.random&&!chosen.has(e.id)&&eligible(l,e));
      const fresh=candidates.filter(e=>!l.seen.includes(e.id));
      const options=fresh.length?fresh:candidates.filter(e=>!l.seen.slice(-7).includes(e.id));
      const next=draw(l,options,e=>e.weight*(1+(e.karmaBias||0)*(l.hidden.karma-50)/85+(e.crazinessBias||0)*(l.hidden.craziness-50)/85),random);
      if(!next)break;const people=next.rule&&next.rule.contact?contacts(l,next.rule.contact):[];
      take(next.id,people.length?people[Math.floor(random(l)*people.length)]:null);
    }
    l.event=list.shift()||{id:null,resolved:true};l.eventQueue=list;
  }
  function choose(l,opt,random){
    if(!opt.branches)return {text:opt.result,effects:opt.effects,change:opt.change};
    return draw(l,opt.branches,b=>b.weight+(b.stat?(stat(l,b.stat)||0)*(b.scale||0):0),random);
  }
  root.PocketEvents={eligible,fitsYear,draw,queue,choose,stat};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
