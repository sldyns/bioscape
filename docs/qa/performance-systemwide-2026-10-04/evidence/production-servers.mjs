import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain'};
for(const [port,root]of [[4208,'/tmp/bioscape-systemwide-20261004-baseline-dist-ae697be'],[4209,path.join(process.cwd(),'dist')]]){
 http.createServer(async(req,res)=>{
  try{const pathname=new URL(req.url,'http://localhost').pathname;if(!pathname.startsWith('/bioscape/')){res.writeHead(404);res.end('Use /bioscape/');return;}
   const name=decodeURIComponent(pathname.slice('/bioscape/'.length))||'index.html',file=path.resolve(root,name);if(!file.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);res.end();return;}
   const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found');}
 }).listen(port,'127.0.0.1',()=>console.log(`Production ${root} at http://127.0.0.1:${port}/bioscape/`));
}
