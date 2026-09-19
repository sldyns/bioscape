# 全部模型复查 · 2026-09-18

本次重新检查动物、植物、细菌 **120 个独立模型**，逐一查看默认画面，并对原有 45 个多部件模型比较整体/拆解，共 90 个状态。198 是自动检查的路由数，不是 198 次人工视觉检查。此前植物/细菌检查未发现的教学表达问题，在本轮补正。

## 本次修正

- **细菌的外层结构**：标题用易理解的中文，上方明确“细菌表面的一小块”，保留 Cell envelope 专业名称。模型中外膜、肽聚糖层和内膜靠拢，补含水周质及外膜—细胞壁连接；只有拆解时拉开。透明周质不拦截点击。
- **位置语境**：所有局部页面增加所属位置说明；膜片、菌毛、鞭毛、DNA片段、分子样本与过程示意分别说明。查看局部时仍可看到所属细胞类型；一级返回按钮直接说明目的地。
- **模型关系**：修正核糖体示意亚基间隙、细菌核糖体拆解距离、植物膜蛋白穿插、液泡与内质网拆解重叠。植物线粒体DNA使用开放片段；基质片层淡化参考基粒；溶酶体质子泵缩小周围膜参照，真正放大所选结构。
- **有意义的模式**：整体统一称“整体 / Whole”。细胞质基质、叶绿体基质、线粒体基质、氧化酶样本取消拆解，避免暗示独立分子属于一个组装体；当前 41 个模型提供拆解。
- **拆解取景**：由真实部件包围盒计算距离，分离程度变化时保留旋转方向并调整取景。切换目录时不再短暂沿用上个模型的控件能力。没有减少几何精度或材质质量。

## 验证证据与边界

| 检查 | 本轮结果 |
| --- | --- |
| 全部默认视图 | 120 个模型逐项截图检查，名称/当前节点/默认状态/上下文/页面横向溢出均通过；最终修改另复看 15 个视图 |
| 整体/拆解 | 45 对画面对照；复核后移除 4 个不适合拆解的分子样本控件；液泡和植物内质网最终距离另截图复测 |
| 自动模型回归 | 120 节点、198 路由、117 局部模型传输、1367 网格，0 错误 |
| 取景几何回归 | 多部件模型在 0/60/100% 分离、0.45/1.2 宽高比、正面/斜向视角下，部件边界保持在视锥内 |
| 实际交互 | 鼠标旋转后最大分离、直接点击内膜进入下一级、返回外层结构再返回细菌；控制状态与渲染状态一致 |
| 窄屏与双语 | 320×740 英文触控模拟复查 9 个代表视图，模式按钮均在宽度内，无页面横向溢出；细菌外层触控最大分离可用；另查看中文视口 |
| 生产预览 | 本地 4173 的细菌外层、植物细胞膜、溶酶体质子泵、动物总览可加载，无控制台错误/警告 |
| 构建与格式 | npm run verify / build / format:check 均通过 |

手机仍是浏览器窄屏及粗指针模拟，未做真实设备实测。交互抽查不是对所有点击坐标逐一穷举；模型是教学示意，非真实比例或全原子模拟。全页长截图出现浏览器拼接空白/重复，因此保留单视口图，并核对页面实际高度为 1218px，避免把拼接伪影当成页面布局。

