// Public Pages origin: restrict before ASSETS, including root deployments without a build.
const PUBLIC = new Set([
  '/', '/index', '/index.html', '/user-guide', '/user-guide.html', '/404.html',
  '/styles.css', '/simulator.mjs', '/demo.ko.vtt',
  '/assets/aeonik-hello-brand-700.svg', '/assets/aeonik-wordmark-brand-700.svg',
  '/fonts/Geist-Variable.woff2', '/fonts/OFL.txt',
  ...['dispense.png', 'dispense-demo.mp4', 'confirm.png', 'progress.png', 'paused.png', 'result.png', 'wait.png'].map(name => '/admin/3.5.3/images/' + name),
]);
function normalizePath(path) {
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
function destination(path) {
  if (path === '/manual/user' || path === '/manual/user/') return '/user-guide';
  if (path.startsWith('/manual/user/')) return normalizePath(path.slice('/manual/user'.length));
  if (path === '/manual/admin' || path.startsWith('/manual/admin/')) return normalizePath('/admin' + path.slice('/manual/admin'.length));
  return path;
}
function isPublic(path) { return PUBLIC.has(destination(path)); }
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path;
    try { path = normalizePath(url.pathname); }
    catch { return new Response('Invalid path', {status: 400}); }
    const target = destination(path);
    const restricted = path.startsWith('/manual/admin') || /^\/(admin(?:\/|$)|pos(?:\/|$)|pos-admin|membership(?:\/|$)|auth(?:\/|$))/.test(target);
    if ((!PUBLIC.has(target) || path.startsWith('/manual/admin')) && restricted) {
      const official = new URL(path + url.search, 'https://refill.endet.xyz');
      return new Response(null, {status: 302, headers: {Location: official.href, 'Cache-Control': 'private, no-store', Vary: 'Cookie'}});
    }
    if (!PUBLIC.has(target)) return new Response('Not found', {status: 404});
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', {status: 405});
    url.pathname = target;
    const response = await env.ASSETS.fetch(new Request(url, request));
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
    return response;
  },
};
