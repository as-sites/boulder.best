import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ColorSchemeScript } from '@mantine/core';
import {
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_COLOR_SCHEME,
} from '../src/lib/theme/color-scheme.js';

/**
 * Pre-render Mantine's bootstrap script for injection into index.html at build
 * time.
 */
export const renderColorSchemeScriptMarkup = (): string =>
  renderToStaticMarkup(
    createElement(ColorSchemeScript, {
      defaultColorScheme: DEFAULT_COLOR_SCHEME,
      localStorageKey: COLOR_SCHEME_STORAGE_KEY,
    }),
  );
