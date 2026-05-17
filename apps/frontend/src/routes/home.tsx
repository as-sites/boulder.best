import {
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Link, createRoute } from '@tanstack/react-router';
import { apiClient } from '../lib/api-client.js';
import { rootRoute } from './root.js';

function Home() {
  const helloQuery = useQuery({
    queryKey: ['hello'],
    queryFn: async () => {
      const response = await apiClient.api.hello.$get();

      if (!response.ok) {
        throw new Error('The API did not return a successful response.');
      }

      return await response.json();
    },
  });

  return (
    <Container py="xl" size="sm">
      <Stack gap="md">
        <Title order={1}>Boulder Best</Title>
        <Text c="dimmed">A small first hold for the climbing tracker.</Text>
        <Group gap="sm">
          <Button component={Link} to="/tracker" variant="light">
            Tracker
          </Button>
          <Button component={Link} to="/history" variant="light">
            History
          </Button>
          <Button component={Link} to="/settings" variant="light">
            Settings
          </Button>
        </Group>
        <Group align="center" gap="sm">
          <Button onClick={() => void helloQuery.refetch()}>Refresh API</Button>
          {helloQuery.isFetching ? <Loader size="sm" /> : null}
        </Group>
        {helloQuery.isError ? (
          <Text c="red">{helloQuery.error.message}</Text>
        ) : (
          <Text fw={600}>
            {helloQuery.data?.message ?? 'Loading API message...'}
          </Text>
        )}
      </Stack>
    </Container>
  );
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});
