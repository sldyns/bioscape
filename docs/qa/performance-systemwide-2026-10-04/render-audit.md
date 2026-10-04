# 结构场景渲染、拾取和取景审计 · 2026-10-04

初始审计状态：只读源码诊断；产品基线由 root 冻结为 `ae697be`，位置 `/tmp/bioscape-systemwide-20261004-baseline-ae697be`。初稿只写本文，没有实例化模型、计时、运行测试、build、浏览器、提交或发布。后续授权实施和定向验证追加在文末。下列优先级是按重复工作的确定性、覆盖负载及改动风险排序，**没有实测收益结论**。已阅读 `.github/CONTRIBUTING.md`。保留几何、材质、像素比、阴影、动作、标签、取景及拾取语义。

审计范围：`src/CellScene.jsx`、`src/scene/{presentation,presentationAppearance,picking,picking.worker,viewFraming,framingDistanceCache}.js`；补充只读当前安装版 Three.js 的矩阵、包围盒、raycast 实现和相关 CSS。下面行号指审计时源码。

## 已实现的边界：不要重复申报收益

| 已有措施 | 证据 | 准确边界 |
| --- | --- | --- |
| 普通 framing 单项缓存 | `CellScene.jsx:288–307`、`framingDistanceCache.js:3–49` | presentation/parts 身份与长度、node、mode、explode、camera、aspect、fov、minDistance 相同时复用精确结果；普通相机旋转不再扫描各 part 的 8 个角点。 |
| 导出和方向拟合独立计算 | `framingDistanceCache.js:13–18` | `preserveOrientation`、其他 camera、显式 separation（包括 0）均绕过普通缓存。不可直接删掉这些重新计算。 |
| 相机帧复用场景世界矩阵 | `CellScene.jsx:123–125,924–927` | `scene.matrixWorldAutoUpdate=false`；仅 `matricesDirty` 时显式更新。根进入缩放、拆解、收缩仍需要更新。 |
| 静态阴影复用 | `CellScene.jsx:117–119,870–921,1039` | 模型姿态和截面可见性变化会标记阴影；单纯相机变化不会重建阴影。 |
| 外观对象索引与状态缓存 | `presentationAppearance.js:10–18,23–55` | 稳定相机帧不遍历层级，也不改材质；只有 mode 变化扫描 visibility 数组，active 变化或渐变未结束扫描 emissive 数组。 |
| 结构静止后跳过 WebGL render | `CellScene.jsx:845–858` | 仍保留每个 RAF 的 controls.update、状态检查和 idle 指标写入，不能称完全停止调度。 |
| 精确三角形 BVH 在 worker 构建 | `picking.js:19–54,59–83`、`picking.worker.js:4–24` | 拷贝 position/index 后 transfer 拷贝；`indirect:true`、`setIndex:false` 保留渲染缓冲和三角形顺序；未就绪/worker 失败继续标准 raycast。 |
| 桌面标签宽度已有缓存 | `CellScene.jsx:1005–1009` | 文字和 viewWidth 不变时不读 offsetWidth。当前问题不是“每帧测所有宽度”。 |
| presentation 有 8 项 LRU | `CellScene.jsx:427–437` | 缓存命中绕过 makePresentation，但 switchNode 后半仍重建索引和标签。 |

上一轮报告 `docs/qa/performance-2026-10-04/renderer.md` 记录普通 framing 缓存与**过程**隐藏标注停算。本轮仍未覆盖的是以下**结构**标签、拾取、缓存回访和 idle 工作；不要把过去 render-candidates 中已落地的候选再次当新发现。

## 候选排序

