# Comparison refinement review — 2026-10-03

## Scope and before evidence

Owned: CompareWorkspace, ModelPicker, comparison styles/catalogue/state, comparison tests, and comparison export typography (the latter explicitly delegated during review). Shared renderer and specimen geometry are owned by other lanes. The integration lane owns the global header and live share URL.

Before review: local development server 5174, CUA tab 1, 1280 × 720. Rendered screenshot in the review conversation showed 179-option native menus, repeated model descriptions in captions and a six-row table, and two global navigation rows above the comparison header. Model canvases started around y=413 and controls were below the first viewport. This was directly observed before edits. `comparison-before.jpg` retains the initial implementation lane's English transport/signaling screenshot, inspected here as a before record; it predates this refinement.

## Changes

- Searchable native modal picker, bilingual name and full ancestor-path matching, category browsing, nine whole-model starting choices, clear selected state.
- Opening the picker activates the current model; child models open their category and scroll into view. Search field supports arrow keys and Enter; Escape, backdrop and explicit close dismiss; native dialog contains keyboard focus and restores the trigger.
- Selected pane header displays the model path; parent action remains available for substructures.
- Compact heading/theme strip and explicit linked/independent status. Tooltip defines the sync boundary: orientation and relative zoom, not independent display modes or labels.
- New choices/presets start whole; explicit incoming modes, labels, separation, camera and sync are retained.
- Four paired biological dimensions keep their existing sourced text. Duplicated model descriptions removed from the table. Local-structure comparisons do not inherit whole-cell facts; scope and references remain available.

## Focused checks

`node tests/comparison.mjs` passed after final source edits. Covers state serialization/malformed input, explicit mode/camera preservation, search root count, ancestry/bilingual matching, no-result search, category confinement, independent destination targets, orbit feedback tolerance and export frame layout.

CUA development checks: picker opened with native focus in search; searching 髓鞘 found 髓鞘节段 with 有髓多极神经元 path; Enter selected it, used whole mode, and hid whole-cell comparison facts. Parent action returned to neuron. Development HMR repeatedly reset models to the old URL and invalidated several attempts at preset screenshots. Those loading captures are not acceptance evidence.

## Stable rendered matrix

Stable production preview 4199, 1280 × 720, CUA tab 2. Record each actual render review below; test success alone is not acceptance. Latest model touchups after this build require the integration lane's final check.

| Preset | Models | Whole / cutaway / exploded | Visual and explanatory review |
|---|---|---|---|
| Animal & plant | cell / plant | All three enabled and inspected | Whole boundaries, internal cutaway and separated organelles remain framed; four corresponding traits readable. |
| Eukaryote & prokaryote | cell / bacterium | All three enabled and inspected | Nuclear vs nucleoid organization clearly shown in cutaway; full flagellum remains framed in whole and separated views. |
| Transport & signaling | erythrocyte / neuron | All three enabled and inspected | Biconcave cell and elongated neuron framed independently; labels, specimen sizes and scope distinguish representation from physical scale. Exploded membrane/cytosol are separately labelled. |
| Signaling & contraction | neuron / muscleFibre | All three enabled and inspected | Soma/axon vs longitudinal myofibrils remain legible. Cutaway reveals peripheral myonuclei and parallel organization; exploded models stay framed. |
| Plant & fungus | plant / yeast | All three enabled and inspected | Budding yeast identity, cell walls, chloroplast distinction and vacuoles are retained; detached bud and organelles stay framed. |
| Bacterium & phage | bacterium / phage | All three enabled and inspected | Capsid/DNA, contractile tail and attachment fibres are separately visible; notes explicitly distinguish virus from cell. |

Completed here: stable six-preset render matrix, both interface languages at desktop, repeated swap, linked/independent camera behavior, keyboard picker and actual swapped export. Remaining for the final integrated build: language/share reload, medium/mobile layout and independent final review. Narrow checks are browser emulation, not physical hardware.


## Swap lifecycle and keyboard regression (latest source, 5174)

Actual DOM backend node identity was inspected read-only through CUA/CDP. Different-model canvases `[381, 447]` changed to `[447, 381]` and back across four swaps, without losing readiness or replacing either canvas. Public URL model/mode/separation/labels/camera/sync state returned exactly to the original. Same-ID pairs also retained two distinct canvases (`[1222, 1481]` → `[1481, 1222]`) while whole/cutaway and labels travelled with the specimen. Follow-up internal-label navigation affected the correct B column; returning to its parent worked. After swapping, linked drag produced identical left/right direction, target and zoom in the public URL; reset kept both scenes ready.

A real opening-focus issue was found and fixed: `mouseenter` fired when the dialog appeared under the stationary pointer, overriding the current keyboard row. Pointer tracking now requires movement. Reopening a phage selects its own row; reopening a child selects its own category and child row. ArrowDown/ArrowUp, no-result text, Enter selection, Escape and focus restoration were exercised in CUA.

## Export typography

Expanded ownership authorized by integration lane: comparison capture identity text now uses long-edge sizing (minimum 24 px title / 18 px scale explanation for normal exports) and an explicit reserved header. Studio lane reports direct inspection of actual 1440×2560 portrait, 1920×1080 landscape and 1920×1920 square PNGs: readable names/scale text, no title/footer collision. After the stable-instance swap fix, an actual 1920×1080 PNG was downloaded and inspected: A shows neuron, B shows erythrocyte, matching the swapped screen and identities. The real image is retained as `comparison-swap-export.png`; no cross-pane label or title collisions.
