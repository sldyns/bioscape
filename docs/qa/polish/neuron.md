# Myelinated multipolar neuron refinement — 2026-10-03

Status: implemented and integrated by root; desktop browser review completed for the whole neuron and all seven detail routes. This is a representative anatomical teaching model, not a traced neuron or a common physical scale across route depths. No commits or shared full-suite checks were made by this specialist.

## Before → after

| Route | Concrete change | Desktop review |
| --- | --- | --- |
| neuron | Near-planar five-arm figure → six tapered primary dendrites distributed through 2.48 units of depth, higher-order branches continuous into irregular soma; one continuous axon, five sheaths, four gaps, four terminal branches | Whole, cutaway, exploded and labels; fitting improved by renderer agent during review |
| neuronSoma | Empty filtered hemisphere → contextual dendritic roots/axon hillock, nuclear envelope, nucleolus/chromatin, perinuclear Nissl cisternae with bound ribosomes, mitochondria | Whole + cutaway + labels |
| neuronNucleus | Plain ellipsoid → envelope with actual perforations and schematic pore collars, bounded cut edge, nucleolus, irregular chromatin tracks and peripheral domains | Whole + cutaway + labels |
| neuronDendrites | Thin flat filtered tree → 3D tapered secondary/tertiary branches with muted noninteractive soma context so roots are not left floating | Whole + labels; no cutaway/explode is offered |
| neuronAxon | Unadorned isolated cable → hillock, unmyelinated initial-segment undercoating, distal myelin, longitudinal axoplasm cut face and microtubule tracks | Whole + cutaway + labels |
| neuronMyelin | Five tiny sausage shapes → one enlarged internode with selected compact lamellae, longitudinal cut edges and progressively terminating paranodal organization | Whole + cutaway + labels |
| neuronNodes | Four floating yellow cylinders → one continuous axon between two contextual sheaths, exposed nodal channel clusters, flanking paranodal loops | Whole + cutaway + labels |
| neuronTerminals | Four tiny balls → a connected enlarged bouton with a localized vesicle pool, near-membrane vesicles, mitochondrion/cristae indication and active-zone stripe | Whole + cutaway + labels; English labels and description checked |

The original whole-neuron and soma cutaway were actually viewed before integration. Other original details were examined in source; their previous browser screenshots were not captured before integration. Do not describe these as a complete before/after visual archive.

## Iterative defects corrected during rendered review

- Internal lamellae initially extended outside tapering sheath ends. Their radial profiles now converge beneath the outer sheath into the paranodal region; no protruding cut-edge spikes remain in the reviewed views.
- Initial nuclear tracks looked like regularly spaced C-rings. Replaced them with irregular chromatin paths and added a perforated nuclear envelope.
- Isolated dendrite bases originally floated around an empty soma location. Added subdued noninteractive soma context.
- Axonal microtubule tracks initially sat on an opaque curved exterior. Replaced the axon detail with gated anterior membrane and a true longitudinal axoplasm cut face.
- Whole-neuron camera initially underfilled the viewport. Reported to root; renderer specialist enlarged its fit. Final whole/cutaway/exploded captures show complete dendritic and terminal silhouettes without clipping.

## Evidence

Actual CUA browser screenshots are saved under `neuron-images/`:

- `root-whole.jpg`, `root-section.jpg`, `root-exploded.jpg`
- `soma-section.jpg`, `nucleus-section.jpg`, `dendrites-section.jpg`, `axon-section.jpg`, `myelin-section.jpg`, `nodes-section.jpg`, `terminals-section.jpg` (labels on; dendrites filename is a capture convention, not a claim that a section mode exists)
- `soma-whole.jpg`, `nucleus-whole.jpg`, `axon-whole.jpg`, `myelin-whole.jpg`, `nodes-whole.jpg`, `terminals-whole.jpg`
- `terminals-en.jpg`

Desktop browser warning/error query returned `[]` after route/mode review. Mobile/physical-device acceptance and global regression remain with root; no viewport override was changed by this agent. Static render appearance is not a measured performance benchmark. Existing explosion offsets keep soma–dendrites and axon–nodes–terminals together, while lifting myelin and the nucleus separately.

## Local validation

`node tests/neuron-refinement.mjs` passes:

- Finite positions/normals/UVs, defined hit IDs, no InstancedMesh, bounded dimensions and stable deterministic geometry over repeated construction.
- Whole-neuron axon has 151 sampled rings with 16 unique radial vertices per ring. Every ring centroid matches the continuous CatmullRom centerline within 1e-6; radius remains positive. Indexed triangles bridge every adjacent ring, explicitly including all four nodal gaps.
- Every nuclear vertex lies within a conservative inner soma ellipsoid, including the pore collars.
- All local cutaways have both removable caps and section-only structures; no contradictory cap/cutOnly flags.

`neuronAxonSampling` is exported and consumed by the actual constructor, so integration tests can inspect continuity without assuming the old 128 × 10 buffer layout.

| Model | Merged meshes | Vertices | Triangles |
| --- | ---: | ---: | ---: |
| Whole | 33 | 136929 | 226578 |
| Soma | 16 | 36801 | 62210 |
| Nucleus | 8 | 19543 | 34602 |
| Dendrites | 2 | 25873 | 47088 |
| Axon | 14 | 18519 | 30896 |
| Myelin | 11 | 16020 | 26288 |
| Nodes | 13 | 31709 | 51256 |
| Terminals | 7 | 6908 | 11752 |

## Sources and explicit bounds

- [Palay et al. 1968, The axon hillock and the initial segment](https://pmc.ncbi.nlm.nih.gov/articles/PMC2107452/): axon hillock/initial segment ultrastructure and microtubule organization. The teaching model distinguishes initial segment from myelin; it does not reproduce a micrograph or membrane-molecular density.
- [Dutta et al. 2018, Regulation of myelin structure and conduction velocity by perinodal astrocytes](https://www.nichd.nih.gov/sites/default/files/inline-files/Dutta_et_al-2018-PNAS-Regulation_myelin_structure.pdf): primary ultrastructural evidence for paranodal glial loops beside the nodal domain. No astrocyte mechanics or patient phenotype is simulated.
- [Siksou et al. 2007, Three-dimensional architecture of presynaptic terminal cytomatrix](https://pubmed.ncbi.nlm.nih.gov/17596435/): primary electron tomography of presynaptic vesicle/cytomatrix organization. Supports a localized vesicle pool near the active zone; displayed vesicle counts and positions are deliberately schematic.

The model omits glial somata, postsynaptic targets and any named regional/subtype claim. Lamellar number/spacing, nodal gaps, pore count, channel clusters, organelle sizes and chromatin paths are educational abstractions. A bouton without a postsynaptic target is not labelled a complete synapse. Dendritic spine presence is not generalized to all multipolar neurons.
