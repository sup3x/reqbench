import { describe, it, expect } from 'vitest';
import { formatProgressLine } from '../../src/output/progress.js';

describe('formatProgressLine', () => {
  it('formats count mode progress', () => {
    const line = formatProgressLine({ completed: 50, total: 100, elapsed: 2000, currentRps: 25 });
    expect(line).toContain('50/100');
    expect(line).toContain('50%');
    expect(line).toContain('2.0');
  });
  it('formats duration mode progress', () => {
    const line = formatProgressLine({ completed: 30, total: -1, elapsed: 5000, currentRps: 6 });
    expect(line).toContain('30');
    expect(line).toContain('5.0');
    expect(line).not.toContain('%');
  });
  it('handles zero completion', () => {
    const line = formatProgressLine({ completed: 0, total: 100, elapsed: 0, currentRps: 0 });
    expect(line).toContain('0/100');
    expect(line).toContain('0%');
  });
  it('handles 100% completion', () => {
    const line = formatProgressLine({ completed: 100, total: 100, elapsed: 5000, currentRps: 20 });
    expect(line).toContain('100/100');
    expect(line).toContain('100%');
  });
});
