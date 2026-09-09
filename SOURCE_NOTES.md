# 3.5.3 설명서 작성 근거

작성일: 2026-09-09. 펌웨어 기준은 `WS_Esp32_pump_dispenser_v3`의
`v3-stage5.3` 작업본, `FIRMWARE_VERSION "3.5.3"`이다. 기준 HEAD는
`129de0e9015f438d815c4dce59a26bfa3d99dde8`이며 3.5.3 변경은 미커밋 상태였다.
기존 `v3.5.2-stable`을 3.5.3 릴리스로 해석하지 않았다. 이번 작업은 설명서 사이트만
변경하며 펌웨어·기기·설정·개발 Tracker의 완료 상태를 변경하지 않는다.

아래 경로는 펌웨어 저장소의 `pump_dispenser/` 기준이다. 표시 문구뿐 아니라
연결된 공통 명령·Core 동작도 함께 대조했다. 줄 번호는 작성 시 작업본 기준이다.

| 설명 | 근거 |
| --- | --- |
| 버전과 3.5.3 검증 경계 | `firmware/controller/components/product_metadata/firmware_version.h:4`; `docs/governance/PROJECT_TRACKER.md:24`; `docs/product/v3_ROADMAP.md:434` |
| 고객 스와이프·탭 시작 | `firmware/controller/products/controller_display/components/hmi_display/screen_dispense.c:134` / `:164` |
| 일시정지·리필재개·정지 | `firmware/controller/products/controller_display/components/hmi_display/screen_progress.c:43` / `:325` |
| 오른쪽 위 진입·3초 내 5번 | `firmware/controller/products/controller_display/components/hmi_display/ui_access_gesture.c:18`; `unlock_controller.c:5` / `:33` (같은 디렉터리) |
| 홈 수동 출력·회수·정지 | `firmware/controller/products/controller_display/components/hmi_display/ui_manager.c:1974` / `:1996` / `:2010` / `:2027`; `screen_main.c:156` / `:355` (같은 디렉터리) |
| 보정 화면 조작·수치·입력·메모 저장 | `firmware/controller/products/controller_display/components/hmi_display/screen_calibration.c:315` / `:525` / `:612` / `:735` / `:1153` |
| 정밀 회차 정지, 저장, 모델 선택, 검증 | `firmware/controller/components/controller_core/calibration_model.c:122` / `:166` / `:207` |
| 중앙값·R·정밀 수식·검증 오차 | `firmware/controller/components/controller_domain/time_calibration.c:7` / `:26` / `:41` / `:94` |
| 프로파일 삭제 후 선택 처리 | `firmware/controller/components/controller_core/settings_manager.c:1796` |
| 단일 기록 삭제와 정밀 상세 즉시 삭제 차이 | `firmware/controller/products/controller_display/components/hmi_display/screen_calibration.c:573` / `:986`; `firmware/controller/components/controller_core/app_core.c:668` |
| 프리스탑·미세 조정의 실제 계산 | `firmware/controller/components/controller_domain/refill_policy.c:35`; `firmware/controller/components/controller_core/pump_controller.c:2064` / `:2079` / `:762` |
| 말통 교체·잔량 보정의 kg 입력 | `firmware/controller/products/controller_display/components/hmi_display/ui_manager.c:3667` / `:3677` |
| 잔량 차감의 비영구 저장·누적 저장 구분 | `firmware/controller/components/controller_core/settings_manager.c:2184` / `:2206` / `:2216` |
| 누적 초기화 확인창 | `firmware/controller/products/controller_display/components/hmi_display/ui_manager.c:4680` / `:4692` |
| 출력 신호·테스트·저장·연결 항목 | `firmware/controller/products/controller_display/components/hmi_display/settings_page_pump.c:348` / `:399` / `:474`; `docs/architecture/v3_STAGE4_OUTPUT_SIGNAL_AND_RECOVERY_EXECUTION_PLAN.md` |
| 고객 화면·프리셋 4개와 디스펜스 기본량 | `firmware/controller/products/controller_display/components/hmi_display/settings_page_dispense.c:236`; `settings_page_presets.c:46` (같은 디렉터리) |
| 잠금·메뉴 숨김·공장 초기화 | `firmware/controller/products/controller_display/components/hmi_display/settings_page_admin.c:233`; `unlock_controller.c:62` (같은 디렉터리); `ui_manager.c:4728` (같은 디렉터리) |
| Wi-Fi 끄기/켜기 UI 범위 | `firmware/controller/products/controller_display/components/hmi_display/settings_page_wireless.c:158`; `docs/governance/PROJECT_TRACKER.md:24` |

## 범위와 주의해서 해석할 내용

- 고객 안내: 디스펜스 사용만 포함. 시간 모드 설정, 관리자 기능, 개발 중인 저울·Web 설명 제외.
- 관리자 안내: 터치 화면의 현재 조작 기준. 저울·Web, 자동 보충·미래 제어, OTA,
  설정 가져오기/내보내기, 예정된 팝업 개편은 포함하지 않음.
- 3.5.3 신규 기능은 소프트웨어 구현 체크포인트다. 기존 Tracker에 기록된
  실제 무선 송출 중단·리시버 유지·새 버전 장치 검증의 미완료 상태를 승격하지 않았다.
- 원본 코드에서 잔량 차감은 RAM 반영임을 확인했다. 재부팅 후 모든 잔량이 정확히
  유지된다고 설명하지 않고 운영자가 실제 잔량을 대조하도록 안내했다.
- 정밀 보정 검증은 선택 모델 자체를 비교한다. 최종 고객 리필의 미세 조정·프리스탑과
  같은 의미로 서술하지 않았다.
