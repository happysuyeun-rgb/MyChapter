# MyChapter — 본인이 지금 할 일 (상세 가이드)

> **최종 갱신:** 2026-10-24  
> **대상:** 서비스 담당자 (비개발자 포함)  
> **전제:** 마이그레이션 001~006 ✅ · Edge Function 8개 배포 ✅ · **운영 이메일 로그인 E2E 7/7 PASS** (`22-e2e-status.md`)  
> **관련:** `06-user-tasks.md`, `17-test-report.md`, `15-launch-roadmap.md`, `20-error-cases.md`, `22-e2e-status.md`

---

## 이 문서의 목표

**운영 이메일 로그인은 완료**됐습니다. 지금은 **책·기록 실사용 E2E**가 다음입니다.

```
① (완료) 운영 Magic Link 로그인
② Secrets 등록/확인 — AI·PDF용
③ Work: 첫 책 → 자유/질문/사진 저장 → 새로고침·PAGE 정합
④ (이후) AI 챕터 · PDF · OAuth · SMTP 일반화
```

**이미 끝난 운영 검증 (2026-10-24, `7ab565a6`, https://my-chapter.vercel.app)**

| 항목 | 결과 |
|------|------|
| Production 배포 · anon 키 · Magic Link · 로그인 · 마이페이지 · 세션 유지 · 로그아웃/가드 | **7/7 PASS — LIVE** |
| Supabase 요청 4xx·5xx | 없음 (29건) |

**아직 미완료로 유지**

| 항목 | 상태 |
|------|------|
| 일반 사용자 대상 SMTP | 미완료 |
| Google · Kakao OAuth | 미완료 |
| 실계정 책·기록 저장 E2E | **Work 진행 예정** |
| AI 챕터 · PDF E2E | 미실시 |

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

**STEP 1 완료 표시:** ☐ Secrets 3개 등록함

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

## STEP 4 — 다음 E2E (Work / 실계정) — **지금 진행**

운영: https://my-chapter.vercel.app · 로그인 E2E는 **이미 PASS**.  
목표: **첫 책 → 3모드 기록 → 새로고침 유지 → PAGE 정합**

상세 현황 표: **`22-e2e-status.md` §4**

### 4-1. 로그인 (완료 확인만)

이미 통과한 계정이면 재검증 불필요. 새 계정이면 Magic Link로 로그인 후 온보딩만 확인.

### 4-2. 온보딩 (해당 시)

1. 닉네임 입력 (2~10자) → 다음  
2. 알림 권한 → 허용 또는 나중에

### 4-3. 첫 책 생성

1. 책 유형 선택  
2. 제목 입력 → **이 책 시작하기**  
3. 완료 화면 → 홈/기록 진입 가능하면 책 생성 OK

**실패 시:** 화면 문구 + Network/콘솔을 Cursor에 공유 (Production env·Auth 설정은 변경하지 말 것)

### 4-4. 기록 저장 (3모드)

각각 **저장 → 완료 화면의 PAGE 번호 → 목록에 표시**까지:

1. 자유 기록  
2. 질문 기록 (AI 질문이 안 나오면 Secrets·`generate-question` Logs)  
3. 사진 기록 (업로드·미리보기·저장)

### 4-5. 정합 확인

1. 새로고침 후에도 책·기록이 유지되는지  
2. 완료 화면 PAGE와 목록/상세 PAGE가 같은지 (작성 중 「예상 PAGE」와 달라도 됨 — 서버 확정이 기준)

### 4-6. 통과 체크리스트 (Work)

- [x] 이메일 로그인 성공 (운영, 2026-10-24)
- [ ] 닉네임·온보딩 완료 (해당 계정)
- [ ] 책 1개 생성
- [ ] 자유 / 질문 / 사진 각 1건 저장
- [ ] 새로고침 후 데이터 유지
- [ ] 기록 ID·PAGE 번호 정합
- [ ] (이후) AI 챕터 · PDF

결과(성공·실패 단계·스크린샷·콘솔)를 Cursor에 알려주면 개발 개선으로 연결합니다.

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

## STEP 6 — (나중에) Vercel / 푸시 / 스토어

로컬 E2E 통과 후 순서입니다. **지금은 안 해도 됩니다.**

| 순서 | 할 일 | 문서 |
|------|--------|------|
| 1 | Vercel에 배포 + 동일 env | `06-user-tasks.md` |
| 2 | Site URL을 `https://mychapter.app`로 변경 | Auth URL Configuration |
| 3 | Firebase + `google-services.json` | Phase 6 |
| 4 | Android AAB + Play | `15-launch-roadmap` Wave 2 |

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
| 1 | Secrets (`GOOGLE_AI_API_KEY`, `SERVICE_ROLE_KEY`) | ☐ (AI·PDF용 — 값 유효성 확인; 운영에 billing bypass 금지) |
| 2 | Email + Redirect URL | ☑ 운영 Magic Link PASS |
| 3 | Production bypass off / 공개키 | ☑ 운영 검증됨 |
| 4a | E2E 로그인 | ☑ 7/7 PASS |
| 4b | E2E 책·기록·PAGE | ☐ **Work 다음** |
| 5 | (선택) OAuth | ☐ |
| 6 | Vercel Production | ☑ `my-chapter.vercel.app` @ `7ab565a6` |

---

## 관련 문서

| 문서 | 언제 보나 |
|------|-----------|
| **이 문서 (`18-user-next-steps.md`)** | **지금 할 일 따라하기** |
| **`22-e2e-status.md`** | **LIVE E2E PASS/PENDING·출시 차단** |
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
