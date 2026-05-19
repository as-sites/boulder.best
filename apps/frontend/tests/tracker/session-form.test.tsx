import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Gym } from '@boulder/api-contract';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createEmptySessionForm } from '../../src/tracker/session-form-state.js';
import { SessionForm } from '../../src/tracker/session-form.js';

const gymFixture = [
  {
    id: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
    name: 'Test Gym',
    grades: ['V0', 'V1', 'V2'],
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
});
