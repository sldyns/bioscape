# plantGrowth 独立科学审计（Phase A）

覆盖 entries.js 的全部 4 个 id、全部阶段/控制/声明 root；只写审计文件，没有修改模型。3 项 confirmed_issue，1 项 qualified_pass，0 项 unresolved；共 6 条发现（4 P1、2 P2）。

证据边界：逐行追踪实际几何、helper 与 update；运行阶段边界及关键过渡点的只读采样；查看已有 4 张截图。未操作浏览器，也未把技术 smoke 或 userData 当作科学证明。下面所列原始研究页面均实际打开；受 reCAPTCHA 阻挡的其他 PMC 地址不作为“已读全文”证据。

| Model | Roots | Verdict | Confidence | Findings |
|---|---|---|---|---|
| plantDivision | plant | confirmed_issue | high | plantGrowth-01 P1, plantGrowth-02 P1 |
| cellWallGrowth | plant | qualified_pass | medium | 无确证错误 |
| doubleFertilization | plant | confirmed_issue | high | plantGrowth-03 P1, plantGrowth-04 P2 |
| fungalHyphae | yeast | confirmed_issue | high | plantGrowth-05 P1, plantGrowth-06 P2 |

## plantDivision

拟南芥分生组织体细胞有丝分裂与细胞板胞质分裂；不表示减数分裂。

检查范围：六阶段 p=0/.16/.32/.43/.62/.9，无控制项；只声明 plant root。已对分离、成膜体、囊泡网络、片层、最终壁接触的真实位置和可见性检查；运行 15 个时间采样。 染色单体成对向相反极移动；成膜体与板向外扩展，最终板 x 边缘达到亲代质膜 x=±2.36。未把这个前向剖面接触错误地判成完全不接触。 文本中的囊泡腔成为胞外空间、板缘接入质膜是正确的生物学叙述，但当前几何没有实现相应膜连续性。

### plantGrowth-01 · P1 · misleading_representation/topology

位置：`src/processes/modules/plantGrowth/plantDivisionProcess.js` 60–63, 79–99, 151–182; plate/faces/network/vesicles

代码证据：plate 是实体 box，两膜面是位于 y=±0.093 的独立薄 box，没有环绕生长边缘的连接膜。早期 network 为实心 segment 格子；独立囊泡在末端缩小后循环重置而不形成连通的膜性腔。此外递送环为 x=radius·cosθ,z=0.8·growth·sinθ，而板为矩形（半宽 radius、半深 0.86·growth），多数所谓边缘递送落在板面内部。

科学判断：该模块的核心因果是膜性囊泡融合形成封闭腔，随后腔转为新壁的胞外空间。开放周边的两片板、实心网络和互不融合的囊泡无法表达此拓扑；这不只是前侧观察切面。

修法：用具有明确内腔和闭合生长边缘的膜网络/细胞板截面，显示一次可追踪的融合。统一板轮廓与成膜体递送边缘，末端与亲代质膜连通；只在明确的观察切面开口。

验证不变量：跨早/中/晚阶段检查膜将腔与胞质分隔；两面经实际生长边缘相连；囊泡交付点在边缘容差内；最终板膜与亲代膜接通。

### plantGrowth-02 · P1 · misleading_representation/attachment

位置：`src/processes/modules/plantGrowth/plantDivisionProcess.js` 49–59, 129–137, 148–150; spindle segments and sisters

代码证据：所有 spindle 端点恒为 [(i−1.5)·0.56,0,−0.18]，update 只切 visible。染色单体在 .13–.35 向极运动，p=.32 时 y 已到 ±1.5224，而纺锤微管仍终止 y=0；动粒随染色单体移动，纤维没有跟随。

科学判断：运动中的染色单体看起来脱离了负责其分离的动粒微管，模型把后期运动与牵引结构的空间联系切断。

修法：分别更新两侧动粒微管端点，使其跟随对应染色单体动粒，长度/方向随分离变化，并在适当阶段拆除。

验证不变量：在 .13–.35 多点采样，每条标为动粒微管的末端与对应动粒距离低于可见容差；不得通过提前隐藏全部微管规避后期联系。

