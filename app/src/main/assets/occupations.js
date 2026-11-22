/* Occupational pathways share the ordinary payroll, job board and promotion system.
   Pay is expressed in the reference purchasing power used by the existing job table. */
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const entries = Object.create(null);
  const professions = Object.create(null);
  const categories = [];
  const titles = {certificate:'certificate', associate:'associate degree', bachelor:'bachelor’s degree',
    master:'master’s degree', doctorate:'doctorate', professional:'professional qualification'};
  const grades = {certificate:30, associate:40, bachelor:48, master:58, doctorate:65, professional:65};
  function register(category, sector, employer, field, level, positions) {
    if (!categories.includes(category)) categories.push(category);
    for (const [title, pay, assignment, experience = 0, rules = {}] of positions) {
      const id = 'occ-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
      const selected = rules.level === undefined ? level : rules.level;
      const subject = rules.field || field;
      const smarts = rules.smarts ?? (grades[selected] || 0);
      entries[id] = {id, title, category, sector, employer, assignment, field:subject, level:selected,
        experience, smarts, year:rules.year || 2000, clearance:!!rules.clearance, license:!!rules.license,
        fitness:rules.fitness || 0, reputation:rules.reputation || 0, yearsInField:rules.yearsInField || 0, physicianYears:rules.physicianYears || 0};
      // 'any' leaves the specific qualification to requirement(), which checks the full transcript.
      professions[id] = [title, pay, employer, 'any', smarts, sector, assignment];
    }
  }
  register('Food & hospitality', 'Services', 'Juniper House', 'hospitality', null, [
    ['Room attendant',30300,'Turn over the last two rooms'], ['Breakfast cook',35100,'Rescue a breakfast service'],
    ['Banquet server',30900,'Reset a table for an unexpected guest'], ['Hotel porter',32100,'Trace a missing suitcase'],
    ['Reservation agent',37500,'Untangle a double booking'], ['Kitchen steward',30200,'Reorganize the wash station'],
    ['Catering coordinator',44200,'Redraw a rainy-day seating plan',1], ['Dining room supervisor',47500,'Balance a short-staffed shift',3],
    ['Pastry chef',48800,'Adapt a pastry order to an allergy',2,{level:'certificate'}],
    ['Hotel operations manager',72200,'Negotiate the conference block',5,{level:'bachelor',yearsInField:2}]
  ]);
  register('Retail & customer service', 'Services', 'Arcade Stores', 'business', null, [
    ['Stock associate',31300,'Find the cartons booked into the wrong aisle'], ['Florist',34600,'Rebuild a wedding bouquet'],
    ['Bookshop assistant',32000,'Track down an out-of-print edition'], ['Customer service agent',35200,'Resolve a disputed delivery'],
    ['Visual merchandiser',41300,'Rehang the window display',1], ['Jewelry appraiser',51800,'Check a consignment valuation',2,{field:'craft',level:'certificate'}],
    ['Retail buyer',62800,'Choose the next season’s stock',3,{level:'associate'}],
    ['Store operations supervisor',48900,'Rebalance weekend staffing',3], ['Wholesale representative',52000,'Replace an overdue wholesale order',2]
  ]);
  register('Building & skilled trades','Industry','Brickline Cooperative','construction','certificate',[
    ['Carpenter',54700,'Refit a door in a settling frame'], ['Plumber',58100,'Trace a leak across two floors'],
    ['Glazier',49300,'Measure a replacement storefront pane'], ['Bricklayer',51000,'Repoint a failing arch'],
    ['Roofer',48200,'Locate the leak the survey missed'], ['Tile setter',46700,'Match a discontinued floor pattern'],
    ['Cabinetmaker',50800,'Remake a drawer on a crooked wall',0,{field:'craft'}],
    ['Lift technician',79300,'Inspect a stopped service lift',2,{field:'engineering'}],
    ['Building inspector',66900,'Review an access ramp against the plan',3,{level:'associate'}],
    ['Site superintendent',81600,'Reschedule trades after a concrete delay',5,{yearsInField:2}],
    ['Survey assistant',40200,'Recheck two conflicting boundary marks',0,{level:null}]
  ]);
  register('Manufacturing & repair','Industry','Morrow Fabrication','manufacturing','certificate',[
    ['Assembly worker',36400,'Trace a faulty batch label',0,{level:null}], ['Welder',50500,'Test a repaired seam'],
    ['Tool and die maker',60400,'Fit a replacement die',2], ['Machinist',53900,'Correct a drifting cut'],
    ['Industrial electrician',62500,'Diagnose a stalled conveyor',1,{field:'engineering'}],
    ['Refrigeration mechanic',59200,'Find an intermittent cold-room fault',1], ['Upholsterer',42200,'Recover a damaged seat',0,{field:'craft'}],
    ['Production scheduler',52000,'Resolve a double-booked production run',1,{field:'business',level:'associate'}],
    ['Precision instrument maker',64300,'Calibrate a returned instrument',2], ['Process engineer',82900,'Test a lower-waste production run',2,{level:'bachelor'}]
  ]);
  register('Medicine & allied health','Care','Willow District Health','health','associate',[
    ['Dental assistant',41600,'Prepare a nervous patient for a visit',0,{level:'certificate'}],
    ['Medical records technician',43800,'Reconcile two files with the same name'],
    ['Imaging technologist',67200,'Repeat an unreadable scan'],
    ['Community health worker',43000,'Arrange a missed follow-up visit',0,{level:'certificate'}],
    ['Laboratory technologist',59200,'Flag a mislabeled specimen',0,{level:'bachelor'}],
    ['School nurse',64100,'Write a care plan for a new pupil',1,{field:'nursing',level:'bachelor',clearance:true}],
    ['Ward nurse',67000,'Organize a handover between shifts',0,{field:'nursing',clearance:true}],
    ['Advanced practice nurse',105000,'Review a complicated referral',3,{field:'nursing',level:'professional',clearance:true}],
    ['Clinical pharmacist',108000,'Reconcile a discharge list',1,{level:'professional',clearance:true}],
    ['Pediatrician',151000,'Coordinate a child’s specialist referral',3,{field:'medicine',level:'professional',clearance:true}],
    ['Family physician',145000,'Follow up an inconclusive test',2,{field:'medicine',level:'professional',clearance:true}],
    ['Anesthesiologist',173000,'Lead the preoperative briefing',5,{field:'medicine',level:'professional',clearance:true,physicianYears:3}],
    ['Psychiatrist',157000,'Review the outpatient rota',3,{field:'medicine',level:'professional',clearance:true}],
    ['Clinical psychologist',88500,'Review a long-running case',2,{field:'psychology',level:'doctorate',clearance:true}],
    ['Rehabilitation aide',36000,'Adapt an exercise station',0,{level:'certificate'}],
    ['Hospital social worker',61000,'Arrange support after discharge',1,{field:'social-work',level:'master'}]
  ]);
  register('Law & public safety','Services','District Services Office','law','bachelor',[
    ['Court clerk',44100,'Recover a misfiled hearing notice',0,{level:null}], ['Legal assistant',45100,'Reconcile a case calendar'],
    ['Court interpreter',58500,'Prepare for a multilingual hearing',1,{field:'arts'}],
    ['Public defender',82400,'Review evidence before a hearing',1,{level:'professional',clearance:true}],
    ['Family attorney',96700,'Draft an amended custody agreement',2,{level:'professional',clearance:true}],
    ['Employment counsel',103000,'Settle a disputed contract term',3,{level:'professional',clearance:true}],
    ['Magistrate',117000,'Review a contested filing',8,{level:'professional',clearance:true,yearsInField:3,reputation:15}],
    ['Firefighter',52100,'Inspect an evacuation route',0,{field:'public-safety',level:'certificate',fitness:65}],
    ['Emergency coordinator',68700,'Revise the flood response rota',3,{field:'public-safety'}],
    ['Probation officer',55400,'Arrange a reentry appointment',1,{field:'social-work',clearance:true}]
  ]);
  register('Engineering & design','Industry','Truss Design Office','engineering','bachelor',[
    ['Structural engineer',81700,'Review a revised roof load',2], ['Mechanical engineer',80700,'Inspect a worn coupling',1],
    ['Electrical engineer',83400,'Review a substation upgrade',1], ['Water resources engineer',75900,'Model an overflowing basin',1],
    ['Materials engineer',81100,'Investigate a premature fracture',2], ['Acoustical engineer',77500,'Diagnose a concert hall echo',1],
    ['Biomedical engineer',83500,'Test a redesigned mobility aid',2], ['Geotechnical engineer',80000,'Recheck a hillside survey',1],
    ['Energy systems engineer',84300,'Compare two heat-recovery designs',2], ['Design drafter',49400,'Correct a section drawing',0,{level:'associate'}],
    ['Engineering fellow',103000,'Defend a long-term research proposal',6,{level:'doctorate',yearsInField:2}]
  ]);
  register('Computing & technology','Technology','Patch Bay Systems','computing','bachelor',[
    ['Help desk technician',42900,'Recover a lost accessibility profile',0,{level:'certificate'}],
    ['Network technician',53500,'Map a silent network segment',0,{level:'associate'}],
    ['Database administrator',77600,'Restore a missing invoice history',2], ['Accessibility developer',76400,'Repair a broken keyboard workflow',1],
    ['Systems administrator',66800,'Rehearse a backup restoration',1], ['Game programmer',77300,'Fix an unreliable checkpoint',1],
    ['Mobile interface developer',80700,'Reduce a slow phone’s startup time',1,{year:2008}],
    ['Data engineer',85000,'Reconcile competing data feeds',2], ['Machine learning researcher',105000,'Replicate a published result',3,{level:'doctorate',year:2012}],
    ['Privacy engineer',92000,'Reduce retention of unused records',3], ['Platform reliability lead',103000,'Coordinate an outage review',5,{yearsInField:2}]
  ]);
  register('Money & commerce','Commerce','Two Rivers Mutual','finance','bachelor',[
    ['Bank teller',35300,'Find a discrepancy in the till',0,{level:null}], ['Payroll clerk',42500,'Correct a missed overtime payment',0,{field:'business',level:'associate'}],
    ['Bookkeeper',44900,'Reconcile two months of receipts',0,{field:'business',level:'certificate'}],
    ['Credit analyst',66400,'Review a seasonal repayment plan'], ['Claims adjuster',55200,'Document a storm-damaged shop',1,{field:'business'}],
    ['Tax accountant',69600,'Reconcile a quarterly return',1,{field:'accounting'}], ['Risk analyst',78600,'Price an overdue loan portfolio',2],
    ['Pension analyst',71200,'Recheck a member’s benefit projection',1], ['Treasury manager',92100,'Cover a short-term liquidity gap',5,{yearsInField:2}],
    ['Actuary',94300,'Test a claim-cost assumption',3,{field:'mathematics'}], ['Investment economist',96700,'Revisit a regional forecast',4,{level:'master'}]
  ]);
  register('Education & research','Services','North Terrace Learning Trust','education','bachelor',[
    ['Teaching assistant',34400,'Adapt a difficult worksheet',0,{level:null}], ['Primary teacher',50300,'Plan support for a mixed-age class',0,{clearance:true}],
    ['Language teacher',52600,'Adapt a lesson for new speakers',0,{clearance:true}], ['Learning support teacher',55000,'Revise a pupil’s support plan',1,{clearance:true}],
    ['School counselor',58500,'Run a confidential drop-in session',2,{field:'psychology',level:'master',clearance:true}],
    ['Instructional designer',64700,'Rewrite an inaccessible exam',2], ['School principal',84700,'Negotiate a new staffing plan',6,{level:'master',yearsInField:3,clearance:true}],
    ['Research technician',43800,'Repeat a failed control test',0,{field:'science'}], ['Laboratory researcher',73500,'Replicate an unexpected finding',2,{field:'science',level:'doctorate'}],
    ['Mathematics lecturer',72800,'Teach the proof two different ways',2,{field:'mathematics',level:'doctorate'}],
    ['Academic historian',68400,'Reconcile two conflicting archive dates',2,{field:'history',level:'doctorate'}]
  ]);
  register('Transport & logistics','Industry','Waybill Exchange','transport','certificate',[
    ['Warehouse picker',33300,'Find stock filed under an old code',0,{level:null}], ['Freight handler',36700,'Rebalance a mixed load',0,{level:null}],
    ['Bus operator',43500,'Plan a step-free diversion',0,{license:true}], ['Truck driver',51700,'Reschedule a refrigerated delivery',0,{license:true}],
    ['Rail conductor',53900,'Recover a missed connection',1], ['Freight broker',55800,'Find space for a delayed shipment',1,{field:'business',level:'associate'}],
    ['Harbor pilot',83900,'Reserve a difficult tidal passage',5,{yearsInField:2}], ['Transit planner',67500,'Redraw a route around a closed bridge',2,{level:'bachelor'}],
    ['Flight dispatcher',63700,'Work around a weather closure',2], ['Port operations manager',81700,'Clear a crowded unloading berth',5,{level:'bachelor',yearsInField:2}]
  ]);
  register('Land & environment','Industry','Hedgerow Field Office','environment','bachelor',[
    ['Farm hand',30600,'Reset the irrigation rota',0,{level:null}], ['Orchard manager',48500,'Move a harvest ahead of frost',2,{field:'agriculture',level:'certificate'}],
    ['Soil scientist',65800,'Compare two conflicting soil samples',1,{field:'agriculture',level:'bachelor'}],
    ['Agronomist',67600,'Trial a drought-tolerant rotation',1,{field:'agriculture',level:'bachelor'}], ['Forester',57200,'Mark a woodland thinning boundary'],
    ['Wetland ecologist',65300,'Survey a recovering waterway',1], ['Air quality technician',46100,'Replace a roadside sample filter',0,{level:'associate'}],
    ['Conservation officer',52800,'Resolve a trail access dispute'], ['Hydrologist',69100,'Verify an unusually high river reading',1],
    ['Environmental impact assessor',72400,'Review a proposed access road',2], ['Restoration field lead',75100,'Prioritize next year’s restoration sites',4,{yearsInField:2}]
  ]);
  register('Media & performance','Creative','Lantern Yard Productions','media','bachelor',[
    ['Stagehand',35500,'Reset the stage between scenes',0,{level:null}], ['Costume technician',42300,'Refit an understudy’s costume',0,{field:'craft',level:'certificate'}],
    ['Camera operator',52400,'Reframe a scene after a lighting change',1,{level:'associate'}], ['Film editor',63900,'Restructure a difficult cut',2],
    ['News producer',61600,'Verify a late-breaking report',2], ['Documentary director',71600,'Secure access to an interview',4,{yearsInField:2}],
    ['Casting assistant',38100,'Reschedule a crowded audition',0,{level:null}], ['Voice actor',50700,'Record three readings of a scene',0,{level:null,reputation:12}],
    ['Session musician',49800,'Rescore a last-minute arrangement',0,{field:'music',level:null,reputation:12}],
    ['Music teacher',50300,'Help a beginner keep time',0,{field:'music'}], ['Orchestra librarian',46200,'Prepare corrected parts for the concert',0,{field:'music'}],
    ['Sound editor',55600,'Repair an uneven dialogue track',1,{level:'associate'}], ['Arts publicist',55700,'Rewrite a tour announcement',1]
  ]);
  register('Sport & recreation','Services','East Gate Athletics','athletics','bachelor',[
    ['Recreation assistant',33300,'Adapt an activity for a mixed group',0,{level:null}], ['Swimming instructor',39100,'Teach a hesitant swimmer',0,{level:null,fitness:60}],
    ['Athletics coach',48200,'Build a return-to-training plan',1,{fitness:55}], ['Performance analyst',60300,'Review a squad’s recovery data',1],
    ['Sports scout',49900,'Write a scouting report on a reserve',2,{level:null,reputation:12}],
    ['League official',52100,'Review a disputed result',2,{level:null,yearsInField:2,reputation:8}], ['Club sporting director',83600,'Choose a recruiting priority',6,{yearsInField:3,reputation:18}]
  ]);
  register('Public service & policy','Services','District Assembly Office','politics','bachelor',[
    ['Constituency assistant',41200,'Resolve a resident’s unanswered letter',0,{level:null}], ['Policy researcher',57900,'Cost a transport amendment'],
    ['Council administrator',51600,'Reconcile the public meeting minutes'], ['Election officer',53300,'Arrange accessible polling spaces',1],
    ['Budget officer',64200,'Compare two competing service budgets',2,{field:'finance'}], ['Diplomatic attaché',67300,'Prepare a cultural exchange brief',3],
    ['Legislative counsel',87400,'Find a contradiction in an amendment',4,{field:'law',level:'professional'}],
    ['Public policy director',89000,'Defend a spending plan at committee',6,{yearsInField:2,reputation:15}]
  ]);
  register('Culture & community','Services','Common Room Trust','social-work','bachelor',[
    ['Community organizer',42800,'Find a venue everyone can reach',0,{level:null}], ['Youth worker',44600,'Arrange a weekend drop-in',0,{clearance:true}],
    ['Family mediator',57500,'Agree a timetable between households',2,{level:'master'}],
    ['Museum registrar',51200,'Trace the loan history of an exhibit',1,{field:'history'}], ['Archivist',53000,'Recover a mislabeled family collection',1,{field:'history'}],
    ['Religious studies lecturer',64500,'Compare conflicting translations',2,{field:'faith',level:'doctorate'}],
    ['Community chaplain',46600,'Arrange a requested visit',1,{field:'faith',level:'master'}]
  ]);
  register('Uniformed service','Services','Service Logistics Corps','public-safety','certificate',[
    ['Service recruit',31900,'Prepare for a fitness assessment',0,{level:null,fitness:65}],
    ['Service quartermaster',47500,'Replace a mislabeled supply crate',2,{fitness:55}],
    ['Service logistics officer',60900,'Revise a transport timetable',3,{level:'bachelor',yearsInField:1}],
    ['Service band musician',41800,'Prepare for a community concert',0,{field:'music',level:'bachelor'}],
    ['Service personnel officer',59900,'Sort out a disputed leave allocation',2,{field:'business',level:'bachelor'}]
  ]);
  register('Frontier industries','Technology','Long Orbit Cooperative','space','bachelor',[
    ['Orbital greenhouse technician',58900,'Rebalance a greenhouse light cycle',0,{level:'certificate',year:2075}],
    ['Habitat acoustician',79900,'Trace a vibration across two decks',2,{field:'engineering',year:2090}],
    ['Closed-loop ecologist',80500,'Rebalance a sealed growing bed',2,{field:'environment',year:2140}],
    ['Deep transit planner',88200,'Reserve a multiyear cargo slot',2,{year:2200}],
    ['Planetary heat auditor',90500,'Review a district heat exchange',3,{field:'engineering',year:2250}],
    ['Generation ship archivist',70800,'Reconstruct a cabin’s ownership record',2,{field:'history',year:2500}],
    ['Stellar relay designer',105000,'Correct a beacon timing drift',4,{level:'master',year:2700}],
    ['Light sail materials fellow',113000,'Review a long-baseline sail test',5,{field:'engineering',level:'doctorate',year:2900}]
  ]);

  // First year and region restrictions use the settlement map's stable region IDs.
  // These jobs use period prices and training; a medieval apprentice needs no modern diploma.
  const historicalRoles = {
    medieval:[
      ['reedworker','Reed mat maker',10600,0,'Replace a fraying reed mat'],
      ['fieldsteward','Harvest steward',14800,1,'Set aside the seed grain'],
      ['waterkeeper','Irrigation keeper',14600,1,'Clear a blocked sluice',1200,'southAsia eastAsia westAsia americas africa southeastAsia'],
      ['clothfinisher','Cloth finisher',13300,1,'Finish a length of woven cloth'],
      ['packleader','Pack train guide',15400,1,'Balance a pack for the next pass',1200,'europe westAsia centralAsia southAsia africa americas'],
      ['inkmaker','Ink maker',16200,2,'Mix a fresh batch for a scribe',1200,'eastAsia southAsia westAsia europe africa'],
      ['ricewarden','Terrace keeper',14700,1,'Repair the edge of a rice terrace',1200,'eastAsia southAsia southeastAsia']
    ],
    renaissance:[
      ['bookbinder','Bookbinder',16800,1,'Restitch a merchant’s ledger',1500,'europe westAsia eastAsia southAsia africa'],
      ['pigment','Pigment grinder',14000,0,'Prepare color for a mural'],
      ['orchardkeeper','Orchard keeper',15100,1,'Decide which trees to graft'],
      ['ledgerkeeper','Merchant’s bookkeeper',19300,2,'Reconcile the trading account'],
      ['dockscribe','Harbor tally clerk',16100,1,'Count a newly landed cargo'],
      ['kilnmaster','Ceramics kiln master',20400,2,'Rescue an uneven firing'],
      ['clothmerchant','Textile factor',22000,2,'Negotiate a cloth delivery']
    ],
    industrial:[
      ['papermill','Paper mill hand',15700,0,'Sort a damaged run of paper'],
      ['wheelwright','Wheelwright',20200,1,'Fit a replacement cartwheel'],
      ['typesetter','Newspaper typesetter',19800,1,'Correct the late edition',1750,'europe eastAsia southAsia americas'],
      ['patternmaker','Foundry patternmaker',23800,2,'Correct a warped casting pattern',1770],
      ['loomtender','Power loom tender',18000,1,'Stop a jammed loom',1830,'europe americas southAsia'],
      ['signals','Rail signal keeper',22600,2,'Inspect the junction timetable',1860,'europe americas southAsia'],
      ['stationclerk','Railway booking clerk',20600,1,'Rebook a missed connection',1870,'europe americas southAsia eastAsia']
    ],
    century:[
      ['projectionist','Cinema projectionist',27700,1,'Splice a broken film reel',1910],
      ['switchrepair','Telephone linesperson',30200,1,'Locate a dead telephone line',1910],
      ['pressphotographer','Press photographer',32100,1,'Develop a late picture',1910],
      ['continuity','Film continuity clerk',32200,1,'Locate a mismatch between takes',1920],
      ['recordcutter','Record cutting engineer',35400,2,'Check a test pressing',1930],
      ['typist','Correspondence typist',23400,0,'Untangle two letters with the same reference'],
      ['systemsoperator','Mainframe operator',46200,2,'Reconcile an overnight printout',1965],
      ['desktopartist','Desktop publishing artist',39700,2,'Correct a missing typeface',1988]
    ]
  };

  const scenarios = {
    'Food & hospitality':[
      ['The surprise table','A booking says twelve guests. Seventeen coats are hanging by the door.','Recount the covers with the host','Ask the kitchens to rearrange service','Open the spare room immediately'],
      ['Late checkout','A wedding party is early. Their rooms still have other people in them.','Check which rooms are actually free','Arrange a waiting space with the team','Reassign the whole block now']],
    'Retail & customer service':[
      ['The returned box','The carton says one thing. The customer has brought back something quite different.','Check the receipt and serial number','Ask a colleague to verify the return','Authorize the exchange immediately'],
      ['Window price','The display and the shelf disagree about the price. A queue has formed to watch.','Check the price history','Ask a colleague to brief the queue','Offer an immediate price adjustment']],
    'Building & skilled trades':[
      ['An inch out','The plans and the opening disagree. The next delivery is due before lunch.','Measure the opening again','Compare notes with the next trade','Order the adjusted size now'],
      ['The last inspection','A detail on the survey is missing. The client wants the keys today.','Check the detail in person','Arrange a joint walk-through','Bring the inspection forward']],
    'Manufacturing & repair':[
      ['A noisy return','A finished unit makes one extra click. Nobody agrees whether it always did.','Isolate the unit for inspection','Compare the last batch with a colleague','Test the complete batch at once'],
      ['Batch of one','A label fell off the last tray. The labels in the drawer all look extremely convincing.','Trace the tray through the work log','Reconcile the batch with the next shift','Rerun the batch on a short schedule']],
    'Medicine & allied health':[
      ['Two identical names','Two appointments carry the same name. Only one chart matches the referral.','Verify the records before handover','Ask the referring team to reconcile both charts','Expedite a fresh intake for both visits'],
      ['A missed follow-up','A patient missed a review. Two teams each thought the other had called.','Check the contact history','Coordinate a joint follow-up','Rework today’s schedule to fit the visit']],
    'Law & public safety':[
      ['The corrected record','Two versions of a report are circulating. Both are labeled final.','Trace the signed version','Ask both teams to reconcile the record','Expedite a replacement filing'],
      ['Calendar collision','Two appointments need the same room. The second notice has already gone out.','Check when each notice was sent','Negotiate a joint change with both offices','Book a new sitting at short notice']],
    'Engineering & design':[
      ['The fifth reading','Four readings match the model. One very expensive reading does not.','Repeat the measurement','Hold a cross-discipline review','Prototype the proposed revision'],
      ['The older drawing','The installer has a previous revision. It fits rather neatly.','Verify the revision history','Bring the installer into the review','Issue a replacement package today']],
    'Computing & technology':[
      ['Release afternoon','The release works on the new device. A well-used phone tells a different story.','Reproduce the slow path','Invite the support team to triage','Deliver a small corrective release today'],
      ['The duplicate total','A customer reports two identical invoices. The dashboard says everything is fine.','Trace the invoice history','Ask billing to reconcile affected accounts','Ship a narrowly scoped correction']],
    'Money & commerce':[
      ['The balancing figure','The ledger balances if one unexplained line stays in it.','Trace the original receipt','Bring in a second reviewer','Reconcile the complete file before closing'],
      ['The missing signature','A renewal looks ordinary except for the empty signature line.','Review the authorization history','Arrange a call with both parties','Prepare a replacement agreement today']],
    'Education & research':[
      ['One odd result','One result differs sharply from the rest. It also makes the best graph.','Check the original work','Arrange an independent review','Repeat the entire exercise today'],
      ['A shared resource','Half the group has been working from an older edition. Their answers suddenly make sense.','Compare both editions','Have the groups compare their methods','Run a catch-up session immediately']],
    'Transport & logistics':[
      ['The missing connection','The schedule promises a connection between two places that both believe the other is waiting.','Check the actual departure times','Coordinate a handover with the other team','Arrange a priority replacement run'],
      ['Unclaimed cargo','A pallet is at the right depot with entirely the wrong paperwork.','Reconcile the consignment record','Ask the receiving depot to verify it','Arrange a same-day collection']],
    'Land & environment':[
      ['The damp corner','The survey map marks the field as dry. Your boots have a second opinion.','Take another field reading','Compare notes with a neighboring team','Trial a revised drainage plan'],
      ['A late season','The calendar says the season has turned. The plants remain unconvinced.','Check observations from earlier years','Survey the area with a local grower','Bring forward a small field trial']],
    'Media & performance':[
      ['A five-minute gap','The running order is short by five minutes. The audience is already here.','Check the timing against rehearsal','Plan a new transition with the ensemble','Pitch an unscheduled piece'],
      ['Credit where due','A contributor is missing from the credits. The file has already gone to production.','Verify the agreed credits','Coordinate a revision with the producer','Recall the whole package today']],
    'Sport & recreation':[
      ['Two starting lists','Two versions of the starting list have reached the team. Both look official.','Check the registration record','Bring the captains together','Stage a quick selection review'],
      ['The empty fixture','A venue change has left the opposition at the other ground.','Verify who received the change','Coordinate transport with their staff','Rebuild the schedule on the spot']],
    'Public service & policy':[
      ['The second deadline','Two public notices announce different application deadlines. Both bear the office seal.','Check the signed decision','Arrange a public clarification with staff','Expedite a revised notice today'],
      ['The uncounted street','A map of the service district leaves out one street. Its residents have noticed.','Check the boundary record','Invite the residents to a review','Present a correction at the next sitting']],
    'Culture & community':[
      ['A locked hall','The program starts in ten minutes. The only person with the key is on leave.','Verify the backup venue','Ask a neighboring group to share space','Coordinate an immediate move'],
      ['The anonymous donation','The box has no label. Three people remember three different donors.','Check the accession record','Arrange a provenance review','Trace the donor before today’s deadline']],
    'Uniformed service':[
      ['Supply count','The store ledger lists forty blankets. The shelf has thirty-nine and a curtain.','Reconcile the issue register','Ask the other shift to verify stock','Recount the whole store before handover'],
      ['Roster correction','The same person is scheduled at opposite ends of the district.','Verify the duty record','Agree a swap with the duty team','Reassign the whole rotation today']],
    'Frontier industries':[
      ['A delayed reply','A reply to the last schedule revision has arrived. It addresses the revision before that.','Verify the transmission dates','Compare plans with the receiving crew','Publish a new synchronized timetable'],
      ['The spare crate','The stores manifest shows a spare. The crate politely contains an instruction booklet.','Trace the last stock transfer','Coordinate a loan between habitats','Prioritize a replacement shipment']]
  };

  const ranks = {
    Care:['Staff practitioner','Experienced practitioner','Lead practitioner','Clinical lead'],
    Technology:['Team member','Specialist','Senior specialist','Technical lead'],
    Industry:['Crew member','Experienced operator','Crew lead','Operations lead'],
    Creative:['Contributor','Principal contributor','Project lead','Production lead'],
    Commerce:['Staff member','Senior associate','Team lead','Portfolio lead'],
    Services:['Staff member','Senior staff','Team lead','Department lead']
  };
  function rank(life, id) {
    const entry = entries[id];
    if (!entry) return '';
    return ranks[entry.sector][life.job === id ? Math.min(3, life.world.level || 0) : 0];
  }
  function eligibleYear(life,id) {
    const year = life.born + life.age;
    if (life.sim.timeline?.historicalRules && year < 2000) return false;
    return !entries[id] || year >= entries[id].year;
  }
  const subjectName = field => field.replace(/-/g,' ');
  function requirements(entry) {
    const rows = [];
    if (entry.level) rows.push(titles[entry.level] + ' in ' + subjectName(entry.field));
    if (entry.experience) rows.push(entry.experience + (entry.experience === 1 ? ' year of work' : ' years of work'));
    if (entry.yearsInField) rows.push(entry.yearsInField + ' years in ' + entry.category.toLowerCase());
    if (entry.physicianYears) rows.push(entry.physicianYears + ' years in physician practice');
    if (entry.smarts) rows.push(entry.smarts + '% smarts');
    if (entry.fitness) rows.push(entry.fitness + '% health');
    if (entry.reputation) rows.push(entry.reputation + '% reputation');
    if (entry.license) rows.push('driver’s license');
    if (entry.clearance) rows.push('clear background check');
    return rows;
  }
  function describe(id) {
    const entry = entries[id];
    return entry ? requirements(entry).join(' · ') || 'Entry-level vacancy. No formal qualification required.' : '';
  }
  function hasQualification(life,fields,level) {
    const education = node ? require('./education.js').PocketEducation : root.PocketEducation;
    return fields.some(field => education.hasCredential(life,field,level));
  }
  // Original qualifications retain their previous access. Modern specialist graduates
  // can apply to the same postings using the appropriate field on their transcript.
  const originalFields = {
    accountant:['accounting','finance','business'], auditor:['accounting','finance','business'],
    director:['business','finance'], executive:['business','finance'], engineer:['engineering'],
    nurse:['nursing'], therapist:['health','psychology'], pharmacist:['health']
  };
  function equivalent(life,id) {
    const fields = originalFields[id];
    if (!fields) return false;
    const level = id === 'pharmacist' ? 'professional' : id === 'nurse' ? 'associate' : 'bachelor';
    return hasQualification(life,fields,level);
  }
  function requirement(life,id) {
    const entry = entries[id];
    if (!entry) return '';
    if (!eligibleYear(life,id)) return 'This profession opens in ' + entry.year;
    if (entry.level && !hasQualification(life,[entry.field],entry.level)) return 'Requires ' + titles[entry.level] + ' in ' + subjectName(entry.field);
    if ((life.sim.workYears || 0) < entry.experience) return 'Needs ' + entry.experience + ' years of work experience';
    if (entry.yearsInField) {
      const years = Object.entries(life.world.roleYears || {}).reduce((sum,[role,n]) =>
        sum + (categoryOf(role) === entry.category ? n : 0), 0);
      if (years < entry.yearsInField) return 'Needs ' + entry.yearsInField + ' years in ' + entry.category.toLowerCase();
    }
    if (entry.physicianYears) {
      const roles = ['physician','occ-family-physician','occ-pediatrician','occ-psychiatrist','occ-anesthesiologist'];
      const experience = roles.reduce((sum,role) => sum + (life.world.roleYears?.[role] || 0), 0);
      if (experience < entry.physicianYears) return 'Needs ' + entry.physicianYears + ' years in physician practice';
    }
    if (entry.license && !life.sim.license) return 'Driver’s license required';
    if (entry.clearance && life.sim.record) return 'Clean record required';
    if (life.stats.health < entry.fitness) return 'Needs ' + entry.fitness + '% health';
    if (life.world.reputation < entry.reputation) return 'Needs ' + entry.reputation + '% reputation';
    return '';
  }
  // Experience in pre-expansion roles also counts toward leadership eligibility.
  const existingCategories = {
    'Food & hospitality':'barista chef baker receptionist',
    'Retail & customer service':'cashier clerk manager',
    'Building & skilled trades':'electrician luthier architect',
    'Manufacturing & repair':'mechanic trainee engineerqa',
    'Medicine & allied health':'nurse physician therapist pharmacist',
    'Law & public safety':'lawyer','Engineering & design':'engineer urbanist',
    'Computing & technology':'developer analyst era-developer2 era-security',
    'Money & commerce':'accountant auditor director executive',
    'Education & research':'teacher researcher', 'Transport & logistics':'courier dispatcher',
    'Land & environment':'arborist guide','Media & performance':'journalist actor photographer performer producer audioengineer designer',
    'Sport & recreation':'athlete','Public service & policy':'organizer','Culture & community':'interpreter'
  };
  const existingGroups = Object.create(null);
  for (const [group,ids] of Object.entries(existingCategories)) {
    for (const id of ids.split(' ')) existingGroups[id] = group;
  }
  function categoryOf(id) { return entries[id]?.category || existingGroups[id] || ''; }
  function prompt(id) {
    const entry = entries[id];
    if (!entry) return null;
    return {question:'Part of this job is to ' + entry.assignment.charAt(0).toLowerCase() + entry.assignment.slice(1) + '. How would you approach it?',
      answers:[['example','Walk through a practical example','journal'],['honest','Explain what guidance I would need','chat'],['bluff','Promise there will be no complications','spark']]};
  }
  function caseFor(life) {
    const entry = entries[life.job];
    if (!entry || life.age < 18 || life.ended || life.sim.prison || !life.sim.expansion ||
        !eligibleYear(life,life.job) || life.used.includes('occupation-case')) return null;
    const service = life.age - life.world.since;
    if (service < 0 || service % 2 !== 0) return null;
    const variants = scenarios[entry.category];
    const index = (Math.floor(service / 2) + life.born) % variants.length;
    const [title,body,check,delegate,press] = variants[index];
    return {title, body, choices:[
      {id:'check',label:check,detail:'Build a reliable record at a small personal cost.',icon:'journal'},
      {id:'delegate',label:delegate,detail:'Build trust with a colleague. Their cooperation affects the result.',icon:'people'},
      {id:'press',label:press,detail:'A faster result can impress your supervisor. A miss draws a warning.',icon:'trend'}
    ]};
  }
  function decide(life,id,ctx) {
    const current = caseFor(life), choice = current?.choices.find(row => row.id === id);
    if (!choice || ctx.actionReason(life,'occupation-case')) return null;
    const colleague = Object.values(life.people).find(p => p.active && p.role === 'Coworker');
    const before = {performance:life.world.performance,reputation:life.world.reputation};
    const previousBond = colleague?.bond;
    let text, performance, reputation, effects, demoted = false, dismissed = false;
    if (id === 'check') {
      performance=6; reputation=3; effects={smarts:1,joy:-1};
      text='I checked the record. The correction took most of my afternoon.';
    } else if (id === 'delegate') {
      const supported = ctx.random(life) < .32 + (colleague?.bond ?? 35) * .006;
      performance=supported?6:0; reputation=supported?3:1; effects={bonds:2};
      if (colleague) {
        colleague.bond = Math.min(100,colleague.bond+5);
        const kinship = node ? require('./kinship.js').PocketKinship : root.PocketKinship;
        kinship.remember(life,colleague,'collaborate',colleague.bond-previousBond);
      }
      text=supported?'We agreed on a fix. Two names went on the report.':'The review took longer than expected. At least the next shift got a straight answer.';
    } else {
      const chance = Math.min(.86,.16 + life.world.performance*.005 + (life.hidden?.discipline ?? 50)*.0025);
      const success = ctx.random(life) < chance;
      performance=success?11:-12; reputation=success?4:-5; effects=success?{joy:3}:{joy:-3};
      text=success?'The revised plan worked. My supervisor wrote down who handled it.':'The deadline held. The work did not. I received a written warning.';
      if (!success) {
        const warnings = (life.sim.expansion.discipline || 0) + 1;
        life.sim.expansion.discipline = warnings;
        if (warnings >= 3) {
          if (life.world.level > 0) {
            life.world.level--; life.extraPay=Math.floor(life.extraPay*.65);life.sim.expansion.discipline=1;
            demoted=true;
          } else dismissed=true;
        }
      }
    }
    life.used.push('occupation-case');
    const delta = ctx.apply(life,effects);
    if (colleague && colleague.bond !== previousBond) delta['bond/'+colleague.id] = colleague.bond-previousBond;
    ctx.world.metrics(life,{performance,reputation});
    if (demoted) text+=' I lost one rank and part of my negotiated pay.';
    if (dismissed) { ctx.world.changeJob(life,null,true); text+=' My contract ended at the review.'; }
    for (const key of Object.keys(before)) {
      if (life.world[key] !== before[key]) delta[key] = life.world[key]-before[key];
    }
    ctx.log(life,'Career',current.title,text,delta);
    return {title:current.title,text,delta};
  }

  root.PocketOccupations = {entries, professions, categories, historicalRoles, eligibleYear, requirement, describe, rank,
    categoryOf, prompt, caseFor, decide, equivalent, hasQualification};
})(typeof module !== 'undefined' && module.exports ? module.exports : window);
