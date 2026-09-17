const VYVA_ITINERARY_STORE='vyvaItineraryV1';

function safeItineraryItems(){
  try{return JSON.parse(localStorage.getItem(VYVA_ITINERARY_STORE)||'[]')}catch(e){return[]}
}
function saveItineraryItems(items){
  localStorage.setItem(VYVA_ITINERARY_STORE,JSON.stringify(items));
}
function discoverCity(){
  const t=currentTrip();
  return t?.destination||t?.to?.city||'la destinazione';
}
function isLondonTrip(t=currentTrip()){
  const s=String(t?.destination||t?.to?.city||'').toLowerCase();
  return s.includes('londra')||s.includes('london');
}

function londonDiscoverData(){
  return {
    quartieri:[
      {name:'Covent Garden',icon:'🎭',desc:'Piazze, artisti di strada, negozi e atmosfera centrale.'},
      {name:'Soho',icon:'✨',desc:'Teatri, locali, ristoranti e vita serale nel cuore di Londra.'},
      {name:'South Bank',icon:'🌉',desc:'Passeggiata sul Tamigi tra London Eye, ponti e cultura.'},
      {name:'Notting Hill',icon:'🏘️',desc:'Case colorate, Portobello Road e atmosfera di quartiere.'}
    ],
    must:[
      {name:'British Museum',icon:'🏛️',desc:'Una delle collezioni più importanti al mondo; ingresso generale gratuito.'},
      {name:'Westminster & Big Ben',icon:'🕰️',desc:'Il cuore monumentale di Londra, ideale da combinare con una passeggiata sul Tamigi.'},
      {name:'Tower of London',icon:'🏰',desc:'Fortezza storica e Crown Jewels; attività da programmare con tempo.'},
      {name:'London Eye',icon:'🎡',desc:'Vista panoramica sul centro e sul Tamigi.'}
    ],
    kids:[
      {name:'Natural History Museum',icon:'🦕',desc:'Dinosauri e grandi gallerie, molto adatto alle famiglie.'},
      {name:'Science Museum',icon:'🚀',desc:'Spazi interattivi e collezioni scientifiche.'},
      {name:'London Transport Museum',icon:'🚌',desc:'Storia di metro e bus londinesi, nel cuore di Covent Garden.'},
      {name:'Diana Memorial Playground',icon:'🛝',desc:'Area gioco a Kensington Gardens, utile per una pausa con bambini.'}
    ],
    food:[
      {name:'Borough Market',icon:'🥐',desc:'Mercato gastronomico storico con tantissime proposte.'},
      {name:'Seven Dials Market',icon:'🍜',desc:'Food hall centrale, comoda per gruppi con gusti diversi.'},
      {name:'Chinatown London',icon:'🥟',desc:'Ristoranti asiatici tra Soho e Leicester Square.'},
      {name:'Camden Market',icon:'🌮',desc:'Street food e atmosfera alternativa a Camden.'}
    ],
    free:[
      {name:'National Gallery',icon:'🖼️',desc:'Grande collezione d’arte a Trafalgar Square; ingresso generale gratuito.'},
      {name:'Tate Modern',icon:'🎨',desc:'Arte moderna sul Tamigi; collezione permanente generalmente gratuita.'},
      {name:'Hyde Park',icon:'🌳',desc:'Uno dei grandi parchi centrali, ideale per una pausa.'},
      {name:'British Museum',icon:'🏛️',desc:'Ingresso generale gratuito; alcune mostre speciali possono essere a pagamento.'}
    ],
    shopping:[
      {name:'Regent Street',icon:'🛍️',desc:'Shopping centrale e architettura elegante.'},
      {name:'Oxford Street',icon:'🛍️',desc:'La grande arteria commerciale del West End.'},
      {name:'Covent Garden',icon:'🎁',desc:'Boutique, beauty, design e mercato coperto.'},
      {name:'Camden Market',icon:'👟',desc:'Vintage, alternative fashion e bancarelle.'}
    ],
    rain:[
      {name:'British Museum',icon:'☔',desc:'Perfetto per spostare al coperto diverse ore della giornata.'},
      {name:'Natural History Museum',icon:'🦕',desc:'Una scelta forte quando piove, soprattutto con bambini.'},
      {name:'Science Museum',icon:'🔬',desc:'Attività indoor e aree interattive.'},
      {name:'National Gallery',icon:'🖼️',desc:'Centrale e facile da combinare con altre tappe al coperto.'}
    ]
  };
}

