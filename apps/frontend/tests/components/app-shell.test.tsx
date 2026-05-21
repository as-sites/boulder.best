import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { AppProviders } from '../../src/app.js';
import { APP_SHELL_DESKTOP_NAV_QUERY } from '../../src/components/app-nav-items.js';
import type * as apiClientType from '../../src/lib/api-client.js';
import { createAppRouter } from '../../src/router.js';

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
        api: {},
      },
    }) as unknown as typeof apiClientType,
);

vi.mock(import('../../src/offline/index.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  useSyncQueueList: () => [],
}));

const signedOutSession = () => ({
  data: null,
  error: null,
  isPending: false,
  isRefetching: false,
  refetch: vi.fn(),
});

const signedInSession = () => ({
  data: {
    user: {
      id: 'user-1',
      email: 'climber@example.com',
      name: 'Alex Climber',
      image: null,
    },
  },
  error: null,
  isPending: false,
  isRefetching: false,
  refetch: vi.fn(),
});

const createViewportMatchMedia = (isDesktop: boolean) => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  return (query: string): MediaQueryList => {
    const matches = query === APP_SHELL_DESKTOP_NAV_QUERY ? isDesktop : false;

    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        listeners.add(listener);
      },
      removeEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        listeners.delete(listener);
      },
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  };
};

const renderShellAt = async (path: string, isDesktop: boolean) => {
  vi.stubGlobal('matchMedia', createViewportMatchMedia(isDesktop));

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createAppRouter({ initialEntries: [path] });
  await router.load();

  return render(<AppProviders queryClient={queryClient} router={router} />);
};

const sideNav = () =>
  screen.getByRole('navigation', { name: 'Main navigation' });

const navToggle = () =>
  screen.getByRole('button', { name: /navigation menu/i });

const accountMenuTrigger = () =>
  screen.getByRole('button', { name: 'Account menu' });

const brandLink = () => screen.getByRole('link', { name: 'boulder.best' });

