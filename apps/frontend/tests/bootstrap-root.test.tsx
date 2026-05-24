import { describe, expect, it } from 'vitest';
import { StrictMode, type ReactElement } from 'react';
import { App } from '../src/app.js';
import { wrapAppRoot } from '../src/bootstrap-root.js';

describe('bootstrap root wrapping', () => {
  it('wraps the app in StrictMode during development', () => {
    const root = wrapAppRoot(<App />, true);

    expect(root.type).toBe(StrictMode);
    expect((root.props as { children: ReactElement }).children.type).toBe(App);
  });

  it('does not wrap the app in StrictMode for production builds', () => {
    const root = wrapAppRoot(<App />, false);

    expect(root.type).toBe(App);
  });
});
