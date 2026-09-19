# Header hierarchy

## Objective
Improve the compact header's visual hierarchy so Pi theme and session workflows are easier to discover, Export reads as secondary, responsive grouping remains clear, and the browser tab has a matching favicon.

## Problem and rationale
The current header gives Export the strongest emphasis while the Pi-integrated dropdowns use muted ghost styling. The browser tab also lacks a recognizable project icon. Preserve the existing compact structure and improve emphasis rather than redesigning the header.

## Scope
- Strengthen the visual prominence and consistency of the Pi themes and Pi sessions dropdown triggers.
- Reduce Export to a secondary action while keeping it accessible.
- Preserve clear wrapping and constrain dropdown menus on narrow viewports.
- Add a lightweight inline SVG favicon matching the existing star/cyan identity.

## Constraints
- Preserve existing header structure and behavior.
- Keep technical artifacts in English.
- Avoid a standalone favicon asset so the extension static-file whitelist does not need expansion.
- Do not commit without explicit user authorization.

## Delivery
- Strategy: ask-on-risk.
- Forecast: under 100 authored changed lines.
- Branch: `feat/header-hierarchy`.
- Native review: RDD is off.

## Verification configuration
- TDD mode: not configured; ordinary functional checks apply.
- Exact automated runner: `npm run check`.
- Additional checks: `git diff --check`, structural readback, and manual responsive browser verification.

## Tasks
- [x] **HH-1 — Refine header hierarchy and favicon**
  - Route: delegated writer; multi-file write trigger (`index.html`, `style.css`).
  - Added an inline star favicon, promoted both Pi dropdown triggers, demoted Export to secondary styling, and constrained narrow menus without restructuring the header.
  - Check: independent structural review passed; `npm run check` and `git diff --check` passed in both writer and verifier runs; parent spot-check passed.
  - Commit: pending explicit user authorization.
- [x] **HH-2 — Verify responsive browser behavior**
  - Route: delegated verifier plus user-confirmed manual check.
  - User confirmed the rendered header improvements are satisfactory after local browser review.
  - Check: automated checks passed and manual browser evidence was confirmed.
  - Commit: authorized for automated delivery.

## Acceptance criteria
- Pi theme and session dropdown triggers have stronger, consistent prominence.
- Export remains accessible without primary-action emphasis.
- Header grouping and dropdown menus remain clear at narrow widths.
- A lightweight favicon matches the existing visual identity.
- Existing JavaScript syntax checks pass and the diff has no whitespace errors.

## Progress and evidence
- Issue #5 scope recovered from GitHub and Engram.
- Branch prepared from current `origin/main`.
- Read-only exploration mapped the current markup, styles, responsive rules, favicon absence, and verification commands.
- HH-1 changed only `index.html` and `style.css`; writer and independent verifier both report `npm run check` and `git diff --check` passing.
- Parent readback confirmed selectors and IDs remain intact. Native risk assessment was unavailable, so verification followed the high-risk fallback with an independent verifier.
- User confirmed the local browser result is satisfactory, completing HH-2.

## Next step
Commit the completed work unit, open a PR linked to issue #5, wait for CI, and merge it into `main`.
