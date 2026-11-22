/* School and occupation screens share the journal's sheet navigation and theme. */
(function(root){
  'use strict';
  function create({E,row,detail,subhead,esc,cash}){
    const education=E.education, occupations=E.occupations;
    const group=rows=>rows.length?'<div class="commands pathway-rows">'+rows.join('')+'</div>':'';
    const link=(key,title,description,icon,tail='')=>row('sheet',key,title,description,icon,'',tail);
    const years=n=>n+' '+(n===1?'year':'years');
    const levelName=key=>education.levels[key]?.label||key;
    const programInfo=(l,id)=>education.eligible(l).find(p=>p.id===id);
    const funds={
      cash:['Pay from savings','wallet'],loan:['Use a student loan','letter'],
      aid:['Request financial aid','people'],scholarship:['Apply for a scholarship','school']
    };

    function schoolLinks(l){
      const community=E.schoolCommunity.view(l);
      const p=l.sim.program;
      const rows=[];
      if(community.enrolled||community.record.length){
        rows.push(link('path-community',community.title||'School community',community.caseTitle||community.summary,'people'));
      }
      if(!l.ended&&l.age>=18){
        rows.push(link('path-programs',p?.pathway?'Manage your course':'Study and qualifications',
          p?.pathway?education.programs[p.field].title:'Browse local programs, admissions and tuition.','school'));
      } else if(education.records(l).length)rows.push(link('path-record','Qualifications','Review your education record.','book'));
      return group(rows);
    }
    function programMenu(l){
      const pool=education.eligible(l);
      const active=l.sim.program;
      let body='';
      if(active?.pathway){
        const p=education.programs[active.field];
        body+=detail(p.title,'Expected completion in '+(l.born+active.end)+'.');
      }
      body+=group(education.actions(l).map(a=>a.id==='withdraw'?
        link('path-withdraw',a.title,a.desc,a.icon):
        row('path-school-action',a.id,a.title,a.desc,a.icon,a.reason)));
      body+=group([link('path-record','Qualifications','Completed studies and academic honors.','book')]);
      const levels=[...new Set(pool.map(p=>p.level))];
      if(levels.length){
        body+=subhead(active?.pathway?'Other programs':'Programs of study')+group(levels.map(level=>{
          const entries=pool.filter(p=>p.level===level);
          return link('path-level~'+level,levelName(level),entries.slice(0,3).map(p=>p.title).join(' · '),entries[0].icon,String(entries.length));
        }));
      }
      return {title:'Study and qualifications',tag:String(E.calendar(l)),body};
    }
    function studyProgram(l,p){
      const quotes=education.methods(l,p.id).map(method=>[method,education.quote(l,p.id,method)]);
      const q=quotes[0]?.[1];if(!q)return null;
      let body=detail('Course',p.description)+detail('Entry requirements',q.conditions)+
        detail('Time and tuition',years(q.years)+' · '+cash(q.tuition)+' total tuition'+
          (q.transferCredits?' · '+years(q.transferCredits)+' credited from previous study':''));
      const careers=Object.values(occupations.entries).filter(j=>j.field===p.field&&j.level===p.level&&occupations.eligibleYear(l,j.id));
      if(careers.length)body+=detail('Occupations using this qualification',careers.slice(0,4).map(j=>j.title).join(' · '));
      if(l.job==='retired')body+=detail('Pension and study','You keep your pension while studying and return to retirement when the course ends.');
      else if(l.job&&l.job!=='student')body+=detail('Work and study','Accepting a full-time place ends your current job.');
      if(Number.isFinite(q.chance))body+=detail('Admissions estimate',q.chance+'% at your present grades and qualifications.');
      body+=subhead('Apply for entry')+group(quotes.map(([method,quote])=>{
        const [name,icon]=funds[method];
        const summary=method==='loan'?'Borrow '+cash(quote.fee)+' for this course.':
          method==='scholarship'?'Compete for an award covering '+cash(quote.tuition)+'.':
          method==='aid'?'Aid '+cash(quote.aid)+' · your share '+cash(quote.fee)+'.':
          'Pay '+cash(quote.fee)+' on acceptance.';
        return row('path-apply',p.id+'~'+method,name,summary,icon,quote.reason);
      }));
      return {title:p.title,tag:levelName(p.level),body};
    }
    function schoolSheet(l,type,arg){
      if(type==='path-community'){
        const c=E.schoolCommunity.view(l);
        if(!c.enrolled&&!c.record.length)return null;
        let body=detail(c.title,c.summary);
        if(c.caseTitle)body+=detail(c.caseTitle,c.caseText);
        body+=group(c.options.map(o=>row('path-community-action',o.id,o.title,o.desc,o.icon,o.reason)));
        if(c.record.length)body+=subhead('School record')+c.record.map(r=>detail(String(r.year),r.text)).join('');
        return {title:'School community',tag:String(E.calendar(l)),body};
      }
      if(type==='path-record'){
        const results=education.records(l);
        return {title:'Qualifications',body:results.length?results.slice().reverse().map(r=>
          detail(r.title,[levelName(r.level),r.year,r.honors?(typeof r.honors==='string'?r.honors:'With honors'):null].filter(Boolean).join(' · '))).join(''):
          detail('Education record','Completed qualifications appear here after graduation.')};
      }
      if(l.age<18||l.ended)return null;
      if(type==='path-programs')return programMenu(l);
      if(type==='path-level'){
        const list=education.eligible(l).filter(p=>p.level===arg);
        if(!list.length)return null;
        return {title:levelName(arg),body:group(list.map(p=>link('path-program~'+p.id,p.title,p.description,p.icon,years(p.years))))};
      }
      if(type==='path-program'){
        const p=programInfo(l,arg);
        return p?studyProgram(l,p):null;
      }
      if(type==='path-withdraw'){
        const opt=education.actions(l).find(o=>o.id==='withdraw');
        return opt?{title:opt.title,body:detail('Leave this course',opt.desc)+group([row('path-school-action',opt.id,'Confirm withdrawal',opt.desc,opt.icon,opt.reason)])}:null;
      }
      return null;
    }
    function workLink(l){
      const assignment=occupations.caseFor(l);
      if(!assignment)return '';
      return group([link('path-assignment',assignment.title,'Your decision at work this year.','bag')]);
    }
    function studioLink(l){
      const tracks=E.performanceStudio.view(l).tracks;
      return tracks.length?group([link('path-studio','Performance & sport',tracks.map(t=>t.title).join(' · '),'mic')]):'';
    }
    function studioSheet(l,type,id){
      const tracks=E.performanceStudio.view(l).tracks;
      if(!tracks.length)return null;
      if(type==='path-studio')return {title:'Performance & sport',tag:String(E.calendar(l)),body:group(tracks.map(t=>
        link('path-season~'+t.id,t.title,t.summary,'flag')))};
      const t=tracks.find(t=>t.id===id);if(!t)return null;
      let body=detail(t.summary,t.detail)+group(t.items.map(o=>row('path-season',t.id+'~'+o.id,o.title,o.desc,o.icon,o.reason)));
      if(t.history.length)body+=subhead('Career record')+t.history.map(h=>'<p class="sheet-intro">'+esc(h)+'</p>').join('');
      return {title:t.title,tag:String(E.calendar(l)),body};
    }
    function careerSheet(l,type,arg){
      if(l.age<18||l.ended||E.isHistorical(l))return null;
      if(type==='path-assignment'){
        const assignment=occupations.caseFor(l);if(!assignment)return null;
        return {title:assignment.title,tag:E.occupation(l),body:detail('At work',assignment.body)+
          group(assignment.choices.map(c=>row('path-work-choice',c.id,c.label,c.detail,c.icon)))};
      }
      const entries=Object.entries(occupations.entries).filter(([id])=>occupations.eligibleYear(l,id));
      if(type==='path-fields'){
        const fields=new Map();
        for(const [,job] of entries){
          if(!fields.has(job.category))fields.set(job.category,[]);
          fields.get(job.category).push(job);
        }
        const body=group(Array.from(fields,([field,jobs])=>link('path-sector~'+encodeURIComponent(field),field,
          jobs.slice(0,2).map(j=>j.title).join(' · '),E.expansion.data.sectors[jobs[0].sector][5],String(jobs.length))));
        return {title:'Careers by field',tag:String(E.calendar(l)),body:body||detail('Occupations','There are no additional listings in this period.')};
      }
      if(type==='path-sector'){
        let category;try{category=decodeURIComponent(arg);}catch{return null;}
        const jobs=entries.filter(([,j])=>j.category===category).map(([id,j])=>({id,j,reason:E.world.jobReason(l,id)}));
        if(!jobs.length)return null;
        jobs.sort((a,b)=>Number(!!a.reason)-Number(!!b.reason)||a.j.title.localeCompare(b.j.title));
        return {title:category,tag:'Careers by field',body:group(jobs.map(({id,j,reason})=>
          link('job-'+id,j.title,reason||j.employer,E.expansion.data.sectors[j.sector][5],cash(E.expansion.economy.salary(l,id,E.jobs)))))};
      }
      return null;
    }
    function challenges(l){
      const list=E.pathways.challenges(l);
      const body=list.map(c=>{
        const checked=c.steps.map(step=>'<li><span class="path-step '+(step.done?'done':'')+'" aria-label="'+(step.done?'Complete':'Incomplete')+'">'+(step.done?'✓':'○')+'</span>'+esc(step.label)+'</li>').join('');
        const label=c.status==='active'?'In progress':c.status==='complete'?'Completed':'';
        return '<section class="path-challenge"><h3>'+esc(c.title)+'</h3><p>'+esc(c.description)+'</p>'+
          '<ul>'+checked+'</ul>'+(label?'<p class="path-status">'+esc(label)+'</p>'+(c.status==='active'?group([row('path-challenge','withdraw','Leave challenge','Current progress will be cleared.','exit')]):''):group([
            row('path-challenge',c.id,'Start challenge',c.title,'flag',c.reason)]))+'</section>';
      }).join('');
      return {title:'Life challenges',body};
    }
    function parent(l,key){
      const [type,id]=key.split('~');
      if(type==='path-challenges')return 'xp-hobbies';
      if(type==='path-record')return l.age>=18&&!l.ended?'path-programs':null;
      if(type==='path-level'||type==='path-withdraw')return 'path-programs';
      if(type==='path-program'){
        const p=programInfo(l,id);return p?'path-level~'+p.level:'path-programs';
      }
      if(type==='path-season')return 'path-studio';
      if(type==='path-fields')return 'jobs';
      if(type==='path-sector')return 'path-fields';
      if(type.startsWith('job-')){
        const field=occupations.entries[type.slice(4)]?.category;
        return field?'path-sector~'+encodeURIComponent(field):'jobs';
      }
      return null;
    }
    function sheet(l,key){
      const [type,arg]=key.split('~');
      if(type==='path-challenges')return challenges(l);
      if(type==='path-studio'||type==='path-season')return studioSheet(l,type,arg);
      if(['path-fields','path-sector','path-assignment'].includes(type))return careerSheet(l,type,arg);
      return schoolSheet(l,type,arg);
    }
    return {schoolLinks,workLink,studioLink,sheet,parent};
  }
  root.PocketPathwaysUI={create};
})(window);
