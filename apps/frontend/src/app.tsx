import { useState } from 'react';
import {
  Button,
  Container,
  Group,
  Loader,
  MantineProvider,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
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

function authResult(
  result: { error?: { message?: string | undefined } | null },
  fallback: string,
): { message: string; isError: boolean } {
  if (result.error) {
    return { message: result.error.message ?? fallback, isError: true };
  }
  return { message: fallback, isError: false };
}

export function AuthActions() {
  const session = authClient.useSession();
  const isAuthenticated = !!session.data?.user;

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [passkeyName, setPasskeyName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function runAction(
    action: () => Promise<{ message: string; isError: boolean }>,
  ) {
    setStatus(null);
    setIsSubmitting(true);
    try {
      const { message, isError: err } = await action();
      setStatus(message);
      setIsError(err);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'The auth action failed.',
      );
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithEmail() {
    await runAction(async () => {
      const result = await authClient.signIn.email({ email, password });
      return authResult(result, 'Signed in.');
    });
  }

  async function signUpWithEmail() {
    await runAction(async () => {
      const result = await authClient.signUp.email({ email, password, name });
      return authResult(result, 'Account created. Check your email to verify.');
    });
  }

  async function signOut() {
    await runAction(async () => {
      const result = await authClient.signOut();
      return authResult(result, 'Signed out.');
    });
  }

  async function signInWithProvider(provider: OAuthProvider) {
    await runAction(async () => {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: window.location.href,
      });
      return authResult(result, `Started ${provider} sign-in.`);
    });
  }

  async function signInWithPasskey() {
    await runAction(async () => {
      const result = await authClient.signIn.passkey({ autoFill: false });
      return authResult(result, 'Signed in with passkey.');
    });
  }

  async function registerPasskey() {
    await runAction(async () => {
      const trimmedPasskeyName = passkeyName.trim();
      const result = await authClient.passkey.addPasskey({
        ...(trimmedPasskeyName && { name: trimmedPasskeyName }),
        authenticatorAttachment: 'platform',
      });
      return authResult(result, 'Registered passkey.');
    });
  }

  function switchMode(next: 'signin' | 'signup') {
    setMode(next);
    setStatus(null);
  }

  const statusEl = status ? (
    <Text c={isError ? 'red' : 'dimmed'} size="sm">
      {status}
    </Text>
  ) : null;

  if (isAuthenticated) {
    return (
      <Paper withBorder p="md" radius="sm">
        <Stack gap="sm">
          <Title order={2}>Account</Title>
          <Text size="sm">Signed in as {session.data?.user.email}</Text>
          <Group gap="sm">
            <Button
              disabled={isSubmitting}
              loading={isSubmitting}
              onClick={() => void signOut()}
              variant="default"
            >
              Sign out
            </Button>
          </Group>
          <Stack gap="xs">
            <TextInput
              disabled={isSubmitting}
              label="Passkey name"
              onChange={(event) => setPasskeyName(event.currentTarget.value)}
              placeholder="This device"
              value={passkeyName}
            />
            <Button
              disabled={isSubmitting}
              onClick={() => void registerPasskey()}
              variant="light"
            >
              Register passkey
            </Button>
          </Stack>
          {statusEl}
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper withBorder p="md" radius="sm">
      <Stack gap="sm">
        <Group gap="xs">
          <Button
            onClick={() => switchMode('signin')}
            size="compact-sm"
            variant={mode === 'signin' ? 'filled' : 'subtle'}
          >
            Sign in
          </Button>
          <Button
            onClick={() => switchMode('signup')}
            size="compact-sm"
            variant={mode === 'signup' ? 'filled' : 'subtle'}
          >
            Sign up
          </Button>
        </Group>
        <Stack gap="xs">
          {mode === 'signup' ? (
            <TextInput
              disabled={isSubmitting}
              label="Name"
              onChange={(event) => setName(event.currentTarget.value)}
              placeholder="Your name"
              value={name}
            />
          ) : null}
          <TextInput
            disabled={isSubmitting}
            label="Email"
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          <PasswordInput
            disabled={isSubmitting}
            label="Password"
            onChange={(event) => setPassword(event.currentTarget.value)}
            value={password}
          />
          <Button
            data-testid="auth-submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={() =>
              void (mode === 'signin' ? signInWithEmail() : signUpWithEmail())
            }
          >
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </Stack>
        <Text c="dimmed" size="xs">
          Or continue with
        </Text>
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
        {statusEl}
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
