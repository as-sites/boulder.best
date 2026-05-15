import { Container, Stack, Text, Title } from '@mantine/core';

export function HistoryPage() {
  return (
    <Container py="xl" size="sm">
      <Stack gap="sm">
        <Title order={1}>History</Title>
        <Text c="dimmed" size="sm">
          Past sessions will appear here.
        </Text>
      </Stack>
    </Container>
  );
}