| 优先级 | 最小候选 | 真实覆盖负载 | 预计减少的工作 | 风险 |
| --- | --- | --- | --- | --- |
| P1 | 结构标签静态准备与投影分离；隐藏停算；rail 度量完整失效缓存 | 手机旋转、持续高亮、关闭标签的旋转 | 重复 DOM 写入、窄屏同步布局读取、高亮帧重复投影/排序 | 中：可见性、字体、尺寸和 rail 反馈 |
| P1 | 拾取候选列表按 presentation/可见性版本缓存并预分组 | 复杂结构持续 hover、点击 | O(mesh × 祖先深度) 可见性检查、多次全数组过滤 | 低至中：祖先可见性、模式切换与导出恢复 |
| P2 | presentation 保存静态 mesh/visibility/emissive/cap 索引 | 同组件内反复进入缓存节点 | 多次全树遍历与重复数组构建 | 低至中：激活状态和资源释放 |
| P2 | 结构 idle 改为事件唤醒 RAF | 静止查看、多个比较视图、后台 | 空闲 controls.update、dataset 写入及 RAF 回调 | 中：所有唤醒和阻尼尾帧必须覆盖 |
| P2 | 外观渐变仅处理仍变化/新旧 active 对象 | 大量 mesh 的 hover 渐变 | 每个高亮帧扫描全部 emissive 对象 | 中：途中反转、共享材质与回访残留 |
| P2 / 次选 | 首次 presentation 包围盒阶段删除已证实重复矩阵传播 | 首次打开或 LRU 淘汰后的节点 | 两轮完整的局部矩阵 compose/世界矩阵传播 | 中：父矩阵和每阶段最终值严格等价 |
| P3 / 先证据 | 对 InstancedMesh 做精确实例 broad phase | 实例较多且射线穿过总包围体 | 标准逐实例 matrix/raycast | 高；当前没有实例命中成本数据，不建议本轮首改 |

### 1. 结构标签：目前每个活动渲染帧仍执行整段 DOM 路径

证据在 `CellScene.jsx:929–1032`：所有活动帧遍历 parts/landmarks、设置 display，投影可见锚点，创建 projectedLabels；桌面两次 filter 和 sort 后设置 left/top/SVG；窄屏设置 pins 后读取 `labelList.offsetHeight`。高亮渐变会让 `highlightMoving` 保持活动，但相机和 part 变换可完全不变，此时标签布局结果未变。关闭标签时已经不投影可见锚点，也不读 rail 高度，但仍查询结构文字、遍历标签、写 display/hidden/style，不能声称其仍做完整投影。

最小落地可分两步：

1. 按 presentation、lang、mode、labels、compact 状态准备一次文字/可见集合/编号/DOM 容器状态；关闭时一次性隐藏，并跳过后续结构标签准备与布局。可见时先完成所有失效文字/样式写入，再批量读取失效宽度，最后统一写坐标；保持原投影、左右划分、稳定排序、gap、clamp 和数值精度。
2. rail 尺寸仅在其真实输入变化时读取；把标签投影更新与材质高亮更新分离。相机矩阵/投影矩阵、模型变换版本、viewport、展示模式、可见集合或度量变化才需要重排。单纯高亮颜色变化保留已有标签坐标。不要用当前全局 dirty 直接判定标签，因为 hover 也会将它置 true；也不要只信 controls.update 的返回值，API setView/fit/resize 已可能在之前更新 controls。

失效边界：

- presentation 重建/回访、lang、labels 重显、whole/section/explode、partLabelModes/landmark 可见集合、根 transition、拆解/收缩都必须覆盖。
- width/height、560px compact 边界、实际标签 CSS 尺寸、字体 loadingdone/字体度量变化都须触发失效。现有 measureKey 只有文字+width，没有字体维度；不能在新缓存中继续依赖这个不完整边界。
- `src/styles.css:1095–1127` 的窄屏列表会换行；横屏规则 `:1345–1357` 改为 nowrap/横向滚动，`compare/comparison.css:169–184` 又有独立尺寸。不能只以文字和窗口宽度推导 rail。
- `--label-rail` 会反向改变 `.model-canvas` 可用高度（`styles.css:1342`、`comparison.css:157,167`）；建议列表 ResizeObserver/完整尺寸版本配合一次失效测量，禁止形成 rail→resize→rail 的振荡。隐藏时不缓存 display:none 的零尺寸；首次重显需主动安排帧。
- 独立 `capture.getLabels`（`CellScene.jsx:1077–1108`）必须继续返回完整导出标签，不受 live labels=false 的优化影响。

### 2. 拾取：BVH 减少三角形工作，没有减少对象/祖先过滤

