import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Gym } from '@boulder/api-contract';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  createBreakEntry,
  createClimbAttempt,
  createClimbEntry,
} from '../../src/tracker/entry-factory.js';
import { createEmptySessionForm } from '../../src/tracker/session-form-state.js';
import { SessionForm } from '../../src/tracker/session-form.js';

const gymFixture = [
  {
    id: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
    name: 'Test Gym',
    grades: ['V0', 'V1', 'V2'],
    locations: ['Main Wall'],
    updatedAt: '2026-05-13T08:00:00.000Z',
  },
] as const satisfies Gym[];

const gymMocks = vi.hoisted(() => ({
  // oxlint-disable-next-line typescript/require-await, vitest/require-mock-type-parameters
  loadCachedGyms: vi.fn(async () => gymFixture),
}));

vi.mock(import('../../src/offline/gyms/gym-cache.js'), () => ({
  loadCachedGyms: gymMocks.loadCachedGyms,
  // oxlint-disable-next-line vitest/require-mock-type-parameters
  refreshCachedGymsFromApi: vi.fn(),
  // oxlint-disable-next-line vitest/require-mock-type-parameters
  fetchGymsFromApi: vi.fn(),
}));

const autosaveMocks = vi.hoisted(() => ({
  // oxlint-disable-next-line vitest/require-mock-type-parameters
  autosaveActiveDraft: vi.fn(),
}));

vi.mock(
  import('../../src/offline/draft/draft-autosave.js'),
  async (importOriginal) => ({
    ...(await importOriginal()),
    autosaveActiveDraft: autosaveMocks.autosaveActiveDraft,
  }),
);

const renderSessionForm = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <SessionForm initialValues={createEmptySessionForm()} />
      </MantineProvider>
    </QueryClientProvider>,
  );
};

