import React, { useState, useCallback, useRef } from 'react';
import {
  IonPage, IonContent, IonModal, IonList, IonItem, IonLabel,
  IonButton, IonSpinner, useIonToast,
} from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import type { Assignment, CapturedPage } from '../../types';
import { processImage, detectRotation } from '../../services/image/processing';
import { buildPDF } from '../pdf/pdfBuilder';
import { useCaptureSession, useAssignments, useAuth } from '../../hooks';
import { db } from '../../services/storage/db';
import ProcessingOverlay from '../../components/ProcessingOverlay';

// ── Camera shim (real device uses @capacitor/camera) ─────────────────────────
async function capturePhoto(): Promise<{ base64: string; width: number; height: number }> {
  // Production:
  // const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  // const photo = await Camera.getPhoto({ quality: 90, resultType: CameraResultType.Base64, source: CameraSource.Camera });
  // return { base64: photo.base64String!, width: 1080, height: 1440 };
  return { base64: '', width: 1080, height: 1440 }; // stub
}

const CameraPage: React.FC = () => {
  const router              = useIonRouter();
  const [presentToast]      = useIonToast();
  const { user }            = useAuth();
  const { assignments }     = useAssignments(user?.id, user?.role);
  const [selAssignment, setSelAssignment] = useState<Assignment | null>(null);
  const [showPicker, setShowPicker]       = useState(false);
  const [capturing, setCapturing]         = useState(false);
  const [building, setBuilding]           = useState(false);
  const [buildStep, setBuildStep]         = useState('');
  const [buildPct, setBuildPct]           = useState(0);

  const { session, addPage, removePage, rotatePage, setPDF, reset, editCount } =
    useCaptureSession(selAssignment?.id ?? '');

  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'captured');

  // ── Capture ─────────────────────────────────────────────────────────────────
  const capture = useCallback(async () => {
    setCapturing(true);
    try {
      const raw      = await capturePhoto();
      const rotation = detectRotation(raw.width, raw.height);
      const src      = raw.base64 ? `data:image/jpeg;base64,${raw.base64}` : '';

      // If no real camera, create a mock page for dev purposes
      const pageId = crypto.randomUUID();
      if (!raw.base64) {
        addPage({ id: pageId, localUri: '', base64: undefined, width: 1080, height: 1440, rotation: 0, processed: false });
      } else {
        const processed = await processImage(src, { rotation, grayscale: true, contrastBoost: true });
        addPage({ id: pageId, localUri: `data:image/jpeg;base64,${processed.base64}`,
          base64: processed.base64, width: processed.width, height: processed.height, rotation: 0, processed: true });
      }
    } catch {
      presentToast({ message: 'Camera error – please try again.', duration: 2500, color: 'danger' });
    } finally { setCapturing(false); }
  }, [addPage, presentToast]);

  // ── Generate PDF & navigate to review ────────────────────────────────────────
  const generateAndReview = useCallback(async () => {
    if (!selAssignment) {
      presentToast({ message: 'Select an assignment first.', duration: 2000, color: 'warning' }); return;
    }
    if (!session.pages.length) {
      presentToast({ message: 'Capture at least one page.', duration: 2000, color: 'warning' }); return;
    }
    setBuilding(true);
    try {
      const steps = [
        { msg: 'Processing images…',      pct: 20 },
        { msg: 'Enhancing contrast…',     pct: 45 },
        { msg: 'Building PDF…',           pct: 70 },
        { msg: 'Preparing review…',       pct: 90 },
      ];
      for (const s of steps) {
        setBuildStep(s.msg); setBuildPct(s.pct);
        await new Promise(r => setTimeout(r, 400));
      }

      const result = await buildPDF(session.pages, {
        assignmentTitle: selAssignment.title,
        studentName:     selAssignment.studentName,
        includeMetadata: true,
      });

      setPDF(result.base64);

      // Persist session so ReviewPage can read it
      await db.saveSession({ ...session, pdfBase64: result.base64, status: 'ready' });

      setBuildPct(100);
      await new Promise(r => setTimeout(r, 200));
      router.push(`/app/camera/review/${session.id}`, 'forward');
    } catch (e) {
      presentToast({ message: 'PDF generation failed. Please try again.', duration: 3000, color: 'danger' });
    } finally { setBuilding(false); }
  }, [selAssignment, session, setPDF, router, presentToast]);

  return (
    <IonPage>
      {building && <ProcessingOverlay step={buildStep} progress={buildPct} />}

      <IonContent fullscreen>
        <div className="klp-pad">
          {/* Assignment selector */}
          <div onClick={() => setShowPicker(true)} style={{
            background: 'rgba(26,46,82,0.6)', border: '1px solid rgba(0,191,166,0.15)',
            borderRadius: 16, padding: '13px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 16, cursor: 'pointer',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--klp-slate)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Assignment
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                {selAssignment ? selAssignment.title : 'Tap to select…'}
              </div>
              {selAssignment && (
                <div style={{ fontSize: 12, color: 'var(--klp-slate)', marginTop: 2 }}>
                  {selAssignment.studentName} · {selAssignment.subject}
                </div>
              )}
            </div>
            <span style={{ fontSize: 18, color: selAssignment ? 'var(--klp-teal)' : 'var(--klp-slate)' }}>
              {selAssignment ? '✓' : '›'}
            </span>
          </div>

          {/* Viewfinder */}
          <div style={{
            position: 'relative', borderRadius: 22, overflow: 'hidden',
            background: '#000', aspectRatio: '3/4', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(0,191,166,0.15)', marginBottom: 20,
          }}>
            <div style={{ textAlign: 'center', color: 'var(--klp-slate)' }}>
              <div style={{ fontSize: 48, opacity: 0.3 }}>📷</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>
                {capturing ? 'Capturing…' : 'Position answer sheet in frame'}
              </div>
            </div>

            {/* Scanner frame corners */}
            {['tl','tr','bl','br'].map(c => (
              <div key={c} style={{
                position: 'absolute', width: 24, height: 24,
                ...(c.includes('t') ? { top: 20 } : { bottom: 20 }),
                ...(c.includes('l') ? { left: 20 } : { right: 20 }),
                borderColor: 'var(--klp-teal)', borderStyle: 'solid',
                borderWidth: c === 'tl' ? '3px 0 0 3px' : c === 'tr' ? '3px 3px 0 0'
                  : c === 'bl' ? '0 0 3px 3px' : '0 3px 3px 0',
                borderRadius: c === 'tl' ? '4px 0 0 0' : c === 'tr' ? '0 4px 0 0'
                  : c === 'bl' ? '0 0 0 4px' : '0 0 4px 0',
                animation: capturing ? 'cornerPulse 1.5s ease-in-out infinite' : 'none',
              }} />
            ))}

            {/* Scan line */}
            {capturing && (
              <div style={{
                position: 'absolute', left: 20, right: 20, height: 2,
                background: 'linear-gradient(to right, transparent, var(--klp-teal), transparent)',
                boxShadow: '0 0 8px var(--klp-teal)', animation: 'scanLine 2s linear infinite',
              }} />
            )}
          </div>

          {/* Shutter row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <CtrlBtn icon="⚡" title="Flash" />
              <CtrlBtn icon="🖼" title="Gallery" />
            </div>
            <button disabled={capturing} onClick={capture} style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'white', border: `4px solid rgba(255,255,255,0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)', cursor: 'pointer',
            }}>
              <div style={{
                width: 54, height: 54, borderRadius: '50%',
                background: session.pages.length ? 'var(--klp-teal)' : 'white',
                transition: 'background 0.2s',
              }} />
            </button>
            <div style={{ display: 'flex', gap: 12 }}>
              <CtrlBtn icon="↻" title="Rotate last" onClick={() => {
                const last = session.pages[session.pages.length - 1];
                if (last) rotatePage(last.id);
              }} />
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: 'rgba(26,46,82,0.6)', border: '1px solid rgba(0,191,166,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: 'var(--klp-teal)',
              }}>{session.pages.length}</div>
            </div>
          </div>

          {/* Pages strip */}
          {session.pages.length > 0 && (
            <>
              <div className="klp-section">Captured pages — {session.pages.length}</div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12 }}>
                {session.pages.map(p => <PageThumb key={p.id} page={p} onDelete={() => removePage(p.id)} onRotate={() => rotatePage(p.id)} />)}
                <AddPageBtn onClick={capture} />
              </div>
            </>
          )}

          {/* Action row */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {session.pages.length > 0 && (
              <IonButton fill="outline" color="medium" onClick={reset}>🗑 Clear</IonButton>
            )}
            <IonButton expand={session.pages.length === 0 ? 'block' : undefined}
              style={{ flex: 1, '--border-radius': '14px', fontWeight: 800 }}
              disabled={!session.pages.length || !selAssignment || building}
              onClick={generateAndReview}>
              {building ? <IonSpinner name="crescent" /> :
                session.pages.length
                  ? `Generate PDF & Review (${session.pages.length}p)`
                  : 'Capture pages to begin'}
            </IonButton>
          </div>

          {!session.pages.length && (
            <p style={{ fontSize: 12, color: 'var(--klp-slate)', textAlign: 'center', marginTop: 14, lineHeight: 1.7 }}>
              Tap the shutter to photograph a handwritten page.<br />
              Add multiple pages before generating the PDF.
            </p>
          )}
        </div>
      </IonContent>

      {/* Assignment picker sheet */}
      <IonModal isOpen={showPicker} onDidDismiss={() => setShowPicker(false)}
        initialBreakpoint={0.65} breakpoints={[0, 0.65, 0.92]}>
        <IonContent>
          <div style={{ width: 40, height: 4, background: 'rgba(136,151,168,0.4)', borderRadius: 2, margin: '12px auto 0' }} />
          <div style={{ fontSize: 17, fontWeight: 800, padding: '14px 18px 10px' }}>Select Assignment</div>
          <IonList style={{ background: 'transparent' }}>
            {pendingAssignments.map(a => (
              <IonItem key={a.id} button detail onClick={() => { setSelAssignment(a); setShowPicker(false); }}>
                <div slot="start" style={{ width: 8, height: 8, borderRadius: '50%', background: a.subjectColor ?? '#8897A8' }} />
                <IonLabel>
                  <h3 style={{ fontWeight: 700 }}>{a.title}</h3>
                  <p>{a.studentName} · {a.subject} · Due {a.dueDate}</p>
                </IonLabel>
              </IonItem>
            ))}
            {!pendingAssignments.length && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--klp-slate)' }}>
                <div style={{ fontSize: 36 }}>✅</div>
                <p style={{ marginTop: 10, fontWeight: 700 }}>All assignments submitted!</p>
              </div>
            )}
          </IonList>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const CtrlBtn: React.FC<{ icon: string; title: string; onClick?: () => void }> = ({ icon, title, onClick }) => (
  <button onClick={onClick} title={title} style={{
    width: 46, height: 46, borderRadius: '50%',
    background: 'rgba(26,46,82,0.6)', border: '1px solid rgba(0,191,166,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, cursor: 'pointer',
  }}>{icon}</button>
);

