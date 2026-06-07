import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import {
  ClockCounterClockwiseIcon,
  DownloadSimpleIcon,
} from '@phosphor-icons/react';
import { PageError } from '../components/page-error.js';
import { PageLoading } from '../components/page-loading.js';
import { downloadHistoryExport } from '../history/export-history.js';
import { groupHistoryByDate } from '../history/group-history-by-date.js';
import { HistoryListItem } from '../history/history-list-item.js';
import { shouldShowLocalPendingSeparator } from '../history/merge-session-history.js';
import { useMergedSessionHistory } from '../history/use-merged-session-history.js';

export const HistoryPage = () => {
  const { items, historyQuery, isAuthenticated } = useMergedSessionHistory();
  const groupedItems = groupHistoryByDate(items);

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
      <Stack gap="lg">
        <Group align="flex-start" justify="space-between">
          <Stack gap={4}>
            <Title order={1}>History</Title>
            <Text c="dimmed" size="sm">
              {isAuthenticated
                ? 'Past sessions from your account and anything still waiting to sync on this device.'
                : 'Sessions saved on this device only. Sign in to sync them and see your cloud history.'}
            </Text>
          </Stack>
          <Group gap="xs">
            <Button
              disabled={items.length === 0}
              leftSection={<DownloadSimpleIcon aria-hidden size={16} />}
              size="compact-sm"
              variant="light"
              onClick={() => {
                downloadHistoryExport(items, 'json');
              }}
            >
              Export JSON
            </Button>
            <Button
              disabled={items.length === 0}
              leftSection={<DownloadSimpleIcon aria-hidden size={16} />}
              size="compact-sm"
              variant="light"
              onClick={() => {
                downloadHistoryExport(items, 'csv');
              }}
            >
              Export CSV
            </Button>
          </Group>
        </Group>

        {items.length === 0 ? (
          <Stack align="center" gap="xs" py="xl">
            <ClockCounterClockwiseIcon
              aria-hidden
              color="var(--mantine-color-dimmed)"
              size={40}
            />
            <Text c="dimmed" size="sm" ta="center">
              No sessions yet. Finish a session in the tracker to see it here.
            </Text>
          </Stack>
        ) : (
          <Stack gap="lg">
            {groupedItems.map((group) => (
              <Stack key={group.key} gap="sm">
                <Text fw={600} size="sm">
                  {group.label}
                </Text>
                <Stack gap="sm">
                  {group.items.map((item, indexInGroup) => (
                    <HistoryListItem
                      key={`${item.source}-${item.id}`}
                      item={item}
                      showLocalSeparator={shouldShowLocalPendingSeparator(
                        group.items,
                        indexInGroup,
                      )}
                    />
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
