import { useState } from 'react';
import {
  Button,
  Group,
  Loader,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { authClient, type OAuthProvider } from '../lib/auth-client.js';

const authResult = (
  result: { error?: { message?: string | undefined } | null },
  fallback: string,
): { message: string; isError: boolean } => {
  if (result.error) {
    return { message: result.error.message ?? fallback, isError: true };
  }
  return { message: fallback, isError: false };
};

export const AuthActions = () => {
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

  const runAction = async (
    action: () => Promise<{ message: string; isError: boolean }>,
  ) => {
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
  };

  const signInWithEmail = async () => {
    await runAction(async () => {
      const result = await authClient.signIn.email({ email, password });
      return authResult(result, 'Signed in.');
    });
  };

  const signUpWithEmail = async () => {
    await runAction(async () => {
      const result = await authClient.signUp.email({ email, password, name });
      return authResult(result, 'Account created. Check your email to verify.');
    });
  };

  const signOut = async () => {
    await runAction(async () => {
      const result = await authClient.signOut();
      return authResult(result, 'Signed out.');
    });
  };

  const signInWithProvider = async (provider: OAuthProvider) => {
    await runAction(async () => {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: window.location.href,
      });
      return authResult(result, `Started ${provider} sign-in.`);
    });
  };

  const signInWithPasskey = async () => {
    await runAction(async () => {
      const result = await authClient.signIn.passkey({ autoFill: false });
      return authResult(result, 'Signed in with passkey.');
    });
  };

  const registerPasskey = async () => {
    await runAction(async () => {
      const trimmedPasskeyName = passkeyName.trim();
      const result = await authClient.passkey.addPasskey({
        ...(trimmedPasskeyName && { name: trimmedPasskeyName }),
        authenticatorAttachment: 'platform',
      });
      return authResult(result, 'Registered passkey.');
    });
  };

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setStatus(null);
  };

  const statusEl = status ? (
    <Text c={isError ? 'red' : 'dimmed'} size="sm">
      {status}
    </Text>
  ) : null;

  if (session.isPending) {
    return (
      <Paper p="md" radius="sm" withBorder>
        <Stack align="center" gap="sm" py="sm">
          <Loader size="sm" />
          <Text c="dimmed" size="sm">
            Restoring session...
          </Text>
        </Stack>
      </Paper>
    );
  }

  if (isAuthenticated) {
    return (
      <Paper p="md" radius="sm" withBorder>
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
    <Paper p="md" radius="sm" withBorder>
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
};
