import {
  buildPreviewUpstreamUrl,
  parsePreviewAliasFromHost,
  rewritePreviewResponseHeaders,
} from './proxy.js';

export interface PreviewGatewayEnv {
  WORKERS_SUBDOMAIN: string;
}

const hopByHopRequestHeaders = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
]);

const buildUpstreamRequestHeaders = (
  request: Request,
  upstreamUrl: URL,
  originalHost: string,
): Headers => {
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (!hopByHopRequestHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }
  headers.set('host', upstreamUrl.host);
  headers.set('x-forwarded-host', originalHost);
  headers.set('x-forwarded-proto', 'https');
  return headers;
};

export const previewGatewayWorker = {
  async fetch(request: Request, env: PreviewGatewayEnv): Promise<Response> {
    const workersSubdomain = env.WORKERS_SUBDOMAIN.trim();
    if (!workersSubdomain) {
      return new Response('Preview gateway is missing WORKERS_SUBDOMAIN', {
        status: 500,
      });
    }

    const originalHost = request.headers.get('host') ?? '';
    const alias = parsePreviewAliasFromHost(originalHost);
    if (!alias) {
      return new Response('Not Found', { status: 404 });
    }

    const requestUrl = new URL(request.url);
    const upstreamUrl = buildPreviewUpstreamUrl(
      alias,
      requestUrl,
      workersSubdomain,
    );

    const upstreamRequest = new Request(upstreamUrl, {
      method: request.method,
      headers: buildUpstreamRequestHeaders(request, upstreamUrl, originalHost),
      body: request.body,
      redirect: 'manual',
    });

    const upstreamResponse = await fetch(upstreamRequest);
    const rewrittenHeaders = rewritePreviewResponseHeaders(
      upstreamResponse.headers,
      { alias, workersSubdomain },
    );

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: rewrittenHeaders,
    });
  },
};

// oxlint-disable-next-line import/no-default-export -- Cloudflare Workers module entry
export default previewGatewayWorker;
