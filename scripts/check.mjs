import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import router from '../worker/src/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const manifest = JSON.parse(read('admin/versions.json'));
assert(manifest.versions.includes(manifest.latest));
assert.equal(new Set(manifest.versions).size, manifest.versions.length);
assert(read('admin/index.html').includes(`url=${manifest.latest}/`));
const pages = ['index.html', ...manifest.versions.map(v => `admin/${v}/index.html`)];
let screenCount = 0;
for (const path of pages) {
  const html = read(path);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate anchors: ${path}`);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, path);
  assert(!/저울|웹\s*서버|웹\s*관리|Web\s*(UI|Server)|사진 준비 중|image-placeholder|시간\s*모드/i.test(html), path);
  for (const [, fragment] of html.matchAll(/href="#([^"]+)"/g)) {
    assert(ids.includes(fragment), `Missing anchor ${fragment} in ${path}`);
  }
  for (const [, target] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (/^https?:/.test(target)) continue;
    assert(existsSync(resolve(root, dirname(path), target)), `Missing asset: ${path} -> ${target}`);
  }
  const screens = [...html.matchAll(/<img\b[^>]+>/g)];
  assert(screens.length > 0, `Screenshots missing: ${path}`);
  for (const [tag] of screens) {
    const src = /src="([^"]+)"/.exec(tag)[1];
    assert(/alt="[^"]+"/.test(tag) && /width="800"/.test(tag) && /height="480"/.test(tag), tag);
    assert(html.includes(`href="${src}"`), `Full-size screenshot link missing: ${src}`);
    const png = readFileSync(resolve(root, dirname(path), src));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', src);
    assert.equal(png.readUInt32BE(16), 800, src);
    assert.equal(png.readUInt32BE(20), 480, src);
  }
  screenCount += screens.length;
}
for (const version of manifest.versions) {
  assert(/^\d+\.\d+\.\d+$/.test(version));
  assert(read(`admin/${version}/index.html`).includes(`data-version="${version}"`));
}
assert(read('index.html').includes('리필재개'));
assert(read('styles.css').includes('admin/styles.css'));

const env = { PAGES_ORIGIN: 'https://refill-station-guide.pages.dev' };
const realFetch = globalThis.fetch;
let observed;
globalThis.fetch = async request => { observed = request; return new Response('upstream'); };
try {
  for (const [prefix, directory] of [['/refill-user-guide', ''], ['/refill-admin-guide', '/admin']]) {
    const redirect = await router.fetch(new Request(`https://endet.xyz${prefix}?from=qr`), env);
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get('Location'), `https://endet.xyz${prefix}/?from=qr`);
    for (const suffix of ['/', '/styles.css', '/3.5.3/', '/versions.json']) {
      await router.fetch(new Request(`https://endet.xyz${prefix}${suffix}?a=1`), env);
      assert.equal(observed.url, `${env.PAGES_ORIGIN}${directory}${suffix}?a=1`);
    }
    await router.fetch(new Request(`https://endet.xyz${prefix}/`, { method: 'HEAD' }), env);
    assert.equal(observed.method, 'HEAD');
    assert.equal((await router.fetch(new Request(`https://endet.xyz${prefix}/`, { method: 'POST' }), env)).status, 405);
  }
  for (const path of ['/', '/shop/', '/refill-admin-guide-other/', '/refill-user-guide-old/']) {
    assert.equal((await router.fetch(new Request(`https://endet.xyz${path}`), env)).status, 404);
  }
  globalThis.fetch = async () => new Response(null, { status: 308, headers: { Location: '/admin/3.5.3/?q=1' } });
  const canonical = await router.fetch(new Request('https://endet.xyz/refill-admin-guide/3.5.3'), env);
  assert.equal(canonical.headers.get('Location'), 'https://endet.xyz/refill-admin-guide/3.5.3/?q=1');
} finally { globalThis.fetch = realFetch; }

// Test version navigation without a browser or extra packages.
async function checkVersions(payload, fail = false) {
  const select = { value: '3.5.3', addEventListener: (_, cb) => select.change = cb,
    replaceChildren: (...children) => select.children = children };
  const status = {};
  const location = { href: 'https://endet.xyz/refill-admin-guide/3.5.3/', hash: '#precise',
    assign: url => location.assigned = String(url) };
  const context = { URL, location, Option: class { constructor(label, value, def, selected) { Object.assign(this, {label, value, selected}); } },
    document: { body: { dataset: { version: '3.5.3' } }, querySelector: id => id === '#guide-version' ? select : status },
    fetch: async () => ({ ok: !fail, json: async () => payload }) };
  vm.runInNewContext(read('admin/versions.js'), context);
  await new Promise(setImmediate);
  return { select, status, location };
}
const valid = await checkVersions({ latest: '3.6.0', versions: ['3.6.0', '3.5.3'] });
assert.equal(valid.select.children.length, 2);
assert.equal(valid.select.children[1].selected, true);
valid.select.value = '3.6.0'; valid.select.change();
assert.equal(valid.location.assigned, 'https://endet.xyz/refill-admin-guide/3.6.0/#precise');
for (const [payload, fail] of [[{}, true], [{ latest: '../bad', versions: ['3.5.3', '../bad'] }, false]]) {
  const result = await checkVersions(payload, fail);
  assert(result.status.textContent.includes('현재 설명서는 계속 읽을 수 있습니다'));
  assert.equal(result.select.children, undefined);
}
console.log(`PASS: ${pages.length} guide pages, ${screenCount} screenshots with full-size links, anchors/assets, version navigation/fallback, both public routes and canonical redirects.`);