细菌包被关系参考：[Essentials of Glycobiology, Eubacteria](https://www.ncbi.nlm.nih.gov/books/NBK579948/)：革兰阴性细菌两层膜之间为含水周质，薄肽聚糖位于其中；外膜与细胞壁存在连接。厚度与分子比例在本模型中仍为可读性调整后的示意。

## 重点截图

- [细菌外层默认整体](model-recheck/bacterialEnvelope.jpg)、[旋转后最大拆解](model-recheck/envelope-max-rotated.jpg)
- [液泡拆解](model-recheck/vacuole-explode-final.jpg)、[植物内质网拆解](model-recheck/plantER-explode-final.jpg)
- [基质片层](model-recheck/stromaLamella.jpg)、[质子泵](model-recheck/lysosomalPump.jpg)、[320宽中文视口](model-recheck/envelope-mobile-viewport.jpg)

## 逐模型记录

截图使用最终修改后复测图（有复测时），其他为本轮逐项默认视图。原始状态与补测记录见 [JSON](model-recheck-2026-09-18.json)。

| 模型 | 实际检查入口 | 截图 |
| --- | --- | --- |
| 细菌 · Bacterium | `#/bacterium` | [已检查](model-recheck/bacterium.jpg) |
| 细菌的外层结构 · Cell envelope | `#/bacterium/bacterialEnvelope` | [已检查](model-recheck/bacterialEnvelope.jpg) |
| 外膜 · Outer membrane | `#/bacterium/bacterialEnvelope/bacterialOuter` | [已检查](model-recheck/bacterialOuter.jpg) |
| 脂多糖 · Lipopolysaccharide | `#/bacterium/bacterialEnvelope/bacterialOuter/lps` | [已检查](model-recheck/lps.jpg) |
| 孔蛋白 · Porin | `#/bacterium/bacterialEnvelope/bacterialOuter/porin` | [已检查](model-recheck/porin.jpg) |
| 肽聚糖（细胞壁） · Peptidoglycan | `#/bacterium/bacterialEnvelope/peptidoglycan` | [已检查](model-recheck/peptidoglycan.jpg) |
| 细胞膜 · Cytoplasmic membrane | `#/bacterium/bacterialEnvelope/bacterialMembrane` | [已检查](model-recheck/bacterialMembrane.jpg) |
| F型ATP合酶 · F-type ATP synthase | `#/bacterium/bacterialEnvelope/bacterialMembrane/bacterialATPase` | [已检查](model-recheck/bacterialATPase.jpg) |
| 拟核 · Nucleoid | `#/bacterium/nucleoid` | [已检查](model-recheck/nucleoid.jpg) |
| DNA片段 · DNA segment | `#/bacterium/nucleoid/bacterialDNA` | [已检查](model-recheck/bacterialDNA.jpg) |
| 拟核相关蛋白 · Nucleoid-associated proteins | `#/bacterium/nucleoid/nucleoidProteins` | [已检查](model-recheck/nucleoidProteins.jpg) |
| 质粒 · Plasmids | `#/bacterium/plasmids` | [已检查](model-recheck/plasmids.jpg) |
| 70S核糖体 · 70S ribosome | `#/bacterium/bacterialRibosome` | [已检查](model-recheck/bacterialRibosome.jpg) |
| 50S大亚基 · 50S large subunit | `#/bacterium/bacterialRibosome/bacterial50S` | [已检查](model-recheck/bacterial50S.jpg) |
| 30S小亚基 · 30S small subunit | `#/bacterium/bacterialRibosome/bacterial30S` | [已检查](model-recheck/bacterial30S.jpg) |
| 细胞质 · Cytoplasm | `#/bacterium/bacterialCytoplasm` | [已检查](model-recheck/bacterialCytoplasm.jpg) |
| 菌毛 · Pili | `#/bacterium/pili` | [已检查](model-recheck/pili.jpg) |
| 菌毛杆 · Pilus rod | `#/bacterium/pili/pilusRod` | [已检查](model-recheck/pilusRod.jpg) |
| 黏附尖端 · Adhesive tip | `#/bacterium/pili/pilusTip` | [已检查](model-recheck/pilusTip.jpg) |
| 鞭毛 · Flagellum | `#/bacterium/flagellum` | [已检查](model-recheck/flagellum.jpg) |
| 鞭毛丝 · Flagellar filament | `#/bacterium/flagellum/flagellarFilament` | [已检查](model-recheck/flagellarFilament.jpg) |
| 弯钩 · Hook | `#/bacterium/flagellum/flagellarHook` | [已检查](model-recheck/flagellarHook.jpg) |
| 基部马达 · Basal motor | `#/bacterium/flagellum/flagellarMotor` | [已检查](model-recheck/flagellarMotor.jpg) |
| 转子与C环 · Rotor and C ring | `#/bacterium/flagellum/flagellarMotor/motorRotor` | [已检查](model-recheck/motorRotor.jpg) |
| 杆与LP支承环 · Rod and LP bushing | `#/bacterium/flagellum/flagellarMotor/motorBushing` | [已检查](model-recheck/motorBushing.jpg) |
| 定子复合体 · Stator complexes | `#/bacterium/flagellum/flagellarMotor/motorStator` | [已检查](model-recheck/motorStator.jpg) |
| 植物细胞 · Plant cell | `#/plant` | [已检查](model-recheck/plant.jpg) |
| 细胞壁 · Cell wall | `#/plant/cellWall` | [已检查](model-recheck/cellWall.jpg) |
| 纤维素微纤丝 · Cellulose microfibrils | `#/plant/cellWall/cellulose` | [已检查](model-recheck/cellulose.jpg) |
| β-葡聚糖链 · Beta-glucan chain | `#/plant/cellWall/cellulose/glucanChain` | [已检查](model-recheck/glucanChain.jpg) |
| 壁内多糖基质 · Wall polysaccharide matrix | `#/plant/cellWall/wallMatrix` | [已检查](model-recheck/wallMatrix.jpg) |
| 胞间连丝 · Plasmodesmata | `#/plant/cellWall/plasmodesmata` | [已检查](model-recheck/plasmodesmata.jpg) |
| 通道膜衬层 · Channel membrane lining | `#/plant/cellWall/plasmodesmata/pdMembrane` | [已检查](model-recheck/pdMembrane.jpg) |
| 连丝微管 · Desmotubule | `#/plant/cellWall/plasmodesmata/pdDesmotubule` | [已检查](model-recheck/pdDesmotubule.jpg) |
| 细胞膜 · Plasma membrane | `#/plant/plantMembrane` | [已检查](model-recheck/plantMembrane.jpg) |
| 质膜H⁺泵 · Plasma-membrane H+ pump | `#/plant/plantMembrane/plasmaPump` | [已检查](model-recheck/plasmaPump.jpg) |
| 水通道蛋白 · Aquaporin | `#/plant/plantMembrane/plantAquaporin` | [已检查](model-recheck/plantAquaporin.jpg) |
| 中央液泡 · Central vacuole | `#/plant/vacuole` | [已检查](model-recheck/vacuole.jpg) |
| 液泡膜 · Tonoplast | `#/plant/vacuole/tonoplast` | [已检查](model-recheck/tonoplast.jpg) |
| 液泡V-ATPase · Vacuolar V-ATPase | `#/plant/vacuole/tonoplast/vacuolarPump` | [已检查](model-recheck/vacuolarPump.jpg) |
| 细胞液 · Cell sap | `#/plant/vacuole/cellSap` | [已检查](model-recheck/cellSap.jpg) |
| 叶绿体 · Chloroplast | `#/plant/chloroplast` | [已检查](model-recheck/chloroplast.jpg) |
| 叶绿体被膜 · Chloroplast envelope | `#/plant/chloroplast/chloroplastEnvelope` | [已检查](model-recheck/chloroplastEnvelope.jpg) |
| 类囊体系统 · Thylakoid system | `#/plant/chloroplast/thylakoids` | [已检查](model-recheck/thylakoids.jpg) |
| 基粒 · Granum | `#/plant/chloroplast/thylakoids/granum` | [已检查](model-recheck/granum.jpg) |
| 基质片层 · Stroma lamellae | `#/plant/chloroplast/thylakoids/stromaLamella` | [已检查](model-recheck/stromaLamella.jpg) |
| 叶绿体基质 · Stroma | `#/plant/chloroplast/stroma` | [已检查](model-recheck/stroma.jpg) |
| 叶绿体DNA · Chloroplast DNA | `#/plant/chloroplast/stroma/plastidDNA` | [已检查](model-recheck/plastidDNA.jpg) |
| Rubisco · Rubisco | `#/plant/chloroplast/stroma/rubisco` | [已检查](model-recheck/rubisco.jpg) |
| 细胞核 · Nucleus | `#/plant/plantNucleus` | [已检查](model-recheck/plantNucleus.jpg) |
| 线粒体 · Mitochondrion | `#/plant/plantMitochondria` | [已检查](model-recheck/plantMitochondria.jpg) |
| 线粒体基质 · Mitochondrial matrix | `#/plant/plantMitochondria/plantMatrix` | [已检查](model-recheck/plantMatrix.jpg) |
| 内质网 · Endoplasmic reticulum | `#/plant/plantER` | [已检查](model-recheck/plantER.jpg) |
| 膜囊与腔 · Cisternae and lumen | `#/plant/plantER/plantCisternae` | [已检查](model-recheck/plantCisternae.jpg) |
| 细胞质核糖体 · Cytosolic ribosome | `#/plant/plantER/plantRibosome` | [已检查](model-recheck/plantRibosome.jpg) |
| 60S大亚基 · 60S large subunit | `#/plant/plantER/plantRibosome/plant60S` | [已检查](model-recheck/plant60S.jpg) |
| 40S小亚基 · 40S small subunit | `#/plant/plantER/plantRibosome/plant40S` | [已检查](model-recheck/plant40S.jpg) |
| 高尔基体 · Golgi apparatus | `#/plant/plantGolgi` | [已检查](model-recheck/plantGolgi.jpg) |
| 细胞质基质 · Cytosol | `#/plant/plantCytoplasm` | [已检查](model-recheck/plantCytoplasm.jpg) |
| 动物细胞 · Animal cell | `#/cell` | [已检查](model-recheck/cell.jpg) |
| 细胞膜 · Plasma membrane | `#/cell/membrane` | [已检查](model-recheck/membrane.jpg) |
| 磷脂双分子层 · Lipid bilayer | `#/cell/membrane/bilayer` | [已检查](model-recheck/bilayer.jpg) |
| 膜蛋白 · Membrane proteins | `#/cell/membrane/membraneProteins` | [已检查](model-recheck/membraneProteins.jpg) |
| 膜表面糖链 · Surface glycans | `#/cell/membrane/glycans` | [已检查](model-recheck/glycans.jpg) |
| 细胞质 · Cytoplasm | `#/cell/cytoplasm` | [已检查](model-recheck/cytoplasm.jpg) |
| 细胞质基质 · Cytosol | `#/cell/cytoplasm/cytosol` | [已检查](model-recheck/cytosol.jpg) |
| 可溶性代谢酶 · Soluble metabolic enzyme | `#/cell/cytoplasm/cytosol/cytosolicEnzyme` | [已检查](model-recheck/cytosolicEnzyme.jpg) |
| 水与离子 · Water and ions | `#/cell/cytoplasm/cytosol/waterIons` | [已检查](model-recheck/waterIons.jpg) |
| 线粒体 · Mitochondrion | `#/cell/cytoplasm/mitochondria` | [已检查](model-recheck/mitochondria.jpg) |
| 外膜 · Outer membrane | `#/cell/cytoplasm/mitochondria/mitoOuter` | [已检查](model-recheck/mitoOuter.jpg) |
| 内膜 · Inner membrane | `#/cell/cytoplasm/mitochondria/mitoInner` | [已检查](model-recheck/mitoInner.jpg) |
| 线粒体嵴 · Cristae | `#/cell/cytoplasm/mitochondria/mitoInner/cristae` | [已检查](model-recheck/cristae.jpg) |
| ATP 合酶 · ATP synthase | `#/cell/cytoplasm/mitochondria/mitoInner/atpSynthase` | [已检查](model-recheck/atpSynthase.jpg) |
| 线粒体基质 · Mitochondrial matrix | `#/cell/cytoplasm/mitochondria/matrix` | [已检查](model-recheck/matrix.jpg) |
| 线粒体 DNA · Mitochondrial DNA | `#/cell/cytoplasm/mitochondria/matrix/mitoDNA` | [已检查](model-recheck/mitoDNA.jpg) |
| 粗面内质网 · Rough ER | `#/cell/cytoplasm/roughER` | [已检查](model-recheck/roughER.jpg) |
| 膜囊与腔 · Cisternae and lumen | `#/cell/cytoplasm/roughER/erCisternae` | [已检查](model-recheck/erCisternae.jpg) |
| 附着核糖体 · Bound ribosomes | `#/cell/cytoplasm/roughER/boundRibosomes` | [已检查](model-recheck/boundRibosomes.jpg) |
| 大亚基 · Large subunit | `#/cell/cytoplasm/roughER/boundRibosomes/largeSubunit` | [已检查](model-recheck/largeSubunit.jpg) |
| 小亚基 · Small subunit | `#/cell/cytoplasm/roughER/boundRibosomes/smallSubunit` | [已检查](model-recheck/smallSubunit.jpg) |
| mRNA · Messenger RNA | `#/cell/cytoplasm/roughER/boundRibosomes/mrna` | [已检查](model-recheck/mrna.jpg) |
| tRNA · Transfer RNA | `#/cell/cytoplasm/roughER/boundRibosomes/trna` | [已检查](model-recheck/trna.jpg) |
| 光面内质网 · Smooth ER | `#/cell/cytoplasm/smoothER` | [已检查](model-recheck/smoothER.jpg) |
| 管状膜网络 · Tubular membrane network | `#/cell/cytoplasm/smoothER/erTubules` | [已检查](model-recheck/erTubules.jpg) |
| 高尔基体 · Golgi apparatus | `#/cell/cytoplasm/golgi` | [已检查](model-recheck/golgi.jpg) |
| 扁平膜囊 · Flattened cisternae | `#/cell/cytoplasm/golgi/golgiCisternae` | [已检查](model-recheck/golgiCisternae.jpg) |
| 运输囊泡 · Transport vesicles | `#/cell/cytoplasm/golgi/vesicles` | [已检查](model-recheck/vesicles.jpg) |
| 囊泡膜 · Vesicle membrane | `#/cell/cytoplasm/golgi/vesicles/vesicleMembrane` | [已检查](model-recheck/vesicleMembrane.jpg) |
| 运输货物 · Transport cargo | `#/cell/cytoplasm/golgi/vesicles/cargo` | [已检查](model-recheck/cargo.jpg) |
| 核糖体 · Ribosome | `#/cell/cytoplasm/ribosomes` | [已检查](model-recheck/ribosomes.jpg) |
| 溶酶体 · Lysosome | `#/cell/cytoplasm/lysosome` | [已检查](model-recheck/lysosome.jpg) |
| 溶酶体膜 · Lysosomal membrane | `#/cell/cytoplasm/lysosome/lysosomalMembrane` | [已检查](model-recheck/lysosomalMembrane.jpg) |
| 质子泵 · Proton pump | `#/cell/cytoplasm/lysosome/lysosomalMembrane/lysosomalPump` | [已检查](model-recheck/lysosomalPump.jpg) |
| 酸性水解酶 · Acid hydrolases | `#/cell/cytoplasm/lysosome/hydrolases` | [已检查](model-recheck/hydrolases.jpg) |
| 回收材料 · Material for recycling | `#/cell/cytoplasm/lysosome/recycling` | [已检查](model-recheck/recycling.jpg) |
| 过氧化物酶体 · Peroxisome | `#/cell/cytoplasm/peroxisome` | [已检查](model-recheck/peroxisome.jpg) |
| 过氧化物酶体膜 · Peroxisomal membrane | `#/cell/cytoplasm/peroxisome/peroxisomalMembrane` | [已检查](model-recheck/peroxisomalMembrane.jpg) |
| 氧化酶与过氧化氢酶 · Oxidases and catalase | `#/cell/cytoplasm/peroxisome/oxidativeEnzymes` | [已检查](model-recheck/oxidativeEnzymes.jpg) |
| 过氧化氢酶 · Catalase | `#/cell/cytoplasm/peroxisome/oxidativeEnzymes/catalase` | [已检查](model-recheck/catalase.jpg) |
| 脂酰辅酶A氧化酶 · Acyl-CoA oxidase | `#/cell/cytoplasm/peroxisome/oxidativeEnzymes/acylCoAOxidase` | [已检查](model-recheck/acylCoAOxidase.jpg) |
| 中心体 · Centrosome | `#/cell/cytoplasm/centrosome` | [已检查](model-recheck/centrosome.jpg) |
| 中心粒 · Centrioles | `#/cell/cytoplasm/centrosome/centrioles` | [已检查](model-recheck/centrioles.jpg) |
| 微管三联体 · Microtubule triplets | `#/cell/cytoplasm/centrosome/centrioles/triplets` | [已检查](model-recheck/triplets.jpg) |
| 中心粒周围物质 · Pericentriolar material | `#/cell/cytoplasm/centrosome/pcm` | [已检查](model-recheck/pcm.jpg) |
| 细胞骨架 · Cytoskeleton | `#/cell/cytoplasm/cytoskeleton` | [已检查](model-recheck/cytoskeleton.jpg) |
| 微管 · Microtubules | `#/cell/cytoplasm/cytoskeleton/microtubules` | [已检查](model-recheck/microtubules.jpg) |
| 微管蛋白二聚体 · Tubulin heterodimer | `#/cell/cytoplasm/cytoskeleton/microtubules/tubulinDimer` | [已检查](model-recheck/tubulinDimer.jpg) |
| 肌动蛋白丝 · Actin filaments | `#/cell/cytoplasm/cytoskeleton/actin` | [已检查](model-recheck/actin.jpg) |
| 中间丝 · Intermediate filaments | `#/cell/cytoplasm/cytoskeleton/intermediate` | [已检查](model-recheck/intermediate.jpg) |
| 反向平行四聚体 · Antiparallel tetramer | `#/cell/cytoplasm/cytoskeleton/intermediate/intermediateTetramer` | [已检查](model-recheck/intermediateTetramer.jpg) |
| 细胞核 · Nucleus | `#/cell/nucleus` | [已检查](model-recheck/nucleus.jpg) |
| 核被膜 · Nuclear envelope | `#/cell/nucleus/envelope` | [已检查](model-recheck/envelope.jpg) |
| 外核膜 · Outer nuclear membrane | `#/cell/nucleus/envelope/outerNuclear` | [已检查](model-recheck/outerNuclear.jpg) |
| 内核膜 · Inner nuclear membrane | `#/cell/nucleus/envelope/innerNuclear` | [已检查](model-recheck/innerNuclear.jpg) |
| 核孔复合体 · Nuclear pore complex | `#/cell/nucleus/nuclearPores` | [已检查](model-recheck/nuclearPores.jpg) |
| 染色质 · Chromatin | `#/cell/nucleus/chromatin` | [已检查](model-recheck/chromatin.jpg) |
| 核小体 · Nucleosome | `#/cell/nucleus/chromatin/nucleosome` | [已检查](model-recheck/nucleosome.jpg) |
| 组蛋白核心 · Histone core | `#/cell/nucleus/chromatin/nucleosome/histones` | [已检查](model-recheck/histones.jpg) |
| DNA 双螺旋 · DNA double helix | `#/cell/nucleus/chromatin/nucleosome/dna` | [已检查](model-recheck/dna.jpg) |
| 核仁 · Nucleolus | `#/cell/nucleus/nucleolus` | [已检查](model-recheck/nucleolus.jpg) |
