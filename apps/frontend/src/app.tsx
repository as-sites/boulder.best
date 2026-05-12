import {
  Button,
  Container,
  Group,
  Loader,
  MantineProvider,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { apiClient } from './lib/api-client.js';

const queryClient = new QueryClient();

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
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Boulder Best</Title>
        <Text c="dimmed">A small first hold for the climbing tracker.</Text>
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

const rootRoute = createRootRoute({
  component: Outlet,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const routeTree = rootRoute.addChildren([indexRoute]);
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </MantineProvider>
  );
}
