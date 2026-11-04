import styles from './ui.css';
import { button, el } from './dom.ts';
export type Modal = { host: HTMLDivElement; root: ShadowRoot; dialog: HTMLDialogElement; body: HTMLDivElement; close(): void };
let current: Modal | undefined;
export function makeModal(title: string, opener?: HTMLElement, wide = false, theme: 'light' | 'dark' = 'light'): Modal {
  const previous = current;
  const host = el('div', { 'data-blm-ui': '', 'data-theme': theme });
  const root = host.attachShadow({ mode: 'open' });
  root.append(el('style', {}, styles));
  const dialog = el('dialog', { class: `blm-dialog${wide ? ' wide' : ''}`, 'aria-labelledby': 'blm-dialog-title' });
  const heading = el('h2', { id: 'blm-dialog-title' }, title);
  const body = el('div', { class: 'dialog-body' });
  let closed = false;
  const close = () => {
    if (closed) return; closed = true; window.removeEventListener('keydown', keyboard, true);
    if (dialog.open) dialog.close(); host.remove(); if (current?.host === host) current = previous?.dialog.open ? previous : undefined;
    if (opener?.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
  };
  const keyboard = (event: KeyboardEvent) => {
    if (!dialog.open || current?.dialog !== dialog) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); }
    if (event.key === 'Tab') {
      event.stopImmediatePropagation();
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],summary')].filter(node => node.getClientRects().length && !node.closest('[hidden]'));
      const first = focusable[0]; const last = focusable.at(-1); const active = root.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (active === last || !dialog.contains(active))) { event.preventDefault(); first?.focus(); }
    }
  };
  const closer = button('Fermer', close, 'text-button'); closer.setAttribute('aria-label', 'Fermer la fenêtre');
  dialog.append(el('div', { class: 'dialog-header' }, heading, closer), body); root.append(dialog);
  (opener?.closest('[role="dialog"]') ?? document.body).append(host);
  const modal = { host, root, dialog, body, close }; current = modal;
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close(); } });
  window.addEventListener('keydown', keyboard, true); dialog.showModal();
  return modal;
}
export function confirmAction(title: string, text: string, confirmText: string, opener?: HTMLElement, theme: 'light' | 'dark' = 'light'): Promise<boolean> {
  return new Promise(resolve => {
    const modal = makeModal(title, opener, false, theme);
    modal.body.append(el('p', {}, text));
    const cancel = button('Annuler', () => { resolve(false); modal.close(); });
    const confirm = button(confirmText, () => { resolve(true); modal.close(); }, 'button primary');
    modal.dialog.addEventListener('close', () => resolve(false), { once: true });
    modal.body.append(el('div', { class: 'dialog-actions' }, cancel, confirm)); cancel.focus();
  });
}
export function closeModal(): void { while (current) current.close(); }
