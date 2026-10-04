import fs from 'node:fs/promises';
import {processCatalog} from '../../../src/processes/catalog.js';
const base=new URL('./',import.meta.url);
const read=async file=>JSON.parse(await fs.readFile(new URL(file,base),'utf8'));
const [inventory,reconciliation,playback,conditions,check]=await Promise.all([
 read('inventory.json'),read('reconciliation.json'),read('evidence/playback-summary.json'),
 read('evidence/condition-summary.json'),read('evidence/final-check.json'),
]);
if(reconciliation.pending.length||reconciliation.errors.length||conditions.bad.length||playback.missing.length||check.exitCode!==0||!check.sourceSetStable||playback.rows.some(row=>row.errors.length||row.terminal!==1||row.timeline!==1000||row.backward))
 throw Error('A required completion gate is still open.');
const visualReports=new Map();
for(const model of inventory.models){
 const file=model.group==='original'?'resolutions/original-rendered-all-cases.md':`resolutions/${model.group}-rendered-all-cases.md`;
 await fs.access(new URL(file,base));visualReports.set(model.group,file);
}
const rows=inventory.models.map(model=>{
 const cases=conditions.rows.filter(row=>row.id===model.id);
 const full=playback.rows.find(row=>row.id===model.id);
 return `| ${processCatalog[model.id].title.zh} · \`${model.id}\` | ${model.roots.join(', ')} | ${cases.length} | ${cases.reduce((n,r)=>n+r.imageCount,0)} | [完整播放](${`evidence/${full.record}`}) · [逐组画审](${visualReports.get(model.group)}) |`;
});
const maxP95=Math.max(...playback.rows.map(row=>row.p95IntervalMs));
const text=`# 全部 84 个生物学过程：独立审查与修复

本轮以 \`${inventory.baseline}\` 为基线，由主审和 22 个模块审查代理独立核对科学机制、真实几何、条件分支、双语表达与连续运动。覆盖 **84 个过程、114 个结构/过程入口组合、235 个入口与条件组合**。当前记录的 **${reconciliation.totalIssues} 项问题均已修复并逐项记录**（${reconciliation.severities.P1} 项 P1，${reconciliation.severities.P2} 项 P2），结案核对无遗漏或重复。

修复包含膜与分子通路的连接关系、DNA/染色体身份及方向、阶段事件和标签时序、蛋白与细胞器的空间关系、默认剖面的可见性，以及任意跳转和连续播放行为。保留模型精度；储存体或移动体的错误尺寸/位置按真实几何边界校正，没有用降低网格精度来通过性能检查。

## 验证结果

| 验证门 | 已完成内容 | 可复核证据 |
| --- | --- | --- |
| 独立科学审查 | 84/84；初审24个有条件通过，60个发现问题；原始审查不改写 | [审查清单](inventory.json)、[初审记录](audits/)、[结案核对](reconciliation.json) |
| 问题修复 | ${reconciliation.totalIssues}/${reconciliation.totalIssues}；针对性几何/事件回归及修复前失败对照 | [逐项结案](resolutions/)、各模块 evidence 目录 |
| 原生完整播放 | 84/84 默认根/条件从0到1；晚期运动修复另行完整重播 | [完整播放汇总](evidence/playback-summary.json) |
| 全根与全条件 | 235/235；${conditions.nativeSeeks}次实际时间线跳转，无失败或目标姿态不一致 | [条件验证汇总](evidence/condition-summary.json) |
| 渲染画面 | 最新case共${conditions.renderedImages}张960×640阶段/关键帧，原图保留；各组逐case人工复核 | [最终画廊](evidence/browser/conditions-final-latest-gallery.html)、[逐case图索引](evidence/browser/conditions-final-latest-gallery-index.json)、[保留的各版图](evidence/browser/conditions-final-gallery.html) |
| 播放交互 | 实际暂停、倍速、拖动、重播、条件切换、导出后恢复、退出；暂停时不反复更新模型；正式工作台预览与返回 | [交互记录](evidence/browser/player-interactions.json)、[播放器结案](resolutions/player.md)、[正式工作台](evidence/player/actual-studio-return.md) |
| 整合 | \`npm run check\` 通过（格式、全验证链、构建、发布资源检查）；${check.codeFilesChecked}个改动源码/测试/脚本的检查前后哈希一致 | [完整日志](evidence/final-check.log)、[退出状态与源码收据](evidence/final-check.json) |

已打开[光合作用页面](http://127.0.0.1:4201/#/plant?view=process&process=photosynthesis)并停在第五阶段；[当前页面截图](evidence/browser/final-actual-photosynthesis.png)与[工作台预览截图](evidence/browser/actual-studio-preview.png)均来自实际产品界面。

播放器现在按显示帧推进模型；界面进度文本仍适度限频。原生播放记录累计保留 ${playback.totalSuccessfulRuns} 次成功运行、${playback.allSuccessfulUpdates.toLocaleString('en-US')} 次模型更新。默认case中最慢的95分位模型更新间隔为 ${maxP95.toFixed(1)} ms；这是带记录的本地桌面开发环境，包含并行检查期间的运行，不能当作所有硬件的固定FPS保证。汇总保留所有非导出区间的慢帧，不裁掉长停顿；截图导出时间窗单独剔除并计数。

## 关键修复与证据

- [分泌](resolutions/original-secretion.md)、[光合作用](resolutions/original-photosynthesis.md)：脂质/融合交接、类囊体双叶与腔道贯通、膜蛋白位置和开放流路径。
- [基因组](resolutions/genome.md)、[转录](resolutions/original-transcription.md)、[RNA运输](resolutions/rna.md)：真实链端、切割状态、通道连接与实际蛋白表面锚点。
- [分裂](resolutions/division.md)、[植物生长](resolutions/plantGrowth.md)、[酵母](resolutions/yeastLife.md)：染色体阶段身份、分裂沟/胞质桥、配子融合，以及产孢核膜分区收颈的连续形变。
- [信号](resolutions/signals.md)、[植物连接](resolutions/plantConnections.md)、[噬菌体](resolutions/phageLife.md)：细胞质内装配路径、液泡腔内储存、清除碎片尺度及DNA切离断口。
- [共享标签避让](resolutions/player-label-layout.md)及[引线绘制层次](resolutions/player-label-layer.md)：复用已读回的模型透明度避开主体，先画所有引线，再画文字框。三个既有遮挡场景的模型像素覆盖从3205/1761/2770降到0，完整保留全部标签和字号；中英文与透明导出均另有原图签收。

## 每一个过程的覆盖

表内“完整播放”链接指向默认根/条件的真实原生播放记录；“逐组画审”区分静态画面、几何回归与完整播放，不把任意跳转当成所有条件的完整视频验收。

| 过程 | 注册根节点 | 条件组合 | 最新帧数 | 证据 |
| --- | --- | ---: | ---: | --- |
${rows.join('\n')}

## 证据边界与保留

这次结案表示所有登记的明确问题均有修复与验证，并不构成“任何视角、任何时刻绝无错误”的绝对保证。微小化学键、被真实结构遮住的结合点和瞬时连接，以原始来源与实际三角面/世界坐标回归为依据；阶段图不会被提升为逐像素、逐帧或物理实验的证明。模块画审报告逐一保留这些具体边界。

所有235个组合都做了原生时间线任意跳转和关键帧检查；84个过程的默认条件都跑过完整时间线，另对后期运动修复与相关条件补做完整播放。没有声称235个组合都由人从头到尾观看完整视频。物理手机、其他GPU和全视角性能不在本次本地验证范围。

原Phase A、修复前源码/截图、失败对照及所有早期记录都保留。共享引线绘制层次的最后修复只改变导出层次，不改变几何、相机、文本、字体或布局；早期图仍支持几何/条件检查，最终绘制另以中英文、密集标签和透明原图复验，见对应结案报告。被中断的full-a记录明确保留为中断记录，不计入成功完整播放覆盖。

本轮工作保存在本地，未提交、推送或部署。构建及发布资源检查通过不等于线上发布或实机验收。
`;
await fs.writeFile(new URL('README.md',base),text);
console.log(JSON.stringify({report:new URL('README.md',base).pathname,models:rows.length,issues:reconciliation.totalIssues,cases:conditions.complete}));
