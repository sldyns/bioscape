# Energy rendered stage review · 2026-10-04

Scope: four processes, first registered root, default condition, 30 stage frames from `evidence/browser/gallery-index.json`. All four sheets were inspected; four original 960×640 frames were additionally inspected at original resolution. This is a static-stage review. Root separately performed native full playback; this reviewer did not operate a browser or personally claim a continuous-playback inspection.

## Findings

**20261004-energy-07 · P2 · confirmed and corrected in code.** Specific protein/carrier/substrate labels used legacy text-offset coordinates as leader endpoints. The rendered relationship was misleading even though the mechanism geometry was correctly placed.

### respiration

Root `cell`, default condition. 7 frames; sheet `full-a-retry-018-respiration-cell.jpg`.

- `Q` at p=0.685: old endpoint [-0.95, 0.31, 0.7] versus Q center [-1.5660064421486795, 0, 0.55]; separation 0.7057 scene units.
- `Cytochrome c` at p=0.685: old endpoint [0.65, 1.13, 0] versus cytochrome c center [0.33044640398857406, 0.85, 0]; separation 0.4249 scene units.
- `F₁ · ADP + Pi → ATP` at p=0.685: old endpoint [3.15, -2.15, 0.3] versus F1 catalytic-head center center [3.15, -1.48, 0]; separation 0.7341 scene units.
- `IV · O₂ → H₂O` at p=0.685: old endpoint [1.5, -0.82, 0.4] versus IV transmembrane domain center [1.35, 0, 0]; separation 0.9246 scene units.

The sampled pump/return markers align with the membrane protein region and maintain IMS-above/matrix-below placement. Q remains membrane-bound and cytochrome c in the IMS. F1 remains matrix-facing. All scene geometry fits inside the sampled frame. The original F1, III/IV and moving-carrier leaders visibly ended away from their objects.

Inspected stage progresses: 0.000, 0.175, 0.345, 0.515, 0.685, 0.875, 1.000.

### glycolysis

Root `cell`, default condition. 8 frames; sheet `full-a-retry-019-glycolysis-cell.jpg`.

- `1,3-BPG → 3-PG` at p=0.595: old endpoint [-1.65, 0.43000000000000005, 0] versus left carbon chain center [-1.65, -0.16999999999999993, 0]; separation 0.6000 scene units.
- `1,3-BPG → 3-PG` at p=0.595: old endpoint [1.65, 0.43000000000000005, 0] versus right carbon chain center [1.65, -0.16999999999999993, 0]; separation 0.6000 scene units.

Six carbons remain visible and divide into two three-carbon products. Phosphate transfer and product descent retain their intended order. Geometry is not cropped. The carbon labels are specifically 0.6 units above the chains; initial glucose, nucleotide and reaction-station leaders also use former text offsets.

Inspected stage progresses: 0.000, 0.095, 0.285, 0.455, 0.595, 0.795, 0.945, 1.000.

### bacterialEnergetics

Root `bacterium`, default condition. 7 frames; sheet `full-a-retry-020-bacterialEnergetics-bacterium.jpg`.

- `Q / QH₂` at p=0.675: old endpoint [-1, 0.35, 0.55] versus Q/QH2 center [-0.1312986416294626, -0.0012929499970306534, 0.48]; separation 0.9397 scene units.
- `bo₃ · proton pump and O₂ reduction` at p=0.675: old endpoint [0.65, -0.9, 0.3] versus bo3 membrane domain center [0.52, -0.0316875, 0]; separation 0.9278 scene units.

The curved membrane, cytoplasm-facing F1, membrane Q and periplasmic reservoir remain legible. Default NDH-I/bo3 geometry is present and fits the frame. Original Q/oxidase and ion-reaction endpoints sit in open space. No new wrong-compartment motion is established by these frames.

Inspected stage progresses: 0.000, 0.175, 0.345, 0.515, 0.675, 0.875, 1.000.

### bacterialPhotosynthesis

Root `bacterium`, default condition. 8 frames; sheet `full-a-retry-021-bacterialPhotosynthesis-bacterium.jpg`.

- `PQ` at p=0.755: old endpoint [-1.86, 0.58, 0.6] versus PQ center [-0.9513319583109163, 0.4, 0.5]; separation 0.9317 scene units.
- `PC / cytochrome c₆` at p=0.755: old endpoint [0.04, -0.23, 0.65] versus PC/c6 center [0.8986680416890835, -0.2, 0.3]; separation 0.9277 scene units.
- `Fd / FNR → NADPH` at p=0.755: old endpoint [2.06, 1.72, 0.25] versus FNR protein center center [2, 1.1, 0]; separation 0.6712 scene units.

PBS and F1 face cytoplasm; PSII donor side, PC/c6 and accumulating protons remain lumenal. PQ stays in the upper membrane. Protein/ion geometry is not cropped. The original Fd/FNR leader is particularly misleading because its endpoint is nearer the ATP-synthase head than the actual FNR sphere.

Inspected stage progresses: 0.000, 0.135, 0.275, 0.435, 0.605, 0.755, 0.915, 1.000.

## Repair and regression

Object labels now end on an actual transformed mesh vertex/surface point. Carrier and metabolite labels follow their moving geometry; NDH and oxidase callouts follow selected visible branches. Membrane labels bind actual instanced lipid geometry. Regional compartment and bookkeeping descriptions retain area positions. Bacterial ion annotations name reaction sites; cyanobacterial ATP production is explicitly an F1 label.

`src/processes/modules/energy/labels.test.mjs` passes 1760 endpoint checks across 15 root/condition contexts, checks a moved protein transform, and rejects old offset coordinates. Existing transport clearance/continuity, scientific geometry, finite/stable inventory and arbitrary-seeking tests all pass in [label-science.log](../evidence/energy/label-science.log).

## Evidence boundary

The four original full-resolution frames reviewed were respiration stage-5 (p=0.685), glycolysis stage-5 (p=0.595), bacterialEnergetics stage-5 (p=0.675), and bacterialPhotosynthesis stage-6 (p=0.755). Original image pixels were preserved.

Corrected screenshots have not yet been reviewed. First-root English default-condition sheets do not constitute rendered acceptance for the other roots/conditions or Chinese annotations. Labels do not obscure enough geometry in these original frames to establish a separate clipping defect; new label routing still needs root recapture review. No new scientific-topology finding beyond the already repaired transport paths was established by this static pass.
