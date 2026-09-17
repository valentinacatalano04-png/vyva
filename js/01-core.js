const $=id=>document.getElementById(id);
const STORE='vyvaTripsClean';
const CURRENT='vyvaCurrentTripClean';
const BUILD='vyva-clean-2026-09-13-v3';
if(localStorage.getItem('vyvaBuild')!==BUILD){localStorage.removeItem('vyvaTrips');localStorage.removeItem('vyvaCurrentTrip');localStorage.removeItem(STORE);localStorage.removeItem(CURRENT);localStorage.setItem('vyvaBuild',BUILD)}

const AIRPORTS=[
['Milano','Malpensa','MXP','Italia','IT','Europe/Rome',45.6306,8.7281],['Milano','Linate','LIN','Italia','IT','Europe/Rome',45.4451,9.2767],['Bergamo','Orio al Serio','BGY','Italia','IT','Europe/Rome',45.6739,9.7042],
['Roma','Fiumicino','FCO','Italia','IT','Europe/Rome',41.8003,12.2389],['Roma','Ciampino','CIA','Italia','IT','Europe/Rome',41.7994,12.5949],['Venezia','Marco Polo','VCE','Italia','IT','Europe/Rome',45.5053,12.3519],['Torino','Caselle','TRN','Italia','IT','Europe/Rome',45.2008,7.6496],['Bologna','Guglielmo Marconi','BLQ','Italia','IT','Europe/Rome',44.5354,11.2887],['Napoli','Capodichino','NAP','Italia','IT','Europe/Rome',40.886,14.2908],['Palermo','Falcone Borsellino','PMO','Italia','IT','Europe/Rome',38.1759,13.091],['Catania','Fontanarossa','CTA','Italia','IT','Europe/Rome',37.4668,15.0664],
['Londra','Heathrow','LHR','Regno Unito','GB','Europe/London',51.47,-0.4543],['Londra','Gatwick','LGW','Regno Unito','GB','Europe/London',51.1537,-0.1821],['Londra','Stansted','STN','Regno Unito','GB','Europe/London',51.885,0.235],['Londra','Luton','LTN','Regno Unito','GB','Europe/London',51.8747,-0.3683],['Londra','City','LCY','Regno Unito','GB','Europe/London',51.5053,0.0553],
['Parigi','Charles de Gaulle','CDG','Francia','FR','Europe/Paris',49.0097,2.5479],['Parigi','Orly','ORY','Francia','FR','Europe/Paris',48.7262,2.3652],['Madrid','Adolfo Suárez Madrid-Barajas','MAD','Spagna','ES','Europe/Madrid',40.4983,-3.5676],['Barcellona','El Prat','BCN','Spagna','ES','Europe/Madrid',41.2974,2.0833],['Amsterdam','Schiphol','AMS','Paesi Bassi','NL','Europe/Amsterdam',52.3105,4.7683],['Francoforte','Frankfurt Airport','FRA','Germania','DE','Europe/Berlin',50.0379,8.5622],['Monaco','Franz Josef Strauss','MUC','Germania','DE','Europe/Berlin',48.3538,11.7861],['Zurigo','Zürich Airport','ZRH','Svizzera','CH','Europe/Zurich',47.4581,8.5555],['Vienna','Vienna International','VIE','Austria','AT','Europe/Vienna',48.1103,16.5697],['Lisbona','Humberto Delgado','LIS','Portogallo','PT','Europe/Lisbon',38.7742,-9.1342],['Dublino','Dublin Airport','DUB','Irlanda','IE','Europe/Dublin',53.4213,-6.2701],['Atene','Eleftherios Venizelos','ATH','Grecia','GR','Europe/Athens',37.9364,23.9445],['Istanbul','Istanbul Airport','IST','Turchia','TR','Europe/Istanbul',41.2753,28.7519],
['New York','John F. Kennedy','JFK','USA','US','America/New_York',40.6413,-73.7781],['New York','LaGuardia','LGA','USA','US','America/New_York',40.7769,-73.874],['Newark','Newark Liberty','EWR','USA','US','America/New_York',40.6895,-74.1745],['Los Angeles','Los Angeles International','LAX','USA','US','America/Los_Angeles',33.9416,-118.4085],['San Francisco','San Francisco International','SFO','USA','US','America/Los_Angeles',37.6213,-122.379],['Miami','Miami International','MIA','USA','US','America/New_York',25.7959,-80.287],['Chicago','O’Hare','ORD','USA','US','America/Chicago',41.9742,-87.9073],['Toronto','Pearson','YYZ','Canada','CA','America/Toronto',43.6777,-79.6248],['Vancouver','Vancouver International','YVR','Canada','CA','America/Vancouver',49.1967,-123.1815],
['Dubai','Dubai International','DXB','Emirati Arabi Uniti','AE','Asia/Dubai',25.2532,55.3657],['Doha','Hamad International','DOH','Qatar','QA','Asia/Qatar',25.2731,51.6081],['Abu Dhabi','Zayed International','AUH','Emirati Arabi Uniti','AE','Asia/Dubai',24.433,54.6511],['Tokyo','Haneda','HND','Giappone','JP','Asia/Tokyo',35.5494,139.7798],['Tokyo','Narita','NRT','Giappone','JP','Asia/Tokyo',35.7719,140.3929],['Seoul','Incheon','ICN','Corea del Sud','KR','Asia/Seoul',37.4602,126.4407],['Singapore','Changi','SIN','Singapore','SG','Asia/Singapore',1.3644,103.9915],['Bangkok','Suvarnabhumi','BKK','Thailandia','TH','Asia/Bangkok',13.69,100.7501],['Hong Kong','Hong Kong International','HKG','Hong Kong','HK','Asia/Hong_Kong',22.308,113.9185],['Sydney','Kingsford Smith','SYD','Australia','AU','Australia/Sydney',-33.9399,151.1753],['Melbourne','Melbourne Airport','MEL','Australia','AU','Australia/Melbourne',-37.669,144.841],['Città del Capo','Cape Town International','CPT','Sudafrica','ZA','Africa/Johannesburg',-33.97,18.6017],['Johannesburg','O. R. Tambo','JNB','Sudafrica','ZA','Africa/Johannesburg',-26.1337,28.242],['Marrakech','Menara','RAK','Marocco','MA','Africa/Casablanca',31.6069,-8.0363],['Il Cairo','Cairo International','CAI','Egitto','EG','Africa/Cairo',30.1219,31.4056],['São Paulo','Guarulhos','GRU','Brasile','BR','America/Sao_Paulo',-23.4356,-46.4731],['Buenos Aires','Ezeiza','EZE','Argentina','AR','America/Argentina/Buenos_Aires',-34.8222,-58.5358],['Città del Messico','Benito Juárez','MEX','Messico','MX','America/Mexico_City',19.4361,-99.0719]
].map(a=>({city:a[0],name:a[1],iata:a[2],country:a[3],cc:a[4],tz:a[5],lat:a[6],lon:a[7]}));

