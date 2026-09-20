# 新增生物过程内容与缩略图审查

审查日期：2026-09-19。范围为 `src/processes/modules/*/entries.js` 登记的新增模块及对应 SVG；已有四个过程不在本次新增内容审查范围内。审查期间另两个 RNA 组过程完成登记，最终快照包含 **46 个过程**。

## 结论

新增内容的结构完整性与静态缩略图检查通过。发现一项情景说明不匹配，已报告主任务并确认修正；目前没有未解决的实质内容错误。另记录两项低优先级教学措辞建议。

这份结论来自元数据校验、逐项中英内容审阅、来源网页/索引核查，以及离线 SVG 渲染后的人眼检查。**未操作浏览器，未检查 WebGL 三维动画、标签遮挡、移动端或真机交互。** 不能据此宣布完整视觉验收通过。

## 完整性与缩略图

| 检查项 | 最终结果 |
| --- | --- |
| 过程 ID / 登记模块 | 46 个唯一 ID，登记引用对应模块 |
| 标题、简介、目录摘要 | 全部具备非空中文与英文 |
| 阶段 | 共 275 阶段；各过程 4–7 阶段，首阶段 0，严格递增，末阶段小于 1 |
| 阶段标题与描述 | 全部具备非空中文与英文 |
| 情景控件 | 36 个过程有控件，共 40 个控件；标签、选项均双语，默认值属于选项集合 |
| 生物种类上下文 | 现有 `contexts` 简介及覆盖的阶段均双语；酿酒酵母呼吸入口具有独立说明 |
| 来源 | 114 条来源条目，113 个不同 HTTPS 网址；无空标题或格式错误的网址 |
| 对应缩略图 | 46/46 存在，XML 可解析，均为 `viewBox="0 0 320 320"` |
| SVG 安全与独立性 | 无脚本、外部图像、外部资源引用、文本节点或嵌入网页；图形为本地矢量 |
| SVG 独特性 | 46 个不同文件内容哈希；离线总览没有发现换色复用同一主体的过程图 |
| SVG 离线渲染 | macOS Quick Look 全部成功生成缩略图，按约 150 px 展示人工检查 |

缩略图具体区分了复制叉、核小体滑移、细胞板、膜泵、突触、核孔、蛋白酶体、两类噬菌体与不同转录调控机制。整体色板一致，主体在方形画布内，未发现空白、裁断关键主体或文字挤占的图像。复制/修复、启动子/增强子、裂解/溶原等相近题材仍有可辨认的构图差别。几幅含多个蛋白的图在 150 px 下会损失分子细节，这是缩略图尺度的限制；详细机制须由三维场景承载。

## 已修复的实质问题

**[P2，已修复] 氧扩散选项与第三阶段说明不匹配。**

位置：`src/processes/modules/membrane/diffusionProcess.js:12`。

初次审查时，`route="oxygen"` 的几何表示氧穿过脂双层，但 `at: 0.38` 阶段仍固定写“水分子沿水通道的狭窄孔道通过 / Water traverses the narrow aquaporin pore”。这会使选中氧情景的用户把蛋白孔道当作当前通路。已将问题发送主任务；复读当前代码确认改为同时明确两条通路，中文为“水沿水通道蛋白孔道通过，氧通过脂双层；两种扩散都不直接消耗 ATP”，英文同步修正。本审查任务没有修改共享模块。

## 低优先级教学措辞建议

1. **扩散控件的“初始浓度”可进一步明确。** `src/processes/modules/membrane/diffusionProcess.js:23` 同时服务氧与水情景。简介已经说明水活度差与未显示的不透膜溶质，因此不存在未限定的渗透机制错误；但只看控件“外侧较高”的读者仍可能误以为外侧溶质较高。建议未来把标签改为“所选分子的初始分布（水为水活度）”一类明确表达，并同步英文；不必新增定量模型。
2. **中文术语可区分两类凋亡结构。** `src/processes/modules/signals/apoptosisProcess.js:154` 与 `:334` 将 Apaf-1 apoptosome 称为“凋亡小体”，而 `:169` 与 `:352` 也用“凋亡小体”指膜包裹的 apoptotic bodies。现有英文、Apaf-1 标签与七聚体描述已经区分两者，不属于结构或物种错误。为降低教学混淆，可把前者写为“Apaf-1 凋亡体（apoptosome）”，后者保留“膜包裹的凋亡小体”。

