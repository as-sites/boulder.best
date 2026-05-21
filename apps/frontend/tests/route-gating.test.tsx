import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProviders } from '../src/app.js';
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
          sessions: {
            $get: vi.fn().mockResolvedValue({
              ok: true,
              json: async () => ({ items: [], nextCursor: null }),
            }),
            ':id': {
              $get: vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
              }),
            },
          },
        },
      },
    }) as unknown as typeof apiClientType,
);

const renderAt = async (path: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createAppRouter({ initialEntries: [path] });
  await router.load();

  return render(<AppProviders queryClient={queryClient} router={router} />);
};

const mockSession = (
  session: Partial<ReturnType<typeof authClient.useSession>>,
) => {
  authMocks.useSession.mockReturnValue({
    data: null,
    error: null,
    isPending: false,
    refetch: vi.fn(),
    ...session,
  } as ReturnType<typeof authClient.useSession>);
};

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

    await expect(
      screen.findByRole('heading', { name: 'Tracker' }),
    ).resolves.toBeInTheDocument();
  });

  it('allows signed-in users to view history', async () => {
    mockSession({
      data: { user: { email: 'ally@example.com' } },
      isPending: false,
    } as ReturnType<typeof authClient.useSession>);
    await renderAt('/history');

    await expect(
      screen.findByRole('heading', { name: 'History' }),
    ).resolves.toBeInTheDocument();
  });
});

describe('route shell smoke tests', () => {
  beforeEach(() => {
    mockSession({ data: null, isPending: false });
  });

  it('renders the tracker route with the mobile navigation shell', async () => {
    mockSession({
      data: { user: { email: 'ally@example.com' } },
      isPending: false,
    } as ReturnType<typeof authClient.useSession>);

    await renderAt('/tracker');

    await expect(
      screen.findByRole('heading', { name: 'Tracker' }),
    ).resolves.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute(
      'href',
      '/settings',
    );
  });

  it('renders the history route', async () => {
    mockSession({
      data: { user: { email: 'ally@example.com' } },
      isPending: false,
    } as ReturnType<typeof authClient.useSession>);

    await renderAt('/history');

    await expect(
      screen.findByRole('heading', { name: 'History' }),
    ).resolves.toBeInTheDocument();
  });

  it('renders the settings route with appearance and offline controls', async () => {
    await renderAt('/settings');

    await expect(
      screen.findByRole('heading', { name: 'Settings' }),
    ).resolves.toBeInTheDocument();
    expect(screen.getByText(/Appearance/i)).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: /color scheme/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Manual offline mode/i)).toBeInTheDocument();
  });

  it('renders the account route placeholder', async () => {
    await renderAt('/auth/account');

    await expect(
      screen.findByRole('heading', { name: 'Account' }),
    ).resolves.toBeInTheDocument();
    expect(screen.getByTestId('auth-submit')).toBeInTheDocument();
  });
});
