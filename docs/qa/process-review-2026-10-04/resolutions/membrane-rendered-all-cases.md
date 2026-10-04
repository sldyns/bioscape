# Membrane：全部根类型与参数组合最终画面审阅

只读审阅 `conditions-final-gallery-index.json` 中本组四个模型的 **26 个 case、26 张阶段图、160 个阶段帧**，并另行打开 **16 张 960×640 原图**。阶段图逐张审阅；下表列出每个 case 的阶段帧数和本轮单独打开的原图数。原图未降质或修改。

本批未确证新的本组科学/对象锚点缺陷。可见结构、控制分支、对象标签及已修复事件的阶段状态与实现约定相符。正常细胞壁第二条交联仍受 PBP2 遮挡，这是此前已记录的可视限制；它不能被本批静帧宣称为完整可读。共享 leader 后画穿过先画 box 的问题由 root 统一处理，本报告不重复登记，也没有挪动真实锚点。

本批画布使用英文。此前 full-b2 的细胞壁中文默认验收是另一个证据范围，不能扩展为全部中文 case 验收。Native irregular seeks 与下列阶段采样都不是全部组合的不间断 full-play 证据。

## 逐 case 结果

“静帧通过”只指本批可见机制/分支和对象锚点未发现新增缺陷，受后文共同边界约束。阶段帧包含 start/end；原图数是额外单独打开的完整原图文件数，不计阶段图内缩略帧。

