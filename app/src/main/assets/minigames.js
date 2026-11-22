/* Life effects and availability. Only the deterministic reducer can settle an attempt. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const tiles=node?require('./minigame-grid.js').PocketMiniGrid:root.PocketMiniGrid;
  const puzzles=node?require('./minigame-puzzles.js').PocketMiniPuzzles:root.PocketMiniPuzzles;
  const M=node?require('./model.js').PocketModel:root.PocketModel;
  const H=node?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  const defaults=Object.freeze({enabled:true,difficulty:'standard',controls:'direct',assistance:true,timing:'timed',sound:false,haptics:false});
  const settingsValues={enabled:[true,false],difficulty:['casual','standard','challenging'],controls:['direct','buttons'],
    assistance:[true,false],timing:['timed','untimed'],sound:[true,false],haptics:[true,false]};
  const definitions=Object.freeze({
    escape:{title:'Prison Escape',icon:'key',group:'custody',minAge:18,
      summary:'Cross a changing tile board. A failed escape extends your sentence.',
      tutorial:'Pick up either gold marker and reach the gate. Move with the arrows or tap an adjacent tile. Guards advance after each turn. The outer lane keeps alert low until you are spotted. Striped gates cycle each turn. Wait for them to open. Blue cover lowers alert. Decoys pause patrols for two moves.'},
    burglary:{title:'Burglary',icon:'key',group:'crime',minAge:18,
      summary:'Get to the exit with a prize. Capture or abandoning the attempt brings a hearing.',
      tutorial:'Move across the board and take at least one red prize, then return to the green exit. Larger prizes take two spaces and raise alert. Blue tiles offer cover. Decoys pause patrols. The outside lane is longer and has gates that cycle as you move or wait.'},
    driving:{title:'Driving Test',icon:'car',group:'travel',minAge:16,
      summary:'Answer course questions, then park a car in the marked bay.',
      tutorial:'Choose an answer on each course card. In the parking lot, turn the car, move forward or reverse one square. Stop in the green bay facing its arrow. Contact with a boundary or another car counts as a fault.'},
    career:{title:'Career Challenge',icon:'bag',group:'work',minAge:18,
      summary:'Solve a puzzle for your line of work. Your supervisor records the result.',
      tutorial:'Read all the briefing rules. Tap cards in the order they should be performed. Undo takes back the most recent card. Submit commits the whole assignment. Turning it in with mistakes can hurt your performance.'},
    historical:{title:'Workshop Challenge',icon:'tools',group:'general',minAge:12,
      summary:'Complete a local commission guided by the period’s trades.',
      tutorial:'Read the commission rules and place the cards in order. Undo removes the last card. Submit gives the patron your final plan.'},
    service:{title:'Field Route Drill',icon:'compass',group:'work',minAge:18,
      summary:'Navigate a fictional training board. Every square gives a clue.',
      tutorial:'Reach the flag without stepping into a blocked square. A tile’s number counts blocked spaces directly next to it. You can use a probe to check an adjacent square. The exercise ends if you hit an obstacle or run out of moves.'},
    sport:{title:'Track Reaction Drill',icon:'shoe',group:'general',minAge:12,
      summary:'Read lane cues and build competitive sports skill.',
      tutorial:'Tap the indicated lane when the timing marker reaches the line. The untimed option asks you to recall lanes in small groups. Use Pause for a cue reminder.'},
    music:{title:'Rehearsal Cues',icon:'music',group:'general',minAge:12,
      summary:'Play pitch cues and build performance skill.',
      tutorial:'Tap the indicated note when the timing marker reaches the line. The untimed option uses small groups of notes you can recall at your own pace. Use Pause for a cue reminder.'},
    cards:{title:'Three Colors',icon:'dice',group:'general',minAge:21,
      summary:'Choose a color in a local card game. Each color has a 1 in 3 chance.',
      tutorial:'One of three colors is drawn. A match returns twice your stake in total. Each color has the same 1 in 3 chance. There is one round per year, paid with game currency.'}
  });
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),ids=Object.keys(definitions);
  const cal=l=>l.born+l.age;
  const version=1;
  const maxSteps=120;
  const wrap=l=>l.sim.minigames;
  const active=l=>wrap(l)?.active||null;
  const revision=l=>wrap(l)?.revision||0;
  const wanted=l=>wrap(l)?.fugitive||null;
  const reserved={escape:'mini-escape',burglary:'sim-burglary',driving:'license'};
  const use=id=>reserved[id]||'mini-'+id;
  const difficulty={casual:1,standard:2,challenging:3};
  const levels=['','Casual','Standard','Challenging','High security'];
  const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
  function settings(input){
    const out={...defaults};
    for(const [k,v] of Object.entries(settingsValues))if(v.includes(input?.[k]))out[k]=input[k];
    return out;
  }
  function validateSettings(s){
    if(s===undefined)return;
    if(!s||typeof s!=='object'||Array.isArray(s)||Object.entries(s).some(([key,value])=>!own(settingsValues,key)||!settingsValues[key].includes(value)))throw Error('Invalid interactive game settings.');
  }
  function blockedReason(l,id,key){
    if(!wanted(l))return '';
    if(id==='burglary'||id==='driving'||id==='cards'||key==='relocate'||key==='job-change'||key==='license'||key==='sim-work-reference'){
      return 'Resolve your outstanding sentence first';
    }
    return '';
  }
  function drivingAge(l,ctx){
    const code=ctx.sim.geography.cities[l.town]?.code;
    if(l.town==='cedar'||l.town==='sunfield'||l.town==='briar')return 16;
    if(['JP','DE','IT','ES','BR'].includes(code))return 18;
    if(['GB','IE','AU','NZ'].includes(code))return 17;
    return 16;
  }
  function gameVariant(l,id,ctx){
    if(id==='historical'){
      const y=cal(l);
      if(y<1500)return 'trade';
      if(y<1700)return 'arts';
      if(y<1900)return 'factory';
      if(y>=1910&&y<1950)return 'flight';
      if(y>=2050)return 'future';
      return null;
    }
    if(id!=='career')return null;
    const role=l.job,title=ctx.jobs[role]?.[0].toLowerCase()||'';
    if(!role||['student','retired'].includes(role))return Object.keys(l.sim.expansion?.companies||{}).length?'business':null;
    if(cal(l)<1900)return cal(l)<1700?'trade':'factory';
    if(cal(l)>=2050&&/orbital|habitat|stellar|planetary|relay|sail/.test(title))return 'future';
    if(/physicist|scientist|electric|engineering|engineer|technician/.test(title))return 'engineering';
    if(/medical|physician|doctor|nurse|therapist|ward|health|pharm|anesth|clinic/.test(title))return 'care';
    if(cal(l)>=1970&&/software|comput|app develop|network|test automation|systems analyst|data/.test(title))return 'code';
    if(/mechanic|repair|machinist|welder/.test(title))return 'mechanics';
    if(/teacher|lecturer|educat|principal|school/.test(title))return 'teaching';
    if(/law|attorney|magistrate|court|solicitor|legal/.test(title))return 'law';
    if(/chef|food|baker|cook|restaurant|barista/.test(title))return 'kitchen';
    if(/director|manager|account|trade|financ|office|sales|invest/.test(title))return 'business';
    const sector=ctx.sector(role);
    return ({Care:'care',Technology:cal(l)>=1970?'code':'service',Industry:'engineering',Commerce:'business',Creative:'arts'})[sector]||'service';
  }
  function isService(l,ctx){
    const title=ctx.jobs[l.job]?.[0]||'';
    return ctx.category(l.job)==='Uniformed service'||(l.job?.startsWith('era-')&&/guard|knight|warrior|retainer|militia|naval|military/i.test(title));
  }
  function visible(l,id,ctx){
    const y=cal(l);
    if(id==='escape')return l.sim.prison>0;
    if(id==='historical')return H.enabled(l)&&!!gameVariant(l,id,ctx);
    if(id==='career')return !!gameVariant(l,id,ctx);
    if(id==='service')return isService(l,ctx);
    if(id==='driving')return y>=1930;
    if(id==='cards')return y>=1975&&['cedar','briar','sunfield'].includes(l.town);
    return true;
  }
  function fee(l,id){
    if(id==='driving')return l.age<18?0:30;
    if(id==='cards')return Math.max(1,Math.min(50,Math.round(H.profile(l).cost*20)));
    return 0;
  }
  function qualify(l,id,ctx){
    if(!own(definitions,id)||!visible(l,id,ctx))return 'Unavailable here and now';
    if(l.ended)return 'Life complete';
    if(ctx.blocking(l))return 'Finish the current decision';
    const age=id==='driving'?drivingAge(l,ctx):definitions[id].minAge;
    if(l.age<age)return 'Opens at '+age;
    if(id!=='escape'&&l.sim.prison)return 'In custody';
    if(id==='driving'&&l.sim.license)return 'License earned';
    if(id==='sport'&&l.sim.injuries.length)return 'Recover from your injury first';
    if(id==='sport'&&l.age>64)return 'Competitive trials end at 65';
    const hold=blockedReason(l,id);
    if(hold)return hold;
    if(l.used.includes(use(id)))return 'Done this year';
    const due=fee(l,id);
    return due>l.cash?'Need '+H.money(l,due):'';
  }
  function entries(l,ctx,group){
    return ids.filter(id=>visible(l,id,ctx)&&(!group||definitions[id].group===group)&&
      (!l.sim.prison||id==='escape')).map(id=>entry(l,id,ctx));
  }
  function entry(l,id,ctx){
    if(!own(definitions,id)||!visible(l,id,ctx))return null;
    const best=wrap(l)?.records[id];
    const definition=definitions[id],title=id==='historical'?puzzles.briefs[gameVariant(l,id,ctx)][0]:definition.title;
    return {...definition,id,title,variant:gameVariant(l,id,ctx),reason:qualify(l,id,ctx),fee:fee(l,id),best:best||null,preparedness:preparedness(l,id,ctx),
      subtitle:id==='driving'?'Local license exam · minimum age '+drivingAge(l,ctx):null};
  }
  function preparedness(l,id,ctx){
    const x=l.sim.expansion,m=wrap(l)?.records[id],practice=Math.min(12,(m?.wins||0)*2),d=l.hidden.discipline;
    const eq=id==='driving'&&Object.entries(l.world.owned).some(([key,o])=>o.condition>=70&&ctx.world.shopping.ownedItem(key,o).category==='Vehicle')?4:0;
    const arts=id==='sport'?x?.hobbies?.running:x?.hobbies?.music;
    const activeSkill=id==='sport'?l.stats.health:id==='escape'||id==='burglary'?l.hidden.willpower:l.stats.smarts;
    const work=(id==='career'||id==='service')?l.world.performance:ctx.studio.skill(l,id);
    return M.clamp(Math.round(activeSkill*.56+d*.24+work*.20+practice+eq+Math.min(12,(arts||0)*.12)));
  }
  function makeRun(l,id,prefs,ctx){
    const base=difficulty[prefs.difficulty],previous=wrap(l)?.records[id];
    const security=id==='escape'?Math.min(2,Math.floor(l.sim.prison/3)+Math.floor((previous?.turns||0)/2)):0;
    return {id,age:l.age,seed:M.hash(l.id+'/'+cal(l)+'/'+id+'/mini-v1'),skill:preparedness(l,id,ctx),
      difficulty:prefs.difficulty,level:Math.min(4,base+security),variant:gameVariant(l,id,ctx),fee:fee(l,id),untimed:prefs.timing==='untimed',
      paused:false,restarted:false,inputs:[]};
  }
  const isGrid=id=>id==='escape'||id==='burglary';
  function makeBoard(run){return isGrid(run.id)?tiles.create(run):puzzles.create(run);}
  function nextBoard(board,input){
    return board.type==='grid'?tiles.step(board,input):puzzles.step(board,input);
  }
  const replayCache=new WeakMap();
  function replay(run){
    let board=replayCache.get(run);if(board)return board;
    board=makeBoard(run);
    for(const input of run.inputs){
      board=nextBoard(board,input);
      if(!board)throw Error('Invalid interactive game transcript.');
    }
    replayCache.set(run,board);
    return board;
  }
  function current(l){
    const run=active(l);if(!run)return null;
    const board=replay(run);
    const definition=definitions[run.id];
    return {id:run.id,title:run.id==='historical'?puzzles.briefs[run.variant][0]:definition.title,
      tutorial:definition.tutorial,level:levels[run.level],num:revision(l),
      paused:run.paused,canRestart:!run.restarted&&run.id!=='cards',board:board.type==='grid'?tiles.view(board):board};
  }
  function get(l){
    return wrap(l)||(l.sim.minigames={version,revision:0,records:{}});
  }
  function write(l,run){
    const data=get(l);data.revision++;data.active=run;
  }
  function simulated(run){
    const roll=tiles.rng(run.seed^0xd9c1f252);
    if(run.id==='cards'){
      const won=roll(3)===puzzles.create(run).winning;
      return {won,score:won?100:0,haul:0,reason:won?'Matched the hidden card':'The hidden card was different'};
    }
    const risk=['escape','burglary'].includes(run.id);
    const chance=Math.max(15,Math.min(84,(risk?29:38)+Math.floor(run.skill*.55)-(run.level-1)*(risk?10:8)));
    const won=roll(100)<chance,score=won?Math.min(88,57+Math.floor(run.skill*.30)):27+roll(24);
    return {won,score,haul:won&&run.id==='burglary'?1+roll(2):0,reason:won?'Skills check passed':'Skills check failed'};
  }
  function start(l,id,options,expected,ctx){
    if(expected!==revision(l)||qualify(l,id,ctx))return null;
    const prefs=settings(options),run=makeRun(l,id,prefs,ctx);
    l.used.push(use(id));ctx.apply(l,{cash:-run.fee});
    write(l,run);
    if(!prefs.enabled)return {receipt:finish(l,run,simulated(run),ctx)};
    return {started:true};
  }
  function choices(l,expected,command,ctx){
    const run=active(l);
    if(!run||l.ended||revision(l)!==expected||typeof command!=='string')return null;
    if(command==='pause'||command==='resume'){
      const paused=command==='pause';
      if(paused===run.paused)return null;
      write(l,{...run,paused});return {changed:true};
    }
    if(command==='exit'){
      if(!run.paused)return null;
      return {receipt:finish(l,run,{won:false,score:0,haul:0,reason:'Attempt ended early',exited:true},ctx)};
    }
    if(command==='restart'){
      if(!run.paused||run.restarted||run.id==='cards')return null;
      write(l,{...run,paused:false,restarted:true,inputs:[]});return {changed:true};
    }
    if(run.paused||run.inputs.length>=maxSteps||command.length>28)return null;
    const board=nextBoard(replay(run),command);if(!board)return null;
    if(board.result)return {receipt:finish(l,run,board.result,ctx)};
    const next={...run,inputs:run.inputs.concat(command)};
    if(next.inputs.length===maxSteps)return {receipt:finish(l,run,{won:false,haul:0,score:0,reason:'Attempt limit reached'},ctx)};
    replayCache.set(next,board);write(l,next);return {changed:true};
  }
  function finish(l,run,result,ctx){
    const data=get(l),before=M.metrics(l,ctx.world.netWorth,ctx.sim.budget);
    const effects={},progress={},id=run.id,win=result.won;
    let text,title,kind='Activity';
    if(id==='driving'){
      if(win)l.sim.license=true;
      title=win?'Earned a driver’s license':'Driving test ended';
      text=win?'I passed the course and earned a license.':'I left without a license. Applications reopen next year.';
      effects.joy=win?4:-2;kind='Milestone';
    }else if(id==='escape'){
      const sentence=l.sim.prison;
      if(win){
        l.sim.prison=0;data.fugitive={year:cal(l),sentence,security:run.level};
        M.tag(l,'escaped-custody');effects.notoriety=18;effects.karma=-7;
        title='Escaped custody';text='I made it out with '+sentence+' years still owing. A warrant is active.';
      }else{
        const extra=run.level>=4?2:1;l.sim.prison=sentence+extra;
        effects.notoriety=5;effects.joy=-5;title='Escape attempt failed';text='The facility added '+extra+' '+(extra===1?'year':'years')+' to my sentence.';
      }
      kind='Justice';ctx.campus(l);
    }else if(id==='burglary'){
      const scale=H.historical(l)?H.profile(l).food*H.profile(l).cost/7500:1;
      M.tag(l,'crime-burglary');kind='Justice';
      Object.assign(effects,{karma:-5,notoriety:win?5:8,joy:win?-2:-5});
      if(win){
        const pay=Math.max(1,Math.round(Math.min(950,90+118*result.haul)*scale));
        effects.cash=pay;title='Left with the haul';text='I brought home '+H.money(l,pay)+'.';
      }else{
        ctx.sim.openCase(l,'burglary');progress.reputation=-7;
        title='Charged with burglary';text='I lost the haul. The court sent a summons.';
      }
    }else if(id==='cards'){
      const payout=win?2*run.fee:0;
      effects.cash=payout;title=win?'Matched the draw':'Lost the stake';
      text=win?'The table returned '+H.money(l,payout)+' including my stake.':'The table kept my stake of '+H.money(l,run.fee)+'.';
    }else if(id==='sport'||id==='music'){
      const track=id==='sport'?'sport':'music';
      const gain=win?Math.min(7,Math.round(result.score/16)):result.exited?0:1;
      if(gain){
        ctx.studio.drill(l,track,gain);
        if(l.sim.expansion){
          const hobby=id==='sport'?'running':'music',hobbies=l.sim.expansion.hobbies;
          hobbies[hobby]=M.clamp((hobbies[hobby]||0)+gain);
        }
      }
      effects.joy=win?3:-1;progress.reputation=win?2:0;
      title=win?'Drill complete':'Drill ended';text=gain?'I added '+gain+' points to my practice record.':'I left before the session was scored.';
    }else{
      const working=l.job&&!['student','retired'].includes(l.job);
      if((id==='career'||id==='service')&&working){
        progress.performance=win?9:result.exited?-2:-4;kind='Career';
      }
      if(win){progress.reputation=id==='service'?4:2;effects.discipline=2;effects.smarts=2;}
      else effects.joy=-2;
      if(id==='historical'&&win){
        const p=H.profile(l),payment=l.age>=18?Math.max(1,Math.min(260,Math.round(p.food*p.cost*.018))):0;
        effects.cash=payment;
        if(cal(l)<1900&&l.sim.timeline)l.sim.timeline.training=Math.min(6,(l.sim.timeline.training||0)+1);
        text=payment?'The patron accepted my plan and paid '+H.money(l,payment)+'.':'The patron accepted my plan. The junior assignment was unpaid.';
      }else if(id==='service')text=win?'My supervisor added the drill to my training record.':'I missed the route standard. My supervisor marked the attempt.';
      else text=win?(working?'My supervisor logged a clean assignment.':'I completed the commission.'):'The assignment went back for corrections.';
      title=win?(id==='service'?'Field route cleared':'Assignment completed'):(id==='service'?'Field route failed':'Assignment fell short');
      if(id==='career'&&win&&run.level>=2&&result.score>=95){
        if(working){
          const pay=Math.min(125,Math.max(1,Math.round(H.profile(l).food*.012)));
          effects.cash=pay;text+=' The assignment paid a '+H.money(l,pay)+' bonus.';
        }else{
          const company=Object.values(l.sim.expansion?.companies||{}).find(c=>c.clients<8&&c.town===l.town);
          if(company){company.clients++;text+=' '+company.name+' took on one regular client.';}
        }
      }
    }
    ctx.apply(l,effects);ctx.world.metrics(l,progress);
    const old=data.records[id]||{wins:0,turns:0,best:0};
    data.records[id]={wins:old.wins+Number(win),turns:old.turns+1,best:Math.max(old.best,result.score)};
    delete data.active;data.revision++;
    const delta=M.diff(before,M.metrics(l,ctx.world.netWorth,ctx.sim.budget));
    if(run.fee){delta.cash=(delta.cash||0)-run.fee;if(!delta.cash)delete delta.cash;}
    const summary=result.reason+' · '+result.score+' / 100. '+text;
    const receipt={title,text:summary,delta,from:'minigame'};
    l.outcome=receipt;l.sim.review=receipt;
    ctx.log(l,kind,title,summary,delta);
    return receipt;
  }
  function detain(l,reason,ctx){
    const data=wrap(l),escape=data?.fugitive;if(!escape||l.ended||l.sim.prison)return null;
    const extra=reason==='surrender'?0:1;
    l.sim.prison=escape.sentence+extra;l.sim.appealed=false;delete data.fugitive;data.revision++;
    if(l.sim.program)l.sim.program=null;
    ctx.world.changeJob(l,null,true);ctx.campus(l);
    const delta=ctx.apply(l,{joy:-5,notoriety:extra?5:-4});
    const title=reason==='surrender'?'Returned to custody':'Captured after escape';
    const text='I am serving the '+escape.sentence+' remaining '+(escape.sentence===1?'year':'years')+(extra?' plus one year for the escape.':'.');
    ctx.log(l,'Justice',title,text,delta);
    return {title,text,delta};
  }
  function surrender(l,expected,ctx){
    if(expected!==revision(l)||ctx.blocking(l))return null;
    const result=detain(l,'surrender',ctx);
    if(result){l.outcome=result;l.sim.review={...result,from:'minigame'};}
    return result;
  }
  function annual(l,ctx){
    const escape=wanted(l);if(!escape)return;
    const elapsed=cal(l)-escape.year;
    const roll=tiles.rng(M.hash(l.id+'/pursuit/'+cal(l)))(100);
    if(elapsed>=3||roll<20+elapsed*13+escape.security*4)detain(l,'capture',ctx);
    else ctx.log(l,'Justice','Still wanted','The warrant stayed active. I could still turn myself in.');
  }
  function validate(l,ctx){
    const data=wrap(l);if(data===undefined)return;
    const fail=()=>{throw Error('Invalid interactive game history.');};
    if(!data||data.version!==version||!integer(data.revision,1,200000)||!data.records||
      typeof data.records!=='object'||Array.isArray(data.records))fail();
    let completions=0;
    for(const [id,r] of Object.entries(data.records)){
      if(!own(definitions,id)||!r||!integer(r.turns,1,l.age+1)||!integer(r.wins,0,r.turns)||!integer(r.best,0,100))fail();
      completions+=r.turns;
    }
    if(completions>data.revision)fail();
    const escape=data.fugitive;
    if(escape!==undefined&&(!escape||!integer(escape.sentence,1,155)||!integer(escape.security,1,4)||
      !integer(escape.year,cal(l)-(l.ended?3:2),cal(l))||l.sim.prison||!data.records.escape?.wins))fail();
    const run=data.active;
    if(run===undefined)return;
    if(!run||!own(definitions,run.id)||!own(difficulty,run.difficulty)||!visible(l,run.id,ctx)||l.ended||l.sim.review||l.sim.court||
      l.event&&!l.event.resolved||l.age!==run.age||![run.untimed,run.paused,run.restarted].every(v=>typeof v==='boolean')||
      !l.used.includes(use(run.id))||blockedReason(l,run.id)||run.id!=='escape'&&l.sim.prison>0||run.id==='escape'&&l.sim.prison<=0||
      l.age<(run.id==='driving'?drivingAge(l,ctx):definitions[run.id].minAge)||run.id==='driving'&&l.sim.license||
      run.restarted&&run.id==='cards'||
      !Array.isArray(run.inputs)||run.inputs.length>=maxSteps||run.inputs.some(input=>typeof input!=='string'||input.length>28))fail();
    const expected=makeRun(l,run.id,{difficulty:run.difficulty,timing:run.untimed?'untimed':'timed'},ctx);
    if(['seed','level','skill','variant','fee'].some(key=>run[key]!==expected[key])||replay(run).result)fail();
  }
  root.PocketMinigames={active,revision,wanted,blockedReason,settings,settingsValues,validateSettings,entries,entry,current,start,choices,annual,surrender,validate};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
