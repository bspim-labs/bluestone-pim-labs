const sharp = require('sharp');
const path = require('path');

const logoPath = path.join(__dirname, '../public/bluestone_pim_logo_white.webp');
const outputPath = path.join(__dirname, '../public/og-image.jpg');

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0f172a"/>
  <text x="80" y="420" font-family="Arial, sans-serif" font-size="68" font-weight="bold" fill="#f1f5f9">Bluestone PIM Labs</text>
  <text x="80" y="480" font-family="Arial, sans-serif" font-size="28" fill="#64748b">Community projects for Bluestone PIM builders</text>
</svg>`;

async function generate() {
  const logo = await sharp(logoPath).resize(280, null).toBuffer();
  await sharp(Buffer.from(svg))
    .composite([{ input: logo, top: 60, left: 80 }])
    .jpeg({ quality: 90 })
    .toFile(outputPath);
  console.log('Generated og-image.jpg');
}

generate().catch(err => { console.error(err); process.exit(1); });
