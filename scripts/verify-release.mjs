#!/usr/bin/env node
// Deterministic release-invariant verification for npm publishes.
//
// Verifies, before any publish:
//   1. The release tag matches strict stable SemVer (X.Y.Z; no "v" prefix,
//      no pre-release suffix, no build metadata, no leading zeros).
//   2. The tag is an annotated tag object (never a lightweight tag).
//   3. package.json `version` equals the tag exactly.
//   4. The checked-out commit equals the peeled tag commit.
//   5. The remote `origin/main` branch equals that same commit.
//   6. The working tree is clean (no tracked or untracked changes).
//   7. The exact `name@version` is not already published to the registry.
//
// The script never mutates git state, never creates tags, and never publishes.
// Exit code is 0 only when every invariant holds. Usage:
//
//   node scripts/verify-release.mjs 1.0.0
//
// Without an argument it reads the tag from GITHUB_REF_NAME and additionally
// requires GITHUB_REF_TYPE to be "tag" when present.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Strict stable SemVer: three numeric dot-separated components with no leading
// zeros (except a lone "0"), no "v" prefix, no pre-release, no build metadata.
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function run(command, args) {
  return spawnSync(command, args, { cwd: root, encoding: "utf8" });
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

function resolveTag() {
  const fromCli = process.argv[2];
  if (fromCli) {
    return fromCli;
  }
  const refType = process.env.GITHUB_REF_TYPE;
  if (refType && refType !== "tag") {
    fail(`GITHUB_REF_TYPE is "${refType}", but a tag push is required`);
  }
  const refName = process.env.GITHUB_REF_NAME;
  if (refName) {
    return refName;
  }
  fail('No tag to verify: pass it as an argument (e.g. "node scripts/verify-release.mjs 1.0.0") or set GITHUB_REF_NAME');
}

function readPackage() {
  const raw = readFileSync(join(root, "package.json"), "utf8");
  return JSON.parse(raw);
}

function assertStableSemver(tag) {
  if (!SEMVER_RE.test(tag)) {
    fail(`tag "${tag}" is not strict stable SemVer (expected X.Y.Z with no "v" prefix, no pre-release, no build metadata, no leading zeros)`);
  }
  pass(`tag "${tag}" matches strict stable SemVer`);
}

function assertAnnotatedTag(tag) {
  const result = run("git", ["cat-file", "-t", tag]);
  if (result.status !== 0) {
    fail(`tag "${tag}" does not exist locally:\n${(result.stderr || result.stdout || "").trim()}`);
  }
  const kind = result.stdout.trim();
  if (kind !== "tag") {
    fail(`tag "${tag}" is a lightweight tag (git object type "${kind}"); an annotated tag is required`);
  }
  pass(`tag "${tag}" is an annotated tag`);
}

function assertVersionMatches(tag, pkg) {
  if (pkg.version !== tag) {
    fail(`package.json version "${pkg.version}" does not equal the tag "${tag}" exactly`);
  }
  pass(`package.json version equals the tag ("${tag}")`);
}

function assertPeeledTagMatchesHead(tag) {
  const peeled = git(["rev-parse", `${tag}^{commit}`]);
  const head = git(["rev-parse", "HEAD"]);
  if (peeled !== head) {
    fail(`checked-out commit ${head} does not match the peeled tag commit ${peeled}`);
  }
  pass(`checked-out commit equals the peeled tag commit (${head.slice(0, 12)})`);
}

function assertRemoteMainMatches(commit) {
  const result = run("git", ["rev-parse", "--verify", "refs/remotes/origin/main"]);
  if (result.status !== 0) {
    fail('cannot resolve "refs/remotes/origin/main"; run "git fetch origin main" before releasing');
  }
  const remoteMain = result.stdout.trim();
  if (remoteMain !== commit) {
    fail(`remote origin/main (${remoteMain}) does not match the release commit (${commit})`);
  }
  pass(`remote origin/main equals the release commit (${commit.slice(0, 12)})`);
}

function assertCleanTree() {
  const status = git(["status", "--porcelain"]);
  if (status.trim() !== "") {
    fail(`working tree is not clean:\n${status}`);
  }
  pass("working tree is clean");
}

function assertNotPublished(name, version) {
  const result = run("npm", ["view", `${name}@${version}`, "version"]);
  if (result.status === 0) {
    fail(`${name}@${version} already exists in the registry; tags are immutable, so pick a new version`);
  }
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (!/E404/i.test(output) && !/404/i.test(output)) {
    fail(`could not determine whether ${name}@${version} is already published (npm view exited ${result.status}):\n${output.trim()}`);
  }
  pass(`${name}@${version} is not already published`);
}

function main() {
  const tag = resolveTag();
  const pkg = readPackage();

  assertStableSemver(tag);
  assertAnnotatedTag(tag);
  assertVersionMatches(tag, pkg);
  assertPeeledTagMatchesHead(tag);
  assertRemoteMainMatches(git(["rev-parse", "HEAD"]));
  assertCleanTree();
  assertNotPublished(pkg.name, pkg.version);

  console.log(`\nAll release invariants verified for ${pkg.name}@${tag}.`);
}

main();
