# 扩展开泡几何复核

**最新独立复验：bubble-extension-01/02/03 已通过本次几何验收并闭环。** 下文原失败证据原样保留；修复版本、实测数据和验收边界见文末追加记录。

复核者 `/root/p_translation`。仅检查 `bacterialExpression`、`crispr`、`bacterialRepair` 的固定上下方向开泡是否造成双 DNA 骨架穿插。结论：**三个模型均 confirmed_issue（P1）**。CRISPR 匹配与错配分支均复现；不启动开泡的对照未复现。已直接通知 `p_bacterial_signals`、`p_energy` 与 root。没有修改产品或既有报告/测试，没有浏览器操作。

该结果补充并限定先前 `peer-bacterialCore.md` 的通过范围：先前七个原始问题已经闭环，不代表本次新增开泡碰撞类也已验收。

## 方法：不同参数的真实线段及实际网格内部

对每模型的全部条件，扫描 `p=0,0.001,…,1`，共 7,007 个状态。直接取实际骨架圆柱网格，经其 `matrixWorld` 将局部 `(0,−0.5,0)`、`(0,+0.5,0)` 转成世界端点。对两条链的全部邻近线段组合求三维闭线段最短距离；比较任意 `i,j` 以及独立参数 `s,t`，不只比较同一索引或同一参数。仅跳过 x 区间间隔超过 0.6、必不可能达到本次碰撞阈值的组合；隐藏的切口段不参加。

以下见证不仅是“距离小于半径和”的近似：取两条线段最近点的中点，分别变换回两个实际 `CylinderGeometry` 的局部坐标，确认 `|y|<0.5` 且 `sqrt(x²+z²)<cos(π/16)=0.980785`。两模型的圆柱均有 16 个径向边；这个条件把点放在实际多边形柱体的内切圆柱内。因此同一空间点严格在两个渲染实体内部，证明有体积穿插，非屏幕投影重叠、接触容差或最近顶点代理。

## 实锤与位置

| 模型 / 条件 | p | 实际网格 A / B | 线段最短距 | 两管半径和 | 最近参数 s / t |
|---|---:|---|---:|---:|---|
| bacterialExpression / present | 0.521 | `DNA-strand-0-31` / `DNA-strand-1-31` | 0.0000643364 | 0.094 | 0.382539 / 0.382539 |
| crispr / matched | 0.490 | `Cas9 DNA backbone 0 21` / `Cas9 DNA backbone 1 21` | 0.00521400 | 0.096 | 0.437289 / 0.410876 |
| crispr / mismatch | 0.342 | `Cas9 DNA backbone 0 34` / `Cas9 DNA backbone 1 34` | 0.0334972 | 0.096 | 0.830442 / 0.635180 |
| bacterialRepair / wildtype | 0.760 | `SOS DNA backbone 0 23` / `SOS DNA backbone 1 23` | 0.000119229 | 0.100 | 0.548516 / 0.548701 |
| bacterialRepair / wildtype | 0.896 | `SOS DNA backbone 0 49` / `SOS DNA backbone 1 50` | 0.0120806 | 0.100 | 0.979037 / 0.027012 |

最后一项为**不同索引相邻段**、且两最近点都严格位于各自线段内部的见证。

实际实体内部测试结果：

| 见证 | 最近点中点在 A 局部：y / 径向距离 | 在 B 局部：y / 径向距离 | 同时在两个实际柱体内部 |
|---|---|---|---|
| expression p=.521 | −0.117461 / 0.00068443 | −0.117461 / 0.00068443 | 是 |
| crispr matched p=.490 | −0.062711 / 0.0543125 | −0.089124 / 0.0543125 | 是 |
| crispr mismatch p=.342 | 0.330442 / 0.348929 | 0.135180 / 0.348929 | 是 |
| SOS p=.760 | 0.048516 / 0.00119229 | 0.048701 / 0.00119229 | 是 |
| SOS 不同段 p=.896 | 0.479037 / 0.120806 | −0.472988 / 0.120806 | 是 |

### bacterialExpression：bubble-extension-01

