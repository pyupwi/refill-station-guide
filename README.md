# 모듈형 리필스테이션 제품 소개와 설명서

- 제품 소개: https://refill.endet.xyz/
- 고객: https://refill.endet.xyz/manual/user/
- 기기 관리자: https://refill.endet.xyz/manual/admin/
- 4.0.0 고정 설명서: https://refill.endet.xyz/manual/admin/4.0.0/
- 3.5.3 고정 설명서: https://refill.endet.xyz/manual/admin/3.5.3/
- POS 관리자: https://refill.endet.xyz/pos-admin
- Pages 원본: https://refill-station-guide.pages.dev/

첫 화면은 모듈형 리필스테이션 제품 소개다. 펭귄형의 어린이 체험 공간, 스탠딩형의
제로웨이스트 매장, 말통 수납형의 행사장 활용 이미지와 주문자 요청에 맞춘 제작 안내를
제공한다. 13인치 iPad에서 한 화면으로 읽도록 구성하며 작은 모바일 화면에서는 세로로
이어진다. QR은 `https://refill.endet.xyz`로 연결하고 문의 버튼은 Google 설문으로 연결한다.
소개 화면에는 설명서·관리자·POS·로그인 메뉴 링크를 두지 않는다. 기존 서비스의 주소와
회원 접근 정책은 유지한다. 활용 이미지는 모델에 기반한 연출 이미지다.

고객 안내는 디스펜스 이용만 설명한다. 4.0.0 관리자 안내는 터치 화면과 기기 Web의
운영·보정·설정·취급, 스위치·절전·네트워크·OTA·선택 POS 연결을 설명한다.
저울 연동은 포함하지 않는다. 관리자 기본 버전은 4.0.0이며 3.5.3 독립 설명서와
이미지는 유지한다. 4.0.0 설명서는 `4.0.0-alpha.11+261006` 현재 구현을 기준으로 하며
정식 출시 또는 전체 하드웨어 검증 완료를 뜻하지 않는다. 화면은 예시 데이터의 미리보기다.

## 파일 구성

- `index.html`: 세 가지 모델의 제품 소개, 활용 이미지, QR 및 Google 설문 문의 링크
- `product.css`: 제품 소개의 반응형 스타일
- `assets/product/`: 세 모델의 활용 이미지와 `refill-qr.svg`
- `user-guide.html`: 고객 안내 (공개 주소 `/manual/user/`)
- `pos/index.html`: POS 등록·사용·테스트 안내 (승인 회원 주소 `/pos/`)
- `pos/styles.css`: POS 안내의 인쇄·목차·표 스타일
- `pos/images/`: 현재 매장·기기 안내 PNG 11장과 Toss 설정 JPEG 7장; 이전 비밀번호 UI PNG 3장은 역사 자료로만 보관
- `styles.css`: 고객 안내의 화면 중심 레이아웃과 가상 체험 스타일
- `simulator.mjs`: 기기 연결 없는 고객 조작 체험
- `demo.ko.vtt`: 시연 영상의 한국어 안내 자막
- `admin/styles.css`: 관리자 설명서 스타일
- `assets/`: 설명서에 쓰는 워드마크·연락처 로고 SVG
- `fonts/`: Vercel Geist Sans 가변 웹폰트와 SIL OFL 1.1 라이선스
- `admin/index.html`: 현재 관리자 설명서로 이동
- `admin/4.0.0/index.html`: 4.0.0 관리자 설명서의 독립 원본
- `admin/4.0.0/images/`: 현재 HMI·Web 화면 예시
- `admin/3.5.3/index.html`: 3.5.3 관리자 설명서의 독립 원본
- `admin/3.5.3/images/`: 해당 버전의 화면 예시 (고객 안내에서도 참조)
- `admin/versions.json`: 제공하는 버전 목록과 최신 버전
- `admin/versions.js`: 버전 드롭다운과 이동, 목록 오류 처리
- `worker/`: allowlist 정적 파일과 refill.endet.xyz 설명서 라우터
- `SOURCE_NOTES.md`: 작성 근거와 검증 범위
- `scripts/capture_screens.py`: 펌웨어 원본을 바꾸지 않는 화면 캡처 도구

