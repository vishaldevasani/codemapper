import { useState, useCallback } from 'react';
import { searchCode } from '../services/api';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedPaths, setHighlightedPaths] = useState([]);

  const search = useCallback(async (searchQuery, files) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setSearching(true);
    setError(null);

    try {
      const { results: searchResults } = await searchCode(searchQuery, files);
      setResults(searchResults || []);
      setHighlightedPaths((searchResults || []).map(r => r.path));
    } catch (err) {
      setError(err.message);
      setResults([]);
      setHighlightedPaths([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setHighlightedPaths([]);
    setError(null);
  }, []);

  return { query, results, searching, error, highlightedPaths, search, clearSearch };
}
