import { build } from 'esbuild';
import sharp from 'sharp';
import { readFile, writeFile, mkdir, rm, copyFile } from 'node:fs/promises';
import { validateCommunity } from '../src/core/model.ts';
import { withOrigin } from './png-origin.mjs';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
validateCommunity(JSON.parse(await readFile('data/community-list.json', 'utf8')));
await rm('dist', { recursive: true, force: true });
await mkdir('dist/icons', { recursive: true });
await build({ entryPoints: { background: 'src/background/index.ts', content: 'src/content/index.ts', options: 'src/options/index.ts' }, outdir: 'dist', bundle: true, format: 'iife', target: 'chrome120', charset: 'utf8', minify: false, legalComments: 'none', loader: { '.css': 'text' } });
await copyFile('src/content/content.css', 'dist/content.css');
await copyFile('src/shared/ui.css', 'dist/options.css');
await copyFile('src/options/index.html', 'dist/options.html');
const manifest = JSON.parse(await readFile('src/manifest.json', 'utf8'));
manifest.version = pkg.version;
await writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
for (const size of [16, 32, 48, 128]) {
  const png = await sharp('assets/icon.svg').resize(size, size).png().toBuffer();
  await writeFile(`dist/icons/${size}.png`, withOrigin(png, 'Origin: original project vector assets/icon.svg, authored as code, rasterized by scripts/build.mjs with Sharp; no generative image model or external stock.'));
}
await copyFile('LICENSE', 'dist/LICENSE');
console.log(`Extension ${pkg.version} construite dans dist/`);
