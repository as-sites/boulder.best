import {
  Anchor,
  AppShell as MantineAppShell,
  Container,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { Link, Outlet, useLocation } from '@tanstack/react-router';

interface NavItem {
  label: string;
  to: '/tracker' | '/history' | '/settings' | '/auth/account';
  marker: string;
}

const navItems: NavItem[] = [
  { label: 'Tracker', to: '/tracker', marker: 'T' },
  { label: 'History', to: '/history', marker: 'H' },
  { label: 'Settings', to: '/settings', marker: 'S' },
  { label: 'Account', to: '/auth/account', marker: 'A' },
];

export const AppShell = () => {
  const location = useLocation();

  return (
    <MantineAppShell
      footer={{ height: 72 }}
      header={{ height: 56 }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Container h="100%" size="sm">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Anchor
              c="inherit"
              component={Link}
              fw={700}
              size="lg"
              to="/"
              underline="never"
            >
              Boulder Best
            </Anchor>
            <Text c="dimmed" size="xs">
              Offline-ready tracker
            </Text>
          </Group>
        </Container>
      </MantineAppShell.Header>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>

      <MantineAppShell.Footer>
        <Container h="100%" size="sm">
          <Group align="stretch" grow h="100%" gap="xs" wrap="nowrap">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;

              return (
                <Anchor
                  aria-current={isActive ? 'page' : undefined}
                  c={isActive ? 'blue.7' : 'dimmed'}
                  component={Link}
                  key={item.to}
                  py="xs"
                  ta="center"
                  to={item.to}
                  underline="never"
                >
                  <Stack align="center" gap={4}>
                    <ThemeIcon
                      radius="xl"
                      size="sm"
                      variant={isActive ? 'filled' : 'light'}
                    >
                      <Text fw={700} size="xs">
                        {item.marker}
                      </Text>
                    </ThemeIcon>
                    <Text fw={isActive ? 700 : 500} size="xs">
                      {item.label}
                    </Text>
                  </Stack>
                </Anchor>
              );
            })}
          </Group>
        </Container>
      </MantineAppShell.Footer>
    </MantineAppShell>
  );
};
