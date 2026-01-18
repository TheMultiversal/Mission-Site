#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function argv() {
  const a = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith('--')) {
      const k = a[i].slice(2);
      const v = a[i+1] && !a[i+1].startsWith('--') ? a[++i] : 'true';
      out[k] = v;
    }
  }
  return out;
}

const args = argv();
const incomingPath = args.incoming || path.join(__dirname, 'master-checklist-2880.txt');
const checklistPath = path.resolve(__dirname, '..', 'Checklist For Accountability.md');
const reportPath = path.join(__dirname, 'dedupe-incoming-report.md');

if (!fs.existsSync(incomingPath)) {
  console.error('Incoming file not found:', incomingPath);
  process.exit(1);
}
if (!fs.existsSync(checklistPath)) {
  console.error('Checklist file not found:', checklistPath);
  process.exit(1);
}

const incomingRaw = fs.readFileSync(incomingPath, 'utf8').split(/\r?\n/);
const checklistRaw = fs.readFileSync(checklistPath, 'utf8').split(/\r?\n/);

const itemReExisting = /^(- \[[ xX]\] )(\d+)\. (.*)$/;
const itemReIncoming = /^\s*\d+\.\s+(.*)$/;

// parse existing items and header/footer
let firstItemIdx = -1;
let lastItemIdx = -1;
for (let i = 0; i < checklistRaw.length; i++) {
  if (itemReExisting.test(checklistRaw[i])) {
    if (firstItemIdx === -1) firstItemIdx = i;
    lastItemIdx = i;
  }
}
if (firstItemIdx === -1) {
  console.error('No checklist items found.');
  process.exit(1);
}
const header = checklistRaw.slice(0, firstItemIdx);
const footer = checklistRaw.slice(lastItemIdx + 1);

const normalize = s => s.replace(/\s+/g, ' ').trim().toLowerCase();

const existingItems = [];
for (let i = firstItemIdx; i <= lastItemIdx; i++) {
  const m = checklistRaw[i].match(itemReExisting);
  if (!m) continue;
  const stateChar = m[1].includes('x') || m[1].includes('X') ? 'x' : ' ';
  const num = parseInt(m[2], 10);
  const text = m[3].trim();
  existingItems.push({ num, text, state: stateChar, origLine: i + 1, normalized: normalize(text) });
}
const existingMap = new Map();
for (const it of existingItems) {
  if (!existingMap.has(it.normalized)) existingMap.set(it.normalized, []);
  existingMap.get(it.normalized).push(it);
}

// parse incoming items
const incomingItems = [];
for (let i = 0; i < incomingRaw.length; i++) {
  const line = incomingRaw[i];
  const m = line.match(itemReIncoming);
  if (!m) continue;
  const text = m[1].trim();
  incomingItems.push({ idx: i + 1, text, normalized: normalize(text) });
}

// Build final list preferring incoming items
const finalList = [];
const seen = new Map();
const duplicatesInfo = [];
let incomingDuplicates = 0;
let conflicts = 0;

incomingItems.forEach(it => {
  const n = it.normalized;
  if (seen.has(n)) {
    // duplicate within incoming
    incomingDuplicates++;
    duplicatesInfo.push({ type: 'incoming-duplicate', incomingIdx: it.idx, text: it.text });
    return;
  }
  seen.set(n, true);
  const existing = existingMap.get(n);
  if (existing && existing.length > 0) {
    // conflict: incoming matches existing; prefer incoming wording
    conflicts++;
    // preserve existing checked state if any of the matched existing items are checked
    const existingChecked = existing.some(e => e.state === 'x');
    const state = existingChecked ? 'x' : ' ';
    finalList.push({ text: it.text, state, source: 'incoming', incomingIdx: it.idx, existingLines: existing.map(e => e.origLine) });
    duplicatesInfo.push({ type: 'incoming-replaces-existing', incomingIdx: it.idx, existingLines: existing.map(e => e.origLine), text: it.text });
  } else {
    // incoming new
    finalList.push({ text: it.text, state: ' ', source: 'incoming', incomingIdx: it.idx });
  }
});

// Append existing-only items that were not present in incoming
const appendedExisting = [];
for (const it of existingItems) {
  if (!seen.has(it.normalized)) {
    seen.set(it.normalized, true);
    finalList.push({ text: it.text, state: it.state, source: 'existing', origLine: it.origLine });
    appendedExisting.push(it);
  }
}

// Backup original checklist
const bakPath = checklistPath + '.bak-incoming-prefer-' + new Date().toISOString().replace(/[:.]/g, '-');
fs.copyFileSync(checklistPath, bakPath);

// Write new checklist
const outLines = [];
outLines.push(...header);
outLines.push('');
for (let i = 0; i < finalList.length; i++) {
  const num = i + 1;
  const entry = finalList[i];
  const box = entry.state === 'x' ? 'x' : ' ';
  outLines.push(`- [${box}] ${num}. ${entry.text}`);
}
outLines.push('');
outLines.push(...footer);
fs.writeFileSync(checklistPath, outLines.join('\n'), 'utf8');

// Write report
const report = [];
report.push('# Dedupe (Prefer Incoming) Report');
report.push('');
report.push(`Date: ${new Date().toISOString()}`);
report.push('');
report.push(`Incoming file: ${incomingPath}`);
report.push(`Checklist file: ${checklistPath}`);
report.push(`Backup of previous checklist: ${bakPath}`);
report.push('');
report.push('## Summary');
report.push('');
report.push(`- Incoming total lines parsed: ${incomingItems.length}`);
report.push(`- Incoming duplicates (within incoming): ${incomingDuplicates}`);
report.push(`- Conflicts (incoming matched and replaced existing wording): ${conflicts}`);
report.push(`- Existing-only items appended: ${appendedExisting.length}`);
report.push(`- Final unique items: ${finalList.length}`);
report.push('');
report.push('## Examples of duplicate/conflict cases (first 20)');
report.push('');
duplicatesInfo.slice(0,20).forEach(d => {
  if (d.type === 'incoming-duplicate') {
    report.push(`- Incoming duplicate line ${d.incomingIdx}: ${d.text}`);
  } else if (d.type === 'incoming-replaces-existing') {
    report.push(`- Incoming line ${d.incomingIdx} replaced existing item(s) at lines ${d.existingLines.join(', ')}: ${d.text}`);
  }
});
report.push('');
report.push('## Appended existing-only items (first 20)');
report.push('');
appendedExisting.slice(0,20).forEach(e => report.push(`- existing line ${e.origLine} (orig #${e.num}): ${e.text}`));
report.push('');
report.push('## Notes');
report.push('');
report.push('- Incoming wording was preferred when duplicates/conflicts were found.');
report.push('- If any incoming item matched an existing checked item, the final item preserved the checked state.');
report.push('- A backup of the previous checklist was created in case you want to revert.');

fs.writeFileSync(reportPath, report.join('\n'), 'utf8');

console.log('Done. Report written to:', reportPath);
console.log(`Backup checklist path: ${bakPath}`);
console.log(`Final unique items: ${finalList.length}`);
console.log(`Conflicts where incoming replaced existing wording: ${conflicts}`);
console.log(`Incoming duplicates (within incoming): ${incomingDuplicates}`);
console.log(`Existing-only items appended: ${appendedExisting.length}`);

process.exit(0);