describe(SessionForm, () => {
  beforeEach(() => {
    gymMocks.loadCachedGyms.mockResolvedValue(gymFixture);
    autosaveMocks.autosaveActiveDraft.mockResolvedValue({
      id: 'active-draft',
      lastSavedAt: Date.now(),
      formData: createEmptySessionForm(),
    });
  });

  it('disables start until a gym is selected', async () => {
    renderSessionForm();

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /start session/i }),
      ).toBeDefined(),
    );

    expect(
      screen.getByRole('button', { name: /start session/i }),
    ).toBeDisabled();

    const locationField = screen.getByRole('combobox', { name: /location/i });
    expect(locationField).toBeDisabled();
    expect(locationField).toHaveAttribute('placeholder', 'Select a gym first');
  });

  it('disables start until a location is selected when the gym has locations', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <SessionForm
            initialValues={{
              ...createEmptySessionForm(),
              gymId: gymFixture[0].id,
            }}
          />
        </MantineProvider>
      </QueryClientProvider>,
    );

    const startButton = screen.getByRole('button', { name: /start session/i });

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /location/i })).toBeDefined();
      expect(startButton).toBeDisabled();
    });

    fireEvent.click(screen.getByRole('combobox', { name: /location/i }));
    fireEvent.click(screen.getByText('Main Wall'));

    await waitFor(() => expect(startButton).not.toBeDisabled());
    expect(startButton).not.toBeDisabled();
  });

  // oxlint-disable-next-line typescript/require-await
  it('does not render a session-level timer in the form header', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <SessionForm
            initialValues={{
              ...createEmptySessionForm(),
              gymId: gymFixture[0].id,
              location: 'Main Wall',
              status: 'active',
              startTime: Temporal.Now.instant().toString(),
            }}
          />
        </MantineProvider>
      </QueryClientProvider>,
    );

    expect(screen.queryByLabelText('Active session duration')).toBeNull();
    expect(
      screen.getByRole('heading', { name: /session/i }),
    ).toBeInTheDocument();
  });

  it('autosaves pre-start gym and notes edits after debounce', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderSessionForm();

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /gym/i })).toBeDefined(),
    );

    autosaveMocks.autosaveActiveDraft.mockClear();

    fireEvent.click(screen.getByRole('combobox', { name: /gym/i }));
    fireEvent.click(screen.getByText('Test Gym'));

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(autosaveMocks.autosaveActiveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          gymId: gymFixture[0].id,
          status: 'not_started',
        }),
      );
    });

    autosaveMocks.autosaveActiveDraft.mockClear();

    fireEvent.change(screen.getByRole('textbox', { name: /session notes/i }), {
      target: { value: 'Finger warm-up' },
    });

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(autosaveMocks.autosaveActiveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Finger warm-up',
          status: 'not_started',
        }),
      );
    });

    vi.useRealTimers();
    expect(vi.isFakeTimers()).toBe(false);
  });

  it('starts and stops a session', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <SessionForm
            initialValues={{
              ...createEmptySessionForm(),
              gymId: gymFixture[0].id,
              location: 'Main Wall',
            }}
          />
        </MantineProvider>
      </QueryClientProvider>,
    );

    const startButton = screen.getByRole('button', { name: /start session/i });
    await waitFor(() => expect(startButton).not.toBeDisabled());
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(autosaveMocks.autosaveActiveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          startTime: expect.any(String),
          entries: [],
        }),
      );
    });

    const stopButton = screen.getByRole('button', { name: /stop session/i });
    await waitFor(() => expect(stopButton).not.toBeDisabled());
    fireEvent.click(stopButton);

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /start session/i }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('button', { name: /stop session/i }),
    ).not.toBeInTheDocument();
  });

  it('stops session after removing an attempt without losing timer state', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const onStopped = vi.fn();
    const climbEntry = {
      ...createClimbEntry(0, 'Climb 1'),
      climbAttempts: [createClimbAttempt(0), createClimbAttempt(1)],
    };

    render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <SessionForm
            initialValues={{
              ...createEmptySessionForm(),
              gymId: gymFixture[0].id,
              location: 'Main Wall',
              status: 'active',
              startTime: Temporal.Instant.fromEpochMilliseconds(0).toString(),
              entries: [climbEntry],
            }}
            onStopped={onStopped}
          />
        </MantineProvider>
      </QueryClientProvider>,
    );

    // Remove the first attempt — this is where timers were being dropped
    const removeButtons = screen.getAllByRole('button', {
      name: /remove attempt/i,
    });
    // oxlint-disable-next-line typescript/no-non-null-assertion
    fireEvent.click(removeButtons[0]!);

    // Stop the session — should not crash with missing timer fields
    const stopButton = screen.getByRole('button', { name: /stop session/i });
    await waitFor(() => expect(stopButton).not.toBeDisabled());
    fireEvent.click(stopButton);

    await waitFor(() =>
      expect(onStopped).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'stopped' }),
      ),
    );
    expect(screen.queryByText(/unable to stop session/i)).toBeNull();
  });

  // oxlint-disable-next-line typescript/require-await
  it('renders attempt timers without climb-level timer controls', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <SessionForm
            initialValues={{
              ...createEmptySessionForm(),
              gymId: gymFixture[0].id,
              location: 'Main Wall',
              status: 'active',
              startTime: Temporal.Now.instant().toString(),
              entries: [createClimbEntry(0, 'Climb 1')],
            }}
          />
        </MantineProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Attempt 1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Start' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(
      screen.getByRole('button', { name: 'Pause timer' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
  });

  it('ends a running break when a new climb is added', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const runningBreak = {
      ...createBreakEntry(0),
      timer: {
        status: 'running' as const,
        accumulatedDurationMs: 0,
        activeStartTime: Temporal.Now.instant().toString(),
      },
    };

    render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <SessionForm
            initialValues={{
              ...createEmptySessionForm(),
              gymId: gymFixture[0].id,
              location: 'Main Wall',
              status: 'active',
              startTime: Temporal.Now.instant().toString(),
              entries: [runningBreak],
            }}
          />
        </MantineProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /add climb/i }));

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(autosaveMocks.autosaveActiveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({
              type: 'break',
              timer: expect.objectContaining({ status: 'stopped' }),
            }),
            expect.objectContaining({ type: 'climb' }),
          ]),
        }),
      );
    });

    vi.useRealTimers();
    expect(vi.isFakeTimers()).toBe(false);
  });

  it('automatically starts a break when an attempt timer is stopped and auto rest is enabled', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.setItem('boulder.autoRestEnabled', 'true');

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <SessionForm
            initialValues={{
              ...createEmptySessionForm(),
              gymId: gymFixture[0].id,
              location: 'Main Wall',
              status: 'active',
              startTime: Temporal.Now.instant().toString(),
              entries: [createClimbEntry(0, 'Climb 1')],
            }}
          />
        </MantineProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(autosaveMocks.autosaveActiveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({ type: 'climb' }),
            expect.objectContaining({
              type: 'break',
              timer: expect.objectContaining({ status: 'running' }),
            }),
          ]),
        }),
      );
    });

    localStorage.removeItem('boulder.autoRestEnabled');
    vi.useRealTimers();
    expect(vi.isFakeTimers()).toBe(false);
  });

  it('does not start a break when an attempt timer is stopped and auto rest is disabled', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    autosaveMocks.autosaveActiveDraft.mockClear();

    render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <SessionForm
            initialValues={{
              ...createEmptySessionForm(),
              gymId: gymFixture[0].id,
              location: 'Main Wall',
              status: 'active',
              startTime: Temporal.Now.instant().toString(),
              entries: [createClimbEntry(0, 'Climb 1')],
            }}
          />
        </MantineProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(autosaveMocks.autosaveActiveDraft).toHaveBeenCalled();
    });

    const lastCall = autosaveMocks.autosaveActiveDraft.mock.lastCall?.[0];
    expect(
      lastCall?.entries.every(
        (entry: { type: string }) => entry.type !== 'break',
      ),
    ).toBe(true);

    vi.useRealTimers();
    expect(vi.isFakeTimers()).toBe(false);
  });
});
