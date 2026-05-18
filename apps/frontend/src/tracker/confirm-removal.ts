type ConfirmRemoval = (message: string) => boolean;

const defaultConfirmRemoval: ConfirmRemoval = (message) =>
  // oxlint-disable-next-line eslint/no-alert -- MVP native confirm for remove guards
  globalThis.confirm(message);

let confirmRemovalImpl: ConfirmRemoval = defaultConfirmRemoval;

export const confirmRemoval: ConfirmRemoval = (message) =>
  confirmRemovalImpl(message);

/** Test hook to stub confirmation without native dialogs. */
export const setConfirmRemovalForTests = (impl: ConfirmRemoval): void => {
  confirmRemovalImpl = impl;
};

export const resetConfirmRemovalForTests = (): void => {
  confirmRemovalImpl = defaultConfirmRemoval;
};