`CellScene.jsx:676–734` 的 hit 每次都 filter 全部 pickable 并逐级检查祖先 visible；整体细胞类再按 backdrop 列表 filter 一遍，有需要时第二遍；末尾再次全量 filter 统计 indexedMeshes。hover 虽已有 65ms 节流（`:773–775`），仍可能每秒重复约 15 次；不能再用降低拾取频率换收益。

最小改动：每个 presentation 预存所有可交互候选及前景/backdrop 静态分组；在可见性版本变化时更新可见候选，hit 直接复用数组。保留“有任何前景命中就优先前景，只有无前景才投 backdrop”的业务规则；不能把两组直接合并后只取距离最近对象。保持每组原 mesh 顺序，避免等距离时改变稳定命中。children 合法性也可使用固定集合，但不能把非子节点的遮挡 mesh 无条件移除——当前先找最近 mesh，再判定其 hitId 是否子节点，这会影响遮挡语义。

失效必须包括 mode 外观切换、presentation 添加/删除/回访、任何非 mode 的 ancestor.visible/nonInteractive 变更及临时导出可见性还原。当前实时 mesh 可见性集中在 `presentationAppearance.js:24–33`，导出临时写在 `CellScene.jsx:1154–1174`。mode 的外观应用发生在 render 末尾；事件如果先到，要明确候选对应的是当前已呈现 visibility 状态，不要提前混用未来 mode。BVH 完成不改变可见候选，只改变加速与统计信息。

`indexedMeshes` 建议由 BVH 完成/geometry disposal/presentation 切换推动统计失效，而不是每次 hit 全扫。要保留按 mesh 计数语义：多个 mesh 可以共用同一 geometry，不等于树数量。不要为“加速”将加速树改成简化网格或粗包围盒最终命中。

`picking.js:23–36` 仍在主线程对当前 geometry 的 position/index 做 `.slice()`；这是保证 render buffer 不被 transfer 的必要隔离，有首建成本但不是每帧工作。没有内存/端到端首建证据前，不应改为转走原缓冲。queue 重建优先最新视图，pending 原任务可完成；geometry dispose 的 WeakSet 已防止将结果写到已释放几何。worker 错误有原生 fallback，必须保留。

### 3. 缓存回访仍做多次完整遍历

`switchNode` 即使 `cache.has(id)` 也会重新 `createPresentationAppearance(root)`（`:439`），再 root.traverse 建 pickable/检查 boundingBox（`:463–469`），再 root.traverse 数 cap（`:532–535`），随后准备 BVH queue 和删除/创建标签节点。已有 boundingBox 时条件不会重新扫描顶点；这些是对象遍历/检查，不能误报成每次重建全部几何包围盒。

最小改动是为 presentation 存一份静态 metadata 索引：mesh 列表、可见性控制对象、emissive 对象、capCount、标签描述。建表可合并进现有一次 traverse；回访直接复用。外观控制器的 previousMode/previousActive/moving 属于激活状态，不能机械复用成“认为已稳定”并跳过旧高亮修复；可以复用静态索引但重置状态，或保存完整正确的渐变状态。DOM 标签缓存并非必要首步，先减少遍历即可保持目前 DOM 生命周期。

释放边界保持现有 8 项 LRU；静态 metadata 跟随 presentation 释放，不能持有被 dispose 的 root/geometry；node 和 viewKey 的含义不同，仍按当前 id 模型缓存与 viewKey 相机记忆规则工作。

### 4. idle RAF 是剩余空闲 CPU 候选

`animate` 在 `CellScene.jsx:800` 最先申请下一个 RAF；idle 分支在 `:845` 之后才返回，所以每轮仍更新 dt/damping、controls.update、renderState/renderFps 与计数。document.hidden/contextLost 分支也会再次安排 RAF，只是后续被浏览器节流；已跳过 WebGL，不可把改进表述为“停止空闲 GPU 渲染”。

