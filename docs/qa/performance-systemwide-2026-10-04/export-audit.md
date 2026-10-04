# 截图、影像工作台与比较导出性能只读审查

日期：2026-10-04。审查基线：`ae697be`，冻结目录 `/tmp/bioscape-systemwide-20261004-baseline-ae697be`。审查时当前 HEAD 为该提交，`src/studio`、`src/scene/sceneCapture.js`、`src/compare` 没有工作区差异。

范围：上述三组代码；仅为确认调用约定，查看了 `CellScene.jsx`、`ProcessScene.jsx`、`App.jsx`、本地 Three 实现与既有测试源。已阅读 `.github/CONTRIBUTING.md`。本轮仅写本文，没有运行模型、浏览器、计时、测试或构建，没有修改产品代码、提交、推送或部署。以下优先级是下一轮实现/测量的排序，不是已测得的性能提升。

## 结论与已成立的边界

没有发现同一场景帧的冗余第二次 GPU 读回。`sceneCapture.js:566–575` 每次捕获执行一次场景绘制、一次输出颜色/翻转通道和一次 `readRenderTargetPixels`；`compare/capture.js:81–101` 两次调用分别属于左右模型，且先复制左帧，再捕获右帧。不能通过省略一个读回来保持比较内容完整。

现有实现已经避免多个常见的大分配：

- 同尺寸复用两个 render target、一个 `ImageData` 和指向同一 backing store 的 `Uint8Array`，输出 shader 负责 Y 翻转，无额外 CPU 行翻转或第二个全尺寸像素数组（`sceneCapture.js:461–496`）。`setSize` 每帧调用并不意味着每帧重分配，本地 `node_modules/three/src/core/RenderTarget.js:284–303` 仅在尺寸变化时 dispose。
- Studio 的静态预览、播放预览、PNG 与视频路径均传 `reuseFrame: true`（`Studio.jsx:239–244,301–304,357–362`）；比较捕获的 `WeakMap` 也复用复合画布（`compare/capture.js:4,61–66`）。默认独立截图仍创建独立 canvas，这是快照不被后续捕获覆盖所需的约定。
- 预览已经按实际可见区域限制像素尺寸，上限长边 960，导出仍为完整尺寸（`previewPlayback.js:93–100`）；暂停只绘制待处理首帧/seek，不运行持续 idle 捕获（同文件 `24–61`）。不能把这些现有机制再次报告为本轮收益。
- 静态结构环绕已复用 live shadow，临时几何姿态使用独立且复用的 shadow allocation（`sceneCapture.js:508–560`）。结构原视图的 fitted distance 已有缓存（`CellScene.jsx:288–306`）；过程包围盒八角点在装载后预先计算（`ProcessScene.jsx:345–379`）。未见每次截图重跑整段过程边界采样的路径。

## 优先级排序

