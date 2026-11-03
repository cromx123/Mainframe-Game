import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import { formatDuration, formatNumber } from './format';

describe('formatNumber', () => {
  it('shows one decimal below 10 and none up to 999', () => {
    expect(formatNumber(0)).toBe('0.0');
    expect(formatNumber(2.5)).toBe('2.5');
    expect(formatNumber(25)).toBe('25');
    expect(formatNumber(999.9)).toBe('999');
  });

  it('uses suffixes and floors instead of rounding up', () => {
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(999_999)).toBe('999.9K');
    expect(formatNumber(2_500_000)).toBe('2.5M');
    expect(formatNumber(new Decimal('3.7e12'))).toBe('3.7T');
  });

  it('honours the decimals argument', () => {
    expect(formatNumber(1350, 0)).toBe('1K');
    expect(formatNumber(4.56, 0)).toBe('4');
  });

  it('switches to scientific notation past the suffix table', () => {
    expect(formatNumber(new Decimal('1.234e40'))).toMatch(/^1\.23e40$/);
  });

  it('handles negatives', () => {
    expect(formatNumber(-1500)).toBe('-1.5K');
  });
});

describe('formatDuration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(125)).toBe('2m 05s');
    expect(formatDuration(3720)).toBe('1h 02m');
  });
});