- 취급 안내는 일반 운영상 주의사항이다. 기기 방수등급, 허용 전압·전류, 특정 세척제·
  온도·농도, 접액 적합성, 정확도 성능을 임의로 보증하거나 제조사 사양으로 제시하지 않는다.
  제품·접액 부품 공급자 지침에 따라 현장 기준을 정하도록 안내했다.
- 기존 PNG는 예전 UI여서 사용하지 않았다. 새 스크린샷 23장은 아래 방식으로 생성했다.

## 스크린샷 출처와 재생성

`scripts/capture_screens.py`가 현재 작업본의 `tools/ui_preview`를 임시 디렉터리에 복사하고,
같은 작업본의 실제 `hmi_display` 및 LVGL 소스를 ARM 네이티브로 컴파일한다.
기존 캡처 시나리오로 화면을 진행한 뒤 800×480 BMP를 저장하고 macOS `sips`로 PNG로 변환한다.
기존 펌웨어·미리보기 원본 파일, 기기와 기기 설정은 변경하지 않는다.

- 고객용 6장: 양 선택, 시작 확인, 진행, 일시정지, 완료, 다음 리필 대기.
- 관리자용 17장: 홈, 보정 진입·간편·수동·정밀·선택·검증, 잔량·말통 교체,
  고객 화면 설정, 펌프 출력·회수, 시스템.
- 임시 미리보기 데이터에 g 단위와 지원되는 메뉴 숨김 설정을 적용했다.
  메뉴 숨김으로 개발 중인 저울과 Web 항목이 있는 무선 통신 페이지를 스크린샷에서 제외했다.
  표시 버전은 작업본의 `firmware_version.h`에서 읽는다.
- 정밀 보정은 기존 시나리오의 저장된 6회 예시 외에 빈 프로파일 화면도 캡처했다.
  말통 교체는 기존 검증 시나리오의 입력 완료 후 화면 대신 저장 전 입력 화면에서 캡처했다.
- 숫자·색상·누적값·회수 상태 등은 미리보기의 예시 데이터다. 실제 기기 측정 결과나
  권장 설치값으로 제시하지 않는다. 공개 본문에도 미리보기 캡처임을 표시했다.
- 화면의 글자·버튼·배치는 실제 HMI가 렌더링하며, PNG의 내용을 그리거나 수정하지 않았다.
  선택한 23장을 직접 열어 화면 단계, 표시 단위와 버튼 문구를 확인했다.

## 사이트 검증

고객 안내는 스크린샷과 본문이 한 쌍인 6개 카드로 재구성했다. 상단에는 가상 체험과
시연 영상을 전환하는 화면을 두고, 관리자 설명서 본문과 레이아웃은 유지했다.

- 영상: 실제 3.5.3 HMI 미리보기를 800×480, 20 fps, 총 331 프레임(16.55초)으로 기록했다.
  시작 확인 → 진행 → 일시정지 → 재개 → 완료 → 대기 → 처음 화면까지 캡처했다.
  원본 펌웨어 파일은 수정하지 않았고 출력 장치와 연결하지 않았다.
- H.264 영상의 크기·길이와 디코딩을 확인했고, 정확한 시각의 프레임을 열어 방향,
  문구와 단계 전환을 확인했다. 한국어 안내 자막과 네이티브 재생·일시정지 기능을 제공한다.
- 가상 체험은 별도 HTML 화면으로 같은 조작 순서를 재현한다. 양 조절 범위와 간격은
  예시 설정이며, 6초 토출 속도는 교육용 시간이다. 실제 기기의 보정 결과나 성능을
  예측하지 않는다. 이 구분은 공개 화면에도 표시했다.
- 가상 화면은 탭·스와이프·키보드를 지원한다. 일시정지 중에는 토출량이 늘지 않고,
  정지하면 부분 배출량으로 취소된다. 영상으로 전환하거나 초기화하면 체험을 재설정한다.
  페이지가 보이지 않을 때는 체험 시간이 진행되지 않는다. 모션 줄이기 환경에서는
  장식 물결 애니메이션을 멈춘다. 영상은 사용자가 영상 보기를 선택한 뒤 재생한다.

`node scripts/check.mjs`로 두 본문의 내부 링크·자산, PNG 크기·대체 텍스트·확대 링크,
버전 데이터, 버전 이동·실패 처리,
두 공식 경로와 슬래시/Pages 리다이렉트를 검사한다. Worker는 Wrangler의 dry-run으로
번들 확인한다. 게시 후에는 실제 HTTP 응답·본문·스타일·버전 목록·공식 경로를 대조한다.
`scripts/check-simulator.mjs`는 조작 상태와 실제 이벤트 연결을 브라우저 없는 간단한
DOM 대역으로 검사하며, 주 검사 명령에 포함된다.
웹사이트의 브라우저 렌더링과 실제 펌프의 동작·토출 정확도 시험은 이번 설명서 작업의 검증이 아니다.

게시 확인 중 Pages 원본과 공식 주소 모두 영상의 Range 요청에 전체 200 응답을 반환했다.
[Cloudflare Pages 공식 문서](https://developers.cloudflare.com/pages/configuration/serving-pages/#behavior)에도
현재 같은 동작이 명시되어 있다. 공식 주소의 기존 Worker에 2 MiB 이하 MP4의 단일 바이트
범위 응답을 추가해 재생 위치 이동을 지원한다. 범위·접미 범위·초과 범위·If-Range를 검사하며,
더 큰 영상은 기본 저장소의 범위 응답을 사용하도록 옮겨야 한다.
