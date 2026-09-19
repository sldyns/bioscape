# Turnover 科学审计 · Phase A

审计者：p_energy（独立于 turnover 实现）。范围为 `entries.js` 中全部 4 项；逐文件检查双语文案、几何辅助函数、阶段与条件更新，并执行所有阶段边界、额外中间帧及终态。检查现有 `/tmp/atlas-refinement/<id>.png` 的代表帧；未操作浏览器，未修改产品或测试文件。代表帧不能代替完整视觉验收。

结论：**4 项 confirmed_issue，0 项 qualified_pass，0 项 unresolved；共 6 个 P1，0 个 P0/P2。** 各项仍有明确保留的未验证结构细节，见下文及机器可读的 [turnover.json](turnover.json)。这不是对未列问题的绝对正确保证。

## rnaSilencing — confirmed_issue

范围：动物细胞胞质，成熟 miRNA–Argonaute；检查 seed、slice、mismatch 全部条件。guide 的 5′/MID 与 3′/PAZ 朝向和 mRNA 反平行；典型抑制与 AGO2 切割分支分开，未泛化为所有 miRNA 都切割。省略生物发生属于本过程范围内的合理简化。

- **turnover-01 · P1 · 配对没有真实核苷酸对应。** `rnaSilencingProcess.js:159–194,356–375`：guide 间距为 .138，target 为 .25；22 个 guide 核苷酸仅覆盖约 12 个 target 间隔。配对线按 guide 坐标绘制，未接到 target 碱基。切点硬编码在 target 15/16，无法从当前模型验证其是否正对 guide 10/11。修复需建立共同的反平行核苷酸映射，显式表现不配对区，从映射生成配对和切点。验收：每条配对线两端都落在存在的对应碱基；一碱基最多一伙伴；切点有明确 guide 编号。
- **turnover-02 · P1 · 靶链消失后仍有配对。** `:356–381`：slice 在 p=.7 时靶链两段已经横移、下移，22 条配对线仍停在原位；p=1 时全部 28 段靶链不可见，22 条配对线依然可见。修复需让配对端点随目标运动，并随解离/降解消失。验收：不存在连接到不可见碱基的配对线，slice 终态配对数为零。

