# Independent peer review — energy

Reviewer: `p_genome`. Product/model/test files were read-only. Reviewed all five original correction records, the four energy model implementations, `detailKit.js`, the actual geometry tests and branch-update code. Ran `node src/processes/modules/energy/science.test.mjs`: all issue-specific tests and the imported finite-geometry/seek/resource/browser-bundle checks passed.

**Initial disposition: the five targeted changes are real, but unconditional acceptance is held for one additional membrane-orientation defect, `peer-energy-01`, below.** This is not a failure of the corrected numerical c-ring counts. The existing tests checked F1 position and ring count but missed which side carries the explicitly drawn c-subunit connecting loop.

## Rechecked original fixes

| Original issue | Independent result |
|---|---|
| energy-01 | Ndi1's old through-membrane cutout is filled on both leaflets. Actual Ndi1 mesh vertices lie at membrane-relative y = −.705 to −.04444: matrix-facing with shallow membrane insertion, without reaching the opposite leaflet at +.205. This agrees with the monotopic matrix-facing topology in [4G9K](https://www.rcsb.org/structure/4G9K), opened during this review. |
| energy-04 | NDH-II control enables an exact lattice patch, while NDH-I retains its occupied footprint. Independently measured NDH-II vertices relative to the local curved membrane y = −.075x² span −.76566 to +.05241, remaining below the periplasmic leaflet at +.205. The small positive core penetration is compatible with a membrane anchor; no new through-span was inferred merely from a bounding box. |
| energy-03 | This is a real phosphate-attachment change, not a renamed molecule. At p=.70 the left phosphate bond starts on terminal carbon (−1.94,−.28,−.05); at p=.76 it starts at middle carbon (−1.65,−.17,0), endpoint-to-C2 error 2.1×10⁻¹⁷. The substrate bond is absent during the omitted mutase interval and during later transfer. The other branch mirrors the same carbon mapping. The positions agree with the net [3-PG/2-PG reaction](https://iubmb.qmul.ac.uk/enzyme/EC5/4/2/11.html) followed by [2-PG dehydration to PEP](https://iubmb.qmul.ac.uk/enzyme/EC4/2/1/11.html), both opened. Oxygen, hydrogen and bond orders remain explicitly omitted in this carbon/phosphate bookkeeping model; it should not be presented as an atomic PEP formula or atom-exact mutase trajectory. |
| energy-02 | Actual visible subunit groups are c8 for animal and c10 for yeast; plant and paramecium have a continuous unsegmented contour with no hidden visible count. Opened [bovine 2XND](https://www.rcsb.org/structure/2XND) and [yeast 3U2F](https://www.rcsb.org/structure/3U2F). F1 lobes are matrix-facing in all mitochondrial roots. The additional loop-orientation defect remains below. |
| energy-05 | Actual visible cyanobacterial subunit groups are c14 and F1 is cytoplasmic, above the upper thylakoid membrane. The code passes 14 explicitly. The primary 2007 paper's indexed text identifies PCC 6803 among its inferred c14 strains; this review's PMC HTML access was challenged. The author's separately documented original-table verification supplies the remaining strain-specific evidence; this peer check independently verifies the implemented count rather than claiming another atomic determination. |

## peer-energy-01 — P1: resolved c-subunit connecting loops face away from F1

**Location:** `src/processes/modules/energy/detailKit.js`, `synthase()`, original reviewed lines 270–288. Both helices are joined by a tube whose local points are `[-.036,+.29,0]`, `[0,+.33,.02]`, `[+.036,+.29,0]`. Only rotation about y is applied; the sign of `headOffset` never orients the hairpin.

Read-only probe transformed every vertex of the actual connecting-loop TubeGeometry to world space at p=.8 and subtracted the rotor/membrane center:

| Context | Visible c subunits | Loop y interval | F1 lobe-center y |
|---|---:|---:|---:|
| Animal mitochondrion | 8 | +.27796 to +.34777 | −1.48 |
| Yeast mitochondrion | 10 | +.27796 to +.34777 | −1.48 |
| E. coli | 10 | +.27796 to +.34777 | −1.28 |
| PCC 6803 thylakoid | 14 | +.27796 to +.34777 | +1.04 |

The first three contexts therefore place the polar connecting loops on the opposite membrane side from their F1/central-stalk connection. These loops belong on the cytoplasmic/matrix F1 side. Independently opened the E. coli NMR primary [Dmitriev and Fillingame 2007 abstract](https://pubmed.ncbi.nlm.nih.gov/17766379/), identifying the studied loop as cytoplasmic. Independently fetched and parsed the complete primary [metazoan c-subunit paper XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC4390263/fullTextXML), whose bovine structural discussion locates these loop residues at the matrix–bilayer interface. The yeast assignment follows conserved mitochondrial hairpin topology. The cyanobacterial positive-side orientation is already consistent.

**Required correction:** orient the complete resolved hairpin according to the sign of `headOffset`. A proper 180° rotation preserves alpha-helix handedness; a single-axis negative scale would introduce a separate mirrored-fold problem. Keep all species counts, radial placement, rotor rotation and F1 positions unchanged.

**Required regression:** use actual connecting-loop vertices and the membrane/F1 transforms to assert loop and F1 are on the same side in each resolved-ring root, including E. coli and light/dark PCC 6803. Include a negative test that removes the orientation correction. Existing `checkRing` passes because it counts three TubeGeometry children and tests F1 coordinates without inspecting the loop's side.

The finding and exact geometry measurements were sent directly to `p_turnover` and root. No energy source files were edited by this reviewer. This document records the initial review; a later retest can append closure evidence without erasing the original finding.

## Closure retest — peer-energy-01 fixed

`p_turnover` corrected the shared helper by applying a proper X-axis half-turn when F1 is on the negative side, and added actual loop-vertex/F1-side assertions. I independently reran the complete local energy science test and the original world-vertex probe after that edit; both passed.

The animal, yeast and E. coli loop intervals are now **−.34777 to −.27796**, on the same side as F1. Cyanobacterial loops remain **+.27796 to +.34777**, with F1 above the thylakoid. Actual counts remain **8/10/10/14** respectively, and every subunit's local transform determinant is +1 within floating-point error, consistent with a rotation rather than a handedness-reversing mirror. The new tests cover this former blind spot across the supported roots/controls.

**Current disposition: qualified acceptance of all five original fixes plus closure of peer-energy-01. No independently confirmed residual issue remains in this targeted review.** Browser rendering and atomically exact geometry are not claimed by these headless checks. The initial finding above is preserved as the review trail.
