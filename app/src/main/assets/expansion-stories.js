/* Three authored choices per scenario. Follow-ups use the same tag and eligibility system as older stories. */
(function(root){
  'use strict';
  const scenes=[
    ['lunch-trade','The lunch exchange','Someone offered you two crackers for your entire sandwich.',{minAge:5,maxAge:11},[
      ['Read the fine print','Both crackers were already broken.',{smarts:3}],['Split the sandwich','Half a sandwich turned out to be enough.',{karma:4,bonds:2},'shared-lunch'],['Keep lunch','I ate the evidence.',{health:2}]]],
    ['old-lunchmate','The other half','An old schoolmate remembered who shared lunch when money was tight.',{minAge:18,requiredTags:['shared-lunch']},[
      ['Catch up','We split lunch again. This time it came with a bill.',{joy:6,cash:-12}],['Ask about work','They introduced me to their manager.',{smarts:2},{reputation:7}],['Trade recipes','They still measure everything in half sandwiches.',{bonds:5}]]],
    ['choir-sheet','Missing page','The school choir has thirty copies of page one and zero of page two.',{minAge:7,maxAge:17},[
      ['Sing from memory','I remembered the ending. The rest was an estimate.',{joy:4}],['Fetch the original','The copier had it all along.',{smarts:3},{grade:3}],['Hum','Three people joined in. A tradition started.',{bonds:4}]]],
    ['teen-rota','The rota','A friend wants your Saturday shift. It is the only one with free lunch.',{minAge:14,maxAge:17},[
      ['Trade shifts','They left their dessert for me.',{karma:3}],['Share lunch','I used a plastic knife to divide one grape.',{bonds:4}],['Keep the shift','My Saturday was spoken for. So was the grape.',{discipline:3}]]],
    ['flatmate-deposit','The deposit','Your housemate wants to sign for a sofa on your behalf.',{lifeStage:['college']},[
      ['Read the contract','The sofa carried more interest than my major.',{smarts:5}],['Pay your share','I own half of a very loud floral print.',{cash:-95,joy:4},'sofa-owner'],['Borrow folding chairs','Our guests learned to sit carefully.',{discipline:3}]]],
    ['union-vote','The rota vote','The staff vote on publishing shifts two weeks ahead.',{minAge:18,contact:'coworker'},[
      ['Support the change','People booked appointments on purpose.',{karma:4},{person:'$contact',bondAmount:7}],['Draft a trial rota','The spreadsheet survived its first weekend.',{smarts:4},{performance:5}],['Abstain','My lunch break expired during the vote.',{joy:-1},{performance:2}]]],
    ['clinical-files','Duplicate appointment','Two patients have the same slot and nearly the same name.',{sector:'Care'},[
      ['Check both files','One appointment was for next Thursday.',{discipline:3},{performance:7}],['Ask a colleague','We found the duplicate and split the paperwork.',{bonds:4},{reputation:3}],['Rush the entries','The clinic spent an afternoon correcting my afternoon.',{joy:-3},{performance:-8}]]],
    ['tech-release','Friday release','The update is ready. The on-call engineer has wedding plans.',{sector:'Technology'},[
      ['Wait until Monday','The wedding went ahead on schedule.',{karma:4},{reputation:4}],['Take the pager','I watched the ceremony by group chat.',{health:-2},{performance:7}],['Ship it now','A printer ordered thirteen copies of everything.',{discipline:-3},{performance:-6}]]],
    ['shop-inspection','Warranty sticker','The machine works. Its warranty expired during the repair.',{sector:'Industry'},[
      ['Call the supplier','They honored the original date.',{smarts:4},{performance:5}],['Document the repair','My notes outlived the sticker.',{discipline:4},{reputation:3}],['Cover the charge','The customer kept the receipt.',{cash:-65,karma:5}]]],
    ['creative-credit','Small print','A client wants one name on work six people made.',{sector:'Creative'},[
      ['Credit everyone','The type got smaller. The list stayed intact.',{karma:5},{reputation:5}],['Ask the team','Everyone had an opinion about alphabetical order.',{bonds:5}],['Take the credit','My name was large. The room went quiet.',{notoriety:4},{reputation:-6}]]],
    ['expense-audit','The missing zero','A quarterly total is off by exactly one zero.',{sector:'Commerce'},[
      ['Correct the figure','The forecast came back to earth.',{discipline:5},{performance:5}],['Bring in a colleague','We both initialed the correction.',{bonds:4},{reputation:3}],['Leave a note','The auditors found my sticky note. Then they found me.',{joy:-3},{performance:-7}]]],
    ['service-desk','Closing time','A customer arrives with a receipt from a shop that closed last year.',{sector:'Services'},[
      ['Find the old owner','The refund arrived by post.',{karma:4},{performance:4}],['Explain the policy','We agreed that the receipt had aged well.',{smarts:3}],['Pay for the item','I acquired a mystery kettle.',{cash:-32,joy:4}]]],
    ['factory-auction','Factory auction','A local workshop is selling its equipment by the pallet.',{minAge:18,phase:'Recession'},[
      ['Buy a tool lot','I got useful tools and a lifetime supply of washers.',{cash:-140,smarts:4},'auction-tools'],['Help a former employee','We loaded their personal tools first.',{karma:6}],['Ask about vacancies','I left a number for when orders return.',{discipline:3},{reputation:3}]]],
    ['boom-rent','The rent review','Every empty unit on your street suddenly has a viewing.',{minAge:18,phase:'Boom'},[
      ['Negotiate early','The owner agreed to a smaller increase.',{smarts:4}],['Compare neighborhoods','I learned what a window is worth.',{discipline:4}],['Pay for a valuation','The report had a graph and a typo.',{cash:-70,smarts:3}]]],
    ['leased-cat','The extra tenant','A tenant reports an extra resident. The resident is a cat.',{minAge:18,lease:true},[
      ['Approve the cat','The lease now lists a dependent named Beans.',{joy:5},'cat-lease'],['Inspect the unit','The cat declined to attend.',{discipline:4}],['Buy a scratching post','It preferred the box.',{cash:-38,karma:4}]]],
    ['founder-invoice','Invoice 001','A customer asks for ninety days to pay your new firm.',{minAge:18,company:true},[
      ['Ask for a deposit','They found the money in twenty minutes.',{discipline:4},{reputation:4}],['Offer a discount','The transfer arrived before the handshake ended.',{cash:120,joy:2}],['Extend the terms','The customer remembered who gave them a break.',{karma:5},'extended-terms']]],
    ['repeat-customer','The repeat customer','The client who asked for extra time has a bigger order.',{minAge:19,company:true,requiredTags:['extended-terms']},[
      ['Take the order','The deposit cleared. I kept the email.',{cash:850,joy:3}],['Share the lead','A smaller firm got its first customer.',{karma:5},{reputation:5}],['Negotiate new terms','This contract comes with page numbers.',{smarts:5},{performance:3}]]],
    ['migrant-mail','Forwarding address','A parcel from your old home has crossed the border twice.',{minAge:18,migrant:true},[
      ['Pay the postage','The parcel contained my old address book.',{cash:-28,joy:4}],['Call home','The call lasted longer than the tracking history.',{bonds:5}],['File a claim','The form wanted the parcel’s current address.',{discipline:4}]]],
    ['citizenship-party','Two flags','Someone brought two cakes to your citizenship party.',{minAge:18,requiredTags:['naturalized']},[
      ['Invite the neighbors','The cakes introduced themselves first.',{bonds:6}],['Save a slice','My freezer acquired diplomatic duties.',{joy:4}],['Donate one','The community center supplied the forks.',{karma:6}]]],
    ['family-box','The family box','A relative brings a box labeled IMPORTANT. It is mostly menus.',{minAge:12,contact:'relative'},[
      ['Sort it together','One photograph made the whole box worthwhile.',{bonds:4},{person:'$contact',bondAmount:8}],['Scan everything','The archive includes four pizza menus.',{smarts:4},'family-archive'],['Take them to dinner','One of the places was still open.',{joy:4},{person:'$contact',bondAmount:4}]]],
    ['family-photo','The missing face','A younger relative wants a name for a face in your photo archive.',{minAge:30,requiredTags:['family-archive']},[
      ['Tell the story','The name finally got written on the back.',{bonds:6}],['Make copies','The family ordered three sets.',{cash:-15,karma:5}],['Record an interview','We kept the bit where the kettle boiled.',{smarts:4,joy:3}]]],
    ['hobby-show','The club exhibition','Your hobby club has one space left on its exhibition table.',{minAge:8,hobby:true},[
      ['Enter your work','Someone brought their parents to see it.',{joy:5},{reputation:3}],['Help a beginner','Their label was crooked. The work was good.',{karma:5}],['Organize the table','I measured the cloth twice.',{discipline:4}]]],
    ['senior-lecture','Guest speaker','The library asks what you wish you had known at twenty.',{minAge:62},[
      ['Talk about work','I shortened four decades to thirty minutes.',{smarts:3},{reputation:4}],['Talk about family','I needed a second box of tissues.',{bonds:6}],['Take questions','Someone asked about parking.',{joy:4}]]],
    ['family-company','The next owner','A relative wants to learn how your business works.',{minAge:35,company:true,contact:'relative'},[
      ['Teach the books','They spotted a subscription I had forgotten.',{smarts:3},{person:'$contact',bondAmount:8}],['Give a trial shift','They showed up before I did.',{bonds:4},'family-apprentice'],['Recommend another employer','We kept Sunday dinner free of invoices.',{discipline:4}]]],
    ['late-friend','Old number','An old friend still has the number you wrote on a bus ticket.',{minAge:45},[
      ['Pick up','We both remembered the wrong bus.',{joy:5,bonds:3}],['Meet for lunch','The lunch special outlasted our old office.',{cash:-22,bonds:5}],['Send a photograph','They recognized my coat first.',{karma:3,joy:2}]]]
  ];
  const icons=['chat','book','flag'];
  const list=scenes.map(([id,title,body,rule,choices])=>({id,title,body,rule,random:true,weight:8,label:'Life',choices:choices.map(([label,result,effects,change],i)=>({label,result,effects,icon:icons[i],change:typeof change==='string'?{tag:change}:change||{}}))}));
  root.PocketExpansionStories={list};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
