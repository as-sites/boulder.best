import { describe, expect, it } from 'vitest';
import { isAppNavItemActive } from '../../src/components/app-nav-items.js';

describe(isAppNavItemActive, () => {
  const sessionsItem = {
    label: 'History',
    to: '/sessions' as const,
    Icon: () => null,
  };

  it('matches the exact nav path', () => {
    expect(isAppNavItemActive('/sessions', sessionsItem)).toBe(true);
  });

  it('matches nested session detail paths', () => {
    expect(
      isAppNavItemActive(
        '/sessions/00000000-0000-4000-8000-000000000001',
        sessionsItem,
      ),
    ).toBe(true);
  });

  it('does not match unrelated paths', () => {
    expect(isAppNavItemActive('/tracker', sessionsItem)).toBe(false);
  });
});
