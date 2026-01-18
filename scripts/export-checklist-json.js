#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'Checklist For Accountability.md');
const outPath = path.join(__dirname, '..', 'my-website', 'data', 'checklist.json');

if (!fs.existsSync(mdPath)) {
  console.error('Checklist file not found:', mdPath);
  process.exit(1);
}

const content = fs.readFileSync(mdPath, 'utf8');
const lines = content.split(/\r?\n/);
const re = /^- \[[ xX]\] (\d+)\. (.*)$/;

const items = [];
for (const line of lines) {
  const m = line.match(re);
  if (m) {
    items.push({
      id: parseInt(m[1], 10),
      text: m[2].trim(),
      done: /\[x\]/i.test(line)
    });
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf8');
console.log(`Wrote ${items.length} checklist items to ${outPath}`);
