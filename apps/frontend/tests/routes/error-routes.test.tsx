import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createRoute } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProviders } from '../../src/app.js';
import { RouteError } from '../../src/components/route-error.js';
import type * as apiClientType from '../../src/lib/api-client.js';
import type { authClient } from '../../src/lib/auth-client.js';
import {
  createAppRouter,
  type CreateAppRouterOptions,
} from '../../src/router.js';
import { rootRoute } from '../../src/routes/root.js';

const authMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

vi.mock(import('../../src/lib/auth-client.js'), () => ({
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
  import('../../src/lib/api-client.js'),
  () =>
    ({
      apiClient: {
        api: {
          sessions: {
            $get: vi.fn().mockResolvedValue({
              ok: true,
              // oxlint-disable-next-line typescript/require-await
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

const routerErrorProbeRoute = createRoute({
  component: () => <div>Router error probe</div>,
  errorComponent: RouteError,
  getParentRoute: () => rootRoute,
  loader: () => {
    throw new Error('Simulated route failure');
  },
  path: '/__router-error-probe',
});

const renderAt = async (
  path: string,
  options: Pick<CreateAppRouterOptions, 'extraRoutes'> = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createAppRouter({
    initialEntries: [path],
    ...options,
  });

  try {
    await router.load();
  } catch {
    // Loader/render failures are surfaced through errorComponent after render.
  }

  return render(<AppProviders queryClient={queryClient} router={router} />);
};

describe('router not-found UI', () => {
  beforeEach(() => {
    mockSession({ data: null, isPending: false });
  });

  it('renders a 404 inside the app shell for unknown paths', async () => {
    await renderAt('/does-not-exist');

    await expect(
      screen.findByRole('heading', { name: 'Page not found' }),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByText(/does not match any page in Boulder Best/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(
      screen.getByRole('link', { name: 'boulder.best' }),
    ).toBeInTheDocument();
  });

  it('renders recovery UI for an invalid history detail deep link', async () => {
    mockSession({
      data: { user: { email: 'ally@example.com' } },
      isPending: false,
    } as ReturnType<typeof authClient.useSession>);

    await renderAt('/history/not-a-uuid');

    await expect(
      screen.findByRole('heading', { name: 'Session not found' }),
    ).resolves.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Page not found' }),
    ).toBeNull();
  });
});

describe('router error UI', () => {
  beforeEach(() => {
    mockSession({ data: null, isPending: false });
  });

  it('renders a recoverable error state with retry inside the app shell', async () => {
    await renderAt('/__router-error-probe', {
      extraRoutes: [routerErrorProbeRoute],
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Something went wrong' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Simulated route failure')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(
      screen.getByRole('link', { name: 'boulder.best' }),
    ).toBeInTheDocument();

    screen.getByRole('button', { name: 'Try again' }).click();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Something went wrong' }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument();
  });
});
