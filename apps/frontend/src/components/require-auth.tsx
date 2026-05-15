import { useEffect, type ReactElement } from 'react';
import { Center, Loader, Stack, Text } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { authClient } from '../lib/auth-client.js';

export function RequireAuth({ children }: { children: ReactElement }) {
  const session = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session.isPending && !session.data?.user) {
      void navigate({ replace: true, to: '/' });
    }
  }, [navigate, session.data?.user, session.isPending]);

  if (session.isPending) {
    return (
      <Center py="xl">
        <Stack align="center" gap="sm">
          <Loader size="sm" />
          <Text c="dimmed" size="sm">
            Restoring session...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (!session.data?.user) {
    return null;
  }

  return children;
}
