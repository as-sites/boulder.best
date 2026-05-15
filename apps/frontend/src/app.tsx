import { useState } from 'react';
import {
  Button,
  Container,
  Group,
  Loader,
  MantineProvider,
  Paper,
  Stack,
  TextInput,
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
import { authClient, type OAuthProvider } from './lib/auth-client.js';

const queryClient = new QueryClient();

function resultMessage(
  result: Awaited<ReturnType<typeof authClient.signIn.social>>,
  fallback: string,
): string {
  return result.error?.message ?? fallback;
}

export function AuthActions() {
  const session = authClient.useSession();
  const isAuthenticated = session.data !== null;
  const [passkeyName, setPasskeyName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function runAction(action: () => Promise<string>) {
    setStatus(null);
    setIsSubmitting(true);

    try {
      setStatus(await action());
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'The auth action failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithProvider(provider: OAuthProvider) {
    await runAction(async () => {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: window.location.href,
      });

      return resultMessage(result, `Started ${provider} sign-in.`);
    });
  }

  async function signInWithPasskey() {
    await runAction(async () => {
      const result = await authClient.signIn.passkey({ autoFill: false });

      return resultMessage(result, 'Signed in with passkey.');
    });
  }

  async function registerPasskey() {
    await runAction(async () => {
      const trimmedPasskeyName = passkeyName.trim();
      const result = await authClient.passkey.addPasskey({
        ...(trimmedPasskeyName && { name: trimmedPasskeyName }),
        authenticatorAttachment: 'platform',
      });

      return resultMessage(result, 'Registered passkey.');
    });
  }

  return (
    <Paper withBorder p="md" radius="sm">
      <Stack gap="sm">
        <Title order={2}>Sign in</Title>
        <Group gap="sm">
          <Button
            disabled={isSubmitting}
            onClick={() => void signInWithProvider('google')}
            variant="default"
          >
            Continue with Google
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={() => void signInWithProvider('discord')}
            variant="default"
          >
            Continue with Discord
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={() => void signInWithPasskey()}
            variant="default"
          >
            Sign in with passkey
          </Button>
        </Group>
        <Stack gap="xs">
          <TextInput
            disabled={!isAuthenticated || isSubmitting}
            label="Passkey name"
            onChange={(event) => setPasskeyName(event.currentTarget.value)}
            placeholder="This device"
            value={passkeyName}
          />
          <Button
            disabled={!isAuthenticated || isSubmitting}
            onClick={() => void registerPasskey()}
            variant="light"
          >
            Register passkey
          </Button>
          {!isAuthenticated ? (
            <Text c="dimmed" size="sm">
              Sign in before registering a passkey.
            </Text>
          ) : null}
        </Stack>
        {status ? (
          <Text c={status.includes('failed') ? 'red' : 'dimmed'} size="sm">
            {status}
          </Text>
        ) : null}
      </Stack>
    </Paper>
  );
}

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
        <AuthActions />
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
