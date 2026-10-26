// Giberish — draw a molecule as elegant gold line art (SVG) from PubChem 2D coordinates.
// PubChem data is public domain (U.S. National Library of Medicine).
//
//   node tools/molecule-svg.mjs <cid> <out.svg>
//   node tools/molecule-svg.mjs --atlas            // every synthetic in assets/js/atlas-data.js with a cid
//                                                    → assets/img/atlas/mol/<id>.svg, and sets `img`/`credit` in the data file
import fs from 'node:fs';
import path from 'node:path';

const SYMBOL = { 6: 'C', 7: 'N', 8: 'O', 16: 'S', 9: 'F', 17: 'Cl', 35: 'Br', 15: 'P' };

async function fetch2d(cid) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/JSON?record_type=2d`;
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url);
    if (r.ok) return (await r.json()).PC_Compounds[0];
    await new Promise((s) => setTimeout(s, 800 * (i + 1)));
  }
  throw new Error('PubChem request failed for CID ' + cid);
}

function svgFor(cmp) {
  const aid = cmp.atoms.aid, el = cmp.atoms.element;
  const conf = cmp.coords[0].conformers[0];
  const pos = {};
  conf.x.forEach((x, i) => (pos[cmp.coords[0].aid[i]] = { x, y: -conf.y[i] }));
  const elem = Object.fromEntries(aid.map((a, i) => [a, el[i]]));
  const heavy = aid.filter((a) => elem[a] !== 1);
  const bonds = (cmp.bonds ? cmp.bonds.aid1.map((a, i) => [a, cmp.bonds.aid2[i], cmp.bonds.order[i]]) : [])
    .filter(([a, b]) => elem[a] !== 1 && elem[b] !== 1);
  // fit into a 200×200 box with margin
  const xs = heavy.map((a) => pos[a].x), ys = heavy.map((a) => pos[a].y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY, 1), k = 150 / span;
  const ox = 100 - ((minX + maxX) / 2) * k, oy = 100 - ((minY + maxY) / 2) * k;
  const P = (a) => ({ x: pos[a].x * k + ox, y: pos[a].y * k + oy });
  const label = (a) => elem[a] !== 6;
  const lines = [];
  for (const [a, b, order] of bonds) {
    let p = P(a), q = P(b);
    // shorten bonds that touch a lettered atom
    const shrink = (from, to, r) => { const dx = to.x - from.x, dy = to.y - from.y, d = Math.hypot(dx, dy) || 1; return { x: from.x + (dx / d) * r, y: from.y + (dy / d) * r }; };
    if (label(a)) p = shrink(p, q, 7); if (label(b)) q = shrink(q, p, 7);
    const line = (u, v, cls = '') => lines.push(`<line ${cls}x1="${u.x.toFixed(1)}" y1="${u.y.toFixed(1)}" x2="${v.x.toFixed(1)}" y2="${v.y.toFixed(1)}"/>`);
    if (order === 1) line(p, q);
    else {
      const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, nx = (-dy / d) * 3.2, ny = (dx / d) * 3.2;
      if (order === 2) { line({ x: p.x + nx, y: p.y + ny }, { x: q.x + nx, y: q.y + ny }); line({ x: p.x - nx, y: p.y - ny }, { x: q.x - nx, y: q.y - ny }); }
      else { line(p, q); line({ x: p.x + nx * 1.6, y: p.y + ny * 1.6 }, { x: q.x + nx * 1.6, y: q.y + ny * 1.6 }); line({ x: p.x - nx * 1.6, y: p.y - ny * 1.6 }, { x: q.x - nx * 1.6, y: q.y - ny * 1.6 }); }
    }
  }
  const atoms = heavy.filter(label).map((a) => { const p = P(a); return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}">${SYMBOL[elem[a]] || '?'}</text>`; });
  const dots = heavy.filter((a) => !label(a)).map((a) => { const p = P(a); return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.6"/>`; });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="200"><stop offset="0" stop-color="#fff1c8"/><stop offset=".55" stop-color="#e6bd6a"/><stop offset="1" stop-color="#a87a30"/></linearGradient>
<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<g filter="url(#glow)" stroke="url(#g)" stroke-width="2.1" stroke-linecap="round" fill="none">${lines.join('')}</g>
<g fill="#f2d59b">${dots.join('')}</g>
<g fill="#fbe6bd" font-family="Georgia, 'Cormorant Garamond', serif" font-size="13" text-anchor="middle" dominant-baseline="central">${atoms.join('')}</g>
</svg>
`;
}

async function one(cid, out) {
  const cmp = await fetch2d(cid);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svgFor(cmp));
  console.log('wrote', out);
}

const args = process.argv.slice(2);
if (args[0] === '--atlas') {
  const file = 'assets/js/atlas-data.js';
  let src = fs.readFileSync(file, 'utf8');
  const win = {}; new Function('window', src)(win);
  for (const m of win.GIB_ATLAS.filter((x) => x.type === 'synthetic' && x.cid)) {
    const out = `assets/img/atlas/mol/${m.id}.svg`;
    try {
      await one(m.cid, out);
      // set img/credit inside this entry only: from its id up to the next entry
      const start = src.indexOf(`id: '${m.id}'`);
      if (start < 0) throw new Error('entry not found');
      let end = src.indexOf('e({', start); if (end < 0) end = src.length;
      let entry = src.slice(start, end);
      const line = `img: '${out}', credit: 'Structure: PubChem (public domain)',`;
      if (/img:\s*'[^']*',\s*credit:\s*'[^']*',/.test(entry)) entry = entry.replace(/img:\s*'[^']*',\s*credit:\s*'[^']*',/, line);
      else entry = entry.replace(/(\n)(\s*)(src:)/, `$1$2${line}\n$2$3`);
      src = src.slice(0, start) + entry + src.slice(end);
    } catch (e) { console.log('skip', m.id, e.message); }
    await new Promise((s) => setTimeout(s, 250)); // be polite to PubChem
  }
  fs.writeFileSync(file, src);
} else {
  await one(Number(args[0]), args[1]);
}
