// A local teaching model. It never connects to a device or predicts real output.
export function initialState(amount = 500) {
  return { phase: 'ready', amount, delivered: 0, elapsed: 0 };
}

export function transition(state, event) {
  const enter = phase => ({ ...state, phase, elapsed: 0 });
  if (event.type === 'reset') return initialState();
  if (event.type === 'amount' && state.phase === 'ready' && Number.isFinite(event.value)) {
    return { ...state, amount: Math.min(3000, Math.max(100, Math.round(event.value / 100) * 100)) };
  }
  if (event.type === 'tap') {
    if (state.phase === 'ready') return enter('confirm');
    if (state.phase === 'filling') return enter('paused');
  }
  if (event.type === 'primary') {
    if (state.phase === 'confirm' || state.phase === 'paused') return enter('filling');
  }
  if (event.type === 'secondary') {
    if (state.phase === 'confirm') return initialState(state.amount);
    if (state.phase === 'paused') return enter('stopped');
  }
  if (event.type !== 'tick' || !Number.isFinite(event.ms) || event.ms <= 0) return state;
  // Six seconds is a teaching pace, independent of quantity and calibration.
  if (state.phase === 'filling') {
    const delivered = Math.min(state.amount, state.delivered + state.amount * event.ms / 6000);
    return { ...state, delivered, phase: delivered >= state.amount ? 'complete' : 'filling', elapsed: 0 };
  }
  if (!['complete', 'stopped', 'waiting'].includes(state.phase)) return state;
  const elapsed = state.elapsed + event.ms;
  if (state.phase === 'waiting' && elapsed >= 3000) return initialState(state.amount);
  if (state.phase === 'stopped' && elapsed >= 2500) return initialState(state.amount);
  if (state.phase === 'complete' && elapsed >= 2500) return enter('waiting');
  return { ...state, elapsed };
}

const lessons = {
  ready: ['01 · 양 선택', '얼마나 담아볼까요?', '숫자와 단위를 확인하세요. 양을 고른 다음 가상 화면을 한 번 탭해보세요.'],
  confirm: ['02 · 시작 확인', '용기를 놓았다면, 시작.', '화면의 리필 시작을 눌러보세요. 실제 매장에서는 이 확인 화면 없이 바로 시작될 수도 있어요.'],
  filling: ['03 · 리필 중', '잠깐 멈춰볼까요?', '진행 중인 화면을 탭하면 일시정지해요. 그대로 두면 정한 양에서 완료됩니다.'],
  paused: ['04 · 일시정지', '계속할까요, 끝낼까요?', '리필재개를 누르면 이어서 채워요. 정지를 누르면 이번 리필을 끝내요.'],
  complete: ['05 · 리필 완료', '마지막 방울까지 기다려요.', '완료 표시가 나와도 남은 액체가 떨어질 수 있어요. 용기를 바로 꺼내지 마세요.'],
  waiting: ['06 · 다음 리필 준비', '처음 화면으로 돌아갈 때까지.', '대기가 끝나고 액체도 더 이상 떨어지지 않는 것을 확인한 뒤 용기를 꺼내세요.'],
  stopped: ['이번 리필 종료', '리필을 멈췄어요.', '정지를 누르면 이어서 채우지 않고 이번 리필을 끝내요. 남은 액체가 멈췄는지 확인하세요.'],
};

