# Neurons Phase B resolution · 2026-10-04

All three Phase A issues and two later integration findings are repaired. `actionPotential` now includes annotation-target and state-band visibility repairs. Only the assigned neurons product/test files and dated neurons evidence/resolution files were edited.

## Issue accounting

### 20261004-neurons-01 — fixed

Directed dynein to the physically accessible preceding B-tubule given the existing A/B ring orientation. Longitudinal tail and MTBD contact points are sampled barycentrically from actual deformed A/B surface triangles. The stalk avoids the neighboring A wall, remains attached during the minus-end stroke and preserves detached reset. The enlarged cross-section now connects actual exterior tubulin subunit surfaces. Motor transverse radii fit within the interdoublet gap; all motor parts, collars, tube detail and instanced subunits are retained. Added the opened primary topology source.

- All 6 motor rows and 9 doublet azimuths over 8 progress values and both ATP conditions: 798 visible engaged B-wall contacts plus every A-wall tail anchor; maximum triangle-contact error 9.04e-16 world units.
- Ray tests reject any stalk passing through the adjacent A-tubule. Transverse A/B subunit-surface contact error is at most 0.000159 world units (tolerance 0.001).
- Early engaged MTBD moves toward the basal minus end. Original 202-sample tube-length, basal fixation, actual material sliding and ATP-absence regressions still pass.

Limits: Molecular shapes and spacing remain explanatory; source is conserved ciliate topology from Tetrahymena, not a claim of species-specific Paramecium motor composition. Rendered occlusion, normal-view legibility and continuous playback remain for root review.

### 20261004-neurons-02 — fixed

Replaced the binary motor-reach switch with deterministic eased approach over p=.27–.31 and withdrawal over p=.65–.675. Bound force-generating interval and nucleotide transitions are unchanged; low calcium stays completely stationary and withdrawal finishes before the ATP recovery stroke.

- World-space motor-lobe steps across all approach/withdrawal boundaries at epsilon=1e-6 are at most 1.04e-9, versus the original non-vanishing 0.217 jump.
- All 12 motor lobes checked at .27/.31/.65/.675; added low-Ca probes across the entire approach/withdrawal interval.
- Prior attached-pose, nucleotide-state and low-Ca fingerprint assertions pass unchanged. Fixed filament geometry and retained shortening behavior are unchanged by inspection of the owned update path.

Limits: The motor reach is an illustrative conformational envelope rather than atomic motor dynamics. Root still owns rendered continuous-playback acceptance.

### 20261004-neurons-03 — fixed

Applied a fixed minus-pi/2 azimuth transform to the fused lathe and its cut-edge geometry, matching SphereGeometry’s docked cutaway convention. The same camera-facing vesicle section persists through fusion; lumen opening and transmitter timing are unchanged.

- Regression extracts real sphere/lathe cut-edge vertices, transforms them to world coordinates and requires their missing-sector directions to agree through p=.38±epsilon; dot product exceeds .999999.
- Before fusion only docked shell is visible; after fusion only fused shell is visible.
- Prior extracellular ligand-to-AMPA contact, ligand-before-opening, sodium direction and calcium-blocked regressions pass unchanged.

Limits: Fusion still switches between prebuilt closed and open topologies; a molecular lipid-fusion trajectory is not claimed. Root will review the visual transition and transmitter visibility.

## Validation and evidence

- Prior `science.test.mjs` assertions remain in place and pass. New tests reject actual missed contact, finite head-position jumps and the original 90-degree cutaway mismatch.
- Seven actual process/root cases (including neuron and muscleFibre), fourteen condition cases, 868 samples and 98 arbitrary backward/forward seeks pass finite-buffer, stable-resource and deterministic-state checks.
- Original ciliary maximum length error remains 0.000442 over 4.4; axial register shift remains 0.7428. No tube geometry or subunit detail was removed.
- Logs: `../evidence/neurons/repair-science.log`, `../evidence/neurons/repair-coverage.log`; detailed coverage `../evidence/neurons/repair-coverage.json`.
- Formatted four owned JS/MJS files; `git diff --check -- src/processes/modules/neurons` passed. No shared file, browser or full-workspace test was touched.

## Primary source retained in the model

[Rao et al. (2021), outer-arm dynein arrays](https://www.nature.com/articles/s41594-021-00656-9) supports the A-tail/B-MTBD connection. The model remains a qualitative Paramecium cilium and does not claim the paper’s Tetrahymena-specific molecular composition.

Rendered continuous playback and root integration remain separate acceptance gates.

## 20261004-neurons-04 — fixed after integration review

Converted the four modules’ legacy text-placement offsets to actual leader anchors. A small owned helper reuses vector/matrix storage for object, instanced-subunit and vertex positions. AP labels target the channel collars and existing axon/membrane regions; synaptic labels target the calcium pore, visible vesicle rim, AMPA cleft and EAAT opening; muscle labels follow moving Z-disc faces, actin subunits, calcium and the active nucleotide marker; ciliary labels follow the deformed membrane, actual transverse subunits and dynein. Calcium-transfer and bending-event labels are hidden when absent/arrested. Calcium-release wording and overlap wording match current motion and condition.

- Owned science regressions inspect actual world positions, visible vesicle-shell triangles, disc faces and material subunits over both conditions and representative boundaries for all four models.
- Seven actual process/root cases, fourteen condition cases, 868 samples and 98 irregular seeks retain finite buffers, stable resources and deterministic geometry; label text/positions/active flags additionally reproduce exactly after seeks.
- No molecular mesh, material or node is allocated in the new anchor-update path. Original four-process scientific regressions remain intact and pass.

Limits: Reviewed stored sheets and four original frames predate these label repairs. Root re-render is pending; code/numeric checks do not certify the revised label layout. Manual rendered scope is first registered root, default condition and English captured frames only.

## 20261004-neurons-05 — fixed after integration review

Set the existing axonal state-band base material to DoubleSide so the default camera sees its interior, matching the already double-sided axon wall/cytoplasm. Preserved all six band geometries, state colors, timings and stimulus behavior; no voltage mechanism was changed.

- Before repair, default-camera ray to repolarizing band 2 at p=.435 missed the FrontSide band; the same target was hit after only the diagnostic instance side was switched to DoubleSide. Exact camera/target/color values are retained in repair-discoveries.json.
- Final regression covers all six bands, Na/K/refractory/rest states and stimulus on/off: 48 cases. Every band has camera-facing ray intersections, at least one unobstructed ray among three axial points, and unchanged expected color.
- All original channel, condition, finite-buffer and resource regressions pass.

Limits: Root will re-render AP stages to confirm the restored colors under the actual displayed view. Ray evidence is default-camera geometric visibility, not a human review of every playback frame.

Integration discovery evidence is preserved in `../evidence/neurons/repair-discoveries.json` and `.md`. Full rendered-review boundaries are in `neurons-rendered.md`. Final owned science log: `../evidence/neurons/rendered-repair-science.log`; revised label coverage: `../evidence/neurons/label-coverage.json`.
