# Test runner coverage — 2026-10-04

Current snapshot: **66/66 changed/new tests are configured for execution by `npm run check`; remaining omissions: 0.** This is a static execution-chain review; no test suite was run by this audit.

The candidate set contains 42 new files and 24 modified files. `npm run check` invokes `verify`, whose explicit entries and the 22 science groups reach these tests.

## Owner freeze boundary

Root has explicitly confirmed final freeze from all product and test owners, including RNA anchors, yeast nuclear envelopes, CAM and the signals Apaf cytosolic path. The freeze gate is closed. The root-owned final `npm run check` **passed with exit 0**, as recorded in [final-check.json](final-check.json) and [final-check.log](final-check.log). The receipt verifies 198 product/test/script files with unchanged SHA values and file set, plus unchanged baseline HEAD. This static refresh matched all 66 candidate test hashes and `scripts/verify.mjs` to the after-check snapshot; no test was rerun.

An earlier refresh observed the increase from 65 to 66 when `signals/apoptosomeCytosol.test.mjs` appeared. Its owner has since confirmed freeze, and this refresh confirms its static import at `signals/science.test.mjs:10`.

Source changes detected during the short static scan: none. Owner completion is based on the explicit root confirmation above.

## Omissions found and resolved

Omissions were found in two modified tests and new signals regressions, including a test added while this audit was running. Root was notified; the current runner snapshot confirms each status below:

- `src/processes/modules/chromatin/plantSmoke.test.mjs` — covered via `scripts/verify.mjs:60`.
- `src/processes/modules/operons/science.mutations.test.mjs` — covered via `scripts/verify.mjs:61`.
- `src/processes/modules/signals/deformation.test.mjs` — covered via `scripts/verify.mjs:62`.
- `src/processes/modules/signals/labelAnchors.test.mjs` — covered via `scripts/verify.mjs:63`.
- `src/processes/modules/signals/labelEvents.test.mjs` — covered via `src/processes/modules/signals/science.test.mjs:9`.

Retain those explicit entries. `operons/science.mutations.test.mjs` imports `science.test.mjs`; adding an awaited import back from the science file would risk an ESM waiting cycle. No runner additions are currently required. Owner freeze is confirmed and the root-owned integrated check passed; see the linked receipt and log above.

## Evidence and boundary

`test-runner-coverage.json` records every candidate, Git status, content hash and execution path. `test-runner-verify.snapshot.mjs` preserves this runner snapshot. Function-only exports were checked for actual callers, including paramecium review, plant-water flux, operon playback and RNA contact/anchor assertions.

Configured coverage assumes earlier checks succeed: the npm command chain and both runners stop on failure. Static reachability alone does not prove runtime success; the separate root-owned final-check receipt provides that local integrated result. Unchanged historical tests were outside this change-focused coverage audit. A local check is not a commit, push, hosted deployment or physical-device acceptance.

## Changed/new test routing

