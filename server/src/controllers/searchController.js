const { searchFiles, getProvider } = require('../services/aiService');

async function search(req, res, next) {
  try {
    const { query, files } = req.body;

    if (!query) return res.status(400).json({ error: 'query is required' });
    if (!files || !Array.isArray(files)) return res.status(400).json({ error: 'files array is required' });

    const provider = getProvider();
    if (provider === 'groq' && !process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: 'No AI provider configured. Set GROQ_API_KEY in server/.env (free at console.groq.com) or set AI_PROVIDER=ollama.',
      });
    }

    const results = await searchFiles({ query, files });
    res.json({ results });
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

module.exports = { search };
