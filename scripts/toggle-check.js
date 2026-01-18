#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const md = path.join(__dirname, '..', 'Checklist For Accountability.md');
const num = parseInt(process.argv[2], 10);
if (!num || num < 1 || num > 2880) { console.error('Usage: node toggle-check.js <1–2880>'); process.exit(1); }
if (!fs.existsSync(md)) { console.error('Checklist not found. Run: npm run generate-checklist'); process.exit(1); }
let s = fs.readFileSync(md, 'utf8');
const re = new RegExp(`^(- \\[)( |x)(\\] )${num}\\. `m);
if (!re.test(s)) { console.error('Step not found:', num); process.exit(1); }
s = s.replace(re, (m, p1, p2, p3) => p1 + (p2 === ' ' ? 'x' : ' ') + p3 + `${num}. `);
fs.writeFileSync(md, s, 'utf8');
console.log('Toggled step', num);