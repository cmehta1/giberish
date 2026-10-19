/* ============================================================
   GIBERISH — Scent Kundli
   A scent "horoscope": 10 questions → archetype, chart, matches,
   and a bespoke attar formula the visitor can order.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('k-app');
  const FAM = window.GIB_FAMILIES;
  const FKEYS = Object.keys(FAM);
  const money = window.gibMoney;
  const C = window.GIB_CONFIG;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const QUESTIONS = [
    { key: 'name', type: 'name', eyebrow: 'Before we begin', q: 'What should we <em>call you?</em>', hint: 'Your kundli and your bespoke attar will carry your name.' },
    { key: 'hour', eyebrow: 'The hour', q: 'When do you feel <em>most like yourself?</em>', opts: [
      ['🌅', 'Dawn', 'First light, first chai', { fresh: 1, musk: .5 }],
      ['☀️', 'Golden afternoon', 'Warm light through the curtains', { amber: 1, floral: .4 }],
      ['🪔', 'Dusk', 'When the lamps are lit', { woody: .6, amber: .7 }],
      ['🌙', 'Midnight', 'When the world finally sleeps', { woody: 1, spicy: .5 }],
    ] },
    { key: 'place', eyebrow: 'The place', q: 'Where does your mind <em>go to rest?</em>', opts: [
      ['🌹', 'A rose garden after rain', 'Petals, wet earth, birdsong', { floral: 1.2 }],
      ['🛕', 'An old temple courtyard', 'Stone, smoke, bells far away', { woody: 1, amber: .5 }],
      ['🌊', 'A cliff above the sea', 'Wind, salt, open sky', { fresh: 1.2 }],
      ['🏮', 'A spice bazaar at dusk', 'Colour, noise, saffron in the air', { spicy: 1.2 }],
      ['📚', 'A library of old books', 'Paper, wood, a quiet corner', { woody: .6, musk: .6, amber: .4 }],
    ] },
    { key: 'memory', eyebrow: 'The memory', q: 'Which memory <em>smells like home?</em>', opts: [
      ['🪵', 'Nani’s cupboard', 'Sandalwood and old silk sarees', { woody: 1, musk: .4 }],
      ['🌧️', 'First rain on dry earth', 'That smell of mitti', { fresh: .7, woody: .5 }],
      ['✨', 'Diwali night', 'Diyas, incense, sweets', { amber: 1, woody: .4, spicy: .3 }],
      ['🌼', 'A mehendi evening', 'Jasmine in the hair, henna on hands', { floral: 1.2 }],
      ['☁️', 'Laundry drying in the sun', 'Clean, soft, simple', { musk: 1.2, fresh: .4 }],
    ] },
    { key: 'texture', eyebrow: 'The texture', q: 'Which fabric would you <em>wrap yourself in?</em>', opts: [
      ['🪶', 'Silk', 'Cool, fluid, effortless', { musk: .8, floral: .5 }],
      ['🧣', 'Pashmina', 'Soft warmth on a winter evening', { amber: .8, musk: .6 }],
      ['🌾', 'Raw linen', 'Light, breezy, honest', { fresh: 1.1 }],
      ['🍷', 'Velvet', 'Deep, rich, a little dramatic', { woody: .7, amber: .6, spicy: .3 }],
      ['🧥', 'Worn leather', 'Lived-in and confident', { spicy: .7, woody: .8 }],
    ] },
    { key: 'presence', eyebrow: 'The presence', q: 'When you leave a room, <em>people should feel…</em>', opts: [
      ['🕊️', 'Calm', 'Like everything is okay', { musk: 1, woody: .3 }],
      ['🗝️', 'Curious', 'Who was that?', { woody: .8, spicy: .5 }],
      ['🔥', 'Unforgettable', 'They’ll remember you tomorrow', { spicy: 1, amber: .6 }],
      ['🤍', 'Warm', 'Like they’ve just been hugged', { amber: 1, musk: .5 }],
      ['🍃', 'Refreshed', 'Like a window was opened', { fresh: 1.2 }],
    ] },
    { key: 'voice', eyebrow: 'The voice', q: 'How loud should your fragrance <em>speak?</em>', opts: [
      ['🤫', 'A whisper', 'Only those close to me should know', { musk: .5 }, 1],
      ['💬', 'A conversation', 'Noticed, never overpowering', {}, 2],
      ['📯', 'A statement', 'It should enter before me', { spicy: .4, woody: .4 }, 3],
    ] },
    { key: 'when', eyebrow: 'The moment', q: 'When will you <em>wear it most?</em>', opts: [
      ['🌿', 'Every day', 'My signature, my skin', { fresh: .5, musk: .5 }],
      ['🥂', 'Evenings out', 'Dinners, dates, music', { amber: .6, spicy: .5 }],
      ['🧘', 'Prayer & meditation', 'My quiet time', { woody: .8, amber: .4 }],
      ['💐', 'Celebrations', 'Weddings, festivals, family', { floral: .6, spicy: .5 }],
    ] },
    { key: 'sound', eyebrow: 'The sound', q: 'Which sound <em>brings you peace?</em>', opts: [
      ['🔔', 'Temple bells', 'Far away, at dusk', { woody: .8, amber: .5 }],
      ['🌧️', 'Rain on leaves', 'Soft and steady', { fresh: 1, floral: .3 }],
      ['🌊', 'Ocean waves', 'Slow and endless', { fresh: .8, musk: .5 }],
      ['🔥', 'A crackling fire', 'Warm hands, long talks', { amber: .9, spicy: .4 }],
      ['🐦', 'Birdsong at dawn', 'A garden waking up', { floral: 1.1 }],
    ] },
    { key: 'noise', eyebrow: 'The noise', q: 'How loud is your <em>inner noise</em> today?', hint: 'Be honest. There’s no wrong answer here.', opts: [
      ['🌪️', 'Very loud', 'I really need some peace', { musk: .5, woody: .5 }, 3],
      ['〰️', 'A constant hum', 'Busy, but managing', { amber: .3 }, 2],
      ['🪷', 'Quiet', 'I feel content right now', { floral: .3, fresh: .3 }, 1],
    ] },
  ];

  const ARCH = {
    woody:  { title: 'The Midnight <em>Sufi</em>', plain: 'The Midnight Sufi', reading: 'You are depth that never needs to announce itself. People feel steadier around you without knowing why. Your scent lives in old woods, smoke and oud, the fragrance of someone who has already sat with their own silence.' },
    floral: { title: 'The Rose <em>Mystic</em>', plain: 'The Rose Mystic', reading: 'You love openly and remember everything. There’s a garden inside you that blooms even in winter. Your scent is petals and soft light: romantic, generous and quietly unforgettable.' },
    amber:  { title: 'The Golden Hour <em>Soul</em>', plain: 'The Golden Hour Soul', reading: 'You are warmth. When you walk in, the room softens like late afternoon light. Your scent is amber, resin and vanilla, the feeling of coming home after a long day.' },
    spicy:  { title: 'The Saffron <em>Royal</em>', plain: 'The Saffron Royal', reading: 'You were not made to blend in. You carry fire with grace, and people remember your name. Your scent is saffron, spice and smoke: bold, regal and impossible to ignore.' },
    fresh:  { title: 'The Monsoon <em>Wanderer</em>', plain: 'The Monsoon Wanderer', reading: 'You are the first breath after rain. Restless in the best way, you bring air into every room. Your scent is citrus, green leaves and open sky, made for people who are always becoming.' },
    musk:   { title: 'The Velvet <em>Whisper</em>', plain: 'The Velvet Whisper', reading: 'You don’t chase attention; it finds you. Gentle, clean and deeply comforting, you are the person others tell their secrets to. Your scent is soft musk, like your own skin on its best day.' },
  };
  const NOTE_FOR = {
    floral: ['Rose', 'Jasmine'], woody: ['Oud', 'Sandalwood'], amber: ['Amber', 'Vanilla'],
    fresh: ['Bergamot', 'Green Cardamom'], spicy: ['Saffron', 'Pink Pepper'], musk: ['White Musk', 'Orris'],
  };

  // Poetic names for the bespoke attar, chosen by the ruling family (e.g. "Chetas’s Kesar Darbar")
  const POETIC = {
    woody:  ['Midnight Raag', 'Sandal Sutra', 'Temple Dusk', 'Oud Nocturne', 'Silent Darbar', 'Agarwood Dua'],
    floral: ['Gulab Ghazal', 'Rose Dua', 'Jasmine Sutra', 'Mehendi Moon', 'Petal Prayer', 'Mogra Nights'],
    amber:  ['Golden Aarti', 'Amber Dhoop', 'Honeyed Dusk', 'Diya Glow', 'Shahad Noor', 'Saanjh Sona'],
    spicy:  ['Kesar Darbar', 'Saffron Sutra', 'Royal Ember', 'Zafran Noor', 'Spice Route Raag', 'Shahi Kesar'],
    fresh:  ['Monsoon Raag', 'First Rain', 'Barish Dua', 'Neem Breeze', 'Sea Mehfil', 'Pehli Barish'],
    musk:   ['Velvet Silence', 'Mulmul Musk', 'Soft Noor', 'Chandni Whisper', 'Quiet Kasturi', 'Resham Dua'],
  };
  const NOTE_ART = {
    Rose: ['rose', 'petal'], Jasmine: ['jasmine'], Oud: ['oud'], Sandalwood: ['sandalwood'], Amber: ['amber', 'honey'], Vanilla: ['vanilla'],
    Bergamot: ['orange', 'lemon', 'leaf'], 'Green Cardamom': ['cardamom'], Saffron: ['saffron'], 'Pink Pepper': ['anise'], 'White Musk': ['musk'], Orris: ['jasmine', 'musk'],
  };

  let step = -1;
  const answers = {};

  /* ---------- Intro ---------- */
  function intro() {
    app.innerHTML = `
      <div class="k-intro k-anim-in">
        <div class="kt-wheel"><svg viewBox="0 0 400 400" id="kw"></svg><div class="kt-center"><img src="assets/img/buddha.webp" alt=""></div></div>
        <span class="eyebrow">Only at Giberish</span>
        <h1 class="h-1" style="margin:14px 0 18px">Your <span class="script" style="font-size:1.35em">Scent Kundli</span></h1>
        <p class="lead" style="margin:0 auto">Your stars have a kundli. So does your soul. Answer ten small questions and we’ll read your scent chart, find the fragrances that are already yours and hand-blend an attar <span class="gold">made only for you.</span></p>
        <div class="btn-row" style="justify-content:center;margin-top:30px"><button class="btn btn-solid" id="k-start">Begin my reading</button></div>
        <p class="muted" style="font-size:13px;margin-top:16px">About 4 minutes · Free · Shareable</p>
      </div>`;
    drawWheel(document.getElementById('kw'));
    document.getElementById('k-start').onclick = () => go(0);
  }

  function drawWheel(svg) {
    const notes = ['Rose', 'Oud', 'Saffron', 'Amber', 'Musk', 'Jasmine', 'Sandal', 'Vanilla', 'Citrus', 'Incense', 'Leather', 'Cardamom'];
    let s = `<circle cx="200" cy="200" r="190" class="kw-line"/><circle cx="200" cy="200" r="150" class="kw-line"/><path d="M200 10 L390 200 L200 390 L10 200 Z" class="kw-line"/><path d="M66 66 L334 334 M334 66 L66 334" class="kw-line faint"/><g class="kw-rot">`;
    notes.forEach((n, i) => {
      const a = (i / notes.length) * Math.PI * 2 - Math.PI / 2, x = 200 + Math.cos(a) * 170, y = 200 + Math.sin(a) * 170;
      s += `<text x="${x}" y="${y}" transform="rotate(${(a * 180) / Math.PI + 90} ${x} ${y})" class="kw-text">${n}</text>`;
    });
    svg.innerHTML = s + '</g>';
  }

  /* ---------- Questions ---------- */
  function go(i) {
    step = i;
    if (i >= QUESTIONS.length) return reading();
    const Q = QUESTIONS[i];
    const prog = QUESTIONS.map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('');
    let body = '';
    if (Q.type === 'name') {
      body = `<form class="k-name" id="k-name-form">
          <div class="field"><input id="k-name" maxlength="24" autocomplete="given-name" placeholder="Your first name" value="${esc(answers.name || '')}"></div>
          <button class="btn btn-solid" type="submit">Continue</button>
        </form>`;
    } else {
      body = `<div class="k-opts">${Q.opts.map((o, j) => `
        <button class="k-opt ${answers[Q.key] === j ? 'picked' : ''}" data-j="${j}">
          <span class="emo" aria-hidden="true">${o[0]}</span><b>${o[1]}</b><small>${o[2]}</small>
        </button>`).join('')}</div>`;
    }
    app.innerHTML = `
      <div class="k-progress">${prog}</div>
      <div class="k-q k-anim-in">
        <span class="eyebrow">${i + 1} / ${QUESTIONS.length} · ${Q.eyebrow}</span>
        <h2 class="h-1">${Q.q}</h2>
        <p class="muted">${Q.hint || '&nbsp;'}</p>
        ${body}
      </div>
      <div class="k-nav">${i > 0 ? '<button class="k-back" id="k-back">← Back</button>' : '<span></span>'}<span></span></div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const back = document.getElementById('k-back');
    if (back) back.onclick = () => go(i - 1);
    if (Q.type === 'name') {
      const input = document.getElementById('k-name');
      if (matchMedia('(hover: hover)').matches) input.focus();
      document.getElementById('k-name-form').onsubmit = (e) => {
        e.preventDefault();
        answers.name = input.value.trim().replace(/\s+/g, ' ').slice(0, 24) || 'You';
        go(i + 1);
      };
    } else {
      app.querySelectorAll('.k-opt').forEach((b) => {
        b.addEventListener('pointermove', (e) => {
          const r = b.getBoundingClientRect();
          b.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
          b.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
        });
        b.onclick = () => {
          answers[Q.key] = Number(b.dataset.j);
          app.querySelectorAll('.k-opt').forEach((x) => x.classList.toggle('picked', x === b));
          setTimeout(() => go(i + 1), 380);
        };
      });
    }
  }

  /* ---------- Scoring ---------- */
  function profile() {
    const v = Object.fromEntries(FKEYS.map((k) => [k, .15]));
    let intensity = 2, noise = 2;
    QUESTIONS.forEach((Q) => {
      if (!Q.opts || answers[Q.key] == null) return;
      const o = Q.opts[answers[Q.key]];
      Object.entries(o[3]).forEach(([k, w]) => (v[k] += w));
      if (Q.key === 'voice') intensity = o[4];
      if (Q.key === 'noise') noise = o[4];
    });
    const max = Math.max(...Object.values(v));
    FKEYS.forEach((k) => (v[k] /= max));
    const ranked = [...FKEYS].sort((a, b) => v[b] - v[a]);
    return { v, ranked, intensity, noise };
  }

  function matches(prof) {
    const norm = (o) => Math.sqrt(FKEYS.reduce((a, k) => a + o[k] * o[k], 0)) || 1;
    const pn = norm(prof.v);
    return window.GIB_PRODUCTS.filter((p) => p.type !== 'ritual').map((p) => {
      const f = window.gibProductFamily(p);
      const cos = FKEYS.reduce((a, k) => a + f[k] * prof.v[k], 0) / (norm(f) * pn);
      return { p, score: Math.round(72 + cos * 27) };
    }).sort((a, b) => b.score - a.score || (b.p.price != null) - (a.p.price != null)).slice(0, 3);
  }

  function hash(str) { let h = 7; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 997; return h; }

  function blend(prof) {
    const pick = (fams, avoid = []) => {
      const f = prof.ranked.find((k) => fams.includes(k)) || fams[0];
      return NOTE_FOR[f].find((n) => !avoid.includes(n)) || NOTE_FOR[f][0];
    };
    const top = pick(['fresh', 'spicy', 'floral']);
    const heart = pick(['floral', 'spicy', 'amber'], [top]);
    const base = pick(['woody', 'amber', 'musk'], [top, heart]);
    const list = POETIC[prof.ranked[0]];
    const title = list[hash(answers.name + prof.ranked.join('')) % list.length];
    return finish({ owner: answers.name, title, top, heart, base, voice: prof.intensity, arch: prof.ranked[0], c1: prof.ranked[0], c2: prof.ranked[1] });
  }

  /* ---------- Portable blends: fine-tune, code, share link ---------- */
  const VOICES = ['', 'Soft · skin-close', 'Classic · balanced', 'Intense · long trail'];
  const OPTS = {
    top: ['Bergamot', 'Green Cardamom', 'Saffron', 'Pink Pepper', 'Rose', 'Jasmine'],
    heart: ['Rose', 'Jasmine', 'Saffron', 'Pink Pepper', 'Amber', 'Vanilla', 'Orris'],
    base: ['Oud', 'Sandalwood', 'Amber', 'Vanilla', 'White Musk', 'Orris'],
  };
  const ABBR = { Rose: 'ROS', Jasmine: 'JAS', Oud: 'OUD', Sandalwood: 'SAN', Amber: 'AMB', Vanilla: 'VAN', Bergamot: 'BER', 'Green Cardamom': 'CAR', Saffron: 'SAF', 'Pink Pepper': 'PEP', 'White Musk': 'MSK', Orris: 'ORR' };
  // derived fields (label, art, code) from the stored essentials
  function finish(b) {
    b.voice = Math.min(3, Math.max(1, Number(b.voice) || 2));
    b.strength = VOICES[b.voice];
    b.art = [...new Set([b.top, b.heart, b.base].flatMap((n) => NOTE_ART[n] || ['musk']))];
    const who = (b.owner || 'You').trim();
    b.name = `${who === 'You' ? 'Your' : who + '’s'} ${b.title}`;
    // a short code anyone can quote on WhatsApp / Instagram to order the exact formula
    b.code = `GB-${[b.top, b.heart, b.base].map((n) => ABBR[n] || n.slice(0, 3).toUpperCase()).join('-')}-${b.voice}`;
    b.formula = `Top: ${b.top}, Heart: ${b.heart}, Base: ${b.base}, ${b.strength}${ARCH[b.arch] ? ' (' + ARCH[b.arch].plain + ')' : ''} · Code ${b.code}`;
    return b;
  }
  const b64e = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = (s) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
  function shareURL(b) {
    const data = { o: b.owner, t: b.title, n: [b.top, b.heart, b.base], v: b.voice, a: b.arch, c: [b.c1, b.c2] };
    return location.origin + location.pathname + '?blend=' + b64e(data);
  }
  function readShared() {
    const q = new URLSearchParams(location.search).get('blend');
    if (!q) return null;
    try {
      const d = b64d(q);
      const ok = (n, list) => (list.includes(n) ? n : list[0]);
      return finish({ owner: String(d.o || 'A friend').slice(0, 24), title: String(d.t || 'Elixir').slice(0, 40), top: ok(d.n[0], OPTS.top), heart: ok(d.n[1], OPTS.heart), base: ok(d.n[2], OPTS.base), voice: d.v, arch: ARCH[d.a] ? d.a : 'amber', c1: FAM[d.c && d.c[0]] ? d.c[0] : 'amber', c2: FAM[d.c && d.c[1]] ? d.c[1] : 'woody' });
    } catch (_) { return null; }
  }

  // Renders the bespoke attar block (vial, formula, fine-tune, order, share) into `slot`
  function mountBlend(slot, b, { shared = false } = {}) {
    let scene = null;
    const sel = (key, list, val) => `<label class="ft-field"><span>${key[0].toUpperCase() + key.slice(1)}</span><select data-ft="${key}">${list.map((n) => `<option ${n === val ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
    slot.innerHTML = `
      <div class="blend-card">
        <div class="blend-stage" id="blend-stage">
          <div class="blend-vial" role="button" tabindex="0" aria-label="Spray this attar">
            <div class="cap"></div>
            <div class="glass"><div class="liquid" id="k-liquid" style="--l1:${FAM[b.c1].color};--l2:${FAM[b.c2].color}"></div></div>
            <div class="label">${esc(b.owner === 'You' ? 'Yours' : b.owner)}<br><small>${esc(b.title)}</small></div>
          </div>
          <span class="bs-hint">Tap the bottle to spray</span>
        </div>
        <div>
          <span class="eyebrow">${shared ? 'Shared with you · Bespoke attar' : 'Bespoke · Hand-blended for you'}</span>
          <h2 class="h-1" style="margin:12px 0 10px">${esc(b.name)}</h2>
          <p class="muted">${shared ? `${esc(b.owner)} created this attar in their Scent Kundli and shared the exact formula with you. Order it and we’ll hand-blend the very same bottle.` : 'An attar that exists nowhere else in the world. We blend it by hand from your reading, label it with your name and send it wrapped like a prayer.'}</p>
          <div class="formula pyramid" id="k-formula"></div>
          <details class="fine-tune" ${shared ? '' : 'open'}>
            <summary>${shared ? 'Make it yours: adjust the notes' : 'Fine-tune your blend'}</summary>
            <div class="ft-grid">${sel('top', OPTS.top, b.top)}${sel('heart', OPTS.heart, b.heart)}${sel('base', OPTS.base, b.base)}
              <label class="ft-field"><span>Voice</span><select data-ft="voice">${[1, 2, 3].map((v) => `<option value="${v}" ${v === b.voice ? 'selected' : ''}>${VOICES[v]}</option>`).join('')}</select></label></div>
          </details>
          <div class="p-foot">
            <div class="p-price">${money(C.bespokePrice)}<small>6 ml · Bespoke attar</small></div>
            <button class="btn btn-solid" id="k-order">${shared ? 'Order this exact blend' : 'Blend it for me'}</button>
          </div>
          <div class="share-row" style="justify-content:flex-start;margin-top:16px">
            <button class="btn btn-sm" id="k-share-blend">Share this blend</button>
            <button class="btn btn-ghost btn-sm" id="k-copy-blend">Copy link</button>
          </div>
        </div>
      </div>`;
    const formulaEl = slot.querySelector('#k-formula');
    const paint = () => {
      formulaEl.innerHTML = `
        <div class="pyr-row"><b>Top</b><span>${b.top}</span></div>
        <div class="pyr-row"><b>Heart</b><span>${b.heart}</span></div>
        <div class="pyr-row"><b>Base</b><span>${b.base}</span></div>
        <div class="pyr-row"><b>Voice</b><span>${b.strength}</span></div>
        <div class="pyr-row"><b>Code</b><span class="blend-code">${b.code}</span></div>`;
    };
    const stage = slot.querySelector('#blend-stage'), vial = stage.querySelector('.blend-vial');
    const mountScene = () => {
      if (scene) scene.destroy();
      scene = window.GibScene.mount(stage, {
        center: '.blend-vial', centerY: .55, count: 12, rx: .36, ry: .1, size: [.08, .13], bleed: .1, kinds: b.art,
        emitters: [{ el: vial, nozzle: [.5, .02], angle: -90, spread: 30 }],
      });
    };
    paint(); mountScene();
    requestAnimationFrame(() => setTimeout(() => (slot.querySelector('#k-liquid').style.height = '78%'), 300));
    const doSpray = () => { scene.spray(0, 1.3); window.GibUI && window.GibUI.toast('Breathe in… this is ' + b.title); };
    vial.addEventListener('click', doSpray);
    vial.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSpray(); } });
    new IntersectionObserver(([en], ob) => { if (en.isIntersecting) { setTimeout(() => scene.spray(0, 1), 1600); ob.disconnect(); } }, { threshold: .6 }).observe(stage);

    slot.querySelectorAll('[data-ft]').forEach((s) => s.addEventListener('change', () => {
      const k = s.dataset.ft;
      b[k] = k === 'voice' ? Number(s.value) : s.value;
      finish(b); paint(); mountScene(); scene.spray(0, .8);
    }));
    slot.querySelector('#k-order').onclick = () => {
      window.GibCart.add(null, { name: b.name, price: C.bespokePrice, formula: b.formula });
      window.GibUI && window.GibUI.openCart();
    };
    slot.querySelector('#k-share-blend').onclick = async () => {
      const url = shareURL(b);
      const text = `${b.name}: a bespoke Giberish attar (${b.top}, ${b.heart}, ${b.base}). Order the exact same blend here:`;
      try { if (navigator.share) { await navigator.share({ title: b.name, text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
    };
    slot.querySelector('#k-copy-blend').onclick = async () => {
      try { await navigator.clipboard.writeText(shareURL(b)); window.GibUI && window.GibUI.toast('Link copied. Anyone with it can order this blend'); }
      catch (_) { prompt('Copy this link', shareURL(b)); }
    };
  }

  // Someone opened a shared blend link
  function sharedView(b) {
    app.innerHTML = `
      <div class="k-result k-anim-in">
        <div class="center" style="margin-bottom:10px">
          <span class="eyebrow">A gift of scent from</span>
          <div class="script" style="font-size:clamp(54px,8vw,90px);line-height:1.1">${esc(b.owner)}</div>
        </div>
        <div id="blend-slot"></div>
        <div class="center" style="margin-top:70px">
          <span class="eyebrow">Curious what yours would be?</span>
          <h2 class="h-1" style="margin:12px 0 22px">Read your own <em>Scent Kundli</em></h2>
          <button class="btn btn-solid" id="k-own">Begin my reading</button>
        </div>
      </div>`;
    mountBlend(document.getElementById('blend-slot'), b, { shared: true });
    document.getElementById('k-own').onclick = () => { history.replaceState(null, '', location.pathname); go(0); };
  }

  /* ---------- Reading animation ---------- */
  function reading() {
    const lines = ['Reading your hours…', 'Tracing your memories…', 'Listening to your silence…', 'Aligning your notes…'];
    app.innerHTML = `<div class="k-reading k-anim-in"><div><div class="orb"></div><p class="h-2" id="k-rl">${lines[0]}</p></div></div>`;
    window.scrollTo({ top: 0 });
    let i = 0;
    const el = document.getElementById('k-rl');
    const iv = setInterval(() => {
      i++;
      if (i >= lines.length) { clearInterval(iv); result(); return; }
      el.style.opacity = 0;
      setTimeout(() => { el.textContent = lines[i]; el.style.opacity = 1; }, 250);
    }, 850);
    el.style.transition = 'opacity .25s';
  }

  /* ---------- Chart ---------- */
  function chartSVG(prof) {
    const cx = 160, cy = 160, R = 110;
    const pt = (i, r) => {
      const a = (i / FKEYS.length) * Math.PI * 2 - Math.PI / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    };
    let s = '';
    [.33, .66, 1].forEach((k) => (s += `<polygon class="ring" points="${FKEYS.map((_, i) => pt(i, R * k).join(',')).join(' ')}"/>`));
    FKEYS.forEach((k, i) => {
      const [x, y] = pt(i, R); const [lx, ly] = pt(i, R + 26);
      s += `<line class="axis" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/><text x="${lx}" y="${ly}">${FAM[k].label}</text>`;
    });
    s += `<polygon class="shape" points="${FKEYS.map((k, i) => pt(i, R * Math.max(.12, prof.v[k])).join(',')).join(' ')}"/>`;
    FKEYS.forEach((k, i) => { const [x, y] = pt(i, R * Math.max(.12, prof.v[k])); s += `<circle cx="${x}" cy="${y}" r="3.5" fill="${FAM[k].color}"/>`; });
    return `<svg viewBox="0 0 320 320">${s}</svg>`;
  }

  /* ---------- Result ---------- */
  let last = null;
  function result() {
    const prof = profile();
    const a = ARCH[prof.ranked[0]];
    const m = matches(prof);
    const b = blend(prof);
    const ruling = NOTE_FOR[prof.ranked[0]][0], rising = NOTE_FOR[prof.ranked[1]][0], moon = NOTE_FOR[prof.ranked[2]][0];
    const noiseLine = prof.noise === 3
      ? 'Your inner noise is loud today. Your chart asks for grounding notes, slow breaths and an attar worn for yourself, not for anyone else.'
      : prof.noise === 2 ? 'There is a hum inside you. A fragrance worn mindfully, one touch at your pulse, can turn that hum into rhythm.'
      : 'You are already close to your silence. Your fragrance simply needs to honour it.';
    last = { prof, a, m, b, ruling, rising, moon };
    const name = esc(answers.name);

    app.innerHTML = `
      <div class="k-result k-anim-in">
        <div class="center" style="margin-bottom:40px">
          <span class="eyebrow">The Scent Kundli of</span>
          <div class="script" style="font-size:clamp(54px,8vw,90px);line-height:1.1">${name}</div>
        </div>
        <div class="k-card-wrap">
          <div class="k-card" id="k-card">
            <span class="eyebrow">Your scent archetype</span>
            <div class="arch">${a.title}</div>
            <div class="k-chart">${chartSVG(prof)}</div>
            <div class="pyramid" style="text-align:left">
              <div class="pyr-row"><b>Ruling</b><span>${ruling}</span></div>
              <div class="pyr-row"><b>Rising</b><span>${rising}</span></div>
              <div class="pyr-row"><b>Moon</b><span>${moon}</span></div>
            </div>
            <div class="brand-word" style="margin-top:14px;font-size:30px">Giberish</div>
          </div>
          <div>
            <p class="k-reading-text">“${a.reading}”</p>
            <p class="muted" style="margin-top:18px">${noiseLine}</p>
            <div class="share-row" style="justify-content:flex-start">
              <button class="btn btn-solid btn-sm" id="k-share">Share my Kundli</button>
              <button class="btn btn-sm" id="k-dl">Save as image</button>
              <button class="btn btn-ghost btn-sm" id="k-retake">Retake</button>
            </div>
          </div>
        </div>

        <div id="blend-slot"></div>
        <div class="center" style="margin-top:90px">
          <span class="eyebrow">Already written in your stars</span>
          <h2 class="h-1" style="margin:12px 0 36px">Your <em>matches</em> from our collection</h2>
        </div>
        <div class="grid">${m.map(({ p, score }) => `<div class="match-item" style="position:relative">${window.gibCard(p)}<span class="chip" style="position:absolute;top:14px;left:14px;background:rgba(10,6,4,.75);border-color:var(--gold);color:var(--gold-2);z-index:3">${score}% match</span></div>`).join('')}</div>
      </div>`;
    window.scrollTo({ top: 0 });
    mountBlend(document.getElementById('blend-slot'), b);

    document.getElementById('k-retake').onclick = () => { Object.keys(answers).forEach((k) => delete answers[k]); go(0); };
    document.getElementById('k-dl').onclick = () => cardImage().then((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `giberish-scent-kundli-${answers.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
    document.getElementById('k-share').onclick = async () => {
      const text = `My Scent Kundli says I’m ${a.plain} ✨ Ruling note: ${ruling}. What’s yours?`;
      const url = location.origin + location.pathname;
      try {
        const blob = await cardImage();
        const file = new File([blob], 'my-scent-kundli.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, url }); return; }
        if (navigator.share) { await navigator.share({ text, url }); return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
    };
  }

  /* ---------- Shareable story image (1080x1920) ---------- */
  function cardImage() {
    const { prof, a, ruling, rising, moon } = last;
    const c = document.createElement('canvas');
    c.width = 1080; c.height = 1920;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(540, 500, 50, 540, 900, 1300);
    g.addColorStop(0, '#2e1c0d'); g.addColorStop(1, '#070403');
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
    x.strokeStyle = 'rgba(212,169,87,.5)'; x.lineWidth = 2; x.strokeRect(40, 40, 1000, 1840);
    x.strokeStyle = 'rgba(212,169,87,.2)'; x.strokeRect(60, 60, 960, 1800);
    for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(242,213,155,${Math.random() * .5})`; x.beginPath(); x.arc(Math.random() * 1080, Math.random() * 1920, Math.random() * 2.2, 0, 7); x.fill(); }
    x.textAlign = 'center';
    x.fillStyle = '#d4a957'; x.font = '400 30px Jost'; x.fillText('T H E   S C E N T   K U N D L I   O F', 540, 230);
    x.fillStyle = '#f2d59b'; x.font = '150px "Great Vibes"'; x.fillText(answers.name, 540, 400);
    x.fillStyle = '#d4a957'; x.font = '400 26px Jost'; x.fillText('Y O U R   S C E N T   A R C H E T Y P E', 540, 520);
    x.fillStyle = '#f4e6c8'; x.font = 'italic 300 84px "Cormorant Garamond"'; x.fillText(a.plain, 540, 620);
    // chart
    const cx = 540, cy = 1000, R = 260;
    const pt = (i, r) => { const an = (i / FKEYS.length) * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(an) * r, cy + Math.sin(an) * r]; };
    x.strokeStyle = 'rgba(212,169,87,.25)'; x.lineWidth = 1.5;
    [.33, .66, 1].forEach((k) => { x.beginPath(); FKEYS.forEach((_, i) => { const [px, py] = pt(i, R * k); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.stroke(); });
    x.font = '400 26px Jost'; x.fillStyle = '#f2d59b';
    FKEYS.forEach((k, i) => { const [lx, ly] = pt(i, R + 55); x.fillText(FAM[k].label.toUpperCase(), lx, ly + 8); });
    x.beginPath(); FKEYS.forEach((k, i) => { const [px, py] = pt(i, R * Math.max(.12, prof.v[k])); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath();
    x.fillStyle = 'rgba(242,213,155,.22)'; x.fill(); x.strokeStyle = '#f2d59b'; x.lineWidth = 3; x.stroke();
    // notes
    const rows = [['RULING NOTE', ruling], ['RISING NOTE', rising], ['MOON NOTE', moon]];
    rows.forEach(([k, v], i) => {
      const y = 1420 + i * 90;
      x.textAlign = 'left'; x.fillStyle = '#d4a957'; x.font = '400 26px Jost'; x.fillText(k, 220, y);
      x.textAlign = 'right'; x.fillStyle = '#f4e6c8'; x.font = '400 46px "Cormorant Garamond"'; x.fillText(v, 860, y);
      x.strokeStyle = 'rgba(212,169,87,.2)'; x.beginPath(); x.moveTo(220, y + 28); x.lineTo(860, y + 28); x.stroke();
    });
    x.textAlign = 'center';
    x.fillStyle = '#f2d59b'; x.font = '96px "Great Vibes"'; x.fillText('Giberish', 540, 1760);
    x.fillStyle = '#a8957a'; x.font = '300 26px Jost'; x.fillText('Find yours at giberish.com', 540, 1815);
    return new Promise((res) => c.toBlob(res, 'image/png'));
  }

  const shared = readShared();
  if (shared) sharedView(shared); else intro();
});
