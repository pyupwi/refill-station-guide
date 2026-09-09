import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import router from '../worker/src/index.js';
import './check-simulator.mjs';

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
assert(read('index.html').includes('src="simulator.mjs"'));
assert(read('index.html').includes('controls muted loop playsinline preload="none"'));
assert(read('styles.css').includes('prefers-reduced-motion'));
for (const [, id] of read('simulator.mjs').matchAll(/get\('([^']+)'\)/g)) {
  assert(read('index.html').includes(`id="${id}"`), `Simulator element missing: ${id}`);
}
const movie = readFileSync(resolve(root, 'admin/3.5.3/images/dispense-demo.mp4'));
const atoms = [];
for (let offset = 0; offset < movie.length;) {
  const shortSize = movie.readUInt32BE(offset);
  const size = shortSize === 1 ? Number(movie.readBigUInt64BE(offset + 8)) : shortSize || movie.length - offset;
  assert(size >= 8 && offset + size <= movie.length, 'Invalid video container');
  atoms.push(movie.toString('ascii', offset + 4, offset + 8)); offset += size;
}
assert.equal(atoms[0], 'ftyp');
assert(atoms.includes('moov') && atoms.indexOf('moov') < atoms.indexOf('mdat'), 'Video must support progressive playback');
assert(movie.length <= 2 * 1024 * 1024, 'Use native range storage for larger videos');

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
  globalThis.fetch = async request => {
    observed = request;
    return new Response('0123456789', { headers: { 'Content-Type': 'video/mp4', 'Content-Length': '10', ETag: '"clip"' } });
  };
  for (const prefix of ['/refill-user-guide', '/refill-admin-guide']) {
    for (const [range, status, body, contentRange] of [
      ['bytes=0-1', 206, '01', 'bytes 0-1/10'], ['bytes=4-', 206, '456789', 'bytes 4-9/10'],
      ['bytes=-3', 206, '789', 'bytes 7-9/10'], ['bytes=7-999', 206, '789', 'bytes 7-9/10'],
      ['bytes=10-', 416, '', 'bytes */10'], ['bytes=8-2', 416, '', 'bytes */10'],
      ['bytes=-0', 416, '', 'bytes */10'], ['bytes=0-1,4-5', 200, '0123456789', null],
      ['invalid', 200, '0123456789', null],
    ]) {
      const partial = await router.fetch(new Request(`https://endet.xyz${prefix}/demo.mp4`, { headers: { Range: range } }), env);
      assert.equal(observed.headers.get('Range'), range);
      assert.equal(partial.status, status, range);
      assert.equal(partial.headers.get('Content-Range'), contentRange, range);
      assert.equal(await partial.text(), body, range);
    }
    const stale = await router.fetch(new Request(`https://endet.xyz${prefix}/demo.mp4`, { headers: { Range: 'bytes=0-1', 'If-Range': '"old"' } }), env);
    assert.equal(stale.status, 200);
    assert.equal(await stale.text(), '0123456789');
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
