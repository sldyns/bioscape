import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createServer} from 'vite';
const repo=process.cwd(),baseline=await fs.realpath('/tmp/bioscape-systemwide-20261004-baseline-ae697be');
const directory='docs/qa/performance-systemwide-2026-10-04/evidence';
await fs.mkdir(path.join(baseline,directory),{recursive:true});
for(const file of ['probe.html','probe.jsx','structure-probe.html','structure-probe.jsx','browser-cases.json'])await fs.copyFile(path.join(repo,directory,file),path.join(baseline,directory,file));
const output=path.join(repo,directory,'browser');await fs.mkdir(output,{recursive:true});
for(const [root,port] of [[baseline,4206],[repo,4207]]){
 const server=await createServer({root,configFile:false,base:'./',cacheDir:`/tmp/bioscape-systemwide-vite-${port}`,resolve:{dedupe:['react','react-dom','three']},server:{host:'127.0.0.1',port,strictPort:true,hmr:false,fs:{allow:[repo,baseline]}},optimizeDeps:{include:['react','react-dom/client','three']}});
 await server.listen();console.log(`Comparison source ${root} at ${port}`);
}
http.createServer(async(req,res)=>{
 const origin=req.headers.origin;
 if(!['http://127.0.0.1:4206','http://127.0.0.1:4207'].includes(origin)){res.writeHead(403);res.end('Unexpected source');return;}
 res.setHeader('Access-Control-Allow-Origin',origin);
 if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','POST');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.end();return;}
 const name=(req.url||'').slice(1);
 if(req.method!=='POST'||!/^[a-zA-Z0-9._-]+\.(json|png)$/.test(name)){res.writeHead(400);res.end('Invalid artifact name');return;}
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>24*1024*1024){res.writeHead(413);res.end('Artifact too large');return;}chunks.push(chunk);}
 await fs.writeFile(path.join(output,name),Buffer.concat(chunks));res.end('saved');
}).listen(5194,'127.0.0.1',()=>console.log('Comparison artifact sink at 5194'));
