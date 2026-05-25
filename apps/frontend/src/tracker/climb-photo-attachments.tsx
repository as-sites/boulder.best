import { useRef, useState } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBlobObjectUrl } from '../hooks/use-blob-object-url.js';
import { mapFileToOfflineImage } from '../offline/images/map-file-to-offline-image.js';
import { ImageValidationError } from '../offline/images/validate-image.js';
import { offlineImagesRepository } from '../offline/repositories/offline-images-repository.js';

export interface ClimbPhotoAttachmentsProps {
  sessionId: string;
  entryId: string;
  disabled?: boolean;
}

const ClimbPhotoPreview = ({ blob }: { blob: Blob }) => {
  const src = useBlobObjectUrl(blob);

  if (!src) {
    return null;
  }

  return (
    <Image
      src={src}
      alt="Climb photo preview"
      radius="sm"
      h={72}
      w={72}
      fit="cover"
    />
  );
};

const handleDelete = async (imageId: string) => {
  await offlineImagesRepository.delete(imageId);
};

export const ClimbPhotoAttachments = ({
  sessionId,
  entryId,
  disabled = false,
}: ClimbPhotoAttachmentsProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const images = useLiveQuery(
    async () => await offlineImagesRepository.listByEntry(sessionId, entryId),
    [sessionId, entryId],
    [],
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setError(null);
    let nextIndex = Math.max(-1, ...images.map((img) => img.index)) + 1;

    for (const file of Array.from(files)) {
      try {
        const image = mapFileToOfflineImage({
          file,
          sessionId,
          entryId,
          index: nextIndex,
        });
        nextIndex += 1;
        await offlineImagesRepository.put(image);
      } catch (attachError) {
        setError(
          attachError instanceof ImageValidationError
            ? attachError.message
            : 'Unable to add photo',
        );
      }
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (libraryInputRef.current) {
      libraryInputRef.current.value = '';
    }
  };

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Photos
      </Text>

      {images.length > 0 ? (
        <SimpleGrid cols={{ base: 3, xs: 4 }} spacing="xs">
          {images.map((image) => (
            <Stack key={image.id} gap={4} align="center">
              <ClimbPhotoPreview blob={image.blob} />
              {!disabled ? (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  aria-label="Delete photo"
                  onClick={() => {
                    void handleDelete(image.id);
                  }}
                >
                  ×
                </ActionIcon>
              ) : null}
            </Stack>
          ))}
        </SimpleGrid>
      ) : null}

      {!disabled ? (
        <>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            aria-label="Take climb photo"
            onChange={(event) => {
              void handleFiles(event.currentTarget.files);
            }}
          />
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            aria-label="Choose climb photos"
            onChange={(event) => {
              void handleFiles(event.currentTarget.files);
            }}
          />
          <Group gap="xs">
            <Button
              size="compact-sm"
              variant="light"
              onClick={() => {
                cameraInputRef.current?.click();
              }}
            >
              Take photo
            </Button>
            <Button
              size="compact-sm"
              variant="default"
              onClick={() => {
                libraryInputRef.current?.click();
              }}
            >
              Choose photos
            </Button>
          </Group>
        </>
      ) : null}

      {error ? (
        <Text c="red" size="xs">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
};
