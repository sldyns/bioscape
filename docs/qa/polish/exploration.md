# Continuous exploration refinement

2026-10-03. Scope: relationship semantics, stage-aware navigation UI and caption API; no process geometry changes.

84 processes, 114 supported root/process combinations, 455 explicit destinations retained. Every mapping was reviewed against the actual definition stage table. Focused tests check hierarchy validity, exact stage boundaries, inverse paths, unsupported roots, branch selection, and specialized dispatch.

## Corrected issues

- Reject unbounded ancestor-to-descendant mechanism fallthrough; preserve exact, aliases and explicit descendant context.
- Current-step entry group plus collapsed other-stage groups; deep path context; no previous-stage highlight presented as current.
- Branch filtering and branch-aware entryParameters for C4/CAM and diffusion.
- Scope notes always visible, with erythrocyte and muscle-specific limits.
- Optional getFrameCaption(fraction) and getScientificNote() scene API for accurate Studio captions.

## Evidence and boundaries

Stable production snapshot at http://127.0.0.1:4199/ used to exclude development HMR resets. All nine root flows passed, with 51 stage-button transitions. Each row also passed structure detour, Resume process timeline restoration, and origin-root return.

| Root | Process | Stages visited | Resumed progress | Structure detour |
|---|---|---:|---:|---|
| cell | secretion | 7 | 0.9 | cell/membrane |
| plant | photosynthesis | 6 | 0.66 | plant/chloroplast/stroma |
| bacterium | transduction | 6 | 0.71 | bacterium/bacterialCytoplasm |
| yeast | replication | 6 | 0 | yeast/yeastNucleus |
| paramecium | ciliaryMotion | 6 | 0.17 | paramecium/paraCilia/paraAxoneme |
| phage | infection | 3 | 0.6 | phage/phageTail/phageTube |
| erythrocyte | osmoticBalance | 5 | 0.38 | erythrocyte/erythrocyteMembrane |
| neuron | actionPotential | 6 | 0.42 | neuron/neuronAxon |
| muscleFibre | muscle | 6 | 0.43 | muscleFibre/muscleFibreMyofibrils |

- CAM vacuole entry selects CAM at 0.26, including after remembering a C4 session. Changing strategy filters the corresponding vacuole/plasmodesmata destination.
- Lipid bilayer entry selects oxygen at 0.38. Changing to water replaces the bilayer link with the membrane-protein link.
- RBC and yeast speed 1.5 persist through detours. English muscle retains stage 4 and correct scope text.
- Stable tab console contained no warnings or errors. Screenshots of RBC, neuron, English muscle and C4 were inspected in browser tool outputs; no standalone image files were saved by this lane.
- Focused relationship and process-session tests passed. Relationship test includes all stages in all 114 combinations, branch constraints naming actual controls, all 455 destinations and 78 specialized dispatch states.

- No claim of visual inspection of all 84 process geometries.
- 13 qualified root-only cases remain because relevant structural specimens/parts are absent; no substitute anatomy invented.
- The source scientific models are preserved; this audit does not independently revalidate all 84 mechanisms.
- Exact camera-coordinate restoration and real mobile-device behavior were not separately measured in this lane.

