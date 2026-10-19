/* ============================================================
   GIBERISH — "Feel it" scent experience
   Bottle → ingredients bloom and orbit → spray → the person breathes in.
   Usage: GibExperience.open('product-id')
   ============================================================ */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  let root, stage, canvas, ctx, backCanvas, bctx, bottleEl, humanEl, panel, labelsEl, wordsEl, stepEl, sprayBtn;
  let W = 0, H = 0, dpr = 1, raf = 0, product = null;
  let parts = [], mist = [], smoke = [], labels = {}, fx = [], waves = [];
  let phase = 'idle', phaseT = 0, t0 = 0, autoSprayTimer = 0, wordTimers = [];

  /* ---------- The person: a backlit profile, lit only by a warm rim light ---------- */
  // Face edge (forehead → nose → lips → chin → throat → chest). Drawn twice: as the shape's edge and as the rim light.
  const FACE = 'M182 60 C160 62 140 78 134 102 C131 114 132 122 129 129 C127 133 126 136 127 140 L113 160 C111 163 113 166 118 167 C121 168 122 171 121 173 C118 176 116 178 117 180 C120 182 121 184 118 187 C121 191 124 195 123 199 C121 203 120 206 122 210 C127 216 140 220 150 222 C155 230 158 244 160 262 C152 272 132 282 98 296 C78 306 64 330 56 440';
  const BACK = 'L316 440 C314 380 306 330 284 300 C262 284 244 270 236 248 C232 226 234 206 244 190 C258 168 262 136 254 108 C244 78 216 60 182 60 Z';
  const HAIR = 'M180 54 C214 50 250 62 266 96 C280 128 276 166 266 200 C258 232 264 268 282 300 C292 318 300 336 296 352 C282 344 266 326 254 300 C242 274 238 246 238 222 C238 204 244 190 250 172 C256 148 252 120 238 100 C222 80 196 74 172 78 C156 82 144 92 138 102 C142 78 158 58 180 54 Z';
  const HUMAN_SVG = `
  <svg viewBox="0 0 320 440" aria-hidden="true">
    <defs>
      <radialGradient id="xpAura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f6d79a" stop-opacity=".5"/><stop offset=".5" stop-color="#d4a957" stop-opacity=".12"/><stop offset="1" stop-color="#d4a957" stop-opacity="0"/></radialGradient>
      <linearGradient id="xpSkin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2b1a0e"/><stop offset=".35" stop-color="#140b06"/><stop offset="1" stop-color="#080403"/></linearGradient>
      <linearGradient id="xpRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9bd"/><stop offset=".55" stop-color="#f2c46b"/><stop offset="1" stop-color="#f2c46b" stop-opacity="0"/></linearGradient>
      <radialGradient id="xpWarm" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcf7d" stop-opacity=".55"/><stop offset=".5" stop-color="#e09a3c" stop-opacity=".18"/><stop offset="1" stop-color="#e09a3c" stop-opacity="0"/></radialGradient>
      <filter id="xpBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
      <clipPath id="xpClip"><path d="${FACE} ${BACK}"/><path d="${HAIR}"/></clipPath>
    </defs>
    <circle class="aura" cx="170" cy="190" r="190" fill="url(#xpAura)"/>
    <g class="body-g">
      <g class="head-g">
        <path d="${FACE} ${BACK}" fill="url(#xpSkin)"/>
        <path d="${HAIR}" fill="#070302"/>
        <g class="hair-lights" fill="none" stroke="#e8b866" stroke-linecap="round">
          <path d="M186 64 C226 62 256 90 262 130" stroke-opacity=".28"/><path d="M196 70 C236 76 254 112 252 150" stroke-opacity=".16"/>
          <path d="M262 190 C256 240 268 286 290 330" stroke-opacity=".18"/><path d="M252 210 C250 256 262 292 280 320" stroke-opacity=".1"/>
        </g>
        <circle class="warmth" cx="158" cy="246" r="240" fill="url(#xpWarm)" clip-path="url(#xpClip)"/>
        <path class="rim-soft" d="${FACE}" fill="none" stroke="url(#xpRim)" stroke-width="7" filter="url(#xpBlur)"/>
        <path class="rim" d="${FACE}" fill="none" stroke="url(#xpRim)" stroke-width="1.4"/>
        <path class="lashes" d="M131 132 Q137 138 144 134 M134 135 l-2 3 M138 136.5 l-1 3.2 M141.5 136 l0 3" fill="none" stroke="#ffe3a8" stroke-width="1" stroke-linecap="round"/>
      </g>
    </g>
  </svg>`;

  function build() {
    root = document.createElement('div');
    root.className = 'xp';
    root.setAttribute('data-lenis-prevent', '');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML = `
      <div class="xp-stage">
        <div class="xp-atmos" aria-hidden="true"><i class="beam"></i><i class="bk" style="--x:12%;--y:18%;--s:120px;--d:14s"></i><i class="bk" style="--x:70%;--y:12%;--s:80px;--d:11s"></i><i class="bk" style="--x:84%;--y:66%;--s:140px;--d:17s"></i><i class="bk" style="--x:30%;--y:74%;--s:60px;--d:12s"></i><i class="bk" style="--x:52%;--y:40%;--s:46px;--d:9s"></i></div>
        <canvas class="xp-canvas xp-back"></canvas>
        <div class="xp-step"></div>
        <div class="xp-bottle"><img alt=""><img class="xp-reflect" alt="" aria-hidden="true"></div>
        <div class="xp-human">${HUMAN_SVG}</div>
        <canvas class="xp-canvas xp-front"></canvas>
        <div class="ing-labels"></div>
        <div class="feel-words"></div>
        <div class="xp-spray"><button class="spray-btn" type="button">Spray<br>on me</button></div>
        <div class="xp-sound"></div>
      </div>
      <div class="xp-panel"></div>
      <button class="icon-btn xp-close" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`;
    document.body.appendChild(root);
    stage = root.querySelector('.xp-stage');
    canvas = root.querySelector('.xp-front');
    backCanvas = root.querySelector('.xp-back');
    ctx = canvas.getContext('2d');
    bctx = backCanvas.getContext('2d');
    bottleEl = root.querySelector('.xp-bottle');
    humanEl = root.querySelector('.xp-human');
    panel = root.querySelector('.xp-panel');
    labelsEl = root.querySelector('.ing-labels');
    wordsEl = root.querySelector('.feel-words');
    stepEl = root.querySelector('.xp-step');
    sprayBtn = root.querySelector('.spray-btn');
    root.querySelector('.xp-close').addEventListener('click', close);
    sprayBtn.addEventListener('click', () => spray());
    if (window.GibSound) window.GibSound.mountToggle(root.querySelector('.xp-sound'), () => (product && window.gibProductSound ? window.gibProductSound(product) : 'silk'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('open')) close(); });
    addEventListener('resize', resize);
  }

  function resize() {
    if (!root || !root.classList.contains('open')) return;
    const r = stage.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    for (const [c, x] of [[canvas, ctx], [backCanvas, bctx]]) { c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
  }

  /* Anchor points in stage coordinates */
  function anchors() {
    const s = stage.getBoundingClientRect();
    const box = bottleEl.getBoundingClientRect();
    const img = bottleEl.querySelector('img');
    // the image is object-fit: contain, anchored to the bottom — work out the painted rect
    const ar = (img.naturalWidth || 4) / (img.naturalHeight || 5);
    let bw = box.width, bh = box.height;
    if (ar > bw / bh) bh = bw / ar; else bw = bh * ar;
    const b = { left: box.left + (box.width - bw) / 2, top: box.top + (box.height - bh), width: bw, height: bh };
    const nz = (product && product.nozzle) || [.5, .1];
    const h = humanEl.getBoundingClientRect();
    const k = h.width / 320; // svg viewBox scale
    return {
      bottle: { x: b.left - s.left + b.width / 2, y: b.top - s.top + b.height * .5, w: b.width, h: b.height },
      nozzle: { x: b.left - s.left + b.width * nz[0], y: b.top - s.top + b.height * nz[1] },
      neck: { x: h.left - s.left + 158 * k, y: h.top - s.top + 246 * k },
      head: { x: h.left - s.left + 190 * k, y: h.top - s.top + 170 * k, r: 120 * k },
    };
  }

  /* ---------- Particles ---------- */
  function spawnIngredients() {
    parts = [];
    const kinds = product.ingredients;
    const isMobile = W < 600;
    const per = Math.max(3, Math.round((isMobile ? 16 : 24) / kinds.length));
    const N = anchors().nozzle;
    kinds.forEach((kind, ki) => {
      const arts = window.GibArt.forIngredient(kind);
      for (let i = 0; i < per; i++) {
        const art = arts[i % arts.length];
        parts.push({
          kind, lead: i === 0, sprite: { kind: art },
          x: N.x, y: N.y, born: rand(.2, 1.8) + ki * .15, trail: [],
          ang: rand(0, TAU), angV: rand(.22, .42) * (Math.random() < .5 ? 1 : -1),
          rx: rand(.6, 1.1), ry: rand(.25, .6), lift: rand(-.35, .25), wob: rand(0, TAU),
          size: (art === 'musk' ? rand(22, 30) : rand(26, 40)) * (isMobile ? .72 : 1),
          flowDelay: rand(0, 1.2), hr: rand(.85, 1.5), alpha: 0,
        });
      }
    });
    labelsEl.innerHTML = '';
    labels = {};
    kinds.forEach((k) => {
      const el = document.createElement('span');
      el.className = 'ing-label';
      el.textContent = (window.GIB_INGREDIENTS[k] || { label: k }).label;
      labelsEl.appendChild(el);
      labels[k] = el;
    });
  }

  function bezier(a, c, b, t) {
    const u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
  }

  function emitMist(A) {
    const n = W < 600 ? 160 : 260;
    const dx = A.neck.x - A.nozzle.x, dy = A.neck.y - A.nozzle.y;
    const base = Math.atan2(dy, dx), dist = Math.hypot(dx, dy);
    for (let i = 0; i < n; i++) {
      const a = base + rand(-.2, .2) * (Math.random() < .7 ? .6 : 1), sp = dist * rand(1.2, 2.1);
      mist.push({ x: A.nozzle.x, y: A.nozzle.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, delay: rand(0, .4), max: rand(.8, 1.5), r: rand(.4, 1.5) });
    }
    for (let i = 0; i < 8; i++) { // soft cloud blooming along the spray
      const a = base + rand(-.12, .12), sp = dist * rand(.5, 1.3);
      mist.push({ cloud: true, x: A.nozzle.x, y: A.nozzle.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, delay: i * .05, max: rand(1.6, 2.4), r: dist * rand(.06, .1) });
    }
  }

  function drawSprite(p, x, y, size, alpha, depth, dt) {
    // behind the bottle/person → back canvas, softly out of focus; in front → sharp
    const back = depth < -.15;
    window.GibArt.draw(back ? bctx : ctx, p.sprite, x, y, size, alpha, dt, back ? null : fx, back ? Math.min(1.8, -depth * 1.8) : 0);
  }

  function drawTrail(p, alpha) {
    const tr = p.trail;
    if (tr.length < 3) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 1; i < tr.length; i++) {
      const k = i / tr.length;
      ctx.strokeStyle = `rgba(255,214,140,${k * .35 * alpha})`;
      ctx.lineWidth = k * 2.2;
      ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
    }
    ctx.restore();
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    const t = (now - t0) / 1000;
    const dt = Math.min(.05, (now - (tick.last || now)) / 1000);
    tick.last = now;
    phaseT += dt;
    const A = anchors();
    ctx.clearRect(0, 0, W, H); bctx.clearRect(0, 0, W, H);

    // a thin thread of warm air above the bottle
    if (Math.random() < .2) smoke.push({ x: A.nozzle.x + rand(-4, 4), y: A.nozzle.y, vy: rand(-26, -14), vx: rand(-5, 5), r: rand(6, 10), life: 0, max: rand(2.5, 4) });
    smoke = smoke.filter((s) => (s.life += dt) < s.max);
    for (const s of smoke) {
      s.x += s.vx * dt + Math.sin(s.life * 2 + s.r) * .4; s.y += s.vy * dt; s.r += dt * 8;
      const a = Math.sin((s.life / s.max) * Math.PI) * .07;
      const g = bctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, `rgba(235,220,200,${a})`); g.addColorStop(1, 'rgba(235,220,200,0)');
      bctx.fillStyle = g; bctx.beginPath(); bctx.arc(s.x, s.y, s.r, 0, TAU); bctx.fill();
    }

    // light waves rolling out from the person after the spray
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i]; w.life += dt;
      if (w.life > 2.6) { waves.splice(i, 1); continue; }
      // a soft ring of warm light that blooms outward behind the person
      const k = w.life / 2.6, r = A.head.r * (.9 + k * 2.2);
      const g = bctx.createRadialGradient(A.head.x, A.head.y, r * .82, A.head.x, A.head.y, r);
      g.addColorStop(0, 'rgba(255,214,140,0)'); g.addColorStop(.85, `rgba(255,214,140,${(1 - k) * .2})`); g.addColorStop(1, 'rgba(255,214,140,0)');
      bctx.fillStyle = g; bctx.beginPath(); bctx.arc(A.head.x, A.head.y, r, 0, TAU); bctx.fill();
    }

    // ingredients
    const orbitRX = Math.min(W * .3, A.bottle.w * 1.15), orbitRY = A.bottle.h * .14;
    const labelPos = {};
    for (const p of parts) {
      p.wob += dt;
      let tx, ty;
      if (phase === 'orbit' || phase === 'emerge') {
        if (t < p.born) { p.x = A.nozzle.x; p.y = A.nozzle.y; continue; }
        p.alpha = Math.min(1, p.alpha + dt * 1.2);
        p.ang += p.angV * dt;
        tx = A.bottle.x + Math.cos(p.ang) * orbitRX * p.rx;
        ty = A.bottle.y + p.lift * A.bottle.h + Math.sin(p.ang) * orbitRY * p.ry * 3 + Math.sin(p.wob * 1.1) * 6;
        const k = Math.min(1, dt * (t - p.born < 1.4 ? 1.8 : 3.5));
        p.x += (tx - p.x) * k; p.y += (ty - p.y) * k;
        p.depth = Math.sin(p.ang);
      } else {
        const f = Math.min(1, Math.max(0, phaseT - p.flowDelay) / 2);
        const e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        p.ang += p.angV * dt * (1 + (1 - f) * 1.5);
        const ctrl = { x: (A.nozzle.x + A.head.x) / 2, y: Math.min(A.nozzle.y, A.head.y) - H * .22 };
        if (!p.from) p.from = { x: p.x, y: p.y };
        const onPath = bezier(p.from, ctrl, A.head, e);
        const swirl = { x: A.head.x + Math.cos(p.ang) * A.head.r * p.hr, y: A.head.y + p.lift * A.head.r + Math.sin(p.ang) * A.head.r * p.hr * .35 + Math.sin(p.wob) * 5 };
        tx = onPath.x + (swirl.x - A.head.x) * e;
        ty = onPath.y + (swirl.y - A.head.y) * e;
        p.x += (tx - p.x) * Math.min(1, dt * 5); p.y += (ty - p.y) * Math.min(1, dt * 5);
        p.depth = f < 1 ? Math.max(0, Math.sin(p.ang)) * f + (1 - f) * .3 : Math.sin(p.ang);
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > (f < 1 ? 16 : 6)) p.trail.shift();
        drawTrail(p, p.alpha * (1 - f * .6));
      }
      if (p.lead) labelPos[p.kind] = { x: p.x, y: p.y };
      const depth = p.depth || 0, scale = .7 + (depth + 1) * .2;
      drawSprite(p, p.x, p.y, p.size * scale, p.alpha * (.65 + (depth + 1) * .175), depth, dt);
    }
    window.GibArt.drawFx(ctx, fx, dt);

    // mist: fine droplets + a soft cloud
    mist = mist.filter((m) => m.life < m.max + m.delay);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const m of mist) {
      m.life += dt;
      if (m.life < m.delay) continue;
      const k = (m.life - m.delay) / m.max;
      m.x += m.vx * dt; m.y += m.vy * dt; m.vx *= .96; m.vy = m.vy * .96 + 8 * dt;
      if (m.cloud) {
        const r = m.r * (1 + k * 2), g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
        g.addColorStop(0, `rgba(255,236,200,${Math.sin(k * Math.PI) * .1})`); g.addColorStop(1, 'rgba(255,236,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(255,240,212,${(1 - k) * .75})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r * (1 + k * .6), 0, TAU); ctx.fill();
      }
    }
    ctx.restore();

    // labels: hairline captions that follow one note of each kind while it circles the bottle
    const showLabels = phase === 'orbit' && t > 1.8;
    Object.entries(labels).forEach(([k, el]) => {
      const lp = labelPos[k];
      if (lp) el.style.transform = `translate(${lp.x + 16}px, ${lp.y - 8}px)`;
      el.classList.toggle('show', !!lp && showLabels);
    });

    if (phase === 'emerge' && t > 1.6) phase = 'orbit';
  }

  function setStep(txt) {
    stepEl.style.opacity = 0;
    setTimeout(() => { stepEl.textContent = txt; stepEl.style.opacity = 1; }, 300);
  }

  function spray() {
    clearTimeout(autoSprayTimer);
    const A = anchors();
    bottleEl.classList.remove('press'); void bottleEl.offsetWidth; bottleEl.classList.add('press');
    emitMist(A);
    parts.forEach((p) => { p.from = null; p.trail = []; p.alpha = Math.max(p.alpha, .9); });
    phase = 'flow'; phaseT = 0;
    setStep('Close your eyes…');
    sprayBtn.innerHTML = 'Spray<br>again';
    wordTimers.forEach(clearTimeout);
    humanEl.classList.remove('bliss');
    wordTimers = [
      setTimeout(() => { humanEl.classList.add('bliss'); setStep('Breathe in'); waves.push({ life: 0 }); }, 1000),
      setTimeout(() => waves.push({ life: 0 }), 1700),
      setTimeout(() => waves.push({ life: 0 }), 3400),
      ...product.feel.map((w, i) => setTimeout(() => floatWord(w, i), 1800 + i * 1200)),
      setTimeout(() => setStep('This is ' + product.name), 1800 + product.feel.length * 1200 + 600),
    ];
  }

  function floatWord(word, i) {
    const A = anchors();
    const el = document.createElement('span');
    el.className = 'feel-word';
    el.textContent = word;
    // words rise beside the head, alternating sides, never off-screen
    const side = i % 2 ? 1 : -1;
    const x = A.head.x + side * A.head.r * 1.05;
    el.style.left = Math.max(12, Math.min(W - 12, x)) + 'px';
    el.style.top = (A.head.y - A.head.r * (.55 - (i % 3) * .35)) + 'px';
    el.style.setProperty('--ax', side > 0 ? '0%' : '-100%');
    wordsEl.appendChild(el);
    setTimeout(() => el.remove(), 4800);
  }

  function renderPanel(p) {
    const money = window.gibMoney;
    panel.innerHTML = `
      <span class="eyebrow">${p.house}</span>
      <h2 class="h-1">${p.name}</h2>
      <p class="p-tag" style="font-size:22px">${p.tagline}</p>
      <p>${p.story}</p>
      <div class="pyramid">
        <div class="pyr-row"><b>Top</b><span>${p.notes.top.join(' · ')}</span></div>
        <div class="pyr-row"><b>Heart</b><span>${p.notes.heart.join(' · ')}</span></div>
        <div class="pyr-row"><b>Base</b><span>${p.notes.base.join(' · ')}</span></div>
      </div>
      <div><span class="eyebrow" style="font-size:10px">How it feels</span>
        <div class="feel-row" style="margin-top:8px">${p.feel.map((f) => `<span class="chip">${f}</span>`).join('')}</div></div>
      <div class="p-foot" style="padding-top:18px;border-top:1px solid var(--line)">
        <div class="p-price">${p.price != null ? money(p.price) : 'By invitation'}<small>${p.size}</small></div>
        <button class="btn btn-solid" data-add="${p.id}">${p.price != null ? 'Add to bag' : 'Join waitlist'}</button>
      </div>
      <a class="link-arrow" href="kundli.html" style="margin-top:6px">Not sure it’s you? Read your Scent Kundli
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor"><path d="M0 5h20M16 1l4 4-4 4"/></svg></a>`;
  }

  function open(id) {
    product = window.GIB_PRODUCTS.find((p) => p.id === id);
    if (!product) return;
    clearTimeout(autoSprayTimer);
    wordTimers.forEach(clearTimeout);
    if (!root) build();
    const [img, refl] = bottleEl.querySelectorAll('img');
    img.src = refl.src = product.image;
    img.alt = product.name;
    if (window.GibSound && window.gibProductSound) window.GibSound.setTheme(window.gibProductSound(product));
    renderPanel(product);
    humanEl.classList.remove('bliss');
    wordsEl.innerHTML = '';
    sprayBtn.innerHTML = 'Spray<br>on me';
    stepEl.textContent = 'The notes are waking up';
    root.scrollTop = 0;
    root.classList.add('open');
    document.body.classList.add('no-scroll');
    try { history.replaceState(null, '', '#feel=' + id); } catch (_) {}
    resize();
    mist = []; smoke = []; fx = []; waves = [];
    spawnIngredients();
    phase = 'emerge'; phaseT = 0; t0 = performance.now(); tick.last = t0;
    cancelAnimationFrame(raf);
    if (reduceMotion) { humanEl.classList.add('bliss'); return; }
    raf = requestAnimationFrame(tick);
    wordTimers.push(setTimeout(() => setStep('Tap “Spray on me” to feel it'), 2600));
    autoSprayTimer = setTimeout(spray, 7000);
  }

  function close() {
    root.classList.remove('open');
    document.body.classList.remove('no-scroll');
    cancelAnimationFrame(raf);
    clearTimeout(autoSprayTimer);
    wordTimers.forEach(clearTimeout);
    if (window.GibSound && window.GibSound.isOn()) window.GibSound.stop();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
  }

  window.GibExperience = { open, close };

  // Any element with data-feel opens the experience
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-feel]');
    if (t) { e.preventDefault(); open(t.dataset.feel); }
  });
  document.addEventListener('keydown', (e) => {
    const t = e.target.closest && e.target.closest('[data-feel]');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(t.dataset.feel); }
  });
  // Deep link: page.html#feel=product-id
  window.addEventListener('load', () => {
    const m = location.hash.match(/feel=([\w-]+)/);
    if (m) setTimeout(() => open(m[1]), 300);
  });
})();