实际打开的证据：

- [Seguí-Simarro et al. (2004), Electron tomographic analysis of somatic cell plate formation in meristematic cells of Arabidopsis preserved by high-pressure freezing](https://pubmed.ncbi.nlm.nih.gov/15020749/)：已打开 PubMed 摘要和图注。电镜断层观察到囊泡融合、管泡网络、开孔片层与向周边扩展的序列；支持膜性细胞板和向亲代壁连接的机制。
- [He et al. (2025), Arabidopsis KNL1 recruits type one protein phosphatase to kinetochores to silence the spindle assembly checkpoint](https://pubmed.ncbi.nlm.nih.gov/39908360/)：已打开 PubMed 原始研究摘要及图 2–4 图注。拟南芥动粒与纺锤体连接、染色体分离的关系；不是对当前示意几何的原子结构验证。

限制：染色体数量和几何、膜厚度、时间均为示意；未做原子级或绝对尺寸验证。 阶段采样和已有截图不足以代替修复后的交互视觉验收。

## cellWallGrowth

拟南芥下胚轴表皮局部壁/质膜/皮层微管切片；检验介观方向和合成—伸展区别。

检查范围：六阶段 p=0/.15/.32/.5/.68/.88；extensibility=yielding 与 restrained 全覆盖，共 30 个采样；唯一 root=plant。 实际空间：膜位于 z≈0，墙体起于 z=.175，微管位于胞质侧 z=−.28，CesA 催化体在负 z 侧，产物从 z=.12 延伸至胞外 .51；纤维留在胞外壁。 CesA 沿对应微管方向沿 x 双向移动，交替方向的轨迹/产物起终点一致；不是所有合酶单向走。 yielding 使壁片 y 尺寸逐步至 1.32；restrained 保持 1，两模式中纤维素沉积均继续。蛋白反向补偿 y 尺度，避免跟随整片伸展被拉长。控制表示短时机械可伸展性，非长期切断合成与生长关系。 中英文均区分 UDP-glucose 输入、胞外纤维素输出、皮层方向约束与膨压驱动扩展。未发现已确证方向/因果/区室错误。

结论：介观方向、区室、双向移动、合成与伸展区别获得有限通过；不代表蛋白/糖链/膜的原子结构已校验。

实际打开的证据：

- [Paredez et al. (2006), Visualization of cellulose synthase demonstrates functional association with microtubules](https://pubmed.ncbi.nlm.nih.gov/16627697/)：已打开 PubMed 原始研究摘要。质膜中纤维素合酶呈沿皮层微管方向的线性、双向运动。
- [Ivakov et al. (2017), Cellulose synthesis and cell expansion are regulated by different mechanisms in growing Arabidopsis hypocotyls](https://researchprofiles.ku.dk/en/publications/cellulose-synthesis-and-cell-expansion-are-regulated-by-different/)：已打开作者大学研究门户的原始论文摘要。拟南芥下胚轴中纤维素合成与细胞扩展可被不同机制调节；并非长期完全互不依赖。

限制：六瓣合酶、18 个子域和少数产物轨迹仅是结构示意，没有用 PDB/EMDB 做原子/链数拟合。 绳状微纤丝与脂质切边不是 β-1,4 键构象或真实膜分子堆积的验证；不能拿本 qualified_pass 背书原子级精度。 ATP/底物化学步骤、跨膜转运细节和真实速率不在该介观模型中；现有来源仅支持所检查方向和调控区别。 本结论不表示所有植物组织都适用相同壁排列。

## doubleFertilization

拟南芥多细胞胚珠，母方两个极核已融合为 2n 中央核；不是通用单细胞植物模型。

检查范围：六阶段 p=0/.17/.33/.5/.73/.88；assignment=frontEgg/frontCentral 均检查，共 30 个采样，另重点检查 .725/.89/.91；唯一 root=plant。 珠被缺口在珠孔侧，花粉管从该缺口抵达接受助细胞；营养核领先，两个精细胞由管运送而非自行游动。释放至卵与中央细胞边界，随后短暂停留再融合。 两个控制仅交换精细胞落点，未宣称前后精细胞有固定命运；n+n→2n 合子、母方 2n+n→3n 胚乳的文字和目标分配正确。 反足细胞已退化的省略在特定物种/时间背景中说明，未把省略认定为必需补齐的缺陷；末段早期胚形态与过渡核数存在以下问题。

### plantGrowth-03 · P1 · fact_error/species_specific_morphology

位置：`src/processes/modules/plantGrowth/doubleFertilizationProcess.js` 150–155, 247; embryo

代码证据：末段 p≥.9 显示两个尺度完全相同 [.26,.22,.18] 的细胞，中心 y=−1.1/−.74，胞体还有 0.08 的 y 重叠。intro 指定拟南芥；该组对象作为两细胞早期胚输出。

科学判断：拟南芥正常第一次合子分裂明显不对称，形成小的顶端细胞和大的基部细胞。等大的两细胞形象会把具体物种的重要早期极性画错；简化声明不足以改变这点。

修法：画出具有独立边界的小顶端/大基部两细胞胚，基部朝珠孔、顶端朝胚囊内部；若不展示该后续过程，可将终点收敛到单个 2n 合子。

验证不变量：若保留分裂终点，基部细胞体积大于顶端，边界不重叠且各一核 2n，方向与珠孔一致；不要改动已正确的双受精倍性。

### plantGrowth-04 · P2 · transition_ambiguity/duplicated_identity

位置：`src/processes/modules/plantGrowth/doubleFertilizationProcess.js` 98–101, 135–147, 228, 241–243; sperm and spermMarkers

代码证据：传入精细胞自带父方核 glyph，p<.73 仍显示；独立产物父方核 spermMarkers 从 p≥.72 开始显示。p=.725 两套同时可见，合计四个父方核图形，没有标明是同一核的转移残影。

科学判断：真实过程只有两个精细胞提供父方核。虽然后续 2n/3n 标签正确，过渡帧的重复身份仍可能被理解为额外父方核；此项是表达歧义，不是倍性计算错误。

修法：复用同两个父方核对象，或将进入态与产物态可见区间做互斥交接；核融合过渡需保持身份连续。

验证不变量：.70–.75 密集采样：在核复制前最多两个可识别父方核贡献，两个 assignment 选项结果相同；避免用只查最终 userData 的测试。

实际打开的证据：

- [Hamamura et al. (2011), Live-cell imaging reveals the dynamics of two sperm cells during double fertilization in Arabidopsis thaliana](https://pubmed.ncbi.nlm.nih.gov/21396821/)：已打开 PubMed 原始活细胞成像摘要。花粉管运送两个不自行游动的精细胞，营养核领先；释放后停留于配子边界；无固定受精先后与精细胞命运偏好。
- [Kimata et al. (2016), Cytoskeleton dynamics control the first asymmetric cell division in Arabidopsis zygote](https://pmc.ncbi.nlm.nih.gov/articles/PMC5150365/)：已打开 PMC 原始研究全文及图 1。拟南芥合子首次不对称分裂形成较小顶端细胞和较大基部细胞，分别进入胚体与胚柄相关谱系。

限制：双受精路线和倍性通过不等于后续胚发育几何通过。 配子及核采用剖面/半透明轮廓，未声称膜融合蛋白构象或核膜融合的精细分子模拟。 只检查拟南芥已融合极核场景，不能泛化为所有被子植物中央细胞初始核态。

## fungalHyphae

Neurospora crassa 有隔菌丝顶端生长，挂在 yeast 图谱入口；intro 明确不是出芽酵母。

检查范围：六阶段 p=0/.16/.32/.49/.67/.87；delivery=normal/reduced 全覆盖，共 30 个采样；唯一 root=yeast，其物种特化说明在中英文均存在，未误判入口名称为物种宣称。 Spitzenkörper 是分层小/大囊泡群，无虚构包围膜；运输总体朝尖端，膜合酶在尖端附近、产物在胞外，隔膜孔与多核背景符合示意范围。 reduced 将递送数量/速度和延伸量降到示意比例 .24；未宣称为实测抑制剂效应或数值定律。 囊泡 update 在隔膜附近将 y/z 收拢至孔中心，但该处理不作用于实际运输轨道；已沉积聚合物也没有留在后方，详见下列条目。

### plantGrowth-05 · P1 · misleading_representation/compartment_crossing

位置：`src/processes/modules/plantGrowth/fungalHyphaeProcess.js` 89–110, 120–121, 249–257; septa and actin transport tracks

代码证据：隔膜位于 x=−2.8/−1.4，RingGeometry 内径参数为半径 .18（两侧面 .19）。两条运输轨道恒位于 y=±.42,z=−.13 并横贯 x=−1.4；其径向距离 sqrt(.42²+.13²)=.43966，穿过实体隔膜，远在中心孔之外。囊泡收拢算法没有改变轨道。

科学判断：隔膜中心孔是胞质连续/交换通道，实体壁并非运输通道。画出穿壁的细胞骨架路径使区室联系与墙体屏障相互矛盾。

修法：将轨道限制在单一胞质区室，或用连续曲线穿过真实中心孔并计入轨道半径；允许用不同区室的独立轨道接续囊泡运输。

验证不变量：所有轨道/囊泡与隔膜 slab 相交的采样点，其径向位置加自身半径应落在实际孔净半径内；实体隔膜不被胞质轨道贯穿。

### plantGrowth-06 · P2 · motion_identity_ambiguity

位置：`src/processes/modules/plantGrowth/fungalHyphaeProcess.js` 147–173, 267–275; Extracellular wall polymer bundle

代码证据：同一批 15 个 deposits 每帧以 tip+.775·cosθ 定位，没有出生/固定的壁坐标。θ=0 的同一束从 p=.4 的 x≈2.0472 移到 p=.8 的 x≈3.2638，始终随顶端前进；末阶段却解释新生壁成为侧壁。

科学判断：若这些具名对象表示已经沉积的壁聚合物，动画将其误示为与尖端一起运输的活动货物；如果只是当前合成位点，身份和壁成熟过程未说明。因此按 P2 表达歧义记录，不将省略分子级壁力学夸大成 P1。

修法：新增少量预分配出生批次，沉积后保持壁材料坐标并留在尖端后方；或明确区分移动的合成位点提示和留存的壁材料，保留可追踪的新壁→侧壁关系。

验证不变量：选定已沉积材料标记，尖端继续前进时它留在后方/合理壁材料坐标，而非每帧强制跟尖端平移；normal/reduced 两模式均验证。

实际打开的证据：

- [Riquelme et al. (2014), The Neurospora crassa exocyst complex tethers Spitzenkörper vesicles to the apical plasma membrane during polarized growth](https://pubmed.ncbi.nlm.nih.gov/24523289/)：已打开 PubMed 原始研究摘要。分层 Spitzenkörper 囊泡群与顶端质膜的定向分泌，exocyst 参与系留。
- [Delgado-Álvarez et al. (2014), Septum Development in Neurospora crassa: The Septal Actomyosin Tangle](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0096744)：已打开 PLOS 原始研究全文。引言与成像图指出隔膜具有中心孔供胞质/细胞器联系，隔膜形成涉及质膜内陷及壁构建；实体壁不能作为胞质运输通道。
- [Hunsley and Kay (1976), Wall Structure of the Neurospora Hyphal Apex](https://www.microbiologyresearch.org/content/journal/micro/10.1099/00221287-95-2-233)：已打开期刊原始研究摘要。顶端与成熟侧壁结构/厚度不同，支持顶端新生壁向侧壁成熟的区分；本论文摘要不直接给出单根聚合物运动轨迹。

限制：真菌特化物种已说明；不据此声称 Saccharomyces cerevisiae 有同样的有隔菌丝结构。 不显示新隔膜生成、分支或核分裂；这些是明确范围省略，不要求增加新过程。 顶端聚合物修法需保持示意尺度，不把固定绝对坐标当作真实壁永不变形的物理定律。
