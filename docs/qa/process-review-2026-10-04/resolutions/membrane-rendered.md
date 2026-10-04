# Membrane default-stage rendered review

Reviewed the four gallery sheets and five key originals at their supplied 960×640 resolution. Scope: diffusion/cell, activeTransport/cell, osmoticBalance/cell, bacterialCellWall/bacterium, **default conditions only**, 26 captured states. Other roots/conditions and Chinese layout remain for root's later review. I did not operate a browser.

The corrected protein details, pump ion/phosphate states, red-cell contour/cortex deformation and PBP2 movement are visible. The images alone do not prove continuity through the .29 phosphate handoff or water reset seams; focused numeric regressions cover those points and root supplied native playback evidence separately.

Acceptance is held for **four object-callout problems (07–10, P2)** and **one additional peptide-branch geometry defect (11, P1)**. Full immutable discovery record: [repair-discoveries.json](../evidence/membrane/repair-discoveries.json).

| Model | Opened key original | Confirmed finding |
| --- | --- | --- |
| diffusion | [stage 3, p=.395](../evidence/browser/full-a-retry-022-diffusion-cell-stage-3.webp) | Aquaporin leader ends on right-side lipid-head area. Polar-head/tail and compartment region labels remain interpretable. |
| activeTransport | [stage 3, p=.395](../evidence/browser/full-a-retry-023-activeTransport-cell-stage-3.webp) | ATP/ADP and protein-domain/phosphate leaders use layout offsets; the conformation leader points into the bilayer. Extracellular/cytoplasmic labels are region annotations and were not treated as missing atom anchors. |
| osmoticBalance | [stage 5, p=.875](../evidence/browser/full-a-retry-024-osmoticBalance-cell-stage-5.webp) | Cortex leader ends beyond the cell silhouette instead of inside the visible window. Bath/tonicity labels are region/status statements. Cell and arrow callouts should attach to their visible objects. |
| bacterialCellWall | [stage 5, p=.785](../evidence/browser/full-a-retry-025-bacterialCellWall-bacterium-stage-5.webp), [end](../evidence/browser/full-a-retry-025-bacterialCellWall-bacterium-end.webp) | RodA/PBP2/substrate/new-link leaders miss objects; new-link label is premature and points to an old unlinked stem. New links actually intersect acceptor D-Ala4 and merge the peptide branch into a false linear run. |

The last defect is geometric: the crosslink at x=0 or 1.36 connects y=1.94→2.23, while unrelated acceptor D-Ala4 lies at y=2.04 at the same x/z. Actual axis-to-center distance is <6×10⁻¹⁶; donor/acceptor D-Ala4 centers are .10 apart with radii .064 each. This was not caught by the earlier endpoint-only test. See [numeric evidence](../evidence/membrane/rendered-review-diagnostics.json).

Root subsequently authorized fixes 07–11. This document records the read-only discovery state; correction receipts will be appended without replacing the above evidence.


## Correction receipt appended after root authorization

Findings 07–11 are now repaired in the owned modules and resolved once each in [membrane.json](./membrane.json). The four object-callout families now use actual transformed/deformed geometry and correct existence timing. The peptide-branch fix retains all residue and bond identities while separating unrelated terminal D-Ala and leaving D-Ala from the crosslink corridor.

The current focused suite passes 10/10; the five follow-up cases fail 5/5 against the archived pre-fix modules. Actual minimum bond-to-nonendpoint-sphere clearance changes from −.119 to +.071, and unrelated D-Ala sphere clearance from −.028 to +.060891 over 414 states. Unchanged old science and refinement tests pass. Full receipts and the explicit remaining root-rendering boundary are in [membrane.md](./membrane.md#rendered-follow-up-repairs-07–11). The old images above remain the discovery evidence and do not claim post-repair visual acceptance.
