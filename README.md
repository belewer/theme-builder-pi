# Pi Theme Builder

A self-contained, vanilla HTML/CSS/JavaScript visual editor for Pi coding-agent themes. It runs entirely in the browser and uses no runtime dependencies, external network calls, command execution, or remote image loading.

## Requirements

- **Node.js** ≥ 22.19.0 (declared in the package `engines` field).
- **Pi** (`@earendil-works/pi-coding-agent`), which hosts the extension. Pi bundles this dependency, so a working Pi installation is sufficient; the package lists it as a `peerDependency`.
- A graphical browser for the editor.

The package has no runtime npm dependencies; it ships only the extension and static browser assets.

## Install from npm

```bash
pi install npm:pi-theme-builder
```

Then start an interactive Pi session and run:

```text
/theme-builder
```

Pi opens the editor in the default browser on a random `127.0.0.1` port. The integration controls can list themes, load one from Pi, save the current draft to Pi's real theme directory, activate the newly saved theme in the current Pi session, or persist it as Pi's startup default.

The session controls list the real sessions found through Pi's active session directory. Select one to view it locally in the existing safe JSONL viewer. You can also import a validated JSONL into the current project's Pi session folder; use Pi's normal `/resume` flow to continue it.

The [pi.dev package gallery](https://pi.dev/packages) lists packages tagged `pi-package`; appearing there is discovery only and does not imply official endorsement by the Pi project.

> Until the package is first published to npm, install from a local checkout or Git instead (next section).

## Install for local development

Install a checkout in place while you work on it:

```bash
pi install /path/to/theme-builder-pi
```

Relative paths work too (`pi install ./theme-builder-pi`). Local-path installs load the package without copying, so edits to `extensions/` take effect the next time Pi starts.

## Security boundaries

- The editor runs entirely in the browser after the page loads. It makes no external network calls, executes no commands, and loads no remote images.
- The `/theme-builder` integration serves only on the loopback interface (`127.0.0.1`) on a random port. Every `/api/` request must carry a per-run secret token in the `x-theme-builder-token` header, so other local processes cannot call the API.
- Static editor responses set a restrictive `Content-Security-Policy`; both static and API responses set `X-Content-Type-Options: nosniff` and `Cache-Control: no-store`. The CSP allows only same-origin scripts, styles, and connections, plus `data:` images.
- The API accepts only safe theme filenames, keeps theme paths inside Pi's themes directory, and enforces size limits (1 MB per theme, 5 MB per session).
- Theme and settings writes are atomic (temporary file plus rename) and created with `0600` permissions.
- The extension respects `PI_CODING_AGENT_DIR`; otherwise it uses Pi's default `~/.pi/agent/themes` directory.
- It exposes no arbitrary filesystem access and no command execution. The only subprocess it launches is the default browser, to open the editor URL.

Like any Pi package, this extension runs with the privileges of your Pi session. Review the source before installing.

## Use as a standalone editor

Run the repository's static server:

```bash
cd /path/to/theme-builder-pi
npm run serve
```

Open <http://localhost:4173>. The server binds to `127.0.0.1` and serves only files inside the repository. Without Node, `python3 -m http.server 8000` in the same directory works too (then open <http://localhost:8000>).

Pick a preset, edit any of the 56 theme tokens, or import an existing Pi theme JSON. The preview is organized into Full Session, State gallery, Syntax / Markdown, Thinking / Bash, and HTML export modes. Clicking a token switches to the mode that demonstrates it, scrolls to the target, and highlights it. Numeric xterm colors and empty terminal-default values are shown with browser RGB approximations; the exported value remains unchanged.

Every token has a native color picker and a text field. Text fields accept `""` (terminal default), xterm numbers from 0–255, and variable names. The Variables manager shows imported variables, resolved values, and reference counts; it supports adding, editing, renaming, and deleting them. Optional Pi tokens remain editable and are generated in presets: `scrollbarTrack`, `scrollbarThumb`, `searchMatchBg`, `searchMatchText`, and `thinkingMax`. Their documented fallbacks are represented in the preview (`scrollbarTrack -> muted`, `scrollbarThumb -> text`, and the search/thinking defaults).

Use **Use built-in demo** to restore the comprehensive Pi-like transcript and state examples. **Import Pi session JSONL** accepts a user-selected `.jsonl` file and displays a conservative, reconstructed default active branch/path. It supports user and assistant messages (including text, thinking, and tool calls), tool results, bash executions, custom messages, compaction, branch summaries, model changes, thinking-level changes, labels, session info, and inert cards for unknown records. The viewer validates malformed lines, duplicate/orphan/cyclic parent chains, record count, file size, and field/output limits before changing the displayed session.

This is a **local read-only viewer**, not Pi runtime import or resume. It does not invoke Pi, execute commands, fetch URLs, render imported HTML, or persist imported session contents to localStorage. Use **Clear imported session** to remove the current imported view from the page.

## Pi session commands

Pi's interactive commands export and import JSONL sessions:

```text
/export output.jsonl
/import input.jsonl
```

(The filenames are examples; Pi writes and reads the JSONL files you specify.)

For a static HTML export from a session JSONL file:

```bash
pi --export session.jsonl output.html
```

Pi session selection and continuation options include:

```bash
pi --session /path/to/session.jsonl
pi -c                         # continue the most recent session
pi -r /path/to/session.jsonl  # resume a session
pi --fork /path/to/session.jsonl
```

The builder can inspect a JSONL file locally, but it cannot resume it. Use Pi itself for `/import`, `/export`, `--session`, `-c`, `-r`, and `--fork` behavior.

## Development and testing

Install the locked dependencies:

```bash
npm ci
```

Run the browser syntax check, the strict extension type check, and the packed-package smoke test:

```bash
npm run check
npm run typecheck
npm run test:package
```

- `npm run check` runs `node --check app.js`, a syntax check for the browser bundle.
- `npm run typecheck` runs `tsc --noEmit`, strict TypeScript validation of the extension against the installed `@earendil-works/pi-coding-agent` types.
- `npm run test:package` packs the package with `npm pack`, verifies the tarball contains every runtime asset and excludes development artifacts, installs it into a fresh temporary project alongside the pinned Pi runtime, and loads the extension through Pi's real extension loader to confirm the `theme-builder` command registers.

Playwright's headless Chromium requires system libraries. On a Linux host, install the browser and its system dependencies together:

```bash
npx playwright install --with-deps chromium
```

Run the end-to-end suite:

```bash
npm run test:e2e
```

`npm run test:e2e` starts the editor on `127.0.0.1` and exercises startup, presets, token editing, search, variables, import/export, undo/reset, and preview tabs. The same commands run in GitHub Actions on every push and pull request.

## Theme export

Use **Export theme** to choose a filename and destination with the browser's save dialog (File System Access API), or download the JSON in browsers that do not support that API. Install the resulting file globally with:

```bash
mkdir -p ~/.pi/agent/themes
cp ./my-theme.json ~/.pi/agent/themes/
```

Then select it in Pi settings or use `pi --theme ~/.pi/agent/themes/my-theme.json` as appropriate for your installed Pi version. Theme drafts are retained in localStorage in the browser; imported session contents are never stored there.

When opened by `/theme-builder`, prefer **Save to Pi** and **Activate in Pi** over the download flow. **Set Pi default** writes the selected saved theme to Pi's global settings for future sessions.
