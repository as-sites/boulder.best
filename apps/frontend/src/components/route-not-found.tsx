import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';

/** Router-level 404 shown inside AppShell when no route matches. */
export const RouteNotFound = () => (
  <Container size="sm">
    <Stack gap="lg">
      <Stack gap="xs">
        <Title order={1}>Page not found</Title>
        <Text c="dimmed" size="sm">
          That link does not match any page in Boulder Best. Head home or pick a
          section from the menu.
        </Text>
      </Stack>
      <Button component={Link} to="/">
        Back to home
      </Button>
    </Stack>
  </Container>
);
