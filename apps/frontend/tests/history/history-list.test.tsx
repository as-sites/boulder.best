import { describe, expect, it, vi } from 'vitest';
import type { JSX, ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import {
  createMemoryHistory,
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { HistoryListItem } from '../../src/history/history-list-item.js';
import type { MergedHistoryItem } from '../../src/history/merge-session-history.js';
import type * as mergedSessionHistoryModule from '../../src/history/use-merged-session-history.js';
import { HistoryPage } from '../../src/pages/history.js';

const mergedItems: MergedHistoryItem[] = [
  {
    id: 'local-1',
    gymId: 'gym-1',
    gymName: 'Local Gym',
    location: 'Main Wall',
    startTime: '2026-05-22T10:00:00.000Z',
    endTime: '2026-05-22T11:00:00.000Z',
    totalDurationMs: 3_600_000,
    entryCount: 1,
    source: 'local',
    isLocalOnly: true,
    syncStatus: 'pending',
  },
  {
    id: 'server-1',
    gymId: 'gym-2',
    gymName: 'Server Gym',
    startTime: '2026-05-20T12:00:00.000Z',
    endTime: '2026-05-20T13:00:00.000Z',
    totalDurationMs: 3_600_000,
    entryCount: 2,
    source: 'server',
    isLocalOnly: false,
  },
];

vi.mock(
  import('../../src/history/use-merged-session-history.js'),
  () =>
    ({
      useMergedSessionHistory: () => ({
        items: mergedItems,
        historyQuery: {
          isPending: false,
          isError: false,
          error: null,
        },
        gymsQuery: {
          isPending: false,
          isError: false,
        },
      }),
    }) as unknown as typeof mergedSessionHistoryModule,
);

const renderWithRouter = async (ui: ReactNode) => {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: (): JSX.Element => ui as JSX.Element,
  });
  const sessionDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/sessions/$sessionId',
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, sessionDetailRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await router.load();

  return render(
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>,
  );
};

describe('history page', () => {
  it('renders merged items with pending badge and local separator', async () => {
    await renderWithRouter(<HistoryPage />);

    expect(screen.getByText('Local Gym')).toBeDefined();
    expect(screen.getByText('Main Wall')).toBeDefined();
    expect(screen.getByText('Server Gym')).toBeDefined();
    expect(screen.getByText(/pending sync/i)).toBeDefined();
    expect(screen.getByText('On this device')).toBeDefined();
  });
});

const localPendingItem: MergedHistoryItem = {
  id: 'local-1',
  gymId: 'gym-1',
  gymName: 'Local Gym',
  startTime: '2026-05-22T10:00:00.000Z',
  endTime: '2026-05-22T11:00:00.000Z',
  totalDurationMs: 3_600_000,
  entryCount: 1,
  source: 'local',
  isLocalOnly: true,
  syncStatus: 'pending',
};

describe('history list item', () => {
  it('links to the session detail route', async () => {
    await renderWithRouter(
      <HistoryListItem item={localPendingItem} showLocalSeparator />,
    );

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/sessions/local-1',
    );
  });
});