export function mountSimulator(root) {
  const get = id => root.querySelector(`#${id}`);
  const screen = get('sim-screen'), tap = get('sim-tap'), actions = get('sim-actions');
  const primary = get('sim-primary'), secondary = get('sim-secondary'), video = get('demo-video');
  let state = initialState(), mode = 'practice', previousPhase;
  let gesture = null, suppressClick = false;

  function render() {
    const { phase, amount, delivered } = state;
    const percent = Math.min(100, Math.floor(delivered / amount * 100));
    const progress = phase === 'filling' || phase === 'paused';
    get('sim-reading').textContent = progress ? `${amount} g 중 ${Math.floor(delivered)} g, ${percent}% 진행` : '';
    screen.dataset.phase = phase;
    get('sim-status').textContent = { ready: '', confirm: '준비됨', filling: '리필 중', paused: '일시정지', complete: '✓', waiting: '잠시 대기', stopped: '×' }[phase];
    get('sim-number').textContent = phase === 'waiting' ? Math.max(1, Math.ceil((3000 - state.elapsed) / 1000)) : progress ? percent : phase === 'stopped' ? Math.round(delivered) : amount;
    get('sim-unit').textContent = phase === 'waiting' ? '초' : progress ? '%' : 'g';
    get('sim-detail').textContent = progress ? `${Math.floor(delivered)} / ${amount} g` : { complete: '리필 완료', waiting: '다음 리필 준비 중', stopped: '리필 취소됨' }[phase] || '';
    get('sim-hint').textContent = { ready: '위/아래로 밀어 조절, 누르면 시작', filling: '화면을 누르면 일시정지', complete: '잠시 후 이전 화면으로 돌아갑니다', stopped: '잠시 후 이전 화면으로 돌아갑니다' }[phase] || '';
    get('sim-liquid').style.height = `${['complete', 'waiting'].includes(phase) ? 100 : progress || phase === 'stopped' ? percent : amount / 3000 * 100}%`;
    tap.hidden = !['ready', 'filling'].includes(phase);
    tap.setAttribute('aria-label', phase === 'ready' ? `${amount} g으로 리필 시작 확인. 위아래 방향키로 양을 조절할 수 있습니다.` : '리필 일시정지');
    actions.hidden = !['confirm', 'paused'].includes(phase);
    primary.textContent = phase === 'paused' ? '리필재개' : '리필 시작';
    secondary.textContent = phase === 'paused' ? '정지' : '취소';
    get('amount-controls').hidden = phase !== 'ready';
    get('amount-value').textContent = `${amount} g`;
    get('amount-minus').disabled = amount <= 100;
    get('amount-plus').disabled = amount >= 3000;
    if (phase !== previousPhase) {
      const [label, title, text] = lessons[phase];
      get('lesson-label').textContent = label;
      get('lesson-title').textContent = title;
      get('lesson-text').textContent = text;
      previousPhase = phase;
    }
  }

  function send(event, userAction = true) {
    const previous = state;
    state = transition(state, event);
    if (state === previous) return;
    render();
    if (userAction && state.phase !== previous.phase) {
      if (!actions.hidden) primary.focus({ preventScroll: true });
      else if (!tap.hidden) tap.focus({ preventScroll: true });
      else screen.focus({ preventScroll: true });
    }
  }

  function setMode(next) {
    mode = next;
    gesture = null; suppressClick = false;
    for (const button of root.querySelectorAll('[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    screen.hidden = mode !== 'practice';
    get('video-stage').hidden = mode !== 'video';
    get('sim-reset').hidden = mode !== 'practice';
    get('stage-label').textContent = mode === 'practice' ? '가상 화면 · 직접 눌러보세요' : '3.5.3 화면 시연 · 약 17초 · 소리 없음';
    state = initialState(); previousPhase = undefined;
    if (mode === 'practice') { video.pause(); render(); }
    else {
      get('amount-controls').hidden = true;
      get('lesson-label').textContent = '움직이는 화면으로 보기';
      get('lesson-title').textContent = '한 번의 리필을 따라가요.';
      get('lesson-text').textContent = '시작 → 일시정지 → 리필재개 → 완료와 대기 순서예요. 아래 재생 막대로 멈추거나 다시 볼 수 있어요.';
      video.currentTime = 0;
      video.play().catch(() => {
        if (mode === 'video') get('lesson-text').textContent = '영상 아래쪽의 재생 버튼을 눌러 시작하세요.';
      });
    }
  }

  tap.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
    suppressClick = false; send({ type: 'tap' });
  });
  tap.addEventListener('pointerdown', event => {
    if (state.phase !== 'ready' || !event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    gesture = { id: event.pointerId, y: event.clientY, amount: state.amount, moved: false };
    tap.setPointerCapture(event.pointerId);
  });
  tap.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const delta = gesture.y - event.clientY;
    if (Math.abs(delta) > 8) gesture.moved = true;
    if (gesture.moved) send({ type: 'amount', value: gesture.amount + delta / screen.getBoundingClientRect().height * 3000 });
  });
  tap.addEventListener('pointerup', event => {
    if (gesture?.id !== event.pointerId) return;
    suppressClick = gesture.moved; gesture = null;
  });
  tap.addEventListener('pointercancel', () => { gesture = null; suppressClick = true; });
  tap.addEventListener('keydown', event => {
    if (state.phase === 'ready' && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); send({ type: 'amount', value: state.amount + (event.key === 'ArrowUp' ? 100 : -100) });
    }
  });
  primary.addEventListener('click', () => send({ type: 'primary' }));
  secondary.addEventListener('click', () => send({ type: 'secondary' }));
  get('amount-minus').addEventListener('click', () => send({ type: 'amount', value: state.amount - 100 }));
  get('amount-plus').addEventListener('click', () => send({ type: 'amount', value: state.amount + 100 }));
  get('sim-reset').addEventListener('click', () => send({ type: 'reset' }));
  for (const button of root.querySelectorAll('[data-mode]')) button.addEventListener('click', () => setMode(button.dataset.mode));
  const clock = setInterval(() => {
    if (!document.hidden && mode === 'practice') send({ type: 'tick', ms: 50 }, false);
  }, 50);
  get('mode-switch').hidden = false;
  setMode('practice');
  return () => { clearInterval(clock); video.pause(); };
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-simulator]');
  if (root) mountSimulator(root);
}
