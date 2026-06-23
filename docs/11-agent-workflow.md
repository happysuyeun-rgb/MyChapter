# MyChapter — AI 에이전트 워크플로 & 출시 체크리스트

> **최종 갱신:** 2026-06-23  
> **참고:** `AI_TOOLS_COLLECTION.md`, `DESIGN.md`, `06-user-tasks.md`, **`15-launch-roadmap.md`**

---

## 1. 설치된 도구

| 도구 | 상태 | 위치 |
|------|------|------|
| getdesign (Notion) | ✅ 설치됨 | `DESIGN.md` |
| mychapter-ui skill | ✅ 설치됨 | `.cursor/skills/mychapter-ui/SKILL.md` |
| agency-agents | ⚠️ `npx skills add` 미지원 | 아래 프롬프트로 수동 활성화 |

`agency-agents` 저장소는 Cursor `skills` CLI 형식(`SKILL.md`)과 맞지 않아 자동 설치가 실패했습니다. 대신 **역할별 프롬프트**를 그대로 사용하세요.

---

## 2. 역할별 에이전트 (Cursor 프롬프트)

### Product Manager — MVP·우선순위

```
Product Manager 역할로 MyChapter MVP를 검토해줘.
참고: docs/07-dev-progress.md, docs/15-launch-roadmap.md

- 출시 전 반드시 해야 할 P0/P1 항목만 정리
- Free/Pro 제한이 UX와 맞는지 검토
- 미완 항목(Play Billing, S-32 챕터 이동) 우선순위 제안
```

### Frontend Developer — 구현

```
Frontend Developer 역할로 MyChapter React 코드를 수정해줘.
스택: Vite, React 19, TypeScript, Tailwind, Zustand, Capacitor.

- DESIGN.md + .cursor/skills/mychapter-ui 규칙 준수
- 기존 Button, Card, FlatIcon, EmptyState 재사용
- 변경 범위는 요청한 화면만
```

### UI Designer — 폴리싱

```
UI Designer 역할로 [화면명]을 폴리싱해줘.
참고: DESIGN.md (Notion warm minimal), tailwind.config.js (MyChapter green accent)

- 이모지 제거, FlatIcon 라인 아이콘
- 제목 font-serif, 본문 ink-muted
- 모바일 430px 기준
```

### Growth Hacker — 출시·유입

```
Growth Hacker 역할로 MyChapter Play 스토어 출시 전략을 짜줘.
참고: store/play-store-listing.ko.txt

- 스토어 설명·키워드·스크린샷 구성 (5~8장)
- Day-1 리텐션 실험 3가지
- Free → Pro 전환 터치포인트 점검 (Paywall, ChapterLimitBanner)
```

### Testing — 출시 전 점검

```
QA 역할로 MyChapter 출시 전 테스트 체크리스트를 만들어줘.
참고: docs/07-dev-progress.md, docs/15-launch-roadmap.md

- 인증(OAuth, Magic Link), 기록 저장, 챕터 생성, PDF, Paywall dev 모드
- Edge Function 배포 여부는 06-user-tasks와 대조
```

---

## 3. 출시 체크리스트 (요약)

상세 우선순위·일정·담당 구분은 **`15-launch-roadmap.md`** 를 따르세요.

### P0 — 없으면 앱 불가

| # | 항목 | 담당 | 문서 |
|---|------|------|------|
| 1 | Supabase 마이그레이션 001~006 | 본인 | `09-supabase-setup.md` |
| 2 | Edge Function 8개 배포 + Secrets | 본인 | `06-user-tasks.md` §5 |
| 3 | `VITE_DEV_BYPASS=false` 실연동 E2E | 본인 | `15-launch-roadmap.md` §P0 |

### P1 — 베타 품질

| # | 항목 | 담당 |
|---|------|------|
| 4 | OAuth + Vercel 배포 | 본인 |
| 5 | PDF 출판 E2E (dev billing) | 본인 |
| 6 | Paywall·Empty State UI | ✅ 완료 |

### P2 — 스토어 출시

| # | 항목 | 담당 |
|---|------|------|
| 7 | Firebase / FCM | 본인 |
| 8 | Android AAB + Play Console | 본인 |
| 9 | Play Billing 실결제 + 네이티브 브릿지 | 본인 + AI |

---

## 4. 권장 작업 순서

**→ `15-launch-roadmap.md` §「2주 권장 일정」** 참고.

- **1주차:** Supabase 실연동 + E2E + Vercel
- **2주차:** Android + Play + 스토어 리스팅

---

## 5. UI 폴리싱 완료 항목

| 컴포넌트 | 변경 | 갱신일 |
|----------|------|--------|
| `EmptyState` | FlatIcon + serif 제목 + 원형 surface-alt 프레임 | 2026-06-23 |
| `PaywallModal` | FlatIcon 기능 리스트, Notion식 시트 레이아웃 | 2026-06-23 |
| `ChapterLimitBanner` | Card padding 추가 | 2026-06-23 |
| `FlatIcon` | 공통 라인 SVG 아이콘 | 2026-06-23 |
| `DESIGN.md` | Notion 디자인 시스템 (getdesign) | 2026-06-23 |
| `.cursor/skills/mychapter-ui` | UI 작업 가이드 skill | 2026-06-23 |

---

## 6. 관련 문서

| 문서 | 내용 |
|------|------|
| **`15-launch-roadmap.md`** | **출시 로드맵·우선순위·2주 일정 (메인)** |
| `DESIGN.md` | Notion 디자인 참고 (UI 작업 전 필독) |
| `06-user-tasks.md` | 본인 Supabase·배포 작업 |
| `07-dev-progress.md` | 코드 구현 현황 |
| `00-design-decisions.md` | 아키텍처·비즈니스 결정 |

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-23 | 최초 작성 — 에이전트 프롬프트, UI 폴리싱, 체크리스트 |
| 2026-06-23 | `15-launch-roadmap.md` 연동, 체크리스트 요약화 |
