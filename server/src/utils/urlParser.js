function parseGitHubUrl(url) {
  if (!url) throw new Error('No URL provided');

  // Normalize: remove trailing slash, .git suffix
  const cleaned = url.trim().replace(/\.git$/, '').replace(/\/$/, '');

  // Match github.com URLs
  const match = cleaned.match(/github\.com[/:]([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL. Expected format: https://github.com/owner/repo');

  const owner = match[1];
  const repo = match[2];

  if (!owner || !repo) throw new Error('Could not parse owner and repo from URL');

  return { owner, repo };
}

module.exports = { parseGitHubUrl };
