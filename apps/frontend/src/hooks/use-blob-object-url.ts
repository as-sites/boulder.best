import { useEffect, useState } from 'react';

/**
 * Create an object URL for a local Blob preview and revoke it on cleanup or
 * when the blob is replaced.
 */
export const useBlobObjectUrl = (
  blob: Blob | null | undefined,
): string | undefined => {
  const [objectUrl, setObjectUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!blob || !(blob instanceof Blob)) {
      setObjectUrl(undefined);
      return;
    }

    const nextUrl = URL.createObjectURL(blob);
    setObjectUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [blob]);

  return objectUrl;
};
