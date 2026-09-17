const MOVE_STORE='vyvaMoveWalletV1';
let moveMode='transit';
let weatherCache={};

const TRIP_CONTEXT_STORE='vyvaTripContextV1';
function saveActiveTripContext(t){
  if(!t?.id)return;
  const coords=tripCoords(t);
  const context={
    tripId:String(t.id),
    destination:String(t.destination||t.to?.city||''),
    destinationCity:String(t.destination||t.to?.city||''),
    country:String(t.destinationData?.country||t.to?.country||''),
    countryCode:String(t.destinationData?.countryCode||t.to?.cc||''),
    lat:coords?.lat??null,
    lon:coords?.lon??null,
    updatedAt:new Date().toISOString()
  };
  try{localStorage.setItem(TRIP_CONTEXT_STORE,JSON.stringify(context))}catch(e){}
}
function currentTrip(){
  const id=localStorage.getItem(CURRENT);
  if(!id)return null;
  const t=safeTrips().find(x=>String(x.id)===String(id))||null;
  if(t)saveActiveTripContext(t);
  return t;
}
function safeMoveItems(){try{return JSON.parse(localStorage.getItem(MOVE_STORE)||'[]')}catch(e){return[]}}
function weatherEmoji(code){if(code===0)return'☀️';if([1,2].includes(code))return'🌤️';if(code===3)return'☁️';if([45,48].includes(code))return'🌫️';if([51,53,55,56,57].includes(code))return'🌦️';if([61,63,65,66,67,80,81,82].includes(code))return'🌧️';if([71,73,75,77,85,86].includes(code))return'🌨️';if([95,96,99].includes(code))return'⛈️';return'🌤️'}
function weatherLabel(code){if(code===0)return'Sereno';if([1,2].includes(code))return'Poco nuvoloso';if(code===3)return'Nuvoloso';if([45,48].includes(code))return'Nebbia';if([51,53,55,56,57].includes(code))return'Pioviggine';if([61,63,65,66,67,80,81,82].includes(code))return'Pioggia';if([71,73,75,77,85,86].includes(code))return'Neve';if([95,96,99].includes(code))return'Temporali';return'Meteo variabile'}
function tripCoords(t){if(t?.destinationData?.lat!=null&&t?.destinationData?.lon!=null)return{lat:t.destinationData.lat,lon:t.destinationData.lon};if(t?.to?.lat!=null&&t?.to?.lon!=null)return{lat:t.to.lat,lon:t.to.lon};return null}
async function getTripWeather(t,force=false){if(!t)return null;const key=String(t.id||t.destination||'trip');if(!force&&weatherCache[key])return weatherCache[key];const c=tripCoords(t);if(!c)return null;const url=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(c.lat)}&longitude=${encodeURIComponent(c.lon)}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;const r=await fetch(url);if(!r.ok)throw new Error('weather');const data=await r.json();weatherCache[key]=data;return data}
async function updateWeatherForTrip(t,force=false){if(!$('weatherCard'))return;$('weatherTitle').textContent=`Meteo ora a ${t?.destination||'destinazione'}`;$('weatherText').textContent='Aggiornamento meteo…';$('weatherTemp').textContent='—';try{const d=await getTripWeather(t,force);if(!d||!d.current){$('weatherIcon').textContent='🌍';$('weatherText').textContent='Meteo disponibile quando VYVA riconosce la posizione della destinazione.';return}const c=d.current,code=Number(c.weather_code);$('weatherIcon').textContent=weatherEmoji(code);$('weatherTemp').textContent=`${Math.round(c.temperature_2m)}°`;let note=`${weatherLabel(code)} · percepiti ${Math.round(c.apparent_temperature)}°`;const start=t?.start?parseISO(t.start):null;if(start&&((start-new Date())/86400000)>16)note+=' · il meteo del viaggio sarà disponibile più vicino alla partenza';$('weatherText').textContent=note}catch(e){$('weatherIcon').textContent='🌍';$('weatherText').textContent='Meteo temporaneamente non disponibile.'}}
async function openWeatherPanel(){const t=currentTrip();setActive('Move');$('ptitle').textContent='Meteo';$('ptext').textContent=t?`Meteo live a ${t.destination}. VYVA userà queste informazioni per adattare il viaggio.`:'Meteo del viaggio.';$('pbody').innerHTML='<div class="card">Caricamento previsioni…</div>';go('panel');if(!t)return;try{const d=await getTripWeather(t,true);if(!d)return;const days=(d.daily?.time||[]).map((date,i)=>({date,code:d.daily.weather_code[i],max:d.daily.temperature_2m_max[i],min:d.daily.temperature_2m_min[i]}));$('pbody').innerHTML=`<div class="moveHero"><h2>${weatherEmoji(Number(d.current.weather_code))} ${Math.round(d.current.temperature_2m)}°</h2><p>${weatherLabel(Number(d.current.weather_code))} · percepiti ${Math.round(d.current.apparent_temperature)}° · vento ${Math.round(d.current.wind_speed_10m)} km/h</p></div><div class="weatherDetail">${days.map(x=>`<div class="weatherDay"><div class="wi">${weatherEmoji(Number(x.code))}</div><b>${new Intl.DateTimeFormat('it-IT',{weekday:'short',day:'numeric',month:'short'}).format(parseISO(x.date))}</b><small>${Math.round(x.max)}° / ${Math.round(x.min)}° · ${weatherLabel(Number(x.code))}</small></div>`).join('')}</div><div class="card"><b>Meteo intelligente VYVA</b><p class="muted">Quando il viaggio sarà vicino, useremo il meteo per suggerire cambi di orario, attività al coperto e mezzi più comodi in caso di pioggia o caldo forte.</p><button class="sectionAction" onclick="openMovePanel()">Apri Spostamenti</button></div>`}catch(e){$('pbody').innerHTML='<div class="card">Meteo temporaneamente non disponibile. Riprova tra poco.</div>'}}

function enc(s){return encodeURIComponent(s||'')}
let moveSelectedPlaces={from:null,to:null};
let moveSearchTimers={from:null,to:null};
let moveSearchSeq={from:0,to:0};

function placeQueryValue(which){
  const el=$(which==='from'?'moveFrom':'moveTo');
  return el?.value.trim()||'';
}
function googleDirectionsUrl(mode){
  const fromText=placeQueryValue('from'),toText=placeQueryValue('to');
  const from=moveSelectedPlaces.from;
  const to=moveSelectedPlaces.to;
  let u='https://www.google.com/maps/dir/?api=1';
  if(from)u+='&origin='+enc(`${from.lat},${from.lon}`);
  else if(fromText)u+='&origin='+enc(fromText);
  if(to)u+='&destination='+enc(`${to.lat},${to.lon}`);
  else if(toText)u+='&destination='+enc(toText);
  if(mode)u+='&travelmode='+enc(mode);
  return u
}
function cityProviders(city,country){
 const c=norm(city),co=norm(country),transit=(name,url,desc='Biglietti e informazioni ufficiali')=>({type:'transit',name,url,desc,badge:'Ufficiale'}),train=(name,url,desc='Treni e collegamenti')=>({type:'train',name,url,desc,badge:'Biglietti'}),ride=(name,url,desc='Taxi e ride-hailing')=>({type:'ride',name,url,desc,badge:'Prenota'});let p=[];
 if(c.includes('londra')||c.includes('london'))p=[transit('Transport for London','https://tfl.gov.uk/travel-information/visiting-london/getting-around-london/best-ways-for-visitors-to-pay','Come pagare: contactless, Oyster e Travelcard'),train('National Rail','https://www.nationalrail.co.uk/','Treni nel Regno Unito'),ride('Uber','https://m.uber.com/looking'),ride('Bolt','https://bolt.eu/en/cities/london/')];
 else if(c.includes('parigi')||c.includes('paris'))p=[transit('Île-de-France Mobilités','https://www.iledefrance-mobilites.fr/en','Metro, RER, bus e tram'),train('SNCF Connect','https://www.sncf-connect.com/en-en/'),ride('Uber','https://m.uber.com/looking')];
 else if(c.includes('milano')||c.includes('milan'))p=[transit('ATM Milano','https://www.atm.it/en/Pages/default.aspx','Metro, tram e bus'),train('Trenitalia','https://www.trenitalia.com/en.html'),train('Italo','https://www.italotreno.com/en'),ride('Uber','https://m.uber.com/looking')];
 else if(c.includes('roma')||c.includes('rome'))p=[transit('ATAC Roma','https://www.atac.roma.it/en','Metro, tram e bus'),train('Trenitalia','https://www.trenitalia.com/en.html'),train('Italo','https://www.italotreno.com/en'),ride('Uber','https://m.uber.com/looking')];
 else if(c.includes('bangkok'))p=[transit('BTS Skytrain','https://www.bts.co.th/eng/','Skytrain e informazioni biglietti'),transit('MRT Bangkok','https://www.bemplc.co.th/','Metro MRT'),ride('Grab','https://www.grab.com/th/en/')];
 else if(c.includes('tokyo'))p=[transit('Tokyo Metro','https://www.tokyometro.jp/en/','Metro e pass'),train('JR East','https://www.jreast.co.jp/multi/en/'),ride('Uber','https://m.uber.com/looking')];
 else if(c.includes('amsterdam'))p=[transit('GVB','https://www.gvb.nl/en','Metro, tram, bus e ferry'),train('NS','https://www.ns.nl/en'),ride('Uber','https://m.uber.com/looking')];
 else if(c.includes('madrid'))p=[transit('Metro de Madrid','https://www.metromadrid.es/en'),train('Renfe','https://www.renfe.com/es/en'),ride('Uber','https://m.uber.com/looking')];
 else if(c.includes('barcellona')||c.includes('barcelona'))p=[transit('TMB Barcelona','https://www.tmb.cat/en/home'),train('Renfe','https://www.renfe.com/es/en'),ride('Uber','https://m.uber.com/looking')];
 else if(c.includes('dubai'))p=[transit('RTA Dubai','https://www.rta.ae/wps/portal/rta/ae/home','Metro, bus, tram e taxi'),ride('Careem','https://www.careem.com/'),ride('Uber','https://m.uber.com/looking')];
 else if(c.includes('singapore'))p=[transit('SimplyGo','https://www.simplygo.com.sg/','Trasporto pubblico e carte'),ride('Grab','https://www.grab.com/sg/')];
 else if(co.includes('italia'))p=[train('Trenitalia','https://www.trenitalia.com/en.html'),train('Italo','https://www.italotreno.com/en'),ride('Uber','https://m.uber.com/looking')];
 if(!p.length)p=[train('Omio','https://www.omio.com/','Treni e bus dove disponibili'),train('Trainline','https://www.thetrainline.com/','Treni e bus'),ride('Uber','https://m.uber.com/looking')];
 return p
}
function providerModeMatch(p,mode){if(mode==='metro'||mode==='bustram')return p.type==='transit';if(mode==='train')return p.type==='train';if(mode==='ride')return p.type==='ride';return false}
function setMoveMode(mode,el){
  moveMode=mode;
  document.querySelectorAll('.moveMode').forEach(x=>x.classList.remove('on'));
  if(el)el.classList.add('on');
  renderProviders();
  updateRouteChoices();
}
function renderProviders(){
  const t=currentTrip();if(!t||!$('providerList'))return;
  const city=t.destination||t.to?.city||'',country=t.to?.country||t.destinationData?.country||'';

  if(moveMode==='walk'){
    $('providerList').innerHTML='';
    return;
  }

  const list=cityProviders(city,country).filter(p=>providerModeMatch(p,moveMode));
  if(!list.length){$('providerList').innerHTML='';return}

  $('providerList').innerHTML=list.map(p=>`<div class="providerCard">
    <div class="providerHead">
      <div><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.desc)}</small></div>
      <span class="providerBadge">${escapeHtml(p.badge)}</span>
    </div>
    <div class="providerActions">
      <a target="_blank" rel="noopener" href="${p.url}">Acquista / Prenota</a>
      <button onclick="saveMoveItem('${p.type}','${escapeHtml(p.name).replace(/'/g,"&#39;")}','${p.url}')">Ho acquistato · Salva</button>
    </div>
  </div>`).join('');
}



