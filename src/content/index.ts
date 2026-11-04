import { compileRules, identityKey } from '../core/model.ts';
import type { Snapshot } from '../core/model.ts';
import { Client } from '../shared/client.ts';
import { button, el } from '../shared/dom.ts';
import { closeModal } from '../shared/modal.ts';
import { DISCUSSION_SELECTOR, ROOT_SELECTOR, getDiscussion, getList, own, readComment, themeOf } from './adapter.ts';
import type { CommentView } from './adapter.ts';
import { blockComment, dismissToast, openManager, toast } from './ui.ts';

if (location.origin === 'https://www.lemonde.fr' && window === window.top) start();
function start(): void {
  let snapshot: Snapshot | undefined;
  let decide: ReturnType<typeof compileRules> | undefined;
  let discussion: HTMLElement | null = null;
  let discussionKey = '';
  let temporary = false;
  let revealed = new WeakSet<HTMLElement>();
  const views = new Map<HTMLElement, CommentView>();
  const placeholders = new WeakMap<HTMLElement, HTMLElement>();
  const boundButtons = new WeakSet<HTMLButtonElement>();
  const summary = el('div', { class: 'blm-summary', 'data-blm-owned': '', hidden: '' });
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
      const account = [...record.addedNodes].some(node => node instanceof Element && !!node.querySelector('a[href^="https://compte.lemonde.fr"]'));
      if (important || structure || account) { schedule(); break; }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-active', 'data-comment-id', 'data-author-id', 'data-count', 'class', 'data-theme', 'data-color-scheme', 'aria-hidden'], characterData: true });
  function restore(root: HTMLElement): void {
    root.removeAttribute('data-blm-hidden-leaf');
    for (const part of root.querySelectorAll('.blm-hidden-part')) if (part.closest(ROOT_SELECTOR) === root) part.classList.remove('blm-hidden-part');
    placeholders.get(root)?.remove();
  }
  function cleanup(): void {
    for (const [root] of views) { restore(root); root.querySelectorAll('.blm-block-button').forEach(node => node.remove()); }
    views.clear(); summary.remove(); summary.replaceChildren(); delete summary.dataset.signature; temporary = false; revealed = new WeakSet(); closeModal();
  }
  async function render(): Promise<void> {
    if (!snapshot || !decide || processing) return;
    processing = true; observer.disconnect();
    const revisionAtStart = snapshot.state.revision;
    let rootsAtStart = 0;
    try {
      const next = getDiscussion(); const key = `${location.pathname}${location.search}`;
      if (next !== discussion || key !== discussionKey) { cleanup(); discussion = next; discussionKey = key; }
      addAccountShortcut();
      if (!discussion) return;
      const hostTheme = themeOf(discussion);
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
        const previousView = views.get(root);
        if (previousView && (previousView.author.name !== view.author.name || previousView.author.id !== view.author.id)) revealed.delete(root);
        views.set(root, view);
        const result = decide(view.author);
        const blocked = result.blocked && !temporary && !revealed.has(root);
        if (blocked) {
          hiddenIds.add(view.id ?? root); hiddenAuthors.add(identityKey(result.identity));
          if (!view.hasReplies && !view.hasDraft) root.setAttribute('data-blm-hidden-leaf', '');
          else {
            for (const part of view.parts) if (!part.querySelector('textarea')) part.classList.add('blm-hidden-part');
            let placeholder = placeholders.get(root);
            if (!placeholder) { placeholder = el('div', { class: 'blm-placeholder', 'data-blm-owned': '' }, el('span', {}, 'Commentaire masqué'), button('Afficher ce commentaire', () => { revealed.add(root); schedule(); }, '')); placeholders.set(root, placeholder); }
            applyThemeTokens(placeholder, hostTheme);
            root.prepend(placeholder);
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
    const theme = themeOf(discussion); const isDark = theme === 'dark';
    summary.style.setProperty('--blm-bg', isDark ? '#2c3441' : '#f5f6f8'); summary.style.setProperty('--blm-fg', isDark ? '#f0f2f5' : '#263244'); summary.style.setProperty('--blm-line', isDark ? '#596474' : '#d7dce2'); summary.style.setProperty('--blm-link', isDark ? '#9aceff' : '#075ba7');
    const showWelcome = snapshot.state.settings.enabled && snapshot.state.settings.communityEnabled && (!snapshot.state.hasSeenWelcome || snapshot.state.communityVersionSeen !== snapshot.community.version);
    const visible = count > 0 || temporary || showWelcome;
    summary.hidden = !visible;
    // Keep controls focused and stable when repeated site mutations leave the counts unchanged.
    const signature = `${count}:${authors}:${temporary}:${showWelcome}:${theme}:${snapshot.community.version}`;
    if (summary.dataset.signature !== signature) {
      summary.dataset.signature = signature; summary.replaceChildren();
      if (showWelcome) {
        const number = snapshot.community.entries.length;
        summary.append(el('p', {}, `${snapshot.state.hasSeenWelcome ? 'Liste communautaire mise à jour' : 'Liste communautaire active'} : ${number} ${number === 1 ? 'pseudonyme' : 'pseudonymes'} (version ${snapshot.community.version}).`), el('div', { class: 'blm-summary-actions' }, button('Consulter', () => openManager(client, summary.querySelector('button') ?? undefined, theme), ''), button('Désactiver la liste', () => { void client.send({ type: 'settings', patch: { communityEnabled: false } }).catch(error => toast(error.message, theme)); }, ''), button('Compris', () => { void client.send({ type: 'seen' }).catch(error => toast(error.message, theme)); }, '')));
      }
      if (count > 0) summary.append(el('p', {}, `${count} ${count === 1 ? 'commentaire masqué' : 'commentaires masqués'} de ${authors} ${authors === 1 ? 'auteur' : 'auteurs'} parmi les commentaires chargés.`));
      if (temporary) summary.append(el('p', {}, 'Affichage temporaire : vos préférences sont conservées.'));
      if (count > 0 || temporary) summary.append(el('div', { class: 'blm-summary-actions' }, button('Gérer les auteurs', () => openManager(client, summary.querySelector('button') ?? undefined, theme), ''), button(temporary ? 'Masquer à nouveau' : 'Afficher temporairement', () => { temporary = !temporary; if (!temporary) revealed = new WeakSet(); schedule(); }, '')));
    }
    if (visible) { const list = getList(discussion); if (list && !summary.isConnected) list.before(summary); }
  }
  function addAccountShortcut(): void {
    const existing = document.querySelector<HTMLElement>('.blm-account-link');
    if (existing) { applyThemeTokens(existing, themeOf(existing.parentElement ?? document.body)); return; }
    const link = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="https://compte.lemonde.fr"]')].find(node => node.closest('[data-component*="account"],.ds-account,.ds-header__account,.account') && !node.closest('[data-blm-ui]'));
    if (!link?.parentElement) return;
    const shortcut = button('Auteurs masqués — extension', () => { void client.send({ type: 'options' }).catch(error => toast(error.message, themeOf(document.body))); }, 'blm-account-link'); shortcut.setAttribute('data-blm-owned', ''); applyThemeTokens(shortcut, themeOf(link.parentElement)); link.parentElement.append(shortcut);
  }
  function applyThemeTokens(node: HTMLElement, theme: 'light' | 'dark'): void {
    const dark = theme === 'dark'; node.style.setProperty('--blm-fg', dark ? '#f0f2f5' : '#263244'); node.style.setProperty('--blm-bg', dark ? '#2c3441' : '#f5f6f8'); node.style.setProperty('--blm-link', dark ? '#9aceff' : '#075ba7');
  }
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
