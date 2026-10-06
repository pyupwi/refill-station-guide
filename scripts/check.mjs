import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import router from '../worker/src/index.js';
import './check-simulator.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
// Pin preserved 3.5.3 media; both version documents may receive approved prose edits.
const preserved = createHash('sha256');
for (const path of readdirSync(resolve(root, 'admin/3.5.3/images')).sort().map(name => `images/${name}`)) {
  preserved.update(path).update(readFileSync(resolve(root, 'admin/3.5.3', path)));
}
assert.equal(preserved.digest('hex'), 'bbd6415acc49122614a3f6335bfe465b18f78b3e17f089af8aecb9fa64d55866', '3.5.3 media must remain unchanged');
const manifest = JSON.parse(read('admin/versions.json'));
assert(manifest.versions.includes(manifest.latest));
assert.equal(new Set(manifest.versions).size, manifest.versions.length);
assert(read('admin/index.html').includes(`url=${manifest.latest}/`));
const pages = ['user-guide.html', ...manifest.versions.map(v => `admin/${v}/index.html`)];
let screenCount = 0;
for (const path of pages) {
  const html = read(path);
  assert(!html.includes('endet-symbol-geist-rounded.svg'), `Symbol must stay off guide pages: ${path}`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate anchors: ${path}`);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, path);
  assert(!/저울|사진 준비 중|image-placeholder/i.test(html), path);
  if (path !== 'admin/4.0.0/index.html') {
    assert(!/웹\s*서버|웹\s*관리|Web\s*(UI|Server)|시간\s*모드/i.test(html), path);
  }
  for (const [, fragment] of html.matchAll(/href="#([^"]+)"/g)) {
    assert(ids.includes(fragment), `Missing anchor ${fragment} in ${path}`);
  }
  for (const [, target] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (/^https?:/.test(target)) continue;
    assert(existsSync(resolve(root, dirname(path), target)), `Missing asset: ${path} -> ${target}`);
  }
  const images = [...html.matchAll(/<img\b[^>]+>/g)];
  for (const [tag] of images) assert(/alt="[^"]*"/.test(tag), tag);
  const screens = images.filter(([tag]) => /src="[^"]+\.png"/.test(tag));
  assert(screens.length > 0, `Screenshots missing: ${path}`);
  for (const [tag] of screens) {
    const src = /src="([^"]+)"/.exec(tag)[1];
    assert(/alt="[^"]+"/.test(tag) && /loading="lazy"/.test(tag), tag);
    assert(html.includes(`href="${src}"`), `Full-size screenshot link missing: ${src}`);
    const png = readFileSync(resolve(root, dirname(path), src));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', src);
    assert.equal(Number(/width="(\d+)"/.exec(tag)?.[1]), png.readUInt32BE(16), src);
    assert.equal(Number(/height="(\d+)"/.exec(tag)?.[1]), png.readUInt32BE(20), src);
    if (path !== 'admin/4.0.0/index.html' || !src.includes('web-')) {
      assert.equal(png.readUInt32BE(16), 800, src);
      assert.equal(png.readUInt32BE(20), 480, src);
    }
  }
  screenCount += screens.length;
}
for (const version of manifest.versions) {
  assert(/^\d+\.\d+\.\d+$/.test(version));
  assert(read(`admin/${version}/index.html`).includes(`data-version="${version}"`));
}
for (const url of [
  'https://refill.endet.xyz/manual/user/',
  'https://refill.endet.xyz/manual/admin/',
  'https://refill.endet.xyz/pos/',
  'https://refill.endet.xyz/pos-admin',
]) assert(read('index.html').includes(url), `Landing link missing: ${url}`);
assert.equal((read('index.html').match(/<a\b/g) || []).length, 4);
const posGuide = read('pos/index.html');
assert(posGuide.includes('<link rel="canonical" href="https://refill.endet.xyz/pos/">'));
assert(posGuide.includes('href="/pos/styles.css"'));
const posIds = [...posGuide.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
assert.equal(new Set(posIds).size, posIds.length, 'Duplicate POS guide anchors');
for (const id of ['start', 'stores-devices', 'station-register', 'device-pos', 'products', 'manual-test', 'multi-devices', 'multi-stores', 'toss-test', 'daily', 'cancel', 'troubleshooting', 'security']) {
  assert(posIds.includes(id), `Missing POS guide section ${id}`);
}
for (const [, fragment] of posGuide.matchAll(/href="#([^"]+)"/g)) {
  assert(posIds.includes(fragment), `Missing POS guide anchor ${fragment}`);
}
assert(posGuide.includes('aria-label="POS 안내 목차"'));
const posImageIds = ['login', 'account-management', 'account-settings', 'store-form', 'station-form', 'connection-info', 'device-pos-web', 'product-form', 'test-order', 'test-pending', 'device-pos-ready', 'test-received', 'stations-two', 'store-switch'];
const posImages = [...posGuide.matchAll(/<img\b[^>]+src="\/pos\/images\/([^"]+\.png)"[^>]*>/g)];
assert.equal(posImages.length, posImageIds.length, 'POS guide screenshot count');
for (const id of posImageIds) {
  const path = `pos/images/${id}.png`;
  assert(existsSync(resolve(root, path)), `Missing POS screenshot: ${path}`);
  const tag = posImages.find(([, src]) => src === `${id}.png`)?.[0];
  assert(tag && /loading="lazy"/.test(tag), `POS screenshot must load lazily: ${id}`);
  const png = readFileSync(resolve(root, path));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', path);
  assert.equal(Number(/width="(\d+)"/.exec(tag)?.[1]), png.readUInt32BE(16), `Wrong width: ${path}`);
  assert.equal(Number(/height="(\d+)"/.exec(tag)?.[1]), png.readUInt32BE(20), `Wrong height: ${path}`);
  const imageAt = posGuide.indexOf(tag);
  const figureStart = posGuide.lastIndexOf('<figure', imageAt);
  const figureEnd = posGuide.indexOf('</figure>', imageAt) + '</figure>'.length;
  const figure = posGuide.slice(figureStart, figureEnd);
  assert(figure.includes(`<a href="/pos/images/${id}.png" target="_blank" rel="noopener">`), `Full-size POS screenshot link missing: ${id}`);
  assert(/<figcaption>[\s\S]*?\S[\s\S]*?<\/figcaption>/.test(figure), `POS screenshot caption missing: ${id}`);
}
const tossScreenshots = [
  ['toss-merchant-list', 962, 285], ['toss-api-app', 722, 240],
  ['toss-pos-services', 2008, 1504], ['toss-pos-service-code', 2008, 1504],
  ['toss-api-auth', 516, 220], ['toss-webhook', 722, 145], ['toss-test-apps', 700, 168],
];
const tossImages = [...posGuide.matchAll(/<img\b[^>]+src="\/pos\/images\/([^"]+\.jpg)"[^>]*>/g)];
assert.equal(tossImages.length, tossScreenshots.length, 'Toss guide screenshot count');
for (const [id, width, height] of tossScreenshots) {
  const path = `pos/images/${id}.jpg`;
  assert(existsSync(resolve(root, path)), `Missing Toss screenshot: ${path}`);
  const tag = tossImages.find(([, src]) => src === `${id}.jpg`)?.[0];
  assert(tag && /loading="lazy"/.test(tag) && /alt="[^"]+"/.test(tag), `Toss screenshot needs alt and lazy loading: ${id}`);
  assert.equal(readFileSync(resolve(root, path)).subarray(0, 2).toString('hex'), 'ffd8', path);
  assert.equal(Number(/width="(\d+)"/.exec(tag)?.[1]), width, `Wrong width: ${path}`);
  assert.equal(Number(/height="(\d+)"/.exec(tag)?.[1]), height, `Wrong height: ${path}`);
  const imageAt = posGuide.indexOf(tag);
  const figureStart = posGuide.lastIndexOf('<figure', imageAt);
  const figureEnd = posGuide.indexOf('</figure>', imageAt) + '</figure>'.length;
  const figure = posGuide.slice(figureStart, figureEnd);
  assert(figure.includes(`<a href="/pos/images/${id}.jpg" target="_blank" rel="noopener">`), `Full-size Toss screenshot link missing: ${id}`);
  assert(/<figcaption>[\s\S]*?\S[\s\S]*?<\/figcaption>/.test(figure), `Toss screenshot caption missing: ${id}`);
}
for (const [, asset] of posGuide.matchAll(/(?:href|src)="(\/[^"#]+)"/g)) {
  assert(existsSync(resolve(root, asset.slice(1))), `Missing POS guide asset: ${asset}`);
}
const posCss = read('pos/styles.css');
const posFont = /url\("(\/[^\"]+\.woff2)"\)/.exec(posCss)?.[1];
assert(posFont && existsSync(resolve(root, posFont.slice(1))), `Missing POS guide font: ${posFont}`);
assert(posGuide.includes('src="/assets/aeonik-wordmark-brand-700.svg"'));
assert(read('user-guide.html').includes('리필재개'));
assert(read('user-guide.html').includes('src="simulator.mjs"'));
assert(read('_redirects').includes('/manual/user/ /user-guide 200'));
assert(read('user-guide.html').includes('controls muted loop playsinline preload="none"'));
assert(read('styles.css').includes('prefers-reduced-motion'));
for (const [, id] of read('simulator.mjs').matchAll(/get\('([^']+)'\)/g)) {
  assert(read('user-guide.html').includes(`id="${id}"`), `Simulator element missing: ${id}`);
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

let observed;
const env = { ASSETS: { fetch: async request => { observed = request; return new Response('upstream'); } } };
const adminPage = new URL('https://refill.endet.xyz/manual/admin/3.5.3/');
const adminCss = new URL('../styles.css', adminPage);
const brandFiles = [
  ...[...read('admin/3.5.3/index.html').matchAll(/(?:href|src)="([^"]+\.svg)"/g)].map(([, path]) => [path, adminPage]),
  [read('admin/styles.css').match(/url\("([^"]+\.woff2)"\)/)[1], adminCss],
];
for (const [path, base] of brandFiles) {
  const publicPath = new URL(path, base).pathname;
  assert(publicPath.startsWith('/manual/admin/'), `Asset escaped admin route: ${publicPath}`);
  const file = resolve(root, 'admin' + publicPath.slice('/manual/admin'.length));
  assert(existsSync(file), `Missing public admin asset: ${publicPath}`);
  const bytes = readFileSync(file);
  assert(bytes.subarray(0, 4).toString() === (path.endsWith('.svg') ? '<svg' : 'wOF2'), `Wrong asset type: ${publicPath}`);
}
try {
  for (const [prefix, directory] of [['/manual/user', ''], ['/manual/admin', '/admin']]) {
    const redirect = await router.fetch(new Request(`https://refill.endet.xyz${prefix}?from=qr`), env);
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get('Location'), `https://refill.endet.xyz${prefix}/?from=qr`);
    for (const suffix of ['/', '/styles.css', '/3.5.3/', '/4.0.0/', '/4.0.0/images/main.png', '/versions.json', '/assets/aeonik-wordmark-brand-700.svg', '/fonts/Geist-Variable.woff2']) {
      await router.fetch(new Request(`https://refill.endet.xyz${prefix}${suffix}?a=1`), env);
      const target = prefix === '/manual/user' && suffix === '/' ? '/user-guide' : `${directory}${suffix}`;
      assert.equal(observed.url, `https://refill.endet.xyz${target}?a=1`);
    }
    await router.fetch(new Request(`https://refill.endet.xyz${prefix}/`, { method: 'HEAD' }), env);
    assert.equal(observed.method, 'HEAD');
    assert.equal((await router.fetch(new Request(`https://refill.endet.xyz${prefix}/`, { method: 'POST' }), env)).status, 405);
  }
  for (const path of ['/', '/shop/', '/manual/admin-old/', '/manual/user-old/']) {
    assert.equal((await router.fetch(new Request(`https://refill.endet.xyz${path}`), env)).status, 404);
  }
  env.ASSETS.fetch = async request => {
    observed = request;
    return new Response('0123456789', { headers: { 'Content-Type': 'video/mp4', 'Content-Length': '10', ETag: '"clip"' } });
  };
  for (const prefix of ['/manual/user', '/manual/admin']) {
    for (const [range, status, body, contentRange] of [
      ['bytes=0-1', 206, '01', 'bytes 0-1/10'], ['bytes=4-', 206, '456789', 'bytes 4-9/10'],
      ['bytes=-3', 206, '789', 'bytes 7-9/10'], ['bytes=7-999', 206, '789', 'bytes 7-9/10'],
      ['bytes=10-', 416, '', 'bytes */10'], ['bytes=8-2', 416, '', 'bytes */10'],
      ['bytes=-0', 416, '', 'bytes */10'], ['bytes=0-1,4-5', 200, '0123456789', null],
      ['invalid', 200, '0123456789', null],
    ]) {
      const partial = await router.fetch(new Request(`https://refill.endet.xyz${prefix}/demo.mp4`, { headers: { Range: range } }), env);
      assert.equal(observed.headers.get('Range'), range);
      assert.equal(partial.status, status, range);
      assert.equal(partial.headers.get('Content-Range'), contentRange, range);
      assert.equal(await partial.text(), body, range);
    }
    const stale = await router.fetch(new Request(`https://refill.endet.xyz${prefix}/demo.mp4`, { headers: { Range: 'bytes=0-1', 'If-Range': '"old"' } }), env);
    assert.equal(stale.status, 200);
    assert.equal(await stale.text(), '0123456789');
  }
  env.ASSETS.fetch = async request => {
    observed = request;
    return new Response('0123456789', { headers: { 'Content-Type': 'video/mp4' } });
  };
  const missingLength = await router.fetch(new Request('https://refill.endet.xyz/manual/user/demo.mp4', {
    headers: { Range: 'bytes=0-1' },
  }), env);
  assert.equal(missingLength.status, 206);
  assert.equal(missingLength.headers.get('Content-Range'), 'bytes 0-1/10');
  assert.equal(await missingLength.text(), '01');
  env.ASSETS.fetch = async () => new Response(null, { status: 308, headers: { Location: '/admin/3.5.3/?q=1' } });
  const canonical = await router.fetch(new Request('https://refill.endet.xyz/manual/admin/3.5.3'), env);
  assert.equal(canonical.headers.get('Location'), 'https://refill.endet.xyz/manual/admin/3.5.3/?q=1');
} finally { env.ASSETS.fetch = async request => { observed = request; return new Response('upstream'); }; }

