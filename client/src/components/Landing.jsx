import React, { useState } from 'react';

const EXAMPLES = [
  { name: 'Express.js',  url: 'https://github.com/expressjs/express',     desc: 'Node.js web framework' },
  { name: 'Axios',       url: 'https://github.com/axios/axios',            desc: 'HTTP client library' },
  { name: 'Lodash',      url: 'https://github.com/lodash/lodash',          desc: 'JS utility library' },
  { name: 'Chalk',       url: 'https://github.com/chalk/chalk',            desc: 'Terminal string styling' },
];

export default function Landing({ onAnalyze, loading, error }) {
  const [url, setUrl] = useState('');

  function submit() { if (url.trim()) onAnalyze(url.trim()); }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', overflow: 'auto', padding: 24,
      position: 'relative',
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🗺</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            CodeMapper
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>
            Paste a GitHub URL — get an interactive dependency graph,<br />
            AI file explanations, and semantic code search.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 24,
          boxShadow: 'var(--shadow)',
        }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            GitHub Repository URL
          </label>
          <input
            autoFocus
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="https://github.com/owner/repository"
            disabled={loading}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--text-primary)', outline: 'none', marginBottom: 12,
              fontFamily: 'JetBrains Mono, monospace',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />

          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: 12, borderRadius: 8, fontSize: 13,
              background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)',
              color: 'var(--danger)',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading || !url.trim()}
            style={{
              width: '100%', padding: '11px', borderRadius: 8, fontSize: 14,
              fontWeight: 600, border: 'none', cursor: loading ? 'wait' : url.trim() ? 'pointer' : 'not-allowed',
              background: url.trim() && !loading ? 'var(--accent)' : 'var(--border)',
              color: url.trim() && !loading ? '#fff' : 'var(--text-muted)',
              transition: 'background 0.15s',
            }}
          >
            {loading ? '⏳ Analyzing repository...' : '🔍 Analyze Repository'}
          </button>

          {/* Examples */}
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Try an example
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EXAMPLES.map(ex => (
                <button
                  key={ex.url}
                  onClick={() => { setUrl(ex.url); onAnalyze(ex.url); }}
                  disabled={loading}
                  style={{
                    padding: '8px 12px', borderRadius: 7, fontSize: 12, textAlign: 'left',
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text-primary)', cursor: 'pointer',
                    transition: 'border-color 0.12s, background 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-subtle)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{ex.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{ex.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          {['🕸 Dependency Graph', '🤖 AI Summaries', '🔍 Semantic Search', '🆓 100% Free'].map(f => (
            <span key={f} style={{
              padding: '5px 12px', borderRadius: 99, fontSize: 12,
              background: 'var(--panel)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
