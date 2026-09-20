#!/usr/bin/env node
// Deterministic packed-package smoke test.
//
// 1. Packs the package with npm and validates the tarball contents.
// 2. Installs the tarball into a fresh temporary project together with the
//    pinned @earendil-works/pi-coding-agent runtime.
// 3. Loads the extension through Pi's own extension loader and verifies that
//    the theme-builder command registers without errors.
//
// The temporary directory and the tarball are removed afterward, even on failure.

import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The script normally derives the repository root from its own location, but
// the recovery workflow copies this harness to RUNNER_TEMP before detaching to
// the frozen tag and must point it back at the frozen checkout. REPO_ROOT is
// that override; it defaults to the script's own parent directory so the
// normal `npm run test:package` path keeps working unchanged.
const root = resolve(process.env.REPO_ROOT ?? resolve(fileURLToPath(new URL("..", import.meta.url))));

const REQUIRED_FILES = [
  "package.json",
  "extensions/index.ts",
  "app.js",
  "index.html",
  "style.css",
  "LICENSE",
];

// Development artifacts that must never ship in the published tarball.
const FORBIDDEN_PREFIXES = [
  "tests/",
  ".github/",
  "scripts/",
  "odd/",
  "node_modules/",
  "test-results/",
  "playwright-report/",
  ".codegraph/",
];

const FORBIDDEN_FILES = new Set([
  "package-lock.json",
  "tsconfig.json",
  "playwright.config.js",
  ".gitignore",
]);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.status !== 0) {
    throw new Error(
      `Command failed (${command} ${args.join(" ")}) exit ${result.status}:\n${result.stdout ?? ""}${result.stderr ?? ""}`,
    );
  }
  return result;
}

function fail(message) {
  throw new Error(message);
}

// `npm pack --json` has emitted two shapes across CLI versions:
//   - npm 10 / npm 11: a single-element array  [{ name, version, filename, files, ... }]
//   - npm 12:           an object keyed by package name  { "<name>": { ... } }
// Accept both, but only when the output is unambiguous: exactly one artifact
// whose reported name and version match the package being packed.
function selectArtifact(packed, pkgName, pkgVersion) {
  let artifact;
  if (Array.isArray(packed)) {
    if (packed.length !== 1) {
      fail(`npm pack reported ${packed.length} artifacts; expected exactly one`);
    }
    artifact = packed[0];
  } else if (packed !== null && typeof packed === "object") {
    const keys = Object.keys(packed);
    if (keys.length !== 1) {
      fail(`npm pack reported ${keys.length} top-level entries; expected exactly one keyed by package name`);
    }
    if (keys[0] !== pkgName) {
      fail(`npm pack keyed its output by "${keys[0]}", expected "${pkgName}"`);
    }
    artifact = packed[keys[0]];
  } else {
    fail("npm pack returned an unrecognized --json shape");
  }

  if (artifact === null || typeof artifact !== "object" || Array.isArray(artifact)) {
    fail("npm pack returned a malformed artifact entry");
  }
  if (artifact.name !== pkgName) {
    fail(`npm pack artifact name "${artifact.name}" does not match package "${pkgName}"`);
  }
  if (artifact.version !== pkgVersion) {
    fail(`npm pack artifact version "${artifact.version}" does not match package version "${pkgVersion}"`);
  }
  if (typeof artifact.filename !== "string" || artifact.filename.length === 0) {
    fail("npm pack did not report a tarball filename");
  }
  if (!Array.isArray(artifact.files)) {
    fail("npm pack did not report a tarball file list");
  }
  return artifact;
}

async function main() {
  // 0. Read the package identity up front so npm pack's --json output can be
  //    cross-checked against it regardless of which CLI shape it emits.
  const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));

  // 1. Pack the package and capture its contents.
  const pack = run("npm", ["pack", "--json"], { cwd: root });
  const packed = JSON.parse(pack.stdout);
  const artifact = selectArtifact(packed, pkg.name, pkg.version);
  const tarball = join(root, artifact.filename);
  const files = new Set(artifact.files.map((entry) => entry.path));

  // 2. Validate tarball contents.
  for (const required of REQUIRED_FILES) {
    if (!files.has(required)) fail(`Packed tarball is missing required file: ${required}`);
  }
  for (const file of files) {
    if (FORBIDDEN_FILES.has(file)) fail(`Packed tarball contains forbidden file: ${file}`);
    if (FORBIDDEN_PREFIXES.some((prefix) => file.startsWith(prefix))) {
      fail(`Packed tarball contains forbidden path: ${file}`);
    }
  }

  // 3. Resolve the pinned Pi runtime version from the lockfile so the smoke
  //    test always validates against the same runtime as the rest of the repo.
  const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const piVersion = lock.packages?.["node_modules/@earendil-works/pi-coding-agent"]?.version;
  if (!piVersion) fail("Could not resolve @earendil-works/pi-coding-agent version from package-lock.json");

  const tempDir = await mkdtemp(join(tmpdir(), "pi-theme-builder-smoke-"));
  try {
    // 4. Install the tarball and the Pi runtime into the clean project.
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify(
        {
          name: "pi-theme-builder-smoke",
          private: true,
          version: "0.0.0",
          dependencies: {
            "pi-theme-builder": `file:${tarball}`,
            "@earendil-works/pi-coding-agent": piVersion,
          },
        },
        null,
        2,
      ) + "\n",
    );
    run("npm", ["install", "--no-audit", "--no-fund", "--no-package-lock"], { cwd: tempDir });

    // 5. Load the extension through Pi's real loader, isolated from the local
    //    and global extension directories by an empty temporary agent dir.
    const loaderScript = `
import { discoverAndLoadExtensions } from "@earendil-works/pi-coding-agent";
import { join } from "node:path";

const cwd = process.cwd();
const extensionDir = join(cwd, "node_modules", "pi-theme-builder", "extensions");
const agentDir = join(cwd, ".pi-agent-smoke");
const result = await discoverAndLoadExtensions([extensionDir], cwd, agentDir);

if (result.errors.length > 0) {
  console.error("Pi failed to load the extension:");
  for (const item of result.errors) console.error("  " + item.path + ": " + item.error);
  process.exit(1);
}
if (result.extensions.length !== 1) {
  console.error("Expected exactly one loaded extension, got " + result.extensions.length);
  process.exit(1);
}
const commands = result.extensions[0].commands;
if (!commands || !commands.has("theme-builder")) {
  console.error("theme-builder command was not registered by the extension");
  process.exit(1);
}
console.log("Smoke test passed: Pi loaded the packed extension and registered the theme-builder command.");
`;
    await writeFile(join(tempDir, "load-extension.mjs"), loaderScript);
    const load = run(process.execPath, ["load-extension.mjs"], { cwd: tempDir });
    if (load.stdout.trim()) console.log(load.stdout.trim());
  } finally {
    await rm(tempDir, { recursive: true, force: true });
    await rm(tarball, { force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
