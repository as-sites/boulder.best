import type { DraftSession, SessionFormValues } from '../db/types.js';
import { draftSessionRepository } from '../repositories/draft-session-repository.js';

/** Persist the active in-progress session draft. */
export const autosaveActiveDraft = async (
  formData: SessionFormValues,
): Promise<DraftSession> =>
  await draftSessionRepository.saveActive({ formData });

/** Restore the active draft, if one exists. */
export const restoreActiveDraft = async (): Promise<DraftSession | undefined> =>
  await draftSessionRepository.getActive();
