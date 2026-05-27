import { notifications } from '@mantine/notifications';
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
    onError: (error) => {
      notifications.show({
        id: 'sync-queue-failure',
        color: 'red',
        title: 'Sync failed',
        message:
          error instanceof Error ? error.message : 'Unable to sync queue',
      });
    },
  });
};
