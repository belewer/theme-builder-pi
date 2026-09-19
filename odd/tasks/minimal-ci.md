# Feature: Minimal continuous integration

## Goal
Add a small, reliable GitHub Actions workflow that checks the JavaScript application without introducing tooling the repository does not yet support.

## Tasks
1. [done] Add a repository check script and GitHub Actions workflow for pull requests and pushes to `main`.
2. [done] Verify the workflow definition and local check command.
3. [in progress] Commit the work unit and open a concise English pull request linked to issue #3.

## Non-goals
- Adding a full test framework.
- Adding TypeScript compilation before the extension has an explicit build setup.
- Release or publishing automation.

## Delivery evidence
- Issue: https://github.com/belewer/theme-builder-pi/issues/3 (`enhancement`, `status:approved`)
- Branch: `ci/basic-checks`
- Verification: `npm run check`, JSON parsing, workflow structural readback, and whitespace checks passed. No YAML parser was installed; no dependencies were added for verification.
- Commit: pending
- Pull request: pending
