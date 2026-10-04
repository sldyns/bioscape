# 全站性能静态审查：过程 B 组

日期：2026-10-04。审查代码：`ae697be`。对照基线：`/tmp/bioscape-systemwide-20261004-baseline-ae697be`。

范围：12 个模块组的 42 个过程入口，以及原始 `secretionProcess.js`、`photosynthesisProcess.js`、`phageProcess.js`，合计 45 个过程入口。已读 `.github/CONTRIBUTING.md`。本轮只读产品源码、更新函数及相关辅助几何；没有模型实例化、计时、测试执行、构建、浏览器操作、提交、推送或部署。本文是静态候选与验证设计，不是性能收益或视觉验收结论。

审查重点为保留原分辨率、采样、材质、科学关系的重复工作消除。不能以隐藏对象为由直接跳过其状态维护：标签、回归和随机 seek 可能读取这些对象。几何仅由少量数值状态决定时，优先对几何子步骤加精确状态缓存，其他动画、标签、元数据仍照常更新。

## 覆盖表

以下路径除原始过程外均相对 `src/processes/modules/`。行号为本轮读取位置；每组均检查更新入口，并追查表内涉及的辅助几何。没有把构造阶段的 `new Geometry` 或一次性的 `computeVertexNormals` 当作每帧工作。

| 组 | 已审查入口及 update 行号 | 静态结果 |
| --- | --- | --- |
| membrane | `activeTransportProcess.js:256`、`bacterialCellWallProcess.js:467`、`diffusionProcess.js:197`、`osmoticBalanceProcess.js:275` | 前三者主要更新变换、可见性、状态和标签；diffusion 重复确定性 seed/固定坐标可后置处理。osmosis 每帧重填内外表面、重算实际三角面积及体积、更新皮层实例；见 B5。 |
| neurons | `actionPotentialProcess.js:309`、`ciliaryMotionProcess.js:466`、`muscleProcess.js:310`、`synapseProcess.js:390` | actionPotential/muscle 主要变换及材质状态；synapse 有按分子编号固定的三角函数但数量有限。ciliaryMotion 有每顶点重复弧长查询、每管法向/bounds 扫描；见 B7。 |
| division | `mitosisProcess.js:101`、`meiosisProcess.js:119` | 已存在静息坐标、变形状态与膜的对称采样优化；不作为新候选。更新中的固定 astral 方向、染色体初始数组等为低优先级；必须保留附着检查点、交叉互换以及真实皮层环贴合。 |
| signals | `apoptosisProcess.js:267`、`differentiationProcess.js:255`、`immuneResponseProcess.js:355`、`signalTransductionProcess.js:298` | continuousMembrane 已优化，排除重复建议。differentiation 已有 `deform !== lastDeform` 和解析 Jacobian 法向；immune 的 `secretoryMembrane.js:112` 已按完整 carrier/fusion key 跳过相同形态。其余主要变换与材质；少量固定角度预计算不列首批。 |
| traffic | `autophagyProcess.js:140`、`endocytosisProcess.js:97` | `membranes.js:92` 已逐环比较完整 profile 并跳过不变输出，排除重复建议。独立的 clathrin `molecules.js:55` 仍对固定点计算 acos/atan2；endocytosis `:149–168` 动力蛋白颈部仍重复填顶点及 normals/bounds，见后续候选。 |
| parameciumLife | `contractileVacuoleProcess.js:335`、`parameciumConjugationProcess.js:330`、`parameciumDivisionProcess.js:232`、`parameciumFeedingProcess.js:352` | conjugation 始终调用两个核谱系的全表面更新，前三次分裂前长时间形态完全不变；见 B3。division 的 `nuclearCell.js:64–176` 每顶点/边界 shape 返回短数组；feeding/contractileVacuole 经 `scientificGeometry.js` 重填预分配的轴向膜，适合第二批固定角采样与形态缓存。 |
| phageLife | `phageAssemblyProcess.js:169`、`phageLysogenicProcess.js:305`、`phageLyticProcess.js:233`、`phagePackagingProcess.js:249` | assembly/lytic 主要变换及 drawRange；lytic 的 `entryGeometry.js:100` 是已有缓冲的 drawRange/count 更新。packaging 每帧重设坐标固定的 DNA 杆段，见 B6。lysogenic 的 `lambdaTopology.js:61` 每次重填 duplex，可按 entry/circularize/junction/excised、host width 缓存；见后续候选。 |
| plantConnections | `c4camProcess.js:595`、`photorespirationProcess.js:239`、`plantTransportProcess.js:280`、`plasmodesmataProcess.js:324` | 前三者主要原子/蛋白变换、可见性与标签；C4/CAM 两分支同时更新是状态一致性的现有行为，不建议仅因不可见删掉。plasmodesmata 开放分支每帧重写相同膜/脂质/胼胝质，见 B1。cristaGeometry 的法向/bounds 为构造阶段。 |
| plantGrowth | `cellWallGrowthProcess.js:201`、`doubleFertilizationProcess.js:251`、`fungalHyphaeProcess.js:280`、`plantDivisionProcess.js:127` | cellWallGrowth 以变换为主。doubleFertilization 已有 `nextMembranePhase`，plantDivision 已有 before-plate/joined phase 缓存与 field 的 x/z 缓存；不重复提为新优化。fusionSurface 仍有固定方位角及每环重复 theta 三角函数；fungalHyphae 的真实融合场随递送周期变化，不能按 tip extension 单独缓存。 |
| plantSignals | `auxinProcess.js:500`、`plantDefenseProcess.js:454` | plantDefense 重填全部固定脂质实例，实际只由 BAK1 占位掩码决定，见 B4。auxin 的展开底物重复求相邻 65 采样点并分配短数组，且 DNA tube writer 每段重复端点，见后续候选。 |
| plantWater | `chloroplastMovementProcess.js:207`、`plantLongDistanceTransportProcess.js:331`、`plasmolysisProcess.js:240`、`stomataProcess.js:297` | 前三者主要变换、曲线位置和透明度；不要把水流积分替换为跳步。stomata 反复更新只依赖开度 o 的 14 个膜/壁几何和附着结构，见 B2。 |
| yeastLife | `yeastBuddingProcess.js:167`、`yeastFermentationProcess.js:195`、`yeastMatingProcess.js:213`、`yeastSporulationProcess.js:273` | fermentation 主要原子和键变换。budding/mating 的源表面与 `anatomy.js:91` 多层剖面均无相同形态短路，见 B9。sporulation 的 early envelope 已有 `meioticEnvelope.js:265` 形态缓存，但四个前孢子膜及内叶仍重复更新；`nutrients=rich` 为长平台。 |
| 原始过程 | `src/processes/secretionProcess.js:652`、`photosynthesisProcess.js:934`、`phageProcess.js:545` | secretion 的 closure/fusion 几何在整个时间轴重写，见 B8。photosynthesis 的 normals 重算属于构造阶段，update 只改路径包、材质和标签。phageProcess 已有 transfer offset 和 contraction 缓存，不重复提出。 |

