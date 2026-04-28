#!/usr/bin/env node
// Run: node scripts/generate-posts-index.js
// Reads posts/*.md, parses frontmatter, writes posts.json
const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'posts');
const OUT = path.join(__dirname, '..', 'posts.json');

function parseFrontmatter(src) {
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: src };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (key) meta[key] = val;
  }
  return { meta, body: match[2] };
}

function readingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
const posts = files
  .map(file => {
    const src = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(src);
    const slug = path.basename(file, '.md');
    return {
      slug,
      title: meta.title || slug,
      date: meta.date || '',
      description: meta.description || '',
      tags: meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      author: meta.author || '',
      authorUrl: meta.authorUrl || '',
      readingTime: readingTime(body),
      heroImage: meta.heroImage || null,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync(OUT, JSON.stringify(posts, null, 2) + '\n');
console.log(`Generated posts.json with ${posts.length} post(s).`);
