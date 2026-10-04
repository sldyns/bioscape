# 全站过程共享路径审查 · 2026-10-04

范围：`ProcessExperience.jsx`、`ProcessScene.jsx`、`playbackClock.js`、`annotationDom.js`、`labelLayout.js`、`sceneBounds.js` 及过程调用 `sceneCapture.js` 的路径。适用于通过正式过程播放器进入的 84 个过程；不代表 84 个过程已经逐一运行验收。冻结对照为 `ae697be`，路径 `/tmp/bioscape-systemwide-20261004-baseline-ae697be`。本节行号指实施前的工作区源码。

已读 `.github/CONTRIBUTING.md`。审查阶段仅做有界源码检索；未运行模型、测试、构建、计时或浏览器，避免干扰 root 的全站串行基线。下述收益是代码路径推断，没有毫秒/百分比承诺。

## 已有优化，不能再次计入收益

- `ProcessScene.jsx:177–178,223–225,584` 已在隐藏标签时完全跳过准备/投影，并在重新显示、语言和字体变化时刷新尺寸。
- `annotationDom.js:36–42` 已缓存文字尺寸并分批读取；正常相机运动没有每帧 offsetWidth/offsetHeight 的问题。
- `playbackClock.js:17–35` 已分离显示姿态与 30ms React 发布；`:50–69` 已去重相同进度/参数的 model.update。
- `ProcessScene.jsx:233–248,273–275` 已在暂停时 demand render，且只在姿态改变时显式更新 scene 矩阵。
- `sceneCapture.js:429–435,461–507,613–617` 已复用捕获目标、像素缓冲、导出相机与可选 frame canvas，保留单调 renderer frame。不能称作仍在每帧分配全部目标或翻转拷贝每行像素。

## 可行动候选

| 顺序 | 路径及机制 | 可保留的语义 | 风险/收益范围 |
| --- | --- | --- | --- |
| 1 | `ProcessExperience.jsx:182–194,271–281`：每次 progress 发布重新计算 conditionNote 和 related | 前者只随 id/parameters/lang 改变；后者只随 root/definition/stageIndex/parameters 改变 | 低；所有正式播放器的 React CPU/分配，非模型 GPU 收益 |
| 2 | `ProcessScene.jsx:20–38`：未向 InstancedMesh 发 dispose | 每个实例对象 dispose 一次，几何/材质原有 Set 去重保留 | 低；导航/上下文恢复资源回收，非活动帧率收益 |
| 3 | `annotationDom.js:7–35`：每可见帧重建编号数组、两次 Unicode 分类及测量键；`ProcessScene.jsx:187–220`：inactive 仍投影，位置/可见性重复写入 | 每帧检查真实文字、active 和 source 顺序；只复用相同语义结果，投影和坐标不降频、不取整 | 低至中；标注开启时 JS/GC/DOM 调用减少；浏览器布局收益需实测 |
| 4 | `ProcessScene.jsx:237–243` 与部分 model.update 内部世界矩阵刷新重复 | 几何变化→一次矩阵刷新→锚点发布的显式约定 | 中；命中相应模型才有收益，不能直接给所有模型关 matrixAutoUpdate |
| 5 | `ProcessScene.jsx:304–314`、`sceneBounds.js:7–41`：启动多姿态采样，静态顶点也逐次扫描 | 精确保留当前 bounds 算法、采样集合与相机距离 | 中高；冷启动热点，不能把局部包围盒变换替代逐顶点精确结果 |
| 6 | `ProcessScene.jsx:512–532`：捕获矩阵刷新未消费 matricesDirty；视频每帧临时 seek 后立即恢复 | 单帧 API 必须恢复进度、参数、几何、标签、世界矩阵 | 小项低风险；批量导出会话为高风险独立方案 |
| 7 | `playbackClock.js:27,35`→`ProcessExperience.jsx:277`→`ProcessScene.jsx:227–231`：推进时钟和绘制分别 RAF | 同一显示周期先推进再绘制，仍保留完整 60–144Hz 姿态及暂停/尾帧 | 中；只在 profile 证明调度有意义时做，不声称现有稳定播放双倍渲染 |

### 1. React 派生结果与子树

