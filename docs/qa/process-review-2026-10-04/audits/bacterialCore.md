# bacterialCore · Phase A independent review · 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product and test files remained read-only. Four models covered, all actually registered only under `bacterium`; both options for each control were inspected. Chinese and English intros, stages, labels, legends, sources and entry metadata were reviewed. There are no root-specific overrides.

| Process | Verdict | Findings |
| --- | --- | --- |
| bacterialExpression | qualified_pass | Checked DNA bubble frame, template/RNA direction, 3′ active-end attachment, ribosome movement and peptide-exit continuity. |
| bacterialDivision | qualified_pass | Checked shared replication forks, closed daughter loops, membrane layers, synthesis arrest and FtsZ departure. Relative membrane-scission timing remains schematic. |
| conjugation | qualified_pass | Checked one continuous T-strand, leading 5′ TraI, donor replacement arc, recipient arrival/synthesis and oriT arrest. |
| transformation | confirmed_issue | P1 uptake backbone discontinuity; P2 terminal pairing-end jump. |

## Confirmed issues

### 20261004-bacterialCore-01 · P1 · DNA is disconnected through ComEC

`transformationProcess.js:300–347` constructs the extracellular donor strand and intracellular input strand independently. At `p=.42`, the actual external cylinder endpoint is `[-1.9, .191826018, .100768631]`, while the imported chain begins at `[-1.78, .06, .27]`: **gap .245799421**, versus combined strand radii **.072**. No donor DNA joins these ends through the deliberately open ComEC lumen. Five sampled uptake times all reproduce gaps, in code common to both homology branches.

The [opened primary ComEC study](https://journals.asm.org/doi/10.1128/jb.01128-10) describes one ssDNA strand crossing the membrane channel. The displayed retained strand needs one continuous path across exterior, pore and cytoplasm. Fix with shared endpoints and continuous moving clipping, preserving the other strand’s degradation and the later D-loop sequence. Regression must measure actual world-space backbone endpoints throughout uptake, in both branches.

### 20261004-bacterialCore-02 · P2 · Last DNA endpoint snaps by .18

`transformationProcess.js:336` uses `pair >= 1 ? 0 : .18 * ease(t, pair, min(1, pair+.1))`. At the terminal point `t=1`, the offset stays `.18` for every `pair<1`, then vanishes at `pair=1`. Actual `incoming-strand-34` endpoint z changes from **.419955141** at `p=.8699999` to **.239955141** at `p=.87`. The same visible cylinder remains present and its preceding endpoint stays fixed: this is a true position jump, not a stage-label or visibility change.

Use a contact-front offset whose limit reaches zero continuously. Verify shrinking-epsilon endpoint displacement around `.87`, exact final heteroduplex boundaries, contact-before-displacement and the unmatched condition.

## Evidence and qualified-pass boundaries

Independent probe: `evidence/bacterialCore/probe.mjs`; complete compact measurements in `probe-results.json`, with terminal witnesses in `terminal-motion.json`. It evaluated **1,694 condition/time states** including offset progress samples, stage and code boundaries ±1e−7, endpoints and NaN. All states had finite geometry/matrices, stable node/geometry/material inventories and deterministic `.817 → .213 → .817` seeks. No old test result was used as proof of current geometry.

- **Expression:** maximum RNA backbone endpoint gap `2.22e−15`, checked active-end/peptide-exit attachment gap `4.97e−16`. Opened [6VYW](https://www.rcsb.org/structure/6VYW) and [6I0Y](https://www.rcsb.org/structure/6I0Y) support the coupled mRNA and nascent-chain structural relationships. Protein ridges are schematic; tRNA chemistry and peptide attachment inside the ribosome are unresolved detail.
- **Division:** fork-attachment maximum `5e−6`, backbone maximum `1e−5` near vanishing arms, caused by the explicit minimum cylinder length. FtsZ leaves before closure, consistent with the [opened primary FRAP study](https://onlinelibrary.wiley.com/doi/full/10.1111/mmi.12534). All envelope layers share normalized constriction. The distinct interval of closed cytoplasm and open periplasm seen in [Skoog et al.](https://journals.asm.org/doi/10.1128/jb.06091-11) is compressed, so the model does not establish relative scission timing; no extra defect is inferred solely from the omitted lag.
- **Conjugation:** T-strand backbone maximum gap `2.44e−15`; TraI attachment gap `2.29e−16`. The [opened primary F-plasmid study](https://pmc.ncbi.nlm.nih.gov/articles/PMC9849209/) supports transfer and circularization order but explicitly leaves recipient synthesis onset relative to circularization uncertain. The model’s overlap is illustrative timing.
- **Transformation:** matched imported-chain internal gaps remain below `4.49e−16`; this does **not** cover the confirmed exterior-to-interior discontinuity. [Newer primary surface-capture work](https://pmc.ncbi.nlm.nih.gov/articles/PMC10564135/) also limits any inference that all initial capture must occur at a pole; the current scene selects one polar episode.

No browser, full-suite, physical-device or rendered continuous-playback acceptance was performed. Root owns those gates. Phase B has not begun.
