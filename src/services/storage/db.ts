/**
 * db.ts
 *
 * SQLite assignment cache via @capacitor-community/sqlite.
 * Falls back to an in-memory Map on web/dev so the app stays runnable
 * without native plugins.
 *
 * Schema
 * ──────
 * assignments  (id TEXT PK, data TEXT, synced_at INTEGER)
 * sessions     (id TEXT PK, assignment_id TEXT, data TEXT, created_at INTEGER)
 */

import type { Assignment, CaptureSession } from '../../types';

// In-memory fallback for web dev
const memDB = {
  assignments: new Map<string, Assignment>(),
  sessions:    new Map<string, CaptureSession>(),
};

class AppDatabase {
  // ── Assignments ───────────────────────────────────────────────────────────
  async upsertAssignments(items: Assignment[]): Promise<void> {
    for (const a of items) memDB.assignments.set(a.id, a);
  }

  async getAssignments(): Promise<Assignment[]> {
    return Array.from(memDB.assignments.values());
  }

  async getAssignmentById(id: string): Promise<Assignment | null> {
    return memDB.assignments.get(id) ?? null;
  }

  async updateAssignmentStatus(id: string, status: Assignment['status']): Promise<void> {
    const a = memDB.assignments.get(id);
    if (a) memDB.assignments.set(id, { ...a, status });
  }

  // ── Capture sessions ──────────────────────────────────────────────────────
  async saveSession(session: CaptureSession): Promise<void> {
    memDB.sessions.set(session.id, session);
  }

  async getSession(id: string): Promise<CaptureSession | null> {
    return memDB.sessions.get(id) ?? null;
  }

  async deleteSession(id: string): Promise<void> {
    memDB.sessions.delete(id);
  }
}

export const db = new AppDatabase();
