# Signals · additional repair discovery

**20261004-signals-04 (P2), fixed:** leader endpoints were legacy text positions and did not follow the structures they named. This is separate from the immutable Phase A issue set.

Baseline reproduction in [phase-b-label-before.json](phase-b-label-before.json): ERK endpoint at p=.85 was 0.677 scene units from the protein origin; mitochondrial endpoint had local y=1.101 while the outer membrane y-radius was 0.57; impaired GATA1 was hidden while its label remained active; the ER-lumen endpoint scored 3.169 in the ellipse equation (inside requires ≤1).

The four models now attach named structures to actual mesh interiors under their current parent transforms. Cell/compartment labels point inside their regions; the constriction callout follows the membrane field. Visibility follows the GATA1, hemoglobin, BAX and nuclear targets. Shared annotation infrastructure was not edited.

[650 active endpoint checks](phase-b-labels.log) cover all nine conditions and reverse seeks, require visible target ancestry, and test named anchors inside their actual mesh using BVH ray parity. ER and constriction anchors have compartment/field checks. Full original science/smoke still pass. Root's rendered label placement and occlusion review remains separate.

## 20261004-signals-05 · premature product identities, fixed and freshly verified

The full-b3 rendered review confirmed that apoptosis at p=.825 labeled mother-cell chromatin as completed membrane-enclosed apoptotic bodies; actual triangles have one connected membrane and the target is at normalized mother-ellipse radius 0.570. At .445, the Apaf-1 callout likewise used the assembled-complex name while arms were dispersed.

The same targets now have event-appropriate bilingual names: condensed chromatin, membrane blebbing/body formation, then completed separated bodies; Apaf-1 monomers, assembly, then assembled apoptosome. At .94 the actual membrane has six disconnected components and the completed-body count is five. No anchor, geometry or motion change was used to hide the error.

`labelEvents.test.mjs` first failed with the old body label and again with the old Apaf identity, then passed after repair. Its actual-triangle topology, arm-configuration, bilingual, inactive-control and reverse-seek checks are imported by science. Old failure logs, before/after diagnostics and new passing logs remain in this directory. The original full-b3 images predate this correction and remain discovery evidence. Fresh final-f English originals now verify .36/.445/.46/.605/.825/.89/.94/1; fresh Chinese full-final originals verify .445/.825/1. Both noStress sets remain inactive. See [fresh closure](../../resolutions/signals-rendered-all-cases.md).

## 20261004-signals-06 · cytosolic Apaf-1 crossing compartment boundaries

Final English original .445 revealed a free Apaf-1 arm penetrating the intact nucleus. Actual nuclear BVH checks confirmed 6/5/3 intersecting meshes at .36/.445/.46. Correct wall-only mitochondrial checks confirmed 14/11/7 intersecting pairs. The old stationary terminal complex center also left 1,078 surface vertices outside the contracting cell field.

The complete original proteins now approach the unchanged seven-arm assembly endpoint from a .4-radius cytosolic pocket (previously .72); late remnant contraction also carries the complex inward. All geometry/precision and actual label targets remain. The new imported `apoptosomeCytosol.test.mjs` fails against the old path and passes 38 visible poses / 893,397 vertices, actual nucleus/mitochondrial-instance/plasma triangles, both conditions and backward seeks. Negative controls reproduce the original nuclear and late-cell failures. All three critical surface-gap receipts are in [apaf-cytosol-after.json](apaf-cytosol-after.json).

Early exploratory instance-head counts were incorrect and are superseded; final mitochondrial testing uses every actual instance matrix. See [all-case report](../../resolutions/signals-rendered-all-cases.md) for the exact correction and verification boundary. The original 016 gallery predates 06 and remains discovery evidence. Fresh frozen-model review now passes 4 apoptosis sheets / 36 images / 13 original 960 images, including all three critical early states and the contracting endpoint. Both Chinese parent-operated native replay records finish at 1, progress monotonically and record no errors. NoStress images are byte-identical within each language batch. The owner inspected images/metadata; root operated playback. The seven non-apoptosis cases retain their earlier sampled acceptance without further changes. [Compact fresh receipt](final-f-rendered-review.json).
