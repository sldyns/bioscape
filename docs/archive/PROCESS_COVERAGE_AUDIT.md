# 过程候选覆盖审计

审计日期：2026-09-19；**最终批次目录快照为 19:26（Asia/Shanghai，11:26 UTC）**。已等待 `extensionEntries` 达到 80 后统计，并逐一读取第二批实际定义；本次只更新审计文档，不新增实现。证据为源文件、entries、根入口、intro/stages/contexts 与关键分支；没有执行浏览器验收，静态覆盖不代表全量视觉/科学验收。

## 结论与计数口径

- 原候选表恰有 **91 行**：动物 23、植物 22、细菌 18、真菌 12、草履虫 9、噬菌体 7，包含跨物种重复及复合主题。
- 最终批次有 **84 个唯一注册过程 ID = 4 个原有 + 80 个扩展**。第一批 44 个扩展、第二批 36 个扩展均已注册；本快照没有把仅已分配的任务算作实现。
- 六个根入口共有 **110 条注册记录**：cell 32、plant 29、bacterium 19、yeast 17、paramecium 7、phage 6。比唯一 ID 多出的 **26 条是复用**，不是额外完成26个独立过程。
- 91 个候选中，**主体覆盖 52 行、部分覆盖 35 行、尚无适用注册覆盖 4 行**。第二批已没有“进行中”占位；部分覆盖的缺口仍保留，不能将“84个ID”转换为“91主题全部完成”。
- **`plantGenome` 是植物核/叶绿体/线粒体三套基因组分工，不是植物染色体三维组织；后者仍无覆盖。** 其实际内容映射到植物核基因表达、细胞器本地表达和蛋白导入的比较。
- **`transduction` 已补为 bacterium/phage 双入口**，唯一ID数量不变。其 P1/λ 两分支科学范围适用于噬菌体入口，但止于 DNA 递送，不宣称建立了稳定宿主遗传变化。

“主体”表示已注册定义覆盖主要机制或候选明确允许的指定实例，不等于所有细节齐全。“部分”表示只能支持一部分、只有概览、或还有原候选明确要求的子机制。“无”表示没有适用于该候选的已注册过程。此分类以机制而非标题匹配，测试/浏览器结果由主任务另报。

## 证据位置

- 候选：`docs/BIOLOGY_PROCESSES_BY_ORGANISM.md`。
- 根目录：`src/processes/catalog.js`、`src/processes/extensions.js` 及其显式导入的22个 `src/processes/modules/*/entries.js`。
- 原有定义：`transcriptionProcess.js`、`secretionProcess.js`、`photosynthesisProcess.js`、`phageProcess.js`。
- 新定义：读取所有第二批注册目标的 intro/stages；并核对 `plantGenome` 三区室与导入描述、`transduction.create({rootId})` 及状态、酵母 `respiration` 几何分支、`translation` 终止说明、`tad` 接触表示。不只凭模块名字判断覆盖。

## 动物细胞（23 项）

