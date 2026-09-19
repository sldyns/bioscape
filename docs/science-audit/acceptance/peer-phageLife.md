# phageLife — independent correction peer review

Reviewer: p_chromatin. Read-only product review; only this acceptance record is written. No browser use. Reviewed `entryGeometry.js`, `phageLyticProcess.js`, `phageLysogenicProcess.js`, `geometry.js`, `refinedGeometry.js`, and `science.test.mjs`.

**Final peer verdict: qualified acceptance of the original two corrections and the additional open-channel repair.** The extra obstruction was fixed by the author and independently rechecked below. No unresolved finding remains in this bounded peer review; root still owns rendered visual acceptance.

## Original issues (initial repaired version, before the extra channel repair)

- **phageLife-01: original continuity defect corrected.** Two actual indexed TubeGeometry rails share exactly the same contiguous draw interval. An independent sweep of 1001 times across progress 0–0.17 found matching, bounded draw ranges aligned to complete longitudinal segments. World-space ring-center integration gives DNA centerline length 2.4802345–2.4873698, maximum adjacent sample distance 0.00637182. This is compatible with the displayed segment discretization, and is not independent scaling or duplication of genomes. The visible interval passes the fixed actual tail outlet during transfer. A 64-sample straight-tail calculation gives positive `T dot (offset_i cross offset_(i+1))`, 0.00009462415–0.00009462441: the new duplex has right-handed winding along its forward path there.
- **phageLife-02: maintenance disappearance corrected.** Read the fate-gated formula and independently swept 1001 progress values from 0.65 through 1 with `fate=maintain`; both chromosome objects, their integrated inserts and CI remain effectively visible, and the excised circle remains absent. Existing regression also verifies each daughter’s envelope and own chromosome geometry, no maintained-branch progeny, and the induced branch.
- `node src/processes/modules/phageLife/science.test.mjs`: **PASS**, including deterministic seeks and resource stability. Passing these original invariants does not cover the new obstruction finding below.

## peer-phageLife-01 — P1 residual: delivery path intersects solid capsid/tail geometry

**Initial review status: confirmed. Final status: author fixed; independent recheck passed (see below).** This is an additional acceptance finding, not a renumbering or duplicate of the original two audit issues.

In `geometry.js`, the T4 tail still contains a `k.segment([0,0,0],[0,-0.76,0],0.043,...)`, backed by closed CylinderGeometry. Adding a surrounding hollow cylinder does not remove this central solid. `T4-baseplate` is also a closed six-sided CylinderGeometry without a central aperture. The capsid BufferGeometry removes only the front viewing window (`center.z > 0.16`); its bottom face still crosses the DNA route.

At `phageLytic` progress **0.05**, both draw ranges cover rings **89–489**. For backbone 0, **97** rendered ring centers lie inside the central closed cylinder and **7** lie inside the baseplate’s inscribed solid hexagonal volume. This was independently checked after inverse-transforming actual world-space DNA ring centers into each solid mesh’s local coordinates.

The stronger test uses each consecutive pair of rendered backbone ring centers as a finite segment, then intersects it with **actual transformed triangles** using `THREE.Ray.intersectTriangle(..., false)` and bounds the hit to the finite segment. It is not a nearest-vertex proxy. Intersections:

| Obstruction | World-space intersection |
| --- | --- |
| Tail rod upper cap | (-0.78493234, 2.04000000, 0.07830925) |
| Tail rod lower cap | (-0.80101224, 1.43200000, 0.06520894) |
| Baseplate upper face | (-0.81473060, 1.54200000, 0.07846634) |
| Baseplate lower face | (-0.78526338, 1.49800000, 0.08049937) |
| Capsid bottom face | (-0.78543134, 1.94599897, 0.08255456) |

The DNA must pass through a continuous lumen/portal, not cross protein shell or solid baseplate faces. Opened and read the primary cryo-ET paper [Hu et al. 2015, Structural remodeling of bacteriophage T4 and host membranes during infection initiation](https://pubmed.ncbi.nlm.nih.gov/26283379/), including abstract and figure descriptions. It observes tail-tube penetration and a channel connecting viral DNA delivery to the host cytoplasm. The mathematical collision evidence establishes the model defect; the source establishes why an open transport path matters.

**Requested correction:** remove the closed axial rod, provide an actual aperture through the baseplate and capsid neck, and retain a continuous hollow conduit. Do not merely add an outer tube or make solids transparent. Check both DNA backbones and their finite tube radii against capsid/tail/baseplate meshes throughout injection, then retain the original continuity, direction, length and maintenance assertions.

Quantitative evidence was sent directly to the author p_paramecium_life and root. The following recheck was performed after the author updated the geometry; no product edits by this reviewer.


## Independent recheck after the author’s channel repair

The author replaced the axial solid with a genuinely open tube (local inner radius 0.031), added an open neck connector, clipped the T4 shell below local y=-0.08, and replaced the solid baseplate with a hexagonal outer plate containing a circular aperture. The stored coil ends at `headY + 0.09` before transitioning to the straight conduit, clearing the neck entrance.

The independent probe used the **union of every visible injection interval**, rings **0–845** on **both** actual backbone meshes. Since this repair slides draw ranges over a fixed path and the attached visitor/channel do not move during delivery, that union covers all injection progress, including times between authored test samples.

The collision inventory included all effectively visible visitor mesh geometry, **every capsomer and sheath instance**, other tail/baseplate components, and the host delivery-channel mesh: **462 mesh/instance records**. For each backbone segment, a 0.009-expanded segment AABB selected candidate solid triangles; the narrow phase computed finite segment–triangle intersection plus endpoint–triangle and segment–triangle-edge distances. The 0.008 backbone tube radius was included as a swept-radius clearance threshold. This is an actual triangle-distance check, not a vertex or name-only assertion.

- **510,224** triangle-distance checks; **zero** distances below backbone radius 0.008.
- Minimum checked backbone-center-to-surface distance: **0.009746991**, at `T4-open-tail-tube`; conservative net clearance: **0.001746991** model units.
- No residual capsomer, sheath, capsid, neck, baseplate or delivery-channel intersection found by this method.
- Independent 1001-time draw-range sweep still passes: both rails use equal complete-segment intervals within their actual index buffers. Centerline length **2.5441722–2.5517946**, maximum adjacent center spacing **0.00639677**.
- All 64 straight-tail winding samples remain right-handed: scalar triple product **0.00009513455–0.00009513492**.
- The updated local `science.test.mjs` passes its original two issue regressions plus actual capsid/neck/tube/baseplate segment–triangle obstruction checks and tube-radius clearance. Maintenance code was not changed by this extra repair; its independent 1001-time retained-chromosome/insert/CI check remains applicable.

**Acceptance boundary:** the focused DNA transfer, open path, chirality and maintenance checks pass. This is not an atomistic phage validation or a replacement for root’s final visual review. Original issue accounting remains two repaired audit issues plus one separately discovered and now repaired peer residual.
