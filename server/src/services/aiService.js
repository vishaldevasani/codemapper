const axios = require('axios');

// ─── Provider selection ────────────────────────────────────────────────────────
// Priority: Groq (free API) → Ollama (local, free) → error
// Set AI_PROVIDER=groq or AI_PROVIDER=ollama in .env
// Or just set GROQ_API_KEY and it auto-selects Groq.

function getProvider() {
  if (process.env.AI_PROVIDER === 'ollama') return 'ollama';
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.AI_PROVIDER === 'groq') return 'groq';
  return 'ollama'; // default to local Ollama (no key needed)
}

// ─── Groq ──────────────────────────────────────────────────────────────────────
// Free tier: https://console.groq.com  (no credit card required)
// Models: llama-3.3-70b-versatile, llama3-8b-8192, mixtral-8x7b-32768
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_BASE  = 'https://api.groq.com/openai/v1';

async function groqChat(messages, systemPrompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set. Get a free key at https://console.groq.com');

  const payload = {
    model: GROQ_MODEL,
    max_tokens: 1024,
    temperature: 0.2,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
    ],
  };

  const res = await axios.post(`${GROQ_BASE}/chat/completions`, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  return res.data.choices[0].message.content.trim();
}

// ─── Ollama ────────────────────────────────────────────────────────────────────
// Local, completely free. Install: https://ollama.com
// Pull a model first: ollama pull llama3.2 (or mistral, codellama, etc.)
const OLLAMA_BASE  = process.env.OLLAMA_URL  || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

async function ollamaChat(messages, systemPrompt) {
  const fullMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  const res = await axios.post(`${OLLAMA_BASE}/api/chat`, {
    model: OLLAMA_MODEL,
    messages: fullMessages,
    stream: false,
    options: { temperature: 0.2 },
  });

  return res.data.message.content.trim();
}

// ─── Unified chat call ─────────────────────────────────────────────────────────
async function chat(messages, systemPrompt) {
  const provider = getProvider();
  if (provider === 'groq') {
    return groqChat(messages, systemPrompt);
  }
  return ollamaChat(messages, systemPrompt);
}

// ─── Strip markdown fences from LLM output ────────────────────────────────────
function cleanJson(text) {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// ─── Parse JSON safely, retrying with a simpler extraction if needed ──────────
function parseJson(text) {
  try {
    return JSON.parse(cleanJson(text));
  } catch (_) {
    // Try to extract a JSON object from somewhere in the text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse JSON from AI response');
  }
}

// ─── Public: generate file summary ────────────────────────────────────────────
async function generateFileSummary({ path, content, language, inDegree, outDegree, externalDeps, projectName }) {
  const truncated = (content || '').slice(0, 3500);

  const system = 'You are a senior software engineer. You ONLY output raw JSON — no markdown, no explanation, no code fences, nothing else before or after the JSON object.';

  const user = `Analyze this ${language} file at path "${path}" in the "${projectName}" project.

File content:
${truncated}

Graph metrics: imported by ${inDegree} files, imports ${outDegree} files, external deps: ${JSON.stringify(externalDeps)}.

Return ONLY a raw JSON object like this (no markdown, no extra text):
{"summary":"one paragraph plain English description","exports":["exportedName"],"role":"one sentence role in project","keyFunctions":[{"name":"fnName","description":"what it does"}],"complexity":"low","externalDeps":["pkg"]}`;

  const text = await chat([{ role: 'user', content: user }], system);
  return parseJson(text);
}

// ─── Public: semantic search ───────────────────────────────────────────────────
async function searchFiles({ query, files }) {
  const snippets = files.slice(0, 20).map(f => ({
    path: f.path,
    preview: (f.content || '').slice(0, 400),
  }));

  const system = 'You are a code search engine. You ONLY output raw JSON — no markdown, no explanation, nothing else.';

  const user = `Find which files are most relevant to: "${query}"

Files:
${JSON.stringify(snippets)}

Return ONLY raw JSON (no markdown):
{"results":[{"path":"file.js","relevance":9,"reason":"one sentence"}]}

Sort by relevance descending. Top 5 only. Relevance 1-10.`;

  const text = await chat([{ role: 'user', content: user }], system);
  const parsed = parseJson(text);
  return parsed.results || [];
}

module.exports = { generateFileSummary, searchFiles, getProvider };
