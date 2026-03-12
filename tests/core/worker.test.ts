import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { executeRequest } from '../../src/core/worker.js';
import type { BenchmarkConfig } from '../../src/types.js';

function makeConfig(overrides: Partial<BenchmarkConfig> = {}): BenchmarkConfig {
  return {
    url: 'http://localhost:0',
    method: 'GET',
    headers: {},
    requests: 1,
    concurrency: 1,
    timeout: 5000,
    ...overrides,
  };
}

describe('executeRequest', () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/ok') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('hello');
      } else if (req.url === '/slow') {
        setTimeout(() => { res.writeHead(200); res.end('slow'); }, 3000);
      } else if (req.url === '/post') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: body }));
        });
      } else {
        res.writeHead(404);
        res.end('not found');
      }
    });
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as { port: number }).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('returns successful result for 200', async () => {
    const result = await executeRequest(makeConfig({ url: `http://localhost:${port}/ok` }));
    expect(result.status).toBe(200);
    expect(result.latency).toBeGreaterThan(0);
    expect(result.bytes).toBeGreaterThan(0);
    expect(result.error).toBeUndefined();
  });

  it('returns status for non-200 responses', async () => {
    const result = await executeRequest(makeConfig({ url: `http://localhost:${port}/missing` }));
    expect(result.status).toBe(404);
    expect(result.error).toBeUndefined();
  });

  it('returns error on timeout', async () => {
    const result = await executeRequest(
      makeConfig({ url: `http://localhost:${port}/slow`, timeout: 100 }),
    );
    expect(result.status).toBe(0);
    expect(result.error).toBeDefined();
  });

  it('returns error on connection refused', async () => {
    const result = await executeRequest(makeConfig({ url: 'http://localhost:1' }));
    expect(result.status).toBe(0);
    expect(result.error).toBeDefined();
  });

  it('sends POST body correctly', async () => {
    const result = await executeRequest(
      makeConfig({
        url: `http://localhost:${port}/post`,
        method: 'POST',
        body: '{"test":true}',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(result.status).toBe(200);
    expect(result.bytes).toBeGreaterThan(0);
  });
});