## 优先候选

优先级是基于循环规模、重复工作确定性、修改边界和验证成本的静态排序。没有测量数据支持百分比、毫秒或帧率结论；实施顺序应结合 root 的串行冻结基线结果。

### B1：胞间连丝按 gate 缓存完整形态子步骤

- 源码：`src/processes/modules/plantConnections/plasmodesmataProcess.js:324–425`。
- 证据：双层 PM、lipid instances、两端膜唇、callose collars 的坐标全部由 `gate` 派生；`gate = restricted ? ease(p, 0.35, 0.6) : 0`。开放条件全程、callose 条件的 0–0.35 和 0.6–1 区间会反复生成相同 positions/instance matrices，并重复计算 normals、box、sphere。
- 改法：第一次完整生成后，只有 gate 真正改变才执行这组几何更新；粒子、探针、标签及 userData 继续更新。固定 angular sin/cos 表可单独做，不改原表达式乘法次序与 Float32 落点。
- 科学边界：callose 在 PM 外侧，两层叶间距 0.047、实际 sleeve、ER 空间及大探针排斥必须保持；不能把颈半径换成近似圆柱或把 lip/collar 独立缩放替代原几何。
- 等价验证：open/callose 所有条件；密集覆盖 0.35、0.6 左右及回跳；比较所有 position/normal/index、实例矩阵、bounds、可见性、粒子坐标、标签和 userData。执行本组 science/topology 与标签回归后再固定视角对比。

### B2：气孔按 opening 缓存，预计算不变角度

