import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
assert.equal(manifest.manifest_version, 3); assert.deepEqual(manifest.permissions, ['storage']);
assert.deepEqual(manifest.content_scripts[0].matches, ['https://www.lemonde.fr/*']);
for (const key of ['host_permissions', 'optional_host_permissions', 'externally_connectable', 'web_accessible_resources']) assert.equal(key in manifest, false, `${key} non prévu`);
assert.ok(manifest.description.length <= 132); assert.ok(manifest.content_security_policy.extension_pages.includes("connect-src 'none'"));
const expected = ['LICENSE', 'background.js', 'content.css', 'content.js', 'icons/128.png', 'icons/16.png', 'icons/32.png', 'icons/48.png', 'manifest.json', 'options.css', 'options.html', 'options.js'].sort();
const files = [];
async function walk(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isSymbolicLink()) throw new Error('Lien symbolique non prévu'); if (entry.isDirectory()) await walk(full); else files.push(full.replace(/^dist\//, '').replaceAll('\\', '/')); } }
await walk('dist'); assert.deepEqual(files.sort(), expected);
for (const file of files.filter(file => file.endsWith('.png'))) {
  const png = await readFile(path.join('dist', file));
  assert.ok(png.includes(Buffer.from('impeccable:prompt\0Origin: original project vector assets/icon.svg')), `Provenance absente dans ${file}`);
}
for (const file of files.filter(file => file.endsWith('.js'))) {
  const text = await readFile(path.join('dist', file), 'utf8');
  assert.equal(/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|eval)\s*\(|new\s+Function\b/u.test(text), false, `Communication réseau/code dynamique inattendu dans ${file}`);
  assert.equal(text.includes('/Users/'), false, `Chemin local inattendu dans ${file}`);
}
const html = await readFile('dist/options.html', 'utf8');
assert.equal(/<script[^>]+src=["']https?:/iu.test(html), false);
await mkdir('output/test-results', { recursive: true });
await writeFile('output/test-results/package.json', JSON.stringify({ version: manifest.version, permissions: manifest.permissions, matches: manifest.content_scripts[0].matches, files, checks: 'pass', limits: 'Static regression checks complement the runtime network test; they are not a universal security proof.' }, null, 2));
console.log('Paquet vérifié : périmètre, permissions, fichiers et absence des primitives réseau/code dynamique contrôlées.');
