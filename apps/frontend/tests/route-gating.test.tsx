import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProviders } from '../src/app.js';
import type * as apiClientType from '../src/lib/api-client.js';
import type { authClient } from '../src/lib/auth-client.js';
import type { SyncQueueItem } from '../src/offline/db/types.js';
import { createAppRouter } from '../src/router.js';

const authMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

const sessionsGet = vi.hoisted(() =>
  vi.fn().mockResolvedValue(
    Response.json(
      {
        items: [
          {
            id: 'server-1',
            gymId: 'gym-1',
            gymName: 'Cloud Gym',
            startTime: '2026-05-20T12:00:00.000Z',
            endTime: '2026-05-20T13:00:00.000Z',
            totalDurationMs: 3_600_000,
            entryCount: 1,
          },
        ],
        nextCursor: null,
      },
      {
        status: 200,
      },
    ),
  ),
);

const localQueueItem = vi.hoisted(
  (): SyncQueueItem => ({
    id: 'local-session-1',
    sessionId: 'local-session-1',
    payload: {
      id: 'local-session-1',
      gymId: 'gym-local',
      startTime: '2026-05-21T10:00:00.000Z',
      endTime: '2026-05-21T11:00:00.000Z',
      totalDurationMs: 3_600_000,
      notes: '',
      entries: [
        { id: 'entry-1', sequenceOrder: 0, type: 'break', durationMs: 1000 },
      ],
    },
    status: 'pending',
    retryCount: 0,
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
  }),
);

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

vi.mock(import('../src/offline/index.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  useSyncQueueList: () => [localQueueItem],
}));

vi.mock(
  import('../src/lib/api-client.js'),
  () =>
    ({
      apiClient: {
        api: {
          sessions: {
            $get: sessionsGet,
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

const mockSignedOutHistoryResponse = () =>
  sessionsGet.mockResolvedValue(new Response(null, { status: 401 }));

describe('offline-first route access', () => {
  beforeEach(() => {
    sessionsGet.mockClear();
    mockSession({ data: null, isPending: false });
  });

  it('renders tracker for signed-out users without redirecting home', async () => {
    await renderAt('/tracker');

    await expect(
      screen.findByRole('heading', { name: 'Tracker' }),
    ).resolves.toBeInTheDocument();
  });

  // oxlint-disable-next-line vitest/prefer-ending-with-an-expect -- inside the `waitFor`
  it('renders history for signed-out users without redirecting home', async () => {
    mockSignedOutHistoryResponse();
    await renderAt('/sessions');

    await expect(
      screen.findByRole('heading', { name: 'History' }),
    ).resolves.toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText(/saved on this device only/i),
      ).toBeInTheDocument();
    });
  });

  it('shows only local history items when signed out', async () => {
    mockSignedOutHistoryResponse();
    await renderAt('/sessions');

    await waitFor(() => {
      expect(sessionsGet).toHaveBeenCalled();
    });
    await expect(screen.findByText('Unknown gym')).resolves.toBeInTheDocument();
    expect(screen.queryByText('Cloud Gym')).toBeNull();
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

  it('allows signed-in users to view history and load cloud sessions', async () => {
    sessionsGet.mockResolvedValue(
      Response.json(
        {
          items: [
            {
              id: 'server-1',
              gymId: 'gym-1',
              gymName: 'Cloud Gym',
              startTime: '2026-05-20T12:00:00.000Z',
              endTime: '2026-05-20T13:00:00.000Z',
              totalDurationMs: 3_600_000,
              entryCount: 1,
            },
          ],
          nextCursor: null,
        },
        { status: 200 },
      ),
    );
    mockSession({
      data: { user: { email: 'ally@example.com' } },
      isPending: false,
    } as ReturnType<typeof authClient.useSession>);
    await renderAt('/sessions');

    await expect(
      screen.findByRole('heading', { name: 'History' }),
    ).resolves.toBeInTheDocument();
    await waitFor(() => {
      expect(sessionsGet).toHaveBeenCalled();
    });
    await expect(screen.findByText('Cloud Gym')).resolves.toBeInTheDocument();
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

    await renderAt('/sessions');

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
    expect(
      screen.getByText(/Show milliseconds on timers/i),
    ).toBeInTheDocument();
  });

  it('renders the about route with FAQ content', async () => {
    await renderAt('/about');

    await expect(
      screen.findByRole('heading', { name: 'About' }),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /how is my data stored on this device/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /how does offline mode work/i }),
    ).toBeInTheDocument();
  });

  it('renders the account route placeholder', async () => {
    await renderAt('/auth/account');

    await expect(
      screen.findByRole('heading', { name: 'Account' }),
    ).resolves.toBeInTheDocument();
    expect(screen.getByTestId('auth-submit')).toBeInTheDocument();
  });
});
