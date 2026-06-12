import React from 'react';
import { IonButton } from '@ionic/react';
import { useSyncQueue } from '../hooks';

const SyncBanner: React.FC = () => {
  const { count, retryFailed } = useSyncQueue();
  if (count === 0) return null;
  return (
    <div style={{
      background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)',
      borderRadius: 'var(--klp-r-md)', padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 16px',
    }}>
      <span style={{ fontSize: 22 }}>☁️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--klp-amber)' }}>
          {count} submission{count > 1 ? 's' : ''} waiting to sync
        </div>
        <div style={{ fontSize: 11, color: 'var(--klp-slate)', marginTop: 2 }}>
          Will upload automatically when back online
        </div>
      </div>
      <IonButton size="small" fill="outline" color="secondary" onClick={retryFailed}>
        Retry
      </IonButton>
    </div>
  );
};

export default SyncBanner;
