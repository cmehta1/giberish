/* ============================================================
   GIBERISH — Scent Alchemy
   A fragrance composer. Visitors drag (or tap) up to five notes
   from the fragrance pyramid into a glowing glass orb:
   · the liquid blends the notes' family colours and rises
   · every note paints its own full-screen effect behind the page
   · the composition gets a poetic name, a family profile and the
     three closest bottles from the collection (cosine similarity)
   · "Blend this for me" adds a bespoke attar to the bag
   Reduced motion: no full-screen effects, the orb just changes colour.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const ING = window.GIB_INGREDIENTS, FAM = window.GIB_FAMILIES, FKEYS = Object.keys(FAM);
  const C = window.GIB_CONFIG, money = window.gibMoney, Art = window.GibArt;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2, MAX = 5;
  const rr = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const toast = (m) => window.GibUI && window.GibUI.toast(m);

  /* ---------- The pyramid ---------- */
  const TIERS = [
    { id: 'top', label: 'Top', sub: 'The first breath', keys: ['citrus', 'cardamom', 'saffron'] },
    { id: 'heart', label: 'Heart', sub: 'The soul of it', keys: ['rose', 'jasmine', 'leather'] },
    { id: 'base', label: 'Base', sub: 'What stays', keys: ['oud', 'sandalwood', 'cedar', 'amber', 'vanilla', 'musk', 'smoke'] },
  ];
  const tierOf = (k) => TIERS.findIndex((t) => t.keys.includes(k));
  const SHORT = { rose: 'Rose', jasmine: 'Jasmine', oud: 'Oud', sandalwood: 'Sandalwood', cedar: 'Cedar', saffron: 'Saffron', amber: 'Amber',
    musk: 'Musk', vanilla: 'Vanilla', citrus: 'Citrus', cardamom: 'Cardamom', leather: 'Leather', smoke: 'Incense' };
  const icon = (k) => Art.url(Art.forIngredient(k)[0]);

  /* ---------- Colour helpers ---------- */
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const FAM_RGB = Object.fromEntries(FKEYS.map((k) => [k, hexRgb(FAM[k].color)]));
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const lighten = (c, k) => c.map((x) => x + (255 - x) * k);
  const darken = (c, k) => c.map((x) => x * (1 - k));
  function mixFamilies(v) {
    let tot = 0; const c = [0, 0, 0];
    FKEYS.forEach((k) => { const w = v[k] || 0; if (!w) return; tot += w; FAM_RGB[k].forEach((x, i) => (c[i] += x * w)); });
    return tot ? c.map((x) => x / tot) : [212, 169, 87];
  }
  // a mix of family colours turns muddy; lift saturation and keep it luminous, like lit liquid
  function vivid(rgb) {
    let [r, g, b] = rgb.map((x) => x / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    s = clamp(s * 1.25 + .12, .3, .85); l = clamp(l, .38, .58);
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  const ingRgb = (k) => vivid(mixFamilies(ING[k].family));

  /* ---------- Composition maths ---------- */
  function vec(notes) {
    const v = Object.fromEntries(FKEYS.map((k) => [k, 0]));
    notes.forEach((n) => Object.entries(ING[n].family).forEach(([f, w]) => (v[f] += w)));
    return v;
  }
  const norm = (v) => Math.sqrt(FKEYS.reduce((a, k) => a + (v[k] || 0) ** 2, 0));
  const dominant = (v) => FKEYS.reduce((a, k) => (v[k] > v[a] ? k : a), FKEYS[0]);
  const PRODUCTS = window.GIB_PRODUCTS.filter((p) => p.type !== 'ritual');
  function matches(notes, v) {
    const nv = norm(v);
    if (!nv) return [];
    return PRODUCTS.map((p) => {
      const f = window.gibProductFamily(p);
      const cos = FKEYS.reduce((a, k) => a + f[k] * v[k], 0) / ((norm(f) || 1) * nv);
      const shared = p.ingredients.filter((k) => notes.includes(k)).length; // tie-break: shared notes
      return { p, cos, shared, score: Math.round(cos * 100) };
    }).sort((a, b) => b.cos - a.cos || b.shared - a.shared).slice(0, 3);
  }

  // Poetic naming: two lead notes (in pyramid order) + a word for the dominant family
  const NOUN = {
    floral: ['Serenade', 'Reverie', 'Garden', 'Bloom'], woody: ['Nocturne', 'Temple', 'Elegy', 'Vespers'],
    amber: ['Elixir', 'Dusk', 'Ember', 'Gold'], fresh: ['Aubade', 'Monsoon', 'Morning', 'Tide'],
    musk: ['Silk', 'Whisper', 'Veil', 'Lullaby'], spicy: ['Caravan', 'Bazaar', 'Saga', 'Fire'],
  };
  const ADJ = { floral: ['Velvet', 'Blushing'], woody: ['Midnight', 'Sacred'], amber: ['Honeyed', 'Golden'],
    fresh: ['Dawn-lit', 'Rain-washed'], musk: ['Silken', 'Moonlit'], spicy: ['Gilded', 'Smouldering'] };
  const LINE = {
    floral: 'Soft-spoken and romantic, like petals left on warm stone.',
    woody: 'Deep and grounded, the quiet of an old temple after the last bell.',
    amber: 'Warm and glowing, like lamplight held in honey.',
    fresh: 'Bright and open, a window thrown wide after rain.',
    musk: 'Close and tender, the scent of clean skin in sunlight.',
    spicy: 'Vivid and daring, a bazaar at dusk with saffron in the air.',
  };
  const listJoin = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  function compose(notes, v) {
    if (!notes.length) return { name: 'An empty vessel', line: 'Add a first note and the glass will begin to glow.', dom: null };
    const dom = dominant(v);
    const h = [...notes].sort().join('').split('').reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7); // stable per set
    const lead = notes.slice(0, 2).sort((a, b) => tierOf(a) - tierOf(b)).map((k) => SHORT[k]);
    const noun = NOUN[dom][h % NOUN[dom].length];
    let name;
    if (notes.length === 1) name = `${ADJ[dom][h % 2]} ${lead[0]}`;
    else if (notes.length === 2 || h % 2) name = `${lead[0]} & ${lead[1]} ${noun}`;
    else name = `${noun} of ${lead[0]} & ${lead[1]}`;
    const rest = notes.slice(2).map((k) => SHORT[k].toLowerCase());
    return { name, line: LINE[dom] + (rest.length ? ` With a whisper of ${listJoin(rest)}.` : ''), dom };
  }
  function soundTheme(notes, v) {
    if (notes.includes('smoke')) return 'temple';
    if (!notes.length) return 'silk';
    return { floral: 'forest', woody: 'night', amber: 'fire', fresh: 'stream', musk: 'silk', spicy: 'bazaar' }[dominant(v)]; // calm themes from sound.js
  }

  /* ---------- DOM ---------- */
  const tray = $('#al-tray'), orbEl = $('#al-orb'), sphere = $('.al-orb-sphere', orbEl);
  const chipsEl = $('#al-chips'), countEl = $('#al-count'), clearBtn = $('#al-clear');
  const nameEl = $('#al-name'), lineEl = $('#al-line'), barsEl = $('#al-bars'), blendBtn = $('#al-blend');
  const grid = $('#al-matches'), live = $('#al-live');

  tray.innerHTML = TIERS.map((t) => `
    <div class="al-tier" data-tier="${t.id}">
      <div class="al-tier-head"><b>${t.label}</b><small>${t.sub}</small></div>
      <div class="al-tier-notes">${t.keys.map((k) => `
        <button type="button" class="al-note" data-key="${k}" aria-pressed="false" style="--c:${css(ingRgb(k))}">
          <span class="al-well"><img src="${icon(k)}" alt="" draggable="false"></span>
          <b>${ING[k].label}</b>
        </button>`).join('')}</div>
    </div>`).join('');
  const noteBtns = [...tray.querySelectorAll('.al-note')];

  barsEl.innerHTML = FKEYS.map((k) => `
    <div class="al-bar" data-f="${k}" style="--c:${FAM[k].color}">
      <span>${FAM[k].label}</span><i><b></b></i><em>0%</em>
    </div>`).join('');
  $('#al-price').textContent = `Hand-blended attar · ${money(C.bespokePrice)}`;

  if (window.GibSound) window.GibSound.mountToggle($('#al-sound'), () => soundTheme(notes, vec(notes)));

  /* ============================================================
     ORB — the glass sphere's inner liquid (canvas). The glass
     itself (highlights, rim, halo) is layered CSS around it.
     ============================================================ */
  const Orb = (() => {
    const cv = $('.al-orb-liquid', orbEl), ctx = cv.getContext('2d');
    let S = 0, dpr = 1, R = 0, c0 = 0, t = 1.2;
    let level = .07, levelT = .07, amp = 0;
    const EMPTY = [212, 169, 87];
    let col = EMPTY.slice(), colT = EMPTY.slice();
    const blobs = [], motes = [], bubbles = [], drops = [], ripples = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      S = sphere.clientWidth;
      if (!S) return;
      cv.width = Math.round(S * dpr); cv.height = Math.round(S * dpr);
      R = S / 2 - .5; c0 = S / 2;
      if (reduce) still();
    }

    function setMix(notes, v) {
      colT = notes.length ? vivid(mixFamilies(v)) : EMPTY.slice();
      levelT = notes.length ? .2 + notes.length * .13 : .07;
      orbEl.style.setProperty('--glow', css(colT));
      // one marbling swirl + one suspended sprite per note
      notes.forEach((k) => {
        if (!blobs.some((b) => b.key === k && b.on)) blobs.push({ key: k, rgb: ingRgb(k), a: 0, on: true, ang: rr(0, TAU), rad: rr(.2, .5), sp: rr(.22, .4) * (Math.random() < .5 ? -1 : 1) });
        if (!motes.some((m) => m.key === k && m.on)) motes.push({ key: k, item: { kind: Art.forIngredient(k)[0] }, a: 0, on: true, ph: rr(0, TAU), rad: rr(.2, .5), sp: rr(.1, .2) * (Math.random() < .5 ? -1 : 1), dy: rr(.3, .7) });
      });
      [blobs, motes].forEach((arr) => arr.forEach((b) => { if (!notes.includes(b.key)) b.on = false; }));
      if (reduce) still();
    }

    // a note falls in from the top of the sphere and splashes
    function drop(k) {
      if (!S) return;
      drops.push({ item: { kind: Art.forIngredient(k)[0] }, x: c0 + rr(-.18, .18) * R, y: c0 - R * .55, vy: 0, s: R * .3 });
      orbEl.classList.remove('is-pulse'); void orbEl.offsetWidth; orbEl.classList.add('is-pulse');
    }

    const surface = () => c0 + R - 2 * R * level;
    const wave = (x) => {
      const u = (x - c0) / R;
      return Math.sin(u * 3 + t * 1.5) * R * (.01 + amp * .05) + Math.sin(u * 5.3 - t * 2.2) * R * (.005 + amp * .03) + u * Math.sin(t * .6) * R * .018;
    };
    const surfY = (x) => surface() + wave(x);

    function surfacePath() {
      ctx.beginPath();
      for (let x = c0 - R, i = 0; x <= c0 + R + 1; x += R / 20, i++) (i ? ctx.lineTo(x, surfY(x)) : ctx.moveTo(x, surfY(x)));
    }

    function splash(x) {
      amp = Math.min(1.2, amp + .8);
      ripples.push({ x, r: 2, a: .6 });
      for (let i = 0; i < 12; i++) bubbles.push({ x: x + rr(-.15, .15) * R, y: surfY(x) + rr(.05, .35) * R, r: rr(.8, 2.4), vy: rr(10, 28), w: rr(0, TAU) });
    }

    function frame(dt) {
      if (!S) return;
      t += dt;
      const k = 1 - Math.exp(-dt * 1.6);
      level += (levelT - level) * k;
      col = col.map((v, i) => v + (colT[i] - v) * k);
      amp *= Math.exp(-dt * 1.4);
      const n = blobs.filter((b) => b.on).length;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      ctx.save();
      ctx.beginPath(); ctx.arc(c0, c0, R, 0, TAU); ctx.clip();

      // glass interior: a deep, faintly tinted space
      let g = ctx.createRadialGradient(c0, c0 * 1.2, R * .1, c0, c0, R);
      g.addColorStop(0, css(col, .12)); g.addColorStop(1, 'rgba(6,4,2,.5)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      // vapour above the liquid
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const vx = c0 + Math.sin(t * .23 + i * 2.1) * R * .35, vy = surface() - R * (.18 + i * .1) + Math.cos(t * .3 + i) * R * .05;
        g = ctx.createRadialGradient(vx, vy, 0, vx, vy, R * .45);
        g.addColorStop(0, css(lighten(col, .4), .07 + n * .01)); g.addColorStop(1, css(col, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      }
      ctx.globalCompositeOperation = 'source-over';

      // ---- liquid ----
      const surf = surface(), lh = c0 + R - surf, mid = surf + lh * .5;
      surfacePath(); ctx.lineTo(c0 + R, S); ctx.lineTo(c0 - R, S); ctx.closePath();
      ctx.save(); ctx.clip();
      g = ctx.createLinearGradient(0, surf - R * .05, 0, c0 + R);
      g.addColorStop(0, css(lighten(col, .18), .78)); g.addColorStop(.4, css(col, .8)); g.addColorStop(1, css(darken(col, .62), .94));
      ctx.fillStyle = g; ctx.fillRect(0, surf - R * .2, S, S);
      // marbling: every note keeps its own colour, swirling slowly through the blend
      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i];
        b.a = clamp(b.a + (b.on ? dt * .5 : -dt * .8));
        if (!b.on && b.a <= 0) { blobs.splice(i, 1); continue; }
        const an = b.ang + t * b.sp, x = c0 + Math.cos(an) * R * b.rad, y = mid + Math.sin(an) * lh * .32;
        g = ctx.createRadialGradient(x, y, 0, x, y, R * .5);
        g.addColorStop(0, css(b.rgb, .6 * b.a)); g.addColorStop(1, css(b.rgb, 0));
        ctx.fillStyle = g; ctx.fillRect(0, surf - R * .2, S, S);
      }
      // swirl streaks, an inner glow (light passing through the liquid) and caustics at the bottom
      ctx.globalCompositeOperation = 'lighter';
      g = ctx.createRadialGradient(c0 - R * .1, mid, 0, c0 - R * .1, mid, Math.max(lh, R * .3) * .9);
      g.addColorStop(0, css(lighten(col, .45), .2)); g.addColorStop(1, css(col, 0));
      ctx.fillStyle = g; ctx.fillRect(0, surf - R * .2, S, S);
      ctx.lineCap = 'round';
      for (let s = 0; s < 3; s++) {
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const th = (i / 40) * 2.6 + t * (.3 + s * .05) + s * 2.1, r = R * (.12 + (i / 40) * .62);
          const x = c0 + Math.cos(th) * r, y = mid + Math.sin(th) * r * .32;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = css(lighten(col, .7), .03 + n * .006); ctx.lineWidth = R * (.03 + s * .015); ctx.stroke();
      }
      g = ctx.createRadialGradient(c0, c0 + R * .8, 0, c0, c0 + R * .8, R * .6);
      g.addColorStop(0, 'rgba(255,238,200,.24)'); g.addColorStop(1, 'rgba(255,238,200,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      ctx.globalCompositeOperation = 'source-over';
      // suspended notes, then a tint so they read as under the surface
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.a = clamp(m.a + (m.on ? dt * .45 : -dt * .9));
        if (!m.on && m.a <= 0) { motes.splice(i, 1); continue; }
        const x = c0 + Math.cos(t * m.sp + m.ph) * R * m.rad;
        const y = clamp(surf + lh * m.dy + Math.sin(t * .7 + m.ph) * lh * .06, surf + R * .12, c0 + R * .82);
        Art.draw(ctx, m.item, x, y, R * .26, .55 * m.a, dt);
      }
      ctx.fillStyle = css(col, .2); ctx.fillRect(0, surf - R * .2, S, S);
      // bubbles
      if (n && Math.random() < dt * (.6 + n * .5)) bubbles.push({ x: c0 + rr(-.5, .5) * R, y: c0 + R * .85, r: rr(.8, 2.2), vy: rr(12, 26), w: rr(0, TAU) });
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.vy * dt; b.x += Math.sin(t * 3 + b.w) * .25;
        if (b.y < surfY(b.x) + 2) { bubbles.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU);
        ctx.strokeStyle = 'rgba(255,250,235,.38)'; ctx.lineWidth = .8; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(b.x - b.r * .4, b.y - b.r * .5, .9, .9);
      }
      ctx.restore();

      // meniscus: a bright line and a soft band where light meets liquid
      surfacePath();
      ctx.strokeStyle = css(lighten(col, .6), .14); ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,246,225,.5)'; ctx.lineWidth = 1.2; ctx.stroke();
      for (let i = ripples.length - 1; i >= 0; i--) {
        const p = ripples[i];
        p.r += R * .5 * dt; p.a -= dt * .6;
        if (p.a <= 0) { ripples.splice(i, 1); continue; }
        ctx.beginPath(); ctx.ellipse(p.x, surfY(p.x), p.r, p.r * .16, 0, 0, TAU);
        ctx.strokeStyle = `rgba(255,246,225,${p.a})`; ctx.lineWidth = 1; ctx.stroke();
      }
      // notes falling in
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.vy += R * 2.4 * dt; d.y += d.vy * dt;
        if (d.y >= surfY(d.x)) { splash(d.x); drops.splice(i, 1); continue; }
        Art.draw(ctx, d.item, d.x, d.y, d.s, 1, dt);
      }

      // sphere shading: glass thickness darkens the edge, a soft rim of light inside it
      g = ctx.createRadialGradient(c0 - R * .18, c0 - R * .22, R * .2, c0, c0, R);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.42)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      ctx.globalCompositeOperation = 'lighter';
      g = ctx.createRadialGradient(c0, c0, R * .86, c0, c0, R);
      g.addColorStop(0, css(lighten(col, .5), 0)); g.addColorStop(1, css(lighten(col, .5), .16));
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      ctx.restore();
    }

    // reduced motion: one settled frame whenever something changes
    function still() {
      level = levelT; col = colT.slice(); amp = 0; drops.length = ripples.length = bubbles.length = 0;
      [blobs, motes].forEach((arr) => { for (let i = arr.length - 1; i >= 0; i--) { if (arr[i].on) arr[i].a = 1; else arr.splice(i, 1); } });
      frame(0);
    }

    return { resize, setMix, drop, frame, still };
  })();

  /* ============================================================
     FX — one full-screen canvas behind the page. Each note owns a
     layer: a burst when it arrives, then a calm ambient loop.
     Layers share the stage (density ∝ 1/√n) so they never shout.
     ============================================================ */
  const FX = (() => {
    const cv = $('.al-fx');
    if (reduce || !cv) { if (cv) cv.remove(); return { add() {}, remove() {}, clear() {}, frame() {}, resize() {}, busy: () => false }; }
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, diag = 1, small = false, D = 1, t = 0, share = 1;
    const O = { x: 0, y: 0, r: 120 };
    const layers = new Map(), cache = {};

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); // full-screen layer: soft by design, lighter on the GPU
      W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      diag = Math.hypot(W, H); small = W < 700; D = small ? .6 : 1;
    }

    /* --- cached sprites --- */
    function glow(rgb) { // soft glowing dot with a hot core
      if (cache['g' + rgb]) return cache['g' + rgb];
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, 'rgba(255,252,240,1)'); rg.addColorStop(.18, `rgba(${rgb},.95)`); rg.addColorStop(.45, `rgba(${rgb},.28)`); rg.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
      return (cache['g' + rgb] = c);
    }
    function puff(rgb) { // soft smoke puff, no core
      if (cache['p' + rgb]) return cache['p' + rgb];
      const c = document.createElement('canvas'); c.width = c.height = 96;
      const g = c.getContext('2d'), rg = g.createRadialGradient(48, 48, 0, 48, 48, 48);
      rg.addColorStop(0, `rgba(${rgb},.6)`); rg.addColorStop(.5, `rgba(${rgb},.24)`); rg.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = rg; g.fillRect(0, 0, 96, 96);
      return (cache['p' + rgb] = c);
    }
    function grain(rgb) { // warm wood-grain light, framed away from the centre
      const key = `w${rgb}|${W}x${H}`;
      if (cache[key]) return cache[key];
      const w = Math.max(200, Math.ceil(W * .5)), h = Math.max(200, Math.ceil(H * .5));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d');
      const knots = Array.from({ length: 4 }, () => ({ x: rr(0, w), y: rr(0, h), r: rr(12, 34) }));
      const n = Math.ceil(h / 5);
      g.lineCap = 'round';
      for (let i = 0; i <= n; i++) {
        const y0 = (i / n) * h + rr(-1.5, 1.5), ph = rr(0, TAU);
        g.beginPath();
        for (let x = -10; x <= w + 10; x += 6) {
          let y = y0 + Math.sin(x * .006 + i * .05) * 10 + Math.sin(x * .021 + ph) * 1.6;
          for (const k of knots) { const dx = x - k.x, dy = y0 - k.y; y += dy * (k.r * k.r) / (dx * dx + dy * dy + k.r * k.r) * .9; }
          x === -10 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.strokeStyle = `rgba(${rgb},${rr(.12, .45).toFixed(2)})`; g.lineWidth = rr(.5, 1.4); g.stroke();
      }
      g.globalCompositeOperation = 'destination-in';
      const m = g.createRadialGradient(w / 2, h * .45, Math.min(w, h) * .12, w / 2, h * .45, Math.max(w, h) * .7);
      m.addColorStop(0, 'rgba(0,0,0,.2)'); m.addColorStop(.6, 'rgba(0,0,0,.85)'); m.addColorStop(1, 'rgba(0,0,0,1)');
      g.fillStyle = m; g.fillRect(0, 0, w, h);
      Object.keys(cache).forEach((k) => { if (k.startsWith('w' + rgb + '|')) delete cache[k]; }); // drop old sizes
      return (cache[key] = c);
    }

    // far-away sprites use a pre-blurred, dimmed copy of the art (a canvas blur filter every frame is costly)
    function farImg(kind) {
      if (cache['f' + kind]) return cache['f' + kind];
      const src = Art.image(kind);
      if (!src.complete || !src.naturalWidth) return null;
      const c = document.createElement('canvas'); c.width = c.height = 96;
      const g = c.getContext('2d');
      g.filter = 'blur(2.5px) brightness(.78)';
      g.drawImage(src, 0, 0, 96, 96);
      c.complete = true; c.naturalWidth = 96; // GibArt.draw checks these on its image
      return (cache['f' + kind] = c);
    }
    const box = (x, y, r) => ctx.fillRect(x - r, y - r, r * 2, r * 2); // fill only a gradient's reach
    const far = (item, z) => {
      if (z < .55 && !small && !item.img) { const f = farImg(item.kind); if (f) item.img = f; }
      return item;
    };

    /* --- small helpers --- */
    const fade = (p, fin = .6, fout = 1.2) => clamp(Math.min(p.life / fin, (p.max - p.life) / fout));
    function emit(L, name, rate, dt, fn) {
      L.acc[name] = (L.acc[name] || 0) + rate * dt;
      while (L.acc[name] >= 1) { L.acc[name]--; fn(); }
    }
    function blit(img, x, y, size, a) {
      if (a <= .002) return;
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    }
    function star(x, y, r, a, rgb = '255,248,224') { // four-point glint
      if (a <= .01 || r <= .2) return;
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = `rgb(${rgb})`;
      ctx.beginPath();
      ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
      blit(glow(rgb), x, y, r * 3.2, a * .5);
    }
    // ingredient art drifting slowly across the stage (far ones dimmer and softer)
    function floaters(L, kinds, n, size, dt, withFx) {
      L.f = L.f || []; L.fx = L.fx || [];
      if (L.on && L.f.length < Math.round(n * D * share + .4)) emit(L, 'f', .45, dt, () => L.f.push({
        item: { kind: kinds[(Math.random() * kinds.length) | 0] }, x: rr(W * .05, W * .95), y: rr(H * .12, H * .95),
        vx: rr(-10, 10), vy: rr(-14, -4), z: rr(.35, 1), life: 0, max: rr(11, 17) }));
      for (let i = L.f.length - 1; i >= 0; i--) {
        const p = L.f[i];
        p.life += dt;
        if (p.life > p.max) { L.f.splice(i, 1); continue; }
        p.x += p.vx * dt * p.z; p.y += p.vy * dt * p.z;
        Art.draw(ctx, far(p.item, p.z), p.x, p.y, size * (small ? .7 : 1) * (.55 + .6 * p.z), fade(p, 1.5, 2) * L.I * (.3 + .5 * p.z), dt, withFx ? L.fx : null);
      }
      if (withFx) Art.drawFx(ctx, L.fx, dt);
    }

    /* --- effects, one per ingredient (z = paint order) --- */
    const petal = (burst) => ({
      item: { kind: Math.random() < .12 ? 'rose' : 'petal' }, th: rr(0, TAU),
      r: burst ? rr(O.r * .4, O.r * .9) : rr(.2, .55) * diag, vr: burst ? rr(140, 300) : rr(4, 14),
      w: rr(.35, .6), z: rr(.45, 1), life: burst ? rr(-.3, 0) : 0, max: burst ? rr(7, 11) : rr(10, 16), fall: rr(4, 12) });

    function wood(rgb) {
      return {
        z: 1, ramp: .55,
        init(L) { L.seed = rr(0, 10); },
        frame(L, dt) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = L.I * (.5 + .5 * share) * (.28 + .07 * Math.sin(t * .35 + L.seed));
          ctx.drawImage(grain(rgb), -W * .04 + Math.sin(t * .05 + L.seed) * W * .03, -H * .02, W * 1.08, H * 1.04);
          if (L.b > 0) { // a slow warm light sweeps across the grain
            const sx = -W * .3 + (1 - L.b) * W * 1.6, lg = ctx.createLinearGradient(sx - W * .25, 0, sx + W * .25, H * .3);
            lg.addColorStop(0, 'rgba(255,200,140,0)'); lg.addColorStop(.5, `rgba(255,200,140,${.1 * L.b * L.I})`); lg.addColorStop(1, 'rgba(255,200,140,0)');
            ctx.globalAlpha = 1; ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
          }
          ctx.globalCompositeOperation = 'source-over';
          floaters(L, ['sandalwood'], 3, 46, dt, true);
        },
      };
    }

    function citrusBurst(L, x, y, n, pw) {
      for (let i = 0; i < n; i++) {
        const a = rr(0, TAU), sp = rr(180, 560) * pw;
        L.p.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80 * pw, r: rr(2.5, 7), c: ['255,170,60', '255,214,90', '255,236,140'][i % 3], life: 0, max: rr(1.6, 2.8) });
      }
      if (pw >= 1) for (let i = 0; i < 2; i++) {
        const a = rr(0, TAU);
        L.s.push({ item: { kind: i ? 'lemon' : 'orange' }, x, y, vx: Math.cos(a) * rr(80, 160), vy: Math.sin(a) * rr(60, 120) - 40, z: rr(.7, 1), life: 0, max: rr(6, 9) });
      }
    }

    const EFFECTS = {
      /* rose → petals swirl around the screen */
      rose: {
        z: 6,
        init(L) { for (let i = 0; i < Math.round(24 * D); i++) L.p.push(petal(true)); },
        frame(L, dt) {
          if (L.on && L.p.length < Math.round(12 * D * share) + 2) emit(L, 'p', 1.4, dt, () => L.p.push(petal(false)));
          for (let i = L.p.length - 1; i >= 0; i--) {
            const p = L.p[i];
            p.life += dt;
            if (p.life > p.max || p.r > diag) { L.p.splice(i, 1); continue; }
            if (p.life < 0) continue;
            p.vr += (8 - p.vr) * (1 - Math.exp(-dt * .9)); p.r += p.vr * dt;
            p.th += p.w * dt * (.4 + 120 / (p.r + 120));
            const x = O.x + Math.cos(p.th) * p.r * 1.15, y = O.y + Math.sin(p.th) * p.r * .72 + p.life * p.fall;
            const s = (small ? 22 : 30) * (.6 + .7 * p.z) * (p.item.kind === 'rose' ? 1.3 : 1);
            Art.draw(ctx, far(p.item, p.z), x, y, s, fade(p, .5) * L.I * (.5 + .5 * p.z), dt);
          }
        },
      },

      /* jasmine → blossoms open and drift */
      jasmine: {
        z: 6,
        init(L) {
          for (let i = 0; i < Math.round(9 * D); i++) {
            const a = rr(0, TAU), d = O.r * rr(.6, 1.1);
            L.p.push({ item: { kind: 'jasmine' }, x: O.x + Math.cos(a) * d, y: O.y + Math.sin(a) * d, vx: Math.cos(a) * rr(40, 90), vy: Math.sin(a) * rr(30, 70) - 10, z: rr(.5, 1), life: -i * .08, max: rr(8, 12) });
          }
        },
        frame(L, dt) {
          if (L.on && L.p.length < Math.round(6 * D * share) + 1) emit(L, 'p', .6, dt, () => L.p.push({ item: { kind: 'jasmine' }, x: rr(0, W), y: rr(H * .15, H * .95), vx: rr(-8, 8), vy: rr(-14, -5), z: rr(.4, 1), life: 0, max: rr(9, 14) }));
          for (let i = L.p.length - 1; i >= 0; i--) {
            const p = L.p[i];
            p.life += dt;
            if (p.life > p.max) { L.p.splice(i, 1); continue; }
            if (p.life < 0) continue;
            const k = 1 - Math.exp(-dt * .5);
            p.vx += (Math.sin(t * .3 + i) * 6 - p.vx) * k; p.vy += (-8 - p.vy) * k;
            p.x += p.vx * dt; p.y += p.vy * dt;
            const open = 1 - Math.pow(1 - Math.min(1, p.life / 1.8), 3);
            const s = (small ? 26 : 34) * (.6 + .6 * p.z) * (.25 + .75 * open), a = fade(p, .4, 2) * L.I * (.45 + .5 * p.z);
            ctx.globalCompositeOperation = 'lighter';
            blit(glow('255,248,228'), p.x, p.y, s * 2.4, a * .22);
            ctx.globalCompositeOperation = 'source-over';
            Art.draw(ctx, far(p.item, p.z), p.x, p.y, s, a, dt);
          }
        },
      },

      /* sandalwood / cedar → warm wood-grain light textures */
      sandalwood: wood('232,178,112'),
      cedar: wood('214,140,96'),

      /* oud → dark resin smoke curls */
      oud: {
        z: 3,
        init(L) {
          for (let i = 0; i < Math.round(26 * D); i++) L.p.push({ x: O.x + rr(-.4, .4) * O.r, y: O.y + rr(-.3, .3) * O.r, vx: rr(-40, 40), vy: rr(-60, -20), r0: rr(30, 60), life: -rr(0, 1.2), max: rr(5, 8), seed: rr(0, TAU) });
        },
        frame(L, dt) {
          const g = ctx.createRadialGradient(O.x, O.y, diag * .2, O.x, O.y, diag * .6);
          g.addColorStop(0, 'rgba(8,4,2,0)'); g.addColorStop(1, `rgba(8,4,2,${.42 * L.I * share})`);
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          if (L.on) {
            emit(L, 'b', 3.5 * D * share, dt, () => L.p.push({ x: rr(0, W), y: H + 40, vx: rr(-10, 10), vy: rr(-38, -22), r0: rr(50, 90), life: 0, max: rr(9, 13), seed: rr(0, TAU) }));
            emit(L, 'o', 1.1, dt, () => L.p.push({ x: O.x + rr(-.3, .3) * O.r, y: O.y - O.r * .6, vx: rr(-8, 8), vy: rr(-30, -18), r0: rr(26, 44), life: 0, max: rr(6, 9), seed: rr(0, TAU) }));
          }
          for (let i = L.p.length - 1; i >= 0; i--) {
            const p = L.p[i];
            p.life += dt;
            if (p.life > p.max) { L.p.splice(i, 1); continue; }
            if (p.life < 0) continue;
            p.vx *= Math.exp(-dt * .6);
            p.x += (p.vx + Math.sin(p.life * 1.1 + p.seed) * 26) * dt; p.y += p.vy * dt;
            const r = p.r0 * (1 + p.life * .35), a = fade(p, 1, 2.5) * L.I * (.5 + .5 * share);
            ctx.globalCompositeOperation = 'source-over';
            blit(puff('40,20,12'), p.x, p.y, r * 2, a * .6); // the resin itself
            ctx.globalCompositeOperation = 'screen';
            blit(puff('160,110,76'), p.x + r * .15, p.y - r * .12, r * 1.6, a * .2); // its lit edge
          }
          ctx.globalCompositeOperation = 'source-over';
          floaters(L, ['oud'], 2, 50, dt, true);
        },
      },

      /* citrus → glowing juice droplets burst outward */
      citrus: {
        z: 7,
        init(L) { L.s = []; L.fx = []; L.next = rr(3.5, 5.5); citrusBurst(L, O.x, O.y, Math.round(48 * D), 1); },
        frame(L, dt) {
          if (L.on && (L.next -= dt) <= 0) {
            L.next = rr(4, 7) / share;
            const a = rr(0, TAU);
            citrusBurst(L, O.x + Math.cos(a) * O.r * 1.05, O.y + Math.sin(a) * O.r * 1.05, Math.round(12 * D), .45);
          }
          ctx.globalCompositeOperation = 'lighter';
          for (let i = L.p.length - 1; i >= 0; i--) {
            const p = L.p[i];
            p.life += dt;
            if (p.life > p.max) { L.p.splice(i, 1); continue; }
            const k = Math.exp(-dt * 1.6);
            p.vx *= k; p.vy = p.vy * k + 220 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt;
            const sp = Math.hypot(p.vx, p.vy);
            ctx.save();
            ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.scale(1 + Math.min(2.2, sp / 260), 1);
            blit(glow(p.c), 0, 0, p.r * 5, fade(p, .05, .8) * L.I);
            ctx.restore();
          }
          ctx.globalCompositeOperation = 'source-over';
          for (let i = L.s.length - 1; i >= 0; i--) {
            const p = L.s[i];
            p.life += dt;
            if (p.life > p.max) { L.s.splice(i, 1); continue; }
            const k = Math.exp(-dt * .9);
            p.vx *= k; p.vy = p.vy * k + 6 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt;
            Art.draw(ctx, p.item, p.x, p.y, (small ? 40 : 56) * p.z, fade(p, .2, 2) * L.I, dt, L.fx);
          }
          Art.drawFx(ctx, L.fx, dt);
        },
      },

      /* saffron → threads rain down in a gold-red shimmer */
      saffron: {
        z: 6,
        init(L) {
          const thread = (y) => ({ x: rr(0, W), y, vy: rr(70, 150), vx: rr(-10, 10), rot: rr(0, TAU), vr: rr(-1.5, 1.5), len: rr(12, 26), w: rr(1.2, 2.2), life: 0, sh: rr(0, TAU) });
          L.thread = thread;
          for (let i = 0; i < Math.round(70 * D); i++) L.p.push(thread(rr(-H * .5, -10)));
          L.s = []; L.g = [];
          for (let i = 0; i < 3; i++) L.s.push({ item: { kind: 'saffron' }, x: rr(W * .1, W * .9), y: rr(-H * .3, -40), vy: rr(40, 70), z: rr(.6, 1) });
        },
        frame(L, dt) {
          const haze = ctx.createLinearGradient(0, 0, 0, H * .6);
          haze.addColorStop(0, `rgba(220,80,30,${.06 * L.I})`); haze.addColorStop(1, 'rgba(220,80,30,0)');
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1; ctx.fillStyle = haze; ctx.fillRect(0, 0, W, H * .6);
          if (L.on) emit(L, 'th', 7 * D * share, dt, () => L.p.push(L.thread(-20)));
          ctx.lineCap = 'round';
          for (let i = L.p.length - 1; i >= 0; i--) {
            const p = L.p[i];
            p.life += dt; p.y += p.vy * dt; p.x += p.vx * dt; p.rot += p.vr * dt;
            if (p.y > H + 30) { L.p.splice(i, 1); continue; }
            if (p.y < -30) continue;
            const a = L.I * (.6 + .4 * share) * (.55 + .45 * Math.sin(p.life * 5 + p.sh)), x = p.x + Math.sin(p.y * .01 + p.sh) * 8, h = p.len / 2;
            ctx.save();
            ctx.translate(x, p.y); ctx.rotate(p.rot + Math.sin(p.life * 1.2 + p.sh) * .4);
            ctx.globalAlpha = clamp(a);
            ctx.beginPath(); ctx.moveTo(-h, 0); ctx.quadraticCurveTo(0, p.len * .18, h, 0);
            ctx.strokeStyle = 'rgb(196,38,22)'; ctx.lineWidth = p.w; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(h * .45, p.len * .05); ctx.lineTo(h, 0);
            ctx.strokeStyle = 'rgb(255,170,60)'; ctx.lineWidth = p.w * .9; ctx.stroke();
            ctx.restore();
          }
          // gold glints catching on the falling threads
          if (L.p.length) emit(L, 'gl', 3 * share, dt, () => { const p = L.p[(Math.random() * L.p.length) | 0]; if (p.y > 0) L.g.push({ x: p.x, y: p.y, life: 0, max: rr(.5, .9), s: rr(3, 6) }); });
          for (let i = L.g.length - 1; i >= 0; i--) {
            const p = L.g[i];
            p.life += dt;
            if (p.life > p.max) { L.g.splice(i, 1); continue; }
            star(p.x, p.y, p.s * Math.sin(Math.PI * p.life / p.max), L.I * .9, '255,214,140');
          }
          ctx.globalCompositeOperation = 'source-over';
          for (let i = L.s.length - 1; i >= 0; i--) {
            const p = L.s[i];
            p.y += p.vy * dt;
            if (p.y > H + 60) { L.s.splice(i, 1); continue; }
            Art.draw(ctx, p.item, p.x, p.y, (small ? 44 : 60) * p.z, L.I * .9, dt);
          }
        },
      },

      /* amber → a honey-gold glow pulses, with glints */
      amber: {
        z: 2,
        init(L) { L.seed = rr(0, 10); },
        frame(L, dt) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1;
          const pul = .75 + .25 * Math.sin(t * 1.3 + L.seed), rad = diag * .5;
          let g = ctx.createRadialGradient(O.x, O.y, O.r * .6, O.x, O.y, rad);
          g.addColorStop(0, `rgba(240,166,52,${.2 * L.I * share * pul})`); g.addColorStop(.45, `rgba(224,140,40,${.07 * L.I * share * pul})`); g.addColorStop(1, 'rgba(224,140,40,0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          if (L.b > 0) { // a ring of honey light rolls outward on arrival
            const rd = O.r + (1 - L.b) * diag * .55;
            g = ctx.createRadialGradient(O.x, O.y, rd * .8, O.x, O.y, rd);
            g.addColorStop(0, 'rgba(255,196,100,0)'); g.addColorStop(.7, `rgba(255,196,100,${.14 * L.b * L.I})`); g.addColorStop(1, 'rgba(255,196,100,0)');
            ctx.fillStyle = g; box(O.x, O.y, rd);
          }
          if (L.on) emit(L, 'gl', 2.5 * D * share, dt, () => {
            const a = rr(0, TAU), d = rr(O.r * 1.1, diag * .45);
            L.p.push({ x: O.x + Math.cos(a) * d, y: O.y + Math.sin(a) * d * .7, life: 0, max: rr(1.2, 2.2), s: rr(5, 12) });
          });
          for (let i = L.p.length - 1; i >= 0; i--) {
            const p = L.p[i];
            p.life += dt;
            if (p.life > p.max) { L.p.splice(i, 1); continue; }
            star(p.x, p.y, p.s * Math.sin(Math.PI * p.life / p.max), L.I * .85, '255,222,150');
          }
          ctx.globalCompositeOperation = 'source-over';
          floaters(L, ['amber', 'honey'], 3, 44, dt, false);
        },
      },

      /* vanilla → soft creamy swirls */
      vanilla: {
        z: 4,
        init(L) { L.rib = [0, 1, 2].map((i) => ({ ph: (i * TAU) / 3 + rr(-.3, .3), sp: .09, r0: rr(.9, 1.3), k: rr(9, 14), wob: rr(0, TAU) })); },
        frame(L, dt) {
          const grow = 1 - Math.pow(1 - Math.min(1, L.age / 3.5), 3), env = L.I * (.5 + .5 * share);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1;
          const g = ctx.createRadialGradient(O.x, O.y, O.r, O.x, O.y, diag * .4);
          g.addColorStop(0, `rgba(250,236,210,${.06 * env})`); g.addColorStop(1, 'rgba(250,236,210,0)');
          ctx.fillStyle = g; box(O.x, O.y, diag * .4);
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          const N = 56;
          L.rib.forEach((rb) => {
            const pts = [];
            for (let i = 0; i <= N; i++) {
              const th = rb.ph + t * rb.sp + i * .1;
              const r = O.r * rb.r0 + i * rb.k * grow * (small ? .7 : 1) + Math.sin(i * .35 + t * .8 + rb.wob) * 12;
              pts.push([O.x + Math.cos(th) * r * 1.25, O.y + Math.sin(th) * r * .7]);
            }
            for (let j = 0; j < N; j += 8) {
              const e = Math.sin(Math.PI * (j + 4) / N) * env;
              [[46, .022], [20, .04], [5, .07]].forEach(([lw, a]) => {
                ctx.beginPath(); ctx.moveTo(pts[j][0], pts[j][1]);
                for (let q = j + 1; q <= Math.min(N, j + 8); q++) ctx.lineTo(pts[q][0], pts[q][1]);
                ctx.globalAlpha = a * e; ctx.strokeStyle = 'rgb(250,234,200)'; ctx.lineWidth = lw * (small ? .7 : 1); ctx.stroke();
              });
            }
          });
          ctx.globalCompositeOperation = 'source-over';
          floaters(L, ['vanilla'], 2, 54, dt, false);
        },
      },

      /* musk → white sparkles bloom */
      musk: {
        z: 8,
        init(L) {
          const n = Math.round(26 * D);
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU + rr(-.1, .1), rd = rr(O.r * 1.15, O.r * 2.6);
            L.p.push({ x: O.x + Math.cos(a) * rd * 1.1, y: O.y + Math.sin(a) * rd * .8, life: -((rd - O.r) / O.r) * .35, max: rr(1.6, 2.6), s: rr(6, 13) });
          }
        },
        frame(L, dt) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1;
          const g = ctx.createRadialGradient(O.x, O.y, O.r * .8, O.x, O.y, O.r * 3);
          g.addColorStop(0, `rgba(255,250,240,${.08 * L.I * (.8 + .2 * Math.sin(t * 2))})`); g.addColorStop(1, 'rgba(255,250,240,0)');
          ctx.fillStyle = g; box(O.x, O.y, O.r * 3);
          if (L.on) emit(L, 's', 3.2 * D * share, dt, () => L.p.push({ x: rr(0, W), y: rr(0, H), life: 0, max: rr(1.8, 3), s: rr(3, 9) }));
          for (let i = L.p.length - 1; i >= 0; i--) {
            const p = L.p[i];
            p.life += dt;
            if (p.life > p.max) { L.p.splice(i, 1); continue; }
            if (p.life < 0) continue;
            const k = Math.sin(Math.PI * p.life / p.max);
            star(p.x, p.y, p.s * (.4 + .6 * k), k * L.I, '255,253,246');
          }
          ctx.globalCompositeOperation = 'source-over';
          floaters(L, ['musk'], 2, 50, dt, false);
        },
      },

      /* cardamom → green spice dust */
      cardamom: {
        z: 5,
        init(L) {
          for (let i = 0; i < Math.round(90 * D); i++) {
            const a = rr(0, TAU), sp = rr(40, 240);
            L.p.push({ x: O.x + Math.cos(a) * O.r * .3, y: O.y + Math.sin(a) * O.r * .3, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .7, r: rr(1, 3), life: 0, max: rr(4, 8), c: ['176,210,110', '210,230,150', '140,180,80'][i % 3], ph: rr(0, TAU) });
          }
        },
        frame(L, dt) {
          if (L.on) emit(L, 'd', 9 * D * share, dt, () => L.p.push({ x: rr(-20, W), y: rr(0, H), vx: rr(6, 20), vy: rr(-6, 6), r: rr(.8, 2.4), life: 0, max: rr(5, 9), c: ['176,210,110', '210,230,150'][(Math.random() * 2) | 0], ph: rr(0, TAU) }));
          ctx.globalCompositeOperation = 'lighter';
          const k = 1 - Math.exp(-dt * .5);
          for (let i = L.p.length - 1; i >= 0; i--) {
            const p = L.p[i];
            p.life += dt;
            if (p.life > p.max) { L.p.splice(i, 1); continue; }
            p.vx += (14 + Math.sin(p.y * .008 + t * .4) * 16 - p.vx) * k; // a slow breeze
            p.vy += (Math.sin(p.x * .01 + t * .6) * 10 - p.vy) * k;
            p.x += p.vx * dt; p.y += p.vy * dt;
            blit(glow(p.c), p.x, p.y, p.r * 6, fade(p, .3, 1.5) * L.I * (.6 + .4 * share) * (.6 + .4 * Math.sin(p.life * 3 + p.ph)));
          }
          ctx.globalCompositeOperation = 'source-over';
          floaters(L, ['cardamom', 'anise'], 3, 40, dt, false);
        },
      },

      /* leather → a deep, warm vignette closes in */
      leather: {
        z: 0, ramp: .7,
        frame(L, dt) {
          const close = 1 - Math.pow(1 - Math.min(1, L.age / 2.5), 3), br = 1 + .04 * Math.sin(t * .5);
          const inner = diag * (.6 - .3 * close) * .35;
          let g = ctx.createRadialGradient(O.x, O.y, inner, O.x, O.y, diag * .62 * br);
          g.addColorStop(0, 'rgba(30,10,4,0)'); g.addColorStop(.55, `rgba(38,14,5,${.35 * L.I})`); g.addColorStop(1, `rgba(22,8,3,${.72 * L.I})`);
          ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          ctx.globalCompositeOperation = 'lighter';
          g = ctx.createRadialGradient(W / 2, H * 1.1, 0, W / 2, H * 1.1, H * .7);
          g.addColorStop(0, `rgba(160,72,26,${.12 * L.I})`); g.addColorStop(1, 'rgba(160,72,26,0)');
          ctx.fillStyle = g; box(W / 2, H * 1.1, H * .7);
          if (L.on) emit(L, 'e', 1.8 * D * share, dt, () => L.p.push({ x: rr(0, W), y: H + 10, vx: rr(-6, 6), vy: rr(-30, -14), r: rr(1, 2.2), life: 0, max: rr(5, 9), ph: rr(0, TAU) }));
          for (let i = L.p.length - 1; i >= 0; i--) { // slow embers
            const p = L.p[i];
            p.life += dt;
            if (p.life > p.max) { L.p.splice(i, 1); continue; }
            p.x += (p.vx + Math.sin(p.life + p.ph) * 6) * dt; p.y += p.vy * dt;
            blit(glow('255,140,60'), p.x, p.y, p.r * 7, fade(p, .8, 2) * L.I * (.5 + .5 * Math.sin(p.life * 7 + p.ph)));
          }
          ctx.globalCompositeOperation = 'source-over';
          floaters(L, ['cinnamon'], 2, 54, dt, false);
        },
      },

      /* smoke (incense) → thin wisps curl upward */
      smoke: {
        z: 3,
        init(L) {
          L.w = [
            { src: () => [W * .14, H + 6], seed: rr(0, 9), pts: [] },
            { src: () => [W * .86, H + 6], seed: rr(0, 9), pts: [] },
            { src: () => [O.x, O.y - O.r * .98], seed: rr(0, 9), pts: [], weak: true },
          ];
        },
        frame(L, dt) {
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          const life = 9, vs = clamp(H / 800, .7, 1.3);
          L.w.forEach((w, wi) => {
            if (L.on) emit(L, 'w' + wi, 18, dt, () => { const [x, y] = w.src(); w.pts.push({ x, y, vx: rr(-3, 3), vy: rr(-46, -34) * vs, age: 0 }); });
            for (let i = w.pts.length - 1; i >= 0; i--) {
              const p = w.pts[i];
              p.age += dt;
              if (p.age > life || p.y < -40) { w.pts.splice(i, 1); continue; }
              p.x += (p.vx + Math.sin(p.age * 1.3 + w.seed + p.y * .004) * (8 + p.age * 5)) * dt;
              p.y += p.vy * dt; p.vy *= Math.exp(-dt * .08);
            }
            const P = w.pts;
            for (let j = 0; j + 1 < P.length; j += 5) {
              const age = P[Math.min(P.length - 1, j + 2)].age, a = Math.pow(1 - age / life, 1.3) * .22 * L.I * (w.weak ? .6 : 1), lw = 1 + age * 1.4;
              ctx.beginPath(); ctx.moveTo(P[j].x, P[j].y);
              for (let q = j + 1; q <= Math.min(P.length - 1, j + 5); q++) {
                const mx = (P[q - 1].x + P[q].x) / 2, my = (P[q - 1].y + P[q].y) / 2;
                ctx.quadraticCurveTo(P[q - 1].x, P[q - 1].y, mx, my);
              }
              ctx.strokeStyle = 'rgb(236,226,210)';
              ctx.globalAlpha = a * .18; ctx.lineWidth = lw * 4; ctx.stroke();
              ctx.globalAlpha = a; ctx.lineWidth = lw; ctx.stroke();
            }
          });
          floaters(L, ['smoke'], 2, 70, dt, false);
        },
      },
    };

    function measure() {
      const r = sphere.getBoundingClientRect();
      O.x = r.left + r.width / 2; O.y = r.top + r.height / 2; O.r = r.width / 2 || 120;
    }
    function add(key) {
      const e = EFFECTS[key];
      if (!e) return;
      measure();
      const old = layers.get(key);
      const L = { key, e, on: true, I: old ? old.I : 0, age: 0, b: 1, p: [], acc: {} };
      if (e.init) e.init(L);
      layers.set(key, L);
    }
    function remove(key) { const L = layers.get(key); if (L) L.on = false; }
    function clear() { layers.forEach((L) => (L.on = false)); }

    let dirty = false;
    function frame(dt) {
      t += dt;
      if (!layers.size && !dirty) return; // nothing to paint, canvas already clear
      dirty = layers.size > 0;
      measure();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      const all = [...layers.values()];
      share = 1 / Math.sqrt(Math.max(1, all.filter((L) => L.on).length));
      all.sort((a, b) => a.e.z - b.e.z).forEach((L) => {
        L.age += dt; L.b = clamp(1 - L.age / 4.5);
        L.I += ((L.on ? 1 : 0) - L.I) * (1 - Math.exp(-dt * (L.on ? (L.e.ramp || 1.2) : 1.6)));
        if (!L.on && L.I < .01) { layers.delete(L.key); return; }
        ctx.save(); L.e.frame(L, dt); ctx.restore();
      });
    }

    resize();
    return { add, remove, clear, frame, resize, busy: () => layers.size > 0 };
  })();

  /* ---------- Render loop: only while something is visible & moving ---------- */
  let raf = 0, last = 0, orbVisible = true;
  function loop(now) {
    raf = 0;
    const dt = clamp((now - last) / 1000, 0, .05); last = now; // rAF time can precede kick()
    if (orbVisible) Orb.frame(dt);
    FX.frame(dt);
    if (!document.hidden && (orbVisible || FX.busy())) raf = requestAnimationFrame(loop);
  }
  function kick() { if (reduce || raf || document.hidden) return; last = performance.now(); raf = requestAnimationFrame(loop); }
  document.addEventListener('visibilitychange', kick);
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { orbVisible = es[0].isIntersecting; kick(); }).observe(orbEl);
  if ('ResizeObserver' in window) new ResizeObserver(() => Orb.resize()).observe(sphere);
  let rzT;
  window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { FX.resize(); Orb.resize(); }, 120); });
  Orb.resize();
  // sprites decode asynchronously: repaint the still orb once they are ready
  if (reduce) new Set(Object.keys(ING).map((k) => Art.forIngredient(k)[0])).forEach((kind) => Art.image(kind).addEventListener('load', () => Orb.still(), { once: true }));

  /* ============================================================
     STATE + RENDERING
     ============================================================ */
  let notes = [];
  const pending = new Set(); // notes in flight towards the orb
  let lastAdded = null;

  function announce(msg) { live.textContent = ''; setTimeout(() => (live.textContent = msg), 30); }
  function canAdd(key, quiet) {
    if (notes.includes(key) || pending.has(key)) { if (!quiet) toast(`${ING[key].label} is already in your blend`); return false; }
    if (notes.length + pending.size >= MAX) { toast('Five notes is a perfumer’s limit. Remove one to add another.'); return false; }
    return true;
  }
  function addNote(key) {
    pending.delete(key);
    if (notes.includes(key) || notes.length >= MAX) { render(); return; }
    notes.push(key); lastAdded = key;
    if (!reduce) Orb.drop(key);
    FX.add(key);
    render(); kick();
    announce(`${ING[key].label} added. ${compose(notes, vec(notes)).name}. ${notes.length} of ${MAX} notes.`);
  }
  function removeNote(key) {
    if (!notes.includes(key)) return;
    notes = notes.filter((k) => k !== key); lastAdded = null;
    FX.remove(key);
    render(); kick();
    announce(`${ING[key].label} removed. ${notes.length} of ${MAX} notes.`);
  }
  function clearAll() {
    if (!notes.length) return;
    notes = []; lastAdded = null;
    FX.clear();
    render(); kick();
    announce('The orb is empty again.');
  }

  let matchKey = null, swapT = 0;
  const matchHTML = (m) => m.map(({ p, score }) => `
    <div class="match-item al-match" data-mid="${p.id}">${window.gibCard(p)}<span class="chip al-match-chip">${score}% match</span></div>`).join('');
  function renderMatches(v) {
    const m = matches(notes, v), key = m.map((x) => x.p.id).join('|');
    if (key === matchKey) { // same bottles: just refresh the numbers
      m.forEach(({ p, score }) => { const el = grid.querySelector(`[data-mid="${p.id}"] .al-match-chip`); if (el) el.textContent = score + '% match'; });
      return;
    }
    matchKey = key;
    clearTimeout(swapT);
    grid.classList.add('is-swapping');
    swapT = setTimeout(() => {
      const cur = matches(notes, vec(notes));
      grid.innerHTML = cur.length ? matchHTML(cur)
        : '<p class="al-matches-empty">Add a note and the bottles that share its soul will gather here.</p>';
      grid.classList.remove('is-swapping');
    }, reduce || !grid.children.length ? 0 : 320);
  }

  function render() {
    const v = vec(notes), comp = compose(notes, v), full = notes.length + pending.size >= MAX;
    noteBtns.forEach((b) => {
      const k = b.dataset.key, on = notes.includes(k) || pending.has(k);
      b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', `${ING[k].label}${on ? ' (in your blend — press to remove)' : ''}`);
      b.classList.toggle('is-dim', full && !on);
    });
    countEl.textContent = `${notes.length} / ${MAX} notes`;
    clearBtn.disabled = !notes.length;
    orbEl.classList.toggle('has-notes', notes.length > 0);

    chipsEl.innerHTML = notes.length ? notes.map((k) => `
      <li class="al-chip${k === lastAdded ? ' is-new' : ''}" style="--c:${css(ingRgb(k))}">
        <img src="${icon(k)}" alt=""><span>${ING[k].label}</span>
        <button type="button" data-rm="${k}" aria-label="Remove ${ING[k].label}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg></button>
      </li>`).join('') : '<li class="al-chips-empty">Your blend is waiting for its first note</li>';
    lastAdded = null;

    Orb.setMix(notes, v);

    nameEl.textContent = comp.name;
    lineEl.textContent = comp.line;
    const tot = FKEYS.reduce((a, k) => a + v[k], 0) || 1, mx = Math.max(...FKEYS.map((k) => v[k])) || 1;
    FKEYS.forEach((k) => {
      const row = barsEl.querySelector(`[data-f="${k}"]`);
      row.querySelector('b').style.width = (v[k] / mx) * 100 + '%';
      row.querySelector('em').textContent = Math.round((v[k] / tot) * 100) + '%';
      row.classList.toggle('is-lead', !!comp.dom && k === comp.dom);
    });
    blendBtn.disabled = !notes.length;
    renderMatches(v);
    if (window.GibSound) window.GibSound.setTheme(soundTheme(notes, v));
  }

  /* ============================================================
     INTERACTION — drag into the orb (Pointer Events) or tap/Enter
     ============================================================ */
  const overOrb = (x, y) => { const r = sphere.getBoundingClientRect(); return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < r.width * .58; };
  const place = (g, x, y, s = 1) => (g.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${s})`);
  function makeGhost(key, x, y) {
    const g = document.createElement('div');
    g.className = 'al-ghost';
    g.style.setProperty('--c', css(ingRgb(key)));
    g.innerHTML = `<img src="${icon(key)}" alt="">`;
    document.body.appendChild(g);
    place(g, x, y);
    return g;
  }
  function flyToOrb(g, x, y, done) {
    const r = sphere.getBoundingClientRect(), tx = r.left + r.width / 2, ty = r.top + r.height * .24;
    const tf = (px, py, s) => `translate3d(${px}px,${py}px,0) translate(-50%,-50%) scale(${s})`;
    const anim = g.animate([
      { transform: tf(x, y, 1), opacity: 1 },
      { transform: tf((x + tx) / 2, Math.min(y, ty) - 50, .95), opacity: 1, offset: .55 },
      { transform: tf(tx, ty, .35), opacity: 0 },
    ], { duration: 760, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
    anim.onfinish = () => { g.remove(); done(); };
  }
  function flyBack(g, btn) {
    const r = btn.querySelector('img').getBoundingClientRect();
    const anim = g.animate([{ transform: g.style.transform, opacity: 1 }, { transform: `translate3d(${r.left + r.width / 2}px,${r.top + r.height / 2}px,0) translate(-50%,-50%) scale(.8)`, opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'forwards' });
    anim.onfinish = () => g.remove();
  }

  // tap / click / Enter / Space
  let suppressClick = 0;
  tray.addEventListener('click', (e) => {
    const b = e.target.closest('.al-note');
    if (!b || performance.now() < suppressClick) return;
    const key = b.dataset.key;
    if (notes.includes(key)) { removeNote(key); return; }
    if (!canAdd(key)) return;
    if (reduce) { addNote(key); return; }
    const r = b.querySelector('img').getBoundingClientRect();
    pending.add(key); render();
    flyToOrb(makeGhost(key, r.left + r.width / 2, r.top + r.height / 2), r.left + r.width / 2, r.top + r.height / 2, () => addNote(key));
  });

  // drag (mouse, pen, touch). On phones the tray scrolls sideways (touch-action: pan-x),
  // so an upward drag lifts the note; on desktop the tray is a column (pan-y) and you drag sideways.
  let drag = null;
  tray.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.al-note');
    if (!b || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { b, key: b.dataset.key, id: e.pointerId, x0: e.clientX, y0: e.clientY, g: null };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.g) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
      drag.g = makeGhost(drag.key, e.clientX, e.clientY);
      drag.g.classList.add('is-held');
      try { drag.b.setPointerCapture(e.pointerId); } catch (_) {}
      document.body.classList.add('al-dragging');
      orbEl.classList.add('is-armed');
    }
    place(drag.g, e.clientX, e.clientY, 1.08);
    orbEl.classList.toggle('is-hover', overOrb(e.clientX, e.clientY));
  });
  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.g) return; // it was a tap: the click handler takes it
    suppressClick = performance.now() + 450;
    document.body.classList.remove('al-dragging');
    orbEl.classList.remove('is-armed', 'is-hover');
    if (!cancelled && overOrb(e.clientX, e.clientY) && canAdd(d.key, false)) {
      if (reduce) { d.g.remove(); addNote(d.key); return; }
      pending.add(d.key); render();
      flyToOrb(d.g, e.clientX, e.clientY, () => addNote(d.key));
    } else flyBack(d.g, d.b);
  }
  window.addEventListener('pointerup', (e) => endDrag(e, false));
  window.addEventListener('pointercancel', (e) => endDrag(e, true));
  tray.addEventListener('dragstart', (e) => e.preventDefault());

  chipsEl.addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b) removeNote(b.dataset.rm); });
  clearBtn.addEventListener('click', clearAll);
  blendBtn.addEventListener('click', () => {
    if (!notes.length) return;
    const comp = compose(notes, vec(notes));
    window.GibCart.add(null, { name: `${comp.name} · Bespoke`, price: C.bespokePrice, formula: 'Notes: ' + notes.map((k) => ING[k].label).join(', ') });
    window.GibUI.openCart();
  });

  render();
  kick();
});
