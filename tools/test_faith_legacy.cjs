'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../app/src/main/assets');
const E=require(path.join(base,'engine.js')).PocketEngine;
const L=E.faithLegacy,P=E.faithPersonal,M=E.faithMovements;
const Saves=require(path.join(base,'save.js')).PocketSaves;
function life(seed=923){
  const l=E.makeLife({seed,birthYear:1920,town:'kyoto',name:'Ren Kato',faithId:'unaffiliated'});l.age=35;l.cash=70000;
  l.event={id:null,resolved:true};l.sim.review=null;return l;
}
function found(l,governance){
  const result=E.faithPerform(l,{group:'found',payload:{...M.defaultDraft(),name:'Courtyard Fellowship',governance}});
  assert(result);return M.get(l,result.movementId);
}
function cmd(l,group,id){return E.faithPerform(l,{group:'legacy',payload:{movementId:group},id});}
function adultChild(l,affiliation){
  assert(E.world.adopt(l,'Ari'));
  const p=l.people.kid1;p.bornAt=l.age-21;p.bornYear=l.born+p.bornAt;
  p.faith={...P.npc(l,p),id:affiliation,devotion:71};
  return p;
}
const l=life(),m=found(l,'central'),p=adultChild(l,m.id);
assert.equal(m.original.governance,'central');
assert(cmd(l,'family','begin/reading'));assert(cmd(l,'family','observe/custom-reading'));
assert.equal(cmd(l,'family','observe/custom-reading'),null);
assert(cmd(l,'family','adapt/custom-reading'));assert.equal(cmd(l,'family','adapt/custom-reading'),null);
assert(cmd(l,m.id,'nominate/'+p.id));assert.equal(m.successorId,p.id);
const records=E.historyDynasty.actions(l).filter(x=>x.id.startsWith('record/'));
assert(records.some(x=>x.title.includes('founding charter')));
assert(E.historyDynasty.perform(l,records.find(x=>x.title.includes('founding charter')).id));
assert.equal(E.historyDynasty.items(l).at(-1).town,'kyoto');
const total=M.followers(m);l.ended=true;L.annual(l);
assert.equal(m.leaderId,p.id);assert.equal(m.successorId,null);assert.equal(M.followers(m),total);
const stamp=JSON.stringify(m.history);L.annual(l);assert.equal(JSON.stringify(m.history),stamp);
const child=E.continueAs(l,'kid1');assert(child);
const inherited=M.get(child,m.id);assert.equal(inherited.leaderId,child.id);assert.equal(child.sim.faith.id,m.id);
assert.notEqual(inherited,m);assert.equal(child.sim.faithLegacy.customs[0].generations,2);
assert.equal(inherited.original.founderId,l.id);
const game={active:l,archive:[],settings:{motion:'system'}};assert(E.startNext(game,child));
assert.match(game.archive[0].faithLegacy.movements.join(' '),/Courtyard Fellowship/);
assert.match(L.describe(game.archive[0]).memories.join(' '),/succession|appoint|Ari/i);
assert(E.historyDynasty.items(child).some(item=>item.title===m.name+' founding charter'));
const store=new Map(),disk=Saves.open({getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},E,'faith');
const backup=disk.exportFile(game),loaded=disk.inspectFile(backup);assert(loaded);assert.deepEqual(E.encodeGame(loaded),E.encodeGame(game));
assert(cmd(child,'family','retire/custom-reading'));assert.equal(cmd(child,'family','begin/reading'),null);child.age++;assert(cmd(child,'family','begin/reading'));
assert.equal(child.sim.faithLegacy.customs.length,1);assert.equal(child.sim.faithLegacy.customs[0].revivals,1);
assert(cmd(child,m.id,'step-down'));assert.notEqual(inherited.leaderId,child.id);
const other=life(),org=found(other,'hereditary'),heir=adultChild(other,'agnostic');
assert.equal(cmd(other,org.id,'nominate/'+heir.id),null);
other.ended=true;const notForced=E.continueAs(other,'kid1');
assert.equal(notForced.sim.faith.id,'agnostic');assert.notEqual(M.get(notForced,org.id).leaderId,heir.id);
// Elections continue while families change active characters. Old regional delegates
// remain in the registry if beyond the active contact list; their office still expires.
for(const type of ['central','council','elected','hereditary','local']){
  const player=life(200),movement=found(player,type);movement.regions[movement.originRegion].followers=60;
  const actor=adultChild(player,movement.id);
  assert(cmd(player,movement.id,'nominate/'+actor.id));
  const oldId=movement.leaderId;player.ended=true;L.annual(player);
  assert(movement.leaderId&&movement.leaderId!==oldId,type+' transfers control');
  if(type==='central'||type==='hereditary')assert.equal(movement.leaderId,actor.id);
  const office=L.leadership(player,movement.id);assert(office.office&&office.leader);
  assert(movement.history.some(h=>h.kind==='succession'));
  const next=E.continueAs(player,'kid1');const continued=M.get(next,movement.id);
  const count=continued.history.filter(h=>h.kind==='succession').length;
  assert.equal(count,1,type+' changes leader once');
  assert.equal(continued.regions[movement.originRegion].followers,60);
}
console.log('PASS household customs, independent heir beliefs, five governance models, nomination, vacancy, museum charters, archives and backup round trips.');
// An endowed local congregation persists independently of the founder and the heir's belief.
let historical=E.makeLife({seed:3,birthYear:1200,town:'kyoto',faithId:'unaffiliated'}),orgId='',lineChanges=0;
const centuries={active:historical,archive:[],settings:{}};
function resolve(l){
  while(E.blocking(l)){
    if(l.sim.review)E.acknowledge(l);
    else if(l.sim.court)E.sim.court(l,'plea');
    else E.decide(l,0);
  }
}
while(E.calendar(historical)<1700){
  resolve(historical);
  if(!orgId&&historical.age>=20){
    const local=found(historical,'local');orgId=local.id;
    local.regions[local.originRegion].followers=80;local.treasury=5000;
    assert(cmd(historical,'family','begin/meal'));
  }
  if(historical.age>=21&&E.sim.children(historical).length<2){
    historical.cash=Math.max(500,historical.cash);E.world.adopt(historical,'Kin '+lineChanges);
  }
  assert(E.advance(historical));
  if(historical.ended){
    const heirs=E.sim.children(historical).sort(([,a],[,b])=>Math.abs(E.model.ageOf(historical,a)-30)-Math.abs(E.model.ageOf(historical,b)-30));
    assert(heirs.length,'A natural succession is required at '+E.calendar(historical));
    const previous=historical,child=E.continueAs(previous,heirs[0][0]);
    assert(child);assert(E.startNext(centuries,child));historical=child;lineChanges++;
    if(orgId){
      const org=M.get(child,orgId);assert(org);assert.equal(org.original.governance,'local');
      assert(org.history.some(e=>e.kind==='found'));assert.notEqual(org.leaderId,previous.id);
      const tradition=child.sim.faithLegacy.customs.find(c=>c.kind==='meal');assert(tradition);assert(tradition.generations>1);
    }
  }
}
assert(lineChanges>5);assert(M.get(historical,orgId).history.some(h=>h.kind==='succession'));
const longSave=disk.exportFile(centuries);assert(disk.inspectFile(longSave));
console.log('PASS 500 birthdays, '+lineChanges+' natural successions, earlier founder/archive/charter preserved, '+Buffer.byteLength(longSave)+'-byte backup.');
