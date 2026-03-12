import { describe, it, expect } from 'vitest';
import http from 'node:http';
import { runBenchmark } from '../../src/core/runner.js';
import type { BenchmarkConfig } from '../../src/types.js';

function makeConfig(port: number, overrides: Partial<BenchmarkConfig> = {}): BenchmarkConfig {
  return {
    url: `http://localhost:${port}/ok`,
    method: 'GET',
    headers: {},
    requests: 10,
    concurrency: 2,
    timeout: 5000,
    ...overrides,
  };
}

function createTestServer(): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200);
      res.end('ok');
    });
    server.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      resolve({ server, port });
    });
  });
}

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

describe('runBenchmark', () => {
  it('completes count mode with correct number of requests', async () => {
    const { server, port } = await createTestServer();
    try {
      const results = await runBenchmark(makeConfig(port, { requests: 20, concurrency: 5 }));
      expect(results.length).toBe(20);
      expect(results.every((r) => r.status === 200)).toBe(true);
    } finally {
      await closeServer(server);
    }
  });

  it('fires progress callback', async () => {
    const { server, port } = await createTestServer();
    try {
      const updates: number[] = [];
      await runBenchmark(makeConfig(port, { requests: 10 }), (update) => {
        updates.push(update.completed);
      });
      expect(updates.length).toBe(10);
      expect(updates[updates.length - 1]).toBe(10);
    } finally {
      await closeServer(server);
    }
  });

  it('respects concurrency limit', async () => {
    let maxConcurrent = 0;
    let current = 0;

    const server = http.createServer((_req, res) => {
      current++;
      if (current > maxConcurrent) maxConcurrent = current;
      setTimeout(() => {
        current--;
        res.writeHead(200);
        res.end('ok');
      }, 50);
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    try {
      await runBenchmark(makeConfig(port, { requests: 20, concurrency: 3 }));
      expect(maxConcurrent).toBeLessThanOrEqual(3);
    } finally {
      await closeServer(server);
    }
  });

  it('handles duration mode', async () => {
    const { server, port } = await createTestServer();
    try {
      const start = Date.now();
      const results = await runBenchmark(
        makeConfig(port, { duration: 1000, concurrency: 2 }),
      );
      const elapsed = Date.now() - start;
      expect(results.length).toBeGreaterThan(0);
      expect(elapsed).toBeGreaterThanOrEqual(900);
      expect(elapsed).toBeLessThan(3000);
    } finally {
      await closeServer(server);
    }
  });

  it('supports abort signal', async () => {
    const { server, port } = await createTestServer();
    try {
      const ac = new AbortController();
      setTimeout(() => ac.abort(), 200);
      const results = await runBenchmark(
        makeConfig(port, { requests: 10000, concurrency: 2 }),
        undefined,
        ac.signal,
      );
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThan(10000);
    } finally {
      await closeServer(server);
    }
  });
});
