import type { Snapshot } from '../core/model.ts';
import type { Command, Response } from '../core/protocol.ts';
export class Client {
  snapshot?: Snapshot;
  private port?: chrome.runtime.Port;
  private serial = 0;
  private pending = new Map<number, { resolve(value: Snapshot): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> }>();
  private listeners = new Set<(snapshot: Snapshot) => void>();
  private connecting = false;
  private retry?: ReturnType<typeof setTimeout>;
  private stopped = false;
  constructor(private onError: (message: string) => void = () => {}) {
    addEventListener('focus', () => { if (!this.stopped) void this.send({ type: 'get' }).catch(() => undefined); });
    this.connect();
  }
  subscribe(listener: (snapshot: Snapshot) => void): () => void { this.listeners.add(listener); if (this.snapshot) listener(this.snapshot); return () => this.listeners.delete(listener); }
  private connect(): void {
    if (this.port || this.connecting || this.stopped) return;
    this.connecting = true;
    try {
      const port = chrome.runtime.connect({ name: 'blm-v1' }); this.port = port;
      port.onMessage.addListener((response: Response) => {
        if (!response.ok) {
          const pending = this.pending.get(response.id); if (pending) { clearTimeout(pending.timer); pending.reject(new Error(response.error)); this.pending.delete(response.id); } return;
        }
        if (!this.snapshot || response.snapshot.state.revision > this.snapshot.state.revision || (response.snapshot.state.revision === this.snapshot.state.revision && response.snapshot.community.version !== this.snapshot.community.version)) {
          this.snapshot = response.snapshot; for (const listener of this.listeners) listener(response.snapshot);
        }
        if (response.id !== undefined) { const pending = this.pending.get(response.id); if (pending) { clearTimeout(pending.timer); pending.resolve(response.snapshot); this.pending.delete(response.id); } }
      });
      port.onDisconnect.addListener(() => {
        void chrome.runtime.lastError;
        if (this.port === port) this.port = undefined;
        for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error('Connexion interrompue. Vos choix enregistrés sont conservés. Réessayez.')); }
        this.pending.clear();
        if (!this.stopped) this.retry = setTimeout(() => { this.connect(); void this.send({ type: 'get' }).catch(error => this.onError(error.message)); }, 1500);
      });
    } catch { this.onError('L’extension a été rechargée. Actualisez la page pour la reconnecter.'); }
    finally { this.connecting = false; }
  }
  send(command: Command): Promise<Snapshot> {
    this.connect(); const port = this.port;
    if (!port) return Promise.reject(new Error('L’extension est indisponible. Actualisez la page puis réessayez.'));
    const id = ++this.serial;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('L’enregistrement n’a pas été confirmé. Réessayez.')); }, 8000);
      this.pending.set(id, { resolve, reject, timer });
      try { port.postMessage({ id, command }); } catch { clearTimeout(timer); this.pending.delete(id); reject(new Error('Connexion indisponible. Actualisez la page.')); }
    });
  }
  close(): void { this.stopped = true; clearTimeout(this.retry); this.port?.disconnect(); }
}
