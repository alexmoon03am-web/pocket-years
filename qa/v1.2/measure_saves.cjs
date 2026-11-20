'use strict';
const {performance}=require('node:perf_hooks');
const path=require('node:path'),assert=require('node:assert/strict');
const assets=process.env.POCKET_ASSET_DIR||path.resolve(__dirname,'../../app/src/main/assets');
const saves=require(path.join(assets,'save.js')).PocketSaves;
const open=saves.open,times={exportFile:[],inspectFile:[],save:[],load:[]};
let largest={year:0,bytes:0,archive:0},checked=0;const t0=performance.now();
function time(label,fn){const a=performance.now();const result=fn();times[label].push(performance.now()-a);return result;}
saves.open=function(...args){
  const d=open(...args);
  return {...d,exportFile(game){
    const raw=time('exportFile',()=>d.exportFile(game));
    assert(time('save',()=>d.save(game)));
    const loaded=time('load',()=>d.load());
    assert.equal(loaded.active.id,game.active.id);
    assert.deepEqual(loaded.active.rng,game.active.rng);
    assert.equal(loaded.archive.length,game.archive.length);
    const size=Buffer.byteLength(raw);
    if(size>largest.bytes)largest={year:game.active.born+game.active.age,bytes:size,archive:game.archive.length};
    checked++;return raw;
  },inspectFile(raw){return time('inspectFile',()=>d.inspectFile(raw));}};
};
require('../../tools/test_historical_continuity.cjs');
const metrics={};
for(const [name,s] of Object.entries(times)){
  s.sort((a,b)=>a-b);
  const q=p=>Math.round(s[Math.ceil(p*s.length)-1]*100)/100;
  metrics[name]={p50ms:q(.5),p95ms:q(.95),maxms:q(1),count:s.length};
}
const summary={checks:checked,largest,seconds:Math.round((performance.now()-t0)/10)/100,metrics};
console.log(JSON.stringify(summary));
