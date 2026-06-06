import React, { useState, useRef, useEffect } from 'react';

export default function SearchBar({ files, onSearch, onClearSearch, searching, results }) {
  const [query, setQuery]         = useState('');
  const [showDrop, setShowDrop]   = useState(false);
  const containerRef              = useRef(null);

  useEffect(() => {
    if (results?.length > 0) setShowDrop(true);
  }, [results]);

  useEffect(() => {
    function outside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowDrop(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  function submit() {
    if (query.trim()) { onSearch(query, files); setShowDrop(true); }
  }

  function clear() { setQuery(''); setShowDrop(false); onClearSearch(); }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: 300 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
        borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)',
        transition: 'border-color 0.15s',
      }}
        onFocus={() => {}} // focus handled on input
      >
        <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') clear(); }}
          onFocus={e => { e.target.closest('div').style.borderColor = 'var(--accent)'; if (results?.length) setShowDrop(true); }}
          onBlur={e => e.target.closest('div').style.borderColor = 'var(--border)'}
          placeholder="Search codebase… e.g. where is auth?"
          disabled={searching}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: 12, color: 'var(--text-primary)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        />
        {searching && (
          <div className="spin" style={{
            width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
            border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
          }} />
        )}
        {query && !searching && (
          <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: 0, lineHeight: 1 }}>
            ✕
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {showDrop && results?.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          width: 380, borderRadius: 10, overflow: 'hidden', zIndex: 200,
          background: 'var(--panel)', border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderBottom: '1px solid var(--border)',
            background: 'var(--panel2)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {results.length} results for "{query}"
            </span>
            <button onClick={clear} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear ✕
            </button>
          </div>
          {results.map((r, i) => (
            <div key={r.path} style={{
              padding: '10px 12px',
              borderBottom: i < results.length - 1 ? '1px solid var(--border2)' : 'none',
              background: i === 0 ? 'var(--accent-subtle)' : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                  background: 'var(--accent)', color: '#fff',
                }}>
                  {r.relevance}/10
                </span>
                <span style={{
                  fontSize: 12, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {r.path}
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {r.reason}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
