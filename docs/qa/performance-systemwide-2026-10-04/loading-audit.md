# 结构模型加载、传输与生命周期诊断 · 2026-10-04

本报告是对 `ae697be` 工作区加载链路的只读源码诊断；冻结对照源为 `/tmp/bioscape-systemwide-20261004-baseline-ae697be`。已读 `.github/CONTRIBUTING.md`。未运行模型、测试、构建、计时或浏览器，未提交、推送或部署。以下收益是可删除操作和适用路径的分析，不是新测得的时间或内存收益。产品文件未改。

审查覆盖 `cellLoader.js`、`detailLoader.js`、`preparedModelCache.js`、两个 transfer/worker、`loadDetailModel.js`、`buildCell.js`，以及必要的 `detailModels.js`、`presentation.js`、`CellScene.jsx`、首页/对比调用处与已安装 Three.js 实现。所有建议保留完整顶点、法线、索引、实例、纹理、材质、解剖层级、交互和模型范围。

## 已确认的基础与边界

- worker 已用 transfer list 转移原 typed buffers，未量化或降低细分：`cell.worker.js:5–6`、`detail.worker.js:5–6`。
- prepared cache 命中时，几何数组直接共享；新建 geometry/material/Object3D 包装和独立 `userData`：`cellTransfer.js:149–190`、`detailTransfer.js:56–72`。这不是一次完整顶点数组 clone。不要把必要的状态隔离当成冗余删除。
- `cellTransfer.js:38–55` 已按 geometry/material 对象身份去重；`disposeCell:223–234` 已用 Set 释放唯一 geometry/material。
- 过期 detail 回复在读取 payload、unpack 与缓存之前被丢弃：`detailLoader.js:26–37`。`tests/prepared-model-cache.mjs:143–156` 已将“不读取过期 payload”作为契约；后续共享任务必须保留。
- 通用 `CellScene` 同时服务首页（`HeroScene.jsx:129`）、结构探索和对比（`CompareWorkspace.jsx:404`），因此传输与恢复的改进可以覆盖多条产品路径。过程播放另有独立加载链路，本报告不宣称覆盖它。

## 优先级与可实现改动

| 优先 | 候选 | 源码证据与收益边界 | 风险 |
| --- | --- | --- | --- |
| A1 | worker 准备并传回精确 bounds | 所有结构缓存恢复/首次主线程接管；消除主线程重复顶点和实例扫描 | 低至中，需覆盖 geometry 与实例 bounds |
| A2 | 三个线粒体共用一次构建的模板 | 整细胞每次冷构建必然少做两次相同 raw + merge；减少对应唯一几何传输与保留 | 低，需验证引用与销毁 |
| A3 | 同 key 的在建 payload 共享 | 两个对比场景或短时间重复请求可只构建一次；收益依赖真实并发命中 | 中，取消/所有权最关键 |
| B1 | 减少 detail 批处理临时整数组复制 | 所有 detail 都走 copy → transform → merge；大模型峰值和准备时间候选 | 中至高，merge 语义不能改变 |
| B2 | prepared payload 复用 BVH | 热缓存重建仍 slice 全 position/index 并重建精确拾取索引 | 中，生命周期与间接索引 |
| B3 | 统一观察 CPU/cache/live/GPU 保留范围 | 224 MiB 是 prepared buffers 的预算，不是页面总内存预算；视图另有每场景八条缓存 | 中，先测量再调策略 |
| C1 | 删除 InstancedMesh 空初始化/不必要的实例复制 | unpack 先分配并填单位阵，随即覆盖；presentation clone 再复制实例数组 | 低至中，局部而非全站主收益 |
| C2 | detail 工厂按需导入、失败路径缓存 | Worker 冷启动导入范围和 worker 不可用时的重复构建 | 中，需测模块成本与失败场景 |

### A1. 传输丢失 bounds，缓存命中仍会回到顶点扫描

证据链：

