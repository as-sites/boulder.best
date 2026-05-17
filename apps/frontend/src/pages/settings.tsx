import { Container, Stack, Text, Title } from '@mantine/core';

export function SettingsPage() {
  return (
    <Container py="xl" size="sm">
      <Stack gap="sm">
        <Title order={1}>Settings</Title>
        <Text c="dimmed" size="sm">
          Manual offline mode and app preferences will live here.
        </Text>
      </Stack>
    </Container>
  );
}
