'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,base}=require('./interface_host.cjs'),E=require(path.join(base,'engine.js')).PocketEngine,X=E.expansion;
const K='studio.pocketyears.save.v1',W=E.world;
function memory(){
  const l=E.makeLife({seed:835,name:'Ari Lake',town:'cedar'});Object.assign(l,{age:34,job:'analyst',cash:850000,track:'work'});
  l.sim.license=true;l.stats.smarts=90;l.world.performance=77;E.year.workplace(l);E.year.campus(l);
  return new Map([[K,JSON.stringify(E.encodeGame({active:l,archive:[],settings:{motion:'system'}}))]]);
}
const internal=u=>E.decodeGame(u.state()).active;
function hit(u,act,key){u.click(act,key);u.flushBack();u.tick();}
const sheet=(u,k)=>hit(u,'sheet',k),tab=(u,k)=>hit(u,'tab',k);
const close=u=>hit(u,'close'),txt=u=>u.visible().textContent;
function icons(u){
  for(const b of u.visible().querySelectorAll('button[data-do]')){
    const icon=b.querySelector('img'),src=icon&&icon.getAttribute('src');assert(src,'Missing icon '+b.textContent);
    assert(src.startsWith('data:image/png;')||fs.existsSync(path.join(base,src)),src);
  }
}
let u=start(memory(),{asyncBack:true});
tab(u,'assets');sheet(u,'dealerships');sheet(u,'store-velo');
const car=W.shopping.inventory(internal(u),'velo')[0];sheet(u,'buy-'+car.id);sheet(u,'xp-offer~'+car.id);icons(u);
const cash=internal(u).cash;sheet(u,'xp-confirm~offer~'+car.id+'~finance');assert.equal(internal(u).cash,cash);
const prior=u.button('xp-confirm','finance');hit(u,'xp-confirm','finance');u.dispatch(prior);u.tick();
assert.equal(internal(u).cash,cash-Math.ceil(car.price*.2));assert(internal(u).world.owned[car.id]);
sheet(u,'sell-'+car.id);sheet(u,'xp-asset~'+car.id);icons(u);hit(u,'xp-run','cover');assert(internal(u).world.owned[car.id].insured);
sheet(u,'xp-bills');assert(txt(u).includes('Insurance'));hit(u,'xp-run','auto');assert(!internal(u).sim.expansion.policies.autopay);
sheet(u,'xp-portfolio');hit(u,'xp-run','buy-industry');assert.equal(internal(u).sim.expansion.portfolio.industry,10);
hit(u,'asset-sort','name');sheet(u,'xp-business');sheet(u,'xp-confirm~business~~open-studio');
assert.equal(X.companyValue(internal(u)),0);hit(u,'xp-confirm','open-studio');const id=Object.keys(internal(u).sim.expansion.companies)[0];
sheet(u,'xp-business');sheet(u,'xp-company~'+id);icons(u);assert(txt(u).includes('Annual forecast'));hit(u,'xp-run','clients');
assert.equal(internal(u).sim.expansion.companies[id].clients,1);
tab(u,'people');sheet(u,'xp-family');icons(u);assert(txt(u).includes('Grandparent'));sheet(u,'person-carer');sheet(u,'xp-relative~carer');hit(u,'xp-run','argue');
assert(internal(u).people.carer.rivalry);sheet(u,'xp-family');sheet(u,'person-carer');sheet(u,'xp-relative~carer');hit(u,'xp-run','reconcile');assert(!internal(u).people.carer.rivalry);
const who=internal(u),me=who.id,carer=who.people.carer.id;
sheet(u,'xp-family');sheet(u,'xp-branch~'+me);sheet(u,'xp-branch~'+carer);
assert(txt(u).includes('Children')&&txt(u).includes('Family memories'));sheet(u,'xp-branch~'+me);assert(txt(u).includes('Ari Lake'));close(u);
hit(u,'occupation');tab(u,'career');sheet(u,'xp-career');icons(u);hit(u,'xp-run','cert');assert(internal(u).sim.expansion.certs.includes('Technology'));
sheet(u,'xp-career');hit(u,'xp-run','assignment');assert(internal(u).sim.lifeTags.includes('reference-release'));
tab(u,'activities');sheet(u,'xp-hobbies');icons(u);hit(u,'xp-run','running');assert(internal(u).sim.expansion.hobbies.running);
sheet(u,'xp-world');icons(u);assert(txt(u).includes('unemployment'));close(u);
sheet(u,'hub-travel');sheet(u,'destinations');u.change('country','JP');u.change('town','kyoto');sheet(u,'move-kyoto');sheet(u,'xp-visa~kyoto');icons(u);
assert(txt(u).includes('Settlement route'));hit(u,'xp-run','work');assert(internal(u).sim.expansion.permits.JP);
console.log('PASS shipped expansion menus, complete icon sets, financing confirmation and double tap, asset management, formation and contracts, family profiles, careers, hobbies, local world and immigration.');

