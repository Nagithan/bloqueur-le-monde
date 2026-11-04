import history from '../../data/community-history.json';
import { MAX_IMPORT_BYTES, applyImport, exportData, identityKey, normalizeName, parseImport, validateIdentity } from '../core/model.ts';
import type { Entry, Rule, Settings, Snapshot } from '../core/model.ts';
import type { Client } from './client.ts';
import { activeElement, button, el, userEvent } from './dom.ts';
import { confirmAction } from './modal.ts';

export class Manager {
  readonly element = el('div', { class: 'manager' });
  private snapshot?: Snapshot;
  private search = el('input', { class: 'input', type: 'search', placeholder: 'Rechercher un pseudonyme', 'aria-label': 'Rechercher un auteur' });
  private list = el('ul', { class: 'rule-list', 'aria-label': 'Auteurs et préférences' });
  private count = el('span');
  private status = el('div', { class: 'status', role: 'status', 'aria-live': 'polite' });
  private enabled = el('input', { type: 'checkbox' });
  private community = el('input', { type: 'checkbox' });
  private theme = el('select', { 'aria-label': 'Thème des réglages' }, ...[['system', 'Suivre le système'], ['light', 'Clair'], ['dark', 'Sombre']].map(([value, text]) => el('option', { value }, text)));
  private version = el('p', { class: 'hint' });
  private preview = el('div', { class: 'import-preview', hidden: '' });
  private shown = 100;
  private unsubscribe: () => void;
  constructor(private client: Client, inPage = false, private applyTheme: (theme: Settings['theme']) => void = () => {}) {
    const left = el('section', {}, el('div', { class: 'section-title' }, el('h2', {}, 'Vos auteurs'), this.count), el('label', { class: 'field search' }, el('span', { class: 'visually-hidden' }, 'Rechercher un auteur'), this.search));
    const name = el('input', { class: 'input', type: 'text', maxlength: '256', placeholder: 'Pseudonyme exact', required: '', autocomplete: 'off', 'aria-label': 'Pseudonyme à masquer' });
    const add = el('button', { type: 'submit', class: 'button primary' }, 'Masquer');
    const form = el('form', { class: 'add-form' }, el('label', { class: 'field' }, 'Ajouter un auteur', name), add, el('p', { class: 'hint' }, 'Correspondance exacte : casse et accents conservés. Les homonymes sont concernés.'));
    const addPreview = el('div', { class: 'import-preview', hidden: '' });
    const existing = (value: string) => this.snapshot?.state.personalRules.find(rule => rule.identity.kind === 'displayName' && rule.identity.value === value) ?? this.snapshot?.community.entries.find(entry => entry.identity.kind === 'displayName' && entry.identity.value === value);
    const showExisting = (value: string): boolean => {
      if (!existing(value)) return false;
      const decision = this.snapshot?.state.personalRules.find(rule => rule.identity.kind === 'displayName' && rule.identity.value === value)?.decision;
      this.status.classList.remove('error'); this.status.textContent = `« ${value} » figure déjà dans vos listes. Choix actuel : ${decision === 'allow' ? 'toujours afficher' : decision === 'block' ? 'toujours masquer' : 'suivre la communauté'}. Modifiez sa ligne pour changer ce choix.`;
      this.search.value = value; this.shown = 100; this.renderList(); addPreview.hidden = true;
      [...this.list.querySelectorAll<HTMLSelectElement>('select')].find(select => select.getAttribute('data-focus-key') === identityKey({ kind: 'displayName', value }))?.focus(); return true;
    };
    name.addEventListener('input', () => { addPreview.hidden = true; });
    form.addEventListener('submit', event => {
      event.preventDefault(); if (!userEvent(event)) return;
      try {
        const identity = validateIdentity({ kind: 'displayName', value: normalizeName(name.value) });
        if (showExisting(identity.value)) return;
        const confirm = button('Confirmer le masquage', () => {
          if (showExisting(identity.value)) return;
          void this.run(async () => { await client.send({ type: 'rule', identity, rule: { identity, label: identity.value, decision: 'block' } }); name.value = ''; addPreview.hidden = true; }, 'Auteur ajouté.');
        }, 'button primary');
        const cancel = button('Annuler', () => { addPreview.hidden = true; name.focus(); });
        addPreview.replaceChildren(el('h3', {}, 'Vérifier le pseudonyme'), el('p', { class: 'rule-name' }, identity.value), el('p', { class: 'hint' }, 'Tous les commentaires portant exactement ce pseudonyme seront masqués sur ce profil Chrome, homonymes compris.'), el('div', { class: 'tools' }, cancel, confirm));
        addPreview.hidden = false; cancel.focus();
      } catch (error) { this.showError(error instanceof Error ? error.message : 'Pseudonyme invalide.'); }
    });
    left.append(form, addPreview, this.list);
    this.search.addEventListener('input', () => { this.shown = 100; this.renderList(); });
    const toggle = (input: HTMLInputElement, title: string, description: string) => el('label', { class: 'toggle' }, input, el('span', {}, el('strong', {}, title), el('span', { class: 'hint' }, description)));
    const general = el('div', { class: 'manager-state' }, toggle(this.enabled, 'Activer le filtrage', 'Désactiver restaure les commentaires et conserve vos choix.'));
    const communitySection = el('section', { class: 'settings-section' }, el('h2', {}, 'Liste communautaire'), toggle(this.community, 'Utiliser la liste fournie', 'Active par défaut. « Toujours afficher » reste prioritaire.'), this.version, el('p', { class: 'hint' }, 'Une préférence de lecture, sans classement ni jugement sur les personnes.'));
    const details = el('details', { class: 'history' }, el('summary', {}, 'Voir les changements de la liste'));
    for (const release of history) details.append(el('p', {}, `${release.version} · ${release.date}`, el('br'), `Ajouts : ${release.added.join(', ') || 'aucun'}. Retraits : ${release.removed.join(', ') || 'aucun'}.`));
    communitySection.append(details);
    this.enabled.addEventListener('change', event => { if (userEvent(event)) void this.patch({ enabled: this.enabled.checked }); });
    this.community.addEventListener('change', event => { if (userEvent(event)) void this.patch({ communityEnabled: this.community.checked }); });
    const themeSection = el('section', { class: 'settings-section' }, el('h2', {}, 'Apparence'), el('label', { class: 'field' }, 'Thème des réglages', this.theme), el('p', { class: 'hint' }, 'Dans les commentaires, l’extension suit le thème du site.'));
    this.theme.addEventListener('change', event => { if (userEvent(event)) void this.patch({ theme: this.theme.value as Settings['theme'] }); });
    const input = el('input', { type: 'file', accept: '.json,application/json', hidden: '', 'aria-label': 'Importer les préférences' });
    input.addEventListener('change', event => { if (!userEvent(event)) return; const file = input.files?.[0]; if (file) void this.readFile(file); input.value = ''; });
    const tools = el('section', { class: 'settings-section' }, el('h2', {}, 'Sauvegarde'), el('p', { class: 'hint' }, 'Un fichier local pour vos choix personnels. Rien n’est envoyé.'), el('div', { class: 'tools' }, button('Exporter', () => this.export(), 'button small'), button('Importer', () => input.click(), 'button small')), input);
    const reset = button('Effacer mes données', () => { void this.reset(reset); }, 'text-button');
    const aside = el('aside', { 'aria-label': 'Réglages' }, communitySection, ...(inPage ? [] : [themeSection]), tools, reset);
    this.element.append(general, this.status, this.preview, el('div', { class: 'manager-grid' }, left, aside));
    this.unsubscribe = client.subscribe(snapshot => {
      this.snapshot = snapshot; this.enabled.checked = snapshot.state.settings.enabled; this.community.checked = snapshot.state.settings.communityEnabled; this.theme.value = snapshot.state.settings.theme;
      this.version.textContent = `Version ${snapshot.community.version} · ${snapshot.community.entries.length} ${snapshot.community.entries.length === 1 ? 'entrée' : 'entrées'}`;
      if (!inPage) this.applyTheme(snapshot.state.settings.theme);
      this.renderList();
    });
  }
  destroy(): void { this.unsubscribe(); this.element.remove(); }
  showError(message: string): void { this.status.textContent = message; this.status.classList.add('error'); }
  private async run(action: () => Promise<void>, message: string): Promise<void> {
    this.status.classList.remove('error'); this.status.textContent = 'Enregistrement…';
    try { await action(); this.status.textContent = message; } catch (error) { this.showError(error instanceof Error ? error.message : 'Cette action a échoué. Réessayez.'); if (this.snapshot) { this.enabled.checked = this.snapshot.state.settings.enabled; this.community.checked = this.snapshot.state.settings.communityEnabled; this.theme.value = this.snapshot.state.settings.theme; } }
  }
  private patch(patch: Partial<Settings>): Promise<void> { return this.run(async () => { await this.client.send({ type: 'settings', patch }); }, 'Réglages enregistrés sur cet appareil.'); }
  private renderList(): void {
    if (!this.snapshot) return;
    const focus = activeElement(this.element)?.getAttribute('data-focus-key');
    const entries = new Map<string, Entry & { community: boolean; personal?: Rule }>();
    for (const entry of this.snapshot.community.entries) entries.set(identityKey(entry.identity), { ...entry, community: true });
    for (const rule of this.snapshot.state.personalRules) { const key = identityKey(rule.identity); entries.set(key, { ...rule, community: entries.get(key)?.community ?? false, personal: rule }); }
    const query = this.search.value.normalize('NFC').toLocaleLowerCase('fr');
    const rows = [...entries.entries()].filter(([, entry]) => entry.label.toLocaleLowerCase('fr').includes(query)).sort(([, a], [, b]) => a.label.localeCompare(b.label, 'fr'));
    this.count.textContent = `${rows.length} ${rows.length === 1 ? 'auteur' : 'auteurs'}`;
    this.list.replaceChildren();
    for (const [key, entry] of rows.slice(0, this.shown)) {
      const select = el('select', { 'aria-label': `Choix pour ${entry.label}`, 'data-focus-key': key }, el('option', { value: 'default' }, entry.community ? 'Suivre la communauté' : 'Retirer mon choix'), el('option', { value: 'block' }, 'Toujours masquer'), el('option', { value: 'allow' }, 'Toujours afficher'));
      select.value = entry.personal?.decision ?? 'default';
      select.addEventListener('change', event => { if (!userEvent(event)) return; const decision = select.value; void this.run(async () => { await this.client.send({ type: 'rule', identity: entry.identity, rule: decision === 'default' ? null : { identity: entry.identity, label: entry.label, decision: decision as 'allow' | 'block' } }); }, 'Choix enregistré. Les commentaires sont mis à jour.'); });
      const source = entry.personal ? `Personnel${entry.community ? ' · aussi dans la communauté' : ''}` : `Communautaire${this.snapshot.state.settings.communityEnabled ? '' : ' · inactive'}`;
      const kind = entry.identity.kind === 'authorId' ? 'Identifiant d’auteur' : 'Pseudonyme exact';
      this.list.append(el('li', { class: 'rule-row' }, el('div', {}, el('p', { class: 'rule-name' }, entry.label), el('p', { class: 'hint' }, `${source} · ${kind}`)), select));
    }
    if (rows.length > this.shown) this.list.append(el('li', { class: 'empty' }, button(`Afficher les ${Math.min(100, rows.length - this.shown)} suivants`, () => { this.shown += 100; this.renderList(); })));
    if (!rows.length) this.list.append(el('li', { class: 'empty' }, query ? 'Aucun auteur ne correspond à cette recherche.' : 'Aucun auteur dans vos listes. Ajoutez un pseudonyme ou bloquez-le depuis un commentaire.'));
    if (focus) [...this.list.querySelectorAll<HTMLElement>('[data-focus-key]')].find(node => node.getAttribute('data-focus-key') === focus)?.focus({ preventScroll: true });
  }
  private export(): void {
    if (!this.snapshot) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData(this.snapshot.state), null, 2) + '\n'], { type: 'application/json' }));
    const link = el('a', { href: url, download: 'bloqueur-le-monde-preferences.json' }); link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.status.textContent = 'Export créé. Ce fichier contient vos préférences de lecture ; gardez-le privé si vous le souhaitez.';
  }
  private async readFile(file: File): Promise<void> {
    try {
      if (!this.snapshot) throw new Error('Attendez le chargement des préférences.');
      if (file.size > MAX_IMPORT_BYTES) throw new Error('Le fichier dépasse 1 Mio.');
      const text = await file.text(); const data = parseImport(text); const revision = this.snapshot.state.revision;
      const currentKeys = new Set(this.snapshot.state.personalRules.map(rule => identityKey(rule.identity)));
      const added = data.personalRules.filter(rule => !currentKeys.has(identityKey(rule.identity))).length;
      const merged = applyImport(this.snapshot.state, data, 'merge');
      this.preview.replaceChildren(el('h3', {}, 'Prévisualisation de l’import'), el('p', {}, `${data.personalRules.length} règles dans le fichier : ${added} nouvelles et ${data.personalRules.length - added} déjà présentes. La fusion conservera ${merged.personalRules.length} règles et vos réglages actuels.`), el('p', { class: 'hint' }, 'Remplacer rétablit exactement les choix et réglages du fichier. Rien n’est modifié avant votre confirmation.'));
      const apply = (mode: 'merge' | 'replace', opener: HTMLElement) => {
        void (async () => {
          if (mode === 'replace' && !await confirmAction('Remplacer vos préférences ?', 'Vos choix personnels et réglages seront remplacés par ceux du fichier. Pensez à exporter les préférences actuelles.', 'Remplacer', opener, this.currentTheme())) { this.status.classList.remove('error'); this.status.textContent = 'Import annulé. Aucune préférence modifiée.'; return; }
          await this.run(async () => { await this.client.send({ type: 'import', text, mode, revision }); this.preview.hidden = true; }, 'Import terminé.');
        })();
      };
      const merge = button('Fusionner', () => apply('merge', merge), 'button primary');
      const replace = button('Remplacer', () => apply('replace', replace));
      this.preview.append(el('div', { class: 'tools' }, merge, replace, button('Annuler', () => { this.preview.hidden = true; })));
      this.preview.hidden = false; merge.focus();
    } catch (error) { this.showError(error instanceof Error ? error.message : 'Impossible de lire le fichier.'); }
  }
  private currentTheme(): 'light' | 'dark' { const root = this.element.getRootNode(); return (root instanceof ShadowRoot ? root.host.getAttribute('data-theme') : document.body.getAttribute('data-theme')) === 'dark' ? 'dark' : 'light'; }
  private async reset(opener: HTMLElement): Promise<void> {
    if (!await confirmAction('Effacer vos données ?', 'Vos choix personnels seront effacés et les réglages par défaut rétablis. La liste communautaire sera de nouveau active.', 'Effacer et réinitialiser', opener, this.currentTheme())) return;
    await this.run(async () => { await this.client.send({ type: 'reset' }); this.preview.hidden = true; }, 'Vos choix ont été effacés et les réglages réinitialisés.');
  }
}
