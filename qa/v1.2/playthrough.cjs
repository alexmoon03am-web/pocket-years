'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {start,base}=require('../../tools/interface_host.cjs');
const E=require(path.join(base,'engine.js')).PocketEngine;
const K='studio.pocketyears.save.v1';
const seed=1013904226;
const newborn=E.makeLife({seed,birthYear:1492,town:'london',name:'Rowan Vale',realism:'guided'});
const g={active:newborn,archive:[],settings:{motion:'reduced'}};
const store=new Map([[K,JSON.stringify(E.encodeGame(g))]]);
let ui=start(store,{asyncBack:true});
const read=()=>E.decodeGame(ui.state()).active;
const note=(...x)=>console.log(E.calendar(read()),'age',read().age,...x);
let clicks=0,events=0,purchases=0,work=0,adoptions=0;
const click=(ac,k)=>{ui.click(ac,k);clicks++;ui.flushBack();ui.tick();};
const tab=id=>{if(!ui.button('tab',id)&&['career','school'].includes(id))click('occupation');click('tab',id);};
function decide(){
  while(E.blocking(read())){
    if(ui.button('choose')){const choices=ui.visible().querySelectorAll('button[data-do="choose"]');const pick=choices[Math.floor(choices.length/2)];click('choose',pick.dataset.key);events++;}
    else if(ui.button('ack'))click('ack',ui.button('ack').dataset.key);
    else if(ui.button('plea','plea'))click('plea','plea');
    else throw Error(ui.visible().textContent.slice(0,300));
  }
}
function histAction(group,filter=()=>true){
  const buttons=ui.visible().querySelectorAll('button[data-do="sheet"]');
  const b=buttons.find(b=>!b.disabled&&b.dataset.key.startsWith('hist-review~'+group+'~')&&filter(b.dataset.key));
  if(!b)return false;
  click('sheet',b.dataset.key);
  const label=ui.el('sheet-title').textContent;
  click('hist-run',b.dataset.key);note(label);
  return true;
}
let modeShown=false;
function clickVisible(l){
  if(l.age===0){
    click('sheet','menu');click('sheet','realism');
    assert(ui.visible().textContent.includes('Access to care'));click('set-realism','historical');click('set-realism','guided');click('close');
    modeShown=true;note('read health context and toggled both modes');
  }
  if(l.age===5){tab('school');histAction('school');}
  if(l.age===10){tab('people');if(ui.button('visit-all')&&!ui.button('visit-all').disabled){click('visit-all');note('spent time with everyone');}}
  if(l.age===15){tab('journal');click('sheet','hist-archive');click('sheet','hist-capsule~current');assert(ui.visible().textContent.includes('Time Capsule'));click('close');}
  if(l.age>=18&&!l.job&&l.age<30){
    tab('career');if(histAction('work',key=>key.includes('job-era-')))work++;
  }
  if(l.age>=23&&l.age<42&&purchases===0&&l.cash>0){
    tab('assets');click('sheet','hist-market');if(histAction('market'))purchases++;else click('close');
  }
  if(l.age>=24&&l.age<=55&&((!E.sim.children(l).length)||(l.age%12===0))&&l.cash>=500){
    tab('people');if(ui.button('sheet','adopt')&&!ui.button('sheet','adopt').disabled){
      click('sheet','adopt');ui.el('child-name').value='Reed '+l.age;ui.submit('child-form');ui.flushBack();ui.tick();adoptions++;
      assert(E.sim.children(read()).length>E.sim.children(l).length);
      note('adopted',E.sim.children(read()).at(-1)[1].name);
    }
  }
}
while(!read().ended){
  decide();const age=read().age;
  clickVisible(read());
  if(ui.button('close'))click('close');
  tab('life');click('central');assert.equal(read().age,age+1);
  if(read().age===8)assert.equal(ui.doc.documentElement.dataset.theme,'renaissance');
  if(read().age===27){const snapshot=ui.state();ui=start(store,{asyncBack:true});assert.deepEqual(ui.state(),snapshot);note('closed and restored saved life');}
}
const ended=read();
note('death',ended.sim.cause,'cash',ended.cash,'children',E.sim.children(ended).length);
assert(modeShown&&work>0&&purchases>0&&adoptions>0);
const heirs=E.sim.children(ended).sort(([,a],[,b])=>E.model.ageOf(ended,b)-E.model.ageOf(ended,a));
assert(heirs.length);const [key,heir]=heirs[0];
click('sheet','legacy');click('sheet','heir-'+key);click('heir',key);
assert.equal(read().id,heir.id);assert.equal(E.calendar(read()),E.calendar(ended));
const c=read();note('continued as',c.name,'inherited bank',c.cash,'trust',c.sim.trust,'archive',ui.state().archive.length);
console.log(JSON.stringify({seed,clicks,events,purchases,work,adoptions,years:ended.age,largestStoredBytes:Buffer.byteLength(store.get(K))}));
