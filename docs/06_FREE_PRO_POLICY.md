# 06. Free / Pro Policy

**Status:** Core policy confirmed; some quotas open  
**Updated:** 2026-09-28

## Principle

MY CHAPTER는 기록을 시작하기 전에 강한 paywall을 세우지 않는다.

핵심 전략:

> **Free 사용자가 첫 번째 책을 실제로 완성하고 발행하게 한 뒤, 두 번째 성공을 위해 Pro로 전환한다.**

## Free

Confirmed:

- 1 active/created Book
- recording
- AI question with quota/fallback
- free writing
- photo recording
- Story Readiness
- first-book chapter/manuscript workflow
- default covers
- final review
- **first PDF publication: 1**
- Library
- published book access

### Important correction

현재 코드에는 Free chapter limit 3개가 존재한다.

이 제한은 “첫 책 완성 가능” 정책과 충돌할 수 있다. 특히 readiness가 40개 이상의 기록을 요구하는 유형에서 현재 10-record chapter batching과 결합하면 첫 책 완성을 막는다.

**DB v2 이전 수정 방향: 첫 번째 책 완성에 필요한 chapter 수 자체는 막지 않는다.**

## Pro

Confirmed direction:

- multiple Books
- repeated publication / new publication versions
- expanded AI usage
- Pro cover options
- future AI custom cover
- higher/fair-use generation allowance

## Recommended conversion moments

Good:

- 새 책 추가
- 첫 책 발행 후 다시 발행
- 추가 publication version
- premium cover
- higher AI usage

Avoid:

- 첫 기록 전에 결제 요구
- 기록 열람 차단
- 첫 책의 마지막 단계 직전에 갑작스럽게 완성을 막는 paywall

## Publication entitlement

Target policy:

### Free

```text
publication_count = 0
→ first publication allowed
→ publication_count = 1
→ next publication requires Pro
```

### Pro

Repeated publication allowed subject to service fair-use.

## Current copy issue

Paywall currently contains:

> “첫 책을 PDF로 받아보세요”

이 문구는 Free 첫 책 발행 정책과 충돌한다.

Replacement intent:

> “다음 책도 계속 만들어보세요”  
> or  
> “여러 권의 책과 확장 AI 기능을 이용하세요”

## Open quotas

Do not hard-code into product docs until decided:

- Free AI edit: total vs monthly
- exact Pro AI edit quota
- AI custom-cover quota
- chapter regeneration fair-use

## Billing implementation note

Current Android billing product:

`mychapter_pro_monthly`

Current displayed price constant:

`월 5,900원`

가격은 스토어 정책/상품 설정과 동기화 검증이 필요하다.
