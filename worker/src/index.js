const GUIDES = [
  { prefix: '/refill-user-guide', directory: '' },
  { prefix: '/refill-admin-guide', directory: '/admin' },
];

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    const guide = GUIDES.find(({ prefix }) =>
      incoming.pathname === prefix || incoming.pathname.startsWith(`${prefix}/`));
    if (!guide) return new Response('Not found', { status: 404 });
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    if (incoming.pathname === guide.prefix) {
      incoming.pathname += '/';
      return Response.redirect(incoming, 308);
    }
    const origin = new URL(env.PAGES_ORIGIN);
    origin.pathname = guide.directory + incoming.pathname.slice(guide.prefix.length);
    origin.search = incoming.search;
    const response = await fetch(new Request(origin, request), { redirect: 'manual' });

    // Pages currently ignores Range. Supply single-byte ranges for small guide videos.
    // ponytail: buffer clips up to 2 MiB; move larger videos to storage with native range support.
    const range = request.headers.get('Range')?.match(/^bytes=(\d*)-(\d*)$/i);
    const size = Number(response.headers.get('Content-Length'));
    const ifRange = request.headers.get('If-Range');
    if (request.method === 'GET' && response.status === 200 &&
        response.headers.get('Content-Type')?.startsWith('video/mp4') &&
        !response.headers.has('Content-Encoding') && size > 0 && size <= 2 * 1024 * 1024 &&
        range && (range[1] || range[2]) &&
        (!ifRange || ifRange === response.headers.get('ETag') || ifRange === response.headers.get('Last-Modified'))) {
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
      const headers = new Headers(response.headers);
      headers.set('Accept-Ranges', 'bytes');
      if (start >= size || start > end) {
        headers.set('Content-Range', `bytes */${size}`);
        headers.set('Content-Length', '0');
        return new Response(null, { status: 416, headers });
      }
      const bytes = await response.arrayBuffer();
      headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
      headers.set('Content-Length', String(end - start + 1));
      return new Response(bytes.slice(start, end + 1), { status: 206, headers });
    }
    const location = response.headers.get('Location');
    if (!location) return response;

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