const VYVA_PLACES_PROXY_URL='https://vyva-places.2zk99ps5hw-0b0.workers.dev'; // Inserire QUI solo l'URL pubblico del proxy sicuro, mai la chiave Geoapify.
const VYVA_PLACE_CACHE_STORAGE='vyvaGlobalPlaceCacheV1';
const VYVA_PLACE_CACHE_MAX=1200;

function safeGlobalPlaceCache(){
  try{
    const v=JSON.parse(localStorage.getItem(VYVA_PLACE_CACHE_STORAGE)||'[]');
    return Array.isArray(v)?v:[];
  }catch(e){return[]}
}
function saveGlobalPlaceCache(features){
  if(!Array.isArray(features)||!features.length)return;
  let cache=safeGlobalPlaceCache();
  const incoming=features.map(f=>{
    const p=f.properties||{},c=f.geometry?.coordinates||[];
    return {
      name:p.name||p.address_line1||p.formatted||p.street||'Luogo',
      formatted:p.formatted||p.address_line2||'',
      city:p.city||p.locality||'',
      country:p.country||'',
      type:p.result_type||p.category||p.vyva_type||'place',
      lat:Number(c[1]),lon:Number(c[0]),
      aliases:[p.address_line1,p.address_line2,p.street,p.suburb,p.district].filter(Boolean)
    };
  }).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon));

  const keyOf=x=>vyvaNormalizeText(x.name)+'|'+x.lat.toFixed(4)+'|'+x.lon.toFixed(4);
  const map=new Map(cache.map(x=>[keyOf(x),x]));
  incoming.forEach(x=>map.set(keyOf(x),x));
  cache=[...map.values()].slice(-VYVA_PLACE_CACHE_MAX);
  localStorage.setItem(VYVA_PLACE_CACHE_STORAGE,JSON.stringify(cache));
}
function cachedMovePlaceResults(value,t){
  const query=vyvaNormalizeText(value);
  if(query.length<2)return [];
  const coords=tripCoords(t);
  const cache=safeGlobalPlaceCache();
  return cache.map(p=>{
    let score=scoreLocalPlace(p,value);
    if(score<=0)return null;
    if(coords){
      const km=haversineKm({lat:p.lat,lon:p.lon},coords);
      if(Number.isFinite(km))score+=Math.max(0,120-Math.min(km,120));
    }
    return {p,score};
  }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,7).map(({p})=>localPlaceFeature(p));
}
function proxyFeatureToVyva(f){
  const p=f.properties||{};
  const lon=Number(p.lon ?? f.geometry?.coordinates?.[0]);
  const lat=Number(p.lat ?? f.geometry?.coordinates?.[1]);
  return {
    type:'Feature',
    geometry:{type:'Point',coordinates:[lon,lat]},
    properties:{
      name:p.name||p.address_line1||p.formatted||p.street||'Luogo',
      city:p.city||p.locality||p.county||'',
      country:p.country||'',
      street:p.street||'',
      housenumber:p.housenumber||'',
      postcode:p.postcode||'',
      district:p.district||p.suburb||'',
      address_line1:p.address_line1||'',
      address_line2:p.address_line2||'',
      formatted:p.formatted||'',
      result_type:p.result_type||'',
      category:p.category||'',
      osm_key:p.category?'amenity':'place',
      osm_value:p.category||p.result_type||'place',
      vyva_source:'secure-proxy'
    }
  };
}
async function searchSecureWorldPlaces(value,t){
  if(!VYVA_PLACES_PROXY_URL)return [];
  const coords=tripCoords(t);
  const city=t?.destination||t?.to?.city||'';
  const params=new URLSearchParams({text:value,lang:'it'});
  if(city)params.set('city',city);
  if(coords){
    params.set('lat',String(coords.lat));
    params.set('lon',String(coords.lon));
  }
  const url=`${VYVA_PLACES_PROXY_URL}?${params.toString()}`;
  const r=await fetch(url,{headers:{'Accept':'application/json'}});
  if(!r.ok)throw new Error('secure-place-search');
  const data=await r.json();
  const features=(data.features||[]).map(proxyFeatureToVyva)
    .filter(f=>Number.isFinite(f.geometry.coordinates[0])&&Number.isFinite(f.geometry.coordinates[1]));
  saveGlobalPlaceCache(features);
  return features;
}
function renderProfilePanel(){
  $('ptitle').textContent='Profilo';
  $('ptext').textContent='Persone e preferenze che rendono ogni viaggio tuo.';
  $('pbody').innerHTML=`<div class="card"><b>Profilo viaggiatori</b><p class="muted">Qui svilupperemo Travel DNA, preferenze e dati della famiglia.</p></div>
  <div class="devPlacesCard">
    <h3>🌍 Ricerca luoghi mondiale</h3>
    <p>La ricerca mondiale è gestita dalla configurazione tecnica di VYVA. Nessuna chiave privata viene mostrata o salvata nel browser.</p>
    <div class="devPlacesStatus ${VYVA_PLACES_PROXY_URL?'ok':''}">
      ${VYVA_PLACES_PROXY_URL?'✓ Motore mondiale sicuro collegato.':'Motore mondiale sicuro non ancora collegato. Move continua comunque a usare mappa locale, cache e fallback OpenStreetMap.'}
    </div>
  </div>`;
}

