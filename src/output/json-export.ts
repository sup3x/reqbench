import { createRequire } from 'node:module';
import type { BenchmarkConfig, BenchmarkStats, JsonExport } from '../types.js';

const require = createRequire(import.meta.url);

function getVersion(): string {
  try {
    const pkg = require('../../package.json');
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export function formatJsonExport(config: BenchmarkConfig, stats: BenchmarkStats): string {
  const exported: JsonExport = {
    url: config.url,
    method: config.method,
    config: { requests: config.requests, concurrency: config.concurrency, timeout: config.timeout },
    stats,
    timestamp: new Date().toISOString(),
    version: getVersion(),
  };
  return JSON.stringify(exported, null, 2);
}
