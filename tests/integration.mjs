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
const launchOptions = { channel: 'chromium', executablePath, headless: true, viewport: { width: 1280, height: 900 }, args: [`--disable-extensions-except=${path.resolve('dist')}`, `--load-extension=${path.resolve('dist')}`] };
const context = await chromium.launchPersistentContext(profile, launchOptions);
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
const managerTitle = 'Commentateurs masqués (Extension)';
const getStored = () => worker.evaluate(async () => (await chrome.storage.local.get('blm.state.v1'))['blm.state.v1']);
const add = async (surface, name) => {
  await surface.getByRole('textbox', { name: 'Pseudonyme à masquer' }).fill(name);
  await surface.getByRole('button', { name: 'Masquer', exact: true }).click();
  await surface.getByRole('button', { name: 'Confirmer le masquage', exact: true }).click();
  await surface.getByRole('button', { name: `Ne plus masquer ${name.trim()}`, exact: true }).waitFor();
};
const openSettings = async surface => {
  await surface.getByRole('button', { name: managerTitle, exact: true }).click();
  return surface.getByRole('dialog', { name: managerTitle, exact: true });
};
try {
  await options.goto(`chrome-extension://${id}/options.html`);
  await options.getByRole('button', { name: 'Ne plus masquer Peps72', exact: true }).waitFor();
  assert.equal(new URL(options.url()).origin, 'https://www.lemonde.fr');
  assert.equal(await options.getByRole('combobox').count(), 0);
  assert.equal(await options.getByText('Apparence', { exact: true }).count(), 0);
  record('Réglages Chrome redirigés vers le gestionnaire unique sur Le Monde, sans sélecteurs ni apparence');

  await page.goto('https://www.lemonde.fr/article-fixture');
  await page.getByRole('button', { name: 'Voir les commentaires', exact: true }).click();
  await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur calme', exact: true }).waitFor(); await hidden('default-1');
  const accountShortcut = page.getByRole('button', { name: managerTitle, exact: true });
  await accountShortcut.waitFor();
  assert.equal(await accountShortcut.evaluate(node => node.previousElementSibling?.classList.contains('Connexion__account')), true);
  const menuStyle = await page.locator('.native-menu-link,.blm-account-link').evaluateAll(nodes => nodes.map(node => {
    const css = getComputedStyle(node); const r = node.getBoundingClientRect();
    return [css.fontFamily, css.fontWeight, css.color, css.padding, css.margin, css.width, css.height, r.x];
  }));
  assert.deepEqual(menuStyle[0], menuStyle[1]);
  await page.locator('.native-menu-link').hover(); const nativeHover = await page.locator('.native-menu-link').evaluate(node => getComputedStyle(node).backgroundColor);
  await accountShortcut.hover(); assert.equal(await accountShortcut.evaluate(node => getComputedStyle(node).backgroundColor), nativeHover);
  await page.locator('.js-user-connexion').evaluate(node => node.replaceWith(node.cloneNode(true)));
  await pause(); assert.equal(await accountShortcut.count(), 1);
  const integrated = await openSettings(page);
  await page.keyboard.press('Escape');
  record('Menu du compte : mêmes police, graisse, couleur, marges, largeur et survol que le lien natif ; reconstruction sans doublon');

  const welcome = page.locator('[data-element="welcome-message"]');
  assert.equal(await welcome.innerText(), '1 commentaire masqué · 1 commentateur');
  assert.equal(await page.locator('.blm-summary,.blm-placeholder').count(), 0);
  assert.equal(await page.getByRole('button', { name: /Afficher temporairement|Afficher ce commentaire/ }).count(), 0);
  const counterStyle = await welcome.locator('p').evaluate(node => [getComputedStyle(node).fontFamily, getComputedStyle(node).fontWeight]);
  assert.deepEqual(counterStyle, ['Arial, sans-serif', '400']);
  await welcome.evaluate(node => { node.innerHTML = '<h2 class="ds-comments-welcome-message__title">Un autre titre</h2><p class="ds-comments-welcome-message__text">Un autre texte éditorial.</p>'; });
  await page.waitForFunction(() => document.querySelector('[data-blm-counter]')?.textContent === '1 commentaire masqué · 1 commentateur');
  record('Compteur dans le composant natif, indépendant du texte, sans panneau ou action de révélation');

  assert.equal(await root('calm-1').locator('.blm-block-button').evaluate(node => node.nextElementSibling?.textContent), 'Signaler');
  await root('calm-1').locator('.blm-block-button').evaluate(node => node.click()); await pause();
  assert.equal(await page.getByRole('dialog', { name: 'Masquer ce commentaire et tous les futurs commentaires de cet auteur ?' }).count(), 0);
  await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur calme', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Masquer ce commentaire et tous les futurs commentaires de cet auteur ?' });
  assert.equal(await modal.getByRole('button', { name: 'Annuler', exact: true }).evaluate(node => node.getRootNode().activeElement === node), true);
  await page.keyboard.press('Escape'); await hidden('calm-1', false);
  await block('Auteur calme'); await hidden('calm-1');
  await page.locator('.toast').getByRole('button', { name: 'Annuler', exact: true }).click(); await hidden('calm-1', false);
  record('Blocage confirmé, annulation et protection contre les clics synthétiques du site');

  await block('Auteur du fil'); await root('parent-1').locator('.ds-comment__content').first().waitFor({ state: 'hidden' });
  assert.equal(await root('parent-1').locator('.ds-comment__content').first().isVisible(), false);
  assert.equal(await root('reply-1').locator('.ds-comment__content').isVisible(), true);
  assert.equal(await root('parent-1').getByRole('button', { name: /Afficher ce commentaire/ }).count(), 0);
  record('Parent masqué sans commande de révélation ; réponse d’un autre commentateur conservée');

  await add(options, 'Auteur tardif');
  await page.getByRole('button', { name: 'Charger un commentaire tardif', exact: true }).click(); await hidden('late-1');
  await options.getByRole('button', { name: 'Ne plus masquer Peps72', exact: true }).evaluate(node => node.click()); await pause();
  await hidden('default-1');
  await options.getByRole('button', { name: 'Ne plus masquer Peps72', exact: true }).click(); await hidden('default-1', false);
  assert.equal(await options.getByRole('button', { name: 'Ne plus masquer Peps72', exact: true }).count(), 0);
  assert.equal((await getStored()).personalRules.some(rule => rule.label === 'Peps72' && rule.decision === 'allow'), true);
  await page.getByRole('button', { name: 'Changer le tri', exact: true }).click(); await hidden('default-1', false);
  await root('calm-1').locator('.blm-block-button').waitFor();
  assert.equal(await root('calm-1').locator('.blm-block-button').count(), 1);
  await options.getByLabel('Utiliser la liste communautaire', { exact: true }).uncheck();
  await options.getByLabel('Utiliser la liste communautaire', { exact: true }).check(); await hidden('default-1', false);
  await options.reload(); await options.getByRole('button', { name: 'Ne plus masquer Auteur du fil', exact: true }).waitFor(); await hidden('default-1', false);
  record('Corbeille communautaire : exception persistante après tri, désactivation/réactivation et rechargement');

  await options.getByLabel('Activer le filtrage', { exact: true }).uncheck(); await pause();
  await welcome.getByRole('heading', { name: 'Bienvenue dans l’espace commentaires' }).waitFor();
  assert.equal(await page.locator('.blm-block-button').count(), 0);
  assert.equal(await root('parent-1').locator('.ds-comment__content').first().isVisible(), true);
  await options.getByLabel('Activer le filtrage', { exact: true }).check(); await pause();
  await page.waitForFunction(() => document.querySelector('[data-blm-counter]')?.textContent === '1 commentaire masqué · 1 commentateur');
  assert.equal(await welcome.innerText(), '1 commentaire masqué · 1 commentateur');
  await page.getByRole('button', { name: 'Fermer les commentaires', exact: true }).click(); await pause();
  await page.getByRole('button', { name: 'Voir les commentaires', exact: true }).click(); await pause();
  assert.equal(await root('parent-1').locator('.ds-comment__content').first().isVisible(), false);
  record('Désactivation : commentaires et accueil natif restaurés ; fermeture/réouverture sans révélation');

  const second = await context.newPage(); await second.goto(`chrome-extension://${id}/options.html`);
  await second.getByRole('textbox', { name: 'Pseudonyme à masquer' }).waitFor();
  await Promise.all([add(options, 'Concurrent A'), add(second, 'Concurrent B')]);
  await options.getByRole('button', { name: 'Ne plus masquer Concurrent B', exact: true }).waitFor();
  await second.getByRole('button', { name: 'Ne plus masquer Concurrent A', exact: true }).waitFor(); await second.close();
  const siteDBs = await page.evaluate(async () => (await indexedDB.databases()).map(db => db.name)); assert.deepEqual(siteDBs, []);
  record('Écritures concurrentes entre deux gestionnaires, stockage privé dans l’extension');

  await options.getByRole('textbox', { name: 'Pseudonyme à masquer' }).fill('  Concurrent A  ');
  await options.getByRole('button', { name: 'Masquer', exact: true }).click();
  await options.getByRole('status').filter({ hasText: 'est déjà masqué' }).waitFor();
  assert.equal((await getStored()).personalRules.filter(rule => rule.label === 'Concurrent A').length, 1);
  await options.getByRole('searchbox', { name: 'Rechercher un commentateur' }).fill('');
  await options.getByRole('button', { name: 'Ne plus masquer Concurrent A', exact: true }).click();
  assert.equal((await getStored()).personalRules.some(rule => rule.label === 'Concurrent A'), false);
  record('Ajout normalisé sans doublon et suppression personnelle par corbeille');

  // Browser file chooser yields trusted events in the site-hosted, isolated manager.
  const chooseFile = async file => {
    const chooser = options.waitForEvent('filechooser');
    await options.getByRole('button', { name: 'Importer', exact: true }).click();
    await (await chooser).setFiles(file);
  };
  const beforeBad = await getStored();
  await chooseFile({ name: 'invalide.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await options.getByRole('status').filter({ hasText: 'Version du fichier non prise en charge.' }).waitFor();
  assert.equal((await getStored()).revision, beforeBad.revision);
  const data = { schemaVersion: 1, settings: { enabled: true, communityEnabled: false, theme: 'dark' }, personalRules: [{ identity: { kind: 'displayName', value: 'Peps720' }, label: 'Peps720', decision: 'block' }] };
  await chooseFile({ name: 'valide.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await options.getByRole('button', { name: 'Remplacer', exact: true }).click();
  await options.getByRole('dialog', { name: 'Remplacer vos préférences ?', exact: true }).getByRole('button', { name: 'Annuler', exact: true }).click();
  await options.getByRole('status').filter({ hasText: 'Import annulé. Aucune préférence modifiée.' }).waitFor();
  await options.getByRole('button', { name: 'Fusionner', exact: true }).click();
  await options.getByRole('button', { name: 'Ne plus masquer Peps720', exact: true }).waitFor();
  const downloadPromise = options.waitForEvent('download'); await options.getByRole('button', { name: 'Exporter', exact: true }).click();
  await (await downloadPromise).saveAs('output/test-results/export.json');
  assert.equal(JSON.parse(await readFile('output/test-results/export.json', 'utf8')).schemaVersion, 1);
  record('Import invalide sans écriture, import annulé, fusion et export depuis les réglages intégrés');

  await openSettings(page);
  await add(integrated, 'Auteur ajouté depuis la page');
  await options.getByRole('button', { name: 'Ne plus masquer Auteur ajouté depuis la page', exact: true }).waitFor();
  await integrated.getByRole('button', { name: 'Ne plus masquer Auteur du fil', exact: true }).click(); await pause();
  await root('parent-1').locator('.ds-comment__content').first().waitFor({ state: 'visible' });
  assert.equal(await root('parent-1').locator('.ds-comment__content').first().isVisible(), true);
  await page.keyboard.press('Escape');
  record('Un seul gestionnaire dans le compte et les options, restauration immédiate par corbeille');

  await root('calm-1').getByRole('button', { name: 'Répondre', exact: true }).click();
  await root('calm-1').getByRole('textbox', { name: 'Brouillon de réponse' }).fill('Mon brouillon doit rester intact.');
  await block('Auteur calme'); await pause();
  assert.equal(await root('calm-1').getByRole('textbox', { name: 'Brouillon de réponse' }).inputValue(), 'Mon brouillon doit rester intact.');
  assert.equal(await root('calm-1').getByRole('textbox', { name: 'Brouillon de réponse' }).isVisible(), true);
  await worker.evaluate(() => { const original = chrome.storage.local.set.bind(chrome.storage.local); chrome.storage.local.set = () => { chrome.storage.local.set = original; return Promise.reject(new Error('Stockage indisponible (test).')); }; });
  await page.getByRole('button', { name: 'Bloquer cet utilisateur : Auteur du fil', exact: true }).click();
  await page.getByRole('dialog', { name: 'Masquer ce commentaire et tous les futurs commentaires de cet auteur ?' }).getByRole('button', { name: 'Bloquer cet utilisateur', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Stockage indisponible (test).' }).waitFor();
  assert.equal(await root('parent-1').locator('.ds-comment__content').first().isVisible(), true);
  await page.keyboard.press('Escape');
  record('Brouillon préservé et erreur de stockage sans faux succès');

  await add(options, 'Peps72'); await hidden('default-1');
  await page.getByRole('button', { name: 'Charger un commentaire tardif', exact: true }).click(); await hidden('late-2');
  await page.evaluate(() => { const node = document.querySelector('[data-comment-id="late-2"]'); node.parentElement.append(node.cloneNode(true)); }); await pause();
  await page.waitForFunction(() => document.querySelector('[data-blm-counter]')?.textContent === '3 commentaires masqués · 3 commentateurs');
  assert.equal(await welcome.innerText(), '3 commentaires masqués · 3 commentateurs');
  await welcome.evaluate(node => node.remove()); await pause();
  assert.equal(await page.locator('.blm-summary,[data-blm-counter]').count(), 0);
  await page.locator('[data-element="comments-main"]').evaluate(node => { const welcome = document.createElement('div'); welcome.className = 'ds-comments-welcome-message'; welcome.dataset.element = 'welcome-message'; welcome.innerHTML = '<h2>Nouveau message du site</h2><p class="ds-comments-welcome-message__text">Texte différent.</p>'; node.prepend(welcome); });
  await page.waitForFunction(() => document.querySelector('[data-blm-counter]')?.textContent === '3 commentaires masqués · 3 commentateurs');
  record('Compteur dédupliqué ; composant absent laissé sans ajout, composant reconstruit retrouvé');

  await page.evaluate(() => {
    const list = document.querySelector('[data-element="comments-container"]');
    const original = document.querySelector('[data-comment-id="calm-1"]');
    const nodes = Array.from({ length: 350 }, (_, index) => { const node = original.cloneNode(true); node.dataset.commentId = `yield-${index}`; node.querySelector('.ds-comment-signature__name').textContent = 'Auteur variable'; node.querySelectorAll('.blm-block-button,textarea').forEach(item => item.remove()); return node; });
    const first = nodes[0];
    const observer = new MutationObserver(() => { if (first.querySelector('.blm-block-button')) { observer.disconnect(); first.querySelector('.ds-comment-signature__name').textContent = 'Peps72'; } });
    observer.observe(list, { childList: true, subtree: true }); list.replaceChildren(...nodes);
  }); await hidden('yield-0');
  record('Changement d’auteur pendant un traitement par lots');
  const outside = await context.newPage(); await outside.goto('https://example.org/'); assert.equal(await outside.locator('.blm-block-button,[data-blm-owned]').count(), 0); await outside.close();
  await page.getByRole('button', { name: 'Structure inconnue', exact: true }).click(); await pause(); assert.equal(await page.getByText('Contenu dont la structure n’est pas reconnue.').isVisible(), true);
  await page.getByRole('button', { name: 'Changer le tri', exact: true }).click(); await pause();
  record('Autre domaine et structure inconnue laissés intacts');

  // Exercise the extension action without requiring a browser-toolbar automation.
  const beforeAction = context.pages().length;
  await worker.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { type: 'blm-open-settings' });
  });
  await options.getByRole('dialog', { name: managerTitle, exact: true }).waitFor();
  assert.equal(context.pages().length, beforeAction);
  assert.equal(await options.getByRole('dialog', { name: managerTitle, exact: true }).count(), 1);
  record('Ouverture depuis le bouton de l’extension : même gestionnaire, sans doublon');

  await mkdir('output/screenshots', { recursive: true });
  const a11y = await new AxeBuilder({ page: options }).include('[data-blm-ui]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(a11y.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(n => n.target) })), []);
  await options.screenshot({ path: 'output/screenshots/options-desktop-light.png' });
  await options.evaluate(() => document.body.classList.add('dark'));
  await options.waitForFunction(() => document.querySelector('[data-blm-ui]')?.getAttribute('data-theme') === 'dark');
  await options.screenshot({ path: 'output/screenshots/options-desktop-dark.png' });
  await options.setViewportSize({ width: 390, height: 844 });
  await options.screenshot({ path: 'output/screenshots/options-mobile-dark.png' });
  const darkA11y = await new AxeBuilder({ page: options }).include('[data-blm-ui]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); assert.deepEqual(darkA11y.violations.map(v => v.id), []);
  await options.setViewportSize({ width: 320, height: 800 });
  assert.equal(await options.getByRole('dialog', { name: managerTitle, exact: true }).evaluate(node => node.scrollWidth <= node.clientWidth), true);
  await page.screenshot({ path: 'output/screenshots/comments-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Changer de thème', exact: true }).click(); await pause();
  await page.screenshot({ path: 'output/screenshots/comments-mobile-dark.png', fullPage: true });
  record('Accessibilité axe, thème du Monde suivi en direct, captures ordinateur/mobile et largeur 320 px');
  assert.equal(requests.some(url => !url.startsWith('https://www.lemonde.fr/') && !url.startsWith('https://example.org/')), false);
  assert.equal(consoleErrors.length, 0);
  record('Aucune erreur JavaScript ni requête applicative supplémentaire');
  // Recovery must remain reachable after moving the autonomous options into the site.
  await worker.evaluate(async () => { await chrome.storage.local.set({ 'blm.state.v1': { schemaVersion: 999 } }); });
  await context.close();
  const recoveryContext = await chromium.launchPersistentContext(profile, launchOptions);
  try {
    await recoveryContext.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.protocol === 'chrome-extension:') return route.continue();
      if (url.origin === 'https://www.lemonde.fr') return route.fulfill({ contentType: url.pathname === '/fixture.js' ? 'text/javascript' : 'text/html', body: url.pathname === '/fixture.js' ? script : html });
      return route.abort();
    });
    const recovery = await recoveryContext.newPage(); await recovery.goto(`chrome-extension://${id}/options.html`);
    await recovery.getByRole('button', { name: 'Réinitialiser les données locales', exact: true }).click();
    await recovery.getByRole('dialog', { name: 'Réinitialiser les données locales ?', exact: true }).getByRole('button', { name: 'Réinitialiser', exact: true }).click();
    await recovery.getByRole('button', { name: 'Ne plus masquer Peps72', exact: true }).waitFor();
  } finally { await recoveryContext.close(); }
  record('Préférences illisibles : gestionnaire et réinitialisation accessibles sur Le Monde');
} catch (error) { await page.screenshot({ path: 'output/test-results/failure-page.png', fullPage: true }).catch(() => {}); await options.screenshot({ path: 'output/test-results/failure-options.png', fullPage: true }).catch(() => {}); results.push({ result: 'fail', error: error.stack }); throw error; }
finally { await writeFile('output/test-results/integration.json', JSON.stringify({ chromium: context.browser()?.version(), date: new Date().toISOString(), results, consoleErrors }, null, 2)); await context.close(); await rm(profile, { recursive: true, force: true }); }
