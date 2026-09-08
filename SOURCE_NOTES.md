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
- 기존 PNG는 예전 UI여서 사용하지 않았다. 실제 3.5.3 화면이라고 꾸민 이미지도 만들지 않았다.

## 사이트 검증

`node scripts/check.mjs`로 두 본문의 내부 링크·자산, 버전 데이터, 버전 이동·실패 처리,
두 공식 경로와 슬래시/Pages 리다이렉트를 검사한다. Worker는 Wrangler의 dry-run으로
번들 확인한다. 게시 후에는 실제 HTTP 응답·본문·스타일·버전 목록·공식 경로를 대조한다.
브라우저 렌더링과 실제 펌프의 동작·토출 정확도 시험은 이번 설명서 작업의 검증이 아니다.
