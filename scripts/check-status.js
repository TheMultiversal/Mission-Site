#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const md = path.join(__dirname, '..', 'Checklist For Accountability.md');
if (!fs.existsSync(md)) { console.error('Checklist not found. Run: npm run generate-checklist'); process.exit(1); }
const s = fs.readFileSync(md, 'utf8');
const total = (s.match(/^\- \[( |x)\] \d+\./gm) || []).length;
const done = (s.match(/^\- \[x\] \d+\./gm) || []).length;
console.log(`Checklist: ${done}/${total} complete (${total ? Math.round((done/total)*100) : 0}%)`);
[...s.matchAll(/^\- \[ \] (\d+)\. (.+)$/gm)].slice(0,20).forEach(m => console.log(`  ${m[1]}. ${m[2]}`));