| 编号 | 原候选 | 注册覆盖 | 已有/新模块 ID | 缺口与适用边界 |
| --- | --- | --- | --- | --- |
| 1-01 | DNA 复制 | 部分 | replication | 复制叉、前后随链、引物处理与连接已展示；聚合酶校对没有独立机制。 |
| 1-02 | DNA 损伤修复 | 部分 | dnaRepair | 已选真核核苷酸切除修复；错配修复、双链断裂路径及路径比较未实现。 |
| 1-03 | 转录与启动子调控 | 主体 | transcription（原有）、promoterRegulation | Pol II 起始与延伸、含 TATA 的哺乳动物启动子装配；不是全部启动子的通用序列模型。 |
| 1-04 | 增强子—启动子调控 | 主体 | enhancerRegulation | 远端元件与因子招募条件对照；模型明确接触不保证激活，输出为定性。 |
| 1-05 | 染色质可及性与表观调控 | 部分 | chromatinAccess | ISWI 类核小体滑移；DNA 甲基化与具体组蛋白修饰机制未覆盖。 |
| 1-06 | TAD 与染色质环挤出 | 部分 | tad | cohesin、相向 CTCF 和边界/耗竭条件已覆盖；没有真实或示意二维接触矩阵，虚线是接触关系示意。 |
| 1-07 | RNA 加工与可变剪接 | 主体 | rnaProcessing、alternativeSplicing | 加帽、剪接、3′ 加工加上人类 SMN2 外显子7保留/跳跃；后者仅 cell 根，不是植物可变剪接实例。 |
| 1-08 | 核质运输 | 部分 | nuclearTransport | 仅经典 NLS–importin 蛋白入核与 Ran 回收；mRNP 输出明确不在范围内。 |
| 1-09 | 翻译与蛋白质折叠 | 主体 | translation、proteinFolding | 80S 的 A/P/E、延长/终止及 Hsp70 折叠示意；起始和完整折叠路径被省略。 |
| 1-10 | RNA 与蛋白质降解 | 主体 | rnaSilencing、proteasome | 动物 miRNA 靶 RNA 周转与 K48 泛素底物降解分开呈现；不是所有 RNA 降解路线。 |
| 1-11 | 蛋白质分泌与膜蛋白定位 | 部分 | secretion（原有） | 原有经典可溶性分泌；膜蛋白插入、保留朝向和定位比较仍缺。 |
| 1-12 | 胞吞、内体分选与回收 | 部分 | endocytosis | LDL 摄取、早期内体酸化分选；受体返回质膜与晚期内体/溶酶体后续运输未显示。 |
| 1-13 | 自噬与溶酶体降解 | 部分 | autophagy | 宏自噬包裹、双膜融合和降解已显示；小分子跨膜回收至胞质明确省略。 |
| 1-14 | 细胞呼吸与 ATP 合成 | 部分 | glycolysis、respiration | 糖酵解和呼吸链/ATP 合酶已实现；TCA 仅作为供电子来源提及，无循环机制。 |
| 1-15 | 跨膜运输与渗透 | 部分 | diffusion、activeTransport、osmoticBalance | 氧/水扩散、Na⁺/K⁺ 泵与成熟哺乳动物红细胞渗透形态已覆盖；一般离子通道及耦联运输仍未完整覆盖，红细胞不含体积调节/溶血过程。 |
| 1-16 | 细胞骨架与马达运输 | 部分 | motorTransport | kinesin-1/dynein 定向货运已注册；微管动态不稳定性与细胞迁移未覆盖。 |
| 1-17 | 有丝分裂与胞质分裂 | 主体 | mitosis | 动物姐妹分离、纺锤体附着、检查点与收缩环；从复制后染色体开始，凝缩细节省略。 |
| 1-18 | 减数分裂与重组 | 主体 | meiosis | 小鼠精母细胞：配对、非姐妹交换、I/II 分离及四个连桥精细胞；只画两对常染色体子集。 |
| 1-19 | 细胞周期检查点与凋亡 | 主体 | mitosis、apoptosis | 一个未附着动粒真正阻止分离；另有哺乳动物内源性凋亡。并非整个细胞周期检查点网络。 |
| 1-20 | 信号转导与分化 | 部分 | signalTransduction、differentiation | PDGFR–Ras–MAPK 加小鼠红系终末成熟；缺 GPCR 实例，两个模型不是一条已验证的配体→分化闭环。 |
| 1-21 | 动作电位与突触传递 | 主体 | actionPotential、synapse | 无髓轴突与谷氨酸突触/星形胶质细胞实例；只适用该神经元场景。 |
| 1-22 | 肌肉收缩 | 主体 | muscle | 哺乳动物骨骼肌肌节，Ca²⁺、粗细肌丝与 ATP 横桥循环；膜兴奋、神经肌接头及外力恢复长度省略。 |
| 1-23 | 免疫细胞的识别与应答 | 主体 | immuneResponse | 内源性肽经 MHC-I 呈递并被效应 CD8 T 细胞特异识别/极化，满足指定呈递实例；不演示初始 T 细胞启动或实际杀伤。 |

## 植物细胞（22 项）

