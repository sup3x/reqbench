export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface BenchmarkConfig {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  requests: number;
  concurrency: number;
  timeout: number;
  duration?: number;
}

export interface RequestResult {
  status: number;
  latency: number;
  bytes: number;
  error?: string;
}

export interface BenchmarkStats {
  totalRequests: number;
  succeeded: number;
  failed: number;
  totalTimeMs: number;
  requestsPerSec: number;
  bytesPerSec: number;
  totalBytes: number;
  latency: LatencyStats;
  statusCodes: Record<number, number>;
  errors: Record<string, number>;
  histogram: HistogramBucket[];
}

export interface LatencyStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  p90: number;
  p95: number;
  p99: number;
  stdev: number;
}

export interface HistogramBucket {
  rangeStart: number;
  rangeEnd: number;
  count: number;
  percentage: number;
  label: string;
}

export interface ProgressUpdate {
  completed: number;
  total: number;
  elapsed: number;
  currentRps: number;
}

export interface JsonExport {
  url: string;
  method: string;
  config: {
    requests: number;
    concurrency: number;
    timeout: number;
  };
  stats: BenchmarkStats;
  timestamp: string;
  version: string;
}
