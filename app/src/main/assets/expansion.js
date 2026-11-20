/* Commands, quotes and birthday effects for the expanded life simulation. No rendering or storage. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const H=typeof module!=='undefined'&&module.exports?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  const M=node?require('./model.js').PocketModel:root.PocketModel;
  const Ec=node?require('./economy.js').PocketEconomy:root.PocketEconomy;
  const D=node?require('./expansion-data.js').PocketExpansionData:root.PocketExpansionData;
  const Kin=node?require('./kinship.js').PocketKinship:root.PocketKinship;
  const G=node?require('./geography.js').PocketGeography:root.PocketGeography;
  const money=M.cash,pct=n=>Math.round(n*100)+'%';
  const talents=['Numbers','Music','People','Endurance','Craft','Curiosity'];
  const characters=['Patient','Outgoing','Methodical','Adventurous','Ambitious','Practical'];
  const ambitions=['Build a family business','Master a hobby','Reach the boardroom','Build a property portfolio','Put down roots abroad','Keep a promise'];
  const historicalAmbitions=ambitions.filter((_,i)=>![2,4].includes(i));
  function birthAmbition(l){
    const pool=H.historical(l)?historicalAmbitions:ambitions;
    return pool[M.hash(l.id+'/ambition')%pool.length];
  }
  function reconcileBirthAmbition(l){
    const x=l.sim.expansion;
    if(x&&H.historical(l)&&!historicalAmbitions.includes(x.ambition))x.ambition=birthAmbition(l);
  }
  const starts=['A tight household budget','A comfortable household','A family of craftspeople','A home full of books','A big extended family','A household that moves often'];
  const funds={industry:['Industrial shares','Industry'],care:['Healthcare shares','Care'],tech:['Technology shares','Technology'],bonds:['Municipal bond fund','Services']};
  function fresh(l){
    const choose=(items,key)=>items[M.hash(l.id+'/'+key)%items.length],birth=Ec.keyOf(l,l.sim.birthplace||l.town);
    return {seed:l.id,personality:choose(characters,'personality'),talent:choose(talents,'talent'),ambition:birthAmbition(l),start:choose(starts,'start'),
      passports:[birth],permits:{},since:l.born+l.age,companies:{},sequence:0,portfolio:{},family:{},hobbies:{},certs:[],awards:[],policies:{autopay:true,lifestyle:'Simple'},discipline:0};
  }
  function state(l){return l.sim.expansion||fresh(l);}
  function activate(l,newborn=false){
    if(l.sim.expansion)return l.sim.expansion;
    const x=l.sim.expansion=fresh(l);
    const home=Ec.keyOf(l);
    const crossing=(l.sim.residences||[]).slice().reverse().find(m=>G.international(m.from,m.to));
    x.since=crossing?l.born+crossing.age:home===x.passports[0]?l.born:l.born+l.age;
    if(home!==x.passports[0])x.permits[home]={kind:'Resident',since:x.since};
    for(const p of Object.values(l.people))if(p.met&&!p.town)p.town=l.town;
    Kin.seed(l);
    if(newborn){
      const p=l.people.carer;if(x.start==='A tight household budget')p.wealth=Math.round(p.wealth*.40);
      if(x.start==='A comfortable household')p.wealth=Math.round(p.wealth*1.75);
      if(x.start==='A home full of books')l.stats.smarts=M.clamp(l.stats.smarts+5);
      if(x.start==='A family of craftspeople')l.hidden.discipline=M.clamp(l.hidden.discipline+5);
      if(x.start==='A big extended family')p.bond=M.clamp(p.bond+8);
      if(x.start==='A household that moves often')l.hidden.willpower=M.clamp(l.hidden.willpower+5);
    }
    return x;
  }
  function shares(l,id,age=l.age){
    const e=Ec.local(l,'cedar',age),seed=state(l).seed,y=l.born+age;
    const swing=Math.sin(y*.83+Ec.sample(seed,id)*12),trend=Math.pow(1.018,Math.min(110,Math.max(-15,y-2005)));
    return Math.max(12,Math.round((id==='bonds'?80+4*swing:95+27*swing+18*e.cycle+(e.sector===funds[id][1]?8:0))*trend));
  }
  function portfolio(l){const x=l.sim.expansion;if(!x)return 0;return Object.entries(x.portfolio).reduce((n,[k,qty])=>n+shares(l,k)*qty,0);}
  function companyValue(l){return Object.values(l.sim.expansion?.companies||{}).reduce((n,c)=>n+c.capital,0);}
  function businessYear(l,age=l.age){
    const rows=[],e=Ec.local(l,l.town,age),x=l.sim.expansion;
    if(x)for(const c of Object.values(x.companies)){
      if(H.businesses[c.type]){rows.push(H.companyQuote(l,c,age));continue;}
      const cfg=D.businesses[c.type],local=Ec.local(l,c.town,age),share=c.share??1;
      const demand=.72+local.cycle*.68+(cfg[1]===local.sector?.24:cfg[1]===local.decline?-.21:0)+(c.clients||0)*.09;
      const revenue=Math.max(0,Math.round(cfg[3]*c.level*share*local.pay*demand));
      const managerPay=c.manager?Math.round(cfg[3]*c.level*share*.14*local.cost):0;
      const operating=Math.round(cfg[3]*c.level*share*.49*local.cost+(c.staff||0)*350*share)+managerPay;
      const net=revenue-operating,retained=net>0?Math.floor(net*.18):Math.max(-c.capital,net);
      rows.push({id:c.id,revenue,operating,managerPay,retained,payout:net-retained,net});
    }
    return {rows,income:rows.reduce((n,r)=>n+Math.max(0,r.payout),0),loss:rows.reduce((n,r)=>n+Math.max(0,-r.payout),0),phase:e.phase};
  }
  function expenses(l,age=l.age){
    const x=l.sim.expansion;if(!x||age<18)return {insurance:0,management:0,lifestyle:0};
    let insurance=0,management=0;
    for(const a of Object.values(l.world.owned)){
      if(a.insured)insurance+=Math.max(90,Math.round(a.value*.022));
      if(a.manager)management+=Math.max(65,Math.round((a.listing?.rent||900)*(a.share||1)*.10));
    }
    const lifestyle=Math.round(({Simple:0,Comfortable:850,Luxury:7200}[x.policies.lifestyle]||0)*Ec.local(l,l.town,age).cost);
    return {insurance,management,lifestyle};
  }
  function credit(l){const overdue=l.sim.loans.living?.balance||0;return Math.max(0,Math.min(100,72+(l.sim.workYears||0)-Math.round(overdue/200)-(l.sim.expansion?.missed||0)*4));}
  function earned(l,x){
    const current=Object.values(x.hobbies);
    return [Object.keys(x.companies).length>0&&(l.sim.generation>1||l.sim.lifeTags.includes('family-firm')),current.some(n=>n>=80),l.job==='executive',Object.values(l.world.owned).filter(a=>a.listing?.category==='Property'||a.listing?.beds!==undefined).length>=3,x.passports.length>=2,l.sim.lifeTags.includes('kept-promise')];
  }
  function create({world:W,sim:S,jobs,log,apply,actionReason,blocking}){
    const shop=W.shopping,working=l=>l.age>=18&&l.job&&!['retired','student'].includes(l.job);
    function actions(l,area,ref=''){
      const x=state(l),e=Ec.local(l),list=[],year=l.born+l.age;
      const historical=H.historical(l),money=amount=>H.enabled(l)?H.money(l,amount):M.cash(amount);
      if(historical&&['business','company','portfolio','asset','career','shop','visa'].includes(area))return list;
      if(area==='asset'&&l.world.owned[ref]?.listing?.historical)return list;
      function option(id,title,description,icon,rule,cost,run,once=true){
        const key='expand/'+area+'/'+ref+'/'+id;
        const why=rule||(l.ended?'Life complete':blocking(l)?'Finish the current decision':l.sim.prison?'In custody':once&&l.used.includes(key)?'Done this year':cost>l.cash?'Need '+money(cost):'');
        list.push({id,title,description,icon,reason:why,cost:cost||0,key,once,run});
      }
      if(area==='hobbies'&&l.age>=5){
        for(const [id,[label,stat,icon]] of Object.entries(D.hobbies)){
          const level=x.hobbies[id]||0;
          const practice=historical?({gardening:'Tend a garden',music:'Practice music',chess:'Play a counting game',running:'Run the paths',ceramics:'Shape pottery',astronomy:'Study the night sky'})[id]:label;
          option(id,practice,'Skill '+level+'/100 · practice once this year.',icon,level>=100?'Mastered':'',0,()=>{
            const aligned={music:'Music',chess:'Numbers',running:'Endurance',ceramics:'Craft',astronomy:'Curiosity',gardening:'People'}[id]===x.talent;
            x.hobbies[id]=Math.min(100,level+(aligned?14:8)+(x.personality==='Patient'?2:0));apply(l,{[stat]:3,discipline:1});
            return historical?practice+'. My skill reached '+x.hobbies[id]+'/100.':'I practiced '+label.toLowerCase()+'. My skill is now '+x.hobbies[id]+'/100.';
          });
        }
        if(l.age>=12)for(const [i,goal] of ambitions.entries()){
          if(historical&&!historicalAmbitions.includes(goal))continue;
          option('goal-'+i,'Set goal · '+goal,'Meeting your personal ambition gives an extra happiness boost.','flag',
            goal===x.ambition?'Current ambition':x.awards.includes(goal)?'Already achieved':l.used.includes('new-ambition')?'One new ambition per birthday':'',0,()=>{
              x.ambition=goal;l.used.push('new-ambition');return 'I wrote down a new ambition: '+goal.toLowerCase()+'.';
            });
        }
        if(!historical&&l.age>=18)for(const lifestyle of ['Simple','Comfortable','Luxury'])option('life'+lifestyle,lifestyle+' lifestyle',lifestyle==='Simple'?'End the recurring lifestyle bill.':'Annual bill '+money(Math.round((lifestyle==='Luxury'?7200:850)*e.cost))+'.','home',x.policies.lifestyle===lifestyle?'Current lifestyle':'',0,()=>{x.policies.lifestyle=lifestyle;return 'I switched to a '+lifestyle.toLowerCase()+' lifestyle.';},false);
      }
      if(area==='travel'&&l.age>=18){
        const together=x.policies.moveFamily!==false;
        option('household',together?'Move on your own next time':'Bring your household on the next move',
          together?'Your partner and dependent children currently move with you.':'Your partner and dependent children currently keep their address.','people','',0,()=>{
            x.policies.moveFamily=!together;return together?'I set my next move to a solo move.':'I included my household in future moves.';
          },false);
      }
      if(area==='family'){
        for(const [id,label,cost] of [['holiday','Host a holiday dinner',60],['reunion','Organize a family reunion',240],['vacation','Take a family vacation',950]]){
          const relatives=Object.values(l.people).filter(p=>p.met&&p.active&&M.isFamily(p));
          option(id,label,'Invite '+relatives.length+' relatives · '+money(cost),id==='vacation'?'map':'people',l.age<18?'Opens at 18':relatives.length?'':'No relatives available',cost,()=>{
            for(const p of relatives){p.bond=M.clamp(p.bond+(id==='holiday'?3:6));Kin.remember(l,p,id,4);}
            apply(l,{joy:id==='vacation'?8:4});M.tag(l,'hosted-family');return relatives.length+' relatives came. Someone took the good serving dish.';
          });
        }
        if(x.dispute)for(const [id,title] of [['mediate','Settle the inheritance dispute'],['defend','Defend the will']]){
          option(id,title,'Contested distribution '+money(x.dispute.amount)+(id==='mediate'?'. A settlement releases 55%.':'. A successful challenge releases 85%. A loss releases nothing.'),'letter',l.age<18?'Opens at 18':'',0,()=>{
            const d=x.dispute,win=id==='defend'&&Ec.sample(x.seed,l.id+'/probate')>.43;
            const payout=id==='mediate'?Math.floor(d.amount*.55):win?Math.floor(d.amount*.85):0;
            l.cash+=payout;delete x.dispute;M.tag(l,id==='mediate'?'estate-mediated':'estate-contested');apply(l,{bonds:id==='mediate'?5:-5});
            return 'Probate closed. My share of the contested money was '+money(payout)+'.';
          });
        }
      }
      if(area==='relative'){
        const p=l.people[ref];if(!p||!p.met||!M.isAlive(p))return list;
        const age=M.ageOf(l,p);
        option('reconcile','Clear the air','Restore contact and work on trust.','heart',!p.rivalry&&!p.cutOff&&p.bond>=40?'No falling-out to resolve':'',0,()=>{
          p.cutOff=false;p.active=true;p.bond=M.clamp(p.bond+13);Kin.remember(l,p,'reconcile',13);return historical?'We talked it through in person. Neither of us left early.':p.name+' picked up. We both stayed on the call.';
        });
        if(p.active){
          option('argue','Call out a disagreement','Risk a lasting rivalry.','bolt',l.age<8?'Opens at 8':'',0,()=>{p.bond=M.clamp(p.bond-9);Kin.remember(l,p,'argue',-9);return H.enabled(l)&&year<2009?p.name+' remembers exactly what I said.':p.name+' still has the screenshots.';});
          option('loan','Lend '+money(600),'They can repay you in a later year if they trust you.','wallet',l.age<18||age<18?'Both must be adults':p.favor?'An earlier loan is outstanding':'',600,()=>{
            p.wealth+=600;p.favor={amount:600,due:l.age+2+M.hash(p.id)%4};p.bond=M.clamp(p.bond+6);Kin.remember(l,p,'loan',6);M.tag(l,'kept-promise');return 'I lent '+p.name+' '+money(600)+(H.enabled(l)&&year<2009?'. We agreed on a date.':'. They put the due date in their phone.');
          });
          if(p.role==='Child'||p.role==='Stepchild')option('mentor','Help with a long-term goal','Improve trust and their prospects.','book',age<4?'From age 4':'',0,()=>{
            p.bond=M.clamp(p.bond+8);p.mentoring=(p.mentoring||0)+1;Kin.remember(l,p,'mentor',8);if(age>=18&&p.mentoring>=2){p.job=historical?H.npcJob(l,M.hash(p.id),p.town):'Team supervisor';p.wealth+=400;}return p.name+' picked a goal. We wrote down a first step.';
          });
          if(p.role==='Partner'||p.role==='Spouse')option('plans','Plan your future together','Build loyalty and discuss the household budget.','rings','',0,()=>{p.bond=M.clamp(p.bond+6);Kin.remember(l,p,'talk',6);apply(l,{joy:3});return 'We agreed on a budget. The spreadsheet got its own anniversary.';});
        }
      }
      if(area==='career'&&working(l)){
        const sector=D.sector(l.job),cfg=D.sectors[sector],cert=x.certs.includes(sector),job=jobs[l.job][0];
        option('assignment',D.professions[l.job]?.[6]||D.assignments[l.job]||cfg[1],cfg[0]+' · improve experience and performance.',cfg[5],'',0,()=>{
          let outcome='';
          if(l.job==='executive'||l.job==='director'){
            const firm=Object.values(x.companies)[0];if(firm){firm.clients=Math.min(8,firm.clients+1);outcome=' My firm won a new client.';}else{l.extraPay+=360;outcome=' The board added to my compensation.';}
          }else if(sector==='Care'){const condition=l.sim.illnesses[0];if(condition){condition.treated=true;outcome=' I used the staff clinic afterward.';}else{apply(l,{health:3});outcome=' The team adopted my handover checklist.';} }
          else if(sector==='Industry'){const equipment=Object.entries(l.world.owned).find(([id,a])=>shop.ownedItem(id,a).category==='Vehicle'&&a.condition<100);if(equipment){equipment[1].condition=Math.min(100,equipment[1].condition+8);outcome=' I put the same repair into practice on my own vehicle.';}else{l.cash+=85;outcome=' I also earned an inspection fee.';}}
          else if(sector==='Creative'){x.royalties=(x.royalties||0)+60;outcome=' My work now produces another $60 a year in royalties.';}
          else if(sector==='Technology'){x.certs.includes(sector)?l.extraPay+=180:apply(l,{smarts:4});outcome=' The release became a reference project.';M.tag(l,'reference-release');}
          else if(sector==='Commerce'){x.missed=Math.max(0,(x.missed||0)-1);l.cash+=110;outcome=' I collected a $110 project fee and reviewed my own accounts.';}
          else{const junior=Object.values(l.people).find(p=>p.met&&p.active&&['Child','Coworker'].includes(p.role));if(junior){junior.bond=M.clamp(junior.bond+4);Kin.remember(l,junior,'mentor',4);}apply(l,{bonds:3});outcome=' I helped someone else learn the job.';}
          W.metrics(l,{performance:cert?13:9,reputation:2});x.practice=(x.practice||0)+1;apply(l,{smarts:2,discipline:2});return 'I completed the assignment as '+job.toLowerCase()+'.'+outcome;
        });
        option('ethics',cfg[2],'Build trust with your team.','people','',0,()=>{
          for(const p of Object.values(l.people).filter(p=>p.active&&['Boss','Coworker'].includes(p.role))){p.bond=M.clamp(p.bond+6);Kin.remember(l,p,'collaborate',6);}
          W.metrics(l,{performance:4,reputation:5});M.tag(l,'team-advocate');return 'I put the decision in writing and copied the team.';
        });
        option('rush',cfg[3],'A performance gamble with a disciplinary risk.','flag','',0,()=>{
          const success=Ec.sample(l.id,l.age+'/rush')<(l.world.performance+(cert?25:0))/100;
          W.metrics(l,{performance:success?14:-15,reputation:success?4:-4});if(!success)x.discipline++;
          return success?'We delivered ahead of schedule. The deadline moved closer next time.':'The rush job came back. My supervisor issued a written warning.';
        });
        option('cert','Earn '+cfg[4]+' certification',cfg[4]+' · study and examination fee '+money(450)+'.','school',cert?'Already certified':l.stats.smarts<40?'Needs 40% smarts':'',450,()=>{
          x.certs.push(sector);W.metrics(l,{reputation:5});apply(l,{smarts:3});M.tag(l,'certified');return 'I earned my '+cfg[4].toLowerCase()+' certificate.';});
        option('negotiate','Negotiate a salary agreement','Performance, experience and local hiring affect the offer.','wallet','',0,()=>{
          const score=l.world.performance+(cert?15:0)+(l.sim.workYears||0)+l.world.reputation*.15-e.unemployment*110;
          if(score<61){W.metrics(l,{performance:1});return 'They filed the request. The figure on my payslip stayed the same.';}
          const n=Math.round(jobs[l.job][1]*.07);l.extraPay+=n;return 'My new local annual pay is '+money(Ec.salary(l,l.job,jobs))+'.';});
        option('employer','Interview with a competing employer','Stay in your profession and meet a new team.','bag',l.world.performance<58?'Needs 58% performance':'',0,()=>{
          const names=['Union','Harbor','Northgate','Central','Civic'];const firm=names[(names.indexOf((x.employer||'').split(' ')[0])+1)%names.length]+' '+sector;
          W.transferEmployer(l,firm);l.extraPay+=Math.round(jobs[l.job][1]*.035);
          return 'I accepted a position at '+x.employer+'. The commute has opinions.';
        });
      }
      if(area==='business'&&l.age>=18){
        for(const [id,[name,sector,cost]] of Object.entries(D.businesses)){
          option('open-'+id,'Start a '+name.toLowerCase(),sector+' · invest '+money(cost)+' in company capital.','shop',Object.keys(x.companies).length>=8?'Eight businesses already open':'',cost,()=>{
            const key='firm-'+(++x.sequence),c={id:key,type:id,name:l.name.split(' ')[0]+' '+name,town:l.town,capital:cost,level:1,staff:0,clients:0,manager:false,share:1};
            x.companies[key]=c;M.tag(l,'business-owner');return 'I opened '+c.name+'. Its first customer wanted a discount.';
          });
        }
        option('freelance','Take a freelance contract','A local client pays for a completed assignment.','pencil','',0,()=>{
          const fee=Math.round((260+l.stats.smarts*6+(x.practice||0)*30)*e.pay);l.cash+=fee;x.practice=(x.practice||0)+1;W.metrics(l,{reputation:2});return 'The client signed off. I received '+money(fee)+'.';});
      }
      if(area==='company'){
        const c=x.companies[ref];if(!c)return list;
        option('clients','Pitch to a new client','Increase future revenue.','chat',c.clients>=8?'Client book full':'',0,()=>{c.clients++;return 'A new client signed a contract.';});
        const cost=Math.ceil((D.businesses[c.type]||H.businesses[c.type])[2]*.4*(c.share??1));
        option('expand','Expand the business','Invest '+money(cost)+' and hire a team member.','shop',c.level>=6?'At capacity':'',cost,()=>{c.capital+=cost;c.level++;c.staff++;return 'We added a team member and expanded capacity.';});
        option('manager',c.manager?'Manage it yourself':'Hire a business manager','Manager pay is included in operating expenses. Managers develop clients.','bag','',0,()=>{delete c.managerId;c.manager=!c.manager;return c.manager?'I hired a manager. They took the office keys.':'I took over day-to-day management.';},false);
        for(const [key,p] of Object.entries(l.people)){
          if(!p.met||!p.active||!M.isAlive(p)||!(M.isFamily(p)||p.role==='Spouse')||M.ageOf(l,p)<18||M.ageOf(l,p)>80)continue;
          option('hire-'+key,'Offer management to '+p.name,'Appoint a relative. Their wages appear in company expenses.','people',
            c.managerId===p.id?'Already manages this firm':(p.trust??p.bond)<42?'Needs more trust':Object.values(x.companies).some(f=>f.managerId===p.id)?'Already manages another firm':'',0,()=>{
              c.manager=true;c.managerId=p.id;Kin.remember(l,p,'collaborate',6);M.tag(l,'family-firm');
              return p.name+' agreed to manage '+c.name+'. Payroll starts next birthday.';
            },false);
        }
        option('sell','Sell your business' ,'Sell your stake for '+money(c.capital)+'.','tag','',0,()=>{l.cash+=c.capital;delete x.companies[ref];return 'I sold my stake for '+money(c.capital)+'.';});
      }
      if(area==='portfolio'&&l.age>=18)for(const [id,[label]] of Object.entries(funds)){
        const price=shares(l,id),qty=x.portfolio[id]||0;
        option('buy-'+id,'Buy 10 units · '+label,'Unit price '+money(price)+' · holding '+qty+'.','trend','',price*10,()=>{x.portfolio[id]=qty+10;return 'I bought ten units of '+label.toLowerCase()+'.';},false);
        option('sell-'+id,'Sell 10 units · '+label,'Sale proceeds '+money(price*10)+'.','tag',qty<10?'Need ten units':'',0,()=>{x.portfolio[id]=qty-10;l.cash+=price*10;return 'I sold ten units for '+money(price*10)+'.';},false);
      }
      if(area==='bills'&&l.age>=18){
        option('auto',x.policies.autopay?'Switch loans to manual payments':'Enable automatic loan payments','Living costs are billed each year. Unpaid loans accrue interest.','wallet','',0,()=>{x.policies.autopay=!x.policies.autopay;return x.policies.autopay?'I set up automatic loan payments.':'I switched my loans to manual payments.';},false);
        for(const [id,loan] of Object.entries(l.sim.loans)){
          const n=Math.min(loan.balance,Math.max(loan.principal,250),l.cash);
          option('pay-'+id,'Pay '+money(n)+' toward debt',shop.ownedItem(id,l.world.owned[id])?.name||id,'coin',n<=0?'No cash available':'',n,()=>{
            loan.paidYear=year;loan.balance-=n;if(!loan.balance)delete l.sim.loans[id];return 'The lender credited '+money(n)+' to my account.';
          },false);
        }
        for(const [kind,targets] of [
          ['property',Object.entries(l.world.owned).filter(([id,a])=>shop.ownedItem(id,a).category==='Property').map(([,a])=>a)],
          ['business',Object.values(x.companies)]
        ]){
          if(targets.length<2)continue;
          const toHire=targets.filter(a=>!a.manager),toRelease=targets.filter(a=>a.manager);
          option('manage-'+kind,kind==='property'?'Hire managers for all properties':'Hire managers for all businesses',
            toHire.length+' appointments. Each manager collects the usual annual fee.','bag',toHire.length?'':'All already managed',0,()=>{
              for(const a of toHire)a.manager=true;
              return 'I hired '+toHire.length+' managers. Their pay will appear on the next statement.';
            },false);
          option('release-'+kind,kind==='property'?'Manage all properties yourself':'Manage all businesses yourself',
            'Take over '+toRelease.length+' management contracts.','pencil',toRelease.length?'':'All already self-managed',0,()=>{
              for(const a of toRelease){a.manager=false;delete a.managerId;}
              return 'I ended '+toRelease.length+' management contracts and took over the accounts.';
            },false);
        }
        for(const category of ['Vehicle','Property']){
          const items=Object.entries(l.world.owned).filter(([id,a])=>shop.ownedItem(id,a).category===category&&a.condition<100&&!W.repairReason(l,id).includes('Done'));
          const cost=items.reduce((n,[id])=>n+W.repairQuote(l,id),0);
          option('bulk-'+category,category==='Vehicle'?'Service all vehicles':'Repair all properties',items.length+' items · '+money(cost),'tools',items.length?'':'All in good condition',cost,()=>{
            for(const [id,a] of items){const price=W.repairQuote(l,id);a.condition=100;a.value+=Math.floor(price*.45);l.used.push('repair-'+id);}
            return 'I booked '+items.length+' repairs on one invoice.';
          },false);
        }
      }
      if(area==='asset'){
        const a=l.world.owned[ref];if(!a||l.age<18)return list;
        const item=shop.ownedItem(ref,a),loan=l.sim.loans[ref];
        if(item.category==='Vehicle'){
          for(const [key,color] of [['blue','midnight blue'],['red','racing red'],['silver','brushed silver']])option('paint-'+key,'Respray '+color,'Custom paint · $320.','palette',a.paint===color?'Current finish':'',320,()=>{a.paint=color;return 'My vehicle came back in '+color+'.';},false);
          option('tune','Upgrade the suspension','Improve condition and resale value · $950.','tools',a.tuned?'Already upgraded':'',950,()=>{a.tuned=true;a.value+=Math.round(540*(a.share||1));a.condition=Math.min(100,a.condition+7);return 'I upgraded the suspension. The pothole is still there.';});
          option('cover',a.insured?'Cancel vehicle insurance':'Insure this vehicle','Annual premium '+money(Math.max(90,Math.round(a.value*.022)))+'. Covers most collision damage.','key','',0,()=>{a.insured=!a.insured;return a.insured?'The insurer issued my policy.':'I cancelled the policy.';},false);
        }
        if(item.category==='Property'){
          const cost=Math.max(500,Math.round(a.value*.035));
          option('renovate','Renovate the property','Budget '+money(cost)+' · increases condition, value and rent.','home',(a.renovations||0)>=4?'Fully renovated':'',cost,()=>{a.renovations=(a.renovations||0)+1;a.value+=Math.round(cost*.82);a.condition=Math.min(100,a.condition+19);return 'The renovation passed inspection. There was one spare screw.';});
          option('tenant',a.tenant?'End the current lease':'Screen and sign a tenant',a.tenant?'The unit stays vacant until relet.':'A full lease brings higher rent and turnover risk.','people','',0,()=>{
            if(a.tenant){a.tenant=null;a.vacant=true;return 'The tenant returned the keys.';}a.tenant={name:['Lee','Rivera','Okafor','Chen','Singh'][M.hash(ref+year)%5],since:year};a.vacant=false;return 'I signed a lease with '+a.tenant.name+'.';},false);
          option('manager',a.manager?'Manage property yourself':'Hire a property manager','Management costs 10% of base rent. Vacancies are filled automatically.','bag','',0,()=>{a.manager=!a.manager;return a.manager?'The property manager took the spare keys.':'I took the spare keys back.';},false);
          if(loan){const propertyRate=Ec.local(l,item.town||l.town).rate;option('refi','Refinance the mortgage','15 years at '+pct(propertyRate)+' · $250 closing costs.','wallet',credit(l)<45?'Credit needs to recover':'',250,()=>{
            loan.rate=propertyRate;loan.principal=Math.max(1,Math.ceil(loan.balance/15));return 'I replaced the mortgage terms. The balance carried over.';});}
        }
      }
      if(area==='offer'){
        const item=shop.offer(l,ref);if(!item||item.category!=='Vehicle'||l.age<18)return list;
        const down=Math.ceil(item.price*.2),rate=e.rate+.018,annualPayment=(item.price-down)*(.2+rate);
        const capacity=S.budget(l).gross*.36+Math.max(0,l.cash-down)*.2;
        option('finance','Finance this vehicle','20% down '+money(down)+' · 5 years at '+pct(rate)+'.','wallet',!l.sim.license?'Driver’s license required':credit(l)<40?'Credit needs to recover':capacity<annualPayment?'More income or savings needed':'',down,()=>{
          shop.take(l,item);const balance=item.price-down;l.sim.loans[ref]={balance,principal:Math.ceil(balance/5),rate};return 'I financed '+shop.title(item)+'. The lender kept a copy of the keys on paper.';});
        for(const [id,a] of Object.entries(l.world.owned)){
          const old=shop.ownedItem(id,a);if(old.category!=='Vehicle')continue;
          const equity=a.value-(l.sim.loans[id]?.balance||0),due=item.price-equity;
          option('trade-'+id,'Trade in '+shop.title(old),'Net equity '+money(equity)+' · cash difference '+money(due)+'.','car',!l.sim.license?'Driver’s license required':'',Math.max(0,due),()=>{
            delete l.world.owned[id];delete l.sim.loans[id];shop.take(l,item);if(due<0)l.cash-=due;return 'I traded in '+shop.title(old)+' for '+shop.title(item)+'. The old finance agreement is closed.';});
        }
      }
      if(area==='visa'&&G.cities[ref]&&l.age>=18){
        const papers=Ec.papers(l,ref);
        if(!papers.citizen&&!papers.permanent){
          for(const [id,title] of [['work','Apply for a work visa'],['study','Apply for a study visa'],['independent','Apply through savings']]){
            const condition=id==='work'?(!working(l)&&!Object.keys(x.companies).length?'Job or business required':''):id==='study'?(!l.sim.program?'University enrollment required':''):(l.cash<papers.reserve*4+1800?'Settlement savings of '+money(papers.reserve*4+1800)+' required':'');
            const record=(l.sim.offenses||[]).some(o=>o.verdict==='Convicted'&&l.age-(o.age??0)<3);
            option(id,title,'Two-year permit · $150 application fee.','map',record?'Recent conviction under review':papers.valid&&papers.permit.until>=year+2?'Permit already current':condition,150,()=>{
              x.permits[papers.country]={kind:id==='study'?'Study visa':id==='work'?'Work visa':'Independent visa',since:papers.permit?.since??year,until:year+2};return 'My application was approved through '+(year+2)+'.';});
          }
          if(papers.home)option('residence','Apply for permanent residency','Three continuous years here, no recent conviction and $350.','home',year-x.since<3?'Needs three years of residence':!papers.valid?'Renew your permit first':(l.sim.offenses||[]).some(o=>o.verdict==='Convicted'&&l.age-(o.age??0)<3)?'Recent conviction under review':'',350,()=>{x.permits[papers.country]={kind:'Resident',since:year};return 'My permanent residence card arrived.';});
        }
        if(papers.home&&!papers.citizen)option('citizen','Apply for citizenship','Five continuous years and permanent residence · $600.','flag',!papers.permanent?'Permanent residence required':year-x.since<5?'Needs five years of residence':(l.sim.offenses||[]).some(o=>o.verdict==='Convicted'&&l.age-(o.age??0)<5)?'Five years with a clear record required':'',600,()=>{x.passports.push(papers.country);M.tag(l,'naturalized');return 'I took the citizenship oath. They spelled my name correctly.';});
      }
      if(area==='estate'&&l.age>=18){
        option('witness','Have the will witnessed','Record signed instructions and reduce disputes · $180.','letter',x.witness===l.sim.will?'Current will already witnessed':'',180,()=>{x.witness=l.sim.will;return 'Two witnesses signed. Neither got the good pen.';});
        if(S.children(l).length>1)for(const [id,p] of S.children(l)){
          option('weight-'+id,'Leave a double share to '+p.name,'Other children each receive one share.','people',x.double===id&&l.sim.will==='equal'?'Current plan':'',0,()=>{l.sim.will='equal';x.double=id;delete x.witness;return 'I recorded two shares for '+p.name+' and one for each other child.';},false);
        }
      }
      return list;
    }
    function perform(l,area,ref,id){
      if(typeof ref!=='string'||typeof id!=='string')return null;
      let o=actions(l,area,ref).find(a=>a.id===id);if(!o||o.reason)return null;
      activate(l);o=actions(l,area,ref).find(a=>a.id===id);if(!o||o.reason)return null;
      const before=M.metrics(l,W.netWorth,S.budget);if(o.cost)l.cash-=o.cost;if(o.once)l.used.push(o.key);
      const text=o.run(),delta=M.diff(before,M.metrics(l,W.netWorth,S.budget));
      const kind=({career:'Career',company:'Career',business:'Career',family:'Family',relative:'People',estate:'Family',visa:'Milestone',hobbies:'Activity'}[area])||'Assets';
      log(l,kind,o.title,text,delta);l.turns++;return {title:o.title,text,delta,accent:kind};
    }
    function recordAmbitions(l,x){
      for(const [i,met] of earned(l,x).entries()){
        const goal=ambitions[i];
        if(!met||x.awards.includes(goal))continue;
        x.awards.push(goal);l.keepsakes.push({title:goal,age:l.age});apply(l,{joy:goal===x.ambition?9:4});
        log(l,'Achievement',goal,'I crossed this one off my list.');
      }
    }
    function annual(l,b,earnedAge){
      const x=activate(l),year=l.born+l.age,e=Ec.local(l,l.town,earnedAge);
      if(x.lastYear===year)return;x.lastYear=year;
      if(earnedAge>=18){
        for(const r of b.businessRows||[]){
          const c=x.companies[r.id];if(!c)continue;c.capital=Math.max(0,c.capital+r.retained);c.last={year,revenue:r.revenue,operating:r.operating,payout:r.payout};
          if(c.managerId){
            const relative=Object.values(l.people).find(p=>p.id===c.managerId);
            if(relative&&M.isAlive(relative))relative.wealth+=r.managerPay||0;
            else{delete c.managerId;c.manager=false;}
          }
          if(c.manager&&c.clients<8&&Ec.sample(c.id,year)<.48)c.clients++;
          if(!c.capital&&r.net<0){delete x.companies[r.id];log(l,'Career','Business closed',c.name+' ran out of capital. I filed the final accounts.');}
        }
        if(b.arrears||b.skipped)x.missed=Math.min(18,(x.missed||0)+1);else if(x.missed)x.missed--;
        if(working(l)&&e.phase==='Recession'&&l.world.performance<58&&(x.discipline>=2||Ec.sample(x.seed,l.job+'/layoff/'+year)<e.unemployment*.85)){
          const job=jobs[l.job][0];W.changeJob(l,null,true);x.discipline=0;log(l,'Career','Made redundant','My '+job.toLowerCase()+' position ended. There was less work to go around.');
        }
        for(const [id,a] of Object.entries(l.world.owned)){
          const item=shop.ownedItem(id,a),roll=Ec.sample(id,year);
          if(!item.historical&&item.category==='Vehicle'&&roll<.049){const cost=Math.round(a.value*.065*(a.insured?.2:1));a.value=Math.max(0,a.value-cost);a.condition=Math.max(10,a.condition-(a.insured?2:12));log(l,'Assets','Vehicle damage',shop.title(item)+(a.insured?' needed a repair. Insurance covered most of it.':' lost value after a parking incident.'));}
          if(item.category==='Property'&&a.tenant&&roll<.15){a.tenant=null;a.vacant=true;log(l,'Assets','Lease ended','The tenant at '+shop.title(item)+' gave notice.');}
          if(item.category==='Property'&&a.manager&&a.vacant){a.tenant={name:'Managed tenant',since:year};a.vacant=false;}
        }
        if(x.policies.lifestyle!=='Simple')apply(l,{joy:x.policies.lifestyle==='Luxury'?4:2});
      }
      Kin.annual(l,log);
      if(H.historical(l)){
        recordAmbitions(l,x);
        if(year%4===0){const p=H.profile(l);log(l,'World','Market survey','Trade receipts covered '+Math.round(p.pay/p.cost*100)+'% of the usual basket of goods.');}
        return;
      }
      const here=Ec.local(l);
      if(here.phase!==x.phase&&here.phase!=='Steady')log(l,'World',here.phase+' in '+G.cities[l.town].name,'Local unemployment reached '+pct(here.unemployment)+'. Lenders quoted '+pct(here.rate)+'.');
      if(year===here.baseYear)log(l,'World',here.project,G.cities[l.town].name+' reported '+here.project.toLowerCase()+'. Local jobs and property prices changed.');
      if(!x.worldHistory)x.worldHistory=[];
      x.worldHistory.push({year,town:l.town,phase:here.phase,industry:here.sector,unemployment:Math.round(here.unemployment*1000)/10});
      if(x.worldHistory.length>24)x.worldHistory.shift();
      x.phase=here.phase;
      recordAmbitions(l,x);
      const doc=Ec.papers(l,l.town);if(!doc.citizen&&!doc.valid&&working(l)){const job=jobs[l.job][0];W.changeJob(l,null,true);log(l,'Career','Work authorization expired','My '+job.toLowerCase()+' contract ended when my permit expired.');}
      if(!doc.citizen&&doc.permit?.until===year)log(l,'Milestone','Visa renewal due','My permit expires this year. I can renew it under Travel.');
    }
    function moved(l,from,to){
      const x=activate(l),year=l.born+l.age,newCode=Ec.keyOf(l,to),intl=G.international(from,to);
      if(intl){x.since=year;if(!x.passports.includes(newCode)&&!(x.permits[newCode]&&(x.permits[newCode].kind==='Resident'||x.permits[newCode].until>=year)))x.permits[newCode]={kind:'Settlement visa',since:year,until:year+2};}
      for(const p of Object.values(l.people)){
        if(!M.isAlive(p)||!p.met||!(['Spouse','Partner','Engaged partner'].includes(p.role)||['Child','Stepchild'].includes(p.role)&&M.ageOf(l,p)<18))continue;
        if(x.policies.moveFamily!==false)p.town=to;
        else if(!p.town||p.town===from){p.town=from;p.bond=M.clamp(p.bond-2);Kin.remember(l,p,'moved-away',-2);}
      }
      Kin.sync(l);
    }
    function inherit(l,child,part){
      const px=activate(l),x=child.sim.expansion=fresh(child);
      x.seed=px.seed;if(px.worldHistory)x.worldHistory=px.worldHistory.map(report=>({...report}));x.companies=JSON.parse(JSON.stringify(part.companies||{}));x.sequence=px.sequence;
      for(const c of Object.values(x.companies))if(c.managerId===child.id){delete c.managerId;c.manager=false;}
      x.passports=[...new Set([Ec.keyOf(child,child.sim.birthplace),...px.passports])];x.since=child.born+child.age;
      if(!x.passports.includes(Ec.keyOf(child)))x.permits[Ec.keyOf(child)]={kind:'Resident',since:x.since};
      Kin.inherit(l,child);
      if(part.contested){x.dispute={amount:part.contested};log(child,'Family','Inheritance disputed','The executor held '+money(part.contested)+' until the family settles the dispute.');}
    }
    return {state,activate,reconcileBirthAmbition,actions,perform,annual,moved,inherit,credit,shares,portfolio,companyValue,expenses,businessYear,ambitions,funds,data:D,economy:Ec,kin:Kin};
  }
  root.PocketExpansion={create,credit,portfolio,companyValue,expenses,businessYear,state};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