| 顺序 | 优先级 | 候选 | 源代码证据 | 最小安全改变 | 收益与风险边界 |
| --- | --- | --- | --- | --- | --- |
| 1 | P2 / 低风险 | 相同有效 preview scale 的 ResizeObserver 更新仍重捕获 | `Studio.jsx:207–219,222–290`；`previewPlayback.js:94–100` | 在 effect 外得到数值 `scale`，effect 依赖该数值而非整个 `previewBounds` 对象；保持尺寸、preferences、lang、refresh、exportBusy 等实际失效条件 | 当 960 像素上限或另一轴已成为约束时，外框改变但 scale 完全相同，仍会 dispose 时钟、标记 busy、调一次完整捕获。可省掉整帧工作；仅影响这类 resize，不能宣称稳定播放 FPS 提升。不要仅按四舍五入后的 canvas 尺寸缓存，因为精确 scale 同时影响文字与逻辑布局。 |
| 2 | P2 / 高价值待测 | 标注占用网格与动态规划 scratch 每帧重新分配 | `sceneCapture.js:97–115,144–194,584–598` | 在单个 `createSceneCapture` 实例中持有可扩容、可清零的 scratch；占用 grid、integral、前后两组 overlap/movement、所需 parent 行按容量复用；dispose 置空。保留公开纯函数默认独立行为 | 启用标注的视频每帧都扫描所有 alpha，并分配 `Uint8Array/Uint32Array`；每个 chosen label 又分配两个 `Float64Array` 和一个 `Int32Array`。复用能减少分配/GC，不能减少算法必须的扫描/搜索次数，也尚无 timing 证据。必须重置所有本次使用范围，避免上一帧残留使标注挪位。 |
| 3 | P2 / 低风险 | 没有可绘制标注仍构造完整 alpha mask | `sceneCapture.js:292–308,584–598` | 获取一次 label sources，投影筛选后若为空，直接跳过 label layout/mask；最好把 mask 创建推迟到已选出至少一个可绘制标注之后 | 当前参数求值会先完整创建 mask，随后 `drawCaptureLabels` 才筛掉 inactive、空文本、越界或在相机后方的点。仅空标注/全不可见场景受益；不要跳过存在可见标注的 mask，也不要对 alpha 抽样。 |
| 4 | P2 / 中低风险 | 每帧重复测量静态文本 | `studio/composition.js:7–25,78–138`；`sceneCapture.js:232–245,315–318` | 为一次预览/录制会话缓存静态标题、说明、scientificNote 的行切分或 `measureText` 标量结果；缓存键含文字、font、逻辑可用宽度、maxLines、语言；字体加载变化失效；有界缓存并在释放时清空 | 逐字符 `measureText`、中英文字换行与标题/footer 每帧相同；动态 process caption 仍按每帧实时读取（`composition.js:89–104`），标注 anchor/active/遮挡布局仍每帧算。首先只缓存测量与换行结果，不合并离屏文本层，以减少像素混合顺序变化风险。 |
| 5 | P3 / 低收益 | 固定导出尺寸/布局和字体常量每帧重复建立 | `Studio.jsx:134`；`composition.js:40–53`；`config.js:64–108`；`compare/capture.js:9–30,54,80–83,102–119` | 若后续引入 composition session，按 preferences/source 文案存在性/scale/lang 固定 prepared layout 与静态字符串；继续每帧读取 motion fraction | `outputDimensions` 与 compositionLayout 的数值运算本身很小，不宜单独为此增加全局缓存。和第 4 项同一会话实现才有意义。必须保留 logical/export coordinates，再按 scale 舍入 render 尺寸的既有顺序。 |
| 6 | P3 / 测量后再选 | 每次截图遍历场景搜 shadow lights，小对象与数组反复创建 | `sceneCapture.js:441–456,508–555`；`captureCamera:57–67`；`ProcessScene.jsx:351–377` | 相机 offset、Vector4/Color 与两侧迭代容器可用实例 scratch；灯光列表仅在有明确 scene-generation 失效机制时缓存 | 一次完整 `scene.traverse` 与标注/读回相比占比未知；动态灯光/替换 shadow map 的完整性优先。不能静态记住第一帧灯光后永久不更新。过程 fit 当前只计算 8 个点，不应写成几何全遍历热点。 |

建议第一批只做 1 与 3，方便严格比较捕获次数与像素一致性。第二批独立做 2；在结果表明 CPU 标注路径占比足够大时再做 4。每一批独立验收，避免一次性修改 CPU 布局、GPU 读回和录制时钟后无法归因。

## 不宜先做的变更

### 异步读回不是替换函数名即可落地

同步 `captureFrame` 现在返回可立即 `drawImage` 的 canvas；外层会在 `finally` 恢复临时 pose/visibility/matrix，并保持 live renderer 的 target/viewport/scissor/clear/XR/shadow 状态（`sceneCapture.js:607–623`，`CellScene.jsx:1137–1175`，`ProcessScene.jsx:517–531`）。改为异步涉及这些约定：

