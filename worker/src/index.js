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
