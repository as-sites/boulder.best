import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthActions } from '../src/components/auth-actions.js';
import type { authClient } from '../src/lib/auth-client.js';

const authMocks = vi.hoisted(() => ({
  addPasskey: vi.fn(),
  emailSignIn: vi.fn(),
  emailSignUp: vi.fn(),
  passkeySignIn: vi.fn(),
  signOut: vi.fn(),
  socialSignIn: vi.fn(),
  useSession: vi.fn(),
}));

const locationAssign = vi.hoisted(() => vi.fn());

const oauthCallbackURL = (): string =>
  `${window.location.pathname}${window.location.search}`;

vi.mock(import('../src/lib/auth-client.js'), () => ({
  authClient: {
    signIn: {
      email: authMocks.emailSignIn,
      social: authMocks.socialSignIn,
      passkey: authMocks.passkeySignIn,
    },
    signUp: {
      email: authMocks.emailSignUp,
    },
    signOut: authMocks.signOut,
    passkey: {
      addPasskey: authMocks.addPasskey,
    },
    useSession: authMocks.useSession,
    getSession: vi.fn(),
  },
}));

const renderAuthActions = () =>
  render(
    <MantineProvider>
      <AuthActions />
    </MantineProvider>,
  );

describe(AuthActions, () => {
  beforeEach(() => {
    locationAssign.mockReset();
    vi.spyOn(window.location, 'assign').mockImplementation(locationAssign);
    window.history.pushState({}, '', '/auth/account');

    authMocks.emailSignIn.mockResolvedValue({ data: {}, error: null });
    authMocks.emailSignUp.mockResolvedValue({ data: {}, error: null });
    authMocks.signOut.mockResolvedValue({ data: {}, error: null });
    authMocks.socialSignIn.mockResolvedValue({
      data: {
        url: 'https://oauth.example/authorize',
        redirect: false,
      },
      error: null,
    });
    authMocks.passkeySignIn.mockResolvedValue({ data: {}, error: null });
    authMocks.addPasskey.mockResolvedValue({ data: {}, error: null });
    authMocks.useSession.mockReturnValue({
      data: null,
      isPending: false,
    } as ReturnType<typeof authClient.useSession>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows session restoration while account state is pending', () => {
    authMocks.useSession.mockReturnValue({
      data: null,
      isPending: true,
    } as ReturnType<typeof authClient.useSession>);

    renderAuthActions();

    expect(screen.getByText('Restoring session...')).toBeInTheDocument();
  });

  it('signs in with email and password', async () => {
    renderAuthActions();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ally@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByTestId('auth-submit'));

    await waitFor(() =>
      expect(authMocks.emailSignIn.mock.calls.length).toBeGreaterThan(0),
    );
    expect(authMocks.emailSignIn).toHaveBeenCalledWith({
      email: 'ally@example.com',
      password: 'secret123',
    });
  });

  it('signs up with name, email, and password', async () => {
    renderAuthActions();

    fireEvent.click(
      screen.getByRole('button', { name: /don't have an account\? sign up/i }),
    );

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Ally' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ally@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByTestId('auth-submit'));

    await waitFor(() =>
      expect(authMocks.emailSignUp.mock.calls.length).toBeGreaterThan(0),
    );
    expect(authMocks.emailSignUp).toHaveBeenCalledWith({
      email: 'ally@example.com',
      password: 'secret123',
      name: 'Ally',
    });
  });

  it('shows error message when sign-in fails', async () => {
    authMocks.emailSignIn.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    });
    renderAuthActions();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ally@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByTestId('auth-submit'));

    await waitFor(() => screen.getByText('Invalid credentials'));
    expect(screen.getByText('Invalid credentials')).toBeDefined();
  });

  it('signs out authenticated user', async () => {
    authMocks.useSession.mockReturnValue({
      data: { user: { email: 'ally@example.com' } },
    } as ReturnType<typeof authClient.useSession>);

    renderAuthActions();

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() =>
      expect(authMocks.signOut.mock.calls.length).toBeGreaterThan(0),
    );
    expect(authMocks.signOut).toHaveBeenCalled();
  });

  it('exposes visible labels on provider buttons', () => {
    renderAuthActions();

    expect(
      screen.getByRole('button', { name: /continue with google/i }),
    ).toHaveAccessibleName(/continue with google/i);
    expect(
      screen.getByRole('button', { name: /continue with discord/i }),
    ).toHaveAccessibleName(/continue with discord/i);
    expect(
      screen.getByRole('button', { name: /sign in with passkey/i }),
    ).toHaveAccessibleName(/sign in with passkey/i);
  });

  it('starts Google sign-in', async () => {
    renderAuthActions();

    fireEvent.click(screen.getByTestId('auth-google'));

    await waitFor(() =>
      expect(authMocks.socialSignIn.mock.calls.length).toBeGreaterThan(0),
    );
    expect(authMocks.socialSignIn).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: oauthCallbackURL(),
      disableRedirect: true,
    });
    expect(locationAssign).toHaveBeenCalledWith(
      'https://oauth.example/authorize',
    );
  });

  it('starts Discord sign-in', async () => {
    renderAuthActions();

    fireEvent.click(screen.getByTestId('auth-discord'));

    await waitFor(() =>
      expect(authMocks.socialSignIn.mock.calls.length).toBeGreaterThan(0),
    );
    expect(authMocks.socialSignIn).toHaveBeenCalledWith({
      provider: 'discord',
      callbackURL: oauthCallbackURL(),
      disableRedirect: true,
    });
    expect(locationAssign).toHaveBeenCalledWith(
      'https://oauth.example/authorize',
    );
  });

  it('shows an error when social sign-in returns no authorization URL', async () => {
    authMocks.socialSignIn.mockResolvedValue({ data: {}, error: null });
    renderAuthActions();

    fireEvent.click(screen.getByTestId('auth-google'));

    await waitFor(() =>
      expect(
        screen.getByText(
          /could not start google sign-in\. no authorization url was returned/i,
        ),
      ).toBeInTheDocument(),
    );
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it('starts explicit passkey sign-in without conditional UI', async () => {
    renderAuthActions();

    fireEvent.click(screen.getByTestId('auth-passkey'));

    await waitFor(() =>
      expect(authMocks.passkeySignIn.mock.calls.length).toBeGreaterThan(0),
    );
    expect(authMocks.passkeySignIn).toHaveBeenCalledWith({
      autoFill: false,
    });
  });

  it('only registers passkeys for authenticated users', async () => {
    authMocks.useSession.mockReturnValue({
      data: { user: { email: 'ally@example.com' } },
    } as ReturnType<typeof authClient.useSession>);

    renderAuthActions();

    fireEvent.change(screen.getByLabelText(/passkey name/i), {
      target: { value: 'Laptop' },
    });
    fireEvent.click(screen.getByRole('button', { name: /register passkey/i }));

    await waitFor(() =>
      expect(authMocks.addPasskey.mock.calls.length).toBeGreaterThan(0),
    );
    expect(authMocks.addPasskey).toHaveBeenCalledWith({
      name: 'Laptop',
      authenticatorAttachment: 'platform',
    });
  });
});
