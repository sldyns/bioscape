# Traffic scientific corrections

All five Phase A issues are fixed in the owned models. Original audit evidence is unchanged. Browser rendering and global acceptance remain with the root reviewer.

| Issue | Correction | Actual-geometry evidence |
| --- | --- | --- |
| traffic-01 | LDL receptors retain distinct membrane anchors through fusion and sorting. | Dense .67–1 sampling verifies pair separation and fused-profile membership. |
| traffic-02 | The inner autophagosomal membrane opens/removes before enzyme access, then cargo cleavage. | Paired leaflet boundary vertices show an actual opening; enzyme paths wait; cargo and fragments remain unchanged until access. |
| traffic-03 | Large ER ribosomal subunit faces the membrane; small subunit faces cytosol. | All 39 subunit pairs have the correct membrane-normal ordering. |
| traffic-04 | Donor and carrier mouths connect through surfaces whose boundary polygons match both interfaces. | All boundary points match rendered polygon edges at ER budding and both Golgi transfer intervals (tolerance 2e-6). |
| traffic-05 | Carrier-derived lipid instances persist into a visible plasma-membrane patch. | Same object identities and counts survive .85–1; final lipid locations lie in the surface plane. |

`node src/processes/modules/traffic/science.test.mjs` passes the five regressions plus finite geometry, stable resource inventory, deterministic seeks, and module bundling for all three processes. Owned JavaScript files were formatted with Prettier.

Evidence remains the authoritative sources already opened and recorded in the Phase A audit: NCBI cell-biology chapters for endocytosis, fusion, and secretion; Yim and Mizushima (2020) for inner-autophagosomal-membrane removal before cargo access; Pfeffer et al. (2015) for the large-subunit/Sec61 interface. No new source claim was introduced.

Teaching limits remain explicit: shape changes and rates are illustrative; membrane area mechanics, atomistic fusion, lipid hydrolysis chemistry, and translocation initiation are not simulated. The paired leaflet cutaways are viewing aids. Tests verify the identified defects and stated invariants, not every scientific fact or visual acceptance.

Peer follow-up for traffic-05: the first correction retained lipid identities but its intermediate flattening did not follow the membrane shell. Corrected both from one profile and attached lipid midplanes barycentrically to rendered triangles. All lipid pairs now pass closest-triangle distance <2e-6 at .90/.95/.965/.975/.98/.987/.991. The peer's original .975/.98 failure is covered.

Peer follow-up for traffic-02: rounding previously stranded parts of the stationary hydrolases outside the membrane; delaying rounding alone still left proteins intersecting the fusion neck during transit. Delayed rounding plus trajectories that converge toward the neck axis fixes both. Every hydrolase mesh vertex is checked against the actual paired-leaflet envelope profile from .65–1 at .01 intervals, retaining .025 inward clearance.
