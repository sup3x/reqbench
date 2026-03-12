import { describe, it, expect } from 'vitest';
import { formatJsonExport } from '../../src/output/json-export.js';
import type { BenchmarkConfig, BenchmarkStats } from '../../src/types.js';

function makeConfig(): BenchmarkConfig {
  return { url: 'https://example.com/api', method: 'GET', headers: {}, requests: 100, concurrency: 10, timeout: 10000 };
}
function makeStats(): BenchmarkStats {
  return {
    totalRequests: 100, succeeded: 100, failed: 0, totalTimeMs: 2000, requestsPerSec: 50,
    bytesPerSec: 5000, totalBytes: 10000,
    latency: { min: 10, max: 100, mean: 45, median: 40, p90: 80, p95: 90, p99: 99, stdev: 20 },
    statusCodes: { 200: 100 }, errors: {}, histogram: [],
  };
}

describe('formatJsonExport', () => {
  it('produces valid JSON', () => {
    const parsed = JSON.parse(formatJsonExport(makeConfig(), makeStats()));
    expect(parsed).toBeDefined();
  });
  it('includes all required fields', () => {
    const parsed = JSON.parse(formatJsonExport(makeConfig(), makeStats()));
    expect(parsed.url).toBe('https://example.com/api');
    expect(parsed.method).toBe('GET');
    expect(parsed.config.requests).toBe(100);
    expect(parsed.config.concurrency).toBe(10);
    expect(parsed.config.timeout).toBe(10000);
    expect(parsed.stats.totalRequests).toBe(100);
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.version).toBeDefined();
  });
  it('includes valid ISO timestamp', () => {
    const parsed = JSON.parse(formatJsonExport(makeConfig(), makeStats()));
    expect(new Date(parsed.timestamp).getTime()).not.toBeNaN();
  });
  it('includes version string', () => {
    const parsed = JSON.parse(formatJsonExport(makeConfig(), makeStats()));
    expect(typeof parsed.version).toBe('string');
    expect(parsed.version.length).toBeGreaterThan(0);
  });
});
