const languageColors = {
  js:    { color: '#f7df1e', displayName: 'JavaScript' },
  jsx:   { color: '#61dafb', displayName: 'React' },
  ts:    { color: '#3178c6', displayName: 'TypeScript' },
  tsx:   { color: '#3178c6', displayName: 'TSX' },
  py:    { color: '#3572A5', displayName: 'Python' },
  css:   { color: '#e34c26', displayName: 'CSS' },
  scss:  { color: '#c6538c', displayName: 'SCSS' },
  md:    { color: '#083fa1', displayName: 'Markdown' },
  json:  { color: '#cbcb41', displayName: 'JSON' },
  html:  { color: '#e44b23', displayName: 'HTML' },
  vue:   { color: '#41b883', displayName: 'Vue' },
  rb:    { color: '#cc342d', displayName: 'Ruby' },
  go:    { color: '#00add8', displayName: 'Go' },
  rs:    { color: '#dea584', displayName: 'Rust' },
  sh:    { color: '#89e051', displayName: 'Shell' },
  yml:   { color: '#cb171e', displayName: 'YAML' },
  yaml:  { color: '#cb171e', displayName: 'YAML' },
  toml:  { color: '#9c4221', displayName: 'TOML' },
  other: { color: '#8b8b8b', displayName: 'Other' },
};

export function getLangColor(lang) {
  return languageColors[lang] || languageColors.other;
}

export function getLangBadgeStyle(lang) {
  const { color } = getLangColor(lang);
  return {
    backgroundColor: color + '22',
    color: color,
    border: `1px solid ${color}44`,
  };
}

export default languageColors;
