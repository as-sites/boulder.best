import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import {
  QueryClient,
  QueryClientProvider,
  type QueryClient as QueryClientType,
} from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ServiceWorkerUpdateProvider } from './lib/service-worker/index.js';
import { appMantineProviderProps } from './lib/theme/index.js';
import { createAppRouter, type AppRouter } from './router.js';

const queryClient = new QueryClient();
const router = createAppRouter();

export const AppProviders = ({
  queryClient: providerQueryClient,
  router: providerRouter,
}: {
  queryClient: QueryClientType;
  router: AppRouter;
}) => (
  <MantineProvider {...appMantineProviderProps}>
    <ModalsProvider>
      <Notifications />
      <ServiceWorkerUpdateProvider>
        <QueryClientProvider client={providerQueryClient}>
          <RouterProvider router={providerRouter} />
        </QueryClientProvider>
      </ServiceWorkerUpdateProvider>
    </ModalsProvider>
  </MantineProvider>
);

export const App = () => (
  <AppProviders queryClient={queryClient} router={router} />
);
