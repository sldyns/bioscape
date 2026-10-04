# Plant water — rendered repair discoveries

New findings from the root-supplied native 960×640 images. Original Phase A remains unchanged. Plasmolysis has no additional confirmed rendered defect: its lumen and bath/gap region anchors are appropriate to their wording.

## 20261004-plantWater-05 · stomata · P2

At native 960×640, the thick pore-facing wall leader ends in empty space outside the guard cell; guard-cell-pair leader ends near a peripheral epidermal wall. K+/counter-anions persists at start/end with no ion tracers and points at epidermal context. Water/turgor label points at empty peripheral space, rather than the vacuolar water/turgor compartment.

stomataProcess.js labels use static former text offsets [1.35,-2.15,0.6], [-1.8,2.55,0.6], [-3.05,0.2,0.7], [2.8,1.15,0.6]; only light/ABA have visibility gates.

Repair: Bind object labels to current guard-cell/wall/vacuole mesh vertices; identify ion annotation as a membrane flux region and activate only when that flux is shown; bind signal labels to their visible icons.

Evidence: `../browser/full-a-stable-031-stomata-plant-stage-4.webp`, `../browser/full-a-stable-031-stomata-plant-start.webp`, `../browser/full-a-stable-031-stomata-plant-end.webp`

## 20261004-plantWater-06 · plantLongDistanceTransport · P2

Continuous-liquid leader ends left of the vessel; wet-wall leader ends above a cell instead of at the newly attached wet film; stomatal outlet leader ends well below the aperture. The root-uptake region leader points at soil grains below the root.

plantLongDistanceTransportProcess.js labels retain [-1.6,-0.2,0.7], [0.45,3.9,0.6], [3.6,1.25,0.6], [-3.5,-3.34,0.6] rather than current surfaces/pore.

Repair: Anchor liquid to its actual column surface, wet-wall annotation to film geometry, root-region annotation within the root-tissue face and outlet-region annotation to the midpoint between actual guard cells. Keep air-space explicitly a region.

Evidence: `../browser/full-a-stable-032-plantLongDistanceTransport-plant-stage-4.webp`

## 20261004-plantWater-07 · chloroplastMovement · P2

At accumulation, the cortical-chloroplast leader remains at the empty left cortical wall while every plastid is on the lower periclinal surface. The periclinal leader ends below/outside the floor; light leader ends left of the arrow; anticlinal leader ends outside the wall.

chloroplastMovementProcess.js all labels are fixed, including plastid [-2.55,-1.8,1.6], floor [-0.7,-2.9,1.65], arrow [-2.7,2.85,0] and sidewall [2.8,0.8,0.4].

Repair: Bind representative-plastid anchor to an actual granum surface through the plastid whole-object transform; anchor light to a persistent arrow and orientation regions to actual wall/floor planes; bind vacuole to its surface.

Evidence: `../browser/full-a-stable-033-chloroplastMovement-plant-stage-3.webp`, `../browser/full-a-stable-033-chloroplastMovement-plant-stage-5.webp`
