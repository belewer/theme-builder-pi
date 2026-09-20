# Release 1.0.0

## Goal

Prepare a professional, reproducible, provenance-backed first public release of `pi-theme-builder` as npm version `1.0.0`, using the exact Git tag `1.0.0` without a `v` prefix.

## Decisions

- npm version: `1.0.0`
- Git tag: `1.0.0`
- Publication path: GitHub Actions only, never an ambient local `npm publish`; bootstrap `1.0.0` signs provenance via GitHub OIDC and authenticates to the registry with a short-lived npm token (the narrowest capable of creating a new public package — the package cannot be package-scoped before it exists) because npm cannot attach an OIDC trusted publisher before the package exists, then future releases use OIDC Trusted Publishing with the same workflow after the token is deleted
- Gallery and README media URLs: immutable `1.0.0` tag URLs
- Supported Node.js line: test the declared floor (`22.19.0`) and current Node 24
- Publication, tag creation, and GitHub Release remain separate delivery actions after the preparation PR and required external npm trusted-publisher configuration are verified.

## Tasks

- [x] **Harden package and release metadata**
  - Set version `1.0.0` consistently.
  - Narrowed the Pi peer range to `>=0.85.1 <1` and marked the type-only peer optional.
  - Added public/provenance publish configuration and a prepublish validation guard.
  - Pinned gallery and README media to the immutable `1.0.0` tag.
  - Added user-facing changelog and security policy.
  - Evidence: `npm run check`, `npm run typecheck`, `npm run test:package`, `npm run prepublishOnly`, and `npm pack --dry-run` passed; independent verification passed. Commit: this release-metadata work-unit commit.

- [x] **Build trusted release automation**
  - Added a GitHub Actions publication workflow for exact SemVer tags without a `v` prefix.
  - Bound tag, package version, checkout, and current remote `main` before publication.
  - Added least-privilege OIDC provenance for `1.0.0`, temporary token bootstrap authentication, and future npm Trusted Publishing support.
  - Added Node 22.19.0 and Node 24 compatibility coverage without duplicating expensive browser work.
  - Added `scripts/verify-release.mjs` and `docs/RELEASING.md`.
  - Evidence: `node --check scripts/verify-release.mjs`, `npm run check`, `npm run typecheck`, `npm run test:package` passed; `npm view pi-theme-builder@1.0.0` confirms the name is available (E404). Commit: this release-automation work-unit commit.

- [x] **Verify the release candidate**
  - PR #14 exposed and remediated npm-version-dependent installation of the optional Pi peer: the runtime peer remains optional while tested 0.85.x types are an explicit dev dependency.
  - Local clean-install, typecheck, package, prepublish, loader-smoke, tarball, workflow, and release-invariant verification passed.
  - Remote CI passed on exact Node 22.19.0 and Node 24, and all 8 Playwright tests passed on Node 24.
  - Confirmed `pi-theme-builder@1.0.0` remains unpublished and retained the documented external npm bootstrap gate.
  - Evidence: CI run `35502317843` passed all three jobs. Commits: `e9426c3` plus this final verification record.

## Acceptance criteria

- `package.json` and lockfile identify version `1.0.0`.
- Tag `1.0.0` is the only accepted release trigger and must match package version exactly.
- The publish job signs provenance on every release starting with `1.0.0`; the first release authenticates to the registry with only a short-lived token (the narrowest capable of creating a new public package, since the package cannot be package-scoped before it exists) stored in a protected GitHub Environment, which must be deleted immediately after configuring npm Trusted Publishing.
- Release workflow publishes only a tag whose peeled commit is the current remote `main` commit.
- Package checks pass on Node 22.19.0 and Node 24; Playwright remains covered once.
- Media URLs are immutable and resolve after tag creation.
- The npm tarball remains minimal and excludes gallery/development assets.
- `CHANGELOG.md` and `SECURITY.md` are accurate and release-facing.
- No tag, GitHub Release, or npm publication occurs before preparation merges and external npm trusted publishing is confirmed.
