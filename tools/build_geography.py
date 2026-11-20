"""Build the offline city directory from Natural Earth, GeoNames, country-codes and ISO 3166-1 snapshots."""
import argparse
import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

STATIC = Path(__file__).resolve().parents[1] / 'app/src/main/assets'
# These territories have no permanent civilian towns for a household move.
OMIT = {'AQ', 'BV', 'GS', 'HM', 'IO', 'TF', 'UM'}
COUNTRY_NAMES = {
    'US':'United States', 'GB':'United Kingdom', 'CD':'Democratic Republic of the Congo',
    'CG':'Republic of the Congo', 'CI':"Côte d’Ivoire", 'CV':'Cabo Verde', 'TR':'Türkiye',
    'FM':'Federated States of Micronesia', 'MO':'Macau', 'MM':'Myanmar',
    'VA':'Vatican City', 'PS':'Palestine', 'TW':'Taiwan', 'XK':'Kosovo',
}
COUNTRY_ALIASES = {
    'US':'USA|U.S.A.|United States of America|America', 'GB':'UK|Great Britain|Britain|England|Scotland|Wales|Northern Ireland',
    'CD':'DR Congo|DRC|Congo Kinshasa', 'CG':'Congo Brazzaville', 'CZ':'Czech Republic',
    'CI':'Ivory Coast', 'CV':'Cape Verde', 'TR':'Turkey|Turkiye', 'SZ':'Swaziland',
    'MM':'Burma', 'MK':'Macedonia', 'AE':'UAE|Emirates', 'TL':'East Timor',
    'KR':'Republic of Korea|Korea', 'KP':'North Korea|DPRK', 'LA':'Lao PDR|Laos',
    'VA':'Holy See', 'PS':'State of Palestine|Palestinian Territories', 'NL':'Holland',
    'FM':'Micronesia', 'TW':'Taiwan|Chinese Taipei', 'MO':'Macao', 'NZ':'Aotearoa',
    'VN':'Viet Nam', 'DE':'Deutschland', 'JP':'Nippon|日本', 'CN':'China|中国',
    'IN':'Bharat|भारत', 'LK':'Ceylon', 'KH':'Kampuchea', 'SA':'KSA',
}
# Current English display names, common endonyms and alternate spellings for searches.
CITY_NAMES = {
    ('US','New York'):('New York City','NYC|New York'), ('US','Washington, D.C.'):('Washington, D.C.','Washington DC|Washington'),
    ('CN','Shenyeng'):('Shenyang','Shenyeng'), ('KZ','Nur-Sultan'):('Astana','Nur-Sultan|Nursultan'),
    ('ZA','Port Elizabeth'):('Gqeberha','Port Elizabeth'), ('UA','Odessa'):('Odesa','Odessa'),
    ('UA','Kyiv'):('Kyiv','Kiev'), ('JP','Ōsaka'):('Osaka','Ōsaka|大阪'),
    ('JP','Tokyo'):('Tokyo','Tōkyō|東京'), ('JP','Kyoto'):('Kyoto','Kyōto|京都'),
    ('CN','Beijing'):('Beijing','Peking|北京'), ('CN','Shanghai'):('Shanghai','上海'),
    ('KR','Seoul'):('Seoul','서울'), ('TH','Bangkok'):('Bangkok','Krung Thep'),
    ('IN','Mumbai'):('Mumbai','Bombay'), ('IN','Chennai'):('Chennai','Madras'),
    ('IN','Kolkata'):('Kolkata','Calcutta'), ('IN','Bengaluru'):('Bengaluru','Bangalore'),
    ('IT','Rome'):('Rome','Roma'), ('IT','Milan'):('Milan','Milano'),
    ('DE','Munich'):('Munich','München|Muenchen'), ('DE','Cologne'):('Cologne','Köln|Koeln'),
    ('AT','Vienna'):('Vienna','Wien'), ('CZ','Prague'):('Prague','Praha'),
    ('GR','Athens'):('Athens','Athina|Αθήνα'), ('EG','Cairo'):('Cairo','Al Qahirah|القاهرة'),
    ('MX','Mexico City'):('Mexico City','Ciudad de México|CDMX'),
    ('BR','Rio de Janeiro'):('Rio de Janeiro','Rio'), ('BR','São Paulo'):('São Paulo','Sao Paulo'),
    ('AE','Al Ayn'):('Al Ain','Al Ayn'), ('AE','Dubayy'):('Dubai','Dubai'),
    ('PS','Al Khalil'):('Hebron','Al Khalil'), ('MV','Male'):('Malé','Male'),
    ('KI','Tarawa'):('South Tarawa','Tarawa'), ('WS','Apia'):('Apia','Āpia'),
    ('XK','Pec'):('Pejë','Peć|Pec'), ('AS','Pago Pago'):('Pago Pago','Pago'),
}
# GeoNames largest-settlement lists supply places below the 15,000-person extract.
SMALL_PLACES = {
    'AG':['All Saints','Liberta','Codrington'], 'BB':['Speightstown','Oistins','Bathsheba'],
    'DM':['Portsmouth','Marigot','Mahaut'], 'FM':['Weno','Tofol','Colonia','Kolonia'],
    'GD':['Gouyave','Grenville','Victoria'], 'KI':['Betio Village','Bikenibeu Village','Bairiki Village'],
    'MH':['Ebeye','Laura','Jabor'], 'SC':['Cascade','Baie Sainte Anne','Anse aux Pins'],
    'KN':['Sandy Point Town','Fig Tree','Middle Island'], 'LC':['Dennery','Laborie','Choiseul'],
    'VC':['Georgetown','Diamond','New Montrose'], 'TV':['Savave Village','Teava Village','Tanrake Village'],
    'TO':['Mu‘a','Haveluloto','Vainī'], 'VU':['Norsup','Isangel','Port-Olry'], 'ST':['Neves','Água Izé','Almas'],
    'LI':['Schaan','Triesen','Balzers'], 'MV':['Fuvahmulah','Hithadhoo','Kulhudhuffushi'],
    'NR':['Arijejen','Denigomodu','Menen'], 'SM':['Serravalle','Dogana','Borgo Maggiore'],
    'TK':['Nukunonu','Atafu Village','Fale'], 'WS':['Vaitele','Asau','Mulifanua'],
}
# Keep the location keys used by released saves, and the existing art for those locations.
LEGACY = {
    ('US','Atlanta'):('atlanta','sunfield'), ('US','Seattle'):('seattle','cedar'),
    ('GB','London'):('london','briar'), ('GB','Bristol'):('bristol','cedar'),
    ('CA','Toronto'):('toronto','briar'), ('CA','Vancouver'):('vancouver','cedar'),
    ('JP','Osaka'):('osaka','cedar'), ('JP','Kyoto'):('kyoto','briar'),
    ('BR','Recife'):('recife','cedar'), ('BR','São Paulo'):('saopaulo','sunfield'),
    ('AU','Melbourne'):('melbourne','briar'), ('AU','Perth'):('perth','sunfield'),
}
EXTRA_MATCHES = {
    'GQ':['Ciudad de la Paz'], 'PS':['Bethlehem','East Jerusalem','Jenin','Hebron','Ramallah'],
    'PW':['Ngerulmud'], 'KE':['Nakuru'], 'GB':['Edinburgh','Belfast','Aberdeen'],
    'US':['Honolulu','Anchorage','Sacramento','Milwaukee'], 'CA':['Québec','Halifax'],
}
def key(value):
    text=unicodedata.normalize('NFKD',str(value or '')).casefold()
    text=re.sub(r'\bst[. ]+', 'saint ', text)
    return ''.join(c for c in text if c.isalnum())

