import type { DraftSession, SessionFormValues } from '../db/types.js';
import { draftSessionRepository } from '../repositories/draft-session-repository.js';

/** Persist the active in-progress session draft. */
export async function autosaveActiveDraft(
  formData: SessionFormValues,
): Promise<DraftSession> {
  await draftSessionRepository.saveActive({ formData });
  const draft = await draftSessionRepository.getActive();
  if (!draft) {
    throw new Error('Failed to persist active draft session');
  }
  return draft;
}

/** Restore the active draft, if one exists. */
export async function restoreActiveDraft(): Promise<DraftSession | undefined> {
  return await draftSessionRepository.getActive();
}
