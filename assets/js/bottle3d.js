/* ============================================================
   GIBERISH — GibBottle3D
   Procedural, physically shaded 3D bottles for every product:
   real glass (transmission + ior + attenuation), an inner liquid,
   polished metal caps and a label cropped from the product's HD photo.

   Classic script. Works with the page's own three.js (r160) or loads it.

   API
   ─────────────────────────────────────────────────────────────
   GibBottle3D.load()                          → Promise<THREE>  (pinned r160 module)
   GibBottle3D.create(THREE, product, opts)    → THREE.Group, origin at the bottle's base centre
       opts.height    world height to scale to (default: natural, ≈ 0.8–1.1)
       opts.renderer  WebGLRenderer, used to build the reflection environment (PMREM)
       opts.envMap    or pass a ready PMREM texture (see envMap below)
       opts.quality   'high' (transmission glass, default) | 'low' (env reflections + opacity, cheap)
       opts.label     false to skip the photo label
     group.userData: { product, height, width, ready: Promise (label loaded), materials }
   GibBottle3D.setQuality(group, 'high'|'low') → swap glass between transmission and the cheap path
   GibBottle3D.highlight(group, k)             → 0..1, brightens reflections / liquid glow
   GibBottle3D.envMap(THREE, renderer)         → cached PMREM studio environment for that renderer
   GibBottle3D.mount(el, product, opts)        → Promise<{ bottle, renderer, scene, camera, setProduct(p), dispose() }>
       opts.autoRotate (true), opts.quality ('high'), opts.drag (true) — a small live viewer,
       renders only while on screen and the tab is visible.
   GibBottle3D.snapshot(product, w, h, opts)   → Promise<dataURL> (transparent PNG; opts.quality defaults to 'low'
       because transmission has nothing to refract over a transparent background; pass opts.background to use 'high')
   GibBottle3D.recipe(product)                 → the shape recipe used for a product (for tweaking)
   ============================================================ */
