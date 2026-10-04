import fs from 'node:fs/promises';
const base=new URL('./',import.meta.url),read=async name=>JSON.parse(await fs.readFile(new URL(name+'.json',base),'utf8'));
const avg=v=>v.reduce((a,b)=>a+b,0)/v.length;
const delta=(old,next)=>(next/old-1)*100;
const pruns=await Promise.all(['baseline-0','optimized-1','optimized-2','baseline-3'].map(s=>read('paired-processes-'+s)));
const key=r=>JSON.stringify([r.id,r.rootId,r.parameters]);
const maps=pruns.map(run=>new Map(run.rows.map(r=>[key(r),r])));
const rows=[...maps[0]].map(([k,first])=>{
 const matches=maps.map(m=>m.get(k));if(matches.some(r=>!r||r.result!=='complete'))throw Error('Incomplete process '+k);
 if(matches.some(r=>JSON.stringify(r.geometry)!==JSON.stringify(first.geometry)))throw Error('Geometry census changed '+k);
 const old=[matches[0],matches[3]],next=[matches[1],matches[2]];
 const summary=set=>({createMs:avg(set.map(r=>r.createMs)),updateMs:avg(set.map(r=>r.update.mean)),medianMs:avg(set.map(r=>r.update.median)),p95Ms:avg(set.map(r=>r.update.p95)),repeatedPoseMs:avg(set.map(r=>r.repeatedPose.mean))});
 const baseline=summary(old),optimized=summary(next);return{id:first.id,group:first.group,rootId:first.rootId,parameters:first.parameters,baseline,optimized,updateChangePercent:delta(baseline.updateMs,optimized.updateMs),createChangePercent:delta(baseline.createMs,optimized.createMs),geometry:first.geometry};
});
if(rows.length!==235||pruns.some(r=>r.errors.length))throw Error('Process coverage/errors');
const ids=[...new Set(rows.map(r=>r.id))];
const models=ids.map(id=>{const a=rows.filter(r=>r.id===id);const baselineUpdateMs=avg(a.map(r=>r.baseline.updateMs)),optimizedUpdateMs=avg(a.map(r=>r.optimized.updateMs));return{id,cases:a.length,baselineUpdateMs,optimizedUpdateMs,updateChangePercent:delta(baselineUpdateMs,optimizedUpdateMs),baselineCreateMs:avg(a.map(r=>r.baseline.createMs)),optimizedCreateMs:avg(a.map(r=>r.optimized.createMs))}});
const structs=await Promise.all(['baseline-0','optimized-1','optimized-2','baseline-3'].map(s=>read('paired-structures-'+s)));
if(structs.some(r=>r.errors.length||r.rows.length!==27))throw Error('Structure coverage/errors');
const structures=[...new Set(structs[0].rows.map(r=>r.id))].map(id=>{
 const select=indices=>indices.flatMap(i=>structs[i].rows.filter(r=>r.id===id));
 const summarize=a=>({runs:a.length,buildMs:avg(a.map(r=>r.buildMs)),workerPrepareMs:avg(a.map(r=>r.buildMs+r.packMs)),packMs:avg(a.map(r=>r.packMs)),unpackMs:avg(a.map(r=>r.unpackMs)),presentationMs:avg(a.map(r=>r.presentationMs)),mainPreparationMs:avg(a.map(r=>r.unpackMs+r.presentationMs)),transferBytes:a[0].transferBytes,geometry:a[0].geometry});
 const baseline=summarize(select([0,3])),optimized=summarize(select([1,2]));return{id,baseline,optimized,workerChangePercent:delta(baseline.workerPrepareMs,optimized.workerPrepareMs),mainPreparationChangePercent:delta(baseline.mainPreparationMs,optimized.mainPreparationMs)};
});
const processSummary={cases:rows.length,models:ids.length,executions:pruns.reduce((n,r)=>n+r.rows.length,0),errors:0,geometryCensusExactCases:235,baselineMeanMs:avg(rows.map(r=>r.baseline.updateMs)),optimizedMeanMs:avg(rows.map(r=>r.optimized.updateMs)),casesImprovedOver5Percent:rows.filter(r=>r.updateChangePercent< -5).length,casesRegressedOver5Percent:rows.filter(r=>r.updateChangePercent>5).length};processSummary.changePercent=delta(processSummary.baselineMeanMs,processSummary.optimizedMeanMs);
const result={recordedAt:new Date().toISOString(),method:'Four isolated serial source runs in AB/BA order, identical 235 registered cases, 31 warm poses, 121 uniform forward samples plus stage and irregular reverse poses per case. Arithmetic mean of the two runs per version. Repeated identical poses are reported separately and are not used as active playback benefit. Structure times are build/worker packing and main-thread unpack/presentation only, six runs per root and version; full browser readiness measured independently. No FPS or cross-device claims.',processSummary,models,structures,rows};
await fs.writeFile(new URL('cpu-comparison.json',base),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({processSummary,largestBaselineModels:models.sort((a,b)=>b.baselineUpdateMs-a.baselineUpdateMs).slice(0,16),structures:structures.map(({id,baseline,optimized,workerChangePercent})=>({id,baselineWorkerMs:baseline.workerPrepareMs,optimizedWorkerMs:optimized.workerPrepareMs,workerChangePercent}))}));
