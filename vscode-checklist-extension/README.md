# Checklist Status (local)

What it does
- Shows checklist progress in the status bar.
- Click status or run "Checklist: Show actions" to generate batches, toggle items, set ranges, or show status. Commands run in an integrated terminal.

Install
- Package: `cd vscode-checklist-extension && npx @vscode/vsce package`
- Install from VSIX: Extensions → "..." → Install from VSIX... → select `checklist-status-*.vsix`
- Or (if `code` is in PATH): `code --install-extension .\checklist-status-0.0.1.vsix`

Test / Debug
- Open extension folder in VS Code and press F5 to start an Extension Development Host; status item appears in the host window.

Notes
- Ensure your workspace has `Checklist For Accountability.md`.
- Use the commands provided in the status bar quick pick or the command palette.