- 源码：`src/processes/modules/plantWater/stomataProcess.js:21–91,297–356`。
- 证据：两侧 body/vacuole/wall/四层 membrane 合计 14 个几何，每次 `fillKidney`/`fillWall` 都写 positions 并跑 normals、sphere、box。所有这些形态、ribs、plastids 和 nucleus 的变换仅依赖 o。ABA 分支开闭之间及端点存在平台，持续光照分支 0.49 后保持完全开度。
- 改法：按 o 缓存上述形态子步骤，保留后续离子与水流进度。构造阶段预计算 65 个中心采样点的 sin/cos、sin(t)^0.6，以及圆周 sin/cos；仍按原表达式生成每个顶点。
- 科学边界：保留肾形表面、两侧 winding、局部截面法向、加厚内壁、膜层/ribs 及叶绿体附着位置；不以整体 scale 代替非线性开度变形。
- 等价验证：ABA/light 条件切换；0.22、0.49、0.69、0.94 邻域与随机 seek；数组、bounds、rib matrices、标签一致；waterFlux/science/labelAnchors 回归和固定视角画面对照。

### B3：草履虫接合的核谱系按八个形态阶段缓存

- 源码：`src/processes/modules/parameciumLife/nuclearLineage.js:84–174`；调用点 `parameciumConjugationProcess.js:393` 附近。
- 证据：每细胞 8 patches × 2 leaflets，两个细胞共 32 个几何，每个 update 都重填顶点、法向和包围体。`p < 0.78` 时 split1/separate1/split2/separate2/split3/separate3/development/selection 全为 0，但调用不停止，且每个 state 的 center/radius/birth/retained 也相同。
- 改法：以这八个派生阶段为完整形态状态；首次必须生成，后续完全相同才短路几何和不变 states。`group.visible` 仍按 p 处理。至少可先做精确的分裂前平台缓存；不能直接对隐藏 group return 而不初始化。
- 科学边界：保持八个 patch 的同一性、从合子核开始的三次连续分裂、内叶先闭合、后期核分化和选择性保留，不替换为球体显隐切换。
- 等价验证：初始→0.9→0.1→0.78→0.1 的倒拖；各 split/separate 阈值两侧；比较 32 组顶点/法向/bounds 及全部 states，保留 review20261004/science 中核谱系连续性与细胞内包含检查。

### B4：植物免疫仅在 BAK1 占位状态改变时重写脂质

- 源码：`src/processes/modules/plantSignals/plantDefenseProcess.js:114–166,474–511`；writer `structures.js:156–180`。
- 证据：slots 的 x/z 和两条尾链拐点构造时已固定；每次 update 却重建每层全部 heads/tails 的矩阵、短数组并重算实例 bounds。变化只是 `Math.hypot(x - bak.position.x, z - bak.position.z) < 0.2` 的 blocked 布尔值。BAK1 位置本身只取决于 join（0.34–0.48）；配体缺失时 join 恒为 0。
- 改法：第一步可只按 join 缓存整段；进一步为每槽保存 blocked 状态和相同精度的固定 open/blocked 矩阵，只写 mask 改变的槽。仅当确有矩阵变化时更新 buffer/bounds。静态尾链端点与 quat 可构造时计算。
- 科学边界：只排除当前 BAK1 footprint，离开的槽必须恢复；FLS2/RBOHD 等固定空位仍保留。不把阈值从 hypot 改成近似或降精度比较，避免边界槽翻转。
- 等价验证：flg22/absent、0.34–0.48 密集采样及正反 seek；逐槽比较原始实例矩阵和孔洞掩码；`plantSignals/science.test.mjs:253–273` 已验证只排除当前 BAK1 footprint，需保留并配合视觉检查。

### B5：渗透平衡保留三角面积约束，缓存不变形态与固定系数

- 源码：`src/processes/modules/membrane/osmoticBalanceProcess.js:275–359`。
- 证据：每顶点的 base x/y/z、r²、atan2(z,x)、cos(11a)、双凹静态 y 项不变；每帧重复计算。形态只由 `(hypo, hyper)` 决定，isotonic 全程两者为 0，却仍跑两表面更新、surfaceArea、volume、皮层实例和 bounds。
- 改法：固定系数使用 Float64/普通 Number 缓存，保留现有算术顺序；按 `(hypo, hyper)` 缓存实际几何派生结果，仍更新水/溶质的动态内容。首次 initialArea/initialVolume 初始化语义必须保留。可先只实施系数预计算，再单独增加平台短路，便于定位等价差异。
- 科学边界：继续以真实三角表面积归一化，保留内叶缩放、皮层约束及实际体积变化；不能用球体解析面积替换、不减顶点。均匀内叶缩放不代表复制外叶 normal 能保证 bitwise 等价，首批保留原 normal 算法。
- 等价验证：三种 tonicity、直接在非零 p 创建后的调用、条件切换、重复和倒拖；比较内外 positions/normals、皮层 matrices、area/volume/标签及 userData。既有 `membrane/science.test.mjs:236` 起面积约束需继续通过。

