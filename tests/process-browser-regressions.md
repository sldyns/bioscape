# Process browser regressions

Run Vite on localhost (`npx vite --host 127.0.0.1`), then open:

- `/tests/process-view-browser.html`: installed OrbitControls keyboard rotation, forced damping settling, direct live canvas readback, saved-view scene remount. Two real division models must retain identical live pixels. Same-state determinism is a positive control. This uses synthetic keyboard events, not a performance measurement.
- `/tests/process-responsive-browser.html`: actual full app in same-origin iframes. Compare wide-to-narrow dimensions with a fresh narrow document, verify native DPR and buffer scale. It creates its own child viewports without changing the desktop display or outer browser viewport.
- `/tests/process-disposal-browser.html`: actual React and installed OrbitControls mount/unmount both division scenes twice. The active subscription count is a positive control; every unmount must remove its original document keyboard listener, clear the ready API, and remove its canvas. It does not force GC or measure heap/GPU memory or FPS.

Read `#result`: PASS is required for a qualified implementation. FAIL and ERROR differ; inspect all control checks before attributing differences to product code. These fixtures require actual browser WebGL and are **not automatically run by npm run check**. Do not use them as stable60FPS or nativeDPR2 evidence.

Frozen original-failure/candidate-pass records are in `docs/qa/site-optimization-2026-10-18/process-share-framing-followup-20261020/`, under LIVE-ROUNDTRIP-R2 and RESPONSIVE-REGRESSION-R2. Invalid earlier fixture attempts remain separately recorded.
