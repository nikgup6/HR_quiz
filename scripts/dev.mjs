// Local development server: serves /public and routes /api/* to the same
// handlers Vercel runs. Uses PGlite (Postgres in-process, stored in .data/)
// unless DATABASE_URL is set, in which case it talks to that database.
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(root, 'public');
const port = Number(process.env.PORT || 3000);

if (!process.env.DATABASE_URL) {
  const { PGlite } = await import('@electric-sql/pglite');
  await mkdir(join(root, '.data'), { recursive: true });
  globalThis.__GMR_LOCAL_DB__ = new PGlite(join(root, '.data', 'pglite'));
  process.env.HR_ADMIN_EMAIL ??= 'hr@example.test';
  process.env.HR_ADMIN_PASSWORD ??= 'ChangeMe-Local-123';
  console.log(`Local database: .data/pglite  (HR login ${process.env.HR_ADMIN_EMAIL} / ${process.env.HR_ADMIN_PASSWORD})`);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json',
};

const handlers = {};
async function api(name) {
  if (!/^[a-z-]+$/.test(name)) return null;
  try {
    handlers[name] ??= (await import(join(root, 'api', `${name}.js`))).default;
    return handlers[name];
  } catch (e) {
    if (e.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw e;
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const h = await api(url.pathname.slice(5));
      if (!h) { res.statusCode = 404; return res.end('Not found'); }
      return await h(req, res);
    }
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = join(publicDir, p);
    if (!file.startsWith(publicDir)) { res.statusCode = 403; return res.end(); }
    let s = await stat(file).catch(() => null);
    if (s?.isDirectory()) { file = join(file, 'index.html'); s = await stat(file).catch(() => null); }
    if (!s && !extname(file)) { file += '.html'; s = await stat(file).catch(() => null); } // cleanUrls
    if (!s) { res.statusCode = 404; res.setHeader('Content-Type', TYPES['.html']); return res.end(await readFile(join(publicDir, '404.html')).catch(() => 'Not found')); }
    res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch (err) {
    console.error(err);
    res.statusCode = 500; res.end('Server error');
  }
}).listen(port, () => console.log(`Running at http://localhost:${port}`));