### B6：噬菌体包装的固定外部 DNA 姿态移至构造阶段

- 源码：`src/processes/modules/phageLife/phagePackagingProcess.js:287–320`。
- 证据：54 个采样段中的 y、ny、a、两股轨道的 108 次 pose 和 54 次 rung pose 只依赖 i；每帧只有由 bottom/top/gap 得出的 visible 改变。dsDNA 整组后续位移由独立 position 控制。
- 改法：固定 pose 在构造时执行一次，更新循环保留 exact visible 判断以及组位移、包装 fraction 和 motor 动画；保留现有 Mesh 数量与材质，第一步无需改为实例化。
- 科学边界：保留双链螺距、DNA 长度、入口相对位置、末端切割及封口前 clearance，ATP 缺失时不得进料。
- 等价验证：ATP present/absent、0.25/0.78/0.79/0.85/0.92 两侧、倒拖；逐对象比较 local/world transform 和 visible，保留 phageLife science/renderedMechanics/continuity 检查。该候选可独立、低侵入地实施，但实际耗时占比未测。

### B7：纤毛按真实纵向行缓存弧长位置与三角函数

- 源码：`src/processes/modules/neurons/ciliaryMotionProcess.js:105–156,466–512`；`axonemeKinematics.js:24–36,59–83`。
- 证据：构造代码有 9×4+4+1=41 个变形 tube，44 段高度；40 个 tube 的径向段数为 16，膜为 28。按源码尺寸可推出每帧 31,905 个 tube 顶点，每顶点调用 material-track 查询，而同一管同一纵向行的 fraction、materialPoint、sin/cos(a) 完全相同。每管仍需原法向和 bounds。
- 改法：从现有 Float32 `initial` 的实际 y 值建立逐行记录（不能用理想 i/N 替换再计算以免舍入不同），每行算一次弧长位置和 sin/cos(a)，再写该行径向顶点。`axonemeKinematics` 可每次更新后存 sin(A[s])/cos(A[s])，供不同 offset 的 cumulative 与 geometric 复用。tubulinRows 可保存 track 引用以免重复 toFixed/Map lookup。
- 科学边界：每个 doublet 保留自己的弧长累计与 material-track；不能强制全部管共享同一 centerline 参数或线性 u。真实三角壁面的 wallPoint、dynein 贴附/接触及膜 tip 扩展必须保持。
- 等价验证：ATP present/absent、摆动极值/换向、至少全周期密集采样；比较每 tube buffer、normal/bounds、tubulin matrix、arm/link 坐标以及 userData。现有 neurons science 中不可伸长、邻管滑动、壁面锚点测试必须保留，并做前后固定视角动画复核。

### B8：原始分泌过程的静态连接、closure 与 fusion 形态缓存

- 源码：`src/processes/secretionProcess.js:368–381,448–473,705–754`。
- 证据：`updateClosure` 只依赖 poreRadius；`updateFusionSurface` 只依赖 poreOpening/flatten，后两者在 p<0.9 长期为 0，却每帧写入同样的 shell 与 normal/bounds。`erConnection.set` 两端回调全为常量；Golgi connection 则依赖 activeX/bridgeScale，不能整体静态化。
- 改法：ER 固定连接构造一次；closure 按 poreRadius、fusion 按 `(poreOpening, flatten)` 精确短路。圆周角表可构造时复用，主循环仍更新 visibility、材质 opacity、货物和标签。先检查连接 helper 的完整副作用再移动调用。
- 科学边界：保持真实孔边、连接边焊接、连续膜拓扑以及绑定到实际三角面的 lipid midplane；不要只设置 visible 后让先前 seek 的几何遗留。
- 等价验证：融合前后阈值 0.9/0.925/0.963/0.992 的密集和反向 seek；比较焊接点、lipid attachment、cargo path 及全部缓冲。现有 `tests/original-secretion-review.mjs`、`original-secretion-label-review.mjs` 与 `secretion-refinement.mjs` 是已有验证入口，本轮未执行。

### B9：酵母形态版本传播与轴向采样缓存

