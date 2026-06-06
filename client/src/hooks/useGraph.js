import { useState, useCallback } from 'react';

export function useGraph() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [languageFilter, setLanguageFilter] = useState(new Set());
  const [showOrphans, setShowOrphans] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const setGraphData = useCallback((graphData) => {
    setNodes(graphData.nodes || []);
    setEdges(graphData.edges || []);
    setStats(graphData.stats || null);
    setLanguageFilter(new Set());
    setHighlightedNodes(new Set());
    setSelectedNode(null);
  }, []);

  const selectNode = useCallback((node) => {
    setSelectedNode(node);
    if (node) {
      // Highlight node and its neighbors
      const neighborIds = new Set([node.id]);
      // This will be enhanced by the graph component with actual neighbor data
      setHighlightedNodes(neighborIds);
    }
  }, []);

  const highlightNodes = useCallback((paths) => {
    setHighlightedNodes(new Set(paths));
  }, []);

  const resetHighlights = useCallback(() => {
    setHighlightedNodes(new Set());
    setSelectedNode(null);
  }, []);

  const filterByLanguage = useCallback((lang) => {
    setLanguageFilter(prev => {
      const next = new Set(prev);
      if (next.has(lang)) {
        next.delete(lang);
      } else {
        next.add(lang);
      }
      return next;
    });
  }, []);

  const toggleOrphans = useCallback(() => {
    setShowOrphans(prev => !prev);
  }, []);

  const toggleLabels = useCallback(() => {
    setShowLabels(prev => !prev);
  }, []);

  const getFilteredNodes = useCallback(() => {
    let filtered = nodes;
    if (languageFilter.size > 0) {
      filtered = filtered.filter(n => languageFilter.has(n.language));
    }
    if (!showOrphans) {
      filtered = filtered.filter(n => !n.isOrphan);
    }
    return filtered;
  }, [nodes, languageFilter, showOrphans]);

  const getFilteredEdges = useCallback((filteredNodes) => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
  }, [edges]);

  return {
    nodes,
    edges,
    stats,
    selectedNode,
    highlightedNodes,
    languageFilter,
    showOrphans,
    showLabels,
    setGraphData,
    selectNode,
    highlightNodes,
    resetHighlights,
    filterByLanguage,
    toggleOrphans,
    toggleLabels,
    getFilteredNodes,
    getFilteredEdges,
  };
}
