import fs from 'node:fs/promises';
import {build} from 'esbuild';
import path from 'node:path';
const source=process.env.BIOSCAPE_PROFILE_SOURCE||'/tmp/bioscape-systemwide-20261004-baseline-ae697be';
const workerBounds=process.env.BIOSCAPE_PROFILE_WORKER_BOUNDS==='true';
const output=process.env.BIOSCAPE_PROFILE_OUTPUT||'baseline-structures';
const directory=new URL('./',import.meta.url),bundle=new URL(output+'-node.mjs',directory);
await build({stdin:{contents:`export {buildCell} from ${JSON.stringify(path.join(source,'src/scene/buildCell.js'))};export {loadDetailModel} from ${JSON.stringify(path.join(source,'src/scene/loadDetailModel.js'))};export {packCell,unpackCell,disposeCell} from ${JSON.stringify(path.join(source,'src/scene/cellTransfer.js'))};export {packDetail,unpackDetail} from ${JSON.stringify(path.join(source,'src/scene/detailTransfer.js'))};export {makePresentation} from ${JSON.stringify(path.join(source,'src/scene/presentation.js'))};export {rootIds} from ${JSON.stringify(path.join(source,'src/catalog/cellTypes.js'))};`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',packages:'external',outfile:bundle.pathname,logLevel:'silent'});
const api=await import(bundle);
const census=group=>{const geometries=new Set(),materials=new Set(),buffers=new Set();let nodes=0,meshes=0,instances=0;group.traverse(o=>{nodes++;if(o.isMesh)meshes++;instances+=o.isInstancedMesh?o.count:0;if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);if(o.instanceMatrix)buffers.add(o.instanceMatrix.array.buffer)});for(const g of geometries){for(const a of Object.values(g.attributes))buffers.add((a.array||a.data.array).buffer);if(g.index)buffers.add(g.index.array.buffer)}return{nodes,meshes,instances,geometries:geometries.size,materials:materials.size,geometryBackingBytes:[...buffers].reduce((n,b)=>n+b.byteLength,0)}};
const dispose=group=>{const resources=new Set();group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){resources.add(m);for(const v of Object.values(m))if(v?.isTexture)resources.add(v)}});for(const r of resources)r.dispose()};
const result={startedAt:new Date().toISOString(),source,workerBounds,method:'Serial Node screening of every root: direct construction, production pack/unpack, and makePresentation wall times recorded separately. No GPU, worker scheduling, network or browser-FPS claim. Three iterations per root; first is cold in this process, following iterations warm JavaScript paths.',rows:[],errors:[]};
for(const id of api.rootIds){
 for(let pass=0;pass<3;pass++){
 global.gc?.();let model,presentation,unpacked;
 try{const row={id,pass};let t=performance.now();model=id==='cell'?api.buildCell():await api.loadDetailModel(id);row.buildMs=performance.now()-t;
 const group=id==='cell'?model.cell:model;row.geometry=census(group);
 t=performance.now();const packed=id==='cell'?api.packCell(model,{prepareBounds:workerBounds}):api.packDetail(model,{prepareBounds:workerBounds,prepareSpheres:false});row.packMs=performance.now()-t;row.transferBytes=packed.buffers.reduce((n,b)=>n+b.byteLength,0);
 t=performance.now();unpacked=id==='cell'?api.unpackCell(packed.payload):api.unpackDetail(packed.payload);row.unpackMs=performance.now()-t;
 t=performance.now();presentation=id==='cell'?api.makePresentation(unpacked,id):api.makePresentation(null,id,unpacked);row.presentationMs=performance.now()-t;row.parts=presentation.parts.length;row.result='complete';result.rows.push(row);console.log(JSON.stringify(row));
 }catch(error){result.errors.push({id,pass,error:String(error)});console.log(JSON.stringify({id,pass,error:String(error)}));}
 finally{if(presentation)dispose(presentation.root);if(unpacked&&id==='cell')api.disposeCell(unpacked);if(model){if(id==='cell')api.disposeCell(model);else dispose(model)}model=null;unpacked=null;presentation=null;}
 }
 await fs.writeFile(new URL(output+'.json',directory),JSON.stringify(result,null,2)+'\n');
}
result.finishedAt=new Date().toISOString();await fs.writeFile(new URL(output+'.json',directory),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({roots:api.rootIds.length,runs:result.rows.length,errors:result.errors}));if(result.errors.length)process.exitCode=1;
