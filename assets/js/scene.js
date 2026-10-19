/* ============================================================
   GIBERISH — orbit & spray engine
   Ingredients (GibArt) orbit a centrepiece in 3D: they pass *behind* it
   (back canvas) and *in front* of it (front canvas). Bottles can spray mist.

   GibScene.mount(container, {
     center: '.selector' | element,   // what the ingredients orbit (default: container)
     kinds: ['orange','rose',…],      // GibArt kinds
     count: 14, rx: .62, ry: .2,      // orbit radii relative to container width
     size: [.07, .13],                // item size range relative to container width
     emitters: [{ el, nozzle: [fx, fy], angle: -90, spread: 28, power: 1 }],
     autoSpray: 0,                    // ms between automatic sprays (0 = off)
     smokers: [{ el, nozzle: [fx, fy] }],  // continuous incense smoke rising from these points
     clickToSpray: false,
   }) → { spray(i), burst(), destroy() }
   ============================================================ */
(function () {
  const TAU = Math.PI * 2;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const FLUTTER = new Set(['petal', 'jasmine', 'leaf', 'rose']);
  // while the home intro covers the page (its CSS animations are paused too), the canvases skip drawing
  const covered = () => document.documentElement.classList.contains('intro-on');

  function mount(container, o = {}) {
    const opts = Object.assign({ count: 14, rx: .62, ry: .2, tilt: -8, size: [.07, .13], speed: 1, kinds: ['rose', 'orange', 'honey', 'saffron', 'jasmine', 'cinnamon', 'amber', 'sandalwood'], emitters: [], autoSpray: 0, clickToSpray: false, blurBack: true }, o);
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return null;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const centerEl = typeof opts.center === 'string' ? el.querySelector(opts.center) : (opts.center || el);
    const back = document.createElement('canvas'), front = document.createElement('canvas');
    back.className = 'orb-canvas orb-back'; front.className = 'orb-canvas orb-front';
    // canvases bleed past the container so orbiting items are never clipped
    const bleed = opts.bleed ?? .35;
    for (const c of [back, front]) Object.assign(c.style, { left: `${-bleed * 100}%`, top: `${-bleed * 100}%`, width: `${(1 + 2 * bleed) * 100}%`, height: `${(1 + 2 * bleed) * 100}%` });
    el.prepend(back); el.appendChild(front);
    const bctx = back.getContext('2d'), fctx = front.getContext('2d');
    let W = 0, H = 0, CW = 0, CH = 0, dpr = 1, raf = 0, visible = false, last = 0, px = 0, py = 0, tpx = 0, tpy = 0;
    const mist = [], flyers = [];
    const smokers = (opts.smokers || []).map((sm) => ({ ...sm, strands: [[], []], puffs: [], t: Math.random() * 10 }));

    // incense: two curling ribbons + soft puffs, forever rising
    function drawSmoke(ctx, dt) {
      for (const sm of smokers) {
        const n = nozzle(sm);
        sm.t += dt;
        sm.strands.forEach((pts, k) => {
          pts.push({ x: n.x, y: n.y, vx: 0, life: 0, ph: sm.t * (1.3 + k * .4) + k * 2 });
          for (const p of pts) { p.life += dt; p.y -= (W * .07 + k * W * .015) * dt; p.x += Math.sin(p.ph + p.life * (1.6 + k * .5)) * W * .012 * dt * (1 + p.life * 1.4); }
          while (pts.length && pts[0].life > 4.2) pts.shift();
          if (pts.length < 3) return;
          ctx.save();
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i], age = b.life / 4.2;
            ctx.strokeStyle = `rgba(242,232,216,${(1 - age) * Math.min(1, age * 5) * (k ? .32 : .5)})`;
            ctx.lineWidth = (1.4 + age * 12) * (W / 600);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
          ctx.restore();
        });
        if (Math.random() < dt * 12) sm.puffs.push({ x: n.x, y: n.y, vx: (Math.random() - .5) * 6, life: 0, max: 3 + Math.random() * 2, r: W * .01 });
        for (let i = sm.puffs.length - 1; i >= 0; i--) {
          const p = sm.puffs[i]; p.life += dt;
          if (p.life > p.max) { sm.puffs.splice(i, 1); continue; }
          p.y -= W * .06 * dt; p.x += p.vx * dt + Math.sin(p.life * 1.5) * .3; p.r += W * .012 * dt;
          const a = Math.sin((p.life / p.max) * Math.PI) * .13;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, `rgba(235,224,208,${a})`); g.addColorStop(1, 'rgba(235,224,208,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
        }
      }
    }

    const items = Array.from({ length: opts.count }, (_, i) => {
      const kind = opts.kinds[i % opts.kinds.length];
      return {
        kind, img: window.GibArt.image(kind),
        ang: (i / opts.count) * TAU + rand(-.2, .2),
        sp: rand(.08, .16) * opts.speed * (Math.random() < .15 ? -1 : 1),
        rxk: rand(.8, 1.15), ryk: rand(.7, 1.3), lift: rand(-.12, .12),
        size: rand(opts.size[0], opts.size[1]),
        rot: rand(0, TAU), rotV: rand(-.6, .6), bob: rand(0, TAU), flutter: FLUTTER.has(kind),
      };
    });

    function resize() {
      const r = el.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; CW = W * (1 + 2 * bleed); CH = H * (1 + 2 * bleed);
      for (const c of [back, front]) { c.width = Math.max(1, CW * dpr); c.height = Math.max(1, CH * dpr); }
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function centre() {
      const r = back.getBoundingClientRect(), c = centerEl.getBoundingClientRect();
      return { x: c.left - r.left + c.width / 2, y: c.top - r.top + c.height * (opts.centerY ?? .55) };
    }
    function nozzle(e) {
      const r = back.getBoundingClientRect(), b = e.el.getBoundingClientRect();
      // images use object-fit: contain — find the painted area
      let bw = b.width, bh = b.height, ox = 0, oy = 0;
      if (e.el.naturalWidth) {
        const ar = e.el.naturalWidth / e.el.naturalHeight;
        if (ar > bw / bh) { bh = bw / ar; oy = (b.height - bh) / 2; } else { bw = bh * ar; ox = (b.width - bw) / 2; }
      }
      return { x: b.left - r.left + ox + bw * e.nozzle[0], y: b.top - r.top + oy + bh * e.nozzle[1] };
    }

    function spray(i = 0, power) {
      const e = opts.emitters[i];
      if (!e) return;
      const n = nozzle(e), p = power ?? e.power ?? 1;
      const base = ((e.angle ?? -90) * Math.PI) / 180, spread = ((e.spread ?? 26) * Math.PI) / 180;
      const count = Math.round((W < 500 ? 70 : 120) * p);
      for (let k = 0; k < count; k++) {
        const a = base + rand(-spread, spread) * (Math.random() < .7 ? .6 : 1), v = W * rand(.35, .95) * p;
        mist.push({ x: n.x, y: n.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rand(.7, 1.6), delay: rand(0, .3), r: rand(.4, 1.5) });
      }
      // a soft cloud that blooms along the spray
      for (let k = 0; k < 6; k++) {
        const a = base + rand(-spread, spread) * .5, v = W * rand(.12, .4) * p;
        mist.push({ cloud: true, x: n.x, y: n.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rand(1.4, 2.2), delay: k * .05, r: W * rand(.02, .04) });
      }
      // a few ingredients ride the mist
      for (let k = 0; k < Math.round(4 * p); k++) {
        const kind = opts.kinds[Math.floor(Math.random() * opts.kinds.length)];
        const a = base + rand(-spread, spread), v = W * rand(.18, .35);
        flyers.push({ kind, img: window.GibArt.image(kind), x: n.x, y: n.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rand(1.6, 2.6), size: W * rand(.035, .06), rot: rand(0, TAU), rotV: rand(-3, 3) });
      }
      if (e.el) { e.el.classList.remove('spritz'); void e.el.offsetWidth; e.el.classList.add('spritz'); }
    }

    const fx = [];
    function drawItem(ctx, it, x, y, s, alpha, blur, dt) {
      window.GibArt.draw(ctx, it, x, y, s, alpha, dt, ctx === fctx || !blur ? fx : null, blur);
    }

    function frame(now) {
      raf = visible ? requestAnimationFrame(frame) : 0;
      if (covered()) { last = now; return; }
      const dt = Math.min(.05, (now - (last || now)) / 1000);
      last = now;
      px += (tpx - px) * .05; py += (tpy - py) * .05;
      bctx.clearRect(0, 0, CW, CH); fctx.clearRect(0, 0, CW, CH);
      const c = centre();
      const tilt = (opts.tilt * Math.PI) / 180, ct = Math.cos(tilt), st = Math.sin(tilt);
      const RX = W * opts.rx, RY = W * opts.ry;
      // sort back-to-front so overlaps look right
      const order = items.map((it) => { it.ang += it.sp * dt; it.rot += it.rotV * dt; it.bob += dt; return it; })
        .sort((a, b) => Math.sin(a.ang) - Math.sin(b.ang));
      for (const it of order) {
        const depth = Math.sin(it.ang); // -1 back … 1 front
        const ex = Math.cos(it.ang) * RX * it.rxk, ey = depth * RY * it.ryk + it.lift * W + Math.sin(it.bob) * W * .012;
        const x = c.x + ex * ct - ey * st + px * (8 + depth * 14), y = c.y + ex * st + ey * ct + py * (8 + depth * 14);
        const s = it.size * W * (.72 + (depth + 1) * .25);
        if (depth < 0) drawItem(bctx, it, x, y, s, .55 + (depth + 1) * .4, opts.blurBack ? Math.max(0, -depth * 1.6) : 0, dt);
        else drawItem(fctx, it, x, y, s, 1, depth > .92 && opts.blurFront ? 1.5 : 0, dt);
      }
      // flyers
      for (let i = flyers.length - 1; i >= 0; i--) {
        const f = flyers[i];
        f.life += dt;
        if (f.life > f.max) { flyers.splice(i, 1); continue; }
        f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= .98; f.vy = f.vy * .98 + 20 * dt; f.rot += f.rotV * dt;
        drawItem(fctx, f, f.x, f.y, f.size, Math.min(1, (f.max - f.life) * 1.5), 0, dt);
      }
      window.GibArt.drawFx(fctx, fx, dt);
      if (smokers.length) drawSmoke(fctx, dt);
      // mist
      fctx.save();
      fctx.globalCompositeOperation = 'lighter';
      for (let i = mist.length - 1; i >= 0; i--) {
        const m = mist[i];
        m.life += dt;
        if (m.life > m.max + m.delay) { mist.splice(i, 1); continue; }
        if (m.life < m.delay) continue;
        const t = (m.life - m.delay) / m.max;
        m.x += m.vx * dt; m.y += m.vy * dt; m.vx *= .955; m.vy = m.vy * .955 + 6 * dt;
        if (m.cloud) {
          const rr = m.r * (1 + t * 2.5), g = fctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, rr);
          g.addColorStop(0, `rgba(255,236,200,${Math.sin(t * Math.PI) * .12})`); g.addColorStop(1, 'rgba(255,236,200,0)');
          fctx.fillStyle = g; fctx.beginPath(); fctx.arc(m.x, m.y, rr, 0, TAU); fctx.fill();
        } else {
          fctx.fillStyle = `rgba(255,240,210,${(1 - t) * .7})`;
          fctx.beginPath(); fctx.arc(m.x, m.y, m.r * (1 + t * .8), 0, TAU); fctx.fill();
        }
      }
      fctx.restore();
    }

    function start() { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }, { rootMargin: '100px' });
    io.observe(el);
    if (reduce) { visible = true; requestAnimationFrame(frame); visible = false; }

    const onMove = (e) => { const r = el.getBoundingClientRect(); tpx = (e.clientX - r.left) / r.width - .5; tpy = (e.clientY - r.top) / r.height - .5; };
    if (window.matchMedia('(hover: hover)').matches) window.addEventListener('pointermove', onMove, { passive: true });

    let timer = 0, ti = 0;
    if (opts.autoSpray && opts.emitters.length && !reduce) {
      timer = setInterval(() => { if (visible && !document.hidden) spray(ti++ % opts.emitters.length); }, opts.autoSpray);
    }
    if (opts.clickToSpray) opts.emitters.forEach((e, i) => {
      e.el.style.cursor = 'pointer';
      e.el.addEventListener('click', () => spray(i, 1.3));
    });

    return {
      spray, start,
      destroy() { cancelAnimationFrame(raf); clearInterval(timer); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', onMove); back.remove(); front.remove(); },
    };
  }

  /* ---------- Living Giberish emblem: glowing, breathing, laughing monk ---------- */
  function emblem(container, o = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return null;
    el.classList.add('emblem');
    el.innerHTML = `
      <div class="em-rays"></div>
      <div class="em-glow"></div>
      <div class="em-wave"></div><div class="em-wave w2"></div>
      <div class="em-nimbus"><i></i></div>
      <div class="em-face"></div>
      <svg class="em-lotus" viewBox="0 0 300 90" aria-hidden="true">
        <defs><linearGradient id="lotg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f2d59b" stop-opacity=".5"/><stop offset="1" stop-color="#fff3d0" stop-opacity="0"/></linearGradient></defs>
        ${[-60, -38, -18, 0, 18, 38, 60].map((r, i) => `<path transform="rotate(${r} 150 88)" d="M150 88 C${132 - Math.abs(r) * .1} 60 ${136} 26 150 ${10 + Math.abs(r) * .45} C164 26 ${168 + Math.abs(r) * .1} 60 150 88 Z" fill="url(#lotg)" stroke="#f2d59b" stroke-opacity="${i === 3 ? .9 : .55}" stroke-width="1"/>`).join('')}
      </svg>
      <svg class="em-swoosh" viewBox="0 0 400 320">
        <defs><linearGradient id="swg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#f2d59b" stop-opacity="0"/><stop offset=".35" stop-color="#f2d59b" stop-opacity=".9"/>
          <stop offset=".8" stop-color="#d4a957" stop-opacity=".5"/><stop offset="1" stop-color="#d4a957" stop-opacity="0"/></linearGradient></defs>
        <path class="sw sw1" d="M250 292 C120 300 70 220 108 140 C126 102 160 76 196 64"/>
        <path class="sw sw2" d="M262 284 C140 290 92 222 124 150 C140 114 168 92 200 82"/>
        <path class="sw sw3" d="M240 300 C96 306 44 214 92 128 C110 96 140 72 176 58"/>
      </svg>
      <canvas class="em-sparks"></canvas>
      <div class="em-seat"></div>
      <div class="em-monk"><img src="assets/img/buddha-sil.webp" alt=""></div>
      ${o.word ? '<div class="em-word">Giberish</div>' : ''}`;

    // twinkling gold dust inside the halo
    const cv = el.querySelector('.em-sparks'), cx = cv.getContext('2d');
    let dots = [], W = 0, H = 0, dpr = 1, vis = false, raf = 0;
    const size = () => {
      const r = cv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = Array.from({ length: Math.round(W / 4) }, () => {
        const a = rand(0, TAU), rr = Math.sqrt(Math.random()) * .42;
        return { a, rr, r: rand(.4, 1.5), tw: rand(0, TAU), sp: rand(-.05, .05), rise: rand(2, 8) };
      });
    };
    const loop = (t) => {
      raf = vis ? requestAnimationFrame(loop) : 0;
      if (covered()) return;
      cx.clearRect(0, 0, W, H);
      for (const d of dots) {
        d.tw += .03; d.a += d.sp * .02;
        const x = W / 2 + Math.cos(d.a) * d.rr * W, y = H * .42 + Math.sin(d.a) * d.rr * H * .8 - ((t / 1000 * d.rise) % 30);
        const al = .25 + .75 * Math.max(0, Math.sin(d.tw));
        cx.fillStyle = `rgba(255,226,160,${al})`;
        cx.beginPath(); cx.arc(x, y, d.r, 0, TAU); cx.fill();
      }
    };
    size();
    new ResizeObserver(size).observe(cv);
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf && !reduce) raf = requestAnimationFrame(loop); }).observe(el);

    return mount(el, Object.assign({
      center: '.em-monk', centerY: .5,
      kinds: ['orange', 'rose', 'honey', 'jasmine', 'saffron', 'cinnamon', 'lemon', 'petal', 'amber', 'cardamom', 'vanilla', 'sandalwood', 'anise', 'honeycomb', 'oud', 'leaf'],
      count: 10, rx: .38, ry: .1, tilt: -6, size: [.04, .062], speed: .8,
    }, o.orbit || {}));
  }

  window.GibScene = { mount, emblem };
})();
