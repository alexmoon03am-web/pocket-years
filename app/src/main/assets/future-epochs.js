/* Fictional future scenarios. Values are purchasing-power units compatible
   with existing bank balances, businesses and inherited deeds. */
(function(root){
  'use strict';
  const chapters=[
    {id:'future',first:2050,theme:'future',name:'Orbital archive',icon:'spark',fare:1500},
    {id:'planetary',first:2150,theme:'planetary',name:'Planetary almanac',icon:'leaf',fare:950},
    {id:'stellar',first:2500,theme:'stellar',name:'Long-voyage atlas',icon:'compass',fare:600}
  ];
  function chapter(year){
    if(year<2050)return null;
    for(let i=chapters.length-1;i>=0;i--)if(year>=chapters[i].first)return chapters[i];
    return null;
  }
  // Data rows follow the market, vocation, school and activity contracts of
  // history-economy. Companies and goods have stable IDs after a chapter ends.
  const households={
    planetary:[6800,9800,.19,1,'credits','Reclamation depot assistant'],
    stellar:[4900,12800,.21,1,'credits','Relay mail assistant']
  };
  const roles={
    planetary:[
      ['sorter','Reclamation sorter',49800,0,'Grade a batch of recovered glass'],
      ['tender','Reservoir tender',56800,0,'Inspect the public cisterns'],
      ['ferryman','Stratospheric ferry pilot',79800,2,'Book a high-altitude crossing'],
      ['canopy','Canopy architect',95500,3,'Design a shaded neighborhood'],
      ['waterclerk','Water rights mediator',80200,2,'Reconcile two reservoir claims'],
      ['reefkeeper','Coastal reef steward',70500,1,'Survey a restored shoreline'],
      ['heatsurvey','Deep-heat surveyor',93700,3,'Measure a district heat well',2250]
    ],
    stellar:[
      ['relayclerk','Relay post clerk',57200,0,'Sort correspondence by arrival decade'],
      ['nursery','Ship nursery gardener',64600,0,'Graft a replacement fruit tree'],
      ['clockkeeper','Transit clock keeper',93800,2,'Synchronize a transfer hub'],
      ['sailmaker','Light-sail rigger',80500,1,'Tension a freight sail'],
      ['archivist','Long-voyage archivist',92300,2,'Recover an old passenger ledger'],
      ['ringwright','Spin habitat engineer',132500,3,'Balance a residential ring'],
      ['diplomat','Delay-treaty interpreter',118500,3,'Review a decades-old agreement',2750],
      ['starcart','Transit beacon cartographer',125500,3,'Reconcile three stellar charts',2900]
    ]
  };
  const goods={
    planetary:[
      ['canopyflat','Shaded canopy flat','Property',178000,0],['tidalhouse','Tidal courtyard home','Property',287000,0],
      ['waterworks','Neighborhood waterworks','Property',370000,21600],['heatwell','Deep-heat lease','Property',421000,27700,2250],
      ['sunskiff','Solar ferry skiff','Vehicle',38400,3100],['freightkite','Stratospheric cargo kite','Vehicle',72100,5700],
      ['waterbank','Rainwater condenser','Equipment',18900,1300],['glassmill','Reclaimed glass mill','Equipment',28400,2100]
    ],
    stellar:[
      ['ringflat','Spin-ring apartment','Property',253000,0],['voyageberth','Generational voyage berth','Property',284000,0],
      ['relaydock','Relay-port warehouse','Property',475000,27800],['gardenvault','Ship orchard vault','Property',369000,21100,2700],
      ['sailtender','Light-sail tender','Vehicle',72700,5600],['transfercabin','Transfer cabin','Vehicle',43800,0],
      ['starclock','Navigation clock array','Equipment',33100,2500],['seedchest','Shipboard seed chest','Equipment',14400,960],
      ['deepscout','Beacon servicing launch','Vehicle',117000,8700,2900]
    ]
  };
  const concerns={
    planetary:[['refill','Water reclamation cooperative',51600,85800],['canopies','District shade works',81500,125000],['ferry','High-altitude ferry line',132000,195000],['heat','Deep-heat utility',175000,251000,2250]],
    stellar:[['relay','Delay-mail exchange',69000,101000],['orchard','Voyage orchard cooperative',82100,134000],['chandlery','Light-sail chandlery',107000,171000],['signals','Deep beacon service',197000,296000,2900]]
  };
  const diversions={
    planetary:[
      ['tidalwalk','Walk the tidal gardens','health',6,35,'The boardwalk moved. The ducks found this normal.'],
      ['watershed','Join a watershed supper','bonds',7,110,'Everyone brought a dish and their water bill.'],
      ['reclaim','Take a salvage class','smarts',6,0,'I took a kettle apart and left with a working kettle. Same one.'],
      ['skyferry','Take a stratospheric ferry','joy',8,260,'The clouds were below my seat. The seat was still cramped.'],
      ['heatbath','Visit a district heat bath','health',7,80,'I spent an hour enjoying the municipal plumbing.',2250]
    ],
    stellar:[
      ['ringsport','Play low-spin handball','health',7,60,'The referee had to wait for the ball to come down.'],
      ['packet','Record a family letter packet','bonds',7,85,'We promised to write again before this one got there.'],
      ['starclass','Learn to read a beacon chart','smarts',6,0,'I found our nearest neighbor on page forty.'],
      ['sailrace','Watch the light-sail regatta','joy',8,170,'The winner crossed the line last week. The pictures just arrived.'],
      ['translation','Join the return-letter circle','smarts',6,25,'One letter used a word that had gone out of fashion twice.',2750]
    ]
  };
  const learning={
    planetary:['Visit the water table classroom','Apprentice at a reclamation depot','Study watershed engineering'],
    stellar:['Join the relay correspondence school','Train in a rotating workshop','Study long-baseline navigation']
  };
  const industries={
    future:{Services:'Autonomous transport',Industry:'Habitat fabrication',Technology:'Robotic fleet design',Care:'Regenerative care',Creative:'Immersive studios',Commerce:'Orbital freight'},
    planetary:{Services:'Watershed utilities',Industry:'Materials reclamation',Technology:'District heat systems',Care:'Climate recovery clinics',Creative:'Canopy design',Commerce:'High-altitude freight'},
    stellar:{Services:'Relay correspondence',Industry:'Light-sail rigging',Technology:'Navigation beacons',Care:'Spin rehabilitation',Creative:'Voyage archives',Commerce:'Long-voyage freight'}
  };
  const projects={
    future:['Orbital transfer extension','Fabrication yard closure','Transit battery investment'],
    planetary:['Reservoir corridor extension','Reclamation foundry closure','Canopy district investment'],
    stellar:['Relay-port extension','Light-sail yard closure','Beacon station investment']
  };
  const firmSectors={
    hydro:'Industry',fabrication:'Technology',orbital:'Commerce',refill:'Services',canopies:'Creative',ferry:'Commerce',heat:'Technology',
    relay:'Services',orchard:'Industry',chandlery:'Commerce',signals:'Technology'
  };
  const clinics={
    future:['Visit a regenerative clinic','The clinic fitted a repair patch.',550,7],
    planetary:['Book a district recovery session','I spent the afternoon in the community recovery unit.',390,9],
    stellar:['Attend a shipboard rehabilitation lab','The lab adjusted its gravity to suit the patient. I was the patient.',460,12]
  };
  const contracts={
    future:{types:['era-delivery','era-bioprinter'],title:'Take an urgent depot order',result:'The depot paid extra for an overnight run.'},
    planetary:{types:['era-waterworks','era-waterbank','era-glassmill','era-heatwell'],title:'Fill a district supply order',result:'The district paid for a reserve delivery. The pump will remember it.'},
    stellar:{types:['era-relaydock','era-sailtender','era-deepscout','era-gardenvault','era-starclock'],title:'Provision a departing tender',result:'The tender left on time. Its invoice came back much sooner.'}
  };
  const developments=[
    {year:2080,title:'Orbital transfer tickets',description:'The first common transfer ticket covered city transit and the orbital terminals.',effect:'transport'},
    {year:2150,title:'A planetary water exchange',description:'Districts linked their reclaimed water reserves. Deposits could now pay a supplier across a watershed.',effect:'trade'},
    {year:2200,title:'Free public ferry transfers',description:'High-altitude ferry terminals accepted connecting passengers on a single ticket.',effect:'transport'},
    {year:2250,title:'District heat wells',description:'Deep wells began supplying district heat. Municipalities issued the first operating leases.',effect:'trade'},
    {year:2500,title:'The long-voyage mail compact',description:'Ports agreed to deliver messages for crews whose return dates ran into the next century.',effect:'learning'},
    {year:2750,title:'A treaty written in transit',description:'Distant ports agreed on how to honor contracts ratified decades apart.',effect:'reform'},
    {year:2900,title:'The deep beacon network',description:'Reliable navigation signals reached the outer relay ports. Surveyors and service crews started taking orders.',effect:'transport'},
    {year:3000,title:'The thousand-year seed exchange',description:'Settlements pooled their oldest orchard lines and distributed replacements for failed crops.',effect:'trade'}
  ];
  const episodes={
    planetary:[
      ['An algae screen fouls','A ferry inlet needed cleaning. The extra crossings cost more.','lean'],
      ['The shade corridor opens','A public canopy linked workshops to the freight station.','transport'],
      ['Extra reservoir credits','Water stocks recovered. The cooperative accepted new orders.','trade'],
      ['The cooling shelter','A district bath opened its doors during the heat.','medical']
    ],
    stellar:[
      ['A relay goes quiet','The undelivered cargo filled the transfer shed. Crews had to wait.','lean'],
      ['The return packet arrives','A mail tender brought lessons written by the last generation of navigators.','learning'],
      ['An orchard surplus','A ship orchard sold its spare fruit at the relay port.','trade'],
      ['The transfer clocks agree','Independent ports synchronized their passenger connections.','transport']
    ]
  };
  const api={chapters,chapter,households,roles,goods,concerns,diversions,learning,clinics,contracts,industries,projects,firmSectors,developments,episodes};
  root.PocketFuture=api;
})(typeof module!=='undefined'&&module.exports?module.exports:window);
