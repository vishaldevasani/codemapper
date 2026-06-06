const summaryCache = new Map();
const repoCache = new Map();

function getCachedSummary(path) {
  return summaryCache.get(path) || null;
}

function setCachedSummary(path, data) {
  summaryCache.set(path, data);
}

function getCachedRepo(key) {
  return repoCache.get(key) || null;
}

function setCachedRepo(key, data) {
  repoCache.set(key, data);
}

function clearAll() {
  summaryCache.clear();
  repoCache.clear();
}

module.exports = { getCachedSummary, setCachedSummary, getCachedRepo, setCachedRepo, clearAll };
