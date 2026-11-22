/* Expansion screens read the simulation and return the existing sheet model. */
(function(root){
  'use strict';
  function create({E,row,detail,subhead,meter,esc,cash,button}){
    const X=E.expansion,G=E.sim.geography,Shop=E.world.shopping;
    const route=(area,ref='')=>'xp-'+area+(ref?'~'+ref:'');
    const link=(area,title,desc,icon,ref='')=>row('sheet',route(area,ref),title,desc,icon);
    const wrap=html=>'<div class="commands">'+html+'</div>';
    const placeName=(l,town)=>E.isHistorical(l)?E.historyWorld.place(town,E.calendar(l)).label:G.label(town);
    const rate=n=>(n*100).toFixed(1)+'%';
    const label=id=>G.countries[id]?.name||id;
    const titles={family:'Family tree',branch:'Family connections',relative:'Relationship history',career:'Professional life',business:'Businesses & freelance',company:'Business accounts',world:'Local economy',hobbies:'Hobbies & ambitions',portfolio:'Investments',asset:'Manage asset',offer:'Financing & trade-ins',bills:'Bills & maintenance',visa:'Immigration office',travel:'Household moving plans',estate:'Estate planning'};
    const verb={insult:'Insulted',argue:'Argued',cutoff:'Cut off contact',reconcile:'Made peace',gift:'Gave a gift',money:'Gave money',loan:'Lent money',marry:'Married',visit:'Spent time together',talk:'Talked',mentor:'Mentored',holiday:'Shared a holiday',reunion:'Attended a reunion',vacation:'Took a trip',separate:'Separated','moved-away':'Moved apart'};
    function summary(l){const x=X.state(l);return detail('Personality and talent',x.personality+' · '+x.talent)+detail('Starting circumstances',x.start)+detail('Personal ambition',x.ambition);}
    function economic(l,town){const e=X.economy.local(l,town);
      return detail(G.label(town),e.phase+' · unemployment '+rate(e.unemployment)+' · inflation '+rate(e.inflation))+
        '<dl class="ledger">'+[['Typical pay',e.pay],['Living costs',e.cost],['Property prices',e.home]].map(([s,v])=>'<div><dt>'+s+'</dt><dd>'+Math.round(v*100)+' index</dd></div>').join('')+'</dl>'+
        detail('Local conditions',e.project+' · '+(e.hiringName||e.sector)+' hiring · '+(e.decliningName||e.decline)+' slowing · lending rate '+rate(e.rate)+'. Indices use 100 as the reference level.');}
    function parent(key){
      if(!key?.startsWith('xp-'))return null;
      const [area,ref,arg]=key.slice(3).split('~');
      if(area==='confirm')return route(ref,arg);
      if(area==='branch')return route('family');if(area==='company')return route('business');if(area==='relative')return ref?'person-'+ref:route('family');
      if(area==='asset')return 'sell-'+ref;if(area==='offer')return 'buy-'+ref;
      if(area==='visa')return ref?'move-'+ref:'hub-travel';
      if(area==='travel')return 'hub-travel';if(area==='estate')return 'will';return null;
    }
    function sheet(l,key){
      const [area,ref='',arg='',last='']=key.slice(3).split('~'),x=X.state(l);
      if(area==='confirm'){
        const choice=X.actions(l,ref,arg).find(o=>o.id===last);if(!choice)return null;
        return {title:choice.title,body:detail('Review',choice.description)+wrap(button('xp-confirm',last,'Confirm','primary wide','check',choice.reason))};
      }
      if(!titles[area])return null;
      let title=titles[area],body='';
      if(area==='world')body=economic(l,l.town)+detail('Regional taxes','Local factor '+rate(X.economy.local(l).tax)+' of the game’s progressive income tax.')+detail('World news',l.log.filter(n=>n.kind==='World').slice(-3).map(n=>n.body).join(' ')||'The next annual survey arrives on your birthday.');
      if(area==='world'&&x.worldHistory?.length){
        body+=subhead('Recent market reports')+x.worldHistory.slice(-4).reverse().map(r=>detail(String(r.year)+' · '+G.cities[r.town].name,r.phase+' · '+r.unemployment+'% unemployment · '+r.industry+' hiring.')).join('');
      }
      if(area==='hobbies')body=summary(l)+row('sheet','path-challenges','Life challenges','Choose a goal and track its milestones.','flag')+detail('Achievements',x.awards.join(' · ')||'Your milestones will be recorded here.');
      if(area==='family'){
        const tree=x.family,keys=new Map(Object.entries(l.people).map(([k,p])=>[p.id,k]));
        const nodes=Object.values(tree).sort((a,b)=>a.born-b.born||a.name.localeCompare(b.name));
        body=detail('Generation '+l.sim.generation,nodes.length+' recorded family members.')+wrap(nodes.map(n=>{
          const parents=n.parents.map(id=>tree[id]?.name).filter(Boolean),spouse=tree[n.spouse]?.name;
          const p=keys.get(n.id),role=n.id===l.id?'You':p?l.people[p].role:X.kin.relationship(tree,l.id,n.id);
          const desc=[role,'born '+n.born,n.died?'died '+n.died:'',parents.length?'Child of '+parents.join(' and '):'',spouse?'Married to '+spouse:''].filter(Boolean).join(' · ');
          return p?row('sheet','person-'+p,n.name,desc,'people'):link('branch',n.name,desc,'family-tree',n.id);
        }).join(''))+(l.sim.prison?'':subhead('Family decisions'));
      }
      if(area==='branch'){
        const tree=x.family,n=tree[ref];if(!n)return null;title=n.name;
        const nodes=Object.values(tree),member=Object.entries(l.people).find(([,p])=>p.id===ref);
        body=detail(ref===l.id?'You':X.kin.relationship(tree,l.id,ref),'Born '+n.born+(n.died?' · Died '+n.died:'')+(G.cities[n.town]?' · '+placeName(l,n.town):''));
        if(member)body+=row('sheet','person-'+member[0],'Relationship profile','Open interactions and personal history.','people');
        const groups=[['Parents',n.parents.map(id=>tree[id]).filter(Boolean)],['Spouse',n.spouse&&tree[n.spouse]?[tree[n.spouse]]:[]],
          ['Children',nodes.filter(v=>v.parents.includes(ref))],['Siblings',nodes.filter(v=>v.id!==ref&&v.parents.some(id=>n.parents.includes(id)))]];
        for(const [group,people] of groups)if(people.length){
          body+=subhead(group)+wrap(people.map(p=>link('branch',p.name,'Born '+p.born+(p.died?' · Died '+p.died:''),'family-tree',p.id)).join(''));
        }
        if(n.history?.length)body+=subhead('Family memories')+n.history.slice().reverse().map(m=>detail(String(m.year),(verb[m.act]||m.act)+' · '+(tree[m.with]?.name||'Family'))).join('');
      }
      if(area==='relative'){
        const p=l.people[ref];if(!p)return null;title=p.fullName;
        body=(x.family[p.id]?link('branch','Family connections','Parents, siblings, children and shared family memories.','family-tree',p.id):'')+meter('Trust',p.trust??p.bond,'heart')+meter('Loyalty',p.loyalty??Math.round((p.bond+p.generosity)/2),'people')+
          detail('Circumstances',[p.role,p.job,G.cities[p.town]?placeName(l,p.town):'',p.home?'Homeowner in '+placeName(l,p.home):'',...Object.values(x.companies).filter(c=>c.managerId===p.id).map(c=>'Manages '+c.name),p.rivalry?'Unresolved rivalry':'',p.favor?'Owes '+cash(p.favor.amount):''].filter(Boolean).join(' · '))+
          detail('Remembered interactions',(p.memories||[]).slice(-5).reverse().map(m=>'Age '+m.age+' · '+(verb[m.act]||m.act)).join(' / ')||'No shared memories recorded yet.');
      }
      if(area==='career')body=detail('Experience',l.sim.workYears+' years worked · '+l.world.reputation+'% reputation · '+(x.discipline||0)+' written warnings')+detail('Certifications',x.certs.join(', ')||'None earned.')+(l.job?detail('Professional field',X.data.sector(l.job)):'');
      if(area==='business'){
        const results=X.businessYear(l).rows;
        body=detail('Your companies',cash(X.companyValue(l))+' in company equity.')+wrap(Object.values(x.companies).map(c=>c.historical?row('sheet','hist-business',c.name,placeName(l,c.town)+' · family enterprise','shop'):link('company',c.name,G.label(c.town)+' · forecast payout '+cash(results.find(r=>r.id===c.id)?.payout||0),'shop',c.id)).join(''))+subhead('Start working for yourself');
      }
      if(area==='company'){
        const c=x.companies[ref];if(!c)return null;title=c.name;const r=X.businessYear(l).rows.find(row=>row.id===ref);
        body=detail(G.label(c.town),'Level '+c.level+' · '+c.staff+' employees · '+c.clients+' regular clients · '+(c.managerId?'Managed by '+(Object.values(l.people).find(p=>p.id===c.managerId)?.name||'family'):c.manager?'Manager employed':'Owner managed'))+detail('Your ownership',Math.round((c.share??1)*100)+'% · equity '+cash(c.capital))+
          detail('Annual forecast','Revenue '+cash(r.revenue)+' · operating costs '+cash(r.operating)+' · retained '+cash(r.retained)+' · payout '+cash(r.payout))+ (c.last?detail('Last statement · '+c.last.year,'Distributed '+cash(c.last.payout)+'.'):'');
      }
      if(area==='bills'){const b=E.sim.budget(l);body=detail('Payment settings',(x.policies.autopay?'Automatic':'Manual')+' loan payments · credit score '+X.credit(l)+'/100')+detail('Recurring expenses','Insurance '+cash(b.insurance||0)+' · property managers '+cash(b.management||0)+' · lifestyle '+cash(b.lifestyle||0))+detail('Annual forecast','Gross income '+cash(b.gross)+' · net cash flow '+cash(b.net));}
      if(area==='portfolio')body=detail('Invested capital','Income fund '+cash(l.sim.fund)+' · market holdings '+cash(X.portfolio(l)))+detail('Available cash',cash(l.cash));
      if(area==='asset'||area==='offer'){
        const a=l.world.owned[ref],item=area==='asset'?Shop.ownedItem(ref,a):Shop.offer(l,ref);if(!item)return null;title=Shop.title(item);
        body=detail(area==='offer'?'Asking price':'Your holding',area==='offer'?cash(item.price):cash(a.value)+' · '+a.condition+'% condition');
        if(a){if(item.category==='Property')body+=detail('Lease',a.tenant?'Tenant '+a.tenant.name+' since '+a.tenant.since:a.vacant?'Vacant':'Original rental arrangement')+detail('Management',(a.manager?'Managed':'Self-managed')+' · '+(a.renovations||0)+' renovations');
          else body+=detail('Vehicle',(a.paint||item.color||'Factory finish')+' · '+(a.insured?'Insured':'Uninsured')+(a.tuned?' · Upgraded suspension':''));}
      }
      if(area==='estate')body=detail('Instructions',x.double&&l.sim.will==='equal'?'Double share for '+(l.people[x.double]?.name||'beneficiary'):l.sim.will==='equal'?'Equal shares among surviving children':'Primary beneficiary '+(l.people[l.sim.will]?.name||''))+detail('Witnesses',x.witness===l.sim.will?'Signed instructions on file.':'Unequal unwitnessed shares can be disputed.')+detail('Business succession','Company shares pass under the same instructions as your other assets.');
      if(area==='travel')body=detail('Next move',x.policies.moveFamily===false?'You are moving alone. Your household will keep its own address.':'Your partner and dependent children will move with you.');
      if(area==='visa'){
        if(!G.cities[ref])return null;
        const p=X.economy.papers(l,ref);
        body=economic(l,ref)+detail('Status',p.citizen?'Citizen':p.permanent?'Permanent resident':p.valid?p.permit.kind+' through '+p.permit.until:'No current permit')+
          detail('Citizenships',x.passports.map(label).join(', '))+detail('Settlement route',p.eligible?'Eligible for settlement clearance with the moving fee.':p.reason)+detail('Requirements','Game immigration rules use work, qualifications, savings, residence and recent convictions.');
      }
      const choices=l.sim.prison&&['family','relative'].includes(area)?[]:X.actions(l,area,ref);
      body+=wrap(choices.map(o=>{
        const confirm=o.id==='sell'||o.id.startsWith('trade-')||o.id==='finance'||o.id.startsWith('open-');
        return row(confirm?'sheet':'xp-run',confirm?route('confirm',area+'~'+ref+'~'+o.id):o.id,o.title,o.description,o.icon,o.reason);
      }).join(''));
      return {title,tag:area==='family'?'Generation '+l.sim.generation:undefined,body};
    }
    return {sheet,parent,link,summary,economic,route};
  }
  root.PocketExpansionUI={create};
})(window);