## 情景与科学边界审阅

未发现以下常见的过度断言：增强子靠近就必然表达、TAD 是膜泡、T4 可以溶原、酿酒酵母必有复合体 I、植物体细胞使用动物式中心粒、蛋白质在真核细胞核内翻译，或所有 kinesin 均向正端运动。

有控件的过程多数明确限定了示例边界：启动子位点改变是一次不稳定装配示例；增强子受限条件不代表全部基础转录为零；lac 有漏转录而 trp 起始与衰减分开解释；无标记蛋白酶体底物不被推广为普遍规律；保卫细胞关闭不被等同于质壁分离；高糖酵母的有氧发酵保留 Crabtree 效应。控件本身描述的是选定情景，不宣称提供实测表达量或精确速度。

物种/部位限定也覆盖了专门场景：哺乳动物无髓轴突与中枢兴奋性突触，小鼠初级精母细胞及精细胞胞质桥，拟南芥保卫细胞/幼茎/叶脉伴胞，多小核草履虫，以及 E. coli 的具体调控支路。跨根目录的保守过程没有将哺乳动物专属结构直接套用到植物或细菌。

本节是内容/范围一致性审阅。并未逐帧证明几何实现与这些说明完全一致，也没有复核每条参考文献中的全部实验结果。

## 来源核查与访问边界

批量读取 113 个不同网址：93 个直接返回 HTTP 200，17 个 PubMed 页面返回带通用标题的 HTTP 203，另有两个 403 和一个 500。随后作了针对性核查：

