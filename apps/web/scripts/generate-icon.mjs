// apps/web/scripts/generate-icon.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/icon-512.png');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#191724"/>
  <text x="50%" y="50%"
        font-family="'JetBrains Mono', 'SF Mono', Menlo, monospace"
        font-size="220"
        font-weight="600"
        fill="#9ccfd8"
        text-anchor="middle"
        dominant-baseline="central">[x]</text>
</svg>
`;

await mkdir(dirname(OUT), { recursive: true });
await sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile(OUT);

console.log('wrote', OUT);