1. `cellTransfer.js:42–49`、`detailTransfer.js:30–45` 只保存 attributes/index/groups/drawRange 等，未保存 geometry `boundingBox`/`boundingSphere`。cell 节点 payload 也未保存 InstancedMesh 自身的 bounds（`cellTransfer.js:90–114`）。
2. unpack 每次创建新 `BufferGeometry`（`cellTransfer.js:157–165`、`detailTransfer.js:58–66`），bounds 初始为 null。
3. `presentation.js:87–99` 对根和各 part 做 `Box3.setFromObject`；Three `Box3.js:335–358` 在 null 时计算 geometry 或 object bounds。`CellScene.jsx:467` 还确保全部可拾取 geometry 的 box 存在。首帧的 sphere 计算同理发生在接管后的渲染/裁剪路径。
4. 因而“prepared-cache”只跳过几何生成，没有跳过恢复后对相同不可变数组的 bounds 派生。

实现：在 worker 最终几何构建完成后，用当前 Three 的 `computeBoundingBox/computeBoundingSphere` 计算与原路径相同的局部 bounds；把 min/max/center/radius 作为数字元数据传回并保留到 prepared payload；unpack 恢复独立 Box3/Sphere。InstancedMesh 需保存对象级 bounds，不能以基础 geometry bounds 代替。调用原方法并保留 Float64 数值，避免“较宽包围球”或改变计算顺序。

收益边界：冷路径主要把这部分计算移出 UI 线程，并不保证总 CPU 下降；暖恢复能直接复用派生结果。若预计算了原本根本不会被请求的 sphere，则可能增加冷 worker 时间，必须分别测 worker prepare、主线程接管、首帧。不要只看旧 `data-prepare-ms`。

验证：全数组/材质 hash 不变；对冻结源实际执行原 bounds 计算后的结果比较，包含普通 Mesh、全部 InstancedMesh、空 geometry、非均匀缩放、整体/剖面/拆解、各 part `frameBounds` 与相机距离。用 structured clone 保留 Infinity，不能经 JSON 把无限值转 null。对两个暖恢复场景验证修改某个 Box3 不污染另一个或 payload。

### A2. 同一整细胞里，三个线粒体完全重复构建

`buildCell.js:367–380` 的三次 `makeMito` 都执行 `mergeMitochondrion(rawMitochondrion())`，区别只有后续 position/rotation/scale。`mitochondriaDetails.js:293–343` 的工厂和 merge 是同一套确定性输入；该文件没有随机源。每次 raw + merge 都新建同样的高细分几何，之后 transfer 去重无法合并这些不同对象。

实现：在 `buildCell` 内构建一个局部模板；三组场景节点独立 clone，geometry 与 base material 共享不可变引用，分别设置原变换，并照旧遍历每份节点登记 `full`。不引入进程全局模板缓存，避免 worker transfer 后数组 detached。`makePresentation.register` 已为显示场景 clone material，`disposeCell` 已按资源身份去重。

收益可以严格表述为每次 cell 冷构建少两次相同工厂和合并；每份重复线粒体 geometry 的 CPU/传输保留从三份变一份。不得据此声称整个 cell 内存降至三分之一。需确认共享 wrapper 后实际 WebGL geometry 上传数，不能把 CPU 字节差直接当 GPU 字节差。

验证：冻结/新源三组所有 mesh 的顶点、法线、索引、材质、world matrix、cap/cutOnly/hitId、`groups`/`parts`/`full` 顺序与成员身份语义相同；在独立 presentation 中切剖面、拆解、高亮不串状态；资源唯一释放一次；离开/返回/对比一侧卸载后另一侧正常。包含 `mitochondria`、`mitoInner` 与 `atpSynthase` 叶级入口，不替代它们的独立放大模型。

### A3. 只有已完成缓存，没有同 key 的在建任务共享

`createPreparedModelCache` 只有 completed `Map`；`cellLoader.js:7–30`、`detailLoader.js:61–75` 未命中便各自启动/投递。每个 `CellScene` 拥有一个 loader（`CellScene.jsx:183–189`），对比左右各挂一个，且 `CompareWorkspace.jsx:405` 以 `pane.id` 为 key 在选模型时重挂。两个场景冷请求同模型，或同 loader 重复请求尚未完成的 detail，都会重复构建同样的 payload。

实现：在共享的 prepared 服务中维护按 cache 实例和模型 key 隔离的 pending 任务；共享的是 CPU payload 的准备承诺，每个存活消费者独立 unpack，绝不能让两侧共享可变 Group/material。消费者有独立取消订阅；一个取消不影响另一个，全部消费者取消才终止对应工作并删 pending。失败、异常、取消必须 settle 并移除 pending，才能重试。

