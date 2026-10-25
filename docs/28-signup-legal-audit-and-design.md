# MY CHAPTER — 회원가입·약관 전수 검수 및 개선 설계

> **작성일:** 2026-10-25 · **제품 결정 반영:** 2026-10-25  
> **기준 tip:** `ecb04e4` 이후 문서 커밋  
> **범위:** 분석·설계. **인증 코드·운영 DB·Secret·Edge 변경 금지.**  
> **법률 문서:** Notion v1.0 초안은 **승인된 법적 게시본이 아님** — `public/legal/*.html`에 덮어쓰지 않음.  
> **관련:** `04_USER_FLOWS.md`, `18-user-next-steps.md`, `02_PRODUCT_DECISIONS.md`, `27-functional-test-checklist.md`

---

## 0. 확정된 제품 결정 (2026-10-25)

| # | 결정 | 상태 |
|---|------|------|
| 1 | 신규 가입자: 닉네임·알림 온보딩 완료 후 **`/project/new` 직행** | ✅ 확정 · **현행 코드와 일치** |
| 2 | 홈·빈 서재 **필수 경유 없음** | ✅ 확정 |
| 3 | `docs/04_USER_FLOWS.md`를 위 구현과 맞춤 | ✅ 문서 작업 |
| 4 | 이용약관은 **명시적 동의 UI** 도입 방향 | ✅ 방향 확정 · 구현은 승인 후 |
| 5 | **개인정보처리방침 고지** / **법적 필수 동의** / **마케팅 선택 동의** 구분 | ✅ 방향 확정 · 항목 목록은 법률 TBD |
| 6 | 기존 회원의 **과거 동의 이력 임의 생성 금지** | ✅ 확정 |

---

## 1. 현재 = 확정 온보딩 Task Flow (코드 기준)

```text
/splash
  ├─ 세션 없음 → /login
  ├─ nickname NULL → /onboarding/nickname
  ├─ onboarding_completed=false → /onboarding/notification
  └─ 온보딩 완료(기존) → /home

/login  (GuestGuard)
  ├─ 카카오 / Google → signInWithOAuth → /splash (웹)
  └─ 이메일 → /login/email → signInWithOtp → 메일 → /splash

신규 auth.users
  → handle_new_user → public.users + subscriptions(free)

/onboarding/nickname → /onboarding/notification
  → notification_enabled ± · onboarding_completed=true
  → **/project/new**   ← 제품 확정 경로 (Home 비경유)

/project/new → setup → complete → 첫 기록
```

근거: `SplashPage.tsx`, `NotificationPage.tsx` (`navigate('/project/new')`), `guards.tsx`, `003_triggers.sql`.

약관 UI (현행, 개선 전):
- 로그인: “시작하면 … 동의합니다” **암시 문구** + 링크 (체크박스 없음)
- 설정·LegalPage·`public/legal/*.html` 초안 연결

---

## 2. 목표 Flow (제품 확정 후)

```text
Splash
→ Login / Signup (인증 방식 선택)
→ [향후] 명시적 동의 UI (약관 필수 · 방침 고지 · 선택 동의 구분)
→ 이메일 / 소셜 인증
→ 신규·기존 판별 (nickname · onboarding_completed)
→ 신규: 닉네임 → 알림 온보딩
→ /project/new → 유형 → 기본 정보 → 첫 기록
```

기존 회원(온보딩 완료): Splash → `/home` (변경 없음).

| 과거 “갭” | 처리 |
|-----------|------|
| 문서 Home 경유 vs 코드 `/project/new` | **코드를 정본**으로 문서 수정 (`04_USER_FLOWS`) |
| 암시 동의 | **명시적 UI + 이력**으로 개선 (구현 승인 후) |

---

## 3. 전수 검수 요약

| 항목 | 판정 |
|------|------|
| 이메일 Magic Link | 구현 완료 (LIVE) / SMTP·Redirect 외부 |
| Google·Kakao | 부분 + 외부 Provider |
| 신규·기존 · 이탈 복귀 · 세션·가드 | 구현 완료 |
| 알림 스킵 | 구현 완료 |
| 온보딩 → `/project/new` | 구현 완료 = **제품 확정** |
| 명시 동의·이력 DB | **미구현** |
| 약관·방침 본문 | **초안만** (Notion v1.0 ≠ 승인 게시본) |

---

## 4. 개인정보·약관 위험 (유지)

- 게시 HTML 초안 부족 → 외부 공개·스토어 **차단급**
- 암시 동의만 → 명시 UI로 해소 예정
- “제3자 제공 없음” 문구 vs Supabase·Gemini **위탁/국외** → 방침 확정 시 정정 (**TBD**)
- Notion v1.0을 승인본처럼 `public/legal`에 올리지 말 것

### 고지 · 필수 동의 · 선택 동의 (구분 원칙)

