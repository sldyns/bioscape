# Energy Phase B resolution · 2026-10-04

All six Phase A issues and rendered follow-up issue 20261004-energy-07 are fixed in the owned energy module. Glycolysis mechanisms remain unchanged; its label endpoints were corrected after screenshot review. No shared files or browser were used.

| Issue | Resolution |
| --- | --- |
| 20261004-energy-01 | Moved CI/III/IV proton trajectories and their arrows into the actual drawn membrane-domain axes. Yeast retains only III/IV transfer. Fo return and its arrow now cross at the a/c interface rather than beside the motor. |
| 20261004-energy-02 | Q and cytochrome c now take smooth continuous outward/return legs while retaining full size and their membrane/IMS compartments. NADH-supply, electron, proton and ATP event glyphs grow/shrink at recycle endpoints and activation; leak activity still controls ATP return and rotor slowing. |
| 20261004-energy-03 | Moved NDH-I/bo3 pumping and arrows to the actual membrane-domain axes. Chemical protons enter the oxidase from cytoplasm and terminate in its core; quinol proton release begins on the periplasmic side. Fo return now lies at the a/c interface. |
| 20261004-energy-04 | The single Q/QH2 carrier now continuously returns along the curved membrane, with no visible endpoint reset. Repeated event glyphs smoothly recycle and enter while preserving qualitative branch-dependent output. |
| 20261004-energy-05 | b6f-associated H+ crosses the actual b6f membrane domain with cytoplasm-to-lumen direction. ATP-synthase return crosses at its a/c interface. PSII proton release remains lumenal and dark mode retains zero light-driven flux. |
| 20261004-energy-06 | PQ and PC/c6 are continuous full-size shuttles in their membrane and lumen compartments. Photon/electron/proton/ATP event glyphs use smooth activation and vanish at their recycle cut; carrier mobility remains distinct from dark-suppressed light-driven flux. |

## Verification

The owned science suite passed all existing membrane/c-ring/phosphate tests and the new actual-geometry/continuity regression. All fifteen registered root/condition configurations retain finite geometry, deterministic seeking, stable resources and browser-target compilation. No old regression was relaxed.

The new regression verifies **50 protein/leaflet crossings**, with a minimum **0.2452 scene-unit clearance beyond full proton radius** from the real instanced lipid-head triangle surfaces. Transport crosses the actual drawn protein-domain axis and bounds. Negative controls restore the original respiration, bacterial chemical-uptake and b6f positions and confirm lipid collision.

The five unique carriers stay full-size and travel both directions within their correct compartments. Their largest former-wrap difference at epsilon 0.0001 is **0.00000103 scene units**, compared with the original **1.03–1.86-unit jumps**. Light/dark, both bacterial branches, yeast Ndi1 and coupled/leak distinctions remain. Repeated flow glyphs shrink only at their source/sink recycle intervals; they remain full-size during the tested leaflet crossings.

Commands: `node src/processes/modules/energy/continuity.test.mjs`; `node src/processes/modules/energy/science.test.mjs`; owned-file Prettier; owned-directory `git diff --check`.

Evidence: [phase-b-science.log](../evidence/energy/phase-b-science.log), [new regression](../../../../src/processes/modules/energy/continuity.test.mjs). Full per-issue file/source accounting: [energy.json](energy.json).

## Remaining acceptance

Root continuous rendered review remains pending, especially corrected H+ paths within protein domains. These are mechanism schematics, not atomic transport-channel reconstructions. No FPS, physical-device, deployment or publication claim. Existing detail, source records, ring counts, organism differences and historical audit evidence are retained.

## Rendered follow-up · 20261004-energy-07

Thirty default-root/default-condition stage frames exposed old text offsets being used as leader endpoints. Concrete-object labels now bind to actual transformed mesh surfaces, including dynamic carriers, carbon chains, NAD/adenylates and branch-dependent proteins. Region descriptions remain regional; reaction labels explicitly identify their enzyme sites.

The new label regression passes **1760 endpoint checks** across all **15 contexts**, follows a real translated protein, and rejects restored old offsets. All earlier science and continuity checks still pass. Original evidence and per-model findings are in [energy-rendered.md](energy-rendered.md) and [repair-discoveries.json](../evidence/energy/repair-discoveries.json). Corrected screenshot recapture is pending root review.
