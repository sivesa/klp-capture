/**
 * lmsClient.ts
 *
 * Typed REST client for the KLP LMS API.
 * Features:
 *   • HTTPS-only (enforced by BASE_URL configuration)
 *   • JWT Bearer token injected on every request
 *   • Transparent 401 → token refresh → retry (once)
 *   • 30-second request timeout via AbortController
 *
 * API Contract Reference
 * ─────────────────────
 * POST   /auth/login              → { user, token }
 * POST   /auth/logout             → 204
 * POST   /auth/refresh            → AuthToken
 * GET    /assignments/teacher     → PaginatedResponse<Assignment>
 * GET    /assignments/student/:id → Assignment[]
 * GET    /assignments/:id         → Assignment
 * POST   /students/validate       → User
 * POST   /submissions             → SubmissionResult
 * GET    /submissions/:id/status  → SubmissionResult
 */

import { secureStore } from '../storage/secureStore';
import type {
  ApiResponse,
  Assignment,
  AuthToken,
  PaginatedResponse,
  SubmissionPayload,
  SubmissionResult,
  User,
} from '../../types';

const BASE_URL   = process.env.REACT_APP_LMS_URL   ?? 'https://lms.kaizenwizard.co.za/api/v1';
const TIMEOUT_MS = 30_000;

export class LMSError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'LMSError';
  }
}

class LMSClient {
  private async headers(): Promise<HeadersInit> {
    const token = await secureStore.getToken();
    return {
      'Content-Type': 'application/json',
      Accept:         'application/json',
      ...(token ? { Authorization: `Bearer ${token.accessToken}` } : {}),
    };
  }

  private async request<T>(
    method: string,
    path:   string,
    body?:  unknown,
    retried = false,
  ): Promise<ApiResponse<T>> {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: await this.headers(),
        body:    body !== undefined ? JSON.stringify(body) : undefined,
        signal:  ctrl.signal,
      });

      // Transparent token refresh
      if (res.status === 401 && !retried) {
        await this.refresh();
        return this.request<T>(method, path, body, true);
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new LMSError(err.message, res.status);
      }

      const data: T = await res.json();
      return { data, status: res.status };
    } finally {
      clearTimeout(tid);
    }
  }

  private async refresh(): Promise<void> {
    const current = await secureStore.getToken();
    if (!current?.refreshToken) throw new LMSError('No refresh token', 401);

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken: current.refreshToken }),
    });
    if (!res.ok) {
      await secureStore.clearAuth();
      throw new LMSError('Session expired. Please sign in again.', 401);
    }
    const token: AuthToken = await res.json();
    await secureStore.saveToken(token);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<{ user: User; token: AuthToken }> {
    const { data } = await this.request<{ user: User; token: AuthToken }>(
      'POST', '/auth/login', { email, password },
    );
    await secureStore.saveToken(data.token);
    await secureStore.saveUser(data.user);
    return data;
  }

  async logout(): Promise<void> {
    await this.request('POST', '/auth/logout').catch(() => {});
    await secureStore.clearAuth();
  }

  // ── Assignments ───────────────────────────────────────────────────────────
  async getTeacherAssignments(page = 1, pageSize = 20): Promise<PaginatedResponse<Assignment>> {
    const { data } = await this.request<PaginatedResponse<Assignment>>(
      'GET', `/assignments/teacher?page=${page}&pageSize=${pageSize}`,
    );
    return data;
  }

  async getStudentAssignments(studentId: string): Promise<Assignment[]> {
    const { data } = await this.request<Assignment[]>('GET', `/assignments/student/${studentId}`);
    return data;
  }

  async getAssignmentById(id: string): Promise<Assignment> {
    const { data } = await this.request<Assignment>('GET', `/assignments/${id}`);
    return data;
  }

  async validateStudent(studentId: string, schoolId: string): Promise<User> {
    const { data } = await this.request<User>('POST', '/students/validate', { studentId, schoolId });
    return data;
  }

  // ── Submissions ───────────────────────────────────────────────────────────
  async submitAssignment(payload: SubmissionPayload): Promise<SubmissionResult> {
    const { data } = await this.request<SubmissionResult>('POST', '/submissions', payload);
    return data;
  }

  async getSubmissionStatus(submissionId: string): Promise<SubmissionResult> {
    const { data } = await this.request<SubmissionResult>('GET', `/submissions/${submissionId}/status`);
    return data;
  }
}

export const lmsClient = new LMSClient();
