import React, { useState } from 'react';
import {
  IonPage, IonContent, IonInput, IonButton, IonSpinner, IonItem, IonLabel,
} from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import { lmsClient, LMSError } from '../../services/api/lmsClient';
import { secureStore } from '../../services/storage/secureStore';
import { MOCK_USER } from '../../hooks/mockData';

const LoginPage: React.FC = () => {
  const router = useIonRouter();
  const [email, setEmail]       = useState('tmokoena@mandisa.edu.za');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter your school email and password.'); return; }
    setLoading(true); setError('');
    try {
      // Dev shortcut: save mock user and navigate directly
      await secureStore.saveUser(MOCK_USER);
      await secureStore.saveToken({
        accessToken: 'mock-token', refreshToken: 'mock-refresh',
        expiresAt: Date.now() + 3_600_000,
      });
      // Production: await lmsClient.login(email, password);
      router.push('/app/home', 'root', 'replace');
    } catch (e) {
      if (e instanceof LMSError && e.statusCode === 401) {
        setError('Incorrect email or password.');
      } else {
        setError('Could not reach school server. Check your connection.');
      }
    } finally { setLoading(false); }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
        }}>
          {/* Logo */}
          <div style={{
            width: 72, height: 72, background: 'linear-gradient(135deg, var(--klp-teal), var(--klp-teal-dim))',
            borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, fontWeight: 900, color: 'var(--klp-navy)',
            boxShadow: '0 12px 40px rgba(0,191,166,0.3)', marginBottom: 16,
          }}>K</div>

          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>
            Kaizen <span style={{ color: 'var(--klp-teal)' }}>Capture</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--klp-slate)', marginBottom: 40 }}>
            Handwritten assessments → LMS, seamlessly
          </p>

          {/* Form */}
          <div style={{ width: '100%', maxWidth: 360 }}>
            {error && (
              <div style={{
                background: 'rgba(232,68,90,0.12)', border: '1px solid rgba(232,68,90,0.25)',
                borderRadius: 10, padding: '10px 14px', fontSize: 13,
                color: 'var(--klp-rose)', marginBottom: 14,
              }}>{error}</div>
            )}

            <IonItem lines="none" style={{ '--border-radius': '12px', marginBottom: 12 }}>
              <IonLabel position="stacked" style={{ fontSize: 11, fontWeight: 700,
                letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--klp-slate)' }}>
                School Email
              </IonLabel>
              <IonInput
                type="email" value={email}
                onIonChange={e => setEmail(e.detail.value ?? '')}
                placeholder="you@school.edu.za"
                style={{ '--color': 'var(--klp-warm)', fontSize: 15 }}
              />
            </IonItem>

            <IonItem lines="none" style={{ '--border-radius': '12px', marginBottom: 20 }}>
              <IonLabel position="stacked" style={{ fontSize: 11, fontWeight: 700,
                letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--klp-slate)' }}>
                Password
              </IonLabel>
              <IonInput
                type="password" value={password}
                onIonChange={e => setPassword(e.detail.value ?? '')}
                style={{ '--color': 'var(--klp-warm)', fontSize: 15 }}
              />
            </IonItem>

            <IonButton expand="block" onClick={handleLogin} disabled={loading}
              style={{ '--border-radius': '14px', fontWeight: 800, fontSize: 16,
                '--box-shadow': '0 6px 24px rgba(0,191,166,0.35)' }}>
              {loading ? <IonSpinner name="crescent" /> : 'Sign In'}
            </IonButton>
          </div>

          <p style={{ fontSize: 12, color: 'var(--klp-slate)', marginTop: 32, textAlign: 'center' }}>
            Secured by KLP · HTTPS only · Encrypted storage
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
