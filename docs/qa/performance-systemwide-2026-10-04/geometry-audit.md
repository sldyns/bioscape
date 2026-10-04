# 共享几何与构造工具只读性能诊断

日期：2026-10-04。参考冻结基线：`/tmp/bioscape-systemwide-20261004-baseline-ae697be`（ae697be）。本记录来自当前源码静态阅读；未实例化模型、计时、运行测试/构建或打开浏览器。候选收益均未测量，不能据此宣称性能验收通过。已阅读 `.github/CONTRIBUTING.md`。

范围：`src/scene/{structuralGeometry,specimenGeometry,exactGeometry,indexRepeatedGeometry,implicitMembrane,microbeGeometry}.js`、`src/processes/kit.js`，以及证明调用/所有权约束所需的共享构造工具。

## 推荐实施顺序

| 顺序 | 候选与源码位置 | 可保留的严格不变量 | 覆盖与预计收益类别 |
| --- | --- | --- | --- |
| 1 | `implicitMembrane.js:150-178`：`splitSection` 对距离严格同号的三角形直接 append，保留原裁剪路径处理其余情况 | 原顶点顺序、属性字节、每侧三角形序列、索引展开结果不变 | ER、Golgi、叶绿体、植物细胞器、微生物核孔、酵母连接、噬菌体、溶酶体等切片构造 CPU |
| 2 | `indexRepeatedGeometry.js:33-39`：字节哈希桶 + 完整碰撞比较替换字符串键 | 原 attribute 对象与 buffer 不动；重复顶点仍指向首次出现的原始 vertex；索引、groups、drawRange 不变 | `buildCell.js:141-167` 的重复二十面体构造；减少临时字符串、子数组视图、Map 键分配 |
| 3 | `regulation/geometry.js:43-44` 与 `chromatin/geometry.js:36-39`：构造时缓存固定截面 sin/cos | 分别使用各自原表达式、Float64 存储；保留原采样、切线、乘加顺序和 normals/bounds | 多个调控与染色质过程，减少逐帧三角函数求值 |
| 4 | `specimenGeometry.js:84-113`：已知尺寸的 typed arrays 直接填充，移除逐顶点临时 Vector3 和动态数组增长 | 112×48 分段、参数端点、Float32 舍入点、索引顺序、`computeVertexNormals` 均保持 | 所有 `shell` 用户；减少构造分配和复制 |
| 5 | 局部不可变 primitive 的构造级复用；首先 `buildCell.js:141` 按 detail 复用二十面体 | 几何数组完全一致，实例变换/颜色/RNG 消耗顺序保持；cache 生命周期不越过单次 build | 细胞 beads 的构造与上传资源数；微生物/水分子模板需额外变形所有权审计 |

顺序依据是覆盖面、实现可验证性和源码中的重复工作，并非计时排名。最先应由统一测量进程比较候选 1、2、3，不并发跑性能采样。

## 1. 切片：保留边界行为的同侧捷径

`splitSection` 目前每个三角形已算好三个 `signedDistance`，随后固定执行两侧 polygon 裁剪循环。完全位于切面某一侧的三角形无需构造 polygon：

- `d0 < 0 && d1 < 0 && d2 < 0`：按原顺序 append 到 bucket 0。
- `d0 > 0 && d1 > 0 && d2 > 0`：按原顺序 append 到 bucket 1。
- 含零值、跨面或不可比较值的情况保留现有完整循环。

必须用严格不等式。现算法把正零、负零均判定为两侧边界内部；混有零的三角形可能保留重复交点/退化三角形，不能把这些情况直接吞并或清理。直通路径仍执行同一个 append，不改变后续 `exactIndexGeometry` 的首现索引和属性压缩。

验证：对冻结旧实现与新实现输入相同独立几何，比较每侧所有属性的位模式、索引、groups/drawRange；专门覆盖全正、全负、单点/单边在平面上、全零、`-0`、indexed 与 non-indexed。真实几何覆盖 ER、Golgi、chloroplast、nucleus 孔边、yeast bud、phage。固定镜头比较内外膜、切口与 cap 开关，不能只检查三角总数。

