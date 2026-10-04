# 渲染与标注底层优化候选 · 2026-10-04

只读源码诊断，reviewer：`review_regulation`。未改产品、未运行测试或基准、未操作浏览器；下列是有调用链依据的候选，尚无实测收益。约束是保留模型几何、材质、像素比、相机、时间推进、标签内容与显示规则。实际选型及 baseline 由 root 完成。

当前目录没有 `src/scene/renderUpdates.js`。对应运行逻辑实际在 `src/processes/ProcessScene.jsx`、`src/CellScene.jsx`、`src/processes/playbackClock.js` 和 `src/scene/presentationAppearance.js`。

| 优先顺序 | 候选 | 适用负载 | 预期减少的工作 | 风险 |
| --- | --- | --- | --- | --- |
| 1 | 同一过程姿态只刷新一次世界矩阵 | 自带矩阵刷新以计算标签锚点的过程 | 第二次完整子树遍历、局部矩阵 compose、世界矩阵乘法 | 中：必须明确模型和场景各自的刷新责任 |
| 2 | 缓存结构视图普通 framing 距离 | 神经元、结构拆解旋转/自动旋转 | 每帧重复扫描各 part 的 8 个包围盒角点及临时分配 | 低至中：缓存键与导出方向拟合必须完整区分 |
| 3 | 结构标注统一分批测量并缓存窄屏标签栏高度 | 手机宽度旋转、语言/尺寸切换首帧 | 同步布局读取、重复样式与 SVG 属性写入 | 低至中：字体、换行及 rail 引起的尺寸反馈 |
| 4 | 关闭过程标注时暂停其 DOM 布局；可见时按脏状态准备文本 | 过程播放且关闭标注；固定视角或不变文本 | 编号、投影、碰撞搜索、隐藏 DOM 写入及临时对象 | 低至中：重新显示和动态标签变化必须完整失效 |

## 1. 统一过程矩阵刷新责任

`ProcessScene.jsx:235–243` 在每次 `pose.apply()` 成功后调用 `scene.updateMatrixWorld()`。部分模型已经在 `model.update()` 末尾为真实表面标签刷新整棵模型，例如 `secretionProcess.js:802–815`、`modules/operons/lacOperonProcess.js:292–304`；检索还发现其余 operon、bacterialExpression、synapse、phage 等同类调用。标签随后只读 `matrixWorld`。因此这些模型的单次姿态更新可走两次完整矩阵遍历。

这不是 Three.js 会自动跳过的第二次空操作：当前安装版 `node_modules/three/src/core/Object3D.js:1107–1160` 在默认 `matrixAutoUpdate=true` 时，每次都 compose 并设置 `matrixWorldNeedsUpdate`，随后递归全部 children。`scene.matrixWorldAutoUpdate=false` 已阻止 renderer 的自动更新（`WebGLRenderer.js:1536`），但不会阻止这里的显式调用。

**候选方案：**为已确认的模型采用明确的更新约定，让几何变更、一次世界矩阵刷新、标签锚点发布按顺序完成，场景复用该姿态已完成的矩阵。其他模型继续原路径。更长远可分离 `updateGeometry` 与 `updateLabelAnchors`，由场景统一刷新一次。不要批量关闭所有对象的 `matrixAutoUpdate`，也不要在标签取锚点之前删除唯一有效刷新。

**收益验证：**在同一 60 Hz 播放/任意 seek 脚本中计数 `updateMatrixWorld`、`updateMatrix` 的调用与耗时，分别记录模型更新、矩阵阶段和 renderer 提交 CPU 时间；比较相同进度的世界矩阵、标签坐标与固定相机原始 RGBA。必须覆盖首次建模/包围盒采样、父场景非单位矩阵、参数切换、暂停旋转，以及 `ProcessScene.jsx:510–529` 的临时导出 seek 和恢复。预期减少 CPU 遍历；不应改变 draw call、三角形数或 GPU 画面，不能据此承诺 GPU 时间降低。

## 2. 缓存普通 framing 计算

`CellScene.jsx:221–285` 的 `distance(false)` 对神经元或拆解模式调用 `explodedFitDistance()`；后者在 `scene/viewFraming.js:3–26` 每次枚举每个 part 的 8 个角点，并构造小数组/闭包。相机变化事件 `CellScene.jsx:293–305` 会通过 `readView()` 调用它，每个实际渲染帧结尾 `:1033` 又计算一次。正常旋转时，这一路的 `axes=null`，输入仅取决于模型/part bounds、node、mode、explode、aspect、fov、minDistance 等，不依赖正在变化的相机方向；神经元拆解时还可能同时做组装与拆解两次 bounds fit。

**候选方案：**只缓存普通 `distance(false, camera, null)`，按 presentation 版本、node、mode、explode、aspect、fov、controls.minDistance 完整失效。缓存算出的同一数值，不近似包围盒。`distance(true, exportCamera, separation)` 的方向拟合与自定义导出继续独立计算；必要时随后再给该路径设计完整键。

