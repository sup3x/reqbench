import { describe, it, expect } from 'vitest';
import { parseDuration } from '../../src/core/duration.js';

describe('parseDuration', () => {
  it('parses seconds', () => {
    expect(parseDuration('10s')).toBe(10000);
  });

  it('parses minutes', () => {
    expect(parseDuration('1m')).toBe(60000);
  });

  it('parses milliseconds', () => {
    expect(parseDuration('500ms')).toBe(500);
  });

  it('parses decimal seconds', () => {
    expect(parseDuration('1.5s')).toBe(1500);
  });

  it('parses decimal minutes', () => {
    expect(parseDuration('0.5m')).toBe(30000);
  });

  it('throws on invalid input', () => {
    expect(() => parseDuration('abc')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => parseDuration('')).toThrow();
  });

  it('throws on negative value', () => {
    expect(() => parseDuration('-5s')).toThrow();
  });

  it('throws on zero', () => {
    expect(() => parseDuration('0s')).toThrow();
  });

  it('throws on unknown unit', () => {
    expect(() => parseDuration('10h')).toThrow();
  });
});
