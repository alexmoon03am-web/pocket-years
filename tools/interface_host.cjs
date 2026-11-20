'use strict';
// Isolated component host. The HTML parser processes the exact strings rendered by the shipped scripts.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const cache=new Map(),base=path.resolve(process.env.POCKET_ASSET_DIR||path.join(__dirname,'../app/src/main/assets'));
function parse(html){
  if(!html)return ['root',{},'',[],''];
  if(cache.has(html))return cache.get(html);
  const p=spawnSync('python3',[path.join(__dirname,'fixtures/parse_interface.py')],{input:html,encoding:'utf8',maxBuffer:8e6});
  if(p.status)throw Error(p.stderr);const v=JSON.parse(p.stdout);cache.set(html,v);return v;
}
function start(store=new Map(),opts={}){
  const docEvents={},winEvents={},frames=new Map(),animations=new Set(),records=[],mediaWatch=[];
  let active=null,now=0,counter=0,scroll=0;
  class El{
    constructor(data=['div',{},'',[],''],parent=null){
      const [tag,attrs,txt,children,tail]=data;
      this.tag=tag;this.a={...attrs};this.parent=parent;this.txt=txt;this.tail=tail;this.children=children.map(c=>new El(c,this));this.style={};
      this.value=this.a.value||'';this.dataset=new Proxy({},{
        get:(_,k)=>this.a['data-'+String(k).replace(/[A-Z]/g,v=>'-'+v.toLowerCase())],
        set:(_,k,v)=>{this.a['data-'+String(k).replace(/[A-Z]/g,w=>'-'+w.toLowerCase())]=String(v);return true;}
      });
      if(tag==='select'){const sel=this.children.find(v=>Object.hasOwn(v.a,'selected'))||this.children[0];if(sel)this.value=sel.a.value;}
    }
    get disabled(){return Object.hasOwn(this.a,'disabled');}
    get hidden(){return Object.hasOwn(this.a,'hidden');}set hidden(v){v?this.a.hidden='':delete this.a.hidden;}
    get id(){return this.a.id||'';}
    get clientHeight(){return this.classList.contains('sheet')?340:48;}
    getAnimations(){return Array.from(animations).filter(a=>a.element===this);}
    get classList(){const get=()=>(this.a.class||'').split(/\s+/).filter(Boolean);
      return {contains:k=>get().includes(k),add:k=>this.a.class=[...new Set([...get(),k])].join(' '),remove:k=>this.a.class=get().filter(x=>x!==k).join(' ')};}
    set className(val){this.a.class=val;}
    set innerHTML(v){this.html=v;for(const c of this.children)c.parent=null;this.children=parse(v)[3].map(c=>new El(c,this));this.txt='';}
    get innerHTML(){return this.html||'';}
    get textContent(){return this.txt+this.children.map(c=>c.textContent+c.tail).join('');}
    set textContent(v){this.txt=String(v);this.children=[];}
    getAttribute(k){return Object.hasOwn(this.a,k)?this.a[k]:null;}setAttribute(k,v){this.a[k]=String(v);}removeAttribute(k){delete this.a[k];}
    appendChild(c){c.parent=this;this.children.push(c);return c;}remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}
    contains(e){return e===this||this.children.some(c=>c.contains(e));}
    click(){if(this.tag==="a"&&opts.download)opts.download(this.href,this.download);else dispatch(this);}
    focus(){active=this;}reportValidity(){return !!this.value.trim();}
    matches(s){
      if(s==='button:not(:disabled)')return this.tag==='button'&&!this.disabled;
      if(s.startsWith('#'))return this.id===s.slice(1);
      if(s.startsWith('.'))return this.classList.contains(s.slice(1));
      const tag=(s.match(/^[a-z][a-z0-9-]*/i)||[])[0];
      if(tag && tag!==this.tag)return false;
      const attrs=[...s.matchAll(/\[([\w-]+)(?:="([^"]+)")?\]/g)];
      return (!!tag||attrs.length>0)&&attrs.every(m=>Object.hasOwn(this.a,m[1])&&(m[2]===undefined||this.a[m[1]]===m[2]));
    }
    closest(s){return this.matches(s)?this:this.parent?this.parent.closest(s):null;}
    querySelectorAll(s){const found=[];for(const c of this.children){if(s.split(',').some(q=>c.matches(q.trim())))found.push(c);found.push(...c.querySelectorAll(s));}return found;}
    querySelector(s){return this.querySelectorAll(s)[0]||null;}
    animate(keys,options){
      const end=now+options.duration+(options.delay||0),callbacks={};
      const anim={end,element:this,done:false,addEventListener:(k,f)=>(callbacks[k]||=[]).push(f),
        finish:()=>complete('finish'),cancel:()=>complete('cancel')};
      function complete(k){if(anim.done)return;anim.done=true;animations.delete(anim);for(const f of callbacks[k]||[])f();}
      records.push({el:this,keys,options});animations.add(anim);return anim;
    }
  }
  const html=new El(['html',{},'',[],'']),body=new El(['body',{},'',[],''],html);html.appendChild(body);
  for(const id of ['shell','overlay','status'])body.appendChild(new El(['div',{id},'',[],'']));
  const doc={documentElement:html,body,get activeElement(){return active;},getElementById:id=>body.querySelector('#'+id),
    querySelector:s=>body.querySelector(s),createElement:tag=>new El([tag,{},'',[],'']),addEventListener:(k,f)=>docEvents[k]=f};
  const loc={hash:opts.hash||''},hist=[{url:loc.hash,state:null}],media={matches:!!opts.reduce,addEventListener:(type,fn)=>mediaWatch.push(fn)};
  let cursor=0,pending=null;
  function back(){
    if(cursor<=0)return;
    const move=()=>{cursor--;loc.hash=hist[cursor].url;winEvents.popstate();winEvents.hashchange();};
    if(opts.asyncBack)pending=move;else move();
  }
  const history={get state(){return hist[cursor].state;},replaceState:(state,_,url)=>{if(opts.noHistory)throw Error('restricted');hist[cursor]={url,state};loc.hash=url;},
    pushState:(state,_,url)=>{if(opts.noHistory)throw Error('restricted');hist.splice(cursor+1);hist.push({url,state});cursor++;loc.hash=url;},back};
  const ctx={document:doc,location:loc,history,matchMedia:()=>media,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
    requestAnimationFrame:f=>{const k=++counter;frames.set(k,f);return k;},cancelAnimationFrame:k=>frames.delete(k),scrollTo:(_x,y)=>scroll=y,addEventListener:(k,f)=>winEvents[k]=f,console};
  if(opts.fileBridge)ctx.PocketFiles=opts.fileBridge;
  if(opts.browserFiles)Object.assign(ctx,opts.browserFiles);
  ctx.window=ctx;vm.createContext(ctx);
  const files=Array.from(fs.readFileSync(path.join(base,'index.html'),'utf8').matchAll(/<script defer src="([^"]+)"><\/script>/g),m=>m[1]);
  const sources=opts.scripts||files.map(f=>fs.readFileSync(path.join(base,f),'utf8'));
  for(const s of sources)vm.runInContext(s,ctx);
  function flushBack(){const fn=pending;pending=null;if(fn)fn();}
  function tick(next=600){for(let i=0;i<next;i+=16){now+=16;const fns=[...frames.values()];frames.clear();fns.forEach(f=>f(now));for(const a of [...animations])if(a.end<=now)a.finish();}}
  function visible(){const mount=doc.getElementById('overlay').children.find(el=>!el.a.inert&&el.getAttribute('aria-hidden')!=='true');return mount||doc.getElementById('shell');}
  function button(ac,key){return visible().querySelectorAll('button[data-do]').find(b=>b.dataset.do===ac&&(key===undefined||b.dataset.key===String(key)));}
  function dispatch(target,detail=1){docEvents.click({target,detail});}
  function click(ac,key){const b=button(ac,key);assert(b,'missing button: '+ac+'/'+key+' '+visible().textContent.slice(0,110));assert(!b.disabled,'disabled button: '+ac+'/'+key);active=b;dispatch(b);}
  function change(id,value){const target=doc.getElementById(id);target.value=value;docEvents.change({target});}
  function input(id,value){const target=doc.getElementById(id);target.focus();target.value=value;docEvents.input({target});}
  function submit(id){docEvents.submit({target:doc.getElementById(id),preventDefault(){}});}
  function prefer(v){media.matches=v;mediaWatch.forEach(f=>f());}
  function pointer(type,target,y,time,id=1){docEvents[type]({target,pointerId:id,clientY:y,timeStamp:time,isPrimary:true,button:0});}
  return {click,button,dispatch,doc,store,loc,history,tick,flushBack,change,input,submit,prefer,pointer,records,visible,animations,frames,
    nativeReady:()=>ctx.pocketFileReady(),chooseFile:file=>{const el=doc.getElementById('backup-file');el.files=[file];docEvents.change({target:el});},
    state:()=>{const key='studio.pocketyears.save.v1',n=Number(store.get(key+'.selected')||1);return JSON.parse(store.get(n===1?key:key+'.slot.'+n));},el:id=>doc.getElementById(id),
    key:k=>docEvents.keydown({key:k,preventDefault(){}})};
}
module.exports={start,base};