1. 每个 pending frame 需要自身的像素槽和 frame index，不能让第二次捕获覆盖第一个 `ImageData`。
2. 预览 seek、关闭、录制取消与 context loss 后，旧结果不可覆盖新画布或创建下载 URL。
3. 比较左右结果应成对提交，同一 fraction 的左右帧不能混用；成片时间轴只能按顺序提交。
4. 当前本地 Three 的 async helper 每次创建/删除 PBO（`WebGLRenderer.js:2970–2995`），单纯改用它不能宣称消除 allocation。
5. 当前 CPU mask 需要完整 alpha；不能靠降低读回分辨率、隔帧复用 silhouette 或关闭标注来换性能。

因此建议仅在基线证实同步 readback 是主瓶颈后另立实验，保持有界 pending queue、显式取消与资源归还，不并入第一批优化。

### 录制时钟需保持原有语义

`recordVideo.js:80–84,111–141` 先绘制 fraction 0，再 `captureStream(30)`；之后 rAF 节流到约 30 次 draw/s，用 elapsed wall time 推进，最后强制绘制 fraction 1 并留出 120 ms 供编码器采样。`requestFrame` 是在该次 draw 后请求，不是第二次场景捕获。没有发现 60 Hz 每次 rAF 都重复 draw 的问题；既有测试明确覆盖该约定（`tests/studio.mjs:234–243`，本轮未运行）。

耗时帧可能导致中间 fraction 跳跃；这是当前实时录制行为，不能以“优化”名义缩短过程、取消首尾帧、降低正式输出尺寸或偷偷跳过模型更新。若要固定逐帧输出，应单独定义编码策略与时间轴验收，不能把 preview 30 fps cap 当作模型降质许可。

后台页面的预览主动 pause（`Studio.jsx:269–276`），录制时钟没有相同 visibility 逻辑。返回前台后 wall time 的跳跃属于需要实测的恢复边界，不能未经验证声称录制始终均匀 30 fps。本轮不改变该产品行为。

## 释放路径审查

| 路径 | 已有行为 | 需要保持的验证 |
| --- | --- | --- |
| Studio 关闭/卸载 | abort recording，revoke image/video URLs，releaseCapture，解绑 key listener，恢复 body/inert/focus（`Studio.jsx:192–201`） | 关闭后无 RAF、无活 track、无 pending late draw/新 URL；重新打开正常捕获。 |
| PNG 成功或失败 | finally 清零临时输出 canvas、dispose capture；挂载时恢复 exporting（`Studio.jsx:292–320`） | `toBlob` 尚未返回时关闭，不下载、不过早重建 GPU buffer；后续导出仍成功。 |
| 视频成功/取消/失败 | recordVideo.cleanup 停 RAF/timers/listeners/recorder/tracks（`recordVideo.js:47–70`）；Studio finally 清零 canvas、releaseCapture（`Studio.jsx:383–387`） | 不返回 partial video；cancel/retry 及 onstop/error/abort 竞态只结算一次；最终帧仍保留。 |
| Scene capture 异常/context lost | dispose targets/pass/private shadows/canvas/image，然后 finally 恢复 renderer 与 live shadow（`sceneCapture.js:382–397,420–439,604–623`） | scratch 优化必须加入同一 dispose；保留 `renderer.info.render.frame` 单调递增，不能倒退帧索引造成实例数据失更。 |
| Comparison 释放 | composite.releaseCapture 清零复合 canvas 并释放两侧 scene capture（`CompareWorkspace.jsx:106–108`） | 两侧都释放；比较 canvas 复用仍先 drawImage 左帧再捕获右帧。 |

`CompareWorkspace` 的 swap 与 choosePreset 会更换 `apis.current` WeakMap key（`:220,239`），卸载 effect 只取消 publish RAF/通知 sceneReady null（`:114–120`）。当前常规 Studio 流程在关闭时先 release，且背景 app inert，未证明存在持续泄漏。可作为低优先级生命周期加固：替换 key/卸载前显式 releaseComparisonCapture 旧 key；不能把 WeakMap 可回收的旧条目直接报告成确定内存泄漏。

