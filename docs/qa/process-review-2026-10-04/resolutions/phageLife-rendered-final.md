# phageLife rendered review — full-b3 and follow-up repairs

Reviewed all 29 stages in the four `full-b3` gallery sheets, then 15 key original 960×640 WebP images. The images substantiate the overview identities and sampled states described below. They also exposed two defects, now fixed in code with rejecting baseline regressions; their replacement renders are pending. The original Phase A audit is unchanged.

## Evidence and playback boundary

Source: `../evidence/browser/gallery-index.json`, entries `full-b3-017-phageLytic-phage` through `full-b3-020-phagePackaging-phage`. All four JSON receipts report `result=complete`, terminal progress 1, monotonically increasing live progress and no recorded errors. There are 5,766 update records in total. These receipts establish completed playback execution; this review visually inspected captured stages, not every intervening frame or a recorded movie.

| Model / recorded condition | All reviewed sheet progress values | Playback receipt |
|---|---|---|
| phageLytic / default | 0, .185, .355, .535, .685, .865, 1 | 1,451 updates; 24.061 s wall time; 1.5× playback |
| phageLysogenic / fate=induce | 0, .195, .365, .505, .685, .795, .935, 1 | 1,533 updates; 25.389 s; 1.5× |
| phageAssembly / protease=active | 0, .165, .345, .515, .705, .845, 1 | 1,411 updates; 23.391 s; 1.5× |
| phagePackaging / atp=present | 0, .175, .315, .525, .795, .935, 1 | 1,371 updates; 22.721 s; 1.5× |

Default full-b3 evidence does not cover the alternative noninduced, inactive-gp21 or ATP-absent visual states. The later 235-combination captures are a separate pending review. No browser or shared renderer was operated by this reviewer.

## What the frames show

### T4 lytic overview

The initial extracellular particle retains T4 head/tail/baseplate/fiber identity. At .185, extracellular coat and a gold DNA path entering the host are visible; host chromosome and ribosomes remain distinguishable. At .355/.535 the amplification/translation overview is identifiable, and .685 shows separate heads and tails near the DNA. At .865 progeny remain within the opening host; at 1, released particles surround separated envelope pieces. These are overview states, not proof of every intermediate contact.

The coat, ribosome, concatemer and release leaders terminate at the intended rendered objects in the inspected views. At .535 the head targeted by “前头、独立装配的尾” is still a tiny dot: its coordinate is physically correct but the target is difficult to read at 960 pixels. This is a remaining early-assembly visibility limitation, not permission to move the anchor away from the structure. The end-frame release label can overlap a particle; shared label-box layout work remains owned by the root.

Originals inspected: `full-b3-017-phageLytic-phage-{stage-2,stage-4,stage-5,end}.webp`.

### Lambda lysogeny / induction

The visitor uses a thin curved noncontractile tail, distinct from T4. The .195 frame shows a purple viral loop at the gold attachment-site marker; .365 shows the purple segment joined to the gray chromosome with CI adjacent. At .505 a dividing host and replicated chromosome are visible. Both separated daughters retain a gray chromosome, purple prophage and CI at .685. At .795, the induced left daughter has lost CI while the right retains it; the left viral loop is being excised. At .935 the left daughter contains progeny, and at 1 it has opened while the right daughter remains intact with its prophage/CI.

The tail, attachment, CI, integrated segment, excision and daughter-region leaders identify their intended objects or explicit regions in these images. A released progeny projects across the intact right daughter's interior at progress 1. The 2D frame cannot establish whether it is in front of, behind or inside that cell; it must not be described as infection of the second daughter. The model's release trajectories remain schematic.

The first nonzero capture is .195, after the actual entry interval; the rendered continuity of entry, circularization and the .295 integration junction is therefore **not visually covered**. Likewise .795/.935 bracket the excision ownership change. The detailed mesh-junction and no-duplicate-genome tests remain separate geometry evidence.

Originals inspected: `full-b3-018-phageLysogenic-phage-{stage-2,stage-3,stage-5,stage-6,end}.webp`.

### T4 assembly

The early frame shows the internal scaffold/gp21 with a separate baseplate. Shell growth is visible at .165. The .345 clearance frame originally contained large beige overlapping spheres that obscured the entire prohead: **new issue 05**, detailed below. At .515 the head is empty and independent long-fiber components are visible; .705 shows DNA in the head. At .845 the neck is sealed, the separate extended tail is identifiable and the fibers still wait beside it. At 1 the head, extended sheath/baseplate and long fibers form one complete particle. Its fiber roots appear seated on the baseplate, with no independent duplicate set left nearby.