let desired='',exported='',pickCount=0,consumed=0;
const bridge={pending:()=>desired,consumed:()=>{desired='';consumed++;},exportFile:s=>exported=s,importFile:()=>pickCount++};
u=start(memory(),{fileBridge:bridge,asyncBack:true});sheet(u,'checkpoint');hit(u,'export-file');assert.equal(JSON.parse(exported).game.active.firstName,'Ari');
hit(u,'manual-save');sheet(u,'save-slots');hit(u,'slot','2');assert.equal(u.state().active.age,0);assert.equal(u.store.get(K+'.selected'),'2');
sheet(u,'checkpoint');sheet(u,'file-import');hit(u,'pick-file');assert.equal(pickCount,1);
desired=exported;u.nativeReady();assert(txt(u).includes('Ari Lake')&&txt(u).includes('Age 34'));
const before=u.store.get(K+'.slot.2');close(u);assert.equal(u.store.get(K+'.slot.2'),before);assert.equal(desired,'');
desired=exported;u.nativeReady();hit(u,'import-file');assert.equal(u.state().active.firstName,'Ari');assert.equal(u.state().active.age,34);assert(consumed>=2);
desired='malformed';u.nativeReady();assert(!u.button('import-file'));assert(txt(u).includes('could not be read'));assert.equal(u.state().active.firstName,'Ari');close(u);
sheet(u,'checkpoint');sheet(u,'recover-confirm');hit(u,'save-recover');assert.equal(u.state().active.age,0);
sheet(u,'checkpoint');sheet(u,'save-slots');hit(u,'slot','1');assert.equal(u.state().active.firstName,'Ari');
assert(u.store.get(K+'.manual'));assert(!u.store.get(K+'.slot.2.manual'));
let downloaded,revoked=false;
const files={Blob:class {constructor(parts){this.data=parts.join('');}},URL:{createObjectURL(blob){downloaded=blob.data;return 'blob:test';},revokeObjectURL(){revoked=true;}},
  FileReader:class {readAsText(file){this.result=file.text;this.onload();}},setTimeout:f=>f()};
const html=fs.readFileSync(process.env.POCKET_PREVIEW||path.join(__dirname,'../build/Pocket-Years-Play.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);assert.equal(scripts.length,22);
let fileName='';const web=start(memory(),{scripts,browserFiles:files,download:(url,name)=>{assert.equal(url,'blob:test');fileName=name;}});
sheet(web,'checkpoint');hit(web,'export-file');assert.equal(fileName,'Pocket-Years-backup.json');assert(revoked);assert(JSON.parse(downloaded).checksum);
sheet(web,'file-import');web.chooseFile({size:downloaded.length,text:downloaded});assert(txt(web).includes('Restore imported life'));hit(web,'import-file');
assert.equal(web.state().active.age,34);tab(web,'activities');sheet(web,'xp-world');icons(web);
console.log('PASS character slots, original-slot manual save, native chooser bridge, import preview and cancellation, damaged file rejection, recovery and standalone HTML file export/import.');
