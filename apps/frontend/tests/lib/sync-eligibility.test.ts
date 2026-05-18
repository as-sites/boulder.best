import { describe, expect, it } from 'vitest';
import {
  canAutoSync,
  isEffectivelyOffline,
} from '../../src/lib/settings/sync-eligibility.js';

describe('sync eligibility', () => {
  it('blocks auto sync when manual offline mode is enabled', () => {
    expect(
      canAutoSync({
        manualOfflineMode: true,
        isOnline: true,
        isAuthenticated: true,
      }),
    ).toBe(false);
  });

  it('blocks auto sync when the browser is offline', () => {
    expect(
      canAutoSync({
        manualOfflineMode: false,
        isOnline: false,
        isAuthenticated: true,
      }),
    ).toBe(false);
  });

  it('allows auto sync when online, signed in, and manual mode is off', () => {
    expect(
      canAutoSync({
        manualOfflineMode: false,
        isOnline: true,
        isAuthenticated: true,
      }),
    ).toBe(true);
  });

  it('treats manual offline or browser offline as effectively offline', () => {
    expect(
      isEffectivelyOffline({ manualOfflineMode: true, isOnline: true }),
    ).toBe(true);
    expect(
      isEffectivelyOffline({ manualOfflineMode: false, isOnline: false }),
    ).toBe(true);
    expect(
      isEffectivelyOffline({ manualOfflineMode: false, isOnline: true }),
    ).toBe(false);
  });
});
