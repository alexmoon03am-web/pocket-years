/* Turn-based tile games. Layouts use abstract arcade rules and a reserved, playable perimeter. */
(function(root){
  'use strict';
  const dirs={up:[0,-1],left:[-1,0],down:[0,1],right:[1,0]};
  function rng(seed){
    let value=seed>>>0;
    return size=>{
      value=(value+0x6d2b79f5)>>>0;
      let bits=Math.imul(value^(value>>>15),value|1);
      bits^=bits+Math.imul(bits^(bits>>>7),bits|61);
      return ((bits^(bits>>>14))>>>0)%size;
    };
  }
  function shuffle(items,draw){
    const copy=items.slice();
    for(let i=copy.length-1;i>0;i--){const j=draw(i+1);[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }
  const xy=(p,w)=>[p%w,Math.floor(p/w)];
  function distance(a,b,w){
    const [x,y]=xy(a,w),[u,v]=xy(b,w);
    return Math.abs(x-u)+Math.abs(y-v);
  }
  function move(p,d,w,h){
    const [x,y]=xy(p,w),[dx,dy]=d;
    const a=x+dx,b=y+dy;
    return a>=0&&a<w&&b>=0&&b<h?b*w+a:-1;
  }
  function create(run){
    const draw=rng(run.seed),burg=run.id==='burglary',pressure=run.level;
    const w=pressure>=3?11:9,h=9,top=1,bottom=h-2,left=1,right=w-2;
    const at=(x,y)=>y*w+x;
    const start=at(2+draw(w-4),bottom),exit=at(2+draw(w-4),top),side=draw(2)?left:right;
    const floor=new Array(w*h).fill(false);
    for(let y=top;y<=bottom;y++){
      for(let x=left;x<=right;x++){
        floor[at(x,y)]=x===left||x===right||y===top||y===bottom||y===4||x===Math.floor(w/2)||draw(100)>27;
      }
    }
    const cover=[at(left,3),at(right,5),at(2,bottom-1),at(w-3,top+1)];
    const markers=burg?[]:[at(side,top+1+draw(2)),at(Math.floor(w/2),4)];
    const prizes=burg?[
      {p:at(side,3+draw(2)),value:1,bulk:1},
      {p:at(side===left?right:left,3+draw(2)),value:2,bulk:1},
      {p:at(Math.floor(w/2),4),value:4,bulk:2},
      {p:at(w-4,5),value:5,bulk:2}
    ]:[];
    const patrols=[];
    for(const [x,y] of [[3,2],[w-4,4],[3,5]].slice(0,pressure>=3?3:pressure>=1?2:1)){
      const route=[at(x,y),at(x+1,y),at(x+1,y+1),at(x,y+1)];
      for(const p of route)floor[p]=true;
      const startAt=draw(route.length);
      patrols.push({route,offset:startAt});
    }
    const alarm=burg?prizes.filter(p=>p.value>=4).map(p=>p.p):[];
    for(const p of cover.concat(markers,prizes.map(v=>v.p)))floor[p]=true;
    const lateral=x=>Math.abs(xy(start,w)[0]-x)+Math.abs(xy(exit,w)[0]-x);
    const period=pressure>=3?4:3;
    const doors=[left,right].map(x=>({p:at(x,4),phase:draw(period),period}));
    if(pressure>=3)doors.push({p:exit,phase:draw(3),period:3});
    const turns=13+Math.max(lateral(left),lateral(right))+(burg?2:0)+(run.skill>=70?3:0)+(4-pressure)*2;
    return {type:'grid',w,h,floor,start,exit,cover,markers,prizes,alarm,doors,patrols,
      guards:patrols.map(a=>a.route[a.offset]),player:start,alert:0,distracted:0,decoys:1+(run.skill>=65?1:0),
      used:0,turns,card:false,carried:0,capacity:run.skill>=75?4:3,picked:[],burg,pressure,notice:'Find the marked exit.',result:null};
  }
  function nearby(state,guard,p){
    const [x,y]=xy(guard,state.w),[a,b]=xy(p,state.w);
    const d=distance(guard,p,state.w);
    if(d===0)return true;
    if(d===1)return true;
    if((x===a||y===b)&&d===2)return state.floor[(guard+p)/2];
    return false;
  }
  function guardStep(state,i,p,pursue){
    const {w,h,floor,patrols,guards}=state,from=guards[i],route=patrols[i].route;
    const neighbors=at=>Object.values(dirs).map(d=>move(at,d,w,h)).filter(q=>floor[q]);
    if(pursue&&distance(from,p,w)<=4){
      const initial=distance(from,p,w);
      const next=neighbors(from).find(q=>distance(q,p,w)<initial);
      if(next!==undefined)return next;
    }
    const index=route.indexOf(from);
    if(index>=0)return route[(index+1)%route.length];
    // A sentry that left its circuit walks back through open tiles.
    const pending=neighbors(from).map(at=>[at,at]),seen=new Set([from]);
    for(let j=0;j<pending.length;j++){
      const [at,first]=pending[j];
      if(seen.has(at))continue;
      seen.add(at);
      if(route.includes(at))return first;
      for(const q of neighbors(at))if(!seen.has(q))pending.push([q,first]);
    }
    return from;
  }
  function open(gate,turn){return (gate.phase+turn)%gate.period<=1;}
  function inputs(s){
    if(s.result)return [];
    const actions=Object.keys(dirs).filter(direction=>{
      const tile=move(s.player,dirs[direction],s.w,s.h);
      return s.floor[tile]&&!s.doors.some(g=>g.p===tile&&!open(g,s.used));
    });
    actions.push('wait');
    if(s.cover.includes(s.player))actions.push('hide');
    if(s.decoys&&s.distracted===0)actions.push('decoy');
    const item=s.prizes.find(p=>p.p===s.player);
    if(item&&!s.picked.includes(item.p)&&s.carried+item.bulk<=s.capacity)actions.push('take');
    return actions;
  }
  function step(s,action){
    if(!inputs(s).includes(action))return null;
    const p=Object.hasOwn(dirs,action)?move(s.player,dirs[action],s.w,s.h):s.player;
    const card=s.card||s.markers.includes(p);
    let carried=s.carried,picked=s.picked,decoys=s.decoys,notice='Moved one turn.';
    let distracted=Math.max(0,s.distracted-1);
    if(action==='take'){
      const prize=s.prizes.find(item=>item.p===p);
      carried+=prize.bulk;picked=picked.concat(p);notice='Collected '+prize.value+' haul points.';
    }
    if(action==='decoy'){decoys--;distracted=2;notice='The arcade guards paused to inspect the decoy.';}
    if(action==='hide')notice='In cover. Alert fell.';
    if(!s.card&&card)notice='Exit marker collected.';
    if(p===s.exit&&!(s.burg?picked.length:card))notice=s.burg?'Collect at least one prize first.':'Collect an exit marker first.';
    const hidden=action==='hide'||s.cover.includes(p);
    const [px,py]=xy(p,s.w);
    const onRing=px===1||py===1||px===s.w-2||py===s.h-2;
    const active=distracted===0&&!hidden&&(!onRing||s.alert>=25);
    const seen=active&&s.guards.some(guard=>nearby(s,guard,p));
    const guards=s.guards.map((g,i)=>distracted?g:guardStep(s,i,p,seen&&s.alert>=25));
    const watched=active&&(seen||guards.some(g=>nearby(s,g,p)));
    const alarm=action==='take'&&s.alarm.includes(p);
    const alert=Math.max(0,Math.min(100,s.alert+(alarm?27+s.pressure*4:0)+(watched?25+s.pressure*6:action==='hide'?-38:-11)));
    const used=s.used+1;
    const caught=alert>=100||active&&guards.includes(p);
    const won=!caught&&p===s.exit&&(s.burg?picked.length>0:card);
    const haul=s.prizes.filter(item=>picked.includes(item.p)).reduce((a,item)=>a+item.value,0);
    const result=caught||won||used>=s.turns?{won,haul:won?haul:0,
      score:won?Math.max(45,Math.min(100,95+Math.floor((s.turns-used)/2)-Math.floor(alert/2))):0,
      reason:caught?'Captured':won?'Reached the exit':'Ran out of turns'}:null;
    if(watched&&!result)notice='A guard spotted you. Find cover or change your route.';
    return {...s,player:p,prev:s.player,used,alert,guards,distracted,decoys,carried,picked,card,notice,result};
  }
  function view(s){
    return {...s,doors:s.doors.map(g=>({...g,open:open(g,s.used)})),actions:inputs(s),haul:s.prizes.filter(item=>s.picked.includes(item.p)).reduce((sum,item)=>sum+item.value,0)};
  }
  root.PocketMiniGrid={create,step,view,rng,shuffle,move,dirs};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