| 编号 | 原候选 | 注册覆盖 | 已有/新模块 ID | 缺口与适用边界 |
| --- | --- | --- | --- | --- |
| 2-01 | 光反应 | 部分 | photosynthesis（原有） | 原有光合作用概览有光能、电子/质子及 ATP/NADPH；PSII/PSI 的独立分辨和完整传递机制仍不足。 |
| 2-02 | 卡尔文循环 | 部分 | photosynthesis（原有） | 概览提及 CO₂、G3P、RuBP 再生；不是单独的碳流、固定/还原/再生机制课。 |
| 2-03 | 细胞呼吸与 ATP 合成 | 部分 | respiration、glycolysis | 植物根入口已注册线粒体通路与胞质糖酵解；TCA 和植物替代电子支路未展开。 |
| 2-04 | 质壁分离与复原 | 主体 | plasmolysis | 洋葱表皮细胞、高渗及稀外液恢复分支，保持壁与原生质体区别。 |
| 2-05 | 气孔开闭 | 主体 | stomata | 拟南芥肾形保卫细胞，蓝光/ABA、离子与膨压；不泛化到所有气孔形态。 |
| 2-06 | 主动运输与液泡稳态 | 部分 | plantTransport | 伴胞质膜 H⁺ 泵–SUC2 共转运；液泡膜泵、储存及液泡稳态未实现。 |
| 2-07 | DNA 复制、修复与核内转录 | 主体 | replication、dnaRepair、transcription（原有）、plantGenome | 核内复制、NER、Pol II 已注册；plantGenome 额外展示核/叶绿体/线粒体基因组分工，不是植物三维染色体组织。 |
| 2-08 | 启动子、增强子与植物调控因子 | 部分 | auxin | 有拟南芥 ARF/Aux-IAA 核内调控案例；无独立植物启动子装配或增强子模型，不能挪用哺乳动物两个调控模块。 |
| 2-09 | 染色质调控与 RNA 沉默 | 主体 | chromatinAccess、plantRdDM | 植物 ISWI 背景的核小体滑移加拟南芥经典 Pol IV/RDR2/DCL3/AGO4/Pol V/DRM2 路径；非经典 RdDM 与甲基化维持不在范围内。 |
| 2-10 | 植物染色体三维组织 | 无 | — | 仍无拟南芥/水稻局部三维结构域和接触过程。plantGenome 实际是三套基因组分工，名称不能作为此项证据；动物 tad 亦不适用。 |
| 2-11 | RNA 加工与翻译 | 主体 | rnaProcessing、translation、plantGenome | 核内加工、plantGenome 的成熟 mRNA 出核/胞质翻译与细胞器本地表达区分已组合覆盖。输出机器细节未展开，alternativeSplicing 只有人类实例。 |
| 2-12 | 细胞器蛋白导入 | 主体 | organelleImport、plantGenome | 叶绿体 TOC/TIC 基质蛋白导入有专课；plantGenome 概览比较叶绿体转运肽与线粒体前导序列/TOM-TIM。线粒体导入机器细节仍未专门展开。 |
| 2-13 | 有丝分裂与细胞板形成 | 主体 | plantDivision | 拟南芥分生组织细胞，姐妹分离、成膜体、囊泡与向外生长的细胞板。 |
| 2-14 | 细胞壁合成与伸长 | 主体 | cellWallGrowth | 拟南芥下胚轴壁面，纤维素沉积、微管关系与壁可伸展性条件。 |
| 2-15 | 胞间连丝运输 | 主体 | plasmodesmata | 相邻拟南芥根细胞，胞质套筒与内质网连丝管、胼胝质限制。 |
| 2-16 | 生长素信号与向性 | 部分 | auxin | TIR1/AFB–Aux/IAA–ARF 与组织差异伸长小图；PIN 等极性运输与真正向性刺激重分布未展开。 |
| 2-17 | 叶绿体移动 | 主体 | chloroplastMovement | 拟南芥叶肉细胞弱蓝光积聚、强蓝光 phot2 依赖避让；路径沿皮层，不穿中央液泡。 |
| 2-18 | 光呼吸 | 主体 | photorespiration | 拟南芥 C₂ 回收跨叶绿体、过氧化物酶体和线粒体；明确4C→3C回收+1C释放，GLYK 条件影响最后转化。 |
| 2-19 | C₃/C₄/CAM 比较 | 部分 | c4cam、photosynthesis（原有） | 新课比较玉米 C₄ 空间分隔与指定 Kalanchoë 的 CAM 昼夜储酸；C₃ 仅依托原有普通光合概览，没有完整三方并列对照。 |
| 2-20 | 水与同化物运输 | 部分 | plantTransport、plantLongDistanceTransport | 伴胞蔗糖摄取加根—茎—叶木质部蒸腾/吸水；韧皮部压力流与完整源—库同化物运输仍缺。 |
| 2-21 | 植物防御与逆境响应 | 部分 | plantDefense | 拟南芥 flg22–FLS2/BAK1–RBOHD 活性氧分支；感知到表达/长期响应没有完整闭环，未覆盖干旱专题。 |
| 2-22 | 减数分裂与双受精 | 部分 | doubleFertilization | 拟南芥胚珠组织中的花粉管、两次融合、2n胚/3n胚乳已覆盖；植物减数分裂仍未实现，小鼠 meiosis 不能补位。 |

