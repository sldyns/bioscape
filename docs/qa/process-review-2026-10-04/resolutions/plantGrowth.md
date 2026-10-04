# plantGrowth · Phase B resolution · 2026-10-04

All five Phase A issues and one repair-discovered label issue are fixed in the owned module. Local source/numeric checks are complete; files are frozen for integrator rendering. Phase A and historical audits remain unchanged.

| Issue | Resolution | Evidence |
| --- | --- | --- |
| 01 P2 | Fusion bulges flatten into the cell plate before reuse; terminal cohorts finish absorption. | Actual rim movement across p=.5/.7 is 9.54e-7 / 1.19e-6 units, replacing the old .095 retreat. |
| 02 P1 | A continuous sperm/female-gamete membrane opens a real neck; only the paternal nucleus then moves inside the female gamete. Maternal and paternal nuclear geometry is contained. | Both assignments pass actual-triangle neck and whole-nuclear-body containment checks. |
| 03 P2 | Carried paternal nuclei and their post-fusion contributions share the same final position and radius. | Both handoffs below 1e-6 displacement; existing exclusive two-identity tests retained. |
| 04 P1 | The hyphal PM and vesicle lumens form one field surface, cargo passes through the opening to extracellular wall cohorts, and consumed carriers are invisible during reuse. | Actual membrane barrier before contact, open lumen after contact, extracellular cargo and cohorts, both delivery branches. |
| 05 P2 | Incoming and outgoing Spitzenkörper paths share endpoint and tangent behavior. | Both branches pass the small-epsilon trajectory check; prior pore-clearance checks still pass. |
| 06 P2 | Named label endpoints attach to actual moving geometry and switch targets at biological transitions. | Four-model geometry/instance/world-transform regression; separate repair-discovery record. |
| 07 P2 | After sister chromatids separate, the label becomes 子染色体 / Daughter chromosomes and restores the previous wording on backwards seeks. | Old code fails at p=.130001; boundary/seek/text-object/anchor regression and final owned science + smoke pass. |

The new [fusion.test.mjs](/Users/kun/Documents/vc/src/processes/modules/plantGrowth/fusion.test.mjs) is imported by the owned `science.test.mjs`, so the shared scientific runner will execute it. No shared runner change is required.

Validation:

- `node src/processes/modules/plantGrowth/science.test.mjs`: PASS. Includes all four exact full-buffer seek suites, new fusion/containment/cargo/label regressions, and all existing topology, spindle attachment, identity, asymmetry, pore clearance and retained-wall checks.
- `node src/processes/modules/plantGrowth/smoke.mjs`: PASS for all four models; finite geometry/bounds, bilingual metadata, meaningful branches, stable node/material/geometry inventories and deterministic seeks.
- Prettier applied only to nine owned JS/MJS files. No browser or full-workspace suite run.

The cell-plate field retains its 40×16×24 grid and original buffers. Scalar scratch reuse, column caching and exact distance bounds remove repeated work without reducing resolution. In the final bounded Node sample, update medians were **3.08 ms** for cell division and **5.07 ms** for hyphal growth. Double fertilization was mostly cached outside the fusion interval; its observed maximum was **1.64 ms**. These are update-only diagnostics under the current environment, **not browser FPS**.

Changed module files: `plantDivisionProcess.js`, `cellWallGrowthProcess.js`, `doubleFertilizationProcess.js`, `fungalHyphaeProcess.js`, `structuralDetail.js`, `cellPlateMembrane.js`, new `fusionSurface.js`, new `fusion.test.mjs`, and `science.test.mjs`. The CESA model's mechanism/conditions remain unchanged; only its label anchors were corrected.

Evidence: [science log](../evidence/plantGrowth/phase-b-science-final.log), [smoke log](../evidence/plantGrowth/phase-b-smoke-final.log), [measurements](../evidence/plantGrowth/phase-b-measurements.json), [opened primary sources](../evidence/plantGrowth/source-notes.md), and [repair discovery](../repair-discoveries/plantGrowth.json).

The added [Kawashima et al. primary source](https://elifesciences.org/articles/04501) supports the distinction between plasma-membrane fusion and later nuclear migration/karyogamy. Geometries remain enlarged process schematics. Rendered contact readability, continuous playback and final integration remain with the root integrator.

Final rendered review discovered issue 07 in the immutable `full-b3` capture. The correction changes only the existing bilingual label text, keyed to the actual `separation > 0` state. [Old-code failing test](../evidence/plantGrowth/phase-b-chromosome-label-red.log), [final science](../evidence/plantGrowth/phase-b-science-label-final.log) and [final smoke](../evidence/plantGrowth/phase-b-smoke-label-final.log) preserve the red/green evidence. See [default rendered review](plantGrowth-rendered-final.md) for all 28 reviewed stage samples and the current screenshot boundary. Product files are frozen again; fresh capture remains with the integrator.