证据：实际打开 [Schirle 2014 / 4W5O 结构条目](https://www.rcsb.org/structure/4W5O) 和 [Sheu-Gruttadauria 2019 原始全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC6600645/)。后者展示 seed 与 supplementary 配对腔室及其间 target loop；这支持明确碱基对应，不支持两条独立刻度的轨道。

保留：N/PAZ/MID/PIWI、TNRC6 的通用折叠装饰未对齐实测结构，不能称为已验证原子折叠。修复映射前不对当前切点做编号正确的保证。

## proteasome — confirmed_issue

范围：cell、plant、yeast 全部根节点；选定单帽 26S、K48 标记且含可启动区的底物，与限定性的 untagged 对照。四层七聚体、六 ATPase、两层共六个催化位点、泛素回收与短肽输出的宏观计数区分合理；没有把 K48 说成唯一识别方式。全部根节点和两条件均检查。

- **turnover-03 · P1 · 远距离展开与去泛素化。** `proteasomeProcess.js:344–385`：unfold 与 release 在 p=.54 已完成；底物仍位于 y=1.482–3.482，ATPase 孔约 y=.68，Rpn11 在 y=1.35，而被泛素化的第 30 位仍在 y=2.946。尚未机械接触就完成展开/切除，破坏因果。修复需先使启动区进入孔，维持孔环接触后逐步展开和转运，连接位点到达 Rpn11 才断开。验收：展开必有孔内连续底物段；去泛素发生时切断位点必须位于 Rpn11 催化区域。
- **turnover-04 · P1 · 催化桶成为漏空支架，产物穿越蛋白区域。** `:103–126,401–408` 和 `molecularDetail.js:40–77`：层间中心距 .62，通用 fold 轴向厚度约 .50，在声明的前方剖切区之外仍产生多层空隙；截图也显示周向块体分离。肽产物立即斜向离开，例如 j=6、q=.633 时位置约 (-.760,-1.810,.380)，在远端 α 环高度半径已约 .85。修复需由贴合的蛋白亚基构成环形桶，仅保留一处明确观察剖切；产物先在腔内经过选定轴向孔，再扩散。不要额外套一层膜壳。验收：非剖切区连续包围催化腔，轨迹不穿过亚基，也不把观察剖切当作生理出口。

证据：实际打开 [de la Peña 2018 作者提供的原始论文 PDF](https://www.lander-lab.com/pdfs/30309908.pdf)，其开篇描述孔环接触底物、机械展开/转运，以及牵引泛素连接位点到 Rpn11；另核对 [Sahu & Glickman 2021 全文及图 1](https://pmc.ncbi.nlm.nih.gov/articles/PMC8106498/)。

保留：具体生理产物出口不能断言永远是某一固定端；修法中的轴向出口是需明确的示意路线。未验证通用 α/β/AAA 二级结构装饰，未模拟 ATP 精确计量及全部调节颗粒亚基。

## crispr — confirmed_issue

范围：bacterium，明确选择 *S. pyogenes* II-A Cas9 干扰阶段，使用自然 crRNA/tracrRNA。检查 matched、noPam、mismatch；非靶链/靶链/guide 朝向及 PAM 所在端合理，HNH 与 RuvC 各自切相应链。无 PAM 不稳定打开，多处 PAM 邻近错配短暂打开后复合，文案没有把任一单错配都说成绝对禁止切割。

- **turnover-05 · P1 · R-loop 配对数量与局部开链不一致。** `crisprProcess.js:237–254,390–436`：20 个 guide 核苷酸间距 .155，DNA 间距 .125；全开窗口包含 27 个 DNA 位置，却没有对应的未配对凸起。RNA–DNA 配对线固定在 guide 刻度上，不绑定靶碱基。global open>.28 时窗口内 DNA 配对线近乎整体消失，而部分远端尚未局部开链。修复需统一 20-nt protospacer、guide、target、displaced strand 与邻接 PAM 的索引，按局部开链进度更新两种配对。验收：完整匹配 R-loop 有明确 20 对；传播尚未到达的远端仍为 DNA 双链；一个碱基不能同时形成 DNA–DNA 与 RNA–DNA 配对；切点需由 PAM 编号导出。

证据：实际打开 [Pacesa 2022 原始全文](https://www.nature.com/articles/s41586-022-05114-0) 和 [Nishimasu 2014 / 4OO8 结构条目](https://www.rcsb.org/structure/4OO8)。前者的部分 R-loop 结构支持从 PAM 邻近向远端传播，未打开的远端保持双链。

保留：`:192–221` 的两条悬垂 RNA 曲线没有解析 repeat/anti-repeat 双链；这一点保留为未验证结构细节，未凭颜色增加为确定缺陷。4OO8 使用 sgRNA，不能单独验证模型宣称的自然双 RNA 拓扑。Jinek 2012 的 PMC、出版商和大学库访问遭拦截；未将搜索结果标题当作全文证据。通用蛋白 fold 装饰也未拟合结构。

## bacterialRepair — confirmed_issue

范围：bacterium，*E. coli* RecA–LexA SOS 诱导，损伤相关 ssDNA 缺口与另一处 SOS 启动子。检查 wildtype、noncleavable 全阶段。亲本链连续、互补链缺口、RecA 依赖 ATP 组装、促进 LexA 自切而非自己充当蛋白酶、不可切对照不生成 RNA 均表达合理。两处 DNA 位点明确分离，未将 SOS 诱导等同修复已经完成。

- **turnover-06 · P1 · 转录过程中模板仍是完整双链。** `bacterialRepairProcess.js:174–191,343–376,429–447`：下方两条 DNA 管、40 根配对杆及碱基实例完全静态；wildtype 在 p>.65 时 RNAP 沿完整双螺旋移动，同时第三条 RNA 伸长，没有局部开放模板、RNA–DNA 杂交区或后方复合。修复需在 RNAP 周围建立移动转录泡，局部 DNA 配对换成短 RNA–template 配对，保留正确的 RNA 3′ 活性端并使后方 DNA 复合；或明确改成抽象的表达产物输出。验收：RNA 增长必伴随 RNAP 处模板开放及 3′ 端接触；仅泡内 DNA 配对消失；不可切对照保持完整双链且无新生 RNA。

证据：实际打开 [Cory 2024 出版商摘要与结构数据链接](https://www.nature.com/articles/s41594-024-01317-3?error=cookies_not_supported)，核实 RecA* 促进 LexA 自切，未声称取得被拦截的 PMC 全文；另实际打开 [E. coli RNAP 延伸复合体 6ALF](https://www.rcsb.org/structure/6ALF) 和 [RCSB 官方 RNA polymerase 结构说明](https://pdb101.rcsb.org/global-health/antimicrobial-resistance/drugs/antibiotics/rna-synthesis/rna-polymerase/rna-polymerase)，核对活性腔内的 RNA–DNA 杂交区及 RNA 出口。

保留：RecA 螺旋/ssDNA 与 LexA 接触没有拟合 8TRG；不能认证模型具备实测的跨三 RecA 亚基界面。SSB/介导因子、LexA 总池动态及后续修复结果在本过程范围外。

## 全局复核后建议的修复顺序

先修与实际接触相关的因果和拓扑（turnover-03、04、06），再统一核苷酸索引和交互生命周期（01、02、05）。所有通用 fold 只能作为明确的结构示意；增加折叠装饰数量不能抵消桶壁漏空、假配对或远距离催化。上述仅为修法与验收约束，Phase A 未实施修复。
