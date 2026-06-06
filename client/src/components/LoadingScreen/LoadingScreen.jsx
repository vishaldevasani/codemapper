import React, { useState, useEffect } from 'react';

const STEPS = [
  { icon: '🌐', text: 'Fetching repository tree…' },
  { icon: '📂', text: 'Reading file contents…' },
  { icon: '🔍', text: 'Parsing import dependencies…' },
  { icon: '🕸',  text: 'Building the graph…' },
  { icon: '✅', text: 'Almost ready…' },
];

export default function LoadingScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      {/* grid bg */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--text-primary) 1px,transparent 1px),linear-gradient(90deg,var(--text-primary) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ fontSize: 48, marginBottom: 8 }}>🗺</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 32px' }}>
          Analyzing Repository
        </h2>

        {/* Spinner */}
        <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 32px' }}>
          <div className="spin" style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
          }} />
          <div style={{
            position: 'absolute', inset: 6, borderRadius: '50%',
            background: 'var(--panel)',
          }} />
        </div>

        {/* Steps list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 280 }}>
          {STEPS.map((s, i) => (
            <div key={s.text} className={i <= step ? 'fade-in-up' : ''} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
              borderRadius: 8, opacity: i <= step ? 1 : 0,
              background: i === step ? 'var(--accent-subtle)' : 'transparent',
              border: `1px solid ${i === step ? 'var(--accent)' : 'transparent'}`,
              transition: 'background 0.3s',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>
                {i < step ? '✓' : i === step ? s.icon : '○'}
              </span>
              <span style={{
                fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
                color: i === step ? 'var(--accent)' : i < step ? 'var(--success)' : 'var(--text-muted)',
              }}>
                {s.text}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: 24, height: 3, width: 280, borderRadius: 99,
          background: 'var(--border)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
            width: `${((step + 1) / STEPS.length) * 100}%`,
            transition: 'width 0.6s ease',
          }} />
        </div>

        <p style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>
          Large repos may take 20–30 seconds
        </p>
      </div>
    </div>
  );
}
