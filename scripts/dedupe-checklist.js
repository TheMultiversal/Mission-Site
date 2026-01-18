#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const checklistPath = path.resolve(__dirname, '..', 'Checklist For Accountability.md');
const bakPath = checklistPath + '.bak-' + new Date().toISOString().replace(/[:.]/g, '-');

const content = fs.readFileSync(checklistPath, 'utf8');
const lines = content.split(/\r?\n/);

const itemRe = /^(- \[[ xX]\] )(\d+)\. (.*)$/;

let firstItemIdx = -1;
let lastItemIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (itemRe.test(lines[i])) {
    if (firstItemIdx === -1) firstItemIdx = i;
    lastItemIdx = i;
  }
}

if (firstItemIdx === -1) {
  console.log('No checklist items found. Nothing to do.');
  process.exit(0);
}

const header = lines.slice(0, firstItemIdx);
const footer = lines.slice(lastItemIdx + 1);

const seen = new Map();
const uniques = [];
const duplicates = [];

for (let i = firstItemIdx; i <= lastItemIdx; i++) {
  const m = lines[i].match(itemRe);
  if (!m) continue; // skip malformed lines
  const state = m[1];
  const origNum = m[2];
  const text = m[3];
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!seen.has(normalized)) {
    seen.set(normalized, { state, text, origNum, origLine: i + 1 });
    uniques.push({ state, text, origNum, origLine: i + 1 });
  } else {
    const first = seen.get(normalized);
    duplicates.push({ origLine: i + 1, origNum, text, firstLine: first.origLine });
  }
}

// Create backup
fs.copyFileSync(checklistPath, bakPath);

// Build new content
const newLines = [];
newLines.push(...header);
newLines.push(''); // ensure a blank line before the list
for (let i = 0; i < uniques.length; i++) {
  const num = i + 1;
  const { state, text } = uniques[i];
  newLines.push(`${state}${num}. ${text}`);
}
newLines.push('');
newLines.push(...footer);

fs.writeFileSync(checklistPath, newLines.join('\n'), 'utf8');

console.log(`Processed checklist: original items range lines ${firstItemIdx + 1}-${lastItemIdx + 1}.`);
console.log(`Unique items kept: ${uniques.length}`);
console.log(`Duplicate items removed: ${duplicates.length}`);
if (duplicates.length > 0) {
  console.log('\nExamples of duplicates (removed -> kept):');
  duplicates.slice(0, 10).forEach(d => {
    console.log(` - removed line ${d.origLine} (orig #${d.origNum}) -> kept at line ${d.firstLine}`);
  });
}
console.log('\nBackup written to: ' + bakPath);
console.log('Wrote de-duplicated checklist and re-numbered items.');

if (duplicates.length === 0) process.exit(0);
process.exit(0);
