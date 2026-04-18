#!/usr/bin/env node
// Local dev server with clean URLs and Vercel rewrite parity.
// Usage: node scripts/server.js  (or npm run dev)
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 8000;
const ROOT = path.join(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.css':  'text/css',
  '.md':   'text/plain; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

function send(res, filePath, status = 200) {
  const mime = MIME[path.extname(filePath)] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(status, { 'Content-Type': mime });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;

  // /blog/:slug → static generated page if it exists, otherwise post.html fallback
  if (/^\/blog\/[^/]+$/.test(pathname)) {
    const slug = pathname.split('/')[2];
    const staticPage = path.join(ROOT, 'blog', slug, 'index.html');
    return send(res, fs.existsSync(staticPage) ? staticPage : path.join(ROOT, 'post.html'));
  }

  // Clean URLs: strip .html or match bare name
  if (pathname === '/blog') return send(res, path.join(ROOT, 'blog.html'));
  if (pathname === '/')     return send(res, path.join(ROOT, 'index.html'));

  // Static file
  const filePath = path.join(ROOT, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return send(res, filePath);
  }
  if (fs.existsSync(filePath + '.html')) {
    return send(res, filePath + '.html');
  }

  send(res, path.join(ROOT, '404.html'), 404);
}).listen(PORT, () => console.log(`Dev server: http://localhost:${PORT}`));
