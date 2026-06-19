// theme.jsx — CSS injection, palette tokens, formatting + seat-generation helpers
// Exposes: injectTheme(), fmtPrice, fmtNum, showDate, daysUntil, genSeats, PALETTE

const PALETTE = {
  paper:    '#faf6f0',
  paper2:   '#f3ebdf',
  ink:      '#241f1c',
  inkSoft:  '#5c534c',
  garnet:   '#9c2f2a',
  garnetDk: '#7d2630',
  ember:    '#c1572f',
  gold:     '#bf8f3f',
  goldSoft: '#d8b878',
  night:    '#1a1410',
  night2:   '#241c16',
  line:     'rgba(36,31,28,0.12)',
};

function injectTheme() {
  if (document.getElementById('utheatre-theme')) return;
  const s = document.createElement('style');
  s.id = 'utheatre-theme';
  s.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Cormorant:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');

  .ut-root, .ut-root * { box-sizing: border-box; }
  .ut-root {
    --paper:${PALETTE.paper}; --paper2:${PALETTE.paper2};
    --ink:${PALETTE.ink}; --inkSoft:${PALETTE.inkSoft};
    --garnet:${PALETTE.garnet}; --garnetDk:${PALETTE.garnetDk}; --ember:${PALETTE.ember};
    --gold:${PALETTE.gold}; --goldSoft:${PALETTE.goldSoft};
    --night:${PALETTE.night}; --night2:${PALETTE.night2}; --line:${PALETTE.line};
    --serif:'PT Serif';
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--ink); background: var(--paper);
    -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
    position: relative; overflow-x: hidden;
  }
  .ut-root[dir="rtl"] { font-family: 'Noto Sans Arabic','Inter',system-ui,sans-serif; }
  .ut-serif { font-family: var(--serif), 'PT Serif', Georgia, serif; }
  .ut-root[dir="rtl"] .ut-serif { font-family: 'Noto Naskh Arabic','PT Serif',serif; }
  .ut-root.ut-cormorant .ut-serif { font-weight:600; letter-spacing:0; }

  .ut-root h1,.ut-root h2,.ut-root h3 { margin:0; font-weight:700; line-height:1.08; letter-spacing:-0.01em; }
  .ut-root p { margin:0; }
  .ut-root button { font-family:inherit; cursor:pointer; border:none; background:none; }
  .ut-root a { color:inherit; text-decoration:none; }
  .ut-eyebrow { font-size:11px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; }
  .ut-root[dir="rtl"] .ut-eyebrow { letter-spacing:0.04em; }

  /* CTA */
  .ut-root .ut-cta {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    background:var(--garnet); color:#fff; font-weight:600;
    border-radius:12px; transition:transform .12s ease, background .15s ease, box-shadow .15s ease;
    box-shadow:0 6px 20px -6px rgba(156,47,42,.55);
  }
  .ut-root .ut-cta:hover { background:var(--garnetDk); transform:translateY(-1px); box-shadow:0 10px 28px -8px rgba(156,47,42,.6); }
  .ut-root .ut-cta:active { transform:translateY(0); }
  .ut-root .ut-cta:disabled { box-shadow:none; cursor:default; }
  .ut-root .ut-cta-ghost {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    background:transparent; color:var(--ink); font-weight:600;
    border:1.5px solid var(--line); border-radius:12px; transition:border-color .15s, background .15s;
  }
  .ut-root .ut-cta-ghost:hover { border-color:var(--garnet); background:rgba(156,47,42,.04); }

  /* Cards */
  .ut-card {
    background:#fff; border:1px solid var(--line); border-radius:18px;
    overflow:hidden; transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  }
  .ut-card-int:hover { transform:translateY(-3px); box-shadow:0 18px 40px -22px rgba(36,31,28,.45); border-color:rgba(156,47,42,.25); }

  /* Placeholder media */
  .ut-ph { position:relative; overflow:hidden; background:
      linear-gradient(135deg, #efe5d6 0%, #e7d8c4 100%); }
  .ut-ph::after {
    content:''; position:absolute; inset:0; opacity:.5;
    background:
      radial-gradient(120% 80% at 70% 10%, rgba(156,47,42,.16), transparent 60%),
      radial-gradient(90% 70% at 10% 90%, rgba(191,143,63,.18), transparent 55%);
  }
  .ut-ph-label {
    position:absolute; inset:0; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:8px; color:rgba(36,31,28,.42); font-size:10px; font-weight:600; letter-spacing:0.14em; text-align:center; padding:16px;
  }
  .ut-root[dir="rtl"] .ut-ph-label { letter-spacing:0.02em; }

  /* Pomegranate motif line */
  .ut-rule { height:2px; width:46px; background:linear-gradient(90deg,var(--garnet),var(--gold)); border-radius:2px; }

  /* Pulse for urgency dot */
  @keyframes ut-pulse { 0%{transform:scale(1);opacity:1;} 70%{transform:scale(2.2);opacity:0;} 100%{opacity:0;} }
  .ut-dot { position:relative; width:7px; height:7px; border-radius:50%; background:#fff; flex:none; }
  .ut-dot::before { content:''; position:absolute; inset:0; border-radius:50%; background:#fff; animation:ut-pulse 1.8s ease-out infinite; }

  /* Seat hover */
  .ut-seat { cursor:pointer; transition:transform .08s ease; }
  .ut-seat:hover { transform:scale(1.18); }
  .ut-seat-sold { cursor:not-allowed; }

  /* Marquee for tickets-sold */
  .ut-count { font-variant-numeric:tabular-nums; }

  /* Scroll containers */
  .ut-scroll::-webkit-scrollbar { height:6px; width:6px; }
  .ut-scroll::-webkit-scrollbar-thumb { background:rgba(36,31,28,.18); border-radius:4px; }

  /* Faq */
  .ut-faq-q { transition:background .15s; }
  .ut-faq-q:hover { background:rgba(156,47,42,.03); }

  /* Step dots */
  .ut-fade-in { animation:ut-fade .35s ease both; }
  @keyframes ut-fade { from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:none;} }

  /* Editorial italic accent — same serif, italic, same weight/colour */
  .ut-em { font-style:italic; font-weight:inherit; color:inherit; }
  .ut-root[dir="rtl"] .ut-em { font-style:normal; color:var(--gold); }

  /* Big editorial numerals */
  .ut-bignum { font-family:var(--serif),'PT Serif',serif; font-weight:700; line-height:.86; letter-spacing:-0.02em; font-variant-numeric:tabular-nums; }
  .ut-root.ut-cormorant .ut-bignum { font-weight:600; }

  /* Numbered playbill numeral (corner) */
  .ut-cardnum { font-family:var(--serif),'PT Serif',serif; font-weight:700; line-height:1; color:var(--garnet); opacity:.16; }

  /* Numbered FAQ row */
  .ut-faqrow { transition:background .15s; }
  .ut-faqrow:hover .ut-faq-qtext { color:var(--garnet); }
  .ut-faqnum { font-family:var(--serif),'PT Serif',serif; font-weight:700; color:var(--garnet); line-height:1; }

  /* Video placeholder shimmer (dark) */
  .ut-video { background:
      linear-gradient(115deg, #221813 0%, #14100c 55%, #1d1510 100%); position:relative; overflow:hidden; }
  .ut-video::after { content:''; position:absolute; inset:0;
    background:radial-gradient(80% 60% at 30% 20%, rgba(156,47,42,.28), transparent 60%),
               radial-gradient(70% 60% at 85% 90%, rgba(191,143,63,.22), transparent 55%); }
  .ut-video-label { position:absolute; z-index:3; inset:0; display:flex; align-items:center; justify-content:center; gap:10px;
    color:rgba(255,255,255,.45); font-size:11px; font-weight:600; letter-spacing:.14em; }
  .ut-root[dir="rtl"] .ut-video-label { letter-spacing:.02em; }

  @media (prefers-reduced-motion: reduce) {
    .ut-root *, .ut-dot::before { animation:none !important; transition:none !important; }
  }
  `;
  document.head.appendChild(s);
}

// ── formatting ──────────────────────────────────────────────────────────────
function fmtNum(n, lang) {
  // thin-space grouping, common in KZ/RU
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
}
function fmtPrice(n, lang) {
  const t = STR[lang];
  return fmtNum(n) + '\u00A0' + t.tg;
}

function parseDate(iso) { const [y,m,d] = iso.split('-').map(Number); return new Date(y, m-1, d); }

function showDate(iso, lang, opts = {}) {
  const t = STR[lang]; const dt = parseDate(iso);
  const wd = opts.weekday === 'short' ? t.weekdaysShort[dt.getDay()] : t.weekdays[dt.getDay()];
  const day = dt.getDate(); const mon = t.months[dt.getMonth()];
  if (opts.short) return `${day} ${mon}`;
  return { day, mon, wd, full: `${day} ${mon}` };
}

// today is 2026-06-10 for this prototype
const TODAY = new Date(2026, 5, 10);
function daysUntil(iso) {
  const dt = parseDate(iso);
  return Math.round((dt - TODAY) / 86400000);
}

// ── Seat generation: curved theater, 5 zones, ~355 seats ────────────────────
// Deterministic. Returns {seats:[{id,zone,row,num,x,y,sold}], rows, viewW, viewH}
function genSeats(show) {
  const seats = [];
  const cx = 500; // viewbox center x
  let soldSet = pseudoSold(show);
  const push = (zone, row, num, x, y) => {
    const id = `${zone}-${row}-${num}`;
    seats.push({ id, zone, row, num, x, y, sold: soldSet.has(id) });
  };

  // Parter — fan rows. center + sides distinguished by column position.
  // rows 1..9, each row width grows. seat spacing 26.
  let y = 250;
  const parterRows = 9;
  for (let r = 1; r <= parterRows; r++) {
    const count = 16 + (r <= 6 ? r - 1 : 5); // 16..21
    const spacing = 27;
    const rowW = (count - 1) * spacing;
    const arc = 0.018; // curvature
    for (let i = 0; i < count; i++) {
      const off = i - (count - 1) / 2;
      const x = cx + off * spacing;
      const yy = y - arc * off * off * spacing;
      // side vs center: outer 3 each side => parterS
      const isSide = i < 3 || i >= count - 3;
      push(isSide ? 'parterS' : 'parterC', r, i + 1, x, yy);
    }
    y += 30 + r * 0.6;
  }

  // Lozha — boxes on far left/right of parter (premium)
  const boxRows = 3;
  for (let side = 0; side < 2; side++) {
    const bx = side === 0 ? 250 : 750;
    for (let r = 1; r <= boxRows; r++) {
      for (let i = 0; i < 3; i++) {
        const x = bx + (side === 0 ? -1 : 1) * (i * 24) - (side===0?60:-60);
        const yy = 300 + r * 34;
        push('lozha', (side===0?'L':'R')+r, i + 1, x, yy);
      }
    }
  }

  // Amfitheatre — wider curved rows behind parter (rows 1-4: 25,26,27,28 = 106)
  y += 28;
  for (let r = 1; r <= 4; r++) {
    const count = 24 + r;
    const spacing = 26;
    const arc = 0.02;
    for (let i = 0; i < count; i++) {
      const off = i - (count - 1) / 2;
      const x = cx + off * spacing;
      const yy = y - arc * off * off * spacing;
      push('amfi', r, i + 1, x, yy);
    }
    y += 32;
  }

  // Balkon — top tier (rows 1-2: 28,29 = 57)
  y += 26;
  for (let r = 1; r <= 2; r++) {
    const count = 28 + (r - 1);
    const spacing = 25;
    const arc = 0.016;
    for (let i = 0; i < count; i++) {
      const off = i - (count - 1) / 2;
      const x = cx + off * spacing;
      const yy = y - arc * off * off * spacing;
      push('balkon', r, i + 1, x, yy);
    }
    y += 30;
  }

  return { seats, viewW: 1000, viewH: y + 40 };
}

// Deterministic sold-seat set sized to match show.sold ratio
function pseudoSold(show) {
  const set = new Set();
  // We over-mark proportional to sold/capacity using a hash; exact display count
  // for the hero comes from show.sold, this is only for visual fill.
  const ratio = show.sold / show.capacity;
  let seed = 0; for (const c of show.id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // We will mark seats during gen via a closure-friendly approach: precompute by index
  // Simpler: mark when rnd < ratio. Build a placeholder; ids generated identically in genSeats.
  // To keep ids aligned we replicate the same iteration here:
  const ids = enumerateIds(show);
  for (const id of ids) { if (rnd() < ratio) set.add(id); }
  return set;
}

// Mirror of genSeats iteration order, ids only (no geometry)
function enumerateIds(show) {
  const ids = [];
  for (let r = 1; r <= 9; r++) {
    const count = 16 + (r <= 6 ? r - 1 : 5);
    for (let i = 0; i < count; i++) {
      const isSide = i < 3 || i >= count - 3;
      ids.push(`${isSide ? 'parterS' : 'parterC'}-${r}-${i + 1}`);
    }
  }
  for (let side = 0; side < 2; side++)
    for (let r = 1; r <= 3; r++)
      for (let i = 0; i < 3; i++)
        ids.push(`lozha-${(side===0?'L':'R')+r}-${i + 1}`);
  for (let r = 1; r <= 4; r++) { const count = 24 + r; for (let i = 0; i < count; i++) ids.push(`amfi-${r}-${i + 1}`); }
  for (let r = 1; r <= 2; r++) { const count = 28 + (r - 1); for (let i = 0; i < count; i++) ids.push(`balkon-${r}-${i + 1}`); }
  return ids;
}

Object.assign(window, { PALETTE, injectTheme, fmtPrice, fmtNum, showDate, daysUntil, genSeats });
