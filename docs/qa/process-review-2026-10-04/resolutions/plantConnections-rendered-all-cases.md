# plantConnections — 全 root / control 阶段图复核

日期：2026-10-04。状态：**本组 8/8 条件的阶段图已检查；新增 05/P2（CAM 储量示意越出液泡）已完成数值修复及 fresh 原图定向复核，现已关闭。源码继续冻结供主代理整合。其余七个条件未发现新的模块缺陷。**

## 范围与证据

入口：[conditions-final-gallery-index.json](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/browser/conditions-final-gallery-index.json)。本组均为 `root=plant`，覆盖四模型各两个控制值。已用 `view_image` 查看全部 **8 张 stage sheet / 58 张阶段图**，另以 `detail=original` 直接检查 **10 张 960 × 640 原图**。

本批观察到英文标签，属于 native irregular seeks 的阶段/起止采样；**不是八个条件均完成连续 full-playback**。此前默认条件中文 full-b2 播放与本批全条件采样是不同证据。只读复核没有操作浏览器；发现 05 并报主代理后，按明确授权只修改所属模块、回归与记录。

| case | 参数 | 阶段数 | 观察结论 |
| --- | --- | ---: | --- |
| conditions-final-a-167 | plantTransport / energy=available | 7 | 蔗糖经过 SUC2 到胞质；ATP/质子相关显示存在，对象标签跟随运输位置。 |
| conditions-final-a-168 | plantTransport / energy=depleted | 7 | 蔗糖最终留在膜外的载体入口，ATP 反应说明不出现；未误画成完成内运。 |
| conditions-final-a-169 | plasmodesmata / gate=open | 7 | 金色环较薄，细胞质套管可见，小货物出现在对侧；蓝色大货物仍受阻于左侧。 |
| conditions-final-a-170 | plasmodesmata / gate=callose | 7 | 中后段金色环加厚、通路变窄；并未把“积累后关闭”误画成从首帧完全封死。大货物仍在左侧。 |
| conditions-final-a-171 | photorespiration / glyk=active | 8 | 末段 GLYK 标签落到酶体、磷酸转移可见；新的总碳收支锚点位于线粒体区域，CO₂ 分子与标签框已可分辨。 |
| conditions-final-a-172 | photorespiration / glyk=absent | 8 | GLYK 变灰，末段明确显示 glycerate remains，磷酸留在供体；碳收支说明位置同样已修正。 |
| conditions-final-a-173 | c4cam / strategy=c4 | 7 | PEPC、PPDK、NADP-ME 位点可区分；四碳转运与三碳返回标签随阶段出现，未见跨分支标签残留。 |
| conditions-final-a-174 | c4cam / strategy=cam | 7 | 夜间气孔开、储酸增加；白天气孔闭、储酸释放，线粒体 NAD-ME 与叶绿体 Rubisco 可区分。储酸峰值越腔问题见 05。 |

直接检查的原图：a-168 end；a-170 stage-4/end；a-171 end；a-172 end；a-173 stage-6；a-174 stage-3/stage-4/stage-5/end。路径共同前缀为 `docs/qa/process-review-2026-10-04/evidence/browser/conditions-final-`，完整文件名见上方索引。

返修后另外直接查看 **4 张 fresh 960 × 640 原图**：d-000（C4）stage-4/end、d-001（CAM）stage-4/end。直接原图检查累计 14 张；此轮按主代理要求只复核 05 的局部结果，不重新声称已审阅其余机制或全部 fresh 播放。

## 结构与修后标签

- **连续嵴**：photorespiration 两条件与 CAM 的嵴表面外观一致，未见旧的独立装饰颈管；CAM 原图能辨认连续嵴轮廓、NAD-ME 酶体与膜相关小结构。当前默认相机/尺度仍不能直接看清每个开放连接口的贯通性；开放拓扑由既有几何检查证明，不能把这批正面静帧当作十个孔口的逐一视觉证明。
- **胼胝质**：a-170 stage-4/end 原图可见壁侧金环增厚，与质膜、细胞质套管和中央连丝管可区分；没有发现新的明显穿膜。间隙精度仍采用已有实际三角形检查，不能由投影图替代。
- **PPDK / CAM Rubisco**：对应标签均落在可见酶体。CAM 保留两个细胞器的区分，Rubisco 位于叶绿体；储酸峰值问题来自储量示意体尺度，与这两个酶体无关。
- **caption 验收返修**：a-171/a-172 end 的 `4C = 3C recovered + 1C released` 引线已从可见线粒体反应区域出发，旧 full-b2 横跨顶部空白的形态未复现。CO₂ 分子在这些最终原图中完整可辨，没有再次通过挪动真实锚点处理标签框。
- 共享的“后画引线穿过先画标签框”属于主代理已指定的统一修复；本报告不重复登记，不修改真实目标锚点，也不将其默认为已通过最终显示验收。

## 新增 20261004-plantConnections-05 / P2

