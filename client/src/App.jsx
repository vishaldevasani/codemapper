import React, { useState, useCallback } from 'react';
import Navbar from './components/Navbar/Navbar.jsx';
import LoadingScreen from './components/LoadingScreen/LoadingScreen.jsx';
import Landing from './components/Landing.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import Graph from './components/Graph/Graph.jsx';
import DetailPanel from './components/DetailPanel/DetailPanel.jsx';
import StatsBar from './components/StatsBar/StatsBar.jsx';
import Toolbar from './components/StatsBar/Toolbar.jsx';
import { useGraph } from './hooks/useGraph.js';
import { useSummary } from './hooks/useSummary.js';
import { useSearch } from './hooks/useSearch.js';
import { useTheme } from './hooks/useTheme.js';
import { analyzeRepo } from './services/api.js';

export default function App() {
  const [repo, setRepo]       = useState(null);
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const { dark, toggle: toggleTheme } = useTheme();
  const graph   = useGraph();
  const summary = useSummary();
  const search  = useSearch();

  const reset = useCallback(() => {
    setRepo(null);
    setFiles([]);
    setError(null);
    graph.resetHighlights();
    summary.clearSummaries();
    search.clearSearch();
  }, [graph, summary, search]);

  const handleAnalyze = useCallback(async (repoUrl) => {
    setLoading(true);
    setError(null);
    setRepo(null);
    setFiles([]);
    graph.resetHighlights();
    summary.clearSummaries();
    search.clearSearch();

    try {
      const data = await analyzeRepo(repoUrl);
      setRepo(data.repo);
      setFiles(data.files || []);
      graph.setGraphData(data.graph);
    } catch (err) {
      setError(err.message || 'Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNodeClick = useCallback((node, neighbors) => {
    if (!node) { graph.selectNode(null); graph.resetHighlights(); return; }
    graph.selectNode(node);
    graph.highlightNodes(new Set([node.id, ...(neighbors || [])]));
  }, [graph]);

  const handleNodeDoubleClick = useCallback(async (node) => {
    graph.selectNode(node);
    await summary.getSummary(node, repo?.name, files);
  }, [graph, summary, repo, files]);

  const handleFileSelect = useCallback((file) => {
    const node = graph.nodes.find(n => n.id === file.path);
    if (node) { graph.selectNode(node); graph.highlightNodes(new Set([node.id])); }
  }, [graph]);

  const handleSearch = useCallback(async (query) => {
    await search.search(query, files);
  }, [search, files]);

  React.useEffect(() => {
    if (search.highlightedPaths.length > 0) {
      graph.highlightNodes(new Set(search.highlightedPaths));
    }
  }, [search.highlightedPaths]);

  const handleSearchClear = useCallback(() => {
    search.clearSearch(); graph.resetHighlights();
  }, [search, graph]);

  const handleRegenerate = useCallback(async () => {
    if (!graph.selectedNode) return;
    await summary.getSummary(graph.selectedNode, repo?.name, files);
  }, [graph.selectedNode, summary, repo, files]);

  const handleClosePanel = useCallback(() => {
    graph.selectNode(null); graph.resetHighlights();
  }, [graph]);

  const filteredNodes = graph.getFilteredNodes();
  const filteredEdges = graph.getFilteredEdges(filteredNodes);
  const currentSummary = graph.selectedNode ? summary.summaries.get(graph.selectedNode.id) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar
        repo={repo}
        files={files}
        onSearch={handleSearch}
        onClearSearch={handleSearchClear}
        searching={search.searching}
        searchResults={search.results}
        dark={dark}
        onToggleTheme={toggleTheme}
        onNewRepo={reset}
      />

      {loading && <LoadingScreen />}

      {!loading && !repo && (
        <Landing onAnalyze={handleAnalyze} loading={loading} error={error} />
      )}

      {!loading && repo && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar
            files={files}
            selectedNode={graph.selectedNode}
            onFileSelect={handleFileSelect}
            graphNodes={graph.nodes}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <StatsBar stats={graph.stats} repo={repo} />
            <Toolbar
              stats={graph.stats}
              showLabels={graph.showLabels}
              onToggleLabels={graph.toggleLabels}
              showOrphans={graph.showOrphans}
              onToggleOrphans={graph.toggleOrphans}
              languageFilter={graph.languageFilter}
              onFilterLanguage={graph.filterByLanguage}
            />
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <Graph
                nodes={filteredNodes}
                edges={filteredEdges}
                selectedNode={graph.selectedNode}
                highlightedNodes={graph.highlightedNodes}
                showLabels={graph.showLabels}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
              />
            </div>
          </div>

          {graph.selectedNode && (
            <DetailPanel
              node={graph.selectedNode}
              summary={currentSummary}
              loading={summary.loading}
              error={summary.error}
              onClose={handleClosePanel}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>
      )}
    </div>
  );
}
