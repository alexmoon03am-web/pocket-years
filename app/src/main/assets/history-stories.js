/* Fictional incidents. Calendar ranges describe the setting, not a dated historical claim. */
(function (root) {
  'use strict';

  function choice(icon, label, result, effects, change = {}) {
    return {icon, label, result, effects, change};
  }

  function story(id, minYear, maxYear, minAge, title, body, choices, extraRule = {}) {
    return {
      id: 'era_' + id, minYear, maxYear, title, body, label: 'Everyday life', random: true,
      weight: 7, karmaBias: 0, crazinessBias: 0, rule: {minAge, minYear, maxYear, ...extraRule}, choices
    };
  }

  const list = [
    {...story('birth', 1200, 1999, 0, 'A family tune', '{carer} taps a tune on the side of your bed. There are three notes. One is a squeak.', [
      choice('music','Tap along','I contributed a fourth note with my heel.',{joy:5,health:1},{origin:'rhythm',keepsake:'Strip of cradle cloth'}),
      choice('tools','Find the squeak','I pulled at the loose board. An adult took over.',{smarts:5,willpower:1},{origin:'maker',keepsake:'Strip of cradle cloth'}),
      choice('heart','Reach for a hand','I held on until the tune started again.',{bonds:6,joy:1},{origin:'heart',person:'carer',keepsake:'Strip of cradle cloth'})
    ]), random: false},
    story('pebbles',1200,1999,1,'Six smooth stones','Your family is playing a counting game. One of the counters is under your foot.',[
      choice('grid','Put it back','The numbers worked again.',{smarts:3,karma:2}),
      choice('gift','Give it to the youngest','Someone discovered the pleasure of owning a rock.',{bonds:4,joy:2}),
      choice('pencil','Invent a new rule','Everyone had to count my foot. I liked the new rule.',{joy:5,craziness:2})
    ],{maxAge:11}),
    story('wet_grain',1200,1899,14,'The damp sack','Water has reached the bottom layer of the grain store. The top looks perfectly respectable.',[
      choice('sun','Spread the grain out','I spent a day turning grain. It kept the household fed.',{discipline:4,bonds:3},{tag:'grain-keeper'}),
      choice('people','Ask the neighbors','They brought mats. I owed three favors by noon.',{bonds:6,karma:2}),
      choice('exit','Leave it covered','We learned exactly how far a bad smell travels.',{joy:-3,health:-2})
    ]),
    story('flood_ledge',1200,1899,16,'Higher ground','After heavy rain, a neighbor asks where to store next season’s grain. People remember the last wet sack.',[
      choice('home','Share the dry loft','Our loft stayed dry. It got considerably less spacious.',{karma:5,bonds:4},{keepsake:'Carved grain measure'}),
      choice('pencil','Draw them a raised bin','We built it together. The rats looked disappointed.',{smarts:5,discipline:2}),
      choice('exit','Keep your space','I had room to spare and one fewer visitor.',{joy:2,bonds:-4})
    ],{requiredTags:['grain-keeper']}),
    story('kiln',1200,1699,9,'A new pot','The potter offers you a turn at shaping clay. Your first bowl leans to one side.',[
      choice('bowl','Keep the bowl','It held water if I faced it uphill.',{joy:5},{keepsake:'Lopsided clay bowl'}),
      choice('tools','Start again','The second bowl stood up. The third even looked round.',{discipline:4,smarts:3}),
      choice('gift','Make a tiny cup','I gave it away. It became a very important toy.',{bonds:5,karma:2})
    ]),
    story('dye',1200,1699,13,'Blue hands','A dyer needs help before the light goes. The promised apron is almost the size of a handkerchief.',[
      choice('palette','Help mix the dye','My hands were blue for a week. The cloth was the right shade.',{smarts:5,joy:1},{keepsake:'Blue cloth sample'}),
      choice('people','Stretch the cloth','I left with sore arms and an invitation to come back.',{health:3,bonds:4}),
      choice('chat','Bargain for gloves','I got a bigger apron. The gloves remained a rumor.',{willpower:4})
    ]),
    story('boundary',1200,1899,18,'The moving marker','Two households disagree about a boundary stone. The stone has declined to explain itself.',[
      choice('map','Draw the old boundary','Both sides signed the drawing. The stone stayed put.',{smarts:5,karma:3},{keepsake:'Boundary sketch'}),
      choice('people','Find a witness','An elder remembered the stone. Unfortunately, they also remembered every previous quarrel.',{bonds:5,discipline:1}),
      choice('exit','Keep out of it','I took the long way home for a month.',{joy:2,bonds:-2})
    ]),
    story('measure',1200,1699,16,'Short measure','A trader offers to lend you a measuring cup. Its unusually thick bottom leaves very little room for grain.',[
      choice('bowl','Compare it to your own','The trader found a thinner cup with remarkable speed.',{smarts:4,discipline:2},{tag:'fair-measure'}),
      choice('chat','Warn the next buyer','The buyer thanked me. The trader did less thanking.',{karma:5,bonds:2}),
      choice('coin','Use it yourself','I finished early. Several people counted their grain twice.',{karma:-5,notoriety:3})
    ]),
    story('pattern',1500,1899,8,'A missing pattern','Someone has wiped the workbench clean, including the pattern for the next order.',[
      choice('pencil','Draw it again','I remembered the border. We called the middle a new design.',{smarts:4,joy:2},{keepsake:'Workshop pattern'}),
      choice('people','Ask the customer','They still had the first piece. It came back with three more requests.',{bonds:4,discipline:2}),
      choice('palette','Improvise','The two pieces looked related, if distantly.',{joy:5,craziness:2})
    ]),
    story('route',1500,1799,16,'The trader’s account','A traveling merchant has brought a hand-drawn route. One stretch is marked only “ask around.”',[
      choice('map','Copy the known stages','I kept a route with one conspicuously blank corner.',{smarts:5},{keepsake:'Annotated trade route'}),
      choice('chat','Interview the travelers','Nobody agreed on the distance. They agreed where to eat.',{bonds:4,smarts:3},{tag:'route-witness'}),
      choice('exit','Stay close to home','Someone had to look after the stock. It was me.',{discipline:4,joy:1})
    ]),
    story('night_sky',1500,1999,10,'A patient observer','A neighbor has marked a bright point in the night sky for weeks. Tonight they want a second pair of eyes.',[
      choice('moon','Keep a night watch','I saw it move. I also learned when the birds start.',{smarts:5,health:-1},{keepsake:'Night-sky chart'}),
      choice('pencil','Copy the observations','I fixed a date and earned a place on the next watch.',{discipline:5,bonds:2}),
      choice('home','Go to bed','The sky remained in capable hands.',{health:3,joy:1})
    ]),
    story('loom',1700,1899,14,'The noisy loom','A loom has begun adding an extra stripe. A customer points out that this was never discussed.',[
      choice('tools','Inspect the shuttle','I found a snag. The next length was stripe-free.',{smarts:5,discipline:2},{tag:'machine-hand'}),
      choice('palette','Offer a patterned sample','The customer took one sample and insisted on plain cloth.',{joy:4,willpower:2},{keepsake:'Striped loom sample'}),
      choice('people','Call the foreman','We stopped early. Nobody had to explain a second stripe.',{karma:4,bonds:2})
    ]),
    story('parts',1700,1949,18,'Spare parts','Someone brings you a fistful of almost identical pieces. Your reputation for fixing things has caught up with you.',[
      choice('tools','Sort and test them','One fit. I labeled the rest before they could escape.',{smarts:5,discipline:3},{keepsake:'Maker’s stamp'}),
      choice('book','Teach the apprentice','They found the right part before I finished explaining.',{karma:4,bonds:4}),
      choice('exit','Send the job back','I kept my afternoon. Someone else got the next order.',{joy:3,bonds:-3})
    ],{requiredTags:['machine-hand']}),
    story('bell',1700,1949,10,'Early bell','The workshop bell rang early. The person with the clock insists the clock disagrees.',[
      choice('clock','Keep a time log','Three mornings later, the bell lost the argument.',{smarts:4,discipline:3}),
      choice('people','Bring the crew together','Everyone agreed to start together. Even the clock was invited.',{bonds:5,karma:2}),
      choice('shoe','Turn up early','I had a quiet morning and a shorter night.',{discipline:4,health:-2})
    ]),
    story('wireless',1925,1979,6,'The broadcast','A neighbor has a radio. Listening requires six people to agree where the chair goes.',[
      choice('music','Tune in to the music','The singer faded halfway through. We finished the song.',{joy:5,bonds:3}),
      choice('tools','Try the aerial','I found a clearer signal by standing very still.',{smarts:4,discipline:3}),
      choice('pencil','Write down the score','Half the street borrowed my scrap of paper.',{karma:4},{keepsake:'Handwritten scorecard'})
    ]),
    story('family_album',1900,1999,7,'Who is in the picture?','A family photograph has no names on the back. Everyone recognizes the chair.',[
      choice('pencil','Label the photograph','Three relatives agreed on two names. I wrote both in pencil.',{discipline:4,bonds:3},{keepsake:'Labeled family photograph'}),
      choice('chat','Ask the oldest relative','They knew the names and exactly who still owed them money.',{smarts:4,bonds:3}),
      choice('frame','Frame it as it is','Our wall now features a well-documented chair.',{joy:5})
    ]),
    story('terminal',1980,1999,10,'One keyboard','The club has borrowed a computer for an afternoon. There is one keyboard and a very long queue.',[
      choice('code','Write a tiny program','It printed my name until somebody found the stop key.',{smarts:5,joy:2},{keepsake:'First program printout'}),
      choice('people','Take turns teaching','Everyone got a turn. The queue learned to count five minutes.',{bonds:4,karma:3}),
      choice('pencil','Sketch the screen','I drew the cursor by hand. It stayed put.',{joy:4,discipline:2})
    ]),
    story('shared_file',2000,2049,10,'Final version','A shared folder holds five documents called final. One has the word “really” twice.',[
      choice('keyboard','Compare all five','The earliest version was the finished one.',{smarts:4,discipline:3}),
      choice('chat','Ask the author','The author sent a sixth file.',{bonds:3,joy:-1}),
      choice('book','Write a change log','We lost track of one comma. Everything else survived.',{karma:3,smarts:3})
    ]),
    story('future_seed',2050,999999,7,'The family seed vault','The climate-controlled seed drawer has been humming all night. It wants a second opinion about one bean.',[
      choice('sprout','Grow a test batch','Three beans sprouted. The drawer requested a larger sample.',{smarts:5,joy:2},{keepsake:'Seed archive label'}),
      choice('people','Ask a gardener','The gardener turned the tray around. The drawer went quiet.',{bonds:5,discipline:2}),
      choice('tools','Recalibrate the sensor','The bean was fine. The sensor needed encouragement.',{smarts:4,willpower:3})
    ]),
    story('future_print',2050,999999,14,'A chair in the queue','A fabrication studio has printed the family chair. Every leg is exactly the same length. There are five.',[
      choice('home','Keep it','The chair took up space with unusual conviction.',{joy:5},{keepsake:'Five-legged chair model'}),
      choice('code','Correct the design','My second chair cost one fewer leg.',{smarts:5,discipline:2}),
      choice('gift','Give it to the studio','It became the studio’s most photographed mistake.',{karma:4,bonds:3})
    ]),
    story('future_transit',2050,999999,16,'The quiet carriage','A transit pod has assigned the entire family silent seats. Somebody is already telling a story.',[
      choice('chat','Ask for another carriage','The system moved us to “ongoing conversation.” Accurate.',{bonds:5,joy:2}),
      choice('book','Pass notes','We had a long discussion in very small handwriting.',{smarts:3,bonds:3},{keepsake:'Family transit note'}),
      choice('moon','Enjoy the silence','It lasted two stops. A personal record.',{health:3,joy:3})
    ])
  ];

  root.PocketHistoryStories = {list};
})(typeof module !== 'undefined' && module.exports ? module.exports : window);
