'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const base=path.resolve(process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets'));
const grid=require(path.join(base,'minigame-grid.js')).PocketMiniGrid;
const puzzles=require(path.join(base,'minigame-puzzles.js')).PocketMiniPuzzles;
const E=require(path.join(base,'engine.js')).PocketEngine;
const storageKey='studio.pocketyears.save.v1';
const game=(active,settings)=>({active,archive:[],settings:settings||{motion:'reduced'}});
function life(options={}){
  const l=E.makeLife({seed:options.seed??194,birthYear:options.born??2000,town:options.town??'london'});
  l.age=options.age??25;l.cash=options.cash??4000;
  if(options.job)E.world.changeJob(l,options.job,true);
  return l;
}
function parkingPath(board){
  assert(board.parking);
  const queue=[[board,[]]],seen=new Set();
  for(let i=0;i<queue.length;i++){
    const [s,route]=queue[i],key=s.player+'/'+s.heading;
    if(seen.has(key))continue;
    seen.add(key);
    for(const cmd of ['forward','reverse','turn-left','turn-right']){
      const next=puzzles.step(s,cmd),path=route.concat(cmd);
      if(next.faults!==s.faults)continue;
      if(next.result?.won)return path;
      if(!next.result)queue.push([next,path]);
    }
  }
  return null;
}
function takeExam(u,l=()=>E.decodeGame(u.state()).active){
  const current=()=>E.minigames.current(l());
  while(!current().board.parking){
    const b=current().board;
    u.click('mini-input','a'+b.exams[b.question].answers.findIndex(a=>a.ok));
  }
  const route=parkingPath(current().board);
  assert(route,'No parking path');
  for(const cmd of route)u.click('mini-input',cmd);
  assert(l().sim.license);
}
module.exports={E,base,grid,puzzles,storageKey,game,life,parkingPath,takeExam};
