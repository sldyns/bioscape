# New model experience audit — round 2

Date: 2026-10-03. Live development browser: `http://127.0.0.1:5174`, independent background IAB tab, existing 1280 × 720 viewport, no viewport override. All 19 routes below were opened through the visible model selector/catalog. Screenshots and accessibility observations were captured for every available display mode; only the representative defect image is retained on disk. Historical polish notes were not used as current proof.

## Findings and scope

**Confirmed: internal labels remained visible through opaque Whole shells.** Enable labels in a detail, then choose Whole. For example, neuron nucleus rendered an opaque purple envelope, but Nucleolus and Chromatin leaders pointed at its exterior. The same failure affected Nissl substance, axonal microtubules, terminal bouton contents, muscle nucleus contents, and mitochondrial intermembrane space. Root internal part labels also remained on the outside surface. Before evidence: `new-model-labels-before.jpg`.

The proposed correction is declarative mode visibility, not a claim of camera-dependent occlusion. Internal detail landmarks use `visibleModes: ['section']`; root internal part labels use `partLabelModes: ['section', 'explode']`. Geometry and scientific source data remain unchanged. The root integrator owns renderer/presentation/export support and regression checks.

**No demonstrated geometry/science contradiction in this pass.** Descriptions explicitly explain the red-cell surface patch versus one haemoglobin molecule, compressed neuronal axon, selected lamellae, omitted postsynaptic cell, cropped muscle fibre, independently magnified sarcomere, and separate triad lumina. These claims were compared with rendered structure and local model data, not revalidated against every external primary source. This is a visual/interaction audit, not independent biological peer review.

**State note, not a confirmed defect:** setting Separation to 100 with Playwright `fill` showed 100 and spread geometry, but the portable URL still held 60 in the same observation; immediate child drill/Escape returned 60. Root integrator was notified to reproduce with a native key and settled URL, because the initial observation did not establish whether this was React input/debounce timing or durable state loss.

## Per-route observed checklist

W = Whole, C = Cutaway, E = Exploded. A single-mode detail has no W/C/E selector. Labels were enabled on every route. Model fit below refers to the initial framing at this desktop viewport, not arbitrary zoom/rotation or mobile acceptance.

| Route | Modes actually observed | View, description, and label result before fix |
|---|---|---|
| `/erythrocyte` | W/C/E | Biconcave profile has a closed thin centre, cut edge, and separated membrane/cytosol; all fit. Whole cytosol label incorrectly points through membrane. Thin-centre and membrane labels remain appropriate. |
| `/erythrocyte/erythrocyteMembrane` | Single | Enlarged lipid patch with cytoplasmic network; six readable molecular/component labels. Context describes selected links and schematic spacing; no default clipping. |
| `/erythrocyte/erythrocyteCytosol` | Single | Four coloured Cα chains and haem groups visible; labels identify α/β subunits and deoxy state. Text explicitly says one molecule, experimental 2HHB, no bound O₂. |
| `/neuron` | W/C/E | Dendrites, soma, continuous compressed axon, internodes, nodes and terminal branches fit. Whole Nucleus label points through opaque soma. |
| `/neuron/neuronSoma` | W/C | Section reveals nucleus, Nissl substance and mitochondria. Whole hides Nissl target but formerly retained its label. Hillock remains externally visible. |
| `/neuron/neuronNucleus` | W/C | Section clearly exposes chromatin and nucleolus; Whole hides both but formerly retained both labels. Preserved representative before screenshot. |
| `/neuron/neuronDendrites` | Single | Branching tree and muted soma context fit; context/branch labels meaningful. Description limits branch count/subtype claims. |
| `/neuron/neuronAxon` | W/C | Section exposes longitudinal tracks and scaffold with distal myelin. Whole covers both internal targets but formerly retained both labels. |
| `/neuron/neuronMyelin` | W/C | Section shows selected lamellae/paranodal loops; Whole shows smooth sheath and formerly retained internal layer/loop labels. |
| `/neuron/neuronNodes` | W/C | Exposed nodal gap remains visible in both; whole sheath covers paranodal loops while old label remains. Keep nodal label in Whole. |
| `/neuron/neuronTerminals` | W/C | Section shows one bouton, vesicles, mitochondrion, active-zone patch. Whole shell conceals all three labelled targets. Text correctly says postsynaptic target omitted. |
| `/muscleFibre` | W/C/E | Cropped fibre, aligned fibrils, peripheral nuclei and sampled organelles fit. Maximum Separation=100 also visually fits. Whole hides nucleus/SR/triad/mitochondrial/example-sarcomere targets. Myofibril label lands at exposed end and can remain; artificial-end context explicit. |
| `/muscleFibre/muscleFibreSarcolemma` | Single | Curved membrane patch fits. Default near-face view makes core less prominent; actual drag rotation exposed the two leaflets/core. Context explicitly magnifies a small patch. |
| `/muscleFibre/muscleFibreNuclei` | W/C | One elongated nucleus, section contents and pores visible. Whole hides chromatin/nucleolus/double-membrane distinction; pores remain visible. |
| `/muscleFibre/muscleFibreMyofibrils` | Single | Three adjacent striated segments with one local filament exposure. Labels explain aligned Z discs, cropped end and local exposure; no crop/overlap defect. |
| `/muscleFibre/muscleFibreSarcomere` | Single | Enlarged Z-to-Z filaments fit; six labels distinguish Z/I/A/H/M/titin. Static/no-contraction-cycle limitation explicit. |
| `/muscleFibre/muscleFibreSR` | Single | Open reticular sleeve with enlarged cisternae. Three labels fit; text explicitly omits enclosed myofibril. |
| `/muscleFibre/muscleFibreTriads` | W/C | Three separate tubular elements and junctional release-channel links. Cutaway exposes independent lumina. Whole default orientation hides labelled opening; opening label made section-only. Other three targets remain visible. |
| `/muscleFibre/muscleFibreMitochondria` | W/C | Section shows cristae, matrix and membrane separation. Whole envelope obscures Intermembrane space label target. Description limits cell-type-specific morphology claim. |

