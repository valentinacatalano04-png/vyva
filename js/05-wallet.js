const WALLET_BOARDING_URLS=[];

function clearWalletAirlineTheme(){
  document.body.classList.remove('walletAirlineTheme');
  document.documentElement.style.setProperty('--wallet-airline-accent','#14203d');
  document.documentElement.style.setProperty('--wallet-airline-text','#fff');
}
function applyWalletAirlineTheme(carrier){
  if(!carrier)return clearWalletAirlineTheme();
  document.documentElement.style.setProperty('--wallet-airline-accent',carrier.accent||'#14203d');
  document.documentElement.style.setProperty('--wallet-airline-text',carrier.text||'#fff');
  document.body.classList.add('walletAirlineTheme');
}

function walletCarrierCatalog(){
  return [
    {re:/^(U2|EC|DS|EZY|EJU|EZS)(?=\d)/,name:'easyJet',accent:'#ff6600',text:'#fff',url:'https://www.easyjet.com/en/manage-bookings',checkinHours:720},
    {re:/^(FR|RYR)/,name:'Ryanair',accent:'#073590',text:'#ffd600',url:'https://www.ryanair.com/',checkinHours:24},
    {re:/^(W6|W4|W9|WZZ)/,name:'Wizz Air',accent:'#c6007e',text:'#fff',url:'https://wizzair.com/',checkinHours:24},
    {re:/^(BA|BAW)/,name:'British Airways',accent:'#075aaa',text:'#fff',url:'https://www.britishairways.com/travel/managebooking/public/en_gb',checkinHours:24},
    {re:/^(VY|VLG)/,name:'Vueling',accent:'#ffcc00',text:'#1a1a1a',url:'https://www.vueling.com/',checkinHours:24},
    {re:/^(AZ|ITY)/,name:'ITA Airways',accent:'#1769aa',text:'#fff',url:'https://www.ita-airways.com/',checkinHours:48},
    {re:/^(LH|DLH)/,name:'Lufthansa',accent:'#05164d',text:'#f9ba00',url:'https://www.lufthansa.com/',checkinHours:30},
    {re:/^(AF|AFR)/,name:'Air France',accent:'#051039',text:'#fff',url:'https://www.airfrance.com/',checkinHours:30},
    {re:/^(KL|KLM)/,name:'KLM',accent:'#00a1de',text:'#fff',url:'https://www.klm.com/',checkinHours:30},
    {re:/^(EK|UAE)/,name:'Emirates',accent:'#d71920',text:'#fff',url:'https://www.emirates.com/',checkinHours:48},
    {re:/^(QR|QTR)/,name:'Qatar Airways',accent:'#5c0632',text:'#fff',url:'https://www.qatarairways.com/',checkinHours:48},
    {re:/^(TK|THY)/,name:'Turkish Airlines',accent:'#c70a0c',text:'#fff',url:'https://www.turkishairlines.com/',checkinHours:24},
    {re:/^(IB|IBE)/,name:'Iberia',accent:'#d71920',text:'#fff',url:'https://www.iberia.com/',checkinHours:24},
    {re:/^(TP|TAP)/,name:'TAP Air Portugal',accent:'#00843d',text:'#fff',url:'https://www.flytap.com/',checkinHours:36},
    {re:/^(LX|SWR)/,name:'SWISS',accent:'#d40511',text:'#fff',url:'https://www.swiss.com/',checkinHours:23},
    {re:/^(EI|EIN)/,name:'Aer Lingus',accent:'#007f6d',text:'#fff',url:'https://www.aerlingus.com/',checkinHours:48},
    {re:/^(DY|NOZ)/,name:'Norwegian',accent:'#d81920',text:'#fff',url:'https://www.norwegian.com/',checkinHours:24},
    {re:/^(EW|EWG)/,name:'Eurowings',accent:'#8a236b',text:'#fff',url:'https://www.eurowings.com/',checkinHours:72},
    {re:/^(DL|DAL)/,name:'Delta',accent:'#9b1631',text:'#fff',url:'https://www.delta.com/',checkinHours:24},
    {re:/^(UA|UAL)/,name:'United',accent:'#005daa',text:'#fff',url:'https://www.united.com/',checkinHours:24},
    {re:/^(AA|AAL)/,name:'American Airlines',accent:'#0078d2',text:'#fff',url:'https://www.aa.com/',checkinHours:24},
    {re:/^(AC|ACA)/,name:'Air Canada',accent:'#d8292f',text:'#fff',url:'https://www.aircanada.com/',checkinHours:24}
  ];
}
function flightCarrierInfo(no=''){
  const n=String(no).toUpperCase().replace(/\s+/g,'');
  const code=(n.match(/^([A-Z]{3}|[A-Z]{2}|[A-Z][0-9]|[0-9][A-Z])(?=[0-9])/ )||['',''])[1];
  const hit=walletCarrierCatalog().find(c=>c.re.test(n));
  if(hit)return hit;
  return{
    name:code?`Compagnia ${code}`:'Compagnia aerea',
    accent:'#17213a',text:'#fff',
    url:'https://www.google.com/search?q='+encodeURIComponent((no||'volo')+' compagnia aerea check-in'),
    checkinHours:24
  };
}

