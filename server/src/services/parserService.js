const path = require('path');

const SUPPORTED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.css', '.scss', '.md', '.json', '.vue', '.rb', '.go', '.rs'];

function getLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.js': 'js', '.jsx': 'jsx', '.ts': 'ts', '.tsx': 'tsx',
    '.py': 'py', '.css': 'css', '.scss': 'scss', '.md': 'md',
    '.json': 'json', '.vue': 'vue', '.rb': 'rb', '.go': 'go',
    '.rs': 'rs', '.html': 'html', '.sh': 'sh', '.yml': 'yml',
    '.yaml': 'yaml', '.toml': 'toml',
  };
  return map[ext] || 'other';
}

function countLines(content) {
  if (!content) return 0;
  return content.split('\n').length;
}

function parseImports(content, language, filePath, allFilePaths) {
  if (!content) return { internal: [], external: [] };

  const internal = [];
  const external = [];

  if (['js', 'jsx', 'ts', 'tsx', 'vue'].includes(language)) {
    const deps = new Set();

    // Pattern 1: require('./path') or require('package')
    const requireRegex = /\brequire\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let m;
    while ((m = requireRegex.exec(content)) !== null) deps.add(m[1]);

    // Pattern 2: import ... from './path' or 'package'
    const importFromRegex = /\bimport\s+(?:[\s\S]*?\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    while ((m = importFromRegex.exec(content)) !== null) deps.add(m[1]);

    // Pattern 3: export ... from './path'
    const exportFromRegex = /\bexport\s+(?:[\s\S]*?\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    while ((m = exportFromRegex.exec(content)) !== null) deps.add(m[1]);

    // Pattern 4: dynamic import('./path')
    const dynImportRegex = /\bimport\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((m = dynImportRegex.exec(content)) !== null) deps.add(m[1]);

    for (const dep of deps) {
      if (dep.startsWith('.')) {
        const resolved = resolveRelativePath(filePath, dep, allFilePaths);
        if (resolved) internal.push(resolved);
      } else if (!dep.startsWith('/') && !dep.startsWith('http')) {
        const pkgName = dep.startsWith('@')
          ? dep.split('/').slice(0, 2).join('/')
          : dep.split('/')[0];
        if (pkgName && !external.includes(pkgName)) external.push(pkgName);
      }
    }
  } else if (language === 'py') {
    // Pattern: import foo, from foo import bar, from .foo import bar
    const importRegex = /^(?:import|from)\s+(\.{0,2}[\w./]+)/gm;
    let m;
    while ((m = importRegex.exec(content)) !== null) {
      const dep = m[1].trim();
      if (dep.startsWith('.')) {
        // Relative import
        const normalized = dep.replace(/\./g, '/').replace(/^\/+/, './');
        const resolved = resolveRelativePath(filePath, normalized, allFilePaths);
        if (resolved) internal.push(resolved);
      } else {
        const resolved = resolveRelativePath(filePath, './' + dep.replace(/\./g, '/'), allFilePaths);
        if (resolved) internal.push(resolved);
        else {
          const pkgName = dep.split('.')[0];
          if (pkgName && !external.includes(pkgName)) external.push(pkgName);
        }
      }
    }
  } else if (language === 'rb') {
    const requireRegex = /\brequire_relative\s+['"]([^'"]+)['"]/g;
    let m;
    while ((m = requireRegex.exec(content)) !== null) {
      const resolved = resolveRelativePath(filePath, './' + m[1], allFilePaths);
      if (resolved) internal.push(resolved);
    }
  } else if (language === 'go') {
    const importRegex = /"(\.{1,2}\/[^"]+)"/g;
    let m;
    while ((m = importRegex.exec(content)) !== null) {
      const resolved = resolveRelativePath(filePath, m[1], allFilePaths);
      if (resolved) internal.push(resolved);
    }
  }

  return { internal: [...new Set(internal)], external: [...new Set(external)] };
}

function resolveRelativePath(fromFile, importPath, allFilePaths) {
  const dir = path.dirname(fromFile);
  // Normalize to forward slashes
  const base = path.join(dir, importPath).replace(/\\/g, '/');

  // 1. Exact match
  if (allFilePaths.includes(base)) return base;

  // 2. Try adding extensions
  for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.go', '.rs', '.vue']) {
    if (allFilePaths.includes(base + ext)) return base + ext;
  }

  // 3. Try as directory/index
  for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.py']) {
    if (allFilePaths.includes(base + '/index' + ext)) return base + '/index' + ext;
  }

  // 4. Strip extension and retry (handles './foo.js' import when file is 'foo.js')
  const withoutExt = base.replace(/\.[^/.]+$/, '');
  if (withoutExt !== base && allFilePaths.includes(withoutExt)) return withoutExt;
  for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.py']) {
    if (allFilePaths.includes(withoutExt + ext)) return withoutExt + ext;
  }

  return null;
}

