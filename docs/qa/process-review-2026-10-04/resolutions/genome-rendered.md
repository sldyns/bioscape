# Genome 默认根／默认条件阶段图复核

结论：复制、DNA 修复和芽孢形成的本轮阶段图未见新的明确问题；P1 转导出现一项新的可视缺陷，已先报告主代理并完成源码修复，定向复截图待主代理执行。本记录不等于全控制组合验收，也不等于人工观看了完整连续视频。

## 范围与证据

- 从 `evidence/browser/gallery-index.json` 精确选取 `full-b1-` 前缀的本组四个 sheet，逐张查看了共 28 个阶段帧；原始帧均为 960 × 640、中文标签。
- 复制：`full-b1-000-replication-cell`，root=`cell`，ligase=`active`；p = 0, .135, .295, .595, .805, .935, 1。
- DNA 修复：`full-b1-001-dnaRepair-cell`，root=`cell`，incision=`active`；p = 0, .145, .325, .495, .655, .905, 1。
- 转导：`full-b1-002-transduction-phage`，root=`phage`，route=`p1`；p = 0, .175, .355, .525, .725, .915, 1。
- 芽孢：`full-b1-003-bacterialSporulation-bacterium`，root=`bacterium`，engulfment=`normal`；p = 0, .165, .335, .575, .745, .915, 1。
- 另查看原图：复制 stage-3；DNA 修复 stage-5；转导 stage-3、stage-4、stage-5、stage-6；芽孢 stage-5。sheet 位于 `evidence/browser/sheets/<key>.jpg`，原图及同名 JSON 位于 `evidence/browser/`。
- 只读核验已有 native JSON：四项均 `result=complete`、`errors=[]`、`monotonicLive=true`，最后进度均为 1，更新样本分别为 1451、1371、1451、1530。本代理未打开浏览器，也未人工逐帧观看上述全部样本；该日志证据与下列静态视觉结论分开。

## 逐模型视觉结论

| 模型 | 本轮所见 | 结论 |
| --- | --- | --- |
| replication | 可辨识复制叉推进、连续前导链、带引物的冈崎片段及终态两条双链。stage-3 原图的解旋酶标签线落在酶中央通道，亲本端点、前导链和引物标签均能对应可见目标；sheet 上各阶段文字没有互相覆盖。 | 默认条件阶段帧通过。 |
| dnaRepair | 损伤环、同链两处切口、保留的模板、离开的损伤寡核苷酸、补缺和封口顺序可辨。stage-5 原图中补缺酶、离开片段及下方模板标签线分别指向目标，没有先前的偏离。 | 默认条件阶段帧通过。 |
| transduction | 金色供体 DNA 在初始位点、提取阶段、颗粒包装阶段和受体内部均有可见对应。stage-3/4 原图可辨双链轮廓；stage-5 接合标签指向细胞顶部的受体入口，头部仍在胞外；stage-6 的胞内 DNA 标签指向实际金色双链。阶段采样本身不能证明两帧之间连续，也没有中途穿膜特写；连续性与膜口拓扑仍由已有几何回归单独支持。尾鞘收缩后出现下述空白断路观感。 | 存在新可视缺陷，暂不通过。 |
| bacterialSporulation | 可辨偏位分隔、吞噬、双膜包裹和外层成熟。stage-5 原图中内侧浅色膜、膜间金色皮层、外侧边界及最外紫色孢子衣有清楚的嵌套顺序；core DNA、皮层、孢子衣标签指向对应可见材料，终态为单个成熟芽孢。背面深度的严格层级由已有几何回归支持，单张正面剖视图不独立证明全表面关系。 | 默认条件阶段帧通过。 |

## 新发现：20261004-genome-08（P2，源码已修复，待定向视觉复验）

**P1 尾鞘收缩后，默认视角中的尾管不可见，头部与基板出现空白。**

- 明确证据：`evidence/browser/full-b1-002-transduction-phage-stage-6.webp`（p=.915）及对应 sheet 的 p=1；在 960 × 640 的 stage-6 原图中，短尾下端约 y=250，基板中央约 y=273，中间为背景色。头部与短尾因此显得悬空，而基板仍贴在细胞顶部。
- 对照：`full-b1-002-transduction-phage-stage-5.webp`（p=.725）未收缩时，完整尾鞘覆盖这一区域，接合外观连续。
- 只读源码线索：`transductionProcess.js` 的 `transduction-tail-tube-open-lumen` 是半圆、开放端面的 CylinderGeometry，使用默认 FrontSide 的 `tailmat`。内壁背面剔除可能导致默认视角不可见；这是待验证原因，静态图本身已经足以确认可见断路。
- 建议：保持既有开放管腔和 DNA 通路，仅修复尾管内壁在默认视角下的可见性，并复取 P1 p=.725/.82/.915/1 与 λ 对照阶段帧；需要同时核验真实尾管仍连接入口。
- 本代理先报告主代理，并在其明确授权后修复：现有尾管及入胞 conduit 的剖面使用独立 DoubleSide 材质；实心尾鞘等材料保持原状。旧的数值入口测试通过不能代替此项可见性验收。
- 新增 `tailVisibility.test.mjs` 已接入本组 science：2 roots × 2 routes × 4 stages，共 16 状态／144 条默认相机射线通过；测试采用 ProcessScene 的全动画视野拟合方法（960 × 640），检验实际三角面可见性及收缩后不被遮挡的管壁。同一回归拒绝冻结的修复前源码。
- `evidence/genome/tail-visibility-preservation.json` 的 16 状态前后哈希一致，覆盖全部对象名称、可见状态、变换、顶点／索引／实例缓冲区，确认未以改动几何或连接替代材质修复。fresh owned smoke、integrated science、格式与 diff 检查均通过。
- 原始截图和上述视觉发现保留不变；修复后的渲染结论必须等待主代理定向重播 transduction，当前没有用射线测试代替复截图。

后续 235 个根／条件组合的最终阶段帧仍需另行检查；本记录只覆盖上述四个默认根／条件。
