import fs from 'node:fs';
import path from 'node:path';
import {processCatalog,processesByRoot} from '../../src/processes/catalog.js';
const dir=path.dirname(new URL(import.meta.url).pathname);
const reports=fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&!['inventory.json','global.json'].includes(f));
const byId=new Map(), problems=[];
for(const f of reports){
 let report;
 try{report=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));}catch(e){problems.push(`${f}: incomplete JSON`);continue;}
 for(const m of report.models??[]){
  if(!processCatalog[m.id]) problems.push(`${f}: unknown id ${m.id}`);
  if(byId.has(m.id)) problems.push(`${f}: duplicate review ${m.id}`);
  byId.set(m.id,{...m,report:f,reviewer:report.reviewer});
 }
}
const rows=Object.values(processCatalog).map(e=>({id:e.id,title:e.title.zh,roots:Object.keys(processesByRoot).filter(r=>processesByRoot[r].includes(e.id)),...(byId.get(e.id)??{verdict:'pending',findings:[]})}));
const totals={models:rows.length,reviewed:rows.filter(x=>x.verdict!=='pending').length,issues:rows.flatMap(x=>x.findings??[]).length,pending:rows.filter(x=>x.verdict==='pending').map(x=>x.id),problems};
fs.writeFileSync(path.join(dir,'global.json'),JSON.stringify({phase:'A',totals,models:rows},null,2)+'\n');
const labels={confirmed_issue:'发现问题',qualified_pass:'有边界通过',unresolved:'待核实',pending:'审查中'};
let md='# 生物学过程全局科学审计\n\n技术回归与截图检查不等于科学正确性验证。本表以逐项代码、几何、动画、物种范围与科学资料交叉审查为依据。\n\n';
md+=`覆盖 ${totals.reviewed}/${totals.models} 项，已记录 ${totals.issues} 项问题。${totals.pending.length?'尚未完成全局审查，暂不进入修复。':'全局初审覆盖完整，进入问题分级与逐项修复。'}\n\n`;
md+='| 过程 | 所属目录 | 初审 | 问题编号 | 审计记录 |\n|---|---|---|---|---|\n';
for(const m of rows) md+=`| ${m.title} (${m.id}) | ${m.roots.join(', ')} | ${labels[m.verdict]??m.verdict} | ${(m.findings??[]).map(f=>f.issueId+' '+f.severity).join('; ')||'—'} | ${m.report?'['+m.report+']('+m.report+')':'—'} |\n`;
md+='\n“有边界通过”表示本次审查未确认错误，并非穷尽证明或真实原子模拟。修复验收另记录，保留初审原始证据。\n';
fs.writeFileSync(path.join(dir,'GLOBAL_AUDIT.md'),md);
console.log(JSON.stringify(totals));
if(process.argv.includes('--complete')&&(totals.pending.length||problems.length))process.exitCode=1;
