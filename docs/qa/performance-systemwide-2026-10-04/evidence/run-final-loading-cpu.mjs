import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
const base=new URL('./',import.meta.url);
const runs=['baseline-0','optimized-1','optimized-2','baseline-3'];
const receipt={startedAt:new Date().toISOString(),runs:[]};
for(const name of runs){
 const output='final-structures-'+name,optimized=name.startsWith('optimized');
 const logfile=await fs.open(new URL(output+'.log',base),'w');
 const startedAt=new Date().toISOString();
 const child=spawn(process.execPath,['--expose-gc',new URL('profile-structures.mjs',base).pathname],{env:{...process.env,BIOSCAPE_PROFILE_SOURCE:optimized?process.cwd():'/tmp/bioscape-systemwide-20261004-baseline-ae697be',BIOSCAPE_PROFILE_OUTPUT:output,BIOSCAPE_PROFILE_WORKER_BOUNDS:String(optimized)},stdio:['ignore',logfile.fd,logfile.fd]});
 const exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve)});await logfile.close();
 const item={name,startedAt,finishedAt:new Date().toISOString(),exitCode};receipt.runs.push(item);console.log(JSON.stringify(item));
 await fs.writeFile(new URL('final-loading-cpu-runs.json',base),JSON.stringify(receipt,null,2)+'\n');
 if(exitCode!==0)throw Error('Failed '+name);
}
receipt.finishedAt=new Date().toISOString();
await fs.writeFile(new URL('final-loading-cpu-runs.json',base),JSON.stringify(receipt,null,2)+'\n');