| Test | Git | Route |
| --- | --- | --- |
| `src/processes/modules/bacterialCore/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/bacterialSignals/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/chromatin/plantSmoke.test.mjs` | modified | verify explicit entry |
| `src/processes/modules/chromatin/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/division/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/energy/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/genome/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/neurons/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/operons/science.mutations.test.mjs` | modified | verify explicit entry |
| `src/processes/modules/operons/science.test.mjs` | modified | operons/science.mutations.test.mjs |
| `src/processes/modules/parameciumLife/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/phageLife/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/plantConnections/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/plantGrowth/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/plantSignals/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/plantWater/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/rna/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/signals/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/traffic/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/translation/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/turnover/science.test.mjs` | modified | verify → science-regressions → group science |
| `src/processes/modules/yeastLife/science.test.mjs` | modified | verify → science-regressions → group science |
| `tests/condition-notes.mjs` | modified | verify explicit entry |
| `tests/scene-capture.mjs` | modified | verify explicit entry |
| `src/processes/modules/bacterialCore/label-anchors.science.test.mjs` | new | verify → bacterialCore/science.test.mjs:4 import |
| `src/processes/modules/bacterialCore/transformation-uptake.science.test.mjs` | new | verify → bacterialCore/science.test.mjs:3 import |
| `src/processes/modules/bacterialSignals/labels.test.mjs` | new | verify → bacterialSignals/science.test.mjs:448 import |
| `src/processes/modules/chromatin/labelAnchors.test.mjs` | new | verify → chromatin/science.test.mjs:9 import |
| `src/processes/modules/chromatin/upstream.test.mjs` | new | verify → chromatin/science.test.mjs:8 import |
| `src/processes/modules/division/cortical-ring.test.mjs` | new | verify → division/science.test.mjs:360 import |
| `src/processes/modules/division/label-anchors.test.mjs` | new | verify → division/science.test.mjs:361 import |
| `src/processes/modules/energy/continuity.test.mjs` | new | verify → energy/science.test.mjs:277 import |
| `src/processes/modules/energy/labels.test.mjs` | new | verify → energy/science.test.mjs:278 import |
| `src/processes/modules/genome/incisionLabel.test.mjs` | new | verify → genome/science.test.mjs:436 import |
| `src/processes/modules/genome/labelAnchors.test.mjs` | new | verify → genome/science.test.mjs:434 import |
| `src/processes/modules/genome/review20261004.test.mjs` | new | verify → genome/science.test.mjs:433 import |
| `src/processes/modules/genome/tailVisibility.test.mjs` | new | verify → genome/science.test.mjs:435 import |
| `src/processes/modules/membrane/process-review.test.mjs` | new | verify explicit entry |
| `src/processes/modules/operons/labelAnchors.test.mjs` | new | verify → operons/science.test.mjs:4 import |
| `src/processes/modules/operons/playback.test.mjs` | new | operons/science.mutations.test.mjs |
| `src/processes/modules/parameciumLife/review20261004.test.mjs` | new | verify → parameciumLife/science.test.mjs:7 import |
| `src/processes/modules/phageLife/continuity.test.mjs` | new | verify → phageLife/science.test.mjs:299 import |
| `src/processes/modules/phageLife/labelAnchors.test.mjs` | new | verify → phageLife/science.test.mjs:300 import |
| `src/processes/modules/phageLife/renderedMechanics.test.mjs` | new | verify → phageLife/science.test.mjs:301 import |
| `src/processes/modules/plantConnections/camStorage.test.mjs` | new | verify → plantConnections/science.test.mjs:311 import |
| `src/processes/modules/plantConnections/labelAnchors.test.mjs` | new | verify → plantConnections/science.test.mjs:310 import |
| `src/processes/modules/plantConnections/topology.test.mjs` | new | verify → plantConnections/science.test.mjs:309 import |
| `src/processes/modules/plantGrowth/fusion.test.mjs` | new | verify → plantGrowth/science.test.mjs:3 import |
| `src/processes/modules/plantWater/labelAnchors.test.mjs` | new | verify → plantWater/science.test.mjs:7 import |
| `src/processes/modules/plantWater/waterFlux.test.mjs` | new | verify → plantWater/science.test.mjs:6 import |
| `src/processes/modules/signals/apoptosomeCytosol.test.mjs` | new | verify → signals/science.test.mjs:10 import |
| `src/processes/modules/signals/deformation.test.mjs` | new | verify explicit entry |
| `src/processes/modules/signals/labelAnchors.test.mjs` | new | verify explicit entry |
| `src/processes/modules/signals/labelEvents.test.mjs` | new | verify → signals/science.test.mjs:9 import |
| `src/processes/modules/traffic/review20261004.test.mjs` | new | verify → traffic/science.test.mjs:8 import |
| `src/processes/modules/translation/labelAnchors20261004.test.mjs` | new | verify explicit entry |
| `src/processes/modules/translation/review20261004.test.mjs` | new | verify explicit entry |
| `src/processes/modules/turnover/continuity.test.mjs` | new | verify → turnover/science.test.mjs:398 import |
| `src/processes/modules/turnover/labels.test.mjs` | new | verify → turnover/science.test.mjs:399 import |
| `tests/original-infection-review.mjs` | new | verify explicit entry |
| `tests/original-photosynthesis-review.mjs` | new | verify explicit entry |
| `tests/original-secretion-label-review.mjs` | new | verify explicit entry |
| `tests/original-secretion-review.mjs` | new | verify explicit entry |
| `tests/original-transcription-labels.mjs` | new | verify explicit entry |
| `tests/process-playback.mjs` | new | verify explicit entry |
| `tests/regulation-label-review.mjs` | new | verify explicit entry |
