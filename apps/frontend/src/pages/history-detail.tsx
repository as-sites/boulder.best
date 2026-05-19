import { useMemo } from 'react';
import { Container, Loader, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { loadSessionDetail } from '../history/load-session-detail.js';
import { SessionDetailView } from '../history/session-detail-view.js';
import { useCachedGymsQuery } from '../tracker/use-cached-gyms-query.js';

export const HistoryDetailPage = () => {
  const { sessionId } = useParams({ from: '/history/$sessionId' });
  const gymsQuery = useCachedGymsQuery();
  const gymNamesById = useMemo(
    () =>
      Object.fromEntries(
        (gymsQuery.data ?? []).map((gym) => [gym.id, gym.name]),
      ),
    [gymsQuery.data],
  );

  const detailQuery = useQuery({
    queryKey: ['session-detail', sessionId, gymNamesById],
    queryFn: async () => await loadSessionDetail(sessionId, gymNamesById),
    enabled: Boolean(sessionId),
  });

  if (detailQuery.isPending || gymsQuery.isPending) {
    return (
      <Container py="xl" size="sm">
        <Stack align="center" gap="sm">
          <Loader size="sm" />
          <Text c="dimmed" size="sm">
            Loading session...
          </Text>
        </Stack>
      </Container>
    );
  }

  if (detailQuery.isError) {
    return (
      <Container py="xl" size="sm">
        <Text c="red" size="sm">
          {detailQuery.error instanceof Error
            ? detailQuery.error.message
            : 'Unable to load session'}
        </Text>
      </Container>
    );
  }

  if (!detailQuery.data) {
    return (
      <Container py="xl" size="sm">
        <Title order={1}>Session not found</Title>
      </Container>
    );
  }

  return (
    <Container py="xl" size="sm">
      <SessionDetailView
        session={detailQuery.data.session}
        source={detailQuery.data.source}
      />
    </Container>
  );
};
