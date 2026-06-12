import React from 'react';

interface Props { step: string; progress: number; }

const ProcessingOverlay: React.FC<Props> = ({ step, progress }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(15,27,53,0.92)',
    backdropFilter: 'blur(12px)', zIndex: 500,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 20,
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      border: '3px solid rgba(0,191,166,0.2)', borderTopColor: 'var(--klp-teal)',
      animation: 'spin 0.8s linear infinite',
    }} />
    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--klp-warm)' }}>{step}</div>
    <div style={{ width: 200, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${progress}%`,
        background: 'linear-gradient(to right, var(--klp-teal-dim), var(--klp-teal))',
        borderRadius: 2, transition: 'width 0.4s ease',
      }} />
    </div>
    <div style={{ fontSize: 12, color: 'var(--klp-slate)' }}>{progress}%</div>
  </div>
);

export default ProcessingOverlay;
