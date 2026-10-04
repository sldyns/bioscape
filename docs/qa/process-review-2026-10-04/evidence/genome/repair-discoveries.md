# Genome supplementary label discoveries

Root requested an audit of named label targets after integrated rendering exposed this class in other groups. These findings use code and actual geometry, not a claimed rendered inspection. Phase A remains unchanged.

- **20261004-genome-04 / replication / P2**: CMG channel label was 1.0153 units from channel center; primer, daughter-strand and ligase labels used layout offsets rather than existing visible rails or enzyme positions. Fixed by binding leader targets to actual geometry and conditional visibility.

- **20261004-genome-05 / dnaRepair / P2**: UV-photoproduct label was 0.2231 units outside the lesion bounds at p=.4; moving patch, excised strand and ligase annotations retained static layout coordinates. Fixed by binding leader targets to actual geometry and conditional visibility.

- **20261004-genome-06 / transduction / P2**: Particle label targeted a point .65 above the capsid center; donor/cargo/entry annotations did not track their named targets. Delivered-DNA label could activate before cargo passed the inner envelope. Fixed by binding leader targets to actual geometry and conditional visibility.

- **20261004-genome-07 / bacterialSporulation / P2**: Coat label was .6698 units outside the coat bounds at p=.7; septum, engulfment, cortex and core-DNA labels used off-object layout positions. Fixed by binding leader targets to actual geometry and conditional visibility.

Evidence: label-baseline.json. Regression: src/processes/modules/genome/labelAnchors.test.mjs, invoked by owned science.test.mjs.

## Rendered follow-up

- **20261004-genome-08 / transduction / P2**: The default P1 view at p=.915 and p=1 shows an empty gap between contracted sheath and baseplate. The existing open half-cylinder tail tube uses FrontSide material, which culls the inner face seen through this cutaway. Original evidence: `../browser/full-b1-002-transduction-phage-stage-6.webp`. Root authorized a material-only visibility correction and default-view triangle-ray regression; source frozen in `tail-visibility-baseline/manifest.json`. Earlier discovery records and rendered images remain unchanged.

Correction of genome-08: existing open tail-tube and entry-conduit inner faces now use a dedicated DoubleSide material. `tailVisibility.test.mjs` passes 16 states/144 rays and rejects the frozen source. Full-scene geometry/transform hashes remain identical in all 16 states; fresh owned smoke/science pass. Targeted native recapture remains pending.

- **20261004-genome-09 / dnaRepair / P2**: All blocked roots retain the Two incisions on one strand annotation despite uncut backbone and the Incision blocked annotation; active p=.325 also announces incisions before the actual p=.43 event. Confirmed on conditions-final-a-012-dnaRepair-cell-end.webp and all six repair sheets. Root authorized binding the annotation to actual incision state with boundary/arbitrary-seek regressions. Frozen pre-fix source: incision-label-baseline/manifest.json.

Correction of genome-09: shared actual incision state now gates the annotation. 96 boundary states/672 arbitrary seeks pass; identical regression rejects old source. All 96 geometry/anchor/state hashes are unchanged; owned smoke/science and formatting pass. Fresh repair-condition imagery remains pending.

Final visual follow-up of genome-09: conditions-final-c Chinese raw960 frames passed for all six active/blocked root combinations (.325/.495 plus active .905 or blocked end). All 18 fresh group sheets/126 stage frames were inspected and passed. See resolutions/genome-rendered-all-cases.md; original failing evidence remains unchanged, and this is stage-image acceptance rather than full-video human review.