`getConditionNote` 在 `conditionNotes.js:1670–1681` 分配 normalized、遍历全部 rules 并为匹配规则展开 when；结果与连续 progress 无关。`groupProcessStructures` 在 `relationships.js:1055–1078` 深拷贝关系记录/路径、过滤条件，再对每个 stage 过滤 locations；在同一 stage 内结果不变。可以使用完整依赖的 useMemo 缓存两者，向 related 传当前 stage.at，保留 `findLastIndex(progress + 0.00001)` 的边界规则。不要只依赖 processId，root/context/parameters 都有科学含义。

完整 JSX 仍在每次 UI 发布重建（`ProcessExperience.jsx:288–653`），包括步骤、图例、条件选择、参考文献和关系树。后续可拆分稳定 props 的 memo 子组件，让时间线保持当前刷新频率；这是第二阶段，不能单用 React.memo 包整个 ProcessScene 然后忽略 progress（ThumbnailStudio 没有 progressSource，`ThumbnailStudio.jsx:60–68`）。App `receiveProcessState` 只写 ref 并重置 200ms URL timer（`App.jsx:164–184`），因此这里没有证据支持“每帧整棵 App 重渲染或写历史”。

验证：同一 process/root/condition 内 100 次 progress 发布只计算一次 conditionNote；related 只在 stageIndex 或条件改变时重算。逐一比对所有 stages 的 `at-0.00002, at-0.00001, at, at+0.00001`、0/1、随机逆向 seek 的 related JSON；覆盖不同 root context、条件切换、语言切换。React Profiler 比较玩家提交时长/分配；时间线值、ARIA 文本、章节自动滚动与 URL 恢复必须一致。

### 2. InstancedMesh 生命周期缺口

`disposeScene` 只释放 geometry/material/texture，而 `node_modules/three/src/renderers/webgl/WebGLObjects.js:22–38,70–78` 在 InstancedMesh 的 dispose 事件里释放 instanceMatrix / instanceColor WebGL 属性。`InstancedMesh.dispose()` 还释放 morphTexture。`CellScene.jsx:415` 和 `scene/cellTransfer.js:227` 已采用对象级 dispose。过程清理应补相同行为，且仍由现有 disposed guard 保证整场景只清理一次。renderer.dispose 的内部更新 WeakMap 重置（`WebGLObjects.js:64–67`）不能替代对象级 buffer 删除。

验证：真实 InstancedMesh 搭配记录 dispose 事件的 renderer adapter，覆盖两个实例对象共享 geometry/material、普通 Mesh、重复 cleanup、effect 重建与错误清理。每个 instance 对象恰好一次，共享 geometry/material/texture 恰好一次；随后浏览器进行进入/返回多轮，记录 WebGL createBuffer/deleteBuffer 的 instance 属性差额及资源平台走势，不能只看 renderer.info.memory.geometries（它不代表 instance buffer）。

### 3. 可见标注的完整失效边界

编号按 sources 原顺序产生，放置按已排序的 labelItems 优先级执行；必须保留这两个顺序。缓存必须读取每个 source 当前语言/回退语言解析后的字符串和 `active !== false`，不能仅比较 text 对象引用，多个模型会替换或原位修改文字。每帧从真实 active 集合累加编号，因此前面标签的开关仍会更新后续数字。每个 item 的准备结果键包括解析文字、active、当前编号和 viewportKey；字体、语言/显示开关现有 invalidation 将 measuredKey 清空，第二轮度量即使准备未重做也必须执行。

已准备且语义完全相同的 item 可跳过 textContent/class/aria 的读取和比较；该 DOM 由播放器独占，hover/focus 只修改独立 highlighted class。inactive 可在投影前跳过，但仍更新 marker/line 为 hidden。坐标提交比较原始数值，相同才略过；leader 起点必须独立于 marker 终点比较，不能因文字位置没变而漏跟随锚点。重新显示沿用原尺寸失效路径。未授权改变 placeLabel 候选顺序、碰撞间距、优先级或浮点坐标。

进一步的 `labelLayout.js:19–62` 候选数组/每次尝试 rect 分配可用固定表及每 item scratch 规避，但不是本轮最小改动；occupied 中不能复用同一个被后续标签覆写的 rect。仅 camera/所有 anchor/metrics/active 都未变时才能跳过整个放置，不能按 pose 未变跳过 orbit。

