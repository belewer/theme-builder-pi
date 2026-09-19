# Editor E2E

## Objective

Add a reliable Playwright end-to-end suite for the standalone browser editor and run the same suite locally and in GitHub Actions.

## Problem and rationale

The project currently validates only JavaScript syntax. Browser regressions in editor startup and critical theme-editing workflows can reach `main` undetected. Issue: https://github.com/belewer/theme-builder-pi/issues/9.

## Scope

- Start the standalone editor deterministically on `127.0.0.1`.
- Exercise critical editor workflows in headless Chromium.
- Add local scripts, dependency lockfile, CI execution, and concise documentation.

## Constraints and non-goals

- Do not cover the Pi extension API or real Pi runtime in this PR.
- Do not add browsers beyond Chromium in this first slice.
- Keep tests isolated from persisted browser storage and external services.
- Technical artifacts are written in English.

## Delivery

- Strategy: single-pr
- Forecast: approximately 250–400 authored changed lines, excluding the generated lockfile.
- Branch: `test/editor-e2e`
- Linked issue: #9 (`status:approved`)

## Tasks

- [ ] **E2E-1 — Add the editor Playwright harness and critical-flow tests**
  - Route: delegated (`gentle-ai-worker`); multi-file write and preparation triggers.
  - Expected surfaces: `package.json`, `package-lock.json`, `playwright.config.js`, `scripts/serve.mjs`, `tests/editor.spec.js`, `tests/fixtures/**`.
  - Checks: `npm run check`; `npm run test:e2e`.
  - Evidence: harness implemented; `npm run check` passed. Local Chromium execution is blocked because the WSL host lacks Playwright system libraries and interactive sudo is required. CI will provide the first full browser run.
- [ ] **E2E-2 — Integrate E2E execution into CI and user documentation**
  - Route: delegated (`gentle-ai-worker`); multi-file write trigger.
  - Expected surfaces: `.github/workflows/ci.yml`, `.gitignore`, `README.md`.
  - Checks: workflow structural readback; `npm run check`; `npm run test:e2e`.
  - Evidence: pending.
- [ ] **E2E-3 — Verify and deliver the PR**
  - Route: delegated verification (`gentle-ai-verify`) followed by parent delivery.
  - Checks: clean install, syntax check, Chromium E2E suite, PR checks.
  - Evidence: pending.

## Acceptance criteria

- `npm run test:e2e` starts the editor and passes locally.
- CI installs Chromium and runs the same E2E command.
- Tests cover startup, presets, token editing, search, variables, theme import/export, undo/reset, and preview tabs.
- Tests do not require external services and isolate browser storage.
- Existing `npm run check` remains green.

## Progress

The E2E harness and tests are implemented but E2E-1 remains open until Chromium executes successfully. The local WSL host has no viable browser because 26 Playwright system packages are absent; installing them requires an interactive sudo password. Continue with CI integration so GitHub's runner can install dependencies and provide the first full run.

## Verification evidence

- `npm run check`: passed.
- `npm run test:e2e`: blocked before test execution; Chromium loader cannot find `libnspr4.so`.
- `npx playwright install-deps --dry-run chromium`: reports 26 missing Ubuntu packages.
- Static server smoke checks: expected 200, 404, 405, and traversal rejection responses observed by the delegated writer.

## Next step

Delegate E2E-2, commit the coherent PR candidate, and use CI to complete browser verification.
