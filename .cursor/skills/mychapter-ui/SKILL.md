---
name: mychapter-ui
description: >-
  MY CHAPTER UI 작업 시 현재 Editorial Book Desk 디자인 시스템과 제품 결정을 적용합니다.
  docs/10_DESIGN_SYSTEM.md, docs/02_PRODUCT_DECISIONS.md, docs/05_SCREEN_SPEC.md가 기준입니다.
---

# MY CHAPTER UI Guide

## Canonical references

1. `docs/10_DESIGN_SYSTEM.md`
2. `docs/02_PRODUCT_DECISIONS.md`
3. `docs/05_SCREEN_SPEC.md`
4. `DESIGN.md` — entry point only

Do not use legacy docs as current product/design truth.

## Visual direction

**Paper × Botanical × Vintage × Editorial × AI**

The product should feel like a digital book-making and publishing workspace.

## Core rules

- Ink Brown / Warm Ivory / Sage / Terracotta.
- Serif = book/editorial hierarchy.
- Sans = operational UI.
- Prefer hairline dividers and editorial lists over rounded cards.
- Avoid card-in-card.
- Avoid decorative emoji for navigation/features.
- Use `FlatIcon` for functional icons.
- PAGE remains a separate brand character.
- One dominant CTA per screen.
- Book covers can use subtle radius/shadow as a semantic exception.
- Mobile-first at 320 / 375 / 414 px.
- Respect safe-area bottom actions.
- Keep motion restrained.

## Screen consistency checklist

- [ ] `bg-surface` rather than ad-hoc white page shells
- [ ] editorial header / serif hierarchy
- [ ] no generic rounded-card feature grids
- [ ] no emoji navigation/icon tiles
- [ ] CTA uses current Button or equivalent Ink treatment
- [ ] empty/loading/error states use the same editorial language
- [ ] copy uses Book / Page / Workspace / Publication terminology
- [ ] direct route guard and mobile overflow verified
