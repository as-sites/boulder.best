import { describe, expect, it } from 'vitest';
import {
  formatDurationMs,
  parseDurationInput,
} from '../../src/lib/timer/index.js';

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

describe(parseDurationInput, () => {
  it('returns null for empty or whitespace input', () => {
    expect(parseDurationInput('')).toBeNull();
    expect(parseDurationInput('   ')).toBeNull();
  });

  it('parses seconds-only input', () => {
    expect(parseDurationInput('30')).toBe(30_000);
    expect(parseDurationInput('90')).toBe(90_000);
    expect(parseDurationInput('0')).toBe(0);
  });

  it('parses M:SS format', () => {
    expect(parseDurationInput('1:30')).toBe(90_000);
    expect(parseDurationInput('5:00')).toBe(300_000);
    expect(parseDurationInput('0:45')).toBe(45_000);
  });

  it('parses H:MM:SS format', () => {
    expect(parseDurationInput('1:00:00')).toBe(3_600_000);
    expect(parseDurationInput('1:30:30')).toBe(5_430_000);
  });

  it('returns null when seconds part exceeds 59', () => {
    expect(parseDurationInput('1:60')).toBeNull();
    expect(parseDurationInput('1:00:60')).toBeNull();
  });

  it('returns null when minutes part exceeds 59 in H:MM:SS', () => {
    expect(parseDurationInput('1:60:00')).toBeNull();
  });

  it('returns null for non-digit input', () => {
    expect(parseDurationInput('abc')).toBeNull();
    expect(parseDurationInput('1:ab')).toBeNull();
    expect(parseDurationInput('1.5')).toBeNull();
    expect(parseDurationInput('-1')).toBeNull();
  });

  it('returns null for too many colon-separated segments', () => {
    expect(parseDurationInput('1:00:00:00')).toBeNull();
  });
});
