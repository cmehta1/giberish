/* ============================================================
   GIBERISH — ingredient illustrations
   Hand-built SVG art (resolution independent, so it stays sharp on any screen).
   GibArt.url(kind)   → data: URL for <img> / canvas
   GibArt.image(kind) → cached HTMLImageElement (for canvas drawing)
   GibArt.forIngredient(key) → art kinds that represent a catalogue ingredient
   ============================================================ */
(function () {
  const TAU = Math.PI * 2;
  const r2 = (n) => Math.round(n * 100) / 100;
  // tiny deterministic random so every render looks identical
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pol = (cx, cy, r, a) => [r2(cx + Math.cos(a) * r), r2(cy + Math.sin(a) * r)];
  const svg = (body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>${defs}</defs>${body}</svg>`;
  const gloss = `<radialGradient id="gloss" cx=".32" cy=".25" r=".45"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;

  function citrus(peelA, peelB, peelC, fleshA, fleshB, fleshC) {
    seed = 11;
    const n = 10, segs = [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU + .05, a1 = ((i + 1) / n) * TAU - .05;
      const [x0, y0] = pol(100, 100, 9, (a0 + a1) / 2);
      const [x1, y1] = pol(100, 100, 74, a0), [x2, y2] = pol(100, 100, 74, a1);
      segs.push(`<path d="M${x0} ${y0} L${x1} ${y1} A74 74 0 0 1 ${x2} ${y2} Z" fill="url(#fl)"/>`);
      for (let k = 0; k < 5; k++) { // juice vesicles
        const a = a0 + (a1 - a0) * (.2 + rnd() * .6), r = 22 + rnd() * 46;
        const [vx, vy] = pol(100, 100, r, a);
        segs.push(`<ellipse cx="${vx}" cy="${vy}" rx="${r2(1.4 + rnd() * 1.6)}" ry="${r2(5 + rnd() * 6)}" transform="rotate(${r2((a * 180) / Math.PI + 90)} ${vx} ${vy})" fill="#fff" opacity=".35"/>`);
      }
    }
    return svg(`
      <circle cx="100" cy="100" r="94" fill="url(#pe)"/>
      <circle cx="100" cy="100" r="94" fill="none" stroke="${peelC}" stroke-width="2" opacity=".5"/>
      <circle cx="100" cy="100" r="84" fill="#fff4dc"/>
      <circle cx="100" cy="100" r="78" fill="#fde7b8"/>
      ${segs.join('')}
      <circle cx="100" cy="100" r="7" fill="#fff4dc"/>
      <ellipse cx="72" cy="58" rx="46" ry="30" fill="url(#gloss)" transform="rotate(-30 72 58)"/>`,
    `<radialGradient id="pe" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="${peelA}"/><stop offset=".65" stop-color="${peelB}"/><stop offset="1" stop-color="${peelC}"/></radialGradient>
     <radialGradient id="fl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${fleshA}"/><stop offset=".45" stop-color="${fleshB}"/><stop offset="1" stop-color="${fleshC}"/></radialGradient>${gloss}`);
  }

  const ART = {
    orange: () => citrus('#ffb347', '#f2780f', '#a94308', '#fff3cf', '#ffbb4a', '#ff8414'),
    lemon: () => citrus('#fff38a', '#f1cf1b', '#a88a06', '#fffbe0', '#fff07a', '#f3d21e'),

    honey: () => svg(`
      <path d="M100 14 C108 40 164 96 164 134 A64 64 0 0 1 36 134 C36 96 92 40 100 14 Z" fill="url(#hg)"/>
      <path d="M100 14 C108 40 164 96 164 134 A64 64 0 0 1 36 134 C36 96 92 40 100 14 Z" fill="url(#hr)" />
      <path d="M62 112 C66 90 82 66 94 50" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".75"/>
      <ellipse cx="68" cy="132" rx="7" ry="12" fill="#fff" opacity=".55"/>
      <path d="M58 168 A56 56 0 0 0 150 150" stroke="#ffe7a0" stroke-width="3" fill="none" opacity=".7"/>`,
    `<radialGradient id="hg" cx=".45" cy=".7" r=".6"><stop offset="0" stop-color="#ffe08a"/><stop offset=".45" stop-color="#f3a51c"/><stop offset="1" stop-color="#9b4a02"/></radialGradient>
     <radialGradient id="hr" cx=".7" cy=".85" r=".5"><stop offset="0" stop-color="#ffd25c" stop-opacity=".9"/><stop offset="1" stop-color="#ffd25c" stop-opacity="0"/></radialGradient>`),

    honeycomb: () => {
      const cells = [], R = 22, w = Math.sqrt(3) * R;
      for (let row = -2; row <= 2; row++) for (let col = -2; col <= 2; col++) {
        const cx = 100 + col * w + (row % 2 ? w / 2 : 0), cy = 100 + row * R * 1.5;
        if (Math.hypot(cx - 100, cy - 100) > 78) continue;
        const pts = Array.from({ length: 6 }, (_, i) => pol(cx, cy, R - 2, (i / 6) * TAU + Math.PI / 6).join(',')).join(' ');
        const full = Math.hypot(cx - 100, cy - 100) < 50;
        cells.push(`<polygon points="${pts}" fill="${full ? 'url(#cell)' : 'url(#cellE)'}" stroke="#e9a93a" stroke-width="4" stroke-linejoin="round"/>`);
        if (full) cells.push(`<ellipse cx="${r2(cx - 6)}" cy="${r2(cy - 7)}" rx="5" ry="3" fill="#fff" opacity=".6"/>`);
      }
      return svg(cells.join(''), `<radialGradient id="cell" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffd977"/><stop offset=".6" stop-color="#eb9a17"/><stop offset="1" stop-color="#a65406"/></radialGradient>
        <radialGradient id="cellE" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#5b3108"/><stop offset="1" stop-color="#c47a1c"/></radialGradient>`);
    },

    rose: () => {
      const petal = (s, rot, fill) => `<path transform="translate(100 100) rotate(${rot}) scale(${s})" d="M0 4 C-34 -10 -44 -66 -6 -82 C2 -86 10 -86 16 -80 C46 -60 30 -10 0 4 Z" fill="${fill}" stroke="#4a0410" stroke-opacity=".35" stroke-width="1"/>`;
      let b = '';
      for (let i = 0; i < 7; i++) b += petal(1.08, i * (360 / 7), 'url(#p1)');
      for (let i = 0; i < 6; i++) b += petal(.82, i * 60 + 25, 'url(#p2)');
      for (let i = 0; i < 5; i++) b += petal(.58, i * 72 + 10, 'url(#p3)');
      for (let i = 0; i < 4; i++) b += petal(.36, i * 90 + 40, 'url(#p3)');
      b += `<path d="M100 100 m-10 0 a10 10 0 1 1 14 9 a6 6 0 1 1 -6 -12" stroke="#3e020c" stroke-width="3" fill="#7a0a1d"/>`;
      b += `<ellipse cx="78" cy="62" rx="34" ry="18" fill="url(#gloss)" transform="rotate(-35 78 62)" opacity=".5"/>`;
      return svg(b, `
        <linearGradient id="p1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4d0412"/><stop offset=".55" stop-color="#b3132e"/><stop offset="1" stop-color="#ef4a62"/></linearGradient>
        <linearGradient id="p2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5e0515"/><stop offset=".6" stop-color="#c71a37"/><stop offset="1" stop-color="#ff6b80"/></linearGradient>
        <linearGradient id="p3" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3f020d"/><stop offset=".6" stop-color="#a50f29"/><stop offset="1" stop-color="#e83a55"/></linearGradient>${gloss}`);
    },

    petal: () => svg(`
      <path d="M100 186 C40 160 18 92 46 44 C62 18 92 10 112 16 C150 28 182 80 168 126 C158 160 130 180 100 186 Z" fill="url(#pt)"/>
      <path d="M100 186 C40 160 18 92 46 44 C62 18 92 10 112 16 C150 28 182 80 168 126 C158 160 130 180 100 186 Z" fill="url(#ps)"/>
      <path d="M100 182 C96 130 98 80 110 30" stroke="#ff9fb0" stroke-width="2" fill="none" opacity=".45"/>
      <path d="M58 52 C70 30 96 22 116 26" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".35"/>`,
    `<radialGradient id="pt" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#ff6f86"/><stop offset=".55" stop-color="#c8183a"/><stop offset="1" stop-color="#6a0618"/></radialGradient>
     <linearGradient id="ps" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>`),

    jasmine: () => {
      let b = '';
      for (let i = 0; i < 6; i++) b += `<path transform="translate(100 100) rotate(${i * 60 + 8})" d="M0 0 C-22 -18 -24 -64 -2 -82 C2 -86 6 -86 10 -80 C28 -60 20 -18 0 0 Z" fill="url(#jw)" stroke="#d9cdb0" stroke-width="1"/>`;
      b += `<circle cx="100" cy="100" r="13" fill="url(#jc)"/>`;
      for (let i = 0; i < 5; i++) { const [x, y] = pol(100, 100, 6, i * 1.3); b += `<circle cx="${x}" cy="${y}" r="2.4" fill="#f2c94c"/>`; }
      return svg(b, `<linearGradient id="jw" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e9e1c4"/><stop offset=".35" stop-color="#fffdf6"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
        <radialGradient id="jc"><stop offset="0" stop-color="#fff2b0"/><stop offset="1" stop-color="#b9c76a"/></radialGradient>`);
    },

    saffron: () => {
      seed = 5;
      let b = '';
      for (let i = 0; i < 6; i++) {
        const sx = 60 + rnd() * 80, ex = 30 + rnd() * 140, cx = (sx + ex) / 2 + (rnd() - .5) * 80;
        const ey = 30 + rnd() * 40;
        b += `<path d="M${r2(sx)} 182 Q${r2(cx)} 110 ${r2(ex)} ${r2(ey)}" stroke="url(#sf)" stroke-width="${r2(4 + rnd() * 2)}" stroke-linecap="round" fill="none"/>`;
        b += `<path d="M${r2(ex - 7)} ${r2(ey - 6)} L${r2(ex + 7)} ${r2(ey - 8)} L${r2(ex + 1)} ${r2(ey + 10)} Z" fill="#e8301a"/>`;
      }
      return svg(b, `<linearGradient id="sf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffb02e"/><stop offset=".25" stop-color="#e2441a"/><stop offset="1" stop-color="#9c0d0a"/></linearGradient>`);
    },

    cinnamon: () => {
      const stick = (y, rot) => `<g transform="rotate(${rot} 100 100)">
        <rect x="24" y="${y}" width="150" height="30" rx="8" fill="url(#cn)"/>
        <rect x="24" y="${y + 3}" width="150" height="5" fill="#d38b4f" opacity=".45"/>
        <path d="M40 ${y + 20} L160 ${y + 19}" stroke="#4a1d07" stroke-opacity=".4" stroke-width="1.4"/>
        <ellipse cx="174" cy="${y + 15}" rx="8" ry="15" fill="#7a3615"/>
        <path d="M174 ${y + 15} m0 -9 a7 9 0 1 1 -3 16 a4 6 0 1 1 3 -10" stroke="#e4a26a" stroke-width="2" fill="none"/></g>`;
      return svg(stick(68, -18) + stick(98, -8), `<linearGradient id="cn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8672f"/><stop offset=".35" stop-color="#8d4318"/><stop offset="1" stop-color="#4f1d07"/></linearGradient>`);
    },

    vanilla: () => svg(`
      <path d="M22 160 C60 120 120 60 182 34" stroke="url(#vp)" stroke-width="15" stroke-linecap="round" fill="none"/>
      <path d="M30 152 C66 118 122 64 176 40" stroke="#a06a3a" stroke-width="2" fill="none" opacity=".55"/>
      <path d="M38 170 C76 132 132 80 190 54" stroke="url(#vp)" stroke-width="12" stroke-linecap="round" fill="none"/>
      <path d="M46 162 C84 128 134 84 184 60" stroke="#b07a46" stroke-width="1.6" fill="none" opacity=".5"/>
      <g transform="translate(150 140)">
        ${[0, 72, 144, 216, 288].map((r) => `<ellipse rx="10" ry="26" cy="-22" transform="rotate(${r})" fill="url(#vf)"/>`).join('')}
        <circle r="8" fill="#f2d468"/></g>`,
    `<linearGradient id="vp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a1f0e"/><stop offset=".5" stop-color="#20100a"/><stop offset="1" stop-color="#4a2a14"/></linearGradient>
     <linearGradient id="vf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e9e3a4"/><stop offset="1" stop-color="#fffbe8"/></linearGradient>`),

    anise: () => {
      let b = '';
      for (let i = 0; i < 8; i++) b += `<g transform="translate(100 100) rotate(${i * 45})">
        <path d="M0 -6 C-14 -30 -12 -70 0 -84 C12 -70 14 -30 0 -6 Z" fill="url(#an)" stroke="#2e1206" stroke-width="1.5"/>
        <ellipse cx="0" cy="-50" rx="5" ry="10" fill="url(#sd)"/></g>`;
      b += `<circle cx="100" cy="100" r="10" fill="#5b2a10"/>`;
      return svg(b, `<linearGradient id="an" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4a1f0a"/><stop offset=".6" stop-color="#8f4a1e"/><stop offset="1" stop-color="#5c2a0e"/></linearGradient>
        <radialGradient id="sd" cx=".35" cy=".3"><stop offset="0" stop-color="#e8b27a"/><stop offset="1" stop-color="#7a4018"/></radialGradient>`);
    },

    cardamom: () => svg(`
      <g transform="rotate(-30 100 100)">
        <path d="M100 20 C140 40 150 150 100 182 C50 150 60 40 100 20 Z" fill="url(#cd)"/>
        ${[-24, -12, 0, 12, 24].map((o) => `<path d="M${100 + o * .3} 28 C${100 + o} 80 ${100 + o} 130 ${100 + o * .3} 176" stroke="#56701f" stroke-opacity=".55" stroke-width="2" fill="none"/>`).join('')}
        <path d="M100 20 L100 8" stroke="#6d8a2c" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="86" cy="70" rx="9" ry="30" fill="#fff" opacity=".22"/></g>`,
    `<radialGradient id="cd" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#d5e89b"/><stop offset=".55" stop-color="#93b24c"/><stop offset="1" stop-color="#4f6a1c"/></radialGradient>`),

    sandalwood: () => svg(`
      <path d="M26 72 L150 40 L182 92 L170 150 L46 172 L18 120 Z" fill="url(#sw)"/>
      <path d="M150 40 L182 92 L170 150 L160 100 Z" fill="#8a5428" opacity=".55"/>
      <path d="M26 72 L150 40 L160 100 L36 124 Z" fill="#f6cf98" opacity=".25"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${30 + i * 3} ${92 + i * 12} C80 ${80 + i * 12} 120 ${88 + i * 11} 172 ${70 + i * 13}" stroke="#7a4520" stroke-opacity=".35" stroke-width="1.5" fill="none"/>`).join('')}`,
    `<linearGradient id="sw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8bd84"/><stop offset=".5" stop-color="#c58f55"/><stop offset="1" stop-color="#8f5a2c"/></linearGradient>`),

    oud: () => svg(`
      <path d="M20 96 L64 44 L132 34 L184 74 L170 140 L104 170 L40 150 Z" fill="url(#od)"/>
      <path d="M64 44 L132 34 L184 74 L120 80 Z" fill="#5a3218" opacity=".7"/>
      ${[0, 1, 2, 3].map((i) => `<path d="M${36 + i * 6} ${110 + i * 10} C80 ${96 + i * 12} 130 ${104 + i * 9} 174 ${90 + i * 12}" stroke="#a0602a" stroke-opacity=".5" stroke-width="${2 + (i % 2)}" fill="none"/>`).join('')}
      <circle cx="96" cy="70" r="3" fill="#e6a85c" opacity=".7"/><circle cx="140" cy="62" r="2" fill="#e6a85c" opacity=".7"/>
      <path d="M64 44 L132 34" stroke="#c98a4a" stroke-width="2" opacity=".5"/>`,
    `<linearGradient id="od" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a3016"/><stop offset=".5" stop-color="#2e170a"/><stop offset="1" stop-color="#170a04"/></linearGradient>`),

    amber: () => svg(`
      <path d="M40 70 L96 26 L160 50 L178 116 L130 170 L58 162 L24 112 Z" fill="url(#am)"/>
      <path d="M96 26 L160 50 L120 92 L70 76 Z" fill="#ffe7a8" opacity=".55"/>
      <path d="M160 50 L178 116 L120 92 Z" fill="#c86a08" opacity=".5"/>
      <path d="M120 92 L178 116 L130 170 Z" fill="#8f4200" opacity=".55"/>
      <path d="M40 70 L70 76 L58 162 L24 112 Z" fill="#ffd27a" opacity=".3"/>
      <ellipse cx="88" cy="56" rx="18" ry="7" fill="#fff" opacity=".7" transform="rotate(-20 88 56)"/>`,
    `<radialGradient id="am" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#ffd780"/><stop offset=".5" stop-color="#ee9a1a"/><stop offset="1" stop-color="#8a3d00"/></radialGradient>`),

    leaf: () => svg(`
      <path d="M20 180 C30 90 90 26 184 18 C178 110 120 172 20 180 Z" fill="url(#lf)"/>
      <path d="M20 180 C70 130 120 76 180 22" stroke="#d9f0a8" stroke-width="2.5" fill="none" opacity=".75"/>
      ${[0, 1, 2, 3, 4].map((i) => { const t = .2 + i * .15, x = 20 + 160 * t, y = 180 - 158 * t; return `<path d="M${r2(x)} ${r2(y)} q${-10 - i * 2} ${-26} ${-6 - i * 3} ${-44}" stroke="#d9f0a8" stroke-width="1.4" fill="none" opacity=".5"/><path d="M${r2(x)} ${r2(y)} q${26} ${10 + i} ${44} ${4 + i * 2}" stroke="#d9f0a8" stroke-width="1.4" fill="none" opacity=".5"/>`; }).join('')}
      <path d="M40 150 C60 90 110 44 170 30" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".16"/>`,
    `<linearGradient id="lf" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2f6a22"/><stop offset=".5" stop-color="#5f9e37"/><stop offset="1" stop-color="#a9d46a"/></linearGradient>`),

    musk: () => svg(`
      <circle cx="100" cy="100" r="80" fill="url(#mk)"/>
      ${[[100, 100, 34], [58, 62, 14], [148, 70, 18], [70, 146, 12], [142, 140, 10]].map(([x, y, s]) =>
        `<path d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z" fill="#fff"/>`).join('')}`,
    `<radialGradient id="mk"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff7ea" stop-opacity=".45"/><stop offset="1" stop-color="#fff7ea" stop-opacity="0"/></radialGradient>`),

    smoke: () => svg(`
      <g filter="url(#bl)" fill="none" stroke-linecap="round">
        <path d="M100 196 C70 160 130 130 96 96 C66 66 120 40 104 6" stroke="#efe4d2" stroke-width="10" opacity=".55"/>
        <path d="M110 196 C140 150 82 120 118 86 C150 56 96 34 120 4" stroke="#efe4d2" stroke-width="6" opacity=".4"/></g>`,
    `<filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>`),
  };

  const MAP = {
    rose: ['rose', 'petal', 'petal'], jasmine: ['jasmine'], oud: ['oud'], sandalwood: ['sandalwood'], cedar: ['sandalwood'],
    saffron: ['saffron'], amber: ['amber', 'honey'], musk: ['musk'], vanilla: ['vanilla'], citrus: ['orange', 'lemon'],
    cardamom: ['cardamom', 'anise'], leather: ['cinnamon'], smoke: ['smoke'],
  };

  const urls = {}, imgs = {};
  const photo = (kind) => (window.GIB_INGREDIENT_PHOTOS || {})[kind];
  const rr = (a, b) => a + Math.random() * (b - a);

  /* ---------- Motion: every ingredient moves in its own way ----------
     GibArt.draw(ctx, item, x, y, size, alpha, dt, fx)
       item: { kind, img? }  (the engine keeps its own clock/phase on the item)
       fx:   optional array that collects side effects (juice drops, honey drips, smoke wisps)
     GibArt.drawFx(ctx, fx, dt) draws and ages those effects.            */
  function sparkle(ctx, x, y, r, a) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
    ctx.restore();
  }

  function draw(ctx, it, x, y, s, alpha = 1, dt = .016, fx = null, blur = 0) {
    const img = it.img || GibArt.image(it.kind);
    if (!img.complete || !img.naturalWidth) return;
    if (it._t == null) { it._t = 0; it._ph = Math.random() * TAU; it._r0 = Math.random() * TAU; it._dir = Math.random() < .5 ? -1 : 1; }
    it._t += dt;
    const t = it._t + it._ph;
    let sx = 1, sy = 1, r = it._r0, ox = 0, oy = 0, a = alpha, comp = null, glint = 0;
    switch (it.kind) {
      case 'petal': { // 3D flip + tumble
        const f = Math.cos(t * 1.7); sx = Math.sign(f || 1) * Math.max(.12, Math.abs(f));
        sy = .6 + .4 * Math.abs(Math.cos(t * 1.1)); r += Math.sin(t * .7) * .9 * it._dir; break;
      }
      case 'rose': sy = .86 + .14 * Math.cos(t * 1.2); sx = .94 + .06 * Math.sin(t); r += Math.sin(t * .45) * .35; break;
      case 'leaf': r += Math.sin(t * 1.25) * .55; sx = .7 + .3 * Math.cos(t * 1.5); break;
      case 'jasmine': { const b = .78 + .26 * (.5 + .5 * Math.sin(t * 1.3)); sx = sy = b; r += t * .12 * it._dir; break; } // blooms open and closed
      case 'orange': case 'lemon':
        r += t * .32 * it._dir;
        if (fx && Math.random() < dt * 1.1) fx.push({ type: 'drop', x: x + rr(-.3, .3) * s, y: y + s * .25, vx: rr(-8, 8), vy: rr(5, 25), r: s * rr(.025, .045), c: it.kind === 'orange' ? '255,168,50' : '255,232,90', life: 0, max: rr(.9, 1.4) });
        break;
      case 'honey': { // drips, stretches, lets go
        const k = Math.max(0, Math.sin(t * 1.5)); sy = 1 + .22 * k; sx = 1 - .1 * k; oy = s * .1 * k; r = it._r0 * .15;
        if (fx && k > .97 && !it._dripped) { it._dripped = true; fx.push({ type: 'drop', x, y: y + s * .5, vx: 0, vy: 30, r: s * .08, c: '240,160,35', life: 0, max: 1.6 }); }
        if (k < .5) it._dripped = false;
        glint = Math.max(0, (Math.sin(t * 1.1) - .82) / .18); break;
      }
      case 'honeycomb': r = it._r0 + Math.sin(t * .6) * .25;
        if (fx && Math.random() < dt * .35) fx.push({ type: 'drop', x: x + rr(-.2, .2) * s, y: y + s * .35, vx: 0, vy: 15, r: s * .05, c: '240,160,35', life: 0, max: 1.4 });
        break;
      case 'saffron': r = it._r0 * .3 + Math.sin(t * 1.05) * .5; ox = Math.sin(t * .8) * s * .08; break; // drifts and sways
      case 'oud': case 'sandalwood': // tumbles, leaves a faint wisp
        r += t * .45 * it._dir;
        if (fx && Math.random() < dt * 1.6) fx.push({ type: 'wisp', x: x + rr(-.15, .15) * s, y: y - s * .2, vx: rr(-5, 5), vy: rr(-22, -12), r: s * .1, life: 0, max: rr(1.6, 2.4) });
        break;
      case 'smoke': { // curls upward and fades, then starts again
        const c = (t * .32) % 1; ox = Math.sin(t * 1.6) * s * .18; oy = -c * s * .7; sx = sy = .75 + c * .6; a *= Math.sin(c * Math.PI); r = Math.sin(t * .9) * .25; break;
      }
      case 'musk': { const p = .5 + .5 * Math.sin(t * 2); sx = sy = .8 + .35 * p; a *= .5 + .5 * p; comp = 'lighter'; break; } // glows and pulses
      case 'amber': r += Math.sin(t * .55) * .45; glint = Math.max(0, (Math.sin(t * 1.25) - .8) / .2); break; // light-sweep glint
      default: r += t * .3 * it._dir; // cinnamon, vanilla, anise, cardamom: slow tumble
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    if (comp) ctx.globalCompositeOperation = comp;
    if (blur) ctx.filter = `blur(${blur}px) brightness(.75)`;
    ctx.translate(x + ox, y + oy);
    ctx.rotate(r);
    ctx.scale(sx, sy);
    ctx.drawImage(img, -s / 2, -s / 2, s, s);
    ctx.restore();
    if (glint > 0) sparkle(ctx, x + ox - s * .18, y + oy - s * .22, s * .32 * glint, glint * a);
  }

  function drawFx(ctx, fx, dt) {
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.life += dt;
      if (f.life > f.max) { fx.splice(i, 1); continue; }
      const k = 1 - f.life / f.max;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.type === 'drop') {
        f.vy += 140 * dt;
        const g = ctx.createRadialGradient(f.x - f.r * .3, f.y - f.r * .3, 0, f.x, f.y, f.r);
        g.addColorStop(0, `rgba(255,250,230,${k})`); g.addColorStop(.4, `rgba(${f.c},${k})`); g.addColorStop(1, `rgba(${f.c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * .8, f.r * (1 + Math.min(.8, f.vy / 300)), 0, 0, TAU); ctx.fill();
      } else {
        f.r += dt * 10; f.vx *= .98;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
        g.addColorStop(0, `rgba(235,222,205,${Math.sin(k * Math.PI) * .16})`); g.addColorStop(1, 'rgba(235,222,205,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
      }
    }
  }

  window.GibArt = {
    kinds: Object.keys(ART),
    draw, drawFx,
    // Vector art by default. To use HD photos later, add square transparent PNGs to
    // GIB_INGREDIENT_PHOTOS in data.js (e.g. orange: 'assets/img/ingredients/orange.png').
    url(kind) {
      if (photo(kind)) return photo(kind);
      if (!urls[kind]) urls[kind] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent((ART[kind] || ART.musk)());
      return urls[kind];
    },
    image(kind) {
      if (!imgs[kind]) { const im = new Image(); im.decoding = 'async'; im.src = this.url(kind); imgs[kind] = im; }
      return imgs[kind];
    },
    forIngredient(key) { return MAP[key] || ['musk']; },
  };
})();
