import { describe, expect, it } from 'vitest';
import { formatDurationMs } from '../../src/lib/timer/index.js';

describe(formatDurationMs, () => {
  it('formats sub-hour durations as M:SS', () => {
    expect(formatDurationMs(0)).toBe('0:00');
    expect(formatDurationMs(65_000)).toBe('1:05');
    expect(formatDurationMs(359_000)).toBe('5:59');
  });

  it('formats hour-plus durations as H:MM:SS', () => {
    expect(formatDurationMs(3_600_000)).toBe('1:00:00');
    expect(formatDurationMs(3_661_000)).toBe('1:01:01');
  });

  it('clamps negative values to zero', () => {
    expect(formatDurationMs(-1000)).toBe('0:00');
  });

  it('optionally formats with millisecond precision', () => {
    expect(formatDurationMs(65_123, { showMilliseconds: true })).toBe(
      '1:05.123',
    );
    expect(formatDurationMs(3_661_007, { showMilliseconds: true })).toBe(
      '1:01:01.007',
    );
    expect(formatDurationMs(-5, { showMilliseconds: true })).toBe('0:00.000');
  });
});