정적 HTML·CSS, 고객 체험과 버전 선택 스크립트를 사용한다. 사이트 빌드 도구는 필요 없다.
로고는 `assets/`의 SVG를 그대로 교체하고, 글꼴은 두 CSS의 `@font-face`와 `font-family`에서 조정한다. Geist에 없는 한글은 Apple SD Gothic Neo·Noto Sans KR·시스템 글꼴로 표시한다.
관리자 공식 주소가 `refill.endet.xyz/manual/admin/` 아래에서 제공되므로 관리자용 SVG와 글꼴은 `admin/assets/`, `admin/fonts/`에도 같은 파일을 둔다.
고객 안내는 큰 체험 화면과 6개의 화면별 안내 카드로 구성한다. 직접 체험과 실제 HMI
미리보기로 만든 시연 영상을 전환할 수 있다.

## 내용 갱신과 새 버전 추가

같은 버전의 오탈자·설명 보완은 해당 HTML을 수정한다. 소프트웨어 동작이 바뀌면:

1. `admin/<새 버전>/index.html`을 만들고 해당 버전의 실제 동작으로 내용을 작성한다.
   이전 버전의 조작 설명을 새 기능으로 덮어쓰지 않는다.
   새 화면은 해당 버전의 `images/`에 보관하고 이전 버전 이미지는 유지한다.
2. `data-version`, 제목, canonical 주소, 표시 버전, 문서 갱신일을 맞춘다.
3. `admin/versions.json`의 `versions` 맨 앞에 새 버전을 추가하고 `latest`를 바꾼다.
   기존 버전은 목록과 파일을 유지한다. 모든 설명서의 드롭다운이 이 목록을 읽는다.
4. `admin/index.html`의 이동 주소와 링크를 새 버전으로 바꾼다.
5. 고객에게 보이는 사용 흐름이 바뀌면 고객 안내도 갱신한다.
6. 아래 검사를 실행하고 실제 기기 문구와 절차를 대조한 뒤 게시한다.

현재 제공하는 관리자 설명서는 **4.0.0과 3.5.3**이다. 기본 진입은 4.0.0이며 드롭다운에서 두 버전을 선택한다.

## 로컬 확인과 검사

```sh
python3 -m http.server 8767 --bind 127.0.0.1
# 제품 소개: http://127.0.0.1:8767/
# 고객 원본 파일: http://127.0.0.1:8767/user-guide.html
# 관리자: http://127.0.0.1:8767/admin/4.0.0/
node scripts/check.mjs
node scripts/check-membership-gate.mjs
node worker/scripts/prepare-assets.mjs
node worker/scripts/prepare-assets.mjs --pages
```

`check.mjs`는 제품 소개·하위 메뉴 링크 제거·Google 설문 링크·QR 링크·제품 자산,
설명서 앵커·파일 연결·제외 범위, 스크린샷 크기·대체 텍스트·확대 링크,
버전 이동과 실패 처리,
Worker의 경로와 리다이렉트를 확인한다. `node scripts/check-membership-gate.mjs`는 미로그인·미승인·승인 회수·인증 장애, 인코딩된 별칭·경로 우회, 비공개 캐시 헤더, Pages 원본 차단과 공개 미디어 목록을 확인한다. 제품 CSS·이미지·QR은 Worker와 Pages에서 인증 장애 중에도 열리며 지정하지 않은 제품 파일은 차단되는지 검사한다. 두 실제 버전 사이의 왕복 이동과 앵커 유지를 검사한다. 화면 렌더링 또는 실제 펌프의 동작·토출 정확도를 검증하는 검사는 아니다.

출시 전 브라우저에서 13인치 iPad의 가로·세로 화면과 작은 모바일 화면을 확인한다.
QR을 스캔하여 실제 도메인이 열리는지, 문의 버튼이 공개된 Google 설문을 여는지 확인한다.
새 제품 자산은 `worker/scripts/prepare-assets.mjs`, `worker/src/index.js`와 루트 `_worker.js`의
명시적 목록에 함께 추가한다. 폴더 전체를 공개하는 규칙으로 바꾸지 않는다.
고객 시뮬레이션 검사는 같은 명령에서 함께 실행하며, 양 제한·확인·일시정지·재개·정지·
완료·대기·초기화와 스와이프/키보드 조작, 영상 전환, 백그라운드 중단을 확인한다.

Apple Silicon에서는 Node 등 실행 도구가 ARM 네이티브인지 `file -L`로 확인한다.
Worker는 Node 22 이상을 사용한다.

## 화면 스크린샷 갱신

