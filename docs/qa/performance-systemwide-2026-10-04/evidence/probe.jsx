import React from 'react';
import {createRoot} from 'react-dom/client';
import ProcessExperience from '../../../../src/processes/ProcessExperience.jsx';
import {processLoaders} from '../../../../src/processes/loaders.js';
import '../../../../src/styles.css';

const query=new URLSearchParams(location.search);
const run=query.get('run')||'baseline',mode=query.get('mode')||'capture';
const selected=query.get('ids')?.split(',');
const allCases=await (await fetch('./browser-cases.json')).json();
const matching=allCases.filter(item=>!selected||selected.includes(item.id));
const cases=mode==='play'?matching.filter((item,i)=>matching.findIndex(other=>other.id===item.id)===i):matching;
const windowMs=Number(query.get('windowMs')||0),initialProgress=Number(query.get('progress')||0);
const annotations=query.get('labels')!=='false';
const style=document.createElement('style');
style.textContent='html,body{height:100%;overflow:hidden}#probe-header{height:48px;display:flex;align-items:center;gap:16px;padding:8px 18px;background:#fff;border-bottom:1px solid #ddd;font:12px system-ui}#probe-header button{padding:5px 10px}#fixture{height:calc(100vh - 48px)}.process-workspace{height:calc(100vh - 48px);min-height:0;grid-template-columns:218px minmax(0,1fr) 306px}';
document.head.append(style);
const root=createRoot(document.querySelector('#fixture'));
const status=document.querySelector('#status');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
async function save(name,body){const result=await fetch(`http://127.0.0.1:5194/${name}`,{method:'POST',body});if(!result.ok)throw Error(await result.text());}
let api=null,active=null;
window.perfReview={run,mode,status:'ready',records:[]};
window.addEventListener('error',e=>active?.errors.push(String(e.error||e.message)));
window.addEventListener('unhandledrejection',e=>active?.errors.push(String(e.reason)));
async function snapshot(record,progress){
 const frame=api.captureFrame({width:960,height:640,background:'#f5f5f7',labels:true,progress});
 const canvas=frame.canvas||frame;
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 const name=`${record.key}-${Math.round(progress*1000)}.png`;
 await save(name,blob);record.images.push({name,progress,width:960,height:640});
}
async function execute(){
 document.querySelector('#start').disabled=true;window.perfReview.status='running';
 for(const [index,item] of cases.entries()){
  const id=item.id;
  const definition=(await processLoaders[id]()).default,original=definition.create;
  const record={key:`${run}-${String(index).padStart(2,'0')}-${id}`,id,root:item.root,parameters:item.parameters,annotations,mode,startedAt:new Date().toISOString(),updates:[],images:[],errors:[],raf:[],viewport:[innerWidth,innerHeight],dpr:devicePixelRatio};
  active=record;api=null;
  definition.create=(...args)=>{const model=original(...args),update=model.update;model.update=(p,parameters)=>{const start=performance.now();const result=update(p,parameters);if(record.playing)record.updates.push({progress:p,now:start,ms:performance.now()-start});return result;};return model;};
  const mount=performance.now();status.textContent=`${index+1}/${cases.length} ${id}`;
  try{
   root.render(<ProcessExperience key={record.key} processId={id} rootId={item.root} lang="zh" initialState={{progress:initialProgress,speed:1.5,parameters:item.parameters,annotations}} onSceneReady={value=>{api=value;}}/>);
   while(!api?.ready){if(performance.now()-mount>90000)throw Error('Readiness timeout');await sleep(30);}
   await document.fonts.ready;await frames();record.readyMs=performance.now()-mount;
   if(mode==='capture'){
    for(const progress of item.poses){await snapshot(record,progress);await frames();}
   }else{
    let raf=0;const sample=now=>{if(record.playing){record.raf.push(now);raf=requestAnimationFrame(sample);}};
    record.playing=true;record.playStart=performance.now();raf=requestAnimationFrame(sample);
    const play=document.querySelector('.process-play');if(play?.getAttribute('aria-label')!=='播放')throw Error('Native Play missing');play.click();
    const deadline=performance.now()+definition.duration*1400+15000;
    while(api.getProgress()<1-1e-9&&(!windowMs||performance.now()-record.playStart<windowMs)){if(performance.now()>deadline)throw Error('Playback timeout');await sleep(50);}
    record.playing=false;cancelAnimationFrame(raf);record.wallMs=performance.now()-record.playStart;
    if(windowMs)document.querySelector('.process-play')?.click();
    record.terminal=api.getProgress();record.timeline=Number(document.querySelector('#process-timeline').value);
   }
   record.result='complete';
  }catch(error){record.result='failed';record.errors.push(String(error));}
  finally{record.playing=false;definition.create=original;root.render(null);await frames();}
  await save(`${record.key}.json`,JSON.stringify(record));window.perfReview.records.push(record);
  await save(`${run}-manifest.json`,JSON.stringify({run,mode,completed:window.perfReview.records.length,selected:cases.length,records:window.perfReview.records.map(({updates,raf,...r})=>r)}));
  active=null;
 }
 window.perfReview.status='complete';status.textContent=`Complete ${cases.length}/${cases.length}; errors ${window.perfReview.records.reduce((n,r)=>n+r.errors.length,0)}`;document.querySelector('#start').disabled=false;
}
document.querySelector('#start').onclick=()=>execute().catch(error=>{status.textContent=String(error);window.perfReview.status='failed';});
