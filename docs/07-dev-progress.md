# MyChapter — 개발 진행 현황 (AI 구현 기준)

> **작성 기준:** Cursor AI가 코드베이스에 구현한 내용  
> **최종 갱신:** 2026-06-12  
> **본인이 할 일:** `docs/06-user-tasks.md`

---

## 상태 범례

| 표시 | 의미 |
|------|------|
| ✅ 완료 | 코드 반영 + `npm run build` 성공 |
| 🔄 진행해야 함 | 코드는 있으나 **배포·연동·설정**이 필요 (본인 또는 Supabase 작업) |
| ❌ 미완 | MVP 설계에 있으나 **아직 구현되지 않음** |

---

## Phase 0 — 프로젝트 기반

| 항목 | 상태 | 비고 |
|------|------|------|
| Vite + React + TypeScript + Tailwind | ✅ | |
| React Router, Zustand | ✅ | |
| 공통 컴포넌트 10종 | ✅ | Button, Card, Modal 등 |
| AppLayout + TabBar + Guards | ✅ | |
| `src/lib/supabase.ts`, `database.ts` | ✅ | |
| 마이그레이션 SQL 001~005 | ✅ | **Supabase에 적용은 본인** → `09-supabase-setup.md` |
| `npm run build` | ✅ | |

---

## Phase 1 — 인증·온보딩

| 화면/기능 | ID | 상태 | 비고 |
|-----------|-----|------|------|
| 스플래시 분기 | S-01 | ✅ | |
| 로그인 (Kakao/Google/이메일) | S-02, S-02e | ✅ | OAuth **Supabase 설정 필요** 🔄 |
| 닉네임 | S-03 | ✅ | |
| 알림 권한 | S-04 | ✅ | |
| 마이페이지 | S-23 | ✅ | Phase 5에서 통계 추가 |
| 설정 | S-24 | ✅ | |
| 계정 삭제 | S-W1 | ✅ | Edge Function 배포 🔄 |
| 약관 WebView | S-W2, S-W3 | ✅ | `public/legal/*.html` |
| `authStore.ts` | — | ✅ | |

---

## Phase 2 — 프로젝트 생성

| 화면/기능 | ID | 상태 | 비고 |
|-----------|-----|------|------|
| 프로젝트 유형 | S-05 | ✅ | |
| 설정 (제목·기간) | S-06 | ✅ | |
| 기록 모드 선택 | S-07 | ✅ | |
| 생성 완료 + 첫 AI 질문 | S-08 | ✅ | |
| `generate-question` Edge Function | — | ✅ | 배포 🔄 |
| Free 프로젝트 1개 제한 | — | ✅ | S-P1 연동 |
| `calculateRoutine()` | — | ✅ | |

---

## Phase 3 — 홈·기록

| 화면/기능 | ID | 상태 | 비고 |
|-----------|-----|------|------|
| Empty State | S-09 | ✅ | |
| 홈 (진행률·스트릭·질문) | S-10 | ✅ | |
| 알림 목록 | S-11 | ✅ | |
| 모드 선택 | S-12 | ✅ | |
| 질문 모드 + draft | S-13 | ✅ | |
| 사진 모드 + Storage | S-14 | ✅ | `<input file>` 방식 |
| 자유 일기 + hint | S-15 | ✅ | |
| 저장 완료 + 배지 | S-16 | ✅ | |
| 기록 목록 | S-30 | ✅ | |
| 기록 상세 + 바텀시트 | S-31, S-32 | ✅ | |
| 기록 수정 | — | ✅ | |
| `generate-freewriting-hint` | — | ✅ | 배포 🔄 |
| 스트릭·배지 유틸 | — | ✅ | |
| 기록 10개 → 챕터 생성 트리거 | — | ✅ | `records.ts` finalizeSave |

---

## Phase 4 — 내 책

| 화면/기능 | ID | 상태 | 비고 |
|-----------|-----|------|------|
| 챕터 구성 | S-17 | ✅ | 드래그 재정렬 ❌ |
| 원고 미리보기 | S-18 | ✅ | |
| 원고 편집 + AI 재생성 | S-19 | ✅ | |
| 표지 선택 | S-20 | ✅ | |
| 출판 완료 | S-21 | ✅ | |
| `generate-chapter` | — | ✅ | 배포 🔄 |
| `regenerate-chapter` | — | ✅ | 배포 🔄 |
| PDF 출판 (Pro) | — | 🔄 | **HTML 다운로드**로 대체, 서버 PDF ❌ |
| `generate-pdf` Edge Function | — | ❌ | 설계만 존재 |
| 챕터 드래그 재정렬 (S-17) | — | ❌ | |
| 기록 챕터 이동 (S-32) | — | ❌ | |

---

## Phase 5 — 마이·결제

