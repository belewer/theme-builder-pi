# Feature: Session dropdown completeness and load fix

## Problem
The Pi Theme Builder session dropdown (1) lists only sessions from the current
project's session directory, (2) silently hides sessions over 5 MB, and (3) the
frontend JSONL parser rejects real Pi sessions with "Line N exceeds the safety
limit" because its per-line/per-record/per-field caps are far below real record
sizes (current session has 8 lines over 24 000 chars; largest 118 329 chars).

## Evidence
- `extensions/index.ts:48` `requireSessionRoot()` uses `sessionManager.getSessionDir()`,
  which for an opened session is the per-project dir
  (`~/.pi/agent/sessions/--home-belewer-apps-pi-theme-builder--/`), not the global root
  (`~/.pi/agent/sessions`, 83 files, 81 under 5 MB).
- `extensions/index.ts:66` `sessionSummary()` returns `undefined` for files > 5 MB → hidden.
- `app.js:29` `limits = {bytes:5MB, records:2000, field:12000, output:16000}`; line cap
  is `field*2` = 24 000 chars, record cap `field*4` = 48 000, `validateSessionFields`
  rejects any string field > 12 000 chars.

## Tasks
1. [done] Backend: list sessions from the global sessions root
   (parent of the per-project dir when it matches Pi's `--encoded-cwd--` convention),
   keep path-traversal guards, and include >5 MB sessions flagged `tooLarge` instead of
   hiding them; `/api/session` still refuses to serve oversized files with a clear error.
2. [done] Frontend: loosen parser limits for the read-only viewer — keep the 5 MB
   total byte cap, raise per-record cap to ~1 MB, drop the per-field character cap
   (structure/depth validation stays), raise record-count cap; render-time truncation
   via `bounded()` is unchanged.
3. [done] Frontend: show flagged oversized sessions in the dropdown with a clear
   "(too large to open)" suffix and refuse selection with a toast.
4. [pending — requires interactive Pi session reload of /theme-builder] Verify: reload extension flow, list count matches disk (83), current
   session loads without the line-limit error.

## Non-goals
- Raising the 5 MB open/import cap.
- Changing import-to-Pi validation (`validateSessionText`).

## Follow-up: record rendering (real Pi session format)
Real records (confirmed from disk): message entries have role user/assistant/toolResult
and `content` as an ARRAY of blocks typed `text` (markdown), `thinking`, `toolCall`
(name+arguments), `toolResult`, `image` (base64 data). Current renderRecord dumps raw
JSON for tool calls, shows placeholder for thinking, never renders markdown or images.

5. [done] Block-based renderer: text blocks rendered (markdown for assistant),
   thinking blocks shown as thinking text, toolCall as compact `name(args)` line,
   image blocks as data-URI <img>.
6. [done] Safe minimal markdown renderer (escape first, then headings/bold/italic/
   inline code/fenced code/lists/links) using existing md* CSS tokens.
7. [pending — manual browser check] Verify rendering of the current real session.

## Follow-up 2: internal noise and tool output presentation
8. [done] Compact custom entries (gentle-pi.session-change/-worktree/review-reminder-receipt,
   zentui-turn-summary) into one muted line instead of JSON dumps; unknown customs capped
   at 400 chars. Tool result text now renders in a monospace scrollable `.record-output`
   block (max-height 340px). ToolCall summaries recognize agent/action/pattern/query args.

## Delivery tasks
9. [done] Audit the current diff, verify GitHub issue policy, and create the approved tracking issue.
10. [done] Move the work to a feature branch and complete available verification.
11. [done] Split the implementation into reviewable Conventional Commit work units and record commit identities.
12. [in progress] Open a concise English pull request linked to the approved issue, with exactly one `type:*` label.

## Delivery evidence
- Issue: https://github.com/belewer/theme-builder-pi/issues/1 (`enhancement`, `status:approved`)
- Branch: `feat/session-viewer`
- Verification: `node --check app.js`; `git diff --check`; DOM ID/static safety review passed. No project test/typecheck scripts exist. Browser runtime verification remains manual.
- Commits:
  - `bbc3fed54f32a13bda6f0e2e5a5e01a46acdcf7c` — `chore: ignore local Pi runtime state`
  - `261f2f8a6ce66625bb2b6c1e0af6f0f35b9d18c0` — `feat(extension): improve Pi session discovery`
  - `cf9adc3491831218bb4889c57945039cdc01984e` — `feat(web): render real Pi session records`
- Pull request: pending
