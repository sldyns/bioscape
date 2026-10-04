# Energy 全根/全条件渲染关键帧复核 · 2026-10-04

本轮逐张检查 **15/15 条件的全部 15 张联系表，共 110 个关键帧**，并另以原始 **960×640** 分辨率检查每个条件 1 张原图（15 张）。结论：在这些静态阶段中，未发现需要新增登记的能量模块科学拓扑、几何错位、对象标签终点或画面裁切问题。

所有条件均为 **限定范围通过：静态关键帧**。这个结论不代表全部条件连续播放、任意镜头/分辨率、中文标注、手机实机、性能或发布验收。共享标注绘制顺序导致引线穿过较早标签框的问题由总集成方处理，本报告不重复登记，也不宣布该共享项关闭。

## 输入与复核方法

- 输入索引：[conditions-final-gallery-index.json](../evidence/browser/conditions-final-gallery-index.json)。
- 索引 SHA-256：`eb13e2dc468856e76d625f7ae68358339b13117c2f9b7329ea5d793b14abbfde`。
- 逐张查看联系表内的 start、所有阶段和 end；随后逐条件查看下面链接的原图。没有替换、缩放写回或删除原始证据。
- respiration（8 条件）每条 7 帧：0、0.175、0.345、0.515、0.685、0.875、1。
- glycolysis（3 条件）每条 8 帧：0、0.095、0.285、0.455、0.595、0.795、0.945、1。
- bacterialEnergetics（2 条件）每条 7 帧：0、0.175、0.345、0.515、0.675、0.875、1。
- bacterialPhotosynthesis（2 条件）每条 8 帧：0、0.135、0.275、0.435、0.605、0.755、0.915、1。

## 逐条件结果

| 条件 | 帧数 | 原图复核 | 观察与结论 |
|---|---:|---|---|
| [respiration / cell / coupling=coupled](../evidence/browser/sheets/conditions-final-a-088-respiration-cell.jpg) | 7 | [p=0.685](../evidence/browser/conditions-final-a-088-respiration-cell-stage-5.webp) | **限定通过**。IMS/基质方向正确；I/III/IV 泵送和 Fo 回流区分，F1 面向基质，晚期可见 ATP。 |
| [respiration / cell / coupling=leak](../evidence/browser/sheets/conditions-final-a-089-respiration-cell.jpg) | 7 | [p=0.685](../evidence/browser/conditions-final-a-089-respiration-cell-stage-5.webp) | **限定通过**。泄漏通路与正常 Fo 回流可区分；晚期 IMS 质子显示和 ATP 产物低于耦联组。 |
| [respiration / plant / coupling=coupled](../evidence/browser/sheets/conditions-final-a-090-respiration-plant.jpg) | 7 | [p=0.685](../evidence/browser/conditions-final-a-090-respiration-plant-stage-5.webp) | **限定通过**。植物根的线粒体区室、移动载体、F1 朝向保持正确；c 环采用简化结构，其亚基数不可由本帧确认。 |
| [respiration / plant / coupling=leak](../evidence/browser/sheets/conditions-final-a-091-respiration-plant.jpg) | 7 | [p=0.685](../evidence/browser/conditions-final-a-091-respiration-plant-stage-5.webp) | **限定通过**。植物泄漏条件可辨识，较耦联组的梯度/ATP 显示降低；没有新增错误区室定位。 |
| [respiration / yeast / coupling=coupled](../evidence/browser/sheets/conditions-final-a-092-respiration-yeast.jpg) | 7 | [p=0.685](../evidence/browser/conditions-final-a-092-respiration-yeast-stage-5.webp) | **限定通过**。Ndi1 代替 I，并明确 no H+ pumping；该位置没有原 I 泵送箭头，III/IV 与 F1 方向保留。 |
| [respiration / yeast / coupling=leak](../evidence/browser/sheets/conditions-final-a-093-respiration-yeast.jpg) | 7 | [p=0.685](../evidence/browser/conditions-final-a-093-respiration-yeast-stage-5.webp) | **限定通过**。Ndi1 不泵质子与额外质子泄漏同时表达；晚期 ATP 显示较耦联条件减少。 |
| [respiration / paramecium / coupling=coupled](../evidence/browser/sheets/conditions-final-a-094-respiration-paramecium.jpg) | 7 | [p=0.685](../evidence/browser/conditions-final-a-094-respiration-paramecium-stage-5.webp) | **限定通过**。草履虫根保持 IMS/基质方向和 F1 朝向；c 环为简化结构，其物种亚基数未由图像证明。 |
| [respiration / paramecium / coupling=leak](../evidence/browser/sheets/conditions-final-a-095-respiration-paramecium.jpg) | 7 | [p=0.685](../evidence/browser/conditions-final-a-095-respiration-paramecium-stage-5.webp) | **限定通过**。草履虫泄漏条件可辨識且标签对应泄漏位置；降低的晚期梯度/ATP 显示与耦联组可比较。 |
| [glycolysis / cell / 无条件开关](../evidence/browser/sheets/conditions-final-a-096-glycolysis-cell.jpg) | 8 | [p=0.595](../evidence/browser/conditions-final-a-096-glycolysis-cell-stage-5.webp) | **限定通过**。六碳账本分为两组三碳，NAD 转化及两轮磷酸转移顺序可见；终点标注净 2 ATP、2 NADH、2 丙酮酸。 |
| [glycolysis / plant / 无条件开关](../evidence/browser/sheets/conditions-final-a-097-glycolysis-plant.jpg) | 8 | [p=0.595](../evidence/browser/conditions-final-a-097-glycolysis-plant-stage-5.webp) | **限定通过**。植物根保留相同的六碳账本和两条三碳路径；阶段 5 的碳链、核苷酸和酶标签贴合对象。 |
| [glycolysis / yeast / 无条件开关](../evidence/browser/sheets/conditions-final-a-098-glycolysis-yeast.jpg) | 8 | [p=0.595](../evidence/browser/conditions-final-a-098-glycolysis-yeast-stage-5.webp) | **限定通过**。酵母根保留相同的六碳账本和两条三碳路径；产物、两轮 ATP 与最终收支均在框内。 |
| [bacterialEnergetics / bacterium / route=ndh1-bo](../evidence/browser/sheets/conditions-final-a-099-bacterialEnergetics-bacterium.jpg) | 7 | [p=0.675](../evidence/browser/conditions-final-a-099-bacterialEnergetics-bacterium-stage-5.webp) | **限定通过**。NDH-I/bo3 泵送分支可见；Q/QH2 位于膜内，周质在外，F1 面向胞质，晚期出现 ATP。 |
| [bacterialEnergetics / bacterium / route=ndh2-bd](../evidence/browser/sheets/conditions-final-a-100-bacterialEnergetics-bacterium.jpg) | 7 | [p=0.675](../evidence/browser/conditions-final-a-100-bacterialEnergetics-bacterium-stage-5.webp) | **限定通过**。NDH-II 与 bd-I 分支几何/标签已切换；不显示其主动泵送箭头，仍区分 QH2 放质子和胞质化学质子位点。 |
| [bacterialPhotosynthesis / bacterium / light=light](../evidence/browser/sheets/conditions-final-a-101-bacterialPhotosynthesis-bacterium.jpg) | 8 | [p=0.755](../evidence/browser/conditions-final-a-101-bacterialPhotosynthesis-bacterium-stage-6.webp) | **限定通过**。PBS/F1 面向胞质，PSII 供体侧及 PC/c6 位于类囊体腔；光照、腔内质子积累及后期 ATP/NADPH 可见。 |
| [bacterialPhotosynthesis / bacterium / light=dark](../evidence/browser/sheets/conditions-final-a-102-bacterialPhotosynthesis-bacterium.jpg) | 8 | [p=0.755](../evidence/browser/conditions-final-a-102-bacterialPhotosynthesis-bacterium-stage-6.webp) | **限定通过**。没有光子、光驱动 H+ 积累或新 ATP/NADPH 产物；腔标签明确 light-driven flow stopped，载体位置变化不等同于净电子通量。 |

