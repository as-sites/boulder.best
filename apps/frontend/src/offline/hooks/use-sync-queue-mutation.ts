import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionHistoryQueryKey } from '../../history/use-session-history-query.js';
import {
  runSyncQueueDrain,
  syncQueueMutationKey,
} from '../sync/sync-queue-mutation.js';

export const useSyncQueueMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: syncQueueMutationKey,
    mutationFn: runSyncQueueDrain,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: sessionHistoryQueryKey,
      });
    },
  });
};
