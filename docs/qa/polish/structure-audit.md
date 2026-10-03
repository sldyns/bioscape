# 既有结构逐项渲染复核 · 2026-10-03

范围为新增加的三个专门细胞类型之前的 **163 个独立结构节点**：动物61、植物33、细菌26、真菌15、草履虫19、噬菌体9。入口由 `src/hierarchy.js` 的实际 children/getNode 遍历获得，按节点ID去重；不是猜测URL。

在稳定生产预览 `127.0.0.1:4197` 中逐项查看默认视图，并操作每个节点实际提供的整体、剖面、拆解。共325张默认/模式画面，其中55张为再次复核默认剖面，故不同节点/模式组合为270。另逐项开启标签，查看163张补图、394个实际可见标签。所有接触表逐行人工视觉查看，数值检查只作补充。

DOM视口1280×720；截图工具输出1265×712。中文。图中细胞器尺寸是项目已有教学示意，本轮没有把示意比例当作新缺陷。

## 结果与未关闭边界

- 163个节点均已查看，未观察到空白场景、默认模型裁切、明显非预期脱离或标题与目录节点不符。
- 55个节点提供剖面，52个提供拆解；全部实际切换并核对按钮状态与画面。
- 标签补图已逐张查看；394个可见标签的DOM矩形亦无两两重叠或越出视口，未见标签覆盖控件的明确问题。未提供可见标签的叶节点在JSON明确记录。
- **STR-LAYOUT-01仍待最终构建复验**：1280×720初始页顶时，页头与工作区最小高度会使底部控件超出视口。点击模式会自动滚动页面使控件可见，不能用已滚动截图掩盖初始可达性问题；主代理正在修复共享布局。
- 窄屏、英文和最终修改后的共享工具栏另待复验。本报告不代表真机、所有旋转角度、全部分离滑杆值或所有像素点击目标均通过。

## 实际交互抽查

从细胞包被画面点击“细胞膜”标签，进入 bacterialMembrane；再点“F型ATP合酶”进入 bacterialATPase；点击顶部“细胞包被”返回原父级。实际URL与标题均对应。此为真实标签点击，不等于穷举所有3D像素拾取点。[返回证据](media/structure-selection-return.jpg)。

## 逐节点记录

每行链接对应接触表中的有名条目；标签表每页按从左到右、从上到下排列。原始截图临时保存在 `/tmp/audit-structure-shots`；项目内保存压缩接触表，避免大量重复媒体。完整DOM、模式和标签矩形见 [JSON](structure-audit.json)。

