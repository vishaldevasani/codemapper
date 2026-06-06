const { generateFileSummary, getProvider } = require('../services/aiService');
const { getCachedSummary, setCachedSummary } = require('../services/cacheService');

async function summary(req, res, next) {
  try {
    const { path, content, language, inDegree, outDegree, externalDeps, projectName } = req.body;

    if (!path) return res.status(400).json({ error: 'path is required' });

    // Check cache
    const cached = getCachedSummary(path);
    if (cached) return res.json(cached);

    const provider = getProvider();
    if (provider === 'groq' && !process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: 'No AI provider configured. Set GROQ_API_KEY in server/.env (free at console.groq.com) or set AI_PROVIDER=ollama.',
      });
    }

    const result = await generateFileSummary({
      path,
      content: content || '',
      language: language || 'unknown',
      inDegree: inDegree || 0,
      outDegree: outDegree || 0,
      externalDeps: externalDeps || [],
      projectName: projectName || 'this project',
    });

    setCachedSummary(path, result);
    res.json(result);
  } catch (err) {
    if (err.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key. Check your GROQ_API_KEY in server/.env' });
    }
    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'AI rate limit hit. Wait a moment and try again.' });
    }
    if (err instanceof SyntaxError || err.message?.includes('JSON')) {
      return res.status(500).json({ error: 'AI returned malformed response. Try again.' });
    }
    next(err);
  }
}

module.exports = { summary };