(function () {
  'use strict';

  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
  let threePromise = null;
  const load = () => threePromise || (threePromise = import(THREE_URL));

  /* ============================================================
     Recipes: which shape, cap, juice colour and label crop each product gets.
     crop = [x0, y0, x1, y1] as fractions of the HD cut-out image.
     ============================================================ */
  const ATTAR_LABEL = { crop: [0.12, 0.4, 0.88, 0.93], mask: 'arch' };
  const ATTAR_JUICE = {
    'ajmal-1001-night': '#c8862a',
    'al-bakhoor': '#8a531a',
    'hajar-al-aswad': '#3b220e',
    'musk-gold': '#e5c25e',
    'mukhallat-malaki': '#6e4614',
  };
  const RECIPES = {
    'giberish-signature': { form: 'vessel', label: { crop: [0.27, 0.16, 0.73, 0.34], mask: 'oval' } },
    'barakkat-rouge-540': { form: 'square', w: 0.6, h: 0.6, d: 0.32, juice: '#a8261c', cap: 'goldBlock', label: { crop: [0.2, 0.4, 0.82, 0.86] } },
    'kaaf':               { form: 'square', w: 0.4, h: 0.78, d: 0.2, juice: '#4a2a0c', cap: 'blackTextured', label: { crop: [0.12, 0.3, 0.88, 0.9] } },
    'viking-creed':       { form: 'square', w: 0.62, h: 0.56, d: 0.28, juice: '#d9a531', cap: 'blackRibbed', label: { crop: [0.13, 0.42, 0.87, 0.93] } },
    'fahad':              { form: 'faceted', juice: '#2a1a10', cap: 'ornateGold', label: { crop: [0.25, 0.49, 0.75, 0.77], mask: 'circle' } },
    'white-oud':          { form: 'pebble', juice: '#e9dcc0', cap: 'goldCylinder', label: { crop: [0.2, 0.4, 0.8, 0.74] } },
    'celoud':             { form: 'tall', juice: '#7a1414', cap: 'roseSpray', label: { text: true } },
    'bakhoor-dani':       { form: 'burner', label: { crop: [0.27, 0.46, 0.74, 0.86], mask: 'circle' } },
  };
  function recipe(p) {
    if (RECIPES[p.id]) return RECIPES[p.id];
    if (p.type === 'attar') return { form: 'attar', cap: 'dome', juice: ATTAR_JUICE[p.id] || '#b07a2a', label: ATTAR_LABEL };
    if (p.type === 'ritual') return { form: 'burner', label: { text: true } };
    return { form: 'square', w: 0.58, h: 0.6, d: 0.3, juice: '#c99a4a', cap: 'goldBlock', label: { text: true } };
  }

  /* ============================================================
     Shared resources (cached per THREE instance / renderer)
     ============================================================ */
  const texCache = new WeakMap();
  const envCache = new WeakMap();
  const imgCache = new Map();

  function loadImage(src) {
    if (!imgCache.has(src)) {
      imgCache.set(src, new Promise((res, rej) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = src;
      }));
    }
    return imgCache.get(src);
  }

  // Procedural relief / pattern textures (bump maps are data, not colour)
  function textures(THREE) {
    if (texCache.has(THREE)) return texCache.get(THREE);
    const canvas = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
    const tex = (c, rx, ry, srgb) => {
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 8;
      return t;
    };
    // filigree: interlocking circles, the classic arabesque on attar caps
    const fil = canvas(256, 256, (g, W) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, W, W);
      g.strokeStyle = '#ffffff'; g.lineWidth = 5;
      const s = W / 2;
      for (let y = 0; y <= 2; y++) for (let x = 0; x <= 2; x++) { g.beginPath(); g.arc(x * s, y * s, s / 2, 0, Math.PI * 2); g.stroke(); }
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.beginPath(); g.arc(x * s + s / 2, y * s + s / 2, s / 2, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = '#ffffff';
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.beginPath(); g.arc(x * s + s / 2, y * s + s / 2, 7, 0, Math.PI * 2); g.fill(); }
    });
    // lattice: pierced diamond grid (gold lines over a dark, deep ground)
    const lat = canvas(256, 256, (g, W) => {
      g.fillStyle = '#2a1606'; g.fillRect(0, 0, W, W);
      g.strokeStyle = '#ffffff'; g.lineWidth = 16; g.lineCap = 'square';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W, W); g.moveTo(W, 0); g.lineTo(0, W);
      g.moveTo(-W / 2, W / 2); g.lineTo(W / 2, -W / 2); g.moveTo(W / 2, W * 1.5); g.lineTo(W * 1.5, W / 2);
      g.moveTo(-W / 2, W / 2); g.lineTo(W / 2, W * 1.5); g.moveTo(W / 2, -W / 2); g.lineTo(W * 1.5, W / 2);
      g.stroke();
      g.fillStyle = '#ffffff';
      [[0, 0], [W, 0], [0, W], [W, W], [W / 2, W / 2]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.fill(); });
    });
    // the same lattice on a warm bronze ground, for the burner
    const latB = canvas(256, 256, (g, W) => { g.drawImage(lat, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#c08a52'; g.fillRect(0, 0, W, W); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#3a2410'; g.fillRect(0, 0, W, W); });
    // fine cross-hatch for the black Kaaf cap
    const hatch = canvas(128, 128, (g, W) => {
      g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, W, W);
      g.strokeStyle = '#ffffff'; g.lineWidth = 3;
      for (let i = -W; i < W * 2; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + W, W); g.moveTo(i, W); g.lineTo(i + W, 0); g.stroke(); }
    });
    // flowing vertical waves for White Oud's cream body
    const wave = canvas(256, 256, (g, W) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, W, W);
      g.strokeStyle = '#d8d8d8'; g.lineWidth = 3;
      for (let x = 0; x < W; x += 12) {
        g.beginPath();
        for (let y = 0; y <= W; y += 8) g.lineTo(x + Math.sin((y / W) * Math.PI * 4 + x * 0.7) * 5, y);
        g.stroke();
      }
    });
    const T = {
      filigree: tex(fil, 6, 2, false),
      latticeMap: tex(lat, 12, 3, true),
      latticeBump: tex(lat, 12, 3, false),
      bronzeMap: tex(latB, 18, 5, true),
      bronzeBump: tex(lat, 18, 5, false),
      hatch: tex(hatch, 3, 3, false),
      wave: tex(wave, 3, 1, false),
    };
    texCache.set(THREE, T);
    return T;
  }

  /* A warm "studio" environment, in the spirit of three's RoomEnvironment
     (built inline so no import map is needed): a dark room lit by soft boxes.
     Pre-filtered with PMREM so glass and metal get real reflections. */
  function envMap(THREE, renderer) {
    if (envCache.has(renderer)) return envCache.get(renderer);
    const scene = new THREE.Scene();
    const geos = [];
    const box = new THREE.BoxGeometry(12, 8, 12); geos.push(box);
    scene.add(new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: 0x1c130c, side: THREE.BackSide })));
    const panel = (w, h, intensity, hex, x, y, z) => {
      const g = new THREE.PlaneGeometry(w, h); geos.push(g);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(intensity), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0);
      scene.add(m);
    };
    panel(6, 3.5, 5.0, '#fff1dc', 0, 3.9, 0.5);    // key softbox overhead
    panel(1.1, 6, 6.0, '#fff6e8', -5.9, 0.6, 1.2); // tall strip, left
    panel(0.8, 6, 4.0, '#ffd9a8', 5.9, 0.4, -0.6); // warm strip, right
    panel(4.5, 1.2, 3.0, '#ffcf90', 0, 1.2, -5.9); // gold rim from behind
    panel(6, 2.5, 1.1, '#ffe6c4', 0, 0.2, 5.9);    // soft front fill
    panel(8, 8, 0.35, '#8a5a2a', 0, -3.9, 0);      // warm floor bounce
    const pmrem = new THREE.PMREMGenerator(renderer);
    const tex = pmrem.fromScene(scene, 0.035).texture;
    pmrem.dispose();
    geos.forEach((g) => g.dispose());
    scene.traverse((o) => o.material && o.material.dispose());
    envCache.set(renderer, tex);
    return tex;
  }

  /* ============================================================
     Materials (one set per bottle, so each can be highlighted alone)
     ============================================================ */
  function materialKit(THREE, env, quality, r) {
    const T = textures(THREE);
    const all = [];
    const phys = (o) => {
      const m = new THREE.MeshPhysicalMaterial(Object.assign({ envMap: env || null }, o));
      m.userData.baseEnv = m.envMapIntensity;
      all.push(m);
      return m;
    };
    const juice = new THREE.Color(r.juice || '#c99a4a');
    const white = new THREE.Color('#ffffff');
    const memo = {};
    const make = {
      // clear glass: real transmission, faint juice tint in the attenuation
      glass: () => {
        const m = phys({
          color: white.clone().lerp(juice, 0.12), metalness: 0, roughness: 0.05, ior: 1.45,
          transmission: 1, thickness: 0.3, attenuationColor: white.clone().lerp(juice, 0.35), attenuationDistance: 0.9,
          clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 1, envMapIntensity: 1.25,
          // a warm grazing-angle sheen: the outline and edges stay readable on dark backgrounds
          sheen: 1, sheenColor: new THREE.Color('#ffe2b8'), sheenRoughness: 0.3,
        });
        m.userData.glass = true;
        applyQuality(m, quality);
        return m;
      },
      liquid: () => phys({ color: juice, roughness: 0.15, metalness: 0, clearcoat: 0.5, emissive: juice.clone().multiplyScalar(0.18), envMapIntensity: 0.7 }),
      gold: () => phys({ color: '#e6b85f', metalness: 1, roughness: 0.16, clearcoat: 0.3, clearcoatRoughness: 0.08, envMapIntensity: 1.35 }),
      goldBrushed: () => phys({ color: '#dcae58', metalness: 1, roughness: 0.3, envMapIntensity: 1.3 }),
      goldOrnate: () => phys({ color: '#e6b85f', metalness: 1, roughness: 0.2, bumpMap: T.filigree, bumpScale: 1.2, envMapIntensity: 1.4 }),
      goldLattice: () => phys({ color: '#e2b25a', metalness: 1, roughness: 0.24, map: T.latticeMap, bumpMap: T.latticeBump, bumpScale: 2, envMapIntensity: 1.4 }),
      rose: () => phys({ color: '#e7a587', metalness: 1, roughness: 0.18, clearcoat: 0.3, envMapIntensity: 1.35 }),
      bronze: () => phys({ color: '#c99358', metalness: 1, roughness: 0.3, map: T.bronzeMap, bumpMap: T.bronzeBump, bumpScale: 1.6, envMapIntensity: 1.4 }),
      bronzePlain: () => phys({ color: '#b5804a', metalness: 1, roughness: 0.26, envMapIntensity: 1.3 }),
      lacquer: () => phys({ color: '#0e0c0b', metalness: 0.6, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.2 }),
      lacquerHatch: () => phys({ color: '#100e0d', metalness: 0.6, roughness: 0.3, bumpMap: T.hatch, bumpScale: 1.2, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.2 }),
      blackGlass: () => phys({ color: '#0b0909', metalness: 0.15, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.5 }),
      cream: () => phys({ color: '#efe3c8', metalness: 0, roughness: 0.32, bumpMap: T.wave, bumpScale: 1.4, clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 1.0 }),
      coal: () => phys({ color: '#1c130d', roughness: 0.9, metalness: 0, emissive: new THREE.Color('#ff5a14'), emissiveIntensity: 0.55, envMapIntensity: 0.3 }),
    };
    const get = (k) => memo[k] || (memo[k] = make[k]());
    get.all = all;
    get.phys = phys;
    return get;
  }
  /* 'low' glass: no transmission pass. The body turns near-black and is blended
     additively, so only its reflections (env + clearcoat) land on top of the liquid
     and the room behind — reads as clear glass at a fraction of the cost. */
  function applyQuality(m, q) {
    if (!m.userData.glass) return;
    const low = q === 'low';
    if (!m.userData.baseColor) m.userData.baseColor = m.color.clone();
    m.transmission = low ? 0 : 1;
    m.transparent = low;
    m.blending = low ? 2 /* THREE.AdditiveBlending */ : 1 /* THREE.NormalBlending */;
    m.color.copy(m.userData.baseColor).multiplyScalar(low ? 0.04 : 1);
    m.clearcoat = low ? 0.25 : 1;          // one reflective layer is enough without refraction
    m.specularIntensity = low ? 0.7 : 1;
    m.depthWrite = !low;
    m.needsUpdate = true;
  }

  /* ============================================================
     Geometry helpers
     ============================================================ */
  const V2 = (THREE, pts) => pts.map(([x, y]) => new THREE.Vector2(Math.max(0.0005, x), y));
  function lathe(THREE, pts, segs, phi = 0) { return new THREE.LatheGeometry(V2(THREE, pts), segs, phi); }
  function smoothLathe(THREE, pts, segs, n = 48) {
    return new THREE.LatheGeometry(new THREE.SplineCurve(V2(THREE, pts)).getPoints(n).map((v) => new THREE.Vector2(Math.max(0.0005, v.x), v.y)), segs);
  }
  // crisp facets: give every triangle its own normal
  function flat(g) { const f = g.toNonIndexed(); f.computeVertexNormals(); g.dispose(); return f; }
  // vertical ribs/flutes: push the radius in and out around the axis between y0 and y1
  function ribs(g, n, amp, y0, y1) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      if (y < y0 || y > y1) continue;
      const x = p.getX(i), z = p.getZ(i);
      const k = 1 + amp * Math.pow(Math.abs(Math.cos((n / 2) * Math.atan2(x, z))), 0.6);
      p.setXYZ(i, x * k, y, z * k);
    }
    g.computeVertexNormals();
    return g;
  }
  function roundRectShape(THREE, w, h, r, y0 = 0) {
    const s = new THREE.Shape(), x = -w / 2;
    s.moveTo(x + r, y0); s.lineTo(x + w - r, y0); s.quadraticCurveTo(x + w, y0, x + w, y0 + r);
    s.lineTo(x + w, y0 + h - r); s.quadraticCurveTo(x + w, y0 + h, x + w - r, y0 + h);
    s.lineTo(x + r, y0 + h); s.quadraticCurveTo(x, y0 + h, x, y0 + h - r);
    s.lineTo(x, y0 + r); s.quadraticCurveTo(x, y0, x + r, y0);
    return s;
  }
  // rounded box standing on y=0, centred in x and z
  function roundBox(THREE, w, h, d, bev, r = 0.03) {
    const g = new THREE.ExtrudeGeometry(roundRectShape(THREE, w - 2 * bev, h - 2 * bev, r, bev), {
      depth: d - 2 * bev, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 8,
    });
    g.translate(0, 0, -(d - 2 * bev) / 2);
    return g;
  }

  /* ============================================================
     Caps
     ============================================================ */
  function addCap(THREE, grp, M, kind, y) {
    const mesh = (g, m, py = 0) => { const o = new THREE.Mesh(g, m); o.position.y = y + py; grp.add(o); return o; };
    let h = 0;
    switch (kind) {
      case 'dome': { // ornate gold crown dome, fluted, with a finial
        mesh(new THREE.CylinderGeometry(0.11, 0.115, 0.04, 32), M('gold'), 0.02);
        const g = lathe(THREE, [[0.1, 0], [0.12, 0.012], [0.105, 0.03], [0.13, 0.055], [0.145, 0.1], [0.14, 0.15], [0.115, 0.2], [0.075, 0.235],
          [0.05, 0.25], [0.045, 0.262], [0.058, 0.275], [0.042, 0.292], [0.022, 0.305], [0, 0.31]], 64);
        ribs(g, 16, 0.06, 0.05, 0.215);
        mesh(g, M('goldOrnate'), 0.04);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.012, 10, 48), M('gold'));
        ring.rotation.x = Math.PI / 2; ring.position.y = y + 0.09; grp.add(ring);
        mesh(new THREE.SphereGeometry(0.03, 20, 14), M('gold'), 0.36);
        h = 0.39; break;
      }
      case 'ornateGold': { // octagonal filigree cap (Fahad)
        mesh(flat(lathe(THREE, [[0.12, 0], [0.19, 0.015], [0.2, 0.04], [0.2, 0.19], [0.185, 0.21], [0.0, 0.215]], 8, Math.PI / 8)), M('goldOrnate'));
        mesh(flat(lathe(THREE, [[0.12, 0], [0.13, 0.02], [0.08, 0.05], [0, 0.055]], 8, Math.PI / 8)), M('gold'), 0.212);
        h = 0.27; break;
      }
      case 'goldBlock': { // squared, brushed gold (Barakkat)
        mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 24), M('lacquer'), 0.015);
        mesh(roundBox(THREE, 0.34, 0.22, 0.28, 0.02, 0.02), M('goldBrushed'), 0.03);
        h = 0.25; break;
      }
      case 'blackTextured': { // black lacquer with a cross-hatched relief and a gold collar (Kaaf)
        mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 28), M('gold'), 0.02);
        mesh(roundBox(THREE, 0.3, 0.27, 0.17, 0.018, 0.02), M('lacquerHatch'), 0.04);
        h = 0.31; break;
      }
      case 'blackRibbed': { // fluted black cylinder over a fine gold ring (Viking)
        mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.025, 40), M('gold'), 0.0125);
        const g = lathe(THREE, [[0.14, 0], [0.15, 0.01], [0.15, 0.2], [0.14, 0.212], [0, 0.216]], 72);
        ribs(g, 28, 0.035, 0.012, 0.198);
        mesh(g, M('lacquer'), 0.025);
        h = 0.24; break;
      }
      case 'goldCylinder': { // polished gold drum (White Oud)
        mesh(lathe(THREE, [[0.15, 0], [0.165, 0.012], [0.165, 0.035], [0.155, 0.04], [0.16, 0.05], [0.16, 0.2], [0.15, 0.215], [0, 0.22]], 64), M('gold'));
        h = 0.22; break;
      }
      case 'roseSpray': { // tall rose-gold spray cap (Celoud)
        mesh(lathe(THREE, [[0.075, 0], [0.12, 0.005], [0.13, 0.03], [0.12, 0.055], [0.07, 0.06]], 48), M('rose'));
        mesh(lathe(THREE, [[0.12, 0], [0.13, 0.015], [0.13, 0.26], [0.115, 0.29], [0.06, 0.305], [0.055, 0.34], [0.04, 0.35], [0, 0.352]], 64), M('rose'), 0.06);
        h = 0.41; break;
      }
      default: h = 0;
    }
    return h;
  }

  /* ============================================================
     Bodies — each returns { h (body+cap height), w, label } where label
     describes where the photo label sits.
     ============================================================ */
  const BODIES = {
    // short octagonal glass with an ornate gold dome (attars)
    attar(THREE, grp, M, r) {
      const R = 0.24, H = 0.5;
      grp.add(new THREE.Mesh(flat(lathe(THREE, [[0, 0], [R * 0.93, 0], [R, 0.03], [R, H * 0.84], [R * 0.9, H * 0.93], [R * 0.5, H * 0.995], [0.09, H], [0.085, H + 0.035]], 8, Math.PI / 8)), M('glass')));
      grp.add(new THREE.Mesh(flat(lathe(THREE, [[0, 0.04], [R * 0.84, 0.04], [R * 0.87, 0.07], [R * 0.87, H * 0.8], [0, H * 0.8]], 8, Math.PI / 8)), M('liquid')));
      const capH = addCap(THREE, grp, M, r.cap || 'dome', H + 0.02);
      // label wraps the three front facets exactly
      return { h: H + 0.02 + capH, w: 2 * R, label: { type: 'facets', radius: R * 1.004, facets: 3, y0: 0.055, y1: H * 0.82 } };
    },
    // faceted black glass with a filigree gold cap (Fahad)
    faceted(THREE, grp, M, r) {
      const R = 0.3, H = 0.58;
      grp.add(new THREE.Mesh(flat(lathe(THREE, [[0, 0], [R * 0.9, 0], [R, 0.04], [R * 1.02, H * 0.62], [R * 0.95, H * 0.88], [R * 0.6, H * 0.98], [0.1, H], [0.1, H + 0.03]], 8, Math.PI / 8)), M('blackGlass')));
      const capH = addCap(THREE, grp, M, r.cap || 'ornateGold', H + 0.02);
      const apothem = R * 1.01 * Math.cos(Math.PI / 8);
      return { h: H + 0.02 + capH, w: 2 * R, label: { type: 'flat', z: apothem + 0.004, cy: H * 0.4, size: 0.3 } };
    },
    // square perfume flacon with a thick glass base (Barakkat, Kaaf, Viking)
    square(THREE, grp, M, r) {
      const w = r.w || 0.6, h = r.h || 0.6, d = r.d || 0.3, bev = 0.03;
      grp.add(new THREE.Mesh(roundBox(THREE, w, h, d, bev, 0.035), M('glass')));
      const inner = new THREE.ExtrudeGeometry(roundRectShape(THREE, w - 0.11, (h - 0.15) * 0.86, 0.025, 0.08), { depth: d - 0.12, bevelEnabled: false, curveSegments: 6 });
      inner.translate(0, 0, -(d - 0.12) / 2);
      grp.add(new THREE.Mesh(inner, M('liquid')));
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 24), M('glass')); neck.position.y = h + 0.02; grp.add(neck);
      const capH = addCap(THREE, grp, M, r.cap || 'goldBlock', h + 0.03);
      return { h: h + 0.03 + capH, w, label: { type: 'flat', z: d / 2 + 0.004, cy: h * 0.48, maxW: w * 0.84, maxH: h * 0.8 } };
    },
    // rounded cream body (White Oud) — a lathe squashed front-to-back
    pebble(THREE, grp, M, r) {
      const shell = new THREE.Group(); shell.scale.z = 0.62; grp.add(shell);
      shell.add(new THREE.Mesh(smoothLathe(THREE, [[0, 0], [0.3, 0], [0.352, 0.04], [0.372, 0.22], [0.358, 0.46], [0.3, 0.56], [0.15, 0.6], [0.09, 0.61]], 64), M('cream')));
      const capH = addCap(THREE, grp, M, r.cap || 'goldCylinder', 0.6);
      return { h: 0.6 + capH, w: 0.74, label: { type: 'curve', parent: shell, radius: 0.378, y0: 0.16, y1: 0.42, arc: 1.35 } };
    },
    // tall slim glass with rose-gold base and spray cap (Celoud)
    tall(THREE, grp, M, r) {
      const H = 0.72;
      grp.add(new THREE.Mesh(lathe(THREE, [[0, 0], [0.13, 0], [0.14, 0.02], [0.14, H * 0.92], [0.12, H * 0.98], [0.065, H], [0.065, H + 0.03]], 64), M('glass')));
      grp.add(new THREE.Mesh(lathe(THREE, [[0, 0.03], [0.118, 0.03], [0.12, 0.05], [0.12, H * 0.84], [0, H * 0.84]], 48), M('liquid')));
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.146, 0.146, 0.07, 64, 1, true), M('rose')); base.position.y = 0.035; grp.add(base);
      const capH = addCap(THREE, grp, M, r.cap || 'roseSpray', H + 0.02);
      return { h: H + 0.02 + capH, w: 0.3, label: { type: 'curve', radius: 0.144, y0: 0.3, y1: 0.46, arc: 1.5 } };
    },
    // gold domed vessel with a pierced lattice bowl (Giberish Signature)
    vessel(THREE, grp, M) {
      const add = (g, m) => { const o = new THREE.Mesh(g, m); grp.add(o); return o; };
      add(smoothLathe(THREE, [[0, 0], [0.24, 0], [0.25, 0.022], [0.22, 0.045], [0.13, 0.075], [0.09, 0.12], [0.1, 0.15], [0.165, 0.172]], 64, 32), M('gold'));
      add(smoothLathe(THREE, [[0.165, 0.17], [0.24, 0.215], [0.288, 0.29], [0.3, 0.375], [0.284, 0.455], [0.245, 0.5]], 64, 32), M('goldLattice'));
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.248, 0.016, 12, 64), M('gold')); band.rotation.x = Math.PI / 2; band.position.y = 0.505; grp.add(band);
      add(lathe(THREE, [[0.245, 0.5], [0.258, 0.52], [0.258, 0.56], [0.24, 0.58]], 64), M('gold'));
      add(smoothLathe(THREE, [[0.24, 0.58], [0.252, 0.6], [0.244, 0.68], [0.2, 0.78], [0.13, 0.86], [0.06, 0.9], [0.05, 0.93]], 64, 32), M('gold'));
      add(smoothLathe(THREE, [[0.05, 0.928], [0.07, 0.955], [0.05, 0.99], [0.022, 1.015], [0, 1.025]], 32, 16), M('gold'));
      return { h: 1.025, w: 0.6, label: { type: 'curve', radius: 0.247, radiusTop: 0.222, y0: 0.61, y1: 0.74, arc: 0.78 } };
    },
    // bronze bakhoor burner with lattice relief and glowing coals (Bakhoor Dani)
    burner(THREE, grp, M) {
      grp.add(new THREE.Mesh(smoothLathe(THREE, [[0, 0], [0.27, 0], [0.28, 0.02], [0.26, 0.05], [0.29, 0.12], [0.33, 0.3], [0.32, 0.45], [0.29, 0.53], [0.32, 0.62], [0.36, 0.7], [0.355, 0.72], [0.33, 0.71], [0, 0.665]], 72, 64), M('bronze')));
      [[0.05, 0.27], [0.53, 0.292]].forEach(([y, r]) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 10, 64), M('gold')); t.rotation.x = Math.PI / 2; t.position.y = y; grp.add(t); });
      const coalGeo = new THREE.IcosahedronGeometry(0.06, 0);
      [[0, 0], [0.12, 0.05], [-0.1, 0.08], [0.05, -0.12], [-0.08, -0.08], [0.16, -0.06], [-0.16, 0]].forEach(([x, z], i) => {
        const c = new THREE.Mesh(coalGeo, M('coal'));
        c.position.set(x, 0.69 + (i % 2) * 0.015, z); c.rotation.set(i, i * 1.7, i * 0.6); c.scale.setScalar(0.8 + (i % 3) * 0.2);
        grp.add(c);
      });
      return { h: 0.75, w: 0.72, label: { type: 'curve', radius: 0.334, radiusTop: 0.33, y0: 0.2, y1: 0.47, arc: 0.82 } };
    },
  };

  /* ============================================================
     Labels — a crop of the product's HD photo, masked, as a decal
     ============================================================ */
  function labelCanvas(img, crop, mask) {
    const sx = crop[0] * img.width, sy = crop[1] * img.height;
    const sw = (crop[2] - crop[0]) * img.width, sh = (crop[3] - crop[1]) * img.height;
    const k = Math.min(1, 1024 / Math.max(sw, sh));
    const c = document.createElement('canvas');
    c.width = Math.round(sw * k); c.height = Math.round(sh * k);
    const g = c.getContext('2d'), W = c.width, H = c.height;
    g.beginPath();
    if (mask === 'circle') g.arc(W / 2, H / 2, Math.min(W, H) / 2, 0, Math.PI * 2);
    else if (mask === 'oval') g.ellipse(W / 2, H / 2, W / 2, H / 2, 0, 0, Math.PI * 2);
    else if (mask === 'arch') { const r = W / 2; g.moveTo(0, H); g.lineTo(0, Math.min(H, r * 0.55)); g.quadraticCurveTo(0, 0, W / 2, 0); g.quadraticCurveTo(W, 0, W, Math.min(H, r * 0.55)); g.lineTo(W, H); g.closePath(); }
    else { const r = Math.min(W, H) * 0.05; g.roundRect ? g.roundRect(0, 0, W, H, r) : g.rect(0, 0, W, H); }
    g.clip();
    g.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    return c;
  }
  // text label: the name in gold on a dark plate (also the fallback when a photo crop fails)
  function textLabelCanvas(p) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 200;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(14,9,6,0.92)'; g.fillRect(10, 10, 492, 180);
    g.strokeStyle = 'rgba(226,182,98,0.95)'; g.lineWidth = 4; g.strokeRect(10, 10, 492, 180);
    g.textAlign = 'center'; g.fillStyle = '#f2d59b';
    g.font = '400 30px Jost, sans-serif';
    const house = (p.house || '').toUpperCase().split('').join(' ');
    g.fillText(house, 256, 64);
    g.font = '400 84px "Cormorant Garamond", serif';
    g.fillText(p.name, 256, 152, 470);
    return c;
  }
  async function addLabel(THREE, grp, M, p, r, spec, aniso) {
    if (!spec) return;
    let canvas = null;
    if (r.label && r.label.crop) {
      try { canvas = labelCanvas(await loadImage(p.image), r.label.crop, r.label.mask); } catch (_) { canvas = null; }
    }
    if (!canvas) {
      try { await document.fonts.load('400 40px "Cormorant Garamond"'); } catch (_) {}
      canvas = textLabelCanvas(p);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso;
    const mat = M.phys({ map: tex, transparent: true, roughness: 0.32, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.06, envMapIntensity: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const aspect = canvas.width / canvas.height;
    let geo, y;
    if (spec.type === 'facets') {
      const side = 2 * spec.radius * Math.sin(Math.PI / 8);
      const width = side * spec.facets;
      const h = Math.min(spec.y1 - spec.y0, width / aspect);
      geo = new THREE.CylinderGeometry(spec.radius, spec.radius, h, spec.facets, 1, true, -spec.facets * Math.PI / 8, spec.facets * Math.PI / 4);
      y = spec.y0 + (spec.y1 - spec.y0) / 2;
    } else if (spec.type === 'curve') {
      const h = Math.min(spec.y1 - spec.y0, (spec.radius * spec.arc) / aspect);
      const arc = (h * aspect) / spec.radius;
      geo = new THREE.CylinderGeometry(spec.radiusTop || spec.radius, spec.radius, h, 24, 1, true, -arc / 2, arc);
      y = spec.y0 + (spec.y1 - spec.y0) / 2;
    } else {
      let w = spec.size || spec.maxW, h = w / aspect;
      if (spec.maxH && h > spec.maxH) { h = spec.maxH; w = h * aspect; }
      geo = new THREE.PlaneGeometry(w, h);
      y = spec.cy;
    }
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, y, spec.type === 'flat' ? spec.z : 0);
    m.renderOrder = 2;
    (spec.parent || grp).add(m);
  }

  /* ============================================================
     create()
     ============================================================ */
  function create(THREE, p, opts = {}) {
    const r = recipe(p);
    const env = opts.envMap || (opts.renderer ? envMap(THREE, opts.renderer) : null);
    const quality = opts.quality || 'high';
    const M = materialKit(THREE, env, quality, r);
    const root = new THREE.Group();
    root.name = 'GibBottle3D:' + p.id;
    const body = new THREE.Group();
    root.add(body);
    const info = (BODIES[r.form] || BODIES.square)(THREE, body, M, r);
    const aniso = opts.renderer ? opts.renderer.capabilities.getMaxAnisotropy() : 8;
    const ready = opts.label === false ? Promise.resolve() : addLabel(THREE, body, M, p, r, info.label, aniso).catch(() => {});
    const k = opts.height ? opts.height / info.h : 1;
    body.scale.setScalar(k);
    root.userData = { product: p, recipe: r, height: info.h * k, width: info.w * k, ready, materials: M.all, quality };
    return root;
  }

  function setQuality(obj, q) {
    if (!obj || !obj.userData.materials || obj.userData.quality === q) return;
    obj.userData.quality = q;
    obj.userData.materials.forEach((m) => applyQuality(m, q));
  }
  function highlight(obj, k) {
    if (!obj || !obj.userData.materials) return;
    for (const m of obj.userData.materials) {
      m.envMapIntensity = m.userData.baseEnv * (1 + 0.6 * k);
      if (m.emissiveIntensity !== undefined && m.userData.baseEmi === undefined) m.userData.baseEmi = m.emissiveIntensity;
      if (m.userData.baseEmi !== undefined) m.emissiveIntensity = m.userData.baseEmi * (1 + 1.5 * k);
    }
  }
  function dispose(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.map) o.material.map.dispose();
    });
    (obj.userData.materials || []).forEach((m) => m.dispose());
  }

  /* ============================================================
     A small live viewer
     ============================================================ */
  function frameCamera(THREE, camera, bottle, aspect) {
    const h = bottle.userData.height, w = bottle.userData.width;
    const v = THREE.MathUtils.degToRad(camera.fov) / 2;
    const dist = Math.max((h * 0.62) / Math.tan(v), (w * 0.75) / (Math.tan(v) * aspect)) + w * 0.5;
    camera.position.set(0, h * 0.55, dist);
    camera.lookAt(0, h * 0.48, 0);
  }
  function viewerLights(THREE, scene) {
    const key = new THREE.DirectionalLight(0xfff0dc, 1.6); key.position.set(2, 3, 3); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffc88a, 1.2); rim.position.set(-3, 2, -2); scene.add(rim);
    scene.add(new THREE.AmbientLight(0x3a2a1c, 0.6));
  }

  async function mount(el, product, opts = {}) {
    const THREE = await load();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y';
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
    viewerLights(THREE, scene);
    const env = envMap(THREE, renderer);
    let bottle = null;
    let yaw = 0, vel = opts.autoRotate === false ? 0 : 0.45, dragX = null, raf = 0, visible = true, last = 0;
    function setProduct(p) {
      if (bottle) { scene.remove(bottle); dispose(bottle); }
      bottle = create(THREE, p, { envMap: env, renderer, quality: opts.quality || 'high' });
      scene.add(bottle);
      resize();
      return bottle.userData.ready;
    }
    function resize() {
      const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      if (bottle) frameCamera(THREE, camera, bottle, camera.aspect);
    }
    function loop(t) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016; last = t;
      if (dragX === null) yaw += vel * dt;
      if (bottle) bottle.rotation.y = yaw;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    const kick = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
    const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; kick(); });
    io.observe(el);
    const ro = new ResizeObserver(resize); ro.observe(el);
    const onVis = () => kick();
    document.addEventListener('visibilitychange', onVis);
    if (opts.drag !== false) {
      const c = renderer.domElement;
      c.addEventListener('pointerdown', (e) => { dragX = e.clientX; c.setPointerCapture(e.pointerId); });
      c.addEventListener('pointermove', (e) => { if (dragX === null) return; yaw += (e.clientX - dragX) * 0.012; dragX = e.clientX; });
      const up = () => { dragX = null; };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    }
    await setProduct(product);
    kick();
    return {
      get bottle() { return bottle; }, renderer, scene, camera, setProduct,
      dispose() { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); if (bottle) dispose(bottle); renderer.dispose(); renderer.domElement.remove(); },
    };
  }

  /* ============================================================
     snapshot() — a still render for 2D use
     ============================================================ */
  let snap = null;
  async function snapshot(product, w = 512, h = 640, opts = {}) {
    const THREE = await load();
    if (!snap) {
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      const scene = new THREE.Scene();
      viewerLights(THREE, scene);
      snap = { renderer, scene, camera: new THREE.PerspectiveCamera(28, 1, 0.01, 50), queue: Promise.resolve() };
    }
    // one snapshot at a time on the shared renderer
    const job = snap.queue.then(async () => {
      const { renderer, scene, camera } = snap;
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      renderer.setClearColor(opts.background || 0x000000, opts.background ? 1 : 0);
      const bottle = create(THREE, product, { renderer, quality: opts.quality || (opts.background ? 'high' : 'low') });
      bottle.rotation.y = opts.rotation || 0;
      scene.add(bottle);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      frameCamera(THREE, camera, bottle, camera.aspect);
      await bottle.userData.ready;
      renderer.render(scene, camera);
      const url = renderer.domElement.toDataURL('image/png');
      scene.remove(bottle); dispose(bottle);
      return url;
    });
    snap.queue = job.catch(() => {});
    return job;
  }

  window.GibBottle3D = { load, create, mount, snapshot, setQuality, highlight, envMap, recipe, dispose };
})();
