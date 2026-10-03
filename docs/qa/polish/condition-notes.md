# Process condition-note audit

84 process definitions were inspected against controls and update branches. The notes describe the modeled response, not quantitative experimental predictions. Default conditions retain ordinary chapter text.

| Process | Control / option | Note or reason | Implementation |
|---|---|---|---|
| secretion | — | No selectable condition | `src/processes/secretionProcess.js` |
| transcription | — | No selectable condition | `src/processes/transcriptionProcess.js` |
| photosynthesis | — | No selectable condition | `src/processes/photosynthesisProcess.js` |
| infection | — | No selectable condition | `src/processes/phageProcess.js` |
| replication | `ligase=active` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/genome/nuclearModels.js` |
| replication | `ligase=absent` | reference: The fork and strand synthesis continue, but nicks between Okazaki fragments remain unsealed. | `src/processes/modules/genome/nuclearModels.js` |
| dnaRepair | `incision=active` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/genome/nuclearModels.js` |
| dnaRepair | `incision=blocked` | reference: Recognition and local opening occur; blocked dual incision prevents lesion removal, gap filling and sealing. | `src/processes/modules/genome/nuclearModels.js` |
| transduction | `route=p1` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/genome/transductionProcess.js` |
| transduction | `route=lambda` | condition: Lambda specialized transduction carries host genes beside the integration site after aberrant excision; it follows a different route from generalized P1 packaging. | `src/processes/modules/genome/transductionProcess.js` |
| bacterialSporulation | `engulfment=normal` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/genome/bacterialSporulationProcess.js` |
| bacterialSporulation | `engulfment=blocked` | reference: After forespore formation, mother-cell membrane engulfment stalls, preventing later maturation and release. | `src/processes/modules/genome/bacterialSporulationProcess.js` |
| promoterRegulation | `bindingSite=intact` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/regulation/promoterRegulationProcess.js` |
| promoterRegulation | `bindingSite=altered` | reference: The altered site does not support stable regulator binding; this model does not establish productive initiation or induced RNA synthesis. | `src/processes/modules/regulation/promoterRegulationProcess.js` |
| enhancerRegulation | `coactivator=competent` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/regulation/enhancerRegulationProcess.js` |
| enhancerRegulation | `coactivator=impaired` | reference: Enhancer and promoter can still approach, but impaired coactivation prevents the modeled transcription bursts. | `src/processes/modules/regulation/enhancerRegulationProcess.js` |
| chromatinAccess | `hydrolysis=active` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/chromatin/chromatinAccessProcess.js` |
| chromatinAccess | `hydrolysis=disabled` | reference: The remodeler can bind, but without ATP hydrolysis the nucleosome does not slide to expose the target site. | `src/processes/modules/chromatin/chromatinAccessProcess.js` |
| tad | `condition=normal` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/chromatin/tadProcess.js` |
| tad | `condition=boundaryDeleted` | condition: With a boundary deleted, loop extrusion can extend beyond the former boundary, changing the contact range. | `src/processes/modules/chromatin/tadProcess.js` |
| tad | `condition=cohesinDepleted` | reference: Without cohesin, the modeled extrusion loop does not form; this does not remove every type of chromatin contact. | `src/processes/modules/chromatin/tadProcess.js` |
| plantGenome | `targeting=intact` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/chromatin/plantGenomeProcess.js` |
| plantGenome | `targeting=removed` | reference: Nuclear expression, RNA export and cytosolic translation continue; removing targeting information prevents the illustrated organelle import. | `src/processes/modules/chromatin/plantGenomeProcess.js` |
| plantRdDM | `drm2=active` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/chromatin/plantRdDMProcess.js` |
| plantRdDM | `drm2=inactive` | reference: Upstream small-RNA guidance, DRM2 recruitment and base flipping can occur, but new methylation marks are not written in this cycle. | `src/processes/modules/chromatin/plantRdDMProcess.js` |
| rnaProcessing | — | No selectable condition | `src/processes/modules/rna/rnaProcessingProcess.js` |
| nuclearTransport | `nls=exposed` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/rna/nuclearTransportProcess.js` |
| nuclearTransport | `nls=masked` | reference: The masked nuclear localization signal prevents this receptor-mediated cargo import; other nuclear-pore traffic is not represented as stopped. | `src/processes/modules/rna/nuclearTransportProcess.js` |
| motorTransport | `motor=kinesin` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/rna/motorTransportProcess.js` |
| motorTransport | `motor=dynein` | condition: Dynein carries the cargo toward the microtubule minus end, reversing the default kinesin route. | `src/processes/modules/rna/motorTransportProcess.js` |
| motorTransport | `atp=available` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/rna/motorTransportProcess.js` |
| motorTransport | `atp=depleted` | reference: The selected motor lacks available ATP, so the cargo does not undergo microtubule stepping transport. | `src/processes/modules/rna/motorTransportProcess.js` |
| organelleImport | `transit=present` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/rna/organelleImportProcess.js` |
| organelleImport | `transit=absent` | reference: Without a transit peptide, the precursor does not dock and thread through the modeled chloroplast envelope import machinery. | `src/processes/modules/rna/organelleImportProcess.js` |
| translation | — | No selectable condition | `src/processes/modules/translation/translationProcess.js` |
| proteinFolding | `cycle=complete` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/translation/proteinFoldingProcess.js` |
| proteinFolding | `cycle=hold` | reference: Synthesis and local folding continue, but Hsp70 remains ADP-bound without nucleotide exchange, release or final folding. | `src/processes/modules/translation/proteinFoldingProcess.js` |
| alternativeSplicing | `isoform=include` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/translation/alternativeSplicingProcess.js` |
| alternativeSplicing | `isoform=skip` | condition: Exon skipping changes the mature RNA junctions and product; this is an alternative splice outcome. | `src/processes/modules/translation/alternativeSplicingProcess.js` |
| nitrogenFixation | `oxygen=protected` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/translation/nitrogenFixationProcess.js` |
| nitrogenFixation | `oxygen=exposed` | reference: Oxygen exposure blocks the illustrated nitrogenase pathway, preventing subsequent reduction and ammonia production. | `src/processes/modules/translation/nitrogenFixationProcess.js` |
| rnaSilencing | `pairing=seed` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/turnover/rnaSilencingProcess.js` |
| rnaSilencing | `pairing=slice` | condition: Extensive complementarity supports AGO2 cleavage of the target RNA; the default branch illustrates miRNA repression and decay regulation. | `src/processes/modules/turnover/rnaSilencingProcess.js` |
| rnaSilencing | `pairing=mismatch` | reference: Mismatched pairing does not establish stable targeting, so the modeled target repression or cleavage does not occur. | `src/processes/modules/turnover/rnaSilencingProcess.js` |
| proteasome | `tag=ubiquitin` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/turnover/proteasomeProcess.js` |
| proteasome | `tag=untagged` | reference: This substrate lacks the ubiquitin tag required by the model and does not enter unfolding, translocation or degradation. | `src/processes/modules/turnover/proteasomeProcess.js` |
| proteasome | `shell=cutaway` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/turnover/proteasomeProcess.js` |
| proteasome | `shell=whole` | Display-only cutaway/whole-shell toggle: mechanism is unchanged. | `src/processes/modules/turnover/proteasomeProcess.js` |
| crispr | `target=matched` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/turnover/crisprProcess.js` |
| crispr | `target=noPam` | reference: Without a suitable PAM, Cas9 does not establish productive DNA opening or subsequent cleavage. | `src/processes/modules/turnover/crisprProcess.js` |
| crispr | `target=mismatch` | reference: The mismatched target can open partially and transiently but does not form a productive cleavage complex. | `src/processes/modules/turnover/crisprProcess.js` |
| bacterialRepair | `lexA=wildtype` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/turnover/bacterialRepairProcess.js` |
| bacterialRepair | `lexA=noncleavable` | reference: RecA filaments can assemble, but noncleavable LexA prevents the modeled induction of SOS transcription. | `src/processes/modules/turnover/bacterialRepairProcess.js` |
| respiration | `coupling=coupled` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/energy/respirationProcess.js` |
| respiration | `coupling=leak` | reference: Electron transfer continues; proton leakage weakens the gradient and suppresses the illustrated ATP synthesis. | `src/processes/modules/energy/respirationProcess.js` |
| glycolysis | — | No selectable condition | `src/processes/modules/energy/glycolysisProcess.js` |
| bacterialEnergetics | `route=ndh1-bo` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/energy/bacterialEnergeticsProcess.js` |
| bacterialEnergetics | `route=ndh2-bd` | condition: The NDH-2–bd branch has different proton-pumping contributions from NDH-1–bo, while still supporting an electrochemical gradient for ATP synthesis. | `src/processes/modules/energy/bacterialEnergeticsProcess.js` |
| bacterialPhotosynthesis | `light=light` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/energy/bacterialPhotosynthesisProcess.js` |
| bacterialPhotosynthesis | `light=dark` | reference: Without light, the illustrated light-driven electron flow and product formation do not occur; other bacterial energy pathways are outside this model. | `src/processes/modules/energy/bacterialPhotosynthesisProcess.js` |
| diffusion | `route=water` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/membrane/diffusionProcess.js` |
| diffusion | `route=oxygen` | condition: Oxygen diffuses directly through the lipid bilayer; the water-channel route does not describe this branch. | `src/processes/modules/membrane/diffusionProcess.js` |
| diffusion | `gradient=outside` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/membrane/diffusionProcess.js` |
| diffusion | `gradient=equal` | condition: Equal concentrations retain bidirectional random exchange, with no concentration-driven net flux. | `src/processes/modules/membrane/diffusionProcess.js` |
| activeTransport | `energy=atp` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/membrane/activeTransportProcess.js` |
| activeTransport | `energy=none` | reference: The pump can remain inward-facing with sodium bound, but without ATP it cannot complete the phosphorylation-driven sodium/potassium transport cycle. | `src/processes/modules/membrane/activeTransportProcess.js` |
| osmoticBalance | `tonicity=hypotonic` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/membrane/osmoticBalanceProcess.js` |
| osmoticBalance | `tonicity=isotonic` | condition: Water still exchanges in an isotonic bath, without sustained volume change from net gain or loss. | `src/processes/modules/membrane/osmoticBalanceProcess.js` |
| osmoticBalance | `tonicity=hypertonic` | condition: A hypertonic bath drives net water loss and cell shrinkage, unlike the default hypotonic response. | `src/processes/modules/membrane/osmoticBalanceProcess.js` |
| bacterialCellWall | `antibiotic=none` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/membrane/bacterialCellWallProcess.js` |
| bacterialCellWall | `antibiotic=betaLactam` | reference: Glycan elongation can continue, but beta-lactam inhibition of transpeptidation prevents normal new crosslinks. | `src/processes/modules/membrane/bacterialCellWallProcess.js` |
| endocytosis | — | No selectable condition | `src/processes/modules/traffic/endocytosisProcess.js` |
| autophagy | — | No selectable condition | `src/processes/modules/traffic/autophagyProcess.js` |
| mitosis | `attachment=normal` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/division/mitosisProcess.js` |
| mitosis | `attachment=unattached` | reference: One kinetochore remains unattached; the checkpoint prevents anaphase separation and completion of division. | `src/processes/modules/division/mitosisProcess.js` |
| meiosis | — | No selectable condition | `src/processes/modules/division/meiosisProcess.js` |
| signalTransduction | `condition=ligand` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/signals/signalTransductionProcess.js` |
| signalTransduction | `condition=noLigand` | reference: Without ligand, the illustrated PDGF receptor activation and downstream cascade are not initiated. | `src/processes/modules/signals/signalTransductionProcess.js` |
| signalTransduction | `condition=kinaseInactive` | reference: Ligand can bind the receptor, but inactive receptor kinase cannot drive the illustrated downstream cascade. | `src/processes/modules/signals/signalTransductionProcess.js` |
| apoptosis | `condition=stress` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/signals/apoptosisProcess.js` |
| apoptosis | `condition=noStress` | reference: The unstressed control retains cell integrity without the illustrated mitochondrial permeabilization and apoptotic program. | `src/processes/modules/signals/apoptosisProcess.js` |
| differentiation | `program=competent` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/signals/differentiationProcess.js` |
| differentiation | `program=impaired` | reference: With the erythroid maturation program impaired, hemoglobin accumulation and enucleation do not complete as in the normal branch. | `src/processes/modules/signals/differentiationProcess.js` |
| immuneResponse | `epitope=matched` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/signals/immuneResponseProcess.js` |
| immuneResponse | `epitope=unmatched` | reference: The peptide is still loaded and presented by MHC-I, but this TCR does not recognize it and productive T-cell activation is not established. | `src/processes/modules/signals/immuneResponseProcess.js` |
| actionPotential | `stimulus=on` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/neurons/actionPotentialProcess.js` |
| actionPotential | `stimulus=off` | reference: Without the triggering stimulus, the axon remains at rest and the illustrated action potential does not propagate. | `src/processes/modules/neurons/actionPotentialProcess.js` |
| synapse | `calcium=available` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/neurons/synapseProcess.js` |
| synapse | `calcium=blocked` | reference: Blocking calcium influx prevents the illustrated calcium-dependent vesicle fusion and postsynaptic response. | `src/processes/modules/neurons/synapseProcess.js` |
| muscle | `calcium=released` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/neurons/muscleProcess.js` |
| muscle | `calcium=low` | reference: Low calcium maintains thin-filament inhibition, preventing the illustrated crossbridge cycle and sarcomere shortening. | `src/processes/modules/neurons/muscleProcess.js` |
| ciliaryMotion | `atp=available` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/neurons/ciliaryMotionProcess.js` |
| ciliaryMotion | `atp=absent` | reference: Without ATP, dynein cannot drive the illustrated constrained microtubule sliding and the cilium does not beat. | `src/processes/modules/neurons/ciliaryMotionProcess.js` |
| plasmolysis | `bath=recover` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantWater/plasmolysisProcess.js` |
| plasmolysis | `bath=hold` | reference: The sustained hypertonic bath keeps the protoplast contracted; the later recovery after bath dilution is not performed. | `src/processes/modules/plantWater/plasmolysisProcess.js` |
| stomata | `signal=aba` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantWater/stomataProcess.js` |
| stomata | `signal=light` | condition: Continued light maintains guard-cell turgor and the open pore instead of switching to the ABA closure branch. | `src/processes/modules/plantWater/stomataProcess.js` |
| plantLongDistanceTransport | `stomata=close` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantWater/plantLongDistanceTransportProcess.js` |
| plantLongDistanceTransport | `stomata=open` | condition: Open stomata sustain transpiration pull and modeled water flow without the reduction caused by closure in the default branch. | `src/processes/modules/plantWater/plantLongDistanceTransportProcess.js` |
| chloroplastMovement | `genotype=wild` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantWater/chloroplastMovementProcess.js` |
| chloroplastMovement | `genotype=phot2` | reference: Loss of phot2 retains weak-light accumulation but impairs strong-light avoidance toward the anticlinal walls. | `src/processes/modules/plantWater/chloroplastMovementProcess.js` |
| plantDivision | — | No selectable condition | `src/processes/modules/plantGrowth/plantDivisionProcess.js` |
| cellWallGrowth | `extensibility=yielding` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantGrowth/cellWallGrowthProcess.js` |
| cellWallGrowth | `extensibility=restrained` | reference: New wall material can still be deposited, but restrained wall yielding limits extension; synthesis alone does not imply cell elongation. | `src/processes/modules/plantGrowth/cellWallGrowthProcess.js` |
| doubleFertilization | `assignment=frontEgg` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantGrowth/doubleFertilizationProcess.js` |
| doubleFertilization | `assignment=frontCentral` | condition: Swapping sperm assignments still produces one fusion with the egg and one with the central cell, establishing 2n embryo and 3n endosperm lineages. | `src/processes/modules/plantGrowth/doubleFertilizationProcess.js` |
| fungalHyphae | `delivery=normal` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantGrowth/fungalHyphaeProcess.js` |
| fungalHyphae | `delivery=reduced` | condition: Reduced vesicle supply weakens tip delivery and extension; the model slows growth rather than stopping it completely. | `src/processes/modules/plantGrowth/fungalHyphaeProcess.js` |
| auxin | `auxin=present` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantSignals/auxinProcess.js` |
| auxin | `auxin=low` | reference: At low auxin, Aux/IAA repression persists without the induced degradation and ARF target activation. | `src/processes/modules/plantSignals/auxinProcess.js` |
| plantDefense | `ligand=flg22` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantSignals/plantDefenseProcess.js` |
| plantDefense | `ligand=absent` | reference: Without flg22, this model does not initiate FLS2–BAK1 assembly or the downstream reactive-oxygen response; other immune pathways are outside its scope. | `src/processes/modules/plantSignals/plantDefenseProcess.js` |
| plantTransport | `energy=available` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantConnections/plantTransportProcess.js` |
| plantTransport | `energy=depleted` | reference: This control starts without a proton gradient. Without ATP the pump does not establish one, so SUC2 cannot complete the illustrated sucrose uptake. | `src/processes/modules/plantConnections/plantTransportProcess.js` |
| plasmodesmata | `gate=open` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantConnections/plasmodesmataProcess.js` |
| plasmodesmata | `gate=callose` | reference: Callose narrows the neck and restricts the illustrated small-solute passage; it does not define a universal permeability threshold for proteins or RNA. | `src/processes/modules/plantConnections/plasmodesmataProcess.js` |
| photorespiration | `glyk=active` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantConnections/photorespirationProcess.js` |
| photorespiration | `glyk=absent` | reference: Upstream C2 salvage proceeds, but without GLYK glycerate cannot complete the final phosphorylation back to 3-PGA. | `src/processes/modules/plantConnections/photorespirationProcess.js` |
| c4cam | `strategy=c4` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/plantConnections/c4camProcess.js` |
| c4cam | `strategy=cam` | condition: CAM separates carbon uptake and acid storage at night from daytime decarboxylation for Rubisco; the C4 mesophyll–bundle-sheath spatial route does not apply. | `src/processes/modules/plantConnections/c4camProcess.js` |
| lacOperon | `lactose=present` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/operons/lacOperonProcess.js` |
| lacOperon | `lactose=absent` | reference: Without lactose, LacI repression persists and induction is not established; basal leaky expression is not claimed to be absolutely zero. | `src/processes/modules/operons/lacOperonProcess.js` |
| lacOperon | `glucose=low` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/operons/lacOperonProcess.js` |
| lacOperon | `glucose=high` | condition: With lactose present and high glucose, LacI can be relieved but CAP–cAMP stimulation is reduced, giving weaker rather than fully absent expression. | `src/processes/modules/operons/lacOperonProcess.js` |
| trpOperon | `tryptophan=low` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/operons/trpOperonProcess.js` |
| trpOperon | `tryptophan=high` | condition: High free tryptophan activates TrpR to repress initiation; normal tRNA charging also allows termination in the separately shown initiated leader RNA. | `src/processes/modules/operons/trpOperonProcess.js` |
| trpOperon | `charging=normal` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/operons/trpOperonProcess.js` |
| trpOperon | `charging=limited` | condition: Limited tRNA-Trp charging stalls the leader ribosome and favors antitermination; when free tryptophan is high, TrpR still represses initiation. | `src/processes/modules/operons/trpOperonProcess.js` |
| yeastGal | `galactose=present` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/operons/yeastGalProcess.js` |
| yeastGal | `galactose=absent` | reference: Without galactose, Gal80 continues to repress Gal4 and the illustrated GAL transcriptional induction is not established. | `src/processes/modules/operons/yeastGalProcess.js` |
| yeastGal | `glucose=low` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/operons/yeastGalProcess.js` |
| yeastGal | `glucose=high` | reference: With galactose, Gal80 repression can be relieved, but high-glucose Mig1-associated repression still prevents the modeled GAL induction. | `src/processes/modules/operons/yeastGalProcess.js` |
| yeastOsmoregulation | `osmolarity=high` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/operons/yeastOsmoregulationProcess.js` |
| yeastOsmoregulation | `osmolarity=unchanged` | reference: Without a hyperosmotic shock, the illustrated water-loss, Hog1 activation and adaptive glycerol accumulation sequence is not initiated. | `src/processes/modules/operons/yeastOsmoregulationProcess.js` |
| yeastOsmoregulation | `hog1=active` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/operons/yeastOsmoregulationProcess.js` |
| yeastOsmoregulation | `hog1=inhibited` | reference: Hyperosmotic water loss and early Fps1 closure still occur, with basal glycerol retained; nonphosphorylatable Hog1 blocks adaptive glycerol accumulation and volume recovery. | `src/processes/modules/operons/yeastOsmoregulationProcess.js` |
| bacterialExpression | `sigma=present` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/bacterialCore/bacterialExpressionProcess.js` |
| bacterialExpression | `sigma=absent` | reference: Without sigma factor, the modeled promoter-specific initiation does not establish subsequent mRNA synthesis and coupled translation. | `src/processes/modules/bacterialCore/bacterialExpressionProcess.js` |
| bacterialDivision | `septalSynthesis=active` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/bacterialCore/bacterialDivisionProcess.js` |
| bacterialDivision | `septalSynthesis=blocked` | reference: Chromosome replication, segregation and early divisome assembly can proceed, but blocked septal synthesis prevents completion of envelope constriction and division. | `src/processes/modules/bacterialCore/bacterialDivisionProcess.js` |
| conjugation | `oriT=intact` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/bacterialCore/conjugationProcess.js` |
| conjugation | `oriT=blocked` | reference: Cell contact can form, but blocked oriT processing prevents initiation of the illustrated single-stranded DNA transfer. | `src/processes/modules/bacterialCore/conjugationProcess.js` |
| transformation | `homology=matched` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/bacterialCore/transformationProcess.js` |
| transformation | `homology=absent` | reference: Environmental DNA can still be taken up, but without homology it does not integrate stably into the modeled chromosome. | `src/processes/modules/bacterialCore/transformationProcess.js` |
| chemotaxis | `environment=gradient` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/bacterialSignals/chemotaxisProcess.js` |
| chemotaxis | `environment=uniform` | condition: Cells still run and tumble in a uniform environment, without a gradient-directed bias; the path is schematic. | `src/processes/modules/bacterialSignals/chemotaxisProcess.js` |
| twoComponent | `nitrate=present` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/bacterialSignals/twoComponentProcess.js` |
| twoComponent | `nitrate=absent` | reference: Without nitrate, the illustrated induced NarX–NarL phosphotransfer and target transcription are not established. | `src/processes/modules/bacterialSignals/twoComponentProcess.js` |
| quorumSensing | `exchange=retained` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/bacterialSignals/quorumSensingProcess.js` |
| quorumSensing | `exchange=diluted` | reference: Signal can still be produced and diffuse, but continued dilution prevents the illustrated local accumulation, LuxR activation and luminescence. | `src/processes/modules/bacterialSignals/quorumSensingProcess.js` |
| biofilm | `cue=NO` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/bacterialSignals/biofilmProcess.js` |
| biofilm | `cue=none` | reference: Attachment and aggregate formation continue; without the NO cue, the illustrated later local dispersal does not occur. | `src/processes/modules/bacterialSignals/biofilmProcess.js` |
| yeastBudding | — | No selectable condition | `src/processes/modules/yeastLife/yeastBuddingProcess.js` |
| yeastFermentation | `condition=anaerobic` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/yeastLife/yeastFermentationProcess.js` |
| yeastFermentation | `condition=aerobic` | condition: High sugar is still supplied: yeast can ferment aerobically through the Crabtree effect; the parallel respiration branch is not expanded here. | `src/processes/modules/yeastLife/yeastFermentationProcess.js` |
| yeastMating | `partner=compatible` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/yeastLife/yeastMatingProcess.js` |
| yeastMating | `partner=same` | reference: The same-type a/a control does not establish complementary mating recognition or fusion; mating-type switching is outside this model. | `src/processes/modules/yeastLife/yeastMatingProcess.js` |
| yeastSporulation | `nutrients=starved` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/yeastLife/yeastSporulationProcess.js` |
| yeastSporulation | `nutrients=rich` | reference: The nutrient-rich control does not enter this model’s starvation-induced meiosis and ascospore formation pathway. | `src/processes/modules/yeastLife/yeastSporulationProcess.js` |
| parameciumFeeding | — | No selectable condition | `src/processes/modules/parameciumLife/parameciumFeedingProcess.js` |
| contractileVacuole | `osmotic=freshwater` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/parameciumLife/contractileVacuoleProcess.js` |
| contractileVacuole | `osmotic=mild` | condition: A milder hypotonic load reduces water entry and slows the contractile-vacuole cycle; chapter timing explains the mechanism rather than measuring discharge frequency. | `src/processes/modules/parameciumLife/contractileVacuoleProcess.js` |
| parameciumDivision | — | No selectable condition | `src/processes/modules/parameciumLife/parameciumDivisionProcess.js` |
| parameciumConjugation | — | No selectable condition | `src/processes/modules/parameciumLife/parameciumConjugationProcess.js` |
| phageLytic | — | No selectable condition | `src/processes/modules/phageLife/phageLyticProcess.js` |
| phageLysogenic | `fate=induce` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/phageLife/phageLysogenicProcess.js` |
| phageLysogenic | `fate=maintain` | reference: The prophage is inherited through host replication and division, but without induction lysogeny persists without excision, progeny assembly or lysis. | `src/processes/modules/phageLife/phageLysogenicProcess.js` |
| phageAssembly | `protease=active` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/phageLife/phageAssemblyProcess.js` |
| phageAssembly | `protease=inactive` | reference: The prohead scaffold remains and head maturation and packaging stall; independent tail assembly can continue, but complete progeny do not form. | `src/processes/modules/phageLife/phageAssemblyProcess.js` |
| phagePackaging | `atp=present` | Default condition: ordinary chapters apply; other changed controls can still produce a note. | `src/processes/modules/phageLife/phagePackagingProcess.js` |
| phagePackaging | `atp=absent` | reference: DNA and packaging machinery can dock, but ATP-driven translocation, headful cleavage and subsequent sealing do not occur. | `src/processes/modules/phageLife/phagePackagingProcess.js` |

## Combined controls

- Motor ATP depletion takes priority over the dynein direction note.
- Lac: absent lactose remains repressed at either glucose level; high glucose with lactose gives weaker expression, not zero.
- GAL: absent galactose retains Gal80 repression; with galactose and high glucose, Mig1 repression remains.
- trp: high free tryptophan can repress initiation while restricted tRNA charging promotes antitermination of the separately illustrated initiated leader.
- HOG: unchanged osmolarity takes priority; nonphosphorylatable Hog1 under stress retains water loss, early Fps1 closure and basal glycerol.
- Diffusion route and equal-gradient explanations combine. Proteasome shell visibility does not alter substrate-tag eligibility.

The control manifest test loads the actual 84 definitions and fails on unreviewed controls or option changes. Null/unknown parameters fall back to declared defaults. No note is shown for unknown processes.
