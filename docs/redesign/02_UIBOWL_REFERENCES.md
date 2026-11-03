# 02. 유아이볼 레퍼런스 조사

> **조사일:** 2026-11-03  
> **도구:** UIBowl MCP (`search_ui_patterns`, `search_components`, `search_by_ocr_text`, `filter_by_app`)  
> **원칙:** 결과 0건은 추측 사례 금지. 무단 복제 금지 — **패턴 학습용**.  
> **표시:** 앱명은 `ui_url` 마크다운 링크. 이미지 URL은 문서에 노출하지 않음.

---

## 1. 홈·대시보드

| 앱 | ui_url | 관찰 패턴 | MY CHAPTER 적합 | 부적합 |
|----|--------|-----------|-----------------|--------|
| 왓섭 | [유아이볼](https://uibowl.io/name/%EC%99%93%EC%84%AD?patterns=%EB%A9%94%EC%9D%B8&patternName=%ED%99%88%20-%20%EA%B5%AC%EB%8F%85%20%EC%B6%94%EA%B0%80%20%EC%A0%84) | 상단 프로모·요약 카드·원형 아이콘 그리드·FAB·3탭 | 빈 홈에서 **단일 CTA(책/기록)** 강조 | 구독 관리형 그리드·프로모 배너는 출판 톤과 거리 |
| 오늘의 루틴 | [유아이볼](https://uibowl.io/name/%EC%98%A4%EB%8A%98%EC%9D%98%20%EB%A3%A8%ED%8B%B4?patterns=%EB%A9%94%EC%9D%B8&patternName=%ED%99%88) | 날짜 스트립·빈 상태 카피·추천 CTA·FAB·4탭 | **오늘 기록 없음** Empty + 추천 행동 | 할 일/루틴 메타포는 책 작업실과 불일치 |
| 클로디 | [유아이볼](https://uibowl.io/name/%ED%81%B4%EB%A1%9C%EB%94%94?patterns=%EB%A9%94%EC%9D%B8&patternName=%ED%99%88) | 캘린더 그리드·하단 고정 「일기 쓰기」 | 날짜×기록 연결 참고 | 감사일기 wellness 톤 — **브랜드 차별 필요** |

**패턴 요약:** 홈은 “오늘 할 한 가지 CTA”가 최상단에 있어야 해요. MY CHAPTER는 readiness 요약 + 오늘 기록 CTA로 재구성해요.

---

## 2. 기록·일기·글쓰기

| 앱 | ui_url | 관찰 | 적합 | 부적합 |
|----|--------|------|------|--------|
| 클로디 | [글쓰기](https://uibowl.io/name/%ED%81%B4%EB%A1%9C%EB%94%94?patterns=%EA%B8%80%EC%93%B0%EA%B8%B0&patternName=%EA%B0%90%EC%82%AC%EC%9D%BC%EA%B8%B0%20%EC%93%B0%EA%B8%B0) | 텍스트 필드 immersion·FAB | 집중 작성면 | 감정 일기 비주얼 |
| 스꾸 | [방명록](https://uibowl.io/name/%EC%8A%A4%EA%BE%B8?patterns=%EA%B8%80%EC%93%B0%EA%B8%B0&patternName=%EB%B0%A9%EB%AA%85%EB%A1%9D) | 리스트+모달 입력 | 짧은 기록 모달 | 책 원고 톤과 거리 |
| 점신 | [소원카드](https://uibowl.io/name/%EC%A0%90%EC%8B%A0?patterns=%EA%B8%80%EC%93%B0%EA%B8%B0&patternName=%EC%86%8C%EC%9B%90%EC%B9%B4%EB%93%9C) | 그래픽 중심 작성 | — | 점술/카드 메타포 부적합 |

**검색 메모:** `일기 기록` 쿼리는 0건 → `글쓰기`로 재검색 성공.

---

## 3. 독서·서재·책 목록

| 앱 | ui_url | 관찰 | 적합 | 부적합 |
|----|--------|------|------|--------|
| 밀리의서재 | [내서재](https://uibowl.io/name/%EB%B0%80%EB%A6%AC%EC%9D%98%EC%84%9C%EC%9E%AC?patterns=%EB%A7%88%EC%9D%B4%ED%8E%98%EC%9D%B4%EC%A7%80&patternName=%EB%82%B4%EC%84%9C%EC%9E%AC) | 첫 방문 도움말 모달·퀵메뉴 안내·5탭 | 서재 Empty 교육 | 전자책 구독 서비스 IA 그대로 복제 금지 |
| 북플립 | [서재 검색](https://uibowl.io/name/%EB%B6%81%ED%94%8C%EB%A6%BD?patterns=%EA%B2%80%EC%83%89&patternName=%EC%84%9C%EC%9E%AC) / [메인 서재](https://uibowl.io/name/%EB%B6%81%ED%94%8C%EB%A6%BD?patterns=%EB%A9%94%EC%9D%B8&patternName=%EC%84%9C%EC%9E%AC) | 커버 그리드·하단 탭 | 커버 중심 서재 | 장식 컬러 디바이더·탭 활성 불일치는 피함 |
| 밀리 (앱 필터) | [검색](https://uibowl.io/name/%EB%B0%80%EB%A6%AC%EC%9D%98%EC%84%9C%EC%9E%AC?patterns=%EA%B2%80%EC%83%89) · [로그인](https://uibowl.io/name/%EB%B0%80%EB%A6%AC%EC%9D%98%EC%84%9C%EC%9E%AC?patterns=%EB%A1%9C%EA%B7%B8%EC%9D%B8%C2%B7%ED%9A%8C%EC%9B%90%EA%B0%80%EC%9E%85) | 다크 검색·칩·신규/기존 CTA 분리 | 로그인 가치 제안 CTA | 구독 유도 카피 과다 |

---

## 4. 다단계·생성·완료

| 앱 | ui_url | 관찰 | 적합 | 부적합 |
|----|--------|------|------|--------|
| 코빗 | [지갑 생성](https://uibowl.io/name/%EC%BD%94%EB%B9%97?patterns=%EC%83%9D%EC%84%B1%ED%95%98%EA%B8%B0&imgId=cmr8hc2zc00jpjw04qtfyyecc) | 체크 아이콘·다음 행동 CTA·「다음에」 | 책/챕터 생성 성공면 | 금융 메타포 |
| 토스증권 | [모으기](https://uibowl.io/name/%ED%86%A0%EC%8A%A4%EC%A6%9D%EA%B6%8C?patterns=%EC%83%9D%EC%84%B1%ED%95%98%EA%B8%B0&imgId=cmrug2evh001bjo04wep64mop) | 완료 카피·토스트 요약 | 완료 피드백 | 투자 도메인 |
| 세모 | [오답 완료](https://uibowl.io/name/%EC%84%B8%EB%AA%A8?patterns=%EC%83%9D%EC%84%B1%ED%95%98%EA%B8%B0&imgId=cmrkc5gdo0017jx04lwnlq049) | 완료 상태 바 | 상태 고정 CTA | 교육 오답 맥락 |

**스텝퍼×온보딩:** `search_components(스텝퍼, pattern=온보딩)` → **0건** (추측 사례 없음).

---

## 5. 챕터·편집·미리보기 (뷰어)

| 앱 | ui_url | 관찰 | 적합 | 부적합 |
|----|--------|------|------|--------|
| 알라딘 | [뷰어](https://uibowl.io/name/%EC%95%8C%EB%9D%BC%EB%94%98?patterns=%EB%B7%B0%EC%96%B4) | 표지형 미리보기·세리프 인용·페이지 인디케이터 | **원고/표지 프리뷰** 톤 | 서점 상품 상세와 혼동 주의 |
| 윌라 | [오디오](https://uibowl.io/name/%EC%9C%8C%EB%9D%BC?patterns=%EB%B7%B0%EC%96%B4&patternName=%EC%98%A4%EB%94%94%EC%98%A4%EB%B6%81%20%EB%93%A3%EA%B8%B0) | 메타·CTA·미니 플레이어 | 발행 후 열람 CTA | 오디오 중심 |
| 랭플릭스 | [뷰어](https://uibowl.io/name/%EB%9E%AD%ED%94%8C%EB%A6%AD%EC%8A%A4?patterns=%ED%95%99%EC%8A%B5%ED%95%98%EA%B8%B0&patternName=%EB%B7%B0%EC%96%B4) | 다크 immersion | 편집 immersion | 영상 학습 툴바 |

---

## 6. 완료·성공·로딩·에러 · Empty

| 앱 | ui_url | 관찰 | 적합 |
|----|--------|------|------|
| 투두메이트 | [빈 분석](https://uibowl.io/name/%ED%88%AC%EB%91%90%EB%A9%94%EC%9D%B4%ED%8A%B8?patterns=%EB%A9%94%EC%9D%B8&imgId=cmpjgllwx000ql50495c7jnpj) | 짧은 Empty 카피 | 로딩 후 빈 상태 |
| 오늘의 루틴 (다크) | [홈 Empty](https://uibowl.io/name/%EC%98%A4%EB%8A%98%EC%9D%98%20%EB%A3%A8%ED%8B%B4?patterns=%EB%A9%94%EC%9D%B8&imgId=cmqj726oq0003ju040sj7hmy4) | 아이콘+CTA | Empty CTA 계층 |
| 점신 | [인맥보고서](https://uibowl.io/name/%EC%A0%90%EC%8B%A0?patterns=%EB%A9%94%EC%9D%B8&imgId=cmrbbjv98000dl804jx97pv0n) | Empty+추가 버튼 | 구조만 참고 |

---

## 7. 온보딩·구독·Paywall · 동의

| 앱 | ui_url | 관찰 | 적합 | 부적합 |
|----|--------|------|------|--------|
| 무디 | [멤버십](https://uibowl.io/name/%EB%AC%B4%EB%94%94%20Moodee?patterns=%EB%A9%A4%EB%B2%84%EC%8B%AD%C2%B7%EC%9A%94%EA%B8%88%EC%A0%9C) | 연/월 라디오·할인 배지·고정 CTA | Pro 비교 카드 | 감정 캐릭터 과다 |
| 포스티 / 쑥쑥찰칵 | 멤버십 검색 결과 | 요금 선택 UI | 가격 계층 | 도메인 불일치 |
| 베이비빌리 | [알림](https://uibowl.io/name/%EB%B2%A0%EC%9D%B4%EB%B9%84%EB%B9%8C%EB%A6%AC?patterns=%EC%98%A8%EB%B3%B4%EB%94%A9&imgId=cmpw60nnd000rl704a9wuzhig) | 선택 알림·「나중에」 | 알림 온보딩 스킵 | 혜택 마케팅 과다 |
| 석가머니 | [AI 동의](https://uibowl.io/name/%EC%84%9D%EA%B0%80%EB%A8%B8%EB%8B%88?patterns=%EC%95%BD%EA%B4%80%EB%8F%99%EC%9D%98&imgId=cmvfy6xxw003fl406dwzpyxox) | 필수/선택 분리·전체동의·나중에 | **동의 UI 구조** | 카피·도메인 복제 금지 |
| 네이버페이 | [알림 동의](https://uibowl.io/name/%EB%84%A4%EC%9D%B4%EB%B2%84%ED%8E%98%EC%9D%B4?patterns=%EC%95%BD%EA%B4%80%EB%8F%99%EC%9D%98&imgId=cmswzu5n70023l904b1ot1fzg) | 바텀시트·필수 배지·거절 | 맥락형 동의 | 이벤트 프로모 |

---

## 8. 하단 내비·공통

| 앱 | ui_url | 관찰 | 적합 |
|----|--------|------|------|
| 세모 | [오답 목록](https://uibowl.io/name/%EC%84%B8%EB%AA%A8?patterns=%EB%82%B4%EC%97%AD&imgId=cmrix1q9q0005l1042lplnu57) | 3탭+FAB | 탭 수 최소화 |
| 플랭 | [챌린지](https://uibowl.io/name/%ED%94%8C%EB%9E%AD?patterns=%EA%B2%8C%EC%9D%B4%EB%AF%B8%ED%94%BC%EC%BC%80%EC%85%98&imgId=cmsu8ymwm000vk004x6d47or2) | 5탭·진행 카드 | 진행률 카드만 참고 |
| 밀리 | 필터 결과 | 5탭(투데이·피드·검색·서재·관리) | MY CHAPTER는 **3탭 유지** 권고 |

---

## 9. MY CHAPTER 적용 원칙 (레퍼런스 → 제품)

1. **복제 금지** — 레이아웃·일러스트·카피 그대로 가져오지 않음.  
2. **가져올 것:** Empty+CTA, 성공면 다음 행동, 필수/선택 동의 분리, 커버 중심 서재, 뷰어형 미리보기.  
3. **버릴 것:** wellness 일기 캘린더 과다, 금융/점술/챌린지 게이미피케이션 과다, 전자책 스토어 탐색 중심 IA.  
4. **브랜드 고정:** Ink/Ivory/Sage + Serif 헤더 (기존 시스템 강화).
