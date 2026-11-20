/* Read-only shopping inventory. The birthday and life ID determine the stock, without using the simulation's RNG. */
(function(root){
  'use strict';
  const PocketExpansionData=typeof module!=='undefined'&&module.exports?require('./expansion-data.js').PocketExpansionData:root.PocketExpansionData;
  const PocketEconomy=typeof module!=='undefined'&&module.exports?require('./economy.js').PocketEconomy:root.PocketEconomy;
  const M=typeof module!=='undefined'&&module.exports?require('./model.js').PocketModel:root.PocketModel;
  const H=typeof module!=='undefined'&&module.exports?require('./history-economy.js').PocketHistoryEconomy:root.PocketHistoryEconomy;
  const equipment={
    bike:{name:'City bicycle',category:'Equipment',icon:'bike',price:110,age:8,resale:.68,change:-.04,detail:'Ride the greenway as a yearly activity.'},
    camera:{name:'Film camera',category:'Equipment',icon:'camera',price:260,age:12,resale:.78,change:-.02,detail:'Practice taking portraits. Paid sessions open at 18.'},
    keys:{name:'Stage keyboard',category:'Equipment',icon:'keyboard',price:480,age:14,resale:.75,change:-.03,detail:'Play it at open mics. From age 18 it brings in a larger fee.'}
  };
  const shops={
    keyline:{name:'Keyline Apartments',category:'Property',focus:'Apartments, condos and city lofts',icon:'key',age:18},
    maple:{name:'Maple Street Realty',category:'Property',focus:'Starter homes, bungalows and townhouses',icon:'home',age:18},
    field:{name:'Field & Brook Land Co.',category:'Property',focus:'Rural, lakeside and coastal properties',icon:'leaf',age:18},
    crest:{name:'Crestmont Estates',category:'Property',focus:'Historic homes and luxury estates',icon:'spark',age:18},
    corner:{name:'Corner Lot Motors',category:'Vehicle',focus:'Used cars and first cars',icon:'car',age:16},
    parkway:{name:'Parkway Auto',category:'Vehicle',focus:'Family cars, hybrids and electrics',icon:'bolt',age:18},
    ridge:{name:'Ridgeway Trucks & Vans',category:'Vehicle',focus:'Pickups, vans and off-road vehicles',icon:'van',age:18},
    apex:{name:'Apex Performance',category:'Vehicle',focus:'Sports cars, grand tourers and luxury sedans',icon:'flag',age:18}
  };
  // Each home has a base asking price, annual rental income and range of bedrooms.
  const homes={
    keyline:[
      ['flat','Studio flat',24500,650,0,0],['walkup','Walk-up apartment',34000,840,1,2],
      ['gardenapt','Garden apartment',51000,1080,1,2],['loft','Converted loft',97000,1900,1,2],
      ['condo','Condominium',125000,2220,2,3],['maisonette','Maisonette',149000,2600,2,3],
      ['duplexapt','Duplex apartment',178000,3150,2,4],['highrise','High-rise apartment',215000,3600,2,4]
    ],
    maple:[
      ['mobile','Mobile home',17000,480,1,3],['tiny','Tiny house',27000,610,1,1],
      ['cottage','Garden cottage',41000,1150,1,3],['bungalow','Bungalow',77000,1450,2,3],
      ['ranch','Single-story ranch',113000,2050,2,4],['rowhouse','Brick row house',128000,2250,2,4],
      ['splitlevel','Split-level house',155000,2700,3,5],['craftsman','Craftsman house',188000,3200,3,5]
    ],
    field:[
      ['cabin','Log cabin',53000,1150,1,3],['aframe','A-frame chalet',91000,1940,2,4],
      ['houseboat','Houseboat',68000,1620,1,2],['farmhouse','Farmhouse',147000,3050,3,5],
      ['barn','Converted barn',181000,3400,2,5],['beach','Beach cottage',225000,4150,2,4],
      ['lakehouse','Lakeside house',258000,4700,3,5],['ranchland','Ranch acreage',345000,5850,3,6]
    ],
    crest:[
      ['victorian','Victorian house',286000,5200,3,6],['brownstone','Historic brownstone',330000,6100,3,5],
      ['villa','Courtyard villa',410000,7400,3,6],['penthouse','Penthouse',590000,9800,3,6],
      ['mansion','Hilltop mansion',780000,11500,5,10],['manor','Country manor',970000,16700,6,12],
      ['waterfront','Waterfront estate',1350000,22900,5,10],['castle','Small castle',2050000,31000,8,15]
    ]
  };
  // The two model names for each vehicle type are fictional.
  const cars={
    corner:[
      ['hatch','Used hatchback',3200,'Finch Pip','Orlo Zip'],['compact','Compact sedan',5800,'Aster Nook','Elan Kite'],
      ['wagon','Station wagon',6900,'Arlen Vale','Finch Caravan'],['oldcoupe','Used coupé',5400,'Orlo Finchback','Linden Dash'],
      ['minicar','City microcar',4200,'Nori Dot','Aster Midge'],['oldvan','Used minivan',7200,'Linden Porch','Arlen Herd'],
      ['liftback','Five-door liftback',8600,'Orlo Loft','Nori Breeze'],['beater','High-mileage sedan',1750,'Finch Penny','Arlen Patina']
    ],
    parkway:[
      ['family','Family sedan',23000,'Aster Elm','Linden Kindred'],['hybrid','Hybrid sedan',27900,'Nori Bloom','Orlo Pulse'],
      ['evhatch','Electric hatchback',33000,'Orlo Spark','Finch Current'],['crossover','Compact crossover',29800,'Aster Grove','Linden Rise'],
      ['minivan','Family minivan',35500,'Arlen Gather','Nori Picnic'],['estatecar','Touring wagon',38500,'Linden Passage','Finch Reach'],
      ['evsuv','Electric SUV',49500,'Aster Ion','Nori Circuit'],['saloon','Executive saloon',45900,'Arlen Bell','Linden Avenue']
    ],
    ridge:[
      ['worktruck','Work pickup',16500,'Flint Haul','Arlen Yard'],['cargo','Cargo van',21400,'Flint Parcel','Morrow Panel'],
      ['van','Camper van',7800,'Morrow Rambler','Flint Roamer'],['fourby','Trail 4×4',32000,'Flint Summit','Morrow Ridge'],
      ['crew','Crew-cab pickup',41800,'Arlen Timber','Flint Mesa'],['passvan','Passenger van',30500,'Morrow Shuttle','Arlen Circle'],
      ['trail','Off-road SUV',46800,'Flint Talus','Morrow Traverse'],['electrictruck','Electric pickup',62000,'Flint Volt','Morrow Grid']
    ],
    apex:[
      ['coupe','Sports coupé',19400,'Sable Arc','Vela Pace'],['roadster','Two-seat roadster',35500,'Vela Dart','Sable Lark'],
      ['convertible','Sport convertible',46900,'Vela Sol','Sable Traverse'],['gt','Grand tourer',86500,'Aurell Atlas','Vela Meridian'],
      ['luxury','Luxury sedan',78000,'Aurell Regent','Sable Embassy'],['muscle','Muscle car',52000,'Sable Hammer','Arlen Tempest'],
      ['evsport','Electric sports car',111000,'Vela Flux','Aurell Vector'],['supercar','Mid-engine supercar',252000,'Vela Vesper','Aurell Syren']
    ]
  };
  Object.assign(shops,PocketExpansionData.shops);Object.assign(homes,PocketExpansionData.homes);Object.assign(cars,PocketExpansionData.cars);
  const catalog={...equipment};
  for(const [shop,rows] of Object.entries(homes)){
    for(const [type,name,price,rent,minBeds,maxBeds] of rows){
      catalog[type]={type,name,category:'Property',shop,icon:'home',age:18,price,rent,minBeds,maxBeds,resale:.94,change:.025};
    }
  }
  for(const [shop,rows] of Object.entries(cars)){
    for(const [type,name,price,modelA,modelB] of rows){
      catalog[type]={type,name,category:'Vehicle',shop,icon:shop==='velo'?'bike':shop==='ridge'||shop==='freight'||type==='minivan'||type==='oldvan'?'van':'car',
        age:shops[shop].age,price,models:[modelA,modelB],resale:.84,change:-.08};
    }
  }
  // The terms and descriptions of existing deeds and vehicles are part of older saves.
  Object.assign(catalog.flat,{detail:'Its parking space brings in $650 each year.'});
  Object.assign(catalog.cottage,{detail:'Its guest room brings in $1,150 each year.'});
  Object.assign(catalog.rowhouse,{resale:.95,change:.026,detail:'The downstairs studio earns $2,250 per year.'});
  Object.assign(catalog.lakehouse,{resale:.95,change:.029,detail:'A vacation suite brings in $4,700 per year.'});
  Object.assign(catalog.mansion,{resale:.96,change:.032,detail:'The guest house earns $11,500 in annual rent.'});
  Object.assign(catalog.hatch,{resale:.82,detail:'Take a road trip on your own schedule.'});
  Object.assign(catalog.van,{resale:.83,change:-.06,detail:'Take road trips and host a traveling supper.'});
  Object.assign(catalog.coupe,{name:'City coupé',detail:'A two-seater for weekend road trips.'});
  Object.assign(catalog.luxury,{resale:.87,change:-.09,detail:'Heated seats. Very expensive tires.'});
  const streets=['Alder Lane','Cedar Street','Maple Terrace','Station Road','Pear Tree Lane','Willow Drive','Mill Road','Linden Court','East Hill','Orchard Way','Market Street','Ivy Place','River Road','Elm Street','Bay View','West Avenue'];
  const productionYears={woodie:[1932,1953],bubble:[1953,1972],classicgt:[1957,1984],pony:[1964,1979],prewar:[1920,1939],rally:[1973,1995],oldtruck:[1946,1979],classicspyder:[1953,1976]};
  // First modeled sales years for newer production lines. Vintage vehicles retain their actual model years.
  const technologyYears={hybrid:1997,evhatch:2010,evsuv:2015,electrictruck:2020,evsport:2008,electricbike:2008,hyperhybrid:2013,electricgt:2015,luxsuv:2002};
  const colors=['black','red','forest green','pearl white','blue','silver','navy','copper','charcoal','yellow'];
  function byDraw(keys,seed){
    return keys.map(key=>[M.hash(seed+'/'+key),key]).sort((a,b)=>a[0]-b[0]||a[1].localeCompare(b[1])).map(pair=>pair[1]);
  }
  function localScope(life,category){
    return category==='Property'&&life.sim.residences&&life.sim.residences.length?'_'+life.town:'';
  }
  function quote(life,type,slot,shopIndex){
    const base=catalog[type],shop=base.shop,year=life.born+life.age;
    const id='lot_'+life.id+localScope(life,base.category)+'_'+life.age+'_'+type;
    const draw=(field,size)=>M.hash(id+'/'+field)%size;
    const listing={id,type,shop,listedYear:year};
    if(base.category==='Property'){
      listing.town=life.town;
      listing.condition=49+draw('condition',51);
      listing.price=Math.round(base.price*(.46+listing.condition*.005+draw('demand',30)/100)/50)*50;
      listing.rent=Math.round(base.rent*listing.price/base.price);
      listing.address=(1+draw('number',56)*16+shopIndex*3+slot)+' '+streets[draw('street',streets.length)];
      listing.beds=base.minBeds+draw('bedrooms',base.maxBeds-base.minBeds+1);
      listing.baths=Math.max(1,Math.ceil(listing.beds/2)+(listing.beds>=3?draw('bathrooms',2):0));
      if(shop==='quay'){listing.commercial=true;listing.floorArea=85+draw('floor',700)*(type==='officetower'?15:1);}
      listing.built=year-1-draw('built',shop==='crest'?110:65);
    }else{
      const usedLot=shop==='corner',brandNew=shop!=='chrome'&&!usedLot&&type!=='van'&&draw('new',4)===0;
      const era=productionYears[type],age=brandNew?0:usedLot?5+draw('years',16):1+draw('years',type==='van'?16:9);
      listing.modelYear=era?Math.min(year-25,era[0]+draw('vintage',era[1]-era[0]+1)):year-age;
      if(H.enabled(life)&&technologyYears[type])listing.modelYear=Math.max(technologyYears[type],listing.modelYear);
      const yearsOld=year-listing.modelYear;
      listing.miles=brandNew?draw('delivery',35):yearsOld*(era?450+draw('annual',1800):4700+draw('annual',7600))+draw('extra',3500);
      listing.condition=brandNew?100:Math.max(29,Math.min(98,99-Math.round(listing.miles/3900)-draw('wear',12)));
      listing.model=base.models[draw('model',2)];
      listing.color=colors[draw('paint',colors.length)];
      listing.newCar=brandNew;
      listing.price=Math.max(350,Math.round(base.price*(.46+listing.condition*.005+draw('demand',26)/100+(brandNew?.12:0))/25)*25);
    }
    if(life.sim.expansion){
      const e=PocketEconomy.local(life),scale=base.category==='Property'?e.home:e.vehicle;
      listing.price=Math.max(200,Math.round(listing.price*scale/25)*25);
      if(listing.rent){listing.rent=Math.max(100,Math.round(listing.rent*e.cost));listing.rentIndex=e.cost;}
    }
    return {...base,...listing,listing};
  }
  function inventory(life,shop){
    const info=shops[shop];
    if(H.historical(life))return [];
    if(!Object.prototype.hasOwnProperty.call(shops,shop)||life.age<info.age||life.ended)return [];
    const rows=(homes[shop]||cars[shop]),seed=life.id+localScope(life,info.category)+'/'+shop;
    const zone=life.sim.expansion?'/'+life.town:'';
    const typesAvailable=rows.map(row=>row[0]).filter(type=>!H.enabled(life)||!technologyYears[type]||life.born+life.age>=technologyYears[type]);
    if(!typesAvailable.length)return [];
    const order=byDraw(typesAvailable,seed+zone);
    // Adjacent years each have an exclusive type. The other two positions vary independently.
    const position=life.age%order.length,anchor=order[position],last=order[(position+order.length-1)%order.length],next=order[(position+1)%order.length];
    const alternatives=order.filter(type=>type!==anchor&&type!==last&&type!==next);
    const types=[anchor,...byDraw(alternatives,seed+zone+'/'+life.age+(life.sim.expansion?'/'+PocketEconomy.local(life).phase:'')).slice(0,2)];
    const shopIndex=Object.keys(shops).indexOf(shop);
    return types.map((type,slot)=>quote(life,type,slot,shopIndex))
      .filter(item=>!life.world.owned[item.id]&&!life.used.includes('bought/'+item.id))
      .sort((a,b)=>a.price-b.price);
  }
  function gear(life){
    if(H.historical(life))return [];
    return Object.entries(equipment).filter(([id,item])=>life.age>=item.age&&!life.world.owned[id]&&!life.ended)
      .map(([id,item])=>({...item,id,type:id}));
  }
  function offer(life,id){
    if(typeof id!=='string')return null;
    if(Object.prototype.hasOwnProperty.call(equipment,id))return gear(life).find(item=>item.id===id)||null;
    const type=id.slice(id.lastIndexOf('_')+1);
    if(!id.startsWith('lot_')||!Object.prototype.hasOwnProperty.call(catalog,type)||!catalog[type].shop)return null;
    return inventory(life,catalog[type].shop).find(item=>item.id===id)||null;
  }
  function ownedItem(id,asset){
    if(!asset)return null;
    if(asset.listing)return {...catalog[asset.listing.type],...asset.listing,town:asset.listing.town||asset.town,listing:asset.listing};
    if(!Object.prototype.hasOwnProperty.call(catalog,id))return null;
    return asset.town?{...catalog[id],town:asset.town}:catalog[id];
  }
  function take(life,item){
    const asset={at:life.age,condition:item.listing?item.condition:95,share:1,value:Math.round(item.price*item.resale)};
    if(item.listing){
      asset.listing={...item.listing};
      if(item.category==='Vehicle')asset.odometer=item.miles;
      life.used.push('bought/'+item.id);
    }
    life.world.owned[item.id]=asset;
  }
  function title(item){
    if(!item.listing||item.historical)return item.name;
    return item.category==='Property'?item.name+' at '+item.address:item.modelYear+' '+item.model;
  }
  function inSentence(item){
    if(item.listing&&item.category==='Vehicle')return 'the '+title(item);
    return 'the '+item.name.toLowerCase()+(item.address?' at '+item.address:'');
  }
  function summary(item,asset){
    if(item.historical)return item.name+' · acquired '+item.listedYear+' · '+(asset?asset.condition:item.condition)+'% condition';
    if(!item.listing)return item.detail||item.name;
    if(item.category==='Property'){
      if(item.commercial)return item.address+' · '+item.floorArea.toLocaleString('en-US')+' m² commercial space';
      const rooms=item.beds?item.beds+' bed':'Studio';
      return item.address+' · '+rooms+' · '+item.baths+' bath';
    }
    const miles=asset&&Number.isFinite(asset.odometer)?asset.odometer:item.miles;
    return item.name+' · '+(asset?.paint||item.color)+' · '+miles.toLocaleString('en-US')+' mi';
  }
  root.PocketMarket={catalog,shops,inventory,gear,offer,ownedItem,take,title,inSentence,summary};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