const VYVA_LONDON_PLACES=[{"name":"Victoria Station","type":"station","lat":51.4952,"lon":-0.1439,"city":"London","country":"United Kingdom","aliases":["London Victoria","Victoria railway station","Victoria train station"]},{"name":"Victoria Underground Station","type":"tube","lat":51.4964,"lon":-0.144,"city":"London","country":"United Kingdom","aliases":["Victoria tube","Victoria metro"]},{"name":"Victoria Coach Station","type":"bus","lat":51.4926,"lon":-0.1486,"city":"London","country":"United Kingdom","aliases":["Victoria bus station","coach station"]},{"name":"King's Cross St Pancras","type":"station","lat":51.5308,"lon":-0.1238,"city":"London","country":"United Kingdom","aliases":["Kings Cross","St Pancras","King's Cross Station"]},{"name":"St Pancras International","type":"station","lat":51.5319,"lon":-0.1263,"city":"London","country":"United Kingdom","aliases":["Eurostar London","St Pancras"]},{"name":"London Euston","type":"station","lat":51.5282,"lon":-0.1337,"city":"London","country":"United Kingdom","aliases":["Euston Station"]},{"name":"Paddington Station","type":"station","lat":51.5154,"lon":-0.1755,"city":"London","country":"United Kingdom","aliases":["London Paddington"]},{"name":"Waterloo Station","type":"station","lat":51.5033,"lon":-0.1132,"city":"London","country":"United Kingdom","aliases":["London Waterloo"]},{"name":"London Bridge Station","type":"station","lat":51.5055,"lon":-0.0865,"city":"London","country":"United Kingdom","aliases":["London Bridge train station"]},{"name":"Liverpool Street Station","type":"station","lat":51.5178,"lon":-0.0823,"city":"London","country":"United Kingdom","aliases":["London Liverpool Street"]},{"name":"Charing Cross Station","type":"station","lat":51.508,"lon":-0.1247,"city":"London","country":"United Kingdom","aliases":["London Charing Cross"]},{"name":"Marylebone Station","type":"station","lat":51.5225,"lon":-0.1631,"city":"London","country":"United Kingdom","aliases":["London Marylebone"]},{"name":"Farringdon Station","type":"station","lat":51.5201,"lon":-0.1053,"city":"London","country":"United Kingdom","aliases":["Farringdon"]},{"name":"Blackfriars Station","type":"station","lat":51.5118,"lon":-0.1032,"city":"London","country":"United Kingdom","aliases":["London Blackfriars"]},{"name":"Clapham Junction","type":"station","lat":51.4642,"lon":-0.1702,"city":"London","country":"United Kingdom","aliases":["Clapham Junction Station"]},{"name":"Vauxhall Station","type":"station","lat":51.4861,"lon":-0.1229,"city":"London","country":"United Kingdom","aliases":["Vauxhall"]},{"name":"Stratford Station","type":"station","lat":51.5413,"lon":-0.0032,"city":"London","country":"United Kingdom","aliases":["Stratford London"]},{"name":"Canary Wharf Station","type":"station","lat":51.5036,"lon":-0.0195,"city":"London","country":"United Kingdom","aliases":["Canary Wharf tube"]},{"name":"Tottenham Court Road Station","type":"tube","lat":51.5164,"lon":-0.1303,"city":"London","country":"United Kingdom","aliases":["Tottenham Court Road","TCR"]},{"name":"Oxford Circus Station","type":"tube","lat":51.5152,"lon":-0.1419,"city":"London","country":"United Kingdom","aliases":["Oxford Circus"]},{"name":"Piccadilly Circus Station","type":"tube","lat":51.5101,"lon":-0.134,"city":"London","country":"United Kingdom","aliases":["Piccadilly Circus"]},{"name":"Green Park Station","type":"tube","lat":51.5067,"lon":-0.1428,"city":"London","country":"United Kingdom","aliases":["Green Park tube"]},{"name":"Westminster Station","type":"tube","lat":51.501,"lon":-0.1254,"city":"London","country":"United Kingdom","aliases":["Westminster tube"]},{"name":"Embankment Station","type":"tube","lat":51.5072,"lon":-0.1223,"city":"London","country":"United Kingdom","aliases":["Embankment tube"]},{"name":"Leicester Square Station","type":"tube","lat":51.5113,"lon":-0.1281,"city":"London","country":"United Kingdom","aliases":["Leicester Square tube"]},{"name":"Covent Garden Station","type":"tube","lat":51.5131,"lon":-0.1243,"city":"London","country":"United Kingdom","aliases":["Covent Garden tube"]},{"name":"Bond Street Station","type":"tube","lat":51.5142,"lon":-0.1494,"city":"London","country":"United Kingdom","aliases":["Bond Street tube"]},{"name":"Baker Street Station","type":"tube","lat":51.5226,"lon":-0.1571,"city":"London","country":"United Kingdom","aliases":["Baker Street tube"]},{"name":"South Kensington Station","type":"tube","lat":51.4941,"lon":-0.1738,"city":"London","country":"United Kingdom","aliases":["South Kensington tube"]},{"name":"Gloucester Road Station","type":"tube","lat":51.4945,"lon":-0.1835,"city":"London","country":"United Kingdom","aliases":["Gloucester Road tube"]},{"name":"Notting Hill Gate Station","type":"tube","lat":51.5094,"lon":-0.1967,"city":"London","country":"United Kingdom","aliases":["Notting Hill Gate tube"]},{"name":"Tower Hill Station","type":"tube","lat":51.51,"lon":-0.0766,"city":"London","country":"United Kingdom","aliases":["Tower Hill tube"]},{"name":"Bank Station","type":"tube","lat":51.5133,"lon":-0.0886,"city":"London","country":"United Kingdom","aliases":["Bank tube"]},{"name":"Monument Station","type":"tube","lat":51.5108,"lon":-0.0863,"city":"London","country":"United Kingdom","aliases":["Monument tube"]},{"name":"Earl's Court Station","type":"tube","lat":51.4915,"lon":-0.1939,"city":"London","country":"United Kingdom","aliases":["Earls Court tube"]},{"name":"Hammersmith Station","type":"tube","lat":51.4927,"lon":-0.2247,"city":"London","country":"United Kingdom","aliases":["Hammersmith tube"]},{"name":"Heathrow Airport","type":"airport","lat":51.47,"lon":-0.4543,"city":"London","country":"United Kingdom","aliases":["LHR","London Heathrow"]},{"name":"Gatwick Airport","type":"airport","lat":51.1537,"lon":-0.1821,"city":"London","country":"United Kingdom","aliases":["LGW","London Gatwick"]},{"name":"Stansted Airport","type":"airport","lat":51.886,"lon":0.2389,"city":"London","country":"United Kingdom","aliases":["STN","London Stansted"]},{"name":"Luton Airport","type":"airport","lat":51.8747,"lon":-0.3683,"city":"London","country":"United Kingdom","aliases":["LTN","London Luton"]},{"name":"London City Airport","type":"airport","lat":51.5053,"lon":0.0553,"city":"London","country":"United Kingdom","aliases":["LCY"]},{"name":"British Museum","type":"museum","lat":51.5194,"lon":-0.127,"city":"London","country":"United Kingdom","aliases":["The British Museum"]},{"name":"Natural History Museum","type":"museum","lat":51.4967,"lon":-0.1764,"city":"London","country":"United Kingdom","aliases":["NHM London"]},{"name":"Science Museum","type":"museum","lat":51.4978,"lon":-0.1745,"city":"London","country":"United Kingdom","aliases":["Science Museum London"]},{"name":"Victoria and Albert Museum","type":"museum","lat":51.4966,"lon":-0.1722,"city":"London","country":"United Kingdom","aliases":["V&A","V and A Museum"]},{"name":"National Gallery","type":"museum","lat":51.5089,"lon":-0.1283,"city":"London","country":"United Kingdom","aliases":["The National Gallery"]},{"name":"Tate Modern","type":"museum","lat":51.5076,"lon":-0.0994,"city":"London","country":"United Kingdom","aliases":["Tate Modern London"]},{"name":"Tate Britain","type":"museum","lat":51.4911,"lon":-0.1278,"city":"London","country":"United Kingdom","aliases":["Tate Britain London"]},{"name":"London Eye","type":"attraction","lat":51.5033,"lon":-0.1195,"city":"London","country":"United Kingdom","aliases":["The London Eye"]},{"name":"Big Ben","type":"landmark","lat":51.5007,"lon":-0.1246,"city":"London","country":"United Kingdom","aliases":["Elizabeth Tower"]},{"name":"Palace of Westminster","type":"landmark","lat":51.4995,"lon":-0.1248,"city":"London","country":"United Kingdom","aliases":["Houses of Parliament"]},{"name":"Westminster Abbey","type":"landmark","lat":51.4993,"lon":-0.1273,"city":"London","country":"United Kingdom","aliases":["Abbey Westminster"]},{"name":"Buckingham Palace","type":"landmark","lat":51.5014,"lon":-0.1419,"city":"London","country":"United Kingdom","aliases":["Buckingham"]},{"name":"Tower of London","type":"attraction","lat":51.5081,"lon":-0.0759,"city":"London","country":"United Kingdom","aliases":["The Tower of London"]},{"name":"Tower Bridge","type":"landmark","lat":51.5055,"lon":-0.0754,"city":"London","country":"United Kingdom","aliases":["London Tower Bridge"]},{"name":"St Paul's Cathedral","type":"landmark","lat":51.5138,"lon":-0.0984,"city":"London","country":"United Kingdom","aliases":["Saint Paul's Cathedral"]},{"name":"The Shard","type":"attraction","lat":51.5045,"lon":-0.0865,"city":"London","country":"United Kingdom","aliases":["Shard London"]},{"name":"Sky Garden","type":"attraction","lat":51.5113,"lon":-0.0836,"city":"London","country":"United Kingdom","aliases":["Sky Garden London"]},{"name":"Madame Tussauds London","type":"attraction","lat":51.5229,"lon":-0.1548,"city":"London","country":"United Kingdom","aliases":["Madame Tussauds"]},{"name":"SEA LIFE London Aquarium","type":"attraction","lat":51.502,"lon":-0.1197,"city":"London","country":"United Kingdom","aliases":["Sea Life London"]},{"name":"London Dungeon","type":"attraction","lat":51.5026,"lon":-0.1198,"city":"London","country":"United Kingdom","aliases":["The London Dungeon"]},{"name":"Royal Observatory Greenwich","type":"attraction","lat":51.4769,"lon":-0.0005,"city":"London","country":"United Kingdom","aliases":["Greenwich Observatory"]},{"name":"Cutty Sark","type":"attraction","lat":51.481,"lon":-0.0097,"city":"London","country":"United Kingdom","aliases":["Cutty Sark Greenwich"]},{"name":"Kew Gardens","type":"park","lat":51.4787,"lon":-0.2956,"city":"London","country":"United Kingdom","aliases":["Royal Botanic Gardens Kew"]},{"name":"Hampton Court Palace","type":"attraction","lat":51.4036,"lon":-0.3376,"city":"London","country":"United Kingdom","aliases":["Hampton Court"]},{"name":"Covent Garden Market","type":"market","lat":51.5118,"lon":-0.1229,"city":"London","country":"United Kingdom","aliases":["Covent Garden"]},{"name":"Borough Market","type":"market","lat":51.5055,"lon":-0.091,"city":"London","country":"United Kingdom","aliases":["Borough Market London"]},{"name":"Camden Market","type":"market","lat":51.5416,"lon":-0.1465,"city":"London","country":"United Kingdom","aliases":["Camden Lock Market"]},{"name":"Portobello Road Market","type":"market","lat":51.517,"lon":-0.2052,"city":"London","country":"United Kingdom","aliases":["Portobello Market"]},{"name":"Oxford Street","type":"area","lat":51.5154,"lon":-0.141,"city":"London","country":"United Kingdom","aliases":["Oxford Street London"]},{"name":"Regent Street","type":"area","lat":51.5129,"lon":-0.1396,"city":"London","country":"United Kingdom","aliases":["Regent Street London"]},{"name":"Carnaby Street","type":"area","lat":51.5135,"lon":-0.1392,"city":"London","country":"United Kingdom","aliases":["Carnaby"]},{"name":"Harrods","type":"shop","lat":51.4994,"lon":-0.1632,"city":"London","country":"United Kingdom","aliases":["Harrods London"]},{"name":"Selfridges","type":"shop","lat":51.5142,"lon":-0.1527,"city":"London","country":"United Kingdom","aliases":["Selfridges London"]},{"name":"Hamleys","type":"shop","lat":51.5118,"lon":-0.1398,"city":"London","country":"United Kingdom","aliases":["Hamleys Regent Street"]},{"name":"Hyde Park","type":"park","lat":51.5073,"lon":-0.1657,"city":"London","country":"United Kingdom","aliases":["Hyde Park London"]},{"name":"Kensington Gardens","type":"park","lat":51.5069,"lon":-0.1796,"city":"London","country":"United Kingdom","aliases":["Kensington Gardens London"]},{"name":"Regent's Park","type":"park","lat":51.5313,"lon":-0.1569,"city":"London","country":"United Kingdom","aliases":["Regents Park"]},{"name":"St James's Park","type":"park","lat":51.5025,"lon":-0.134,"city":"London","country":"United Kingdom","aliases":["St James Park"]},{"name":"Greenwich Park","type":"park","lat":51.4769,"lon":0.0005,"city":"London","country":"United Kingdom","aliases":["Greenwich Park London"]},{"name":"Soho","type":"area","lat":51.5136,"lon":-0.1365,"city":"London","country":"United Kingdom","aliases":["Soho London"]},{"name":"Mayfair","type":"area","lat":51.5116,"lon":-0.1478,"city":"London","country":"United Kingdom","aliases":["Mayfair London"]},{"name":"Notting Hill","type":"area","lat":51.5096,"lon":-0.2043,"city":"London","country":"United Kingdom","aliases":["Notting Hill London"]},{"name":"Camden Town","type":"area","lat":51.5392,"lon":-0.1426,"city":"London","country":"United Kingdom","aliases":["Camden London"]},{"name":"Kensington","type":"area","lat":51.5009,"lon":-0.193,"city":"London","country":"United Kingdom","aliases":["Kensington London"]},{"name":"Chelsea","type":"area","lat":51.4875,"lon":-0.1687,"city":"London","country":"United Kingdom","aliases":["Chelsea London"]},{"name":"South Bank","type":"area","lat":51.505,"lon":-0.116,"city":"London","country":"United Kingdom","aliases":["Southbank London"]},{"name":"Greenwich","type":"area","lat":51.4826,"lon":-0.0077,"city":"London","country":"United Kingdom","aliases":["Greenwich London"]},{"name":"Shoreditch","type":"area","lat":51.5245,"lon":-0.078,"city":"London","country":"United Kingdom","aliases":["Shoreditch London"]},{"name":"The Clermont London Victoria","type":"hotel","lat":51.4951,"lon":-0.1455,"city":"London","country":"United Kingdom","aliases":["Clermont Victoria"]},{"name":"Park Plaza Westminster Bridge London","type":"hotel","lat":51.5009,"lon":-0.1169,"city":"London","country":"United Kingdom","aliases":["Park Plaza Westminster Bridge"]},{"name":"Premier Inn London Victoria","type":"hotel","lat":51.4926,"lon":-0.1456,"city":"London","country":"United Kingdom","aliases":["Premier Inn Victoria"]},{"name":"DoubleTree by Hilton London Victoria","type":"hotel","lat":51.4939,"lon":-0.1437,"city":"London","country":"United Kingdom","aliases":["DoubleTree Victoria"]},{"name":"The Resident Victoria","type":"hotel","lat":51.4995,"lon":-0.1435,"city":"London","country":"United Kingdom","aliases":["Resident Victoria"]},{"name":"The Rubens at the Palace","type":"hotel","lat":51.4983,"lon":-0.1436,"city":"London","country":"United Kingdom","aliases":["Rubens Hotel"]},{"name":"The Savoy","type":"hotel","lat":51.5104,"lon":-0.1204,"city":"London","country":"United Kingdom","aliases":["Savoy London"]},{"name":"The Ritz London","type":"hotel","lat":51.507,"lon":-0.1416,"city":"London","country":"United Kingdom","aliases":["Ritz London"]},{"name":"citizenM Tower of London","type":"hotel","lat":51.5104,"lon":-0.0775,"city":"London","country":"United Kingdom","aliases":["citizenM Tower"]},{"name":"Shangri-La The Shard","type":"hotel","lat":51.5045,"lon":-0.0865,"city":"London","country":"United Kingdom","aliases":["Shangri La London"]}];

