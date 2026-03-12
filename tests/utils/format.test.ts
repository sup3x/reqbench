import { describe, it, expect } from 'vitest';
import { formatMs, formatBytes, formatNumber, formatPercent } from '../../src/utils/format.js';

describe('formatMs', () => {
  it('formats milliseconds', () => { expect(formatMs(42)).toBe('42ms'); });
  it('formats seconds', () => { expect(formatMs(1500)).toBe('1.50s'); });
  it('formats minutes', () => { expect(formatMs(90000)).toBe('1.50m'); });
  it('formats sub-millisecond', () => { expect(formatMs(0.5)).toBe('0ms'); });
  it('formats zero', () => { expect(formatMs(0)).toBe('0ms'); });
});

describe('formatBytes', () => {
  it('formats bytes', () => { expect(formatBytes(500)).toBe('500 B'); });
  it('formats kilobytes', () => { expect(formatBytes(1536)).toBe('1.50 KB'); });
  it('formats megabytes', () => { expect(formatBytes(1572864)).toBe('1.50 MB'); });
  it('formats zero', () => { expect(formatBytes(0)).toBe('0 B'); });
});

describe('formatNumber', () => {
  it('formats integer', () => { expect(formatNumber(42)).toBe('42'); });
  it('formats decimal', () => { expect(formatNumber(3.14159)).toBe('3.14'); });
  it('formats large number', () => { expect(formatNumber(1000)).toBe('1,000'); });
  it('formats zero', () => { expect(formatNumber(0)).toBe('0'); });
});

describe('formatPercent', () => {
  it('formats percentage', () => { expect(formatPercent(99.4)).toBe('99.4%'); });
  it('formats 100%', () => { expect(formatPercent(100)).toBe('100.0%'); });
  it('formats 0%', () => { expect(formatPercent(0)).toBe('0.0%'); });
});
