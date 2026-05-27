import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  confirmRemoval,
  resetConfirmRemovalForTests,
  setConfirmRemovalForTests,
} from '../../src/tracker/confirm-removal.js';

describe('confirm-removal', () => {
  afterEach(() => {
    resetConfirmRemovalForTests();
  });

  it('invokes onConfirm when the test stub approves removal', () => {
    setConfirmRemovalForTests((_message, onConfirm) => {
      onConfirm();
    });

    const onConfirm = vi.fn();
    confirmRemoval('Remove this climb?', onConfirm);

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('does not invoke onConfirm when the test stub rejects removal', () => {
    setConfirmRemovalForTests(() => {
      // reject — do not call onConfirm
    });

    const onConfirm = vi.fn();
    confirmRemoval('Remove this climb?', onConfirm);

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
