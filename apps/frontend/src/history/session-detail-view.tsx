import { useMemo } from 'react';
import type {
  SessionDetailClimbEntry,
  SessionDetailResponse,
} from '@boulder/api-contract';
import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { ClockIcon, MountainsIcon, TimerIcon } from '@phosphor-icons/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatDurationMs } from '../lib/timer/index.js';
import type { OfflineImage } from '../offline/db/types.js';
import { offlineImagesRepository } from '../offline/repositories/offline-images-repository.js';
import { formatSessionDate } from './format-session-date.js';
import type { SessionDetailSource } from './load-session-detail.js';
import { SessionDetailBreakEntryCard } from './session-detail-break-entry.js';
import { SessionDetailClimbEntryCard } from './session-detail-climb-entry.js';
import { sortSessionDetailEntries } from './sort-session-detail.js';

export interface SessionDetailViewProps {
  session: SessionDetailResponse;
  source: SessionDetailSource;
}

export const SessionDetailView = ({
  session,
  source,
}: SessionDetailViewProps) => {
  const { entries, climbCount, breakCount, sendCount } = useMemo(() => {
    const sorted = sortSessionDetailEntries(session.entries);
    const byType = Object.groupBy(sorted, (entry) => entry.type);
    const climbs = (byType.climb ?? []).filter(
      (entry): entry is SessionDetailClimbEntry => entry.type === 'climb',
    );

    return {
      entries: sorted,
      climbCount: climbs.length,
      breakCount: byType.break?.length ?? 0,
      sendCount: climbs.filter((climb) =>
        climb.climbAttempts.some((attempt) => attempt.completed === true),
      ).length,
    };
  }, [session.entries]);
  const sessionNotes = session.notes.trim();

  const allPendingImages = useLiveQuery(
    async () => {
      if (source !== 'local') {
        return [];
      }

      return await offlineImagesRepository.listBySession(session.id);
    },
    [source, session.id],
    [],
  );

  const pendingImagesByEntryId = useMemo(() => {
    const map = new Map<string, OfflineImage[]>();
    for (const image of allPendingImages) {
      const bucket = map.get(image.entryId);
      if (bucket) {
        bucket.push(image);
      } else {
        map.set(image.entryId, [image]);
      }
    }
    return map;
  }, [allPendingImages]);

  return (
    <Stack gap="lg">
      <Stack gap="sm">
        <Stack gap={4}>
          <Title order={1}>{session.gymName}</Title>
          {session.location ? (
            <Text c="dimmed" size="sm">
              {session.location}
            </Text>
          ) : null}
        </Stack>

        <Group gap="xs">
          <Badge
            leftSection={<ClockIcon aria-hidden size={12} />}
            variant="light"
          >
            {formatSessionDate(session.startTime)} –{' '}
            {formatSessionDate(session.endTime)}
          </Badge>
          <Badge
            leftSection={<TimerIcon aria-hidden size={12} />}
            variant="light"
          >
            {formatDurationMs(session.totalDurationMs)}
          </Badge>
        </Group>

        <Group gap="xs">
          <Badge
            leftSection={<MountainsIcon aria-hidden size={12} />}
            variant="outline"
          >
            {climbCount} {climbCount === 1 ? 'climb' : 'climbs'}
          </Badge>
          {sendCount > 0 ? (
            <Badge color="green" variant="light">
              {sendCount} {sendCount === 1 ? 'send' : 'sends'}
            </Badge>
          ) : null}
          {breakCount > 0 ? (
            <Badge variant="outline">
              {breakCount} {breakCount === 1 ? 'break' : 'breaks'}
            </Badge>
          ) : null}
        </Group>

        {sessionNotes ? (
          <Paper p="md" withBorder>
            <Text size="sm" style={{ overflowWrap: 'anywhere' }}>
              {sessionNotes}
            </Text>
          </Paper>
        ) : null}
      </Stack>

      <Stack gap="sm">
        <Text fw={600} size="sm">
          Timeline
        </Text>
        {entries.map((entry) =>
          entry.type === 'climb' ? (
            <SessionDetailClimbEntryCard
              key={entry.id}
              entry={entry}
              pendingImages={pendingImagesByEntryId.get(entry.id) ?? []}
              source={source}
            />
          ) : (
            <SessionDetailBreakEntryCard key={entry.id} entry={entry} />
          ),
        )}
      </Stack>
    </Stack>
  );
};
