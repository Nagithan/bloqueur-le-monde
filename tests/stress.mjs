import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, access, readdir, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
let executablePath = process.env.BLM_CHROMIUM;
if (!executablePath) try { await access(chromium.executablePath()); } catch {
  const cache = path.join(process.env.HOME, 'Library/Caches/ms-playwright');
  for (const dir of (await readdir(cache).catch(() => [])).filter(name => /^chromium-\d+$/.test(name)).sort().reverse()) {
    const candidate = path.join(cache, dir, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
    try { await access(candidate); executablePath = candidate; break; } catch {}
  }
}
const profile = await mkdtemp(path.join(tmpdir(), 'blm-stress-'));
const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', executablePath, headless: true, args: [`--disable-extensions-except=${path.resolve('dist')}`, `--load-extension=${path.resolve('dist')}`] });
const html = await readFile('tests/fixtures/discussion.html', 'utf8'); const script = await readFile('tests/fixtures/fixture.js', 'utf8');
await context.route('**/*', route => {
  const url = new URL(route.request().url()); if (url.protocol === 'chrome-extension:') return route.continue();
  if (url.origin === 'https://www.lemonde.fr') return route.fulfill({ contentType: url.pathname === '/fixture.js' ? 'text/javascript' : 'text/html', body: url.pathname === '/fixture.js' ? script : html });
  return route.abort();
});
try {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker'); const id = new URL(worker.url()).host;
  const options = await context.newPage(); await options.goto(`chrome-extension://${id}/options.html`); await options.getByRole('combobox', { name: 'Choix pour Peps72', exact: true }).waitFor();
  const state = { schemaVersion: 1, settings: { enabled: true, communityEnabled: false, theme: 'light' }, personalRules: Array.from({ length: 5000 }, (_, i) => ({ identity: { kind: 'displayName', value: `Charge ${i}` }, label: `Charge ${i}`, decision: 'block' })) };
  const file = { name: 'charge.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(state)) };
  await options.locator('input[type=file]').setInputFiles(file); await options.getByRole('button', { name: 'Remplacer', exact: true }).click(); await options.getByRole('dialog', { name: 'Remplacer vos préférences ?', exact: true }).getByRole('button', { name: 'Remplacer', exact: true }).click();
  await options.getByRole('status').filter({ hasText: 'Import terminé.' }).waitFor(); assert.equal(await options.locator('.rule-row').count(), 100);
  const page = await context.newPage(); await page.goto('https://www.lemonde.fr/charge'); await page.getByRole('button', { name: 'Voir les commentaires', exact: true }).click(); await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur calme', exact: true }).waitFor();
  const samples = [];
  for (let run = 0; run < 5; run++) {
    await page.evaluate(run => {
      const list = document.querySelector('[data-element="comments-container"]');
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < 1000; i++) fragment.append(comment(`Charge ${i}`, `charge-${run}-${i}`, 'Texte fictif pour la mesure de charge.'));
      window.blmBenchmarkStart = performance.now(); list.replaceChildren(fragment);
    }, run);
    await page.waitForFunction(() => {
      if (document.querySelectorAll('[data-blm-hidden-leaf]').length === 1000) { window.blmBenchmarkEnd = performance.now(); return true; }
      return false;
    });
    samples.push(await page.evaluate(() => Math.round(window.blmBenchmarkEnd - window.blmBenchmarkStart)));
  }
  const p95 = [...samples].sort((a, b) => a - b).at(-1);
  assert.ok(p95 < 2000, `Régression majeure : ${p95} ms pour 1 000 commentaires`);
  await mkdir('output/test-results', { recursive: true });
  const result = { comments: 1000, rules: 5000, samplesMs: samples, p95Ms: p95, includesSchedulingAndTestPolling: true, chromium: context.browser()?.version(), platform: `${process.platform}/${process.arch}`, optionsRowsRendered: 100 };
  await writeFile('output/test-results/performance.json', JSON.stringify(result, null, 2)); console.log(result);
} finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