| Case / 阶段图 | 模型 / 根 | 参数 | 阶段帧 / 单独原图 | 结论与观察 |
| --- | --- | --- | ---: | --- |
| [103](../evidence/browser/sheets/conditions-final-a-103-diffusion-cell.jpg) | diffusion / cell | route=water · gradient=outside | 6 / 0 | **静帧通过**；水分子在通道附近转运，外侧较高初始分布可见；AQP 锚点正确。 根范围说明：胞外水相。 |
| [104](../evidence/browser/sheets/conditions-final-a-104-diffusion-cell.jpg) | diffusion / cell | route=water · gradient=equal | 6 / 1 | **静帧通过**；水分子两侧分布及通道位置相符；未将静帧视为双向通量证明。 根范围说明：胞外水相。 |
| [105](../evidence/browser/sheets/conditions-final-a-105-diffusion-cell.jpg) | diffusion / cell | route=oxygen · gradient=outside | 6 / 1 | **静帧通过**；氧呈双原子外观，在脂双层区域而非水孔内转运；初始外侧较高。 根范围说明：胞外水相。 |
| [106](../evidence/browser/sheets/conditions-final-a-106-diffusion-cell.jpg) | diffusion / cell | route=oxygen · gradient=equal | 6 / 1 | **静帧通过**；等分布氧分支与脂双层路线一致；AQP 保留为背景结构并正确标注。 根范围说明：胞外水相。 |
| [107](../evidence/browser/sheets/conditions-final-a-107-diffusion-plant.jpg) | diffusion / plant | route=water · gradient=outside | 6 / 0 | **静帧通过**；水分子在通道附近转运，外侧较高初始分布可见；AQP 锚点正确。 根范围说明：明确省略细胞壁。 |
| [108](../evidence/browser/sheets/conditions-final-a-108-diffusion-plant.jpg) | diffusion / plant | route=water · gradient=equal | 6 / 0 | **静帧通过**；水分子两侧分布及通道位置相符；未将静帧视为双向通量证明。 根范围说明：明确省略细胞壁。 |
| [109](../evidence/browser/sheets/conditions-final-a-109-diffusion-plant.jpg) | diffusion / plant | route=oxygen · gradient=outside | 6 / 0 | **静帧通过**；氧呈双原子外观，在脂双层区域而非水孔内转运；初始外侧较高。 根范围说明：明确省略细胞壁。 |
| [110](../evidence/browser/sheets/conditions-final-a-110-diffusion-plant.jpg) | diffusion / plant | route=oxygen · gradient=equal | 6 / 0 | **静帧通过**；等分布氧分支与脂双层路线一致；AQP 保留为背景结构并正确标注。 根范围说明：明确省略细胞壁。 |
| [111](../evidence/browser/sheets/conditions-final-a-111-diffusion-bacterium.jpg) | diffusion / bacterium | route=water · gradient=outside | 6 / 1 | **静帧通过**；水分子在通道附近转运，外侧较高初始分布可见；AQP 锚点正确。 根范围说明：明确省略外层包被。 |
| [112](../evidence/browser/sheets/conditions-final-a-112-diffusion-bacterium.jpg) | diffusion / bacterium | route=water · gradient=equal | 6 / 0 | **静帧通过**；水分子两侧分布及通道位置相符；未将静帧视为双向通量证明。 根范围说明：明确省略外层包被。 |
| [113](../evidence/browser/sheets/conditions-final-a-113-diffusion-bacterium.jpg) | diffusion / bacterium | route=oxygen · gradient=outside | 6 / 0 | **静帧通过**；氧呈双原子外观，在脂双层区域而非水孔内转运；初始外侧较高。 根范围说明：明确省略外层包被。 |
| [114](../evidence/browser/sheets/conditions-final-a-114-diffusion-bacterium.jpg) | diffusion / bacterium | route=oxygen · gradient=equal | 6 / 0 | **静帧通过**；等分布氧分支与脂双层路线一致；AQP 保留为背景结构并正确标注。 根范围说明：明确省略外层包被。 |
| [115](../evidence/browser/sheets/conditions-final-a-115-diffusion-yeast.jpg) | diffusion / yeast | route=water · gradient=outside | 6 / 0 | **静帧通过**；水分子在通道附近转运，外侧较高初始分布可见；AQP 锚点正确。 根范围说明：明确省略细胞壁。 |
| [116](../evidence/browser/sheets/conditions-final-a-116-diffusion-yeast.jpg) | diffusion / yeast | route=water · gradient=equal | 6 / 0 | **静帧通过**；水分子两侧分布及通道位置相符；未将静帧视为双向通量证明。 根范围说明：明确省略细胞壁。 |
| [117](../evidence/browser/sheets/conditions-final-a-117-diffusion-yeast.jpg) | diffusion / yeast | route=oxygen · gradient=outside | 6 / 0 | **静帧通过**；氧呈双原子外观，在脂双层区域而非水孔内转运；初始外侧较高。 根范围说明：明确省略细胞壁。 |
| [118](../evidence/browser/sheets/conditions-final-a-118-diffusion-yeast.jpg) | diffusion / yeast | route=oxygen · gradient=equal | 6 / 0 | **静帧通过**；等分布氧分支与脂双层路线一致；AQP 保留为背景结构并正确标注。 根范围说明：明确省略细胞壁。 |
| [119](../evidence/browser/sheets/conditions-final-a-119-activeTransport-cell.jpg) | activeTransport / cell | energy=atp | 7 / 3 | **静帧通过**；ATP→ADP/Pi、释钠、结合钾、回到 E1 的阶段画面一致；分子/域锚点随动。 |
| [120](../evidence/browser/sheets/conditions-final-a-120-activeTransport-cell.jpg) | activeTransport / cell | energy=none | 7 / 1 | **静帧通过**；无 ATP/ADP/Pi，后续停在 Na 结合的 E1；No ATP 标签指向泵。 |
| [121](../evidence/browser/sheets/conditions-final-a-121-osmoticBalance-cell.jpg) | osmoticBalance / cell | tonicity=hypotonic | 6 / 1 | **静帧通过**；轮廓由双凹趋于膨圆，入水箭头较大；皮层与膜锚点随形变。 |
| [122](../evidence/browser/sheets/conditions-final-a-122-osmoticBalance-cell.jpg) | osmoticBalance / cell | tonicity=isotonic | 6 / 1 | **静帧通过**；保留双凹轮廓，两方向箭头等大；水仍分布两侧，皮层锚点正确。 |
| [123](../evidence/browser/sheets/conditions-final-a-123-osmoticBalance-cell.jpg) | osmoticBalance / cell | tonicity=hypertonic | 6 / 1 | **静帧通过**；轮廓皱缩且出水箭头较大；皮层/整体细胞/箭头锚点正确。 |
| [124](../evidence/browser/sheets/conditions-final-a-124-osmoticBalance-erythrocyte.jpg) | osmoticBalance / erythrocyte | tonicity=hypotonic | 6 / 0 | **静帧通过**；轮廓由双凹趋于膨圆，入水箭头较大；皮层与膜锚点随形变。 |
| [125](../evidence/browser/sheets/conditions-final-a-125-osmoticBalance-erythrocyte.jpg) | osmoticBalance / erythrocyte | tonicity=isotonic | 6 / 0 | **静帧通过**；保留双凹轮廓，两方向箭头等大；水仍分布两侧，皮层锚点正确。 |
| [126](../evidence/browser/sheets/conditions-final-a-126-osmoticBalance-erythrocyte.jpg) | osmoticBalance / erythrocyte | tonicity=hypertonic | 6 / 0 | **静帧通过**；轮廓皱缩且出水箭头较大；皮层/整体细胞/箭头锚点正确。 |
| [127](../evidence/browser/sheets/conditions-final-a-127-bacterialCellWall-bacterium.jpg) | bacterialCellWall / bacterium | antibiotic=none | 7 / 1 | **受限通过**；前期无新键标签，后期第一条分支与游离 D-Ala 可读；第二条键的蛋白遮挡限制仍在。 |
| [128](../evidence/browser/sheets/conditions-final-a-128-bacterialCellWall-bacterium.jpg) | bacterialCellWall / bacterium | antibiotic=betaLactam | 7 / 4 | **静帧通过**；抑制剂从游离到占位，前期无 occupied 标签、后期有；肽干保留且无新交联产物。 |

## 采样与原图证据

