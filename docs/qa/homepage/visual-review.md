# Homepage rendered visual review

Reviewed 2026-10-03 through an independent background CUA browser tab at `http://localhost:5174/#/`. Actual default viewport: 1280 × 720, English. No viewport override, build, production mutation, or application-source edits performed.

## Observed

- Animal cell, plant cell, and neuron hero views render complete silhouettes with balanced text/image columns. Plant and neuron loading showed their posters and a Preparing model status, followed by the interactive model; no blank transition was witnessed. This was visual observation, not frame-by-frame transition measurement.
- All nine collection images are present, consistent with their labels, contained without clipping. Long English model names fit at this viewport. Neuron occupies noticeably less visual area than the neighbouring erythrocyte and muscle fibre.
- All six featured process cards show coherent pale-background scientific images. Long process titles fit; card body areas align. Motion clips were still being integrated during this review, so this does not establish final video playback acceptance.
- Three exploration cards and the footer render without overlap. Section spacing gives clear hierarchy. No horizontal overflow (`documentElement.scrollWidth <= innerWidth`).
- Functional category filters and descriptive copy appear too small and pale at normal viewing size. This is the main visual improvement opportunity.

## Suggested changes for integrator decision

1. Set `.home-model-info p, .home-process-info p` to `font-size: 12px; color: #737984`; set `.home-way p` to the same. Current values are 10px/10px/11px with lighter greys.
2. Set `.home-card-category, .home-process-category` to `font-size: 10px; color: #7b858d`; set `.home-process-tabs button` to `font-size: 11px; color: #737984`. Preserve selected-state styling.
3. Optional: increase only the collection neuron's image by approximately 15%, then recheck its full silhouette and hover scale. Hero neuron framing already works well.

No major layout or composition changes recommended. Mobile/narrow breakpoint review and final post-integration screenshots belong to the integrator's separate checks.
