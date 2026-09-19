# genome 科学审计（Phase A）

覆盖 entries.js 全部 **4 个模型**、**9 个 root 入口**、全部阶段与每个控制分支。结果：**3 confirmed_issue / 1 qualified_pass / 0 unresolved；6 个 P1，0 个 P0/P2**。仅写本报告与 JSON，没有修改产品、模型或测试，没有操作浏览器。既有 smoke 和代表截图不构成科学验收。

| 模型 | roots | 判定 | 问题 |
|---|---|---|---|
| replication | cell, plant, yeast | confirmed_issue | genome-01 |
| dnaRepair | cell, plant, yeast | qualified_pass | 未确认错误；有证据边界 |
| transduction | bacterium, phage | confirmed_issue | genome-02, genome-03 |
| bacterialSporulation | bacterium | confirmed_issue | genome-04, genome-05, genome-06 |

## replication

真核细胞核内一个已经建立、向右推进的局部复制叉；不包含起始、染色质、线粒体或叶绿体复制。三个 root 共用模型。

**检查范围**：逐条核对 entries、intro、6 个阶段、双语标签及 ligase=active/absent。上方亲本从左到右 3′→5′、下方 5′→3′，与前导链向右、冈崎片段向左的 5′→3′ 合成一致。 追踪 nuclearModels.js point/availability/isRNA/paint/update：新链只能出现在叉后；各冈崎片段从右端引物向左延伸，RNA 替换先于末端封口。关闭 ligase 保留片段边界缺口；半保留复制中两个产物各保留一条亲本链。 核对 CMG、聚合酶、PCNA 示意环、primase、ligase 及原子/骨架实例实际几何。CMG 通道与 DNA 路径不一致，见 genome-01。 能量和精确核苷酸计量未建模，未声称无 ATP 反应或真实长度/速率。先导引物和复制起始被明确排除，因此不以缺少起始动画判为错误。

### genome-01 · P1 · misleading_topology

位置：`src/processes/modules/genome/nuclearModels.js`，25–37, 86–103, 153–160; CMG-helicase-schematic-central-channel。

**代码证据**：CMG 六亚基中心位于 yz 平面半径 0.41、主椭球半径 [0.26,0.18,0.19]。helicase.position=(fork−0.04,0,0)，两条模板却按同一个对称开叉公式通过，未将前导模板送入该孔。代入 p=0.55，在 CMG 中心平面两模板径向距离约 0.391；至少一个亚基椭球归一化距离平方约 0.576<1，即 DNA 穿过蛋白体积。p=0.28 和 0.70 也出现相交。

**生物学问题**：画面明确标注中央通道，实际模板却穿过亚基带，且没有前导模板通过 C-tier、后随模板从叉分出的路径。错误不只是分子比例，而是马达与底物的连接拓扑。

**修复方向**：从共同 DNA 轨迹构造叉与 CMG 姿态：给前导模板保留贯穿中心马达孔的连续单链，后随模板在正确端退出；若表现 N/C 两层则分别建模，不能用整体平移盖住两条对称模板。

**验收不变量**：在 active/absent 以及 p=0.12,0.28,0.55,0.70,0.78 采样：前导模板贯穿马达孔并连续，后随模板不穿马达孔，DNA 不与亚基实体相交；同时维持正确链极性。

