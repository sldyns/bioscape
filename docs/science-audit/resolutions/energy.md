# Energy · Phase B 修复记录

**energy-01 至 energy-05 全部 fixed；旧 photosynthesis 保持未修改。** Phase A 审计文件保持不变。待主线程复核和渲染验收，不把测试通过等同于所有科学细节得到证明。

| Issue     | 修复                                                                         | 实际几何回归                                                                            |
| --------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| energy-01 | 酵母外周 Ndi1 处取消穿膜脂质删减。                                           | 逐个匹配原缺口内双膜叶的脂质头坐标，无缺失和重复；保留动物复合体 I。                    |
| energy-02 | 哺乳动物 c8、酵母 c10；拟南芥/草履虫为未分段 c 环轮廓，保留转轴、定子和 F1。 | 数实际 c 亚基网格、检查角间距、连续轮廓尺寸、六个 F1 叶片及膜侧。                       |
| energy-03 | 3-PG→2-PG 后磷酸位于中间 C2；PEP 再把它交给 ADP。                            | 用变换后的键端点对齐实际碳与磷酸位置，覆盖转位/脱离的中间时刻；最终六碳与四个输出磷酸。 |
| energy-04 | NDH-II 分支补回与周围同晶格的双膜叶脂质片。                                  | 各阶段反复切换两支路，检查缺口完整覆盖、没有脂质重复。                                  |
| energy-05 | PCC 6803 改为实验推定的 c14，双语说明和出处同步。                            | 光/暗各阶段实际存在 14 个双螺旋 c 亚基；F1 仍朝胞质。                                   |

运行 `node src/processes/modules/energy/science.test.mjs` 全部通过。该文件还执行本组 `refinement-smoke.mjs`：四项所有 roots/controls 的有限几何、确定性回跳、稳定资源与浏览器目标打包均通过。仅格式化本组文件；未跑全局检查、未操作浏览器。

新增/修改文件：`detailKit.js`、`respirationProcess.js`、`bacterialEnergeticsProcess.js`、`bacterialPhotosynthesisProcess.js`、`glycolysisProcess.js`、`science.test.mjs`，以及本闭环 JSON/Markdown。

## 证据边界

- [牛线粒体 2XND](https://www.rcsb.org/structure/2XND)、[酵母 3U2F](https://www.rcsb.org/structure/3U2F)、[E. coli 6OQR](https://www.rcsb.org/structure/6OQR) 均实际打开核实。
- 植物使用 [2025 原始研究](https://doi.org/10.1107/S2052252525006220) 的 19–31 Å 结构范围；草履虫 [EMD-3441](https://www.ebi.ac.uk/emdb/EMD-3441) 为 26 Å。这里不把低分辨率轮廓转换成凭空确定的 c 亚基数，整体 ATP 合酶和旋转机制仍保留。
- 已取得 [Pogoryelov 2007 原文的 publisher preview](https://www.researchgate.net/publication/6291778_The_Oligomeric_State_of_c_Rings_from_Cyanobacterial_F-ATP_Synthases_Varies_from_13_to_15)，表 1 的 PCC 6803 行明确给出 c14；依据是质量/迁移率实验推定，文案未称作该株原子结构。它补齐了 Phase A 未读到原表的限制。
- 糖酵解依据 [IUBMB mutase](https://iubmb.qmul.ac.uk/enzyme/EC5/4/2/11.html) 与 [enolase](https://iubmb.qmul.ac.uk/enzyme/EC4/2/1/11.html)。动态表达净磷酸位置，不声称追踪省略的辅因子化学中单个磷原子。

完整逐 issue 文件、测试和来源记录见 [energy.json](energy.json)。

## Peer 后续：c 亚基环的膜侧

p_genome 发现原共享 helper 的 hairpin loop 始终位于 +Y；这与朝 −Y 的动物/酵母/E. coli F1 不一致。已按 F1 方向对每个 c 亚基做 X 轴 180° 刚体旋转，不镜像螺旋。新增实际连接环顶点/F1 同侧及变换行列式 +1 断言；全部本组 science/refinement 回归再次通过。[实际读取的牛 c 亚基原始全文](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC4390263/fullTextXML)明确环区域位于基质侧。