const COVERS=[
['Big Ben & Westminster','https://images.unsplash.com/photo-1782778463934-083f7d93f2da?auto=format&fit=crop&w=1800&h=3200&q=92'],
['Oxford Street','https://images.unsplash.com/photo-1737823832671-d4278127ce17?auto=format&fit=crop&w=1800&h=3200&q=92'],
['Tower Bridge','https://images.unsplash.com/photo-1643722572578-d16d820b23ce?auto=format&fit=crop&w=1800&h=3200&q=92'],
['London Eye','https://images.unsplash.com/photo-1694934985423-9fe08c27bb56?auto=format&fit=crop&w=1800&h=3200&q=92'],
['Notting Hill','https://images.unsplash.com/photo-1729897671630-b335eca8045f?auto=format&fit=crop&w=1800&h=3200&q=92'],
['St Paul’s','https://images.unsplash.com/photo-1448906654166-444d494666b3?auto=format&fit=crop&w=1800&h=3200&q=92'],
['London Skyline','https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1800&h=3200&q=92'],
['London Street','https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=1800&h=3200&q=92'],
['London Classic','https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=1800&h=3200&q=92'],
['Westminster','https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1800&h=3200&q=92']
];
const POPULAR_CITIES=['Londra','Lisbona','Lione','Liverpool','Los Angeles','Las Vegas','Lima','Lussemburgo','Lucerna','Lecce','Livorno','Lucca','Lugano','Parigi','Praga','Palermo','Porto','Pisa','Madrid','Milano','Miami','Monaco','Marrakech','Manchester','Melbourne','New York','Napoli','Nizza','Tokyo','Torino','Toronto','Roma','Reykjavík','Rio de Janeiro','Barcellona','Berlino','Bruxelles','Budapest','Bologna','Bangkok','Buenos Aires','Dubai','Dublino','Doha','Amsterdam','Atene','Abu Dhabi','Vienna','Venezia','Valencia','Zurigo','Zagabria','Singapore','Seoul','Sydney','San Francisco','Siviglia','Stoccolma','Copenaghen','Chicago','Città del Capo','Città del Messico','Il Cairo','Istanbul'];
let worldCities=[],cityResults=[],cityTimer=null,selectedDestination=null;
let step=0,transport='Volo',selectedCover=0,selectedFrom=null,selectedTo=null,selectedReturnFrom=null,selectedReturnTo=null,returnFromCustom=false,returnToCustom=false;
let calendarTarget='start',calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);

