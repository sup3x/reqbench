import { executeRequest } from './worker.js';
import type { BenchmarkConfig, RequestResult, ProgressUpdate } from '../types.js';

export async function runBenchmark(
  config: BenchmarkConfig,
  onProgress?: (update: ProgressUpdate) => void,
  signal?: AbortSignal,
): Promise<RequestResult[]> {
  const results: RequestResult[] = [];
  const startTime = performance.now();
  const isDurationMode = config.duration !== undefined && config.duration > 0;
  const effectiveConcurrency = isDurationMode
    ? config.concurrency
    : Math.min(config.concurrency, config.requests);

  let completed = 0;
  let requestIndex = 0;
  const inFlight = new Set<Promise<void>>();

  function shouldContinue(): boolean {
    if (signal?.aborted) return false;
    if (isDurationMode) {
      return (performance.now() - startTime) < config.duration!;
    }
    return requestIndex < config.requests;
  }

  function emitProgress(): void {
    if (!onProgress) return;
    const elapsed = performance.now() - startTime;
    const elapsedSec = elapsed / 1000;
    onProgress({
      completed,
      total: isDurationMode ? -1 : config.requests,
      elapsed,
      currentRps: elapsedSec > 0 ? completed / elapsedSec : 0,
    });
  }

  function startRequest(): Promise<void> {
    requestIndex++;
    const p = executeRequest(config).then((result) => {
      results.push(result);
      completed++;
      inFlight.delete(p);
      emitProgress();
    });
    inFlight.add(p);
    return p;
  }

  // Fill initial slots
  for (let i = 0; i < effectiveConcurrency && shouldContinue(); i++) {
    startRequest();
  }

  // Semaphore: when one completes, start another
  while (inFlight.size > 0) {
    await Promise.race(inFlight);
    if (signal?.aborted) break;
    while (inFlight.size < effectiveConcurrency && shouldContinue()) {
      startRequest();
    }
  }

  // Grace period: if aborted, wait max 3s for remaining in-flight requests
  if (signal?.aborted && inFlight.size > 0) {
    await Promise.race([
      Promise.all(inFlight),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  }

  return results;
}
