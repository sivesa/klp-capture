/**
 * queue.ts
 *
 * Offline-first submission queue.
 *
 * Persistence  → localStorage (survives app restart)
 * Retry policy → exponential back-off: 5s · 10s · 20s · 40s · 80s
 * Max attempts → 5 (then status = 'failed', requires manual retry)
 * Drain trigger→ window 'online' event + explicit processQueue() calls
 */

import { lmsClient } from '../api/lmsClient';
import type { SyncQueueItem, SubmissionPayload } from '../../types';

const QUEUE_KEY   = 'klp_sync_queue';
const MAX_ATTEMPTS = 5;
const BASE_DELAY   = 5_000; // ms

export type SyncEventType = 'sync-success' | 'sync-failed' | 'sync-queued';

class SyncQueue {
  private queue: SyncQueueItem[]                    = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running                                    = false;

  constructor() {
    this.load();
    window.addEventListener('online', () => this.processQueue());
  }

  // ── Persistence ───────────────────────────────────────────────────────────
  private load(): void {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      this.queue = raw ? (JSON.parse(raw) as SyncQueueItem[]) : [];
    } catch { this.queue = []; }
  }

  private save(): void {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
  }

  // ── Public API ────────────────────────────────────────────────────────────
  enqueue(payload: SubmissionPayload): SyncQueueItem {
    const item: SyncQueueItem = {
      id:          crypto.randomUUID(),
      type:        'submission',
      payload,
      attempts:    0,
      createdAt:   Date.now(),
      status:      'pending',
    };
    this.queue.push(item);
    this.save();
    this.emit('sync-queued', payload.assignmentId);
    if (navigator.onLine) this.processQueue();
    return item;
  }

  getAll():    SyncQueueItem[]  { return [...this.queue]; }
  getPending(): SyncQueueItem[] { return this.queue.filter(i => i.status !== 'failed'); }
  getCount():  number           { return this.getPending().length; }

  clearFailed(): void {
    this.queue = this.queue.filter(i => i.status !== 'failed');
    this.save();
  }

  async retryFailed(): Promise<void> {
    this.queue = this.queue.map(i =>
      i.status === 'failed' ? { ...i, status: 'pending', attempts: 0 } : i,
    );
    this.save();
    return this.processQueue();
  }

  // ── Processing ────────────────────────────────────────────────────────────
  async processQueue(): Promise<void> {
    if (this.running || !navigator.onLine) return;
    this.running = true;

    const workable = this.queue.filter(
      i => (i.status === 'pending' || i.status === 'retrying') && i.attempts < MAX_ATTEMPTS,
    );

    for (const item of workable) await this.processItem(item);

    this.running = false;

    const hasMore = this.queue.some(i => i.status === 'retrying' && i.attempts < MAX_ATTEMPTS);
    if (hasMore) this.scheduleRetry();
  }

  private async processItem(item: SyncQueueItem): Promise<void> {
    const idx = this.queue.findIndex(i => i.id === item.id);
    if (idx === -1) return;

    this.queue[idx] = { ...this.queue[idx], attempts: item.attempts + 1, lastAttempt: Date.now(), status: 'retrying' };
    this.save();

    try {
      await lmsClient.submitAssignment(item.payload);
      this.queue.splice(idx, 1);
      this.save();
      this.emit('sync-success', item.payload.assignmentId);
    } catch {
      if (this.queue[idx].attempts >= MAX_ATTEMPTS) {
        this.queue[idx].status = 'failed';
        this.emit('sync-failed', item.payload.assignmentId);
      }
      this.save();
    }
  }

  private scheduleRetry(): void {
    if (this.timer) clearTimeout(this.timer);
    const delay = BASE_DELAY * Math.pow(2, Math.min(this.getCount(), 4));
    this.timer = setTimeout(() => this.processQueue(), delay);
  }

  private emit(type: SyncEventType, assignmentId: string): void {
    window.dispatchEvent(new CustomEvent('klp-sync', { detail: { type, assignmentId } }));
  }
}

export const syncQueue = new SyncQueue();
