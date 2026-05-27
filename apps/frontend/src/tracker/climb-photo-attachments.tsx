import { useRef } from 'react';
import {
  ActionIcon,
  Button,
  Image,
  Menu,
  SimpleGrid,
  Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CaretDownIcon, ImageIcon } from '@phosphor-icons/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBlobObjectUrl } from '../hooks/use-blob-object-url.js';
import { mapFileToOfflineImage } from '../offline/images/map-file-to-offline-image.js';
import { ImageValidationError } from '../offline/images/validate-image.js';
import { offlineImagesRepository } from '../offline/repositories/offline-images-repository.js';

const PREVIEW_SIZE = 72;

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
      h={PREVIEW_SIZE}
      w={PREVIEW_SIZE}
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

  const images = useLiveQuery(
    async () => await offlineImagesRepository.listByEntry(sessionId, entryId),
    [sessionId, entryId],
    [],
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

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
        notifications.show({
          color: 'red',
          title: 'Unable to add photo',
          message:
            attachError instanceof ImageValidationError
              ? attachError.message
              : 'Please try again.',
        });
      }
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (libraryInputRef.current) {
      libraryInputRef.current.value = '';
    }
  };

  const hasPhotos = images.length > 0;
  const showAddMenu = !disabled;

  if (!hasPhotos && !showAddMenu) {
    return null;
  }

  return (
    <Stack gap="xs">
      {showAddMenu ? (
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
          <Menu position="bottom-end" withinPortal={false}>
            <Menu.Target>
              <Button
                fullWidth
                variant="outline"
                color="blue"
                leftSection={<ImageIcon size={18} aria-hidden />}
                rightSection={<CaretDownIcon size={14} aria-hidden />}
              >
                Photos
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                onClick={() => {
                  cameraInputRef.current?.click();
                }}
              >
                Take photo
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  libraryInputRef.current?.click();
                }}
              >
                Choose photos
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </>
      ) : null}

      {hasPhotos ? (
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
    </Stack>
  );
};
