import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeSwitcher } from '../../src/components/theme-switcher.js';
import {
  appMantineProviderProps,
  COLOR_SCHEME_STORAGE_KEY,
} from '../../src/lib/theme/index.js';

const createMatchMedia = (matchesDark: boolean) => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const state = { matches: matchesDark };

  const mediaQueryList = {
    get matches() {
      return state.matches;
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.add(listener);
    },
    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.delete(listener);
    },
    dispatchChange: (matches: boolean) => {
      state.matches = matches;
      const event = {
        matches,
        media: mediaQueryList.media,
      } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
  } as MediaQueryList & { dispatchChange: (matches: boolean) => void };

  return mediaQueryList;
};

const renderThemeSwitcher = () =>
  render(
    <MantineProvider {...appMantineProviderProps}>
      <ThemeSwitcher />
    </MantineProvider>,
  );

describe('color scheme preference', () => {
  let matchMedia: ReturnType<typeof createMatchMedia>;

  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.mantineColorScheme;
    matchMedia = createMatchMedia(false);
    vi.stubGlobal('matchMedia', (query: string) => {
      if (query === '(prefers-color-scheme: dark)') {
        return matchMedia;
      }

      return createMatchMedia(false);
    });
  });

  it('defaults to system and follows the OS light preference', async () => {
    renderThemeSwitcher();

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /system/i })).toBeChecked();
    });
    expect(document.documentElement).toHaveAttribute(
      'data-mantine-color-scheme',
      'light',
    );
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBeNull();
  });

  it('defaults to system and follows the OS dark preference', async () => {
    matchMedia = createMatchMedia(true);
    renderThemeSwitcher();

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /system/i })).toBeChecked();
    });
    expect(document.documentElement).toHaveAttribute(
      'data-mantine-color-scheme',
      'dark',
    );
  });

  // oxlint-disable-next-line jest/prefer-ending-with-an-expect -- it's inside `waitFor`
  it('persists dark mode across remounts', async () => {
    const view = renderThemeSwitcher();

    fireEvent.click(screen.getByRole('radio', { name: /dark/i }));

    await waitFor(() => {
      expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');
      expect(document.documentElement).toHaveAttribute(
        'data-mantine-color-scheme',
        'dark',
      );
    });

    view.unmount();
    renderThemeSwitcher();

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /dark/i })).toBeChecked();
      expect(document.documentElement).toHaveAttribute(
        'data-mantine-color-scheme',
        'dark',
      );
    });
  });

  it('updates the resolved scheme when system preference changes', async () => {
    renderThemeSwitcher();

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute(
        'data-mantine-color-scheme',
        'light',
      );
    });

    matchMedia.dispatchChange(true);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute(
        'data-mantine-color-scheme',
        'dark',
      );
    });
    expect(screen.getByRole('radio', { name: /system/i })).toBeChecked();
  });

  // oxlint-disable-next-line jest/prefer-ending-with-an-expect -- it's inside `waitFor`
  it('restores an explicit light preference from local storage', async () => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'light');
    renderThemeSwitcher();

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /light/i })).toBeChecked();
      expect(document.documentElement).toHaveAttribute(
        'data-mantine-color-scheme',
        'light',
      );
    });
  });
});
