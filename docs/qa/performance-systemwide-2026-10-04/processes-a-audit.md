# 全站性能静态审查：过程组 A

审查日期：2026-10-04。源代码 HEAD：`ae697be`（本轮已读 `git rev-parse --short HEAD`）。主任务冻结基线：`/tmp/bioscape-systemwide-20261004-baseline-ae697be`。本文源文件路径均相对于 `/Users/kun/Documents/vc`，行号针对该版本。

以下保留只读阶段的原始审查；随后主任务依据基线授权实施，实际修改与验证追加在文末。

本报告只给静态候选及验证边界；没有实例化模型、计时、运行测试、构建或浏览器，也没有修改产品文件。读取了 `.github/CONTRIBUTING.md`；以下候选均以保持原分段数、顶点/索引、材质外观、物种机制、科学状态和时间边界为前提。P1/P2 表示建议实施/实测顺序，不代表已经证实的帧时间排序。

## 覆盖

已检索全部下列过程入口及对应 JavaScript 几何助手，并追读 `update` 热路径及其调用的动态几何/实例工具。共 10 组、38 个模块过程，加原始 transcription，共 39 个入口。

| 组 | 入口 | 静态结果索引 |
| --- | --- | --- |
| genome | replication, dnaRepair, transduction, bacterialSporulation | A3、A4、A6；replication/dnaRepair 的动态实现位于 `nuclearModels.js` |
| chromatin | chromatinAccess, tad, plantGenome, plantRdDM | A1、A5、A8 |
| regulation | promoterRegulation, enhancerRegulation | A1、A4、A5；增强子染色质本身持续运动，不能按转录关闭整体冻结 |
| rna | rnaProcessing, nuclearTransport, organelleImport, motorTransport | A5；核运输/马达主要为预建对象变换，无与动态管线同量级的重建候选 |
| translation | translation, alternativeSplicing, proteinFolding, nitrogenFixation | A5、A6；translation 实现位于 `translationReaction.js`；实验结构保持静态 |
| turnover | proteasome, rnaSilencing, bacterialRepair, crispr | A4、A6；未把 proteasome 创建阶段的 `computeVertexNormals` 误记为逐帧重算 |
| operons | lacOperon, trpOperon, yeastGal, yeastOsmoregulation | A4、A5；RNA 模板 drawRange 更新不等于几何重建 |
| energy | respiration, glycolysis, bacterialEnergetics, bacterialPhotosynthesis | 以预建对象的位移、缩放、可见性为主；本次无 P1 几何重建候选 |
| bacterialCore | bacterialExpression, bacterialDivision, conjugation, transformation | A2、A4、A6 |
| bacterialSignals | twoComponent, quorumSensing, chemotaxis, biofilm | A4、A6、A7；biofilm 主要改变预建对象变换/可见性 |
| 原始过程 | transcription (`src/processes/transcriptionProcess.js`) | A6；已有持久实例和 scratch vectors；329–338 已按帧清空实例包围体，供按需重算 |

共同观察：本次选定热路径没有发现逐帧替换 `TubeGeometry`、重新建立 BufferGeometry 或 dispose/recreate GPU 几何。更值得处理的是固定拓扑内重复写顶点、重算法向/包围体、重复采样及临时对象分配。搜索命中在创建函数中的几何构造、法向计算、克隆不能直接当作播放热点。

## 优先候选

### A1 · P1：动态管的固定截面预计算，染色质形状按状态复用