附带低风险候选：`implicitMembrane.js:40-43` 的 y 项只依赖 sample 与 y，却在每个 z 层重算；可像 x 项一样预计算 Float64 `ySquared`。保持 `1 - xSquared[x] - ySquared[y] - zSquared` 的原减法顺序，以及 field 的 Float32 比较/写回顺序。禁止改解析式、resolution、iso levels、normal 生成或 MarchingCubes 容量。已有 x 项缓存无需再做。

## 2. Exact indexing：替换键生成，不替换语义

`indexRepeatedGeometry` 当前对每个 attribute、每个 vertex 做 `subarray(...).join(",")`，再合并字符串键。可用数值哈希定位桶，但必须在桶内逐字节比较全部 attributes 后才宣布相同；哈希相等本身不代表顶点相等。

现有 `exactGeometry.js` 已实现位置/法线/UV 的 Float32 位哈希和完整比较，但它会压缩并替换 attribute buffers，且仅接受三种属性。因此**不能**直接用它替换 `indexRepeatedGeometry`：后者的契约和 `tests/exact-vertex-index.mjs` 明确要求原 attribute 对象保持不动，也接受其他非 interleaved/非 instanced、长度一致的属性类型。

新实现应保持：

- 已 indexed/morph/interleaved/instanced/count 不匹配输入仍走原 bypass。
- 按原顺序访问全部属性字节，保留不同法线、UV 缝、signed zero、非标准 Float32 位模式及额外属性。
- 索引仍指向第一次出现的原 vertex，使用原始 count 选择 Uint16/Uint32；没有重复时不新增 index。
- groups、drawRange、attribute identities 与原数据不变。

验证：现有 `tests/exact-vertex-index.mjs` 覆盖 detail 0–3、attributes identity、逐角字节、UV/normal seam、signed zero 和 worker pack/unpack。补充不同 typed-array 属性、属性 byteOffset、哈希碰撞、无重复与 bypass 输入是有意义的针对性验证。`tests/model-refinements.mjs:25-47` 已有按三角角点展开后 SHA256 的比较模式。

## 3. 固定动态管道截面的数学常量

两个 `dynamicTube` 都有固定 `sides=8`、构造后不变的 radius，却在每个轴向采样点、每帧重算八组 trig。分别把 `radius * Math.cos(angle)` 与 `radius * Math.sin(angle)` 放在 helper 构造阶段的 Float64Array 或普通 JS 数组即可。

这两个模块的 angle 算术写法不同（`(j / sides) * Math.PI * 2` 与 `(j * Math.PI * 2) / sides`），不能统一重排。两个模块的切线计算也不同：一个用离散相邻 sample，另一个用 t±0.0001。应各自局部缓存，不能以复用 helper 为由合并生物过程或改变曲线取样。

验证：同参数/进度序列下逐帧比较 position、normal、index 的原始字节、bounding box/sphere 数值、mesh transforms。包括顺序播放、重复同一 progress、逆序 seek、参数变化。现有各模块 science tests 与 regulation/operons 的 duplex 几何回归继续保留。固定镜头动画验证核酸走向、配对、切线翻转处和隐藏/显示端点。

## 4. 固定拓扑表面直接填充

`specimenGeometry.surface` 每次创建 113×49=5,537 个 Vector3 后展开到 JS arrays，再转换为 Float32。单次 shell 固定构造四个这样的 surface。可直接填充已知长度的 Float32 position/uv 和 Uint16 index（当前最大 vertex index 5,536）。保留表面函数完全相同的公式和数学运算顺序；现有 `surfacePoint` 导出行为不必改变。

表面数、索引数（每面 32,256 个 index）、分段、弧度端点、内外壁半径、正常/透明材质、cap/cutOnly 标记都不应改变。不能用降低分辨率、analytic normals 或圆球近似 superellipsoid 取代当前计算。