## Interaction evidence

- The visible catalog opened every child listed above and updated title/breadcrumb/description.
- Explicit Back-to-parent controls returned from each model family. RBC and muscle returned to prior Exploded+labels state during the pass. Neuron's first return overlapped HMR, so mode retention was not accepted from that observation.
- Clicking the **scene** Example sarcomere label opened the matching child. Escape returned to muscle root.
- Sarcolemma drag rotation changed the actual view and exposed membrane thickness. All 19 initial frames displayed the model within the canvas.
- Browser warnings/errors captured after the 19-route traversal were an empty list. This does not replace full test/build/release validation.
- No source-asset regeneration, geometry changes, viewport override or commit was performed by this audit agent.

## Implemented metadata (awaiting renderer verification)

Only `src/compare/models/{erythrocyte,neuron,muscle}.js` changed. Root mappings cover erythrocyte cytosol, neuron nucleus, and five internal muscle parts. Eleven neuron detail landmarks, three muscle nuclear landmarks, triad lumen-opening landmark, and muscle mitochondrial landmark are section-only. Externally visible anchors remain unrestricted. `node --check` passed for all three modules.

## Post-fix desktop verification

After the root integrator connected mode filtering and corrected optimized root-model metadata transfer, the page was fully reloaded to discard worker caches.

- Neuron nucleus Whole: no Nucleolus/Chromatin leaders; label toggle disabled with “Use Cutaway to see internal labels”. Switching to Cutaway restores the prior label preference and both labels. Saved `new-model-labels-after.jpg`.
- Neuron soma Whole: external hillock label retained, Nissl label absent. Cutaway restores Nissl label.
- Erythrocyte Whole: only membrane + thin-centre labels; Exploded restores cytosol label.
- Muscle Whole: sarcolemma, exposed-end myofibrils and cropped-end annotation retained; all five internal part labels absent. Cutaway restores all seven part labels.
- Studio image preview from Whole neuron nucleus, with Structure labels ON, correctly contains no internal labels. The preview generates a 1920 × 1080 PNG download link. Saved `new-model-labels-studio-whole.jpg`; download/video were not exercised by this agent. The static subtitle “Enlarged cutaway” appearing on a Whole export was separately reported to the integrator for neutral wording.

This closes the observed desktop label defect for the checked representative paths; it does not claim arbitrary camera occlusion handling, all export combinations, mobile acceptance or production deployment.
