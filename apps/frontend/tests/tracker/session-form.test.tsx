import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Gym } from '@boulder/api-contract';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createClimbEntry } from '../../src/tracker/entry-factory.js';
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
  loadCachedGyms: vi.fn(async () => gymFixture),
}));

vi.mock(import('../../src/offline/gyms/gym-cache.js'), () => ({
  loadCachedGyms: gymMocks.loadCachedGyms,
  refreshCachedGymsFromApi: vi.fn(),
  fetchGymsFromApi: vi.fn(),
}));

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

    const stopButton = screen.getByRole('button', { name: /stop session/i });
    await waitFor(() => expect(stopButton).not.toBeDisabled());
    fireEvent.click(stopButton);

    await waitFor(() => expect(startButton).toBeDisabled());
    expect(stopButton).toBeDisabled();
  });

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
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
  });
});
