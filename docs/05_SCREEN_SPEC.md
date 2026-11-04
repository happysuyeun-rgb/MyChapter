# 05. 화면 명세서 (Screen Specification)

**Status:** Screen Spec v1.2 — Editorial Book Desk  
**Updated:** 2026-11-04  
**역할:** 화면/UX 최종 기준 (PRIMARY UX SoT)  
**상위 정책:** `02_PRODUCT_DECISIONS.md` · `01_PRODUCT_SPEC.md` · `06_FREE_PRO_POLICY.md`  
**IA/플로우:** `03_IA.md` · `04_USER_FLOWS.md` · `docs/redesign/04_IA_AND_SCREEN_MAP.md`  
**디자인:** `10_DESIGN_SYSTEM.md`  
**라우트 근거:** `src/router/index.tsx`

> 라우트 path는 유지한다. v1.2는 Editorial Book Desk 리뉴얼(홈·서재·작업실·탭)과 제품 정책을 화면에 맞게 정리한 것이다.  
> 기존 화면 ID는 재번호하지 않는다.

---

## 0. 공통 원칙

### 0.1 내비게이션

| 구분 | 구성 | 비고 |
|------|------|------|
| TabBar | 홈 `/home` · 서재 `/library` · 마이 `/mypage` | floating pill · 솔리드 아이콘 · 비활성 opacity |
| 스택 | 기록·책만들기·설정·알림 등 | TabBar 밖. 홈/작업실에서 진입 |
| Brand | `BrandMasthead` (CI) | 탭·상세 공통 상단 |

기록하기는 **독립 탭이 아니다.** 활성 책 맥락에서 홈 CTA·모드 선택으로 진입한다.

### 0.2 용어

| 쓰지 말 것 | 쓸 것 |
|------------|--------|
| 일기장 / 다이어리 앱 | 기록 · 원고 · 내 책 |
| 서재 = 도서몰 | 서재 = 내가 만드는 책(프로젝트) |
| 구독하고 무제한 읽기 | Pro 혜택만 실제 정책대로 |

### 0.3 시각 방향 (Editorial Book Desk)

- Ink / Warm Ivory / Sage / Terracotta
- 표지 기본 에셋: `Book_defualt.png` (홈·서재·작업실)
- 진행도는 **Story Readiness만** 사용자-facing 기준으로 사용
- 화면당 primary CTA **1개**

### 0.4 상태 범례

| 표기 | 의미 |
|------|------|
| Implemented | 라우트/UI 존재 |
| Partial | 핵심 UI는 있으나 정책·영속·최종 상태 미완 |
| Target | 설계 확정, 코드 미정렬 |
| Planned | MVP 완료 경로 밖 |
| E2E Pending | 구현 있으나 운영 실데이터 검증 미완 |

### 0.5 공통 상태 매트릭스

API 연동 화면은 다음을 정의한다.

- Loading · Empty · Error+Retry · 소유권 실패 · (구분 가능 시) 네트워크 실패 · Success · Paywall(권한 게이트)

색 변화만으로 상태를 전달하지 않는다.

---

## 1. Entry / Auth

| ID | 화면 | Route | Status | 핵심 동작 |
|----|------|-------|--------|-----------|
| SP-01 | Splash | `/splash` | Implemented | 세션·프로필·온보딩 후 단일 라우팅 체크포인트 |
| A-01 | Login | `/login` | Implemented | Google / Kakao / Email 진입 |
| A-02 | Email Login | `/login/email` | Implemented / E2E PASS | Magic Link |
| A-03 | Nickname | `/onboarding/nickname` | Implemented | 작가명 2~10자 저장 |
| O-01 | Notification Onboarding | `/onboarding/notification` | Implemented | 알림 선호 저장 후 온보딩 완료 |

### 최종 규칙

