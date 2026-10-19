/* ============================================================
   GIBERISH — Whispers page
   A stage that reveals one whisper at a time (words rise out of smoke),
   ingredient art drifting around it, filters, autoplay, swipe, share, and a grid of all.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ALL = window.GIB_WHISPERS, CATS = window.GIB_WHISPER_CATS;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  ALL.forEach((w, i) => (w.id = i + 1));

  const card = $('.wh-card'), textEl = $('.wh-text'), catEl = $('.wh-cat'), numEl = $('.wh-num'), srcEl = $('.wh-src');
  const prog = $('.wh-progress i'), playBtn = $('#wh-play');
  let filter = 'all', list = ALL, idx = 0, playing = !reduce, timer = 0, inView = false;

  /* ---------- Category chips ---------- */
  const cats = $('.wh-cats');
  cats.innerHTML = [['all', 'All', '#d4a957'], ...Object.entries(CATS).map(([k, c]) => [k, c.label, c.color])]
    .map(([k, l, c]) => `<button type="button" role="tab" class="wh-chip ${k === 'all' ? 'active' : ''}" data-cat="${k}" style="--c:${c}">${l}</button>`).join('');
  cats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    filter = b.dataset.cat;
    cats.querySelectorAll('.wh-chip').forEach((x) => x.classList.toggle('active', x === b));
    list = filter === 'all' ? ALL : ALL.filter((w) => w.cat === filter);
    renderGrid();
    show(0);
  });

  /* ---------- The stage ---------- */
  function show(i, dir = 1) {
    idx = (i + list.length) % list.length;
    const w = list[idx], c = CATS[w.cat];
    card.style.setProperty('--c', c.color);
    card.classList.remove('in'); void card.offsetWidth;
    // words rise out of smoke, one after another
    // translate the whole sentence first (Hindi / Gujarati), then split it into words for the reveal
    const D = (window.GIB_I18N || {})[window.GibI18n ? window.GibI18n.lang : 'en'] || {};
    const words = (D[w.text] || w.text).split(/(\s+)/);
    let n = 0;
    textEl.innerHTML = words.map((t) => (/^\s+$/.test(t) ? t : `<span class="ww" style="--i:${n++}">${esc(t)}</span>`)).join('');
    textEl.classList.toggle('long', w.text.length > 150);
    textEl.classList.toggle('quote', w.cat === 'wisdom');
    catEl.textContent = c.label;
    numEl.textContent = `${String(w.id).padStart(2, '0')} / ${ALL.length}`;
    srcEl.textContent = w.src && w.src !== 'Giberish' ? w.src : '';
    card.dataset.dir = dir > 0 ? 'next' : 'prev';
    card.classList.add('in');
    setDrift(w.art || ['musk']);
    document.querySelectorAll('.wh-tile').forEach((t) => t.classList.toggle('current', Number(t.dataset.id) === w.id));
    try { history.replaceState(null, '', '#w=' + w.id); } catch (_) {}
    schedule(w, n);
  }
  function schedule(w, nWords) {
    clearTimeout(timer);
    const dur = Math.max(6500, 2600 + nWords * 260);
    prog.style.transition = 'none'; prog.style.transform = 'scaleX(0)';
    if (!playing || !inView || document.hidden) return;
    requestAnimationFrame(() => { prog.style.transition = `transform ${dur}ms linear`; prog.style.transform = 'scaleX(1)'; });
    timer = setTimeout(() => show(idx + 1), dur);
  }
  const restart = () => schedule(list[idx], textEl.querySelectorAll('.ww').length);
  function setPlaying(p) {
    playing = p;
    playBtn.classList.toggle('paused', !p);
    playBtn.setAttribute('aria-label', p ? 'Pause' : 'Play');
    restart();
  }
  $('#wh-next').onclick = () => show(idx + 1, 1);
  $('#wh-prev').onclick = () => show(idx - 1, -1);
  playBtn.onclick = () => setPlaying(!playing);
  $('#wh-share').onclick = async () => {
    const w = list[idx];
    const D = (window.GIB_I18N || {})[window.GibI18n ? window.GibI18n.lang : 'en'] || {};
    const tr = (x) => D[x] || x;
    const text = `${tr(w.text)}${w.src && w.src !== 'Giberish' ? ' — ' + tr(w.src) : ''}\n\n${tr('A whisper from Giberish')}`;
    const url = location.origin + location.pathname + '#w=' + w.id;
    try { if (navigator.share) { await navigator.share({ text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank', 'noopener');
  };
  // keyboard + swipe
  addEventListener('keydown', (e) => {
    if (!inView || /input|textarea|select/i.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') show(idx + 1, 1);
    if (e.key === 'ArrowLeft') show(idx - 1, -1);
  });
  const stage = $('.wh-stage');
  let sx = null;
  stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') sx = e.clientX; });
  stage.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
  card.addEventListener('mouseenter', () => { clearTimeout(timer); prog.style.transition = 'none'; });
  card.addEventListener('mouseleave', restart);
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; restart(); }, { threshold: .45 }).observe(stage);
  document.addEventListener('visibilitychange', restart);

  /* ---------- Ingredients drifting around the card ---------- */
  const cv = $('.wh-drift'), cx = cv.getContext('2d');
  let W = 0, H = 0, sprites = [], fx = [], last = 0, vis = false;
  const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); };
  size(); new ResizeObserver(size).observe(cv);
  function setDrift(kinds) {
    sprites.forEach((s) => (s.out = true));
    const n = W < 600 ? 7 : 12;
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, edge = W < 600 ? .5 : .36;
      sprites.push({
        kind: kinds[i % kinds.length], x: W / 2 + side * W * (edge + Math.random() * (.5 - edge)) * (Math.random() < .25 ? .4 : 1),
        y: H * (.15 + Math.random() * .85), vy: -(8 + Math.random() * 14), size: (W < 600 ? 28 : 38) * (.6 + Math.random() * .8),
        depth: Math.random(), a: 0, wob: Math.random() * 6,
      });
    }
  }
  function loop(t) {
    requestAnimationFrame(loop);
    if (!vis || reduce) return;
    const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    cx.clearRect(0, 0, W, H);
    sprites = sprites.filter((s) => !(s.out && s.a <= 0));
    for (const s of sprites.sort((a, b) => a.depth - b.depth)) {
      s.a = Math.max(0, Math.min(1, s.a + (s.out ? -dt * 1.4 : dt * .6)));
      s.wob += dt; s.y += s.vy * dt; s.x += Math.sin(s.wob * .8) * 6 * dt;
      if (s.y < -40) s.y = H + 40;
      const blur = s.depth < .35 ? 2.2 : 0;
      window.GibArt.draw(cx, s, s.x, s.y, s.size * (.7 + s.depth * .5), s.a * (.45 + s.depth * .55), dt, blur ? null : fx, blur);
    }
    window.GibArt.drawFx(cx, fx, dt);
  }
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(cv);
  requestAnimationFrame(loop);

  /* ---------- Hero smoke ---------- */
  const sm = $('.wh-smoke'), sc = sm.getContext('2d');
  let SW = 0, SH = 0, puffs = [], motes = [], heroVis = true, sl = 0;
  const ssize = () => {
    const r = sm.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 1.5); SW = r.width; SH = r.height; sm.width = SW * d; sm.height = SH * d; sc.setTransform(d, 0, 0, d, 0, 0);
    motes = Array.from({ length: Math.round(SW / 18) }, () => ({ x: Math.random() * SW, y: Math.random() * SH, r: Math.random() * 1.5 + .3, v: 6 + Math.random() * 12, p: Math.random() * 6 }));
  };
  ssize(); new ResizeObserver(ssize).observe(sm);
  new IntersectionObserver(([e]) => { heroVis = e.isIntersecting; }).observe(sm);
  (function smoke(t) {
    requestAnimationFrame(smoke);
    if (!heroVis || reduce) return;
    const dt = Math.min(.05, (t - (sl || t)) / 1000); sl = t;
    sc.clearRect(0, 0, SW, SH);
    if (Math.random() < dt * 9) puffs.push({ x: SW * (.15 + Math.random() * .7), y: SH + 40, r: 40 + Math.random() * 60, life: 0, max: 7 + Math.random() * 5, vx: (Math.random() - .5) * 10 });
    puffs = puffs.filter((p) => (p.life += dt) < p.max);
    for (const p of puffs) {
      p.y -= 38 * dt; p.x += p.vx * dt + Math.sin(p.life * .7) * .4; p.r += 14 * dt;
      const a = Math.sin((p.life / p.max) * Math.PI) * .07;
      const g = sc.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(236,224,206,${a})`); g.addColorStop(1, 'rgba(236,224,206,0)');
      sc.fillStyle = g; sc.beginPath(); sc.arc(p.x, p.y, p.r, 0, Math.PI * 2); sc.fill();
    }
    for (const m of motes) {
      m.y -= m.v * dt; m.p += dt; if (m.y < -4) { m.y = SH + 4; m.x = Math.random() * SW; }
      sc.fillStyle = `rgba(255,220,150,${.25 + .4 * Math.abs(Math.sin(m.p))})`;
      sc.beginPath(); sc.arc(m.x + Math.sin(m.p) * 4, m.y, m.r, 0, Math.PI * 2); sc.fill();
    }
  })(0);

  /* ---------- Grid of every whisper ---------- */
  const grid = $('.wh-grid');
  function renderGrid() {
    grid.innerHTML = list.map((w) => `
      <button type="button" class="wh-tile reveal" data-id="${w.id}" style="--c:${CATS[w.cat].color}">
        <span class="wt-top"><span class="wt-cat">${CATS[w.cat].label}</span><span class="wt-num" data-no-i18n>${String(w.id).padStart(2, '0')}</span></span>
        <span class="wt-text ${w.cat === 'wisdom' ? 'quote' : ''}">${esc(w.text)}</span>
        ${w.src && w.src !== 'Giberish' ? `<span class="wt-src">${esc(w.src)}</span>` : ''}
      </button>`).join('');
    window.gibObserveReveals && window.gibObserveReveals(grid);
  }
  grid.addEventListener('click', (e) => {
    const t = e.target.closest('.wh-tile');
    if (!t) return;
    const i = list.findIndex((w) => w.id === Number(t.dataset.id));
    show(i);
    (window.gibLenis ? window.gibLenis.scrollTo(stage, { offset: -120 }) : stage.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  });

  document.addEventListener('lang:change', () => show(idx));

  // start: a deep-linked whisper (#w=12) or the first
  renderGrid();
  const m = location.hash.match(/w=(\d+)/);
  show(m ? Math.max(0, ALL.findIndex((w) => w.id === Number(m[1]))) : 0);
  if (reduce) setPlaying(false);
});
