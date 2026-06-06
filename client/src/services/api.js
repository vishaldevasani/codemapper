const API_URL = import.meta.env.VITE_API_URL || '';

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function analyzeRepo(repoUrl) {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl }),
  });
  return handleResponse(res);
}

export async function fetchSummary(fileData) {
  const res = await fetch(`${API_URL}/api/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fileData),
  });
  return handleResponse(res);
}

export async function searchCode(query, files) {
  const res = await fetch(`${API_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, files }),
  });
  return handleResponse(res);
}