- `src/processes/modules/chromatin/geometry.js:26–50`：每个环采样三次（含既有 ±0.0001 切向差分），每个顶点重复计算同一 8 边截面的 sin/cos，随后完整法向、AABB、sphere 三轮计算。`regulation/geometry.js:28–56` 是相似热路径，切向来自相邻预采样点。预先存储 8 对半径乘 sin/cos，可保留原表达式和 JS 双精度，不改采样、切向、分段数、索引或法向算法。
- `chromatinAccessProcess.js:145–150,205–226`：两条 400 段管加 30 段位点管；`rightHandedDuplex` 默认 1600 采样点（`geometry.js:68–97`）。DNA 形状仅随 `center` 变化，`hydrolysis=disabled` 全程恒定，active 时 `p≤0.33` 和 `p≥0.76` 也恒定；当前仍执行 frame transport、3 条管、164 组核苷酸及 92 根横档更新。以 `center` 为几何缓存键，标签、重塑酶、结合因子和 userData 继续照常更新。
- `tadProcess.js:126–138,189–206`：两条 500 段管，每次更新共 8,016 个管顶点；另做 48 次二分和 1600 点 frame transport。形状键是 `left/right`；`cohesinDepleted` 全程恒定，normal 在挤出完成后恒定，boundaryDeleted 还要考虑 extension。不要缩减 48 次二分或离散化时间来换性能。
- `regulation/chromatinGeometry.js:77,208–215,250–295`：增强子 8 个 linker，每个两条 128 段管，合计 16 条动态管、16,512 顶点，外加实例碱基。这里 `p` 持续驱动 core 旋转/centerline；即使 coactivator impaired，仍不能整体冻结。固定截面预计算适用于此路径；更深入的成对 strand 采样复用需保留端点方向、解链相位和切向。

验证：逐顶点 position、normal、index、实例矩阵对照；切换 disabled/active、normal/deleted/depleted，时间正播、倒拖、端点和阈值两侧都测。不得用解析径向 normal 直接代替现有面积加权 `computeVertexNormals`，这会改变接缝和光照。固定截面缓存应使用 Number/Float64Array，避免新增 Float32 提前舍入。

### A2 · P1：细菌分裂六层包膜的形状缓存与固定环角

- `src/processes/modules/bacterialCore/bacterialDivisionProcess.js:139–171,366–400`：六个表面各 `(45+1)×(52+1)`，每次 update 写 14,628 顶点、重算 28,080 三角面的法向及六组包围体。`cut/theta` 只由层半径与列 j 决定，当前在每行重复求 sin/cos；可按三种 radius 预表。
- 表面局部坐标仅依赖 `elongation/constriction`（`contour` 及调用）；`separation` 通过 `cells[side].position.x` 表达。所以 `p<0.05`、`0.46≤p≤0.65`、`p≥0.89` 的连续区间无需再写表面；`septalSynthesis=blocked` 在 `p≥0.46` 后也恒定。不能用 p 单独判断被阻断状态。
- `402–500` 脂头/脂尾、肽聚糖网和切边又重复调用同一 contour、固定环角，并创建三元数组。对同一 row/radius 的 `[x,r]`、切边角和相邻 row contour 复用，保留现有每个磷脂/糖链实例。脂头、细胞壁坐标包含 separation，应使用与表面不同的状态键。

科学边界：双层膜、肽聚糖层和剖切角不同，不能合并成一个壳；constriction 不能因 blocked 被误推进，女儿细胞分离不能在局部表面缓存后丢失。验证所有 envelope 的 position/normal、腰部最小半径、切边连续性、层间顺序、blocked 与正常条件及 `0.46/0.65/0.89/0.9` 两侧；固定相机检查同样光照下的膜高光。

### A3 · P1：芽孢膜拓扑三表面，index 与形状各自按状态更新

- `src/processes/modules/genome/sporulationTopology.js:16–66`：3 个 97×33 表面共 9,603 顶点，截面角只由 j 决定。每次 update 都 `ix.set(allIndices)`，设 index.needsUpdate，必要时遍历所有三角形和 holes，再完整计算法向/包围体。固定 phi 的 sin/cos 可以初始化；孔洞为空且之前也为空时 index 完全不变。
- `96–139` 母细胞染色体 copy=0 的坐标不随过程参数变化（只在 p≥0.92 切换可见性），目前 2 条 strand 每次重新写 384 段 rail 及磷酸/碱基实例。其几何可创建时写一次，保留当前消失时点。
- `151–217` septum 在 `p≤0.13` 或 `p≥0.32` 隐藏，inner 在 `p<0.24` 隐藏，engulf 在 `p<0.32` 隐藏，仍全量更新。优先按各自 profile 状态缓存；如果进一步跳过不可见几何，要保证首次可见时按当前绝对时间完整重建，并确认科学回归是否要求读取隐藏缓冲。
- septum 形状取决于 close，孔洞取决于 crossing/partition 与 p 的窗口；inner 取决于 shape/release/holes；engulf 取决于 wrap/shape/release。不能只缓存某个全局 p phase，也不能认为 holes 数量未变就复用 index：孔心会随 partition 移动。

