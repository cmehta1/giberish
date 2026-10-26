/* ============================================================
   GIBERISH — home page: philosophy story, rail, kundli wheel, breathe
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => document.querySelector(s);
  // the setup below runs in a few short steps, handing the main thread back in between, so taps and paint never wait long
  const yieldToMain = () => (window.scheduler && scheduler.yield ? scheduler.yield() : new Promise((r) => setTimeout(r, 0)));

  /* ---------- Intro reveal (once per visit) ---------- */
  const intro = document.getElementById('intro');
  if (intro && document.documentElement.classList.contains('intro-on')) {
    try { sessionStorage.setItem('gibIntro', '1'); } catch (_) {}
    document.body.classList.add('no-scroll');
    // candle-lit dust
    const c = intro.querySelector('.intro-dust'), x = c.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const vw = innerWidth, vh = innerHeight; // read once: reading them every frame forces a layout
    c.width = vw * dpr; c.height = vh * dpr; x.scale(dpr, dpr);
    const specks = Array.from({ length: 46 }, () => ({ x: Math.random() * vw, y: Math.random() * vh, r: Math.random() * 1.4 + .3, v: Math.random() * 10 + 4, p: Math.random() * 6 }));
    let live = true, last = performance.now();
    (function dust(now) {
      if (!live) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      x.clearRect(0, 0, vw, vh);
      for (const s of specks) {
        s.y -= s.v * dt; s.x += Math.sin(now / 1000 + s.p) * .2; s.p += dt;
        if (s.y < -5) s.y = vh + 5;
        x.fillStyle = `rgba(255,214,140,${.35 + .35 * Math.sin(s.p * 2)})`;
        x.beginPath(); x.arc(s.x, s.y, s.r, 0, Math.PI * 2); x.fill();
      }
      requestAnimationFrame(dust);
    })(last);

    let finished = false;
    const finish = (fast) => {
      if (finished) return;
      finished = true;
      // the intro monk glides to where the hero emblem's monk sits
      const from = intro.querySelector('.intro-monk'), to = document.querySelector('.hero .em-monk');
      if (to && !fast) {
        const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
        from.style.transition = 'transform 1s cubic-bezier(.7,0,.2,1)';
        from.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.bottom - a.bottom}px) scale(${b.width / a.width})`;
      }
      document.documentElement.classList.add('after-intro');
      document.documentElement.classList.remove('intro-on');
      document.body.classList.remove('no-scroll');
      intro.classList.add('done');
      setTimeout(() => { live = false; intro.remove(); }, fast ? 900 : 1300);
    };
    const skip = () => finish(true);
    setTimeout(() => finish(false), reduceMotion ? 1400 : 5600);
    intro.addEventListener('click', skip);
    addEventListener('wheel', skip, { once: true, passive: true });
    addEventListener('touchmove', skip, { once: true, passive: true });
    addEventListener('keydown', skip, { once: true });
  }

  await yieldToMain();

  /* ---------- Living emblem + floating ingredients ---------- */
  window.GibScene.emblem('#hero-emblem');

  await yieldToMain();

  /* ---------- Story ending: bottles that spray ---------- */
  const sbWrap = document.querySelector('.story-bottles');
  if (sbWrap) {
    const em = (cls, angle, power = 1) => ({ el: sbWrap.querySelector(cls), nozzle: [.5, .02], angle, spread: 22, power });
    window.GibScene.mount(sbWrap, {
      center: '.sb-main', centerY: .45, count: 12, rx: .34, ry: .06, size: [.02, .036], tilt: -4,
      kinds: ['petal', 'rose', 'jasmine', 'saffron', 'orange', 'honey', 'amber', 'leaf'],
      // side bottles spray; the centre vessel is an incense-like attar burner, so it smokes instead
      emitters: [em('.sb-l1', -118, .7), em('.sb-r1', -62, .7), em('.sb-l2', -125, .45), em('.sb-r2', -55, .45)],
      smokers: [{ el: sbWrap.querySelector('.sb-main'), nozzle: [.5, .015] }],
      autoSpray: 1500,
    });
  }

  await yieldToMain();

  /* ---------- Featured rail ---------- */
  const rail = $('#featured-rail');
  const order = ['barakkat-rouge-540', 'liquid-burn', 'green-irish', 'kaaf', 'fahad', 'giberish-signature', 'white-oud', 'ajmal-1001-night', 'mukhallat-malaki', 'musk-gold'];
  rail.innerHTML = order.map((id) => window.GIB_PRODUCTS.find((p) => p.id === id)).filter(Boolean)
    .map((p) => `<div class="rail-item">${window.gibCard(p)}</div>`).join('');

  await yieldToMain();

  /* ---------- Noise words ---------- */
  const WORDS = ['deadlines', 'notifications', 'what if', 'hurry', 'EMI', 'traffic', 'should', 'jaldi karo', 'tension', 'meeting', 'ping', 'more', 'faster', 'log kya kahenge', 'kal', 'scroll', 'reply', 'compare', 'not enough', 'overthinking', 'later', 'busy', 'unread (99+)', 'kya hoga', 'news', 'target', 'expectations', 'noise', 'why me', 'hurry up'];
  const field = $('.noise-field');
  const isSmall = innerWidth < 700;
  const words = WORDS.slice(0, isSmall ? 20 : WORDS.length).map((w, i) => {
    const el = document.createElement('span');
    el.className = 'nw';
    el.textContent = w;
    el.dataset.orig = w;
    // keep the centre band a bit clearer for the story text
    let x = Math.random() * 90 + 2, y = Math.random() * 88 + 4;
    if (y > 34 && y < 62) y = y < 48 ? y - 18 : y + 18;
    el.style.left = x + '%';
    el.style.top = y + '%';
    el.style.fontSize = (isSmall ? 14 : 16) + Math.random() * (isSmall ? 14 : 26) + 'px';
    el.style.animationDelay = (-Math.random() * 3) + 's';
    el.style.animationDuration = (.25 + Math.random() * .4) + 's';
    field.appendChild(el);
    return el;
  });
  const GLYPHS = 'abcdefghijklmnopqrstuvwxyzअकखगचजटडतदनपबमयरलवसह؟ع';
  let scrambled = false;
  function scramble(on) {
    if (on === scrambled) return;
    scrambled = on;
    words.forEach((w) => {
      w.textContent = on ? [...w.dataset.orig].map((ch) => (ch === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('') : w.dataset.orig;
    });
  }

  await yieldToMain();

  /* ---------- Story timeline ---------- */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // Hero parallax
    gsap.to('.hero-inner', { yPercent: 25, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    gsap.set('.story-text', { autoAlpha: 0, y: 40 });
    gsap.set('.s1', { autoAlpha: 1, y: 0 });
    gsap.set('.drop', { y: '-60vh', autoAlpha: 0 });
    gsap.set('.ripple', { scale: 0, autoAlpha: 0 });
    gsap.set('.story-bottles', { autoAlpha: 0 });
    gsap.set('.sb', { y: 140, autoAlpha: 0 });

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: '.story', start: 'top top', end: () => '+=' + innerHeight * 4.2,
        scrub: 1, pin: '.story-pin', anticipatePin: 1,
        onUpdate: (st) => {
          scramble(st.progress > .14 && st.progress < .5);
          document.querySelector('.story-progress i').style.transform = `scaleX(${st.progress})`;
        },
      },
    });
    tl.fromTo('.nw', { autoAlpha: 0, scale: .6 }, { autoAlpha: (i) => .25 + Math.random() * .5, scale: 1, stagger: { each: .02, from: 'random' }, duration: .6 }, 0)
      .to('.nw', { x: () => (Math.random() - .5) * 60, duration: .8 }, .6)
      // II — letting go
      .to('.s1', { autoAlpha: 0, y: -40, duration: .5 }, 1.2)
      .to('.s2', { autoAlpha: 1, y: 0, duration: .6 }, 1.5)
      .to('.nw', { color: '#d4a957', duration: .4 }, 1.6)
      .to('.nw', {
        y: () => innerHeight * (.6 + Math.random() * .6), rotation: () => (Math.random() - .5) * 120,
        autoAlpha: 0, filter: 'blur(6px)', stagger: { each: .03, from: 'random' }, duration: 1.4, ease: 'power2.in',
      }, 2.3)
      // III — silence
      .to('.s2', { autoAlpha: 0, y: -40, duration: .5 }, 3.4)
      .to('.story-pin', { '--dark': 1, duration: .6 }, 3.4)
      .to('.s3', { autoAlpha: 1, y: 0, duration: .7 }, 3.8)
      .to('.drop', { autoAlpha: 1, duration: .1 }, 4.4)
      .to('.drop', { y: 0, duration: .8, ease: 'power3.in' }, 4.4)
      .to('.drop', { scaleY: .3, scaleX: 1.6, autoAlpha: 0, duration: .2 }, 5.2)
      .to('.ripple', { scale: 6, autoAlpha: 1, duration: 1.2, stagger: .25, ease: 'power1.out' }, 5.2)
      .to('.ripple', { autoAlpha: 0, duration: .6, stagger: .25 }, 5.8)
      // IV — essence
      .to('.s3', { autoAlpha: 0, y: -40, duration: .5 }, 6.2)
      .to('.story-bottles', { autoAlpha: 1, duration: .3 }, 6.3)
      .to('.sb-main', { y: 0, autoAlpha: 1, duration: 1.2, ease: 'power3.out' }, 6.4)
      .to('.sb-l1, .sb-r1', { y: 0, autoAlpha: 1, duration: 1.1, stagger: .12, ease: 'power3.out' }, 6.6)
      .to('.sb-l2, .sb-r2', { y: 0, autoAlpha: 1, duration: 1.1, stagger: .12, ease: 'power3.out' }, 6.8)
      .to('.s4', { autoAlpha: 1, y: 0, duration: .8 }, 6.8)
      .to({}, { duration: .8 });

    // Featured rail entrance
    gsap.from('.rail-item', { y: 80, autoAlpha: 0, stagger: .08, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.rail', start: 'top 85%' } });
    // Home ritual image parallax
    gsap.fromTo('.hr-media img', { yPercent: -8, scale: 1.1 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.home-ritual', start: 'top bottom', end: 'bottom top', scrub: true } });
  } else {
    document.querySelectorAll('.story-text, .story-bottles').forEach((e) => (e.style.opacity = 1));
    document.querySelector('.story').classList.add('static');
  }

  await yieldToMain();

  /* ---------- Petal rain on the feel banner ---------- */
  const rain = document.querySelector('.petal-rain');
  if (rain && !reduceMotion) {
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = -Math.random() * 8 + 's';
      p.style.animationDuration = 6 + Math.random() * 5 + 's';
      p.style.setProperty('--s', .6 + Math.random() * .8);
      p.style.setProperty('--d', (Math.random() - .5) * 120 + 'px');
      rain.appendChild(p);
    }
  }

  await yieldToMain();

  /* ---------- Kundli wheel ---------- */
  const wheel = $('#kundli-wheel');
  if (wheel) {
    const notes = ['Rose', 'Oud', 'Saffron', 'Amber', 'Musk', 'Jasmine', 'Sandal', 'Vanilla', 'Citrus', 'Incense', 'Leather', 'Cardamom'];
    const cx = 200, cy = 200;
    let s = `<circle cx="200" cy="200" r="190" class="kw-line"/><circle cx="200" cy="200" r="150" class="kw-line"/><circle cx="200" cy="200" r="88" class="kw-line"/>`;
    // classic kundli diamond
    s += `<path d="M200 10 L390 200 L200 390 L10 200 Z" class="kw-line"/><path d="M66 66 L334 334 M334 66 L66 334" class="kw-line faint"/>`;
    s += '<g class="kw-rot">';
    notes.forEach((n, i) => {
      const a = (i / notes.length) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * 170, y = cy + Math.sin(a) * 170;
      const deg = (a * 180) / Math.PI + 90;
      s += `<text x="${x}" y="${y}" transform="rotate(${deg} ${x} ${y})" class="kw-text">${n}</text>`;
      const x2 = cx + Math.cos(a) * 150, y2 = cy + Math.sin(a) * 150;
      s += `<circle cx="${x2}" cy="${y2}" r="3" class="kw-dot"/>`;
    });
    s += '</g>';
    // random constellation inside
    const pts = Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + .3, r = 95 + (i % 2 ? 30 : 10);
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
    s += `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" class="kw-poly"/>`;
    wheel.innerHTML = s;
  }

  await yieldToMain();

  /* ---------- A minute of silence: lotus breathing ---------- */
  const stageBtn = $('#breathe');
  if (stageBtn) {
    const lotus = stageBtn.querySelector('.br-lotus'), prog = stageBtn.querySelector('.br-progress');
    const phaseEl = stageBtn.querySelector('.br-phase'), countEl = stageBtn.querySelector('.br-count');
    const cap = document.querySelector('.breathe-caption');
    const C = 1169; // ring circumference
    const STEPS = [['Breathe in', 4, 1], ['Hold', 2, 1], ['Let it go', 5, 0]];
    let running = false, timers = [], dir = 0;
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    function setPhase(label, secs, open, round, i) {
      phaseEl.style.opacity = 0;
      later(() => { phaseEl.textContent = label; phaseEl.style.opacity = 1; }, 250);
      lotus.style.setProperty('--dur', secs + 's');
      lotus.style.setProperty('--open', open);
      dir = label === 'Breathe in' ? -1 : label === 'Let it go' ? 1 : 0;
      for (let k = 0; k < secs; k++) later(() => (countEl.textContent = secs - k), k * 1000);
      // progress ring fills across the whole minute
      const done = (round * 11 + [0, 4, 6][i]) / 33, next = (round * 11 + [4, 6, 11][i]) / 33;
      prog.style.transition = 'none'; prog.style.strokeDashoffset = C * (1 - done);
      requestAnimationFrame(() => { prog.style.transition = `stroke-dashoffset ${secs}s linear, opacity .6s`; prog.style.strokeDashoffset = C * (1 - next); });
    }
    function stop(msg) {
      timers.forEach(clearTimeout); timers = []; running = false; dir = 0;
      stageBtn.classList.remove('running');
      lotus.style.removeProperty('--open'); lotus.style.removeProperty('--dur');
      countEl.textContent = '';
      phaseEl.innerHTML = msg || 'Tap &amp; breathe<br>with us';
    }
    stageBtn.addEventListener('click', () => {
      if (running) return stop();
      running = true;
      stageBtn.classList.add('running');
      if (window.GibSound) window.GibSound.chime(); // the visitor tapped, so a soft bell is welcome
      let t = 600;
      for (let round = 0; round < 3; round++) STEPS.forEach(([label, secs, open], i) => { later(() => setPhase(label, secs, open, round, i), t); t += secs * 1000; });
      later(() => {
        stop('Welcome<br>back');
        if (window.GibSound) window.GibSound.chime();
        cap.innerHTML = 'That quiet you feel right now? <span class="gold">That’s Giberish.</span>';
      }, t + 200);
    });

    // gold motes drift inward as you breathe in, outward as you let go
    const cv = stageBtn.querySelector('.br-motes'), cx = cv.getContext('2d');
    let W = 0, motes = [], vis = false;
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      W = r.width; cv.width = W * d; cv.height = W * d; cx.setTransform(d, 0, 0, d, 0, 0);
      motes = Array.from({ length: 70 }, () => ({ a: Math.random() * Math.PI * 2, r: .15 + Math.random() * .35, s: .4 + Math.random() * 1.4, tw: Math.random() * 6 }));
    };
    size(); new ResizeObserver(size).observe(cv);
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(cv);
    (function loop() {
      requestAnimationFrame(loop);
      if (!vis || reduceMotion) return;
      cx.clearRect(0, 0, W, W);
      for (const m of motes) {
        m.tw += .03; m.a += .0015;
        m.r += dir * .0016 + (dir === 0 ? Math.sin(m.tw) * .0003 : 0);
        if (m.r < .1) m.r = .48; if (m.r > .5) m.r = .12;
        const x = W / 2 + Math.cos(m.a) * m.r * W, y = W / 2 + Math.sin(m.a) * m.r * W;
        cx.fillStyle = `rgba(255,222,150,${.25 + .5 * Math.abs(Math.sin(m.tw))})`;
        cx.beginPath(); cx.arc(x, y, m.s, 0, Math.PI * 2); cx.fill();
      }
    })();
  }
});
