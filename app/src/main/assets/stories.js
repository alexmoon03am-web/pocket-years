/* One row per authored event. Rules and outcome weights are consumed only by the engine. */
(function(root){
  'use strict';
  const list=[
    {id:"box",title:"Winding you up",body:"{carer} winds a music box beside your crib. You have no formal training.",label:"First memory",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"music","label":"Kick to the tune","result":"I kicked on every beat except the beat.","effects":{"joy":6,"health":2},"change":{"origin":"rhythm","keepsake":"Brass music box"}},
       {"icon":"key","label":"Reach for the key","result":"I took the key. The concert ended.","effects":{"smarts":6,"joy":2},"change":{"origin":"maker","keepsake":"Brass music box"}},
       {"icon":"heart","label":"Hold a familiar finger","result":"I grabbed a finger. The audience stayed.","effects":{"bonds":6,"joy":2},"change":{"origin":"heart","person":"carer","keepsake":"Brass music box"}}
     ]},
    {id:"puddle",title:"Puddle inspection",body:"There is a puddle. Your shoes are clean. This seems temporary.",label:"Life event",
     rule:{"lifeStage":["infant"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"shoe","label":"Jump in with both feet","result":"The puddle won. Both socks were involved.","effects":{"joy":6,"health":2},"change":{}},
       {"icon":"leaf","label":"Float a leaf boat","result":"The leaf floated. I claimed the patent.","effects":{"smarts":5,"joy":2},"change":{}},
       {"icon":"pencil","label":"Walk around","result":"I stayed dry. Nobody applauded.","effects":{"discipline":3},"change":{}}
     ]},
    {id:"paint",title:"Finger painting",body:"The nursery ordered washable paint. Someone is about to check the label.",label:"Life event",
     rule:{"lifeStage":["infant"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"palette","label":"Paint the paper","result":"My painting went on the fridge, slightly sideways.","effects":{"smarts":4,"bonds":3},"change":{}},
       {"icon":"spark","label":"Paint your elbows","result":"My elbows are blue. The paper is fine.","effects":{"joy":7,"bonds":-1},"change":{}},
       {"icon":"book","label":"Mix every color","result":"I invented brown again.","effects":{"smarts":3},"change":{}}
     ]},
    {id:"button",title:"Button inventory",body:"A tin of spare buttons has been left under adult supervision. The supervisor is you, apparently.",label:"Life event",
     rule:{"lifeStage":["infant"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"grid","label":"Sort them by color","result":"I made four piles and a management position.","effects":{"smarts":6},"change":{}},
       {"icon":"bowl","label":"Make button soup","result":"The soup was returned to the tin uneaten.","effects":{"joy":5,"bonds":2},"change":{}},
       {"icon":"book","label":"Count the holes","result":"I counted to six. Then six again.","effects":{"smarts":4},"change":{}}
     ]},
    {id:"school",title:"Lunch negotiations",body:"{contact} forgot lunch. Your apple has already been cut into shares.",label:"Milestone",
     rule:{"minAge":5,"maxAge":10,"contact":"classmate"},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"basket","label":"Share your apple slices","result":"I split the apple. It was my first successful merger.","effects":{"bonds":8,"joy":3},"change":{"person":"$contact","keepsake":"Lunchbox note"}},
       {"icon":"flag","label":"Draw a two-person flag","result":"The flag went in both lunchboxes on alternate days.","effects":{"smarts":4,"bonds":5},"change":{"person":"$contact","keepsake":"Crayon flag"}},
       {"icon":"heart","label":"Ask for an extra tray","result":"The lunch lady supplied a sandwich and an opinion.","effects":{"karma":4,"bonds":2},"change":{},"branches":[{"weight":4,"stat":"karma","scale":0.09,"text":"The lunch lady supplied a sandwich and an opinion.","effects":{"karma":4,"bonds":2},"change":{}},{"weight":4,"text":"The extra tray was empty. I shared half my lunch instead.","effects":{"bonds":2,"joy":-1},"change":{}}]}
     ]},
    {id:"echo-maker",title:"Missing tooth",body:"Your old music box skips a note. A metal tooth is loose.",label:"An old choice returns",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"tools","label":"Try a careful repair","result":"I fixed it. One note is noticeably optimistic.","effects":{"smarts":8,"joy":2},"change":{"keepsake":"Spare brass tooth"}},
       {"icon":"people","label":"Bring it to {carer}","result":"{carer} found a screwdriver that fit.","effects":{"bonds":6,"smarts":3},"change":{"person":"carer"}},
       {"icon":"chat","label":"Retire the mechanism","result":"I kept the box. It now plays silence reliably.","effects":{"willpower":3},"change":{}}
     ]},
    {id:"echo-rhythm",title:"Three-note set",body:"Your music box still has three notes. {friend} wants an encore.",label:"An old choice returns",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"music","label":"Play the third note","result":"I played all three. Twice. That counted.","effects":{"joy":7,"smarts":3},"change":{"keepsake":"First sheet of music"}},
       {"icon":"people","label":"Teach {friend} the beat","result":"{friend} learned the beat. The classroom regretted it.","effects":{"bonds":7,"joy":3},"change":{"person":"friend"}},
       {"icon":"chat","label":"Invent a drum part","result":"My desk now has a performance history.","effects":{"joy":4},"change":{}}
     ]},
    {id:"echo-heart",title:"Kitchen recording",body:"{carer} remembers the words to your music-box song. There are apparently words.",label:"An old choice returns",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"mic","label":"Sing it together","result":"I both sang it. The kettle had better pitch.","effects":{"bonds":7,"joy":3},"change":{"person":"carer","keepsake":"Handwritten chorus"}},
       {"icon":"phone","label":"Record it for later","result":"The recording includes somebody asking about lunch.","effects":{"smarts":5,"bonds":4},"change":{"keepsake":"Kitchen recording"}},
       {"icon":"book","label":"Write down the lyrics","result":"I corrected two rhymes and kept the evidence.","effects":{"smarts":3},"change":{}}
     ]},
    {id:"fort",title:"Structural issues",body:"Two chairs and a blanket are available. Building permits seem unlikely.",label:"Life event",
     rule:{"lifeStage":["child"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"book","label":"Build a reading fort","result":"The fort got a library and terrible lighting.","effects":{"smarts":6,"joy":2},"change":{}},
       {"icon":"home","label":"Open a clubhouse","result":"{friend} joined. The club immediately needed rules.","effects":{"bonds":6,"joy":2},"change":{"person":"friend"}},
       {"icon":"chat","label":"Charge admission in buttons","result":"Revenue was three buttons. I returned them before dinner.","effects":{"craziness":4},"change":{}}
     ]},
    {id:"bird",title:"Unscheduled assembly",body:"A pigeon is inside the school gym. PE has improved.",label:"Life event",
     rule:{"lifeStage":["child"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"exit","label":"Open the courtyard doors","result":"The pigeon used the door. Some adults looked surprised.","effects":{"smarts":5,"joy":3},"change":{}},
       {"icon":"people","label":"Keep the crowd back","result":"I kept people back. The pigeon kept the ball.","effects":{"bonds":5,"health":2},"change":{}},
       {"icon":"heart","label":"Fetch the custodian","result":"The custodian recognized the pigeon. Bad sign.","effects":{"karma":4},"change":{}}
     ]},
    {id:"fair",title:"County fair",body:"You have one fair ticket and a friend with strong opinions.",label:"Life event",
     rule:{"lifeStage":["child"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"ticket","label":"Ride the little coaster","result":"The ride lasted forty seconds. My stomach filed a complaint.","effects":{"joy":7,"health":2},"change":{}},
       {"icon":"bread","label":"Split a sticky bun","result":"The bun had enough icing to qualify as glue.","effects":{"bonds":7,"joy":2},"change":{"person":"friend"}},
       {"icon":"book","label":"Enter the drawing contest","result":"My cow placed fourth out of four cows.","effects":{"smarts":3,"joy":2},"change":{}}
     ]},
    {id:"library",title:"Margin notes",body:"Someone has penciled arrows inside a library book.",label:"Life event",
     rule:{"lifeStage":["child"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"map","label":"Follow the penciled trail","result":"The arrows led to a drawing of a potato.","effects":{"joy":5,"smarts":4},"change":{"keepsake":"Penciled map"}},
       {"icon":"chat","label":"Ask the librarian","result":"The librarian knew the artist. It was the librarian.","effects":{"smarts":6,"bonds":3},"change":{}},
       {"icon":"heart","label":"Erase the arrows","result":"I received a very quiet thank-you.","effects":{"karma":3},"change":{}}
     ]},
    {id:"bike",title:"Training wheels",body:"{carer} has a wrench. Your bicycle has two spare wheels.",label:"Life event",
     rule:{"lifeStage":["child"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"bike","label":"Say the word","result":"I rode six yards. Five were intentional.","effects":{"joy":7,"health":3},"change":{},"branches":[{"weight":4,"stat":"health","scale":0.09,"text":"I rode six yards. Five were intentional.","effects":{"joy":7,"health":3},"change":{}},{"weight":4,"text":"I stopped in a hedge. My guardian retrieved the bicycle.","effects":{"health":-3,"willpower":2},"change":{}}]},
       {"icon":"clock","label":"Ask for one more lap","result":"I did another lap. The fence survived.","effects":{"health":5,"bonds":4},"change":{"person":"carer"}},
       {"icon":"pencil","label":"Practice stopping first","result":"I learned where the brakes were before meeting the hedge.","effects":{"discipline":4},"change":{}}
     ]},
    {id:"teens",title:"Club registration",body:"Three school clubs want your signature. None has a budget.",label:"Milestone",
     rule:{"minAge":11,"maxAge":16,"contact":"classmate"},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"newspaper","label":"Start a zine","result":"Issue one had four readers, including the printer.","effects":{"smarts":5,"joy":4},"change":{"keepsake":"Issue number one","club":"zine"}},
       {"icon":"shoe","label":"Start a running club","result":"Running club met before breakfast. This was disclosed late.","effects":{"health":7,"bonds":2},"change":{"club":"running"}},
       {"icon":"guitar","label":"Start a jam session","result":"Band practice prompted a noise complaint. I kept the flyer.","effects":{"joy":7,"bonds":3},"change":{"club":"music"}}
     ]},
    {id:"gig",title:"Saturday vacancy",body:"The café is hiring. The school stage also needs free labor.",label:"Life event",
     rule:{"minAge":14,"maxAge":17,"noShift":true},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"coffee","label":"Work Saturdays at the café","result":"I took the café shift. The first paycheck is due next birthday.","effects":{"health":-2,"smarts":3},"change":{"partJob":"cafe"}},
       {"icon":"mic","label":"Help at the stage","result":"I got a stage pass. It pays exactly what it says.","effects":{"joy":7,"bonds":4},"change":{"keepsake":"Stage pass"}},
       {"icon":"chat","label":"Keep Saturdays free","result":"I declined both offers and slept past nine.","effects":{"joy":4},"change":{}}
     ]},
    {id:"mic",title:"Dead air",body:"The school radio host lost their voice. The microphone still works.",label:"Life event",
     rule:{"lifeStage":["teen"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"music","label":"Take song requests","result":"The science lab requested the same song five times.","effects":{"bonds":6,"joy":3},"change":{}},
       {"icon":"chat","label":"Tell the town a story","result":"My story ended just before the lunch bell.","effects":{"joy":6,"smarts":4},"change":{}},
       {"icon":"heart","label":"Read the lost-property list","result":"One trumpet and three socks found their owners.","effects":{"karma":3,"smarts":2},"change":{}}
     ]},
    {id:"exam",title:"School night",body:"Tomorrow is the exam. Tonight is the meteor shower. Terrible scheduling.",label:"Life event",
     rule:{"lifeStage":["teen"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"book","label":"Revise with {friend}","result":"{friend} tested me. One of us knew fractions.","effects":{"smarts":8,"joy":-2},"change":{"person":"friend"}},
       {"icon":"moon","label":"Go see the sky","result":"I saw six meteors and missed a revision session.","effects":{"joy":8,"smarts":-1},"change":{"keepsake":"Star chart"}},
       {"icon":"pencil","label":"Set an alarm for both","result":"I revised first and caught the last meteor in slippers.","effects":{"discipline":4,"health":-1},"change":{}}
     ]},
    {id:"jacket",title:"Pocket note",body:"A thrift-store jacket contains a note asking the next owner to sign it.",label:"Life event",
     rule:{"lifeStage":["teen"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"pencil","label":"Stitch in a little poem","result":"I added a rhyme. The jacket cannot object.","effects":{"joy":6,"smarts":3},"change":{}},
       {"icon":"people","label":"Write down everyone’s names","result":"{friend} signed under my name in permanent ink.","effects":{"bonds":6,"joy":2},"change":{"person":"friend"}},
       {"icon":"heart","label":"Return the note to the shop","result":"The cashier added it to a surprisingly full drawer.","effects":{"karma":4},"change":{}}
     ]},
    {id:"paths",title:"After graduation",body:"A tuition scholarship, an apprenticeship and a shop job are on the table. So is doing none of them.",label:"Choose a path",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"school","label":"Accept the scholarship","result":"Tuition is covered. Books remain books.","effects":{"smarts":9,"cash":100},"change":{"track":"college","job":"student","keepsake":"College letter"}},
       {"icon":"tools","label":"Take the apprenticeship","result":"I got a toolbox and a paid apprenticeship.","effects":{"smarts":5,"health":3,"cash":180},"change":{"track":"trade","job":"trainee","keepsake":"Dented toolbox"}},
       {"icon":"shop","label":"Join the corner shop","result":"I got a name tag and the opening shift.","effects":{"bonds":6,"cash":350},"change":{"track":"work","job":"clerk","keepsake":"First name tag"}},
       {"icon":"compass","label":"Take a gap year","result":"I took a gap year. The calendar agreed.","effects":{"joy":4},"change":{"track":"gap","gap":true}}
     ]},
    {id:"paths-standard",title:"After graduation",body:"University offered a place with a $6,000 loan. A workshop and a shop also called.",label:"Choose a path",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"school","label":"Enroll with a student loan","result":"I signed for $6,000 in tuition. Interest starts on schedule.","effects":{"smarts":6},"change":{"track":"college","job":"student","tuition":6000,"keepsake":"College letter"}},
       {"icon":"tools","label":"Take the apprenticeship","result":"The workshop issued boots and a payslip.","effects":{"smarts":5,"health":3,"cash":180},"change":{"track":"trade","job":"trainee","keepsake":"Dented toolbox"}},
       {"icon":"shop","label":"Join the corner shop","result":"I joined the shop. My till has opinions.","effects":{"bonds":6,"cash":350},"change":{"track":"work","job":"clerk","keepsake":"First name tag"}},
       {"icon":"compass","label":"Take a gap year","result":"I kept my options open and my inbox full.","effects":{"joy":4},"change":{"track":"gap","gap":true}}
     ]},
    {id:"college-career",title:"Graduate offers",body:"Three employers want your diploma. Two spelled your name correctly.",label:"Career",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"school","label":"Teach in {home}","result":"I became a teacher. The classroom stapler is missing.","effects":{"bonds":7},"change":{"job":"teacher"}},
       {"icon":"flask","label":"Join a field lab","result":"I joined the lab. The mud is part of the job.","effects":{"smarts":7},"change":{"job":"researcher"}},
       {"icon":"palette","label":"Design book covers","result":"My first client requested a larger title, then a smaller one.","effects":{"joy":7},"change":{"job":"designer"}},
       {"icon":"compass","label":"Find my own path","result":"I kept the diploma and reopened the job board.","effects":{"joy":3},"change":{"jobSearch":true}}
     ]},
    {id:"trade-career",title:"Qualified hands",body:"Your apprenticeship ended. Three workshops have vacancies.",label:"Career",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"guitar","label":"Restore instruments","result":"I took the instrument job. The first violin buzzed.","effects":{"joy":6,"smarts":3},"change":{"job":"luthier"}},
       {"icon":"bolt","label":"Wire old houses","result":"I joined the electrical crew. They labeled my mug.","effects":{"smarts":6,"health":2},"change":{"job":"electrician"}},
       {"icon":"bread","label":"Train as a baker","result":"The bakery issued a uniform with preexisting flour.","effects":{"bonds":5,"joy":3},"change":{"job":"baker"}},
       {"icon":"compass","label":"Find my own path","result":"I took the certificate and applied elsewhere.","effects":{"joy":3},"change":{"jobSearch":true}}
     ]},
    {id:"work-career",title:"Staff changes",body:"Your work reference has produced three job offers.",label:"Career",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"shop","label":"Manage the shop","result":"I took the manager’s keys and the manager’s complaints.","effects":{"bonds":7},"change":{"job":"manager"}},
       {"icon":"camera","label":"Shoot local photographs","result":"The paper hired me. My first subject blinked.","effects":{"joy":7},"change":{"job":"photographer"}},
       {"icon":"flag","label":"Coordinate town events","result":"Town Hall gave me an events calendar and no pens.","effects":{"smarts":5,"bonds":3},"change":{"job":"organizer"}},
       {"icon":"compass","label":"Find my own path","result":"I passed. My reference is still valid.","effects":{"joy":3},"change":{"jobSearch":true}}
     ]},
    {id:"coffee",title:"Coffee invitation",body:"{love} wants coffee. They used an unusually specific number of heart emojis.",label:"Relationship",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"heart","label":"Say yes to a date","result":"I went on a date. A second one made the calendar.","effects":{"joy":8,"bonds":5},"change":{"relationship":"Partner","person":"love"}},
       {"icon":"people","label":"Make it a friendship","result":"I made a friend. The emojis have been scaled back.","effects":{"bonds":8,"joy":3},"change":{"relationship":"Friend","person":"love"}},
       {"icon":"moon","label":"Keep your own company","result":"I declined. The coffee shop survived.","effects":{"joy":5,"health":3},"change":{"relationship":"Acquaintance"}}
     ]},
    {id:"flat",title:"Water feature",body:"Your ceiling drips into a salad bowl. It is not raining indoors by design.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"tools","label":"Learn to patch the roof","result":"I patched the leak. The bowl returned to kitchen duty.","effects":{"smarts":6,"health":-2},"change":{}},
       {"icon":"bowl","label":"Trade dinner for help","result":"Dinner bought me a neighbor’s help and one fixed roof.","effects":{"bonds":6,"joy":3},"change":{}},
       {"icon":"pencil","label":"Call the building office","result":"They logged the leak under “water feature.” Someone came.","effects":{"discipline":3},"change":{}}
     ]},
    {id:"garden",title:"Unused garden bed",body:"The community garden assigned you a rectangle of dirt.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"sprout","label":"Plant food to share","result":"I grew beans and distributed the surplus. There was considerable surplus.","effects":{"health":6,"bonds":3},"change":{}},
       {"icon":"leaf","label":"Try a wildflower patch","result":"The flowers grew. One made it into a book.","effects":{"joy":7,"health":2},"change":{"keepsake":"Pressed cornflower"}},
       {"icon":"heart","label":"Start a compost pile","result":"I turned food scraps into a neighborhood discussion.","effects":{"karma":3,"smarts":2},"change":{}}
     ]},
    {id:"train",title:"Service suspended",body:"Your train is canceled. The next one is described as theoretical.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"pencil","label":"Wander with a sketchbook","result":"I drew the station. It stayed very still.","effects":{"joy":7,"smarts":3},"change":{}},
       {"icon":"phone","label":"Call someone you miss","result":"I called someone back for once.","effects":{"bonds":8,"joy":2},"change":{}},
       {"icon":"pencil","label":"Claim the delay refund","result":"I finished the form before the train arrived. Barely.","effects":{"discipline":4},"change":{}}
     ]},
    {id:"raise",title:"Acting supervisor",body:"Your team lead quit. Management wants a volunteer with unpaid enthusiasm.",label:"Career",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"trend","label":"Ask for the promotion","result":"I negotiated a raise. They kept the word “acting.”","effects":{"cash":750,"smarts":4,"joy":-2},"change":{"raise":550}},
       {"icon":"clock","label":"Keep your current hours","result":"I kept my hours. The emails went to somebody else.","effects":{"health":6,"joy":5},"change":{}},
       {"icon":"heart","label":"Train the replacement","result":"I wrote instructions. Someone actually read them.","effects":{"karma":3,"smarts":2},"change":{}}
     ]},
    {id:"midbox",title:"Moving box",body:"Your old music box turns up in a carton labeled kitchen cables.",label:"An old choice returns",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"home","label":"Put it by the front door","result":"I put it by the door. Visitors now operate it without permission.","effects":{"bonds":7,"joy":3},"change":{"boxFuture":"shared"}},
       {"icon":"music","label":"Record the melody","result":"I recorded the tune. The file is called final-final.","effects":{"smarts":5,"joy":5},"change":{"boxFuture":"recorded","keepsake":"Three-note recording"}},
       {"icon":"gift","label":"Pass it to a child","result":"A child took it home and wound it immediately.","effects":{"bonds":9},"change":{"boxFuture":"gifted","keepsake":"Thank-you drawing"}}
     ]},
    {id:"potluck",title:"Guest count",body:"Twelve people accepted dinner. You own six chairs.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"tools","label":"Borrow two ironing boards","result":"Two ironing boards became a buffet. Nobody ironed anything.","effects":{"smarts":6,"bonds":4},"change":{}},
       {"icon":"bowl","label":"Serve in two sittings","result":"I served two sittings. Both requested dessert.","effects":{"bonds":7,"joy":3},"change":{}},
       {"icon":"chat","label":"Make it a picnic","result":"Everyone sat on the floor. The chairs felt optional.","effects":{"joy":4},"change":{}}
     ]},
    {id:"ferry",title:"Round trip",body:"The ferry is running free rides today. It still goes to the same place.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"ticket","label":"Go for the round trip","result":"I rode both ways. The view on the return was familiar.","effects":{"joy":7,"health":3},"change":{}},
       {"icon":"mic","label":"Interview the captain","result":"The captain answered my questions and stamped a ticket.","effects":{"smarts":5,"bonds":5},"change":{"keepsake":"Ferry ticket"}},
       {"icon":"heart","label":"Help count passengers","result":"I counted a dog. The captain allowed it.","effects":{"karma":3},"change":{}}
     ]},
    {id:"letters",title:"Wrong address",body:"An envelope of old letters arrived at your house. They are addressed to someone else.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:1,crazinessBias:0,choices:[
       {"icon":"compass","label":"Find the original owner","result":"I found the owner. They checked every envelope.","effects":{"bonds":8,"joy":2},"change":{}},
       {"icon":"archive","label":"Take them to the archive","result":"The archive accepted the bundle and issued a receipt.","effects":{"smarts":7,"bonds":2},"change":{}},
       {"icon":"pencil","label":"Return to sender","result":"The post office took custody of the mystery.","effects":{"discipline":3},"change":{}}
     ]},
    {id:"rest",title:"Overtime offer",body:"A client needs a job finished tonight. Apparently Tuesday was a surprise.",label:"Life event",
     rule:{"lifeStage":["adult","career","college"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"moon","label":"Protect a free evening","result":"I kept the evening. My phone remained face down.","effects":{"health":7,"joy":4},"change":{}},
       {"icon":"bag","label":"Finish the big commission","result":"I finished the commission and got paid.","effects":{"cash":680,"smarts":3,"health":-4},"change":{}},
       {"icon":"chat","label":"Negotiate a later deadline","result":"The client agreed to Wednesday. A calendar was located.","effects":{"willpower":4},"change":{}}
     ]},
    {id:"mentor",title:"New starter",body:"A newcomer has been given a desk and no instructions.",label:"Life event",
     rule:{"lifeStage":["adult","career","college"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"book","label":"Teach them your trick","result":"I explained the shortcut. Their afternoon improved.","effects":{"smarts":6,"bonds":6},"change":{}},
       {"icon":"flag","label":"Let them lead instead","result":"They ran the meeting. I only interrupted once.","effects":{"joy":5,"bonds":6},"change":{}},
       {"icon":"heart","label":"Write a handover note","result":"The next hire found a useful document. A first.","effects":{"karma":4},"change":{}}
     ]},
    {id:"recipe",title:"Family recipe",body:"The family recipe says “some flour.” This has become a succession issue.",label:"Family milestone",
     rule:{"minAge":32},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"bowl","label":"Cook the Sunday recipe","result":"I tested it. Sunday dinner was edible.","effects":{"bonds":8,"joy":3},"change":{"keepsake":"Blue recipe book"}},
       {"icon":"pencil","label":"Write in the margins","result":"I added measurements. One relative called that cheating.","effects":{"smarts":6,"bonds":4},"change":{"keepsake":"Annotated recipe book"}},
       {"icon":"pencil","label":"Weigh everything twice","result":"The recipe now works for people outside the bloodline.","effects":{"discipline":4},"change":{}}
     ]},
    {id:"retire",title:"Pension paperwork",body:"The pension office wants to know what you plan to do with Monday.",label:"Choose a path",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"wallet","label":"Retire with a pension","result":"I filed for a pension. Monday lost its authority.","effects":{"health":7,"joy":5},"change":{"job":"retired"}},
       {"icon":"bag","label":"Work part-time","result":"I took three shifts a week and four days of silence.","effects":{"joy":6,"smarts":2},"change":{"job":"parttime"}},
       {"icon":"bag","label":"Keep my current routine","result":"I kept my current routine. The form had a box for that.","effects":{"joy":3},"change":{}}
     ]},
    {id:"bench",title:"Commemorative plaque",body:"A committee needs six words for a park bench. It has held four meetings.",label:"Life event",
     rule:{"lifeStage":["elder"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"clock","label":"“Sit a while”","result":"My short inscription passed by one vote.","effects":{"joy":6,"bonds":4},"change":{"keepsake":"Pencil rubbing"}},
       {"icon":"pencil","label":"Leave room for names","result":"I left space for names. The committee scheduled another meeting.","effects":{"bonds":8,"joy":2},"change":{}},
       {"icon":"chat","label":"Suggest a seat cushion","result":"Comfort lost the vote. People remembered the suggestion.","effects":{"craziness":3,"joy":2},"change":{}}
     ]},
    {id:"tales",title:"Family recording",body:"A relative wants your life story recorded. The battery is at twelve percent.",label:"Life event",
     rule:{"lifeStage":["elder"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"compass","label":"Tell a true adventure","result":"I told the shortest true story. It fit.","effects":{"joy":7,"bonds":5},"change":{}},
       {"icon":"chat","label":"Ask for their stories","result":"I asked them a question. The microphone stayed busy.","effects":{"bonds":7,"smarts":4},"change":{}},
       {"icon":"chat","label":"Record your worst job","result":"My former boss finally contributed to family history.","effects":{"joy":4},"change":{}}
     ]},
    {id:"echo-last",title:"One more verse",body:"Someone found the old music-box tune. They want an ending.",label:"An old choice returns",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"sun","label":"Give it a bright ending","result":"I added a note. Purists will have to cope.","effects":{"joy":8},"change":{"endingNote":"bright","keepsake":"The fourth note"}},
       {"icon":"pause","label":"Leave a beat of silence","result":"I left a rest. Nobody complained about the volume.","effects":{"bonds":8},"change":{"endingNote":"quiet","keepsake":"The fourth note"}},
       {"icon":"heart","label":"Donate the recording","result":"The archive filed it correctly on the second try.","effects":{"karma":4},"change":{}}
     ]},
    {id:"orchard",title:"Municipal tree",body:"The council has one fruit tree and no agreement on where to put it.",label:"Life event",
     rule:{"lifeStage":["elder"]},random:true,weight:4,karmaBias:1,crazinessBias:0,choices:[
       {"icon":"sun","label":"Find a sunny patch","result":"I picked a sunny spot. The tree did the rest.","effects":{"health":5,"joy":6},"change":{}},
       {"icon":"school","label":"Plant it by the school","result":"The school got the tree and an unexpected responsibility.","effects":{"bonds":8,"joy":3},"change":{}},
       {"icon":"pencil","label":"Volunteer to water it","result":"I became assistant to a tree.","effects":{"discipline":4},"change":{}}
     ]},
    {id:"tide",title:"Beach cleanup",body:"A bag of sea glass has been collected. Someone called it an art supply.",label:"Life event",
     rule:{"lifeStage":["elder"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"palette","label":"Make a little mosaic","result":"I made a tile. It was almost square.","effects":{"joy":7,"smarts":3},"change":{"keepsake":"Sea-glass tile"}},
       {"icon":"gift","label":"Hide some for others","result":"I left some for the next group. They found it immediately.","effects":{"bonds":6,"joy":4},"change":{}},
       {"icon":"book","label":"Sort the glass by color","result":"There was considerably more brown than optimism.","effects":{"smarts":3},"change":{}}
     ]},
    {id:"lens-start",title:"First photograph",body:"{carer} points a camera at your crib. You have not signed a release.",label:"First memory",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"camera","label":"Look straight at the lens","result":"I stared directly into the lens. Excellent passport material.","effects":{"smarts":6,"joy":2},"change":{"origin":"maker","keepsake":"First photograph"}},
       {"icon":"shoe","label":"Kick off one sock","result":"The sock made it into the frame. The foot did not.","effects":{"health":4,"joy":4},"change":{"origin":"rhythm","keepsake":"First photograph"}},
       {"icon":"heart","label":"Smile at {carer}","result":"I smiled at {carer}. Nobody remembered the flash.","effects":{"bonds":6,"joy":2},"change":{"origin":"heart","person":"carer","keepsake":"First photograph"}}
     ]},
    {id:"lens-eight",title:"Photo retake",body:"Your family wants to recreate your baby picture. The basket is smaller than remembered.",label:"An old choice returns",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"frame","label":"Recreate the photograph","result":"I copied the pose. My knees complicated things.","effects":{"joy":6,"bonds":4},"change":{"keepsake":"Then and now"}},
       {"icon":"camera","label":"Turn the camera around","result":"I photographed {carer}. Their eyes were closed.","effects":{"bonds":7,"smarts":2},"change":{"person":"carer","keepsake":"Portrait of home"}},
       {"icon":"book","label":"Use the timer","result":"Everyone made the photo, including a passing elbow.","effects":{"smarts":3},"change":{}}
     ]},
    {id:"lens-forty",title:"Loose photographs",body:"A box of family photos turns up. The dates on the backs disagree.",label:"An old choice returns",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"frame","label":"Hang them in the hall","result":"I hung them in the hall. Chronology lost the vote.","effects":{"bonds":7,"joy":3},"change":{"boxFuture":"shared"}},
       {"icon":"journal","label":"Make a small photo book","result":"I made a photo book. One page is mostly thumb.","effects":{"smarts":5,"joy":4},"change":{"boxFuture":"recorded","keepsake":"Pocket photo book"}},
       {"icon":"gift","label":"Give the camera away","result":"I gave the camera away. It still works.","effects":{"bonds":8},"change":{"boxFuture":"gifted"}}
     ]},
    {id:"lens-seventy",title:"Caption required",body:"Someone wants a caption for the oldest family photograph.",label:"An old choice returns",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"pencil","label":"Write the whole story on the back","result":"I wrote the names and corrected the date.","effects":{"smarts":5,"bonds":5},"change":{"endingNote":"story","keepsake":"Captioned print"}},
       {"icon":"frame","label":"Let the photograph speak","result":"I framed it. Everyone supplied their own caption.","effects":{"joy":8},"change":{"endingNote":"frame","keepsake":"Framed portrait"}},
       {"icon":"heart","label":"Make a copy for the archive","result":"The original stayed home. The copy got an accession number.","effects":{"karma":4},"change":{}}
     ]},
    {id:"atlas-start",title:"First map",body:"A paper map hangs over your crib. The route to the kitchen seems popular.",label:"First memory",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"map","label":"Watch the little blue river","result":"I studied the river. Cartography started early.","effects":{"smarts":6,"joy":2},"change":{"origin":"maker","keepsake":"Hand-drawn map"}},
       {"icon":"flag","label":"Wave at the dancing corners","result":"I waved at the corners. The map waved back.","effects":{"health":4,"joy":4},"change":{"origin":"rhythm","keepsake":"Hand-drawn map"}},
       {"icon":"chat","label":"Listen to the street names","result":"{carer} read the street names. I slept through Oak Street.","effects":{"bonds":6,"joy":2},"change":{"origin":"heart","person":"carer","keepsake":"Hand-drawn map"}}
     ]},
    {id:"atlas-eight",title:"Map correction",body:"Your childhood map shows a shortcut through what is now a dentist.",label:"An old choice returns",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"pencil","label":"Draw what you actually find","result":"I drew the new route and removed the dentist.","effects":{"smarts":7,"joy":2},"change":{"keepsake":"Pencil map"}},
       {"icon":"compass","label":"Name your own shortcut","result":"I named a shortcut. {friend} used it once.","effects":{"bonds":7,"joy":2},"change":{"person":"friend","keepsake":"Shortcut map"}},
       {"icon":"pencil","label":"Measure the long way","result":"I counted steps. Geography acquired a footnote.","effects":{"discipline":4},"change":{}}
     ]},
    {id:"atlas-forty",title:"Out-of-date map",body:"Your map still shows a video store. The building now sells dog biscuits.",label:"An old choice returns",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"map","label":"Redraw the neighborhood","result":"I updated the map. Two cafés had switched places.","effects":{"smarts":7,"joy":2},"change":{"boxFuture":"recorded","keepsake":"Revised atlas"}},
       {"icon":"shoe","label":"Organize a walking tour","result":"My walking tour lost one guest to the biscuit shop.","effects":{"bonds":8},"change":{"boxFuture":"shared"}},
       {"icon":"pencil","label":"Pass the pencil on","result":"I passed the map to a child with a pencil.","effects":{"bonds":6,"joy":3},"change":{"boxFuture":"gifted"}}
     ]},
    {id:"atlas-seventy",title:"Last stop",body:"Someone wants to retrace the route on your childhood map.",label:"An old choice returns",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"compass","label":"Take the scenic route","result":"I took the longer route. The benches were correctly marked.","effects":{"health":5,"joy":5},"change":{"endingNote":"river","keepsake":"Final route"}},
       {"icon":"home","label":"Knock on familiar doors","result":"I knocked on old doors. One person still lived there.","effects":{"bonds":8},"change":{"endingNote":"doors","keepsake":"Final route"}},
       {"icon":"heart","label":"Mark accessible stops","result":"The next walker thanked me for marking the benches.","effects":{"karma":4},"change":{}}
     ]},
    {id:"project-invite",title:"Science fair follow-up",body:"The museum wants your school circuit for a demonstration.",label:"Because of your choice",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"flask","label":"Lead the demonstration","result":"The bulb lit on cue. That helped my grade.","effects":{"smarts":8,"cash":220},"change":{"grade":8,"keepsake":"Science fair ribbon"}},
       {"icon":"school","label":"Give younger pupils a turn","result":"I gave the switch to a younger student. They pressed it fourteen times.","effects":{"bonds":8,"joy":4},"change":{"grade":4,"keepsake":"Museum note"}},
       {"icon":"book","label":"Write the instructions","result":"The next class managed without calling me.","effects":{"discipline":3,"smarts":2},"change":{}}
     ]},
    {id:"festival-invite",title:"Open slot",body:"The festival heard your open-mic recording. A performer canceled.",label:"Because of your choice",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"mic","label":"Play the big stage","result":"I took the slot. The crowd knew one line by the end.","effects":{"joy":9,"cash":850},"change":{"reputation":20,"keepsake":"Headliner pass"}},
       {"icon":"people","label":"Split the set with a newcomer","result":"I shared the set. Both names appeared on the poster.","effects":{"bonds":8,"cash":425},"change":{"reputation":12,"keepsake":"Shared billing"}},
       {"icon":"tools","label":"Work behind the scenes","result":"I worked backstage. The show began almost on time.","effects":{"smarts":7,"cash":300},"change":{"performance":6}}
     ]},
    {id:"first-curtain",title:"School production",body:"{child} is in a school play. Their official role is a tree.",label:"Family milestone",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"ticket","label":"Sit in the front row","result":"I sat in front. The tree recognized me.","effects":{"bonds":8,"joy":4},"change":{"keepsake":"Painted paper leaf"}},
       {"icon":"tools","label":"Help the whole cast backstage","result":"I helped backstage. One shrub missed its cue.","effects":{"bonds":6,"smarts":4},"change":{"keepsake":"Backstage badge"}},
       {"icon":"chat","label":"Record the performance","result":"{child} requested a review and the video file.","effects":{"bonds":5},"change":{}}
     ]},
    {id:"first-keys",title:"Housewarming",body:"You have house keys and too few plates. Guests are coming anyway.",label:"Because of your choice",
     rule:{},random:false,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"bowl","label":"Fill the table with everyone","result":"I fed everybody. One person ate from a lid.","effects":{"bonds":7,"joy":4},"change":{"keepsake":"Tomato keyring"}},
       {"icon":"journal","label":"Keep a guest book","result":"I left out a guest book. The first entry requested Wi-Fi.","effects":{"smarts":5,"bonds":5},"change":{"keepsake":"House guest book"}},
       {"icon":"chat","label":"Meet the neighbors","result":"I learned three names and the bin schedule.","effects":{"bonds":4},"change":{}}
     ]},
    {id:"two-seats",title:"Canceled booking",body:"Your reservation vanished. {love} is still dressed for dinner.",label:"Relationship",
     rule:{"minAge":18,"relation":"partner"},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"ticket","label":"Take the bus to its last stop","result":"I took the bus to the last stop and found chips.","effects":{"joy":6,"bonds":5},"change":{"person":"love"}},
       {"icon":"bowl","label":"Stay home and cook","result":"I cooked at home. The dress code held.","effects":{"bonds":7,"health":2},"change":{"person":"love"}},
       {"icon":"chat","label":"Try the corner diner","result":"I shared fries and left a decent tip.","effects":{"joy":4,"bonds":2},"change":{}}
     ]},
    {id:"first-reference",title:"Reference request",body:"A colleague asks for a reference. They have already given out your number.",label:"Career",
     rule:{"contact":"coworker","minAge":18},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"letter","label":"Help with their application","result":"I described their actual skills. They thanked me anyway.","effects":{"bonds":7,"smarts":3},"change":{"performance":6}},
       {"icon":"bag","label":"Invite them to shadow you","result":"I let them shadow me. They saw the real job.","effects":{"joy":5,"smarts":5},"change":{"performance":8}},
       {"icon":"heart","label":"Review their résumé","result":"I removed the word “ninja” twice.","effects":{"karma":4},"change":{}}
     ]},
    {id:"snails",title:"School snail race",body:"The class is racing snails. The betting market is entirely imaginary.",label:"Life event",
     rule:{"lifeStage":["child"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"flag","label":"Make it a tiny cheering section","result":"I cheered. My snail remained professional.","effects":{"joy":7,"bonds":3},"change":{}},
       {"icon":"chat","label":"Trade tips with the champion","result":"The winner’s trainer recommended a more motivated snail.","effects":{"smarts":5,"joy":3},"change":{}},
       {"icon":"book","label":"Time the race","result":"My stopwatch went to sleep once.","effects":{"smarts":4},"change":{}}
     ]},
    {id:"mascot",title:"Mascot vacancy",body:"The school needs someone inside a turnip costume.",label:"Life event",
     rule:{"lifeStage":["child","teen"]},random:true,weight:4,karmaBias:0,crazinessBias:1,choices:[
       {"icon":"leaf","label":"Become the turnip","result":"I became the turnip. Photographs exist.","effects":{"joy":8,"health":3},"change":{"reputation":4}},
       {"icon":"flag","label":"Direct from the sidelines","result":"I directed the turnip from a position of safety.","effects":{"smarts":5,"bonds":4},"change":{}},
       {"icon":"heart","label":"Repair the costume","result":"I fixed the zipper. The previous turnip thanked me.","effects":{"karma":4},"change":{}}
     ]},
    {id:"groupchat",title:"Group project",body:"The class chat contains 86 messages and no completed work.",label:"Life event",
     rule:{"lifeStage":["teen"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"bowl","label":"Negotiate a real lunch break","result":"I assigned jobs. The chat went silent, then useful.","effects":{"bonds":7,"smarts":3},"change":{"grade":3}},
       {"icon":"newspaper","label":"Read the list with a straight face","result":"I read out the task list. One person muted me.","effects":{"joy":8,"bonds":2},"change":{"reputation":4}},
       {"icon":"pencil","label":"Submit your part early","result":"The teacher recognized my handwriting and effort.","effects":{"discipline":4},"change":{}}
     ]},
    {id:"short-film",title:"Short film contest",body:"The local film night needs a thirty-second entry. The time limit includes credits.",label:"Life event",
     rule:{"lifeStage":["teen","adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"camera","label":"Shoot a one-take comedy","result":"My comedy got a laugh in the right place.","effects":{"cash":240,"joy":7},"change":{"reputation":8},"branches":[{"weight":4,"stat":"smarts","scale":0.11,"text":"My comedy got a laugh in the right place.","effects":{"cash":240,"joy":7},"change":{"reputation":8}},{"weight":5,"text":"The audience laughed during the wrong scene.","effects":{"joy":3,"bonds":4},"change":{"reputation":3}}]},
       {"icon":"frame","label":"Film a quiet portrait","result":"I filmed a portrait. The subject ordered a copy.","effects":{"smarts":6,"bonds":4},"change":{"keepsake":"Short-film print"}},
       {"icon":"book","label":"Edit the other entries","result":"I cut nine minutes of unnecessary logos.","effects":{"smarts":4},"change":{}}
     ]},
    {id:"vendor",title:"One long queue",body:"The market queue has split into two queues with incompatible beliefs.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"grid","label":"Invent a queue system","result":"I numbered the orders. Civilization resumed.","effects":{"cash":140,"smarts":5},"change":{}},
       {"icon":"phone","label":"Call in a friend","result":"My friend helped. Nobody had to mediate a pastry dispute.","effects":{"bonds":6,"cash":70},"change":{"person":"friend"}},
       {"icon":"heart","label":"Give up your place","result":"An exhausted parent got served first.","effects":{"karma":5},"change":{}}
     ]},
    {id:"plot-twist",title:"Misdelivered print",body:"A stranger mailed you a photograph of a pigeon with your address on it.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"pin","label":"Visit the address","result":"I visited the address. There was another pigeon photo.","effects":{"joy":7,"bonds":4},"change":{"keepsake":"Pigeon portrait"}},
       {"icon":"letter","label":"Mail a photo in reply","result":"I mailed one back. Correspondence has started.","effects":{"joy":6,"smarts":4},"change":{}},
       {"icon":"pencil","label":"Ask the post office","result":"A clerk located the correct pigeon enthusiast.","effects":{"discipline":3},"change":{}}
     ]},
    {id:"wrong-stage",title:"Wrong microphone",body:"An organizer introduces you as the speaker. You came to stack chairs.",label:"Life event",
     rule:{"lifeStage":["adult","college","career","elder"]},random:true,weight:4,karmaBias:0,crazinessBias:1,choices:[
       {"icon":"chat","label":"Tell the room the truth","result":"I admitted it. They let me stack chairs.","effects":{"smarts":6,"bonds":3},"change":{}},
       {"icon":"mic","label":"Host an audience Q&A","result":"I hosted questions. Most concerned parking.","effects":{"joy":7,"bonds":4},"change":{"reputation":5},"branches":[{"weight":4,"stat":"craziness","scale":0.09,"text":"I hosted questions. Most concerned parking.","effects":{"joy":7,"bonds":4},"change":{"reputation":5}},{"weight":4,"text":"The first question was about a spreadsheet I had never seen.","effects":{"joy":-3,"smarts":1},"change":{}}]},
       {"icon":"book","label":"Read the printed agenda","result":"The crowd learned where lunch was. Good enough.","effects":{"smarts":3},"change":{}}
     ]},
    {id:"relay",title:"Missing runner",body:"The relay team is short one runner. The coach is looking at your shoes.",label:"Life event",
     rule:{"lifeStage":["teen","adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"shoe","label":"Run the anchor leg","result":"I ran the last leg. The ribbon is mine.","effects":{"health":5,"joy":7},"change":{"keepsake":"Relay ribbon"},"branches":[{"weight":4,"stat":"health","scale":0.11,"text":"I ran the last leg. The ribbon is mine.","effects":{"health":5,"joy":7},"change":{"keepsake":"Relay ribbon"}},{"weight":5,"text":"I finished fourth. Four teams entered.","effects":{"health":4,"bonds":3},"change":{"reputation":0}}]},
       {"icon":"flag","label":"Coach from the finish line","result":"I called splits. Nobody liked the accurate ones.","effects":{"bonds":7,"joy":3},"change":{}},
       {"icon":"heart","label":"Hand out water","result":"The runners thanked me after regaining speech.","effects":{"karma":4},"change":{}}
     ]},
    {id:"reunion",title:"Unlabeled photo",body:"A reunion photo includes a person nobody recognizes.",label:"Life event",
     rule:{"lifeStage":["adult","career","college","elder"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"spark","label":"Let the mystery stand","result":"I left the mystery alone. Three theories survived.","effects":{"joy":6,"smarts":3},"change":{}},
       {"icon":"camera","label":"Take a group photograph","result":"I took a new photo and labeled everyone this time.","effects":{"bonds":7,"joy":4},"change":{"keepsake":"Reunion photo"}},
       {"icon":"chat","label":"Ask the janitor","result":"It was the old janitor. He appreciated the call.","effects":{"bonds":4},"change":{}}
     ]},
    {id:"lost-tooth",title:"Breakfast surprise",body:"Your first loose tooth landed in your cereal.",label:"Life event",
     rule:{"lifeStage":["child"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"journal","label":"Keep it in a tiny box","result":"I put the tooth in a box. Breakfast resumed.","effects":{"joy":4},"change":{"keepsake":"Tiny tooth box"}},
       {"icon":"chat","label":"Tell everyone immediately","result":"I announced it at full volume. Everyone checked their bowl.","effects":{"bonds":4,"joy":2},"change":{}},
       {"icon":"chat","label":"Call your guardian","result":"My guardian celebrated and inspected the remaining teeth.","effects":{"bonds":4},"change":{}}
     ]},
    {id:"spelling",title:"Spelling final",body:"The spelling bee gives you a word with far too many vowels.",label:"Life event",
     rule:{"lifeStage":["child"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"book","label":"Sound it out","result":"I sounded it out. The judge checked the card.","effects":{"smarts":6},"change":{"grade":5},"branches":[{"weight":4,"stat":"smarts","scale":0.09,"text":"I sounded it out. The judge checked the card.","effects":{"smarts":6},"change":{"grade":5}},{"weight":4,"text":"I added an extra vowel. It was a very public vowel.","effects":{"joy":-3,"discipline":2},"change":{}}]},
       {"icon":"heart","label":"Make a pact to celebrate together","result":"I agreed to celebrate with the next contestant either way.","effects":{"joy":5,"bonds":4},"change":{}},
       {"icon":"book","label":"Ask for a definition","result":"The judge read it. I learned a word the hard way.","effects":{"smarts":4},"change":{}}
     ]},
    {id:"lunch-seat",title:"Empty chair",body:"A new kid is eating alone. Your table has room.",label:"Life event",
     rule:{"lifeStage":["child"]},random:true,weight:4,karmaBias:1,crazinessBias:0,choices:[
       {"icon":"people","label":"Pull up a chair","result":"I pulled up a chair. They remembered.","effects":{"bonds":6,"joy":3},"change":{}},
       {"icon":"chat","label":"Introduce them to your club","result":"I made introductions. The club gained a member.","effects":{"bonds":4},"change":{"reputation":4}},
       {"icon":"heart","label":"Share the good biscuits","result":"The new kid offered a trade for next week.","effects":{"bonds":4,"karma":2},"change":{}}
     ]},
    {id:"team-cut",title:"Team selection",body:"You missed the team by one spot. The coach needs an answer.",label:"Life event",
     rule:{"lifeStage":["teen"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"shoe","label":"Run another lap","result":"I stayed for a lap. The coach noticed.","effects":{"health":6,"joy":2},"change":{"reputation":3},"branches":[{"weight":4,"stat":"health","scale":0.09,"text":"I stayed for a lap. The coach noticed.","effects":{"health":6,"joy":2},"change":{"reputation":3}},{"weight":4,"text":"My legs ran out before the lap did. I booked another tryout.","effects":{"joy":-2,"health":2},"change":{}}]},
       {"icon":"flag","label":"Offer to manage the team","result":"I managed the team. The clipboard was real power.","effects":{"smarts":4,"bonds":3},"change":{}},
       {"icon":"shoe","label":"Try a different sport","result":"I found a smaller team with a spare shirt.","effects":{"health":4},"change":{}}
     ]},
    {id:"exam-leak",title:"Wrong attachment",body:"A classmate posted what looks like tomorrow’s answers.",label:"Life event",
     rule:{"lifeStage":["teen"]},random:true,weight:4,karmaBias:0,crazinessBias:1,choices:[
       {"icon":"book","label":"Stick to your notes","result":"I revised from my notes. No disciplinary meeting.","effects":{"smarts":5},"change":{"grade":6}},
       {"icon":"chat","label":"Tell the teacher","result":"I told the teacher. Tomorrow got a new exam.","effects":{"joy":-2},"change":{"grade":3,"reputation":3}},
       {"icon":"dice","label":"Take your chances","result":"I gambled on the file. The answer key was last year’s.","effects":{"joy":-5},"change":{"grade":-7}}
     ]},
    {id:"first-show",title:"School-night concert",body:"A band you like is playing the night before a test.",label:"Life event",
     rule:{"lifeStage":["teen"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"ticket","label":"Go with a friend","result":"I went with a friend. The test came unusually early.","effects":{"joy":8,"bonds":3},"change":{"grade":-3}},
       {"icon":"book","label":"Stay in and study","result":"I studied. Somebody sent me a blurry video.","effects":{"smarts":5},"change":{"grade":5}},
       {"icon":"pencil","label":"Catch the opening act","result":"I got home before the argument started.","effects":{"joy":3,"discipline":2},"change":{}}
     ]},
    {id:"viral-photo",title:"Permission slip",body:"A photo of your friend could go viral. Your friend has not seen it.",label:"Life event",
     rule:{"lifeStage":["teen"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"heart","label":"Ask your friend first","result":"I asked first. They appreciated owning their face.","effects":{"bonds":6},"change":{"reputation":4}},
       {"icon":"phone","label":"Post it right away","result":"I posted it. My friend found out from strangers.","effects":{"joy":2,"bonds":-6},"change":{"reputation":-3}},
       {"icon":"heart","label":"Delete the photo","result":"My camera roll got less exciting. My conscience did fine.","effects":{"karma":5},"change":{}}
     ]},
    {id:"moving-day",title:"Apartment stairs",body:"A neighbor needs help moving. The elevator has a sign on it.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"bag","label":"Help carry the boxes","result":"I carried boxes. One was marked “other heavy things.”","effects":{"health":4,"bonds":5},"change":{}},
       {"icon":"coffee","label":"Bring drinks for everyone","result":"I brought drinks. Nobody declined.","effects":{"cash":-12,"bonds":6},"change":{}},
       {"icon":"pencil","label":"Organize the loading area","result":"The sofa moved on the first try. Very suspicious.","effects":{"discipline":4},"change":{}}
     ]},
    {id:"unexpected-bill",title:"Repair estimate",body:"A repair estimate arrived with the word “urgent” underlined twice.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"tools","label":"Book the repair","result":"I booked the repair. The noise stopped.","effects":{"cash":-180,"joy":4},"change":{}},
       {"icon":"phone","label":"Ask the building manager","result":"The building manager agreed to take a look.","effects":{"cash":-45,"smarts":3,"joy":-2},"change":{}},
       {"icon":"book","label":"Request another estimate","result":"The second estimate contained fewer exclamation marks.","effects":{"smarts":4},"change":{}}
     ]},
    {id:"street-fair",title:"Spare stall",body:"A stall opened up at the street fair. It comes with a wobbly table.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"shop","label":"Run a stall","result":"I ran the stall and folded a flyer under the table leg.","effects":{"cash":210,"smarts":3},"change":{},"branches":[{"weight":4,"stat":"discipline","scale":0.09,"text":"I ran the stall and folded a flyer under the table leg.","effects":{"cash":210,"smarts":3},"change":{}},{"weight":4,"text":"The queue moved faster than I did. I broke even.","effects":{"joy":-2,"smarts":3},"change":{}}]},
       {"icon":"people","label":"Give the space to a newcomer","result":"I found a newcomer who wanted the space.","effects":{"bonds":6},"change":{"reputation":4}},
       {"icon":"heart","label":"Help with cleanup","result":"The organizers wrote down my name for the good list.","effects":{"karma":4},"change":{}}
     ]},
    {id:"public-speaking",title:"Five-minute warning",body:"The scheduled speaker is late. Someone handed you a microphone.",label:"Life event",
     rule:{"lifeStage":["adult","college","career"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"mic","label":"Tell a story","result":"I told a story. It lasted the promised five minutes.","effects":{"joy":6},"change":{"reputation":6},"branches":[{"weight":4,"stat":"willpower","scale":0.09,"text":"I told a story. It lasted the promised five minutes.","effects":{"joy":6},"change":{"reputation":6}},{"weight":4,"text":"I forgot the ending. The audience got a shorter program.","effects":{"joy":-2,"smarts":2},"change":{}}]},
       {"icon":"people","label":"Interview someone in the crowd","result":"I interviewed a volunteer. They had prepared remarks.","effects":{"bonds":6,"smarts":2},"change":{}},
       {"icon":"chat","label":"Announce a coffee break","result":"The room approved unanimously.","effects":{"joy":4},"change":{}}
     ]},
    {id:"long-distance",title:"Unanswered message",body:"Someone you used to see weekly now sends a birthday emoji.",label:"Life event",
     rule:{"lifeStage":["adult","college","career","elder"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"coffee","label":"Make time for coffee","result":"I made time for coffee. There was actual news.","effects":{"cash":-9,"bonds":8,"joy":3},"change":{}},
       {"icon":"phone","label":"Plan a standing call","result":"I scheduled a regular call. Both calendars objected.","effects":{"bonds":5,"smarts":2},"change":{}},
       {"icon":"chat","label":"Send a voice note","result":"They sent one back. It was mostly their dog.","effects":{"bonds":4},"change":{}}
     ]},
    {id:"local-press",title:"Local news",body:"A reporter wants a quote about your neighborhood project.",label:"Life event",
     rule:{"lifeStage":["adult","college","career","elder"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"newspaper","label":"Give the interview","result":"I gave a quote. My name appeared in print.","effects":{"joy":5},"change":{"reputation":9}},
       {"icon":"heart","label":"Credit the volunteers","result":"I named the volunteers. Most clipped the article.","effects":{"bonds":7},"change":{"reputation":3}},
       {"icon":"pencil","label":"Send the meeting minutes","result":"The facts survived. So did the spelling of my name.","effects":{"discipline":4},"change":{}}
     ]},
    {id:"anniversary",title:"Double booking",body:"Two people picked the same evening to celebrate something important.",label:"Life event",
     rule:{"lifeStage":["adult","college","career","elder"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"age-up","label":"Split the evening","result":"I split the evening and ate cake twice.","effects":{"bonds":5,"health":-2},"change":{}},
       {"icon":"letter","label":"Write someone a letter","result":"I wrote a letter. Someone kept the envelope.","effects":{"bonds":5,"joy":3},"change":{}},
       {"icon":"chat","label":"Host a joint dinner","result":"Everyone came. The cakes remained separate.","effects":{"bonds":4},"change":{}}
     ]},
    {id:"class-rep",title:"Class election",body:"Class representative is open. The benefits include complaints.",label:"Life event",
     rule:{"lifeStage":["child","teen"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"flag","label":"Campaign for the seat","result":"I ran. My first request concerned the vending machine.","effects":{"smarts":4},"change":{"reputation":6},"branches":[{"weight":4,"stat":"looks","scale":0.09,"text":"I ran. My first request concerned the vending machine.","effects":{"smarts":4},"change":{"reputation":6}},{"weight":4,"text":"The stapler won the protest vote. I lost by two.","effects":{"joy":-3,"willpower":2},"change":{}}]},
       {"icon":"pencil","label":"Design posters for a friend","result":"I made posters. My friend provided the promises.","effects":{"joy":5,"bonds":3},"change":{}},
       {"icon":"pencil","label":"Run the ballot count","result":"All the votes added up. Even the one for a stapler.","effects":{"discipline":4},"change":{}}
     ]},
    {id:"radio-guest",title:"Radio invitation",body:"Local radio wants a guest who remembers the old neighborhood.",label:"Life event",
     rule:{"lifeStage":["elder"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"mic","label":"Go on the air","result":"I went on air. The host asked about parking.","effects":{"joy":6,"bonds":4},"change":{},"branches":[{"weight":4,"stat":"smarts","scale":0.09,"text":"I went on air. The host asked about parking.","effects":{"joy":6,"bonds":4},"change":{}},{"weight":4,"text":"I mixed up two street names. The station issued a correction.","effects":{"joy":-2,"willpower":2},"change":{}}]},
       {"icon":"frame","label":"Send an old photograph","result":"I sent a photograph. Radio put it on their website.","effects":{"joy":5},"change":{"keepsake":"Studio thank-you note"}},
       {"icon":"book","label":"Record a short message","result":"My voice survived the ad break.","effects":{"joy":3,"smarts":2},"change":{}}
     ]},
    {id:"prison-letter",title:"Mail call",body:"A letter from home includes a blank sheet and a stamped envelope.",label:"In custody",
     rule:{"lifeStage":["prison"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"pencil","label":"Write straight back","result":"I wrote back. The censor got the family news first.","effects":{"bonds":5,"joy":3},"change":{}},
       {"icon":"journal","label":"Keep it in your journal","result":"I filed the letter beside my bunk.","effects":{"joy":5},"change":{}},
       {"icon":"chat","label":"Ask about everyone at home","result":"A second letter arrived with actual gossip.","effects":{"bonds":4},"change":{}}
     ]},
    {id:"prison-class",title:"Available seat",body:"The prison classroom has one empty seat and twelve worn textbooks.",label:"In custody",
     rule:{"lifeStage":["prison"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"book","label":"Take the class","result":"I took the class. The textbook contained advice from previous owners.","effects":{"smarts":7,"joy":2},"change":{}},
       {"icon":"people","label":"Help another student","result":"I helped another student finish the assignment.","effects":{"bonds":5,"smarts":3},"change":{}},
       {"icon":"book","label":"Organize a study pair","result":"Both of us passed the quiz. The pencils were returned.","effects":{"smarts":4},"change":{}}
     ]},
    {id:"prison-match",title:"Yard fixture",body:"The yard game needs a player and someone willing to count accurately.",label:"In custody",
     rule:{"lifeStage":["prison"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"shoe","label":"Join the game","result":"I joined in. The score was disputed on schedule.","effects":{"health":6,"joy":3},"change":{}},
       {"icon":"flag","label":"Keep the score","result":"I kept score. My handwriting held up in review.","effects":{"bonds":5,"smarts":2},"change":{}},
       {"icon":"heart","label":"Set up the benches","result":"I got a quiet seat and a thank-you.","effects":{"health":2,"karma":2},"change":{}}
     ]},
    {id:"prison-friend",title:"Lunch table",body:"A new arrival stands with a tray and nowhere to sit.",label:"In custody",
     rule:{"lifeStage":["prison"]},random:true,weight:4,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"people","label":"Offer a seat at your table","result":"I slid my tray over. We ate lunch in the prison dining hall.","effects":{"bonds":6,"joy":3},"change":{}},
       {"icon":"book","label":"Lend them a book","result":"I lent a book. It came back with a useful bookmark.","effects":{"smarts":4,"bonds":3},"change":{}},
       {"icon":"heart","label":"Show them the schedule","result":"They made the next roll call on time.","effects":{"karma":5},"change":{}}
     ]},
    {id:"roommate-fridge",title:"Fridge court",body:"Your roommate labeled your milk with their own name. The evidence is cold.",label:"College",
     rule:{"lifeStage":["college"]},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"chat","label":"Ask for the milk back","result":"The milk returned. It now has both names crossed out.","effects":{"willpower":4,"joy":1},"change":{}},
       {"icon":"pencil","label":"Draw up a fridge agreement","result":"I now have a shelf and a three-page treaty.","effects":{"discipline":5,"smarts":2},"change":{"tag":"fridge-treaty"}},
       {"icon":"dice","label":"Label their chair","result":"They found my name on their chair. Diplomatic relations cooled.","effects":{"craziness":5,"karma":-3},"change":{}}
     ]},
    {id:"office-hours",title:"Office hours",body:"Your professor offered feedback. Their calendar says 7:15 a.m.",label:"College",
     rule:{"lifeStage":["college"]},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"clock","label":"Show up early","result":"I got feedback and saw a lecturer eat cereal out of a mug.","effects":{"discipline":4},"change":{"grade":7}},
       {"icon":"letter","label":"Email one good question","result":"They answered it with a better question.","effects":{"smarts":5},"change":{"grade":2}},
       {"icon":"moon","label":"Sleep through it","result":"My pillow provided no academic feedback.","effects":{"joy":4},"change":{"grade":-4}}
     ]},
    {id:"tuition-error",title:"Billing error",body:"University billing charged you a lab fee. Your lab is a seminar room.",label:"College",
     rule:{"lifeStage":["college"]},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"letter","label":"Dispute the charge","result":"The fee vanished. The apology was automated.","effects":{"willpower":4},"change":{"tag":"billing-dispute"}},
       {"icon":"coin","label":"Pay the $80","result":"The seminar room still lacks a laboratory.","effects":{"cash":-80,"discipline":2},"change":{}},
       {"icon":"people","label":"Compare bills","result":"Six classmates filed the same objection.","effects":{"karma":4,"smarts":2},"change":{}}
     ]},
    {id:"study-hearing",title:"Academic hearing",body:"Someone submitted a paper suspiciously similar to yours. Even the typo matches.",label:"College",
     rule:{"lifeStage":["college"],"requiredStats":{"smarts":48}},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"book","label":"Show your drafts","result":"The timestamps settled it.","effects":{"discipline":4},"change":{"grade":4}},
       {"icon":"chat","label":"Speak to the student","result":"They admitted it and rewrote the paper.","effects":{"willpower":4,"karma":2},"change":{}},
       {"icon":"exit","label":"Let it drop","result":"The professor marked both papers down.","effects":{"joy":-3},"change":{"grade":-6}}
     ]},
    {id:"probation-letter",title:"Probation letter",body:"Your conviction came up on a routine form. The box is very small.",label:"Crime",
     rule:{"minAge":18,"requiredTags":["convicted"]},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"pencil","label":"Fill it in","result":"I disclosed the record. The box needed extra paper.","effects":{"karma":5,"discipline":2},"change":{}},
       {"icon":"letter","label":"Request your records","result":"I obtained a copy. My birthday is finally correct.","effects":{"smarts":4},"change":{}},
       {"icon":"exit","label":"Withdraw the application","result":"I left with my privacy and no application.","effects":{"joy":-3,"willpower":3},"change":{}}
     ]},
    {id:"lost-wallet",title:"Found wallet",body:"A wallet on the bus contains $90 and a photo of an unusually serious cat.",label:"Crime",
     rule:{"minAge":18,"excludedTags":["wallet-owner"]},random:true,weight:7,karmaBias:0,crazinessBias:1,choices:[
       {"icon":"heart","label":"Return it intact","result":"The owner thanked me and explained the cat.","effects":{"karma":9,"joy":3},"change":{"tag":"wallet-owner"}},
       {"icon":"coin","label":"Keep the cash","result":"I pocketed $90. The cat looked judgmental.","effects":{"cash":90,"karma":-9,"notoriety":3},"change":{"tag":"kept-wallet"}},
       {"icon":"people","label":"Hand it to the driver","result":"The driver signed for it. I kept the receipt.","effects":{"discipline":4,"karma":4},"change":{}}
     ]},
    {id:"deposit-slip",title:"Extra change",body:"A cashier gave you $40 too much. They are already serving the next person.",label:"Crime",
     rule:{"minAge":18},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"coin","label":"Give it back","result":"Their drawer balanced. My conscience got a quiet evening.","effects":{"karma":6},"change":{}},
       {"icon":"wallet","label":"Keep walking","result":"I kept the $40. It did not improve my personality.","effects":{"cash":40,"karma":-7},"change":{}},
       {"icon":"chat","label":"Count it together","result":"I found the error and learned their name.","effects":{"karma":4,"bonds":3},"change":{}}
     ]},
    {id:"date-check",title:"The bill arrives",body:"The bill came with one dessert you both deny ordering.",label:"Romance",
     rule:{"minAge":14,"relation":"partner"},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"chat","label":"Ask about the dessert","result":"It belonged to table six. Table six apologized.","effects":{"willpower":3},"change":{"person":"love"}},
       {"icon":"heart","label":"Split what you ordered","result":"We each paid our share. Peace lasted through the bus ride.","effects":{"bonds":4,"karma":2},"change":{"person":"love"}},
       {"icon":"dice","label":"Claim it was a test","result":"My date did not appreciate the exam.","effects":{"bonds":-5,"craziness":3},"change":{"person":"love","bondAmount":-7}}
     ]},
    {id:"key-copy",title:"Spare key",body:"Your partner wants a spare key. The key cutter offers a glitter finish.",label:"Romance",
     rule:{"minAge":18,"relation":"partner","excludedTags":["shared-key"]},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"key","label":"Give them a key","result":"They took the plain one. Shared access is official.","effects":{"joy":5,"bonds":4},"change":{"tag":"shared-key","person":"love"}},
       {"icon":"chat","label":"Talk about boundaries","result":"I agreed on when to call first.","effects":{"willpower":4,"bonds":2},"change":{}},
       {"icon":"exit","label":"Keep one set","result":"They returned the glitter sample in silence.","effects":{"discipline":3,"bonds":-3},"change":{}}
     ]},
    {id:"key-return",title:"The key still works",body:"The spare key you gave your partner opened your door during an exceptionally bad haircut.",label:"Romance",
     rule:{"relation":"partner","requiredTags":["shared-key"]},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"heart","label":"Laugh together","result":"They kept the secret. The haircut lasted longer.","effects":{"joy":5},"change":{"person":"love"}},
       {"icon":"chat","label":"Ask for a warning text","result":"I agreed on a text before entry.","effects":{"willpower":4},"change":{}},
       {"icon":"key","label":"Take the key back","result":"The spare key went in the drawer. The conversation lasted an hour.","effects":{"bonds":-5,"discipline":2},"change":{"person":"love","bondAmount":-5}}
     ]},
    {id:"wedding-album",title:"Wedding invoice",body:"Your wedding photographer wants to sell you a third album of the same day.",label:"Romance",
     rule:{"relation":"spouse"},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"wallet","label":"Buy the album","result":"I bought photographic proof of something both of us remember.","effects":{"cash":-120,"bonds":4},"change":{}},
       {"icon":"heart","label":"Make one together","result":"The photos are crooked. My spouse likes it.","effects":{"joy":5,"bonds":4},"change":{"person":"love"}},
       {"icon":"letter","label":"Decline politely","result":"The discount code expired peacefully.","effects":{"discipline":4},"change":{}}
     ]},
    {id:"blood-draw",title:"Waiting room",body:"The clinic is running forty minutes late. The fish tank has no fish.",label:"Health",
     rule:{"minAge":7,"hasCondition":true},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"clock","label":"Wait your turn","result":"I saw the clinician and received a treatment plan.","effects":{"health":5,"discipline":3},"change":{"care":true}},
       {"icon":"chat","label":"Ask for a cancellation slot","result":"They moved me up. The fish remain missing.","effects":{"health":3,"willpower":3},"change":{"care":true}},
       {"icon":"exit","label":"Go home","result":"I went home with the same symptoms.","effects":{"joy":2,"health":-3},"change":{}}
     ]},
    {id:"ankle-curb",title:"One bad curb",body:"A curb catches your ankle. The curb has no comment.",label:"Health",
     rule:{"minAge":9},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"shoe","label":"Rest it","result":"I missed practice and let the swelling settle.","effects":{"health":2,"discipline":3},"change":{}},
       {"icon":"dice","label":"Keep going","result":"I limped home with a sprain.","effects":{"health":-7,"craziness":3},"change":{"injury":"sprained ankle"},"branches":[{"weight":4,"stat":"health","scale":0.09,"text":"I limped home with a sprain.","effects":{"health":-7,"craziness":3},"change":{"injury":"sprained ankle"}},{"weight":4,"text":"My ankle held up. I chose the ramp on the way home.","effects":{"health":1,"discipline":2},"change":{}}]},
       {"icon":"phone","label":"Call for a ride","result":"A friend supplied a lift and a running commentary.","effects":{"bonds":4,"health":1},"change":{}}
     ]},
    {id:"hearing-aid",title:"Volume dispute",body:"You turned the TV up. The neighbor identified the program through the wall.",label:"Old age",
     rule:{"minAge":65},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"heart","label":"Book a checkup","result":"The clinic adjusted the settings. The neighbor sent thanks.","effects":{"health":5,"cash":-45},"change":{}},
       {"icon":"book","label":"Switch on captions","result":"I learned how several characters spell their names.","effects":{"smarts":3,"joy":2},"change":{}},
       {"icon":"chat","label":"Invite the neighbor over","result":"We watched together at a volume we could both live with.","effects":{"bonds":5},"change":{},"branches":[{"weight":4,"stat":"karma","scale":0.09,"text":"We watched together at a volume we could both live with.","effects":{"bonds":5},"change":{}},{"weight":4,"text":"The neighbor declined and sent me a pair of headphones.","effects":{"joy":-1,"discipline":2},"change":{}}]}
     ]},
    {id:"desk-chair",title:"Chair budget",body:"Your boss can replace one office chair. All six make the same noise.",label:"Career",
     rule:{"lifeStage":["career"],"minAge":18},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"tools","label":"Fix the squeakiest one","result":"One chair stopped announcing every movement.","effects":{"smarts":3},"change":{"performance":5},"branches":[{"weight":4,"stat":"smarts","scale":0.09,"text":"One chair stopped announcing every movement.","effects":{"smarts":3},"change":{"performance":5}},{"weight":4,"text":"The chair still squeaked. It now did so in a different key.","effects":{"joy":-2,"smarts":1},"change":{}}]},
       {"icon":"people","label":"Let the team vote","result":"The loudest chair won a surprisingly fair election.","effects":{"karma":4},"change":{"performance":2}},
       {"icon":"bag","label":"Claim the new chair","result":"I sit comfortably. My colleagues noticed.","effects":{"joy":5,"karma":-4},"change":{}}
     ]},
    {id:"wrong-slide",title:"Wrong slide",body:"Your presentation opened on a photo of your lunch. The directors are waiting.",label:"Career",
     rule:{"lifeStage":["career"],"requiredStats":{"jobPerformance":40}},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"chat","label":"Own the mistake","result":"I explained the sandwich and delivered the report.","effects":{"willpower":4},"change":{"performance":5}},
       {"icon":"spark","label":"Call it a case study","result":"The room requested an explanation.","effects":{},"change":{},"branches":[{"weight":4,"stat":"smarts","scale":0.09,"text":"They bought the sandwich analogy. The minutes say “operations.”","effects":{"joy":5},"change":{"performance":8}},{"weight":6,"text":"Nobody bought it. I changed the slide.","effects":{"joy":-3},"change":{"performance":-6}}]},
       {"icon":"exit","label":"Skip to the numbers","result":"The figures were correct. The sandwich stayed off record.","effects":{"discipline":4},"change":{"performance":2}}
     ]},
    {id:"lost-pet",title:"Runaway hamster",body:"A class hamster escaped. A meeting has been called at its empty cage.",label:"Childhood",
     rule:{"minAge":5,"maxAge":12},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"heart","label":"Help search","result":"I found it behind the art supplies.","effects":{"karma":5,"bonds":3},"change":{}},
       {"icon":"pencil","label":"Make a missing poster","result":"My hamster portrait looked like a potato. It helped anyway.","effects":{"smarts":4},"change":{}},
       {"icon":"dice","label":"Nominate a suspect","result":"The class rabbit was cleared of all charges.","effects":{"craziness":4,"karma":-2},"change":{}}
     ]},
    {id:"first-roster",title:"Last team slot",body:"You have one place on your team and two classmates waiting.",label:"Teen years",
     rule:{"minAge":11,"maxAge":17},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"people","label":"Let them alternate","result":"Both played. My clipboard required extra math.","effects":{"karma":5,"discipline":2},"change":{}},
       {"icon":"shoe","label":"Hold a tryout","result":"The result stood. One friendship needed a minute.","effects":{"health":3,"willpower":3},"change":{}},
       {"icon":"exit","label":"Give up your place","result":"I kept score. Both classmates remembered.","effects":{"karma":7,"bonds":3},"change":{}}
     ]},
    {id:"pension-call",title:"Pension hotline",body:"The pension office wants proof you are alive. You are currently on hold.",label:"Old age",
     rule:{"minAge":65},random:true,weight:7,karmaBias:0,crazinessBias:0,choices:[
       {"icon":"clock","label":"Stay on the line","result":"I authenticated my continued existence.","effects":{"discipline":4},"change":{}},
       {"icon":"letter","label":"Send the paperwork","result":"The stamped form outlived the call queue.","effects":{"smarts":3},"change":{}},
       {"icon":"chat","label":"Visit the counter","result":"Being physically present saved one photocopy.","effects":{"health":2,"willpower":3},"change":{}}
     ]},
    {id:"honor-roll",title:"Honor roll",body:"Your grades made the honor roll. The principal asked for a quote.",label:"School",
     rule:{"minAge":8,"maxAge":17,"requiredStats":{"grade":73},"excludedTags":["honor-roll"]},random:true,weight:7,karmaBias:1,crazinessBias:0,choices:[
       {"icon":"people","label":"Thank your study partner","result":"The school printed both names.","effects":{"karma":4,"bonds":4},"change":{"tag":"honor-roll"}},
       {"icon":"book","label":"Credit the library","result":"The librarian pinned the quote above overdue notices.","effects":{"smarts":4},"change":{"tag":"honor-roll"}},
       {"icon":"mic","label":"Thank your pen","result":"The pen received no further media requests.","effects":{"joy":5,"craziness":3},"change":{"tag":"honor-roll"}}
     ]},
    {"id":"group-lab","title":"Lab partners","body":"{contact} accidentally deleted the group presentation. The class starts in ten minutes.","label":"School","rule":{"contact":"classmate"},"random":true,"weight":8,"karmaBias":0,"crazinessBias":0,"choices":[
       {"icon":"tools","label":"Rebuild it together","result":"We rebuilt five slides. Slide six was a sincere apology.","effects":{"smarts":3},"change":{"grade":4,"bondAmount":8,"person":"$contact"}},
       {"icon":"chat","label":"Explain it to the teacher","result":"I explained what happened. We got one more day.","effects":{"discipline":2},"change":{"grade":1,"bondAmount":3,"person":"$contact"}},
       {"icon":"exit","label":"Let them present alone","result":"I stayed in my seat. {contact} remembered.","effects":{"karma":-4},"change":{"grade":-3,"bondAmount":-12,"person":"$contact"}}
     ]},
    {"id":"cafeteria-invite","title":"A seat at lunch","body":"{contact} is eating alone. One chair is free.","label":"School","rule":{"contact":"classmate"},"random":true,"weight":8,"karmaBias":0,"crazinessBias":0,"choices":[
       {"icon":"people","label":"Sit down","result":"I ate with {contact}. We have the same opinion about school pudding.","effects":{"joy":3},"change":{"bondAmount":11,"person":"$contact"}},
       {"icon":"heart","label":"Invite them to your table","result":"I pulled up a chair for {contact}. Lunch got louder.","effects":{"karma":4},"change":{"bondAmount":8,"person":"$contact"}},
       {"icon":"shoe","label":"Walk past","result":"I ate at my usual table.","effects":{"willpower":1},"change":{"bondAmount":-2,"person":"$contact"}}
     ]},
    {"id":"wrong-grade","title":"Someone else’s mark","body":"{contact} gave you marks for a question you left blank.","label":"School","rule":{"contact":"teacher"},"random":true,"weight":8,"karmaBias":0,"crazinessBias":0,"choices":[
       {"icon":"chat","label":"Point it out","result":"I told {contact}. My honesty cost me three marks.","effects":{"karma":7},"change":{"grade":-3,"bondAmount":8,"person":"$contact"}},
       {"icon":"book","label":"Keep the mark","result":"I kept the mark. The question remains a mystery.","effects":{"karma":-4},"change":{"grade":3,"bondAmount":0}},
       {"icon":"pencil","label":"Ask to try the question","result":"I solved it the second time. {contact} let the mark stand.","effects":{"smarts":4},"change":{"grade":2,"bondAmount":5,"person":"$contact"}}
     ]},
    {"id":"last-minute-shift","title":"Weekend cover","body":"{contact} wants somebody to cover Saturday. Everybody has suddenly stopped reading the group chat.","label":"Work","rule":{"contact":"boss"},"random":true,"weight":8,"karmaBias":0,"crazinessBias":0,"choices":[
       {"icon":"bag","label":"Work the shift","result":"I covered Saturday. {contact} put it in my file.","effects":{"joy":-3,"discipline":3},"change":{"performance":9,"bondAmount":7,"person":"$contact"}},
       {"icon":"clock","label":"Offer a half shift","result":"I covered until lunch. Somebody else got the afternoon.","effects":{"willpower":2},"change":{"performance":4,"bondAmount":3,"person":"$contact"}},
       {"icon":"sun","label":"Keep Saturday free","result":"I took Saturday off. The company survived.","effects":{"joy":4},"change":{"performance":-2,"bondAmount":-3,"person":"$contact"}}
     ]},
    {"id":"office-credit","title":"Credit due","body":"{contact} has just presented your idea with one important change. It is now their idea.","label":"Work","rule":{"contact":"coworker"},"random":true,"weight":8,"karmaBias":0,"crazinessBias":0,"choices":[
       {"icon":"chat","label":"Speak up in the meeting","result":"I explained where the idea came from. {contact} looked at the carpet.","effects":{"willpower":4},"change":{"performance":5,"bondAmount":-8,"person":"$contact"}},
       {"icon":"people","label":"Talk to them afterward","result":"We agreed to put both names on the document.","effects":{"discipline":3},"change":{"performance":3,"bondAmount":5,"person":"$contact"}},
       {"icon":"exit","label":"Let it go","result":"I let {contact} take the credit. They also got the follow-up meeting.","effects":{"joy":-2},"change":{"bondAmount":3,"person":"$contact"}}
     ]},
    {"id":"family-concert","title":"Front row","body":"{contact} has a school concert tonight. Their solo lasts eleven seconds.","label":"Family","rule":{"contact":"child"},"random":true,"weight":8,"karmaBias":0,"crazinessBias":0,"choices":[
       {"icon":"music","label":"Go early","result":"I heard every second of {contact}’s solo. All eleven.","effects":{"joy":5},"change":{"bondAmount":10,"person":"$contact"}},
       {"icon":"camera","label":"Record the performance","result":"I filmed the ceiling for the first three seconds. The rest is {contact}.","effects":{"joy":3},"change":{"bondAmount":7,"person":"$contact"}},
       {"icon":"clock","label":"Miss the concert","result":"I missed {contact}’s concert. They noticed the empty chair.","effects":{"joy":-3},"change":{"bondAmount":-10,"person":"$contact"}}
     ]},
    {"id":"desk-drawer","title":"The spare key","body":"{contact} finds a desk key nobody can identify. Work has stopped until somebody solves this.","label":"Work","rule":{"contact":"coworker"},"random":true,"weight":8,"karmaBias":0,"crazinessBias":0,"choices":[
       {"icon":"key","label":"Try the filing cabinet","result":"I opened the cabinet. It contained six more keys.","effects":{"smarts":3},"change":{"bondAmount":4,"person":"$contact"}},
       {"icon":"bag","label":"Hand it to reception","result":"I signed over the key. It has a file number now.","effects":{"discipline":3},"change":{"performance":2,"bondAmount":2,"person":"$contact"}},
       {"icon":"clock","label":"Get back to work","result":"I finished my job while the key committee met.","effects":{"willpower":3},"change":{"performance":4,"bondAmount":-1,"person":"$contact"}}
     ]},
    {"id":"bus-pass-kid","title":"Missing pass","body":"{contact} lost a bus pass for the second time this term.","label":"Family","rule":{"contact":"child"},"random":true,"weight":8,"karmaBias":0,"crazinessBias":0,"choices":[
       {"icon":"compass","label":"Look together","result":"We found the pass in {contact}’s other shoe.","effects":{"joy":2},"change":{"bondAmount":7,"person":"$contact"}},
       {"icon":"shoe","label":"Make them retrace their steps","result":"{contact} found it and came home with a remarkably detailed bus timetable.","effects":{"discipline":3},"change":{"bondAmount":2,"person":"$contact"}},
       {"icon":"chat","label":"Give them a lecture","result":"I delivered a speech. The bus left halfway through it.","effects":{"joy":-2},"change":{"bondAmount":-5,"person":"$contact"}}
     ]}
  ];
  const more=typeof module!=='undefined'&&module.exports?require('./expansion-stories.js').PocketExpansionStories:root.PocketExpansionStories;
  const historical=typeof module!=='undefined'&&module.exports?require('./history-stories.js').PocketHistoryStories:root.PocketHistoryStories;
  const pathways=typeof module!=='undefined'&&module.exports?require('./pathways-stories.js').PocketPathwaysStories:root.PocketPathwaysStories;
  list.push(...more.list,...historical.list,...pathways.list);
  const stories={};for(const event of list)stories[event.id]=event;
  root.PocketStories={stories,list};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
