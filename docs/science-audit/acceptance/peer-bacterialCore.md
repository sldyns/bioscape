# bacterialCore 独立复核

复核者：`/root/p_translation`。范围：Phase B 的 `bacterialCore-01` 至 `bacterialCore-07`，4 个过程、各自两条条件分支。结论：**7 项在原审计问题的范围内均 qualified pass；没有发现需要重新打开的实锤缺陷。** 这不是全模型所有分子细节的无条件科学认证，最终视觉接受仍需 root。

只读取模型和已有回归，运行只读内存探针；仅写本报告。没有修改模型、原始审计、修复记录或测试，也没有使用浏览器。

## 逐项结论

| Issue | 复核结果 | 实际证据 |
|---|---|---|
| bacterialCore-01 | qualified pass | `bacterialExpressionProcess.js:453` 从实际 `50S-peptide-exit` 的世界坐标取得肽起点。首珠与出口、所有可见键与相邻珠重合。原有 z 偏移 0.35 的缺陷注入仍被回归拒绝。 |
| bacterialCore-02 | qualified pass | `bacterialExpressionProcess.js:343` 的 RNA 参数 0 是杂交区 3′ 端，活性位点由同一条 RNA–模板路径定位，短配对连接回到实际模板骨架。70 段 RNA 连续，3′ 标签跟随端点；σ 缺失时 RNA 与肽均不可见。RNA 3′→5′ 参数顺序与模板 5′→3′ 方向相反。 |
| bacterialCore-03 | qualified pass | `bacterialDivisionProcess.js:502` 的两条复制臂与未复制弧共用两个叉；复制臂的分离位移在叉端衰减为零。复制完成后才对闭环施加完整分离。密集采样的最大叉端误差约 4.02×10⁻⁶，最大臂内误差约 8.03×10⁻⁶，均来自极短绘图线段的最小长度，低于回归容差 2×10⁻⁵；未再出现原先 1.59 的断裂。 |
| bacterialCore-04 | qualified pass | `bacterialDivisionProcess.js:550` 独立的 FtsZ 离场发生于 p=0.76–0.83，环收缩不再缩小丝段横截面。p=0.85 的实际内膜顶点仍有开口、FtsZ 不可见、FtsWI 仍可见。阻断隔膜合成保留早期装置。 |
| bacterialCore-05 | qualified pass | `conjugationProcess.js:276` 与 `:352` 用一个有序材料参数 s、同一个 q=advance−s 路径描述 T 链。供体圆弧、通道与受体圆弧边界坐标一致；每个 s 段只有一个位置。TraI 始终在 s=0 的 5′ 端。p<0.8 的转移阶段没有提前闭环；p≥0.8 时全部 T 链位于受体，无残桥。替代链仅覆盖供体已释放弧，受体补链长度受已到达弧限制。 |
| bacterialCore-06 | qualified pass | `transformationProcess.js:294` 分开 docking 和 pair；`:380` 仅移动已由输入链接触的原链局部，原链在 D-loop 期间保持闭合连接。密集探针确认接触前原链位移为 0，所有位移顶点的输入链接触误差 <4.59×10⁻¹⁶；最终输入链与保留原链两侧边界误差 <4.46×10⁻¹⁶。未再发现靠近途中提前删掉原链的情况。 |
| bacterialCore-07 | qualified pass | ComEA 域通过显式跨膜锚/系链连接细胞膜；对锚的实际路径做射线检测，与两张渲染膜面相交，结合域位于膜外。两种同源条件下锚定位置不因横向缩放离膜；外移锚 0.5 的缺陷注入被拒绝。 |

## 运行证据

重新运行：

```text
node src/processes/modules/bacterialCore/science.test.mjs
bacterialExpression: 58 times × 2 conditions — passed
bacterialDivision: 57 times × 2 conditions — passed
conjugation: 59 times × 2 conditions — passed
transformation: 59 times × 2 conditions — passed
bacterialCore-01 … bacterialCore-07: all seven injected defects rejected
```

已有回归还检查了有限顶点/变换、资源库存、确定性跳转和本组 esbuild；执行输出符合修复报告，不据报告自述代替执行。

