// app.jsx — LandingPage composition, framed instances (phone + desktop), tweaks, scaling stage
const { useState: useStateA, useEffect: useEffectA, useRef: useRefA, useCallback } = React;

const FEATURED = SHOWS.find(s=>s.featured) || SHOWS[0];

// ── The landing page (self-contained; owns its scroll + overlays) ─────────────
function LandingPage({ compact, tw, lang, setLang, flow }) {
  const [selected, setSelected] = useStateA([]);
  const [checkout, setCheckout] = useStateA(null); // null | {show, startStep}
  const [showSticky, setShowSticky] = useStateA(false);
  const [activeShow, setActiveShow] = useStateA(FEATURED);
  const scrollRef = useRefA(null);

  const t = STR[lang];
  const dir = t.dir;

  // sticky CTA appears after hero scrolls away
  useEffectA(()=>{
    const el = scrollRef.current; if(!el) return;
    const onScroll = ()=> setShowSticky(el.scrollTop > (compact?360:480));
    el.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
    return ()=> el.removeEventListener('scroll', onScroll);
  }, [compact]);

  const openBuy = (show) => { const s = show||activeShow; setActiveShow(s); if(selected.length===0||s!==activeShow){} setCheckout({ show:s, startStep:'seat' }); };
  const proceedFromHall = () => { setCheckout({ show:FEATURED, startStep: selected.length? 'details':'seat' }); };

  return (
    <div className={'ut-root'+(tw.headingFont==='Cormorant'?' ut-cormorant':'')} dir={dir} lang={t.locale}
         style={{ width:'100%', height: flow?'auto':'100%', position:'relative', overflow: flow?'visible':'hidden', '--serif': tw.headingFont, '--garnet': tw.accent }}>
      <div ref={scrollRef} style={{ height: flow?'auto':'100%', overflowY: flow?'visible':'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch' }} className="ut-scroll">
        {tw.urgency==='banner' && <UrgencyBanner show={FEATURED} lang={lang}/>}
        <Header lang={lang} setLang={setLang} compact={compact} onBuy={()=>openBuy(FEATURED)}/>
        <Hero show={FEATURED} lang={lang} compact={compact} layout={tw.heroLayout} urgency={tw.urgency} onBuy={()=>openBuy(FEATURED)}/>
        <Schedule lang={lang} compact={compact} onBuy={openBuy}/>
        <StatsStrip lang={lang} compact={compact} onBuy={()=>openBuy(FEATURED)}/>
        <FaqSection lang={lang} compact={compact} onBuy={()=>openBuy(FEATURED)}/>
        <MascotCTA lang={lang} compact={compact} onBuy={()=>openBuy(FEATURED)}/>
        <Footer lang={lang} compact={compact} onBuy={()=>openBuy(FEATURED)}/>
      </div>

      {/* sticky mobile CTA */}
      {compact && <StickyCTA show={FEATURED} lang={lang} visible={showSticky && !checkout} onBuy={()=>openBuy(FEATURED)}/>}

      {/* checkout modal */}
      {checkout && (
        <Checkout show={checkout.show} lang={lang} mode={tw.seatMode} startStep={checkout.startStep}
          selected={selected} setSelected={setSelected} compact={compact} onClose={()=>setCheckout(null)}/>
      )}
    </div>
  );
}

// ── Framed instances ──────────────────────────────────────────────────────────
function PhoneInstance({ tw }) {
  const [lang, setLang] = useStateA('ru');
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
      <FrameLabel text="Mobile · 80%+ of traffic"/>
      <IOSDevice width={390} height={844}>
        <LandingPage compact tw={tw} lang={lang} setLang={setLang}/>
      </IOSDevice>
    </div>
  );
}
function DesktopInstance({ tw }) {
  const [lang, setLang] = useStateA('ru');
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
      <FrameLabel text="Desktop"/>
      <ChromeWindow width={1080} height={812} url="biletteatr.kz" tabs={[{title:'Уйгурский театр · Билеты'}]}>
        <LandingPage compact={false} tw={tw} lang={lang} setLang={setLang}/>
      </ChromeWindow>
    </div>
  );
}
function FrameLabel({ text }) {
  return <div style={{ fontSize:12, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:'#8a8076', fontFamily:'Inter,system-ui' }}>{text}</div>;
}

