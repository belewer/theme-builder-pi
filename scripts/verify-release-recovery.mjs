#!/usr/bin/env node
// Deterministic one-time recovery validator for pi-theme-builder@1.0.0.
//
// Background: the normal release path (scripts/verify-release.mjs) failed for
// the first release because actions/checkout dereferences an annotated tag and
// stores only its peeled commit as a lightweight runner-local ref, so the
// annotated tag object never reached the runner (failed run 35515410380).
// This validator is the exceptional recovery path: every release identity is a
// compile-time constant, there are no inputs, and it refuses to publish
// anything except the already-created immutable tag. It is intentionally
// non-reusable and permanently self-disabling — once npm reports 1.0.0, it
// fails closed and can never publish again.
//
// It never mutates git state, never creates or moves tags, and never publishes.
//
// Phases:
//   pre  — before checkout: verify the dispatch context, the force-fetched
//          annotated tag object, its peeled commit, the tagged tree bytes, that
//          the frozen commit is still part of remote main's history, and that
//          npm does not already have 1.0.0.
//   post — after detached checkout of the frozen commit: everything in `pre`,
//          plus HEAD == frozen commit, package.json name/version, and a clean
//          working tree.
//
// Usage (from the repository root):
//   node scripts/verify-release-recovery.mjs pre
//   node scripts/verify-release-recovery.mjs post

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The script runs from the repository root; REPO_ROOT is honored only as an
// explicit override. The script is copied out of the repository before the
// detached checkout, so it must not assume it lives inside the work tree.
const ROOT = resolve(process.env.REPO_ROOT ?? process.cwd());

// Frozen 1.0.0 release identity. Do not change any of these: they pin the
// recovery to the exact, already-created immutable release and are the whole
// point of this one-time workflow.
const FROZEN = {
  packageName: "pi-theme-builder",
  version: "1.0.0",
  tagName: "1.0.0",
  // Annotated tag object (git object type "tag", not a lightweight ref).
  tagObject: "1ac644988c3650fad9d0e7600a0dc306faaeea96",
  // The commit the tag peels to (the tagged-tree root commit).
  peeledCommit: "be9381c9864642fe94fcd46356e0197b4746f23f",
  // The tree object of the peeled commit: this pins every byte of the tagged
  // tree, because each blob hash is recorded inside the tree.
  tree: "7742ad133abf30a0421bb5129288ca23acc721c2",
  // Original workflow run that failed before publication (documentation only;
  // kept to preserve the explicit incident audit trail).
  failedRun: "35515410380",
};

function run(command, args) {
  return spawnSync(command, args, { cwd: ROOT, encoding: "utf8" });
}

function git(args) {
  const result = run("git", args);
  if (result.status !== 0) {
    fail(`git ${args.join(" ")} failed (exit ${result.status}):\n${(result.stderr || result.stdout || "").trim()}`);
  }
  return result.stdout.trim();
}

