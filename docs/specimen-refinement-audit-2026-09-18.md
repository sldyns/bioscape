# 植物与细菌逐项精修验收 · 2026-09-18

后续补充：用户指出默认组装与名称语境的问题后，已对全部 120 个模型重新检查并修正。当前结果以 [全部模型复查](model-recheck-2026-09-18.md) 为准；本文保留当时的检查范围与记录。

本轮按 P1–P8、B1–B6 逐项完成，范围和过程见 [精修计划](SPECIMEN_REFINEMENT_PLAN.md)。以下为本地浏览器与生产预览验证；真实手机按用户决定暂缓。

## 模型变化

- 植物：带通孔的细胞壁、交织纤维素与葡聚糖链、胞间连丝膜衬层及连丝微管；独立质膜/液泡膜、水通道及不同朝向的质子泵；液泡细胞液与周边细胞器重新布置。
- 叶绿体：基粒边缘与基质片层通过隐式联合形成连续膜/腔，剖切处显示膜壁；基质加入Rubisco示意与DNA核样体片段。避免把实心圆片或独立圆盘当作类囊体。
- 植物共有细胞器：植物语境的核周支持网络、膜囊与管网ER、线粒体DNA片段及独立基质；重新安排线粒体与高尔基体拆解，避免结构叠在一起。
- 细菌：分层包被、周质、非对称LPS外膜、三聚孔蛋白、NAM连接肽链与交联、内膜F型ATP合酶；折叠拟核、闭合双链质粒、I型菌毛的杆与黏附尖端；鞭毛丝、弯钩、转子、支承环及定子。
- 实验主链：小麦60S/40S使用8JIV/8JIW，大肠杆菌70S及50S/30S使用7K00。独立按需加载，缺失残基不跨接；细菌两亚基保留同一沉积坐标系。

## 验证结果

| 检查 | 结果 | 范围 |
| --- | --- | --- |
| 模型与目录自动回归 | 120节点、198路径、117局部Worker传输、1364网格，0错误 | 属性/索引/实例/材质无损传输、有限坐标、子结构命中、双语、几何约束 |
| 桌面逐项模型检查 | 59个植物/细菌独立视图已查看 | 包括局部模型及可用标签；共享动物结构沿用已有回归，不把198条路径写成198次视觉检查 |
| 层级进入/返回 | 25个父级通过 | 每个父级选择首个子结构，并由面包屑返回；不代表所有路径排列都逐一点击 |
| 完整/剖面/拆解 | 23个支持模式切换的视图，共59组状态通过 | 同时核对按钮pressed与完成渲染的data-mode；纤维素链束、质粒等没有独立可分部件时不提供无意义拆解 |
| 320像素英文布局 | 59个独立视图通过 | 标题与模型对应，无页面横向溢出；粗指针模拟，不是真机 |
| 控件裁切修复复测 | 10个代表视图通过 | 每个模型工具/缩放按钮均落在可见宽度内；控制栏按实际宽度换行，模型增加窄屏边缘余量 |
| 短横屏667×375 | 通过 | 马达模型和拆解控件同屏；控制栏y=317至365，模型区y=96至375 |
| 直接三维点选 | 通过 | 植物→叶绿体→类囊体→基粒；70S→50S；拆解马达→转子 |
| 操作与语言 | 通过 | 拖转不误入、缩放、复位、自动旋转、返回；英文窄屏编号图例可进入类囊体 |
| 生产预览4173 | 7个代表视图通过 | 植物、叶绿体、小麦40S、细菌、70S、50S、马达，Worker及坐标分块可加载；检查时无控制台错误或警告 |
| 构建、格式 | 通过 | npm run build / format:check；本地静态产物，未发布公网 |
| 坐标提取脚本 | 通过 | 整理为可维护的提取函数；四份JSON重新提取后逐字节相同 |

模式等待曾捕捉到切换前的旧帧，验收已改为等待实际渲染模式；未把旧截图当作拆解通过依据。窄屏无页面溢出也不足以证明控件可见，因此另检查了每个工具按钮的边界，发现并修复了英文双模式控件行右端被裁掉的问题。

## 保留的截图

- [植物总览](specimen-refinement/plant-final.jpg)、[细菌总览](specimen-refinement/bacterium-final.jpg)
- [类囊体拆解](specimen-refinement/thylakoids-explode.jpg)、[植物线粒体拆解](specimen-refinement/plantMitochondria-explode.jpg)
- [小麦40S](specimen-refinement/plant40S.jpg)、[大肠杆菌70S](specimen-refinement/bacterialRibosome.jpg)、[马达拆解](specimen-refinement/flagellarMotor-explode.jpg)
- [320宽包被与控件](specimen-refinement/bacterialEnvelope-mobile.jpg)、[320宽质膜](specimen-refinement/plantMembrane-mobile.jpg)、[英文编号图例](specimen-refinement/chloroplast-labels-mobile.jpg)、[短横屏](specimen-refinement/motor-landscape.jpg)

