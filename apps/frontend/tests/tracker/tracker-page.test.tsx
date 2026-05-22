import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect, useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { SessionFormValues } from '../../src/offline/db/types.js';
import { TrackerPage } from '../../src/pages/tracker.js';
import { createEmptySessionForm } from '../../src/tracker/session-form-state.js';

const trackerMocks = vi.hoisted(() => ({
  finalizeStoppedSession: vi.fn(),
  restoreActiveDraft: vi.fn(),
}));

vi.mock(import('../../src/offline/index.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  finalizeStoppedSession: trackerMocks.finalizeStoppedSession,
  restoreActiveDraft: trackerMocks.restoreActiveDraft,
}));

vi.mock(import('../../src/tracker/session-form.js'), () => ({
  SessionForm: ({
    initialValues,
    onStopped,
  }: {
    initialValues: SessionFormValues;
    onStopped?: (values: SessionFormValues) => void;
  }) => {
    const [status, setStatus] = useState(initialValues.status);
    const [sessionId, setSessionId] = useState(initialValues.id);

    useEffect(() => {
      setStatus(initialValues.status);
      setSessionId(initialValues.id);
    }, [initialValues.id, initialValues.status]);

    return (
      <div>
        <p data-testid="mock-session-status">{status}</p>
        <p data-testid="mock-session-id">{sessionId}</p>
        <button
          onClick={() => {
            const stoppedSession = {
              ...initialValues,
              gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
              location: 'Main Wall',
              startTime: '2026-05-20T10:00:00.000Z',
              endTime: '2026-05-20T11:00:00.000Z',
              totalDurationMs: 3_600_000,
              status: 'stopped',
            } satisfies SessionFormValues;

            setStatus('stopped');
            onStopped?.(stoppedSession);
          }}
          type="button"
        >
          Stop session
        </button>
      </div>
    );
  },
}));

describe('tracker page finalization flow', () => {
  beforeEach(() => {
    trackerMocks.finalizeStoppedSession.mockReset();
    trackerMocks.restoreActiveDraft.mockReset();
  });

  it('resets to a fresh tracker state after finalizing a stopped session', async () => {
    const activeSession = {
      ...createEmptySessionForm(),
      gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
      location: 'Main Wall',
      startTime: '2026-05-20T10:00:00.000Z',
      status: 'active',
    } satisfies SessionFormValues;

    trackerMocks.restoreActiveDraft
      .mockResolvedValueOnce({
        id: 'active',
        formData: activeSession,
        lastSavedAt: Date.now(),
      })
      .mockResolvedValueOnce(undefined);
    trackerMocks.finalizeStoppedSession.mockResolvedValue({
      id: activeSession.id,
      sessionId: activeSession.id,
      payload: {
        id: activeSession.id,
        gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
        startTime: '2026-05-20T10:00:00.000Z',
        endTime: '2026-05-20T11:00:00.000Z',
        totalDurationMs: 3_600_000,
        entries: [],
      },
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    render(
      <MantineProvider>
        <TrackerPage />
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-session-status')).toHaveTextContent(
        'active',
      );
    });

    const sessionIdBeforeFinalize =
      screen.getByTestId('mock-session-id').textContent;

    fireEvent.click(screen.getByRole('button', { name: /stop session/i }));

    await waitFor(() => {
      expect(trackerMocks.finalizeStoppedSession).toHaveBeenCalledOnce();
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-session-status')).toHaveTextContent(
        'not_started',
      );
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('mock-session-id').textContent).not.toBe(
      sessionIdBeforeFinalize,
    );
    expect(trackerMocks.restoreActiveDraft).toHaveBeenCalledTimes(2);
  });

  it('preserves the stopped tracker state and shows an error when finalization fails', async () => {
    const activeSession = {
      ...createEmptySessionForm(),
      gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
      location: 'Main Wall',
      startTime: '2026-05-20T10:00:00.000Z',
      status: 'active',
    } satisfies SessionFormValues;

    trackerMocks.restoreActiveDraft.mockResolvedValue({
      id: 'active',
      formData: activeSession,
      lastSavedAt: Date.now(),
    });
    trackerMocks.finalizeStoppedSession.mockRejectedValue(
      new Error('Unable to finalize session right now'),
    );

    render(
      <MantineProvider>
        <TrackerPage />
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-session-status')).toHaveTextContent(
        'active',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /stop session/i }));

    await waitFor(() => {
      expect(screen.getByTestId('mock-session-status')).toHaveTextContent(
        'stopped',
      );
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Unable to finalize session right now',
      );
    });
    expect(trackerMocks.restoreActiveDraft).toHaveBeenCalledOnce();
  });
});
