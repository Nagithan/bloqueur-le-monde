import { compileRules, identityKey } from '../core/model.ts';
import type { Snapshot } from '../core/model.ts';
import { Client } from '../shared/client.ts';
import { button, el } from '../shared/dom.ts';
import { DISCUSSION_SELECTOR, ROOT_SELECTOR, getDiscussion, own, readComment, themeOf } from './adapter.ts';
import type { CommentView } from './adapter.ts';
import { blockComment, dismissToast, openManager, toast } from './ui.ts';

if (location.origin === 'https://www.lemonde.fr' && window === window.top) start();
function start(): void {
  let snapshot: Snapshot | undefined;
  let decide: ReturnType<typeof compileRules> | undefined;
  let discussion: HTMLElement | null = null;
  let discussionKey = '';
  let settingsOpened = false;
  const views = new Map<HTMLElement, CommentView>();
  const boundButtons = new WeakSet<HTMLButtonElement>();
  const boundAccountShortcuts = new WeakSet<HTMLElement>();
  let welcome: { host: HTMLElement; original: DocumentFragment; counter: HTMLElement } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let processing = false;
  let stopped = false;
  let observer: MutationObserver;
  const client = new Client(message => { if (discussion) toast(message, themeOf(discussion)); });
  let rerender = false;
  const schedule = () => { if (processing) { rerender = true; return; } if (!stopped && timer === undefined) timer = setTimeout(() => { timer = undefined; void render(); }, 30); };
  const isOwned = (node: Node) => { const element = node instanceof Element ? node : node.parentElement; return !!element?.closest('[data-blm-owned],[data-blm-ui]'); };
  observer = new MutationObserver(records => {
    for (const record of records) {
      if (isOwned(record.target)) continue;
      const target = record.target instanceof Element ? record.target : record.target.parentElement;
      const important = target && (target === document.documentElement || target === document.body || target.closest(DISCUSSION_SELECTOR));
      const structure = [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element && !isOwned(node) && (node.matches(DISCUSSION_SELECTOR) || !!node.querySelector(DISCUSSION_SELECTOR)));
      const account = [...record.addedNodes].some(node => node instanceof Element && (node.matches('a[href^="https://compte.lemonde.fr"]') || !!node.querySelector('a[href^="https://compte.lemonde.fr"]')));
      if (important || structure || account) { schedule(); break; }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-active', 'data-comment-id', 'data-author-id', 'data-count', 'class', 'data-theme', 'data-color-scheme', 'aria-hidden'], characterData: true });
  function restore(root: HTMLElement): void {
    root.removeAttribute('data-blm-hidden-leaf');
    for (const part of root.querySelectorAll('.blm-hidden-part')) if (part.closest(ROOT_SELECTOR) === root) part.classList.remove('blm-hidden-part');
  }
  function restoreWelcome(): void {
    if (welcome) { welcome.host.replaceChildren(welcome.original); welcome = undefined; }
  }
  function cleanup(): void {
    for (const [root] of views) { restore(root); root.querySelectorAll('.blm-block-button').forEach(node => node.remove()); }
    views.clear(); restoreWelcome();
  }
  async function render(): Promise<void> {
    if (processing) return;
    // Keep settings and recovery reachable even when saved preferences cannot load.
    addAccountShortcut();
    if (location.hash !== '#blm-settings') settingsOpened = false;
    else if (!settingsOpened) { settingsOpened = true; openManager(client); }
    if (!snapshot || !decide) return;
    processing = true; observer.disconnect();
    const revisionAtStart = snapshot.state.revision;
    let rootsAtStart = 0;
    try {
      const next = getDiscussion(); const key = `${location.pathname}${location.search}`;
      if (next !== discussion || key !== discussionKey) { cleanup(); discussion = next; discussionKey = key; }
      if (!discussion) return;
      const current = new Set<HTMLElement>(); const hiddenIds = new Set<string | HTMLElement>(); const hiddenAuthors = new Set<string>();
      const nodes = [...discussion.querySelectorAll<HTMLElement>(ROOT_SELECTOR)];
      rootsAtStart = nodes.length;
      const nativeStyles = new Map<string, { font: string; color: string }>();
      for (const report of discussion.querySelectorAll<HTMLElement>('.ds-comment-meta__link--report,.comment__report,[data-action="report"]')) {
        if (!nativeStyles.has(report.className)) { const css = getComputedStyle(report); nativeStyles.set(report.className, { font: css.font, color: css.color }); }
      }
      for (let index = 0; index < nodes.length; index++) {
        const root = nodes[index]; current.add(root); restore(root);
        const view = readComment(root);
        if (!view) { root.querySelectorAll('.blm-block-button').forEach(node => node.remove()); views.delete(root); continue; }
        views.set(root, view);
        const result = decide(view.author);
        const blocked = result.blocked;
        if (blocked) {
          hiddenIds.add(view.id ?? root); hiddenAuthors.add(identityKey(result.identity));
          if (!view.hasReplies && !view.hasDraft) root.setAttribute('data-blm-hidden-leaf', '');
          else {
            for (const part of view.parts) if (!part.querySelector('textarea')) part.classList.add('blm-hidden-part');
          }
        }
        let previous: HTMLButtonElement | null = own<HTMLButtonElement>(root, '.blm-block-button')[0] ?? null;
        if (previous && !boundButtons.has(previous)) { previous.remove(); previous = null; }
        if (snapshot.state.settings.enabled && view.report) {
          if (!previous) {
            const block = button('Bloquer cet utilisateur', () => { const latest = readComment(root); if (latest) blockComment(client, latest, block); }, 'blm-block-button');
            block.setAttribute('data-blm-owned', ''); block.setAttribute('aria-label', `Bloquer cet utilisateur : ${view.author.name}`);
            const native = nativeStyles.get(view.report.className); if (native) { block.style.font = native.font; block.style.color = native.color; }
            boundButtons.add(block);
            view.report.before(block);
          } else { previous.setAttribute('aria-label', `Bloquer cet utilisateur : ${view.author.name}`); const native = nativeStyles.get(view.report.className); if (native) { previous.style.font = native.font; previous.style.color = native.color; } if (previous.nextElementSibling !== view.report) view.report.before(previous); }
        } else previous?.remove();
        if (index > 0 && index % 150 === 0) {
          // Observe host changes while yielding. A same-size rebuild or author change
          // must schedule another pass even when the number of comments is unchanged.
          observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-active', 'data-comment-id', 'data-author-id', 'data-count', 'class', 'data-theme', 'data-color-scheme', 'aria-hidden'], characterData: true });
          await new Promise<void>(resolve => setTimeout(resolve, 0));
          observer.disconnect();
        }
      }
      for (const [root] of views) if (!current.has(root) || !root.isConnected) { restore(root); views.delete(root); }
      updateSummary(hiddenIds.size, hiddenAuthors.size);
    } finally {
      processing = false;
      if (!stopped) observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-active', 'data-comment-id', 'data-author-id', 'data-count', 'class', 'data-theme', 'data-color-scheme', 'aria-hidden'], characterData: true });
      if (rerender || revisionAtStart !== snapshot?.state.revision || getDiscussion() !== discussion || (discussion && discussion.querySelectorAll(ROOT_SELECTOR).length !== rootsAtStart)) { rerender = false; schedule(); }
    }
  }
  function updateSummary(count: number, authors: number): void {
    if (!snapshot || !discussion) return;
    const host = discussion.querySelector<HTMLElement>('[data-element="welcome-message"],.ds-comments-welcome-message');
    if (welcome && (welcome.host !== host || !snapshot.state.settings.enabled)) restoreWelcome();
    if (!host || !snapshot.state.settings.enabled) return;
    if (!welcome) {
      // Reuse the host's text element and its typography; never match editorial copy.
      const native = host.querySelector<HTMLElement>('.ds-comments-welcome-message__text,p');
      const counter = el('p', { class: native?.className ?? 'ds-comments-welcome-message__text', 'data-blm-owned': '', 'data-blm-counter': '', role: 'status' });
      const original = document.createDocumentFragment();
      original.append(...host.childNodes);
      welcome = { host, original, counter };
    }
    const text = `${count} ${count > 1 ? 'commentaires masqués' : 'commentaire masqué'} · ${authors} ${authors > 1 ? 'commentateurs' : 'commentateur'}`;
    if (welcome.counter.textContent !== text) welcome.counter.textContent = text;
    if (host.childNodes.length !== 1 || host.firstChild !== welcome.counter) host.replaceChildren(welcome.counter);
  }
  function addAccountShortcut(): void {
    for (const context of document.querySelectorAll<HTMLElement>('[data-component*="account"],.ds-account,.ds-header__account,.account,.js-user-connexion')) {
      if (context.closest('[data-blm-ui]')) continue;
      const existing = context.querySelector<HTMLElement>('.blm-account-link');
      if (existing && boundAccountShortcuts.has(existing)) continue;
      existing?.remove();
      const link = context.querySelector<HTMLAnchorElement>('a[href^="https://compte.lemonde.fr"]');
      if (!link?.parentElement) continue;
      const shortcut = button('', () => openManager(client, shortcut), 'Connexion__link blm-account-link');
      shortcut.append(el('div', {}, el('span', { class: 'Connexion__label' }, 'Commentateurs masqués (Extension)')));
      shortcut.setAttribute('data-blm-owned', '');
      boundAccountShortcuts.add(shortcut);
      // The current host groups subscription details in this header. Keep the local
      // preference shortcut as its sibling, outside account-identifying content.
      const header = link.closest('.Connexion__account');
      if (header && context.contains(header)) header.after(shortcut); else link.parentElement.append(shortcut);
    }
  }
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id === chrome.runtime.id && message?.type === 'blm-open-settings') { openManager(client); respond(true); }
  });
  client.subscribe(next => { if (snapshot && next.state.revision !== snapshot.state.revision) dismissToast(); snapshot = next; decide = compileRules(next); schedule(); });
  void client.send({ type: 'get' }).catch(error => { if (getDiscussion()) toast(error.message, themeOf(document.body)); });
  for (const event of ['popstate', 'hashchange', 'pageshow', 'commentsLoaded', 'commentsAdded']) addEventListener(event, schedule);
  document.addEventListener('commentsLoaded', schedule);
  document.addEventListener('commentsAdded', schedule);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { void client.send({ type: 'get' }).catch(() => undefined); schedule(); } });
  document.addEventListener('input', event => { if (event.target instanceof HTMLTextAreaElement && event.target.closest(DISCUSSION_SELECTOR)) schedule(); });
  addEventListener('pagehide', event => { if (!(event as PageTransitionEvent).persisted) { stopped = true; clearTimeout(timer); observer.disconnect(); client.close(); } });
  schedule();
}