Apple Silicon Mac의 기존 펌웨어 미리보기 도구와 ARM Homebrew SDL2를 사용한다.
아래 기존 캡처 도구는 3.5.3의 숫자 버전 헤더와 시나리오를 대상으로 한다.
4.0.0-alpha 작업본의 캡처 과정과 검증 경계는 `SOURCE_NOTES.md`를 따른다.
새 버전 캡처를 기존 3.5.3 이미지 디렉터리에 저장하지 않는다.

```sh
python3 scripts/capture_screens.py /path/to/pump_dispenser
# 영상만 갱신: 원래 스크린샷 파일은 다시 만들지 않는다.
python3 scripts/capture_screens.py /path/to/pump_dispenser --video
# CMake 경로가 다르면 CMAKE_BIN=/path/to/native/cmake를 지정한다.
node scripts/check.mjs
```

임시 디렉터리에서 화면만 실행하며 하드웨어 출력은 하지 않는다. 캡처된 모든 이미지를
열어 의도한 화면·버튼·단위가 맞는지 확인한 뒤 게시한다. 측정값과 설정은 예시이므로
실제 장치 촬영이나 토출 정확도 검증 결과로 설명하지 않는다.

영상은 같은 화면을 초당 20장씩 캡처해 macOS AVFoundation으로 H.264 MP4로 만든다.
`scripts/encode_video.swift`는 완성된 영상을 다시 디코딩해 검토용 프레임도 출력한다.
영상 파일은 `admin/3.5.3/images/dispense-demo.mp4`이며, 캡처 순서를 바꾸면 자막 시간도 맞춘다.

고객 시뮬레이션은 g 표시, 100 g 간격, 100~3,000 g 범위, 시작 확인을 사용하는 조작 예시다.
토출은 연습용 6초 속도로 진행하며 실제 보정이나 펌프 성능을 계산하지 않는다.
백엔드·장치 통신·입력값 저장은 없으며, 영상은 사용자가 선택했을 때만 재생한다.

## 회원 접근과 POS 운영

제품 소개와 제품 자산, 고객 안내는 공개다. 기기 관리자 안내(`/manual/admin/*`), 직접 원본
별칭(`/admin/*`), POS 안내(`/pos/*`)는 Google 로그인 후 관리자 승인을 받은 회원만
접근한다. 고객 안내에서 사용하는 3.5.3 이미지 6장과 시연 MP4 1개만 정확한 파일 목록으로
공개한다. `/manual/user/*`로 관리자 파일에 접근해도 실제 목적지에서 같은 권한을 검사한다.
승인 확인 실패는 503으로 차단한다. 보호된 응답과 인증 이동에는 `private, no-store` 및
`Vary: Cookie`를 적용하며 매 요청에서 현재 승인 상태를 확인한다.

Google 가입·로그인과 `/membership/*`, `/auth/*`, `/api/*`, `/pos-admin*`는 별도
`refill-pos-admin` Worker가 처리한다. 미로그인·미승인 안내 요청은 `/membership`로
이동한다. 신규 일반 회원은 승인 대기이며, 회원 승인 관리자가 승인과 POS 역할·매장을
배정한다. 회원 승인만으로 POS 운영 권한은 생기지 않는다. POS 전체 관리자는 모든 매장,
매장 운영자는 배정된 한 매장만 관리한다. 별도 POS 비밀번호 로그인·계정 발급은 사용하지 않는다.
기존 운영자도 Google로 가입한 뒤 승인과 POS 역할·매장 배정을 받아야 한다.

