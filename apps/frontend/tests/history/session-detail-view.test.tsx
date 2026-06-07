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
  notes: '',
  climbAttempts: [
    {
      sequenceOrder: 0,
      durationMs: 20_000,
      completed: false,
      notes: 'Slipped on crux',
    },
    { sequenceOrder: 1, durationMs: 25_000, completed: true, notes: '' },
  ],
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
  location: 'Main Wall',
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

  it('shows the session location under the gym name', () => {
    render(
      <MantineProvider>
        <SessionDetailView session={sessionFixture} source="server" />
      </MantineProvider>,
    );

    expect(screen.getByText('Main Wall')).toBeDefined();
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

    expect(screen.getByText('Pink corner route')).toBeDefined();
    expect(screen.getByText('Break')).toBeDefined();
    expect(screen.getByRole('img', { name: /climb photo 1/i })).toBeDefined();
  });

  it('shows send badges and attempt completion details', () => {
    render(
      <MantineProvider>
        <SessionDetailView session={sessionFixture} source="server" />
      </MantineProvider>,
    );

    expect(screen.getByText('V3 · 2 attempts · 1 completed')).toBeDefined();
    expect(screen.getByText('1 send')).toBeDefined();
    expect(screen.getByText('Sent')).toBeDefined();
    expect(screen.getByText('Slipped on crux')).toBeDefined();
    expect(screen.getByText('Attempt 2')).toBeDefined();
  });

  it('shows zero completed attempts in climb summaries', () => {
    render(
      <MantineProvider>
        <SessionDetailView
          session={{
            ...sessionFixture,
            entries: [
              {
                ...climbEntry,
                climbAttempts: [
                  {
                    sequenceOrder: 0,
                    durationMs: 20_000,
                    completed: false,
                    notes: '',
                  },
                  {
                    sequenceOrder: 1,
                    durationMs: 25_000,
                    completed: false,
                    notes: '',
                  },
                ],
              },
            ],
          }}
          source="server"
        />
      </MantineProvider>,
    );

    expect(screen.getByText('V3 · 2 attempts · 0 completed')).toBeDefined();
  });

  it('counts one send per climb even when multiple attempts are completed', () => {
    render(
      <MantineProvider>
        <SessionDetailView
          session={{
            ...sessionFixture,
            entries: [
              {
                ...climbEntry,
                climbAttempts: [
                  {
                    sequenceOrder: 0,
                    durationMs: 20_000,
                    completed: true,
                    notes: '',
                  },
                  {
                    sequenceOrder: 1,
                    durationMs: 25_000,
                    completed: true,
                    notes: '',
                  },
                ],
              },
            ],
          }}
          source="server"
        />
      </MantineProvider>,
    );

    expect(screen.getByText('1 send')).toBeDefined();
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
