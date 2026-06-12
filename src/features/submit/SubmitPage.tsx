/**
 * SubmitPage.tsx
 *
 * Standalone final submission step (used when coming from AssignmentDetail
 * rather than the full camera flow). Reads a pre-built PDF from the session
 * cache and submits via lmsClient or syncQueue if offline.
 */
import React, { useState } from 'react';
import {
  IonPage, IonContent, IonButton, IonSpinner,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  useIonRouter, useIonToast,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { lmsClient } from '../../services/api/lmsClient';
import { syncQueue } from '../../services/sync/queue';
import { db } from '../../services/storage/db';

const SubmitPage: React.FC = () => {
  const { sessionId }  = useParams<{ sessionId: string }>();
  const router         = useIonRouter();
  const [presentToast] = useIonToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const session = await db.getSession(sessionId);
    if (!session) {
      presentToast({ message: 'Session not found.', duration: 2500, color: 'danger' });
      setSubmitting(false); return;
    }

    const payload = {
      assignmentId: session.assignmentId, studentId: session.studentId,
      pdfBase64: session.pdfBase64 ?? '', pdfSize: 0,
      pageCount: session.pages.length, capturedAt: new Date().toISOString(), sessionId,
    };

    try {
      if (navigator.onLine) {
        await lmsClient.submitAssignment(payload);
        presentToast({ message: '✅ Submitted successfully!', duration: 3000, color: 'success' });
      } else {
        syncQueue.enqueue(payload);
        presentToast({ message: '📶 Queued for sync', duration: 3000, color: 'warning' });
      }
      await db.deleteSession(sessionId);
      router.push('/app/assessments', 'back');
    } catch {
      syncQueue.enqueue(payload);
      presentToast({ message: 'Submission failed – queued for retry', duration: 3000, color: 'danger' });
    } finally { setSubmitting(false); }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton /></IonButtons>
          <IonTitle>Submit</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="klp-pad">
          <p className="fs-13" style={{ marginBottom: 24, color: 'var(--klp-slate)' }}>
            Ready to send this submission to the LMS?
          </p>
          <IonButton expand="block" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <IonSpinner name="crescent" /> : '🚀 Submit to LMS'}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SubmitPage;
