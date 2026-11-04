export type Identity = { kind: 'authorId' | 'displayName'; value: string };
export type Decision = 'allow' | 'block';
export type Rule = { identity: Identity; label: string; decision: Decision };
export type Entry = { identity: Identity; label: string };
export type Community = { schemaVersion: 1; version: string; entries: Entry[] };
export type Settings = { enabled: boolean; communityEnabled: boolean; theme: 'system' | 'light' | 'dark' };
export type State = { schemaVersion: 1; revision: number; settings: Settings; personalRules: Rule[]; communityVersionSeen: string | null; hasSeenWelcome: boolean };
export type Snapshot = { state: State; community: Community };
export type Author = { name: string; id?: string };
export type ExportData = { schemaVersion: 1; settings: Settings; personalRules: Rule[] };
export const MAX_RULES = 5000;
export const MAX_IMPORT_BYTES = 1024 * 1024;
export const KEY = 'blm.state.v1';

export function normalizeName(value: string): string { return value.normalize('NFC').trim(); }
export function validText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256 && !/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value);
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Le format doit contenir un objet JSON.');
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, expected: string[]): void {
  if (Object.keys(value).some(key => !expected.includes(key))) throw new Error('Le fichier contient des champs non reconnus.');
}
export function validateIdentity(value: unknown): Identity {
  const obj = object(value); keys(obj, ['kind', 'value']);
  if ((obj.kind !== 'authorId' && obj.kind !== 'displayName') || !validText(obj.value)) throw new Error('Identité d’auteur invalide (256 caractères maximum, sans caractères de contrôle).');
  const normalized = obj.kind === 'displayName' ? normalizeName(obj.value) : obj.value.trim();
  if (!normalized) throw new Error('Le pseudonyme ne peut pas être vide.');
  return { kind: obj.kind, value: normalized };
}
export function identityKey(identity: Identity): string { return JSON.stringify([identity.kind, identity.value]); }
export function validateRule(value: unknown): Rule {
  const obj = object(value); keys(obj, ['identity', 'label', 'decision']);
  if (!validText(obj.label) || !normalizeName(obj.label) || (obj.decision !== 'allow' && obj.decision !== 'block')) throw new Error('Règle de filtrage invalide.');
  const identity = validateIdentity(obj.identity); const label = normalizeName(obj.label);
  if (identity.kind === 'displayName' && label !== identity.value) throw new Error('Le libellé doit correspondre au pseudonyme exact.');
  return { identity, label, decision: obj.decision };
}
export function validateRules(value: unknown): Rule[] {
  if (!Array.isArray(value) || value.length > MAX_RULES) throw new Error(`La liste doit contenir au maximum ${MAX_RULES} règles.`);
  const rules = value.map(validateRule); const seen = new Set<string>();
  for (const rule of rules) { const key = identityKey(rule.identity); if (seen.has(key)) throw new Error('Le fichier contient plusieurs règles pour la même identité.'); seen.add(key); }
  return rules;
}
export function validateSettings(value: unknown): Settings {
  const obj = object(value); keys(obj, ['enabled', 'communityEnabled', 'theme']);
  if (typeof obj.enabled !== 'boolean' || typeof obj.communityEnabled !== 'boolean' || typeof obj.theme !== 'string' || !['system', 'light', 'dark'].includes(obj.theme)) throw new Error('Réglages invalides.');
  return { enabled: obj.enabled, communityEnabled: obj.communityEnabled, theme: obj.theme as Settings['theme'] };
}
export function defaultState(): State {
  return { schemaVersion: 1, revision: 0, settings: { enabled: true, communityEnabled: true, theme: 'system' }, personalRules: [], communityVersionSeen: null, hasSeenWelcome: false };
}
export function validateState(value: unknown): State {
  const obj = object(value); keys(obj, ['schemaVersion', 'revision', 'settings', 'personalRules', 'communityVersionSeen', 'hasSeenWelcome']);
  if (obj.schemaVersion !== 1) throw new Error('Version de données non prise en charge. Conservez vos données et mettez l’extension à jour.');
  if (!Number.isSafeInteger(obj.revision) || (obj.revision as number) < 0 || typeof obj.hasSeenWelcome !== 'boolean' || (obj.communityVersionSeen !== null && !validText(obj.communityVersionSeen))) throw new Error('Données locales invalides. Vous pouvez les réinitialiser depuis les options.');
  return { schemaVersion: 1, revision: obj.revision as number, settings: validateSettings(obj.settings), personalRules: validateRules(obj.personalRules), communityVersionSeen: obj.communityVersionSeen as string | null, hasSeenWelcome: obj.hasSeenWelcome };
}
export function validateCommunity(value: unknown): Community {
  const obj = object(value); keys(obj, ['schemaVersion', 'version', 'entries']);
  if (obj.schemaVersion !== 1 || !validText(obj.version) || !Array.isArray(obj.entries) || obj.entries.length > MAX_RULES) throw new Error('Liste communautaire invalide.');
  const entries = obj.entries.map(value => { const entry = object(value); keys(entry, ['identity', 'label']); if (!validText(entry.label) || !normalizeName(entry.label)) throw new Error('Libellé communautaire invalide.'); return { identity: validateIdentity(entry.identity), label: normalizeName(entry.label) }; });
  if (new Set(entries.map(entry => identityKey(entry.identity))).size !== entries.length) throw new Error('Identité en double dans la communauté.');
  return { schemaVersion: 1, version: obj.version, entries };
}
export function compileRules(snapshot: Snapshot): (author: Author) => { blocked: boolean; identity: Identity; source: 'personal' | 'community' | 'none' } {
  const personal = new Map(snapshot.state.personalRules.map(rule => [identityKey(rule.identity), rule]));
  const community = new Map(snapshot.community.entries.map(entry => [identityKey(entry.identity), entry]));
  return author => {
    const name: Identity = { kind: 'displayName', value: normalizeName(author.name) };
    const identities: Identity[] = author.id ? [{ kind: 'authorId', value: author.id }, name] : [name];
    const fallback = identities[0];
    if (!snapshot.state.settings.enabled) return { blocked: false, identity: fallback, source: 'none' };
    for (const identity of identities) { const rule = personal.get(identityKey(identity)); if (rule) return { blocked: rule.decision === 'block', identity, source: 'personal' }; }
    if (snapshot.state.settings.communityEnabled) for (const identity of identities) if (community.has(identityKey(identity))) return { blocked: true, identity, source: 'community' };
    return { blocked: false, identity: fallback, source: 'none' };
  };
}
export function setRule(state: State, identity: Identity, rule: Rule | null): State {
  const key = identityKey(identity); const rules = state.personalRules.filter(item => identityKey(item.identity) !== key);
  if (rule) rules.push(rule);
  if (rules.length > MAX_RULES) throw new Error('La limite de 5 000 règles est atteinte. Exportez vos choix avant de faire du tri.');
  return { ...state, personalRules: rules };
}
export function exportData(state: State): ExportData { return { schemaVersion: 1, settings: { ...state.settings }, personalRules: state.personalRules.map(rule => ({ ...rule, identity: { ...rule.identity } })) }; }
export function parseImport(text: string): ExportData {
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) throw new Error('Le fichier dépasse 1 Mio.');
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('Ce fichier n’est pas un document JSON valide.'); }
  const obj = object(parsed); keys(obj, ['schemaVersion', 'settings', 'personalRules']);
  if (obj.schemaVersion !== 1) throw new Error('Version du fichier non prise en charge.');
  return { schemaVersion: 1, settings: validateSettings(obj.settings), personalRules: validateRules(obj.personalRules) };
}
export function applyImport(state: State, data: ExportData, mode: 'merge' | 'replace'): State {
  if (mode === 'replace') return { ...state, settings: data.settings, personalRules: data.personalRules };
  const rules = new Map(state.personalRules.map(rule => [identityKey(rule.identity), rule]));
  for (const rule of data.personalRules) rules.set(identityKey(rule.identity), rule);
  if (rules.size > MAX_RULES) throw new Error('La fusion dépasse 5 000 règles.');
  return { ...state, personalRules: [...rules.values()] };
}
