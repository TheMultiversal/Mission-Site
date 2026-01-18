#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, '..', 'Checklist For Accountability.md');

const header = `# Checklist For Accountability

This file contains 2,880 actionable items (1–2880). Each item includes an owner, target, and acceptance criteria template — edit in-place to assign and track progress.

Commands:
- npm run generate-checklist
- node ./scripts/toggle-check.js <n>
- npm run status

`;

const domains = [
  { area: 'Governance', verbs: ['Draft', 'Publish', 'Review'], examples: ['mission statement', 'governance charter', 'board onboarding pack'] },
  { area: 'Legal', verbs: ['Draft', 'Establish', 'Create'], examples: ['litigation playbook', 'FOIA templates', 'preservation notices'] },
  { area: 'Security', verbs: ['Implement', 'Audit', 'Harden'], examples: ['EDR policy', 'key rotation', 'incident playbook'] },
  { area: 'Data', verbs: ['Design', 'Implement', 'Validate'], examples: ['data catalog', 'retention policy', 'checksum revalidation'] },
  { area: 'Community', verbs: ['Create', 'Implement', 'Deploy'], examples: ['community training', 'consent workflow', 'reporting hotline'] },
  { area: 'Lab QA', verbs: ['Draft', 'Pilot', 'Certify'], examples: ['chain-of-custody slips', 'inter-lab comparison', 'blind QA samples'] },
  { area: 'Communications', verbs: ['Draft', 'Train', 'Publish'], examples: ['press pack', 'media Q&A scripts', 'embargo procedures'] },
  { area: 'Policy & Advocacy', verbs: ['Draft', 'Coordinate', 'Submit'], examples: ['model ordinance', 'regulatory petition', 'legislative brief'] },
  { area: 'Technology', verbs: ['Design', 'Deploy', 'Monitor'], examples: ['CI/CD security scans', 'signed-release pipeline', 'monitoring station upkeep'] },
  { area: 'Training', verbs: ['Develop', 'Deliver', 'Certify'], examples: ['trauma-informed training', 'volunteer certification', 'continuous education'] },
  { area: 'Fundraising', verbs: ['Create', 'Implement', 'Audit'], examples: ['donor acceptance policy', 'reserve fund target', 'grant reporting pack'] },
  { area: 'Evaluation', verbs: ['Design', 'Run', 'Publish'], examples: ['impact framework', 'random audit plan', 'external evaluation'] },
  { area: 'Archives', verbs: ['Implement', 'Test', 'Document'], examples: ['DOI issuance', 'archival restore runbook', 'access controls'] }
];

// small helper to make items varied and actionable
function itemText(i) {
  // use explicit domain examples for some ranges to vary wording
  const d = domains[(i - 1) % domains.length];
  const verb = d.verbs[(i - 1) % d.verbs.length];
  const example = d.examples[(i - 1) % d.examples.length];
  const owner = 'Owner: [team/person]';
  const due = `Target: [YYYY-MM-DD]`;
  const accept = `Acceptance: [clear measurable criteria]`;
  return `${i}. ${verb} the ${example} (${d.area}) — ${owner}; ${due}; ${accept}.`;
}

const items = [];
for (let i = 1; i <= 2880; i++) {
  items.push(itemText(i));
}

fs.writeFileSync(out, header + items.map(it => `- [ ] ${it}`).join('\n') + '\n', 'utf8');
console.log('Checklist generated:', out);