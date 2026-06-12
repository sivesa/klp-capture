/**
 * SyncQueue.ts (feature-level re-export)
 *
 * Re-exports the singleton syncQueue from services/sync/queue.ts so that
 * feature modules can import from a single consistent path:
 *   import { syncQueue } from '../submit/SyncQueue';
 */
export { syncQueue } from '../../services/sync/queue';
