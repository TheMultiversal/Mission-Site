const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, '..', 'Checklist For Accountability.md');
const now = new Date().toISOString().replace(/[:]/g, '-');
const backupPath = `${filePath}.bak-remove-owner-${now}`;

let content = fs.readFileSync(filePath, 'utf8');
fs.writeFileSync(backupPath, content, 'utf8');

// Match both em-dash (—) and hyphen-minus (-) variants with optional spaces
const pattern = /\s*[—-]\s*Owner: \[team\/person\]; Target: \[YYYY-MM-DD\]; Acceptance: \[clear measurable criteria\]\./g;

const newContent = content.replace(pattern, '');

const removedCount = (content.match(pattern) || []).length;

if (removedCount === 0) {
  console.log('No occurrences found. No changes made.');
} else {
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Removed ${removedCount} occurrence(s) and wrote backup to: ${backupPath}`);
}
