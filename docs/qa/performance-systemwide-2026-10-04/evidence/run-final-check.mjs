import fs from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='docs/qa/performance-systemwide-2026-10-04/evidence/';
async function snapshot(name){const paths=[...new Set([...execFileSync('git',['diff','--name-only','--','src','tests','scripts'],{encoding:'utf8'}).trim().split('\n'),...execFileSync('git',['ls-files','--others','--exclude-standard','--','src','tests','scripts'],{encoding:'utf8'}).trim().split('\n')])].filter(Boolean).sort();const result={recordedAt:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),files:{}};for(const p of paths)result.files[p]=createHash('sha256').update(await fs.readFile(p)).digest('hex');await fs.writeFile(base+name,JSON.stringify(result,null,2)+'\n');return result;}
const before=await snapshot('final-code-before-check.json'),startedAt=new Date().toISOString();
const output=await fs.open(base+'final-check.log','w');const child=spawn('npm',['run','check'],{stdio:['ignore',output.fd,output.fd]});
const exitCode=await new Promise(resolve=>child.on('close',resolve));await output.close();
const after=await snapshot('final-code-after-check.json');const changed=Object.keys({...before.files,...after.files}).filter(p=>before.files[p]!==after.files[p]);
const result={command:'npm run check',startedAt,finishedAt:new Date().toISOString(),exitCode,codeFilesChecked:Object.keys(after.files).length,sourceSetStable:changed.length===0,changedDuringCheck:changed,gates:['format:check','verify','build','check:release'],log:'evidence/final-check.log',before:'evidence/final-code-before-check.json',after:'evidence/final-code-after-check.json'};
await fs.writeFile(base+'final-check.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));process.exitCode=exitCode||changed.length;
