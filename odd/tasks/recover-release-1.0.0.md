# Recover release 1.0.0

## Goal

Publish the already-created, immutable annotated tag `1.0.0` after the original GitHub Actions run failed before publication because `actions/checkout` materialized the runner-local tag ref as a lightweight commit ref.

## Frozen recovery identity

- Package: `pi-theme-builder@1.0.0`
- Remote annotated tag object: `1ac644988c3650fad9d0e7600a0dc306faaeea96`
- Peeled release commit: `be9381c9864642fe94fcd46356e0197b4746f23f`
- Original failed workflow run: `35515410380`
- npm state at recovery start: package/version absent (E404)

## Decisions

- Never move, delete, recreate, or force-update tag `1.0.0`.
- Use a one-time, manually dispatched recovery workflow defined on protected `main`.
- Pin the recovery workflow to the exact tag object, peeled commit, package name, and version above.
- Force-fetch the real annotated tag object inside the ephemeral runner before validation.
- Publish bytes exclusively from the immutable tagged tree, not from current `main`.
- Retain protected Environment `npm`, maintainer approval, bootstrap token authentication, and GitHub OIDC provenance.
- Remove no audit evidence; the exceptional recovery path must be explicit and self-disabling once npm reports the version exists.

## Tasks

- [x] **Implement bounded recovery workflow**
  - Added an exact-identity recovery validator and no-input manual workflow.
  - Bound the remote tag object, peeled commit, tree, package, version, failed run, dispatch branch, and npm absence without changing the tag.
  - The workflow checks out and tests only the tagged tree, requires the bootstrap secret, and publishes with provenance.
  - Fixed future tag workflows by force-materializing the annotated tag object using safely quoted runner environment data.
  - Evidence: pre/post happy paths and ten negative paths passed; independent adversarial verification and shell-injection/token-handling re-verification passed. Commit: this bounded-recovery work-unit commit.

- [ ] **Deliver and execute recovery**
  - Create an approved issue and PR, require CI, and merge the recovery workflow to `main`.
  - Dispatch the recovery from `main`, approve the protected environment, and watch it to completion.
  - Verify npm metadata, tarball contents, provenance, tag URLs, and create the GitHub Release.
  - Evidence: pending.

- [ ] **Migrate to npm Trusted Publishing**
  - Configure the npm Trusted Publisher for owner `belewer`, repository `theme-builder-pi`, workflow `publish.yml`, environment `npm`.
  - Delete the temporary `NPM_TOKEN` environment secret and revoke the bootstrap token.
  - Evidence: pending manual npm configuration.

## Acceptance criteria

- Remote tag object and peeled commit remain unchanged.
- Recovery can target only `pi-theme-builder@1.0.0` at the frozen tag object and commit.
- The workflow source comes from current protected `main`, while package contents come from the frozen tag tree.
- All package and Playwright checks pass before publication.
- npm reports exactly `pi-theme-builder@1.0.0` with provenance.
- GitHub Release `1.0.0` exists and points to the original tag.
- No reusable bypass remains for arbitrary historical tags.
