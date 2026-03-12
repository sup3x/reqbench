import { request } from 'undici';
import type { BenchmarkConfig, RequestResult } from '../types.js';

export async function executeRequest(config: BenchmarkConfig): Promise<RequestResult> {
  const start = performance.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), config.timeout);

  try {
    const response = await request(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body,
      signal: ac.signal,
    });

    const chunks: Buffer[] = [];
    for await (const chunk of response.body) {
      chunks.push(Buffer.from(chunk));
    }
    const bodyBytes = chunks.reduce((sum, c) => sum + c.length, 0);

    clearTimeout(timer);

    return {
      status: response.statusCode,
      latency: performance.now() - start,
      bytes: bodyBytes,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const latency = performance.now() - start;
    const message = err instanceof Error ? err.message : String(err);

    let errorType = message;
    if (message.includes('ECONNREFUSED')) errorType = 'ECONNREFUSED';
    else if (message.includes('ENOTFOUND')) errorType = 'ENOTFOUND';
    else if (message.includes('ETIMEDOUT')) errorType = 'ETIMEDOUT';
    else if (message.includes('abort') || message.includes('Abort')) errorType = 'TIMEOUT';
    else if (message.includes('ECONNRESET')) errorType = 'ECONNRESET';

    return {
      status: 0,
      latency,
      bytes: 0,
      error: errorType,
    };
  }
}
