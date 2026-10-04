import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const source=process.env.BIOSCAPE_PROFILE_SOURCE||'/tmp/bioscape-systemwide-20261004-baseline-ae697be';
const output=process.env.BIOSCAPE_PROFILE_OUTPUT||'baseline-processes';
const directory=new URL('./',import.meta.url);
const selected=process.env.BIOSCAPE_PROFILE_IDS?.split(',');
const inventory=JSON.parse(await fs.readFile(new URL('../../process-review-2026-10-04/inventory.json',import.meta.url),'utf8'));
const percentile=(v,p)=>[...v].sort((a,b)=>a-b)[Math.floor((v.length-1)*p)];
const stats=v=>({count:v.length,mean:v.reduce((a,b)=>a+b,0)/v.length,median:percentile(v,.5),p95:percentile(v,.95),max:Math.max(...v)});
function census(group){const geometries=new Set(),materials=new Set(),buffers=new Set();let nodes=0,meshes=0,instances=0,vertices=0,indices=0;group.traverse(o=>{nodes++;if(o.isMesh)meshes++;instances+=o.isInstancedMesh?o.count:0;if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);if(o.instanceMatrix)buffers.add(o.instanceMatrix.array.buffer);if(o.instanceColor)buffers.add(o.instanceColor.array.buffer)});for(const g of geometries){vertices+=g.attributes.position?.count||0;indices+=g.index?.count||0;for(const a of Object.values(g.attributes))buffers.add((a.array||a.data.array).buffer);if(g.index)buffers.add(g.index.array.buffer)}return{nodes,meshes,instances,uniqueGeometries:geometries.size,uniqueMaterials:materials.size,vertices,indices,geometryBackingBytes:[...buffers].reduce((s,b)=>s+b.byteLength,0)}}
function dispose(model){const geo=new Set(),mat=new Set(),tex=new Set();model.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geo.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){mat.add(m);for(const v of Object.values(m))if(v?.isTexture)tex.add(v)}});for(const x of [...geo,...mat,...tex])x.dispose();model.dispose?.();}
const result={startedAt:new Date().toISOString(),source,environment:{node:process.version,platform:process.platform,arch:process.arch},method:'Serial screening of all registered root/condition cases. One 31-pose warmup then 121 forward samples plus registered stage poses and irregular reverse seeks. Same paused pose cost sampled separately; creation, update and topology metadata are separate. No browser/FPS claim. Broad screening guides controlled paired follow-up, not final speedup estimates.',rows:[],errors:[]};
let count=0;
for(const entry of inventory.models.filter(entry=>!selected||selected.includes(entry.id))){
 let definition;try{definition=(await import(pathToFileURL(path.join(source,entry.file)))).default;}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'){const {build}=await import('esbuild');const bundle=new URL(output+'-'+entry.id+'-node.mjs',directory);await build({entryPoints:[path.join(source,entry.file)],bundle:true,platform:'node',format:'esm',packages:'external',outfile:bundle.pathname,logLevel:'silent'});definition=(await import(bundle)).default;}else{result.errors.push({id:entry.id,phase:'import',error:String(error)});continue;}}
 for(const context of entry.contexts)for(const parameters of context.combinations){
  global.gc?.();let model;
  const row={id:entry.id,group:entry.group,rootId:context.root,parameters,index:count++};
  try{
   const start=performance.now();model=definition.create({rootId:context.root});row.createMs=performance.now()-start;
   for(let i=0;i<=30;i++)model.update(i/30,parameters);
   const progress=[...Array.from({length:121},(_,i)=>i/120),...context.stages,.03197,.97831,.1603687500000001,.605,.19,1,0];
   row.samples=[];
   for(const p of progress){const t=performance.now();model.update(p,parameters);row.samples.push({progress:p,ms:performance.now()-t});}
   row.update=stats(row.samples.map(x=>x.ms));
   row.repeated=[];model.update(.605,parameters);for(let i=0;i<12;i++){const t=performance.now();model.update(.605,parameters);row.repeated.push(performance.now()-t);}row.repeatedPose=stats(row.repeated);
   row.geometry=census(model.group);row.result='complete';
  }catch(error){row.result='failed';row.error=String(error);result.errors.push({id:entry.id,rootId:context.root,parameters,error:String(error)});}
  finally{if(model)dispose(model);model=null;}
  result.rows.push(row);console.log(JSON.stringify({index:row.index,id:row.id,root:row.rootId,result:row.result,createMs:row.createMs,mean:row.update?.mean,p95:row.update?.p95}));
 }
 await fs.writeFile(new URL(output+'.json',directory),JSON.stringify(result));
}
result.finishedAt=new Date().toISOString();await fs.writeFile(new URL(output+'.json',directory),JSON.stringify(result));
const summary={...result,rows:result.rows.map(({samples,repeated,...row})=>row)};await fs.writeFile(new URL(output+'-summary.json',directory),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({completed:result.rows.length,models:new Set(result.rows.map(r=>r.id)).size,errors:result.errors.length}));if(result.errors.length||result.rows.length!==inventory.models.filter(entry=>!selected||selected.includes(entry.id)).reduce((n,e)=>n+e.contexts.reduce((n,c)=>n+c.combinations.length,0),0))process.exitCode=1;
