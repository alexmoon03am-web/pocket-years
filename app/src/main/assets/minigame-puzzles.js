/* Seeded simulations for parking, reasoning and performance. No DOM, clocks or life state. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const {rng,shuffle,move}=node?require('./minigame-grid.js').PocketMiniGrid:root.PocketMiniGrid;
  const mod=(n,m)=>(n%m+m)%m;
  const questions=[
    ['stop','STOP','The examiner placed a STOP sign here. What do they want?','Stop before the line.','Turn at once.','Flash your lights.'],
    ['arrows','↓ ↑','Two arrows point in opposite directions. What does this mark on the course?','Two-way traffic.','No traffic at all.','Only bicycles.'],
    ['yield','▽','The course legend marks this as YIELD. What should you demonstrate?','Give way before joining the lane.','Always go first.','Reverse into the lane.'],
    ['works','⚒','The course map shows maintenance ahead. How should you approach?','Slow down and watch for the crew.','Accelerate through the section.','Stop in the middle of the work area.'],
    ['rain','≈','The examiner switches the course to wet conditions. How should you adapt?','Leave more space to brake.','Follow the next car more closely.','Use the same spacing at higher speed.'],
    ['closed','⛔','A barrier closes your lane. How should you proceed on this course?','Follow the marked detour.','Drive around the barrier.','Wait in the opposing lane.'],
    ['cross','◆','The map marks a crossing at the diamond. A person steps onto it. What should you do?','Let them finish crossing.','Drive around them.','Sound the horn and continue.'],
    ['view','◫','A blind corner hides the far end of a narrow lane. What does the examiner expect?','Approach slowly enough to stop within view.','Speed up to leave the lane sooner.','Use the far lane to see around it.']
  ];
  const headings=[[0,-1],[1,0],[0,1],[-1,0]];
  function driving(run,draw){
    const number=run.level>=3?6:run.level===2?5:4;
    const exams=shuffle(questions,draw).slice(0,number).map(([id,sign,prompt,...answers])=>({
      id,sign,prompt,answers:shuffle(answers.map((label,index)=>({label,ok:index===0})),draw)
    }));
    const w=6,h=6,side=draw(2)?1:-1,top=draw(2)?1:4;
    const goalX=side===1?w-2:1,goal=top*w+goalX,startX=draw(2)+2;
    const start=(h-1-top)*w+startX,goalHeading=side===1?1:3;
    const parked=[];
    for(const x of [0,w-1])for(let y=0;y<h;y++)if(draw(3)!==0)parked.push(y*w+x);
    for(const y of [top-1,top+1])if(y>=0&&y<h)parked.push(y*w+goalX);
    const limit=run.level>=3?15:run.level===2?18:22;
    const tolerance=run.level>=3?1:2;
    const required=Math.max(3,number-(run.skill>=72||run.level<=1?1:0));
    return {type:'driving',w,h,exams,question:0,correct:0,required,parking:false,start,player:start,heading:draw(4),goal,goalHeading,
      parked,turns:0,limit,tolerance,faults:0,notice:'Choose an answer for each course question.',result:null};
  }
  function drive(s,cmd){
    if(s.result)return null;
    if(!s.parking){
      const answer=/^a([0-2])$/.exec(cmd);
      if(!answer)return null;
      const ok=s.exams[s.question].answers[Number(answer[1])].ok,question=s.question+1,correct=s.correct+Number(ok);
      return {...s,question,correct,parking:question===s.exams.length,notice:ok?'Correct.':'That answer missed the examiner’s mark.'};
    }
    if(!['turn-left','turn-right','forward','reverse'].includes(cmd))return null;
    let heading=s.heading,player=s.player,faults=s.faults,notice='Clear.';
    if(cmd.startsWith('turn-'))heading=mod(heading+(cmd==='turn-left'?-1:1),4);
    else{
      const next=move(player,headings[mod(heading+(cmd==='reverse'?2:0),4)],s.w,s.h);
      if(next<0||s.parked.includes(next)){faults++;notice='Contact with a boundary. The examiner marked a fault.';}
      else player=next;
    }
    const turns=s.turns+1,parked=player===s.goal&&heading===s.goalHeading;
    if(player===s.goal&&!parked)notice='You reached the bay. Match the marked heading.';
    const won=parked&&faults<=s.tolerance&&s.correct>=s.required;
    const result=parked||faults>s.tolerance||turns>=s.limit?{
      won,haul:0,score:Math.max(0,Math.round(s.correct/s.exams.length*55+(parked?45:0)-faults*6)),
      reason:won?'Exam passed':s.correct<s.required?'Too few correct answers':faults>s.tolerance?'Too many parking faults':'Parking incomplete'
    }:null;
    return {...s,heading,player,prev:s.player,faults,turns,notice,result};
  }

  // Each specialist department has its own original cards. Which procedure goes
  // first depends on the fictional assignment, as specified on the briefing.
  const briefs={
    care:['Clinic desk','The clinic has one desk and appointments for five fictional visitors.',[
      'Put the appointment slips out','Open the records cabinet','Route the urgent message','Call the next visitor','Return the completed forms','Count the spare chairs']],
    code:['Build pipeline','The test build has five tickets that share a runner.',[
      'Load the sample data','Configure the test runner','Link the mock service','Run the edge checks','Archive the test report','Update the local fixtures']],
    engineering:['Workshop checks','The training rig is a closed prop circuit. Plan the checks on the bench.',[
      'Find the blue connector','Check the sample diagram','Test the spare module','Trace the indicator lamp','Record the meter display','Label the practice board']],
    business:['Operations meeting','The team has one desk and a fixed booking window. Arrange the decision cards.',[
      'Open the purchasing envelope','Verify the refund totals','Check the room booking','Set the trial budget','Write the meeting note','Count the available stock']],
    law:['Case file','The fictional hearing clerk needs an ordered packet of exhibits.',[
      'Label the timeline','File the signed statement','Compare the two receipts','Index the witness list','Attach the exhibit map','Prepare the submission record']],
    teaching:['Classroom plan','Five groups share a lesson room this afternoon.',[
      'Introduce the sample problem','Collect the practice pages','Distribute the picture cards','Set up the model','Read the closing question','Put out the pencils']],
    kitchen:['Service order','The training kitchen has one clear workbench and several order tickets.',[
      'Read the table tickets','Set out the serving plates','Finish the salad trays','Portion the flatbreads','Send the first tray','Sort the clean utensils']],
    mechanics:['Repair bench','The class is diagnosing a prop machine with the motor disconnected.',[
      'Tag the suspect part','Compare the inspection cards','Check the replacement fit','Sort the bench tools','Write the repair ticket','Return the calibration block']],
    service:['Shift handover','A single counter handles every booking. Read the handover rules.',[
      'Count the ticket stubs','Open the day ledger','Sort the bookings','Send the stock note','File the handover sheet','Clear the returns tray']],
    trade:['Market commission','The stall shares its table with the guild for one morning.',[
      'Weigh the sample goods','Unroll the tally cord','Sort the marked baskets','Meet the guild clerk','Record the exchange','Hang the sample cloth']],
    arts:['Studio commission','Several projects share a patron’s studio this afternoon.',[
      'Select the study sketch','Prepare a sample panel','Check the framing note','Lay out the color trials','Show the draft to the patron','Count the blank sheets']],
    factory:['Factory tally','You have five practice tickets and a shared worktable.',[
      'Open the shift ledger','Sort the sample cogs','Check the practice gauge','Mark the test crate','Report the stock count','File the collection chit']],
    flight:['Flight club dispatch','The training club files paper notes for a model-flight exercise.',[
      'Mark the wind card','File the flight slip','Complete the maintenance card','Pin the model route','Send the dispatch note','Assign the practice bench']],
    future:['Habitat relay','A simulated habitat is testing a repair shift with five digital tickets.',[
      'Isolate the sandbox relay','Verify the virtual signal','Check the simulation budget','Compare the reference logs','Submit the habitat ticket','Load the virtual test shell']]
  };
  function clue(kind,a,b,cards){
    const x=cards[a],y=kind==='fixed'?null:cards[b];
    if(kind==='fixed')return {text:x+' goes in slot '+(b+1)+'.',kind,a,b};
    if(kind==='next')return {text:x+' goes immediately before '+y.toLowerCase()+'.',kind,a,b};
    return {text:x+' comes before '+y.toLowerCase()+'.',kind,a,b};
  }
  function checks(order,c){
    const a=order.indexOf(c.a),b=order.indexOf(c.b);
    return c.kind==='fixed'?a===c.b:c.kind==='next'?a+1===b:a<b;
  }
  function permutations(values){
    if(!values.length)return [[]];
    return values.flatMap(a=>permutations(values.filter(b=>a!==b)).map(rest=>[a,...rest]));
  }
  const orders=Object.fromEntries([4,5,6].map(n=>[n,permutations(Array.from({length:n},(_,i)=>i))]));
  function ordering(run,draw){
    const [label,prompt,list]=briefs[run.variant], n=run.level>=3?6:run.level>=2?5:4;
    const cards=shuffle(list,draw).slice(0,n), solution=shuffle(Array.from({length:n},(_,i)=>i),draw),clues=[];
    let remaining=orders[n];
    const pool=[];
    for(let i=0;i<n;i++){
      pool.push(clue('fixed',solution[i],i,cards));
      if(i+1<n)pool.push(clue('next',solution[i],solution[i+1],cards));
      for(let j=i+1;j<n;j++)pool.push(clue('before',solution[i],solution[j],cards));
    }
    // Hard assignments start with indirect clues. The generator stops only
    // after the briefing identifies a unique plan.
    const first=shuffle(pool.filter(c=>run.level>=2?c.kind==='before':c.kind==='next'),draw);
    for(const c of first.slice(0,run.level>=3?3:2)){
      const next=remaining.filter(o=>checks(o,c));
      if(next.length<remaining.length){clues.push(c);remaining=next;}
    }
    for(const c of shuffle(pool,draw)){
      if(remaining.length===1)break;
      const next=remaining.filter(o=>checks(o,c));
      if(next.length<remaining.length){clues.push(c);remaining=next;}
    }
    return {type:'ordering',label,prompt,cards,clues,solution,picked:[],result:null};
  }
  function order(s,cmd){
    if(s.result)return null;
    if(cmd==='undo'&&s.picked.length)return {...s,picked:s.picked.slice(0,-1)};
    if(cmd==='submit'&&s.picked.length===s.cards.length){
      const total=s.clues.filter(c=>checks(s.picked,c)).length;
      return {...s,result:{won:total===s.clues.length,haul:0,score:Math.round(total*100/s.clues.length),
        reason:total===s.clues.length?'Every rule satisfied':total+' of '+s.clues.length+' rules satisfied'}};
    }
    if(!/^pick[0-5]$/.test(cmd))return null;
    const index=Number(cmd.slice(4));
    if(index>=s.cards.length||s.picked.includes(index))return null;
    return {...s,picked:s.picked.concat(index)};
  }

  function flip(lamps,index,w){
    const adjacent=headings.map(d=>move(index,d,w,w)).filter(p=>p>=0);
    const mask=[index,...adjacent].reduce((bits,b)=>bits|(1<<b),0);
    return lamps^mask;
  }
  function circuit(run,draw){
    const w=run.level>=2?4:3,target=(1<<(w*w))-1;
    const witness=shuffle(Array.from({length:w*w},(_,i)=>i),draw).slice(0,run.level+2);
    let lamps=witness.reduce((board,i)=>flip(board,i,w),target);
    // Different legal sequences can cancel. Ensure every board still has work to do.
    if(lamps===target){witness.push(0);lamps=flip(lamps,0,w);}
    return {type:'circuit',w,lamps,target,witness,used:0,limit:witness.length+6+(run.skill>=65?2:0),result:null};
  }
  function connect(s,cmd){
    if(s.result||!/^toggle(\d{1,2})$/.test(cmd))return null;
    const index=Number(cmd.slice(6));if(index>=s.w*s.w)return null;
    const lamps=flip(s.lamps,index,s.w),used=s.used+1,won=lamps===s.target;
    return {...s,lamps,used,result:won||used>=s.limit?{won,haul:0,score:won?Math.min(100,84+(s.limit-used)*2):0,
      reason:won?'All indicator lights on':'Out of switches'}:null};
  }
  const workOrders=[
    ['Close the outstanding refunds',4,7],['Pay someone to cover the spare desk',3,4],['Check the broken lift report',2,4],
    ['Reserve stock for next month',5,7],['Reuse the unopened kit',1,2],['Move the staff meeting',2,3],
    ['Update the public counter signs',1,2],['Arrange an extra return window',3,6],['Reconcile the supplier invoices',4,6]
  ];
  function bundles(cards){
    const results=[];
    for(let mask=0;mask<2**cards.length;mask++){
      const selected=cards.map((_,i)=>i).filter(i=>mask&(1<<i));
      results.push({selected,cost:selected.reduce((n,i)=>n+cards[i].cost,0),value:selected.reduce((n,i)=>n+cards[i].value,0)});
    }
    return results;
  }
  function budget(run,draw){
    const cards=shuffle(workOrders,draw).slice(0,5+run.level).map(([title,cost,value])=>({title,cost,value}));
    const required=draw(cards.length),cap=6+run.level+Number(run.skill>=70)+draw(3);
    const choices=bundles(cards).filter(s=>s.cost<=cap&&s.selected.includes(required)).sort((a,b)=>b.value-a.value);
    const target=choices[0].value-(run.level===1?1:0);
    return {type:'budget',cards,required,cap,target,solution:choices[0].selected,selected:[],remaining:cap,value:0,result:null};
  }
  function allocate(s,cmd){
    if(s.result)return null;
    if(cmd==='submit'){
      const won=s.selected.includes(s.required)&&s.value>=s.target,score=Math.min(won?100:60,Math.floor(s.value*100/s.target));
      return {...s,result:{won,score,haul:0,reason:won?'Budget and targets met':'The plan missed a required target'}};
    }
    if(!/^pick[0-7]$/.test(cmd))return null;
    const i=Number(cmd.slice(4)),card=s.cards[i];if(!card)return null;
    const remove=s.selected.includes(i),sign=remove?-1:1;
    if(!remove&&s.remaining<card.cost)return null;
    return {...s,selected:remove?s.selected.filter(k=>k!==i):s.selected.concat(i),remaining:s.remaining-sign*card.cost,value:s.value+sign*card.value};
  }

  // Nodes and constraints describe a training board, not real equipment or an active field.
  function training(run,draw){
    const w=5,h=5,start=20,exit=4;
    let x=0,y=4;
    const safe=[start];
    for(const d of shuffle(['right','right','right','right','up','up','up','up'],draw)){
      if(d==='right')x++;else y--;
      safe.push(y*w+x);
    }
    const blocked=shuffle(Array.from({length:w*h},(_,i)=>i).filter(i=>!safe.includes(i)),draw).slice(0,5+run.level);
    const count=Array.from({length:w*h},(_,i)=>headings.filter(d=>blocked.includes(move(i,d,w,h))).length);
    return {type:'training',w,h,start,exit,blocked,count,player:start,used:0,turns:11+(3-run.level)*2,probes:run.skill>=65?2:1,checked:[],safe,
      notice:'Reach the flag. The number on a tile counts blocked neighboring spaces.',result:null};
  }
  const trainingDirs={up:headings[0],right:headings[1],down:headings[2],left:headings[3]};
  function traverse(s,cmd){
    if(s.result)return null;
    if(cmd.startsWith('probe-')&&s.probes){
      const d=trainingDirs[cmd.slice(6)];if(!Array.isArray(d))return null;
      const target=move(s.player,d,s.w,s.h);
      if(target<0||s.checked.includes(target))return null;
      return {...s,checked:s.checked.concat(target),probes:s.probes-1,notice:s.blocked.includes(target)?'Probe found a blocked tile.':'Probe found an open tile.'};
    }
    if(!Object.hasOwn(trainingDirs,cmd))return null;
    const player=move(s.player,trainingDirs[cmd],s.w,s.h);
    if(player<0)return null;
    const used=s.used+1,hit=s.blocked.includes(player),won=player===s.exit&&!hit;
    return {...s,player,prev:s.player,used,notice:'Moved one tile.',result:won||hit||used>=s.turns?{
      won,haul:0,score:won?Math.min(100,70+(s.turns-used)*5):0,
      reason:won?'Reached the flag':hit?'Entered a blocked square':'Out of moves'
    }:null};
  }

  const lanes={
    sport:['Left lane','Center lane','Right lane'],
    music:['Low note','Middle note','High note']
  };
  function beats(run,draw){
    const total=run.level>=3?11:run.level===2?9:7;
    const window=Math.max(85,195-run.level*25+Math.round((run.skill-50)*.8));
    return {type:'beats',variant:run.id,labels:lanes[run.id],pattern:Array.from({length:total},()=>draw(3)),total,
      cycle:run.level>=3?900:run.level===2?1040:1210,window,offset:550,untimed:run.untimed,
      hits:0,index:0,notice:'Ready for the first cue.',result:null};
  }
  function beat(s,cmd){
    if(s.result)return null;
    const signal=/^hit([0-2])(?:@(-?\d{1,3}))?$/.exec(cmd);
    if(!signal&&cmd!=='miss'||signal&&(s.untimed!== (signal[2]===undefined)))return null;
    const offset=signal?.[2]===undefined?0:Number(signal[2])*10;
    if(signal&&!s.untimed&&(offset< -s.offset||offset>s.cycle-s.offset))return null;
    // Untimed mode asks for a three-cue pattern with the cue reference available through Pause.
    const answer=s.pattern[s.index],hit=!!signal&&Number(signal[1])===answer&&Math.abs(offset)<=s.window;
    const index=s.index+1,hits=s.hits+Number(hit),score=Math.round(hits*100/s.total);
    return {...s,index,hits,notice:hit?'On cue.':'Missed the cue.',result:index===s.total?{
      won:score>=67,haul:0,score,reason:hits+' of '+s.total+' cues landed'
    }:null};
  }
  function cards(run,draw){return {type:'cards',winning:draw(3),result:null};}
  function pickCard(s,cmd){
    if(s.result||!/^a[0-2]$/.test(cmd))return null;
    const won=Number(cmd[1])===s.winning;
    return {...s,result:{won,haul:0,score:won?100:0,reason:won?'Matched the hidden card':'The hidden card was different'}};
  }
  const adapters={
    driving:[driving,drive],career:[ordering,order],historical:[ordering,order],service:[training,traverse],sport:[beats,beat],music:[beats,beat],cards:[cards,pickCard]
  };
  function create(run){
    const draw=rng(run.seed);
    if(run.id==='career'&&run.variant==='business')return budget(run,draw);
    if(run.id==='career'&&['engineering','mechanics','code','future'].includes(run.variant))return circuit(run,draw);
    return adapters[run.id][0](run,draw);
  }
  function step(state,cmd){
    if(typeof cmd!=='string'||cmd.length>28)return null;
    return (state.type==='ordering'?order:state.type==='circuit'?connect:state.type==='budget'?allocate:state.type==='training'?traverse:state.type==='beats'?beat:state.type==='cards'?pickCard:drive)(state,cmd);
  }
  root.PocketMiniPuzzles={create,step,briefs,headings};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
