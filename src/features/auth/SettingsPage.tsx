import React, { useState } from 'react';
import {
  IonPage, IonContent, IonButton, useIonAlert,
} from '@ionic/react';
import { useAuth } from '../../hooks';
import { syncQueue } from '../../services/sync/queue';

const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
  <div onClick={onToggle} style={{
    width: 44, height: 26, borderRadius: 13,
    background: on ? 'var(--klp-teal)' : 'var(--klp-slate-dim)',
    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
  }}>
    <div style={{
      position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20,
      borderRadius: '50%', background: 'white', transition: 'left 0.2s',
    }} />
  </div>
);

const SettingItem: React.FC<{
  icon: string; iconBg: string; label: string; sub?: string;
  right?: React.ReactNode; onClick?: () => void;
}> = ({ icon, iconBg, label, sub, right, onClick }) => (
  <div onClick={onClick} style={{
    background: 'rgba(26,46,82,0.5)', borderBottom: '1px solid rgba(0,191,166,0.08)',
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: onClick ? 'pointer' : 'default',
  }}>
    <div style={{ width: 34, height: 34, borderRadius: 8, background: iconBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--klp-slate)', marginTop: 1 }}>{sub}</div>}
    </div>
    {right ?? <span style={{ color: 'var(--klp-slate)', fontSize: 14 }}>›</span>}
  </div>
);

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [presentAlert]   = useIonAlert();
  const [grayscale,    setGrayscale]    = useState(true);
  const [contrast,     setContrast]     = useState(true);
  const [offline,      setOffline]      = useState(true);
  const [aiGrading,    setAiGrading]    = useState(true);
  const [notifs,       setNotifs]       = useState(true);

  const confirmLogout = () => presentAlert({
    header: 'Sign Out', message: 'Are you sure you want to sign out?',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Sign Out', role: 'destructive', handler: logout },
    ],
  });

  const groupStyle: React.CSSProperties = {
    borderRadius: 16, overflow: 'hidden',
    border: '1px solid rgba(0,191,166,0.1)', marginBottom: 22,
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="klp-pad">
          {/* Profile card */}
          <div className="klp-card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--klp-teal-dim), var(--klp-navy-mid))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: 'var(--klp-teal)',
              border: '2px solid rgba(0,191,166,0.3)',
            }}>{user?.avatarInitials ?? '?'}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{user?.name ?? 'Guest'}</div>
              <div style={{ fontSize: 12, color: 'var(--klp-teal)', fontWeight: 600, marginTop: 2 }}>
                {user?.role === 'teacher' ? '🎓 Teacher' : '📚 Student'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--klp-slate)', marginTop: 1 }}>
                Mandisa Shiceka School · Tshwane
              </div>
            </div>
          </div>

          {/* Image processing */}
          <div className="klp-section">Image Processing</div>
          <div style={groupStyle}>
            <SettingItem icon="🖤" iconBg="rgba(0,191,166,0.12)" label="Grayscale conversion" sub="Optimises handwriting visibility"
              right={<Toggle on={grayscale} onToggle={() => setGrayscale(v => !v)} />} />
            <SettingItem icon="✨" iconBg="rgba(245,166,35,0.12)" label="Contrast boost" sub="Sharpens handwritten text"
              right={<Toggle on={contrast} onToggle={() => setContrast(v => !v)} />} />
          </div>

          {/* Submission */}
          <div className="klp-section">Submission</div>
          <div style={groupStyle}>
            <SettingItem icon="📶" iconBg="rgba(0,191,166,0.12)" label="Offline queue" sub="Auto-retry failed submissions"
              right={<Toggle on={offline} onToggle={() => setOffline(v => !v)} />} />
            <SettingItem icon="🤖" iconBg="rgba(0,191,166,0.12)" label="AI grade suggestions" sub="Gemini handwriting analysis"
              right={<Toggle on={aiGrading} onToggle={() => setAiGrading(v => !v)} />} />
            <SettingItem icon="🔔" iconBg="rgba(136,151,168,0.12)" label="Push notifications" sub="Submission & sync alerts"
              right={<Toggle on={notifs} onToggle={() => setNotifs(v => !v)} />} />
          </div>

          {/* Integration */}
          <div className="klp-section">Integration</div>
          <div style={groupStyle}>
            <SettingItem icon="🔗" iconBg="rgba(0,191,166,0.12)" label="LMS Endpoint"
              right={<span style={{ fontSize: 11, color: 'var(--klp-slate)' }}>lms.kaizenwizard.co.za</span>} />
            <SettingItem icon="📡" iconBg="rgba(0,191,166,0.12)" label="Connection status"
              right={<span style={{ fontSize: 12, color: 'var(--klp-teal)', fontWeight: 700 }}>✅ Connected</span>} />
            <SettingItem icon="ℹ️" iconBg="rgba(136,151,168,0.12)" label="App version"
              right={<span style={{ fontSize: 12, color: 'var(--klp-slate)' }}>v1.0.0-beta</span>} />
          </div>

          {/* Security */}
          <div className="klp-section">Security</div>
          <div style={groupStyle}>
            <SettingItem icon="🔒" iconBg="rgba(0,191,166,0.12)" label="HTTPS-only" sub="All traffic encrypted in transit" />
            <SettingItem icon="🔑" iconBg="rgba(0,191,166,0.12)" label="Secure credential storage" sub="Keychain / EncryptedSharedPreferences" />
            <SettingItem icon="🗑" iconBg="rgba(232,68,90,0.12)" label="Clear local cache" sub="Remove all offline data"
              onClick={() => { syncQueue.clearFailed(); localStorage.clear(); }} />
          </div>

          {/* Sign out */}
          <IonButton expand="block" fill="outline" color="danger" onClick={confirmLogout}
            style={{ '--border-radius': '14px', fontWeight: 700 }}>
            ⇦ Sign Out
          </IonButton>

          <p style={{ fontSize: 11, color: 'var(--klp-slate)', textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
            KLP Capture · Kaizen Wizard Solutions (Pty) Ltd<br />
            K2025630724 · Tshwane, Gauteng, South Africa
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