- 源码：`src/processes/modules/yeastLife/anatomy.js:91–145`、`topology.js:5–21,113–139`、`yeastBuddingProcess.js:177–244,291–374`、`yeastMatingProcess.js:213–338`、`yeastSporulationProcess.js:334–354`。
- 证据：layeredCutaway 从源几何重填 2–3 层、边缘和脂质实例，每次重算法向和 bounds，即使源 positions 没变。mating 的同型配偶分支 q 恒为 0 仍更新墙/核/融合脂质。budding 对每条 chromatin 的每个顶点查询 `axialRadius`，后者遍历全部轴向行并重复取半径；每列环上重复的 x 对应同样查询。
- 改法：先让形态生成器按完整形态输入只在 positions 真变时递增版本；layeredCutaway 的局部几何与 bounds 按版本更新，但每帧仍同步 source visibility/position/quaternion/scale。轴向包络每次变形后提取原始 Float32 行坐标/半径，复用相同 x 的查询结果；保留原 max-over-overlapping-interval 算法，不能未经证明改成单调二分查找。mating 的 `new Vector3` 与 `placeSegment` clone 可以通过闭包 scratch 消除，但优先级低于表面循环。
- 科学边界：真菌闭合有丝分裂、核内染色质 containment、核颈、SPB 表面附着和核孔必须保持。不能把 ring polygon 的 cos(π/columns) 安全余量删掉；不能让染色质穿越内叶。source 仅变换也必须及时同步剖面层。
- 等价验证：所有 yeast 条件、budding neck 与核分裂的窄过渡、mating fusion、sporulation rich/induced 的条件切换和随机 seek；比较源与派生 buffer/instance matrix/labels，执行已有 science/smoke；缓存层新增等价比对应覆盖隐藏对象。

## 第二批候选与不建议的捷径

1. `traffic/molecules.js:55–100`：points 是静态库存，acos(-y)、atan2(x,-z)、对应 sin/cos 和 show 条件的一部分可预计算。`endocytosisProcess.js:149–168` 的 neck positions 由 neckRadius/recruitment 决定，可在相同输入时不重算法向/bounds；不要误把已优化 `membranes.js` 重新记作收益。
2. `parameciumLife/nuclearCell.js:64–176`：每顶点 shape 返回 `[x,y,z]`，边界和 corticalRows 也调用。可用原位 out 参数及固定 base 系数减少短数组与 exp/pow 重复；先追全调用者，保留 fissionHalf 的完整子细胞曲面映射。`scientificGeometry.js:19–33` 的轴向 shape 可固定方位角采样，不降低 rings/columns。
3. `phageLife/lambdaTopology.js:61–153,193–215,303–357`：固定 radial sin/cos，turns 不变时固定 helical phase；较高层以完整 DNA 几何状态和 width 跳过平台。不可仅按 callback 函数身份缓存，也不能忽略 endpoints/closed，整合与切除依赖共用双链端点。
4. `plantSignals/auxinProcess.js:564–614`：65 个 substratePoint 采样可在一次 update 中求一次并复用两端，避免相邻段重复数组分配；DNAPoint 同理。必须保留分子喂入过程、蛋白酶体入口、repressor 的 bodyOffset，不能跳过隐藏但仍被标签/测试读取的状态。
5. `plantGrowth/fusionSurface.js:54–91`：phi 只依赖径向编号，theta 只依赖 ring/本次形态，可按环共享三角函数；doubleFertilization 已存在 phase 短路，此项仅针对真实融合过渡的重复计算。`cellPlateMembrane.js:102` 的 marching tetrahedra 为真实拓扑工作，不能用更低网格或近似面片换性能；现有 field/xz 缓存已在代码中。
6. 固定材料重复创建：例如 `parameciumLife/nuclearCell.js:48–59` 的 52 个 hair 分别调用同色 `k.material`，局部代码仅改 position。可在核实完整外部 API 没有独立染色/透明度需求后合并材料实例。仅共享材料不自动减少 draw call；构造期内存/资源收益需实测。纤毛 dynein 的 clone 有独立激活颜色用途，不能盲合。
7. 许多更新函数重建 userData/双语标签或固定短数组，这是可测 GC 候选，但静态证据不足以优先于上面的几何工作。不要直接改变对象身份契约，也不要只为减少几行代码重构科学阶段逻辑。

## 统一验收要求

