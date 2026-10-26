// GIBERISH — the catalogue from the database, as a script: /api/catalog
// Every page loads it right after assets/js/data.js. It reads the active products and notes from Supabase
// and hands them to gibApplyCatalog(). If the database isn't set up or doesn't answer, it sends an empty
// script and the site keeps the catalogue in data.js. Vercel's CDN caches the answer for a minute.
//
// Settings: SUPABASE_URL / SUPABASE_KEY environment variables, or else GIB_CONFIG.supabase in data.js.
const fs = require('fs');
const path = require('path');

function settings() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) return { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_KEY };
  try {
    const src = fs.readFileSync(path.join(process.cwd(), 'assets/js/data.js'), 'utf8');
    const m = /supabase:\s*\{\s*url:\s*'([^']*)',\s*key:\s*'([^']*)'/.exec(src);
    return m && m[1] && m[2] ? { url: m[1], key: m[2] } : null;
  } catch (_) { return null; }
}

async function rows(cfg, table, query) {
  const headers = { apikey: cfg.key };
  if (/^eyJ/.test(cfg.key)) headers.Authorization = 'Bearer ' + cfg.key;
  const r = await fetch(`${cfg.url.replace(/\/+$/, '')}/rest/v1/${table}?${query}`, { headers, signal: AbortSignal.timeout(4000) });
  if (!r.ok) throw new Error(`${table}: ${r.status}`);
  return r.json();
}

const product = (r) => {
  const p = { id: r.id, name: r.name, house: r.house || '', type: r.type, size: r.size || '', price: r.price, image: r.image || '',
    tagline: r.tagline || '', story: r.story || '', notes: Object.assign({ top: [], heart: [], base: [] }, r.notes || {}),
    ingredients: r.ingredients || [], feel: r.feel || [], nozzle: r.nozzle || [0.5, 0.02] };
  if (r.featured) p.featured = true;
  if (r.world) p.world = r.world;
  if (r.sound) p.sound = r.sound;
  return p;
};
const note = (r) => {
  const n = { label: r.label, family: r.family || {} };
  if (r.color) n.color = r.color;
  if (r.art && r.art.length) n.art = r.art;
  if (r.tier) n.tier = r.tier;
  return n;
};

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  const cfg = settings();
  let body = '/* Giberish: no database set up, using data.js */';
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
  if (cfg) {
    try {
      const [products, notes] = await Promise.all([
        rows(cfg, 'products', 'select=*&active=eq.true&order=sort.asc,name.asc'),
        rows(cfg, 'notes', 'select=*&active=eq.true&order=sort.asc,key.asc'),
      ]);
      const data = { products: products.map(product), notes: Object.fromEntries(notes.map((n) => [n.key, note(n)])) };
      body = `/* Giberish catalogue from the database, ${new Date().toISOString()} */\nwindow.gibApplyCatalog && window.gibApplyCatalog(${JSON.stringify(data).replace(/</g, '\\u003c')});`;
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600');
    } catch (e) {
      body = `/* Giberish: database unavailable (${String(e.message).replace(/\*\//g, '')}), using data.js */`;
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10');
    }
  }
  res.statusCode = 200;
  res.end(body);
};
