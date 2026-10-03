# Erythrocyte refinement · 2026-10-03

Status: implemented and inspected in the integrated local browser at `http://127.0.0.1:5174/`. Root integration of enriched descriptions remains required; desktop review does not establish mobile/device acceptance.

## Before → after

- Whole: retained the smooth Evans–Fung-type double-concave outline and nonzero central thickness. Section faces contain cytosol and now have continuous light membrane cut edges. Membrane and contents remain teaching layers, not detachable organelles.
- Membrane route: previously an isolated copy of the same smooth disc. Now an enlarged patch with two lipid headgroup rows and inward-facing tails, a sparse cytoplasmic spectrin network terminating at short actin junctions, and a band 3 dimer / ankyrin attachment. No arbitrary surface noise or decorative particles.
- Cytosol route: previously another disc. Now a representative soluble human deoxyhaemoglobin tetramer from deposited 2HHB coordinates: all 574 Cα residues (A/C 141; B/D 146), four hemes with heavy-atom bonds and four iron markers. No made-up globular subunits or bound O₂ in this deoxy state. Relative coordinates retained; no chain separation.

## Scientific sources and limits

- [Fermi et al. 1984 / RCSB 2HHB](https://www.rcsb.org/structure/2HHB): human deoxyHb; α₂β₂ stoichiometry, 574 residues, four hemes. Coordinates fetched from `https://files.rcsb.org/download/2HHB.pdb` on 2026-10-03. The module embeds only Cα and HEM records with original residue numbering. The reconstruction skips gaps over 6 Å or discontinuous residue numbers.
- [Native ultrastructure of the red cell cytoskeleton by cryo-electron tomography](https://pmc.ncbi.nlm.nih.gov/articles/PMC3218374/): spectrin connections and actin-based nodes. The patch is a simplified teaching network, not a reconstruction of an individual cell or a crystalline mesh.
- [Structure, dynamics and assembly of the ankyrin complex on human red blood cell membrane](https://pmc.ncbi.nlm.nih.gov/articles/PMC9489475/): human band 3/ankyrin attachment. Protein shapes are schematic. Other attachment complexes, including glycophorin C / protein 4.1, are not shown.

All molecular detail is enlarged separately from the cell scale. Membrane leaflet spacing, skeleton separation, tube radii and colour are illustrative. Hb side chains, water and ions are omitted. The one tetramer represents a major cytosolic solute, not concentration or molecule count. Whole-cell metadata remains 7.82 µm diameter, 0.81 µm central thickness, zero nuclei and zero mitochondria.

## Focused automated checks

`node tests/erythrocyte-refinement.mjs` passed on 2026-10-03: finite position/normal/UV buffers, in-range indices, deterministic construction, no InstancedMesh, nonzero centre and positive section area, correct biological metadata and tetramer/heme inventory.

| Raw view                  | Meshes / owned geometries | Build-local materials | Vertices |
| ------------------------- | ------------------------- | --------------------- | -------- |
| Whole cell                | 8 / 8                     | 4                     | 76,352   |
| Membrane                  | 7 / 7                     | 7                     | 165,635  |
| Cytosol representative Hb | 7 / 7                     | 7                     | 68,136   |

Each factory owns all its geometry; repetitive structures are merged and intermediate buffers disposed. Materials are shared only inside one build, with no global resource cache. Geometry is static, with no per-frame allocations. No full shared workspace test/build was run by this specialist.

## Integrated rendered review

Inspected root whole, section and explosion, membrane detail and labels, Hb detail and labels. Whole outline is smooth with closed centre; cut view has a filled radial section; membrane paired leaflets and underlying skeleton read separately; Hb chains and gold hemes remain visible. Both leaf routes correctly expose local/whole view, not meaningless section/explosion controls. Sidebar navigation and return to overview work. Browser log capture after all views returned no warnings/errors.

Temporary screenshots (root may copy into the retained QA archive):

- `/tmp/bioscape-erythrocyte-whole.jpg`
- `/tmp/bioscape-erythrocyte-cut.jpg`
- `/tmp/bioscape-erythrocyte-explode.jpg`
- `/tmp/bioscape-erythrocyte-membrane-labels.jpg`
- `/tmp/bioscape-erythrocyte-haemoglobin.jpg`
- `/tmp/bioscape-erythrocyte-haemoglobin-labels.jpg`

## Remaining integration items

- Merge `erythrocyteRefinementMetadata` scope, descriptions and sources from the owned metadata module; reviewed screenshots still contained the old brief descriptions.
- At default explosion 60%, existing shared ±1.5 offsets leave the discs substantially overlapping. Recommended shared offset ±3.0 for clearer educational separation; root owns that file. Reinspect after this adjustment.
- Root coordinates responsive and device review. No viewport override was made by this specialist.