// ── Scaling stage (fits both frames into the viewport) ───────────────────────
function Stage({ children, designW, designH }) {
  const [scale, setScale] = useStateA(1);
  useEffectA(()=>{
    const fit = ()=>{
      const vw = window.innerWidth, vh = window.innerHeight;
      const s = Math.min((vw-48)/designW, (vh-150)/designH, 1);
      setScale(Math.max(0.3, s));
    };
    fit(); window.addEventListener('resize', fit);
    return ()=> window.removeEventListener('resize', fit);
  }, [designW, designH]);
  return (
    <div style={{ width: designW*scale, height: designH*scale, margin:'0 auto' }}>
      <div style={{ width:designW, height:designH, transform:`scale(${scale})`, transformOrigin:'top center' }}>
        {children}
      </div>
    </div>
  );
}

// ── Tweaks defaults ───────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroLayout": "full",
  "urgency": "banner",
  "seatMode": "individual",
  "headingFont": "PT Serif",
  "accent": "#9c2f2a"
}/*EDITMODE-END*/;

// ── Root app ──────────────────────────────────────────────────────────────────
function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const DESIGN_W = 1080 + 60 + 390; // desktop + gap + phone
  const DESIGN_H = 880;

  return (
    <div style={{ minHeight:'100vh', background:'#ece4d8', padding:'26px 0 40px',
      backgroundImage:'radial-gradient(60% 50% at 50% 0%, #f3ebdf, #e6dccd)' }}>
      {/* intro */}
      <div style={{ textAlign:'center', marginBottom:22, padding:'0 20px', fontFamily:'Inter,system-ui' }}>
        <div style={{ fontSize:12, fontWeight:600, letterSpacing:'.16em', textTransform:'uppercase', color:'#9c2f2a', marginBottom:8 }}>Conversion funnel · KZ / RU / UG</div>
        <h1 style={{ fontFamily:"'PT Serif',serif", fontSize:'clamp(24px,3.6vw,34px)', fontWeight:700, color:'#241f1c', margin:0 }}>Уйгурский <em style={{fontStyle:'italic'}}>театр</em> — продажа билетов</h1>
        <p style={{ fontSize:14, color:'#6b6258', marginTop:8, maxWidth:620, marginInline:'auto' }}>
          Editorial-рестайл. Полностью кликабельный прототип: спектакль → место → данные → оплата.
          Переключайте язык (вкл. UG / RTL) в правом верхнем углу. «Tweaks» — варианты героя, срочности и схемы зала.
        </p>
      </div>

      <Stage designW={DESIGN_W} designH={DESIGN_H}>
        <div style={{ display:'flex', gap:60, alignItems:'flex-start', justifyContent:'center', width:'100%', height:'100%' }}>
          <DesktopInstance tw={tw}/>
          <PhoneInstance tw={tw}/>
        </div>
      </Stage>

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label="Hero" />
        <TweakRadio label="Макет героя" value={tw.heroLayout}
          options={[{value:'full',label:'Видео'},{value:'split',label:'Split'},{value:'posterLeft',label:'Постер'}]}
          onChange={v=>setTweak('heroLayout', v)} />
        <TweakSection label="Срочность" />
        <TweakRadio label="Сценарий" value={tw.urgency}
          options={[{value:'banner',label:'Баннер'},{value:'inline',label:'Чип'},{value:'counter',label:'Отсчёт'}]}
          onChange={v=>setTweak('urgency', v)} />
        <TweakSection label="Схема зала" />
        <TweakRadio label="Выбор места" value={tw.seatMode}
          options={[{value:'individual',label:'По местам'},{value:'zone',label:'По зонам'}]}
          onChange={v=>setTweak('seatMode', v)} />
        <TweakSection label="Типографика" />
        <TweakRadio label="Заголовки" value={tw.headingFont}
          options={[{value:'PT Serif',label:'PT Serif'},{value:'Cormorant',label:'Cormorant'}]}
          onChange={v=>setTweak('headingFont', v)} />
        <TweakColor label="Акцент (гранат)" value={tw.accent}
          options={['#9c2f2a','#7d2630','#a8432b','#8e2d3a']}
          onChange={v=>setTweak('accent', v)} />
      </TweaksPanel>
    </div>
  );
}

Object.assign(window, { LandingPage, App, FEATURED, TWEAK_DEFAULTS });
injectTheme();
if (!window.__UT_NO_AUTORENDER) {
  ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
}
