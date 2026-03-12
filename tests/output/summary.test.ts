import { describe, it, expect } from 'vitest';
import { renderSummary } from '../../src/output/summary.js';
import type { BenchmarkStats } from '../../src/types.js';

function makeStats(overrides: Partial<BenchmarkStats> = {}): BenchmarkStats {
  return {
    totalRequests: 100, succeeded: 98, failed: 2,
    totalTimeMs: 2000, requestsPerSec: 50, bytesPerSec: 5000, totalBytes: 10000,
    latency: { min: 10, max: 200, mean: 45, median: 38, p90: 89, p95: 120, p99: 195, stdev: 30 },
    statusCodes: { 200: 98, 500: 2 }, errors: {}, histogram: [],
    ...overrides,
  };
}

describe('renderSummary', () => {
  it('renders complete summary', () => {
    const output = renderSummary(makeStats(), 'https://example.com');
    expect(output).toContain('100');
    expect(output).toContain('98');
    expect(output).toContain('50');
    expect(output).toContain('10ms');
    expect(output).toContain('200ms');
  });
  it('renders all-success summary without failed line', () => {
    const output = renderSummary(
      makeStats({ succeeded: 100, failed: 0, statusCodes: { 200: 100 }, errors: {} }),
      'https://example.com',
    );
    expect(output).toContain('100');
    const lines = output.split('\n');
    const failedLine = lines.find((l) => l.includes('Failed') || /\b0\b.*0\.0%/.test(l));
    expect(failedLine).toBeUndefined();
  });
  it('renders all-failure summary', () => {
    const output = renderSummary(
      makeStats({
        succeeded: 0, failed: 100, statusCodes: {}, errors: { ECONNREFUSED: 100 },
        latency: { min: 0, max: 0, mean: 0, median: 0, p90: 0, p95: 0, p99: 0, stdev: 0 },
      }),
      'https://example.com',
    );
    expect(output).toContain('ECONNREFUSED');
  });
  it('includes status code breakdown', () => {
    const output = renderSummary(
      makeStats({ statusCodes: { 200: 90, 404: 5, 500: 5 } }),
      'https://example.com',
    );
    expect(output).toContain('200');
    expect(output).toContain('404');
    expect(output).toContain('500');
  });
});
