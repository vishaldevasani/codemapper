const axios = require('axios');

function getGitHubClient() {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'CodeMapper/1.0',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return axios.create({ baseURL: 'https://api.github.com', headers });
}

async function getRepoMeta(owner, repo) {
  const client = getGitHubClient();
  try {
    const { data } = await client.get(`/repos/${owner}/${repo}`);
    return {
      name: `${owner}/${repo}`,
      description: data.description || '',
      stars: data.stargazers_count,
      language: data.language || 'Unknown',
      url: data.html_url,
      defaultBranch: data.default_branch || 'main',
    };
  } catch (err) {
    if (err.response?.status === 404) {
      const e = new Error(`Repository ${owner}/${repo} not found`);
      e.status = 404;
      throw e;
    }
    if (err.response?.status === 403 || err.response?.status === 429) {
      const e = new Error('GitHub API rate limit exceeded. Add a GITHUB_TOKEN to increase limits.');
      e.status = 429;
      throw e;
    }
    throw err;
  }
}

async function getRepoTree(owner, repo, branch = 'main') {
  const client = getGitHubClient();
  // Try HEAD first, then the provided branch
  for (const ref of ['HEAD', branch, 'master', 'main']) {
    try {
      const { data } = await client.get(`/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`);
      return data.tree || [];
    } catch (err) {
      if (err.response?.status === 404) continue;
      throw err;
    }
  }
  throw new Error('Could not fetch repository tree');
}

async function getFileContent(owner, repo, path) {
  const client = getGitHubClient();
  try {
    const { data } = await client.get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`);
    if (data.encoding === 'base64' && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    if (err.response?.status === 403 || err.response?.status === 429) return null;
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { getRepoMeta, getRepoTree, getFileContent, sleep };
