# Membrane final rendered review — staged receipt

## Full-b2 Chinese default: bacterial cell wall

Read-only review of **all 7 original 960×640 frames** for `full-b2-003-bacterialCellWall-bacterium`, indexed in `evidence/browser/gallery-index.json`. These are the post-07–11-repair Chinese default/no-antibiotic frames. No browser or product editing was performed. All eight entries in the owned source/test freeze hash receipt still match.

**Issue 10 passes within this captured default branch:** RodA points into a protein helix; the PBP2 callout follows its moving cleft; the substrate/tetrasaccharide callout follows the actual NAM ring. The new-crosslink callout is absent before the first reaction and appears afterward at the first new link, instead of pointing at an old unlinked stem. All Chinese text boxes in these seven captures are readable; no local anchor adjustment is warranted to address shared label layout.

**Issue 11 has visible confirmation of the first repaired branch, with an explicit visibility limit on the second:** the first receiving mDAP junction now has a distinct sideward terminal D-Ala arm, while the new donor link follows the main crosslink corridor. Released donor D-Ala is separate. The second receiving stem also has the sideward terminal D-Ala arm, but its new bond lies behind/in the PBP2 head in the .915 and final frames. Those images cannot independently demonstrate the complete second bond as an unobstructed line. This is a protein-occlusion limit, not a detached endpoint or a reason to move correct label anchors. The existing actual-geometry regression independently checks both crosslinks and all nonendpoint residues.

| Original frame | Progress | Directly visible evidence |
| --- | ---: | --- |
| [Start](../evidence/browser/full-b2-003-bacterialCellWall-bacterium-start.webp) | 0 | Two separated lipid-II substrates; no new-crosslink annotation. RodA, PBP2 and substrate callouts end at their respective structures. |
| [Stage 2](../evidence/browser/full-b2-003-bacterialCellWall-bacterium-stage-2.webp) | .185 | Second substrate approaches RodA and its callout follows it leftward. No premature new-crosslink label. |
| [Stage 3](../evidence/browser/full-b2-003-bacterialCellWall-bacterium-stage-3.webp) | .365 | Four-sugar chain is joined at RodA; one NAM-linked carrier is retained and the other is separate. The tetrasaccharide callout follows the new chain. |
| [Stage 4](../evidence/browser/full-b2-003-bacterialCellWall-bacterium-stage-4.webp) | .655 | Chain has moved to the PBP2 region; PBP2 is at the first donor. The substrate leader follows the moved NAM. No new-crosslink callout before the .69 reaction. |
| [Stage 5](../evidence/browser/full-b2-003-bacterialCellWall-bacterium-stage-5.webp) | .785 | First new crosslink and its label are visible; its receiving terminal D-Ala extends sideways instead of sitting on the link. First released D-Ala is separate. PBP2 has advanced toward the second donor. |
| [Stage 6](../evidence/browser/full-b2-003-bacterialCellWall-bacterium-stage-6.webp) | .915 | Both released terminal D-Ala beads are separate. First new branch remains distinguishable. The second receiving side arm is visible, but PBP2 covers part of the second new-link corridor. |
| [End](../evidence/browser/full-b2-003-bacterialCellWall-bacterium-end.webp) | 1 | First completed branch remains distinct; chain retains its lipid anchor. PBP2 has returned toward its resting position but still partly obscures the second bond. Product-label anchor remains on the first real link. |

The seven captures bracket the two .69/.82 reactions; they are not direct captures at those exact boundaries and do not establish continuous playback. Exact event timing, retained peptide identities/endpoints, the inhibited branch, and collision clearance are covered separately by the unchanged science regression plus the new focused tests. In [the before/after measurement receipt](../evidence/membrane/rendered-repair-measurements.json), both branches over 414 states improve the minimum crosslink-to-nonendpoint-sphere clearance from −.119 to +.071, and unrelated D-Ala sphere clearance from −.028 to +.060891. These measurements are not presented as proof of unobstructed rendered visibility.

## Remaining rendered acceptance

- A readable view of the entire second completed crosslink is still desirable for independent visual confirmation; a supplied alternate angle/close-up or later capture can close that narrow visibility boundary. No new scientific/topology defect is inferred from the occlusion alone.
- The β-lactam branch has not been supplied in this batch; issue 10's occupied-site callout timing and issue 06's ring-opening/acyl bond still require their final condition images.
- Final diffusion, pump and osmosis images, all registered roots/parameter combinations, and final shared-layout captures remain pending the integrator's next batch. This report does not close issues 07–09's final rendering gate.
- Continuous playback, bilingual final layout and whole-project acceptance remain with the integrator. The product and all correct geometry anchors remain unchanged by this review.
