import rawCommunity from '../../data/community-list.json';
import { KEY, applyImport, defaultState, identityKey, parseImport, setRule, validateCommunity, validateIdentity, validateRule, validateSettings, validateState } from '../core/model.ts';
import type { State } from '../core/model.ts';
import type { Command, Request, Response } from '../core/protocol.ts';

const community = validateCommunity(rawCommunity);
const ports = new Set<chrome.runtime.Port>();
let queue: Promise<unknown> = Promise.resolve();
let state: State | undefined;
const access = chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
async function load(): Promise<State> {
  await access;
  if (!state) { const saved = (await chrome.storage.local.get(KEY))[KEY]; state = saved === undefined ? defaultState() : validateState(saved); }
  return state;
}
function respond(port: chrome.runtime.Port, response: Response): void { try { port.postMessage(response); } catch { ports.delete(port); } }
function validSender(sender: chrome.runtime.MessageSender | undefined): boolean {
  if (sender?.id !== chrome.runtime.id || !sender.url) return false;
  try { const url = new URL(sender.url); return url.origin === 'https://www.lemonde.fr' || (url.protocol === 'chrome-extension:' && url.hostname === chrome.runtime.id && url.pathname === '/options.html'); } catch { return false; }
}
function checkCommand(raw: unknown): Command {
  if (!raw || typeof raw !== 'object' || typeof (raw as { type?: unknown }).type !== 'string') throw new Error('Commande invalide.');
  const command = raw as Command;
  if (!['get', 'rule', 'settings', 'seen', 'import', 'reset', 'options'].includes(command.type)) throw new Error('Commande inconnue.');
  return command;
}
async function execute(raw: unknown): Promise<void> {
  const { port, request } = raw as { port: chrome.runtime.Port; request: Request };
  try {
    const command = checkCommand(request.command);
    if (command.type === 'reset') {
      await access; const stored = (await chrome.storage.local.get(KEY))[KEY] as { revision?: unknown } | undefined;
      const revision = typeof stored?.revision === 'number' && Number.isSafeInteger(stored.revision) ? stored.revision + 1 : 1;
      const next = { ...defaultState(), revision };
      await chrome.storage.local.set({ [KEY]: next }); state = next;
    } else {
      const current = await load(); let next = current;
      if (command.type === 'rule') {
        const identity = validateIdentity(command.identity); const rule = command.rule === null ? null : validateRule(command.rule);
        if (rule && identityKey(rule.identity) !== identityKey(identity)) throw new Error('Identités incohérentes.');
        if ('expected' in command) {
          const expected = command.expected === null ? null : validateRule(command.expected);
          const actual = current.personalRules.find(item => identityKey(item.identity) === identityKey(identity)) ?? null;
          if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('Ce choix a été modifié depuis. Consultez le gestionnaire avant de l’annuler.');
        }
        next = setRule(current, identity, rule);
      } else if (command.type === 'settings') {
        if (!command.patch || typeof command.patch !== 'object' || Object.keys(command.patch).length > 3) throw new Error('Réglage invalide.');
        next = { ...current, settings: validateSettings({ ...current.settings, ...command.patch }) };
      } else if (command.type === 'seen') {
        next = { ...current, hasSeenWelcome: true, communityVersionSeen: community.version };
      } else if (command.type === 'import') {
        if (typeof command.text !== 'string' || !['merge', 'replace'].includes(command.mode)) throw new Error('Import invalide.');
        if (command.revision !== current.revision) throw new Error('Vos choix ont changé depuis l’aperçu. Recommencez la prévisualisation.');
        next = applyImport(current, parseImport(command.text), command.mode);
      } else if (command.type === 'options') await chrome.runtime.openOptionsPage();
      if (next !== current) { next = { ...next, revision: current.revision + 1 }; await chrome.storage.local.set({ [KEY]: next }); state = next; }
    }
    const snapshot = { state: await load(), community };
    respond(port, { id: request.id, ok: true, snapshot });
    if (!['get', 'options'].includes(request.command.type)) for (const target of ports) if (target !== port) respond(target, { ok: true, snapshot });
  } catch (error) { respond(port, { id: request.id, ok: false, error: error instanceof Error ? error.message : 'L’enregistrement a échoué. Réessayez.' }); }
}
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'blm-v1' || !validSender(port.sender)) { port.disconnect(); return; }
  ports.add(port); port.onDisconnect.addListener(() => ports.delete(port));
  port.onMessage.addListener((request: Request) => {
    if (!request || !Number.isSafeInteger(request.id) || request.id < 0) return;
    queue = queue.then(() => execute({ port, request })).catch(() => undefined);
  });
});
chrome.action.onClicked.addListener(() => { void chrome.runtime.openOptionsPage(); });
