# MY CHAPTER — AI/PDF P1 구현 준비 및 검증 게이트 (2026-10-24)

## 목적
Work의 챕터·PDF 실연동 테스트와 충돌하지 않고, P1 비용·권한·중복생성 위험을 다음 개발 스프린트에 바로 넘길 수 있도록 결정·테스트 기준을 고정한다. 이 문서는 구현 완료가 아니다.

## 확인된 현재 코드
- `supabase/functions/generate-chapter/index.ts`: `MIN_RECORDS_FOR_CHAPTER=3`, 프로젝트·기록·챕터 조회 후 AI 호출·챕터 생성. 서버 Free 3챕터 한도·동시 생성 직렬화 없음.
- `supabase/functions/regenerate-chapter/index.ts`: 재생성 시 AI 호출과 `ai_usage.feature=chapter_regenerate` 기록, 호출 전 서버 비용 제한 없음.
- `supabase/functions/generate-pdf/index.ts`: `reserve_book_publication` RPC로 예약/Free 발행 제한. Pro-only 표지 사용 권한에 대한 서버 검사 미확인(기존 감사 S-04).
- S-02 배포: 운영 `generate-chapter` v8, `regenerate-chapter` v9 ACTIVE / JWT required (2026-10-24 도구 조회). 실제 Gemini 성공·실패 E2E는 미실시.

## 출시 전 우선순위 및 담당
| 단계 | 항목 | 담당 | 완료 기준 |
|---|---|---|---|
| P0 | Work AI/PDF LIVE 결과 수집 | Work | 실패/성공, 챕터·PDF 행/스토리지, 응답 코드와 로그 |
| P0 | 운영 우회 설정 OFF 증명 | Work(읽기만)/노바 검토 | Secret 값 노출 없이 서버 우회 비활성 증거 |
| P1-1 | Free 챕터 3개 정책 확정 | 사용자+노바 | '책당 3챕터' 유지/철회 및 이미 저장된 데이터 처리 결정 |
| P1-2 | AI 생성·재생성 비용 예산 상한 | 노바+사용자 | Free/Pro 횟수, 시간창, 실패/재시도 과금 규칙 확정 |
| P1-3 | 동시 요청 원자적 제한 | Cursor | 멀티탭 2개 동시 호출 시 1개만 성공, 다른 요청 충돌/재시도 명시 |
| P1-4 | Pro-only 표지 권한 | Cursor | 서버 RPC/Edge 모두 Free 차단, 소유권/구독 만료 검사 |
| P1-5 | P1 E2E, CI 회귀 | Cursor+Work | 단위·통합·권한 테스트 PASS, 운영 데이터 비파괴 |

## 누락·주의 (구현 시 반드시 반영)
1. `chapters COUNT` 및 `ai_usage COUNT`를 클라이언트/Edge에서 먼저 읽는 것만으로는 동시 요청에서 상한이 보장되지 않는다. **원자적 DB 조건부 예약/잠금**이 필요하다.
2. 외부 Gemini 호출을 장시간 DB 트랜잭션 락 안에 묶지 않는다. 원자적 사전 예약 + TTL 복구 + 결과 커밋/환불(실패 시) 구조를 검토한다.
3. 한 프로젝트 생성 요청은 idempotency key/작업 상태를 관리하여 동일 미배치 기록이 2개 챕터에 중복 배치되지 않게 한다.
4. Pro 표지 권한은 프런트 버튼 가드뿐 아니라 표지 저장 및 PDF 예약/발행 경로에서 검사한다.
5. AI 한도를 월 5/50회로 정한 것은 기존 문서의 **제안**이지 확정 상품 정책이 아니다. 승인 전 서버 코드에 상수로 박지 않는다.
6. 20기록/30일 제작 준비도 조건은 Free 챕터 3개 제한과 별개의 정책이다. 운영 시간을 조작하거나 결제 우회를 사용해 E2E를 통과 처리하지 않는다.
7. 데이터 소유권/RLS, 세션 만료, 사용량 과금 실패 원상복구, 동시 취소와 재시도까지 포함한다.
8. AI_UNAVAILABLE 배포는 기능 정상 성공의 증거가 아니다. 스테이징 테스트에서 정상 모델 응답 + 오류 응답 모두 검증해야 한다.

## 즉시 다음 액션
- Work 완료 전: Cursor는 기존 코드/운영 데이터 변경 없이 §1~§8을 토대로 RPC·함수별 마이그레이션/테스트 세부 설계만 작성.
- Work 결과 수신 후: 실제 오류가 있으면 P0 우선 수정. 없으면 제품 정책 결정 후 P1-3/P1-4부터 분리 PR.
