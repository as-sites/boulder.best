import { describe, expect, it } from 'vitest';
import {
  withResolvedGymName,
  type LoadedSessionDetail,
} from '../../src/history/load-session-detail.js';

const localDetail = (gymId: string, gymName: string): LoadedSessionDetail => ({
  source: 'local',
  session: {
    id: 'local-1',
    gymId,
    gymName,
    startTime: '2026-05-22T10:00:00.000Z',
    endTime: '2026-05-22T11:00:00.000Z',
    totalDurationMs: 3_600_000,
    entries: [],
    notes: '',
  },
});

describe(withResolvedGymName, () => {
  it('leaves server sessions unchanged', () => {
    const detail: LoadedSessionDetail = {
      source: 'server',
      session: {
        id: 'server-1',
        gymId: 'gym-1',
        gymName: 'Cloud Gym',
        startTime: '2026-05-20T12:00:00.000Z',
        endTime: '2026-05-20T13:00:00.000Z',
        totalDurationMs: 3_600_000,
        entries: [],
        notes: '',
      },
    };

    expect(withResolvedGymName(detail, { 'gym-1': 'Renamed Gym' })).toBe(
      detail,
    );
  });

  it('replaces Unknown gym when gyms cache loads', () => {
    const detail = localDetail('gym-1', 'Unknown gym');

    expect(
      withResolvedGymName(detail, { 'gym-1': 'Boulder World' }).session.gymName,
    ).toBe('Boulder World');
  });

  it('returns the same object when the name is already correct', () => {
    const detail = localDetail('gym-1', 'Boulder World');

    expect(withResolvedGymName(detail, { 'gym-1': 'Boulder World' })).toBe(
      detail,
    );
  });
});
