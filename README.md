# 리필 스테이션 설명서

- 고객: https://endet.xyz/refill-user-guide/
- 관리자: https://endet.xyz/refill-admin-guide/
- 3.5.3 고정 설명서: https://endet.xyz/refill-admin-guide/3.5.3/
- Pages 원본: https://refill-station-guide.pages.dev/

고객 안내는 디스펜스 이용만 설명한다. 관리자 안내는 기기의 터치 화면을 기준으로
운영·캘리브레이션·설정·취급을 설명한다. 두 안내 모두 개발 중인 저울·기기 Web 기능은
포함하지 않는다. 기존 화면 이미지와 레이아웃은 사용하지 않는다.

## 파일 구성

- `index.html`: 고객 안내
- `styles.css`: 공유 스타일 진입점
- `admin/styles.css`: 두 설명서의 공유 스타일
- `admin/index.html`: 현재 관리자 설명서로 이동
- `admin/3.5.3/index.html`: 3.5.3 관리자 설명서의 독립 원본
- `admin/versions.json`: 제공하는 버전 목록과 최신 버전
- `admin/versions.js`: 버전 드롭다운과 이동, 목록 오류 처리
- `worker/`: endet.xyz의 두 설명서 경로만 Pages로 전달
- `SOURCE_NOTES.md`: 작성 근거와 검증 범위

정적 HTML·CSS와 작은 버전 선택 스크립트만 사용한다. 사이트 빌드 도구는 필요 없다.

## 내용 갱신과 새 버전 추가

같은 버전의 오탈자·설명 보완은 해당 HTML을 수정한다. 소프트웨어 동작이 바뀌면:

1. `admin/<새 버전>/index.html`을 만들고 해당 버전의 실제 동작으로 내용을 작성한다.
   이전 버전의 조작 설명을 새 기능으로 덮어쓰지 않는다.
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
# 고객: http://127.0.0.1:8767/
# 관리자: http://127.0.0.1:8767/admin/3.5.3/
node scripts/check.mjs
```

`check.mjs`는 설명서 앵커·파일 연결·제외 범위, 버전 이동과 실패 처리,
Worker의 두 경로 및 리다이렉트를 확인한다. 가상의 다음 버전은 단위 검사 안에서만
사용한다. 화면 렌더링 또는 실제 펌프의 동작·토출 정확도를 검증하는 검사는 아니다.

Apple Silicon에서는 Node 등 실행 도구가 ARM 네이티브인지 `file -L`로 확인한다.
Worker는 Node 22 이상을 사용한다.

## 배포

Cloudflare Pages 설정은 기존대로 유지한다.

- GitHub: `pyupwi/refill-station-guide`
- Production branch: `main`
- Framework: None
- Build command: 없음
- Build output directory: `/`

`main` 변경 시 Pages가 자동 배포한다. `_redirects`는 Pages 원본에서도 공식 경로 형태로
접근할 수 있게 한다. 모르는 경로는 `404.html`을 사용한다.

기존 `refill-user-guide-router` Worker는 다음 두 경로에만 연결한다.

- `endet.xyz/refill-user-guide*` → Pages `/`
- `endet.xyz/refill-admin-guide*` → Pages `/admin/`

끝의 슬래시가 없으면 308로 슬래시를 붙인다. 관리자 기본 주소는 현재 버전으로
이동하며, 저장된 버전 주소는 유지한다. Pages의 경로 정규화도 공식 주소 안에서
처리한다. 다른 endet.xyz 경로는 이 Worker의 대상이 아니다.

라우터 코드나 경로 설정을 바꾼 경우에는 Pages 자동 배포 외에 Worker 배포가 필요하다.

```sh
cd worker
npm ci
npm run check
npx wrangler deploy --dry-run
npm run deploy
```

사이트 내용만 갱신할 때는 Worker를 다시 배포할 필요가 없다. Cloudflare 로그인이
만료됐으면 기기나 네트워크를 변경하지 말고 해당 계정의 로그인만 갱신한다.