位置：`src/processes/modules/bacterialCore/bacterialExpressionProcess.js:333–339`，由 `dnaPoint` 把螺旋 `cos/sin` 偏移线性缩小，同时把链 0/1 拉向固定 `+0.35/−0.35` y。泡边的螺旋相位可与此固定方向相反，过渡时发生抵消和穿越。`DNA-strand-*` 管半径实际为 0.047。

扫描中 present 有 112 个状态满足“两最近点在段内部、距离小于 0.97×半径和”的强碰撞条件。absent 对照的最小距离 0.394581，大于 0.094，0 个此类状态。并非正常双链螺旋本身过粗引起。

### crispr：bubble-extension-02

位置：`src/processes/modules/turnover/crisprProcess.js:426–447`。`localOpen` 沿引导区域传播，然后将螺旋端点插值到固定 `y=0.95/−0.56`、`z=0.22/0.38`。与原螺旋相位不匹配时，目标链和非目标链在 R-loop 边缘互穿。

matched 有 653 个强碰撞状态；mismatch 的短暂局部开启也有 288 个。noPam 的最小距离 0.507467，大于 0.096，0 个碰撞状态。此缺陷不能仅通过限制“完全匹配”分支修复，种子错配的试探性开泡也必须一起验证。

### bacterialRepair：bubble-extension-03

位置：`src/processes/modules/turnover/bacterialRepairProcess.js:446–459`，`dnaAt` 将初始螺旋插到固定上下支路 `y=−0.85/−1.5`。这是下方 SOS 启动子，不是上方已有单链间隙。泡边随 RNAP 移动，遇到相反相位时发生穿越。

wildtype 有 70 个强碰撞状态；noncleavable 对照最小距离 0.311205，大于 0.100，0 个碰撞状态。p=.896 的不同段见证证明只比较两条链的同 t 间距会漏检部分真实碰撞。

## 修复和后续验收要求

- 让开泡路径保持绕轴相位/拓扑一致：使用非零截面的旋转分离向量或有可靠距离约束的连续路径，避免把互为反相的螺旋径向量直接与固定 ±y 相加。
- 修复的参数化必须同时驱动 RNA–模板杂交、Cas9 引导配对和活性位点，不可只改 DNA 表面而把原来已经修好的分子连接再次拉断。
- 扫描全部条件和泡边移动期间，比较两条链任意邻近 `i,j` 的**整段**距离；检查两条链各自的非邻接自交。管半径、磷酸/糖实例的可见包络也需纳入后续检测。
- 对几何候选用实际网格内部/三角面检测确认；合法同一骨架的共端点、真实 RNA–DNA 配对及断口不作为错误。此报告已限定为不同 DNA 骨架实体穿插。
- 不接受只增大同 t 距离、只检查首末帧或靠透明度/“示意”文字掩盖穿插。

## 依据与边界

