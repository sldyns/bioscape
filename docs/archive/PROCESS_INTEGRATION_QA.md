# Biological processes integration QA — 2026-09-19

> Historical first-expansion record. The user rejected that visual detail level; see PROCESS_REFINEMENT_QA.md for the subsequent model refinement and actual rendered thumbnails.

## Delivered scope

22 parallel groups delivered 80 new independent process modules. The existing four definitions remain in place: 84 distinct processes total, exposed through 110 organism/process entries. Shared mechanisms are counted once. Directory cards have individual square SVG diagrams, bilingual titles and summaries, search and category filters. Both modes retain hierarchical navigation.

## Verification

- Production build passes; format check passes (the final directory naming and SVG fill fix were then formatted/built again).
- Process regression: 84 definitions, 2,675 deterministic seek checks, zero errors.
- Extension contract: 80 modules, 105 root instances, 215 condition combinations, 1,720 progress checks, zero issues. Includes finite geometry, stage ordering, bilingual content, resource identity and explicit disposal of swapped materials.
- Existing structural regression: 163 nodes, 241 routes, 160 worker detail transfers, zero errors. Plant containment, cutaway pili and nuclear hierarchy remain covered.
- Browser: all 80 new process routes opened in the in-app browser, middle-stage screenshots captured and reviewed. This is a representative visual pass per model, not a frame-by-frame biological validation of every branch. Screenshots are recorded below. Some live development captures reset to the opening pose during module updates; detailed deterministic stage checks are covered separately by code tests.
- Formal production preview: search (TAD), category filtering, empty results/clear, directory return, organism switching, condition-reset-to-zero, slider End, replay and pause exercised. No browser console errors observed in either reviewed tab.
- 390×844 viewport: Chinese/English animal directory and process layout; phage directory and packaging final-stage controls. No document horizontal overflow in those checks. Desktop directory counts checked for all six organisms. These are simulated viewport checks; real phone testing is still pending because no device is connected.

## Corrections from review

- Live model labels now read mutable source text rather than the initial cached label.
- Models that swap prebuilt materials provide disposal inventories.
- Oxygen/water diffusion descriptions now match both selectable routes and distinguish water activity from solute concentration.
- Yeast mother/bud/nuclear envelopes use smooth truncated ellipsoids instead of pointed profiles.
- Process directory names use Fungi and Bacteriophages rather than implying all examples are the specific structural yeast/T2 specimen.
- Removed an unintended default black SVG fill in the existing infection thumbnail.

## Remaining content boundaries

See PROCESS_COVERAGE_AUDIT.md for the 91 candidate-topic mapping. 52 have core coverage, 35 partial coverage, and 4 still lack an applicable scene. Modules are scoped teaching illustrations with sources; complex topic titles do not imply all submechanisms are implemented. Four empty topics: plant 3D chromosome organization, bacterial sugar metabolism/fermentation, yeast vacuolar autophagy, and Paramecium avoidance responses.

## Reviewed routes