若基线确认其影响，再做 demand scheduler：invalidate 只保留一个待执行 RAF，fitting/transition/parts/highlight/controls damping/autoRotate 期间继续，真正稳定后停止。需显式唤醒 controls change/start/end 或输入、prop effects、异步模型成功/失败/取消、ResizeObserver、font/layout 变化、visibilitychange、context restore/retry、setView/zoom/reset。当前 orbitChanged 只负责 onViewChange，没有调度逻辑；直接删下一帧申请会使拖动/阻尼/新路由停住。

可见性恢复应清 previous 时间，避免大 dt；每次恢复只建立一个 loop。销毁、丢上下文和异步旧任务回包必须不能重新排帧。对 demand scheduler 来说，读取标签列表的 ResizeObserver 回调也属于显式唤醒源。不要用定时低 FPS、降低 autoRotate 更新频率或修改 ease 作为替代。

### 5. 高亮仍会扫描全部 emissive 索引

`presentationAppearance.js:36–53` 在 active 变化或任意对象未收敛时扫描整个 emissive 数组。默认材质渐变即便只影响一个 hitId，其他已经停在 rest 的对象仍会被比较并 copy。现有索引已经消除了 traverse，不应误报为逐帧层级遍历。

可按 hitId 分组，并维护“尚未收敛对象”集合及上次/新 active 的并集；首激活或缓存回访仍需初始化所有对象。每个实际变化对象继续完全相同的 lerp、阈值、顺序和最终 copy；高亮途中 A→B→C→空、hover 与显式 highlight 优先级、reduceMotion=1 都要保持。特别核查特殊模型共享 material：若两个 hitId 共用材质，现有顺序可能影响结果，不能先假设各 mesh 材质互不影响。已有 `tests/render-updates.mjs` 含逐帧颜色对照、反转和缓存回访，可以扩展真实边界；本审计未运行它。

### 6. 首建包围盒包含真实重复矩阵传播，但不是稳态瓶颈

`presentation.js:86–87` 在 `root.updateMatrixWorld(true)` 后马上 `Box3.setFromObject(root)`；`:95–98` 再更新全 root，然后对每个 part 求 Box3。当前安装版 `Box3.expandByObject`（`node_modules/three/src/math/Box3.js:298–374`）会按父先子后的顺序对每个对象调用 `updateWorldMatrix(false,false)`；后者在默认 matrixAutoUpdate 下重新 compose（`Object3D.js:1173–1209`）。因此两组显式遍历紧邻隐式遍历，确有重复计算。parts 是分开的子树，逐 part bounds 总量约 O(N)，不是 O(parts × N)。默认 `precise=false` 主要复用几何/实例 boundingBox，不能称每次都逐顶点求精确世界包围盒。

最低风险候选是逐处证明并移除紧邻 bounds 遍历之前的冗余 `root.updateMatrixWorld(true)`，保留 setFromObject 自身的父先子更新与原 bounds 算法。第一次 root 无父、第二次 root 本身变换未变但孩子已归一化；仍必须比较 root/所有子世界矩阵、bounds、home、restScale、labelAnchor、offset、landmarks，而不是只看屏幕大致相同。不要同时重写 bounds 数学、改变计算次序或批量关闭 matrixAutoUpdate。`model?.cell.updateMatrixWorld(true)`（`:7`）为后续 source.matrixWorld 提供前提；缓存它需要 source revision 契约，不建议顺带删除。

`worldToLocal` 在 `:399,404` 还会刷新祖先链，但每 part 一两次、只在 presentation 构建发生，优先级低。活动拆解时 `scene.updateMatrixWorld()` 仍递归静态 descendants，确有进一步冻结局部矩阵的理论空间，但必须处理克隆、层级、capture pose 及第三方 updateWorldMatrix 行为，风险高于上述局部重复消除，当前不建议扩大范围。

### 7. InstancedMesh 不在当前 BVH 加速范围

`picking.js:61–65` 主动跳过 InstancedMesh。真实来源包括 `buildCell.js:142` 的 beads 和 `:414` 的 ribosome instances。安装版 `InstancedMesh.raycast`（`node_modules/three/src/objects/InstancedMesh.js:248–297`）先做整体 boundingSphere，再逐实例组合矩阵并调用内部 Mesh.raycast；当前产品没有全局替换 Mesh.prototype.raycast。因此不能因 geometry 偶然已有 boundsTree 就认为实例也已加速。

