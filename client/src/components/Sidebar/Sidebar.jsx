import React, { useState, useMemo, useRef, useCallback, memo } from 'react';
import { getLangColor } from '../../utils/languageColors.js';

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function buildTree(files) {
  const root = {};
  for (const file of files) {
    const parts = file.path.split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = { __children: {} };
      node = node[parts[i]].__children;
    }
    node[parts[parts.length - 1]] = { __file: file };
  }
  return root;
}

function countLeaves(children) {
  let n = 0;
  for (const k of Object.keys(children)) {
    if (children[k].__file) n++;
    else n += countLeaves(children[k].__children || {});
  }
  return n;
}

function sortedKeys(obj) {
  return Object.keys(obj).sort((a, b) => {
    const af = !!obj[a].__file, bf = !!obj[b].__file;
    if (!af && bf) return -1;
    if (af && !bf) return 1;
    return a.localeCompare(b);
  });
}

// ─── FileRow ─────────────────────────────────────────────────────────────────
// memo so it only re-renders when its own props change
const FileRow = memo(function FileRow({ file, isActive, onSelect }) {
  const { color } = getLangColor(file.language);
  return (
    <button
      onClick={onSelect}
      title={file.path}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        width: '100%', textAlign: 'left',
        padding: '4px 8px', borderRadius: 5, border: 'none',
        background: isActive ? 'var(--accent-subtle)' : 'transparent',
        cursor: 'pointer',
        outline: isActive ? '1px solid var(--accent)' : '1px solid transparent',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--panel2)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'var(--accent-subtle)' : 'transparent'; }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: color }} />
      <span style={{
        flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        color: isActive ? 'var(--accent)' : 'var(--text-primary)',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {file.path.split('/').pop()}
      </span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
        {formatSize(file.size)}
      </span>
    </button>
  );
});

