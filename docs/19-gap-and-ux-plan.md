# MyChapter — 기능 누락 재점검 & UX·디자인 개선 계획

> **최종 갱신:** 2026-10-23  
> **대상:** 제품·개발 (본인 문서 확인 중 AI가 병행 점검)  
> **근거:** `docs/10`~`14` 화면명세, `00`/`04`/`08`, 현재 `src/` 코드  
> **관련:** `16-dev-plan.md`, `07-dev-progress.md`, `DESIGN.md`, `.cursor/skills/mychapter-ui`

### 진행 현황 (AI 구현)

| Wave | 상태 | 비고 |
|------|------|------|
| **U0** | ✅ 2026-10-23 | OTP Toast, PDF Toast, Splash 주석, 이용약관 메뉴 |
| **U1** | ✅ 2026-10-23 | FlatIcon 확장, 홈·마이·로그인·스플래시·알림·기록모드 |
| **U2** | ✅ 2026-10-23 | LoadingBlock·ErrorState, 구독 비교표·복원 CTA, 로딩 적용 |
| U3~U4 | ☐ | Billing 네이티브·S-32 등 (출시 전 / 출시 후) |

---

## 1. 한줄 결론

화면명세에 적힌 **「미구현」 상당수는 이미 구현됨** (명세가 오래됨).  
진짜 남은 기능 갭은 소수이고, **사용자 체감은 UX·아이콘·피드백 일관성**에서 더 크게 갈립니다.

| 구분 | 상태 |
|------|------|
| MVP 핵심 플로우 (로그인~기록~챕터~PDF) | 코드 ✅ · 실연동 E2E만 남음 |
| 명세 vs 코드 **실제 누락** | Billing 네이티브, S-32, expand-caption, 복원구매, 푸시 세부 |
| UX·디자인 | FlatIcon 일부만 적용 · 이모지·로딩·에러 피드백 불균일 |

---

## 2. 명세 갭 vs 현재 코드 (재검증)

### 2.1 명세에 ❌였으나 **이미 구현됨** (문서 갱신 필요)

| 명세 주장 (구) | 현재 코드 | 파일 |
|----------------|-----------|------|
| S-10b placeholder | ✅ `ProjectsListPage` + Pro 가드 | `ProjectsListPage.tsx` |
| S-10 전체보기 Pro 미체크 | ✅ `isPro && projects.length > 1` | `HomePage.tsx` |
| AI_LIMIT Paywall S-08만 | ✅ S-10, S-13, S-15, S-08 | Home / Question / Free / Complete |
| CHAPTER_LIMIT UI 없음 | ✅ Banner + BookPage Paywall | `ChapterLimitBanner`, `BookPage` |
| S-17 드래그 ❌ | ✅ `@dnd-kit` + `reorderChapters` | `BookPage.tsx` |
| `generate-pdf` 미구현 | ✅ Edge + `generateBookPdf` | `BookCoverPage`, functions |
| S-19 저장 실패 UI 없음 | ✅ Toast | `ChapterEditPage` |

→ `10`/`12`/`08` 명세의 「구현 갭」표는 **2026-10-23 기준으로 낡은 상태**. 별도 명세 정리는 Wave와 분리해 진행 가능.

### 2.2 **실제 기능 누락** (코드 재확인)

#### P0 — 출시·실사용에 영향 (인프라/연동 포함)

| ID | 항목 | 설계 | 현재 | 비고 |
|----|------|------|------|------|
| G-01 | 실연동 E2E | 로그인~기록 | bypass만 검증됨 | 본인 `18-user-next-steps` |
| G-02 | Secrets 유효성 | Gemini 키 | 미확인 | Function은 배포됨 |
| G-03 | OAuth Redirect | Kakao/Google | 코드만 있음 | 본인 설정 |

#### P1 — 스토어·유료화

| ID | 항목 | 설계 | 현재 | 비고 |
|----|------|------|------|------|
| G-10 | Play Billing 네이티브 | `MyChapterBilling` | JS `dev_`만 | **유일한 대형 코드 갭** |
| G-11 | 구독 복원 (Restore) | S-P1 / 구독 화면 | ❌ 버튼·API 없음 | Play 필수에 가깝 |
| G-12 | 로그아웃 시 FCM 토큰 삭제 | Phase 6 | `removeDeviceToken` 미호출 | |
| G-13 | S-04 OS 알림 권한 | Capacitor Push 요청 | DB 플래그만 | 푸시 품질 |
| G-14 | PDF 실패 Toast | 사용자 안내 | `console.error`만 | `BookCoverPage` |

#### P2 — MVP 후 / 설계상 선택