Google OAuth 클라이언트 생성, 콜백 `https://refill.endet.xyz/auth/google/callback`,
Worker secret과 D1 migration은 POS 저장소의
[`pump_dispenser/services/pos_admin/README.md`](https://github.com/pyupwi/WS_Esp32_pump_dispenser/blob/codex/v4.0.0-pos/pump_dispenser/services/pos_admin/README.md#google-회원과-pos-운영-권한)를 따른다.
2026-10-15 Google 설정과 회원·POS Worker, 안내 Worker 및 Pages의 운영 배포를 완료했다.
비로그인 보호 문서·POS 접근 차단과 고객 안내 공개를 운영 주소에서 확인했다.
실제 Google 계정 로그인 결과는 POS 저장소 Tracker에 기록한다.

## 배포

Cloudflare Pages 프로젝트는 `refill-station-guide`, GitHub 원본은
`pyupwi/refill-station-guide`, production branch는 `main`이다. 현재 Pages는 빌드 명령 없이
출력 `/`를 게시한다. 이 설정은 루트 `_worker.js`와 함께 계속 동작하며 자동 감지되는
루트 Wrangler 설정을 추가하지 않는다. 공개 파일만 게시하려면 대시보드에서 다음 두 빌드
설정을 함께 변경한다.

- Framework: None
- Build command: `node worker/scripts/prepare-assets.mjs --pages`
- Build output directory: `.pages-public`

이 선택적 빌드는 제품 소개 자산을 포함한 명시적 공개 콘텐츠와
`_headers`, `_worker.js`만 복사한다. 관리자 문서·POS 안내·소스는 출력에 포함하지 않는다.
현재 빌드 없이 `/`를 게시하는 Pages 설정에서도 루트 `_worker.js`가 모든 요청을 검사하여
보호된 주소를 공식 도메인으로 이동시키고 README·스크립트·소스 등 허용되지 않은 파일을
404로 차단한다. Pages 원본 주소에서 회원 승인 검사를 우회해 안내를 읽을 수 없도록 한다.
빌드 명령과 출력 디렉터리를 함께 설정하기 전에는 기존 무빌드 `/` 설정을 유지한다.
`.pages-public`은 Git에 포함하지 않으며 빌드 명령 없이 출력 디렉터리만 바꾸면 배포가 실패한다.

공식 도메인의 안내 Worker는 `refill.endet.xyz/*`에 연결하며
`assets.run_worker_first: true`로 루트·직접 별칭·정적 자산을 포함한 모든 요청을 먼저
검사한다. `workers_dev: false`, `preview_urls: false`로 별도 Worker 개발·미리보기 주소는
제공하지 않는다. 더 구체적인 `/api/*`, `/auth/*`, `/membership*`, `/pos-admin*` 경로는 POS Worker가
처리한다. 안내 Worker의 `POS_MEMBERSHIP` 서비스 바인딩은 `refill-pos-admin`을 가리킨다.
`GET https://refill.endet.xyz/api/membership/session`에 현재 Cookie를 전달하고
`authenticated: true`, `member.status: approved`일 때만 보호된 파일을 제공한다.

- `/manual/user/` → `/user-guide`, 고객 자산은 명시한 공개 파일 목록으로 제한
- `/manual/admin/*` → `/admin/*`, 버전 목록·자산까지 승인 검사
- `/admin/*`, `/pos/*` → 원본 자산에 동일한 승인 검사 (고객용 공개 미디어 제외)

슬래시 없는 설명서 주소는 308로 정규화하며 관리자 기본 주소는 현재 버전으로 이동한다.
Worker와 Pages `_worker.js`는 2 MiB 이하 MP4의 단일 Range 요청을 206으로 반환한다.
더 큰 영상은 범위 응답을 지원하는 저장소를 사용한다.

```sh
node scripts/check.mjs
node scripts/check-membership-gate.mjs
cd worker
npm ci
npm run check
npm run prepare-pages
npm run dev
# Cloudflare 인증·POS Worker 설정과 배포가 준비된 뒤 실행
npm run deploy
```

`npm run prepare-assets`는 명시된 자산만 `worker/.assets/`로 복사한다.
`npm run dev`와 `npm run deploy`는 이 준비를 자동 실행한다. `_headers`·`_redirects`는
Worker assets 메타데이터이며 README·소스 노트·스크립트·패키지는 포함하지 않는다.
`main` 변경에 따른 Pages 자동 배포와 공식 도메인의 Worker 배포는 별개다. 정적 문서를
수정할 때도 Worker assets를 갱신하여 별도 배포해야 한다. POS Worker의 Google 설정·DB
migration·배포를 먼저 준비하고 안내 Worker의 서비스 바인딩을 확인한다.
2026-10-15 안내 Worker version은 `152d75fd-c3fd-43f1-87fb-460dd51a840f`,
Pages production 배포는 `feb4fe01-a61a-4617-99ff-d9a11132f7b7`이다.
승인 검사가 없던 과거 Pages 배포 21개는 삭제했으며 기존 배포 URL의 404를 확인했다.

GitHub 원본 저장소는 현재 공개이며 사이트의 회원 검사로 GitHub 파일 열람까지 막을 수는
없다. 사용자가 비공개 전환을 승인했지만 GitHub 앱과 별도 로그인 모두 설정 변경이
403으로 거절되어 저장소 소유자의 웹 설정 변경이 남아 있다. 로컬 `python3 -m http.server`도
권한 검사를 제공하지 않으므로 개발자 미리보기 용도로만 사용한다.