function walletCarrierForFlight(f){
  const saved=f.walletCarrier;
  if(saved?.name){
    const known=walletCarrierCatalog().find(c=>c.name===saved.name);
    if(known)return known;
    if(/^#[0-9a-f]{6}$/i.test(saved.accent||'')){
      const rgb=saved.accent.slice(1).match(/../g).map(v=>parseInt(v,16));
      const light=(rgb[0]*299+rgb[1]*587+rgb[2]*114)/1000>155;
      return {...flightCarrierInfo(f.flightNo),name:saved.name,accent:saved.accent,text:light?'#171717':'#fff'};
    }
  }
  return flightCarrierInfo(f.flightNo);
}

function openTripFlightInfo(){
  const t=currentTrip();if(!t)return;
  setActive('Viaggi');
  $('ptitle').textContent='Informazioni volo';
  $('ptext').textContent=t.destination||'Il mio viaggio';
  const legs=t.transport==='Volo'?['outbound',...(t.returnFrom&&t.returnTo?['return']:[])]:[];
  $('pbody').innerHTML='<button class="walletBack" onclick="navTo(\'Viaggi\')">← Torna al viaggio</button>'+(
    legs.length?legs.map(leg=>{
      const f=legData(t,leg),carrier=walletCarrierForFlight(f),ops=getFlightOpsData(t.id,leg);
      const fromTerminal=(f.departureTerminal??ops.terminal)||f.from?.terminal||'Da inserire';
      const toTerminal=f.arrivalTerminal||f.to?.terminal||'Da inserire';
      return `<article class="card"><h2>${escapeHtml(f.label)}</h2>
        <p><b>${escapeHtml(carrier.name)}</b> · ${escapeHtml(f.flightNo||'Numero volo da inserire')}</p>
        <h3>${escapeHtml(f.from?.iata||'—')} → ${escapeHtml(f.to?.iata||'—')}</h3>
        <p><b>Partenza</b><br>${escapeHtml([f.from?.city,f.from?.name].filter(Boolean).join(' · '))}<br>${escapeHtml(f.date?fmtDate(f.date):'Data da inserire')} · ${escapeHtml(f.time||'Ora da inserire')}<br>Terminale: ${escapeHtml(fromTerminal)}</p>
        <p><b>Arrivo</b><br>${escapeHtml([f.to?.city,f.to?.name].filter(Boolean).join(' · '))}<br>${escapeHtml(f.arrivalDate?fmtDate(f.arrivalDate):'Data da inserire')} · ${escapeHtml(f.arrivalTime||'Ora da inserire')}<br>Terminale: ${escapeHtml(toTerminal)}</p>
        ${ops.gate?`<p><b>Gate:</b> ${escapeHtml(ops.gate)}</p>`:''}
        ${f.duration?`<p><b>Durata:</b> ${escapeHtml(f.duration)}</p>`:''}
      </article>`;
    }).join(''):'<div class="card">Nessun volo inserito per questo viaggio.</div>');
  go('panel');
}

