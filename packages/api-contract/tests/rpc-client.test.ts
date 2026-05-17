import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { apiClientOptions, createApiClient } from '../src/app.js';
import type { Gym, GymsResponse, SyncSessionPayload } from '../src/schemas.js';

describe('api client factory', () => {
  it('sends cookies on cross-origin requests', () => {
    expect(apiClientOptions).toEqual({
      init: { credentials: 'include' },
    });
  });

  it('does not reference apps/api in package declarations', () => {
    const distDir = join(import.meta.dirname, '../dist');
    const declarationFiles = readdirSync(distDir).filter((file: string) =>
      file.endsWith('.d.ts'),
    );
    const allDeclarations = declarationFiles
      .map((file) => readFileSync(join(distDir, file), 'utf8'))
      .join('\n');

    expect(declarationFiles.length).toBeGreaterThan(0);
    expect(allDeclarations).not.toContain('apps/api');
    expect(allDeclarations).not.toContain('packages/api-contract/src');
    expect(allDeclarations).not.toMatch(/\.\.\/\.\.\//);
  });
});

describe('RPC client types', () => {
  const client = createApiClient('https://api.example.com');

  it('exposes MVP routes on the typed client', () => {
    expectTypeOf(client.api.health.$get).toBeFunction();
    expectTypeOf(client.api.gyms.$get).toBeFunction();
    expectTypeOf(client.api.uploads['presigned-url'].$post).toBeFunction();
    expectTypeOf(client.api.sessions.sync.$post).toBeFunction();
    expectTypeOf(client.api.sessions.$get).toBeFunction();
    expectTypeOf(client.api.sessions[':id'].$get).toBeFunction();
  });

  it('types gym list responses from the contract schemas', () => {
    expectTypeOf<GymsResponse>().toEqualTypeOf<Gym[]>();
  });

  it('types sync session request bodies', () => {
    expectTypeOf<
      Parameters<typeof client.api.sessions.sync.$post>[0]
    >().toMatchObjectType<{
      json: SyncSessionPayload;
    }>();
  });

  it('matches createApiClient return type', () => {
    expectTypeOf(client).toEqualTypeOf<ReturnType<typeof createApiClient>>();
  });
});
