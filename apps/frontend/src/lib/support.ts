/** Placeholder until a public support channel is configured. */
export const SUPPORT_EMAIL = 'support@boulder.best';

export const FAILED_SYNC_SUPPORT_BLURB =
  'A session failed to sync on my device. I attached the exported JSON from Settings.';

export const buildFailedSyncSupportMailto = (sessionId: string): string => {
  const subject = encodeURIComponent(
    `Failed sync export — session ${sessionId}`,
  );
  const body = encodeURIComponent(FAILED_SYNC_SUPPORT_BLURB);
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
};