| 구분 | 의미 | UI | 가입 차단 |
|------|------|-----|-----------|
| 개인정보처리방침 **고지** | 열람·인지 | 링크 + (법률 확정 시) 확인 체크 여부 **TBD** | 법률 확정 후 |
| **필수 동의** | 이용약관 등 계약 동의 | 명시 체크 | 미체크 시 인증 진행 불가 |
| **선택 동의** | 마케팅 등 | 별도 체크 · 기본 미선택 | **거부해도 가입 가능** |
| AI 처리 | 서비스 본질일 수 있음 | **필수 고지 vs 별도 동의** — **법률 TBD** | TBD |

**확정 필요 (구현 전 블로커):** 필수 `consent_type` 목록, 방침이 “고지만”인지 “동의”인지, 마케팅 문구, 문서 버전 문자열.

---

## 5. 다음 구현 준비 — 동의 UI · `user_consents` 상세 설계

> 코드·migration **미적용**. 스테이징 검증·법률 목록 확정 후 별도 승인.

### 5-1. Login / EmailLogin UX

- Editorial 시스템 유지.
- **전체 동의** 토글 시 개별 필수·선택 상태 동기화; 개별 해제 시 전체 동의 해제.
- 필수 미충족 → `signInWithOtp` / `signInWithOAuth` **호출 전** 차단 + 인라인 안내.
- 선택(마케팅) 거부 → 가입·로그인 **허용**.
- 전문: 기존 `LegalPage` / `/legal/*.html` (현 초안 유지; 승인본 교체는 별도).
- 접근성: label 연결, 키보드, 스크린리더.

### 5-2. `user_consents` (migration 초안)

```sql
-- 파일명 예: 026_user_consents.sql (번호는 적용 시점에 맞춤)
create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  consent_type text not null,
  document_version text not null,
  accepted boolean not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, consent_type, document_version)
);
-- RLS: authenticated 본인 SELECT/INSERT
-- UPDATE/철회 정책은 법률 검토 후
```

권장 `consent_type` (이름만 예시 · **필수 여부는 TBD**):

| consent_type | 구분 | 비고 |
|--------------|------|------|
| `terms_of_service` | 필수 동의 후보 | 이용약관 |
| `privacy_policy_ack` | 고지 확인 후보 | 방침 — 동의 vs 고지 **TBD** |
| `marketing_opt_in` | 선택 | 거부 가능 |
| `ai_processing` | TBD | 서비스 필수면 약관·방침 고지로 흡수 가능 |

앱 흐름:
1. 로그인 화면에서 체크 상태를 로컬(또는 sessionStorage)에 보관  
2. 인증 성공 직후 `user_consents` INSERT  
3. INSERT 실패 시 재시도 / 일시 게이트 (서비스 이용 전)

### 5-3. 기존 회원 (중요)

- **과거 동의 행을 백필·임의 생성하지 않음** (제품 결정 #6).
- 신규 스키마 적용 후: 필수 동의가 **한 건도 없는** 기존 계정만, 다음 앱 진입 시 **재동의 UI** 표시 (구현 시).
- 재동의 전까지 기록·책 저장을 막을지 여부는 **제품·법률 TBD** (기본안: 기록은 유지, 신규 민감 처리만 제한 등 — 미확정).

### 5-4. 문서·버전

- `document_version`: 게시 승인일의 ISO 날짜 또는 semver — **승인본 확정 시** 고정.
- Notion v1.0 초안 버전을 운영 `document_version`으로 쓰지 말 것.

---

## 6. 테스트 (구현 승인 후)

기존 `27` Phase 1 회귀 + 동의 시나리오(필수 누락 차단, 선택 거부 가입, 이력 정확성, **기존 회원 무백필**).

---

## 7. 완료 / 미완료 / 승인 대기

### 완료
- [x] 온보딩 → `/project/new` 제품 확정 및 설계 문서 반영
- [x] `04_USER_FLOWS` 정합 (본 커밋)
- [x] 동의 UI·`user_consents` 상세 설계(미구현)
- [x] 기존 회원 이력 임의 생성 금지 명시

### 미완료 · 출시
- [ ] 법률 승인 약관·방침 본문
- [ ] 필수/고지/선택 항목 최종 목록
- [ ] 동의 UI + migration 구현·스테이징
- [ ] OAuth Provider

### 실행 금지 (현재)
- [ ] 인증 코드 대규모 변경
- [ ] 운영 DB·Secret·Edge
- [ ] Notion 초안을 `public/legal`에 승인본처럼 게시
- [ ] 기존 회원 consent 백필

---

## 8. 출시 차단

| 항목 | 차단 |
|------|------|
| 약관·방침 승인본 부재 | **예** |
| 명시 동의·이력 미구현 | **예 (권장)** |
| 온보딩→`/project/new` | **아니오** (확정·구현됨) |
| OAuth | 이메일 베타 시 아니오 |

**다음 엔지니어링 승인 단위:** 필수 consent 목록 확정 → Login 동의 UI + `026_user_consents`(스테이징) → 회귀.

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-25 | 검수·설계 초안 |
| 2026-10-25 | 제품 결정 6항 반영 · `/project/new` 정본 · 동의 UI/migration 상세 · 법률 HTML 비게시 원칙 |
