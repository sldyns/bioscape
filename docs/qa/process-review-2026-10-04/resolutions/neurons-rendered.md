# Neurons stored-frame review · 2026-10-04

Reviewed all four root-supplied seven-panel sheets (28 stored frames) using the image viewer, plus one original 960×640 image per process. No browser was operated. The native full-playback run is root evidence; this reviewer did not independently watch a complete video. Manual coverage is **cell/default on** for actionPotential, **cell/calcium available** for synapse, **cell/calcium released** for muscle, and **paramecium/ATP available** for ciliaryMotion, with English labels. Alternate roots/conditions are covered by code/numeric checks only.

Index: `../evidence/browser/gallery-index.json`. Original images were viewed at their available resolution and left unchanged.

## actionPotential

Sheet: `../evidence/browser/sheets/full-a-retry-026-actionPotential-cell.jpg`. Frames p=0, .135, .255, .435, .655, .915, 1. Original inspected: `../evidence/browser/full-a-retry-026-actionPotential-cell-stage-3.webp`.

Both the enlarged membrane and axon overview fit inside the frame; pore collars, bilayer and traveling arrow are visible. No whole-model crop is evident. The selected magnification is stable. These samples do not capture the enlarged region’s brief peak sodium/potassium windows (.48/.55), so they do not independently verify those enlarged open states.

Confirmed rendered failures: Na/K leader targets float above their actual collars (issue 04), and the inner color-state bands are culled (issue 05). The latter is confirmed by default-camera FrontSide versus DoubleSide ray evidence, not merely inferred from the pale screenshot. Repairs now target real collars/regions and expose the existing band interiors. All palette, geometry and channel timings are preserved. **New frames required to review the changed labels and restored state colors.**

## synapse

Sheet: `../evidence/browser/sheets/full-a-retry-027-synapse-cell.jpg`. Frames p=0, .155, .275, .395, .575, .795, 1. Original inspected: `../evidence/browser/full-a-retry-027-synapse-cell-stage-4.webp`.

Presynaptic terminal, vesicle lumen, AMPA complexes, postsynaptic region and lateral EAAT/astrocyte all fit. Calcium at .275 and released glutamate at .575 are visible. The repaired docked/fused shell cutaways face the camera in both sampled states; the former 90-degree azimuth discrepancy is not apparent in these images. The .275→.395 gap does not establish continuous interpolation at the fusion instant; closed/open topology remains a deliberate schematic switch.

Ca, AMPA and EAAT leaders visibly ended off their complexes; the EAAT leader was below the membrane. Issue 04 now anchors these to existing pore/cleft/uptake geometry, and the vesicle label follows the actually visible shell rim. **Label layout after repair remains for root re-render.**

## muscle

Sheet: `../evidence/browser/sheets/full-a-retry-028-muscle-cell.jpg`. Frames p=0, .165, .325, .445, .665, .865, 1. Original inspected: `../evidence/browser/full-a-retry-028-muscle-cell-stage-5.webp`.

Both Z discs, all displayed thin/thick filaments, the SR store and heads fit inside the frame. The .325 state shows heads approaching/attached, .665 shows ATP-associated withdrawal, and the final image retains a shortened sarcomere relative to the start. Fixed filament shapes are visually recognizable. Sparse stills cannot verify the absence of the former instantaneous head snap; the world-lobe boundary test supplies that separate numeric evidence.

Z-disc and actin leaders ended below their actual structures, and the SR leader was above the store. The Ca-transfer label also persisted without visible calcium. Issue 04 now tracks actual disc faces, moving actin/calcium/nucleotide objects; inactive transfer labels are hidden, late calcium text says it leaves troponin, and the low-Ca overlap text no longer implies shortening. **Revised label placement still needs rendering.**

## ciliaryMotion

Sheet: `../evidence/browser/sheets/full-a-retry-029-ciliaryMotion-paramecium.jpg`. Frames p=0, .185, .355, .525, .715, .905, 1. Original inspected: `../evidence/browser/full-a-retry-029-ciliaryMotion-paramecium-stage-3.webp`.

Longitudinal cilium, basal support and enlarged transverse 9+2 structure fit at each supplied bending phase. No whole-model crop is evident, including the final leftward bend. Two central singlets and nine outer doublets remain visually distinct in the enlarged section. Dynein/collar detail is retained, but exact stalk-to-tubulin contact is too small to certify from these stills; the triangle-contact and no-A-wall-crossing tests remain the evidence for issue 01.

The motion leader did not follow the bending cilium; transverse labels targeted background. Issue 04 now tracks an actual moving motor, membrane vertex and transverse subunit, while the motion label hides under arrest. **Updated leader positions and inactive rendering remain for root review.**

## Validation and freeze boundary

- Preserved all original scientific regressions and all three initial repairs.
- Final owned test run passes 798 actual longitudinal attachment checks, transverse attachment checks, muscle continuity, fusion cutaway orientation, all four models’ label geometry/visibility checks, and 48 AP band/control/state camera-ray checks.
- Fourteen root/condition cases, 868 samples and 98 repeated seeks pass finite buffers, stable resources and deterministic label state in `../evidence/neurons/label-coverage.json`.
- Every owned file is formatted; owned `git diff --check` passes. No shared renderer, browser, full suite or publication action was performed.
- New integration issues 04 and 05 are recorded independently in `../evidence/neurons/repair-discoveries.json`/`.md`, and each is accounted for once in `neurons.json`. Original Phase A evidence is unchanged.

**Code frozen for root re-render.** This report does not claim manual full-video acceptance or manual coverage of all organism/condition combinations.
