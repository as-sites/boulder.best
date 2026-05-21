import {
  Avatar,
  Group,
  Loader,
  Menu,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { SignOutIcon, UserCircleIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import { authClient } from '../lib/auth-client.js';

const accountPath = '/auth/account' as const;

const userInitials = (
  name: string | null | undefined,
  email: string | null | undefined,
): string => {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    }
    return trimmedName.slice(0, 2).toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return '?';
};

export const AppUserMenu = () => {
  const session = authClient.useSession();
  const user = session.data?.user;

  if (session.isPending) {
    return <Loader aria-label="Loading account" size="sm" />;
  }

  const isSignedIn = Boolean(user);
  const displayName = user?.name ?? user?.email ?? 'Guest';
  const email = user?.email;
  const initials = userInitials(user?.name, user?.email);

  return (
    <Menu position="bottom-end" width={260} withArrow>
      <Menu.Target>
        <UnstyledButton
          aria-label="Account menu"
          style={{
            borderRadius: 'var(--mantine-radius-xl)',
            lineHeight: 0,
          }}
        >
          <Avatar
            alt=""
            color="blue"
            radius="xl"
            size="md"
            src={user?.image ?? null}
            variant={isSignedIn ? 'filled' : 'light'}
          >
            {isSignedIn ? (
              initials
            ) : (
              <UserCircleIcon aria-hidden size={22} weight="duotone" />
            )}
          </Avatar>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        {isSignedIn ? (
          <>
            <Menu.Label>
              <Group gap="sm" wrap="nowrap">
                <Avatar
                  alt=""
                  color="blue"
                  radius="xl"
                  size="md"
                  src={user?.image ?? null}
                >
                  {initials}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={500} lineClamp={1} size="sm">
                    {displayName}
                  </Text>
                  {email ? (
                    <Text c="dimmed" lineClamp={1} size="xs">
                      {email}
                    </Text>
                  ) : null}
                </div>
              </Group>
            </Menu.Label>
            <Menu.Divider />
          </>
        ) : null}

        <Menu.Item
          component={Link}
          leftSection={<UserCircleIcon size={16} />}
          to={accountPath}
        >
          {isSignedIn ? 'Account settings' : 'Sign in'}
        </Menu.Item>

        {isSignedIn ? (
          <Menu.Item
            color="red"
            leftSection={<SignOutIcon size={16} />}
            onClick={() => void authClient.signOut()}
          >
            Sign out
          </Menu.Item>
        ) : null}
      </Menu.Dropdown>
    </Menu>
  );
};
