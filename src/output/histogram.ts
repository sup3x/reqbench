import { c } from '../utils/colors.js';
import type { HistogramBucket } from '../types.js';

const MAX_BAR_WIDTH = 30;
const FILLED = '\u2588';

export function renderHistogram(buckets: HistogramBucket[], width?: number): string[] {
  if (buckets.length === 0) return [];
  const maxCount = Math.max(...buckets.map((b) => b.count));
  const maxLabelLen = Math.max(...buckets.map((b) => b.label.length));
  const barWidth = width ?? MAX_BAR_WIDTH;

  return buckets.map((bucket) => {
    const barLen = maxCount > 0
      ? Math.max(1, Math.round((bucket.count / maxCount) * barWidth))
      : 0;
    const bar = FILLED.repeat(barLen);
    const label = bucket.label.padEnd(maxLabelLen);
    const count = String(bucket.count).padStart(6);
    const pct = `(${bucket.percentage.toFixed(1)}%)`;
    const coloredBar = bucket.rangeStart >= 500 ? c.red(bar) : bucket.rangeStart >= 100 ? c.yellow(bar) : c.green(bar);
    return `  ${label}  ${coloredBar}  ${count} ${pct}`;
  });
}
