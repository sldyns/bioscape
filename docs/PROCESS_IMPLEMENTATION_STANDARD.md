> Visual refinement now follows PROCESS_REFINEMENT_STANDARD.md. The original SVG deliverables below remain source diagrams; the live directory uses reviewed WebGL renders.

# Biological process implementation contract

All new agents MUST follow this contract. Existing four processes must not be rewritten.

## Ownership and delivery

Own only your assigned folder `src/processes/modules/<group>/` and your uniquely named thumbnails `public/process-thumbnails/<id>.svg`. Never edit global catalog, player, renderer, tests, shared kit, or other agents' files. New imports MUST use explicit `.js` extensions for Node validation. Do not spawn subagents (root is allocating all slots).

Deliver two genuinely distinct mechanism-specific models first. Root will review and assign another bounded pair if needed. Do not replace mechanistic modeling with moving spheres on a generic pathway, a timeline-only infographic, or the same scene with different labels.

Each model: `<id>Process.js` default exports `{id,title:{zh,en},intro:{zh,en},duration,stages:[{at,title:{zh,en},description:{zh,en}}],sources:[{title:string,url:https}],create,legend?,controls?,contexts?}`. First stage at 0; 4–7 meaningful stages, final at <1; duration 24–40 seconds. Both languages complete, restrained educational language. Sources must be real authoritative pages or primary research browsed/checked by you; one clear species/mechanistic scope per scene.

`create({rootId}={})` returns `{group:THREE.Group, update(progress, parameters={}),camera:{position:[x,y,z],target:[x,y,z]},labels,materials?}`. If an update swaps prebuilt materials, return every such material in `materials` so unmount disposes resources no longer referenced by the current scene. `labels` items `{position:[x,y,z],text:{zh,en},active?,priority?}`; position arrays, text objects and active may mutate and are read each render. High priority for indispensable labels. Optional helpers in `../../kit.js` (read signatures first), or use Three directly.

`update` MUST be an absolute, deterministic function of clamped progress and parameters; repeatedly seeking 0 → .7 → .2 → .7 gives identical geometry/transforms/materials. Clamp NaN to 0. NO new geometries, materials or scene nodes in update. Avoid Math.random; use fixed coordinates or seeded construction. No object duplication under repeated update. Update instanced buffer flags and bounds when moving instances. Dynamic meshes must recompute normals if needed. Group bounds largest dimension >2 and <20 at all progress samples, finite data. Keep details smooth and intentional, material palette muted; transparent layers must reveal actual spaces. Camera typically [0,2,10] with target near origin. Ensure all important stages occupy enough screen space.

Optional controls: `[{id,label:{zh,en},default:"value",options:[{value:"value",label:{zh,en}}]}]`, at most 2 per process. Native select controls. Picking a scenario restarts paused at 0. Every model must use defaults when parameters missing. Branches must affect real geometry/flow, not just text. Optional stage-level `observations` not supported; describe controls in intro/stages. Do not display fabricated expression fold changes, exact kinetics, or fictitious experimental results. Include at least one condition control where scientifically helpful (lac, enhancer, TAD, stomata etc).

Optional `contexts: {plant:{intro,stages,legend},...}` merges text/metadata for a root. Do not override id/create. `create({rootId})` handles geometry. Register in multiple organisms only when mechanisms and wording remain correct there; generic mammalian geometry is not a plant/bacterial model.

In `entries.js`, export `entries` array of LIGHTWEIGHT objects `{id,module:"./modules/<group>/<id>Process.js",roots:["cell"|"plant"|"bacterium"|"yeast"|"paramecium"|"phage"],title:{zh,en},summary:{zh,en},color:"#...",category:"genetics"|"energy"|"transport"|"division"|"signaling"|"lifeCycle",thumbnail:"/process-thumbnails/<id>.svg"}`. No Three import in entries. Write entries last, when files and thumbnails exist, so live directory never advertises missing content. Existing empty entries.js is yours to replace. Each model id must be globally unique and match filename/default export.

## Thumbnails

Each process needs its own polished square vector schematic (SVG viewBox `0 0 320 320`). Specific to actual mechanism, no text (titles are outside). Muted palette, off-white background, subtle shading, clean biological silhouettes, composition readable at 150px. No external assets/fonts/scripts. Do not use raster screenshots or image generation tools unless root asks. No giant generic numbers, play buttons or atom icons repeated for unrelated mechanisms.

## Scientific boundary

Mechanism correctness is more important than breadth. Specify organism, compartment, membrane topology, directions and relevant exceptions. DNA strands remain antiparallel; RNA synthesis 5′→3′; eukaryotic transcription and translation are spatially separated; generic plant cells do not have animal centrioles. Do not imply enhancer contact always activates a gene, TAD is a membrane bubble, all bacteria have pili/spores, T4 can lysogenize, or all listed processes happen in the same cell type. Specialized neuron/guard cell/muscle/immune scenes must identify that specimen.

Every delivered pair requires your own Node/esbuild smoke test: stages bilingual, finite bounds, distinct stages, deterministic repeated seeks, no allocations of geometry/material/node in update, thumbnails exist. Record meaningful `group.userData` scientific state signals for root regression (e.g. direction, membrane side, completion, selected condition). Do not run full workspace tests while peers are writing. Root performs cross-module validation and browser QA. Do not control root's browser tab.