现有 `isCurrent` 只在主线程收到结果时过滤，worker 收不到取消信息（`detail.worker.js:3–6`）。快速换模型时，过期构建、pack 和传输可能已全部完成。可在共享调度器中先做去重和排队替换，再考虑中止完全无订阅者的 worker；同步几何函数无法靠消息在中途协作取消，不应假称一个 cancel 消息就能停止它。

验证重点：两个相同请求只发生一次 build/pack；取消 A 不影响 B；全部取消时不 unpack、不 cache 过期 payload；A → B → A 每个视图 token 保持原契约；worker 异常与 fallback 后可重试；warm get 不启动 worker；两个视图的材质、`userData`、bounds、释放事件独立。

### B1. detail 通用批处理的整数组临时副本与 merge

所有 detail 路径最终通过 `detailModel`。`detailModels.js:97–101` 为每个源 mesh 复制全部 geometry attributes/index，然后 applyMatrix4；`128` 的 `mergeGeometries` 又为每个属性分配合并数组。Three `BufferGeometry.js:1346–1364`、`BufferAttribute.js:199–205` 证明 copy 实际复制 typed arrays；`BufferGeometryUtils.js:242–264,378–406` 还先将索引装入普通 JS 数组，再创建 typed index。源图、变换后副本、合并输出会在一段构建窗口共存。

先做低风险、可隔离实验：统计每个模型 bin 的 mesh 数、源/临时/结果字节。只有一个 geometry 的 bin 可以考虑直接接管已变换副本，省掉第二次 merge 分配；但不能无条件返回它，因为 `mergeGeometries` 会统一 index 类型、groups、drawRange、attribute usage/gpuType 等语义。先做准确条件谓词，或把这些字段规范为原 merge 的结果，然后验证所有字段。

更大改动是以精确尺寸预分配最终 typed arrays，按原遍历和变换顺序填入，不保留所有中间 geometry。必须保留原 `applyMatrix4` 写回 Float32 的舍入点、normal/tangent 的运算顺序、triangle/index 顺序以及 material bins，不可用重新关联矩阵或量化换速度。此项先分析高耗时具体模型再实施，不宜直接全站替换 merge。

不要改掉按完整材质身份分桶：`detailModels.js:51–62` 明确防止同色但不同透明/物理参数的 mesh 错误合并，已有 `tests/models.mjs:236–255` 回归。

### B2. 暖模型恢复后，精确拾取 BVH 仍从头复制与重建

`CellScene.jsx:471` 在换视图后 prepare 拾取；`picking.js:25–28` 对 position/index 做 `.slice()` 以便 transfer，`picking.worker.js:12–17` 建 `indirect: true` BVH 并传回。prepared payload 不含树；warm unpack 的新 geometry 没有 `boundsTree`，因此重新做这套工作。

这些 slice 当前是必要的所有权保护：直接 transfer 渲染/缓存数组会 detach 活跃几何，不能删。可行方向是在 prepared entry 旁按 immutable geometry identity/版本缓存序列化的 BVH，跨恢复只 deserialize 到当前 wrapper；或让几何 worker 在已有原始数组上生成树，在同一次 transfer 中送回。后者会把 BVH 构建放到首帧之前，可能拖慢首显，优先考虑后台完成后回填的派生缓存。

此派生缓存要纳入字节预算，正确区分 groups/drawRange 与 index 顺序；dispose wrapper 只解除自己的 tree，不删其他视图正在用的共享 CPU backing。当前 `setIndex:false`、`indirect:true` 均应保留。用相同相机射线对比命中 triangle、距离、hitId；导航淘汰及双侧销毁不能产生 detached buffer。该项与拾取责任域协调，避免两个实现者同时改接口。

### B3. 缓存预算与释放范围并不等于整个页面内存上限

`preparedModelCache.js:4–6` 预算为 224 MiB / 8 entries，字节算法只统计 payload 唯一 ArrayBuffer（`24–37`）；文件注释称整细胞约 177 MiB，这是源码注释，并非本轮测量。`CellScene.jsx:190,432–436` 另有最多八个活跃 presentation 的缓存；两个对比 CellScene 各有一份。base model 由场景和 loader promise 保持，已从 prepared LRU 淘汰也可能仍被活跃 presentation 引用。

