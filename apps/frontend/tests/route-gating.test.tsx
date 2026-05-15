import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import type * as apiClientType from '../src/lib/api-client.js';
import type { authClient } from '../src/lib/auth-client.js';
import { createAppRouter } from '../src/router.js';

const authMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

vi.mock(import('../src/lib/auth-client.js'), () => ({
  authClient: {
    useSession: authMocks.useSession,
    getSession: vi.fn(),
    signIn: {
      email: vi.fn(),
      social: vi.fn(),
      passkey: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
    signOut: vi.fn(),
    passkey: {
      addPasskey: vi.fn(),
    },
  },
}));

vi.mock(
  import('../src/lib/api-client.js'),
  () =>
    ({
      apiClient: {
        api: {
          hello: {
            $get: vi.fn().mockResolvedValue({
              ok: true,
              json: async () => ({ message: 'Hello from the API.' }),
            }),
          },
        },
      },
    }) as unknown as typeof apiClientType,
);

async function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createAppRouter({ initialEntries: [path] });
  await router.load();

  return render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </MantineProvider>,
  );
}

function mockSession(
  session: Partial<ReturnType<typeof authClient.useSession>>,
) {
  authMocks.useSession.mockReturnValue({
    data: null,
    error: null,
    isPending: false,
    refetch: vi.fn(),
    ...session,
  } as ReturnType<typeof authClient.useSession>);
}

describe('protected route gating', () => {
  beforeEach(() => {
    mockSession({ data: null, isPending: false });
  });

  it('redirects signed-out users away from tracker', async () => {
    await renderAt('/tracker');

    await waitFor(() => {
      expect(screen.getByText('Boulder Best')).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Tracker' })).toBeNull();
  });

  it('redirects signed-out users away from history', async () => {
    await renderAt('/history');

    await waitFor(() => {
      expect(screen.getByText('Boulder Best')).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'History' })).toBeNull();
  });

  it('shows session restoration while tracker auth is pending', async () => {
    mockSession({ data: null, isPending: true });
    await renderAt('/tracker');

    await waitFor(() => {
      expect(screen.getByText('Restoring session...')).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Tracker' })).toBeNull();
  });

  it('allows signed-in users to view tracker', async () => {
    mockSession({
      data: { user: { email: 'ally@example.com' } },
      isPending: false,
    } as ReturnType<typeof authClient.useSession>);
    await renderAt('/tracker');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Tracker' }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Boulder Best')).toBeNull();
  });

  it('allows signed-in users to view history', async () => {
    mockSession({
      data: { user: { email: 'ally@example.com' } },
      isPending: false,
    } as ReturnType<typeof authClient.useSession>);
    await renderAt('/history');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'History' }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Boulder Best')).toBeNull();
  });
});