依据：[来源 1](https://www.rcsb.org/structure/5U8T)；[来源 2](https://pubmed.ncbi.nlm.nih.gov/28096349/)。

**已实际读取的来源**：

- [RCSB PDB 5U8T: CMG helicase with fork DNA](https://www.rcsb.org/structure/5U8T)：已打开结构页及关联实验说明：酵母 CMG 的 N 端面对叉；前导链模板穿过中心马达通道。双链可进入 N-tier，不应把“任何双链都不能进入 CMG”作为修复规则。
- [Georgescu et al. 2017, Structure of eukaryotic CMG helicase at a replication fork](https://pubmed.ncbi.nlm.nih.gov/28096349/)：已通过 NCBI PubMed efetch 实际读取原始论文摘要，支持前导链穿过 CMG 及 N/C-tier 的方向。
- [Molecular Biology of the Cell: DNA Replication Mechanisms](https://www.ncbi.nlm.nih.gov/books/NBK26850/)：已打开并阅读 5′→3′ 聚合、连续/不连续复制、引物成熟和 ligation 章节；书中较旧的泛化 helicase 叙述不用于覆盖真核 CMG 结构证据。

**判定边界**：粗粒化几何不是原子模型；未据此验证 CMG 亚基的精确残基、酶种完整清单或 ATP 化学计量。 查看现有 replication.png 代表帧并核对全部更新公式；未操作浏览器，也未把既有 smoke 当科学通过。
置信度：high。

## dnaRepair

真核核内全基因组核苷酸切除修复的共同步骤；上链相邻碱基的 UV 光产物示例，非链间交联；不声称所有损伤均由此修复。

**检查范围**：逐条核对 entries、intro、6 阶段的中英文、所有标签及 active/blocked。模型在三个 root 使用功能名称，明确物种识别因子差异，没有把人特异因子冒充所有真核完全相同的蛋白。 上链 5′→3′、下链反向；left=−4/3 和 right=4/3 两切口均在受损上链。下链在所有进度保持连续；未切断两条链或丢掉模板。 p≥0.48 后损伤随上链寡核苷酸一起移出；replacement 从 left 向 right 扩展（p=0.64–0.87），对应可延伸 3′ 端 5′→3′ 合成。seal 在 p=0.89–0.97 闭合最终骨架切口。 blocked 将有效 p 截到 0.4，先于 p=0.43 切开、p=0.48 切除、p=0.64 补链及 p=0.89 封口；阻断时不会出现修复完成的分子状态。 金色圆环位于受损上链且随其脱离，未连接上下两链；它是损伤位置标志，不能据此声称重建了光产物的共价化学。recognition/TFIIH/RPA/切割/聚合/ligase 出现顺序符合概念路径。

**已实际读取的来源**：

- [Araújo et al. 2000, Nucleotide excision repair of DNA with recombinant human proteins: definition of the minimal set of factors, active forms of TFIIH, and modulation by CAK](https://pubmed.ncbi.nlm.nih.gov/10673506/)：通过 PubMed efetch 和 PMC316364 XML 实际读取原始研究摘要；人源体系重构损伤两侧切开，并用聚合酶、PCNA/RFC、ligase 等完成修复合成，支持双切开→补链→封口共同机制。
- [Molecular Biology of the Cell: DNA Repair](https://www.ncbi.nlm.nih.gov/books/NBK26879/)：已打开 NCBI 章节，核对损伤链切除、完整链作模板、修复合成与连接的基本机制。

**判定边界**：qualified_pass 仅表示在已声明的粗粒化共同机制层面未确认错误，不是所有物种、蛋白结构、全部 NER 亚路径或精确切口长度的验证。 损伤图标及酶形状是功能示意；双侧切开与合成的耦联、ATP 消耗和各物种蛋白组成未展开。 已看现有 dnaRepair.png，并追踪全部阶段及 blocked 公式；未进行新浏览器检查。
置信度：medium。

## transduction

大肠杆菌供体→大肠杆菌受体；控制项 P1 广义转导或 λ 邻近 gal 的局限性转导。两个 root 均明确为同一宿主实例，终点为 DNA 递送而非稳定遗传。

**检查范围**：核对全部 6 阶段、双语文案、route=p1/lambda 及两 root。P1 从裂解生长的误包装开始，没有画染色体整合的 P1；λ 从邻近宿主基因的前噬菌体切出，杂合 DNA 需要的辅助功能被明确省略。 未把转导说成必然成功或所有噬菌体可转移任意位点；末帧保留受体原染色体，进入 DNA 仍未表现整合，稳定遗传未建立标签与分子结局一致。 逐式追踪 nucleoidDuplex 的供体缺段、donorCargo、capsid cargo、incoming、cells 和 debris；确认包装区室和中途供体序列守恒问题。 P1 套管收缩、λ 隐藏套管符合大类差异；尾部为通用示意，未据此验收特定 λ 变体的 gpJ、旁纤维或穿过双膜的受体通道。没有把 LamB 小分子孔解释为 dsDNA 通道。 包装 ATP 马达和定量能量未建模，未声称无能量包装；宿主包膜仅上下文剖面，不足以验证 E. coli 的完整双膜结构。

### genome-02 · P1 · molecular_identity_conservation

位置：`src/processes/modules/genome/transductionProcess.js`，197–213, 308–323; cargo[] and incoming[]。

**代码证据**：λ 在两组数组中都令 i<8 为细菌金色、i≥8 为噬菌体紫色。但头内 visibility 为 inject<1−i/24（高索引先消失），进入链 visibility 为 inject>(i+1)/24（低索引先出现）。在完整包装后 inject=0.5，头内保留 8 金+4 紫，进入链显示 8 金+3 紫：细菌序列显示了 16 段，原定仅 8 段；病毒序列同时大量丢失。

**生物学问题**：这是同一条 λ–宿主杂合 DNA 的递送，途中没有复制事件。头部消失的分子身份必须和尾部/受体新增身份一致；当前颜色不是单纯示意比例，而是身份在过程里改变。

**修复方向**：给 DNA 一条有序、带稳定身份的链，使用单一移动边界把每段分配到头内、尾管内或受体内；同一段只出现一次，输送方向必须与身份索引一致。使可视轨迹连续通过尾部。

**验收不变量**：在 inject=0,0.25,0.5,0.75,1 检查每个 donor segment 的唯一归属、顺序和总身份计数（允许端点显示细分，不允许颜色总量翻倍），两路线全通过。

依据：[来源 1](https://pmc.ncbi.nlm.nih.gov/articles/PMC11096046/)；[来源 2](https://pubmed.ncbi.nlm.nih.gov/356048/)。

### genome-03 · P1 · wrong_compartment

位置：`src/processes/modules/genome/transductionProcess.js`，107–120, 257–264, 285–299; donorCargo / phage / cells[0]。

**代码证据**：供体半径 0.9，未裂解细胞可见到 p<0.54。包装发生 p=0.34–0.48，此时 phage 中心固定在 y=1.2，头内 DNA 的 local y≈−0.25…+0.254，即 world y≈0.95…1.454，位于细胞外。donorCargo 同时从 y=0.55 移至 1.1 再缩小，画面把供体 DNA 送入膜外、尾部朝向供体的头部；没有独立放大视窗或空间连接标记。

**生物学问题**：P1/λ 裂解生长中的头部装配与包装先在供体内进行，裂解再释放。当前外部头部和越膜货物轨迹会被读成完整细胞把 DNA 排入已吸附噬菌体，颠倒包装/注入的区室关系。

**修复方向**：包装期间把头部与货物放在供体胞内剖面，裂解后再将完整颗粒移出；或明确采用独立包装放大视图并删除假越膜实体轨迹。不要仅补一句“不按比例”。

**验收不变量**：所有 p=0.34–0.48 帧中，包装头部和被包装 DNA 在供体胞内，或存在明确的非空间放大视图；未裂解时不存在宿主 DNA 跨膜进入外部头部。两路线均满足。

依据：[来源 1](https://pubmed.ncbi.nlm.nih.gov/356048/)；[来源 2](https://pmc.ncbi.nlm.nih.gov/articles/PMC9024508/)。

**已实际读取的来源**：

- [Generalized transduction: E. coli and P1 systems](https://pubmed.ncbi.nlm.nih.gov/19066827/)：实际读取 NCBI PubMed efetch 摘要；支持所选 E. coli/P1 广义转导实例。
- [Bacteriophage Lambda Site-Specific Recombination](https://pmc.ncbi.nlm.nih.gov/articles/PMC11096046/)：实际读取 NCBI PMC efetch 全文含 aberrant excision 段落：邻近宿主位点与剩余噬菌体序列组成杂合 DNA，不是运输途中重新生成宿主片段。
- [Yamagishi and Okamoto 1978, Visualization of the intracellular development of bacteriophage lambda, with special reference to DNA packaging](https://pubmed.ncbi.nlm.nih.gov/356048/)：已打开 PubMed 原始研究摘要：将感染细胞破裂后观察空头、部分填充头和完整 DNA 头，支持细胞内包装中间体。
- [New Insights into the Structure and Assembly of Bacteriophage P1](https://pmc.ncbi.nlm.nih.gov/articles/PMC9024508/)：通过 NCBI PMC efetch 实际读取全文，核对 P1 头部装配、包装与尾管/套管结构；网页直接打开遇验证码，未把验证码页当论文。
- [Ge and Wang 2024, Structural mechanism of bacteriophage lambda tail’s interaction with the bacterial receptor](https://pmc.ncbi.nlm.nih.gov/articles/PMC11101478/)：通过 NCBI PMC efetch 实际读取全文及 Figure 3 说明：λ 的中央 gpJ 尾纤维与 LamB 相互作用；实验株和 Ur-λ 旁纤维不同。该文也明确完整跨周质/内膜过程尚不完全清楚，故未要求模型虚构通道。

**判定边界**：部分原始来源经 XML 读取；P1 广义转导和 NER 的部分论文仅成功读取摘要，报告明确区分全文与摘要。 λ 的准确尾纤维变体与 E. coli 双膜穿透未充分表示，不能据本模型验收原子级感染入口。此限制不抵消两条已确认的问题。 查看了现有 transduction.png，实际判断覆盖全部 route 更新公式，不以该单帧替代全程。
置信度：high。

## bacterialSporulation

营养限制后的 Bacillus subtilis 内生孢子形成；一母细胞和一前孢子，最终一枚成熟孢子；不包括萌发，不泛化为所有细菌。

**检查范围**：核对全部 6 阶段、双语说明、engulfment=normal/blocked 及 bacterium root。营养限制触发、非增殖性一孢子结局与母细胞裂解的物种范围正确。 核对 septum、sporeLayers、engulf[]、mother/foreDNA 和 transportDNA 的完整构造与各时间区间；确认隔膜生长、膜包裹连接和染色体分配拓扑问题。 最终皮层位于内外膜之间、蛋白衣位于外侧，核心缩小作为脱水示意；没有把孢子衣当膜。层装配部分重叠已在文案说明。 blocked 令 p≤0.43，故不能达到皮层成熟、母细胞裂解或孢子释放；阶段标签上的成熟描述不能代替分子状态，分子本身确实停在未完成包裹。 本模型未定量画 ATP 水解或 SpoIIIE 蛋白，未声称无能量跨隔膜运输；但缺失完整 DNA 连续路径导致其分配机制仍不合格。

### genome-04 · P1 · reversed_membrane_growth

位置：`src/processes/modules/genome/bacterialSporulationProcess.js`，132–144, 294–297; septum / septumRim。

**代码证据**：隔膜是中心位于 x=−1.3 的 CircleGeometry(1.07)，半径随 0.1+0.9*ease(p,0.13,0.24) 从小到大。p=0.15 时半径约 0.191，远离半径 1.12 的侧壁；同样缩放的 rim 也在内部漂浮。

**生物学问题**：极性分裂隔膜从周边膜/壁向中心内陷并闭合，不能由细胞中央一块独立圆盘向外长成。这里恰好把隔膜产生分区的方向画反。

**修复方向**：改成外缘始终连接侧壁的环形隔膜，以向内移动的前缘缩小中央开口，闭合后才形成完整隔板；显示相邻两膜/隔膜壁的连续关系。

**验收不变量**：隔膜期所有几何组件与母膜侧壁连续；中央孔单调缩小到闭合，不存在游离中心圆盘。检查 p=0.14,0.15,0.20,0.24。

依据：[来源 1](https://pmc.ncbi.nlm.nih.gov/articles/PMC6684271/)。

### genome-05 · P1 · disconnected_engulfment_topology

位置：`src/processes/modules/genome/envelopeDetail.js`，251–278, 336–339; coupled bacterialSporulationProcess.js 121,145–166,294–306。

**代码证据**：spore 预建为独立中心 x=−1.95 的球状组。包裹由其自身 48 个球面扇区按 wrap 逐个显现，另有 80 个弧段逐个显现；母细胞 rodCutaway 静止，隔膜 p=0.36 后直接消失。没有从母膜/隔膜到包裹膜的连续接点、推进边缘或终末颈部。

**生物学问题**：母细胞膜包裹需要膜从隔膜边缘沿前孢子移动并保持与母膜连接，最后发生裂断。独立球壳按角度亮起改变了膜来源与拓扑，不能由文字“母细胞膜包裹”修正。

**修复方向**：以共享膜网格或共享边界构建母膜、隔膜和包裹前缘；推进时保持连接，极端留下颈部，完成后才断开为双膜前孢子。blocked 分支停在此连续中间状态。

**验收不变量**：包裹开始到终末裂断前，外包裹膜与母膜属于同一连通组件；闭合后前孢子有内外两层完整膜，皮层出现在两膜之间；阻断不能出现已脱离的闭合外膜。

依据：[来源 1](https://pmc.ncbi.nlm.nih.gov/articles/PMC6684271/)；[来源 2](https://pmc.ncbi.nlm.nih.gov/articles/PMC3576517/)。

### genome-06 · P1 · disconnected_chromosome_partition

位置：`src/processes/modules/genome/bacterialSporulationProcess.js`，205–228, 276–298; motherChromosome / protectedChromosome / transportDNA; envelopeDetail.js 134–188。

**代码证据**：motherChromosome 和 protectedChromosome 都在构造时以 nucleoidDuplex(...).update(0,false,false) 生成完整闭合环。前孢子 p>0.13 一出现就带完整环，仅按 partition 缩放；p=0.17–0.31 又出现一个固定、开口、未接到两个环的 transportDNA 管。母环只平移/缩放，未有任何连续轮廓跨隔膜转移。

**生物学问题**：复制后的一个染色体在极性分隔时部分留在母细胞，随后剩余部分经隔膜转运。完整母环+完整前孢子环+独立桥段不能表示这个过程，并在“分配完成前”已显示前孢子内完整染色体。

**修复方向**：先明确两份已复制染色体，保留母细胞一份；另一份用同一条连续轮廓跨隔膜，逐渐把剩余部分移入前孢子，不能新增独立第三段或提前显示完整前孢子环。

**验收不变量**：分配过程中总染色体拷贝数保持两份，跨隔膜的每一条 DNA 连续且归属明确；前孢子得到的轮廓比例增加，直到运输完成才完全位于其内；任何帧不出现自由第三桥段。

依据：[来源 1](https://pmc.ncbi.nlm.nih.gov/articles/PMC6684271/)。

**已实际读取的来源**：

- [Khanna et al. 2019, The molecular architecture of engulfment during Bacillus subtilis sporulation](https://pmc.ncbi.nlm.nih.gov/articles/PMC6684271/)：通过 Europe PMC fullTextXML 实际读取全文、导言与 Fig. 1 描述：极性隔膜、染色体捕获及 SpoIIIE 运输、隔膜弯曲、母细胞膜迁移包裹；用于区分细胞连接拓扑与独立球壳。
- [Doan et al. 2013, FisB mediates membrane fission during sporulation in Bacillus subtilis](https://pmc.ncbi.nlm.nih.gov/articles/PMC3576517/)：通过 NCBI PMC efetch 实际读取原始研究摘要：膜迁移后需要膜裂断将前孢子释放到母细胞内部，FisB 缺失阻碍这一最终步骤。

**判定边界**：最终孢子多层顺序通过，不能推导其分子构成、衣壳蛋白原子结构或所有 Bacillus 孢子的外层都相同。 现有 bacterialSporulation.png 为包裹中期参考；所有动态问题基于全时域构造和公式，而非只看截图。
置信度：high。

## 阅读与复核记录

读取并追踪了 entries.js、replicationProcess.js、dnaRepairProcess.js、nuclearModels.js、transductionProcess.js、bacterialSporulationProcess.js、molecularDetail.js、envelopeDetail.js；检查两种文案、标签和实际几何，而非仅 userData。查看 /tmp/atlas-refinement 下四张既有代表截图，未据此声称全程浏览器验收。

部分 PMC 网页打开遇到验证码，因此改用实际可读的官方 XML：

- [Khanna 2019 全文 XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6684271/fullTextXML)
- [NCBI PMC efetch：lambda recombination 全文](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=11096046)
- [NCBI PMC efetch：P1 assembly 全文](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=9024508)
- [NCBI PMC efetch：lambda tail 全文](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=11101478)
- [NCBI PMC efetch：FisB（此次返回摘要）](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=3576517)
- [NCBI PubMed efetch：CMG、NER、P1 转导原始摘要](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=28096349,10673506,19066827&retmode=xml)

没有把打不开的全文当已读全文；未引用搜索标题代替实证。修复须等待 root 完成全局库存整合并放行 Phase B。