另外用独立 `node --input-type=module` 内存探针按 `p=0,0.001,…,1` 检查 division、conjugation、transformation 的两个条件，共 **6,006 个场景状态**。端点直接从每个实际圆柱网格的局部 `(0,±0.5,0)` 经世界变换重建，没有读取 userData 作判据。探针检查：

- θ 图中每条复制臂的首尾和真实叉中心；全部相邻臂段端点。
- T 链全部 240 段连续性、5′ 端与 TraI、转移中不得闭环，以及 p≥0.8 不得残留供体/桥上点。
- D-loop 前原链坐标、D-loop 全环连接、每个发生位移的原链顶点与对应输入 DNA 接触，以及最终两端接入原骨架。

实际数值：

```json
{
  "cases": 6006,
  "division": {
    "maxForkGap": 0.000004014115800987499,
    "maxArmGap": 0.000008028206453902044
  },
  "conjugation": {
    "maxGap": 3.774758283725532e-15,
    "maxTraI": 3.1401849173675503e-16,
    "earlyClosure": 0,
    "lateNonrecipient": 0
  },
  "transformation": {
    "maxLoopGap": 4.577566798522237e-16,
    "precontactDisplacement": 0,
    "maxContactGap": 4.585973723508303e-16,
    "maxFinalJoin": 4.450402565178351e-16
  }
}
```

## 独立打开的科学依据

- [RCSB 6VYW](https://www.rcsb.org/structure/6VYW) 与 [RCSB 6I0Y](https://www.rcsb.org/structure/6I0Y)：实际打开结构记录，分别支持模板–RNA 杂交与转录翻译耦联复合物，以及大亚基出口处的新生链。没有把本地示意蛋白当作这些坐标模型。
- [Nielsen et al. 2007](https://journals.asm.org/doi/10.1128/jb.01212-07)：实际打开原始论文；复制与分离可以重叠，因此复核要求叉的拓扑连续，不要求姐妹域在复制完成前完全不分开。
- [Söderström et al. 2014](https://pubmed.ncbi.nlm.nih.gov/24506818/)：实际打开原始摘要及图文记录，支持 FtsZ 离场早于胞质区隔闭合。
- [Couturier et al. 2023](https://www.nature.com/articles/s41467-023-35978-3)：Nature 网页本次返回认证跳转；改为实际读取 [NCBI PMC 全文 XML](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=9849209)。确认 TraI 结合 5′ 端、两端抵达后闭环；该研究也明确受体补链相对闭环的精确起始顺序尚不确定，因此没有强加模型必须等闭环才补链的规则。
- [Kaufenstein et al. 2011](https://journals.asm.org/doi/10.1128/jb.01128-10)：实际打开原始全文，确认膜结合 ComEA、单链入胞及 RecA 引入输入链并移开原链的机制。

## 接受边界

本复核确认 7 个原始错误已被实际几何/时序修正，不把回归结果当作所有结构都源于实验。θ 染色体臂为双链 DNA 的粗轮廓；未展开解缠及半保留复制。F 链通道和其中链长比例经过放大，没有额外推断受体跨膜装置精确原子构造。D-loop 末端解析及原链片段降解压缩为最终整合步骤，未表现详细切接酶化学。无新的有证据阻断项；视觉质量、斜视角遮挡及全局统一接受仍由 root 负责。

复核文件 SHA-256：

```text
865210a369c31e82b867795bf4475fe4149663ca84ae790b5384ca2420559ff1  bacterialExpressionProcess.js
0b7bc2aae94993ba51ae3536d6f36562014610f30f99125fdcd045ddbdaf9f78  bacterialDivisionProcess.js
57003f8706a451cb4e719e93bf8ea841483bac8600cac9e4bbc4799e236b21fb  conjugationProcess.js
da5ba270bf5d7b2d1822f27acecf618bacefcf9523094fde5ee5c6ee1051917a  transformationProcess.js
7a82cf20dcca6abf42fbae16f5b22f286b8d894d20e96fe81e9fe842e6af30da  science.test.mjs
```
