/* ============================================================
   GIBERISH — Scent Journey
   How a fragrance unfolds on skin, from the first minute to ten hours.
   Scroll (GSAP ScrollTrigger, smoothed like a scrub) or drag the golden
   timeline. The bottle stays centre stage while the notes of the current
   phase drift around it and the atmosphere moves from bright and sparkling
   (top) to warm and blooming (heart) to deep, smoky and intimate (base).
   Deep link: journey.html?p=<product-id>
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ING = window.GIB_INGREDIENTS, FAM = window.GIB_FAMILIES, Art = window.GibArt;
  const P = window.GIB_PRODUCTS.filter((p) => p.type !== 'ritual'); // rituals scent a room, not skin
  const byId = (id) => P.find((p) => p.id === id);
  const money = window.gibMoney;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); }; // smoothstep
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
  const rgb = (c) => c.map((v) => Math.round(v)).join(',');

  /* ============================================================
     1. Time: progress p (0–1 along the timeline) ↔ minutes on skin
     The three phases get a fair share of the timeline even though
     the base lasts far longer than the top.
     ============================================================ */
  const P_TOP = .28, P_HEART = .62; // where 15 min and 3 h sit on the timeline
  const minutesAt = (p) => (p <= P_TOP ? 15 * p / P_TOP : p <= P_HEART ? 15 + 165 * (p - P_TOP) / (P_HEART - P_TOP) : 180 + 420 * (p - P_HEART) / (1 - P_HEART));
  function clockText(m) {
    if (m < 1) return 'Just applied';
    if (m < 60) return `${Math.round(m)} min`;
    const step = m < 180 ? 5 : 15, r = Math.round(m / step) * step, h = Math.floor(r / 60), mm = r % 60;
    return mm ? `${h} h ${mm} min` : `${h} h`;
  }
  // how present each phase is at p: they overlap a little, like real notes do
  const weights = (p) => { const top = 1 - ss(.2, .32, p), base = ss(.55, .67, p); return [top, clamp(1 - top - base), base]; };
  const phaseAt = (p) => (p < P_TOP ? 0 : p < P_HEART ? 1 : 2);
  const PHASE_P = [.1, .45, .84]; // where the phase buttons jump to

  const PHASES = [
    { key: 'top', k: 'Top notes · the first 15 minutes', name: 'The <em>opening</em>', desc: 'Bright and fleeting. The lightest notes lift off your skin first: the sparkle people notice as you walk in.',
      // atmosphere: glow, mid, outer (rgb), light, particle density
      glow: [255, 238, 196], mid: [120, 98, 52], outer: [26, 20, 11], light: 1, density: 1, beam: .9, bottle: 1.08, speed: .34 },
    { key: 'heart', k: 'Heart notes · 15 minutes to 3 hours', name: 'The <em>heart</em>', desc: 'The character arrives. As the brightness fades, the heart blooms and warms with your skin.',
      glow: [246, 170, 120], mid: [104, 42, 26], outer: [24, 9, 7], light: .82, density: .55, beam: .35, bottle: 1, speed: .17 },
    { key: 'base', k: 'Base notes · 3 hours and beyond', name: 'The <em>drydown</em>', desc: 'Deep, close and lasting. The heaviest notes settle in and stay for hours, on your skin and in memory.',
      glow: [176, 104, 50], mid: [46, 22, 11], outer: [8, 5, 3], light: .55, density: .2, beam: 0, bottle: .86, speed: .08 },
  ];

  /* ============================================================
     2. Notes → ingredients → art
     ============================================================ */
  // note labels that aren't catalogue ingredient names
  const NOTE_KEY = { spices: 'cardamom', floral: 'rose', patchouli: 'cedar', 'smoked birch': 'smoke', incense: 'smoke', 'white musk': 'musk', cedarwood: 'cedar',
    'black pepper': 'cardamom', woods: 'cedar', 'violet leaf': 'green', iris: 'jasmine', ambergris: 'amber',
    // fruit, flower, sweet and wood notes as perfumers write them
    apple: 'apple', 'black currant': 'blackcurrant', cassis: 'blackcurrant', berries: 'raspberry', 'red berries': 'raspberry', strawberry: 'raspberry',
    peony: 'peony', 'orange blossom': 'orangeblossom', neroli: 'orangeblossom', orchid: 'orchid',
    'cotton candy': 'candy', 'pink cotton candy': 'candy', 'spun sugar': 'candy', sugar: 'candy', 'marshmallow fluff': 'marshmallow',
    tonka: 'tonka', 'salted caramel': 'caramel', cocoa: 'cocoa', 'cocoa truffle': 'cocoa', 'dark cocoa truffle': 'cocoa', chocolate: 'cocoa', 'dark chocolate': 'cocoa',
    coffee: 'coffee', espresso: 'coffee', 'roasted espresso': 'coffee', mocha: 'coffee', 'mocha crema': 'coffee', hazelnut: 'praline', praline: 'praline',
    cashmere: 'cashmere', cashmeran: 'cashmere', bergamot: 'bergamot' };
  const NOTE_ART = { spices: ['cinnamon', 'anise'], floral: ['petal', 'jasmine'], patchouli: ['leaf'], 'smoked birch': ['smoke', 'sandalwood'],
    'black pepper': ['anise'], woods: ['sandalwood', 'oud'], 'violet leaf': ['leaf'], iris: ['jasmine', 'musk'],
    hazelnut: ['hazelnut'], mocha: ['coffee', 'cocoa'], 'mocha crema': ['coffee', 'cocoa'], neroli: ['orangeblossom', 'leaf'] };
  // where each catalogue ingredient naturally sits in a perfume (used to enrich short note lists)
  const NATURAL = { citrus: 0, cardamom: 0, saffron: 0, rose: 1, jasmine: 1, leather: 1, oud: 2, amber: 2, vanilla: 2, musk: 2, sandalwood: 2, cedar: 2, smoke: 2, green: 0,
    apple: 0, peach: 0, raspberry: 0, blackcurrant: 0, bergamot: 0, peony: 1, orangeblossom: 1, orchid: 1,
    candy: 1, marshmallow: 1, caramel: 1, coffee: 1, tonka: 2, cocoa: 2, praline: 2, cashmere: 2, vetiver: 2 };
  const keyOf = (label) => { const l = label.toLowerCase(); return NOTE_KEY[l] || Object.keys(ING).find((k) => k === l || ING[k].label.toLowerCase() === l) || null; };
  const artOf = (label) => { const l = label.toLowerCase(); if (NOTE_ART[l]) return NOTE_ART[l]; const k = keyOf(label); return k ? Art.forIngredient(k) : ['musk']; };

  function phaseInfo(p) {
    return PHASES.map((ph, i) => {
      const labels = p.notes[ph.key] || [];
      const keys = labels.map(keyOf).filter(Boolean);
      let kinds = labels.flatMap(artOf);
      // add the product's own ingredients that belong to this phase, if they're not named already
      p.ingredients.filter((k) => NATURAL[k] === i && !keys.includes(k)).forEach((k) => { keys.push(k); kinds.push(Art.forIngredient(k)[0]); });
      kinds = [...new Set(kinds)].slice(0, 5);
      if (!kinds.length) kinds = ['musk'];
      // tint the phase light with the family these notes belong to
      const fam = {};
      keys.forEach((k) => Object.entries((ING[k] || {}).family || {}).forEach(([f, w]) => (fam[f] = (fam[f] || 0) + w)));
      const dom = Object.keys(fam).sort((a, b) => fam[b] - fam[a])[0];
      const tint = dom ? hex(FAM[dom].color) : ph.glow;
      return { labels: labels.length ? labels : keys.map((k) => ING[k].label), kinds, tint };
    });
  }

  /* ============================================================
     3. State + DOM
     ============================================================ */
  const stage = $('#stage'), scroller = $('#journey');
  const back = $('.jr-back'), front = $('.jr-front'), bctx = back.getContext('2d'), fctx = front.getContext('2d');
  const bottleWrap = $('.jr-bottle'), bottleImg = $('.jr-bottle img'), atmos = $('.jr-atmos');
  const slider = $('#slider'), thumb = $('.jr-thumb'), fill = $('.jr-fill');
  let product = byId(new URLSearchParams(location.search).get('p')) || byId('barakkat-rouge-540') || P[0];
  let info = phaseInfo(product);
  let p = 0, target = 0, shownPhase = -1, W = 0, H = 0, dpr = 1, B = { x: 0, y: 0, h: 0, w: 0 };
  let sprites = [], motes = [], puffs = [], fx = [];
  if (reduceMotion) document.documentElement.classList.add('jr-static');

  /* ---------- pickers (in-stage sheet + end of page) ---------- */
  $$('[data-picker]').forEach((rail) => {
    rail.innerHTML = P.map((x) => `
      <button type="button" class="jr-pick" data-id="${x.id}" aria-pressed="false">
        <span class="jr-pick-media"><img src="${x.image}" alt="" loading="lazy" decoding="async"></span>
        <span class="jr-pick-name">${esc(x.name)}</span>
      </button>`).join('');
    rail.addEventListener('click', (e) => {
      const b = e.target.closest('.jr-pick');
      if (!b) return;
      const fromEnd = rail.dataset.picker === 'end';
      setProduct(byId(b.dataset.id));
      togglePicker(false);
      if (fromEnd) goTo(0, true); // start the new journey from the first minute
    });
  });
  const picker = $('#picker'), changeBtn = $('#changeBtn');
  function togglePicker(open) {
    const o = open == null ? picker.hidden : open;
    picker.hidden = !o;
    changeBtn.setAttribute('aria-expanded', o);
    if (o) { const on = $('.jr-pick.is-on', picker); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' }); }
  }
  changeBtn.addEventListener('click', () => togglePicker());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !picker.hidden) togglePicker(false); });
  document.addEventListener('pointerdown', (e) => { if (!picker.hidden && !e.target.closest('#picker, #changeBtn')) togglePicker(false); });

  if (window.GibSound) window.GibSound.mountToggle($('#tools'), () => window.gibProductSound(product));

  function setProduct(x) {
    product = x;
    info = phaseInfo(x);
    try { history.replaceState(null, '', `${location.pathname}?p=${x.id}`); } catch (_) {}
    document.title = `${x.name} · Scent Journey — Giberish`;
    // crossfade the bottle
    bottleWrap.classList.add('swap');
    const im = new Image();
    im.onload = im.onerror = () => setTimeout(() => {
      bottleImg.src = x.image; bottleImg.alt = x.name;
      bottleWrap.classList.remove('swap');
      requestAnimationFrame(measure);
    }, reduceMotion ? 0 : 260);
    im.src = x.image;
    $('.jr-change-img').src = x.image;
    $('.jr-change-name').textContent = x.name;
    $$('.jr-pick').forEach((b) => { const on = b.dataset.id === x.id; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
    buildSprites();
    info.forEach((ph) => ph.kinds.forEach((k) => { const a = Art.image(k); if (reduceMotion && !a.complete) a.addEventListener('load', () => draw(0), { once: true }); }));
    shownPhase = -1;
    renderHud(true);
    renderEnd();
    if (window.GibSound && window.GibSound.isOn()) window.GibSound.setTheme(window.gibProductSound(x));
  }

  /* ---------- phase text, clock, slider ---------- */
  const hud = { k: $('.jr-phase-k'), name: $('.jr-phase-name'), notes: $('.jr-notes'), desc: $('.jr-desc'), phase: $('.jr-phase'), clock: $('.jr-clock-v') };
  let lastClock = '';
  function renderHud(force) {
    const ph = phaseAt(p);
    if (ph !== shownPhase || force) {
      const swap = () => {
        const d = PHASES[ph];
        hud.k.textContent = d.k;
        hud.name.innerHTML = d.name;
        hud.notes.innerHTML = info[ph].labels.map(esc).join('<i> · </i>');
        hud.desc.textContent = d.desc;
        hud.phase.classList.remove('out');
      };
      if (shownPhase < 0 || reduceMotion) swap();
      else { hud.phase.classList.add('out'); clearTimeout(renderHud.t); renderHud.t = setTimeout(swap, 380); }
      shownPhase = ph;
      $$('[data-phase]').forEach((b) => { const on = Number(b.dataset.phase) === ph; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
      stage.dataset.phase = PHASES[ph].key;
    }
    const m = minutesAt(p), txt = clockText(m);
    if (txt !== lastClock) {
      hud.clock.textContent = txt; lastClock = txt;
      slider.setAttribute('aria-valuenow', Math.round(m));
      slider.setAttribute('aria-valuetext', `${txt}, ${PHASES[ph].key} notes`);
    }
    thumb.style.left = (p * 100).toFixed(2) + '%';
    fill.style.width = (p * 100).toFixed(2) + '%';
    stage.classList.toggle('started', p > .025);
    stage.classList.toggle('ended', p > .955);
  }

  /* ---------- atmosphere: interpolate the three phase palettes ---------- */
  function renderAtmos() {
    const w = weights(p);
    const pick = (fn) => PHASES.reduce((acc, ph, i) => { const v = fn(ph, i); return Array.isArray(v) ? acc.map((a, j) => a + v[j] * w[i]) : acc + v * w[i]; }, Array.isArray(fn(PHASES[0], 0)) ? [0, 0, 0] : 0);
    const glow = pick((ph, i) => mix(ph.glow, info[i].tint, i === 0 ? .15 : .4));
    const midc = pick((ph, i) => mix(ph.mid, info[i].tint, .25));
    const s = atmos.style;
    s.setProperty('--glow', rgb(glow));
    s.setProperty('--mid', rgb(midc));
    s.setProperty('--outer', rgb(pick((ph) => ph.outer)));
    s.setProperty('--light', pick((ph) => ph.light).toFixed(3));
    s.setProperty('--beam', pick((ph) => ph.beam).toFixed(3));
    bottleWrap.style.setProperty('--b', pick((ph) => ph.bottle).toFixed(3));
    bottleWrap.style.setProperty('--glow', rgb(glow));
    return { glow, w };
  }

  /* ============================================================
     4. Canvas: drifting notes + particles
     ============================================================ */
  function measure() {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    [back, front].forEach((c) => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    const br = bottleImg.getBoundingClientRect();
    B = { x: br.left - r.left + br.width / 2, y: br.top - r.top + br.height / 2, w: br.width || W * .3, h: br.height || H * .35 };
    buildSprites();
    if (!motes.length) buildParticles();
    if (reduceMotion) draw(0);
  }

  function buildSprites() {
    if (!W) return;
    const small = W < 700;
    const S = Math.min(W * .13, H * .095, 92);
    sprites = info.map((ph, i) => {
      const n = small ? 7 : 10;
      return Array.from({ length: n }, (_, j) => {
        const f = j / n;
        return {
          it: { kind: ph.kinds[j % ph.kinds.length] },
          a: f * TAU + Math.random() * .5, // spread evenly round the bottle
          rx: Math.min(small ? W * .46 : W * .3, B.w / 2 + S * .7 + (small ? W * .1 : W * .04) + Math.random() * (small ? W * .16 : W * .14)),
          ry: .22 + Math.random() * .14,
          yo: (Math.random() - .5) * B.h * (i === 2 ? .5 : .9),
          size: S * (.75 + Math.random() * .45),
          bob: Math.random() * TAU,
          dir: i === 1 && j % 2 ? -1 : 1,
        };
      });
    });
  }

  function buildParticles() {
    // motes: sparkles (top) → pollen glow (heart) → embers (base); each has a density threshold
    motes = Array.from({ length: Math.round(Math.min(130, W / 4)) }, () => ({ x: Math.random(), y: Math.random(), r: Math.random(), z: Math.random(), s: .3 + Math.random() * .7, tw: Math.random() * TAU }));
    puffs = Array.from({ length: 7 }, (_, i) => ({ x: Math.random(), y: Math.random(), s: .5 + Math.random() * .6, ph: i * .9 }));
  }

  function drawMotes(ctx, dt, w, glow, front) {
    const density = PHASES.reduce((a, ph, i) => a + ph.density * w[i], 0);
    const speed = .02 + w[0] * .07 + w[1] * .025;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const m of motes) {
      if ((m.z > .72) !== front) continue;
      if (!reduceMotion) {
        m.y -= dt * speed * m.s * (front ? 1.5 : 1);
        m.x += Math.sin(m.tw) * dt * .004;
        m.tw += dt * (1 + w[0] * 3);
        if (m.y < -.05) { m.y = 1.05; m.x = Math.random(); }
      }
      if (m.r > density) continue;
      const x = m.x * W, y = m.y * H, tw = .5 + .5 * Math.sin(m.tw * 2.2);
      const fade = clamp((density - m.r) * 6);
      // sparkle: a four-point star; heart: a soft bokeh dot; base: a small ember
      const sr = (front ? 2.4 : 1.4) * (.6 + m.s);
      if (w[0] > .05) {
        ctx.globalAlpha = w[0] * fade * (.25 + .75 * tw);
        ctx.fillStyle = '#fff6dc';
        const r = sr * (1.4 + tw * 1.6);
        ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
      }
      if (w[1] > .05) {
        const r = sr * 4 * (front ? 2 : 1);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${rgb(glow)},${.5 * w[1] * fade})`); g.addColorStop(1, `rgba(${rgb(glow)},0)`);
        ctx.globalAlpha = .6 + .4 * tw; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      if (w[2] > .05) {
        ctx.globalAlpha = w[2] * fade * (.35 + .4 * tw);
        ctx.fillStyle = 'rgb(255,150,70)';
        ctx.beginPath(); ctx.arc(x, y, sr * .7, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  // slow smoke for the base phase
  function drawSmoke(ctx, dt, wBase) {
    if (wBase < .02) return;
    ctx.save();
    for (const s of puffs) {
      if (!reduceMotion) { s.y -= dt * .012 * s.s; s.ph += dt * .25; if (s.y < -.3) { s.y = 1.1; s.x = Math.random(); } }
      const x = (s.x + Math.sin(s.ph) * .05) * W, y = s.y * H, r = Math.min(W, H) * (.25 + s.s * .2);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(205,186,165,${.07 * wBase})`); g.addColorStop(1, 'rgba(205,186,165,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  let clock = 0;
  function draw(dt) {
    if (!W) return;
    clock += dt;
    const { glow, w } = renderAtmos();
    [bctx, fctx].forEach((c) => { c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H); });
    drawSmoke(bctx, dt, w[2]);
    drawMotes(bctx, dt, w, glow, false);
    // notes orbit the bottle; the half of the orbit behind it goes on the back canvas
    const blurOk = W >= 700 && !reduceMotion;
    sprites.forEach((set, i) => {
      const wt = w[i];
      if (wt < .01) { set.forEach((s) => { s.a += dt * PHASES[i].speed * s.dir; }); return; }
      const ph = PHASES[i];
      set.forEach((s) => {
        if (!reduceMotion) { s.a += dt * ph.speed * s.dir; s.bob += dt * (i === 0 ? 1.4 : .8); }
        const z = Math.sin(s.a); // −1 far … +1 near
        // top notes lift upwards as they fade, base notes sink low and close
        const lift = i === 0 ? -(1 - wt) * H * .12 : i === 2 ? (1 - wt) * H * .05 : 0;
        const rise = i === 0 ? -B.h * .12 : i === 2 ? B.h * .18 : 0;
        const x = B.x + Math.cos(s.a) * s.rx;
        const y = B.y + rise + s.yo + z * s.rx * s.ry + Math.sin(s.bob) * H * .012 + lift;
        const scale = (.72 + .28 * (z + 1) / 2) * (.8 + .2 * wt) * (i === 1 ? 1 + .06 * Math.sin(s.bob) : 1);
        const ctx = z > 0 ? fctx : bctx;
        const a = Math.pow(wt, 1.3) * (.55 + .45 * (z + 1) / 2);
        Art.draw(ctx, s.it, x, y, s.size * scale, a, reduceMotion ? 0 : dt, reduceMotion ? null : fx, blurOk && z < -.55 ? 1.6 : 0);
      });
    });
    if (fx.length) Art.drawFx(fctx, fx, dt);
    drawMotes(fctx, dt, w, glow, true);
  }

  /* ============================================================
     5. Driving time: scroll (ScrollTrigger), timeline drag, phase buttons
     ============================================================ */
  const hasST = !reduceMotion && window.gsap && window.ScrollTrigger;
  const scrollRange = () => { const r = scroller.getBoundingClientRect(); return { top: r.top + window.scrollY, len: Math.max(1, scroller.offsetHeight - window.innerHeight) }; };
  if (hasST) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.create({ trigger: scroller, start: 'top top', end: 'bottom bottom', onUpdate: (st) => { target = st.progress; } });
  } else if (!reduceMotion) {
    const onScroll = () => { const { top, len } = scrollRange(); target = clamp((window.scrollY - top) / len); };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // move time to q: by scrolling the page (so scroll and timeline never disagree), or directly when static
  function goTo(q, smooth) {
    q = clamp(q);
    if (reduceMotion) { p = target = q; renderHud(); draw(0); return; }
    const { top, len } = scrollRange(), y = top + q * len;
    if (window.gibLenis) window.gibLenis.scrollTo(y, smooth ? { duration: 1.8 } : { immediate: true });
    else window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
    if (!smooth) target = q;
  }

  let dragging = false;
  const qFromX = (x) => { const r = $('.jr-track').getBoundingClientRect(); return clamp((x - r.left) / r.width); };
  slider.addEventListener('pointerdown', (e) => {
    dragging = true; slider.setPointerCapture(e.pointerId); slider.classList.add('dragging');
    goTo(qFromX(e.clientX), false);
  });
  slider.addEventListener('pointermove', (e) => { if (dragging) goTo(qFromX(e.clientX), false); });
  const endDrag = () => { dragging = false; slider.classList.remove('dragging'); };
  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('pointercancel', endDrag);
  slider.addEventListener('keydown', (e) => {
    const step = { ArrowRight: .02, ArrowUp: .02, ArrowLeft: -.02, ArrowDown: -.02, PageUp: .1, PageDown: -.1 }[e.key];
    if (step != null) { e.preventDefault(); goTo(p + step, false); }
    if (e.key === 'Home') { e.preventDefault(); goTo(0, false); }
    if (e.key === 'End') { e.preventDefault(); goTo(1, false); }
  });
  $$('[data-phase]').forEach((b) => b.addEventListener('click', () => goTo(PHASE_P[Number(b.dataset.phase)], true)));

  /* ---------- the loop: runs only while the stage is on screen ---------- */
  let raf = 0, last = 0, visible = true;
  function loop(t) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    // scrub-like smoothing towards the scroll position
    p += (target - p) * Math.min(1, dt * (dragging ? 14 : 5));
    if (Math.abs(target - p) < .0004) p = target;
    renderHud();
    draw(dt);
    raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!reduceMotion && !raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) kick(); }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  let rT;
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 120); });
  bottleImg.addEventListener('load', () => requestAnimationFrame(measure));

  /* ============================================================
     6. End of the journey: shop, feel, begin again
     ============================================================ */
  const ctaAdd = $('[data-cta-add]'), endAdd = $('#endAdd');
  function renderEnd() {
    const x = product, forSale = x.price != null;
    $('#endImg').src = x.image; $('#endImg').alt = x.name;
    $('#endTitle').innerHTML = `${esc(x.name)} <em>stays with you.</em>`;
    $('#endTag').textContent = x.tagline;
    $('#endStory').textContent = x.story;
    $('#endPyr').innerHTML = PHASES.map((ph, i) => `<div class="pyr-row"><b>${['Top', 'Heart', 'Base'][i]}</b><span>${info[i].labels.map(esc).join(', ')}</span></div>`).join('');
    $('#endPrice').innerHTML = forSale ? `${money(x.price)}<small>${esc(x.size)}</small>` : `<span style="font-size:24px">By invitation</span><small>${esc(x.size)}</small>`;
    [ctaAdd, endAdd].forEach((b) => { b.dataset.add = x.id; b.textContent = forSale ? 'Add to bag' : 'Join the waitlist'; });
    $('[data-cta-feel]').textContent = 'Feel it';
  }
  const feel = () => window.GibExperience && window.GibExperience.open(product.id);
  $('[data-cta-feel]').addEventListener('click', feel);
  $('#endFeel').addEventListener('click', feel);
  $('#again').addEventListener('click', () => { if (reduceMotion) { goTo(0); window.scrollTo(0, 0); } else goTo(0, true); });

  setProduct(product);
  measure();
  renderHud(true);
  if (reduceMotion) draw(0); else kick();
});
