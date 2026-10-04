# bacterialSignals · 最终 all-root/control 图像复核

结论：4 个过程、1 个实际注册根（`bacterium`）、8 个条件 case 的 8 张阶段 sheet 全部只读审阅，共覆盖 56 张原生 960 × 640 阶段图。另展开 5 张原尺寸图核对新分支与早期生物膜细部；这 5 张属于上述 56 张，不重复计数。所有 case 在本轮静态证据范围内有条件通过，未确认需要新增登记的问题。

索引：`../evidence/browser/conditions-final-gallery-index.json`。本次仅写本报告，没有修改产品、测试、既有审查/结案记录，没有浏览器操作或测试重跑。

## 逐 case 记录

| Case | 根与条件 | 图数 | 已审 sheet | 本轮结论 |
| --- | --- | ---: | --- | --- |
| `conditions-final-a-199-chemotaxis-bacterium` | `bacterium` · `{"environment":"gradient"}` | 7 | [阶段 sheet](../evidence/browser/sheets/conditions-final-a-199-chemotaxis-bacterium.jpg) | 有条件通过；无新增确认问题 |
| `conditions-final-a-200-chemotaxis-bacterium` | `bacterium` · `{"environment":"uniform"}` | 7 | [阶段 sheet](../evidence/browser/sheets/conditions-final-a-200-chemotaxis-bacterium.jpg) | 有条件通过；无新增确认问题 |
| `conditions-final-a-201-twoComponent-bacterium` | `bacterium` · `{"nitrate":"present"}` | 7 | [阶段 sheet](../evidence/browser/sheets/conditions-final-a-201-twoComponent-bacterium.jpg) | 有条件通过；无新增确认问题 |
| `conditions-final-a-202-twoComponent-bacterium` | `bacterium` · `{"nitrate":"absent"}` | 7 | [阶段 sheet](../evidence/browser/sheets/conditions-final-a-202-twoComponent-bacterium.jpg) | 有条件通过；无新增确认问题 |
| `conditions-final-a-203-quorumSensing-bacterium` | `bacterium` · `{"exchange":"retained"}` | 7 | [阶段 sheet](../evidence/browser/sheets/conditions-final-a-203-quorumSensing-bacterium.jpg) | 有条件通过；无新增确认问题 |
| `conditions-final-a-204-quorumSensing-bacterium` | `bacterium` · `{"exchange":"diluted"}` | 7 | [阶段 sheet](../evidence/browser/sheets/conditions-final-a-204-quorumSensing-bacterium.jpg) | 有条件通过；无新增确认问题 |
| `conditions-final-a-205-biofilm-bacterium` | `bacterium` · `{"cue":"NO"}` | 7 | [阶段 sheet](../evidence/browser/sheets/conditions-final-a-205-biofilm-bacterium.jpg) | 有条件通过；无新增确认问题 |
| `conditions-final-a-206-biofilm-bacterium` | `bacterium` · `{"cue":"none"}` | 7 | [阶段 sheet](../evidence/browser/sheets/conditions-final-a-206-biofilm-bacterium.jpg) | 有条件通过；无新增确认问题 |

### chemotaxis · gradient

- Case：`conditions-final-a-199-chemotaxis-bacterium`；7 张图，progress = `0.000, 0.195, 0.395, 0.575, 0.765, 0.915, 1.000`。
- 观察：标签端点随细胞姿态和 CheY-P 代表粒子变化；受体、CheA/CheW、CheZ、马达和示意轨迹可辨。p=0.765 所选鞭毛离束，后续恢复；梯度分支使用较长的示意游程，后段 CheY-P 代表数量较少。
- 限制：静态图可确认形态与标签落点，不能确认旋转方向、完整翻滚频率或逐帧连续性。

### chemotaxis · uniform

- Case：`conditions-final-a-200-chemotaxis-bacterium`；7 张图，progress = `0.000, 0.195, 0.395, 0.575, 0.765, 0.915, 1.000`。
- 观察：两次被阶段采样命中的翻滚形态（p=0.575、0.765）与后续恢复可辨；CheY-P 代表保持较多，轨迹较局部。原尺寸 p=0.575 确认鞭毛及轨迹没有被画面边缘截断，标签可读。
- 限制：阶段采样没有覆盖每个翻滚区间的完整播放；示意轨迹不是实验轨迹。

### twoComponent · present

- Case：`conditions-final-a-201-twoComponent-bacterium`；7 张图，progress = `0.000, 0.175, 0.355, 0.525, 0.715, 0.915, 1.000`。
- 观察：硝酸盐从周质接近 NarX；ATP 在后续变为 ADP；NarL 在转移阶段靠近 His，之后移至 DNA，晚期 RNA 和 RNA 标签出现。周质/胞质明确为区域，分子标签指向实际对象。
- 限制：p=0.525 的相互作用区存在预期投影重叠；单帧不能验证磷酸交接全过程的守恒和连续性。

### twoComponent · absent

