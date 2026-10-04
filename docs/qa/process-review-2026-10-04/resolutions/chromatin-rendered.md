# Chromatin integrated render review — 2026-10-04

Read-only review of four sheets from `evidence/browser/gallery-index.json`: **28 exported stage/end stills** from the root's native-player, English, default-condition, 1.5× playback run. Seven relevant 960×640 original images were also inspected at original resolution. No browser was operated and no product files were changed.

This review assesses the exported images. It does not independently measure frame cadence or prove that every intermediate playback frame is smooth. Other conditions, plant/yeast chromatinAccess roots and Chinese UI remain outside this image batch.

| Model | Image coverage | Result in this batch |
| --- | --- | --- |
| chromatinAccess | cell; active hydrolysis; p=0, .185, .355, .655, .855, 1 | Mechanism visible without clipping; misleading label association needs follow-up |
| tad | cell; convergent boundaries; p=0, .175, .375, .635, .795, .945, 1 | Loop/extrusion outcome readable; CTCF leaders visually target locus markers and need follow-up |
| plantGenome | plant; intact targeting; p=0, .135, .355, .585, .785, .925, 1 | Compartment/import outcome readable, no clipping; ribosome-label association is imprecise |
| plantRdDM | plant; active DRM2; p=0, .175, .345, .475, .625, .835, .965, 1 | Coupled producer and delivered RNA visible; DCL3/RDR2 labels need follow-up; exact upstream handoff is not captured by the stage stills |

## Observations requiring root review

### R-CH-01: label-to-object association can misidentify molecular roles (P2 concern)

These are observations of actual exported pixels, not conclusions inferred from label metadata:

- **chromatinAccess start:** the `ISWI-family remodeler` horizontal leader passes directly through the brown DNA-binding factor (approximately x374, y132), while the green remodeler is lower (around x410, y210). The DNA-binding-factor label is separately placed above. A reader following the ISWI leader can assign the wrong identity to the brown complex. [Original start image](../evidence/browser/full-a-retry-002-chromatinAccess-cell-start.webp).
- **tad p=.635 and terminal states:** `CTCF →` / `← CTCF` leaders visually meet the gold locus markers around x410/x548, y380. The actual green CTCF complexes sit at the loop mouth around y430. The gold markers also sit on the dashed contact relationship, so this can confuse the CTCF boundaries with the two chosen within-domain loci. [Original p=.635 image](../evidence/browser/full-a-retry-003-tad-cell-stage-4.webp).
- **plantRdDM:** the `DCL3 · cleavage` leader runs across the source DNA/Pol IV row near y138, whereas the grey DCL3 jaws are around x405, y225. `RDR2 · coupled to Pol IV` remains near y294 (early) or y326 (late), far below the actual coupled RDR2 at the source complex near y196. The latter anchor was not repositioned when the producer geometry was corrected. These do not hide the molecules, but they weaken the intended enzyme-to-RNA explanation. [Original p=.175](../evidence/browser/full-a-retry-005-plantRdDM-plant-stage-2.webp), [original p=.835](../evidence/browser/full-a-retry-005-plantRdDM-plant-stage-6.webp).
- **plantGenome, lower-priority ambiguity:** the plural `Cytosolic ribosomes` leader ends between the two ribosomes and passes through the nuclear vicinity; it does not reach either ribosome. Both cytosolic ribosomes are otherwise clearly outside the nucleus. [Original end image](../evidence/browser/full-a-retry-004-plantGenome-plant-end.webp).

Suggested review direction: attach leaders to the actual named structures, or use clearly detached area headings where a label intentionally names a compartment or several objects. Do not infer a new molecular geometry error from these annotation placements. Root was notified; no repair was attempted in this read-only round.

## Per-process observations and boundaries

**chromatinAccess.** The whole DNA span, intact histone core, green remodeler and brown factor remain in frame. The gold sequence moves from the wrapped region into the linker; the factor is visibly associated with that exposed region by the last frame. The nuclear/sliding wording is present. No new geometry defect is apparent in these images. The earlier sharp-contact frame-turn concern cannot be accepted or rejected from six stills; it still requires continuous rendered observation. Plant/yeast context variants and disabled hydrolysis were not pictured here.

**tad.** The initial small bend becomes a larger loop while arm lengths shorten; green CTCF and cohesin stay at the loop mouth in later frames. The scene has no membrane bubble, and `Mammalian interphase chromatin` plus the non-Hi-C qualification are visible. Dashed contact markers appear later and stay readable. The composition has substantial white space, but neither DNA endpoints nor the cohesin complex are clipped. The frame-turn limit and boundaryDeleted/cohesinDepleted branches remain separate checks. The visible issue in this batch is the CTCF annotation association above.

**plantGenome.** Nuclear, chloroplast and mitochondrial cutaways and all three DNA drawings remain visible and separated. Exported RNA appears in the nuclear/cytosolic sequence; nuclear-encoded precursor chains appear at cytosolic ribosomes, subsequently inside the appropriate organelles, then fold. Local organelle ribosomes/products remain inside. `Arabidopsis mesophyll` and stroma/matrix labels match the default model's stated scope. Envelope edges, translocase structures and final products are not cropped. No new compartment or cargo-identity defect is apparent. The targeting-removed control is not assessed by these images.

**plantRdDM.** At p=.175 the curved RNA is visibly connected to the adjacent source-side producer complex, rather than growing at a remote line. By p=.345 the duplex is at DCL3, then AGO4/guide transfer and target-side scaffold pairing are visible. Source/target DNA remain distinct; Arabidopsis nuclear/canonical wording is shown. All principal complexes fit inside the image. This supports the corrected production/delivery states, but **there is no exported still at p=.08/.14/.22/.31**, so the exact first-strand growth, 3′ handoff and release/unbending cannot be visually accepted from this sheet alone. Root can use those times or a short continuous clip for the repair-specific visual gate. The small new cytosine methyl marker is not independently easy to distinguish from the nearby recognition-pocket drawing at this camera distance; this is a visibility limit, not a claim that the verified methyl geometry is missing. The inactive DRM2 comparison remains unpictured.

## Reviewed artifacts

- [chromatinAccess sheet](../evidence/browser/sheets/full-a-retry-002-chromatinAccess-cell.jpg)
- [tad sheet](../evidence/browser/sheets/full-a-retry-003-tad-cell.jpg)
- [plantGenome sheet](../evidence/browser/sheets/full-a-retry-004-plantGenome-plant.jpg)
- [plantRdDM sheet](../evidence/browser/sheets/full-a-retry-005-plantRdDM-plant.jpg)

Original-resolution follow-ups: chromatinAccess start/end; tad stage 4; plantGenome end; plantRdDM stage 2/stage 6/end. Existing numeric scientific checks and this image review remain distinct evidence gates.

## Subsequent authorized repair

Root confirmed these leader associations are real defects and authorized corrections. They are recorded as `20261004-chromatin-02` through `-05` in the additive [discovery record](../evidence/chromatin/repair-discoveries.json). The code and actual-geometry regression repairs are described in [chromatin.md](chromatin.md). **The images reviewed above predate those annotation fixes.** Their observations remain historical evidence; a fresh root-rendered batch is needed for the corrected layout.
