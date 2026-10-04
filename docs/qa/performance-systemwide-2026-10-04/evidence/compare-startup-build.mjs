import fs from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {parseAst} from 'rollup/parseAst';
const directory=new URL('./',import.meta.url);
async function collect(root){
 const html=await fs.readFile(path.join(root,'index.html'),'utf8'),modules=new Map();
 const seeds=[...html.matchAll(/(?:src|href)="([^\"]+\.js)"/g)].map(m=>path.resolve(root,m[1]));
 async function visit(file){
  if(modules.has(file))return;
  const source=await fs.readFile(file,'utf8'),body=parseAst(source).body,record={file:path.relative(root,file),bytes:Buffer.byteLength(source),gzipBytes:gzipSync(source).length,imports:[]};modules.set(file,record);
  for(const node of body)if((node.type==='ImportDeclaration'||node.type==='ExportNamedDeclaration'||node.type==='ExportAllDeclaration')&&node.source?.value?.startsWith('.')){const dep=path.resolve(path.dirname(file),node.source.value);record.imports.push(path.relative(root,dep));await visit(dep)}
 }
 for(const seed of seeds)await visit(seed);
 const rows=[...modules.values()].sort((a,b)=>a.file.localeCompare(b.file));return{root,htmlBytes:Buffer.byteLength(html),entries:seeds.map(p=>path.relative(root,p)),files:rows,totalJavaScriptBytes:rows.reduce((n,r)=>n+r.bytes,0),totalGzipJavaScriptBytes:rows.reduce((n,r)=>n+r.gzipBytes,0)};
}
const baseline=await collect('/tmp/bioscape-systemwide-20261004-baseline-dist-ae697be'),optimized=await collect(path.join(process.cwd(),'dist'));
const result={recordedAt:new Date().toISOString(),method:'Actual Vite production HTML entry/preload modules and recursively parsed static imports only; gzip per file. Dynamic chunks are excluded until requested. This is transferred code size, not network latency or homepage interaction timing.',baseline,optimized,change:{bytes:optimized.totalJavaScriptBytes-baseline.totalJavaScriptBytes,percent:(optimized.totalJavaScriptBytes/baseline.totalJavaScriptBytes-1)*100,gzipBytes:optimized.totalGzipJavaScriptBytes-baseline.totalGzipJavaScriptBytes,gzipPercent:(optimized.totalGzipJavaScriptBytes/baseline.totalGzipJavaScriptBytes-1)*100}};
await fs.writeFile(new URL('startup-build-comparison.json',directory),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({baseline:baseline.totalJavaScriptBytes,optimized:optimized.totalJavaScriptBytes,baselineGzip:baseline.totalGzipJavaScriptBytes,optimizedGzip:optimized.totalGzipJavaScriptBytes,change:result.change}));
