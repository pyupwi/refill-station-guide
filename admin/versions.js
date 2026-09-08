const versionSelect = document.querySelector('#guide-version');
const currentVersion = document.body.dataset.version;
versionSelect.addEventListener('change', () => {
  const next = new URL(`../${versionSelect.value}/`, location.href);
  next.hash = location.hash;
  location.assign(next);
});
fetch(new URL('../versions.json', location.href), { cache: 'no-cache' })
  .then(response => {
    if (!response.ok) throw new Error('Version list unavailable');
    return response.json();
  })
  .then(({ latest, versions }) => {
    if (!Array.isArray(versions) || !versions.includes(currentVersion) ||
        !versions.includes(latest) || !versions.every(v => /^\d+\.\d+\.\d+$/.test(v))) {
      throw new Error('Invalid version list');
    }
    versionSelect.replaceChildren(...versions.map(version =>
      new Option(version + (version === latest ? ' · 최신' : ''), version,
        version === currentVersion, version === currentVersion)));
  })
  .catch(() => {
    document.querySelector('#version-status').textContent =
      '버전 목록을 불러오지 못했습니다. 현재 설명서는 계속 읽을 수 있습니다.';
  });
