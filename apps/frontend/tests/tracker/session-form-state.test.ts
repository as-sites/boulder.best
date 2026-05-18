import { describe, expect, it } from 'vitest';
import {
  createEmptySessionForm,
  sessionDisplayTimer,
  startSession,
  stopSession,
} from '../../src/tracker/session-form-state.js';

const fixedNow =
  (epochMs: number): (() => Temporal.Instant) =>
  () =>
    Temporal.Instant.fromEpochMilliseconds(epochMs);

describe('session form state', () => {
  it('creates a not-started session with a generated id', () => {
    const form = createEmptySessionForm();

    expect(form.status).toBe('not_started');
    expect(form.gymId).toBeNull();
    expect(form.entries).toEqual([]);
    expect(form.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('starts a session with gym selected and records startTime', () => {
    const form = {
      ...createEmptySessionForm(),
      gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
    };

    const started = startSession(form, fixedNow(1000));

    expect(started.status).toBe('active');
    expect(started.startTime).toBe(
      Temporal.Instant.fromEpochMilliseconds(1000).toString(),
    );
    expect(started.endTime).toBeNull();
  });

  it('requires a gym before starting', () => {
    expect(() => startSession(createEmptySessionForm(), fixedNow(0))).toThrow(
      'Select a gym before starting the session',
    );
  });

  it('stops an active session with final timestamps and duration', () => {
    const started = startSession(
      {
        ...createEmptySessionForm(),
        gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
      },
      fixedNow(0),
    );

    const stopped = stopSession(started, fixedNow(125_000));

    expect(stopped.status).toBe('stopped');
    expect(stopped.endTime).toBe(
      Temporal.Instant.fromEpochMilliseconds(125_000).toString(),
    );
    expect(stopped.totalDurationMs).toBe(125_000);
  });

  it('derives a running display timer while active', () => {
    const timer = sessionDisplayTimer({
      status: 'active',
      startTime: Temporal.Instant.fromEpochMilliseconds(0).toString(),
      totalDurationMs: 0,
    });

    expect(timer.status).toBe('running');
    expect(timer.activeStartTime).not.toBeNull();
  });
});
