/* ============================================================
   GIBERISH — Scent Worlds   (worlds.html?p=<product-id>)
   Every fragrance has its own photographic world (assets/img/worlds/<id>.webp, .jpg original):
     blurred far plane → sharp photo plane (slow Ken-Burns drift) →
     soft particles → the bottle on a dark reflective floor → near particles
   Each plane sits at a depth. Mouse / drag pans the camera, scrolling
   dollies through the world while the story panels pass over it.
   Photo credits: assets/img/worlds/CREDITS.md
   ============================================================ */
(function () {
  'use strict';
  const PRODUCTS = window.GIB_PRODUCTS || [];
  const stage = document.getElementById('sw-stage');
  if (!PRODUCTS.length || !stage) return;

  const TAU = Math.PI * 2;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const smooth = (t) => t * t * (3 - 2 * t);
  const r1 = (n) => Math.round(n * 10) / 10;
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  /* Plane depths: 0 = infinitely far, 1 = at the camera */
  const D = { back: .07, photo: .2, cmid: .42, hero: .6, front: .8 };

  /* ============================================================
     The worlds — one photograph and one mood per fragrance.
     pos: where to crop the photo · grade: colour grade (CSS filter, applied once)
     floor: colour of the dark floor the bottle stands on · sound: GibSound theme
     entrance: rise | bloom | mist | smoke | glow
     ============================================================ */
  const WORLDS = {
    'giberish-signature': {
      title: 'The Hall of Lamps', mood: 'A thousand small flames, and the stillness between them.',
      sound: 'temple', pos: '50% 72%', grade: 'brightness(.8) contrast(1.06) saturate(.92)', floor: '8,5,3', accent: '255,200,120', entrance: 'glow', reflect: true, sink: .012,
      parts: (e) => ({
        mid: [['haze', { count: 4, rgb: '255,170,80', y: e.base - e.H * .12, a: [.04, .07] }], ['dust', { count: 30, rgb: '255,210,140', size: [.5, 1.2], vx: 2, vy: -4, swirl: 7, alpha: .55 }]],
        front: [['sparks', { rate: 3, rgb: '255,180,90', spread: .9 }], ['dust', { count: 12, rgb: '255,220,160', size: [.9, 2], vx: 3, vy: -6, swirl: 9, alpha: .7 }],
          ['burst', { rgb: '255,206,130', count: 40, delay: .4, dur: 1.2, spread: 1, vx: 30, vy: [20, 60], g: -4, r: [.8, 1.8], life: [1.5, 3], alpha: .7 }]],
      }),
    },
    'barakkat-rouge-540': {
      title: 'The Saffron Bazaar', mood: 'Saffron threads and spice dust in the last warm light.',
      sound: 'bazaar', pos: '50% 45%', grade: 'brightness(.58) contrast(1.1) saturate(.85)', floor: '14,6,3', accent: '255,150,90', entrance: 'glow', reflect: true, sink: .012,
      parts: (e) => ({
        mid: [['haze', { count: 5, rgb: '255,130,60', y: e.hy, a: [.05, .08] }], ['dust', { count: 46, rgb: '255,160,80', size: [.5, 1.4], vx: 5, vy: -9, swirl: 14, alpha: .65 }]],
        front: [['dust', { count: 22, rgb: '255,186,110', size: [1, 2.3], vx: 8, vy: -12, swirl: 18 }], ['threads', { count: 12 }],
          ['burst', { rgb: '235,120,50', count: 50, delay: .5, dur: 1.2, spread: .9, vx: 50, vy: [20, 70], g: -6, r: [1, 2.4], life: [1.6, 3], alpha: .7 }]],
      }),
    },
    kaaf: {
      title: 'The Moonlit Dunes', mood: 'Starlight over the desert, and a wind that smells of oud.',
      sound: 'night', pos: '58% 88%', grade: 'brightness(.82) contrast(1.05) saturate(.95)', floor: '22,12,6', accent: '255,214,150', entrance: 'rise', sink: .05,
      parts: (e) => ({
        mid: [['dust', { count: 36, rgb: '255,214,150', size: [.5, 1.3], vx: 12, vy: -3, swirl: 10, alpha: .55 }]],
        front: [['sand', { count: 40 }], ['dust', { count: 20, rgb: '255,220,160', size: [.9, 2.2], vx: 20, vy: -5, swirl: 14, alpha: .8 }],
          ['burst', { rgb: '235,196,140', count: 110, delay: .35, dur: 2.3, spread: .7, vx: 70, vy: [40, 170], g: 170, r: [.7, 1.9], life: [1, 2.2], alpha: .75 }]],
      }),
    },
    fahad: {
      title: "The Leopard's Night", mood: 'Tall grass, a lone tree, and something watching quietly.',
      sound: 'night', pos: '62% 55%', grade: 'brightness(.72) contrast(1.08) saturate(.78)', floor: '3,6,9', accent: '200,220,255', entrance: 'mist', sink: .03,
      parts: (e) => ({
        mid: [['fireflies', { count: 9, y0: e.hy - e.H * .2, y1: e.gy, size: [1.6, 2.6] }], ['dust', { count: 18, rgb: '200,215,255', size: [.4, 1], vx: 4, vy: -2, swirl: 6, alpha: .4 }]],
        front: [['fireflies', { count: 6, y0: e.hy - e.H * .1, y1: e.H * .95, size: [2.6, 4] }],
          ['burst', { rgb: '170,185,210', sprite: 'soft', soft: true, comp: 'source-over', count: 16, delay: 0, dur: .5, spread: 1.1, vx: 24, vy: [6, 20], r: [40, 100], grow: 16, life: [2.4, 3.6], alpha: .14, yOff: -.7 }]],
      }),
    },
    'white-oud': {
      title: 'The White Forest', mood: 'Soft fog through the pines, and silk on the first light.',
      sound: 'silk', pos: '50% 62%', grade: 'brightness(.84) saturate(.7) sepia(.12) contrast(1.04)', floor: '10,11,10', accent: '255,240,220', entrance: 'mist', sink: .03,
      parts: (e) => ({
        mid: [['mist', { count: 6, rgb: '236,238,236', r: [.3, .55], y0: e.hy - e.H * .25, y1: e.gy, a: [.05, .09], vx: [-10, -3], boost: 2.5 }], ['sparkles', { count: 7, y0: e.H * .1, y1: e.gy, size: [2, 3.4] }]],
        front: [['mist', { count: 3, rgb: '240,240,236', r: [.25, .4], y0: e.base - e.H * .1, y1: e.H, a: [.04, .07], vx: [4, 10] }], ['sparkles', { count: 10, y0: e.hy - e.H * .3, y1: e.gy, size: [2.4, 4.6] }],
          ['dust', { count: 14, rgb: '255,250,240', size: [.6, 1.4], vx: 5, vy: -4, swirl: 9, alpha: .55 }],
          ['burst', { rgb: '245,245,240', sprite: 'soft', soft: true, comp: 'source-over', count: 16, delay: 0, dur: .4, spread: 1.1, vx: 26, vy: [6, 22], r: [40, 100], grow: 16, life: [2.4, 3.6], alpha: .2, yOff: -.6 }]],
      }),
    },
    'viking-creed': {
      title: 'The Northern Shore', mood: 'Cold spray, grey cliffs and the fjord far below.',
      sound: 'sea', pos: '50% 52%', grade: 'brightness(.78) contrast(1.08) saturate(.8)', floor: '6,9,10', accent: '210,230,235', entrance: 'mist', sink: .03,
      parts: (e) => ({
        mid: [['mist', { count: 5, rgb: '200,214,218', r: [.3, .55], y0: e.hy - e.H * .15, y1: e.gy, a: [.05, .08], vx: [8, 18], boost: 2 }],
          ['rain', { count: 60, len: [10, 22], speed: [520, 700], alpha: .12, width: .8, color: '#d6e4e8', wind: -.35 }]],
        front: [['dust', { count: 40, rgb: '232,242,245', size: [.4, 1.2], vx: 70, vy: -6, swirl: 24, alpha: .5 }],
          ['rain', { count: 34, len: [26, 50], speed: [900, 1150], alpha: .2, width: 1, color: '#e6f0f2', wind: -.4 }],
          ['burst', { rgb: '220,232,236', sprite: 'soft', soft: true, comp: 'source-over', count: 16, delay: 0, dur: .4, spread: 1.2, vx: 30, vy: [4, 20], r: [40, 110], grow: 18, life: [2.5, 4], alpha: .16, yOff: -.8 }]],
      }),
    },
    'liquid-burn': {
      title: 'The Ember Hearth', mood: 'Smouldering wood, rising sparks, and a warmth that stays.',
      sound: 'fire', pos: '58% 55%', grade: 'brightness(.8) contrast(1.08) saturate(.95)', floor: '12,6,3', accent: '255,150,70', entrance: 'glow', reflect: true, sink: .012,
      parts: (e) => ({
        mid: [['haze', { count: 5, rgb: '255,110,40', y: e.base - e.H * .1, a: [.05, .08] }], ['dust', { count: 34, rgb: '255,150,70', size: [.5, 1.3], vx: 3, vy: -10, swirl: 10, alpha: .6 }]],
        front: [['sparks', { rate: 4.5, rgb: '255,140,50', spread: 1 }], ['dust', { count: 16, rgb: '255,180,100', size: [1, 2.2], vx: 4, vy: -14, swirl: 14, alpha: .75 }],
          ['burst', { rgb: '255,140,60', count: 60, delay: .4, dur: 1.2, spread: 1, vx: 40, vy: [30, 90], g: -10, r: [.8, 1.9], life: [1.4, 2.8], alpha: .75 }]],
      }),
    },
    'green-irish': {
      title: 'The Emerald Hills', mood: 'Mist rolling over green hills, and rain still on the grass.',
      sound: 'forest', pos: '50% 62%', grade: 'brightness(.74) contrast(1.06) saturate(.85)', floor: '5,9,6', accent: '200,235,200', entrance: 'mist', sink: .03,
      parts: (e) => ({
        mid: [['mist', { count: 6, rgb: '214,226,218', r: [.3, .55], y0: e.hy - e.H * .2, y1: e.gy, a: [.05, .09], vx: [4, 12], boost: 2 }],
          ['dust', { count: 22, rgb: '220,240,215', size: [.4, 1.1], vx: 8, vy: -3, swirl: 10, alpha: .45 }]],
        front: [['mist', { count: 3, rgb: '225,235,228', r: [.25, .4], y0: e.base - e.H * .1, y1: e.H, a: [.04, .07], vx: [6, 14] }],
          ['rain', { count: 28, len: [18, 36], speed: [700, 900], alpha: .12, width: .8, color: '#dfeee4', wind: -.15 }],
          ['burst', { rgb: '215,235,220', sprite: 'soft', soft: true, comp: 'source-over', count: 16, delay: 0, dur: .4, spread: 1.1, vx: 26, vy: [6, 22], r: [40, 100], grow: 16, life: [2.4, 3.6], alpha: .16, yOff: -.7 }]],
      }),
    },
    'ajmal-1001-night': {
      title: 'The Lantern Courtyard', mood: 'Lamps in the arches, and a story told until dawn.',
      sound: 'bazaar', pos: '42% 62%', grade: 'brightness(.8) contrast(1.05) saturate(.95)', floor: '12,7,3', accent: '255,190,110', entrance: 'glow', reflect: true, sink: .012,
      parts: (e) => ({
        mid: [['haze', { count: 4, rgb: '255,160,80', y: e.hy, a: [.04, .07] }], ['bokeh', { count: 8, rgbs: ['255,190,120', '255,210,150'], r: [.03, .07], y1: e.gy }],
          ['dust', { count: 28, rgb: '255,200,130', size: [.5, 1.2], vx: 3, vy: -4, swirl: 8, alpha: .55 }]],
        front: [['dust', { count: 14, rgb: '255,215,160', size: [.9, 2], vx: 4, vy: -6, swirl: 10, alpha: .7 }], ['sparkles', { count: 6, y0: e.hy - e.H * .3, y1: e.gy, size: [2, 3.6] }],
          ['burst', { rgb: '255,200,120', count: 40, delay: .4, dur: 1.2, spread: 1, vx: 30, vy: [20, 60], g: -4, r: [.8, 1.8], life: [1.5, 3], alpha: .7 }]],
      }),
    },
    'al-bakhoor': {
      title: 'The Hall of Incense', mood: 'Smoke rising through old stone and lamplight.',
      sound: 'temple', pos: '50% 55%', grade: 'brightness(.92) contrast(1.06) saturate(.9)', floor: '8,5,3', accent: '255,190,120', entrance: 'smoke', reflect: true, sink: .012,
      incense: [[-1.35, .55], [1.4, .6]],
      parts: (e) => ({
        mid: [['dust', { count: 30, rgb: '255,210,150', size: [.5, 1.2], vx: 2, vy: -3, swirl: 6, alpha: .5 }], ['haze', { count: 4, rgb: '215,200,185', y: e.hy, a: [.03, .06], r: [.3, .5], comp: 'source-over' }]],
        front: [['incense', { rate: 7 }],
          ['burst', { rgb: '226,214,200', sprite: 'soft', soft: true, comp: 'source-over', count: 22, delay: 0, dur: .8, spread: 1, vx: 26, vy: [10, 34], g: -4, r: [30, 80], grow: 22, life: [2.6, 4.2], alpha: .2, yOff: -.5 }]],
      }),
    },
    'hajar-al-aswad': {
      title: 'The Black Stone Plain', mood: 'Dark volcanic earth at blue hour, warm and silent.',
      sound: 'night', pos: '50% 58%', grade: 'brightness(.74) contrast(1.1) saturate(.85)', floor: '5,5,7', accent: '230,215,190', entrance: 'rise', sink: .05,
      parts: (e) => ({
        mid: [['mist', { count: 4, rgb: '190,198,215', r: [.3, .5], y0: e.hy - e.H * .05, y1: e.gy, a: [.04, .07], vx: [4, 10] }], ['dust', { count: 18, rgb: '215,220,240', size: [.4, 1], vx: 6, vy: -2, swirl: 6, alpha: .4 }]],
        front: [['dust', { count: 12, rgb: '255,230,200', size: [.8, 1.8], vx: 8, vy: -4, swirl: 9, alpha: .6 }],
          ['burst', { rgb: '150,145,150', count: 90, delay: .35, dur: 2.3, spread: .7, vx: 60, vy: [40, 150], g: 170, r: [.7, 1.8], life: [1, 2.2], alpha: .7 }]],
      }),
    },
    'musk-gold': {
      title: 'The Golden Meadow', mood: 'Clean skin in sunlight, and seeds drifting on warm air.',
      sound: 'breeze', pos: '50% 55%', grade: 'brightness(.7) saturate(.9) sepia(.14) contrast(1.05)', floor: '18,12,5', accent: '255,226,170', entrance: 'glow', sink: .03,
      parts: (e) => ({
        mid: [['bokeh', { count: 12, rgbs: ['255,226,170', '255,240,210'], r: [.03, .08], y1: e.gy }], ['dust', { count: 40, rgb: '255,236,190', size: [.5, 1.3], vx: 8, vy: -6, swirl: 14, alpha: .6 }]],
        front: [['dust', { count: 18, rgb: '255,240,200', size: [1, 2.4], vx: 10, vy: -8, swirl: 16, alpha: .75 }], ['sparkles', { count: 8, y0: e.hy - e.H * .3, y1: e.gy, size: [2.4, 4.4] }],
          ['burst', { rgb: '255,230,170', count: 40, delay: .4, dur: 1.2, spread: 1, vx: 30, vy: [20, 60], g: -4, r: [.8, 1.8], life: [1.5, 3], alpha: .7 }]],
      }),
    },
    'mukhallat-malaki': {
      title: 'The Royal Garden', mood: 'Rose water in the channels, and a palace at dusk.',
      sound: 'stream', pos: '50% 38%', grade: 'brightness(.62) saturate(.82) sepia(.22) contrast(1.08)', floor: '14,7,5', accent: '255,170,160', entrance: 'bloom', reflect: true, sink: .03, fullPhoto: true, // keep the garden path under the floor on phones
      parts: () => ({
        mid: [['petals', { count: 5, size: [.016, .026], alpha: .6, soft: true }], ['dust', { count: 24, rgb: '255,215,170', size: [.5, 1.2], vx: 4, vy: -4, swirl: 8, alpha: .5 }]],
        front: [['petals', { count: 8, size: [.026, .042] }], ['petalBurst', { count: 28, delay: .1, dur: 1.4 }]],
      }),
    },
    celoud: {
      title: 'The Jasmine Rainforest', mood: 'Warm rain on the leaves, and white blossoms in the mist.',
      sound: 'rain', pos: '50% 50%', grade: 'brightness(.7) contrast(1.08) saturate(.85)', floor: '4,8,6', accent: '230,245,230', entrance: 'mist', reflect: true, sink: .02,
      parts: (e) => ({
        mid: [['mist', { count: 5, rgb: '210,228,215', r: [.3, .5], y0: e.hy - e.H * .2, y1: e.gy, a: [.05, .08], vx: [-10, -4], boost: 2.5 }],
          ['rain', { count: 90, len: [10, 22], speed: [520, 700], alpha: .14, width: .8, color: '#d8e8de', wind: -.1 }]],
        front: [['rain', { count: 46, len: [26, 52], speed: [900, 1150], alpha: .22, width: 1, color: '#e8f2ea', wind: -.12 }], ['ripples', { rate: 5 }],
          ['petals', { count: 4, size: [.02, .03], kind: 'jasmine', alpha: .85 }],
          ['burst', { rgb: '220,236,225', sprite: 'soft', soft: true, comp: 'source-over', count: 16, delay: 0, dur: .4, spread: 1.2, vx: 30, vy: [4, 20], r: [40, 110], grow: 18, life: [2.5, 4], alpha: .16, yOff: -.8 }]],
      }),
    },
    'bakhoor-dani': {
      title: 'The Lamp-lit Home', mood: 'Diyas at dusk, and smoke finding every corner.',
      sound: 'fire', pos: '68% 50%', grade: 'brightness(.72) contrast(1.06) saturate(.92)', floor: '12,4,2', accent: '255,160,90', entrance: 'smoke', reflect: true, sink: .012,
      incense: [[0, -.94]],
      parts: (e) => ({
        mid: [['haze', { count: 4, rgb: '255,130,60', y: e.hy, a: [.04, .07] }], ['dust', { count: 22, rgb: '255,190,120', size: [.5, 1.2], vx: 3, vy: -5, swirl: 8, alpha: .5 }]],
        front: [['incense', { rate: 8 }], ['sparks', { rate: 2.5, rgb: '255,150,60', spread: .8 }],
          ['burst', { rgb: '226,210,196', sprite: 'soft', soft: true, comp: 'source-over', count: 22, delay: 0, dur: .8, spread: 1, vx: 26, vy: [10, 34], g: -4, r: [30, 80], grow: 22, life: [2.6, 4.2], alpha: .2, yOff: -.5 }]],
      }),
    },
  };
  // a product added later without its own photo gets a quiet, dark, dust-lit world
  const FALLBACK = {
    title: 'The Quiet Room', mood: 'The moment after the noise.', sound: 'silk', grade: '', floor: '8,5,3', accent: '242,213,155', entrance: 'glow', sink: .012, reflect: true,
    parts: () => ({ mid: [['dust', { count: 30, rgb: '242,213,155', size: [.5, 1.2], vx: 3, vy: -4, swirl: 8, alpha: .5 }]], front: [] }),
  };
  const worldOf = (p) => WORLDS[p.id] || FALLBACK;
  const photoOf = (p) => (WORLDS[p.id] ? `assets/img/worlds/${p.id}.webp` : null); // .jpg originals are the fallback (common.js)

  /* ============================================================
     Canvas helpers: pre-rendered glow sprites (fast, no ctx.filter)
     ============================================================ */
  const sprites = {};
  function glow(rgb, kind = 'soft') {
    const key = rgb + kind;
    if (sprites[key]) return sprites[key];
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (kind === 'core') { gr.addColorStop(0, 'rgba(255,253,240,1)'); gr.addColorStop(.12, `rgba(${rgb},.9)`); gr.addColorStop(.38, `rgba(${rgb},.22)`); gr.addColorStop(1, `rgba(${rgb},0)`); }
    else if (kind === 'disc') { gr.addColorStop(0, `rgba(${rgb},.5)`); gr.addColorStop(.72, `rgba(${rgb},.42)`); gr.addColorStop(.88, `rgba(${rgb},.6)`); gr.addColorStop(1, `rgba(${rgb},0)`); }
    else { gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.4, `rgba(${rgb},.42)`); gr.addColorStop(1, `rgba(${rgb},0)`); }
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return (sprites[key] = c);
  }
  function blit(ctx, spr, x, y, r, a) {
    if (a <= .003 || r <= 0) return;
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
  }
  // GibArt art is vector (SVG); rasterise each kind once so the canvases never re-render SVG per frame
  // (plus a pre-blurred copy for the far, out-of-focus plane)
  const RASTER = {}, SOFT = {};
  function bitmap(im, blur) {
    const c = document.createElement('canvas'), g = c.getContext('2d'), n = 192;
    c.width = c.height = n;
    if (blur && 'filter' in g) { g.filter = 'blur(4px) brightness(.82)'; g.drawImage(im, n * .08, n * .08, n * .84, n * .84); }
    else g.drawImage(im, 0, 0, n, n);
    c.complete = true; c.naturalWidth = n; // GibArt.draw checks these
    return c;
  }
  function rasterise() {
    window.GibArt.kinds.forEach((k) => {
      const im = window.GibArt.image(k);
      const make = () => { if (!RASTER[k] && im.naturalWidth) { RASTER[k] = bitmap(im); SOFT[k] = bitmap(im, true); } };
      if (im.complete) make(); else im.addEventListener('load', make, { once: true });
    });
  }
  const art = (it, soft) => { if (!it.img && RASTER[it.kind]) it.img = (soft && SOFT[it.kind]) || RASTER[it.kind]; return it; };
  function star4(ctx, x, y, r) { // four-point sparkle
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  }

  /* ============================================================
     State
     ============================================================ */
  const main = $('#sw'), track = $('#sw-track'), layersEl = $('#sw-layers'), panelsEl = $('#sw-panels');
  const veil = $('#sw-veil'), railList = $('#sw-rail-list');
  const shadeB = $('#sw-shade-b'), shadeL = $('#sw-shade-l'), shadeR = $('#sw-shade-r');
  let product = null, world = null, env = null, aspect = .6;
  let layers = [], canvases = [], panels = [], timers = [];
  let enterT = 99, clock = 0, last = 0, raf = 0, visible = true, busy = false, drag = null;
  let trackTop = 0, trackH = 1, shiftPx = 0;
  const cam = { mx: 0, my: 0, tmx: 0, tmy: 0, side: 0, p: 0, crane: 0 };

  function makeEnv(W, H, w) {
    const portrait = W / H < .82;
    const gy = Math.round(H * (portrait ? .645 : .77));
    let bh = portrait ? Math.min(H * .3, W * .82) : Math.min(H * .45, 500);
    if (aspect > .8) bh *= .8; // squat attar bottles read larger
    const bw = Math.min(bh * aspect, W * .6);
    bh = bw / aspect;
    const e = {
      W, H, portrait, gy, bh, bw, cx: W / 2, hy: gy - H * .13,
      u: H / 900, u2: clamp(H / 900, .75, 1.3), s: Math.min(W, H),
      k: clamp((W * H) / (1440 * 900), .42, 1.25), P: Math.round(W * .22 + 80),
    };
    e.sink = bh * (w.sink || .02);
    e.base = gy - e.sink; // the line where the bottle meets its floor
    e.incense = (w.incense || []).map(([dx, dy]) => [e.cx + dx * bw, e.base + dy * bh]);
    return e;
  }

  /* Camera: each depth gets its own translate + scale (around the horizon point) */
  function camOf(d) {
    return {
      x: (cam.side * shiftPx * d) / D.hero - cam.mx * 34 * d,
      y: -cam.my * 18 * d - (cam.crane * env.H * .075 * d) / D.hero,
      s: 1 + cam.p * d * (env.portrait ? -.12 : .3),
    };
  }
  // move a point from one depth's local space into another's (keeps particles attached to the bottle)
  function project(x, y, dFrom, dTo) {
    const a = camOf(dFrom), b = camOf(dTo), ox = env.cx, oy = env.hy;
    const sx = ox + (x - ox) * a.s + a.x, sy = oy + (y - oy) * a.s + a.y;
    return { x: ox + (sx - b.x - ox) / b.s, y: oy + (sy - b.y - oy) / b.s, s: a.s / b.s };
  }

  // near particles fade while they pass in front of the bottle, so its label always stays readable
  function clearOfBottle(x, y, d) {
    const c = project(env.cx, env.gy - env.bh / 2, D.hero, d);
    const dx = Math.abs(x - c.x) / (env.bw * .5 * c.s), dy = Math.abs(y - c.y) / (env.bh * .5 * c.s);
    const inside = Math.max(dx, dy);
    return inside >= 1.15 ? 1 : .12 + .88 * smooth(clamp((inside - .75) / .4, 0, 1));
  }

  /* ============================================================
     Particle systems. SYS[name](opts, env, depth) → { step(ctx, dt, t) }
     Kept subtle: they should feel like air in the photograph, not decoration.
     ============================================================ */
  const SYS = {
    // drifting glowing specks (dust motes, pollen, spice dust, sea spray)
    dust(o, e) {
      const n = Math.round((o.count || 30) * e.k), [s0, s1] = o.size || [.6, 1.8];
      const y0 = o.y0 != null ? o.y0 : 0, y1 = o.y1 != null ? o.y1 : e.H;
      const ps = Array.from({ length: n }, () => ({ x: rand(0, e.W), y: rand(y0, y1), r: rand(s0, s1) * e.u2, ph: rand(0, TAU), f: rand(.4, 1.8), v: rand(.6, 1.4) }));
      const spr = glow(o.rgb, 'core'), sw = o.swirl || 10;
      return {
        step(ctx, dt, t) {
          ctx.globalCompositeOperation = 'lighter';
          for (const p of ps) {
            p.x += ((o.vx || 0) + Math.sin(t * .3 + p.ph) * sw) * p.v * dt * e.u2;
            p.y += ((o.vy || 0) + Math.cos(t * .37 + p.ph * 1.3) * sw * .6) * p.v * dt * e.u2;
            if (p.x > e.W + 20) p.x = -20; else if (p.x < -20) p.x = e.W + 20;
            if (p.y < y0 - 20) p.y = y1 + 20; else if (p.y > y1 + 20) p.y = y0 - 20;
            blit(ctx, spr, p.x, p.y, p.r * 6, (o.alpha || .8) * (.3 + .7 * Math.max(0, Math.sin(t * p.f + p.ph))));
          }
        },
      };
    },

    // wind-blown sand streaks skimming the ground
    sand(o, e) {
      const n = Math.round((o.count || 40) * e.k);
      const spawn = (p, any) => Object.assign(p, { x: any ? rand(0, e.W) : -rand(0, e.W * .3), y: rand(e.base - e.H * .02, e.H), len: rand(14, 70) * e.u2, v: rand(150, 340) * e.u2, a: rand(.03, .12) });
      const ps = Array.from({ length: n }, () => spawn({}, true));
      return {
        step(ctx, dt, t) {
          const gust = .55 + .45 * Math.sin(t * .33) * Math.sin(t * .13 + 1);
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgb(240,206,150)';
          ctx.lineWidth = .8;
          for (const p of ps) {
            p.x += p.v * (.5 + gust) * dt;
            if (p.x - p.len > e.W) spawn(p);
            ctx.globalAlpha = p.a * (.4 + gust);
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.len, p.y + p.len * .05); ctx.stroke();
          }
        },
      };
    },

    // GibArt petals (or blossoms) drifting down on a breeze
    petals(o, e, d) {
      const n = Math.max(3, Math.round((o.count || 8) * e.k));
      const ps = Array.from({ length: n }, () => ({ kind: o.kind || 'petal', x: rand(-40, e.W + 40), y: rand(-40, e.H), vx: rand(8, 26) * e.u2, vy: rand(16, 34) * e.u2, sw: rand(10, 30) * e.u2, ph: rand(0, TAU), s: rand(o.size[0], o.size[1]) * e.s }));
      return {
        step(ctx, dt, t) {
          ctx.globalCompositeOperation = 'source-over';
          for (const p of ps) {
            p.x += (p.vx + Math.sin(t * .8 + p.ph) * p.sw) * dt;
            p.y += p.vy * dt;
            if (p.y > e.H + 40) { p.y = -40; p.x = rand(-60, e.W); }
            if (p.x > e.W + 50) p.x = -50;
            window.GibArt.draw(ctx, art(p, o.soft), p.x, p.y, p.s, (o.alpha || .9) * (o.soft ? 1 : clearOfBottle(p.x, p.y, d)), dt);
          }
        },
      };
    },

    // fireflies wandering with a slow pulse
    fireflies(o, e) {
      const n = Math.max(3, Math.round((o.count || 10) * e.k));
      const fs = Array.from({ length: n }, () => ({ hx: rand(0, e.W), hy: rand(o.y0, o.y1), A: rand(20, 70) * e.u2, f1: rand(.08, .22), f2: rand(.1, .25), p: [rand(0, TAU), rand(0, TAU), rand(0, TAU)], pf: rand(.5, 1.2), r: rand(o.size[0], o.size[1]) * e.u2 }));
      const spr = glow('214,255,150', 'core');
      return {
        step(ctx, dt, t) {
          ctx.globalCompositeOperation = 'lighter';
          for (const f of fs) {
            const x = f.hx + Math.sin(t * f.f1 + f.p[0]) * f.A + Math.sin(t * f.f1 * 2.7 + f.p[1]) * f.A * .3;
            const y = f.hy + Math.cos(t * f.f2 + f.p[2]) * f.A * .6;
            blit(ctx, spr, x, y, f.r * 6, .12 + Math.pow(Math.max(0, Math.sin(t * f.pf + f.p[1])), 2) * .8);
          }
        },
      };
    },

    // big soft out-of-focus discs of light
    bokeh(o, e) {
      const n = Math.max(4, Math.round((o.count || 12) * e.k));
      const bs = Array.from({ length: n }, () => ({ x: rand(0, e.W), y: rand(o.y0 || 0, o.y1 || e.H), r: rand(o.r[0], o.r[1]) * e.s, a: rand(.04, .11), spr: glow(pick(o.rgbs), 'disc'), vx: rand(-4, 6), vy: rand(-6, -1), ph: rand(0, TAU) }));
      return {
        step(ctx, dt, t) {
          ctx.globalCompositeOperation = 'lighter';
          for (const b of bs) {
            b.x += b.vx * dt * e.u2; b.y += b.vy * dt * e.u2;
            if (b.y < -b.r) b.y = (o.y1 || e.H) + b.r;
            if (b.x > e.W + b.r) b.x = -b.r; else if (b.x < -b.r) b.x = e.W + b.r;
            blit(ctx, b.spr, b.x, b.y, b.r, b.a * (.6 + .4 * Math.sin(t * .4 + b.ph)));
          }
        },
      };
    },

    // fine rain streaks, all stroked in a single path
    rain(o, e) {
      const n = Math.round((o.count || 100) * e.k), wind = o.wind || -.15;
      const ps = Array.from({ length: n }, () => ({ x: rand(-e.W * .1, e.W * 1.4), y: rand(-e.H, e.H), len: rand(o.len[0], o.len[1]) * e.u2, v: rand(o.speed[0], o.speed[1]) * e.u2 }));
      return {
        step(ctx, dt) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = o.alpha || .25;
          ctx.strokeStyle = o.color || '#dfeef0';
          ctx.lineWidth = (o.width || 1) * e.u2;
          ctx.beginPath();
          for (const p of ps) {
            p.y += p.v * dt; p.x += p.v * wind * dt;
            if (p.y - p.len > e.H) { p.y = rand(-80, -10); p.x = rand(-e.W * .1, e.W * 1.4); }
            ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - wind * p.len, p.y - p.len);
          }
          ctx.stroke();
        },
      };
    },

    // rain rings on the wet floor around the bottle
    ripples(o, e, d) {
      const rs = [];
      let acc = 0;
      return {
        step(ctx, dt) {
          acc += dt * (o.rate || 6);
          while (acc > 1) {
            acc--;
            const c = project(e.cx, e.base + e.bh * .02, D.hero, d);
            const y = c.y + rand(0, e.H - c.y) * Math.pow(Math.random(), 1.5);
            rs.push({ x: rand(0, e.W), y, R: rand(8, 24) * e.u2 * (1 + (y - c.y) / e.H * 2), life: 0, max: rand(.9, 1.4) });
          }
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = '#d6ecec';
          ctx.lineWidth = .9;
          for (let i = rs.length - 1; i >= 0; i--) {
            const r = rs[i];
            r.life += dt;
            if (r.life > r.max) { rs.splice(i, 1); continue; }
            const q = r.life / r.max, rr = r.R * Math.pow(q, .6);
            ctx.globalAlpha = (1 - q) * .35;
            ctx.beginPath(); ctx.ellipse(r.x, r.y, rr, rr * .26, 0, 0, TAU); ctx.stroke();
          }
        },
      };
    },

    // drifting banks of mist (thick at the entrance, then thinning)
    mist(o, e) {
      const n = Math.max(3, Math.round((o.count || 5) * Math.max(.7, e.k)));
      const spr = glow(o.rgb || '210,225,228', 'soft');
      const ms = Array.from({ length: n }, () => ({ x: rand(-e.W * .2, e.W * 1.2), y: rand(o.y0, o.y1), r: rand(o.r[0], o.r[1]) * e.s, a: rand(o.a[0], o.a[1]), vx: rand(o.vx[0], o.vx[1]) * e.u2 }));
      return {
        step(ctx, dt) {
          ctx.globalCompositeOperation = 'source-over';
          const boost = 1 + (o.boost || 0) * Math.exp(-enterT / 1.8);
          for (const m of ms) {
            m.x += m.vx * dt;
            if (m.x - m.r > e.W * 1.2) m.x = -m.r; else if (m.x + m.r < -e.W * .2) m.x = e.W + m.r;
            blit(ctx, spr, m.x, m.y, m.r, m.a * boost);
          }
        },
      };
    },

    // warm glowing haze
    haze(o, e) {
      const n = Math.max(3, Math.round((o.count || 5) * Math.max(.7, e.k)));
      const spr = glow(o.rgb, 'soft');
      const hs = Array.from({ length: n }, () => ({ x: rand(-e.W * .1, e.W * 1.1), y: o.y + rand(-1, 1) * e.H * .14, r: rand(o.r ? o.r[0] : .25, o.r ? o.r[1] : .5) * e.s, a: rand(o.a[0], o.a[1]), vx: rand(-8, 8) * e.u2, ph: rand(0, TAU) }));
      return {
        step(ctx, dt, t) {
          ctx.globalCompositeOperation = o.comp || 'lighter';
          for (const h of hs) {
            h.x += h.vx * dt;
            if (h.x - h.r > e.W * 1.1) h.x = -h.r; else if (h.x + h.r < -e.W * .1) h.x = e.W + h.r;
            blit(ctx, spr, h.x, h.y, h.r, h.a * (.7 + .3 * Math.sin(t * .25 + h.ph)));
          }
        },
      };
    },

    // soft musk sparkles that bloom and vanish
    sparkles(o, e) {
      const n = Math.max(4, Math.round((o.count || 10) * e.k)), spr = glow('255,240,214', 'core');
      const place = (s) => { s.x = rand(e.W * .04, e.W * .96); s.y = rand(o.y0, o.y1); return s; };
      const ss = Array.from({ length: n }, () => place({ T: rand(2.5, 5), ph: rand(0, 5), s: rand(o.size[0], o.size[1]) * e.u2, cyc: -1 }));
      return {
        step(ctx, dt, t) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = '#fff8e8';
          for (const s of ss) {
            const tt = t + s.ph, cyc = Math.floor(tt / s.T);
            if (cyc !== s.cyc) { if (s.cyc >= 0) place(s); s.cyc = cyc; }
            const k = Math.pow(Math.sin(((tt % s.T) / s.T) * Math.PI), 4);
            if (k < .02) continue;
            blit(ctx, spr, s.x, s.y, s.s * 4, k * .5);
            ctx.globalAlpha = k * .8;
            star4(ctx, s.x, s.y, s.s * (.6 + k * .6));
          }
        },
      };
    },

    // saffron threads tumbling slowly through the air
    threads(o, e) {
      const n = Math.max(5, Math.round((o.count || 12) * e.k));
      const th = Array.from({ length: n }, () => ({ x: rand(0, e.W), y: rand(0, e.H), l: rand(8, 16) * e.u2, rot: rand(0, TAU), vr: rand(-.8, .8), vx: rand(-6, 10) * e.u2, vy: rand(6, 16) * e.u2, ph: rand(0, TAU) }));
      return {
        step(ctx, dt, t) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.lineCap = 'round';
          for (const p of th) {
            p.x += (p.vx + Math.sin(t * .7 + p.ph) * 8 * e.u2) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
            if (p.y > e.H + 20) { p.y = -20; p.x = rand(0, e.W); }
            if (p.x > e.W + 20) p.x = -20; else if (p.x < -20) p.x = e.W + 20;
            ctx.save();
            ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.globalAlpha = .8;
            ctx.strokeStyle = '#c8321a'; ctx.lineWidth = 1.4 * e.u2;
            ctx.beginPath(); ctx.moveTo(-p.l / 2, 0); ctx.quadraticCurveTo(0, -p.l * .35, p.l / 2, 0); ctx.stroke();
            ctx.restore();
          }
        },
      };
    },

    // incense: a thin curling strand from each source, breaking into drifting smoke
    incense(o, e, d) {
      const src = e.incense || [], puffsArr = [], spr = glow('226,216,204', 'soft');
      let acc = 0;
      return {
        step(ctx, dt, t) {
          ctx.globalCompositeOperation = 'source-over';
          src.forEach(([sx, sy], i) => {
            const p = project(sx, sy, D.hero, d), L = e.H * .14 * p.s, amp = 9 * e.u2;
            const g = ctx.createLinearGradient(0, p.y, 0, p.y - L);
            g.addColorStop(0, 'rgba(236,226,212,0)'); g.addColorStop(.25, 'rgba(236,226,212,.5)'); g.addColorStop(1, 'rgba(236,226,212,0)');
            ctx.strokeStyle = g;
            for (let k = 0; k < 2; k++) {
              ctx.globalAlpha = k ? .5 : 1;
              ctx.lineWidth = (k ? .8 : 1.3) * e.u2;
              ctx.beginPath();
              for (let j = 0; j <= 26; j++) {
                const q = j / 26, yy = q * L;
                const x = p.x + Math.sin(yy * .05 / e.u2 - t * 1.5 + i * 2 + k * 1.3) * amp * Math.pow(q, 1.3);
                if (j) ctx.lineTo(x, p.y - yy); else ctx.moveTo(x, p.y - yy);
              }
              ctx.stroke();
            }
            if (!dt) return;
            acc += dt * (o.rate || 8);
            while (acc > 1) {
              acc--;
              puffsArr.push({ x: p.x + Math.sin(-t * 1.5 + i * 2 + L * .05 / e.u2) * amp, y: p.y - L * .85, vx: rand(-4, 4) * e.u2, vy: -rand(16, 28) * e.u2, r: 5 * e.u2, g: rand(10, 20) * e.u2, life: 0, max: rand(3.5, 5.5), sd: rand(0, TAU) });
            }
          });
          for (let i = puffsArr.length - 1; i >= 0; i--) {
            const f = puffsArr[i];
            f.life += dt;
            if (f.life > f.max) { puffsArr.splice(i, 1); continue; }
            f.x += (f.vx + Math.sin(f.life * 1.3 + f.sd) * 14 * e.u2) * dt; f.y += f.vy * dt; f.r += f.g * dt;
            blit(ctx, spr, f.x, f.y, f.r, .12 * Math.sin((f.life / f.max) * Math.PI));
          }
        },
      };
    },

    // embers rising from the lamps below
    sparks(o, e) {
      const es = [], spr = glow(o.rgb || '255,150,60', 'core');
      let acc = 0;
      return {
        step(ctx, dt, t) {
          acc += dt * (o.rate || 3) * e.k;
          while (acc > 1) {
            acc--;
            es.push({ x: e.cx + (Math.random() - .5) * e.W * (o.spread || .8), y: rand(e.base - e.H * .05, e.H), vx: rand(-6, 6) * e.u2, vy: -rand(18, 46) * e.u2, r: rand(.7, 1.6) * e.u2, life: 0, max: rand(1.6, 3.4), ph: rand(0, TAU) });
          }
          ctx.globalCompositeOperation = 'lighter';
          for (let i = es.length - 1; i >= 0; i--) {
            const f = es[i];
            f.life += dt;
            if (f.life > f.max) { es.splice(i, 1); continue; }
            f.x += (f.vx + Math.sin(f.life * 3 + f.ph) * 8 * e.u2) * dt; f.y += f.vy * dt;
            blit(ctx, spr, f.x, f.y, f.r * 5, (1 - f.life / f.max) * (.55 + .45 * Math.sin(t * 18 + f.ph)));
          }
        },
      };
    },

    // one-shot entrance burst at the bottle's feet (sand, spice, mist, smoke, light)
    burst(o, e, d) {
      if (!e.fresh) return { step() {} };
      const total = Math.round(o.count * Math.max(.6, e.k)), ps = [], spr = glow(o.rgb, o.sprite || 'core');
      let made = 0;
      const spawn = () => {
        const b = project(e.cx, e.base, D.hero, d);
        ps.push({
          x: b.x + rand(-1, 1) * e.bw * (o.spread || .6), y: b.y + (o.yOff ? rand(o.yOff, 0) * e.bh : rand(-.01, .01) * e.bh),
          vx: rand(-1, 1) * (o.vx || 40) * e.u2, vy: -rand(o.vy[0], o.vy[1]) * e.u2, r: rand(o.r[0], o.r[1]) * e.u2, life: 0, max: rand(o.life[0], o.life[1]),
        });
      };
      return {
        step(ctx, dt) {
          const T = enterT - (o.delay || 0);
          if (T > 0 && made < total) { const want = Math.min(total, Math.ceil(total * Math.min(1, T / (o.dur || 1)))); while (made < want) { spawn(); made++; } }
          ctx.globalCompositeOperation = o.comp || 'lighter';
          for (let i = ps.length - 1; i >= 0; i--) {
            const p = ps[i];
            p.life += dt;
            if (p.life > p.max) { ps.splice(i, 1); continue; }
            p.vy += (o.g || 0) * e.u2 * dt; p.vx *= 1 - dt * .7;
            p.x += p.vx * dt; p.y += p.vy * dt; p.r += (o.grow || 0) * e.u2 * dt;
            const q = p.life / p.max;
            blit(ctx, spr, p.x, p.y, o.soft ? p.r : p.r * 5, (o.alpha || .6) * (o.soft ? Math.sin(q * Math.PI) : 1 - q));
          }
        },
      };
    },

    // petals spiralling up as the bottle blooms into view
    petalBurst(o, e, d) {
      if (!e.fresh) return { step() {} };
      const total = Math.round(o.count * Math.max(.7, e.k)), ps = [];
      let made = 0;
      return {
        step(ctx, dt) {
          const T = enterT - (o.delay || 0);
          if (T > 0 && made < total) {
            const want = Math.min(total, Math.ceil(total * Math.min(1, T / (o.dur || 1))));
            while (made < want) { made++; ps.push({ kind: 'petal', ang: rand(0, TAU), rad: rand(e.bw * .3, e.bw * .5), vr: rand(90, 170) * e.u2, h: 0, vh: rand(60, 150) * e.u2, s: rand(.022, .04) * e.s, life: 0, max: rand(2.6, 4) }); }
          }
          ctx.globalCompositeOperation = 'source-over';
          const b = project(e.cx, e.base, D.hero, d);
          for (let i = ps.length - 1; i >= 0; i--) {
            const p = ps[i];
            p.life += dt;
            if (p.life > p.max) { ps.splice(i, 1); continue; }
            p.rad += p.vr * dt; p.vr *= 1 - dt * .9; p.ang += dt * 1.1;
            p.h += p.vh * dt; p.vh -= 46 * e.u2 * dt;
            const q = p.life / p.max, x = b.x + Math.cos(p.ang) * p.rad, y = b.y - p.h + Math.sin(p.ang) * p.rad * .25;
            window.GibArt.draw(ctx, art(p), x, y, p.s, Math.min(1, (1 - q) * 2.2) * clearOfBottle(x, y, d), dt);
          }
        },
      };
    },

    // the fragrance's own ingredients (GibArt) drifting around the bottle
    ingredients(o, e, d) {
      const front = o.layer === 'front';
      const kinds = [...new Set(product.ingredients.flatMap((k) => window.GibArt.forIngredient(k)))];
      const n = e.portrait ? 6 : 10, items = [], fx = [];
      let seed = 41 + (front ? 7 : 0);
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const delay0 = world.entrance === 'rise' ? 2.1 : 1.2;
      for (let i = 0; i < n; i++) {
        if ((i % 2 === 1) !== front) continue;
        const size = clamp(e.s * .08, 28, 80) * (front ? 1 : .62) * (.85 + rnd() * .3);
        const maxRx = e.W * .5 - size * .55 - 6;
        items.push({
          kind: kinds[i % kinds.length], a: (i / n) * TAU + rnd() * .6,
          rx: Math.min(e.bw * (.75 + rnd() * .9) + size * .5, maxRx), ry: e.bh * (.22 + rnd() * .28),
          sp: (.035 + rnd() * .05) * (rnd() < .5 ? -1 : 1), bob: e.bh * (.03 + rnd() * .04), ph: rnd() * TAU, size, delay: delay0 + i * .16,
        });
      }
      return {
        step(ctx, dt, t) {
          ctx.globalCompositeOperation = 'source-over';
          const c = project(e.cx, e.gy - e.bh * .55, D.hero, d);
          for (const it of items) {
            it.a += it.sp * dt;
            const x = c.x + Math.cos(it.a) * it.rx * c.s, y = c.y + Math.sin(it.a) * it.ry * c.s + Math.sin(t * .7 + it.ph) * it.bob;
            const al = clamp((enterT - it.delay) / 1.6, 0, 1) * (front ? clearOfBottle(x, y, d) : .72);
            if (al <= 0) continue;
            window.GibArt.draw(ctx, art(it, !front), x, y, it.size, al, dt, fx);
          }
          window.GibArt.drawFx(ctx, fx, dt);
        },
      };
    },
  };

  /* ============================================================
     Building a world
     ============================================================ */
  // a plane is larger than the stage so camera moves never reveal its edge; photo planes need less (they move little)
  function box(e, px = e.P, py = e.P) { return `left:${-px}px;top:${-py}px;width:${e.W + 2 * px}px;height:${e.H + 2 * py}px;transform-origin:${r1(e.cx + px)}px ${r1(e.hy + py)}px`; }
  function inner(e) { return `left:${e.P}px;top:${e.P}px;width:${e.W}px;height:${e.H}px`; }

  function build(fresh) {
    timers.forEach(clearTimeout); timers = [];
    world = worldOf(product);
    const W = stage.clientWidth, H = stage.clientHeight;
    env = makeEnv(W, H, world);
    env.fresh = fresh && !reduce;
    const e = env, src = photoOf(product);
    const clipTop = e.gy - e.bh * 1.6, ppx = Math.round(e.W * .09 + 40), ppy = Math.round(e.H * .07 + 40);
    // on tall screens the sharp photo ends at the floor line, so its subject (dunes, cliffs…) is not lost under the floor
    // (fullPhoto worlds keep the whole frame so their busy foreground stays hidden under the floor)
    const photo = (cls, filter, fit) => (src ? `<img class="${cls}" src="${src}" alt="" decoding="async" draggable="false" style="object-position:${world.pos};filter:${filter || 'none'}${fit && e.portrait && !world.fullPhoto ? `;height:${r1(e.base + e.H * .06 + ppy)}px` : ''}">` : '<div class="sw-nophoto"></div>');
    const bottleImg = `<img src="${product.image}" alt="${product.name}" draggable="false">`;

    main.classList.toggle('sw-portrait', e.portrait);
    layersEl.className = `sw-layers e-${world.entrance}`;
    layersEl.style.setProperty('--c', world.accent);
    layersEl.style.setProperty('--floor', world.floor);
    layersEl.innerHTML =
      // far plane: the same photograph, blurred — it shows at the soft edges and moves more slowly
      `<div class="sw-l sw-l-back" data-d="${D.back}" data-kb="1" style="${box(e, ppx, ppy)}">${photo('sw-photo sw-photo-back', `blur(14px) ${world.grade} brightness(.85)`)}</div>` +
      // near plane: the sharp photograph, its edges dissolving into the far plane
      `<div class="sw-l sw-l-photo" data-d="${D.photo}" data-kb="2" style="${box(e, ppx, ppy)}">${photo('sw-photo sw-photo-front', world.grade, true)}</div>` +
 '<div class="sw-grade"></div>' + // brand colour grade + vignette
      `<div class="sw-l sw-l-cmid" data-d="${D.cmid}" style="${box(e)}"><div class="sw-in" style="${inner(e)}"><canvas data-c="cmid"></canvas></div></div>` +
      `<div class="sw-l sw-l-hero" data-d="${D.hero}" style="${box(e)}"><div class="sw-in" style="${inner(e)}">` +
        `<div class="sw-floor" style="top:${r1(e.base - e.H * .07)}px"></div>` +
        `<div class="sw-pool" style="left:${r1(e.cx)}px;top:${r1(e.base)}px;width:${r1(e.bw * 3.4)}px;height:${r1(e.bh * .2)}px"></div>` +
        `<div class="sw-halo" style="left:${r1(e.cx)}px;top:${r1(e.gy - e.bh * .52)}px;width:${r1(e.bh * 2)}px;height:${r1(e.bh * 2)}px"></div>` +
        (world.reflect ? `<div class="sw-reflect" style="left:${r1(e.cx - e.bw / 2)}px;top:${r1(e.base)}px;width:${r1(e.bw)}px;height:${r1(e.bh)}px"><img src="${product.image}" alt="" draggable="false"></div>` : '') +
        `<div class="sw-shadow" style="left:${r1(e.cx)}px;top:${r1(e.base)}px;width:${r1(e.bw * 1.3)}px;height:${r1(e.bh * .07)}px"></div>` +
        `<div class="sw-clip" style="left:${r1(e.cx - e.bw)}px;top:${r1(clipTop)}px;width:${r1(e.bw * 2)}px;height:${r1(e.base - clipTop)}px">` +
          `<div class="sw-bottle e-${world.entrance}" style="left:${r1(e.bw / 2)}px;top:${r1(e.bh * .6)}px;width:${r1(e.bw)}px;height:${r1(e.bh)}px">${bottleImg}</div></div>` +
      `</div></div>` +
      `<div class="sw-l sw-l-front" data-d="${D.front}" style="${box(e)}"><div class="sw-in" style="${inner(e)}"><canvas data-c="front"></canvas></div></div>`;
    layers = [...layersEl.querySelectorAll('.sw-l')].map((el) => ({ el, d: Number(el.dataset.d), kb: Number(el.dataset.kb || 0) }));

    const defsOf = world.parts(e);
    const sysFor = { cmid: [...defsOf.mid, ['ingredients', { layer: 'back' }]], front: [...defsOf.front, ['ingredients', { layer: 'front' }]] };
    canvases = [...layersEl.querySelectorAll('canvas')].map((c) => {
      const name = c.dataset.c, d = D[name], ddpr = Math.min(window.devicePixelRatio || 1, 2);
      // the mid canvas renders at reduced resolution: a free, soft depth-of-field look (a CSS blur would cost every frame)
      const dpr = name === 'front' ? ddpr : ddpr * .7;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      return { c, ctx: c.getContext('2d'), dpr, sys: sysFor[name].map(([n, o]) => SYS[n](o, e, d)) };
    });

    const bottle = layersEl.querySelector('.sw-bottle'), lift = layersEl.querySelectorAll('.sw-halo, .sw-reflect, .sw-pool');
    if (env.fresh) {
      enterT = 0;
      requestAnimationFrame(() => requestAnimationFrame(() => { bottle.classList.add('in'); lift.forEach((el) => el.classList.add('in')); }));
      timers.push(setTimeout(() => bottle.classList.add('done'), 3800));
    } else {
      enterT = 99;
      bottle.classList.add('in', 'done', 'now'); lift.forEach((el) => el.classList.add('in', 'now'));
    }
    applyCamera();
    if (reduce) renderStatic();
  }

  function drawCanvas(cv, dt) {
    const { ctx, dpr } = cv;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, env.W, env.H);
    for (const s of cv.sys) { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; s.step(ctx, dt, clock); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  // reduced motion: one still frame once the ingredient art has decoded
  function renderStatic() {
    const kinds = window.GibArt.kinds.map((k) => window.GibArt.image(k));
    Promise.all(kinds.map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()))).then(() => {
      rasterise();
      clock = 2.4;
      canvases.forEach((cv) => drawCanvas(cv, 0));
    });
  }

  /* ============================================================
     Story panels
     ============================================================ */
  const ARROW = '<svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" aria-hidden="true"><path d="M0 5h20M16 1l4 4-4 4"/></svg>';
  function artFor(note) {
    const n = note.toLowerCase(), I = window.GIB_INGREDIENTS;
    const key = Object.keys(I).find((k) => I[k].label.toLowerCase() === n || n.includes(k) || n.includes(I[k].label.toLowerCase()));
    return key ? window.GibArt.forIngredient(key)[0] : null;
  }
  function panelsHTML(p) {
    const w = worldOf(p), i = PRODUCTS.indexOf(p), next = PRODUCTS[(i + 1) % PRODUCTS.length];
    const forSale = p.price != null;
    const row = (label, notes) => notes.length ? `<div class="pyr-row"><b>${label}</b><span>${notes.join(' · ')}<i class="sw-ico">${notes.map(artFor).filter(Boolean).map((k) => `<img src="${window.GibArt.url(k)}" alt="">`).join('')}</i></span></div>` : '';
    return `
      <section class="sw-panel sw-p-intro" data-side="0"><div class="sw-copy">
        <span class="eyebrow">${p.house}</span>
        <h1 class="sw-name" data-no-i18n>${p.name}</h1>
        <p class="sw-mood">${w.mood}</p>
        <div class="sw-hint" aria-hidden="true"><i></i><span>${hover ? 'Scroll to step inside · move to look around' : 'Scroll to step inside · drag to explore'}</span></div>
      </div></section>
      <section class="sw-panel" data-side="-1"><div class="sw-copy">
        <span class="eyebrow">I · The feeling</span>
        <p class="sw-tagline">${p.tagline}</p>
        <div class="sw-feel">${p.feel.map((f) => `<span>${f}</span>`).join('<i aria-hidden="true"></i>')}</div>
      </div></section>
      <section class="sw-panel" data-side="1"><div class="sw-copy">
        <span class="eyebrow">II · The story</span>
        <p class="sw-story">${p.story}</p>
      </div></section>
      <section class="sw-panel" data-side="-1"><div class="sw-copy">
        <span class="eyebrow">III · The notes</span>
        <h2 class="h-2 sw-notes-h">How it <em>unfolds</em></h2>
        <div class="pyramid sw-pyr">${row('Top', p.notes.top)}${row('Heart', p.notes.heart)}${row('Base', p.notes.base)}</div>
      </div></section>
      <section class="sw-panel sw-p-shop" data-side="1"><div class="sw-copy">
        <span class="eyebrow">Take this world home</span>
        <h2 class="h-1" data-no-i18n>${p.name}</h2>
        <p class="sw-size">${p.house} · ${p.size}</p>
        <div class="sw-price">${forSale ? window.gibMoney(p.price) : 'By invitation'}</div>
        <div class="btn-row">
          <button class="btn btn-solid" type="button" data-add="${p.id}">${forSale ? 'Add to bag' : 'Join the waitlist'}</button>
          <button class="btn btn-ghost" type="button" data-feel="${p.id}">Feel it</button>
        </div>
        <a class="link-arrow sw-kundli" href="kundli.html">Read your Scent Kundli ${ARROW}</a>
        <button class="sw-next" type="button" data-go="${next.id}"><span>Next world</span><em>${worldOf(next).title}</em>${ARROW}</button>
      </div></section>`;
  }
  function collectPanels() {
    panels = [...panelsEl.querySelectorAll('.sw-panel')].map((sec) => ({ sec, el: sec.querySelector('.sw-copy'), side: Number(sec.dataset.side), top: 0, k: -1 }));
  }
  function measure() {
    const y = window.scrollY;
    trackTop = track.getBoundingClientRect().top + y;
    trackH = track.offsetHeight;
    panels.forEach((pn) => (pn.top = pn.sec.getBoundingClientRect().top + y));
    // landscape: slide the bottle just far enough that a side panel never covers it
    const sides = panels.filter((pn) => pn.side);
    if (env && sides.length && !env.portrait) {
      const pad = parseFloat(getComputedStyle(sides[0].sec).paddingLeft) || 48;
      const copyW = Math.max(...sides.map((pn) => pn.el.offsetWidth));
      shiftPx = clamp(env.bw / 2 + copyW + pad + 28 - env.W / 2, env.W * .05, env.W * .22);
    } else shiftPx = 0;
  }

  /* ============================================================
     Camera, scroll & loop
     ============================================================ */
  function applyCamera() {
    for (const l of layers) {
      const c = camOf(l.d);
      let { x, y, s } = c;
      if (l.kb && !reduce) { // slow Ken-Burns drift of the photograph (the two planes drift slightly differently)
        const t = clock * (l.kb === 1 ? .7 : 1);
        s *= 1.05 + .035 * (.5 + .5 * Math.sin(t * .045));
        x += Math.sin(t * .031) * env.W * .012;
        y += Math.cos(t * .027) * env.H * .01;
      } else if (l.kb) s *= 1.04;
      l.el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${s.toFixed(4)})`;
    }
  }
  function readScroll(dt) {
    const y = window.scrollY, vh = env.H;
    const p = clamp((y - trackTop) / Math.max(1, trackH - vh), 0, 1);
    const ease = 1 - Math.exp(-dt * 7);
    cam.p += (p - cam.p) * ease;
    let side = 0, left = 0, right = 0, maxK = 0, intro = 0;
    panels.forEach((pn, i) => {
      const d = (pn.top - y) / vh, k = smooth(clamp(1 - Math.abs(d) * 1.9, 0, 1));
      if (Math.abs(k - pn.k) > .002 || (k > 0 && k < 1)) {
        pn.k = k;
        pn.el.style.opacity = k.toFixed(3);
        pn.el.style.transform = `translate3d(0,${(d * 50).toFixed(1)}px,0)`;
        pn.el.style.pointerEvents = k < .2 ? 'none' : '';
      }
      side += pn.side * k;
      if (pn.side < 0) left += k; else if (pn.side > 0) right += k;
      if (i === 0) intro = k;
      maxK = Math.max(maxK, k);
    });
    cam.side += (-side - cam.side) * ease;
    // phones: once past the intro the camera cranes up, a little more for the shop panel
    const crane = env.portrait ? smooth(clamp(((y - trackTop) / vh) * 1.6 - .25, 0, 1)) + panels[panels.length - 1].k * .6 : 0;
    cam.crane += (crane - cam.crane) * ease;
    if (env.portrait) {
      shadeB.style.opacity = (.62 + .38 * maxK).toFixed(3);
      shadeL.style.opacity = shadeR.style.opacity = '0';
    } else {
      shadeB.style.opacity = (.25 + .45 * intro).toFixed(3);
      shadeL.style.opacity = Math.min(1, left + intro * .55).toFixed(3);
      shadeR.style.opacity = Math.min(1, right).toFixed(3);
    }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000 || .016);
    last = now;
    if (document.body.classList.contains('no-scroll')) return; // the bag, menu or "Feel it" overlay covers the world
    clock += dt; enterT += dt;
    const k = 1 - Math.exp(-dt * 3);
    cam.mx += (cam.tmx - cam.mx) * k; cam.my += (cam.tmy - cam.my) * k;
    readScroll(dt);
    applyCamera();
    for (const cv of canvases) drawCanvas(cv, dt);
  }
  function start() {
    if (reduce || raf || !visible || document.hidden || !env) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  function staticShades() {
    if (!env) return;
    shadeB.style.opacity = env.portrait ? '.85' : '.5';
    shadeL.style.opacity = shadeR.style.opacity = env.portrait ? '0' : '.6';
  }

  /* ============================================================
     Switching worlds
     ============================================================ */
  function loadImage(src, timeout = 4000) {
    return new Promise((res) => {
      if (!src) { res(null); return; }
      const im = new Image();
      im.decoding = 'async';
      let done = false;
      const fin = () => { if (!done) { done = true; res(im); } };
      im.onload = () => (im.decode ? im.decode().then(fin, fin) : fin());
      im.onerror = fin;
      setTimeout(fin, timeout);
      im.src = src;
    });
  }
  const preloaded = new Set();
  function preload(p) { // warm the next world's photo in the background
    const src = photoOf(p);
    if (!src || preloaded.has(src)) return;
    preloaded.add(src);
    const go = () => { const im = new Image(); im.decoding = 'async'; im.fetchPriority = 'low'; im.src = src; };
    if ('requestIdleCallback' in window) window.requestIdleCallback(go, { timeout: 3000 }); else setTimeout(go, 1200);
  }
  function jumpTop() {
    const html = document.documentElement, prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    if (window.gibLenis) window.gibLenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev;
  }
  function updateRail() {
    const items = [...railList.querySelectorAll('.sw-rail-item')];
    items.forEach((b) => b.setAttribute('aria-current', b.dataset.go === product.id ? 'true' : 'false'));
    const a = items.find((b) => b.dataset.go === product.id);
    if (a) railList.scrollTo({ left: a.offsetLeft - railList.clientWidth / 2 + a.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    const i = PRODUCTS.indexOf(product) + 1;
    $('#sw-count').textContent = `${String(i).padStart(2, '0')} / ${String(PRODUCTS.length).padStart(2, '0')}`;
    $('#sw-world-name').textContent = world.title;
  }

  async function go(id, first) {
    const p = PRODUCTS.find((x) => x.id === id) || PRODUCTS[0];
    if (busy || (!first && product && p.id === product.id)) return;
    busy = true;
    main.classList.add('sw-switching');
    const photoReady = loadImage(photoOf(p)); // start fetching while the veil falls
    if (!first) { veil.classList.add('show'); await wait(reduce ? 60 : 850); }
    stop();
    product = p;
    try { const q = new URLSearchParams(location.search); q.set('p', p.id); history.replaceState(null, '', `${location.pathname}?${q}${location.hash}`); } catch (_) {}
    document.title = `${p.name} · Scent Worlds — Giberish`;
    if (!first) jumpTop();
    const [ar] = await Promise.all([
      loadImage(p.image, 2500).then((im) => (im && im.naturalWidth ? im.naturalWidth / im.naturalHeight : .6)),
      photoReady,
    ]);
    aspect = ar;
    panelsEl.innerHTML = panelsHTML(p);
    collectPanels();
    build(true);
    measure();
    updateRail();
    if (reduce) staticShades();
    if (window.GibSound) window.GibSound.setTheme(world.sound);
    await wait(40);
    veil.classList.remove('show');
    main.classList.remove('sw-switching');
    busy = false;
    start();
    preload(PRODUCTS[(PRODUCTS.indexOf(p) + 1) % PRODUCTS.length]);
  }
  const step = (n) => go(PRODUCTS[(PRODUCTS.indexOf(product) + n + PRODUCTS.length) % PRODUCTS.length].id);

  /* ============================================================
     Init
     ============================================================ */
  function init() {
    rasterise();
    railList.innerHTML = PRODUCTS.map((p, i) => `
      <button class="sw-rail-item" type="button" data-go="${p.id}" aria-label="${p.name}: ${worldOf(p).title}">
        <span class="th"><img src="${p.image}" alt="" loading="${i < 8 ? 'eager' : 'lazy'}" decoding="async"></span><span class="nm" data-no-i18n>${p.name}</span>
      </button>`).join('');

    if (window.GibSound) window.GibSound.mountToggle($('#sw-tools'), () => (world || worldOf(PRODUCTS[0])).sound);

    document.addEventListener('click', (e) => {
      const g = e.target.closest('[data-go]'), s = e.target.closest('[data-step]');
      if (g) { e.preventDefault(); go(g.dataset.go); }
      else if (s && product) step(Number(s.dataset.step));
    });
    document.addEventListener('keydown', (e) => {
      if (!product || e.altKey || e.metaKey || e.ctrlKey || document.body.classList.contains('no-scroll')) return;
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });

    // explore: mouse look (desktop) and gentle drag-to-pan (touch)
    if (!reduce) {
      window.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'mouse') { cam.tmx = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1); cam.tmy = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1); }
        else if (drag) cam.tmx = clamp(drag.mx - ((e.clientX - drag.x) / window.innerWidth) * 2.2, -1, 1);
      }, { passive: true });
      stage.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' && !e.target.closest('button, a, .sw-rail')) drag = { x: e.clientX, mx: cam.tmx };
      }, { passive: true });
      const end = () => (drag = null);
      window.addEventListener('pointerup', end, { passive: true });
      window.addEventListener('pointercancel', end, { passive: true });
      document.addEventListener('mouseleave', () => { cam.tmx = 0; cam.tmy = 0; });
    }

    // only animate while the stage is on screen and the tab is visible
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(stage);
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    // rebuild for a new stage size (debounced; ignores tiny mobile toolbar jitter)
    let rt = 0, lastW = 0, lastH = 0;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const W = stage.clientWidth, H = stage.clientHeight;
        if (!product || (Math.abs(W - lastW) < 2 && Math.abs(H - lastH) < 60)) { measure(); return; }
        lastW = W; lastH = H;
        build(false); measure();
        if (reduce) staticShades();
      }, 180);
    };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage); else window.addEventListener('resize', onResize);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    try { history.scrollRestoration = 'manual'; } catch (_) {}
    const id = new URLSearchParams(location.search).get('p');
    go(PRODUCTS.some((p) => p.id === id) ? id : PRODUCTS[0].id, true).then(() => { lastW = stage.clientWidth; lastH = stage.clientHeight; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
