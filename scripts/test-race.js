#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const tmp = path.join(__dirname, 'tmp-checklist.md');
if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

function run(start, count) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join(__dirname, 'generate-batch.js'), '--start', String(start), '--count', String(count), '--out', tmp], { stdio: 'inherit' });
    p.on('close', code => code === 0 ? resolve() : reject(new Error('exit ' + code)));
  });
}

(async () => {
  try {
    // Run two overlapping appends concurrently
    await Promise.all([
      run(1001, 200),
      run(1100, 200)
    ]);

    const s = fs.readFileSync(tmp, 'utf8');
    const matches = s.match(/^\- \[[ x]\] (\d+)\./gm) || [];
    const ids = matches.map(m => parseInt(m.replace(/^\- \[[ x]\] (\d+)\..*$/,'$1'),10));
    const dup = ids.filter((v, i, arr) => arr.indexOf(v) !== i);
    const dups = [...new Set(dup)];
    if (dups.length) {
      console.error('Duplicate indexes found:', dups.join(', '));
      process.exit(1);
    }
    console.log('No duplicate indexes found. Test passed.');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err && err.message);
    process.exit(1);
  }
})();