验证：旧新 `shell` 全部 child 按原顺序比较几何字节、材质属性、标签。覆盖 exponent=1 的 yeast/vesicle、exponent=0.4/0.42 的植物壁膜、paramecium 后续形变和裁剪。

## 5. 几何与材质复用的实际边界

`sceneKit()` 已在一个过程模型内部共享 sphere/cylinder，并按 color/options 缓存材质。`energy/detailKit.js:64-78` 已为 helix/sheet 复用基础几何。这些已有工作不应计为本轮新收益。

`buildCell.beads` 当前五次调用重复创建 primitive，其中膜正常面、切口和 cap 使用同一 detail=1。可单次 build 建一个 Map<detail, geometry>，确保消费者不修改 geometry。共享几何不会改变 random 调用顺序：生成 index 过程本身不耗用 RNG，实例矩阵和 instanceColor 应逐字节一致。`cellTransfer` 的几何去重和释放必须继续有效。

`specimenGeometry.ball` 与 `structuralGeometry.ball` 每次新建 SphereGeometry、material；局部静态水分子、离子、lipid 头部可从模板复用，但**不可全局直接共享球体**：

- `microbeGeometry.js:236-259` 的 nucleolus 会原地修改 ball 返回的 position 与 normal，并修改 material。
- `parameciumDetails.js:30-37` 会修改 shell 子几何。
- `plantDetails.js:66-85` 会烘焙并形变 vacuole geometry。
- `yeastDetails.js:20-40` 会消费/切片并 dispose 局部 geometry。

这些调用必须独占几何，或在精确定位的写入前 clone。材质共享同样要排除修改 roughness/clearcoat/opacity 的分支。缓存生命周期应限制在模型构造，不跨 worker transfer、上下文恢复和已释放的模型。

`detailModels.js:41-137` 已按完整 appearance、属性格式与 hit/cap/cutOnly 等标记分桶，复制原几何并烘焙 matrixWorld 后 merge。因此，在 detail 构造阶段共享静态球体主要节约原始构造和临时驻留，不会自动降低最终 merged buffer 的大小或 draw calls。不要把源模板复用宣传为渲染 draw-call 收益。改成 InstancedMesh 还会涉及 packDetail（只支持 Mesh）、命中语义、透明排序与导出，当前不推荐把它作为第一批低风险改动。

## Bounds 与释放：应保留的约束

- 动态 geometry/InstancedMesh 的 bounds 仍有 culling、raycast、测试用途。即使一些 mesh 的 `frustumCulled=false`，不能直接去掉 computeBoundingSphere/Box。`sceneBounds.js` 在自动取景时重新遍历实际可见几何；若优化此处必须保留隐藏分支、零 opacity、instance 变换及 geometry 原地编辑语义，现有 `tests/process-bounds.mjs` 已覆盖这些情况。
- 可以另外测量把已知不变 primitive 的 bounds 预先计算或按 attribute version 缓存，但代码允许修改 position 后不增加 version 的场景，不能仅凭 `.version` 判定不可变。
- `ProcessScene.jsx:20-38` 释放 geometry/material/texture，未调用 InstancedMesh.dispose；`CellScene.jsx:415` 和 `cellTransfer.js:227` 已调用。已安装 Three 的 `WebGLObjects.js:70-78` 通过对象 dispose 事件删除 instanceMatrix/instanceColor WebGL attributes，而其 renderer 级 dispose 只重置 updateMap。建议运行时负责者核查反复进入退出后的 GPU buffer 释放，并在 teardown 中显式处置实例对象。该源码差异尚不是已测得内存泄漏结论。

## 接受标准与本记录状态

候选实施后，先由一个测量进程顺序执行冻结基线与新实现：构造 CPU、峰值/稳态内存、worker 传输 bytes、首次可见、持续播放 frame time 分开记录。比较同模型、同参数、同采样进度、同相机、同画布尺寸，禁止用 lower DPR、较少分段或隐藏结构换取收益。