验证：现有 `tests/render-updates.mjs`、`process-label-layout.mjs`、`process-annotation-visibility.mjs` 加精确 DOM 快照。覆盖中英回退、短符号/长文字互换、Unicode 5/6 code point 边界、原位 text 变更、active 前缀重编号、优先级 items 排序、相同 marker 不同 aria 文字、隐藏期间 pose/lang/font/viewport 变化、显示首帧、离屏后返回、仅 anchor 变化。计数稳定可见帧的写入/投影与 allocation；用原始分辨率截图比对，JS getter 减少不能直接算作 Layout 时间收益。

### 4. 矩阵所有权

当前 `Object3D.updateMatrixWorld()` 对默认 matrixAutoUpdate=true 的对象仍 compose、标脏并递归所有 children（`Object3D.js:1107–1160`）。operons/lac `:292–304`、trp `:411–432`、bacterialExpression `:474`、secretion `:802` 和 phage `:600` 在 model.update 中已刷新树以获取真实表面锚点，之后共享 render 再刷新。synapse 的 `:337` 位于 create 阶段，不应误计为每帧重复。

候选是显式报告模型已完成当前树矩阵，或将 updateGeometry/updateLabelAnchors 分离交由共享层统一刷新；必须先确认后续锚点函数不再移动对象。bacterialCore `labelAnchors.js:7` 还逐锚点向上更新祖先，可在同一明确约定下复用，但不能仅删除这些调用。验证全 pose/condition/world matrix/label 与 frozen 相同，含父场景非单位变换、随机 seek、bounds 启动和 capture/恢复；计数 compose/世界矩阵乘法，不能外推为 GPU draw 减少。

### 5. 启动 bounds

采样集合是 9 个等间距值并入阶段 at；每次 model.update 后 bounds 做完整 world matrix 更新，普通 Mesh 遍历所有 position 顶点，InstancedMesh 重算 geometry.boundingBox 再扫所有实例。warm entry 可考虑有界缓存最终 bounds，键必须含 definition/version/root/全部 parameters，且不可共享可变模型或丢失退出释放。冷启动可对明确不可变的几何/变换子树缓存精确世界 bounds；需要明示不可变/失效约定。

**不能直接按 BufferAttribute.version 缓存。** `tests/process-bounds.mjs:24–30` 明确要求 `setMatrixAt` 或 `position.setX` 后即使没有 needsUpdate 也反映变化。将普通 Mesh 的本地 AABB 变换到世界空间会比逐顶点更宽，改变 framing，不能作为等价优化。减少采样数量也未经全轨迹证明。验证应比较全部 process/root/condition 的精确 sampled bounds、fittedDistance、各 aspect 和导出相机，保留隐藏/透明材质/退化实例/未标版本顶点写入这些反例。

### 6. 捕获与上传

每次临时 capture seek（`:523–530`）执行一次目标 model.update、scene matrix 更新，再执行一次恢复 model.update、scene matrix 更新。恢复可能再次写动态 attribute / instance buffers。同步单帧 API 的 finally 保护必须保留；不能为了视频直接删恢复。可先在成功矩阵更新及恢复完成后正确清除 matricesDirty，避免随后同姿态 capture/render 再刷新；异常恢复失败不得谎称 clean。

批量视频若取得独占、明确可取消的 capture session，可保持导出模型在连续导出姿态，结束时恢复一次；它需要暂停 live renderer，约束 camera/condition/导航/异常/context loss 并保证任何释放路径恢复，或持有独立 export model（有内存成本）。这属于独立设计，非本轮授权代码。

`sceneCapture.js:568–598` 的 GPU readback 与每像素 alpha mask 仍是导出热点候选。mask 以每 cell 的任意 alpha>8 决定占用，可按 cell 扫描并在找到首个命中后停止，保持完全相同 integral/边缘 cell；或复用已清零 typed arrays。没有证据支持降低导出尺寸/抗锯齿/alpha 精度。过程 getLabels 每次分配 vector 后 drawCaptureLabels 又 clone（`:491–501` 与 `sceneCapture.js:293–295`），可后续让 capture 私有 scratch 复用，不能改 live label.position。

验证：正常、取消、抛错、context loss 的 capture 前后 progress/parameters/所有 matrices/labels/renderer 状态一致；同一原始像素包括透明背景、不同 turn/aspect/labelScale。recording 后下一次 live draw 必须恢复原姿态且 buffer upload frame 单调；现有 scene-capture / scene-capture-browser / scene-capture-performance 测试不能只跑纯数据部分。

## 实施授权与验收状态

