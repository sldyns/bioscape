# 普通 framing 缓存与隐藏过程标注停算

两项授权改动已实现并通过定向验证，代码可供 root 固定视角/运行时 A/B。没有修改像素比、模型细节、拟合公式、文字、播放频率、矩阵刷新责任或结构标注 rail。尚未进行浏览器、GPU/CPU 性能基准、全仓检查或发布验收；本文不声称已获得实测帧率提升。

产品文件：`src/CellScene.jsx`、`src/scene/framingDistanceCache.js`、`src/processes/ProcessScene.jsx`。完整 SHA-256 收据：`evidence/renderer/source-sha256.json`。冻结参照为 `/tmp/bioscape-performance-20261004-baseline/src`。

## 普通 framing 精确缓存

原 `distance()` 计算体保留为 `computeDistance()`，逐字符对照确认只改了函数名。缓存仅覆盖默认 live camera、`preserveOrientation=false` 且 `separation=null` 的普通计算；单项缓存只复用完全相同输入的计算结果，不对数值做近似。

| 触发条件                                                   | 行为与覆盖                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 相机普通旋转/位置变化，其他输入不变                        | 返回原数值，不再次扫描 part bounds；定向测试通过                                     |
| presentation 身份、parts 数组身份或长度改变                | 缓存失效；节点切换还显式调用 invalidate                                              |
| nodeId、mode、explode 改变                                 | 键变化后重新计算，包含从 whole/section 进入 explode                                  |
| live camera 身份、aspect、fov 或 controls.minDistance 改变 | 键变化后重新计算；resize 仍先读取旧 framing，再按新 aspect 求新值                    |
| 方向拟合、不同的导出相机、显式 separation（包含 0）        | 直接调用原计算，每次都绕过缓存；不覆盖 live 缓存                                     |
| future 原位修改 frameBounds/offset                         | 必须 invalidate；helper 回归覆盖此情况。当前源码仅由 makePresentation 初始化这些数据 |
| 计算抛错                                                   | 不提交缓存，下一次调用重试                                                           |
| 视图切换/组件清理                                          | 显式清空缓存；单项缓存不累积旧模型                                                   |

`framing-baseline-equivalence.mjs` 直接提取冻结版和当前版 CellScene 的实际计算体，对 null/single/multiple parts、4 类 node、3 模式、3 拆解比例、3 aspect、2 fov，以及方向/自定义相机/显式分离参数做 **3,888 次严格数值相等断言**；另有 **648 次普通重复调用不重算**断言，全部通过。其使用小型合成 bounds，不是 CPU benchmark。证据：`evidence/renderer/framing-baseline-equivalence.json`；原数学计算体未改的断言也保留在脚本中。临时 baseline 路径仅用于该次证据重现，不是正常产品或 CI 测试依赖。

## 关闭标注时跳过 DOM 布局

`ProcessScene` 的 live 状态加入 annotations。关闭时 `projectLabels()` 在创建投影/布局对象和编号、读取尺寸之前返回；model update、世界矩阵、WebGL render 和独立导出标签仍按原路径运行。重显或语言变化显式清空 measuredKey 并 requestRender；字体 loadingdone 使用同一失效方法；resize 保留已有 width/height metric key。

| 场景                                                          | 验证结果                                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 初次进入时标注关闭                                            | 0 次标签尺寸读取，不缓存 display:none 下的零尺寸                                   |
| 隐藏期间 seek、文本/active 变化、语言变化、font event、resize | 模型仍更新到所需 pose，标签没有新增 DOM 写入或测量                                 |
| 暂停时重新显示                                                | 主动请求绘制、重新测量当前 active 标签、使用当前编号和文字                         |
| 再次隐藏 → 字体/语言变化 → 显示                               | 旧 measuredKey 失效；结果与同一 pose/lang/font/viewport 从一开始可见的布局完全一致 |
| 可见时字体改变                                                | 重新测量 active 标签                                                               |
| 关闭屏幕标注时调用 captureFrame                               | 仍从模型读取完整导出标签，保留 active 状态                                         |
| 清理                                                          | 取消待执行帧并移除字体监听                                                         |

新回归运行真实 `ProcessScene` 组件/effect、记录 DOM 和 renderer；仅将 WebGL、浏览器 DOM、OrbitControls 和捕获输出替换成可计数 fixture，不启动浏览器。它验证调度、访问次数、实际布局函数和状态恢复，不代表真实字体栅格、原始 RGBA 或 GPU 输出已验收。冻结旧版同一回归在“初始隐藏不得读取零尺寸 DOM”处失败（4 次读取，期望 0），新版通过。见 `evidence/renderer/annotation-negative.log` 与 `annotation-tests.log`。

## 验证与集成

需要 root 加入 `scripts/verify.mjs` 的新测试：

- `tests/framing-distance-cache.mjs`：5/5，通过缓存键、失效、精确复用、导出绕过和失败重试。
- `tests/process-annotation-visibility.mjs`：1/1，覆盖上表的组件/effect 行为及显示结果一致性。

既有 `tests/render-updates.mjs`、`tests/process-label-layout.mjs`、`tests/process-playback.mjs`、`tests/scene-capture.mjs`（15/15）均通过。两处 renderer entrypoint 的 browser bundle（write:false）、owned-file Prettier 与 diff check 通过；完整日志均在 `evidence/renderer/`。未修改 verify runner。

root 仍需实测的验收点：同一设备和视角下 neuron/复杂拆解旋转、标注开关的 CPU/帧时间 A/B；原始 fixed-view 3D/导出图比较；中文/英文、窄屏、真实字体加载、暂停重显、resize、节点切换以及导出方向/分离参数回归。普通非 neuron/非拆解视图原 framing 已较便宜，不能外推特殊视图收益。字体与真实 DOM 布局、视觉/性能及发布结果由这些后续门槛分别确认。
