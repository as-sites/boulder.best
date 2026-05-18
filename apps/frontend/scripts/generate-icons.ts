import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const root = join(import.meta.dirname, '..');
const publicDir = join(root, 'public');
const svg = await readFile(join(publicDir, 'favicon.svg'));

const outputs = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
] as const;

for (const { file, size } of outputs) {
  await sharp(svg).resize(size, size).png().toFile(join(publicDir, file));
  // oxlint-disable-next-line no-console
  console.log(`wrote public/${file} (${size}x${size})`);
}
