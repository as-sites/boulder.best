import { Container, Loader, Stack, Text, Title } from '@mantine/core';
import { HistoryListItem } from '../history/history-list-item.js';
import { shouldShowLocalPendingSeparator } from '../history/merge-session-history.js';
import { useMergedSessionHistory } from '../history/use-merged-session-history.js';

export const HistoryPage = () => {
  const { items, historyQuery } = useMergedSessionHistory();

  if (historyQuery.isPending) {
    return (
      <Container py="xl" size="sm">
        <Stack align="center" gap="sm">
          <Loader size="sm" />
          <Text c="dimmed" size="sm">
            Loading history...
          </Text>
        </Stack>
      </Container>
    );
  }

  if (historyQuery.isError) {
    return (
      <Container py="xl" size="sm">
        <Stack gap="sm">
          <Title order={1}>History</Title>
          <Text c="red" size="sm">
            {historyQuery.error instanceof Error
              ? historyQuery.error.message
              : 'Unable to load history'}
          </Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container py="xl" size="sm">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={1}>History</Title>
          <Text c="dimmed" size="sm">
            Past sessions from your account and anything still waiting to sync
            on this device.
          </Text>
        </Stack>

        {items.length === 0 ? (
          <Text c="dimmed" size="sm">
            No sessions yet.
          </Text>
        ) : (
          <Stack gap="sm">
            {items.map((item, index) => (
              <HistoryListItem
                key={`${item.source}-${item.id}`}
                item={item}
                showLocalSeparator={shouldShowLocalPendingSeparator(
                  items,
                  index,
                )}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
