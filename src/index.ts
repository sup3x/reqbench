import { program } from 'commander';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { runBenchmark } from './core/runner.js';
import { calculateStats } from './core/stats.js';
import { parseDuration } from './core/duration.js';
import { ProgressBar } from './output/progress.js';
import { renderSummary } from './output/summary.js';
import { formatJsonExport } from './output/json-export.js';
import { error, bold, cyan } from './utils/colors.js';
import type { BenchmarkConfig, HttpMethod } from './types.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const VALID_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

function parseHeaders(raw: string[]): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const h of raw) {
    const colonIdx = h.indexOf(':');
    if (colonIdx === -1) {
      fail(`Invalid header "${h}". Format: Key: Value`);
    }
    const key = h.slice(0, colonIdx).trim();
    const value = h.slice(colonIdx + 1).trim();
    headers[key] = value;
  }
  return headers;
}

function resolveBody(input: string): string {
  if (input.startsWith('@')) {
    const filePath = path.resolve(process.cwd(), input.slice(1));
    if (!fs.existsSync(filePath)) {
      fail(`File not found: ${filePath}`);
    }
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_BODY_SIZE) {
      fail(`File too large: ${filePath} (${stat.size} bytes, max 10MB)`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  }
  return input;
}

function fail(message: string): never {
  process.stderr.write(`\n  ${error('✖')} ${message}\n\n`);
  process.exit(1);
}

program
  .name('reqbench')
  .description('Simple, beautiful API load testing from the terminal')
  .version(pkg.version, '-V, --version')
  .argument('<url>', 'Target URL')
  .option('-n, --requests <count>', 'Total number of requests', '100')
  .option('-c, --concurrency <count>', 'Concurrent connections', '10')
  .option('-d, --duration <time>', 'Run for duration (10s, 1m, 500ms)')
  .option('-m, --method <method>', 'HTTP method', 'GET')
  .option('-b, --body <data>', 'Request body (string or @filename)')
  .option('-H, --header <header...>', 'HTTP header (repeatable)')
  .option('-t, --timeout <time>', 'Request timeout', '10s')
  .option('-o, --output <file>', 'Export results to JSON file')
  .option('-q, --quiet', 'Only show summary (no progress bar)')
  .option('--no-color', 'Disable colored output')
  .action(async (url: string, opts: Record<string, unknown>) => {
    try {
      // Validate URL
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          fail(`Invalid URL. Only http:// and https:// are supported.`);
        }
      } catch {
        fail(`Invalid URL. Example: reqbench https://api.example.com/users`);
      }

      // Validate method
      const method = (opts.method as string).toUpperCase();
      if (!VALID_METHODS.includes(method)) {
        fail(`Invalid method "${method}". Use: ${VALID_METHODS.join(', ')}`);
      }

      // Parse options
      const requests = parseInt(opts.requests as string, 10);
      const concurrency = parseInt(opts.concurrency as string, 10);
      const timeout = parseDuration(opts.timeout as string);

      if (isNaN(requests) || requests < 1) fail('--requests must be >= 1');
      if (isNaN(concurrency) || concurrency < 1) fail('--concurrency must be >= 1');
      if (timeout < 100) fail('--timeout must be >= 100ms');

      let duration: number | undefined;
      if (opts.duration) {
        duration = parseDuration(opts.duration as string);
        if (duration < 100) fail('--duration must be >= 100ms');
      }

      const headers = parseHeaders((opts.header as string[]) ?? []);
      const body = opts.body ? resolveBody(opts.body as string) : undefined;

      const config: BenchmarkConfig = {
        url,
        method: method as HttpMethod,
        headers,
        body,
        requests,
        concurrency,
        timeout,
        duration,
      };

      // Print header
      process.stderr.write(`\n  ${bold('reqbench')} ${cyan('—')} ${url}\n\n`);

      if (duration) {
        process.stderr.write(`  Running for ${opts.duration} with ${concurrency} concurrent connections...\n\n`);
      } else {
        process.stderr.write(`  Running ${requests} requests with ${concurrency} concurrent connections...\n\n`);
      }

      // Setup abort for Ctrl+C
      const ac = new AbortController();
      let aborted = false;
      process.on('SIGINT', () => {
        if (aborted) process.exit(1);
        aborted = true;
        ac.abort();
      });

      // Run benchmark
      const progressBar = new ProgressBar(!!opts.quiet);
      const startTime = performance.now();

      const results = await runBenchmark(config, (update) => {
        progressBar.update(update);
      }, ac.signal);

      progressBar.clear();

      const totalTimeMs = performance.now() - startTime;
      const stats = calculateStats(results, totalTimeMs);

      // Render summary
      const summary = renderSummary(stats, url);
      process.stderr.write(summary);

      // JSON export
      if (opts.output) {
        const json = formatJsonExport(config, stats);
        fs.writeFileSync(opts.output as string, json + '\n');
        process.stderr.write(`  Exported to ${opts.output}\n\n`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Invalid duration')) {
        fail(err.message);
      }
      fail(err instanceof Error ? err.message : String(err));
    }
  });

program.parse();
