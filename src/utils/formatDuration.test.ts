import { describe, expect, it } from 'vitest';
import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it.each([
    [0, '00:00'],
    [5, '00:05'],
    [65, '01:05'],
    [599, '09:59'],
    [3599, '59:59'],
    [3600, '60:00'],
  ])('formatea %i segundos como %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });

  it('trata los valores negativos como 0', () => {
    expect(formatDuration(-5)).toBe('00:00');
  });

  it('trunca los segundos fraccionarios', () => {
    expect(formatDuration(65.9)).toBe('01:05');
  });
});
