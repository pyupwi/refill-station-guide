# Refill Station User Guide

리필 스테이션을 이용하는 고객에게 제공하는 공개 설명서 사이트다.

- 공식 주소: `https://endet.xyz/refill-user-guide/`
- Pages 원본 주소: `https://refill-station-guide.pages.dev/`
- 관리자·개발자용 정보는 포함하지 않는다.

## 로컬 확인

정적 사이트이므로 `index.html`을 직접 열거나 간단한 로컬 서버로 확인한다.

```bash
python3 -m http.server 8767
```

## 화면 이미지

실제 화면을 확보하면 아래 파일명으로 `assets/`에 추가한다.

| 파일 | 내용 |
| --- | --- |
| `01-dispense.png` | 디스펜스 기본 화면과 중앙 리필량 |
| `02-container.jpg` | 노즐 아래에 빈 용기를 놓은 실제 모습 |
| `03-adjust.png` | 위·아래 스와이프 리필량 조절 화면 |
| `04-confirm.png` | 큰 리필 시작 확인 화면 |
| `05-progress.png` | 액체가 차오르는 리필 진행 화면 |
| `06-wait.png` | 마무리 대기 화면 |
| `07-paused.png` | 일시정지와 빨간 정지 버튼 화면 |

현재 `[이미지]` 자리의 `image-placeholder` 블록을 다음 형식으로 교체한다.

```html
<img class="manual-image" src="assets/01-dispense.png" alt="중앙에 리필량이 표시된 화면">
```

## Cloudflare Pages

GitHub 저장소를 Cloudflare Pages에 연결한다.

- Framework preset: `None`
- Build command: 비워 둠
- Build output directory: `/`
- Production branch: `main`

Pages는 저장소 루트의 정적 파일을 그대로 배포한다. `main` 브랜치가 갱신되면
자동으로 다시 배포된다.

## endet.xyz 경로 연결

Cloudflare Pages 사용자 지정 도메인은 호스트 단위이므로, 별도 Pages 프로젝트를
`endet.xyz/refill-user-guide/` 경로에 직접 지정할 수 없다. `worker/`의 작은
Cloudflare Worker가 해당 경로만 Pages 원본으로 전달한다.

Pages 프로젝트를 먼저 만든 뒤 `worker/wrangler.jsonc`의 `PAGES_ORIGIN`이 실제
Pages 주소와 일치하는지 확인하고 Worker를 배포한다.

```bash
cd worker
npm install
npm run deploy
```

Worker route는 `endet.xyz/refill-user-guide*`에만 적용되므로 기존 `endet.xyz`
사이트의 나머지 경로에는 영향을 주지 않는다.

## 게시 전 확인

- 실제 기기 문구와 설명서 문구가 일치하는지 확인한다.
- 휴대폰 세로 화면에서 글자와 이미지가 잘리지 않는지 확인한다.
- `https://endet.xyz/refill-user-guide/`에서 CSS와 이미지가 정상 표시되는지 확인한다.
- QR 코드는 최종 공식 주소로 생성한다.