def csv_rows(path):
    with path.open(encoding='utf-8-sig',newline='') as f:
        return list(csv.DictReader(f))

def build(natural, geo, codes, iso, out):
    official=json.loads(iso.read_text())['3166-1']
    lookup={r[k]:r['alpha_2'] for r in official for k in ('name','common_name','official_name') if k in r}
    lookup['Kosovo']='XK'
    records={r['ISO3166-1-Alpha-2']:r for r in csv_rows(codes)}
    records['XK']={'CLDR display name':'Kosovo','is_independent':'','Capital':'Pristina'}
    assert set(records)=={r['alpha_2'] for r in official}|{'XK'}
    natural_by=defaultdict(list)
    for feature in json.loads(natural.read_text())['features']:
        city=feature['properties']; code=city['iso_a2']
        if code=='-99':code={'KOS':'XK','SOL':'SO','CYN':'CY'}[city['adm0_a3']]
        if city['featurecla'].lower() in ('scientific station','meteorological station','historic place'):continue
        if (code,city['name']) in {('MS','Plymouth'),('CY','Northern Nicosia')}:continue
        if code in records and code not in OMIT:natural_by[code].append(city)
    geo_by=defaultdict(list)
    for row in csv_rows(geo):
        code=lookup[row['country']]
        if code not in OMIT:geo_by[code].append(row)
    result=[]; keys=set()
    for code,record in sorted(records.items()):
        if code in OMIT:continue
        name=COUNTRY_NAMES.get(code,record['CLDR display name']).replace(' & ',' and ')
        state=record['is_independent']
        parent=state.split()[-1] if state.startswith(('Part of ','Territory of ','Commonwealth of ','Crown dependency of ')) else code
        towns=[]; aliases={}
        def put(identifier,raw,region='',population=0,lat=None,old_aliases=(),natural_record=False):
            raw=' '.join(raw.split())
            preferred,extra=CITY_NAMES.get((code,raw),(raw,''))
            choices={str(a).strip() for a in [raw,*old_aliases,*extra.split('|')] if a and str(a).strip() and len(str(a).strip())<=54}
            choices.discard(preferred)
            old=aliases.get(key(preferred))
            if old and (not natural_record or not region or not old['region'] or key(old['region'])==key(region)):
                old['aliases'].update(choices);return
            legacy=LEGACY.get((code,preferred))
            if legacy:identifier,art=legacy
            else:art='sunfield' if lat is not None and abs(lat)<28 else 'briar' if population>=150000 else 'cedar'
            if identifier in keys:raise ValueError(identifier)
            keys.add(identifier)
            town=dict(id=identifier,name=preferred,region=region or '',art=art,aliases=choices,pop=population)
            towns.append(town)
            for a in [preferred,*choices]:aliases.setdefault(key(a),town)
        ranked=sorted(natural_by[code],key=lambda c:-c['pop_max'])
        for n,c in enumerate(ranked):
            if n>=12 and c['pop_max']<100000 and not (c['adm0cap'] or c['capalt'] or c['worldcity'] or (code,c['name']) in LEGACY):continue
            alternates=re.split('[|;]',c['namealt'] or '')+[c['nameascii']]
            put('n'+str(c['ne_id']),c['name'],c['adm1name'],c['pop_max'],c['latitude'],alternates,True)
        supplements=geo_by[code]; requested={key(v) for v in EXTRA_MATCHES.get(code,[])}
        for r in supplements:
            if code in ('SG','MC','HK','MO','VA') and towns:break
            if code=='MS' and r['name']=='Plymouth':continue
            if len(supplements)<=32 or key(r['name']) in requested:
                put('g'+r['geonameid'],r['name'],r['subcountry'])
        for city in SMALL_PLACES.get(code,[]):
            put('s'+code.lower()+key(city),city)
        if not towns:raise ValueError('No inhabited location for '+code)
        counts=Counter(key(t['name']) for t in towns)
        data=[]
        for t in sorted(towns,key=lambda t:(-t['pop'],key(t['name']),t['id'])):
            region=t['region'] if counts[key(t['name'])]>1 else ''
            row=[t['id'],t['name'],t['art'],region,'|'.join(sorted(t['aliases']))]
            while row[-1]=='':row.pop()
            data.append(row)
        entry={'code':code,'name':name,'group':parent,'aliases':COUNTRY_ALIASES.get(code,''),'cities':data}
        result.append(entry)
    assert set(v[0] for v in LEGACY.values())<=keys
    assert len(result)==len(records)-len(OMIT)
    with out.open('w',encoding='utf-8') as f:
        f.write('/* Offline place data generated by tools/build_geography.py. Sources and credits are in GEOGRAPHY.md. */\n(function(root){\n  root.PocketPlaceData=[\n')
        for i,r in enumerate(result):
            meta={k:v for k,v in r.items() if k!='cities'}
            f.write('    '+json.dumps(meta,ensure_ascii=False)[:-1]+', "cities":[\n')
            for j,row in enumerate(r['cities']):
                f.write('      '+json.dumps(row,ensure_ascii=False)+(',' if j<len(r['cities'])-1 else '')+'\n')
            f.write('    ]}'+(',' if i<len(result)-1 else '')+'\n')
        f.write("  ];\n})(typeof module!=='undefined'&&module.exports?module.exports:window);\n")
    print(len(result),'countries and territories,',len(keys),'real cities and settlements')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for arg in ('natural','geo','codes','iso'):parser.add_argument(arg,type=Path)
    parser.add_argument('--out',type=Path,default=STATIC/'places-data.js')
    args=parser.parse_args();build(args.natural,args.geo,args.codes,args.iso,args.out)
