'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const dir=process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets');
const E=require(path.join(dir,'engine.js')).PocketEngine,F=E.faithMovements;
const C=require(path.join(dir,'faith-catalog.js')).PocketFaithCatalog;
const G=require(path.join(dir,'geography.js')).PocketGeography;
assert.equal(new Set(C.traditions.map(t=>t.id)).size,C.traditions.length);
for(const tradition of C.traditions){
  const id=tradition.id;
  for(const key of ['founder','symbol','origin','summary','institution'])assert(tradition[key]?.trim(),id+' '+key);
  assert(tradition.holidays.every(h=>h.name&&h.calendar&&h.timing)&&tradition.holidays.length,id+' holiday');
  for(const group of [tradition.rites,tradition.roles]){
    assert(group.length>=3,id);
    assert.equal(new Set(group.map(r=>r.id)).size,group.length,id);
    assert(group.every(r=>r.kind&&r.name&&r.description),id);
  }
  if(!tradition.secular&&!tradition.fictional)assert(tradition.sources.length,id+' source');
  assert(tradition.sources.every(url=>new URL(url).protocol==='https:'),id+' sources');
  assert(C.available(id,tradition.start),id);
  assert(!C.available(id,tradition.start-1),id);
  const life=E.makeLife({seed:8,town:'london',birthYear:Math.max(1200,tradition.start),faithId:id});
  assert.equal(life.sim.faith.id,id);
}
assert.notEqual(C.get('lutheran').founder,C.get('anglican').founder);
assert.match(C.get('orbital-commons').founder,/fictional/i);
assert.match(C.get('unaffiliated').symbol,/no shared/i);
const mexico=G.countryList.find(c=>c.code==='MX').cities[0].id;
assert(!C.local('catholic',mexico,1200)&&C.local('catholic',mexico,1600));
assert(!C.options(1200,'london').some(t=>t.id==='protestant'));
const clone=value=>JSON.parse(JSON.stringify(value));
function found(l,overrides={}){
  const out=E.faithPerform(l,{group:'found',payload:{...F.defaultDraft(),name:'Community of the Wells',...overrides}});
  assert(out);return F.get(l,out.movementId);
}
function outreach(l,m,op,payload){return E.faithPerform(l,{group:'movement',id:m.id+'/'+op,payload});}
function localTick(l){
  l.age++;l.used=[];F.annual(l,{});E.faithLegacy.annual(l,{});
}
let refused=0,accepted=0,extinct=0;
for(let seed=1;seed<=45;seed++){
  const l=E.makeLife({seed,birthYear:1250,town:'london'});l.age=26;
  const m=found(l),before=F.followers(m);
  if(before===1){
    const orphaned=clone(l);orphaned.ended=true;
    localTick(orphaned);localTick(orphaned);
    const old=F.get(orphaned,m.id);
    assert.equal(F.followers(old),0);assert.equal(old.leaderId,null);assert.equal(old.status,'dormant');extinct++;
  }
  assert(outreach(l,m,'gather'));
  if(F.followers(m)>before)accepted++;else refused++;
}
assert(accepted&&refused&&extinct);
const near=E.makeLife({seed:315,birthYear:1300,town:'london'});near.age=23;
const capped=found(near);capped.regions.europe.followers=180000;
assert(outreach(near,capped,'gather'));assert.equal(F.followers(capped),180000);
localTick(near);assert(F.followers(capped)<180000);
const city=E.makeLife({seed:43,birthYear:1640,town:'london'});city.age=25;
const org=found(city);org.regions.europe.followers=10000;
const elsewhere=clone(city),sister=F.get(elsewhere,org.id);sister.regions.europe.town='bristol';
localTick(city);localTick(elsewhere);
assert(F.followers(org)<F.followers(sister),'An otherwise identical regional group experiences the local Great Fire disruption');

// Follow one actual played family, using normal aging, conversion and succession.
// Cash for adoption keeps the genealogy fixture independent of the economy tests.
const founder=E.makeLife({seed:26084,birthYear:1200,town:'london',name:'Kit Spring',faithId:'exploring'});founder.age=20;
const movement=found(founder,{governance:'hereditary',sharing:'travel',teachings:'Help with common water works.'});
assert(F.followers(movement)<10);
const game={version:4,active:founder,archive:[],settings:{motion:'reduced'}};
function finishDecisions(l){
  while(E.blocking(l)){
    if(l.sim.review)assert(E.acknowledge(l));
    else if(l.sim.court)assert(E.sim.court(l,'plea'));
    else assert(E.decide(l,0));
  }
}
let ticks=0,succession=0,million=0,declines=0;
while(ticks<900){
  const l=game.active;finishDecisions(l);
  const m=F.get(l,movement.id);assert(m);
  if(l.ended){
    const heirs=E.sim.children(l).sort((a,b)=>Math.abs(E.sim.ageOf(l,a[1])-25)-Math.abs(E.sim.ageOf(l,b[1])-25));
    assert(heirs.length);const next=E.continueAs(l,heirs[0][0]);assert(next);assert(E.startNext(game,next));succession++;continue;
  }
  if(l.age>=20&&E.sim.children(l).length<3){l.cash=Math.max(l.cash,100000);E.world.adopt(l,'Heiress '+succession);}
  if(l.age>=12){
    if(l.sim.faith.id!==m.id)E.faithPerform(l,{group:'belief',id:'join-'+m.id});
    if(l.sim.faith.id===m.id){
      for(const op of ['gather','service','revival','assembly'])outreach(l,m,op);
      if(ticks%6===0)outreach(l,m,'book',{title:'Annual letters '+ticks});
      for(const [op,interval] of [['teacher',4],['visit',9]])if(ticks%interval===0){
        const available=F.actions(l,'movement').find(a=>a.id===m.id+'/'+op&&!a.reason);
        if(available){
          const destinations=available.fields[0].choices;
          outreach(l,m,op,{region:destinations[Math.floor(ticks/interval)%destinations.length].id});
        }
      }
    }
  }
  const before=F.followers(m);
  assert(E.advance(l));ticks++;
  const after=F.followers(m);
  if(after<before)declines++;
  if(!million&&after>=1000000)million=ticks;
}
assert(million>0&&succession>10&&declines>0);
const surviving=F.get(game.active,movement.id);
assert.equal(F.regional(game.active,movement.id).filter(r=>r.followers>0).length,9);
assert.equal(surviving.original.founderId,founder.id);
console.log('PASS membership refusal, extinction, saturation and regional disruption. Million-member milestone after '+million+' years, '+succession+' successions and '+declines+' declining years in 900 birthdays.');
