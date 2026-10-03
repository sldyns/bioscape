import React from 'react';
import {createRoot} from 'react-dom/client';
import CellScene from '../src/CellScene.jsx';

// Developer-only capture entry. Reuses a single CellScene/WebGL context.
const root = createRoot(document.querySelector('#fixture'));
const status = document.querySelector('#status');
const images = document.querySelector('#images');
const models = ['cell','plant','bacterium','yeast','paramecium','phage','erythrocyte','neuron','muscleFibre'];
const frames = () => new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
let api;
const onSceneReady = value => {if(value) api=value;};
const records = [];
window.homeCapture = {records};
async function run(){
for(const id of models){
 status.textContent = `Capturing ${id}…`;
 api=null;
 const mode = ['phage','erythrocyte','neuron'].includes(id)?'whole':'section';
 root.render(<CellScene nodeId={id} viewKey={`home/${id}`} mode={mode} explode={0} labels={false} rotate={false} resetKey={0} zoom={{direction:null,key:0}} lang="en" onEnter={()=>{}} onSceneReady={onSceneReady}/>);
 const began=performance.now();
 while(!api?.ready){if(performance.now()-began>60000)throw new Error(`Timeout ${id}`); await frames();}
 await new Promise(r=>setTimeout(r,900));
 const before=api.getView();
 api.setView({...before,direction:[0.08,0.12,1],zoom:1.04});
 await frames();
 const size=['cell','plant'].includes(id)?1400:1000;
 const frame=api.captureFrame({width:size,height:size,background:'transparent',labels:false});
 const canvas=frame.canvas||frame;
 const blob=await new Promise(r=>canvas.toBlob(r,'image/webp',0.95));
 const response=await fetch(`http://127.0.0.1:5179/${id}.webp`,{method:'POST',body:blob});
 if(!response.ok)throw new Error(`Save failed ${id}`);
 const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');
 img.src=URL.createObjectURL(blob);caption.textContent=id;figure.append(img,caption);images.append(figure);
 records.push({id,mode,width:size,height:size,bytes:blob.size,view:api.getView()});
 api.releaseCapture();
}
root.unmount();document.querySelector('#fixture').remove();
status.textContent='Complete: 9 genuine model captures';
await fetch('http://127.0.0.1:5179/manifest.json',{method:'POST',body:JSON.stringify(records,null,2)});
}
run().catch(error=>{status.textContent=error.stack;window.homeCapture.error=error.stack;});
