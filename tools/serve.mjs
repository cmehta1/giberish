// Local preview that behaves like Vercel: static files, clean URLs (/shop → shop.html) and the
// functions in api/ (so /api/catalog reads the database locally too).
//   node tools/serve.mjs [port]      (default 5880)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd(), port = Number(process.argv[2]) || 5880, require = createRequire(import.meta.url);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.ico': 'image/x-icon' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const fn = /^\/api\/([\w-]+)$/.exec(url.pathname);
  if (fn && fs.existsSync(path.join(root, 'api', fn[1] + '.js'))) {
    const file = path.join(root, 'api', fn[1] + '.js');
    delete require.cache[file]; // pick up edits without a restart
    try { return await require(file)(req, res); } catch (e) { res.statusCode = 500; return res.end(String(e)); }
  }
  let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(root, p);
  if (!file.startsWith(root)) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  else if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file) || /[/\\](api|tools|supabase|\.git)[/\\]/.test(file.slice(root.length))) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-cache');
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Giberish on http://localhost:${port}`));
