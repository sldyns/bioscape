# Translation group — supplementary rendered discoveries

Four default-English first-root contact sheets (28 indexed frames) plus seven original 960x640 WEBPs. This reviewer did not operate the browser or watch all full videos. Original samples preceded these anchor fixes.

Phase A audit files remain unchanged. These findings were recorded after the root supplied the integrated rendered gallery. Product writes remained held until root explicitly released them after switching capture to the non-HMR service.

## 20261004-translation-05 — translation (P2)

Rendered end-frame leaders for E/P/A end beneath mRNA, and the exit-path/factor leaders retain text-layout offsets. The N label adds y=.2 and replaces actual z with .2; terminal RNA labels add horizontal layout drift.

Source: src/processes/modules/translation/translationReaction.js.

- [Original frame](../browser/full-a-retry-010-translation-cell-end.webp)

Repair: Bind the N callout to peptide bead 25, mRNA ends to actual tube endpoints, factor to its head and exit-path callout to a rendered guide center. Solve the fixed E/P/A x positions on the moving actual mRNA curve. PTC/reference-body labels use their real centers.

## 20261004-translation-06 — proteinFolding (P2)

At progress 0, N label [2.7,.8,.5] is 1.3892929 units from actual terminal bead75 [2.56,-.56305155,.27059801]. Hydrophobic label [-.04,.6,.5] is 1.0884029 units from highlighted bead40 [.08666667,-.3269089,-.056252]. Their leaders visibly end above the chain.

Source: src/processes/modules/translation/proteinFoldingProcess.js.

- [Original frame](../browser/full-a-retry-011-proteinFolding-cell-start.webp)
- [Original frame](../browser/full-a-retry-011-proteinFolding-cell-end.webp)

Repair: Attach N/hydrophobic/fold/outlet callouts to actual client beads. Hsp70 targets a rendered substrate-binding sheet vertex; J protein and exchange-factor targets follow their molecular centers; ADP targets the actual nucleotide base under Hsp70 transforms.

## 20261004-translation-07 — alternativeSplicing (P2)

At progress 1, exon6 label [-1.65,-1.3,.4] lies .55 below and .3 in front of its actual bead7 [-1.65,-.75,.1]. Exon8 has the same offset. Mature RNA ends farther below RNA; introns point above their segments and spliceosome caption anchors empty space.

Source: src/processes/modules/translation/alternativeSplicingProcess.js.

- [Original frame](../browser/full-a-retry-012-alternativeSplicing-cell-stage-4.webp)
- [Original frame](../browser/full-a-retry-012-alternativeSplicing-cell-end.webp)

Repair: Bind exon/intron and terminal labels to current RNA beads, mature RNA to an actual retained exon junction, branch label to its real branch marker, and spliceosome label to a rendered scaffold vertex. Both isoforms use their same actual geometry after every seek.

## 20261004-translation-08 — nitrogenFixation (P2)

P-cluster leader points into beta interior rather than the actual cluster center [0,.04,.49]. FeMo label [.1,1.24,.65] is .848528 from actual cluster [.1,.64,.05]. At progress .845 the NH3 target remains [3.3,.5,.2] while N atoms are near [.699,.9025,.34875] and [.8854,.715,.34875]. An end-frame FeMo box also overlaps upper NH3; layout avoidance must be re-reviewed after anchor correction.

Source: src/processes/modules/translation/nitrogenFixationProcess.js.

- [Original frame](../browser/full-a-retry-013-nitrogenFixation-bacterium-stage-6.webp)
- [Original frame](../browser/full-a-retry-013-nitrogenFixation-bacterium-end.webp)

Repair: Bind FeMo to its actual cluster center and P-cluster to a named real cluster group with unchanged world coordinates/topology. NH3 follows one of the same two persistent nitrogen atoms throughout conversion; H2 follows its molecular center and is annotated only while visible. Protein surfaces, donor and nucleotide use actual rendered geometry/centers.

## Verification

All 14 registered root/control combinations, 2912 sampled frames plus irregular seek sequences; actual beads, tube ring vertices, metal-cluster atoms, BufferGeometry vertices, active-target visibility, and fixed-site versus moving-mRNA behavior. Restored former offsets in all four models are rejected.

This verifies targets, not label-box collision avoidance or continuous rendered playback. Root will capture integrated post-fix scenes.

[Actual-anchor regression](../../../../../src/processes/modules/translation/labelAnchors20261004.test.mjs) · [Test receipt](anchor-geometry-test.log)
