# 科学审计修复与验收

[验收范围与执行结果](VALIDATION.md) · [代表帧记录](visual-checks.json)

全局初审 84 项、112 个问题；修复记录 112 项，待处理 0 项，未解决 0 项。实际画面复核 84/84 项。

二次交叉复核另外记录 13 项残留细节；其中 0 项尚未关闭。详见 [跟进清单](followup-issues.json)。

初审报告保留原始缺陷证据；修复记录包含改动、回归条件及模型限制。模型仍是有明确物种与范围的教学示意，测试不能替代科学证据。

| 过程 | 初审问题 | 修复记录 | 画面复核 |
|---|---|---|---|
| 蛋白质分泌 (secretion) | 3；追加 1 项 | [traffic-03: fixed](../resolutions/traffic.json); [traffic-04: fixed](../resolutions/traffic.json); [traffic-05: fixed](../resolutions/traffic.json); [peer-traffic-01: fixed](peer-traffic.md) | 已复核代表帧 |
| 转录 (transcription) | 1；追加 2 项 | [regulation-03: fixed](../resolutions/regulation.json); [peer-regulation-01: fixed](peer-regulation.md); [peer-regulation-02: fixed](peer-operons.md) | 已复核代表帧 |
| 光合作用 (photosynthesis) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| 噬菌体侵染 (infection) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| DNA 复制叉 (replication) | 1；追加 1 项 | [genome-01: fixed](../resolutions/genome.json); [peer-genome-bubbles-01: fixed](peer-genome-bubbles.md) | 已复核代表帧 |
| 核苷酸切除修复 (dnaRepair) | 初审未确认错误；追加 1 项 | [peer-genome-bubbles-01: fixed](peer-genome-bubbles.md) | 已复核代表帧 |
| 噬菌体介导的转导 (transduction) | 2 | [genome-02: fixed](../resolutions/genome.json); [genome-03: fixed](../resolutions/genome.json) | 已复核代表帧 |
| 枯草芽孢杆菌内生孢子形成 (bacterialSporulation) | 3 | [genome-04: fixed](../resolutions/genome.json); [genome-05: fixed](../resolutions/genome.json); [genome-06: fixed](../resolutions/genome.json) | 已复核代表帧 |
| 启动子与转录装配 (promoterRegulation) | 1；追加 1 项 | [regulation-01: fixed](../resolutions/regulation.json); [peer-regulation-02: fixed](peer-operons.md) | 已复核代表帧 |
| 增强子与远程调控 (enhancerRegulation) | 1；追加 1 项 | [regulation-02: fixed](../resolutions/regulation.json); [peer-regulation-02: fixed](peer-operons.md) | 已复核代表帧 |
| 染色质可及性 (chromatinAccess) | 1 | [chromatin-01: fixed](../resolutions/chromatin.json) | 已复核代表帧 |
| 染色质环与 TAD (tad) | 2 | [chromatin-02: fixed](../resolutions/chromatin.json); [chromatin-03: fixed](../resolutions/chromatin.json) | 已复核代表帧 |
| 植物的三套基因组 (plantGenome) | 3 | [chromatin-04: fixed](../resolutions/chromatin.json); [chromatin-05: fixed](../resolutions/chromatin.json); [chromatin-06: fixed](../resolutions/chromatin.json) | 已复核代表帧 |
| RNA 引导的 DNA 甲基化 (plantRdDM) | 2 | [chromatin-07: fixed](../resolutions/chromatin.json); [chromatin-08: fixed](../resolutions/chromatin.json) | 已复核代表帧 |
| RNA 加工 (rnaProcessing) | 1 | [rna-01: fixed](../resolutions/rna.json) | 已复核代表帧 |
| 核孔运输 (nuclearTransport) | 1 | [rna-02: fixed](../resolutions/rna.json) | 已复核代表帧 |
| 微管马达运输 (motorTransport) | 1 | [rna-03: fixed](../resolutions/rna.json) | 已复核代表帧 |
| 叶绿体蛋白导入 (organelleImport) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| 核糖体翻译 (translation) | 3 | [translation-01: fixed](../resolutions/translation.json); [translation-02: fixed](../resolutions/translation.json); [translation-03: fixed](../resolutions/translation.json) | 已复核代表帧 |
| 新生蛋白质折叠 (proteinFolding) | 1 | [translation-04: fixed](../resolutions/translation.json) | 已复核代表帧 |
| 可变剪接：SMN2 (alternativeSplicing) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| 氮酶固氮 (nitrogenFixation) | 1 | [translation-05: fixed](../resolutions/translation.json) | 已复核代表帧 |
| miRNA 引导的沉默 (rnaSilencing) | 2 | [turnover-01: fixed](../resolutions/turnover.json); [turnover-02: fixed](../resolutions/turnover.json) | 已复核代表帧 |
| 泛素–蛋白酶体降解 (proteasome) | 2 | [turnover-03: fixed](../resolutions/turnover.json); [turnover-04: fixed](../resolutions/turnover.json) | 已复核代表帧 |
| Cas9 · CRISPR 干扰 (crispr) | 1；追加 1 项 | [turnover-05: fixed](../resolutions/turnover.json); [peer-bubble-extensions-02: fixed](peer-bubble-extensions.md) | 已复核代表帧 |
| 细菌 DNA 损伤 · SOS 响应 (bacterialRepair) | 1；追加 1 项 | [turnover-06: fixed](../resolutions/turnover.json); [peer-bubble-extensions-02: fixed](peer-bubble-extensions.md) | 已复核代表帧 |
| 呼吸链与 ATP 合成 (respiration) | 2；追加 1 项 | [energy-01: fixed](../resolutions/energy.json); [energy-02: fixed](../resolutions/energy.json); [peer-energy-01: fixed](peer-energy.md) | 已复核代表帧 |
| 糖酵解：碳与磷酸的去向 (glycolysis) | 1 | [energy-03: fixed](../resolutions/energy.json) | 已复核代表帧 |
| 细菌质膜上的呼吸 (bacterialEnergetics) | 1 | [energy-04: fixed](../resolutions/energy.json) | 已复核代表帧 |
| 蓝细菌的产氧光合作用 (bacterialPhotosynthesis) | 1 | [energy-05: fixed](../resolutions/energy.json) | 已复核代表帧 |
| 跨膜扩散 (diffusion) | 1 | [membrane-01: fixed](../resolutions/membrane.json) | 已复核代表帧 |
| 钠钾泵的主动运输 (activeTransport) | 1；追加 1 项 | [membrane-02: fixed](../resolutions/membrane.json); [peer-membrane-01: fixed](peer-membrane.md) | 已复核代表帧 |
| 红细胞的渗透响应 (osmoticBalance) | 1 | [membrane-03: fixed](../resolutions/membrane.json) | 已复核代表帧 |
| 大肠杆菌肽聚糖装配 (bacterialCellWall) | 3 | [membrane-04: fixed](../resolutions/membrane.json); [membrane-05: fixed](../resolutions/membrane.json); [membrane-06: fixed](../resolutions/membrane.json) | 已复核代表帧 |
| 受体介导内吞 (endocytosis) | 1 | [traffic-01: fixed](../resolutions/traffic.json) | 已复核代表帧 |
| 宏自噬 (autophagy) | 1；追加 1 项 | [traffic-02: fixed](../resolutions/traffic.json); [peer-traffic-02: fixed](peer-traffic.md) | 已复核代表帧 |
| 有丝分裂 (mitosis) | 2 | [division-01: fixed](../resolutions/division.json); [division-02: fixed](../resolutions/division.json) | 已复核代表帧 |
| 减数分裂 (meiosis) | 4 | [division-03: fixed](../resolutions/division.json); [division-04: fixed](../resolutions/division.json); [division-05: fixed](../resolutions/division.json); [division-06: fixed](../resolutions/division.json) | 已复核代表帧 |
| RTK–Ras–MAPK 信号 (signalTransduction) | 3 | [signals-01: fixed](../resolutions/signals.json); [signals-02: fixed](../resolutions/signals.json); [signals-03: fixed](../resolutions/signals.json) | 已复核代表帧 |
| 线粒体内源性凋亡 (apoptosis) | 3 | [signals-04: fixed](../resolutions/signals.json); [signals-05: fixed](../resolutions/signals.json); [signals-06: fixed](../resolutions/signals.json) | 已复核代表帧 |
| 红系终末分化 (differentiation) | 1；追加 1 项 | [signals-07: fixed](../resolutions/signals.json); [peer-signals-01: fixed](peer-signals.md) | 已复核代表帧 |
| MHC-I 呈递与 T 细胞识别 (immuneResponse) | 1 | [signals-08: fixed](../resolutions/signals.json) | 已复核代表帧 |
| 动作电位传播 (actionPotential) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| 谷氨酸突触传递 (synapse) | 2 | [neurons-01: fixed](../resolutions/neurons.json); [neurons-02: fixed](../resolutions/neurons.json) | 已复核代表帧 |
| 骨骼肌滑动肌丝 (muscle) | 1 | [neurons-03: fixed](../resolutions/neurons.json) | 已复核代表帧 |
| 纤毛的滑动与弯曲 (ciliaryMotion) | 1 | [neurons-04: fixed](../resolutions/neurons.json) | 已复核代表帧 |
| 质壁分离与复原 (plasmolysis) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| 气孔开闭 (stomata) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| 木质部运输与蒸腾 (plantLongDistanceTransport) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| 叶绿体光定位运动 (chloroplastMovement) | 2 | [plantWater-01: fixed](../resolutions/plantWater.json); [plantWater-02: fixed](../resolutions/plantWater.json) | 已复核代表帧 |
| 植物细胞分裂 (plantDivision) | 2 | [plantGrowth-01: fixed](../resolutions/plantGrowth.json); [plantGrowth-02: fixed](../resolutions/plantGrowth.json) | 已复核代表帧 |
| 纤维素沉积与细胞壁伸展 (cellWallGrowth) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| 被子植物双受精 (doubleFertilization) | 2 | [plantGrowth-03: fixed](../resolutions/plantGrowth.json); [plantGrowth-04: fixed](../resolutions/plantGrowth.json) | 已复核代表帧 |
| 丝状真菌的菌丝顶端生长 (fungalHyphae) | 2 | [plantGrowth-05: fixed](../resolutions/plantGrowth.json); [plantGrowth-06: fixed](../resolutions/plantGrowth.json) | 已复核代表帧 |
| 生长素：解除转录抑制 (auxin) | 2 | [plantSignals-01: fixed](../resolutions/plantSignals.json); [plantSignals-02: fixed](../resolutions/plantSignals.json) | 已复核代表帧 |
| 植物防御：识别 flg22 (plantDefense) | 2 | [plantSignals-03: fixed](../resolutions/plantSignals.json); [plantSignals-04: fixed](../resolutions/plantSignals.json) | 已复核代表帧 |
| 质子梯度驱动蔗糖摄取 (plantTransport) | 2 | [plantConnections-01: fixed](../resolutions/plantConnections.json); [plantConnections-02: fixed](../resolutions/plantConnections.json) | 已复核代表帧 |
| 胞间连丝的选择性通行 (plasmodesmata) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| 光呼吸的三细胞器碳回收 (photorespiration) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| C₄ 与 CAM 的二氧化碳浓缩 (c4cam) | 1；追加 1 项 | [plantConnections-03: fixed](../resolutions/plantConnections.json); [peer-plantConnections-01: fixed](peer-plantConnections.md) | 已复核代表帧 |
| 乳糖操纵子：双重控制 (lacOperon) | 1；追加 1 项 | [operons-01: fixed](../resolutions/operons.json); [peer-operons-01: fixed](peer-operons.md) | 已复核代表帧 |
| 色氨酸操纵子：抑制与衰减 (trpOperon) | 1 | [operons-02: fixed](../resolutions/operons.json) | 已复核代表帧 |
| 酵母 GAL：解除激活域抑制 (yeastGal) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| 酵母渗透调节：HOG 与甘油 (yeastOsmoregulation) | 3 | [operons-03: fixed](../resolutions/operons.json); [operons-04: fixed](../resolutions/operons.json); [operons-05: fixed](../resolutions/operons.json) | 已复核代表帧 |
| 细菌的转录与翻译偶联 (bacterialExpression) | 2；追加 1 项 | [bacterialCore-01: fixed](../resolutions/bacterialCore.json); [bacterialCore-02: fixed](../resolutions/bacterialCore.json); [peer-bubble-extensions-01: fixed](peer-bubble-extensions.md) | 已复核代表帧 |
| 大肠杆菌的二分裂 (bacterialDivision) | 2 | [bacterialCore-03: fixed](../resolutions/bacterialCore.json); [bacterialCore-04: fixed](../resolutions/bacterialCore.json) | 已复核代表帧 |
| F 质粒接合转移 (conjugation) | 1 | [bacterialCore-05: fixed](../resolutions/bacterialCore.json) | 已复核代表帧 |
| 枯草芽孢杆菌的自然转化 (transformation) | 2 | [bacterialCore-06: fixed](../resolutions/bacterialCore.json); [bacterialCore-07: fixed](../resolutions/bacterialCore.json) | 已复核代表帧 |
| 细菌趋化 (chemotaxis) | 1 | [bacterialSignals-01: fixed](../resolutions/bacterialSignals.json) | 已复核代表帧 |
| 双组分信号传导 (twoComponent) | 2 | [bacterialSignals-02: fixed](../resolutions/bacterialSignals.json); [bacterialSignals-03: fixed](../resolutions/bacterialSignals.json) | 已复核代表帧 |
| 群体感应 (quorumSensing) | 1 | [bacterialSignals-04: fixed](../resolutions/bacterialSignals.json) | 已复核代表帧 |
| 生物膜形成与分散 (biofilm) | 1 | [bacterialSignals-05: fixed](../resolutions/bacterialSignals.json) | 已复核代表帧 |
| 酵母出芽 (yeastBudding) | 2 | [yeastLife-01: fixed](../resolutions/yeastLife.json); [yeastLife-02: fixed](../resolutions/yeastLife.json) | 已复核代表帧 |
| 酵母酒精发酵 (yeastFermentation) | 1 | [yeastLife-03: fixed](../resolutions/yeastLife.json) | 已复核代表帧 |
| 酵母配对与融合 (yeastMating) | 2 | [yeastLife-04: fixed](../resolutions/yeastLife.json); [yeastLife-05: fixed](../resolutions/yeastLife.json) | 已复核代表帧 |
| 酵母减数分裂与产孢 (yeastSporulation) | 2 | [yeastLife-06: fixed](../resolutions/yeastLife.json); [yeastLife-07: fixed](../resolutions/yeastLife.json) | 已复核代表帧 |
| 草履虫：摄食与消化 (parameciumFeeding) | 2 | [parameciumLife-01: fixed](../resolutions/parameciumLife.json); [parameciumLife-02: fixed](../resolutions/parameciumLife.json) | 已复核代表帧 |
| 伸缩泡：集水与排水 (contractileVacuole) | 1 | [parameciumLife-03: fixed](../resolutions/parameciumLife.json) | 已复核代表帧 |
| 草履虫横裂 (parameciumDivision) | 2 | [parameciumLife-04: fixed](../resolutions/parameciumLife.json); [parameciumLife-05: fixed](../resolutions/parameciumLife.json) | 已复核代表帧 |
| 草履虫接合与核更新 (parameciumConjugation) | 1 | [parameciumLife-06: fixed](../resolutions/parameciumLife.json) | 已复核代表帧 |
| T4 噬菌体裂解周期 (phageLytic) | 1；追加 1 项 | [phageLife-01: fixed](../resolutions/phageLife.json); [peer-phageLife-01: fixed](peer-phageLife.md) | 已复核代表帧 |
| λ 噬菌体溶原与诱导 (phageLysogenic) | 1 | [phageLife-02: fixed](../resolutions/phageLife.json) | 已复核代表帧 |
| T4 头尾装配与成熟 (phageAssembly) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
| T4 DNA 包装马达 (phagePackaging) | 初审未确认错误 | 保留已说明的教学范围 | 已复核代表帧 |
