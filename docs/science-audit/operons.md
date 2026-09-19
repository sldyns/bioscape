# Operons — Phase A independent scientific audit

Reviewed all **4 IDs**, all six stages per ID, both languages, all **16 condition combinations**, declared roots, geometry/helpers and intermediate/end update formulas. Inspected the four supplied `/tmp/atlas-refinement/*.png` images at progress 0.55. Sources were opened and read; blocked PubMed/PMC pages were supplemented with NCBI EFetch and the RCSB structure record. No product or test files were changed.

**Verdicts:** 3 confirmed_issue, 1 qualified_pass, 0 unresolved. **Findings:** 3 P1, 2 P2. No P0. Full evidence, proposed fixes and verification invariants are in [operons.json](./operons.json).

## lacOperon — confirmed_issue

The E. coli scope, LacI/allolactose and CAP control, polarity and qualitative output agree with the stated assumptions. Omission of inducer exclusion is disclosed. Translation is outside this model.

| Lactose | Glucose | Actual drawn endpoint |
|---|---|---|
| Present | Low | LacI leaves; CAP binds; 3 RNA glyphs |
| Present | High | LacI leaves; CAP inactive; 1 RNA glyph |
| Absent | Low | LacI bound; CAP bound; no RNA drawn |
| Absent | High | LacI bound; CAP inactive; no RNA drawn |

**operons-01 · P1:** `lacOperonProcess.js:224–245` opens DNA only under polymerase 0. At p=.88 that polymerase has disappeared but two others still elongate, while the entire duplex is closed. Add a bubble for every active polymerase, or retain one complete transcription event and represent output separately. The invariant must examine local DNA separation under each visible elongation complex. [Transcription mechanism](https://www.ncbi.nlm.nih.gov/books/NBK9850/).

## trpOperon — confirmed_issue

The two hairpins are exclusive and belong to one colored leader RNA. Stalling/region-2 occupancy, U-rich termination tract, 5′→3′ growth and conditional readthrough are consistent with the intended E. coli mechanism. The lower RNA is explicitly an enlarged conditional view; lack of a physical tether is treated as an abstraction rather than an additional transcription event.

| Free Trp | Charging capacity | Actual attenuation branch |
|---|---|---|
| Low | Normal | Region-1 stall; 2:3; readthrough |
| Low | Limited | Region-1 stall; 2:3; readthrough |
| High | Normal | Region-2 occlusion; 3:4; termination |
| High | Limited | Region-1 stall; 2:3; readthrough despite TrpR repression |

**operons-02 · P2:** `trpOperonProcess.js:283–289` maps every generic “low free Trp” state to insufficient charged tRNA. Qualify this option as **severe tRNA-limiting starvation** or separate the availability variable. The existing binary label conflates two sensing thresholds. [Primary starvation experiments](https://pubmed.ncbi.nlm.nih.gov/6233264/) were read through [NCBI EFetch](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=6233264&retmode=xml).

## yeastGal — qualified_pass

| Galactose | Glucose | Actual promoter outcome |
|---|---|---|
| Present | Low | Gal80 relief; coactivator/Pol II and RNA |
| Present | High | Local Gal80 relief; Mig1/corepressor repression |
| Absent | Low | Gal80 masking persists |
| Absent | High | Gal80 masking plus glucose repression |

Checked stationary DNA-bound Gal4, ligand-dependent Gal3 closure, Gal80 contact, Mig1 recruitment, connected nascent RNA, local DNA opening and exclusively nuclear transcription. The model declares an early local promoter response and its omitted transport/feedback layers. No confirmed correction is requested. Protein surfaces and glyph counts remain schematic, not a structural reconstruction. Evidence: [Gal3–Gal80 structural record](https://www.rcsb.org/structure/3V2U), [nuclear GAL induction study](https://pubmed.ncbi.nlm.nih.gov/22210830/), [MIG1 primary study](https://pubmed.ncbi.nlm.nih.gov/1915298/).

## yeastOsmoregulation — confirmed_issue

| Osmotic step | Hog1 function | Actual endpoint |
|---|---|---|
| High | Active | 15 glycerol glyphs; membrane scale .98; transient nuclear localization |
| High | Inhibited | 5 glycerol glyphs; scale .8; no nuclear localization |
| Unchanged | Active | 3 glycerol glyphs; scale 1; basal relay |
| Unchanged | Inhibited | 3 glycerol glyphs; scale 1; basal relay |

Both stressed conditions close Fps1 early, consistent with the explicitly retained HOG-independent response. Cytoplasmic glycerol and nuclear RNA remain in their stated compartments. [Fps1 experiments](https://pubmed.ncbi.nlm.nih.gov/7729414/) and [phosphorelay experiments](https://pubmed.ncbi.nlm.nih.gov/8808622/) support these checked branches.

- **operons-03 · P1 — event order:** At p=.40, Hog1 is already inside the nuclear outline, but neither the Pbs2 nor Hog1 phosphate marker has appeared. `yeastOsmoregulationProcess.js:295–320` must gate import after the relevant activation events.
- **operons-04 · P2 — intervention scope:** “Hog1 inhibited” also removes phosphorylation and import. Name a nonphosphorylatable perturbation or distinguish catalytic inhibition from activation state.
- **operons-05 · P1 — transport path:** The straight Hog1 route misses the nearest displayed pore by .592 radians; its cut-hole half-width is only .116 radians. Route both import and export through a real opening.

The transport and activity distinctions were checked against the [Hog1 nuclear-exchange primary study](https://pubmed.ncbi.nlm.nih.gov/9755161/). These are separate repair targets: timing, intervention definition and actual compartment-crossing geometry.

This audit does not confer atomic accuracy or all-frame browser acceptance. Phase B remains pending the root’s complete inventory reconciliation.
