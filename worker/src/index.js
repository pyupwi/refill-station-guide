const GUIDES = [
  { prefix: '/manual/user', directory: '' },
  { prefix: '/manual/admin', directory: '/admin' },
];

const PUBLIC = new Set([
  '/', '/index', '/index.html', '/user-guide', '/user-guide.html', '/404.html',
  '/styles.css', '/simulator.mjs', '/demo.ko.vtt',
  '/assets/aeonik-hello-brand-700.svg', '/assets/aeonik-wordmark-brand-700.svg',
  '/fonts/Geist-Variable.woff2', '/fonts/OFL.txt',
  ...['dispense.png', 'dispense-demo.mp4', 'confirm.png', 'progress.png', 'paused.png', 'result.png', 'wait.png'].map(name => '/admin/3.5.3/images/' + name),
]);
export function normalizePath(path) {
  // Decode before resolving aliases; encoded slashes and dot segments must not bypass policy.
  for (let i = 0; i < 5; i++) {
    const decoded = decodeURIComponent(path);
    if (decoded === path) break;
    path = decoded;
  }
  if (/%|[\\\x00-\x1f\x7f]/.test(path)) throw new Error('Invalid path');
  const parts = [];
  for (const part of path.split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  return '/' + parts.join('/') + (path.endsWith('/') && parts.length ? '/' : '');
}
export function destination(path) {
  if (path === '/manual/user' || path === '/manual/user/') return '/user-guide';
  if (path.startsWith('/manual/user/')) return normalizePath(path.slice('/manual/user'.length));
  if (path === '/manual/admin' || path.startsWith('/manual/admin/')) return normalizePath('/admin' + path.slice('/manual/admin'.length));
  return path;
}
export function isPublic(path) { return PUBLIC.has(destination(path)); }
function privateResponse(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Vary', 'Cookie');
  return new Response(response.body, {status: response.status, headers});
}
export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    try { incoming.pathname = normalizePath(incoming.pathname); }
    catch { return new Response('Invalid path', {status: 400}); }
    const targetPath = destination(incoming.pathname);
    const protectedPath = /^\/(admin(?:\/|$)|pos(?:\/|$)|pos-admin)/.test(targetPath);
    const publicPath = PUBLIC.has(targetPath) && !incoming.pathname.startsWith('/manual/admin');
    if (!publicPath && !protectedPath) return new Response('Not found', {status: 404});
    if (!publicPath) {
      let session;
      try {
        const result = await env.POS_MEMBERSHIP.fetch(new Request('https://refill.endet.xyz/api/membership/session', {
          headers: { Cookie: request.headers.get('Cookie') || '' }, redirect: 'manual', signal: AbortSignal.timeout(5000),
        }));
        if (!result.ok) throw new Error('Membership unavailable');
        session = await result.json();
      } catch {
        return privateResponse(new Response('Membership service unavailable', {status: 503}));
      }
      if (session?.authenticated !== true || session?.member?.status !== 'approved') {
        const target = new URL('/membership', 'https://refill.endet.xyz');
        target.searchParams.set('next', incoming.pathname + incoming.search);
        return privateResponse(new Response(null, {status: 302, headers: {Location: target.href}}));
      }
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return privateResponse(new Response('Method not allowed', {status: 405, headers: {Allow: 'GET, HEAD'}}));
    }
    const guide = GUIDES.find(({prefix}) => incoming.pathname === prefix || incoming.pathname.startsWith(prefix + '/'));
    if (guide && incoming.pathname === guide.prefix) {
      incoming.pathname += '/';
      return privateResponse(Response.redirect(incoming, 308));
    }
    const origin = new URL(incoming);
    origin.pathname = targetPath;
    let response = await env.ASSETS.fetch(new Request(origin, request));
    if (!publicPath) response = privateResponse(response);

    // Supply single-byte ranges when static asset responses ignore Range.
    // ponytail: buffer clips up to 2 MiB; move larger videos to storage with native range support.
    const range = request.headers.get('Range')?.match(/^bytes=(\d*)-(\d*)$/i);
    const contentLength = response.headers.get('Content-Length');
    const ifRange = request.headers.get('If-Range');
    if (request.method === 'GET' && response.status === 200 &&
        response.headers.get('Content-Type')?.startsWith('video/mp4') &&
        !response.headers.has('Content-Encoding') &&
        range && (range[1] || range[2]) &&
        (!ifRange || ifRange === response.headers.get('ETag') || ifRange === response.headers.get('Last-Modified'))) {
      const body = contentLength === null ? await response.arrayBuffer() : null;
      const size = contentLength === null ? body.byteLength : Number(contentLength);
      if (size > 0 && size <= 2 * 1024 * 1024) {
        const bytes = body ?? await response.arrayBuffer();
        const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
        const end = range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
        const headers = new Headers(response.headers);
        headers.set('Accept-Ranges', 'bytes');
        if (start >= size || start > end) {
          headers.set('Content-Range', `bytes */${size}`);
          headers.set('Content-Length', '0');
          return new Response(null, { status: 416, headers });
        }
        headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
        headers.set('Content-Length', String(end - start + 1));
        return new Response(bytes.slice(start, end + 1), { status: 206, headers });
      }
      if (body) return new Response(body, response);
    }
    const location = response.headers.get('Location');
    if (!location || !guide) return response;

    // Keep Pages' canonical-path redirects under the public guide address.
    const target = new URL(location, origin);
    if (target.origin !== origin.origin ||
        (guide.directory && target.pathname !== guide.directory &&
         !target.pathname.startsWith(`${guide.directory}/`))) return response;
    const publicTarget = new URL(incoming.origin);
    publicTarget.pathname = guide.prefix + target.pathname.slice(guide.directory.length);
    publicTarget.search = target.search;
    publicTarget.hash = target.hash;
    const headers = new Headers(response.headers);
    headers.set('Location', publicTarget.href);
    return new Response(response.body, { status: response.status, headers });
  },
};