PNG 完成后 releaseCapture、exportBusy 复位会使当前预览 effect 再捕获一次（`Studio.jsx:318–319,223,278–290`）。这会重建小尺寸 GPU 资源，但也避免保留大输出 allocation。若以后想复用已显示的静态 preview canvas，必须区分“释放 GPU 导出资源”和“预览内容仍有效”，不能为了少一次回捕获长期保留 2560 输出资源；该改动低于上表优先级。

## 后续验证矩阵（本轮均未执行）

### 像素、布局与相机

- 在冻结基线与候选用同一模型、相机、条件、fraction、语言及字体就绪状态输出，覆盖 1920/2560、16:9/9:16/1:1、full/airy、light/dark/transparent、labels/title on/off。保留完整 PNG 与结构化差异结果，避免打印像素数组。
- 固定 fractions 至少覆盖 0、0.25、0.5、0.75、1；结构含细长 neuron 与 explode；过程含 active labels 变化、半透明/细线；比较含左右不同模型、同模型不同角度、竖向 stacked 布局。geometry/material/shadow/MSAA/tone mapping 参数必须相同。
- 对 scratch、空标注短路和 scale 依赖调整，目标是固定同环境 RGBA 完全一致。文本缓存需验证首次字体可用、字体 loadingdone、切换语言、改变构图后均失效正确；不得降低字体/模型清晰度阈值来让检查通过。
- 保留所有 alpha > 8 的像素贡献，特别是一像素半透明结构；full silhouette 仍保留原来 chosen captions；保持 anchor 顺序、所有 leaders 在所有 caption 背景下方，不能改变遮挡 DP tie-break。既有 `tests/scene-capture.mjs:379–443,450…` 提供相关契约。

### 捕获次数与资源

- 只读计数 `captureFrame`、readPixels、canvas 创建、ImageData/typed-array 创建、shadow clone/dispose：稳定同尺寸 300 帧应保持原来每个场景每帧 1 次 readback，scratch capacity 稳定后新增分配应停止；比较按左右各 1 次计数。
- 用多个 raw previewBounds 得到相同 exact scale：ResizeObserver 触发后不新增 capture、不重置 playing；实际 scale 改变必须捕获。首次打开、刷新、seek、配置/语言变化仍捕获正确一次；暂停后无 idle capture。
- 验证 resize、切换 1920/2560、完整录制、取消、关闭、重新打开后的资源曲线有界；输出 canvas/对象 URL 在原有释放点释放。工具产生的原始 records 保存在 evidence 目录，不输出大型数组。
- 现有 `tests/scene-capture-performance.html` 检查同尺寸 canvas/readback/shadow 复用与 release 后重建；同 `tests/scene-capture-browser.html` 一起作为后续真实 GPU 渲染门槛，单元测试不代替视觉验收。

### 视频帧顺序、取消与恢复

- 保持首帧 0、末帧 1、fraction 单调、frame caption 与模型 fraction 一致；验证 60/120 Hz 输入与耗时帧，回放确认实际编码帧顺序、持续时间、首尾停留、MP4/WebM 可播放。drawFrame 次数不是编码器实际帧数。
- 在首帧后、中途、最终帧等待及 finalize 时分别取消；模拟 draw failure、编码器 early stop/error、context loss、立即关闭；要求只有一次 resolve/reject，tracks/RAF/timers 清零，不生成半段下载结果。
- seek→pause→play、播放至末尾后 replay、后台→前台、失败后 refresh、取消后重录、PNG 后继续 preview，分别验证；不得将耗时测量期间的异步结果写入已关闭或已更换配置的画布。
- 资源池与异步实验若以后开展，应额外对 snapshot 默认独立性、比较左右同 fraction、活场景 pose/camera/controls/renderer/shadow 完整恢复做断言，保留关闭工作台后的同角度 live screenshot 对比。

最终状态：静态审查完成；性能收益、像素一致性、录制回放、取消/恢复验收均待 root 串行测量阶段执行。没有产品修改可宣称已优化或已发布。

## Resolutions：授权后的最小实施（2026-10-04，尚未验证）