| ID | 항목 | 설계 | 현재 |
|----|------|------|------|
| G-20 | S-32 기록→챕터 이동 | ActionSheet 3옵션 | 수정·삭제만 |
| G-21 | `expand-caption` | S-14 선택 | Function 없음 |
| G-22 | Capacitor Camera | 네이티브 촬영 | `<input file>` |
| G-23 | Pro 만료 Cron 강등 | `expires_at` | 클라이언트 캐시만 |
| G-24 | 탈퇴 전 PDF 일괄 다운로드 | 선택 | ❌ |
| G-25 | 마이 메뉴 이용약관 | S-W3 | 개인정보만 (로그인은 둘 다) |
| G-26 | 이메일 OTP 실패 UI | 에러 표시 | 실패해도 `sent=true` |
| G-27 | Splash 프로젝트 0개 분기 | S-09 유도 | 둘 다 `/home` (EmptyState로 흡수) |

#### P3 — MVP 제외

| ID | 항목 |
|----|------|
| G-30 | S-22 실물책 POD |
| G-31 | iOS Capacitor |
| G-32 | 온보딩 소개 슬라이드 |

---

## 3. 작은 버그·품질 (기능에 가깝)

| ID | 이슈 | 영향 | 권장 |
|----|------|------|------|
| B-01 | Splash `count > 0 ? '/home' : '/home'` | 분기 무의미 | `/project/new` 또는 홈 Empty 유지 명시 |
| B-02 | Email OTP 에러 무시 | 사용자 혼란 | 실패 Toast + sent 유지 안 함 |
| B-03 | PDF 실패 무반응 | 출판 실패 인지 불가 | Toast |
| B-04 | 명세 문서 갭 표 outdated | 우선순위 오판 | `10`/`12`/`08` 갭 표 갱신 |

---

## 4. UX·디자인 점검 (사용자 관점)

### 4.1 잘 된 점

- TabBar / EmptyState / Paywall: **FlatIcon + serif + warm surface** 방향 확립
- Free→Pro 트리거 (프로젝트·AI·챕터·PDF) 코드 연결됨
- 홈 Empty / 기록 Empty CTA 명확
- max-width phone, safe area 기본 구조

### 4.2 체감 문제 (우선순위)

#### UX-A — 시각 언어 불일치 (높음)

| 화면 | 현상 | 사용자 느낌 |
|------|------|-------------|
| 홈 | 👋🔔🔥 이모지 + 플랫 탭바 혼재 | “완성도가 반만 된 앱” |
| 마이 | 메뉴 📚🔔💳 이모지 | 탭바와 톤 다름 |
| 로그인 | 📖 이모지 히어로 | 브랜드 약함 · DESIGN.md와 거리 |
| 알림 Empty | 🔔 거대 이모지 | EmptyState 패턴과 불일치 |
| 기록 모드 | 💬📸✍️ 카드 | 기능 구분은 되나 폴리싱 전 |

**개선 방향:** `FlatIcon` 확장 + 홈/마이/로그인/알림/모드선택에 동일 stroke 아이콘. 프로필 이모지만 의도적으로 유지(브랜드 위트).

#### UX-B — 피드백·신뢰 (높음)

| 장면 | 현상 | 개선 |
|------|------|------|
| 전역 로딩 | 「로딩 중...」 텍스트만 | 스켈레톤 또는 짧은 Lottie |
| 이메일 발송 실패 | 성공 화면으로 전환 | 에러 메시지 + 재시도 |
| PDF 실패 | 아무 말 없음 | Toast |
| 기록 저장 중 | 버튼 상태만 | 「저장 중…」 명확화 (일부 있음) |
| 네트워크 오류 | 화면마다 제각각 | 공통 에러 Empty + 재시도 |

#### UX-C — 정보 구조·여정 (중간)

| 장면 | 현상 | 개선 |
|------|------|------|
| 마이 | 이용약관 메뉴 없음 | 개인정보와 나란히 |
| 구독 | 복원·혜택 비교가 약함 | Free vs Pro 한눈에 + 복원 CTA |
| 홈 | 프로젝트 1개만 강조 | OK · Pro 전체보기 이미 있음 |
| 기록→챕터 | 이동 불가 | S-32 (P2) — “내 책에 안 들어감” 불만 가능 |
| 온보딩 알림 | OS 권한 안 뜸 | 나중에 푸시 안 옴 → 불신 |

#### UX-D — 브랜드·첫인상 (중간)

| 장면 | 현상 | 개선 |
|------|------|------|
| 스플래시 | 다크 + 📖 | 유지 가능하나 앱 본편(웜 베이지)과 점프 — 전환 페이드 강화 |
| 로그인 | 카피·비주얼 단순 | serif 헤드라인 + Flat book 아이콘 + surface-alt |
| Paywall | 이미 폴리싱됨 | **기준 컴포넌트**로 삼아 구독 페이지를 맞춤 |

#### UX-E — 접근성·터치 (낮~중)

| 항목 | 현상 | 개선 |
|------|------|------|
| 탭 아이콘 | 라벨 있음 ✅ | 유지 |
| 감정 칩 | 다수 | 선택 상태 contrast 점검 |
| 드래그 핸들 | S-17 | 터치 영역 최소 44px 확인 |
| 포커스 | outline 약한 곳 | 키보드/웹 접근성 |