- 基于冻结基线做相同模型/参数/进度序列对照；缓存命中测试必须包含从变形状态返回平台、同进度条件切换、重复 seek 和非单调 seek。
- 第一目标为 positions/normals/index/UV/color 与实例矩阵逐项等价。固定系数不要落入 Float32 临时表；避免改变加法结合顺序、三角函数实参或 signed zero。若出现差异，先定位舍入来源，不能笼统放宽科学容差作为通过依据。
- 保留对象库存、材质属性、分辨率、drawRange/count、bounds、可见性、标签和 userData。bounds 既影响裁剪，也可能被测量/导出使用；没有完整消费者核查前不删除重算或扩大为固定大球。
- 每一改动只运行对应的科学/等价回归及必要通用校验，然后由 root 执行分离的 build、固定视角视觉检查和统一串行性能测量。纯静态审查或单元测试不能宣布流畅度/画质验收通过。
- 本文没有写产品代码，所有收益尚未测量；已存在的 continuousMembrane、traffic unchanged profile、division 对称/静息坐标、plantGrowth phase cache、原始 phage transfer/contraction cache 均不计作本轮新优化。

## 后续实施与验证记录（不覆盖以上初审结论）

初审完成后，root 基于串行基线重新分配实现范围：本代理负责 ciliaryMotion、plasmodesmata、stomata、osmoticBalance；parameciumLife、secretion 和其他候选由 root 另行分配。本次最终产品修改仅有以下 5 个文件：

- `src/processes/modules/neurons/axonemeKinematics.js`：相同 gain/time 跳过重复积分；每次更新缓存原有角度的 Float64 sin/cos，供各独立弧长轨道复用，保留初始 geometric 调用的零角语义。
- `src/processes/modules/neurons/ciliaryMotionProcess.js`：保留 41 根管及 31,905 个顶点，以实际 Float32 纵向行复用 material-point 查询；每组 6 个 tubulin bead 复用同一轨道采样。相同形态或零 gain 仅跳过 tubes/beads 几何更新，后续动力蛋白、link、wallPoint、标签与 userData 仍正常更新。
- `src/processes/modules/plantConnections/plasmodesmataProcess.js`：按 gate 更新膜、callose 和脂质形态；所有分子/探针轨迹及标签仍随进度更新。
- `src/processes/modules/plantWater/stomataProcess.js`：按 opening 更新细胞/膜/壁/rib/附着结构；预计算不变的中心线和截面三角函数，保留旧实参和计算次序。离子、水流、标签和状态继续更新。
- `src/processes/modules/membrane/osmoticBalanceProcess.js`：Float64 预计算固定 r² 和 cos(11atan2(z,x))；按 hypo/hyper 缓存实际三角面积归一化后的形态及体积。内外表面、皮层及原始法向算法不变，水与溶质状态继续更新。

### 本代理已执行的正确性验证

1. `generate-process-cache-b-reference.mjs` 只从冻结 `/tmp/bioscape-systemwide-20261004-baseline-ae697be` 导入原始过程，产生 `tests/fixtures/process-geometry-cache-b-ae697be.json`：ciliaryMotion 84、plasmodesmata 84、stomata 84、osmoticBalance 126，共 378 个 reference poses。包含每个条件、阶段边界 ±1e-7、相同参数对象原位切换、正序平台与反向/不规则 seek。
2. `node tests/process-geometry-cache-b-exact.mjs`：每个 reference pose 更新两次，共 756 次快照逐项匹配，PASS。快照包含完整 GPU 属性/index/normal/instance bytes、隐藏节点和可见节点的 local/world matrices、bounds、材质状态、labels 和 userData；不把 UUID、upload version 当作输出等价条件。
3. 四组现有 `science.test.mjs`（neurons、membrane、plantWater、plantConnections）均 exit 0。neurons 的 798 个纵向壁面接触检查及标签回归通过；membrane 面积守恒与六个已审计科学项通过；plantWater 水流/标签及完整叶绿体路线检查通过。
4. 仅对这 5 个产品文件与新增测试/生成器运行 Prettier；`git diff --check` 对 owned 文件通过。

证据文件：

- `evidence/process-cache-b-reference.log`
- `evidence/process-cache-b-exact.log`
- `evidence/process-b-neurons-science.log`
- `evidence/process-b-membrane-science.log`
- `evidence/process-b-plantwater-science.log`
- `evidence/process-b-plantconnections-science.log`

本代理没有运行性能计时、浏览器、build、全量 check，也没有提交/推送/部署。以上结果只关闭本修改范围的针对性数值/状态等价与既有科学回归；统一性能收益、实际画面、构建/发布仍由 root 单独验收。测试 runner 保持 root 单写。
