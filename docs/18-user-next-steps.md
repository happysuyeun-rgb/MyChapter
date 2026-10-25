# MyChapter — 본인이 지금 할 일 (상세 가이드)

> **최종 갱신:** 2026-10-25  
> **대상:** 서비스 담당자 (비개발자 포함)  
> **전제:** 마이그레이션 001~006 ✅ · Edge 8개 ✅ · **로그인 7/7 LIVE** · **책·기록 17항목 LIVE** (`22-e2e-status.md`)  
> **관련:** `06-user-tasks.md`, `15-launch-roadmap.md`, `22-e2e-status.md`, `26-ai-pdf-release-execution-runbook.md`

---

## 이 문서의 목표

**로그인·책·기록 핵심 여정은 완료**됐습니다. 지금은 **보안 Secret 정리 → AI/PDF 스테이징**이 다음입니다.

```
① (완료) 운영 Magic Link 로그인
② (완료) 첫 책 → 자유/질문/사진 → 새로고침·PAGE 정합 (17 PASS)
③ (지금) 운영 BILLING_DEV_BYPASS OFF + GOOGLE_AI_API_KEY / SERVICE_ROLE_KEY
④ (다음) 스테이징 025 · AI 챕터 · PDF E2E → (이후) OAuth · SMTP
```

