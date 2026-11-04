import { normalizeName, validText } from '../core/model.ts';
import type { Author } from '../core/model.ts';

export const ROOT_SELECTOR = '.ds-comments-container[data-comment-id],[data-component="comments-container"][data-comment-id],.ds-comment[data-comment-id],.comment';
export const DISCUSSION_SELECTOR = '[data-component="comments-popin"],.comments__container,.comments__river,[data-blm-test-discussion]';
export type CommentView = { root: HTMLElement; author: Author; id: string | null; report: HTMLElement | null; parts: HTMLElement[]; hasReplies: boolean; hasDraft: boolean };
export function own<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T[] {
  return [...root.querySelectorAll<T>(selector)].filter(node => node.closest(ROOT_SELECTOR) === root);
}
export function readComment(root: HTMLElement): CommentView | null {
  const name = own(root, '.ds-comment-signature__name,.comment__author')[0];
  const text = normalizeName(name?.textContent ?? '');
  if (!validText(text)) return null;
  const parts = own(root, '.ds-comment-signature,.ds-comment__content,.ds-comment-meta,.ds-comment__reply-info,.comment__header,.comment__content,.comment__footer');
  if (!parts.length) return null;
  // Never use comment IDs as author IDs. Only explicitly labelled author attributes qualify.
  const rawId = root.getAttribute('data-author-id') ?? name?.getAttribute('data-author-id');
  const author: Author = { name: text, ...(validText(rawId) ? { id: rawId } : {}) };
  const report = own(root, '.ds-comment-meta__link--report,.comment__report,[data-action="report"]')[0] ?? null;
  const collapse = own(root, '[data-element="collapse-button"],.ds-comment__collapse-button')[0];
  const hasReplies = !!root.querySelector('[data-element="replies-container"] [data-comment-id],.comment__children .comment') || Number(collapse?.getAttribute('data-count') ?? 0) > 0 || own(root, '.comment__answer').length > 0;
  const hasDraft = [...root.querySelectorAll<HTMLTextAreaElement>('textarea')].some(input => !!input.value || input === document.activeElement);
  return { root, author, id: root.getAttribute('data-comment-id'), report, parts, hasReplies, hasDraft };
}
export function getDiscussion(): HTMLElement | null {
  const popin = document.querySelector<HTMLElement>('[data-component="comments-popin"]');
  if (popin) return popin.getAttribute('data-active') === 'false' || popin.getAttribute('aria-hidden') === 'true' ? null : popin;
  return [...document.querySelectorAll<HTMLElement>(DISCUSSION_SELECTOR)].find(node => getComputedStyle(node).display !== 'none' && node.getAttribute('aria-hidden') !== 'true') ?? null;
}
export function getList(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>('[data-element="comments-list"],[data-element="comments-container"],[data-element="comments-main"],.ds-comments-main,.comments__river') ?? root.querySelector<HTMLElement>(ROOT_SELECTOR)?.parentElement ?? null;
}
export function themeOf(node: HTMLElement): 'light' | 'dark' {
  let current: HTMLElement | null = node;
  while (current) {
    const styles = getComputedStyle(current);
    const color = styles.backgroundColor.match(/[\d.]+/g)?.map(Number);
    if (color && color.length >= 3 && (color.length < 4 || color[3] > .8)) return (color[0] * .2126 + color[1] * .7152 + color[2] * .0722) < 125 ? 'dark' : 'light';
    current = current.parentElement;
  }
  // The host page, rather than the OS preference, is the authority here.
  return getComputedStyle(document.documentElement).colorScheme === 'dark' ? 'dark' : 'light';
}