function genericDiscoverData(city){
  return {
    quartieri:[
      {name:`Centro di ${city}`,icon:'📍',desc:'Parti dal centro per orientarti e scoprire le zone principali.'}
    ],
    must:[
      {name:`Attrazioni principali di ${city}`,icon:'⭐',desc:'VYVA collegherà qui i luoghi più importanti della destinazione.'}
    ],
    kids:[
      {name:`Attività per famiglie a ${city}`,icon:'👨‍👩‍👧',desc:'Suggerimenti collegati alla composizione dei viaggiatori.'}
    ],
    food:[
      {name:`Mercati e cucina locale a ${city}`,icon:'🍽️',desc:'Zone e luoghi dove provare la cucina della destinazione.'}
    ],
    free:[
      {name:`Cose gratuite a ${city}`,icon:'🆓',desc:'Parchi, musei e luoghi accessibili gratuitamente.'}
    ],
    shopping:[
      {name:`Shopping a ${city}`,icon:'🛍️',desc:'Vie commerciali, mercati e quartieri dello shopping.'}
    ],
    rain:[
      {name:`Cosa fare se piove a ${city}`,icon:'☔',desc:'Musei e attività al coperto da usare anche per adattare l’itinerario.'}
    ]
  };
}

function discoverCategories(){
  return [
    {key:'quartieri',icon:'🏘️',title:'Quartieri',sub:'Zone da vivere'},
    {key:'must',icon:'⭐',title:'Da non perdere',sub:'I grandi classici'},
    {key:'kids',icon:'👨‍👩‍👧',title:'Con bambini',sub:'Idee family'},
    {key:'food',icon:'🍽️',title:'Mangiare',sub:'Mercati e zone food'},
    {key:'free',icon:'🆓',title:'Gratis / poco costoso',sub:'Belle cose senza spendere troppo'},
    {key:'shopping',icon:'🛍️',title:'Shopping',sub:'Vie, mercati e quartieri'},
    {key:'rain',icon:'☔',title:'Piove?',sub:'Alternative al coperto'},
    {key:'nearby',icon:'📍',title:'Vicino a te',sub:'Parti dalla posizione attuale'},
    {key:'info',icon:'ℹ️',title:'Info pratiche',sub:'Valuta, prese, emergenze'}
  ];
}

function openDiscoverPanel(){
  const t=currentTrip();
  if(!t){alert('Apri prima un viaggio.');return}
  const city=discoverCity();
  setActive('Viaggi');
  $('ptitle').textContent=`Scopri ${city}`;
  $('ptext').textContent=`Mini-guida VYVA collegata al viaggio ${city}.`;
  $('pbody').innerHTML=`
    <div class="discoverHero">
      <small>VYVA DISCOVER</small>
      <h2>Scopri ${escapeHtml(city)}</h2>
      <p>Trova cosa vedere, dove mangiare e cosa fare. Ogni luogo può essere aggiunto all’itinerario o aperto direttamente in Move.</p>
    </div>
    <div class="discoverGrid">
      ${discoverCategories().map(c=>`<button class="discoverTile" onclick="showDiscoverCategory('${c.key}')"><span class="di">${c.icon}</span><b>${escapeHtml(c.title)}</b><small>${escapeHtml(c.sub)}</small></button>`).join('')}
    </div>`;
  go('panel');
}

function showDiscoverCategory(key){
  const t=currentTrip();
  if(!t)return;
  const city=discoverCity();
  const cats=discoverCategories();
  const meta=cats.find(c=>c.key===key);
  $('ptitle').textContent=`Scopri ${city}`;
  $('ptext').textContent=meta?meta.title:'Scopri';

  if(key==='nearby'){
    $('pbody').innerHTML=`
      <button class="discoverBack" onclick="openDiscoverPanel()">← Tutte le categorie</button>
      <div class="discoverHero"><small>VICINO A TE</small><h2>Parti da dove sei</h2><p>VYVA apre Move usando la posizione attuale come punto di partenza. Da lì puoi cercare qualsiasi luogo nella città del viaggio.</p></div>
      <div class="discoverPlace">
        <div class="discoverPlaceTop"><span class="discoverPlaceIcon">📍</span><span><b>Usa la mia posizione</b><p>Apri Move e imposta automaticamente la posizione attuale come “DA”.</p></span></div>
        <div class="discoverActions"><button class="primary" onclick="openNearbyInMove()">Apri in Move</button><button class="secondary" onclick="openDiscoverPanel()">Indietro</button></div>
      </div>`;
    go('panel');return;
  }

  if(key==='info'){
    const london=isLondonTrip(t);
    const info=london?[
      ['💷 Valuta','Sterlina britannica (GBP). Le carte contactless sono molto diffuse.'],
      ['🔌 Prese','Tipo G, con tre poli rettangolari. Serve un adattatore per molte spine italiane.'],
      ['🚨 Emergenze','999 o 112 per emergenze.'],
      ['🚇 Trasporti','Per Tube e bus puoi usare contactless/Oyster; VYVA Move calcola i percorsi del viaggio.'],
      ['🚘 Strada','Nel Regno Unito si guida a sinistra: attenzione soprattutto agli attraversamenti pedonali.']
    ]:[
      ['💳 Pagamenti',`Controlla valuta e metodi di pagamento più comuni a ${city}.`],
      ['🔌 Prese','VYVA mostrerà il tipo di presa e l’eventuale adattatore necessario.'],
      ['🚨 Emergenze','VYVA collegherà qui i numeri locali utili e di emergenza.'],
      ['🚌 Trasporti','Usa Move per vedere mezzi e percorsi legati alla città del viaggio.']
    ];
    $('pbody').innerHTML=`
      <button class="discoverBack" onclick="openDiscoverPanel()">← Tutte le categorie</button>
      <h2 class="discoverSectionTitle">ℹ️ Info pratiche · ${escapeHtml(city)}</h2>
      ${info.map(x=>`<div class="discoverInfo"><b>${x[0]}</b>${escapeHtml(x[1])}</div>`).join('')}`;
    go('panel');return;
  }

  const data=isLondonTrip(t)?londonDiscoverData():genericDiscoverData(city);
  const list=data[key]||[];
  $('pbody').innerHTML=`
    <button class="discoverBack" onclick="openDiscoverPanel()">← Tutte le categorie</button>
    <h2 class="discoverSectionTitle">${meta?.icon||'✨'} ${escapeHtml(meta?.title||'Scopri')}</h2>
    ${list.map((p,i)=>discoverPlaceHtml(p,key,i)).join('')||'<div class="card">Contenuti in preparazione per questa destinazione.</div>'}`;
  go('panel');
}

