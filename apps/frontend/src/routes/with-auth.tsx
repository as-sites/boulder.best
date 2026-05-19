import type { ComponentType } from 'react';
import { RequireAuth } from '../components/require-auth.js';

export const withAuth = (Page: ComponentType) => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- false positive
  const AuthWrapped = () => (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- not sure if it is always set but i just wanted fall backs in case
  AuthWrapped.displayName = `withAuth(${Page.displayName ?? Page.name ?? 'Component'})`;
  return AuthWrapped;
};