const PageThumb: React.FC<{ page: CapturedPage; onDelete: () => void; onRotate: () => void }> = ({ page, onDelete, onRotate }) => (
  <div style={{ position: 'relative', flexShrink: 0, width: 70, height: 90,
    borderRadius: 10, overflow: 'hidden', border: '2px solid rgba(0,191,166,0.15)',
    background: 'rgba(26,46,82,0.6)' }}>
    {page.localUri
      ? <img src={page.localUri} alt={`Page ${page.order + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📄</div>
    }
    <span style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,0.7)',
      borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>{page.order + 1}</span>
    <button onClick={onDelete} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18,
      background: 'var(--klp-rose)', borderRadius: '50%', border: 'none', cursor: 'pointer',
      fontSize: 10, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
    <button onClick={onRotate} style={{ position: 'absolute', top: 3, left: 3, width: 18, height: 18,
      background: 'rgba(0,0,0,0.6)', borderRadius: '50%', border: 'none', cursor: 'pointer',
      fontSize: 11, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↻</button>
  </div>
);

const AddPageBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} style={{ flexShrink: 0, width: 70, height: 90, borderRadius: 10,
    border: '2px dashed rgba(0,191,166,0.3)', background: 'rgba(0,191,166,0.04)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 4, color: 'var(--klp-teal)', cursor: 'pointer', fontSize: 22 }}>
    +<span style={{ fontSize: 9, fontWeight: 700 }}>Add</span>
  </button>
);

export default CameraPage;
