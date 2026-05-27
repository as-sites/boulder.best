import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Gym } from '@boulder/api-contract';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  createBreakEntry,
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
  // oxlint-disable-next-line typescript/require-await
  loadCachedGyms: vi.fn(async () => gymFixture),
}));

vi.mock(import('../../src/offline/gyms/gym-cache.js'), () => ({
  loadCachedGyms: gymMocks.loadCachedGyms,
  refreshCachedGymsFromApi: vi.fn(),
  fetchGymsFromApi: vi.fn(),
}));

const autosaveMocks = vi.hoisted(() => ({
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
});
