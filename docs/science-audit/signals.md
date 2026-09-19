# Signals 科学审计（Phase A）

审计者：p_division；日期：2026-09-19。仅写本报告与同名 JSON，未修改产品、测试或操作浏览器。覆盖 entries.js 注册的 4 个模型，均只有 `cell` root。核查了完整代码、实际几何 helper、所有阶段/条件以及中英文字；已有截图只是代表帧，不能证明中间态正确。

**结论：4 个 confirmed_issue，0 个 qualified_pass，0 个 unresolved；8 个独立问题（6 P1、2 P2、0 P0）。** signals-03 为四模型共用缺陷，统计一次。此前技术 smoke 不等于科学通过。

| 模型 | 范围及条件 | Verdict | 独立问题 |
| --- | --- | --- | --- |
| signalTransduction | 哺乳动物 PDGFR；ligand / noLigand / kinaseInactive | confirmed_issue | 01、02、03 |
| apoptosis | 哺乳动物内源性线粒体凋亡；stress / noStress | confirmed_issue | 04、05、06；共用03 |
| differentiation | 小鼠定型红系；competent / impaired | confirmed_issue | 07；共用03 |
| immuneResponse | 靶细胞到效应CD8 T细胞；matched / unmatched | confirmed_issue | 08；共用03 |

## signalTransduction

哺乳动物 PDGFR–Grb2/SOS–Ras–Raf/MEK/ERK–核内应答。 **confirmed_issue，高置信度。**

已核查的正确部分：胞外配体/胞质激酶/Ras膜锚侧别正确；无配体不启动，激酶失活仍可二聚但不启动下游；分支省略有说明。

### signals-01 · P1 · SOS 与 Ras 没有接触，却发生交换

代码：`src/processes/modules/signals/signalTransductionProcess.js`，88–100, 237–261。

SOS 球局部中心 (0.31,-0.13,0)，adaptor 最终 (-1.28,0.33,0.06)，因此 SOS 中心 (-0.97,0.20,0.06)；Ras 固定 (-0.15,1.01,0)。中心距离约 1.154，大于最大包围半径和约 0.61，没有催化接触或连接；p≥0.43 只切换 Ras 颜色和 nucleotide 可见性。

画面把 SOS 介导的直接交换表示为隔空激活。 修法：将被招募 SOS 催化面与膜 Ras 接触，依次显示 GDP 释放、GTP 结合和 Raf 招募。

验证不变量：p=0.28…0.51，Ras 活化前必须发生 SOS 接触；noLigand/kinaseInactive 不发生交换或下游活化。

