/* School encounters use the existing campus roster. Cases keep person IDs across save/load and transfers. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const M=node?require('./model.js').PocketModel:root.PocketModel;
  const kin=node?require('./kinship.js').PocketKinship:root.PocketKinship;
  const year=l=>l.born+l.age;
  const school=l=>!l.ended&&!l.sim.prison&&M.school(l).name;
  const early=l=>l.sim.timeline?.historicalRules&&year(l)<1900;
  const limit=24;
  const clubs={debate:'debate club',band:'school band',track:'track team',handwork:'craft circle',service:'community team'};
  const encounters=['exclusion','credit','materials','missed-lesson','demonstration'];
  const cases=encounters.concat('truce','hearing');
  const projects={
    materials:{
      title:'The short supply',text:n=>n+' counted the supplies. We are one set short. The next group is already waiting.',
      choices:{
        pair:['Share a set','Finish together and leave enough for the next group.',n=>'I shared with '+n+'. We only disagreed about who lost the small piece.',{karma:2},{},6,true],
        improvise:['Make a substitute','Use some lesson time to work with what is left.',()=>'My substitute worked. It now has a much better name than it deserves.',{smarts:2},{grade:1},2],
        keep:['Keep your set','Finish quickly and leave someone else to wait.',n=>n+' waited. I got the first mark and the last invitation.',{discipline:-1},{grade:2,reputation:-2},-5]
      }
    },
    'missed-lesson':{
      title:'The lesson nobody remembers',text:n=>n+' missed last week’s lesson. Everyone remembers it being important. Nobody agrees why.',
      choices:{
        teach:['Go through it together','Spend time teaching and find the gap in your own knowledge.',n=>'I explained the lesson to '+n+'. Halfway through I finally understood it.',{smarts:2},{grade:2},5,true],
        ask:['Check with the teacher','Get the lesson straight before passing it on.',()=>'We asked for the lesson again. The answer was shorter the second time.',{discipline:2},{grade:2},2],
        guess:['Give your best guess','Help quickly and risk getting the details wrong.',n=>'My version sounded convincing. '+n+' had to correct it later.',{willpower:1},{grade:-2},-3]
      }
    },
    demonstration:{
      title:'The rehearsal went fine',text:n=>n+' forgot the next part halfway through our demonstration. The audience developed excellent hearing.',
      choices:{
        prompt:['Give a quiet prompt','Offer your partner the next line.',n=>'I mouthed the next bit. '+n+' took it from there.',{bonds:2},{reputation:1},6,true],
        reset:['Start again together','Give up time for a cleaner demonstration.',()=>'We started again. By then the audience knew the first half very well.',{discipline:2},{grade:2},3],
        solo:['Finish it yourself','Take the credit and strain the partnership.',n=>'I did the ending. '+n+' did the walk home alone.',{willpower:2},{grade:2,reputation:-3},-7]
      }
    }
  };
  function state(l){
    return l.sim.schoolCommunity||(l.sim.schoolCommunity={
      version:1,absences:0,lastAbsent:null,captaincies:0,practices:0,lastYear:null,pending:null,plan:null,invitation:null,record:[]
    });
  }
  function validate(l){
    const s=l.sim.schoolCommunity;if(s===undefined)return;
    const positive=n=>Number.isSafeInteger(n)&&n>=0;
    const stamp=n=>n===null||positive(n)&&n<=year(l);
    const future=n=>positive(n)&&n<=year(l)+2;
    const ref=n=>typeof n==='string'&&n.length>0&&n.length<=128;
    const bad=()=>{throw Error('Invalid school community record.');};
    if(!s||s.version!==1||![s.absences,s.captaincies,s.practices].every(positive)||
       !stamp(s.lastYear)||!stamp(s.lastAbsent)||!Array.isArray(s.record)||s.record.length>limit||
       !s.record.every(x=>x&&stamp(x.year)&&x.year!==null&&typeof x.text==='string'&&x.text.length<=512))bad();
    const c=s.pending;
    if(c!==null&&(!c||!cases.includes(c.kind)||!stamp(c.opened)||c.opened===null||
      !ref(c.school)||!ref(c.town)||(c.kind!=='hearing'&&!ref(c.person))))bad();
    if(s.plan!==null&&(!s.plan||!future(s.plan.due)||typeof s.plan.done!=='boolean'))bad();
    if(s.invitation!==null&&(!s.invitation||!future(s.invitation.due)||!ref(s.invitation.person)))bad();
  }
  function people(l){
    return Object.values(l.people).filter(p=>p.met&&p.active&&p.atSchool&&!p.cutOff&&M.isAlive(p));
  }
  function entry(l,s,text){
    s.record.push({year:year(l),text});
    if(s.record.length>limit)s.record.shift();
  }
  function change(l,p,verb,amount){
    if(!p)return {};
    const previous=p.bond;
    p.bond=M.clamp(previous+amount);
    kin.remember(l,p,verb,amount);
    return previous===p.bond?{}:{['bond/'+p.id]:p.bond-previous};
  }
  function prompt(l,c){
    const p=people(l).find(n=>n.id===c.person);
    if(c.kind==='hearing')return {
      title:early(l)?'A meeting over missed lessons':'Attendance hearing',
      text:'Two missed lessons put my name on the list. I can speak before the decision. If I leave it a year, the absences stand.',
      responses:[['plan','Offer to make up the work','Complete the missed work before your next birthday.'],['explain','Explain what happened','Your standing and your teacher’s trust affect the decision.'],['accept','Accept the absence mark','Close the case and take the grade penalty now.']]
    };
    if(!p)return null;
    const project=projects[c.kind];
    if(project)return {title:project.title,text:project.text(p.name)+' The group will move on next year.',
      responses:Object.entries(project.choices).map(([key,x])=>[key,x[0],x[1]])};
    if(c.kind==='truce')return {
      title:'A seat at the same table',text:p.name+' saved me a seat. We have barely spoken since the argument. The seat is available this year.',
      responses:[['repair','Talk it through','Offer a truce and hear their side.'],['space','Ask for some space','Stay civil without settling the rivalry.'],['cold','Walk past','Keep your distance and risk a colder relationship.']]
    };
    if(c.kind==='credit')return {
      title:'One name on a shared project',text:p.name+' and I did the work together. Only my name made it onto the finished piece. I have until next year to fix it.',
      responses:[['share','Give shared credit','Correct the record in front of the group.'],['redo','Show our separate work','Credit each contribution and take another turn at the assignment.'],['take','Keep the credit','Raise your grade and risk a lasting rivalry.']]
    };
    return {title:'The missing place',text:'Someone keeps leaving '+p.name+' out of the group. There is room for one more. An adult will check in if I leave it alone.',
      responses:[['welcome','Work beside them','Offer company and leave the decision to them.'],['tell','Ask a teacher for support','Bring the situation to someone who can arrange a fair group.'],['quiet','Check in privately','Offer a quiet conversation after the lesson.']]};
  }
  function create(api){
    function outcome(l,title,text,effects={},schoolEffects={},bonds={}){
      const delta={...api.apply(l,effects),...api.world.metrics(l,schoolEffects),...bonds};
      api.log(l,'School',title,text,delta);return {title,text,delta};
    }
    function view(l){
      const s=l.sim.schoolCommunity,enrolled=!!school(l),options=[];
      const record=s?.record||[],current=s?.pending;
      const c=enrolled&&current?.school===school(l)&&current.town===l.town?prompt(l,current):null;
      function add(id,title,desc,icon,reason=''){
        options.push({id,title,desc,icon,reason:reason||api.actionReason(l,'community-'+id)});
      }
      if(c)for(const [answer,title,desc] of c.responses)add('case-'+current.kind+'-'+current.opened+'-'+answer,title,desc,'chat');
      if(enrolled&&s?.plan&&!s.plan.done)add('makeup','Complete the missed work','Fulfil the attendance agreement before your next birthday.','pencil');
      const activeClubs=l.sim.activities.filter(id=>Object.hasOwn(clubs,id));
      if(enrolled&&l.age>=3&&l.age<7)add('circle','Take a turn in the circle','Learn someone’s name and practice listening.','people');
      if(enrolled&&l.age>=7){
        if(l.age>=11&&l.sim.timeline?.historicalRules&&year(l)<2000)
          add('miss','Miss a lesson','Gain a free afternoon. A second absence within two years brings a meeting.','exit');
        const membership=early(l)?'handwork':'service';
        if(!activeClubs.includes(membership))add('join-'+membership,early(l)?'Join the craft circle':'Join the community team',early(l)?'Practice a craft with other learners.':'Share the work on projects for your school.',early(l)?'tools':'people');
        for(const id of activeClubs)add('practice-'+id,'Practice with the '+clubs[id],'One practice per year across your groups. Earn a turn leading after three practices.',
          id==='track'?'shoe':id==='band'?'music':'tools',l.used.includes('community-practice')?'Practiced this year':'');
        if(s&&s.practices>=3*(s.captaincies+1)&&activeClubs.length)add('lead','Lead a group session','Organize the next session. Your preparation and standing matter.','flag');
      }
      const title='School community';
      const summary=enrolled?[M.school(l).name,activeClubs.map(x=>clubs[x]).join(', '),s?.practices?s.practices+' practices':'',s?.absences?s.absences+' unresolved absence'+(s.absences===1?'':'s'):''].filter(Boolean).join(' · '):'Your school record';
      return {enrolled,title,summary,caseTitle:c?.title||'',caseText:c?.text||'',options,record:record.slice().reverse()};
    }
    function absence(l){
      if(!school(l)||l.age<7)return;
      const s=state(l),y=year(l);
      if(s.lastAbsent===y)return;
      s.lastAbsent=y;s.absences++;
      if(s.absences===1){
        const text='My first missing lesson went in the record. A second within two years means a meeting.';
        entry(l,s,text);outcome(l,'Attendance warning',text);return;
      }
      if(s.pending&&s.pending.kind!=='hearing')entry(l,s,'The group carried on without my answer.');
      s.pending={kind:'hearing',person:null,school:school(l),town:l.town,opened:y};
      const text='I was asked to explain my attendance. I have until my next birthday to answer in School community.';
      entry(l,s,text);outcome(l,early(l)?'Called to a meeting':'Called to an attendance hearing',text);
    }
    function annual(l){
      const y=year(l),enrolled=school(l);
      let s=l.sim.schoolCommunity;
      if(l.ended||(!s&&!enrolled)||s?.lastYear===y)return;
      if(!s)s=state(l);
      s.lastYear=y;
      if(l.age===3&&enrolled){entry(l,s,'My first day at preschool.');outcome(l,'Preschool began','I took my place in the circle. My place moved twice.');}
      if(s.plan&&y>=s.plan.due){
        const done=s.plan.done;s.plan=null;
        const text=done?'My missing work was marked complete. The agreement is closed.':'The deadline passed. The unfinished work counted against my grade.';
        entry(l,s,text);outcome(l,'Attendance agreement closed',text,{},done?{}:{grade:-3});
      }
      if(s.invitation&&y>=s.invitation.due){
        const p=Object.values(l.people).find(n=>n.id===s.invitation.person);
        s.invitation=null;
        if(p?.met&&p.active&&M.isAlive(p)&&!p.cutOff&&!p.rivalry&&p.town===l.town){
          const yes=p.bond>=40||p.trust>=52;
          const text=yes?p.name+' remembered the shared work and invited me along again.':p.name+' thanked me for last year. We kept separate plans.';
          if(yes&&p.role==='Classmate'){p.role='Friend';p.befriended=true;}
          entry(l,s,text);outcome(l,'An answer from '+p.name,text,{}, {},yes?change(l,p,'invitation',5):{});
        }
      }
      if(s.pending&&s.pending.opened<y){
        const hearing=s.pending.kind==='hearing';
        const text=hearing?'I missed the hearing. The absences stayed on my record.':'The group settled the matter before I answered.';
        if(hearing)s.absences=0;
        s.pending=null;entry(l,s,text);
        if(hearing)outcome(l,'Hearing concluded',text,{}, {grade:-4});
      }
      if(s.absences&&s.lastAbsent!==null&&y-s.lastAbsent>2)s.absences=0;
      if(!enrolled||l.age<7||s.pending)return;
      const turn=M.hash(l.id+'/school-turn')%3;
      if((y+turn)%3!==0)return;
      const peers=people(l).filter(p=>p.job==='Student');
      if(!peers.length)return;
      const h=M.hash(l.id+'/'+l.town+'/'+y+'/school');
      const rival=peers.find(p=>p.rivalry);
      const p=rival||peers[h%peers.length];
      const kind=rival?'truce':encounters[(Math.floor((y+turn)/3)+M.hash(l.id+'/school-order'))%encounters.length];
      s.pending={kind,person:p.id,school:enrolled,town:l.town,opened:y};
      const q=prompt(l,s.pending);
      outcome(l,q.title,q.text+' I can answer in School community.');
    }
    function resolve(l,s,c,id){
      const answer=id.split('-').pop(),p=people(l).find(n=>n.id===c.person);
      const teacher=people(l).find(n=>n.role==='Teacher');
      let text,stats={},schoolEffects={},bonds={};
      if(c.kind==='hearing'){
        s.absences=0;
        if(answer==='plan'){
          s.plan={due:year(l)+1,done:false};
          text='I agreed to finish the missed work before my next birthday. They remembered to give me the work.';stats={discipline:2};
        }else if(answer==='explain'){
          const excused=api.random(l)<.12+l.world.grade*.004+(teacher?.trust??teacher?.bond??35)*.004;
          text=excused?'They heard me out and excused the absences. I still had to catch up.':'They heard me out and kept the marks. I know where I stand.';
          schoolEffects=excused?{reputation:2}:{grade:-4};
          bonds=change(l,teacher,'attendance-explanation',2);
        }else{text='I accepted the mark. The meeting ended early.';schoolEffects={grade:-4};stats={willpower:1};}
      }else if(projects[c.kind]){
        const choice=projects[c.kind].choices[answer];
        text=choice[2](p.name);stats=choice[3];schoolEffects=choice[4];
        bonds=change(l,p,choice[5]>=0?'shared-lesson':'dismissed-classmate',choice[5]);
        if(choice[6])s.invitation={due:year(l)+1,person:p.id};
      }else if(c.kind==='credit'){
        if(answer==='take'){
          p.rivalry=true;text=p.name+' saw the single name and stopped sharing work with me.';stats={karma:-3};schoolEffects={grade:2,reputation:-4};bonds=change(l,p,'claimed-credit',-12);
        }else{
          const share=answer==='share';
          text=share?'I read both names aloud. '+p.name+' stayed for the applause.':'We each showed our part. The second demonstration went better.';
          stats=share?{karma:3}:{smarts:2};schoolEffects=share?{reputation:2}:{grade:3};
          bonds=change(l,p,'shared-credit',share?7:4);s.invitation={due:year(l)+1,person:p.id};
        }
      }else if(c.kind==='truce'){
        if(answer==='repair'){
          const yes=api.random(l)<.18+(p.trust??p.bond)*.005+p.generosity*.003;
          if(yes)p.rivalry=false;
          text=yes?p.name+' accepted my apology. We shared the table.':p.name+' heard me out. They still wanted distance.';
          bonds=change(l,p,yes?'reconcile':'offered-truce',yes?10:1);stats={willpower:2};
        }else if(answer==='space'){text='We agreed to keep some distance. Nobody had to change seats.';stats={discipline:2};}
        else{text='I took another seat. '+p.name+' took the hint.';bonds=change(l,p,'declined-truce',-3);stats={joy:-1};}
      }else{
        if(answer==='tell'){
          text=teacher?teacher.name+' paired us up for the next lesson. There was a place for everyone.':'A new group arrangement left room for everyone.';
          schoolEffects={reputation:2};bonds=change(l,teacher,'asked-for-help',3);
        }else{
          const quiet=answer==='quiet';
          text=quiet?'I checked on '+p.name+' after the lesson. They got to choose what happened next.':'I offered '+p.name+' the empty place. The rest of the group made room.';
          bonds=change(l,p,'offered-company',quiet?5:7);s.invitation={due:year(l)+1,person:p.id};
        }
        stats={karma:2,bonds:1};
      }
      s.pending=null;entry(l,s,text);
      return outcome(l,c.kind==='hearing'?'Attendance decision':'School decision',text,stats,schoolEffects,bonds);
    }
    function perform(l,id){
      const o=view(l).options.find(x=>x.id===id);
      if(!o||o.reason)return null;
      const s=state(l);
      l.used.push('community-'+id);
      if(id.startsWith('case-'))return resolve(l,s,s.pending,id);
      if(id==='miss'){
        const result=outcome(l,'Missed a lesson','I found a free afternoon. The person teaching me noticed.',{joy:2,discipline:-2},{grade:-4});
        absence(l);return result;
      }
      let text,effects={},progress={},bonds={};
      if(id==='circle'){
        const p=people(l).find(n=>n.job==='Student');
        text=p?'I learned '+p.name+'’s name. They already knew mine.':'I waited for my turn to speak. It eventually arrived.';
        effects={bonds:2};bonds=change(l,p,'took-turns',3);
      }else if(id==='makeup'){
        s.plan.done=true;text='I finished the missed work before the deadline.';effects={discipline:3};progress={grade:2};
      }else if(id.startsWith('join-')){
        const group=id.slice(5);l.sim.activities.push(group);M.tag(l,'joined-'+group);
        text='I joined the '+clubs[group]+'. The first job was putting everything away.';effects={joy:2};
      }else if(id.startsWith('practice-')){
        const group=id.slice(9);s.practices++;l.used.push('community-practice');
        const p=people(l).find(n=>n.job==='Student');
        text='I practiced with the '+clubs[group]+'.'+(p?' '+p.name+' stayed to help.':' I stayed to tidy up.');
        effects=group==='track'?{health:2,discipline:1}:{smarts:1,discipline:2};bonds=change(l,p,'practiced-together',3);
      }else{
        const success=api.random(l)<.24+l.hidden.discipline*.004+l.world.reputation*.003+Math.min(.18,s.practices*.02);
        if(success){s.captaincies++;M.tag(l,'school-group-leader');}
        text=success?'I ran the session. Everyone else noticed how long an hour is.':'The group chose someone else to lead. I stayed for practice.';
        effects=success?{joy:3}:{willpower:2};progress=success?{reputation:4}:{};
      }
      entry(l,s,text);return outcome(l,o.title,text,effects,progress,bonds);
    }
    return {view,perform,annual,absence,validate};
  }
  root.PocketSchoolCommunity={create};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
