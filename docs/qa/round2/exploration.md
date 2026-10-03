# Round 2: exploration continuity audit

2026-10-03. Read-only production-source investigation and isolated CUA browser tab. No production source edits in this lane. Baseline tested at `http://localhost:4201/`; initial dev5174 observations were excluded from persistence evidence to avoid HMR interference.

## Confirmed findings

### P2 — Reload discards edits made after a portable/history snapshot

Reproduction:

1. Open `#/cell/nucleus`, select Exploded, turn labels on and zoom in.
2. Open Transcription from related processes, choose step 4 (0.43), speed 1.5, labels off, zoom in.
3. Return through “From structure”, then browser Back. The process correctly restores step 4 and its settings; the URL contains `s.process.progress=0.43`.
4. Choose step 6 (0.86). The rendered timeline reads 860 and 0:24/0:28.
5. Reload. The timeline returns to 430, step 4. A newly opened Share dialog exactly matches the old step-4 shared URL.

Expected: continued exploration in the same history entry survives reload. Actual: only the last departure/pop/share-link snapshot is recoverable; current edits stay in refs/state. App receiveProcessState/receiveView do not publish them to the current URL; only comparison changes have debounced URL persistence. Reported to integrator, who is implementing generalized persistence and a pagehide flush.

Structure counterpart: `#/cell/nucleus` with mode `explode`, labels `true`, zoom `0.67955` reloads as mode `section`, labels `false`, zoom `1.0035`. Before/after values were read from the public Share input, not private renderer state.

### P3 — Visiting another model's process removes the first model's resume shortcut

Reproduction: animal-cell nucleus → Transcription → return to structure → plant central vacuole → C4/CAM → return → Animal cell. The animal-cell structure has no “Resume process” button although its Transcription session remains remembered internally. `lastProcess` is one global slot, filtered by root in the structure panel. A per-root latest-process map would preserve the convenient return route when alternating models. This is a continuity improvement, not demonstrated loss of the underlying process state.

## Checks that passed

- Nucleus → Transcription → “From structure” restores exact serialized origin snapshot, including exploded mode, labels and camera direction/target/zoom. Returned Share URL was byte-for-byte identical to original (`zoom=0.80899`).
- Browser Back restores Transcription progress 0.43, speed 1.5, annotations false and camera zoom0.84. Shared snapshot also contains the original nucleus camera.
- Reloading the unchanged shared/history snapshot restores it exactly. The defect above concerns newer edits after that snapshot.
- Share dialog Escape closes only the dialog and does not navigate up the structure hierarchy.
- Plant vacuole → C4/CAM enters CAM at progress0.26, step3. Visible condition text explains night acid storage and daytime decarboxylation, the linked vacuole is explicitly CAM-only, and scope names specialized maize/Kalanchoe examples.

## Limits

This lane did not revalidate every scientific mechanism or all 84 process geometries. No real mobile device or touch tests, arbitrary drag camera orientations, exhaustive modal keyboard matrix or direct screen-reader session were performed. Camera numbers above came from public serialized scene links. Source review covered App navigation/snapshot/history behavior, process session callbacks, related-process preparation and Share dialog keyboard handling.

## Post-fix verification on dev5174

Integrator updated App portable snapshot persistence and changed latest-process bookkeeping to a per-root map. This lane performed the following actual CUA regressions after loading the patched application afresh:

- Immediate structure reload: nucleus → Exploded → labels on → Zoom in → reload in the same tool call. Restored controls have `aria-pressed=true` for both Exploded and labels. URL camera zoom0.80349 is retained.
- Exact process reproduction: Transcription step4 .43, speed1.5, annotations off, zoom0.84 → origin → browser Back → step6 → immediate reload. Actual timeline value860, step6, speed1.5, annotations off and camera zoom0.84 survive. Origin retains exploded nucleus, labels on and camera zoom0.80349.
- Browser Forward after that reload returns the nucleus in exploded mode with labels on. Browser Back returns the amended step6 process, not the earlier step4 snapshot.
- Cross-root Resume: remembered animal Transcription step6 → plant central vacuole → CAM process → return → Animal cell. “Resume process Transcription” is now present and returns to original nucleus-origin process at progress0.86.
- Source review of shared snapshot scheduling/pagehide callback found no additional concrete race in the tested sequences. This is targeted verification, not exhaustive browser lifecycle/concurrency coverage.

Both findings above are fixed in the reviewed working source and passed these development-browser checks. Stable4201 is the pre-fix baseline; final production-build verification belongs to the integrator's release gate.
