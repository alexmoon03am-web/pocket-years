/* Faith sheets render simulation data. Commands are rechecked against the open sheet on submission. */
(function(root){
  'use strict';
  const eras=typeof module!=='undefined'&&module.exports?require('./era-ui.js'):root.PocketEraUI;
  const personalGroups={
    practice:['Practice & service','Regular observances, learning and community service.','book'],
    belief:['Beliefs & affiliation','Explore, adopt or leave a worldview.','compass'],
    family:['Family & beliefs','Discuss beliefs and traditions at home.','people'],
    career:['Faith & community work','Explore religious and secular vocations.','bag']
  };
  const metricLabels=[['devotion','Devotion'],['knowledge','Knowledge'],['involvement','Community involvement'],['conviction','Conviction']];
  function create({E,row,detail,subhead,esc}){
    const C=E.faithCatalog,P=E.faithPersonal,M=E.faithMovements,I=E.faithInstitutions,L=E.faithLegacy;
    const w=l=>E.calendar(l);
    const clean=x=>typeof x==='string'||typeof x==='number'?String(x):'';
    const owns=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
    const count=x=>Number.isFinite(Number(x))?Number(x).toLocaleString('en-US'):'0';
    const signed=x=>(x>0?'+':'')+count(x);
    const enc=x=>encodeURIComponent(String(x)).replace(/~/g,'%7E');
    const key=(name,...args)=>['faith-'+name,...args.map(enc)].join('~');
    const route=raw=>{
      if(typeof raw!=='string'||!raw.startsWith('faith-'))return [];
      try{return raw.slice(6).split('~').map(decodeURIComponent);}catch(e){return [];}
    };
    const block=html=>html?'<div class="commands faith-list">'+html+'</div>':'';
    const link=(name,args,title,description,icon='book',reason='')=>row('sheet',key(name,...args),title,description,icon,reason);
    const amount=(l,n)=>E.historyEconomy.money(l,n||0);
    function location(l,id,year=w(l)){
      return id?(E.historyWorld.place(id,year)?.label||String(id)):'';
    }
    function dataGrid(rows){
      const data=rows.filter(([,v])=>v!==null&&v!==undefined&&v!=='');
      return data.length?'<dl class="faith-facts">'+data.map(([a,b])=>'<div><dt>'+esc(a)+'</dt><dd>'+esc(b)+'</dd></div>').join('')+'</dl>':'';
    }
    function listText(heading,entries){
      const list=(entries||[]).filter(x=>typeof x==='string'&&x.trim());
      return list.length?subhead(heading)+'<ul class="faith-lines">'+list.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>':'';
    }
    function metrics(p){
      return '<dl class="faith-metrics">'+metricLabels.map(([k,label])=>{
        const score=Math.max(0,Math.min(100,Number(p[k])||0));
        return '<div><dt>'+esc(label)+'</dt><dd><b>'+score+'</b><progress value="'+score+'" max="100" aria-label="'+esc(label)+'">'+score+'</progress></dd></div>';
      }).join('')+'</dl>';
    }
    function rowsFor(l,group,ref){
      if(owns(personalGroups,group))return P.actions(l,group);
      if(group==='institutions'||group.startsWith('institution:'))return I.actions(l,group);
      if(group==='legacy')return L.actions(l,ref);
      if(group==='movement')return M.actions(l,group).filter(a=>a.movementId===ref);
      return [];
    }
    function actionRows(l,group,ref=''){
      return block(rowsFor(l,group,ref).map(a=>{
        if(a.fields?.length)return link('edit',[ref,a.id],a.title,a.description||'',a.icon||'pencil',a.reason);
        return row('faith-run',a.id,a.title,a.description||a.desc||'',a.icon||'book',a.reason||'');
      }).join(''));
    }
    function affiliation(l,id){
      const option=P.actions(l,'belief').find(a=>a.id==='join-'+id);
      if(!option)return '';
      return block(row('faith-run',option.id,id==='unaffiliated'?'Leave formal affiliation':'Adopt this worldview',option.description,option.icon,option.reason));
    }
    function history(entries){
      const lines=(entries||[]).slice().reverse().map(h=>typeof h==='string'?h:[h.year,h.text||h.title||h.name].filter(Boolean).join(' · '));
      return listText('History',lines);
    }
    const archiveTitles={all:'Movement history',leadership:'Leadership history',works:'Published works'};
    const leadershipEvents=new Set(['succession','nomination','local succession']);
    function archiveEntries(m,section){
      if(section==='works')return m.works||[];
      if(section==='leadership')return (m.history||[]).filter(e=>leadershipEvents.has(e.kind));
      return m.history||[];
    }
    function datedEntry(e){
      const date=Number.isSafeInteger(e.year)?e.year+' · '+eras.eraForYear(e.year).name:'';
      return [date,e.text||e.title,e.author].filter(Boolean).join(' · ');
    }
    function recentRecords(m,section){
      const entries=archiveEntries(m,section),latest=entries.slice(-4).reverse();
      if(!latest.length)return '';
      return listText(archiveTitles[section],latest.map(datedEntry))+(entries.length>latest.length?
        block(link('chronicle',[m.id,section,0],'Browse all '+count(entries.length)+' records','View the archive by year.','archive')):'');
    }
    function chronicle(l,id,section,index){
      const m=M.get(l,id);
      if(!m||!owns(archiveTitles,section)||!/^\d+$/.test(index||''))return null;
      const entries=archiveEntries(m,section),pageSize=20,pages=Math.ceil(entries.length/pageSize),number=Number(index);
      if(!Number.isSafeInteger(number)||number>=pages)return null;
      const end=entries.length-number*pageSize;
      const batch=entries.slice(Math.max(0,end-pageSize),end).reverse();
      const visit=(n,title,icon)=>link('chronicle',[id,section,n],title,'Page '+count(n+1)+' of '+count(pages),icon);
      const nav=[];
      if(number>1)nav.push(visit(0,'Most recent records','clock'));
      if(number>0)nav.push(visit(number-1,'Newer records','back'));
      if(number+1<pages)nav.push(visit(number+1,'Older records','arrow'));
      if(number+2<pages)nav.push(visit(pages-1,'Earliest records','archive'));
      return {title:archiveTitles[section],tag:m.name,body:listText('Page '+count(number+1)+' of '+count(pages),batch.map(datedEntry))+block(nav.join(''))};
    }
    function home(l){
      const p=P.profile(l),movement=M.get(l,p.id),t=C.get(p.id);
      const identity=movement?link('movement',[movement.id],p.name,'Open the movement dashboard.', 'flag'):
        t?link('tradition',[t.id],p.name,'Explore this worldview and its communities.', 'compass'):'';
      const personal=Object.entries(personalGroups).map(([g,[title,desc,ic]])=>link(g,[],title,desc,ic)).join('');
      return {title:'Faith & worldview',tag:String(w(l)),body:detail(p.name||'Unaffiliated',p.statusLabel||p.status)+metrics(p)+
        block(identity+personal)+subhead('Community')+block(
          link('institutions',[],'Local institutions',location(l,l.town),'home')+
          link('directory',[],'Worldviews & movements','Explore traditions and communities in this year.','world-index')+
          link('found',[],'Found a movement','Choose its teachings, traditions and organization.','flag',M.foundReason(l))+
          link('legacy',[],'Family faith & legacy','Shared traditions, memories and succession.','family-tree'))};
    }
    function directory(l){
      const groups=M.list(l),catalog=C.options(w(l),l.town);
      const founded=groups.length?subhead('Founded movements')+block(groups.map(m=>link('movement',[m.id],m.name,
        [m.founderName,m.foundedYear].filter(Boolean).join(' · '),'flag')).join('')):'';
      const local=catalog.filter(c=>C.local(c.id,l.town,w(l))),other=catalog.filter(c=>!C.local(c.id,l.town,w(l)));
      const traditions=records=>block(records.map(c=>link('tradition',[c.id],c.name,c.summary||'',c.secular?'compass':'book')).join(''));
      return {title:'Worldviews & movements',tag:String(w(l)),body:founded+(local.length?subhead('Local traditions')+traditions(local):'')+subhead('Other worldviews')+traditions(other)};
    }
    function regions(l,r,m){
      const rows=m?M.regional(l,m.id):r.regions||[];
      const lines=rows.map(q=>{
        const parts=[count(q.followers)+' members'];
        if(q.change!==undefined)parts.push(signed(q.change)+' this year');
        if(q.trust!==undefined)parts.push('Trust '+count(q.trust)+'/100');
        if(q.influence!==undefined)parts.push('Influence '+count(q.influence)+'/100');
        if(q.teachers)parts.push(count(q.teachers)+(q.teachers===1?' teacher':' teachers'));
        return [q.label||q.name||q.region||q.country||'Local community',parts.join(' · ')];
      });
      return lines.length?subhead('Regional membership')+dataGrid(lines):'';
    }
    function sites(l,faithId,localOnly=false){
      const records=(localOnly?I.records(l,l.town):I.records(l)).filter(s=>!faithId||s.faithId===faithId);
      return {records,html:block(records.map(s=>link('site',[s.id],s.name,location(l,s.town),'home')).join(''))};
    }
    function tradition(l,id){
      const c=C.get(id);if(!c||!C.available(id,w(l)))return null;
      const sim=E.faithCommunity.summary(l,id),local=sites(l,id),money=I.summary(l,l.town,id);
      const perTradition=personalGroups.belief;
      return {title:c.name,tag:c.fictional?'Fictional future worldview':'Worldview',body:
        detail(c.name,c.summary)+affiliation(l,id)+dataGrid([['Origins',clean(c.origin)],['Founder',clean(c.founder)],['Symbol',clean(c.symbol)],['Tradition',clean(c.family)]])+subhead('Simulated communities')+
        dataGrid([['Members',count(sim.total)],['Annual change',signed(sim.annualChange)],['Leadership',clean(sim.leader)],['Local institutions',count(money.count)],['Local treasury',amount(l,money.treasury)]])+
        regions(l,sim)+listText('Observances',(c.rites||[]).map(item=>item.name+(item.description?' — '+item.description:'')))+
        listText('Holidays',(c.holidays||[]).map(item=>[item.name,item.timing,item.calendar].filter(Boolean).join(' · ')))+
        listText('Community roles',(c.roles||[]).map(item=>item.name))+
        (local.records.length?subhead('Institutions')+local.html:'')+history(sim.history)+block(link('belief',[],perTradition[0],perTradition[1],perTradition[2]))};
    }
    function institutions(l){
      const all=sites(l,null,true),s=I.summary(l,l.town);
      return {title:'Local institutions',tag:location(l,l.town),body:dataGrid([
        ['Operating institutions',count(s.active)],['Unbuilt plots',count(s.pendingPlots)],['Staff',count(s.staff)],['Services this year',count(s.annualServices)],['Combined treasury',amount(l,s.treasury)],['Local influence',count(s.localInfluence)],['Education services',count(s.education)],['Health services',count(s.health)],['Relief services',count(s.relief)]])+
        all.html+actionRows(l,'institutions')};
    }
    function site(l,id){
      const s=I.records(l).find(item=>item.id===id);if(!s)return null;
      const plan=I.forecast(l,s);
      return {title:s.name,tag:location(l,s.town),body:dataGrid([
        ['Affiliation',M.get(l,s.faithId)?.name||C.get(s.faithId)?.name],['Founded',s.founded],['Founder',s.founderName],['Level',s.level],['Condition',s.condition+'%'],['Reputation',s.reputation],
        ['Treasury',amount(l,s.treasury)],['Land value',amount(l,s.landValue)],['Property value',amount(l,s.propertyValue)],['Services delivered',count(s.serviceTotal)]])+
        (s.deed?subhead('Property deed')+dataGrid([['Original property',s.deed.title],['Acquired',s.deed.acquiredYear],['Donated by',s.deed.donorName],['Donation year',s.deed.year]]):'')+
        subhead('Annual forecast')+dataGrid([['Expected donations',amount(l,plan.contributions)],['Upkeep',amount(l,plan.maintenance)],['Wages',amount(l,plan.wageBill)],['Services funded',count(plan.served)],['Closing balance',amount(l,plan.closing)]])+
        listText('Staff',(s.staff||[]).map(p=>[p.name,p.role].filter(Boolean).join(' · ')))+actionRows(l,'institution:'+id)};
    }
    function leader(l,m){
      const s=L.leadership(l,m.id,false);if(!s)return '';
      const regions=new Map(M.regional(l,m.id).map(r=>[r.region,r.label||r.region]));
      const seats=Object.entries(m.localSeats||{}).map(([region,seat])=>[regions.get(region)||region,seat.name,seat.year].filter(Boolean).join(' · '));
      return dataGrid([['Office',clean(s.office)],['Leader',clean(s.leader)],['Next in line',clean(s.successor)],['Term',clean(s.term)]])+
        (m.governance==='local'?listText('Regional convenors',seats):'')+recentRecords(m,'leadership');
    }
    function movement(l,id){
      const m=M.get(l,id);if(!m)return null;
      const sub=sites(l,id),branches=M.list(l).filter(item=>item.parentId===id),parent=m.parentId&&M.get(l,m.parentId),united=m.unitedWith&&M.get(l,m.unitedWith);
      let links='';
      if(parent)links+=link('movement',[parent.id],parent.name,'Parent movement.','family-tree');
      if(united)links+=link('movement',[united.id],united.name,'United community.','people');
      for(const branch of branches)links+=link('movement',[branch.id],branch.name,'Branch founded in '+branch.foundedYear+'.','family-tree');
      const original=m.original||{},population=M.followers(m);
      const reputation=population?Math.round(M.regional(l,id).reduce((sum,r)=>sum+r.trust*r.followers,0)/population):null;
      return {title:m.name,tag:'Founded movement',body:dataGrid([
        ['Symbol',clean(m.symbol)],['Founder',m.founderName],['Founded',m.foundedYear],['Origin',location(l,m.town,m.foundedYear)],['Original name',original.name!==m.name?original.name:''],
        ['Current leader',m.leaderName],['Followers',count(population)],['Annual growth',signed(m.lastChange)],['Reputation (member trust)',reputation===null?'':reputation+'/100'],['Stability',m.stability+'/100'],['Treasury',amount(l,m.treasury)]])+
        affiliation(l,id)+block(link('charter',[id],'Founding charter','Compare the original record with current teachings.','letter')+
          link('manage',[id],'Community decisions','Outreach, organization and reform.','people')+
          link('leadership',[id],'Leadership & succession','Review the office and its succession rules.','flag'))+
        regions(l,null,m)+(sub.records.length?subhead('Institutions')+sub.html:'')+
        (links?subhead('Related movements')+block(links):'')+recentRecords(m,'works')+recentRecords(m,'all')};
    }
    function charter(l,id){
      const m=M.get(l,id);if(!m)return null;
      const fields=M.schema(l);
      const describe=(record,f)=>{const v=record[f.key];return (f.choices||[]).find(c=>(c.id||c)===v)?.label||clean(v);};
      const list=record=>dataGrid(fields.map(f=>[f.label,describe(record,f)]));
      return {title:'Founding charter',tag:m.name,body:subhead('Original charter · '+m.foundedYear)+list(m.original||{})+subhead('Current charter')+list(m)};
    }
    function legacy(l){
      const record=L.describe(l);
      return {title:'Family faith & legacy',tag:l.name,body:dataGrid([['Starting outlook',record.original],['Current outlook',record.identity],['Commitment',record.commitment]])+
        listText('Family movements',record.movements)+listText('Relatives',record.relatives)+listText('Memories',record.memories)+actionRows(l,'legacy','family')};
    }
    function fieldMarkup(f,values){
      const id='faith-field-'+f.key,value=values[f.key]??f.default??'',required=f.required?' required':'';
      const label='<label for="'+esc(id)+'">'+esc(f.label)+'</label>',attr=' id="'+esc(id)+'" name="'+esc(f.key)+'"'+required;
      if(f.type==='select'){
        const opts=(f.choices||[]).map(c=>typeof c==='object'?c:{id:c,label:c});
        return label+'<select'+attr+'>'+opts.map(c=>'<option value="'+esc(c.id)+'"'+(c.id===value?' selected':'')+'>'+esc(c.label)+'</option>').join('')+'</select>';
      }
      const limit=Number.isInteger(f.maxLength)&&f.maxLength>0?' maxlength="'+f.maxLength+'"':'';
      if(f.type==='textarea')return label+'<textarea'+attr+limit+' rows="2">'+esc(value)+'</textarea>';
      return label+'<input type="text"'+attr+limit+' value="'+esc(value)+'" autocomplete="off">';
    }
    function charterFields(fields,values){
      const sections=[
        ['Identity',['name','adherentName','symbol','type']],
        ['Teachings',['spirituality','teachings','writings','values','rules']],
        ['Community life',['holidays','ceremonies','worship','clothing']],
        ['Organization',['governance','sharing']]
      ];
      const byKey=new Map(fields.map(f=>[f.key,f]));
      const html=sections.map(([title,keys])=>{
        const inputs=keys.map(k=>{const f=byKey.get(k);byKey.delete(k);return f?fieldMarkup(f,values):'';}).join('');
        return inputs?'<fieldset><legend>'+esc(title)+'</legend>'+inputs+'</fieldset>':'';
      });
      return html.join('')+[...byKey.values()].map(f=>fieldMarkup(f,values)).join('');
    }
    function editor(l,m,a){
      const found=!m,fields=found?M.schema(l):a.fields,values=found?M.defaultDraft(l):{};
      const reason=found?M.foundReason(l):a.reason;
      const title=found?'Found a movement':a.title;
      if(reason)return {title,body:detail('Requirements',reason)};
      return {title,tag:found?String(w(l)):m.name,body:'<form id="faith-form" class="faith-editor">'+
        (found?charterFields(fields,values):fields.map(f=>fieldMarkup(f,values)).join(''))+'<p class="faith-error" role="alert"></p><button type="submit" class="primary wide">'+esc(found?'Found movement':'Save decision')+'</button></form>'};
    }
    function sheet(l,raw){
      const [view,ref,act,page]=route(raw);
      if(view==='chronicle')return chronicle(l,ref,act,page);
      if(view==='home')return home(l);
      if(view==='directory')return directory(l);
      if(view==='tradition')return tradition(l,ref);
      if(view==='institutions')return institutions(l);
      if(view==='site')return site(l,ref);
      if(view==='movement')return movement(l,ref);
      if(view==='charter')return charter(l,ref);
      if(view==='legacy'||view==='museum')return legacy(l);
      if(view==='npc'){
        const n=l.people[ref];if(!n)return null;
        const p=P.npc(l,n,ref);
        return {title:n.fullName||n.name,tag:'Faith & worldview',body:dataGrid([['Identity',p.name],['Status',p.statusLabel||p.status],['Devotion',p.devotion+'/100']])+block(link('family',[],'Family & beliefs','Open family decisions.','people'))};
      }
      if(view==='found')return editor(l,null,null);
      if(view==='leadership'||view==='manage'||view==='edit'){
        const m=M.get(l,ref);if(!m)return null;
        if(view==='leadership')return {title:'Leadership & succession',tag:m.name,body:leader(l,m)+actionRows(l,'legacy',ref)};
        if(view==='manage')return {title:'Community decisions',tag:m.name,body:actionRows(l,'movement',ref)||detail('Community decisions','There are no decisions available to you for this movement.')};
        const a=rowsFor(l,'movement',ref).find(item=>item.id===act);
        return a?.fields?.length?editor(l,m,a):null;
      }
      if(owns(personalGroups,view)){
        const p=P.profile(l),heading=personalGroups[view][0];
        let intro='';
        if(view==='family')intro=detail('Household',p.family||'Family beliefs are private.');
        if(view==='career')intro=detail('Current role',p.career||'No community role.');
        if(view==='belief')intro=detail(p.name,p.statusLabel||p.status);
        return {title:heading,tag:p.name,body:intro+actionRows(l,view)+(view==='belief'?history(p.history):'')};
      }
      return null;
    }
    function parent(raw){
      const [view,id,section]=route(raw);
      if(view==='chronicle')return key(section==='leadership'?'leadership':'movement',id);
      if(view==='home')return null;
      if(view==='npc')return 'person-'+id;
      if(view==='museum')return 'hist-museum';
      if(view==='site')return key('institutions');
      if(view==='tradition'||view==='movement')return key('directory');
      if(view==='manage'||view==='charter'||view==='leadership')return key('movement',id);
      if(view==='edit')return key('manage',id);
      return view?key('home'):null;
    }
    function command(l,raw,id){
      let [group,ref]=route(raw);
      if(group==='tradition'||group==='movement'){
        if(id!=='join-'+ref)return null;
        group='belief';
      }else if(group==='manage')group='movement';
      else if(group==='leadership')group='legacy';
      else if(group==='legacy'||group==='museum'){group='legacy';ref='family';}
      else if(group==='site')group='institution:'+ref;
      else if(!owns(personalGroups,group)&&group!=='institutions')return null;
      const a=rowsFor(l,group,ref).find(item=>item.id===id);
      if(!a||a.reason||a.fields?.length)return null;
      return group==='legacy'?{group,id,payload:{movementId:ref}}:{group,id};
    }
    function form(l,raw,element){
      const [view,ref,act]=route(raw);
      if(element?.id!=='faith-form'||!['found','edit'].includes(view))return null;
      const a=view==='edit'?rowsFor(l,'movement',ref).find(item=>item.id===act):null;
      const fields=view==='found'?M.schema(l):a?.fields;
      if(!fields||a?.reason)return null;
      const payload={};
      const error=reason=>{const msg=element.querySelector('.faith-error');if(msg)msg.textContent=reason;return null;};
      for(const f of fields){
        const input=element.querySelector('#faith-field-'+f.key);if(!input)return null;
        const value=input.value.trim();
        if(f.required&&!value)return error('Enter a value for '+f.label+'.');
        if(f.maxLength&&Array.from(value).length>f.maxLength)return error(f.label+' must fit in '+f.maxLength+' characters.');
        if(f.choices&&!f.choices.some(c=>(c.id??c)===value))return error('Choose an available option for '+f.label+'.');
        payload[f.key]=value;
      }
      if(view==='found'){
        const why=M.validateDraft(l,payload);
        if(why)return error(why);
        return {group:'found',id:'found',payload};
      }
      return {group:'movement',id:a.id,payload};
    }
    return {sheet,parent,command,form};
  }
  root.PocketFaithUI={create};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
