# Plant water — final all-case rendered review

Read-only review of `evidence/browser/conditions-final-gallery-index.json`. The current `processesByRoot` registry exposes each of these four IDs only under `plant`; every declared option is present. Coverage: **8 cases, 8 contact sheets, 56 indexed native 960×640 frames**. All 56 source files and eight sheets exist. Every sheet was inspected with `view_image`; seven selected originals were additionally inspected at their original resolution. No source images were changed or re-encoded.

## Case-by-case results

Each row has 7 captured stages: start, stages 2–6, and end. “Qualified pass” below means the shown model state, branch outcome, detail, field of view and object/region anchor are consistent; it is not a claim of full continuous-playback or shared annotation-compositing acceptance.

| Case key | Root / option | Images | Additional original inspection | Verdict and observed result |
|---|---|---:|---|---|
| conditions-final-a-148-plasmolysis-plant | plant / bath=recover | 7 | None additional this pass; all stages on sheet | Qualified pass. Turgid → reduced protoplast/vacuole → restored large protoplast. Fixed wall is unchanged; bath-gap solutes remain in the extracellular interval at the separated stage. Membrane/lumen/region labels remain understandable; no clipping. |
| conditions-final-a-149-plasmolysis-plant | plant / bath=hold | 7 | end, p=1 | Qualified pass. Shrinkage persists through stages 5–6 and end; no unsupported recovery. In the native end image, both membrane contours, vacuole, nucleus, gap and external solutes are visible and uncropped. |
| conditions-final-a-150-stomata-plant | plant / signal=aba | 7 | stage-4, p=0.475 | Qualified pass for model state/anchors. Mixed gold/purple ions appear on both sides during the flow stages. The pore first opens, then narrows with ABA. Corrected wall/vacuole/pair anchors follow their structures. Ion label disappears when tracers disappear. Blue-light and ABA visibility match the selected sequence. Shared leader/box compositing remains an integration gate. |
| conditions-final-a-151-stomata-plant | plant / signal=light | 7 | end, p=1 | Qualified pass for model state/anchors. Pore remains wide after the opening sequence; blue light remains and ABA is absent. No stale ion-flux label remains at the terminal no-tracer state. Actual pore-facing wall and vacuolar-water leaders reach their objects; all cell detail fits in frame. |
| conditions-final-a-152-plantLongDistanceTransport-plant | plant / stomata=close | 7 | stage-4, p=0.485 | Qualified pass for model state/anchors. Continuous liquid column and narrow pit-to-film branch remain visible. Vapor starts at the wet mesophyll wall; late frames show a narrowed pore with a smaller visible cohort rather than an empty column. Root/liquid/film/outlet anchors now reach their intended tissues, surfaces or region. Shared leader/box compositing remains an integration gate. |
| conditions-final-a-153-plantLongDistanceTransport-plant | plant / stomata=open | 7 | end, p=1 | Qualified pass for model state/anchors. Open pore and larger vapor population persist through the terminal stage. Wet-wall origin and the retained liquid column are visible in the native end frame. Vessel, root and leaf details are retained without clipping. Shared leader/box compositing remains an integration gate. |
| conditions-final-a-154-chloroplastMovement-plant | plant / genotype=wild | 7 | stage-3, p=0.375 | Qualified pass. Plastids first accumulate on the lower periclinal face, then return along the cortex to anticlinal walls under strong light. The cortical-plastid label follows a real plastid at floor, transit and side-wall stages; floor/wall/light anchors remain appropriately located. Double-envelope/granum detail and the vacuole remain visible, with no clipping. |
| conditions-final-a-155-chloroplastMovement-plant | plant / genotype=phot2 | 7 | end, p=1 | Qualified pass. Accumulation remains under strong light through stage 6 and end, contrasting clearly with wild type. Native end frame shows the plastid anchor on a floor chloroplast, the periclinal annotation on the actual floor, and the anticlinal region annotation on the side wall. Geometry and labels remain inside the capture. |

## Exact additionally inspected originals

All paths below are under `docs/qa/process-review-2026-10-04/evidence/browser/`:

- `conditions-final-a-149-plasmolysis-plant-end.webp`
- `conditions-final-a-150-stomata-plant-stage-4.webp`
- `conditions-final-a-151-stomata-plant-end.webp`
- `conditions-final-a-152-plantLongDistanceTransport-plant-stage-4.webp`
- `conditions-final-a-153-plantLongDistanceTransport-plant-end.webp`
- `conditions-final-a-154-chloroplastMovement-plant-stage-3.webp`
- `conditions-final-a-155-chloroplastMovement-plant-end.webp`

## Conclusions and limits

No new confirmed plantWater-owned biological, geometry, visibility or annotation-target defect was found in these eight cases. The earlier annotation repairs are now visibly present in native frames. The seven issue resolutions remain unique; this read-only pass does not invent a new issue or alter a real anchor to accommodate screen layout.

The shared defect in which a later-painted leader can cross an earlier-painted label box is visible in some supplied frames, especially the stomata ion/pair labels and the xylem leaf labels. Root is handling that compositing issue centrally; it is not re-registered as a plantWater defect and no owned anchor was moved. Long leader routing is likewise not evidence that the object endpoint is wrong.

These are **native irregular-seek stage captures, not full playback of every case**. They establish sampled branch outcomes, visible detail, anchor placement and absence of clipping at the captured states. They do not independently establish smoothness between all frames, time-dependent path direction, speed, flicker-free cohort fading, mobile layout or Chinese rendered layout. Those limits remain separate from the earlier code/geometry regressions and root's continuous-playback checks. This gallery displays English annotations.

Only this report was written. No browser, product modification or test rerun was performed. All eight owned source SHA-256 hashes still match `evidence/plantWater/frozen-files.json`; source freeze remains intact.
