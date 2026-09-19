# Energy 科学审计 · Phase A

只读审计了 energy 目录全部 4 项和旧 `photosynthesis`，未修改产品或测试。5 个模型：**4 confirmed_issue、1 qualified_pass、0 unresolved**；5 条发现：**P1 × 3、P2 × 2**。没有 P0。

审计覆盖所有声明的 root、所有 stage、全部 control 选项、双语文案及实际几何/更新公式；进行了 headless 实例与过渡帧检查，查看了 5 张已有代表截图。没有浏览器验收。完整证据、来源访问边界、修复要求和验收不变量见 [energy.json](energy.json)。

| 模型 | root / control | 判定 | 发现 |
|---|---|---|---|
| respiration | cell / plant / yeast / paramecium；coupled / leak | confirmed_issue | energy-01 P1：酵母换成外周 Ndi1 后，两层脂质仍保留复合体 I 的穿膜孔。energy-02 P2：动物等根节点直接复用精确 c10 ATP 合酶环，缺少物种依据。 |
| glycolysis | cell / plant / yeast；无 control | confirmed_issue | energy-03 P1：PEP 标签出现时，磷酸仍连在三碳链末端 C3，未体现 3-PG→2-PG 后连接至中间 C2。 |
| bacterialEnergetics | bacterium（E. coli）；NDH-I/bo3 / NDH-II/bd-I | confirmed_issue | energy-04 P1：替换为外周 NDH-II 时，原入口的上下膜叶穿膜缺口保持开放。 |
| bacterialPhotosynthesis | bacterium（Synechocystis PCC 6803）；light / dark | confirmed_issue | energy-05 P2：所选蓝细菌仍使用共享 c10 环，缺少结构计量依据。 |
| photosynthesis（旧） | plant；无 control | qualified_pass | 在明确的叶绿体反应概览范围内，未发现确认错误。 |

## 优先修复

1. **两处外周脱氢酶不应留下穿膜空孔。** `detailKit.bilayer` 对同一 footprint 同时删去双层膜叶；Ndi1/NDH-II 几何只在下侧，不能封住上侧。计算的可见蛋白 y 上界分别为 −0.0444 / −0.0211，而上膜叶位于 +0.205。应按 root/route 恢复相应脂质连续性，并保留不泵质子和膜内 Q 接入。[Ndi1 原始结构 4G9K](https://www.rcsb.org/structure/4G9K)；[E. coli NDH-II 原始摘要（实际通过 Europe PMC API 读取）](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:23089137&format=json&resultType=core)。
2. **糖酵解的显示连接必须与 PEP 一致。** 当前 `end=positions[i?5:0]` 贯穿第二次磷酸转移；两条三碳链的中间碳均未成为磷酸连接点。用净反应表达位置变化即可，不应额外声称追踪未建模的酶/辅因子磷酸原子。[IUBMB 变位酶反应](https://iubmb.qmul.ac.uk/enzyme/EC5/4/2/11.html)、[IUBMB 烯醇化酶反应](https://iubmb.qmul.ac.uk/enzyme/EC4/2/1/11.html)。
3. **ATP 合酶 c 环按生物样本核实。** 共享 helper 明确画了 10 个 c 亚基；哺乳动物已有 c8 结构，而选定蓝细菌文献引用了 c14。后者本次读到的 2021 原始论文明确承认其自身实验未测定 n，故 Phase B 应先核对早期测量中的 strain 表再确定替换值，不能把引用链写成直接测量。旧植物模型自有 c14，不属于这个共享 helper 问题。[哺乳动物 2XND](https://www.rcsb.org/structure/2XND)、[蓝细菌 ATP 合酶原始全文](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8390522/fullTextXML)、[八株蓝细菌环计量原始摘要](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:17545285&format=json&resultType=core)。

## 已核查且未发现方向性错误的部分

- 呼吸链：基质→膜间隙的质子转移、膜间隙→基质的 ATP 合酶回流、Q 与 cytochrome c 分侧、II 不泵质子、酵母 Ndi1 不泵质子、解耦分支行为。
- E. coli：bo3 泵质子与 bd-I 的标量质子反应有区分；不误用线粒体 III–cytochrome c–IV 通路；无统一每葡萄糖 ATP 产量。
- 蓝细菌：独立类囊体腔、腔侧 OEC、胞质侧藻胆体/F1/Fd/FNR、氧来自水；暗条件停止的是所选光驱动通量，未否认呼吸。
- 糖酵解：六碳守恒、ATP 投入 2/生成 4/净得 2、NADH 2、丙酮酸 2、胞质定位与植物质体通路范围说明。
- 旧植物光合作用：光反应与基质固碳的腔室和输入输出关系成立。箭头是概览关系；未画出 b6f 微步骤或精确粒子数属于已声明的省略，不据此捏造错误。其 c14 可对照[菠菜叶绿体结构 6TQJ](https://www.rcsb.org/structure/6TQJ)。

审计不是对所有原子构象、真实速率或每个视角的正确性保证。PMC/PubMed 部分页面有验证码；已用公开 Europe PMC 原始摘要/全文 API 核实相应证据，并在 JSON 中区分实际读到的全文、摘要和未取得的早期全文。Phase A 到此，仅登记问题，等待全局汇总后修改。
