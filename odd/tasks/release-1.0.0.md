# Release 1.0.0

## Goal

Prepare a professional, reproducible, provenance-backed first public release of `pi-theme-builder` as npm version `1.0.0`, using the exact Git tag `1.0.0` without a `v` prefix.

## Decisions

- npm version: `1.0.0`
- Git tag: `1.0.0`
- Publication path: trusted GitHub Actions workflow, never an ambient local `npm publish`
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

- [ ] **Build trusted release automation**
  - Add a GitHub Actions publication workflow for exact SemVer tags without a `v` prefix.
  - Bind tag, package version, checkout, and current remote `main` before publication.
  - Use npm trusted publishing/OIDC provenance and least privilege.
  - Add Node 22.19.0 and Node 24 compatibility coverage without duplicating expensive browser work.
  - Evidence: pending.

- [ ] **Verify the release candidate**
  - Validate package contents, types, loader smoke test, browser suite, workflow syntax, release guards, and clean repository state.
  - Confirm the npm name is still available and document the external trusted-publisher setup required before tagging.
  - Evidence: pending.

## Acceptance criteria

- `package.json` and lockfile identify version `1.0.0`.
- Tag `1.0.0` is the only accepted release trigger and must match package version exactly.
- The publish job uses GitHub OIDC provenance and no repository-stored long-lived npm token.
- Release workflow publishes only a tag whose peeled commit is the current remote `main` commit.
- Package checks pass on Node 22.19.0 and Node 24; Playwright remains covered once.
- Media URLs are immutable and resolve after tag creation.
- The npm tarball remains minimal and excludes gallery/development assets.
- `CHANGELOG.md` and `SECURITY.md` are accurate and release-facing.
- No tag, GitHub Release, or npm publication occurs before preparation merges and external npm trusted publishing is confirmed.
