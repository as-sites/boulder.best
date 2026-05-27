import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import { AppProviders } from '../../src/app.js';
import type * as apiClientType from '../../src/lib/api-client.js';
import type { authClient } from '../../src/lib/auth-client.js';
import { createAppRouter } from '../../src/router.js';

type UseSession = typeof authClient.useSession;
type UseSessionResult = ReturnType<UseSession>;

type SessionData = NonNullable<UseSessionResult['data']>;
type SessionUser = SessionData['user'];
type SessionRecord = SessionData['session'];

const authMocks = vi.hoisted(() => ({
  useSession: vi.fn<UseSession>(),
}));

const helloGet = vi.hoisted(() => vi.fn());

const sessionRefetch = vi.hoisted((): UseSessionResult['refetch'] =>
  vi.fn(async (_) => {
    /* empty */
  }),
);

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
          hello: {
            $get: helloGet,
          },
        },
      },
    }) as unknown as typeof apiClientType,
);

const fixtureDate = new Date('2026-01-01T00:00:00.000Z');
const fixtureExpiresAt = new Date('2027-01-01T00:00:00.000Z');

const allyUser: SessionUser = {
  id: 'user_test',
  createdAt: fixtureDate,
  updatedAt: fixtureDate,
  email: 'ally@example.com',
  name: 'Ally',
  emailVerified: true,
  image: null,
};

const allyUserWithoutDisplayName: SessionUser = {
  id: 'user_test',
  createdAt: fixtureDate,
  updatedAt: fixtureDate,
  email: 'ally@example.com',
  name: '',
  emailVerified: true,
  image: null,
};

const sessionRecordForUser = (userId: string): SessionRecord => ({
  id: 'session_test',
  createdAt: fixtureDate,
  updatedAt: fixtureDate,
  userId,
  expiresAt: fixtureExpiresAt,
  token: 'session_token_test',
  ipAddress: null,
  userAgent: null,
});

const sessionDataForUser = (user: SessionUser): SessionData => ({
  user,
  session: sessionRecordForUser(user.id),
});

const signedOutUseSession = (): UseSessionResult => ({
  data: null,
  error: null,
  isPending: false,
  isRefetching: false,
  refetch: sessionRefetch,
});

const signedInUseSession = (user: SessionUser): UseSessionResult => ({
  data: sessionDataForUser(user),
  error: null,
  isPending: false,
  isRefetching: false,
  refetch: sessionRefetch,
});

const renderHome = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createAppRouter({ initialEntries: ['/'] });
  await router.load();

  return render(<AppProviders queryClient={queryClient} router={router} />);
};

const mockUseSession = (result: UseSessionResult): void => {
  authMocks.useSession.mockReturnValue(result);
};

describe('home route', () => {
  beforeEach(() => {
    helloGet.mockClear();
    mockUseSession(signedOutUseSession());
  });

  it('shows landing content and navigation CTAs without calling the hello API', async () => {
    await renderHome();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Boulder Best' }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/offline-first bouldering tracker/i),
    ).toBeInTheDocument();

    const main = screen.getByRole('main');
    expect(within(main).getByRole('link', { name: 'Tracker' })).toHaveAttribute(
      'href',
      '/tracker',
    );
    expect(within(main).getByRole('link', { name: 'History' })).toHaveAttribute(
      'href',
      '/sessions',
    );
    expect(
      within(main).getByRole('link', { name: 'Settings' }),
    ).toHaveAttribute('href', '/settings');
    expect(within(main).getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about',
    );
    expect(helloGet).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /refresh api/i })).toBeNull();
    expect(screen.queryByText(/loading api message/i)).toBeNull();
  });

  it('tells signed-out users that sessions stay on-device until sign-in', async () => {
    await renderHome();

    await waitFor(() => {
      expect(
        screen.getByText(/stay on this device until you sign in/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/welcome back/i)).toBeNull();
  });

  it('shows a light welcome message when signed in', async () => {
    mockUseSession(signedInUseSession(allyUser));

    await renderHome();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, ally/i)).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/stay on this device until you sign in/i),
    ).toBeNull();
  });

  it('welcomes signed-in users by email when no display name is set', async () => {
    mockUseSession(signedInUseSession(allyUserWithoutDisplayName));

    await renderHome();

    await expect(
      screen.findByText(/welcome back, ally@example.com/i),
    ).resolves.toBeInTheDocument();
  });
});
