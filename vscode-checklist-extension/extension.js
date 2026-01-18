const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let statusBarItem;

function updateStatus() {
  const ws = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  if (!ws) {
    statusBarItem.text = 'Checklist: no workspace';
    return;
  }
  const md = path.join(ws.uri.fsPath, 'Checklist For Accountability.md');
  if (!fs.existsSync(md)) {
    statusBarItem.text = 'Checklist: not generated';
    return;
  }
  const s = fs.readFileSync(md, 'utf8');
  const total = (s.match(/^\- \[( |x)\] \d+\./gm) || []).length;
  const done = (s.match(/^\- \[x\] \d+\./gm) || []).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  statusBarItem.text = `Checklist: ${done}/${total} (${pct}%)`;
  statusBarItem.tooltip = 'Click for checklist actions';
}

async function runCommandInTerminal(cmd) {
  const name = 'Checklist';
  let term = vscode.window.terminals.find(t => t.name === name);
  if (!term) term = vscode.window.createTerminal(name);
  term.show(true);
  term.sendText(cmd, true);
  // give it a moment to complete and refresh (best-effort)
  setTimeout(updateStatus, 1500);
}

async function showActions() {
  const pick = await vscode.window.showQuickPick([
    { label: 'Generate checklist', cmd: 'npm run generate-checklist' },
    { label: 'Generate batch (prompt)', cmd: null },
    { label: 'Show status', cmd: 'npm run status' },
    { label: 'Toggle item (prompt)', cmd: null },
    { label: 'Set range (prompt)', cmd: null }
  ], { placeHolder: 'Select action' });
  if (!pick) return;

  if (pick.cmd) { await runCommandInTerminal(pick.cmd); return; }

  if (pick.label.startsWith('Generate batch')) {
    const start = await vscode.window.showInputBox({ prompt: 'Start index (1–2880)' });
    const count = await vscode.window.showInputBox({ prompt: 'Count (e.g. 300)' });
    if (start && count) await runCommandInTerminal(`npm run generate-batch -- --start ${start} --count ${count}`);
    return;
  }
  if (pick.label.startsWith('Toggle item')) {
    const n = await vscode.window.showInputBox({ prompt: 'Step number to toggle (1–2880)' });
    if (n) await runCommandInTerminal(`node ./scripts/toggle-check.js ${n}`);
    return;
  }
  if (pick.label.startsWith('Set range')) {
    const start = await vscode.window.showInputBox({ prompt: 'Start index (1–2880)' });
    const end = await vscode.window.showInputBox({ prompt: 'End index (1–2880)' });
    const state = await vscode.window.showQuickPick(['check','uncheck'], { placeHolder: 'State' });
    if (start && end && state) await runCommandInTerminal(`npm run set-range -- --start ${start} --end ${end} --state ${state}`);
    return;
  }
}

function activate(context) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'checklist.showActions';
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(vscode.commands.registerCommand('checklist.showActions', showActions));
  context.subscriptions.push(vscode.commands.registerCommand('checklist.refresh', updateStatus));

  statusBarItem.show();
  updateStatus();

  // refresh after file saves
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(doc => {
    if (doc.fileName.endsWith('Checklist For Accountability.md')) updateStatus();
  }));
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;