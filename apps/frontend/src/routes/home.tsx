import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { Link, createRoute } from '@tanstack/react-router';
import { authClient } from '../lib/auth-client.js';
import { rootRoute } from './root.js';

const Home = () => {
  const session = authClient.useSession();
  const user = session.data?.user;
  const welcomeName = user?.name.trim() || user?.email;

  return (
    <Container py="xl" size="sm">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1}>Boulder Best</Title>
          <Text c="dimmed" size="lg">
            Offline-first bouldering tracker for gym sessions.
          </Text>
        </Stack>

        {!session.isPending && user && welcomeName ? (
          <Text size="sm">Welcome back, {welcomeName}.</Text>
        ) : null}

        {!session.isPending && !user ? (
          <Text c="dimmed" size="sm">
            Climbing sessions stay on this device until you sign in. Open
            Account from the menu below when you are ready to sync.
          </Text>
        ) : null}

        <Stack gap="sm">
          <Button component={Link} size="md" to="/tracker">
            Tracker
          </Button>
          <Group gap="sm">
            <Button component={Link} to="/sessions" variant="light">
              History
            </Button>
            <Button component={Link} to="/settings" variant="light">
              Settings
            </Button>
          </Group>
        </Stack>
      </Stack>
    </Container>
  );
};

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});
