# MyChapter — 출시 로드맵 & 우선순위 가이드

> **최종 갱신:** 2026-10-25  
> **대상:** 서비스 담당자 + Cursor AI  
> **관련:** `06-user-tasks.md`, `18-user-next-steps.md`, **`22-e2e-status.md`**, **`26-ai-pdf-release-execution-runbook.md`**

---

## 요약

MyChapter는 **코드 구현은 대부분 완료**되었고, **운영 이메일 로그인(7/7) + 책·기록(17항목)은 2026-10-24 LIVE PASS**입니다.  
현재 병목은 **운영 결제 우회 OFF · Gemini Secret · AI/PDF(스테이징) · DB 025 적용**과 OAuth·SMTP 잔여입니다.

현황: `22-e2e-status.md` · 본인 다음 할 일: `18-user-next-steps.md` STEP 4b · `26-…runbook.md`.

| 단계 | 기간 | 목표 |
|------|------|------|
| **P0** | 오늘~내일 | mock 없이 앱이 실제로 동작 |
| **P1** | 이번 주 | 베타 테스터에게 보여줄 수 있는 상태 |
| **P2** | 다음 주 | Play 스토어 내부 테스트·출시 준비 |
| **P3** | 출시 후 | 부가 기능·UI 고도화 |

---

## 현재 상태 (2026-10-25)