| Organism | Process | Screenshot |
| --- | --- | --- |
| cell | replication | /tmp/atlas-process-visual/replication.png |
| cell | dnaRepair | /tmp/atlas-process-visual/dnaRepair.png |
| bacterium | transduction | /tmp/atlas-process-visual/transduction.png |
| bacterium | bacterialSporulation | /tmp/atlas-process-visual/bacterialSporulation.png |
| cell | promoterRegulation | /tmp/atlas-process-visual/promoterRegulation.png |
| cell | enhancerRegulation | /tmp/atlas-process-visual/enhancerRegulation.png |
| cell | chromatinAccess | /tmp/atlas-process-visual/chromatinAccess.png |
| cell | tad | /tmp/atlas-process-visual/tad.png |
| plant | plantGenome | /tmp/atlas-process-visual/plantGenome.png |
| plant | plantRdDM | /tmp/atlas-process-visual/plantRdDM.png |
| cell | rnaProcessing | /tmp/atlas-process-visual/rnaProcessing.png |
| cell | nuclearTransport | /tmp/atlas-process-visual/nuclearTransport.png |
| cell | motorTransport | /tmp/atlas-process-visual/motorTransport.png |
| plant | organelleImport | /tmp/atlas-process-visual/organelleImport.png |
| cell | translation | /tmp/atlas-process-visual/translation.png |
| cell | proteinFolding | /tmp/atlas-process-visual/proteinFolding.png |
| cell | alternativeSplicing | /tmp/atlas-process-visual/alternativeSplicing.png |
| bacterium | nitrogenFixation | /tmp/atlas-process-visual/nitrogenFixation.png |
| cell | rnaSilencing | /tmp/atlas-process-visual/rnaSilencing.png |
| cell | proteasome | /tmp/atlas-process-visual/proteasome.png |
| bacterium | crispr | /tmp/atlas-process-visual/crispr.png |
| bacterium | bacterialRepair | /tmp/atlas-process-visual/bacterialRepair.png |
| cell | respiration | /tmp/atlas-process-visual/respiration.png |
| cell | glycolysis | /tmp/atlas-process-visual/glycolysis.png |
| bacterium | bacterialEnergetics | /tmp/atlas-process-visual/bacterialEnergetics.png |
| bacterium | bacterialPhotosynthesis | /tmp/atlas-process-visual/bacterialPhotosynthesis.png |
| cell | diffusion | /tmp/atlas-process-visual/diffusion.png |
| cell | activeTransport | /tmp/atlas-process-visual/activeTransport.png |
| cell | osmoticBalance | /tmp/atlas-process-visual/osmoticBalance.png |
| bacterium | bacterialCellWall | /tmp/atlas-process-visual/bacterialCellWall.png |
| cell | endocytosis | /tmp/atlas-process-visual/endocytosis.png |
| cell | autophagy | /tmp/atlas-process-visual/autophagy.png |
| cell | mitosis | /tmp/atlas-process-visual/mitosis.png |
| cell | meiosis | /tmp/atlas-process-visual/meiosis.png |
| cell | signalTransduction | /tmp/atlas-process-visual/signalTransduction.png |
| cell | apoptosis | /tmp/atlas-process-visual/apoptosis.png |
| cell | differentiation | /tmp/atlas-process-visual/differentiation.png |
| cell | immuneResponse | /tmp/atlas-process-visual/immuneResponse.png |
| cell | actionPotential | /tmp/atlas-process-visual/actionPotential.png |
| cell | synapse | /tmp/atlas-process-visual/synapse.png |
| cell | muscle | /tmp/atlas-process-visual/muscle.png |
| paramecium | ciliaryMotion | /tmp/atlas-process-visual/ciliaryMotion.png |
| plant | plasmolysis | /tmp/atlas-process-visual/plasmolysis.png |
| plant | stomata | /tmp/atlas-process-visual/stomata.png |
| plant | plantLongDistanceTransport | /tmp/atlas-process-visual/plantLongDistanceTransport.png |
| plant | chloroplastMovement | /tmp/atlas-process-visual/chloroplastMovement.png |
| plant | plantDivision | /tmp/atlas-process-visual/plantDivision.png |
| plant | cellWallGrowth | /tmp/atlas-process-visual/cellWallGrowth.png |
| plant | doubleFertilization | /tmp/atlas-process-visual/doubleFertilization.png |
| yeast | fungalHyphae | /tmp/atlas-process-visual/fungalHyphae.png |
| plant | auxin | /tmp/atlas-process-visual/auxin.png |
| plant | plantDefense | /tmp/atlas-process-visual/plantDefense.png |
| plant | plantTransport | /tmp/atlas-process-visual/plantTransport.png |
| plant | plasmodesmata | /tmp/atlas-process-visual/plasmodesmata.png |
| plant | photorespiration | /tmp/atlas-process-visual/photorespiration.png |
| plant | c4cam | /tmp/atlas-process-visual/c4cam.png |
| bacterium | lacOperon | /tmp/atlas-process-visual/lacOperon.png |
| bacterium | trpOperon | /tmp/atlas-process-visual/trpOperon.png |
| yeast | yeastGal | /tmp/atlas-process-visual/yeastGal.png |
| yeast | yeastOsmoregulation | /tmp/atlas-process-visual/yeastOsmoregulation.png |
| bacterium | bacterialExpression | /tmp/atlas-process-visual/bacterialExpression.png |
| bacterium | bacterialDivision | /tmp/atlas-process-visual/bacterialDivision.png |
| bacterium | conjugation | /tmp/atlas-process-visual/conjugation.png |
| bacterium | transformation | /tmp/atlas-process-visual/transformation.png |
| bacterium | chemotaxis | /tmp/atlas-process-visual/chemotaxis.png |
| bacterium | twoComponent | /tmp/atlas-process-visual/twoComponent.png |
| bacterium | quorumSensing | /tmp/atlas-process-visual/quorumSensing.png |
| bacterium | biofilm | /tmp/atlas-process-visual/biofilm.png |
| yeast | yeastBudding | /tmp/atlas-process-visual/yeastBudding.png |
| yeast | yeastFermentation | /tmp/atlas-process-visual/yeastFermentation.png |
| yeast | yeastMating | /tmp/atlas-process-visual/yeastMating.png |
| yeast | yeastSporulation | /tmp/atlas-process-visual/yeastSporulation.png |
| paramecium | parameciumFeeding | /tmp/atlas-process-visual/parameciumFeeding.png |
| paramecium | contractileVacuole | /tmp/atlas-process-visual/contractileVacuole.png |
| paramecium | parameciumDivision | /tmp/atlas-process-visual/parameciumDivision.png |
| paramecium | parameciumConjugation | /tmp/atlas-process-visual/parameciumConjugation.png |
| phage | phageLytic | /tmp/atlas-process-visual/phageLytic.png |
| phage | phageLysogenic | /tmp/atlas-process-visual/phageLysogenic.png |
| phage | phageAssembly | /tmp/atlas-process-visual/phageAssembly.png |
| phage | phagePackaging | /tmp/atlas-process-visual/phagePackaging.png |
