#!/usr/bin/env node
// Run: npm install  (once, to get sharp)
// Then: node scripts/optimize-images.js
// Processes public/posts/** and public/projects/** *.{jpg,jpeg,png} -> WebP + deletes originals
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const INPUT_DIRS = ['posts', 'projects'].map(d => path.join(__dirname, '..', 'public', d));
const MAX_WIDTH = 1200;
const EXTS = ['.jpg', '.jpeg', '.png'];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

async function run() {
  const files = INPUT_DIRS.flatMap(walk).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return EXTS.includes(ext) && !f.includes('.webp');
  });

  if (!files.length) {
    console.log('No images found in public/posts/ or public/projects/ — drop images there and re-run.');
    return;
  }

  for (const file of files) {
    const dir = path.dirname(file);
    const base = path.basename(file, path.extname(file));
    const webpOut = path.join(dir, `${base}.webp`);
    const meta = await sharp(file).metadata();
    let pipeline = sharp(file);
    if (meta.width > MAX_WIDTH) pipeline = pipeline.resize({ width: MAX_WIDTH });
    await pipeline.webp({ quality: 85 }).toFile(webpOut);
    fs.unlinkSync(file);
    const rel = f => path.relative(process.cwd(), f);
    console.log(`  ${rel(file)} → ${rel(webpOut)} (original deleted)`);
  }
}

run().catch(err => { console.error(err.message); process.exit(1); });
