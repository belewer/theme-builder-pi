# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-20

First stable release of Pi Theme Builder, a self-contained browser-based editor for Pi coding-agent themes.

### Added

- Visual editor for all 56 Pi theme tokens across 7 groups (Core, Backgrounds & content, Markdown, Tool diffs, Syntax, Thinking borders, and Bash mode), each with a native color picker and text field.
- Five live preview modes — Full Session, State gallery, Syntax / Markdown, Thinking / Bash, and HTML export — that show every token where it actually appears in Pi.
- Token-to-preview focus navigation: clicking a token switches to the mode that demonstrates it, scrolls to the target, and highlights it.
- Variable management with import, resolution, reference counts, and add/edit/rename/delete, including cycle detection and rejection.
- Faithful xterm (0–255) and empty terminal-default value previews via browser RGB approximations, without altering the exported value.
- Undo/reset with a 30-step change history and preset switching.
- Theme import/export (JSON) with direct integration into a running Pi session: list, load, save, activate, and set-as-default through Pi's real theme directory.
- Pi sessions menu for listing, locally viewing, and importing validated JSONL sessions.
- `/theme-builder` Pi command and loopback-only (`127.0.0.1`, random port) serving with a per-run secret token for every `/api/` request.
- Restrictive `Content-Security-Policy` on editor responses, plus `X-Content-Type-Options: nosniff` and `Cache-Control: no-store`.
- Safe theme-filename validation, theme/session size limits (1 MB / 5 MB), and atomic writes (`0600` permissions) scoped to Pi's themes directory.
- `npm`, Git, and local-checkout installation paths.

### Changed

- Narrowed the `@earendil-works/pi-coding-agent` peer dependency to the tested compatible range `>=0.85.1 <1` and marked it optional via `peerDependenciesMeta` (the import is type-only; Pi hosts the extension at runtime).
- Pinned every README media URL and the `pi.image`/`pi.video` metadata URLs to the immutable Git tag `1.0.0`.

### Release engineering

- Added a `prepublishOnly` script that runs the syntax check (`node --check`), the strict extension type check (`tsc --noEmit`), and the packed-package loader smoke test.
- Added `publishConfig` declaring public npm access and npm provenance.
- Added this changelog and `SECURITY.md`.
