const PREVIEW_HOST_RE = /^(\d+)-pr\.boulder\.best$/i;

/**
 * Preview custom-domain host for alias `pr-<n>` (no port). e.g.
 * `42-pr.boulder.best`
 */
export const previewHostFromAlias = (alias: string): string => {
  const n = alias.replace(/^pr-/i, '');
  return `${n}-pr.boulder.best`;
};

/** HTTPS origin served by the gateway (`https://<n>-pr.boulder.best`). */
export const previewOriginFromAlias = (alias: string): string =>
  `https://${previewHostFromAlias(alias)}`;

/**
 * Parse `pr-<n>` alias from `Host` (e.g. `42-pr.boulder.best`). Returns null
 * when the host is not a preview subdomain.
 */
export const parsePreviewAliasFromHost = (host: string): string | null => {
  const hostname = host.split(':')[0]?.trim().toLowerCase() ?? '';
  const match = PREVIEW_HOST_RE.exec(hostname);
  const n = match?.[1];
  return typeof n === 'string' ? `pr-${n}` : null;
};

export type PreviewUpstreamTarget = 'api' | 'frontend';

/** Route `/api/*` to the API preview Worker; everything else to the frontend. */
export const resolvePreviewUpstreamTarget = (
  pathname: string,
): PreviewUpstreamTarget =>
  pathname.startsWith('/api/') || pathname === '/api' ? 'api' : 'frontend';

const workerNameForTarget = (target: PreviewUpstreamTarget): string =>
  target === 'api' ? 'boulder-api' : 'boulder-frontend';

/** workers.dev host for an aliased preview Worker version. */
export const previewWorkersDevHost = (
  alias: string,
  target: PreviewUpstreamTarget,
  workersSubdomain: string,
): string =>
  `${alias}-${workerNameForTarget(target)}.${workersSubdomain}.workers.dev`;

/** Full upstream URL preserving path and query. */
export const buildPreviewUpstreamUrl = (
  alias: string,
  requestUrl: URL,
  workersSubdomain: string,
): URL => {
  const target = resolvePreviewUpstreamTarget(requestUrl.pathname);
  const upstream = new URL(
    `https://${previewWorkersDevHost(alias, target, workersSubdomain)}`,
  );
  upstream.pathname = requestUrl.pathname;
  upstream.search = requestUrl.search;
  return upstream;
};

export interface RewriteWorkersDevOptions {
  alias: string;
  workersSubdomain: string;
}

/**
 * Replace aliased workers.dev hosts with the preview custom domain in header
 * values.
 */
export const rewriteWorkersDevInHeaderValue = (
  value: string,
  { alias, workersSubdomain }: RewriteWorkersDevOptions,
): string => {
  const previewHost = previewHostFromAlias(alias);
  const targets: ReadonlyArray<PreviewUpstreamTarget> = ['api', 'frontend'];
  const hosts = targets.map((target) =>
    previewWorkersDevHost(alias, target, workersSubdomain),
  );

  let rewritten = value;
  for (const workersHost of hosts) {
    rewritten = rewritten.replaceAll(
      `https://${workersHost}`,
      `https://${previewHost}`,
    );
    rewritten = rewritten.replaceAll(
      `http://${workersHost}`,
      `https://${previewHost}`,
    );
    rewritten = rewritten.replaceAll(workersHost, previewHost);
  }
  return rewritten;
};

/**
 * Rewrite `Location` / `Set-Cookie` so auth redirects stay on the preview
 * domain.
 */
export const rewritePreviewResponseHeaders = (
  headers: Headers,
  options: RewriteWorkersDevOptions,
): Headers => {
  const out = new Headers(headers);

  const location = headers.get('location');
  if (location) {
    out.set('location', rewriteWorkersDevInHeaderValue(location, options));
  }

  if (typeof headers.getSetCookie === 'function') {
    const cookies = headers.getSetCookie();
    if (cookies.length > 0) {
      out.delete('set-cookie');
      for (const cookie of cookies) {
        out.append(
          'set-cookie',
          rewriteWorkersDevInHeaderValue(cookie, options),
        );
      }
    }
  } else {
    const setCookie = headers.get('set-cookie');
    if (setCookie) {
      out.set('set-cookie', rewriteWorkersDevInHeaderValue(setCookie, options));
    }
  }

  return out;
};
