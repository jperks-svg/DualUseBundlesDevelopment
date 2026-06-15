import { describe, it, expect } from 'vitest';
import { isMetadataRow, parseNdjsonResults } from './cribl';

describe('isMetadataRow', () => {
  it('identifies rows with isFinished', () => {
    expect(isMetadataRow({ isFinished: true, offset: 0, persistedEventCount: 1, totalEventCount: 1 })).toBe(true);
    expect(isMetadataRow({ isFinished: false, offset: 0, persistedEventCount: 0, totalEventCount: 0 })).toBe(true);
  });

  it('identifies rows with job field', () => {
    expect(isMetadataRow({ job: { id: '123', status: 'running' } })).toBe(true);
  });

  it('identifies rows with persistedEventCount', () => {
    expect(isMetadataRow({ persistedEventCount: 5 })).toBe(true);
  });

  it('rejects actual data rows', () => {
    expect(isMetadataRow({ totalEvents: 1723474 })).toBe(false);
    expect(isMetadataRow({ avgSize: 800 })).toBe(false);
    expect(isMetadataRow({ _time: 1234, _raw: 'some log line' })).toBe(false);
  });

  it('rejects null/undefined/primitives', () => {
    expect(isMetadataRow(null)).toBeFalsy();
    expect(isMetadataRow(undefined)).toBeFalsy();
    expect(isMetadataRow('string')).toBeFalsy();
    expect(isMetadataRow(42)).toBeFalsy();
  });
});

describe('parseNdjsonResults', () => {
  it('parses a finished response with one data row', () => {
    const text = [
      '{"isFinished":false,"offset":0,"persistedEventCount":1,"totalEventCount":1,"job":{"id":"123","status":"running"}}',
      '{"totalEvents":1723474}',
      '{"isFinished":true,"offset":0,"persistedEventCount":1,"totalEventCount":1,"job":{"id":"123","status":"finished"}}',
    ].join('\n');

    const { finished, rows } = parseNdjsonResults(text);
    expect(finished).toBe(true);
    expect(rows).toEqual([{ totalEvents: 1723474 }]);
  });

  it('returns finished=false when job is still running', () => {
    const text = '{"isFinished":false,"offset":0,"persistedEventCount":0,"totalEventCount":0,"job":{"id":"123","status":"running"}}';

    const { finished, rows } = parseNdjsonResults(text);
    expect(finished).toBe(false);
    expect(rows).toEqual([]);
  });

  it('handles multiple data rows', () => {
    const text = [
      '{"isFinished":true,"offset":0,"persistedEventCount":5,"totalEventCount":5}',
      '{"_time":1,"_raw":"event 1"}',
      '{"_time":2,"_raw":"event 2"}',
      '{"_time":3,"_raw":"event 3"}',
    ].join('\n');

    const { finished, rows } = parseNdjsonResults(text);
    expect(finished).toBe(true);
    expect(rows).toHaveLength(3);
    expect(rows[0]._raw).toBe('event 1');
  });

  it('skips unparseable lines gracefully', () => {
    const text = [
      'not valid json',
      '{"totalEvents":42}',
      '{"isFinished":true}',
      '',
    ].join('\n');

    const { finished, rows } = parseNdjsonResults(text);
    expect(finished).toBe(true);
    expect(rows).toEqual([{ totalEvents: 42 }]);
  });

  it('handles empty string', () => {
    const { finished, rows } = parseNdjsonResults('');
    expect(finished).toBe(false);
    expect(rows).toEqual([]);
  });

  it('handles metadata-only response (no data rows)', () => {
    const text = [
      '{"isFinished":true,"offset":0,"persistedEventCount":0,"totalEventCount":0}',
    ].join('\n');

    const { finished, rows } = parseNdjsonResults(text);
    expect(finished).toBe(true);
    expect(rows).toEqual([]);
  });
});
