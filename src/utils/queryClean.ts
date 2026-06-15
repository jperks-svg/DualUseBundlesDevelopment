export function stripUnresolvedTokens(query: string): string {
  return query.replace(/\s*\w+\s*=\s*"?\$[A-Z_]+"?\s*/g, ' ').trim();
}
