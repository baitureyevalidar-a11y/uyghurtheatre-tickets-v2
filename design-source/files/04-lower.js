// lower.jsx — StatsStrip (count-up), Playbill lives in sections.jsx, numbered FAQ, MascotCTA, Footer, StickyCTA
const { useState: useStateL, useRef: useRefL, useEffect: useEffectL } = React;

// ── count-up hook (runs when `run` flips true) — timer-based (rAF-throttle safe)
function useCountUp(target, run, dur=1500) {
  const [v, setV] = useStateL(0);
  useEffectL(()=>{
    if(!run){ setV(0); return; }
    const t0 = Date.now();
    const id = setInterval(()=>{
      const p = Math.min(1,(Date.now()-t0)/dur); const e = 1-Math.pow(1-p,3);
      setV(Math.round(target*e));
      if(p>=1) clearInterval(id);
    }, 33);
    return ()=> clearInterval(id);
  }, [run, target, dur]);
  return v;
}

function findScrollParent(el) {
  let n = el && el.parentElement;
  while (n) {
    const oy = getComputedStyle(n).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight) return n;
    n = n.parentElement;
  }
  return null; // → viewport
}

// fires `onEnter` once when `el` is within its scroll context (interval poll — robust)
function useInView(ref, onEnter) {
  useEffectL(()=>{
    const el = ref.current; if(!el) return;
    const root = findScrollParent(el);
    const check = ()=>{
      const r = el.getBoundingClientRect();
      const refB = root ? root.getBoundingClientRect() : { top:0, bottom: window.innerHeight };
      if (r.top < refB.bottom - 40 && r.bottom > refB.top + 40) { clearInterval(id); onEnter(); }
    };
    const id = setInterval(check, 120);
    check();
    return ()=> clearInterval(id);
  }, [ref, onEnter]);
}

