import { useMemo } from 'react';
import type {
  SessionDetailClimbEntry,
  SessionDetailResponse,
} from '@boulder/api-contract';
import { Image, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBlobObjectUrl } from '../hooks/use-blob-object-url.js';
import { formatDurationMs } from '../lib/timer/index.js';
import type { OfflineImage } from '../offline/db/types.js';
import { offlineImagesRepository } from '../offline/repositories/offline-images-repository.js';
import { formatSessionDate } from './format-session-date.js';
import type { SessionDetailSource } from './load-session-detail.js';
import {
  sortSessionDetailEntries,
  sortSyncedImages,
} from './sort-session-detail.js';

const ClimbImagePreview = ({ src, alt }: { src: string; alt: string }) => (
  <Image src={src} alt={alt} radius="sm" h={96} w={96} fit="cover" />
);

const PendingImagePreview = ({ image }: { image: OfflineImage }) => {
  const src = useBlobObjectUrl(image.blob);

  if (!src) {
    return null;
  }

  return (
    <ClimbImagePreview
      src={src}
      alt={`Pending climb photo ${image.index + 1}`}
    />
  );
};

const ClimbEntryImages = ({
  entry,
  source,
  pendingImages,
}: {
  entry: SessionDetailClimbEntry;
  source: SessionDetailSource;
  pendingImages: OfflineImage[];
}) => {
  if (source === 'server') {
    const images = sortSyncedImages(entry.images);
    if (images.length === 0) {
      return null;
    }

    return (
      <SimpleGrid cols={{ base: 3, xs: 4 }} spacing="xs">
        {images.map((image) => (
          <ClimbImagePreview
            key={image.id}
            src={image.photoUrl}
            alt={`Climb photo ${image.index + 1}`}
          />
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
    for (const img of allPendingImages) {
      const bucket = map.get(img.entryId);
      if (bucket) {
        bucket.push(img);
      } else {
        map.set(img.entryId, [img]);
      }
    }
    return map;
  }, [allPendingImages]);

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={2}>{session.gymName}</Title>
        <Text c="dimmed" size="sm">
          {formatSessionDate(session.startTime)} –{' '}
          {formatSessionDate(session.endTime)}
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
                    source={source}
                    pendingImages={pendingImagesByEntryId.get(entry.id) ?? []}
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
