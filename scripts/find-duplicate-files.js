#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const ignoreDirs = new Set(['.git', 'node_modules', '.vs', '.vscode', '.github']);
const ignorePatterns = [/\.bak/, /\.tmp$/, /~$/];

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(root, full);
    if (e.isDirectory()) {
      if (ignoreDirs.has(e.name)) continue;
      walk(full, cb);
    } else if (e.isFile()) {
      if (ignorePatterns.some(r => r.test(e.name))) continue;
      cb(full, rel);
    }
  }
}

function hashFile(p) {
  const h = crypto.createHash('sha256');
  const data = fs.readFileSync(p);
  h.update(data);
  return h.digest('hex');
}

const map = new Map();
walk(root, (full, rel) => {
  try {
    const stat = fs.statSync(full);
    if (stat.size === 0) return; // skip empty files
    const h = hashFile(full);
    if (!map.has(h)) map.set(h, []);
    map.get(h).push({ full, rel, size: stat.size });
  } catch (err) {
    console.warn('skipping', rel, err.message);
  }
});

const report = [];
report.push('# Duplicate Files Report');
report.push('');
report.push(`Date: ${new Date().toISOString()}`);
report.push('');
report.push('The following file groups have identical content (SHA256 hash).');
report.push('By default, backup files (.bak) and common ignores were skipped from the scan.');
report.push('');
let totalGroups = 0;
let totalFiles = 0;
for (const [h, files] of map.entries()) {
  if (files.length > 1) {
    totalGroups++;
    totalFiles += files.length;
    report.push(`## Group ${totalGroups} — hash: ${h}`);
    report.push('');
    files.forEach(f => report.push(`- ${f.rel}  (size: ${f.size})`));
    report.push('');
  }
}
report.push('');
report.push(`Total duplicate groups: ${totalGroups}`);
report.push(`Total files in duplicate groups: ${totalFiles}`);

const outPath = path.join(root, 'scripts', 'duplicate-files-report.md');
fs.writeFileSync(outPath, report.join('\n'), 'utf8');
fs.writeFileSync(path.join(root, 'scripts', 'duplicate-files.json'), JSON.stringify([...map.entries()].filter(([h,files]) => files.length>1).map(([h,files]) => ({ hash: h, files })), null, 2));

console.log('Report written to', outPath);
console.log('Duplicate metadata written to scripts/duplicate-files.json');
console.log('Groups found:', totalGroups, 'Total files in groups:', totalFiles);
