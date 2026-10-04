import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
const dir=new URL('./',import.meta.url),baseline='/tmp/bioscape-systemwide-20261004-baseline-ae697be',optimized=process.cwd();
const runs=[];
for(const kind of ['processes','structures'])for(const [index,version]of ['baseline','optimized','optimized','baseline'].entries()){
 const source=version==='baseline'?baseline:optimized,name=`paired-${kind}-${version}-${index}`;
 const file=await fs.open(new URL(name+'.log',dir),'w');
 const row={kind,version,name,source,startedAt:new Date().toISOString()};
 console.log(JSON.stringify({started:name}));
 const child=spawn(process.execPath,['--expose-gc',new URL('profile-'+kind+'.mjs',dir).pathname],{env:{...process.env,BIOSCAPE_PROFILE_SOURCE:source,BIOSCAPE_PROFILE_OUTPUT:name,BIOSCAPE_PROFILE_WORKER_BOUNDS:String(version==='optimized')},stdio:['ignore',file.fd,file.fd]});
 row.exitCode=await new Promise(resolve=>child.on('close',resolve));await file.close();row.finishedAt=new Date().toISOString();runs.push(row);
 await fs.writeFile(new URL('paired-cpu-runs.json',dir),JSON.stringify({method:'Separate serial processes; same source-level inventory; AB/BA order. Worker bound preparation is enabled only where the actual worker enables it. No tests, build, capture or native playback runs concurrently. Browser/GPU effects measured separately.',runs},null,2)+'\n');console.log(JSON.stringify(row));if(row.exitCode)process.exit(row.exitCode);
}
