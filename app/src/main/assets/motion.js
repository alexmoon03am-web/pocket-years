/* Motion never controls the simulation. State and hit targets update immediately. */
(function(root){
  'use strict';
  const ease='cubic-bezier(.18,.82,.25,1)';
  const media=typeof root.matchMedia==='function'?root.matchMedia('(prefers-reduced-motion: reduce)'):null;
  const counters=new Map(), active=new Set();
  let preference='system', reduced=true;
  function finishCounters(){
    for(const [el,c] of counters){root.cancelAnimationFrame(c.frame);el.textContent=c.format(c.target);}
    counters.clear();
  }
  function sync(){
    reduced=preference==='reduced'||!!(media&&media.matches);
    document.documentElement.dataset.motion=reduced?'reduced':'full';
    if(reduced){finishCounters();for(const a of Array.from(active)){try{a.finish();}catch(e){a.cancel();}}}
  }
  if(media && media.addEventListener)media.addEventListener('change',sync);
  else if(media && media.addListener)media.addListener(sync);
  function mode(value){preference=value==='reduced'?'reduced':'system';sync();}
  function animate(el,frames,ms,options){
    if(reduced||!el||typeof el.animate!=='function')return null;
    const a=el.animate(frames,Object.assign({duration:ms,easing:ease},options||{}));
    active.add(a);
    const clear=()=>active.delete(a);
    a.addEventListener('finish',clear,{once:true});a.addEventListener('cancel',clear,{once:true});
    return a;
  }
  function number(el,before,after,format){
    if(!el)return;
    const old=counters.get(el);
    if(old){if(old.target===after && before!=null)return;root.cancelAnimationFrame(old.frame);if(before!=null)before=old.current;counters.delete(el);}
    if(reduced||before===after||before==null||typeof root.requestAnimationFrame!=='function'){el.textContent=format(after);return;}
    const c={target:after,current:before,format,frame:0,start:null};
    el.textContent=format(before);
    function step(now){
      if(c.start===null)c.start=now;
      const t=Math.min(1,(now-c.start)/360);
      c.current=Math.round(before+(after-before)*(1-Math.pow(1-t,3)));el.textContent=format(c.current);
      if(t<1)c.frame=root.requestAnimationFrame(step);else counters.delete(el);
    }
    counters.set(el,c);c.frame=root.requestAnimationFrame(step);
  }
  function page(el,dir){return animate(el,[{opacity:.32,transform:'translateX('+(dir<0?-11:11)+'px)'},{opacity:1,transform:'translateX(0)'}],230);}
  function addEntry(el){return animate(el,[{opacity:.15,transform:'translateY(-9px)'},{opacity:1,transform:'translateY(0)'}],310);}
  function age(el){return animate(el,[{transform:'translateY(5px) scale(.93)',opacity:.2},{transform:'translateY(-1px) scale(1.04)',opacity:1,offset:.69},{transform:'none',opacity:1}],320);}
  function open(backdrop,panel,swap){
    if(!swap)animate(backdrop,[{opacity:.2},{opacity:1}],170);
    animate(panel,swap?[{opacity:.3,transform:'translateX(10px)'},{opacity:1,transform:'none'}]:
      [{opacity:.45,transform:'translateY(34px) scale(.985)'},{opacity:1,transform:'none'}],swap?180:270);
  }
  function close(el,done){
    const panel=el && el.querySelector('.sheet');
    const start=panel&&panel.style.transform?panel.style.transform:'none';
    const end=start==='none'?'translateY(16px)':start+' translateY(22px)';
    animate(panel,[{transform:start},{transform:end}],140);
    const a=animate(el,[{opacity:1},{opacity:0}],140);
    if(!a){done();return;}let called=false;const cleanup=()=>{if(!called){called=true;done();}};
    a.addEventListener('finish',cleanup,{once:true});a.addEventListener('cancel',cleanup,{once:true});
  }
  function celebrate(host){
    if(reduced||!host||typeof host.animate!=='function')return;
    for(let i=0;i<7;i++){
      const fleck=document.createElement('i');fleck.className='fleck';fleck.style.background=['#e2aa5c','#7fb6a1','#dc8b75'][i%3];host.appendChild(fleck);
      const x=(i-3)*13, y=-25-(3-Math.abs(i-3))*7;
      const a=animate(fleck,[{opacity:0,transform:'translate(0,0) scale(.45)'},{opacity:1,offset:.18},{opacity:0,transform:'translate('+x+'px,'+y+'px) rotate('+(i%2?74:-56)+'deg)'}],470,{delay:i*12});
      if(a){const clean=()=>fleck.remove();a.addEventListener('finish',clean,{once:true});a.addEventListener('cancel',clean,{once:true});}
      else fleck.remove();
    }
  }
  root.PocketMotion={mode,number,page,addEntry,age,open,close,celebrate,animate,get reduced(){return reduced;}};
})(window);
