import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import router, {isPublic} from '../worker/src/index.js';
const pagesSource = readFileSync(new URL('../_worker.js', import.meta.url), 'utf8');
const pages = (await import('data:text/javascript;base64,' + Buffer.from(pagesSource).toString('base64'))).default;
let state = {authenticated: false, member: null};
let calls = 0, assets = 0, seen;
const env = {
  POS_MEMBERSHIP: {fetch: async request => {
    calls++; seen = request;
    if (state instanceof Error) throw state;
    return Response.json(state);
  }},
  ASSETS: {fetch: async request => {assets++; return new Response(new URL(request.url).pathname, {headers: {'Cache-Control': 'public, max-age=999', 'Content-Type': 'text/html'}});}},
};
const fetch = (path, options) => router.fetch(new Request('https://refill.endet.xyz' + path, options), env);
const restricted = [
  '/manual/admin', '/manual/admin/', '/manual/admin/4.0.0/', '/manual/admin/versions.json',
  '/manual/admin/assets/aeonik-wordmark-brand-700.svg', '/manual/admin/3.5.3/images/dispense.png',
  '/admin', '/admin/index.html', '/admin/4.0.0/images/web-pos.png', '/admin/versions.js',
  '/pos', '/pos/', '/pos/images/login.png', '/pos-admin', '/pos-admin/deep', '/pos-admin-extra',
  '/manual/user/admin/4.0.0/index.html', '/manual/user/pos/images/login.png',
  '/manual/user/%61dmin/versions.json', '/manual/user/%2561dmin/versions.json',
  '/manual/user/%2fadmin%2f4.0.0%2findex.html', '/manual/user/x/%252e%252e/admin/versions.json',
  '//admin//4.0.0/', '/%61dmin/4.0.0/',
];
for (const membership of [null, 'pending', 'rejected', 'suspended', 'revoked']) {
  state = {authenticated: membership !== null, member: membership ? {status: membership} : null};
  for (const path of restricted) {
    const before = assets;
    const response = await fetch(path, {headers: {Cookie: 'session=secret'}});
    assert.equal(response.status, 302, `${membership}: ${path}`);
    assert.equal(assets, before, 'Denied request must never reach assets');
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(response.headers.get('Vary'), 'Cookie');
    assert.equal(new URL(response.headers.get('Location')).pathname, '/membership');
    assert.equal(seen.headers.get('Cookie'), 'session=secret');
  }
}
state = {authenticated: true, member: {status: 'approved'}};
for (const path of restricted) {
  const response = await fetch(path);
  assert([200, 308].includes(response.status), path);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store', path);
}
// Each request checks current membership; revocation takes effect immediately.
const beforeRevoke = calls;
await fetch('/admin/4.0.0/');
state = {authenticated: true, member: {status: 'revoked'}};
assert.equal((await fetch('/admin/4.0.0/')).status, 302);
assert.equal(calls, beforeRevoke + 2);
state = new Error('offline');
for (const path of restricted) assert.equal((await fetch(path)).status, 503, path);
for (const path of ['/', '/manual/user/', '/user-guide.html', '/manual/user/styles.css', '/manual/user/admin/3.5.3/images/dispense-demo.mp4', '/admin/3.5.3/images/dispense.png']) {
  const before = calls;
  assert.equal((await fetch(path)).status, 200, path);
  assert.equal(calls, before, 'Public guide must work during membership outage');
}
for (const path of ['/worker/src/index.js', '/README.md', '/scripts/check.mjs', '/.git/config', '/manual/user/worker/src/index.js']) {
  assert.equal((await fetch(path)).status, 404, path);
}
for (const path of ['/admin%5c4.0.0/', '/%00admin/', '/%ZZ', '/%25252525252561dmin/']) assert.equal((await fetch(path)).status, 400, path);
for (const path of restricted) {
  const before = assets;
  const response = await pages.fetch(new Request('https://refill-station-guide.pages.dev' + path), env);
  assert.equal(response.status, 302, path);
  assert.equal(new URL(response.headers.get('Location')).origin, 'https://refill.endet.xyz');
  assert.equal(assets, before, 'Pages must never serve restricted bytes');
}
for (const path of ['/worker/src/index.js', '/README.md', '/.git/config', '/scripts/check.mjs']) {
  assert.equal((await pages.fetch(new Request('https://refill-station-guide.pages.dev' + path), env)).status, 404);
}
const originalMembership = env.POS_MEMBERSHIP;
for (const fetch of [async () => new Response('unavailable', {status: 500}), async () => new Response('invalid JSON')]) {
  env.POS_MEMBERSHIP = {fetch};
  assert.equal((await router.fetch(new Request('https://refill.endet.xyz/admin/'), env)).status, 503);
}
env.POS_MEMBERSHIP = originalMembership;
assert.equal((await router.fetch(new Request('https://refill.endet.xyz/admin/'), {ASSETS: env.ASSETS})).status, 503);
state = {authenticated: false, member: {status: 'approved'}};
assert.equal((await fetch('/admin/')).status, 302);
const originalAssets = env.ASSETS;
env.ASSETS = {fetch: async () => new Response('0123456789', {headers: {'Content-Type': 'video/mp4', 'Content-Length': '10'}})};
const partial = await pages.fetch(new Request('https://refill-station-guide.pages.dev/manual/user/admin/3.5.3/images/dispense-demo.mp4', {headers: {Range: 'bytes=2-4'}}), env);
assert.equal(partial.status, 206);
assert.equal(await partial.text(), '234');
env.ASSETS = originalAssets;
const html = readFileSync(new URL('../user-guide.html', import.meta.url), 'utf8');
const images = new Set([...html.matchAll(/(?:href|src)="(admin\/[^\"]+)"/g)].map(match => '/' + match[1]));
assert.equal(images.size, 7);
for (const path of images) assert(isPublic(path), path);
for (const file of readdirSync(new URL('../admin/3.5.3/images/', import.meta.url))) {
  assert.equal(isPublic('/admin/3.5.3/images/' + file), images.has('/admin/3.5.3/images/' + file), file);
}
assert(!existsSync(new URL('../wrangler.jsonc', import.meta.url)), 'Do not auto-select an unbuilt Pages output directory for the existing no-build project');
const workerConfig = JSON.parse(readFileSync(new URL('../worker/wrangler.jsonc', import.meta.url), 'utf8'));
assert.equal(workerConfig.assets.run_worker_first, true);
assert.equal(workerConfig.workers_dev, false);
assert.equal(workerConfig.preview_urls, false);
console.log('PASS: membership gate, encoded aliases/traversal, outage, immediate revocation, private caching, source denial, Pages origin and exact customer media allowlist.');
