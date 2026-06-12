import React, { useState } from 'react';
import {
  IonPage, IonContent, IonRefresher, IonRefresherContent,
  IonSearchbar, IonChip, IonLabel, IonSpinner,
} from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import type { Assignment, AssignmentStatus } from '../../types';
import { useAssignments, useAuth } from '../../hooks';
import StatusBadge from '../../components/StatusBadge';
import SyncBanner from '../../components/SyncBanner';

const FILTERS: { label: string; value: AssignmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Graded', value: 'graded' },
  { label: 'Failed', value: 'failed' },
];

const AssignmentListPage: React.FC = () => {
  const router = useIonRouter();
  const { user } = useAuth();
  const { assignments, loading, error, refetch } = useAssignments(user?.id, user?.role);
  const [filter, setFilter] = useState<AssignmentStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = assignments.filter(a => {
    const fOk = filter === 'all' || a.status === filter;
    const sOk = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.studentName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase());
    return fOk && sOk;
  });

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={async e => { await refetch(); (e.target as any).complete(); }}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="klp-pad">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px' }}>Assessments</h2>
            <span className="fs-12 text-slate">{filtered.length} shown</span>
          </div>

          <SyncBanner />

          <IonSearchbar
            value={search} onIonInput={e => setSearch(e.detail.value ?? '')}
            placeholder="Search by title, student, subject…"
            style={{ '--background': 'rgba(26,46,82,0.5)', '--border-radius': '12px',
              '--color': 'var(--klp-warm)', '--placeholder-color': 'var(--klp-slate)',
              padding: '0 0 12px' }}
          />

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }}>
            {FILTERS.map(f => (
              <IonChip key={f.value} color={filter === f.value ? 'primary' : 'medium'}
                outline={filter !== f.value} onClick={() => setFilter(f.value)}
                style={{ flexShrink: 0 }}>
                <IonLabel>
                  {f.label}
                  {f.value !== 'all' && ` ${assignments.filter(a => a.status === f.value).length}`}
                </IonLabel>
              </IonChip>
            ))}
          </div>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <IonSpinner name="crescent" color="primary" />
            </div>
          )}
          {error && <p style={{ color: 'var(--klp-rose)', fontSize: 13 }}>{error}</p>}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--klp-slate)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p style={{ fontWeight: 700, color: 'var(--klp-warm)', marginBottom: 6 }}>No assessments found</p>
              <p style={{ fontSize: 13 }}>
                {filter === 'all' ? 'Use the camera tab to capture your first assessment' : `No ${filter} assessments`}
              </p>
            </div>
          )}

          {filtered.map(a => (
            <AssignmentCard key={a.id} assignment={a}
              onClick={() => router.push(`/app/assessments/${a.id}`)} />
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

// ── AssignmentCard ────────────────────────────────────────────────────────────
interface CardProps { assignment: Assignment; onClick: () => void; }

export const AssignmentCard: React.FC<CardProps> = ({ assignment: a, onClick }) => {
  const ratio = a.grade != null ? a.grade / a.maxGrade : null;
  const gradeColor = ratio != null ? (ratio >= 0.65 ? 'var(--klp-teal)' : 'var(--klp-amber)') : undefined;

  return (
    <div onClick={onClick} style={{
      background: 'rgba(26,46,82,0.6)', border: '1px solid rgba(0,191,166,0.12)',
      borderRadius: 22, padding: 16, marginBottom: 12, cursor: 'pointer',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.subjectColor ?? '#8897A8', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--klp-slate)' }}>{a.subject}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--klp-warm)', marginBottom: 2 }}>{a.title}</div>
          {a.studentName && <div style={{ fontSize: 12, color: 'var(--klp-slate)' }}>👤 {a.studentName}</div>}
        </div>
        <StatusBadge status={a.status} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 10,
        borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 11, color: 'var(--klp-slate)' }}>📅 {a.dueDate}</span>
        {ratio != null && <span style={{ fontSize: 14, fontWeight: 800, color: gradeColor }}>{a.grade}/{a.maxGrade}</span>}
        {a.pageCount && <span style={{ fontSize: 11, color: 'var(--klp-slate)' }}>📄 {a.pageCount}p</span>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {a.status === 'pending' && <ActionChip label="📸 Capture" primary />}
        {(a.status === 'submitted' || a.status === 'graded') && <ActionChip label="👁 Review" primary />}
        {a.status === 'failed' && <ActionChip label="🔄 Retry" danger />}
        <ActionChip label="⋮ More" />
      </div>
    </div>
  );
};

const ActionChip: React.FC<{ label: string; primary?: boolean; danger?: boolean }> = ({ label, primary, danger }) => (
  <span style={{
    flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
    textAlign: 'center',
    background: primary ? 'rgba(0,191,166,0.12)' : danger ? 'rgba(232,68,90,0.12)' : 'rgba(255,255,255,0.04)',
    color: primary ? 'var(--klp-teal)' : danger ? 'var(--klp-rose)' : 'var(--klp-slate)',
    border: `1px solid ${primary ? 'rgba(0,191,166,0.22)' : danger ? 'rgba(232,68,90,0.2)' : 'rgba(255,255,255,0.06)'}`,
  }}>{label}</span>
);

export default AssignmentListPage;
