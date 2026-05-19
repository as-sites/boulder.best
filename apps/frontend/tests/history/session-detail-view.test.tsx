import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionDetailClimbEntry } from '@boulder/api-contract';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { SessionDetailView } from '../../src/history/session-detail-view.js';
import {
  mapFileToOfflineImage,
  offlineImagesRepository,
  resetOfflineDatabase,
} from '../../src/offline/index.js';

const climbEntry: SessionDetailClimbEntry = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  sequenceOrder: 0,
  durationMs: 45_000,
  type: 'climb',
  name: 'Pink corner route',
  grade: 'V3',
  attempts: 2,
  completed: true,
  notes: null,
  images: [
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      index: 0,
      objectKey: 'user-id/session-id/entry-id/1715600000000-0.webp',
      photoUrl:
        'https://cdn.example.com/user-id/session-id/entry-id/1715600000000-0.webp',
      contentType: 'image/webp',
      contentLength: 512_000,
    },
  ],
};

const breakEntry = {
  id: '423e4567-e89b-12d3-a456-426614174003',
  sequenceOrder: 1,
  durationMs: 300_000,
  type: 'break' as const,
};

const sessionFixture = {
  id: '987fcdeb-51a2-43d7-9012-345678901234',
  gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  gymName: 'Boulder Central',
  startTime: '2026-05-13T10:00:00.000Z',
  endTime: '2026-05-13T12:00:00.000Z',
  totalDurationMs: 7_200_000,
  notes: 'Felt strong today.',
  entries: [climbEntry, breakEntry],
};

describe('session detail view', () => {
  beforeEach(async () => {
    await resetOfflineDatabase();
  });

  it('renders server entries and images in sequence order', () => {
    render(
      <MantineProvider>
        <SessionDetailView
          session={{
            ...sessionFixture,
            entries: [breakEntry, climbEntry],
          }}
          source="server"
        />
      </MantineProvider>,
    );

    const headings = screen.getAllByText(/pink corner route|break/i);
    expect(headings[0]?.textContent).toMatch(/pink corner route/i);
    expect(screen.getByRole('img', { name: /climb photo 1/i })).toBeDefined();
  });

  it('loads pending local images for a climb entry', async () => {
    await offlineImagesRepository.put(
      mapFileToOfflineImage({
        file: new File(['pixels'], 'pending.jpg', { type: 'image/jpeg' }),
        sessionId: sessionFixture.id,
        entryId: climbEntry.id,
        index: 0,
      }),
    );

    render(
      <MantineProvider>
        <SessionDetailView
          session={{
            ...sessionFixture,
            entries: [climbEntry],
          }}
          source="local"
        />
      </MantineProvider>,
    );

    expect(screen.getByText(/pink corner route/i)).toBeDefined();
    await expect(
      offlineImagesRepository.listByEntry(sessionFixture.id, climbEntry.id),
    ).resolves.toHaveLength(1);
  });
});
