# Operons resolutions · 2026-10-04

**All 6 audited issues repaired locally.** Four models and all 16 control combinations retained. Root browser/continuous-playback review remains pending.

## 20261004-operons-01 — fixed

LacI induced departure now begins at the .25 allolactose-occupancy event, after the conversion presentation. Repression remains in both no-lactose conditions; both lactose-present branches release before RNAP loading.

- Actual named ligand meshes and repressor pose checked across p=0..0.25 and all four conditions.
- Restoring the original .17 departure interval is rejected by verifyInducerOrder.

## 20261004-operons-02 — fixed

Independent lac RNAP bubbles open/close continuously. RNA exit strands remain visible as covalent parts of each released transcript; their free ends relax continuously into separate output rows. Initial RNA emerges with a connected prefix beside its polymerase exit.

- Actual phosphate-instance motion at all loading and release boundaries converges as epsilon drops from 1e-4 to 1e-5; maximum fine-step displacement is 0.00081424 world units.
- Each of three exit strands retains all 16 backbone segments and 17 phosphate markers at and after release; actual cylinder endpoints coincide with consecutive phosphate centers.
- Restoring binary opening or polymerase-dependent bridge visibility is rejected separately.
- Previous multi-RNAP open-DNA, duplex clearance and deterministic/resource tests still pass.

## 20261004-operons-03 — fixed

Adjacent trp RNA regions now share reveal boundaries, so the downstream region cannot begin before its predecessor reaches their common junction. Both complete alternative hairpin geometries are preserved.

- Actual draw ranges and shared curve endpoints checked every .001 progress from .215 through .640 for all four conditions.
- Restoring the overlapping .12-duration/.095-spacing schedule is rejected when region 2 first appears at p=.319.

## 20261004-operons-04 — fixed

The trp bubble opens via a smooth loading ramp and closes gradually during the terminating RNAP departure; readthrough remains active.

- Actual DNA instance motion converges through the prior .2/.96 discontinuities in all four conditions; maximum fine-step displacement is 0.00044235 world units.
- Restoring binary bubble opening is rejected with an approximately .4272-unit discontinuity.
- Existing attenuation/free-Trp/charging and duplex regressions pass.

## 20261004-operons-05 — fixed

GAL Pol II loading and departure drive continuous bubble ramps. The nascent exit strand survives release and relaxes as part of the connected GAL1 RNA; only the galactose-present/low-glucose branch transcribes.

- Actual DNA boundary motion converges; maximum fine-step displacement is 0.00044936 world units.
- Connected RNA material and all exit-strand elements remain present throughout .97 release and at p=1; inactive controls remain hidden.
- Separate mutations restoring abrupt DNA opening and disappearing RNA exits are rejected.

## 20261004-operons-06 — fixed

Glycerol positions now follow the contracting cytoplasmic compartment while molecular geometry retains its original size and detail. No adaptive molecule appears outside the shrunken membrane.

- Recovered the inner-leaflet ellipse from actual lipid-head instance centers, including head-radius clearance. Transformed every visible glycerol sphere/segment vertex into membrane-local coordinates at 201 frames for all four conditions.
- Maximum normalized molecular radius: .97469497; inner leaflet surface bound: .98357386 (required additional clearance .001).
- Restoring fixed world-space positions is rejected. Existing full Hog1 pore/activation and early-Fps1-closure invariants also pass.

## Verification

- Owned science/mutation run passed: prior scientific regressions, 1,002 × 16 duplex checks, six new issue invariants and 14 rejected old-code mutants.
- Bacterial, yeast and refinement smoke suites passed all conditions; resource/detail inventories unchanged.
- New regressions live in `src/processes/modules/operons/playback.test.mjs` and are included by the normal owned `science.test.mjs`.
- Focused logs: `docs/qa/process-review-2026-10-04/evidence/operons/phase-b-*.log`.
- Only owned module files and this group’s new resolution/evidence reports changed. Audit records remain unchanged.

## Limits

RNA movement remains a regulatory/transcription schematic, with retained chain elements and continuous geometry rather than atomistic time/bond-length claims. Browser legibility, rendered playback and full integration are root-owned gates and are not asserted by these tests.

## Integrated rendered follow-up

Four sheets / 28 stage frames and four 960×640 originals were inspected. New issues `20261004-operons-07` through `-10` are fixed in source, with 4,707 actual-target checks and active/hidden-branch regressions. Full details: [operons-rendered.md](operons-rendered.md). Ten unique issues are now closed locally; root recapture remains the rendered acceptance gate.
