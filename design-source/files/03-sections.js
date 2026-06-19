// sections.jsx — Header, UrgencyBanner, Hero (3 variants), ShowCard, Schedule
const { useState: useStateS, useEffect: useEffectS } = React;

// ── Header with language switcher ─────────────────────────────────────────────
function Header({ lang, setLang, compact, onBuy }) {
  const t = STR[lang];
  const langs = [['kz','KZ'],['ru','RU'],['ug','UG']];
  const nav = [['schedule',t.nav_schedule],['faq',t.nav_faq]];
  return (
    <header style={{ position:'sticky', top:0, zIndex:40, background:'rgba(250,246,240,.86)',
      backdropFilter:'blur(14px)', borderBottom:'1px solid var(--line)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:compact?10:20,
        padding: compact?'10px 16px':'14px 40px', maxWidth:1200, margin:'0 auto' }}>
        {/* logo */}
        <a href="#top" style={{ display:'flex', alignItems:'center', gap:10, flex:'none' }}>
          <span style={{ width:compact?32:38, height:compact?32:38, borderRadius:9, background:'var(--garnet)',
            color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flex:'none' }}>
            <Pomegranate size={compact?17:20}/>
          </span>
          <span style={{ minWidth:0, whiteSpace:'nowrap' }}>
            <div className="ut-serif" style={{ fontWeight:700, fontSize:compact?14:16, lineHeight:1.05 }}>{t.theaterName.split(' ').length>1 ? <>{t.theaterName.split(' ').slice(0,-1).join(' ')} <em className="ut-em">{t.theaterName.split(' ').slice(-1)}</em></> : <em className="ut-em">{t.theaterName}</em>}</div>
            {!compact && <div style={{ fontSize:10.5, color:'var(--inkSoft)', letterSpacing:'.02em', marginTop:1 }}>Almaty · 1921</div>}
          </span>
        </a>

        {!compact && (
          <nav style={{ display:'flex', gap:26, marginInlineStart:18 }}>
            {nav.map(([k,label])=>(
              <a key={k} href={`#${k}`} style={{ fontSize:13.5, fontWeight:500, color:'var(--inkSoft)' }}
                 onMouseEnter={e=>e.target.style.color='var(--garnet)'} onMouseLeave={e=>e.target.style.color='var(--inkSoft)'}>{label}</a>
            ))}
          </nav>
        )}

        <div style={{ marginInlineStart:'auto', display:'flex', alignItems:'center', gap:compact?8:14 }}>
          {/* lang switcher */}
          <div style={{ display:'flex', background:'#fff', border:'1px solid var(--line)', borderRadius:9, padding:2 }}>
            {langs.map(([code,label])=>(
              <button key={code} onClick={()=>setLang(code)} style={{
                padding: compact?'5px 8px':'5px 10px', fontSize:12, fontWeight:600, borderRadius:7,
                color: lang===code?'#fff':'var(--inkSoft)', background: lang===code?'var(--garnet)':'transparent',
              }}>{label}</button>
            ))}
          </div>
          {!compact && (
            <button onClick={onBuy} className="ut-cta" style={{ padding:'9px 18px', fontSize:14 }}>{t.buy}</button>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Urgency banner (top strip variant) ───────────────────────────────────────
function UrgencyBanner({ show, lang }) {
  const t = STR[lang];
  const left = show.capacity - show.sold;
  const d = daysUntil(show.date);
  const msg = left < show.capacity*0.3
    ? `${t.minLeftBanner} — ${left} ${t.seatsLeftShort}`
    : `${t.premiereIn} ${dayWord(d,lang)}`;
  return (
    <div style={{ background:'var(--garnetDk)', color:'#fff' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'8px 16px', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontSize:12.5, fontWeight:500 }}>
        <span className="ut-dot"></span>
        <span>{msg}</span>
      </div>
    </div>
  );
}
function dayWord(n, lang) {
  const t = STR[lang];
  if (n<=0) return t.soon;
  if (lang==='ru') {
    const mod10=n%10, mod100=n%100;
    let w=t.days;
    if (mod10===1 && mod100!==11) w=t.day1;
    else if (mod10>=2&&mod10<=4&&!(mod100>=12&&mod100<=14)) w=t.day24;
    return `${n} ${w}`;
  }
  return `${n} ${t.days}`;
}

// ── Countdown (for urgency='counter') ────────────────────────────────────────
function Countdown({ show, lang, light }) {
  const d = daysUntil(show.date);
  const t = STR[lang];
  const col = light ? 'rgba(255,255,255,.9)' : 'var(--ink)';
  const sub = light ? 'rgba(255,255,255,.6)' : 'var(--inkSoft)';
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
      <div style={{ textAlign:'center' }}>
        <div className="ut-serif" style={{ fontSize:30, fontWeight:700, lineHeight:1, color:col, fontVariantNumeric:'tabular-nums' }}>{d}</div>
        <div style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:sub, marginTop:3 }}>{t.days}</div>
      </div>
      <div style={{ fontSize:12.5, color:sub, maxWidth:120, lineHeight:1.3 }}>{t.premiereIn.replace(/[—-]/g,'')} </div>
    </div>
  );
}

// ── Scarcity meter ───────────────────────────────────────────────────────────
function Scarcity({ show, lang, light }) {
  const left = show.capacity - show.sold;
  const pct = Math.round((left/show.capacity)*100);
  if (pct >= 30) return null;
  const t = STR[lang];
  const trackBg = light ? 'rgba(255,255,255,.2)' : '#e7ddce';
  const txt = light ? '#fff' : 'var(--garnet)';
  return (
    <div style={{ maxWidth:260 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600, color:txt, marginBottom:5 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
          <span className="ut-dot" style={{ background:txt }}></span>{left} {t.seatsLeftShort}
        </span>
        <span style={{ opacity:.8 }}>{t.almostSold}</span>
      </div>
      <div style={{ height:6, borderRadius:4, background:trackBg, overflow:'hidden' }}>
        <div style={{ width:`${100-pct}%`, height:'100%', background:'linear-gradient(90deg,var(--ember),var(--garnet))', borderRadius:4 }}></div>
      </div>
    </div>
  );
}

// ── HERO (3 layout variants) ─────────────────────────────────────────────────
function Hero({ show, lang, compact, layout, urgency, onBuy }) {
  const t = STR[lang];
  const d = showDate(show.date, lang);
  const dur = `${Math.floor(show.durationMin/60)} ${t.hours} ${show.durationMin%60? (show.durationMin%60)+' '+t.minutes:''}`.trim();

  const Meta = ({light}) => (
    <div style={{ display:'flex', flexWrap:'wrap', gap: compact?'10px 16px':'14px 26px', alignItems:'center' }}>
      <MetaItem icon="cal" label={`${d.wd}, ${d.day} ${d.mon}`} sub={show.time} light={light}/>
      <MetaItem icon="clock" label={dur} sub={t.withIntermission} light={light}/>
      <MetaItem icon="tag" label={STR[lang][show.genreKey]} light={light}/>
    </div>
  );

  const PriceCta = ({light}) => (
    <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
      <button onClick={onBuy} className="ut-cta" style={{ padding: compact?'15px 26px':'17px 34px', fontSize: compact?16:17, borderRadius:14 }}>
        <TicketIcon/> {t.buy}
      </button>
      <div>
        <div style={{ fontSize:11, color: light?'rgba(255,255,255,.65)':'var(--inkSoft)', fontWeight:500 }}>{t.buyFrom}</div>
        <div className="ut-serif" style={{ fontSize: compact?24:28, fontWeight:700, color: light?'#fff':'var(--ink)', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
          {fmtPrice(show.priceFrom, lang)}
        </div>
      </div>
    </div>
  );

  const Eyebrow = ({light}) => (
    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
      <span className="ut-eyebrow" style={{ display:'inline-flex', alignItems:'center', gap:7, color: light?'var(--goldSoft)':'var(--garnet)' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor' }}></span>{t.premiere}
      </span>
      {urgency==='inline' && <InlineUrgency show={show} lang={lang} light={light}/>}
    </div>
  );

  // ---- FULL-BLEED VIDEO HERO (editorial, default) ----
  if (layout==='full') {
    const d2 = showDate(show.date, lang);
    return (
      <section id="top" style={{ position:'relative', minHeight: compact?'92vh':'88vh', display:'flex', alignItems:'flex-end',
        background:'var(--night)', overflow:'hidden' }}>
        {/* video placeholder */}
        <div className="ut-video" style={{ position:'absolute', inset:0 }}>
          <div className="ut-video-label"><PlayIcon/>{t.videoLabel}</div>
        </div>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(20,14,10,.45) 0%, rgba(20,14,10,.35) 40%, rgba(20,14,10,.9) 100%)' }}></div>

        <div style={{ position:'relative', zIndex:2, padding: compact?'90px 22px 34px':'0 56px 60px', maxWidth:1180, margin:'0 auto', width:'100%' }}>
          <div style={{ display:'flex', flexDirection: compact?'column':'row', gap: compact?22:48, alignItems: compact?'stretch':'flex-end', justifyContent:'space-between' }}>
            {/* text */}
            <div style={{ display:'flex', flexDirection:'column', gap: compact?16:20, maxWidth:560 }}>
              <Eyebrow light/>
              <h1 className="ut-serif" style={{ fontSize: compact?'clamp(44px,15vw,66px)':'clamp(60px,6.6vw,96px)', color:'#fff' }}>
                <em className="ut-em">{show.titles[lang]}</em>
              </h1>
              <p style={{ fontSize: compact?15.5:18, color:'rgba(255,255,255,.82)', maxWidth:480, lineHeight:1.45 }}>{show.taglines[lang]}</p>
              <Meta light/>
              {urgency!=='inline' && <Scarcity show={show} lang={lang} light/>}
              <PriceCta light/>
            </div>

            {/* playbill poster card */}
            {!compact && (
              <div style={{ flex:'none', width:268 }}>
                <div className="ut-card" style={{ background:'#fff', padding:10, borderRadius:14, boxShadow:'0 30px 60px -24px rgba(0,0,0,.65)' }}>
                  <div className="ut-ph" style={{ aspectRatio:'3/4', borderRadius:8, position:'relative' }}>
                    <div className="ut-ph-label"><CamIcon/>{t.poster_label}</div>
                    <div style={{ position:'absolute', top:10, insetInlineStart:10, background:'var(--garnet)', color:'#fff',
                      fontSize:10, fontWeight:700, letterSpacing:'.1em', padding:'5px 9px', borderRadius:6, textTransform:'uppercase' }}>{t.premiere}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 8px 6px' }}>
                    <div>
                      <div className="ut-serif" style={{ fontWeight:700, fontSize:17 }}>{show.titles[lang]}</div>
                      <div style={{ fontSize:12, color:'var(--inkSoft)' }}>{d2.wd}, {d2.day} {d2.mon} · {show.time}</div>
                    </div>
                    <div className="ut-bignum" style={{ fontSize:34, color:'var(--garnet)', opacity:.9 }}>★</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ---- SPLIT (default) & POSTER-LEFT ----
  const posterFirst = layout==='posterLeft';
  const Poster = (
    <div style={{ flex: compact?'none':(posterFirst?'0 0 46%':'0 0 50%'), position:'relative', minHeight: compact?340:undefined }}>
      <div className="ut-ph" style={{ position:'absolute', inset:0, borderRadius: compact?16:20 }}>
        <div className="ut-ph-label"><CamIcon/>{t.poster_label}</div>
      </div>
    </div>
  );
  const Content = (
    <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap: compact?16:22,
      padding: compact?'4px 0 0':'10px 0' }}>
      {!compact && <Eyebrow/>}
      <h1 className="ut-serif" style={{ fontSize: compact?'clamp(38px,11vw,52px)':'clamp(48px,4.4vw,72px)' }}>{show.titles[lang]}</h1>
      <p style={{ fontSize: compact?15:18, color:'var(--inkSoft)', maxWidth:480, lineHeight:1.5 }}>{show.taglines[lang]}</p>
      <div className="ut-rule"></div>
      <Meta/>
      {urgency==='counter' ? <Countdown show={show} lang={lang}/> : (urgency!=='inline' && <Scarcity show={show} lang={lang}/>)}
      <PriceCta/>
    </div>
  );
  return (
    <section id="top" style={{ background:'var(--paper)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding: compact?'18px 16px 26px':'48px 40px 56px',
        display:'flex', flexDirection: compact?'column':(posterFirst?'row':'row-reverse'), gap: compact?18:48, alignItems:'stretch' }}>
        {compact && <Eyebrow/>}
        {Poster}
        {Content}
      </div>
    </section>
  );
}

function InlineUrgency({ show, lang, light }) {
  const left = show.capacity - show.sold;
  if (left >= show.capacity*0.3) return null;
  const t = STR[lang];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12, fontWeight:600,
      background: light?'rgba(156,47,42,.9)':'rgba(156,47,42,.1)', color: light?'#fff':'var(--garnet)',
      padding:'5px 11px', borderRadius:20 }}>
      <span className="ut-dot" style={{ background: light?'#fff':'var(--garnet)' }}></span>
      {left} {t.seatsLeftShort}
    </span>
  );
}

function MetaItem({ icon, label, sub, light }) {
  const c = light ? 'rgba(255,255,255,.92)' : 'var(--ink)';
  const sc = light ? 'rgba(255,255,255,.6)' : 'var(--inkSoft)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
      <span style={{ color: light?'var(--goldSoft)':'var(--garnet)', flex:'none' }}>{ICONS[icon]}</span>
      <div>
        <div style={{ fontSize:13.5, fontWeight:600, color:c, lineHeight:1.15 }}>{label}</div>
        {sub && <div style={{ fontSize:11.5, color:sc }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── SHOW CARD + monthly schedule ─────────────────────────────────────────────
function ShowCard({ show, lang, compact, onBuy, index }) {
  const t = STR[lang];
  const d = showDate(show.date, lang);
  const left = show.capacity - show.sold;
  const scarce = left < show.capacity*0.3;
  const numeral = String(index).padStart(2,'0');
  return (
    <div className="ut-card ut-card-int" style={{ display:'flex', flexDirection:'column', position:'relative' }}>
      {/* editorial numeral / premiere flag */}
      <div style={{ position:'absolute', top:10, insetInlineEnd:14, zIndex:3 }}>
        {show.featured
          ? <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--garnet)', color:'#fff', fontSize:10.5, fontWeight:700, letterSpacing:'.08em', padding:'5px 9px', borderRadius:7, textTransform:'uppercase' }}>★ {t.premiere}</span>
          : <span className="ut-cardnum" style={{ fontSize: compact?40:48 }}>{numeral}</span>}
      </div>
      <div className="ut-ph" style={{ aspectRatio: compact?'16/10':'3/2', position:'relative' }}>
        <div className="ut-ph-label"><CamIcon/>{t.poster_label}</div>
        {/* date chip */}
        <div style={{ position:'absolute', top:12, insetInlineStart:12, background:'rgba(250,246,240,.95)', borderRadius:10,
          padding:'6px 9px', textAlign:'center', minWidth:46, backdropFilter:'blur(4px)' }}>
          <div className="ut-serif" style={{ fontSize:19, fontWeight:700, lineHeight:1 }}>{d.day}</div>
          <div style={{ fontSize:10, color:'var(--inkSoft)', textTransform:'uppercase', letterSpacing:'.06em' }}>{d.mon.slice(0,3)}</div>
        </div>
        {scarce && (
          <div style={{ position:'absolute', bottom:12, insetInlineStart:12, background:'var(--garnet)', color:'#fff',
            fontSize:11, fontWeight:700, padding:'5px 9px', borderRadius:8, display:'flex', alignItems:'center', gap:5 }}>
            <span className="ut-dot"></span>{left} {t.seatsLeftShort}
          </div>
        )}
      </div>
      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10, flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11.5, color:'var(--inkSoft)', fontWeight:500 }}>
          <span style={{ color:'var(--garnet)', fontWeight:600 }}>{STR[lang][show.genreKey]}</span>
          <span>·</span><span>{d.wd}, {show.time}</span>
        </div>
        <h3 className="ut-serif" style={{ fontSize:21, fontWeight:700 }}>{show.titles[lang]}</h3>
        <p style={{ fontSize:13, color:'var(--inkSoft)', lineHeight:1.45, flex:1 }}>{show.taglines[lang]}</p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginTop:2 }}>
          <div>
            <div style={{ fontSize:10.5, color:'var(--inkSoft)' }}>{t.buyFrom}</div>
            <div className="ut-serif" style={{ fontSize:19, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{fmtPrice(show.priceFrom,lang)}</div>
          </div>
          <button onClick={()=>onBuy(show)} className="ut-cta" style={{ padding:'11px 18px', fontSize:14 }}><TicketIcon/> {t.buy}</button>
        </div>
      </div>
    </div>
  );
}

function Schedule({ lang, compact, onBuy }) {
  const t = STR[lang];
  const shows = SHOWS;
  // numbering: featured shows ★, others numbered 01,02,03…
  let n = 0;
  const withIndex = shows.map(s => ({ s, index: s.featured ? 0 : ++n }));
  return (
    <section id="schedule" style={{ background:'var(--paper2)', padding: compact?'44px 0':'76px 0' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding: compact?'0 16px':'0 40px' }}>
        <SectionHead lang={lang} eyebrow={t.nav_schedule} title={t.edPlaybill} sub={t.scheduleSub} compact={compact}
          action={!compact && <button onClick={()=>onBuy(shows[0])} className="ut-cta" style={{ padding:'12px 22px', fontSize:14.5 }}><TicketIcon/> {t.buy}</button>}/>
        {compact ? (
          <div className="ut-scroll" style={{ display:'flex', gap:14, overflowX:'auto', paddingBottom:8, margin:'0 -16px', padding:'4px 16px 8px',
            scrollSnapType:'x mandatory' }}>
            {withIndex.map(({s,index})=>(
              <div key={s.id} style={{ flex:'0 0 80%', scrollSnapAlign:'start' }}>
                <ShowCard show={s} lang={lang} compact onBuy={onBuy} index={index}/>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:22 }}>
            {withIndex.map(({s,index})=> <ShowCard key={s.id} show={s} lang={lang} onBuy={onBuy} index={index}/> )}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Editorial italic-accent heading ──────────────────────────────────────────
function EmHead({ h }) {
  if (typeof h === 'string') return h;
  return <>{h.a}<em className="ut-em">{h.i}</em>{h.b}</>;
}

// ── Shared section header ─────────────────────────────────────────────────────
function SectionHead({ lang, eyebrow, title, sub, compact, center, light, action }) {
  return (
    <div style={{ marginBottom: compact?22:36,
      display:'flex', gap:18, alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap' }}>
      <div style={{ textAlign: center?'center':'start', display:'flex', flexDirection:'column', gap:10, alignItems: center?'center':'flex-start' }}>
        <span className="ut-eyebrow" style={{ color: light?'var(--goldSoft)':'var(--garnet)' }}>{eyebrow}</span>
        <h2 className="ut-serif" style={{ fontSize: compact?'clamp(28px,7.4vw,34px)':'clamp(34px,3.4vw,46px)', color: light?'#fff':'var(--ink)', maxWidth:680, lineHeight:1.12 }}><EmHead h={title}/></h2>
        {sub && <p style={{ fontSize: compact?14:16, color: light?'rgba(255,255,255,.7)':'var(--inkSoft)', maxWidth:560 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const ICONS = {
  cal: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4" strokeLinecap="round"/></svg>,
  clock: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  tag: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" strokeLinejoin="round"/><circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none"/></svg>,
};
function CamIcon(){ return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.7"><rect x="2.5" y="6" width="19" height="14" rx="2.5"/><circle cx="12" cy="13" r="3.6"/><path d="M8 6l1.5-2.5h5L16 6"/></svg>; }
function PlayIcon(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9.2"/><path d="M10 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none"/></svg>; }
function TicketIcon(){ return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M14 6v12" strokeDasharray="2 2.5"/></svg>; }
function Pomegranate({ size=20 }){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 4.5c0-1.4 1.2-2 2.4-1.6-.3 1-1 1.6-1.6 1.9 3.3.5 5.7 3.3 5.7 6.9 0 4-3 7.3-6.5 7.3S5.5 15.7 5.5 11.7c0-3.5 2.3-6.3 5.5-6.9-.6-.3-1.2-.9-1.5-1.8C10.7 2.6 12 3.1 12 4.5Z" fill="currentColor"/><g fill="#fff" fillOpacity="0.85"><circle cx="10" cy="11" r="1"/><circle cx="13.4" cy="10.4" r="1"/><circle cx="11.7" cy="13.2" r="1"/><circle cx="14.2" cy="13" r="0.9"/><circle cx="9.4" cy="13.7" r="0.9"/></g></svg>;
}

Object.assign(window, { Header, UrgencyBanner, Hero, ShowCard, Schedule, SectionHead, EmHead, Scarcity, Countdown, ICONS, CamIcon, PlayIcon, TicketIcon, Pomegranate });
