/* Original diary copy. Reading the journal never draws from the simulation's random stream. */
(function(root){
  'use strict';
  const M=typeof module!=='undefined'&&module.exports?require('./model.js').PocketModel:root.PocketModel;
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days={
    infant:[
      'I discovered that the floor is still there every time I drop a spoon.',
      'I fell asleep in the car and woke up in different trousers.',
      'I learned to say no. The reviews at home were mixed.',
      'I tried to put on my own shoes. Both ended up on the same foot.',
      'I carried a cardboard tube around the house for a week.'
    ],child:[
      'I finished my homework in the car outside school.',
      'I traded a sandwich for three stickers. Two were the same.',
      'I got my name on the board for talking during quiet time.',
      'I spent an entire recess trying to whistle.',
      'I took the class plant home on Friday. It survived the weekend.',
      'I borrowed a book and found last year’s lunch menu inside.'
    ],teen:[
      'I changed my profile picture and checked who noticed.',
      'I slept through three alarms and woke up for a text.',
      'I wore the same jacket in every photo this year.',
      'I practiced a conversation in the mirror. Nobody followed the script.',
      'I made a playlist for the walk home. It was longer than the walk.'
    ],adult:[
      'I finally canceled a subscription I had forgotten about.',
      'I went out for groceries and came back without the thing I went for.',
      'I spent a Saturday comparing two identical lamps.',
      'I called a repair shop. They asked if I had tried turning it off.',
      'I put my important documents somewhere safe. Very safe.',
      'I learned my neighbor’s name after years of saying “hey.”'
    ],college:[
      'I attended a lecture for the wrong course. The seats were better.',
      'I divided a group assignment into four parts and got three of them.',
      'I found a quiet seat in the library. Someone sat next to me.',
      'My secondhand textbook came with notes. The handwriting got worse in May.'
    ],career:[
      'I took my lunch to work. Somebody else took it from there.',
      'I made it through my performance review without saying “living the dream.”',
      'I attended a meeting about why we have so many meetings.',
      'I booked a day off and declined to explain my plans.',
      'I fixed the printer. This was a mistake for my future workload.'
    ],elder:[
      'I found a photograph of myself wearing something I swore I never owned.',
      'I got to an appointment early enough to watch the office open.',
      'I gave away a set of good dishes. I kept my favorite mug.',
      'I looked up an old address. The tree out front is still there.',
      'I took the long way home because I had the time.'
    ],prison:[
      'I read the same newspaper twice. The ending held up.',
      'I kept track of the weeks on the back of an envelope.',
      'I traded a place in the lunch queue for the window seat.'
    ]
  };
  function birth(l,geography){
    return 'I was born in '+geography.label(l.town)+' on '+months[l.sim.month-1]+' '+l.sim.birthday+', '+l.born+'. My name is '+l.name+'.';
  }
  function relative(l,p){
    const role=p.role.toLowerCase(),age=M.ageOf(l,p);
    if(role==='sibling')return 'I have an older sibling named '+p.name+'. We are '+age+' '+(age===1?'year':'years')+' apart.';
    return 'My '+role+' is '+p.fullName+', age '+age+'. '+(p.job==='Retired'?'They are retired.':'They work as '+(/^[aeiou]/i.test(p.job)?'an ':'a ')+p.job.toLowerCase()+'.');
  }
  function ordinary(l){
    const stage=M.stage(l),pool=days[stage]||days.adult;
    const seen=l.quietSeen[stage]||0,offset=M.hash(l.id+' day '+stage)%pool.length;
    l.quietSeen[stage]=seen+1;return pool[(offset+seen)%pool.length];
  }
  function historical(l){
    const stage=M.stage(l),y=l.born+l.age;
    const household=['I shelled a bowl of peas. Half rolled under the table.','I learned which floorboard wakes everybody up.','I hid a stone in my shoe. I found it again.'];
    const period=y<1500?['The market opened late. The geese arrived on time.','Our roof leaked into the good bowl.','I helped mend a basket. We now own a smaller basket.']:
      y<1700?['I watched a sign painter change one letter. The price went up.','I copied a receipt twice. Both copies disagreed.','I bought a length of cloth and measured it at home. Short again.']:
      y<1900?['A new tool arrived at the workshop. Its first job was fixing the old one.','The morning shift started before the sun did.','Someone borrowed my good coat. I saw it at the market.']:
      ['I repaired a chair that had survived three moves. It squeaks in a different key.','I took the long way home and arrived at the same doorstep.','I read the classifieds. Somebody wanted their ladder back.'];
    const options=stage==='infant'||stage==='child'?household:period;
    const key='era-'+stage+'-'+Math.floor(y/100);
    const n=l.quietSeen[key]||0;l.quietSeen[key]=n+1;
    return options[(n+M.hash(l.id+key))%options.length];
  }
  root.PocketDaily={birth,relative,ordinary,historical};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
