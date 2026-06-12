import type { Assignment, AppStats } from '../types';

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asgn-001', title: 'The Great Trek Essay', subject: 'History',
    subjectColor: '#A78BFA', dueDate: '2026-06-20', status: 'pending',
    teacherId: 't-01', studentId: 's-01', studentName: 'Mandla Dube',
    maxGrade: 50, lmsId: 'lms-001',
  },
  {
    id: 'asgn-002', title: 'Quadratic Equations', subject: 'Mathematics',
    subjectColor: '#60A5FA', dueDate: '2026-06-18', status: 'submitted',
    teacherId: 't-01', studentId: 's-02', studentName: 'Lerato Mokoena',
    maxGrade: 100, lmsId: 'lms-002', grade: 78,
    submittedAt: '2026-06-10T09:30:00Z', pageCount: 3, pdfSize: '1.2 MB',
  },
  {
    id: 'asgn-003', title: 'Photosynthesis Lab Report', subject: 'Life Sciences',
    subjectColor: '#34D399', dueDate: '2026-06-25', status: 'graded',
    teacherId: 't-01', studentId: 's-03', studentName: 'Sipho Nkosi',
    maxGrade: 30, lmsId: 'lms-003', grade: 25,
    submittedAt: '2026-06-08T14:00:00Z', pageCount: 4, pdfSize: '2.1 MB',
    aiSuggestion: {
      suggestedGrade: 24, maxGrade: 30, confidence: 'high',
      contentAccuracy: 87,
      answerQuality: 'Learner demonstrates solid understanding of photosynthesis reactions with well-structured explanations. Lab observations are detailed and conclusions drawn logically from data.',
      strengths: ['Clear light/dark reaction distinction', 'Accurate ATP synthesis explanation', 'Neat data tables with correct units'],
      improvements: ['Chloroplast diagram needs labelling', 'Calvin cycle steps partially incomplete'],
      rawText: '(OCR transcript)', analyzedAt: '2026-06-08T14:10:00Z',
    },
  },
  {
    id: 'asgn-004', title: 'Afrikaans Opstel', subject: 'Afrikaans',
    subjectColor: '#F87171', dueDate: '2026-06-22', status: 'pending',
    teacherId: 't-01', studentId: 's-04', studentName: 'Zanele Khumalo',
    maxGrade: 40, lmsId: 'lms-004',
  },
  {
    id: 'asgn-005', title: 'Chemical Bonds', subject: 'Physical Sciences',
    subjectColor: '#FBBF24', dueDate: '2026-06-19', status: 'captured',
    teacherId: 't-01', studentId: 's-05', studentName: 'Thabo Sithole',
    maxGrade: 60, lmsId: 'lms-005', pageCount: 2,
  },
  {
    id: 'asgn-006', title: 'Democracy Essay', subject: 'Life Orientation',
    subjectColor: '#FB923C', dueDate: '2026-06-21', status: 'failed',
    teacherId: 't-01', studentId: 's-06', studentName: 'Nomsa Dlamini',
    maxGrade: 20, lmsId: 'lms-006',
  },
];

export const MOCK_USER = {
  id: 't-01', name: 'Ms. Thandi Mokoena', role: 'teacher' as const,
  email: 'tmokoena@mandisa.edu.za', schoolId: 'mss-001', avatarInitials: 'TM',
};

export const MOCK_STATS: AppStats = {
  totalCaptures: 47, successfulSubmissions: 43, editedAfterCapture: 12,
  pendingSync: 2, successRate: 91.5, editRate: 25.5,
  weeklySubmissions: [
    { day: 'Mon', count: 6 }, { day: 'Tue', count: 9 }, { day: 'Wed', count: 4 },
    { day: 'Thu', count: 11 }, { day: 'Fri', count: 8 }, { day: 'Sat', count: 3 },
    { day: 'Sun', count: 2 },
  ],
};
