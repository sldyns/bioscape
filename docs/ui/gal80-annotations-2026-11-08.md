# GAL 标注精简 · GAL annotation cleanup

Baseline: v1.1.3. Release: v1.1.4.

## 修改

无半乳糖、低葡萄糖时，画面曾同时显示“Gal80 遮挡激活域”和“Gal80 抑制”，都指向 Gal80。现在保留前一条，只隐藏后一条重复的结果标注。其他条件的结果标注保留；不修改生物学文本、章节或标签锚点。

## 验证范围

- 四种条件各检查 216 个进度，包括章节边界、章节中点及标注出现阈值两侧。共 864 个正向与 864 个反向状态；只有目标条件的重复标注 active 标志存在预期差异。
- 几何、法线、实例矩阵、材质、相机、包围范围、模型元数据、所有标签文本和锚点保持一致。其余 11 个标签的状态一致，八个模型生命周期资源均只释放一次。
- 现有物理锚点回归继续检查 16 个控制组合、变换后的几何和不规则跳转；保留四种历史变异对照，另拒绝恢复重复标注、误隐藏 Gal80 必要标注及误隐藏其他条件结果的三种变异。
- 使用生产 ProcessScene 和原有渲染设置，在原生浏览器检查四种条件 × 中英文 × 六章起点和中点，共 96 组 1920×1080 无标签画面对比，零通道差异。
- 同时比较 96 组带标签导出：86 组逐像素一致，目标条件在标注阈值后的 10 组仅出现预期的标注布局变化。原始标签图保留全高清尺寸，并逐张复核四种条件的双语末章画面及两张修改前对照。
- 共享渲染器只分配一次、退役一次；该有限矩阵未记录控制台错误或警告。

此处记录对应模型、条件、语言和设备的验证。不改变渲染器、导出算法、质量参数或其他过程，不引入性能、真实手机触控、全部生物学过程独立科学审定或物理稳定 60 FPS 的新结论。

## English

When galactose is absent and glucose is low, both the masking label and a separate repression outcome described the same Gal80 state. Only the repeated outcome is hidden; the masking label and all other condition outcomes remain.

All four conditions retain exact rendered geometry, materials, camera, metadata and label anchors through 864 forward and 864 reverse states. Native full-HD captures produce 96 exact unlabelled pairs; 86 labelled pairs remain exact and ten have the intended label-only change. The original model and export quality are preserved.
