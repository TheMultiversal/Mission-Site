#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const lock = require('proper-lockfile');
const argv = (function() {
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
})();
const defaultOut = path.join(__dirname, '..', 'Checklist For Accountability.md');
const out = argv.out ? path.resolve(argv.out) : defaultOut;

if (!argv.start) {
  console.error('Usage: node generate-batch.js --start <n> [--count <c>] [--file <path>] [--out <path>]');
  process.exit(1);
}
const start = parseInt(argv.start, 10);
if (isNaN(start) || start < 1 || start > 2880) { console.error('Invalid --start'); process.exit(1); }

let lines = [];
if (argv.file) {
  const filePath = path.resolve(argv.file);
  if (!fs.existsSync(filePath)) { console.error('File not found:', filePath); process.exit(1); }
  const fileLines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
  lines = fileLines.map((l, i) => `${start + i}. ${l.trim()}`);
} else {
  const count = parseInt(argv.count || '1', 10);
  if (isNaN(count) || count < 1) { console.error('Invalid --count'); process.exit(1); }
  for (let i = 0; i < count; i++) {
    const idx = start + i;
    if (idx > 2880) break;
    lines.push(`${idx}. Action: draft/implement item ${idx} — Owner: [team/person]; Target: [YYYY-MM-DD]; Acceptance: [criteria].`);
  }
}

// Ensure header exists
if (!fs.existsSync(out)) {
  fs.writeFileSync(out, '# Checklist For Accountability\n\nThis file contains 2,880 items.\n\n', 'utf8');
}

// Read existing file and avoid duplicate index append
let content = fs.readFileSync(out, 'utf8');
const existingIndexes = new Set((content.match(/^\- \[.\] (\d+)\./gm) || []).map(m => parseInt(m.replace(/^\- \[.\] (\d+)\..*$/,'$1'),10)));

const filtered = lines.filter(l => {
  const idx = parseInt(l.split('.')[0], 10);
  if (existingIndexes.has(idx)) {
    console.warn(`Skipping existing item ${idx}`);
    return false;
  }
  return true;
});

if (!filtered.length) {
  console.log('No new items to append.');
  process.exit(0);
}

// Append new items as unchecked lines
const toAppend = filtered.map(l => `- [ ] ${l}`).join('\n') + '\n';
fs.appendFileSync(out, toAppend, 'utf8');
console.log(`Appended ${filtered.length} items starting at ${start} to ${out}`);