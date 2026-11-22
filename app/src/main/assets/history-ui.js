/* Presentation only. Actions resolve against the current life in the engine. */
(function(root){
  'use strict';
  function create({E,row,detail,subhead,esc,cash,appraisalDetail,button}){
    const H=E.historyEconomy,D=E.historyDynasty,W=E.historyWorld;
    const labels={work:'Work and trades',school:'Learning and training',market:'Local market',owned:'Manage possessions',business:'Enterprises',activities:'Daily life',museum:'Family Museum'};
    const icons={work:'bag',school:'book',market:'basket',owned:'key',business:'shop',activities:'sprout',museum:'archive'};
    const commands=rows=>'<div class="commands">'+rows.join('')+'</div>';
    const link=(group,title,desc)=>row('sheet','hist-'+group,title||labels[group],desc||'',icons[group]||'journal');
    const place=(id,year)=>W.place(id,year);
    function location(id,year){
      const p=place(id,year);
      return p?.label||[p?.city,p?.country].filter(Boolean).join(', ')||E.sim.geography.label(id);
    }
    function list(l,group){
      if(l.ended)return [];
      return group==='museum'?D.actions(l):H.actions(l,group);
    }
    function lookup(l,group,id){
      return list(l,group).find(a=>a.id===id);
    }
    function rows(l,group){
      const opts=list(l,group);
      return opts.length?commands(opts.map(a=>row('sheet','hist-review~'+group+'~'+encodeURIComponent(a.id),a.title,a.description||'',a.icon||icons[group],a.reason||a.disabled||''))):detail('Nothing available',l.ended?'This life has ended.':'New opportunities can open as you age.');
    }
    function collection(l){
      const items=D.items(l);
      return items.length?subhead('Collection')+commands(items.map((a,i)=>row('sheet','hist-item~'+i,a.title,a.category+' · acquired '+a.year,'gift','',cash(a.value)))):detail('Collection','Your family has yet to exhibit an item.');
    }
    function holding(l,id){
      const owned=l.world.owned[id],q=owned?.listing;
      if(!q?.historical)return null;
      const year=owned.acquiredYear??q.listedYear,town=q.town||owned.town||l.town;
      const management=list(l,'owned').filter(o=>o.id==='sell-'+id||o.id==='restore-'+id);
      return {title:q.name,tag:q.category,body:detail('Acquired '+year,location(town,year)+(owned.inherited?' · Inherited':''))+
        detail('Condition',owned.condition+'% · estimated value '+cash(owned.value))+appraisalDetail(l,id)+
        (q.category==='Property'?detail('Year built',String(q.built))+detail('Annual receipts',cash(E.world.assetRent(l,id,owned))):'')+
        commands(management.map(o=>row('sheet','hist-review~owned~'+encodeURIComponent(o.id),o.title,o.description,o.icon,o.reason)))};
    }
    function currentWorld(l){
      const y=E.calendar(l),p=place(l.town,y);
      const rows=[detail(location(l.town,y),[p.industry,p.transport].filter(Boolean).join(' · '))];
      if(p.government)rows.push(detail('Government',p.government));
      if(p.populationIndex)rows.push(detail('Settlement growth','Population index '+p.populationIndex+' · simulated regional development.'));
      return rows.join('');
    }
    function personalHistory(r){
      const body=[];
      if(r.lastSpecialistRole)body.push(detail('Last specialist role',r.lastSpecialistRole));
      if(r.studies?.length)body.push(subhead('Qualifications'),...r.studies.map(s=>
        detail(s.title,[s.year===null?'Year unrecorded':String(s.year),s.honors?'With honors':''].filter(Boolean).join(' · '))));
      if(r.performed?.length)body.push(subhead('Performance record'),...r.performed.map(s=>
        detail(({acting:'Acting',music:'Music',sport:'Competitive sport'})[s.id],s.seasons+' '+(s.seasons===1?'season':'seasons')+' completed · '+s.audience.toLocaleString('en-US')+' supporters')));
      return body.join('');
    }
    function sheet(l,game,key){
      const [type,ref,arg]=key.split('~');
      if(type==='hist-review'){
        if(!labels[ref]||arg===undefined)return null;
        let id;try{id=decodeURIComponent(arg);}catch(e){return null;}
        const action=lookup(l,ref,id);
        if(!action)return null;
        return {title:action.title,tag:labels[ref]+' · '+E.calendar(l),body:detail('Details',action.description||action.title)+button('hist-run',key,'Confirm','primary wide',action.icon||icons[ref],action.reason||action.disabled||'')};
      }
      if(type==='hist-item'){
        const a=D.items(l)[Number(ref)];if(!a)return null;
        const provenance=(a.owners||[]).map(o=>detail(String(o.year),o.name)).join('');
        return {title:a.title,tag:a.category,body:detail('Acquired '+a.year,a.origin||location(a.town,a.year))+detail('Entered the museum',a.accession+' · '+a.source)+detail('Estimated value',cash(a.value))+detail('Condition',a.condition+'%')+(provenance?subhead('Ownership history')+provenance:'')};
      }
      if(type==='hist-owned'){
        const owned=Object.entries(l.world.owned).filter(([,a])=>a.listing?.historical);
        return {title:'Your possessions',tag:String(E.calendar(l)),body:owned.length?commands(owned.map(([id,a])=>row('sheet','sell-'+id,a.listing.name,(a.inherited?'Inherited':'Acquired')+' · '+(a.acquiredYear??a.listing.listedYear)+' · '+a.condition+'% condition',a.listing.icon,'',cash(a.value)))):detail('Possessions','Your household has no holdings from the period market.')};
      }
      if(type==='hist-business'){
        const firms=Object.values(l.sim.expansion?.companies||{}).filter(c=>c.historical);
        const forecasts=E.expansion.businessYear(l).rows;
        const history=firms.map(c=>detail(c.name,'Founded '+c.originYear+' by '+c.founder+' · '+location(c.town,c.originYear)+' · capital '+cash(c.capital)+' · forecast distribution '+cash(forecasts.find(f=>f.id===c.id)?.payout||0))).join('');
        return {title:'Enterprises',tag:String(E.calendar(l)),body:history+rows(l,'business')};
      }
      if(type==='hist-museum')return {title:labels.museum,tag:'Family collections',body:collection(l)+(!l.ended?subhead('Museum actions')+rows(l,'museum'):'')};
      if(type==='hist-archive'||type==='archive'){
        const records=type==='archive'?game.archive:D.familyArchive(game,E.world,E.jobs);
        const visits=records.map((r,i)=>row('sheet',(type==='archive'?'past-':'hist-capsule~')+i,r.name,r.born+'–'+(r.born+r.age),'archive'));
        if(type==='hist-archive')visits.unshift(row('sheet','hist-capsule~current',l.name,'Current journal · '+l.born+'–'+E.calendar(l),'journal'));
        return {title:type==='archive'?'Past lives':'Family archive',body:commands(visits)};
      }
      if(type==='hist-capsule'||/^past-\d+$/.test(type)){
        const all=type==='hist-capsule'?D.familyArchive(game,E.world,E.jobs):game.archive;
        const record=ref==='current'&&type==='hist-capsule'?l:all[type==='hist-capsule'?Number(ref):Number(type.slice(5))];
        if(!record)return null;
        const r=record.archiveRecord?record:D.record(record,E.world,E.jobs);
        const overview=[['Home',location(r.town,r.born+r.age)],['Career',r.career],['Cause of death',r.ended?r.cause:''],['Achievements',(r.achievements||[]).join(' · ')],['Family',(r.relationships||[]).join(' · ')],['Historical events',(r.events||[]).join(' · ')],['Possessions',(r.possessions||[]).join(' · ')],['Closing wealth',H.money({...r,sim:{timeline:{historicalRules:!!r.historicalRules}}},r.wealth||0)]];
        const log=r.log||[],page=Math.max(0,Number.isInteger(+arg)?+arg:0);
        const visible=log.slice(page*20,page*20+20);
        const route=type==='hist-capsule'?type+'~'+ref:type+'~0';
        let body=overview.filter(([,s])=>s).map(([k,s])=>detail(k,s)).join('')+personalHistory(r);
        if(r.faithLegacy){
          const f=r.faithLegacy;
          const beliefs=[['Starting outlook',f.original],[r.ended?'Final outlook':'Current outlook',f.identity],['Devotion',f.commitment]];
          for(const [label,items] of [['Community roles',f.movements],['Family beliefs',f.relatives],['Community memories',f.memories]]){
            if(items.length)beliefs.push([label,items.join(' · ')]);
          }
          body+='<details class="faith-archive"><summary>Faith &amp; community records</summary>'+beliefs.map(([label,value])=>detail(label,value)).join('')+'</details>';
        }
        for(const e of visible){
          const y=r.born+e.age;
          body+='<article class="time-capsule" data-theme="'+esc(root.PocketEraUI.themeForYear(y))+'">'+detail(y+' · '+(e.title||'Age '+e.age),[e.body,e.diary].filter(Boolean).join(' '))+'</article>';
        }
        if(page||log.length>(page+1)*20)body+=commands([...(page?[row('sheet',route+'~'+(page-1),'Earlier entries','','back')]:[]),...(log.length>(page+1)*20?[row('sheet',route+'~'+(page+1),'Later entries','','arrow')]:[])]);
        return {title:r.name,tag:'Time Capsule · '+r.born+'–'+(r.born+r.age),body};
      }
      if(type==='hist-world')return {title:'The local world',tag:String(E.calendar(l)),body:currentWorld(l)};
      if(type==='hist-move'){
        const current=location(l.town,E.calendar(l)),dest=W.choices(E.calendar(l));
        return {title:'Move household',tag:current,body:commands(dest.filter(p=>p.id!==l.town).map(p=>row('sheet','hist-settle~'+p.id,p.city,p.country,'map')))};
      }
      if(type==='hist-settle'){
        if(!E.isHistorical(l)||!E.sim.geography.cities[ref])return null;
        const y=E.calendar(l),q=W.quote(l,ref);
        return {title:'Move to '+place(ref,y).city+'?',tag:String(y),body:detail('Journey',location(l.town,y)+' → '+location(ref,y))+detail('Cost',cash(q.cost))+button('hist-relocate',ref,'Move household','primary wide','map',q.reason)};
      }
      const group=type.slice(5);
      if(!labels[group])return null;
      return {title:labels[group],tag:location(l.town,E.calendar(l)),body:rows(l,group)};
    }
    function perform(l,key){
      const [,group,raw]=key.split('~');
      if(!labels[group]||raw===undefined)return null;
      let id;try{id=decodeURIComponent(raw);}catch(e){return null;}
      const a=lookup(l,group,id);
      return a&&!a.reason&&!a.disabled?E.historyPerform(l,group,id):null;
    }
    return {link,sheet,rows,currentWorld,location,perform,holding,personalHistory};
  }
  root.PocketHistoryUI={create};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