机器可读状态和逐项路径见 [JSON记录](specimen-refinement-audit-2026-09-18.json)。完整本轮原始截图暂存在 `/tmp/cell-atlas-refinement/screens/`，不依赖其永久保留；上列代表截图已保存到项目。

## 科学边界与未执行项

这是光合叶肉细胞、革兰阴性杆菌的教学示意。所选I型菌毛、LPS、鞭毛等并非所有细菌通有结构；蛋白形状、膜厚、数量及分离距离有教学调整。只有明确标注PDB的分子视图使用实验主链，仍省略侧链、部分配体和未解析残基。植物80S总览与进入后的实验亚基使用不同观察尺度。

细胞壁通孔已用射线检查贯穿；类囊体主膜及腔分别连通，但示意膜网的接头位置和堆叠数不是物种重建。小麦亚基来自不同条目，不把它们拼成声称具有实验相对姿态的80S整体。

真实iOS/Android的单指/双指手势、GPU表现、锁屏与后台恢复仍待设备连接后验收。本轮未将鼠标坐标操作、粗指针样式或窄屏截图当作实机证据。

## 逐视图目录

| 结构 | 路径 | 桌面模型 | 英文320宽 |
| --- | --- | --- | --- |
| 质膜H⁺泵 · Plasma-membrane H+ pump | `#/plant/plantMembrane/plasmaPump` | 已查看 | 通过 |
| 液泡V-ATPase · Vacuolar V-ATPase | `#/plant/vacuole/tonoplast/vacuolarPump` | 已查看 | 通过 |
| 水通道蛋白 · Aquaporin | `#/plant/plantMembrane/plantAquaporin` | 已查看 | 通过 |
| 壁内多糖基质 · Wall polysaccharide matrix | `#/plant/cellWall/wallMatrix` | 已查看 | 通过 |
| β-葡聚糖链 · Beta-glucan chain | `#/plant/cellWall/cellulose/glucanChain` | 已查看 | 通过 |
| 通道膜衬层 · Channel membrane lining | `#/plant/cellWall/plasmodesmata/pdMembrane` | 已查看 | 通过 |
| 连丝微管 · Desmotubule | `#/plant/cellWall/plasmodesmata/pdDesmotubule` | 已查看 | 通过 |
| 植物细胞 · Plant cell | `#/plant` | 已查看 | 通过 |
| 细胞壁 · Cell wall | `#/plant/cellWall` | 已查看 | 通过 |
| 纤维素微纤丝 · Cellulose microfibrils | `#/plant/cellWall/cellulose` | 已查看 | 通过 |
| 胞间连丝 · Plasmodesmata | `#/plant/cellWall/plasmodesmata` | 已查看 | 通过 |
| 细胞膜 · Plasma membrane | `#/plant/plantMembrane` | 已查看 | 通过 |
| 中央液泡 · Central vacuole | `#/plant/vacuole` | 已查看 | 通过 |
| 液泡膜 · Tonoplast | `#/plant/vacuole/tonoplast` | 已查看 | 通过 |
| 细胞液 · Cell sap | `#/plant/vacuole/cellSap` | 已查看 | 通过 |
| 叶绿体 · Chloroplast | `#/plant/chloroplast` | 已查看 | 通过 |
| 叶绿体被膜 · Chloroplast envelope | `#/plant/chloroplast/chloroplastEnvelope` | 已查看 | 通过 |
| 类囊体系统 · Thylakoid system | `#/plant/chloroplast/thylakoids` | 已查看 | 通过 |
| 基粒 · Granum | `#/plant/chloroplast/thylakoids/granum` | 已查看 | 通过 |
| 基质片层 · Stroma lamellae | `#/plant/chloroplast/thylakoids/stromaLamella` | 已查看 | 通过 |
| 叶绿体基质 · Stroma | `#/plant/chloroplast/stroma` | 已查看 | 通过 |
| Rubisco · Rubisco | `#/plant/chloroplast/stroma/rubisco` | 已查看 | 通过 |
| 叶绿体DNA · Chloroplast DNA | `#/plant/chloroplast/stroma/plastidDNA` | 已查看 | 通过 |
| 细胞核 · Nucleus | `#/plant/plantNucleus` | 已查看 | 通过 |
| 线粒体 · Mitochondrion | `#/plant/plantMitochondria` | 已查看 | 通过 |
| 线粒体基质 · Mitochondrial matrix | `#/plant/plantMitochondria/plantMatrix` | 已查看 | 通过 |
| 内质网 · Endoplasmic reticulum | `#/plant/plantER` | 已查看 | 通过 |
| 膜囊与腔 · Cisternae and lumen | `#/plant/plantER/plantCisternae` | 已查看 | 通过 |
| 高尔基体 · Golgi apparatus | `#/plant/plantGolgi` | 已查看 | 通过 |
| 细胞质核糖体 · Cytosolic ribosome | `#/plant/plantER/plantRibosome` | 已查看 | 通过 |
| 60S大亚基 · 60S large subunit | `#/plant/plantER/plantRibosome/plant60S` | 已查看 | 通过 |
| 40S小亚基 · 40S small subunit | `#/plant/plantER/plantRibosome/plant40S` | 已查看 | 通过 |
| 细胞质基质 · Cytosol | `#/plant/plantCytoplasm` | 已查看 | 通过 |
| 细菌 · Bacterium | `#/bacterium` | 已查看 | 通过 |
| 细胞包被 · Cell envelope | `#/bacterium/bacterialEnvelope` | 已查看 | 通过 |
| 外膜 · Outer membrane | `#/bacterium/bacterialEnvelope/bacterialOuter` | 已查看 | 通过 |
| 肽聚糖 · Peptidoglycan | `#/bacterium/bacterialEnvelope/peptidoglycan` | 已查看 | 通过 |
| 细胞膜 · Cytoplasmic membrane | `#/bacterium/bacterialEnvelope/bacterialMembrane` | 已查看 | 通过 |
| 拟核 · Nucleoid | `#/bacterium/nucleoid` | 已查看 | 通过 |
| 拟核相关蛋白 · Nucleoid-associated proteins | `#/bacterium/nucleoid/nucleoidProteins` | 已查看 | 通过 |
| DNA片段 · DNA segment | `#/bacterium/nucleoid/bacterialDNA` | 已查看 | 通过 |
| 质粒 · Plasmids | `#/bacterium/plasmids` | 已查看 | 通过 |
| 70S核糖体 · 70S ribosome | `#/bacterium/bacterialRibosome` | 已查看 | 通过 |
| 50S大亚基 · 50S large subunit | `#/bacterium/bacterialRibosome/bacterial50S` | 已查看 | 通过 |
| 30S小亚基 · 30S small subunit | `#/bacterium/bacterialRibosome/bacterial30S` | 已查看 | 通过 |
| 脂多糖 · Lipopolysaccharide | `#/bacterium/bacterialEnvelope/bacterialOuter/lps` | 已查看 | 通过 |
| 孔蛋白 · Porin | `#/bacterium/bacterialEnvelope/bacterialOuter/porin` | 已查看 | 通过 |
| F型ATP合酶 · F-type ATP synthase | `#/bacterium/bacterialEnvelope/bacterialMembrane/bacterialATPase` | 已查看 | 通过 |
| 细胞质 · Cytoplasm | `#/bacterium/bacterialCytoplasm` | 已查看 | 通过 |
| 菌毛 · Pili | `#/bacterium/pili` | 已查看 | 通过 |
| 鞭毛 · Flagellum | `#/bacterium/flagellum` | 已查看 | 通过 |
| 鞭毛丝 · Flagellar filament | `#/bacterium/flagellum/flagellarFilament` | 已查看 | 通过 |
| 弯钩 · Hook | `#/bacterium/flagellum/flagellarHook` | 已查看 | 通过 |
| 菌毛杆 · Pilus rod | `#/bacterium/pili/pilusRod` | 已查看 | 通过 |
| 黏附尖端 · Adhesive tip | `#/bacterium/pili/pilusTip` | 已查看 | 通过 |
| 转子与C环 · Rotor and C ring | `#/bacterium/flagellum/flagellarMotor/motorRotor` | 已查看 | 通过 |
| 杆与LP支承环 · Rod and LP bushing | `#/bacterium/flagellum/flagellarMotor/motorBushing` | 已查看 | 通过 |
| 定子复合体 · Stator complexes | `#/bacterium/flagellum/flagellarMotor/motorStator` | 已查看 | 通过 |
| 基部马达 · Basal motor | `#/bacterium/flagellum/flagellarMotor` | 已查看 | 通过 |
