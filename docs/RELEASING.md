# Releasing pi-theme-builder

`pi-theme-builder` is published to npm only through the protected GitHub Actions
workflow in `.github/workflows/publish.yml`. There is no ambient local
`npm publish`, and no long-lived npm token is committed to the repository.

## Release model

- One immutable, annotated Git tag per release, named with strict SemVer and no
  `v` prefix (for example `1.0.0`).
- The tag, the `package.json` `version`, and the published npm version are
  always identical.
- The tag's peeled commit must be the tip of `main`, and the workflow refuses to
  publish otherwise.
- Tags are never deleted, moved, reused, or re-pointed. If a release is broken,
  fix forward with a new version and a new tag.

## Prerequisites

1. Write access to `belewer/theme-builder-pi` and its default branch `main`.
2. A protected GitHub Environment named `npm` (Settings → Environments → `npm`)
   whose deployment protection accepts the release tag pattern (see
   "Environment protection" below), containing the Environment secret
   `NPM_TOKEN` for the first release only.
3. Node.js and npm available locally to run the validation commands.

## Environment protection

The publish workflow runs on `push.tags`, so GitHub Environments cannot gate it
on `main`: a branch rule would never match a tag push. Configure the `npm`
Environment's deployment tags with the coarse pattern
`[0-9]*.[0-9]*.[0-9]*`, and add any `main` context you need for administrative
runs. GitHub's tag pattern matcher is coarse (glob, not SemVer): it accepts
more than strict stable SemVer, so it is only a first line of defense. The
authoritative gate is `scripts/verify-release.mjs`, which rejects pre-releases,
build metadata, leading zeros, and anything outside `X.Y.Z`.

## Automated checks

`.github/workflows/ci.yml` runs `npm run check`, `npm run typecheck`, and
`npm run test:package` on an explicit Node matrix of `22.19.0` and `24`, and
runs the Playwright E2E suite once on Node `24`.

`scripts/verify-release.mjs` deterministically verifies every release invariant
before publish:

- the tag matches strict stable SemVer `X.Y.Z` (no `v`, no pre-release, no build
  metadata, no leading zeros);
- the tag is annotated;
- `package.json` `version` equals the tag exactly;
- the checked-out commit equals the peeled tag commit;
- remote `origin/main` equals that commit;
- the working tree is clean;
- the exact `name@version` is not already published.

Run it locally with:

```sh
git fetch origin main
node scripts/verify-release.mjs 1.0.0
```

## First release (bootstrap) — `1.0.0`

npm cannot attach an OIDC Trusted Publisher to a package before its first
version exists, so the first release authenticates to the registry with a
one-time, short-lived `NPM_TOKEN` instead. Provenance is a separate concern:
`npm publish --provenance` asks the GitHub OIDC provider to sign a sigstore
attestation, and that signing works on the very first publish. Provenance
therefore begins with `1.0.0`, while Trusted Publishing (OIDC registry
authentication) begins with the first release after the token is deleted.

1. Create the protected GitHub Environment `npm` (Settings → Environments →
   `npm`) with required reviewers. Because the workflow is tag-triggered, set
   the environment's deployment tags to the pattern `[0-9]*.[0-9]*.[0-9]*`
   (plus any `main` context you need for administration) instead of restricting
   deployment to `main`; see "Environment protection" above. Then add an
   Environment secret named `NPM_TOKEN`: because the package does not exist yet
   it cannot be package-scoped, so use the narrowest short-lived automation
   token capable of creating a new public package (typically an all-packages
   write token). Store it only as this protected environment secret and delete
   it immediately after bootstrap. Set a short expiry.
2. Merge the preparation PR to `main`.
3. Create and push the annotated tag (only after `main` matches the release
   commit):

   ```sh
   git tag -a 1.0.0 -m "Release 1.0.0"
   git push origin 1.0.0
   ```

4. The `publish.yml` workflow triggers, verifies the invariants, runs `npm ci`,
   all package checks, the E2E suite with Chromium, and publishes with
   `npm publish --access public --provenance`. This first publish authenticates
   to the registry with the `NPM_TOKEN` while GitHub OIDC signs the provenance
   attestation, so `1.0.0` is provenance-backed.
5. Verify the publish (see "Post-publish verification"), then complete the OIDC
   migration below.

The bootstrap token is strictly temporary. It is never a permanent
authentication path.

## OIDC migration (after `1.0.0`)

Once `1.0.0` exists on the registry:

1. In npm, add a Trusted Publisher for the package with:
   - owner `belewer`,
   - repository `theme-builder-pi`,
   - workflow file `publish.yml`,
   - environment `npm`.
2. Delete the `NPM_TOKEN` Environment secret from the `npm` GitHub Environment.
3. Confirm the next release runs the OIDC path: the workflow logs "OIDC mode"
   and `npm publish` authenticates to the registry through Trusted Publishing
   (OIDC) while still signing provenance with `--provenance`.

From then on no token is used.

## Post-publish verification

- `npm view pi-theme-builder@1.0.0` returns the published metadata.
- `npm pack pi-theme-builder@1.0.0 --dry-run` shows the shipped files and that
  development assets (`tests/`, `.github/`, `scripts/`, `odd/`,
  `package-lock.json`, etc.) are excluded.
- The GitHub Actions run succeeded and reports the provenance attestation
  (from `1.0.0` onward).
- The npm package page shows the `1.0.0` Git tag, not a later commit.

## Failure handling

- If a publish fails after the tag was pushed, do not move or reuse the tag.
  Fix forward: bump the version, create a new annotated tag, and re-run the
  workflow.
- If the package was partially published, contact npm support; never republish
  the same version, and never delete or overwrite the tag.
- If verification fails, the workflow stops before publish and reports the exact
  failing invariant. Correct the repository state and re-run.

## Never move or reuse tags

Git tags in this project are immutable release markers. Moving, deleting,
force-pushing, or reusing a tag would break the `1.0.0` media URLs, the npm
provenance linkage, and the release audit trail. Any correction requires a new
version and a new tag.
