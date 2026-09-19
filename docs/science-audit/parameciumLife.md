# parameciumLife — Phase A 独立科学审计

覆盖 entries 中全部 4 个模型、全部中英阶段、实际 update 公式、共同几何助手和唯一控件的两种条件；没有额外 root context。看过 `/tmp/atlas-refinement/` 中四张 0.55 帧截图，并用只读 Node 调用抽查中间状态。模型、测试、缩略图均未修改。稳定 issueId、修法和验证不变量见同名 JSON。

**结论：4 个 confirmed_issue，0 个 qualified_pass，0 个 unresolved；共 6 项，P1 × 4、P2 × 2。** 这不表示四个模型的全部叙述错误；接合的核心核数、倍性与交换顺序获得支持，问题主要在膜/核的实际运动和一项条件说明。

## parameciumFeeding — confirmed_issue

- **parameciumLife-01 · P1 · 融合被画成整泡穿膜。** `parameciumFeedingProcess.js:355–365` 将完整酸性小泡、溶酶体一路移到食物泡中心后隐藏。p=0.45 时酸性小泡中心离食物泡中心仅 0.01377，食物泡膜没有融合变化。这与膜边缘形成融合颈不同。[原始电镜说明](https://www6.pbrc.hawaii.edu/allen/ch06/12-pmdv780609-7.html)显示融合位点在泡的周边。应在接触处建立融合连接，仅转移内容物，供体膜在原位并入/回收；验证完整供体不直接穿入受体泡腔。
- **parameciumLife-02 · P2 · 摄入前后的食物不是连续对象。** `:340–354` 中胞内七个食物对象从 p=0 已可见，另七个胞外对象在 p=0.27 同时消失；最后一个在约 `(0.330,-0.140,0.530)`，仍未到食物泡。应沿胞口—胞咽路径连续跟踪同一批食物，在同位置交接几何表示。相关[摄食泡形成电镜说明](https://www6.pbrc.hawaii.edu/allen/ch06/01-pmdv830408-14.html)已打开核对。

已确认的正确部分：摄入口与胞肛分开，酸化先于溶酶体递送，排渣时膜回收方向朝胞内。分别得到[酸化干预实验](https://pubmed.ncbi.nlm.nih.gov/3622528/)和[胞肛电镜说明](https://www6.pbrc.hawaii.edu/allen/ch07/02-pmcyp820525-17.html)支持。

## contractileVacuole — confirmed_issue

- **parameciumLife-03 · P1 · 充盈期入口与中央泡脱节。** `contractileVacuoleProcess.js:216–221,313–340` 将入口内端固定在半径 0.62；cycle=0 时中央泡半径只有 0.38966，即使忽略 z 偏移也有至少 0.23034 的径向差。模型却声明已经连接并继续向内送水。应让入口与动态泡壁同源定位，充盈时保持管腔连续，仅在排水前断开；两种条件都要检查早期充盈和下一轮重连。

水运动方向正确：环境→胞质、放射管向中央、排水向外。较强低渗下循环较快的定性方向合理；具体速度仅是示意。[原始活体视频说明](https://www6.pbrc.hawaii.edu/allen/ch09/video/vid-1/)明确描述排水前断开、排水后重新连接；[渗透压干预研究](https://pubmed.ncbi.nlm.nih.gov/8834807/)支持环境变化影响排水活动。不能把当前烟雾测试中的 connected 状态当作几何连通证据。

## parameciumDivision — confirmed_issue

- **parameciumLife-04 · P1 · 闭合式分裂中染色体越出核膜。** `parameciumDivisionProcess.js:138–143,202–216` 在 p=0.52 的外侧染色体端点，相对于完整小核椭球的归一化距离平方约为 **1.464 > 1**。这已超出完整核体积，不能由观察切面解释。应统一核膜和染色体的坐标/伸长模型，逐帧验证纺锤体与染色体被核膜包容。[尾草履虫原始电镜说明](https://www6.pbrc.hawaii.edu/allen/ch10a/48-pca740125-46.html)支持核膜完整的分裂。
- **parameciumLife-05 · P1 · 大核连接桥成为游离第三块。** `:225–237` 在 p=0.70 的两个核叶中心为 y=±1.38976、半长 0.54，而桥只到 ±0.65，两端各有 **0.19976** 空隙；桥仍显示到 p=0.76。应使用连续伸长/缢缩的核表面，分开后只有两个核，不能留下悬空中段。大核形变是有组织的过程；已有[微管与大核分裂研究](https://pubmed.ncbi.nlm.nih.gov/7440651/)为 P. tetraurelia 比较证据，不能冒称逐项证明 P. caudatum 的细节。

正确部分：大小核分裂方式区分、后部口器形成、横向裂沟、终点每个子细胞各得一个大小核，以及没有配偶核交换。

## parameciumConjugation — confirmed_issue（仅 P2 条件说明）

- **parameciumLife-06 · P2 · 单小核选择缺少营养条件。** 最后阶段和 `:275–288` 总在终点淘汰三个前部候选小核，没有说明营养恢复/供给的前提。[原始研究](https://www.jstage.jst.go.jp/article/pjab1977/76/7/76_7_87/_article/-char/en)观察到饥饿后的接合子仍可保留多个候选小核，而供给培养基与选择单一小核相关。只需把终点明确限定为营养支持下的代表性接合后过程；不必新增控件。

没有发现核心核数/倍性错误：每细胞 1 个二倍体小核→4 个单倍体产物→保留 1 个→有丝分裂成 2 个单倍体原核→双向交换→各自形成二倍体合核→三轮分裂成 8 个核→4 个后部大核原基与 1 个保留小核。两个配偶一直是两个细胞；旧大核片段不会立即消失。[原核迁移实验](https://pubmed.ncbi.nlm.nih.gov/11908901/)、[核移植/分化实验](https://pubmed.ncbi.nlm.nih.gov/37281122/)及[旧大核片段研究](https://pubmed.ncbi.nlm.nih.gov/12919103/)已打开核对。

本审计不是完整超微结构复原的认证。精确膜孔重建、蛋白结构、真实速率和所有中间帧的视觉辨识度仍属模型抽象或后续验收范围；在全局审计汇总前不做 Phase B 修改。
