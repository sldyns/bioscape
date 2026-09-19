# 生物学过程全局科学审计

技术回归与截图检查不等于科学正确性验证。本表以逐项代码、几何、动画、物种范围与科学资料交叉审查为依据。

覆盖 84/84 项，已记录 112 项问题。全局初审覆盖完整，进入问题分级与逐项修复。

| 过程 | 所属目录 | 初审 | 问题编号 | 审计记录 |
|---|---|---|---|---|
| 蛋白质分泌 (secretion) | cell | 发现问题 | traffic-03 P1; traffic-04 P1; traffic-05 P2 | [traffic.json](traffic.json) |
| 转录 (transcription) | cell, plant | 发现问题 | regulation-03 P1 | [regulation.json](regulation.json) |
| 光合作用 (photosynthesis) | plant | 有边界通过 | — | [energy.json](energy.json) |
| 噬菌体侵染 (infection) | phage | 有边界通过 | — | [phageLife.json](phageLife.json) |
| DNA 复制叉 (replication) | cell, plant, yeast | 发现问题 | genome-01 P1 | [genome.json](genome.json) |
| 核苷酸切除修复 (dnaRepair) | cell, plant, yeast | 有边界通过 | — | [genome.json](genome.json) |
| 噬菌体介导的转导 (transduction) | bacterium, phage | 发现问题 | genome-02 P1; genome-03 P1 | [genome.json](genome.json) |
| 枯草芽孢杆菌内生孢子形成 (bacterialSporulation) | bacterium | 发现问题 | genome-04 P1; genome-05 P1; genome-06 P1 | [genome.json](genome.json) |
| 启动子与转录装配 (promoterRegulation) | cell | 发现问题 | regulation-01 P1 | [regulation.json](regulation.json) |
| 增强子与远程调控 (enhancerRegulation) | cell | 发现问题 | regulation-02 P1 | [regulation.json](regulation.json) |
| 染色质可及性 (chromatinAccess) | cell, plant, yeast | 发现问题 | chromatin-01 P1 | [chromatin.json](chromatin.json) |
| 染色质环与 TAD (tad) | cell | 发现问题 | chromatin-02 P1; chromatin-03 P2 | [chromatin.json](chromatin.json) |
| 植物的三套基因组 (plantGenome) | plant | 发现问题 | chromatin-04 P1; chromatin-05 P1; chromatin-06 P1 | [chromatin.json](chromatin.json) |
| RNA 引导的 DNA 甲基化 (plantRdDM) | plant | 发现问题 | chromatin-07 P1; chromatin-08 P1 | [chromatin.json](chromatin.json) |
| RNA 加工 (rnaProcessing) | cell, plant | 发现问题 | rna-01 P1 | [rna.json](rna.json) |
| 核孔运输 (nuclearTransport) | cell, plant, yeast | 发现问题 | rna-02 P1 | [rna.json](rna.json) |
| 微管马达运输 (motorTransport) | cell | 发现问题 | rna-03 P2 | [rna.json](rna.json) |
| 叶绿体蛋白导入 (organelleImport) | plant | 有边界通过 | — | [rna.json](rna.json) |
| 核糖体翻译 (translation) | cell, plant, yeast, paramecium | 发现问题 | translation-01 P1; translation-02 P1; translation-03 P1 | [translation.json](translation.json) |
| 新生蛋白质折叠 (proteinFolding) | cell, plant, yeast | 发现问题 | translation-04 P1 | [translation.json](translation.json) |
| 可变剪接：SMN2 (alternativeSplicing) | cell | 有边界通过 | — | [translation.json](translation.json) |
| 氮酶固氮 (nitrogenFixation) | bacterium | 发现问题 | translation-05 P1 | [translation.json](translation.json) |
| miRNA 引导的沉默 (rnaSilencing) | cell | 发现问题 | turnover-01 P1; turnover-02 P1 | [turnover.json](turnover.json) |
| 泛素–蛋白酶体降解 (proteasome) | cell, plant, yeast | 发现问题 | turnover-03 P1; turnover-04 P1 | [turnover.json](turnover.json) |
| Cas9 · CRISPR 干扰 (crispr) | bacterium | 发现问题 | turnover-05 P1 | [turnover.json](turnover.json) |
| 细菌 DNA 损伤 · SOS 响应 (bacterialRepair) | bacterium | 发现问题 | turnover-06 P1 | [turnover.json](turnover.json) |
| 呼吸链与 ATP 合成 (respiration) | cell, plant, yeast, paramecium | 发现问题 | energy-01 P1; energy-02 P2 | [energy.json](energy.json) |
| 糖酵解：碳与磷酸的去向 (glycolysis) | cell, plant, yeast | 发现问题 | energy-03 P1 | [energy.json](energy.json) |
| 细菌质膜上的呼吸 (bacterialEnergetics) | bacterium | 发现问题 | energy-04 P1 | [energy.json](energy.json) |
| 蓝细菌的产氧光合作用 (bacterialPhotosynthesis) | bacterium | 发现问题 | energy-05 P2 | [energy.json](energy.json) |
| 跨膜扩散 (diffusion) | cell, plant, bacterium, yeast | 发现问题 | membrane-01 P2 | [membrane.json](membrane.json) |
| 钠钾泵的主动运输 (activeTransport) | cell | 发现问题 | membrane-02 P2 | [membrane.json](membrane.json) |
| 红细胞的渗透响应 (osmoticBalance) | cell | 发现问题 | membrane-03 P1 | [membrane.json](membrane.json) |
| 大肠杆菌肽聚糖装配 (bacterialCellWall) | bacterium | 发现问题 | membrane-04 P1; membrane-05 P1; membrane-06 P1 | [membrane.json](membrane.json) |
| 受体介导内吞 (endocytosis) | cell | 发现问题 | traffic-01 P2 | [traffic.json](traffic.json) |
| 宏自噬 (autophagy) | cell | 发现问题 | traffic-02 P1 | [traffic.json](traffic.json) |
| 有丝分裂 (mitosis) | cell | 发现问题 | division-01 P1; division-02 P2 | [division.json](division.json) |
| 减数分裂 (meiosis) | cell | 发现问题 | division-03 P1; division-04 P1; division-05 P1; division-06 P2 | [division.json](division.json) |
| RTK–Ras–MAPK 信号 (signalTransduction) | cell | 发现问题 | signals-01 P1; signals-02 P2; signals-03 P1 | [signals.json](signals.json) |
| 线粒体内源性凋亡 (apoptosis) | cell | 发现问题 | signals-04 P1; signals-05 P1; signals-06 P2 | [signals.json](signals.json) |
| 红系终末分化 (differentiation) | cell | 发现问题 | signals-07 P1 | [signals.json](signals.json) |
| MHC-I 呈递与 T 细胞识别 (immuneResponse) | cell | 发现问题 | signals-08 P1 | [signals.json](signals.json) |
| 动作电位传播 (actionPotential) | cell | 有边界通过 | — | [neurons.json](neurons.json) |
| 谷氨酸突触传递 (synapse) | cell | 发现问题 | neurons-01 P1; neurons-02 P1 | [neurons.json](neurons.json) |
| 骨骼肌滑动肌丝 (muscle) | cell | 发现问题 | neurons-03 P2 | [neurons.json](neurons.json) |
| 纤毛的滑动与弯曲 (ciliaryMotion) | paramecium | 发现问题 | neurons-04 P1 | [neurons.json](neurons.json) |
| 质壁分离与复原 (plasmolysis) | plant | 有边界通过 | — | [plantWater.json](plantWater.json) |
| 气孔开闭 (stomata) | plant | 有边界通过 | — | [plantWater.json](plantWater.json) |
| 木质部运输与蒸腾 (plantLongDistanceTransport) | plant | 有边界通过 | — | [plantWater.json](plantWater.json) |
| 叶绿体光定位运动 (chloroplastMovement) | plant | 发现问题 | plantWater-01 P1; plantWater-02 P2 | [plantWater.json](plantWater.json) |
| 植物细胞分裂 (plantDivision) | plant | 发现问题 | plantGrowth-01 P1; plantGrowth-02 P1 | [plantGrowth.json](plantGrowth.json) |
| 纤维素沉积与细胞壁伸展 (cellWallGrowth) | plant | 有边界通过 | — | [plantGrowth.json](plantGrowth.json) |
| 被子植物双受精 (doubleFertilization) | plant | 发现问题 | plantGrowth-03 P1; plantGrowth-04 P2 | [plantGrowth.json](plantGrowth.json) |
| 丝状真菌的菌丝顶端生长 (fungalHyphae) | yeast | 发现问题 | plantGrowth-05 P1; plantGrowth-06 P2 | [plantGrowth.json](plantGrowth.json) |
| 生长素：解除转录抑制 (auxin) | plant | 发现问题 | plantSignals-01 P1; plantSignals-02 P1 | [plantSignals.json](plantSignals.json) |
| 植物防御：识别 flg22 (plantDefense) | plant | 发现问题 | plantSignals-03 P1; plantSignals-04 P2 | [plantSignals.json](plantSignals.json) |
| 质子梯度驱动蔗糖摄取 (plantTransport) | plant | 发现问题 | plantConnections-01 P1; plantConnections-02 P2 | [plantConnections.json](plantConnections.json) |
| 胞间连丝的选择性通行 (plasmodesmata) | plant | 有边界通过 | — | [plantConnections.json](plantConnections.json) |
| 光呼吸的三细胞器碳回收 (photorespiration) | plant | 有边界通过 | — | [plantConnections.json](plantConnections.json) |
| C₄ 与 CAM 的二氧化碳浓缩 (c4cam) | plant | 发现问题 | plantConnections-03 P1 | [plantConnections.json](plantConnections.json) |
| 乳糖操纵子：双重控制 (lacOperon) | bacterium | 发现问题 | operons-01 P1 | [operons.json](operons.json) |
| 色氨酸操纵子：抑制与衰减 (trpOperon) | bacterium | 发现问题 | operons-02 P2 | [operons.json](operons.json) |
| 酵母 GAL：解除激活域抑制 (yeastGal) | yeast | 有边界通过 | — | [operons.json](operons.json) |
| 酵母渗透调节：HOG 与甘油 (yeastOsmoregulation) | yeast | 发现问题 | operons-03 P1; operons-04 P2; operons-05 P1 | [operons.json](operons.json) |
| 细菌的转录与翻译偶联 (bacterialExpression) | bacterium | 发现问题 | bacterialCore-01 P1; bacterialCore-02 P1 | [bacterialCore.json](bacterialCore.json) |
| 大肠杆菌的二分裂 (bacterialDivision) | bacterium | 发现问题 | bacterialCore-03 P1; bacterialCore-04 P2 | [bacterialCore.json](bacterialCore.json) |
| F 质粒接合转移 (conjugation) | bacterium | 发现问题 | bacterialCore-05 P1 | [bacterialCore.json](bacterialCore.json) |
| 枯草芽孢杆菌的自然转化 (transformation) | bacterium | 发现问题 | bacterialCore-06 P1; bacterialCore-07 P2 | [bacterialCore.json](bacterialCore.json) |
| 细菌趋化 (chemotaxis) | bacterium | 发现问题 | bacterialSignals-01 P1 | [bacterialSignals.json](bacterialSignals.json) |
| 双组分信号传导 (twoComponent) | bacterium | 发现问题 | bacterialSignals-02 P1; bacterialSignals-03 P1 | [bacterialSignals.json](bacterialSignals.json) |
| 群体感应 (quorumSensing) | bacterium | 发现问题 | bacterialSignals-04 P1 | [bacterialSignals.json](bacterialSignals.json) |
| 生物膜形成与分散 (biofilm) | bacterium | 发现问题 | bacterialSignals-05 P1 | [bacterialSignals.json](bacterialSignals.json) |
| 酵母出芽 (yeastBudding) | yeast | 发现问题 | yeastLife-01 P1; yeastLife-02 P1 | [yeastLife.json](yeastLife.json) |
| 酵母酒精发酵 (yeastFermentation) | yeast | 发现问题 | yeastLife-03 P1 | [yeastLife.json](yeastLife.json) |
| 酵母配对与融合 (yeastMating) | yeast | 发现问题 | yeastLife-04 P1; yeastLife-05 P1 | [yeastLife.json](yeastLife.json) |
| 酵母减数分裂与产孢 (yeastSporulation) | yeast | 发现问题 | yeastLife-06 P1; yeastLife-07 P1 | [yeastLife.json](yeastLife.json) |
| 草履虫：摄食与消化 (parameciumFeeding) | paramecium | 发现问题 | parameciumLife-01 P1; parameciumLife-02 P2 | [parameciumLife.json](parameciumLife.json) |
| 伸缩泡：集水与排水 (contractileVacuole) | paramecium | 发现问题 | parameciumLife-03 P1 | [parameciumLife.json](parameciumLife.json) |
| 草履虫横裂 (parameciumDivision) | paramecium | 发现问题 | parameciumLife-04 P1; parameciumLife-05 P1 | [parameciumLife.json](parameciumLife.json) |
| 草履虫接合与核更新 (parameciumConjugation) | paramecium | 发现问题 | parameciumLife-06 P2 | [parameciumLife.json](parameciumLife.json) |
| T4 噬菌体裂解周期 (phageLytic) | phage | 发现问题 | phageLife-01 P1 | [phageLife.json](phageLife.json) |
| λ 噬菌体溶原与诱导 (phageLysogenic) | phage | 发现问题 | phageLife-02 P1 | [phageLife.json](phageLife.json) |
| T4 头尾装配与成熟 (phageAssembly) | phage | 有边界通过 | — | [phageLife.json](phageLife.json) |
| T4 DNA 包装马达 (phagePackaging) | phage | 有边界通过 | — | [phageLife.json](phageLife.json) |

“有边界通过”表示本次审查未确认错误，并非穷尽证明或真实原子模拟。修复验收另记录，保留初审原始证据。
