import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyImport, compileRules, defaultState, exportData, identityKey, normalizeName, parseImport, setRule, validateCommunity, validateIdentity, validateState } from '../src/core/model.ts';
import type { Community, Rule, Snapshot } from '../src/core/model.ts';
const community = validateCommunity(JSON.parse(readFileSync(new URL('../data/community-list.json', import.meta.url), 'utf8')));
const snapshot = (): Snapshot => ({ state: defaultState(), community });
const rule = (name: string, decision: 'block' | 'allow' = 'block'): Rule => ({ identity: { kind: 'displayName', value: name }, label: name, decision });

test('la liste embarquée est valide et ne confond pas un pseudonyme proche', () => {
  const decide = compileRules(snapshot()); assert.equal(decide({ name: 'Peps72' }).blocked, true); assert.equal(decide({ name: 'Peps720' }).blocked, false); assert.equal(decide({ name: 'peps72' }).blocked, false);
});
test('une exception personnelle prime sur la communauté, y compris après réintroduction', () => {
  const s = snapshot(); s.state = setRule(s.state, rule('Peps72').identity, rule('Peps72', 'allow'));
  assert.equal(compileRules(s)({ name: 'Peps72' }).blocked, false);
  const empty: Community = { ...community, version: '2', entries: [] }; assert.equal(compileRules({ ...s, community: empty })({ name: 'Peps72' }).blocked, false);
  assert.equal(compileRules({ ...s, community: { ...community, version: '3' } })({ name: 'Peps72' }).blocked, false);
});
test('le choix personnel par identifiant est plus précis que celui par nom', () => {
  const s = snapshot(); const specific: Rule = { identity: { kind: 'authorId', value: 'public-id' }, label: 'Peps72', decision: 'allow' };
  s.state.personalRules = [rule('Peps72'), specific]; const decide = compileRules(s);
  assert.equal(decide({ name: 'Peps72', id: 'public-id' }).blocked, false); assert.equal(decide({ name: 'Peps72', id: 'other-id' }).blocked, true);
});
test('désactiver la communauté conserve les règles personnelles', () => {
  const s = snapshot(); s.state.settings.communityEnabled = false; s.state.personalRules = [rule('Auteur personnel')]; const decide = compileRules(s);
  assert.equal(decide({ name: 'Peps72' }).blocked, false); assert.equal(decide({ name: 'Auteur personnel' }).blocked, true);
  s.state.settings.enabled = false; assert.equal(compileRules(s)({ name: 'Auteur personnel' }).blocked, false);
});
test('Unicode NFC et espaces de bord, sans effacer casse et accents', () => {
  assert.equal(normalizeName('  E\u0301milie  '), 'Émilie'); assert.equal(validateIdentity({ kind: 'displayName', value: '  Émilie ' }).value, 'Émilie');
  assert.notEqual(identityKey({ kind: 'authorId', value: 'A' }), identityKey({ kind: 'displayName', value: 'A' }));
  assert.throws(() => validateIdentity({ kind: 'displayName', value: '\n' })); assert.throws(() => validateIdentity({ kind: 'displayName', value: 'a\u202eb' }));
});
test('export et réimport ne contiennent ni articles ni compteur et restaurent les choix', () => {
  const state = defaultState(); state.personalRules = [rule('Exemple', 'allow')]; const data = exportData(state);
  assert.deepEqual(Object.keys(data).sort(), ['personalRules', 'schemaVersion', 'settings']); assert.deepEqual(parseImport(JSON.stringify(data)), data);
});
test('les imports incorrects sont rejetés avant de toucher à l’état', () => {
  const state = defaultState(); const before = JSON.stringify(state);
  for (const text of ['[]', '{}', '{', JSON.stringify({ ...exportData(state), schemaVersion: 2 }), JSON.stringify({ ...exportData(state), personalRules: [rule('X'), rule('X')] }), ' '.repeat(1024 * 1024 + 1)]) assert.throws(() => parseImport(text));
  assert.equal(JSON.stringify(state), before);
  assert.throws(() => parseImport(JSON.stringify({ ...exportData(state), settings: { ...state.settings, theme: ['dark'] } })));
  assert.throws(() => parseImport(JSON.stringify({ ...exportData(state), personalRules: [{ ...rule('A'), label: 'Un autre auteur' }] })));
});
test('fusion conserve les réglages locaux et remplace seulement les identités explicites', () => {
  const state = defaultState(); state.settings.enabled = false; state.personalRules = [rule('A'), rule('B')];
  const data = { ...exportData(defaultState()), personalRules: [rule('A', 'allow'), rule('C')] };
  const merged = applyImport(state, data, 'merge'); assert.equal(merged.settings.enabled, false); assert.equal(merged.personalRules.length, 3); assert.equal(merged.personalRules.find(x => x.label === 'A')?.decision, 'allow');
  const replaced = applyImport(state, data, 'replace'); assert.equal(replaced.settings.enabled, true); assert.equal(replaced.personalRules.length, 2); assert.equal(state.personalRules.length, 2);
});
test('valeurs spéciales et prototype ne deviennent jamais des propriétés exécutables', () => {
  const state = defaultState(); const special = rule('__proto__'); const next = setRule(state, special.identity, special);
  assert.equal(compileRules({ state: next, community })({ name: '__proto__' }).blocked, true);
  assert.throws(() => parseImport('{"schemaVersion":1,"__proto__":{},"settings":{},"personalRules":[]}'));
});
test('une version de stockage inconnue ne peut pas être écrasée silencieusement', () => {
  assert.throws(() => validateState({ ...defaultState(), schemaVersion: 999 })); assert.throws(() => validateState({ ...defaultState(), revision: NaN })); assert.deepEqual(validateState(defaultState()), defaultState());
});
