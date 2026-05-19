import type {
  SessionDetailClimbEntry,
  SessionDetailResponse,
  SyncedImage,
} from '@boulder/api-contract';
import { Image, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBlobObjectUrl } from '../hooks/use-blob-object-url.js';
import { formatDurationMs } from '../lib/timer/index.js';
import type { OfflineImage } from '../offline/db/types.js';
import { offlineImagesRepository } from '../offline/repositories/offline-images-repository.js';
import type { SessionDetailSource } from './load-session-detail.js';
import {
  sortSessionDetailEntries,
  sortSyncedImages,
} from './sort-session-detail.js';

const SyncedImagePreview = ({ image }: { image: SyncedImage }) => (
  <Image
    src={image.photoUrl}
    alt={`Climb photo ${image.index + 1}`}
    radius="sm"
    h={96}
    w={96}
    fit="cover"
  />
);

const PendingImagePreview = ({ image }: { image: OfflineImage }) => {
  const src = useBlobObjectUrl(image.blob);

  if (!src) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={`Pending climb photo ${image.index + 1}`}
      radius="sm"
      h={96}
      w={96}
      fit="cover"
    />
  );
};

const ClimbEntryImages = ({
  entry,
  sessionId,
  source,
}: {
  entry: SessionDetailClimbEntry;
  sessionId: string;
  source: SessionDetailSource;
}) => {
  const pendingImages = useLiveQuery(
    async () => {
      if (source !== 'local') {
        return [];
      }

      return await offlineImagesRepository.listByEntry(sessionId, entry.id);
    },
    [entry.id, sessionId, source],
    [],
  );

  if (source === 'server') {
    const images = sortSyncedImages(entry.images);
    if (images.length === 0) {
      return null;
    }

    return (
      <SimpleGrid cols={{ base: 3, xs: 4 }} spacing="xs">
        {images.map((image) => (
          <SyncedImagePreview key={image.id} image={image} />
        ))}
      </SimpleGrid>
    );
  }

  if (pendingImages.length === 0) {
    return null;
  }

  return (
    <SimpleGrid cols={{ base: 3, xs: 4 }} spacing="xs">
      {pendingImages.map((image) => (
        <PendingImagePreview key={image.id} image={image} />
      ))}
    </SimpleGrid>
  );
};

export interface SessionDetailViewProps {
  session: SessionDetailResponse;
  source: SessionDetailSource;
}

export const SessionDetailView = ({
  session,
  source,
}: SessionDetailViewProps) => {
  const entries = sortSessionDetailEntries(session.entries);

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={2}>{session.gymName}</Title>
        <Text c="dimmed" size="sm">
          {new Date(session.startTime).toLocaleString()} –{' '}
          {new Date(session.endTime).toLocaleString()}
        </Text>
        <Text size="sm">Total {formatDurationMs(session.totalDurationMs)}</Text>
        {session.notes ? <Text size="sm">{session.notes}</Text> : null}
      </Stack>

      <Stack gap="sm">
        {entries.map((entry) => (
          <Paper key={entry.id} p="md" withBorder>
            <Stack gap="xs">
              <Text fw={600}>
                {entry.type === 'climb' ? (entry.name ?? 'Climb') : 'Break'}
              </Text>
              <Text size="sm">{formatDurationMs(entry.durationMs)}</Text>
              {entry.type === 'climb' ? (
                <>
                  {entry.grade ? (
                    <Text size="sm">Grade {entry.grade}</Text>
                  ) : null}
                  {entry.attempts ? (
                    <Text size="sm">{entry.attempts} attempts</Text>
                  ) : null}
                  {entry.notes ? <Text size="sm">{entry.notes}</Text> : null}
                  <ClimbEntryImages
                    entry={entry}
                    sessionId={session.id}
                    source={source}
                  />
                </>
              ) : null}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
};
