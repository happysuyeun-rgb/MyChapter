# MyChapter — 남은 수동 설정 체크리스트

> 코드는 모두 준비되어 있고, 아래는 전부 **외부 서비스 콘솔 로그인이 필요해서 서아님이 직접 해야 하는 작업**입니다.
> 순서대로 진행하면 됩니다. 각 항목에 "왜 필요한지"와 "어디서 하는지"를 적었습니다.

---

## 1. Google AI Studio — Gemini API 키 발급 (가장 먼저, 가장 쉬움)

**왜 필요한가:** 오늘의 질문, 자유일기 힌트, 챕터 자동 생성이 전부 Gemini API로 동작합니다. 키가 없어도 앱은 안 죽지만(고정 문구로 대체), AI 기능은 꺼진 상태입니다.

1. https://aistudio.google.com 접속 → 구글 계정 로그인
2. 좌측 "Get API key" → "Create API key" 클릭
3. 발급된 키 복사 (`AIza...` 형태)
4. Supabase 대시보드 → 프로젝트 선택 → **Edge Functions → Secrets**로 이동
5. `GOOGLE_AI_API_KEY` = 방금 복사한 값으로 등록

---

## 2. Firebase — 푸시 알림용 프로젝트 생성

**왜 필요한가:** 매일 알림(`send-daily-reminder`)이 실제 기기에 푸시를 보내려면 Firebase Cloud Messaging이 필요합니다.

1. https://console.firebase.google.com 접속 → 구글 계정 로그인
2. "프로젝트 추가" → 프로젝트 이름 입력 (예: MyChapter)
3. 프로젝트 생성 후 "Android 앱 추가" 선택
4. 패키지 이름에 정확히 `com.mychapter.app` 입력 (다르면 인식 안 됨)
5. `google-services.json` 다운로드
6. 다운로드한 파일을 `android/app/` 폴더에 넣기 (Cursor에서 드래그 앤 드롭 또는 파일 복사)
7. Firebase 콘솔 → 프로젝트 설정(⚙️) → **서비스 계정** 탭 → "새 비공개 키 생성" → JSON 다운로드
8. Supabase 대시보드 → Edge Functions → Secrets에 아래 2개 등록
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = 방금 받은 JSON 파일 내용 전체 (문자열로 붙여넣기)
   - `FIREBASE_PROJECT_ID` = Firebase 프로젝트 설정에 표시된 프로젝트 ID

---

## 3. Supabase — 알림 발송 스케줄(Cron) 등록

**왜 필요한가:** `send-daily-reminder` 함수는 만들어져 있지만, 누가 주기적으로 호출해주지 않으면 실행되지 않습니다.

1. Supabase 대시보드 → Edge Functions → Secrets에 `CRON_SECRET` = 임의의 긴 문자열 등록 (예: 랜덤 32자)
2. Supabase 대시보드 → **Integrations → Cron** 이동
3. 새 Cron Job 생성
   - 스케줄: `* * * * *` (매분 — 함수 내부에서 사용자별 알림 시간과 비교해 실제 발송 여부를 판단합니다)
   - 호출 URL: `https://<프로젝트-ref>.supabase.co/functions/v1/send-daily-reminder`
   - Header: `Authorization: Bearer <1번에서 만든 CRON_SECRET 값>`

> 참고: `supabase/migrations/005_cron_daily_reminder.sql`에 동일한 안내 주석이 있습니다.

---

## 4. Google Play Console — 개발자 등록 및 결제 연동 (출시 직전 단계)

**왜 필요한가:** 앱을 실제로 배포하고, 인앱결제(Pro 구독)를 검증하려면 필요합니다. 결제(등록비 $25)가 발생해서 제가 대신 진행할 수 없는 단계입니다.

1. https://play.google.com/console 접속 → 개발자 등록 (1회성 $25 결제)
2. 새 앱 생성 → 패키지명 `com.mychapter.app`
3. `docs/06-play-store-listing-draft.md`에 준비해둔 문구를 스토어 등록 정보에 붙여넣기
4. 스크린샷 2~8장, 피처 그래픽(1024×500) 준비 — 실기기/에뮬레이터로 캡처 필요 (원하시면 개발 서버 화면 캡처를 도와드릴 수 있어요)
5. 인앱상품 → 구독 상품 생성, 상품 ID를 `mychapter_pro_monthly`로 설정 (코드의 `PRODUCT_ID`와 정확히 일치해야 함)
6. Play Console → 설정 → API 액세스에서 **서비스 계정** 생성 후 JSON 키 다운로드
7. Supabase 대시보드 → Edge Functions → Secrets에 등록
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` = 방금 받은 JSON 내용
   - `GOOGLE_PLAY_PACKAGE_NAME` = `com.mychapter.app` (생략 시 코드 기본값과 동일)
8. 내부 테스트 트랙에 업로드 → 테스터 등록 → 실제 결제 흐름 테스트

> 참고: 지금은 `.env.local`에 `VITE_BILLING_DEV_MODE=true`로 되어 있어서, 실제 Play Billing 없이도 개발 모드로 구독 흐름을 테스트할 수 있습니다. 위 단계는 "진짜 결제"를 붙일 때만 필요합니다.

---

## 진행 순서 추천

1. **Google AI Studio 키** (5분, 무료) — AI 기능 바로 살아남
2. **Firebase 설정** (15분, 무료) — 푸시 알림 살아남
3. **Supabase Cron 등록** (5분, 무료) — 매일 알림 자동 발송 시작
4. **Play Console 등록** (출시 준비될 때, $25) — 가장 마지막에

1~3번은 무료이고 지금 바로 해도 되는 작업입니다. 4번은 앱을 실제로 스토어에 올릴 준비가 됐을 때 진행하시면 됩니다.

각 단계에서 화면 보면서 같이 진행하고 싶으시면, 브라우저 화면 공유해주시면 옆에서 같이 봐드릴 수 있어요 (로그인이나 결제 자체는 서아님이 직접 하셔야 합니다).