因此 prepared `byteLength` 下降不等于 CPU buffer 已释放，更不等于 GPU 内存下降；shared arrays 也意味着不能直接把 prepared 与 presentation 字节相加。没有从源码证明永久泄漏：`CellScene.jsx:1192–1229` 在卸载时停止 loader/picking 并释放 view/base/renderer，detail view 淘汰也会 dispose geometry。

实现顺序：先增加只读诊断，按唯一 buffer 计算 retained CPU，另列 active vs evictable entry、在建任务、BVH、WebGL resource counts。再对非当前 presentation 采用字节 + 数量预算，当前视图始终 pinned；将 prepared payload 和 GPU presentation 所有权分别管理。任何策略都保留全部模型，可从原精度 payload 重建；禁止以降低细分或少展示结构满足预算。缓存策略会影响重访速度，需与内存收益一起衡量。

生命周期验证：单页连续跨全部九类模型和大叶级后回首页、对比两侧轮换、warm/cold 重访、缓存超限/超大条目、重复 clear/dispose、context lost/restored。记录唯一 buffers 的引用范围和 renderer 资源变化，而非单次 heap 噪声或 `.dispose()` 调用数。没有泄漏证据时只报告保留策略，避免称为泄漏修复。

### C1. 实例包装有确定但局部的冗余

`cellTransfer.js:178–185` 先 `new InstancedMesh(..., d.count)` 后立刻覆盖 `instanceMatrix`。已安装 Three 在构造时分配 `count * 16` Float32 并逐个写单位阵（`InstancedMesh.js:57,102–104`）。可用 count=0 创建 wrapper 后恢复真实 `count` 和 attribute，省去这份必丢的矩阵与循环；确认无 morphTexture 情形及 bounds 恢复。

`presentation.js:9` 使用通用 `source.clone(true)`。Three `InstancedMesh.copy:186–189` 再复制 instanceMatrix/instanceColor typed arrays。若结构实例矩阵和颜色在展示期间严格只读，可用定制节点 clone 保留独立 BufferAttribute wrapper 并共享数组。当前 CellScene 仅移动父 part，未修改 instance arrays；仍需全站 mutation 审核和两视图独立 dispose 验证。不应只给原 BufferAttribute 相同引用，因为不同 GPU 生命周期共享 attribute 对象更容易串状态。

不要省略 `userData` 和 material JSON 的独立 clone：Three MaterialLoader `210` 将 `json.userData` 直接赋给 material；`tests/prepared-model-cache.mjs:66–85` 明确要求嵌套数据保持独立。

### C2. 静态工厂导入范围与失败路径

`loadDetailModel.js:9` 静态导入 `detailModels`，后者 `1–14` 静态导入所有动物细胞器 builder，包括其静态数据依赖（例如 lysosome 的 cathepsin JSON、peroxisome contours）。所以加载植物/微生物/特殊细胞 detail worker 时，也会准备这组依赖。`specimenModels.js:2–4` 同时静态导入三种特殊细胞工厂。

可将“给已有 reference 做批处理”提取成轻量纯函数，并以准确 ID → 工厂表动态导入对应组。不改变物种分支，也不删叶级专用几何。真正下载、parse、evaluate 成本要由串行基线的模块数据确认；worker 生命周期缩短/重挂时 module cache 并不等同于复用上一 worker 的执行状态。

两个 loader 的 fallback 直接返回 build 对象（`cellLoader.js:18–21`、`detailLoader.js:9–13`），没有写入 prepared cache。因此 Worker 不可用时跨场景会反复在主线程构建。可在 fallback 成功且仍有活跃消费者时建立同样的 immutable CPU payload，但不能把活跃数组 transfer 掉，也不能直接保存含可变 `userData` 引用的 pack 结果而省略 worker 原来提供的 structured-clone 隔离。此路径优化应单独压测，避免正常 worker 路径为罕见失败路径承担复制成本。

## 实施与验收顺序建议

