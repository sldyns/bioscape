import React from 'react';
import {createRoot} from 'react-dom/client';
import ProcessScene from '../src/processes/ProcessScene.jsx';
import {processLoaders} from '../src/processes/loaders.js';
const root=createRoot(document.querySelector('#fixture'));
const status=document.querySelector('#status');
const records=[];
let api;
const onSceneReady=value=>{if(value)api=value;};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function save(name,blob){const result=await fetch(`http://127.0.0.1:5183/${name}`,{method:'POST',body:blob});if(!result.ok)throw Error(`${name}: ${await result.text()}`);}
const toBlob=canvas=>new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.9));
async function run(){
const mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
if(!mimeType)throw Error('No supported recording codec');
for(const [id,rootId] of [['transcription','cell'],['mitosis','cell'],['photosynthesis','plant']]){
status.textContent=`Recording ${id}`;api=null;
const module=await processLoaders[id]();const definition={...module.default,...module.default.contexts?.[rootId]};
const parameters=Object.fromEntries((definition.controls||[]).map(control=>[control.id,control.default]));
root.render(<ProcessScene key={id} definition={definition} rootId={rootId} parameters={parameters} progress={0} lang="en" annotations={false} onSceneReady={onSceneReady}/>);
const deadline=performance.now()+45000;while(!api?.ready){if(performance.now()>deadline)throw Error(`Scene timeout ${id}`);await sleep(50);}
await sleep(300);
const output=document.createElement('canvas');output.width=640;output.height=400;const context=output.getContext('2d');
const draw=progress=>{const frame=api.captureFrame({width:640,height:400,background:'#f5f5f7',labels:false,progress});context.drawImage(frame.canvas||frame,0,0);};
draw(0);
const stream=output.captureStream(24);const chunks=[];const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:680000});
recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
const stopped=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=reject;});
recorder.start();const began=performance.now();const frameCount=168;
for(let frame=0;frame<frameCount;frame++){draw(frame/(frameCount-1));await sleep(Math.max(0,began+(frame+1)*1000/24-performance.now()));}
recorder.stop();await stopped;stream.getTracks().forEach(track=>track.stop());
const blob=new Blob(chunks,{type:mimeType});const extension=mimeType.includes('mp4')?'mp4':'webm';await save(`${id}.${extension}`,blob);
const section=document.createElement('section');const title=document.createElement('h2');title.textContent=id;section.append(title);
const video=document.createElement('video');video.src=URL.createObjectURL(blob);video.controls=true;video.muted=true;video.playsInline=true;section.append(video);
await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=reject;});
// MediaRecorder WebM may omit duration. A seek to the end lets the browser determine it.
if(!Number.isFinite(video.duration)){video.currentTime=1e6;await new Promise(resolve=>video.addEventListener('seeked',resolve,{once:true}));}
const duration=video.duration;
const samples=document.createElement('div');samples.className='samples';section.append(samples);document.querySelector('#review').append(section);
for(const [phase,fraction] of [['start',0],['middle',.5],['end',.985]]){
const target=Math.max(.001,Math.min(duration-.03,duration*fraction));video.currentTime=target;await new Promise(resolve=>video.addEventListener('seeked',resolve,{once:true}));
context.drawImage(video,0,0,640,400);const sample=await toBlob(output);await save(`${id}-${phase}.webp`,sample);const image=document.createElement('img');image.src=URL.createObjectURL(sample);image.alt=`${id} recorded video ${phase}`;samples.append(image);
}
video.currentTime=0;
records.push({id,rootId,parameters,file:`${id}.${extension}`,width:video.videoWidth,height:video.videoHeight,duration,bytes:blob.size,mimeType,progress:[0,1],framesRequested:frameCount,fpsRequested:24,source:'src/processes/ProcessScene.jsx captureFrame',view:api.getView()});
api.releaseCapture();
}
root.unmount();document.querySelector('#fixture').remove();await save('manifest.json',JSON.stringify(records,null,2));status.textContent=`Complete: ${records.length} genuine process recordings`;window.processMotionRecords=records;
}
document.querySelector('#record').addEventListener('click',event=>{event.currentTarget.disabled=true;run().catch(error=>{status.textContent=error.stack;console.error(error);});});
