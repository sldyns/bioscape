# Playback C — actual continuous browser QA

Date: 2026-10-03. Own hidden IAB tab, 1280×720. 28/28 default runs, 5 alternate runs. No source edits or commits.

Real CUA browser actions, uninterrupted playback, screenshot observations during running and at end. No seeking used. Transient screenshots only.

| Process | Running observation | End observation | Options inspected |
|---|---|---|---|
| plantTransport | ATP outward pumping; coupled movement | Sucrose inside; two-stage energy explanation | ATP available / no ATP initially no gradient |
| plasmodesmata | Small solute enters cytoplasmic sleeve; larger molecule excluded | Small solute across channel | Low callose / accumulated callose |
| photorespiration | 4C split to 3C and 1C at mitochondrion | 3C returned to chloroplast; CO2 released | GLYK normal / absent |
| c4cam | Maize spatial separation and decarboxylation | Pyruvate return and PEP regeneration | Maize C4 / Kalanchoe CAM |
| lacOperon | CAP binding, released LacI, nascent RNA | Multiple transcripts | Lactose present/absent; glucose low/high |
| trpOperon | Ribosome stall region 1; 2:3 loop | Read-through product | Free Trp severely depleted/sufficient; charging normal/limited |
| yeastGal | Gal3-Gal80 complex; activated Gal4 | GAL1 RNA | Galactose present/absent; glucose low/high |
| yeastOsmoregulation | Hog1 signal and nuclear transit stage | Glycerol accumulation and recovered volume | Osmotic increase/unchanged; Hog1 normal/nonphosphorylatable |
| bacterialExpression | Transcription bubble and nascent RNA at 16s on repeat run | Simultaneous elongation with ribosome and nascent peptide | Sigma70 present/absent |
| bacterialDivision | Separated sister chromosomes | Two daughter cells | Septal synthesis normal/blocked |
| conjugation | Single strand entering recipient via contact zone | Both retain complete F plasmid | TraI can nick oriT / nick blocked |
| transformation | Imported strand with protective proteins and RecA | Heteroduplex incorporated into recipient chromosome | Homology matched/unmatched |
| chemotaxis | Longer run with bundled flagella | Continued sampling on schematic trajectory | Increasing attractant / uniform |
| twoComponent | NarX to NarL phosphotransfer | RNA transcription output | Nitrate present/absent |
| quorumSensing | LuxR-AHL complexes and local signal | Lux RNA and conditional luminescent state | Local accumulation / continuous dilution |
| biofilm | Microcolonies and extracellular matrix | Local loosening and released cells | Low-level NO signal / no dispersal signal |
| yeastBudding | Nucleus at neck then stretched through neck; final-build sample p=.762 | Separated mother and smaller daughter | None |
| yeastFermentation | Acetaldehyde reduction and NADH transfer | Ethanol and regenerated NAD+ | Anaerobic high sugar / aerobic high sugar |
| yeastMating | Cytoplasmic bridge with two nuclei | Single diploid zygote nucleus | Complementary a+alpha / same a+a |
| yeastSporulation | Second meiotic division | Four mature spores inside ascus | Nitrogen depletion plus acetate / rich nutrients |
| parameciumFeeding | Food vacuole acidification | Waste outside cytoproct; membrane retained | None |
| contractileVacuole | Isolation before discharge | Discharge and reconnection; weak-hypotonic end visually confirmed | Stronger/weaker hypotonicity |
| parameciumDivision | Final-build p=.519/.692 before and after macronuclear partition | Two cells each with micro/macro nucleus and oral apparatus | None |
| parameciumConjugation | Migration pronucleus exchange | New macronuclear anlagen and retained micronucleus | None |
| phageLytic | DNA packaging and particle maturation | Envelope disruption and phage release | None |
| phageLysogenic | Two lysogenic daughters | Left induced/lysed, right remains lysogenic | DNA damage induction / no induction |
| phageAssembly | Separate head and tail components | Completed extended-tail T4 particle | gp21 active / inactive |
| phagePackaging | DNA filling capsid through motor | Filled head and neck closure | ATP present/absent |

## Alternate complete runs

- **plantTransport**, No ATP; initially no gradient: Sucrose remains outside; no gradient; final 30s/1000. Selecting a new condition automatically reset the timeline, followed by Play at zero.
- **c4cam**, CAM Kalanchoe: Single cell with vacuolar stored acid and daytime decarboxylation; final 36s/1000. Selecting a new condition automatically reset the timeline, followed by Play at zero.
- **contractileVacuole**, Weaker hypotonicity: Central vacuole fills then discharges/reconnects; final 30s/1000. Selecting a new condition automatically reset the timeline, followed by Play at zero.
- **phageLysogenic**, No induction: Both intact daughter cells retain prophage and CI; final 38s/1000. Selecting a new condition automatically reset the timeline, followed by Play at zero.
- **phagePackaging**, No ATP: Docked DNA remains outside; capsid empty; final 34s/1000. Selecting a new condition automatically reset the timeline, followed by Play at zero.

## Final build delta

- **yeastBudding**: 5174 full 1× run, samples p=.484/.655/.895/1. Final 4201 full 1.5× run, sample p=.762 then 1. Nuclear passage and mother/daughter separation rendered without a confirmed visible jump in sampled frames.
- **parameciumDivision**: 5174 full 1× run, samples p=.425/.590/.745/1. Final 4201 full 1× run, samples p=.519/.692/1. Nuclear partition and daughter cells rendered as expected.
- **c4cam**: final 4201 selecting CAM displayed “CAM：夜间储酸，白天脱羧” and explicit warning against applying the C4 spatial route. The callout was visible at top of right panel and selector remained reachable.

No newly confirmed visible defect. Numerical continuity/scientific tests belong to the parent/source reviewer; this report does not independently claim those checks.

## Limits

- Not every frame inspected; sampled midrun views do not prove absence of frame-level discontinuities.
- All conditional options were read from UI; only five alternate branches fully played; other combinations are not runtime-validated.
- Shared controls such as Studio, Share, rotation, labels and speed 0.5x are outside this playback task.
- 27 default runs used frozen baseline 4200, parameciumDivision used fixed source 5174; final 4201 delta replays cover yeastBudding/parameciumDivision and CAM condition note.
- First plantTransport default last sampled timeline was 988/1000 then allowed to finish before condition switch; subsequent no-ATP run explicitly verified 1000.
- First contractileVacuole default terminal screenshot emission was lost when subsequent English-page locator failed; endpoint slider was verified 1000. Weak-hypotonic full replay confirms both mid and terminal rendering.
- One initial 5174 parameciumDivision run reset by source HMR; parent confirmed integration event, then stable full run completed.
- Final inspected 4201 tab warnings/errors empty; not claimed as per-process historical console audit.
- Source-reported yeastBudding and parameciumDivision jump fixes were visually rechecked at 5174 and 4201. Small transformation/phagePackaging candidates were not visibly misleading at sampled moments; not a full-frame clearance.
