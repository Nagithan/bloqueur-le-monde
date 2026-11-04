import styles from '../shared/ui.css';
import { button, el } from '../shared/dom.ts';
import { makeModal } from '../shared/modal.ts';
import { Manager } from '../shared/manager.ts';
import { identityKey } from '../core/model.ts';
import type { Identity, Rule } from '../core/model.ts';
import type { Client } from '../shared/client.ts';
import type { CommentView } from './adapter.ts';
import { themeOf } from './adapter.ts';

let toastHost: HTMLElement | undefined;
export function dismissToast(): void { toastHost?.remove(); toastHost = undefined; }
export function toast(message: string, theme: 'light' | 'dark', undo?: () => Promise<void>, details?: () => void): void {
  toastHost?.remove();
  const host = el('div', { 'data-blm-ui': '', 'data-theme': theme }); const shadow = host.attachShadow({ mode: 'open' }); shadow.append(el('style', {}, styles));
  const box = el('div', { class: 'toast', role: 'status', 'aria-live': 'polite', tabindex: '-1' }, el('p', {}, message));
  const close = () => { host.remove(); if (toastHost === host) toastHost = undefined; };
  const actions = el('div', { class: 'tools' });
  if (undo) { const cancel = button('Annuler', () => { cancel.disabled = true; void undo().then(close).catch(error => { cancel.disabled = false; box.querySelector('p')!.textContent = error.message; }); }, 'text-button'); actions.append(cancel); }
  if (details) actions.append(button('Gérer les auteurs', details, 'text-button'));
  actions.append(button('Fermer', close, 'text-button')); box.append(actions); shadow.append(box); document.body.append(host); toastHost = host;
  // Do not destroy a focused action while the reader is using it.
  setTimeout(() => { if (!shadow.activeElement) close(); }, undo ? 15000 : 10000);
  if (undo) box.focus({ preventScroll: true });
}
export function openManager(client: Client, opener?: HTMLElement, hostTheme?: 'light' | 'dark'): void {
  const modal = makeModal('Auteurs masqués', opener, true, hostTheme ?? themeOf(opener ?? document.body));
  const manager = new Manager(client, true); modal.body.append(manager.element);
  modal.dialog.addEventListener('close', () => manager.destroy(), { once: true });
}
export function blockComment(client: Client, view: CommentView, opener: HTMLElement): void {
  const theme = themeOf(view.root); const modal = makeModal('Masquer ce commentaire et tous les futurs commentaires de cet auteur ?', opener, false, theme);
  const identity: Identity = view.author.id ? { kind: 'authorId', value: view.author.id } : { kind: 'displayName', value: view.author.name };
  modal.body.append(el('p', { class: 'author' }, view.author.name));
  if (!view.author.id) modal.body.append(el('p', { class: 'hint' }, 'Les commentaires portant exactement ce pseudonyme seront masqués. Les homonymes sont concernés.'));
  modal.body.append(el('p', { class: 'hint' }, 'Ce masquage s’applique sur ce profil Chrome.'));
  const error = el('p', { class: 'status error', role: 'alert' });
  const cancel = button('Annuler', () => modal.close());
  const confirm = button('Bloquer cet utilisateur', () => {
    const previous = client.snapshot?.state.personalRules.find(rule => identityKey(rule.identity) === identityKey(identity)) ?? null;
    const rule: Rule = { identity, label: view.author.name, decision: 'block' };
    confirm.disabled = true; error.textContent = '';
    void client.send({ type: 'rule', identity, rule }).then(() => {
      modal.close();
      toast(`Les commentaires de ${view.author.name} sont masqués.`, theme, async () => { await client.send({ type: 'rule', identity, rule: previous, expected: rule }); }, () => openManager(client, undefined, theme));
    }).catch(failure => { confirm.disabled = false; error.textContent = failure.message; });
  }, 'button primary');
  modal.body.append(error, el('div', { class: 'dialog-actions' }, cancel, confirm)); cancel.focus();
}