function placeIcon(props={}){
  const k=String(props.osm_key||'').toLowerCase();
  const v=String(props.osm_value||'').toLowerCase();
  if(k==='tourism'&&v.includes('hotel'))return'🏨'; if(props.vyva_type==='airport')return'✈️'; if(props.vyva_type==='tube')return'🚇'; if(props.vyva_type==='station')return'🚉'; if(props.vyva_type==='market')return'🛍️'; if(props.vyva_type==='park')return'🌳';
  if(k==='tourism')return'📸';
  if(k==='railway'||v.includes('station'))return'🚉';
  if(k==='public_transport')return'🚇';
  if(k==='amenity'&&/(restaurant|cafe|bar)/.test(v))return'🍽️';
  if(k==='shop')return'🛍️';
  if(k==='historic'||k==='leisure')return'📍';
  if(k==='highway')return'📌';
  return'📍';
}
function photonLabel(feature){
  const p=feature.properties||{};
  const title=p.name||p.address_line1||p.street||p.city||p.locality||p.formatted||'Luogo';
  const details=[];
  if(p.address_line2)details.push(p.address_line2);
  const street=[p.housenumber,p.street].filter(Boolean).join(' ');
  if(street && street!==title)details.push(street);
  if(p.district && p.district!==title)details.push(p.district);
  if(p.city && p.city!==title)details.push(p.city);
  if(p.postcode)details.push(p.postcode);
  if(p.country)details.push(p.country);
  return {title,subtitle:[...new Set(details.filter(Boolean))].join(' · ')};
}
function clearPlaceSuggestions(which){
  const box=$(which==='from'?'moveFromSuggestions':'moveToSuggestions');
  if(box){box.innerHTML='';box.classList.add('hide')}
}

function vyvaNormalizeText(s){
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
function localPlaceFeature(p){
  const osmKey = p.type==='hotel'?'tourism':
                 p.type==='museum'?'tourism':
                 p.type==='station'?'railway':
                 p.type==='tube'?'public_transport':
                 p.type==='airport'?'aeroway':
                 p.type==='shop'?'shop':
                 p.type==='park'?'leisure':
                 p.type==='market'?'amenity':
                 p.type==='landmark'?'historic':'place';
  const osmValue = p.type==='hotel'?'hotel':
                   p.type==='museum'?'museum':
                   p.type==='station'?'station':
                   p.type==='tube'?'station':
                   p.type==='airport'?'aerodrome':
                   p.type;
  return {
    type:'Feature',
    geometry:{type:'Point',coordinates:[p.lon,p.lat]},
    properties:{
      name:p.name,city:p.city,country:p.country,
      osm_key:osmKey,osm_value:osmValue,
      vyva_type:p.type,vyva_source:'local'
    }
  };
}
function scoreLocalPlace(p,q){
  const query=vyvaNormalizeText(q);
  if(!query)return 0;
  const name=vyvaNormalizeText(p.name);
  const aliases=(p.aliases||[]).map(vyvaNormalizeText);
  let score=0;
  if(name===query)score=1000;
  else if(name.startsWith(query))score=800;
  else if(name.split(' ').some(w=>w.startsWith(query)))score=650;
  else if(name.includes(query))score=500;
  for(const a of aliases){
    if(a===query)score=Math.max(score,950);
    else if(a.startsWith(query))score=Math.max(score,760);
    else if(a.split(' ').some(w=>w.startsWith(query)))score=Math.max(score,620);
    else if(a.includes(query))score=Math.max(score,470);
  }
  const important={station:30,tube:25,hotel:20,museum:18,attraction:18,landmark:18,airport:16,area:10};
  return score+(important[p.type]||0);
}
function localMovePlaceResults(value,t){
  const city=vyvaNormalizeText(t?.destination||t?.to?.city||'');
  if(!(city.includes('londra')||city.includes('london')))return [];
  return VYVA_LONDON_PLACES
    .map(p=>({p,score:scoreLocalPlace(p,value)}))
    .filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,8)
    .map(x=>localPlaceFeature(x.p));
}


function tripSearchCenter(t){
  if(!t)return null;
  const coords=tripCoords(t);
  const names=[
    t.destination,
    t.to?.city,
    t.destinationData?.name,
    t.destinationData?.city
  ].filter(Boolean).map(v=>vyvaNormalizeText(v)).filter(Boolean);
  const unique=[...new Set(names)];
  if(!coords && !unique.length)return null;
  return {
    lat:coords?Number(coords.lat):null,
    lon:coords?Number(coords.lon):null,
    cityNames:unique,
    tripId:String(t.id||'')
  };
}
function featureCityText(feature){
  const p=feature?.properties||{};
  return vyvaNormalizeText([
    p.city,p.locality,p.district,p.suburb,p.county,p.state,p.country,
    p.address_line1,p.address_line2,p.formatted
  ].filter(Boolean).join(' '));
}
function destinationPriorityScore(feature,t){
  const center=tripSearchCenter(t);
  if(!center)return 0;
  const cityText=featureCityText(feature);
  let bonus=0;

  if(center.cityNames.some(n=>n && cityText.includes(n))) bonus+=1500;

  const c=feature?.geometry?.coordinates||[];
  const lon=Number(c[0]),lat=Number(c[1]);
  if(Number.isFinite(lat)&&Number.isFinite(lon)&&Number.isFinite(center.lat)&&Number.isFinite(center.lon)){
    const km=haversineKm({lat,lon},{lat:center.lat,lon:center.lon});
    if(Number.isFinite(km)){
      if(km<=3) bonus+=1250;
      else if(km<=8) bonus+=1000;
      else if(km<=18) bonus+=700;
      else if(km<=35) bonus+=350;
      else if(km>80) bonus-=500;
    }
  }
  return bonus;
}

function featureMoveSearchScore(feature,value){
  const q=vyvaNormalizeText(value);
  if(!q)return 0;
  const p=feature?.properties||{};
  const title=vyvaNormalizeText(p.name||p.address_line1||p.street||p.formatted||'');
  const address=vyvaNormalizeText([
    p.address_line1,p.address_line2,p.formatted,p.street,p.housenumber,
    p.district,p.suburb,p.city,p.locality,p.postcode,p.country
  ].filter(Boolean).join(' '));

  let score=0;
  if(title===q)score=3000;
  else if(title.startsWith(q))score=2700;
  else if(title.split(' ').some(w=>w.startsWith(q)))score=2450;
  else if(title.includes(q))score=2200;
  else if(address.startsWith(q))score=1700;
  else if(address.split(' ').some(w=>w.startsWith(q)))score=1500;
  else if(address.includes(q))score=1200;

  // Small category tie-breakers only AFTER the text has matched.
  if(score>0){
    const type=String(p.vyva_type||p.result_type||p.category||p.osm_value||'').toLowerCase();
    if(/hotel|accommodation/.test(type))score+=18;
    else if(/restaurant|cafe|bar/.test(type))score+=14;
    else if(/station|public_transport|railway/.test(type))score+=12;
    else if(/museum|tourism|attraction/.test(type))score+=10;
  }
  return score;
}
function rankMovePlaceFeatures(features,value,t=currentTrip()){
  const seen=new Set(), ranked=[];
  for(const f of (features||[])){
    const textScore=featureMoveSearchScore(f,value);
    if(textScore<=0)continue;

    const p=f.properties||{},c=f.geometry?.coordinates||[];
    const key=vyvaNormalizeText(p.name||p.address_line1||p.street||'')+'|'+
      (Number(c[0])||0).toFixed(4)+'|'+(Number(c[1])||0).toFixed(4);
    if(seen.has(key))continue;
    seen.add(key);

    const destinationScore=destinationPriorityScore(f,t);
    ranked.push({f,score:textScore+destinationScore});
  }
  return ranked.sort((a,b)=>b.score-a.score).slice(0,10).map(x=>x.f);
}

function mergePlaceFeatures(local,remote){
  const all=[...(local||[]),...(remote||[])],seen=new Set(),out=[];
  for(const f of all){
    const p=f.properties||{}, c=f.geometry?.coordinates||[];
    const key=vyvaNormalizeText(p.name||p.street||'')+'|'+(Number(c[0])||0).toFixed(3)+'|'+(Number(c[1])||0).toFixed(3);
    if(!key||seen.has(key))continue;
    seen.add(key);out.push(f);
    if(out.length>=9)break;
  }
  return out;
}
function renderMovePlaceResults(which,features,city,offline=false){
  const box=$(which==='from'?'moveFromSuggestions':'moveToSuggestions');
  if(!box)return;
  window[`_vyvaPlaceResults_${which}`]=features||[];
  if(features?.length){
    box.classList.remove('hide');
    box.innerHTML=features.map((f,i)=>{
      const l=photonLabel(f),p=f.properties||{};
      return `<button class="placeSuggestion" onclick="chooseMovePlace('${which}',${i})">
        <span class="psi">${placeIcon(p)}</span>
        <span><b>${escapeHtml(l.title)}</b><small>${escapeHtml(l.subtitle||city)}${p.vyva_source==='local'?' · VYVA map':''}</small></span>
      </button>`
    }).join('')+(offline?'<div class="placeSearching">Risultati locali VYVA · la ricerca online è temporaneamente non disponibile</div>':'');
    return;
  }
  box.classList.remove('hide');
  box.innerHTML=`<div class="placeEmpty">Non trovo ancora una corrispondenza con queste lettere. Continua a scrivere il nome del luogo o l’indirizzo.</div>
    <button class="placeSuggestion" onclick="useTypedMovePlace('${which}')"><span class="psi">📌</span><span><b>Usa “${escapeHtml(placeQueryValue(which))}”</b><small>Continua con il testo inserito</small></span></button>`;
}
function useTypedMovePlace(which){
  const value=placeQueryValue(which);
  if(!value)return;
  moveSelectedPlaces[which]=null;
  clearPlaceSuggestions(which);
  renderProviders();updateRouteChoices();
}

