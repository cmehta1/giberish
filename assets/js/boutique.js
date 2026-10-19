/* ============================================================
   GIBERISH — The Boutique
   A walkable 3D fragrance showroom (three.js r160, ES module).
   Marble hall · floating plinths · attar shelf · glowing monk.
   Falls back to a 2D luxury gallery when WebGL is missing or the
   visitor prefers reduced motion.
   ============================================================ */

// three.js, pinned. Loaded with a dynamic import so a CDN failure can still
// fall back to the gallery instead of leaving a blank page.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = (s, r = document) => r.querySelector(s);
const PRODUCTS = window.GIB_PRODUCTS || [];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = (n) => (window.gibMoney ? window.gibMoney(n) : '₹' + n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);
const smoothstep = (a, b, v) => smooth(clamp((v - a) / (b - a), 0, 1));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const ZONES = {
  attar:   { num: 'I',   title: 'Attars',       sub: 'The old way' },
  perfume: { num: 'II',  title: 'Perfumes',     sub: 'The modern soul' },
  ritual:  { num: 'III', title: 'Home Rituals', sub: 'Bring the temple home' },
};

// Module scripts run before DOMContentLoaded; common.js builds the header on it.
const domReady = new Promise((res) => {
  if (document.readyState === 'complete') return res();
  document.addEventListener('DOMContentLoaded', () => res(), { once: true });
  window.addEventListener('load', () => res(), { once: true });
});

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (_) { return false; }
}

/* ============================================================
   App shell: 3D boutique  <->  2D gallery
   ============================================================ */
const app = { boutique: null, building: null, galleryBuilt: false, soundMounted: false };

boot();
async function boot() {
  await domReady;
  $('#bq-to-gallery').addEventListener('click', () => showGallery('choice'));
  $('#bq-to-3d').addEventListener('click', () => enterBoutique());
  if (!hasWebGL()) return showGallery('webgl');
  if (reduceMotion) return showGallery('motion');
  enterBoutique();
}

async function enterBoutique() {
  const stage = $('#bq-stage'), gallery = $('#bq-gallery');
  gallery.hidden = true;
  stage.hidden = false;
  document.documentElement.classList.add('bq-lock');
  window.scrollTo(0, 0);
  if (app.boutique) { app.boutique.resume(); return; }
  if (app.building) return;
  $('#bq-loader').classList.remove('done');
  app.building = (async () => {
    let THREE;
    try { THREE = await import(THREE_URL); } catch (e) { console.warn('[boutique] three.js failed to load', e); return showGallery('offline'); }
    try { app.boutique = await buildBoutique(THREE); } catch (e) { console.error('[boutique]', e); showGallery('error'); }
  })();
  await app.building;
  app.building = null;
}

function showGallery(reason) {
  if (app.boutique) app.boutique.pause();
  const stage = $('#bq-stage'), gallery = $('#bq-gallery'), loader = $('#bq-loader');
  stage.hidden = true;
  loader.classList.add('done');
  gallery.hidden = false;
  document.documentElement.classList.remove('bq-lock');
  window.scrollTo(0, 0);

  const notes = {
    motion: 'Your device prefers less motion, so the boutique opens as a still gallery. Tap any bottle to feel it.',
    webgl: 'Your browser can’t open our 3D boutique, so here is every bottle, quietly laid out. Tap any one to feel it.',
    offline: 'The 3D boutique couldn’t load just now, so here is every bottle, quietly laid out.',
    error: 'The 3D boutique couldn’t open on this device, so here is every bottle, quietly laid out.',
    choice: 'Every bottle in our boutique, quietly laid out. Tap any one to feel it.',
  };
  $('#bq-gallery-note').textContent = notes[reason] || notes.choice;
  // offer the walk-through whenever the device can actually run it
  $('#bq-to-3d').hidden = !hasWebGL() || reason === 'offline' || reason === 'error';
  $('#bq-to-3d').textContent = reason === 'motion' ? 'Walk the boutique anyway' : 'Walk the boutique';

  if (!app.galleryBuilt) {
    app.galleryBuilt = true;
    const wrap = $('#bq-gallery-zones');
    wrap.innerHTML = Object.entries(ZONES).map(([type, z]) => {
      const items = PRODUCTS.filter((p) => p.type === type);
      if (!items.length) return '';
      return `
        <section class="chapter">
          <div class="chapter-head">
            <div class="chapter-num">${z.num}</div>
            <div><span class="eyebrow">${z.sub}</span><h2 class="h-1" style="margin-top:10px">${z.title}</h2></div>
          </div>
          <div class="grid">${items.map((p) => window.gibCard(p, { story: true })).join('')}</div>
        </section>`;
    }).join('');
    if (window.GibSound) window.GibSound.mountToggle($('#bq-gallery-sound'), 'temple');
  }
}

/* ============================================================
   The 3D boutique
   ============================================================ */