| 节点 | 实际入口 | 已看模式 | 标签数 | 状态/证据 |
| --- | --- | --- | --- | --- |
| 动物细胞 (`cell`) | `#/cell` | 整体 / 剖面 / 拆解 | 12 | 已复核 · [画面 第1行](media/structure-sheet-0.jpg) · [标签 第1格](media/structure-labels-0.jpg) |
| 细胞膜 (`membrane`) | `#/cell/membrane` | 整体 / 拆解 | 3 | 已复核 · [画面 第2行](media/structure-sheet-0.jpg) · [标签 第2格](media/structure-labels-0.jpg) |
| 磷脂双分子层 (`bilayer`) | `#/cell/membrane/bilayer` | 独立视图 | 4 | 已复核 · [画面 第3行](media/structure-sheet-0.jpg) · [标签 第3格](media/structure-labels-0.jpg) |
| 膜蛋白 (`membraneProteins`) | `#/cell/membrane/membraneProteins` | 独立视图 | 2 | 已复核 · [画面 第4行](media/structure-sheet-0.jpg) · [标签 第4格](media/structure-labels-0.jpg) |
| 膜表面糖链 (`glycans`) | `#/cell/membrane/glycans` | 独立视图 | 0 | 已复核 · [画面 第5行](media/structure-sheet-0.jpg) · [标签 第5格](media/structure-labels-0.jpg) |
| 细胞质 (`cytoplasm`) | `#/cell/cytoplasm` | 整体 / 剖面 / 拆解 | 10 | 已复核 · [画面 第6行](media/structure-sheet-0.jpg) · [标签 第6格](media/structure-labels-0.jpg) |
| 细胞质基质 (`cytosol`) | `#/cell/cytoplasm/cytosol` | 独立视图 | 2 | 已复核 · [画面 第7行](media/structure-sheet-0.jpg) · [标签 第7格](media/structure-labels-0.jpg) |
| 可溶性代谢酶 (`cytosolicEnzyme`) | `#/cell/cytoplasm/cytosol/cytosolicEnzyme` | 独立视图 | 2 | 已复核 · [画面 第8行](media/structure-sheet-0.jpg) · [标签 第8格](media/structure-labels-0.jpg) |
| 水与离子 (`waterIons`) | `#/cell/cytoplasm/cytosol/waterIons` | 独立视图 | 4 | 已复核 · [画面 第9行](media/structure-sheet-0.jpg) · [标签 第9格](media/structure-labels-0.jpg) |
| 线粒体 (`mitochondria`) | `#/cell/cytoplasm/mitochondria` | 整体 / 剖面 / 拆解 | 3 | 已复核 · [画面 第10行](media/structure-sheet-0.jpg) · [标签 第10格](media/structure-labels-0.jpg) |
| 外膜 (`mitoOuter`) | `#/cell/cytoplasm/mitochondria/mitoOuter` | 整体 / 剖面 | 0 | 已复核 · [画面 第1行](media/structure-sheet-10.jpg) · [标签 第11格](media/structure-labels-0.jpg) |
| 内膜 (`mitoInner`) | `#/cell/cytoplasm/mitochondria/mitoInner` | 整体 / 剖面 / 拆解 | 2 | 已复核 · [画面 第2行](media/structure-sheet-10.jpg) · [标签 第12格](media/structure-labels-0.jpg) |
| 线粒体嵴 (`cristae`) | `#/cell/cytoplasm/mitochondria/mitoInner/cristae` | 独立视图 | 2 | 已复核 · [画面 第3行](media/structure-sheet-10.jpg) · [标签 第1格](media/structure-labels-12.jpg) |
| ATP 合酶 (`atpSynthase`) | `#/cell/cytoplasm/mitochondria/mitoInner/atpSynthase` | 独立视图 | 3 | 已复核 · [画面 第4行](media/structure-sheet-10.jpg) · [标签 第2格](media/structure-labels-12.jpg) |
| 线粒体基质 (`matrix`) | `#/cell/cytoplasm/mitochondria/matrix` | 独立视图 | 3 | 已复核 · [画面 第5行](media/structure-sheet-10.jpg) · [标签 第3格](media/structure-labels-12.jpg) |
| 线粒体 DNA (`mitoDNA`) | `#/cell/cytoplasm/mitochondria/matrix/mitoDNA` | 独立视图 | 0 | 已复核 · [画面 第6行](media/structure-sheet-10.jpg) · [标签 第4格](media/structure-labels-12.jpg) |
| 粗面内质网 (`roughER`) | `#/cell/cytoplasm/roughER` | 整体 / 剖面 / 拆解 | 2 | 已复核 · [画面 第7行](media/structure-sheet-10.jpg) · [标签 第5格](media/structure-labels-12.jpg) |
| 膜囊与腔 (`erCisternae`) | `#/cell/cytoplasm/roughER/erCisternae` | 整体 / 剖面 | 2 | 已复核 · [画面 第8行](media/structure-sheet-10.jpg) · [标签 第6格](media/structure-labels-12.jpg) |
| 附着核糖体 (`boundRibosomes`) | `#/cell/cytoplasm/roughER/boundRibosomes` | 整体 / 拆解 | 4 | 已复核 · [画面 第9行](media/structure-sheet-10.jpg) · [标签 第7格](media/structure-labels-12.jpg) |
| 大亚基 (`largeSubunit`) | `#/cell/cytoplasm/roughER/boundRibosomes/largeSubunit` | 独立视图 | 2 | 已复核 · [画面 第10行](media/structure-sheet-10.jpg) · [标签 第8格](media/structure-labels-12.jpg) |
| 小亚基 (`smallSubunit`) | `#/cell/cytoplasm/roughER/boundRibosomes/smallSubunit` | 独立视图 | 2 | 已复核 · [画面 第1行](media/structure-sheet-20.jpg) · [标签 第9格](media/structure-labels-12.jpg) |
| mRNA (`mrna`) | `#/cell/cytoplasm/roughER/boundRibosomes/mrna` | 独立视图 | 3 | 已复核 · [画面 第2行](media/structure-sheet-20.jpg) · [标签 第10格](media/structure-labels-12.jpg) |
| tRNA (`trna`) | `#/cell/cytoplasm/roughER/boundRibosomes/trna` | 独立视图 | 3 | 已复核 · [画面 第3行](media/structure-sheet-20.jpg) · [标签 第11格](media/structure-labels-12.jpg) |
| 光面内质网 (`smoothER`) | `#/cell/cytoplasm/smoothER` | 整体 / 剖面 | 2 | 已复核 · [画面 第4行](media/structure-sheet-20.jpg) · [标签 第12格](media/structure-labels-12.jpg) |
| 管状膜网络 (`erTubules`) | `#/cell/cytoplasm/smoothER/erTubules` | 整体 / 剖面 | 3 | 已复核 · [画面 第5行](media/structure-sheet-20.jpg) · [标签 第1格](media/structure-labels-24.jpg) |
| 高尔基体 (`golgi`) | `#/cell/cytoplasm/golgi` | 整体 / 剖面 / 拆解 | 2 | 已复核 · [画面 第6行](media/structure-sheet-20.jpg) · [标签 第2格](media/structure-labels-24.jpg) |
| 扁平膜囊 (`golgiCisternae`) | `#/cell/cytoplasm/golgi/golgiCisternae` | 整体 / 剖面 | 2 | 已复核 · [画面 第7行](media/structure-sheet-20.jpg) · [标签 第3格](media/structure-labels-24.jpg) |
| 运输囊泡 (`vesicles`) | `#/cell/cytoplasm/golgi/vesicles` | 整体 / 剖面 / 拆解 | 2 | 已复核 · [画面 第8行](media/structure-sheet-20.jpg) · [标签 第4格](media/structure-labels-24.jpg) |
| 囊泡膜 (`vesicleMembrane`) | `#/cell/cytoplasm/golgi/vesicles/vesicleMembrane` | 整体 / 剖面 | 3 | 已复核 · [画面 第9行](media/structure-sheet-20.jpg) · [标签 第5格](media/structure-labels-24.jpg) |
| 运输货物 (`cargo`) | `#/cell/cytoplasm/golgi/vesicles/cargo` | 独立视图 | 0 | 已复核 · [画面 第10行](media/structure-sheet-20.jpg) · [标签 第6格](media/structure-labels-24.jpg) |
| 核糖体 (`ribosomes`) | `#/cell/cytoplasm/ribosomes` | 整体 / 拆解 | 4 | 已复核 · [画面 第1行](media/structure-sheet-30.jpg) · [标签 第7格](media/structure-labels-24.jpg) |
| 溶酶体 (`lysosome`) | `#/cell/cytoplasm/lysosome` | 整体 / 剖面 / 拆解 | 3 | 已复核 · [画面 第2行](media/structure-sheet-30.jpg) · [标签 第8格](media/structure-labels-24.jpg) |
| 溶酶体膜 (`lysosomalMembrane`) | `#/cell/cytoplasm/lysosome/lysosomalMembrane` | 整体 / 拆解 | 1 | 已复核 · [画面 第3行](media/structure-sheet-30.jpg) · [标签 第9格](media/structure-labels-24.jpg) |
| 质子泵 (`lysosomalPump`) | `#/cell/cytoplasm/lysosome/lysosomalMembrane/lysosomalPump` | 独立视图 | 3 | 已复核 · [画面 第4行](media/structure-sheet-30.jpg) · [标签 第10格](media/structure-labels-24.jpg) |
| 酸性水解酶 (`hydrolases`) | `#/cell/cytoplasm/lysosome/hydrolases` | 独立视图 | 2 | 已复核 · [画面 第5行](media/structure-sheet-30.jpg) · [标签 第11格](media/structure-labels-24.jpg) |
| 回收材料 (`recycling`) | `#/cell/cytoplasm/lysosome/recycling` | 独立视图 | 2 | 已复核 · [画面 第6行](media/structure-sheet-30.jpg) · [标签 第12格](media/structure-labels-24.jpg) |
| 过氧化物酶体 (`peroxisome`) | `#/cell/cytoplasm/peroxisome` | 整体 / 剖面 / 拆解 | 2 | 已复核 · [画面 第7行](media/structure-sheet-30.jpg) · [标签 第1格](media/structure-labels-36.jpg) |
| 过氧化物酶体膜 (`peroxisomalMembrane`) | `#/cell/cytoplasm/peroxisome/peroxisomalMembrane` | 独立视图 | 3 | 已复核 · [画面 第8行](media/structure-sheet-30.jpg) · [标签 第2格](media/structure-labels-36.jpg) |
| 氧化酶与过氧化氢酶 (`oxidativeEnzymes`) | `#/cell/cytoplasm/peroxisome/oxidativeEnzymes` | 独立视图 | 2 | 已复核 · [画面 第9行](media/structure-sheet-30.jpg) · [标签 第3格](media/structure-labels-36.jpg) |
| 过氧化氢酶 (`catalase`) | `#/cell/cytoplasm/peroxisome/oxidativeEnzymes/catalase` | 独立视图 | 1 | 已复核 · [画面 第10行](media/structure-sheet-30.jpg) · [标签 第4格](media/structure-labels-36.jpg) |
| 脂酰辅酶A氧化酶 (`acylCoAOxidase`) | `#/cell/cytoplasm/peroxisome/oxidativeEnzymes/acylCoAOxidase` | 独立视图 | 1 | 已复核 · [画面 第1行](media/structure-sheet-40.jpg) · [标签 第5格](media/structure-labels-36.jpg) |
| 中心体 (`centrosome`) | `#/cell/cytoplasm/centrosome` | 整体 / 拆解 | 2 | 已复核 · [画面 第2行](media/structure-sheet-40.jpg) · [标签 第6格](media/structure-labels-36.jpg) |
| 中心粒 (`centrioles`) | `#/cell/cytoplasm/centrosome/centrioles` | 独立视图 | 3 | 已复核 · [画面 第3行](media/structure-sheet-40.jpg) · [标签 第7格](media/structure-labels-36.jpg) |
| 微管三联体 (`triplets`) | `#/cell/cytoplasm/centrosome/centrioles/triplets` | 独立视图 | 3 | 已复核 · [画面 第4行](media/structure-sheet-40.jpg) · [标签 第8格](media/structure-labels-36.jpg) |
| 中心粒周围物质 (`pcm`) | `#/cell/cytoplasm/centrosome/pcm` | 独立视图 | 2 | 已复核 · [画面 第5行](media/structure-sheet-40.jpg) · [标签 第9格](media/structure-labels-36.jpg) |
| 细胞骨架 (`cytoskeleton`) | `#/cell/cytoplasm/cytoskeleton` | 整体 / 拆解 | 3 | 已复核 · [画面 第6行](media/structure-sheet-40.jpg) · [标签 第10格](media/structure-labels-36.jpg) |
| 微管 (`microtubules`) | `#/cell/cytoplasm/cytoskeleton/microtubules` | 独立视图 | 4 | 已复核 · [画面 第7行](media/structure-sheet-40.jpg) · [标签 第11格](media/structure-labels-36.jpg) |
| 微管蛋白二聚体 (`tubulinDimer`) | `#/cell/cytoplasm/cytoskeleton/microtubules/tubulinDimer` | 独立视图 | 2 | 已复核 · [画面 第8行](media/structure-sheet-40.jpg) · [标签 第12格](media/structure-labels-36.jpg) |
| 肌动蛋白丝 (`actin`) | `#/cell/cytoplasm/cytoskeleton/actin` | 独立视图 | 2 | 已复核 · [画面 第9行](media/structure-sheet-40.jpg) · [标签 第1格](media/structure-labels-48.jpg) |
| 中间丝 (`intermediate`) | `#/cell/cytoplasm/cytoskeleton/intermediate` | 独立视图 | 2 | 已复核 · [画面 第10行](media/structure-sheet-40.jpg) · [标签 第2格](media/structure-labels-48.jpg) |
| 反向平行四聚体 (`intermediateTetramer`) | `#/cell/cytoplasm/cytoskeleton/intermediate/intermediateTetramer` | 独立视图 | 2 | 已复核 · [画面 第1行](media/structure-sheet-50.jpg) · [标签 第3格](media/structure-labels-48.jpg) |
| 细胞核 (`nucleus`) | `#/cell/nucleus` | 整体 / 剖面 / 拆解 | 4 | 已复核 · [画面 第2行](media/structure-sheet-50.jpg) · [标签 第4格](media/structure-labels-48.jpg) |
| 核被膜 (`envelope`) | `#/cell/nucleus/envelope` | 整体 / 拆解 | 2 | 已复核 · [画面 第3行](media/structure-sheet-50.jpg) · [标签 第5格](media/structure-labels-48.jpg) |
| 外核膜 (`outerNuclear`) | `#/cell/nucleus/envelope/outerNuclear` | 独立视图 | 2 | 已复核 · [画面 第4行](media/structure-sheet-50.jpg) · [标签 第6格](media/structure-labels-48.jpg) |
| 内核膜 (`innerNuclear`) | `#/cell/nucleus/envelope/innerNuclear` | 独立视图 | 3 | 已复核 · [画面 第5行](media/structure-sheet-50.jpg) · [标签 第7格](media/structure-labels-48.jpg) |
| 核孔复合体 (`nuclearPores`) | `#/cell/nucleus/nuclearPores` | 独立视图 | 3 | 已复核 · [画面 第6行](media/structure-sheet-50.jpg) · [标签 第8格](media/structure-labels-48.jpg) |
| 染色质 (`chromatin`) | `#/cell/nucleus/chromatin` | 整体 / 拆解 | 2 | 已复核 · [画面 第7行](media/structure-sheet-50.jpg) · [标签 第9格](media/structure-labels-48.jpg) |
| 核小体 (`nucleosome`) | `#/cell/nucleus/chromatin/nucleosome` | 整体 / 拆解 | 2 | 已复核 · [画面 第8行](media/structure-sheet-50.jpg) · [标签 第10格](media/structure-labels-48.jpg) |
| 组蛋白核心 (`histones`) | `#/cell/nucleus/chromatin/nucleosome/histones` | 独立视图 | 4 | 已复核 · [画面 第9行](media/structure-sheet-50.jpg) · [标签 第11格](media/structure-labels-48.jpg) |
| DNA 双螺旋 (`dna`) | `#/cell/nucleus/chromatin/nucleosome/dna` | 独立视图 | 4 | 已复核 · [画面 第10行](media/structure-sheet-50.jpg) · [标签 第12格](media/structure-labels-48.jpg) |
| 核仁 (`nucleolus`) | `#/cell/nucleus/nucleolus` | 整体 / 剖面 | 3 | 已复核 · [画面 第1行](media/structure-sheet-60.jpg) · [标签 第1格](media/structure-labels-60.jpg) |
| 植物细胞 (`plant`) | `#/plant` | 整体 / 剖面 / 拆解 | 10 | 已复核 · [画面 第2行](media/structure-sheet-60.jpg) · [标签 第2格](media/structure-labels-60.jpg) |
| 细胞壁 (`cellWall`) | `#/plant/cellWall` | 整体 / 剖面 / 拆解 | 3 | 已复核 · [画面 第3行](media/structure-sheet-60.jpg) · [标签 第3格](media/structure-labels-60.jpg) |
| 纤维素微纤丝 (`cellulose`) | `#/plant/cellWall/cellulose` | 独立视图 | 3 | 已复核 · [画面 第4行](media/structure-sheet-60.jpg) · [标签 第4格](media/structure-labels-60.jpg) |
| β-葡聚糖链 (`glucanChain`) | `#/plant/cellWall/cellulose/glucanChain` | 独立视图 | 2 | 已复核 · [画面 第5行](media/structure-sheet-60.jpg) · [标签 第5格](media/structure-labels-60.jpg) |
| 壁内多糖基质 (`wallMatrix`) | `#/plant/cellWall/wallMatrix` | 独立视图 | 2 | 已复核 · [画面 第6行](media/structure-sheet-60.jpg) · [标签 第6格](media/structure-labels-60.jpg) |
| 胞间连丝 (`plasmodesmata`) | `#/plant/cellWall/plasmodesmata` | 整体 / 剖面 / 拆解 | 2 | 已复核 · [画面 第7行](media/structure-sheet-60.jpg) · [标签 第7格](media/structure-labels-60.jpg) |
| 通道膜衬层 (`pdMembrane`) | `#/plant/cellWall/plasmodesmata/pdMembrane` | 整体 / 剖面 | 1 | 已复核 · [画面 第8行](media/structure-sheet-60.jpg) · [标签 第8格](media/structure-labels-60.jpg) |
| 连丝微管 (`pdDesmotubule`) | `#/plant/cellWall/plasmodesmata/pdDesmotubule` | 独立视图 | 2 | 已复核 · [画面 第9行](media/structure-sheet-60.jpg) · [标签 第9格](media/structure-labels-60.jpg) |
| 细胞膜 (`plantMembrane`) | `#/plant/plantMembrane` | 整体 / 拆解 | 2 | 已复核 · [画面 第10行](media/structure-sheet-60.jpg) · [标签 第10格](media/structure-labels-60.jpg) |
| 质膜H⁺泵 (`plasmaPump`) | `#/plant/plantMembrane/plasmaPump` | 独立视图 | 2 | 已复核 · [画面 第1行](media/structure-sheet-70.jpg) · [标签 第11格](media/structure-labels-60.jpg) |
| 水通道蛋白 (`plantAquaporin`) | `#/plant/plantMembrane/plantAquaporin` | 独立视图 | 2 | 已复核 · [画面 第2行](media/structure-sheet-70.jpg) · [标签 第12格](media/structure-labels-60.jpg) |
| 中央液泡 (`vacuole`) | `#/plant/vacuole` | 整体 / 剖面 / 拆解 | 2 | 已复核 · [画面 第3行](media/structure-sheet-70.jpg) · [标签 第1格](media/structure-labels-72.jpg) |
| 液泡膜 (`tonoplast`) | `#/plant/vacuole/tonoplast` | 整体 / 拆解 | 2 | 已复核 · [画面 第4行](media/structure-sheet-70.jpg) · [标签 第2格](media/structure-labels-72.jpg) |
| 液泡V-ATPase (`vacuolarPump`) | `#/plant/vacuole/tonoplast/vacuolarPump` | 独立视图 | 3 | 已复核 · [画面 第5行](media/structure-sheet-70.jpg) · [标签 第3格](media/structure-labels-72.jpg) |
| 细胞液 (`cellSap`) | `#/plant/vacuole/cellSap` | 独立视图 | 3 | 已复核 · [画面 第6行](media/structure-sheet-70.jpg) · [标签 第4格](media/structure-labels-72.jpg) |
| 叶绿体 (`chloroplast`) | `#/plant/chloroplast` | 整体 / 剖面 / 拆解 | 3 | 已复核 · [画面 第7行](media/structure-sheet-70.jpg) · [标签 第5格](media/structure-labels-72.jpg) |
| 叶绿体被膜 (`chloroplastEnvelope`) | `#/plant/chloroplast/chloroplastEnvelope` | 整体 / 剖面 | 3 | 已复核 · [画面 第8行](media/structure-sheet-70.jpg) · [标签 第6格](media/structure-labels-72.jpg) |
| 类囊体系统 (`thylakoids`) | `#/plant/chloroplast/thylakoids` | 整体 / 剖面 / 拆解 | 2 | 已复核 · [画面 第9行](media/structure-sheet-70.jpg) · [标签 第7格](media/structure-labels-72.jpg) |
| 基粒 (`granum`) | `#/plant/chloroplast/thylakoids/granum` | 整体 / 剖面 | 2 | 已复核 · [画面 第10行](media/structure-sheet-70.jpg) · [标签 第8格](media/structure-labels-72.jpg) |
| 基质片层 (`stromaLamella`) | `#/plant/chloroplast/thylakoids/stromaLamella` | 整体 / 剖面 | 2 | 已复核 · [画面 第1行](media/structure-sheet-80.jpg) · [标签 第9格](media/structure-labels-72.jpg) |
| 叶绿体基质 (`stroma`) | `#/plant/chloroplast/stroma` | 独立视图 | 3 | 已复核 · [画面 第2行](media/structure-sheet-80.jpg) · [标签 第10格](media/structure-labels-72.jpg) |
| 叶绿体DNA (`plastidDNA`) | `#/plant/chloroplast/stroma/plastidDNA` | 独立视图 | 2 | 已复核 · [画面 第3行](media/structure-sheet-80.jpg) · [标签 第11格](media/structure-labels-72.jpg) |
| Rubisco (`rubisco`) | `#/plant/chloroplast/stroma/rubisco` | 独立视图 | 2 | 已复核 · [画面 第4行](media/structure-sheet-80.jpg) · [标签 第12格](media/structure-labels-72.jpg) |
| 细胞核 (`plantNucleus`) | `#/plant/plantNucleus` | 整体 / 剖面 / 拆解 | 4 | 已复核 · [画面 第5行](media/structure-sheet-80.jpg) · [标签 第1格](media/structure-labels-84.jpg) |
| 线粒体 (`plantMitochondria`) | `#/plant/plantMitochondria` | 整体 / 剖面 / 拆解 | 3 | 已复核 · [画面 第6行](media/structure-sheet-80.jpg) · [标签 第2格](media/structure-labels-84.jpg) |
| 线粒体基质 (`plantMatrix`) | `#/plant/plantMitochondria/plantMatrix` | 独立视图 | 3 | 已复核 · [画面 第7行](media/structure-sheet-80.jpg) · [标签 第3格](media/structure-labels-84.jpg) |
| 内质网 (`plantER`) | `#/plant/plantER` | 整体 / 剖面 / 拆解 | 2 | 已复核 · [画面 第8行](media/structure-sheet-80.jpg) · [标签 第4格](media/structure-labels-84.jpg) |
| 膜囊与腔 (`plantCisternae`) | `#/plant/plantER/plantCisternae` | 整体 / 剖面 | 2 | 已复核 · [画面 第9行](media/structure-sheet-80.jpg) · [标签 第5格](media/structure-labels-84.jpg) |
| 细胞质核糖体 (`plantRibosome`) | `#/plant/plantER/plantRibosome` | 整体 / 拆解 | 4 | 已复核 · [画面 第10行](media/structure-sheet-80.jpg) · [标签 第6格](media/structure-labels-84.jpg) |
| 60S大亚基 (`plant60S`) | `#/plant/plantER/plantRibosome/plant60S` | 独立视图 | 2 | 已复核 · [画面 第1行](media/structure-sheet-90.jpg) · [标签 第7格](media/structure-labels-84.jpg) |
| 40S小亚基 (`plant40S`) | `#/plant/plantER/plantRibosome/plant40S` | 独立视图 | 2 | 已复核 · [画面 第2行](media/structure-sheet-90.jpg) · [标签 第8格](media/structure-labels-84.jpg) |
| 高尔基体 (`plantGolgi`) | `#/plant/plantGolgi` | 整体 / 剖面 / 拆解 | 2 | 已复核 · [画面 第3行](media/structure-sheet-90.jpg) · [标签 第9格](media/structure-labels-84.jpg) |
| 细胞质基质 (`plantCytoplasm`) | `#/plant/plantCytoplasm` | 独立视图 | 2 | 已复核 · [画面 第4行](media/structure-sheet-90.jpg) · [标签 第10格](media/structure-labels-84.jpg) |
| 细菌 (`bacterium`) | `#/bacterium` | 整体 / 剖面 / 拆解 | 7 | 已复核 · [画面 第5行](media/structure-sheet-90.jpg) · [标签 第11格](media/structure-labels-84.jpg) |
| 细胞包被 (`bacterialEnvelope`) | `#/bacterium/bacterialEnvelope` | 整体 / 拆解 | 3 | 已复核 · [画面 第6行](media/structure-sheet-90.jpg) · [标签 第12格](media/structure-labels-84.jpg) |
| 外膜 (`bacterialOuter`) | `#/bacterium/bacterialEnvelope/bacterialOuter` | 整体 / 拆解 | 2 | 已复核 · [画面 第7行](media/structure-sheet-90.jpg) · [标签 第1格](media/structure-labels-96.jpg) |
| 脂多糖 (`lps`) | `#/bacterium/bacterialEnvelope/bacterialOuter/lps` | 独立视图 | 3 | 已复核 · [画面 第8行](media/structure-sheet-90.jpg) · [标签 第2格](media/structure-labels-96.jpg) |
| 孔蛋白 (`porin`) | `#/bacterium/bacterialEnvelope/bacterialOuter/porin` | 独立视图 | 2 | 已复核 · [画面 第9行](media/structure-sheet-90.jpg) · [标签 第3格](media/structure-labels-96.jpg) |
| 肽聚糖（细胞壁） (`peptidoglycan`) | `#/bacterium/bacterialEnvelope/peptidoglycan` | 独立视图 | 3 | 已复核 · [画面 第10行](media/structure-sheet-90.jpg) · [标签 第4格](media/structure-labels-96.jpg) |
| 细胞膜 (`bacterialMembrane`) | `#/bacterium/bacterialEnvelope/bacterialMembrane` | 整体 / 拆解 | 1 | 已复核 · [画面 第1行](media/structure-sheet-100.jpg) · [标签 第5格](media/structure-labels-96.jpg) |
| F型ATP合酶 (`bacterialATPase`) | `#/bacterium/bacterialEnvelope/bacterialMembrane/bacterialATPase` | 独立视图 | 2 | 已复核 · [画面 第2行](media/structure-sheet-100.jpg) · [标签 第6格](media/structure-labels-96.jpg) |
| 拟核 (`nucleoid`) | `#/bacterium/nucleoid` | 整体 / 拆解 | 2 | 已复核 · [画面 第3行](media/structure-sheet-100.jpg) · [标签 第7格](media/structure-labels-96.jpg) |
| DNA片段 (`bacterialDNA`) | `#/bacterium/nucleoid/bacterialDNA` | 独立视图 | 2 | 已复核 · [画面 第4行](media/structure-sheet-100.jpg) · [标签 第8格](media/structure-labels-96.jpg) |
| 拟核相关蛋白 (`nucleoidProteins`) | `#/bacterium/nucleoid/nucleoidProteins` | 独立视图 | 1 | 已复核 · [画面 第5行](media/structure-sheet-100.jpg) · [标签 第9格](media/structure-labels-96.jpg) |
| 质粒 (`plasmids`) | `#/bacterium/plasmids` | 独立视图 | 2 | 已复核 · [画面 第6行](media/structure-sheet-100.jpg) · [标签 第10格](media/structure-labels-96.jpg) |
| 70S核糖体 (`bacterialRibosome`) | `#/bacterium/bacterialRibosome` | 整体 / 拆解 | 2 | 已复核 · [画面 第7行](media/structure-sheet-100.jpg) · [标签 第11格](media/structure-labels-96.jpg) |
| 50S大亚基 (`bacterial50S`) | `#/bacterium/bacterialRibosome/bacterial50S` | 独立视图 | 2 | 已复核 · [画面 第8行](media/structure-sheet-100.jpg) · [标签 第12格](media/structure-labels-96.jpg) |
| 30S小亚基 (`bacterial30S`) | `#/bacterium/bacterialRibosome/bacterial30S` | 独立视图 | 2 | 已复核 · [画面 第9行](media/structure-sheet-100.jpg) · [标签 第1格](media/structure-labels-108.jpg) |
| 细胞质 (`bacterialCytoplasm`) | `#/bacterium/bacterialCytoplasm` | 独立视图 | 2 | 已复核 · [画面 第10行](media/structure-sheet-100.jpg) · [标签 第2格](media/structure-labels-108.jpg) |
| 菌毛 (`pili`) | `#/bacterium/pili` | 整体 / 拆解 | 2 | 已复核 · [画面 第1行](media/structure-sheet-110.jpg) · [标签 第3格](media/structure-labels-108.jpg) |
| 菌毛杆 (`pilusRod`) | `#/bacterium/pili/pilusRod` | 独立视图 | 1 | 已复核 · [画面 第2行](media/structure-sheet-110.jpg) · [标签 第4格](media/structure-labels-108.jpg) |
| 黏附尖端 (`pilusTip`) | `#/bacterium/pili/pilusTip` | 独立视图 | 3 | 已复核 · [画面 第3行](media/structure-sheet-110.jpg) · [标签 第5格](media/structure-labels-108.jpg) |
| 鞭毛 (`flagellum`) | `#/bacterium/flagellum` | 整体 / 剖面 / 拆解 | 3 | 已复核 · [画面 第4行](media/structure-sheet-110.jpg) · [标签 第6格](media/structure-labels-108.jpg) |
| 鞭毛丝 (`flagellarFilament`) | `#/bacterium/flagellum/flagellarFilament` | 整体 / 剖面 | 2 | 已复核 · [画面 第5行](media/structure-sheet-110.jpg) · [标签 第7格](media/structure-labels-108.jpg) |
| 弯钩 (`flagellarHook`) | `#/bacterium/flagellum/flagellarHook` | 整体 / 剖面 | 2 | 已复核 · [画面 第6行](media/structure-sheet-110.jpg) · [标签 第8格](media/structure-labels-108.jpg) |
| 基部马达 (`flagellarMotor`) | `#/bacterium/flagellum/flagellarMotor` | 整体 / 剖面 / 拆解 | 3 | 已复核 · [画面 第7行](media/structure-sheet-110.jpg) · [标签 第9格](media/structure-labels-108.jpg) |
| 转子与C环 (`motorRotor`) | `#/bacterium/flagellum/flagellarMotor/motorRotor` | 整体 / 剖面 | 2 | 已复核 · [画面 第8行](media/structure-sheet-110.jpg) · [标签 第10格](media/structure-labels-108.jpg) |
| 杆与LP支承环 (`motorBushing`) | `#/bacterium/flagellum/flagellarMotor/motorBushing` | 整体 / 剖面 | 3 | 已复核 · [画面 第9行](media/structure-sheet-110.jpg) · [标签 第11格](media/structure-labels-108.jpg) |
| 定子复合体 (`motorStator`) | `#/bacterium/flagellum/flagellarMotor/motorStator` | 独立视图 | 2 | 已复核 · [画面 第10行](media/structure-sheet-110.jpg) · [标签 第12格](media/structure-labels-108.jpg) |
| 酵母菌 (`yeast`) | `#/yeast` | 整体 / 剖面 / 拆解 | 7 | 已复核 · [画面 第1行](media/structure-sheet-120.jpg) · [标签 第1格](media/structure-labels-120.jpg) |
| 细胞壁 (`yeastWall`) | `#/yeast/yeastWall` | 整体 / 拆解 | 2 | 已复核 · [画面 第2行](media/structure-sheet-120.jpg) · [标签 第2格](media/structure-labels-120.jpg) |
| 葡聚糖网络 (`yeastGlucan`) | `#/yeast/yeastWall/yeastGlucan` | 独立视图 | 0 | 已复核 · [画面 第3行](media/structure-sheet-120.jpg) · [标签 第3格](media/structure-labels-120.jpg) |
| 甘露糖蛋白 (`yeastMannan`) | `#/yeast/yeastWall/yeastMannan` | 独立视图 | 0 | 已复核 · [画面 第4行](media/structure-sheet-120.jpg) · [标签 第4格](media/structure-labels-120.jpg) |
| 细胞膜 (`yeastMembrane`) | `#/yeast/yeastMembrane` | 独立视图 | 0 | 已复核 · [画面 第5行](media/structure-sheet-120.jpg) · [标签 第5格](media/structure-labels-120.jpg) |
| 细胞核 (`yeastNucleus`) | `#/yeast/yeastNucleus` | 整体 / 剖面 / 拆解 | 4 | 已复核 · [画面 第6行](media/structure-sheet-120.jpg) · [标签 第6格](media/structure-labels-120.jpg) |
| 核被膜 (`yeastNuclearEnvelope`) | `#/yeast/yeastNucleus/yeastNuclearEnvelope` | 独立视图 | 4 | 已复核 · [画面 第7行](media/structure-sheet-120.jpg) · [标签 第7格](media/structure-labels-120.jpg) |
| 核孔复合体 (`yeastNuclearPores`) | `#/yeast/yeastNucleus/yeastNuclearPores` | 独立视图 | 3 | 已复核 · [画面 第8行](media/structure-sheet-120.jpg) · [标签 第8格](media/structure-labels-120.jpg) |
| 染色质 (`yeastChromatin`) | `#/yeast/yeastNucleus/yeastChromatin` | 独立视图 | 2 | 已复核 · [画面 第9行](media/structure-sheet-120.jpg) · [标签 第9格](media/structure-labels-120.jpg) |
| 核仁 (`yeastNucleolus`) | `#/yeast/yeastNucleus/yeastNucleolus` | 独立视图 | 2 | 已复核 · [画面 第10行](media/structure-sheet-120.jpg) · [标签 第10格](media/structure-labels-120.jpg) |
| 液泡 (`yeastVacuole`) | `#/yeast/yeastVacuole` | 整体 / 剖面 | 0 | 已复核 · [画面 第1行](media/structure-sheet-130.jpg) · [标签 第11格](media/structure-labels-120.jpg) |
| 线粒体 (`yeastMito`) | `#/yeast/yeastMito` | 整体 / 剖面 | 0 | 已复核 · [画面 第2行](media/structure-sheet-130.jpg) · [标签 第12格](media/structure-labels-120.jpg) |
| 内质网 (`yeastER`) | `#/yeast/yeastER` | 整体 / 剖面 | 0 | 已复核 · [画面 第3行](media/structure-sheet-130.jpg) · [标签 第1格](media/structure-labels-132.jpg) |
| 芽体与芽颈 (`yeastBud`) | `#/yeast/yeastBud` | 整体 / 剖面 / 拆解 | 1 | 已复核 · [画面 第4行](media/structure-sheet-130.jpg) · [标签 第2格](media/structure-labels-132.jpg) |
| 芽颈与分裂隔膜 (`yeastSeptum`) | `#/yeast/yeastBud/yeastSeptum` | 独立视图 | 2 | 已复核 · [画面 第5行](media/structure-sheet-130.jpg) · [标签 第3格](media/structure-labels-132.jpg) |
| 草履虫 (`paramecium`) | `#/paramecium` | 整体 / 剖面 / 拆解 | 9 | 已复核 · [画面 第6行](media/structure-sheet-130.jpg) · [标签 第4格](media/structure-labels-132.jpg) |
| 表膜与皮层 (`paraSurface`) | `#/paramecium/paraSurface` | 整体 / 剖面 | 0 | 已复核 · [画面 第7行](media/structure-sheet-130.jpg) · [标签 第5格](media/structure-labels-132.jpg) |
| 纤毛 (`paraCilia`) | `#/paramecium/paraCilia` | 整体 / 拆解 | 1 | 已复核 · [画面 第8行](media/structure-sheet-130.jpg) · [标签 第6格](media/structure-labels-132.jpg) |
| 纤毛轴丝 (`paraAxoneme`) | `#/paramecium/paraCilia/paraAxoneme` | 独立视图 | 3 | 已复核 · [画面 第9行](media/structure-sheet-130.jpg) · [标签 第7格](media/structure-labels-132.jpg) |
| 口沟与胞口 (`paraOral`) | `#/paramecium/paraOral` | 独立视图 | 2 | 已复核 · [画面 第10行](media/structure-sheet-130.jpg) · [标签 第8格](media/structure-labels-132.jpg) |
| 食物泡 (`paraFood`) | `#/paramecium/paraFood` | 整体 / 剖面 | 0 | 已复核 · [画面 第1行](media/structure-sheet-140.jpg) · [标签 第9格](media/structure-labels-132.jpg) |
| 伸缩泡复合体 (`paraContractile`) | `#/paramecium/paraContractile` | 整体 / 拆解 | 1 | 已复核 · [画面 第2行](media/structure-sheet-140.jpg) · [标签 第10格](media/structure-labels-132.jpg) |
| 收集管与壶腹 (`paraRadial`) | `#/paramecium/paraContractile/paraRadial` | 独立视图 | 3 | 已复核 · [画面 第3行](media/structure-sheet-140.jpg) · [标签 第11格](media/structure-labels-132.jpg) |
| 大核 (`paraMacro`) | `#/paramecium/paraMacro` | 整体 / 剖面 / 拆解 | 4 | 已复核 · [画面 第4行](media/structure-sheet-140.jpg) · [标签 第12格](media/structure-labels-132.jpg) |
| 核被膜 (`paraMacroEnvelope`) | `#/paramecium/paraMacro/paraMacroEnvelope` | 独立视图 | 4 | 已复核 · [画面 第5行](media/structure-sheet-140.jpg) · [标签 第1格](media/structure-labels-144.jpg) |
| 核孔复合体 (`paraMacroPores`) | `#/paramecium/paraMacro/paraMacroPores` | 独立视图 | 3 | 已复核 · [画面 第6行](media/structure-sheet-140.jpg) · [标签 第2格](media/structure-labels-144.jpg) |
| 染色质 (`paraMacroChromatin`) | `#/paramecium/paraMacro/paraMacroChromatin` | 独立视图 | 2 | 已复核 · [画面 第7行](media/structure-sheet-140.jpg) · [标签 第3格](media/structure-labels-144.jpg) |
| 核仁 (`paraMacroNucleoli`) | `#/paramecium/paraMacro/paraMacroNucleoli` | 独立视图 | 2 | 已复核 · [画面 第8行](media/structure-sheet-140.jpg) · [标签 第4格](media/structure-labels-144.jpg) |
| 小核 (`paraMicro`) | `#/paramecium/paraMicro` | 整体 / 剖面 / 拆解 | 3 | 已复核 · [画面 第9行](media/structure-sheet-140.jpg) · [标签 第5格](media/structure-labels-144.jpg) |
| 核被膜 (`paraMicroEnvelope`) | `#/paramecium/paraMicro/paraMicroEnvelope` | 独立视图 | 4 | 已复核 · [画面 第10行](media/structure-sheet-140.jpg) · [标签 第6格](media/structure-labels-144.jpg) |
| 核孔复合体 (`paraMicroPores`) | `#/paramecium/paraMicro/paraMicroPores` | 独立视图 | 3 | 已复核 · [画面 第1行](media/structure-sheet-150.jpg) · [标签 第7格](media/structure-labels-144.jpg) |
| 染色质 (`paraMicroChromatin`) | `#/paramecium/paraMicro/paraMicroChromatin` | 独立视图 | 2 | 已复核 · [画面 第2行](media/structure-sheet-150.jpg) · [标签 第8格](media/structure-labels-144.jpg) |
| 刺丝泡 (`paraTrichocysts`) | `#/paramecium/paraTrichocysts` | 独立视图 | 0 | 已复核 · [画面 第3行](media/structure-sheet-150.jpg) · [标签 第9格](media/structure-labels-144.jpg) |
| 线粒体 (`paraMito`) | `#/paramecium/paraMito` | 整体 / 剖面 | 1 | 已复核 · [画面 第4行](media/structure-sheet-150.jpg) · [标签 第10格](media/structure-labels-144.jpg) |
| T₂噬菌体 (`phage`) | `#/phage` | 整体 / 剖面 / 拆解 | 5 | 已复核 · [画面 第5行](media/structure-sheet-150.jpg) · [标签 第11格](media/structure-labels-144.jpg) |
| 头部衣壳 (`phageHead`) | `#/phage/phageHead` | 整体 / 剖面 | 2 | 已复核 · [画面 第6行](media/structure-sheet-150.jpg) · [标签 第12格](media/structure-labels-144.jpg) |
| 衣壳蛋白排列 (`phageCapsomers`) | `#/phage/phageHead/phageCapsomers` | 独立视图 | 0 | 已复核 · [画面 第7行](media/structure-sheet-150.jpg) · [标签 第1格](media/structure-labels-156.jpg) |
| 双链DNA (`phageGenome`) | `#/phage/phageGenome` | 独立视图 | 2 | 已复核 · [画面 第8行](media/structure-sheet-150.jpg) · [标签 第2格](media/structure-labels-156.jpg) |
| 尾部 (`phageTail`) | `#/phage/phageTail` | 整体 / 剖面 / 拆解 | 2 | 已复核 · [画面 第9行](media/structure-sheet-150.jpg) · [标签 第3格](media/structure-labels-156.jpg) |
| 尾鞘 (`phageSheath`) | `#/phage/phageTail/phageSheath` | 整体 / 剖面 | 0 | 已复核 · [画面 第10行](media/structure-sheet-150.jpg) · [标签 第4格](media/structure-labels-156.jpg) |
| 尾管 (`phageTube`) | `#/phage/phageTail/phageTube` | 独立视图 | 0 | 已复核 · [画面 第1行](media/structure-sheet-160.jpg) · [标签 第5格](media/structure-labels-156.jpg) |
| 基板 (`phageBaseplate`) | `#/phage/phageBaseplate` | 独立视图 | 0 | 已复核 · [画面 第2行](media/structure-sheet-160.jpg) · [标签 第6格](media/structure-labels-156.jpg) |
| 尾纤维 (`phageFibers`) | `#/phage/phageFibers` | 独立视图 | 0 | 已复核 · [画面 第3行](media/structure-sheet-160.jpg) · [标签 第7格](media/structure-labels-156.jpg) |
