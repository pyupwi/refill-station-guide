import assert from 'node:assert/strict';
import { initialState, transition, mountSimulator } from '../simulator.mjs';

let state = initialState();
const send = (type, extra = {}) => state = transition(state, { type, ...extra });
send('amount', { value: 9999 }); assert.equal(state.amount, 3000);
send('amount', { value: -100 }); assert.equal(state.amount, 100);
send('amount', { value: NaN }); assert.equal(state.amount, 100);
send('amount', { value: 450 }); assert.equal(state.amount, 500);
send('tap'); assert.equal(state.phase, 'confirm');
send('tick', { ms: 9000 }); assert.equal(state.delivered, 0);
send('secondary'); assert.equal(state.phase, 'ready');
send('tap'); send('primary'); send('tick', { ms: 1800 });
assert.equal(state.delivered, 150);
send('amount', { value: 1000 }); assert.equal(state.amount, 500);
send('tap'); assert.equal(state.phase, 'paused');
send('tick', { ms: 60000 }); assert.equal(state.delivered, 150);
send('primary'); send('tick', { ms: 60000 });
assert.equal(state.delivered, 500); assert.equal(state.phase, 'complete');
send('tick', { ms: 2500 }); assert.equal(state.phase, 'waiting');
send('tap'); assert.equal(state.phase, 'waiting');
send('tick', { ms: 3000 }); assert.equal(state.phase, 'ready');
send('tap'); send('primary'); send('tick', { ms: 1200 }); send('tap'); send('secondary');
assert.equal(state.phase, 'stopped'); assert.equal(state.delivered, 100);
send('primary'); assert.equal(state.phase, 'stopped');
send('tick', { ms: 2500 }); assert.equal(state.phase, 'ready');
send('tap'); send('primary'); send('reset'); send('tick', { ms: 6000 });
assert.deepEqual(state, initialState());

// Exercise the actual event wiring with a small DOM stand-in; no browser package.
class Element {
  hidden = false; disabled = false; textContent = ''; style = {}; dataset = {}; attrs = {}; events = {};
  addEventListener(name, fn) { this.events[name] = fn; }
  setAttribute(key, value) { this.attrs[key] = value; }
  focus() {}
  setPointerCapture() {}
  getBoundingClientRect() { return { height: 480 }; }
  fire(name, data = {}) { this.events[name]({ detail: 1, ...data }); }
}
const nodes = new Map();
const get = id => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); };
const modes = ['practice', 'video'].map(mode => Object.assign(new Element(), { dataset: { mode } }));
const root = { querySelector: selector => get(selector.slice(1)), querySelectorAll: () => modes };
let timer, paused = 0, played = 0;
get('demo-video').pause = () => paused++;
get('demo-video').play = async () => played++;
const originals = { document: globalThis.document, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval };
globalThis.document = { hidden: false };
globalThis.setInterval = callback => { timer = callback; return 1; };
globalThis.clearInterval = () => { timer = null; };
try {
  const dispose = mountSimulator(root);
  const tap = get('sim-tap'), screen = get('sim-screen');
  assert.equal(screen.dataset.phase, 'ready');
  assert.equal(get('video-stage').hidden, true);
  get('amount-plus').fire('click'); assert.equal(get('sim-number').textContent, 600);
  tap.fire('pointerdown', { pointerId: 1, isPrimary: true, button: 0, clientY: 300 });
  tap.fire('pointermove', { pointerId: 1, clientY: 252 });
  tap.fire('pointerup', { pointerId: 1 }); tap.fire('click');
  assert.equal(screen.dataset.phase, 'ready', 'A swipe must not start a refill');
  assert.equal(get('sim-number').textContent, 900);
  tap.fire('keydown', { key: 'ArrowDown', preventDefault() {} });
  assert.equal(get('sim-number').textContent, 800);
  tap.fire('click', { detail: 0 }); assert.equal(screen.dataset.phase, 'confirm');
  get('sim-primary').fire('click'); timer();
  tap.fire('click'); assert.equal(screen.dataset.phase, 'paused');
  const amount = get('sim-detail').textContent;
  for (let i = 0; i < 50; i++) timer();
  assert.equal(get('sim-detail').textContent, amount);
  get('sim-primary').fire('click'); globalThis.document.hidden = true;
  timer(); assert.equal(get('sim-detail').textContent, amount, 'Background tabs must not advance');
  globalThis.document.hidden = false;
  modes[1].fire('click'); timer();
  assert.equal(screen.hidden, true); assert.equal(played, 1);
  modes[0].fire('click'); assert.equal(screen.dataset.phase, 'ready'); assert(paused >= 2);
  get('demo-video').play = () => Promise.reject(new Error('Autoplay unavailable'));
  modes[1].fire('click'); modes[0].fire('click');
  await Promise.resolve();
  assert.equal(get('lesson-title').textContent, '얼마나 담아볼까요?', 'Late media errors must not replace practice instructions');
  tap.fire('click'); get('sim-primary').fire('click');
  get('sim-reset').fire('click'); timer(); assert.equal(screen.dataset.phase, 'ready');
  dispose(); assert.equal(timer, null);
} finally { Object.assign(globalThis, originals); }
console.log('PASS: simulation quantities, confirmation, pause/resume, stop, completion/wait, reset, swipe/click/keyboard, video switching and background suspension.');
