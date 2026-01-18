#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
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
const md = path.join(__dirname, '..', 'Checklist For Accountability.md');
const start = parseInt(argv.start, 10);
const end = parseInt(argv.end, 10);
const state = (argv.state || '').toLowerCase(); // 'check' or 'uncheck'
if (!start || !end || start < 1 || end < start || end > 2880 || (state !== 'check' && state !== 'uncheck')) {
  console.error('Usage: node set-range.js --start <n> --end <m> --state <check|uncheck>  (1–2880)');
  process.exit(1);
}
if (!fs.existsSync(md)) {
  console.error('Checklist not found. Run: npm run generate-checklist');
  process.exit(1);
}
let s = fs.readFileSync(md, 'utf8');
let changed = 0;
for (let i = start; i <= end; i++) {
  const re = new RegExp(`^(- \\[)( |x)(\\] )${i}\\. `, 'm');
  const want = state === 'check' ? 'x' : ' ';
  if (re.test(s)) {
    s = s.replace(re, (m, p1, p2, p3) => p1 + want + p3 + `${i}. `);
    changed++;
  } else {
    console.warn(`Item ${i} not found`);
  }
}
fs.writeFileSync(md, s, 'utf8');
console.log(`${state === 'check' ? 'Checked' : 'Unchecked'} ${changed} items (${start}..${end}).`);