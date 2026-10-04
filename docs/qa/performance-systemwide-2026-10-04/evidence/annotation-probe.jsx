import React from 'react';
import {createRoot} from 'react-dom/client';
import ProcessScene from '../../../../src/processes/ProcessScene.jsx';
import {processLoaders} from '../../../../src/processes/loaders.js';
import '../../../../src/styles.css';
import '../../../../src/processes/processes.css';
const fixture=document.querySelector('#fixture'),status=document.querySelector('#status');
const style=document.createElement('style');style.textContent='html,body{margin:0;background:#f5f5f7}header{height:70px;padding:8px 18px;display:flex;gap:20px;align-items:center}#fixture{width:760px;height:520px;position:relative}.process-scene-shell{height:100%}';document.head.append(style);
const fonts=document.createElement('style');document.head.append(fonts);
const root=createRoot(fixture),sleep=ms=>new Promise(r=>setTimeout(r,ms));
let api=null;const ready=value=>{api=value};
const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const check=(value,message)=>{if(!value)throw Error(message)};
async function settle(){const deadline=performance.now()+30000;while(!api?.ready||document.querySelector('.process-canvas')?.dataset.renderState!=='idle'){if(performance.now()>deadline)throw Error('Scene settle timeout');await sleep(30);}await frames();}
const snapshot=()=>({labels:[...document.querySelectorAll('.process-model-label')].map(e=>({text:e.textContent,style:e.getAttribute('style'),width:e.offsetWidth,height:e.offsetHeight})),lines:[...document.querySelectorAll('.process-label-leaders line')].map(e=>[...e.attributes].map(a=>[a.name,a.value])),keys:[...document.querySelectorAll('.process-annotation-item')].map(e=>({text:e.textContent,style:e.getAttribute('style'),hidden:e.hidden}))});
const save=async(name,body)=>{const response=await fetch(`http://127.0.0.1:5194/${name}`,{method:'POST',body});check(response.ok,'Evidence save failed')};
window.annotationRecovery={status:'ready'};
document.querySelector('#start').onclick=async()=>{
 document.querySelector('#start').disabled=true;status.textContent='Running';
 const record={startedAt:new Date().toISOString(),checks:[],errors:[],hiddenMutations:0,hiddenMeasurements:0};let observer;const original={};
 try{
  const definition=(await processLoaders.apoptosis()).default,parameters={condition:'stress'};
  let props={definition,rootId:'cell',parameters,progress:.36,lang:'zh',annotations:false,onSceneReady:ready};
  const render=async(changes)=>{props={...props,...changes};root.render(<ProcessScene {...props}/>);await frames();await settle();};
  await render({});await document.fonts.ready;await settle();
  const hidden=()=>document.querySelector('.process-scene-shell')?.dataset.annotations==='false';
  observer=new MutationObserver(items=>{if(hidden())for(const item of items){if(item.target.matches?.('.process-annotation-key')&&item.attributeName==='aria-label')continue;record.hiddenMutations++;(record.mutationDetails??=[]).push({type:item.type,attribute:item.attributeName,target:item.target.nodeName,className:item.target.getAttribute?.('class')});}});
  for(const element of document.querySelectorAll('.process-model-labels,.process-annotation-key'))observer.observe(element,{subtree:true,childList:true,characterData:true,attributes:true});
  for(const key of ['offsetWidth','offsetHeight']){original[key]=Object.getOwnPropertyDescriptor(HTMLElement.prototype,key);Object.defineProperty(HTMLElement.prototype,key,{...original[key],get(){if(hidden()&&this.matches('.process-model-label'))record.hiddenMeasurements++;return original[key].get.call(this);}});}
  for(const progress of [.445,.605,.825,.94])await render({progress});
  await render({lang:'en'});fixture.style.width='620px';fonts.textContent='.process-model-label{font-family:Georgia,serif!important;font-size:16px!important}';document.fonts.dispatchEvent(new Event('loadingdone'));await frames();await settle();
  observer.disconnect();observer=null;
  check(record.hiddenMutations===0,'Hidden annotations wrote to DOM');check(record.hiddenMeasurements===0,'Hidden annotations measured DOM');record.checks.push('Zero hidden DOM mutations and label size reads across timeline/language/resize/font changes');
  await render({annotations:true});record.recovered=snapshot();
  check(record.recovered.labels.some(e=>e.text&&e.style.includes('visible')&&e.width>0&&e.height>0),'Recovered labels missing');
  const recoveredView=api.getView();root.render(null);await frames();api=null;await render({});api.setView(recoveredView);await frames();await settle();record.fresh=snapshot();
  check(JSON.stringify(record.recovered)===JSON.stringify(record.fresh),'Recovered annotations differ from fresh visible scene');record.checks.push('Recovered English text, measured sizes, placement, leader coordinates and key match fresh visible mount exactly');
  const capture=api.captureFrame({width:960,height:640,labels:true,progress:.94,background:'#f5f5f7'});await save('annotation-recovery.png',await new Promise(r=>(capture.canvas||capture).toBlob(r,'image/png')));record.checks.push('Capture with labels succeeds after hidden changes');record.result='passed';
 }catch(error){record.result='failed';record.errors.push(String(error));}
 finally{observer?.disconnect();for(const [key,descriptor]of Object.entries(original))Object.defineProperty(HTMLElement.prototype,key,descriptor);}
 await save('annotation-recovery.json',JSON.stringify(record,null,2));window.annotationRecovery=record;status.textContent=`${record.result}: ${record.checks.length} checks; ${record.errors.join('; ')}`;document.querySelector('#start').disabled=false;
};