几何型改动要求展开索引后的所有 attributes 位一致；纯构造/索引改动还须保持 triangle order、groups、drawRange、hitId、cap/cutOnly 与材质。随后运行针对性回归、完整项目必需检查及浏览器固定镜头/往返/条件/时间轴/语言/导出验证。按贡献指南，数据测试不能替代视觉验收。

当前状态：只读诊断完成；产品修改、性能计时、测试、构建、视觉验收均未执行。本文件是唯一写入的文件。

## 实施与验证补记（同日，保留上述只读初稿）

收到集成负责者授权后，仅实施候选 2、3；splitSection、surface、beads cache、bounds 与释放建议仍由对应负责者决定，本分支未修改。实施内容：

- `indexRepeatedGeometry` 改为 Uint32 开放寻址表；FNV 字节 hash 加 avalanche 仅定位候选，所有匹配仍必须逐属性、逐字节相同。表值保存第一次出现的原始 vertex+1，不压缩或写入 attribute buffers。
- 两个 dynamicTube 分别缓存其原表达式算出的 radius×sin/cos 到 Float64Array；没有合并两种采样算法、改变浮点运算顺序或删除 normals/bounds 更新。
- `tests/exact-vertex-index.mjs` 追加冻结 ae697be 字符串索引 oracle，比较 first representative、完整底层 buffer（含 view 外字节）、attribute 对象、groups/drawRange；覆盖 signed zero、两种 NaN payload、Float64/Int16 normalized 属性、bypass 与无重复输入。固定的两组八字节输入确实产生同一个完整 32 位 hash `3079002137`，测试使用独立 BigInt 算术复核碰撞，确认不会误合并。
- 新增 `tests/dynamic-tube-exact.mjs` 和 `tests/fixtures/dynamic-tube-baseline-ae697be.mjs`。fixture 从冻结目录提取两个旧函数后仅格式化，永久测试运行不依赖临时目录。两个实现各自创建独立几何/输入，216 个姿态覆盖三种曲线、近 z 轴切线、零半径、端点塌缩、正向播放、反向及重复 seek；比较所有属性原始字节、索引、groups/drawRange、box/sphere。

已先独立运行 exact indexing 和动态管道比较，均通过。随后相关既有回归串行运行，完整输出保存在 `evidence/geometry-correctness.log`；最终结果以补记下方完成记录为准。未自行运行性能计时、浏览器、全仓检查或构建。

测试接入：现有 `scripts/verify.mjs` 已含 `tests/exact-vertex-index.mjs`；由 root 单写 runner，需将 `tests/dynamic-tube-exact.mjs` 放在该测试附近。fixture 无需单独作为 test entry。

冻结源码 SHA256：

```text
db3e166dd178c88a35775a002d75bcbd21c4c842ce4d1b99cb1708ffdddff5b1  src/scene/indexRepeatedGeometry.js
14001d6200fe207d1d5b74fe29daf4c29b91da9cb3698b8923ca4ff8e32708bd  src/processes/modules/chromatin/geometry.js
71d2ae5736c26ad1f350e9f989508b4b389e6e1f6929bddf18276518d3bcc297  src/processes/modules/regulation/geometry.js
07b900d8f1283226d570ff1575563a06f53e89f5ca784b5e2d0a9a0ec15310d8  tests/exact-vertex-index.mjs
7b8c8f7104269df7ea098a2a273849a4990666b991d49b43b1279e12b00c6e5b  tests/dynamic-tube-exact.mjs
d3acfd1ba5bbefdaf0f26ced3f2d87ae527a3d13e288aded1dd98ac13f129f67  tests/fixtures/dynamic-tube-baseline-ae697be.mjs
```

完成记录：8 个定向入口全部通过（exact-vertex-index、dynamic-tube-exact、regulation science/duplexGeometry、chromatin science、operons science/duplexGeometry、process-bounds）。本轮 6 个源码/测试文件已单独格式化；限定文件 `git diff --check` 无输出。代码现冻结，等待 root 统一串行 A/B 与后续完整验证；这些正确性结果不等于已确认性能收益。
