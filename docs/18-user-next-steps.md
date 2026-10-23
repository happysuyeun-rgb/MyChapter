# MyChapter — 본인이 지금 할 일 (상세 가이드)

> **최종 갱신:** 2026-10-23  
> **대상:** 서비스 담당자 (비개발자 포함)  
> **전제:** 마이그레이션 001~006 ✅ · Edge Function 8개 배포 ✅ (스모크 확인됨)  
> **관련:** `06-user-tasks.md`, `17-test-report.md`, `15-launch-roadmap.md`

---

## 이 문서의 목표

아래를 **순서대로** 끝내면, mock 없이 실제 Supabase로 앱이 동작하는지 확인할 수 있습니다.

```
① Secrets 등록/확인
② 이메일 로그인 설정 + Redirect URL
③ VITE_DEV_BYPASS=false
④ 로컬에서 E2E 테스트
```

**지금 하지 않아도 되는 것**

| 항목 | 이유 |
|------|------|
| Edge Function 8개 재배포 | 이미 원격에서 응답 확인됨 (`17-test-report.md`) |
| 마이그레이션 SQL 재실행 | 001~006 적용 완료 |
| Firebase / Play Console | 베타·출시 단계 (나중에) |

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
4. 아래 **3개를 하나씩** 추가:

| Name (이름, 정확히) | Value (값) | 비고 |
|---------------------|------------|------|
| `GOOGLE_AI_API_KEY` | 1-2에서 복사한 키 | Gemini AI용 |
| `SERVICE_ROLE_KEY` | 1-1의 **service_role** 키 | `anon` 키 넣으면 안 됨 |
| `BILLING_DEV_BYPASS` | `true` | 테스트 결제 허용 |

5. 저장 후 목록에 세 이름이 보이는지 확인

**CLI로 넣는 방법 (선택)**

PowerShell:

```powershell
cd c:\Users\happy\Projects\lab\Cursor\MyChapter
npx supabase login
npx supabase link --project-ref rdrafwfdwfzgcfiqkgug
npx supabase secrets set GOOGLE_AI_API_KEY=여기에_AIza키
npx supabase secrets set SERVICE_ROLE_KEY=여기에_service_role키
npx supabase secrets set BILLING_DEV_BYPASS=true
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

**STEP 2 완료 표시:** ☐ Email ON + Redirect URL 저장함

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

## STEP 4 — E2E 테스트 (직접 따라하기)

목표: **로그인 → 온보딩 → 프로젝트 → AI 질문 → 기록 저장 → 목록**

### 4-1. 로그인

1. `http://localhost:5173` → 스플래시 후 **로그인** 화면
2. **이메일로 시작** (또는 Email 메뉴)
3. 본인 이메일 입력 → 링크 발송
4. 메일함에서 링크 클릭 → 브라우저가 `localhost:5173`으로 돌아와야 함

**실패 시**

| 증상 | 확인할 것 |
|------|-----------|
| 메일이 안 옴 | Providers Email ON, 스팸함, Supabase Auth 로그 |
| 링크 클릭 후 빈 화면/에러 | Redirect URLs에 `localhost:5173/**` 있는지 |
| 계속 mock 서아로 홈 | `.env.local`이 `false`인지, **서버 재시작** 했는지 |

### 4-2. 온보딩

1. 닉네임 입력 (2~10자) → 다음
2. 알림 권한 화면 → 허용 또는 나중에

### 4-3. 첫 프로젝트 생성

1. 프로젝트 유형 선택 (예: 감정)
2. 제목·기간 설정
3. 기록 모드 선택
4. 생성 완료 → **첫 AI 질문**이 보이면 Secrets·Function OK

**AI 질문이 안 나오거나 에러**

1. Dashboard → **Edge Functions** → `generate-question` → **Logs**
2. `GOOGLE_AI_API_KEY` / `SERVICE_ROLE_KEY` 오타·누락인지 확인
3. 로그·화면 에러 문구를 복사해 Cursor에 공유

### 4-4. 기록 1개 저장

1. 홈에서 **지금 답하기** 또는 기록 탭 → + 기록
2. 질문 모드로 10자 이상 작성 → 감정 선택 → **저장**
3. 완료 화면 → 홈/기록 목록에 새 기록이 보이면 성공

### 4-5. 통과 체크리스트

- [ ] 이메일 로그인 성공
- [ ] 닉네임·온보딩 완료
- [ ] 프로젝트 1개 생성
- [ ] AI 질문 표시
- [ ] 기록 저장 후 목록에 표시
- [ ] Supabase Table Editor에 `users` / `projects` / `records` 행이 생김

**전부 체크되면 = M1(로컬 실연동) 통과** → Cursor에 “E2E 통과했어”라고 알려주세요.

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
| 1 | Secrets 3개 | ☐ |
| 2 | Email + Redirect URL | ☐ |
| 3 | `VITE_DEV_BYPASS=false` + 서버 재시작 | ☐ |
| 4 | E2E (로그인~기록) | ☐ |
| 5 | (선택) OAuth | ☐ |
| 6 | (나중) Vercel 등 | ☐ |

---

## 관련 문서

| 문서 | 언제 보나 |
|------|-----------|
| **이 문서 (`18-user-next-steps.md`)** | **지금 할 일 따라하기** |
| `17-test-report.md` | AI가 이미 테스트한 결과 |
| `06-user-tasks.md` | Supabase·Vercel·Play 전체 작업 |
| `15-launch-roadmap.md` | 출시 전체 우선순위 |
| `16-dev-plan.md` | 개발 Wave / 코드 미완 목록 |

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-23 | 최초 작성 — Secrets·Auth·bypass·E2E 단계별 가이드 |
