/* Amy Cate & Maggie Elles — supplier paste parser (TI email / DestiWorld results / Sabre / airline confirmations)
   parseAirText(text, yearHint) -> [{flight,date,from,to,dep,arr,who}]
   mqParseHotels(text) -> [{name,room,total,src}]   (total = package for all travellers)
   mqBestSlug(name), mqBestRoom(slug, room) match against window.LIB = { slug: { name, rooms:[...] } }
   nightsFromTravel("Feb 11 – 16, 2028") -> nights
   No dependencies. Set window.LIB before matching. */
const AIRLINE_NAMES={united:'UA',american:'AA',delta:'DL',southwest:'WN',jetblue:'B6',spirit:'NK',frontier:'F9',alaska:'AS','air canada':'AC',westjet:'WS',aeromexico:'AM','aeroméxico':'AM',volaris:'Y4','viva aerobus':'VB',copa:'CM',sun:'SY','sun country':'SY',avianca:'AV',interjet:'4O'};
function nightsFromTravel(t){t=String(t||'').replace(/\u2013|\u2014/g,'-').trim();if(!t)return 0;const MON={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};const yr=(t.match(/\b(20\d\d)\b/)||[])[1];const y=yr?+yr:new Date().getFullYear()+1;
  let m;
  if(m=t.match(/([a-z]{3})[a-z]*\.?\s+(\d{1,2})\s*-\s*(?:([a-z]{3})[a-z]*\.?\s+)?(\d{1,2})/i)){const m1=MON[m[1].toLowerCase().slice(0,3)],m2=m[3]?MON[m[3].toLowerCase().slice(0,3)]:m1;if(m1==null||m2==null)return 0;const a=new Date(y,m1,+m[2]),b=new Date(m2<m1?y+1:y,m2,+m[4]);return Math.round((b-a)/864e5);}
  if(m=t.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*-\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)){const a=new Date(y,+m[1]-1,+m[2]),b=new Date(y,+m[4]-1,+m[5]);return Math.round((b-a)/864e5);}
  if(m=t.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([a-z]{3})/i)){const mo=MON[m[3].toLowerCase()];if(mo==null)return 0;return +m[2]-+m[1];}
  return 0;}
