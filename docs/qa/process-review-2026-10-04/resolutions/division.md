# Division repairs · 2026-10-04

Product and test code is frozen for root rendered review. Both assigned definitions and both mitosis attachment conditions remain supported; no shared player file or test runner was edited.

| Issue | Repair | Evidence |
| --- | --- | --- |
| 20261004-division-01 | Three full-detail cortical belts now deform against the actual inner membrane contour. | New test maximum centreline-to-triangle gap **0.037536**, versus original gaps **0.34–0.52**; original source fails the same bound. |
| 20261004-division-02 | Reuse scalar terms, active cells and edge intersections; preserve the complete level-set resolution. | Nine field states × two layers: **zero difference** in all position/normal values and identical draw ranges. Complete model median I furrow **29.98 → 15.44 ms**, II **28.46 → 12.54 ms**, stable membrane **0.234 → 0.236 ms**. |
| 20261004-division-03 | Live world-space surface anchors replace detached labels; eighth outer kinetochore and retained bridge are explicit targets. | **226** active surface assertions, both attachment choices, timeline and transformed-root coverage. Original spindle/kinetochore/bridge gaps **.3570/.8887/.8246 → 0**. |

`node src/processes/modules/division/science.test.mjs` and `node src/processes/modules/division/division.smoke.mjs` pass. Science tests retain the original contact, checkpoint, chromosome partition, open bridge/manifold and irregular playback regressions, then import the new cortical-ring and label regressions. Full logs and baseline-rejection evidence are under `../evidence/division/`.

Timing is bounded synchronous `model.update` work. The largest first-furrow sample after repair was **19.34 ms**; these measurements do not establish guaranteed frame budgets, browser FPS or physical-device smoothness. Root still owns rendered playback through both furrows and projected label-layout acceptance. See `division.json` for exact samples, sources, changed files and limits.

The scientific scope and primary sources remain those documented by the independent audit: mouse-oocyte evidence only supports conserved chromosome orientation; mouse TEX14 supports retained male bridges; the Drosophila paper only supports generic ring/membrane coupling. No additional species-specific mechanism was introduced.

**Evidence integrity:** `../evidence/division/evidence-recovery.md` discloses the accidental overwrite and recovery of the original diagnostics JSON. Original audit/log files survived; raw Phase A timing arrays did not. The final comparison and timing artifacts use separate filenames. Nothing in this report calls recovered records untouched evidence.
