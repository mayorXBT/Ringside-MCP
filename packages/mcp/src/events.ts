import { EventEmitter } from 'node:events';

export const eventBus = new EventEmitter();
eventBus.setMaxListeners(100);
export function emitEvent(kind: string, details: Record<string, unknown>) {
  eventBus.emit('event', { kind, details, ts: new Date().toISOString() });
}
