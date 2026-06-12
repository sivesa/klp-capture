import React, { useEffect, useState } from 'react';
import {
  IonPage, IonContent, IonButton, IonSpinner,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  useIonRouter, useIonToast,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import type { AIGradeSuggestion } from '../../types';
import { db } from '../../services/storage/db';
import { lmsClient } from '../../services/api/lmsClient';
import { syncQueue } from '../../services/sync/queue';
import AIGradePanel from './AIGradePanel';

const ReviewSubmissionPage: React.FC = () => {
  const { sessionId }  = useParams<{ sessionId: string }>();
  const router         = useIonRouter();
  const [presentToast] = useIonToast();

  const [pageCount,    setPageCount]    = useState(0);
  const [assignTitle,  setAssignTitle]  = useState('Assessment');
  const [studentName,  setStudentName]  = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [studentId,    setStudentId]    = useState('');

  const [suggestion,  setSuggestion]  = useState<AIGradeSuggestion | null>(null);
  const [aiLoading,   setAiLoading]   = useState(true);
  const [submitting,  setSubmitting]  = useState(false);

  // Load session from SQLite cache
  useEffect(() => {
    db.getSession(sessionId).then(s => {
      if (s) {
        setPageCount(s.pages.length);
        setAssignmentId(s.assignmentId);
        setStudentId(s.studentId);
      }
    });
  }, [sessionId]);

  // Simulate Gemini analysis (replace with aiClient.analyzeSubmission() in prod)
  useEffect(() => {
    const t = setTimeout(() => {
      setSuggestion({
        suggestedGrade: 38, maxGrade: 50, confidence: 'high', contentAccuracy: 84,
        answerQuality: 'Learner demonstrates a strong grasp of the topic with well-structured written responses. Evidence is relevant and conclusions are drawn logically, though some supporting detail is missing in question 3.',
        strengths: ['Clear main argument across all sections', 'Good chronological structure', 'Relevant historical examples cited'],
        improvements: ['Question 3 conclusion needs more evidence', 'Spelling errors in paragraphs 2 and 4'],
        rawText: '(OCR transcript)', analyzedAt: new Date().toISOString(),
      });
      setAiLoading(false);
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        assignmentId, studentId,
        pdfBase64: '',   // loaded from session in production
        pdfSize: 0, pageCount,
        capturedAt: new Date().toISOString(),
        sessionId,
        ...(suggestion ? { aiSuggestion: { suggestedGrade: suggestion.suggestedGrade,
          confidence: suggestion.confidence, rawText: suggestion.rawText } } : {}),
      };

      if (navigator.onLine) {
        await lmsClient.submitAssignment(payload);
        presentToast({ message: '✅ Submitted to LMS successfully!', duration: 3000, color: 'success' });
      } else {
        syncQueue.enqueue(payload);
        presentToast({ message: '📶 Queued – will submit when online', duration: 3000, color: 'warning' });
      }

      await db.deleteSession(sessionId);
      router.push('/app/assessments', 'back');
    } catch {
      syncQueue.enqueue({ assignmentId, studentId, pdfBase64: '', pdfSize: 0, pageCount, capturedAt: new Date().toISOString(), sessionId });
      presentToast({ message: 'Failed – queued for retry', duration: 3000, color: 'danger' });
    } finally { setSubmitting(false); }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton /></IonButtons>
          <IonTitle>Review Submission</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="klp-pad">
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Review Before Submitting</h2>

          {/* PDF preview */}
          <div className="klp-card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 44, height: 52, background: 'rgba(232,68,90,0.12)',
              border: '1px solid rgba(232,68,90,0.2)', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Assessment_Submission.pdf</div>
              <div style={{ fontSize: 11, color: 'var(--klp-slate)', marginTop: 3 }}>
                {pageCount} page{pageCount !== 1 ? 's' : ''} · A4 · Generated just now
              </div>
            </div>
            <IonButton fill="outline" size="small" color="medium">Preview</IonButton>
          </div>

          {/* AI analysis */}
          <AIGradePanel suggestion={suggestion} loading={aiLoading} />

          {/* Submit actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <IonButton fill="outline" color="medium" onClick={() => router.goBack()} disabled={submitting}>
              ← Edit
            </IonButton>
            <IonButton expand="block" style={{ flex: 1, '--border-radius': '14px', fontWeight: 800,
              '--box-shadow': '0 4px 16px rgba(0,191,166,0.35)' }}
              onClick={handleSubmit} disabled={submitting}>
              {submitting ? <IonSpinner name="crescent" /> : '🚀 Submit to LMS'}
            </IonButton>
          </div>

          <p style={{ fontSize: 12, color: 'var(--klp-slate)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
            The AI suggestion is advisory only. You can override the final mark in the LMS after submission.
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReviewSubmissionPage;
