import { describe, expect, it } from 'vitest';
import {
  buildPreviewUpstreamUrl,
  parsePreviewAliasFromHost,
  previewOriginFromAlias,
  previewWorkersDevHost,
  resolvePreviewUpstreamTarget,
  rewritePreviewResponseHeaders,
  rewriteWorkersDevInHeaderValue,
} from '../src/proxy.js';

const SUBDOMAIN = 'boulder-dot-best';
const ALIAS = 'pr-42';

describe('preview host parsing', () => {
  it('parses pr-<n> from the preview host', () => {
    expect(parsePreviewAliasFromHost('pr-42.boulder.best')).toBe('pr-42');
    expect(parsePreviewAliasFromHost('PR-7.boulder.best:443')).toBe('pr-7');
  });

  it('rejects non-preview hosts', () => {
    expect(parsePreviewAliasFromHost('boulder.best')).toBeNull();
    expect(parsePreviewAliasFromHost('staging.boulder.best')).toBeNull();
    expect(parsePreviewAliasFromHost('pr-abc.boulder.best')).toBeNull();
  });
});

describe('upstream target routing', () => {
  it('routes /api paths to the API Worker', () => {
    expect(resolvePreviewUpstreamTarget('/api/health')).toBe('api');
    expect(resolvePreviewUpstreamTarget('/api')).toBe('api');
  });

  it('routes other paths to the frontend Worker', () => {
    expect(resolvePreviewUpstreamTarget('/')).toBe('frontend');
    expect(resolvePreviewUpstreamTarget('/sessions')).toBe('frontend');
    expect(resolvePreviewUpstreamTarget('/not-api')).toBe('frontend');
  });
});

describe('upstream URL construction', () => {
  it('builds API upstream URLs for /api/*', () => {
    const url = buildPreviewUpstreamUrl(
      ALIAS,
      new URL('https://pr-42.boulder.best/api/health?x=1'),
      SUBDOMAIN,
    );
    expect(url.hostname).toBe(previewWorkersDevHost(ALIAS, 'api', SUBDOMAIN));
    expect(url.pathname).toBe('/api/health');
    expect(url.search).toBe('?x=1');
  });

  it('builds frontend upstream URLs for non-API paths', () => {
    const url = buildPreviewUpstreamUrl(
      ALIAS,
      new URL('https://pr-42.boulder.best/sessions'),
      SUBDOMAIN,
    );
    expect(url.hostname).toBe(
      previewWorkersDevHost(ALIAS, 'frontend', SUBDOMAIN),
    );
    expect(url.pathname).toBe('/sessions');
  });
});

describe('workers.dev header rewriting', () => {
  it('rewrites Location headers to the preview custom domain', () => {
    const apiHost = previewWorkersDevHost(ALIAS, 'api', SUBDOMAIN);
    const location = `https://${apiHost}/api/auth/callback/email`;
    expect(
      rewriteWorkersDevInHeaderValue(location, {
        alias: ALIAS,
        workersSubdomain: SUBDOMAIN,
      }),
    ).toBe(`${previewOriginFromAlias(ALIAS)}/api/auth/callback/email`);
  });

  it('rewrites Set-Cookie Domain attributes', () => {
    const apiHost = previewWorkersDevHost(ALIAS, 'api', SUBDOMAIN);
    const cookie = `session=abc; Path=/; Domain=${apiHost}; Secure; HttpOnly`;
    expect(
      rewriteWorkersDevInHeaderValue(cookie, {
        alias: ALIAS,
        workersSubdomain: SUBDOMAIN,
      }),
    ).toContain(`Domain=${ALIAS}.boulder.best`);
    expect(
      rewriteWorkersDevInHeaderValue(cookie, {
        alias: ALIAS,
        workersSubdomain: SUBDOMAIN,
      }),
    ).not.toContain('workers.dev');
  });
});

describe('preview response headers', () => {
  it('rewrites Location and Set-Cookie on the response', () => {
    const apiHost = previewWorkersDevHost(ALIAS, 'api', SUBDOMAIN);
    const headers = new Headers();
    headers.set('location', `https://${apiHost}/api/auth/sign-in`);
    headers.append(
      'set-cookie',
      `better-auth.session=1; Domain=${apiHost}; Path=/api/auth; Secure`,
    );

    const rewritten = rewritePreviewResponseHeaders(headers, {
      alias: ALIAS,
      workersSubdomain: SUBDOMAIN,
    });

    expect(rewritten.get('location')).toBe(
      `${previewOriginFromAlias(ALIAS)}/api/auth/sign-in`,
    );
    const cookies = rewritten.getSetCookie();
    expect(cookies[0]).toContain(`${ALIAS}.boulder.best`);
    expect(cookies[0]).not.toContain('workers.dev');
  });
});
