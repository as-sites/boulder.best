import { useMemo } from 'react';
import type { SessionDetailClimbEntry } from '@boulder/api-contract';
import {
  Badge,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { CheckCircleIcon } from '@phosphor-icons/react';
import { useBlobObjectUrl } from '../hooks/use-blob-object-url.js';
import { formatDurationMs } from '../lib/timer/index.js';
import type { OfflineImage } from '../offline/db/types.js';
import { formatClimbSummary } from './format-climb-summary.js';
import type { SessionDetailSource } from './load-session-detail.js';
import { SessionDetailAttemptRow } from './session-detail-attempt-row.js';
import { sortSyncedImages } from './sort-session-detail.js';

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
            alt={`Climb photo ${image.index + 1}`}
            src={image.photoUrl}
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

export interface SessionDetailClimbEntryCardProps {
  entry: SessionDetailClimbEntry;
  pendingImages: OfflineImage[];
  source: SessionDetailSource;
}

export const SessionDetailClimbEntryCard = ({
  entry,
  pendingImages,
  source,
}: SessionDetailClimbEntryCardProps) => {
  const displayName = entry.name.trim() || 'Climb';
  const completedAttemptCount = entry.climbAttempts.filter(
    (attempt) => attempt.completed === true,
  ).length;
  const climbSummary = formatClimbSummary(
    entry.grade,
    entry.climbAttempts.length,
    completedAttemptCount,
  );
  const isSent = completedAttemptCount > 0;
  const climbNotes = entry.notes.trim();

  const sortedAttempts = useMemo(
    () =>
      [...entry.climbAttempts].sort(
        (left, right) => left.sequenceOrder - right.sequenceOrder,
      ),
    [entry.climbAttempts],
  );

  return (
    <Paper
      p="md"
      withBorder
      {...(isSent
        ? {
            style: {
              borderColor: 'var(--mantine-color-green-6)',
            },
          }
        : {})}
    >
      <Stack gap="sm">
        <Group align="flex-start" justify="space-between" wrap="nowrap">
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600}>{displayName}</Text>
            <Text c="dimmed" size="sm">
              {climbSummary}
            </Text>
          </Stack>
          <Stack align="flex-end" gap={6}>
            {isSent ? (
              <Badge
                color="green"
                leftSection={
                  <CheckCircleIcon aria-hidden size={12} weight="fill" />
                }
                variant="light"
              >
                Sent
              </Badge>
            ) : null}
            <Text ff="monospace" size="sm">
              {formatDurationMs(entry.durationMs)}
            </Text>
          </Stack>
        </Group>

        {climbNotes ? (
          <Text size="sm" style={{ overflowWrap: 'anywhere' }}>
            {climbNotes}
          </Text>
        ) : null}

        {sortedAttempts.length > 0 ? (
          <Stack gap="xs">
            <Text fw={500} size="sm">
              Attempts
            </Text>
            {sortedAttempts.map((attempt, index) => (
              <SessionDetailAttemptRow
                key={attempt.sequenceOrder}
                attempt={attempt}
                attemptNumber={index + 1}
              />
            ))}
          </Stack>
        ) : null}

        <ClimbEntryImages
          entry={entry}
          pendingImages={pendingImages}
          source={source}
        />
      </Stack>
    </Paper>
  );
};
