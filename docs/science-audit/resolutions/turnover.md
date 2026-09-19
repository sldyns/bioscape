# Turnover · Phase B 修复记录

6/6 个已确认问题已实施修复，原 Phase A 审计保持不变。修改范围只有 turnover 的四个过程、该组 `science.test.mjs` 和本修复记录；未操作浏览器、缩略图或全局文件。这里的 fixed 表示实现与本地回归完成，视觉结果仍待主任务统一验收。

| 审计编号 | 实际改变 | 回归证据 |
|---|---|---|
| turnover-01 | miRNA 与 mRNA 使用共同反平行核苷酸映射；常规分支保留中央不配对区，切割分支示意 g2–g16 配对；切点由 guide 11/10 的对应靶位点导出 | 三条件各 101 帧，逐配对检查实际碱基端点；切割前后验证对应共价键 |
| turnover-02 | 配对依赖当前靶碱基位置、存在状态和停靠状态；切割解离时移除 | p=.7/.9/1 无残留配对；全部中间帧无连接到消失靶碱基的配对 |
| turnover-03 | 起始段先进入 ATPase 孔，再由连续链牵引展开；泛素连接位点先到 Rpn11 再切除 | 三细胞根节点、两条件各 101 帧；实际链段穿孔并接触孔环；p=.48 连接键位于 Rpn11，之后才断开 |
| turnover-04 | 20S 四层七聚体采用紧密贴合的实体亚基体积；肽先沿腔内轴向通过出口，再侧向扩散 | 用真实三角面 raycast 验证非剖切区闭合，覆盖原层间空隙；逐肽全部顶点检查孔内路径 |
| turnover-05 | Cas9 20-nt protospacer、guide、target、置换链及 PAM 共用坐标映射；局部开链控制配对变化 | 三条件各 101 帧，实际实例化碱基端点吻合；完整 R-loop 20 对、远端未到达时仍为双链、无双重伙伴；切点由 PAM 索引验证 |
| turnover-06 | SOS 位点出现随 RNAP 移动的转录泡、RNA–template 杂交区、连续 RNA 和后方 DNA 复合 | 两条件各 101 帧，增长时 DNA 实际分开、3′ 端留在活性中心、杂交端点吻合；不可切 LexA 对照保持双链且不产 RNA |

Cas9 天然双 RNA 支架另补足了 Phase A 的证据缺口：这次成功打开 [Jinek 2012 原始全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC6286148/)，图示增加连续的 crRNA 重复区和独立的反平行 tracrRNA 反重复区配对，并用双语注明支架为拓扑示意。其余修复使用并再次打开 [miRNA seed/supplementary 原始研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC6600645/)、[底物结合蛋白酶体原始结构论文](https://www.lander-lab.com/pdfs/30309908.pdf) 和 [E. coli RNAP 延伸复合体 6ALF](https://www.rcsb.org/structure/6ALF)。

本地验证通过：

- `node src/processes/modules/turnover/science.test.mjs`
- `node src/processes/modules/turnover/smoke.mjs`
- 仅对四个所属过程文件与科学回归文件运行 Prettier。

smoke 覆盖四个模块 bundle、双语阶段、全部 roots/controls、有限几何与实例矩阵、可重复跳转及稳定资源清单。科学回归检查实际坐标、连接端点、三角面和肽体积；不只断言状态标签。

保留的建模边界：蛋白表面、RNA 支架和运动仍是教学示意，没有声明原子拟合或真实动力学；20S 的实体亚基包络不是膜，轴向释放是选定的示意路径；Cas9 展示选定的平末端切割，不把 RuvC 切点说成固定不变。RecA–LexA 原子接触与修复结果不在本次六项修复的验证范围。完整逐项记录见 [turnover.json](turnover.json)。

## 同行开泡扩展问题修复

追加处理 [peer-bubble-extensions.md](../acceptance/peer-bubble-extensions.md) 的 **bubble-extension-02（Cas9）** 与 **bubble-extension-03（SOS）**。该复核发现此前首末态及配对端点检查漏掉的中间态 DNA 骨架真相交，因此前述本地通过不能作为这一类缺陷的验收。本次只追加修复记录，原始审计不变。

两个模型都取消了“闭合螺旋坐标向固定上下支路线性插值”。现在以共同截面描述两条 DNA：两链始终处于相反侧，截面半径保持正值，沿骨架积分剩余扭转角，使局部解旋连续。Cas9 从 PAM 一侧扩展，未打开的自由侧翼随解旋连续转动；SOS 的活动截面随 RNAP 移动。完整开泡的基座位置保持原有配对坐标，因此 guide–target、RNA–template 及 RNA 3′ 活性端没有脱开。没有隐藏、删除或交换任何 DNA 链。

新增 [bubble.test.mjs](../../../src/processes/modules/turnover/bubble.test.mjs)，并由 `science.test.mjs` 自动执行：

- `p=0,.001,…,1` 共 1001 帧，覆盖 Cas9 的 matched/mismatch/noPam 与 SOS 的 wildtype/noncleavable，共 5005 状态。
- 从真实圆柱的世界变换取得两端，比较任意邻近 `i,j` 闭线段的独立最近参数，包含不同索引和非邻接自身管段；只用保证不重叠的 x 包络做跳过。
- 纳入实际磷酸、糖实例的变换及几何包围半径，检查对侧核苷酸/管段及非共价关联自身管段。共价相邻端点连接不当作错误。
- 圆柱完全包含在轴线胶囊内；这些包络已严格分离，故真实圆柱三角面也不可能交叠。这是包络分离证明，不是用最近顶点距离冒充表面距离。没有需进一步判定真假的重叠候选。

| 条件 | 最小跨链管段距离 | 两管半径和 | 结果 |
|---|---:|---:|---|
| Cas9 matched / mismatch / noPam | 0.507467 | 0.096 | 全帧分离 |
| SOS wildtype / noncleavable | 0.311205 | 0.100 | 全帧分离 |

同行给出的 p=.490、.342、.760、.896 见证均包含在此次扫描中。原有科学几何测试和 smoke 仍通过。上述距离是离散时间扫描结果，不声明模拟真实动力学或所有连续时刻的形式化证明；已通知原复核者，等待主任务安排独立复验。