---

## 5. 개선 계획 (로드맵)

본인 **실연동 E2E(18문서)** 와 병행하되, 코드 개선은 아래 웨이브로.

### Wave U0 — 빠른 품질 패치 (0.5~1일, E2E와 병행 가능)

| # | 작업 | 유형 | 예상 |
|---|------|------|------|
| U0-1 | Email OTP 실패 Toast + sent 가드 | 버그/UX | 소 |
| U0-2 | PDF 실패 Toast | 버그/UX | 소 |
| U0-3 | Splash 0프로젝트 분기 정리 (주석 또는 `/home` Empty 유지 명시) | 버그 | 소 |
| U0-4 | 마이 메뉴에 이용약관 추가 | 기능 소 | 소 |
| U0-5 | `10`/`12` 명세 갭 표를 「구현됨」으로 정정 | 문서 | 소 |

### Wave U1 — 시각 통일 (1~2일) ★ UX 체감 최대

| # | 작업 | 범위 |
|---|------|------|
| U1-1 | `FlatIcon`에 bell, flame, spark(확장), camera, chat, logout 등 추가 | 공통 |
| U1-2 | 홈 헤더·스트릭·알림 버튼 아이콘 교체 | Home |
| U1-3 | 마이 메뉴·Pro 배너 아이콘 교체 | MyPage |
| U1-4 | 로그인/스플래시 브랜드 아이콘·serif 타이틀 | Auth |
| U1-5 | 알림 Empty / 기록 모드 카드 아이콘 | Notifications, RecordMode |
| U1-6 | DESIGN.md 토큰과 Tailwind 매핑 짧은 `docs/refs` 노트 | 문서 |

**성공 기준:** 첫 뷰포트(홈·로그인)에서 이모지 의존도 ↓, TabBar와 동일 stroke 언어.

### Wave U2 — 피드백·신뢰 (1일)

| # | 작업 |
|---|------|
| U2-1 | 공통 `LoadingBlock` / 스켈레톤 (홈·기록·책) |
| U2-2 | 공통 `ErrorState` (재시도 CTA) |
| U2-3 | 저장·출판·발송 중 버튼/토스트 패턴 통일 |
| U2-4 | 구독 페이지: Free vs Pro 비교표 + (추후) 복원 버튼 자리 |

### Wave U3 — 출시 직전 기능 (Billing 등, `16-dev-plan` Wave 2)

| # | 작업 |
|---|------|
| U3-1 | Play Billing 네이티브 + 구독 복원 |
| U3-2 | 로그아웃 FCM 토큰 정리, S-04 권한 요청 |
| U3-3 | (선택) S-32 챕터 이동 — “내 책” 통제감 |

### Wave U4 — 선택 고도화

| # | 작업 |
|---|------|
| U4-1 | expand-caption |
| U4-2 | Capacitor Camera |
| U4-3 | Lottie 시그니처 모션 (기록 완료·스트릭) |
| U4-4 | 온보딩 소개 슬라이드 (MVP 제외였음) |

---

## 6. 권장 실행 순서 (본인 + AI)

```
지금 (본인)
  └─ 18-user-next-steps: Secrets → bypass off → E2E

동시에 / E2E 직후 (Cursor AI)
  └─ Wave U0 패치 (OTP·PDF Toast·약관 메뉴)
  └─ Wave U1 아이콘·로그인 폴리싱  (체감↑)

베타 전
  └─ Wave U2 로딩·에러

스토어 전
  └─ Wave U3 Billing + 복원 + 푸시 권한
```

**원칙:** 실연동 E2E가 깨진 상태에서 U1만 크게 하면 재작업 위험.  
다만 U0(Toast·약관)은 E2E와 무관하게 바로 해도 안전.

---

## 7. 우선순위 한눈에 (제품)

| 순위 | 항목 | 이유 |
|------|------|------|
| 1 | 본인 실연동 E2E | 앱이 “진짜”로 도는지 |
| 2 | U0 에러 피드백 | 신뢰 |
| 3 | U1 아이콘·브랜드 통일 | 첫인상·완성도 |
| 4 | Billing + 복원 | 매출·스토어 |
| 5 | U2 로딩/에러 패턴 | 디테일 |
| 6 | S-32 / expand-caption |  niceties |

---

## 8. 다음 액션 제안

| 역할 | 다음 |
|------|------|
| **본인** | `18-user-next-steps.md` 계속 (Secrets~E2E) |
| **Cursor** | 요청 시 **Wave U0** 즉시 구현 가능 |
| **문서** | E2E 통과 후 `10`/`12` 갭 표 정정 커밋 |

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-23 | 최초 작성 — 명세 vs 코드 재검증, UX 진단, Wave U0~U4 계획 |
| 2026-10-23 | Wave U0·U1 코드 반영 (Toast·약관·FlatIcon 통일) |
| 2026-10-23 | Wave U2 반영 (LoadingBlock·구독 비교·온보딩/완료 폴리싱) |