// Test version navigation without a browser or extra packages.
async function checkVersions(payload, fail = false, current = '3.5.3') {
  const select = { value: current, addEventListener: (_, cb) => select.change = cb,
    replaceChildren: (...children) => select.children = children };
  const status = {};
  const location = { href: `https://refill.endet.xyz/manual/admin/${current}/`, hash: '#precise',
    assign: url => location.assigned = String(url) };
  const context = { URL, location, Option: class { constructor(label, value, def, selected) { Object.assign(this, {label, value, selected}); } },
    document: { body: { dataset: { version: current } }, querySelector: id => id === '#guide-version' ? select : status },
    fetch: async () => ({ ok: !fail, json: async () => payload }) };
  vm.runInNewContext(read('admin/versions.js'), context);
  await new Promise(setImmediate);
  return { select, status, location };
}
assert.deepEqual(manifest, { latest: '4.0.0', versions: ['4.0.0', '3.5.3'] });
for (const current of manifest.versions) {
  const valid = await checkVersions(manifest, false, current);
  assert.equal(valid.select.children.length, 2);
  assert.equal(valid.select.children.find(option => option.value === current).selected, true);
  const destination = manifest.versions.find(version => version !== current);
  valid.select.value = destination; valid.select.change();
  assert.equal(valid.location.assigned, `https://refill.endet.xyz/manual/admin/${destination}/#precise`);
}
const currentGuide = read('admin/4.0.0/index.html');
for (const [, asset] of currentGuide.matchAll(/(?:href|src)="(images\/[^"]+)"/g)) {
  assert(read('worker/scripts/prepare-assets.mjs').includes(`'admin/4.0.0/${asset}'`), `New administrator asset absent from Worker allowlist: ${asset}`);
}
assert(read('worker/scripts/prepare-assets.mjs').includes("'admin/4.0.0/index.html'"));
assert(!/3\.5\.3과 달리|이전에는|변경 이력|정식 출시|stable/i.test(currentGuide));
for (const id of ['overview', 'daily', 'calibration', 'quick', 'manual-calibration', 'precise', 'verification', 'calibration-records', 'accuracy', 'reservoir', 'dispense-settings', 'pump', 'system', 'care', 'troubleshooting', 'switch', 'network-web', 'ota', 'pos']) {
  assert(currentGuide.includes(`id="${id}"`), `Missing 4.0 administrator topic: ${id}`);
}
for (const phrase of ['스위치 운전', '화면 절전', '기기 접속 이름', '준비 자동 취소', 'Web 관리', 'OTA', 'POS 사용']) {
  assert(currentGuide.includes(phrase), `Missing current administrator instruction: ${phrase}`);
}
for (const [payload, fail] of [[{}, true], [{ latest: '../bad', versions: ['3.5.3', '../bad'] }, false]]) {
  const result = await checkVersions(payload, fail);
  assert(result.status.textContent.includes('현재 설명서는 계속 읽을 수 있습니다'));
  assert.equal(result.select.children, undefined);
}
console.log(`PASS: ${pages.length} guide pages, ${screenCount} screenshots with full-size links, anchors/assets, version navigation/fallback, both public routes and canonical redirects.`);
