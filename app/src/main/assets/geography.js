/* Country display names adapted from Unicode CLDR.
COPYRIGHT AND PERMISSION NOTICE

Copyright © 2001–2026 Unicode, Inc.

Unicode Technical Standard #35, Unicode Locale Data Markup Language
(LDML) made available in this repository is protected by copyright, and
permission must be obtained from Unicode, Inc. prior to any
reproduction, modification, or other use not permitted by the Unicode
Terms of Use <https://www.unicode.org/copyright.html>. Specifically, you
may make copies of this publication and may annotate and translate it
solely for personal or internal business purposes and not for public
distribution, provided that any such permitted copies and modifications
fully reproduce all copyright and other legal notices contained in the
original. You may not make copies of or modifications to this
publication for public distribution, or incorporate it in whole or in
part into any product or publication without the express written
permission of Unicode. Notwithstanding the foregoing, you may within
this repository provide comments and propose changes to this standard
and may make copies/forks solely for such purposes provided that you
reproduce this copyright notice and these terms of use in any such
copy/fork.

All other content in this repo is released under UNICODE LICENSE V3

NOTICE TO USER: Carefully read the following legal agreement. BY
DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.

Permission is hereby granted, free of charge, to any person obtaining a
copy of data files and any associated documentation (the "Data Files") or
software and any associated documentation (the "Software") to deal in the
Data Files or Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, and/or sell
copies of the Data Files or Software, and to permit persons to whom the
Data Files or Software are furnished to do so, provided that either (a)
this copyright and permission notice appear with all copies of the Data
Files or Software, or (b) this copyright and permission notice appear in
associated Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
THIRD PARTY RIGHTS.

IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall
not be used in advertising or otherwise to promote the sale, use or other
dealings in these Data Files or Software without prior written
authorization of the copyright holder.

SPDX-License-Identifier: Unicode-3.0
*/
/* Offline geographic identities, display labels and read-only search. Save files store the city key. */
(function(root){
  'use strict';
  const data=typeof module!=='undefined'&&module.exports?require('./places-data.js').PocketPlaceData:root.PocketPlaceData;
  const countries=Object.create(null),cities=Object.create(null),places=Object.create(null);
  const oldTownIds=new Set(['cedar','briar','sunfield','atlanta','seattle','london','bristol','toronto','vancouver','osaka','kyoto','recife','saopaulo','melbourne','perth']);
  const oldTownLabels=Object.create(null);
  const original=[['cedar','Cedar Bay','cedar'],['briar','Briar Glen','briar'],['sunfield','Sunfield','sunfield']];
  const oldLabels={US:'USA',GB:'UK'};
  const collate=new Intl.Collator('en',{sensitivity:'base',numeric:true});
  function normalize(value){
    return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
      .replace(/ß/g,'ss').replace(/ø/g,'o').replace(/ł/g,'l').replace(/æ/g,'ae').replace(/œ/g,'oe')
      .replace(/[’'ʻ‘]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  }
  function keywords(values){
    return [...new Set(values.filter(Boolean).map(normalize).filter(Boolean))];
  }
  function addCity(country,row,legacy=false){
    const [id,name,art,region,aliases='']=row;
    const label=region?name+' ('+region+')':name;
    const city={id,code:country.code,name,option:legacy?label+' (original town)':label,region:region||'',art,legacy,
      terms:keywords([name,label,...aliases.split('|')]),order:country.cities.length};
    city.words=[...new Set(city.terms.flatMap(t=>t.split(' ')))];
    countries[country.code].cities.push(city);
    cities[id]=city;
    places[id]=[legacy?name:name+', '+(oldLabels[country.code]||country.name),art];
    if(oldTownIds.has(id))oldTownLabels[places[id][0]]=id;
  }
  for(const row of data){
    const country={code:row.code,name:row.name,group:row.group,terms:keywords([row.name,row.code,...row.aliases.split('|')]),cities:[]};
    country.words=[...new Set(country.terms.flatMap(t=>t.split(' ')))];
    countries[country.code]=country;
    for(const item of row.cities)addCity(country,item);
  }
  const randomCountries=data.map(row=>({code:row.code,ids:countries[row.code].cities.map(city=>city.id)}));
  for(const item of original)addCity(countries.US,item,true);
  const countryList=Object.values(countries).sort((a,b)=>collate.compare(a.name,b.name));
  const cityList=Object.values(cities);
  const realCount=cityList.length-original.length;
  function label(id){
    const city=cities[id];
    return city?city.name+', '+countries[city.code].name:'';
  }
  function stateCountry(id){
    const city=cities[id];return oldLabels[city.code]||countries[city.code].name;
  }
  function randomCity(roll){
    const position=roll*randomCountries.length,index=Math.min(randomCountries.length-1,Math.floor(position));
    const group=randomCountries[index].ids;
    return group[Math.min(group.length-1,Math.floor((position-index)*group.length))];
  }
  function score(terms,q){
    if(terms.includes(q))return 0;
    if(terms.some(t=>t.startsWith(q)))return 1;
    if(terms.some(t=>t.includes(' '+q)))return 2;
    return 8;
  }
  function search(input,preferredCode='',limit=10){
    const query=normalize(input);if(!query||limit<1)return [];
    const words=query.split(' '),hits=[];
    for(const country of countryList){
      const rank=score(country.terms,query);
      if(rank<8)hits.push({kind:'country',id:country.code,label:country.name,rank:rank*4,order:0});
    }
    for(const city of cityList){
      let rank=score(city.terms,query);
      if(rank===8&&words.length>1){
        const placeWords=words.filter(w=>city.words.some(token=>token.startsWith(w)));
        if(placeWords.length&&words.every(w=>placeWords.includes(w)||countries[city.code].words.some(token=>token.startsWith(w))))rank=2;
      }
      if(rank<8)hits.push({kind:'city',id:city.id,label:city.option,code:city.code,rank:rank*4+1+(city.code===preferredCode?0:1),order:city.order});
    }
    return hits.sort((a,b)=>a.rank-b.rank||a.order-b.order||collate.compare(a.label,b.label)||a.id.localeCompare(b.id)).slice(0,limit);
  }
  function international(origin,target){
    return countries[cities[origin].code].group!==countries[cities[target].code].group;
  }
  root.PocketGeography={countries,countryList,cities,places,oldTownLabels,realCount,label,stateCountry,randomCity,search,international};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
