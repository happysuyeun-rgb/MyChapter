# MY CHAPTER — 2026-10-24 Work AI/PDF 운영 점검: P0 출시 차단
> 근거: Work 사용자가 전달한 운영 프로젝트 read-only 조사·격리 핸들러 시험 보고. 현재 GitHub 소스 정적 재확인. 민감값·digest 원문 기록 없음.

## 즉시 조치 — 공개 베타 금지
- [ ] **P0 SEC-01 결제 우회 활성**: Work에 따르면 Supabase 운영 `BILLING_DEV_BYPASS` 값이 활성. GitHub `verify-subscription/index.ts`에서 `BILLING_DEV_BYPASS === 'true'`와 개발용 토큰을 수락하는 코드 존재. 프런트에서 개발 옵션을 숨기는 것은 서버의 직접 요청 수락을 방어하지 못함. Secret 관리자 권한으로 운영 우회 OFF 처리 후 서버 동작을 안전하게 재검증. 서버 기능 자체에 production fail-closed 가드 검토. 코드 취약·환경 설정 위험 확정, 실제 운영 Pro 승격 성공은 미실험.
- [ ] **P0 AI-01 Gemini key 미설정**: Work 운영 Edge secrets 목록에 `GOOGLE_AI_API_KEY` 없음. 유효한 키 등록은 비밀 관리 콘솔에서만. 실제 모델 정상 생성 E2E 전 필수.
- [ ] **P0 AUTH-01 서버 준비도 미강제**: `generate-chapter`는 records≥3만 검사, project `ready_at` / 20개·30일 조건 미검사. Work 로컬 합성 정상 응답은 조건 미달 프로젝트에 200/챕터 생성 재현. UI 잠금과 서버 계약 불일치. 서버에서 제품 준비도 정책 강제 (기존 ready_at 기준의 신뢰성·권한 검토).
- [ ] **P1 PDF-01 registerFontkit**: `generate-pdf`에서 커스텀 OTF `embedFont` 전 `pdfDoc.registerFontkit(fontkit)` 누락. 실제 PDF LIVE 실패 여부 미검증. https://pdf-lib.js.org/docs/api/classes/pdfdocument#registerfontkit
- [ ] **P1 AUTH-02 Pro cover**: Free 계정이 API로 cover_03/04를 선택·발행할 수 있는 서버 권한 경로 차단 필요. Edge와 예약 RPC 양쪽 강제 권고.

## 확인한 안전 영역과 제약
- 운영 generate-chapter v8 / regenerate-chapter v9 ACTIVE, JWT 필수.
- 실패 처리 로컬 합성: missing_key 503, upstream/empty 502, AI_UNAVAILABLE, INSERT/UPDATE 0; 두 함수 6개 실패 및 2개 정상·비소유자 2개 포함 총 10 PASS. **LIVE E2E 아님.**
- Work 운영 읽기전용 RLS: 본인 책 1·기록 4, 비소유자 0. published-pdfs 버킷 비공개 및 소유자 경로 RLS; 실제 2계정 HTTP/PDF E2E 미실시.
- 운영 프로젝트 단일·Supabase branches 0·Vercel 분리 환경 0, 안전한 스테이징 미확보.
- production 20기록/30일, 시험 책 4기록/1일, ready_at 없음. 운영 DB 조작 금지.

## 실행 담당 및 게이트
1. **긴급 안전조치**: 운영 Secret `BILLING_DEV_BYPASS` OFF 확인 및 Gemini 키 등록 (키 내용 채팅/깃허브 비공개). 현재 assistant 연결 도구에서 Supabase Secret 쓰기 API는 지원하지 않으므로 조치 완료로 표시하지 않음.
2. **Cursor 별도 브랜치**: P0 제작 준비도 서버 강제, PDF fontkit, Pro cover 검사와 회귀 테스트; 운영 함수 즉시 덮어쓰기 금지. P1 사용량/동시성은 별도 PR.
3. **노바 코드 리뷰**: DB 권한/기존 데이터·정책 비교, CI 점검, staging 확정 후 배포.
4. **Work**: 별도 Supabase staging + Vercel preview, 스테이징 전용 계정/키/데이터로 AI→PDF E2E, Free 발행 1회/2회, 비소유자 접근 검증.
5. **외부 베타 GATE**: SMTP, 약관·탈퇴, 비용 한도·로깅·알림 확인 후 공개 여부 결정.

**상태:** 책·기록 LIVE 통과 / AI/PDF 전체 LIVE 미검증 / 웹 공개 출시 NO-GO.
