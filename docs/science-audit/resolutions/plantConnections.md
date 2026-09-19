# plantConnections — Phase B resolutions

All three original issue IDs are addressed. Phase A evidence remains unchanged. Only `plantTransportProcess.js`, `c4camProcess.js`, local `science.test.mjs`, and these resolution documents were modified; qualified-pass `plasmodesmata` and `photorespiration` remain unchanged.

- **plantConnections-01 — fixed.** SUC2 now has alternating-side peptide loops and a cytoplasmic linker whose actual endpoints follow the tilting domains. The pump retains its ten helices and detailed N/P/A domains, while unsupported peptide connections are removed. Bilingual text identifies this conservative domain schematic. The test checks real curve endpoints, backbone degree and rendered linker continuity across both conditions, rather than trusting metadata.
- **plantConnections-02 — fixed.** One actual proton mesh is pumped out by one displayed ATP hydrolysis and then returns through SUC2 with sucrose. The gradient is a qualitative field rather than nine countable transported particles. Tests count actual proton/phosphate meshes and check both energized and depleted geometry.
- **plantConnections-03 — fixed.** C4 carbon-transfer paths align with the pore before entering its axial span and remain aligned until every particle clears it. A 10001-frame geometry sweep checks sphere radii against both the pore boundary and central desmotubule: **984 outbound / 839 return checked samples pass**.

Validation passed:

- `node src/processes/modules/plantConnections/science.test.mjs`
- `node src/processes/modules/plantConnections/smoke.mjs` — four models, both controls, finite buffers/bounds, deterministic seeks, stable node/resource inventories and per-module esbuild.
- Prettier on the three owned changed source/test files.

Primary AHA2 source added to the transport process: [Pedersen et al. 2007](https://www.esalq.usp.br/lepse/imgs/conteudo_thumb/Crystal-structure-of-the-plasma-membrane-proton-pump-1.pdf). Existing SUC1 structural evidence remains; SUC2 motion is an educational domain model, not an atomic reconstruction. No unresolved audited issue remains locally. Root screenshot review is still required; the tests do not establish every biological fact or visual acceptance.


## 独立复核追加：plantConnections-03 孔口环

peer R1 确认原第一次修复漏查了孔口 Torus：R=0.19/tube=0.012 的净半径 0.178 小于完整碳球的径向外缘 0.1975。现将内/外圈中心半径改为 0.212/0.242，内圈净孔正好与圆柱通道 0.2 一致；保留碳球 r=0.085、碳骨架间距和连接段，双语说明这是放大的教学比例。

扩充科学回归：10001 帧，所有四个球对所有八个实际 Torus，4000 近轴组合同时通过解析 solid-torus 与实际索引三角面距离；最小净余量 0.002231372731273301。1700 个可见连接段/孔口组合按包围完整圆柱的 capsule 验证，先断言与通道平行，再精确求轴向最小距离，保持在细胞质套管内。旧 R=0.19 解析负对照仍检出 594 个相交样本，p=0.3638 的旧索引 TorusGeometry 三角面负对照重现超过 0.019 的穿入。此追加修复闭环归入原 plantConnections-03，未新建或重复原 issueId。