若实际命中成本集中在这里，可设计保留精确三角形测试的实例包围体 broad phase；必须保留 instanceId、material side、closest distance、非均匀 scale、near/far、重叠/等距离稳定结果和动态 instanceMatrix 失效。直接给 InstancedMesh 赋普通 acceleratedRaycast 不会自动获得正确逐实例语义，不作为本轮小改候选。

## 计时解释和验收建议

现有 dataset 适合局部观察，不能覆盖全部交互：

- `prepareMs` 在 `CellScene.jsx:626` 写入，之后 `:630` 才 switchNode；不含 presentation 克隆、bounds、索引、DOM 构建，缓存命中还直接报告 0。首建/回访需要另测请求→首个正确 ready/render 端到端时间和长任务。
- `frameCpuMs` 起点在 `:860`，不含前面的 fitting、controls.update；终点在 `:1045`，不含 `:1054` framing/后续 dataset 和 publishReady。需要浏览器帧/主线程总时间配合，不能拿它证明 idle CPU 或完整帧收益。
- `pickMs` 在 `:729` 写入，未含 `:730` indexedMeshes 全扫和 pointerMove 后续 hover DOM。完整输入处理和标准/BVH 两条 raycast 的统计要分别保留。

root 可按选中的改动执行以下验证；本报告所有项目均为待验证计划：

| 门槛 | 覆盖 | 通过依据 |
| --- | --- | --- |
| 数值/输出等价 | 相同 presentation、逐帧相机/part矩阵、颜色、visibility、bounds、framing、标签投影/顺序、命中 object/instanceId/距离 | 与冻结基线逐项比较；相同输入保留浮点值和排序，不能仅作宽松范围断言 |
| 标签隐藏/重显 | 初始关闭；隐藏期间语言/模式/拆解/收缩/字体/尺寸变化；静止时重显；live 关闭时导出 | 隐藏时零投影/布局测量与多余写入；重显用最新文字/锚点/尺寸，导出标签不缺失 |
| 尺寸与真实 DOM | 320px/390px/560px 两侧/桌面；中文英文；迟到字体；纵横屏、比较双视图；缩到 0 再恢复 | 标签换行、rail、点击区、引线、取景与参考一致，ResizeObserver 无循环，0 尺寸不污染缓存 |
| 输入与动画 | hover→不同 hover→离开、label focus/blur、拖动/阻尼尾帧、autoRotate、resize/fit、收缩/拆解途中切换 | 交互响应、全部中间帧和最终姿态保留；只省不必要工作，不减频率 |
| 拾取正确性 | 全景前景/backdrop；whole/section/explode；半透明遮挡；BVH 前/后/失败；共用 geometry；不同 material side；实例 | 对同一屏幕射线输出一致，隐藏祖先不可命中；加速可用性不改变命中 |
| 生命周期 | 路由快切、缓存回访/第 9 个淘汰、异步旧回包、隐藏/恢复、context lost/restored/retry、销毁 | 无旧节点、陈旧矩阵/索引、重复 RAF/listener 或已释放资源使用；恢复首帧像素正确 |
| Capture 事务 | 自定义方向/portrait/landscape、显式 separation=0/非0、透明背景，成功与抛错后继续交互 | 导出结果与基线一致；pose、visibility、live shadow、缓存/调度全部还原 |
| 真实性能与画面 | 同设备/同场景/同输入序列串行 A/B；冷首建、热回访、旋转、hover、idle分别记录 | CPU/布局/主线程/帧间隔/long task/拾取成本分阶段报告；固定视角原始图像及原几何/材质/像素比/阴影不变 |

优先建议是结构标签与拾取列表缓存，两者都有当前源码证明的重复路径，且可以不接触渲染质量和模型数据。先以 root 的串行 baseline 判定命中负载，再选一个小面实现并验证。普通 framing 缓存、纯相机矩阵复用和静态阴影缓存继续保持原责任边界。

## 后续授权实施记录（实施完成时未验证）

