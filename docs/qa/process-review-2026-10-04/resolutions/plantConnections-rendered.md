# plantConnections — 默认条件中文原生渲染复核

状态：**默认条件阶段帧已复核；photorespiration 总碳收支说明已按同一问题 04 完成验收返修并重新冻结，等待重渲染。CO₂ 标签框遮挡由主代理指定的共享布局负责人处理。其余默认条件未发现新的明确视觉缺陷。**

复核日期：2026-10-04。首先只读查看主代理生成的 `full-b2` 本地截图；报告问题后，按主代理返修指令只修改所属 photorespiration caption 和对应回归。没有操作浏览器或重跑全套测试。Phase A 审计未改。

## 证据与覆盖范围

索引：[gallery-index.json](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/browser/gallery-index.json)。四张 contact sheet 覆盖 29 张阶段/起止帧；另直接以 `view_image(detail=original)` 查看 10 张 960 × 640 原图。图片来源均为默认 `root=plant`、中文、原生播放的主代理采集结果，本报告不把静帧复核等同于亲自播放或全组合验收。

| 模型 | 本批条件 | sheet 阶段数 | 直接查看的原图 |
| --- | --- | ---: | --- |
| plantTransport | energy=available | 7 | stage-5、end |
| plasmodesmata | gate=open | 7 | start、stage-4、end |
| photorespiration | glyk=active | 8 | start、stage-5、end |
| c4cam | strategy=c4 | 7 | stage-4、stage-6 |

## 观察结果

- **plantTransport**：蔗糖在 sheet 中由膜外进入 SUC2 后到达胞质，修后引线随分子移动；原图 `full-b2-006-plantTransport-plant-stage-5.webp` 和 `-end.webp` 的蔗糖、SUC2、ATP 反应位置可区分，未见旧的静止蔗糖锚点。膜与蛋白在本视图可读，中文标签未明显重叠。
- **plasmodesmata**：原图 `full-b2-007-plasmodesmata-plant-start.webp`、`-stage-4.webp`、`-end.webp` 的两侧金色胼胝质环、连续质膜和中央连丝管可区分；大分子接近左侧通道后仍留在左侧，标签跟随它移动。胼胝质引线落在金色环上。开放条件中未见新的明显环/膜穿插，但单一投影不能替代已有三角形间隙检查，也没有覆盖积累关闭条件。
- **photorespiration**：`full-b2-008-photorespiration-plant-start.webp` 的嵴呈一致的连续表面外观，未见旧独立装饰颈管；细胞器内的碳骨架与末段 GLYK 标签有清楚对象。默认近正面视角及 960 × 640 尺度不能独立辨认全部 10 个内膜开放口的贯通性，故开放拓扑仍依据既有几何检测，本次只给外观复核结论。后半程标签另有以下问题。
- **c4cam / C4**：`full-b2-009-c4cam-plant-stage-4.webp` 中 PEPC、PPDK、NADP-ME 各引线落在对应可见酶体；四碳骨架已在右侧叶绿体。`-stage-6.webp` 的三碳返回标签跟随左侧叶绿体中的骨架，PPDK 示意酶体与骨架可区分。sheet 的返回过程没有明显错误标签残留。默认 C4 图不包含 CAM 酸储存分支、新增 CAM Rubisco 或 CAM 线粒体，不能用本批图片验收这些对象。

## 已先报主代理的具体问题

### rendered-01 — P2 候选：光呼吸总碳收支标签引线脱离可见对象

- 证据：[stage-5 原图](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/browser/full-b2-008-photorespiration-plant-stage-5.webp)，进度 0.665；[end 原图](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/browser/full-b2-008-photorespiration-plant-end.webp)，进度 1。
- `4C = 3C 回收 + 1C 释放` 位于右上；其引线沿约 y=69 横跨整幅顶部空白，并从左边界外进入，画内没有可辨认的目标。这会使总量说明看起来像指向画外结构的对象标签。
- 建议主代理判定总量说明是否应使用无引线注释，或将目标/展示位置限制在可见的适当区域。这里只记录渲染现象，未修改产品。

返修记录（同一 `20261004-plantConnections-04`）：已定位原静态坐标 `[0, 2.65, 0.2]` 超出实际途径模型 bounds，位于细胞器上方空白；**不能据此断言旧锚点投影在相机外**。现改为 `[2.55, 0.58, 0.35]`，指向线粒体基质中的 4C 分流反应区域，保留原中英文说明与激活时段。它是区域说明，不增加或指称第五个碳原子。真实 CO₂ 分子及其动态锚点未改。

返修检查：`labelAnchors.test.mjs` 保留 432 项真实对象检查，并新增 24 项 caption 检查，覆盖 active/absent、960 × 640/640 × 960 拟合默认相机、出现问题的 0.665/0.815/0.975/1 阶段及乱序回跳。检查实际线粒体局部范围、全程可见模型 bounds、投影离边界至少短边 7.5%，并以原 caption 坐标作为失败对照。模块 smoke 全部通过，差异空白检查通过。日志：[caption-regression.log](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/plantConnections/caption-regression.log)、[caption-smoke.log](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/plantConnections/caption-smoke.log)。源代码修复已冻结，旧 `full-b2` 图片仍是修复前证据，待主代理重渲染。

### rendered-02 — P2 候选：光呼吸末帧 CO₂ 标签遮挡释放分子

- 证据：[end 原图](/Users/kun/Documents/vc/docs/qa/process-review-2026-10-04/evidence/browser/full-b2-008-photorespiration-plant-end.webp)，进度 1；对应 sheet 的 0.815、0.975 帧也能看到相同趋势。
- `1C 以 CO₂ 释放` 标签框位于约 x=838…950、y=97…130，释放分子进入该区域后大部分被标签遮住，只在框左缘剩少量分子可见。对象锚点已跟随分子，但最终布局仍妨碍观察分子。
- 建议主代理检查移动目标与标签框的最小间距；这可能涉及共享标签布局，不能从本次静帧直接认定应修改哪个模块。

主代理已指定由共享 `sceneCapture` 布局负责人处理。plantConnections 未移动真实 CO₂ 锚点来回避标签框。

## 验收边界

- 本报告不关闭后续 235 全组合复核。
- `energy=depleted`、`gate=callose`、`glyk=absent`、`strategy=cam` 均未由本批默认条件图片覆盖。
- CAM Rubisco、CAM 连续嵴及开放孔口仍待 CAM 条件的渲染证据；开放口的可见性若需视觉确认，还需能直接看到连接口的局部/侧面视图。
- 现有 source/topology/science/smoke 测试通过与本次视觉观察是独立证据；本报告不新增全项目、持续 FPS/GPU、物理设备或发布结论。
