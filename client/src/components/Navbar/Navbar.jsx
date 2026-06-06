import React, { useState } from 'react';
import SearchBar from '../SearchBar/SearchBar.jsx';

export default function Navbar({ repo, files, onSearch, onClearSearch, searching, searchResults, dark, onToggleTheme, onNewRepo }) {
  return (
    <header style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12, flexShrink: 0,
      background: 'var(--panel)', borderBottom: '1px solid var(--border)',
      zIndex: 100,
    }}>
      {/* Logo — clicking it goes back to landing */}
      <button
        onClick={onNewRepo}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
        title="Analyze a new repo"
      >
        <span style={{ fontSize: 22 }}>🗺</span>
        <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.3px' }}>
          CodeMapper
        </span>
      </button>

      {/* Repo pill */}
      {repo && (
        <>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <a
              href={repo.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}
              title={repo.name}
            >
              {repo.name}
            </a>
            {repo.stars > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                ⭐ {repo.stars.toLocaleString()}
              </span>
            )}
            {repo.language && (
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 99,
                background: 'var(--border)', color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}>
                {repo.language}
              </span>
            )}
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Search */}
      {repo && (
        <SearchBar
          files={files}
          onSearch={onSearch}
          onClearSearch={onClearSearch}
          searching={searching}
          results={searchResults}
        />
      )}

      {/* New repo button */}
      {repo && (
        <button
          onClick={onNewRepo}
          title="Analyze another repository"
          style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
            background: 'var(--panel2)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          + New Repo
        </button>
      )}

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--panel2)', cursor: 'pointer', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--panel2)'}
      >
        {dark ? '☀️' : '🌙'}
      </button>
    </header>
  );
}