## 细菌（18 项）

| 编号 | 原候选 | 注册覆盖 | 已有/新模块 ID | 缺口与适用边界 |
| --- | --- | --- | --- | --- |
| 3-01 | DNA 复制、分配与二分裂 | 主体 | bacterialDivision | 慢生长大肠杆菌的一轮复制/分离、FtsZ 分裂体与包膜内陷；不是多轮重叠复制。 |
| 3-02 | 细菌转录与翻译耦联 | 主体 | bacterialExpression | 大肠杆菌 σ70 与 70S 读取新生 RNA；明确偶联并非所有菌/基因的固定状态。 |
| 3-03 | lac 操纵子 | 主体 | lacOperon | 乳糖和葡萄糖两输入、LacI、CAP–cAMP；诱导物排斥等被明确省略。 |
| 3-04 | trp 操纵子与衰减 | 主体 | trpOperon | TrpR 起始抑制和 trpL 翻译/互斥发夹的衰减；区分游离 Trp 与充电 tRNA。 |
| 3-05 | 两组分信号系统 | 主体 | twoComponent | 大肠杆菌 NarX–NarL，明确厌氧及 FNR 条件；没有泛称所有双组分系统。 |
| 3-06 | 鞭毛运动与趋化 | 主体 | chemotaxis | 大肠杆菌周生鞭毛、游动/翻滚与时间比较；轨迹为示意，不是确定性寻路。 |
| 3-07 | 细胞膜运输与能量转换 | 主体 | diffusion、bacterialEnergetics | 大肠杆菌两种有氧质膜呼吸支路、不同质子流与 ATP 合酶加局部扩散；不是线粒体场景，也不是全部细菌能量代谢。 |
| 3-08 | 糖代谢与发酵 | 无 | — | 未注册具体细菌糖代谢/发酵；yeastFermentation 仅酿酒酵母，glycolysis 没有 bacterium 根。 |
| 3-09 | 肽聚糖合成与细胞包被生长 | 部分 | bacterialDivision、bacterialCellWall | 隔膜包膜生长加大肠杆菌 RodA 聚合/PBP2 交联。新课从已翻转的脂质II开始，胞内前体合成和翻转本身仍未展开。 |
| 3-10 | 接合与质粒转移 | 主体 | conjugation | 大肠杆菌游离F质粒供受体、菌毛接触、TraI/oriT 单链转移和双方补链；不是 Hfr 染色体转移。 |
| 3-11 | 自然转化 | 主体 | transformation | 感受态枯草芽孢杆菌，ComEC 单链入胞、另一链降解、DprA/RecA 与同源整合条件；后续遗传分离省略。 |
| 3-12 | 噬菌体介导转导 | 主体 | transduction | P1广义误包装与λ罕见不精确切出两分支，区别宿主DNA和杂合包装内容；模型止于递送，稳定遗传未建立。 |
| 3-13 | 群体感应 | 主体 | quorumSensing | 费氏弧菌 LuxI/AHL/LuxR，扩散/稀释条件与定性发光输出；不是直接数细胞。 |
| 3-14 | 生物膜形成 | 主体 | biofilm | 铜绿假单胞菌PAO1 的附着、Psl/eDNA基质、微菌落及局部分散；明确并非所有菌株的固定发育形态。 |
| 3-15 | CRISPR 防御及其他防御机制 | 部分 | crispr | 化脓性链球菌 II-A Cas9 的 PAM/R-loop/双链切割干扰专课；新间隔序列获取、表达和RNA加工明确未展示。 |
| 3-16 | DNA 修复与应激调控 | 部分 | bacterialRepair | 大肠杆菌 RecA–LexA SOS 调控与应答基因转录；没有实际损伤切除/重组修复或修复完成结果。 |
| 3-17 | 芽孢形成与萌发 | 部分 | bacterialSporulation | 枯草芽孢杆菌不对称隔膜、包裹、孢子分层/成熟/释放；明确不展示萌发，且形成一孢子不是增殖。 |
| 3-18 | 固氮或光合细菌专题 | 主体 | nitrogenFixation、bacterialPhotosynthesis | 维涅兰德固氮菌钼氮酶/氧保护，以及集胞藻PCC6803类囊体线性光合；均为指定菌种，不泛化细菌。 |

