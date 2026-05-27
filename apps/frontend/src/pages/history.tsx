import { Container, Stack, Text, Title } from '@mantine/core';
import { PageError } from '../components/page-error.js';
import { PageLoading } from '../components/page-loading.js';
import { HistoryListItem } from '../history/history-list-item.js';
import { shouldShowLocalPendingSeparator } from '../history/merge-session-history.js';
import { useMergedSessionHistory } from '../history/use-merged-session-history.js';

export const HistoryPage = () => {
  const { items, historyQuery, isAuthenticated } = useMergedSessionHistory();

  if (historyQuery.isPending) {
    return <PageLoading message="Loading history..." />;
  }

  if (historyQuery.isError) {
    return (
      <PageError
        title="History"
        message={
          historyQuery.error instanceof Error
            ? historyQuery.error.message
            : 'Unable to load history'
        }
      />
    );
  }

  return (
    <Container size="sm">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={1}>History</Title>
          <Text c="dimmed" size="sm">
            {isAuthenticated
              ? 'Past sessions from your account and anything still waiting to sync on this device.'
              : 'Sessions saved on this device only. Sign in to sync them and see your cloud history.'}
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
