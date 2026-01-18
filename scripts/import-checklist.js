#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Simple argv parsing to avoid external dependencies
const args = process.argv.slice(2);
let inputArgIndex = args.indexOf('--file');
let inputPath = path.join(__dirname, 'master-checklist-2880.txt');
if (inputArgIndex !== -1 && args[inputArgIndex + 1]) {
  inputPath = path.resolve(args[inputArgIndex + 1]);
}
// Ensure the checklist file path points at the repo root
const outPath = path.resolve(__dirname, '..', 'Checklist For Accountability.md');

function readLines(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').split(/\r?\n/) : [];
}

function parseExisting(lines) {
  const header = [];
  const items = [];
  let inItems = false;
  for (const line of lines) {
    const m = line.match(/^(- \[[ xX]\])\s*(\d+)\.\s*(.*)$/);
    if (m) {
      inItems = true;
      items.push({ rawChecked: m[1], num: Number(m[2]), text: m[3].trim(), checked: (m[1].includes('x')||m[1].includes('X')) });
    } else {
      if (!inItems) header.push(line);
      else items.push({ raw: line });
    }
  }
  return { header, items };
}

function parseIncoming(lines) {
  const items = [];
  for (const line of lines) {
    if (!line || !line.trim()) continue;
    // Try to parse: "123. text" or "- [ ] 123. text" or "- 123. text"
    const m = line.match(/^(?:- \[[ xX]\]\s*)?(?:-\s*)?(\d+)\.\s*(.*)$/);
    if (m) {
      items.push({ num: Number(m[1]), text: m[2].trim() });
    } else {
      // If line starts with a number followed by ')'
      const m2 = line.match(/^(\d+)\)\s*(.*)$/);
      if (m2) items.push({ num: Number(m2[1]), text: m2[2].trim() });
      else items.push({ text: line.trim() });
    }
  }
  return items;
}

function normalizeText(t) {
  return t.replace(/\s+/g,' ').replace(/["'“”‘’]/g,'').trim().toLowerCase();
}

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    process.exit(2);
  }

  const existingLines = readLines(outPath);
  const { header, items: existingItemsRaw } = parseExisting(existingLines);
  const existingItems = existingItemsRaw.filter(i=>i.text).map(i=>({text:i.text, checked:!!i.checked}));
  const existingNormSet = new Set(existingItems.map(i=>normalizeText(i.text)));

  const incomingLines = readLines(inputPath);
  const incomingItemsRaw = parseIncoming(incomingLines);
  const incomingItems = incomingItemsRaw.map(i=>({text:i.text || '', num:i.num})).filter(i=>i.text);

  const uniqueIncoming = [];
  let skippedDuplicates=0;
  for (const it of incomingItems) {
    const n = normalizeText(it.text);
    if (existingNormSet.has(n)) {
      skippedDuplicates++;
      continue;
    }
    if (!uniqueIncoming.find(u=>normalizeText(u.text)===n)) uniqueIncoming.push(it);
  }

  const finalItems = existingItems.concat(uniqueIncoming.map(i=>({text:i.text, checked:false})));

  // Backup original
  const bakPath = outPath + '.bak-' + new Date().toISOString().replace(/[:.]/g,'-');
  fs.copyFileSync(outPath, bakPath);

  // Build new content
  const linesOut = [];
  if (header.length) linesOut.push(...header);
  linesOut.push('');
  linesOut.push('# Checklist');
  linesOut.push('');
  let idx = 1;
  for (const it of finalItems) {
    const chk = it.checked ? '[x]' : '[ ]';
    linesOut.push(`- ${chk} ${idx}. ${it.text}`);
    idx++;
  }
  const total = idx - 1;
  // Append any trailing notes from original (lines after items)
  // (not implemented: preserve trailing non-item lines)

  fs.writeFileSync(outPath, linesOut.join('\n') + '\n', 'utf8');

  console.log(`Imported ${uniqueIncoming.length} new items; skipped ${skippedDuplicates} duplicates; total items now ${total}.`);
}

main();
