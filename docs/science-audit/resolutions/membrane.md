# Membrane Phase B 修正记录

6 / 6 issue 已修正；无 unresolved。仅修改本组4个模型及2个本组回归文件；Phase A 证据保持不变。未修改全局注册、渲染器、缩略图或其他组，未运行全工作区测试/浏览器。根任务仍需做视觉验收。

## membrane-01 — fixed

保留有限时长演示，在0.85–0.995加入4对平衡的返向穿膜轨迹；终点暂停仍表示快照。相同粒子沿原水孔或脂质通路返回，净转移不变。

验证：
- 遍历4 roots × 2 route × 2 gradient，共16组合，每组合1001时间点；实际y=0穿越统计在末段4进/4出。
- 终态32分子仍内外16/16；outside累计净入8，equal净入0；穿膜水的x/z位于单体孔，氧位于脂质区。

边界：只是有限时间内可见的动态平衡示例，不要求播放器暂停后继续运动；非统计力学或真实速率模拟。

## membrane-02 — fixed

闭锁标签改由两个实际门的闭合状态决定，并补齐中英双语关门、开门过渡标签；只有实际闭合且完成相应磷酸状态才显示闭锁。

验证：
- 2种能量分支共2002时间点，对实际门position/scale、可见磷酸与显示标签联合断言；两门不同时开放。
- 有ATP终态实际3Na外、2K内；无ATP无输出、摄入、磷酸转移；ATP末磷酸和转移磷酸不同时出现。

边界：门运动及磷酸轨迹仍是教学示意，未据此声称原子级反应轨迹。

## membrane-03 — fixed

去掉三轴统一缩小引起的膜材料损失，增加高渗皱褶/扁化，并按实际三角网面积进行归一约束；内叶与皮层随约束后的顶点移动。加入膜面积保留的中英阶段解释和原始红细胞研究来源。

验证：
- 3种tonicity各101步，直接积分外/内叶三角网面积；归一面积误差<1e-6，非userData断言。
- 实际体积低渗单调增至1.624757倍，高渗单调减至0.637394倍，等渗保持1；高渗赤道半径最大/最小>1.4，证实皱褶而非仅等比缩小。

边界：表面积约束是保守几何示意，不是经过红细胞弹性参数拟合的力学模拟；不模拟膜囊泡脱落、调节或溶血。

## membrane-04 — fixed

两份脂质II均增加可辨别的双磷酸与连续NAM–PP–脂质连接；载体位于NAM端。

验证：
- 两药物分支402帧，从真实圆柱端点与糖/磷酸对象世界坐标核验连接；连接接触NAM而远离NAG。
- 所有阶段均有受体NAM与焦磷酸相连，糖肽头仍在周质侧、脂质尾保留在膜中。

边界：糖环、焦磷酸和脂质尾为化学拓扑简图，不表示原子数或真实键长。

## membrane-05 — fixed

将无源出现的10糖链改为两份可持续追踪的二糖五肽，合成一段四糖链；同一批4糖与肽对象从底物连续移至产物。新糖苷键形成时释放供体载体，保留受体脂质锚；最终展示两次转肽并更新对应阶段文案及本组旧回归预期。

验证：
- 402帧检验4个糖对象UUID/可见性不变、糖-肽键端点连续；没有隐藏产物池。
- 聚合前2枚NAM–PP锚、聚合后1枚；新糖苷键端点随同一供受体糖对象移动。
- 正常终态2条新交联、释放2个D-Ala；药物分支无新交联、保留末端D-Ala键。

边界：选取一个二糖添加实例，不演示长链的多轮延伸、最后脂质锚的释放、胞质合成或翻转。；RodA/PBP2与糖链迁移是放大的教学示意，未声称真实尺度的复合体接触面或原子催化路径。

## membrane-06 — fixed

后排已有链补齐四肽，背景交联改为后排D-Ala4到前排mDAP3；前排两个mDAP预留给新链，避免一个受体氨基被重复交联。

验证：
- 逐帧从实际圆柱端点确认3条背景交联均落在对应肽残基，而不是糖环中心。
- 两条新交联分别接新链D-Ala4与前排空闲mDAP3；末端D-Ala5脱离后对应键隐藏，药物分支不发生。

边界：保留E. coli的4→3交联范围，不推广到所有细菌或其他交联酶。

## 本组命令与结果

- `node src/processes/modules/membrane/science.test.mjs — PASS (all 6 audited issues, actual geometry)`
- `node src/processes/modules/membrane/refinement.test.mjs — PASS (4 models; finite geometry, deterministic seeking, stable resources, browser bundle compilation)`
- `./node_modules/.bin/prettier --write src/processes/modules/membrane/{diffusionProcess,activeTransportProcess,osmoticBalanceProcess,bacterialCellWallProcess}.js src/processes/modules/membrane/{science,refinement}.test.mjs — completed, owned files only`

新增来源：[红细胞几何/渗透性质原始研究](https://pubmed.ncbi.nlm.nih.gov/7082818/)；已在Phase A读取原始摘要。测试证明列出的不变量，不能替代全部科学正确性或视觉验收。

## 同行复核补修 — membrane-02

p_turnover 指出原先只对齐闭锁标签，化学事件仍提前。现把图示P转移对齐内门完成关闭的.29；外门.77关闭后显示E2P钾闭锁，.78–.805释放Pi，随后.81才重开内门。新增实际磷酸可见性/位置与门几何的时序断言；科学回归和既有细化回归均再次PASS。Na侧为保守同步，不断言唯一微观顺序；K侧遵守闭锁先于去磷酸化，所用进度值不代表实测时间。[K闭锁原始研究](https://pubmed.ncbi.nlm.nih.gov/21190658/)由同行核读全文，本次另外读取原始摘要确认来源；全文接口失败没有被记为成功读取。
