# bacterialCore · Phase B repairs

Both original audit findings and the repair-time handedness finding are fixed. Integration-stage screenshot review then identified four annotation issues, also fixed. All four processes now use actual geometry for their label anchors; the three earlier qualified-pass mechanisms retain their original geometry. Phase A is preserved.

| Issue | Result | Evidence |
| --- | --- | --- |
| 20261004-bacterialCore-01 · P1 | Continuous retained DNA across exterior, ComEC lumen and cytoplasm, in both homology branches. Leading and trailing tips clear the pore continuously. | Independent 242-state maximum joint gap `8.91e−16`; minimum clearance to actual torus rim `.020013`. Removing the pore DNA fails the new regression. |
| 20261004-bacterialCore-02 · P2 | Last pairing endpoint converges onto the chromosome; the former `.18` jump is removed. | Shrinking-epsilon checks from `1e−3` to `1e−7`; actual endpoint coordinates at `.8699999` and `.87` now coincide. Injected `.18` mesh jump fails. |
| 20261004-bacterialCore-03 · P1 | Environmental DNA corrected to right-handed B-DNA. | Actual signed world-geometry products change from `−2.014806e−6` to `+2.014806e−6`, with convention checked against [1BNA](https://www.rcsb.org/structure/1BNA). Reflected mesh fails. |

The uptake fix also corrects an existing unmatched-branch condition that hid imported segment 0 even before degradation. The other strand remains outside, and later unmatched DNA degradation and matched D-loop behavior are preserved. Added pore geometry is prebuilt; update allocates no scene nodes, materials or geometries.

Verification passed:

- `node src/processes/modules/bacterialCore/transformation-uptake.science.test.mjs`: 276 states, actual pore crossings, terminal convergence, duplex handedness and three negative controls.
- `node src/processes/modules/bacterialCore/science.test.mjs`: all prior group geometry checks, arbitrary-seek determinism, finite buffers, stable inventories, bundles and seven historical defect mutations pass.
- Owned-file Prettier formatting completed.

Files: `transformationProcess.js`, new `transformation-uptake.science.test.mjs`, and a one-line import in `science.test.mjs`. Full verification is retained at `evidence/bacterialCore/phase-b-science-final.log`; independent measurements at `phase-b-probe-results.json`; new finding at `repair-discoveries.json/.md`.

## Integration-stage annotation repairs

Issues **20261004-bacterialCore-04 / -05 / -06 / -07** cover expression, division, conjugation and transformation respectively. All are fixed: labels target actual DNA/protein/membrane geometry, absent-object labels are suppressed, and no-homology/blocked-division state descriptions explicitly refer to the retained chromosome or division site. Their unique issue entries and exact evidence are in the JSON resolution and discovery records.

Additional changed files are `bacterialExpressionProcess.js`, `bacterialDivisionProcess.js`, `conjugationProcess.js`, new `labelAnchors.js`, new `label-anchors.science.test.mjs`, and its import in `science.test.mjs`. The label regression passes 208 both-condition states, deterministic seeks and six negative controls. The complete owned-group science suite passed again after these changes; final log: `evidence/bacterialCore/rendered-repair-science.log`.

All 28 supplied stage frames and four full-resolution witnesses were reviewed; details and remaining screenshot refresh gate are in `bacterialCore-rendered.md`.

Root still owns rendered and continuous-playback acceptance. Suggested frames: `.24–.30` initial uptake, `.42` ongoing uptake, `.57–.61` tail release and `.8699–.87` pairing completion, with both homology options. No browser, full-workspace suite or publication was performed.
