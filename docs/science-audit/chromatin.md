# Chromatin scientific audit — Phase A

**4/4 models audited; all four have confirmed issues. Eight findings: seven P1, one P2. No product files changed.** Read all stage/intro/label/control/context text and geometry helpers; executed every stage start, interval midpoint and endpoint across 13 root–condition combinations. Inspected all four supplied `.55` screenshots. Technical execution is not scientific approval.

## chromatinAccess — confirmed_issue, high confidence

- **chromatin-01 · P1:** `chromatinAccessProcess.js:160–187` reverses both levels of chirality. The centerline `(increasing x, -R sin a, R cos a)` wraps right-handed around the histone core; the local DNA `(increasing x, +r sin θ, +r cos θ)` twists left-handed. Nucleosome wrapping should be left-handed and ordinary B-DNA right-handed. Generate a corrected superhelix and a transported local-frame duplex; test the two winding signs separately. [Nucleosome topology primary study](https://www.nature.com/articles/s41467-018-06547-w), [B-DNA structural reference](https://www.rcsb.org/structure/1BNA).

The fixed sequence-site coordinate, connected linker/core curve, retained histone core, ATP-disabled comparison and accessibility-versus-expression caveat otherwise hold. Animal/plant/yeast context is appropriately limited to ISWI-family sliding; [ISW1 structure](https://www.nature.com/articles/s41594-019-0199-9) and [CHR11 record](https://www.ncbi.nlm.nih.gov/gene/819814) were opened.

## tad — confirmed_issue, high confidence

- **chromatin-02 · P1:** `tadProcess.js:138–147` twists the duplex in a fixed world-yz plane. DNA is left-handed on the arms and changes local winding when the loop tangent reverses. Use a right-handed transported frame or a coarse single chromatin fiber. Verify local twist and transverse strand separation throughout the loop. [B-DNA reference](https://www.rcsb.org/structure/1BNA).
- **chromatin-03 · P2:** `tadProcess.js:112–136` keeps both spatial arms at 4.35 units while adding a growing loop. Integration of the actual centerline yields **10.3289 → 19.6922** units normally, and **22.6877** after boundary deletion, for the same 0–1 genomic extent. Preserve contour length by reeling in arms/slack, or explicitly use a nonmolecular contact-domain diagram. [Primary loop-domain study](https://dspace.mit.edu/entities/publication/de044b1e-c42c-46c8-961b-7a59f0c77afd).

Mammalian-only scope, convergent site orientation, right-boundary deletion, depleted-cohesin geometry, no membrane, no universal fixed-loop/TAD equivalence and preserved compartmentalization caveats are correct. Exact cohesin mechanics remain intentionally schematic. Direct CTCF article/PDF opens failed; its indexed abstract was not counted as fully opened evidence.

## plantGenome — confirmed_issue, high confidence

- **chromatin-04 · P1:** `plantGenomeProcess.js:73–94,115–138` gives all three genomic duplexes left-handed, world-axis twist. Correct each with a local-frame right-handed duplex. [B-DNA reference](https://www.rcsb.org/structure/1BNA).
- **chromatin-05 · P1:** `plantGenomeProcess.js:240–254,343–362` moves RNA diagonally past the drawn nuclear pores. For three upper-transcript contour points, pore-plane offsets are **0.2817, 0.1067, 0.1273**, versus an approximately **0.069** clear pore radius, before adding RNA thickness. Thread RNA through the actual lumen before moving toward ribosomes; test every crossing point, both transcripts and both controls. [Nuclear transport](https://www.ncbi.nlm.nih.gov/books/NBK26932/).
- **chromatin-06 · P1:** `plantGenomeProcess.js:202–208,375–385` does not connect local RNA or nascent peptide to the internal ribosome. The helper groove is near `y+0.15`, whereas local RNA is near `y+0.35`; the peptide coil never reaches the designated exit at `x≈3.5895`. Anchor RNA in its channel and growing peptide at the exit until release. [Translation mechanism](https://www.ncbi.nlm.nih.gov/books/NBK26829/), [ribosome–mRNA structure](https://www.rcsb.org/structure/7K00).

Compartment identities and nuclear-versus-organelle expression division are otherwise appropriate. Signal-deleted protein remains cytosolic; nuclear mRNA does not enter organelles. Primary Rubisco and chloroplast-import full texts were retrieved through Europe PMC after some direct publisher/PMC opens failed. No claim that plant organelle DNA is universally one circle was found.

## plantRdDM — confirmed_issue, high confidence

- **chromatin-07 · P1:** `plantRdDMProcess.js:144–156,174–181,315–323` attaches seven methyl stems to exact **backbone** coordinates. The animated flipping cytosine is an extra independent group while the original duplex base remains in place. Modify one actual target cytosine, preserving its sugar attachment and identity; attach the methyl group to that base, or use an explicit linked inset. [DRM2 substrate structural study](https://pubmed.ncbi.nlm.nih.gov/34078593/).
- **chromatin-08 · P1:** `plantRdDMProcess.js:19–47` builds source and target genomic DNA as left-handed helices. Correct winding and recompute base/mark attachment positions from the corrected strands. [B-DNA reference](https://www.rcsb.org/structure/1BNA).

RNA identities/order were traced rather than inferred from metadata: RDR2 complement grows in reverse parameter order; guide and scaffold end up antiparallel; DCL separation and passenger removal are present; inactive DRM2 preserves upstream pairing and only prevents new marks. The canonical Arabidopsis scope and maintenance-pathway caveat are sound. [Pol IV/RDR2/DCL3 primary study](https://pmc.ncbi.nlm.nih.gov/articles/PMC6698059/) was opened. Exact sequence complementarity is untestable because no real sequence is claimed.

## Correction boundary

Wait for global Phase A reconciliation. The repeated DNA issue should be consolidated into a common scientific geometry invariant, but all four affected model entries remain individually identified. None of the findings justify replacing the existing root scopes or expanding process IDs. JSON contains exact evidence, fixes and verification invariants for each issue.