// ── Animated editorial stats strip ───────────────────────────────────────────
function StatsStrip({ lang, compact, onBuy }) {
  const t = STR[lang];
  const ref = useRefL(null);
  const [run, setRun] = useStateL(false);
  const onEnter = useRefL(()=>setRun(true)).current;
  useInView(ref, onEnter);

  return (
    <section ref={ref} style={{ background:'var(--paper)', padding: compact?'40px 0 36px':'72px 0 64px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding: compact?'0 16px':'0 40px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: compact?8:24,
          borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', padding: compact?'26px 0':'40px 0' }}>
          {t.statsArr.map((s,i)=>(
            <StatCell key={i} s={s} run={run} compact={compact}/>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'center', marginTop: compact?26:34 }}>
          <button onClick={()=>onBuy()} className="ut-cta" style={{ padding: compact?'14px 30px':'15px 36px', fontSize: compact?15.5:16 }}>
            <TicketIcon/> {t.buy}
          </button>
        </div>
      </div>
    </section>
  );
}
function StatCell({ s, run, compact }) {
  const val = useCountUp(s.n, run);
  return (
    <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap: compact?4:8 }}>
      <div className="ut-bignum" style={{ fontSize: compact?'clamp(40px,13vw,56px)':'clamp(64px,6vw,92px)', color:'var(--garnet)' }}>
        {fmtNum(val)}<span style={{ color:'var(--gold)' }}>{s.suffix}</span>
      </div>
      <div style={{ fontSize: compact?11.5:14, color:'var(--inkSoft)', maxWidth:160, lineHeight:1.3 }}>{s.label}</div>
    </div>
  );
}

// ── FAQ — numbered editorial list (click expands) ────────────────────────────
function FaqSection({ lang, compact, onBuy }) {
  const t = STR[lang];
  const [open, setOpen] = useStateL(0);
  const items = FAQ[lang];
  return (
    <section id="faq" style={{ background:'var(--paper2)', padding: compact?'44px 0':'80px 0' }}>
      <div style={{ maxWidth:820, margin:'0 auto', padding: compact?'0 16px':'0 40px' }}>
        <SectionHead lang={lang} eyebrow={t.nav_faq} title={t.edFaq} compact={compact}/>
        <div style={{ borderTop:'1px solid var(--line)' }}>
          {items.map((it,i)=>{
            const isOpen = open===i;
            const num = String(i+1).padStart(2,'0');
            return (
              <div key={i} className="ut-faqrow" style={{ borderBottom:'1px solid var(--line)' }}>
                <button onClick={()=>setOpen(isOpen?-1:i)} style={{ width:'100%', display:'flex', alignItems:'flex-start', gap: compact?14:20,
                  padding: compact?'16px 4px':'22px 6px', textAlign:'start' }}>
                  <span className="ut-faqnum" style={{ fontSize: compact?18:24, minWidth: compact?28:40, opacity: isOpen?1:.55, transition:'opacity .2s' }}>{num}.</span>
                  <span className="ut-faq-qtext ut-serif" style={{ flex:1, fontWeight:700, fontSize: compact?16:19, lineHeight:1.25, color:'var(--ink)', transition:'color .15s' }}>{it.q}</span>
                  <span style={{ flex:'none', marginTop:4, color:'var(--garnet)', fontSize: compact?20:24, lineHeight:1,
                    transform: isOpen?'rotate(45deg)':'none', transition:'transform .25s' }}>+</span>
                </button>
                <div style={{ maxHeight: isOpen?360:0, overflow:'hidden', transition:'max-height .35s ease' }}>
                  <p style={{ padding: compact?`0 4px 18px ${28+14}px`:`0 30px 24px ${40+20}px`, fontSize: compact?13.5:15, color:'var(--inkSoft)', lineHeight:1.6 }}>{it.a}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display:'flex', justifyContent:'center', marginTop: compact?26:36 }}>
          <button onClick={()=>onBuy()} className="ut-cta" style={{ padding: compact?'14px 30px':'15px 36px', fontSize: compact?15.5:16 }}>
            <TicketIcon/> {t.buy}
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Mascot illustration + final CTA ──────────────────────────────────────────
function MascotCTA({ lang, compact, onBuy }) {
  const t = STR[lang];
  return (
    <section style={{ background:'var(--night)', color:'#fff', padding: compact?'48px 0':'84px 0', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-25%', insetInlineStart:'-8%', width:360, height:360, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(156,47,42,.4), transparent 65%)', pointerEvents:'none' }}></div>
      <div style={{ position:'relative', maxWidth:1100, margin:'0 auto', padding: compact?'0 16px':'0 40px',
        display:'flex', flexDirection: compact?'column':'row', gap: compact?28:56, alignItems:'center' }}>
        {/* illustration placeholder */}
        <div style={{ flex:'none' }}>
          <div className="ut-video" style={{ width: compact?180:240, height: compact?180:240, borderRadius:'50%',
            display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,.12)' }}>
            <ComedyMask size={compact?78:104}/>
            <div className="ut-video-label" style={{ position:'absolute', bottom:14, top:'auto', fontSize:9, color:'rgba(255,255,255,.4)' }}>{t.illoLabel}</div>
          </div>
        </div>
        {/* copy + CTA */}
        <div style={{ flex:1, textAlign: compact?'center':'start' }}>
          <span className="ut-eyebrow" style={{ color:'var(--goldSoft)' }}>{t.premiere}</span>
          <h2 className="ut-serif" style={{ fontSize: compact?'clamp(30px,8.4vw,40px)':'clamp(40px,4.4vw,60px)', color:'#fff', margin:'12px 0 14px' }}>
            <EmHead h={t.edFinal}/>
          </h2>
          <p style={{ fontSize: compact?15:17, color:'rgba(255,255,255,.72)', maxWidth:460, margin: compact?'0 auto 22px':'0 0 26px', lineHeight:1.5 }}>{t.finalSub}</p>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent: compact?'center':'flex-start', alignItems:'center' }}>
            <button onClick={()=>onBuy()} className="ut-cta" style={{ padding: compact?'15px 32px':'17px 40px', fontSize: compact?16:17, borderRadius:14 }}>
              <TicketIcon/> {t.buy}
            </button>
            <div className="ut-serif" style={{ fontSize: compact?22:26, fontWeight:700, color:'#fff' }}>{t.from} {fmtPrice(SHOWS.find(s=>s.featured).priceFrom, lang)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
function ComedyMask({ size=100 }) {
  // flat abstract comedy mask — drawn simple, gold on dark
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M50 8c20 0 33 9 33 9s-2 30-7 46c-4 13-15 23-26 23S28 76 24 63c-5-16-7-46-7-46S30 8 50 8Z" fill="none" stroke="var(--goldSoft)" strokeWidth="2.4"/>
      {/* eyes (smiling arcs) */}
      <path d="M31 42c4-5 12-5 16 0" stroke="var(--goldSoft)" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M53 42c4-5 12-5 16 0" stroke="var(--goldSoft)" strokeWidth="2.4" strokeLinecap="round"/>
      {/* big smile */}
      <path d="M33 60c6 11 28 11 34 0" stroke="var(--garnet)" strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* ornamental dot motif on brow */}
      <circle cx="50" cy="24" r="2.4" fill="var(--garnet)"/>
      <circle cx="41" cy="27" r="1.6" fill="var(--goldSoft)"/>
      <circle cx="59" cy="27" r="1.6" fill="var(--goldSoft)"/>
    </svg>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ lang, compact, onBuy }) {
  const t = STR[lang];
  const socials = ['Instagram','Telegram','YouTube','TikTok'];
  return (
    <footer style={{ background:'var(--night)', color:'#fff', padding: compact?'40px 0 110px':'56px 0 40px', borderTop:'1px solid rgba(255,255,255,.08)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding: compact?'0 16px':'0 40px' }}>
        {/* footer CTA band */}
        <div style={{ display:'flex', flexDirection: compact?'column':'row', gap:14, alignItems:'center', justifyContent:'space-between',
          paddingBottom: compact?28:36, marginBottom: compact?28:36, borderBottom:'1px solid rgba(255,255,255,.1)' }}>
          <div className="ut-serif" style={{ fontSize: compact?22:30, fontWeight:700, textAlign: compact?'center':'start' }}>
            <EmHead h={t.edFinal}/>
          </div>
          <button onClick={()=>onBuy()} className="ut-cta" style={{ padding:'14px 30px', fontSize:15.5, flex:'none' }}><TicketIcon/> {t.buy}</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: compact?'1fr':'1.3fr 1fr 1fr', gap: compact?26:40 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ width:40, height:40, borderRadius:10, background:'var(--garnet)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><Pomegranate size={22}/></span>
              <div className="ut-serif" style={{ fontWeight:700, fontSize:17 }}>{footName(lang)}</div>
            </div>
            <p style={{ fontSize:13.5, color:'rgba(255,255,255,.6)', lineHeight:1.5, maxWidth:300 }}>{t.theaterFull}</p>
            <p className="ut-serif" style={{ fontStyle:'italic', color:'var(--goldSoft)', marginTop:14, fontSize:15 }}>{t.footTagline}</p>
          </div>
          <div>
            <div className="ut-eyebrow" style={{ color:'var(--goldSoft)', marginBottom:14 }}>{t.phoneLabel}</div>
            <a href="tel:+77272700000" className="ut-serif" style={{ fontSize:22, fontWeight:700, display:'block', marginBottom:14 }}>+7 (727) 270-00-00</a>
            <div style={{ fontSize:13.5, color:'rgba(255,255,255,.7)', lineHeight:1.5, marginBottom:8 }}>{t.addr}</div>
            <a href="https://maps.google.com" target="_blank" style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:13.5, color:'var(--goldSoft)', fontWeight:600 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
              {t.openMap}
            </a>
            <div className="ut-ph" style={{ marginTop:14, height:96, borderRadius:12, opacity:.9 }}>
              <div className="ut-ph-label" style={{ fontSize:9 }}>MAP</div>
            </div>
          </div>
          <div>
            <div className="ut-eyebrow" style={{ color:'var(--goldSoft)', marginBottom:14 }}>{t.socialsLabel}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {socials.map(s=>(
                <a key={s} href="#" style={{ fontSize:14, color:'rgba(255,255,255,.78)', display:'inline-flex', alignItems:'center', gap:8 }}
                   onMouseEnter={e=>e.currentTarget.style.color='#fff'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.78)'}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--gold)' }}></span>{s}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: compact?28:44, paddingTop:20, borderTop:'1px solid rgba(255,255,255,.1)', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:10, fontSize:12, color:'rgba(255,255,255,.5)' }}>
          <span>© 2026 {t.theaterFull}</span>
          <span>{t.rights} · Kaspi Pay · Epay.kz</span>
        </div>
      </div>
    </footer>
  );
}
// "Уйгурский театр" with italic accent on the last word
function footName(lang) {
  const n = STR[lang].theaterName;
  const parts = n.split(' ');
  if (parts.length < 2) return <em className="ut-em">{n}</em>;
  const last = parts.pop();
  return <>{parts.join(' ')} <em className="ut-em">{last}</em></>;
}

// ── Sticky mobile CTA bar ─────────────────────────────────────────────────────
function StickyCTA({ show, lang, onBuy, visible }) {
  const t = STR[lang];
  const left = show.capacity - show.sold;
  const scarce = left < show.capacity*0.3;
  return (
    <div style={{ position:'absolute', insetInline:0, bottom:0, zIndex:50,
      transform: visible?'translateY(0)':'translateY(120%)', transition:'transform .3s ease',
      background:'rgba(250,246,240,.96)', backdropFilter:'blur(14px)', borderTop:'1px solid var(--line)',
      padding:'10px 16px calc(10px + env(safe-area-inset-bottom))', display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, color:'var(--inkSoft)', display:'flex', alignItems:'center', gap:6 }}>
          {scarce ? <><span className="ut-dot" style={{ background:'var(--garnet)' }}></span><span style={{ color:'var(--garnet)', fontWeight:600 }}>{left} {t.seatsLeftShort}</span></> : <span>{show.titles[lang]}</span>}
        </div>
        <div className="ut-serif" style={{ fontSize:18, fontWeight:700, lineHeight:1.1, fontVariantNumeric:'tabular-nums' }}>{t.from} {fmtPrice(show.priceFrom,lang)}</div>
      </div>
      <button onClick={onBuy} className="ut-cta" style={{ padding:'13px 26px', fontSize:15.5 }}><TicketIcon/> {t.buy}</button>
    </div>
  );
}

Object.assign(window, { StatsStrip, FaqSection, MascotCTA, Footer, StickyCTA });
