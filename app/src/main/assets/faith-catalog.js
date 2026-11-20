/* An offline reference for the annual simulation. The first selectable year
   is a gameplay boundary, not a claim about a tradition's exact founding.
   Local presence describes historical connections, never an NPC's beliefs. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const world=node?require('./history-world.js').PocketHistoryWorld:root.PocketHistoryWorld;
  const geo=node?require('./geography.js').PocketGeography:root.PocketGeography;
  const P='https://pluralism.org/';
  const sources={
    christian:P+'christianity',catholic:P+'sites/g/files/omnuum10836/files/pluralism/files/the_roman_catholic_church_and_the_catholic_communion_1.pdf',
    orthodox:P+'orthodox-christian-churches',protestant:P+'protestant',easter:P+'sites/g/files/omnuum10836/files/pluralism/files/ash_wednesday_to_easter_sunday_0.pdf',
    anglican:'https://www.churchofengland.org/about/church-and-state/church-and-monarch/queen-her-faith-and-life-supreme-governor',
    methodist:'https://www.umc.org/content/the-general-rules-of-the-methodist-church',
    islam:P+'islamic-practices',shia:P+'sites/g/files/omnuum10836/files/pluralism/files/27._shii_remembrance_of_husayn.pdf',
    shabbat:P+'keeping-shabbat',jewish:P+'sites/g/files/omnuum10836/files/pluralism/files/classical_reform_0.pdf',
    reform:'https://reformjudaism.org/beliefs-practices/what-reform-judaism/history-reform-judaism-and-look-ahead-search-belonging',
    conservative:'https://www.jtsa.edu/wp-content/uploads/2024/10/2004.pdf',
    hindu:P+'hinduism-0',shiva:P+'the-great-night-of-shiva',buddhism:P+'sites/g/files/omnuum10836/files/pluralism/files/the_expansion_of_buddhism_1.pdf',
    sutras:P+'chanting-the-sutras',sikh:'https://www.sikhcoalition.org/wp-content/uploads/2018/08/Sikhism-educator-guide.pdf',
    gurdwara:P+'sites/g/files/omnuum10836/files/pluralism/files/the_gurdwara.pdf',jain:P+'ahimsa-in-daily-life',
    shinto:P+'purification-wand-or-waterfall',dao:P+'daoism-0',confucian:P+'the-scholarly-tradition',
    zoro:P+'a-visit-to-a-dar-e-mehr',bahai:'https://reference.bahai.org/en/t/b/KA/ka-155.html',bahaiPractice:P+'feasts-firesides-and-core-activities',
    yoruba:'https://ich.unesco.org/en/RL/ifa-divination-system-00146',andes:'https://americanindian.si.edu/nk360/inka-water/reciprocity/reciprocity',
    maori:'https://teara.govt.nz/en/traditional-maori-religion-nga-karakia-a-te-maori',gadigal:'https://www.nma.gov.au/exhibitions/warrane',
    humanist:P+'humanism-as-a-belief-system',ethical:'https://heritage.humanists.uk/the-union-of-ethical-societies/',
    emblems:'https://www.edu.gov.mb.ca/k12/docs/support/world_religions/full_doc.pdf',
    haudenosaunee:'https://americanindian.si.edu/collections-search/object/posts_da6905c1353a6fa4dd5573c214bb6318',
    vodou:P+'vodou-serving-the-spirits',ibadi:'https://www.encyclopedia.com/religion/encyclopedias-almanacs-transcripts-and-maps/ibadis',
    lutheran:'https://lutheranworld.org/sites/default/files/2022-02/From%20Conflict%20to%20Communion%20EN.pdf',
    reformed:'https://www.history.pcusa.org/sites/default/files/u40/Reformation%20Sunday%202010%20undated.pdf',
    baptist:'https://baptistworld.org/bwa-resolutions/400th-anniversary-of-the-formation-of-the-first-baptist-congregation/',
    nonbelief:'https://plato.stanford.edu/entries/atheism-agnosticism/',huxley:'https://heritage.humanists.uk/thomas-henry-huxley/'
  };
  const holiday=(name,timing,calendar)=>({name,timing,calendar});
  const christianHoliday=holiday('Easter','A Sunday in spring in the Northern Hemisphere. Eastern and Western reckonings can give different dates.','Ecclesiastical lunar reckoning');
  const muslimHoliday=holiday('Eid al-Fitr','The first day of Shawwal follows Ramadan. Local dates can differ.','Islamic lunar calendar');
  const jewishHoliday=holiday('Passover','Begins at sunset as 15 Nisan starts.','Hebrew lunisolar calendar');
  const buddhistHoliday=holiday('Buddha’s birthday','Many communities use a lunar observance. Names and dates vary by region.','Local Buddhist calendar');
  const householdHoliday=holiday('Family remembrance','The family or community chooses a gathering time.','Local custom');
  const secularHoliday=holiday('Personal observance','Choose a family anniversary or community gathering.','Individual choice');
  const traditions=[],byId=new Map();
  // Each record has three actionable practices and a service, teaching and
  // leadership role. The role labels distinguish ordained and lay institutions.
  function rows(input){
    return input.map(([kind,name,description],i)=>({id:kind+'-'+(i+1),kind,name,description}));
  }
  function add(def){
    const item={...def,regions:[],rites:rows(def.rites),roles:rows(def.roles),fictional:!!def.fictional,secular:!!def.secular,
      sources:def.sources.map(k=>sources[k]),holidays:[...def.holidays]};
    item.presence=(def.presence||'').split(';').filter(Boolean).map(rule=>{
      const [since,locations]=rule.split(':');return {year:Number(since),locations:locations.split(' ')};
    });
    item.regions=[...new Set(item.presence.flatMap(rule=>rule.locations.flatMap(token=>regionOf(token))))];
    byId.set(item.id,item);traditions.push(item);return item;
  }
  const regionByCode={};for(const c of geo.countryList)regionByCode[c.code]=world.region(c.cities[0].id);
  function regionOf(token){return token==='*'?Object.values(regionByCode):geo.cities[token]?world.region(token):regionByCode[token]||token;}
  const roles=(helper,teacher,leader)=>[['service',helper,'Organize the gathering and care for its shared resources.'],['education',teacher,'Prepare lessons and answer questions from participants.'],['leadership',leader,'Accept responsibility for the work and welfare of this community.']];
  const christian={
    family:'Christianity',start:1200,institution:'Parish church',sources:['christian','easter'],holidays:[christianHoliday],
    rites:[['worship','Join a service','Gather with the congregation for prayer and readings.'],['study','Read the Gospels','Study a passage with a teacher.'],['service','Visit an isolated neighbor','Deliver food and spend time together.']],
    roles:roles('Parish caretaker','Scripture teacher','Parish priest')
  };
  add({...christian,id:'catholic',name:'Catholic Christianity',summary:'A worldwide communion centered on the Eucharist and connected with the bishop of Rome.',origin:'Roots in the early Christian communities of the first century CE.',presence:'1200:europe;1500:MX BR PE CO;1571:PH;1800:americas;1900:oceania',sources:['catholic','easter']});
  add({...christian,id:'orthodox',name:'Eastern Orthodox Christianity',summary:'Local churches share the Divine Liturgy and a tradition of councils, icons and monastic life.',origin:'An ancient eastern Christian communion. The separation with Rome developed over centuries.',presence:'1200:GR TR CY BG RS RO RU UA GE;1850:americas',institution:'Orthodox parish',sources:['orthodox','easter']});
  add({...christian,id:'oriental-orthodox',name:'Oriental Orthodox Christianity',summary:'A family of churches including Coptic, Armenian and Ethiopian traditions, with distinct liturgies and languages.',origin:'This communion traces its distinct history to the disputes surrounding the Council of Chalcedon in 451 CE.',presence:'1200:EG ET ER AM SY;1900:americas',institution:'Local Oriental Orthodox church',sources:['orthodox']});
  const reformers={...christian,sources:['protestant','easter'],roles:roles('Congregation caretaker','Bible teacher','Minister'),institution:'Congregation'};
  add({...reformers,id:'protestant',name:'Protestant Christianity',start:1517,origin:'European Reformations in the sixteenth century. The simulation opens this path with Luther’s public challenge in 1517.',summary:'A broad family of Christian reform traditions with differing practices and forms of church government.',presence:'1517:DE CH;1550:europe;1630:US;1850:oceania;1900:americas'});
  add({...reformers,id:'lutheran',name:'Lutheran Christianity',start:1530,origin:'Martin Luther and other reformers in sixteenth-century Europe. The Augsburg Confession dates to 1530.',summary:'Congregations emphasize grace, preaching, baptism and the Lord’s Supper.',presence:'1530:DE;1560:DK NO SE FI;1850:US',sources:['protestant','lutheran']});
  add({...reformers,id:'anglican',name:'Anglican Christianity',start:1534,origin:'The English Reformation included the break with papal authority in 1534.',summary:'A Christian tradition of shared prayer, bishops, parish worship and service.',presence:'1534:GB;1610:US;1800:CA AU NZ',institution:'Anglican parish',sources:['anglican','easter'],roles:roles('Parish caretaker','Parish teacher','Parish priest')});
  add({...reformers,id:'reformed',name:'Reformed Christianity',start:1536,origin:'Sixteenth-century reformers included Huldrych Zwingli and John Calvin. Calvin published his Institutes in 1536.',summary:'Scripture, communal worship and the work of pastors and elders shape congregational life.',presence:'1536:CH;1570:NL GB FR;1650:US ZA',sources:['protestant','reformed']});
  add({...reformers,id:'methodist',name:'Methodist Christianity',start:1739,origin:'John and Charles Wesley helped form a revival in Britain. The first London United Society dates to 1739.',summary:'Small groups connect prayer, practical service and mutual accountability.',presence:'1739:GB;1784:US;1850:CA AU',sources:['methodist','protestant']});
  add({...reformers,id:'baptist',name:'Baptist Christianity',start:1609,origin:'An English-speaking congregation formed in Amsterdam in 1609.',summary:'Believer’s baptism and the local congregation are central to Baptist traditions.',presence:'1609:NL;1612:GB;1640:US;1850:americas',sources:['protestant','baptist']});
  add({...reformers,id:'pentecostal',name:'Pentecostal Christianity',start:1901,origin:'Early revivals include Topeka in 1901 and the Azusa Street revival led by William J. Seymour in 1906.',summary:'Worship emphasizes the activity and gifts of the Holy Spirit, communal prayer and testimony.',presence:'1901:US;1920:BR GB NG;1960:africa americas',sources:['christian','protestant']});
  const islam={
    family:'Islam',start:1200,origin:'Islam emerged in western Arabia in the seventh century CE through the prophetic ministry of Muhammad.',institution:'Mosque',
    rites:[['worship','Set aside time for prayer','Observe a period of prayer.'],['study','Join a Qur’an study circle','Read and discuss the text with a teacher.'],['service','Share a meal at sunset','Help prepare food for others during Ramadan.']],
    roles:roles('Mosque caretaker','Qur’an teacher','Imam'),holidays:[muslimHoliday],sources:['islam']
  };
  add({...islam,id:'sunni',name:'Sunni Islam',summary:'A diverse Muslim tradition with several legal schools and local scholarly communities.',presence:'1200:westAsia centralAsia TR EG MA TN DZ LY ML SN NE PK BD;1500:ID MY;1850:americas;1900:europe'});
  add({...islam,id:'shia',name:'Shi’a Islam',summary:'A Muslim tradition that gives particular importance to Ali and the family of the Prophet. Communities include Twelver, Ismaili and Zaydi branches.',presence:'1200:IQ IR YE LB BH PK;1501:AZ;1900:europe americas',holidays:[muslimHoliday,holiday('Ashura','The tenth of Muharram. Shi’a communities remember Husayn at Karbala.','Islamic lunar calendar')],sources:['islam','shia']});
  add({...islam,id:'ibadi',name:'Ibadi Islam',summary:'An early Muslim tradition with longstanding communities in Oman and parts of North Africa.',origin:'Ibadi communities developed in the first centuries of Islam, with an important early center in Basra.',presence:'1200:OM DZ LY TN',sources:['islam','ibadi']});
  const jewish={
    family:'Judaism',start:1200,origin:'Judaism developed over millennia. Rabbinic communities and their texts emerged in antiquity.',institution:'Synagogue',holidays:[jewishHoliday],
    rites:[['worship','Welcome Shabbat','Set aside time at sundown on Friday for rest and a shared meal.'],['study','Study Torah with a partner','Read a passage and discuss its interpretation.'],['service','Support the communal fund','Help neighbors administer charitable aid.']],
    roles:roles('Congregation caretaker','Torah teacher','Rabbi'),sources:['shabbat','jewish']
  };
  add({...jewish,id:'judaism',name:'Judaism',summary:'Jewish communities connect Torah study, prayer, festivals and communal responsibility. Local customs vary.',presence:'1200:westAsia europe MA TN EG;1654:US;1900:americas'});
  add({...jewish,id:'sephardi',name:'Sephardi Jewish tradition',summary:'A Jewish tradition rooted in the Iberian Peninsula, with distinct liturgies, languages and diaspora communities.',presence:'1200:ES PT MA;1492:TR GR NL;1654:US;1900:americas',origin:'Jewish communities of medieval Iberia and the diasporas that followed.'});
  add({...jewish,id:'ashkenazi',name:'Ashkenazi Jewish tradition',summary:'Jewish communities with roots in medieval central Europe developed distinctive rites and study traditions.',presence:'1200:DE FR;1350:PL LT;1800:US CA;1900:europe',origin:'Medieval Jewish communities of the Rhineland and neighboring lands.'});
  add({...jewish,id:'reform-judaism',name:'Reform Judaism',start:1810,summary:'A modern Jewish movement emphasizing ethical life, study and the development of Jewish practice.',origin:'Central European reform movements. A Reform temple opened at Seesen in 1810.',presence:'1810:DE;1850:US;1900:GB',sources:['shabbat','reform']});
  add({...jewish,id:'orthodox-judaism',name:'Orthodox Judaism',start:1850,summary:'Modern Orthodox movements share a commitment to the authority of halakha, with diverse communities and customs.',origin:'The modern denominational identity took shape in nineteenth-century Europe. Its practices have older roots.',presence:'1850:europe;1900:US IL',sources:['shabbat','jewish']});
  add({...jewish,id:'conservative-judaism',name:'Conservative / Masorti Judaism',start:1886,summary:'A Jewish movement combining commitment to halakha with historical scholarship.',origin:'Nineteenth-century roots. The Jewish Theological Seminary opened its institutional chapter in 1886.',presence:'1886:US;1950:IL CA GB',sources:['shabbat','conservative']});
  const hindu={
    family:'Hindu traditions',start:1200,origin:'Diverse South Asian traditions with ancient roots and no single founder.',institution:'Temple community',sources:['hindu'],
    holidays:[holiday('Festival gathering','Festival dates and the deities honored vary across regions and temples.','Regional Hindu calendar')],
    rites:[['worship','Attend puja','Join worship at the household shrine or temple.'],['study','Join a devotional reading','Discuss a text with a local teacher.'],['service','Help with the festival meal','Prepare and distribute food alongside other volunteers.']],
    roles:roles('Temple caretaker','Community teacher','Temple administrator'),presence:'1200:southAsia ID KH;1850:MU TT GY;1900:eastAsia europe americas'
  };
  add({...hindu,id:'hindu',name:'Hindu traditions',summary:'Devotion, ritual, philosophy and service take many forms across Hindu households and temples.'});
  add({...hindu,id:'vaishnava',name:'Vaishnava Hindu tradition',summary:'Devotion centers on Vishnu and forms such as Krishna and Rama.',holidays:[holiday('Janmashtami','Krishna’s birth is celebrated according to the local lunar calendar.','Regional Hindu lunar calendar')]});
  add({...hindu,id:'shaiva',name:'Shaiva Hindu tradition',summary:'Devotional and philosophical traditions center on Shiva.',sources:['hindu','shiva'],holidays:[holiday('Maha Shivaratri','A night of devotion to Shiva toward the end of winter.','Regional Hindu lunar calendar')]});
  add({...hindu,id:'shakta',name:'Shakta Hindu tradition',summary:'Shakta traditions honor the Goddess in diverse forms, including Durga and Kali.',holidays:[holiday('Navaratri','Nine nights devoted to the Goddess, with regional seasonal observances.','Regional Hindu lunar calendar')]});
  const bud={
    family:'Buddhism',start:1200,origin:'Teachings of Siddhartha Gautama in ancient South Asia. Scholarly dates for his lifetime vary.',institution:'Buddhist community',sources:['buddhism','sutras'],holidays:[buddhistHoliday],
    rites:[['worship','Practice with the community','Join a period of chanting or meditation in the local tradition.'],['study','Attend a Dharma teaching','Listen and reflect on a teaching.'],['service','Offer food','Help prepare food for a community gathering.']],
    roles:roles('Community caretaker','Dharma study facilitator','Community coordinator')
  };
  add({...bud,id:'buddhist',name:'Buddhism',summary:'Buddhist lineages teach ways to address suffering through ethics, wisdom and practice.',presence:'1200:LK BT NP eastAsia southeastAsia;1900:europe americas'});
  add({...bud,id:'theravada',name:'Theravada Buddhism',summary:'A Buddhist tradition centered on the Pali canon, with longstanding monastic and lay communities.',presence:'1200:LK MM TH;1450:KH LA;1950:europe americas',institution:'Theravada monastery community',holidays:[holiday('Vesak','A full-moon observance honoring the Buddha. Local calendars set the date.','Regional Buddhist lunar calendar')]});
  add({...bud,id:'mahayana',name:'Mahayana Buddhism',summary:'Many lineages share the bodhisattva ideal and diverse approaches to scripture and devotion.',presence:'1200:eastAsia VN NP;1900:europe americas',institution:'Mahayana temple community'});
  add({...bud,id:'vajrayana',name:'Vajrayana Buddhism',summary:'Lineage-based Buddhist traditions build on Mahayana and emphasize learning with a qualified teacher.',presence:'1200:BT NP CN JP;1580:MN;1960:europe americas',institution:'Buddhist practice community'});
  add({id:'sikh',name:'Sikhism',family:'Sikhism',start:1500,origin:'Guru Nanak (1469–1539) founded the Sikh tradition in Punjab. The early teaching community is selectable from around 1500.',summary:'Devotion to one God, honest living and service connect the congregation. Langar is a meal shared without distinction.',presence:'1500:IN PK;1900:GB CA US MY',institution:'Gurdwara community',sources:['sikh','gurdwara'],
    holidays:[holiday('Gurpurab','An anniversary honoring a Guru. Communities follow their own festival calendars.','Sikh festival calendars')],
    rites:[['worship','Join congregational singing','Listen and join in singing hymns.'],['service','Serve langar','Chop vegetables or serve the communal meal.'],['study','Study a hymn','Reflect on a hymn with a knowledgeable reader.']],
    roles:roles('Community kitchen coordinator','Hymn study teacher','Granthi')});
  add({id:'jain',name:'Jainism',family:'Jainism',start:1200,origin:'An ancient Indian tradition honoring a succession of Tirthankaras, including Mahavira in the first millennium BCE.',summary:'Ahimsa, or nonviolence, shapes lay and monastic life. Digambara and Shvetambara communities have different observances.',presence:'1200:IN;1900:GB KE US',institution:'Jain community',sources:['jain'],
    holidays:[holiday('Festival of reflection','Paryushana and Das Lakshana are observed according to community tradition.','Regional lunar calendar')],
    rites:[['study','Discuss ahimsa','Consider how ordinary choices affect other living beings.'],['worship','Set aside time for reflection','Reflect on harm and reconciliation.'],['service','Help prepare a community meal','Work alongside local volunteers.']],
    roles:roles('Community caretaker','Ethics study facilitator','Lay community coordinator')});
  add({id:'shinto',name:'Shinto',family:'Shinto',start:1200,origin:'Japanese traditions honoring kami developed over centuries. There is no single founder.',summary:'Shrines, local festivals and care for places link communities and kami. Customs differ from shrine to shrine.',presence:'1200:JP',institution:'Shrine community',sources:['shinto'],
    holidays:[holiday('Local matsuri','The date follows the festival calendar of the individual shrine.','Local shrine calendar')],
    rites:[['worship','Visit a shrine','Pay respects according to the local custom.'],['service','Prepare the festival grounds','Help the neighborhood set up for the festival.'],['study','Learn a local shrine history','Listen to the people who care for the place.']],
    roles:roles('Festival helper','Heritage guide','Shrine festival organizer')});
  add({id:'daoist',name:'Daoism / Taoism',family:'Daoism',start:1200,origin:'Ancient Chinese philosophical and religious lineages. Organized Daoist movements emerged by the second century CE.',summary:'Daoist communities cultivate life in relation to the Dao through practice, learning and ritual.',presence:'1200:CN TW HK MO;1850:SG MY',institution:'Daoist temple community',sources:['dao'],
    holidays:[holiday('Temple festival','The festival day depends on the temple and the deity honored.','Chinese lunar calendar')],
    rites:[['worship','Visit the temple festival','Join the public observance.'],['study','Read a Daoist text','Compare interpretations with a teacher.'],['service','Tend the temple courtyard','Help with the work around the gathering place.']],
    roles:roles('Temple caretaker','Study-circle teacher','Temple steward')});
  add({id:'confucian',name:'Confucian tradition',family:'Confucian traditions',start:1200,origin:'Confucius lived in China in the sixth and fifth centuries BCE. He worked within an older scholarly tradition.',summary:'Study, ethical cultivation, ritual and family responsibilities shape this tradition.',presence:'1200:CN KR JP VN TW',institution:'Study hall',sources:['confucian'],holidays:[householdHoliday],
    rites:[['study','Read the Analects','Discuss a passage with a study partner.'],['worship','Join a family remembrance','Honor family members in a shared observance.'],['service','Tutor a young reader','Work through a lesson with a pupil.']],
    roles:roles('Study hall caretaker','Classics teacher','Study hall steward')});
  add({id:'zoroastrian',name:'Zoroastrianism',family:'Zoroastrianism',start:1200,origin:'The teachings of Zarathushtra took root in ancient Iranian lands. The dates of his life remain debated.',summary:'Zoroastrian communities gather for prayer and emphasize the ethical weight of thoughts, words and deeds.',presence:'1200:IR IN;1900:GB CA US',institution:'Zoroastrian community',sources:['zoro'],
    holidays:[holiday('Nowruz','New Year observances follow the calendar used by the community.','Zoroastrian calendars')],
    rites:[['worship','Attend communal prayers','Join others for prayers at the gathering place.'],['study','Discuss ethical choices','Study a passage with a community teacher.'],['service','Prepare a communal meal','Help welcome guests to a seasonal gathering.']],
    roles:roles('Community caretaker','Community teacher','Lay community trustee')});
  add({id:'bahai',name:'Bahá’í Faith',family:'Bahá’í Faith',start:1863,origin:'Bahá’u’lláh declared his mission in Baghdad in 1863. The Bábí movement began in Iran in 1844.',summary:'Prayer, consultation and service shape community life. The Bahá’í Faith has no clergy.',presence:'1863:IR IQ TR;1900:IN US GB;1950:africa oceania',institution:'Bahá’í community',sources:['bahai','bahaiPractice'],
    holidays:[holiday('Riḍván','A twelve-day festival beginning in spring in the Northern Hemisphere.','Badí‘ calendar')],
    rites:[['worship','Host devotional readings','Invite neighbors to share prayers and readings.'],['study','Join a study circle','Consider a passage and its application to everyday life.'],['service','Organize a service project','Consult on a need and help with the work.']],
    roles:roles('Service coordinator','Study-circle facilitator','Community organizer')});
  const rooted={start:1200,communityRooted:true,holidays:[householdHoliday],roles:roles('Gathering helper','Community learning facilitator','Gathering coordinator')};
  add({...rooted,id:'yoruba',name:'Yoruba religious traditions',family:'Yoruba traditions',origin:'Distinctive West African traditions passed on through families, communities and specialist lineages.',summary:'Yoruba communities honor orisha and maintain diverse ritual and oral traditions, including Ifá.',presence:'1200:NG BJ;1750:BR CU',institution:'Local worship community',sources:['yoruba'],
    rites:[['study','Listen to a public oral account','Join a community-led learning gathering.'],['service','Prepare a festival meal','Support the work around a local observance.'],['worship','Attend a public festival','Take part as invited by the hosts.']]});
  add({...rooted,id:'andean',name:'Andean community traditions',family:'Andean traditions',origin:'Living local traditions with roots preceding the Inka Empire. Communities and practices are distinct across the Andes.',summary:'Ayni, or reciprocal help, connects households with the work of caring for fields, water and community.',presence:'1200:PE BO EC',institution:'Local community gathering',sources:['andes'],
    rites:[['service','Join a reciprocal work day','Help another household with a shared task.'],['study','Learn the local water history','Listen to a community account of the waterways.'],['worship','Attend a seasonal gathering','Participate in the public parts of a local observance.']]});
  add({...rooted,id:'maori',name:'Māori spiritual traditions',family:'Māori traditions',start:1300,origin:'Traditions of iwi and hapū in Aotearoa, with genealogical and wider Polynesian connections.',summary:'Whakapapa connects people, ancestors and places. Tikanga and observance belong to particular communities.',presence:'1300:NZ',institution:'Whānau gathering',sources:['maori'],
    rites:[['study','Listen to whānau histories','Learn from a family gathering with permission.'],['service','Care for a shared place','Help the hosts prepare and look after the gathering place.'],['worship','Attend a whānau observance','Participate according to local tikanga.']]});
  add({...rooted,id:'gadigal',name:'Gadigal traditions of Country',family:'Gadigal traditions',origin:'Living Gadigal traditions rooted in Country around Warrane. Knowledge belongs to its custodians.',summary:'Relationships to Country, kin and ancestors are specific to this community. A visit does not confer custodianship.',presence:'1200:n1159151623',institution:'Community gathering on Country',sources:['gadigal'],
    rites:[['study','Listen to a public account of Warrane','Hear what local custodians choose to share.'],['service','Help care for the shoreline','Join community-led work by invitation.'],['worship','Attend an open gathering','Follow the hosts’ guidance. Restricted knowledge stays with its custodians.']]});
  add({...rooted,id:'haudenosaunee',name:'Haudenosaunee community traditions',family:'Haudenosaunee traditions',start:1600,origin:'Living traditions of the Haudenosaunee nations. The starting year marks the atlas coverage, not a founding date.',summary:'Community observances include acknowledgments of the natural world, such as the Words Spoken Before All Others.',presence:'1600:US CA',institution:'Community gathering',sources:['haudenosaunee'],
    rites:[['study','Listen at a public gathering','Hear an account that community members have chosen to share.'],['service','Help with gathering preparations','Work alongside the hosts.'],['worship','Attend an invited observance','Listen as those entrusted with the observance lead.']]});
  add({...rooted,id:'vodou',name:'Haitian Vodou',family:'Haitian Vodou',start:1791,origin:'A Haitian religion that developed among enslaved Africans and their descendants in colonial Saint-Domingue. Its roots predate the Haitian Revolution.',summary:'Communities serve the lwa. Family traditions, congregations and religious specialists have distinct roles.',presence:'1791:HT;1950:US CA',institution:'Vodou community',sources:['vodou'],
    rites:[['worship','Attend a gathering by invitation','Respect the house’s guidance about participation.'],['study','Learn a community history','Listen to accounts shared by a community member.'],['service','Support a community meal','Help with the preparations for guests.']]});
  const independent={family:'Personal outlook',start:1200,secular:true,presence:'1200:*',sources:[],holidays:[secularHoliday],institution:'Voluntary community circle',
    rites:[['reflection','Set aside time to reflect','Think through a question in private.'],['study','Compare perspectives','Discuss evidence and ideas with someone you trust.'],['service','Join a mutual-aid effort','Help neighbors with a practical task.']],
    roles:roles('Mutual-aid coordinator','Discussion facilitator','Community coordinator')};
  add({...independent,id:'unaffiliated',name:'Unaffiliated',origin:'A personal choice, available in every era.',summary:'Keep a private or changing spiritual outlook without joining an institution.'});
  add({...independent,id:'secular',name:'Secular / nonreligious',origin:'A personal outlook, available in every era.',summary:'Build a life around relationships, work and values outside organized religion.'});
  add({...independent,id:'atheist',name:'Atheist',sources:['nonbelief'],origin:'Nonbelief has a long history. This is a modern interface label for an outlook available across eras.',summary:'Live without belief in gods. Ethical views and community involvement remain personal choices.'});
  add({...independent,id:'agnostic',name:'Agnostic',sources:['nonbelief','huxley'],origin:'A modern interface label for a questioning outlook available in all eras. Thomas Huxley coined the term in the nineteenth century.',summary:'Leave the existence or knowability of gods an open question.'});
  add({...independent,id:'humanist',name:'Organized humanism',start:1896,origin:'Older humanist ideas informed later associations. Britain’s Union of Ethical Societies formed in 1896.',summary:'A voluntary ethical community centered on human wellbeing, inquiry and shared responsibility.',sources:['humanist','ethical'],presence:'1896:GB;1933:US;1960:europe americas',institution:'Ethical society'});
  add({...independent,id:'orbital-commons',name:'Orbital Commons fellowship',family:'Fictional future traditions',fictional:true,secular:false,start:2080,presence:'2080:*',origin:'Fictional scenario beginning in 2080 among habitat crews.',summary:'An imagined fellowship honors reciprocal care between isolated settlements.',institution:'Habitat commons',holidays:[holiday('First Light Vigil','Each habitat marks the anniversary of its first independent power cycle.','Fictional habitat calendar')],
    rites:[['reflection','Keep a First Light vigil','Listen to recordings from earlier habitat crews.'],['service','Share a maintenance watch','Give another member a day off duty.'],['study','Read the founding logs','Debate how much a settlement owes its neighbors.']],roles:roles('Watch coordinator','Archive guide','Commons convenor')});
  add({...independent,id:'watershed-covenant',name:'Watershed Covenant',family:'Fictional future traditions',fictional:true,secular:false,start:2150,presence:'2150:*',origin:'Fictional scenario beginning in 2150 among river-basin communities.',summary:'An imagined movement treats agreements between upstream and downstream settlements as sacred obligations.',institution:'Watershed assembly',holidays:[holiday('Renewal gathering','The assembly meets after its annual watershed survey.','Fictional civic calendar')],
    rites:[['reflection','Hold a quiet river watch','Spend time beside the water that serves the district.'],['service','Help a downstream household','Take part in a reciprocal service project.'],['study','Read the water agreements','Discuss how an inherited pledge should apply today.']],roles:roles('River watch coordinator','Agreement reader','Assembly convenor')});
  // Distinct vocations supplement lay employment. Not every community has clergy.
  for(const id of ['catholic','orthodox','oriental-orthodox'])
    byId.get(id).roles.push({id:'monastic',kind:'monastic',name:'Monastic brother or sister',description:'Pursue a vocation in a monastic community under its local rule.'});
  for(const id of ['buddhist','theravada','mahayana','vajrayana'])
    byId.get(id).roles.push({id:'monastic',kind:'monastic',name:'Buddhist monastic',description:'Train with a community and follow the discipline of its lineage.'});
  for(const id of ['hindu','vaishnava','shaiva','shakta'])
    byId.get(id).roles.push({id:'priest',kind:'worship',name:'Temple pujari',description:'Train in the worship practices of this temple and tend its daily rites.'});
  // A familiar sign need not be an official emblem. Origins of a broad
  // tradition and organizers of a later denomination are recorded separately.
  const familyAttributes={
    Christianity:['The early followers of Jesus of Nazareth formed communities in the first century CE.','The cross, in several forms.'],
    Islam:['Muslims recognize Muhammad as the final prophet. The historical branches developed within the early Muslim community.','No universally prescribed emblem. Arabic calligraphy is common.'],
    Judaism:['The tradition emerged over many generations in ancient Israel and in diaspora.','The seven-branched menorah is a longstanding Jewish symbol.'],
    'Hindu traditions':['Many teaching and devotional lineages, with no single founder.','Om, a sacred syllable used across many Hindu traditions.'],
    Buddhism:['Siddhartha Gautama, the historical Buddha. Later schools developed through multiple lineages.','The Dharma wheel represents the Buddha’s teaching.'],
    'Personal outlook':['No single founder. Individuals come to this outlook independently.','No shared emblem is required.']
  };
  const specific={
    catholic:['The Catholic Church traces its origins to Jesus and the apostles, including Peter.','The cross and crucifix.'],
    orthodox:['The communion traces its roots to early Christian churches and apostolic traditions.','The cross and sacred icons. Forms differ across churches.'],
    'oriental-orthodox':['The constituent churches have distinct apostolic traditions and histories.','The cross. Individual churches have distinctive forms.'],
    protestant:['Several Reformation movements, including those associated with Martin Luther and other reformers.'],
    lutheran:['Martin Luther was a central early reformer. Other theologians and communities shaped Lutheran churches.'],
    anglican:['The English Reformation involved monarchs, clergy and congregations. Thomas Cranmer helped shape its liturgy.'],
    reformed:['Early reformers included Huldrych Zwingli and John Calvin.'],
    methodist:['John and Charles Wesley were leading organizers of early Methodism.'],
    baptist:['John Smyth and an English congregation in Amsterdam were among its earliest organizers.'],
    pentecostal:['Several revival communities contributed. William J. Seymour led the influential Azusa Street revival.'],
    sunni:['The Sunni tradition developed in the early Muslim community after the lifetime of Muhammad.'],
    shia:['Early supporters of Ali and the family of Muhammad stand at the roots of Shi’a traditions.'],
    ibadi:['Early Ibadi communities emerged around scholars in Basra, with enduring centers in Oman and North Africa.'],
    sephardi:['Communities of the Iberian Peninsula and their descendants shaped these traditions over centuries.'],
    ashkenazi:['Medieval Jewish communities in the Rhineland and nearby lands shaped these traditions.'],
    'orthodox-judaism':['Several nineteenth-century communities and rabbis articulated modern Orthodox positions.'],
    'reform-judaism':['Multiple German-speaking reformers helped build the movement. Israel Jacobson organized the Seesen temple.'],
    'conservative-judaism':['Several European and American scholars shaped the movement, including Zacharias Frankel and Solomon Schechter.'],
    theravada:['The tradition traces its teaching to the Buddha through South Asian monastic lineages.'],
    mahayana:['Many communities, teachers and texts in ancient Asia developed Mahayana teachings.'],
    vajrayana:['Multiple Buddhist tantric lineages developed in South Asia and spread through Asia.'],
    sikh:['Guru Nanak, followed by nine human Gurus.','Ik Oankar, an expression of divine oneness.'],
    jain:['Jains honor a lineage of twenty-four Tirthankaras in this cycle, most recently Mahavira.','Images of the Tirthankaras are important to many Jains. Some communities practice without images.'],
    shinto:['Shrine and household traditions developed across the Japanese archipelago without a single founder.','A torii marks the entrance to sacred space at many shrines.'],
    daoist:['Laozi is traditionally associated with the Daodejing. Multiple teachers helped establish religious Daoist lineages.','The taiji diagram evokes the interplay of yin and yang.'],
    confucian:['Confucius is the best-known early teacher of the scholarly tradition.','No single emblem represents its diverse scholarly and ritual traditions.'],
    zoroastrian:['Zarathushtra, also known as Zoroaster. His dates are debated.','Fire is central to Zoroastrian prayer and ritual.'],
    bahai:['Bahá’u’lláh. The Báb was the founder of the preceding Bábí movement.','The nine-pointed star is widely used.'],
    yoruba:['Communities and lineages in Yoruba-speaking lands transmitted many religious traditions.','Emblems differ by orisha, lineage and community.'],
    andean:['Many Andean communities sustain their own ancestral traditions.','Communities use distinct symbols connected with their histories and places.'],
    maori:['Distinct whānau, hapū and iwi carry their traditions through whakapapa.','Symbols and their meanings belong to particular communities.'],
    gadigal:['Gadigal families and custodians maintain their connections to Country across generations.','Local custodians decide which designs and stories may be shared.'],
    haudenosaunee:['Traditions are held by Haudenosaunee nations and communities across generations.','Each nation and community maintains its own forms of representation.'],
    vodou:['African and Haitian communities developed these lineages in colonial Saint-Domingue and Haiti.','Vèvè are ceremonial designs associated with particular lwa.'],
    humanist:['Many thinkers and ethical societies contributed to organized humanism.','Humanist groups may use their own local emblems.'],
    'orbital-commons':['Fictional habitat crews who established a shared watch.','A ring surrounding an open window, a fictional fellowship emblem.'],
    'watershed-covenant':['A fictional assembly of upstream and downstream residents.','Two converging streams, a fictional movement emblem.']
  };
  for(const item of traditions){
    const shared=familyAttributes[item.family],own=specific[item.id];
    item.founder=own?.[0]||shared[0];item.symbol=own?.[1]||shared[1];
    if(['Christianity','Buddhism','Judaism','Hindu traditions'].includes(item.family))item.sources.push(sources.emblems);
  }
  const optionsCache=new Map();
  function get(id){return byId.get(id)||null;}
  function available(id,year){const f=get(id);return !!f&&Number.isFinite(year)&&year>=f.start;}
  function local(id,town,year){
    const f=get(id);if(!f||!available(id,year))return false;
    const c=geo.cities[town],region=c&&world.region(town);
    return f.presence.some(rule=>year>=rule.year&&rule.locations.some(where=>where==='*'||where===town||where===c?.code||where===region));
  }
  function options(year,town){
    const key=year+'/'+town;
    if(optionsCache.has(key))return optionsCache.get(key).slice();
    const found=traditions.filter(f=>available(f.id,year)).sort((a,b)=>Number(local(b.id,town,year))-Number(local(a.id,town,year))||a.name.localeCompare(b.name,'en'));
    if(optionsCache.size>=96)optionsCache.clear();
    optionsCache.set(key,found);return found.slice();
  }
  function context(year,town){return {region:world.region(town),localIds:traditions.filter(f=>local(f.id,town,year)).map(f=>f.id)};}
  root.PocketFaithCatalog={traditions,get,available,local,options,context};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
