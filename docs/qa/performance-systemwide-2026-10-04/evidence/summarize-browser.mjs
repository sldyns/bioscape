import fs from 'node:fs/promises';
const directory=new URL('./browser/',import.meta.url);
const read=async file=>JSON.parse(await fs.readFile(new URL(file,directory),'utf8'));
const avg=v=>v.reduce((s,x)=>s+x,0)/v.length,percentile=(v,p)=>[...v].sort((a,b)=>a-b)[Math.floor((v.length-1)*p)];
const stats=v=>({count:v.length,mean:avg(v),median:percentile(v,.5),p95:percentile(v,.95),max:Math.max(...v)}),change=(a,b)=>(b/a-1)*100;
const records=[];
for(const run of ['baseline-native-a','optimized-native-a','optimized-native-b','baseline-native-b']){
 const manifest=await read(run+'-manifest.json');if(manifest.completed!==manifest.selected)throw Error('Incomplete '+run);
 for(const summary of manifest.records){const row=await read(summary.key+'.json');if(row.errors.length)throw Error('Browser errors '+row.key);records.push({...row,run,version:run.startsWith('baseline')?'baseline':'optimized'});}
}
const rows=[...new Set(records.map(r=>r.id))].map(id=>{
 const summarize=version=>{const a=records.filter(r=>r.id===id&&r.version===version);return{runs:a.length,ready:stats(a.map(r=>r.readyMs)),updates:stats(a.flatMap(r=>r.updates.map(s=>s.ms))),raf:stats(a.flatMap(r=>r.raf.slice(1).map((t,i)=>t-r.raf[i]))),gapsOver25Ms:a.reduce((n,r)=>n+r.raf.slice(1).filter((t,i)=>t-r.raf[i]>25).length,0),poseBackwards:a.reduce((n,r)=>n+r.updates.slice(1).filter((u,i)=>u.progress<r.updates[i].progress-1e-9).length,0),progressRange:a.map(r=>[r.updates[0]?.progress,r.terminal])};};
 const baseline=summarize('baseline'),optimized=summarize('optimized');return{id,baseline,optimized,updateChangePercent:change(baseline.updates.mean,optimized.updates.mean)};
});
const srecords=[];
for(const run of ['baseline-structure-timing-a','optimized-structure-timing-a','optimized-structure-timing-b','baseline-structure-timing-b']){
 const manifest=await read(run+'-manifest.json');if(manifest.completed!==manifest.selected)throw Error('Incomplete '+run);
 for(const row of manifest.records){if(row.errors.length)throw Error('Browser errors '+row.key);srecords.push({...row,run,version:run.startsWith('baseline')?'baseline':'optimized'});}
}
const structures=[...new Set(srecords.map(r=>r.nodeId))].map(nodeId=>{
 const summary=version=>{const a=srecords.filter(r=>r.nodeId===nodeId&&r.version===version);return{coldReadyMs:avg(a.filter(r=>r.cacheState==='cold').map(r=>r.readyMs)),warmReadyMs:avg(a.filter(r=>r.cacheState==='warm').map(r=>r.readyMs)),frameCpu:stats(a.flatMap(r=>r.frameCpu)),raf:stats(a.flatMap(r=>r.raf.slice(1).map((t,i)=>t-r.raf[i]))),prepareSources:a.map(r=>({cacheState:r.cacheState,prepareSource:r.dataset.prepareSource}))};};
 const baseline=summary('baseline'),optimized=summary('optimized');return{nodeId,baseline,optimized,coldChangePercent:change(baseline.coldReadyMs,optimized.coldReadyMs),warmChangePercent:change(baseline.warmReadyMs,optimized.warmReadyMs)};
});
const result={recordedAt:new Date().toISOString(),method:'Same IAB viewport/device, labels enabled, AB/BA order. Native Play on 15 representative and control models, 2.4 second windows starting at progress .31 and speed 1.5; actual model.update callback durations and browser RAF intervals saved separately. These short windows complement the full-trajectory 235-case CPU sweep; no claim of full-cycle native playback for this round. All nine structures: cold prepared-model cache then immediate warm remount, readiness includes model preparation, scene setup and two rendered frames; 1.8 seconds auto-rotation. HTTP/module assets are warmed by preceding fidelity checks. frameCpuMs is existing partial draw instrumentation, not full event-loop cost. No tests/build/CPU benchmarks ran concurrently.',processRuns:records.length,structureRuns:srecords.length,errors:0,processes:rows,structures};
await fs.writeFile(new URL('../browser-comparison.json',directory),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({processRuns:records.length,structureRuns:srecords.length,errors:0,processes:rows.map(r=>({id:r.id,baselineMs:r.baseline.updates.mean,optimizedMs:r.optimized.updates.mean,change:r.updateChangePercent,baselineRaf:r.baseline.raf.mean,optimizedRaf:r.optimized.raf.mean})),structures:structures.map(r=>({id:r.nodeId,baselineCold:r.baseline.coldReadyMs,optimizedCold:r.optimized.coldReadyMs,coldChange:r.coldChangePercent,baselineWarm:r.baseline.warmReadyMs,optimizedWarm:r.optimized.warmReadyMs}))}));
