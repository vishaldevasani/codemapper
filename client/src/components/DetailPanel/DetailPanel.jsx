import React from 'react';
import { getLangColor } from '../../utils/languageColors.js';

function Skeleton({ lines = 3, short = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{
          height: 13,
          width: short ? (i === lines - 1 ? '50%' : '85%') : (i === lines - 1 ? '65%' : '100%'),
        }} />
      ))}
    </div>
  );
}

function Breadcrumb({ path }) {
  const parts = path.split('/');
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          <span style={{ color: i === parts.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{p}</span>
          {i < parts.length - 1 && <span style={{ color: 'var(--border)' }}>/</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function Chip({ label, color }) {
  const c = color || 'var(--accent)';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 5, fontSize: 11,
      background: c + '18', color: c, border: `1px solid ${c}33`,
      fontFamily: 'JetBrains Mono, monospace', margin: '0 4px 4px 0',
    }}>
      {label}
    </span>
  );
}

function ComplexityBadge({ level }) {
  const map = {
    low:    { color: 'var(--success)', label: '● Low complexity' },
    medium: { color: 'var(--warning)', label: '● Medium complexity' },
    high:   { color: 'var(--danger)',  label: '● High complexity' },
  };
  const m = map[level] || map.medium;
  return (
    <span style={{ fontSize: 11, color: m.color, fontWeight: 600 }}>{m.label}</span>
  );
}

function MetricPill({ icon, value, label, color }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 6px', borderRadius: 8,
      background: 'var(--panel2)', border: '1px solid var(--border)',
      gap: 3,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

export default function DetailPanel({ node, summary, loading, error, onClose, onRegenerate }) {
  if (!node) return null;
  const { color, displayName } = getLangColor(node.language);

  return (
    <div className="panel-enter" style={{
      width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: 'var(--panel)', borderLeft: '1px solid var(--border)', overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <Breadcrumb path={node.id} />
          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--panel2)', color: 'var(--text-secondary)', cursor: 'pointer',
              fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 99,
            background: color + '18', color, border: `1px solid ${color}33`,
          }}>
            {displayName}
          </span>
          {summary?.complexity && <ComplexityBadge level={summary.complexity} />}
        </div>
      </div>

      {/* ── Metrics row ── */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <MetricPill icon="↓" value={node.inDegree}    label="Imports"    color="#79c0ff" />
          <MetricPill icon="↑" value={node.outDegree}   label="Imported by" color="#56d364" />
          <MetricPill icon="≡" value={node.linesOfCode} label="Lines"      />
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {error && (
          <div style={{
            padding: '10px 12px', marginBottom: 14, borderRadius: 8, fontSize: 12,
            background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)',
            color: 'var(--danger)',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Summary */}
        <div style={{ marginBottom: 18 }}>
          <SectionHead>📝 Summary</SectionHead>
          {loading ? <Skeleton lines={4} /> : summary?.summary
            ? <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.65, margin: 0 }}>{summary.summary}</p>
            : <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Click <strong style={{ color: 'var(--accent)' }}>Generate Summary</strong> below, or double-click any graph node to get an AI explanation.
              </p>
          }
        </div>

        {/* Role */}
        {summary?.role && (
          <div style={{ marginBottom: 18 }}>
            <SectionHead>🎯 Role in Project</SectionHead>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
              {summary.role}
            </p>
          </div>
        )}

        {/* Key Functions */}
        {summary?.keyFunctions?.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionHead>⚡ Key Functions</SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {summary.keyFunctions.map((fn, i) => (
                <div key={i} style={{
                  padding: '8px 10px', borderRadius: 7,
                  background: 'var(--panel2)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4, fontWeight: 600 }}>
                    {fn.name}()
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {fn.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exports */}
        {summary?.exports?.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionHead>📤 Exports</SectionHead>
            <div>{summary.exports.map(e => <Chip key={e} label={e} />)}</div>
          </div>
        )}

        {/* External deps */}
        {((summary?.externalDeps || node.externalDeps || []).length > 0) && (
          <div style={{ marginBottom: 18 }}>
            <SectionHead>📦 External Packages</SectionHead>
            <div>{(summary?.externalDeps || node.externalDeps || []).map(d => <Chip key={d} label={d} color="#d29920" />)}</div>
          </div>
        )}

        {/* Placeholder when no summary yet */}
        {!summary && !loading && !error && (
          <div style={{
            padding: '16px', borderRadius: 8, textAlign: 'center',
            background: 'var(--panel2)', border: '1px dashed var(--border)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Generate an AI summary to see exports, key functions, and complexity analysis for this file.
            </div>
          </div>
        )}
      </div>

      {/* ── Footer button ── */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={onRegenerate}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: '1px solid var(--accent)',
            background: loading ? 'var(--border)' : 'var(--accent-subtle)',
            color: loading ? 'var(--text-muted)' : 'var(--accent)',
            cursor: loading ? 'wait' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-subtle)'; e.currentTarget.style.color = 'var(--accent)'; }}
        >
          {loading ? '⏳ Generating…' : summary ? '🔄 Regenerate Summary' : '✨ Generate AI Summary'}
        </button>
      </div>
    </div>
  );
}
