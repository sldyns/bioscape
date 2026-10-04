# Additional chromatin render discoveries

The original Phase A audit is unchanged. Root confirmed that `label.position` is the **leader target**, in both live and exported rendering, rather than a text-layout coordinate. The original-resolution image review therefore confirms four new P2 annotation issues:

| Issue | Model | Confirmed failure |
| --- | --- | --- |
| 20261004-chromatin-02 | chromatinAccess | ISWI leader crosses the brown DNA-binding factor; other concrete-object anchors also use off-body offsets. |
| 20261004-chromatin-03 | tad | CTCF leaders point visually to gold within-domain loci; cohesin/contact anchors are off their geometry. |
| 20261004-chromatin-04 | plantGenome | Cytosolic-ribosome/translocase anchors miss their objects; static cargo anchors fail to follow cytosol-retained control products. |
| 20261004-chromatin-05 | plantRdDM | DCL3/RDR2 annotations miss their actual producer geometry; moving AGO4/DRM2 and target/scaffold anchors also need correction. |

Detailed capture paths and proposed checks are in [repair-discoveries.json](repair-discoveries.json). Four exact pre-label-repair model sources are retained in `label-anchor-baseline/` for regression rejection checks.

The correction will bind specific-object labels to existing rendered objects or existing RNA/DNA sampling functions and will update moving targets. Region captions (nuclear/sliding schematic, mammalian-context/non-Hi-C note, Arabidopsis cutaway/canonical context) intentionally remain area annotations. No mechanism geometry, source identity or model detail needs to change for this repair.

At discovery-record time, root requested a pause on product writes to avoid HMR during another active playback batch. Only evidence and test preparation are being written until root's explicit release.