- OAuth·Email 콜백 → `/splash`
- Splash가 세션/프로필/온보딩 상태로 분기
- O-01은 프로필 영속 성공 후에만 진행
- 온보딩 완료 후 **홈을 거치지 않고** `/project/new`로 이동 (`04_USER_FLOWS`)
- 로그인 화면의 약관·개인정보는 **비로그인 열람 가능**

---

## 2. Home (`/home`)

홈은 Desk다. 질문: **오늘 내가 뭘 해야 하지?**

### 2.1 레이아웃 (v1.2 현행)

1. **헤더** — CI + 알림 (`BrandMasthead`), `surface-alt` 배경, 세로 약 60px  
2. **히어로 배너** — 인사(`안녕하세요, {닉네임}님`) · 헤드라인 · 서브카피 · 우측 `jandi` 캐릭터  
3. **구분선** — 히어로와 책 영역 분리  
4. **책 표지 블록** — `Book_defualt` 중앙 · 표지 위 뱃지(진행중/발행가능/발행완료) + 제목 · 탭 → `/library`  
5. **준비도 게이지** — 표지 아래, 가로 약 50%, 점수 숫자 compact  
6. **Primary CTA** — 미발행: `오늘 한 페이지 쓰기` → `/library` / 발행됨: `발행한 책 보기` → `/publication/:id` (아웃라인 버튼)  
7. **기록 단축 카드 2열** — `AI 질문으로 기록` → `/record/write/question` · `자유롭게 기록` → `/record/write/free`  
8. **최근 기록** — 최신 1건 · 좌측 폴라로이드 슬롯(에셋 대기) · `전체 보기` → `/records` · 행 탭 → `/records/:id`  
9. **PAGE 노트** — 캐릭터(`page_c`) + 상태별 한 줄 문구 (라벨 PAGE'S NOTE 없음)

### H-01 · Empty Home

**Status:** Implemented  

- 프로젝트 0개  
- EmptyState: 첫 책 만들기 → `/project/new`

### H-02 · In-progress Home

**Status:** Implemented  

- 활성 책 표지 + Readiness  
- CTA: 오늘 한 페이지 쓰기 / 기록 단축  
- 알림 진입

### H-03 · Ready Home

**Status:** Implemented  

- 뱃지 `발행가능`  
- 기록 계속 가능 · 작업실/책만들기는 서재·작업실에서 진입

### H-04 · Published Home

**Status:** Implemented  

- 표지 위 `발행완료` · 버전/발행일 표시 (`title_snapshot` 우선)  
- Primary: 발행본 보기 → `/publication/:id`  
- Secondary: 책 작업실 열기 → `/project/workspace`  
- 발행 완료 시 기록 단축 카드는 숨김  
- Free 재발행은 G-01 · Pro는 Final Review 경로

### H-05 · Publishing Home

**Status:** Deprecated  

- 독립 발행 중 화면 없음. U-01/U-04/U-06 상태로 처리

---

## 3. Library — 서재 (`/library`)

질문: **내 책들이 어디까지 왔지?**

| ID | 화면 | Route | Status |
|----|------|-------|--------|
| L-01 | 전체 | `/library` | Implemented |
| L-02 | 진행중 | `/library` (필터) | Implemented |
| L-03 | 발행가능 | `/library` (필터) | Implemented |
| L-04 | 발행완료 | `/library` (필터) | Implemented |
| L-05 | 권한/Pro 제한 | G-01 | Implemented |
| L-06 | 보관함 | `/library/archived` | Implemented |

### 레이아웃

- 헤더: CI · `+ 새 책`  
- 필터 칩: 전체 / 진행중 / 발행가능 / 발행완료 (풀블리드)  
- 행: `Book_defualt` 표지(제목 오버레이) + 상태 · 제목 · Story Readiness % · 기록 수  
- 활성 책 `NOW` 뱃지  
- 하단: `선반에 빈 책 추가` → 생성 플로우 / Free 제한 시 G-01  
- 하단: `보관함 · N권 →` (보관 ≥1일 때만) → L-06  
- 활성 책 0 · 보관 ≥1: `서재가 잠시 비어 있어요` 빈 상태 + `보관함 열기` (생성 CTA 아님)  
- `/projects` → `/library` 리다이렉트

책 상태 SoT: **publications + Readiness** (`projects.is_completed`만으로 판단하지 않음).

### L-06 · 보관함

설계: `29-design-shelf-workspace-toc-ai-edit.md` D1  

- AppLayout 하위(탭바 유지) · `←` 서재 · eyebrow `ARCHIVE` · H1 `보관함`  
- Free 안내: `보관한 책도 Free 1권에 포함돼요. 새 책을 만들려면 보관한 책을 삭제하거나 Pro로 전환하세요.`  
- 행: 작은 표지 · `보관 YYYY.MM.DD` · 제목 · 유형 · 기록 수 · `서재로 꺼내기`(sage) · `영구 삭제`(terracotta, `책 삭제` 입력 Modal)  
- 꺼내기는 확인 없이 즉시 · 활성 책은 바꾸지 않음  
- 빈 상태: `보관한 책이 없어요` · `서재로 돌아가기`

---

## 4. Project — 책 만들기 / 작업실

| ID | 화면 | Route | Status |
|----|------|-------|--------|
| P-01 | New Book Entry | `/project/new` | Implemented |
| P-02 | Book Type | `/project/new` | Implemented |
| P-03 | Basic Info | `/project/new/setup` | Implemented |
| P-04 | AI Title | — | Not MVP |
| P-05 | Created | `/project/new/complete` | Implemented |
| P-06 | Book Workspace | `/project/workspace` | Implemented |
| P-07 | Book Settings | `/project/settings` | Implemented |

### P-02 · 유형 (9)

나의 성장 · 나의 이야기 · 일과 커리어 · 가족과 육아 · 사랑과 관계 · 여행과 모험 · 취미와 일상 · 배움과 도전 · 자유 기록  

유형은 AI 질문·Readiness·챕터 방향에 영향. 기록 주제를 강제하지 않음.

### P-03 · 필드

- 책 제목 1~50자  
- Story Readiness 안내 (기간+건수 경쟁 UI 금지)  
- 기록 모드는 **프로젝트에 고정하지 않음** (매 기록 시 선택)

### P-06 · 책 작업실

**Status:** Implemented (NEXT STEP 2026-11-04)  

헤더: CI · 뒤로(서재) · 책 설정 · `Book_defualt` 표지 + 제목 · 유형·기록 수  

스테이지(시각 스테퍼 + 섹션):

1. 기록 → `/record/mode`  
2. 챕터 → `/book`  
3. 원고 → `/book/manuscript`  
4. 표지 → `/book/cover`  
5. 최종 검수 → `/book/review`  
6. 발행  

잠금: readiness / entitlement / `BookStageGuard` 기존 로직 유지.  
마일스톤: `manuscript_reviewed_at` · `final_review_completed_at` 영속 (완료 단계 설명에 `MM.DD … 완료` 표시).

**NEXT STEP 블록** (설계 D2 · 화면 유일한 Primary)

| 상태 | Primary | Secondary |
|------|---------|-----------|
| 준비도 미충족 | `+ 오늘 기록하기` | — |
| 챕터 0 | `챕터 만들기` → `/book` | `+ 오늘 기록하기` 텍스트 |
| 원고 미확인 | `원고 확인하기` | 동일 |
| 표지 미선택 | `표지 고르기` | 동일 |
| 검수 미완료 | `최종 검수하기` | 동일 |
| 검수 완료 · 미발행 | `발행하러 가기` | 동일 |
| 발행됨 | `발행본 보기` → `/publication/:id` | 동일 |

다음 단계 = PRODUCTION 목록의 첫 `ready && !done` 단계. 원고 단계는 챕터 ≥1이면 `확인 필요`(active).

### P-07 · 책 설정

Implemented: 제목·유형·readiness 스냅샷 · `ready_at` sticky · **서재 보관(`archived_at`)** · **책 영구 삭제(확인 문구 `책 삭제`)**  
선택적 책별 고급 설정은 후속.

---

## 5. Records — 기록

| ID | 화면 | Route | Status |
|----|------|-------|--------|
| R-01 | Record List | `/records` | Implemented |
| R-02 | Mode Select | `/record/mode` | Implemented |
| R-03 | AI Question | `/record/write/question` | Implemented / E2E Pending |
| R-04 | Free | `/record/write/free` | Implemented |
| R-04P | Photo | `/record/write/photo` | Implemented / E2E Pending |
| R-05 | Complete | `/record/complete` | Implemented |
| R-06 | AI Edit Result | — | Planned · Designed (29 D4) |
| R-07 | Detail | `/records/:id` | Implemented |
| R-08 | Edit | `/records/:id/edit` | Implemented |
| R-09 | Delete/Exit Confirm | modal | Implemented |
| R-10 | AI Edit Quota | policy / G-01 | Planned · Free 월 3회 확정 (PD-017) |

### R-02 · 모드 선택

- PAGE에게 질문 받기 · 빈 페이지에서 시작하기 · 한 장면으로 남기기  
- 홈에서 AI/자유 단축은 R-03/R-04로 직행 가능

### R-03

- AI 질문 + 답변 + 감정 태그  
- 본문 10~2000자 · 드래프트 복원  
- AI_LIMIT → G-01 가능, **fallback 질문으로 기록 계속 가능**

### R-04

- 선택 제목 · 선택 AI 힌트 · 본문 10~5000자  
- 빈 제목 → 날짜 기반 폴백  
- 제목 최대 길이: 미확정(오픈)

### R-04P

- 사진 필수 · 캡션 1~100자 · 감정 태그  
- 파일 크기/해상도 정책: 런치 전 확정 필요

### R-05

- 저장 페이지 번호 · Readiness · 스트릭/뱃지  
- Ready 시 작업실 CTA

### 공통

- 미저장 이탈: 계속 / 임시저장 / 버리기  
- `analyze-record`는 저장 후 비동기 · 분석 실패가 원본 저장을 실패시키지 않음  
- **원본 Record는 챕터 생성으로 덮어쓰지 않음** (`09_AI_POLICY`)

---

## 6. Book Making — 원고 / 표지

| ID | 화면 | Route | Status |
|----|------|-------|--------|
| B-01 | Chapter Start | `/book` | Implemented |
| B-02 | Chapter Desk/List | `/book` | Implemented |
| B-03 | Generate State | `/book` | Implemented / E2E Pending |
| B-04A | Chapter Preview | `/book/chapter/:id` | Implemented |
| B-04 | Chapter Edit | `/book/chapter/:id/edit` | Implemented |
| B-05 | Manuscript Review | `/book/manuscript` | Implemented |
| B-06 | Manuscript Edit | chapter edit 경유 | Partial |
| B-07 | Free Cover | `/book/cover` | Implemented |
| B-08 | Pro / AI Cover | `/book/cover` | Partial |
| B-09 | TOC | Final Review 내장 | Implemented |

### 규칙

- `/book` 진입에 Ready 필요  
- `chapter_records`가 Chapter↔Record SoT  
- B-03: 미배정 기록 충분(현재 임계 3)  
- 재생성은 원본 Record를 읽기만 하고 변형하지 않음  
- 원고는 Chapter 콘텐츠 워크플로 (별도 manuscript body 테이블 아님)  
- B-07: `selected_cover_id` 영속 · AI 생성 표지는 post-MVP  
- TOC 전용 라우트 없음 → U-01에 포함

---

## 7. Publication — 발행

| ID | 화면/상태 | Route | Status |
|----|-----------|-------|--------|
| U-01 | Final Review | `/book/review` | Implemented |
| U-02 | Preview | U-01 내장 | Final |
| U-03 | Publish Confirm | U-01 CTA | Final |
| U-04 | Publishing | U-01 상태 | Implemented |
| U-05A | Publish Complete | `/book/publish/complete` | Implemented |
| U-05B | Publication Viewer | `/publication/:id` | Implemented / E2E Pending |
| U-06 | Failed | U-01 상태 | Implemented |
| U-07 | Free 발행 한도 | G-01 | Implemented / E2E Pending |

### U-01 필수 체크

표지 · TOC · 원고 — 충족 시에만 발행 CTA 활성

### U-01 · B-09 목차 (설계 D3)

- 섹션: COVER → CONTENTS → CHECKLIST → 플랜 노트 → 진행/실패 상태  
- 목차 행: `01` · 제목 · `기록 N개 · 약 N자` / 빈 본문은 terracotta `원고가 비어 있어요` → 챕터 편집  
- `목차 순서 바꾸기 →` → `/book` (재정렬은 B-02에서)  
- 빈 챕터 ≥1이면 `원고 최종 확인` 체크 비활성  
- **Primary 1개**: 검수 미저장 `최종 검수 완료 저장` / 저장됨 `이 책 발행하기`(Free 소진 시 `Pro로 계속 발행하기`) · 저장됨 상태에서 `검수 다시 하기` 텍스트

### U-04 단계

표지 → TOC → 본문 → PDF (독립 publishing 라우트 없음)

### 정책

- Free: 첫 발행 1권 · 재발행은 Pro  
- 실패 재시도는 가능하면 동일 version 재사용  
- entitlement는 서버+클라이언트 모두 강제

---

## 8. My / Settings / Global

| ID | 화면 | Route | Status |
|----|------|-------|--------|
| M-01 | My | `/mypage` | Implemented |
| M-02 | Subscription | `/mypage/subscription` | Implemented |
| M-03 | AI Usage | `/mypage/ai-usage` | Implemented |
| M-04 | Publication History | `/mypage/completed-books` | Implemented |
| M-05 | Notifications | `/notifications` | Implemented |
| M-06 | Settings | `/mypage/settings` | Implemented |
| M-07 | Privacy | `/mypage/privacy-policy` | Implemented (공개) |
| M-08 | Terms | `/mypage/terms-of-service` | Implemented (공개) |
| M-09 | Delete Account | `/mypage/delete-account` | Implemented / E2E Pending |
| G-01 | Paywall Modal | global | Implemented |

### M-01

닉네임·이메일 · FREE/PRO · 기록/챕터/완성 책 통계 · 스트릭 · Pro 업셀 · 메뉴(완성책·설정·AI 사용량·구독·개인정보) · 로그아웃

### M-03

- 이번 달 AI 질문·글감 힌트 사용량 (`ai_usage`)  
- Free 월 10회 한도 표시 · Pro는 확장 사용 안내  
- 한도 초과 시에도 fallback 기록 가능 문구  
- Free → Paywall / Pro → 구독 관리 링크

### M-02 / G-01

- Pro 월 5,900원 라벨  
- 여러 권 · 재발행 · 확장 AI · Pro 표지 · 첫 책 Free 메시지  
- 웹 결제 불가 시: 모바일 앱에서 결제해주세요

### M-06

기록 알림 ON/OFF · 알림 시각 · **닉네임 변경** · 프로필 이모지 · 플랜 · 약관 · 버전 · 로그아웃 · 탈퇴  
영속 실패 시 로컬 피드백 필수

### M-09

영향 안내 · 확인 문구 `계정 삭제` 정확 일치 · Auth/DB/Storage 정리 E2E 필요

---

## 9. 입력 검증

| 입력 | 규칙 | 오픈 이슈 |
|------|------|-----------|
| 닉네임 | 2~10자, 한글·영문·숫자 | 공백 불가 |
| 책 제목 | 1~50자 | 금칙어 정책 없음 |
| AI 질문 기록 | 10~2000자 | — |
| 자유 기록 | 10~5000자 | 제목 max 미확정 |
| 사진 기록 | 사진 + 캡션 1~100자 | 파일 크기/해상도 |
| 계정 삭제 | `계정 삭제` 정확 일치 | — |
| 챕터 제목/본문 | 구현 max 미통일 | 런치 리뷰 |

---

## 10. Direct URL / Guard

1. `/project/*` — Auth + 온보딩 완료  
2. `/record/*` — Auth + 온보딩 + 활성 책  
3. `/records/:id*` — Record 소유권  
4. `/book` — 활성 책 + Ready  
5. `/book/chapter/:id*` — Ready + Chapter 소유권  
6. `/book/manuscript` — Chapter ≥ 1  
7. `/book/cover` — Ready + Chapter ≥ 1  
8. `/book/review` — Ready + Chapter + 영속된 Cover  
9. `/book/publish/complete` — 유효 publishResult (직접 진입 거부)  
10. `/publication/:id` — Publication 소유권  
11. `/mypage/privacy-policy`, `/mypage/terms-of-service` — 공개  

구현 차이: `SCREEN_IMPLEMENTATION_GAP.md`

---

## 11. 접근성 / 반응형

- 기준 폭: 320 / 375 / 414 / 768  
- 가로 오버플로 금지 · 터치 타깃 ≈ 44px+  
- 아이콘-only 컨트롤에 accessible name  
- 키보드 포커스 가시 · Modal/BottomSheet Escape  
- 상태를 색만으로 전달하지 않음  
- 긴 제목 wrap/truncate  
- 하단 고정 액션: safe-area  
- `prefers-reduced-motion` 존중

---

## 12. 런치 QA Exit Criteria

- 게스트가 Login에서 약관·개인정보 열람  
- O-01 영속 실패 시 온보딩 진행 금지  
- 미완료 온보딩 deep-link 차단  
- Home/Library/Workspace 발행 상태가 publications SoT와 일치  
- Published Home이 최신 발행본을 열고 Workspace로 복귀  
- 드래프트 복원 · 사진 업로드/삭제 · analyze-record 실패 격리  
- Ready 게이트 · chapter_records · 생성/재생성 · 재정렬 실패 복구  
- manuscript/final review 마일스톤 새로고침 후 유지  
- Free v1 · Pro v2 · 실패 재시도 · signed URL 뷰어  
- 교차 계정 Record/Chapter/Publication 차단  
- 계정 삭제 시 Auth/DB/사진/PDF 정리  
- 320/375/414/768 · Empty/Error/Loading 깨짐 없음

---

## 13. v1.2 변경 요약 (vs v1.1)

| 영역 | 변경 |
|------|------|
| 홈 | 히어로 배너 · 중앙 `Book_defualt` · 기록 단축 2카드 · 최근 기록 · PAGE 라벨 제거 |
| 서재/작업실 | 동일 기본 표지 에셋 · 제목 오버레이 |
| TabBar | floating pill · 솔리드+opacity |
| CTA | 홈 primary 아웃라인 · 서재 진입/발행본 보기 분기 |
| P-07 / M-03 / H-04 | 책 보관·삭제 · AI 사용량 · 발행 홈 secondary CTA |
| path | 유지 (IA 라벨·카피·레이아웃만 갱신) · `/mypage/ai-usage` 추가 |

> 아직 Planned: **P-04** AI 제목, **R-06** AI 편집 결과, **R-10** AI 편집 한도 전용, **B-08** AI 생성 표지(post-MVP).  
> 2026-11-04 설계 추가: L-06 보관함 · P-06 NEXT STEP · B-09 목차 · R-06/R-10 플로우 → `29-design-shelf-workspace-toc-ai-edit.md`

문서 충돌 시: `02_PRODUCT_DECISIONS` > `01_PRODUCT_SPEC` > **본 문서** > 디자인 시스템.
