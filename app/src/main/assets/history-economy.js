/* Prices, earnings and estates use one internal purchasing-power unit. Period
   denominations are display units, so a birthday cannot revalue an inheritance. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const future=node?require('./future-epochs.js').PocketFuture:root.PocketFuture;
  function world(){return node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;}
  const year=(l,age=l.age)=>l.born+age;
  const enabled=l=>l.sim?.timeline?.historicalRules===true;
  const historical=(l,age=l.age)=>enabled(l)&&year(l,age)<2000;
  const isFuture=(l,age=l.age)=>enabled(l)&&year(l,age)>=2050;
  function period(y){return y<1500?'medieval':y<1700?'renaissance':y<1900?'industrial':y<2000?'century':y<2050?'digital':future.chapter(y).id;}
  function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.codePointAt(0),16777619);return h>>>0;}
  const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,v));
  const households={
    ...future.households,
    medieval:[2800,1600,.095,32,'silver units','Harvest helper'],
    renaissance:[3600,2500,.10,24,'trade coins','Workshop helper'],
    industrial:[5800,3200,.07,10,'local notes','Errand runner'],
    century:[7200,4200,.13,3,'local units','Shop assistant'],
    digital:[7500,5400,.15,1,'dollars','Weekend assistant'],
    future:[9700,7200,.17,1,'credits','Habitat assistant']
  };
  function profile(l,age=l.age,town=l.town){
    const y=year(l,age),p=period(y),g=world(),place=g.place(town,y);
    const fx=g.marketEffects(l,town,y),base=households[p],seed=l.sim.expansion?.seed||l.id||town;
    const variation=.84+hash(seed+'/'+town+'/'+Math.floor(y/3))%32/100;
    let pay=(place.wageIndex||1)*variation*(fx.pay||1),cost=(1+(variation-1)*.58)*(fx.cost||1);
    let home=(place.homeIndex||1)*variation*(fx.home||1),legacyPay=pay;
    if(y>=2000&&enabled(l)){
      // Period and digital offers share the city's wage market. Manufacturing
      // follows tradable input prices more closely than scarce urban land.
      const economy=node?require('./economy.js').PocketEconomy:root.PocketEconomy;
      const market=economy.local(l,town,age),reference=economy.priceIndex(seed,place.code,2016);
      pay=economy.wageIndex(l,town,age);
      const efficiency=p==='stellar'?.86:p==='planetary'?.93:1;
      cost=(market.vehicle*.65+market.cost*.35)/reference*efficiency;
      const localSpace=1+clamp(((place.homeIndex||1)-1)*.15,-.05,.09);
      home=market.home/reference*localSpace;
    }
    let currency=base[4];
    if(p==='medieval'||p==='renaissance'){
      if(['americas','oceania'].includes(place.region))currency='trade measures';
      if(['eastAsia','southeastAsia'].includes(place.region))currency='cash units';
    }
    // Names mark documented currencies. Denominations are game balance, not forex or historical price quotations.
    // Royal Mint Museum, Medieval Long Cross Silver Penny; Banque de France, The Collections;
    // Bank of Japan Currency Museum, Currency system established by the Meiji government.
    let denomination=base[3];
    if(['london','bristol','n1159135103'].includes(town)&&y<1700)currency='pence';
    else if(place.code==='GB'&&y>=1707&&y<2000)currency='pounds';
    if(place.code==='FR'&&y>=1803&&y<2000){currency='francs';denomination=y<1960?.25:3;}
    if(place.code==='JP'&&y>=1871&&y<2000){currency='yen';denomination=y<1945?12:.08;}
    return {period:p,region:place.region,pay,legacyPay,cost,home,
      food:base[0],housing:base[1],tax:base[2],denomination,currency,shift:base[5]};
  }
  function money(l,amount,age=l.age,town=l.town){
    const n=Number.isFinite(amount)?amount:0;
    if(!historical(l,age)&&!isFuture(l,age))return (n<0?'−$':'$')+Math.abs(n).toLocaleString('en-US');
    const p=profile(l,age,town);
    return (n<0?'−':'')+(Math.abs(n)/p.denomination).toLocaleString('en-US',{maximumFractionDigits:2})+' '+p.currency;
  }
  // Only pass authored catalog text here, before substituting a player's names or writings.
  function priceText(l,text){
    return String(text).replace(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/g,(_,digits)=>money(l,Number(digits.replace(/,/g,''))));
  }
  // [identifier, title, baseline yearly pay, training level, daily work, first year, regions]
  const roles={
    ...future.roles,
    medieval:[
      ['grower','Tenant farmer',9500,0,'Rotate the field'],['weaver','Weaver',12500,0,'Finish a bolt of cloth'],
      ['smith','Blacksmith',17800,1,'Forge a replacement tool',1200,'europe westAsia africa eastAsia southAsia southeastAsia centralAsia'],
      ['trader','Market trader',15500,1,'Negotiate a caravan order'],['retainer','Court retainer',23500,2,'Settle a petition',1200,'europe eastAsia southAsia westAsia'],
      ['knight','Household knight',27000,3,'Serve a season at court',1200,'europe'],
      ['carver','Master carver',19900,2,'Finish a ceremonial panel'],['boatwright','Boatbuilder',16300,1,'Fit a new hull'],
      ['clayworker','Potter',11300,0,'Fire the kiln'],['warrior','Community guard',12100,0,'Stand the night watch']
    ],
    renaissance:[
      ['dyer','Cloth dyer',12500,0,'Prepare a dye bath'],['porter','Dock porter',11000,0,'Unload a cargo'],
      ['painter','Workshop painter',20500,1,'Finish a commissioned portrait'],['merchant','Long-distance merchant',27500,2,'Arrange a trading voyage'],
      ['scholar','Natural philosopher',22400,2,'Record an observation'],['surveyor','Land surveyor',19900,1,'Measure a boundary'],
      ['printer','Printshop compositor',17800,1,'Set a new page',1500,'europe eastAsia'],['navigator','Navigator',24800,2,'Chart the next passage']
    ],
    industrial:[
      ['spinner','Textile worker',16300,0,'Prepare a run of cloth'],['foundry','Foundry worker',19700,1,'Cast a tool head'],
      ['carter','Freight carter',15900,0,'Deliver a load'],['foreman','Workshop foreman',26900,2,'Inspect the shift'],
      ['enginewright','Steam mechanic',29900,2,'Repair a pressure valve',1800],['railhand','Railway worker',21800,1,'Inspect the track',1830],
      ['telegrapher','Telegraph operator',28100,2,'Relay a weather report',1850],['machinist','Machine toolmaker',25200,2,'Calibrate a lathe',1780]
    ],
    century:[
      ['shopworker','Shop clerk',20500,0,'Count the stock'],['mechanic','Motor mechanic',31500,1,'Rebuild an engine'],
      ['telephone','Switchboard operator',27400,1,'Route the morning calls'],['aviator','Commercial aviator',56400,3,'Plan a passenger flight',1920],
      ['broadcast','Radio producer',41700,2,'Edit a radio programme',1922],['television','Television technician',45200,2,'Align a studio camera',1950],
      ['computer','Computer operator',53300,2,'Check a batch of jobs',1960],['software','Software designer',65100,3,'Ship a desktop program',1980]
    ],
    digital:[['developer2','Mobile app developer',72800,2,'Test a handset release',2008],['creator','Independent video creator',36900,1,'Edit a new episode',2006],['security','Network security analyst',76700,2,'Review an incident report']],
    future:[
      ['hydro','Hydroponic grower',58900,0,'Balance the nutrient tanks'],['drone','Autonomous fleet dispatcher',76300,1,'Route a delivery fleet'],
      ['habitat','Habitat engineer',114000,2,'Test the habitat seals'],['biofabricator','Tissue fabrication specialist',137000,3,'Audit a tissue print'],
      ['climate','Climate restoration planner',99100,2,'Survey a restoration site'],['orbital','Orbital traffic controller',128000,3,'Reserve a docking window',2070]
    ]
  };
  const occupations=node?require('./occupations.js').PocketOccupations:root.PocketOccupations;
  for(const [periodId,additional] of Object.entries(occupations.historicalRoles))roles[periodId].push(...additional);
  const allRoles={},jobs={};for(const rows of Object.values(roles))for(const r of rows){const id='era-'+r[0];allRoles[id]=r;jobs[id]=[r[1],r[2]];}
  function allowed(row,y,region){return (!row[5]||y>=row[5])&&(!row[6]||row[6].split(' ').includes(region));}
  function rail(l,age=l.age,town=l.town){return /rail/.test(world().place(town,year(l,age)).transport)||year(l,age)>=1910;}
  const railRoles=new Set(['railhand','signals','stationclerk']);
  function roleRows(l,age=l.age,town=l.town){
    const p=profile(l,age,town),y=year(l,age);
    return roles[p.period].filter(r=>allowed(r,y,p.region)&&(!railRoles.has(r[0])||rail(l,age,town)));
  }
  function npcJob(l,seed=0,town=l.town){
    const rows=roleRows(l,l.age,town),stock=rows.length?rows:roles.medieval,r=stock[hash(seed)%stock.length];
    return {id:'era-'+r[0],title:r[1],annual:Math.round(r[2]*profile(l,l.age,town).pay)};
  }
  function contractPay(l,id,amount){
    const quoted=Math.round(amount),factor=l.world.legacyPayFactor;
    return factor&&id===l.job&&l.world.contractRole===undefined?Math.round(quoted*factor):quoted;
  }
  function wage(l,id,age=l.age){
    const r=allRoles[id];if(!r)return 0;
    const experience=l.world.roleYears?.[id]||0;
    const existing=l.job===id&&l.world.contractRole!==id;
    const rate=existing?1:Math.min(1,(r[3]>=2?.70:.80)+experience*.017);
    const p=profile(l,age);
    const index=existing?(p.legacyPay??p.pay):p.pay;
    return contractPay(l,id,(r[2]*rate+(l.job===id?l.extraPay||0:0))*index);
  }
  function youthPay(l,age=l.age){if(!l.sim.timeline?.youthShift||age<14||age>=18)return 0;return Math.round(profile(l,age).food*.18*profile(l,age).pay);}
  function shiftName(l,age=l.age){return profile(l,age).shift;}
  // Asset rows use a purchase price, productive annual income and unlock year.
  const goods={
    ...future.goods,
    medieval:[
      ['loom','Hand loom','Equipment',2850,190],['pasture','Grazing rights','Property',15700,1100],['field','Cultivated field','Property',20000,1570],
      ['farmhouse','Farmstead','Property',36700,0],['cart','Ox cart','Vehicle',4300,280,1200,'europe africa westAsia eastAsia southAsia southeastAsia centralAsia'],
      ['horse','Riding horse','Vehicle',6500,0,1200,'europe africa westAsia eastAsia southAsia southeastAsia centralAsia'],
      ['canoe','Fishing boat','Vehicle',4500,320],['goats','Goat herd','Equipment',3300,360,1200,'europe africa westAsia eastAsia southAsia southeastAsia centralAsia'],
      ['estate','Manorial estate','Property',89000,5800,1200,'europe'],['basket','Woven fish traps','Equipment',1600,125]
    ],renaissance:[
      ['atelier','Artist’s workshop','Property',27600,1800],['dyehouse','Dye house','Property',39900,2700],['house','Merchant’s house','Property',55200,0],
      ['folio','Illustrated folio','Equipment',2100,0],['boat','Trading boat','Vehicle',11400,800],['map','Surveying instruments','Equipment',3700,260]
    ],industrial:[
      ['tenement','Workers’ cottage','Property',34000,0],['mill','Mill building','Property',79000,6300],['freight','Freight wagon','Vehicle',8900,700],
      ['lathe','Workshop lathe','Equipment',6900,480],['engine','Stationary steam engine','Equipment',21400,1710,1800],
      ['rail','Railway goods depot','Property',112000,8900,1830],['safetycycle','Safety bicycle','Vehicle',3300,0,1885]
    ],century:[
      ['terrace','Terraced house','Property',57000,0],['store','Neighborhood storefront','Property',68000,4800],['roadster','Two-seat motorcar','Vehicle',13800,0],
      ['motorbike','Touring motorcycle','Vehicle',8200,0],['radio','Table radio','Equipment',1450,0,1923],['tv','Television set','Equipment',2400,0,1950],
      ['micro','Home computer','Equipment',2900,0,1980],['sportscar','Sports coupé','Vehicle',37900,0,1950]
    ],digital:[['sounddesk','Digital recording desk','Equipment',4800,350],['solar','Solar-roof studio','Property',188000,11200],['cargobike','Electric cargo bicycle','Vehicle',4200,340]],
    future:[
      ['pod','Autonomous commuter pod','Vehicle',38700,0],['delivery','Cargo drone fleet','Vehicle',79600,6200],
      ['module','Adaptable habitat apartment','Property',189000,0],['reef','Floating garden home','Property',315000,6700],
      ['bioprinter','Tissue culture printer','Equipment',25900,1800],['orbitflat','Orbital habitat lease','Property',635000,33000,2070]
    ]
  };
  const concerns={
    ...future.concerns,
    medieval:[['grain','Grain store',6800,9600],['pottery','Pottery workshop',8700,12700],['boats','River freight service',14600,18100]],
    renaissance:[['atelier','Painting studio',11500,14900],['cloth','Cloth trading house',19200,24500],['cartography','Surveying workshop',13800,17600]],
    industrial:[['works','Tool works',23500,29900],['mill','Textile mill',31500,41600],['rail','Rail freight office',48100,58800,1840]],
    century:[['garage','Repair garage',23800,38000],['broadcast','Radio studio',48700,63700,1922],['hardware','Computer repair shop',39500,54900,1980]],
    digital:[['hosting','Network hosting firm',43900,74000],['video','Video production studio',28500,46500,2006]],
    future:[['hydro','Vertical farm',60800,99600],['fabrication','Adaptive fabrication lab',98500,152000],['orbital','Orbital freight service',248000,369000,2070]]
  };
  const businesses={};for(const [era,rows] of Object.entries(concerns))for(const r of rows)businesses['era-'+era+'-'+r[0]]=[r[1],era,r[2],r[3]];
  const diversions={
    ...future.diversions,
    medieval:[
      ['market','Attend the seasonal market','joy',5,0,'I traded gossip. It kept its value.'],['weave','Practice weaving','smarts',5,0,'The cloth came out narrower than planned.'],
      ['games','Join the village games','health',5,40,'I ran. Somebody kept score.'],['kin','Share a family supper','bonds',6,64,'Everyone came hungry. One person brought a spoon.']
    ],renaissance:[
      ['sketch','Sketch the market square','smarts',5,0,'One merchant demanded better cheekbones.'],['dance','Attend a seasonal dance','joy',7,68,'I remembered the steps on the way home.'],
      ['instruments','Measure the stars','smarts',7,96,'The stars held still enough.'],['sail','Learn to row','health',6,40,'The boat mostly went forward.']
    ],industrial:[
      ['reading','Join a reading circle','smarts',6,0,'We read by lamplight. Two people nodded off.'],['fair','Visit the exhibition','joy',7,140,'One invention made a great deal of noise.'],
      ['garden','Tend an allotment','health',5,75,'I got three cabbages and a sore back.'],['rail','Take a train excursion','joy',8,260,'My seat faced the wrong way.',1830]
    ],century:[
      ['cinema','Go to the cinema','joy',6,120,'Somebody talked through the good bit.'],['radio','Listen to a radio play','joy',4,0,'We all suspected the butler.',1922],
      ['ball','Play a pickup game','health',6,0,'We lost the ball. The argument continued.'],['arcade','Visit a video arcade','joy',7,110,'I made it onto the last line of the scoreboard.',1975]
    ],digital:[['website','Build a personal website','smarts',6,0,'The visitor counter finally reached two.'],['podcast','Record a podcast','joy',5,95,'The loudest guest was the refrigerator.',2005]],
    future:[
      ['sim','Train in a gravity simulator','health',7,210,'The floor moved. I took it personally.'],['gardens','Tour a floating garden','joy',7,80,'The tomatoes had a better view than I did.'],
      ['lab','Practice habitat repair','smarts',6,0,'The practice leak stayed inside the practice room.']
    ]
  };
  function validListing(id,item){
    if(!item||item.historical!==true||item.id!==id||typeof id!=='string'||!id.startsWith('deed_')||typeof item.town!=='string')return false;
    if(!Number.isInteger(item.listedYear)||item.listedYear<1200||!Number.isInteger(item.built)||item.built>item.listedYear)return false;
    const issued=period(item.listedYear);
    // Before 1.2 every future year used the orbital market. Those issued
    // deeds and their original terms remain valid in personal and NPC estates.
    const row=goods[issued].find(r=>'era-'+r[0]===item.type)||
      (issued!=='future'&&item.listedYear>=2050&&goods.future.find(r=>'era-'+r[0]===item.type));
    return !!row&&row[1]===item.name&&row[2]===item.category&&Number.isSafeInteger(item.price)&&item.price>0&&
      Number.isSafeInteger(item.rent)&&item.rent>=0&&Number.isFinite(item.condition)&&item.condition>=0&&item.condition<=100&&
      Number.isFinite(item.change)&&item.change>=-.2&&item.change<=.1;
  }
  function commercial(r){return r[2]==='Property'&&r[4]>0;}
  function listings(l){
    const p=profile(l),y=year(l),seed=l.sim.expansion?.seed||l.id;
    const rows=goods[p.period].filter(r=>allowed(r,y,p.region)&&(r[0]!=='rail'||rail(l)));
    const rotate=(group)=>{const ordered=group.slice().sort((a,b)=>hash(seed+l.town+a[0])-hash(seed+l.town+b[0]));return ordered.map((_,i)=>ordered[(i+y)%ordered.length]).slice(0,2);};
    return ['Property','Vehicle','Equipment'].flatMap(cat=>rotate(rows.filter(r=>r[2]===cat))).map(r=>{
      const id=['deed',l.id,l.town,y,r[0]].join('_'),condition=54+hash(id)%45;
      const price=Math.max(1,Math.round(r[3]*(r[2]==='Property'?p.home:p.cost)*(.63+.004*condition+hash(id+'quote')%14/100)));
      const first=future.chapter(y)?.first||1200;
      return {id,type:'era-'+r[0],historical:true,name:r[1],category:r[2],price,condition,listedYear:y,built:Math.max(first,r[5]||first,y-(r[2]==='Property'?hash(id+'built')%42:hash(id+'built')%5)),
        rent:Math.round(r[4]*price/r[3]),town:l.town,commercial:commercial(r),icon:r[2]==='Property'?'home':r[2]==='Vehicle'?'compass':'tools',
        change:r[2]==='Property'?.006:r[2]==='Vehicle'?-.045:-.018,resale:.92,age:18};
    });
  }
  const learning={
    ...future.learning,
    medieval:['Learn from the household','Practice a craft with a master','Keep a market account'],
    renaissance:['Copy a manuscript','Study in a workshop','Study navigation and measurement'],
    industrial:['Attend the reading room','Take a mechanics class','Draw a machine plan'],
    century:['Attend evening school','Take a vocational course','Study engineering'],
    digital:['Take a web design class','Learn digital production','Complete a network course'],
    future:['Visit a habitat classroom','Train with a fabrication tutor','Study orbital navigation']
  };
  function companyCapacity(l,c,age){
    const running=Object.values(l.sim.expansion?.companies||{}).filter(f=>!f.manager).length;
    const employed=l.job&&!['student','retired'].includes(l.job);
    const attention=c.manager?1:1/(1+Math.max(0,running-1)*.22+(employed?.12:0));
    const maturity=Number.isInteger(c.originYear)?Math.min(1,.78+.11*Math.max(0,year(l,age)-c.originYear)):1;
    return attention*maturity;
  }
  function companyQuote(l,c,age=l.age){
    const cfg=businesses[c.type],p=profile(l,age,c.town),fraction=c.share??1;
    const cycle=.75+hash((l.sim.expansion?.seed||l.id)+'/'+c.town+'/'+year(l,age))%45/100;
    let demand=1;
    if(year(l,age)>=2050&&future.industries[cfg[1]]){
      const economy=node?require('./economy.js').PocketEconomy:root.PocketEconomy;
      const market=economy.local(l,c.town,age),sector=future.firmSectors[c.type.slice(('era-'+cfg[1]+'-').length)];
      demand=1+market.cycle*.12+(market.sector===sector?.14:market.decline===sector?-.12:0);
    }
    const rev=Math.round(cfg[3]*c.level*fraction*p.pay*cycle*demand*(1+.065*(c.clients||0))*companyCapacity(l,c,age));
    const managerPay=c.manager?Math.round(cfg[3]*.12*c.level*p.cost*fraction):0;
    const operating=Math.round(cfg[3]*(.63*c.level+.035*(c.staff||0))*fraction*p.cost)+managerPay;
    const net=rev-operating,retained=net>=0?Math.floor(net*.18):Math.max(-c.capital,net);
    return {id:c.id,revenue:rev,operating,managerPay,retained,payout:net-retained,net};
  }
  function payRoom(l,base,rank){
    const experience=Math.min(18,l.sim.workYears||0);
    const ceiling=base*(.09+.09*Math.min(3,rank)+.005*experience);
    return Math.max(0,Math.floor(ceiling)-(l.extraPay||0));
  }
  function reviewReason(l,base,promotion=false){
    if(!base||l.age<18||['retired','student'].includes(l.job))return 'An active paid role is required';
    const rank=l.world.level||0,tenure=l.age-l.world.since;
    if(promotion&&rank>=3)return 'Highest rank in this role';
    if(l.world.payReviewYear===year(l))return 'Pay reviewed this year';
    const years=promotion?[1,3,6][rank]:1;
    if(tenure<years)return 'Needs '+years+' '+(years===1?'year':'years')+' in this position';
    const required=promotion?70+rank*5:62;
    if(l.world.performance<required)return 'Needs '+required+'% performance';
    return payRoom(l,base,rank+Number(promotion))?'':'Top of the current pay band';
  }
  function settleReview(l,base,rate,approved,promotion=false){
    if(reviewReason(l,base,promotion))return 0;
    l.world.payReviewYear=year(l);
    if(!approved)return 0;
    if(promotion)l.world.level++;
    const increase=Math.min(payRoom(l,base,l.world.level),Math.max(1,Math.round(base*rate)));
    l.extraPay=(l.extraPay||0)+increase;
    return increase;
  }
  function options(l,area){
    if(!enabled(l)||!l.sim.expansion)return [];
    const p=profile(l),y=year(l),t=l.sim.timeline,x=l.sim.expansion,rows=[];
    const blocked=l.ended?'Life complete':l.sim.review||l.sim.court||l.event&&!l.event.resolved?'Finish the current decision':l.sim.prison?'In custody':'';
    const adult=l.age>=18,training=t.training||0;
    const costText=n=>money(l,n);
    const stat=(key,n)=>{l.stats[key]=clamp(l.stats[key]+n);};
    function add(id,title,description,icon,fee,rule,run,repeat=false){
      const token='history/'+area+'/'+id;
      rows.push({id,title,description,desc:description,icon,cost:fee,token,repeat,run,
        reason:blocked||rule||(!repeat&&l.used.includes(token)?'Done this year':'')||(fee>l.cash?'Need '+costText(fee):'')});
    }
    if(area==='school'&&l.age>=5){
      for(const [i,title] of learning[p.period].entries()){
        const fee=i===0?0:Math.round(p.food*p.cost*i*.04),minimum=i===0?5:i===1?10:14;
        add('lesson-'+i,title,'Develop training and smarts. Training '+training+'/6'+(fee?' · '+costText(fee):''),'book',fee,l.age<minimum?'Opens at '+minimum:'',
          ()=>{t.training=Math.min(6,training+1);l.world.grade=clamp(l.world.grade+4);stat('smarts',3+i);
            if(t.training>=3)l.world.tradeQualified=true;return 'I finished the lesson. My training reached '+t.training+'/6.';});
      }
    }
    if(area==='work'&&!adult&&l.age>=14){
      const salary=Math.round(p.food*.18*p.pay);
      add('shift',p.shift,'Part-time · '+costText(salary)+' per year.','coin',0,t.youthShift?'Already employed':'',()=>{l.world.partJob=null;l.world.partSince=null;t.youthShift=true;return 'I signed on for part-time work. Pay comes on my birthday.';});
      if(t.youthShift)add('endshift','Leave the part-time job','Give up future wages.','exit',0,'',()=>{delete t.youthShift;return 'I finished my last shift.';});
    }
    if(area==='work'&&adult){
      const role=allRoles[l.job];
      if(role){
        add('practice',role[4],'Improve performance in your current job.','tools',0,'',()=>{l.world.performance=clamp(l.world.performance+15);stat('smarts',2);stat('health',-1);return 'I finished the job. My supervisor checked it twice.';});
        add('advance','Negotiate a higher wage','Review your pay grade after service in this role.','trend',0,reviewReason(l,role[2],true),()=>{
          settleReview(l,role[2],.095,true,true);l.world.performance-=8;return 'The new wage went into the accounts.';});
        add('quit','Leave this occupation','Give up future wages.','exit',0,'',api=>{changeJob(l,null,api);return 'I left the work to somebody else.';});
      }
      const pool=roleRows(l),ordered=pool.slice().sort((a,b)=>hash(l.town+a[0])-hash(l.town+b[0]));
      const base=ordered.find(r=>r[3]===0),regional=ordered.filter(r=>r[6]),sample=ordered.map((_,i)=>ordered[(i+y)%ordered.length]).slice(0,5);
      for(const r of new Set([base,...sample,...regional].filter(Boolean))){
        const id='era-'+r[0],years=l.sim.workYears||0,skill=r[3];
        const practical=skill>=3?3:skill===2?1:0;
        const preparation=training+(l.sim.degree?2:0);
        const trained=preparation>=skill||(skill===1&&years>=5);
        let qual=!trained?'Needs '+skill+' levels of training'+(skill===1?' or 5 years of work':''):
          years<practical?'Needs '+practical+' '+(practical===1?'year':'years')+' of work experience':'';
        if(!qual&&r[0]==='knight'&&!t.nobleHouse){
          const service=['era-warrior','era-retainer'].reduce((n,key)=>n+(l.world.roleYears?.[key]??(l.job===key?Math.max(0,l.age-l.world.since):0)),0);
          if(service<2)qual='Needs 2 years of guard or court service, or an inherited landed title';
        }
        add('job-'+id,r[1],costText(wage(l,id))+' per year'+(r[3]?' · training '+r[3]+'/6':''),'bag',0,id===l.job?'Current occupation':l.sim.program?'Finish or leave your course':qual,api=>{
          changeJob(l,id,api);if(r[0]==='knight'&&!l.sim.lifeTags.includes('court-service'))l.sim.lifeTags.push('court-service');
          return 'I took work as a '+r[1].toLowerCase()+'. The pay starts on my next birthday.';});
      }
      if(p.region==='europe'&&p.period==='medieval'&&l.sim.lifeTags.includes('court-service')){
        add('patronage','Petition for a landed title','Reach 75% performance in court service and hold a manorial estate.','flag',0,
          t.nobleHouse?'Title already held':!['era-knight','era-retainer'].includes(l.job)||l.world.performance<75||!Object.values(l.world.owned).some(a=>a.listing?.type==='era-estate')?'Court service, an estate and 75% performance required':'',
          ()=>{t.nobleHouse=true;l.world.reputation=clamp(l.world.reputation+18);l.sim.lifeTags.push('landed-house');return 'The petition passed. Our family name was entered beside the estate.';});
      }
    }
    if(area==='activities'&&l.age>=4){
      for(const r of diversions[p.period]){
        if((r[6]&&y<r[6])||(r[0]==='rail'&&!rail(l)))continue;
        const fee=Math.round(r[4]*p.cost);add(r[0],r[1],r[2]==='bonds'?'Build family bonds.':r[2]==='smarts'?'Develop smarts.':r[2]==='health'?'Improve health.':'Improve happiness.',r[2]==='health'?'heart':r[2]==='smarts'?'book':'sun',fee,'',()=>{
          stat(r[2],r[3]);if(r[2]==='bonds')for(const n of Object.values(l.people))if(n.active&&n.met&&!Number.isInteger(n.diedAt))n.bond=clamp(n.bond+2);return r[5];});
      }
      const owned=Object.values(l.world.owned).filter(a=>a.listing?.historical);
      if(isFuture(l)){
        const [name,result,fee,relief]=future.clinics[p.period];
        const condition=[...l.sim.illnesses,...l.sim.injuries].sort((a,b)=>b.severity-a.severity)[0];
        add('clinic',name,condition?'Treatment lowers the severity of '+condition.name+'.':'A health check and supervised recovery.',
          'heart',Math.round(fee*p.cost),'',()=>{
            if(condition){condition.treated=true;condition.severity=Math.max(1,condition.severity-relief);}
            stat('health',condition?7:3);return result+(condition?' My '+condition.name+' was recorded at '+condition.severity+'% severity.':' I left with the results.');
          });
        const job=future.contracts[p.period];
        const equipment=owned.filter(a=>job.types.includes(a.listing.type)&&a.listing.town===l.town)
          .sort((a,b)=>b.condition-a.condition)[0];
        if(adult&&equipment){
          const earned=Math.floor(equipment.listing.rent*.12*(equipment.share??1)*equipment.condition/100);
          add('supply-order',job.title,'Earn '+costText(earned)+' using your '+equipment.listing.name.toLowerCase()+'. Condition falls by 4%.',
            'tools',0,equipment.condition<45?'Restore the holding to 45% condition':'',()=>{
              equipment.condition-=4;l.cash+=earned;stat('discipline',2);return job.result+' I received '+costText(earned)+'.';
            });
        }
      }
      if(owned.some(a=>a.listing.type==='era-horse'))
        add('ride','Ride your horse','Exercise with your own mount.','compass',0,'',()=>{stat('health',5);stat('joy',4);return 'My horse knew the road. It also knew the way home.';});
      const holding=owned.find(a=>a.listing.town===l.town&&['era-field','era-pasture','era-farmhouse','era-estate'].includes(a.listing.type));
      if(holding&&adult)add('harvest','Manage the harvest','Sell surplus produce from your land.','leaf',0,'',()=>{
        const proceeds=Math.round(p.food*.13*p.pay*(holding.share||1)*holding.condition/100);
        l.cash+=proceeds;holding.condition=Math.max(10,holding.condition-1);stat('health',-1);
        return 'We sold the surplus for '+money(l,proceeds)+'. The weather took the rest.';});
      if(historical(l)){
        add('care','Seek local medical care','Rest and treatment reduce symptoms.','heart',Math.round(p.food*p.cost*.025),'',()=>{
          const c=[...l.sim.injuries,...l.sim.illnesses].sort((a,b)=>b.severity-a.severity)[0];
          if(c){c.treated=true;c.severity=Math.max(1,c.severity-6);}stat('health',3);return c?'I received care for my '+c.name+'. Recovery still took time.':'I rested under supervision. Nobody approved of my schedule.';});
        if(p.region==='europe'&&['medieval','renaissance'].includes(p.period)&&adult)
          add('guild','Attend the guild meeting','Gain training and a local business contact.','people',Math.round(p.food*.05),'',()=>{t.training=Math.min(6,training+1);l.world.reputation=clamp(l.world.reputation+4);return 'I paid my dues. The meeting ran over.';});
      }
    }
    if(area==='market'&&adult){
      for(const a of listings(l)){
        const income=a.rent?' · yearly receipts '+costText(a.rent):'';
        add(a.id,a.name,costText(a.price)+' · '+a.condition+'% condition'+income,a.icon,a.price,l.world.owned[a.id]||l.used.includes('bought/'+a.id)?'Already purchased':'',()=>{
          l.world.owned[a.id]={at:l.age,town:l.town,listing:{...a},value:Math.round(a.price*a.resale),condition:a.condition,share:1};
          l.used.push('bought/'+a.id);return 'I bought the '+a.name.toLowerCase()+' for '+costText(a.price)+'.';});
      }
    }
    if(area==='owned'&&adult){
      for(const [key,a] of Object.entries(l.world.owned)){
        if(!a.listing?.historical)continue;
        const n=a.listing.name,fee=Math.max(1,Math.round((100-a.condition)*a.value*.0007)),owed=l.sim.loans[key]?.balance||0;
        add('restore-'+key,'Restore '+n,'Condition '+a.condition+'% · '+costText(fee),'tools',fee,a.condition>=100?'Already restored':'',()=>{
          a.value+=Math.round(fee*.60);a.condition=100;return 'The '+n.toLowerCase()+' is back in good condition.';});
        add('sell-'+key,'Sell '+n,'Receives '+costText(a.value-owed)+' after debt.','tag',0,owed>a.value+l.cash?'Insufficient equity':'',()=>{
          l.cash+=a.value-owed;delete l.world.owned[key];delete l.sim.loans[key];return 'The '+n.toLowerCase()+' changed hands.';});
      }
    }
    if(area==='business'&&adult){
      const firms=Object.values(x.companies);
      for(const row of concerns[p.period]){
        if((row[4]&&y<row[4])||(row[0]==='rail'&&!rail(l)))continue;
        const id='era-'+p.period+'-'+row[0],fee=Math.round(row[2]*p.home);
        add('open-'+id,'Open a '+row[1].toLowerCase(),'Invest '+costText(fee)+' in a local firm.','shop',fee,firms.length>=8?'Eight businesses already open':'',()=>{
          const key='firm-'+(++x.sequence);x.companies[key]={id:key,type:id,name:row[1],originYear:y,founder:l.name,historical:true,town:l.town,capital:fee,level:1,staff:0,clients:0,share:1,manager:false};
          if(!l.sim.lifeTags.includes('business-owner'))l.sim.lifeTags.push('business-owner');return 'I opened a '+row[1].toLowerCase()+'. The first bill arrived early.';});
      }
      for(const c of firms.filter(c=>businesses[c.type])){
        const cfg=businesses[c.type],fee=Math.max(1,Math.round(cfg[2]*(.32+.075*c.level)*profile(l,l.age,c.town).cost*(c.share??1)));
        add('invest-'+c.id,'Expand '+c.name,'Reinvest '+costText(fee)+' in capacity.','shop',fee,c.level>=6?'At capacity':c.clients<c.level?'Needs '+c.level+' regular clients':'',()=>{
          c.level++;c.staff++;c.capital+=fee;return c.name+' added another work station.';});
        add('clients-'+c.id,'Find customers for '+c.name,'Increase annual receipts.','people',0,c.clients>=8?'Client book full':'',()=>{c.clients++;return 'A customer placed a regular order.';});
        if(p.period!==cfg[1]){
          const successor=concerns[p.period][0],target='era-'+p.period+'-'+successor[0],investment=Math.round(successor[2]*.65*p.cost*(c.share??1));
          add('adapt-'+c.id,'Convert '+c.name+' into a '+successor[1].toLowerCase(),'Retool for '+costText(investment)+'. The founding record stays with the firm.','tools',investment,'',()=>{
            c.capital+=investment;c.type=target;c.name=successor[1];c.level=1;c.clients=Math.min(2,c.clients);c.staff=0;return 'We reopened as a '+c.name.toLowerCase()+'. The founding ledger survived.';});
        }
        add('sell-'+c.id,'Sell your stake in '+c.name,'Sale proceeds '+costText(c.capital)+'.','tag',0,'',()=>{
          l.cash+=c.capital;delete x.companies[c.id];return 'The buyer took over '+c.name+'.';});
      }
    }
    return rows;
  }
  function changeJob(l,id,api){
    if(api?.world)api.world.changeJob(l,id,true);
    else{delete l.world.offerTown;l.job=id;l.world.contractRole=id;l.extraPay=0;l.world.level=0;l.world.since=l.age;l.world.performance=56;l.world.customCareer=true;l.sim.staffJob=null;}
    if(id){
      l.sim.expansion.employer=allRoles[id][1]+' household';l.track='work';
      if(wage(l,id)>l.sim.peak.salary)l.sim.peak={title:id,salary:wage(l,id)};
    }else delete l.sim.expansion.employer;
  }
  function actions(l,area){return options(l,area).map(({run,repeat,token,...o})=>o);}
  function perform(l,area,id,api){
    const o=options(l,area).find(r=>r.id===id);if(!o||o.reason)return null;
    const before={...l.stats,cash:l.cash};l.cash-=o.cost;
    const text=o.run(api);if(!o.repeat)l.used.push(o.token);l.turns++;
    const after={...l.stats,cash:l.cash},delta={};for(const k of Object.keys(after))if(after[k]!==before[k])delta[k]=after[k]-before[k];
    const kind=({market:'Assets',owned:'Assets',work:'Career',business:'Career',school:'School',activities:'Activity'})[area];
    if(api?.log)api.log(l,kind,o.title,text,delta);else l.log.push({age:l.age,kind,title:o.title,body:text,delta});
    return {title:o.title,text,delta,accent:kind};
  }
  root.PocketHistoryEconomy={historical,isFuture,enabled,year,period,profile,money,priceText,npcJob,jobs,businesses,companyCapacity,companyQuote,reviewReason,settleReview,contractPay,wage,youthPay,shiftName,listings,validListing,actions,perform,marketEffects:(l,town,y)=>world().marketEffects(l,town,y)};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