依据：[H-Ras–SOS1 complex, Boriack-Sjodin et al. 1998 (PDB 1BKD)](https://www.rcsb.org/structure/1BKD)；[Molecular Biology of the Cell — Enzyme-linked receptors](https://www.ncbi.nlm.nih.gov/books/NBK26822/)。

### signals-02 · P2 · Ras 套用蛋白激酶折叠

代码：`src/processes/modules/signals/signalTransductionProcess.js`，224; structuralKit.js:35–71。

Ras 调用 kinaseFold(k, ras, rasMat, 0.42)；helper 明确生成激酶 N 叶 β 片层、大 C 叶 α 螺旋及中间裂隙，与 RTK/Raf/MEK/ERK 同一模板。

给小 GTP 酶添加特指激酶的细节混淆分子身份；鉴于模型有形状示意声明，按 P2 而非将全部蛋白简化判错。 修法：使用 GTPase fold 的简化几何、单个核苷酸口袋和 switch 区，移除激酶双叶模板。

验证不变量：Ras 不调用 kinaseFold；核苷酸和 SOS 接触位置可追踪。

依据：[H-Ras–SOS1 complex, Boriack-Sjodin et al. 1998 (PDB 1BKD)](https://www.rcsb.org/structure/1BKD)。

### signals-03 · P1 · 共享染色质把 DNA 放入组蛋白芯

代码：`src/processes/modules/signals/structuralKit.js`，178–225; all four model callers。

组蛋白柱芯半径 0.085 放在同一 curve 上，DNA 两股仅偏离 0.02–0.035，未围绕芯建立超螺旋。芯旋转 (π/2,0,i*0.71)、缩放 (1,0.8,1)。按实际公式对 apoptosis 主染色质逆变换采样，18 个芯位置有 17 个 DNA 中心线点在芯实体内。调用方 signalTransduction:194、apoptosis:68/266、differentiation:76、immuneResponse:108/339。

DNA 穿蛋白芯而非在外部包绕，是拓扑错误，比例声明不能修复。 修法：在芯外建立连续 DNA 包绕并连接 linker；或移除假的核小体细节。四调用方共同修复。

验证不变量：DNA 管面不进入芯体积，核小体包绕与 linker 连续；所有调用方验证。

依据：[Nucleosome core particle, Luger et al. 1997 (PDB 1AOI)](https://www.rcsb.org/structure/1AOI)。

边界：级联部分用定时变色，未重现每次 ATP 转移；作为已声明省略反馈/支路的概览可以接受。 核孔与大型 ERK 图标的精确通行空间未完成碰撞证明，留给 Phase B 复查，不作为已证实问题。

## apoptosis

哺乳动物线粒体内源性凋亡；stress/noStress；截止碎片形成。 **confirmed_issue，高置信度。**

已核查的正确部分：noStress 停在初态；cytochrome c 从膜间隙经外膜开口进入胞质；MOMP、释放、七单元平台及执行级联有先后；未把 caspase 说成 DNA 切割酶。

### signals-04 · P1 · 凋亡小体穿完整母膜，货物独立生成

代码：`src/processes/modules/signals/apoptosisProcess.js`，253–276, 302–318, 379–399。

body 创建即含独立闭球膜、DNA 杆及染色质，t≈0.75 后在母细胞边缘缩放出现并外移；母 shell/cellBack/membraneDetail 仅整体缩放，无出芽口/颈。原核 DNA 直到 pack≥0.9 才隐藏，body DNA 已同时出现。

独立小体穿完整母膜，货物凭空出现，未体现膜变形和原有内容物分配。 修法：连续母膜 bleb→颈→分离；将既有碎片/胞质对象移入 bleb，切断后才成独立膜包体。

验证不变量：p=0.72…1：切断前连续边界，切断后无穿插；可追踪货物不能同时存在于母细胞与小体。

依据：[Coleman et al. 2001 — Membrane blebbing during apoptosis](https://mcb.berkeley.edu/courses/mcb230/jk_pdfs/15_coleman_rock_blebbing.pdf)；[Molecular Biology of the Cell — Programmed Cell Death](https://www.ncbi.nlm.nih.gov/books/NBK26873/)。

### signals-05 · P1 · 嵴未连入内膜且部分穿越内边界

代码：`src/processes/modules/signals/apoptosisProcess.js`，105–155。

内边界为完整 (0.83,0.43) 椭圆，另插五条 crista tube 和五条 extruded membraneWall，无接合孔。i=2 的新嵴端点约 (-0.10,-0.35)、(0.03,-0.24)，均终止在内部；i=0 首端 (-0.61,-0.35) 还在内边界外。

三维嵴不是基质中独立开放膜条，也不能穿完整内边界；这混淆嵴腔/基质/膜间隙。 修法：重建连通内膜及嵴连接部，使嵴腔连通膜间隙且与基质隔离；MOMP 仍针对外膜。

验证不变量：所有嵴归属同一内膜组件，无悬空非切面边缘或穿越内边界；cytochrome c 释放不穿内膜。

依据：[The Cell — Mitochondria](https://www.ncbi.nlm.nih.gov/books/NBK9896/)。

### signals-06 · P2 · Apaf-1 两个螺旋桨都画成七叶

代码：`src/processes/modules/signals/apoptosisProcess.js`，207–221。

Apaf 两个 β 螺旋桨都循环 b<7，形成七叶+七叶。

加入可数的细节时应符合七叶+八叶，而不是复制相同域。 修法：分别生成七叶和八叶，保持夹持 cytochrome c 的相对布局。

验证不变量：每个 Apaf 的两个传感域分别七/八叶，七 Apaf 平台数不变。

依据：[Cheng et al. 2016 — A near atomic structure of the active human apoptosome](https://pmc.ncbi.nlm.nih.gov/articles/PMC5050015/?pdf=1)；[Active human apoptosome with procaspase-9 (PDB 5JUY)](https://www.rcsb.org/structure/5JUY)。

另受共享 **signals-03** 影响；不重复计数。

边界：BAX/BAK孔、cytochrome c和caspase图标不应读作实验分子数；完整BCL2/IAP调节和ATP/dATP交换未显式模拟。 PMC部分请求触发验证，Apaf细节实际通过可读?pdf=1 HTML及5JUY交叉核查；失败页面未作为支持证据。

## differentiation

已承诺的小鼠定型红系早期有核红细胞，压缩单个后代路径到网织红细胞。 **confirmed_issue，高置信度。**

已核查的正确部分：物种和已承诺谱系明确；程序不足早停；末态是仍有RNA/细胞器的网织红细胞及排出核，未泛化到所有细胞。

### signals-07 · P1 · 固定椭球核穿过过小膜颈

代码：`src/processes/modules/signals/differentiationProcess.js`，28–59, 200–226, 255–333。

full/open 切换时 cellEdge/cellBack 仍完整。p=0.835、extrude=0.5：核中心 x=1.075，半径约 (0.594,0.54,0.281)；neck x=1.08、半径0.1456；cortex x=0.95、半径0.1526，核在该 x 的截面 y 半径约0.528。核只有整体缩放，穿完整母膜和过小颈。

小鼠出核不能由固定椭球穿数倍更窄的颈表示。终态包膜和 pyrenocyteMembraneEnclosed=true 不能证明中间态正确。 修法：核与局部膜连续变形，可用小鼠代表性哑铃形；核通过后再收颈切断，删除重复封闭内面。

验证不变量：p=0.73…0.95：核包络不穿膜，颈截面容纳核截面；切断前连续包膜，切断后两独立包膜；保留最终网织红细胞的 RNA/细胞器。

依据：[Nowak et al. 2017 — Tropomodulin 1 controls erythroblast enucleation](https://pmc.ncbi.nlm.nih.gov/articles/PMC5580276/)。

另受共享 **signals-03** 影响；不重复计数。

边界：未模拟完整红细胞岛、膜蛋白分选、巨噬吞噬或完整转录翻译。 正文限制了唯一收缩环解释，因此不另判收缩环理论错误；实际颈部穿插仍须修复。

## immuneResponse

有核哺乳动物靶细胞内源性 MHC-I 呈递给已分化效应 CD8 T 细胞；不包括初始启动或杀伤。 **confirmed_issue，高置信度。**

已核查的正确部分：两种肽均允许装载，只有匹配TCR者稳定接触及颗粒极化。TCR可变区朝靶细胞、MHC槽朝T细胞、CD8接近α3侧部；这些方向本身正确。未混淆初始T细胞启动与效应识别。

### signals-08 · P1 · MHC 转向后肽链没有同步旋转

代码：`src/processes/modules/signals/immuneResponseProcess.js`，190–201, 228–259, 434–458。

peptide 是独立子组，点沿局部 x；MHC 在 p=0.5…0.6 转 -π/2，但 peptide 仅移动起点，未同步 rotation。p=1 槽长轴沿世界 y，肽仍沿世界 x 从约1.58至1.80，离槽指向 T 细胞，matched/unmatched 均如此。

识别帧中的肽未留在槽内，无法正确表示稳定 pMHC 复合面。 修法：装载后将 peptide 绑定到 MHC 局部坐标或同步全链旋转；两种肽均保持槽内，仅改变识别表面。

验证不变量：p=0.46…1 对肽点逆变换到 MHC 局部坐标，长轴沿槽且点在槽内；TCR 接触复合面，CD8 靠近 α3 侧部。

依据：[TCR–Tax–HLA-A2, Garboczi et al. 1996 (PDB 1AO7)](https://www.rcsb.org/structure/1AO7)；[Immunobiology — The generation of T-cell receptor ligands](https://www.ncbi.nlm.nih.gov/books/NBK27137/)。

另受共享 **signals-03** 影响；不重复计数。

边界：ER/Golgi运输是压缩载体路径，完整出芽/融合和肽装载复合体省略已有说明。 不把本示意当成TAP原子通道、TCR精确对接角、CD8αβ残基或突触力学的证据；这里只通过膜侧别和相对接触面。 五个肽点没有声明等于五个氨基酸，不据图标数量推断生物学肽长度。

## 复核顺序与证据边界

优先修复拓扑与连续运动（03、04、05、07、08），再补 SOS 接触（01）及结构身份（02、06）。所有修法只是 Phase B 建议，本轮没有实施。

内存计算独立复现实际 helper：apoptosis 主染色质18个芯的中心参数位置中，17处DNA中心线进入芯体积；排核 p=0.835 时核在皮质截面 y 半径约0.528，颈半径0.1456。免疫终态槽沿世界y，肽仍沿世界x。后续测试须验证这些几何不变量，不能只断言 userData。

科学来源均实际打开。部分 PMC/PubMed/Nature 请求被验证页或403阻挡，没有把失败页面当证据；Apaf原文通过可读的 `?pdf=1` HTML读取，blebbing用大学托管的原始论文PDF。明确使用实验结构作身份/接触面的依据，未声称图示是原子重建。JSON保存每模型来源支持范围、全项核查及修复验收条件。
