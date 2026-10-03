# B 组过程连续播放复核

日期：2026-10-03。范围：`Object.keys(processCatalog).slice(28,56)`，28项。

通过 CUA 实际点击播放，1.5×，从0连续到时间轴1000；未以端点拖动代替播放。每个默认过程及所有条件分支均有完整播放，中段/终态画面检查。扩散4种组合均覆盖。首轮在4200，修复独立复验在4201。截图仅作为工具内观察，没有批量写入图像/视频。

## 修复验证

- B-01：无ATP、RTK激酶失活等模型保持阻断，但旧版右栏曾宣称后续事件发生。4201完整重播无ATP和激酶失活：顶部明确当前条件实际响应，下方标为机制参考，说明后续章节不代表事件发生。
- B-02：有丝分裂旧版默认两次在中期附近出现“三维画面暂时不可用”；未附着分支亦失败。4201默认和未附着各完整重播，均未再失败；默认终态两个子细胞，未附着终态仍在中期。
- B-03：减数分裂旧版中段可见，末段出现三维不可用。4201默认完整重播，中段和四个带胞质桥产物均正常。

## 逐项记录

| ID | 完整播放条件 | 关键画面 |
|---|---|---|
| bacterialEnergetics | {"route":"ndh1-bo"}；{"route":"ndh2-bd"} | 0:34/0:34 screenshot; non-pumping enzyme labels visible |
| bacterialPhotosynthesis | {"light":"light"}；{"light":"dark"} | 0:36/0:36; dark selection retained; intact membrane no driven flux |
| diffusion | {"route":"water","gradient":"outside"}；{"route":"oxygen","gradient":"equal"}；{"route":"water","gradient":"equal"}；{"route":"oxygen","gradient":"outside"} | 0:30/0:30; distribution moves toward equilibrium |
| activeTransport | {"energy":"atp"}；{"energy":"none"} | 0:36/0:36; static E1; generic later section labeled mechanism reference |
| osmoticBalance | {"tonicity":"hypotonic"}；{"tonicity":"hypertonic"}；{"tonicity":"isotonic"} | 0:28/0:28; cell volume stable |
| bacterialCellWall | {"antibiotic":"none"}；{"antibiotic":"betaLactam"} | 0:34/0:34; glycan visible with absent new crosslink |
| endocytosis | {} | 0:34/0:34; fused endosome contains LDL, receptor in recycling domain |
| autophagy | {} | 0:33/0:33; autolysosome with sparse degraded cargo |
| mitosis | {"attachment":"normal"}；{"attachment":"unattached"} | 0:32/0:32; metaphase retained, no daughter cells; current-condition panel explains checkpoint arrest |
| meiosis | {} | 0:38/0:38; four haploid products and cytoplasmic bridges |
| signalTransduction | {"condition":"ligand"}；{"condition":"kinaseInactive"}；{"condition":"noLigand"} | 0:32/0:32; inactive relay; mechanism-reference label and explicit non-occurrence caveat |
| apoptosis | {"condition":"stress"}；{"condition":"noStress"} | 0:34/0:34; intact original cell; narrative still says blebs |
| differentiation | {"program":"competent"}；{"program":"impaired"} | 0:34/0:34; unchanged nucleated precursor; narrative claims enucleation |
| immuneResponse | {"epitope":"matched"}；{"epitope":"unmatched"} | 0:36/0:36; looser contact, granules dispersed |
| actionPotential | {"stimulus":"on"}；{"stimulus":"off"} | 0:32/0:32; resting configuration throughout |
| synapse | {"calcium":"available"}；{"calcium":"blocked"} | 0:34/0:34; vesicle remains loaded |
| muscle | {"calcium":"released"}；{"calcium":"low"} | 0:34/0:34; original Z spacing retained |
| ciliaryMotion | {"atp":"available"}；{"atp":"absent"} | 0:32/0:32; stays straight |
| plasmolysis | {"bath":"recover"}；{"bath":"hold"} | 0:32/0:32; detached protoplast and gap retained |
| stomata | {"signal":"aba"}；{"signal":"light"} | 0:34/0:34; broad pore remains open |
| plantLongDistanceTransport | {"stomata":"close"}；{"stomata":"open"} | 0:34/0:34; open pore, more evaporation markers |
| chloroplastMovement | {"genotype":"wild"}；{"genotype":"phot2"} | 0:32/0:32; chloroplasts remain flat at bottom |
| plantDivision | {} | 0:34/0:34; continuous plate spans mother wall, two nuclei |
| cellWallGrowth | {"extensibility":"yielding"}；{"extensibility":"restrained"} | 0:30/0:30; patch stays shorter than yielding case |
| doubleFertilization | {"assignment":"frontEgg"}；{"assignment":"frontCentral"} | 0:36/0:36; same 2n/3n outcome with swapped sperm assignment |
| fungalHyphae | {"delivery":"normal"}；{"delivery":"reduced"} | 0:32/0:32; visibly shorter hypha, fewer vesicles |
| auxin | {"auxin":"present"}；{"auxin":"low"} | 0:34/0:34; repression retained, no RNA |
| plantDefense | {"ligand":"flg22"}；{"ligand":"absent"} | 0:32/0:32; no ROS induction |

## 边界

- 28项默认均已实际完整播放；所有选项均实际选择并有完整分支播放。详细中段、终态及旧版失败保留在 `playback-b.json`。
- 最终4201只针对两类分裂、钠钾泵阻断、RTK失活以及扩散组合补验；其余模型完整证据来自4200。不可称28项全都在最终构建重新播放。
- 本代理仅1280×720桌面；不是移动设备验收、固定性能测试、逐帧录像或科学文献审查。
- 无剩余已观察且未处理的渲染缺陷。其他对照的最终条件提示未逐一在4201复验。
