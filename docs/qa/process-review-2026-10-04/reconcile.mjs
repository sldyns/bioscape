import {readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
const base=path.dirname(new URL(import.meta.url).pathname);
const read=async p=>JSON.parse(await readFile(path.join(base,p),'utf8'));
const inventory=await read('inventory.json');
const audits=await Promise.all((await readdir(path.join(base,'audits'))).filter(f=>f.endsWith('.json')).map(f=>read('audits/'+f)));
const resolutions=await Promise.all((await readdir(path.join(base,'resolutions'))).filter(f=>f.endsWith('.json')).map(f=>read('resolutions/'+f)));
const discoveries=[];
for (const group of await readdir(path.join(base,'evidence'),{withFileTypes:true})) {
 if(!group.isDirectory())continue;
 try{discoveries.push(await read(`evidence/${group.name}/repair-discoveries.json`));}catch(e){if(e.code!=='ENOENT')throw e;}
}
try{for(const file of await readdir(path.join(base,'repair-discoveries')))if(file.endsWith('.json'))discoveries.push(await read('repair-discoveries/'+file));}catch(e){if(e.code!=='ENOENT')throw e;}
const models=audits.flatMap(a=>a.models??[]);
const findings=a=>[...(a.findings??[]),...(a.issues??[]),...(a.models??[]).flatMap(m=>m.findings??[])];
const initial=audits.flatMap(findings), added=discoveries.flatMap(findings), all=[...initial,...added];
const fixed=resolutions.flatMap(r=>[...(r.issues??[]),...(r.additionalRepairs??[])].map(i=>({...i,resolution:r.group})));
const errors=[];
for(const id of new Set(all.map(f=>f.issueId)))if(all.filter(f=>f.issueId===id).length!==1)errors.push(`${id}: duplicate finding`);
for(const model of inventory.models){
 const matches=models.filter(m=>m.id===model.id);
 if(matches.length!==1)errors.push(`${model.id}: audit count ${matches.length}`);
 else if(JSON.stringify([...model.roots].sort())!==JSON.stringify([...matches[0].roots].sort()))errors.push(`${model.id}: registered root mismatch`);
}
for (const finding of all){
 const matches=fixed.filter(i=>i.issueId===finding.issueId);
 if(matches.length>1)errors.push(`${finding.issueId}: duplicate resolution`);
}
for(const issue of fixed)if(!all.some(i=>i.issueId===issue.issueId))errors.push(`${issue.issueId}: no finding`);
const pending=all.filter(f=>!fixed.some(i=>i.issueId===f.issueId && /^fixed/.test(i.status??''))).map(f=>f.issueId);
const counts=key=>Object.fromEntries([...new Set(all.map(f=>f[key]))].map(k=>[k,all.filter(f=>f[key]===k).length]));
const result={baseline:inventory.baseline,models:models.length,registeredRoots:inventory.models.reduce((s,m)=>s+m.roots.length,0),rootConditionCases:inventory.models.reduce((s,m)=>s+m.contexts.reduce((n,c)=>n+c.combinations.length,0),0),auditVerdicts:Object.fromEntries([...new Set(models.map(m=>m.verdict))].map(v=>[v,models.filter(m=>m.verdict===v).length])),phaseAIssues:initial.length,repairTimeIssues:added.length,totalIssues:all.length,severities:counts('severity'),resolutions:fixed.length,pending,errors,modelsByGroup:audits.filter(a=>a.models?.length).map(a=>({group:a.group,models:a.models.map(m=>m.id),issues:findings(a).map(f=>f.issueId)}))};
await writeFile(path.join(base,'reconciliation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,modelsByGroup:undefined}));
if(errors.length)process.exitCode=1;
