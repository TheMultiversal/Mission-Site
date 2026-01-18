## Summary
Short description of the change and why it's needed.

## Checklist before merging
- [ ] I ran `npm run status` and verified the checklist state is expected.
- [ ] If I changed `scripts/*.js`, I manually ran relevant commands (e.g., `npm run generate-batch -- --start 1001 --count 1`) to validate behavior.
- [ ] I confirmed numeric indexes remain unchanged (1–2880) and there are no duplicate item numbers introduced.
- [ ] If I modified the VS Code extension, I tested using F5 in `vscode-checklist-extension` and verified the status bar update after saving `Checklist For Accountability.md`.
- [ ] I updated `.github/copilot-instructions.md` if my change affects developer workflows or script behavior.

## Notes / How to test
- Use `npm run generate-batch -- --start <n> --count <c>` to append items and check `Checklist For Accountability.md` for duplicates.
- Use `npm run set-range -- --start <a> --end <b> --state check|uncheck` to flip ranges and verify output of `npm run status`.

---
Thanks for the contribution — please include short testing notes in the PR body.