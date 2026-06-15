import { describe, it, expect } from 'vitest';
import { stripUnresolvedTokens } from './queryClean';

describe('stripUnresolvedTokens', () => {
  it('removes a quoted token filter', () => {
    const input = 'dataset="firewall" application="$APP_NAME" earliest=-12h | summarize count()';
    const result = stripUnresolvedTokens(input);
    expect(result).not.toContain('$APP_NAME');
    expect(result).toContain('dataset="firewall"');
    expect(result).toContain('| summarize count()');
  });

  it('removes an unquoted token filter', () => {
    const input = 'dataset="fw" rule_name=$RULE_NAME earliest=-2h | limit 50';
    const result = stripUnresolvedTokens(input);
    expect(result).not.toContain('$RULE_NAME');
    expect(result).toContain('dataset="fw"');
    expect(result).toContain('| limit 50');
  });

  it('removes multiple tokens in one query', () => {
    const input = 'dataset="fw" application="$APP_NAME" rule_name="$RULE_NAME" | summarize count()';
    const result = stripUnresolvedTokens(input);
    expect(result).not.toContain('$APP_NAME');
    expect(result).not.toContain('$RULE_NAME');
    expect(result).toContain('dataset="fw"');
  });

  it('preserves queries with no tokens', () => {
    const input = 'dataset="fw" earliest=-24h | summarize count() by source_ip';
    expect(stripUnresolvedTokens(input)).toBe(input);
  });

  it('does not strip already-resolved $DATASET (replaced before this runs)', () => {
    const input = 'dataset="my_logs" earliest=-1h | limit 10';
    expect(stripUnresolvedTokens(input)).toBe(input);
  });

  it('handles token at beginning of query', () => {
    const input = 'application="$APP_NAME" | summarize count()';
    const result = stripUnresolvedTokens(input);
    expect(result).not.toContain('$APP_NAME');
    expect(result).toContain('| summarize count()');
  });

  it('handles token at end of query', () => {
    const input = 'dataset="fw" | where app="$APP_NAME"';
    const result = stripUnresolvedTokens(input);
    expect(result).not.toContain('$APP_NAME');
    expect(result).toContain('dataset="fw"');
  });
});
