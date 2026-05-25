import { beforeEach, describe, expect, it } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  mapFileToOfflineImage,
  offlineImagesRepository,
  resetOfflineDatabase,
} from '../../src/offline/index.js';
import { ClimbPhotoAttachments } from '../../src/tracker/climb-photo-attachments.js';

const sessionId = 'a1b2c3d4-e5f6-4789-a234-56789abcdef0';
const entryId = 'b2c3d4e5-f6a7-4890-b345-6789abcdef01';

const renderAttachments = (disabled = false) =>
  render(
    <MantineProvider>
      <ClimbPhotoAttachments
        sessionId={sessionId}
        entryId={entryId}
        disabled={disabled}
      />
    </MantineProvider>,
  );

describe('climb photo attachments', () => {
  beforeEach(async () => {
    await resetOfflineDatabase();
  });

  it('renders previews for multiple stored photos', async () => {
    await offlineImagesRepository.put(
      mapFileToOfflineImage({
        file: new File(['one'], 'one.jpg', { type: 'image/jpeg' }),
        sessionId,
        entryId,
        index: 0,
      }),
    );
    await offlineImagesRepository.put(
      mapFileToOfflineImage({
        file: new File(['two'], 'two.png', { type: 'image/png' }),
        sessionId,
        entryId,
        index: 1,
      }),
    );

    renderAttachments();

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /delete photo/i }),
      ).toHaveLength(2);
    });
    await expect(
      offlineImagesRepository.listByEntry(sessionId, entryId),
    ).resolves.toHaveLength(2);
  });

  it('deletes a pending photo from storage', async () => {
    const image = mapFileToOfflineImage({
      file: new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' }),
      sessionId,
      entryId,
      index: 0,
      imageId: 'c3d4e5f6-a7b8-4901-c456-789abcdef012',
    });
    await offlineImagesRepository.put(image);

    renderAttachments();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /delete photo/i }),
      ).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /delete photo/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /delete photo/i }),
      ).toBeNull();
    });
    await expect(
      offlineImagesRepository.listByEntry(sessionId, entryId),
    ).resolves.toEqual([]);
  });

  it('hides attach controls when finalized', () => {
    renderAttachments(true);

    expect(screen.queryByRole('button', { name: /add photo/i })).toBeNull();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('uses camera capture only on the take-photo input', () => {
    renderAttachments();

    const inputs = document.querySelectorAll('input[type="file"]');

    expect(inputs).toHaveLength(2);
    expect(inputs[0]?.getAttribute('capture')).toBe('environment');
    expect(inputs[1]?.getAttribute('capture')).toBeNull();
    expect(inputs[1]?.hasAttribute('multiple')).toBe(true);
  });
});
