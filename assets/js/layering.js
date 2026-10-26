/* ============================================================
   GIBERISH — Layering Lab
   Pick two fragrances → both bottles tilt and pour their colour into a
   crystal coupe, the colours swirl together and the ingredients rise
   out of the blend. Below: a profile radar, shared notes vs what each
   one adds, a harmony score with the reason, and how to wear the pair.
   Deep link: layering.html?a=<product-id>&b=<product-id>
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FAM = window.GIB_FAMILIES;
  const ING = window.GIB_INGREDIENTS;
  const money = window.gibMoney;
  const Art = window.GibArt;
  const P = window.GIB_PRODUCTS.filter((p) => p.type !== 'ritual'); // home rituals aren't worn on skin
  const byId = (id) => P.find((p) => p.id === id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* ============================================================
     1. Scent maths
     ============================================================ */
  // radar order: neighbours are kin (fruity sits by floral and fresh, gourmand by woody and amber);
  // opposite axes are natural contrasts: floral/woody, fruity/gourmand, fresh/amber, musk/spicy
  const FK = ['floral', 'fruity', 'fresh', 'musk', 'woody', 'gourmand', 'amber', 'spicy'];
  const profiles = {};
  const profile = (p) => (profiles[p.id] = profiles[p.id] || window.gibProductFamily(p));
  // How much "base" a family carries: heavy, long-lasting materials score high.
  const HEAVY = { woody: 1, amber: .85, gourmand: .75, spicy: .7, musk: .45, floral: .35, fruity: .25, fresh: .1 };
  const heaviness = (p) => { const f = profile(p); let s = 0, w = 0; FK.forEach((k) => { s += f[k] * HEAVY[k]; w += f[k]; }); return s / (w || 1); };
  const ranked = (f) => [...FK].sort((x, y) => f[y] - f[x]);
  const dominant = (p) => ranked(profile(p))[0];

  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mixRgb = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const light = (c, t) => mixRgb(c, [255, 248, 232], t);
  const dark = (c, t) => mixRgb(c, [10, 6, 4], t);

  /* Stream colour of a bottle = its dominant family colour.
     If both bottles share a dominant family, the second one leans halfway
     to its next family so the two streams stay readable in the glass. */
  function colourFor(p, other, isSecond) {
    const base = hex(FAM[dominant(p)].color);
    if (!isSecond || dominant(p) !== dominant(other)) return base;
    return mixRgb(base, hex(FAM[ranked(profile(p))[1]].color), .5);
  }

  /* ============================================================
     2. Harmony rules (how well two fragrances layer), score 0–100
     ------------------------------------------------------------
     Start at 50, then:
       + up to 34 for CONTRAST: 34 × (1 − cosine similarity of the two
         family profiles). Layering is about each bottle adding something.
       + 3 if they share at least one ingredient (a "bridge" note ties them).
     Then the named rules. The strongest positive rule counts in full,
     any further positive rules count at 40% (so stacking can't run away):
       CLASSIC CONTRAST  +16  one is floral-led (floral ≥ .7 and ≥ its woods),
                              the other is woody (woody ≥ .9, floral < .6).
                              Floral + woody: the rose-and-oud tradition.
       FRESH LIFT        +18  one has real freshness (fresh ≥ .5), the other is
                              heavy (heaviness ≥ .7) with little freshness and
                              not gourmand-led. Citrus/cardamom lifts oud and amber.
       SWEET LIFT        +16  one is gourmand (gourmand ≥ .7), the other is fresh
                              or fruity (≥ .5) with little sweetness. Bergamot or
                              fruit over caramel and tonka: the classic lift.
       COSY              +12  one is gourmand (≥ .7), the other woody (≥ .8) with
                              little sweetness. Cocoa and coffee over sandalwood.
       ORCHARD BLOOM     +10  one is fruity (≥ .7), the other floral-led
                              (floral ≥ .7) with little fruit. Peach and peony.
       WARM DEPTH        +10  one is amber-rich (amber ≥ .9), the other carries
                              spice (spicy ≥ .6) and is not amber-led itself.
                              Amber + spice = warmth with glow.
       SOFT FOCUS        +10  one is musky (musk ≥ .8), the other is woody or
                              spicy (≥ .7) with little musk. Musk rounds edges.
       TONAL LAYERING    +5   same dominant family (and not two heavy woods):
                              the pair deepens one idea rather than changing it.
     Penalties (always in full):
       INTENSE           −12  both are heavy woods (woody ≥ .9 each). Beautiful
                              at night, but dense, so use a light hand.
       NEAR TWINS        −14  ≥ 75% of the smaller one's ingredients are shared:
                              layering adds strength, not a new story.
     The one-line reason comes from the rule with the biggest effect.
     Clamped to 35–97: nothing in our collection truly clashes, nothing is perfect.
     ============================================================ */
  function harmony(a, b) {
    const fa = profile(a), fb = profile(b);
    const dot = FK.reduce((s, k) => s + fa[k] * fb[k], 0);
    const cos = dot / (Math.hypot(...FK.map((k) => fa[k])) * Math.hypot(...FK.map((k) => fb[k])) || 1);
    let score = 50 + (1 - cos) * 34;
    // test a rule both ways round; returns [x, y] products in rule order, or null
    const either = (fn) => (fn(fa, fb, a, b) ? [a, b] : fn(fb, fa, b, a) ? [b, a] : null);
    const rules = [];
    let m;
    if ((m = either((x, y) => x.floral >= .7 && x.floral >= x.woody && y.woody >= .9 && y.floral < .6))) {
      rules.push({ pts: 16, key: 'contrast', title: 'Classic contrast', line: `${m[0].name}’s florals bloom over the woods of ${m[1].name}: the rose-and-oud idea perfumers have trusted for centuries.` });
    }
    if ((m = either((x, y, px, py) => x.fresh >= .5 && heaviness(py) >= .7 && y.fresh < .3 && dominant(py) !== 'gourmand'))) {
      rules.push({ pts: 18, key: 'lift', title: 'Fresh lift', line: `${m[0].name}’s brightness lifts the weight of ${m[1].name}, so the oud and amber feel airy instead of heavy.` });
    }
    if ((m = either((x, y) => x.gourmand >= .7 && (y.fresh >= .5 || y.fruity >= .5) && y.gourmand < .3))) {
      rules.push({ pts: 16, key: 'sweet', title: 'Sweet lift', line: `${m[1].name} brings air and light to the sweetness of ${m[0].name}, like fruit and zest over a warm dessert.` });
    }
    if ((m = either((x, y) => x.gourmand >= .7 && y.woody >= .8 && y.gourmand < .4))) {
      rules.push({ pts: 12, key: 'cosy', title: 'Cosy depth', line: `The woods of ${m[1].name} hold the sweetness of ${m[0].name} close, like cocoa by a fire. Soft, warm, made for winter.` });
    }
    if ((m = either((x, y) => x.fruity >= .7 && y.floral >= .7 && y.fruity < .4))) {
      rules.push({ pts: 10, key: 'orchard', title: 'Orchard bloom', line: `${m[0].name}’s fruit ripens among the flowers of ${m[1].name}: a garden in full summer.` });
    }
    if ((m = either((x, y, px, py) => x.amber >= .9 && y.spicy >= .6 && dominant(py) !== 'amber'))) {
      rules.push({ pts: 10, key: 'warm', title: 'Warm depth', line: `The spice in ${m[1].name} glows against the amber of ${m[0].name}. Warm, deep, made for evenings.` });
    }
    if ((m = either((x, y) => x.musk >= .8 && (y.woody >= .7 || y.spicy >= .7) && y.musk < .3))) {
      rules.push({ pts: 10, key: 'soft', title: 'Soft focus', line: `${m[0].name}’s musk rounds off the edges of ${m[1].name}, so the pair is easy to wear by day.` });
    }
    if (fa.woody >= .9 && fb.woody >= .9) {
      rules.push({ pts: -12, key: 'intense', title: 'Intense', line: 'Two deep woods. Magnificent after dark, so go lightly: one touch of each.' });
    } else if (dominant(a) === dominant(b)) {
      rules.push({ pts: 5, key: 'tonal', title: 'Tonal layering', line: `Both are ${FAM[dominant(a)].label.toLowerCase()} at heart, so ${b.name} deepens ${a.name} rather than changing it.` });
    }
    const shared = a.ingredients.filter((k) => b.ingredients.includes(k));
    if (shared.length / Math.min(a.ingredients.length, b.ingredients.length) >= .75) {
      rules.push({ pts: -14, key: 'twins', title: 'Near twins', line: 'They share most of their notes, so layering adds strength more than a new story.' });
    } else if (shared.length) score += 3;

    rules.filter((r) => r.pts > 0).sort((x, y) => y.pts - x.pts).forEach((r, i) => (score += i ? r.pts * .4 : r.pts));
    rules.filter((r) => r.pts < 0).forEach((r) => (score += r.pts));
    let lead = [...rules].sort((x, y) => Math.abs(y.pts) - Math.abs(x.pts))[0];
    if (!lead) lead = cos < .5
      ? { key: 'opposites', title: 'Bold opposites', line: 'They share very little, so each stays distinct on skin and the pair feels like a conversation.' }
      : { key: 'easy', title: 'Easy companions', line: 'No clashes and nothing fighting for attention: a gentle, rounded blend.' };
    return { score: Math.round(clamp(score, 35, 97)), ...lead, shared };
  }

  /* ---------- Pairings we love: best pairs, each bottle used at most twice ---------- */
  const pairs = [];
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    // the heavier, base-rich bottle is listed (and poured) first
    const [x, y] = heaviness(P[i]) >= heaviness(P[j]) ? [P[i], P[j]] : [P[j], P[i]];
    pairs.push({ a: x, b: y, h: harmony(x, y) });
  }
  pairs.sort((x, y) => y.h.score - x.h.score);
  const loves = [], used = {}, usedKeys = {};
  for (const pr of pairs) {
    if (loves.length >= 6) break;
    if ((used[pr.a.id] || 0) >= 2 || (used[pr.b.id] || 0) >= 2 || (usedKeys[pr.h.key] || 0) >= 2) continue; // variety
    loves.push(pr);
    used[pr.a.id] = (used[pr.a.id] || 0) + 1; used[pr.b.id] = (used[pr.b.id] || 0) + 1; usedKeys[pr.h.key] = (usedKeys[pr.h.key] || 0) + 1;
  }

  /* ============================================================
     3. State + selectors
     ============================================================ */
  // the best-scoring partner for a bottle (used when a deep link names the same bottle twice)
  const bestPartner = (x) => { const pr = pairs.find((r) => r.a === x || r.b === x); return pr ? (pr.a === x ? pr.b : pr.a) : P.find((p) => p !== x); };
  const q = new URLSearchParams(location.search);
  let A = byId(q.get('a')) || loves[0].a;
  let B = byId(q.get('b')) || (A === loves[0].a ? loves[0].b : bestPartner(A));
  if (A === B) B = bestPartner(A); // the same bottle can never sit in both glasses

  /* Thumbnail for a bottle in the selectors. One place to swap the source later
     (e.g. a GibBottle3D snapshot): return a URL, then call refreshThumbs(). */
  const thumbs = {};
  function bottleThumb(p) { return thumbs[p.id] || p.image; }
  function refreshThumbs() { $$('.ll-pick').forEach((el) => { const img = $('img', el), src = bottleThumb(byId(el.dataset.id)); if (img.getAttribute('src') !== src) img.src = src; }); }
  window.GibLayering = { setThumb(id, url) { thumbs[id] = url; refreshThumbs(); }, refreshThumbs };

  const rails = { a: $('[data-rail="a"]'), b: $('[data-rail="b"]') };
  const other = (slot) => (slot === 'a' ? B : A);
  function choose(slot, p, focus) {
    if (!p || p === other(slot)) return; // the other glass's bottle is never selectable
    if (slot === 'a') setPair(p, B); else setPair(A, p);
    if (focus) { const el = $(`.ll-pick[data-id="${p.id}"]`, rails[slot]); if (el) el.focus({ preventScroll: true }); }
  }
  // step to the previous / next bottle (wrapping round), skipping the one in the other glass
  function step(slot, dir, focus) {
    const cur = slot === 'a' ? A : B;
    let i = P.indexOf(cur);
    for (let n = 0; n < P.length; n++) {
      i = (i + dir + P.length) % P.length;
      if (P[i] !== other(slot)) return choose(slot, P[i], focus);
    }
  }
  Object.entries(rails).forEach(([slot, rail]) => {
    rail.innerHTML = P.map((p) => `
      <button type="button" class="ll-pick" data-id="${p.id}" aria-pressed="false" aria-label="${slot === 'a' ? 'First' : 'Second'} fragrance: ${esc(p.name)}">
        <span class="ll-pick-media"><img src="${bottleThumb(p)}" alt="" loading="lazy" decoding="async"></span>
        <span class="ll-pick-name">${esc(p.name)}</span>
        <span class="ll-pick-taken" aria-hidden="true">In the other glass</span>
      </button>`).join('');
    rail.addEventListener('click', (e) => {
      const btn = e.target.closest('.ll-pick');
      if (btn && !btn.disabled) choose(slot, byId(btn.dataset.id));
    });
    rail.addEventListener('keydown', (e) => {
      const dir = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
      if (dir) { e.preventDefault(); step(slot, dir, true); }
    });
  });
  $$('[data-step]').forEach((b) => b.addEventListener('click', () => { const [slot, d] = b.dataset.step.split(':'); step(slot, Number(d)); }));

  function centreInRail(rail, smooth) {
    const el = rail.querySelector('.ll-pick.is-on');
    if (!el) return;
    const horizontal = rail.scrollWidth > rail.clientWidth + 2;
    const opts = { behavior: smooth && !reduceMotion ? 'smooth' : 'auto' };
    if (horizontal) opts.left = el.offsetLeft - rail.clientWidth / 2 + el.offsetWidth / 2;
    else opts.top = el.offsetTop - rail.clientHeight / 2 + el.offsetHeight / 2;
    rail.scrollTo(opts);
  }

  function setPair(a, b, { scroll = false, smooth = true } = {}) {
    if (a === b) b = bestPartner(a);
    A = a; B = b;
    const ca = colourFor(A, B, false), cb = colourFor(B, A, true);
    Object.entries(rails).forEach(([slot, rail]) => {
      const cur = slot === 'a' ? A : B;
      const taken = other(slot);
      $$('.ll-pick', rail).forEach((el) => {
        const p = byId(el.dataset.id), on = p === cur, off = p === taken;
        el.classList.toggle('is-on', on);
        el.classList.toggle('is-taken', off);
        el.disabled = off;
        el.setAttribute('aria-pressed', on);
        el.setAttribute('aria-label', `${slot === 'a' ? 'First' : 'Second'} fragrance: ${p.name}${off ? ' (in the other glass)' : ''}`);
        el.style.setProperty('--c', rgba(slot === 'a' ? ca : cb, 1));
      });
      centreInRail(rail, smooth);
    });
    $$('[data-name="a"]').forEach((el) => (el.textContent = A.name));
    $$('[data-name="b"]').forEach((el) => (el.textContent = B.name));
    [['a', ca], ['b', cb]].forEach(([k, c]) => { const sw = $(`[data-swatch="${k}"]`); sw.style.background = sw.style.color = rgba(c, 1); });
    try { history.replaceState(null, '', `${location.pathname}?a=${A.id}&b=${B.id}`); } catch (_) {}
    Stage.load(A, B, ca, cb);
    renderReading(ca, cb);
    $$('.ll-love').forEach((el) => el.classList.toggle('is-on', (el.dataset.a === A.id && el.dataset.b === B.id) || (el.dataset.a === B.id && el.dataset.b === A.id)));
    if (scroll) {
      const top = $('#lab').getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72) - 12;
      if (window.gibLenis) window.gibLenis.scrollTo(top); else window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* ============================================================
     4. The pouring stage (canvas)
     ============================================================ */
  const Stage = (function () {
    const stage = $('#stage'), cvs = $('canvas', stage), ctx = cvs.getContext('2d');
    const imgCache = {};
    // the pouring stage keeps the HD photographs (richer at this size); the pickers use 3D renders
    const bottleImg = (p) => { if (!imgCache[p.id]) { const im = new Image(); im.decoding = 'async'; im.src = p.image; imgCache[p.id] = im; } return imgCache[p.id]; };
    let W = 0, H = 0, dpr = 1, L = null;
    let slots = [], kinds = [], sprites = [], blobs = [], ripples = [], specks = [], fx = [];
    let level = 0, amtA = 0, amtB = 0, swirl = 0, stir = 0, clock = 0, t0 = 0;
    let visible = true, raf = 0, last = 0;
    const TILT = 1.4, POUR = 2.4, BACK = 1.4, POUR_ANG = 1.78; // seconds, seconds, seconds, radians (~102°)

    function layout() {
      const R = Math.min(W * .24, H * .25, 150);
      const depth = R * .7, tableY = H - Math.max(64, H * .1), footY = tableY - 3; // room for the 'Pour again' label under the glass
      const stemH = Math.max(H * .16, R * .7);
      const rimY = footY - stemH - depth;
      L = { cx: W / 2, R, depth, rimY, footY, tableY, stemH, rim: .2 };
      slots.forEach(fitBottle);
    }

    // size a bottle to sit beside the glass, and work out where it pours from
    function fitBottle(s) {
      const im = s.img;
      const asp = im.naturalWidth ? im.naturalWidth / im.naturalHeight : .55;
      const maxH = Math.min(H * .36, W * .36, 230), maxW = Math.max(54, Math.min(maxH * .95, W / 2 - L.R - 16));
      s.h = Math.min(maxH, maxW / asp); s.w = s.h * asp;
      s.rest = { x: L.cx + s.side * (L.R + 12 + s.w / 2), y: L.tableY - s.h / 2 };
      // pour pose: rotate towards the glass; place the mouth so the stream lands just off-centre
      const th = -s.side * POUR_ANG;
      const nz = s.p.nozzle || [.5, .02];
      const mx = (nz[0] - .5) * s.w, my = (nz[1] - .5) * s.h;
      const rx = mx * Math.cos(th) - my * Math.sin(th), ry = mx * Math.sin(th) + my * Math.cos(th);
      const mouthY = Math.max(L.rimY - H * .2, s.w / 2 + 14 + ry);
      const u = [Math.sin(th), -Math.cos(th)], sp = H * .22, g = H * 2.2;
      const vy = u[1] * sp, dy = L.rimY + L.depth * .3 - mouthY;
      const tFall = (-vy + Math.sqrt(vy * vy + 2 * g * dy)) / g;
      const mouthX = L.cx + s.side * L.R * .16 - u[0] * sp * tFall;
      // keep the tilted bottle inside the stage on narrow screens
      const reach = (Math.abs(s.h * Math.sin(th)) + Math.abs(s.w * Math.cos(th))) / 2 + 14;
      s.pour = { x: clamp(mouthX - rx, reach, W - reach), y: mouthY - ry };
      s.th = th; s.nz = [mx, my]; s.sp = sp; s.g = g;
    }

    function resize() {
      const r = stage.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
      layout();
      specks = Array.from({ length: Math.round(Math.min(34, W / 14)) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + .3, s: Math.random() * 8 + 3, a: Math.random() * TAU }));
      if (reduceMotion || !raf) frame(0);
    }

    function load(a, b, ca, cb) {
      slots = [a, b].map((p, i) => ({ p, img: bottleImg(p), side: i ? 1 : -1, rgb: i ? cb : ca, start: i ? 1.35 : .25, flowOn: -1, flowOff: -1, flowing: false, k: 0, ang: 0, x: 0, y: 0 }));
      kinds = [];
      const ka = [...new Set(a.ingredients.flatMap((k) => Art.forIngredient(k)))], kb = [...new Set(b.ingredients.flatMap((k) => Art.forIngredient(k)))];
      for (let i = 0; i < Math.max(ka.length, kb.length); i++) { if (ka[i]) kinds.push(ka[i]); if (kb[i]) kinds.push(kb[i]); }
      // reduced motion paints a still frame, so repaint whenever a piece of art arrives
      kinds.forEach((k) => { const im = Art.image(k); if (reduceMotion && !im.complete) im.addEventListener('load', () => frame(0), { once: true }); });
      sprites = []; fx = []; ripples = [];
      blobs = Array.from({ length: 14 }, (_, i) => ({ slot: i % 2, a: Math.random() * TAU, r: .15 + Math.random() * .75, hy: Math.random(), s: (.6 + Math.random() * .6) * (i % 3 ? 1 : -1), size: .45 + Math.random() * .4 }));
      $('#stageDesc').textContent = `Pouring ${a.name} and ${b.name} into one glass.`;
      const ready = () => { if (W) layout(); restart(); };
      Promise.all(slots.map((s) => (s.img.complete && s.img.naturalWidth ? null : new Promise((res) => { s.img.onload = s.img.onerror = res; })))).then(ready);
    }

    function restart() {
      if (reduceMotion) { level = .88; amtA = amtB = .44; seedStaticSprites(); frame(0); return; }
      level = 0; amtA = amtB = 0; t0 = clock; sprites = []; fx = []; ripples = [];
      slots.forEach((s) => { s.flowOn = s.flowOff = -1; s.flowing = false; });
      kick();
    }

    // Reduced motion: a still life, glass full, a few ingredients resting above it
    function seedStaticSprites() {
      sprites = kinds.slice(0, 5).map((kind, i, arr) => {
        const f = arr.length > 1 ? i / (arr.length - 1) : .5;
        return { it: { kind }, x: L.cx + (f - .5) * L.R * 1.7, y: L.rimY - L.R * (.55 + .35 * Math.sin(f * Math.PI)), life: 3, max: 6, size: L.R * .4, vy: 0, ph: 0 };
      });
    }

    /* ---------- drawing helpers ---------- */
    const surfY = () => L.rimY + L.depth * (1 - clamp(level) * .9);
    const halfW = (y) => L.R * Math.sqrt(clamp(1 - Math.pow((y - L.rimY) / L.depth, 2)));
    const blend = () => (amtA + amtB > 0 ? mixRgb(slots[0].rgb, slots[1].rgb, amtB / (amtA + amtB)) : [212, 169, 87]);

    function bowlPath() {
      ctx.beginPath();
      ctx.ellipse(L.cx, L.rimY, L.R, L.depth, 0, 0, Math.PI);
      ctx.ellipse(L.cx, L.rimY, L.R, L.R * L.rim, 0, Math.PI, TAU);
      ctx.closePath();
    }

    function drawBottle(s) {
      const { img } = s;
      if (!img.naturalWidth || !s.rest) return;
      // a warm pool of its own colour on the table
      const k = s.k;
      ctx.save();
      ctx.translate(s.rest.x, L.tableY); ctx.scale(1, .2); // a flattened circle = soft elliptical pool
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s.w * 1.1);
      g.addColorStop(0, rgba(s.rgb, .24 * (1 - k * .6))); g.addColorStop(1, rgba(s.rgb, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s.w * 1.1, 0, TAU); ctx.fill();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // soft reflection while standing
      if (k < .5) {
        ctx.globalAlpha = .1 * (1 - k * 2);
        ctx.beginPath(); ctx.rect(s.x - s.w, L.tableY, s.w * 2, s.h * .4); ctx.clip();
        ctx.translate(s.x, L.tableY + (L.tableY - s.y)); ctx.scale(1, -1); ctx.rotate(s.ang);
        ctx.drawImage(img, -s.w / 2, -s.h / 2, s.w, s.h);
      }
      ctx.restore();
      ctx.save();
      ctx.translate(s.x, s.y); ctx.rotate(s.ang);
      ctx.drawImage(img, -s.w / 2, -s.h / 2, s.w, s.h);
      ctx.restore();
    }

    function mouthOf(s) {
      const c = Math.cos(s.ang), si = Math.sin(s.ang);
      return { x: s.x + s.nz[0] * c - s.nz[1] * si, y: s.y + s.nz[0] * si + s.nz[1] * c, u: [si, -c] };
    }

    // the falling stream: a parabola from the mouth to the liquid surface
    function streamPath(s) {
      const m = mouthOf(s), pts = [], sy = surfY();
      const vx = m.u[0] * s.sp, vy = m.u[1] * s.sp;
      for (let t = 0; t < 2; t += .02) {
        const x = m.x + vx * t, y = m.y + vy * t + .5 * s.g * t * t;
        pts.push([x, Math.min(y, sy)]);
        if (y >= sy) break;
      }
      return pts;
    }

    function drawStream(s, now) {
      if (s.flowOn < 0) return;
      const pts = streamPath(s), n = pts.length;
      if (n < 2) return;
      const head = clamp((now - s.flowOn) * 2.6);
      const tail = s.flowOff > 0 ? clamp((now - s.flowOff) * 2.6) : 0;
      if (tail >= 1) { s.flowOn = -1; return; }
      const i0 = Math.floor(tail * (n - 1)), i1 = Math.max(i0 + 1, Math.ceil(head * (n - 1)));
      const w0 = Math.max(2.2, L.R * .05);
      ctx.save();
      ctx.lineCap = 'round';
      // glow
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(s.rgb, .14); ctx.lineWidth = w0 * 3.4;
      ctx.beginPath(); ctx.moveTo(...pts[i0]); for (let i = i0 + 1; i <= i1 && i < n; i++) ctx.lineTo(...pts[i]); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      // body: narrows as it accelerates
      for (let i = i0; i < i1 && i < n - 1; i++) {
        const f = i / (n - 1);
        ctx.lineWidth = w0 * (1 - f * .55);
        ctx.strokeStyle = rgba(mixRgb(light(s.rgb, .25), s.rgb, f), .92);
        ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(...pts[i + 1]); ctx.stroke();
      }
      // travelling highlight
      ctx.setLineDash([w0 * 2, w0 * 5]); ctx.lineDashOffset = -now * 90;
      ctx.strokeStyle = 'rgba(255,250,236,.55)'; ctx.lineWidth = Math.max(.8, w0 * .3);
      ctx.beginPath(); ctx.moveTo(pts[i0][0] - w0 * .2, pts[i0][1]); for (let i = i0 + 1; i <= i1 && i < n; i++) ctx.lineTo(pts[i][0] - w0 * .2, pts[i][1]); ctx.stroke();
      ctx.restore();
      // splash where it meets the blend
      if (head >= 1 && tail === 0 && s.flowing) {
        const e = pts[n - 1];
        if (Math.random() < .35) ripples.push({ x: e[0], t: 0, rgb: s.rgb });
        if (Math.random() < .25) fx.push({ type: 'drop', x: e[0] + (Math.random() - .5) * 6, y: e[1] - 2, vx: (Math.random() - .5) * 50, vy: -40 - Math.random() * 40, r: w0 * .5, c: s.rgb.join(','), life: 0, max: .45 });
      }
    }

    function drawLiquid(dt) {
      if (level <= .005) return;
      const sy = surfY(), hw = halfW(sy), bottom = L.rimY + L.depth, mix = blend();
      const wA = amtA / (amtA + amtB || 1);
      ctx.save();
      bowlPath(); ctx.clip();
      // liquid body = everything under the surface ellipse
      ctx.beginPath();
      ctx.ellipse(L.cx, sy, hw, hw * L.rim, 0, Math.PI, TAU);
      ctx.lineTo(L.cx + L.R, bottom + 2); ctx.lineTo(L.cx - L.R, bottom + 2); ctx.closePath();
      ctx.clip();
      const body = ctx.createLinearGradient(0, sy - hw * L.rim, 0, bottom);
      body.addColorStop(0, rgba(light(mix, .12), .92)); body.addColorStop(.55, rgba(mix, .9)); body.addColorStop(1, rgba(dark(mix, .55), .95));
      ctx.fillStyle = body; ctx.fillRect(L.cx - L.R, sy - hw * L.rim - 2, L.R * 2, bottom - sy + hw * L.rim + 4);
      // swirling clouds of each colour
      for (const b of blobs) {
        const share = b.slot ? 1 - wA : wA;
        if (share <= .02) continue;
        b.a += dt * b.s * (.25 + swirl);
        const depthY = lerp(sy, bottom, .2 + b.hy * .65);
        const x = L.cx + Math.cos(b.a) * b.r * hw, y = depthY + Math.sin(b.a) * b.r * hw * .16;
        const rad = hw * b.size * (.8 + Math.sin(b.a * 2) * .12);
        const c = slots[b.slot].rgb;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, rgba(light(c, .1), .55 * share * 1.6)); g.addColorStop(.6, rgba(c, .25 * share * 1.6)); g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      }
      // marbled ribbons, one per colour, slowly winding together
      ctx.lineCap = 'round';
      slots.forEach((s, si) => {
        const share = si ? 1 - wA : wA;
        if (share < .02) return;
        ctx.strokeStyle = rgba(light(s.rgb, .35), .32 * Math.min(1, share * 2));
        ctx.lineWidth = Math.max(1, hw * .035);
        ctx.beginPath();
        for (let k = 0; k <= 48; k++) {
          const f = k / 48, ang = clock * (.35 + swirl * .8) * (si ? -1 : 1) + si * Math.PI + f * TAU * 1.6;
          const rr = hw * (.15 + f * .75);
          const x = L.cx + Math.cos(ang) * rr, y = lerp(sy, bottom, .35 + f * .25) + Math.sin(ang) * rr * .14;
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      });
      // rising gold bubbles
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 9; k++) {
        const f = ((clock * (.12 + k * .013) + k * .37) % 1);
        const x = L.cx + Math.sin(k * 7.1 + clock * .6) * hw * .7, y = lerp(bottom - 4, sy, f);
        ctx.fillStyle = `rgba(255,236,190,${.35 * Math.sin(f * Math.PI)})`;
        ctx.beginPath(); ctx.arc(x, y, 1 + (k % 3) * .6, 0, TAU); ctx.fill();
      }
      // inner glow
      const gl = ctx.createRadialGradient(L.cx, lerp(sy, bottom, .3), 0, L.cx, lerp(sy, bottom, .3), hw);
      gl.addColorStop(0, rgba(light(mix, .4), .22)); gl.addColorStop(1, rgba(mix, 0));
      ctx.fillStyle = gl; ctx.fillRect(L.cx - L.R, sy - hw, L.R * 2, bottom - sy + hw);
      ctx.globalCompositeOperation = 'source-over';
      // depth: darker towards the bottom and the sides of the bowl
      const shade = ctx.createRadialGradient(L.cx, sy, hw * .2, L.cx, sy, L.R * 1.05);
      shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(10,4,2,.45)');
      ctx.fillStyle = shade; ctx.fillRect(L.cx - L.R, sy - hw, L.R * 2, bottom - sy + hw);
      ctx.restore();

      // the surface (meniscus) with a moving sheen
      ctx.save();
      bowlPath(); ctx.clip();
      const sg = ctx.createLinearGradient(L.cx - hw, sy, L.cx + hw, sy);
      const sh = .5 + Math.sin(clock * .7) * .25;
      sg.addColorStop(0, rgba(light(mix, .15), .85)); sg.addColorStop(clamp(sh - .15), rgba(light(mix, .45), .9));
      sg.addColorStop(sh, rgba(light(mix, .75), .95)); sg.addColorStop(clamp(sh + .15), rgba(light(mix, .45), .9)); sg.addColorStop(1, rgba(light(mix, .1), .85));
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.ellipse(L.cx, sy, hw, hw * L.rim, 0, 0, TAU); ctx.fill();
      // swirl lines on the surface
      ctx.strokeStyle = rgba(dark(mix, .25), .25); ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.ellipse(L.cx, sy, hw * (.3 + k * .2), hw * L.rim * (.3 + k * .2), 0, clock * (.6 - k * .15) + k, clock * (.6 - k * .15) + k + 2.2);
        ctx.stroke();
      }
      // ripples from the streams
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]; r.t += dt;
        if (r.t > 1.2) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(255,246,228,${.35 * (1 - r.t / 1.2)})`;
        ctx.beginPath(); ctx.ellipse(r.x, sy, 4 + r.t * hw * .5, (4 + r.t * hw * .5) * L.rim, 0, 0, TAU); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,248,232,.5)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(L.cx, sy, hw, hw * L.rim, 0, .1, Math.PI - .1); ctx.stroke();
      ctx.restore();
    }

    function drawGlassBack() {
      const { cx, rimY, R } = L;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,240,218,.22)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, rimY, R, R * L.rim, 0, Math.PI, TAU); ctx.stroke();
      // faint glass body
      bowlPath();
      const g = ctx.createRadialGradient(cx, rimY + L.depth * .2, R * .2, cx, rimY, R * 1.05);
      g.addColorStop(0, 'rgba(255,245,230,.015)'); g.addColorStop(1, 'rgba(255,245,230,.09)');
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
    }

    function drawGlassFront() {
      const { cx, rimY, R, depth, footY } = L;
      const bottom = rimY + depth;
      ctx.save();
      // bowl silhouette: edges catch more light than the middle
      const edge = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
      edge.addColorStop(0, 'rgba(255,244,226,.6)'); edge.addColorStop(.25, 'rgba(255,244,226,.18)'); edge.addColorStop(.75, 'rgba(255,244,226,.18)'); edge.addColorStop(1, 'rgba(255,244,226,.5)');
      ctx.strokeStyle = edge; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(cx, rimY, R, depth, 0, 0, Math.PI); ctx.stroke();
      // front rim, thicker and brighter
      ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,246,230,.55)';
      ctx.beginPath(); ctx.ellipse(cx, rimY, R, R * L.rim, 0, 0, Math.PI); ctx.stroke();
      ctx.lineWidth = .8; ctx.strokeStyle = 'rgba(255,246,230,.3)';
      ctx.beginPath(); ctx.ellipse(cx, rimY + 2.5, R * .985, R * L.rim * .97, 0, .15, Math.PI - .15); ctx.stroke();
      // specular streaks
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(255,250,240,.8)'; ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(255,252,244,.55)'; ctx.lineWidth = Math.max(2, R * .035);
      ctx.beginPath(); ctx.ellipse(cx, rimY, R * .88, depth * .86, 0, Math.PI * .62, Math.PI * .9); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,252,244,.3)'; ctx.lineWidth = Math.max(1.2, R * .02);
      ctx.beginPath(); ctx.ellipse(cx, rimY, R * .9, depth * .88, 0, Math.PI * .1, Math.PI * .2); ctx.stroke();
      ctx.shadowBlur = 0;
      // stem: a thin rod of glass that flares into bowl and foot
      const sw = Math.max(2.4, R * .045);
      const sg = ctx.createLinearGradient(cx - sw * 2, 0, cx + sw * 2, 0);
      sg.addColorStop(0, 'rgba(255,244,226,.06)'); sg.addColorStop(.45, 'rgba(255,248,236,.42)'); sg.addColorStop(.55, 'rgba(255,248,236,.5)'); sg.addColorStop(1, 'rgba(255,244,226,.06)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(cx - sw * 2.6, bottom - 3);
      ctx.quadraticCurveTo(cx - sw * .6, bottom + 6, cx - sw * .5, bottom + L.stemH * .45);
      ctx.quadraticCurveTo(cx - sw * .55, footY - R * .1, cx - sw * 3, footY - 2);
      ctx.lineTo(cx + sw * 3, footY - 2);
      ctx.quadraticCurveTo(cx + sw * .55, footY - R * .1, cx + sw * .5, bottom + L.stemH * .45);
      ctx.quadraticCurveTo(cx + sw * .6, bottom + 6, cx + sw * 2.6, bottom - 3);
      ctx.closePath(); ctx.fill();
      // a little of the blend's colour caught in the stem
      if (level > .1) {
        ctx.fillStyle = rgba(blend(), .18 * level);
        ctx.fillRect(cx - sw * .35, bottom, sw * .7, L.stemH * .6);
      }
      // foot
      const fg = ctx.createRadialGradient(cx, footY, 0, cx, footY, R * .64);
      fg.addColorStop(0, 'rgba(255,246,230,.16)'); fg.addColorStop(1, 'rgba(255,246,230,.04)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.ellipse(cx, footY, R * .62, R * .11, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,246,230,.38)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, footY, R * .62, R * .11, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,252,244,.5)';
      ctx.beginPath(); ctx.ellipse(cx, footY, R * .62, R * .11, 0, Math.PI * .15, Math.PI * .55); ctx.stroke();
      ctx.restore();
    }

    function drawAmbient() {
      const { cx, rimY, R, tableY } = L, mix = blend();
      // halo behind the glass, tinted by the blend as it fills
      const g = ctx.createRadialGradient(cx, rimY, 0, cx, rimY, R * 2.6);
      g.addColorStop(0, rgba(mix, .1 + level * .16)); g.addColorStop(.5, rgba(mix, .04 + level * .05)); g.addColorStop(1, rgba(mix, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // the table: a hairline of light
      const t = ctx.createLinearGradient(0, 0, W, 0);
      t.addColorStop(0, 'rgba(212,169,87,0)'); t.addColorStop(.5, 'rgba(242,213,155,.4)'); t.addColorStop(1, 'rgba(212,169,87,0)');
      ctx.fillStyle = t; ctx.fillRect(0, tableY, W, 1);
      // caustic: light through the liquid onto the table
      if (level > .05) {
        ctx.save(); ctx.translate(cx + R * .25, tableY + 3); ctx.scale(1, .13);
        const c = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.1);
        c.addColorStop(0, rgba(light(mix, .3), .32 * level)); c.addColorStop(1, rgba(mix, 0));
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, R * 1.1, 0, TAU); ctx.fill();
        ctx.restore();
      }
    }

    function drawSpecks(dt) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const p of specks) {
        p.y -= p.s * dt; p.a += dt * .8;
        if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
        ctx.fillStyle = `rgba(242,213,155,${.18 + Math.sin(p.a) * .14})`;
        ctx.beginPath(); ctx.arc(p.x + Math.sin(p.a) * 4, p.y, p.r, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    // ingredients drift up out of the blend, turning in their own way
    let spawnT = 0, spawnI = 0;
    function updateSprites(dt) {
      if (!reduceMotion && level > .3 && kinds.length) {
        spawnT -= dt;
        if (spawnT <= 0 && sprites.length < 9) {
          spawnT = .85 + Math.random() * .6;
          const sy = surfY(), hw = halfW(sy);
          sprites.push({ it: { kind: kinds[spawnI++ % kinds.length] }, x: L.cx + (Math.random() - .5) * hw * 1.3, y: sy, vy: H * (.045 + Math.random() * .03), ph: Math.random() * TAU, life: 0, max: 6 + Math.random() * 3, size: L.R * (.32 + Math.random() * .16) });
        }
      }
      for (let i = sprites.length - 1; i >= 0; i--) {
        const s = sprites[i];
        s.life += dt;
        if (s.life > s.max) { sprites.splice(i, 1); continue; }
        s.y -= s.vy * dt;
        s.x += Math.sin(s.life * .9 + s.ph) * dt * L.R * .12;
        const f = s.life / s.max;
        const a = reduceMotion ? .95 : Math.min(1, f * 5) * Math.min(1, (1 - f) * 2.5);
        const grow = reduceMotion ? 1 : .55 + .45 * Math.min(1, f * 3);
        Art.draw(ctx, s.it, s.x, s.y, s.size * grow, a, dt, reduceMotion ? null : fx);
      }
    }

    function updateSlots(now, dt) {
      slots.forEach((s, i) => {
        if (!s.rest) return;
        let k = 0, flowing = false;
        if (!reduceMotion) {
          const t = now - t0 - s.start;
          if (t < 0) k = 0;
          else if (t < TILT) k = easeIO(t / TILT);
          else if (t < TILT + POUR) k = 1;
          else if (t < TILT + POUR + BACK) k = 1 - easeIO((t - TILT - POUR) / BACK);
          flowing = t > TILT * .82 && t < TILT + POUR;
          if (flowing && !s.flowing) { s.flowOn = now; s.flowOff = -1; }
          if (!flowing && s.flowing) s.flowOff = now;
          s.flowing = flowing;
          if (flowing && now - s.flowOn > .4) {
            const add = dt * .44 / POUR;
            if (i) amtB += add; else amtA += add;
            level = clamp(amtA + amtB, 0, .9);
            stir = 1;
          }
        }
        s.k = k;
        const lift = Math.sin(k * Math.PI) * H * .05;
        s.x = lerp(s.rest.x, s.pour.x, k);
        s.y = lerp(s.rest.y, s.pour.y, k) - lift;
        s.ang = s.th * k + (k > .98 ? Math.sin(now * 1.6 + i) * .025 : 0);
      });
      stir = Math.max(0, stir - dt * .35);
      swirl = lerp(swirl, .15 + stir * 1.4, Math.min(1, dt * 2));
    }

    function frame(dt) {
      if (!W || !L) return;
      clock += dt;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      updateSlots(clock, dt);
      drawAmbient();
      if (!reduceMotion) drawSpecks(dt);
      drawGlassBack();
      // the bottle that's pouring sits above the glass; draw the resting one first
      [...slots].sort((x, y) => x.k - y.k).forEach(drawBottle);
      slots.forEach((s) => drawStream(s, clock));
      drawLiquid(dt);
      updateSprites(dt);
      drawGlassFront();
      if (fx.length) Art.drawFx(ctx, fx, dt);
    }

    function loop(t) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(.05, (t - (last || t)) / 1000);
      last = t;
      frame(dt);
      raf = requestAnimationFrame(loop);
    }
    function kick() { if (!reduceMotion && !raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } }

    // run only while on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) kick(); }, { rootMargin: '80px' }).observe(stage);
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
    let rT;
    new ResizeObserver(() => { clearTimeout(rT); rT = setTimeout(resize, 60); }).observe(stage);
    resize();
    // art loads async: repaint the still life once it's ready
    if (reduceMotion) setTimeout(() => frame(0), 400);

    $('#pourAgain').addEventListener('click', restart);
    if (reduceMotion) $('#pourAgain').style.display = 'none';
    return { load, restart };
  })();

  /* ============================================================
     5. The reading: radar, notes, score, how to wear, shop
     ============================================================ */
  const svgNS = 'http://www.w3.org/2000/svg';
  const radar = $('.ll-radar');
  const RC = { x: 170, y: 166, r: 94 }; // leaves room for eight labels, the widest sit on the horizontal and diagonals
  const axisPt = (i, v) => { const a = -Math.PI / 2 + (i / FK.length) * TAU; return [RC.x + Math.cos(a) * RC.r * v, RC.y + Math.sin(a) * RC.r * v]; };
  const ptsStr = (vals) => vals.map((v, i) => axisPt(i, Math.max(.04, v)).map((n) => n.toFixed(1)).join(',')).join(' ');
  (function buildRadar() {
    let g = '';
    [.25, .5, .75, 1].forEach((v) => (g += `<polygon class="ring" points="${ptsStr(FK.map(() => v))}"/>`));
    FK.forEach((k, i) => {
      const [x, y] = axisPt(i, 1), [lx, ly] = axisPt(i, 1.18);
      const anchor = Math.abs(lx - RC.x) < 8 ? 'middle' : lx > RC.x ? 'start' : 'end';
      g += `<line class="axis" x1="${RC.x}" y1="${RC.y}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
      g += `<text class="lbl" x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anchor}"><tspan fill="${FAM[k].color}">●</tspan> ${FAM[k].label}</text>`;
    });
    g += '<polygon class="poly poly-blend" /><polygon class="poly poly-a" /><polygon class="poly poly-b" />';
    radar.insertAdjacentHTML('beforeend', g);
  })();
  const polys = { a: $('.poly-a', radar), b: $('.poly-b', radar), blend: $('.poly-blend', radar) };
  let radarVals = { a: FK.map(() => 0), b: FK.map(() => 0), blend: FK.map(() => 0) }, radarRaf = 0;

  function drawRadar(ca, cb) {
    const fa = profile(A), fb = profile(B);
    const sum = FK.map((k) => fa[k] + fb[k]), mx = Math.max(...sum) || 1;
    const target = { a: FK.map((k) => fa[k]), b: FK.map((k) => fb[k]), blend: sum.map((v) => v / mx) };
    polys.a.style.setProperty('--c', rgba(ca, 1)); polys.b.style.setProperty('--c', rgba(cb, 1));
    const from = radarVals;
    cancelAnimationFrame(radarRaf);
    const t0 = performance.now(), dur = reduceMotion ? 0 : 900;
    (function step(now) {
      const f = dur ? easeOut(clamp((now - t0) / dur)) : 1;
      Object.keys(polys).forEach((key) => {
        const v = target[key].map((x, i) => lerp(from[key][i], x, f));
        polys[key].setAttribute('points', ptsStr(v));
        radarVals[key] = v;
      });
      if (f < 1) radarRaf = requestAnimationFrame(step);
    })(t0);
    $('.ll-legend').innerHTML = `
      <li><i style="background:${rgba(ca, 1)}"></i>${esc(A.name)}</li>
      <li><i style="background:${rgba(cb, 1)}"></i>${esc(B.name)}</li>
      <li><i class="gold-i"></i>Together</li>`;
  }

  const ingChip = (k) => {
    const kind = Art.forIngredient(k)[0];
    return `<li><img src="${Art.url(kind)}" alt="" width="28" height="28"><span>${esc((ING[k] || { label: k }).label)}</span></li>`;
  };

  let scoreRaf = 0;
  function renderReading(ca, cb) {
    drawRadar(ca, cb);
    // order by weight: the heavier, base-rich one is applied first
    const h = harmony(A, B);
    const scoreEl = $('#scoreNum'), ring = $('.ll-score .val');
    const C = 2 * Math.PI * 52;
    ring.style.strokeDasharray = C.toFixed(1);
    ring.style.strokeDashoffset = (C * (1 - h.score / 100)).toFixed(1);
    cancelAnimationFrame(scoreRaf);
    const from = Number(scoreEl.textContent) || 0, t0 = performance.now();
    (function count(now) {
      const f = reduceMotion ? 1 : easeOut(clamp((now - t0) / 1100));
      scoreEl.textContent = Math.round(lerp(from, h.score, f));
      if (f < 1) scoreRaf = requestAnimationFrame(count);
    })(t0);
    $('#scoreTitle').textContent = h.title;
    $('#scoreReason').textContent = h.line;

    // shared vs what each adds
    const onlyA = A.ingredients.filter((k) => !B.ingredients.includes(k));
    const onlyB = B.ingredients.filter((k) => !A.ingredients.includes(k));
    $('[data-adds="a"]').textContent = `What ${A.name} adds`;
    $('[data-adds="b"]').textContent = `What ${B.name} adds`;
    $('[data-ings="a"]').innerHTML = onlyA.length ? onlyA.map(ingChip).join('') : '<li class="none">Nothing new: it all lives in the other</li>';
    $('[data-ings="b"]').innerHTML = onlyB.length ? onlyB.map(ingChip).join('') : '<li class="none">Nothing new: it all lives in the other</li>';
    $('[data-ings="shared"]').innerHTML = h.shared.length ? h.shared.map(ingChip).join('') : '<li class="none">None. A true contrast.</li>';
    $('[data-adds="a"]').closest('.ll-notes-col').style.setProperty('--c', rgba(ca, 1));
    $('[data-adds="b"]').closest('.ll-notes-col').style.setProperty('--c', rgba(cb, 1));

    renderWear();
    renderShop(ca, cb);
  }

  /* How to wear: oils go on first (they anchor a spray); otherwise the heavier,
     base-rich one goes on pulse points first and the lighter one is misted over it. */
  function renderWear() {
    let first = A, second = B;
    const attarA = A.type === 'attar', attarB = B.type === 'attar';
    if (attarA !== attarB) { if (attarB) { first = B; second = A; } } else if (heaviness(B) > heaviness(A)) { first = B; second = A; }
    const apply1 = first.type === 'attar' ? 'Press a single touch of' : 'Spray one mist of';
    const apply2 = second.type === 'attar'
      ? `Touch <b>${esc(second.name)}</b> lightly over the same places. Don’t rub; let the oils meet on their own.`
      : `Mist <b>${esc(second.name)}</b> over it from a hand’s length away, so it falls like a veil.`;
    const why = first.type === 'attar' && second.type !== 'attar' ? 'The oil holds the spray close and makes it last.' : 'Heavier base notes underneath, lighter ones on top: that’s how a perfume is built.';
    $('#wear').innerHTML = `
      <li><span>First</span><p>${apply1} <b>${esc(first.name)}</b> on your pulse points: inner wrists and the base of the throat. Give it a minute to settle.</p></li>
      <li><span>Then</span><p>${apply2} <em>${why}</em></p></li>
      <li><span>Or</span><p>Let them meet as you move: <b>${esc(first.name)}</b> on the wrists, <b>${esc(second.name)}</b> at the neck.</p></li>`;
  }

  function renderShop(ca, cb) {
    const priced = [A, B].filter((p) => p.price != null);
    const total = priced.reduce((s, p) => s + p.price, 0);
    $('#shopPair').innerHTML = [[A, ca], [B, cb]].map(([p, c]) => `
      <div class="ll-shop-item" style="--c:${rgba(c, 1)}">
        <img src="${p.image}" alt="${esc(p.name)}">
        <div><b>${esc(p.name)}</b><small>${esc(p.size)}</small></div>
        <span class="ll-shop-price">${p.price != null ? money(p.price) : 'By invitation'}</span>
      </div>`).join('') +
      (priced.length ? `<div class="ll-shop-total"><span class="eyebrow">${priced.length === 2 ? 'The pair' : 'Available now'}</span><b>${money(total)}</b></div>` : '');
    const add = $('#addBoth');
    add.textContent = priced.length === 2 ? 'Add both to bag' : priced.length ? `Add ${priced[0].name} to bag` : 'Join the waitlist';
    $('[data-feel-slot="a"]').textContent = `Feel ${A.name}`;
    $('[data-feel-slot="b"]').textContent = `Feel ${B.name}`;
  }

  $('#addBoth').addEventListener('click', () => {
    const priced = [A, B].filter((p) => p.price != null), invite = [A, B].filter((p) => p.price == null);
    priced.forEach((p) => window.GibCart.add(p.id));
    if (!invite.length) { window.GibUI.toast(`${A.name} and ${B.name} are in your bag`); return; }
    window.GibUI.toast(priced.length
      ? `${priced[0].name} is in your bag. ${invite[0].name} is by invitation only, so we’ve kept your place on the waitlist.`
      : 'Both are by invitation only. We’ve kept your place on the waitlist and will write when they’re ready.');
  });
  $$('[data-feel-slot]').forEach((b) => b.addEventListener('click', () => {
    const p = b.dataset.feelSlot === 'a' ? A : B;
    if (window.GibExperience) window.GibExperience.open(p.id);
  }));

  /* ---------- Pairings we love ---------- */
  $('#loves').innerHTML = loves.map((pr, i) => {
    const ca = colourFor(pr.a, pr.b, false), cb = colourFor(pr.b, pr.a, true);
    return `
      <button type="button" class="ll-love reveal" data-delay="${(i % 3) + 1}" data-a="${pr.a.id}" data-b="${pr.b.id}" aria-label="Load ${esc(pr.a.name)} and ${esc(pr.b.name)} into the lab">
        <span class="ll-love-bottles" style="--ca:${rgba(ca, 1)};--cb:${rgba(cb, 1)}">
          <img src="${pr.a.image}" alt="" loading="lazy"><img src="${pr.b.image}" alt="" loading="lazy">
        </span>
        <span class="ll-love-score"><b>${pr.h.score}</b><small>harmony</small></span>
        <span class="ll-love-names">${esc(pr.a.name)} <i>+</i> ${esc(pr.b.name)}</span>
        <span class="ll-love-why">${esc(pr.h.title)}</span>
        <span class="ll-love-cta">Pour this pair</span>
      </button>`;
  }).join('');
  $('#loves').addEventListener('click', (e) => {
    const c = e.target.closest('.ll-love');
    if (c) setPair(byId(c.dataset.a), byId(c.dataset.b), { scroll: true });
  });
  window.gibObserveReveals($('#loves'));

  setPair(A, B, { smooth: false });
});

/* ---------- 3D bottles: render each fragrance once with GibBottle3D and swap the pictures in ---------- */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return;
  const start = () => {
    const sc = document.createElement('script');
    sc.src = 'assets/js/bottle3d.js';
    sc.onload = async () => {
      if (!window.GibBottle3D || !window.GibLayering) return;
      for (const p of window.GIB_PRODUCTS.filter((x) => x.type !== 'ritual')) {
        try {
          const url = await window.GibBottle3D.snapshot(p, 420, 640, { quality: 'low' });
          window.GibLayering.setThumb(p.id, url);
        } catch (_) { /* keep the photo */ }
        await new Promise((r) => setTimeout(r, 30));
      }
    };
    document.body.appendChild(sc);
  };
  (window.requestIdleCallback || ((f) => setTimeout(f, 800)))(start, { timeout: 2500 });
})();
