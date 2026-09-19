# phageLife — Phase B correction evidence

Both assigned P1 findings are fixed. Phase A evidence remains unchanged. Only the two affected models, their local entry helper/test and shared T4 geometry helper and these resolution files changed; `phageAssembly`, `phagePackaging` and legacy `infection` are unchanged.

## phageLife-01

DNA is now one duplex interval moving from a head coil through the stationary tail outlet and a schematic hollow envelope channel into the cytoplasm. Both backbones and base pairs share one arclength coordinate. Residual head DNA shrinks by passage along that path, without coordinate scaling or a separate duplicate genome. The entered molecule persists as the intracellular template.

The regression reads actual indexed tube vertices and draw ranges at `0/.01/.03/.05/.10/.15/.17`. It checks paired backbones, continuity, forward-moving ends, proximity to the actual tail outlet, approximately constant length, and complete intracellular location after entry. Restoring origin scaling in an in-memory mutation is detected.

The connected delivery topology is supported by the already reviewed [Hu et al. primary study](https://pubmed.ncbi.nlm.nih.gov/26283379/); the channel remains an unnamed schematic. This overview does not model molecular forces or exact genome length. Dedicated `infection` remains unchanged.

Peer acceptance found an additional obstruction: the shared T4 capsid floor, axial rod and hexagonal baseplate were solid. Their actual geometry now has an open neck, annular tail lumen and central baseplate aperture. The coil straightens before the neck inlet. A regression traces both drawn backbone centerlines against all four barrier meshes (including the added neck connector) at five entry frames; no world-space triangle intersection remains, and full rail thickness fits inside the polygonal lumen. Five-model smoke also passes after this shared-helper correction.

Independent `p_chromatin` acceptance then checked all potentially displayed entry paths against 462 effective solids, including capsomer/sheath instances and the channel: 510,224 segment–triangle distance evaluations, zero distances below the .008 DNA rail radius. Minimum surface distance was .009746991, giving .001746991 net radial clearance at the tail tube. This is peer-reported evidence, separate from the local regression.

## phageLife-02

The left chromosome now disappears only during induced lysis. The maintain branch retains both host chromosomes and their integrated prophages through the endpoint.

Both fates are checked at `.65/.8/.96/.975/1` using effective ancestor visibility, actual chromosome geometry, daughter transforms, CI and envelope headgroups. Maintain has no visible excised DNA or progeny; induced left lysis leaves the right lysogen intact. Restoring the unconditional disappearance in an in-memory mutation is detected.

## Verification

- `node src/processes/modules/phageLife/science.test.mjs` — PASS both issue regressions, finite vertices, deterministic seeks and stable resources.
- `node src/processes/modules/phageLife/refinement-smoke.mjs` — PASS all four module models and legacy infection.
- Two in-memory esbuild mutation checks — both restored defects rejected.
- Owned-file Prettier check — PASS.

No issue remains unresolved. Scientific regressions establish the specified invariants, not every biological detail. Browser/render acceptance remains with the root reviewer.
