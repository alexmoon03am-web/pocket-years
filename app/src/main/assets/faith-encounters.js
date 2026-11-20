/* A dated historical context and a separately identified, fictional local decision. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const geo=node?require('./geography.js').PocketGeography:root.PocketGeography;
  const history=node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;
  const periods=[
    {id:'sankore',from:1400,to:1599,city:'Timbuktu',
      fact:'Scholars and manuscript traders made Timbuktu a center of Islamic learning.',
      source:'UNESCO World Heritage Centre · Timbuktu',url:'https://whc.unesco.org/en/list/119/',
      title:'A manuscript needs a copy',prompt:'A local instructor has more readers than copies.',
      help:'Copy a manuscript',artifact:'A teaching manuscript',text:'I copied the last page twice. Both copies found readers.'},
    {id:'type',from:1455,to:1480,region:'europe',
      fact:'Around 1455, printers in Mainz produced a Latin Bible with movable type.',
      source:'Library of Congress · Gutenberg Bible',url:'https://guides.loc.gov/gutenberg',
      title:'Type and ink',prompt:'A visiting printer brings a sample page. The reading room has asked to keep it.',
      help:'Arrange a reading',artifact:'A printed specimen page',text:'I arranged a public reading. Someone asked to see the back.'},
    {id:'amendment',from:1791,to:1800,code:'US',
      fact:'The US Bill of Rights was ratified in 1791. Its First Amendment addressed Congress and religious freedom.',
      source:'US National Archives · Bill of Rights',url:'https://www.archives.gov/legislative/features/bor',
      title:'The meeting room',prompt:'Neighbors request an evening to read and discuss the new amendment.',
      help:'Organize the discussion',artifact:'A handbill for the meeting',text:'We read the wording aloud. The questions took longer.'},
    {id:'article20',from:1947,to:1957,code:'JP',fact:'Japan’s postwar constitution guarantees freedom of religion in Article 20.',
      source:'National Diet Library · Constitution of Japan',url:'https://www.ndl.go.jp/constitution/etc/j01.html',
      title:'A new notice on the board',prompt:'A reading group wants help explaining the new article to neighbors.',
      help:'Host the reading group',artifact:'Minutes of the reading group',text:'We took questions until the hall closed. The caretaker had one too.'},
    {id:'network',from:2000,to:2049,fact:'Local simulation',title:'Permission to publish',
      prompt:'The community archive is digitizing recorded interviews. Several speakers agreed only to a local audience.',
      help:'Collect consent before digitizing',artifact:'An archive consent register',text:'We published the approved interviews. The rest stayed in the room.'},
    {id:'orbital',from:2050,to:Infinity,fact:'Future fiction',title:'A calendar off Earth',
      prompt:'Families on different sleep schedules want a gathering they can attend together.',
      help:'Arrange two meeting times',artifact:'A two-session community calendar',text:'Everyone found a meeting time. I attended both.'}
  ];
  function current(l){
    const year=l.born+l.age,city=geo.cities[l.town];
    if(l.ended||l.age<8||l.sim.prison)return null;
    return periods.find(e=>year>=e.from&&year<=e.to&&(!e.city||e.city===city?.name)&&(!e.code||e.code===city?.code)&&
      (!e.region||e.region===history.region(l.town))&&!l.sim.faithEncounters?.some(item=>item.id===e.id))||null;
  }
  function perform(l,id,ctx){
    const e=current(l);
    if(!e||!['help','listen','decline'].includes(id)||ctx.blocking(l))return null;
    const year=l.born+l.age;
    const text=id==='help'?e.text:id==='listen'?'I listened to the discussion and wrote down a question.':'I declined the invitation. They gave my seat to a neighbor.';
    const change=id==='help'?{bonds:2}:id==='listen'?{smarts:1}:{};
    const delta=ctx.apply(l,change);
    (l.sim.faithEncounters||(l.sim.faithEncounters=[])).push({id:e.id,year,town:l.town,person:l.name,choice:id});
    if(id==='help')ctx.keepsake(l,e.artifact);
    ctx.log(l,'Faith',e.title,text,delta);
    return {title:e.title,text,delta};
  }
  function validate(l){
    const list=l.sim.faithEncounters;
    if(list===undefined)return;
    if(!Array.isArray(list)||list.length>periods.length||new Set(list.map(r=>r?.id)).size!==list.length)throw Error('Invalid community decisions.');
    for(const r of list){
      const e=periods.find(e=>e.id===r.id);
      if(!e||!Number.isSafeInteger(r.year)||r.year<e.from||r.year>e.to||!geo.cities[r.town]||typeof r.person!=='string'||!['help','listen','decline'].includes(r.choice))throw Error('Unknown community decision.');
    }
  }
  root.PocketFaithEncounters={current,perform,validate,periods};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