async function buildBoutique(THREE) {
  const stage = $('#bq-stage');
  const loader = $('#bq-loader');
  const progressEl = $('#bq-progress');
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const lowPower = isCoarse || Math.min(screen.width, screen.height) < 700;

  /* ---------- Fonts first, so canvas text renders in brand type ---------- */
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('italic 300 80px "Cormorant Garamond"'),
        document.fonts.load('400 80px "Cormorant Garamond"'),
        document.fonts.load('400 30px "Jost"'),
      ]),
      wait(2500),
    ]);
  } catch (_) { /* system fonts are fine */ }

  /* ---------- Renderer / scene / camera ---------- */
  // MSAA is close to free on phone (tile-based) GPUs, and the thin gold lines need it
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  // crisp: up to 2x on desktop, 1.5x on phones (auto-lowered below if frames drop)
  let pixelRatio = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x050302, 1);
  const canvas = renderer.domElement;
  canvas.className = 'bq-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'A dark marble boutique hall with floating, softly lit fragrance displays and a glowing monk emblem on the far wall.');
  canvas.tabIndex = -1;
  stage.prepend(canvas);
  const aniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const FOG = 0x0a0604;
  scene.fog = new THREE.FogExp2(FOG, 0.022); // light haze: only the far end softens
  const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 90);
  camera.rotation.order = 'YXZ';

  const manager = new THREE.LoadingManager();
  const texLoader = new THREE.TextureLoader(manager);
  manager.onProgress = (_, loaded, total) => { progressEl.style.transform = `scaleX(${loaded / total})`; };
  const allLoaded = new Promise((res) => { manager.onLoad = res; });

  /* ---------- Room layout ---------- */
  const ROOM = { halfW: 8, front: 6, back: -32, h: 7.5 };
  const BOUNDS = { x: 6.2, zMax: 4.8, zMin: -30.2 };
  const SHELF = { x: -7.6, z: -14, w: 6.9, y: 1.06, gap: 0.95 };

  // Plinth positions: attars stagger down the first bay, perfumes the second,
  // the home ritual sits alone before the monk.
  const byType = (t) => PRODUCTS.filter((p) => p.type === t);
  const layout = [];
  byType('attar').forEach((p, i) => layout.push({ p, x: (i % 2 ? 1 : -1) * 3.4, z: -3 - i * 1.25 }));
  byType('perfume').forEach((p, i) => layout.push({ p, x: (i % 2 ? -1 : 1) * 3.4, z: -19 - i * 1.25 }));
  const rituals = byType('ritual');
  rituals.forEach((p, i) => layout.push({ p, x: rituals.length === 1 ? 0 : (i - (rituals.length - 1) / 2) * 2.6, z: -27.5 }));

  /* ============================================================
     Procedural textures (canvas)
     ============================================================ */
  const rand = mulberry(7);
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function canvasTex(w, h, draw, opts = {}) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
    return t;
  }
  // a wandering vein, with occasional branches
  let VK = 1; // vein scale: 1 at 512px per tile
  function vein(g, x, y, ang, len, width, depth) {
    g.beginPath(); g.moveTo(x, y);
    const step = 6 * VK;
    width *= VK;
    for (let i = 0; i < len; i++) {
      ang += (rand() - 0.5) * 0.55;
      x += Math.cos(ang) * step; y += Math.sin(ang) * step;
      g.lineTo(x, y);
      if (depth < 2 && rand() < 0.025) { g.lineWidth = width; g.stroke(); vein(g, x, y, ang + (rand() - 0.5) * 1.8, len * 0.45, (width / VK) * 0.6, depth + 1); g.beginPath(); g.moveTo(x, y); }
    }
    g.lineWidth = width; g.stroke();
  }
  function marbleTile(g, x0, y0, S, dark) {
    g.save();
    VK = S / 512;
    g.beginPath(); g.rect(x0, y0, S, S); g.clip();
    // base + cloudy depth. Alpha < 1 lets the mirrored scene below the floor show through.
    g.fillStyle = dark ? 'rgba(12,9,7,0.72)' : 'rgba(112,98,80,0.9)';
    g.fillRect(x0, y0, S, S);
    for (let i = 0; i < 26; i++) {
      const cx = x0 + rand() * S, cy = y0 + rand() * S, r = S * (0.15 + rand() * 0.5);
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      const c = dark ? `rgba(40,30,22,${0.08 + rand() * 0.1})` : `rgba(${rand() < 0.5 ? '120,104,84' : '64,52,40'},${0.12 + rand() * 0.14})`;
      gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x0, y0, S, S);
    }
    g.lineCap = 'round'; g.lineJoin = 'round';
    // faint wide veins
    g.strokeStyle = dark ? 'rgba(120,96,60,0.18)' : 'rgba(40,30,22,0.22)';
    for (let i = 0; i < 4; i++) vein(g, x0 + rand() * S, y0 + rand() * S, rand() * 6.28, 70, 5, 1);
    // fine gold veins with a little glow
    g.shadowColor = 'rgba(242,200,130,0.45)'; g.shadowBlur = dark ? 2.5 : 1; // a hint of glow, kept sharp
    g.strokeStyle = dark ? 'rgba(214,180,120,0.5)' : 'rgba(150,118,70,0.45)';
    for (let i = 0; i < (dark ? 4 : 2); i++) vein(g, x0 + rand() * S, y0 + rand() * S, rand() * 6.28, 80, 0.9 + rand() * 1.0, 0);
    g.shadowBlur = 0;
    g.strokeStyle = dark ? 'rgba(236,220,190,0.12)' : 'rgba(240,228,206,0.25)';
    for (let i = 0; i < 6; i++) vein(g, x0 + rand() * S, y0 + rand() * S, rand() * 6.28, 50, 0.8, 1);
    g.restore();
  }
  // 2x2 tiles: black marble / cream marble, gold grout
  const floorTex = canvasTex(2048, 2048, (g, W) => {
    g.clearRect(0, 0, W, W);
    const S = W / 2;
    marbleTile(g, 0, 0, S, true); marbleTile(g, S, 0, S, false);
    marbleTile(g, 0, S, S, false); marbleTile(g, S, S, S, true);
    g.strokeStyle = 'rgba(190,148,76,0.6)'; g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, W - 3, W - 3);
    g.beginPath(); g.moveTo(S, 0); g.lineTo(S, W); g.moveTo(0, S); g.lineTo(W, S); g.stroke();
  }, { repeat: [ROOM.halfW * 2 / 4, (ROOM.front - ROOM.back) / 4] });

  const stoneTex = canvasTex(512, 512, (g, W) => { marbleTile(g, 0, 0, W, true); g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#0c0907'; g.fillRect(0, 0, W, W); }, { repeat: [1, 3] });

  // walls: dark lacquer with a gold dado rail and cornice line
  const wallTex = canvasTex(512, 1024, (g, W, H) => {
    const gr = g.createLinearGradient(0, H, 0, 0);
    gr.addColorStop(0, '#2a1c12'); gr.addColorStop(0.35, '#1a110b'); gr.addColorStop(1, '#0a0605');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(255,220,170,${rand() * 0.025})`; g.fillRect(rand() * W, rand() * H, 1, 2 + rand() * 6); }
    const line = (v, w, a) => { g.fillStyle = `rgba(212,169,87,${a})`; g.fillRect(0, H * (1 - v), W, w); };
    line(1.0 / ROOM.h, 3, 0.75); line(1.06 / ROOM.h, 1, 0.4); line(6.3 / ROOM.h, 3, 0.55); line(6.36 / ROOM.h, 1, 0.3);
  }, { repeat: [(ROOM.front - ROOM.back) / 4, 1] });

  // alcove backs: warm uplight from the floor
  const nicheTex = canvasTex(256, 512, (g, W, H) => {
    g.fillStyle = '#0d0806'; g.fillRect(0, 0, W, H);
    let gr = g.createRadialGradient(W / 2, H * 1.02, 0, W / 2, H * 1.02, H * 0.8);
    gr.addColorStop(0, 'rgba(255,190,110,0.55)'); gr.addColorStop(0.35, 'rgba(190,120,60,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.45);
    gr.addColorStop(0, 'rgba(255,210,150,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let x = 18; x < W; x += 22) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, 0, 2, H); }
  });

  // soft radial glow, shared by every additive sprite
  const glowTex = canvasTex(256, 256, (g, W) => {
    const gr = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
    gr.addColorStop(0, 'rgba(255,240,205,1)'); gr.addColorStop(0.18, 'rgba(255,205,130,0.55)');
    gr.addColorStop(0.45, 'rgba(220,150,70,0.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, W);
  });
  // thin glowing ring, for plinth rims
  const ringTex = canvasTex(256, 256, (g, W) => {
    const gr = g.createRadialGradient(W / 2, W / 2, W * 0.28, W / 2, W / 2, W / 2);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.45, 'rgba(255,214,140,0.9)'); gr.addColorStop(0.55, 'rgba(255,200,120,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, W);
  });

  // brand text on canvas: spaced caps + serif title
  function spaced(g, text, x, y, spacing) {
    const chars = [...text];
    const w = chars.reduce((a, ch) => a + g.measureText(ch).width, 0) + spacing * (chars.length - 1);
    let cx = x - w / 2;
    g.textAlign = 'left';
    for (const ch of chars) { g.fillText(ch, cx, y); cx += g.measureText(ch).width + spacing; }
  }
  function goldFill(g, y0, y1) {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, '#fff1c8'); gr.addColorStop(0.5, '#f2d59b'); gr.addColorStop(1, '#c99a4a');
    return gr;
  }
  // WebGL text doesn't pass through the DOM translator, so look titles up ourselves
  const tr = (en) => { try { return ((window.GIB_I18N || {})[window.GibI18n && window.GibI18n.lang] || {})[en] || en; } catch (_) { return en; } };
  const INDIC = '"Noto Serif Devanagari", "Noto Serif Gujarati"';
  function zoneTitleTex(z) {
    return canvasTex(1024, 300, (g, W) => {
      g.textBaseline = 'alphabetic';
      g.font = `400 26px Jost, ${INDIC}, sans-serif`; g.fillStyle = 'rgba(212,169,87,0.95)';
      const sub = tr(z.sub), title = tr(z.title);
      // letter-spacing by hand only for Latin; Indic scripts must stay shaped
      if (/^[\x00-\x7F·]*$/.test(sub)) spaced(g, `${z.num}  ·  ${sub.toUpperCase()}`, W / 2, 62, 9);
      else { g.textAlign = 'center'; g.fillText(`${z.num}  ·  ${sub}`, W / 2, 62); }
      g.font = `italic 300 132px "Cormorant Garamond", ${INDIC}, serif`;
      g.textAlign = 'center';
      g.shadowColor = 'rgba(242,190,110,0.55)'; g.shadowBlur = 28;
      g.fillStyle = goldFill(g, 100, 220);
      g.fillText(title, W / 2, 196, W - 40);
      g.shadowBlur = 0;
      // ornament: line · diamond · line
      g.strokeStyle = 'rgba(212,169,87,0.7)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(W / 2 - 150, 252); g.lineTo(W / 2 - 18, 252); g.moveTo(W / 2 + 18, 252); g.lineTo(W / 2 + 150, 252); g.stroke();
      g.save(); g.translate(W / 2, 252); g.rotate(Math.PI / 4); g.strokeRect(-6, -6, 12, 12); g.restore();
    });
  }
  function plaqueTex(p) {
    return canvasTex(640, 180, (g, W) => {
      g.textBaseline = 'alphabetic';
      g.font = '400 22px Jost, sans-serif'; g.fillStyle = 'rgba(212,169,87,0.95)';
      spaced(g, p.house.toUpperCase(), W / 2, 48, 6);
      g.font = '400 66px "Cormorant Garamond", serif'; g.textAlign = 'center';
      g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 10;
      g.fillStyle = '#f4e6c8';
      let size = 66;
      while (g.measureText(p.name).width > W - 40 && size > 30) { size -= 4; g.font = `400 ${size}px "Cormorant Garamond", serif`; }
      g.fillText(p.name, W / 2, 118);
      g.shadowBlur = 0;
      g.font = 'italic 300 30px "Cormorant Garamond", serif'; g.fillStyle = 'rgba(242,213,155,0.85)';
      g.fillText(p.price != null ? money(p.price) : 'By invitation', W / 2, 162);
    });
  }

  /* ============================================================
     Materials (shared)
     ============================================================ */
  const M = {
    floor: new THREE.MeshStandardMaterial({ map: floorTex, transparent: true, roughness: 0.33, metalness: 0.1, color: 0xffffff }),
    wall: new THREE.MeshLambertMaterial({ map: wallTex }),
    ceiling: new THREE.MeshLambertMaterial({ color: 0x0b0705 }),
    stone: new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.35, metalness: 0.1 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc99a4a, roughness: 0.32, metalness: 0.75, emissive: 0x4a2c0c }),
    goldGlow: new THREE.MeshBasicMaterial({ color: 0xf2d59b, toneMapped: false }),
    goldDim: new THREE.MeshBasicMaterial({ color: 0x9a7436, toneMapped: false }),
    niche: new THREE.MeshBasicMaterial({ map: nicheTex }),
    mirrorStone: new THREE.MeshBasicMaterial({ color: 0x1a120c }),
    mirrorGold: new THREE.MeshBasicMaterial({ color: 0x8a6a32, toneMapped: false }),
  };
  const additive = (map, color = 0xffd9a0, opacity = 1) => new THREE.MeshBasicMaterial({
    map, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false,
  });

  // volumetric light cone: fades at the edges (fresnel) and toward the floor
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0xffc98a) }, uOpacity: { value: 0.16 } },
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; varying float vFog;
      void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vFog = exp(-length(mv.xyz) * 0.045);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vY; varying vec3 vN; varying vec3 vV; varying float vFog;
      void main(){ float f = pow(abs(dot(vN, vV)), 2.0); float h = smoothstep(0.0, 0.18, vY) * (0.3 + 0.7 * vY);
        gl_FragColor = vec4(uColor * f * h * uOpacity * vFog, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });

  /* ============================================================
     Architecture
     ============================================================ */
  const roomLen = ROOM.front - ROOM.back, roomMidZ = (ROOM.front + ROOM.back) / 2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfW * 2, roomLen), M.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.z = roomMidZ; floor.renderOrder = -5;
  scene.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfW * 2, roomLen), M.ceiling);
  ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, ROOM.h, roomMidZ);
  scene.add(ceiling);

  const wallGeo = new THREE.PlaneGeometry(roomLen, ROOM.h);
  [-1, 1].forEach((side) => {
    const w = new THREE.Mesh(wallGeo, M.wall);
    w.position.set(side * ROOM.halfW, ROOM.h / 2, roomMidZ);
    w.rotation.y = -side * Math.PI / 2;
    scene.add(w);
  });
  const endGeo = new THREE.PlaneGeometry(ROOM.halfW * 2, ROOM.h);
  const endTex = wallTex.clone(); endTex.repeat.set(4, 1); endTex.needsUpdate = true;
  const endMat = new THREE.MeshLambertMaterial({ map: endTex });
  const backWall = new THREE.Mesh(endGeo, endMat); backWall.position.set(0, ROOM.h / 2, ROOM.back); scene.add(backWall);
  const frontWall = new THREE.Mesh(endGeo, endMat); frontWall.position.set(0, ROOM.h / 2, ROOM.front); frontWall.rotation.y = Math.PI; scene.add(frontWall);

  // gold inlay lines guiding the aisle + a medallion at the entrance
  [-1.35, 1.35].forEach((x) => {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.028, roomLen - 3), M.goldDim);
    l.rotation.x = -Math.PI / 2; l.position.set(x, 0.004, roomMidZ - 1.5); scene.add(l);
  });
  [[0.9, 0.93], [1.05, 1.07]].forEach(([a, b]) => {
    const r = new THREE.Mesh(new THREE.RingGeometry(a, b, 64), M.goldDim);
    r.rotation.x = -Math.PI / 2; r.position.set(0, 0.005, 2.2); scene.add(r);
  });

  // ---- arch geometry (used for alcoves, the shelf and the back wall) ----
  function archShape(w, straight, base = 0) {
    const r = w / 2, s = new THREE.Shape();
    s.moveTo(-r, base); s.lineTo(-r, base + straight); s.absarc(0, base + straight, r, Math.PI, 0, true); s.lineTo(r, base); s.lineTo(-r, base);
    return s;
  }
  function shapeGeoUV(shape, segs = 32) {
    const geo = new THREE.ShapeGeometry(shape, segs);
    geo.computeBoundingBox();
    const bb = geo.boundingBox, pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
    return geo;
  }
  function archTrimGeo(w, straight, tube) {
    const r = w / 2, pts = [];
    for (let i = 0; i <= 6; i++) pts.push(new THREE.Vector3(-r, (straight * i) / 6, 0));
    for (let i = 1; i < 24; i++) { const a = Math.PI - (Math.PI * i) / 24; pts.push(new THREE.Vector3(Math.cos(a) * r, straight + Math.sin(a) * r, 0)); }
    for (let i = 6; i >= 0; i--) pts.push(new THREE.Vector3(r, (straight * i) / 6, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 90, tube, 6, false);
  }

  // side alcoves (instanced): niche panel + gold arch trim; columns between bays
  const ARCH = { w: 2.5, straight: 2.9, base: 0.35 };
  const nicheGeo = shapeGeoUV(archShape(ARCH.w, ARCH.straight));
  const trimGeo = archTrimGeo(ARCH.w + 0.12, ARCH.straight, 0.028);
  const alcoves = [];
  for (let z = 0; z >= -28; z -= 4) {
    [-1, 1].forEach((side) => {
      if (side < 0 && (z === -12 || z === -16)) return; // the attar shelf lives here
      alcoves.push({ x: side * (ROOM.halfW - 0.02), z, rot: -side * Math.PI / 2 });
    });
  }
  const nicheInst = new THREE.InstancedMesh(nicheGeo, M.niche, alcoves.length);
  const trimInst = new THREE.InstancedMesh(trimGeo, M.goldDim, alcoves.length);
  const tmp = new THREE.Object3D();
  alcoves.forEach((a, i) => {
    tmp.position.set(a.x, ARCH.base, a.z); tmp.rotation.set(0, a.rot, 0); tmp.scale.set(1, 1, 1); tmp.updateMatrix();
    nicheInst.setMatrixAt(i, tmp.matrix);
    tmp.position.x = a.x - Math.sign(a.x) * 0.02; tmp.updateMatrix();
    trimInst.setMatrixAt(i, tmp.matrix);
  });
  scene.add(nicheInst, trimInst);

  const columns = [];
  for (let z = 2; z >= -30; z -= 4) [-1, 1].forEach((side) => { if (!(side < 0 && z === -14)) columns.push({ x: side * 7.35, z }); });
  const colGeo = new THREE.CylinderGeometry(0.26, 0.3, ROOM.h, lowPower ? 14 : 20, 1, true);
  const colInst = new THREE.InstancedMesh(colGeo, M.stone, columns.length);
  const bandGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.12, lowPower ? 14 : 20);
  const bandYs = [0.06, 0.3, 5.9, 6.25];
  const bandInst = new THREE.InstancedMesh(bandGeo, M.gold, columns.length * bandYs.length);
  columns.forEach((c, i) => {
    tmp.rotation.set(0, 0, 0);
    tmp.position.set(c.x, ROOM.h / 2, c.z); tmp.updateMatrix(); colInst.setMatrixAt(i, tmp.matrix);
    bandYs.forEach((y, j) => {
      const s = j === 1 || j === 2 ? 0.86 : 1;
      tmp.position.set(c.x, y, c.z); tmp.scale.set(s, 1, s); tmp.updateMatrix(); bandInst.setMatrixAt(i * bandYs.length + j, tmp.matrix);
      tmp.scale.set(1, 1, 1);
    });
  });
  scene.add(colInst, bandInst);

  /* ---------- Lights: warm, low, few (cheap on phones) ---------- */
  scene.add(new THREE.HemisphereLight(0xffe0b0, 0x140b06, 0.55));
  const lampZ = lowPower ? [-2, -14, -25] : [1, -7, -15, -23];
  lampZ.forEach((z) => {
    const l = new THREE.PointLight(0xffc583, lowPower ? 34 : 26, 22, 1.7);
    l.position.set(0, 5.4, z); scene.add(l);
  });
  const monkLight = new THREE.PointLight(0xffa850, 30, 16, 1.6);
  monkLight.position.set(0, 3.6, -29.6); scene.add(monkLight);

  /* ============================================================
     The monk emblem on the back wall
     ============================================================ */
  const emblem = new THREE.Group();
  emblem.position.set(0, 0, ROOM.back + 0.06);
  scene.add(emblem);
  const BIG = { w: 6.4, straight: 3.4, base: 0.35 };
  const bigNiche = new THREE.Mesh(shapeGeoUV(archShape(BIG.w, BIG.straight)), M.niche);
  bigNiche.position.y = BIG.base; emblem.add(bigNiche);
  const bigTrim = new THREE.Mesh(archTrimGeo(BIG.w + 0.16, BIG.straight, 0.04), M.goldGlow);
  bigTrim.position.set(0, BIG.base, 0.02); emblem.add(bigTrim);
  const bigTrim2 = new THREE.Mesh(archTrimGeo(BIG.w + 0.5, BIG.straight, 0.015), M.goldDim);
  bigTrim2.position.set(0, BIG.base, 0.02); emblem.add(bigTrim2);

  const EMB_Y = 4.05;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), additive(glowTex, 0xffc77a, 1));
  halo.position.set(0, EMB_Y, 0.1); emblem.add(halo);
  const core = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), additive(glowTex, 0xfff0c8, 1));
  core.position.set(0, EMB_Y + 0.15, 0.12); emblem.add(core);
  // turning arcs, like the hero rings
  const arcs = [];
  [[2.15, 0.012, Math.PI * 1.25, 0.06], [2.5, 0.008, Math.PI * 0.9, -0.04], [2.85, 0.006, Math.PI * 1.5, 0.025]].forEach(([r, t, arc, spd]) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 6, 96, arc), M.goldGlow);
    m.position.set(0, EMB_Y, 0.16); m.userData.spd = spd; emblem.add(m); arcs.push(m);
  });
  const monkGroup = new THREE.Group();
  monkGroup.position.set(0, EMB_Y - 1.4, 0.2);
  emblem.add(monkGroup);
  let monk = null;
  // the monk: silhouette with a gold rim glow, baked into a canvas
  const monkImg = new Image();
  manager.itemStart('monk');
  monkImg.onload = () => {
    const pad = 90, W = monkImg.width + pad * 2, H = monkImg.height + pad * 2;
    const tex = canvasTex(W, H, (g) => {
      g.shadowColor = 'rgba(255,200,110,1)';
      g.shadowBlur = 60; g.drawImage(monkImg, pad, pad);
      g.shadowBlur = 14; g.drawImage(monkImg, pad, pad);
      g.shadowColor = 'rgba(255,236,190,1)'; g.shadowBlur = 3; g.drawImage(monkImg, pad, pad);
      g.shadowBlur = 0; g.drawImage(monkImg, pad, pad);
    });
    const w = 3.3 * (W / monkImg.width), h = w * (H / W);
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2 - pad * (w / W), 0);
    monk = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
    monkGroup.add(monk);
    const mm = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false, color: 0x8a7050 }));
    mm.scale.y = -1; mm.position.set(0, -2 * monkGroup.position.y, 0); mm.renderOrder = -10;
    monkGroup.add(mm);
    manager.itemEnd('monk');
  };
  monkImg.onerror = () => manager.itemEnd('monk');
  monkImg.src = 'assets/img/buddha-sil.png';
  // gold seat line + its reflection
  const seat = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.5), additive(glowTex, 0xffd38a, 0.9));
  seat.scale.y = 0.18; seat.position.set(0, EMB_Y - 1.42, 0.24); emblem.add(seat);
  // reflected halo below the floor + a warm pool in front of the wall
  const haloMirror = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 8.5), additive(glowTex, 0xc98a40, 0.35));
  haloMirror.position.set(0, -EMB_Y, 0.1); haloMirror.renderOrder = -10; emblem.add(haloMirror);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), additive(glowTex, 0xffb060, 0.28));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.012, 1.8); emblem.add(pool);

  /* ============================================================
     Displays: floating plinths
     ============================================================ */
  const displays = [];   // every interactive item (plinths + shelf)
  const hitMeshes = [];
  const billboards = []; // { obj, fade? } — turn to face the camera every frame
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const discGeo = new THREE.CylinderGeometry(0.56, 0.5, 0.13, lowPower ? 32 : 48);
  const rimGeo = new THREE.TorusGeometry(0.565, 0.012, 6, lowPower ? 48 : 72);
  const haloRingGeo = new THREE.TorusGeometry(0.42, 0.006, 6, 64);
  const floorRingGeo = new THREE.RingGeometry(0.74, 0.785, 72);
  const beamGeo = new THREE.CylinderGeometry(0.12, 0.85, 4.5, 24, 1, true);
  const fixtureGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.08, 20);
  const plane1 = new THREE.PlaneGeometry(1, 1);

  function bottleSize(tex, maxH, maxW) {
    const img = tex.image, a = img && img.width ? img.width / img.height : 0.6;
    let h = maxH, w = h * a;
    if (w > maxW) { w = maxW; h = w / a; }
    return [w, h];
  }
  /* Bottles: real 3D glass & metal (GibBottle3D), with the HD photo cut-out kept as
     a fallback. Modes: 'high' = transmission glass, 'low' = env-reflection glass,
     'photo' = flat cut-outs (no WebGL2, or a device that can't keep up). */
  const B3 = window.GibBottle3D;
  let bottleMode = !B3 || !renderer.capabilities.isWebGL2 ? 'photo' : lowPower ? 'low' : 'high';
  // QA: boutique.html?bottles=high|low|photo pins the bottle quality (no auto step-down)
  const pinnedMode = (new URLSearchParams(location.search).get('bottles') || '').toLowerCase();
  if (B3 && ['high', 'low', 'photo'].includes(pinnedMode)) bottleMode = pinnedMode;
  const bottleEnv = bottleMode !== 'photo' ? B3.envMap(THREE, renderer) : null;
  const bottleReady = [];
  function makeBottle(p, maxH, maxW, h3) {
    const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, color: 0xe6e0d6, opacity: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    const mirMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, color: 0x7a6a58, opacity: 0 });
    const mirror = new THREE.Mesh(geo, mirMat); mirror.renderOrder = -10;
    texLoader.load(p.image, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso;
      const [w, h] = bottleSize(tex, maxH, maxW);
      mesh.scale.set(w, h, 1); mirror.scale.set(w, -h, 1);
      mat.map = tex; mat.opacity = 1; mat.needsUpdate = true;
      mirMat.map = tex; mirMat.opacity = 0.75; mirMat.needsUpdate = true;
      mesh.userData.h = h;
    });
    mesh.userData.h = maxH;
    let b3 = null;
    if (bottleMode !== 'photo') {
      b3 = B3.create(THREE, p, { renderer, envMap: bottleEnv, height: h3, quality: bottleMode });
      bottleReady.push(b3.userData.ready);
      mesh.visible = false;
    }
    return { mesh, mirror, mat, b3 };
  }
  function setBottleMode(mode) {
    if (mode === bottleMode) return;
    bottleMode = mode;
    displays.forEach((d) => {
      if (!d.b3) return;
      if (mode === 'photo') { d.b3.visible = false; d.bottle.visible = true; }
      else { B3.setQuality(d.b3, mode); d.b3.visible = true; d.bottle.visible = false; }
    });
  }

  layout.forEach((L, idx) => {
    const p = L.p, zone = ZONES[p.type];
    const g = new THREE.Group(); g.position.set(L.x, 0, L.z); scene.add(g);
    // floor: gold ring + warm light pool
    const fr = new THREE.Mesh(floorRingGeo, M.goldDim); fr.rotation.x = -Math.PI / 2; fr.position.y = 0.006; g.add(fr);
    const poolMat = additive(glowTex, 0xffc078, 0.32);
    const fpool = new THREE.Mesh(plane1, poolMat); fpool.rotation.x = -Math.PI / 2; fpool.scale.set(3, 3, 1); fpool.position.y = 0.014; g.add(fpool);
    // spotlight fixture + beam
    const fx = new THREE.Mesh(fixtureGeo, M.gold); fx.position.y = 5.75; g.add(fx);
    const fxGlow = new THREE.Mesh(plane1, additive(glowTex, 0xfff0c8, 0.9)); fxGlow.rotation.x = Math.PI / 2; fxGlow.scale.set(0.9, 0.9, 1); fxGlow.position.y = 5.7; g.add(fxGlow);
    const beam = new THREE.Mesh(beamGeo, beamMat.clone()); beam.position.y = 5.7 - 2.25; g.add(beam);

    // floating platform
    const float = new THREE.Group(); float.position.y = 0.9; g.add(float);
    const disc = new THREE.Mesh(discGeo, M.stone); float.add(disc);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0xf2d59b, toneMapped: false, transparent: true, opacity: 0.9 });
    const rim = new THREE.Mesh(rimGeo, rimMat); rim.rotation.x = Math.PI / 2; rim.position.y = 0.065; float.add(rim);
    const rimAura = new THREE.Mesh(plane1, additive(ringTex, 0xffcf88, 0.55)); rimAura.rotation.x = -Math.PI / 2; rimAura.scale.set(1.75, 1.75, 1); rimAura.position.y = 0.06; float.add(rimAura);
    const under = new THREE.Mesh(plane1, additive(glowTex, 0xffb768, 0.5)); under.rotation.x = Math.PI / 2; under.scale.set(1.6, 1.6, 1); under.position.y = -0.08; float.add(under);
    const topGlow = new THREE.Mesh(plane1, additive(glowTex, 0xffe2b0, 0.55)); topGlow.rotation.x = -Math.PI / 2; topGlow.scale.set(1.15, 1.15, 1); topGlow.position.y = 0.07; float.add(topGlow);

    // the bottle (billboard) + aura + spinning halo ring
    const pivot = new THREE.Group(); pivot.position.y = 0.075; float.add(pivot);
    // the aura sits behind the bottle (relative to the visitor), positioned every frame
    const aura = new THREE.Mesh(plane1, additive(glowTex, 0xffcf8a, 0.35)); aura.scale.set(1.9, 1.9, 1); aura.position.y = 0.6; float.add(aura);
    const b = makeBottle(p, p.type === 'attar' ? 0.88 : 1.0, 0.82, p.type === 'attar' ? 0.8 : p.type === 'ritual' ? 0.82 : 0.95);
    pivot.add(b.mesh); if (b.b3) pivot.add(b.b3);
    const haloRing = new THREE.Mesh(haloRingGeo, new THREE.MeshBasicMaterial({ color: 0xf2d59b, toneMapped: false, transparent: true, opacity: 0 }));
    haloRing.position.y = 0.45; float.add(haloRing);

    // mirrored copies under the floor (cheap reflection)
    const mDisc = new THREE.Mesh(discGeo, M.mirrorStone); mDisc.position.y = -0.9; g.add(mDisc);
    const mRim = new THREE.Mesh(rimGeo, M.mirrorGold); mRim.rotation.x = Math.PI / 2; g.add(mRim);
    const mPivot = new THREE.Group(); g.add(mPivot); mPivot.add(b.mirror);

    // name plaque, under the platform
    const plaque = new THREE.Mesh(plane1, new THREE.MeshBasicMaterial({ map: plaqueTex(p), transparent: true, depthWrite: false, toneMapped: false, fog: false }));
    plaque.scale.set(1.15, 1.15 * 180 / 640, 1); plaque.position.y = 0.42; g.add(plaque);
    billboards.push({ obj: plaque, near: 1.2, far: 10 });

    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 1.2), hitMat); hit.position.y = 1.35; g.add(hit);
    const item = {
      kind: 'plinth', p, zone, group: g, float, pivot, bottle: b.mesh, bottleMat: b.mat, b3: b.b3, faceYaw: null, spin: 0, spinT: 0, mirror: b.mirror, mPivot, mDisc, mRim,
      rimMat, rimAura, topGlow, aura, under, haloRing, beam, poolMat,
      phase: idx * 1.37, hl: 0, world: new THREE.Vector3(L.x, 1.45, L.z), stop: -1,
    };
    hit.userData.item = item; hitMeshes.push(hit);
    displays.push(item);
  });

  /* ============================================================
     The interactive attar shelf (left wall)
     ============================================================ */
  const shelf = new THREE.Group();
  shelf.position.set(SHELF.x, 0, SHELF.z);
  shelf.rotation.y = Math.PI / 2; // local +z faces into the room (+x)
  scene.add(shelf);
  const attars = byType('attar');
  const shelfW = SHELF.w;
  const shelfBackTex = canvasTex(1024, 512, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#0b0705'); gr.addColorStop(0.6, '#1d130b'); gr.addColorStop(1, '#2a1a0e');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    attars.forEach((_, i) => {
      const x = ((i + 0.5) / attars.length) * W, y = H * 0.62;
      const rg = g.createRadialGradient(x, y, 0, x, y, 120);
      rg.addColorStop(0, 'rgba(255,200,130,0.55)'); rg.addColorStop(0.5, 'rgba(200,130,60,0.16)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
    });
    for (let x = 0; x < W; x += 16) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, 0, 1, H); }
  });
  const sb = new THREE.Mesh(new THREE.PlaneGeometry(shelfW, 3.3), new THREE.MeshBasicMaterial({ map: shelfBackTex }));
  sb.position.set(0, 0.45 + 1.65, -0.3); shelf.add(sb);
  // gold frame
  const frameBar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), M.gold); m.position.set(x, y, -0.27); shelf.add(m); };
  frameBar(shelfW + 0.16, 0.08, 0, 3.8); frameBar(shelfW + 0.16, 0.08, 0, 0.42);
  frameBar(0.08, 3.46, -shelfW / 2 - 0.04, 2.1); frameBar(0.08, 3.46, shelfW / 2 + 0.04, 2.1);
  // the shelf board: stone with a gold lip, and its glowing underside
  const board = new THREE.Mesh(new THREE.BoxGeometry(shelfW, 0.06, 0.62), M.stone); board.position.set(0, SHELF.y - 0.03, 0); shelf.add(board);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(shelfW, 0.025, 0.02), M.goldGlow); lip.position.set(0, SHELF.y - 0.005, 0.31); shelf.add(lip);
  const underLight = new THREE.Mesh(plane1, additive(glowTex, 0xffb768, 0.5)); underLight.scale.set(shelfW * 1.05, 0.9, 1); underLight.position.set(0, SHELF.y - 0.4, -0.26); shelf.add(underLight);
  // name strip under the shelf
  const stripTex = canvasTex(2048, 96, (g, W, H) => {
    g.fillStyle = 'rgba(8,5,3,0.85)'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(212,169,87,0.8)'; g.fillRect(0, 0, W, 2); g.fillRect(0, H - 2, W, 2);
    g.font = 'italic 400 44px "Cormorant Garamond", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const cell = W / attars.length - 26;
    attars.forEach((p, i) => {
      let size = 44;
      g.font = `italic 400 ${size}px "Cormorant Garamond", serif`;
      while (g.measureText(p.name).width > cell && size > 24) { size -= 2; g.font = `italic 400 ${size}px "Cormorant Garamond", serif`; }
      g.fillStyle = '#f2d59b'; g.fillText(p.name, ((i + 0.5) / attars.length) * W, H / 2 + 2);
      if (i) { g.fillStyle = 'rgba(212,169,87,0.35)'; g.fillRect((i / attars.length) * W, 22, 1, H - 44); }
    });
  });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(shelfW, shelfW * 96 / 2048), new THREE.MeshBasicMaterial({ map: stripTex, toneMapped: false }));
  strip.position.set(0, SHELF.y - 0.2, 0.3); shelf.add(strip);
  // shelf title, on the wall above
  const SHELF_ZONE = { num: 'I', sub: 'Side by side', title: 'The Attar Shelf' };
  const shelfTitle = new THREE.Mesh(plane1, new THREE.MeshBasicMaterial({ map: zoneTitleTex(SHELF_ZONE), transparent: true, depthWrite: false, toneMapped: false, fog: false }));
  shelfTitle.userData.zone = SHELF_ZONE;
  shelfTitle.scale.set(2.9, 2.9 * 300 / 1024, 1); shelfTitle.position.set(0, 4.45, -0.25); shelf.add(shelfTitle);

  attars.forEach((p, i) => {
    const zx = (i - (attars.length - 1) / 2) * (shelfW / attars.length);
    const holder = new THREE.Group(); holder.position.set(zx, SHELF.y, 0); shelf.add(holder);
    const pivot = new THREE.Group(); holder.add(pivot);
    const aura = new THREE.Mesh(plane1, additive(glowTex, 0xffcf8a, 0.25)); aura.scale.set(1.2, 1.2, 1); aura.position.set(0, 0.32, -0.18); holder.add(aura);
    const b = makeBottle(p, 0.6, 0.6, 0.56); pivot.add(b.mesh); if (b.b3) pivot.add(b.b3);
    const spot = new THREE.Mesh(plane1, additive(glowTex, 0xffe2b0, 0.45)); spot.rotation.x = -Math.PI / 2; spot.scale.set(0.8, 0.5, 1); spot.position.y = 0.004; holder.add(spot);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.6), hitMat); hit.position.y = 0.38; holder.add(hit);
    const world = new THREE.Vector3(); holder.getWorldPosition(world); world.y += 0.3;
    const item = { kind: 'shelf', p, zone: ZONES.attar, holder, pivot, bottle: b.mesh, bottleMat: b.mat, b3: b.b3, spin: 0, spinT: 0, aura, topGlow: spot, phase: i * 0.9, hl: 0, world, stop: -1 };
    hit.userData.item = item; hitMeshes.push(hit); displays.push(item);
  });
  shelf.updateMatrixWorld(true);
  displays.filter((d) => d.kind === 'shelf').forEach((d) => { d.holder.getWorldPosition(d.world); d.world.y += 0.3; });

  /* ---------- Floating zone titles ---------- */
  const titles = [];
  [['attar', 0, -2.0, 3.55], ['perfume', 0, -17.6, 3.55], ['ritual', 0, -25.4, 3.35]].forEach(([type, x, z, y]) => {
    if (!byType(type).length) return;
    const m = new THREE.Mesh(plane1, new THREE.MeshBasicMaterial({ map: zoneTitleTex(ZONES[type]), transparent: true, depthWrite: false, toneMapped: false, fog: false }));
    m.scale.set(2.6, 2.6 * 300 / 1024, 1); m.position.set(x, y, z); scene.add(m);
    m.userData.zone = ZONES[type];
    titles.push(m); billboards.push({ obj: m, near: 1.6, far: 14, base: y });
  });

  // redraw the floating titles when the visitor switches language
  document.addEventListener('lang:change', async (e) => {
    const fam = { hi: 'Noto Serif Devanagari', gu: 'Noto Serif Gujarati' }[e.detail];
    if (fam) { try { await Promise.race([document.fonts.load(`300 60px "${fam}"`), wait(2500)]); } catch (_) {} }
    [...titles, shelfTitle].forEach((m) => {
      const old = m.material.map;
      m.material.map = zoneTitleTex(m.userData.zone); m.material.needsUpdate = true;
      old.dispose();
    });
  });

  /* ---------- Gold dust (one draw call, animated in the shader) ---------- */
  const DUST = lowPower ? 360 : 720;
  const dGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(DUST * 3), dSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dPos[i * 3] = (rand() * 2 - 1) * 7.4; dPos[i * 3 + 1] = rand() * 6.5; dPos[i * 3 + 2] = ROOM.back + 1 + rand() * (roomLen - 2);
    dSeed[i] = rand();
  }
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 1));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 400 } },
    vertexShader: `uniform float uTime; uniform float uScale; attribute float aSeed; varying float vA;
      void main(){ vec3 p = position; float t = uTime * (0.04 + aSeed * 0.05);
        p.y = mod(p.y + t * 1.5, 6.6) + 0.15;
        p.x += sin(t * 3.0 + aSeed * 40.0) * 0.45; p.z += cos(t * 2.3 + aSeed * 23.0) * 0.45;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = -mv.z;
        gl_PointSize = clamp((0.02 + aSeed * 0.035) * uScale / max(d, 0.1), 1.0, 22.0);
        vA = (0.45 + 0.55 * sin(uTime * (0.7 + aSeed * 1.6) + aSeed * 50.0)) * smoothstep(1.2, 3.2, d) * exp(-d * 0.05);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA;
      void main(){ float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r); a *= a;
        gl_FragColor = vec4(vec3(1.0, 0.82, 0.52) * a * vA, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const dust = new THREE.Points(dGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  /* ============================================================
     Stops: the guided path through the hall
     ============================================================ */
  const plinths = displays.filter((d) => d.kind === 'plinth');
  const shelfItems = displays.filter((d) => d.kind === 'shelf');
  let stops = [], curve = null;
  const EYE = 1.62;

  function fovFor(aspect) { return aspect >= 1 ? 52 : 52 + (1 - aspect) * 30; }
  function frameDist(fw, fh) {
    const v = THREE.MathUtils.degToRad(camera.fov) / 2;
    const h = Math.atan(Math.tan(v) * camera.aspect);
    return Math.max(fw / 2 / Math.tan(h), fh / 2 / Math.tan(v));
  }
  function yawTo(from, to) { return Math.atan2(-(to.x - from.x), -(to.z - from.z)); }
  function pitchTo(from, to) { return Math.atan2(to.y - from.y, Math.hypot(to.x - from.x, to.z - from.z)); }
  function poseLooking(pos, target) { return { pos, yaw: yawTo(pos, target), pitch: pitchTo(pos, target) }; }
  function clampPos(v) { v.x = clamp(v.x, -BOUNDS.x, BOUNDS.x); v.z = clamp(v.z, BOUNDS.zMin, BOUNDS.zMax); return v; }

  function buildStops() {
    stops = [];
    stops.push({ type: 'intro', caption: 'Welcome. Walk slowly; every bottle has a story.', ...poseLooking(new THREE.Vector3(0, EYE, 4.3), new THREE.Vector3(0, 1.9, -12)) });
    const add = (d) => {
      const t = d.world;
      const side = Math.sign(t.x);
      const dir = new THREE.Vector3(-side * 0.72, 0, 1).normalize();
      const dist = Math.max(2.9, frameDist(1.5, 2.0));
      const pos = clampPos(t.clone().addScaledVector(dir, dist)); pos.y = EYE;
      d.stop = stops.length;
      stops.push({ type: 'product', item: d, ...poseLooking(pos, new THREE.Vector3(t.x, 1.38, t.z)) });
    };
    plinths.filter((d) => d.p.type === 'attar').forEach(add);
    if (shelfItems.length) {
      const target = new THREE.Vector3(SHELF.x, 1.5, SHELF.z);
      const dist = Math.max(3.7, frameDist(SHELF.w + 0.4, 2.6));
      const pos = clampPos(new THREE.Vector3(SHELF.x + dist, EYE, SHELF.z));
      const st = { type: 'shelf', caption: 'The attar shelf. Tap any bottle to read its story.', ...poseLooking(pos, target) };
      shelfItems.forEach((d) => { d.stop = stops.length; });
      stops.push(st);
    }
    plinths.filter((d) => d.p.type === 'perfume').forEach(add);
    plinths.filter((d) => d.p.type === 'ritual').forEach(add);
    const et = new THREE.Vector3(0, EMB_Y - 0.2, ROOM.back);
    const ed = Math.max(6.6, frameDist(7, 6.2));
    stops.push({ type: 'emblem', caption: 'Fragrance for the moment after the noise.', ...poseLooking(clampPos(new THREE.Vector3(0, 1.75, ROOM.back + ed)), et) });
    curve = new THREE.CatmullRomCurve3(stops.map((s) => s.pos), false, 'centripetal');
  }
  const lerpAngle = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
  function pathPose(s) {
    const n = stops.length - 1;
    s = clamp(s, 0, n);
    const i = Math.min(Math.floor(s), n - 1), f = smooth(s - i);
    const pos = curve.getPoint(s / n);
    return { pos, yaw: lerpAngle(stops[i].yaw, stops[i + 1].yaw, f), pitch: stops[i].pitch + (stops[i + 1].pitch - stops[i].pitch) * f };
  }
  function nearestS(pos) {
    const n = stops.length - 1;
    let best = 0, bd = Infinity;
    for (let s = 0; s <= n; s += 0.05) { const d = curve.getPoint(s / n).distanceToSquared(pos); if (d < bd) { bd = d; best = s; } }
    return best;
  }

  /* ============================================================
     Camera state & navigation
     ============================================================ */
  const cam = { pos: new THREE.Vector3(0, 2.5, 5.6), yaw: 0, pitch: -0.08 };
  const goal = { pos: new THREE.Vector3(), yaw: 0, pitch: 0 };
  const nav = { mode: 'path', s: 0, sT: 0, arrived: -1, wheelTimer: 0, keys: new Set() };
  const tour = { on: false, wait: 0 };
  let lens = { x: 0, y: 0, tx: 0, ty: 0 };

  function enterPath(from) {
    if (nav.mode !== 'path') { nav.mode = 'path'; nav.s = nearestS(cam.pos); nav.sT = from != null ? from : nav.s; nav.arrived = -1; }
  }
  function goTo(index) {
    enterPath();
    nav.sT = clamp(index, 0, stops.length - 1);
    nav.arrived = -1;
  }
  function step(dir) {
    stopTour();
    enterPath();
    const base = nav.sT;
    const t = dir > 0 ? Math.floor(base + 1e-3) + 1 : Math.ceil(base - 1e-3) - 1;
    goTo(t);
    hideHint();
  }
  function startTour() {
    tour.on = true;
    enterPath();
    let start = Math.round(nav.s);
    if (start >= stops.length - 1) start = 0;
    goTo(start);
    syncTourBtn(); hideHint();
  }
  function stopTour() { if (!tour.on) return; tour.on = false; syncTourBtn(); }
  function syncTourBtn() {
    const b = $('#bq-tour');
    b.classList.toggle('on', tour.on);
    b.setAttribute('aria-pressed', tour.on);
    b.querySelector('span').textContent = tour.on ? 'Pause tour' : 'Guided tour';
  }
  function toFree() { if (nav.mode !== 'free') { nav.mode = 'free'; stopTour(); } }

  // clicking a display: a short direct flight (≤0.9 s), or a quick fade through dark when far
  const fadeEl = $('#bq-fade');
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function land(index) {
    nav.mode = 'path'; nav.s = nav.sT = index; nav.arrived = index;
    const st = stops[index];
    goal.pos.copy(st.pos); goal.yaw = st.yaw; goal.pitch = st.pitch;
    tour.wait = 7.5;
  }
  function flyTo(index) {
    stopTour();
    const st = stops[index];
    const dist = cam.pos.distanceTo(st.pos);
    if (nav.mode === 'path' && Math.abs(nav.sT - index) < 1e-6) return;
    if (dist < 0.25) { land(index); return; }
    if (dist > 12) {
      nav.mode = 'fade';
      fadeEl.classList.add('on');
      setTimeout(() => {
        land(index);
        cam.pos.copy(st.pos); cam.yaw = st.yaw; cam.pitch = st.pitch;
        fadeEl.classList.remove('on');
      }, 300);
      return;
    }
    nav.fly = { from: { pos: cam.pos.clone(), yaw: cam.yaw, pitch: cam.pitch }, index, t: 0, dur: clamp(0.35 + dist * 0.06, 0.45, 0.9), lift: Math.min(0.7, dist * 0.08) };
    nav.mode = 'fly';
  }
  function onArrive(i) {
    nav.arrived = i;
    const st = stops[i];
    if (st.type === 'product') openCard(st.item);
    else if (!(card.item && card.item.stop === i)) { closeCard(); showCaption(st.caption); }
    tour.wait = st.type === 'product' ? 7.5 : 4.5;
  }

  /* ---------- Input: pointer (mouse drag / touch swipe / tap) ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag = null, hovered = null, mouseDirty = false, mouseXY = [0, 0];
  const tip = $('#bq-tip');

  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(hitMeshes, false)[0];
    return hit ? hit.object.userData.item : null;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (drag) return; // ignore extra fingers
    drag = { id: e.pointerId, type: e.pointerType, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: 0, active: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { mouseXY = [e.clientX, e.clientY]; mouseDirty = true; }
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.moved = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0);
    if (!drag.active && drag.moved > 7) { drag.active = true; toFree(); hideHint(); canvas.classList.add('dragging'); }
    if (!drag.active) return;
    if (drag.type === 'touch' || drag.type === 'pen') {
      // swipe sideways to look, up/down to walk
      goal.yaw += dx * 0.0042;
      const f = forward();
      goal.pos.addScaledVector(f, -dy * 0.014);
    } else {
      goal.yaw += dx * 0.0032;
      goal.pitch = clamp(goal.pitch + dy * 0.0024, -0.5, 0.42);
    }
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const wasTap = !drag.active && performance.now() - drag.t < 700;
    drag = null; canvas.classList.remove('dragging');
    if (wasTap && e.type === 'pointerup') {
      const item = pick(e.clientX, e.clientY);
      if (item) { stopTour(); select(item); hideHint(); }
      else if (card.item && e.pointerType !== 'mouse') closeCard();
    }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hovered = null; tip.classList.remove('show'); canvas.style.cursor = ''; } });

  // wheel: glide forward/back along the guided path, settle on the nearest display
  stage.addEventListener('wheel', (e) => {
    if (e.target.closest('.bq-card')) return; // let the card scroll
    e.preventDefault();
    stopTour(); hideHint();
    enterPath();
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    nav.sT = clamp(nav.sT + clamp(d, -120, 120) * 0.0035, 0, stops.length - 1);
    nav.arrived = -1;
    clearTimeout(nav.wheelTimer);
    nav.wheelTimer = setTimeout(() => { nav.sT = Math.round(nav.sT); }, 420);
  }, { passive: false });

  // keyboard: WASD / arrows walk, Q/E or ←/→ turn
  const typing = (t) => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  const KEYS = ['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'];
  window.addEventListener('keydown', (e) => {
    if (!running || typing(e.target) || document.body.classList.contains('no-scroll')) return;
    const k = e.key.toLowerCase();
    if (k === 'escape' && card.item) { closeCard(); return; }
    if (!KEYS.includes(k)) return;
    if (k.startsWith('arrow')) e.preventDefault();
    if (k !== 'shift') { toFree(); hideHint(); }
    nav.keys.add(k);
  });
  window.addEventListener('keyup', (e) => nav.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => nav.keys.clear());

  $('#bq-prev').addEventListener('click', () => step(-1));
  $('#bq-next').addEventListener('click', () => step(1));
  $('#bq-tour').addEventListener('click', () => (tour.on ? stopTour() : startTour()));

  function forward() { return new THREE.Vector3(-Math.sin(goal.yaw), 0, -Math.cos(goal.yaw)); }

  /* ---------- Selection & the product card ---------- */
  const card = { el: $('#bq-card'), item: null };
  card.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !card.item) return;
    const id = card.item.p.id;
    if (b.dataset.act === 'close') closeCard();
    if (b.dataset.act === 'prev' || b.dataset.act === 'next') {
      if (card.item.kind === 'shelf') { shelfStep(b.dataset.act === 'next' ? 1 : -1); return; }
      step(b.dataset.act === 'next' ? 1 : -1);
    }
    if (b.dataset.act === 'add') window.GibCart && window.GibCart.add(id);
    if (b.dataset.act === 'feel') { stopTour(); window.GibExperience && window.GibExperience.open(id); }
    if (b.dataset.act === 'more') { card.el.classList.add('full'); b.remove(); measureCard(); }
  });

  function select(item) {
    if (nav.mode === 'fade') return;
    if (item.kind === 'plinth' || cam.pos.distanceTo(item.world) > 7.5 || nav.mode === 'free') flyTo(item.stop);
    openCard(item);
  }
  // on the shelf, the card arrows walk along the bottles; past either end they leave the shelf
  function shelfStep(dir) {
    const i = shelfItems.indexOf(card.item) + dir;
    if (i >= 0 && i < shelfItems.length) openCard(shelfItems[i]);
    else { closeCard(); step(dir); }
  }
  function shortStory(s) { const parts = s.match(/[^.!?]+[.!?]+["”’]?/g) || [s]; return parts.slice(0, 2).join(' ').trim(); }
  function openCard(item) {
    const p = item.p, z = item.zone;
    const sameItem = card.item === item;
    card.item = item;
    hideCaption();
    if (sameItem && card.el.classList.contains('open')) return;
    const notes = [['Top', p.notes.top], ['Heart', p.notes.heart], ['Base', p.notes.base]].filter(([, n]) => n && n.length);
    const story = shortStory(p.story);
    const html = `
      <div class="bq-card-top">
        <span class="bq-card-zone">${item.kind === 'shelf' ? 'The Attar Shelf' : `${z.num} · ${z.title}`}</span>
        <button class="bq-card-ic" type="button" data-act="prev" aria-label="Previous display"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
        <button class="bq-card-ic" type="button" data-act="next" aria-label="Next display"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
        <button class="bq-card-ic" type="button" data-act="close" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </div>
      <span class="p-house">${p.house}</span>
      <h2 class="bq-card-name">${p.name}</h2>
      <p class="bq-card-tag">${p.tagline}</p>
      <p class="bq-card-story">${story}</p>
      ${story.length > 150 ? '<button class="bq-more" type="button" data-act="more">Read the story</button>' : ''}
      <dl class="bq-notes">${notes.map(([k, n]) => `<div><dt>${k}</dt><dd>${n.join(' · ')}</dd></div>`).join('')}</dl>
      <div class="bq-card-foot">
        <div class="bq-price">${p.price != null ? money(p.price) : '<span>By invitation</span>'}<small>${p.size}</small></div>
        <div class="bq-card-btns">
          <button class="btn btn-solid btn-sm" type="button" data-act="add">${p.price != null ? 'Add to bag' : 'Join waitlist'}</button>
          <button class="btn btn-ghost btn-sm" type="button" data-act="feel"><i class="bq-dot" aria-hidden="true"></i>Feel it</button>
        </div>
      </div>`;
    const swap = () => {
      card.el.innerHTML = html;
      card.el.classList.remove('full', 'swap'); card.el.classList.add('open'); card.el.setAttribute('aria-hidden', 'false');
      stage.classList.add('card-open');
      measureCard();
    };
    if (card.el.classList.contains('open')) { card.el.classList.add('swap'); setTimeout(swap, 220); } else swap();
  }
  function closeCard() {
    if (!card.item) return;
    card.item = null;
    card.el.classList.remove('open', 'full');
    card.el.setAttribute('aria-hidden', 'true');
    stage.classList.remove('card-open');
    measureCard();
  }
  function measureCard() {
    requestAnimationFrame(() => {
      const open = card.el.classList.contains('open');
      const wide = stage.clientWidth >= 900;
      const h = open ? card.el.offsetHeight : 0;
      stage.style.setProperty('--sheet', (open && !wide ? h : 0) + 'px');
      lens.tx = open && wide ? (card.el.offsetWidth + 24) / 2 : 0;
      // phones: centre the display in the gap between the title block and the sheet
      const head = $('.bq-head', stage);
      const top = head.offsetTop + head.offsetHeight, bottom = stage.clientHeight - h - 10;
      lens.ty = open && !wide ? Math.max(0, stage.clientHeight / 2 - (top + bottom) / 2) : 0;
    });
  }

  /* ---------- Overlay bits: caption, hint, zone, counter ---------- */
  const captionEl = $('#bq-caption');
  let captionTimer;
  function showCaption(t) { captionEl.textContent = t; captionEl.classList.add('show'); clearTimeout(captionTimer); captionTimer = setTimeout(hideCaption, 5200); }
  function hideCaption() { captionEl.classList.remove('show'); }
  const hintEl = $('#bq-hint');
  let hintShown = true;
  function hideHint() { if (hintShown) { hintShown = false; hintEl.classList.add('gone'); } }
  setTimeout(hideHint, 14000);
  const zoneEl = $('#bq-zone'), countEl = $('#bq-count'), prevBtn = $('#bq-prev'), nextBtn = $('#bq-next');
  let zoneKey = '', countKey = '', freeS = 0, freeSAt = 0;
  function zoneAt(z) {
    if (z > -11.2) return ['I', 'Attars'];
    if (z > -17.4) return ['I', 'The Attar Shelf'];
    if (z > -25.2) return ['II', 'Perfumes'];
    if (z > -28.5) return ['III', 'Home Rituals'];
    return ['', 'The Monk'];
  }

  if (window.GibSound) window.GibSound.mountToggle($('#bq-sound'), 'temple');

  /* ============================================================
     Resize / visibility / loop
     ============================================================ */
  let W = 1, H = 1;
  function resize() {
    W = Math.max(1, stage.clientWidth); H = Math.max(1, stage.clientHeight);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.fov = fovFor(camera.aspect);
    camera.updateProjectionMatrix();
    dustMat.uniforms.uScale.value = (H * pixelRatio) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    const s = nav.s;
    buildStops();
    if (nav.mode === 'path') { nav.s = s; }
    measureCard();
  }
  new ResizeObserver(resize).observe(stage);
  resize();
  goal.pos.copy(stops[0].pos); goal.yaw = stops[0].yaw; goal.pitch = stops[0].pitch;
  cam.yaw = goal.yaw;
  // deep link: boutique.html#p=<product-id> opens straight at that display
  const deep = (location.hash.match(/(?:^#|&)p=([\w-]+)/) || [])[1];
  const deepItem = deep && plinths.find((d) => d.p.id === deep);
  if (deepItem) {
    nav.s = nav.sT = deepItem.stop;
    const st = stops[deepItem.stop];
    goal.pos.copy(st.pos); goal.yaw = st.yaw; goal.pitch = st.pitch;
    cam.pos.copy(st.pos).add(new THREE.Vector3(0, 0.5, 1.2)); cam.yaw = st.yaw; cam.pitch = st.pitch;
  }

  let running = false, raf = 0, last = 0, time = 0;
  let frameAvg = 16, frameN = 0;
  const camWorld = new THREE.Vector3();
  const tmpV = new THREE.Vector3();

  function update(dt) {
    time += dt;

    // ---- navigation ----
    if (nav.mode === 'fly') {
      const f = nav.fly, st = stops[f.index];
      f.t = Math.min(1, f.t + dt / f.dur);
      const e = easeIO(f.t);
      goal.pos.lerpVectors(f.from.pos, st.pos, e); goal.pos.y += Math.sin(Math.PI * e) * f.lift;
      goal.yaw = lerpAngle(f.from.yaw, st.yaw, e);
      goal.pitch = f.from.pitch + (st.pitch - f.from.pitch) * e;
      if (f.t >= 1) land(f.index);
    } else if (nav.mode === 'path') {
      const d = nav.sT - nav.s;
      const v = clamp(d * (1 - Math.exp(-dt * 1.7)), -1.1 * dt, 1.1 * dt);
      nav.s = Math.abs(d) < 0.0008 ? nav.sT : nav.s + v;
      const pose = pathPose(nav.s);
      goal.pos.copy(pose.pos); goal.yaw = pose.yaw; goal.pitch = pose.pitch;
      const ri = Math.round(nav.sT);
      if (nav.s === nav.sT && Math.abs(nav.sT - ri) < 1e-6 && nav.arrived !== ri) onArrive(ri);
      if (tour.on && nav.arrived === ri && nav.s === nav.sT) {
        tour.wait -= dt;
        if (tour.wait <= 0) { if (ri < stops.length - 1) goTo(ri + 1); else stopTour(); }
      }
    } else if (nav.keys.size) {
      const k = nav.keys, sp = (k.has('shift') ? 4 : 2.3) * dt;
      const f = forward(), r = new THREE.Vector3(-f.z, 0, f.x);
      if (k.has('w') || k.has('arrowup')) goal.pos.addScaledVector(f, sp);
      if (k.has('s') || k.has('arrowdown')) goal.pos.addScaledVector(f, -sp);
      if (k.has('d')) goal.pos.addScaledVector(r, sp);
      if (k.has('a')) goal.pos.addScaledVector(r, -sp);
      if (k.has('arrowleft') || k.has('q')) goal.yaw += 1.3 * dt;
      if (k.has('arrowright') || k.has('e')) goal.yaw -= 1.3 * dt;
    }
    // keep inside the room and out of the plinths
    if (nav.mode === 'free') {
      clampPos(goal.pos); goal.pos.y = EYE;
      for (const d of plinths) {
        tmpV.set(goal.pos.x - d.world.x, 0, goal.pos.z - d.world.z);
        const L = tmpV.length();
        if (L < 1.0) goal.pos.addScaledVector(tmpV.normalize(), 1.0 - L);
      }
    }
    // the card belongs to a display: hide it once we walk away
    if (card.item && (nav.mode === 'path' || nav.mode === 'free')) {
      if (nav.mode === 'path' ? Math.abs(nav.sT - card.item.stop) > 0.5 : cam.pos.distanceTo(card.item.world) > 8) closeCard();
    }

    // ---- ease the camera toward its goal (calm, critically damped feel) ----
    const k = nav.mode === 'fly' || nav.mode === 'fade' ? 1 : 1 - Math.exp(-dt * (nav.mode === 'path' ? 4.2 : 6));
    cam.pos.lerp(goal.pos, k);
    cam.yaw = lerpAngle(cam.yaw, goal.yaw, k);
    cam.pitch += (goal.pitch - cam.pitch) * k;
    const breathe = Math.sin(time * 0.6) * 0.012;
    camera.position.set(cam.pos.x, cam.pos.y + breathe, cam.pos.z);
    camera.rotation.set(cam.pitch, cam.yaw, 0);

    // lens shift so the bottle stays clear of the card
    lens.x += (lens.tx - lens.x) * Math.min(1, dt * 5);
    lens.y += (lens.ty - lens.y) * Math.min(1, dt * 5);
    if (Math.abs(lens.x) > 0.5 || Math.abs(lens.y) > 0.5) camera.setViewOffset(W, H, lens.x, lens.y, W, H);
    else if (camera.view && camera.view.enabled) camera.clearViewOffset();
    camera.updateMatrixWorld();
    camWorld.copy(camera.position);

    // ---- hover (mouse) ----
    if (mouseDirty && !drag) {
      mouseDirty = false;
      const it = pick(mouseXY[0], mouseXY[1]);
      if (it !== hovered) {
        hovered = it;
        canvas.style.cursor = it ? 'pointer' : '';
        if (it) { tip.innerHTML = `<small>${it.p.house}</small>${it.p.name}<em>Click to discover</em>`; tip.classList.add('show'); } else tip.classList.remove('show');
      }
      if (hovered) {
        const r = stage.getBoundingClientRect();
        tip.style.transform = `translate(${mouseXY[0] - r.left + 18}px, ${mouseXY[1] - r.top + 14}px)`;
      }
    }

    // ---- displays: levitate, billboard, highlight ----
    for (const d of displays) {
      const target = d === hovered || d === card.item ? 1 : 0;
      d.hl += (target - d.hl) * Math.min(1, dt * 3.2);
      const h = d.hl, ease = smooth(h);
      if (d.kind === 'plinth') {
        const bob = Math.sin(time * 0.8 + d.phase) * 0.045;
        d.float.position.y = 0.9 + bob;
        d.pivot.position.y = 0.075 + ease * 0.2;
        const yaw = Math.atan2(camWorld.x - d.world.x, camWorld.z - d.world.z);
        if (bottleMode === 'photo') { d.pivot.rotation.y = yaw + Math.sin(time * 0.55 + d.phase) * 0.42 * ease; d.bottle.rotation.y = 0; }
        else {
          // 3D: slowly turn the label toward the visitor; spin while highlighted, then settle
          d.faceYaw = d.faceYaw === null ? yaw : lerpAngle(d.faceYaw, yaw, Math.min(1, dt * 1.6));
          spinStep(d, dt);
          d.pivot.rotation.y = d.faceYaw + d.spin + Math.sin(time * 0.45 + d.phase) * 0.18 * (1 - ease);
          d.bottle.rotation.y = yaw - d.pivot.rotation.y;
        }
        d.aura.position.set(-Math.sin(yaw) * 0.35, 0.6 + d.pivot.position.y, -Math.cos(yaw) * 0.35);
        d.aura.rotation.y = yaw;
        d.mPivot.position.y = -(d.float.position.y + d.pivot.position.y);
        d.mPivot.rotation.y = yaw;
        d.mDisc.position.y = -d.float.position.y; d.mRim.position.y = -(d.float.position.y + 0.065);
        d.haloRing.rotation.set(Math.PI / 2 + Math.sin(time * 0.4) * 0.25, 0, time * 0.8);
        d.haloRing.position.y = 0.32 + ease * 0.4;
        d.haloRing.material.opacity = ease * 0.85;
        d.haloRing.visible = ease > 0.01;
        d.haloRing.scale.setScalar(1 + ease * 0.25);
        d.rimMat.opacity = 0.75 + 0.25 * Math.sin(time * 1.4 + d.phase) * 0.5 + ease * 0.25;
        d.rimAura.material.opacity = 0.45 + ease * 0.5;
        d.topGlow.material.opacity = 0.5 + ease * 0.6;
        d.under.material.opacity = 0.45 + ease * 0.3;
        d.aura.material.opacity = (bottleMode === 'photo' ? 0.28 : 0.2) + ease * 0.4;
        d.beam.material.uniforms.uOpacity.value = 0.14 + ease * 0.14;
        d.poolMat.opacity = 0.3 + ease * 0.25;
      } else {
        // shelf: rise and turn a little toward the visitor
        d.pivot.position.y = ease * 0.14;
        const local = d.holder.worldToLocal(tmpV.copy(camWorld));
        const yaw = clamp(Math.atan2(local.x, local.z), -0.6, 0.6);
        if (bottleMode === 'photo') { d.pivot.rotation.y = yaw + Math.sin(time * 0.6 + d.phase) * 0.4 * ease; d.bottle.rotation.y = 0; }
        else { spinStep(d, dt); d.pivot.rotation.y = yaw + d.spin; d.bottle.rotation.y = -d.spin; }
        d.aura.material.opacity = 0.22 + ease * 0.5;
        d.topGlow.material.opacity = 0.4 + ease * 0.5;
      }
      if (bottleMode === 'photo') { const b = 0.9 + ease * 0.22; d.bottleMat.color.setRGB(b, b * 0.97, b * 0.92); }
      else if (d.b3) B3.highlight(d.b3, ease);
    }

    // ---- billboards with distance fade ----
    for (const bb of billboards) {
      const o = bb.obj;
      o.rotation.y = Math.atan2(camWorld.x - o.position.x - (o.parent ? o.parent.position.x : 0), camWorld.z - o.position.z - (o.parent ? o.parent.position.z : 0));
      o.getWorldPosition(tmpV);
      const dd = tmpV.distanceTo(camWorld);
      o.material.opacity = smoothstep(bb.near, bb.near + 1.6, dd) * (1 - smoothstep(bb.far * 0.7, bb.far, dd));
      if (bb.base) o.position.y = bb.base + Math.sin(time * 0.5 + o.position.z) * 0.06;
      o.visible = o.material.opacity > 0.01;
    }
    shelfTitle.material.opacity = 1 - smoothstep(14, 20, camWorld.distanceTo(tmpV.set(SHELF.x, 4.4, SHELF.z)));

    // ---- emblem: breathing monk, turning arcs, pulsing glow ----
    const laugh = Math.max(0, Math.sin(time * 0.7)) ** 6;
    monkGroup.scale.set(1 + Math.sin(time * 1.1) * 0.006, 1 + Math.sin(time * 1.1) * 0.012 + laugh * 0.01, 1);
    halo.scale.setScalar(1 + Math.sin(time * 0.45) * 0.04 + laugh * 0.06);
    core.material.opacity = 0.75 + Math.sin(time * 0.9) * 0.1 + laugh * 0.15;
    arcs.forEach((a) => { a.rotation.z += a.userData.spd * dt * 2; });
    monkLight.intensity = 28 + laugh * 8;
    dustMat.uniforms.uTime.value = time;

    // ---- overlay text ----
    const zk = zoneAt(cam.pos.z);
    if (zk.join() !== zoneKey) { zoneKey = zk.join(); zoneEl.innerHTML = (zk[0] ? `<b>${zk[0]}</b>` : '<b>◇</b>') + `<span>${zk[1]}</span>`; }
    if (nav.mode !== 'path' && time - freeSAt > 0.3) { freeS = nearestS(cam.pos); freeSAt = time; }
    const ci = clamp(Math.round(nav.mode === 'path' ? nav.s : freeS), 0, stops.length - 1);
    const ck = `${String(ci + 1).padStart(2, '0')} / ${String(stops.length).padStart(2, '0')}`;
    if (ck !== countKey) { countKey = ck; countEl.textContent = ck; }
    prevBtn.disabled = nav.mode === 'path' && nav.sT <= 0;
    nextBtn.disabled = nav.mode === 'path' && nav.sT >= stops.length - 1;
  }

  const TAU = Math.PI * 2;
  /* Spin: hovering turns the bottle slowly. Otherwise (and always for the selected bottle,
     whose card is open) the spin settles on a whole turn, so the label faces the visitor. */
  function spinStep(d, dt) {
    if (d === hovered && d !== card.item) d.spinT = d.spin + 0.35;
    else if (Math.abs(d.spinT - d.spin) < 0.01) d.spinT = Math.round(d.spin / TAU) * TAU;
    const v = (d.spinT - d.spin) * 1.6;               // eased…
    d.spin += clamp(v, -1.1, 1.1) * dt;                // …but never faster than ~1 rad/s
  }
  // when a device can't keep up, step down: glass → cheaper glass → resolution → photo cut-outs
  function degrade() {
    if (pinnedMode && B3) return;
    if (bottleMode === 'high') return setBottleMode('low');
    if (pixelRatio > 1.25) { pixelRatio = Math.max(1, pixelRatio - 0.5); renderer.setPixelRatio(pixelRatio); resize(); return; }
    if (bottleMode === 'low') return setBottleMode('photo');
    if (pixelRatio > 1) { pixelRatio = 1; renderer.setPixelRatio(1); resize(); }
  }
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dtMs = last ? now - last : 16;
    last = now;
    const dt = Math.min(dtMs / 1000, 0.05);
    update(dt);
    renderer.render(scene, camera);
    // adaptive quality: drop resolution if the device is struggling
    frameAvg += (dtMs - frameAvg) * 0.05;
    // (ignore the first seconds: shader compilation makes early frames look slow)
    if (time > 3 && ++frameN > 120 && frameAvg > 26) { frameN = 0; frameAvg = 18; degrade(); }
  }
  function start() { if (running || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  let userPaused = false;
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : !userPaused && !document.body.classList.contains('no-scroll') && start()));
  // drawer / menu / "Feel it" overlay lock the page: freeze the boutique behind them
  new MutationObserver(() => {
    if (userPaused) return;
    if (document.body.classList.contains('no-scroll')) stop(); else start();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ---------- Reveal ---------- */
  await Promise.race([Promise.all([allLoaded, ...bottleReady]), wait(15000)]);
  update(0.016);
  try { renderer.compile(scene, camera); } catch (_) {}
  renderer.render(scene, camera);
  await wait(250);
  loader.classList.add('done');
  stage.classList.add('ready');
  start();

  return {
    pause() { userPaused = true; stop(); },
    resume() { userPaused = false; resize(); start(); },
  };
}