1. 根任务完成冻结基线后，先独立实施 A1、A2 和 C1 的 constructor 小项；每项保留独立 before/after 归因。
2. A3 先用可控 worker fixtures 验证并发/取消所有权，再接入双侧对比。B1/B2/B3/C2 等明确性能瓶颈和资源分布后再选，不把全部建议同时塞入一个改动。
3. 现有 `tests/models.mjs:264–295,322–341` 已涵盖 transfer 的全部 attributes/index/instances/material/transform/texture 与目录全部节点；现有 `tests/prepared-model-cache.mjs` 覆盖 LRU、共享数组、独立状态、取消。应补充上述变更的精确 bounds、资源唯一释放、同 key 并发 fixture；不是仅重跑现有测试就能证明新生命周期正确。
4. 精度门槛：冻结/候选完整 typed-array hashes 相等；材质线性颜色、ior、纹理完整字节和采样设置相等；model/presentation 的结构与解剖标签、parts/full、world transforms、bounds 等价；禁止只用文件体积或截屏近似替代这些检查。
5. 串行性能门槛：分开记录 cold build、pack、worker 等待/传输、unpack、presentation、主线程 long task、首个实际渲染、拾取索引完成和 warm 导航。增加 首页 → 探索 → 返回、对比相同冷模型、不同大模型、快速 A → B → A、超过 LRU 上限 的产品序列。根任务统一测量，避免多 agent 同时跑几何。
6. 可见验收：同固定相机/时间/模式截图，桌面与窄屏，所有九类根模型及代表性大叶级；剖面、拆解、标签、拾取、截图/视频导出、上下文恢复分别确认。性能测试和科学/像素验收是不同的门槛。

报告状态：源码候选已整理，所有性能收益和新验证均待根任务授权后的串行执行；本报告不构成系统优化完成或发布验收。

## 后续授权实施与定向验证

以上为保留的只读初稿。根任务随后明确授权在限定的加载文件与专用测试内实施，并在全站 CPU 基线完成后放行正确性验证。加载责任域于 **2026-10-04 08:22:39 UTC（北京时间 16:22:39）冻结**，供根任务串行正式 A/B 使用。

已实现：

- `buildCell.js`：三个线粒体从单个本次构建的模板 clone 独立节点/变换，共享只读 geometry/material；各级别 beads 在本次 build 内共享只读 primitive geometry。五处 beads 调用只设实例矩阵/颜色，没有后续变形，随机数调用与顺序保持原样。缓存只在本次 build 内，避免 worker transfer 后跨 build 重用 detached arrays。
- `cellTransfer.js`、`detailTransfer.js`：传输已有 geometry bounds 和 cell InstancedMesh bounds；默认 pack 不主动计算，保留 null 语义。新增显式 `prepareBounds` 选项，只在缺少 bounds 时调用原 Three 方法；unpack 创建独立 Box3/Sphere，typed arrays 与资源共享规则不变。
- `cell.worker.js`、`detail.worker.js`：显式启用 `prepareBounds`，将主线程接管时需要的扫描移入 worker；没有改模型、纹理、材质参数或精度。
- **未实施 A3/inflight**：跨 loader 共享 detail 后，原持有者 dispose 会终止其他消费者仍依赖的 worker。可靠实现需要一起迁移 worker 租约、排队、失败 fallback、取消订阅与 pending 任务所有权。本轮保留可实现设计，避免在没有统一调度器的情况下局部拼接共享 Promise。两个 loader 与 prepared cache 逻辑没有修改。

定向验证全部通过：

1. `node tests/model-transfer-bounds.mjs`：默认 null、原算法精确几何/实例 bounds、已存在自定义 bounds、原属性与实例矩阵字节、共享 arrays、独立 bounds 与释放生命周期、空几何含无限 box 的 structured transfer。
2. `node tests/prepared-model-cache.mjs`：原有字节预算、LRU、独立场景状态、惰性加载、缓存重用与过期取消契约通过。
3. `BIOSCAPE_LOADING_BASELINE_ROOT=/tmp/bioscape-systemwide-20261004-baseline-ae697be node tests/model-loading-reuse.mjs`：整细胞完整数据、材质/texture/instance/世界变换、groups/parts/full/anchors，与 cell、cytoplasm、mitochondria、mitoInner、atpSynthase 五个实际加载视图的 hashes 对冻结源全部相同；真实整细胞先清空 bounds，再按 worker 选项准备/transfer/unpack 后与原方法完整 bounds 相同；共享 geometry/material、独立实例/节点/userData 与唯一资源释放通过。

