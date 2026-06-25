export interface KqlValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  referencedFields: string[];
}

const KNOWN_OPERATORS = new Set([
  'where', 'summarize', 'extend', 'project', 'order', 'sort', 'limit',
  'take', 'top', 'timestats', 'makeset', 'count', 'dcount', 'sum',
  'avg', 'min', 'max', 'by', 'asc', 'desc', 'as', 'and', 'or', 'not',
  'in', 'contains', 'startswith', 'endswith', 'matches', 'regex',
  'between', 'has', 'tolower', 'toupper', 'tostring', 'tolong',
  'toint', 'todouble', 'tobool', 'now', 'ago', 'bin', 'format_datetime',
  'datetime_diff', 'strlen', 'substring', 'split', 'trim', 'replace',
  'strcat', 'iff', 'iif', 'case', 'isempty', 'isnotempty', 'isnull',
  'isnotnull', 'pack', 'parse_json', 'mv-expand', 'join', 'lookup',
  'union', 'render', 'print', 'let', 'dataset', 'earliest', 'latest',
  'span', 'true', 'false', 'null',
]);

const AGGREGATION_FUNCTIONS = new Set([
  'count', 'dcount', 'sum', 'avg', 'min', 'max', 'percentile',
  'stdev', 'variance', 'makeset', 'makelist', 'countif', 'sumif',
  'avgif', 'any', 'arg_max', 'arg_min',
]);

export function parseKqlFields(query: string): string[] {
  const fields = new Set<string>();
  if (!query || !query.trim()) return [];

  const lines = query.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const stripped = line.startsWith('|') ? line.slice(1).trim() : line;

    // dataset="..." and earliest/latest are not fields
    if (stripped.startsWith('dataset=')) {
      // Extract from the rest after dataset clause
      const afterDataset = stripped.replace(/dataset="[^"]*"\s*/g, '').replace(/earliest=[^\s]*/g, '').replace(/latest=[^\s]*/g, '');
      extractFieldsFromExpression(afterDataset, fields);
      continue;
    }

    extractFieldsFromExpression(stripped, fields);
  }

  return [...fields].sort();
}

function extractFieldsFromExpression(expr: string, fields: Set<string>) {
  if (!expr) return;

  // Remove string literals to avoid false positives
  const cleaned = expr.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");

  // Match identifiers: word chars, underscores, dots (for nested like userIdentity_arn)
  const identifiers = cleaned.match(/\b[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*/g) || [];

  for (const id of identifiers) {
    const lower = id.toLowerCase();
    // Skip known operators/functions/keywords
    if (KNOWN_OPERATORS.has(lower)) continue;
    if (AGGREGATION_FUNCTIONS.has(lower)) continue;
    // Skip things that look like function calls when followed by (
    if (cleaned.includes(`${id}(`)) continue;
    // Skip numeric-like
    if (/^\d/.test(id)) continue;

    fields.add(id);
  }

  // Handle "by" clauses — fields after "by" are definitely field references
  const byMatch = cleaned.match(/\bby\s+(.+?)(?:\||$)/i);
  if (byMatch) {
    const byFields = byMatch[1].split(',').map(f => f.trim());
    for (const bf of byFields) {
      const id = bf.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
      if (id && !KNOWN_OPERATORS.has(id[0].toLowerCase()) && !AGGREGATION_FUNCTIONS.has(id[0].toLowerCase())) {
        fields.add(id[0]);
      }
    }
  }

  // Handle "= assignment" in extend — left side is new alias, not a source field
  const assignments = cleaned.match(/(\w+)\s*=/g) || [];
  for (const a of assignments) {
    const alias = a.replace(/\s*=/, '');
    fields.delete(alias);
  }
}

export function validateKql(query: string): KqlValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!query || !query.trim()) {
    return { valid: false, errors: ['Query is empty'], warnings: [], referencedFields: [] };
  }

  const lines = query.split('\n').map(l => l.trim()).filter(Boolean);

  // Check first line starts with dataset= or a pipe operator
  const firstLine = lines[0];
  if (!firstLine.startsWith('dataset=') && !firstLine.startsWith('|') && !firstLine.match(/^\w/)) {
    warnings.push('First line typically starts with dataset="..." or a pipe operator');
  }

  // Check for balanced quotes
  const allText = lines.join(' ');
  const doubleQuotes = (allText.match(/"/g) || []).length;
  const singleQuotes = (allText.match(/'/g) || []).length;
  if (doubleQuotes % 2 !== 0) errors.push('Unmatched double quote');
  if (singleQuotes % 2 !== 0) errors.push('Unmatched single quote');

  // Check for balanced parentheses
  let parenDepth = 0;
  for (const ch of allText) {
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;
    if (parenDepth < 0) { errors.push('Unexpected closing parenthesis'); break; }
  }
  if (parenDepth > 0) errors.push('Unclosed parenthesis');

  // Check pipe operators are valid
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|')) {
      warnings.push(`Line ${i + 1}: Expected pipe operator at start`);
    } else {
      const afterPipe = line.slice(1).trim();
      const firstWord = afterPipe.match(/^(\w+)/)?.[1]?.toLowerCase();
      if (firstWord && !KNOWN_OPERATORS.has(firstWord) && !AGGREGATION_FUNCTIONS.has(firstWord)) {
        warnings.push(`Line ${i + 1}: Unknown operator "${firstWord}"`);
      }
    }
  }

  // Check for common mistakes
  if (allText.includes('(?i)')) {
    warnings.push('Inline regex flag (?i) can crash in complex pipelines — use character-class alternation instead');
  }

  const referencedFields = parseKqlFields(query);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    referencedFields,
  };
}
