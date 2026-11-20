/* Calendar-based presentation. A locked theme never changes a simulation date. */
(function(root) {
  'use strict';
  const future=typeof module!=='undefined'&&module.exports?require('./future-epochs.js').PocketFuture:root.PocketFuture;
  const eras = [
    {id:'medieval', name:'Medieval Era', first:1200, last:1499, start:1200},
    {id:'renaissance', name:'Renaissance Era', first:1500, last:1699, start:1500},
    {id:'industrial', name:'Industrial Era', first:1700, last:1899, start:1800},
    {id:'century', name:'20th Century', first:1900, last:1999, start:1920},
    {id:'digital', name:'Digital Age', first:2000, last:2049, start:2026},
    {id:'future', name:'Future Era', first:2050, last:3000, start:2050}
  ];
  const themes = [
    {id:'medieval', name:'Illuminated manuscript', first:1200, icon:'leaf'},
    {id:'renaissance', name:'Workshop sketchbook', first:1500, icon:'compass'},
    {id:'industrial', name:'Industrial gazette', first:1700, icon:'tools'},
    {id:'press', name:'Morning edition', first:1900, icon:'newspaper'},
    {id:'midcentury', name:'Mid-century catalogue', first:1950, icon:'music'},
    {id:'terminal', name:'Personal computer', first:1980, icon:'keyboard'},
    {id:'web', name:'Early internet', first:2000, icon:'world-index'},
    {id:'modern', name:'Modern journal', first:2020, icon:'journal'},
    ...future.chapters.map(c=>({id:c.theme,name:c.name,first:c.first,icon:c.icon}))
  ];
  function periodForYear(periods,year) {
    for(let i=periods.length-1;i>0;i--)if(year>=periods[i].first)return periods[i];
    return periods[0];
  }
  function themeForYear(year) {return periodForYear(themes,year).id;}
  function eraForYear(year) {return periodForYear(eras,year);}
  function validYear(era,value) {
    if(value===''||value==null)return false;
    const y=Number(value);
    return Number.isInteger(y)&&y>=era.first&&y<=era.last;
  }
  function activeTheme(life,lock) {
    if(themes.some(theme=>theme.id===lock))return lock;
    const year=life.born+life.age;
    return life.sim.timeline?.historicalRules||year>=2050?themeForYear(year):'modern';
  }
  const api={eras,themes,eraForYear,themeForYear,activeTheme,validYear};
  root.PocketEraUI=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
