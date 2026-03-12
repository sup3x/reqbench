import { success, error, warn, dim, bold } from '../utils/colors.js';
import { formatMs, formatNumber, formatPercent } from '../utils/format.js';
import { renderHistogram } from './histogram.js';
import type { BenchmarkStats } from '../types.js';

const DIVIDER = dim('  ' + '\u2500'.repeat(50));

export function renderSummary(stats: BenchmarkStats, url: string): string {
  const lines: string[] = [];
  lines.push('');
  lines.push(DIVIDER);
  lines.push(bold('  Summary'));
  lines.push(DIVIDER);
  lines.push('');
  lines.push(`  Total Requests    ${formatNumber(stats.totalRequests)}`);
  lines.push(`  Succeeded         ${success(String(stats.succeeded))}          ${dim(`(${formatPercent((stats.succeeded / stats.totalRequests) * 100)})`)}`);
  if (stats.failed > 0) {
    lines.push(`  Failed            ${error(String(stats.failed))}          ${dim(`(${formatPercent((stats.failed / stats.totalRequests) * 100)})`)}`);
  }
  lines.push(`  Total Time        ${formatMs(stats.totalTimeMs)}`);
  lines.push(`  Requests/sec      ${bold(formatNumber(stats.requestsPerSec))}`);

  if (stats.succeeded > 0) {
    lines.push('');
    lines.push(DIVIDER);
    lines.push(bold('  Latency'));
    lines.push(DIVIDER);
    lines.push('');
    const l = stats.latency;
    const p99Warning = l.p99 > 1000;
    lines.push(`  Min               ${formatMs(l.min)}`);
    lines.push(`  Max               ${formatMs(l.max)}`);
    lines.push(`  Mean              ${formatMs(l.mean)}`);
    lines.push(`  Median (p50)      ${formatMs(l.median)}`);
    lines.push(`  p90               ${formatMs(l.p90)}`);
    lines.push(`  p95               ${formatMs(l.p95)}`);
    lines.push(`  p99               ${p99Warning ? warn(formatMs(l.p99)) : formatMs(l.p99)}`);
  }

  const codes = Object.entries(stats.statusCodes).sort(([a], [b]) => Number(a) - Number(b));
  if (codes.length > 0) {
    lines.push('');
    lines.push(DIVIDER);
    lines.push(bold('  Status Codes'));
    lines.push(DIVIDER);
    lines.push('');
    const maxCodeCount = Math.max(...codes.map(([, c]) => c));
    for (const [code, count] of codes) {
      const codeNum = Number(code);
      const barLen = Math.max(1, Math.round((count / maxCodeCount) * 20));
      const bar = '\u2588'.repeat(barLen);
      const coloredCode = codeNum < 400 ? success(code) : codeNum < 500 ? warn(code) : error(code);
      const coloredBar = codeNum < 400 ? success(bar) : codeNum < 500 ? warn(bar) : error(bar);
      lines.push(`  ${coloredCode}               ${String(count).padStart(5)}  ${coloredBar}`);
    }
  }

  if (Object.keys(stats.errors).length > 0) {
    lines.push('');
    lines.push(DIVIDER);
    lines.push(bold('  Errors'));
    lines.push(DIVIDER);
    lines.push('');
    for (const [errType, count] of Object.entries(stats.errors)) {
      lines.push(`  ${error(errType)}    ${count}`);
    }
  }

  if (stats.histogram.length > 0) {
    lines.push('');
    lines.push(DIVIDER);
    lines.push(bold('  Latency Distribution'));
    lines.push(DIVIDER);
    lines.push('');
    lines.push(...renderHistogram(stats.histogram));
  }

  lines.push('');
  return lines.join('\n');
}
