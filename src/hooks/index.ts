/**
 * hooks/index.ts – core React hooks for KLP Capture
 *
 * useAuth            – current user, login(), logout()
 * useAssignments     – filtered assignment list with refetch
 * useCaptureSession  – live capture session state (pages, rotate, reorder)
 * useAppStats        – Home-tab analytics
 * useOnlineStatus    – window online/offline events
 * useSyncQueue       – pending sync count + processQueue trigger
 */

import {
  useState, useEffect, useCallback, useRef,
} from 'react';
import type {
  User, Assignment, CaptureSession, CapturedPage, AppStats,
} from '../types';
import { secureStore }  from '../services/storage/secureStore';
import { lmsClient }    from '../services/api/lmsClient';
import { syncQueue }    from '../services/sync/queue';
import { MOCK_ASSIGNMENTS, MOCK_STATS } from './mockData';

// ── useAuth ───────────────────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    secureStore.getUser().then(u => { setUser(u); setLoading(false); });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { user: u } = await lmsClient.login(email, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await lmsClient.logout();
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}

// ── useAssignments ────────────────────────────────────────────────────────────
export function useAssignments(userId?: string, role?: 'teacher' | 'student') {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId || !role) return;
    setLoading(true); setError(null);
    try {
      // Swap comment below to hit real API:
      // const data = role === 'teacher'
      //   ? (await lmsClient.getTeacherAssignments()).items
      //   : await lmsClient.getStudentAssignments(userId);
      const data = MOCK_ASSIGNMENTS;
      setAssignments(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
    } finally { setLoading(false); }
  }, [userId, role]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = useCallback((id: string, status: Assignment['status']) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  return { assignments, loading, error, refetch: fetch, updateStatus };
}

// ── useCaptureSession ─────────────────────────────────────────────────────────
export function useCaptureSession(assignmentId: string) {
  const editCount = useRef(0);
  const [session, setSession] = useState<CaptureSession>({
    id:           crypto.randomUUID(),
    assignmentId,
    studentId:    '',
    pages:        [],
    createdAt:    Date.now(),
    status:       'capturing',
  });

  const addPage = useCallback((page: Omit<CapturedPage, 'order'>) => {
    setSession(prev => ({
      ...prev,
      pages: [...prev.pages, { ...page, order: prev.pages.length }],
    }));
  }, []);

  const removePage = useCallback((id: string) => {
    editCount.current++;
    setSession(prev => ({
      ...prev,
      pages: prev.pages.filter(p => p.id !== id).map((p, i) => ({ ...p, order: i })),
    }));
  }, []);

  const rotatePage = useCallback((id: string) => {
    editCount.current++;
    setSession(prev => ({
      ...prev,
      pages: prev.pages.map(p =>
        p.id === id
          ? { ...p, rotation: ((p.rotation + 90) % 360) as 0 | 90 | 180 | 270 }
          : p,
      ),
    }));
  }, []);

  const reorderPages = useCallback((fromIdx: number, toIdx: number) => {
    editCount.current++;
    setSession(prev => {
      const pages = [...prev.pages];
      const [moved] = pages.splice(fromIdx, 1);
      pages.splice(toIdx, 0, moved);
      return { ...prev, pages: pages.map((p, i) => ({ ...p, order: i })) };
    });
  }, []);

  const setPDF = useCallback((pdfBase64: string) => {
    setSession(prev => ({ ...prev, pdfBase64, status: 'ready' }));
  }, []);

  const reset = useCallback(() => {
    editCount.current = 0;
    setSession({ id: crypto.randomUUID(), assignmentId, studentId: '', pages: [], createdAt: Date.now(), status: 'capturing' });
  }, [assignmentId]);

  return { session, addPage, removePage, rotatePage, reorderPages, setPDF, reset, editCount };
}

// ── useAppStats ───────────────────────────────────────────────────────────────
export function useAppStats(): AppStats {
  const [stats, setStats] = useState<AppStats>({ ...MOCK_STATS, pendingSync: syncQueue.getCount() });

  useEffect(() => {
    const handler = () => setStats(s => ({ ...s, pendingSync: syncQueue.getCount() }));
    window.addEventListener('klp-sync', handler);
    return () => window.removeEventListener('klp-sync', handler);
  }, []);

  return stats;
}

// ── useOnlineStatus ───────────────────────────────────────────────────────────
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

// ── useSyncQueue ──────────────────────────────────────────────────────────────
export function useSyncQueue() {
  const [count, setCount] = useState(syncQueue.getCount());

  useEffect(() => {
    const handler = () => setCount(syncQueue.getCount());
    window.addEventListener('klp-sync', handler);
    return () => window.removeEventListener('klp-sync', handler);
  }, []);

  return {
    count,
    items:         syncQueue.getAll(),
    processQueue:  () => syncQueue.processQueue(),
    retryFailed:   () => syncQueue.retryFailed(),
    clearFailed:   () => syncQueue.clearFailed(),
  };
}
