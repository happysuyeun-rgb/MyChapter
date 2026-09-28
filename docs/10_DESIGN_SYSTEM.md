# 10. Design System

**Status:** Brand/UI direction v1  
**Updated:** 2026-09-28

## Brand concept

**A Book of Me / 나라는 사람의 한 권**

Visual direction:

> Paper × Botanical × Vintage × Editorial × AI

The product should feel like a modern app containing a quiet editorial/book-making space.

## Core colors

- Ink Brown: `#3B352D`
- Warm Ivory: `#F7F2E8`
- Sage: `#7C8D78`
- Terracotta: `#C87959`

Supporting:

- Surface Card: `#FFFDF8`
- Surface Alt: `#EEE5D7`
- Muted Ink: `#756D62`

## Color role

- Ink Brown: primary text / primary CTA / publishing/editorial identity
- Warm Ivory: default paper background
- Sage: PAGE / progress / AI guidance
- Terracotta: selective emphasis / warning / special state

Avoid green becoming the dominant brand color. It can make the service read as a wellness journal rather than a publishing product.

## Typography

Current:

- Noto Sans KR: UI/body
- Noto Serif KR: book/editorial headings

Principle:

- serif for book identity and editorial hierarchy
- sans for operational UI
- no decorative italic headers

## Layout principle

Reduce repeated rounded-card UI.

Prefer:

- hairline section boundaries
- book-like lists
- editorial whitespace
- clear content hierarchy
- one dominant action per view

Use Card only when containment has semantic value.

## Hallmark usage

Hallmark is used as an **audit discipline**.

Apply:

- reduce Card-in-card
- avoid generic 3-card/feature-grid patterns
- avoid excessive eyebrows
- avoid unnecessary decorative motion
- preserve mobile readability
- keep one coherent icon voice

Do not:

- replace MY CHAPTER with a Hallmark catalog theme
- let Hallmark rotate the app into inconsistent per-page themes

## ItsHover usage

Potential use:

- functional icons
- subtle hover/tap feedback
- navigation/action affordances

Do not use as PAGE replacement.

If adopted, avoid mixing multiple icon libraries.

## PAGE

Role:

- small editor
- recording companion
- gentle guide

Visual:

- paper/book body
- sprout
- cream paper
- small green detail
- minimal face
- no 3D robot
- no giant childish eyes

PAGE should remain secondary to the user’s story.

## Motion

Keep restrained.

Good:

- small tap feedback
- progress state
- publication processing
- limited character response

Avoid:

- constant scroll animation
- bouncing buttons
- decorative movement without information

Support `prefers-reduced-motion` when motion system is expanded.

## Mobile

Primary target is phone.

Verify:

- 320px
- 375px
- 414px
- 768px

Rules:

- no horizontal overflow
- primary CTA remains single readable action
- touch targets should be comfortably tappable
- long titles must truncate or wrap safely
- bottom actions respect safe-area inset