以上审查保留为修改前结论；随后 root 授权实施条目 1 与 2，并明确暂不做字体测量缓存。已编辑：

- `src/studio/Studio.jsx`：在 render 阶段计算 exact preview scale，预览 effect 依赖数值 scale，不依赖原始 bounds 对象；composition、输出 width/height、来源、语言、refresh、exportBusy、视频结果等失效条件保留。cap 不变的 resize 不再替换播放时钟。
- `src/scene/sceneCapture.js`：新增实例内的 label scratch；mask 的 occupied/integral 数组和 DP 的两组交替 score 数组/各 label parent 行按容量复用。每次使用重置本次有效范围；两侧布局同步完成后只留下数值化的 label 坐标，typed arrays 不进入返回结果。默认不传 scratch 的公开函数仍分配独立存储，默认 mask 的查询闭包不会被后续调用覆盖。capture.dispose（含错误/context-loss/Studio release 路径）丢弃全部 labelScratch 引用。
- `tests/scene-capture-scratch.mjs`：准备了清空 alpha、改变 grid stride/scale/尺寸、返回 layout 独立性、连续多帧两列布局等价和稳定容量无新 typed-array 的用例。
- `tests/studio-preview-resize.html`：准备了真实 React Studio + 替代 capture source/受控 RAF/ResizeObserver 的生命周期用例；断言 cap 不变不重捕获、不停播、不替换 pending clock，实际 scale 改变/显式刷新仍绘制，卸载清理 observer/clock/capture。该用例不替代真实模型 GPU 像素验证。

没有修改左右比较捕获、异步读回、字体缓存、几何、阴影、相机适配、录制时钟或正式导出尺寸。root 正在执行串行基线，遵从当前约束，本分工未运行 formatter、测试、构建、模型、浏览器或任何计时。新增两项用例需要 root 加入其单写 runner 或在放行后独立运行；真实 RGBA/帧顺序/取消与恢复以及收益验收仍为 open。

## Acceptance：针对性正确性放行后的验证

root 通知基线 CPU 扫描已结束并授权 owned 正确性测试与必要 bundle 检查后，本分工完成如下验证；没有运行浏览器、模型、性能计时或全量 check。

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| owned JS/JSX/MJS/HTML 格式化 | 完成；仅触及本分工文件 | 本地 Prettier |
| `node --test --test-concurrency=1 tests/scene-capture.mjs tests/scene-capture-scratch.mjs tests/studio-preview.mjs tests/studio.mjs` | 45/45 通过，0 skip | `evidence/export-targeted-tests.log` |
| `BIOSCAPE_CAPTURE_BASELINE=/tmp/bioscape-systemwide-20261004-baseline-ae697be/src/scene/sceneCapture.js node --test tests/scene-capture-baseline-equivalence.mjs` | 独立冻结源码编译后 72/72 mask 查询与 label layout 精确等价，0 skip | `evidence/export-baseline-equivalence.log` |
| Studio JSX 的独立浏览器 bundle | 成功，出口仅写临时目录 | `/tmp/bioscape-export-owned-bundle/Studio.js`、`evidence/export-bundle.log`（退出码 0，无 warning） |
| scoped `git diff --check` | 通过 | `src/studio/Studio.jsx`、`src/scene/sceneCapture.js` |

新增 `tests/scene-capture-baseline-equivalence.mjs` 只在显式提供 `BIOSCAPE_CAPTURE_BASELINE` 时执行独立 A/B；平常运行会 skip，不依赖本机冻结目录。其比较范围是实际 alpha mask 与避让算法的完整输出，包括 full/empty silhouette、alpha 8/9 边界、两列标签、不同优先级、横竖尺寸及 scale；不是 GPU RGBA 渲染或性能基准。

尚待 root：将 `tests/scene-capture-scratch.mjs` 纳入单写 runner；运行 `tests/studio-preview-resize.html` 的真实 React 浏览器生命周期回归；运行真实场景 GPU 像素/视频回放/取消与恢复，以及全站统一 A/B。以上通过项不关闭这些验收门槛。
