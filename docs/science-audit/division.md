# Division 科学审计（Phase A）

覆盖 entries.js 全部 **2 个模型**，均为 cell 根目录。结论：**2 confirmed_issue，0 qualified_pass，0 unresolved；4 项 P1、2 项 P2**。只写本报告，未改产品或测试文件，未操作浏览器。

## 有丝分裂 · mitosis

四条复制后染色体的明确子集，共八条染色单体；实际网格在末态各分四条到两侧，数量正确。核膜破裂、双向附着、姐妹分离和胞质分裂的顺序整体一致。未附着控制会把实际动画钳在 0.43：姐妹不分离、分裂沟和子细胞不出现，符合检查点教学目的。

- **division-01 · P1**：`mitosisProcess.js:157–168` 的每条 interpolar strand 从一极连续跨到另一极；`divisionShapes.js:64–98` 没有两组反向微管的独立末端和中部重叠区。需改为互相交叠的两组微管，并验证单根不跨接两极。原始 EM 研究支持的是反向交叠数组：[Mastronarde 1993 原文 XML/摘要](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2290872/fullTextXML)。
- **division-02 · P2**：`mitosisProcess.js:128–144` 用固定偏移充当附着端点。实际网格测距在 p=.43/.55 得到端点到动粒约 .03158，而微管半径仅 .009，正常附着状态仍留缝。应绑定变换后的真实动粒锚点，并保留异常纤维的明确未接触状态。检查点逻辑本身有原始证据支持：[Rieder 1995](https://rupress.org/jcb/article-abstract/130/4/941/20874/The-checkpoint-delaying-anaphase-in-response-to?redirectedFrom=PDF)。

## 减数分裂 · meiosis

八条染色单体恒定：第一次分裂每侧两对姐妹，第二次分裂每个产物两条单染色单体染色体。两组同源关系和各自产物去向保持；每对恰好两条非姐妹交换远端颜色。第一次姐妹同向、第二次姐妹双向的运动逻辑正确，无中间复制。模型无控制项，展示的是正常通路。四个精细胞通过三条桥保留连通关系的意图符合小鼠生精过程。

- **division-03 · P1**：明示普通小鼠精母细胞，但 `divisionShapes.js:219–227` 把着丝粒放在两条近似等长臂之间，短臂占约 43%。标准小鼠常染色体是端着丝粒型；不能用“只画两对”解决形态错误。应给此模型增加端着丝粒几何，同时保持染色体数量与分配。[JAX 小鼠核型](https://www.informatics.jax.org/silver/chapters/5-2.shtml)、[Kalitsis 2006 原始摘要](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID%3A16731628+AND+SRC%3AMED&format=json&resultType=core)。Robertsonian 融合品系属于需明确说明的例外。
- **division-04 · P1**：`meiosisProcess.js:206–233` 的交叉中心在 .84L，金线连接两侧 .69L 与 .99L；实际交换材质从 .69L 开始，染色单体轴并未重接。交叉位置、祖源边界和同源位点不一致。应使用共同交换坐标，让两条非姐妹的连续路径及祖源边界在同源位置对应；联会横档也应贴合实际同源轴。[Meiosis and Fertilization](https://www.ncbi.nlm.nih.gov/books/NBK9901/)。
- **division-05 · P1**：`meiosisProcess.js:239–255` 的桥是封口实心圆柱，子细胞膜没有桥口，因而没有真正的胞质通道。应做有腔膜颈与对应膜开口，并检查内部通路没有膜盖阻断。不能只验证三条 connector 对象存在。[Greenbaum 2006 原始摘要](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID%3A16549803+AND+SRC%3AMED&format=json&resultType=core)。
- **division-06 · P2**：`meiosisProcess.js:162–191` 的固定动粒目标同样留缝，第一次 p=.32 和第二次 p=.68 实测约 .03158，半径 .009。需从已旋转的实际动粒锚点生成附着，同时测试 I 的姐妹同向与 II 的姐妹反向。[MEIKIN 原始论文](https://www.nature.com/articles/nature14097?error=cookies_not_supported&code=none)。

## 证据与边界

检查了全部阶段、过渡公式、双语文案、图例、根目录范围、现有 smoke、两个共享几何生成函数路径，以及代表帧 `/tmp/atlas-refinement/{mitosis,meiosis}.png`。只读 Node 探针枚举真实染色单体网格、坐标和材质，变换实际 instance 几何后测距；未把 userData 作为生物学通过证据。完整来源、定位、修法与验证不变量见 division.json。

未进行浏览器多角度验收。部分 PMC 网页触发访问挑战，因此从 Europe PMC 获取并阅读原论文摘要；不宣称阅读了未获取的正文或图。对减少染色体数、前半部剖开、时间压缩等已披露的教学抽象，不列为缺陷。