The sampled sequence supports independent components and the final joined structure. It has no frame between .845 and 1, so the critical .94–.99 docking motion is **not visually resolved**; continuous full-length installation is supported by the dedicated world-coordinate tests rather than these static pictures. Head/gp21, membrane, baseplate, DNA, seal and sheath leader targets are consistent with the visible structures. The clearance leader is obscured by issue 05 in the original frame.

Originals inspected: `full-b3-019-phageAssembly-phage-{stage-3,stage-6,end}.webp`.

### T4 DNA packaging

Initial and .175 frames distinguish the purple gp20 portal from the pale-green gp17 motor around the exterior duplex. .315/.525 show increasing internal DNA and a separately labeled inward-arrow marker. At .795 the head is full and the cutting/departure stage is labeled. By .935 the motor is absent and by 1 the neck seal is visible. Portal, motor, exterior duplex, direction arrow and seal leaders follow the corresponding structures; the internal-lumen label is a region annotation.

The original final image leaves the exterior duplex apparently emerging from the finished seal: **new issue 06**, quantified below. That image cannot support a claim of visibly separated downstream DNA. The phase values .795 and .935 also do not isolate the completed cleavage transition at .85. The revised duplex appears as paired rails/rungs, but a static view alone does not establish helical handedness; signed world-space twist remains the relevant independent geometry check.

Originals inspected: `full-b3-020-phagePackaging-phage-{stage-4,stage-5,end}.webp`.

## New findings and authorized repairs

**20261004-phageLife-05 — P2, scaffold fragment dimensions.** Each peptide began with scale [.055,.09,.05], then the update overwrote it with an almost unit scalar, making it exceed the prohead scale during removal. The repair retains the initial per-axis scale and applies a bounded continuous appearance/removal multiplier. Tests bound each axis throughout clearance, preserve anisotropy, require zero-size limits at .33/.48 ±1e-6 and verify no fragments under inactive gp21. The retained old model fails these checks; the repaired model passes.

**20261004-phageLife-06 — P2, downstream cut-product separation.** Actual world-space mesh vertices show that the original exterior product overlaps the portal/neck's axial envelope after cleavage; this is **not a claim of solid intersection**. Its terminal backbone centers retain positive distances to the nearest actual portal/neck surface, consistent with a strand inside or near the lumen. The repair smoothly lowers the detached downstream product so the visible endpoint clears the whole portal/neck envelope as the neck grows. The internal genome and ATP-absent stall remain unchanged.

| Sample | Original surface-envelope gap | Repaired gap | Original terminal-center to surface | Repaired terminal-center to surface |
|---|---:|---:|---:|---:|
| Packaging .85, cleavage complete | −.169393 | .280607 | .103061 | .348701 |
| Packaging 1, seal complete | −.154665 | .295335 | .102157 | .355798 |

Units are schematic scene units. The first two distances are axial separation between actual mesh-surface extrema; a negative value means overlapping y ranges. The latter distances are from each of the two actual terminal cylinder center points to the closest triangle on the visible portal/neck surfaces. No atomistic contact claim is made. Six post-cleavage samples (.85, .88, .92, .935, .96, 1) now retain >.2 axial clearance and >.2 endpoint-to-surface distance. Translation is continuous around .79/.82/.85/.92; no ATP produces no downward cut-product movement, loading or seal.

Evidence: `../evidence/phageLife/rendered-baseline-rejections.json`, `rendered-baseline-packaging-measurements.json`, `rendered-repair-measurements.json`, and the retained `before-rendered-repair.mjs`. Both old models fail their relevant new assertions. The entire local science suite, including the prior continuity checks and 481 label-anchor checks, passes in `rendered-final-science.log`. Four process bundles, owned-file Prettier and `git diff --check` pass.

## Remaining rendered gate

The product files are frozen after issues 05/06. Requested replacement captures are limited to three: **phageAssembly/active .345; phagePackaging/ATP present .85; phagePackaging/ATP present 1**. These new frames, alternative-condition final captures and the root's final shared label-box layout must be inspected before reporting final visual acceptance. The current `full-b3` sheets predate the two new repairs and are retained as failure evidence.
