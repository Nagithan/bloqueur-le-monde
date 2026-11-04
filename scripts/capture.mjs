// Captures du paquet réel, sur une discussion de démonstration sans données d’abonnés.
import { chromium } from 'playwright';
import { readFile, writeFile, access, readdir, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { withOrigin } from './png-origin.mjs';

let executablePath = process.env.BLM_CHROMIUM;
if (!executablePath) try { await access(chromium.executablePath()); } catch {
  const cache = path.join(process.env.HOME, 'Library/Caches/ms-playwright');
  for (const dir of (await readdir(cache).catch(() => [])).filter(name => /^chromium-\d+$/.test(name)).sort().reverse()) {
    const candidate = path.join(cache, dir, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
    try { await access(candidate); executablePath = candidate; break; } catch {}
  }
}
const profile = await mkdtemp(path.join(tmpdir(), 'blm-captures-'));
const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', executablePath, headless: true, viewport: { width: 1280, height: 800 }, args: [`--disable-extensions-except=${path.resolve('dist')}`, `--load-extension=${path.resolve('dist')}`] });
const html = await readFile('tests/fixtures/discussion.html', 'utf8'); const script = await readFile('tests/fixtures/fixture.js', 'utf8');
await context.route('**/*', route => {
  const url = new URL(route.request().url()); if (url.protocol === 'chrome-extension:') return route.continue();
  if (url.origin === 'https://www.lemonde.fr') return route.fulfill({ contentType: url.pathname === '/fixture.js' ? 'text/javascript' : 'text/html', body: url.pathname === '/fixture.js' ? script : html });
  return route.abort();
});
await mkdir('store/assets', { recursive: true }); await mkdir('output/screenshots', { recursive: true });
try {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker'); const id = new URL(worker.url()).host;
  const options = await context.newPage(); await options.goto(`chrome-extension://${id}/options.html`); await options.getByRole('combobox', { name: 'Choix pour Peps72', exact: true }).waitFor();
  for (const name of ['Auteur du fil', 'Auteur tardif']) { await options.getByRole('textbox', { name: 'Pseudonyme à masquer' }).fill(name); await options.getByRole('button', { name: 'Masquer', exact: true }).click(); await options.getByRole('button', { name: 'Confirmer le masquage', exact: true }).click(); await options.getByRole('combobox', { name: `Choix pour ${name}`, exact: true }).waitFor(); }
  await options.getByRole('combobox', { name: 'Thème des réglages' }).selectOption('light');
  await options.screenshot({ path: 'store/assets/02-reglages-1280x800.png' });
  const page = await context.newPage(); await page.goto('https://www.lemonde.fr/demonstration'); await page.getByRole('button', { name: 'Voir les commentaires', exact: true }).click(); await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur calme', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Compris', exact: true }).click(); await page.waitForTimeout(100);
  // Hide only the test harness controls, never extension UI. The synthetic-data label stays visible.
  await page.addStyleTag({ content: 'main{display:none} header.demo{padding:20px 24px}.ds-comments-popin{padding-top:12px}' });
  await page.evaluate(() => document.querySelector('[data-component="comments-popin"]').scrollIntoView());
  await page.screenshot({ path: 'store/assets/01-commentaires-1280x800.png' });
  await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur calme', exact: true }).click(); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.screenshot({ path: 'store/assets/03-confirmation-1280x800.png' }); await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => document.body.classList.add('dark')); await page.waitForTimeout(100);
  await page.screenshot({ path: 'output/screenshots/comments-mobile-dark-final.png', fullPage: true });
  await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur calme', exact: true }).click();
  await page.screenshot({ path: 'output/screenshots/confirmation-mobile-dark-viewport.png' });
  await options.setViewportSize({ width: 390, height: 844 }); await options.getByRole('combobox', { name: 'Thème des réglages' }).selectOption('dark'); await options.screenshot({ path: 'output/screenshots/options-mobile-dark-final.png', fullPage: true });
  await options.getByRole('textbox', { name: 'Pseudonyme à masquer' }).fill('  Auteur à vérifier  '); await options.getByRole('button', { name: 'Masquer', exact: true }).click();
  await options.screenshot({ path: 'output/screenshots/add-preview-mobile.png', fullPage: true });
  await options.getByRole('button', { name: 'Annuler', exact: true }).click();
  await options.getByRole('combobox', { name: 'Choix pour Peps72', exact: true }).selectOption('allow');
  await options.getByRole('textbox', { name: 'Pseudonyme à masquer' }).fill('  Peps72  '); await options.getByRole('button', { name: 'Masquer', exact: true }).click();
  await options.screenshot({ path: 'output/screenshots/duplicate-mobile.png', fullPage: true });
  await options.locator('input[type=file]').setInputFiles({ name: 'demo.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, settings: { enabled: true, communityEnabled: true, theme: 'dark' }, personalRules: [] })) });
  await options.getByRole('button', { name: 'Remplacer', exact: true }).click(); await options.getByRole('dialog', { name: 'Remplacer vos préférences ?', exact: true }).getByRole('button', { name: 'Annuler', exact: true }).click();
  await options.getByRole('status').filter({ hasText: 'Import annulé. Aucune préférence modifiée.' }).waitFor();
  await options.screenshot({ path: 'output/screenshots/import-cancel-mobile.png', fullPage: true });
  const files = [];
  for (const name of (await readdir('store/assets')).filter(name => name.endsWith('.png')).sort()) {
    const file = `store/assets/${name}`;
    const origin = 'Origin: screenshot of the actual packaged extension on synthetic tests/fixtures/discussion.html, generated by scripts/capture.mjs with Playwright; no subscriber content, external stock, or generative image model.';
    const png = withOrigin(await readFile(file), origin);
    await writeFile(file, png);
    const { width, height } = await sharp(png).metadata();
    files.push({ file: name, width, height, sha256: createHash('sha256').update(png).digest('hex'), origin });
  }
  await writeFile('store/assets/provenance.json', JSON.stringify({ version: JSON.parse(await readFile('package.json', 'utf8')).version, generator: 'scripts/capture.mjs', fixture: 'tests/fixtures/discussion.html', files }, null, 2) + '\n');
  console.log('Captures synthétiques du paquet réel et provenance créées dans store/assets/.');
} finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
