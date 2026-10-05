import { copyFileSync, existsSync, lstatSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const workerDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(workerDir, '..');
const output = resolve(workerDir, '.assets');
const files = [
  '404.html', '_headers', '_redirects', 'index.html', 'user-guide.html',
  'pos/index.html', 'pos/styles.css',
  'pos/images/login.png', 'pos/images/account-management.png', 'pos/images/account-settings.png', 'pos/images/store-form.png', 'pos/images/station-form.png',
  'pos/images/connection-info.png', 'pos/images/device-pos-web.png', 'pos/images/product-form.png',
  'pos/images/test-order.png', 'pos/images/test-pending.png', 'pos/images/device-pos-ready.png',
  'pos/images/test-received.png', 'pos/images/stations-two.png', 'pos/images/store-switch.png',
  'pos/images/toss-merchant-list.jpg', 'pos/images/toss-api-app.jpg',
  'pos/images/toss-pos-services.jpg', 'pos/images/toss-pos-service-code.jpg',
  'pos/images/toss-api-auth.jpg', 'pos/images/toss-webhook.jpg', 'pos/images/toss-test-apps.jpg',
  'styles.css', 'simulator.mjs', 'demo.ko.vtt',
  'assets/aeonik-hello-brand-700.svg', 'assets/aeonik-wordmark-brand-700.svg',
  'fonts/Geist-Variable.woff2', 'fonts/OFL.txt',
  'admin/index.html', 'admin/styles.css', 'admin/versions.js', 'admin/versions.json',
  'admin/assets/aeonik-wordmark-brand-700.svg', 'admin/fonts/Geist-Variable.woff2',
  'admin/fonts/OFL.txt', 'admin/3.5.3/index.html',
  'admin/3.5.3/images/calibration-beaker.png',
  'admin/3.5.3/images/calibration-fixed-input.png',
  'admin/3.5.3/images/calibration-fixed-running.png',
  'admin/3.5.3/images/calibration-model.png',
  'admin/3.5.3/images/calibration-note.png',
  'admin/3.5.3/images/calibration-point-input.png',
  'admin/3.5.3/images/calibration-ready.png',
  'admin/3.5.3/images/calibration-selection.png',
  'admin/3.5.3/images/calibration-verify-result.png',
  'admin/3.5.3/images/calibration.png',
  'admin/3.5.3/images/confirm.png',
  'admin/3.5.3/images/dispense-demo.mp4',
  'admin/3.5.3/images/dispense.png',
  'admin/3.5.3/images/main.png',
  'admin/3.5.3/images/paused.png',
  'admin/3.5.3/images/progress.png',
  'admin/3.5.3/images/recovery.png',
  'admin/3.5.3/images/result.png',
  'admin/3.5.3/images/settings-dispense.png',
  'admin/3.5.3/images/settings-pump.png',
  'admin/3.5.3/images/settings-reservoir-replace-input.png',
  'admin/3.5.3/images/settings-system.png',
  'admin/3.5.3/images/stage53-total-before.png',
  'admin/3.5.3/images/wait.png',
];

rmSync(output, { recursive: true, force: true });
for (const file of files) {
  const source = resolve(sourceRoot, file);
  if (!source.startsWith(`${sourceRoot}${sep}`) || !existsSync(source) || !lstatSync(source).isFile()) {
    throw new Error(`Missing public asset: ${file}`);
  }
  const target = resolve(output, file);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}
console.log(JSON.stringify({ copied_files: files.length, content_asset_files: files.length - 2, metadata_files: ['_headers', '_redirects'] }));
