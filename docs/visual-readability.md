# Process annotation review — 2026-09-19

Long annotations now use small markers and an external key. Short notation
such as E/P/A and 5′/3′ stays beside the model. Leaders connect markers to
their anchors; key buttons highlight the corresponding marker. The color
legend and camera controls occupy a separate toolbar.

Numbers are assigned in source order to active, numbered annotations only.
Short notation and inactive annotations do not reserve numbers. The canvas
and key update together when the stage or language changes.

## Verification

- Opened all 84 process routes at 1280 × 875, selected a representative middle
  step, captured the rendered model, and reviewed the screenshots. The sampled
  visible labels had no pairwise overlaps or viewport clipping.
- Reopened all 84 routes after the numbering correction: visible key entries
  formed a continuous sequence on every route.
- Checked translation at its first step, final step and timeline endpoint,
  including English, the reported 1083 × 740 window, and a 390 × 844 browser
  viewport. Key selection highlighted the matching marker; no horizontal page
  overflow was observed.
- Confirmed the thumbnail workbench retains its 640 × 640 canvas with annotation
  overlays hidden.
- Passed label-layout regression tests, process-bounds tests, formatting,
  production build, and release-asset checks.

This is a representative visual/layout review, not an exhaustive review of
every camera angle or animation frame. The narrow viewport check is browser
emulation, not physical-phone testing. Model geometry and scientific content
were not changed in this pass.
