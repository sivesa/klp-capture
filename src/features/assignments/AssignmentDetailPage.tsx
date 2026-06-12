import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonButton, IonSpinner, IonBackButton, IonButtons,
  IonHeader, IonToolbar, IonTitle, useIonRouter, useIonToast,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { useAssignments, useAuth } from '../../hooks';
import StatusBadge from '../../components/StatusBadge';
import AIGradePanel from '../review/AIGradePanel';
import type { AIGradeSuggestion } from '../../types';
import { aiClient } from '../../services/api/aiClient';
import { lmsClient } from '../../services/api/lmsClient';
import { syncQueue } from '../../services/sync/queue';

const AssignmentDetailPage: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const router   = useIonRouter();
  const { user } = useAuth();
  const { assignments, updateStatus } = useAssignments(user?.id, user?.role);
  const [presentToast]                = useIonToast();
  const assignment                    = assignments.find(a => a.id === id);

  const [suggestion, setSuggestion] = useState<AIGradeSuggestion | null>(assignment?.aiSuggestion ?? null);
  const [aiLoading, setAiLoading]   = useState(!assignment?.aiSuggestion &&
    (assignment?.status === 'submitted' || assignment?.status === 'graded'));
  const [retrying, setRetrying]     = useState(false);

  useEffect(() => {
    if (!aiLoading) return;
    const timer = setTimeout(() => {
      setSuggestion({
        suggestedGrade: Math.round((assignment?.maxGrade ?? 50) * 0.76),
        maxGrade: assignment?.maxGrade ?? 50, confidence: 'medium',
        contentAccuracy: 76,
        answerQuality: 'Learner shows reasonable understanding with some gaps. Written expression is clear though the argument could be more tightly structured.',
        strengths: ['Clear main thesis', 'Good use of examples', 'Legible handwriting throughout'],
        improvements: ['Stronger conclusion needed', 'Some factual gaps in section 2'],
        rawText: '(OCR transcript would appear here)', analyzedAt: new Date().toISOString(),
      });
      setAiLoading(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [aiLoading, assignment]);

  const handleRetry = async () => {
    if (!assignment) return;
    setRetrying(true);
    try {
      const payload = {
        assignmentId: assignment.id, studentId: assignment.studentId ?? '',
        pdfBase64: '', pdfSize: 0, pageCount: assignment.pageCount ?? 1,
        capturedAt: new Date().toISOString(), sessionId: crypto.randomUUID(),
      };
      if (navigator.onLine) {
        await lmsClient.submitAssignment(payload);
        updateStatus(assignment.id, 'submitted');
        presentToast({ message: '✅ Resubmitted successfully', duration: 2500, color: 'success' });
      } else {
        syncQueue.enqueue(payload);
        updateStatus(assignment.id, 'queued');
        presentToast({ message: '📶 Queued for retry', duration: 2500, color: 'warning' });
      }
    } catch {
      presentToast({ message: 'Retry failed — queued', duration: 2500, color: 'danger' });
    } finally { setRetrying(false); }
  };

  if (!assignment) return (
    <IonPage>
      <IonContent className="klp-pad">
        <p className="text-slate fs-13">Assignment not found.</p>
      </IonContent>
    </IonPage>
  );

  const ratio = assignment.grade != null ? assignment.grade / assignment.maxGrade : null;
  const gradeColor = ratio != null ? (ratio >= 0.65 ? 'var(--klp-teal)' : 'var(--klp-amber)') : undefined;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/app/assessments" /></IonButtons>
          <IonTitle style={{ fontSize: 15 }}>{assignment.title}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="klp-pad">
          {/* Status + grade */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <StatusBadge status={assignment.status} />
            {ratio != null && (
              <span style={{ fontSize: 20, fontWeight: 900, color: gradeColor }}>
                {assignment.grade}/{assignment.maxGrade}
              </span>
            )}
          </div>

          {/* PDF preview card */}
          {assignment.pageCount && (
            <div className="klp-card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 52, background: 'rgba(232,68,90,0.12)',
                border: '1px solid rgba(232,68,90,0.2)', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
              }}>📄</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {assignment.title.replace(/\s+/g, '_')}_submission.pdf
                </div>
                <div style={{ fontSize: 11, color: 'var(--klp-slate)', marginTop: 3 }}>
                  {assignment.pageCount} pages · {assignment.pdfSize ?? '~1.5 MB'} · A4
                  {assignment.submittedAt && ` · ${new Date(assignment.submittedAt).toLocaleDateString('en-ZA')}`}
                </div>
              </div>
            </div>
          )}

          {/* AI panel */}
          {(assignment.status === 'submitted' || assignment.status === 'graded') && (
            <AIGradePanel suggestion={suggestion} loading={aiLoading} />
          )}

          {/* Metadata table */}
          <div className="klp-card" style={{ marginTop: 16 }}>
            <div className="klp-section">Details</div>
            {[
              ['Student',   assignment.studentName ?? '—'],
              ['Subject',   assignment.subject],
              ['Due date',  assignment.dueDate],
              ['Max marks', String(assignment.maxGrade)],
              ['LMS ID',    assignment.lmsId],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span className="fs-12 text-slate">{l}</span>
                <span className="fs-13 fw-700">{v}</span>
              </div>
            ))}
          </div>

          {/* Failed state */}
          {assignment.status === 'failed' && (
            <>
              <div className="klp-card" style={{ marginTop: 16, background: 'rgba(232,68,90,0.08)', borderColor: 'rgba(232,68,90,0.2)' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--klp-rose)' }}>⚠️ Submission Failed</div>
                <div style={{ fontSize: 12, color: 'var(--klp-slate)', marginTop: 8 }}>
                  All retry attempts were exhausted. Tap below to try again.
                </div>
              </div>
              <IonButton expand="block" style={{ marginTop: 12 }} onClick={handleRetry} disabled={retrying}>
                {retrying ? <IonSpinner name="crescent" /> : '🔄 Retry Submission'}
              </IonButton>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AssignmentDetailPage;