function onMovePlaceInput(which){
  moveSelectedPlaces[which]=null;
  renderProviders();updateRouteChoices();

  const value=placeQueryValue(which);
  clearTimeout(moveSearchTimers[which]);

  // IMPORTANT: invalidate any result belonging to the previous letters immediately.
  const seq=++moveSearchSeq[which];

  if(value.length<2){
    clearPlaceSuggestions(which);
    return;
  }

  const box=$(which==='from'?'moveFromSuggestions':'moveToSuggestions');
  if(box){
    box.classList.remove('hide');
    box.innerHTML='<div class="placeSearching">Cerco “'+escapeHtml(value)+'”…</div>';
  }

  // Fast autocomplete while typing.
  moveSearchTimers[which]=setTimeout(()=>searchMovePlaces(which,value,seq),230);
}
async function searchMovePlaces(which,value,seq){
  if(seq!==moveSearchSeq[which])return;

  const t=currentTrip(),coords=tripCoords(t),city=t?.destination||t?.to?.city||'';
  const local=localMovePlaceResults(value,t);
  const cached=cachedMovePlaceResults(value,t);
  const immediate=rankMovePlaceFeatures([...(local||[]),...(cached||[])],value,t);

  if(immediate.length && seq===moveSearchSeq[which]){
    renderMovePlaceResults(which,immediate,city,false);
  }

  let global=[];
  try{
    global=await searchSecureWorldPlaces(value,t);
  }catch(e){ global=[]; }

  if(seq!==moveSearchSeq[which])return;

  // OpenStreetMap fallback: search EXACTLY what was typed.
  // Coordinates only bias nearby results; they do not restrict the search to the trip city.
  let photon=[];
  try{
    let url=`https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=10&lang=it`;
    if(coords)url+=`&lat=${encodeURIComponent(coords.lat)}&lon=${encodeURIComponent(coords.lon)}&zoom=12&location_bias_scale=0.15`;
    const r=await fetch(url,{headers:{'Accept':'application/json'}});
    if(r.ok){
      const data=await r.json();
      photon=Array.isArray(data.features)?data.features:[];
      saveGlobalPlaceCache(photon);
    }
  }catch(e){ photon=[]; }

  if(seq!==moveSearchSeq[which])return;

  const ranked=rankMovePlaceFeatures([
    ...(global||[]),
    ...(immediate||[]),
    ...(photon||[])
  ],value,t);

  renderMovePlaceResults(which,ranked,city,!global.length&&!photon.length);
}
function chooseMovePlace(which,index){
  const arr=window[`_vyvaPlaceResults_${which}`]||[],f=arr[index];
  if(!f)return;
  const l=photonLabel(f),coords=f.geometry?.coordinates||[];
  const p=f.properties||{};
  const full=[l.title,p.street&&p.street!==l.title?p.street:'',p.city&&p.city!==l.title?p.city:'',p.country].filter(Boolean).join(', ');
  moveSelectedPlaces[which]={label:full||l.title,lon:Number(coords[0]),lat:Number(coords[1]),properties:p};
  const input=$(which==='from'?'moveFrom':'moveTo');
  if(input)input.value=full||l.title;
  clearPlaceSuggestions(which);
  renderProviders();updateRouteChoices();
}
function useCurrentLocation(){
  if(!navigator.geolocation){alert('La posizione non è disponibile su questo dispositivo.');return}
  const btn=$('useLocationBtn');if(btn)btn.textContent='…';
  navigator.geolocation.getCurrentPosition(pos=>{
    moveSelectedPlaces.from={label:'Posizione attuale',lat:pos.coords.latitude,lon:pos.coords.longitude};
    if($('moveFrom'))$('moveFrom').value='Posizione attuale';
    if(btn)btn.textContent='📍';
    clearPlaceSuggestions('from');
    renderProviders();updateRouteChoices();
  },()=>{
    if(btn)btn.textContent='📍';
    alert('Non riesco ad accedere alla posizione. Puoi cercare il luogo scrivendolo nella casella.');
  },{enableHighAccuracy:true,timeout:8000,maximumAge:60000});
}


let mobilityPreference='all';

function tripDayCount(t){
  if(!t?.start||!t?.end)return 1;
  const a=parseISO(t.start),b=parseISO(t.end);
  return Math.max(1,Math.round((b-a)/86400000)+1);
}
function londonTrip(t){
  const city=norm(t?.destination||t?.to?.city||'');
  return city.includes('londra')||city.includes('london');
}
function saveMobilityPreference(label){
  const t=currentTrip();if(!t)return;
  const key='vyvaMobilityPrefsV1';
  let all={};try{all=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}
  all[t.id]={label,saved:new Date().toISOString()};
  localStorage.setItem(key,JSON.stringify(all));
  alert('Preferenza di mobilità salvata per questo viaggio.');
}

function toggleMobilityAccordion(){
  const box=$('mobilityAccordion');
  if(!box)return;
  box.classList.toggle('open');
  const open=box.classList.contains('open');
  const btn=$('mobilityAccordionButton');
  if(btn)btn.setAttribute('aria-expanded',open?'true':'false');
}


function londonFamilyMoveSummary(t){
  const adults=Number(t?.adults||0);
  const children=Number(t?.children||0);
  const infants=Number(t?.infants||0);
  const days=tripDayCount(t);

  const familyBits=[];
  if(adults)familyBits.push(`${adults} adult${adults===1?'o':'i'}`);
  if(children)familyBits.push(`${children} bambin${children===1?'a':'i'}`);
  if(infants)familyBits.push(`${infants} neonat${infants===1?'o':'i'}`);

  let childNote='';
  if(children||infants){
    childNote=' I minori sotto gli 11 anni viaggiano gratis su bus, tram, Tube, DLR, Overground ed Elizabeth line se accompagnati da un adulto pagante.';
  }

  let adultNote='';
  if(adults>=2){
    adultNote=' Per gli adulti serve un metodo di pagamento distinto per ciascuno: se avete una sola carta contactless, un adulto può usarla e l’altro può usare una Oyster.';
  }else if(adults===1){
    adultNote=' Per l’adulto basta contactless oppure Oyster.';
  }

  let durationNote='';
  if(days<=5){
    durationNote=` Per ${days} ${days===1?'giorno':'giorni'}, VYVA suggerisce di partire dal pay as you go con contactless/Oyster: applica automaticamente il daily cap e poi puoi confrontarlo con eventuali pass.`;
  }else{
    durationNote=` Per ${days} giorni, conviene confrontare pay as you go con le opzioni settimanali in base alle zone e ai giorni effettivi di utilizzo.`;
  }

  return `<div class="personalMoveSummary"><b>Per voi: ${escapeHtml(familyBits.join(' · ')||'viaggiatori VYVA')}.</b>${childNote}${adultNote}${durationNote}</div>`;
}


function toggleArrivalAccordion(){
  const box=$('arrivalAccordion');
  if(!box)return;
  box.classList.toggle('open');
  const open=box.classList.contains('open');
  const btn=$('arrivalAccordionButton');
  if(btn)btn.setAttribute('aria-expanded',open?'true':'false');
}
function airportArrivalGuideHtml(t){
  const iata=(t?.to?.iata||'').toUpperCase();
  const airportName=t?.to?.name||t?.to?.city||'aeroporto';
  const time=t?.arrivalTime?` · arrivo previsto ${escapeHtml(t.arrivalTime)}`:'';

  if(iata==='LGW'){
    return `<div id="arrivalAccordion" class="arrivalAccordion">
      <button id="arrivalAccordionButton" class="arrivalAccordionHead" type="button" aria-expanded="false" onclick="toggleArrivalAccordion()">
        <span>
          <strong>🛬 Appena atterri a Gatwick${time}</strong>
          <small>Tocca: VYVA ti guida dall’aeroporto fino a Londra, passo passo</small>
        </span>
        <span class="arrivalAccordionChevron">⌄</span>
      </button>
      <div class="arrivalAccordionBody">
        <div class="arrivalStep">
          <span class="arrivalNum">1</span>
          <span><b>Ritira bagagli e segui “Train Station”</b><small>La stazione ferroviaria di Gatwick è al South Terminal. Se atterri al North Terminal, usa la navetta gratuita tra i terminal.</small></span>
        </div>
        <div class="arrivalStep">
          <span class="arrivalNum">2</span>
          <span><b>Per voi: 2 adulti, una bambina e un neonato</b><small>Un adulto può usare la vostra carta/contactless. Per il secondo adulto potete acquistare una Oyster standard al Your Service Centre nel South Terminal oppure comprare un biglietto ferroviario alla stazione.</small></span>
        </div>
        <div class="arrivalStep">
          <span class="arrivalNum">3</span>
          <span><b>Scegli il treno per Londra</b><small>Puoi confrontare Gatwick Express e i normali servizi Southern/Thameslink in base alla zona dell’hotel. Non serve per forza acquistare prima: dove PAYG è valido puoi usare contactless/Oyster; in alternativa ci sono le macchinette in stazione.</small></span>
        </div>
        <div class="arrivalStep">
          <span class="arrivalNum">4</span>
          <span><b>Biglietti bambini: controlla il treno scelto</b><small>Le regole del trasferimento aeroportuale non sono identiche a quelle della Tube. Il neonato è generalmente gratuito; per la bambina VYVA deve verificare la tariffa bambino del servizio ferroviario scelto prima di confermare.</small></span>
        </div>
        <div class="arrivalStep">
          <span class="arrivalNum">5</span>
          <span><b>Quando arrivi in città</b><small>Da quel momento puoi usare VYVA Move per hotel → attrazioni, con Tube, bus, tram, treni, taxi o percorso a piedi.</small></span>
        </div>
        <div class="arrivalButtons">
          <a target="_blank" rel="noopener" href="https://www.gatwickairport.com/transport-options/train.html">Treni da Gatwick</a>
          <a class="secondary" target="_blank" rel="noopener" href="https://www.gatwickexpress.com/tickets/pay-as-you-go/oyster">Oyster da Gatwick</a>
          <a target="_blank" rel="noopener" href="https://www.gatwickexpress.com/tickets/">Compra treno</a>
          <a class="secondary" target="_blank" rel="noopener" href="https://tfl.gov.uk/fares/ways-to-pay/pay-as-you-go">Come pagare a Londra</a>
        </div>
        <div class="arrivalCaution"><b>VYVA controlla prima di consigliarti l’acquisto.</b> Per aeroporto, treno e bambini possono esserci regole diverse dalla rete urbana di Londra.</div>
      </div>
    </div>`;
  }

  if(iata){
    return `<div id="arrivalAccordion" class="arrivalAccordion">
      <button id="arrivalAccordionButton" class="arrivalAccordionHead" type="button" aria-expanded="false" onclick="toggleArrivalAccordion()">
        <span><strong>🛬 Appena atterri a ${escapeHtml(iata)}${time}</strong><small>Tocca per vedere il percorso dall’aeroporto alla città</small></span>
        <span class="arrivalAccordionChevron">⌄</span>
      </button>
      <div class="arrivalAccordionBody">
        <div class="arrivalStep"><span class="arrivalNum">1</span><span><b>Arrivo in aeroporto</b><small>VYVA userà aeroporto, orario e destinazione per proporti treno, bus, transfer e taxi.</small></span></div>
        <div class="arrivalStep"><span class="arrivalNum">2</span><span><b>Confronto dei mezzi</b><small>Mostreremo dove si acquistano i biglietti e quale opzione è più semplice per il tuo gruppo.</small></span></div>
        <div class="arrivalCaution">Per ora abbiamo completato il flusso dettagliato di Gatwick come primo modello; gli altri aeroporti verranno aggiunti con fonti ufficiali.</div>
      </div>
    </div>`;
  }
  return '';
}


