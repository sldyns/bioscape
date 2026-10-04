# parameciumLife 最终 root/control 渲染复核

结论：本组 5 个 case、5 张阶段拼图、38 个采样画面全部已查看，并检查 13 张必要的 960×640 原图。五个 case 的采样可见机制、阶段身份、结构终态和引线目标均未发现新的明确错误。伸缩泡 freshwater/mild 两环境均已覆盖；接合四个补帧已齐，09 的英文新文案在真实渲染中已确认。

本轮只读 `conditions-final-gallery-index.json` 中的 `conditions-final-b-` 证据及对应原图/JSON，没有操作浏览器或修改产品。只新增本报告。

## Case 清单及图数

共同证据目录：`docs/qa/process-review-2026-10-04/evidence/browser/`。表中 key 对应 `<key>.json`、`sheets/<key>.jpg` 及 `<key>-<阶段>.webp`。所有 case 的实际 root 均为 paramecium，语言为英文。

| Case key | 模型 / 参数 | 拼图内图数 | progress 覆盖 | 另看 960 原图 | 结论 |
| --- | --- | ---: | --- | ---: | --- |
| conditions-final-b-022-parameciumFeeding-paramecium | parameciumFeeding / {} | 7 | 0, .195, .355, .525, .745, .895, 1 | 2：stage-4/.525，stage-6/.895 | 采样通过 |
| conditions-final-b-023-contractileVacuole-paramecium | contractileVacuole / freshwater | 6 | 0, .195, .435, .645, .815, 1 | 1：stage-4/.645 | 采样通过 |
| conditions-final-b-024-contractileVacuole-paramecium | contractileVacuole / mild | 6 | 0, .195, .435, .645, .815, 1 | 2：stage-4/.645，stage-5/.815 | 采样通过 |
| conditions-final-b-025-parameciumDivision-paramecium | parameciumDivision / {} | 7 | 0, .175, .345, .545, .745, .925, 1 | 2：stage-5/.745，end/1 | 采样通过 |
| conditions-final-b-026-parameciumConjugation-paramecium | parameciumConjugation / {} | 12 | 0, .155, .335, .455, .565, .695, .815, .265, .49, .725, .925, 1 | 6：stage-2/.155；critical-265/.265；critical-490/.49；critical-725/.725；critical-925/.925；end/1 | 采样通过，09 修正文案已见 |

合计 38 幅阶段图，13 张原图放大复核；另有 5 张拼图容纳上述阶段图，不能将拼图数重复计入阶段图数。

## 逐 case 可见结论

### 022 — 进食

七阶段依次可见食物在口区聚集、新生泡、酸性小泡/溶酶体供体与食物泡、消化后移动、泡接近胞肛以及胞外残渣终态。p=.525 原图中 Food vacuole 和 Lysosomes 分别落在泡内及供体融合区域；p=.895 原图中泡与胞肛间短出口连续可辨，Food vacuole/Cytoproct 的引线目标分别保持在泡和排口。结束画面显示残渣在细胞外侧，泡不再残留为封闭完整囊。未发现采样帧中通路方向反转或标签目标混淆。

图像支持位置和拓扑外观，不能独立辨识所有双层膜顶点或追踪每一个原始颗粒的完整出泡轨迹；相应结论仍依赖既有实际几何回归。

### 023 — 伸缩泡 freshwater

六个阶段覆盖中央泡增大、六臂连接、排水前断开以及重新汇水。p=.645 原图中央泡已缩小，外侧臂与其分开；p=.815 拼图中可见重新连接。Central bladder、Dedicated discharge pore、Ampulla、Radial collecting canal 与 Spongiome tubules 的目标各在对应结构上，环境/皮层/胞质侧为区域标注。没有发现六臂错位或排孔移位的采样证据。

### 024 — 伸缩泡 mild

相同 progress 序列下，该条件并非简单复制 freshwater 的阶段：p=.645 原图仍是较大的连接状态，p=.815 原图则可见臂断开和由固定孔向外排出的蓝色水标记。p=1 再次连接。两环境保留相同六臂解剖框架、固定排孔及准确结构引线，条件差异表现为所处相位的变化。

两组图支持条件确实影响模型状态，不能从六张静图推算真实生理频率或证明所有水粒子回绕瞬间连续。mild 本轮为 irregular seeks，未新增该条件完整连续播放的验收。

### 025 — 横分裂

p=.345 的小核分裂装置、.545 的两个小核及口器位置、.745 的延伸大核与横向分裂沟、.925 的接近分离子体，以及 p=1 的两个独立子体均可辨。每个终态子体保留大核、小核、口器和皮层/纤毛结构。p=.745 与 p=1 原图中 Micronucleus、Macronucleus、Oral apparatus 和 Transverse cleavage furrow 的引线目标保持准确，Posterior daughter 为后子体区域标注。没有出现采样终态缺核、核类型互换或子体外壳缺失。

p=.91 的形变连续性不由这些离散画面单独证明；既有顶点连续性检查与此前 full-b3 播放属于独立证据。

### 026 — 接合及四个补帧

- p=.155 与 .265 的 960 原图均显示 **Micronucleus · meiosis in progress**。p=.265 可见两个较大核和两个较小的形成中核；p=.335 拼图切换为四个产物及 **Meiotic products · haploid**。这直接确认 09 的英文显示已延后到正确阶段；中文对应文字由已通过的双语单元回归覆盖，本轮没有中文新截图。
- p=.49 原图可见原核形成中，在保留核附近出现较小迁移核，旧大核片段仍保留。标签为 Pronuclei · haploid，没有提前写合核。
- p=.565 交换构图中，核位于口区通道附近；p=.695 标签为 Pronuclei fusing。p=.725 原图出现位置明确的较小合核，标签为 Synkaryon · diploid，补齐前轮缺失的合核形成画面。不能仅凭此配色和单张图独立证明双亲遗传成分；该身份仍与来源/核系回归共同判断。
- p=.815 显示两个后代核；p=.925 原图每个配偶可清楚数到八个后代核（前部四个、后部四个），并保留旧大核片段，尚未出现四个放大的大核原基。该补帧填补此前 2 核直接跳到末态之间的静态覆盖缺口。
- p=1 原图每个配偶后部四个大核原基、前部一个保留小核，旧大核片段仍在。两配偶保持各自细胞边界，没有变为永久融合细胞。
- 新版引线布局可读；本次查看的画面中没有引线贯穿可读文字的明确残留。末期若干引线斜跨模型到达同侧真实目标，但没有据此把正确目标移到空白处，也没有将这种构图视为新的机制错误。

四个补帧均已覆盖预定阶段。它们补齐的是可见状态，不是对早期核系每一帧连续性的逐帧人工验收。

## 证据边界

五个对应 JSON 均为 `kind: irregular-seeks`、`result: complete`、`errors: []`，`monotonicLive: false`。这说明模型在本轮非单调跳转/采样路径中完成取样，不能写成五个 case 全部完成了 full playback，也不能把约 1.5–2.5 秒采样时长或取样帧间隔当作动画 FPS。

本组此前 4 模型 full-b3 的连续播放记录和报告仍独立有效；当时伸缩泡仅 freshwater，且早于本次 09 文案和共享引线布局的新截图。本报告新增的可见验收范围为：全部 5 case 的所列采样状态、伸缩泡两环境、接合四个补帧，以及英文 09 文案和新版引线绘制。没有新增本轮产品修改、完整全条件连续播放、部署或物理设备验收。
