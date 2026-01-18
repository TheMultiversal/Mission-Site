# Copilot / AI Agent Instructions for mission-site 🚀

## Quick summary
- This repository manages a single canonical checklist: `Checklist For Accountability.md` (2,880 numbered items). The checklist is generated and maintained by small Node scripts in `scripts/` and exposed via a minimal VS Code extension in `vscode-checklist-extension/`.

## High-level architecture & why it is this way 🔧
- Checklist data: `Checklist For Accountability.md` is the single source-of-truth; each item is a markdown list line like:
  - `- [ ] 11. Implement the reserve fund target (Fundraising) — Owner: [team/person]; Target: [YYYY-MM-DD]; Acceptance: [criteria].`
- Scripts (`scripts/*.js`): simple synchronous Node scripts implement CLI behaviors:
  - `generate-checklist.js` — writes the full 2,880-item file with a header template
  - `generate-batch.js` — appends a contiguous block starting at `--start` (supports `--file` and `--count`); skips duplicates
  - `toggle-check.js` — toggles a single item by number
  - `toggle-range.js` / `set-range.js` — flip or set check state for a numeric range
  - `check-status.js` — prints progress summary and first 20 unchecked items
- VS Code extension (`vscode-checklist-extension/`): shows a status bar item and provides these actions. It runs the above scripts via the integrated terminal (not programmatic edits) and refreshes the status when the checklist file is saved.

## Important project-specific conventions & gotchas ⚠️
- Strict item format: scripts rely on anchored regexes that expect the exact line shape `- [ ]|[x] <number>. <text>` (the index is essential). Avoid changing item numbering or formatting (brackets, spacing, period after number).
- Index bounds: valid indices are 1–2880. Scripts validate start/end ranges and will error on out-of-range values.
- Prefer scripts over manual edits for bulk changes: `generate-batch`, `set-range`, and `toggle-check` perform validation and avoid duplicates. Manually editing indexes or the bracket spacing can break script detection.
- `generate-batch` deduplicates by numeric index and warns when skipping existing items.
- Scripts are minimal, synchronous, and intentionally simple — keep fixes and changes small and well-tested locally.

## Useful commands & how to test (examples) ✅
- Generate full checklist: `npm run generate-checklist`
- Append 100 items starting at 201: `npm run generate-batch -- --start 201 --count 100`
- Append from file: `node ./scripts/generate-batch.js --start 501 --file ./todo.txt`
- Toggle item 11: `node ./scripts/toggle-check.js 11`
- Show status: `npm run status` (prints `Checklist: X/Y complete (Z%)`)
- Check a range: `npm run set-range -- --start 1 --end 10 --state check`
- Run the extension for manual testing: open `vscode-checklist-extension` in VS Code and press F5 to start an Extension Development Host and use the status bar actions. The extension runs CLI commands in an integrated terminal and refreshes the status ~1.5s after running a command.
- Package extension: from `vscode-checklist-extension/` run `npm run pack` (calls `npx @vscode/vsce package`)

## Implementation notes & suggested fixes 🔧
- Where to change: `scripts/generate-batch.js` (append logic and duplicate detection) and `scripts/*.js` that write `Checklist For Accountability.md`.
- Race condition risk: concurrent `generate-batch` runs can read the file at the same time and both append, causing duplicates. Recommended fixes:
  - Use an explicit lock (cross-platform) such as the `proper-lockfile` package or similar. Example (sync-style pseudocode):

```js
const lock = require('proper-lockfile');
const release = lock.lockSync(out);
try {
  const content = fs.readFileSync(out, 'utf8');
  // dedupe/append
  fs.appendFileSync(out, toAppend, 'utf8');
} finally {
  release();
}
```

  - Or use an atomic/write-then-rename approach: write updated content to a temp file and rename over the target. Both must still re-read content under the lock to preserve correctness.
- If you change the append logic, add a smoke test that runs two parallel append commands and verifies no duplicate item numbers (see test steps below).

## Quick race/test example
- Terminal A: `npm run generate-batch -- --start 1001 --count 200`
- Terminal B (immediately): `npm run generate-batch -- --start 1100 --count 200`
- Verify: `grep "^\- \[" "Checklist For Accountability.md" | awk '{print $3}' | sort -n | uniq -d` → should output nothing (no duplicate numbers).
- Or run the smoke test script: `npm run test-race` (runs two parallel append jobs to a temp file and checks for duplicate indexes). For more thorough checks, run `npm run test-race-loop` (runs multiple sequential smoke tests).

## Continuous Integration
- A GitHub Actions workflow (`.github/workflows/test-race.yml`) runs the smoke test on `pull_request` and `push` to `main`. Ensure your PRs pass this workflow before merging.
## Files to inspect for context 📁
- `Checklist For Accountability.md` — canonical data file and template header
- `scripts/*.js` — all CLI behaviors (read before automating edits)
- `vscode-checklist-extension/extension.js` — shows how commands and terminal usage are implemented (runs commands in an integrated terminal; refresh after save)

## What to do / priorities for an AI agent 💡
1. Prefer scripts over direct edits to the checklist; propose script changes when behavior needs to change.
2. When modifying scripts that write the checklist, add deterministic checks and a small smoke test (use copies of the checklist for destructive tests).
3. After changes that affect workflows, update `.github/copilot-instructions.md` and the PR template to capture the verification steps.
4. For extension changes, test with an Extension Development Host (F5) and verify status updates when `Checklist For Accountability.md` is saved.

---
If any portion of these instructions is unclear or you'd like more examples (e.g., specific lines to change in a script), tell me which area to expand and I'll update this file. ✨
## Example prompts you can act on immediately
- "Add 250 placeholder items starting at 1001" → `npm run generate-batch -- --start 1001 --count 250`
- "Mark items 25–50 as done" → `npm run set-range -- --start 25 --end 50 --state check`
- "Add a small fix to avoid race conditions when multiple terminals append items" → audit `generate-batch.js`, propose or implement file-locking or check-then-append strategy, and test locally.

## Non-goals / things not covered here 🚫
- There are no automated tests or CI workflows in this repository — rely on local manual testing.
- Do not assume external services or databases; this project is file-based and local.

---
If any portion of these instructions is unclear or you'd like more examples (e.g., specific lines to change in a script), tell me which area to expand and I'll update this file. ✨