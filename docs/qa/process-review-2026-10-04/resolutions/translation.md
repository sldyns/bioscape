# Translation group — Phase B resolution

All four Phase A issues are repaired locally: 3 P1 and 1 P2. Phase A reports and earlier evidence are retained unchanged. No shared code, runner, browser or full-workspace suite was operated.

## 20261004-translation-01 — fixed

Keep post-release P-site tRNA and release factor visible through progress 1, matching the stated boundary before recycling. The final complex no longer vanishes at .99.

- Actual tRNA/factor effective visibility and world positions stay identical at .989999/.99/.999999/1 for every registered root.
- New mutation regression hides the terminal tRNA and is rejected.
- Existing full RNA-backbone/CCA, ester, new-peptide bond, corridor and 4UG0 coordinate/gap regressions remain. The old A-tRNA end-visibility expectation was updated from hidden at .99 to retained; its effective-visibility assertion was preserved and now enforces the corrected terminal behavior.

## 20261004-translation-02 — fixed

Reverse only the angular orientation of manually constructed final client alpha helix and all three Hsp70 lid helices. Endpoints, helix count, chain detail and chaperone motion remain intact. Add stable geometry names for direct regressions and scientific source links.

- Final client actual bead-coordinate consecutive-edge triples are positive (minimum about +0.0031778853).
- All three lid helices are verified from averaged rings of actual TubeGeometry vertices in world coordinates, throughout both cycle branches and all roots.
- Known right-handed control and its reflected counterpart calibrate the handedness test. Reflecting the repaired client helix is rejected.
- Every peptide backbone segment remains joined to its same adjacent beads; original 4UG0 common transform/gap test passes.

## 20261004-translation-03 — fixed

Precompute branch-ready, ligation-ready and product conformations for both isoforms. RNA endpoints approach before the first and second bond exchanges; flanking exon endpoints follow their covalent intron partners until cleavage. Short branch links replace overlapping endpoints. Only after ligation does the connected mature RNA move to its final presentation position.

- Every visible branch bond is .1 scene unit long, including the first visible frame at .34; partners are already apposed at .33.
- Every new exon bond is .1 scene unit long before, at and after the .59 ligation switch, including both inclusion junctions and the skip junction.
- Scissile donor/acceptor endpoints stay within .15 while their original covalent bonds are present. All actual cylinder endpoints match the correct RNA beads.
- Both isoforms tested at 201 uniform samples plus exact boundary samples, preserving donor-cut then acceptor-cut order and distinct retained/excised sequences.
- Fault injection displaces exon 8 and reattaches affected cylinders, recreating remote chemistry without detached-endpoint errors; the remote-ligation assertion rejects it.

## 20261004-translation-04 — fixed

Use the same two nitrogen meshes for N2 and both NH3 products. Remove duplicated product nitrogen meshes, transfer existing atoms continuously from substrate positions to product positions, and grow hydrogen/bond symbols from zero at conversion. N2 bonds retire when conversion begins; the exposed branch keeps substrate and no products.

- Exactly two effectively visible nitrogen spheres with identical UUIDs across every tested progress value and both oxygen branches.
- Explicit .79999999/.8/.80000001/.805/.80999999/.81/.81000001 checks reject the original overlap interval.
- Nitrogen position and radius changes across conversion +/-1e-8 are below 1e-6; each NH3 hydrogen-group origin tracks its persistent nitrogen atom.
- Both NH3 groups and H2 coproduct are absent under exposed condition.
- Adding a duplicate nitrogen mesh at .805 is rejected.

## Validation and integration

- New regression: `src/processes/modules/translation/review20261004.test.mjs` (root should integrate into the shared runner).
- Existing science suite: 14 root/control combinations, 2,814 frames passed; all source-coordinate, continuity, finite-resource and mutation checks retained.
- Group refinement smoke: 9 model/root pairs passed, including all condition options and browser-target module bundling.
- Owned-file Prettier check and whitespace diff check passed.
- [Post-repair geometry and identity measurements](../evidence/translation/phase-b-measurements.json)
- [New regression log](../evidence/translation/phase-b-review-test.log)
- [Existing science regression log](../evidence/translation/phase-b-science-test.log)
- [Refinement smoke log](../evidence/translation/phase-b-refinement-smoke.log)

Root still owns browser visuals and continuous playback acceptance. Suggested inspection intervals are recorded in the structured report. No physical-device, performance, deployment or publication acceptance is claimed.

## Supplemental repair after rendered review

Four additional P2 anchor defects were found in the integrated stage samples. Original Phase A files remain immutable. Molecular targets now follow actual rendered geometry and current transforms, while shared layout owns text positioning.

- **20261004-translation-05 (translation) — fixed:** Bind the N callout to peptide bead 25, mRNA ends to actual tube endpoints, factor to its head and exit-path callout to a rendered guide center. Solve the fixed E/P/A x positions on the moving actual mRNA curve. PTC/reference-body labels use their real centers.
- **20261004-translation-06 (proteinFolding) — fixed:** Attach N/hydrophobic/fold/outlet callouts to actual client beads. Hsp70 targets a rendered substrate-binding sheet vertex; J protein and exchange-factor targets follow their molecular centers; ADP targets the actual nucleotide base under Hsp70 transforms.
- **20261004-translation-07 (alternativeSplicing) — fixed:** Bind exon/intron and terminal labels to current RNA beads, mature RNA to an actual retained exon junction, branch label to its real branch marker, and spliceosome label to a rendered scaffold vertex. Both isoforms use their same actual geometry after every seek.
- **20261004-translation-08 (nitrogenFixation) — fixed:** Bind FeMo to its actual cluster center and P-cluster to a named real cluster group with unchanged world coordinates/topology. NH3 follows one of the same two persistent nitrogen atoms throughout conversion; H2 follows its molecular center and is annotated only while visible. Protein surfaces, donor and nucleotide use actual rendered geometry/centers.

The new actual-anchor regression passes all 14 root/control combinations and 2912 sampled frames, plus irregular seek sequences and four restored-offset mutations. Existing scientific/geometry suites also pass. The rendered review and new findings are retained in [translation-rendered.md](translation-rendered.md) and [repair-discoveries.md](../evidence/translation/repair-discoveries.md).

Post-fix integrated screenshots, text-box avoidance and continuous playback remain pending root verification. This update does not claim completion of those gates.
