import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatHistoryDateLabel } from '../../src/history/format-history-date-label.js';

describe(formatHistoryDateLabel, () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('labels today and yesterday relative to the provided now date', () => {
    const now = new Date('2026-05-22T15:00:00.000Z');

    expect(formatHistoryDateLabel('2026-05-22T10:00:00.000Z', now)).toBe(
      'Today',
    );
    expect(formatHistoryDateLabel('2026-05-21T12:00:00.000Z', now)).toBe(
      'Yesterday',
    );
  });

  it('uses an absolute date label for older sessions', () => {
    const now = new Date('2026-05-22T15:00:00.000Z');

    expect(formatHistoryDateLabel('2026-05-20T12:00:00.000Z', now)).toBe(
      'May 20, 2026',
    );
  });

  it('counts calendar days across a DST spring-forward boundary', () => {
    // US spring-forward 2026: Mar 8 at 2:00 AM. Compare Mar 7 vs Mar 9 using
    // local calendar days only — no 23h midnight gap miscount.
    const now = new Date('2026-03-09T12:00:00.000Z');

    expect(formatHistoryDateLabel('2026-03-08T12:00:00.000Z', now)).toBe(
      'Yesterday',
    );
  });
});
