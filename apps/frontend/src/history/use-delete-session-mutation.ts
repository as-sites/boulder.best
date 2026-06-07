import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { apiClient } from '../lib/api-client.js';
import { apiErrorFromResponse } from '../lib/fetch-error.js';
import { offlineImagesRepository } from '../offline/repositories/offline-images-repository.js';
import { syncQueueRepository } from '../offline/repositories/sync-queue-repository.js';
import { sessionHistoryQueryKey } from './use-session-history-query.js';

export const deleteSessionMutationKey = ['session', 'delete'] as const;

const deleteServerSession = async (sessionId: string): Promise<void> => {
  const response = await apiClient.api.sessions[':id'].$delete({
    param: { id: sessionId },
  });

  if (!response.ok) {
    throw apiErrorFromResponse(response);
  }
};

const deleteLocalSession = async (sessionId: string): Promise<void> => {
  await syncQueueRepository.delete(sessionId);
  await offlineImagesRepository.deleteBySession(sessionId);
};

export type DeleteSessionSource = 'server' | 'local';

export interface DeleteSessionInput {
  sessionId: string;
  source: DeleteSessionSource;
}

export const useDeleteSessionMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationKey: deleteSessionMutationKey,
    mutationFn: async ({ sessionId, source }: DeleteSessionInput) => {
      await (source === 'local'
        ? deleteLocalSession(sessionId)
        : deleteServerSession(sessionId));
    },
    onSuccess: async (_data, { source }) => {
      if (source === 'server') {
        await queryClient.invalidateQueries({
          queryKey: sessionHistoryQueryKey,
        });
      }
      await navigate({ to: '/history' });
    },
  });
};
