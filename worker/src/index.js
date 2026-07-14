const GUIDE_PREFIX = "/refill-user-guide";

export default {
  async fetch(request, env) {
    const incomingUrl = new URL(request.url);

    if (incomingUrl.pathname === GUIDE_PREFIX) {
      incomingUrl.pathname = `${GUIDE_PREFIX}/`;
      return Response.redirect(incomingUrl.toString(), 308);
    }

    if (!incomingUrl.pathname.startsWith(`${GUIDE_PREFIX}/`)) {
      return new Response("Not found", { status: 404 });
    }

    const originUrl = new URL(env.PAGES_ORIGIN);
    originUrl.pathname = incomingUrl.pathname.slice(GUIDE_PREFIX.length) || "/";
    originUrl.search = incomingUrl.search;

    const upstreamRequest = new Request(originUrl, request);
    return fetch(upstreamRequest);
  },
};
