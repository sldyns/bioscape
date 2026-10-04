# bacterialCore repair-time discovery

Phase A remains unchanged. Additional finding: **20261004-bacterialCore-03 · P1 · environmental DNA has left-handed geometry**.

The original `externalPoint` coordinates use increasing x with y proportional to sine and z proportional to cosine. Consecutive actual world-space cylinder endpoints yield a consistently negative scalar triple product, `−2.01480598966e−6`. This is unaffected by camera orientation or strand traversal reversal.

The [opened primary 1BNA entry](https://www.rcsb.org/structure/1BNA) identifies its experimental duplex as right-handed B-DNA. Applying the same scalar-triple convention to its corresponding phosphate positions at stride 3 gives positive values `5245.50–5726.06`. Full coordinates are retained in `1BNA.pdb`, with SHA256 and baseline/current measurements in `phase-b-probe-results.json`. Atomic backbone fluctuations make individual single-residue torsions nonuniform; the stride-3 comparison resolves the helical direction without claiming uniform atomic torsion.

The corrected external frame reverses only its transverse cosine sign. Both actual displayed backbones now give `+2.01480598966e−6`; the uptake endpoints and strand identities are retained. The new local regression inspects both backbones and rejects a reflected actual mesh as a negative control. This additional issue is accounted for once in the resolution's issue list.

## Integration-stage annotation findings

The four supplied seven-frame sheets and four 960×640 originals were inspected. Their named-object leaders retained old text-placement offsets. `ProcessScene.jsx` consumes these positions as leader endpoints, making the free-space anchors misleading. Each issue below is fixed and appears once in the resolution list; the original Phase A and issue -03 remain intact.

| Issue | Process and concrete witness | Correction |
| --- | --- | --- |
| 20261004-bacterialCore-04 · P2 | Expression at p=1: mRNA 5′ leader is .25 world units below the actual RNA end; peptide and DNA-strand leaders also terminate in empty space. | Actual RNA end, template/coding cylinders, RNAP/sigma/70S components and visible peptide beads provide anchors. |
| 20261004-bacterialCore-05 · P2 | Division at p=.185: fork leader is 2.00659 units from the actual replication fork; chromosome and daughter labels retain off-object positions. | Dynamic forks, DNA, membrane vertices and visible division proteins provide anchors. |
| 20261004-bacterialCore-06 · P2 | Conjugation at p=.505: T-strand leader is 1.25941 units from the actual leading TraI; the p=0 pilus label describes an unextended structure. | Anchors follow the actual pilus, oriT, junction, TraI and synthesized strands. Pilus and transfer labels obey their visible states. |
| 20261004-bacterialCore-07 · P2 | Transformation at p=.525: ComEC leader is .78302 units from the selected actual rim; environmental-DNA label remains after its geometry vanishes at p=.575. | Actual pore, DNA, DprA/RecA, fragments and chromosome anchors; no absent-object labels. No-homology outcome explicitly identifies the retained chromosome. |

Before/after world measurements are retained in `labels-probe-results.json`; every selected corrected witness gap is zero. The dedicated regression covers 208 model/condition/progress states, deterministic label seeks and six negative controls. Updated rendered screenshots remain the root integrator's acceptance gate.