function londonTubeMapHtml(t){
  if(!londonTrip(t))return '';
  return `<div class="londonTubeMapCard">
    <div class="londonTubeMapTop">
      <span class="londonTubeMapIcon">🗺️</span>
      <span>
        <b>Mappa Tube di Londra</b>
        <small>Apri la cartina ufficiale aggiornata di Transport for London. Quando calcoli un percorso, VYVA mostra anche sotto la mappa reale del tragitto con linee, cambi e tratti a piedi.</small>
      </span>
    </div>
    <div class="londonTubeMapActions">
      <a target="_blank" rel="noopener" href="https://tfl.gov.uk/maps/track/tube">Mappa Tube ufficiale</a>
      <a target="_blank" rel="noopener" href="https://content.tfl.gov.uk/standard-tube-map.pdf">PDF zoomabile</a>
    </div>
  </div>`;
}

function mobilityAdvisorHtml(t){
  const days=tripDayCount(t);
  if(londonTrip(t)){
    const lengthTip=days<=3
      ? `Per ${days} ${days===1?'giorno':'giorni'}, VYVA ti suggerisce di confrontare pay as you go con una Day Travelcard in base alle zone che userai.`
      : `Per ${days} giorni, VYVA ti suggerisce di confrontare contactless/Oyster pay as you go con Travelcard e relativi cap, in base ai giorni della settimana e alle zone.`;
    return `<div id="mobilityAccordion" class="mobilityAccordion">
      <button id="mobilityAccordionButton" class="mobilityAccordionHead" type="button" aria-expanded="false" onclick="toggleMobilityAccordion()">
        <span>
          <strong>🎫 Come conviene muoversi a Londra</strong>
          <small>Tocca per vedere pass, Oyster, contactless e opzioni disponibili</small>
        </span>
        <span class="mobilityAccordionChevron">⌄</span>
      </button>
      <div class="mobilityAccordionBody">
        <div class="mobilityAdvisor">
          ${londonFamilyMoveSummary(t)}
          <p>${lengthTip}</p>
          <div class="mobilityTip"><b>Da sapere:</b> con contactless o Oyster normalmente non devi comprare ogni singolo biglietto prima di salire. Il sistema applica il pay as you go e i cap previsti.</div>
          <div class="mobilityTagRow">
            <span class="mobilityTag on">Tutti i mezzi</span>
            <span class="mobilityTag">Bus + Tram</span>
            <span class="mobilityTag">Tube + Rail</span>
            <span class="mobilityTag">Solo treni</span>
          </div>
          <div class="ticketPick">
            <span class="ticketPickIcon">💳</span>
            <span><b>Contactless / Oyster pay as you go</b><small>Tube, bus, tram, DLR, Overground, Elizabeth line e gran parte dei treni urbani. Utile se vuoi pagare solo ciò che usi.</small>
              <span class="ticketActions"><a target="_blank" rel="noopener" href="https://tfl.gov.uk/travel-information/visiting-london/getting-around-london/best-ways-for-visitors-to-pay">Info ufficiali</a><button onclick="saveMobilityPreference('Contactless / Oyster')">Salva scelta</button></span>
            </span>
          </div>
          <div class="ticketPick">
            <span class="ticketPickIcon">🎟️</span>
            <span><b>Travelcard / pass</b><small>Per viaggi illimitati nelle zone coperte. VYVA ti ricorda di confrontarla con i cap pay as you go prima dell’acquisto.</small>
              <span class="ticketActions"><a target="_blank" rel="noopener" href="https://tfl.gov.uk/fares/">Tariffe ufficiali</a><button onclick="saveMobilityPreference('Travelcard / pass')">Salva scelta</button></span>
            </span>
          </div>
          <div class="mobilityLinks">
            <a target="_blank" rel="noopener" href="https://tfl.gov.uk/fares/ways-to-pay/pay-as-you-go">Pay as you go</a>
            <a target="_blank" rel="noopener" href="https://tfl.gov.uk/plan-a-journey/">Journey Planner TfL</a>
          </div>
        </div>
      </div>
    </div>`;
  }
  return `<div id="mobilityAccordion" class="mobilityAccordion">
    <button id="mobilityAccordionButton" class="mobilityAccordionHead" type="button" aria-expanded="false" onclick="toggleMobilityAccordion()">
      <span>
        <strong>🎫 Come conviene muoversi a ${escapeHtml(t?.destination||'destinazione')}</strong>
        <small>Tocca per vedere pass, abbonamenti e opzioni disponibili</small>
      </span>
      <span class="mobilityAccordionChevron">⌄</span>
    </button>
    <div class="mobilityAccordionBody">
      <div class="mobilityAdvisor">
        <p>VYVA ti mostrerà qui le formule disponibili nella città: giornalieri, più giorni, trasporto pubblico completo o singole categorie quando esistono.</p>
        <div class="mobilityTagRow"><span class="mobilityTag on">Tutti i mezzi</span><span class="mobilityTag">Bus</span><span class="mobilityTag">Metro</span><span class="mobilityTag">Treni</span></div>
        <div class="mobilityTip">Per questa città stiamo usando i collegamenti ufficiali già presenti in VYVA Move. Aggiungeremo progressivamente i pass specifici città per città.</div>
      </div>
    </div>
  </div>`;
}

function haversineKm(a,b){
  if(!a||!b||!Number.isFinite(a.lat)||!Number.isFinite(b.lat))return null;
  const R=6371,toRad=x=>x*Math.PI/180;
  const dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon);
  const s=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
function approxMinutes(km,mode){
  if(!Number.isFinite(km))return null;
  const roadKm=km*1.22;
  if(mode==='walk')return Math.max(3,Math.round(roadKm/4.7*60));
  if(mode==='drive')return Math.max(6,Math.round(roadKm/18*60+5));
  return Math.max(8,Math.round(roadKm/15*60+7));
}
function moveDistanceSummary(){
  const a=moveSelectedPlaces.from,b=moveSelectedPlaces.to;
  const km=haversineKm(a,b);
  if(km==null)return null;
  return {
    km,
    walk:approxMinutes(km,'walk'),
    drive:approxMinutes(km,'drive'),
    transit:approxMinutes(km,'transit')
  };
}


let moveJourneySeq=0;

function moveModeLabel(mode){
  return {
    metro:'Metro',
    bustram:'Bus · Tram',
    train:'Treno',
    ride:'Taxi · Grab · Uber',
    walk:'A piedi'
  }[mode]||'Spostamento';
}
function tflModesForMove(mode){
  if(mode==='metro')return'tube';
  if(mode==='bustram')return'bus,tram';
  if(mode==='train')return'national-rail,overground,elizabeth-line,dlr';
  return '';
}
function journeyLegIcon(mode){
  const m=String(mode||'').toLowerCase();
  if(m==='walking'||m==='walk')return'🚶';
  if(m==='tube')return'🚇';
  if(m==='bus')return'🚌';
  if(m==='tram')return'🚊';
  if(m==='national-rail'||m==='overground'||m==='elizabeth-line'||m==='dlr')return'🚆';
  return'➡️';
}
function tflLineStyle(name){
  const n=String(name||'').toLowerCase();
  const map=[
    ['bakerloo','#894e24'],['central','#dc241f'],['circle','#ffcd00'],
    ['district','#007229'],['hammersmith','#d799af'],['jubilee','#6a7278'],
    ['metropolitan','#751056'],['northern','#000000'],['piccadilly','#0019a8'],
    ['victoria','#00a0e2'],['waterloo','#76d0bd'],['elizabeth','#6950a1'],
    ['overground','#ef7b10'],['dlr','#00afad']
  ];
  for(const [k,c] of map)if(n.includes(k))return c;
  return'#35425f';
}
function tflPointName(p){
  return p?.commonName||p?.name||'';
}
function routeLineName(leg){
  const r=leg?.routeOptions?.[0];
  return r?.lineIdentifier?.name||r?.lineIdentifier?.fullName||r?.name||'';
}
function cleanInstruction(s){
  return String(s||'').replace(/\s+/g,' ').trim();
}

let lastTfLJourneyForMap=null;
let vyvaJourneyLeafletMap=null;