验证：完整 index 字节、退化三角形所在集合、孔的半径/位置、染色体到孔洞的连续性、包裹杯口与母膜接合、双膜顺序及释放前后。特别测 `0.13/0.24/0.32/0.43/0.92` 两侧和 wrap→1；不能把动态孔洞改成永远封闭或固定孔来缓存。

### A4 · P1 候选，先核消费者：关闭裁剪的实例仍逐帧扫描两种包围体

下列工具对实例设 `frustumCulled=false`，却每次 flush/finish 后调用 `computeBoundingBox/computeBoundingSphere`。其代价随全部实例数增长，且在科学状态恒定时仍发生。

| 文件 | 关闭裁剪 | 每次扫描 | 主要影响 |
| --- | --- | --- | --- |
| `genome/molecularDetail.js` | 23–28 | 46–50 | replication、dnaRepair、sporulation、transduction 细节 |
| `turnover/molecularDetail.js` | 82–87 | 108–112 | rnaSilencing、bacterialRepair、crispr 细节 |
| `bacterialCore/bacterialGeometry.js` | 166–171 | 197–200 | 四个 bacterialCore 过程 |
| `regulation/geometry.js` | 265–270 / 519–522 | 349–352 / 547–550 | molecularDNA、molecularRNA |
| `operons/structuralDetails.js` | 38–42 / 531–533 | 122–125 / 586–589 | duplex、nascentBridge |
| `bacterialSignals/structuralDetails.js` | 135–140 | 218–221 | twoComponent、quorumSensing |

表内路径均加前缀 `src/processes/modules/`。初步消费者证据：`src/processes/sceneBounds.js:25–34` 为实例读取共享 primitive 的 geometry bounds 和每个 instanceMatrix，明确不信任 InstancedMesh 自身的历史 bounds；`ProcessScene.jsx:310–314` 在创建时采样全过程调用该函数。原始 transcription 的 `329–338` 已采用清空实例 bounds 的方式。范围内标签助手、ProcessScene 的有界检索未命中 raycast/boundingBox/boundingSphere。

候选实现：模型更新后使实例 bounds 失效，仅在真正的 raycast/通用 Box3 消费时按需重算，或调用方证明无消费者时省去扫描；不要保留旧值。先由整合者核对预览/导出/拾取及测试消费者。`chromatin/structure.js` 的实例没有上述统一 `frustumCulled=false` 证据，不应顺手套用；动态普通 Mesh 仍受裁剪，也不能不更新包围体。

验证：matrix 相同，首次进入及切换参数后的相机 framing 相同，标签导线、截图/视频 framing、实际拾取都不退化；对回退方案直接调用 `computeBoundingBox/Sphere` 得到当前姿态。性能验证单列模型 update 与首帧框景成本，避免把框景采样误报为持续播放开销。

### A5 · P2（部分风险很低）：静态 RNA、固定构象与参数专属状态重复更新

