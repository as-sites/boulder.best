import { describe, expect, it } from 'vitest';
import { createApiContract } from '../src/app.js';
import { mvpOpenApiRoutes } from '../src/openapi-routes.js';
import { openApiJsonPath } from '../src/openapi.js';
import type { ApiContractHandlers } from '../src/routes.js';
import { sessionDetailResponseSchema } from '../src/schemas.js';
import {
  gymFixture,
  presignedUploadRequestFixture,
  presignedUploadResponseFixture,
  sessionDetailResponseFixture,
  sessionHistoryListResponseFixture,
  sessionId,
  syncSessionPayloadFixture,
} from './fixtures.js';

const stubHandlers: ApiContractHandlers = {
  // oxlint-disable-next-line typescript/require-await
  getGyms: async () => [
    {
      ...gymFixture,
      grades: [...gymFixture.grades],
      locations: [...gymFixture.locations],
    },
  ],
  // oxlint-disable-next-line typescript/require-await
  createPresignedUpload: async () => presignedUploadResponseFixture,
  // oxlint-disable-next-line typescript/require-await
  syncSession: async () => ({
    success: true,
    sessionId,
  }),
  // oxlint-disable-next-line typescript/require-await
  listSessions: async () => ({
    ...sessionHistoryListResponseFixture,
    items: sessionHistoryListResponseFixture.items.map((item) => ({ ...item })),
  }),
  // oxlint-disable-next-line typescript/require-await
  getSessionDetail: async () =>
    sessionDetailResponseSchema.parse(sessionDetailResponseFixture),
  // oxlint-disable-next-line typescript/require-await
  deleteSession: async () => true,
};

describe('MVP OpenAPI route definitions', () => {
  it('defines the expected methods and paths', () => {
    expect(mvpOpenApiRoutes.map((route) => [route.method, route.path])).toEqual(
      [
        ['get', '/api/gyms'],
        ['post', '/api/uploads/presigned-url'],
        ['post', '/api/sessions/sync'],
        ['get', '/api/sessions'],
        ['get', '/api/sessions/{id}'],
        ['delete', '/api/sessions/{id}'],
      ],
    );
  });

  it('wires request and response schemas for each route', () => {
    const [getGyms, presign, sync, list, detail, deleteRoute] =
      mvpOpenApiRoutes;
    const { 200: getGymsResponse } = getGyms.responses;
    const { 429: getGymsRateLimitResponse } = getGyms.responses;
    const { 200: presignResponse } = presign.responses;
    const { 200: syncResponse } = sync.responses;
    const { 200: listResponse } = list.responses;
    const { 200: detailResponse } = detail.responses;

    expect(getGymsResponse.content['application/json'].schema).toBeDefined();
    expect(
      getGymsRateLimitResponse.content['application/json'].schema,
    ).toBeDefined();
    expect('security' in getGyms).toBe(false);
    expect(Object.keys(getGyms.responses).sort()).toEqual(['200', '429']);
    expect(
      presign.request.body.content['application/json'].schema,
    ).toBeDefined();
    expect(presignResponse.content['application/json'].schema).toBeDefined();
    expect(presign.security).toEqual([{ sessionCookie: [] }]);
    expect(presign.responses[401]).toBeDefined();
    expect(sync.request.body.content['application/json'].schema).toBeDefined();
    expect(syncResponse.content['application/json'].schema).toBeDefined();
    expect(list.request.query).toBeDefined();
    expect(listResponse.content['application/json'].schema).toBeDefined();
    expect(detail.request.params).toBeDefined();
    expect(detailResponse.content['application/json'].schema).toBeDefined();
    expect(deleteRoute.request.params).toBeDefined();
    expect(deleteRoute.responses[204]).toBeDefined();
  });
});

describe('OpenAPI document', () => {
  const app = createApiContract(stubHandlers);

  it('serves deployed health JSON under /api', async () => {
    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('keeps the legacy health path available for direct Worker checks', async () => {
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('serves OpenAPI JSON at /openapi.json', async () => {
    const response = await app.request(openApiJsonPath);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const document = await response.json();

    expect(document).toMatchSnapshot('openapi-document');
  });

  it('includes all MVP paths in the generated document', async () => {
    const response = await app.request(openApiJsonPath);
    const document = await response.json();
    const paths = document.paths as Record<string, Record<string, unknown>>;

    expect(Object.keys(paths).sort()).toEqual([
      '/api/gyms',
      '/api/sessions',
      '/api/sessions/sync',
      '/api/sessions/{id}',
      '/api/uploads/presigned-url',
    ]);

    expect(paths['/api/gyms']?.get).toBeDefined();
    expect(paths['/api/uploads/presigned-url']?.post).toBeDefined();
    expect(paths['/api/sessions/sync']?.post).toBeDefined();
    expect(paths['/api/sessions']?.get).toBeDefined();
    expect(paths['/api/sessions/{id}']?.get).toBeDefined();
    expect(paths['/api/sessions/{id}']?.delete).toBeDefined();
  });
});

describe('contract request validation', () => {
  const app = createApiContract(stubHandlers);

  it('rejects invalid presign payloads before handlers run', async () => {
    const response = await app.request('/api/uploads/presigned-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...presignedUploadRequestFixture,
        contentLength: 31 * 1024 * 1024,
      }),
    });

    expect(response.status).toBe(400);
  });

  it('accepts valid presign payloads', async () => {
    const response = await app.request('/api/uploads/presigned-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(presignedUploadRequestFixture),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      presignedUploadResponseFixture,
    );
  });

  it('accepts valid sync payloads', async () => {
    const response = await app.request('/api/sessions/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(syncSessionPayloadFixture),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      sessionId,
    });
  });
});