测试入口：把 `tests/model-transfer-bounds.mjs` 和 `tests/model-loading-reuse.mjs` 加入根任务维护的 runner。两者均可直接以 Node 运行；后者自行在临时目录 bundle 当前实现、运行后删除临时 bundle。`BIOSCAPE_LOADING_BASELINE_ROOT` 是可选的本轮冻结对照输入，常规测试不依赖 `/tmp` 基线存在。没有自行修改 runner。

验证过程说明：首次 reuse fixture 直接给细节入口传 base model，没有使用实际 `loadDetailModel`，触发原 presentation 对细节 hitId 的约束；已将 fixture 改为对应入口的真实 detail 加载，然后完成上述冻结对照。该失败来自测试构造，未据此修改产品 presentation。

未运行浏览器或全仓 check，未自行计时或宣称提速；正式基线/候选 A/B、固定视图、九根模型及各页面渲染和发布门槛仍由根任务统一处理。

冻结 SHA256：

| 文件 | SHA256 |
| --- | --- |
| `src/scene/buildCell.js` | `b44edb6a9841ef6d3d86fdc97490ddedb3912f5b385a507506de41fdb9080166` |
| `src/scene/cellTransfer.js` | `af9c149d65063a1efed55f35992213a2729e08a86d81caa4d7fc8b58ed34732f` |
| `src/scene/detailTransfer.js` | `015bd196212a7940f217e76587484885099a5acae4bccc272762677ff83bc051` |
| `src/scene/cell.worker.js` | `78edce4c581313abcbc3aad6b5ef084768747f464ad674549c2bfba77e662c9b` |
| `src/scene/detail.worker.js` | `4f4ccced66e65259ce5bb8b0e23f72c057c1b64af9e06fbb4db872b4181ae9ad` |
| `tests/model-transfer-bounds.mjs` | `e78c94674778492fcd78596d560d5e73b948c81e369341c9b3ff919764af157b` |
| `tests/model-loading-reuse.mjs` | `dbbb10d3588fb6a1f08f86e12fb8f2ee820e5bef5b50d190d44463fc74cb342c` |

## 真实冷加载发现与 detail box-only 修正

以下追加保留初版数据与判断，不把局部阶段下降当作整体加载完成。根任务的正式 Node AB/BA 已显示九个根模型的 main unpack + presentation 降低约 57–91%；cell 的 worker build + pack 净降约 6.4%，其余根模型略增约 0.4–2.9%。这些是阶段测量，**并不证明浏览器端到端冷首显改善**。

具体草履虫证据（原始文件：[cpu-comparison.json](evidence/cpu-comparison.json)、[structure-followup.json](evidence/structure-followup.json)）：

| 阶段/样本 | 基线 | 首版候选 |
| --- | --- | --- |
| Node pack 平均 | 1.319 ms | 27.364 ms |
| Node unpack + presentation 平均 | 11.130 ms | 1.168 ms |
| Node worker build + pack 平均 | 1175.985 ms | 1189.392 ms |
| 首轮浏览器 cold ready 两次 | 1141.7 / 1161.1 ms | 1159.6 / 1312.8 ms |
| 独立追加 cold ready 两次 | 1158.6 / 1152.4 ms | 1513.5 / 1181.1 ms |
| 四次 cold ready 中位数 | 1155.5 ms | 1247.0 ms |

追加样本中较慢候选的 `prepareMs` 达 1322.0 ms，基线为 993.2 / 979.5 ms；同一阶段另一次候选为 1031.1 ms。`CellScene` 在调用 `switchNode/makePresentation` **之前**记录 `prepareMs`，该数字包含 worker 启动/模块准备、构建、pack、传输/主线程调度、unpack 与缓存登记。它不单独测量 bounds；也不含其后的 presentation、首帧渲染与探针等待。

根任务随后报告生产包手动 cold 检查：草履虫候选 `prepareMs` 979.0 / 959.2 ms，基线 940.4 ms，约增加 20–39 ms，全部 `source=build`。这是根任务报告的准备阶段数字，不是本代理新计时，也不是完整 ready。

源码依据与归因边界：

