import React from 'react';
import { getLangColor } from '../../utils/languageColors.js';

export default function StatsBar({ stats, repo }) {
  if (!stats) return null;

  const topLangs = Object.entries(stats.languages || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const mostImported = stats.mostImported?.[0]?.split('/').pop() || null;

  return (
    <div style={{
      height: 38, display: 'flex', alignItems: 'center', gap: 0,
      padding: '0 16px', flexShrink: 0, overflowX: 'auto',
      background: 'var(--panel2)', borderBottom: '1px solid var(--border)',
      fontSize: 12, color: 'var(--text-secondary)',
    }}>
      <Stat icon="📄" value={stats.totalFiles} label="files" />
      <Sep />
      <Stat icon="🔗" value={stats.totalEdges} label="dependencies" />
      <Sep />
      <Stat icon="📊" value={stats.avgDegree} label="avg connections" />
      {mostImported && (
        <>
          <Sep />
          <span style={{ whiteSpace: 'nowrap' }}>
            Most imported:{' '}
            <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
              {mostImported}
            </span>
          </span>
        </>
      )}
      {stats.orphanFiles?.length > 0 && (
        <>
          <Sep />
          <span style={{ color: 'var(--warning)', whiteSpace: 'nowrap' }}>
            ⚠ {stats.orphanFiles.length} isolated files
          </span>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Language badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {topLangs.map(([lang, count]) => {
          const { color, displayName } = getLangColor(lang);
          return (
            <span key={lang} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 99, fontSize: 11,
              background: color + '18', color, border: `1px solid ${color}33`,
              whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
              {displayName} · {count}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      <span>{icon}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{value}</span>
      <span>{label}</span>
    </span>
  );
}

function Sep() {
  return <span style={{ margin: '0 12px', color: 'var(--border)', userSelect: 'none' }}>·</span>;
}
