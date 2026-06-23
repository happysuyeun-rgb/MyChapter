# MyChapter 문서 목록

> **최종 갱신:** 2026-06-23

MyChapter 프로젝트 설계·개발·운영 문서 인덱스

---

## 문서 작성 규칙

- 모든 문서 **상단**에 `최종 갱신: YYYY-MM-DD` 표기
- 내용을 수정할 때마다 해당 날짜를 **반드시** 갱신
- 큰 변경은 문서 하단 **갱신 이력** 표에 날짜·요약 추가 (로드맵·진행 문서 권장)

---

## 설계 (Phase 0 이전)

| 문서 | 설명 | 최종 갱신 |
|------|------|-----------|
| [00-design-decisions.md](./00-design-decisions.md) | 아키텍처·MVP 범위 결정 | 2026-06-12 |
| [01-routing-and-flows.md](./01-routing-and-flows.md) | 화면 ID, 라우트, 사용자 플로우 | — |
| [02-database-schema.md](./02-database-schema.md) | PostgreSQL 스키마 상세 | — |
| [03-edge-functions-api.md](./03-edge-functions-api.md) | Edge Function API | — |
| [04-business-rules.md](./04-business-rules.md) | Free/Pro, 챕터, 기록 규칙 | — |
| [05-implementation-plan.md](./05-implementation-plan.md) | Phase 0~6 개발 계획 | — |

---

## 운영·진행 (비개발자용)

| 문서 | 설명 | 대상 | 최종 갱신 |
|------|------|------|-----------|
| **[06-user-tasks.md](./06-user-tasks.md)** | **직접 해야 하는 일** (Supabase, Vercel, Play 등) | **서비스 담당자** | — |
| **[07-dev-progress.md](./07-dev-progress.md)** | AI 구현 현황 (완료 / 연동 필요 / 미완) | 담당자 + 개발자 | 2026-06-23 |
| **[08-development-specification.md](./08-development-specification.md)** | **개발명세서** (통합 기술 문서) | 전체 | — |
| **[09-supabase-setup.md](./09-supabase-setup.md)** | Supabase + **마이그레이션 적용** | Supabase 연결 시 필수 | — |
| **[11-agent-workflow.md](./11-agent-workflow.md)** | AI 에이전트 프롬프트·출시 체크리스트 요약 | 담당자 + Cursor | 2026-06-23 |
| **[15-launch-roadmap.md](./15-launch-roadmap.md)** | **출시 로드맵·우선순위·2주 일정** | **담당자 (시작점)** | 2026-06-23 |

---

## 화면별 기능명세

| 문서 | 범위 | 상태 |
|------|------|------|
| [10-screen-spec-phase3-home-record.md](./10-screen-spec-phase3-home-record.md) | Phase 3 — S-09~S-16, S-30~S-32, S-11 | ✅ |
| [11-screen-spec-phase1-2-auth-project.md](./11-screen-spec-phase1-2-auth-project.md) | Phase 1~2 — S-01~S-08, S-02e, S-W2/W3, S-P1 | ✅ |
| [12-screen-spec-phase4-book.md](./12-screen-spec-phase4-book.md) | Phase 4 — S-17~S-21 | ✅ |
| [13-screen-spec-phase5-mypage-payment.md](./13-screen-spec-phase5-mypage-payment.md) | Phase 5 — S-23, S-24, S-W1, S-P1 | ✅ |
| [14-platform-spec-phase6-android-push-deploy.md](./14-platform-spec-phase6-android-push-deploy.md) | Phase 6 — Android·FCM·딥링크·배포 | ✅ |

---

## 빠른 시작 (출시 준비)

1. **[15-launch-roadmap.md](./15-launch-roadmap.md)** — 지금 무엇부터 할지 (P0부터)
2. [09-supabase-setup.md](./09-supabase-setup.md) — SQL 001~006 실행
3. `.env.local` 작성 (09 문서 §5)
4. [06-user-tasks.md](./06-user-tasks.md) — OAuth, Edge Function, Vercel

---

## SQL 마이그레이션 파일

```
supabase/migrations/
├── 001_initial_schema.sql    ← 1번째 실행
├── 002_rls_policies.sql      ← 2번째
├── 003_triggers.sql          ← 3번째
├── 004_notifications_insert.sql ← 4번째
├── 005_cron_daily_reminder.sql  ← Cron 안내 (주석)
└── 006_...                   ← Storage 등 (09 문서 참고)
```

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-23 | `15-launch-roadmap.md`, `11-agent-workflow.md` 추가; 문서 작성 규칙·날짜 표기 도입 |