root 在完成上述源码审查后授权最小改动：React 派生结果 memo、InstancedMesh 释放、可见标注语义缓存/inactive 投影/相同值 DOM 提交去重。仅拥有 `ProcessExperience.jsx`、`ProcessScene.jsx`、`annotationDom.js` 和新增专用测试；其余候选留给 root 按实测选择。

当前仍禁止执行测试/构建/模型实例化/计时，待 root 解除基线隔离后运行验证。不存在已验证性能数字、发布或部署结论。

## Resolutions · 获准实施后的修正与结果

root 完成全站基线后已解除本 agent 的专用正确性验证隔离；仍未运行独立 timing、浏览器或全仓 check。

1. React 采用完整的语义依赖缓存：conditionNote 为 id/parameters/lang，related 为 root/context definition/stageIndex/parameters。**修正初稿的 stage.at 建议：实际调用继续传本次真实 progress。** 当相邻 stage.at 的间距小于 0.00001 时，将已选阶段 at 再加 epsilon 可能跳到下个阶段；使用真实 progress 保留原先规则，stageIndex 足以判定是否重算。代码有说明，专用测试包含 0.15 与 0.150005 的邻近边界。
2. `disposeScene` 补充每个 InstancedMesh 的对象级 dispose，保留共享 geometry/material/texture Set 去重及整个 effect 的 disposed guard。
3. 标注缓存按上述语义边界实施；保留文字准备/尺寸测量两轮。inactive 项不做投影，active 项每次绘制仍投影，坐标与可见性只在值变化时写 DOM。没有修改 placeLabel、RAF 频率、playbackClock、矩阵或导出路径。

新增 `tests/process-shared-performance.mjs`（root 接入 `scripts/verify.mjs`）：

- 实际 ProcessScene effect 配记录 DOM、真实 Three 相机/矩阵/几何与 WebGLObjects 属性生命周期。4 次稳定 redraw：2 个 active 标签共投影 8 次、inactive 不投影、文字 DOM 读取/写入及尺寸读取均为 0；这只是操作次数，不是正式计时收益。
- 覆盖原位文字更新、source 编号与 priority 放置顺序、Unicode 5/6 code point、短符号/长文字互换、active 重编号、锚点移动、出入视口、隐藏期间语言回退/字体/resize/active 改变、重新显示与新挂载场景的完整 DOM 快照相同、可见字体单独失效。
- 真实 WebGLObjects 为两个共享几何/材质的实例网格登记 4 个 instanceMatrix/instanceColor 属性，cleanup 后全部删除。两实例、geometry、material、texture 各一次 dispose；第二次 cleanup 不多删，renderer 也仅一次 dispose。
- 实际 ProcessPlayer hooks 和真实 relationship/condition helpers；100 次同阶段进度不重算派生结果，近邻 epsilon 边界、逆向 seek、尾帧、语言/条件/root context 均与未缓存 helper 输出一致。

验证结果：新增专用 2 项 PASS；`tests/render-updates.mjs`、`tests/process-annotation-visibility.mjs`、`tests/process-playback.mjs`、`tests/process-label-layout.mjs`、`tests/process-session.mjs` 全部 PASS；3 个源码及专用测试经 Prettier，`git diff --check` PASS。测试过程中修复两项 fixture 问题：relationship 的扩展名省略需要经 esbuild 加载；多 fixture 切换后恢复原 RAF 适配。未因此修改产品语义。

源码冻结 SHA256（root 后续统一全站像素、真实 DOM、浏览器及安静 A/B）：

| 文件 | SHA256 |
| --- | --- |
| `src/processes/ProcessExperience.jsx` | `940c458045efbc20aaf9a69ff0b5c868e30b4bdfb329919b249db586243b7c5d` |
| `src/processes/ProcessScene.jsx` | `50b8f8a85ee1767a95fb9c9879544da5842a5f5be5c45c225defc488ca635dd3` |
| `src/processes/annotationDom.js` | `614401ff99f58c6da519e3bf18e5ec9122f9d9faf6494e7a1236280cbac80b38` |
| `tests/process-shared-performance.mjs` | `d1fd899168d3745c523f94a8b0bdb8f51a13bcafa9985979396afe646d37ccd4` |

尚未验收：真实浏览器 DOM/字体/交互、全过程冻结原始像素、GPU 资源多轮往返、正式速度和内存收益；这些由 root 统一执行。没有提交、推送或部署。
