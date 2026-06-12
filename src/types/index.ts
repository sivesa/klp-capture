// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  email: string;
  schoolId: string;
  avatarInitials: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  subjectColor?: string;
  dueDate: string;
  status: AssignmentStatus;
  studentId?: string;
  studentName?: string;
  teacherId: string;
  grade?: number;
  maxGrade: number;
  lmsId: string;
  worksheetUrl?: string;
  submittedAt?: string;
  pdfUrl?: string;
  pageCount?: number;
  pdfSize?: string;
  aiSuggestion?: AIGradeSuggestion;
  plagiarismScore?: number;
}

export type AssignmentStatus =
  | 'pending'
  | 'captured'
  | 'queued'
  | 'submitted'
  | 'graded'
  | 'failed';

export interface CapturedPage {
  id: string;
  localUri: string;
  base64?: string;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  order: number;
  processed: boolean;
}

export interface CaptureSession {
  id: string;
  assignmentId: string;
  studentId: string;
  pages: CapturedPage[];
  createdAt: number;
  pdfLocalUri?: string;
  pdfBase64?: string;
  status: 'capturing' | 'processing' | 'ready' | 'submitted';
}

export interface AIGradeSuggestion {
  suggestedGrade: number;
  maxGrade: number;
  confidence: 'high' | 'medium' | 'low';
  contentAccuracy: number;
  answerQuality: string;
  strengths: string[];
  improvements: string[];
  rawText: string;
  analyzedAt: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'submission';
  payload: SubmissionPayload;
  attempts: number;
  lastAttempt?: number;
  createdAt: number;
  status: 'pending' | 'retrying' | 'failed';
}

export interface SubmissionPayload {
  assignmentId: string;
  studentId: string;
  pdfBase64: string;
  pdfSize: number;
  pageCount: number;
  capturedAt: string;
  sessionId: string;
  aiSuggestion?: {
    suggestedGrade: number;
    confidence: string;
    rawText: string;
  };
}

export interface SubmissionResult {
  submissionId: string;
  lmsStatus: 'accepted' | 'processing' | 'rejected';
  message: string;
  receivedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AppStats {
  totalCaptures: number;
  successfulSubmissions: number;
  editedAfterCapture: number;
  pendingSync: number;
  successRate: number;
  editRate: number;
  weeklySubmissions: WeeklySubmission[];
}

export interface WeeklySubmission {
  day: string;
  count: number;
}

export interface ProcessingOptions {
  rotation?: 0 | 90 | 180 | 270;
  targetWidth?: number;
  quality?: number;
  grayscale?: boolean;
  contrastBoost?: boolean;
}

export interface ProcessedImage {
  base64: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: 'image/jpeg';
}

export interface PDFBuildOptions {
  title?: string;
  studentName?: string;
  assignmentTitle?: string;
  includeMetadata?: boolean;
}

export interface PDFResult {
  base64: string;
  sizeBytes: number;
  pageCount: number;
  generatedAt: string;
}
