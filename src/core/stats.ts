import type { RequestResult, BenchmarkStats, LatencyStats, HistogramBucket } from '../types.js';

const DEFAULT_BOUNDARIES = [25, 50, 100, 200, 500, 1000];

export function calculateStats(
  results: RequestResult[],
  totalTimeMs: number,
): BenchmarkStats {
  const succeeded = results.filter((r) => !r.error);
  const failed = results.filter((r) => !!r.error);
  const totalBytes = results.reduce((sum, r) => sum + r.bytes, 0);
  const timeSec = totalTimeMs / 1000;

  const latency = calculateLatency(succeeded.map((r) => r.latency));
  const histogram = succeeded.length > 0
    ? buildHistogram(succeeded.map((r) => r.latency))
    : [];

  const statusCodes: Record<number, number> = {};
  for (const r of results) {
    if (r.status > 0) {
      statusCodes[r.status] = (statusCodes[r.status] ?? 0) + 1;
    }
  }

  const errors: Record<string, number> = {};
  for (const r of failed) {
    if (r.error) {
      errors[r.error] = (errors[r.error] ?? 0) + 1;
    }
  }

  return {
    totalRequests: results.length,
    succeeded: succeeded.length,
    failed: failed.length,
    totalTimeMs,
    requestsPerSec: timeSec > 0 ? results.length / timeSec : 0,
    bytesPerSec: timeSec > 0 ? totalBytes / timeSec : 0,
    totalBytes,
    latency,
    statusCodes,
    errors,
    histogram,
  };
}

function calculateLatency(values: number[]): LatencyStats {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, p90: 0, p95: 0, p99: 0, stdev: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const varianceSum = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  const stdev = n <= 1 ? 0 : Math.sqrt(varianceSum / n);

  return {
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    median: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    stdev,
  };
}

function percentile(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const idx = Math.ceil((p / 100) * n) - 1;
  return sorted[Math.max(0, idx)];
}

function buildHistogram(latencies: number[]): HistogramBucket[] {
  const max = Math.max(...latencies);
  const boundaries = DEFAULT_BOUNDARIES.filter((b) => b < max);
  boundaries.push(max + 1);

  const buckets: HistogramBucket[] = [];
  let prevBound = 0;

  for (let i = 0; i < boundaries.length; i++) {
    const bound = boundaries[i];
    const isLast = i === boundaries.length - 1;
    const count = latencies.filter(
      (v) => v >= prevBound && (isLast ? true : v < bound),
    ).length;

    if (count > 0 || !isLast) {
      buckets.push({
        rangeStart: prevBound,
        rangeEnd: isLast ? -1 : bound,
        count,
        percentage: (count / latencies.length) * 100,
        label: isLast
          ? `${formatBound(prevBound)}+`
          : `${formatBound(prevBound)}-${formatBound(bound)}`,
      });
    }
    prevBound = bound;
  }

  return buckets.filter((b) => b.count > 0);
}

function formatBound(ms: number): string {
  if (ms >= 1000) return `${ms / 1000}s`;
  return `${ms}ms`;
}
