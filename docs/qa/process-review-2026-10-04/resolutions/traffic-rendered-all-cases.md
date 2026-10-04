# Traffic and original photosynthesis: final case gallery review

Date: 2026-10-04. Reviewer: traffic model owner. This is a read-only review of the root agent's saved browser evidence; no browser session was opened and no product files or true subject anchors were changed.

Result: all 3 matching cases and all 22 saved stage images were visually reviewed through their complete stage sheets. Seven critical 960 × 640 originals were additionally inspected at original resolution. No new confirmed model issue was found in this evidence. The observed states support the existing repairs, within the temporal and camera limits below.

## Exact coverage

The source is [conditions-final-gallery-index.json](../evidence/browser/conditions-final-gallery-index.json). Filtering for `endocytosis`, `autophagy`, and the original `photosynthesis` yields exactly the following 3 cases. Each has `parameters: {}`; this gallery contains no additional parameter case or root for these IDs. This review does not imply that the other 150 gallery cases were inspected here.

| Model / root | Case key | Saved progress values | Images reviewed |
| --- | --- | --- | --- |
| Endocytosis / cell | `conditions-final-a-129-endocytosis-cell` | 0, 0.155, 0.355, 0.485, 0.685, 0.815, 1 | 7 / 7 |
| Autophagy / cell | `conditions-final-a-130-autophagy-cell` | 0, 0.175, 0.455, 0.555, 0.665, 0.745, 0.915, 1 | 8 / 8 |
| Original photosynthesis / plant | `conditions-final-a-003-photosynthesis-plant` | 0, 0.155, 0.335, 0.515, 0.675, 0.895, 1 | 7 / 7 |

All three metadata records identify `kind: irregular-seeks`, language `en`, speed `1.5`, annotations enabled, and `monotonicLive: false`. Endocytosis and photosynthesis each record 18 seeks; autophagy records 20. In each case every recorded actual seek equals its expected value, `errors` is empty, `terminal` is 1, and `result` is `complete`. These are evidence of successful sampled seeking and capture, not a full uninterrupted playback or performance benchmark.

## Endocytosis

Reviewed [all-stage sheet](../evidence/browser/sheets/conditions-final-a-129-endocytosis-cell.jpg) and [capture metadata](../evidence/browser/conditions-final-a-129-endocytosis-cell.json).

| Saved states | Visible observations |
| --- | --- |
| 0 → 0.155 | Extracellular LDL is above the plasma membrane initially, then associates with the developing pit. Clathrin appears on the cytosolic side. Early-endosome and cytosol labels refer to their compartments. |
| 0.355 | The invaginated membrane remains connected to the donor membrane through a narrow neck. The purple dynamin collar surrounds that neck externally; it is not sitting deep inside the pit. Its leader terminates on the visible collar. |
| 0.485 | The coated vesicle is separate from the restored donor membrane. The dynamin and extracellular-LDL labels have disappeared; the clathrin label follows the remaining coat. |
| 0.685 | The now uncoated cargo vesicle approaches the early endosome; no obsolete coat label remains. |
| 0.815 → 1 | The joined endosomal shape and recycling extension are visible. LDL remains in the compartment, receptor structures occupy the recycling domain, and compartment/recycling labels follow the current geometry. |

Original-resolution checks: [neck and dynamin at 0.355](../evidence/browser/conditions-final-a-129-endocytosis-cell-stage-3.webp), [post-scission coat at 0.485](../evidence/browser/conditions-final-a-129-endocytosis-cell-stage-4.webp).

This supports the sampled rendered states of `20261004-traffic-01` and `20261004-traffic-labels-01`. These two selected frames do not establish smooth contraction throughout 0.39–0.43; the continuous geometry regression remains the separate evidence for that interval.

## Autophagy

Reviewed [all-stage sheet](../evidence/browser/sheets/conditions-final-a-130-autophagy-cell.jpg) and [capture metadata](../evidence/browser/conditions-final-a-130-autophagy-cell.json).