## 真菌（先以出芽酵母为例）（12 项）

| 编号 | 原候选 | 注册覆盖 | 已有/新模块 ID | 缺口与适用边界 |
| --- | --- | --- | --- | --- |
| 4-01 | 出芽与细胞分离 | 主体 | yeastBudding | 酿酒酵母芽位、母芽连接、核分配、收缩及母女分离。 |
| 4-02 | 闭合式有丝分裂 | 主体 | yeastBudding | 同一课的闭合式有丝分裂阶段：保留核膜、纺锤极体与母芽轴核分配；不是独立第二课。 |
| 4-03 | 酒精发酵与呼吸 | 主体 | yeastFermentation、respiration、glycolysis | 高糖 Crabtree 条件发酵与单独呼吸/糖酵解模块；respiration 为酵母替换 Ndi1，不能按有氧/无氧简单开关。 |
| 4-04 | DNA 复制与基因表达 | 部分 | replication、translation、yeastGal | 有复制、胞质翻译和 GAL1 核内调控/转录实例；仍缺酵母 RNA 加工专门路径，不能将动物/植物 rnaProcessing 注册推定到 yeast。 |
| 4-05 | 营养响应与基因调控 | 主体 | yeastGal | 酿酒酵母 GAL1，Gal4/Gal80/Gal3 与半乳糖/葡萄糖条件、Mig1–Cyc8/Tup1；明确不是细菌式操纵子。 |
| 4-06 | 蛋白质分泌与极性运输 | 部分 | yeastBudding | 有沿肌动蛋白索运往芽体的囊泡概览；完整 ER→Golgi→极性分泌链未覆盖，原有 secretion 仅 cell 根。 |
| 4-07 | 细胞壁合成与重塑 | 部分 | yeastBudding | 有局部壁生长/芽颈隔膜的概览；葡聚糖、几丁质合成与重塑未展开，植物纤维素课不计入。 |
| 4-08 | 自噬与液泡降解 | 无 | — | 现有 autophagy 明确为哺乳动物溶酶体且仅 cell 根；尚无酵母液泡和营养条件实例。 |
| 4-09 | 渗透应激与适应 | 主体 | diffusion、yeastOsmoregulation | 温和高渗下 Sln1–Ypd1–Ssk1/Hog1、早期 Fps1 关闭、甘油积累与体积恢复；Sho1 平行支路未展开。 |
| 4-10 | 交配型识别与细胞融合 | 主体 | yeastMating | 酿酒酵母 a/α 识别、突起、胞质融合和核融合、单倍体到二倍体；同型条件不完成交配。 |
| 4-11 | 减数分裂与孢子形成 | 主体 | yeastSporulation | 酿酒酵母 a/α 二倍体在缺氮/非发酵碳源条件下重组、两次分裂、前孢子膜和四孢子子囊；不含萌发。 |
| 4-12 | 菌丝顶端生长 | 主体 | fungalHyphae | 明确粗糙脉孢菌的有隔菌丝/顶体/顶端供膜与壁生长，不是酿酒酵母；挂 yeast 根是图谱真菌入口归类。 |

## 草履虫（9 项）

