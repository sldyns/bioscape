# Signals · final default-scene review

Reviewed the four `full-b3-004`–`full-b3-007` sheets in `evidence/browser/gallery-index.json`: **28 stage/start/end frames**, plus **9 original 960×640 images**. These are **Chinese, cell root, default conditions, playback speed 1.5**. This is not rendered acceptance of the global 235 contexts, English, mobile, or every alternative control.

The mechanism and attachment repairs are consistent with the sampled default images. The review found one further event-identity defect in apoptosis; it has now been fixed in source/tests as **20261004-signals-05**. The existing `full-b3` images precede that last correction and must not be described as its visual acceptance. Root's final fresh reload/capture must confirm it and the shared annotation-layout changes.

## Model-by-model findings

| Model / exact condition | Viewed progress | Observed result and evidence limit |
| --- | --- | --- |
| signalTransduction / `condition=ligand` | 0, .245, .375, .525, .795, .945, 1 | Extracellular PDGF bridges the receptor; receptors stay transmembrane, Ras stays on the cytosolic membrane side; adaptor/Raf docking and kinase activation are visible. The nuclear envelope now has a visible aligned opening and ERK is nuclear at .945/1. Its leader follows the actual kinase. The sheet samples before/after the .8–.9 crossing, so detailed transit clearance remains established by the actual-triangle regression rather than an intermediate rendered frame. |
| apoptosis / `condition=stress` | 0, .175, .305, .445, .605, .825, 1 | Mitochondrial outer/inner membranes and open cristae remain distinct; BAX/BAK is at the actual opening; the Apaf-1 assembly, caspases and later shrinkage are legible. At 1, five individually enclosed chromatin-bearing bodies surround the mother-cell remnant. **The .825 label prematurely named the final bodies; .445 similarly named an assembled apoptosome while its arms were dispersed. Both event identities are corrected under issue 05, pending fresh capture.** |
| differentiation / `program=competent` | 0, .185, .335, .515, .695, .945, 1 | GATA1 and its endpoint lie inside the visible nucleus; hemoglobin callout meets the represented hemoglobin; the nucleus condenses/polarizes and ends in a membrane-enclosed pyrenocyte. The mother product is called reticulocyte and visibly retains organelles. The .695 regional constriction callout meets the cell membrane; no physical contractile ring is claimed or drawn. Samples omit the central extrusion neck interval, covered separately by geometry regressions. |
| immuneResponse / `epitope=matched` | 0, .205, .365, .515, .825, .955, 1 | Proteasome/TAP/ER-lumen callouts point to their stated structures/region. At .365 peptide is inside the ER lumen near MHC. At .825 onward the peptide–MHC extracellular domain faces the T cell; TCR/CD8 contact and later granule polarization are visible. The Golgi is clearly an adjacent compressed route. The .515→.825 interval omits the free-carrier/bud/fusion intermediate states; those remain covered by the geometry/continuity tests, not by this sheet alone. |

No molecular geometry or true endpoint was moved to bypass shared annotation overlap. The inspected original images support target identity; shared edge-placement/occlusion fixes remain owned by `sceneCapture` and require the final fresh images.

## Newly confirmed event-label defect and correction

At apoptosis p=.825, [the original 960 image](../evidence/browser/full-b3-005-apoptosis-cell-stage-6.webp) shows the “膜包裹的凋亡小体” endpoint on a chromatin fragment deep inside the mother cell. The actual membrane has **one** connected component; the target's normalized mother-ellipse radius is **0.570**. This is neither a detached body nor a visible membrane-enclosed bud. At p=.445, the seven Apaf-1 arms are dispersed rather than an assembled central complex.

The correction retains the exact same target objects and endpoints:

- Before .89: **凝缩的染色质片段 / Condensed chromatin fragment**.
- .89 to .94: **膜出泡与小体形成 / Membrane blebbing and body formation**, describing the ongoing event without claiming all bodies are still attached or already separated.
- From .94: **膜包裹的凋亡小体 / Membrane-enclosed apoptotic bodies**; emitted triangles have six separate components, corresponding to the remnant plus five bodies. The reported completed-body count agrees.
- Apaf-1 labels distinguish **monomers**, **assembly**, and **assembled apoptosome**, using the existing assembly variable and actual arm configuration.

The new [labelEvents test](../../../../src/processes/modules/signals/labelEvents.test.mjs) failed against the prior body label at .825, and its Apaf extension failed against the prior assembled name. Both failure logs are retained. The fixed test passes actual triangle connectivity, current arm configuration, both languages, reverse seeks and the inactive noStress control. It is statically imported by `science.test.mjs`. Full science, smoke and the 650-anchor checks were rerun after the final correction and pass.

Evidence: [original topology/event diagnostic](../evidence/signals/apoptotic-body-event-before.json), [updated diagnostic](../evidence/signals/apoptotic-body-event-after.json), [old body-label failure](../evidence/signals/phase-b-label-events-before.log), [old Apaf-label failure](../evidence/signals/phase-b-label-events-apaf-before.log), [new passing test](../evidence/signals/phase-b-label-events-after.log), [separate repair discovery](../evidence/signals/repair-discoveries.json).

## Inactive/alternative controls and playback boundary

The original/full rerun science and anchor tests cover all nine local options: noLigand and kinaseInactive retain cytosolic ERK; noStress retains one closed cell membrane and hides body-event labels; impaired differentiation keeps GATA1's callout inactive; unmatched epitope does not produce the matched recognition response. **These are code/geometry/visibility regressions. No non-default rendered frame is included in this full-b3 review.**

The four corresponding browser JSON records all report `result=complete`, zero errors and monotonic live progress. Recorded median / P95 frame intervals (ms) are signal **16.8 / 18.5**, apoptosis **17.1 / 24.3**, differentiation **17.1 / 21.1**, immune **16.7 / 17.7**. They document the captured desktop/default run at speed 1.5, rather than an all-device or fixed-60-FPS guarantee. The apoptosis/differentiation tails remain higher than the other two models.

## Viewed original images

All four sheet files were reviewed in full. Original-resolution inspection additionally covered:

- signalTransduction: `start`, `stage-6`.
- apoptosis: `stage-5`, `stage-6`, `end`.
- differentiation: `start`, `stage-6`.
- immuneResponse: `stage-3`, `stage-6`.

Sheets: [signal](../evidence/browser/sheets/full-b3-004-signalTransduction-cell.jpg), [apoptosis](../evidence/browser/sheets/full-b3-005-apoptosis-cell.jpg), [differentiation](../evidence/browser/sheets/full-b3-006-differentiation-cell.jpg), [immune](../evidence/browser/sheets/full-b3-007-immuneResponse-cell.jpg). Product edits were limited to the newly authorized apoptosis event-label correction; no browser operation or shared annotation edit was performed by this reviewer.