function parseAirText(raw,yearHint){raw=String(raw||'').replace(/\r/g,'');
  const MON={JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12};
  const year=(()=>{const m=raw.match(/\b(20\d\d)\b/);if(m)return +m[1];const t=String(yearHint||('')||'').match(/20\d\d/);return t?+t[0]:new Date().getFullYear();})();
  const pad=n=>String(n).padStart(2,'0');
  const parseDate=t=>{let m;
    if(m=t.match(/\b(20\d\d)-(\d\d)-(\d\d)\b/))return m[1]+'-'+m[2]+'-'+m[3];
    if(m=t.match(/\b(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+(20\d\d)\b/i))return m[3]+'-'+pad(MON[m[2].toUpperCase().slice(0,3)])+'-'+pad(m[1]);
    if(m=t.match(/\b(\d{1,2})([A-Z]{3})(\d{2,4})?\b/i)){const mo=MON[m[2].toUpperCase()];if(mo)return (m[3]?(m[3].length===2?'20'+m[3]:m[3]):year)+'-'+pad(mo)+'-'+pad(m[1]);}
    if(m=t.match(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+(\d{1,2})(?:,?\s*(20\d\d))?/i))return (m[3]||year)+'-'+pad(MON[m[1].toUpperCase().slice(0,3)])+'-'+pad(m[2]);
    if(m=t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))return (m[3]?(m[3].length===2?'20'+m[3]:m[3]):year)+'-'+pad(m[1])+'-'+pad(m[2]);
    return '';};
  const parseTimes=t=>{const out=[];const re=/\b(\d{1,2})[:.]?(\d{2})\s*([AP])M?\b|\b(\d{1,2})[:.](\d{2})\b/gi;let m;while((m=re.exec(t))){let h,mi,ap;if(m[1]){h=+m[1];mi=m[2];ap=m[3].toUpperCase();if(ap==='P'&&h<12)h+=12;if(ap==='A'&&h===12)h=0;}else{h=+m[4];mi=m[5];}const ap2=h>=12?'PM':'AM';const h12=h%12||12;out.push(h12+':'+mi+' '+ap2);}return out;};
  const skip=/^(confirmation|record locator|passenger|seat|class|fare|total|ticket|baggage|e-?ticket)/i;
  const lines=raw.split('\n').map(l=>l.trim()).filter(l=>l&&!skip.test(l));
  let rows=[],cur=null;
  lines.forEach(line=>{
    // DestiWorld / Softrip table row: date, time, code, airline, flight, class, from, from city, to, to city, arr date, arr time, equipment, stops
    const tf=line.split('\t').map(x=>x.trim());
    if(tf.length>=12&&/^[A-Z0-9]{2}$/.test(tf[2])&&/^\d{2,4}$/.test(tf[4])&&/^[A-Z]{3}$/.test(tf[6])&&/^[A-Z]{3}$/.test(tf[8])){
      const dtv=parseDate(tf[0]);const dep=parseTimes(tf[1])[0]||'';const arr=parseTimes(tf[11]||'')[0]||'';
      cur={flight:tf[2]+tf[4],date:dtv,from:tf[6],to:tf[8],dep,arr,fromCity:(tf[7]||'').split(',')[0].trim()};rows.push(cur);return;}
    let fl='';let m=line.match(/\b([A-Z][A-Z0-9]) ?(\d{2,4})\b/);
    if(m&&!/^\d/.test(m[1]))fl=m[1]+m[2];
    if(!fl){for(const k in AIRLINE_NAMES){const r2=new RegExp('\\b'+k+'\\b(?:\\s+(?:airlines?|flight|#))?\\s*#?\\s*(\\d{2,4})','i');const mm=line.match(r2);if(mm){fl=AIRLINE_NAMES[k]+mm[1];break;}}}
    const dt=parseDate(line);
    const codes=[...line.matchAll(/\(([A-Z]{3})\)|\b([A-Z]{3})\b/g)].map(x=>x[1]||x[2]).filter(c=>!MON[c]&&!/^(AND|THE|FOR|VIA|MON|TUE|WED|THU|FRI|SAT|SUN|USD|CAD|PNR|ETA|ETD|ARR|DEP)$/.test(c));
    let from='',to='';const paren=[...line.toUpperCase().matchAll(/\(([A-Z]{3})\)/g)].map(x=>x[1]);const pair=line.toUpperCase().match(/(?:^|[\s,])([A-Z]{3})([A-Z]{3})(?=$|[\s,])/);
    if(paren.length>=2){from=paren[0];to=paren[1];}else if(pair&&!MON[pair[1]]&&!MON[pair[2]]&&!/^(UNITED|DELTA|SPIRIT|ALASKA|FRONTIER|JETBLUE|FLIGHT|ARRIVE|DEPART|RETURN|TRAVEL)$/.test(pair[1]+pair[2])){from=pair[1];to=pair[2];}else if(codes.length>=2){from=codes[0];to=codes[1];}else if(codes.length===1&&cur&&!cur.to){cur.to=codes[0];}
    const times=parseTimes(line);
    let fromCity='';if(from){const cm=line.match(new RegExp('\\b'+from+'\\b[\\t ]+([A-Z][A-Za-z.\' ]+?)(?:,|\\t|$)'));if(cm)fromCity=cm[1].trim();}
    if(fl){cur={flight:fl,date:dt,from,to,dep:times[0]||'',arr:times[1]||'',fromCity};rows.push(cur);}
    else if(cur){if(!cur.date&&dt)cur.date=dt;if(!cur.from&&from)cur.from=from;if(!cur.to&&to)cur.to=to;if(!cur.dep&&times[0])cur.dep=times[0];if(!cur.arr&&times[1])cur.arr=times[1];}
  });
  rows=rows.filter(r=>r.flight);
  const cityOf0=c=>({IAH:'Houston',HOU:'Houston',DFW:'Dallas',DAL:'Dallas',AUS:'Austin',SAT:'San Antonio',DEN:'Denver',ATL:'Atlanta',ORD:'Chicago',MDW:'Chicago',LAX:'Los Angeles',SFO:'San Francisco',JFK:'New York',EWR:'Newark',LGA:'New York',BOS:'Boston',MIA:'Miami',FLL:'Fort Lauderdale',MCO:'Orlando',TPA:'Tampa',PHX:'Phoenix',LAS:'Las Vegas',SEA:'Seattle',MSP:'Minneapolis',DTW:'Detroit',CLT:'Charlotte',PHL:'Philadelphia',DCA:'Washington',IAD:'Washington',BWI:'Baltimore',STL:'St. Louis',MCI:'Kansas City',OKC:'Oklahoma City',TUL:'Tulsa',MSY:'New Orleans',BNA:'Nashville',RDU:'Raleigh',SLC:'Salt Lake City',PDX:'Portland',SAN:'San Diego',SYR:'Syracuse',ROC:'Rochester',BUF:'Buffalo',ALB:'Albany',PIT:'Pittsburgh',CLE:'Cleveland',CMH:'Columbus',CVG:'Cincinnati',IND:'Indianapolis',MKE:'Milwaukee',OMA:'Omaha',MEM:'Memphis',LIT:'Little Rock',SAV:'Savannah',JAX:'Jacksonville',RSW:'Fort Myers',PBI:'West Palm Beach',SDF:'Louisville',BHM:'Birmingham',ABQ:'Albuquerque',ELP:'El Paso',CRP:'Corpus Christi',MAF:'Midland',LBB:'Lubbock',AMA:'Amarillo',YYZ:'Toronto',YVR:'Vancouver',YYC:'Calgary',YUL:'Montreal'})[c]||'';
  const first=rows[0];const home=first?(cityOf0(first.from)||first.fromCity||first.from||''):'';rows.forEach(r=>{r.who=home;delete r.fromCity;});return rows;}