- `chromatin/plantGenomeProcess.js:199–206,269–272,397–401`：两条 localRNA 来自固定 localPorts.sampleMessage + 固定 localRibosome.position（`structure.js:267`），不依赖 progress 或 targeting，当前每帧写 736 个管顶点并重算法向/包围体。可初始化一次，仍每帧更新 p>0.39 可见性。其余 mRNA 可按 tx/exportP、链段按实际进口状态缓存，不能因核糖体静止就冻结生长肽链。
- `regulation/promoterRegulationProcess.js:321–325`：192 次 `setColorAt` 仅依赖 bindingSite 是否 altered，按条件变化才更新 instanceColor 即可，保持 23..33 位点着色。DNA 形状也可按 bend/opening/travel 缓存（267–284）。
- `regulation/enhancerRegulationProcess.js:291–297` 的 nascentRNA 不在 burst 或 impaired 时隐藏但仍动态管更新；是否跳过隐藏缓冲需遵守 A3 的隐藏状态限制，不能冻结仍运动的染色质。
- `rna/rnaProcessingProcess.js:317–345`：初始和套索支架里的固定 t 三角函数可预算；真实 loop/join/branchMove/release 混合和 i=38 分支点必须保持。`rna/organelleImportProcess.js:316–342` 固定 t/q 的展开波形与终态折叠坐标也可预算；transit absent 时整条肽链形状恒定。不能忽略第 8→9 键切断、双膜导入通道和定位肽独立移动。
- `translation/proteinFoldingProcess.js:338–356` 肽链仅依赖 local/finish/fold，hold 条件 p≥0.53 后恒定；链缓存不应冻结 Hsp70/标签更新。`translation/translationReaction.js:273–285` 的 26 点肽链固定 x/z 基形可预算，release/drift 是整体偏移。
- operons 的 `nucleotideDetail.update` 只改实例 count（`structuralDetails.js:167` 后），本身不是重建热点。可重点在 lac 缺乳糖、yeastGal 不 induced 等 opening=0 状态缓存 duplex，不要删除正常条件的多转录泡；trp 要同时保留 tryptophan 和 charging 两个条件维度。

验证：同 p 下立即切换参数，再反向拖时间；所有 drawRange、count、visible、标签文本、userData 均比较。缓存分支专属值而不是只比较参数对象引用；同一参数对象可能被调用方更新。

### A6 · P2：避免链条内大量数组/向量分配及重复端点采样

| 热点 | 证据和建议 | 必须保持的边界 |
| --- | --- | --- |
| bacterialSignals 的 transcriptionDetail | `structuralDetails.js:155–161` 每个 segment 做 `d.clone()`；由 `190–216` 可算每次 356 个临时 Vector3。用先保存 length 后原地 normalize 的 scratch；DNA/RNA 完全不变时还可按 center/opening/length 缓存矩阵 | twoComponent nitrate absent 与 quorum exchange diluted 常为恒定；活性、RNA 可见性、标签仍分别更新 |
| turnover rnaSilencing | `rnaSilencingProcess.js:174–181` 每次 join 新建 d/up；`373–397` 在 28 个靶位点和 22 条配对键中再 clone/add 新向量 | slice/seed/mismatch 的位点对应、seed bulge、cutIndex、切后断键必须保留；scratch 不得与传入端点别名冲突 |
| turnover crispr / bacterialRepair | `crisprProcess.js:465–474` 两链×53 位点每次新建 318 个向量；`bacterialRepairProcess.js:459` 每次新建 Float64Array(61)，`546–550` 又新建偏移向量 | phase 积分需每次完整覆盖，保持 double 精度、PAM 近端解链方向和 LexA 不可切割分支；不预量化动态 phase |
| genome transduction | `transductionProcess.js:385–448` cargoCenter 返回数组、cargoPath 最后 `.toArray()`；`450–469` 每帧调用 cargoPath 448 次，邻接段端点反复求值；在 extract≥1 时每点还采中心及 ±1e-5 | 用持久 out vectors/点数组保留相同采样网格与差分；P1/lambda 材料索引、抽取/包装/注入顺序、双链法向旋转不能改变 |
| bacterialCore expression | `bacterialExpressionProcess.js:340–381,407–445` 每个 dnaFrame 创建对象，dnaPoint/RNA 创建数组，80 组核苷酸又 map 中点和碱基端点；98 段×2 链重复邻接端点 | 保持正半径解链帧及 RNA-template hybrid，不用 Cartesian 线性混合代替角度展开；sigma absent 不得产生转录 |
| bacterialCore conjugation / transformation | `conjugationProcess.js:298–383` circle/route/strandPoint 返回数组，pilus 30 次循环内重复创建同一 point closure；`transformationProcess.js:357–420` source/target/incoming/porePoint 每次 map/数组，104 段 RecA 反复调用 incoming | 流动的 material coordinate、leading 5′/trailing 3′、有限孔道占据、D-loop 接合点、缺同源时降解严格相同 |
| genome nuclearModels / original transcription | `nuclearModels.js:160–188,374–408` 邻接 endpoint 和配对 strand 多次求 point；`transcriptionProcess.js:234–252` 256 段×2 链同样重复端点 | 原始转录中 center 会在 RNA 切割支路临时改写（267–308）；DNA 缓存必须限于 DNA 步骤，不能跨用错误 center |

