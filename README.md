# Pi Theme Builder

A self-contained, vanilla HTML/CSS/JavaScript visual editor for Pi coding-agent themes. It runs entirely in the browser: no backend, dependencies, network calls, command execution, or remote image loading are used after the page loads.

## Use in Pi (recommended)

This repository is a Pi package. Install it locally while developing:

```bash
pi install /absolute/path/to/theme-builder-pi
```

Then start an interactive Pi session and run:

```text
/theme-builder
```

Pi opens the editor in the default browser on a random `127.0.0.1` port. The integration controls can list themes, load one from Pi, save the current draft to Pi's real theme directory, and activate the newly saved theme in the current Pi session.

The extension respects `PI_CODING_AGENT_DIR`; otherwise it uses Pi's default `~/.pi/agent/themes` directory. Its browser API is limited to the loopback interface, uses a per-run secret token, accepts only safe theme filenames, and does not expose arbitrary filesystem access or command execution.

## Use as a standalone editor

```bash
cd /home/belewer/apps/pi-theme-builder
python3 -m http.server 8000
```

Open <http://localhost:8000>. Pick a preset, edit any of the 56 theme tokens, or import an existing Pi theme JSON. The preview is organized into Full Session, State gallery, Syntax / Markdown, Thinking / Bash, and HTML export modes. Clicking a token switches to the mode that demonstrates it, scrolls to the target, and highlights it. Numeric xterm colors and empty terminal-default values are shown with browser RGB approximations; the exported value remains unchanged.

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

## Theme export

Use **Export theme** to choose a filename and destination with the browser's save dialog (File System Access API), or download the JSON in browsers that do not support that API. Install the resulting file globally with:

```bash
mkdir -p ~/.pi/agent/themes
cp ./my-theme.json ~/.pi/agent/themes/
```

Then select it in Pi settings or use `pi --theme ~/.pi/agent/themes/my-theme.json` as appropriate for your installed Pi version. Theme drafts are retained in localStorage in the browser; imported session contents are never stored there.

When opened by `/theme-builder`, prefer **Save to Pi** and **Activate in Pi** over the download flow. Activation applies to the current running Pi session; select the theme in Pi settings if you also want to make it the startup default.
