# bacterialSignals · Phase A · 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Read-only product/test audit. Four models, all registered only under `bacterium`; eight condition branches. **Three confirmed-issue models, one qualified pass; three P1 and two P2 findings.**

Existing group science/smoke tests pass. New actual-geometry checks reveal failures outside those tests. Every branch was sampled at 101 progress values for finite buffers and stable inventories; irregular seeks reproduced state. These checks are not browser or scientific acceptance.

## chemotaxis — confirmed_issue

E. coli peritrichous run/tumble chemotaxis; environment=gradient or uniform, default gradient; no root-specific text or geometry overrides.

### 20261004-bacterialSignals-01 · P1 · scientific_geometry

`src/processes/modules/bacterialSignals/chemotaxisProcess.js` — point(), lines 318-340; stage at 0.75, lines 61-66

The selected filament uses twist = 36 - 60 * deformation. Distal actual mesh endpoints give normal pitch 0.460132 at p=0.70 and the labeled semicoiled pitch 0.690198 at p=0.79; ratio 1.500000, with unchanged radius 0.12. See evidence/bacterialSignals/flagellar-pitch.json.

The named normal-to-semicoiled transition gets handedness right but changes pitch in the wrong direction. The opened Darnton experiment describes the semicoiled form as having about half the normal pitch, whereas the scene makes it 50% longer. This is a concrete morphology mismatch, independent of molecular scale.

**Repair:** Rebuild the selected filament polymorphic interpolation so the final right-handed semicoiled state has shorter pitch at similar radius, while preserving hooks, complete filament continuity, CW reversal and CCW recovery.

**Verify:** Measure pitch from actual transformed segment endpoints in all tumble intervals of both conditions; expect semicoiled/normal approximately 0.5, correct torsion sign, connected hooks and no boundary jumps.

### 20261004-bacterialSignals-02 · P2 · visible_motion_discontinuity

`src/processes/modules/bacterialSignals/chemotaxisProcess.js` — update(), lines 364-367

Each visible CheY-P sphere uses q=(p*2+i*0.19)%1 and resets from about (-0.70,-0.48,0.6) to (0.65,-0.10,0.6). At gradient p=0.5 the same visible sphere jumps 1.402462 units over progress +/-1e-7; 16 visible reset events occur across both options.

A continuously visible, fully opaque representative signaling particle teleports across the exposed cell. Repeated schematic flow is allowed, but the on-screen discontinuity is not concealed by a reaction, occlusion, or an exit/reentry transition.

**Repair:** Keep representative flow but make its recycling visually continuous, e.g. a continuous curved return route or explicit smooth turnover/appearance at the reaction sites. Avoid hiding the entire process or changing the CheY-P concentration branch.

**Verify:** Probe every modulus boundary and ordinary frames in both options. A particle may relocate only when smoothly negligible/invisible; otherwise adjacent visible world positions must converge as delta progress tends to zero.

