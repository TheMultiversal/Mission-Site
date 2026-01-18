#!/usr/bin/env node
const { spawn } = require('child_process');
const times = parseInt(process.argv[2] || '3', 10);

function run() {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [require('path').join(__dirname, 'test-race.js')], { stdio: 'inherit' });
    p.on('close', code => code === 0 ? resolve() : reject(new Error('exit ' + code)));
  });
}

(async () => {
  try {
    for (let i = 0; i < times; i++) {
      console.log(`=== Run ${i+1}/${times} ===`);
      await run();
    }
    console.log('All runs passed.');
    process.exit(0);
  } catch (err) {
    console.error('Test loop failed:', err && err.message);
    process.exit(1);
  }
})();
