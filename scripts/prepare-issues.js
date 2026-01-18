#!/usr/bin/env node
// Simple tool: read checklist file and generate JSON payloads for GitHub issues (dry-run by default)
const fs = require('fs');
const path = require('path');
const argv = (function(){const a=process.argv.slice(2);const o={};for(let i=0;i<a.length;i++){if(a[i].startsWith('--')){const k=a[i].slice(2);const v=a[i+1]&&!a[i+1].startsWith('--')?a[++i]:'true';o[k]=v;}}return o;})();
const md = path.join(__dirname,'..','Checklist For Accountability.md');
if(!fs.existsSync(md)) { console.error('Checklist not found'); process.exit(1); }
const start = parseInt(argv.start||1,10);
const end = parseInt(argv.end||20,10);
const out = path.join(__dirname,'issues-dry-run.json');
const lines = fs.readFileSync(md,'utf8').split(/\r?\n/);
const re = /^- \[[ xX]\] (\d+)\. (.*)$/;
const payloads = [];
for(const l of lines){const m=l.match(re);if(m){const n=parseInt(m[1],10);if(n>=start&&n<=end){payloads.push({title:`${n}. ${m[2]}`, body:`Auto-generated issue for checklist item ${n}: ${m[2]}\n\nOwner: [TBD]\nTarget: [YYYY-MM-DD]\nAcceptance: [criteria]`, labels:['checklist']});}}}
fs.writeFileSync(out, JSON.stringify(payloads,null,2),'utf8');
console.log(`Wrote ${payloads.length} issue payloads to ${out} (dry-run).`);
