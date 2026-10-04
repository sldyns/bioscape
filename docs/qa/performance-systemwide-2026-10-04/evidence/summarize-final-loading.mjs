import fs from 'node:fs/promises';
const base=new URL('./',import.meta.url),read=async name=>JSON.parse(await fs.readFile(new URL(name+'.json',base),'utf8'));
const avg=v=>v.reduce((a,b)=>a+b,0)/v.length,delta=(a,b)=>(b/a-1)*100;
const mode=process.argv[2]||'cpu';
if(mode==='cpu'){
 const runs=await Promise.all(['baseline-0','optimized-1','optimized-2','baseline-3'].map(s=>read('final-structures-'+s)));
 if(runs.some(r=>r.errors.length||r.rows.length!==27))throw Error('Incomplete CPU coverage');
 const structures=[...new Set(runs[0].rows.map(r=>r.id))].map(id=>{
  const summarize=indices=>{const rows=indices.flatMap(i=>runs[i].rows.filter(r=>r.id===id));return{runs:rows.length,buildMs:avg(rows.map(r=>r.buildMs)),workerPrepareMs:avg(rows.map(r=>r.buildMs+r.packMs)),packMs:avg(rows.map(r=>r.packMs)),unpackMs:avg(rows.map(r=>r.unpackMs)),presentationMs:avg(rows.map(r=>r.presentationMs)),mainPreparationMs:avg(rows.map(r=>r.unpackMs+r.presentationMs)),transferBytes:rows[0].transferBytes,geometry:rows[0].geometry};};
  const baseline=summarize([0,3]),optimized=summarize([1,2]);return{id,baseline,optimized,workerChangePercent:delta(baseline.workerPrepareMs,optimized.workerPrepareMs),mainPreparationChangePercent:delta(baseline.mainPreparationMs,optimized.mainPreparationMs)};
 });
 const result={recordedAt:new Date().toISOString(),errors:0,executions:108,method:'Final source after detail-worker bounding-box-only preparation. Four serial AB/BA Node runs; 3 constructions per root per run. Full cell prepares box and sphere; detail workers prepare box and preserve any existing sphere without eagerly calculating missing spheres. Six samples per root/version. CPU phases only; full readiness measured separately.',structures};
 await fs.writeFile(new URL('final-loading-cpu.json',base),JSON.stringify(result,null,2)+'\n');
 const combined=await read('cpu-comparison');combined.structures=structures;combined.structureRevision='Final detail-worker bounds policy; see final-loading-cpu.json';await fs.writeFile(new URL('cpu-comparison.json',base),JSON.stringify(combined,null,2)+'\n');
 console.log(JSON.stringify(structures.map(r=>({id:r.id,worker:[r.baseline.workerPrepareMs,r.optimized.workerPrepareMs],main:[r.baseline.mainPreparationMs,r.optimized.mainPreparationMs]}))));
}else{
 const names=['baseline-structure-final-a','optimized-structure-final-a','optimized-structure-final-b','baseline-structure-final-b'];
 const runs=await Promise.all(names.map(s=>read('browser/'+s+'-manifest')));
 if(runs.some(r=>r.completed!==18||r.records.some(x=>x.errors.length)))throw Error('Incomplete browser coverage');
 const structures=[...new Set(runs[0].records.map(r=>r.nodeId))].map(nodeId=>{
  const summary=indices=>{const rows=indices.flatMap(i=>runs[i].records.filter(r=>r.nodeId===nodeId)),cold=rows.filter(r=>r.cacheState==='cold'),warm=rows.filter(r=>r.cacheState==='warm');return{coldReadyMs:avg(cold.map(r=>r.readyMs)),warmReadyMs:avg(warm.map(r=>r.readyMs)),coldSamples:cold.map(r=>r.readyMs),warmSamples:warm.map(r=>r.readyMs),frameCpuMs:avg(rows.flatMap(r=>r.frameCpu)),rafIntervalMs:avg(rows.flatMap(r=>r.raf.slice(1).map((t,i)=>t-r.raf[i]))),prepareSources:rows.map(r=>({cacheState:r.cacheState,prepareSource:r.dataset.prepareSource}))};};
  const baseline=summary([0,3]),optimized=summary([1,2]);return{nodeId,baseline,optimized,coldChangePercent:delta(baseline.coldReadyMs,optimized.coldReadyMs),warmChangePercent:delta(baseline.warmReadyMs,optimized.warmReadyMs)};
 });
 const result={recordedAt:new Date().toISOString(),errors:0,executions:72,method:'Final source; same IAB, Apple M1/16 GiB, viewport and full-quality settings. AB/BA; each root cold prepared-model cache then immediate warm remount, readiness includes scene setup and two rendered frames. HTTP/module cache is warm. 1.8 seconds auto-rotation, labels enabled. No parallel tests, build, CPU profiling or agent work. Two samples per root/cache/version; variability is retained.',structures};
 await fs.writeFile(new URL('final-loading-browser.json',base),JSON.stringify(result,null,2)+'\n');
 const combined=await read('browser-comparison');combined.structures=structures;combined.structureRevision='Final detail-worker bounds policy; see final-loading-browser.json';await fs.writeFile(new URL('browser-comparison.json',base),JSON.stringify(combined,null,2)+'\n');
 console.log(JSON.stringify(structures.map(r=>({id:r.nodeId,cold:[r.baseline.coldReadyMs,r.optimized.coldReadyMs],warm:[r.baseline.warmReadyMs,r.optimized.warmReadyMs],coldChange:r.coldChangePercent,warmChange:r.warmChangePercent}))));
}
