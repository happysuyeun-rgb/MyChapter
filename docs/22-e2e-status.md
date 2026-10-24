# MyChapter — 실연동 E2E 현황

> **최종 갱신:** 2026-10-24  
> **운영 URL:** https://my-chapter.vercel.app  
> **로그인 LIVE 기준 커밋:** `7ab565a6`  
> **최신 코드 참고:** `022d998` (AI_UNAVAILABLE 수정 커밋, 별도 LIVE 검증 필요); 기록 기능 LIVE 검증 시점의 코드 기준선은 `7ab565a` 이후 문서 변경  
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

## 4. Work 운영 책·기록 E2E (2026-10-24 18:17~18:59 KST) — 17 PASS / 3 미검증

**근거:** 사용자가 전달한 Work 실제 운영 브라우저·Supabase 요청·DB 점검 결과. 원본 JSON/스크린샷은 GitHub에 업로드되지 않았으며, 본 섹션의 LIVE는 Work 수행 결과 보고 기준임.

| # | 시나리오 | 판정 |
|---|----------|------|
| 1 | 테스트 계정 로그인 및 기존 데이터 확인 | PASS — LIVE |
| 2 | 첫 책 생성 (projects POST 201) | PASS — LIVE |
| 3 | 책 새로고침 후 유지 | PASS — LIVE |
| 4 | 자유 기록 저장 (PAGE 01) | PASS — LIVE |
| 5 | 질문 기록 저장 (PAGE 02) | PASS — LIVE |
| 6 | 사진 PNG 저장·원격 이미지 재조회 (PAGE 03) | PASS — LIVE |
| 7 | 저장 데이터 새로고침 후 유지 | PASS — LIVE |
| 8 | ID 고유·PAGE 1~4 연속 | PASS — LIVE |
| 9 | 입력 본문과 DB 문자열 완전 일치 | PASS — LIVE |
| 10 | 질문·사진 기록 혼입 방지 | PASS — LIVE |
| 11 | 모드별 초안 분리·복원 | PASS — LIVE |
| 12 | 복원 초안 저장 (PAGE 04), draft 0건 | PASS — LIVE |
| 13 | 일반 더블클릭 후 1건 저장 | PASS — LIVE |
| 14 | 빈 입력 방지 | PASS — LIVE |
| 15 | 기록 글자 수 경계 제한 | PASS — LIVE |
| 16 | 목록·상세 이동 및 복귀 | PASS — LIVE |
| 17 | 운영 인증 확인 | PASS — LIVE |
| 18 | AI 챕터·PDF 발행 | 미검증 — 제작 준비도 미충족 |
| 19 | 강제 네트워크 단절·DB 장애 복구 | 미검증 — 운영 테스트 제외 |
| 20 | 대규모 동시 저장·다중 기기 | 미검증 — 운영 테스트 제외 |

**실제 생성·보존 데이터:** 식별자 `MC-E2E-20261024`, 프로젝트 `70d38c44-fc0f-4ef5-b191-fd2605947e4f`, 책 1권, 기록 4건(PAGE 01~04), 사진 Storage 객체 1개, 최종 초안 0건. 일반 더블클릭 후 중복 생성 없음. 조회 구간 Supabase 207요청에서 4xx·5xx 0건 (후속 요청 전체를 뜻하지 않음). 계정은 Work 종료 시 로그인 상태.

**한계:** 모호한 저장 응답·강제 단절·멀티탭 대량 동시성·타 계정 접근은 별도 테스트 필요. 합성 사진 업로드 관련 25분 도구 지연은 실제 서비스 속도 측정으로 해석하지 않음. LIVE 17/17은 수행한 항목의 통과율이며 전체 출판 E2E PASS가 아님.

**다음 진입 제약:** Work 테스트 책 준비도 9%, 기록 4/20, 일수 1/30. 챕터·원고·표지·PDF 제작이 잠겨 있으므로 운영 DB의 시간/정책/결제 우회 변경 없이 별도 동등 스테이징 E2E 계획 필요.

---

## 5. 아직 LIVE 미완료인 핵심 E2E

| 영역 | 상태 |
|------|------|
| 실계정 책 생성·기록 저장 (위 §4) | **PASS — LIVE (17항목 범위)** |
| AI 챕터 생성 | PENDING |
| PDF 발행 | PENDING |
| Google / Kakao 로그인 | 미완료 설정 + PENDING |
| 계정 삭제·Storage 정리 | PENDING |
| Play Billing 실결제 | 코드 갭 + PENDING |

---

## 6. 출시 차단 vs 선택

### 차단 (웹 MVP / 실사용 공개 전)

1. **책 생성 → 3모드 기록 저장 → 새로고침 유지 → PAGE 정합** (§4) — **LIVE PASS, 기본 사용자 여정 차단 해소**
2. **AI 챕터·PDF 발행 LIVE** (필수 Secret 이름: `GOOGLE_AI_API_KEY`, `SERVICE_ROLE_KEY`) — 서버 리스크·설계: `23-ai-pdf-safety.md`
3. **운영에서 결제 우회 OFF** — `BILLING_DEV_BYPASS`≠true, `VITE_BILLING_DEV_MODE=false` (**실값 미확인**, 읽기 확인만·변경 승인 필요)

### 채널·플랫폼 선택 (이메일 웹만이면 당장 비차단)

| 항목 | 비고 |
|------|------|
| Google / Kakao OAuth | 버튼 제공 시에만 필수 |
| 일반 사용자 SMTP/커스텀 도메인 | 규모·전달률 이슈 시 |
| Play Billing 네이티브 | Android 유료화 시 |
| Firebase FCM | 푸시 베타 시 |

인증 **이메일 Magic Link**와 핵심 기록 여정은 각각 §2, §4 기준으로 **LIVE PASS**. 다만 일반 사용자 대상 SMTP는 외부 베타 전 발송·전달률 검증이 필요하며, 기본 프로젝트 팀 이메일 로그인 PASS만으로 일반 사용자 가입 가능성을 보증하지 않음.

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-24 | 운영 로그인 7/7 PASS 반영, Work 다음 검증·차단 이슈 정리 |
| 2026-10-24 | CI run 구분·차단/선택 분리·billing bypass 운영 금지 |
| 2026-10-24 | AI·PDF 안전성 → `23-ai-pdf-safety.md` 링크 |

| 2026-10-24 | Work 첫 책·3모드·PAGE·초안 운영 17 PASS / 3 미검증 반영; AI/PDF/결제/외부 SMTP는 계속 출시 게이트 |