function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
async function loadWorldCities(){
 try{const r=await fetch('https://countriesnow.space/api/v0.1/countries');const j=await r.json();if(!j.error&&Array.isArray(j.data)){const out=[];for(const c of j.data){for(const name of (c.cities||[]))out.push({name,country:c.country,countryCode:c.iso2||'',source:'world'})}worldCities=out;if($('destination').value.trim())citySearch()}}
 catch(e){worldCities=[]}
}
function citySearch(){selectedDestination=null;clearTimeout(cityTimer);const q=$('destination').value.trim(),box=$('citySuggestions');if(!q){box.classList.add('hide');return}const nq=norm(q);const popular=POPULAR_CITIES.map(name=>({name,country:'',countryCode:'',source:'local'})).filter(x=>norm(x.name).startsWith(nq));const global=worldCities.filter(x=>norm(x.name).startsWith(nq));const seen=new Set(),base=[];for(const x of [...popular,...global]){const k=norm(x.name)+'|'+norm(x.country);if(!seen.has(k)){seen.add(k);base.push(x)}if(base.length>=18)break}cityResults=base;renderCityResults();if(q.length>=2){cityTimer=setTimeout(()=>remoteCitySearch(q),170)}}
async function remoteCitySearch(q){try{const u='https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)+'&count=20&language=it&format=json';const r=await fetch(u);const j=await r.json();const remote=(j.results||[]).filter(x=>['PPLC','PPLA','PPLA2','PPLA3','PPL','PPLX'].includes(x.feature_code)||x.population).map(x=>({name:x.name,country:x.country||'',countryCode:x.country_code||'',admin:x.admin1||'',timezone:x.timezone||'',lat:x.latitude,lon:x.longitude,source:'openmeteo'}));const seen=new Set(),mix=[];for(const x of [...remote,...cityResults]){const k=norm(x.name)+'|'+norm(x.country);if(!seen.has(k)){seen.add(k);mix.push(x)}}cityResults=mix.slice(0,20);renderCityResults()}catch(e){}}
function renderCityResults(){const box=$('citySuggestions');if(!cityResults.length){box.innerHTML='<div class="suggestion muted">Continua a scrivere per cercare la città.</div>';box.classList.remove('hide');return}box.innerHTML=cityResults.map((x,i)=>`<button type="button" class="suggestion" onclick="chooseCity(${i})"><b>${escapeHtml(x.name)}</b><small>${escapeHtml([x.admin,x.country].filter(Boolean).join(' · '))}</small></button>`).join('');box.classList.remove('hide')}
function chooseCity(i){const x=cityResults[i];selectedDestination=x;$('destination').value=x.name;$('citySuggestions').classList.add('hide')}
function escapeHtml(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

document.addEventListener('click',e=>{if(!e.target.closest('.field'))document.querySelectorAll('.autocomplete').forEach(x=>x.classList.add('hide'))});
function safeTrips(){try{const a=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function go(id){document.querySelectorAll('.screen').forEach(e=>e.classList.remove('on'));$(id).classList.add('on');$('actions').classList.toggle('hide',id!=='create');window.scrollTo(0,0)}
function setActive(t){if(t!=='Wallet')clearWalletAirlineTheme();document.querySelectorAll('#bottomNav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t))}
function resetCreate(){step=0;transport='Volo';selectedCover=0;selectedFrom=null;selectedTo=null;selectedReturnFrom=null;selectedReturnTo=null;returnFromCustom=false;returnToCustom=false;selectedDestination=null;$('destination').value='';$('startDate').value='';$('endDate').value='';$('fromAirport').value='';$('toAirport').value='';$('flightDepartDate').value='';$('departTime').value='';$('flightArrivalDate').value='';$('arrivalTime').value='';$('flightNo').value='';$('bookingCode').value='';$('returnFromAirport').value='';$('returnToAirport').value='';$('returnFlightDepartDate').value='';$('returnDepartTime').value='';$('returnFlightArrivalDate').value='';$('returnArrivalTime').value='';$('returnFlightNo').value='';$('returnBookingCode').value='';$('returnFlightDuration').textContent='—';$('returnTimezoneDiff').textContent='—';$('returnFlightHint').textContent='';$('adults').value='2';$('teens').value='0';$('children').value='0';$('infants').value='0';calendarTarget='start';calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);document.querySelectorAll('#transportChoices .choice').forEach(x=>x.classList.toggle('on',x.dataset.v==='Volo'));$('flightFields').classList.remove('hide');buildTravelerNames();renderCalendar();renderCovers()}
function startCreate(){resetCreate();renderStep();go('create');setActive('home')}
function renderStep(){document.querySelectorAll('.step').forEach((e,i)=>e.classList.toggle('on',i===step));$('bar').style.width=((step+1)/6*100)+'%';$('stepLabel').textContent=`Passaggio ${step+1} di 6`;$('nextBtn').textContent=step===5?'Crea il viaggio':'Continua';if(step===1)renderCalendar();if(step===3)prefillFlightDates();if(step===5)renderCovers()}
function nextStep(){if(step===0&&!$('destination').value.trim())return alert('Scegli una destinazione.');if(step===1&&(!$('startDate').value||!$('endDate').value))return alert('Scegli partenza e ritorno.');if(step===3&&transport==='Volo'&&(!selectedFrom||!selectedTo))return alert('Seleziona gli aeroporti dalla lista.');if(step<5){step++;renderStep();window.scrollTo(0,0)}else createTrip()}
function prevStep(){if(step>0){step--;renderStep();window.scrollTo(0,0)}}

function isoLocal(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function parseISO(s){if(!s)return null;const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)}
function dateShort(s){if(!s)return'Scegli data';return new Intl.DateTimeFormat('it-IT',{weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(parseISO(s))}
function setCalendarTarget(t){calendarTarget=t;if(t==='end'&&$('startDate').value){const d=parseISO($('startDate').value);calendarCursor=new Date(d.getFullYear(),d.getMonth(),1)}renderCalendar()}
function monthFloor(d){return new Date(d.getFullYear(),d.getMonth(),1)}
function minDateForCalendar(){const today=new Date();today.setHours(0,0,0,0);if(calendarTarget==='end'&&$('startDate').value)return parseISO($('startDate').value);return today}
function moveCalendar(delta){const candidate=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+delta,1);if(candidate<monthFloor(minDateForCalendar()))return;calendarCursor=candidate;renderCalendar()}
function renderCalendar(){
 $('startDateText').textContent=dateShort($('startDate').value);$('endDateText').textContent=dateShort($('endDate').value);$('startPick').classList.toggle('on',calendarTarget==='start');$('endPick').classList.toggle('on',calendarTarget==='end');
 const min=minDateForCalendar(),minMonth=monthFloor(min);$('calPrev').disabled=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1)<minMonth;$('calTitle').textContent=new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(calendarCursor);
 const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),offset=(first.getDay()+6)%7;let html='';for(let i=0;i<offset;i++)html+='<span></span>';
 const start=$('startDate').value,end=$('endDate').value,today=isoLocal(new Date());for(let day=1;day<=last.getDate();day++){const d=new Date(y,m,day),iso=isoLocal(d),disabled=d<min;let cls='calDay';if(disabled)cls+=' disabled';if(iso===today)cls+=' today';if(iso===start||iso===end)cls+=' selected';else if(start&&end&&iso>start&&iso<end)cls+=' inrange';html+=`<button type="button" class="${cls}" ${disabled?'disabled':''} onclick="selectCalendarDate('${iso}')">${day}</button>`}
 $('calDays').innerHTML=html;$('calHint').textContent=calendarTarget==='start'?'Seleziona la partenza.':'Ora scegli il ritorno: resti nello stesso mese e puoi andare solo avanti.'
}
function selectCalendarDate(iso){if(calendarTarget==='start'){$('startDate').value=iso;$('endDate').value='';calendarTarget='end';const d=parseISO(iso);calendarCursor=new Date(d.getFullYear(),d.getMonth(),1);prefillFlightDates(true)}else{$('endDate').value=iso;prefillReturnFlightDate(true)}renderCalendar()}
function prefillFlightDates(force=false){if($('startDate').value&&(force||!$('flightDepartDate').value))$('flightDepartDate').value=$('startDate').value;if($('endDate').value&&(force||!$('returnFlightDepartDate').value))$('returnFlightDepartDate').value=$('endDate').value;recalcFlight();recalcReturnFlight()}
function prefillReturnFlightDate(force=false){if($('endDate').value&&(force||!$('returnFlightDepartDate').value))$('returnFlightDepartDate').value=$('endDate').value;recalcReturnFlight()}

function buildTravelerNames(){const box=$('travelerNames');const old=[...box.querySelectorAll('input')].map(x=>x.value);const groups=[['Adulto',+$('adults').value],['Ragazzo',+$('teens').value],['Bambino',+$('children').value],['Neonato',+$('infants').value]];let html='',k=0;groups.forEach(([label,n])=>{for(let i=1;i<=n;i++){html+=`<div class="field"><label>NOME ${label.toUpperCase()} ${i}</label><input class="travelerName" data-type="${label}" value="${escapeHtml(old[k]||'')}" placeholder="${label} ${i}"></div>`;k++}});box.innerHTML=html;updateWhose()}
function travelerData(){return [...document.querySelectorAll('.travelerName')].map((x,i)=>({name:x.value.trim()||`Viaggiatore ${i+1}`,type:x.dataset.type||'Viaggiatore'}))}
function updateWhose(){const show=$('occasion').value==='Compleanno';$('whoseWrap').classList.toggle('hide',!show);$('whose').innerHTML=travelerData().map(x=>`<option>${escapeHtml(x.name)}</option>`).join('')}
function pickPref(key,value,el){$(key).value=value;document.querySelectorAll(`.prefGrid[data-key="${key}"] .prefChoice`).forEach(x=>x.classList.remove('on'));el.classList.add('on');if(key==='occasion')updateWhose()}
function pickTransport(el){transport=el.dataset.v;document.querySelectorAll('#transportChoices .choice').forEach(x=>x.classList.remove('on'));el.classList.add('on');$('flightFields').classList.toggle('hide',transport!=='Volo')}
function airportUi(which){const map={from:['fromAirport','fromSuggestions'],to:['toAirport','toSuggestions'],returnFrom:['returnFromAirport','returnFromSuggestions'],returnTo:['returnToAirport','returnToSuggestions']};return map[which]}
function clearAirportSelection(which){if(which==='from')selectedFrom=null;else if(which==='to')selectedTo=null;else if(which==='returnFrom'){selectedReturnFrom=null;returnFromCustom=true}else if(which==='returnTo'){selectedReturnTo=null;returnToCustom=true}}
function airportSearch(which){const ids=airportUi(which);if(!ids)return;const input=$(ids[0]),box=$(ids[1]),q=norm(input.value.trim());clearAirportSelection(which);if(q.length<1){box.classList.add('hide');if(which.startsWith('return'))recalcReturnFlight();else recalcFlight();return}const res=AIRPORTS.filter(a=>norm(`${a.city} ${a.name} ${a.iata} ${a.country}`).includes(q)).slice(0,14);box.innerHTML=res.length?res.map(a=>`<button type="button" class="suggestion" onclick="chooseAirport('${which}','${a.iata}')"><b>${a.city} · ${a.iata}</b><small>${a.name} — ${a.country}</small></button>`).join(''):'<div class="suggestion muted">Continua a scrivere o usa il codice IATA.</div>';box.classList.remove('hide')}
function setAirportInput(which,a){const ids=airportUi(which);if(!ids||!a)return;$(ids[0]).value=`${a.city} — ${a.name} (${a.iata})`;$(ids[1]).classList.add('hide')}
function syncReturnAirports(){if(!returnFromCustom&&selectedTo){selectedReturnFrom=selectedTo;setAirportInput('returnFrom',selectedReturnFrom)}if(!returnToCustom&&selectedFrom){selectedReturnTo=selectedFrom;setAirportInput('returnTo',selectedReturnTo)}recalcReturnFlight()}
function chooseAirport(which,iata){const a=AIRPORTS.find(x=>x.iata===iata);if(!a)return;setAirportInput(which,a);if(which==='from'){selectedFrom=a;syncReturnAirports();recalcFlight()}else if(which==='to'){selectedTo=a;syncReturnAirports();recalcFlight()}else if(which==='returnFrom'){selectedReturnFrom=a;returnFromCustom=true;recalcReturnFlight()}else if(which==='returnTo'){selectedReturnTo=a;returnToCustom=true;recalcReturnFlight()}}
function tzOffsetMinutes(instant,tz){const f=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});const p=Object.fromEntries(f.formatToParts(instant).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return(Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-instant.getTime())/60000}
function localInZoneToUTC(dateStr,timeStr,tz){if(!dateStr||!timeStr||!tz)return null;const[y,m,d]=dateStr.split('-').map(Number),[hh,mm]=timeStr.split(':').map(Number);let guess=new Date(Date.UTC(y,m-1,d,hh,mm)),off=tzOffsetMinutes(guess,tz),utc=new Date(guess.getTime()-off*60000),off2=tzOffsetMinutes(utc,tz);if(off2!==off)utc=new Date(guess.getTime()-off2*60000);return utc}
function haversine(a,b){const R=6371,r=x=>x*Math.PI/180,dlat=r(b.lat-a.lat),dlon=r(b.lon-a.lon),q=Math.sin(dlat/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dlon/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function estimatedBlockMinutes(a,b){const km=haversine(a,b);let speed=km<500?620:km<2200?750:840,over=km<500?45:km<2200?50:75;return Math.max(55,Math.round((km/speed*60+over)/5)*5)}
function zoneParts(d,tz){const f=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});const p=Object.fromEntries(f.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return{date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`}}
function formatDurationMins(mins){const h=Math.floor(mins/60),m=mins%60;return `${h}h ${String(m).padStart(2,'0')}m`}
function formatTzDiff(mins){if(mins===0)return'0h';const sign=mins>0?'+':'−',a=Math.abs(mins),h=Math.floor(a/60),m=a%60;return sign+h+'h'+(m?` ${m}m`:'')}
function recalcFlight(){$('flightDuration').textContent='—';$('timezoneDiff').textContent='—';$('flightHint').textContent='';$('flightArrivalDate').value='';$('arrivalTime').value='';if(!selectedFrom||!selectedTo||!$('flightDepartDate').value||!$('departTime').value){if(selectedFrom&&selectedTo)$('flightHint').textContent='Inserisci data e ora di partenza: VYVA calcolerà subito l’arrivo locale.';return}const dep=localInZoneToUTC($('flightDepartDate').value,$('departTime').value,selectedFrom.tz);if(!dep)return;const mins=estimatedBlockMinutes(selectedFrom,selectedTo),arr=new Date(dep.getTime()+mins*60000),parts=zoneParts(arr,selectedTo.tz),diff=tzOffsetMinutes(dep,selectedTo.tz)-tzOffsetMinutes(dep,selectedFrom.tz);$('flightArrivalDate').value=parts.date;$('arrivalTime').value=parts.time;$('flightDuration').textContent=formatDurationMins(mins);$('timezoneDiff').textContent=formatTzDiff(diff);$('flightHint').textContent=`Arrivo automatico in ora locale di ${selectedTo.city}.`}
function recalcReturnFlight(){$('returnFlightDuration').textContent='—';$('returnTimezoneDiff').textContent='—';$('returnFlightHint').textContent='';$('returnFlightArrivalDate').value='';$('returnArrivalTime').value='';if(!selectedReturnFrom||!selectedReturnTo||!$('returnFlightDepartDate').value||!$('returnDepartTime').value){if(selectedReturnFrom&&selectedReturnTo)$('returnFlightHint').textContent='Inserisci l’orario di partenza del ritorno: VYVA calcolerà subito l’arrivo locale.';return}const dep=localInZoneToUTC($('returnFlightDepartDate').value,$('returnDepartTime').value,selectedReturnFrom.tz);if(!dep)return;const mins=estimatedBlockMinutes(selectedReturnFrom,selectedReturnTo),arr=new Date(dep.getTime()+mins*60000),parts=zoneParts(arr,selectedReturnTo.tz),diff=tzOffsetMinutes(dep,selectedReturnTo.tz)-tzOffsetMinutes(dep,selectedReturnFrom.tz);$('returnFlightArrivalDate').value=parts.date;$('returnArrivalTime').value=parts.time;$('returnFlightDuration').textContent=formatDurationMins(mins);$('returnTimezoneDiff').textContent=formatTzDiff(diff);$('returnFlightHint').textContent=`Arrivo automatico in ora locale di ${selectedReturnTo.city}.`}

function renderCovers(){$('covers').innerHTML=COVERS.map((c,i)=>`<button type="button" class="cover ${i===selectedCover?'on':''}" style="background-image:url('${c[1]}')" onclick="selectedCover=${i};renderCovers()"><span>${escapeHtml(c[0])}</span></button>`).join('')}
function fmtDate(s){if(!s)return'';return new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short',year:'numeric'}).format(parseISO(s)).replace('.','')}
function fmtRange(a,b){if(!a||!b)return'';const da=parseISO(a),db=parseISO(b),sameYear=da.getFullYear()===db.getFullYear();const fa=new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short',year:sameYear?undefined:'numeric'}).format(da).replace('.','');const fb=new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short',year:'numeric'}).format(db).replace('.','');return `${fa} – ${fb}`}
function createTrip(){const travelers=travelerData(),trip={id:Date.now(),destination:$('destination').value.trim(),destinationData:selectedDestination,start:$('startDate').value,end:$('endDate').value,travelers,adults:+$('adults').value,teens:+$('teens').value,children:+$('children').value,infants:+$('infants').value,transport,from:selectedFrom,to:selectedTo,fromText:$('fromAirport').value.trim(),toText:$('toAirport').value.trim(),flightDepartDate:$('flightDepartDate').value,departTime:$('departTime').value,flightArrivalDate:$('flightArrivalDate').value,arrivalTime:$('arrivalTime').value,flightNo:$('flightNo').value.trim(),bookingCode:$('bookingCode').value.trim(),duration:$('flightDuration').textContent,tzDiff:$('timezoneDiff').textContent,returnFrom:selectedReturnFrom,returnTo:selectedReturnTo,returnFromText:$('returnFromAirport').value.trim(),returnToText:$('returnToAirport').value.trim(),returnFlightDepartDate:$('returnFlightDepartDate').value,returnDepartTime:$('returnDepartTime').value,returnFlightArrivalDate:$('returnFlightArrivalDate').value,returnArrivalTime:$('returnArrivalTime').value,returnFlightNo:$('returnFlightNo').value.trim(),returnBookingCode:$('returnBookingCode').value.trim(),returnDuration:$('returnFlightDuration').textContent,returnTzDiff:$('returnTimezoneDiff').textContent,style:$('style').value,pace:$('pace').value,budget:$('budget').value,occasion:$('occasion').value,whose:$('whose').value||'',cover:COVERS[selectedCover][1]};const a=safeTrips();a.unshift(trip);localStorage.setItem(STORE,JSON.stringify(a));localStorage.setItem(CURRENT,String(trip.id));renderHomeTrips();showTrip(trip);setActive('Viaggi')}
function flag(cc){if(!cc||cc.length!==2)return'✦';return String.fromCodePoint(...cc.toUpperCase().split('').map(c=>127397+c.charCodeAt()))}

let tripArrivalChoice='train';

function arrivalPartySummary(t){
  const bits=[];
  if(t?.adults)bits.push(`${t.adults} adult${t.adults===1?'o':'i'}`);
  if(t?.children)bits.push(`${t.children} bambin${t.children===1?'a':'i'}`);
  if(t?.infants)bits.push(`${t.infants} neonat${t.infants===1?'o':'i'}`);
  return bits.join(' · ')||'il tuo gruppo';
}
function toggleTripArrivalHub(force){
  const card=$('arrivalHubCard');
  if(!card)return;
  const open=typeof force==='boolean'?force:!card.classList.contains('open');
  card.classList.toggle('open',open);
  const btn=$('arrivalHubButton');
  if(btn)btn.setAttribute('aria-expanded',open?'true':'false');
}
function chooseTripArrival(mode,el){
  tripArrivalChoice=mode;
  document.querySelectorAll('.arrivalHubMode').forEach(x=>x.classList.remove('on'));
  if(el)el.classList.add('on');
  renderTripArrivalDetail();
}
let tripArrivalDirection='outbound';

function safeAirportTransfers(){
  try{return JSON.parse(localStorage.getItem('vyvaAirportTransfersV1')||'{}')}catch(e){return{}}
}
function airportTransferKey(t,direction){
  return `${t.id}|${direction}`;
}
function getAirportTransfer(t,direction){
  return safeAirportTransfers()[airportTransferKey(t,direction)]||null;
}
function airportTransferBookingUrl(label,direction){
  const s=String(label||'').toLowerCase();
  if(s.includes('treno')) return 'https://www.gatwickexpress.com/tickets';
  if(s.includes('coach')||s.includes('bus')) return 'https://www.nationalexpress.com/en/destinations/london/gatwick-to-london';
  if(s.includes('taxi')||s.includes('transfer')) return 'https://www.gatwickairport.com/transport-options/taxi.html';
  if(s.includes('noleggio')||s.includes('auto')) return 'https://www.gatwickairport.com/transport-options/car-hire.html';
  return 'https://www.gatwickairport.com/transport-options/';
}
function saveArrivalPreference(label){
  const t=currentTrip();if(!t)return;
  const direction=tripArrivalDirection||'outbound';

  const all=safeAirportTransfers();
  all[airportTransferKey(t,direction)]={
    label,
    direction,
    saved:new Date().toISOString()
  };
  localStorage.setItem('vyvaAirportTransfersV1',JSON.stringify(all));

  let items=safeMoveItems();
  items=items.filter(x=>!(
    String(x.tripId)===String(t.id) &&
    x.airportTransfer===true &&
    x.direction===direction
  ));

  const inbound=direction==='outbound';
  const airport=t.to?.iata||'LGW';
  const city=t.destination||t.to?.city||'Londra';
  const provider=`${label} · ${inbound?`${airport} → ${city}`:`${city} → ${airport}`}`;

  items.unshift({
    id:Date.now(),
    tripId:t.id,
    trip:city,
    type:String(label).toLowerCase().includes('taxi')||String(label).toLowerCase().includes('transfer')?'ride':
         String(label).toLowerCase().includes('treno')?'train':'transit',
    provider,
    from:inbound?`${airport} Airport`:city,
    to:inbound?city:`${airport} Airport`,
    url:airportTransferBookingUrl(label,direction),
    airportTransfer:true,
    direction,
    created:new Date().toISOString()
  });
  localStorage.setItem(MOVE_STORE,JSON.stringify(items));

  renderTripArrivalHub(t);
  alert(direction==='outbound'
    ?'Trasferimento aeroporto → città salvato nel Wallet > Move.'
    :'Trasferimento città → aeroporto salvato nel Wallet > Move.');
}
function gatwickArrivalDetail(mode,t){
  const party=arrivalPartySummary(t);
  if(mode==='train'){
    return `<div class="arrivalHubDetail">
      <h4>🚆 Treno — il più rapido per il centro</h4>
      <div class="arrivalHubMeta"><span>~30–35 min</span><span>prenotabile prima</span><span>stazione South Terminal</span></div>
      <p><b>Gatwick Express</b> va diretto a London Victoria. <b>Southern</b> e <b>Thameslink</b> possono essere più convenienti e servono anche London Bridge, Blackfriars, St Pancras e altre stazioni.</p>
      <ul>
        <li>Se arrivi al North Terminal, usa la navetta gratuita per il South Terminal.</li>
        <li>Puoi comprare online prima, usare le macchinette in stazione oppure, su tratte PAYG valide, contactless/Oyster.</li>
        <li>Per ${escapeHtml(party)}, controlla la tariffa bambino del servizio scelto: gli under 5 viaggiano gratis su GTR se non occupano un posto separato; sono disponibili tariffe bambini e, su molte tratte off-peak, offerte dedicate.</li>
      </ul>
      <div class="arrivalHubActions">
        <a target="_blank" rel="noopener" href="https://www.gatwickexpress.com/tickets">Gatwick Express</a>
        <a target="_blank" rel="noopener" href="https://www.thameslinkrailway.com/travel-information/airport-travel/gatwick-airport">Thameslink</a>
        <a target="_blank" rel="noopener" href="https://www.southernrailway.com/journey/gatwick-airport-to-london-victoria">Southern</a>
        <button onclick="saveArrivalPreference('Treno')">Preferisco il treno</button>
      </div>
      <div class="arrivalHubNote">Prezzo: varia in base a orario, operatore e tariffa. Gatwick Express indica uno sconto online su molti biglietti; VYVA ti manda al checkout ufficiale per il prezzo aggiornato.</div>
    </div>`;
  }
  if(mode==='coach'){
    return `<div class="arrivalHubDetail">
      <h4>🚌 Coach / bus — spesso il più economico</h4>
      <div class="arrivalHubMeta"><span>da £6*</span><span>~1h05–1h45</span><span>prenotabile prima</span></div>
      <p><b>National Express</b> collega Gatwick con London Victoria e altre fermate. È comodo se vuoi spendere meno e non ti pesa un tempo di viaggio più lungo.</p>
      <ul>
        <li>Partenze da entrambi i terminal.</li>
        <li>Conviene prenotare prima nei giorni affollati per avere il posto garantito.</li>
        <li>Da Victoria puoi poi continuare in Tube, bus o taxi.</li>
      </ul>
      <div class="arrivalHubActions">
        <a target="_blank" rel="noopener" href="https://www.nationalexpress.com/en/destinations/london/gatwick-to-london">Vedi prezzi / prenota</a>
        <a target="_blank" rel="noopener" href="https://www.gatwickairport.com/transport-options/coach-bus.html">Info Gatwick</a>
        <button onclick="saveArrivalPreference('Coach / bus')">Preferisco il bus</button>
        <button onclick="openMovePanel()">Continua in Move</button>
      </div>
      <div class="arrivalHubNote">*Il prezzo “da £6” è una tariffa di partenza pubblicata da National Express e può cambiare in base a disponibilità e data.</div>
    </div>`;
  }
  if(mode==='taxi'){
    return `<div class="arrivalHubDetail">
      <h4>🚕 Taxi / private hire — porta a porta</h4>
      <div class="arrivalHubMeta"><span>tempo variabile col traffico</span><span>prenotabile prima</span><span>ritiro ai terminal</span></div>
      <p>Il provider ufficiale di Gatwick è <b>Airport Cars Gatwick</b>. Puoi prenotare prima con tariffa quotata oppure andare ai chioschi presenti nei terminal all’arrivo.</p>
      <ul>
        <li>È la scelta più semplice con bambini, passeggino e bagagli.</li>
        <li>Il prezzo dipende dall’indirizzo dell’hotel: VYVA non mostra una cifra fissa finché non conosce la destinazione esatta.</li>
        <li>La prenotazione anticipata può includere un prezzo fisso e assistenza 24 ore.</li>
      </ul>
      <div class="arrivalHubActions">
        <a target="_blank" rel="noopener" href="https://www.gatwickairport.com/transport-options/taxi.html">Preventivo / prenota</a>
        <button onclick="saveArrivalPreference('Taxi')">Preferisco taxi</button>
      </div>
    </div>`;
  }
  if(mode==='transfer'){
    return `<div class="arrivalHubDetail">
      <h4>🚘 Transfer privato — la soluzione più comoda</h4>
      <div class="arrivalHubMeta"><span>porta a porta</span><span>prenotabile prima</span><span>meet & greet disponibile</span></div>
      <p>Puoi prenotare prima un <b>transfer privato</b>: l’autista può attendervi agli arrivi con un cartello e accompagnarvi direttamente all’hotel, senza cambi.</p>
      <ul>
        <li>Ideale per famiglie, passeggino, molti bagagli o arrivi serali.</li>
        <li>Per Gatwick, Airport Cars Gatwick offre anche transfer e servizio di incontro agli arrivi.</li>
        <li>Il prezzo viene calcolato sul vostro indirizzo: quando aggiungeremo l’hotel, VYVA potrà mostrarvi il collegamento di prenotazione già contestualizzato.</li>
      </ul>
      <div class="arrivalHubActions">
        <a target="_blank" rel="noopener" href="https://www.gatwickairport.com/transport-options/taxi.html">Prenota transfer</a>
        <button onclick="saveArrivalPreference('Transfer privato')">Preferisco transfer</button>
      </div>
    </div>`;
  }
  return `<div class="arrivalHubDetail">
    <h4>🚗 Noleggio auto</h4>
    <div class="arrivalHubMeta"><span>7 provider in aeroporto</span><span>prenotabile prima</span></div>
    <p>Gatwick ha diversi autonoleggi direttamente in aeroporto. È utile se dopo Londra vuoi spostarti fuori città; per il solo centro di Londra, traffico e parcheggi possono renderlo meno pratico.</p>
    <div class="arrivalHubActions">
      <a target="_blank" rel="noopener" href="https://www.gatwickairport.com/transport-options/car-hire.html">Confronta autonoleggi</a>
      <button onclick="saveArrivalPreference('Noleggio auto')">Preferisco auto</button>
    </div>
  </div>`;
}

function gatwickReturnDetail(mode,t){
  if(mode==='train'){
    return `<div class="arrivalHubDetail">
      <h4>🚆 Treno — rapido verso Gatwick</h4>
      <div class="arrivalHubMeta"><span>~30–45 min</span><span>prenotabile prima</span><span>arrivo in aeroporto</span></div>
      <p>Puoi raggiungere Gatwick con <b>Gatwick Express</b> da London Victoria oppure con <b>Southern/Thameslink</b> da varie stazioni di Londra.</p>
      <ul>
        <li>Controlla quale stazione è più comoda rispetto al vostro hotel.</li>
        <li>Puoi comprare prima online, alle macchinette oppure usare contactless/Oyster dove PAYG è valido.</li>
        <li>Con bambini e bagagli lascia margine extra per stazione, terminal e controlli.</li>
      </ul>
      <div class="arrivalHubActions">
        <a target="_blank" rel="noopener" href="https://www.gatwickexpress.com/tickets">Gatwick Express</a>
        <a target="_blank" rel="noopener" href="https://www.thameslinkrailway.com/travel-information/airport-travel/gatwick-airport">Thameslink</a>
        <a target="_blank" rel="noopener" href="https://www.southernrailway.com/journey/london-victoria-to-gatwick-airport">Southern</a>
        <button onclick="saveArrivalPreference('Treno')">Salva treno</button>
      </div>
    </div>`;
  }
  if(mode==='coach'){
    return `<div class="arrivalHubDetail">
      <h4>🚌 Coach / bus — economico</h4>
      <div class="arrivalHubMeta"><span>tempo variabile</span><span>prenotabile prima</span><span>partenza da Londra</span></div>
      <p><b>National Express</b> collega Londra con Gatwick. È spesso conveniente, ma il traffico può allungare il viaggio.</p>
      <ul>
        <li>Meglio prenotare prima nei periodi affollati.</li>
        <li>Prevedi un buon margine rispetto all’orario del volo.</li>
      </ul>
      <div class="arrivalHubActions">
        <a target="_blank" rel="noopener" href="https://www.nationalexpress.com/en/destinations/london/gatwick-to-london">Vedi / prenota</a>
        <button onclick="saveArrivalPreference('Coach / bus')">Salva bus</button>
      </div>
    </div>`;
  }
  if(mode==='taxi'){
    return `<div class="arrivalHubDetail">
      <h4>🚕 Taxi / private hire — hotel → Gatwick</h4>
      <div class="arrivalHubMeta"><span>porta a porta</span><span>prenotabile prima</span><span>tempo dipende dal traffico</span></div>
      <p>Puoi prenotare in anticipo il ritiro direttamente dall’hotel. È comodo con passeggino, bambini e bagagli.</p>
      <div class="arrivalHubActions">
        <a target="_blank" rel="noopener" href="https://www.gatwickairport.com/transport-options/taxi.html">Preventivo / prenota</a>
        <button onclick="saveArrivalPreference('Taxi')">Salva taxi</button>
      </div>
    </div>`;
  }
  if(mode==='transfer'){
    return `<div class="arrivalHubDetail">
      <h4>🚘 Transfer privato — hotel → Gatwick</h4>
      <div class="arrivalHubMeta"><span>porta a porta</span><span>prenotabile prima</span><span>ritiro concordato</span></div>
      <p>Il transfer privato può venirvi a prendere direttamente all’hotel all’orario concordato e portarvi al terminal senza cambi.</p>
      <ul>
        <li>Molto comodo con bambini, passeggino e valigie.</li>
        <li>La tariffa dipende dall’indirizzo e dall’orario di ritiro.</li>
      </ul>
      <div class="arrivalHubActions">
        <a target="_blank" rel="noopener" href="https://www.gatwickairport.com/transport-options/taxi.html">Preventivo / prenota</a>
        <button onclick="saveArrivalPreference('Transfer privato')">Salva transfer</button>
      </div>
    </div>`;
  }
  return `<div class="arrivalHubDetail">
    <h4>🚗 Auto / noleggio</h4>
    <p>Se hai già un’auto a noleggio, puoi impostare Gatwick come destinazione e pianificare la riconsegna direttamente in aeroporto.</p>
    <div class="arrivalHubActions">
      <a target="_blank" rel="noopener" href="https://www.gatwickairport.com/transport-options/car-hire.html">Info autonoleggio</a>
      <button onclick="saveArrivalPreference('Noleggio auto')">Salva auto</button>
    </div>
  </div>`;
}

function renderTripArrivalDetail(){
  const t=currentTrip(),box=$('arrivalHubDetail');
  if(!t||!box)return;
  const iata=(t?.to?.iata||'').toUpperCase();
  if(iata==='LGW'){
    box.innerHTML=tripArrivalDirection==='return'
      ?gatwickReturnDetail(tripArrivalChoice,t)
      :gatwickArrivalDetail(tripArrivalChoice,t);
  }else{
    box.innerHTML=`<div class="arrivalHubDetail"><h4>✈️ Trasferimento ${tripArrivalDirection==='return'?'città → aeroporto':'aeroporto → città'}</h4><p>VYVA userà aeroporto, orario e destinazione per confrontare treno, bus, taxi e transfer privato.</p></div>`;
  }
}
function tripArrivalHubHtml(t,direction='outbound'){
  const iata=(t?.to?.iata||'').toUpperCase();
  if(t?.transport!=='Volo'||!iata)return '';
  const destination=t?.destination||t?.to?.city||'destinazione';
  const isReturn=direction==='return';

  if(iata==='LGW'){
    return `<div id="arrivalHubCard" class="arrivalHubCard">
      <button id="arrivalHubButton" class="arrivalHubHead" type="button" aria-expanded="false" onclick="toggleTripArrivalHub()">
        <span class="arrivalHubHeadIcon">${isReturn?'🧳':'🛬'}</span>
        <span>
          <b>${isReturn?`Da ${escapeHtml(destination)} a Gatwick`:`Da Gatwick a ${escapeHtml(destination)}`}</b>
          <small>${isReturn?'Organizza il trasferimento per il volo di ritorno':'Treno, bus, taxi o transfer · tocca per scegliere'}</small>
        </span>
        <span class="arrivalHubChevron">⌄</span>
      </button>
      <div class="arrivalHubBody">
        <div class="arrivalHubSummary"><b>In breve:</b> treno = rapido; coach = spesso più economico; taxi/transfer = più comodo porta a porta.</div>
        <div class="arrivalHubModes">
          <button class="arrivalHubMode on" onclick="chooseTripArrival('train',this)"><span>🚆</span><b>Treno</b><small>rapido · prenotabile</small></button>
          <button class="arrivalHubMode" onclick="chooseTripArrival('coach',this)"><span>🚌</span><b>Bus / Coach</b><small>economico · prenotabile</small></button>
          <button class="arrivalHubMode" onclick="chooseTripArrival('taxi',this)"><span>🚕</span><b>Taxi</b><small>porta a porta</small></button>
          <button class="arrivalHubMode" onclick="chooseTripArrival('transfer',this)"><span>🚘</span><b>Transfer privato</b><small>prenotabile prima</small></button>
          <button class="arrivalHubMode" onclick="chooseTripArrival('car',this)"><span>🚗</span><b>Auto</b><small>se ti serve</small></button>
        </div>
        <div id="arrivalHubDetail"></div>
      </div>
    </div>`;
  }

  return `<div id="arrivalHubCard" class="arrivalHubCard">
    <button id="arrivalHubButton" class="arrivalHubHead" type="button" aria-expanded="false" onclick="toggleTripArrivalHub()">
      <span class="arrivalHubHeadIcon">${isReturn?'🧳':'🛬'}</span>
      <span><b>${isReturn?`Da ${escapeHtml(destination)} all’aeroporto`:`Dall’aeroporto a ${escapeHtml(destination)}`}</b><small>Tocca per scegliere il trasferimento</small></span>
      <span class="arrivalHubChevron">⌄</span>
    </button>
    <div class="arrivalHubBody"><div id="arrivalHubDetail"></div></div>
  </div>`;
}
function renderTripArrivalHub(t){
  const host=$('tripArrivalHub');if(!host)return;
  host.innerHTML='';
  if(!t||t.transport!=='Volo'||!t.to)return;

  const now=new Date();
  const outArrival=dtFrom(
    t.flightArrivalDate||t.flightDepartDate,
    t.arrivalTime||t.departTime
  );
  const retDeparture=dtFrom(
    t.returnFlightDepartDate||t.end,
    t.returnDepartTime
  );
  const outboundSaved=!!getAirportTransfer(t,'outbound');
  const returnSaved=!!getAirportTransfer(t,'return');

  // Before reaching London: show Gatwick -> London only if it has not already been set.
  if((!outArrival || now<outArrival) && !outboundSaved){
    tripArrivalDirection='outbound';
    host.innerHTML=tripArrivalHubHtml(t,'outbound');
    tripArrivalChoice='train';
    renderTripArrivalDetail();

    const seenKey=`vyvaArrivalHubSeen_${t.id}_outbound`;
    if(!localStorage.getItem(seenKey)){
      toggleTripArrivalHub(true);
      localStorage.setItem(seenKey,'1');
    }
    return;
  }

  // Once the outbound arrival time has passed, the arrival transfer is no longer shown.
  // In the 24h before the return flight, show London -> Gatwick unless already set.
  if(retDeparture){
    const hoursToReturn=(retDeparture-now)/3600000;
    if(hoursToReturn>0 && hoursToReturn<=24 && !returnSaved){
      tripArrivalDirection='return';
      host.innerHTML=tripArrivalHubHtml(t,'return');
      tripArrivalChoice='train';
      renderTripArrivalDetail();

      const seenKey=`vyvaArrivalHubSeen_${t.id}_return`;
      if(!localStorage.getItem(seenKey)){
        toggleTripArrivalHub(true);
        localStorage.setItem(seenKey,'1');
      }
    }
  }
}


async function hasReturnBoardingPasses(t){
  if(!t?.id)return false;
  try{
    const docs=await getAllFlightDocs();
    return docs.some(d =>
      String(d.tripId)===String(t.id) &&
      d.leg==='return' &&
      d.type==='boarding'
    );
  }catch(e){
    return false;
  }
}
function dtFrom(date,time){
  if(!date)return null;
  const d=new Date(`${date}T${time||'00:00'}:00`);
  return isNaN(d)?null:d;
}
async function updateTripFlightLifecycle(t){
  const card=$('routeCard');
  const alert=$('returnCheckinAlert');
  const chip=$('flightStatusChip');
  if(alert)alert.classList.remove('show');

  if(!t || t.transport!=='Volo' || !t.from || !t.to){
    if(card)card.classList.add('hide');
    return;
  }

  const now=new Date();
  const outArrival=dtFrom(
    t.flightArrivalDate||t.flightDepartDate,
    t.arrivalTime||t.departTime
  );
  const retDeparture=dtFrom(
    t.returnFlightDepartDate||t.end,
    t.returnDepartTime
  );
  const retArrival=dtFrom(
    t.returnFlightArrivalDate||t.returnFlightDepartDate||t.end,
    t.returnArrivalTime||t.returnDepartTime
  );

  if(!outArrival || now < outArrival){
    if(card)card.classList.remove('hide');
    renderActiveFlightCard(t,'outbound');
    if(chip){chip.textContent='Volo di andata';chip.className='flightStatusChip'}
    return;
  }

  if(card)card.classList.add('hide');

  if(!(t.returnFrom && t.returnTo) || !retDeparture)return;

  if(retArrival && now >= retArrival){
    if(card)card.classList.add('hide');
    if(alert)alert.classList.remove('show');
    return;
  }

  const hoursToReturn=(retDeparture-now)/3600000;
  const checkinWindow=hoursToReturn<=24 && hoursToReturn>0;
  const boardingReady=await hasReturnBoardingPasses(t);

  if(checkinWindow && !boardingReady){
    if(alert){
      const txt=$('returnCheckinAlertText');
      if(txt)txt.textContent=`Il volo parte ${t.returnFlightDepartDate?fmtDate(t.returnFlightDepartDate):''}${t.returnDepartTime?` alle ${t.returnDepartTime}`:''}. Apri il Wallet per il check-in e le carte d’imbarco.`;
      alert.classList.add('show');
    }
    return;
  }

  if(boardingReady && (!retArrival || now < retArrival)){
    if(card)card.classList.remove('hide');
    renderActiveFlightCard(t,'return');
    if(chip){chip.textContent='Volo di ritorno';chip.className='flightStatusChip returnReady'}
    return;
  }

  if(card)card.classList.add('hide');
}

function showTrip(t){if(t?.id){localStorage.setItem(CURRENT,String(t.id));saveActiveTripContext(t)}closeActiveTripMenu();$('tripbg').style.backgroundImage=`url('${t.cover||COVERS[0][1]}')`;$('tdest').textContent=t.destination||'Il tuo viaggio';$('tdates').textContent=fmtRange(t.start,t.end);const start=parseISO(t.start),end=parseISO(t.end),tripDays=Math.max(1,Math.round((end-start)/86400000)+1),now=new Date(),until=Math.ceil((start-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);$('tcount').textContent=until>0?`Inizia tra ${until} giorni · viaggio di ${tripDays} giorni`:until===0?`Si parte oggi · viaggio di ${tripDays} giorni`:`Viaggio di ${tripDays} giorni`;$('ttransport').textContent=t.transport==='Volo'?'Voli':(t.transport||'Volo');$('routeCard').classList.toggle('hide',t.transport!=='Volo');$('fcode').textContent=t.from?.iata||'—';$('tcode').textContent=t.to?.iata||'—';$('fromCity').textContent=t.from?`${t.from.city} ${t.from.name}`:'Partenza';$('toCity').textContent=t.to?`${t.to.city} ${t.to.name}`:'Arrivo';$('departOnly').textContent=t.departTime||'';$('arrivalOnly').textContent=t.arrivalTime||'';$('flightDateCenter').textContent=t.flightDepartDate?new Intl.DateTimeFormat('it-IT',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(parseISO(t.flightDepartDate)):'';const destCC=t.to?.cc||t.destinationData?.countryCode||'',originCC=t.from?.cc||'IT';$('tripFlags').textContent=`${flag(destCC)} ${flag(originCC)}`;const dql=$('discoverQuickLabel');if(dql)dql.textContent=`Scopri ${t.destination||'la città'}`;renderTripArrivalHub(t);go('trip');updateWeatherForTrip(t);updateTripFlightLifecycle(t)}
function travelerSummary(t){
  const people=Array.isArray(t.travelers)?t.travelers:[];
  const names=people
    .map(x=>typeof x==='string'?x:(x?.name||''))
    .map(x=>String(x).trim())
    .filter(x=>x && !/^Viaggiatore\s+\d+$/i.test(x));
  if(names.length) return names.join(' · ');
  const bits=[];
  if(t.adults)bits.push(`${t.adults} adult${t.adults===1?'o':'i'}`);
  if(t.teens)bits.push(`${t.teens} ragazz${t.teens===1?'o':'i'}`);
  if(t.children)bits.push(`${t.children} bambin${t.children===1?'o':'i'}`);
  if(t.infants)bits.push(`${t.infants} neonat${t.infants===1?'o':'i'}`);
  return bits.join(' · ')||'Viaggio VYVA';
}
function tripCardHtml(t,showDates=true){
  const subtitle=(showDates&&t.start&&t.end?fmtRange(t.start,t.end)+' · ':'')+travelerSummary(t);
  return `<div class="tripminiWrap">
    <button class="tripmini" style="background-image:url('${t.cover||COVERS[0][1]}')" onclick="openTrip(${t.id})">
      <span class="txt"><b>${escapeHtml(t.destination||'Viaggio')}</b><small>${escapeHtml(subtitle)}</small></span>
    </button>
    <button class="tripMenuBtn" aria-label="Opzioni viaggio" onclick="toggleTripMenu(${t.id},event)">•••</button>
    <div id="tripMenu-${t.id}" class="tripMenu hide" onclick="event.stopPropagation()">
      <button onclick="openTripFromMenu(${t.id},event)">Apri viaggio</button>
      <button class="danger" onclick="deleteTrip(${t.id},event)">Elimina viaggio</button>
    </div>
  </div>`;
}

function closeActiveTripMenu(){
  const menu=$('activeTripMenu');
  if(menu)menu.classList.add('hide');
}
function toggleActiveTripMenu(event){
  if(event){event.preventDefault();event.stopPropagation()}
  const menu=$('activeTripMenu');
  if(menu)menu.classList.toggle('hide');
}
function openCoverEditor(){
  closeActiveTripMenu();
  const t=currentTrip();
  if(!t)return;
  const overlay=$('coverEditOverlay'),grid=$('coverEditGrid');
  if(!overlay||!grid)return;
  grid.innerHTML=COVERS.map((c,i)=>`<button class="coverEditChoice ${t.cover===c[1]?'on':''}" style="background-image:url('${c[1]}')" onclick="setTripCover(${i})"><span>${escapeHtml(c[0])}</span></button>`).join('');
  overlay.classList.remove('hide');
}
function closeCoverEditor(event){
  if(event&&event.target!==$('coverEditOverlay'))return;
  const overlay=$('coverEditOverlay');
  if(overlay)overlay.classList.add('hide');
}
function setTripCover(index){
  const t=currentTrip(),cover=COVERS[index]?.[1];
  if(!t||!cover)return;
  const trips=safeTrips();
  const idx=trips.findIndex(x=>String(x.id)===String(t.id));
  if(idx<0)return;
  trips[idx].cover=cover;
  localStorage.setItem(STORE,JSON.stringify(trips));
  $('tripbg').style.backgroundImage=`url('${cover}')`;
  renderHomeTrips();
  const grid=$('coverEditGrid');
  if(grid)grid.querySelectorAll('.coverEditChoice').forEach((b,i)=>b.classList.toggle('on',i===index));
}
function exitCurrentTrip(event){
  if(event){event.preventDefault();event.stopPropagation()}
  closeActiveTripMenu();
  closeCoverEditor();
  localStorage.removeItem(CURRENT);
  try{localStorage.removeItem(TRIP_CONTEXT_STORE)}catch(e){}
  setActive('Viaggi');
  $('ptitle').textContent='Viaggi';
  $('ptext').textContent='Tutti i viaggi che hai creato con VYVA.';
  renderTripsPanel();
  go('panel');
}
function deleteCurrentTripFromHeader(event){
  if(event){event.preventDefault();event.stopPropagation()}
  const t=currentTrip();
  if(!t)return;
  if(!confirm(`Vuoi eliminare il viaggio ${t.destination?'a '+t.destination:''}?`))return;
  localStorage.setItem(STORE,JSON.stringify(safeTrips().filter(x=>String(x.id)!==String(t.id))));
  localStorage.removeItem(CURRENT);
  try{localStorage.removeItem(TRIP_CONTEXT_STORE)}catch(e){}
  closeActiveTripMenu();
  renderHomeTrips();
  setActive('Viaggi');
  $('ptitle').textContent='Viaggi';
  $('ptext').textContent='Tutti i viaggi che hai creato con VYVA.';
  renderTripsPanel();
  go('panel');
}


function closeTripMenus(exceptId=null){
  document.querySelectorAll('.tripMenu').forEach(m=>{
    if(exceptId===null || m.id!==`tripMenu-${exceptId}`)m.classList.add('hide');
  });
}
function toggleTripMenu(id,event){
  if(event){event.preventDefault();event.stopPropagation()}
  const menu=$(`tripMenu-${id}`);
  if(!menu)return;
  const opening=menu.classList.contains('hide');
  closeTripMenus();
  if(opening)menu.classList.remove('hide');
}
function openTripFromMenu(id,event){
  if(event){event.preventDefault();event.stopPropagation()}
  closeTripMenus();
  openTrip(id);
}
document.addEventListener('click',()=>{closeTripMenus();closeActiveTripMenu()});

function renderHomeTrips(){const a=safeTrips();$('homeTrips').innerHTML=a.length?a.map(t=>tripCardHtml(t,true)).join(''):'<div class="card muted">Il tuo primo viaggio VYVA inizierà qui.</div>'}
function renderTripsPanel(){const a=safeTrips();$('pbody').innerHTML=a.length?a.map(t=>tripCardHtml(t,false)).join(''):'<div class="card">Non hai ancora creato viaggi.</div>'}
function deleteTrip(id,event){if(event){event.preventDefault();event.stopPropagation()}const trips=safeTrips(),trip=trips.find(x=>x.id===id);if(!trip)return;if(!confirm(`Vuoi eliminare il viaggio ${trip.destination?'a '+trip.destination:''}?`))return;const next=trips.filter(x=>x.id!==id);localStorage.setItem(STORE,JSON.stringify(next));if(localStorage.getItem(CURRENT)===String(id)){localStorage.removeItem(CURRENT);try{localStorage.removeItem(TRIP_CONTEXT_STORE)}catch(e){}}renderHomeTrips();if($('panel').classList.contains('on')&&$('ptitle').textContent==='Viaggi')renderTripsPanel()}
function openTrip(id){const t=safeTrips().find(x=>x.id===id);if(t){showTrip(t);setActive('Viaggi')}}
function navTo(t){
  if(t!=='Wallet')clearWalletAirlineTheme();
  setActive(t);
  const active=currentTrip();

  if(t==='home'){
    renderHomeTrips();
    go('home');
    return;
  }

  if(t==='Viaggi'){
    if(active){
      showTrip(active);
      setActive('Viaggi');
      return;
    }
    $('ptitle').textContent='Viaggi';
    $('ptext').textContent='Tutti i viaggi che hai creato con VYVA.';
    renderTripsPanel();
    go('panel');
    return;
  }

  if(t==='Wallet'){
    $('ptitle').textContent='Wallet';
    if(!active){
      $('ptext').textContent='Apri prima uno dei tuoi viaggi.';
      $('pbody').innerHTML='<div class="card">Il Wallet è collegato al viaggio aperto. Apri un viaggio dalla sezione Viaggi.</div>';
      go('panel');
      return;
    }
    $('ptext').textContent=`Wallet del viaggio ${active.destination}.`;
    renderWalletPanel();
    go('panel');
    return;
  }

  if(t==='Move'){
    openMovePanel();
    return;
  }

  if(t==='Profilo'){
    renderProfilePanel();
    go('panel');
    return;
  }

  $('ptitle').textContent=t;
  $('ptext').textContent=t==='Moments'
    ?(active?`Moments del viaggio ${active.destination}.`:'Quale momento vorrai ricordare?')
    :'';
  $('pbody').innerHTML='<div class="card">Questa sezione è pronta nella struttura VYVA e la svilupperemo dopo il flusso principale.</div>';
  go('panel');
}

loadWorldCities();buildTravelerNames();renderCalendar();renderCovers();renderHomeTrips();
