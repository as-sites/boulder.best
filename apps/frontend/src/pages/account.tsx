import { Container, Stack, Text, Title } from '@mantine/core';
import { AuthActions } from '../components/auth-actions.js';

export const AccountPage = () => (
  <Container py="xl" size="sm">
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={1}>Account</Title>
        <Text c="dimmed" size="sm">
          Sign in, create an account, or manage passkeys.
        </Text>
      </Stack>
      <AuthActions />
    </Stack>
  </Container>
);
