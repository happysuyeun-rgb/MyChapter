# 07. 디자인 토큰 변경안

> **방향:** Editorial Book Desk 강화  
> **원칙:** 기존 `tailwind.config.js` / `docs/10_DESIGN_SYSTEM.md` 색·서체를 **유지**하고, 역할·CSS 변수·유틸만 정리한다.  
> **금지:** 브랜드 색 전면 교체, 다크모드 기본화, API/스키마 연동 토큰 신설.

---

## 1. 현행 → 목표 매핑

| 토큰 (코드) | 값 | 현행 역할 | 목표 역할 (명확화) | 변경 |
|-------------|-----|-----------|-------------------|------|
| `ink` | `#3B352D` | 본문·CTA | **Primary text + Primary CTA** | 역할 문서화만 |
| `ink-muted` | `#756D62` | 보조 본문 | 보조 본문·설명 | 유지 |
| `ink-faint` | `#A79D90` | 캡션 | 메타·비활성 탭 | 유지 |
| `surface` | `#F7F2E8` | 페이지 바탕 | Paper 바탕 | 유지 |
| `surface-card` | `#FFFDF8` | 카드 면 | 상호작용 면만 | 사용 축소 |
| `surface-alt` | `#EEE5D7` | 대비 면 | 트랙·칩 배경 | 유지 |
| `sage` | `#7C8D78` | 진행·PAGE | 준비도·성공·PAGE | **CTA에 쓰지 않음** |
| `terracotta` | `#C87959` | 강조 | 선택 강조·경고·NOW 배지 | **Primary CTA 아님** |
| `accent` | = ink | 레거시 alias | ink와 동일 취급 | deprecate 예정 |
| `accent.mid` | = sage | 혼용 | `sage`로 통일 | 신규 코드 금지 |
| `accent.light` | `#EFE6D8` | hover 면 | `surface-alt` 계열 | 유지 |
| `border` / `border-strong` | ink alpha | hairline | 섹션 규칙선 | 유지 |
| `danger` | `#B85C4A` | 위험 | 삭제·결제 실패 | 유지 |
| `font-sans` | Noto Sans KR | UI | 운영 UI | 유지 |
| `font-serif` | Noto Serif KR | 제목·책 | Display 1개/화면 | 유지 |
| `shadow-paper` | soft | 카드 | **표지 시맨틱만** | 일반 리스트 금지 |
| `radius.btn/card` | 14/18 | 버튼·카드 | 버튼만 적극 사용 | 카드 radius 남용 금지 |

---

## 2. CSS 변수 도입 (점진)

`src/index.css` `@layer base`에 미러링한다. Tailwind 클래스가 주 경로이고, 변수는 네이티브/모달·차트 대비용이다.

```css
:root {
  --mc-ink: #3B352D;
  --mc-ink-muted: #756D62;
  --mc-ink-faint: #A79D90;
  --mc-surface: #F7F2E8;
  --mc-surface-card: #FFFDF8;
  --mc-surface-alt: #EEE5D7;
  --mc-sage: #7C8D78;
  --mc-terracotta: #C87959;
  --mc-danger: #B85C4A;
  --mc-border: rgba(59, 53, 45, 0.12);
  --mc-border-strong: rgba(59, 53, 45, 0.24);
  --mc-shadow-paper: 0 8px 28px rgba(59, 53, 45, 0.08);
  --mc-radius-btn: 14px;
  --mc-max-phone: 430px;
}
```

**값 변경 없음** — 이름만 공식화.

---

## 3. 유틸 클래스 (공통)

| 클래스 | 용도 | 비고 |
|--------|------|------|
| `.safe-bottom` | 탭·하단 CTA | 현행 유지 |
| `.paper-card` | 의미 있는 면 컨테이너 | 남용 금지 |
| `.desk-rule` (신규) | `border-b border-ink` 섹션 헤더 | Editorial hairline |
| `.desk-fade-in` (신규) | Desk 진입 120ms opacity | `prefers-reduced-motion` 존중 |

---

## 4. 타이포 스케일 (권장 · 강제 아님)

| 이름 | 용도 | 예시 클래스 |
|------|------|-------------|
| Display | 화면 주 제목 1개 | `font-serif text-[24px]~[30px] font-bold tracking-[-0.03em]` |
| Title | 섹션 제목 | `font-serif text-lg~xl font-bold` |
| Body | 본문 | `text-sm leading-6 text-ink` |
| Meta | 날짜·eyebrow | `text-[10px]~[11px] tracking-[0.12em~0.22em] text-ink-faint\|sage` |
| CTA | 버튼 | `text-[14px] font-semibold` |

---

## 5. 적용 순서

1. CSS 변수 미러 + 유틸 (본 Phase)  
2. 신규/수정 화면만 역할 표 준수  
3. `accent` / `accent.mid` 사용처 점진 `ink` / `sage` 치환 (별 PR)  
4. 토큰 값 자체 변경은 **브랜드 리뷰 후**만

---

## 6. 비범위

- 색상 HEX 교체  
- 폰트 패밀리 교체  
- 다크 테마 토큰  
- 디자인 토큰 → 서버/Feature flag 연동