function discoverPlaceHtml(place,category,index){
  return `<div class="discoverPlace">
    <div class="discoverPlaceTop">
      <span class="discoverPlaceIcon">${place.icon||'📍'}</span>
      <span><b>${escapeHtml(place.name)}</b><p>${escapeHtml(place.desc||'')}</p></span>
    </div>
    <div class="discoverActions">
      <button class="primary" onclick="addDiscoverToItinerary('${encodeURIComponent(place.name)}','${encodeURIComponent(category)}')">+ Itinerario</button>
      <button class="secondary" onclick="openDiscoverPlaceInMove('${encodeURIComponent(place.name)}')">Portami qui</button>
    </div>
  </div>`;
}

function addDiscoverToItinerary(encodedName,encodedCategory){
  const t=currentTrip();if(!t)return;
  const name=decodeURIComponent(encodedName),category=decodeURIComponent(encodedCategory);
  const items=safeItineraryItems();
  const exists=items.some(x=>String(x.tripId)===String(t.id)&&x.name===name);
  if(!exists){
    items.unshift({id:Date.now(),tripId:t.id,city:t.destination,name,category,created:new Date().toISOString()});
    saveItineraryItems(items);
  }
  alert(exists?'Questo luogo è già nell’itinerario.':'Aggiunto all’itinerario VYVA.');
}

function openDiscoverPlaceInMove(encodedName){
  const t=currentTrip();if(!t)return;
  const name=decodeURIComponent(encodedName);
  openMovePanel();
  setTimeout(()=>{
    const input=$('moveTo');
    if(!input)return;
    input.value=`${name}, ${t.destination||''}`;
    moveSelectedPlaces.to=null;
    onMovePlaceInput('to');
    updateRouteChoices();
    input.focus();
  },80);
}

function openNearbyInMove(){
  openMovePanel();
  setTimeout(()=>useCurrentLocation(),100);
}

function openItineraryPanel(){
  const t=currentTrip();
  if(!t){alert('Apri prima un viaggio.');return}
  setActive('Viaggi');
  $('ptitle').textContent='Itinerario';
  $('ptext').textContent=`Luoghi salvati per ${t.destination}.`;
  const items=safeItineraryItems().filter(x=>String(x.tripId)===String(t.id));
  $('pbody').innerHTML=items.length
    ? items.map(x=>`<div class="itinerarySaved">
        <span style="font-size:22px">📍</span>
        <span class="copy"><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.category||'Scopri')}</small></span>
        <button class="go" onclick="openDiscoverPlaceInMove('${encodeURIComponent(x.name)}')">Move</button>
        <button class="remove" onclick="removeItineraryItem('${x.id}')">×</button>
      </div>`).join('')
    : `<div class="card"><b>Il tuo itinerario è ancora vuoto.</b><p class="muted">Apri “Scopri ${escapeHtml(t.destination)}” e aggiungi i luoghi che vuoi visitare.</p><button class="sectionAction" onclick="openDiscoverPanel()">Scopri ${escapeHtml(t.destination)}</button></div>`;
  go('panel');
}

function removeItineraryItem(id){
  const items=safeItineraryItems().filter(x=>String(x.id)!==String(id));
  saveItineraryItems(items);
  openItineraryPanel();
}
