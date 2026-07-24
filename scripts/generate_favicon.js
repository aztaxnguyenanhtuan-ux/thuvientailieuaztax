import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'https://aztax.com.vn/wp-content/uploads/2023/02/LOGO_AZ_TAX_FINAL-1-1024x512.png.webp';
const svgPath = path.join(__dirname, '../public/favicon.svg');

https.get(url, (res) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const b64 = buffer.toString('base64');
    console.log('Downloaded logo image, size:', buffer.length, 'bytes');

    // Create a 64x64 square favicon SVG embedding the exact logo image in base64
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#FFFFFF"/>
  <rect width="62" height="62" x="1" y="1" rx="13" fill="none" stroke="#E2E8F0" stroke-width="1.5"/>
  <image href="data:image/webp;base64,${b64}" x="4" y="16" width="56" height="32" preserveAspectRatio="xMidYMid meet" />
</svg>`;

    fs.writeFileSync(svgPath, svgContent, 'utf8');
    console.log('Successfully updated public/favicon.svg with base64 embedded logo!');
  });
}).on('error', (err) => {
  console.error('Failed to download logo:', err);
});