| 编号 | 原候选 | 注册覆盖 | 已有/新模块 ID | 缺口与适用边界 |
| --- | --- | --- | --- | --- |
| 5-01 | 纤毛摆动与游动 | 部分 | ciliaryMotion、parameciumFeeding | 单根9+2轴丝的动力蛋白滑动—弯曲与口沟汇食已覆盖；整细胞游动、纤毛间节律协调尚未完整展开。 |
| 5-02 | 摄食与食物泡形成 | 主体 | parameciumFeeding | 多小核草履虫的口沟/胞咽和食物泡形成。 |
| 5-03 | 胞内消化与排出 | 主体 | parameciumFeeding | 与上一候选共用同一 ID：酸化、溶酶体消化、营养吸收与胞肛排出。 |
| 5-04 | 伸缩泡与渗透调节 | 主体 | contractileVacuole | 多小核草履虫伸缩泡复合体，集水/隔离/固定孔排水及低渗条件。 |
| 5-05 | 刺激反应与避障 | 无 | — | 尚无膜电活动触发纤毛反转的避障过程；哺乳动物 actionPotential 不能直接复用。 |
| 5-06 | 大核/小核功能分工 | 部分 | parameciumDivision、parameciumConjugation | 明确小核生殖系、大核营养表达的职责，并展示不同核分裂/重建；实际营养表达与遗传信息使用的比较仍主要是文字说明。 |
| 5-07 | 横向二分裂 | 主体 | parameciumDivision | 尾草履虫小核闭合式有丝分裂、大核无丝分裂、口器重建与横向分裂；每个子代获得两类核。 |
| 5-08 | 接合与核重组 | 主体 | parameciumConjugation | 尾草履虫小核减数、原核双向交换、合核和大核原基/小核保留；后续两次细胞分裂省略。 |
| 5-09 | 细胞呼吸与蛋白质合成 | 部分 | respiration、translation | 共用真核局部课已注册；并未保留完整草履虫结构背景。翻译说明已提醒其核遗传密码差异。 |

## 噬菌体（7 项）

| 编号 | 原候选 | 注册覆盖 | 已有/新模块 ID | 缺口与适用边界 |
| --- | --- | --- | --- | --- |
| 6-01 | 宿主识别、吸附与基因组递送 | 主体 | infection（原有）、phageLytic | 原有 T4 吸附/收缩尾递送，加裂解周期首阶段；同一过程层次不同，不能算两个独立候选。 |
| 6-02 | 感染后的基因表达与基因组复制 | 部分 | phageLytic | T4 早期表达、宿主资源利用和复制连接体概览；早晚期调控/复制机器未独立展开。 |
| 6-03 | 衣壳、尾部与颗粒装配 | 主体 | phageLytic、phageAssembly | T4 前头支架、gp21成熟、头尾分别装配并结合、尾纤维安装；gp21 失活阻止完整子代形成。 |
| 6-04 | DNA 包装 | 主体 | phageLytic、phagePackaging | T4 gp20门户、gp17 ATP马达、装填/扩壳/头满切割与gp13/gp14封口；无ATP条件停滞。 |
| 6-05 | 裂解与子代释放 | 部分 | phageLytic | 有 T4 宿主内膜/壁/外膜破坏及子代释放；裂解蛋白系统本身未逐层展开。 |
| 6-06 | 溶原、诱导与命运调控 | 主体 | phageLysogenic | λ 的整合、CI 维持、随宿主遗传与诱导；不是 T4 溶原，也不模拟全部初次感染命运决定。 |
| 6-07 | 转导与宿主遗传变化 | 部分 | transduction | 已同时注册 bacterium/phage。P1和λ两种转导及宿主片段递送已覆盖；后续建立、重组与稳定宿主遗传改变明确未展示。 |

## 跨根复用与重复候选

以下 13 个唯一 ID 对应 39 条根注册，其余 71 个 ID 各只有一个根；合计 84 个 ID、110 条根注册。复用合理与否须分别看生物学范围。

