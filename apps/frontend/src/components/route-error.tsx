import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { Link, type ErrorComponentProps } from '@tanstack/react-router';

/**
 * Router-level error boundary shown inside AppShell for uncaught route
 * failures.
 */
export const RouteError = ({ error, reset }: ErrorComponentProps) => {
  const message =
    error instanceof Error ? error.message : 'Something went wrong';

  return (
    <Container py="xl" size="sm">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1}>Something went wrong</Title>
          <Text c="dimmed" size="sm">
            This page hit an unexpected error. You can try again or return home.
          </Text>
          <Text c="red" size="sm">
            {message}
          </Text>
        </Stack>
        <Group gap="sm">
          <Button onClick={reset}>Try again</Button>
          <Button component={Link} to="/" variant="light">
            Back to home
          </Button>
        </Group>
      </Stack>
    </Container>
  );
};