Opened primary sources: [On Torque and Tumbling in Swimming Escherichia coli](https://journals.asm.org/doi/10.1128/jb.01501-06).

Review limits: No browser or rendered acceptance was performed by this reviewer; root must inspect playback, occlusion and label clarity. Shapes and time courses are schematic; no claim of atomistic dynamics, exact kinetics or absolute molecular stoichiometry is made. Source-backed morphology and sign checks do not verify physiological flagellar contour mechanics or real swimming kinematics.

## twoComponent — confirmed_issue

Anaerobic E. coli NarX-NarL branch with active FNR assumed; nitrate present/absent; NarQ/NarP and basal activity explicitly omitted rather than set biologically to zero.

### 20261004-bacterialSignals-03 · P1 · molecular_attachment

`src/processes/modules/bacterialSignals/twoComponentProcess.js` — NarX construction lines 123-164; fixed His site lines 185-188; update lines 240-267

Both actual NarX protein groups end at z=0.132023, while the His torus begins at z=0.276224: separating-plane gap >=0.144201. Its center is 0.293552 units from the nearest actual NarX triangle surface. At p=0.35-0.62 the donor phosphate is placed on/near this floating site; His/Asp marker distance 0.116619 passes existing tests even though the donor site is detached from its kinase.

The lesson claims a covalently phosphorylated residue of NarX and direct transfer from that kinase. A detached donor ring plus a spatially disconnected phosphomarker represents phosphorylation in empty space. The ring has no connecting residue, pocket or separate reaction inset that would establish ownership.

**Repair:** Attach a clearly visible His-bearing side chain/pocket to the NarX cytoplasmic scaffold and derive ATP, phosphate and NarL encounter positions from that actual moving donor. Preserve the single-phosphate handoff and departing Asp attachment.

**Verify:** Test actual protein-to-residue connectivity/surface intersection in addition to donor-to-acceptor distance. Confirm donor marker attachment through receptor conformational movement; conserve the three ATP/ADP/phosphoryl spheres and verify transfer and departure.

Opened primary sources: [Signal-Dependent Phosphorylation of the Membrane-Bound NarX Two-Component Sensor-Transmitter Protein of Escherichia coli](https://journals.asm.org/doi/10.1128/jb.181.17.5309-5316.1999).

Review limits: No browser or rendered acceptance was performed by this reviewer; root must inspect playback, occlusion and label clarity. Shapes and time courses are schematic; no claim of atomistic dynamics, exact kinetics or absolute molecular stoichiometry is made. A canonical biochemical branch is isolated; no full Nar cross-regulatory network or phosphatase cycle is depicted.

## quorumSensing — confirmed_issue

Aliivibrio/Vibrio fischeri LuxI-LuxR, 3-oxo-C6-HSL and luxICDABEG; retained versus diluted signal at fixed cell number; permissive oxygen, substrates and other regulatory conditions.

### 20261004-bacterialSignals-04 · P1 · molecular_contact

`src/processes/modules/bacterialSignals/quorumSensingProcess.js` — LuxR DNA-binding helices lines 197-214; docking update lines 289-293; transcription start lines 296-301

After docking (p=0.68 through 1), LuxR stays at z=0.46. Its whole mesh minimum z is 0.26, while all DNA mesh maximum z is 0.190973: a guaranteed gap >=0.069027. The actual DNA-binding helices begin at z=0.475005, at least 0.284033 ahead of any DNA geometry, despite luxBoxOccupied and transcription output.

The protein never physically contacts the regulatory DNA, although that binding is the mechanism the stage explicitly teaches. Projected x/y alignment and userData occupancy do not establish a bound complex in this rotatable 3D scene.

**Repair:** Dock the actual LuxR C-terminal binding helices to the lux-box duplex surface in 3D and derive the activated transcription state only after contact. Preserve ligand pocket detail and an unobstructed polymerase route.

**Verify:** Measure contact between actual DNA-binding-domain geometry and the intended lux-box DNA region throughout occupied states; diluted branch must remain undocked. Verify intermediate approach, deterministic seeking, correct DNA handedness and RNA topology.

### 20261004-bacterialSignals-05 · P2 · visible_motion_discontinuity

`src/processes/modules/bacterialSignals/quorumSensingProcess.js` — AHL update lines 266-287

The first five AHLs follow q=(p*0.75+i*0.137)%1. Particles 2/3/4 jump 3.600320-3.603670 units at p=0.968, 0.785333 and 0.602667 while visible on both sides, in both retained and diluted options. They cross the focal-cell/community area without any fade, material transparency or off-scene handoff.

The same fully visible AHL icon instantly returns across much of the scene. This is a playback discontinuity in a representative diffusion path, rather than an intentional microscopic diffusion claim.

**Repair:** Replace the visible discontinuous recycling with a closed/continuous diffusion illustration or smooth entrance and exit, retaining accumulation versus dilution, ligand identity and unchanged population size.

**Verify:** At every recycling boundary in both conditions require continuous visible world-space trajectories or smooth disappearance before relocation and reappearance afterward; keep signaling branch outcomes and stable resources.

Opened primary sources: [Reversible Acyl-Homoserine Lactone Binding to Purified Vibrio fischeri LuxR Protein](https://journals.asm.org/doi/10.1128/jb.186.3.631-637.2004).

Review limits: No browser or rendered acceptance was performed by this reviewer; root must inspect playback, occlusion and label clarity. Shapes and time courses are schematic; no claim of atomistic dynamics, exact kinetics or absolute molecular stoichiometry is made. The scene is one LuxI-LuxR branch, not the entire V. fischeri signaling network.

## biofilm — qualified_pass

Nonmucoid Pseudomonas aeruginosa PAO1, selected attached aggregate route with Psl/eDNA/protein matrix, low-level NO or no-added-cue branches; no mandatory universal lifecycle claim.

No new confirmed scientific or attachment error. Actual eDNA geometry, local release dependencies, maintained matrix and both cue branches passed the bounded checks. Detailed NO effectors and division lineage remain explicit abstractions. Whole-fiber visibility changes need root playback judgment.

Opened primary sources: [Assembly and Development of the Pseudomonas aeruginosa Biofilm Matrix](https://journals.plos.org/plospathogens/article?id=10.1371/journal.ppat.1000354), [Nitric Oxide Signaling in Pseudomonas aeruginosa Biofilms Mediates Phosphodiesterase Activity, Decreased Cyclic Di-GMP Levels, and Enhanced Dispersal](https://journals.asm.org/doi/10.1128/jb.00975-09), [Untethering and Degradation of the Polysaccharide Matrix Are Essential Steps in the Dispersion Response of Pseudomonas aeruginosa Biofilms](https://journals.asm.org/doi/10.1128/jb.00575-19).

Review limits: No browser or rendered acceptance was performed by this reviewer; root must inspect playback, occlusion and label clarity. Shapes and time courses are schematic; no claim of atomistic dynamics, exact kinetics or absolute molecular stoichiometry is made. Detailed NO receptor/PDE network, c-di-GMP effectors, CdrA untethering and hydrolase chemistry are omitted. The permissive arrow does not assert that low c-di-GMP alone always suffices.

## Evidence and next gate

- `../evidence/bacterialSignals/phase-a-diagnostics.json`: actual contact gaps, all visible recycling jumps, registered roots, fiber dependencies, finite/resource/determinism checks.
- `../evidence/bacterialSignals/flagellar-pitch.json`: measured distal mesh pitch (normal 0.460132, semicoiled 0.690198, recovery 0.460132).
- `../evidence/bacterialSignals/existing-tests.log`: existing local suite passes.
- Reproduction scripts are beside the JSON evidence. Failed PMC/Europe PMC access attempts are retained in `opened-sources.json`; successful publisher reads and support notes are separately recorded in `primary-source-support.json`.

Await root Phase B release. No browser, full-workspace suite, shared-code edits or subagents used.
