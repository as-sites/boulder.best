import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Anchor,
  Button,
  Divider,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { FingerprintIcon } from '@phosphor-icons/react';
import { PasswordInput } from '@trendcapital/react-hook-form-mantine/PasswordInput';
import { TextInput as FormTextInput } from '@trendcapital/react-hook-form-mantine/TextInput';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { authClient, type OAuthProvider } from '../lib/auth-client.js';
import { DiscordIcon, GoogleIcon } from './auth-provider-icons.js';

const authResult = (
  result: { error?: { message?: string | undefined } | null },
  fallback: string,
): { message: string; isError: boolean } => {
  if (result.error) {
    return { message: result.error.message ?? fallback, isError: true };
  }
  return { message: fallback, isError: false };
};

const socialSignInRedirectSchema = z.object({
  url: z.url(),
});

const readSocialAuthorizationUrl = (data: unknown): string | null => {
  const parsed = socialSignInRedirectSchema.safeParse(data);
  return parsed.success ? parsed.data.url : null;
};

const signInSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(1, 'Name is required'),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

const SignInForm = ({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (data: SignInValues) => Promise<void>;
}) => {
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
      >
        <Stack gap="sm">
          <FormTextInput<SignInValues>
            disabled={disabled}
            label="Email"
            name="email"
            placeholder="you@example.com"
            radius="md"
            type="email"
          />
          <PasswordInput<SignInValues>
            disabled={disabled}
            label="Password"
            name="password"
            radius="md"
          />
          <Button
            data-testid="auth-submit"
            disabled={disabled}
            loading={disabled}
            radius="md"
            type="submit"
          >
            Sign in
          </Button>
        </Stack>
      </form>
    </FormProvider>
  );
};

const SignUpForm = ({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (data: SignUpValues) => Promise<void>;
}) => {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', name: '' },
  });

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
      >
        <Stack gap="sm">
          <FormTextInput<SignUpValues>
            disabled={disabled}
            label="Name"
            name="name"
            placeholder="Your name"
            radius="md"
          />
          <FormTextInput<SignUpValues>
            disabled={disabled}
            label="Email"
            name="email"
            placeholder="you@example.com"
            radius="md"
            type="email"
          />
          <PasswordInput<SignUpValues>
            disabled={disabled}
            label="Password"
            name="password"
            radius="md"
          />
          <Button
            data-testid="auth-submit"
            disabled={disabled}
            loading={disabled}
            radius="md"
            type="submit"
          >
            Create account
          </Button>
        </Stack>
      </form>
    </FormProvider>
  );
};

export const AuthActions = () => {
  const session = authClient.useSession();
  const isAuthenticated = Boolean(session.data?.user);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
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

  const signInWithEmail = async ({ email, password }: SignInValues) => {
    await runAction(async () => {
      const result = await authClient.signIn.email({ email, password });
      return authResult(result, 'Signed in.');
    });
  };

  const signUpWithEmail = async ({ email, password, name }: SignUpValues) => {
    await runAction(async () => {
      const result = await authClient.signUp.email({ email, password, name });
      return authResult(result, 'Account created.');
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
      const callbackURL = `${window.location.pathname}${window.location.search}`;
      const result = await authClient.signIn.social({
        provider,
        callbackURL,
        disableRedirect: true,
      });
      if (result.error) {
        return authResult(result, `Could not start ${provider} sign-in.`);
      }
      const authorizationUrl = readSocialAuthorizationUrl(result.data);
      if (!authorizationUrl) {
        return {
          message: `Could not start ${provider} sign-in. No authorization URL was returned.`,
          isError: true,
        };
      }
      window.location.assign(authorizationUrl);
      return { message: `Redirecting to ${provider}…`, isError: false };
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
      <Paper p="lg" radius="md" withBorder>
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
      <Paper p="lg" radius="md" withBorder>
        <Stack gap="md">
          <Text size="sm">
            Signed in as{' '}
            <Text component="span" fw={500} inherit>
              {session.data?.user.email}
            </Text>
          </Text>
          <Group gap="sm">
            <Button
              disabled={isSubmitting}
              loading={isSubmitting}
              onClick={() => void signOut()}
              radius="md"
              variant="default"
            >
              Sign out
            </Button>
          </Group>
          <Divider label="Passkeys" labelPosition="left" />
          <Stack gap="sm">
            <TextInput
              disabled={isSubmitting}
              label="Passkey name"
              onChange={(event) => setPasskeyName(event.currentTarget.value)}
              placeholder="This device"
              radius="md"
              value={passkeyName}
            />
            <Button
              disabled={isSubmitting}
              leftSection={<FingerprintIcon aria-hidden size={18} />}
              onClick={() => void registerPasskey()}
              radius="md"
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

  const isSignIn = mode === 'signin';

  return (
    <Paper p="lg" radius="md" withBorder>
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={2}>
            {isSignIn ? 'Welcome back' : 'Create your account'}
          </Title>
          <Text c="dimmed" size="sm">
            {isSignIn
              ? 'Sign in to sync sessions across devices.'
              : 'Create an account to back up your climbing history.'}
          </Text>
        </Stack>

        <Stack>
          <Button
            data-testid="auth-google"
            disabled={isSubmitting}
            fullWidth
            leftSection={<GoogleIcon />}
            onClick={() => void signInWithProvider('google')}
            radius="md"
            variant="default"
          >
            Continue with Google
          </Button>
          <Button
            data-testid="auth-discord"
            disabled={isSubmitting}
            fullWidth
            leftSection={<DiscordIcon />}
            onClick={() => void signInWithProvider('discord')}
            radius="md"
            variant="default"
          >
            Continue with Discord
          </Button>
        </Stack>

        <Button
          data-testid="auth-passkey"
          disabled={isSubmitting}
          fullWidth
          leftSection={<FingerprintIcon aria-hidden size={18} />}
          onClick={() => void signInWithPasskey()}
          radius="md"
          variant="default"
        >
          Sign in with passkey
        </Button>

        <Divider label="Or continue with email" labelPosition="center" />

        {isSignIn ? (
          <SignInForm disabled={isSubmitting} onSubmit={signInWithEmail} />
        ) : (
          <SignUpForm disabled={isSubmitting} onSubmit={signUpWithEmail} />
        )}

        <Anchor
          c="dimmed"
          component="button"
          onClick={() => switchMode(isSignIn ? 'signup' : 'signin')}
          size="sm"
          type="button"
        >
          {isSignIn
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </Anchor>

        {statusEl}
      </Stack>
    </Paper>
  );
};