证据：[CAM 峰值原图，p=0.525](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/browser/conditions-final-a-174-c4cam-plant-stage-4.webp)。米色储量示意体在液泡内聚合膨大并越过蓝色切缘；源码中 12 个单位球的初始半径在 update 中被 `0.2 + 0.8 × reserve` 覆盖，峰值实际半径为 1。

定为 P2：这会把液泡储酸示意画到腔外，产生错误的区室关系；四个被跟踪碳原子的数量、摄入/释放轨迹及 NAD-ME/Rubisco 位点未受该错误尺度控制。它不是共享标签或截图裁切问题。

### 世界坐标测量与尺度推导

用实际内侧 tonoplast 的 **925 顶点 / 1,656 个非退化三角面**建立世界坐标支撑平面。模型前半为有意剖切，为检验完整生物腔体，再把同一内侧三角面按局部切平面镜像；这只是测量边界，不向产品增加膜面。遍历 12 个储量体的全部 **5,100 个实际 world vertices**，得到：

| 测量 | 旧峰值，半径 1 | 修后峰值，半径 0.36 |
| --- | ---: | ---: |
| 完整内腔最小有符号平面净空 | -0.6058931029 | **0.0324701624** |
| 实绘后侧膜最小有符号平面净空 | -0.2997818119 | **0.3395808203** |
| 超出完整腔体支撑边界的顶点 | 2,175 / 5,100 | **0 / 5,100** |

表中的负值证明旧体积超出边界，不把它误称为穿透后任意点到有限三角面的精确欧氏距离。修后正值是实际顶点到凸腔边界的净空。

各球中心到内腔面的最小世界距离为 **0.3915494991**。为保留至少 0.03 的球包围体安全间隙，允许的世界半径上限约 0.3615495；选择 **0.36**，保留原 0.2 的空载半径。实际几何包围球考虑浮点误差后的最大世界半径为 0.3600000137，保守最小净空 **0.0315494854**。

修复仅将储量体动画改为 `0.2 + 0.16 × reserve` 并给对象命名。12 个球、每球 425 个顶点、液泡内膜 925 个顶点及原有材料均保留；膜本身、摄入和释放方向、分子轨迹、昼夜时序、相机均未修改。这是纠正错误世界尺度，不是降低模型精度。

### 回归与冻结

- 新增 `camStorage.test.mjs`，由原科学检查入口导入。实际峰值全部顶点通过；相同几何重现旧半径 1 时明确失败，包含实绘后侧膜越界。
- 两分支各检查 1,001 个均匀进度点，加 .525 峰值及乱序回跳，共 **2,016 个状态 / 24,192 个储量体状态**；每个状态用包含全部实际顶点的世界包围球，对全部真实/镜像三角面边界作保守净空检测。
- 峰值增加和白天归零均保留；没有隐藏球体或裁相机规避问题。所有实际节点/几何/材料数量由 smoke 再次验证。
- 所属 `science.test.mjs`、`smoke.mjs` 和新增回归均 exit 0；差异空白检查通过。

证据：[原始腔体测量](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/plantConnections/cam-storage-before.json)、[世界平面尺寸诊断](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/plantConnections/cam-storage-plane-diagnostic.json)、[最终回归](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/plantConnections/cam-storage-regression.log)、[完整所属科学检查](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/plantConnections/science-cam-storage-final.log)、[模块 smoke](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/plantConnections/smoke-cam-storage-final.log)。

**源码与回归已冻结。** a-173/a-174 图片保留为返修前证据。无全项目、全部连续播放、GPU/FPS、物理设备或发布验收结论。

### Fresh 原图复核：05 已关闭

主代理重拍后的 `conditions-final-d-000/001-c4cam-plant` 已进入同一 gallery index。本次仅用 `view_image(detail=original)` 查看以下 4 张，未操作浏览器或修改产品：

- [CAM .525 峰值 / d-001 stage-4](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/browser/conditions-final-d-001-c4cam-plant-stage-4.webp)：12 个米色储量体组成的轮廓完整处于蓝色液泡膜缘内，顶部、底部及两侧都有清楚可辨的空隙；旧峰值胀出下缘的现象不再出现。四个被跟踪碳球可以在储量体上方辨认。
- [CAM 末帧 / d-001 end](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/browser/conditions-final-d-001-c4cam-plant-end.webp)：储量示意已缩回基线大小，仍与完整液泡轮廓保持清楚间隙；日间释放后的轮廓没有贴膜或越膜。
- [C4 stage-4 / d-000](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/browser/conditions-final-d-000-c4cam-plant-stage-4.webp) 与 [C4 end / d-000](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/browser/conditions-final-d-000-c4cam-plant-end.webp)：此次储量体尺度修复没有把 CAM 液泡/储存体泄漏显示到 C4 分支；C4 图中保留两细胞布局。

**05/P2 在本模块范围内关闭：实际几何净空回归和修后原图均通过。** 视觉结论限上述采样视角；所有进度的空间约束由已通过的几何回归提供。共享标签绘制顺序和项目整体验收继续由主代理汇总，未扩大本次关闭范围。