| 模型 | Case 数 | 阶段帧数 | Progress 样本 |
| --- | ---: | ---: | --- |
| diffusion | 16 | 96 | 0, .175, .395, .615, .875, 1 |
| activeTransport | 2 | 14 | 0, .215, .395, .575, .725, .875, 1 |
| osmoticBalance | 6 | 36 | 0, .195, .395, .645, .875, 1 |
| bacterialCellWall | 2 | 14 | 0, .185, .365, .655, .785, .915, 1 |

单独打开的 960×640 原图：

- Case 104: [stage-3](../evidence/browser/conditions-final-a-104-diffusion-cell-stage-3.webp).
- Case 105: [stage-3](../evidence/browser/conditions-final-a-105-diffusion-cell-stage-3.webp).
- Case 106: [end](../evidence/browser/conditions-final-a-106-diffusion-cell-end.webp).
- Case 111: [stage-3](../evidence/browser/conditions-final-a-111-diffusion-bacterium-stage-3.webp).
- Case 119: [stage-3](../evidence/browser/conditions-final-a-119-activeTransport-cell-stage-3.webp), [stage-6](../evidence/browser/conditions-final-a-119-activeTransport-cell-stage-6.webp), [end](../evidence/browser/conditions-final-a-119-activeTransport-cell-end.webp).
- Case 120: [end](../evidence/browser/conditions-final-a-120-activeTransport-cell-end.webp).
- Case 121: [end](../evidence/browser/conditions-final-a-121-osmoticBalance-cell-end.webp).
- Case 122: [end](../evidence/browser/conditions-final-a-122-osmoticBalance-cell-end.webp).
- Case 123: [end](../evidence/browser/conditions-final-a-123-osmoticBalance-cell-end.webp).
- Case 127: [end](../evidence/browser/conditions-final-a-127-bacterialCellWall-bacterium-end.webp).
- Case 128: [start](../evidence/browser/conditions-final-a-128-bacterialCellWall-bacterium-start.webp), [stage-3](../evidence/browser/conditions-final-a-128-bacterialCellWall-bacterium-stage-3.webp), [stage-4](../evidence/browser/conditions-final-a-128-bacterialCellWall-bacterium-stage-4.webp), [end](../evidence/browser/conditions-final-a-128-bacterialCellWall-bacterium-end.webp).

Plant/yeast 的四对扩散 case（107–115、108–116、109–117、110–118）共 24 对对应原图，以及 cell/erythrocyte 的三对渗透 case（121–124、122–125、123–126）共 18 对对应原图，已验证逐文件 SHA256 相同。这与它们采用相同局部示意及相同根范围文字相符；所有 26 张各自阶段图仍逐张审阅。完整清单、已打开原图哈希及冻结核对见 [rendered-all-cases-receipt.json](../evidence/membrane/rendered-all-cases-receipt.json)。

## 机制结论与明确限制

- **扩散 / 07**：所有根与控制组合中的 AQP 标签均落在蛋白；水/氧分子外观和相应路线可区分。植物/酵母明确省略细胞壁，细菌明确省略外层包被。静帧不证明每条分子轨迹的完整穿越或等梯度的瞬时双向通量，实际路由/守恒由已有回归检查。共享 water-activity 条件文字（05）不在这些 canvas 截图中，继续引用其单独文字测试。
- **主动运输 / 08**：有 ATP 的域、ADP 和磷酸锚点随对象变化，终态可见外侧三个 Na 与内侧两个 K；无 ATP 分支没有核苷酸或磷酸标记，后续状态保持 E1/Na 结合。精确 .29 磷酸转移连续性、两门互斥以及钾封闭与去磷酸化先后，不由这七个采样时刻独立证明；对应原有几何/时间回归继续有效。
- **渗透 / 09**：两种根下的低/等/高渗轮廓、箭头大小、溶质外观与皮层窗口一致，标签跟随真实膜/皮层/箭头。由于画面有取景适配、遮挡与示踪淡出，不从截图面积/粒子可见数推断面积守恒、体积比或分子总量。264 个循环接缝淡出以及不透膜溶质边界依赖已保留的回归证据；这批静帧不替代连续播放。
- **细胞壁 / 10–11**：无抗生素分支中新键标签出现时序正确，第一处 mDAP 分支与旁侧 D-Ala 分离可辨，NAM 锚点跟随移动链。第二条交联在最终视角仍被 PBP2 头部部分遮挡；已报告的窄范围可视限制继续保留。两条键的真实端点及非端点残基净空有独立 414 状态回归证据，不把它等同于无遮挡画面。
- **β-内酰胺 / 06、10**：游离、对接、占据后的状态相符；.365 帧未提前出现 occupied 标签，.655 后 occupied 标签指向实际位点，糖链仍形成而肽干保持未交联。通用药物四元环及活性口袋在原图可见，但精确 C–N 断边与 serine–carbonyl 键的微小端点与蛋白重叠，960 图的可读尺度不充分替代实际原子/键回归。采样没有精确覆盖 .38 事件本身。

本次未修改产品、未调用浏览器，冻结清单八个 owned 源码/测试文件仍全部匹配。本报告完成本组 26 case 的阶段静帧覆盖；共享布局修复后的终检、逐组合连续播放、中英文全量布局和整体项目验收仍属于独立关卡。
