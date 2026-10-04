# Genome 全根／条件阶段图最终复核

最终结论：**本组 18 个 case、126 个中文阶段帧均已复核通过，无遗漏 case；genome-09 的六个 DNA 修复组合已完成修复后视觉验收。** 本次查看全部 18 张 fresh sheet，并对六个修复 case 各查看 3 张原始 960 × 640 图，共 18 张重点原图。其余模型复用已验的几何结论，同时逐张核对了新的中文 sheet。

最新证据来自 `evidence/browser/conditions-final-gallery-index.json` 的 `conditions-final-c-` 条目。18 个对应 JSON 均为 `kind=irregular-seeks`、`lang=zh`、`result=complete`、`errors=[]`。这是原生场景跳转取帧与阶段图验收，**不等于全部 case 的完整连续播放或人工视频验收**。

## 每个 case 的本次覆盖与结论

| evidence key | root | 参数 | fresh sheet 帧数 | 本轮额外原始 960 图 | 本次结论 |
| --- | --- | --- | ---: | --- | --- |
| conditions-final-c-000-replication-cell | cell | ligase=active | 7/7 | 无；复用已验几何 | 通过：复制叉、引物、连接酶和两条子链终态可辨，中文标签可读。 |
| conditions-final-c-001-replication-cell | cell | ligase=absent | 7/7 | 无；复用已验几何 | 通过：后期不出现连接酶及其封口标签。微小 nick 逐个计数仍由几何测试单独支持。 |
| conditions-final-c-002-replication-plant | plant | ligase=active | 7/7 | 无；复用已验几何 | 通过：酶／链标签与对应阶段一致。 |
| conditions-final-c-003-replication-plant | plant | ligase=absent | 7/7 | 无；复用已验几何 | 通过：缺酶分支未显示连接酶／封口标签。 |
| conditions-final-c-004-replication-yeast | yeast | ligase=active | 7/7 | 无；复用已验几何 | 通过：复制推进、后期连接酶与终态可辨。 |
| conditions-final-c-005-replication-yeast | yeast | ligase=absent | 7/7 | 无；复用已验几何 | 通过：后期缺酶状态与 active 有明确区别。 |
| conditions-final-c-006-dnaRepair-cell | cell | incision=active | 7/7 | stage-3、stage-4、stage-6 | 通过：.325 无提前切口标签，.495 真实切开后显示两处切口，.905 正确转为封口标签。 |
| conditions-final-c-007-dnaRepair-cell | cell | incision=blocked | 7/7 | stage-3、stage-4、end | 通过：.325 无切口标签；.495 与终态保留损伤及完整上链，仅显示受阻注释。 |
| conditions-final-c-008-dnaRepair-plant | plant | incision=active | 7/7 | stage-3、stage-4、stage-6 | 通过：切口标签时序与真实切开、后续封口一致。 |
| conditions-final-c-009-dnaRepair-plant | plant | incision=blocked | 7/7 | stage-3、stage-4、end | 通过：受阻后始终不宣称已经双切开。 |
| conditions-final-c-010-dnaRepair-yeast | yeast | incision=active | 7/7 | stage-3、stage-4、stage-6 | 通过：无提前切口注释；实际双切开后标签保留且指向切口。 |
| conditions-final-c-011-dnaRepair-yeast | yeast | incision=blocked | 7/7 | stage-3、stage-4、end | 通过：未切开和损伤保留的画面、中文注释一致。 |
| conditions-final-c-012-transduction-phage | phage | route=p1 | 7/7 | 无；复用尾管原图定向复验 | 通过：收缩后裸露尾管连续可见，金色胞内 DNA 与标签可辨。 |
| conditions-final-c-013-transduction-phage | phage | route=lambda | 7/7 | 无；复用前轮 λ 原图 | 通过：细长尾管连续，紫／金杂合 cargo 与来源／进入注释可辨。 |
| conditions-final-c-014-transduction-bacterium | bacterium | route=p1 | 7/7 | 无；复用已验几何 | 通过：入口与可见尾管、胞内 DNA 无新增问题。 |
| conditions-final-c-015-transduction-bacterium | bacterium | route=lambda | 7/7 | 无；复用已验几何 | 通过：λ 分支包装和胞内双颜色 DNA 可辨。 |
| conditions-final-c-016-bacterialSporulation-bacterium | bacterium | engulfment=normal | 7/7 | 无；复用前轮层级原图 | 通过：前视剖面嵌套层级及单个成熟芽孢终态清楚，中文标签对应目标。 |
| conditions-final-c-017-bacterialSporulation-bacterium | bacterium | engulfment=blocked | 7/7 | 无；复用前轮 blocked 终态原图 | 通过：包裹保持未闭合、没有成熟皮层／外衣，受阻标签指向未成熟膜边界。 |

sheet 为 `evidence/browser/sheets/<key>.jpg`，原图为 `evidence/browser/<key>-<stage>.webp`。全部 fresh sheet 已逐张核对，本轮没有只凭旧图给未查看的新中文 case 通过结论。

每个模型的七个采样进度如下：

- replication：0, .135, .295, .595, .805, .935, 1。
- dnaRepair：0, .145, .325, .495, .655, .905, 1。
- transduction：0, .175, .355, .525, .725, .915, 1。
- bacterialSporulation：0, .165, .335, .575, .745, .915, 1。

## genome-09 的修复后视觉结论

六个修复 case 均以原始 960 图核对了 p=.325 和 p=.495。active 三个 root 还核对了 .905 封口帧，blocked 三个 root 还核对了 p=1 终态：

- .325：切口尚未发生，上链连续；不再出现“两处切口”的提前声明。
- active .495：上链两端有金色切口标志，“同一条链上的两处切口”出现并指向实际切口位置；没有通过永久隐藏正确注释来掩盖问题。
- active .905：补缺后的绿色链可见，封口标签指向连接酶，早期切口注释已退出。
- blocked .495 与 1：受损上链完整、金色损伤保留；“切开受阻 · 损伤保留”可读，不再与“两处切口”同时显示。

**genome-09 现已通过上述所有根／条件的 fresh 阶段原图验收。** 没有新的明确视觉缺陷。本次没有打开浏览器或改动产品代码。

## 前轮证据与验收边界

前轮 `conditions-final-a` 英文 18 sheets／126 frames、4 张重点原图的真实结论为 12 case 通过、6 个 repair case 因 genome-09 待复验；原图与该发现的证据保留在 `repair-discoveries.*` 和 `incision-label-baseline/`。例如旧 `conditions-final-a-012-dnaRepair-cell-end.webp` 确实同时显示 Two incisions 和 Incision blocked。现在的 18/18 结论来自本轮 fresh 原图，未将旧图重新解释为通过。

“通过”限于已查看的默认相机阶段画面。微小 nick 计数、背面壳层严格包含、帧间 DNA 连续性、真实膜孔无交叉及任意跳转确定性仍与既有几何／状态回归分开。本报告没有声称所有 case、所有语言和所有相机均已人工完整播放验收，也不代表部署或真实设备验收。
