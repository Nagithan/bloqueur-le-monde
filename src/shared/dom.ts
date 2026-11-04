export function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: (Node | string | undefined | null)[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  for (const child of children) if (child !== undefined && child !== null) node.append(child);
  return node;
}
export function button(text: string, action: () => void, className = 'button'): HTMLButtonElement {
  const node = el('button', { type: 'button', class: className }, text); node.addEventListener('click', event => { if (userEvent(event)) action(); }); return node;
}
// On the host site, a script-generated click/change must not change private preferences.
export function userEvent(event: Event): boolean { return location.protocol === 'chrome-extension:' || event.isTrusted; }
export function activeElement(root: HTMLElement | ShadowRoot): Element | null {
  const tree = root instanceof ShadowRoot ? root : root.getRootNode();
  return tree instanceof ShadowRoot ? tree.activeElement : document.activeElement;
}
