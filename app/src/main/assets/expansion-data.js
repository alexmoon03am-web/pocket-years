(function(root){
  'use strict';
  const shops={
    velo:{name:'Switchback Motorcycles',category:'Vehicle',focus:'Scooters, tourers, dirt bikes and superbikes',icon:'bike',age:18},
    chrome:{name:'Chrome & Laurel Classics',category:'Vehicle',focus:'Restored and unrestored collector cars',icon:'key',age:18},
    freight:{name:'Axle Commercial',category:'Vehicle',focus:'Fleet trucks, service bodies and heavy transport',icon:'van',age:18},
    summit:{name:'Meridian Collection',category:'Vehicle',focus:'Coachbuilt luxury, supercars and limited-run hypercars',icon:'spark',age:18},
    quay:{name:'Quayside Commercial',category:'Property',focus:'Shops, offices, workshops and warehouses',icon:'shop',age:18},
    horizon:{name:'Horizon Retreats',category:'Property',focus:'Working farms, second homes and vacation rentals',icon:'compass',age:18}
  };
  const cars={
    velo:[
      ['scooter','City scooter',2900,'Mica Finch','Odo Loop'],['commuterbike','Commuter motorcycle',5800,'Odo Lane','Mirai Cub'],
      ['enduro','Enduro motorcycle',8700,'Torin Scrub','Kestrel Trail'],['cruiser','Cruiser motorcycle',16900,'Carrow Chief','Torin Road'],
      ['tourbike','Touring motorcycle',25500,'Mirai Horizon','Carrow Coast'],['superbike','Track superbike',32400,'Kestrel Twelve','Torin RS'],
      ['sidecar','Sidecar rig',18200,'Odo Tandem','Carrow Twin'],['electricbike','Electric motorcycle',14700,'Mica Amp','Mirai Volt']
    ],chrome:[
      ['woodie','Wood-panel wagon',44500,'Gable Grove','Canton Pine'],['bubble','Bubble microcar',23300,'Brio Pod','Velin Pearl'],
      ['classicgt','Classic grand tourer',189000,'Velin 290','Paloma GTS'],['pony','Vintage pony car',68500,'Canton Broncolet','Gable Windsor'],
      ['prewar','Prewar luxury saloon',145000,'Aldwyn Crown','Velin Sovereign'],['rally','Homologation rally car',124000,'Brio Gravel','Paloma Dust'],
      ['oldtruck','Collector pickup',37400,'Canton Forge','Gable Rancher'],['classicspyder','Classic open-top sports car',96500,'Paloma Spyder','Aldwyn Moth']
    ],freight:[
      ['boxtruck','Box truck',48000,'Atlas Freight 6','Ferro Cube'],['tipper','Tipper truck',94000,'Ferro T20','Nord Hauler'],
      ['semitruck','Highway tractor',172000,'Nord 780','Atlas Longline'],['fridgevan','Refrigerated van',69000,'Ferro Coldline','Maris Chill'],
      ['flatbed','Flatbed carrier',81000,'Atlas Deck','Nord F20'],['towtruck','Recovery truck',107000,'Ferro Hook','Maris Recovery'],
      ['shuttlebus','Shuttle bus',86500,'Maris Citylink','Nord Shuttle'],['utilityrig','Utility service truck',74000,'Atlas Lift','Ferro Works']
    ],summit:[
      ['hyperhybrid','Hybrid hypercar',1470000,'Orison Eight','Savelle Zenith'],['hypertrack','Track hypercar',2400000,'Davos R-One','Orison Arrow'],
      ['electricgt','Electric hyper GT',970000,'Aerion Halo','Savelle Current'],['speedster','Limited-run speedster',560000,'Davos Coast','Aerion Veloce'],
      ['limo','Coachbuilt limousine',365000,'Valmont Sovereign','Aldwyn State'],['luxsuv','Ultra-luxury SUV',285000,'Valmont Summit','Aldwyn Range'],
      ['v12','V12 supercar',398000,'Savelle Twelve','Orison Falcon'],['bespokecoupe','Bespoke luxury coupé',490000,'Valmont Silk','Aerion Obsidian']
    ]};
  const homes={
    quay:[['cornerstore','Corner retail unit',148000,12800,0,0],['officesuite','Office suite',232000,16800,0,0],['garagebay','Service garage',185000,14600,0,0],['warehouse','Distribution warehouse',890000,78200,0,0],['stripmall','Retail arcade',1350000,106000,0,0],['hotel','Boutique hotel',1950000,144000,0,0],['workshop','Light industrial workshop',318000,24500,0,0],['officetower','Office tower',5900000,455000,0,0]],
    horizon:[['vineyard','Working vineyard',625000,25900,3,6],['orchard','Orchard farm',279000,14100,2,5],['skilodge','Ski lodge',468000,21200,4,8],['seavilla','Vacation villa',745000,31900,3,7],['islandhome','Island guesthouse',1220000,49300,4,8],['holidaycondo','Holiday condo',154000,8300,1,3],['desertretreat','Desert retreat',397000,16200,2,5],['farmstead','Working dairy farm',512000,23700,3,6]]
  };
  const sectors={
    Care:['Clinical decision','Review a complicated case','Check the notes with a colleague','Cover another clinic','Clinical practice','heart'],
    Technology:['Release review','Test a release candidate','Write a failure report','Lead the rollout','Systems reliability','code'],
    Industry:['Site inspection','Trace an equipment fault','Document the safety check','Take a rush contract','Technical operations','tools'],
    Creative:['Commission review','Pitch an original concept','Credit the whole team','Take a marquee commission','Arts production','palette'],
    Commerce:['Client portfolio','Audit a client account','Disclose a billing error','Compete for a major account','Financial practice','wallet'],
    Services:['Service desk','Resolve a difficult request','Back a junior colleague','Cover a busy weekend','Service leadership','people']
  };
  // Title, annual base salary, employer, qualification, minimum smarts, sector, job-specific assignment.
  const professions={
    architect:['Architect',85000,'Northline Studio','college',65,'Creative','Redesign an inaccessible entrance'],
    urbanist:['Urban planner',69200,'Planning Bureau','college',55,'Services','Hold a zoning hearing'],
    engineer:['Civil engineer',92500,'Span Works','science',60,'Industry','Inspect a bridge expansion joint'],
    pharmacist:['Pharmacist',102000,'Beacon Pharmacy','science',68,'Care','Reconcile two conflicting prescriptions'],
    therapist:['Occupational therapist',72000,'Daybreak Clinic','science',58,'Care','Plan a patient’s return to work'],
    analyst:['Data analyst',75500,'Signal House','college',62,'Technology','Investigate a broken forecast'],
    director:['Operations director',142000,'Union Group','business',62,'Commerce','Negotiate a supplier agreement'],
    executive:['Chief executive',237000,'Meridian Group','business',70,'Commerce','Defend the annual plan to the board'],
    mechanic:['Fleet mechanic',52500,'Depot Nine','trade',35,'Industry','Diagnose a refrigerated truck'],
    audioengineer:['Sound engineer',61600,'Room Tone','trade',45,'Creative','Rescue a live recording'],
    auditor:['External auditor',78900,'Ledger Office','business',65,'Commerce','Reconcile a missing invoice'],
    producer:['Theater producer',64200,'Lantern Theatre','stage',45,'Creative','Recast a sold-out matinee'],
    dispatcher:['Dispatch coordinator',47600,'Route Office','any',35,'Services','Reroute a stalled delivery fleet'],
    arborist:['Arborist',48800,'Canopy Co.','trade',35,'Industry','Inspect a storm-damaged park'],
    engineerqa:['Quality engineer',81300,'Kiln Systems','college',60,'Technology','Reproduce an intermittent defect'],
    interpreter:['Interpreter',58700,'Bridge Languages','college',55,'Services','Interpret a town hearing']
  };
  const assignments={
    physician:'Review a patient handover',nurse:'Organize a ward handover',researcher:'Repeat a disputed result',developer:'Trace a payroll bug',
    teacher:'Design a catch-up lesson',lawyer:'Prepare a pro bono brief',chef:'Rewrite the seasonal menu',baker:'Test a long-fermented dough',
    electrician:'Inspect a faulty switchboard',luthier:'Restore a cracked violin',accountant:'Close the end-of-year books',
    journalist:'Verify a tip before deadline',actor:'Read for an understudy role',athlete:'Train a relay squad',performer:'Arrange an encore',
    designer:'Redraw a book jacket',photographer:'Reshoot a double-booked wedding',guide:'Survey a washed-out trail',organizer:'Rebook a flooded venue',
    barista:'Train a new barista',cashier:'Reconcile the evening till',custodian:'Restore a flooded classroom',courier:'Route a missed delivery',
    assistant:'Recover a missing contract',receptionist:'Rebook a stranded guest',clerk:'Recount the stockroom',manager:'Rebuild the shift rota',
    trainee:'Complete a supervised installation',parttime:'Coach a returning worker'
  };
  function sector(job){
    if(professions[job])return professions[job][5];
    if(['physician','nurse'].includes(job))return 'Care';
    if(['developer','researcher'].includes(job))return 'Technology';
    if(['electrician','luthier','trainee','custodian','courier'].includes(job))return 'Industry';
    if(['designer','actor','journalist','performer','photographer','chef','baker'].includes(job))return 'Creative';
    if(['accountant','lawyer','manager','cashier'].includes(job))return 'Commerce';
    return 'Services';
  }
  const businesses={
    studio:['Design studio','Creative',4200,2800],repair:['Repair workshop','Industry',6800,4300],consult:['Consultancy','Commerce',9600,6500],
    software:['Software company','Technology',16500,11200],clinic:['Care agency','Care',12000,8100],hotel:['Guesthouse business','Services',26000,15400]
  };
  const hobbies={gardening:['Community gardening','health','leaf'],music:['Playing music','joy','guitar'],chess:['Club chess','smarts','grid'],running:['Distance running','health','shoe'],ceramics:['Studio pottery','joy','palette'],astronomy:['Amateur astronomy','smarts','compass']};
  root.PocketExpansionData={shops,cars,homes,sectors,professions,assignments,sector,businesses,hobbies};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
