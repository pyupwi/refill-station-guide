# 리필 스테이션 설명서

- 서비스 진입: https://refill.endet.xyz/
- 고객: https://refill.endet.xyz/manual/user/
- 기기 관리자: https://refill.endet.xyz/manual/admin/
- 3.5.3 고정 설명서: https://refill.endet.xyz/manual/admin/3.5.3/
- POS 관리자: https://refill.endet.xyz/pos-admin
- Pages 원본: https://refill-station-guide.pages.dev/

고객 안내는 디스펜스 이용만 설명한다. 관리자 안내는 기기의 터치 화면을 기준으로
운영·캘리브레이션·설정·취급을 설명한다. 두 안내 모두 개발 중인 저울·기기 Web 기능은
포함하지 않는다. 기존 화면 이미지와 레이아웃은 사용하지 않는다.
3.5.3 화면 코드의 미리보기에서 새로 캡처한 스크린샷을 양쪽 설명서에 제공한다.

## 파일 구성

- `index.html`: 제품 이름과 고객·기기 관리자·POS 안내·POS 관리자 링크
- `user-guide.html`: 고객 안내 (공개 주소 `/manual/user/`)
- `pos/index.html`: POS 등록·사용·테스트 안내 (공개 주소 `/pos/`)
- `pos/styles.css`: POS 안내의 인쇄·목차·표 스타일
- `pos/images/`: 계정·매장·기기 안내 PNG 14장과 Toss 설정 JPEG 7장
- `styles.css`: 고객 안내의 화면 중심 레이아웃과 가상 체험 스타일
- `simulator.mjs`: 기기 연결 없는 고객 조작 체험
- `demo.ko.vtt`: 시연 영상의 한국어 안내 자막
- `admin/styles.css`: 관리자 설명서 스타일
- `assets/`: 설명서에 쓰는 워드마크·연락처 로고 SVG
- `fonts/`: Vercel Geist Sans 가변 웹폰트와 SIL OFL 1.1 라이선스
- `admin/index.html`: 현재 관리자 설명서로 이동
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

현재 제공하는 관리자 설명서는 **3.5.3 한 개**다. 존재하지 않는 구버전은 선택지로 만들지 않는다.

## 로컬 확인과 검사

```sh
python3 -m http.server 8767 --bind 127.0.0.1
# 서비스 진입: http://127.0.0.1:8767/
# 고객 원본 파일: http://127.0.0.1:8767/user-guide.html
# 관리자: http://127.0.0.1:8767/admin/3.5.3/
node scripts/check.mjs
```

`check.mjs`는 설명서 앵커·파일 연결·제외 범위, 스크린샷 크기·대체 텍스트·확대 링크,
버전 이동과 실패 처리,
Worker의 두 경로 및 리다이렉트를 확인한다. 가상의 다음 버전은 단위 검사 안에서만
사용한다. 화면 렌더링 또는 실제 펌프의 동작·토출 정확도를 검증하는 검사는 아니다.
고객 시뮬레이션 검사는 같은 명령에서 함께 실행하며, 양 제한·확인·일시정지·재개·정지·
완료·대기·초기화와 스와이프/키보드 조작, 영상 전환, 백그라운드 중단을 확인한다.

Apple Silicon에서는 Node 등 실행 도구가 ARM 네이티브인지 `file -L`로 확인한다.
Worker는 Node 22 이상을 사용한다.

## 화면 스크린샷 갱신

Apple Silicon Mac의 기존 펌웨어 미리보기 도구와 ARM Homebrew SDL2를 사용한다.
현재 펌웨어 버전에 해당하는 관리자 설명서 디렉터리가 먼저 있어야 한다.

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

## 배포

Cloudflare Pages 설정과 GitHub 원본은 그대로 유지한다.

- GitHub: `pyupwi/refill-station-guide`
- Production branch: `main`
- Framework: None
- Build command: 없음
- Build output directory: `/`

`main` 변경 시 Pages 원본이 자동 배포된다. `_redirects`와 `_headers`는 Pages 원본과
Worker assets 양쪽에서 같은 정적 경로 규칙과 헤더를 제공한다. 모르는 경로는 `404.html`을 사용한다.

Worker는 `refill.endet.xyz/*` 한 경로로 연결된다. `/manual/*`만 Worker가 먼저 처리한다.
루트·정적 자산은 네이티브 assets가 제공하고, `/api/*`와 `/pos-admin*`은 더 구체적인 POS Worker
경로가 처리한다. 이 안내 Worker는 다음 문서 경로를 로컬 `ASSETS` 바인딩으로 전달한다.

- `/manual/user*` → `/user-guide` 및 루트 상대 자산
- `/manual/admin*` → `/admin/` 및 관리자 자산
- `/pos/*` → POS 안내 native assets

고객 기본 문서는 assets clean URL `/user-guide`다. 슬래시가 없는 설명서 주소는 308로
정규화하며, 관리자 기본 주소는 현재 버전으로 이동한다. Range 응답과 canonical 경로의 공개
주소 변환은 Worker에서 처리한다.

`npm run prepare-assets`는 명시된 공개 파일 67개만 `worker/.assets/`에 복사한다.
이 중 65개는 콘텐츠 파일이고 `_headers`·`_redirects` 두 개는 assets 런타임 메타데이터다.
README, 소스 노트, 스크립트와 패키지 파일은 배포 디렉터리에 포함되지 않는다.
`npm run dev`와 `npm run deploy`는 준비 단계를 자동으로 실행한다.

라우터 코드나 경로 설정을 바꾼 경우에는 Pages 자동 배포 외에 Worker 배포가 필요하다.

```sh
cd worker
npm ci
npm run check
npm run dev
npm run deploy
```

`main` 변경 시 Pages 원본은 자동 배포되지만, 사용자 도메인의 Worker와 그 assets는
`npm run deploy`로 별도 배포한다. 정적 파일을 바꿀 때도 allowlist assets가 Worker에 포함되도록
이 명령으로 배포한다. Cloudflare 로그인이나 배포는 이 로컬 확인 작업에서 수행하지 않는다.

공식 주소의 Worker는 2 MiB 이하 MP4의 단일 Range 요청을 206으로 반환한다. 2 MiB를 넘는
영상은 범위 응답을 지원하는 저장소를 사용한다.
