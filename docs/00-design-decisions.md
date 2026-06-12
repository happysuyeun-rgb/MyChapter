# MyChapter — 설계 결정 사항 (Design Decisions)

> 화면설계서 v1.1 + Cursor 프롬프트 v1.0 검토 후 확정한 미정의 항목  
> 작성일: 2026-06-12

---

## 1. 아키텍처

| 항목 | 결정 | 근거 |
|------|------|------|
| Android 패키징 | **Capacitor WebView 단독** (TWA 미사용) | OAuth 딥링크, 카메라/푸시 권한, Play Billing 플러그인 통합이 단순 |
| 웹 배포 | Vercel (SPA) | Capacitor가 동일 URL 로드 |
| AI 호출 | Supabase Edge Functions only | API Key 프론트 노출 금지 |
| PDF 생성 | Edge Function + `@react-pdf/renderer` (서버) | Puppeteer는 Deno/Edge에서 무거움; 템플릿 기반 PDF로 MVP 충분 |
| 일일 알림 | Supabase `pg_cron` + Edge Function `send-daily-reminder` | 별도 인프라 없이 운영 |
| 약관/개인정보 | **외부 URL (Vercel 정적 페이지)** + 앱 내 WebView | 스토어 URL 제출·업데이트 용이 |

---

## 2. 온보딩

| 항목 | 결정 |
|------|------|
| 서비스 소개 슬라이드 3장 | **MVP 제외** — SECTION 01 설명은 S-03→S-04 직행으로 정정 |
| 이메일 로그인 | **Magic Link** (비밀번호 없음) — S-02에서 이메일 입력 → 링크 발송 안내 화면 1개 |
| 신규 유저 온보딩 종료 | S-04 완료 후 **항상 S-05** (첫 프로젝트 생성 유도) |
| S-09 노출 | 온보딩 이후 **프로젝트 0개**일 때만 (삭제·미생성 케이스) |

---

## 3. 데이터 모델 명칭 통일

| 화면설계서 (구) | 확정 컬럼명 |
|----------------|-------------|
| `draft_content` | `ai_content` (AI 최초 생성본, 불변 보관) |
| `user_content` | `user_content` (사용자 편집본, 미리보기·PDF는 `COALESCE(user_content, ai_content)`) |
| `type='free'` (S-15) | `mode = 'free'` |
| 매일선택 | `record_mode = 'daily'` |

---

## 4. Free / Pro 제한

| 기능 | Free | Pro |
|------|------|-----|
| 프로젝트 수 | 1 | 무제한 |
| AI 질문 | 월 10회 | 무제한 |
| 챕터 수 (프로젝트당) | 3 | 무제한 |
| PDF 출판 | 불가 | 무제한 |
| 표지 템플릿 | 4종 중 2종 | 4종 전체 |

**S-P1 팝업 트리거 (4종):**

1. PDF 다운로드/출판 시도
2. 프로젝트 2개째 생성 시도
3. AI 질문 월 10회 초과
4. 챕터 4개째 자동 생성 시도 (3개까지는 Free 허용)

---

## 5. 스트릭 규칙

- **기준 타임존:** `Asia/Seoul`
- **연속 일수:** 마지막 기록일부터 역순으로 **캘린더 일 단위** 1건 이상 기록 시 +1
- **주 N회 프로젝트:** 스트릭은 **기록이 있는 날** 기준 (주 5회여도 주말 미기록 시 스트릭 끊김)
- **배지:** 7일 / 14일 / 30일 연속 + 기록 10 / 25 / 50개 마일스톤

---

## 6. 챕터 규칙

- **자동 생성:** 프로젝트당 누적 기록 10, 20, 30… 개마다 (미할당 기록만)
- **Free 한도:** 완성 챕터 3개까지; 4번째 트리거 시 챕터 생성 보류 + S-P1
- **챕터 변경 (S-32):** 사용자가 record를 다른 챕터로 이동; AI 재생성은 하지 않음
- **AI 재생성 (S-19):** 해당 챕터의 `record_ids` 기준으로 `ai_content` 덮어쓰기 (`user_content` null)

---

## 7. 환경변수

```env
# 프론트 (.env.local)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PRIVACY_POLICY_URL=https://mychapter.app/privacy
VITE_TERMS_URL=https://mychapter.app/terms

# Edge Functions (Supabase Secrets) — 프론트에 Claude Key 금지
ANTHROPIC_API_KEY=
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=  # Phase 5
```

---

## 8. 신규·보완 화면 ID

| ID | 화면명 | 비고 |
|----|--------|------|
| S-24 | 설정 | ⚙ 진입, 알림·계정 |
| S-10b | 프로젝트 목록 | Pro 다중 프로젝트, Free는 미노출 |
| S-02e | 이메일 Magic Link | 이메일 입력 + 발송 완료 |
| S-W3 | 이용약관 | S-W2와 동일 레이아웃, URL만 다름 |
