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
if (!start || !end || start < 1 || end < start || end > 2880) {
  console.error('Usage: node toggle-range.js --start <n> --end <m>  (1–2880)');
  process.exit(1);
}
if (!fs.existsSync(md)) {
  console.error('Checklist not found. Run: npm run generate-checklist');
  process.exit(1);
}
let s = fs.readFileSync(md, 'utf8');
let toggled = 0;
for (let i = start; i <= end; i++) {
  const re = new RegExp(`^(- \\[)( |x)(\\] )${i}\\. `, 'm');
  if (re.test(s)) {
    s = s.replace(re, (m, p1, p2, p3) => p1 + (p2 === ' ' ? 'x' : ' ') + p3 + `${i}. `);
    toggled++;
  }
}
fs.writeFileSync(md, s, 'utf8');
console.log(`Toggled ${toggled} items (${start}..${end}).`);