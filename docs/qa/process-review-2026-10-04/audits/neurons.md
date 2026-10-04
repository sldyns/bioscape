# Neurons independent Phase A audit · 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product/test files unchanged. Four processes, seven actual process/root cases and fourteen condition branches reviewed. **One qualified pass; three confirmed issues (one P1, two P2).**

Actual roots: actionPotential cell/neuron; synapse cell/neuron; muscle cell/muscleFibre; ciliaryMotion paramecium. All bilingual metadata, six stages per model, every condition option and complete update paths reviewed.

## Findings

### actionPotential — qualified_pass

Mammalian unmyelinated neuronal axon; the neuron override explicitly distinguishes the myelinated structural specimen from this continuous-conduction example.

Na/K direction, delayed channel order, local ion motion, fixed magnification, recovery and no-stimulus branches are consistent at the reviewed schematic level. The neuron-root introduction expressly distinguishes the unmyelinated process from the myelinated structural model.

Opened primary evidence:
- [Hodgkin and Huxley (1952), A quantitative description of membrane current and its application to conduction and excitation in nerve](https://isn.ucsd.edu/courses/beng207/reading/Hodgkin_Huxley_1952_jp.pdf): Opened primary paper PDF: pp. 500–501 distinguish transient sodium conductance from delayed maintained potassium conductance and discuss local ionic current and propagation. Historical squid-axon work supports the generic sequence, not mammalian channel subtype or quantitative parameters.

### synapse — confirmed_issue

Mammalian central glutamatergic excitatory synapse, with separate presynaptic axon, postsynaptic dendrite and neighboring astrocyte.

**20261004-neurons-03 · P2 · visible cutaway discontinuity**

Location: `src/processes/modules/neurons/synapseProcess.js` lines 186–242 and 402–404 (docked SphereGeometry versus fused LatheGeometry and visibility switch).

Both sphere and lathe use phiStart=.8*pi and phiLength=1.4*pi, but SphereGeometry uses x=-r*cos(phi), z=r*sin(phi), while LatheGeometry uses x=r*sin(phi), z=r*cos(phi). With no compensating rotation, the omitted sphere sector faces +Z and the omitted lathe sector faces +X. The entire shell cutaway changes orientation by 90 degrees at p=.38.

Membrane fusion can intentionally change topology, but rotating which quarter of the vesicle is cut away is an unrelated visual discontinuity. It moves the visible membrane boundary and obscures continuity of the same vesicle through fusion.

Correction: Use one common azimuth convention for the docked and fused shell and their cut-edge beads/tubes; keep the cutaway facing the camera through fusion. Preserve the closed-before-fusion/open-after-fusion lumen topology and do not conceal transmitter release.

Acceptance invariant: Compare actual sphere/lathe edge world coordinates and missing-sector directions at p=.38-epsilon/.38+epsilon. Verify no azimuth jump; re-run ligand-before-gate, blocked-calcium and lumen/path checks. Root should render the fusion transition continuously.

Opened primary evidence:
- [Yen et al. (2026), Auxiliary subunits reshape structural asymmetry and functional plasticity in heterotetrameric GluA1/A2 AMPA receptor core](https://www.nature.com/articles/s41467-026-71063-1): Opened primary structural paper: ligand binding opens a tetrameric cation channel; M2 is a re-entrant pore loop and M3 contributes to the pore. Supports extracellular ligand binding and postsynaptic ion flow, not a claim that simplified lobes are atomic coordinates.
- [Bose et al. (2024), Minimal presynaptic protein machinery governing diverse kinetics of calcium-evoked neurotransmitter release](https://www.nature.com/articles/s41467-024-54960-1): Opened primary reconstitution study: docked vesicles are restrained by the fusion machinery at rest; calcium activation releases the clamp to permit SNARE-driven fusion. Geometry must preserve the docked-to-fused membrane relationship.

### muscle — confirmed_issue

Magnified mammalian skeletal-muscle sarcomere; no neuromuscular-junction or excitation-contraction membrane model.

**20261004-neurons-02 · P2 · visible motion discontinuity**

Location: `src/processes/modules/neurons/muscleProcess.js` lines 301 and 320–324.

At p=.31 and p=.65, pivot.scale.y switches between .77 and 1.08. An actual motor-lobe world center jumps 0.217 at both events across a progress interval of 2e-7; all 12 heads use this same switch. On the 34 s timeline the displacement persists for arbitrarily small time increments.

Attachment and ATP-induced detachment are correct events, but the implementation instantaneously stretches the entire motor/lever geometry by 40%, producing a visible snap in otherwise continuous sarcomere motion. This is not merely a nucleotide-marker state change.

Correction: Animate a deterministic short approach and withdrawal interval around attachment/detachment while keeping the force-generating interval, correct thin-filament direction and fixed filament lengths. Prefer motor articulation; preserve the established attached geometry and complete ATP detachment before the recovery stroke.

Acceptance invariant: Measure actual world-space motor points across both transition boundaries and their surrounding intervals; the limiting jump must vanish as the time step shrinks. Confirm low-Ca geometry stays stationary, cross-bridge contact during shortening, ATP detached reset, constant filament lengths and arbitrary-seek equality.

Opened primary evidence:
- [Muretta et al. (2015), Direct real-time detection of the structural and biochemical events in the myosin power stroke](https://pubmed.ncbi.nlm.nih.gov/26578772/): Opened primary abstract and figure descriptions: actin initiates a structural power stroke coupled to phosphate release and the weak-to-strong transition; stroke can begin before phosphate dissociation. The model correctly uses coupled-event wording rather than an absolute Pi-before-stroke claim. No evidence supports instantaneous whole-motor scaling as a physical motion.

### ciliaryMotion — confirmed_issue

Qualitative Paramecium motile-cilium 9+2 longitudinal cutaway plus enlarged transverse section; not bacterial rotary flagella or a measured beat waveform.

**20261004-neurons-01 · P1 · misleading molecular attachment topology**

Location: `src/processes/modules/neurons/ciliaryMotionProcess.js` lines 406–457 (neighbor B track and stalk surface target); transverse counterpart lines 253–257.

At p=0, all nine first-row engaged stalk endpoints are 0.02577094–0.02577103 from the nearest actual adjacent B outer-wall triangle; stalk radius is 0.011. Their distances to the adjacent A outer-wall triangles are only 0.0010127–0.0019616. The target vector is +0.035*sin(an), -0.035*cos(an) from the B center: exactly the incomplete B-wall opening directed toward A, rather than the B exterior. The transverse stalk also ends near the B center, rather than its exterior surface. Evidence uses THREE.Triangle.closestPointToPoint, not nearest vertices.

The scene claims dynein is anchored to one doublet and contacts its neighbor B-tubule. The depicted engaged stalk instead crosses toward the A/B shared-wall opening and terminates away from the drawn B surface. A surface-contact mechanism cannot be inferred from proximity to a centerline.

Correction: Place each engaged MTBD on a represented exterior patch of the adjacent B wall, on the motor-facing side, without crossing the neighboring A cylinder. Keep its material position moving toward the basal minus end during the engaged stroke and detached during reset. Align the magnified transverse connection with the same A-to-B topology.

Acceptance invariant: Check tail attachment and engaged stalk-tip distances to actual B-wall triangles over all nine azimuths and intermediate bends; reject points in the omitted B-wall wedge or inside neighboring A. Verify transverse endpoints against rendered B subunits, plus arrest and deterministic seeking.

Opened primary evidence:
- [Rao et al. (2021), Structures of outer-arm dynein array on microtubule doublet reveal a motor coordination mechanism](https://www.nature.com/articles/s41594-021-00656-9): Opened primary Tetrahymena cryo-EM study; introduction and Fig. 1 describe the tail attached to the A-tubule and nucleotide-dependent MTBD binding/release on an adjacent B-tubule. Conserved ciliate topology is applicable to the schematic; detailed Tetrahymena motor composition is not asserted for Paramecium.
- [Lacey et al. (2019), Cryo-EM of dynein microtubule-binding domains shows how an axonemal dynein distorts the microtubule](https://pubmed.ncbi.nlm.nih.gov/31264960/): Opened primary abstract and figure captions: a compact MTBD at the stalk end binds tubulin on the microtubule exterior. This supports testing actual stalk-to-tubule contact rather than labels or userData.

## Focused verification and limits

- Existing `node src/processes/modules/neurons/science.test.mjs`: passed; 402 synapse and 202 axoneme samples. Tube-length maximum error 0.000442 / 4.4; axial material register shift 0.7428.
- `node docs/qa/process-review-2026-10-04/evidence/neurons/audit-diagnostics.mjs`: 868 samples, 98 repeated seeks, all 14 root/condition cases finite and stable in resource identity.
- Diagnostics use actual world motor points and point-to-triangle wall distance, not userData or nearest vertices.
- Full evidence: `../evidence/neurons/audit-diagnostics.json`; source script and baseline log are retained beside it.
- Preserved scientific boundaries: schematic scale/particle counts/timings; ciliate topology evidence is not a claim of species-specific molecular composition. Ciliary modulo reset and marker visibility are not automatically defects.
- No browser, whole-workspace tests, product edits or historical-evidence edits. Rendered continuous playback remains for the root integrator after corrections.
- Await Phase B release before repairs.