**收益验证：**记录 `explodedFitDistance` 每帧次数和扫描角点数，比较 neuron 全景/拆解、复杂细胞拆解旋转的 CPU 分布；同一输入下缓存返回值应与原函数逐值一致，保存/恢复视角、reset、resize 和导出相机 framing 不变。普通非神经元且非拆解视图原路径已经便宜，不应把特殊视图收益外推成所有模型收益。

## 3. 结构标注读写分批及 rail 高度缓存

`CellScene.jsx:907–957` 先修改文字、display、class 和 hidden；桌面标注布局在 `:975–1000` 每个条目内读 `offsetWidth` 后立刻写 left/top/SVG 坐标。现有 `measureKey` 已缓存未变文字和宽度，因此问题主要发生在尺寸或语言失效的首帧，不能称作“每帧测所有宽度”。窄屏路径则每个活动帧在上述写入后执行 `labelList.offsetHeight`（`:1003–1006`），即使可见标签集合和文字都未变化。多处 display、left/top、SVG 属性也会重复写相同值。

**候选方案：**先完成所有文本/可见性写入，再批量读取失效的宽度和 rail 尺寸，最后统一提交位置。rail 高度仅在语言、可见标签集合、mode、container width、字体加载或实际标签列表尺寸改变时重算；可用 `ResizeObserver` 更新缓存，但需避免 rail→容器高度→observer 的循环。DOM/SVG 提交保留原浮点坐标，只对确实相同的值跳过写入；不做坐标量化或降低更新频率。

**收益验证：**Chrome Performance 中对比 Layout/Recalculate Style 总时长与次数，独立记录尺寸 getter 次数、DOM/SVG 变更量和帧时间。用相同 camera/模式/文字检查桌面和 390px/320px 布局原图；覆盖中文/英文切换、字体延迟加载、结构切换、whole/section/explode、标注开关及 label focus/hover。确认 rail 高度、换行、顺序和点击区域与基线一致。不能仅用 JS 微基准证明浏览器布局收益。

## 4. 隐藏过程标注停算，准备文本与投影分开

`ProcessScene.jsx:244–245` 每次 WebGL render 后无条件调用 `projectLabels()`。`annotations` 只写在返回 DOM 的 `data-annotations`（`:594`）；`processes.css:721–725` 用 `display:none` 隐藏标注，但该值没有进入当前 live 数据和投影函数。隐藏时仍执行 `annotationDom.js:6–43` 编号/文字准备，以及 `ProcessScene.jsx:185–219` 投影、`placeLabel()` 候选/碰撞分配和 DOM/SVG 写入。`labelLayout.js:8–13,16–64` 每次建立编号数组、候选数组和矩形对象。可见状态下，文本尺寸缓存和分批测量已经存在，应保留。

**候选方案：**标注关闭时跳过整个 DOM 标注准备/投影路径；开关重新开启时显式 invalidation 并 requestRender。可见时将文本/编号准备与每帧必要的坐标投影分开：只有语言、当前文字和 active 集合改变时准备文本，只有 camera/anchor/viewport/metrics 改变时重新布局；保留逐帧动态锚点。复用投影向量和候选容器可以作为小幅后续优化，碰撞优先级及候选顺序保持原样。

**收益验证：**同一过程同一播放轨迹下分别测标注开/关的 projectLabels CPU、DOM 属性变更和分配/GC；验证开关前后 3D RGBA、model update cadence 和导出文字完全一致。特别覆盖隐藏期间文字/active/语言变化后再显示：`display:none` 下尺寸可能为 0，不能将隐藏尺寸作为重新显示后的有效缓存。暂停时重新开标签也必须立即刷新，且不影响独立的 Canvas 导出标注层。

## 现有边界与选择建议

当前已具备：过程帧率与 React 发布分离、同姿态 update 缓存、过程静止时 demand render（`playbackClock.js:48–67`、`ProcessScene.jsx:225–249`）；结构相机帧复用场景矩阵和静态阴影（`CellScene.jsx:115–124,903–906`）；外观对象一次索引与状态更新（`presentationAppearance.js:5–55`）；过程文字度量缓存（`annotationDom.js:34–42`）。这些不应再次作为新收益申报。

`CellScene.jsx:778–837` 仍在 idle 时持续 RAF/controls.update，但已经不执行 WebGL render；改为完全事件唤醒主要减少 idle CPU/电耗，需要完整处理异步模型完成、resize、输入、可见性恢复及失效事件，当前优先级低于上述有活动帧收益的候选。源码阅读未证实可以安全删除 GPU draw：透明对象的排序和混合、阴影、材质/几何批次都需额外实测与像素验证，不能直接承诺无损合批收益。

建议 root 先从 baseline 确认主要瓶颈，再选择矩阵重复更新与普通 framing 缓存中的命中项，随后处理窄屏 DOM 布局。所有收益都应同时报告 CPU/GPU 或帧时间证据与固定视角差异，避免用减少代码调用数替代画面及持续播放验收。此报告没有执行、接受或部署任何候选。
