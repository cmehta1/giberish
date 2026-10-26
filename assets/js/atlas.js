/* ============================================================
   GIBERISH — The Scent Atlas
   Pyramid · fragrance wheel · how ingredients are made · searchable library · glossary · safety.
   Data: assets/js/atlas-data.js (window.GIB_ATLAS). Text here is English; Hindi/Gujarati come from i18n-dict.js.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // C10H20O → C<sub>10</sub>H<sub>20</sub>O (input is escaped first)
  const fml = (f) => esc(f).replace(/(\d+)/g, '<sub>$1</sub>');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DATA = (window.GIB_ATLAS || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  const byId = Object.fromEntries(DATA.map((m) => [m.id, m]));
  const lang = () => (window.GibI18n ? window.GibI18n.lang : 'en');
  const T = (s) => { const d = lang() !== 'en' && window.GIB_I18N && window.GIB_I18N[lang()]; return (d && d[s]) || s; };
  // i18n.js skips SVG, so the wheel and pyramid labels are translated here.
  function relabelSvg() {
    document.querySelectorAll('#at-wheel [data-en], #at-pyr-svg [data-en]').forEach((el) => {
      const t = T(el.dataset.en);
      if (el.tagName.toLowerCase() === 'text') el.textContent = t; else el.setAttribute('aria-label', t);
    });
  }

  /* ---------- Families (wheel order) ---------- */
  const FAM = {
    citrus:    { label: 'Citrus',    color: '#f0b43a', art: 'lemon',      desc: 'Bright, zesty oils pressed from peels: bergamot, lemon, orange, mandarin. They sparkle first and fade fastest.' },
    aromatic:  { label: 'Aromatic',  color: '#9cc48a', art: 'leaf',       desc: 'Herbs and leaves: lavender, sage, rosemary, mint, basil. Clean, cool and a little medicinal.' },
    green:     { label: 'Green',     color: '#6fae5a', art: 'leaf',       desc: 'The smell of snapped stems and fresh leaves: galbanum, violet leaf, blackcurrant bud, cut grass.' },
    aquatic:   { label: 'Aquatic',   color: '#7fbcd2', art: 'musk',       desc: 'Sea air, wet stones and fresh water, largely made possible by modern molecules such as Calone.' },
    floral:    { label: 'Floral',    color: '#e07a8f', art: 'rose',       desc: 'The heart of perfumery: rose, jasmine, tuberose, ylang-ylang, orris and dozens more.' },
    fruity:    { label: 'Fruity',    color: '#ee8a5a', art: 'orange',     desc: 'Juicy and playful: berries, peach, pear and blackcurrant, often built from lactones and esters.' },
    gourmand:  { label: 'Gourmand',  color: '#c98d52', art: 'vanilla',    desc: 'Edible and comforting: vanilla, tonka, cocoa, coffee, honey and caramel.' },
    spicy:     { label: 'Spicy',     color: '#d0582f', art: 'saffron',    desc: 'Warm or fresh spice: cardamom, saffron, cinnamon, clove, pepper and ginger.' },
    resinous:  { label: 'Resinous',  color: '#e0a443', art: 'amber',      desc: 'Tree resins and balsams: frankincense, myrrh, benzoin, labdanum. Warm, glowing and long-lasting; the backbone of “amber”.' },
    woody:     { label: 'Woody',     color: '#a8703f', art: 'sandalwood', desc: 'Dry, creamy or smoky woods: sandalwood, cedar, vetiver, patchouli and oud.' },
    earthy:    { label: 'Earthy',    color: '#8a7448', art: 'oud',        desc: 'Moss, roots, forest floor and wet clay: oakmoss, spikenard and mitti attar.' },
    leathery:  { label: 'Leathery',  color: '#7a4a2a', art: 'cinnamon',   desc: 'Smoky, tarry and suede-like, from birch tar, cade and certain molecules.' },
    animalic:  { label: 'Animalic',  color: '#9c6b5a', art: 'musk',       desc: 'Deep, sensual and bodily. Historically taken from animals; today recreated ethically.' },
    musky:     { label: 'Musky',     color: '#efe6d6', art: 'musk',       desc: 'Soft, skin-like warmth. Today almost all musks are clean synthetic molecules.' },
    aldehydic: { label: 'Aldehydic', color: '#f6ead0', art: 'musk',       desc: 'Sparkling, soapy, waxy brightness, made famous by aldehydes in the 1920s.' },
  };
  const FKEYS = Object.keys(FAM);

  /* ---------- Methods ---------- */
  const METHOD = {
    steam:      { label: 'Steam distillation', icon: 'M20 44h24M24 44V30a8 8 0 0 1 16 0v14M32 22v-8M26 14c0-4 4-4 4-8M38 14c0-4-4-4-4-8', desc: 'Steam passes through the plant, carries its fragrant oil away, and the oil separates from the water as it cools. Used for most essential oils.' },
    hydro:      { label: 'Deg-bhapka (hydro-distillation)', icon: 'M10 42h22M12 42V30a9 9 0 0 1 18 0v12M30 26c8-6 14-6 20 0M50 26v16M44 42h12', desc: 'Flowers simmer in water in a copper still called a deg. The scented vapour travels through a bamboo pipe into a receiver, the bhapka, that holds sandalwood oil. The traditional way attars are made in Kannauj.' },
    expression: { label: 'Cold pressing', icon: 'M16 20h32v8H16zM24 28v8a8 8 0 0 0 16 0v-8M32 44v8', desc: 'Citrus peels are pressed or rasped to release the oil held in tiny pockets in the skin. There is no heat, so it smells like freshly cut fruit.' },
    solvent:    { label: 'Solvent extraction', icon: 'M22 14h20M26 14v12l-8 16a4 4 0 0 0 4 6h20a4 4 0 0 0 4-6l-8-16V14M22 38h20', desc: 'A solvent dissolves the scent of delicate flowers. Removing it leaves a waxy concrete; washing the concrete with alcohol gives the pure absolute.' },
    co2:        { label: 'CO₂ extraction', icon: 'M20 18h24v28H20zM26 26h12M26 32h12M26 38h8M32 10v8', desc: 'Carbon dioxide under pressure acts as a gentle solvent at low temperature, then simply evaporates, leaving an extract very close to the living plant.' },
    enfleurage: { label: 'Enfleurage', icon: 'M12 40h40M16 40V30h32v10M22 28c0-4 4-6 4-6s4 2 4 6M34 28c0-4 4-6 4-6s4 2 4 6', desc: 'An almost-lost art: petals are laid on purified fat that slowly absorbs their scent. Historically used for jasmine and tuberose.' },
    tincture:   { label: 'Tincture', icon: 'M26 10h12M28 10v8l-6 6v22a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V24l-6-6v-8M22 34h20', desc: 'Material is steeped in alcohol for weeks or months, as perfumers have long done with ambergris and vanilla.' },
    maceration: { label: 'Maceration', icon: 'M18 24h28v20a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6zM24 18c0-4 8-4 8-8M36 18c0-3 4-4 4-6', desc: 'Material soaks in warm oil or alcohol to draw out its scent: an ancient method still used for some oils and attars.' },
    resinoid:   { label: 'Resin extraction', icon: 'M32 10c-6 10-10 16-10 22a10 10 0 0 0 20 0c0-6-4-12-10-22zM28 34a4 4 0 0 0 4 4', desc: 'Tree resins and balsams are dissolved and filtered to make resinoids: thick, glowing materials that anchor the base.' },
    isolation:  { label: 'Isolation', icon: 'M14 24h36M14 34h36M24 24v10M40 24v10M32 14v6M32 38v12', desc: 'A single molecule is separated from a natural oil, for example citral from lemongrass or linalool from other plant oils.' },
    synthesis:  { label: 'Synthesis', icon: 'M32 12l14 8v16l-14 8-14-8V20zM32 28l14-8M32 28v16M32 28l-14-8', desc: 'Chemists build a molecule step by step, either copying one found in nature or creating something entirely new.' },
  };

  /* ---------- Glossary & safety ---------- */
  const GLOSS = [
    ['Accord', 'A blend of materials that together create a new impression, such as an “amber” or a “leather” accord. The perfumer’s chord.'],
    ['Absolute', 'A highly concentrated extract of delicate flowers, made by solvent extraction. It is the closest thing to the living flower.'],
    ['Concrete', 'The waxy, fragrant mass left after solvent extraction, before it is refined into an absolute.'],
    ['Essential oil', 'A volatile aromatic oil obtained from a plant by distillation or by pressing.'],
    ['Attar (itr)', 'A traditional perfume oil, usually distilled into sandalwood oil. It is alcohol-free and worn close to the skin.'],
    ['Ruh', 'The pure distilled essence of a single flower with no base oil, as in ruh gulab.'],
    ['Isolate', 'A single aroma molecule separated from a natural material.'],
    ['Captive', 'A molecule protected by patent and used only by the company that created it, usually for a number of years.'],
    ['Fixative', 'A material that slows evaporation and helps a fragrance last longer, often a resin, a musk or a wood.'],
    ['Sillage', 'The trail a fragrance leaves behind as you move, from the French word for a ship’s wake.'],
    ['Projection', 'How far a fragrance radiates from your skin while you stand still.'],
    ['Longevity', 'How long a fragrance stays noticeable on the skin.'],
    ['Drydown', 'The final stage of a fragrance, when mainly the base notes remain.'],
    ['Facet', 'One aspect of a material’s smell. Rose, for example, has honeyed, lemony and spicy facets.'],
    ['Chypre', 'A classic structure of a citrus top, a floral heart and a mossy base, named after Coty’s Chypre of 1917.'],
    ['Fougère', 'French for “fern”: a fresh structure built on lavender, oakmoss and coumarin, born with Fougère Royale in 1882.'],
    ['Amber (oriental)', 'A warm family built on resins, vanilla, spices and woods. Many houses now prefer the word “amber”.'],
    ['Extrait / Parfum', 'The most concentrated form, typically around 20–30% fragrance oil. Exact levels vary by house.'],
    ['Eau de Parfum', 'Typically around 15–20% fragrance oil.'],
    ['Eau de Toilette', 'Typically around 5–15% fragrance oil.'],
    ['Eau de Cologne', 'A light, refreshing form, typically around 2–5% fragrance oil.'],
    ['Nose blindness', 'Olfactory adaptation: after a while you stop noticing a smell around you, including your own perfume.'],
    ['IFRA', 'The International Fragrance Association, whose Standards set safe-use limits for fragrance materials.'],
    ['Allergen labelling', 'In the EU, certain fragrance allergens must be named on the label when they are present above set levels.'],
  ];
  const SAFE = [
    ['Patch test', 'Try a new fragrance on a small patch of skin, such as the inside of the elbow. If your skin is sensitive, wait a day before wearing it widely.'],
    ['Citrus and sunlight', 'Some cold-pressed citrus oils, especially bergamot, contain furocoumarins that can mark skin exposed to the sun. Perfumers use bergapten-free (FCF) bergamot to avoid this.'],
    ['Natural is not allergy-free', 'Common allergens such as linalool, limonene, geraniol and eugenol occur in natural oils just as they do in synthetics.'],
    ['Standards matter', 'Responsible houses follow IFRA Standards, which limit or ban materials based on safety research.'],
    ['Eyes and broken skin', 'Keep fragrance away from the eyes, broken skin and the reach of small children.'],
    ['Store it well', 'Heat and light slowly change fragrance ingredients. A cool, dark drawer keeps a bottle true for years.'],
  ];

  /* ---------- Helpers ---------- */
  const artFor = (m) => {
    const map = { citrus: 'lemon', rose: 'rose', jasmine: 'jasmine', oud: 'oud', sandalwood: 'sandalwood', cedar: 'sandalwood', saffron: 'saffron', amber: 'amber', musk: 'musk', vanilla: 'vanilla', cardamom: 'cardamom', leather: 'cinnamon', smoke: 'smoke' };
    return (m.gib && map[m.gib]) || (FAM[m.family] || {}).art || 'musk';
  };
  const localName = (m) => (lang() === 'hi' && m.hi) || (lang() === 'gu' && m.gu) || m.indian || '';
  const giberishProducts = (m) => (m.gib ? (window.GIB_PRODUCTS || []).filter((p) => p.ingredients.includes(m.gib)) : []);
  const strongest = (m) => ['top', 'heart', 'base'].reduce((a, k) => ((m.notes || {})[k] > ((m.notes || {})[a] || 0) ? k : a), 'top');
  function media(m, cls = '') {
    if (m.img) return `<img class="${cls}" src="${esc(m.img)}" alt="${esc(m.name)}" loading="lazy" decoding="async">`;
    if (m.type === 'synthetic') return `<span class="at-mol ${cls}" aria-hidden="true"><b data-no-i18n>${fml(m.formula || '')}</b></span>`;
    return `<img class="${cls} at-art" src="${window.GibArt.url(artFor(m))}" alt="" loading="lazy">`;
  }
  const noteBars = (m) => ['top', 'heart', 'base'].map((k) => `<span class="nb" title="${k}"><i style="--v:${((m.notes || {})[k] || 0) / 3}"></i><small>${{ top: 'Top', heart: 'Heart', base: 'Base' }[k]}</small></span>`).join('');

  /* ---------- Stats ---------- */
  const nat = DATA.filter((m) => m.type === 'natural').length;
  $('#at-stats').innerHTML = `<span><b>${DATA.length}</b> ingredients</span><span><b>${nat}</b> natural</span><span><b>${DATA.length - nat}</b> synthetic</span><span><b>${FKEYS.length}</b> families</span>`;

  /* ---------- Hero: drifting ingredients ---------- */
  (function hero() {
    const cv = $('.at-hero-art'), cx = cv.getContext('2d');
    let W = 0, H = 0, sprites = [], last = 0, vis = true;
    const kinds = ['rose', 'lemon', 'oud', 'saffron', 'jasmine', 'vanilla', 'cardamom', 'amber', 'leaf', 'sandalwood', 'anise', 'cinnamon', 'orange', 'musk', 'honey'];
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
      // keep them in the side margins so they never sit on the headline
      const sideX = () => { const edge = W < 600 ? .14 : .22; const t = Math.random() * edge * W; return Math.random() < .5 ? t : W - t; };
      sprites = Array.from({ length: W < 600 ? 8 : 18 }, (_, i) => ({ kind: kinds[i % kinds.length], sideX, x: sideX(), y: Math.random() * H, vy: -(5 + Math.random() * 9), depth: Math.random(), size: (W < 600 ? 22 : 36) * (.6 + Math.random() * .8) }));
    };
    size(); new ResizeObserver(size).observe(cv);
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(cv);
    (function loop(t) {
      requestAnimationFrame(loop);
      if (!vis || reduce) return;
      const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
      cx.clearRect(0, 0, W, H);
      for (const s of sprites) {
        s.y += s.vy * dt; if (s.y < -50) { s.y = H + 50; s.x = s.sideX(); }
        const blur = s.depth < .4 ? 2.5 : 0;
        window.GibArt.draw(cx, s, s.x, s.y, s.size * (.6 + s.depth * .6), .22 + s.depth * .4, dt, null, blur);
      }
    })(0);
  })();

  /* ---------- Pyramid: time flows, layers light up ---------- */
  const LAYERS = {
    top: { name: 'Top notes', when: 'The first 5–15 minutes', text: 'Small, light molecules that evaporate fastest: citrus, herbs, light spices and aldehydes. They are the first impression.' },
    heart: { name: 'Heart notes', when: 'From about 15 minutes to 3 hours', text: 'The character of the fragrance: flowers, spices and softer greens, arriving as the top fades.' },
    base: { name: 'Base notes', when: 'From about 3 hours, often all day', text: 'Heavy molecules that linger: woods, resins, musks, vanilla and moss. They anchor everything above them.' },
  };
  const layerText = $('#at-layer-text'), clock = $('#at-clock'), clockBar = $('#at-clock-bar');
  const examples = (layer) => DATA.filter((m) => (m.notes || {})[layer] >= 3).slice(0, 40).sort(() => Math.random() - .5).slice(0, 6);
  let curLayer = '';
  function setLayer(layer) {
    if (layer === curLayer) return;
    curLayer = layer;
    document.querySelectorAll('.pyr-band').forEach((b) => b.classList.toggle('on', b.dataset.layer === layer));
    const L = LAYERS[layer];
    layerText.innerHTML = `<h3 class="h-2">${L.name}</h3><span class="eyebrow">${L.when}</span><p>${L.text}</p>
      <div class="at-chips">${examples(layer).map((m) => `<button type="button" class="chip" data-open="${m.id}">${esc(m.name)}</button>`).join('')}</div>`;
  }
  const fmt = (min) => (min < 60 ? `${Math.round(min)} min` : `${Math.floor(min / 60)} h${min % 60 >= 5 ? ' ' + Math.round(min % 60) + ' min' : ''}`);
  let pyrT = 0, pyrLast = 0, pyrVis = false, pyrHold = 0;
  new IntersectionObserver(([e]) => { pyrVis = e.isIntersecting; }).observe($('.at-pyr'));
  (function pyrLoop(t) {
    requestAnimationFrame(pyrLoop);
    const dt = Math.min(.05, (t - (pyrLast || t)) / 1000); pyrLast = t;
    if (!pyrVis) return;
    if (pyrHold > 0) { pyrHold -= dt; return; }
    pyrT = (pyrT + dt / 14) % 1;                 // 14 s for 8 hours, on a gentle curve
    const min = Math.pow(pyrT, 2.2) * 480;
    clock.textContent = fmt(min); clockBar.style.transform = `scaleX(${pyrT})`;
    setLayer(min < 15 ? 'top' : min < 180 ? 'heart' : 'base');
    motes(dt);
  })(0);
  if (reduce) setLayer('heart');
  document.querySelectorAll('.pyr-band').forEach((b) => b.addEventListener('click', () => {
    pyrHold = 8; setLayer(b.dataset.layer);
    filters.layer = b.dataset.layer; syncFilterUI(); render(); scrollToLib();
  }));
  // motes rising off the pyramid (more from the top while top notes evaporate)
  const pm = $('.at-pyr-motes'), pc = pm.getContext('2d');
  let PW = 0, PH = 0, dots = [];
  const psize = () => { const r = pm.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); PW = r.width; PH = r.height; pm.width = PW * d; pm.height = PH * d; pc.setTransform(d, 0, 0, d, 0, 0); };
  psize(); new ResizeObserver(psize).observe(pm);
  function motes(dt) {
    if (reduce) return;
    const rate = curLayer === 'top' ? 26 : curLayer === 'heart' ? 12 : 5;
    const band = { top: [.33, .5], heart: [.35, .62], base: [.66, .93] }[curLayer] || [.4, .6];
    if (Math.random() < rate * dt) dots.push({ x: PW * (.5 + (Math.random() - .5) * (curLayer === 'top' ? .3 : curLayer === 'heart' ? .55 : .8)), y: PH * (band[0] + Math.random() * (band[1] - band[0])), v: 14 + Math.random() * 24, life: 0, max: 2 + Math.random() * 2, r: .6 + Math.random() * 1.6 });
    pc.clearRect(0, 0, PW, PH);
    dots = dots.filter((d) => (d.life += dt) < d.max);
    for (const d of dots) {
      d.y -= d.v * dt; d.x += Math.sin(d.life * 3 + d.r) * .3;
      pc.fillStyle = `rgba(255,224,160,${Math.sin((d.life / d.max) * Math.PI) * .8})`;
      pc.beginPath(); pc.arc(d.x, d.y, d.r, 0, Math.PI * 2); pc.fill();
    }
  }

  /* ---------- Fragrance wheel ---------- */
  const wheel = $('#at-wheel'), famCard = $('#at-family-card');
  (function drawWheel() {
    const n = FKEYS.length, R1 = 200, R0 = 118, gap = .012;
    const pt = (r, a) => [Math.cos(a) * r, Math.sin(a) * r].map((v) => v.toFixed(2)).join(' ');
    let s = '<g class="wh-rot">';
    FKEYS.forEach((k, i) => {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2 + gap, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2 - gap, mid = (a0 + a1) / 2;
      const d = `M${pt(R0, a0)} L${pt(R1, a0)} A${R1} ${R1} 0 0 1 ${pt(R1, a1)} L${pt(R0, a1)} A${R0} ${R0} 0 0 0 ${pt(R0, a0)} Z`;
      const [tx, ty] = [Math.cos(mid) * 159, Math.sin(mid) * 159];
      let deg = (mid * 180) / Math.PI + 90; if (deg > 90 && deg < 270) deg += 180;
      s += `<g class="seg" data-fam="${k}" tabindex="0" role="button" aria-label="${FAM[k].label}" data-en="${FAM[k].label}"><path d="${d}" style="--c:${FAM[k].color}"/><text data-en="${FAM[k].label}" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" transform="rotate(${deg.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})">${FAM[k].label}</text></g>`;
    });
    wheel.innerHTML = s + '</g>';
  })();
  function showFamily(k) {
    wheel.querySelectorAll('.seg').forEach((g) => g.classList.toggle('on', g.dataset.fam === k));
    const list = DATA.filter((m) => m.family === k);
    $('#at-wheel-center').innerHTML = `<img src="${window.GibArt.url(FAM[k].art)}" alt=""><b>${FAM[k].label}</b><small>${list.length} ingredients</small>`;
    famCard.style.setProperty('--c', FAM[k].color);
    famCard.innerHTML = `<h3 class="h-2">${FAM[k].label}</h3><p>${FAM[k].desc}</p>
      <div class="at-chips">${list.slice(0, 8).map((m) => `<button type="button" class="chip" data-open="${m.id}">${esc(m.name)}</button>`).join('')}</div>
      <button type="button" class="link-arrow at-see" data-fam-filter="${k}">See all ${list.length} in the library →</button>`;
  }
  wheel.addEventListener('click', (e) => { const g = e.target.closest('.seg'); if (g) showFamily(g.dataset.fam); });
  wheel.addEventListener('keydown', (e) => { const g = e.target.closest('.seg'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showFamily(g.dataset.fam); } });
  showFamily('floral');

  /* ---------- Methods ---------- */
  $('#at-methods').innerHTML = Object.entries(METHOD).map(([k, m], i) => {
    const count = DATA.filter((x) => (x.method || []).includes(k)).length;
    return `<button type="button" class="at-method reveal" data-delay="${(i % 3) + 1}" data-method="${k}">
      <svg viewBox="0 0 64 64" class="draw" aria-hidden="true"><path d="${m.icon}"/></svg>
      <b>${m.label}</b><span>${m.desc}</span><small>${count ? `${count} ingredients →` : ''}</small></button>`;
  }).join('');

  /* ---------- Library ---------- */
  const filters = { q: '', type: 'all', layer: 'all', fam: 'all', gib: false, method: '' };
  const grid = $('#at-grid'), countEl = $('#at-count');
  $('#at-fams').innerHTML = `<button type="button" class="at-fam active" data-fam="all" style="--c:#d4a957">All families</button>` +
    FKEYS.map((k) => `<button type="button" class="at-fam" data-fam="${k}" style="--c:${FAM[k].color}">${FAM[k].label}</button>`).join('');
  function syncFilterUI() {
    document.querySelectorAll('#at-type button').forEach((b) => b.classList.toggle('active', b.dataset.type === filters.type));
    document.querySelectorAll('#at-layer button').forEach((b) => b.classList.toggle('active', b.dataset.layer === filters.layer));
    document.querySelectorAll('.at-fam').forEach((b) => b.classList.toggle('active', b.dataset.fam === filters.fam));
    $('#at-gib').checked = filters.gib;
    $('#at-q').value = filters.q;
    let mchip = $('#at-method-chip');
    if (filters.method) {
      if (!mchip) { mchip = document.createElement('button'); mchip.type = 'button'; mchip.id = 'at-method-chip'; mchip.className = 'chip at-mchip'; $('.at-filter-row').insertBefore(mchip, countEl); mchip.onclick = () => { filters.method = ''; syncFilterUI(); render(); }; }
      mchip.textContent = METHOD[filters.method].label + ' ×';
    } else if (mchip) mchip.remove();
  }
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function matches(m) {
    if (filters.type !== 'all' && m.type !== filters.type) return false;
    if (filters.layer !== 'all' && !((m.notes || {})[filters.layer] >= 2)) return false;
    if (filters.fam !== 'all' && m.family !== filters.fam) return false;
    if (filters.gib && !giberishProducts(m).length) return false;
    if (filters.method && !(m.method || []).includes(filters.method)) return false;
    if (filters.q) {
      const hay = norm([m.name, m.latin, m.indian, m.hi, m.gu, m.facet, m.family, FAM[m.family] && FAM[m.family].label, m.smells, m.formula].join(' '));
      return norm(filters.q).split(/\s+/).every((w) => hay.includes(w));
    }
    return true;
  }
  // Show the library in pages so phones are not handed 160+ cards at once.
  const PAGE = () => (matchMedia('(max-width: 560px)').matches ? 16 : 32);
  let shown = PAGE();
  const moreBtn = $('#at-more');
  moreBtn.addEventListener('click', () => { shown += PAGE(); render(true); });
  function render(keep) {
    if (!keep) shown = PAGE();
    const all = DATA.filter(matches), list = all.slice(0, shown);
    countEl.textContent = `${all.length} of ${DATA.length}`;
    $('#at-empty').hidden = all.length > 0;
    moreBtn.hidden = all.length <= shown;
    moreBtn.innerHTML = `Show more <span>${all.length - list.length}</span>`;
    grid.innerHTML = list.map((m) => {
      const f = FAM[m.family] || { label: m.family, color: '#d4a957' };
      const ln = localName(m);
      return `<button type="button" class="at-card" data-open="${m.id}" style="--c:${f.color}">
        <span class="at-card-media ${m.type}">${media(m)}</span>
        <span class="at-card-body">
          <span class="at-card-top"><span class="at-fam-dot">${f.label}</span><span class="at-type ${m.type}">${m.type === 'natural' ? 'Natural' : 'Synthetic'}</span></span>
          <b class="at-card-name" data-no-i18n>${esc(m.name)}</b>
          <span class="at-card-sub" data-no-i18n>${ln || m.latin ? esc(ln || m.latin) : fml(m.formula || '')}</span>
          <span class="at-notes">${noteBars(m)}</span>
        </span>
      </button>`;
    }).join('');
  }
  $('#at-q').addEventListener('input', (e) => { filters.q = e.target.value.trim(); render(); });
  $('#at-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') scrollToLib(); });
  $('#at-type').addEventListener('click', (e) => { const b = e.target.closest('[data-type]'); if (b) { filters.type = b.dataset.type; syncFilterUI(); render(); } });
  $('#at-layer').addEventListener('click', (e) => { const b = e.target.closest('[data-layer]'); if (b) { filters.layer = b.dataset.layer; syncFilterUI(); render(); } });
  $('#at-fams').addEventListener('click', (e) => { const b = e.target.closest('[data-fam]'); if (b) { filters.fam = b.dataset.fam; syncFilterUI(); render(); } });
  $('#at-gib').addEventListener('change', (e) => { filters.gib = e.target.checked; render(); });
  function scrollToLib() { const el = $('#library'); window.gibLenis ? window.gibLenis.scrollTo(el, { offset: -20 }) : el.scrollIntoView({ behavior: 'smooth' }); }
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-fam-filter]');
    if (f) { filters.fam = f.dataset.famFilter; syncFilterUI(); render(); scrollToLib(); return; }
    const mt = e.target.closest('[data-method]');
    if (mt && mt.closest('#at-methods')) { filters.method = mt.dataset.method; syncFilterUI(); render(); scrollToLib(); return; }
    const o = e.target.closest('[data-open]');
    if (o) openDetail(o.dataset.open);
  });

  /* ---------- Detail drawer ---------- */
  const drawer = $('#at-drawer'), scrim = $('#at-scrim'), body = $('#at-d-body');
  function openDetail(id) {
    const m = byId[id];
    if (!m) return;
    const f = FAM[m.family] || { label: m.family, color: '#d4a957' };
    const prods = giberishProducts(m);
    const names = [m.latin && `<i>${esc(m.latin)}</i>`, m.indian && esc(m.indian), m.hi && `<span lang="hi">${esc(m.hi)}</span>`, m.gu && `<span lang="gu">${esc(m.gu)}</span>`].filter(Boolean).join(' · ');
    drawer.style.setProperty('--c', f.color);
    body.innerHTML = `
      <div class="at-d-media ${m.type}">${media(m, 'big')}</div>
      <div class="at-d-in">
        <div class="at-card-top"><span class="at-fam-dot">${f.label}${m.facet ? ' · ' + esc(m.facet) : ''}</span><span class="at-type ${m.type}">${m.type === 'natural' ? 'Natural' : 'Synthetic'}</span></div>
        <h2 class="h-1" id="at-d-name" data-no-i18n>${esc(m.name)}</h2>
        ${names ? `<p class="at-d-names" data-no-i18n>${names}</p>` : ''}
        <p class="at-d-smells">${esc(m.smells)}</p>
        <div class="at-d-pyr">${['top', 'heart', 'base'].map((k) => `<div class="pr"><b>${{ top: 'Top', heart: 'Heart', base: 'Base' }[k]}</b><i><span style="--v:${((m.notes || {})[k] || 0) / 3}"></span></i></div>`).join('')}</div>
        <dl class="at-d-facts">
          ${m.origin ? `<dt>Origin</dt><dd>${esc(m.origin)}</dd>` : ''}
          ${m.from ? `<dt>Made from</dt><dd>${esc(m.from)}</dd>` : ''}
          ${(m.method || []).length ? `<dt>How it is made</dt><dd>${m.method.map((k) => METHOD[k] ? `<span class="chip">${METHOD[k].label}</span>` : '').join(' ')}</dd>` : ''}
          ${m.formula ? `<dt>Molecule</dt><dd><span data-no-i18n>${fml(m.formula)}</span>${m.cid ? ` · <a href="https://pubchem.ncbi.nlm.nih.gov/compound/${m.cid}" target="_blank" rel="noopener">PubChem ${m.cid}</a>` : ''}</dd>` : ''}
        </dl>
        ${m.fact ? `<div class="at-d-fact"><span class="eyebrow">Did you know</span><p>${esc(m.fact)}</p></div>` : ''}
        ${(m.pairs || []).length ? `<span class="eyebrow">Pairs beautifully with</span><div class="at-chips">${m.pairs.filter((p) => byId[p]).map((p) => `<button type="button" class="chip" data-open="${p}">${esc(byId[p].name)}</button>`).join('')}</div>` : ''}
        ${prods.length ? `<span class="eyebrow" style="margin-top:22px;display:block">Found in Giberish</span><div class="at-d-prods">${prods.map((p) => `<button type="button" class="at-d-prod" data-feel="${p.id}"><img src="${p.image}" alt=""><span>${esc(p.name)}</span></button>`).join('')}</div>` : ''}
        ${m.safety ? `<div class="at-d-safe"><b>Safety note</b><p>${esc(m.safety)}</p></div>` : ''}
        ${(m.src || []).length ? `<p class="at-d-src">Sources: ${m.src.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener nofollow">${(() => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (_) { return 'source ' + (i + 1); } })()}</a>`).join(' · ')}</p>` : ''}
        ${m.credit ? `<p class="at-d-src">Image: ${esc(m.credit)}</p>` : ''}
      </div>`;
    drawer.classList.add('open'); scrim.classList.add('show'); document.body.classList.add('no-scroll');
    drawer.scrollTop = 0;
    try { history.replaceState(null, '', '#m=' + id); } catch (_) {}
  }
  function closeDetail() {
    drawer.classList.remove('open'); scrim.classList.remove('show');
    if (!document.querySelector('.xp.open')) document.body.classList.remove('no-scroll');
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
  }
  $('#at-d-close').onclick = closeDetail; scrim.onclick = closeDetail;
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDetail(); });

  /* ---------- Glossary & safety ---------- */
  $('#at-gloss').innerHTML = GLOSS.map(([t, d]) => `<details class="at-term"><summary>${t}</summary><p>${d}</p></details>`).join('');
  $('#at-safe').innerHTML = SAFE.map(([t, d], i) => `<article class="at-safe-card reveal" data-delay="${(i % 3) + 1}"><b>${t}</b><p>${d}</p></article>`).join('');

  /* ---------- Start ---------- */
  render();
  window.gibObserveReveals && window.gibObserveReveals(document);
  relabelSvg();
  document.addEventListener('lang:change', () => { relabelSvg(); render(true); if (drawer.classList.contains('open')) { const m = location.hash.match(/m=([\w-]+)/); if (m) openDetail(m[1]); } });
  const hm = location.hash.match(/m=([\w-]+)/);
  if (hm) setTimeout(() => openDetail(hm[1]), 300);
  addEventListener('hashchange', () => { const h = location.hash.match(/m=([\w-]+)/); if (h) openDetail(h[1]); else if (drawer.classList.contains('open')) closeDetail(); });
  const q = new URLSearchParams(location.search).get('q');
  if (q) { filters.q = q; syncFilterUI(); render(); }
});
