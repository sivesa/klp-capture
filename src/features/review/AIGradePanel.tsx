import React from 'react';
import { IonSpinner } from '@ionic/react';
import type { AIGradeSuggestion } from '../../types';

interface Props { suggestion: AIGradeSuggestion | null; loading: boolean; }

const confColor = (c: string) =>
  ({ high: 'var(--klp-teal)', medium: 'var(--klp-amber)', low: 'var(--klp-rose)' }[c] ?? 'var(--klp-slate)');

const AIGradePanel: React.FC<Props> = ({ suggestion, loading }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(0,191,166,0.07), rgba(15,27,53,0.8))',
    border: '1px solid rgba(0,191,166,0.2)', borderRadius: 22, padding: 18,
  }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 20 }}>🤖</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1,
          color: 'var(--klp-teal)', background: 'rgba(0,191,166,0.12)',
          padding: '2px 8px', borderRadius: 4, display: 'inline-block' }}>
          GEMINI ANALYSIS
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>AI Grade Suggestion</div>
      </div>
    </div>

    {loading ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--klp-slate)', fontSize: 13 }}>
        <IonSpinner name="dots" color="primary" />
        Analysing handwriting…
      </div>
    ) : suggestion ? (
      <>
        {/* Grade display */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 42, fontWeight: 900, color: 'var(--klp-teal)', letterSpacing: -2 }}>
            {suggestion.suggestedGrade}
          </span>
          <span style={{ fontSize: 18, color: 'var(--klp-slate)' }}>/ {suggestion.maxGrade}</span>
          <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 6, color: confColor(suggestion.confidence) }}>
            {suggestion.confidence.toUpperCase()} confidence
          </span>
        </div>

        {/* Accuracy bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--klp-slate)', marginBottom: 4 }}>
          <span>Content accuracy</span>
          <span style={{ color: 'var(--klp-teal)' }}>{suggestion.contentAccuracy}%</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: '100%', width: `${suggestion.contentAccuracy}%`,
            background: 'linear-gradient(to right, var(--klp-teal-dim), var(--klp-teal))', borderRadius: 3 }} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(0,191,166,0.1)', margin: '12px 0' }} />

        {/* Quality narrative */}
        <p style={{ fontSize: 13, color: 'var(--klp-warm)', lineHeight: 1.55, marginBottom: 14 }}>
          {suggestion.answerQuality}
        </p>

        {/* Strengths */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--klp-slate)', letterSpacing: '0.8px',
          textTransform: 'uppercase', marginBottom: 6 }}>Strengths</div>
        {suggestion.strengths.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12, color: 'var(--klp-warm)',
            lineHeight: 1.4, marginBottom: 5 }}>
            <span style={{ color: 'var(--klp-teal)', flexShrink: 0 }}>✓</span>{s}
          </div>
        ))}

        <div style={{ height: 1, background: 'rgba(0,191,166,0.1)', margin: '12px 0' }} />

        {/* Improvements */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--klp-slate)', letterSpacing: '0.8px',
          textTransform: 'uppercase', marginBottom: 6 }}>Areas to improve</div>
        {suggestion.improvements.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12, color: 'var(--klp-warm)',
            lineHeight: 1.4, marginBottom: 5 }}>
            <span style={{ color: 'var(--klp-amber)', flexShrink: 0 }}>△</span>{s}
          </div>
        ))}
      </>
    ) : (
      <p style={{ fontSize: 13, color: 'var(--klp-slate)' }}>AI analysis unavailable for this submission.</p>
    )}
  </div>
);

export default AIGradePanel;
