'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {E,base,game,grid,parkingPath}=require('../../tools/minigame_test_helpers.cjs');
const {PocketSaves}=require(path.join(base,'save.js'));
const G=E.minigames;
const disk=PocketSaves.open({getItem:()=>null,setItem(){}},E,'sweep');
const summary={birthdays:0,lives:0,validatedImports:0,challenges:{},panels:[]};
function settle(l){
  for(let i=0;E.blocking(l);i++){
    assert(i<12,'Blocked decision loop');
    const stage=E.blocking(l);
    if(stage==='decision')assert(E.decide(l,0));
    else if(stage==='court')assert(E.sim.court(l,'plea'));
    else if(stage==='outcome')assert(E.acknowledge(l));
    else throw Error('Unfinished challenge');
  }
}
function input(l,cmd){
  const r=G.input(l,G.revision(l),cmd);assert(r,cmd);
}
function walk(l,x,y){
  const b=G.current(l).board;
  for(const [start,end,neg,pos] of [[b.player%b.w,x,'left','right'],[Math.floor(b.player/b.w),y,'up','down']]){
    for(let n=start;n!==end;n+=Math.sign(end-n)){
      const d=end>n?pos:neg;
      for(let i=0;!G.current(l).board.actions.includes(d);i++){
        assert(i<4);input(l,'wait');
      }
      input(l,d);
    }
  }
}
function play(l){
  const b=G.current(l).board;
  if(b.type==='grid'){
    if((l.age+l.rng)%3===0){
      const roll=grid.rng(l.rng);
      while(G.active(l)){
        const s=G.current(l).board,available=s.actions.filter(a=>['up','left','down','right','take'].includes(a));
        input(l,available.length?available[roll(available.length)]:'wait');
      }
    }else{
      const p=b.burg?b.prizes[0].p:b.markers[0],x=p%b.w;
      walk(l,x,Math.floor(b.start/b.w));walk(l,x,Math.floor(p/b.w));
      if(b.burg)input(l,'take');
      walk(l,x,1);walk(l,b.exit%b.w,1);
    }
  }else if(b.type==='driving'){
    for(const q of b.exams)input(l,'a'+q.answers.findIndex(a=>a.ok));
    for(const cmd of parkingPath(G.current(l).board))input(l,cmd);
  }else if(b.type==='ordering'||b.type==='budget'){
    for(const i of b.solution)input(l,'pick'+i);
    input(l,'submit');
  }else if(b.type==='circuit'){
    for(const i of b.witness)if(G.active(l))input(l,'toggle'+i);
  }else if(b.type==='beats'){
    for(const i of b.pattern)input(l,'hit'+i);
  }else if(b.type==='cards')input(l,'a'+l.age%3);
  else throw Error(b.type);
}
for(const [birthYear,town] of [[1240,'london'],[2001,'cedar'],[2450,'kyoto']]){
  for(const enabled of [true,false]){
    const panel={birthYear,town,enabled,lives:0,birthdays:0,attempts:0};
    for(let seed=1;seed<=32;seed++){
      let l=E.makeLife({seed,birthYear,town});
      assert.equal(l.town,town);
      while(!l.ended){
        settle(l);
        if(l.age>=18&&!l.job&&!l.sim.prison&&!G.wanted(l)&&!l.sim.program){
          if(E.isHistorical(l)){
            const offer=E.historyEconomy.actions(l,'work').find(a=>a.id.startsWith('job-')&&!a.reason);
            if(offer)E.historyPerform(l,'work',offer.id);
          }else if(!E.world.jobReason(l,'barista'))E.world.hire(l,'barista');
        }
        const cycle=['career','burglary','historical','sport','music','cards'];
        const eligible=G.entries(l).filter(e=>!e.reason).map(e=>e.id);
        const next=(eligible.includes('driving')?'driving':eligible.includes('escape')?'escape':cycle[l.age%cycle.length]);
        if(eligible.includes(next)&&l.age<82){
          const wins=l.sim.minigames?.records[next]?.wins||0;
          const r=G.start(l,next,{enabled,timing:'untimed'},G.revision(l));
          assert(r);
          if(G.active(l)){
            if(l.age%11===0){
              input(l,'pause');
              const saved=disk.inspectFile(disk.exportFile(game(l)));
              assert(saved&&G.active(saved.active).paused);l=saved.active;
              summary.validatedImports++;
              input(l,'resume');
            }
            play(l);
          }
          assert(!G.active(l));
          const results=l.sim.minigames.records[next],last=summary.challenges[next]||(summary.challenges[next]={attempts:0,wins:0});
          const prior=l.log.at(-1);
          assert(prior.delta&&Number.isSafeInteger(l.cash)&&l.cash>=0);
          last.attempts++;panel.attempts++;
          last.wins+=results.wins-wins;
          settle(l);
          assert(G.start(l,next,{enabled},G.revision(l))===null,'Reused a yearly attempt');
        }
        G.validate(l);
        assert(E.advance(l));
        panel.birthdays++;
      }
      panel.lives++;
    }
    summary.lives+=panel.lives;summary.birthdays+=panel.birthdays;
    summary.panels.push(panel);
  }
}
console.log(JSON.stringify(summary,null,2));
