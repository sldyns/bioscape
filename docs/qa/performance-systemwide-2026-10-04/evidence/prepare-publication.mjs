import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/qa/performance-systemwide-2026-10-04/',base=root+'evidence/';
const checked=JSON.parse(await fs.readFile(base+'final-code-after-check.json','utf8'));
const source=Object.keys(checked.files);
for(const file of source){if(createHash('sha256').update(await fs.readFile(file)).digest('hex')!==checked.files[file])throw Error('Source changed after final check: '+file);}
const sourceNow=[...new Set([...execFileSync('git',['diff','--name-only','HEAD','--','src','tests','scripts'],{encoding:'utf8'}).trim().split('\n'),...execFileSync('git',['ls-files','--others','--exclude-standard','--','src','tests','scripts'],{encoding:'utf8'}).trim().split('\n')])].filter(Boolean).sort();
if(JSON.stringify(sourceNow)!==JSON.stringify([...source].sort()))throw Error('Source file set changed');
const reports=['README.md','startup-audit.md','loading-audit.md','render-audit.md','process-shared-audit.md','geometry-audit.md','processes-a-audit.md','processes-b-audit.md','paramecium.md','secretion-audit.md','export-audit.md'];
const evidence=['baseline-source.json','browser-cases.json','cpu-comparison.json','browser-comparison.json','final-loading-cpu.json','final-loading-browser.json','final-loading-cpu-runs.json','startup-build-comparison.json','pixel-comparison.json','browser-validation.json','production-browser-validation.json','production-export.json','final-production-smoke.json','final-check.json','final-check-acceptance.json','final-code-before-check.json','final-code-after-check.json','paired-cpu-runs.json','profile-processes.mjs','profile-structures.mjs','run-paired-cpu.mjs','run-final-loading-cpu.mjs','run-final-check.mjs','summarize-cpu.mjs','summarize-browser.mjs','summarize-final-loading.mjs','compare-pixels.py','compare-startup-build.mjs','probe.html','probe.jsx','structure-probe.html','structure-probe.jsx','annotation-probe.html','annotation-probe.jsx','production-servers.mjs','servers.mjs','generate-process-cache-reference.mjs','generate-process-cache-b-reference.mjs','verify-live.py','prepare-publication.mjs'];
const paths=[...source,...reports.map(p=>root+p),...evidence.map(p=>base+p)].sort();
const rows=[];for(const file of paths){const data=await fs.readFile(file);rows.push({path:file,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
const result={recordedAt:new Date().toISOString(),baselineCommit:checked.head,sourceFiles:source.length,files:rows.length,totalBytes:rows.reduce((n,r)=>n+r.bytes,0),policy:'Explicit product, portable regression fixtures, audit reports, compact measurement receipts and reproduction scripts only. Full-resolution images, videos, raw per-frame records, logs, frozen source and earlier rounds remain local, unchanged.',rows};
await fs.writeFile(base+'publication-whitelist.json',JSON.stringify(result,null,2)+'\n');
await fs.writeFile(base+'publication-files.txt',paths.join('\n')+'\n');
if(process.argv.includes('--stage'))execFileSync('git',['add','--',...paths],{stdio:'pipe'});
console.log(JSON.stringify({sourceFiles:result.sourceFiles,files:result.files,totalBytes:result.totalBytes,staged:process.argv.includes('--stage')}));