表内简写路径均在 `src/processes/modules/`，最后一行原始 transcription 除外。低规模附属项：`translationReaction.js:11–18,286` 的 movableBond 与偏移向量可复用；`genome/nuclearModels.js:224,407,425,435` 可复用偏移。实现优先关注高次数内循环，不必为每个一次性数组写复杂池。

验证：相同采样位置的输出应位级一致或给出机器精度差值解释；不要改变浮点运算顺序来追求数量减少。逐帧堆分配/GC 待整合实测；静态分配次数不是已测 GC 时间。

### A7 · P2：趋化鞭毛的 420 个同形同材质 Mesh 可实例化

`src/processes/modules/bacterialSignals/chemotaxisProcess.js:206,247–253`：5 条鞭毛各 84 个 `k.segment`，共 420 个共享 cylinder/teal 的独立 Mesh；`398–408` 逐帧写变换。同一父 group 下可保留全部 420 段及原矩阵，用 1 个或 5 个 InstancedMesh 提交（具体 draw call 收益由 renderer 实测）。每条的 85 个采样端点也可以只求一次；phase 在 j 循环外只求一次。

科学边界：`334–358` 第 0 条鞭毛在 tumble 期间单独改变手性和螺距；reversedTime 积分及 motors 起点均需保留。不能换成刚性鞭毛或降低段数。现有科学测试可能通过 `flagellum-${f}-segment-${j}` 查对象，应保留可检验的 instance 映射或更新测试为同等严格的矩阵/手性检查，不能仅删除回归。回归 gradient/uniform、所有 tumble 窗口两侧、根部钩连续性、左右手性、倒拖恢复和最终固定视图。

### A8 · P2/P3：局部材质复用；谨慎扩大范围

`src/processes/modules/chromatin/chromatinAccessProcess.js:151–153` 为 92 根同色横档调用 92 次 `k.material("#b6c7c9")`，其后只做 segment 变换，不逐根改材质。可以共享一个同参数材质；几何/光照不变，减少材质对象及 renderer 状态管理，具体渲染收益需实测。横档保留全部 92 根，进一步实例化属于独立候选。

避免按颜色全局合并材质：`genome/nuclearModels.js:218–221` 会逐材质更改 opacity/transparent/depthWrite，`turnover/molecularDetail.js:127` 后的 fade 会克隆材质来隔离淡入，许多过程有 independently active/hidden 分支。共享必须证明写入生命周期相同并保留 dispose 所有权。

## 排除与验证入口

- `translation/alternativeSplicingProcess.js:200–304` 的 branch/ligation/product 向量克隆仅在构建两个 frames 时发生，不是每帧；应保留已经做好的预计算。
- `translation/ribosomeAssembly.js`、`energy/detailKit.js` 膜脂、`rna/refinementGeometry.js` 的静态 BufferGeometry/TubeGeometry/法向构造，以及 proteasome 的环几何构造，不应靠粗略 rg 命中升级为持续帧热点。
- 本轮没有证据支持降低 DNA/RNA 分段、删核苷酸、降实验坐标精度、改 render 质量或删条件。GPU 绘制成本、CPU update 成本、创建/框景成本应分别测量。
- 整合后验证：对应各组既有 `science.test.mjs`，并优先补充/执行 genome `review20261004.test.mjs`、chromatin `upstream.test.mjs`/`plantSmoke.test.mjs`、regulation 和 operons `duplexGeometry.test.mjs`、rna `refinement.test.mjs`、translation `review20261004.test.mjs`、turnover `bubble.test.mjs`/`continuity.test.mjs`、bacterialCore 两类 bubble/transformation uptake 回归、bacterialSignals `science.test.mjs`。本报告未运行这些检查。
- 形状缓存和实例化还需要固定相机同光照渲染对照、条件往返切换、跳播/倒播、多次创建/释放以及截图/视频导出校验。通过某个局部测试不等于全站性能或画质验收；实测以冻结基线和主任务报告为准。

