import type { Identity, Rule, Settings, Snapshot } from './model.ts';
export type Command =
  | { type: 'get' }
  | { type: 'rule'; identity: Identity; rule: Rule | null; expected?: Rule | null }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'seen' }
  | { type: 'import'; text: string; mode: 'merge' | 'replace'; revision: number }
  | { type: 'reset' }
  | { type: 'options' };
export type Request = { id: number; command: Command };
export type Response = { id?: number; ok: true; snapshot: Snapshot } | { id: number; ok: false; error: string };