function journeyWalkingMinutes(journey){
  return (journey?.legs||[]).reduce((sum,leg)=>{
    const mode=String(leg?.mode?.id||leg?.mode?.name||'').toLowerCase();
    return sum+(mode==='walking'||mode==='walk'?(Number(leg?.duration)||0):0);
  },0);
}
function journeyTransitChanges(journey){
  const transit=(journey?.legs||[]).filter(leg=>{
    const mode=String(leg?.mode?.id||leg?.mode?.name||'').toLowerCase();
    return mode!=='walking'&&mode!=='walk';
  }).length;
  return Math.max(0,transit-1);
}
function selectSmartTfLJourney(journeys){
  if(!Array.isArray(journeys)||!journeys.length)return null;
  if(moveMode!=='metro'&&moveMode!=='bustram')return journeys[0];

  const fastest=Math.min(...journeys.map(j=>Number(j?.duration)||9999));
  const reasonable=journeys.filter(j=>(Number(j?.duration)||9999)<=fastest+15);
  const pool=reasonable.length?reasonable:journeys;

  return [...pool].sort((a,b)=>{
    const walkDiff=journeyWalkingMinutes(a)-journeyWalkingMinutes(b);
    if(walkDiff!==0)return walkDiff;
    const changeDiff=journeyTransitChanges(a)-journeyTransitChanges(b);
    if(changeDiff!==0)return changeDiff;
    return (Number(a?.duration)||9999)-(Number(b?.duration)||9999);
  })[0];
}
function tflLegMapColor(leg){
  const mode=String(leg?.mode?.id||leg?.mode?.name||'').toLowerCase();
  if(mode==='walking'||mode==='walk')return '#6f7888';
  if(mode==='bus')return '#d71920';
  if(mode==='tram')return '#68a629';
  const line=routeLineName(leg);
  return tflLineStyle(line);
}
function legMapPoints(leg){
  const out=[];
  const add=p=>{
    const lat=Number(p?.lat),lon=Number(p?.lon);
    if(Number.isFinite(lat)&&Number.isFinite(lon)){
      const prev=out[out.length-1];
      if(!prev||Math.abs(prev[0]-lat)>0.000001||Math.abs(prev[1]-lon)>0.000001)out.push([lat,lon]);
    }
  };
  add(leg?.departurePoint);
  const stops=Array.isArray(leg?.path?.stopPoints)?leg.path.stopPoints:[];
  stops.forEach(add);
  add(leg?.arrivalPoint);
  return out;
}
function renderVyvaJourneyMap(){
  const el=$('vyvaJourneyMap');
  const journey=lastTfLJourneyForMap;
  if(!el||!journey)return;

  if(typeof L==='undefined'){
    el.innerHTML='<div class="journeyMapFallback">La mappa non è riuscita a caricarsi. Il percorso dettagliato rimane comunque disponibile qui sopra.</div>';
    return;
  }

  try{
    if(vyvaJourneyLeafletMap){
      vyvaJourneyLeafletMap.remove();
      vyvaJourneyLeafletMap=null;
    }

    const map=L.map(el,{zoomControl:true,attributionControl:true});
    vyvaJourneyLeafletMap=map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,
      attribution:'&copy; OpenStreetMap contributors'
    }).addTo(map);

    const all=[];
    (journey.legs||[]).forEach((leg,idx)=>{
      const pts=legMapPoints(leg);
      if(!pts.length)return;
      pts.forEach(p=>all.push(p));

      const mode=String(leg?.mode?.id||leg?.mode?.name||'').toLowerCase();
      const walking=mode==='walking'||mode==='walk';
      L.polyline(pts,{
        color:tflLegMapColor(leg),
        weight:walking?4:7,
        opacity:.9,
        dashArray:walking?'7,7':null
      }).addTo(map);

      const fromName=tflPointName(leg?.departurePoint);
      const toName=tflPointName(leg?.arrivalPoint);
      if(idx===0&&pts[0]){
        L.circleMarker(pts[0],{radius:7,weight:3,fillOpacity:1})
          .addTo(map).bindPopup(fromName||'Partenza');
      }
      if(pts[pts.length-1]){
        L.circleMarker(pts[pts.length-1],{radius:6,weight:2,fillOpacity:1})
          .addTo(map).bindPopup(toName||'Cambio / arrivo');
      }
    });

    if(all.length){
      map.fitBounds(L.latLngBounds(all),{padding:[28,28]});
      setTimeout(()=>map.invalidateSize(),120);
    }else{
      el.innerHTML='<div class="journeyMapFallback">TfL non ha restituito coordinate sufficienti per disegnare questo percorso.</div>';
    }
  }catch(e){
    el.innerHTML='<div class="journeyMapFallback">Mappa momentaneamente non disponibile. Usa la timeline del percorso o “Apri sulla mappa”.</div>';
  }
}

function renderTfLJourney(data){
  const journeys=Array.isArray(data?.journeys)?data.journeys:[];
  if(!journeys.length)return '';

  const j=selectSmartTfLJourney(journeys);
  if(!j)return '';
  lastTfLJourneyForMap=j;

  const legs=Array.isArray(j.legs)?j.legs:[];
  const rows=legs.map(leg=>{
    const mode=String(leg?.mode?.id||leg?.mode?.name||'').toLowerCase();
    const line=routeLineName(leg);
    const from=tflPointName(leg.departurePoint);
    const to=tflPointName(leg.arrivalPoint);
    const mins=Number(leg.duration)||0;
    const stops=Array.isArray(leg?.path?.stopPoints)?leg.path.stopPoints.length:0;
    const summary=cleanInstruction(leg?.instruction?.summary);
    const detailed=cleanInstruction(leg?.instruction?.detailed);
    const instruction=summary||detailed;
    const disruption=leg?.isDisrupted||((leg?.disruptions||[]).length>0);
    const badge=line?`<span class="journeyLineBadge" style="background:${tflLineStyle(line)}">${escapeHtml(line)}</span>`:'';
    return `<div class="journeyLeg">
      <div class="journeyLegIcon">${journeyLegIcon(mode)}</div>
      <div class="journeyLegBody">
        <div class="journeyLegTitle"><b>${escapeHtml(mode==='walking'?'A piedi':(line||leg?.mode?.name||'Spostamento'))}</b>${badge}</div>
        <div class="journeyLegMeta">${escapeHtml([from&&`Da ${from}`,to&&`a ${to}`,mins&&`${mins} min`,stops>1&&`${stops} fermate`].filter(Boolean).join(' · '))}</div>
        ${instruction?`<div class="journeyLegInstruction">${escapeHtml(instruction)}</div>`:''}
        ${disruption?'<div class="journeyWarning">⚠️ Possibile disservizio sul tratto: controlla l’aggiornamento live prima di partire.</div>':''}
      </div>
    </div>`;
  }).join('');

  const walkMin=journeyWalkingMinutes(j);
  const changes=journeyTransitChanges(j);
  const preferenceText=
    moveMode==='metro'
      ?'Metro ottimizzata per camminare meno: VYVA considera i cambi tra linee quando sono una scelta sensata.'
      :moveMode==='bustram'
        ?'Bus · Tram ottimizzato per camminare meno: VYVA considera anche coincidenze tra bus e tram quando convengono.'
        :'Tratti reali calcolati da Transport for London, compresi i collegamenti a piedi.';

  return `<div class="liveJourneyCard">
    <div class="liveJourneyHead">
      <span><b>Percorso completo</b><small>${preferenceText}</small></span>
      <span class="liveJourneyDuration">${Number(j.duration)||'—'} min</span>
    </div>
    <div class="journeyWalkSummary">🚶 ${walkMin} min a piedi${changes?` · ${changes} ${changes===1?'cambio':'cambi'}`:''}</div>
    <div class="journeyTimeline">${rows}</div>

    <div class="journeyMapWrap">
      <div class="journeyMapHead">
        <b>🗺️ Mappa del percorso</b>
        <small>Linea per linea, con cambi e tratti a piedi sulla mappa reale di Londra.</small>
      </div>
      <div id="vyvaJourneyMap"></div>
    </div>

    <div class="journeyActions">
      <a target="_blank" rel="noopener" href="${googleDirectionsUrl('transit')}">Apri sulla mappa</a>
      <button onclick="saveMoveItem('${moveMode}','${escapeHtml(moveModeLabel(moveMode)).replace(/'/g,"&#39;")} · percorso live','')">Salva nel Wallet</button>
    </div>
  </div>`;
}
async function loadMoveJourney(){
  const box=$('routeChoiceBox');
  if(!box)return;

  const t=currentTrip();
  const from=moveSelectedPlaces.from,to=moveSelectedPlaces.to;
  const fromText=placeQueryValue('from'),toText=placeQueryValue('to');

  if(!fromText||!toText){
    box.innerHTML='';
    return;
  }

  // Taxi / walking keep the normal maps route.
  if(moveMode==='ride'||moveMode==='walk'){
    box.innerHTML=routeChoiceHtml();
    return;
  }

  // Outside London, keep global live-map fallback until the city's routing API is connected.
  if(!londonTrip(t)){
    box.innerHTML=routeChoiceHtml();
    return;
  }

  if(!from||!to||!Number.isFinite(from.lat)||!Number.isFinite(to.lat)){
    box.innerHTML=`<div class="routeModeHint">Per mostrare dentro VYVA tutti i tratti del percorso, seleziona sia DA sia A dai suggerimenti: servono le coordinate esatte del luogo.</div>${routeChoiceHtml()}`;
    return;
  }

  const modes=tflModesForMove(moveMode);
  if(!modes){
    box.innerHTML=routeChoiceHtml();
    return;
  }

  const seq=++moveJourneySeq;
  box.innerHTML='<div class="liveJourneyCard"><div class="liveJourneyLoading">Calcolo percorso completo…</div></div>';

  const base=(typeof VYVA_PLACES_PROXY_URL!=='undefined'?VYVA_PLACES_PROXY_URL:'').replace(/\/$/,'');
  if(!base){
    box.innerHTML=routeChoiceHtml();
    return;
  }

  try{
    const params=new URLSearchParams({
      fromLat:String(from.lat),fromLon:String(from.lon),
      toLat:String(to.lat),toLon:String(to.lon),
      mode:modes
    });
    const r=await fetch(`${base}/journey?${params.toString()}`,{headers:{'Accept':'application/json'}});
    if(!r.ok)throw new Error('journey');
    const data=await r.json();
    if(seq!==moveJourneySeq)return;
    const rendered=renderTfLJourney(data);
    box.innerHTML=rendered||`<div class="routeModeHint">Non ho trovato un percorso ${escapeHtml(moveModeLabel(moveMode))} adatto tra questi due punti.</div>${routeChoiceHtml()}`;
    if(rendered)setTimeout(renderVyvaJourneyMap,80);
  }catch(e){
    if(seq!==moveJourneySeq)return;
    box.innerHTML=`<div class="routeModeHint">Il percorso dettagliato VYVA è momentaneamente non disponibile. Puoi comunque aprire il percorso live sulla mappa.</div>${routeChoiceHtml()}`;
  }
}

