# 4.0.0 관리자 설명서 작성 근거

작성일: 2026-10-06. 설명서 표시 버전은 사용자 요청에 따라 `4.0.0`이며 구현 기준은
펌웨어 `codex/v4.0.0-pos` HEAD `baf8318fedcf5d11f5d156eea44bf804b4fe2ec5`와
현재 작업본 `4.0.0-alpha.11+261006`이다. 안정 출시나 전체 release gate 완료를 뜻하지 않는다.
사이트는 clean `main` HEAD `9acd87eef159d81051e164b2323ebbf8da1936eb`에서 시작했고,
origin/main fetch 및 fast-forward 확인 결과 동일했다. 기존 3.5.3 설명서·이미지,
고객 안내·서비스 진입·POS 안내는 보존한다. 펌웨어 원본·버전·기기 설정은 변경하지 않는다.

아래 경로는 펌웨어 저장소의 `pump_dispenser/` 기준이며 줄 번호는 작성 시 작업본 기준이다.

| 설명 | 근거 |
| --- | --- |
| 현재 버전·검증 범위 | `firmware/controller/components/product_metadata/firmware_version.h:4`; `docs/governance/PROJECT_TRACKER.md:3`; `docs/quality/CONTROLLER_4_0_0_ALPHA_11_CHECKPOINT.md` |
| R 삭제와 보정 이력 삭제 | `firmware/controller/products/controller_display/components/hmi_display/screen_calibration.c:993`; 정밀 상세 즉시 삭제 `:578` |
| 보정 실측·저장·모델 선택·검증 | 같은 `screen_calibration.c`의 실제 callbacks와 `firmware/controller/components/controller_core/calibration_model.c`; 기존 상세 순서를 현재 코드로 대조 |
| 중량·시간 리필 모드와 초 단위 프리셋 | `firmware/controller/products/controller_display/components/hmi_display/settings_page_accuracy.c:152` / `:224`; `settings_page_presets.c:36` / `:41` (같은 HMI 디렉터리) |
| 종료 시 예상 잔량·누적 영구 저장 | `firmware/controller/components/controller_core/settings_manager.c:2310`; `pump_controller.c:137` |
| 스위치 GPIO·ON 신호·입력 테스트·저장 | `firmware/controller/products/controller_display/components/hmi_display/settings_page_switch.c:115` |
| 스위치 OFF 일시정지·ON 재개·종료 후 OFF 재무장 | `firmware/controller/components/controller_core/app_core_switch.c:268` |
| 화면 절전·절전 대기 | `firmware/controller/products/controller_display/components/hmi_display/settings_page_admin.c:269`; `ui_manager.c:1999` / `:2057`; 1~1440분 `firmware/controller/components/controller_core/settings_manager.c:3172` |
| 무선 통신·웹 서버·기기 접속 이름·주소/QR·지원 모델 POS | `firmware/controller/products/controller_display/components/hmi_display/settings_page_wireless.c:190` / `:202` / `:246` |
| POS 대기·수신 시 준비 화면 표시 | `firmware/controller/products/controller_display/components/hmi_display/screen_main.c:453`; `ui_manager.c:6083` (같은 HMI 디렉터리) |
| POS 설정·키 빈 입력 보존 | 같은 HMI `screen_settings.c:420` / `:436` |
| 일반·POS 공통 준비 자동 취소 | `firmware/controller/components/controller_core/app_core_prepared_refill.c:74` / `:91` / `:112`; `app_core.c:303`; 화면 remaining_ms 조회 `screen_confirm.c:74` |
| 준비 취소 범위·기본값 | `firmware/controller/components/controller_core/settings_manager.c:171` / `:3055`: 기본30초, 1~3600초 |
| Web 보정 측정·저장·모델 선택·검증·삭제 | `firmware/controller/components/hmi_web/web/admin.html:78` / `:79` / `:84` / `:87` / `:88` |
| Web 네트워크 저장과 적용 구분 | 같은 `admin.html:103` |
| 기기 Web 메뉴·운영·잔량·제품정보 | `firmware/controller/components/hmi_web/web/admin.html:14` / `:23` / `:43` / `:58` |
| Web OTA 단계·대상 검사·정상 부팅 확인 | 같은 `admin.html:154`; `admin.js:2287` / `:2332`; 관리자 인증 `firmware/controller/components/hmi_web/hmi_web_ota.c:96` |

## 4.0 화면과 검증 범위

HMI 이미지는 현행 실제 `hmi_display`와 LVGL을 ARM 네이티브 Preview로 렌더링한 800×480
예시다. 이번 fresh rebuild는 LVGL 의존성 누락으로 실패했으며, 기존 ARM 네이티브
Preview 실행 파일의 소스 SHA·mtime을 대조해 현재 소스와의 최신성을 확인하고 캡처했다.
캘리브레이션 캡처는 legacy `삭제` 라벨 assertion과 현행 `R 삭제` 차이로 exit2였지만
생성된 실제 현재 화면을 육안 확인했다. 말통 입력 legacy 시나리오는 입력·저장 후
잔량 화면을 캡처하므로 `settings-reservoir.png`의 실제 잔량 버튼 화면으로 설명했으며,
키패드 입력 화면으로 표시하지 않았다. 이 실패를 새 빌드 성공으로 기록하지 않는다.
원본 PNG를 그리거나 재구성하지 않았다. 액체·튜브 번호, 출력 GPIO와 연결 정보는
설명용 데이터이며 권장 설치값이 아니다. 초기 legacy 캡처 시나리오 실패 이미지와 제외 범위
이미지는 사용하지 않고 실제 본문에서 참조하는 현재 화면만 보관한다. 일부 HMI 사이드 메뉴에
제외 범위 항목이 보일 수 있지만 별도 사용법·이미지는 제공하지 않는다. 임의 픽셀 편집이나
펌웨어 수정으로 메뉴를 제거하지 않았다.

기기 Web 이미지 4장은 현행 `hmi_web/web` HTML·CSS·JS를 로컬 예시 API fixture와
연결하여 브라우저에서 렌더링한 화면이다. fixture의 Controller 4.0.0 표시와 제품·잔량·
POS 주소·연결 상태는 synthetic 예시다. 주소는 `example.invalid`이며 실제 연결 정보가 아니다.
OTA는 파일을 선택하기 전 화면만 촬영했고 전송·적용·완료를 실행하거나 모의하지 않았다.
최초 Web 보정 fixture의 0초·빈 시간 표시와 OTA 로그 응답 형식 오류는 각각 실제 API 필드의
5초·3초/10초 예시와 빈 로그 배열로 바로잡은 뒤 재캡처·육안 확인했다. 최종 PNG에만 반영했고
펌웨어 원본과 기기 설정은 변경하지 않았다.
실제 기기·결제·토출 결과나 OTA 실행 결과를 뜻하지 않는다. 단위는 각 화면의 실제 표시를
기준으로 설명하며, 터치 화면의 말통 입력 kg과 Web의 g/mL 입력을 구분한다.

`node scripts/check.mjs`는 세 안내 본문의 앵커·대체 텍스트·PNG 실제 치수·원본 확대 링크,
두 실제 관리자 버전의 왕복 이동·앵커 유지와 실패 처리, 공개 라우트를 검사한다.
`worker/scripts/prepare-assets.mjs`는 명시된 공개 파일만 배포 자산으로 복사한다.
3.5.3·고객·서비스 진입·POS 본문은 Git 기준 변경이 없는지 확인한다.
브라우저 렌더링·실제 HTTP·배포 확인은 별도 결과로 보고하며 하드웨어 시험으로 확대하지 않는다.

---

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
