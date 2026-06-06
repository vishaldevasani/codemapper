import { useState, useCallback, useRef } from 'react';
import { fetchSummary } from '../services/api';

export function useSummary() {
  const [summaries, setSummaries] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cache = useRef(new Map());

  const getSummary = useCallback(async (node, projectName, files) => {
    const { id: path, language, inDegree, outDegree, externalDeps } = node;

    // Check cache
    if (cache.current.has(path)) {
      setSummaries(new Map(cache.current));
      return cache.current.get(path);
    }

    setLoading(true);
    setError(null);

    try {
      // Find file content from files array
      const fileData = files?.find(f => f.path === path);
      const content = fileData?.content || '';

      const result = await fetchSummary({
        path,
        content,
        language,
        inDegree,
        outDegree,
        externalDeps: externalDeps || [],
        projectName: projectName || 'this project',
      });

      cache.current.set(path, result);
      setSummaries(new Map(cache.current));
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSummaries = useCallback(() => {
    cache.current.clear();
    setSummaries(new Map());
    setError(null);
  }, []);

  return { summaries, loading, error, getSummary, clearSummaries };
}
