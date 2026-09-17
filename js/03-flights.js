const FLIGHT_OPS_STORE='vyvaFlightOpsV1';

function safeFlightOps(){
  try{return JSON.parse(localStorage.getItem(FLIGHT_OPS_STORE)||'{}')}catch(e){return{}}
}
function saveFlightOpsData(tripId,leg){
  const all=safeFlightOps();
  const key=`${tripId}|${leg}`;
  all[key]={
    terminal:($('flightTerminalInput')?.value||'').trim(),
    gate:($('flightGateInput')?.value||'').trim(),
    updatedAt:new Date().toISOString()
  };
  localStorage.setItem(FLIGHT_OPS_STORE,JSON.stringify(all));
  alert('Terminal e gate salvati nel volo.');
  openFlightWallet(leg);
}
function getFlightOpsData(tripId,leg){
  return safeFlightOps()[`${tripId}|${leg}`]||{terminal:'',gate:''};
}
function storedLegDateTime(date,time){
  if(!date)return null;
  const d=new Date(`${date}T${time||'00:00'}:00`);
  return isNaN(d)?null:d;
}
function activeFlightLeg(t){
  if(!t)return'outbound';
  if(!(t.returnFrom&&t.returnTo))return'outbound';
  const outboundArrival=storedLegDateTime(
    t.flightArrivalDate||t.flightDepartDate,
    t.arrivalTime||t.departTime
  );
  if(outboundArrival && new Date()>=outboundArrival)return'return';
  return'outbound';
}
function activeFlightData(t){
  const leg=activeFlightLeg(t);
  return {leg,data:legData(t,leg)};
}
function openCurrentFlightWallet(){
  const t=currentTrip();if(!t)return;
  openFlightWallet(activeFlightLeg(t));
}
function renderActiveFlightCard(t,forcedLeg=null){
  if(!t||t.transport!=='Volo')return;
  const leg=forcedLeg||activeFlightLeg(t),f=legData(t,leg);
  if(!f?.from||!f?.to)return;

  $('fcode').textContent=f.from?.iata||'—';
  $('tcode').textContent=f.to?.iata||'—';
  $('fromCity').textContent=f.from?`${f.from.city||''} ${f.from.name||''}`.trim():'Partenza';
  $('toCity').textContent=f.to?`${f.to.city||''} ${f.to.name||''}`.trim():'Arrivo';
  $('departOnly').textContent=f.time||'';
  $('arrivalOnly').textContent=f.arrivalTime||'';
  $('flightDateCenter').textContent=f.date
    ?new Intl.DateTimeFormat('it-IT',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(new Date(f.date+'T12:00:00'))
    :'';

  const chip=$('flightStatusChip');
  if(chip)chip.textContent=leg==='return'?'Volo di ritorno':'Volo di andata';
}

const VYVA_DOC_DB='vyvaFlightDocumentsDB';
const VYVA_DOC_STORE='flightDocs';

function openVyvaDocsDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(VYVA_DOC_DB,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(VYVA_DOC_STORE)){
        db.createObjectStore(VYVA_DOC_STORE,{keyPath:'id'});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function getAllFlightDocs(){
  const db=await openVyvaDocsDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(VYVA_DOC_STORE,'readonly');
    const req=tx.objectStore(VYVA_DOC_STORE).getAll();
    req.onsuccess=()=>resolve(req.result||[]);
    req.onerror=()=>reject(req.error);
  });
}
async function getFlightDoc(id){
  const db=await openVyvaDocsDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(VYVA_DOC_STORE,'readonly');
    const req=tx.objectStore(VYVA_DOC_STORE).get(id);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error);
  });
}
async function putFlightDoc(record){
  const db=await openVyvaDocsDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(VYVA_DOC_STORE,'readwrite');
    tx.objectStore(VYVA_DOC_STORE).put(record);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
}
async function removeFlightDoc(id){
  const db=await openVyvaDocsDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(VYVA_DOC_STORE,'readwrite');
    tx.objectStore(VYVA_DOC_STORE).delete(id);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
}
function docKey(tripId,leg,travelerKey,type){
  return `${tripId}|${leg}|${travelerKey}|${type}`;
}
function flightTravelers(t){
  const people=Array.isArray(t?.travelers)?t.travelers:[];
  if(people.length){
    return people.map((p,i)=>({
      key:`traveler-${i}`,
      name:(typeof p==='string'?p:p?.name)||`Viaggiatore ${i+1}`,
      type:(typeof p==='object'&&p?.type)||'Viaggiatore'
    }));
  }
  const out=[];
  for(let i=0;i<(t?.adults||0);i++)out.push({key:`adult-${i}`,name:`Adulto ${i+1}`,type:'Adulto'});
  for(let i=0;i<(t?.teens||0);i++)out.push({key:`teen-${i}`,name:`Ragazzo ${i+1}`,type:'Ragazzo'});
  for(let i=0;i<(t?.children||0);i++)out.push({key:`child-${i}`,name:`Bambino ${i+1}`,type:'Bambino'});
  for(let i=0;i<(t?.infants||0);i++)out.push({key:`infant-${i}`,name:`Neonato ${i+1}`,type:'Neonato'});
  return out;
}
function legData(t,leg){
  if(leg==='return'){
    return {
      label:'Volo di ritorno',
      from:t.returnFrom,to:t.returnTo,
      date:t.returnFlightDepartDate,time:t.returnDepartTime,
      arrivalDate:t.returnFlightArrivalDate,arrivalTime:t.returnArrivalTime,
      flightNo:t.returnFlightNo,bookingCode:t.returnBookingCode,
      departureTerminal:t.returnDepartureTerminal,arrivalTerminal:t.returnArrivalTerminal,
      walletCarrier:t.returnWalletCarrier,
      duration:t.returnDuration
    };
  }
  return {
    label:'Volo di andata',
    from:t.from,to:t.to,
    date:t.flightDepartDate,time:t.departTime,
    arrivalDate:t.flightArrivalDate,arrivalTime:t.arrivalTime,
    flightNo:t.flightNo,bookingCode:t.bookingCode,
    departureTerminal:t.departureTerminal,arrivalTerminal:t.arrivalTerminal,
    walletCarrier:t.walletCarrier,
    duration:t.duration
  };
}
function flightCarrierInfo(no=''){
  const n=String(no).toUpperCase().replace(/\s+/g,'');
  if(n.startsWith('U2')||n.startsWith('EZY'))return{name:'easyJet',url:'https://www.easyjet.com/en/manage-bookings'};
  if(n.startsWith('FR')||n.startsWith('RYR'))return{name:'Ryanair',url:'https://www.ryanair.com/'};
  if(n.startsWith('W6')||n.startsWith('W4'))return{name:'Wizz Air',url:'https://wizzair.com/'};
  if(n.startsWith('BA'))return{name:'British Airways',url:'https://www.britishairways.com/travel/managebooking/public/en_gb'};
  if(n.startsWith('VY'))return{name:'Vueling',url:'https://www.vueling.com/'};
  if(n.startsWith('AZ'))return{name:'ITA Airways',url:'https://www.ita-airways.com/'};
  if(n.startsWith('LH'))return{name:'Lufthansa',url:'https://www.lufthansa.com/'};
  if(n.startsWith('AF'))return{name:'Air France',url:'https://www.airfrance.com/'};
  if(n.startsWith('KL'))return{name:'KLM',url:'https://www.klm.com/'};
  if(n.startsWith('EK'))return{name:'Emirates',url:'https://www.emirates.com/'};
  if(n.startsWith('QR'))return{name:'Qatar Airways',url:'https://www.qatarairways.com/'};
  return{name:'Compagnia aerea',url:'https://www.google.com/search?q='+encodeURIComponent((no||'volo')+' compagnia aerea check-in')};
}
function departureDateTime(leg){
  if(!leg?.date)return null;
  const time=leg.time||'00:00';
  const d=new Date(`${leg.date}T${time}:00`);
  return isNaN(d)?null:d;
}
function checkInReminder(leg){
  const dep=departureDateTime(leg);
  if(!dep)return{title:'Check-in',text:'Inserisci data e ora del volo per vedere il promemoria.'};
  const now=new Date();
  const diff=(dep-now)/3600000;
  if(diff<0)return{title:'Volo già partito',text:'Conserva qui carta d’imbarco e documenti del viaggio.'};
  if(diff<=24)return{title:'⚠️ Check-in: controlla ora',text:`Il volo parte tra circa ${Math.max(1,Math.round(diff))} ore. Apri la compagnia aerea e verifica il check-in.`};
  const reminder=new Date(dep.getTime()-24*3600000);
  return{
    title:'Promemoria check-in',
    text:`VYVA te lo segnalerà nell’app dal ${new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short'}).format(reminder)} alle ${String(reminder.getHours()).padStart(2,'0')}:${String(reminder.getMinutes()).padStart(2,'0')}.`
  };
}
async function handleFlightDocUpload(input,tripId,leg,travelerKey,type){
  const file=input.files?.[0];
  if(!file)return;
  if(file.size>18*1024*1024){
    alert('Per ora carica un file sotto 18 MB.');
    input.value='';
    return;
  }
  const rec={
    id:docKey(tripId,leg,travelerKey,type),
    tripId:String(tripId),leg,travelerKey,type,
    name:file.name,mime:file.type||'application/octet-stream',
    blob:file,updatedAt:new Date().toISOString()
  };
  try{
    await putFlightDoc(rec);
    await openFlightWallet(leg);
    const ct=currentTrip(); if(ct)updateTripFlightLifecycle(ct);
  }catch(e){
    alert('Non riesco a salvare questo documento sul dispositivo.');
  }
}
// Booking import v3: OCR stays local; extracted fields are untrusted drafts.
function bookingReadStatus(message){
  const el=$('bookingReadStatus');if(el)el.textContent=message;
}
let bookingOCRLoader;
function loadBookingOCR(){
  if(window.Tesseract)return Promise.resolve(window.Tesseract);
  if(!bookingOCRLoader)bookingOCRLoader=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    const timer=setTimeout(()=>{script.remove();reject(new Error('Lettore non disponibile: controlla internet.'));},30000);
    script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
    script.onload=()=>{clearTimeout(timer);resolve(window.Tesseract);};
    script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Impossibile scaricare il lettore.'));};
    document.head.append(script);
  }).catch(e=>{bookingOCRLoader=null;throw e;});
  return bookingOCRLoader;
}
function parseBookingText(text){
  const upper=String(text).toUpperCase().replace(/\r/g,'');
  // Known carrier prefixes reduce false positives from dates and prices.
  const flights=[...upper.matchAll(/\b((?:U2|EZY|FR|RYR|BA|BAW|AZ|ITA|LH|DLH|AF|AFR|KL|KLM|TK|THY|W4|W6|W9|WZZ|VY|VLG|IB|IBE|EK|UAE|QR|QTR|LX|SWR|TP|TAP|SK|SAS|AY|FIN|AA|AAL|DL|DAL|UA|UAL|SQ|SIA|TO|HV|LS|EW|SN|OS|A3|PC)[ \t]*[0-9]{1,4}[A-Z]?)\b/g)].map(m=>m[1].replace(/\s/g,''));
  const labeledFlight=/\b(?:FLIGHT(?:\s+(?:NUMBER|NO\.?))?|(?:NUMERO\s+)?VOLO)\s*[:#-]?\s*((?:[A-Z]{2,3}|[A-Z][0-9]|[0-9][A-Z])[ \t]*[0-9]{1,4}[A-Z]?)\b/g;
  for(const match of upper.matchAll(labeledFlight))flights.push(match[1].replace(/\s/g,''));
  for(const match of upper.matchAll(/\b((?:EJU|EZS|EC|DS)[ \t]*[0-9]{1,4})\b/g))flights.push(match[1].replace(/\s/g,''));
  const codes=[];
  const label=/(?:BOOKING\s+(?:REFERENCE|REF\.?|CODE|NUMBER)|RESERVATION\s+(?:CODE|NUMBER|REFERENCE)|CONFIRMATION\s+(?:CODE|NUMBER)|(?:CODICE|NUMERO|RIFERIMENTO)(?:\s+DI|\s+DELLA)?\s+PRENOTAZIONE|PNR|RECORD\s+LOCATOR)\s*[:#-]?\s*([A-Z0-9-]{4,12})\b/g;
  const excluded=new Set(['NUMBER','REFERENCE','BOOKING','CODICE','NUMERO','CONFERMATA','CONFIRMED']);
  for(const match of upper.matchAll(label))if(!excluded.has(match[1]))codes.push(match[1]);
  return {flightNo:[...new Set(flights)],bookingCode:[...new Set(codes)]};
}
async function readBookingFiles(files,form,errors=[]){
  if(!files.length){bookingReadStatus(errors.join(' ')||'Nessun allegato da leggere.');return;}
  let worker=null,pdf=null,expired=false,timer;
  const ensureWorker=async()=>{
    if(!worker){
      const lib=await loadBookingOCR();
      const w=await lib.createWorker('eng',1,{logger:m=>{
        if(form.isConnected&&!expired&&m.status==='recognizing text')bookingReadStatus('Lettura immagine: '+Math.round(m.progress*100)+'%…');
      }});
      if(expired){await w.terminate();throw new Error('Tempo di lettura scaduto.');}
      worker=w;
    }
    return worker;
  };
  const ocr=async image=>{
    if(expired||!form.isConnected)throw new Error('Lettura interrotta.');
    const w=await ensureWorker();
    return (await w.recognize(image)).data.text;
  };
  const run=async()=>{
    const texts=[];
    for(const file of files){
      if(expired||!form.isConnected)break;
      try{
        if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
          const lib=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.min.mjs');
          lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs';
          pdf=await lib.getDocument({data:await file.arrayBuffer(),isEvalSupported:false}).promise;
          if(expired){await pdf.destroy();pdf=null;break;}
          const count=Math.min(pdf.numPages,8);
          if(pdf.numPages>count)errors.push('PDF: lette solo le prime 8 pagine.');
          for(let pageNo=1;pageNo<=count;pageNo++){
            if(expired||!form.isConnected)break;
            const page=await pdf.getPage(pageNo);
            const content=await page.getTextContent();
            const text=content.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('');
            texts.push(text);
            const found=parseBookingText(text);
            if(!found.flightNo.length||!found.bookingCode.length){
              const natural=page.getViewport({scale:1});
              const viewport=page.getViewport({scale:Math.min(2,2200/Math.max(natural.width,natural.height))});
              const canvas=document.createElement('canvas');
              canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
              try{
                await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
                texts.push(await ocr(canvas));
              }finally{canvas.width=canvas.height=0;}
            }
            page.cleanup();
          }
          await pdf.destroy();pdf=null;
        }else{
          const url=URL.createObjectURL(file);
          try{
            const img=new Image();img.src=url;await img.decode();
            const scale=Math.min(2,2400/Math.max(img.naturalWidth,img.naturalHeight));
            const canvas=document.createElement('canvas');
            canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
            try{
              const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
              texts.push(await ocr(canvas));
            }finally{canvas.width=canvas.height=0;}
          }finally{URL.revokeObjectURL(url);}
        }
      }catch(e){if(!expired)errors.push(file.name+': lettura non riuscita; puoi compilare a mano.');}
    }
    return texts.join('\n\n');
  };
  try{
    const text=await Promise.race([run(),new Promise((_,reject)=>{
      timer=setTimeout(()=>{expired=true;reject(new Error('Lettura troppo lunga. Riprova con una singola immagine più nitida oppure inserisci i dati a mano.'));},120000);
    })]);
    if(!form.isConnected||expired)return;
    const values=parseBookingText(text);
    // A two-column screenshot may lose ordering during OCR. Let the user
    // assign terminal candidates to departure/arrival rather than guessing.
    const terminals=[...new Set((text.match(/\b(?:T[1-9][0-9]?|(?:North|South|Nord|Sud)\s+Terminal|Terminal(?:e)?\s+[1-9][0-9]?)\b/gi)||[]).map(v=>v.trim()))];
    values.departureTerminal=terminals;values.arrivalTerminal=terminals;
    const review=form.querySelector('#bookingReadReview');review.replaceChildren();
    let found=0;
    for(const [key,id,label] of [['flightNo','walletFlightNoInput','Numero volo'],['bookingCode','walletBookingCodeInput','Codice prenotazione'],['departureTerminal','walletDepartureTerminalInput','Terminale di partenza'],['arrivalTerminal','walletArrivalTerminalInput','Terminale di arrivo']]){
      const field=form.querySelector('#'+id),options=values[key];
      if(!options.length)continue;
      found++;
      // Never overwrite manual input. Multiple candidates require a choice.
      if(!field)continue;
      if(!key.endsWith('Terminal')&&options.length===1&&!field.value.trim())field.value=options[0];
      const row=document.createElement('label');row.style.display='block';row.textContent=label+' rilevato: ';
      const select=document.createElement('select');select.setAttribute('aria-label',label+' rilevato');
      select.append(new Option('Scegli / verifica',''));
      options.forEach(v=>select.append(new Option(v,v)));
      select.onchange=()=>{if(select.value)field.value=select.value;};
      row.append(select);review.append(row);
    }
    const details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');
    summary.textContent='Mostra il testo letto';pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto;font-size:12px';
    pre.textContent=text||'Nessun testo leggibile.';details.append(summary,pre);review.append(details);
    bookingReadStatus((found?'Lettura terminata. Controlla i dati proposti per questo volo, completa quelli mancanti e premi Salva dati.':'Non ho riconosciuto i dati con certezza. Gli allegati sono conservati: compila i campi manualmente.')+' '+errors.join(' '));
  }catch(e){if(form.isConnected)bookingReadStatus(e.message+' Gli allegati già salvati restano nel Wallet.');}
  finally{
    clearTimeout(timer);expired=true;
    if(worker)await worker.terminate().catch(()=>{});
    if(pdf)await pdf.destroy().catch(()=>{});
  }
}
async function rereadBookingFiles(leg,button){
  const t=currentTrip();if(!t)return;
  const form=button.closest('.flightSetupCard');
  form.querySelectorAll('button,input').forEach(el=>el.disabled=true);
  bookingReadStatus('Lettura allegati in corso…');
  try{
    const docs=await bookingDocsFor(t,leg);
    const files=docs.map(d=>new File([d.blob],d.name,{type:d.mime}));
    await readBookingFiles(files,form);
  }catch(e){bookingReadStatus('Non riesco a leggere gli allegati. Puoi inserire i dati manualmente.');}
  finally{form.querySelectorAll('button,input').forEach(el=>el.disabled=false);}
}

async function handleBookingFilesUpload(input,tripId,leg){
  const files=[...(input.files||[])];
  if(!files.length)return;
  try{
    for(let i=0;i<files.length;i++){
      const file=files[i];
      if(file.size>18*1024*1024)continue;
      const unique=`${Date.now()}-${i}-${Math.random().toString(36).slice(2,8)}`;
      await putFlightDoc({
        id:`${tripId}|${leg}|booking|booking|${unique}`,
        tripId:String(tripId),leg,travelerKey:'booking',type:'booking',
        name:file.name,mime:file.type||'application/octet-stream',
        blob:file,updatedAt:new Date().toISOString()
      });
    }
    input.value='';
    await openFlightWallet(leg);
  }catch(e){
    alert('Non riesco a salvare uno o più documenti sul dispositivo.');
  }
}
let activeDocPreviewUrl=null;
async function openSavedFlightDoc(id){
  const rec=await getFlightDoc(id);
  if(!rec?.blob)return;
  if(activeDocPreviewUrl)URL.revokeObjectURL(activeDocPreviewUrl);
  activeDocPreviewUrl=URL.createObjectURL(rec.blob);
  $('docPreviewTitle').textContent=rec.name||'Documento';
  const body=$('docPreviewBody');
  const mime=rec.mime||'';
  if(mime.startsWith('image/')){
    body.innerHTML=`<img src="${activeDocPreviewUrl}" alt="Documento">`;
  }else if(mime==='application/pdf'||String(rec.name||'').toLowerCase().endsWith('.pdf')){
    body.innerHTML=`<iframe src="${activeDocPreviewUrl}"></iframe>`;
  }else{
    body.innerHTML='<div class="walletEmpty">Anteprima non disponibile per questo tipo di file. Usa “Apri file”.</div>';
  }
  $('docPreviewOpenExternal').href=activeDocPreviewUrl;
  $('docPreviewOverlay').classList.remove('hide');
}
function closeDocPreview(){
  $('docPreviewOverlay')?.classList.add('hide');
  $('docPreviewBody').innerHTML='';
  if(activeDocPreviewUrl){URL.revokeObjectURL(activeDocPreviewUrl);activeDocPreviewUrl=null}
}
async function deleteSavedFlightDoc(id,leg){
  if(!confirm('Eliminare questo documento dal Wallet?'))return;
  await removeFlightDoc(id);
  await openFlightWallet(leg);
  const ct=currentTrip(); if(ct)updateTripFlightLifecycle(ct);
}
function docSlotHtml(doc,tripId,leg,travelerKey,type,label,icon){
  const id=docKey(tripId,leg,travelerKey,type);
  if(doc){
    return `<div class="docSlot">
      <span class="docSlotIcon">${icon}</span>
      <span><b>${escapeHtml(label)}</b><small>${escapeHtml(doc.name)}</small></span>
      <span class="docSlotActions">
        <button onclick="openSavedFlightDoc('${id}')">Apri</button>
        <button class="danger" onclick="deleteSavedFlightDoc('${id}','${leg}')">×</button>
      </span>
    </div>`;
  }
  const inputId=`upload-${tripId}-${leg}-${travelerKey}-${type}`.replace(/[^a-zA-Z0-9_-]/g,'-');
  return `<div class="docSlot">
    <span class="docSlotIcon">${icon}</span>
    <span><b>${escapeHtml(label)}</b><small>PDF, immagine o screenshot</small></span>
    <span>
      <input id="${inputId}" type="file" accept="application/pdf,image/*" hidden onchange="handleFlightDocUpload(this,'${tripId}','${leg}','${travelerKey}','${type}')">
      <button onclick="$('${inputId}').click()">Carica</button>
    </span>
  </div>`;
}
async function openFlightWallet(leg){
  const t=currentTrip();if(!t)return;
  const f=legData(t,leg);
  const carrier=flightCarrierInfo(f.flightNo);
  const reminder=checkInReminder(f);
  const docs=await getAllFlightDocs();
  const byId={};docs.filter(d=>String(d.tripId)===String(t.id)&&d.leg===leg).forEach(d=>byId[d.id]=d);
  const travelers=flightTravelers(t);
  $('ptitle').textContent=leg==='return'?'Volo di ritorno':'Volo di andata';
  $('ptext').textContent='Biglietti, carte d’imbarco e documenti per ogni viaggiatore.';
  const bookingDocs=docs.filter(d=>String(d.tripId)===String(t.id)&&d.leg===leg&&d.travelerKey==='booking'&&d.type==='booking');
  const generalInput=`upload-${t.id}-${leg}-booking`.replace(/[^a-zA-Z0-9_-]/g,'-');
  const travelerHtml=travelers.map((p,i)=>{
    const initial=escapeHtml((p.name||'?').trim().charAt(0).toUpperCase()||'?');
    const ticket=byId[docKey(t.id,leg,p.key,'ticket')];
    const boarding=byId[docKey(t.id,leg,p.key,'boarding')];
    return `<div class="travelerDocCard">
      <div class="travelerDocHead"><span class="travelerAvatar">${initial}</span><span><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.type)}</small></span></div>
      ${docSlotHtml(ticket,t.id,leg,p.key,'ticket','Biglietto / documento di viaggio','🎫')}
      ${docSlotHtml(boarding,t.id,leg,p.key,'boarding','Carta d’imbarco','📱')}
    </div>`;
  }).join('');
  $('pbody').innerHTML=`<button class="walletBack" onclick="renderWalletPanel()">← Torna al Wallet</button>
    <div class="flightDetailHero">
      <small>${escapeHtml(f.label)}</small>
      <h2>${escapeHtml(f.from?.iata||'—')} → ${escapeHtml(f.to?.iata||'—')}</h2>
      <p>${escapeHtml(f.flightNo||'Numero volo non inserito')} · prenotazione ${escapeHtml(f.bookingCode||'—')}</p>
      <div class="flightDetailMeta">
        ${f.date?`<span>${escapeHtml(fmtDate(f.date))}</span>`:''}
        ${f.time?`<span>Partenza ${escapeHtml(f.time)}</span>`:''}
        ${f.arrivalTime?`<span>Arrivo ${escapeHtml(f.arrivalTime)}</span>`:''}
        ${f.duration&&f.duration!=='—'?`<span>${escapeHtml(f.duration)}</span>`:''}
      </div>
    </div>
    <div class="checkinCard">
      <strong>${escapeHtml(reminder.title)}</strong>
      ${escapeHtml(reminder.text)}
      <div class="checkinActions">
        <a target="_blank" rel="noopener" href="${carrier.url}">Apri ${escapeHtml(carrier.name)}</a>
      </div>
    </div>
    <div class="generalBookingCard">
      <b>Conferma prenotazione</b>
      <small>Puoi caricare uno o più screenshot, immagini o PDF della prenotazione.</small>
      <div class="bookingFilesList">
        ${bookingDocs.length
          ? bookingDocs.map(d=>`<div class="docSlot"><span class="docSlotIcon">📄</span><span><b>Documento prenotazione</b><small>${escapeHtml(d.name)}</small></span><span class="docSlotActions"><button onclick="openSavedFlightDoc('${d.id}')">Apri</button><button class="danger" onclick="deleteSavedFlightDoc('${d.id}','${leg}')">×</button></span></div>`).join('')
          : '<div class="walletEmpty">Nessun file di prenotazione caricato.</div>'
        }
      </div>
      <input id="${generalInput}" type="file" accept="application/pdf,image/*" multiple hidden onchange="handleBookingFilesUpload(this,'${t.id}','${leg}')">
      <button class="addBookingFileBtn" onclick="$('${generalInput}').click()">+ Aggiungi file prenotazione</button>
    </div>
    <div class="walletSectionTitle">VIAGGIATORI</div>
    ${travelerHtml||'<div class="card muted">Nessun viaggiatore salvato per questo viaggio.</div>'}
    <p class="walletInfoNote">I documenti caricati in questa versione vengono conservati sul dispositivo/browser che stai usando. Il download automatico della carta d’imbarco dalla compagnia aerea richiederà una futura integrazione autorizzata con il servizio della compagnia.</p>`;
  go('panel');
}
