import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, readdir, access, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

await mkdir('output/test-results', { recursive: true });
let executablePath = process.env.BLM_CHROMIUM;
if (!executablePath) {
  try { await access(chromium.executablePath()); } catch {
    const cache = path.join(process.env.HOME, 'Library/Caches/ms-playwright');
    for (const entry of (await readdir(cache).catch(() => [])).filter(name => /^chromium-\d+$/.test(name)).sort().reverse()) {
      const candidate = path.join(cache, entry, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
      try { await access(candidate); executablePath = candidate; break; } catch {}
    }
  }
}
const profile = await mkdtemp(path.join(tmpdir(), 'blm-test-'));
const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', executablePath, headless: true, viewport: { width: 1280, height: 900 }, args: [`--disable-extensions-except=${path.resolve('dist')}`, `--load-extension=${path.resolve('dist')}`] });
const results = []; const consoleErrors = []; const requests = [];
const html = await readFile('tests/fixtures/discussion.html', 'utf8'); const script = await readFile('tests/fixtures/fixture.js', 'utf8');
context.on('request', request => { if (!request.url().startsWith('chrome-extension:')) requests.push(request.url()); });
await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.protocol === 'chrome-extension:') return route.continue();
  if (url.origin === 'https://www.lemonde.fr') return route.fulfill({ status: 200, contentType: url.pathname === '/fixture.js' ? 'text/javascript' : 'text/html', body: url.pathname === '/fixture.js' ? script : html });
  if (url.origin === 'https://example.org') return route.fulfill({ contentType: 'text/html', body: html.replace('<script src="/fixture.js"></script>', '') });
  return route.abort();
});
const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
const id = new URL(worker.url()).host;
const page = await context.newPage(); page.on('pageerror', error => consoleErrors.push(error.message));
if (process.env.BLM_DEBUG) page.on('console', message => { if (message.text().startsWith('BLM_DEBUG')) console.log(message.text()); });
const options = await context.newPage(); options.on('pageerror', error => consoleErrors.push(error.message));
const pause = () => page.waitForTimeout(150);
const record = (name, evidence = '') => { results.push({ name, result: 'pass', evidence }); console.log(`✓ ${name}`); };
const root = id => page.locator(`[data-comment-id="${id}"]`).first();
const hidden = async (id, value = true) => page.waitForFunction(({ id, value }) => document.querySelector(`[data-comment-id="${id}"]`)?.hasAttribute('data-blm-hidden-leaf') === value, { id, value });
const block = async name => { await page.getByRole('button', { name: `Bloquer cet utilisateur : ${name}`, exact: true }).click(); await page.getByRole('dialog', { name: 'Masquer ce commentaire et tous les futurs commentaires de cet auteur ?' }).getByRole('button', { name: 'Bloquer cet utilisateur', exact: true }).click(); };
try {
  await options.goto(`chrome-extension://${id}/options.html`);
  await options.getByRole('combobox', { name: 'Choix pour Peps72', exact: true }).waitFor();
  await page.goto('https://www.lemonde.fr/article-fixture'); await page.getByRole('button', { name: 'Voir les commentaires', exact: true }).click();
  await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur calme', exact: true }).waitFor(); await hidden('default-1');
  const accountShortcut = page.getByRole('button', { name: 'Auteurs masqués — extension', exact: true });
  await accountShortcut.waitFor();
  assert.equal(await accountShortcut.evaluate(node => node.previousElementSibling?.classList.contains('Connexion__account')), true);
  assert.equal(await accountShortcut.evaluate(node => node.closest('.Connexion__account')), null);
  await page.locator('.js-user-connexion').evaluate(node => node.replaceWith(node.cloneNode(true)));
  await pause(); assert.equal(await accountShortcut.count(), 1);
  await worker.evaluate(() => { globalThis.blmOptionsOpens = 0; const original = chrome.runtime.openOptionsPage.bind(chrome.runtime); chrome.runtime.openOptionsPage = async () => { globalThis.blmOptionsOpens++; await original(); }; });
  await accountShortcut.click(); await pause();
  assert.equal(await worker.evaluate(() => globalThis.blmOptionsOpens), 1);
  record('R13 : raccourci dans le menu actuel du compte, hors de son en-tête, sans doublon');
  record('R01/R04 : ouverture tardive et liste initiale appliquée');
  assert.equal(await root('calm-1').locator('.blm-block-button').evaluate(node => node.nextElementSibling?.textContent), 'Signaler');
  await root('calm-1').locator('.blm-block-button').evaluate(node => node.click()); await pause();
  assert.equal(await page.getByRole('dialog', { name: 'Masquer ce commentaire et tous les futurs commentaires de cet auteur ?' }).count(), 0);
  record('Un clic synthétique du site ne déclenche pas le blocage');
  await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur calme', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Masquer ce commentaire et tous les futurs commentaires de cet auteur ?' });
  assert.equal(await modal.getByRole('button', { name: 'Annuler', exact: true }).evaluate(node => node.getRootNode().activeElement === node), true);
  await page.keyboard.press('Escape'); assert.equal(await page.locator('[data-component="comments-popin"]').getAttribute('data-active'), 'true'); await hidden('calm-1', false);
  record('R02/R21 : annulation au clavier et fenêtre native conservée');
  await block('Auteur calme'); await hidden('calm-1');
  const toast = page.locator('.toast'); await toast.getByRole('button', { name: 'Annuler', exact: true }).click(); await hidden('calm-1', false);
  record('R03 : blocage, vraie disparition et annulation');
  // A parent's action arriving late must not borrow a reply's button and bound author.
  await root('parent-1').evaluate(node => { node.querySelector('.blm-block-button')?.remove(); node.querySelector('.ds-comment-meta__link--report')?.remove(); });
  await pause();
  await root('parent-1').evaluate(node => { const report = document.createElement('a'); report.className = 'ds-comment-meta__link--report'; report.href = 'mailto:moderation@example.test'; report.textContent = 'Signaler'; node.querySelector('.ds-comment-meta__right').append(report); });
  await pause();
  await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur du fil', exact: true }).click();
  await page.getByRole('dialog', { name: 'Masquer ce commentaire et tous les futurs commentaires de cet auteur ?' }).getByText('Auteur du fil', { exact: true }).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await root('reply-1').locator('.blm-block-button').count(), 1);
  record('R05/R06 : une action parent tardive conserve la bonne identité et le bouton de réponse');
  await block('Auteur du fil'); await pause();
  assert.equal(await root('parent-1').locator('.ds-comment__content').first().isVisible(), false); assert.equal(await root('reply-1').locator('.ds-comment__content').isVisible(), true);
  record('R06 : réponse d’un autre auteur conservée');
  await options.getByRole('textbox', { name: 'Pseudonyme à masquer' }).fill('Auteur tardif'); await options.getByRole('button', { name: 'Masquer', exact: true }).click();
  await options.getByRole('button', { name: 'Confirmer le masquage', exact: true }).click();
  await options.getByRole('combobox', { name: 'Choix pour Auteur tardif' }).waitFor();
  await page.getByRole('button', { name: 'Charger un commentaire tardif', exact: true }).click(); await hidden('late-1');
  record('R04/R13 : préférence depuis les options et commentaire chargé ensuite');
  await options.getByRole('combobox', { name: 'Choix pour Peps72', exact: true }).selectOption('allow'); await hidden('default-1', false);
  await page.getByRole('button', { name: 'Changer le tri', exact: true }).click(); await hidden('default-1', false); await pause();
  assert.equal(await root('calm-1').locator('.blm-block-button').count(), 1);
  record('R05/R08 : remplacement du DOM, absence de doublon, exception communautaire');
  await page.getByRole('button', { name: 'Afficher temporairement', exact: true }).click();
  await root('parent-1').locator('.ds-comment__content').first().waitFor({ state: 'visible' });
  assert.equal(await root('parent-1').locator('.ds-comment__content').first().isVisible(), true);
  await page.getByRole('button', { name: 'Fermer les commentaires', exact: true }).click(); await pause();
  await page.getByRole('button', { name: 'Voir les commentaires', exact: true }).click(); await pause();
  assert.equal(await root('parent-1').locator('.ds-comment__content').first().isVisible(), false);
  record('R12 : affichage temporaire limité à la discussion ouverte');
  await options.getByLabel('Activer le filtrage', { exact: false }).uncheck(); await pause();
  assert.equal(await page.locator('.blm-block-button').count(), 0); assert.equal(await root('parent-1').locator('.ds-comment__content').first().isVisible(), true);
  await options.getByLabel('Activer le filtrage', { exact: false }).check(); await pause();
  record('R24 : désactivation restaure les commentaires sans supprimer les choix');
  // A real Chrome storage read from an extension page proves that preferences are extension-owned.
  const stored = await options.evaluate(async () => (await chrome.storage.local.get('blm.state.v1'))['blm.state.v1']);
  assert.equal(stored.personalRules.some(rule => rule.label === 'Peps72' && rule.decision === 'allow'), true);
  const siteDBs = await page.evaluate(async () => (await indexedDB.databases()).map(db => db.name)); assert.deepEqual(siteDBs, []);
  record('R19 : stockage dans l’extension et aucune base dans le site');
  // Concurrent clients must not lose independent updates.
  const second = await context.newPage(); await second.goto(`chrome-extension://${id}/options.html`); await second.getByRole('textbox', { name: 'Pseudonyme à masquer' }).waitFor();
  await Promise.all([options.getByRole('textbox', { name: 'Pseudonyme à masquer' }).fill('Concurrent A'), second.getByRole('textbox', { name: 'Pseudonyme à masquer' }).fill('Concurrent B')]);
  await Promise.all([options.getByRole('button', { name: 'Masquer', exact: true }).click(), second.getByRole('button', { name: 'Masquer', exact: true }).click()]);
  await Promise.all([options.getByRole('button', { name: 'Confirmer le masquage', exact: true }).click(), second.getByRole('button', { name: 'Confirmer le masquage', exact: true }).click()]);
  await options.getByRole('combobox', { name: 'Choix pour Concurrent B' }).waitFor(); await second.getByRole('combobox', { name: 'Choix pour Concurrent A' }).waitFor(); await second.close();
  record('R13/R16 : écritures concurrentes sérialisées dans le vrai worker');
  await options.getByRole('textbox', { name: 'Pseudonyme à masquer' }).fill('  Peps72  '); await options.getByRole('button', { name: 'Masquer', exact: true }).click();
  await options.getByRole('status').filter({ hasText: 'figure déjà dans vos listes' }).waitFor();
  assert.equal(await options.getByRole('combobox', { name: 'Choix pour Peps72', exact: true }).inputValue(), 'allow');
  await options.getByRole('searchbox', { name: 'Rechercher un auteur' }).fill('');
  record('Ajout manuel : prévisualisation exacte et doublon sans écraser l’exception');
  await options.getByRole('button', { name: 'Importer', exact: true }).click().catch(() => undefined);
  await options.locator('input[type=file]').setInputFiles({ name: 'invalide.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await options.getByRole('status').filter({ hasText: 'Version du fichier non prise en charge.' }).waitFor();
  const afterBad = await options.evaluate(async () => (await chrome.storage.local.get('blm.state.v1'))['blm.state.v1']); assert.equal(afterBad.personalRules.length, stored.personalRules.length + 2);
  record('R14 : import invalide sans écriture partielle');
  const data = { schemaVersion: 1, settings: { enabled: true, communityEnabled: false, theme: 'system' }, personalRules: [{ identity: { kind: 'displayName', value: 'Peps720' }, label: 'Peps720', decision: 'block' }] };
  await options.locator('input[type=file]').setInputFiles({ name: 'valide.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await options.getByRole('button', { name: 'Remplacer', exact: true }).click();
  await options.getByRole('dialog', { name: 'Remplacer vos préférences ?', exact: true }).getByRole('button', { name: 'Annuler', exact: true }).click();
  await options.getByRole('status').filter({ hasText: 'Import annulé. Aucune préférence modifiée.' }).waitFor();
  record('Annuler le remplacement d’import n’annonce pas de succès');
  await options.getByRole('button', { name: 'Fusionner', exact: true }).click(); await options.getByRole('combobox', { name: 'Choix pour Peps720' }).waitFor();
  record('R07/R15 : import valide et pseudonyme exact distinct');
  const downloadPromise = options.waitForEvent('download'); await options.getByRole('button', { name: 'Exporter', exact: true }).click(); const download = await downloadPromise;
  await download.saveAs('output/test-results/export.json'); assert.equal(JSON.parse(await readFile('output/test-results/export.json', 'utf8')).schemaVersion, 1);
  record('Export JSON utilisable sans permission downloads');
  await page.getByRole('button', { name: 'Gérer les auteurs', exact: true }).first().click();
  const siteSelect = page.getByRole('dialog', { name: 'Auteurs masqués', exact: true }).getByRole('combobox', { name: 'Choix pour Auteur du fil', exact: true });
  if (process.env.BLM_DEBUG) await siteSelect.evaluate(node => { for (const name of ['change', 'keydown', 'click']) node.addEventListener(name, event => console.log('BLM_DEBUG', name, event.isTrusted, event.key, node.value)); });
  await siteSelect.evaluate(node => { node.value = 'allow'; node.dispatchEvent(new Event('change', { bubbles: true })); }); await pause();
  assert.equal(await options.getByRole('combobox', { name: 'Choix pour Auteur du fil', exact: true }).inputValue(), 'block');
  // macOS headless native select menus do not commit with keyboard input in this harness.
  // Verify a trusted button-driven write from the integrated manager instead; native selection is in the live recipe.
  const integrated = page.getByRole('dialog', { name: 'Auteurs masqués', exact: true });
  await integrated.getByRole('textbox', { name: 'Pseudonyme à masquer' }).fill('Auteur ajouté depuis la page');
  await integrated.getByRole('button', { name: 'Masquer', exact: true }).click(); await integrated.getByRole('button', { name: 'Confirmer le masquage', exact: true }).click();
  await options.getByRole('combobox', { name: 'Choix pour Auteur ajouté depuis la page', exact: true }).waitFor();
  await options.getByRole('combobox', { name: 'Choix pour Auteur du fil', exact: true }).selectOption('allow'); await pause();
  assert.equal(await root('parent-1').locator('.ds-comment__content').first().isVisible(), true);
  await page.getByRole('dialog', { name: 'Auteurs masqués', exact: true }).getByRole('button', { name: 'Fermer la fenêtre' }).click();
  record('Gestion locale depuis la discussion');
  await options.getByLabel('Utiliser la liste fournie', { exact: false }).uncheck(); await pause();
  await options.getByRole('combobox', { name: 'Choix pour Peps72', exact: true }).selectOption('default'); await hidden('default-1', false);
  await options.getByLabel('Utiliser la liste fournie', { exact: false }).check(); await hidden('default-1');
  record('R09 : désactivation et réactivation de la liste, sans effacer les règles personnelles');
  // Keep a draft in the native form while its parent comment is hidden.
  await root('calm-1').getByRole('button', { name: 'Répondre', exact: true }).click();
  await root('calm-1').getByRole('textbox', { name: 'Brouillon de réponse' }).fill('Mon brouillon doit rester intact.');
  await block('Auteur calme'); await pause();
  assert.equal(await root('calm-1').getByRole('textbox', { name: 'Brouillon de réponse' }).inputValue(), 'Mon brouillon doit rester intact.');
  assert.equal(await root('calm-1').getByRole('textbox', { name: 'Brouillon de réponse' }).isVisible(), true);
  record('R23 : brouillon de réponse préservé pendant le masquage');
  // Explicit fault injection: real transport and UI must report a failed storage write.
  await worker.evaluate(() => { const original = chrome.storage.local.set.bind(chrome.storage.local); chrome.storage.local.set = () => { chrome.storage.local.set = original; return Promise.reject(new Error('Stockage indisponible (test).')); }; });
  await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur du fil', exact: true }).click();
  await page.getByRole('dialog', { name: 'Masquer ce commentaire et tous les futurs commentaires de cet auteur ?' }).getByRole('button', { name: 'Bloquer cet utilisateur', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Stockage indisponible (test).' }).waitFor();
  assert.equal(await root('parent-1').locator('.ds-comment__content').first().isVisible(), true);
  await page.keyboard.press('Escape'); record('R16 : erreur de stockage injectée, sans faux succès ni masquage');
  // Count unique loaded comments, including replies, not duplicated DOM nodes.
  await page.getByRole('button', { name: 'Charger un commentaire tardif', exact: true }).click(); await hidden('late-2');
  await page.evaluate(() => { const node = document.querySelector('[data-comment-id="late-2"]'); node.parentElement.append(node.cloneNode(true)); }); await pause();
  assert.equal(await page.locator('.blm-summary').getByText('3 commentaires masqués de 3 auteurs parmi les commentaires chargés.', { exact: true }).count(), 1);
  record('R11 : compteur dédupliqué par commentaire chargé');
  // Simulate the host changing an already-processed author during a chunk yield.
  await page.evaluate(() => {
    const list = document.querySelector('[data-element="comments-container"]');
    const original = document.querySelector('[data-comment-id="calm-1"]');
    const nodes = Array.from({ length: 350 }, (_, index) => { const node = original.cloneNode(true); node.dataset.commentId = `yield-${index}`; node.querySelector('.ds-comment-signature__name').textContent = 'Auteur variable'; node.querySelectorAll('.blm-block-button,textarea,.blm-placeholder').forEach(item => item.remove()); return node; });
    const first = nodes[0];
    const observer = new MutationObserver(() => { if (first.querySelector('.blm-block-button')) { observer.disconnect(); first.querySelector('.ds-comment-signature__name').textContent = 'Peps72'; } });
    observer.observe(list, { childList: true, subtree: true });
    list.replaceChildren(...nodes);
  });
  await hidden('yield-0');
  record('R04/R05 : changement d’auteur pendant un traitement par lots sans changement de nombre');
  const outside = await context.newPage(); await outside.goto('https://example.org/'); assert.equal(await outside.locator('.blm-block-button,[data-blm-owned]').count(), 0); await outside.close(); record('R17 : aucune injection sur un autre domaine');
  await page.getByRole('button', { name: 'Structure inconnue', exact: true }).click(); await pause(); assert.equal(await page.getByText('Contenu dont la structure n’est pas reconnue.').isVisible(), true); assert.equal(consoleErrors.length, 0); record('R22 : structure inconnue laissée intacte');
  await page.getByRole('button', { name: 'Changer le tri', exact: true }).click(); await pause();
  await options.getByRole('combobox', { name: 'Choix pour Auteur calme', exact: true }).selectOption('allow'); await hidden('calm-1', false);
  await options.getByRole('combobox', { name: 'Thème des réglages' }).selectOption('light');
  const a11y = await new AxeBuilder({ page: options }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(a11y.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(n => n.target) })), []);
  record('R21 : axe sur les options, aucune violation des règles analysées');
  await mkdir('output/screenshots', { recursive: true });
  await options.screenshot({ path: 'output/screenshots/options-desktop-light.png', fullPage: true });
  await options.getByRole('combobox', { name: 'Thème des réglages' }).selectOption('dark'); await options.screenshot({ path: 'output/screenshots/options-desktop-dark.png', fullPage: true });
  await options.setViewportSize({ width: 390, height: 844 }); await options.screenshot({ path: 'output/screenshots/options-mobile-dark.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: 'output/screenshots/comments-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur calme', exact: true }).click(); await page.screenshot({ path: 'output/screenshots/confirmation.png', fullPage: true }); await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Changer de thème', exact: true }).click(); await pause();
  await page.screenshot({ path: 'output/screenshots/comments-mobile-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur du fil', exact: true }).click(); await page.screenshot({ path: 'output/screenshots/confirmation-mobile-dark.png', fullPage: true });
  const darkA11y = await new AxeBuilder({ page }).include('[data-blm-ui]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); assert.deepEqual(darkA11y.violations.map(v => v.id), []); await page.keyboard.press('Escape');
  await options.setViewportSize({ width: 320, height: 800 }); assert.equal(await options.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  record('R20/R21 : thèmes, confirmation sombre, axe et largeur de 320 px');
  assert.equal(requests.some(url => !url.startsWith('https://www.lemonde.fr/') && !url.startsWith('https://example.org/')), false);
  assert.equal(consoleErrors.length, 0); record('R18 : aucune requête applicative supplémentaire observée');
} catch (error) { await page.screenshot({ path: 'output/test-results/failure-page.png', fullPage: true }).catch(() => {}); await options.screenshot({ path: 'output/test-results/failure-options.png', fullPage: true }).catch(() => {}); results.push({ result: 'fail', error: error.stack }); throw error; }
finally { await writeFile('output/test-results/integration.json', JSON.stringify({ chromium: context.browser()?.version(), date: new Date().toISOString(), results, consoleErrors }, null, 2)); await context.close(); await rm(profile, { recursive: true, force: true }); }