| 唯一 ID | 根入口 | 审计意见 |
| --- | --- | --- |
| transcription（原有） | cell、plant | 真核 Pol II 基本过程；没有 yeast 注册，不可凭保守机制把酵母基因表达列完整。 |
| replication | cell、plant、yeast | 局部真核复制叉可复用；都没有独立校对机制，不可说覆盖细菌复制机器。 |
| dnaRepair | cell、plant、yeast | 仅真核全基因组 NER 共同步骤，intro 已承认识别蛋白差异；不是三种独立修复路径。 |
| transduction | bacterium、phage | 同一P1/λ转导机制的宿主/噬菌体双入口；不新增一个独立动画，且不展示稳定遗传建立。 |
| chromatinAccess | cell、plant、yeast | 有植物 CHR11/17 与酵母 Isw1 背景；核心为 ISWI 滑移，不含 DNA 甲基化/RdDM。 |
| rnaProcessing | cell、plant | 核内加工共同机制，未注册 yeast；可变剪接由仅cell注册的 alternativeSplicing 另课承担。 |
| nuclearTransport | cell、plant、yeast | 保守 NLS–importin 入核；任何根都不能拿它充当 mRNP 输出。 |
| translation | cell、plant、yeast、paramecium | 真核胞质 80S 局部过程，不是细菌 70S 或细胞器翻译。代码与文字未硬编码 UAA/UAG 为通用终止，提醒草履虫密码差异。 |
| proteinFolding | cell、plant、yeast | 胞质 Hsp70 示意可共享；非 ER 折叠或细胞器导入。 |
| proteasome | cell、plant、yeast | 保守胞质 26S/K48 底物路径；根复用不能另算三种机制。 |
| respiration | cell、plant、yeast、paramecium | 酵母有真实 root 分支：Ndi1 替代复合体 I 且移除该处泵流；植物/原生生物替代支路未展开。 |
| glycolysis | cell、plant、yeast | 明确为胞质通路；没有 bacterium/paramecium 注册，植物质体版本不在范围内。 |
| diffusion | cell、plant、bacterium、yeast | 局部脂双层/水通道共同机制；不足以覆盖各物种完整体积调节、包被或能量转换。 |

此外，同一根的候选也可共享一个 ID：`yeastBudding` 同时覆盖出芽和闭合式有丝分裂；`parameciumFeeding` 同时覆盖摄食与消化排出；`phageLytic` 为 T4 表达、复制、装配、包装和裂解提供概览。`photosynthesis` 对光反应和卡尔文循环均有概览。拆出更细课程会增加 ID 数，但不会自动增加候选主题行数。细菌“噬菌体介导转导”和噬菌体“转导与宿主遗传变化”也是同一跨宿主机制的两种入口。

## 科学范围核查与明确剩余主题

### 尚无适用注册覆盖的四个候选

| 候选 | 为什么仍为空 |
| --- | --- |
| 植物染色体三维组织 | `plantGenome` 展示三种遗传区室及核编码蛋白导入，不含局部三维接触域；哺乳动物 CTCF–cohesin `tad` 不适用。 |
| 细菌糖代谢与发酵 | `glycolysis` 仅 cell/plant/yeast，`yeastFermentation` 为酿酒酵母；`bacterialEnergetics` 是有氧呼吸支路，不能替代具体菌种发酵及电子受体/终点比较。 |
| 酵母自噬与液泡降解 | `autophagy` 是仅cell注册的哺乳动物双膜自噬/溶酶体实例；仍无酵母营养条件、液泡递送与回收课。 |
| 草履虫刺激反应与避障 | `ciliaryMotion` 是单根轴丝动力学，未接上草履虫膜电活动与纤毛反转/全细胞游动反应；哺乳动物 `actionPotential` 不适用。 |

### 部分主题中的重要未实现子机制

- **动物/通用分子机制：**复制校对、多种DNA修复路径比较、DNA甲基化/具体组蛋白修饰案例、TAD接触矩阵、mRNP选择性输出、膜蛋白插入/定位比较、内体完整回收与溶酶体后续运输、自噬降解产物跨膜回收、TCA循环、一般离子通道/耦联运输、微管动态/细胞迁移、GPCR及明确外界信号到分化的连续实例。
- **植物：**独立精细PSII/PSI光反应与卡尔文循环课、植物增强子/启动子专门实例、液泡膜运输和稳态、PIN等极性生长素运输、C₃/C₄/CAM完整三方比较、韧皮部压力流/源—库同化物运输、防御从感知到表达/长期响应、植物减数分裂。线粒体导入在`plantGenome`仅为比较概览，尚无详细机器专课。
- **细菌：**肽聚糖胞内前体合成与脂质II翻转；CRISPR记忆获取/表达/RNA加工；SOS之后的实际修复执行与结局；芽孢萌发。新模块分别明确止于已翻转脂质II、Cas9干扰、SOS基因调控、芽孢释放，不能按宽泛标题报完整。
- **酵母：**RNA加工、完整ER/Golgi到芽体极性分泌、葡聚糖/几丁质壁合成重塑的分子机制。
- **草履虫：**多纤毛协调节律/整细胞游动；大小核分工仍主要由分裂/接合文字和核事件解释，未有营养表达对比过程；共用呼吸/翻译课没有完整草履虫结构背景。
- **噬菌体：**感染后的早晚期表达/复制机器细节、逐层展开的裂解蛋白系统；转导后的建立/重组/稳定宿主遗传改变。`phageAssembly`与`phagePackaging`已把装配和包装从概览提升为独立机制课，未把这两项继续列待做。

