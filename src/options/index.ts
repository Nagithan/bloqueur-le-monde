import { Client } from '../shared/client.ts';
import { Manager } from '../shared/manager.ts';
import { button, el } from '../shared/dom.ts';
import { confirmAction } from '../shared/modal.ts';
import type { Settings } from '../core/model.ts';

let selectedTheme: Settings['theme'] = 'system';
const media = matchMedia('(prefers-color-scheme: dark)');
function applyTheme(theme: Settings['theme']): void { selectedTheme = theme; document.body.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme; }
media.addEventListener('change', () => applyTheme(selectedTheme)); applyTheme('system');
const mount = document.querySelector<HTMLElement>('#manager')!;
let manager: Manager;
const client = new Client(message => queueMicrotask(() => manager?.showError(message)));
manager = new Manager(client, false, applyTheme); mount.replaceChildren(manager.element);
document.querySelector('#version')!.textContent = `Version ${chrome.runtime.getManifest().version}`;
void client.send({ type: 'get' }).catch(error => {
  manager.showError(error.message);
  const recovery = button('Réinitialiser les données locales', () => {
    void (async () => {
      if (!await confirmAction('Réinitialiser les données locales ?', 'Les données actuelles seront effacées. Utilisez cette action seulement si vous acceptez de perdre vos choix personnels.', 'Réinitialiser', recovery, document.body.dataset.theme === 'dark' ? 'dark' : 'light')) return;
      try { await client.send({ type: 'reset' }); recovery.remove(); } catch (failure) { manager.showError(failure instanceof Error ? failure.message : 'Échec de la réinitialisation.'); }
    })();
  });
  mount.append(el('p', { class: 'hint' }, 'Une version récente de l’extension peut être nécessaire pour relire vos préférences.'), recovery);
});