root 在上述审计完成后授权最小安全改动。已编辑 `src/CellScene.jsx`，新增 `src/scene/pickingCandidates.js`、`src/scene/structureDomUpdates.js` 和 `tests/structure-render-reuse.mjs`。没有改动 `picking.js` 的 worker/BVH 机制、transfer/loaders、framing 数学、capture 或 verify runner。上文只读审计及原始优先级保留，源码定位仍指修改前。

- 拾取在 switchNode 时按稳定 hitId 建立前景/backdrop 分类，复用两组 scratch 数组；**每次 hit 仍重新检查 mesh.nonInteractive 和所有祖先 visible**，未做动态可见性缓存。候选 mesh 和组内顺序保持；仅前景无命中时询问 backdrop。材质、near/far、BVH、实例和最终 child 合法性仍由原有路径处理。indexedMeshes 从 filter 分配改为同语义循环计数，未缓存异步索引状态。
- 结构标签仅按实际 DOM 当前值决定是否提交 style、hidden 和 SVG 属性；没有独立值缓存。原投影/排序/布局/度量/rail/文字/可见性算法仍全部运行，也未减少精度或修改更新频率。未实施更大的 dirty/hidden/rail 缓存，因为完整生命周期和真实浏览器边界尚待验证。
- 新定向测试源码覆盖：7 类全景分组与顺序、普通详情不分组、scratch 复用无累积、动态祖先/自身可见性与 nonInteractive、重新挂父节点、presentation 替换、空候选，以及 DOM 同值不写和外部变化后修复。

实施完成当时，受 root 正在执行串行全站 baseline 的约束，**尚未运行任何新测试、format、build、模型实例化或浏览器/计时**。后续先检查新 helper 用例，再做真实射线/固定视角/标签/生命周期与性能 A/B；只有完成这些门槛后才能结论为等价或有收益。

## 基线扫描结束后的定向验证

root 后续明确允许定向正确性测试和必要 bundle 检查；仍禁止性能测量、浏览器和全量 check。以下验证已完成：

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 新 helper 4 项用例 + 既有 render-updates | 5/5 通过；涵盖动态祖先、重挂父节点、nonInteractive、分组/顺序、数组复用与 DOM 同值/外部变化 | `evidence/render/targeted-tests.log` |
| 冻结/当前真实 hit 函数体对照 | **2,880 组严格一致**；原生/BVH、7 类全景+详情、祖先/自身隐藏、nonInteractive、Front/Back/DoubleSide、near/far、中心/离轴/实例射线 | `evidence/render/hit-equivalence.mjs`、`hit-equivalence.json`、`hit-equivalence.log` |
| 拾取对照的比较字段 | 候选 UUID 顺序、每次非空候选调用的命中 UUID/距离/instanceId 完整序列、最终合法 child id、indexedMeshes；全部严格相等 | 上述实际函数体测试；performance.now 替换为固定 0，不作计时 |
| CellScene 浏览器模块 bundle | esbuild `write:false`，通过且 0 warnings；未执行生产 build | `evidence/render/bundle.log` |
| owned 源码/用例/证据脚本格式 | Prettier write 成功；只处理本代理文件 | `evidence/render/format.log` |
| diff whitespace | 通过 | `evidence/render/diff-check.log` |
| 被验证源码收据 | SHA-256 已保存 | `evidence/render/source-sha256.txt` |

射线对照使用小型合成 Plane/InstancedMesh，运行的是从显式冻结输入和当前 `CellScene.jsx` 提取的真实 hit 函数体。它不依赖完整生物模型构建，不是浏览器或性能基准。证据脚本需要显式传入冻结源码路径；临时 baseline 路径是此次证据来源，不进入正式 CI 测试依赖。测试没有证明真实字体、CSS、GPU 像素、context恢复或帧时间收益。

实际 style getter 可能把小数 px 序列化为规范字符串；与请求字符串不严格相同时，helper 会保守继续写入。当前改动只承诺消除确实同值的提交，不能声称清空所有高亮帧 DOM 写入，也没有减少投影或 offsetHeight 次数。

root 仍需把 `tests/structure-render-reuse.mjs` 接入其单写 verify runner，统一进行完整检查、真实浏览器固定视角/标签/生命周期检查以及串行 A/B。上述未实施候选继续开放。