function missingFlightCore(f){
  const missing=[];
  if(!String(f?.bookingCode||'').trim())missing.push('Codice prenotazione');
  if(!String(f?.flightNo||'').trim())missing.push('Numero volo');
  return missing;
}
function flightLegPropNames(leg){
  return leg==='return'
    ?{flightNo:'returnFlightNo',bookingCode:'returnBookingCode'}
    :{flightNo:'flightNo',bookingCode:'bookingCode'};
}
function showBookingSaveMessage(message){
  bookingReadStatus(message);
  let el=document.getElementById('bookingSaveStatus');
  if(!el){
    el=document.createElement('p');el.id='bookingSaveStatus';el.setAttribute('role','status');
    const button=document.querySelector('.flightSetupCard .flightSetupSave');
    if(button)button.after(el);else document.getElementById('pbody')?.prepend(el);
  }
  el.textContent=message;
  el.style.cssText='padding:12px;border-radius:12px;background:#edf3f8;color:#17213a;font-size:14px;line-height:1.5';
  document.activeElement?.blur?.();
  el.scrollIntoView?.({block:'center',behavior:'smooth'});
}
async function saveFlightCoreData(leg){
  const t=currentTrip();if(!t){showBookingSaveMessage('Apri un viaggio prima di salvare la prenotazione.');return;}
  const flightNo=($('walletFlightNoInput')?.value||'').replace(/\s+/g,'').toUpperCase();
  const bookingCode=($('walletBookingCodeInput')?.value||'').trim().toUpperCase();
  const departureTerminal=($('walletDepartureTerminalInput')?.value||'').trim();
  const arrivalTerminal=($('walletArrivalTerminalInput')?.value||'').trim();
  if(!flightNo&&!bookingCode&&!departureTerminal&&!arrivalTerminal){
    showBookingSaveMessage('Non ci sono ancora dati da salvare. Leggi lo screenshot/PDF oppure inserisci almeno un dato nei campi.');
    return;
  }
  if((flightNo&&!/^(?:[A-Z]{2,3}|[A-Z][0-9]|[0-9][A-Z])[0-9]{1,4}[A-Z]?$/.test(flightNo))||(bookingCode&&!/^[A-Z0-9-]{4,12}$/.test(bookingCode))){
    showBookingSaveMessage('Controlla il formato: numero volo (es. EJU8313) e codice prenotazione, senza spazi. Nessun dato modificato.');
    return;
  }
  const trips=safeTrips();
  const idx=trips.findIndex(x=>String(x.id)===String(t.id));
  if(idx<0){showBookingSaveMessage('Viaggio non trovato. Riaprilo dalla sezione Viaggi.');return;}
  const props=flightLegPropNames(leg);
  trips[idx][props.flightNo]=flightNo;
  trips[idx][props.bookingCode]=bookingCode;
  const departureKey=leg==='return'?'returnDepartureTerminal':'departureTerminal';
  const arrivalKey=leg==='return'?'returnArrivalTerminal':'arrivalTerminal';
  if($('walletDepartureTerminalInput'))trips[idx][departureKey]=departureTerminal.slice(0,80);
  if($('walletArrivalTerminalInput'))trips[idx][arrivalKey]=arrivalTerminal.slice(0,80);
  if($('walletCarrierSelect')){
    const carrierKey=leg==='return'?'returnWalletCarrier':'walletCarrier';
    const selected=$('walletCarrierSelect').value;
    if(selected==='custom'){
      const name=($('walletCarrierName')?.value||'').trim().slice(0,60);
      const accent=$('walletCarrierColor')?.value||'';
      if(!name||!/^#[0-9a-f]{6}$/i.test(accent)){showBookingSaveMessage('Inserisci il nome e il colore della compagnia.');return;}
      trips[idx][carrierKey]={name,accent};
    }else if(selected){trips[idx][carrierKey]={name:selected};}
    else delete trips[idx][carrierKey];
  }
  try{
    localStorage.setItem(STORE,JSON.stringify(trips));
  }catch(e){showBookingSaveMessage('Salvataggio non riuscito sul dispositivo. I campi restano compilati: riprova senza chiudere la pagina.');return;}
  const missing=[];
  if(!flightNo)missing.push('numero volo');if(!bookingCode)missing.push('codice prenotazione');
  if(missing.length){showBookingSaveMessage('✓ Dati salvati come bozza. Per completare la prenotazione manca: '+missing.join(' e ')+'.');return;}
  showBookingSaveMessage('✓ Dati salvati. Apertura del Wallet…');
  try{await openFlightWallet(leg);showBookingSaveMessage('✓ Dati della prenotazione salvati.');}
  catch(e){showBookingSaveMessage('✓ Dati salvati, ma il Wallet non si è aperto. Puoi riaprirlo dalla barra in basso.');}
}

function checkInState(f,carrier){
  const dep=departureDateTime(f);
  if(!dep)return{open:false,past:false,text:'Inserisci data e ora del volo per calcolare il check-in.'};
  const openAt=new Date(dep.getTime()-(carrier?.checkinHours||24)*3600000);
  const now=new Date();
  const open=now>=openAt;
  const past=now>dep;
  const fmt=new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  return{
    open,
    past,
    openAt,
    text:open
      ?(past?'Il volo è già partito. Puoi comunque conservare qui le carte d’imbarco.':'Il check-in è disponibile.')
      :`Il check-in apre il ${fmt.format(openAt).replace(',',' alle')}.`
  };
}

function flightPassengerSummary(t){
  const people=flightTravelers(t);
  if(!people.length)return'Nessun viaggiatore';
  const counts={};
  people.forEach(p=>{
    const k=String(p.type||'Viaggiatore').toLowerCase();
    counts[k]=(counts[k]||0)+1;
  });
  const labels=[];
  const push=(keys,sing,plur)=>{
    const n=keys.reduce((s,k)=>s+(counts[k]||0),0);
    if(n)labels.push(`${n} ${n===1?sing:plur}`);
  };
  push(['adulto','adult','adults'],'adulto','adulti');
  push(['ragazzo','teen','teens','adolescente'],'adolescente','adolescenti');
  push(['bambino','child','children'],'bambino','bambini');
  push(['neonato','infant','infants'],'neonato','neonati');
  return labels.length?labels.join(', '):`${people.length} viaggiatori`;
}

function toggleFlightPax(){
  $('flightPaxDetail')?.classList.toggle('show');
}

async function bookingDocsFor(t,leg){
  const docs=await getAllFlightDocs();
  return docs.filter(d=>String(d.tripId)===String(t.id)&&d.leg===leg&&d.type==='booking');
}
async function boardingDocsFor(t,leg){
  const docs=await getAllFlightDocs();
  return docs.filter(d=>String(d.tripId)===String(t.id)&&d.leg===leg&&d.type==='boarding');
}

async function renderWalletPanel(){
  clearWalletAirlineTheme();
  const t=currentTrip();
  setActive('Wallet');
  if(t?.transport==='Volo'){
    const f=legData(t,activeFlightLeg(t));
    if(!missingFlightCore(f).length)applyWalletAirlineTheme(walletCarrierForFlight(f));
  }
  const items=safeMoveItems().filter(x=>!t||String(x.tripId)===String(t.id));
  let flightBody='',flightCount=0;

  if(t?.transport==='Volo'&&t.from&&t.to){
    const legs=['outbound'];
    if(t.returnFrom&&t.returnTo)legs.push('return');
    flightCount=legs.length;
    flightBody=legs.map(leg=>{
      const f=legData(t,leg);
      const missing=missingFlightCore(f);
      return `<button class="flightWalletCompact" onclick="openFlightWallet('${leg}')">
        <span class="airportCode">${escapeHtml(f.from?.iata||'—')}</span>
        <span class="routePlane">✈️</span>
        <span class="airportCode">${escapeHtml(f.to?.iata||'—')}</span>
        ${missing.length?'<span class="flightMissingBadge">1</span>':''}
      </button>`;
    }).join('');
  }else{
    flightBody='<div class="walletEmpty">Nessun volo salvato per questo viaggio.</div>';
  }

  const moveBody=items.length
    ?items.map(x=>`<div class="walletItem"><span class="walletItemIcon">${moveIcon(x.type)}</span><span><b>${escapeHtml(x.provider||'Spostamento')}</b><small>${escapeHtml([x.from&&`Da ${x.from}`,x.to&&`a ${x.to}`,x.trip].filter(Boolean).join(' · '))}</small>${x.url?`<a class="walletMiniLink" target="_blank" rel="noopener" href="${x.url}">Apri prenotazione / info</a>`:''}</span><button class="walletDelete" onclick="deleteMoveItem(${x.id})">×</button></div>`).join('')
    :'<div class="walletEmpty">Nessuno spostamento salvato. Apri Move dal viaggio per aggiungerne uno.</div>';

  $('pbody').innerHTML=
    walletAccordionHtml('walletFlights','✈️','Voli',`${flightCount} ${flightCount===1?'volo':'voli'} · documenti e carte d’imbarco`,flightBody)+
    walletAccordionHtml('walletVisas','🛂','Visti','Visti e autorizzazioni di viaggio','<div class="walletEmpty">Nessun visto aggiunto.</div>')+
    walletAccordionHtml('walletMove','🚇','Move',`${items.length} ${items.length===1?'spostamento salvato':'spostamenti salvati'}`,moveBody)+
    walletAccordionHtml('walletAttractions','🎟️','Ticket attrazioni','Biglietti, QR code e prenotazioni attività','<div class="walletEmpty">Nessun ticket attrazione aggiunto.</div>');
}

async function handleBookingFilesUpload(input,tripId,leg){
  const files=[...(input.files||[])];
  if(!files.length)return;
  const form=input.closest('.flightSetupCard');
  const errors=[];
  const saved=[];
  form?.querySelectorAll('button,input').forEach(el=>el.disabled=true);
  bookingReadStatus('Salvataggio allegati e lettura in corso…');
  try{
    for(let i=0;i<files.length;i++){
      const file=files[i];
      if(file.size>18*1024*1024){errors.push(file.name+': supera 18 MB.');continue;}
      if(!/^image\//.test(file.type)&&file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name)){
        errors.push(file.name+': formato non supportato. Usa PNG, JPEG o PDF.');continue;
      }
      await putFlightDoc({
        id:`${tripId}|${leg}|booking|${Date.now()}-${i}-${Math.random().toString(36).slice(2,8)}`,
        tripId:String(tripId),leg,travelerKey:'booking',type:'booking',
        name:file.name,mime:file.type||'application/octet-stream',blob:file,
        updatedAt:new Date().toISOString()
      });
      saved.push(file);
    }
    input.value='';
    if(form?.isConnected){
      const list=form.querySelector('.bookingFilesList');
      saved.forEach(file=>{const row=document.createElement('p');row.textContent='✓ Allegato salvato: '+file.name;list?.append(row);});
      await readBookingFiles(saved,form,errors);
    }
  }catch(e){
    bookingReadStatus('Non riesco a salvare tutti gli allegati. Puoi comunque inserire i dati manualmente.');
  }finally{
    form?.querySelectorAll('button,input').forEach(el=>el.disabled=false);
  }
}

async function handleBoardingPassesUpload(input,tripId,leg){
  const files=[...(input.files||[])];
  if(!files.length)return;
  try{
    for(let i=0;i<files.length;i++){
      const file=files[i];
      if(file.size>18*1024*1024)continue;
      await putFlightDoc({
        id:`${tripId}|${leg}|boarding|${Date.now()}-${i}-${Math.random().toString(36).slice(2,8)}`,
        tripId:String(tripId),leg,travelerKey:'wallet',type:'boarding',
        name:file.name,mime:file.type||'application/octet-stream',blob:file,
        updatedAt:new Date().toISOString()
      });
    }
    input.value='';
    await openFlightWallet(leg);
    const t=currentTrip();if(t)updateTripFlightLifecycle(t);
  }catch(e){
    alert('Non riesco a salvare una o più carte d’imbarco.');
  }
}

async function deleteBoardingPass(id,leg){
  if(!confirm('Eliminare questa carta d’imbarco dal Wallet?'))return;
  await removeFlightDoc(id);
  await openFlightWallet(leg);
  const t=currentTrip();if(t)updateTripFlightLifecycle(t);
}


async function deleteFlightBooking(leg){
  const t=currentTrip();
  if(!t)return;

  const label=leg==='return'?'ritorno':'andata';
  const ok=confirm(
    `Eliminare la prenotazione del volo di ${label}?\n\n`+
    'VYVA eliminerà gli screenshot/PDF della prenotazione e azzererà numero volo, codice prenotazione, terminali e gate. '+
    'Aeroporti, date, viaggiatori e carte d’imbarco resteranno invariati.'
  );
  if(!ok)return;

  try{
    // Delete only booking attachments for this trip/leg.
    const docs=await getAllFlightDocs();
    const bookingDocs=docs.filter(d =>
      String(d.tripId)===String(t.id) &&
      d.leg===leg &&
      d.type==='booking'
    );
    for(const d of bookingDocs){
      await removeFlightDoc(d.id);
    }

    // Reset booking-derived fields without deleting the trip/route.
    const trips=safeTrips();
    const idx=trips.findIndex(x=>String(x.id)===String(t.id));
    if(idx>=0){
      const x=trips[idx];

      if(leg==='return'){
        x.returnFlightNo='';
        x.returnBookingCode='';
        x.returnDepartureTerminal='';
        x.returnArrivalTerminal='';
        delete x.returnWalletCarrier;
      }else{
        x.flightNo='';
        x.bookingCode='';
        x.departureTerminal='';
        x.arrivalTerminal='';
        delete x.walletCarrier;
      }

      localStorage.setItem(STORE,JSON.stringify(trips));
    }

    // Reset operational terminal/gate saved for this leg.
    try{
      const all=safeFlightOps();
      delete all[`${t.id}|${leg}`];
      localStorage.setItem(FLIGHT_OPS_STORE,JSON.stringify(all));
    }catch(e){}

    clearWalletAirlineTheme?.();
    await openFlightWallet(leg);

    const status=document.getElementById('bookingReadStatus');
    if(status)status.textContent='Prenotazione eliminata. Ora puoi caricare di nuovo screenshot o PDF.';

    const ct=currentTrip();
    if(ct)updateTripFlightLifecycle(ct);
  }catch(e){
    alert('Non riesco a eliminare completamente la prenotazione. Riprova.');
  }
}

function bookingSetupHtml(t,leg,f,bookingDocs,missing){
  const inputId=`wallet-booking-upload-${t.id}-${leg}`.replace(/[^a-zA-Z0-9_-]/g,'-');
  const fileList=bookingDocs.map(d=>`<div class="bookingFileMini"><span>📄 ${escapeHtml(d.name)}</span><button onclick="deleteSavedFlightDoc('${d.id}','${leg}')">×</button></div>`).join('');
  return `
    ${missing.length?`<div class="flightMissingAlert">
      <span class="bang">!</span>
      <span><b>Mancano alcuni dati del volo</b><small>${escapeHtml(missing.join(' · '))}. Inseriscili qui sotto: il badge rosso sparirà automaticamente.</small></span>
      <span>›</span>
    </div>`:''}
    <div class="flightSetupCard">
      <h3>${bookingDocs.length?'Completa la prenotazione':'Carica la prenotazione'}</h3>
      <p>Scegli tu: inserisci i dati manualmente oppure carica uno screenshot o PDF per leggere numero volo e codice prenotazione. Controlla sempre i risultati prima di salvare.</p>
      <p><small>La lettura avviene sul dispositivo. Serve internet per scaricare il lettore al primo utilizzo. Gli allegati restano in questo browser.</small></p>
      <p id="bookingReadStatus" role="status" aria-live="polite"></p>
      <div id="bookingReadReview"></div>

      <div class="flightSetupGrid">
        <label>Numero volo
          <input id="walletFlightNoInput" value="${escapeHtml(f.flightNo||'')}" placeholder="es. U2 8308" autocomplete="off">
        </label>
        <label>Codice prenotazione
          <input id="walletBookingCodeInput" value="${escapeHtml(f.bookingCode||'')}" placeholder="es. KDC7C5D" autocomplete="off">
        </label>
        <label>Terminale di partenza
          <input id="walletDepartureTerminalInput" value="${escapeHtml(f.departureTerminal??(getFlightOpsData(t.id,leg).terminal||f.from?.terminal||''))}" placeholder="Come nella prenotazione" maxlength="80" autocomplete="off">
        </label>
        <label>Terminale di arrivo
          <input id="walletArrivalTerminalInput" value="${escapeHtml(f.arrivalTerminal??f.to?.terminal??'')}" placeholder="Come nella prenotazione" maxlength="80" autocomplete="off">
        </label>
      </div>
      <label style="display:block;margin-top:14px">Compagnia e colori
        <select id="walletCarrierSelect" style="width:100%;padding:12px;margin-top:6px" onchange="$('walletCustomCarrier').hidden=this.value!=='custom'">
          <option value="">Riconosci automaticamente dal numero volo</option>
          ${walletCarrierCatalog().map(c=>`<option value="${escapeHtml(c.name)}" ${f.walletCarrier?.name===c.name?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}
          <option value="custom" ${f.walletCarrier?.name&&!walletCarrierCatalog().some(c=>c.name===f.walletCarrier.name)?'selected':''}>Altra compagnia — scegli i colori</option>
        </select>
      </label>
      <div id="walletCustomCarrier" class="flightSetupGrid" ${f.walletCarrier?.name&&!walletCarrierCatalog().some(c=>c.name===f.walletCarrier.name)?'':'hidden'}>
        <label>Nome compagnia<input id="walletCarrierName" maxlength="60" value="${escapeHtml(f.walletCarrier?.name||'')}" placeholder="Nome sulla prenotazione"></label>
        <label>Colore compagnia<input id="walletCarrierColor" type="color" value="${/^#[0-9a-f]{6}$/i.test(f.walletCarrier?.accent||'')?f.walletCarrier.accent:'#17213a'}"></label>
      </div>
      <button class="flightSetupSave" onclick="saveFlightCoreData('${leg}')">Salva dati</button>

      <input id="${inputId}" type="file" accept="application/pdf,image/*" multiple hidden onchange="handleBookingFilesUpload(this,'${t.id}','${leg}')">
      <button class="flightBookingUpload" onclick="$('${inputId}').click()">📎 Leggi da screenshot / PDF</button>
      ${bookingDocs.length?`<button class="flightSetupSave" onclick="rereadBookingFiles('${leg}',this)">Leggi gli allegati già caricati</button>`:''}
      ${(bookingDocs.length||f.flightNo||f.bookingCode||f.departureTerminal||f.arrivalTerminal||getFlightOpsData(t.id,leg).gate||getFlightOpsData(t.id,leg).terminal)?`<button class="flightBookingDelete" onclick="deleteFlightBooking('${leg}')">🗑️ Elimina prenotazione</button>`:''}
      <div class="bookingFilesList">${fileList}</div>
    </div>`;
}

function bookingDetailHtml(t,leg,f,carrier,bookingDocs){
  const ops=getFlightOpsData(t.id,leg);
  const ci=checkInState(f,carrier);
  const passengers=flightTravelers(t);
  const paxNames=passengers.map(p=>escapeHtml(p.name)).join(' · ');
  const boardingInput=`boarding-upload-${t.id}-${leg}`.replace(/[^a-zA-Z0-9_-]/g,'-');
  const dateText=f.date?new Intl.DateTimeFormat('it-IT',{weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(new Date(f.date+'T12:00:00')):'Data non inserita';
  const fromName=[f.from?.city,f.from?.name].filter(Boolean).join(' ');
  const toName=[f.to?.city,f.to?.name].filter(Boolean).join(' ');
  const fromTerminal=(f.departureTerminal??ops.terminal)||f.from?.terminal||'Da inserire';
  const toTerminal=f.arrivalTerminal||f.to?.terminal||'Da inserire';

  return `<div class="airlineBookingCard">
    <div class="airlineBrandStrip">
      <span class="airlineLogoWord">${escapeHtml(carrier.name)}</span>
      <small>${escapeHtml(f.label)}</small>
    </div>
    <div class="bookingReference">
      <span>Numero di riferimento prenotazione</span>
      <b>${escapeHtml(f.bookingCode||'—')}</b>
    </div>
    <div class="bookingFlightCore">
      <div class="bookingDateNo"><span>${escapeHtml(dateText)}</span><span>${escapeHtml(f.flightNo||'—')}</span></div>
      <div class="bookingRouteLine">
        <span class="bookingAirportCode">${escapeHtml(f.from?.iata||'—')}</span>
        <span class="bookingPlaneLine" aria-hidden="true">✈︎</span>
        <span class="bookingAirportCode">${escapeHtml(f.to?.iata||'—')}</span>
      </div>
      <div class="bookingAirportInfo">
        <div><b>${escapeHtml(fromName||'Partenza')}</b><span>${escapeHtml(f.date?fmtDate(f.date):'')}${f.time?` · ${escapeHtml(f.time)}`:''}</span></div>
        <div><b>${escapeHtml(toName||'Arrivo')}</b><span>${escapeHtml(f.arrivalDate?fmtDate(f.arrivalDate):(f.date?fmtDate(f.date):''))}${f.arrivalTime?` · ${escapeHtml(f.arrivalTime)}`:''}</span></div>
      </div>
      <div class="bookingTerminalRow">
        <div><b>Terminale</b><span>${escapeHtml(fromTerminal)}</span></div>
        <div><b>Terminale</b><span>${escapeHtml(toTerminal)}</span></div>
      </div>

      ${ci.open
        ?`<div class="checkinLiveCard">
            <b>🔴 Check-in disponibile</b>
            ${escapeHtml(ci.text)}
            <a target="_blank" rel="noopener" href="${carrier.url}">Apri ${escapeHtml(carrier.name)} per il check-in</a>
          </div>`
        :`<div class="checkinFutureCard"><b>Check-in</b>${escapeHtml(ci.text)}</div>`
      }

      <input id="${boardingInput}" type="file" accept="application/pdf,image/*" multiple hidden onchange="handleBoardingPassesUpload(this,'${t.id}','${leg}')">
      <button class="boardingUploadBox" ${ci.open?'':"disabled"} onclick="${ci.open?`$('${boardingInput}').click()`:'return false'}">
        ${ci.open?'Carica carte d’imbarco':'Carte d’imbarco disponibili dopo il check-in'}
      </button>
    </div>

    <button class="bookingPaxRow" onclick="toggleFlightPax()">
      <span class="paxIco">👥</span>
      <span><b>Passeggeri, posti e bagagli a mano</b><small>${escapeHtml(flightPassengerSummary(t))}</small></span>
      <span>⌄</span>
    </button>
    <div id="flightPaxDetail" class="bookingPaxDetail">${paxNames||'Nessun viaggiatore salvato.'}</div>
  </div>
  <button class="flightDetailEdit" onclick="showFlightEditForm('${leg}')">Modifica dati volo</button>
  <button class="flightBookingDelete" onclick="deleteFlightBooking('${leg}')">🗑️ Elimina prenotazione</button>`;
}

async function showFlightEditForm(leg){
  const t=currentTrip();if(!t)return;
  const f=legData(t,leg);
  const bookingDocs=await bookingDocsFor(t,leg);
  clearWalletAirlineTheme();
  $('pbody').innerHTML=`<button class="walletBack" onclick="openFlightWallet('${leg}')">← Torna al volo</button>${bookingSetupHtml(t,leg,f,bookingDocs,missingFlightCore(f))}`;
}

function clearBoardingObjectUrls(){
  while(WALLET_BOARDING_URLS.length){
    try{URL.revokeObjectURL(WALLET_BOARDING_URLS.pop())}catch(e){}
  }
}
async function hydrateBoardingSlides(docs){
  clearBoardingObjectUrls();
  for(const d of docs){
    const el=document.querySelector(`[data-boarding-preview="${CSS.escape(d.id)}"]`);
    if(!el||!d.blob)continue;
    if((d.mime||'').startsWith('image/')){
      const u=URL.createObjectURL(d.blob);WALLET_BOARDING_URLS.push(u);
      el.innerHTML=`<img src="${u}" alt="Carta d’imbarco">`;
    }else{
      el.innerHTML=`<div class="boardingPdf"><span class="pdfIcon">📄</span><b>PDF carta d’imbarco</b><p>${escapeHtml(d.name)}</p></div>`;
    }
  }
}

function boardingWalletHtml(t,leg,f,carrier,docs){
  const inputId=`boarding-more-${t.id}-${leg}`.replace(/[^a-zA-Z0-9_-]/g,'-');
  return `<div class="boardingWalletShell">
    <div class="boardingWalletTop">
      <span class="boardingWalletBrand">✈️</span>
      <span><b>${escapeHtml(f.from?.iata||'—')} → ${escapeHtml(f.to?.iata||'—')}</b><small>${escapeHtml(carrier.name)} · carte d’imbarco</small></span>
      <input id="${inputId}" type="file" accept="application/pdf,image/*" multiple hidden onchange="handleBoardingPassesUpload(this,'${t.id}','${leg}')">
      <button class="boardingWalletAdd" onclick="$('${inputId}').click()">+</button>
    </div>

    <div class="boardingSlides">
      ${docs.map((d,i)=>`<article class="boardingSlide">
        <div class="boardingSlideHead"><b>${escapeHtml(carrier.name)}</b><small>${i+1} / ${docs.length}</small></div>
        <div class="boardingSlideRoute"><span>${escapeHtml(f.from?.iata||'—')}</span><span class="plane">✈️</span><span>${escapeHtml(f.to?.iata||'—')}</span></div>
        <div class="boardingSlidePreview" data-boarding-preview="${escapeHtml(d.id)}"></div>
        <div class="boardingSlideActions">
          <button class="open" onclick="openSavedFlightDoc('${d.id}')">Apri</button>
          <button class="delete" onclick="deleteBoardingPass('${d.id}','${leg}')">Elimina</button>
        </div>
      </article>`).join('')}
    </div>
    <div class="boardingDots">Scorri lateralmente per vedere tutte le carte d’imbarco</div>
    <button class="flightBookingDelete" onclick="deleteFlightBooking('${leg}')">🗑️ Elimina prenotazione</button>
  </div>`;
}

async function openFlightWallet(leg){
  const t=currentTrip();if(!t)return;
  const f=legData(t,leg);
  const bookingDocs=await bookingDocsFor(t,leg);
  const boardingDocs=await boardingDocsFor(t,leg);
  const missing=missingFlightCore(f);
  const carrier=walletCarrierForFlight(f);
  setActive('Wallet');

  $('ptitle').textContent='Voli';
  $('ptext').textContent=`${f.from?.iata||'—'} → ${f.to?.iata||'—'}`;

  const bookingReady=missing.length===0;

  // A reservation that has been deleted or is incomplete must always return
  // to the upload/setup screen, even if boarding passes are still stored.
  if(!bookingReady){
    clearWalletAirlineTheme();
    $('pbody').innerHTML=`<button class="walletBack" onclick="renderWalletPanel()">← Torna a Voli</button>${bookingSetupHtml(t,leg,f,bookingDocs,missing)}`;
    go('panel');
    return;
  }

  if(boardingDocs.length){
    applyWalletAirlineTheme(carrier);
    $('pbody').innerHTML=`<button class="walletBack" onclick="renderWalletPanel()">← Torna a Voli</button>${boardingWalletHtml(t,leg,f,carrier,boardingDocs)}`;
    go('panel');
    setTimeout(()=>hydrateBoardingSlides(boardingDocs),40);
    return;
  }

  applyWalletAirlineTheme(carrier);
  $('pbody').innerHTML=`<button class="walletBack" onclick="renderWalletPanel()">← Torna a Voli</button>${bookingDetailHtml(t,leg,f,carrier,bookingDocs)}`;
  go('panel');
}