- Case：`conditions-final-a-202-twoComponent-bacterium`；7 张图，progress = `0.000, 0.175, 0.355, 0.525, 0.715, 0.915, 1.000`。
- 观察：七帧均无硝酸盐对象/标签、无 RNA 或 RNA 标签；ATP 与未增强响应状态的 NarL 保留。原尺寸末帧确认区域说明与蛋白、膜、DNA 标签可读且对象未截断。
- 限制：该非激活分支七帧相同是有意保持状态，不据此判为播放故障；不等于所有基础激酶活性为零。

### quorumSensing · retained

- Case：`conditions-final-a-203-quorumSensing-bacterium`；7 张图，progress = `0.000, 0.175, 0.355, 0.525, 0.715, 0.895, 1.000`。
- 观察：早期文字为 LuxR，p=0.525 有可见结合 AHL 后改为 LuxR + AHL；后段调控复合物到达 lux box，RNA、额外 LuxI 和条件性光晕出现。移动 AHL 与 RNA 标签有实际对象。
- 限制：晚期 DNA、LuxR 和聚合酶局部拥挤，但身份与关键输出可辨；光晕为输出示意，不表示测量亮度。

### quorumSensing · diluted

- Case：`conditions-final-a-204-quorumSensing-bacterium`；7 张图，progress = `0.000, 0.175, 0.355, 0.525, 0.715, 0.895, 1.000`。
- 观察：全程为未结合 AHL 的 LuxR 文字，少量游离 AHL 改变位置；没有新增 RNA/RNA 标签、额外 LuxI 或增强发光输出。原尺寸末帧确认分子标签、DNA 与固定群体可辨。
- 限制：只能确认抽样状态与分支区别；没有在本次审图中逐帧验证 AHL 扩散路径和进出细胞事件。

### biofilm · NO

- Case：`conditions-final-a-205-biofilm-bacterium`；7 张图，progress = `0.000, 0.185, 0.355, 0.525, 0.715, 0.895, 1.000`。
- 观察：早期仅有细胞与固体表面标签，随后 Psl、胞外 DNA、基质蛋白依可见对象出现；p=0.715 后出现 NO，c-di-GMP inset 随后缩小，后段释放活细胞并显示对应标签，仍保留周围基质。
- 限制：原尺寸 p=0.355 显示早期稀疏 Psl 与尚很小的代表细胞；这是阶段性代表图形，不是物理生长仿真。标签可见性修复成立；不能据静态图确认全部释放轨迹连续。

### biofilm · none

- Case：`conditions-final-a-206-biofilm-bacterium`；7 张图，progress = `0.000, 0.185, 0.355, 0.525, 0.715, 0.895, 1.000`。
- 观察：早期隐藏的基质标签未遗留；成熟后基质、细胞与 c-di-GMP inset 保持，全部七帧无 NO/NO 标签或释放标签。原尺寸末帧确认未出现分散细胞，相关标签指向对应结构。
- 限制：末三帧保持相同是该条件的预期状态；不表示真实生物膜必然静止或只有这一种成熟形态。

## 原尺寸补查（960 × 640）

- [conditions-final-a-200-chemotaxis-bacterium-stage-4.webp](../evidence/browser/conditions-final-a-200-chemotaxis-bacterium-stage-4.webp)：uniform，p=0.575：翻滚时的鞭毛完整画面、动态标签和局部轨迹。
- [conditions-final-a-202-twoComponent-bacterium-end.webp](../evidence/browser/conditions-final-a-202-twoComponent-bacterium-end.webp)：absent，p=1：硝酸盐/RNA 隐藏、ATP/NarL 名称、区域说明及 DNA 端点。
- [conditions-final-a-204-quorumSensing-bacterium-end.webp](../evidence/browser/conditions-final-a-204-quorumSensing-bacterium-end.webp)：diluted，p=1：LuxR 未结合措辞、RNA/增强输出缺省和可见 AHL。
- [conditions-final-a-206-biofilm-bacterium-end.webp](../evidence/browser/conditions-final-a-206-biofilm-bacterium-end.webp)：none，p=1：成熟群体保留、NO/释放标签缺省、c-di-GMP inset 保持。
- [conditions-final-a-205-biofilm-bacterium-stage-3.webp](../evidence/browser/conditions-final-a-205-biofilm-bacterium-stage-3.webp)：NO，p=0.355：稀疏早期 Psl 与代表细胞，确认标签只指向已显示结构。

## 共享渲染和完成边界

父级已说明共享引线绘制顺序刚改为先画全部引线、再画全部标签框，本批图可能仍包含修复前的引线穿过其他文字框现象。本轮将其作为已知共享旧图边界，不重复登记、不移动真实锚点，也不把旧图当成对最新两遍绘制结果的验收。

这批 native 图来自不规则进度跳转，不能等同于所有 case 都已完整连续播放。本报告确认的是所有实际 root/control 的抽样构图、对象/标签可见性、动态身份文字及终态区别。微观几何接触、转动方向、同一粒子的全过程连续性沿用先前独立数值回归证据，本轮没有重跑或扩大其结论。

本轮没有新增确认缺陷，也没有改变此前 9 个 issue 的修复。最终完整连续播放、手机/实机表现、性能与发布仍是独立验证范围。
