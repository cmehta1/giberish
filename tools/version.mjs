// Stamp every local CSS/JS reference in the HTML pages with a content hash (?v=1a2b3c4d),
// so browsers fetch a file again as soon as it changes (and keep it cached while it doesn't).
//   node tools/version.mjs        — run it before every commit / deploy
import fs from 'node:fs';
import crypto from 'node:crypto';

const hash = (file) => crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
const cache = {};
const v = (file) => (cache[file] ??= fs.existsSync(file) ? hash(file) : null);

let changed = 0;
for (const page of fs.readdirSync('.').filter((f) => f.endsWith('.html'))) {
  const src = fs.readFileSync(page, 'utf8');
  // assets/js/x.js, assets/css/y.css, optionally already stamped
  const out = src.replace(/(assets\/(?:js|css)\/[\w.-]+\.(?:js|css))(\?v=[0-9a-f]*)?(?=["'])/g, (m, file) => {
    const h = v(file);
    return h ? `${file}?v=${h}` : m;
  });
  if (out !== src) { fs.writeFileSync(page, out); changed++; }
}
console.log(`stamped ${changed} page(s)`);