function routeChoiceHtml(){
  const fromOk=!!placeQueryValue('from'),toOk=!!placeQueryValue('to');
  if(!fromOk||!toOk)return '';

  const t=currentTrip(),est=moveDistanceSummary();
  const dist=est?`${est.km<1?Math.round(est.km*1000)+' m':est.km.toFixed(1)+' km'} circa`:'';

  if(moveMode==='walk'){
    return `<div class="liveJourneyCard">
      <div class="liveJourneyHead">
        <span><b>🚶 Percorso a piedi</b><small>${dist?`Distanza ${dist}. `:''}Apri il percorso pedonale completo.</small></span>
        ${est?`<span class="liveJourneyDuration">~${est.walk} min</span>`:''}
      </div>
      <div class="journeyActions">
        <a target="_blank" rel="noopener" href="${googleDirectionsUrl('walking')}">Apri percorso</a>
        <button onclick="saveMoveItem('walk','Percorso a piedi','')">Salva nel Wallet</button>
      </div>
    </div>`;
  }

  if(moveMode==='ride'){
    return `<div class="liveJourneyCard">
      <div class="liveJourneyHead">
        <span><b>🚕 Taxi · Grab · Uber</b><small>Apri la mappa per verificare percorso e traffico in tempo reale.</small></span>
        ${est?`<span class="liveJourneyDuration">~${est.drive} min</span>`:''}
      </div>
      <div class="journeyActions">
        <a target="_blank" rel="noopener" href="${googleDirectionsUrl('driving')}">Apri percorso</a>
        <button onclick="saveMoveItem('ride','Percorso taxi / ride-hailing','')">Salva nel Wallet</button>
      </div>
    </div>`;
  }

  const label=moveModeLabel(moveMode);
  const secondaryAction=londonTrip(t)
    ? '<a target="_blank" rel="noopener" href="https://tfl.gov.uk/plan-a-journey/">Apri TfL</a>'
    : `<button onclick="saveMoveItem('${moveMode}','${escapeHtml(label)}','')">Salva nel Wallet</button>`;

  return `<div class="liveJourneyCard">
    <div class="liveJourneyHead">
      <span><b>${escapeHtml(label)}</b><small>${londonTrip(t)?'VYVA prova a mostrare il percorso multimodale completo dentro l’app.':'Percorso live disponibile sulla mappa; il routing interno verrà collegato città per città.'}</small></span>
      ${est?`<span class="liveJourneyDuration">~${est.transit} min</span>`:''}
    </div>
    <div class="journeyActions">
      <a target="_blank" rel="noopener" href="${googleDirectionsUrl('transit')}">Apri percorso live</a>
      ${secondaryAction}
    </div>
  </div>`;
}
function updateRouteChoices(){
  const el=$('routeChoiceBox');
  if(!el)return;
  el.innerHTML=routeChoiceHtml();
  if(placeQueryValue('from')&&placeQueryValue('to'))loadMoveJourney();
}

function openMovePanel(){
 const t=currentTrip();setActive('Move');$('ptitle').textContent='Move';$('ptext').textContent=t?`Come muoverti a ${t.destination}, quale mezzo scegliere e come pagarlo.`:'Scegli un viaggio per vedere gli spostamenti.';
 if(!t){$('pbody').innerHTML='<div class="card">Crea o apri un viaggio per usare VYVA Move.</div>';go('panel');return}
 moveSelectedPlaces={from:null,to:null};
 $('pbody').innerHTML=`<div class="moveHero"><h2>VYVA Move</h2><p>Qui gestisci gli spostamenti durante il soggiorno. Il trasferimento aeroporto → città lo trovi direttamente nella schermata del viaggio.</p></div>
 ${mobilityAdvisorHtml(t)}
 ${londonTubeMapHtml(t)}
 <div class="moveRoute">
   <div class="field placeField">
     <label>DA</label>
     <div class="placeInputRow"><input id="moveFrom" autocomplete="off" placeholder="Es. nome hotel, Victoria Station…" oninput="onMovePlaceInput('from');updateRouteChoices()" onfocus="onMovePlaceInput('from')"><button id="useLocationBtn" class="locateBtn" type="button" onclick="useCurrentLocation()" aria-label="Usa posizione attuale">📍</button></div>
     <div id="moveFromSuggestions" class="placeSuggestions hide"></div>
   </div>
   <div class="field placeField">
     <label>A</label>
     <input id="moveTo" autocomplete="off" placeholder="Es. British Museum, ristorante, stazione…" oninput="onMovePlaceInput('to');updateRouteChoices()" onfocus="onMovePlaceInput('to')">
     <div id="moveToSuggestions" class="placeSuggestions hide"></div>
   </div>
   <small class="placeCredit">Mappa VYVA + ricerca mondiale + OpenStreetMap</small>
 </div>

 <div class="moveModes">
   <button class="moveMode on" onclick="setMoveMode('metro',this)"><span class="mi">🚇</span><b>Metro</b></button>
   <button class="moveMode" onclick="setMoveMode('bustram',this)"><span class="mi">🚌</span><b>Bus · Tram</b></button>
   <button class="moveMode" onclick="setMoveMode('train',this)"><span class="mi">🚆</span><b>Treno</b></button>
   <button class="moveMode" onclick="setMoveMode('ride',this)"><span class="mi">🚕</span><b>Taxi · Grab · Uber</b></button>
   <button class="moveMode walkFull" onclick="setMoveMode('walk',this)"><span class="mi">🚶</span><b>A piedi</b></button>
 </div>

 <div id="routeChoiceBox"></div>
 <div id="providerList" class="providerList"></div>
 <p class="moveNote">${londonTrip(t)?'A Londra VYVA usa i dati live di Transport for London. Metro e Bus · Tram privilegiano meno cammino quando esiste una combinazione sensata, mostrando cambi, coincidenze e mappa del percorso.':'La ricerca luoghi è mondiale. Il percorso dettagliato dentro VYVA viene collegato città per città ai rispettivi dati di trasporto; nel frattempo puoi aprire il percorso live sulla mappa.'}</p>`;
 go('panel');moveMode='metro';renderProviders();updateRouteChoices()
}
function moveIcon(type){if(type==='ride')return'🚕';if(type==='train')return'🚆';if(type==='walk')return'🚶';return'🚇'}
function saveMoveItem(type,provider,url){const t=currentTrip();if(!t)return;const from=$('moveFrom')?.value.trim()||'',to=$('moveTo')?.value.trim()||'',items=safeMoveItems();items.unshift({id:Date.now(),tripId:t.id,trip:t.destination,type,provider,url,from,to,fromPlace:moveSelectedPlaces.from,toPlace:moveSelectedPlaces.to,created:new Date().toISOString()});localStorage.setItem(MOVE_STORE,JSON.stringify(items));alert('Spostamento salvato nel Wallet VYVA.')}
function deleteMoveItem(id){
  const items=safeMoveItems();
  const removed=items.find(x=>x.id===id);
  localStorage.setItem(MOVE_STORE,JSON.stringify(items.filter(x=>x.id!==id)));

  if(removed?.airportTransfer){
    const t=currentTrip();
    if(t){
      const all=safeAirportTransfers();
      delete all[airportTransferKey(t,removed.direction||'outbound')];
      localStorage.setItem('vyvaAirportTransfersV1',JSON.stringify(all));
      renderTripArrivalHub(t);
    }
  }
  renderWalletPanel();
}

function toggleWalletAccordion(id){
  const box=$(id);
  if(box)box.classList.toggle('open');
}
function walletAccordionHtml(id,icon,title,subtitle,body){
  return `<div id="${id}" class="walletAccordion">
    <button class="walletAccordionHead" onclick="toggleWalletAccordion('${id}')">
      <span class="walletAccordionIcon">${icon}</span>
      <span><b>${escapeHtml(title)}</b><small>${escapeHtml(subtitle)}</small></span>
      <span class="walletAccordionChevron">⌄</span>
    </button>
    <div class="walletAccordionBody">${body}</div>
  </div>`;
}

async function renderWalletPanel(){
 const t=currentTrip();
 const items=safeMoveItems().filter(x=>!t||String(x.tripId)===String(t.id));

 let flightBody='';
 let flightCount=0;
 if(t?.transport==='Volo'&&t.from&&t.to){
   flightCount++;
   flightBody+=`<button class="flightWalletCard" onclick="openFlightWallet('outbound')">
     <span class="fwIcon">✈️</span>
     <span><b>${escapeHtml(t.from.iata)} → ${escapeHtml(t.to.iata)}</b><small>${escapeHtml(t.flightNo||'Volo di andata')} · ${escapeHtml(t.bookingCode||'codice prenotazione non inserito')}</small></span>
     <span class="flightWalletChevron">›</span>
   </button>`;
   if(t.returnFrom&&t.returnTo){
     flightCount++;
     flightBody+=`<button class="flightWalletCard" onclick="openFlightWallet('return')">
       <span class="fwIcon">↩️</span>
       <span><b>${escapeHtml(t.returnFrom.iata)} → ${escapeHtml(t.returnTo.iata)}</b><small>${escapeHtml(t.returnFlightNo||'Volo di ritorno')} · ${escapeHtml(t.returnBookingCode||'codice prenotazione non inserito')}</small></span>
       <span class="flightWalletChevron">›</span>
     </button>`;
   }
 }else{
   flightBody='<div class="walletEmpty">Nessun volo salvato per questo viaggio.</div>';
 }

 const moveBody=items.length
   ?items.map(x=>`<div class="walletItem"><span class="walletItemIcon">${moveIcon(x.type)}</span><span><b>${escapeHtml(x.provider||'Spostamento')}</b><small>${escapeHtml([x.from&&`Da ${x.from}`,x.to&&`a ${x.to}`,x.trip].filter(Boolean).join(' · '))}</small>${x.url?`<a class="walletMiniLink" target="_blank" rel="noopener" href="${x.url}">Apri prenotazione / info</a>`:''}</span><button class="walletDelete" onclick="deleteMoveItem(${x.id})">×</button></div>`).join('')
   :'<div class="walletEmpty">Nessuno spostamento salvato. Apri Move dal viaggio per aggiungerne uno.</div>';

 const visaBody='<div class="walletEmpty">Nessun visto aggiunto. Qui raccoglieremo eventuali visti e autorizzazioni richiesti dalla destinazione.</div>';
 const attractionBody='<div class="walletEmpty">Nessun ticket attrazione aggiunto. Qui raccoglieremo biglietti, QR code e prenotazioni delle attività.</div>';

 $('pbody').innerHTML=
   walletAccordionHtml('walletFlights','✈️','Voli',`${flightCount} ${flightCount===1?'volo':'voli'} · prenotazioni e carte d’imbarco`,flightBody)+
   walletAccordionHtml('walletVisas','🛂','Visti','Visti e autorizzazioni di viaggio',visaBody)+
   walletAccordionHtml('walletMove','🚇','Move',`${items.length} ${items.length===1?'spostamento salvato':'spostamenti salvati'}`,moveBody)+
   walletAccordionHtml('walletAttractions','🎟️','Ticket attrazioni','Biglietti, QR code e prenotazioni attività',attractionBody);
}
