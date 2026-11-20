/* Extra commands register with the same state transition dispatcher as the original activities. */
(function(root){
  'use strict';
  const M=typeof module!=='undefined'&&module.exports?require('./model.js').PocketModel:root.PocketModel;
  function install({add,finish,random,world,dependence,jobs}){
    const adult=l=>l.age<18?'Opens at 18':'';
    const fee=(l,n)=>l.cash<n?'Needs '+M.cash(n):'';
    const student=l=>M.school(l).name?'':'Enroll in school first';
    const employed=l=>!l.job||['student','retired'].includes(l.job)?'An active job is required':'';
    add('therapy','health','Go to therapy','chat','A session costs $60. Students attend free.',l=>{
      const a=l.sim.addictions.find(x=>!x.sober);if(a)a.severity=Math.max(1,a.severity-7);
      return finish(l,'therapy','Health','Therapy session',a?'I talked about '+a.substance+'. The waiting-room clock was louder than either of you.':'I named the problem. The hour was up.',{cash:l.age<18?0:-60,joy:8,willpower:4});
    },l=>l.age<6?'Opens at 6':l.age<18?'':fee(l,60));
    add('rehab','health','Enter recovery','heart','Costs $400. Cravings can return after treatment.',l=>{
      const a=l.sim.addictions.filter(x=>!x.sober).sort((a,b)=>b.severity-a.severity)[0];a.sober=true;a.severity=Math.max(1,a.severity-20);
      M.tag(l,'entered-recovery');return finish(l,'rehab','Health','Started recovery','I started treatment for '+a.substance+'. There was paperwork.',{cash:-400,health:6,willpower:8});
    },l=>!l.sim.addictions.some(a=>!a.sober)?'No active addiction':fee(l,400));
    add('surgery','health','Get cosmetic surgery','spark','Costs $2,200. The result can go either way.',l=>{
      const botched=random(l)<.18;
      if(botched)l.sim.injuries.push({name:'surgical injury',severity:42,years:0});
      M.tag(l,botched?'botched-surgery':'cosmetic-surgery');
      return finish(l,'surgery','Health',botched?'Surgery complication':'Cosmetic surgery',botched?'The surgeon used the phrase “unexpected result.” I requested a mirror.':'I liked the result. My ID photo is now a historical document.',{cash:-2200,looks:botched?-13:12,health:botched?-14:-2,joy:botched?-7:4});
    },l=>adult(l)||fee(l,2200));
    add('nightclub','nightlife','Go clubbing','music','Pay $35 at the door. There is a health risk.',l=>{
      const risk=dependence(l,'alcohol',16);l.sim.habits.nightlife+=2;
      return finish(l,'nightclub','Activity','A night out',risk?'Last call became a habit. I logged an alcohol problem.':'I paid $35 to shout a conversation into somebody’s ear.',{cash:-35,joy:6,health:-3,addictionRisk:2});
    },l=>adult(l)||fee(l,35));
    add('lottery','nightlife','Buy a lottery ticket','ticket','A $5 ticket pays $400 on a win.',l=>{
      const win=random(l)<.025;return finish(l,'lottery','Assets','Lottery ticket',win?'My ticket paid $400. The cashier checked it twice.':'The ticket cost $5. The bin was free.',{cash:win?395:-5,joy:win?8:-1});
    },l=>adult(l)||fee(l,5));
    add('casino','nightlife','Play at the casino','dice','Stake $100. A win returns $200 including your stake.',l=>{
      const win=random(l)<.44,risk=dependence(l,'gambling',14);
      return finish(l,'casino','Assets','Casino visit',(win?'I left $100 ahead.':'The casino kept my $100.')+(risk?' Gambling cravings followed me home.':''),{cash:win?100:-100,joy:win?5:-4,addictionRisk:2});
    },l=>adult(l)||fee(l,100));
    add('school-slack','school','Slack off in class','clock','Trade grades for an easier afternoon.',l=>
      finish(l,'school-slack','School','Bare minimum','I copied the date. That was the whole page.',{joy:4,discipline:-4},{grade:-7}),student);
    add('skip-class','school','Skip class','exit','Attendance and grades take a hit.',l=>{
      const caught=random(l)<.48;if(caught)M.tag(l,'detention');
      return finish(l,'skip-class','School',caught?'Detention':'Skipped class',caught?'My teacher took attendance. Bold move on their part.':'I missed algebra. Algebra continued.',{joy:caught?-3:5,karma:-2,discipline:-3},{grade:caught?-9:-5});
    },l=>student(l)||(l.age<11?'Opens in middle school':''));
    for(const [id,title,ic] of [['debate','Debate club','chat'],['track','Track team','shoe'],['band','School band','music']]){
      add('club-'+id,'school','Join the '+title.toLowerCase(),ic,'Meet classmates and attend practice each year.',l=>{
        l.sim.activities.push(id);M.tag(l,'joined-'+id);
        return finish(l,'club-'+id,'School','Joined '+title,'I signed the roster. Practice is inconveniently regular.',{joy:4,[id==='track'?'health':'smarts']:3},{reputation:2});
      },l=>student(l)||(l.age<7?'Opens at 7':l.sim.activities.includes(id)?'Already a member':''));
    }
    add('drop-school','school','Drop out of high school','exit','Leave school. You can earn an equivalency later.',l=>{
      l.sim.dropped=true;l.sim.activities=[];M.tag(l,'left-high-school');
      return finish(l,'drop-school','School','Dropped out','The office requested a signature. That was the final assignment.',{joy:3,discipline:-5});
    },l=>l.age<16||l.age>=18?'Ages 16–17':l.sim.dropped?'Already left school':'');
    add('equivalency','education','Earn a school equivalency','book','Complete the exam for $120.',l=>{
      l.sim.dropped=false;M.tag(l,'equivalency');
      return finish(l,'equivalency','School','Equivalency earned','I passed. The certificate fits the same frame.',{cash:-120,discipline:4,smarts:3});
    },l=>adult(l)||(!l.sim.dropped?'For school leavers':'')||fee(l,120));
    add('work-slack','work','Slack off at work','clock','Give your boss a reason to check your calendar.',l=>{
      const fired=l.world.performance<29;
      if(fired){world.changeJob(l,null,true);M.tag(l,'fired');}
      return finish(l,'work-slack','Career',fired?'Fired':'Slacked off',fired?'My manager scheduled a very short meeting. My badge stopped working.':'I kept a spreadsheet open. It did most of the work.',{joy:fired?-9:4,discipline:-4},{performance:fired?0:-15});
    },employed);
    add('raise','work','Ask for a raise','coin','Performance, experience and your boss affect the answer.',l=>{
      const boss=Object.values(l.people).find(p=>p.role==='Boss'&&p.active);
      const yes=random(l)<.08+l.world.performance*.004+Math.min(10,l.age-l.world.since)*.024+(boss?boss.bond:40)*.002;
      const amount=yes?Math.max(300,Math.round(jobs[l.job][1]*.065/10)*10):0;
      l.extraPay+=amount;
      return finish(l,'raise','Career',yes?'Raise approved':'Raise declined',yes?'My annual salary went up by '+M.cash(amount)+'.':'Management thanked me for bringing it up. That was the raise.',{joy:yes?5:-3},{performance:yes?2:0});
    },employed);
    add('retire-now','work','Retire','sprout','Leave full-time work and draw an annual pension.',l=>{
      world.changeJob(l,'retired',true);M.tag(l,'retired');return finish(l,'retire-now','Career','Retired','I handed over my badge. The pension office took my number.',{joy:6,health:3});
    },l=>l.age<60?'Opens at 60':l.job==='retired'?'Already retired':'');
    add('side-hustle','work','Take weekend freelance work','bag','Earn $1,200 each year you keep the work.',l=>{
      l.sim.sideHustle=1200;return finish(l,'side-hustle','Career','Weekend work','My weekends now have invoices.',{joy:-2,discipline:3});
    },l=>adult(l)||(l.sim.sideHustle?'Already active':''));
    add('end-side','work','Quit weekend work','exit','Remove freelance pay from next year’s budget.',l=>{
      l.sim.sideHustle=0;return finish(l,'end-side','Career','Weekend work ended','Sunday is available again.',{joy:2});
    },l=>!l.sim.sideHustle?'No freelance work':'');
    add('invest','invest','Buy fund units','trend','Invest $250. The game fund pays 3.5% annually.',l=>{
      l.sim.fund+=250;return finish(l,'invest','Assets','Bought fund units','I moved $250 into the income fund.',{cash:-250});
    },l=>adult(l)||fee(l,250));
    add('redeem','invest','Sell fund units','wallet','Withdraw up to $250 of invested capital.',l=>{
      const amount=Math.min(250,l.sim.fund);l.sim.fund-=amount;
      return finish(l,'redeem','Assets','Sold fund units',M.cash(amount)+' returned to my bank.',{cash:amount});
    },l=>adult(l)||(!l.sim.fund?'No units owned':''));
  }
  root.PocketActivities={install};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