- `makePresentation` 通过 `Box3.setFromObject` 做整体与 part framing；它需要 boxes，不需要 spheres。Box3 对隐藏节点也参与构图计算，因此不能简单按 visible 省略 boxes。
- 首版 detail worker 对全部 geometry 都计算 sphere。Three 的 `computeBoundingSphere` 会自行再做一次 position → box 扫描，然后再做 radius 扫描；即使已经计算 box，也合计三次顶点遍历。whole 模式隐藏的 `cutOnly`、section 模式隐藏的 `cap`、explode 模式隐藏的 `cap/assembledOnly` 的 spheres，在对应首帧并不需要。
- 可见 mesh 的 sphere 仍由渲染裁剪、默认排序或 raycast 使用，不能仅因 `frustumCulled=false` 判断它无需 sphere。延后会把这部分工作移回需要它的时刻，并不保证完整 ready 自动改善。
- `indexRepeatedGeometry` 当前仅由 `buildCell` 的 beads 调用，不在草履虫/肌纤维/红细胞 detail 构建路径，不能用其新 hash 算法解释这三个模型的冷加载尖峰。
- fresh worker 的 JIT、模块解析、GC 或调度可形成波动，但现有聚合字段没有将其分离。Node pack 的约 26 ms 增量不能单独解释浏览器约 180–330 ms 的准备阶段尖峰；不将假设当作已确定根因。

根任务据此授权的最小修正已完成：

1. 仅 `detailTransfer.js` 增加 `prepareSpheres` 可选 flag，默认值等于 `prepareBounds`，维持原 `prepareBounds:true` 的完整 bounds 语义。已存在的 sphere 无论该 flag 是否启用，仍按原值透传。
2. `detail.worker.js` 使用 `prepareBounds:true, prepareSpheres:false`，继续预备全部精确 boxes，缺失 sphere 保持 null，由原渲染/拾取路径按需计算。
3. `cellTransfer.js`、`cell.worker.js`、`buildCell.js` 保持首版已验证修改，本次未改。未修改过程代码、模型画质/精度、loader/cache 生命周期或其他执行文件。

定向验证结果：

- `node tests/model-transfer-bounds.mjs` 通过。新增的小模式覆盖缺失 sphere 保持 null、已有自定义 sphere 精确透传、box 与原 Three 算法一致、全部 attributes/index 的字节及类型、已烘焙几何变换/节点变换、材质线性颜色/ior、两个 unpack 的独立状态。后续原 lazy sphere 计算与参考结果一致。原默认/full-bounds/空几何/实例测试仍通过。
- `node tests/prepared-model-cache.mjs` 通过。
- 再次运行可选冻结源对照 `BIOSCAPE_LOADING_BASELINE_ROOT=/tmp/bioscape-systemwide-20261004-baseline-ae697be node tests/model-loading-reuse.mjs`，完整 cell 与五个实际视图 hashes、拓扑、精确 cell bounds、共享身份及唯一释放仍通过。
- 所改文件 `git diff --check` 通过。未新增 runner 入口，未执行任何新计时、浏览器或全仓 check。

**最终加载执行文件冻结：2026-10-04 08:59:04 UTC（北京时间 16:59:04）。** 下表覆盖本加载责任域执行文件，替代前一版执行哈希；上一版表保留作为历史证据。之后仅追加本文档，不再改执行代码或运行测试。box-only 的性能效果仍待根任务重新完成完整 ready、三结构 AB/BA、54 结构像素与最终 fullcheck 后判断。

| 文件 | 最终 SHA256 |
| --- | --- |
| `src/scene/buildCell.js` | `b44edb6a9841ef6d3d86fdc97490ddedb3912f5b385a507506de41fdb9080166` |
| `src/scene/cellTransfer.js` | `af9c149d65063a1efed55f35992213a2729e08a86d81caa4d7fc8b58ed34732f` |
| `src/scene/detailTransfer.js` | `8e394bc9b6e8769d19d4df3db3a1c662cf5cac08c29441edf8ff8022f7cb47d0` |
| `src/scene/cell.worker.js` | `78edce4c581313abcbc3aad6b5ef084768747f464ad674549c2bfba77e662c9b` |
| `src/scene/detail.worker.js` | `d0794d1526dc8ab08c512184cb57a83f8577e314390578db163ab1d5ba99af69` |
| `tests/model-transfer-bounds.mjs` | `149667f090c5f48c06007dfcb82bd42621c2271d921e2c6ffcdfad01b843048f` |
| `tests/model-loading-reuse.mjs` | `dbbb10d3588fb6a1f08f86e12fb8f2ee820e5bef5b50d190d44463fc74cb342c` |