describe('AppShell navigation', () => {
  beforeEach(() => {
    authMocks.useSession.mockReturnValue(signedOutSession());
    vi.unstubAllGlobals();
  });

  describe('mobile layout', () => {
    beforeEach(() => {
      vi.stubGlobal('matchMedia', createViewportMatchMedia(false));
    });

    it('shows the brand in the header, not in the side nav', async () => {
      await renderShellAt('/tracker', false);

      fireEvent.click(navToggle());

      await waitFor(() => {
        expect(
          within(sideNav()).getByRole('link', { name: /history/i }),
        ).toBeVisible();
      });

      expect(
        screen.getAllByRole('link', { name: 'boulder.best' }),
      ).toHaveLength(1);
      expect(sideNav()).not.toContainElement(brandLink());
    });

    it('shows a burger menu without bottom tab bar and collapsed side nav', async () => {
      await renderShellAt('/tracker', false);

      await waitFor(() => {
        expect(navToggle()).toHaveAttribute(
          'aria-label',
          'Open navigation menu',
        );
      });

      expect(navToggle()).toHaveAttribute('aria-expanded', 'false');

      expect(
        screen.queryByRole('navigation', { name: 'Bottom navigation' }),
      ).toBeNull();
    });

    it('opens the side nav drawer when the burger is pressed', async () => {
      await renderShellAt('/tracker', false);

      fireEvent.click(navToggle());

      await waitFor(() => {
        expect(navToggle()).toHaveAttribute(
          'aria-label',
          'Close navigation menu',
        );
      });

      expect(
        within(sideNav()).getByRole('link', { name: /history/i }),
      ).toBeVisible();
      expect(
        within(sideNav()).getByRole('link', { name: /settings/i }),
      ).toHaveAttribute('href', '/settings');
      expect(screen.queryByRole('navigation', { name: 'Account' })).toBeNull();
    });

    it('opens the account menu from the header avatar', async () => {
      await renderShellAt('/tracker', false);

      fireEvent.click(accountMenuTrigger());

      const signInItem = await screen.findByText('Sign in');
      expect(signInItem.closest('a')).toHaveAttribute('href', '/auth/account');
    });

    it('routes from the drawer and closes it after navigation', async () => {
      await renderShellAt('/tracker', false);

      fireEvent.click(navToggle());

      await waitFor(() => {
        expect(
          within(sideNav()).getByRole('link', { name: /settings/i }),
        ).toBeVisible();
      });

      fireEvent.click(
        within(sideNav()).getByRole('link', { name: /settings/i }),
      );

      await waitFor(() => {
        expect(navToggle()).toHaveAttribute(
          'aria-label',
          'Open navigation menu',
        );
      });
      expect(
        screen.getByRole('heading', { name: /settings/i }),
      ).toBeInTheDocument();
    });

    it('marks the active drawer link when on that route', async () => {
      await renderShellAt('/settings', false);

      fireEvent.click(navToggle());

      await waitFor(() => {
        expect(
          within(sideNav()).getByRole('link', { name: /settings/i }),
        ).toBeVisible();
      });

      const settingsLink = within(sideNav()).getByRole('link', {
        name: /settings/i,
      });
      expect(settingsLink.closest('[data-active="true"]')).not.toBeNull();
    });
  });

  describe('desktop layout', () => {
    beforeEach(() => {
      vi.stubGlobal('matchMedia', createViewportMatchMedia(true));
    });

    it('shows the brand in the header, not in the side nav', async () => {
      await renderShellAt('/tracker', true);

      await waitFor(() => {
        expect(
          within(sideNav()).getByRole('link', { name: /tracker/i }),
        ).toBeVisible();
      });

      expect(
        screen.getAllByRole('link', { name: 'boulder.best' }),
      ).toHaveLength(1);
      expect(sideNav()).not.toContainElement(brandLink());
    });

    it('shows a persistent side nav and burger toggle without bottom tab bar', async () => {
      await renderShellAt('/tracker', true);

      await waitFor(() => {
        expect(
          within(sideNav()).getByRole('link', { name: /tracker/i }),
        ).toBeVisible();
      });

      expect(navToggle()).toHaveAttribute(
        'aria-label',
        'Close navigation menu',
      );
      expect(
        screen.queryByRole('navigation', { name: 'Bottom navigation' }),
      ).toBeNull();
      expect(
        within(sideNav()).getByRole('link', { name: /tracker/i }),
      ).toHaveAttribute('href', '/tracker');
    });

    it('marks the active side nav link with aria-current', async () => {
      await renderShellAt('/settings', true);

      const settingsLink = await within(sideNav()).findByRole('link', {
        name: /settings/i,
      });
      expect(settingsLink).toHaveAttribute('aria-current', 'page');
    });

    it('routes when a side nav link is clicked', async () => {
      await renderShellAt('/tracker', true);

      fireEvent.click(
        within(sideNav()).getByRole('link', { name: /settings/i }),
      );

      await expect(
        screen.findByRole('heading', { name: /^settings$/i }),
      ).resolves.toBeInTheDocument();
    });

    it('shows signed-in user details and sign out in the account menu', async () => {
      authMocks.useSession.mockReturnValue(signedInSession());
      await renderShellAt('/tracker', true);

      fireEvent.click(accountMenuTrigger());

      await expect(
        screen.findByText('climber@example.com'),
      ).resolves.toBeInTheDocument();
      const accountSettingsItem = await screen.findByText('Account settings');
      expect(accountSettingsItem.closest('a')).toHaveAttribute(
        'href',
        '/auth/account',
      );
      await expect(screen.findByText('Sign out')).resolves.toBeInTheDocument();
    });

    // oxlint-disable-next-line jest/prefer-ending-with-an-expect -- inside the `waitFor`
    it('collapses the side nav when the burger is pressed', async () => {
      await renderShellAt('/tracker', true);

      await waitFor(() => {
        expect(navToggle()).toHaveAttribute('aria-expanded', 'true');
      });

      fireEvent.click(navToggle());

      await waitFor(() => {
        expect(navToggle()).toHaveAttribute(
          'aria-label',
          'Open navigation menu',
        );
        expect(navToggle()).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });
});
