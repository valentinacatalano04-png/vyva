(function(){
  'use strict';

  const VYVA_BOOKING_IMPORT_VERSION='vyva-booking-autoimport-v9-route-isolation';
  window.VYVA_BOOKING_IMPORT_VERSION=VYVA_BOOKING_IMPORT_VERSION;

  const uniq=a=>[...new Set((a||[]).filter(Boolean))];

  function ocrText(s){
    return String(s||'')
      .replace(/\u00a0/g,' ')
      .replace(/[‐‑‒–—]/g,'-')
      .replace(/[“”]/g,'"')
      .replace(/[’]/g,"'")
      .replace(/[ \t]+/g,' ')
      .replace(/\n{3,}/g,'\n\n');
  }

  function upperText(s){ return ocrText(s).toUpperCase(); }

  const CARRIER_CODES=[
    'U2','EZY','EJU','EZS','EC','DS','FR','RYR','BA','BAW','AZ','ITY','ITA',
    'LH','DLH','AF','AFR','KL','KLM','TK','THY','W4','W6','W9','WZZ','VY',
    'VLG','IB','IBE','EK','UAE','QR','QTR','LX','SWR','TP','TAP','SK','SAS',
    'AY','FIN','AA','AAL','DL','DAL','UA','UAL','SQ','SIA','TO','HV','LS',
    'EW','EWG','SN','OS','A3','PC','EI','EIN','DY','NOZ','AC','ACA'
  ].sort((a,b)=>b.length-a.length);

  function normalizeFlightNumber(raw){
    let s=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    const code=CARRIER_CODES.find(c=>s.startsWith(c));
    if(!code){
      const m=s.match(/^([A-Z]{2,3}|[A-Z][0-9]|[0-9][A-Z])(.+)$/);
      if(!m)return '';
      const tail=m[2].replace(/[OQ]/g,'0').replace(/[IL]/g,'1');
      return /^\d{1,4}[A-Z]?$/.test(tail)?m[1]+tail:'';
    }
    let tail=s.slice(code.length).replace(/[OQ]/g,'0').replace(/[IL]/g,'1');
    if(!/^\d{1,4}[A-Z]?$/.test(tail))return '';
    return code+tail;
  }

  function flightCandidates(text){
    const u=upperText(text), out=[];
    const push=(raw,index,score,labelled=false)=>{
      const value=normalizeFlightNumber(raw);
      if(!value)return;
      out.push({value,index:index||0,score,labelled});
    };

    const labels=[
      /\b(?:FLIGHT|VOLO)\s*(?:NUMBER|NO\.?|N[°ºO]?|NUMERO|NR\.?)?\s*[:#-]?\s*((?:[A-Z]{2,3}|[A-Z][0-9]|[0-9][A-Z])[\s-]*[0-9OQIL]{1,4}[A-Z]?)\b/g,
      /\b(?:NUMERO\s+(?:DEL\s+)?VOLO|N[°º]\s*VOLO)\s*[:#-]?\s*((?:[A-Z]{2,3}|[A-Z][0-9]|[0-9][A-Z])[\s-]*[0-9OQIL]{1,4}[A-Z]?)\b/g
    ];
    for(const rx of labels){
      for(const m of u.matchAll(rx))push(m[1],m.index,120,true);
    }

    const codeAlt=CARRIER_CODES.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
    const generic=new RegExp(`\\b((?:${codeAlt})[\\s-]*[0-9OQIL]{1,4}[A-Z]?)\\b`,'g');
    for(const m of u.matchAll(generic))push(m[1],m.index,70,false);

    const best=new Map();
    for(const c of out){
      const prev=best.get(c.value);
      if(!prev || c.score>prev.score)best.set(c.value,c);
    }
    return [...best.values()].sort((a,b)=>b.score-a.score||a.index-b.index);
  }

  function bookingCodeCandidates(text){
    const u=upperText(text),out=[];
    const labels=[
      /(?:BOOKING\s+(?:REFERENCE|REF\.?|CODE|NUMBER)|RESERVATION\s+(?:CODE|NUMBER|REFERENCE)|CONFIRMATION\s+(?:CODE|NUMBER)|PNR|RECORD\s+LOCATOR|LOCATOR)\s*[:#-]?\s*([A-Z0-9-]{4,12})\b/g,
      /(?:CODICE|NUMERO|RIFERIMENTO)(?:\s+DI|\s+DELLA)?\s+PRENOTAZIONE\s*[:#-]?\s*([A-Z0-9-]{4,12})\b/g,
      /(?:PRENOTAZIONE|BOOKING)\s*[:#-]\s*([A-Z0-9-]{4,12})\b/g
    ];
    const excluded=new Set(['NUMBER','REFERENCE','BOOKING','CODICE','NUMERO','CONFERMATA','CONFIRMED','FLIGHT','VOLO','TERMINAL']);
    for(const rx of labels){
      for(const m of u.matchAll(rx)){
        const v=String(m[1]||'').replace(/[^A-Z0-9-]/g,'');
        if(v.length>=4&&!excluded.has(v))out.push({value:v,index:m.index||0,score:110});
      }
    }
    return uniq(out.map(x=>x.value)).map(v=>out.find(x=>x.value===v));
  }

  function canonicalTerminal(raw,airport=null){
    let s=String(raw||'').toUpperCase()
      .replace(/[(){}\[\],.;]/g,' ')
      .replace(/[‐‑‒–—]/g,'-')
      .replace(/\s+/g,' ')
      .trim();

    const iata=String(airport?.iata||'').toUpperCase();
    const airportName=String(airport?.name||'').toUpperCase();

    if(/\bNORTH\b|\bNORD\b/.test(s))return 'North Terminal';
    if(/\bSOUTH\b|\bSUD\b/.test(s))return 'South Terminal';

    if(iata==='LGW'||airportName.includes('GATWICK')){
      if(/(?:^|\s)N(?:\s|$)/.test(s))return 'North Terminal';
      if(/(?:^|\s)S(?:\s|$)/.test(s))return 'South Terminal';
    }

    let m=s.match(/\b(?:TERMINAL(?:E)?|TERM\.?)(?:\s*[:#-]\s*|\s+)([0-9]{1,2}|[A-Z])\b/);
    if(m)return `Terminal ${m[1]}`;

    m=s.match(/\bT\s*[-:]?\s*([0-9]{1,2}|[A-Z])\b/);
    if(m)return `Terminal ${m[1]}`;

    m=s.match(/\b(?:ERMINALE|ERMINAL)(?:\s*[:#-]\s*|\s+)([0-9]{1,2}|[A-Z])\b/);
    if(m)return `Terminal ${m[1]}`;

    return '';
  }

  function terminalMentions(text){
    const u=upperText(text),out=[];
    const patterns=[
      /\b(?:NORTH|SOUTH|NORD|SUD)\s+TERMINAL\b/g,
      /\bTERMINAL(?:E)?\s+(?:NORTH|SOUTH|NORD|SUD)\b/g,
      /\b(?:TERMINAL(?:E)?|TERM\.?)(?:\s*[:#-]\s*|\s+)([0-9]{1,2}|[A-Z])\b/g,
      /\bT\s*[-:]?\s*([0-9]{1,2})\b/g,
      /\b(?:ERMINALE|ERMINAL)(?:\s*[:#-]\s*|\s+)([0-9]{1,2}|[A-Z])\b/g
    ];
    for(const rx of patterns){
      for(const m of u.matchAll(rx)){
        const value=canonicalTerminal(m[0]);
        if(value)out.push({value,index:m.index||0,raw:m[0]});
      }
    }
    const seen=new Set();
    return out.sort((a,b)=>a.index-b.index).filter(x=>{
      const k=x.value+'|'+x.index;
      if(seen.has(k))return false;
      seen.add(k);return true;
    });
  }

  function labelledTerminal(text,direction,airport=null){
    const u=upperText(text);
    const keys=direction==='departure'
      ?'(?:DEPARTURE|DEPARTING|PARTENZA|ORIGIN|ORIGINE|FROM|DA)'
      :'(?:ARRIVAL|ARRIVING|ARRIVO|DESTINATION|DESTINAZIONE|TO|A)';
    const terminal='(?:NORTH\\s+TERMINAL|SOUTH\\s+TERMINAL|NORD\\s+TERMINAL|SUD\\s+TERMINAL|TERMINAL(?:E)?\\s+(?:NORTH|SOUTH|NORD|SUD)|(?:TERMINAL(?:E)?|TERM\\.?)\\s*[:#-]?\\s*(?:[0-9]{1,2}|[A-Z])|T\\s*[-:]?\\s*[0-9]{1,2})';
    const r1=new RegExp(`${keys}[\\s\\S]{0,140}?(${terminal})`,'i');
    const r2=new RegExp(`(${terminal})[\\s\\S]{0,140}?${keys}`,'i');
    const m=u.match(r1)||u.match(r2);
    return m?canonicalTerminal(m[1],airport):'';
  }

  function airportSearchTokens(a){
    if(!a)return[];
    return uniq([
      String(a.iata||'').toUpperCase(),
      String(a.city||'').toUpperCase(),
      String(a.name||'').toUpperCase()
    ].filter(x=>x.length>=3));
  }

  function terminalCandidatesForAirport(text,airport){
    const u=upperText(text);
    const iata=String(airport?.iata||'').toUpperCase();
    const airportName=String(airport?.name||'').toUpperCase();
    const gatwick=iata==='LGW'||airportName.includes('GATWICK');
    const out=[];

    const add=(raw,index,type)=>{
      const value=canonicalTerminal(raw,airport);
      if(!value)return;
      if(gatwick && !/North Terminal|South Terminal/.test(value))return;
      out.push({value,index:index||0,len:String(raw||'').length,type});
    };

    const patterns=[
      [/\b(?:NORTH|SOUTH|NORD|SUD)\s+TERMINAL\b/g,'named'],
      [/\bTERMINAL(?:E)?\s+(?:NORTH|SOUTH|NORD|SUD)\b/g,'named'],
      [/\b(?:TERMINAL(?:E)?|TERM\.?)\s*[:#-]?\s*(?:[0-9]{1,2}|[A-Z])\b/g,'explicit'],
      [/\bT\s*[-:]?\s*[0-9]{1,2}\b/g,'compact'],
      [/\b(?:ERMINAL|ERMINALE)\s*[:#-]?\s*(?:[0-9]{1,2}|[A-Z])\b/g,'ocr']
    ];

    for(const [rx,type] of patterns){
      for(const m of u.matchAll(rx))add(m[0],m.index,type);
    }

    if(gatwick){
      for(const m of u.matchAll(/\b(NORTH|SOUTH|NORD|SUD)\b/g)){
        add(m[1],m.index,'gatwick-name');
      }
      for(const m of u.matchAll(/\bLGW\s*[-·|/]?\s*([NS])\b/g)){
        const value=m[1].toUpperCase()==='N'?'North Terminal':'South Terminal';
        out.push({value,index:(m.index||0)+m[0].length-1,len:1,type:'gatwick-short'});
      }
    }

    const seen=new Set();
    return out.filter(c=>{
      const k=`${c.value}|${c.index}`;
      if(seen.has(k))return false;
      seen.add(k);
      return true;
    });
  }

  function terminalCandidateFromAirportWindow(windowText,airport){
    const c=terminalCandidatesForAirport(windowText,airport);
    if(!c.length)return '';
    const gatwick=String(airport?.iata||'').toUpperCase()==='LGW'||
      String(airport?.name||'').toUpperCase().includes('GATWICK');

    return [...c].sort((a,b)=>{
      if(gatwick){
        const pa=/North Terminal|South Terminal/.test(a.value)?0:1;
        const pb=/North Terminal|South Terminal/.test(b.value)?0:1;
        if(pa!==pb)return pa-pb;
      }
      return a.index-b.index;
    })[0].value;
  }

  function nearestTerminalToAirport(text,airport){
    const u=upperText(text);
    if(!airport)return '';

    const tokens=airportSearchTokens(airport);
    const anchors=[];
    for(const tok of tokens){
      let start=0,idx;
      while((idx=u.indexOf(tok,start))>=0){
        anchors.push({idx,len:tok.length,token:tok});
        start=idx+tok.length;
      }
    }
    if(!anchors.length)return '';

    const candidates=terminalCandidatesForAirport(u,airport);
    if(!candidates.length)return '';

    const gatwick=String(airport?.iata||'').toUpperCase()==='LGW'||
      String(airport?.name||'').toUpperCase().includes('GATWICK');

    let best=null;
    for(const a of anchors){
      const aEnd=a.idx+a.len;
      const lineStart=u.lastIndexOf('\n',a.idx)+1;
      let lineEnd=u.indexOf('\n',a.idx);
      if(lineEnd<0)lineEnd=u.length;

      for(const c of candidates){
        const cEnd=c.index+c.len;
        const after=c.index>=aEnd;
        const rawGap=after ? c.index-aEnd : a.idx-cEnd;
        if(rawGap < -10)continue;
        if(rawGap>450)continue;

        let score=Math.max(0,rawGap);

        // In booking layouts the terminal is usually printed after the airport.
        if(!after)score+=32;

        // Strong preference for terminal on the same OCR line as the airport.
        if(c.index>=lineStart && c.index<=lineEnd)score-=18;

        // Gatwick uses named North/South terminals. Ignore numbered candidates.
        if(gatwick){
          if(/North Terminal|South Terminal/.test(c.value))score-=80;
          else score+=500;
        }

        // Prefer explicit "Terminal 2" / "T2" over a distant generic mention.
        if(c.type==='explicit'||c.type==='compact'||c.type==='named')score-=8;
        if(c.type==='gatwick-name'||c.type==='gatwick-short')score-=25;

        if(!best || score<best.score){
          best={value:c.value,score,anchor:a,candidate:c};
        }
      }
    }
    return best?.value||'';
  }

  function routeTerminalPair(text,fromAirport,toAirport){
    return safeRouteTerminals(text,fromAirport,toAirport);
  }

  // Never assign by distance alone: in two-column rows both airports are
  // followed by both terminals. Position/order must be retained.
  function safeRouteTerminals(text,fromAirport,toAirport){
    const rows=upperText(text).split('\n').map(x=>x.trim()).filter(Boolean);
    const from=String(fromAirport?.iata||'').toUpperCase();
    const to=String(toAirport?.iata||'').toUpperCase();
    const empty={departure:'',arrival:''};
    if(!from||!to||from===to)return empty;
    const contains=(s,token)=>new RegExp('\\b'+token+'\\b').test(s);
    const terms=s=>{
      const all=terminalMentions(s).sort((a,b)=>a.index-b.index);
      return all.filter((x,i)=>!all.slice(0,i).some(y=>x.index<y.index+y.raw.length));
    };
    // Horizontal ticket layout: route left -> right, terminal row left -> right.
    const route=rows.findIndex(r=>contains(r,from)&&contains(r,to)&&r.indexOf(from)<r.indexOf(to));
    if(route>=0){
      for(let i=route;i<Math.min(rows.length,route+16);i++){
        if(/CHECK.?IN|BAGAGL|BAGGAGE|NAVETTA|SHUTTLE/.test(rows[i]))break;
        const candidates=terms(rows[i]);
        if(candidates.length===2)return{departure:candidates[0].value,arrival:candidates[1].value};
      }
      // Explicit airport blocks are handled below. Two values on different
      // lines without an airport anchor are not enough to infer column order.
    }
    const anchors=rows.map((r,i)=>({i,from:contains(r,from),to:contains(r,to)}));
    const a=anchors.find(x=>x.from&&!x.to);
    const b=anchors.find(x=>x.to&&!x.from&&(!a||x.i>a.i));
    if(a&&b){
      const inBlock=(start,end)=>{
        const values=[];
        for(let i=start;i<end;i++){
          if(/CHECK.?IN|BAGAGL|BAGGAGE|NAVETTA|SHUTTLE/.test(rows[i]))break;
          values.push(...terms(rows[i]).map(x=>x.value));
        }
        const unique=uniq(values);return unique.length===1?unique[0]:'';
      };
      return{departure:inBlock(a.i,b.i),arrival:inBlock(b.i,Math.min(rows.length,b.i+8))};
    }
    // Direction labels only match their own line, never a distant 'A' or 'DA'.
    const explicit=direction=>{
      const label=direction==='departure'?/\b(DEPARTURE|PARTENZA)\b/:/\b(ARRIVAL|ARRIVO)\b/;
      const values=uniq(rows.filter(r=>label.test(r)).flatMap(r=>terms(r).map(x=>x.value)));
      return values.length===1?values[0]:'';
    };
    return{departure:explicit('departure'),arrival:explicit('arrival')};
  }

  function legacyRouteTerminalPair(text,fromAirport,toAirport){
    const u=upperText(text);
    if(!fromAirport||!toAirport)return{departure:'',arrival:''};

    const from=nearestTerminalToAirport(u,fromAirport);
    const to=nearestTerminalToAirport(u,toAirport);
    if(from||to)return{departure:from,arrival:to};

    const fromTokens=airportSearchTokens(fromAirport);
    const toTokens=airportSearchTokens(toAirport);
    let bestSegment='';

    for(const a of fromTokens){
      const ai=u.indexOf(a);
      if(ai<0)continue;
      for(const b of toTokens){
        const bi=u.indexOf(b);
        if(bi<0)continue;
        const lo=Math.max(0,Math.min(ai,bi)-80);
        const hi=Math.min(u.length,Math.max(ai+a.length,bi+b.length)+160);
        if(!bestSegment || hi-lo<bestSegment.length)bestSegment=u.slice(lo,hi);
      }
    }

    if(!bestSegment)return{departure:'',arrival:''};

    const dep=terminalCandidateFromAirportWindow(
      bestSegment.slice(0,Math.max(1,Math.floor(bestSegment.length*0.6))),
      fromAirport
    );
    const arr=terminalCandidateFromAirportWindow(
      bestSegment.slice(Math.floor(bestSegment.length*0.35)),
      toAirport
    );
    return{departure:dep,arrival:arr};
  }

  function expectedLeg(t,leg){
    if(!t)return{from:null,to:null,date:''};
    if(leg==='return')return{
      from:t.returnFrom||t.to||null,
      to:t.returnTo||t.from||null,
      date:t.returnFlightDepartDate||t.end||''
    };
    return{
      from:t.from||null,
      to:t.to||null,
      date:t.flightDepartDate||t.start||''
    };
  }

  function dateVariants(iso){
    if(!iso)return[];
    const m=String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!m)return[];
    const [,y,mo,d]=m;
    return [`${d}/${mo}/${y}`,`${d}-${mo}-${y}`,`${d}.${mo}.${y}`,`${d}/${mo}/${y.slice(2)}`];
  }

  function selectLegWindow(text,t,leg){
    const u=upperText(text),e=expectedLeg(t,leg);
    const from=String(e.from?.iata||'').toUpperCase(),to=String(e.to?.iata||'').toUpperCase();
    const flights=flightCandidates(u).sort((a,b)=>a.index-b.index);
    if(!flights.length)return '';
    const expected=normalizeFlightNumber(leg==='return'?t?.returnFlightNo:t?.flightNo);
    const blocks=flights.map((f,i)=>({f,text:u.slice(f.index,flights[i+1]?.index??u.length)}));
    const routeOK=block=>{
      if(!from||!to)return false;
      const a=block.search(new RegExp('\\b'+from+'\\b'));
      const b=block.search(new RegExp('\\b'+to+'\\b'));
      return a>=0&&b>a;
    };
    const matching=blocks.filter(b=>routeOK(b.text));
    if(matching.length===1)return matching[0].text;
    if(expected){const exact=matching.filter(b=>b.f.value===expected);if(exact.length===1)return exact[0].text;}
    // A single screenshot without route labels can match an already-known
    // flight number, but never import the first of multiple unrelated flights.
    if(blocks.length===1&&expected===blocks[0].f.value){
      const reverse=from&&to&&u.indexOf(to)>=0&&u.indexOf(from)>u.indexOf(to);
      if(!reverse)return blocks[0].text;
    }
    return '';
  }

  function legacySelectLegWindow(text,t,leg){
    const u=upperText(text),e=expectedLeg(t,leg);
    const from=String(e.from?.iata||'').toUpperCase();
    const to=String(e.to?.iata||'').toUpperCase();
    if(!from||!to)return text;

    const fi=[],ti=[];
    let p=0;
    while((p=u.indexOf(from,p))>=0){fi.push(p);p+=from.length}
    p=0;
    while((p=u.indexOf(to,p))>=0){ti.push(p);p+=to.length}
    if(!fi.length||!ti.length)return text;

    let best=null;
    for(const a of fi){
      for(const b of ti){
        const lo=Math.min(a,b),hi=Math.max(a,b),gap=hi-lo;
        if(gap>5000)continue;
        let score=5000-gap;
        const sample=u.slice(Math.max(0,lo-700),Math.min(u.length,hi+1300));
        if(dateVariants(e.date).some(v=>sample.includes(v)))score+=2500;
        if(!best||score>best.score)best={lo,hi,score};
      }
    }
    if(!best)return text;
    return text.slice(Math.max(0,best.lo-900),Math.min(text.length,best.hi+1600));
  }

  function labelledGate(text){
    const u=upperText(text);
    const m=u.match(/\b(?:GATE|PORTA|IMBARCO|BOARDING\s+GATE)\s*[:#-]?\s*([A-Z]?[0-9]{1,3}[A-Z]?)\b/);
    return m?m[1]:'';
  }

  function parseBookingV4(text,t,leg){
    const full=ocrText(text);
    const segment=selectLegWindow(full,t,leg);
    let flights=flightCandidates(segment);

    let codes=bookingCodeCandidates(segment);
    if(!codes.length){
      // A unique booking reference above the first flight is shared by its legs.
      const first=flightCandidates(full).sort((a,b)=>a.index-b.index)[0];
      const header=first?full.slice(0,first.index):'';
      const shared=bookingCodeCandidates(header);
      if(shared.length===1)codes=shared;
    }

    const e=expectedLeg(t,leg);
    const paired=routeTerminalPair(segment,e.from,e.to);
    const departureTerminal=paired.departure,arrivalTerminal=paired.arrival;
    const gate=labelledGate(segment);

    return {
      flightNo:flights.map(x=>x.value),
      bookingCode:codes.map(x=>x.value),
      departureTerminal:departureTerminal?[departureTerminal]:[],
      arrivalTerminal:arrivalTerminal?[arrivalTerminal]:[],
      gate:gate?[gate]:[],
      _bestFlight:flights[0]?.value||'',
      _bestBooking:codes.length===1?codes[0].value:'',
      _segment:segment,
      _full:full
    };
  }

  window.parseBookingText=function(text){
    return parseBookingV4(text,typeof currentTrip==='function'?currentTrip():null,null);
  };

  function weakRead(parsed){
    return !parsed._bestFlight || !parsed._bestBooking ||
      (!parsed.departureTerminal.length && !parsed.arrivalTerminal.length);
  }

  function contrastCanvas(source){
    const c=document.createElement('canvas');
    c.width=source.width;c.height=source.height;
    const ctx=c.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(source,0,0);
    const img=ctx.getImageData(0,0,c.width,c.height),d=img.data;
    for(let i=0;i<d.length;i+=4){
      const g=Math.round(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);
      const v=g<175?0:g>235?255:Math.round((g-175)/60*255);
      d[i]=d[i+1]=d[i+2]=v;
    }
    ctx.putImageData(img,0,0);
    return c;
  }

  async function persistExtraction(t,leg,parsed,form){
    if(!t||!parsed)return{saved:false,trip:t};
    const trips=typeof safeTrips==='function'?safeTrips():[];
    const idx=trips.findIndex(x=>String(x.id)===String(t.id));
    if(idx<0)return{saved:false,trip:t};
    const target=trips[idx];

    const prop=leg==='return'
      ?{
          flightNo:'returnFlightNo',bookingCode:'returnBookingCode',
          depTerminal:'returnDepartureTerminal',arrTerminal:'returnArrivalTerminal'
        }
      :{
          flightNo:'flightNo',bookingCode:'bookingCode',
          depTerminal:'departureTerminal',arrTerminal:'arrivalTerminal'
        };

    const incoming={
      flightNo:parsed._bestFlight||'',
      bookingCode:parsed._bestBooking||'',
      depTerminal:parsed.departureTerminal[0]||'',
      arrTerminal:parsed.arrivalTerminal[0]||''
    };

    const conflicts=[];
    const fill=(key,val)=>{
      if(!val)return false;
      const old=String(target[key]||'').trim();
      if(old){if(old!==val)conflicts.push(key);return false;}
      target[key]=val;return true;
    };

    let changed=false;
    changed=fill(prop.flightNo,incoming.flightNo)||changed;
    changed=fill(prop.bookingCode,incoming.bookingCode)||changed;
    changed=fill(prop.depTerminal,incoming.depTerminal)||changed;
    changed=fill(prop.arrTerminal,incoming.arrTerminal)||changed;

    if(changed)localStorage.setItem(STORE,JSON.stringify(trips));

    const setField=(id,val)=>{
      const el=form?.querySelector('#'+id)||document.getElementById(id);
      if(el&&val&&!String(el.value||'').trim())el.value=val;
    };
    setField('walletFlightNoInput',incoming.flightNo);
    setField('walletBookingCodeInput',incoming.bookingCode);
    setField('walletDepartureTerminalInput',incoming.depTerminal);
    setField('walletArrivalTerminalInput',incoming.arrTerminal);

    if(parsed.gate[0] && typeof safeFlightOps==='function'){
      const all=safeFlightOps();
      const key=`${t.id}|${leg}`;
      const old=all[key]||{};
      if(!old.gate){
        all[key]={...old,gate:parsed.gate[0],updatedAt:new Date().toISOString()};
        if(!all[key].terminal&&incoming.depTerminal)all[key].terminal=incoming.depTerminal;
        localStorage.setItem(FLIGHT_OPS_STORE,JSON.stringify(all));
      }
    }

    return{saved:changed,trip:trips[idx],conflicts};
  }

  function renderImportReview(form,parsed,errors=[]){
    const review=form?.querySelector('#bookingReadReview');
    if(!review)return;
    review.replaceChildren();

    const values=[
      ['Numero volo',parsed._bestFlight],
      ['Codice prenotazione',parsed._bestBooking],
      ['Terminale partenza',parsed.departureTerminal[0]],
      ['Terminale arrivo',parsed.arrivalTerminal[0]],
      ['Gate',parsed.gate[0]]
    ].filter(x=>x[1]);

    if(values.length){
      const box=document.createElement('div');
      box.style.cssText='margin:10px 0;padding:12px;border-radius:14px;background:#eaf7ef;color:#17683c;font-size:12px;line-height:1.55';
      const title=document.createElement('b');title.textContent='✓ Dati letti e inseriti automaticamente';
      box.appendChild(title);
      for(const [k,v] of values){
        const row=document.createElement('div');
        row.textContent=`${k}: ${v}`;
        box.appendChild(row);
      }
      review.appendChild(box);
    }

    if(parsed.flightNo.length>1){
      const p=document.createElement('div');
      p.style.cssText='font-size:11px;color:#6b7486;margin:8px 0';
      p.textContent='Il documento contiene più numeri volo: VYVA ha scelto quello più coerente con questa tratta.';
      review.appendChild(p);
    }

    if(errors.length){
      const p=document.createElement('div');
      p.style.cssText='font-size:11px;color:#8a5d08;margin:8px 0';
      p.textContent=errors.join(' ');
      review.appendChild(p);
    }

    const details=document.createElement('details');
    const summary=document.createElement('summary');
    const pre=document.createElement('pre');
    summary.textContent='Mostra il testo letto';
    pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto;font-size:12px';
    pre.textContent=parsed._full||'Nessun testo leggibile.';
    details.append(summary,pre);
    review.appendChild(details);
  }

  async function createOCRWorker(form,state){
    const lib=await loadBookingOCR();
    const logger=m=>{
      if(form?.isConnected&&!state.expired&&m.status==='recognizing text'){
        bookingReadStatus('Lettura prenotazione: '+Math.round((m.progress||0)*100)+'%…');
      }
    };
    try{
      return await lib.createWorker('eng+ita',1,{logger});
    }catch(e){
      return await lib.createWorker('eng',1,{logger});
    }
  }

  window.readBookingFiles=async function(files,form,errors=[],legOverride=null){
    if(!files?.length){
      bookingReadStatus(errors.join(' ')||'Nessun allegato da leggere.');
      return null;
    }

    const t=typeof currentTrip==='function'?currentTrip():null;
    const leg=legOverride||form?.dataset?.leg||'outbound';
    const state={expired:false},texts=[];
    let worker=null,pdf=null,timer=null;

    const ensureWorker=async()=>{
      if(!worker)worker=await createOCRWorker(form,state);
      return worker;
    };

    const ocr=async canvas=>{
      if(state.expired||!form?.isConnected)throw new Error('Lettura interrotta.');
      const w=await ensureWorker();
      return (await w.recognize(canvas)).data.text||'';
    };

    const imageToCanvas=async file=>{
      const url=URL.createObjectURL(file);
      try{
        const img=new Image();
        img.src=url;
        await img.decode();
        const maxDim=Math.max(img.naturalWidth,img.naturalHeight);
        const scale=Math.min(2.4,Math.max(1,3200/Math.max(1,maxDim)));
        const c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(img.naturalWidth*scale));
        c.height=Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx=c.getContext('2d');
        ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
        ctx.drawImage(img,0,0,c.width,c.height);
        return c;
      }finally{
        URL.revokeObjectURL(url);
      }
    };

    const run=async()=>{
      for(const file of files){
        if(state.expired||!form?.isConnected)break;
        try{
          const isPdf=file.type==='application/pdf'||/\.pdf$/i.test(file.name);
          if(isPdf){
            const lib=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.min.mjs');
            lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs';
            pdf=await lib.getDocument({data:await file.arrayBuffer(),isEvalSupported:false}).promise;
            const count=Math.min(pdf.numPages,10);
            if(pdf.numPages>count)errors.push('PDF: lette le prime 10 pagine.');

            for(let pageNo=1;pageNo<=count;pageNo++){
              if(state.expired||!form?.isConnected)break;
              const page=await pdf.getPage(pageNo);
              const content=await page.getTextContent();
              const pageText=content.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('');
              texts.push(pageText);

              let parsed=parseBookingV4(texts.join('\n\n'),t,leg);
              if(weakRead(parsed)){
                const natural=page.getViewport({scale:1});
                const scale=Math.min(2.4,3000/Math.max(natural.width,natural.height));
                const viewport=page.getViewport({scale});
                const c=document.createElement('canvas');
                c.width=Math.ceil(viewport.width);c.height=Math.ceil(viewport.height);
                try{
                  await page.render({canvasContext:c.getContext('2d'),viewport}).promise;
                  const first=await ocr(c);
                  texts.push(first);
                  parsed=parseBookingV4(texts.join('\n\n'),t,leg);
                  if(weakRead(parsed)){
                    const hi=contrastCanvas(c);
                    try{texts.push(await ocr(hi));}finally{hi.width=hi.height=0}
                  }
                }finally{
                  c.width=c.height=0;
                }
              }
              page.cleanup();
            }
            await pdf.destroy();pdf=null;
          }else{
            const c=await imageToCanvas(file);
            try{
              const first=await ocr(c);
              texts.push(first);
              let parsed=parseBookingV4(texts.join('\n\n'),t,leg);
              if(weakRead(parsed)){
                const hi=contrastCanvas(c);
                try{texts.push(await ocr(hi));}finally{hi.width=hi.height=0}
              }
            }finally{
              c.width=c.height=0;
            }
          }
        }catch(e){
          if(!state.expired)errors.push(`${file.name}: alcuni dati potrebbero non essere leggibili.`);
        }
      }
      return texts.join('\n\n');
    };

    try{
      const text=await Promise.race([
        run(),
        new Promise((_,reject)=>{
          timer=setTimeout(()=>{
            state.expired=true;
            reject(new Error('Lettura troppo lunga. Riprova con un singolo screenshot più nitido.'));
          },150000);
        })
      ]);

      if(!form?.isConnected||state.expired)return null;

      const parsed=parseBookingV4(text,t,leg);
      const result=await persistExtraction(t,leg,parsed,form);
      renderImportReview(form,parsed,errors);

      const latest=typeof currentTrip==='function'?currentTrip():t;
      const f=latest&&typeof legData==='function'?legData(latest,leg):null;
      const coreReady=f && String(f.flightNo||'').trim() && String(f.bookingCode||'').trim();

      const foundCount=[
        parsed._bestFlight,parsed._bestBooking,
        parsed.departureTerminal[0],parsed.arrivalTerminal[0],parsed.gate[0]
      ].filter(Boolean).length;

      const conflict=result.conflicts?.length>0;
      bookingReadStatus(conflict
        ? 'I dati letti differiscono da quelli già salvati: confronta il riepilogo sotto e correggi i campi prima di salvare. I dati precedenti non sono stati sovrascritti.'
        : !parsed._segment
          ? 'Non riesco ad associare con certezza questo documento alla tratta aperta. Nessun terminale è stato importato da altri voli.'
          : foundCount
            ? `Lettura completata: ${foundCount} dati riconosciuti. ${result.saved?'Nuovi dati salvati.':'I dati coincidono con quelli già presenti.'} Controlla i campi mancanti.`
            : 'Non ho riconosciuto dati con sufficiente certezza. Puoi correggere i campi manualmente.');

      if(coreReady&&!conflict&&parsed._segment&&parsed.departureTerminal.length&&parsed.arrivalTerminal.length){
        setTimeout(()=>{
          const ct=typeof currentTrip==='function'?currentTrip():null;
          if(ct&&String(ct.id)===String(t.id)&&form?.isConnected&&typeof openFlightWallet==='function')openFlightWallet(leg);
        },650);
      }
      return parsed;
    }catch(e){
      if(form?.isConnected)bookingReadStatus(e.message+' Gli allegati già salvati restano nel Wallet.');
      return null;
    }finally{
      clearTimeout(timer);
      state.expired=true;
      if(worker)await worker.terminate().catch(()=>{});
      if(pdf)await pdf.destroy().catch(()=>{});
    }
  };

  window.rereadBookingFiles=async function(leg,button){
    const t=typeof currentTrip==='function'?currentTrip():null;
    if(!t)return;
    const form=button.closest('.flightSetupCard');
    if(!form)return;
    form.dataset.leg=leg;
    form.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);
    bookingReadStatus('Rilettura automatica degli allegati…');
    try{
      const docs=await bookingDocsFor(t,leg);
      const files=docs.map(d=>new File([d.blob],d.name,{type:d.mime}));
      await window.readBookingFiles(files,form,[],leg);
    }catch(e){
      bookingReadStatus('Non riesco a rileggere gli allegati. Puoi correggere i dati manualmente.');
    }finally{
      if(form?.isConnected)form.querySelectorAll('button,input,select').forEach(el=>el.disabled=false);
    }
  };

  window.handleBookingFilesUpload=async function(input,tripId,leg){
    const files=[...(input.files||[])];
    if(!files.length)return;
    const form=input.closest('.flightSetupCard');
    if(form)form.dataset.leg=leg;
    const errors=[],saved=[];
    form?.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);
    bookingReadStatus('Salvo gli allegati e leggo automaticamente la prenotazione…');

    try{
      for(let i=0;i<files.length;i++){
        const file=files[i];
        if(file.size>18*1024*1024){
          errors.push(`${file.name}: supera 18 MB.`);
          continue;
        }
        if(!/^image\//.test(file.type)&&file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name)){
          errors.push(`${file.name}: formato non supportato. Usa PNG, JPEG o PDF.`);
          continue;
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
        saved.forEach(file=>{
          const row=document.createElement('p');
          row.textContent='✓ Allegato salvato: '+file.name;
          list?.append(row);
        });
        await window.readBookingFiles(saved,form,errors,leg);
      }
    }catch(e){
      bookingReadStatus('Non riesco a salvare o leggere tutti gli allegati. I campi restano modificabili manualmente.');
    }finally{
      if(form?.isConnected)form.querySelectorAll('button,input,select').forEach(el=>el.disabled=false);
    }
  };

  // Aggiorna il testo del form mantenendo tutte le funzioni già presenti.
  const oldBookingSetupHtml=window.bookingSetupHtml;
  if(typeof oldBookingSetupHtml==='function'){
    window.bookingSetupHtml=function(t,leg,f,bookingDocs,missing){
      let html=oldBookingSetupHtml(t,leg,f,bookingDocs,missing);
      html=html.replace(
        /Scegli tu: inserisci i dati manualmente oppure carica uno screenshot o PDF per leggere numero volo e codice prenotazione\. Controlla sempre i risultati prima di salvare\./,
        'Carica uno screenshot o PDF: VYVA legge automaticamente numero volo, codice prenotazione, terminali e gate e salva i dati nella tratta corretta. Puoi sempre correggere i campi manualmente.'
      );
      html=html.replace(
        'La lettura avviene sul dispositivo. Serve internet per scaricare il lettore al primo utilizzo. Gli allegati restano in questo browser.',
        'La lettura avviene sul dispositivo. VYVA usa anche aeroporti e tratta già salvati per distinguere andata e ritorno. Gli allegati restano in questo browser.'
      );
      return html.replace('<div class="flightSetupCard">',`<div class="flightSetupCard" data-leg="${leg}">`);
    };
  }

  console.info('[VYVA] Booking auto-import v8 visible-delete attivo');
})();
