import { useLiveQuery } from 'dexie-react-hooks';
import type { DraftSession } from '../db/types.js';
import { draftSessionRepository } from '../repositories/draft-session-repository.js';

export const useActiveDraftSession = (): DraftSession | undefined =>
  useLiveQuery(
    async () => await draftSessionRepository.getActive(),
    [],
    undefined,
  );
