import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import {
  QueryClient,
  QueryClientProvider,
  type QueryClient as QueryClientType,
} from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
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
    <Notifications />
    <QueryClientProvider client={providerQueryClient}>
      <RouterProvider router={providerRouter} />
    </QueryClientProvider>
  </MantineProvider>
);

export const App = () => (
  <AppProviders queryClient={queryClient} router={router} />
);
