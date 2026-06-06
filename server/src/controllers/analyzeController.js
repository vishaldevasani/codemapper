const { parseGitHubUrl } = require('../utils/urlParser');
const { getRepoMeta, getRepoTree, getFileContent, sleep } = require('../services/githubService');
const { buildGraph, getLanguage, countLines, shouldIncludeFile, scoreFile } = require('../services/parserService');
const { getCachedRepo, setCachedRepo } = require('../services/cacheService');

async function analyze(req, res, next) {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

    let owner, repo;
    try {
      ({ owner, repo } = parseGitHubUrl(repoUrl));
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const cacheKey = `${owner}/${repo}`;
    const cached = getCachedRepo(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`Analyzing ${owner}/${repo}...`);

    const repoMeta = await getRepoMeta(owner, repo);
    const tree = await getRepoTree(owner, repo, repoMeta.defaultBranch);

    // Filter then sort by score so we fetch the most important files first
    const relevant = tree
      .filter(shouldIncludeFile)
      .sort((a, b) => scoreFile(b) - scoreFile(a))
      .slice(0, 200); // fetch up to 200 scored files

    console.log(`Fetching ${relevant.length} files (scored, out of ${tree.length} total)...`);

    const files = [];
    for (let i = 0; i < relevant.length; i++) {
      const file = relevant[i];
      const content = await getFileContent(owner, repo, file.path);

      if (content !== null) {
        files.push({
          path: file.path,
          language: getLanguage(file.path),
          size: file.size,
          linesOfCode: countLines(content),
          content,
        });
      }

      // Gentle rate-limit back-off
      if (i < relevant.length - 1) await sleep(40);
      if (i % 25 === 0 && i > 0) console.log(`  ${i}/${relevant.length} fetched...`);
    }

    console.log(`Fetched ${files.length} files. Building graph...`);
    const graph = buildGraph(files);
    console.log(`Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

    // Send first 3000 chars of content to client (enough for search snippets)
    const filesResponse = files.map(f => ({
      path: f.path,
      language: f.language,
      size: f.size,
      linesOfCode: f.linesOfCode,
      content: f.content.slice(0, 3000),
    }));

    const result = { repo: repoMeta, files: filesResponse, graph };
    setCachedRepo(cacheKey, result);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { analyze };