**이미 끝난 운영 검증 (2026-10-24, https://my-chapter.vercel.app)**

| 항목 | 결과 |
|------|------|
| Production 배포 · anon 키 · Magic Link · 로그인 · 마이페이지 · 세션 · 로그아웃/가드 | **7/7 PASS — LIVE** |
| 책 생성 · 3모드 기록 · PAGE·초안·정합 (§4) | **17 PASS — LIVE** (`22-e2e-status.md`) |

**아직 미완료로 유지 (본인·운영)**

| 항목 | 상태 |
|------|------|
| 운영 `BILLING_DEV_BYPASS` OFF | **최우선** — Work 보고 당시 활성 |
| `GOOGLE_AI_API_KEY` · `SERVICE_ROLE_KEY` 유효 등록 | 미확인/미등록 보고 |
| DB 025 운영 적용 | 코드만 main · **운영 미적용** |
| AI 챕터 · PDF E2E | 미실시 (준비도 20/30·스테이징 필요) |
| Google · Kakao OAuth | 미완료 설정 |
| 일반 사용자 대상 SMTP | 미완료 |

**AI가 이미 코드로 처리한 것** (본인 작업 불필요)

| 항목 | 문서 |
|------|------|
| Edge Function 에러 `code` 파싱, ErrorState 확대, Settings 저장 피드백 | `20-error-cases.md` |
| 로그아웃 시 FCM 토큰 삭제, 구독 조회 실패 시 Free 오탐 방지 | `21-screen-completeness.md` |
| 저장 충돌 시 명시적 UX · vitest 18건 · `7ab565a` | `22-e2e-status.md` |

**지금 하지 않아도 되는 것**

| 항목 | 이유 |
|------|------|
| Edge Function 8개 재배포 | 이미 원격에서 응답 확인됨 (`17-test-report.md`) |
| 마이그레이션 SQL 재실행 | 001~006 적용 완료 |
| 이메일 로그인 Provider 재설정 | 운영 E2E PASS |
| Firebase / Play Console / Billing 네이티브 | 베타·출시 단계 (**본인+네이티브 작업**, 나중에) |

---

## 준비물 체크리스트

시작 전에 아래가 있으면 됩니다.

- [ ] Supabase 계정 + MyChapter 프로젝트 로그인 가능
- [ ] PC에 이 프로젝트 폴더 (`MyChapter`)
- [ ] 터미널(PowerShell)에서 `npm run dev` 실행 가능
- [ ] (AI 테스트용) Google 계정 — [Google AI Studio](https://aistudio.google.com/apikey) 키 발급용
- [ ] 본인 이메일 주소 하나 (Magic Link 받을용)

프로젝트 ref (이미 `.env.local`에 있음):

```
rdrafwfdwfzgcfiqkgug
URL: https://rdrafwfdwfzgcfiqkgug.supabase.co
```

---

## STEP 1 — Edge Function Secrets 등록

AI 질문·챕터·PDF·계정삭제 Function이 **키를 읽도록** Secrets를 넣습니다.  
함수는 이미 배포됐어도, Secrets가 없으면 AI가 실패할 수 있습니다.

### 1-1. service_role 키 복사

1. 브라우저에서 [https://app.supabase.com](https://app.supabase.com) 접속 후 MyChapter 프로젝트 선택
2. 왼쪽 하단 **Project Settings** (톱니바퀴 아이콘) 클릭
3. **API** 메뉴 선택
4. **Project API keys** 영역에서:
   - `anon` `public` → 이미 `.env.local`의 `VITE_SUPABASE_ANON_KEY`와 같음 (프론트용)
   - **`service_role` `secret`** → **Reveal** 후 **복사**
5. 메모장에 임시 붙여넣기 (이 키는 **절대** Git·프론트·채팅에 올리지 마세요)

> `service_role`은 DB를 전부 우회할 수 있는 관리자 키입니다. 유출되면 즉시 Rotate 하세요.

### 1-2. Google AI API 키 발급

1. [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) 접속 (Google 계정 로그인)
2. **Create API key** 클릭
3. 키 생성 후 복사 (`AIza...` 형태)

### 1-3. Secrets 화면에 등록

1. Supabase Dashboard → 왼쪽 **Project Settings** (톱니)
2. **Edge Functions** 클릭  
   *(메뉴 이름이 Secrets만 보이면 그 화면으로)*
3. **Secrets** 탭 / **Manage secrets** / **Add new secret**
4. AI·계정삭제 등에 **필수**로 아래 **2개**를 추가:

| Name (이름, 정확히) | Value (값) | 비고 |
|---------------------|------------|------|
| `GOOGLE_AI_API_KEY` | 1-2에서 복사한 키 | Gemini AI용 |
| `SERVICE_ROLE_KEY` | 1-1의 **service_role** 키 | `anon` 키 넣으면 안 됨 |

5. 저장 후 목록에 두 이름이 보이는지 확인

**결제 우회 Secret (`BILLING_DEV_BYPASS`) — 운영에서 켜지 마세요**

| 환경 | 지시 |
|------|------|
| **Production (운영)** | `BILLING_DEV_BYPASS`를 **`true`로 두지 않음** (없애거나 `false`). Vercel `VITE_BILLING_DEV_MODE`도 **`false`** |
| 로컬·격리 테스트만 | 필요 시에만 `BILLING_DEV_BYPASS=true` + 앱 `VITE_BILLING_DEV_MODE=true` — **운영과 같은 프로젝트에 켜면 무료 Pro 승격 위험** |

운영 Secret/환경변수는 Cursor·Work가 **승인 없이 변경하지 않습니다**.

**CLI로 넣는 방법 (선택, AI Secrets만)**

PowerShell:

```powershell
cd c:\Users\happy\Projects\lab\Cursor\MyChapter
npx supabase login
npx supabase link --project-ref rdrafwfdwfzgcfiqkgug
npx supabase secrets set GOOGLE_AI_API_KEY=여기에_AIza키
npx supabase secrets set SERVICE_ROLE_KEY=여기에_service_role키
# BILLING_DEV_BYPASS=true 는 운영 프로젝트에 설정하지 마세요
```

### 1-4. (선택) Function 목록 눈으로 확인

1. Dashboard 왼쪽 **Edge Functions**
2. 아래 이름이 보이면 OK:

- `generate-question`
- `generate-freewriting-hint`
- `generate-chapter`
- `regenerate-chapter`
- `verify-subscription`
- `delete-account`
- `send-daily-reminder`
- `generate-pdf`

없으면 Cursor에 “Function 목록이 안 보여”라고 알려주세요. (재배포가 필요할 수 있음)

**STEP 1 완료 표시:** ☐ `GOOGLE_AI_API_KEY` + `SERVICE_ROLE_KEY` 등록 · ☐ 운영 `BILLING_DEV_BYPASS`≠true 확인

---

## STEP 2 — 로그인(이메일) + Redirect URL

실연동 테스트는 **이메일 Magic Link**부터 하는 것이 가장 쉽습니다.  
카카오/구글은 앱 키 발급이 더 길어서, 이메일 통과 후 해도 됩니다.

### 2-1. Email Provider 켜기

1. Dashboard → **Authentication** → **Providers**
2. **Email** 찾기 → Enable
3. 권장 설정:
   - **Confirm email**: 켜도/꺼도 됨 (켜면 첫 로그인에 확인 메일)
   - Magic Link / OTP 사용 (비밀번호 없음 — 앱 설계와 동일)

### 2-2. URL Configuration (필수)

1. **Authentication** → **URL Configuration**
2. **Site URL** (개발 중):

```
http://localhost:5173
```

3. **Redirect URLs**에 **아래를 모두 추가** (한 줄씩 Add):

```
http://localhost:5173/**
http://localhost:5173/home
https://mychapter.app/**
https://mychapter.app/home
com.mychapter.app://**
com.mychapter.app://home
```

4. **Save**

> Redirect에 `localhost`가 없으면 Magic Link를 눌러도 앱으로 안 돌아옵니다.

### 2-3. (선택) 메일 발송 테스트

Authentication → Users → **Add user** / 또는 앱에서 이메일 로그인 시  
받은편지함(스팸함 포함)에 Supabase 메일이 오면 OK.

**STEP 2 완료 표시:** ☑ Email ON + 운영 Redirect URL — **운영 Magic Link E2E PASS (2026-10-24)**  
※ 로컬(`localhost:5173`) Redirect는 로컬 테스트 시에만 추가하면 됩니다.

---

## STEP 3 — 로컬에서 mock 끄기

### 3-1. `.env.local` 수정

1. Cursor 또는 메모장으로 프로젝트 루트의 `.env.local` 열기  
   경로 예: `c:\Users\happy\Projects\lab\Cursor\MyChapter\.env.local`
2. 아래 줄을 찾아 **값을 `false`로** 바꿉니다.

**변경 전**

```env
VITE_DEV_BYPASS=true
```

**변경 후**

```env
VITE_DEV_BYPASS=false
```

3. 파일 저장
4. **다른 변수는 건드리지 마세요** (`VITE_SUPABASE_URL`, `ANON_KEY` 등)

### 3-2. 개발 서버 재시작 (중요)

`.env`는 **서버를 다시 켜야** 반영됩니다.

1. 터미널에서 기존 `npm run dev`가 돌고 있으면 **Ctrl+C**로 종료
2. 다시 실행:

```powershell
cd c:\Users\happy\Projects\lab\Cursor\MyChapter
npm run dev
```

3. 브라우저에서 `http://localhost:5173` 접속  
4. 이제는 **서아 mock으로 바로 홈 가지 않고**, 로그인 화면이 나와야 정상입니다.

**STEP 3 완료 표시:** ☐ bypass false + 서버 재시작 + 로그인 화면 확인

---

## STEP 4 — 책·기록 E2E — **완료 (2026-10-24)**

운영: https://my-chapter.vercel.app  
상세: **`22-e2e-status.md` §4** — Work 운영 17 PASS / AI·PDF·장애복구 3항목 미검증

### 4-6. 통과 체크리스트 (Work)

- [x] 이메일 로그인 성공 (운영, 2026-10-24)
- [x] 책 1개 생성
- [x] 자유 / 질문 / 사진 각 저장 + 초안·PAGE 정합
- [x] 새로고침 후 데이터 유지 · ID·PAGE 연속
- [ ] (다음) AI 챕터 · PDF — 준비도 20기록/30일 또는 **스테이징**; 운영 DB 조작·결제 우회로 통과 처리 금지

**재실행이 필요할 때**만 아래를 따릅니다: 로그인 → 온보딩(해당 시) → 책 생성 → 3모드 저장 → 새로고침·PAGE 확인.  
실패 시 화면 문구·Network/콘솔을 Cursor에 공유 (Production Secret·DB는 승인 없이 변경하지 말 것).

---

## STEP 4b — 지금 할 일: Secret · 결제 우회 · AI/PDF 준비

상세 순서: **`26-ai-pdf-release-execution-runbook.md`**

1. Dashboard Secrets에서 **`BILLING_DEV_BYPASS`를 true로 두지 않음** (삭제 또는 false)  
2. **`GOOGLE_AI_API_KEY`**, **`SERVICE_ROLE_KEY`** 등록 (키 원문 채팅·Git 금지)  
3. Vercel Production **`VITE_BILLING_DEV_MODE=false`** 확인  
4. 격리 스테이징에서 025 적용·검증 후, 운영 025는 **백업·승인 뒤에만**  
5. 스테이징에서 AI 챕터 → PDF E2E

**STEP 4b 완료 표시:** ☐ bypass OFF · ☐ AI Secrets · ☐ (스테이징) AI/PDF 1회 성공

---

## STEP 5 — (선택) 카카오 / Google 로그인

이메일 E2E가 통과한 뒤에만 진행하세요.

### Google (요약)

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth 클라이언트 ID 생성
2. 승인된 리디렉션 URI에 Supabase가 안내하는 Callback URL 등록  
   (보통 `https://rdrafwfdwfzgcfiqkgug.supabase.co/auth/v1/callback`)
3. Supabase Authentication → Providers → **Google** → Client ID / Secret 입력 → Enable

### Kakao (요약)

1. [Kakao Developers](https://developers.kakao.com) 앱 생성
2. Redirect URI에 Supabase Callback URL 등록
3. Supabase Providers에서 Kakao 연동 (프로젝트 설정에 따라 Custom OAuth)

상세는 `06-user-tasks.md` §2.4 / §8 참고.

**STEP 5 완료 표시:** ☐ (선택) Google 또는 Kakao 로그인 성공

---

## STEP 6 — (나중에) 커스텀 도메인 / 푸시 / 스토어

Vercel Production·핵심 기록 E2E는 완료. **아래는 베타·출시 단계**입니다.

| 순서 | 할 일 | 문서 |
|------|--------|------|
| 1 | Site URL을 `https://mychapter.app`로 변경 (도메인 연결 시) | Auth URL Configuration |
| 2 | Firebase + `google-services.json` | Phase 6 |
| 3 | Android AAB + Play | `15-launch-roadmap` Wave 2 |

---

## 막혔을 때 — 복붙용 체크

Cursor에 아래 형식으로 보내면 빠르게 도와줍니다.

```
【막힌 단계】 STEP 몇 / 무엇을 하다가
【화면·증상】 (예: 로그인 후 흰 화면)
【브라우저 주소】 
【콘솔 에러】 (F12 → Console 빨간 글씨 복사)
【Supabase Logs】 Edge Function 또는 Auth 로그 한 줄
```

### 자주 하는 실수

| 실수 | 결과 |
|------|------|
| Secrets에 `anon` 키를 `SERVICE_ROLE_KEY`로 넣음 | Function 권한 오류 |
| bypass를 `false`로 바꾸고 서버 재시작 안 함 | 계속 mock |
| Redirect URL에 localhost 없음 | Magic Link 실패 |
| Function 재배포에 시간 씀 | 이미 배포됨 — Secrets만 보면 됨 |

---

## 진행 상황 표시 (본인 체크용)

| STEP | 내용 | 완료 |
|------|------|------|
| 1a | Secrets (`GOOGLE_AI_API_KEY`, `SERVICE_ROLE_KEY`) | ☐ AI·PDF용 — 등록·유효성 |
| 1b | 운영 `BILLING_DEV_BYPASS` OFF | ☐ **지금 최우선** |
| 2 | Email + Redirect URL | ☑ 운영 Magic Link PASS |
| 3 | `VITE_DEV_BYPASS` / 공개키 (앱 mock 아님) | ☑ 운영 검증됨 |
| 4a | E2E 로그인 | ☑ 7/7 PASS |
| 4b | E2E 책·기록·PAGE | ☑ 17 PASS (2026-10-24) |
| 4c | AI 챕터 · PDF LIVE (스테이징 권장) | ☐ |
| 4d | 운영 DB 025 (백업·승인 후) | ☐ 코드만 main |
| 5 | (선택) OAuth | ☐ |
| 6 | Vercel Production | ☑ `my-chapter.vercel.app` |

---

## 관련 문서

| 문서 | 언제 보나 |
|------|-----------|
| **이 문서 (`18-user-next-steps.md`)** | **지금 할 일 따라하기** |
| **`22-e2e-status.md`** | **LIVE E2E PASS/PENDING·출시 차단** |
| **`27-functional-test-checklist.md`** | **기능 테스트 Phase 0~4 체크리스트·실행 로그** |
| `17-test-report.md` | AI 스모크·자동 테스트·로그인 LIVE 요약 |
| `20-error-cases.md` | 기능별 에러 케이스·수정 우선순위 |
| `21-screen-completeness.md` | MVP 화면 누락 여부·미개발 목록 |
| `06-user-tasks.md` | Supabase·Vercel·Play 전체 작업 |
| `15-launch-roadmap.md` | 출시 전체 우선순위 |
| `16-dev-plan.md` | 개발 Wave / 코드 미완 목록 |

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-23 | 최초 작성 — Secrets·Auth·bypass·E2E 단계별 가이드 |
| 2026-10-24 | 운영 로그인 7/7 PASS 반영 · 다음 목표를 책·기록 E2E로 전환 |
| 2026-10-24 | 운영 `BILLING_DEV_BYPASS` 금지 · AI Secrets 2개로 정리 |
| 2026-10-25 | 책·기록 17 PASS 반영 · 다음 목표를 결제 우회 OFF·Secrets·AI/PDF·025로 전환 |
