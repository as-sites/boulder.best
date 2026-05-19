import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBlobObjectUrl } from '../../src/hooks/use-blob-object-url.js';

describe('blob object URL hook', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates and revokes object URLs when the blob changes', async () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    const firstBlob = new Blob(['one'], { type: 'image/jpeg' });
    const secondBlob = new Blob(['two'], { type: 'image/png' });

    createSpy
      .mockReturnValueOnce('blob:first')
      .mockReturnValueOnce('blob:second');

    const { result, rerender } = renderHook(
      ({ blob }: { blob: Blob | null }) => useBlobObjectUrl(blob),
      { initialProps: { blob: firstBlob } },
    );

    await waitFor(() => {
      expect(result.current).toBe('blob:first');
    });

    rerender({ blob: secondBlob });

    await waitFor(() => {
      expect(result.current).toBe('blob:second');
    });

    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(revokeSpy).toHaveBeenCalledWith('blob:first');
  });

  it('clears the URL and revokes on unmount', async () => {
    const createSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:temp');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    const blob = new Blob(['pixels'], { type: 'image/jpeg' });

    const { result, unmount } = renderHook(() => useBlobObjectUrl(blob));

    await waitFor(() => {
      expect(result.current).toBe('blob:temp');
    });

    unmount();

    expect(revokeSpy).toHaveBeenCalledWith('blob:temp');
    expect(createSpy).toHaveBeenCalledOnce();
  });
});
