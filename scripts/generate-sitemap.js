#!/usr/bin/env node
// Writes sitemap.xml at repo root from posts.json (run after generate-posts-index.js).
const fs   = require('fs');
const path = require('path');

const BASE = 'https://labs.bluestonepim.com';
const OUT  = path.join(__dirname, '../sitemap.xml');
const postsPath = path.join(__dirname, '../posts.json');

function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
const staticUrls = [
  { loc: `${BASE}/`, changefreq: 'weekly', priority: 1.0 },
  { loc: `${BASE}/blog`, changefreq: 'weekly', priority: 0.9 }
];
const postUrls = posts.map(p => ({
  loc: `${BASE}/blog/${p.slug}`,
  changefreq: 'monthly',
  priority: 0.8
}));

const all = [...staticUrls, ...postUrls];
const body = all
  .map(
    u => `  <url>
    <loc>${escXml(u.loc)}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
fs.writeFileSync(OUT, xml);
console.log('Generated sitemap.xml');