Muscle scope was additionally cross-checked with [OpenStax: Muscle fiber contraction](https://openstax.org/books/anatomy-and-physiology-2e/pages/10-3-muscle-fiber-contraction-and-relaxation). NCBI osmotic and neuronal pages returned browser verification interstitials, so no fresh confirmation is claimed from those pages.

## Per-process semantic review

The JSON companion retains every root destination, exact stage title/description, qualifier and branch constraint. “Source reviewed” below is not a rendered geometry claim.

| Process | Roots | Stages | Destination count | Review note |
|---|---|---:|---:|---|
| secretion | cell | 7 | 9 | 0.2 is actual Golgi delivery, 0.42 cisternal maturation. Initial timing suspicion was disproved; no timing change. |
| transcription | cell, plant | 6 | 10 | Nuclear locations only; envelope/nucleolus and organellar DNA excluded by explicit-only lookup. |
| photosynthesis | plant | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| infection | phage | 3 | 8 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| replication | cell, plant, yeast | 6 | 13 | Nuclear eukaryotic replication; root context does not spread to mitochondrial DNA or nucleolus. |
| dnaRepair | cell, plant, yeast | 6 | 13 | Nuclear excision-repair links only; root context does not spread to every substructure. |
| transduction | phage, bacterium | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| bacterialSporulation | bacterium | 6 | 1 | B. subtilis process vs E. coli structure; qualified root-only context. |
| promoterRegulation | cell | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| enhancerRegulation | cell | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| chromatinAccess | cell, plant, yeast | 5 | 14 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| tad | cell | 6 | 3 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| plantGenome | plant | 6 | 10 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| plantRdDM | plant | 7 | 4 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| rnaProcessing | cell, plant | 6 | 4 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| nuclearTransport | cell, plant, yeast | 6 | 11 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| motorTransport | cell | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| organelleImport | plant | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| translation | cell, plant, yeast, paramecium | 6 | 26 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| proteinFolding | cell, plant, yeast | 6 | 9 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| alternativeSplicing | cell | 6 | 2 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| nitrogenFixation | bacterium | 6 | 2 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| rnaSilencing | cell | 5 | 3 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| proteasome | cell, plant, yeast | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| crispr | bacterium | 5 | 2 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| bacterialRepair | bacterium | 5 | 4 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| respiration | cell, plant, yeast, paramecium | 6 | 14 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| glycolysis | cell, plant, yeast | 7 | 6 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| bacterialEnergetics | bacterium | 6 | 3 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| bacterialPhotosynthesis | bacterium | 7 | 1 | Cyanobacterial thylakoid absent from structural E. coli; qualified root-only context. |
| diffusion | cell, plant, bacterium, yeast | 5 | 11 | Oxygen uses lipid bilayer; water uses channel. Branch-specific entry parameters and destination filtering. |
| activeTransport | cell | 6 | 4 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| osmoticBalance | cell, erythrocyte | 5 | 5 | Mature erythrocyte membrane and intracellular-solution links. No nucleus, mitochondria, cell wall or hemolysis mechanism. |
| bacterialCellWall | bacterium | 6 | 3 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| endocytosis | cell | 6 | 3 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| autophagy | cell | 7 | 6 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| mitosis | cell | 6 | 6 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| meiosis | cell | 7 | 4 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| signalTransduction | cell | 6 | 6 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| apoptosis | cell | 6 | 7 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| differentiation | cell | 6 | 6 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| immuneResponse | cell | 6 | 8 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| actionPotential | cell, neuron | 6 | 6 | Myelinated anatomical root intentionally links only to axon; mechanism is continuous conduction in an unmyelinated axon. Myelin and nodes remain excluded. |
| synapse | cell, neuron | 6 | 7 | Multicellular glutamatergic synapse; terminal and postsynaptic dendrite entries do not imply that both sides belong to the same neuron. |
| muscle | cell, muscleFibre | 6 | 5 | Sarcomere cross-bridge mechanism; myofibril link provides assembly context. No sarcolemma/nuclear excitation-contraction claim. |
| ciliaryMotion | paramecium | 6 | 3 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| plasmolysis | plant | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| stomata | plant | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| plantLongDistanceTransport | plant | 6 | 2 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| chloroplastMovement | plant | 6 | 4 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| plantDivision | plant | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| cellWallGrowth | plant | 6 | 6 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| doubleFertilization | plant | 6 | 1 | Gametes and ovule absent from mesophyll structure; qualified root-only context. |
| fungalHyphae | yeast | 6 | 1 | Neurospora hypha differs from budding yeast structure; qualified root-only context. |
| auxin | plant | 6 | 3 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| plantDefense | plant | 6 | 3 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| plantTransport | plant | 6 | 3 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| plasmodesmata | plant | 6 | 6 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| photorespiration | plant | 7 | 5 | Existing catalogue lacks plant peroxisome destination; mitochondrial and chloroplast portions mapped only. |
| c4cam | plant | 6 | 6 | Conditional entry parameters select C4 plasmodesmata vs CAM vacuole; opposite branch destinations hidden. |
| lacOperon | bacterium | 6 | 4 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| trpOperon | bacterium | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| yeastGal | yeast | 6 | 3 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| yeastOsmoregulation | yeast | 6 | 3 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| bacterialExpression | bacterium | 6 | 7 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| bacterialDivision | bacterium | 6 | 6 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| conjugation | bacterium | 6 | 3 | No type-1 adhesion pilus link; represented F-plasmid mechanism links to plasmid DNA. |
| transformation | bacterium | 6 | 2 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| chemotaxis | bacterium | 6 | 6 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| twoComponent | bacterium | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| quorumSensing | bacterium | 6 | 2 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| biofilm | bacterium | 6 | 1 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| yeastBudding | yeast | 6 | 7 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| yeastFermentation | yeast | 6 | 1 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| yeastMating | yeast | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| yeastSporulation | yeast | 6 | 4 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| parameciumFeeding | paramecium | 6 | 4 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| contractileVacuole | paramecium | 5 | 4 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| parameciumDivision | paramecium | 6 | 8 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| parameciumConjugation | paramecium | 7 | 6 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| phageLytic | phage | 6 | 5 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| phageLysogenic | phage | 7 | 1 | Lambda noncontractile tail differs from structural phage: qualified root-only context. |
| phageAssembly | phage | 6 | 7 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
| phagePackaging | phage | 6 | 4 | Explicit locations align with named compartment or component at their documented entry stage. Parent overview may show these links; unlisted child components inherit none. |