### 已核查的适用边界

1. 动物开放式分裂、植物细胞板与酵母闭合式分裂保持分开。`meiosis` 为小鼠精母细胞；`yeastSporulation` 是酵母减数/孢子；`doubleFertilization` 是拟南芥胚珠融合事件，不含植物减数分裂。
2. 哺乳动物`promoterRegulation`/`enhancerRegulation`/`tad`只挂cell；拟南芥`plantRdDM`另有真实路径。`plantGenome`不含三维结构域，已纠正前次仅凭计划名的错误映射。
3. 动物Na⁺/K⁺泵、LDL内吞和宏自噬均未被计作植物/酵母特有膜系统。植物伴胞`plantTransport`与木质部`plantLongDistanceTransport`也不能合并声称完成韧皮部源—库运输。
4. 酿酒酵母`respiration`确有Ndi1入口且去掉该处质子泵流；细菌`bacterialEnergetics`另用质膜和明确呼吸支路。未用普通真核复合体I或虚构线粒体填细菌/酵母。
5. 自然转化/内生孢子选择枯草芽孢杆菌；固氮选择维涅兰德固氮菌；光合选择集胞藻PCC6803；群体感应选择费氏弧菌；生物膜选择PAO1。它们是细菌类别中的指定实例，不是当前大肠杆菌根形态同时具有的功能。
6. `fungalHyphae`明确为粗糙脉孢菌，不是酿酒酵母，intro说明归真菌入口。虽然技术root仍叫`yeast`，实际专门模型身份清楚；入口命名不应让用户误以为酿酒酵母是该菌丝例子。
7. `transduction`可双入口：P1广义与λ局限性比较，供受体始终是大肠杆菌，几何不依赖bacterium根；`rootId`仅记入状态。审查建议追加phage后，最终entries已确认双根。P1未被画成染色体整合起点，λ与T4也没有混用；`stableInheritanceShown:false`是必须保留的范围边界。
8. 人类SMN2 `alternativeSplicing`仅cell注册；不能作为植物或酵母可变剪接完成证据。草履虫共享翻译课明确提醒核遗传密码差异。
9. 神经元、骨骼肌、CD8效应T细胞/靶细胞、红系成熟、红细胞渗透、保卫细胞、胚珠和丝状真菌都是指定专门场景，不能声称单个普通根细胞具备全部功能。`immuneResponse`演示呈递/识别而非实际杀伤，`differentiation`从已承诺红系起步而非任意干细胞。

## 最终批次与复核范围

36个第二批ID均已注册：`plantGenome`、`plantRdDM`、`motorTransport`、`organelleImport`、`crispr`、`bacterialRepair`、`bacterialEnergetics`、`bacterialPhotosynthesis`、`osmoticBalance`、`bacterialCellWall`、`differentiation`、`immuneResponse`、`muscle`、`ciliaryMotion`、`plantLongDistanceTransport`、`chloroplastMovement`、`doubleFertilization`、`fungalHyphae`、`photorespiration`、`c4cam`、`yeastGal`、`yeastOsmoregulation`、`conjugation`、`transformation`、`quorumSensing`、`biofilm`、`yeastMating`、`yeastSporulation`、`parameciumDivision`、`parameciumConjugation`、`phageAssembly`、`phagePackaging`、`transduction`、`bacterialSporulation`、`alternativeSplicing`、`nitrogenFixation`。

本审计核对91行数量、各生物类别计数、84唯一ID/80扩展/110根注册以及36个第二批唯一ID。它没有运行全仓或浏览器测试，未宣称真实设备通过，也没有新增待做机制；实现运行时与视觉验收采用主任务的独立证据。
