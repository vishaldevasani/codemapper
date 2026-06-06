import React from 'react';
import { getLangColor } from '../../utils/languageColors.js';

export default function Toolbar({ stats, showLabels, onToggleLabels, showOrphans, onToggleOrphans, languageFilter, onFilterLanguage }) {
  if (!stats) return null;
  const languages = Object.keys(stats.languages || {}).sort();

  return (
    <div style={{
      height: 42, display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 14px', flexShrink: 0, overflowX: 'auto',
      background: 'var(--panel)', borderBottom: '1px solid var(--border)',
    }}>
      {/* Toggles */}
      <Toggle active={showLabels} onToggle={onToggleLabels} label="Labels" />
      <Toggle active={showOrphans} onToggle={onToggleOrphans} label="Orphans" />

      <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0, margin: '0 2px' }} />

      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>
        FILTER:
      </span>

      {languages.map(lang => {
        const { color, displayName } = getLangColor(lang);
        const active = languageFilter.size === 0 || languageFilter.has(lang);
        return (
          <button
            key={lang}
            onClick={() => onFilterLanguage(lang)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
              border: `1px solid ${active ? color + '55' : 'var(--border)'}`,
              background: active ? color + '18' : 'transparent',
              color: active ? color : 'var(--text-muted)',
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.12s',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? color : 'var(--text-muted)' }} />
            {displayName}
          </button>
        );
      })}

      {languageFilter.size > 0 && (
        <button
          onClick={() => { [...languageFilter].forEach(l => onFilterLanguage(l)); }}
          style={{
            fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none',
            cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap',
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}

function Toggle({ active, onToggle, label }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 7, background: 'none',
        border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: 6,
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontSize: 12, whiteSpace: 'nowrap',
        transition: 'color 0.12s',
      }}
    >
      {/* pill */}
      <div style={{
        width: 30, height: 17, borderRadius: 99, position: 'relative',
        background: active ? 'var(--accent)' : 'var(--border)',
        transition: 'background 0.15s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2.5, left: active ? 15 : 2.5,
          width: 12, height: 12, borderRadius: '50%', background: '#fff',
          transition: 'left 0.15s',
        }} />
      </div>
      {label}
    </button>
  );
}