function buildGraph(files) {
  const nodes = [];
  const edges = [];
  const allFilePaths = files.map(f => f.path);
  const inDegreeMap  = {};
  const outDegreeMap = {};
  const externalDepsMap = {};

  for (const file of files) {
    inDegreeMap[file.path]     = 0;
    outDegreeMap[file.path]    = 0;
    externalDepsMap[file.path] = [];
  }

  for (const file of files) {
    const { internal, external } = parseImports(file.content, file.language, file.path, allFilePaths);
    externalDepsMap[file.path] = external;

    const uniqueTargets = [...new Set(internal)];
    outDegreeMap[file.path] = uniqueTargets.length;

    for (const target of uniqueTargets) {
      edges.push({ source: file.path, target, type: 'import' });
      inDegreeMap[target] = (inDegreeMap[target] || 0) + 1;
    }
  }

  for (const file of files) {
    nodes.push({
      id: file.path,
      label: path.basename(file.path),
      language: file.language,
      size: file.size,
      linesOfCode: file.linesOfCode,
      inDegree: inDegreeMap[file.path]  || 0,
      outDegree: outDegreeMap[file.path] || 0,
      externalDeps: externalDepsMap[file.path] || [],
      isOrphan: (inDegreeMap[file.path] || 0) === 0 && (outDegreeMap[file.path] || 0) === 0,
    });
  }

  const languages = {};
  for (const file of files) {
    languages[file.language] = (languages[file.language] || 0) + 1;
  }

  const sortedByInDegree = [...nodes].sort((a, b) => b.inDegree - a.inDegree);
  const mostImported = sortedByInDegree.slice(0, 3).map(n => n.id);
  const orphanFiles  = nodes.filter(n => n.isOrphan).map(n => n.id);
  const totalDeg     = nodes.reduce((s, n) => s + n.inDegree + n.outDegree, 0);
  const avgDegree    = nodes.length ? parseFloat((totalDeg / nodes.length).toFixed(2)) : 0;

  return {
    nodes,
    edges,
    stats: { totalFiles: nodes.length, totalEdges: edges.length, languages, mostImported, orphanFiles, avgDegree },
  };
}

function shouldIncludeFile(file) {
  if (file.type !== 'blob') return false;
  if (file.size > 200 * 1024) return false; // raised limit to 200KB
  if (file.size === 0) return false;

  const filePath = file.path.toLowerCase();
  const ext = path.extname(filePath);

  // Skip binary/asset extensions
  const ignoredExts = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.mp4', '.mp3', '.wav', '.ogg',
    '.zip', '.tar', '.gz', '.rar', '.7z',
    '.pdf', '.docx', '.xlsx',
    '.pyc', '.pyo', '.pyd',
    '.class', '.jar', '.war',
    '.exe', '.dll', '.so', '.dylib',
    '.map',
  ];
  if (ignoredExts.includes(ext)) return false;

  // Skip minified
  if (filePath.includes('.min.js') || filePath.includes('.min.css')) return false;

  // Skip generated/vendor dirs
  const ignoredParts = [
    'node_modules/', 'dist/', 'build/', '.git/',
    'vendor/', '__pycache__/', '.next/', '.nuxt/',
    'coverage/', '.nyc_output/', 'out/', '.cache/',
  ];
  for (const part of ignoredParts) {
    if (filePath.includes(part)) return false;
  }

  // Skip pure data/lock files that clutter the graph
  const ignoredNames = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock', 'Gemfile.lock'];
  const basename = path.basename(filePath);
  if (ignoredNames.includes(basename)) return false;

  return true;
}

// Score files so core source files are fetched first (before the 150-file cap)
function scoreFile(file) {
  const p = file.path.toLowerCase();
  let score = 0;

  // Strongly prefer source code files
  const codeExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.go', '.rs', '.vue'];
  if (codeExts.includes(path.extname(p))) score += 100;

  // Prefer files in source directories
  if (p.startsWith('src/') || p.startsWith('lib/') || p.startsWith('app/')) score += 50;

  // Penalise test/example files (still include them, just lower priority)
  if (p.includes('test') || p.includes('spec') || p.includes('example') || p.includes('fixture')) score -= 30;

  // Prefer smaller files (more likely to be source than data)
  score -= Math.floor(file.size / 10000);

  return score;
}

module.exports = { buildGraph, getLanguage, countLines, shouldIncludeFile, scoreFile, SUPPORTED_EXTENSIONS };
