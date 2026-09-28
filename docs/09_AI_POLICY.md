# 09. AI Policy

**Status:** AI product behavior policy  
**Updated:** 2026-09-28

## Core rule

AI is an editor and interviewer, not the owner of the story.

## 1. Truthfulness

For chapter/manuscript generation:

- do not invent events
- do not invent dialogue
- do not invent people
- do not invent places
- do not invent emotions the user did not express
- do not invent causality
- do not add forced lessons or inspirational conclusions

If source material is insufficient, produce a shorter result rather than fabricating detail.

## 2. Original preservation

```text
Original record
→ derived analysis
→ AI chapter draft
→ user edit
```

Original records are not overwritten by AI output.

## 3. AI Question

Inputs may include:

- project type
- recent records
- recent emotions
- repeated topics
- missing story dimensions
- prior questions

Goals:

- specific
- answerable
- non-repetitive
- appropriate to the selected Book

Avoid:

- generic philosophy every day
- repeatedly asking the same emotional question
- pretending knowledge not supported by records

## 4. Freewriting hint

Optional only.

Failure or quota exhaustion must never block free writing.

## 5. Record Analysis

Proposed structured outputs:

- summary
- themes
- people
- places
- emotions
- events
- conflict
- change
- insight
- goals

Use schema versions.

## 6. Chapter composition

Desired process:

```text
records
→ record analyses
→ recurring themes / chronology / change
→ candidate chapter clusters
→ chapter structure
→ manuscript generation
```

Do not default to fixed-size buckets.

Suggested narrative preference where supported by source:

```text
장면
→ 감정/갈등
→ 변화/깨달음/여운
```

## 7. Style

Default:

- natural first-person Korean essay
- restrained
- preserves user voice when identifiable
- avoids report-like AI tone
- avoids self-help clichés

## 8. Regeneration

Regeneration should return to original source records, not merely paraphrase the previous AI draft.

UI must warn when regeneration will replace the current edited chapter version.

Long-term improvement:
- preserve revision history instead of destructive overwrite.

## 9. Usage and paywall

AI quota failure should degrade gracefully.

Examples:

- question quota → fallback question
- hint quota → free writing remains available
- premium cover quota → basic cover remains available

## 10. Privacy principle

Personal records are sensitive.

AI processing should use only the minimum source data needed for the requested feature.

Do not expose one user’s content in another user’s generation context.
