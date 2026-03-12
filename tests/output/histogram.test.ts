import { describe, it, expect } from 'vitest';
import { renderHistogram } from '../../src/output/histogram.js';
import type { HistogramBucket } from '../../src/types.js';

describe('renderHistogram', () => {
  it('renders non-empty histogram', () => {
    const buckets: HistogramBucket[] = [
      { rangeStart: 0, rangeEnd: 50, count: 60, percentage: 60, label: '0-50ms' },
      { rangeStart: 50, rangeEnd: 100, count: 30, percentage: 30, label: '50-100ms' },
      { rangeStart: 100, rangeEnd: -1, count: 10, percentage: 10, label: '100ms+' },
    ];
    const lines = renderHistogram(buckets);
    expect(lines.length).toBe(3);
    expect(lines[0]).toContain('0-50ms');
    expect(lines[0]).toContain('60');
    expect(lines[0]).toContain('\u2588');
  });
  it('returns empty array for empty buckets', () => { expect(renderHistogram([])).toEqual([]); });
  it('renders single bucket', () => {
    const buckets: HistogramBucket[] = [
      { rangeStart: 0, rangeEnd: -1, count: 100, percentage: 100, label: '0ms+' },
    ];
    const lines = renderHistogram(buckets);
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('100');
  });
  it('longest bar gets max width', () => {
    const buckets: HistogramBucket[] = [
      { rangeStart: 0, rangeEnd: 50, count: 100, percentage: 80, label: '0-50ms' },
      { rangeStart: 50, rangeEnd: -1, count: 25, percentage: 20, label: '50ms+' },
    ];
    const lines = renderHistogram(buckets);
    const bar0 = (lines[0].match(/\u2588/g) || []).length;
    const bar1 = (lines[1].match(/\u2588/g) || []).length;
    expect(bar0).toBeGreaterThan(bar1);
  });
});
