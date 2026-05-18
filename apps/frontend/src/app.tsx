import { MantineProvider } from '@mantine/core';
import {
  QueryClient,
  QueryClientProvider,
  type QueryClient as QueryClientType,
} from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { createAppRouter, type AppRouter } from './router.js';

const queryClient = new QueryClient();
const router = createAppRouter();

export { AuthActions } from './components/auth-actions.js';

export const AppProviders = ({
  queryClient: providerQueryClient,
  router: providerRouter,
}: {
  queryClient: QueryClientType;
  router: AppRouter;
}) => (
  <MantineProvider>
    <QueryClientProvider client={providerQueryClient}>
      <RouterProvider router={providerRouter} />
    </QueryClientProvider>
  </MantineProvider>
);

export const App = () => (
  <AppProviders queryClient={queryClient} router={router} />
);
