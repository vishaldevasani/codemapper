import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { getLangColor } from '../../utils/languageColors.js';

const MAX_R = 22, MIN_R = 5;

function nodeRadius(n) { return Math.min(MIN_R + (n.inDegree || 0) * 2, MAX_R); }
function nodeColor(lang) { return getLangColor(lang).color; }

// Read CSS variable from document root (respects light/dark theme)
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function Graph({ nodes, edges, selectedNode, highlightedNodes, showLabels, onNodeClick, onNodeDoubleClick }) {
  const svgRef       = useRef(null);
  const simRef       = useRef(null);
  const gRef         = useRef(null);
  const zoomRef      = useRef(null);
  const adjRef       = useRef(new Map());

  function buildAdj(nodes, edges) {
    const adj = new Map();
    nodes.forEach(n => adj.set(n.id, new Set()));
    edges.forEach(e => {
      const s = typeof e.source === 'object' ? e.source.id : e.source;
      const t = typeof e.target === 'object' ? e.target.id : e.target;
      adj.get(s)?.add(t);
      adj.get(t)?.add(s);
    });
    return adj;
  }

  function fitScreen(svg, g, zoom, w, h) {
    try {
      const b = g.node().getBBox();
      if (!b.width || !b.height) return;
      const scale = Math.min(0.85 * w / b.width, 0.85 * h / b.height, 2);
      const tx = w / 2 - scale * (b.x + b.width / 2);
      const ty = h / 2 - scale * (b.y + b.height / 2);
      svg.transition().duration(700)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    } catch (_) {}
  }

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const container = svgRef.current.parentElement;
    const W = container.clientWidth, H = container.clientHeight;

    d3.select(svgRef.current).selectAll('*').remove();
    simRef.current?.stop();

    // Remove old tooltip
    d3.select('.graph-tooltip').remove();
    const tooltip = d3.select('body').append('div').attr('class', 'graph-tooltip').style('opacity', 0);

    const svg = d3.select(svgRef.current).attr('width', W).attr('height', H);

    const zoom = d3.zoom().scaleExtent([0.04, 5]).on('zoom', ev => g.attr('transform', ev.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    const g = svg.append('g');
    gRef.current = g;

    // Clone data
    const simNodes = nodes.map(n => ({ ...n }));
    const nodeById  = new Map(simNodes.map(n => [n.id, n]));
    adjRef.current  = buildAdj(simNodes, edges);

    const simEdges = edges
      .map(e => ({
        ...e,
        source: typeof e.source === 'object' ? e.source.id : e.source,
        target: typeof e.target === 'object' ? e.target.id : e.target,
      }))
      .filter(e => nodeById.has(e.source) && nodeById.has(e.target));

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arr').attr('viewBox', '0 -4 8 8').attr('refX', 16).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', cssVar('--border'));

    // Force sim
    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).id(d => d.id).distance(90).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide().radius(d => nodeRadius(d) + 5))
      .alphaDecay(0.018);
    simRef.current = sim;

    // Edges
    const link = g.append('g').selectAll('line').data(simEdges).enter().append('line')
      .attr('stroke', cssVar('--border'))
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#arr)');

    // Node groups
    const drag = d3.drag()
      .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
      .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });

    const ng = g.append('g').selectAll('g').data(simNodes).enter().append('g')
      .attr('class', 'node-g').style('cursor', 'pointer').call(drag);

    // Circles
    ng.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', d => nodeColor(d.language))
      .attr('stroke', cssVar('--border'))
      .attr('stroke-width', 1.5);

    // Labels
    ng.append('text')
      .attr('class', 'node-label')
      .attr('dy', d => nodeRadius(d) + 13)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', cssVar('--text-secondary'))
      .attr('pointer-events', 'none')
      .text(d => d.label);

    // Hover
    ng.on('mouseenter', (ev, d) => {
      const panel = cssVar('--panel');
      const border = cssVar('--border');
      const textPri = cssVar('--text-primary');
      const textSec = cssVar('--text-secondary');
      const accent = cssVar('--accent');
      const lc = getLangColor(d.language);
      tooltip.style('opacity', 1).html(`
        <div style="color:${accent};font-weight:700;margin-bottom:4px;font-size:13px">${d.label}</div>
        <div style="color:${textSec};font-size:10px;margin-bottom:8px;word-break:break-all">${d.id}</div>
        <div style="display:flex;gap:16px;font-size:11px;margin-bottom:6px">
          <span>↓ <b style="color:${textPri}">${d.inDegree}</b> imports</span>
          <span>↑ <b style="color:${textPri}">${d.outDegree}</b> used by</span>
          <span>≡ <b style="color:${textPri}">${d.linesOfCode}</b> lines</span>
        </div>
        <span style="font-size:10px;padding:2px 7px;border-radius:99px;background:${lc.color}22;color:${lc.color};border:1px solid ${lc.color}44">${lc.displayName}</span>
        ${d.isOrphan ? `<span style="margin-left:6px;font-size:10px;color:var(--warning)">⚠ isolated</span>` : ''}
        <div style="margin-top:8px;font-size:10px;color:${textSec}">
          💡 <b>Click</b> to select · <b>Double-click</b> for AI summary
        </div>
      `);
    })
    .on('mousemove', ev => tooltip.style('left', ev.clientX + 16 + 'px').style('top', ev.clientY - 12 + 'px'))
    .on('mouseleave', () => tooltip.style('opacity', 0));

    // Click / dblclick
    ng.on('click', (ev, d) => {
      ev.stopPropagation();
      onNodeClick(d, adjRef.current.get(d.id) || new Set());
    });
    ng.on('dblclick', (ev, d) => { ev.stopPropagation(); onNodeDoubleClick(d); });
    svg.on('click', () => onNodeClick(null, new Set()));

    // Tick
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      ng.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Fit after settle
    setTimeout(() => fitScreen(svg, g, zoom, W, H), 1400);

    return () => { sim.stop(); tooltip.remove(); };
  }, [nodes, edges]);

  // Update visual selection/highlight state
  useEffect(() => {
    if (!gRef.current) return;
    const g = gRef.current;
    const hasSelected = !!selectedNode;
    const hasHighlight = highlightedNodes.size > 0;

    g.selectAll('.node-g circle')
      .attr('stroke', d => {
        if (selectedNode?.id === d.id) return '#58a6ff';
        if (highlightedNodes.has(d.id)) return '#ffa500';
        return cssVar('--border');
      })
      .attr('stroke-width', d => {
        if (selectedNode?.id === d.id || highlightedNodes.has(d.id)) return 3;
        return 1.5;
      })
      .attr('opacity', d => {
        if (!hasSelected && !hasHighlight) return 1;
        if (selectedNode?.id === d.id || highlightedNodes.has(d.id)) return 1;
        return 0.18;
      });

    g.selectAll('line')
      .attr('stroke', d => {
        if (!selectedNode) return cssVar('--border');
        const s = typeof d.source === 'object' ? d.source.id : d.source;
        const t = typeof d.target === 'object' ? d.target.id : d.target;
        return (s === selectedNode.id || t === selectedNode.id) ? '#58a6ff' : cssVar('--border');
      })
      .attr('stroke-opacity', d => {
        if (!hasSelected) return 0.5;
        const s = typeof d.source === 'object' ? d.source.id : d.source;
        const t = typeof d.target === 'object' ? d.target.id : d.target;
        return (s === selectedNode?.id || t === selectedNode?.id) ? 1 : 0.08;
      });

    g.selectAll('.node-label').style('display', showLabels ? 'block' : 'none');
  }, [selectedNode, highlightedNodes, showLabels]);

  function handleResetZoom() {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(400).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }

  function handleFitScreen() {
    if (!svgRef.current || !gRef.current || !zoomRef.current) return;
    const c = svgRef.current.parentElement;
    fitScreen(d3.select(svgRef.current), gRef.current, zoomRef.current, c.clientWidth, c.clientHeight);
  }

  function fitScreen(svg, g, zoom, w, h) {
    try {
      const b = g.node().getBBox();
      if (!b.width || !b.height) return;
      const scale = Math.min(0.85 * w / b.width, 0.85 * h / b.height, 2);
      const tx = w / 2 - scale * (b.x + b.width / 2);
      const ty = h / 2 - scale * (b.y + b.height / 2);
      svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    } catch (_) {}
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%', background: 'var(--bg)' }} />

      {/* Help hint */}
      <div style={{
        position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
        fontSize: 11, color: 'var(--text-muted)', pointerEvents: 'none',
        background: 'var(--panel)', border: '1px solid var(--border)',
        padding: '4px 12px', borderRadius: 99,
      }}>
        Click to select · Double-click for AI · Scroll to zoom · Drag to pan
      </div>

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 6 }}>
        <IconBtn onClick={handleResetZoom} title="Reset zoom">⊙</IconBtn>
        <IconBtn onClick={handleFitScreen} title="Fit to screen">⤢</IconBtn>
      </div>
    </div>
  );
}

function IconBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 32, height: 32, borderRadius: 7, border: '1px solid var(--border)',
      background: 'var(--panel)', color: 'var(--text-secondary)', cursor: 'pointer',
      fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'color 0.12s, background 0.12s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--panel2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--panel)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      {children}
    </button>
  );
}
