/* Portrait controls and feedback. Challenge state and rewards belong to the engine. */
(function(root){
  'use strict';
  const arrows={up:'↑',left:'←',down:'↓',right:'→'},heading=['↑','→','↓','←'];
  const colors=['Amber','Moss','Indigo'];
  const prefs={
    enabled:['Interactive games',[['on',true,'Play'],['off',false,'Skills check']]],
    difficulty:['Difficulty',[['casual','casual','Casual'],['standard','standard','Standard'],['challenging','challenging','Challenging']]],
    controls:['Board controls',[['direct','direct','Tap tiles + arrows'],['buttons','buttons','Arrows only']]],
    assistance:['Instructions',[['on',true,'Show hints'],['off',false,'Short prompts']]],
    timing:['Performance cues',[['timed','timed','Timed'],['untimed','untimed','Untimed']]],
    sound:['Cue sounds',[['off',false,'Silent'],['on',true,'Sound on']]],
    haptics:['Touch feedback',[['off',false,'Off'],['on',true,'On']]]
  };
  const careerRules={
    business:'Select orders to fit the available hours. Include the mandatory order and reach the output target. You can remove an order until you submit.',
    engineering:'Switch on all the indicator lights. A switch flips its tile and each of the four tiles sharing an edge. Diagonals are unaffected.',
    mechanics:'Switch on all the indicator lights. A switch flips its tile and each of the four tiles sharing an edge. Diagonals are unaffected.',
    code:'Switch on all the indicator lights. A switch flips its tile and each of the four tiles sharing an edge. Diagonals are unaffected.',
    future:'Switch on all the indicator lights. A switch flips its tile and each of the four tiles sharing an edge. Diagonals are unaffected.'
  };
  function create({E,row,detail,subhead,esc,cash,button,reduced}){
    const game=E.minigames;
    let alarms=[],clock=null,audio=null;
    function settings(s){return game.settings(s.minigames);}
    function options(l,group){
      return game.entries(l,group).map(e=>row('sheet',e.id==='driving'?'license':'mini-intro~'+e.id,e.title,e.summary,
        e.icon,e.reason,e.best?'Best '+e.best.best+'/100':'')).join('');
    }
    function directory(l){
      const sections=[['general','Recreation & skills'],['work','On the job'],['travel','Licensing'],['crime','Risk and justice'],['custody','In custody']];
      return {title:'Interactive activities',tag:'Pocket Years',body:(game.wanted(l)?warrantLink(l):'')+
        sections.map(([group,label])=>{const items=options(l,group);return items?subhead(label)+'<div class="commands">'+items+'</div>':'';}).join('')+
        row('sheet','mini-settings','Minigame settings','Game mode, difficulty, motion and controls.','settings')};
    }
    function warrantLink(l){
      return game.wanted(l)?row('sheet','mini-warrant','Outstanding warrant','Review the sentence or return to custody.','letter'):'';
    }
    function warrant(l){
      const caseFile=game.wanted(l);if(!caseFile)return null;
      return {title:'Outstanding warrant',tag:'Justice',body:detail('Sentence remaining',caseFile.sentence+' '+(caseFile.sentence===1?'year':'years'))+
        detail('While the warrant is active','Relocation, new employment and some activities are unavailable. Returning now lets you serve the original balance. Recapture adds one year.')+
        '<div class="sheet-actions">'+button('mini-surrender',String(game.revision(l)),'Return to custody','primary','check')+'</div>'};
    }
    function optionButton(key,value,label,selected){
      return '<button type="button" class="secondary mini-pref" data-do="mini-pref" data-key="'+key+'~'+value+
        '" aria-pressed="'+selected+'">'+esc(label)+'</button>';
    }
    function preferences(s){
      const p=settings(s);
      const fields=Object.entries(prefs).map(([key,[title,values]])=>{
        if(key==='haptics'&&typeof root.navigator?.vibrate!=='function')return detail(title,'Vibration is unavailable here.');
        return '<section class="mini-setting"><h3>'+esc(title)+'</h3><div class="mini-segment">'+values.map(([id,val,label])=>
          optionButton(key,id,label,val===p[key])).join('')+'</div></section>';
      });
      return {title:'Minigame settings',body:detail('Skills check','When games are off, character skills and circumstances resolve the same activity. Fees and consequences still apply.')+
        fields.join('')+'<section class="mini-setting"><h3>Motion</h3><div class="mini-segment">'+
        optionButton('motion','system','Device preference',s.motion!=='reduced')+optionButton('motion','reduced','Reduced',s.motion==='reduced')+
        '</div></section>'+detail('Reduced motion','Uses untimed performance cues and suppresses movement effects.')};
    }
    function preference(s,id){
      const [key,k]=id.split('~');
      if(key==='motion'&&['system','reduced'].includes(k)){s.motion=k;return true;}
      if(!Object.hasOwn(prefs,key))return false;
      if(key==='haptics'&&typeof root.navigator?.vibrate!=='function')return false;
      const item=prefs[key][1].find(t=>t[0]===k);if(!item)return false;
      s.minigames={...s.minigames,[key]:item[1]};return true;
    }
    function effective(s){
      const selected=settings(s);
      if(reduced())selected.timing='untimed';
      return selected;
    }
    function intro(l,s,id){
      const g=game.entry(l,id);if(!g)return null;
      const picked=effective(s);
      const amount=id==='driving'?detail('Test fee',g.fee?cash(g.fee):'Free'):id==='cards'?detail('Stake',cash(g.fee)+' · 1 in 3 chance · a match returns '+cash(g.fee*2)+' total'):'';
      const mode=picked.enabled?'Play challenge':'Resolve skills check';
      return {title:g.title,tag:g.subtitle||'Interactive activities',body:detail('Objective',g.summary)+amount+
        (g.id==='cards'?'':detail('Readiness',g.preparedness+'%. Practice and relevant skills help.'))+
        (picked.assistance&&picked.enabled?detail('How to play',(g.id==='career'&&careerRules[g.variant])||g.tutorial):'')+
        (g.best?detail('Your record',g.best.wins+' wins · '+g.best.turns+' attempts · best '+g.best.best+'/100'):'')+
        detail(picked.enabled?'Before you start':'Skills check',picked.enabled?'One attempt per year. You can pause and resume it. Ending it early records the attempt.':'Your skills and current circumstances determine the outcome. The attempt, fee and consequences are recorded normally.')+
        button('mini-start',id+'~'+game.revision(l),mode,'primary wide',g.icon,g.reason)};
    }
    function press(view,id,label,css='',extra=''){
      return '<button type="button" class="mini-button '+css+'" data-do="mini-input" data-key="'+esc(id)+'" data-turn="'+view.num+'"'+extra+'>'+esc(label)+'</button>';
    }
    function dirPad(v,actions){
      return '<div class="mini-dpad" role="group" aria-label="Move one tile">'+
        Object.entries(arrows).map(([key,icon])=>press(v,key,icon,'mini-'+key,' aria-label="Move '+key+'"'+(actions.includes(key)?'':' disabled'))).join('')+'</div>';
    }
    function box(s,label,cells){
      return '<div class="mini-grid" role="group" aria-label="'+esc(label)+'" style="--cols:'+s.w+';--rows:'+s.h+'">'+
        cells.join('')+token(s)+'</div>';
    }
    function token(s){
      const x=s.player%s.w,y=Math.floor(s.player/s.w);
      const old=!Number.isInteger(s.prev)?s.player:s.prev,dx=old%s.w-x,dy=Math.floor(old/s.w)-y;
      return '<span aria-hidden="true" class="mini-avatar'+(s.type==='driving'?' mini-auto':'')+'" style="--x:'+x+';--y:'+y+';--from-x:'+
        dx+';--from-y:'+dy+'">'+(s.type==='driving'?heading[s.heading]:'●')+'</span>';
    }
    function tileName(x,y,w,special){
      return 'Column '+(x+1)+', row '+(y+1)+(special?', '+special:'');
    }
    function tileMarkup(v,p,i,from,width,style,symbol,label,tappable){
      const x=i%width,y=Math.floor(i/width);
      const dx=x-from%width,dy=y-Math.floor(from/width);
      const dir=dx===0&&dy===-1?'up':dx===-1&&dy===0?'left':dx===0&&dy===1?'down':dx===1&&dy===0?'right':null;
      if(dir&&p.controls==='direct'&&tappable)return press(v,dir,symbol,'mini-cell '+style,' aria-label="'+esc('Move '+dir+' to '+tileName(x,y,width,label))+'"');
      return '<span class="mini-cell '+style+'" aria-hidden="true">'+esc(symbol)+'</span>';
    }
    function squareName(i,w){return (i%w+1)+' across, '+(Math.floor(i/w)+1)+' down';}
    function stealth(v,p){
      const s=v.board,prizes=Object.fromEntries(s.prizes.filter(x=>!s.picked.includes(x.p)).map(x=>[x.p,x.value]));
      const cells=s.floor.map((floor,i)=>{
        const gate=s.doors.find(g=>g.p===i),closed=gate&&!gate.open;
        const key=s.guards.includes(i)?'guard':closed?'gate':i===s.exit?'exit':prizes[i]?'prize':
          s.markers.includes(i)&&!s.card?'marker':s.cover.includes(i)?'cover':gate?'open-gate':floor?'floor':'wall';
        const glyph={guard:'◆',exit:'✦',prize:String(prizes[i]),marker:'◈',cover:'▧',gate:'▥','open-gate':'□',floor:'',wall:''}[key];
        return tileMarkup(v,p,i,s.player,s.w,key,glyph,key,floor&&!closed);
      });
      const limit=s.turns-s.used, goal=s.burg?'Haul '+s.haul+' · Space '+s.carried+'/'+s.capacity:s.card?'Marker collected':'Find a gold marker';
      const closed=s.doors.some(g=>!g.open&&Math.abs(s.player%s.w-g.p%s.w)+Math.abs(Math.floor(s.player/s.w)-Math.floor(g.p/s.w))===1);
      const reading='You are '+squareName(s.player,s.w)+'. Exit '+squareName(s.exit,s.w)+'. '+goal+'. '+(closed?'A gate is closed. ':'')+s.notice;
      const locations=(s.burg?s.prizes.filter(item=>!s.picked.includes(item.p)).map(item=>'Prize worth '+item.value+' at '+squareName(item.p,s.w)):
        s.card?[]:s.markers.map(at=>'Exit marker at '+squareName(at,s.w)))
        .concat(s.guards.map(at=>'Guard at '+squareName(at,s.w)),s.doors.map(g=>(g.open?'Open':'Closed')+' gate at '+squareName(g.p,s.w)));
      return '<div class="mini-hud"><span>'+limit+' turns left</span><span>'+esc(goal)+'</span><span>Alert '+s.alert+'%</span></div>'+
        '<div class="mini-alert" role="meter" aria-label="Alert level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+s.alert+'"><i style="width:'+s.alert+'%"></i></div>'+
        box(s,'Tile board',cells)+'<p class="mini-status" role="status">'+esc(reading)+'</p>'+
        '<details class="mini-rules" data-mini-map><summary>Board coordinates</summary><ul>'+locations.map(line=>'<li>'+esc(line)+'</li>').join('')+'</ul></details>'+
        '<div class="mini-controls">'+dirPad(v,s.actions)+'<div class="mini-actions">'+
        [['wait','Wait'],['hide','Hide'],['decoy','Decoy ('+s.decoys+')'],['take','Take prize']].filter(([id])=>id!=='take'||s.burg).map(([id,label])=>
          press(v,id,label,'',s.actions.includes(id)?'':' disabled')).join('')+'</div></div>';
    }
    function parking(v){
      const s=v.board;
      if(!s.parking){
        const q=s.exams[s.question];
        return '<div class="mini-hud"><span>Course question '+(s.question+1)+' of '+s.exams.length+'</span><span>'+s.correct+' correct</span></div>'+
          '<div class="mini-sign" aria-hidden="true">'+esc(q.sign)+'</div><p class="mini-question">'+esc(q.prompt)+'</p>'+
          '<div class="mini-stack">'+q.answers.map((a,i)=>press(v,'a'+i,a.label)).join('')+'</div>'+
          '<p class="mini-status" role="status">'+esc(s.notice)+'</p>';
      }
      const cells=Array.from({length:s.w*s.h},(_,i)=>{
        const key=i===s.goal?'exit':s.parked.includes(i)?'wall':'floor';
        return '<span class="mini-cell '+key+'" aria-hidden="true">'+(i===s.goal?heading[s.goalHeading]:s.parked.includes(i)?'▰':'')+'</span>';
      });
      return '<div class="mini-hud"><span>Parking · '+(s.limit-s.turns)+' moves</span><span>Faults '+s.faults+'/'+s.tolerance+'</span><span>Correct '+s.correct+'/'+s.required+' needed</span></div>'+
        box(s,'Parking lot',cells)+'<p class="mini-status" role="status">'+esc('Car '+squareName(s.player,s.w)+' '+heading[s.heading]+'. Bay '+squareName(s.goal,s.w)+' '+heading[s.goalHeading]+'. '+s.notice)+'</p>'+
        '<div class="mini-parking-controls">'+[['turn-left','Turn left'],['forward','Forward'],['turn-right','Turn right'],['reverse','Reverse']].map(([k,label])=>press(v,k,label,'mini-'+k)).join('')+'</div>';
    }
    function ordering(v){
      const s=v.board;
      return detail(s.label,s.prompt)+'<ul class="mini-clues">'+s.clues.map(c=>'<li>'+esc(c.text)+'</li>').join('')+'</ul>'+
        '<ol class="mini-plan" aria-label="Planned order">'+s.cards.map((_,i)=>'<li>'+esc(s.picked[i]===undefined?'Open slot':s.cards[s.picked[i]])+'</li>').join('')+'</ol>'+
        '<div class="mini-stack" role="group" aria-label="Cards">'+s.cards.map((label,i)=>press(v,'pick'+i,label,'',s.picked.includes(i)?' disabled':'')).join('')+'</div>'+
        '<div class="mini-segment">'+press(v,'undo','Undo','',''+(!s.picked.length?' disabled':''))+
        press(v,'submit','Submit plan','mini-submit',s.picked.length!==s.cards.length?' disabled':'')+'</div>';
    }
    function circuit(v){
      const s=v.board;
      return detail('Indicator panel','Make every light show a check. Each switch flips its own light and its neighbors above, below, left and right.')+
        '<div class="mini-hud"><span>'+(s.limit-s.used)+' moves left</span></div>'+
        '<div class="mini-circuit" role="group" aria-label="Indicator switches" style="--cols:'+s.w+'">'+
        Array.from({length:s.w*s.w},(_,i)=>{
          const on=!!(s.lamps&(1<<i));
          return press(v,'toggle'+i,on?'✓':'○',on?'mini-lit':'',' aria-label="Light '+(i+1)+', '+(on?'on':'off')+'"');
        }).join('')+'</div>';
    }
    function budget(v){
      const s=v.board;
      return detail('Shift plan','Include '+s.cards[s.required].title.toLowerCase()+' and reach '+s.target+' output points within the hours available.')+
        '<div class="mini-hud"><span>'+s.remaining+' of '+s.cap+' hours left</span><span>Output '+s.value+'/'+s.target+'</span></div>'+
        '<div class="mini-stack">'+s.cards.map(({title,cost,value},i)=>press(v,'pick'+i,title+' · '+cost+' h · '+value+' points',
          '', ' aria-pressed="'+s.selected.includes(i)+'"'+(!s.selected.includes(i)&&cost>s.remaining?' disabled':''))).join('')+'</div>'+
        '<div class="mini-segment">'+press(v,'submit','Submit plan','mini-submit',!s.selected.length?' disabled':'')+'</div>';
    }
    function training(v,p){
      const s=v.board,{move,dirs}=root.PocketMiniGrid;
      const cells=s.count.map((n,i)=>{
        const key=i===s.exit?'exit':s.checked.includes(i)?s.blocked.includes(i)?'prize':'cover':'floor';
        const glyph=i===s.exit?'⚑':key==='prize'?'×':key==='cover'?'✓':String(n);
        return tileMarkup(v,p,i,s.player,s.w,key,glyph,n+' blocked neighbors',true);
      });
      const reading='You are '+squareName(s.player,s.w)+'. '+s.count[s.player]+' blocked neighbors. '+s.notice;
      const actions=Object.keys(arrows).filter(dir=>move(s.player,dirs[dir],s.w,s.h)>=0);
      return '<div class="mini-hud"><span>'+(s.turns-s.used)+' moves left</span><span>'+s.probes+' probes</span></div>'+
        box(s,'Training route',cells)+'<p class="mini-status" role="status">'+esc(reading)+'</p>'+dirPad(v,actions)+
        (s.probes?'<div class="mini-segment" aria-label="Check a neighbor">'+actions.map(dir=>
          press(v,'probe-'+dir,'Probe '+arrows[dir],'',' aria-label="Probe '+dir+'"'+(s.checked.includes(move(s.player,dirs[dir],s.w,s.h))?' disabled':''))).join('')+'</div>':'');
    }
    function cueGroup(s){
      const first=s.index-s.index%3;
      return s.pattern.slice(first,first+3).map(i=>s.labels[i]).join(' · ');
    }
    function performance(v){
      const s=v.board,cue=s.labels[s.pattern[s.index]];
      const indicator=s.untimed?'<p class="mini-status">'+(s.index%3===0?'New cue group · '+esc(cueGroup(s)):'Recall the next cue. Pause for a reminder.')+'</p>':
        '<p class="mini-question" role="status">'+esc(cue)+'</p><div class="mini-track" aria-hidden="true" style="--cycle:'+s.cycle+'ms;--beat:'+s.offset/s.cycle*100+'%;--window:'+s.window*2/s.cycle*100+'%"><i></i><b></b></div><span id="mini-beat-status" class="mini-beat-status" role="status">'+(reduced()?'Get ready.':'')+'</span>';
      return '<div class="mini-hud"><span>Cue '+(s.index+1)+' of '+s.total+'</span><span>'+s.hits+' landed</span></div>'+
        indicator+'<div class="mini-segment mini-cue-buttons">'+s.labels.map((label,i)=>press(v,'hit'+i,label,'cue-'+i)).join('')+'</div>'+
        '<p class="mini-status" role="status">'+esc(s.notice)+'</p>';
    }
    function cardGame(v){
      return detail('Choose a color','The colors are equally likely. A match pays twice the stake in total.')+
        '<div class="mini-card-row">'+colors.map((label,i)=>press(v,'a'+i,label,'mini-card cue-'+i)).join('')+'</div>';
    }
    function content(l,s,exiting=false){
      const view=game.current(l),p=effective(s);if(!view)return '';
      const b=view.board;
      if(view.paused){
        if(exiting)return detail('End this attempt?',view.id==='escape'?'Leaving early extends the sentence.':
          view.id==='burglary'?'Leaving early forfeits your haul and sends the case to court.':
          view.id==='driving'?'Leaving early forfeits the attempt and any exam fee.':
          view.id==='cards'?'Leaving early forfeits your stake.':'Leaving early records an incomplete attempt.')+
          '<div class="mini-segment">'+press(view,'keep','Keep paused')+press(view,'exit','End attempt','mini-danger')+'</div>';
        return detail('Paused','Your completed moves are saved. A timed cue begins again when you resume.')+
          (b.type==='beats'&&b.untimed?detail('Cue reminder',cueGroup(b)):'')+
          '<div class="mini-segment">'+press(view,'resume','Resume','mini-submit')+(view.canRestart?press(view,'restart','Restart same board'):'')+
          press(view,'ask-exit','End attempt')+'</div>'+row('export-file','','Export paused game','Save your life and current challenge to a file.','archive');
      }
      const {type}=b;
      const body=type==='grid'?stealth(view,p):type==='driving'?parking(view):type==='ordering'?ordering(view):
        type==='training'?training(view,p):type==='beats'?performance(view):cardGame(view);
      return (p.assistance?'<details class="mini-rules"><summary>Instructions</summary><p>'+esc(b.type==='circuit'?careerRules.engineering:b.type==='budget'?careerRules.business:view.tutorial)+'</p></details>':'')+
        body+'<div class="mini-footer">'+press(view,'pause','Pause')+'</div>';
    }
    function play(l,s,exiting){
      const v=game.current(l);
      return v?{title:v.title,tag:v.level,body:'<div id="mini-game-content">'+content(l,s,exiting)+'</div>'}:null;
    }
    function stop(){
      for(const id of alarms)root.clearTimeout(id);
      alarms=[];clock=null;
    }
    function time(){return root.performance?.now?.()??Date.now();}
    function arm(l,onInput){
      stop();
      const view=game.current(l),b=view?.board;if(!b||view.paused||b.type!=='beats'||b.untimed||typeof root.setTimeout!=='function')return;
      clock={start:time(),turn:view.num,cycle:b.cycle,offset:b.offset};
      alarms.push(root.setTimeout(()=>onInput(view.num,'miss'),b.cycle+20));
      if(reduced()){
        const status=root.document.getElementById('mini-beat-status');
        if(status){
          alarms.push(root.setTimeout(()=>{status.textContent='Tap now';},b.offset-b.window));
          alarms.push(root.setTimeout(()=>{status.textContent='Cue closed';},b.offset+b.window));
        }
      }
    }
    function timed(command,turn){
      if(!command.startsWith('hit')||!clock||clock.turn!==turn)return command;
      const elapsed=time()-clock.start;
      if(elapsed>clock.cycle)return 'miss';
      return command+'@'+Math.max(-clock.offset/10,Math.round((elapsed-clock.offset)/10));
    }
    function feedback(s,cmd,type){
      const selected=settings(s);
      if(selected.haptics&&type==='grid'&&Object.hasOwn(arrows,cmd)&&typeof root.navigator?.vibrate==='function')try{root.navigator.vibrate(12);}catch{}
      if(!selected.sound||type!=='beats'||!/^hit[0-2]/.test(cmd))return;
      const Audio=root.AudioContext||root.webkitAudioContext;
      if(!Audio)return;
      try{
        if(!audio)audio=new Audio();
        if(audio.state==='suspended')audio.resume().catch(()=>{});
        const tone=audio.createOscillator(),mix=audio.createGain(),at=audio.currentTime;
        tone.type='sine';tone.frequency.value=[262,330,392][Number(cmd[3])];
        mix.gain.setValueAtTime(.12,at);mix.gain.exponentialRampToValueAtTime(.001,at+.18);
        tone.connect(mix);mix.connect(audio.destination);tone.start();tone.stop(at+.2);
      }catch{}
    }
    return {options,directory,warrantLink,warrant,preferences,preference,effective,intro,play,content,stop,arm,timed,feedback};
  }
  root.PocketMinigameUI={create};
})(window);