const MQ_PLACES=new Set(['riviera','cancun','maya','punta','cana','cap','tulum','cabo','cabos','los','jamaica','montego','bay','negril','vallarta','nayarit','costa','mujeres','playa','del','carmen','la','romana','bavaro','uvero','alto','macao','ocho','rios','san','lucas','jose','beach','club','suites','resort','spa','all','inclusive','mexico']);
function mqNorm(t){return String(t||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9 ]+/g,' ').replace(/\b(all inclusive|an autograph collection|autograph collection|resort|resorts|spa|hotel|hotels|residences|golf|and|the|by|marriott|hilton|hyatt inclusive|collection|a|an)\b/g,' ').replace(/\s+/g,' ').trim();}
function mqTokens(t){return new Set(mqNorm(t).split(' ').filter(w=>w.length>2));}
function mqBestSlug(name){const A=mqTokens(name);const brands=[...A].filter(w=>!MQ_PLACES.has(w));let best=null,score=0;Object.keys(window.LIB).forEach(k=>{const B=mqTokens(window.LIB[k].name);if(brands.length&&!brands.every(w=>B.has(w)))return;let hit=0;A.forEach(w=>{if(B.has(w))hit++;});const sc=hit/Math.max(1,Math.max(A.size,B.size));if(hit>=2&&sc>score){score=sc;best=k;}});return score>=0.5?best:null;}
function mqBestRoom(slug,room){const rooms=(window.LIB[slug]||{}).rooms||[];if(!rooms.length)return '';const A=mqTokens(room);let best='',score=0;rooms.forEach(r=>{const B=mqTokens(r);let hit=0;A.forEach(w=>{if(B.has(w))hit++;});const sc=hit/Math.max(1,A.size);if(sc>score){score=sc;best=r;}});return score>=0.5?best:'';}
function mqParseHotels(raw){const L=raw.replace(/\r/g,'').split('\n').map(x=>x.trim());const out=[];
  // Travel Impressions: name line, ..., "Room #1: X", "From $N"
  for(let i=0;i<L.length;i++){const m=L[i].match(/^Room #\d+:\s*(.+)$/i);if(!m)continue;let name='';for(let j=i-1;j>=Math.max(0,i-8);j--){const t=L[j];if(!t||/^(rating|location|\d|-|from \$|includes|book now|prices shown|check-|hotels?:)/i.test(t)||/miles from airport/i.test(t))continue;name=t.replace(/\t.*$/,'');break;}
    let price='';for(let j=i+1;j<Math.min(L.length,i+14);j++){if(/^Room #\d+:/i.test(L[j]))break;let p=L[j].match(/From\s*\$\s*([\d,]+(?:\.\d+)?)/i)||L[j].match(/^\$\s*([\d,]+\.\d{2})\s*$/)||L[j].match(/(?:total|price)[^$]*\$\s*([\d,]+\.\d{2})/i);if(p){price=p[1].replace(/,/g,'');break;}}
    if(name)out.push({name,room:m[1].trim(),total:price,src:'TI'});}
  // DestiWorld: name line then "<Room>Hotel Package Price: $N"
  for(let i=0;i<L.length;i++){const m=L[i].match(/^(.*?)Hotel Package Price:?\s*\$?\s*([\d,]+(?:\.\d+)?)?/i);if(!m)continue;let room=m[1].trim();let total=(m[2]||'').replace(/,/g,'');let k=i;
    if(!total){for(let j=i+1;j<Math.min(L.length,i+3);j++){const p=L[j].match(/\$\s*([\d,]+(?:\.\d+)?)/);if(p){total=p[1].replace(/,/g,'');break;}}}
    if(!room){for(let j=i-1;j>=Math.max(0,i-3);j--){const t=L[j];if(t&&!/^(rating|view hotel|temporary|see more|select|\d|\$)/i.test(t)){room=t;k=j;break;}}}
    let name='';for(let j=k-1;j>=Math.max(0,k-8);j--){const t=L[j];if(!t||/^(rating|view hotel|temporary|see more|select|\d|\$|kids|upgrade|promotion|resort credit|elevate|book now|rooms available)/i.test(t)||/hotel package price/i.test(t))continue;name=t.replace(/\s+$/,'');break;}
    if(name&&room)out.push({name,room:room.replace(/\s*-\s*all inclusive$/i,'').replace(/select$/i,'').trim(),total,src:'DW'});}
  return out;}