| Saved states | Visible observations |
| --- | --- |
| 0 → 0.175 | The damaged protein, expanding open phagophore, and separate lysosome are distinguishable. The cathepsin label identifies a visible lumenal protease cluster. |
| 0.455 → 0.555 | The cargo is enclosed by the autophagosomal membranes while the lysosome remains separate. The paired membrane cut edges remain visible. |
| 0.665 | The outer membranes form a connected envelope; the inner membrane still encloses the cargo. Proteases remain on the lysosomal side of the visible inner membrane. Surface glycans and the pump remain associated with the envelope in this sampled state. |
| 0.745 | The connected envelope remains intact while the inner cargo membrane opens/removes progressively. The protein and protease labels still refer to visible subjects. |
| 0.915 | Proteases have reached the cargo as digestion proceeds. The cargo label remains attached to the still-visible protein. |
| 1 | The large cargo aggregate and its label have disappeared. Visible proteases and fragments remain within the rounded autolysosome; their appropriate labels remain. |

Original-resolution checks: [initial fusion at 0.665](../evidence/browser/conditions-final-a-130-autophagy-cell-stage-5.webp), [inner-membrane opening at 0.745](../evidence/browser/conditions-final-a-130-autophagy-cell-stage-6.webp), [terminal digestion state](../evidence/browser/conditions-final-a-130-autophagy-cell-end.webp).

This supports the sampled rendered states of `20261004-traffic-02` and `20261004-traffic-labels-02`. Sparse captures cannot independently exclude an instantaneous membrane-anchor jump at 0.65; the epsilon-step anchor regression is the separate evidence for that transition.

## Original photosynthesis

Reviewed [all-stage sheet](../evidence/browser/sheets/conditions-final-a-003-photosynthesis-plant.jpg) and [capture metadata](../evidence/browser/conditions-final-a-003-photosynthesis-plant.json).

| Saved states | Visible observations |
| --- | --- |
| 0 | The chloroplast boundary, two thylakoid stacks, bridging lamellae, membrane-associated photosystems/ATP synthase, and stromal Calvin-cycle enzymes are present. No detached gross membrane or protein placement was observed. |
| 0.155 → 0.335 | Light pulses and then the water/oxygen explanatory flow appear around the thylakoid complex. ATP-synthase and photosystem leaders terminate on the corresponding visible structures. |
| 0.515 | The ATP/NADPH explanatory route becomes visible toward the stromal reaction region. The protein and membrane layout remains stable. |
| 0.675 | CO₂ input and the Calvin-cycle reaction region are visible alongside the light-reaction product route. |
| 0.895 → 1 | Calvin-cycle flow, returning cofactors, and sugar-precursor output are visible together. The sampled structures remain intact; protein, compartment, and relationship-route labels retain appropriate subjects. |

Original-resolution checks: [light-reaction state at 0.335](../evidence/browser/conditions-final-a-003-photosynthesis-plant-stage-3.webp), [combined route state at 0.895](../evidence/browser/conditions-final-a-003-photosynthesis-plant-stage-6.webp).

The sampled views are consistent with repairs `20261004-original-03`, `20261004-original-04`, `20261004-original-06`, and `20261004-original-photosynthesis-labels-01`. This overview camera cannot independently verify every hidden lamellar lumen, weld coordinate, OEC vertex, or ATP-rotor clearance. Those claims rely on the separately retained actual-triangle/bilayer regression. Static views also cannot prove that all open-route pulses fade at every temporal wrap.

## Remaining evidence boundaries

- The shared label-layer issue in which a later leader can cross an earlier label box is owned by the root's common rendering fix. It is not re-registered as a model issue here, and no true anchor was moved to compensate for it. This report does not certify the subsequent shared drawing-order fix from these earlier captures.
- These are English, fixed-camera, desktop-resolution saved images plus irregular-seek metadata. They do not independently cover Chinese labels, mobile layout, arbitrary camera angles, uninterrupted native playback, sustained frame rate, or deployment.
- Existing source/geometry resolutions remain [traffic.md](traffic.md) and [original-photosynthesis.md](original-photosynthesis.md). This document adds the rendered observations above; it does not broaden those tests into scientific or release claims beyond their stated checks.

No new issue ID was created by this review. No product changes were made.
