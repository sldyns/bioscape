# Membrane rendered discoveries

Default-stage review opened all four sheets (26 captured states) and key original 960×640 images. This follow-up preserves the original Phase A audit.

- **07 / P2 / diffusion:** aquaporin leader points onto right-side lipid heads; its endpoint is .349682 outside the protein bounding box.
- **08 / P2 / activeTransport:** moving ATP/ADP, N/P domains and phosphate use old offset coordinates; pump-state callout points onto lipid rather than the pump.
- **09 / P2 / osmoticBalance:** the static inner-leaflet/cortex callout points outside the shrinking lateral outline and away from its moving window; cell/arrow callouts also need actual object anchors.
- **10 / P2 / bacterialCellWall:** RodA/PBP2/new glycan callouts miss their objects; the new-crosslink label appears before any new bond and points at an old free stem.
- **11 / P1 / bacterialCellWall:** both new crosslinks pass directly through the acceptor's terminal D-Ala4 (axis-to-center distance effectively zero), and new donor D-Ala4 overlaps it (.10 separation versus .128 summed radii). The leaving D-Ala5 also starts on the reaction axis. The visual branch becomes a false linear run. Reposition nonreacting/leaving terminal residues with attached bonds, preserving mDAP3 branch chemistry and molecular conservation.

Source support for donor/acceptor peptide chemistry: [primary E. coli RodA–PBP2 paper](https://www.nature.com/articles/s41467-023-40483-8). The defect is the actual non-endpoint intersection, not a claim of calibrated atomic distances.

Exact findings and verification requirements: [repair-discoveries.json](./repair-discoveries.json). Actual coordinates: [rendered-review-diagnostics.json](./rendered-review-diagnostics.json). Root authorized repair only after these findings were reported; no browser was operated by this reviewer.
