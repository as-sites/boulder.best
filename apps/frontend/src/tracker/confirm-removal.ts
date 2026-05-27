import { modals } from '@mantine/modals';

type ConfirmRemoval = (message: string, onConfirm: () => void) => void;

const defaultConfirmRemoval: ConfirmRemoval = (message, onConfirm) => {
  modals.openConfirmModal({
    children: message,
    labels: { confirm: 'Remove', cancel: 'Cancel' },
    confirmProps: { color: 'red' },
    onConfirm,
  });
};

let confirmRemovalImpl: ConfirmRemoval = defaultConfirmRemoval;

export const confirmRemoval: ConfirmRemoval = (message, onConfirm) =>
  confirmRemovalImpl(message, onConfirm);

/** Test hook to stub confirmation without native dialogs. */
export const setConfirmRemovalForTests = (impl: ConfirmRemoval): void => {
  confirmRemovalImpl = impl;
};

export const resetConfirmRemovalForTests = (): void => {
  confirmRemovalImpl = defaultConfirmRemoval;
};