## 已修复标签的画面确认

对应 `20261004-energy-07`：本轮原图中，呼吸链 I/Ndi1、II/III/IV、Q、cytochrome c、Fo/F1、TCA 及泄漏标签指向可见对象/指定区域；糖酵解的碳链、核苷酸及反应站标签跟随本阶段的对象；细菌 NDH/氧化酶在支路切换后仍指向可见蛋白；蓝细菌的 PBS、PC/c6、FNR 和 F1 可从标注终点区分。未重现上一轮依赖旧文本偏移、让引线停在对象外空白处的现象。

本轮图像支持既有修复的可见结果；精确表面坐标、转移连续性及膜脂避碰的数值证据仍来自已有专项测试，不能仅靠稀疏帧重新证明。既有回归证据见 [energy-rendered.md](energy-rendered.md) 及 [label-science.log](../evidence/energy/label-science.log)。本轮没有再次运行测试或修改产品代码。

## 证据边界

- 本审查者只读本地截图及索引，未操作浏览器；没有亲自检查 15 条件的全程实时播放。原生不规则 seek 结果也不等价于全部条件连续播放。
- 关键帧间的瞬时遮挡、运动速度、逐帧连贯性不能由这 110 帧独立定论。
- 联系表与原图均使用英文标注、固定视角和 960×640 画布；不推导中文、移动端或其他视角的可读性。
- plant/paramecium 的 ATP 合酶 c 环为当前简化表达，图像通过不补足其物种结构来源或亚基数证据。
- 光照关闭组中载体位置可以改变，但没有光子或光驱动产物流；这组静态图不能证明或排除载体的全部动态行为。
- 共享引线与标签框交叠由总集成方单独复核。未因避让标签而移动真实结构锚点。

本轮新增问题数：**0**。产品源文件变更数：**0**。