| 항목 | 상태 | 비고 |
|------|------|------|
| 코드 (Phase 0~6 + PR #2 가드) | ✅ 대부분 완료 | main `79e3ad1` 기준 근처 |
| Supabase 프로젝트 | ✅ 생성됨 | |
| **마이그레이션 001~006** | **✅ 운영 적용** | `scripts/*_idempotent.sql` |
| **마이그레이션 025** | 🔄 코드만 main | **운영 미적용** — runbook 선행 |
| 저장 정합 / CI | ✅ BUILD | vitest·CI ≠ LIVE |
| **운영 이메일 로그인 E2E** | **✅ 7/7 PASS — LIVE** | |
| **책·기록 저장 E2E** | **✅ 17 PASS — LIVE** | `22-e2e-status.md` §4 |
| AI 챕터 · PDF E2E | 🔄 PENDING | Secret·준비도·스테이징 |
| 운영 `BILLING_DEV_BYPASS` OFF | 🔄 **본인 최우선** | Work 보고 당시 활성 |
| `GOOGLE_AI_API_KEY` | 🔄 미등록 보고 | 유효성 본인 확인 |
| Edge Function 배포 | ✅ 응답 확인 | 가드 코드 재배포는 별도 승인 |
| OAuth (Kakao/Google) | 🔄 미완료 | |
| 일반 사용자 SMTP | 🔄 미완료 | |
| Vercel Production | ✅ | https://my-chapter.vercel.app |
| Firebase / FCM | 🔄 | 베타 후 |
| Play Billing 실결제 | 🔄 | 출시 시 |
| UI (Paywall·Empty) | ✅ | |

---

## P0 — 없으면 앱 불가 (오늘~내일)

**목표:** mock 없이 핵심 여정이 끝까지 동작하는지 확인

| # | 할 일 | 담당 | 완료 | 참고 |
|---|--------|------|------|------|
| 1 | Supabase 마이그레이션 001~006 적용 | 본인 | ☑ | `scripts/001~006_idempotent.sql` |
| 2 | Edge Function 8개 배포 | 본인 | ☑ | 프로브로 배포 확인 (`17-test-report.md`) |
| 2b | Secrets (`GOOGLE_AI_API_KEY`, `SERVICE_ROLE_KEY`) + **bypass OFF** | 본인 | ☐ | **지금 최우선** · `26-…runbook.md` |
| 3 | Production 공개키 · 이메일 Auth | 본인 | ☑ | 로그인 LIVE PASS |
| 4a | **E2E 로그인** | Work | ☑ | 2026-10-24 · `22-e2e-status.md` |
| 4b | **E2E 책·기록·PAGE** | Work | ☑ | 17 PASS · `22-e2e-status.md` §4 |
| 4c | **AI 챕터 · PDF** (스테이징 권장) | 본인+Work | ☐ | 운영 시간/우회 조작 금지 |

### E2E 최소 성공 기준

**로그인·책·기록:** ✅ PASS (2026-10-24).

**남은 P0 핵심 (본인 운영 설정):**

```
BILLING_DEV_BYPASS OFF → Gemini/SERVICE_ROLE Secret → (스테이징) AI 챕터 → PDF
```

**다음에 할 일:** → **[`18-user-next-steps.md`](./18-user-next-steps.md)** STEP 4b · **[`26-ai-pdf-release-execution-runbook.md`](./26-ai-pdf-release-execution-runbook.md)**

---

## P1 — 출시 품질 (이번 주)

**목표:** 외부에 보여줄 수 있는 베타 (3~5명)

| # | 할 일 | 담당 | 완료 | 참고 |
|---|--------|------|------|------|
| 5 | Kakao / Google OAuth Redirect URL | 본인 | ☐ | 미완료 — 로그인 PASS와 별개 |
| 6 | Vercel 프로덕션 배포 + env 동기화 | 본인 | ☑ | `my-chapter.vercel.app` |
| 7 | 약관 URL 실동작 확인 (`/privacy`, `/terms`) | 본인 | ☐ | `VITE_PRIVACY_POLICY_URL` |
| 8 | 챕터 생성 → PDF 출판 (dev billing) E2E | 본인 | ☐ | Pro 플로우 · LIVE 미실시 |
| 9 | 연동 중 발생 버그 수정 | Cursor AI | ☐ | AI/PDF E2E·스테이징 결과 후 |

### P1에서 미루어도 되는 것

- Firebase / FCM 푸시 (앱 내 알림만으로 베타 가능)
- Play 스토어 업로드
- UI 추가 폴리싱 (SubscriptionPage 등)

---

## P2 — 출시 준비 (다음 주)

**목표:** Play 스토어 내부 테스트 트랙

| # | 할 일 | 담당 | 완료 | 참고 |
|---|--------|------|------|------|
| 10 | Firebase + `google-services.json` | 본인 | ☐ | `06-user-tasks.md` §6 |
| 11 | `send-daily-reminder` Cron 설정 | 본인 | ☐ | `005_cron_daily_reminder.sql` |
| 12 | Android AAB 빌드 + Play Console 내부 테스트 | 본인 | ☐ | `cap:sync` |
| 13 | Play Billing 상품 등록 | 본인 | ☐ | Play Console |
| 14 | Play Billing 네이티브 브릿지 | Cursor AI | ☐ | `07-dev-progress.md` P1 |
| 15 | 스토어 리스팅·스크린샷 (5~8장) | 본인 + AI | ☐ | `store/play-store-listing.ko.txt` |

### Growth Hacker 프롬프트 (스토어 준비 시)

```
Growth Hacker 역할로 MyChapter Play 스토어 출시 전략을 짜줘.
참고: store/play-store-listing.ko.txt

- 스토어 설명·키워드·스크린샷 구성 (5~8장)
- Day-1 리텐션 실험 3가지
- Free → Pro 전환 터치포인트 점검 (Paywall, ChapterLimitBanner)
```

---

## P3 — 출시 후

| # | 항목 | 우선순위 | 담당 |
|---|------|----------|------|
| 16 | S-32 기록→챕터 이동 | P2 | Cursor AI |
| 17 | `expand-caption` (사진 캡션 AI) | P3 | Cursor AI |
| 18 | text-to-lottie 고품질 모션 | P3 | 선택 |
| 19 | SubscriptionPage·온보딩 UI 폴리싱 | P3 | Cursor AI |
| 20 | S-22 실물책 POD | P3 | MVP 제외 |
| 21 | Capacitor Camera 플러그인 | P3 | 현재 file input |

---

## 2주 권장 일정

### 1주차 — 실연동 + 베타

| 요일 | 본인 | Cursor AI |
|------|------|-----------|
| 월 | Supabase 마이그레이션 + Edge Function 배포 확인 | — |
| 화 | `VITE_DEV_BYPASS=false`, 로그인·프로젝트·기록 E2E | 연동 버그 수정 |
| 수 | OAuth 설정, AI 질문/힌트/챕터 생성 테스트 | — |
| 목 | Vercel 배포, 약관 URL 확인 | — |
| 금 | PDF 출판(dev billing) 한 바퀴 | E2E 실패 케이스 수정 |

### 2주차 — 스토어 준비

| 요일 | 본인 | Cursor AI |
|------|------|-----------|
| 월 | Firebase + FCM *(또는 출시 후로 연기)* | — |
| 화~수 | Android AAB 빌드, Play 내부 테스트 업로드 | Play Billing 브릿지 |
| 목 | 스토어 리스팅·스크린샷 | Growth 프롬프트로 문구 검토 |
| 금 | 내부 테스트 배포, 결제 플로우 확인 | QA 체크리스트 보완 |

---

## 담당 구분 (본인 vs Cursor AI)

### 본인이 해야 하는 것 (외부 계정·설정)

- Supabase 마이그레이션·Secrets·OAuth
- Vercel / Firebase / Play Console
- `google-services.json`, AAB 업로드
- 스토어 리스팅·스크린샷 촬영

### Cursor AI에게 맡기면 좋은 것

| 시점 | 작업 |
|------|------|
| P0 통과 후 | 연동 버그 수정, API mock 제거 이슈 |
| Vercel 배포 후 | SubscriptionPage·온보딩 UI 폴리싱 |
| Play 올리기 전 | Play Billing 네이티브 브릿지 |
| 출시 후 | S-32, `expand-caption`, Lottie 고도화 |

**주의:** mock(`DEV_BYPASS`) 상태에서 UI만 다듬으면, 실연동 시 다시 깨질 수 있습니다. **P0 E2E 통과 후** UI·부가 기능 작업을 권장합니다.

---

## 의사결정 가이드

| 상황 | 추천 |
|------|------|
| 지금 뭘 해야 할지 모르겠다 | **P0 #2b** — 결제 우회 OFF + Gemini Secret (`26-…runbook`) |
| Function은 배포됐다 | Secrets·bypass 확인 후 스테이징 AI·PDF E2E |
| 베타를 빨리 보여주고 싶다 | 결제 우회 OFF·AI 스모크 후 소규모 초대 (푸시는 나중에) |
| 스토어 출시가 급하다 | P2 #12~14 병렬 (AAB + Billing 브릿지) |
| UI가 아쉽다 | P0 통과 후 `DESIGN.md` + `mychapter-ui` skill로 폴리싱 |

---

## 관련 문서

| 문서 | 용도 |
|------|------|
| [06-user-tasks.md](./06-user-tasks.md) | Supabase·Vercel·Play **작업 절차** |
| [07-dev-progress.md](./07-dev-progress.md) | 코드 **구현 현황** |
| [09-supabase-setup.md](./09-supabase-setup.md) | 마이그레이션·Edge Function 상세 |
| [11-agent-workflow.md](./11-agent-workflow.md) | AI 에이전트 프롬프트·체크리스트 |
| [16-dev-plan.md](./16-dev-plan.md) | 잔여 점검·Wave 0~3 개발 계획 |
| [DESIGN.md](../DESIGN.md) | UI 디자인 참고 (Notion) |

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-23 | 최초 작성 — P0~P3 로드맵, 2주 일정, 담당 구분 |
| 2026-06-23 | 마이그레이션 001~006 적용 완료 (`scripts/*_idempotent.sql`) |
| 2026-10-23 | Secrets 명칭 정정(Gemini), `16-dev-plan.md` 연동 |
| 2026-10-23 | Edge Function 배포 확인·`17-test-report` 반영, 다음 액션을 Secrets+E2E로 조정 |
| 2026-10-24 | 운영 로그인 LIVE PASS · Vercel Production ☑ · 다음을 책·기록 E2E로 조정 |
| 2026-10-24 | CI `2d38c10` 반영 · 운영 billing bypass 금지 명시 |
| 2026-10-25 | 책·기록 17 LIVE PASS 반영 · 다음을 bypass OFF·Secret·AI/PDF·025로 조정 |