[6VYW](https://www.rcsb.org/structure/6VYW) 和本次实际打开的 [6ALF](https://www.rcsb.org/structure/6ALF) 记录区分模板 DNA、非模板 DNA 与 RNA；这里不把开泡等同于两条磷酸骨架可以通过彼此。[Cas9 R-loop 原始研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC5111852/) 网页遇到验证码，改为实际读取 [NCBI XML](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=5111852)。本次碰撞结论主要由实际几何严格内部交集证实，不依赖对实验结构比例的猜测。

仅检查本次指定类缺陷，没有重新执行三模型的全部科学审计，也没有修改产品代码。碰撞状态数量是离散扫描统计，不是连续时间发生率或生物动力学数量。

受检版本 SHA-256：

```text
865210a369c31e82b867795bf4475fe4149663ca84ae790b5384ca2420559ff1  bacterialCore/bacterialExpressionProcess.js
2fc56fac1d1aab36a373c7d9651de3da3dda6e8e70e599e4914e5019739fddf4  turnover/crisprProcess.js
7beaf17928b5838e5afb132a410f216fe0905bcf6ac2602980177d33d5962921  turnover/bacterialRepairProcess.js
```


## 修复后独立验收追加记录（2026-09-19）

复核者 `/root/p_translation`，只修改本报告。**bubble-extension-01、bubble-extension-02、bubble-extension-03 均 accepted**；本次限定于已证实的 DNA 骨架穿插，以及新框架对既有 RNA/模板连接的影响。

重新编写并实际执行独立探针 `/tmp/peer-bubble-extensions-recheck.mjs`。直接读取当前产品的实际圆柱变换，重建世界坐标端点，扫描全部 7 条件 × 1,001 帧 = **7,007 状态**。对跨链任意索引 i/j 的有限闭线段分别优化 s/t，包括端点候选和内部最小点，共实测 **5,433,352 对**近邻骨架段。所有中心线距离均严格大于两管真实半径和，因实际圆柱包含在该胶囊包络中，因此证明这些实际管实体无交集。没有用同 t 检查替代整段检查。

| 模型/条件 | 最小骨架段距离 | 半径和 | 最小管面保守净距 | 结论 |
|---|---:|---:|---:|---|
| bacterialExpression / present | 0.393505315 | 0.094 | 0.299505315 | PASS |
| bacterialExpression / absent | 0.394580742 | 0.094 | 0.300580742 | PASS |
| crispr / matched | 0.507466674 | 0.096 | 0.411466674 | PASS |
| crispr / mismatch | 0.507466674 | 0.096 | 0.411466674 | PASS |
| crispr / noPam | 0.507466674 | 0.096 | 0.411466674 | PASS |
| bacterialRepair / wildtype | 0.311204589 | 0.100 | 0.211204589 | PASS |
| bacterialRepair / noncleavable | 0.311204589 | 0.100 | 0.211204589 | PASS |

另外固定原报告的五个失败时间/索引重新取当前实际几何，不用新的最近点替换原失败对象：

| 原失败对象 | 当前距离 | 当前保守管面净距 |
|---|---:|---:|
| expression p=.521，31/31 | 0.456432787 | 0.362432787 |
| crispr matched p=.490，21/21 | 0.520000000 | 0.424000000 |
| crispr mismatch p=.342，34/34 | 0.520000000 | 0.424000000 |
| SOS p=.760，23/23 | 0.352434993 | 0.252434993 |
| SOS p=.896，49/50 | 0.401016031 | 0.301016031 |

执行 `/tmp/peer-bubble-pinned.mjs` 均通过。因为这五对实际管的外包络已经严格不相交，不需要再依赖三角面交点阴性来推断分离。

同时独立执行并审阅作者的 `bacterialCore/bubble.science.test.mjs`、`turnover/bubble.test.mjs`，全部通过。其范围补充两链各自的非邻接自交、跨链磷酸/糖包络和非相邻骨架接近。expression 同链圆头胶囊包络有最小 −0.00726531 的保守重叠；测试对 7,565 个候选执行实际 16 边平帽凸柱 SAT，未发生实际实体交集，不能把这一胶囊假阳性计为穿插。该测试还把 p=.521 的旧几何重新注入，严格实体内部见证复现并使碰撞检查失败，避免只接受永远为真的测试。

独立探针额外逐帧检查 bacterialExpression 的可见 70 段 RNA：相邻共端点及 3′ 端到活性中心最大误差 **2.89e−15**；8 个 RNA–模板杂交桥的长度相对 0.11 的最大误差 **4.31e−16**。sigma 缺失分支没有可见 RNA。另实际运行 `turnover/science.test.mjs` 通过：Cas9 20 个 RNA–DNA 配对仍连到实际碱基端点、局部开启前沿和 PAM 定位切口保持；SOS RNA 连续性、3′ 活性端、模板杂交及不可切 LexA 分支通过。

验收版本 SHA-256：

```text
fce2865fce0d526098b9f8c0d85c1ae37e5f34592687f1fe1d05d052a5470987  bacterialCore/bacterialExpressionProcess.js
822f4d40a148b04c327383f39ed3e92c4d59b5719b7ece42b1fc7f20d2ca67c2  turnover/crisprProcess.js
3883a98c290eace5c74ef49bab792c4ac2cb13d2299cb667505797c3ecd3a5fb  turnover/bacterialRepairProcess.js
```

这是实际几何的独立本地验收；没有浏览器视觉验收，也不扩展成对三模型全部科学内容的重新审计。原失败证据保持可追溯，修复未靠缩小管径、删去模板或添加免责声明绕过问题。
