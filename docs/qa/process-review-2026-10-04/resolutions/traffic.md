# traffic · Phase B resolution · 2026-10-04

All assigned issues below are fixed in source and pass focused regressions. Rendered acceptance and integration remain with root; Phase A reports are unchanged.

## 20261004-traffic-01 · fixed

The connected pit contains a real membrane neck. Neck radius, dynamin placement and collar recruitment/disassembly share the constriction state; the donor membrane retracts after scission. Receptor/cargo positions remain continuous through the sealed-carrier handoff.

- Actual dynamin bead vertices remain outside the rendered neck outer leaflet at recruitment/constriction samples; minimum measured clearance .01499999.
- Actual membrane radius decreases over .39..43 rather than remaining frozen. Collar is absent at sealed-carrier state .43.
- Existing receptor-anchor, luminal-cargo, resource stability, finite-buffer and deterministic-seek checks pass.

## 20261004-traffic-02 · fixed

Map lysosomal anchor coordinates to their corresponding right-lobe coordinates on the initial fused surface, then follow the same material coordinates through fusion and rounding.

- World-space anchor displacement converges to zero across .65 +/- epsilon at epsilon 1e-4,1e-6,1e-8; the former 2.369646/.892791 jumps are rejected.
- All seven glycan bases and V-ATPase anchor remain within .002 of the actual rendered paired-leaflet midprofile across fusion and rounding.
- Existing inner-membrane barrier/enzymatic access and complete-hydrolase containment regressions remain passing.

## 20261004-traffic-labels-01 · fixed

Bind LDL, clathrin hub, recycling receptor and dynamin leaders to actual moving subjects; put the endosome label in its lumen and synchronize lifecycle visibility.

- Labels are compared to actual composed clathrin instance centers, LDL/receptor objects and dynamin subunit world positions through arbitrary seeks.
- Extracellular LDL label deactivates at scission, clathrin/dynamin follow subject visibility, sorting label begins with the sorting stage. Label objects and position arrays remain stable.

## 20261004-traffic-labels-02 · fixed

Track actual backbone vertices and current membrane/cut-edge vertices; place compartment labels in lumina, suppress absent cargo and retain the label on visible proteases.

- Cargo/protease labels coincide with actual transformed backbone vertices within 2e-6, including cargo shrinkage and protease motion.
- Phagophore and inner-membrane labels coincide with rendered mesh vertices. Degraded cargo loses its label while retained proteases keep theirs. Stable label/array identity is asserted.

## Evidence and boundary

- `evidence/traffic/science-after.log`
- `evidence/traffic/review-after.log`
- `evidence/traffic/smoke-after.log`
- `evidence/traffic/fusion-after.log`
- `evidence/traffic/repair-discoveries.json`

Labels were additionally checked against actual subjects after root authorization; their immutable supplementary discoveries are recorded separately. No full-suite, browser, publication or physical-device/performance acceptance is claimed.
