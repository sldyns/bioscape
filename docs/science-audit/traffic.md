# Phase A — traffic + legacy secretion

Independent reviewer: `p_membrane`. Product files remained read-only. Covered **3/3 assigned IDs**, all declared roots (`cell` only), every progress branch and both languages. None declares scenario controls. Read geometry/helpers, sampled transforms and compartments with Node, and inspected the supplied representative screenshots; no browser was used.

Result: **3 confirmed_issue; 0 qualified_pass; 0 unresolved. Five findings: 3 P1 and 2 P2.** A confirmed issue does not mean that every part of a model is wrong.

## endocytosis — confirmed_issue, high confidence

The main sequence is supportable: external LDL binds luminal-facing LDLR domains, cytosolic adaptors/clathrin accompany invagination, the single-membrane carrier uncoats before endosomal fusion, and receptors sort away from luminal LDL. The pump has its ATPase head on the cytosolic side. Acidification is assumed rather than simulated. These checks agree with the [NCBI endocytosis chapter](https://www.ncbi.nlm.nih.gov/books/NBK26870/) and [coat/scission chapter](https://www.ncbi.nlm.nih.gov/books/NBK26859/), both opened.

- **traffic-01 · P2 · fused receptors merge visually.** `endocytosisProcess.js:157–168`: all three receive the same `xx`, `y`, `z` and rotation from progress .67 through .73. Measured pair distances change from .97448/1.66217 at .66999 to exactly zero at .67, .68, .70 and .72, although three cargo particles remain. Preserve distinct membrane anchors while mapping the carrier surface into the endosome. Verify identity/separation and membrane sidedness through the transition.

The original LDL PMC paper was access-challenged; its title was not accepted as verification. No defect was inferred merely from omitted proton motion or the explicitly explained cutaway.

## autophagy — confirmed_issue, high confidence

The opening phagophore rim, four-leaflet double membrane, cargo inside the inner membrane, and outer-only fusion are represented coherently before degradation. Numerical profile checks found the inner autophagosomal sphere contained by the merged envelope at .65–.93. [1HTI](https://www.rcsb.org/structure/1HTI) and [1LYA](https://www.rcsb.org/structure/1LYA) records confirm the declared reference protein identities; the aggregate conformation is appropriately labeled illustrative.

- **traffic-02 · P1 · digestion and protease entry through an intact inner membrane.** `autophagyProcess.js:95–111,146–168`: inner membrane remains a closed spherical surface, merely shrinking/fading until hidden at .94. At .80 it retains radius 1.2081 and opacity .8569, while cargo is already .1431 degraded and fragments are present; all protease centers are still outside. At .85 one protease center is inside radius 1.1364 while that closed sphere retains opacity .5357. Implement a real preceding breach/removal, then permit protease access and cargo cleavage. A viewing cut cannot serve as the biological opening.

This follows the opened [Yim and Mizushima review](https://www.nature.com/articles/s41421-020-0141-7?error=cookies_not_supported), whose inner-membrane section states that lysosomal enzymes reach captured substrates after that barrier is degraded. Verify that no protease crosses an intact bilayer and no cargo hydrolysis occurs before access.

## secretion — confirmed_issue, high confidence

The tracked cargo starts already folded, so omission of the earlier translocon animation is acceptable. Its cis-to-trans movement remains inside the same maturing cisterna; the text correctly qualifies this as one model and explicitly omits retrograde enzyme traffic. Glycan linkage is unspecified, so later appearance is **not** treated as a demonstrated N-glycosylation timing error. The final soluble cargo exits through the surface pore without duplication. These scoped checks use the opened [ER](https://www.ncbi.nlm.nih.gov/books/NBK9889/) and [ER–Golgi](https://www.ncbi.nlm.nih.gov/books/NBK26941/) chapters.

- **traffic-03 · P1 · ER ribosome subunits inverted.** `secretionProcess.js:220–234`: the explicitly small subunit is placed .04 lower than the large subunit, toward the ER. The large-subunit exit site should face the translocon; see the opened primary [native Sec61/ribosome structure](https://www.nature.com/articles/ncomms9403). Reorient the two subunits and verify the membrane-facing interface on every ER row.
- **traffic-04 · P1 · unsealed donor–neck–carrier interfaces.** `secretionProcess.js:50–101,174–193,262–278,463–503`: ER mouth is an ellipse with semiaxes .08714/.34233 at x=−2.03833, connected only by an independent radius-.15 cylinder; carrier mouth is radius .20939 at x=−1.90859. Unmatched aperture sectors remain open to cytosol outside the declared front cut; Golgi connections repeat the pattern. Use a shared/welded transition surface. Verify boundary edges and compartment connectivity throughout budding/fusion, following the [membrane-fusion mechanism](https://www.ncbi.nlm.nih.gov/books/NBK26859/).
- **traffic-05 · P2 · membrane incorporation disappears/reset.** `secretionProcess.js:340–360,476–485`: carrier lipids vanish at .90, a separate fusion shell appears, and at .992 that shell vanishes while the original membrane closure returns. Keep carrier-derived membrane traceable as a surface patch after fusion. Exact molecular area is not demanded, but the depicted transfer should match the stated incorporation and the [endocytic/exocytic membrane balance](https://www.ncbi.nlm.nih.gov/books/NBK26870/).

Machine-readable evidence, fixes, source observations and verification invariants are in `traffic.json`. **No Phase B fixes were performed.**
