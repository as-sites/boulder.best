import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthActions } from '../src/app.js';
import type { authClient } from '../src/lib/auth-client.js';

const authMocks = vi.hoisted(() => ({
  addPasskey: vi.fn(),
  passkeySignIn: vi.fn(),
  socialSignIn: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock(import('../src/lib/auth-client.js'), () => ({
  authClient: {
    signIn: {
      social: authMocks.socialSignIn,
      passkey: authMocks.passkeySignIn,
    },
    passkey: {
      addPasskey: authMocks.addPasskey,
    },
    useSession: authMocks.useSession,
  },
}));

function renderAuthActions() {
  return render(
    <MantineProvider>
      <AuthActions />
    </MantineProvider>,
  );
}

describe(AuthActions, () => {
  beforeEach(() => {
    authMocks.socialSignIn.mockResolvedValue({
      data: {},
      error: null,
    });
    authMocks.passkeySignIn.mockResolvedValue({
      data: {},
      error: null,
    });
    authMocks.addPasskey.mockResolvedValue({
      data: {},
      error: null,
    });
    authMocks.useSession.mockReturnValue({
      data: null,
    } as ReturnType<typeof authClient.useSession>);
  });

  it('starts Google sign-in', async () => {
    renderAuthActions();

    fireEvent.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() =>
      expect(authMocks.socialSignIn.mock.calls.length).toBeGreaterThan(0),
    );
    expect(authMocks.socialSignIn).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: window.location.href,
    });
  });

  it('starts Discord sign-in', async () => {
    renderAuthActions();

    fireEvent.click(screen.getByRole('button', { name: /discord/i }));

    await waitFor(() =>
      expect(authMocks.socialSignIn.mock.calls.length).toBeGreaterThan(0),
    );
    expect(authMocks.socialSignIn).toHaveBeenCalledWith({
      provider: 'discord',
      callbackURL: window.location.href,
    });
  });

  it('starts explicit passkey sign-in without conditional UI', async () => {
    renderAuthActions();

    fireEvent.click(
      screen.getByRole('button', { name: /sign in with passkey/i }),
    );

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
