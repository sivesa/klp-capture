import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import { useAppStats, useAuth, useAssignments } from '../../hooks';
import SyncBanner from '../../components/SyncBanner';

const HomeTab: React.FC = () => {
  const router    = useIonRouter();
  const { user }  = useAuth();
  const stats     = useAppStats();
  const { assignments } = useAssignments(user?.id, user?.role);
  const maxCount  = Math.max(...stats.weeklySubmissions.map(w => w.count), 1);
  const today     = new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const firstName = user?.name.split(' ').find(p => !p.startsWith('Ms') && !p.startsWith('Mr')) ?? user?.name ?? '';

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="klp-pad">
          {/* Greeting */}
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 2 }}>
            👋 Morning, {firstName}.
          </h1>
          <p style={{ fontSize: 13, color: 'var(--klp-slate)', marginBottom: 24 }}>{today}</p>

          <SyncBanner />

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <StatCard val={`${stats.successRate}%`} label="Photo → PDF success rate"
              trend="↑ 3.2% this week" trendUp />
            <StatCard val={`${stats.editRate}%`} label="Edited after capture"
              trend="↓ 2.1% this week" accent="amber" />
            <StatCard val={String(stats.successfulSubmissions)} label="Submitted to LMS"
              trend="↑ 8 this week" trendUp />
            <StatCard val={String(stats.pendingSync)} label="Awaiting sync"
              trend="📶 Will retry" accent="rose" />
          </div>

          {/* Weekly bar chart */}
          <div className="klp-card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div className="klp-section" style={{ marginBottom: 2 }}>Submissions</div>
                <div style={{ fontSize: 12, color: 'var(--klp-slate)' }}>This week</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--klp-teal)' }}>
                {stats.totalCaptures}<span style={{ color: 'var(--klp-slate)', fontWeight: 800, fontSize: 12 }}> total</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70 }}>
              {stats.weeklySubmissions.map((w, i) => (
                <div key={w.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 2px 2px', minHeight: 4,
                    height: `${Math.round((w.count / maxCount) * 100)}%`,
                    background: i === 3
                      ? 'linear-gradient(to top, var(--klp-amber-dim), var(--klp-amber))'
                      : 'linear-gradient(to top, var(--klp-teal-dim), var(--klp-teal))',
                    boxShadow: i === 3 ? '0 0 8px rgba(245,166,35,0.4)' : undefined,
                  }} />
                  <span style={{ fontSize: 9, color: 'var(--klp-slate)', fontWeight: 600 }}>{w.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="klp-section">Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { icon: '📸', label: 'Capture', sub: 'New assessment', tab: 'camera' },
              { icon: '📋', label: 'Assessments', sub: `${assignments.filter(a => a.status === 'pending').length} pending`, tab: 'assessments' },
              { icon: '📊', label: 'Reports', sub: 'LMS analytics', tab: '' },
              { icon: '🔄', label: 'Retry Failed', sub: `${stats.pendingSync} queued`, tab: '' },
            ].map(a => (
              <button key={a.label} onClick={() => a.tab && router.push(`/app/${a.tab}`)} style={{
                background: 'rgba(26,46,82,0.6)', border: '1px solid rgba(0,191,166,0.12)',
                borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', gap: 6, cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--klp-warm)' }}>{a.label}</span>
                <span style={{ fontSize: 11, color: 'var(--klp-slate)' }}>{a.sub}</span>
              </button>
            ))}
          </div>

          {/* Recent activity */}
          <div className="klp-section">Recent Activity</div>
          {assignments.slice(0, 3).map(a => (
            <div key={a.id} className="klp-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--klp-slate)', marginTop: 3 }}>
                  {a.studentName} · {a.subject}
                </div>
              </div>
              <span className={`badge badge-${a.status}`}>
                {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

const StatCard: React.FC<{ val: string; label: string; trend: string; trendUp?: boolean; accent?: 'amber' | 'rose' }> =
  ({ val, label, trend, trendUp, accent }) => {
    const color = accent === 'amber' ? 'var(--klp-amber)' : accent === 'rose' ? 'var(--klp-rose)' : 'var(--klp-teal)';
    return (
      <div style={{ background: 'rgba(26,46,82,0.6)', border: '1px solid rgba(0,191,166,0.12)',
        borderRadius: 16, padding: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80,
          borderRadius: '50%', background: `${color}18` }} />
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color, lineHeight: 1, marginBottom: 4 }}>{val}</div>
        <div style={{ fontSize: 11, color: 'var(--klp-slate)', lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 10, fontWeight: 700, marginTop: 6,
          color: trendUp ? 'var(--klp-teal)' : accent === 'rose' ? 'var(--klp-slate)' : 'var(--klp-rose)' }}>{trend}</div>
      </div>
    );
  };

export default HomeTab;
