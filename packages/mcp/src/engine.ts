import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: NodeJS.Timeout };
class EngineBridge {
  private child?: ChildProcessWithoutNullStreams;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  private start() {
    const path = process.env.RINGSIDE_ENGINE_PATH;
    if (!path) throw new Error('ENGINE_UNAVAILABLE: set RINGSIDE_ENGINE_PATH to a built ringside-engine binary');
    if (this.child && !this.child.killed) return;
    this.child = spawn(path, ['serve'], { stdio: ['pipe', 'pipe', 'pipe'], env: process.env });
    this.child.stderr.on('data', (chunk: Buffer) => {
      const safe = chunk.toString('utf8').replace(/api-key=[^&\s]+/gi, 'api-key=[redacted]');
      process.stderr.write(`[ringside-engine] ${safe}`);
    });
    this.child.once('exit', () => {
      this.child = undefined;
      for (const [id, pending] of this.pending) { clearTimeout(pending.timer); pending.reject(new Error('ENGINE_UNAVAILABLE: sidecar stopped')); this.pending.delete(id); }
    });
    createInterface({ input: this.child.stdout }).on('line', (line) => {
      try {
        const message = JSON.parse(line) as { id: number; result?: unknown; error?: { message?: string } };
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(message.error.message || 'Engine call failed'));
        else pending.resolve(message.result);
      } catch { /* Malformed sidecar output cannot become an MCP response. */ }
    });
  }

  async call(method: string, params: Record<string, unknown> = {}) {
    if (method !== 'engine.health') throw new Error('ENGINE_UNAVAILABLE: Rust tool orchestration and spend policy are not implemented yet');
    this.start();
    const id = this.nextId++;
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('ENGINE_UNAVAILABLE: sidecar timed out')); }, 120_000);
      this.pending.set(id, { resolve, reject, timer });
      this.child!.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }
}
export const engine = new EngineBridge();

export async function engineHealth() {
  try { await engine.call('engine.health'); return { available: false, code: 'ENGINE_UNAVAILABLE', hint: 'Sidecar tool orchestration and policy integration pending' }; }
  catch { return { available: false, code: 'ENGINE_UNAVAILABLE', hint: 'Build engine/ and set RINGSIDE_ENGINE_PATH' }; }
}