| 화면/기능 | ID | 상태 | 비고 |
|-----------|-----|------|------|
| 마이페이지 통계 | S-23 | ✅ | |
| 설정 (알림·닉네임·이모지) | S-24 | ✅ | |
| Paywall + pendingAction | S-P1 | ✅ | |
| `verify-subscription` | — | ✅ | 배포 + Play API 🔄 |
| Play Billing 네이티브 | — | 🔄 | **개발 모드**만 (`dev_` 토큰) |
| 완성한 책 목록 | — | ✅ | |
| 구독 관리 | — | ✅ | |
| `delete-account` | — | ✅ | 배포 🔄 |

---

## Phase 6 — Android·푸시·배포

| 항목 | 상태 | 비고 |
|------|------|------|
| Capacitor Android 프로젝트 | ✅ | `android/` |
| Manifest 권한·딥링크 | ✅ | |
| FCM + `device_tokens` 클라이언트 | ✅ | `google-services.json` 본인 🔄 |
| `send-daily-reminder` | ✅ | 배포 + Cron 🔄 |
| 딥링크·OAuth 콜백 | ✅ | |
| `vercel.json` | ✅ | Vercel 배포 본인 🔄 |
| Play 스토어 설명 초안 | ✅ | `store/play-store-listing.ko.txt` |
| Play Console 업로드 | 🔄 | 본인 + 빌드 도움 |
| 실제 FCM 푸시 E2E 테스트 | 🔄 | Firebase 설정 후 |

---

## Edge Functions 요약

| Function | 코드 | 배포 | 상태 |
|----------|------|------|------|
| `generate-question` | ✅ | 🔄 | |
| `generate-freewriting-hint` | ✅ | 🔄 | |
| `generate-chapter` | ✅ | 🔄 | |
| `regenerate-chapter` | ✅ | 🔄 | |
| `verify-subscription` | ✅ | 🔄 | |
| `delete-account` | ✅ | 🔄 | |
| `send-daily-reminder` | ✅ | 🔄 | |
| `generate-pdf` | ❌ | — | 미구현 |
| `expand-caption` | ❌ | — | 미구현 |

---

## 화면 placeholder (미구현)

| 화면 | ID | 상태 |
|------|-----|------|
| 프로젝트 목록 (Pro) | S-10b | ❌ placeholder |
| 실물책 POD | S-22 | ❌ MVP 제외 |

---

## 🔄 진행해야 하는 것 (코드 OK → 연동 필요)

AI가 코드를 작성했지만 **본인 Supabase/외부 설정**이 필요한 항목:

1. **Supabase 마이그레이션 001~004 SQL 실행**
2. **Edge Function 7개 배포** + Secrets 등록
3. **`.env.local` / Vercel 환경 변수**
4. **Kakao / Google OAuth** Redirect URL
5. **Anthropic API Key**
6. **Firebase** + `google-services.json` + Cron
7. **Play Billing** 실결제 (현재 dev 모드)
8. **Vercel 프로덕션 배포**
9. **Android AAB 빌드** + Play Console

---

## ❌ 미완 (추후 개발)

| 항목 | 우선순위 | 설명 |
|------|----------|------|
| `generate-pdf` 서버 PDF | P1 | 현재 HTML 다운로드 |
| Play Billing 네이티브 브릿지 | P1 | `MyChapterBilling` Android 플러그인 |
| S-10b 프로젝트 목록 | P2 | Pro 다중 프로젝트 |
| S-17 챕터 드래그 재정렬 | P2 | |
| S-32 기록→챕터 이동 | P2 | |
| `expand-caption` | P3 | 사진 캡션 AI 확장 |
| S-22 실물책 POD | P3 | |
| 온보딩 소개 슬라이드 | P3 | |
| Capacitor Camera 플러그인 | P3 | 현재 HTML file input |
| TWA 전환 | P3 | Capacitor 대체 패키징 |

---

## 저장소 구조 (구현 완료 기준)

```
src/
├── pages/
│   ├── auth/          ✅
│   ├── onboarding/    ✅
│   ├── project/       ✅
│   ├── home/          ✅
│   ├── record/        ✅
│   ├── book/          ✅
│   ├── mypage/        ✅
│   └── notifications/ ✅
├── lib/api/           ✅ 9 modules
├── stores/            ✅ auth, project, record, book, paywall, subscription
supabase/
├── migrations/        ✅ 001~005
└── functions/         ✅ 7 functions (+ _shared)
android/               ✅ Capacitor
public/legal/          ✅ privacy, terms
```

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| `06-user-tasks.md` | **본인**이 할 일 |
| `08-development-specification.md` | 개발명세서 |
| `09-supabase-setup.md` | Supabase + 마이그레이션 상세 |
| `00`~`05` | 설계·스키마·API·비즈니스 규칙 |
