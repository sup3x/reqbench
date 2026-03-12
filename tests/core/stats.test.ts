import { describe, it, expect } from 'vitest';
import { calculateStats } from '../../src/core/stats.js';
import type { RequestResult } from '../../src/types.js';

function makeResult(status: number, latency: number, bytes = 100): RequestResult {
  return { status, latency, bytes };
}

function makeError(error: string, latency = 0): RequestResult {
  return { status: 0, latency, bytes: 0, error };
}

describe('calculateStats', () => {
  it('calculates basic stats for successful requests', () => {
    const results = [
      makeResult(200, 10), makeResult(200, 20), makeResult(200, 30),
      makeResult(200, 40), makeResult(200, 50),
    ];
    const stats = calculateStats(results, 1000);
    expect(stats.totalRequests).toBe(5);
    expect(stats.succeeded).toBe(5);
    expect(stats.failed).toBe(0);
    expect(stats.totalTimeMs).toBe(1000);
    expect(stats.requestsPerSec).toBe(5);
    expect(stats.latency.min).toBe(10);
    expect(stats.latency.max).toBe(50);
    expect(stats.latency.mean).toBe(30);
    expect(stats.latency.median).toBe(30);
  });

  it('returns zero latency stats when all requests fail', () => {
    const results = [makeError('ECONNREFUSED'), makeError('ETIMEDOUT')];
    const stats = calculateStats(results, 1000);
    expect(stats.totalRequests).toBe(2);
    expect(stats.succeeded).toBe(0);
    expect(stats.failed).toBe(2);
    expect(stats.latency.min).toBe(0);
    expect(stats.latency.max).toBe(0);
    expect(stats.latency.mean).toBe(0);
    expect(stats.latency.stdev).toBe(0);
    expect(stats.histogram).toEqual([]);
  });

  it('handles single request', () => {
    const results = [makeResult(200, 42)];
    const stats = calculateStats(results, 500);
    expect(stats.latency.min).toBe(42);
    expect(stats.latency.max).toBe(42);
    expect(stats.latency.mean).toBe(42);
    expect(stats.latency.median).toBe(42);
    expect(stats.latency.p90).toBe(42);
    expect(stats.latency.p95).toBe(42);
    expect(stats.latency.p99).toBe(42);
    expect(stats.latency.stdev).toBe(0);
  });

  it('handles all same latency', () => {
    const results = Array.from({ length: 100 }, () => makeResult(200, 25));
    const stats = calculateStats(results, 1000);
    expect(stats.latency.min).toBe(25);
    expect(stats.latency.max).toBe(25);
    expect(stats.latency.stdev).toBe(0);
  });

  it('excludes failed requests from latency calculations', () => {
    const results = [
      makeResult(200, 10), makeResult(200, 20), makeError('ETIMEDOUT', 5000),
    ];
    const stats = calculateStats(results, 1000);
    expect(stats.succeeded).toBe(2);
    expect(stats.failed).toBe(1);
    expect(stats.latency.max).toBe(20);
  });

  it('calculates correct percentiles', () => {
    const results = Array.from({ length: 100 }, (_, i) => makeResult(200, i + 1));
    const stats = calculateStats(results, 1000);
    expect(stats.latency.median).toBe(50);
    expect(stats.latency.p90).toBe(90);
    expect(stats.latency.p95).toBe(95);
    expect(stats.latency.p99).toBe(99);
  });

  it('calculates population stdev', () => {
    const results = [makeResult(200, 10), makeResult(200, 20), makeResult(200, 30)];
    const stats = calculateStats(results, 1000);
    const mean = 20;
    const expectedStdev = Math.sqrt(((10-mean)**2 + (20-mean)**2 + (30-mean)**2) / 3);
    expect(stats.latency.stdev).toBeCloseTo(expectedStdev, 5);
  });

  it('groups status codes', () => {
    const results = [
      makeResult(200, 10), makeResult(200, 15), makeResult(404, 20), makeResult(500, 25),
    ];
    const stats = calculateStats(results, 1000);
    expect(stats.statusCodes[200]).toBe(2);
    expect(stats.statusCodes[404]).toBe(1);
    expect(stats.statusCodes[500]).toBe(1);
  });

  it('groups error messages', () => {
    const results = [makeError('ECONNREFUSED'), makeError('ECONNREFUSED'), makeError('ETIMEDOUT')];
    const stats = calculateStats(results, 1000);
    expect(stats.errors['ECONNREFUSED']).toBe(2);
    expect(stats.errors['ETIMEDOUT']).toBe(1);
  });

  it('generates histogram buckets', () => {
    const results = [
      makeResult(200, 10), makeResult(200, 30), makeResult(200, 75),
      makeResult(200, 150), makeResult(200, 350),
    ];
    const stats = calculateStats(results, 1000);
    expect(stats.histogram.length).toBeGreaterThan(0);
    const totalCount = stats.histogram.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(5);
  });

  it('calculates requestsPerSec correctly', () => {
    const results = Array.from({ length: 50 }, () => makeResult(200, 10));
    const stats = calculateStats(results, 2000);
    expect(stats.requestsPerSec).toBe(25);
  });

  it('calculates bytes stats', () => {
    const results = [makeResult(200, 10, 500), makeResult(200, 20, 300)];
    const stats = calculateStats(results, 1000);
    expect(stats.totalBytes).toBe(800);
    expect(stats.bytesPerSec).toBe(800);
  });

  it('last histogram bucket uses -1 as rangeEnd', () => {
    const results = [makeResult(200, 10), makeResult(200, 2000)];
    const stats = calculateStats(results, 1000);
    const lastBucket = stats.histogram[stats.histogram.length - 1];
    expect(lastBucket.rangeEnd).toBe(-1);
  });
});
