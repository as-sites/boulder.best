import type { DraftSession, SessionFormValues } from '../db/types.js';
import { draftSessionRepository } from '../repositories/draft-session-repository.js';

/** Session fields persisted while `status === 'not_started'`. */
export const PRE_START_AUTOSAVE_FIELDS = [
  'gymId',
  'location',
  'notes',
] as const satisfies ReadonlyArray<keyof SessionFormValues>;

export type PreStartAutosaveField = (typeof PRE_START_AUTOSAVE_FIELDS)[number];

const preStartAutosaveFieldSet = new Set<string>(PRE_START_AUTOSAVE_FIELDS);

/** Whether a react-hook-form field change should trigger pre-start autosave. */
export const isPreStartAutosaveField = (fieldName?: string): boolean =>
  fieldName === undefined || preStartAutosaveFieldSet.has(fieldName);

/** Persist the active in-progress session draft. */
export const autosaveActiveDraft = async (
  formData: SessionFormValues,
): Promise<DraftSession> =>
  await draftSessionRepository.saveActive({ formData });

/** Restore the active draft, if one exists. */
export const restoreActiveDraft = async (): Promise<DraftSession | undefined> =>
  await draftSessionRepository.getActive();
