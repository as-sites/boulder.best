import { useMemo } from 'react';
import { Container, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { PageError } from '../components/page-error.js';
import { PageLoading } from '../components/page-loading.js';
import {
  loadSessionDetail,
  withResolvedGymName,
} from '../history/load-session-detail.js';
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
    queryKey: ['session-detail', sessionId],
    queryFn: async () => await loadSessionDetail(sessionId, gymNamesById),
    enabled: Boolean(sessionId),
  });

  const resolvedDetail = useMemo(
    () =>
      detailQuery.data
        ? withResolvedGymName(detailQuery.data, gymNamesById)
        : null,
    [detailQuery.data, gymNamesById],
  );

  if (detailQuery.isPending || gymsQuery.isPending) {
    return <PageLoading message="Loading session..." />;
  }

  if (detailQuery.isError) {
    return (
      <PageError
        message={
          detailQuery.error instanceof Error
            ? detailQuery.error.message
            : 'Unable to load session'
        }
      />
    );
  }

  if (!resolvedDetail) {
    return (
      <Container py="xl" size="sm">
        <Title order={1}>Session not found</Title>
      </Container>
    );
  }

  return (
    <Container py="xl" size="sm">
      <SessionDetailView
        session={resolvedDetail.session}
        source={resolvedDetail.source}
      />
    </Container>
  );
};