## 后续授权实施与验证

主任务完成串行基线后报告 bacterialDivision 两条件平均 update 约 5.64/5.73 ms、enhancerRegulation 约 5.45/5.07 ms，并授权本审查者改动有明确等价依据的热点。完整原始计时位于 `evidence/baseline-processes-summary.json`；本审查者未运行性能计时，以下不构成优化后性能结论。

实际只修改四个产品文件：

1. `bacterialCore/bacterialDivisionProcess.js`：每层按原 theta 表达式预存 Float64 sin/cos；六个表面只在 elongation/constriction 改变时改缓冲、法向及 bounds。膜脂、肽聚糖和切边还考虑 separation 后才复用；细胞分离、DNA、FtsZ、合成酶、标签和 userData 照常推进。
2. `chromatin/chromatinAccessProcess.js`：只缓存由 center 唯一决定的 DNA frame、三条管、核苷酸及横档。factor/remodeler 变换和标签仍逐次更新。
3. `chromatin/tadProcess.js`：只缓存由 left/right 唯一决定的环几何及 DNA frame/细节，cohesin/CTCF 可见性、接触线及标签继续更新。
4. `genome/nuclearModels.js`：仅 createRepair 内三条 DNA paint 按 effective p 复用；incision blocked 时 p≤0.4，但 raw 进度对应的 blocked label 与条件 userData 仍每次更新。replication 未修改。

未改 shared dynamicTube（归另一审查者负责），没有按不可见性跳过几何，没有改顶点/索引/分段数量、法向算法、材质外观或科学阈值。其余 A3–A8 候选保留为审查建议，未在本次交付实现。

### 精确基线回归

新增 `tests/process-geometry-cache-exact.mjs` 与 `tests/helpers/process-cache-snapshot.mjs`，默认只读取仓库内 `tests/fixtures/process-geometry-cache-ae697be.json`，不依赖 `/tmp` 或外部文件。fixture 由冻结 ae697be 源通过 `evidence/generate-process-cache-reference.mjs` 生成。测试不自动重录 fixture。

覆盖 4 个过程、8 个 root 实例、17 个 root/condition 组合：862 个基准 pose，每个重复更新两次，共 **1,724 次完整快照比较通过**。包括边界 p±1e-7、同一可变参数对象当场切条件、倒向与不规则 seek。对每一状态比较所有可见和隐藏对象：

- 全部 geometry attribute（包括 position/normal/UV）、index 原始字节、drawRange、groups、bounds；每次快照重新读缓冲，不依赖 `needsUpdate` 正确性。
- 全部 instanceMatrix/instanceColor 字节及实例 count，局部与世界矩阵的 Float64 字节。
- 材质序列化状态、可见性、shadow/culling/renderOrder、每个对象 userData、完整 labels。

对象 UUID 和上传 version 计数不属于输出等价；其余上述数据没有使用容差。结果日志：`evidence/process-cache-exact.log`。生成日志：`evidence/process-cache-reference.log`。

### 既有科学检查

以下三个直接 Node 检查均 exit 0；没有运行全量 check 或浏览器：

- `src/processes/modules/bacterialCore/science.test.mjs`：包含其导入的 bubble、uptake、label anchors，以及原类别缺陷注入拒绝检查；日志 `evidence/process-cache-bacterial-core-science.log`。
- `src/processes/modules/chromatin/science.test.mjs`：含 upstream 和标签；主检查 13 root/control 组合、161 stage/seek，标签 195 非单调状态/1,015 目标检查；日志 `evidence/process-cache-chromatin-science.log`。
- `src/processes/modules/genome/science.test.mjs`：含初始科学、真实 entry/层次、标签、tail material ray 和 incision-label 任意 seek 回归；日志 `evidence/process-cache-genome-science.log`。

四个修改源文件已单独 Prettier 格式化，`git diff --check` 通过。性能复测、整合 runner、构建及最终固定视图/交互/导出验收由主任务统一完成，当前未宣称通过。