- 17 个 PubMed ID 全部通过 NCBI E-utilities `efetch` 取得对应论文标题，均与模块所列主题一致；没有把 HTTP 203 的挑战页面当成论文验证成功。
- `https://www.ncbi.nlm.nih.gov/books/NBK9831/` 的首轮 500 经网页工具重读成功，内容为 The Cell 的 Endocytosis 章节。
- `https://doi.org/10.1006/cbir.2002.0937` 的直接访问受限；通过出版方 Wiley 页面与 PubMed 12421576 确认是 Tani 等关于草履虫伸缩泡膜动力学的论文。可见 [出版方记录](https://onlinelibrary.wiley.com/doi/abs/10.1006/cbir.2002.0937)。
- `https://academic.oup.com/femsre/article/25/1/15/606015` 直接访问受限；出版方检索结果及该出版方 PDF 索引对应 *Stoichiometry and compartmentation of NADH metabolism in Saccharomyces cerevisiae*。未将 403 记作死链，也未声称此次成功读取了全文。
- NCBI 遗传密码表网址返回 200 但没有 HTML `<title>`；它是表格入口，不能据此判为无效来源。

因此，全部引用有可核对的来源身份，未发现明确的虚构或主题完全无关的网址。HTTP 可达性与题名对应只证明引用入口/身份；不能替代逐句事实溯源。部分模块引用权威教材或综述，符合本项目“权威页面或原始研究”的实现合同，但不应声称 114 条均为原始研究。

## 覆盖清单

“通过”表示本次结构/双语/缩略图检查通过，不表示浏览器或真机验收通过。

| ID | Roots | 阶段数 | 控件数 | 来源数 | 本次检查 |
| --- | --- | ---: | ---: | ---: | --- |
| `bacterialExpression` | bacterium | 6 | 1 | 2 | 通过 |
| `bacterialDivision` | bacterium | 6 | 1 | 2 | 通过 |
| `chemotaxis` | bacterium | 6 | 1 | 3 | 通过 |
| `twoComponent` | bacterium | 6 | 1 | 3 | 通过 |
| `chromatinAccess` | cell, plant, yeast | 5 | 1 | 3 | 通过 |
| `tad` | cell | 6 | 1 | 3 | 通过 |
| `mitosis` | cell | 6 | 1 | 2 | 通过 |
| `meiosis` | cell | 7 | 0 | 2 | 通过 |
| `respiration` | cell, plant, yeast, paramecium | 6 | 1 | 3 | 通过 |
| `glycolysis` | cell, plant, yeast | 7 | 0 | 2 | 通过 |
| `replication` | cell, plant, yeast | 6 | 1 | 3 | 通过 |
| `dnaRepair` | cell, plant, yeast | 6 | 1 | 3 | 通过 |
| `diffusion` | cell, plant, bacterium, yeast | 5 | 2 | 2 | 通过 |
| `activeTransport` | cell | 6 | 1 | 2 | 通过 |
| `actionPotential` | cell | 6 | 1 | 2 | 通过 |
| `synapse` | cell | 6 | 1 | 3 | 通过 |
| `lacOperon` | bacterium | 6 | 2 | 2 | 通过 |
| `trpOperon` | bacterium | 6 | 2 | 2 | 通过 |
| `parameciumFeeding` | paramecium | 6 | 0 | 3 | 通过 |
| `contractileVacuole` | paramecium | 5 | 1 | 3 | 通过 |
| `phageLytic` | phage | 6 | 0 | 3 | 通过 |
| `phageLysogenic` | phage | 7 | 1 | 3 | 通过 |
| `plantTransport` | plant | 6 | 1 | 2 | 通过 |
| `plasmodesmata` | plant | 6 | 1 | 2 | 通过 |
| `plantDivision` | plant | 6 | 0 | 2 | 通过 |
| `cellWallGrowth` | plant | 6 | 1 | 3 | 通过 |
| `auxin` | plant | 6 | 1 | 3 | 通过 |
| `plantDefense` | plant | 6 | 1 | 3 | 通过 |
| `plasmolysis` | plant | 6 | 1 | 1 | 通过 |
| `stomata` | plant | 6 | 1 | 2 | 通过 |
| `promoterRegulation` | cell | 6 | 1 | 3 | 通过 |
| `enhancerRegulation` | cell | 6 | 1 | 4 | 通过 |
| `rnaProcessing` | cell, plant | 6 | 0 | 2 | 通过 |
| `nuclearTransport` | cell, plant, yeast | 6 | 1 | 2 | 通过 |
| `motorTransport` | cell | 6 | 2 | 4 | 通过 |
| `organelleImport` | plant | 6 | 1 | 3 | 通过 |
| `signalTransduction` | cell | 6 | 1 | 1 | 通过 |
| `apoptosis` | cell | 6 | 1 | 2 | 通过 |
| `endocytosis` | cell | 6 | 0 | 2 | 通过 |
| `autophagy` | cell | 6 | 0 | 2 | 通过 |
| `translation` | cell, plant, yeast, paramecium | 6 | 0 | 4 | 通过 |
| `proteinFolding` | cell, plant, yeast | 6 | 1 | 3 | 通过 |
| `rnaSilencing` | cell | 5 | 1 | 2 | 通过 |
| `proteasome` | cell, plant, yeast | 6 | 1 | 2 | 通过 |
| `yeastBudding` | yeast | 6 | 0 | 2 | 通过 |
| `yeastFermentation` | yeast | 6 | 1 | 2 | 通过 |

## 执行记录

- 动态导入每个轻量 `entries.js` 及所指向定义，提取元数据并检查字段、阶段边界、控件默认值与源地址格式；未调用场景更新或运行全工作区测试。
- 使用 Python 标准库 XML 解析器检查 SVG，检查禁用节点/外部引用，并计算内容哈希。
- 使用 `qlmanage -t -s 160` 离线渲染，借助 Pillow 拼接临时总览后人工检查。未打开或控制浏览器。
- 用并发只读 HTTPS 请求核查题名；对 PubMed 使用 NCBI 官方记录补证，对受限网址采用网页检索补证。
- 临时核查数据与总览位于 `/tmp/process-content-audit-*`；这些是本地审查中间产物。唯一写入工作区的审查交付文件为本报告。
