(function(){
  'use strict';
  const E=window.PocketEngine, W=E.world, S=E.sim, M=window.PocketMotion, Shop=W.shopping, G=S.geography;
  const saveKey='studio.pocketyears.save.v1';
  const shell=document.getElementById('shell'), overlay=document.getElementById('overlay'), status=document.getElementById('status');
  const disk=window.PocketSaves.open({getItem:k=>window.localStorage.getItem(k),setItem:(k,v)=>window.localStorage.setItem(k,v)},E,saveKey);
  let game=disk.load(),life=game.active;
  function persist(){return disk.save(game);}
  const cash=n=>E.historyEconomy.money(life,n);
  const esc=v=>String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const byId=id=>document.getElementById(id);
  function art(name){return 'art/'+name+'.png';}
  function icon(name,cls='',id=''){
    return '<img class="i'+(cls?' '+cls:'')+'"'+(id?' id="'+id+'"':'')+' src="'+art(name)+'" width="16" height="16" alt="" aria-hidden="true" draggable="false">';
  }
  function image(name,cls='',alt=''){return '<img src="'+art(name)+'" class="'+cls+'" alt="'+esc(alt)+'" draggable="false">';}
  function say(s){status.textContent=s;}
  const statIcons={joy:['sun','#b68435'],health:['heart','#c56f66'],smarts:['book','#6989a7'],looks:['spark','#967aaa'],bonds:['people','#60856a']};
  const jobIcons={barista:'coffee',cashier:'wallet',custodian:'tools',courier:'van',assistant:'letter',receptionist:'phone',manager:'shop',organizer:'flag',photographer:'camera',baker:'bread',electrician:'bolt',luthier:'guitar',
    teacher:'school',researcher:'flask',designer:'palette',developer:'code',performer:'mic',guide:'compass',physician:'heart',lawyer:'book',nurse:'flask',journalist:'newspaper',actor:'mic',athlete:'shoe',chef:'bowl',accountant:'wallet'};
  const metricNames=Object.assign({},E.statNames,{grade:'Grades',performance:'Performance',reputation:'Reputation',karma:'Karma',craziness:'Craziness',discipline:'Discipline',willpower:'Willpower',fertility:'Fertility',notoriety:'Notoriety',addictionRisk:'Addiction risk',annualWages:'Annual wages',annualPension:'Annual pension',annualSide:'Annual side income',fund:'Invested capital',netWorth:'Net worth',trust:'Trust',debt:'Debt',followers:'Followers'});
  const screens=['life','school','career','assets','people','activities','journal'];
  const navOrder=['school','career','assets','life','people','activities','journal'];
  
  const X=E.expansion, extra=window.PocketExpansionUI.create({E,row,detail,subhead,meter,esc,cash,button:actionButton});
  const historicalUI=window.PocketHistoryUI.create({E,row,detail,subhead,esc,cash,button:actionButton});
  const faithUI=window.PocketFaithUI.create({E,row,detail,subhead,meter,esc,cash,button:actionButton});
  const faithLink=()=>row('sheet','faith-home','Religion & beliefs','Explore beliefs, practices and communities.','book');
  const communityPropertyLink=()=>row('sheet','faith-institutions','Community land & institutions','Review local deeds, staff and operating accounts.','home');
  const careerFaithLink=()=>row('sheet','faith-career','Religious vocations','Training, service and community leadership.','people');
  const earlier=()=>E.isHistorical(life);
  const future=()=>E.historyEconomy.isFuture(life);
  const eraExtras=()=>!!life.sim.timeline?.historicalRules&&!earlier();
  const newEconomy=(area,title,desc)=>historicalUI.link(area,title,desc);
  function periodSchool(){
    return occupationTabs('school')+pageTitle('Education','Training in '+historicalUI.location(life.town,E.calendar(life)))+noteHtml()+historicalUI.rows(life,'school');
  }
  function periodCareer(){
    return occupationTabs('career')+pageTitle('Occupation',E.occupation(life))+noteHtml()+historicalUI.rows(life,'work')+
      subhead('Independent work')+newEconomy('business','Enterprises','Open a business or manage the family trade.');
  }
  function periodAssets(){
    return pageTitle('Assets',historicalUI.location(life.town,E.calendar(life)))+noteHtml()+detail('Net worth',cash(W.netWorth(life)))+detail('Available cash',cash(life.cash))+
      '<div class="commands">'+newEconomy('market','Local market','Land, transport, goods and buildings on offer this year.')+
      newEconomy('owned','Your possessions','Review condition, restore or sell your holdings.')+newEconomy('business','Enterprises','Manage the family business.')+
      newEconomy('museum','Family Museum','Exhibit heirlooms and trace their owners.')+row('sheet','budget','Annual accounts','Income, obligations and household costs.','wallet')+
      (life.age>=18&&!life.ended?row('sheet','will','Write a will','Choose how your estate is shared.','letter'):'')+'</div>';
  }
  function periodActivities(){
    if(life.sim.prison)return pageTitle('In custody',life.sim.prison+' years remaining')+noteHtml()+hubRow('custody');
    return pageTitle('Activities',historicalUI.location(life.town,E.calendar(life)))+noteHtml()+'<div class="commands">'+E.actionList(life).map(a=>row('activity',a[0],a[1],a[2],a[3],E.actionReason(life,a[0]))).join('')+'</div>'+(life.age>=4?historicalUI.rows(life,'activities'):'')+subhead('Community')+
      '<div class="commands">'+row('sheet','hist-world','Your settlement','Local industries, government and transport.','map')+
      (life.age>=5?extra.link('hobbies','Hobbies & ambitions','Practice a skill or choose a personal goal.','sprout'):'')+
      row('sheet','hist-move','Move household','See destinations and journey costs.','compass',life.age<18?'Opens at 18':'')+
      (life.age>=18?hubRow('pets')+hubRow('crime'):'')+row('tab','people','Family and friends','Visit your household or meet someone.','people')+newEconomy('museum','Family Museum','Explore the collection.')+'</div>';
  }
  let assetSort='recent',incomingBackup=null,importDetails=null,saveNotice='';
  let jobFilter='eligible';
  let note=null, historyLimit=12, journalLimit=16, journalFilter='highlights';
  let draft=null, movingTown=null, childDraft='', previousStats=null, previousLife=null, activeRoute=null, openPanel=null, returnFocus=null;
  let fallbackHistory=null, pendingBack=null, drag=null;
  function readRoute(){
    const hash=fallbackHistory?fallbackHistory[fallbackHistory.length-1]:location.hash;
    const [tab,sheet]=hash.slice(1).split('/');
    return {tab:screens.includes(tab)?tab:'life',sheet:sheet||null};
  }
  function writeRoute(r,replace){
    if(pendingBack){
      if(replace)pendingBack[pendingBack.length-1]=r;else pendingBack.push(r);
      return;
    }
    const path='#'+r.tab+(r.sheet?'/'+r.sheet:'');
    if(!fallbackHistory)try{history[replace?'replaceState':'pushState']({py:true,sheet:!!r.sheet},'',path);return;}
    catch(e){fallbackHistory=[location.hash||'#life'];}
    if(replace)fallbackHistory[fallbackHistory.length-1]=path;else fallbackHistory.push(path);
  }
  function go(tab,sheet=null,replace=false,reason='nav'){
    if(!screens.includes(tab))tab='life';
    const next={tab,sheet},old=activeRoute||readRoute();
    if(old.tab===tab && old.sheet===sheet && reason==='nav')return;
    if(!old.sheet && sheet){
      const from=document.activeElement;
      returnFocus=from&&from.dataset?{action:from.dataset.do,key:from.dataset.key}:null;
    }
    if(old.tab!==tab)note=null;
    writeRoute(next,replace);display(next,reason);
  }
  function showSheet(id){go((activeRoute||readRoute()).tab,id,!!(activeRoute&&activeRoute.sheet));}
  function dismiss(reason='close'){
    if(E.blocking(life))return;
    const old=activeRoute||readRoute();if(!old.sheet)return;
    const next={tab:old.tab,sheet:null};
    if(pendingBack){
      if(pendingBack.length>1)pendingBack.pop();else pendingBack[0]=next;
    }else if(fallbackHistory){
      if(fallbackHistory.length>1)fallbackHistory.pop();else writeRoute(next,true);
    }else if(history.state && history.state.py && history.state.sheet){
      pendingBack=[next];
      try{history.back();}catch(e){pendingBack=null;writeRoute(next,true);}
    }else writeRoute(next,true);
    display(next,reason);
  }
  function onHistory(){
    if(!pendingBack&&activeRoute&&(['assets','activities'].includes(activeRoute.tab)||activeRoute.sheet?.startsWith('hist-')||activeRoute.sheet?.startsWith('faith-'))){
      const destination=readRoute();
      if(destination.tab===activeRoute.tab&&!destination.sheet){
        const parent=parentSheet(activeRoute.tab,activeRoute.sheet);
        if(parent){go(activeRoute.tab,parent);return;}
      }
    }
    if(pendingBack){
      const queue=pendingBack;pendingBack=null;
      const actual=readRoute();
      if(queue[0].tab!==actual.tab || queue[0].sheet!==actual.sheet)writeRoute(queue[0],true);
      for(const r of queue.slice(1))writeRoute(r,false);
    }
    const next=readRoute();
    if(activeRoute&&activeRoute.tab===next.tab&&activeRoute.sheet===next.sheet)return;
    if(!activeRoute||next.tab!==activeRoute.tab)note=null;
    display(next,'history');
  }
  function actionButton(action,key,label,cls,ic,disabled=''){
    return '<button type="button" class="'+cls+'" data-do="'+action+'" data-key="'+esc(key)+'"'+(disabled?' disabled':'')+'>'+icon(ic)+esc(disabled||label)+'</button>';
  }
  function filterButton(action,key,label,ic,selected){
    return '<button type="button" class="filter" data-do="'+action+'" data-key="'+key+'" aria-pressed="'+selected+'">'+icon(ic)+esc(label)+'</button>';
  }
  function row(action,key,title,desc,ic,reason='',tail=''){
    return '<button type="button" class="command" data-do="'+action+'" data-key="'+esc(key)+'"'+(reason?' disabled':'')+'><span class="command-icon">'+icon(ic)+'</span><span class="command-copy"><strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small></span><span class="command-end">'+(reason?esc(reason):tail?esc(tail):icon('chev'))+'</span></button>';
  }
  function pageTitle(title,description){return '<header class="page-title"><h1>'+esc(title)+'</h1>'+(description?'<p>'+esc(description)+'</p>':'')+'</header>';}
  function subhead(s){return '<h2 class="section-title">'+esc(s)+'</h2>';}
  function detail(title,body){return '<div class="detail"><h3>'+esc(title)+'</h3><p>'+esc(body)+'</p></div>';}
  function chips(changes){
    const entries=Object.entries(changes||{}).filter(([,v])=>v);
    if(!entries.length)return '';
    return '<div class="chips">'+entries.map(([k,v])=>{
      const m=['cash','debt','netWorth','trust','annualWages','annualPension','annualSide','fund'].includes(k),p=k.startsWith('bond/')?Object.values(life.people).find(n=>n.id===k.slice(5)):null;
      const label=k==='cash'?'Bank':p?p.name+' relationship':k.startsWith('bond/')?'Relationship':metricNames[k]||k;
      return '<span class="chip '+(v<0?'minus':'')+'">'+(v<0?'−':'+')+(m?cash(Math.abs(v)):Math.abs(v))+' '+esc(label)+'</span>';
    }).join('')+'</div>';
  }
  function noteHtml(){
    if(!note)return '';
    return '<aside class="feedback" data-new-entry><span class="feedback-ico">'+icon('check')+'</span><div><h3>'+esc(note.title)+'</h3><p>'+esc(note.text)+'</p>'+chips(note.delta)+(note.closeness?'<small>Closeness '+(note.closeness>0?'+':'')+note.closeness+'</small>':'')+'</div></aside>';
  }
  function statMarkup(k){
    const [ic,tone]=statIcons[k];
    return '<span class="vital" style="--tone:'+tone+'"><span class="vital-label">'+icon(ic)+esc(E.statNames[k])+'</span><span class="vital-n"><b id="num-'+k+'"></b>%</span><span class="vital-track"><i id="bar-'+k+'"></i></span></span>';
  }
  function navMarkup(){
    const buttons=[['occupation','Occupation','bag'],['assets','Assets','wallet'],['life','Age +','age-up'],['people','Relationships','people'],['activities','Activities','compass']];
    return '<footer class="command-deck"><nav class="dock" aria-label="Life controls">'+buttons.map(([k,label,ic])=>k==='life'?
      '<button type="button" id="age-control" class="dock-main" data-do="central"><span class="age-disc" id="age-disc">'+icon(ic)+'</span><span id="age-label">Age +</span><span id="burst" aria-hidden="true"></span></button>':
      '<button type="button" class="dock-side" id="nav-'+k+'" data-do="'+(k==='occupation'?'occupation':'tab')+'" data-key="'+k+'"><span class="nav-ico">'+icon(ic,'',k==='occupation'?'career-icon':'')+'</span><span id="label-'+k+'">'+label+'</span></button>').join('')+'</nav>'+
      '<button type="button" class="vitals" data-do="sheet" data-key="stats" aria-label="View all stats including Karma and Notoriety">'+['joy','health','smarts','looks'].map(statMarkup).join('')+'</button></footer>';
  }
  function mount(){
    const mast='<header class="mast"><button class="brand" data-do="tab" data-key="life" aria-label="Pocket Years home">'+image('mark')+'<span>Pocket Years</span></button><div class="mast-tools">'+
      '<button class="icon-button" data-do="tab" data-key="journal" aria-label="Open journal archive">'+icon('journal')+'</button><button class="icon-button" data-do="sheet" data-key="checkpoint" aria-label="Manual save and load">'+icon('save')+'</button>'+
      '<button class="icon-button" aria-label="Game menu" data-do="sheet" data-key="menu">'+icon('settings')+'</button></div></header>';
    const person='<section id="summary" class="identity" aria-label="Your character"><img id="landscape" class="landscape" alt=""><div class="land-shade"></div><div class="person-line">'+
      '<button class="who" data-do="sheet" data-key="profile"><span class="face"><img id="face" alt=""></span><span class="who-copy"><strong id="who-name"></strong><small id="who-job"></small><span class="residence"><span id="town-name"></span> · <span id="calendar-year"></span></span></span></button>'+
      '<button class="bank" data-do="tab" data-key="assets" aria-label="Open assets"><small>'+icon('coin')+' <span id="bank-caption">Bank balance</span></small><b id="bank-value"></b><small>Net worth</small><b id="worth-value"></b></button></div></section>';
    shell.innerHTML='<div class="app">'+mast+'<div id="storage-flag" role="alert" hidden>Device storage is unavailable. Progress lasts for this session.</div>'+person+'<main><div id="page"></div></main>'+navMarkup()+'</div>';
  }
  function setText(id,value){const el=byId(id);if(el&&el.textContent!==String(value))el.textContent=String(value);}
  function setImage(id,name){const el=byId(id),src=art(name);if(el.getAttribute('src')!==src)el.setAttribute('src',src);}
  const eraUI=window.PocketEraUI;
  function applyTheme(){
    const theme=eraUI.activeTheme(life,game.settings.theme);
    if(document.documentElement.dataset.theme===theme)return theme;
    document.documentElement.dataset.theme=theme;
    const colorTag=document.querySelector('meta[name="theme-color"]');
    if(colorTag&&window.getComputedStyle)colorTag.setAttribute('content',window.getComputedStyle(document.documentElement).getPropertyValue('--page').trim());
    return theme;
  }
  function historicalLabel(id,year){
    return life.sim.timeline?.historicalRules&&window.PocketHistoryWorld?window.PocketHistoryWorld.place(id,year).label:G.label(id);
  }
  function syncShell(tab){
    const theme=applyTheme();
    const sameLife=previousLife===life;
    const old=sameLife&&tab==='life'?previousStats:null;
    byId('summary').hidden=false;
    byId('storage-flag').hidden=!disk.failed;
    setImage('landscape',theme==='modern'?(S.places[life.town]||S.places.cedar)[1]+(life.age>=65?'-evening':''):'era-'+theme);
    setImage('face','person-'+life.skin+'-'+E.portrait(life));setText('who-name',life.name);setText('who-job','Age '+life.age+' · '+E.occupation(life));
    setText('town-name',historicalLabel(life.town,life.born+life.age));setText('calendar-year',life.born+life.age);
    setText('bank-caption',earlier()&&E.calendar(life)<1900?'Cash on hand':'Bank balance');
    M.number(byId('bank-value'),old&&old.cash,life.cash,cash);
    M.number(byId('worth-value'),old&&old.worth,W.netWorth(life),cash);
    for(const k of ['joy','health','smarts','looks']){
      M.number(byId('num-'+k),old&&old[k],life.stats[k],String);
      byId('bar-'+k).style.transform='scaleX('+(life.stats[k]/100)+')';
    }
    previousStats=Object.assign({cash:life.cash,worth:W.netWorth(life)},life.stats);previousLife=life;
    const inSchool=!!E.model.school(life).name,school=inSchool||life.age<18;
    setImage('career-icon',life.sim.prison?'key':school?'school':'bag');
    setText('label-occupation',life.sim.prison?'Prison':inSchool?(life.sim.program?'University':'School'):'Occupation');
    for(const k of ['occupation','assets','people','activities']){
      const selected=k==='occupation'?['school','career'].includes(tab):k===tab,el=byId('nav-'+k);
      if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
    }
    const main=byId('age-control'),disc=byId('age-disc');
    const visual=life.ended?'sprout':life.sim.court?'letter':'age-up';
    if(disc.dataset.symbol!==visual){disc.dataset.symbol=visual;disc.innerHTML=icon(visual);}
    const label=life.ended?'Next life':life.sim.court?'Hearing':'Age +';
    setText('age-label',label);
    main.setAttribute('aria-label',life.ended?'Choose your next life':life.sim.court?'Attend your hearing':!life.event.resolved&&!life.event.optional?'Age up, answer the current decision':'Age up one year');
  }
  function token(event){
    if(!event)return 'token-letter';
    if(['box','midbox'].includes(event.id)||event.id.startsWith('echo-'))return 'token-box';
    if(event.id.startsWith('lens-'))return 'token-camera';
    if(event.id.startsWith('atlas-'))return 'token-map';
    return 'token-letter';
  }
  function entry(e,withDelta){
    if(e.kind==='Year')return '<p class="ordinary">'+esc(e.body)+'</p>';
    return '<article class="entry"><h3>'+esc(e.title)+'</h3><p>'+esc(e.body)+'</p>'+(withDelta?chips(e.delta):'')+'</article>';
  }
  function feed(){
    const groups=new Map([[life.age,[]]]);
    for(let i=life.log.length-1;i>=0;i--){
      const e=life.log[i];
      if(!groups.has(e.age)){if(groups.size>=historyLimit)break;groups.set(e.age,[]);}
      groups.get(e.age).unshift(e);
    }
    let html='<section id="feed-scroll" class="life-lines" role="region" tabindex="0" aria-label="Life journal, oldest to newest">';
    if(canEdit())html+=actionButton('edit-form','','Choose era & birthplace','link-btn birth-link','clock');
    if(life.log.length&&!groups.has(life.log[0].age))html+=actionButton('older','','Earlier years','link-btn earlier','clock');
    for(const [age,entries] of Array.from(groups).reverse()){
      const current=age===life.age,statement=entries.find(e=>e.kind==='Year');
      html+='<section class="life-year"'+(current?' data-new-year':'')+'><div class="year-label"><h2>Age <span'+(current?' id="current-age"':'')+'>'+age+'</span></h2>'+
        (statement?'<button class="year-statement" data-do="sheet" data-key="year-'+age+'" aria-label="View age '+age+' details">'+(life.born+age)+icon('chev')+'</button>':'<small>'+(life.born+age)+'</small>')+'</div>';
      const notes=entries.filter(e=>e.kind!=='Year');
      for(const [i,e] of notes.entries()){
        const showTitle=['Assets','Career','Justice','People','Activity'].includes(e.kind);
        const title=showTitle?'<strong>'+esc(e.title)+'. </strong>':'';
        html+='<p class="journal-line"'+(current&&i===notes.length-1?' data-new-entry':'')+'>'+title+esc(e.body)+'</p>';
      }
      if(!notes.length&&statement)html+='<p class="journal-line">'+esc(statement.diary||('I turned '+age+'.'))+'</p>';
      if(current&&life.ended)html+=actionButton('sheet','death','View my legacy','secondary wide','sprout');
      html+='</section>';
    }
    return html+'</section>';
  }
  function legacy(l,current){
    const spouse=Object.values(l.people).find(p=>p.active&&p.role==='Spouse'),kids=S.children(l);
    const family=spouse?'Married to '+spouse.name+'. ':'';
    const last=l.log.slice().reverse().find(x=>x.age===70&&x.kind==='Echo');
    let html=l.ended?'<section class="legacy memorial"><div class="headstone">'+image('person-'+l.skin+'-'+E.portrait(l),'mem-portrait')+'<h2>'+esc(l.name)+'</h2><p>'+l.born+' – '+(l.born+l.age)+'</p></div><p>'+esc('Age '+l.age+' · '+(l.sim.cause||'Cause unrecorded')+' · '+historicalLabel(l.town,l.born+l.age))+'</p>':
      '<section class="legacy"><h2>'+esc(l.name)+'</h2><p>Generation '+l.sim.generation+' · Age '+l.age+' · '+esc(historicalLabel(l.town,l.born+l.age))+'</p>';
    if(spouse||kids.length)html+='<p>'+esc(family+(kids.length?'Survived by '+kids.map(([,p])=>p.name).join(', ')+'.':''))+'</p>';
    if(last)html+='<p>'+esc(last.body)+'</p>';
    const peak=l.sim.peak,career=peak.title&&E.jobs[peak.title]?E.jobs[peak.title][0]+' · '+cash(peak.salary)+' peak annual pay':'No recorded career';
    html+=detail('Career highlight',career)+detail('Criminal record',l.sim.offenses.length?l.sim.offenses.map(x=>x.offense+' · '+x.verdict).join(' / '):'No offenses recorded.')+'<div class="epitaph">'+icon('flag')+'<span>Achievement ribbon</span><b>'+esc(E.legacyTitle(l))+'</b></div>';
    html+='<div class="legacy-line">'+l.turns+' decisions · '+cash(W.netWorth(l))+' net worth</div>';
    if(current&&l.ended){
      html+=actionButton('sheet','legacy','Continue as your child','primary wide','people',kids.length?'':'Continue as child · No surviving children');
      html+=actionButton('new-form','','Start a new custom life',kids.length?'secondary wide':'primary wide','pencil')+actionButton('random-life','','Start a random life','secondary wide','dice');
    }
    return html+'</section>';
  }
  function meter(label,val,ic){
    return '<div class="feature-meter"><span>'+icon(ic)+esc(label)+'</span><strong>'+val+'%</strong><div><i style="transform:scaleX('+val/100+')"></i></div></div>';
  }
  function occupationTabs(current){
    return '<div class="occupation-switch" aria-label="Occupation sections">'+['school','career'].map(k=>actionButton('tab',k,k==='school'?'Education':'Jobs','switch-tab '+(k===current?'selected':''),k==='school'?'school':'bag').replace('data-do=',(k===current?'aria-current="page" ':'')+'data-do=')).join('')+'</div>';
  }
  function members(group){
    return Object.entries(life.people).filter(([,p])=>p.met&&p.active&&(group==='class'?p.atSchool:['Boss','Coworker'].includes(p.role)));
  }
  function schoolPage(){
    if(earlier())return periodSchool();
    const v=E.state(life),all=W.careerOptions(life),student=!!v.currentSchool&&!life.sim.prison;
    const feature='<section class="feature"><div class="eyebrow">'+icon('school')+esc(v.educationLevel)+'</div><h2>'+esc(v.currentSchool||'Education record')+'</h2>'+
      (life.age>=5?meter('Grades',life.world.grade,'book')+'<p class="feature-detail">GPA '+v.gpa.toFixed(2)+' / 4.00'+(v.schoolActivities.length?' · '+esc(v.schoolActivities.join(', ')):'')+'</p>':'<p>Elementary school starts at age 5.</p>')+'</section>';
    let html=occupationTabs('school')+feature+noteHtml();
    if(life.ended)return html;
    if(eraExtras()&&life.age>=5)html+=newEconomy('school','Specialist training','Gain practical skills for specialist jobs.');
    if(life.age>=18)html+='<div class="commands roster-link">'+row('sheet','hub-education',life.sim.program?'My program':'University and apprenticeships',life.sim.program?'Qualifications, major and enrollment.':'Choose a course, arrange tuition or train for a trade.','school')+'</div>';
    if(members('class').length)html+='<div class="commands roster-link">'+row('sheet','class','Class directory',members('class').length+' students and staff','people')+'</div>';
    const direct=all.filter(o=>student?['study','science'].includes(o.id):o.id==='discover');
    const actions=S.options(life,'school').filter(o=>student?o.id!=='equivalency'&&!o.reason.startsWith('Opens')&&!o.reason.startsWith('Ages'):o.id==='equivalency'&&life.age>=18&&life.sim.dropped);
    if(direct.length||actions.length)html+=subhead('School actions')+'<div class="commands">'+direct.map(o=>row('career',o.id,o.title,o.desc,o.icon,o.reason)).join('')+actions.map(option).join('')+'</div>';
    return html;
  }
  function careerPage(){
    if(earlier())return periodCareer()+careerFaithLink();
    const v=E.state(life),under=life.age<18,employed=!!life.job&&!['student','retired'].includes(life.job);
    const opts=W.careerOptions(life).filter(o=>(under?['paper','cafe','odd','leave-shift']:['practice','promote','mentor','train']).includes(o.id));
    let html=occupationTabs('career')+'<section class="feature"><div class="eyebrow">'+icon('bag')+'Occupation</div><h2>'+esc(v.jobTitle||'Unemployed')+'</h2>'+
      (employed||life.world.partJob?meter('Performance',v.jobPerformance,'trend'):'')+'<p class="feature-detail">'+esc([v.employer,v.jobTitle?cash(v.salary+(S.budget(life).pension||0))+' annual pay':'',v.yearsAtJob?v.yearsAtJob+' years in role':''].filter(Boolean).join(' · '))+'</p></section>'+noteHtml();
    if(life.ended)return html;
    if(eraExtras())html+=newEconomy('work',future()?'Future professions':'Specialist work','Opportunities and assignments this year.')+newEconomy('business',future()?'Future enterprises':'Independent enterprises','Industry and private ventures.');
    html+=careerFaithLink();
    if(under&&life.age<14)return html+detail('Part-time work','Jobs open at age 14. Pay arrives on your next birthday.');
    if(!under)html+='<div class="commands">'+(employed?extra.link('career','Professional life','Assignments, certification and salary negotiations.','bag'):'')+extra.link('business','Work for yourself','Contracts, companies and employees.','shop')+'</div>';
    if(!under)html+='<div class="commands roster-link">'+row('sheet','jobs','Job listings','This year’s vacancies, salaries and requirements.','bag')+'</div>';
    if(members('workplace').length)html+='<div class="commands roster-link">'+row('sheet','workplace','People at work',v.employer||'Supervisor and coworkers','people')+'</div>';
    const work=under?[]:S.options(life,'work').filter(o=>!o.reason||employed&&['raise','resign','work-slack'].includes(o.id)||life.sim.sideHustle&&o.id==='end-side');
    if(opts.length||work.length)html+=subhead(under?'Part-time jobs':'Work actions')+'<div class="commands">'+opts.map(o=>row('career',o.id,o.title,o.desc,o.icon,o.reason)).join('')+work.map(option).join('')+'</div>';
    return html;
  }
  function assetsPage(){
    if(earlier())return periodAssets()+communityPropertyLink();
    const owned=Object.entries(life.world.owned), budget=S.budget(life);
    const itemName=([id,a])=>Shop.title(Shop.ownedItem(id,a));
    owned.sort((a,b)=>assetSort==='value'?b[1].value-a[1].value:assetSort==='condition'?a[1].condition-b[1].condition:assetSort==='name'?itemName(a).localeCompare(itemName(b)):b[1].at-a[1].at);
    const jobsHint=life.age<18 && !life.world.partJob?'<p class="feature-detail">'+(life.age<14?'Part-time jobs open at age 14.':'Open Occupation, then Jobs, to take a part-time job.')+'</p>':'';
    let html=pageTitle('Assets','What you own and what it is worth.')+'<section class="feature money"><div class="eyebrow">'+icon('coin')+'Net worth</div><h2>'+cash(W.netWorth(life))+'</h2><div class="money-pair"><span>Bank balance<strong>'+cash(life.cash)+'</strong></span><span>Yearly income<strong>'+cash(life.ended?0:budget.gross)+'</strong></span></div>'+jobsHint+'</section>'+noteHtml();
    html+=newEconomy('museum','Family Museum','Exhibit and conserve the family collection.')+communityPropertyLink();
    if(eraExtras()&&life.age>=18)html+=newEconomy('market',future()?'Future market':'Specialty market','Technology, transportation and living spaces.')+newEconomy('owned','Manage period holdings','Restore or sell inherited and future holdings.');
    else if(E.historyEconomy.actions(life,'owned').length)html+=newEconomy('owned','Manage period holdings','Restore or sell inherited holdings.');
    if(!life.ended&&life.age>=8){
      let stores='';
      if(life.age>=18)stores+=row('sheet','real-estate','Real estate','Apartments, houses, land and estates.','home');
      if(life.age>=16)stores+=row('sheet','dealerships','Car dealerships','Shop by dealer and vehicle type.','car');
      stores+=row('sheet','gear-shop','Equipment','Bicycles, cameras and instruments.','tools');
      html+=subhead('Go shopping')+'<div class="commands">'+stores+'</div>';
    }
    if(owned.length){
      const holdings=owned.map(([id,asset])=>{
        const item=Shop.ownedItem(id,asset);
        return row('sheet','sell-'+id,Shop.title(item),(asset.inherited?'Inherited':'Acquired at age '+asset.at)+' · '+asset.condition+'% condition',item.icon,'',cash(asset.value));
      });
      html+=subhead('Your possessions')+'<div class="filters">'+[['recent','Recent','clock'],['value','Value','coin'],['condition','Condition','tools'],['name','Name','book']].map(([k,n,i])=>filterButton('asset-sort',k,n,i,assetSort===k)).join('')+'</div><div class="commands">'+holdings.join('')+'</div>';
    }
    html+=subhead('Finances')+'<div class="commands">'+(life.age>=18?extra.link('bills','Bills & maintenance','Loan payments, insurance and bulk repairs.','tools')+extra.link('portfolio','Investment portfolio','Market holdings and prices.','trend')+extra.link('business','Businesses','Company accounts and management.','shop'):'')+row('sheet','net','Net worth breakdown','Cash, possessions, investments and debts.','coin')+hubRow('invest')+row('sheet','budget','Annual budget','Income, expenses, loan balances and your last statement.','wallet')+
      (life.age>=18&&!life.ended?row('sheet','will','Write a will','Choose how your children share your estate.','letter'):'')+'</div>';
    return html;
  }
  function marketDirectory(category){
    const shops=Object.entries(Shop.shops).filter(([,shop])=>shop.category===category&&life.age>=shop.age);
    if(!shops.length||life.ended)return null;
    const rows=shops.map(([id,shop])=>{
      const count=Shop.inventory(life,id).length;
      return row('sheet','store-'+id,shop.name,shop.focus,shop.icon,'',count+' listed');
    }).join('');
    return {title:category==='Vehicle'?'Car dealerships':'Real estate agencies',tag:'Shopping · '+(life.born+life.age),
      body:'<p class="sheet-intro">New listings arrive on your next birthday.</p><div class="commands">'+rows+'</div>'};
  }
  function parentSheet(tab,key){
    if(key==='faith-encounter')return 'faith-home';
    if(key?.startsWith('faith-'))return faithUI.parent(key);
    if(key?.startsWith('hist-review~')){
      const area=key.split('~')[1];
      if(['museum','market','owned','business'].includes(area)||!earlier())return 'hist-'+area;
    }
    if(key?.startsWith('hist-settle~'))return 'hist-move';
    if(key?.startsWith('hist-item~'))return 'hist-museum';
    if(key?.startsWith('hist-capsule~'))return 'hist-archive';
    if(key?.startsWith('xp-'))return extra.parent(key);
    if(key==='save-slots'||key==='file-import'||key==='recover-confirm'||key==='import-confirm')return 'checkpoint';
    if(tab==='activities'){
      if(key==='destinations')return 'hub-travel';
      if(['do-pet-cat','do-pet-dog','do-record-pet-breed'].includes(key))return 'hub-pets';
      if(key&&key.startsWith('move-'))return 'destinations';
    }
    if(tab!=='assets')return null;
    if(!key)return null;
    if(key.startsWith('buy-')){
      const item=Shop.offer(life,key.slice(4));
      return item?item.shop?'store-'+item.shop:'gear-shop':null;
    }
    if(key.startsWith('store-')){
      const store=Shop.shops[key.slice(6)];
      if(store&&store.category)return store.category==='Vehicle'?'dealerships':'real-estate';
    }
    return null;
  }
  function stockView(id){
    const shop=Shop.shops[id];
    if(!Object.prototype.hasOwnProperty.call(Shop.shops,id)||life.age<shop.age||life.ended)return null;
    const stock=Shop.inventory(life,id),cars=shop.category==='Vehicle';
    const rows=stock.map(item=>row('sheet','buy-'+item.id,cars?Shop.title(item):item.name,
      Shop.summary(item)+' · '+item.condition+'% condition'+(cars&&item.newCar?' · New':''),item.icon,'',cash(item.price))).join('');
    const body=(rows?'<div class="commands">'+rows+'</div>':detail('Sold out','New listings arrive on your next birthday.'))+
      actionButton('sheet',cars?'dealerships':'real-estate',cars?'All dealerships':'All real estate agencies','secondary wide','back');
    return {title:shop.name,tag:(cars?shop.focus:G.label(life.town))+' · '+(life.born+life.age),body};
  }
  function gearView(){
    if(life.age<8||life.ended)return null;
    const rows=Shop.gear(life).map(item=>row('sheet','buy-'+item.id,item.name,item.detail,item.icon,'',cash(item.price))).join('');
    return {title:'Equipment',body:rows?'<div class="commands">'+rows+'</div>':detail('Equipment owned','You own every item available at your age.')};
  }
  function whoBadge(key,p){const i=key==='carer'?'home':p.role==='Child'&&life.age-p.bornAt<5?'baby':W.isPartner(life)&&key==='love'?'heart':'people';return '<span class="person-badge '+(p.active?'':'muted')+'">'+icon(i)+'</span>';}
  function personRow(k,p){
    const age=S.ageOf(life,p),status=p.active?'':p.diedAt!==undefined?' · Deceased':' · Past';
    return '<button class="person-row" data-do="sheet" data-key="person-'+esc(k)+'">'+whoBadge(k,p)+'<span class="command-copy"><strong>'+esc(p.fullName)+'</strong><small>'+esc(p.role+' · Age '+age+status)+'</small></span><span class="person-meter"><b>'+p.bond+'%</b><i><u style="transform:scaleX('+p.bond/100+')"></u></i></span>'+icon('chev','arrow-end')+'</button>';
  }
  function peoplePage(){
    let html=pageTitle('Relationships','')+noteHtml()+'<div class="commands">';
    if(!life.ended){
      const plan=W.visitPlan(life),count=plan.keys.length;
      const description=count?(count===1?'1 person is':count+' people are')+' available. Uses one visit per person.':'Visits are available up to three times per person each year.';
      html+=row('visit-all','','Spend time with all',description,'people',plan.reason);
    }
    html+=extra.link('family','Family tree & gatherings','Family links, celebrations and decisions.','family-tree')+'</div>';
    const buckets=new Map([['Partner',[]],['Family',[]],['Friends',[]],['At work',[]],['Past relationships',[]]]);
    for(const [key,p] of Object.entries(life.people)){
      if(!p.met||['Classmate','Teacher','Former classmate','Former teacher'].includes(p.role))continue;
      const group=E.model.isFamily(p)?'Family':!p.active||p.role.startsWith('Former ')?'Past relationships':key==='love'&&W.isPartner(life)?'Partner':['Boss','Coworker'].includes(p.role)?'At work':'Friends';
      buckets.get(group).push([key,p]);
    }
    for(const [title,group] of buckets){
      if(!group.length)continue;
      html+=subhead(title)+'<div class="commands">'+group.map(([k,p])=>personRow(k,p)).join('')+'</div>';
    }
    if(!life.ended&&life.age>=5)html+=subhead('Friendship')+'<div class="commands">'+S.options(life,'company').map(option).join('')+'</div>';
    if(!life.ended && life.age>=14){
      html+=subhead('Love and family')+'<div class="commands">'+row('sheet','date','Go on a date',earlier()?'Meet someone on a walk through town.':life.age<18?'Meet someone for a walk after school.':'Meet someone over coffee for $35.','heart',W.dateReason(life));
      if(life.age>=18)html+=S.options(life,'family').map(option).join('');
      if(life.age>=21)html+=row('sheet','adopt','Adopt a child','Choose a name and prepare a room. Costs '+cash(W.familyCost(life))+'.','baby',W.familyReason(life));
      html+='</div>';
    }
    return html;
  }
  function activitiesPage(){
    if(earlier())return periodActivities()+faithLink();
    const age=life.age,groups=life.sim.prison?['custody','health']:['leisure','health',...(age>=13&&(!life.sim.timeline?.historicalRules||E.calendar(life)>=2004)?['fame']:[]),...(age>=16?['travel']:[]),...(age>=18?['nightlife','pets','crime']:[])];
    return pageTitle('Activities','Choose how to spend the year.')+noteHtml()+(eraExtras()&&life.age>=4?newEconomy('activities',future()?'Future activities':'Digital life','Technology and leisure in your lifetime.'):'')+'<div class="commands">'+faithLink()+groups.map(hubRow).join('')+extra.link('world','Local economy','Prices and employment in '+G.cities[life.town].name+'.','world-index')+(age>=5&&!life.sim.prison?extra.link('hobbies','Hobbies & ambitions','Practice a skill or pursue a life goal.','sprout'):'')+
      (!life.sim.prison?row('tab','people','Spend time with family','Choose a relative to visit.','people')+(!life.ended&&life.age>=18&&(!life.sim.timeline?.historicalRules||E.calendar(life)>=2009)?row('sheet','matches','Dating app','Browse three local profiles. An introduction costs $15.','heart',W.isPartner(life)?'In a relationship':''):'')+
      (life.age<18?row('tab','school','Study or find a shift','School, clubs and teen work.','school'):''):'')+'</div>'+
      (life.age>=12?'<div class="social-summary after">'+meter('Reputation',life.world.reputation,'spark')+'</div>':'');
  }
  function fullJournal(){
    const filters=[['highlights','Highlights','spark'],['all','All entries','journal'],['keepsakes','Keepsakes','gift']];
    let html=pageTitle('Journal archive',life.name+' · '+(life.born)+'–'+(life.born+life.age))+'<div class="filters" aria-label="Journal filters">'+filters.map(([key,label,ic])=>filterButton('filter',key,label,ic,journalFilter===key)).join('')+'</div>';
    html+='<div class="commands">'+newEconomy('museum','Family Museum','Heirlooms, acquisitions and conservation.')+newEconomy('archive','Family archive & Time Capsule','Explore your dynasty’s lives and journals.')+'</div>';
    if(journalFilter==='keepsakes'){
      html+=life.keepsakes.length?'<div class="shelf">'+life.keepsakes.slice().reverse().map(k=>'<article>'+icon('gift')+'<h3>'+esc(k.title)+'</h3><small>Age '+k.age+'</small></article>').join('')+'</div>':detail('Your keepsake shelf','No keepsakes recorded yet.');
    }else{
      const entries=life.log.filter(e=>journalFilter==='all'||['Milestone','Choice','Echo','Family','Career','Justice','Health','School','World','Achievement','Assets','People','Faith','Religion'].includes(e.kind)).slice().reverse();
      html+='<div class="archive-list">'+entries.slice(0,journalLimit).map(e=>'<article><div class="eyebrow">Age '+e.age+' · '+esc(e.kind)+'</div>'+entry(e,false)+'</article>').join('')+'</div>';
      if(entries.length>journalLimit)html+=actionButton('more','','Show earlier entries','secondary wide','clock');
    }
    if(game.archive.length)html+=actionButton('sheet','archive','Past lives ('+game.archive.length+')','secondary wide','archive');
    return html;
  }
  const pages={life:feed,school:schoolPage,career:careerPage,assets:assetsPage,people:peoplePage,activities:activitiesPage,journal:fullJournal};
  function canEdit(){return !life.ended && !E.blocking(life) && life.sim.generation===1 && life.age===0 && life.turns===0 && life.used.length===0;}
  function optionsHtml(pairs,selected){
    return pairs.map(([k,label])=>'<option value="'+esc(k)+'"'+(k===selected?' selected':'')+'>'+esc(label)+'</option>').join('');
  }
  const countryPairs=G.countryList.map(c=>[c.code,c.name]);
  function cityOptions(code,selected){
    return optionsHtml(G.countries[code].cities.map(c=>[c.id,c.option]),selected);
  }
  function locationFields(id,birth=false){
    const city=G.cities[id];
    return '<div class="place-picker"><label for="place-search">Find a country or city</label>'+
      '<input type="search" id="place-search" autocomplete="off" enterkeyhint="search" aria-controls="place-results">'+
      '<div class="place-results" id="place-results" aria-live="polite"></div>'+
      '<label for="country">Country or territory</label><select id="country">'+optionsHtml(countryPairs,city.code)+'</select>'+
      '<label for="town">'+(birth?'Birth city':'Destination city')+'</label><select id="town">'+cityOptions(city.code,id)+'</select></div>';
  }
  function locationSearch(){
    const input=byId('place-search'),out=byId('place-results');if(!input||!out)return;
    const query=input.value.trim();
    if(!query){out.innerHTML='';return;}
    const hits=G.search(query,byId('country').value);
    out.innerHTML=hits.length?'<div class="commands">'+hits.map(hit=>row('place-hit',hit.kind+'~'+hit.id,hit.label,
      hit.kind==='country'?'Country or territory':G.countries[hit.code].name,hit.kind==='country'?'map':'pin')).join('')+'</div>':'<p>No matching country or city.</p>';
  }
  function moveActions(town){
    return extra.link('travel','Household moving plans','Choose a solo or household move.','family-tree')+extra.link('visa','Immigration office','Permits, residence and citizenship.','passport',town)+actionButton('sheet','move-'+town,'Review move','primary wide','map',town===life.town?'Current home':'');
  }
  function setPickerTown(id){
    const city=G.cities[id];if(!city||!byId('place-search'))return;
    const list=byId('town');byId('country').value=city.code;
    list.innerHTML=cityOptions(city.code,id);list.value=id;
    byId('place-search').value='';byId('place-results').innerHTML='';
    if(activeRoute.sheet==='destinations'){
      movingTown=id;byId('moving-actions').innerHTML=moveActions(id);
    }else if(draft){draft.town=id;updateBirthBeliefs();}
  }
  function applyPlaceHit(key){
    const [kind,id]=key.split('~');
    const town=kind==='country'&&G.countries[id]?G.countries[id].cities[0].id:kind==='city'?id:null;
    if(G.cities[town]){setPickerTown(town);byId('town').focus({preventScroll:true});}
  }
  function makeDraft(edit){
    const l=edit?life:E.makeLife({birthYear:2026}),year=edit?l.born:2026;
    return {edit,faithId:edit?(l.sim.faith?.backgroundChoice||l.sim.faith?.id||'family'):'family',name:l.name,town:l.town,skin:l.skin,thread:l.thread,identity:l.sim.identity,birthYear:year,era:eraUI.eraForYear(year).id,legacyBirth:edit&&!l.sim.timeline?.historicalRules};
  }
  function birthLocation(d){
    if(d.birthYear<2000&&!d.legacyBirth){
      const places=window.PocketHistoryWorld.choices(d.birthYear);
      if(!places.some(p=>p.id===d.town))d.town=places[0].id;
      return '<label for="town">Birth settlement</label><select id="town">'+optionsHtml(places.map(p=>[p.id,p.label]),d.town)+'</select>';
    }
    return locationFields(d.town,true);
  }
  function eraArtwork(year){
    const theme=eraUI.themeForYear(year);
    return image(theme==='modern'?'cedar':'era-'+theme,'era-art');
  }
  function beliefOptions(d){
    const traditions=E.faithCatalog.options(d.birthYear,d.town);
    const choices=[['family','Inherit family tradition'],['unaffiliated','No affiliation'],['exploring','Explore during life'],
      ...traditions.filter(t=>!['unaffiliated','exploring'].includes(t.id)).map(t=>[t.id,t.name])];
    if(!choices.some(([id])=>id===d.faithId))d.faithId='family';
    return optionsHtml(choices,d.faithId);
  }
  function updateBirthBeliefs(){
    const field=byId('birth-faith');
    if(field&&draft){draft.faithId=field.value;field.innerHTML=beliefOptions(draft);field.value=draft.faithId;}
  }
  function birthFields(d){
    const era=eraUI.eras.find(e=>e.id===d.era);
    return '<fieldset class="birth-period"><legend>Starting era</legend><div class="era-illustration" id="birth-art">'+eraArtwork(d.birthYear)+'</div>'+
      '<div class="period-fields"><div><label for="birth-era">Era</label><select id="birth-era">'+optionsHtml(eraUI.eras.map(e=>[e.id,e.name]),d.era)+'</select></div>'+
      '<div><label for="birth-year">Birth year</label><input id="birth-year" type="number" inputmode="numeric" required step="1" min="'+era.first+'" max="'+era.last+'" value="'+d.birthYear+'" aria-describedby="year-range"></div></div>'+
      '<small id="year-range">Choose any year from '+era.first+' to '+era.last+'.</small></fieldset>';
  }
  function changeBirthYear(selectEra){
    if(!draft||!byId('birth-year'))return;
    const era=eraUI.eras.find(e=>e.id===byId('birth-era').value);
    if(!era)return;
    const old=draft.birthYear,field=byId('birth-year');
    if(selectEra){
      field.setAttribute('min',era.first);field.setAttribute('max',era.last);field.value=String(era.start);
      setText('year-range','Choose any year from '+era.first+' to '+era.last+'.');
    }
    if(!eraUI.validYear(era,field.value))return;
    draft.era=era.id;draft.birthYear=Number(field.value);
    if(old!==draft.birthYear)draft.legacyBirth=false;
    if(eraUI.themeForYear(old)!==eraUI.themeForYear(draft.birthYear))byId('birth-art').innerHTML=eraArtwork(draft.birthYear);
    if(old!==draft.birthYear&&(old<2000||draft.birthYear<2000)){
      draft.town=byId('town').value;byId('birth-location').innerHTML=birthLocation(draft);
    }
    if(old!==draft.birthYear)updateBirthBeliefs();
  }
  function formBody(edit){
    if(!draft||draft.edit!==edit)draft=makeDraft(edit);
    return '<form id="character-form">'+(edit?'':'<p class="sheet-intro">Your current character and journal will move to Past lives.</p>')+
      birthFields(draft)+'<label for="person-name">Name</label><div class="input-row"><input id="person-name" maxlength="32" value="'+esc(draft.name)+'" required autocomplete="off">'+actionButton('shuffle','','','icon-button','dice').replace('class="icon-button"','class="icon-button" aria-label="Randomize character"')+'</div>'+
      '<label for="identity">Identity</label><select id="identity">'+optionsHtml(Object.entries(S.identities),draft.identity)+'</select>'+ '<div id="birth-location">'+birthLocation(draft)+'</div>'+
      '<label for="birth-faith">Belief background</label><select id="birth-faith">'+beliefOptions(draft)+'</select><p class="form-label">Portrait</p><div class="swatches">'+[0,1,2,3].map(n=>'<button type="button" data-do="swatch" data-key="'+n+'" aria-label="Portrait '+(n+1)+'" aria-pressed="'+(n===draft.skin)+'">'+image('person-'+n+'-0')+(n===draft.skin?'<span class="swatch-check">'+icon('check')+'</span>':'')+'</button>').join('')+'</div>'+
      '<div class="sheet-actions">'+actionButton('close','','Cancel','secondary','close')+'<button type="submit" class="primary">'+icon(edit?'save':'sprout')+(edit?'Save character':'Start life')+'</button></div></form>';
  }
  function readDraft(){
    if(draft&&byId('person-name')){draft.faithId=byId('birth-faith').value;draft.name=byId('person-name').value;draft.town=byId('town').value;draft.identity=byId('identity').value;}
  }
  function profileBody(){
    const club={music:'Jam session',running:'Running club',zine:'School zine'}[life.flags.club];
    const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
    return extra.summary(life)+detail(E.chapter(life.age),S.identities[life.sim.identity]+' · Age '+life.age+' · Generation '+life.sim.generation)+detail('Current home',historicalLabel(life.town,life.born+life.age))+detail('Birthplace',historicalLabel(life.sim.birthplace,life.born)+' · '+months[life.sim.month-1]+' '+life.sim.birthday+', '+life.born)+(life.sim.ancestors.length?detail('Family line',life.sim.ancestors.map(p=>p.name).join(' → ')):'')+detail('Family',life.people.carer.fullName+' · '+life.people.carer.role)+
      (club?detail('First club',club):'')+
      detail('Occupation',E.occupation(life))+(life.sim.residences&&life.sim.residences.length?actionButton('sheet','residences','Residence history','secondary wide','map'):'')+(canEdit()?actionButton('edit-form','','Customize character','primary wide','pencil'):'');
  }
  function decisions(){
    if(life.ended||life.event.resolved||!life.event.id)return null;
    const e=E.stories[life.event.id];
    return {title:E.copy(life,e.title),tag:e.label+' · Age '+life.age,art:token(e),body:'<p class="story-text">'+esc(E.copy(life,e.body))+'</p><div class="event-choices">'+e.choices.map((o,i)=>
      '<button class="event-choice" data-do="choose" data-key="'+i+'" data-event="'+esc(e.id)+'" data-age="'+life.age+'"><span>'+icon(o.icon)+'</span><strong>'+esc(E.copy(life,o.label))+'</strong>'+icon('chev')+'</button>').join('')+'</div>'};
  }
  function jobsBody(){
    const keys=Object.keys(W.openings).filter(k=>jobFilter==='all'||!W.jobReason(life,k));
    keys.sort((a,b)=>Number(!!W.jobReason(life,a))-Number(!!W.jobReason(life,b))||E.jobs[b][1]-E.jobs[a][1]);
    return '<div class="filters">'+filterButton('jobs-filter','eligible','Eligible','check',jobFilter==='eligible')+filterButton('jobs-filter','all','All jobs','bag',jobFilter==='all')+'</div>'+
      (keys.length?'':'<p class="sheet-intro">No eligible openings. All jobs shows the requirements.</p>')+'<div class="commands">'+keys.map(id=>
      row('sheet','job-'+id,E.jobs[id][0],W.openings[id][0]+' · '+cash(X.economy.salary(life,id,E.jobs))+' a year',jobIcons[id]||X.data.sectors[X.data.sector(id)][5],W.jobReason(life,id))).join('')+'</div>';
  }
  function personView(key){
    const p=life.people[key];if(!p||!p.met)return null;
    const options=W.socialOptions(life,key),label=p.role+' · age '+S.ageOf(life,p);
    let body='<div class="social-summary">'+meter('Relationship',p.bond,'heart')+'</div>'+detail(p.job,p.traits.join(' · '))+
      detail('Profile',S.identities[p.gender]+' · Generosity '+p.generosity+'% · Craziness '+p.craziness+'% · Wealth '+cash(p.wealth));
    if(!p.active)body+=detail('Status',p.diedAt!==undefined?'Deceased':p.cutOff?'Contact ended':'Past relationship');
    else body+='<div class="commands">'+options.map(o=>o.id==='separate'?row('sheet','separate',o.title,o.desc,o.icon,o.reason):
      o.id==='cutoff'?row('sheet','cutoff-'+key,o.title,o.desc,o.icon,o.reason):row('social',key+'~'+o.id,o.title,o.desc,o.icon,o.reason)).join('')+
      (key==='love'&&W.isPartner(life)&&life.age>=18?S.options(life,'family').map(option).join(''):'')+'</div>';
    body+=row('sheet','faith-npc~'+key,'Beliefs & traditions',E.faithPersonal.npc(life,key).name,'book');
    body+=extra.link('relative','Trust & shared history','Memories, promises and family decisions.','family-tree',key);
    return {title:p.fullName,tag:label,body};
  }
  function assetView(id,side){
    const own=life.world.owned[id],isBuy=side==='buy';
    if(!isBuy&&own?.listing?.historical)return historicalUI.holding(life,id);
    const item=isBuy?Shop.offer(life,id):Shop.ownedItem(id,own);
    if(!item)return {title:isBuy?'Listing unavailable':'Item sold',body:detail('Off the market',isBuy?'This offer is no longer for sale. Open Assets to see the current listings.':'This item has left your possessions.')};
    const loan=life.sim.loans[id],resale=own?own.value-(loan?loan.balance:0):0;
    const property=item.category==='Property',condition=own?own.condition:item.condition;
    const source=item.listing?Shop.shops[item.shop]:null;
    let body='<div class="price-card"><span>'+esc(isBuy?'Asking price':'Resale value')+'</span><strong>'+cash(isBuy?item.price:own.value)+'</strong></div>';
    if(item.listing&&property){
      body+=detail(item.address+(G.cities[item.town]?' · '+G.label(item.town):''),(item.commercial?item.floorArea+' m² commercial space':item.beds?item.beds+(item.beds===1?' bedroom':' bedrooms'):'Studio')+' · '+item.baths+(item.baths===1?' bathroom':' bathrooms')+' · Built in '+item.built)+
        detail('Condition and rental income',condition+'% condition · '+cash(own?W.assetRent(life,id,own):Math.floor(item.rent*(condition<45?.6:1)))+' annual rental income at current condition.');
    }else if(item.listing){
      body+=detail('Vehicle details',Shop.summary(item,own))+detail('Condition',condition+'% condition'+(isBuy?(item.newCar?' · New, with delivery mileage.':' · Used.'):'.'));
      if(item.type==='van')body+=detail('Camper van','Take road trips or host a camper supper.');
    }else body+=detail(isBuy?'Ownership':'Acquired at age '+own.at,item.detail);
    body+=detail('Resale',property?(life.sim.expansion?'This year’s local change is '+((item.change+X.economy.local(life,item.town||life.town).appreciation)*100).toFixed(1)+'% before condition adjustments.':'Normal annual appreciation is '+Number((item.change*100).toFixed(1))+'%. Poor condition reduces it.'):'Depreciates each year and keeps a minimum trade-in value.');
    if(own){
      if(property&&!item.listing&&G.cities[item.town])body+=detail('Property location',G.label(item.town));
      body+=detail('Ownership',Math.round((own.share||1)*100)+'% ownership · '+condition+'% condition')+
        actionButton('repair',id,'Repair for '+cash(W.repairQuote(life,id)),'secondary wide','tools',W.repairReason(life,id));
      if(loan)body+=detail(property?'Mortgage':'Vehicle loan',cash(loan.balance)+' will be settled when you sell. Net proceeds are '+cash(resale)+'.');
    }
    const back=isBuy?actionButton('sheet',source?'store-'+item.shop:'gear-shop',source?'Back to listings':'Back to equipment','secondary','back'):actionButton('close','','Close','secondary','close');
    body+='<div class="sheet-actions">'+back+actionButton(isBuy?'buy':'sell',id,isBuy?'Buy for '+cash(item.price):'Sell for '+cash(resale),'primary',isBuy?'basket':'tag',W.possessionReason(life,id,side))+'</div>';
    if(!life.ended&&life.age>=18&&(own&&(property||item.category==='Vehicle')||isBuy&&item.category==='Vehicle'))body+=extra.link(own?'asset':'offer',own?'Manage this asset':'Finance or trade in',own?'Ownership options and running costs.':'Review the loan or select a vehicle to trade.','tools',id);
    if(isBuy&&property)body+=detail('Mortgage','Put down 20% and finance the balance over 15 years at '+((life.sim.expansion?X.economy.local(life).rate:.04)*100).toFixed(1)+'% annual interest.')+
      actionButton('mortgage',id,'Finance with '+cash(S.downPayment(item))+' down','secondary wide','key',S.mortgageReason(life,id));
    return {title:item.listing&&property?item.name:Shop.title(item),tag:source?source.name:item.category,body};
  }
  const hubs={
    invest:['Investment fund','Buy and sell units in the game’s income fund.','trend'],
    nightlife:['Nightlife & games','Nightclubs, lottery tickets and the casino.','dice'],
    leisure:['Leisure','Read, explore the outdoors or put your equipment to use.','compass'],
    health:['Mind & body','See a doctor, exercise or look after your happiness.','heart'],
    pets:['Pets','Bring home a companion and spend time together.','home'],
    fame:['Social media','Build an audience, publish posts and find sponsors.','phone'],
    crime:['Crime','Take a risk and face the consequences.','dice'],
    travel:['Travel & driving','Get a license, move cities or immigrate.','map'],
    custody:['Prison','Spend your time in custody or request an appeal.','key'],
    education:['University','Choose a major, apply to graduate school or leave a course.','school'],
    work:['Employment','Manage your current job.','bag']
  };
  const confirms=new Set(['leave-course','resign','apprentice','baby','pet-cat','pet-dog','record-pet-breed','fare','theft','fraud','repay','appeal']);
  function needsConfirm(id){return confirms.has(id)||id.startsWith('course-')||['drop-school','retire-now','surgery','casino','rehab','pickpocket','auto','burglary','robbery'].includes(id);}
  function option(o){
    return row(needsConfirm(o.id)?'sheet':'sim',needsConfirm(o.id)?'do-'+o.id:o.id,o.title,o.desc,o.icon,o.reason);
  }
  function hubRow(id){const [title,desc,ic]=hubs[id];return row('sheet','hub-'+id,title,desc,ic);}
  function hubView(group){
    const h=hubs[group];if(!h)return null;
    if(earlier()&&!['pets','crime','custody'].includes(group))return null;
    if(group==='fame'&&life.sim.timeline?.historicalRules&&E.calendar(life)<2004)return null;
    if(group==='travel')return {title:h[0],body:detail('Current home',G.label(life.town))+'<div class="commands">'+
      row('sheet','license','Take the driving test',life.age<18?'Free for students.':'The exam costs $30.','car',S.licenseReason(life))+
      row('sheet','destinations','Immigrate or move city','Choose a country and city. Moving costs '+cash(S.movingFee)+'.','map',life.ended?'Life complete':life.age<18?'Opens at 18':'')+'</div>'};
    let intro='';
    if(group==='invest')intro=detail('Invested capital',cash(life.sim.fund)+' · Estimated annual yield '+cash(S.budget(life).yieldIncome));
    if(group==='health'){
      const s=life.sim,labels=s.illnesses.map(c=>c.name+' · '+(c.chronic?'chronic':'temporary')+' · severity '+c.severity+'%').concat(s.injuries.map(i=>i.name+' · injury '+i.severity+'%'),s.addictions.map(a=>a.substance+' · '+(a.sober?'in recovery':'active')+' · severity '+a.severity+'%'));
      intro=detail('Health record',labels.join(' / ')||'No diagnosed conditions.');
    }
    if(group==='education'){
      const p=life.sim.program;
      const qualifications=[life.sim.degree,life.sim.professional,life.world.credential==='trade'||life.world.tradeQualified?'Trade certificate':null].filter(Boolean).join(' · ');
      intro=detail('Your education',p?('Studying '+(p.field==='general'?'General studies':S.programs[p.field].degree)+' · Graduation at age '+p.end) :life.job==='trainee'&&life.world.credential!=='trade'?'Paid apprenticeship · Qualification at age '+(life.world.since+4):'You are currently out of school.')+(qualifications?detail('Earned qualifications',qualifications):'');
    }
    if(group==='pets'&&life.sim.pet){
      const p=life.sim.pet;
      intro=detail(p.name,(p.type==='dog'?'Dog':'Cat')+' · '+(p.breed||'Breed unrecorded')+' · '+p.years+' '+(p.years===1?'year':'years')+' together');
    }
    if(group==='fame')intro=detail('Your audience',life.sim.account?life.sim.followers.toLocaleString('en-US')+' followers':'You have no social media account.');
    if(group==='crime')intro=detail('Your record',life.sim.record?life.sim.record+' '+(life.sim.record===1?'conviction':'convictions'):'Clean record');
    if(group==='custody')intro=detail('Your sentence',life.sim.prison+' '+(life.sim.prison===1?'year remains':'years remain')+' in custody.');
    if(group==='work')intro=detail('Current position',E.occupation(life));
    const rows=group==='leisure'?E.actionList(life).map(a=>row('activity',a[0],a[1],a[2],a[3],E.actionReason(life,a[0],-(a[4].cash||0)))):
      S.options(life,group).filter(o=>!o.id.startsWith('major-')||life.sim.program&&life.sim.program.field==='general').map(option);
    return {title:h[0],body:intro+'<div class="commands">'+rows.join('')+'</div>'};
  }
  function breedOptions(breeds,selected=''){
    return '<option value="" disabled'+(selected?'':' selected')+'>'+(breeds.length?'Choose a breed':'No matching breeds')+'</option>'+
      optionsHtml(breeds.map(breed=>[breed,breed]),selected);
  }
  function petForm(id){
    const recording=id==='record-pet-breed',pet=life.sim.pet;
    if(recording&&(!pet||pet.breed))return null;
    const type=recording?pet.type:id.slice(4),breeds=S.breeds(life,type),reason=S.reason(life,id);
    if(!breeds)return null;
    const name=recording?'':'<label for="pet-name">Pet’s name (optional)</label><input id="pet-name" maxlength="32" placeholder="'+(type==='dog'?'Pepper':'Olive')+'" autocomplete="off">';
    const intro=recording?'Choose the breed for '+pet.name+'’s record.':'Adoption costs '+cash(80)+'. Yearly care costs '+cash(95)+'.';
    const body='<p class="sheet-intro">'+esc(intro)+'</p><form id="pet-form" data-command="'+id+'" data-species="'+type+'">'+
      '<label for="pet-breed">Breed</label><input type="search" id="breed-filter" aria-label="Filter breeds" aria-controls="pet-breed" placeholder="Filter breeds" autocomplete="off" enterkeyhint="next">'+
      '<select id="pet-breed" required>'+breedOptions(breeds)+'</select>'+name+'<div class="sheet-actions">'+actionButton('close','','Cancel','secondary','close')+
      '<button id="confirm-pet" type="submit" class="primary" disabled>'+icon(type)+esc(reason||(recording?'Save breed':'Adopt for '+cash(80)))+'</button></div></form>';
    return {title:recording?pet.name+'’s breed':S.actions[id].title,body};
  }
  function updatePetForm(form,filterChanged){
    if(!form||activeRoute.sheet!=='do-'+form.dataset.command)return;
    const select=form.querySelector('#pet-breed'),breeds=S.breeds(life,form.dataset.species);
    if(filterChanged){
      const normal=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
      const query=normal(form.querySelector('#breed-filter').value),matches=breeds.filter(s=>normal(s).includes(query));
      const selected=matches.includes(select.value)?select.value:matches.length===1?matches[0]:'';
      select.innerHTML=breedOptions(matches,selected);select.value=selected;
    }
    const confirm=form.querySelector('#confirm-pet');
    if(breeds.includes(select.value)&&!S.reason(life,form.dataset.command))confirm.removeAttribute('disabled');
    else confirm.setAttribute('disabled','');
  }
  function doView(id){
    const a=S.actions[id];if(!a||!needsConfirm(id))return null;
    if(a.group==='pets')return petForm(id);
    let desc=a.desc;
    if(id.startsWith('course-')){
      const p=S.programs[id.slice(7)];
      const options=[['scholarship','Apply for a scholarship','Grades, smarts and discipline affect the decision.','school'],['cash','Pay tuition','Pay '+cash(p.fee)+' from your bank.','wallet'],['loan','Take a student loan','Borrow '+cash(p.fee)+' at 4% annual interest.','letter']];
      return {title:p.degree,tag:'University application',body:detail('Tuition',cash(p.fee)+' · '+p.years+' years')+(note&&note.declined?noteHtml():'')+'<div class="commands">'+options.map(([method,title,body,ic])=>row('funding',id+'~'+method,title,body,ic,S.fundingReason(life,id,method))).join('')+'</div>'};
    }
    if(a.group==='crime')desc+=' A conviction stays on your record and may affect future applications.';
    const reason=S.reason(life,id);
    const body=id==='baby'?'<form id="sim-name-form"><label for="sim-name">Baby’s name</label><input id="sim-name" maxlength="32" placeholder="Surprise me" autocomplete="off"><div class="sheet-actions">'+actionButton('close','','Cancel','secondary','close')+'<button type="submit" class="primary"'+(reason?' disabled':'')+'>'+icon(a.icon)+esc(reason||a.title)+'</button></div></form>':
      '<div class="sheet-actions">'+actionButton('close','','Cancel','secondary','close')+actionButton('sim',id,a.title,'primary',a.icon,reason)+'</div>';
    return {title:a.title,body:'<p class="sheet-intro">'+esc(desc)+'</p>'+body};
  }
  function budgetLines(b){
    const values=[['Salary or part-time wages',b.wages],['Pension',b.pension||0],['Side work',b.side||0],['Fund yield',b.yieldIncome||0],['Rental income',b.rent],['Business distributions',b.businessIncome||0],['Business losses',-(b.operatingLoss||0)],['Insurance',-(b.insurance||0)],['Management fees',-(b.management||0)],['Lifestyle',-(b.lifestyle||0)],['Tax',-b.tax],['Rent',-(b.housing||0)],['Living costs',-b.living],['Dependent children',-b.dependents],['Property, vehicles and pets',-b.upkeep],['Loan payments',-b.payment],['Change in bank balance',b.net]];
    const historic=life.sim.timeline?.historicalRules&&(b.year||E.calendar(life))<2000;
    const periodLabels={'Change in bank balance':'Change in cash','Property, vehicles and pets':'Upkeep','Salary or part-time wages':'Wages','Tax':'Taxes and dues','Business distributions':'Trading income'};
    const essential=['Salary or part-time wages','Tax','Living costs','Change in bank balance'];
    const lines=historic?values.filter(([label,n])=>n||essential.includes(label)).map(([label,n])=>[periodLabels[label]||label,n]):values;
    return '<dl class="ledger">'+lines.map(([label,n])=>'<div><dt>'+esc(label)+'</dt><dd>'+cash(n)+'</dd></div>').join('')+'</dl>';
  }
  function budgetView(){
    const s=life.sim,b=S.budget(life),last=s.lastBudget;
    const loanName=id=>{const item=Shop.ownedItem(id,life.world.owned[id]);return item?Shop.title(item):({tuition:'Student loan',fines:'Court fine',living:'Unpaid bills'}[id]||'Loan');};
    const loans=Object.entries(s.loans).map(([id,l])=>loanName(id)+' '+cash(l.balance)).join(' · ');
    let body=life.ended?'':subhead('Next birthday')+budgetLines(b);
    if(b.payments)body+=Object.entries(b.payments).map(([k,v])=>detail(loanName(k)+' payment',cash(v))).join('');
    if(last)body+=subhead('Last birthday · '+last.year)+budgetLines(last);
    if(s.expansion?.dispute)body+=detail('Inheritance held by executor',cash(s.expansion.dispute.amount)+' included in net worth until the dispute is settled.');
    if(s.trust)body+=detail('Held in trust',cash(s.trust)+' will transfer to your bank at age 18.');
    if(loans)body+=detail('Outstanding balances',loans)+detail('Interest this year',cash(b.interest)+' is added before payments. Any unpaid interest remains in your balance.')+option(S.options(life,'money')[0]);
    return {title:'Annual budget',body:body||detail('Estate',cash(W.netWorth(life)))};
  }
  function willView(){
    const kids=S.children(life),beneficiary=life.people[life.sim.will];
    return {title:'Last will',body:extra.link('estate','Estate planning','Weighted shares, witnesses and company succession.','letter')+detail('Current beneficiary',beneficiary?beneficiary.name:'Equal shares for all surviving children')+
      '<div class="commands">'+[['equal','Split equally','Each living child receives a share.','people'],...kids.map(([key,p])=>[key,p.name,'Leave this child your entire estate.','baby'])].map(([k,t,d,ic])=>row('will',k,t,d,ic,life.sim.will===k&&!life.sim.expansion?.double?'Selected':'')).join('')+'</div>'};
  }
  function heirsView(){
    if(!life.ended||life.sim.successor)return null;
    return {title:'Continue your family',tag:'Generation '+(life.sim.generation+1),body:'<p class="sheet-intro">Choose the child whose life you want to play. This journal will move to Past lives.</p><div class="commands">'+S.children(life).map(([key,p])=>row('sheet','heir-'+key,p.name,'Age '+S.ageOf(life,p)+' · Estate share '+cash(S.share(life,key)),'people')).join('')+'</div>'};
  }
  function heirView(key){
    const p=life.people[key];if(!p||!life.ended||life.sim.successor||!S.children(life).some(([k])=>k===key))return null;
    const age=S.ageOf(life,p),part=S.estate(life)[key]||{cash:0,assets:{},total:0},names=Object.entries(part.assets).map(([id,asset])=>Shop.title(Shop.ownedItem(id,asset)));
    return {title:'Play as '+p.name+'?',body:detail('Age '+age,cash(part.cash)+(age<18?' in trust until 18.':' in cash.')+(names.length?' Inherited assets: '+names.join(', ')+'.':''))+
      '<div class="sheet-actions">'+actionButton('sheet','legacy','Choose another child','secondary','back')+actionButton('heir',key,'Continue as '+p.name,'primary','sprout')+'</div>'};
  }
  function courtView(){
    const c=life.sim.court;if(!c)return null;
    return {title:'Your court hearing',tag:S.actions[c.id].title,body:detail('Charge', 'If convicted at trial, you face '+c.term+' '+(c.term===1?'year':'years')+' in custody and a '+cash(c.fine)+' fine.')+
      '<div class="commands">'+row('plea','plea','Plead guilty','Accept the fine and reduce the sentence by one year.','letter')+row('plea','trial','Go to trial','The court can clear you or impose the full sentence.','book')+row('plea','counsel','Hire defense counsel','A '+cash(120)+' fee improves your chance at trial.','bag')+'</div>'};
  }
  function interviewView(id){
    if(!W.openings[id])return null;
    const prompt=W.interviewPrompt(id);
    const why=W.jobReason(life,id);
    return {title:E.jobs[id][0],tag:'Interview · '+W.openings[id][0],body:detail('Annual salary',cash(X.economy.salary(life,id,E.jobs))+' before taxes and expenses.')+detail('The interviewer asks',prompt.question)+
      '<div class="commands">'+prompt.answers.map(([k,t,ic])=>row('interview',id+'~'+k,t,'',ic,why)).join('')+'</div>'};
  }
  function modal(key){
    if(key==='faith-encounter'){
      const event=E.faithEncounters.current(life);if(!event)return null;
      return {title:event.title,tag:'Community decision',body:(event.source?detail('Historical record',event.fact+' — '+event.source):'')+
        detail(event.source?'Local simulation':event.fact,event.prompt)+row('faith-encounter','help',event.help,'Contribute to the family archive.','people')+
        row('faith-encounter','listen','Attend as a listener','Hear what your neighbors have to say.','book')+
        row('faith-encounter','decline','Decline the invitation','Record your decision.','back')};
    }
    if(key.startsWith('faith-')){
      const page=faithUI.sheet(life,key);
      if(page&&key==='faith-home'){
        const event=E.faithEncounters.current(life);
        if(event)page.body+=row('sheet','faith-encounter',event.title,'A community decision in '+historicalLabel(life.town,E.calendar(life))+'.','people');
      }
      if(page&&key==='faith-museum'){
        const movements=E.faithMovements.list(life);
        if(movements.length)page.body+=subhead('Movement archives')+movements.map(m=>row('sheet','faith-movement~'+encodeURIComponent(m.id),
          m.name,m.foundedYear+' · Founded by '+m.founderName,'archive')).join('');
      }
      if(page&&key==='faith-museum')for(const entry of life.sim.faithEncounters||[]){
        const event=E.faithEncounters.periods.find(e=>e.id===entry.id);
        if(event)page.body+=detail(entry.year+' · '+event.title,entry.person+' · '+({help:event.artifact,listen:'Attended the discussion',decline:'Declined the invitation'})[entry.choice]);
      }
      return page;
    }
    if(key==='hist-museum'){
      const museum=historicalUI.sheet(life,game,key);
      museum.body+=row('sheet','faith-museum','Religious history','Founders, teachings and family records.','archive');
      return museum;
    }
    if(key.startsWith('hist-')||key==='archive'||/^past-\d+(?:~.*)?$/.test(key))return historicalUI.sheet(life,game,key);
    if(earlier()&&(key==='matches'||key.startsWith('match-')||['license','jobs','destinations','real-estate','dealerships','gear-shop'].includes(key)||/^(?:job|store|buy|move)-/.test(key)))return null;
    if(earlier()&&key.startsWith('xp-')&&!/^(?:xp-(?:family|relative|branch|estate|hobbies)(?:~|$)|xp-confirm~(?:family|relative|estate|hobbies)~)/.test(key))return null;
    if(key.startsWith('xp-'))return extra.sheet(life,key);
    if(key==='save-slots')return {title:'Character slots',body:'<div class="commands">'+disk.slots().map(s=>row('slot',String(s.n),'Slot '+s.n+(s.name?' · '+s.name:''),s.occupied?'Age '+s.age:'Start a separate random life','save',s.active?'Playing':'')).join('')+'</div>'};
    if(key==='recover-confirm')return {title:'Restore previous autosave?',body:detail('Previous action','Restore the snapshot before the last saved change in this slot.')+actionButton('save-recover','','Restore previous autosave','primary wide','back')};
    if(key==='file-import')return {title:'Import a backup',body:detail('Choose a file','Review the backup before replacing the life in slot '+disk.current+'.')+(window.PocketFiles?actionButton('pick-file','','Choose backup file','primary wide','archive'):'<label class="file-label">Choose backup file<input id="backup-file" type="file" accept=".json,application/json,text/plain"></label>')};
    if(key==='import-confirm'&&incomingBackup)return {title:'Restore imported life?',body:detail(importDetails.name,'Age '+importDetails.age+' · '+cash(importDetails.cash)+' · '+importDetails.archives+' archived lives.')+detail('Slot '+disk.current,'Your current life will become the previous autosave in this slot.')+actionButton('import-file','','Restore this backup','primary wide','save')};

    if(key==='class'||key==='workplace'){
      const roster=members(key);return {title:key==='class'?'Class directory':'People at work',tag:key==='class'?E.state(life).currentSchool:E.state(life).employer,body:roster.length?'<div class="commands">'+roster.map(([k,p])=>personRow(k,p)).join('')+'</div>':detail('Directory','No current contacts.')};
    }
    if(/^year-\d+$/.test(key)){
      const age=Number(key.slice(5)),e=life.log.find(x=>x.age===age&&x.kind==='Year');if(!e)return null;
      return {title:'Age '+age,tag:'Year '+(life.born+age),body:detail('Annual statement',e.body)+(age===life.age&&life.sim.lastBudget?budgetLines(life.sim.lastBudget):'')};
    }
    if(key==='outcome'){
      const result=life.sim.review;if(!result)return null;
      const labels={...metricNames};for(const p of Object.values(life.people))labels['bond/'+p.id]=p.name+' relationship';
      const lines=Object.entries({...result.delta,cash:result.delta.cash||0}).map(([k,v])=>{
        const money=['cash','debt','netWorth','trust','annualWages','annualPension','annualSide','fund'].includes(k),name=k==='cash'?(earlier()&&E.calendar(life)<1900?'Cash on hand':'Bank balance'):labels[k]||k;
        return '<div><dt>'+esc(name)+'</dt><dd>'+esc((v>0?'+':'')+(money?cash(v):String(v)))+'</dd></div>';
      }).join('');
      return {title:result.title,tag:'Outcome · Age '+life.age,body:'<p class="story-text">'+esc(result.text)+'</p><dl class="ledger">'+lines+'</dl>'+actionButton('ack',result.from,'Continue','primary wide','check')};
    }
    if(key==='death'&&life.ended)return {title:'Life complete',tag:'Generation '+life.sim.generation,body:legacy(life,true)};
    if(key==='checkpoint'){
      const c=disk.checkpoint();
      return {title:'Save & load · Slot '+disk.current,body:(saveNotice||disk.message?detail('Save status',saveNotice||disk.message):'')+extraSaveRows()+detail('Saved checkpoint',c?c.active.name+' · Age '+c.active.age+' · '+cash(c.active.cash):'No manual save yet.')+
       '<div class="commands">'+row('manual-save','','Save this game',c?'Replace the existing checkpoint.':'Keep this character and all past lives.','save')+
       row('sheet','load-confirm','Load checkpoint','Restore the character, journal and archived lives.','back',c?'':'Save a checkpoint first')+'</div>'};
    }
    if(key==='load-confirm')return {title:'Load saved game?',body:detail('Restore checkpoint','Progress since the manual save will be replaced.')+actionButton('manual-load','','Load saved game','primary wide','back')};
    if(key==='net')return {title:'Net worth breakdown',body:detail('Bank balance',cash(life.cash))+detail('Possessions',cash(W.possessions(life)))+detail('Investments',cash(life.sim.fund+X.portfolio(life)))+detail('Business equity',cash(X.companyValue(life)))+detail('In trust',cash(life.sim.trust))+(life.sim.expansion?.dispute?detail('Contested inheritance',cash(life.sim.expansion.dispute.amount)):'')+detail('Outstanding debt',cash(S.debt(life)))+detail('Total net worth',cash(W.netWorth(life)))};
    if(key.startsWith('cutoff-')){const who=key.slice(7),p=life.people[who];if(!p)return null;return {title:'Cut off '+p.name+'?',body:detail('End contact','You will no longer visit or speak to this person.')+actionButton('cutoff',who,'End contact','primary wide','exit')};}
    if(key==='decision')return decisions();
    if(key==='license')return {title:'Driving test',body:detail('Road signs',S.drivingTest.question)+'<div class="commands">'+
      S.drivingTest.answers.map(([k,t,ic])=>row('license',k,t,'',ic,S.licenseReason(life))).join('')+'</div>'};
    if(key==='destinations'){
      if(life.ended||life.age<18)return null;
      if(!G.cities[movingTown])movingTown=life.town;
      return {title:'Choose a new home',tag:'Moving · '+cash(S.movingFee),body:
        detail('Current home',G.label(life.town))+locationFields(movingTown)+
        '<div id="moving-actions">'+moveActions(movingTown)+'</div>'};
    }
    if(key.startsWith('move-')){
      const town=key.slice(5);if(!G.cities[town]||life.ended||life.age<18)return null;
      movingTown=town;
      const abroad=G.international(life.town,town),verb=abroad?'Immigrate':'Move';
      return {title:verb+' to '+G.cities[town].name+'?',tag:abroad?'International move':'Domestic move',body:
        detail('Leaving',G.label(life.town))+detail('New home',G.label(town))+
        extra.link('visa','Local conditions & immigration','See local costs, visa routes and eligibility.','passport',town)+(abroad?detail('Entry clearance',X.economy.papers(life,town).citizen?'Entry as a citizen.':X.economy.papers(life,town).valid?'Current permit accepted.':X.economy.papers(life,town).eligible?'Your settlement application qualifies. Confirming issues a two-year visa.':X.economy.papers(life,town).reason):'')+detail('Moving fee',cash(S.movingFee)+' for your household. Bank balance '+cash(life.cash)+'.')+
        '<div class="sheet-actions">'+actionButton('sheet','destinations','Choose another city','secondary','back')+
        actionButton('move',town,abroad?'Immigrate':'Move household','primary','map',S.moveReason(life,town))+'</div>'};
    }
    if(key==='residences'){
      const moves=life.sim.residences||[];
      return {title:'Residence history',body:detail('Birthplace',historicalLabel(life.sim.birthplace,life.born))+moves.map(m=>
        detail('Age '+m.age+' · '+(life.born+m.age),historicalLabel(m.from,life.born+m.age)+' → '+historicalLabel(m.to,life.born+m.age))).join('')+
        actionButton('sheet','profile','Character profile','secondary wide','back')};
    }
    if(key.startsWith('hub-'))return hubView(key.slice(4));
    if(key.startsWith('do-'))return doView(key.slice(3));
    if(key==='budget')return budgetView();
    if(key==='will'&&life.age>=18&&!life.ended)return willView();
    if(key==='legacy')return heirsView();
    if(key.startsWith('heir-'))return heirView(key.slice(5));
    if(key==='court')return courtView();
    if(key==='random-confirm')return {title:'Start a random life?',body:detail('Past lives','Your current life will be archived.')+actionButton('random-life','','Start a random life','primary wide','dice')};
    if(key==='menu')return {title:'Game menu',body:'<div class="commands">'+(canEdit()?row('edit-form','','Customize character','Era, birth year, birthplace and portrait.','pencil'):'')+
      row('new-form','','Start a custom life','Choose an era, year and birthplace.','sprout')+row('sheet','random-confirm','Start a random life','Meet a new character.','dice')+
      row('sheet','appearance','Journal appearance',game.settings.theme&&game.settings.theme!=='auto'?'Theme locked':'Follows the calendar','palette')+
      row('sheet','motion','Motion settings',game.settings.motion==='reduced'?'Reduced motion':'Use device preference','phone')+
      row('sheet','checkpoint','Save slots & backups','Switch lives, recover or transfer a save.','save')+row('sheet','help','How to play','Aging, choices and free time.','book')+(game.archive.length?row('sheet','archive','Past lives',game.archive.length+' saved','archive'):'')+'</div><p class="version">Pocket Years · Faith &amp; Civilization · v1.1</p>'};
    if(key==='appearance'){
      const selected=game.settings.theme||'auto';
      const themes=[{id:'auto',name:'Follow the calendar',icon:'clock'},...eraUI.themes];
      return {title:'Journal appearance',body:'<div class="commands theme-options">'+themes.map((t,i)=>{
        const next=themes[i+1],range=i===0?'Changes as your family ages.':t.first+(next?'–'+(next.first-1):' onward');
        return '<button type="button" class="command" data-do="pick-theme" data-key="'+t.id+'" aria-pressed="'+(selected===t.id)+'"><span class="theme-sample" data-theme="'+t.id+'">'+icon(t.icon)+'</span><span class="command-copy"><strong>'+esc(t.name)+'</strong><small>'+range+'</small></span>'+(t.id===selected?icon('check','selected-mark'):'')+'</button>';
      }).join('')+'</div>'};
    }
    if(key==='motion')return {title:'Motion settings',body:'<p class="sheet-intro">Choose how birthdays, stat changes and story panels move.</p><div class="motion-options">'+
      ['system','reduced'].map(k=>'<button class="radio" data-do="motion" data-key="'+k+'" aria-pressed="'+(k===game.settings.motion)+'">'+icon(k==='system'?'phone':'pause')+'<span><strong>'+(k==='system'?'Follow device settings':'Reduce motion')+'</strong><small>'+(k==='system'?'Full motion when your device allows it.':'Apply changes immediately with minimal movement.')+'</small></span>'+(k===game.settings.motion?icon('check','selected-mark'):'')+'</button>').join('')+'</div>'};
    if(key==='help')return {title:'How to play',body:detail('Age up','Tap the green button in the middle. If a decision is waiting, choose a response first. Your answer goes straight into the journal.')+
      detail('Spend your year','Open Occupation for school and work. Use the other dock buttons for assets, relationships and activities. Each choice shows when it can be used again. A part-time job is the only way to earn money before age 18.')+
      detail('Follow the consequences','Your school, workplace and family can bring you decisions. Tap a year beside its age to see the numbers.')+
      detail('World locations','City data adapted from Natural Earth and GeoNames. GeoNames is licensed under CC BY 4.0. Geographic sources and attribution are in Location credits.')+
      actionButton('sheet','location-credits','Location credits','secondary wide','map')+detail('Continue your family','Use Assets to write a will. At the end of a life, choose a surviving child to play the next generation.')+
      detail('Keep your story','Your progress saves on this device after each choice. Open Journal for your keepsakes and past lives.')};
    if(key==='location-credits')return {title:'Location credits',body:detail('Natural Earth','Public-domain populated places from naturalearthdata.com.')+
      detail('GeoNames','Place names adapted from GeoNames and the DataHub World Cities dataset. geonames.org · Creative Commons Attribution 4.0 · creativecommons.org/licenses/by/4.0/')+
      detail('Country names','Country Codes from DataHub, ISO 3166 identifiers and display names adapted from Unicode CLDR. © 2001–2026 Unicode, Inc. · unicode.org/license.txt')};
    if(key==='profile')return {title:life.name,body:profileBody()};
    if(key==='stats')return {title:'Your stats',body:'<div class="stat-details">'+Object.entries(E.statNames).map(([k,label])=>meter(label,life.stats[k],statIcons[k][0])).join('')+meter('Karma',life.hidden.karma,'leaf')+meter('Notoriety',life.hidden.notoriety,'flag')+'</div>'};
    if(key==='new'||key==='edit'&&canEdit())return {title:key==='edit'?'Customize character':'Start a new life',body:formBody(key==='edit')};
    if(key==='jobs')return {title:'Job openings',body:jobsBody()};
    if(key.startsWith('job-'))return interviewView(key.slice(4));
    if(key==='real-estate')return marketDirectory('Property');
    if(key==='dealerships')return marketDirectory('Vehicle');
    if(key==='gear-shop')return gearView();
    if(key.startsWith('store-'))return stockView(key.slice(6));
    if(key.startsWith('buy-'))return assetView(key.slice(4),'buy');
    if(key.startsWith('sell-'))return assetView(key.slice(5),'sell');
    if(key.startsWith('person-'))return personView(key.slice(7));
    if(key==='matches'&&life.age>=18&&!life.ended&&W.matches(life).length)return {title:'Dating app',body:'<div class="commands">'+W.matches(life).map((m,i)=>row('sheet','match-'+i,m.fullName,'Age '+m.age+' · '+m.job,'heart',W.matchReason(life,i))).join('')+'</div>'};
    if(/^match-[0-2]$/.test(key)&&life.age>=18&&W.matches(life).length){
      const i=Number(key.slice(6)),m=W.matches(life)[i];
      return {title:m.fullName,tag:'Dating profile',body:detail('Age '+m.age+' · '+m.job,'Describes themself as '+m.trait+'.')+actionButton('match',String(i),'Send introduction · $15','primary wide','chat',W.matchReason(life,i))};
    }
    if(key==='date')return {title:'Go on a date',body:detail('A first date',earlier()?'Take a walk and meet someone in your community.':life.age<18?'Walk home with someone after school.':'Spend $35 to meet someone new over coffee.')+'<div class="sheet-actions">'+actionButton('close','','Cancel','secondary','close')+actionButton('date','','Meet someone','primary','heart',W.dateReason(life))+'</div>'};
    if(key==='separate')return {title:life.people.love.role==='Spouse'?'File for divorce?':'End the relationship?',body:detail(life.people.love.name,life.people.love.role==='Spouse'?'Your spouse will receive '+cash(W.separationAmount(life))+' from your bank balance.':'This will move your partner into your past relationships.')+'<div class="sheet-actions">'+actionButton('close','','Keep relationship','secondary','heart')+actionButton('split','','Separate','primary','broken-heart')+'</div>'};
    if(key==='adopt')return {title:'Welcome a child',tag:'Family',body:'<p class="sheet-intro">Spend '+cash(W.familyCost(life))+' getting your home ready. Choose a name or let the game pick one.</p><form id="child-form"><label for="child-name">Child’s name</label><input id="child-name" placeholder="Surprise me" value="'+esc(childDraft)+'" maxlength="32" autocomplete="off"><div class="sheet-actions">'+actionButton('close','','Cancel','secondary','close')+'<button type="submit" class="primary"'+(W.familyReason(life)?' disabled':'')+'>'+icon('baby')+esc(W.familyReason(life)||'Welcome home')+'</button></div></form>'};
    if(key==='wallet')return {title:'Bank balance',body:detail(cash(life.cash),'Your next birthday brings in '+cash(life.ended?0:E.income(life))+'.')+actionButton('tab','assets','Open assets','primary wide','coin')};
    return null;
  }
  function clearDrag(){
    if(!drag)return;
    if(drag.frame && typeof window.cancelAnimationFrame==='function')window.cancelAnimationFrame(drag.frame);
    drag.grip.classList.remove('dragging');drag=null;
  }
  function paintSheet(key,reason){
    clearDrag();
    const model=key?modal(key):null;
    if(!model){
      if(key){activeRoute={tab:activeRoute.tab,sheet:null};writeRoute(activeRoute,true);}
      if(openPanel){
        const leaving=openPanel;openPanel=null;
        leaving.style.pointerEvents='none';leaving.setAttribute('aria-hidden','true');leaving.setAttribute('inert','');
        M.close(leaving,()=>leaving.remove());
      }
      document.body.classList.remove('dialog-open');shell.removeAttribute('aria-hidden');shell.removeAttribute('inert');
      draft=null;childDraft='';
      if(returnFocus){
        const el=Array.from(shell.querySelectorAll('button[data-do]')).find(x=>x.dataset.do===returnFocus.action&&x.dataset.key===returnFocus.key);
        if(el)el.focus({preventScroll:true});returnFocus=null;
      }
      return;
    }
    const locked=!!E.blocking(life);
    const swap=!!openPanel, same=swap&&openPanel.dataset.key===key;
    if(!openPanel){openPanel=document.createElement('div');openPanel.className='shade';overlay.appendChild(openPanel);}
    openPanel.dataset.key=key;
    openPanel.innerHTML='<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">'+(locked?'':'<div class="sheet-grip"></div>')+'<div class="sheet-head"><div>'+(model.tag?'<div class="eyebrow">'+esc(model.tag)+'</div>':'')+'<h2 id="sheet-title">'+esc(model.title)+'</h2></div>'+(locked?'':actionButton('close','','Close','icon-button sheet-close','close'))+'</div>'+(model.art?image(model.art,'sheet-token'):'')+model.body+'</section>';
    const panel=openPanel.querySelector('.sheet');
    document.body.classList.add('dialog-open');panel.focus({preventScroll:true});shell.setAttribute('aria-hidden','true');shell.setAttribute('inert','');
    if(!same)M.open(openPanel,panel,swap);
    if(same&&reason==='swatch'){const selected=panel.querySelector('button[data-do="swatch"][aria-pressed="true"]');if(selected)selected.focus({preventScroll:true});}
    if(same&&reason==='motion'){const selected=panel.querySelector('button[data-do="motion"][aria-pressed="true"]');if(selected)selected.focus({preventScroll:true});}
  }
  function display(r,reason){
    if(activeRoute?.sheet==='import-confirm'&&r.sheet!=='import-confirm'&&incomingBackup)clearImport();
    const forced=E.blocking(life);
    if(forced&&(r.sheet!==forced||r.tab!=='life')){r={tab:'life',sheet:forced};writeRoute(r,true);}
    const old=activeRoute,tabChanged=!old||old.tab!==r.tab;
    const pageChanged=tabChanged||['age','choice','action','newlife','filter','edit','initial'].includes(reason);
    activeRoute=r;
    if(pageChanged){
      syncShell(r.tab);const page=byId('page');page.dataset.screen=r.tab;page.innerHTML=pages[r.tab]();if(tabChanged)page.scrollTop=0;
      const feedScroll=byId('feed-scroll');if(feedScroll&&reason!=='filter')feedScroll.scrollTop=feedScroll.scrollHeight;
      if(tabChanged)window.scrollTo(0,0);
      if(tabChanged&&old)M.page(page,navOrder.indexOf(r.tab)-navOrder.indexOf(old.tab));
      if(reason==='age'){window.scrollTo(0,0);M.age(byId('current-age'));M.addEntry(page.querySelector('[data-new-year]'));if(life.ended||life.age%10===0||[5,18,22,65].includes(life.age))M.celebrate(byId('burst'));}
      if(reason==='choice'||reason==='action')M.addEntry(page.querySelector('[data-new-entry]'));
    }
    if(!old||old.sheet!==r.sheet||['swatch','shuffle','motion'].includes(reason))paintSheet(r.sheet,reason);
  }
  function extraSaveRows(){return '<div class="commands">'+row('sheet','save-slots','Character slots','Three independent lives with their own autosaves.','people')+row('sheet','recover-confirm','Recover previous autosave','Undo the last saved change in this slot.','back',disk.hasBackup?'':'No previous autosave')+row('export-file','','Export backup file','Save this life and its family archive as JSON.','archive')+row('sheet','file-import','Import backup file','Restore a file from this device.','save')+'</div>';}
  function switchGame(next){
    if(!next)return false;game=next;life=next.active;previousLife=null;previousStats=null;historyLimit=12;journalLimit=16;journalFilter='highlights';assetSort='recent';note=null;draft=null;movingTown=null;saveNotice='';M.mode(game.settings.motion);
    go('life',E.blocking(life),true,'newlife');return true;
  }
  function clearImport(){
    incomingBackup=null;importDetails=null;if(window.PocketFiles)window.PocketFiles.consumed();
  }
  function pickedBackup(raw){
    if(!raw)return;const trial=disk.inspectFile(raw);
    if(!trial){clearImport();saveNotice=disk.message;showSheet('checkpoint');say(saveNotice);return;}
    incomingBackup=String(raw);importDetails={name:trial.active.name,age:trial.active.age,cash:trial.active.cash,archives:trial.archive.length};showSheet('import-confirm');
  }
  window.pocketFileReady=function(){if(!window.PocketFiles||E.blocking(life))return;const raw=window.PocketFiles.pending();if(raw)pickedBackup(raw);};
  function applyResult(res){
    if(!res)return;
    note=res;persist();
    const forced=E.blocking(life);
    if(forced)go('life',forced,!!activeRoute.sheet,'action');
    else if(activeRoute.sheet)dismiss('action');else display(activeRoute,'action');
    if(!M.reduced&&/promot|certif|financ|bought|buy|opened|start a |achievement|renovat|invest|trade in/i.test(res.title))M.celebrate(byId('burst'));
    say(res.text);
  }
  function advance(){
    if(life.ended){showSheet('death');return;}
    if(life.sim.court){showSheet('court');return;}
    if(!life.event.resolved&&!life.event.optional){showSheet('decision');return;}
    if(!E.advance(life))return;
    historyLimit=12;note=null;persist();
    const next=life.ended?'death':E.blocking(life);if(next)go('life',next,false,'age');else display({tab:'life',sheet:null},'age');
    say(life.ended?'Life complete at age '+life.age:'Age '+life.age);
  }
  function startLife(next){
    if(!next)return;
    E.startNext(game,next);life=game.active;
    historyLimit=12;journalLimit=16;journalFilter='highlights';note=null;draft=null;movingTown=null;
    persist();go('life',null,true,'newlife');window.scrollTo(0,0);say('A new life begins.');
  }
  document.addEventListener('click',ev=>{
    if(ev.target===openPanel){dismiss();return;}
    const b=ev.target.closest('button[data-do]');if(!b||b.disabled)return;
    const act=b.dataset.do,key=b.dataset.key||'';
    if(activeRoute.sheet && (!openPanel || !openPanel.contains(b)))return;
    if(!activeRoute.sheet && overlay.contains(b))return;
    if(act==='faith-encounter'&&activeRoute.sheet==='faith-encounter'){applyResult(E.faithPerform(life,{group:'encounter',id:key}));return;}
    if(act==='faith-run'){applyResult(E.faithPerform(life,faithUI.command(life,activeRoute.sheet,key)));return;}
    if(act==='hist-run'&&activeRoute.sheet===key&&key.startsWith('hist-review~')){applyResult(historicalUI.perform(life,key));return;}
    if(act==='hist-relocate'&&activeRoute.sheet==='hist-settle~'+key&&earlier()){applyResult(S.relocate(life,key));return;}
    if(act==='xp-run'||act==='xp-confirm'){
      const current=activeRoute.sheet||'';if(!current.startsWith('xp-'))return;
      const [area,ref='',arg='',id='']=current.slice(3).split('~');
      if(act==='xp-confirm'){if(area==='confirm'&&id===key)applyResult(X.perform(life,ref,arg,id));}
      else if(area!=='confirm')applyResult(X.perform(life,area,ref,key));return;
    }
    if(act==='asset-sort'&&['recent','value','condition','name'].includes(key)){assetSort=key;display(activeRoute,'filter');return;}
    if(act==='slot'&&activeRoute.sheet==='save-slots'){if(switchGame(disk.select(Number(key),game)))say('Switched to slot '+disk.current+'.');else say(disk.message||'Could not switch slots.');return;}
    if(act==='save-recover'&&activeRoute.sheet==='recover-confirm'){if(switchGame(disk.recover()))say('Previous autosave recovered.');return;}
    if(act==='export-file'&&activeRoute.sheet==='checkpoint'){
      const json=disk.exportFile(game);
      if(window.PocketFiles)window.PocketFiles.exportFile(json);
      else{const url=URL.createObjectURL(new Blob([json],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Pocket-Years-backup.json';document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1500);}
      return;
    }
    if(act==='pick-file'&&activeRoute.sheet==='file-import'&&window.PocketFiles){window.PocketFiles.importFile();return;}
    if(act==='import-file'&&activeRoute.sheet==='import-confirm'&&incomingBackup){
      const next=disk.importFile(incomingBackup);clearImport();const message=disk.message;saveNotice=message;
      if(!switchGame(next))showSheet('checkpoint');say(message);return;
    }
    if(act==='ack'&&activeRoute.sheet==='outcome'&&life.sim.review&&key===life.sim.review.from){
      if(E.acknowledge(life)){persist();const next=E.blocking(life);if(next)go('life',next,true,'choice');else{dismiss('choice');window.pocketFileReady();}}return;
    }
    if(act==='manual-save'&&activeRoute.sheet==='checkpoint'){
      if(disk.manual(game)){paintSheet('checkpoint','saved');say('Manual checkpoint saved.');}else{say('Could not save the checkpoint.');paintSheet('checkpoint','saved');}return;
    }
    if(act==='manual-load'&&activeRoute.sheet==='load-confirm'){
      const restored=disk.restore();if(!restored){say('Could not load this checkpoint.');return;}
      game=restored;life=game.active;previousLife=null;previousStats=null;historyLimit=12;note=null;M.mode(game.settings.motion);go('life',null,true,'newlife');say('Checkpoint restored.');return;
    }
    if(act==='random-life'&&(life.ended||activeRoute.sheet==='random-confirm')){startLife(E.makeLife({birthYear:2026}));return;}
    if(act==='jobs-filter'&&activeRoute.sheet==='jobs'){jobFilter=key==='all'?'all':'eligible';paintSheet('jobs','filter');return;}
    if(act==='repair'&&activeRoute.sheet==='sell-'+key){applyResult(W.repair(life,key));return;}
    if(act==='cutoff'&&activeRoute.sheet==='cutoff-'+key){applyResult(W.social(life,key,'cutoff'));return;}
    if(act==='occupation'){
      if(life.sim.prison){go('activities','hub-custody');return;}
      go(life.age<18||life.sim.program?'school':'career');return;
    }
    if(act==='tab'){go(key,null,!!activeRoute.sheet);return;}
    if(act==='central'){if(ev.detail===2)return;if(activeRoute.tab!=='life')go('life',null,true);advance();return;}
    if(act==='place-hit'&&byId('place-search')){applyPlaceHit(key);return;}
    if(act==='sheet'){
      if(key.startsWith('faith-')&&!life.sim.faithWorld?.institutions&&!life.ended&&!E.blocking(life)){E.faithInstitutions.initialize(life);persist();}
      if(key.startsWith('xp-')&&!life.sim.expansion){X.activate(life);persist();}
      if(key==='destinations'&&!(activeRoute.sheet||'').startsWith('move-'))movingTown=life.town;
      showSheet(key);return;
    }
    if(act==='close'){if(activeRoute.sheet==='import-confirm')clearImport();dismiss();return;}
    if(act==='choose'){
      if(activeRoute.sheet!=='decision'||b.dataset.event!==life.event.id||Number(b.dataset.age)!==life.age)return;
      if(E.decide(life,Number(key))){persist();go('life','outcome',true,'choice');say(life.outcome.text);}return;
    }
    if(act==='older'){historyLimit+=6;display(activeRoute,'filter');return;}
    if(act==='more'){journalLimit+=18;display(activeRoute,'filter');return;}
    if(act==='filter'){journalFilter=key;journalLimit=16;display(activeRoute,'filter');return;}
    if(act==='career'){applyResult(W.career(life,key));return;}
    if(act==='license'&&activeRoute.sheet==='license'){applyResult(S.takeTest(life,key));return;}
    if(act==='move'&&activeRoute.sheet==='move-'+key){applyResult(S.relocate(life,key));return;}
    if(act==='interview'){
      const [id,answer]=key.split('~');if(activeRoute.sheet==='job-'+id)applyResult(W.interview(life,id,answer));return;
    }
    if(act==='mortgage'&&activeRoute.sheet==='buy-'+key){applyResult(S.mortgage(life,key));return;}
    if(act==='funding'){
      const [id,method]=key.split('~');if(activeRoute.sheet!=='do-'+id)return;
      const result=S.perform(life,id,method);if(result&&result.declined){note=result;persist();paintSheet(activeRoute.sheet,'funding');say(result.text);}else applyResult(result);return;
    }
    if(act==='sim'&&(!needsConfirm(key)||activeRoute.sheet==='do-'+key)){applyResult(S.perform(life,key));return;}
    if(act==='plea'&&activeRoute.sheet==='court'){applyResult(S.court(life,key));return;}
    if(act==='will'&&activeRoute.sheet==='will'){applyResult(S.setWill(life,key));return;}
    if(act==='heir'&&activeRoute.sheet==='heir-'+key){startLife(E.continueAs(life,key));return;}
    if(act==='activity'){applyResult(E.act(life,key));return;}
    if((act==='buy'||act==='sell')&&activeRoute.sheet===act+'-'+key){applyResult(W.trade(life,key,act));return;}
    if(act==='visit-all'){
      if(activeRoute.tab==='people'&&!activeRoute.sheet&&byId('page').contains(b)&&ev.detail!==2)applyResult(W.visitAll(life));
      return;
    }
    if(act==='social'){const [person,id]=key.split('~');applyResult(W.social(life,person,id));return;}
    if(act==='split'&&activeRoute.sheet==='separate'){applyResult(W.social(life,'love','separate'));return;}
    if(act==='match'&&activeRoute.sheet==='match-'+key){applyResult(W.match(life,Number(key)));return;}
    if(act==='date'&&activeRoute.sheet==='date'){applyResult(W.meet(life));return;}
    if(act==='new-form'||act==='edit-form'){draft=null;showSheet(act==='new-form'?'new':'edit');return;}
    if(act==='shuffle'){const edit=activeRoute.sheet==='edit',year=draft.birthYear,era=draft.era,legacyBirth=draft.legacyBirth;draft=makeDraft(false);Object.assign(draft,{edit,birthYear:year,era,legacyBirth});paintSheet(activeRoute.sheet,'shuffle');return;}
    if(act==='swatch'){readDraft();draft.skin=Number(key);paintSheet(activeRoute.sheet,'swatch');return;}
    if(act==='pick-theme'&&activeRoute.sheet==='appearance'&&(key==='auto'||eraUI.themes.some(t=>t.id===key))){
      game.settings.theme=key;persist();syncShell(activeRoute.tab);paintSheet('appearance','theme');
      const picked=openPanel.querySelector('button[data-do="pick-theme"][aria-pressed="true"]');if(picked)picked.focus({preventScroll:true});
      say(key==='auto'?'The journal follows the calendar.':'Journal theme locked.');return;
    }
    if(act==='motion'){game.settings.motion=key==='reduced'?'reduced':'system';M.mode(game.settings.motion);persist();paintSheet('motion','motion');say('Motion preference saved.');}
  });
  document.addEventListener('input',ev=>{
    if(ev.target.id==='place-search')locationSearch();
    if(ev.target.id==='breed-filter')updatePetForm(ev.target.closest('form'),true);
  });
  document.addEventListener('change',ev=>{
    if(ev.target.id==='birth-era'||ev.target.id==='birth-year'){changeBirthYear(ev.target.id==='birth-era');return;}
    if(ev.target.id==='pet-breed'){updatePetForm(ev.target.closest('form'),false);return;}
    if(ev.target.id==='backup-file'&&activeRoute.sheet==='file-import'){
      const file=ev.target.files&&ev.target.files[0];if(!file)return;
      if(file.size>8388608){saveNotice='This backup exceeds the 8 MB limit.';showSheet('checkpoint');return;}
      const reader=new FileReader();reader.onload=()=>pickedBackup(reader.result);reader.onerror=()=>{saveNotice='The file could not be read.';showSheet('checkpoint');};reader.readAsText(file);return;
    }
    if(ev.target.id==='town'&&draft&&!byId('place-search')){draft.town=ev.target.value;updateBirthBeliefs();}
    if(!byId('place-search'))return;
    if(ev.target.id==='country'){
      const c=G.countries[ev.target.value];if(c)setPickerTown(c.cities[0].id);
    }else if(ev.target.id==='town')setPickerTown(ev.target.value);
  });
  document.addEventListener('submit',ev=>{
    if(ev.target.id==='faith-form'){
      ev.preventDefault();
      if(openPanel?.contains(ev.target)){
        const command=faithUI.form(life,activeRoute.sheet,ev.target);
        if(!command)return;
        const result=E.faithPerform(life,command);
        if(result)applyResult(result);
        else ev.target.querySelector('.faith-error').textContent='That decision is unavailable. Check the details and try again.';
      }
      return;
    }
    if(ev.target.id==='pet-form'){
      ev.preventDefault();
      const form=ev.target,id=form.dataset.command;
      if(!openPanel||!openPanel.contains(form)||activeRoute.sheet!=='do-'+id)return;
      const breed=form.querySelector('#pet-breed').value;
      if(!S.breeds(life,form.dataset.species).includes(breed))return;
      const input=id==='record-pet-breed'?breed:{breed,name:form.querySelector('#pet-name').value};
      applyResult(S.perform(life,id,input));return;
    }
    if(ev.target.id==='sim-name-form'){
      ev.preventDefault();
      if(activeRoute.sheet==='do-baby')applyResult(S.perform(life,'baby',byId('sim-name').value));return;
    }
    if(ev.target.id==='child-form'){
      ev.preventDefault();if(activeRoute.sheet==='adopt')applyResult(W.adopt(life,byId('child-name').value));return;
    }
    if(ev.target.id!=='character-form')return;
    ev.preventDefault();readDraft();if(!draft)return;
    const era=eraUI.eras.find(e=>e.id===byId('birth-era').value);
    if(!era||!eraUI.validYear(era,byId('birth-year').value)){byId('birth-year').reportValidity();return;}
    changeBirthYear(false);
    const f=draft,name=E.cleanName(f.name);
    if(!name){const input=byId('person-name');input.value='';input.reportValidity();return;}
    if(f.edit&&canEdit()){
      const identity={name,town:f.town,thread:f.thread,skin:f.skin,identity:f.identity,faithId:f.faithId};
      if(!f.legacyBirth)identity.birthYear=f.birthYear;
      if(E.customizeBirth(life,identity)){persist();dismiss('edit');say('Character saved.');}
    }else if(!f.edit){
      startLife(E.makeLife(Object.assign({},f,{name,born:f.birthYear})));
    }
  });
  // The grab handle owns its gesture. Vertical scrolling in long sheets stays native.
  document.addEventListener('pointerdown',ev=>{
    const grip=ev.target.closest('.sheet-grip');
    if(!grip||!openPanel||!openPanel.contains(grip)||ev.isPrimary===false||ev.button!==0)return;
    const panel=grip.closest('.sheet');if(!panel)return;
    clearDrag();
    if(panel.getAnimations)for(const a of panel.getAnimations())a.cancel();
    drag={id:ev.pointerId,start:ev.clientY,time:ev.timeStamp,offset:0,frame:0,panel,grip};
    grip.classList.add('dragging');
    if(grip.setPointerCapture)try{grip.setPointerCapture(ev.pointerId);}catch(ignored){}
  });
  document.addEventListener('pointermove',ev=>{
    if(!drag||drag.id!==ev.pointerId)return;
    drag.offset=Math.max(0,Math.min(260,ev.clientY-drag.start));
    if(M.reduced||drag.frame)return;
    const paint=()=>{if(drag){drag.frame=0;drag.panel.style.transform='translateY('+Math.round(drag.offset)+'px)';}};
    if(window.requestAnimationFrame)drag.frame=window.requestAnimationFrame(paint);else paint();
  });
  function finishDrag(ev,cancelled){
    if(!drag||drag.id!==ev.pointerId)return;
    const state=drag;
    const distance=cancelled?state.offset:Math.max(0,ev.clientY-state.start);
    const elapsed=Math.max(1,ev.timeStamp-state.time);
    const threshold=Math.min(100,Math.max(58,state.panel.clientHeight*.23));
    clearDrag();
    if(!cancelled && (distance>threshold || (distance>25 && distance/elapsed>.7))){
      if(!M.reduced)state.panel.style.transform='translateY('+Math.min(260,distance)+'px)';
      dismiss();return;
    }
    const start=state.panel.style.transform||'none';state.panel.style.transform='';
    if(distance>1)M.animate(state.panel,[{transform:start},{transform:'none'}],185);
  }
  document.addEventListener('pointerup',ev=>finishDrag(ev,false));
  document.addEventListener('pointercancel',ev=>finishDrag(ev,true));
  document.addEventListener('keydown',ev=>{
    if(!openPanel)return;
    if(ev.key==='Enter'&&document.activeElement===byId('place-search')&&byId('place-search')){
      ev.preventDefault();const first=byId('place-results').querySelector('button[data-do="place-hit"]');
      if(first)applyPlaceHit(first.dataset.key);return;
    }
    if(ev.key==='Escape'){
      ev.preventDefault();
      if(byId('place-search')&&byId('place-search').value){byId('place-search').value='';locationSearch();return;}
      const parent=parentSheet(activeRoute.tab,activeRoute.sheet);
      if(parent)showSheet(parent);else dismiss();
      return;
    }
    if(ev.key==='Tab'){
      const items=Array.from(openPanel.querySelectorAll('button:not(:disabled),input,select'));if(!items.length)return;
      const first=items[0],last=items[items.length-1];
      if(ev.shiftKey&&(document.activeElement===first||document.activeElement===openPanel.querySelector('.sheet'))){ev.preventDefault();last.focus();}
      else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}
    }
  });
  window.addEventListener('popstate',onHistory);window.addEventListener('hashchange',onHistory);
  if(!location.hash)writeRoute({tab:'life',sheet:life.ended?'death':E.blocking(life)},true);
  M.mode(game.settings.motion);persist();mount();display(readRoute(),'initial');window.pocketFileReady();
})();
