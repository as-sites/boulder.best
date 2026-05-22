import { useEffect } from 'react';
import {
  AppShell as MantineAppShell,
  Burger,
  Flex,
  ScrollArea,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Outlet, useLocation } from '@tanstack/react-router';
import { useActiveDraftSession } from '../offline/hooks/use-active-draft-session.js';
import { AppBrand } from './app-brand.js';
import { APP_SHELL_DESKTOP_NAV_QUERY } from './app-nav-items.js';
import { AppShellMainNavLinks } from './app-shell-nav.js';
import { AppShellSessionTimer } from './app-shell-session-timer.js';
import { AppUserMenu } from './app-user-menu.js';

const HEADER_HEIGHT = 56;
const NAVBAR_WIDTH = 280;

const safeAreaTop = 'env(safe-area-inset-top, 0px)';
const safeAreaBottom = 'env(safe-area-inset-bottom, 0px)';

export const AppShell = () => {
  const location = useLocation();
  const isDesktopNav = useMediaQuery(APP_SHELL_DESKTOP_NAV_QUERY, false, {
    getInitialValueInEffect: false,
  });
  const [mobileNavOpened, { toggle: toggleMobileNav, close: closeMobileNav }] =
    useDisclosure(false);
  const [desktopNavOpened, { toggle: toggleDesktopNav }] = useDisclosure(true);

  const navOpened = isDesktopNav ? desktopNavOpened : mobileNavOpened;
  const toggleNav = isDesktopNav ? toggleDesktopNav : toggleMobileNav;
  const navToggleLabel = navOpened
    ? 'Close navigation menu'
    : 'Open navigation menu';

  const activeDraft = useActiveDraftSession();
  const activeFormData =
    activeDraft?.formData.status === 'active' ? activeDraft.formData : null;
  const showNavbarTimer = activeFormData !== null && navOpened;
  const showHeaderTimer = activeFormData !== null && !navOpened;

  useEffect(() => {
    closeMobileNav();
  }, [location.pathname, closeMobileNav]);

  return (
    <MantineAppShell
      header={{ height: `calc(${HEADER_HEIGHT}px + ${safeAreaTop})` }}
      navbar={{
        width: NAVBAR_WIDTH,
        breakpoint: 'sm',
        collapsed: {
          mobile: !mobileNavOpened,
          desktop: !desktopNavOpened,
        },
      }}
      padding="md"
      styles={{
        header: {
          paddingTop: safeAreaTop,
        },
        main: {
          paddingBottom: `calc(var(--mantine-spacing-md) + ${safeAreaBottom})`,
        },
      }}
    >
      <MantineAppShell.Header>
        <Flex
          align="center"
          h="100%"
          justify="space-between"
          px="md"
          wrap="nowrap"
        >
          <Flex
            align="center"
            gap="sm"
            style={{ flex: '1 1 auto', minWidth: 0 }}
            wrap="nowrap"
          >
            <Burger
              aria-controls="app-shell-navbar"
              aria-expanded={navOpened}
              aria-haspopup={isDesktopNav ? undefined : 'dialog'}
              aria-label={navToggleLabel}
              onClick={toggleNav}
              opened={navOpened}
              size="sm"
            />
            <AppBrand onNavigate={closeMobileNav} size="lg" />
          </Flex>

          <Flex align="center" gap="sm" style={{ flexShrink: 0 }} wrap="nowrap">
            {showHeaderTimer ? (
              <AppShellSessionTimer compact formData={activeFormData} />
            ) : null}
            <AppUserMenu />
          </Flex>
        </Flex>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar id="app-shell-navbar" p="md">
        {showNavbarTimer ? (
          <MantineAppShell.Section pb="md">
            <AppShellSessionTimer formData={activeFormData} />
          </MantineAppShell.Section>
        ) : null}
        <MantineAppShell.Section grow component={ScrollArea} type="auto">
          <AppShellMainNavLinks onNavigate={closeMobileNav} />
        </MantineAppShell.Section>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
};
