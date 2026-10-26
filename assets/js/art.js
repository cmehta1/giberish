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

    /* ---- fruits ---- */
    apple: () => {
      const body = 'M100 58 C84 40 34 40 26 94 C20 140 52 186 82 184 C92 183 98 179 100 179 C102 179 108 183 118 184 C148 186 180 140 174 94 C166 40 116 40 100 58 Z';
      seed = 21;
      let dots = '';
      for (let i = 0; i < 18; i++) { const [x, y] = pol(100, 112, 18 + rnd() * 52, rnd() * TAU); dots += `<circle cx="${x}" cy="${y}" r="${r2(.9 + rnd() * .9)}" fill="#f4ffd0" opacity=".45"/>`; }
      return svg(`
        <path d="${body}" fill="url(#ap)"/>
        <path d="${body}" fill="url(#as)"/>
        ${dots}
        <ellipse cx="100" cy="60" rx="17" ry="6" fill="#2f5c0e" opacity=".5"/>
        <path d="M100 62 C100 46 104 32 112 20" stroke="#5a3a1c" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M108 32 C118 12 150 6 172 16 C160 38 130 46 108 32 Z" fill="url(#al)"/>
        <path d="M108 32 C128 26 150 20 170 17" stroke="#d6efa0" stroke-width="1.5" fill="none" opacity=".7"/>
        <path d="M93 177 q7 -5 14 0" stroke="#3b6a12" stroke-width="2" fill="none" opacity=".6"/>
        <ellipse cx="60" cy="92" rx="15" ry="32" fill="url(#gloss)" transform="rotate(18 60 92)"/>`,
      `<radialGradient id="ap" cx=".38" cy=".38" r=".75"><stop offset="0" stop-color="#eefaa8"/><stop offset=".45" stop-color="#a6d64c"/><stop offset="1" stop-color="#3c7a18"/></radialGradient>
       <linearGradient id="as" x1="0" y1="0" x2="1" y2="1"><stop offset=".45" stop-color="#1c3c08" stop-opacity="0"/><stop offset="1" stop-color="#1c3c08" stop-opacity=".45"/></linearGradient>
       <linearGradient id="al" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2f6a22"/><stop offset="1" stop-color="#8fc458"/></linearGradient>${gloss}`);
    },

    peach: () => {
      const body = 'M100 48 C140 38 182 72 180 118 C178 162 142 188 100 186 C58 188 22 162 20 118 C18 72 60 38 100 48 Z';
      return svg(`
        <path d="${body}" fill="url(#pb)"/>
        <path d="${body}" fill="url(#pr)"/>
        <path d="${body}" fill="url(#pf)"/>
        <path d="${body}" fill="none" stroke="#ffe2cc" stroke-width="3" opacity=".25"/>
        <path d="M106 52 C94 86 94 138 106 180" stroke="#ffd6bc" stroke-width="5" fill="none" opacity=".28"/>
        <path d="M100 50 C86 84 86 140 98 184" stroke="#8e1e22" stroke-width="3" fill="none" opacity=".5"/>
        <path d="M100 50 L97 36" stroke="#5a3a1c" stroke-width="5" stroke-linecap="round"/>
        <path d="M98 40 C80 14 46 12 28 24 C46 48 80 52 98 40 Z" fill="url(#pl)"/>
        <path d="M98 40 C76 32 52 26 30 24" stroke="#d6efa0" stroke-width="1.5" fill="none" opacity=".7"/>`,
      `<radialGradient id="pb" cx=".7" cy=".75" r=".75"><stop offset="0" stop-color="#ffd890"/><stop offset=".55" stop-color="#ffaa5c"/><stop offset="1" stop-color="#d9662e"/></radialGradient>
       <radialGradient id="pr" cx=".32" cy=".34" r=".62"><stop offset="0" stop-color="#e2343c" stop-opacity=".95"/><stop offset=".55" stop-color="#ef5a48" stop-opacity=".6"/><stop offset="1" stop-color="#ef5a48" stop-opacity="0"/></radialGradient>
       <radialGradient id="pf" cx=".36" cy=".3" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
       <linearGradient id="pl" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2f6a22"/><stop offset="1" stop-color="#8fc458"/></linearGradient>`);
    },

    raspberry: () => {
      const pts = [];
      for (let row = 0; row < 9; row++) {
        const y = 48 + row * 17;
        for (let col = -5; col <= 5; col++) {
          const x = 100 + col * 19 + (row % 2 ? 9.5 : 0);
          const rx = 64 * (1 - Math.max(0, y - 108) / 220);
          if (((x - 100) / rx) ** 2 + ((y - 110) / 72) ** 2 <= .92) pts.push([x, y]);
        }
      }
      pts.sort((p, q) => Math.hypot(q[0] - 100, q[1] - 112) - Math.hypot(p[0] - 100, p[1] - 112));
      let b = `<ellipse cx="100" cy="112" rx="64" ry="74" fill="#4a0314"/>`;
      for (const [x, y] of pts) b += `<circle cx="${r2(x)}" cy="${y}" r="12" fill="url(#rd)"/><circle cx="${r2(x - 4)}" cy="${y - 4}" r="2.6" fill="#fff" opacity=".7"/>`;
      b += `<ellipse cx="100" cy="112" rx="66" ry="76" fill="url(#rs)"/>`;
      for (let i = 0; i < 6; i++) b += `<path transform="translate(100 42) rotate(${-150 + i * 24})" d="M0 -3 C10 -6 26 -3 36 0 C26 3 10 6 0 3 Z" fill="url(#rc)"/>`;
      b += `<path d="M100 42 L102 24" stroke="#4f7a24" stroke-width="5" stroke-linecap="round"/>`;
      return svg(`<g transform="rotate(-10 100 110)">${b}</g>`,
        `<radialGradient id="rd" cx=".38" cy=".34" r=".7"><stop offset="0" stop-color="#ff7d98"/><stop offset=".5" stop-color="#d4173f"/><stop offset="1" stop-color="#6a0420"/></radialGradient>
         <radialGradient id="rs" cx=".42" cy=".38" r=".62"><stop offset=".6" stop-color="#2a0010" stop-opacity="0"/><stop offset="1" stop-color="#2a0010" stop-opacity=".55"/></radialGradient>
         <linearGradient id="rc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3f6a1a"/><stop offset="1" stop-color="#9cc860"/></linearGradient>`);
    },

    blackcurrant: () => {
      const berries = [[128, 50, 19, 82, 40], [64, 80, 22, 94, 66], [136, 100, 24, 104, 88], [74, 128, 25, 110, 112], [140, 150, 24, 116, 138], [100, 172, 22, 117, 156]];
      let b = `<path d="M50 14 C74 32 96 60 106 88 C114 110 118 134 117 160" stroke="#5c6a26" stroke-width="3.5" stroke-linecap="round" fill="none"/>`;
      for (const [x, y, , sx, sy] of berries) b += `<path d="M${sx} ${sy} Q${(sx + x) / 2} ${Math.min(sy, y) - 8} ${x} ${y}" stroke="#5c6a26" stroke-width="2" fill="none"/>`;
      for (const [x, y, r] of berries) {
        const cx = r2(x + r * .32), cy = r2(y + r * .52);
        b += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#bc)" stroke="#8a5aa8" stroke-opacity=".55" stroke-width="1.4"/>
          <ellipse cx="${r2(x - r * .36)}" cy="${r2(y - r * .38)}" rx="${r2(r * .2)}" ry="${r2(r * .13)}" fill="#fff" opacity=".7" transform="rotate(-35 ${r2(x - r * .36)} ${r2(y - r * .38)})"/>
          <path d="M${cx - 3} ${cy} L${cx + 3} ${cy} M${cx} ${cy - 3} L${cx} ${cy + 3}" stroke="#2a1608" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
      }
      return svg(b, `<radialGradient id="bc" cx=".36" cy=".32" r=".72"><stop offset="0" stop-color="#c39ae0"/><stop offset=".28" stop-color="#6c3a92"/><stop offset=".72" stop-color="#2c0c3e"/><stop offset="1" stop-color="#13041c"/></radialGradient>`);
    },

    bergamot: () => {
      seed = 31;
      let dim = '';
      for (let i = 0; i < 70; i++) {
        const [x, y] = pol(82, 90, Math.sqrt(rnd()) * 58, rnd() * TAU), d = r2(1.2 + rnd() * 1.4);
        dim += `<circle cx="${x}" cy="${y}" r="${d}" fill="#4e7418" opacity=".3"/><circle cx="${r2(x - .9)}" cy="${r2(y - .9)}" r="${r2(d * .6)}" fill="#fffbd0" opacity=".3"/>`;
      }
      const n = 9, segs = [];
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * TAU + .06, a1 = ((i + 1) / n) * TAU - .06;
        const [x0, y0] = pol(148, 148, 5, (a0 + a1) / 2), [x1, y1] = pol(148, 148, 37, a0), [x2, y2] = pol(148, 148, 37, a1);
        segs.push(`<path d="M${x0} ${y0} L${x1} ${y1} A37 37 0 0 1 ${x2} ${y2} Z" fill="url(#bf)"/>`);
      }
      return svg(`
        <path d="M82 20 C122 20 150 54 148 94 C146 134 118 160 82 160 C46 160 16 134 16 94 C16 54 42 20 82 20 Z" fill="url(#bp)"/>
        ${dim}
        <ellipse cx="82" cy="24" rx="7" ry="4" fill="#5a7a1c"/>
        <path d="M82 22 L84 12" stroke="#4f6a1c" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="56" cy="58" rx="30" ry="18" fill="url(#gloss)" transform="rotate(-35 56 58)"/>
        <circle cx="148" cy="148" r="46" fill="url(#br)"/>
        <circle cx="148" cy="148" r="41" fill="#fbf6d4"/>
        ${segs.join('')}
        <circle cx="148" cy="148" r="4" fill="#fbf6d4"/>
        <ellipse cx="132" cy="128" rx="18" ry="10" fill="url(#gloss)" transform="rotate(-30 132 128)"/>`,
      `<radialGradient id="bp" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#f6f7a4"/><stop offset=".5" stop-color="#c6da4e"/><stop offset="1" stop-color="#58861a"/></radialGradient>
       <radialGradient id="br" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#e4ee70"/><stop offset="1" stop-color="#7ea42a"/></radialGradient>
       <radialGradient id="bf" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbd0"/><stop offset=".5" stop-color="#eef08a"/><stop offset="1" stop-color="#cfdc52"/></radialGradient>${gloss}`);
    },

    /* ---- flowers ---- */
    peony: () => {
      const petal = (s, rot, fill) => `<path transform="translate(100 102) rotate(${rot}) scale(${s})" d="M0 6 C-26 -2 -44 -40 -34 -66 C-30 -78 -20 -80 -14 -76 C-10 -86 0 -88 4 -80 C10 -88 22 -86 26 -76 C36 -72 42 -56 36 -40 C28 -14 18 -2 0 6 Z" fill="${fill}" stroke="#a88a7a" stroke-opacity=".45" stroke-width="1"/>`;
      let b = '';
      for (let i = 0; i < 8; i++) b += petal(1.1, i * 45, 'url(#q1)');
      for (let i = 0; i < 7; i++) b += petal(.86, i * (360 / 7) + 22, 'url(#q1)');
      for (let i = 0; i < 6; i++) b += petal(.64, i * 60 + 10, 'url(#q2)');
      for (let i = 0; i < 5; i++) b += petal(.44, i * 72 + 36, 'url(#q2)');
      for (let i = 0; i < 6; i++) { const [x, y] = pol(100, 102, 7, i * 1.1); b += `<circle cx="${x}" cy="${y}" r="2.6" fill="#f2c64a"/>`; }
      for (let i = 0; i < 4; i++) b += petal(.24, i * 90 + 20, 'url(#q3)');
      b += `<ellipse cx="76" cy="64" rx="34" ry="18" fill="url(#gloss)" transform="rotate(-35 76 64)" opacity=".45"/>`;
      return svg(b, `
        <linearGradient id="q1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#cfae9c"/><stop offset=".45" stop-color="#f6e8dc"/><stop offset="1" stop-color="#fffbf4"/></linearGradient>
        <linearGradient id="q2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e4b4b4"/><stop offset=".5" stop-color="#fbeee6"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
        <linearGradient id="q3" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e8aab0"/><stop offset="1" stop-color="#fff4f0"/></linearGradient>${gloss}`);
    },

    orangeblossom: () => {
      const flower = (cx, cy, s, rot) => {
        let f = '';
        for (let i = 0; i < 5; i++) f += `<path transform="rotate(${i * 72})" d="M0 -4 C-15 -16 -17 -44 0 -54 C17 -44 15 -16 0 -4 Z" fill="url(#ow)" stroke="#cfc2a4" stroke-width=".8"/>`;
        for (let i = 0; i < 9; i++) { const [x, y] = pol(0, 0, 13, (i / 9) * TAU); f += `<path d="M0 0 L${x} ${y}" stroke="#e8d48a" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="2.6" fill="#f5c22a"/>`; }
        return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">${f}<circle r="5" fill="url(#oc)"/></g>`;
      };
      const bud = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 14 C-9 8 -10 -8 0 -18 C10 -8 9 8 0 14 Z" fill="url(#ow)" stroke="#cfc2a4" stroke-width=".8"/><path d="M-5 12 L0 20 L5 12 Z" fill="#6a9a32"/></g>`;
      return svg(`
        <path d="M110 192 C104 160 86 120 70 84 M108 170 C118 140 128 120 134 98 M104 180 C100 160 98 150 96 140 M120 150 C138 100 146 70 152 44 M96 176 C76 160 62 150 52 140" stroke="#5c7a2a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M108 168 C80 170 44 186 26 176 C40 150 84 150 108 168 Z" fill="url(#ol)"/>
        <path d="M112 160 C134 150 168 154 184 138 C164 124 128 136 112 160 Z" fill="url(#ol)"/>
        <path d="M108 168 C80 168 52 176 30 176 M112 160 C140 150 162 144 182 139" stroke="#a8d080" stroke-width="1.2" fill="none" opacity=".5"/>
        ${bud(152, 40, 15)}${bud(50, 138, -50)}
        ${flower(70, 80, 1, 10)}${flower(134, 98, .88, -20)}${flower(96, 140, .76, 34)}`,
      `<linearGradient id="ow" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e6dcc0"/><stop offset=".4" stop-color="#fffcf2"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
       <radialGradient id="oc" cx=".4" cy=".35"><stop offset="0" stop-color="#e6f08a"/><stop offset="1" stop-color="#8aa830"/></radialGradient>
       <linearGradient id="ol" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1f4a16"/><stop offset="1" stop-color="#5f9a36"/></linearGradient>`);
    },

    orchid: () => svg(`
      <path d="M100 96 C82 76 80 30 100 16 C120 30 118 76 100 96 Z" fill="url(#oa)"/>
      <path d="M100 96 C82 76 80 30 100 16 C120 30 118 76 100 96 Z" fill="url(#oa)" transform="rotate(140 100 96)"/>
      <path d="M100 96 C82 76 80 30 100 16 C120 30 118 76 100 96 Z" fill="url(#oa)" transform="rotate(-140 100 96)"/>
      <g id="op"><path d="M100 98 C86 70 50 44 24 56 C2 68 8 116 38 122 C62 126 90 112 100 98 Z" fill="url(#ob)"/>
        ${[[-6, 46, 34, 68], [-2, 34, 58, 100], [2, 46, 92, 116]].map(([a, x1, x2, y2]) => `<path d="M${98 + a} 98 Q${x1 + 20} ${(98 + y2) / 2 - 6} ${x2 - 6} ${y2 - 30}" stroke="#a42a86" stroke-opacity=".3" stroke-width="1.4" fill="none"/>`).join('')}</g>
      <use href="#op" transform="translate(200 0) scale(-1 1)"/>
      <ellipse cx="86" cy="118" rx="8" ry="13" fill="#b2207a" transform="rotate(-20 86 118)"/>
      <ellipse cx="114" cy="118" rx="8" ry="13" fill="#b2207a" transform="rotate(20 114 118)"/>
      <path d="M100 106 C86 108 76 124 80 142 C84 160 96 166 100 176 C104 166 116 160 120 142 C124 124 114 108 100 106 Z" fill="url(#oi)"/>
      <path d="M100 176 C96 182 90 186 86 186 M100 176 C104 182 110 186 114 186" stroke="#8a0f5e" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="100" cy="116" rx="8" ry="6" fill="#ffd34e"/>
      <circle cx="97" cy="115" r="1.4" fill="#c4202a"/><circle cx="103" cy="117" r="1.4" fill="#c4202a"/><circle cx="100" cy="119" r="1.2" fill="#c4202a"/>
      <ellipse cx="100" cy="100" rx="6" ry="9" fill="#fff6fb"/>
      <ellipse cx="54" cy="70" rx="22" ry="10" fill="#fff" opacity=".28" transform="rotate(-25 54 70)"/>`,
    `<radialGradient id="oa" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#fbe4f4"/><stop offset=".5" stop-color="#e48ad0"/><stop offset="1" stop-color="#a8379a"/></radialGradient>
     <radialGradient id="ob" cx=".85" cy=".7" r=".95"><stop offset="0" stop-color="#fde6f6"/><stop offset=".45" stop-color="#ee9ad8"/><stop offset="1" stop-color="#b03e9e"/></radialGradient>
     <linearGradient id="oi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d63a94"/><stop offset=".55" stop-color="#9c1068"/><stop offset="1" stop-color="#5e0640"/></linearGradient>`),

    /* ---- gourmand ---- */
    cottoncandy: () => {
      seed = 41;
      const puffs = [[100, 40, 26], [76, 54, 30], [126, 56, 30], [56, 86, 32], [144, 88, 34], [100, 78, 42], [72, 118, 30], [130, 118, 30], [100, 120, 36]];
      let wisps = '';
      for (let i = 0; i < 16; i++) {
        const [x, y] = pol(100, 84, 20 + rnd() * 46, rnd() * TAU), a = rnd() * TAU, l = 10 + rnd() * 14;
        const [x2, y2] = pol(x, y, l, a);
        wisps += `<path d="M${x} ${y} Q${r2((x + x2) / 2 + 6)} ${r2((y + y2) / 2 - 6)} ${x2} ${y2}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".45" stroke-linecap="round"/>`;
      }
      return svg(`
        <path d="M86 132 L114 132 L102 194 L98 194 Z" fill="url(#cn)"/>
        <path d="M90 146 L112 140 M94 162 L109 156 M97 178 L106 174" stroke="#f08ab8" stroke-width="3" opacity=".7"/>
        <g filter="url(#cb)">${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#cc)"/>`).join('')}</g>
        ${wisps}
        <ellipse cx="80" cy="56" rx="24" ry="14" fill="#fff" opacity=".3" transform="rotate(-25 80 56)" filter="url(#cb)"/>`,
      `<radialGradient id="cc" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff2f8"/><stop offset=".55" stop-color="#ffb4d6"/><stop offset="1" stop-color="#e4639e"/></radialGradient>
       <linearGradient id="cn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8c6a8"/><stop offset=".45" stop-color="#fff8ea"/><stop offset="1" stop-color="#c8b494"/></linearGradient>
       <filter id="cb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>`);
    },

    marshmallow: () => {
      const cyl = (cx, cy, w, h, rot, g, top) => `<g transform="translate(${cx} ${cy}) rotate(${rot})">
        <path d="M${-w / 2} ${-h / 2} L${-w / 2} ${h / 2} A${w / 2} ${r2(w * .24)} 0 0 0 ${w / 2} ${h / 2} L${w / 2} ${-h / 2} Z" fill="url(#${g})" stroke="url(#${g})" stroke-width="6" stroke-linejoin="round"/>
        <ellipse cy="${-h / 2}" rx="${w / 2}" ry="${r2(w * .24)}" fill="url(#${top})"/>
        <ellipse cx="${r2(-w * .16)}" cy="${r2(-h / 2 - w * .04)}" rx="${r2(w * .2)}" ry="${r2(w * .07)}" fill="#fff" opacity=".7"/></g>`;
      seed = 51;
      let dust = '';
      for (let i = 0; i < 26; i++) dust += `<circle cx="${r2(40 + rnd() * 120)}" cy="${r2(40 + rnd() * 130)}" r="${r2(.6 + rnd() * 1.1)}" fill="#fff" opacity="${r2(.25 + rnd() * .4)}"/>`;
      return svg(`
        ${cyl(134, 70, 62, 58, 72, 'mp', 'mq')}
        ${cyl(76, 104, 72, 74, -8, 'mw', 'mt')}
        ${cyl(140, 146, 54, 50, 18, 'mw', 'mt')}
        ${dust}`,
      `<linearGradient id="mw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cbbab4"/><stop offset=".32" stop-color="#fffbf8"/><stop offset=".68" stop-color="#f4ece8"/><stop offset="1" stop-color="#b9a6a0"/></linearGradient>
       <radialGradient id="mt" cx=".4" cy=".4"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#efe4de"/></radialGradient>
       <linearGradient id="mp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d98aa8"/><stop offset=".32" stop-color="#ffdce8"/><stop offset=".68" stop-color="#f9c4d6"/><stop offset="1" stop-color="#b86a88"/></linearGradient>
       <radialGradient id="mq" cx=".4" cy=".4"><stop offset="0" stop-color="#fff2f6"/><stop offset="1" stop-color="#f5c2d4"/></radialGradient>`);
    },

    tonka: () => {
      const bean = 'M-74 6 C-72 -22 -32 -32 10 -30 C46 -28 74 -18 76 0 C78 18 50 30 12 30 C-32 32 -76 28 -74 6 Z';
      const wrinkles = (sd) => {
        seed = sd;
        let w = '';
        for (let i = 0; i < 22; i++) {
          const x = -64 + rnd() * 114, y = -22 + rnd() * 44, l = 16 + rnd() * 26, k = (rnd() - .5) * 10;
          w += `<path d="M${r2(x)} ${r2(y)} q${r2(l / 2)} ${r2(k)} ${r2(l)} ${r2(k * .3)}" stroke="#0c0402" stroke-width="2.2" fill="none" opacity=".7" stroke-linecap="round"/>
            <path d="M${r2(x + 1)} ${r2(y - 2)} q${r2(l / 2)} ${r2(k)} ${r2(l)} ${r2(k * .3)}" stroke="#b07c54" stroke-width="1.1" fill="none" opacity=".4" stroke-linecap="round"/>`;
        }
        return w;
      };
      const one = (x, y, rot, s, sd) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
        <path d="${bean}" fill="url(#tk)" stroke="#94603c" stroke-opacity=".6" stroke-width="1.6"/>
        <g clip-path="url(#tc)">${wrinkles(sd)}</g>
        <path d="M-52 -18 C-20 -28 30 -28 58 -16" stroke="#d8a678" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/></g>`;
      return svg(one(108, 74, -18, .92, 61) + one(96, 124, 12, 1.05, 67),
        `<radialGradient id="tk" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#74462a"/><stop offset=".5" stop-color="#3c1e10"/><stop offset="1" stop-color="#170904"/></radialGradient>
         <clipPath id="tc"><path d="${bean}"/></clipPath>`);
    },

    caramel: () => { // a glossy pool of caramel, swirled from above, one drip running off
      const pool = 'M100 26 C142 24 178 56 178 100 C178 138 154 166 122 172 C116 174 114 182 113 190 C112 198 103 198 103 190 C103 182 101 176 94 176 C54 176 22 146 22 100 C22 58 58 28 100 26 Z';
      const sp = [];
      for (let i = 0; i <= 90; i++) { const k = i / 90, [x, y] = pol(100, 100, 5 + k * 60, k * TAU * 2.6 - 1); sp.push(`${x} ${y}`); }
      const d = 'M' + sp.join(' L');
      return svg(`
        <path d="${pool}" fill="url(#cr)" stroke="#6a3008" stroke-opacity=".5" stroke-width="2"/>
        <path d="${d}" stroke="#7a3a0a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".5"/>
        <path d="${d}" stroke="#ffe7b0" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".55" transform="translate(-2.5 -3)"/>
        <ellipse cx="70" cy="58" rx="30" ry="14" fill="url(#gloss)" transform="rotate(-30 70 58)"/>
        <ellipse cx="108" cy="186" rx="3" ry="5" fill="#fff" opacity=".5"/>`,
      `<radialGradient id="cr" cx=".4" cy=".36" r=".72"><stop offset="0" stop-color="#ffd890"/><stop offset=".5" stop-color="#e09434"/><stop offset="1" stop-color="#8a4410"/></radialGradient>${gloss}`);
    },

    cocoa: () => {
      const dust = (cx, cy, r, n, sd) => {
        seed = sd;
        let d = '';
        for (let i = 0; i < n; i++) {
          const a = rnd() * TAU, rr0 = Math.sqrt(rnd()) * r * .95, [x, y] = pol(cx, cy, rr0, a);
          const top = y < cy ? .5 : .25;
          d += `<circle cx="${x}" cy="${y}" r="${r2(.8 + rnd() * 1.6)}" fill="#c4906a" opacity="${r2(top * (.4 + rnd() * .8))}"/>`;
        }
        return d;
      };
      return svg(`
        <circle cx="150" cy="66" r="36" fill="url(#ck)" stroke="#7a4a2c" stroke-opacity=".5" stroke-width="1.5"/>
        ${dust(150, 66, 36, 60, 71)}
        <path d="M36 112 C34 74 64 48 100 48 C138 48 164 76 162 114 C160 150 132 176 98 176 C62 176 38 148 36 112 Z" fill="url(#ck)" stroke="#7a4a2c" stroke-opacity=".5" stroke-width="2"/>
        ${dust(99, 112, 62, 190, 73)}
        <ellipse cx="78" cy="80" rx="28" ry="16" fill="#fff" opacity=".12" transform="rotate(-30 78 80)"/>
        ${(() => { seed = 79; let g = ''; for (let i = 0; i < 26; i++) g += `<circle cx="${r2(30 + rnd() * 150)}" cy="${r2(178 + rnd() * 14)}" r="${r2(.8 + rnd() * 1.4)}" fill="#a87452" opacity=".55"/>`; return g; })()}`,
      `<radialGradient id="ck" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#8e5a3a"/><stop offset=".42" stop-color="#4e2814"/><stop offset="1" stop-color="#1c0b04"/></radialGradient>`);
    },

    coffee: () => {
      const bean = (x, y, rot, s) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
        <ellipse rx="34" ry="46" fill="url(#cf)" stroke="#a8683e" stroke-opacity=".45" stroke-width="1.6"/>
        <path d="M2 -40 C-14 -18 14 14 -2 40" stroke="#110402" stroke-width="6" stroke-linecap="round" fill="none"/>
        <path d="M7 -38 C-6 -16 18 14 4 38" stroke="#c0844f" stroke-opacity=".5" stroke-width="1.6" fill="none"/>
        <ellipse cx="-15" cy="-16" rx="7" ry="17" fill="#fff" opacity=".22" transform="rotate(14 -15 -16)"/></g>`;
      return svg(bean(68, 72, -30, 1) + bean(138, 88, 28, .94) + bean(96, 148, 74, .9),
        `<radialGradient id="cf" cx=".38" cy=".3" r=".82"><stop offset="0" stop-color="#a5643a"/><stop offset=".45" stop-color="#5c2c12"/><stop offset="1" stop-color="#220c04"/></radialGradient>`);
    },

    hazelnut: () => svg(`
      <path d="M100 26 C116 28 166 66 166 118 C166 158 136 182 100 182 C64 182 34 158 34 118 C34 66 84 28 100 26 Z" fill="url(#hz)"/>
      ${[-44, -24, -6, 12, 30, 48].map((o) => `<path d="M${100 + o * .25} 32 C${100 + o * 1.05} 80 ${100 + o * 1.1} 130 ${100 + o * .9} 176" stroke="#4a2206" stroke-opacity=".28" stroke-width="2" fill="none"/>`).join('')}
      <path d="M96 30 L100 14 L104 30 Z" fill="#3a1a06"/>
      <ellipse cx="72" cy="78" rx="14" ry="30" fill="url(#gloss)" transform="rotate(25 72 78)"/>
      <path d="M24 126 C28 172 64 198 100 198 C136 198 172 172 176 126 L164 140 L158 116 L148 142 L138 120 L128 146 L118 124 L108 150 L98 126 L88 150 L78 124 L68 146 L58 120 L50 140 L42 116 L36 136 Z" fill="url(#hh)" stroke="#5a4a1c" stroke-opacity=".5" stroke-width="1.2" stroke-linejoin="round"/>
      ${[[58, 120, 52, 186], [78, 124, 74, 194], [98, 126, 98, 196], [118, 124, 124, 194], [138, 120, 146, 188], [158, 116, 164, 172]].map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1 + 8} Q${(x1 + x2) / 2 - 3} ${(y1 + y2) / 2} ${x2} ${y2}" stroke="#f2e6b0" stroke-width="1.2" fill="none" opacity=".45"/>`).join('')}`,
    `<radialGradient id="hz" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#e6aa6c"/><stop offset=".45" stop-color="#a8602a"/><stop offset="1" stop-color="#4a2208"/></radialGradient>
     <linearGradient id="hh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcd08e"/><stop offset=".5" stop-color="#ac9c54"/><stop offset="1" stop-color="#5e5022"/></linearGradient>${gloss}`),

    /* ---- woods ---- */
    cashmere: () => {
      seed = 83;
      let fib = '';
      for (let i = 0; i < 12; i++) {
        const o = (rnd() - .5) * 22;
        fib += `<path d="M${r2(20 + rnd() * 14)} ${r2(136 + o)} C50 ${r2(98 + o)} 92 ${r2(158 + o)} 132 ${r2(116 + o)} C158 ${r2(88 + o)} 178 ${r2(76 + o)} ${r2(172 + rnd() * 10)} ${r2(80 + o)}" stroke="#fffaf4" stroke-width="${r2(.6 + rnd() * .8)}" fill="none" opacity="${r2(.3 + rnd() * .4)}"/>`;
      }
      return svg(`
        <path d="M30 78 L146 48 L178 96 L168 150 L52 172 L22 124 Z" fill="url(#cw)"/>
        <path d="M146 48 L178 96 L168 150 L158 102 Z" fill="#a88660" opacity=".5"/>
        <path d="M30 78 L146 48 L158 102 L40 126 Z" fill="#fffaf0" opacity=".3"/>
        ${[0, 1, 2, 3, 4].map((i) => `<path d="M${34 + i * 3} ${96 + i * 13} C80 ${84 + i * 13} 120 ${92 + i * 12} 170 ${76 + i * 14}" stroke="#a8845a" stroke-opacity=".35" stroke-width="1.4" fill="none"/>`).join('')}
        <g filter="url(#cs)"><path d="M24 136 C56 98 94 158 132 118 C156 92 170 82 178 82" stroke="#fff4ec" stroke-width="20" stroke-linecap="round" fill="none" opacity=".5"/>
          <path d="M28 146 C60 114 98 168 136 128" stroke="#f1e2ec" stroke-width="10" stroke-linecap="round" fill="none" opacity=".45"/></g>
        ${fib}`,
      `<linearGradient id="cw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8ead0"/><stop offset=".5" stop-color="#e0c69c"/><stop offset="1" stop-color="#ae8c62"/></linearGradient>
       <filter id="cs" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="3.5"/></filter>`);
    },

    vetiver: () => {
      seed = 13;
      const cols = ['#7e5018', '#a8742a', '#c8913c', '#e2b462', '#f4d488'];
      const strands = [];
      for (let i = 0; i < 34; i++) {
        const tx = 91 + rnd() * 18, xt = 100 + (rnd() - .5) * 100, yt = 16 + rnd() * 26, xb = 100 + (rnd() - .5) * 150, yb = 172 + rnd() * 22;
        const w1 = (rnd() - .5) * 30, w2 = (rnd() - .5) * 40;
        strands.push({ c: Math.floor(rnd() * cols.length), d: `M${r2(xt)} ${r2(yt)} C${r2((xt + tx) / 2 + w1)} ${r2(yt + 36)} ${r2(tx)} 78 ${r2(tx)} 100 C${r2(tx)} 124 ${r2((xb + tx) / 2 + w2)} 150 ${r2(xb)} ${r2(yb)}`, w: r2(1.8 + rnd() * 1.8) });
      }
      strands.sort((a, b) => a.c - b.c);
      let b = strands.map((s) => `<path d="${s.d}" stroke="${cols[s.c]}" stroke-width="${s.w}" stroke-linecap="round" fill="none"/>`).join('');
      for (let i = 0; i < 10; i++) { // fine rootlets at the bottom
        const x = 40 + rnd() * 120, y = 150 + rnd() * 30;
        b += `<path d="M${r2(x)} ${r2(y)} q${r2((rnd() - .5) * 16)} ${r2(6 + rnd() * 8)} ${r2((rnd() - .5) * 20)} ${r2(12 + rnd() * 10)}" stroke="#d8a854" stroke-width=".9" fill="none" opacity=".7"/>`;
      }
      b += `<rect x="82" y="90" width="36" height="20" rx="5" fill="url(#vt)"/>
        ${[0, 1, 2, 3].map((i) => `<path d="M${84 + i * 9} 108 L${92 + i * 9} 92" stroke="#e0a070" stroke-width="1.4" opacity=".55"/>`).join('')}
        <path d="M118 100 C130 96 136 108 146 104" stroke="#7a3216" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      return svg(b, `<linearGradient id="vt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b65a2e"/><stop offset=".5" stop-color="#8a3a1a"/><stop offset="1" stop-color="#4e1c0a"/></linearGradient>`);
    },
  };

  const MAP = {
    rose: ['rose', 'petal', 'petal'], jasmine: ['jasmine'], oud: ['oud'], sandalwood: ['sandalwood'], cedar: ['sandalwood'],
    saffron: ['saffron'], amber: ['amber', 'honey'], musk: ['musk'], vanilla: ['vanilla'], citrus: ['orange', 'lemon'],
    cardamom: ['cardamom', 'anise'], leather: ['cinnamon'], smoke: ['smoke'], green: ['leaf', 'leaf'],
    apple: ['apple'], peach: ['peach'], raspberry: ['raspberry'], blackcurrant: ['blackcurrant', 'leaf'], bergamot: ['bergamot', 'leaf'],
    peony: ['peony', 'petal'], orangeblossom: ['orangeblossom'], orchid: ['orchid'], candy: ['cottoncandy'], marshmallow: ['marshmallow'],
    tonka: ['tonka'], caramel: ['caramel'], cocoa: ['cocoa'], coffee: ['coffee'], praline: ['hazelnut', 'caramel'], cashmere: ['cashmere'], vetiver: ['vetiver'],
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
      // fruits: bob and roll as if floating in still water
      case 'apple': oy = Math.sin(t * 1.1) * s * .05; r = it._r0 * .15 + Math.sin(t * .7) * .3; break;
      case 'peach': oy = Math.sin(t * .9) * s * .05; r += Math.sin(t * .45) * .6; break; // slow half-roll back and forth
      case 'raspberry': { const q = Math.sin(t * 1.5); oy = q * s * .04; sy = 1 + .035 * q; sx = 1 - .025 * q; r = it._r0 * .15 + Math.sin(t * .6) * .25; break; }
      case 'blackcurrant': r = (it._r0 - Math.PI) * .1 + Math.sin(t * .9) * .38; ox = Math.sin(t * .9) * s * .04; break; // sprig swings on its stem
      case 'bergamot': // rolls slowly, mists a little peel oil
        r += t * .22 * it._dir; oy = Math.sin(t * 1.2) * s * .03;
        if (fx && Math.random() < dt * .5) fx.push({ type: 'drop', x: x + rr(-.3, .3) * s, y: y + s * .25, vx: rr(-6, 6), vy: rr(5, 18), r: s * rr(.02, .035), c: '214,228,110', life: 0, max: rr(.8, 1.2) });
        break;
      // flowers: sway and breathe
      case 'peony': { const b = .9 + .1 * Math.sin(t * .8); sx = sy = b; r += Math.sin(t * .5) * .3; break; }
      case 'orangeblossom': { const b = .93 + .07 * Math.sin(t * 1.1); sx = sy = b; r = (it._r0 - Math.PI) * .12 + Math.sin(t * .7) * .3; glint = Math.max(0, (Math.sin(t * .9) - .9) / .1) * .6; break; }
      case 'orchid': r = (it._r0 - Math.PI) * .1 + Math.sin(t * .8) * .3; sy = .95 + .05 * Math.sin(t * 1.3); sx = .97 + .03 * Math.cos(t * 1.3); break;
      // sweets: float softly
      case 'cottoncandy': { const q = .5 + .5 * Math.sin(t * 1.1); ox = Math.sin(t * .5) * s * .06; oy = Math.sin(t * .8) * s * .07; sx = 1 + .05 * q; sy = 1.04 - .05 * q; r = (it._r0 - Math.PI) * .08 + Math.sin(t * .4) * .15; break; }
      case 'marshmallow': { const q = Math.max(0, Math.sin(t * 1.3)); oy = Math.sin(t * .7) * s * .07; sy = 1 - .06 * q; sx = 1 + .05 * q; r += Math.sin(t * .35) * .25; break; } // pillowy squish
      case 'caramel': { // slow drip, stretches, lets go, catches the light
        const k = Math.max(0, Math.sin(t * 1.05)); sy = 1 + .14 * k; sx = 1 - .07 * k; oy = s * .06 * k; r = (it._r0 - Math.PI) * .05;
        if (fx && k > .97 && !it._dripped) { it._dripped = true; fx.push({ type: 'drop', x: x + s * .25, y: y + s * .48, vx: 0, vy: 22, r: s * .06, c: '214,128,40', life: 0, max: 1.6 }); }
        if (k < .5) it._dripped = false;
        glint = Math.max(0, (Math.sin(t * .9) - .85) / .15); break;
      }
      // beans and nuts: slow tumble
      case 'tonka': r += t * .18 * it._dir; sx = .9 + .1 * Math.cos(t * .8); break; // turns over lengthwise
      case 'cocoa': r += t * .16 * it._dir; oy = Math.sin(t * .9) * s * .03; break;
      case 'coffee': // tumbles, now and then breathes out a faint roasted wisp
        r += t * .22 * it._dir;
        if (fx && Math.random() < dt * .5) fx.push({ type: 'wisp', x: x + rr(-.15, .15) * s, y: y - s * .2, vx: rr(-4, 4), vy: rr(-18, -10), r: s * .08, life: 0, max: rr(1.4, 2) });
        break;
      case 'hazelnut': r += t * .2 * it._dir + Math.sin(t * 1.4) * .06; break; // a little wobble as it rolls
      // woods
      case 'cashmere': r += Math.sin(t * .4) * .35; ox = Math.sin(t * .5) * s * .06; oy = Math.cos(t * .65) * s * .04; break; // drifts like soft cloth
      case 'vetiver': r = (it._r0 - Math.PI) * .12 + Math.sin(t * .85) * .4; ox = Math.sin(t * .85 - .6) * s * .05; break; // sways like grass
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
