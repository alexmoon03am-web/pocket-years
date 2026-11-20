/* Historical labels are an overlay. The keys used in estates, residences and journals
   always refer to the same entry in the offline gazetteer. */
(function(root){
  'use strict';
  const G=typeof module!=='undefined'&&module.exports?require('./geography.js').PocketGeography:root.PocketGeography;
  const codeRegion={};
  const regionCodes={
    europe:'AD AL AT AX BA BE BG BY CH CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA XK',
    westAsia:'AE AM AZ BH CY GE IL IQ IR JO KW LB OM PS QA SA SY TR YE',
    southAsia:'AF BD BT IN LK MV NP PK',
    centralAsia:'KG KZ TJ TM UZ',
    eastAsia:'CN HK JP KP KR MN MO TW',
    southeastAsia:'BN ID KH LA MM MY PH SG TH TL VN',
    oceania:'AS AU CC CK CX FJ FM GU KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV VU WF WS',
    africa:'AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG EH ER ET GA GH GM GN GQ GW KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RE RW SC SD SH SL SN SO SS ST SZ TD TG TN TZ UG YT ZA ZM ZW',
    americas:'AG AI AR AW BB BL BM BO BQ BR BS BZ CA CL CO CR CU CW DM DO EC FK GD GF GL GP GT GY HN HT JM KN KY LC MF MQ MS MX NI PA PE PM PR PY SR SV SX TC TT US UY VC VE VG VI'
  };
  for(const [region,codes] of Object.entries(regionCodes))for(const code of codes.split(' '))codeRegion[code]=region;
  function region(town){return codeRegion[G.cities[town]?.code]||'oceania';}
  function era(year){return year<1500?'medieval':year<1700?'renaissance':year<1900?'industrial':year<2000?'twentieth':year<2050?'digital':'future';}
  const regionNames={europe:'Europe',westAsia:'Western Asia',southAsia:'South Asia',centralAsia:'Central Asia',eastAsia:'East Asia',southeastAsia:'Southeast Asia',oceania:'Oceania',africa:'Africa',americas:'the Americas'};
  // The dates below mark when a name is offered in the game; they need not mark
  // the first human occupation of a site. Geographic descriptions cover periods
  // with competing authorities rather than assigning one empire to a whole region.
  const settlements=[];
  function site(id,start,area,cityNames=[],polities=[]){
    if(!G.cities[id])throw Error('Unknown historical gazetteer key '+id);
    settlements.push({id,start,area,cityNames,polities});
  }
  const england=[[1200,'England'],[1707,'Great Britain'],[1801,'United Kingdom']];
  site('london',1200,'Thames valley',[],england);
  site('bristol',1200,'Avon valley',[],england);
  site('n1159135103',1200,'Vale of York',[],england);
  site('n1159146365',1200,'Lothian',[],[[1200,'Scotland'],[1707,'Great Britain'],[1801,'United Kingdom']]);
  site('n1159151613',1200,'Île-de-France');
  site('n1159150845',1200,'Rhône valley');
  site('n1159149751',1200,'Tuscany');
  site('n1159150277',1200,'Venetian Lagoon',[],[[1200,'Republic of Venice'],[1797,'Venetian Lagoon'],[1866,'Italy']]);
  site('n1159151593',1200,'Latium');
  site('n1159150601',1200,'Guadalquivir valley');
  site('n1159151545',1200,'Attica');
  site('n1159151579',1200,'Bosporus',[[1200,'Constantinople'],[1930,'Istanbul']],[[1200,'Byzantine Empire'],[1204,'Latin Empire'],[1261,'Byzantine Empire'],[1453,'Ottoman Empire'],[1922,'Bosporus'],[1923,'Turkey']]);
  site('n1159151603',1200,'Lower Nile',[],[[1200,'Ayyubid Egypt'],[1250,'Mamluk Egypt'],[1517,'Ottoman Egypt'],[1805,'Egypt']]);
  site('n1159151349',1200,'Nile Delta');
  site('n1159150921',1200,'Middle Niger');
  site('n1159150043',1200,'Niger bend');
  site('n1159150669',1200,'Maghreb');
  site('n1159150675',1200,'Maghreb');
  site('n1159150829',1200,'Swahili coast');
  site('n1159151297',1200,'Hausaland');
  site('n1159150963',1636,'Ethiopian Highlands');
  site('n1159151547',1200,'Mesopotamia',[],[[1200,'Abbasid Caliphate'],[1258,'Mesopotamia'],[1921,'Iraq']]);
  site('n1159150971',1200,'Iranian plateau');
  site('n1159150569',1200,'Zarafshan valley');
  site('n1159151405',1200,'Indo-Gangetic plain',[],[[1206,'Delhi Sultanate'],[1526,'Delhi region'],[1858,'British India'],[1947,'India']]);
  site('n1159150979',1200,'Ganges valley');
  site('n1159151285',1200,'Punjab',[],[[1849,'British India'],[1947,'Pakistan']]);
  site('n1159151617',1700,'Bengal',[[1700,'Calcutta'],[2001,'Kolkata']],[[1858,'British India'],[1947,'India']]);
  const japan=[[1200,'Japanese archipelago'],[1603,'Tokugawa Japan'],[1868,'Japan']];
  site('kyoto',1200,'Kinai',[],japan);
  site('osaka',1583,'Kinai',[],japan);
  site('n1159151609',1457,'Kantō',[[1457,'Edo'],[1868,'Tokyo']],japan);
  site('n1159151595',1200,'North China Plain',[[1200,'Zhongdu'],[1215,'Yanjing'],[1272,'Dadu'],[1368,'Beiping'],[1403,'Beijing'],[1928,'Beiping'],[1937,'Beijing'],[1945,'Beiping'],[1949,'Beijing']],[[1200,'Jin territory'],[1215,'Mongol territory'],[1271,'Yuan China'],[1368,'Ming China'],[1644,'Qing China'],[1912,'China']]);
  site('n1159151387',1200,'Lower Yangtze',[[1200,'Lin’an'],[1276,'Hangzhou']]);
  site('n1159151523',1394,'Korean peninsula',[[1394,'Hanyang'],[1395,'Hanseong'],[1910,'Gyeongseong'],[1946,'Seoul']],[[1394,'Joseon'],[1897,'Korean Empire'],[1910,'Korea under Japanese rule'],[1945,'Korean peninsula'],[1948,'South Korea']]);
  site('n1159151251',1200,'Red River delta',[[1200,'Thăng Long'],[1400,'Red River settlement'],[1428,'Đông Kinh'],[1831,'Hanoi']]);
  site('n1159149407',1296,'Northern Thai uplands');
  site('n1159134449',1350,'Chao Phraya valley');
  site('n1159151525',1571,'Luzon');
  site('n1159148319',1500,'Straits of Malacca');
  site('n1159150611',1200,'Andes',[],[[1438,'Tawantinsuyu'],[1533,'Andes'],[1824,'Peru']]);
  site('n1159151587',1325,'Basin of Mexico',[[1325,'Tenochtitlan'],[1521,'Mexico City']],[[1535,'New Spain'],[1821,'Mexico']]);
  site('n1159151575',1200,'Lenape homelands',[[1200,'Manhattan shore'],[1625,'New Amsterdam'],[1664,'New York'],[1673,'New Orange'],[1674,'New York']],[[1625,'New Netherland'],[1664,'Province of New York'],[1673,'New Netherland'],[1674,'Province of New York'],[1783,'United States']]);
  site('n1159151065',1608,'St. Lawrence valley');
  site('n1159151453',1549,'Bay of All Saints');
  site('n1159151623',1200,'Gadigal Country',[[1200,'Warrane'],[1788,'Sydney']],[[1788,'New South Wales'],[1901,'Australia']]);
  site('n1159151703',1400,'Aotearoa',[[1400,'Tāmaki Makaurau'],[1840,'Auckland']],[[1840,'New Zealand']]);
  site('n1159151505',1200,'Lake Geneva',[],[[1815,'Switzerland']]);
  site('n1159135709',1200,'Upper Rhine',[],[[1848,'Switzerland']]);
  site('n1159151515',1886,'Witwatersrand',[],[[1910,'South Africa']]);
  site('n1159151583',1652,'Cape of Good Hope',[],[[1910,'South Africa']]);
  site('n1159150667',1519,'Isthmus of Panama',[],[[1903,'Panama']]);
  site('n1159151467',1608,'Bengal',[],[[1858,'British India'],[1947,'East Bengal'],[1955,'East Pakistan'],[1971,'Bangladesh']]);
  site('n1159150537',1200,'Ifriqiya',[],[[1956,'Tunisia']]);
  site('n1159122449',1200,'Rhineland',[],[[1871,'Germany']]);
  site('n1159151495',1200,'Middle Dnipro',[],[[1991,'Ukraine']]);
  site('n1159151347',1519,'Island of Cuba',[],[[1902,'Cuba']]);
  site('n1159151511',1535,'Rímac valley',[],[[1824,'Peru']]);
  site('n1159151615',1541,'Mapocho valley',[],[[1818,'Chile']]);
  site('n1159151133',1548,'Andean highlands',[],[[1825,'Bolivia']]);
  site('n1159150643',1200,'Western Norway');
  site('n1159151273',1200,'Portugal');
  site('n1159151197',1850,'Samoan islands',[],[[1962,'Samoa']]);
  site('n1159150917',1882,'Fijian islands',[],[[1970,'Fiji']]);
  const keyed=new Map(settlements.map(s=>[s.id,s]));
  function available(id,year){return !!G.cities[id]&&(year>=2000||(keyed.has(id)&&keyed.get(id).start<=year));}
  function at(transitions,year,base){
    let value=base;
    for(const [start,name] of transitions){if(year<start)break;value=name;}
    return value;
  }
  function hash(key){let h=2166136261;for(const c of String(key))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
  const specialties={europe:'Cloth and metalwork',africa:'Regional markets and caravan supplies',americas:'Fibre crafts and food exchange',eastAsia:'Ceramics and textiles',westAsia:'Metalwork and bookmaking',southAsia:'Textiles and grain markets',southeastAsia:'Waterway trade and woodwork',centralAsia:'Caravan services and weaving',oceania:'Fishing and coastal exchange'};
  const carriers={americas:'Footpaths and waterways',oceania:'Walking tracks and canoes',centralAsia:'Pack trains and caravan roads',africa:'Overland routes and waterways'};
  // Fictional development dates vary by locality. Existing cities keep their IDs.
  const futureStages=[
    [2050,'Automated fabrication','Electric transit and autonomous freight','Local supply cooperatives','trade'],
    [2120,'Water recovery and habitat refurbishment','All-weather electric freight corridors','Regional water compact','transport'],
    [2240,'Distributed power and materials recovery','Long-distance automated cargo exchanges','Intercity energy assembly','reform'],
    [2400,'Closed-loop agriculture and ecological engineering','Shared low-energy transport networks','Watershed council','learning']
  ];
  function futureStage(town,year){
    const lag=hash(town+'/development')%33;
    for(let i=futureStages.length-1;i>=0;i--){
      const stage=futureStages[i],start=stage[0]+(i===0?0:lag);
      if(year>=start)return {stage,start,index:i};
    }
    return null;
  }
  function place(id,year){
    const raw=G.cities[id];if(!raw)return null;
    const r=region(id),s=keyed.get(id),modern=year>=2000,known=s&&year>=s.start,phase=futureStage(id,year);
    const city=modern?raw.name:known?at(s.cityNames,year,raw.name):year>=1900?raw.name:'Local settlement';
    const country=modern?G.countries[raw.code].name:known?at(s.polities,year,s.area):regionNames[r];
    const district=hash(id)%29,industrial=1750+district*3,rail=1830+district*2;
    const industry=phase?phase.stage[1]:year<industrial?specialties[r]:year<1950?'Mechanized production and regional trade':'Manufacturing and services';
    const transport=phase?phase.stage[2]:year>=1910?'Road and transit networks':
      (id==='london'&&year>=1836)||(id==='n1159151609'&&year>=1872)?'Roads, rail and waterways':
      year<rail?(carriers[r]||'Roads and waterways'):'Regional freight routes';
    // The index models relative settlement growth, not a census reconstruction.
    const wave=1+Math.sin((year+district)/17)*.07;
    const growth=1+Math.max(0,Math.min(270,year-industrial))/245;
    const pressure=populationShock(id,year);
    const populationIndex=Math.round((60+district)*wave*growth*pressure*(phase?1+phase.index*.08:1));
    return {id,code:raw.code,city,country,label:city+', '+country,region:r,industry,transport,populationIndex,government:phase?phase.stage[3]:country,
      homeIndex:.76+populationIndex/305,wageIndex:.85+populationIndex/555,travelIndex:year<rail?1.1:year<1910?.82:.65};
  }
  function choices(year){
    const ids=year<2000?settlements.filter(s=>year>=s.start).map(s=>s.id):Object.keys(G.cities);
    return ids.map(id=>place(id,year)).sort((a,b)=>a.label.localeCompare(b.label,'en'));
  }
  function nearby(id,year){return settlements.filter(s=>s.start<=year&&s.id!==id&&region(s.id)===region(id)).map(s=>s.id);}
  const SOURCES={
    baghdad:'https://asia.si.edu/wp-content/uploads/2023/04/Qadi-Ahmad-2017-lo.pdf',
    londonPlague:'https://www.londonmuseum.org.uk/collections/london-stories/great-pestilence-london/',
    constantinople:'https://www.worldhistory.org/timeline/Empire_of_Nicaea/',
    caxton:'https://bl.iro.bl.uk/entities/publication/54ad7f91-ed49-4888-bdd1-bc068e90c84f',
    mexico:'https://www.britishmuseum.org/sites/default/files/2019-09/Visit_Aztecs_KS2b.pdf',
    timbuktu:'https://whc.unesco.org/document/222814/',
    londonFire:'https://www.londonmuseum.org.uk/collections/london-stories/monument-great-fire-london/',
    ayutthaya:'https://whc.unesco.org/en/list/576/',
    tokyo:'https://www.toshiseibi.metro.tokyo.lg.jp/documents/d/toshiseibi/pdf_keikaku_chousa_singikai_pdf_tokyotoshizukuri_en_1_00',
    trains:'https://guides.loc.gov/railroads/transcontinental-railroad',
    tube:'https://content.tfl.gov.uk/key-dates-in-the-history-of-london-transport.pdf',
    suez:'https://history.state.gov/milestones/1953-1960/suez',
    canal:'https://guides.loc.gov/chronicling-america-panama-canal',
    india:'https://www.loc.gov/item/98687195/',
    moon:'https://www.nasa.gov/mission/apollo-11/',
    smallpox:'https://www.who.int/news/item/08-05-2020-commemorating-smallpox-eradication-a-legacy-of-hope-for-covid-19-and-other-diseases',
    web:'https://home.cern/science/computing/the-birth-of-the-web/',
    sa:'https://www.gov.za/issues/20years/milestones-20-years-freedom',
    covid:'https://www.who.int/europe/emergencies/situations/CoVid-19',
    warrane:'https://www.nma.gov.au/exhibitions/warrane'
  };
  // These effects and durations are game assumptions, separate from each
  // sourced event statement. Price modifiers expire even if the family moves.
  const effects={
    conflict:{years:4,cost:1.28,pay:.82,home:.80,travel:1.40,population:-.15,joy:-3,damage:10,capital:-.09,detail:'Orders dried up. The merchants left their bills.'},
    fire:{years:3,cost:1.19,pay:1.05,home:.82,travel:1.10,population:-.13,health:-2,damage:17,capital:-.06,detail:'Timber cost more. Nobody offered a discount for buying an entire roof.'},
    disease:{years:3,cost:1.16,pay:.93,home:.89,travel:1.24,population:-.18,health:-4,detail:'Fewer stalls opened at market. The food cost more.'},
    transport:{years:5,cost:.93,pay:1.08,home:1.08,travel:.75,population:.09,joy:2,capital:.06,detail:'Freight got cheaper. The landlord took an interest.'},
    learning:{years:4,cost:1,pay:1.04,home:1.02,travel:1,population:.02,smarts:3,detail:'I found someone willing to teach me. I brought my own questions.'},
    trade:{years:4,cost:.95,pay:1.13,home:1.06,travel:.89,population:.06,bonds:2,capital:.08,detail:'Orders picked up. So did the queue.'},
    migration:{years:3,cost:1.12,pay:.95,home:1.12,travel:1.26,population:.09,bonds:-2,detail:'Relatives needed somewhere to stay. We made room.'},
    reform:{years:3,cost:1.02,pay:1.06,home:1.02,travel:.92,population:.02,smarts:2,detail:'I learned the new rules. There was already a queue.'},
    medical:{years:4,cost:.97,pay:1.02,home:1,travel:1,population:.04,health:3,detail:'The health workers had good news for once.'},
    lean:{years:2,cost:1.20,pay:.88,home:.95,travel:1.12,population:-.06,joy:-2,capital:-.04,detail:'We stretched the supplies. Nothing stretched the price.'}
  };
  function fact(id,year,scope,title,description,effect){
    return {id,year,scope,title,description,effect,kind:'Historical record',source:SOURCES[id]};
  }
  const facts=[
    fact('baghdad',1258,'n1159151547','Baghdad falls','A Mongol army captured Baghdad.','conflict'),
    fact('londonPlague',1348,'london','Plague reaches London','The Black Death reached London.','disease'),
    fact('constantinople',1453,'n1159151579','Ottoman rule in Constantinople','Ottoman forces captured Constantinople.','conflict'),
    fact('caxton',1476,'london','A press at Westminster','William Caxton established his printing business at Westminster.','learning'),
    fact('mexico',1521,'n1159151587','Tenochtitlan falls','Tenochtitlan fell after a siege.','conflict'),
    fact('timbuktu',1591,'n1159150921','An invasion reaches Timbuktu','Moroccan forces occupied Timbuktu.','conflict'),
    fact('londonFire',1666,'london','The Great Fire','Fire swept through the City of London.','fire'),
    fact('ayutthaya',1767,'n1159134449','The fall of Ayutthaya','The Burmese army captured and burned Ayutthaya.','conflict'),
    fact('warrane',1788,'n1159151623','The First Fleet arrives','British colonists established a settlement at Warrane on Gadigal Country.','migration'),
    fact('tube',1863,'london','Trains under London','The Metropolitan Railway opened to passengers.','transport'),
    fact('tokyo',1868,'n1159151609','A new name for Edo','Edo was renamed Tokyo.','reform'),
    fact('trains',1869,'US','Rails cross the continent','The Central Pacific and Union Pacific lines met in Utah.','transport'),
    fact('suez',1869,'EG','The Suez Canal opens','Ships gained a route between the Mediterranean and the Red Sea.','transport'),
    fact('canal',1914,'PA','The Panama Canal opens','The canal opened to ocean traffic.','transport'),
    fact('india',1947,'IN PK','Independence and Partition','British India was partitioned into India and Pakistan.','migration'),
    fact('moon',1969,'US','A landing on the Moon','Apollo 11 astronauts landed on the Moon.','learning'),
    fact('smallpox',1980,'*','Smallpox eradicated','The World Health Assembly declared smallpox eradicated.','medical'),
    fact('web',1993,'CH','The Web opens up','CERN put its World Wide Web software in the public domain.','learning'),
    fact('sa',1994,'ZA','A democratic election','South Africa held its first national election with universal adult suffrage.','reform'),
    fact('covid',2020,'*','A global pandemic','COVID-19 spread around the world.','disease')
  ];
  const byYear=new Map();
  for(const f of facts){
    if(!byYear.has(f.year))byYear.set(f.year,[]);
    byYear.get(f.year).push(f);
  }
  function covers(f,id){return f.scope==='*'||f.scope===id||f.scope.split(' ').includes(G.cities[id]?.code);}
  function populationShock(id,year){
    let n=1;
    for(const e of facts){
      const ago=year-e.year;if(ago<0||ago>=10||!covers(e,id))continue;
      n*=1+effects[e.effect].population*(1-ago/10);
    }
    return n;
  }
  const localEpisodes=[
    ['A thin harvest','Staple food arrived in smaller loads this season.','lean'],
    ['A new market route','Traders found regular buyers beyond the usual market.','trade'],
    ['A roof fire','Fire damaged a block of workshops. Builders began taking orders before dawn.','fire'],
    ['A busy landing','The landing now handles freight on more days of the week.','transport'],
    ['A visiting teacher','A travelling teacher agreed to take local pupils.','learning'],
    ['Families on the move','Several households arrived looking for work and somewhere to sleep.','migration']
  ];
  const industrialEpisodes=[
    ['A freight bottleneck','A damaged crossing delayed fuel and raw materials.','lean'],
    ['An order for local workshops','Traders placed a large order with local producers.','trade'],
    ['Classes after work','A local school opened an evening class for workers.','learning'],
    ['A wider market road','Freight now takes a shorter route around town.','transport']
  ];
  const futureEpisodes=[
    ['The freight grid expands','A new autonomous freight depot accepted its first shipment.','transport'],
    ['A fabrication shortage','The local printers ran short of feedstock. Replacement parts went on back order.','lean'],
    ['A clinic changes hands','A community clinic began screening patients with its new diagnostic system.','medical'],
    ['New climate housing','Households displaced by heat moved into newly cooled housing.','migration'],
    ['The open designs exchange','Local workers began trading machine designs at a public fabrication lab.','learning'],
    ['A power exchange opens','Households can sell surplus stored power to nearby workshops.','trade']
  ];
  function generated(l,town,year){
    const future=futureStage(town,year);
    if(future&&year===future.start&&future.index>0){
      const [,industry,transit,council,effect]=future.stage;
      return {id:'charter-'+town+'-'+year,year,scope:town,title:council,
        description:'The town adopted a new charter covering '+industry.toLowerCase()+'. '+transit+' entered the town budget.',effect,kind:'Future fiction'};
    }
    const block=Math.floor(year/14),h=hash((l.sim.expansion?.seed||l.id)+'/'+town+'/'+block);
    if(year!==block*14+((h>>>8)%14))return null;
    const pool=year>=2050?futureEpisodes:year>=1700?industrialEpisodes:localEpisodes;
    const [title,description,effect]=pool[h%pool.length];
    return {id:'local-'+town+'-'+year,year,scope:town,title,description,effect,kind:year>=2050?'Future fiction':'Local simulation'};
  }
  function active(l,town,year){
    const list=[];
    for(let ago=0;ago<5;ago++){
      const y=year-ago;
      const records=(byYear.get(y)||[]).filter(f=>covers(f,town));
      const fictional=records.length?null:generated(l,town,y);
      if(fictional)records.push(fictional);
      for(const e of records)if(effects[e.effect].years>ago)list.push(e);
    }
    return list;
  }
  function marketEffects(l,town=l.town,year=l.born+l.age){
    const out={pay:1,cost:1,home:1,travel:1};
    for(const e of active(l,town,year)){
      const p=effects[e.effect],strength=1-(year-e.year)/p.years;
      for(const key of Object.keys(out))out[key]*=1+(p[key]-1)*strength;
    }
    return out;
  }
  function annual(l,api){
    const year=l.born+l.age;
    const world=l.sim.chronicleWorld||(l.sim.chronicleWorld={lastYear:null,events:[]});
    if(Number.isInteger(world.lastYear)&&world.lastYear>=year)return [];
    world.lastYear=year;
    const records=active(l,l.town,year).filter(e=>e.year===year);
    for(const e of records){
      const p=effects[e.effect],changes={};
      for(const k of ['joy','smarts','health','bonds'])if(p[k])changes[k]=p[k];
      const delta=api.apply(l,changes);
      const terms=[];
      if(p.damage){
        let count=0;
        for(const asset of Object.values(l.world?.owned||{})){
          const site=asset.listing?.town||asset.town; if(site!==l.town||!Number.isFinite(asset.condition))continue;
          asset.condition=Math.max(1,asset.condition-p.damage);asset.value=Math.max(1,Math.round(asset.value*(1-p.damage/140)));count++;
        }
        if(count)terms.push(count+' local holding'+(count===1?' needed':'s needed')+' repairs.');
      }
      if(p.capital){
        let count=0;
        for(const company of Object.values(l.sim.expansion?.companies||{})){
          if((company.town||l.town)!==l.town||!Number.isFinite(company.capital))continue;
          company.capital=Math.max(0,Math.round(company.capital*(1+p.capital)));count++;
        }
        if(count)terms.push('Family business capital '+(p.capital<0?'fell.':'rose.'));
      }
      const description=e.description+'\n\nMy year · '+p.detail+(terms.length?' '+terms.join(' '):'');
      world.events.push({id:e.id,year,town:l.town,witness:l.id,kind:e.kind,title:e.title,description,source:e.source||null});
      api.log(l,'World',e.kind+' · '+e.title,description,delta);
    }
    if(world.events.length>180)world.events.splice(0,world.events.length-180);
    return records;
  }
  function quote(l,to){
    const year=l.born+l.age,from=l.town,target=place(to,year),origin=place(from,year);
    if(!target||!origin||year>=2000||!keyed.has(to)||keyed.get(to).start>year)return {cost:0,reason:'No historical route to that destination'};
    const domestic=target.country===origin.country,regional=target.region===origin.region;
    const fare=year<1500?220:year<1700?290:year<1900?410:650;
    const cost=Math.round(fare*(domestic?.65:regional?1.1:2.3)*target.travelIndex*marketEffects(l,to,year).travel);
    let reason='';
    if(l.ended)reason='Life complete';
    else if(l.sim.review||l.sim.court||(l.event&&!l.event.resolved))reason='Finish the current decision';
    else if(l.age<18)reason='Opens at 18';
    else if(l.sim.prison)reason='In custody';
    else if(from===to)reason='Current home';
    else if(l.used.includes('relocate'))reason='Already moved this year';
    else if(!regional&&((year<1500&&[target.region,origin.region].includes('americas'))||(year<1788&&[target.region,origin.region].includes('oceania'))))reason='No established passenger route';
    else if(l.cash<cost)reason='Insufficient travel funds';
    return {cost,reason,domestic,regional,transport:target.transport};
  }
  function move(l,to,api){
    const q=quote(l,to);if(q.reason)return null;
    const from=l.town,year=l.born+l.age,home=place(to,year),source=place(from,year);
    const family=l.sim.expansion?.family,withFamily=l.sim.expansion?.policies?.moveFamily!==false;
    const moves=l.sim.residences||(l.sim.residences=[]);
    for(const p of Object.values(l.people)){
      if(['Child','Stepchild'].includes(p.role)&&!p.birthTown){
        const birthAge=p.bornAt??(p.bornYear-l.born);
        let birthTown=l.sim.birthplace||from;
        for(const m of moves)if(m.age<=birthAge)birthTown=m.to;
        p.birthTown=birthTown;
      }
      if(Number.isInteger(p.diedAt)||!p.met||!['Spouse','Partner','Engaged partner','Child','Stepchild'].includes(p.role))continue;
      if(['Child','Stepchild'].includes(p.role)&&(year-p.bornYear>=18||l.age-p.bornAt>=18))continue;
      if(withFamily)p.town=to;else{p.town=p.town||from;p.bond=Math.max(0,p.bond-2);}
      if(family?.[p.id])family[p.id].town=p.town;
    }
    for(const [id,a] of Object.entries(l.world.owned)){
      if(!a.town&&!a.listing?.town&&api.ownedItem?.(id,a)?.category==='Property')a.town=from;
    }
    moves.push({age:l.age,from,to});l.town=to;l.used.push('relocate');
    if(family?.[l.id])family[l.id].town=to;
    if(l.sim.expansion)l.sim.expansion.since=year;
    if(api.campus)api.campus(l);
    const title='Moved to '+home.city,text='I left '+source.city+' for '+home.label+'. The journey ate into my savings.';
    const delta=api.apply(l,{cash:-q.cost,joy:3});api.log(l,'Milestone',title,text,delta);
    return {title,text,delta};
  }
  function validate(l){
    const w=l.sim.chronicleWorld;if(w===undefined)return;
    if(!w||!Array.isArray(w.events)||w.events.length>180||
        !Number.isSafeInteger(w.lastYear)||w.lastYear>l.born+l.age||
        w.events.some(e=>!e||!Number.isSafeInteger(e.year)||e.year>w.lastYear||
          !G.cities[e.town]||typeof e.id!=='string'||typeof e.title!=='string'||
          typeof e.description!=='string'||!['Historical record','Local simulation','Future fiction'].includes(e.kind)))
      throw Error('Invalid historical world record.');
  }
  root.PocketHistoryWorld={validate,place,choices,available,nearby,region,era,marketEffects,annual,quote,move,facts};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
