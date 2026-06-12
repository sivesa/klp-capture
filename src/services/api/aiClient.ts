/**
 * aiClient.ts
 *
 * Routes all Gemini requests through the KLP Backend-For-Frontend (BFF).
 * The mobile app NEVER holds or transmits the Gemini API key.
 *
 * BFF endpoints (server-side):
 *   POST /api/ai/analyze             – single page analysis
 *   POST /api/ai/analyze-submission  – multi-page holistic analysis
 *
 * Gemini prompt template (constructed server-side):
 * ─────────────────────────────────────────────────
 *   You are an educational assessment assistant for South African Grade 8-12
 *   schools following the CAPS curriculum.
 *   Assignment: {title} ({subject})  Maximum marks: {maxGrade}
 *   {rubric if provided}
 *   Analyse the handwritten answer sheet. Respond ONLY in JSON:
 *   { suggestedGrade, maxGrade, confidence, contentAccuracy,
 *     answerQuality, strengths[], improvements[], rawText }
 */

import { secureStore } from '../storage/secureStore';
import type { AIGradeSuggestion } from '../../types';

const BFF_URL = process.env.REACT_APP_BFF_URL ?? 'https://bff.kaizenwizard.co.za/api/ai';

export interface AnalyzeRequest {
  imageBase64: string;
  mimeType:    'image/jpeg' | 'image/png';
  assignmentContext: {
    title:      string;
    subject:    string;
    maxGrade:   number;
    rubric?:    string;
  };
}

export interface MultiPageRequest {
  pages: Array<{ base64: string; pageNumber: number }>;
  context: AnalyzeRequest['assignmentContext'];
}

class AIClient {
  private async headers(): Promise<HeadersInit> {
    const token = await secureStore.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token.accessToken}` } : {}),
    };
  }

  /**
   * Analyse a single handwritten page.
   * Used on ReviewSubmissionPage for fast per-page feedback.
   */
  async analyzePage(req: AnalyzeRequest): Promise<AIGradeSuggestion> {
    const res = await fetch(`${BFF_URL}/analyze`, {
      method:  'POST',
      headers: await this.headers(),
      body:    JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'AI analysis failed' }));
      throw new Error(err.message);
    }
    return res.json() as Promise<AIGradeSuggestion>;
  }

  /**
   * Analyse all pages of a submission holistically.
   * BFF calls Gemini sequentially per page, then makes a final
   * consolidation call for an overall grade.
   */
  async analyzeSubmission(req: MultiPageRequest): Promise<AIGradeSuggestion> {
    const res = await fetch(`${BFF_URL}/analyze-submission`, {
      method:  'POST',
      headers: await this.headers(),
      body:    JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Submission analysis failed');
    return res.json() as Promise<AIGradeSuggestion>;
  }
}

export const aiClient = new AIClient();
