import type { ProgressUpdate } from '../types.js';

const BAR_WIDTH = 30;
const FILLED = '\u2588';
const EMPTY = '\u2591';

export function formatProgressLine(update: ProgressUpdate): string {
  const { completed, total, elapsed, currentRps } = update;
  const isDurationMode = total === -1;
  const elapsedSec = (elapsed / 1000).toFixed(1);
  const rps = Math.round(currentRps);

  if (isDurationMode) {
    return `  ${completed} reqs  elapsed: ${elapsedSec}s  rps: ${rps}`;
  }

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const filled = total > 0 ? Math.round((completed / total) * BAR_WIDTH) : 0;
  const bar = FILLED.repeat(filled) + EMPTY.repeat(BAR_WIDTH - filled);
  return `  ${bar}  ${completed}/${total} (${pct}%)  elapsed: ${elapsedSec}s  rps: ${rps}`;
}

export class ProgressBar {
  private active = false;
  constructor(private quiet: boolean = false) {
    if (quiet || !process.stderr.isTTY) { this.active = false; } else { this.active = true; }
  }
  update(progress: ProgressUpdate): void {
    if (!this.active) return;
    process.stderr.write(`\r${formatProgressLine(progress)}`);
  }
  clear(): void {
    if (!this.active) return;
    process.stderr.write('\r' + ' '.repeat(80) + '\r');
  }
}
