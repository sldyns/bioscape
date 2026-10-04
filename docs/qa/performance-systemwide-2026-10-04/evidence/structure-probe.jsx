import React from 'react';
import {createRoot} from 'react-dom/client';
import CellScene from '../../../../src/CellScene.jsx';
import '../../../../src/styles.css';
const query=new URLSearchParams(location.search),run=query.get('run')||'baseline-structures';
const timing=query.get('mode')==='timing';
const width=Number(query.get('width')||960),height=Number(query.get('height')||640);
const fixture=document.querySelector('#fixture'),status=document.querySelector('#status');
const style=document.createElement('style');style.textContent=`html,body{margin:0;background:#f5f5f7}header{height:48px;display:flex;gap:18px;align-items:center;padding:0 18px;font:13px system-ui;background:#fff}#fixture{width:${width}px;height:${height}px;position:relative}.model-canvas{width:100%;height:100%}`;document.head.append(style);
const root=createRoot(fixture),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
let api=null,active=null;const ready=value=>{api=value};
const rootIds=['cell','plant','bacterium','phage','yeast','paramecium','neuron','muscleFibre','erythrocyte'];
const selected=query.get('ids')?.split(',');
const configurations=rootIds.filter(id=>!selected||selected.includes(id)).flatMap(id=>timing?[[id,'whole',0],[id,'whole',0]]:[[id,'whole',0],[id,'section',0],[id,'explode',65]]);
window.structureComparison={run,status:'ready',records:[]};
window.addEventListener('error',e=>active?.errors.push(String(e.error||e.message)));
const save=async(name,body)=>{const r=await fetch(`http://127.0.0.1:5194/${name}`,{method:'POST',body});if(!r.ok)throw Error(await r.text())};
async function execute(){
 document.querySelector('#start').disabled=true;window.structureComparison.status='running';
 for(const [index,[nodeId,mode,explode]] of configurations.entries()){
  const record={modeType:timing?'timing':'capture',cacheState:timing?(index%2?'warm':'cold'):null,key:`${run}-${index}-${nodeId}-${mode}-${explode}`,nodeId,mode,explode,images:[],errors:[]};active=record;api=null;
  status.textContent=`${index+1}/${configurations.length} ${nodeId} ${mode}`;
  try{
   const mount=performance.now();
   root.render(<CellScene key={record.key} nodeId={nodeId} viewKey={record.key} lang="zh" mode={mode} explode={explode} labels={true} rotate={timing} contracted={nodeId==='phage'} resetKey={0} zoom={{direction:null,key:0}} onEnter={()=>{}} onSceneReady={ready}/>);
   const deadline=performance.now()+90000;
   while(!api?.ready){if(performance.now()>deadline)throw Error('Readiness timeout');await sleep(40);}
   while(!timing&&document.querySelector('.model-canvas')?.dataset.renderState!=='idle'){if(performance.now()>deadline)throw Error('Settle timeout');await sleep(50);}
   await document.fonts.ready;await frames();record.readyMs=performance.now()-mount;record.originalView=api.getView();
   if(timing){
    record.raf=[];record.frameCpu=[];record.dataset={...document.querySelector('.model-canvas').dataset};
    const start=performance.now();await new Promise(resolve=>{function sample(now){record.raf.push(now);record.frameCpu.push(Number(document.querySelector('.model-canvas').dataset.frameCpuMs||0));if(now-start<1800)requestAnimationFrame(sample);else resolve();}requestAnimationFrame(sample);});
   }else for(const [name,view] of [['front',record.originalView],['turned',{direction:[.6,.25,.76],target:record.originalView.target,zoom:1.15}]]){
    if(!api.setView(view))throw Error('View rejected');await frames();record[name]=api.getView();
    const frame=api.captureFrame({width,height,background:'#f5f5f7',labels:true});const blob=await new Promise(r=>(frame.canvas||frame).toBlob(r,'image/png'));
    const file=`${record.key}-${name}.png`;await save(file,blob);record.images.push({name:file,width,height});
   }
   record.result='complete';
  }catch(e){record.errors.push(String(e));record.result='failed';}
  finally{root.render(null);await frames();}
  window.structureComparison.records.push(record);await save(`${record.key}.json`,JSON.stringify(record));await save(`${run}-manifest.json`,JSON.stringify({run,completed:window.structureComparison.records.length,selected:configurations.length,records:window.structureComparison.records}));
 }
 active=null;window.structureComparison.status='complete';status.textContent=`Complete; errors ${window.structureComparison.records.reduce((n,r)=>n+r.errors.length,0)}`;document.querySelector('#start').disabled=false;
}
document.querySelector('#start').onclick=()=>execute().catch(e=>{status.textContent=String(e);window.structureComparison.status='failed'});
