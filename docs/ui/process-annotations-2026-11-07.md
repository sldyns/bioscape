# Process annotations and links · 过程标注与关联入口

Baseline: v1.1.2. Candidate release: v1.1.3.

## 发现与修改

原全高清导出图左上角常驻四条上下文说明。坐标表示、配色说明和固定核糖体视角已在次级信息中说明，却仍与生物学标签一起进入画面。

删除这三条重复的常驻标注。rRNA C4′ / 蛋白 Cα 骨架信息放在展开的 4UG0 参考资料条目中；配色、共同坐标和代表结构的范围保留在过程介绍中；mRNA 相对运动保留在移位章节。实验结构标签、独立放大示意及全部生物学标签继续显示。

## 关联结构

过程页仅在存在当前步骤入口、其他步骤入口或可用的整体结构返回时显示关联区。没有当前步骤入口时，不再重复输出“暂无对应模型”。酵母细胞质、草履虫翻译、集胞藻类囊体和 PAO1 生物膜的范围名称保留，去除关于目录缺少节点的实现说明。原有路径、步骤归属和条件筛选不变。

## 验证范围

- 四个注册根场景：动物细胞、植物细胞、真菌和草履虫。
- 每个根场景检查 228 个状态及反向返回，共 912 个正向和 912 个反向状态。除明确删除的三条说明外，模型几何、法线、实例矩阵、材质、相机、包围范围及保留标签的文本、状态和位置均与冻结基线一致。八个模型生命周期的资源仅释放一次。
- 保留原有科学和真实几何锚点回归，包括不规则跳转、酯键与肽链连接、实验骨架坐标及缺口、四种恢复旧偏移的失败对照。
- 原生浏览器使用生产 ProcessScene、原模型相机和原绘制设置。四个根场景 × 中英文 × 六章的起点/中点，96 组 1920×1080 无标签对比零通道差异；另外完成 96 次当前带标签导出。
- 复核中英文移位与释放阶段的四张不同原图；同像素的根场景副本复用结论，原图保留完整分辨率。
- 在完整应用中从根入口和过程目录进入，实操全部 84 个过程、114 个根场景、235 个条件，共 2,768 个双语章节状态。独立重读每个实际界面记录，核对根入口、过程、条件、语言、章节进度、模型就绪和关联区显示；没有遗漏或重复状态。
- 核对标签开关、展开后的参考资料、当前步骤关联、只有其他步骤关联时的跳转，以及深层来源的整体结构返回。390×844 视口下检查阅读、参考资料换行和返回模型；复核 13 个空关联根场景的原始界面截图。窄视口不替代真实手机触控。
- 对冻结的 235 个条件、1,384 个章节条件逐项比较关联元数据，保留路径、步骤及条件筛选；仅四类生物学范围名称精简了目录实现说明。实际界面核查另外确认 310 个双语无关联状态隐藏空区，1,544 个只有其他步骤关联的状态保留入口。

本次仅调整标注与参考条目的呈现位置，不改变渲染器、导出算法、模型动画或质量参数。以上是对应模型、状态及设备上的正确性和界面证据，不是全部生物学过程的独立科学判定、真实手机触控或物理稳定 60 FPS 验收。

## English

The translation scene no longer repeats three technical conventions as permanent annotations. Representation details remain in references, the introduction and the relevant chapter. The experimental human assembly, separate reaction enlargement and biological targets remain distinguishable.

The four registered roots retain exact geometry, materials, camera and remaining label anchors through dense forward/reverse seeking. All 96 unlabelled full-HD raster pairs are exact; 96 labelled captures and all 2,768 actual bilingual chapter states across 235 conditions were also checked. Independent raw-state reconciliation confirmed chapter progress, parameters, readiness and related-navigation visibility. Link following, narrow-viewport references and label toggles were checked separately. The change makes no new performance or universal scientific-acceptance claim.