function fail(message) {
  console.error(`\u2717 ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`\u2713 ${message}`);
}

function assertDispatchFromMain() {
  const refType = process.env.GITHUB_REF_TYPE;
  const refName = process.env.GITHUB_REF_NAME;
  if (refType !== "branch" || refName !== "main") {
    fail(`recovery must be dispatched from main (got ref_type="${refType}", ref_name="${refName}"); refusing to run`);
  }
  pass("dispatched from main");
}

function assertFrozenIdentity() {
  if (FROZEN.tagName !== FROZEN.version) {
    fail("frozen tag name and version diverge; the recovery identity is internally inconsistent");
  }
  pass("frozen recovery identity is internally consistent");
}

function assertTagObject() {
  const resolved = git(["rev-parse", "--verify", `refs/tags/${FROZEN.tagName}`]);
  if (resolved !== FROZEN.tagObject) {
    fail(`tag object mismatch: local refs/tags/${FROZEN.tagName} is ${resolved}, expected ${FROZEN.tagObject}`);
  }
  const kind = git(["cat-file", "-t", resolved]);
  if (kind !== "tag") {
    fail(`refs/tags/${FROZEN.tagName} is a ${kind} object, not an annotated tag`);
  }
  pass(`annotated tag object matches the frozen identity (${resolved.slice(0, 12)})`);
}

function assertPeeledCommit() {
  const peeled = git(["rev-parse", `${FROZEN.tagName}^{commit}`]);
  if (peeled !== FROZEN.peeledCommit) {
    fail(`peeled commit mismatch: ${peeled}, expected ${FROZEN.peeledCommit}`);
  }
  pass(`peeled commit matches the frozen identity (${peeled.slice(0, 12)})`);
}

function assertTaggedTree() {
  const tree = git(["rev-parse", `${FROZEN.peeledCommit}^{tree}`]);
  if (tree !== FROZEN.tree) {
    fail(`tagged tree mismatch: ${tree}, expected ${FROZEN.tree}`);
  }
  pass(`tagged tree bytes match the frozen identity (${tree.slice(0, 12)})`);
}

function assertRemoteMainContainsRelease() {
  const result = run("git", ["merge-base", "--is-ancestor", FROZEN.peeledCommit, "refs/remotes/origin/main"]);
  if (result.status !== 0) {
    fail(`remote origin/main does not contain the frozen release commit ${FROZEN.peeledCommit}; run "git fetch origin main" first`);
  }
  pass("remote origin/main still contains the frozen release commit");
}

function assertNotPublished() {
  const result = run("npm", ["view", `${FROZEN.packageName}@${FROZEN.version}`, "version"]);
  if (result.status === 0) {
    fail(`${FROZEN.packageName}@${FROZEN.version} already exists in the registry; the recovery path is permanently self-disabled`);
  }
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (!/E404/i.test(output) && !/404/i.test(output)) {
    fail(`could not determine whether ${FROZEN.packageName}@${FROZEN.version} is already published (npm view exited ${result.status}):\n${output.trim()}`);
  }
  pass(`${FROZEN.packageName}@${FROZEN.version} is not already published`);
}

function assertHeadMatchesPeeled() {
  const head = git(["rev-parse", "HEAD"]);
  if (head !== FROZEN.peeledCommit) {
    fail(`checked-out HEAD is ${head}, expected the frozen release commit ${FROZEN.peeledCommit}`);
  }
  pass(`HEAD is the frozen release commit (${head.slice(0, 12)})`);
}

function assertPackageIdentity() {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
  if (pkg.name !== FROZEN.packageName) {
    fail(`package.json name "${pkg.name}" does not match the frozen package "${FROZEN.packageName}"`);
  }
  if (pkg.version !== FROZEN.version) {
    fail(`package.json version "${pkg.version}" does not match the frozen version "${FROZEN.version}"`);
  }
  pass(`package.json name and version match the frozen identity (${pkg.name}@${pkg.version})`);
}

function assertCleanTree() {
  const status = git(["status", "--porcelain"]);
  if (status.trim() !== "") {
    fail(`working tree is not clean:\n${status}`);
  }
  pass("working tree is clean");
}

function main() {
  const phase = process.argv[2] ?? "pre";

  assertDispatchFromMain();
  assertFrozenIdentity();
  assertTagObject();
  assertPeeledCommit();
  assertTaggedTree();
  assertRemoteMainContainsRelease();
  assertNotPublished();

  if (phase === "post") {
    assertHeadMatchesPeeled();
    assertPackageIdentity();
    assertCleanTree();
  } else if (phase !== "pre") {
    fail(`unknown phase "${phase}" (expected "pre" or "post")`);
  }

  console.log(`\nAll recovery invariants verified for ${FROZEN.packageName}@${FROZEN.version} (phase: ${phase}, original failed run ${FROZEN.failedRun}).`);
}

main();
