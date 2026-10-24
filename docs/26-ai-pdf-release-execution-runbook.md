# MY CHAPTER — 배포 실행 체크리스트 (2026-10-24)

## 검증된 현재 상태
- GitHub PR #2 squash merged: `f1c47fcb39c5894f904884bb5be42e7f26ebd652`; Vercel READY 확인.
- 코드 마이그레이션 `supabase/migrations/025_enforce_cover_and_readiness_guards.sql`는 main에 존재하나 운영 미적용.
- 기존 Supabase DB는 024까지 적용, 추가 branch 0. 새 branch 생성 도구 시도는 안전 검사로 차단되어 생성되지 않음.
- 결제 우회 `BILLING_DEV_BYPASS` 활성, `GOOGLE_AI_API_KEY` 미등록: Work 2026-10-24 점검 결과. **현재 재조회한 것은 아니므로 운영에서 재확인 필요**.
- 공개 베타/과금은 NO-GO.

## 순서 A — 제일 먼저 결제 우회 끄기
1. Supabase Dashboard > MyChapter > Edge Functions > Secrets에서 `BILLING_DEV_BYPASS=false` 지정하거나 secret 삭제.
2. 비밀값 노출 없이 Secret 변경 완료만 확인. 필요시 `verify-subscription` 배포 업데이트도 수행해야 기존 배포 코드가 안전한지 확정 가능.
3. `GOOGLE_AI_API_KEY`를 운영의 별도 안전한 설정 화면에서 등록. 키 내용은 GitHub·채팅·문서에 넣지 않는다.
**인수 기준:** 배포된 verify-subscription이 `dev_` 토큰을 거부하며 Pro 구독을 생성하지 않음.

## 순서 B — 스테이징
- 별도 Supabase project/branch 비용·접근 승인 확보 후 생성, 운영 유저·record 데이터 복제 금지.
- 필요한 스키마/RLS/트리거/스토리지/Edge를 적용, 별도 Vercel Preview에 stage URL·anon key 연결. Product 결제 우회 기본 OFF.
- 스테이징에서 025 migration, SQL script(`supabase/scripts/verify_025_publication_entitlement.sql`), 신규 가입·기록·책·결제·표지 저장·준비도 잠금·PDF 테스트.
- branch 자동 병합 절대 사용하지 않음. 운영 마이그레이션은 별도 수동 승인/백업 이후.

## 순서 C — 운영 DB 025 적용 전 보호
1. Supabase Dashboard Database > Backups에서 최근 백업 및 복원 가능한 범위 확인. 백업이 없으면 전체 스키마·데이터의 복원 계획이 준비될 때까지 **적용 금지**.
2. `pg_get_functiondef`로 기존 `private.reserve_book_publication(uuid,text)`, `public.set_project_readiness_defaults()`, `public.invalidate_book_review_on_project_change()` 보존. 현재 프로젝트의 트리거 목록·권한/GRANT·기존 migration ledger를 저장.
3. 운영 DB에 025를 적용하는 행위는 기존 함수 `CREATE OR REPLACE`와 트리거 추가를 포함하며, 단순 git revert로 되돌릴 수 없음. **복구는 백업 복원 또는 별도 검증된 역마이그레이션이 필요**.
4. 025 적용 전/후 비교: 사용자 책 생성, 기록 작성·수정, Free 표지, Free Pro 표지 직접 REST UPDATE 거부, 활성/만료 Pro, ready_at 접근, 신규/기존 프로젝트.
5. migration 적용 후 3개 Edge `generate-chapter`, `verify-subscription`, `generate-pdf`의 코드 버전·JWT 설정을 확인하고 배포. Edge 함수의 공유 의존 파일 전체 포함 여부 확인.

## 실행 차단 조건
- 운영 `BILLING_DEV_BYPASS` 활성
- 실제 복구 가능한 운영 백업 부재
- staging AI/PDF 정상 경로 검증 미완료
- migration 기존 trigger 상호작용·서비스 role 테스트 미검증

## 롤백 결정
- Frontend: 이전 Vercel 안정 배포로 롤백 가능.
- Edge: 이전 배포된 함수 소스·버전 복원 (이전 버전 다운로드/검증 필수).
- DB: 025는 DDL이므로 선행 백업 기반 복구 또는 **미리 테스트한 역마이그레이션** 필요. 운영에서 임시 DROP TRIGGER로 문제 숨기지 않는다.
- Secrets: 우회 플래그를 다시 true로 돌리지 않는다.

## 책임
- 노바: GitHub 코드/DB 점검, CI/배포 상태 증거, 릴리스 판정
- Cursor: migration 스테이징 실제 실행/회귀/역마이그레이션 검증
- Work: 스테이징 브라우저 E2E
- Secret 관리자: 운영 우회 OFF와 Gemini 키 등록

**이 문서는 작업 실행 계획이며 DB·Secret·Edge를 변경했다는 뜻이 아니다.**
