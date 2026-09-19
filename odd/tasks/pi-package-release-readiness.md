# Pi package release readiness

## Goal

Prepare `pi-theme-builder` for a reliable public npm release and discovery in the pi.dev package gallery, without publishing yet.

## Decisions

- npm package name: `pi-theme-builder`
- License: MIT
- Delivery: local Conventional Commits per completed work unit
- Publication is explicitly out of scope until separately authorized.

## Tasks

- [x] **Package metadata and runtime compatibility**
  - Replaced the deprecated Pi package scope.
  - Added publish-safe package contents, Node engine metadata, and MIT license.
  - Refreshed the lockfile and verified the packed artifact contents.
  - Evidence: `npm run check`, `npm pack --dry-run`, `npm ci --dry-run`; independent verification passed. Commit: `5835013`.

- [x] **Quality gates and CI**
  - Added strict TypeScript validation for the extension.
  - Added tarball validation and a clean install/load smoke test through Pi's real extension loader.
  - Retained browser syntax checks and the Playwright CI job.
  - Evidence: `npm run check`, `npm run typecheck`, and `npm run test:package` passed; independent verification passed. Local e2e execution remains environment-skipped because the host lacks Chromium system library `libnspr4.so`. Commit: pending.

- [ ] **Release-facing documentation and gallery presentation**
  - Remove machine-specific instructions.
  - Document npm installation, requirements, security boundaries, and verification.
  - Add gallery preview metadata only when a stable public asset URL is available.
  - Evidence: pending.

## Acceptance criteria

- `npm pack --dry-run` includes every runtime asset and excludes development artifacts.
- The extension typechecks against the current `@earendil-works/pi-coding-agent` API.
- Existing checks and end-to-end tests pass.
- A clean packed-package smoke test demonstrates that Pi can load the extension.
- README installation instructions work for the intended npm package.
- Nothing is pushed or published without separate user authorization.
