import { Container, Stack, Text, Title } from '@mantine/core';

export function TrackerPage() {
  return (
    <Container py="xl" size="sm">
      <Stack gap="sm">
        <Title order={1}>Tracker</Title>
        <Text c="dimmed" size="sm">
          Session tracking will live here.
        </Text>
      </Stack>
    </Container>
  );
}
