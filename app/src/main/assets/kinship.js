/* Family links use permanent person IDs, including after changing the playable generation. */
(function(root){
  'use strict';
  const M=typeof module!=='undefined'&&module.exports?require('./model.js').PocketModel:root.PocketModel;
  const Ec=typeof module!=='undefined'&&module.exports?require('./economy.js').PocketEconomy:root.PocketEconomy;
  const G=typeof module!=='undefined'&&module.exports?require('./geography.js').PocketGeography:root.PocketGeography;
  const node=typeof module!=='undefined'&&module.exports;
  function historyEconomy(){return node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;}
  function historyWorld(){return node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;}
  function period(l){const year=l.born+l.age;return !!l.sim?.timeline?.historicalRules&&(year<2000||year>=2050);}
  function adultTitle(l,p){
    return period(l)?historyEconomy().npcJob(l,M.hash(p.id),p.town||l.town).title:'Office assistant';
  }
  function annualSavings(l,p,age){
    if(age<18)return 0;
    if(!period(l))return 120+(p.generosity<50?450:180);
    const main=historyEconomy().npcJob(l,M.hash(p.id),p.town||l.town);
    return Math.round(main.annual*(p.generosity<50?.036:.018)*(age>=67?.45:1));
  }
  function moveTown(l,p,h){
    if(period(l)){const options=historyWorld().nearby(p.town,l.born+l.age);return options.length?options[h%options.length]:p.town;}
    const c=G.countries[G.cities[p.town].code].cities;return c[h%c.length].id;
  }
  function townLabel(l,town){return period(l)?historyWorld().place(town,l.born+l.age).city:G.cities[town].name;}
  const relatives=['Grandparent','Grandchild','Aunt','Uncle','Cousin','Niece','Nephew','Stepparent','Stepchild','Stepsibling','Parent-in-law','Sibling-in-law','Child-in-law','Relative'];
  const names=['Noor','Jonas','Elena','Yuki','Ana','Tomas','Mina','Alex','Pia','Owen','Ada','Jean','Sol','Idris','Rosa','Kiran','Inez','Luca','Rae','Nell','Remy','Lena','Isa','Felix'];
  function graph(l){return l.sim.expansion.family;}
  const append=(array,id)=>{if(id&&!array.includes(id))array.push(id);};
  function link(l,parent,child){
    const tree=graph(l);if(parent!==child&&tree[parent]&&tree[child])append(tree[child].parents,parent);
  }
  function marry(l,a,b){
    const tree=graph(l);if(a===b||!tree[a]||!tree[b])return;
    for(const id of [a,b]){const before=tree[id].spouse;if(before&&before!==a&&before!==b&&tree[before]?.spouse===id)delete tree[before].spouse;}
    tree[a].spouse=b;tree[b].spouse=a;
  }
  function snapshot(l,p){
    const tree=graph(l),node=tree[p.id]||(tree[p.id]={id:p.id,parents:[]});
    Object.assign(node,{name:p.fullName,born:p.bornYear,gender:p.gender,town:p.town||l.town});
    if(p.home)node.home=p.home;
    if(p.enterprise)node.business=p.enterprise.name;
    if(!M.isAlive(p)){node.died=l.born+p.diedAt;if(p.job)node.career=p.job;}
    return node;
  }
  function self(l){
    const n=snapshot(l,{id:l.id,fullName:l.name,bornYear:l.born,gender:l.sim.identity,town:l.town});
    if(l.ended)n.died=l.born+l.age;
    return n;
  }
  function add(l,token,role,born,gender){
    const id='kin-'+M.hash(l.id+'/'+token).toString(36),key=id;
    if(l.people[key])return l.people[key];
    const h=M.hash(id),name=names[h%names.length],surname=l.name.split(' ').slice(1).join(' ')||'Reed';
    const p=l.people[key]={id,role,name,fullName:name+' '+surname,gender:gender||['woman','man','nonbinary'][h%3],bornYear:born,
      bond:37+h%38,met:true,active:true,kinExtra:true,town:l.town,birthTown:l.town};
    if(l.born+l.age-born>100){p.diedAt=Math.min(l.age,born+80+(h%16)-l.born);p.active=false;}
    M.person(l,key,p);snapshot(l,p);return p;
  }
  function coparent(l,p){
    if(p.otherParentId)return Object.values(l.people).find(n=>n.id===p.otherParentId);
    if(!p.otherParent)return null;
    const matches=Object.values(l.people).filter(n=>n.id!==p.id&&n.name===p.otherParent);
    return matches.find(n=>['Partner','Spouse','Former spouse','Former partner','Engaged partner'].includes(n.role))||(matches.length===1?matches[0]:null);
  }
  function sync(l){
    const me=self(l),tree=graph(l),parents=[];
    for(const p of Object.values(l.people)){
      if(!p.met||!p.id||!(M.isFamily(p)||p.role==='Spouse'||['Former spouse','Engaged partner'].includes(p.role)))continue;
      snapshot(l,p);
      if(['Mother','Father','Parent'].includes(p.role)||(p.role==='Guardian'&&!me.parents.length))parents.push(p.id);
      if(p.role==='Child'){link(l,l.id,p.id);const other=coparent(l,p);if(other){snapshot(l,other);link(l,other.id,p.id);}}
      if(p.role==='Spouse')marry(l,l.id,p.id);
      if(p.role==='Former spouse'&&me.spouse===p.id){delete me.spouse;delete tree[p.id].spouse;}
    }
    for(const id of parents)link(l,id,l.id);
    for(const p of Object.values(l.people))if(p.role==='Sibling'&&tree[p.id])for(const id of me.parents)link(l,id,p.id);
    return tree;
  }
  function seed(l){
    const tree=sync(l),me=tree[l.id],parent=me.parents[0]||l.people.carer.id;
    const py=tree[parent]?.born||l.born-29;
    const grandma=add(l,'grandmother','Grandparent',py-26,'woman'),grandpa=add(l,'grandfather','Grandparent',py-29,'man');
    link(l,grandma.id,parent);link(l,grandpa.id,parent);marry(l,grandma.id,grandpa.id);
    const aunt=add(l,'aunt','Aunt',py+3,'woman'),uncle=add(l,'uncle','Uncle',py-2,'man'),cousin=add(l,'cousin','Cousin',Math.min(l.born+l.age,l.born-2));
    for(const p of [aunt,uncle]){link(l,grandma.id,p.id);link(l,grandpa.id,p.id);}
    link(l,aunt.id,cousin.id);
  }
  function partners(l,p){
    sync(l);if(p.role!=='Spouse')return;
    if(!M.isAlive(p))return;
    const y=p.bornYear,pp=add(l,p.id+'/inlaw','Parent-in-law',y-27),sib=add(l,p.id+'/sib','Sibling-in-law',Math.min(y+3,l.born+l.age));
    link(l,pp.id,p.id);link(l,pp.id,sib.id);
    if(M.ageOf(l,p)>=27&&M.hash(p.id)%3===0){
      const step=add(l,p.id+'/step','Stepchild',y+22);link(l,p.id,step.id);step.town=l.town;
    }
  }
  function remember(l,p,act,amount){
    if(!p||!p.id)return;
    if(!p.memories)p.memories=[];
    const trust={insult:-12,cutoff:-25,separate:-18,gift:5,money:7,marry:14,reconcile:18,loan:12,mentor:10,visit:2,talk:3,argue:-12,collaborate:6};
    p.trust=M.clamp((p.trust??p.bond)+(trust[act]||Math.sign(amount||0)*2));
    p.loyalty=M.clamp((p.loyalty??Math.round((p.bond+p.generosity)/2))+Math.sign(trust[act]||0)*3);
    if(['insult','argue','cutoff'].includes(act))p.rivalry=true;
    if(act==='reconcile')p.rivalry=false;
    const previous=p.memories[p.memories.length-1];
    if((act==='visit'||act==='talk')&&previous?.act===act&&l.age-previous.age<3)return;
    p.memories.push({age:l.age,act});if(p.memories.length>12)p.memories.splice(0,p.memories.length-12);
    const node=l.sim.expansion?.family[p.id];
    if(node&&['marry','separate','reconcile','cutoff','loan','mentor','reunion','vacation','moved-away'].includes(act)){
      if(!node.history)node.history=[];
      node.history.push({year:l.born+l.age,with:l.id,act});
      if(node.history.length>12)node.history.shift();
    }
  }
  function birthRole(p,h){return p.role==='Child'?'Grandchild':p.role==='Sibling'?(h%2?'Niece':'Nephew'):['Aunt','Uncle'].includes(p.role)?'Cousin':'Relative';}
  function buyHome(l,p,cost){
    const market=node?require('./market.js').PocketMarket:root.PocketMarket;
    const age=M.ageOf(l,p),resident={...l,id:p.id,born:l.born+l.age-age,age,town:p.town,ended:false};
    const lots=period(l)?historyEconomy().listings(resident).filter(q=>q.category==='Property'):market.inventory(resident,'keyline');
    if(!lots.length)return false;
    const lot=lots[0],price=Math.min(cost,lot.price);
    p.wealth-=price;p.home=p.town;p.homeEquity=price;p.homeDeed={id:lot.id,listing:{...(lot.listing||lot)},condition:lot.condition,share:price/lot.price,value:price,acquiredYear:l.born+l.age,town:p.town};
    return true;
  }
  function foundBusiness(l,p,cost){
    const y=l.born+l.age,H=historyEconomy(),kind=H.period(y);
    const type=period(l)?Object.keys(H.businesses).find(id=>id.startsWith('era-'+kind+'-')):'repair';
    if(!type)return false;
    const title=period(l)?H.businesses[type][0]:'Repair workshop';
    p.wealth-=cost;p.enterprise={name:p.name+' '+title.toLowerCase(),type,founder:p.fullName,founded:y,town:p.town,capital:cost,initial:cost};
    return true;
  }
  function distributeHousehold(l,p,tree,log){
    if((!p.home&&!p.enterprise)||p.estateSettled)return;
    const child=Object.values(l.people).filter(n=>M.isAlive(n)&&tree[n.id]?.parents.includes(p.id)).sort((a,b)=>a.bornYear-b.bornYear)[0];
    if(!child)return;
    if(p.home){
      if(!child.home){child.home=p.home;child.homeEquity=p.homeEquity||0;if(p.homeDeed)child.homeDeed=p.homeDeed;}
      else child.wealth+=(p.homeEquity||0);
      delete p.home;delete p.homeEquity;delete p.homeDeed;
    }
    if(p.enterprise){if(!child.enterprise)child.enterprise={...p.enterprise};else child.wealth+=p.enterprise.capital;delete p.enterprise;}
    p.estateSettled=true;
    log(l,'Family',child.name+' inherited family property',p.name+' left the household estate to '+child.name+'.');
  }
  function annual(l,log){
    const tree=sync(l),year=l.born+l.age;
    const contacts=Object.values(l.people);
    let living=contacts.filter(p=>M.isFamily(p)&&M.isAlive(p)).length;
    for(const p of contacts){
      if(p.diedAt===l.age)distributeHousehold(l,p,tree,log);
      if(p.enterprise&&M.isAlive(p)){
        const cycle=Ec.local(l,p.town||l.town).phase;
        const profit=Math.round(p.enterprise.capital*(cycle==='Recession'?-.09:.025));
        p.enterprise.capital=Math.max(0,p.enterprise.capital+Math.min(profit,Math.round(profit*.4)));
        p.wealth+=Math.max(0,profit-Math.round(profit*.4));
        if(p.enterprise.capital<Math.round(p.enterprise.initial*.3)){delete p.enterprise;log(l,'Family',p.name+' closed a business','The business had run out of working capital.');}
      }
      if(!p.met||!M.isAlive(p)||p.cutOff||(!M.isFamily(p)&&!['Friend','Childhood friend','Spouse','Partner','Coworker'].includes(p.role)))continue;
      if(!p.town)p.town=l.town;
      if(p.favor&&l.age>=p.favor.due&&p.wealth>=p.favor.amount&&l.age>=18){
        const amount=p.favor.amount;
        if((p.trust??p.bond)>=45){p.wealth-=amount;l.cash+=amount;delete p.favor;log(l,'Echo','Paid back by '+p.name,'The bank memo said “Now we are even.”',{cash:amount});}
      }
      const age=M.ageOf(l,p);if(age<19||age>82)continue;
      const h=M.hash(p.id+'/'+year+'/independent'),roll=Ec.sample(p.id,year);
      if(roll>.042)continue;
      const npcYear=Ec.local(l,p.town),stage=h%6;let line='';
      const historical=period(l),job=historical?historyEconomy().npcJob(l,h,p.town):null;
      const houseCost=historical?Math.max(300,Math.round(job.annual*.65)):4200;
      if(stage===0&&age<62){
        p.career=job?job.id:['organizer','nurse','clerk','accountant','mechanic'][h%5];p.job=job?job.title:['Events coordinator','Clinical nurse','Shop clerk','Accountant','Fleet mechanic'][h%5];
        p.wealth+=job?Math.round(job.annual*.028):800;line='started work as a '+p.job.toLowerCase();
      }
      else if(stage===1&&p.wealth>=houseCost&&!p.home){if(buyHome(l,p,houseCost))line='bought a share in a home in '+townLabel(l,p.town);}
      else if(stage===2&&p.role!=='Spouse'){const town=moveTown(l,p,h);if(town!==p.town){p.town=town;line='moved to '+townLabel(l,town);}}
      else if(stage===3&&age<60&&tree[p.id]&&(!tree[p.id].spouse||Number.isInteger(tree[tree[p.id].spouse]?.died))&&living<96){
        const role=p.role==='Child'?'Child-in-law':p.role==='Mother'||p.role==='Father'?'Stepparent':p.role==='Sibling'?'Sibling-in-law':'Relative';
        const partner=add(l,p.id+'/partner/'+year,role,year-Math.max(18,age+(h%7)-3));
        marry(l,p.id,partner.id);living++;line='married '+partner.name;
        if(role==='Stepparent'&&age>28){const step=add(l,partner.id+'/step','Stepsibling',Math.min(year,partner.bornYear+23));link(l,partner.id,step.id);}
      }else if(stage===4&&age<44&&['Child','Sibling','Aunt','Uncle'].includes(p.role)&&living<96){
        const child=add(l,p.id+'/baby/'+year,birthRole(p,h),year);
        living++;link(l,p.id,child.id);
        const spouse=tree[tree[p.id]?.spouse];
        if(spouse&&(!Number.isInteger(spouse.died)||spouse.died>=year))link(l,spouse.id,child.id);
        line='welcomed '+child.name;
      }else if(stage===5&&(h>>>4)%3===0&&!p.enterprise&&p.wealth>houseCost*2&&npcYear.phase!=='Recession'){
        if(foundBusiness(l,p,houseCost))line='opened '+p.enterprise.name;
      }else if(npcYear.phase==='Recession'||stage===5){const loss=Math.min(p.wealth,historical?Math.round(job.annual*(.06+(h%17)/100)):500+h%2800);p.wealth-=loss;p.moneyTrouble=year;line='fell behind on bills';}
      if(line){if(tree[p.id])snapshot(l,p);if(M.isFamily(p)||p.bond>=50)log(l,'Family',p.name+' '+line,p.name+' '+line+'.');}
    }
  }
  function relationship(tree,me,id){
    if(me===id)return 'You';const a=tree[me],b=tree[id];if(!a||!b)return 'Relative';
    const parents=n=>n.parents||[],childrenOf=(x,y)=>parents(tree[y]||{}).includes(x);
    const sib=(x,y)=>x!==y&&parents(tree[x]||{}).some(p=>parents(tree[y]||{}).includes(p));
    if(a.spouse===id)return 'Spouse';if(parents(a).includes(id))return 'Parent';if(parents(b).includes(me))return 'Child';if(sib(me,id))return 'Sibling';
    if(parents(a).some(p=>childrenOf(id,p)))return 'Grandparent';if(parents(b).some(p=>childrenOf(me,p)))return 'Grandchild';
    if(parents(a).some(p=>sib(p,id)))return b.gender==='man'?'Uncle':'Aunt';
    if(parents(b).some(p=>sib(p,me)))return b.gender==='man'?'Nephew':'Niece';
    if(parents(a).some(p=>parents(b).some(q=>sib(p,q))))return 'Cousin';
    if(parents(a).some(p=>tree[p]?.spouse===id))return 'Stepparent';
    if(a.spouse&&childrenOf(a.spouse,id))return 'Stepchild';
    if(a.spouse&&childrenOf(id,a.spouse))return 'Parent-in-law';
    if(a.spouse&&sib(a.spouse,id)||b.spouse&&sib(me,b.spouse))return 'Sibling-in-law';
    if(b.spouse&&childrenOf(me,b.spouse))return 'Child-in-law';
    if(parents(a).some(p=>parents(b).includes(tree[p]?.spouse)))return 'Stepsibling';
    return 'Relative';
  }
  function inherit(parent,child){
    const tree=sync(parent),x=child.sim.expansion;x.family=JSON.parse(JSON.stringify(tree));
    const known=new Map(Object.entries(child.people).filter(([,p])=>p.id).map(([k,p])=>[p.id,[k,p]]));
    for(const [key,p] of Object.entries(parent.people)){
      if(!tree[p.id]||p.id===child.id)continue;
      const role=relationship(tree,child.id,p.id),entry=known.get(p.id);
      if(!M.isAlive(p)&&!entry&&role==='Relative')continue;
      if(entry){const existing=entry[1];existing.memories=[];if(existing.role!=='Guardian')existing.role=role;continue;}
      const n={...p,role,bornYear:p.bornYear,active:M.isAlive(p)&&!p.cutOff,met:true,kinExtra:true,memories:[]};
      delete n.favor;delete n.rivalry;delete n.bornAt;delete n.atSchool;delete n.trust;delete n.loyalty;
      if(!M.isAlive(p))n.diedAt=parent.born+p.diedAt-child.born;
      if(role==='Child'){n.bornAt=p.bornYear-child.born;child.world.childCount++;}
      if(role==='Spouse')child.people.love=n;else child.people['tree-'+p.id]=n;
    }
    sync(child);
  }
  root.PocketKinship={adultTitle,annualSavings,relatives,sync,seed,partners,coparent,remember,annual,relationship,inherit};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
