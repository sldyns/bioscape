# bacterialCore Phase B 修正

原审计 7 项均已修正（5 P1、2 P2），逐项证据见 [bacterialCore.json](./bacterialCore.json)。Phase A 审计文件保持不变。

| Issue | 修正结果 | 几何验证 |
| --- | --- | --- |
| bacterialCore-01 | 新生肽从真实 50S 出口开始，连续肽键连接残基 | 出口与首残基重合、各肽键端点一致 |
| bacterialCore-02 | RNA 3′ 连到 RNAP 活性位点，短杂交区与模板连续 | 70 段连续、标签跟随端点、杂交连接落在模板骨架 |
| bacterialCore-03 | 复制 DNA 用共享两叉的三臂 θ 拓扑，终止后分成两个闭环 | 两条件中间帧分支点/复制叉重合，最终各子染色体闭环 |
| bacterialCore-04 | FtsZ 固定粗细并在颈部封闭前解聚 | p=0.85 膜颈仍开放、FtsZ 已离开、FtsWI 仍在；阻断条件保留早期环 |
| bacterialCore-05 | 唯一连续 T 链按物质顺序穿过通道，全部入胞后闭环 | 无断点或重复节点、TraI 在真实 5′ 端、闭环后无跨细胞链 |
| bacterialCore-06 | 输入 DNA 先接近，局部接触后才推进连通 D-loop | 未接触原链不动，位移位置均已有输入链，最终片段接入原骨架 |
| bacterialCore-07 | ComEA 增加可见系链与跨膜锚 | 射线穿过实际膜三角面的两个膜叶，结合域位于外侧 |

修改产品文件：`bacterialExpressionProcess.js`、`bacterialDivisionProcess.js`、`conjugationProcess.js`、`transformationProcess.js`；新增本组 `science.test.mjs`。补入 Phase A 已打开核验的原始论文/结构来源，更新相关中英文阶段时序。

验证命令：`node src/processes/modules/bacterialCore/science.test.mjs`。4 个模型分别检查 58、57、59、59 个时点 × 两条件，共 466 个几何状态；确定性跳转、有限顶点/变换/实例矩阵、稳定对象/几何/材质数量及局部打包均通过。另将 7 类原始缺陷逐一注入实际对象，相同检查全部拒绝。

这些检查验证的是上述连接与时序不变量。DNA、蛋白和时间尺度仍是教学示意；尚需根任务渲染审看整体布局与视角。未运行浏览器或全项目检查，未修改其他组、全局文件或缩略图。

## 开泡交叉类追加：bubble-extension-01

独立扩展审计发现表达模型的旧 ±Y 线性开泡在 p=0.521 发生双链实体穿插。本次保留两条链及管径，改为共同中心线、正交框架、正半径与局部相位解旋；RNA 杂交区和活性端采用同一模板框架。

新增命令：`node src/processes/modules/bacterialCore/bubble.science.test.mjs`。1001 个时点 × 两条件全部通过。检查不同索引、独立参数的整段距离、两链非邻接自交、实际磷酸实例包络；圆头保守包络相交的同链候选以实际平帽多边形棱柱的完整 SAT 检查，不把包络相交等同于实体穿插。present 最小对侧管面保守间隔 **0.299505**，磷酸对侧实例 **0.2959999**，磷酸至对侧管 **0.294250**；没有发现实际骨架实体交叠。

负对照把旧路径写回实际管网格，准确重现轴距 **0.0000643364**，并确认同一点严格位于两 16 边柱体内部；测试正确拒绝。本组原 466 个状态和 7 类缺陷注入仍通过。初审未改，追加项详见 JSON；已请求独立 peer 复验。