// ─── TreeNode ─────────────────────────────────────────────────────────────────
// Key insight: open state lives ONLY in openRef (a plain object), never in
// component state. We use a single top-level forceUpdate to trigger repaints
// when a folder is toggled. This means clicking a file (which only changes
// selectedPath prop) never causes folders to reset.
const TreeNode = memo(function TreeNode({ name, node, depth, nodePath, selectedPath, onSelect, openRef, onToggle }) {
  if (node.__file) {
    const isActive = selectedPath === node.__file.path;
    return (
      <div style={{ paddingLeft: depth * 14 }}>
        <FileRow
          file={node.__file}
          isActive={isActive}
          onSelect={() => onSelect(node.__file)}
        />
      </div>
    );
  }

  // Folder
  const children = node.__children || {};
  const keys = sortedKeys(children);
  const count = countLeaves(children);

  // Read open state from the stable ref — default open for top 2 levels
  const isOpen = openRef.current[nodePath] !== undefined
    ? openRef.current[nodePath]
    : depth < 2;

  function handleToggle(e) {
    e.stopPropagation();
    openRef.current[nodePath] = !isOpen;
    onToggle(); // trigger single top-level forceUpdate
  }

  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <button
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          width: '100%', textAlign: 'left',
          padding: '4px 8px', borderRadius: 5, border: 'none',
          background: 'transparent', cursor: 'pointer', userSelect: 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--panel2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{
          fontSize: 9, color: 'var(--text-secondary)', display: 'inline-block', width: 10,
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s',
        }}>▶</span>
        <span style={{ fontSize: 13 }}>{isOpen ? '📂' : '📁'}</span>
        <span style={{
          flex: 1, fontSize: 12, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </span>
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 99,
          background: 'var(--border)', color: 'var(--text-secondary)', flexShrink: 0,
        }}>{count}</span>
      </button>

      {isOpen && keys.map(k => (
        <TreeNode
          key={k}
          name={k}
          node={children[k]}
          depth={depth + 1}
          nodePath={nodePath + '/' + k}
          selectedPath={selectedPath}
          onSelect={onSelect}
          openRef={openRef}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
});

// ─── Table view ───────────────────────────────────────────────────────────────
const TABLE_COLS = [
  { key: 'name',        label: 'File',     width: '40%' },
  { key: 'language',    label: 'Lang',     width: '13%' },
  { key: 'linesOfCode', label: 'Lines',    width: '13%' },
  { key: 'inDegree',    label: '↓ Impo',   width: '17%' },
  { key: 'outDegree',   label: '↑ Used',   width: '17%' },
];

const TableView = memo(function TableView({ files, selectedPath, onSelect }) {
  const [sortKey, setSortKey] = useState('linesOfCode');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    return [...files].sort((a, b) => {
      const av = sortKey === 'name' ? a.path.split('/').pop() : (a[sortKey] ?? 0);
      const bv = sortKey === 'name' ? b.path.split('/').pop() : (b[sortKey] ?? 0);
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [files, sortKey, sortDir]);

  function toggleSort(k) {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        background: 'var(--panel2)', flexShrink: 0,
      }}>
        {TABLE_COLS.map(col => (
          <button key={col.key} onClick={() => toggleSort(col.key)} style={{
            width: col.width, padding: '6px 8px', fontSize: 11, fontWeight: 600,
            textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer',
            color: sortKey === col.key ? 'var(--accent)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
          }}>
            {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
        ))}
      </div>
      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.map(file => {
          const { color } = getLangColor(file.language);
          const active = selectedPath === file.path;
          return (
            <button key={file.path} onClick={() => onSelect(file)} title={file.path} style={{
              display: 'flex', alignItems: 'center', width: '100%',
              padding: '5px 0', border: 'none', textAlign: 'left',
              background: active ? 'var(--accent-subtle)' : 'transparent',
              cursor: 'pointer', borderBottom: '1px solid var(--border2)',
              outline: active ? '1px solid var(--accent)' : 'none',
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--panel2)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'var(--accent-subtle)' : 'transparent'; }}
            >
              <span style={{ width: '40%', padding: '0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: active ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace' }}>
                  {file.path.split('/').pop()}
                </span>
              </span>
              <span style={{ width: '13%', padding: '0 4px' }}>
                <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 99, background: color + '22', color, border: `1px solid ${color}44` }}>
                  {file.language}
                </span>
              </span>
              <span style={{ width: '13%', padding: '0 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{file.linesOfCode ?? '—'}</span>
              <span style={{ width: '17%', padding: '0 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{file.inDegree ?? '—'}</span>
              <span style={{ width: '17%', padding: '0 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{file.outDegree ?? '—'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar({ files, selectedNode, onFileSelect, graphNodes }) {
  const [filter, setFilter]       = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView]           = useState('tree');

  // tick is only used to force a re-render when a folder is toggled
  const [tick, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  // openRef: plain object holding folder open/closed state — never reset
  const openRef = useRef({});

  // Stable select handler — never recreated
  const handleSelect = useCallback((file) => {
    onFileSelect(file);
  }, [onFileSelect]);

  const filteredFiles = useMemo(() => {
    if (!filter.trim()) return files;
    const q = filter.toLowerCase();
    return files.filter(f => f.path.toLowerCase().includes(q));
  }, [files, filter]);

  // Enrich files with graph degree data
  const enriched = useMemo(() => {
    if (!graphNodes?.length) return filteredFiles;
    const byId = new Map(graphNodes.map(n => [n.id, n]));
    return filteredFiles.map(f => {
      const n = byId.get(f.path);
      return n ? { ...f, inDegree: n.inDegree, outDegree: n.outDegree } : f;
    });
  }, [filteredFiles, graphNodes]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);
  const rootKeys = useMemo(() => sortedKeys(tree), [tree]);

  const selectedPath = selectedNode?.id ?? null;

  if (collapsed) {
    return (
      <div style={{
        width: 38, flexShrink: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: 10,
        background: 'var(--panel)', borderRight: '1px solid var(--border)',
      }}>
        <button onClick={() => setCollapsed(false)} title="Expand sidebar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
          📁
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: 'var(--panel)', borderRight: '1px solid var(--border)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px 0', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Files <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({files.length})</span>
        </span>
        <button onClick={() => setCollapsed(true)} title="Collapse"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, padding: 2 }}>
          ◀
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', padding: '8px 12px 0',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        {[{ id: 'tree', label: '🌲 Tree' }, { id: 'table', label: '📊 Table' }].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{
            padding: '5px 12px', fontSize: 12, fontWeight: 500, border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: view === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: view === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div style={{ padding: '8px 10px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '4px 8px',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter files..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 12, color: 'var(--text-primary)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
          {filter && (
            <button onClick={() => setFilter('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: 0 }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {view === 'tree' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '2px 4px 8px' }}>
          {rootKeys.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 12px' }}>
              No files match "{filter}"
            </p>
          )}
          {rootKeys.map(k => (
            <TreeNode
              key={k}
              name={k}
              node={tree[k]}
              depth={0}
              nodePath={k}
              selectedPath={selectedPath}
              onSelect={handleSelect}
              openRef={openRef}
              onToggle={forceUpdate}
            />
          ))}
        </div>
      ) : (
        <TableView
          files={enriched}
          selectedPath={selectedPath}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
