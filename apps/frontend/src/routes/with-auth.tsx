import { RequireAuth } from '../components/require-auth.js';

export const withAuth = (Page: React.ComponentType) => () => (
  <RequireAuth>
    <Page />
  </RequireAuth>
);
