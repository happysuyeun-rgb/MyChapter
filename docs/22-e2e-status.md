# MyChapter — 실연동 E2E 현황

> **최종 갱신:** 2026-10-24  
> **운영 URL:** https://my-chapter.vercel.app  
> **로그인 LIVE 기준 커밋:** `7ab565a6`  
> **저장소 tip (문서 갱신 시점):** `2d38c10` (`ci.yml` 포함)  
> **관련:** `16_QA_E2E.md`, `17-test-report.md`, `18-user-next-steps.md`, `15-launch-roadmap.md`

---

## 1. 판정 규칙

| 라벨 | 의미 |
|------|------|
| **PASS — LIVE** | 실계정·운영(또는 동등) 환경에서 관찰됨 |
| **PASS — BUILD** | `npm run build` / vitest 등만 통과 (기능 E2E 아님) |
| **PENDING** | 실계정 검증 전 — PASS 금지 |
| **미완료 설정** | 코드는 있으나 Provider·SMTP·OAuth 등 외부 설정 미완 |

실계정 테스트를 수행하지 않았다면 **PASS 판정 금지**.

---

## 2. 운영 로그인 E2E (2026-10-24) — 7/7 PASS — LIVE

Work를 통한 운영 검증. Supabase 요청 29건에서 4xx·5xx 없음.

| # | 항목 | 결과 |
|---|------|------|
| 1 | Vercel Production 배포 정상 (`7ab565a6`) | PASS — LIVE |
| 2 | Supabase 공개키 정상 반영 | PASS — LIVE |
| 3 | 이메일 Magic Link 발송 성공 | PASS — LIVE |
| 4 | 실제 이메일 로그인 성공 | PASS — LIVE |
| 5 | 로그인 후 마이페이지 진입 | PASS — LIVE |
| 6 | 새로고침 후 로그인 유지 | PASS — LIVE |
| 7 | 로그아웃 및 보호 화면 접근 차단 | PASS — LIVE |

**해결로 기록:** 기존 운영 인증·공개키·세션 유지 문제는 위 기준으로 해소.

**여전히 미완료:**

| 항목 | 상태 |
|------|------|
| 일반 사용자 대상 SMTP(커스텀) 발송 | 미완료 설정 |
| Google OAuth | 미완료 설정 |
| Kakao OAuth | 미완료 설정 |

---

## 3. 저장 정합성 · CI (BUILD — LIVE 아님)

| 항목 | 결과 | 근거 |
|------|------|------|
| 요청 ID 충돌 시 자동 중복 생성 금지 | PASS — BUILD | `7ab565a` — 기존 열기 / 새 기록 명시 선택 |
| vitest 회귀 (로컬/`npm test`) | PASS — BUILD | **18건** — 저장 정책 단위 테스트 |
| GitHub Actions CI (`ci.yml`) | PASS — BUILD | tip `2d38c10` push — `npm ci` + `npm test` + `npm run build` · [run 40083741371](https://github.com/happysuyeun-rgb/MyChapter/actions/runs/40083741371) |
| `npm run build` (CI job) | PASS — BUILD | Node 22 · placeholder `VITE_*` |

**구분:** vitest 18건 = 저장 정합 회귀. CI = 동일 테스트 + 의존성 잠금(`npm ci`) + 프로덕션 빌드.  
실계정 책·기록 E2E와는 **별개**. BUILD PASS ≠ LIVE PASS.

---

## 4. Work 다음 검증 (PENDING — 결과 대기)

운영에서 수행할 예정. Cursor는 결과 전까지 추측 리팩터링하지 않음.

| # | 시나리오 | 상태 |
|---|----------|------|
| 1 | 첫 책 생성 | PENDING |
| 2 | 자유 기록 저장 | PENDING |
| 3 | 질문 기록 저장 | PENDING |
| 4 | 사진 기록 저장 | PENDING |
| 5 | 새로고침 후 데이터 유지 | PENDING |
| 6 | 기록 ID·PAGE 번호 정합성 | PENDING |

### 코드 준비 상태 (리뷰만, LIVE 미실시)

| 영역 | 준비 | 비고 |
|------|------|------|
| 책 생성 | 오류 문구·중복 클릭 가드 | Free 한도 DB 메시지 매핑 있음 |
| 자유/질문/사진 저장 | `useRecordCreateSave` + `SaveConflictModal` | 충돌 시 자동 INSERT 없음 |
| 조회 실패 | `RecordLookupError` → 복구 가능 오류 | 자동 새 기록 금지 |
| PAGE 번호 | 작성 중 「예상」, 완료 화면은 서버 `record_number` | migration 024 전제 |
| 사진 재시도 | 업로드 path session 복원 | LIVE 미검증 |

---

## 5. 아직 LIVE 미완료인 핵심 E2E

| 영역 | 상태 |
|------|------|
| 실계정 책 생성·기록 저장 (위 §4) | PENDING |
| AI 챕터 생성 | PENDING |
| PDF 발행 | PENDING |
| Google / Kakao 로그인 | 미완료 설정 + PENDING |
| 계정 삭제·Storage 정리 | PENDING |
| Play Billing 실결제 | 코드 갭 + PENDING |

---

## 6. 출시 차단 vs 선택

### 차단 (웹 MVP / 실사용 공개 전)

1. **책 생성 → 3모드 기록 저장 → 새로고침 유지 → PAGE 정합** (§4) — Work LIVE 대기
2. **AI 챕터·PDF 발행 LIVE** (필수 Secret 이름: `GOOGLE_AI_API_KEY`, `SERVICE_ROLE_KEY`)
3. **운영에서 결제 우회 OFF** — `BILLING_DEV_BYPASS`≠true, `VITE_BILLING_DEV_MODE=false` (값 출력·변경은 승인 필요)

### 채널·플랫폼 선택 (이메일 웹만이면 당장 비차단)

| 항목 | 비고 |
|------|------|
| Google / Kakao OAuth | 버튼 제공 시에만 필수 |
| 일반 사용자 SMTP/커스텀 도메인 | 규모·전달률 이슈 시 |
| Play Billing 네이티브 | Android 유료화 시 |
| Firebase FCM | 푸시 베타 시 |

인증 **이메일 Magic Link**는 §2 기준으로 **차단 목록에서 제외**.

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-24 | 운영 로그인 7/7 PASS 반영, Work 다음 검증·차단 이슈 정리 |
| 2026-10-24 | CI run 구분·차단/선택 분리·billing bypass 운영 금지 |
