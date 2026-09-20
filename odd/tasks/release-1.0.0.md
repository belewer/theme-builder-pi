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
  - Validated package contents, clean-install type resolution, loader smoke, prepublish guard, workflow structure, release invariants, documentation, and repository scope.
  - Confirmed `pi-theme-builder@1.0.0` remains unpublished and no local/remote tag or GitHub Release exists.
  - Confirmed the external bootstrap gate: create/protect GitHub Environment `npm`, add a short-lived all-packages write `NPM_TOKEN`, then delete it after `1.0.0` and configure npm Trusted Publishing for `publish.yml`.
  - Evidence: independent release-candidate verification passed. Local E2E remains environment-blocked by missing `libnspr4.so`; the release workflow installs Chromium system dependencies and the merged baseline previously passed all 8 Playwright tests. Commit: this release-candidate verification work-unit commit.

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
