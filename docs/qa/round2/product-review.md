# Round 2 independent product review

Date: 2026-10-03. Read-only product/source review; no production edits. Fresh private IAB tab on `http://localhost:5174`, default 1265×712 visible viewport, no viewport override. The integrating agent changed source during this review; baseline and post-fix observations are distinguished below. Automatic view synchronization was deliberately excluded from findings because its removal is already assigned.

## Findings

### P2 — clicking the active theme discarded work (fixed and browser retested)

Baseline reproduction: open Animal & plant → set A Cutaway → click the still-selected Animal & plant theme. A reverted to Whole. Existing choosePreset also reset labels, explode values and cameras and remounted both scenes. The selected button looked like the active choice, with no reset wording, while reselecting the same model in the picker was correctly a no-op. This unexpectedly destroyed a prepared comparison.

Integrator added same-pair early return in `src/compare/CompareWorkspace.jsx:232`. Post-fix browser check: Transport & signaling → A Cutaway + Labels off → same active theme. Cutaway remained `aria-pressed=true`; Labels remained `aria-pressed=false`. No loading transition occurred. Evidence: `product-active-preset-preserved.jpg`.

### P3 — About modal omits three complete model types (fixed; source verified)

Reproduction: open Transport & signaling (erythrocyte and neuron are visibly loaded) → header About this model. About the models still states “Six teaching models represent…” and lists only the six older model families, omitting erythrocyte, neuron and muscle fibre. The picker offers nine complete models. Chinese copy likewise says 六类. This makes the project scope description visibly stale directly beside the new specialized comparisons.

Source: `src/components/AboutModel.jsx:83-84`. Screenshot: `product-about-scope.jpg`. Integrator subsequently updated both language paragraphs to include erythrocyte, neuron and muscle fibre, plus subtype/scope limits. Closure verified against current source; the saved screenshot intentionally records the earlier discrepancy. The general modal's singular English trigger is also imprecise but is not treated as a separate blocking finding.

## Observed passing behavior

- Opening picker focuses its search box. Escape closes it and returns focus to the originating A model trigger.
- Search plus Enter chooses the active matching result and returns focus to the updated model trigger.
- Entering Nucleus through the animal-cell label updates A to Nucleus, preserves Animal cell context in the picker trigger, exposes View parent structure and replaces whole-cell difference table with the structural-detail scope notice.
- Model-picker family filter correctly explains an empty cross-family query and All models recovers results. No false failure filed for that explicit filtering behavior.
- Selecting Plant for A while B is Plant is supported. Heading becomes Same structure, different views.
- Plant/Plant with A Cutaway and B Whole swaps to A Whole and B Cutaway. Model identities/modes travel correctly. Evidence: `product-same-model-swap.jpg` (baseline includes now-removed independent-view button).
- Erythrocyte/neuron load into independently fitted canvases without visible silhouette clipping at this desktop size. Whole/Cutaway/Exploded and labels become available after load. A Cutaway + labels off does not alter B Whole + labels on.
- Studio remains disabled while the pair is still preparing, and becomes enabled once both scenes are available.

## Coverage boundaries

This is targeted browser/product inspection, not full acceptance. Mobile widths belong to the integrating agent. No network/reference validation, forced WebGL context-loss recovery, screenshot pixel equivalence, performance benchmark, or all-model/all-mode combinatorial test was performed. Camera gesture/reset independence and legacy shared-link migration are covered separately by the integrator. Browser input occasionally returned a timeout while the intended theme click had actually completed; fresh DOM snapshots were used to establish state, and no product bug is inferred from those tool timeouts.


## Follow-up source review: URL persistence and comparison removal

Reviewed current `App.jsx`, `exploration/historySession.js`, `exploration/state.js`, `compare/state.js`, `compare/CompareWorkspace.jsx`, ProcessExperience callbacks and Studio consumers. No new concrete regression identified in this source pass.

- Debounced flush reads `navigation.current` when it executes, rather than retaining the navigation snapshot that originally scheduled it. Outgoing navigation explicitly saves/replaces its entry before pushing the new one. A surviving timer therefore resolves the current route after the render rather than blindly writing an old captured route.
- Browser pop handling stores the outgoing session snapshot, recalls the destination by entry id, canonicalizes the sanitized portable state, activates that entry and restores it. Duplicate popstate/hashchange dispatches are guarded by the current entry metadata.
- URL replacement preserves the current history entry id through updateHash; repeated visits to the same model retain independent entries.
- Process state/camera and structure camera changes schedule persistence. Language/mode/explode/labels/contracted changes also schedule it. The pagehide listener clears the pending timer and snapshots synchronously.
- Legacy comparison sync values are dropped both at the URL boundary and by comparison normalization. The independent left/right view fields survive. Composite camera setter/getter are absent; comparison capture/readiness/release remain. Parent snapshot paths do not call the missing getView while comparison is active. Reset only increments the targeted side; same-pair theme selection returns before resets.
- Resume-process history is keyed by current root, and restored or newly selected processes update that root's record.
- Existing meaningful checks run and passed: `node tests/history-session.mjs`, `node tests/comparison.mjs`, `node tests/exploration-state.mjs`. A preliminary direct Node import of compare/state could not resolve the project's extensionless imports; the established comparison test bundles with esbuild and passed. This was a runner mismatch, not an application failure.

This follow-up is source review plus focused pure-state tests. It does not establish browser lifecycle acceptance for native reload occurring inside the 200 ms debounce, cross-document navigation/pagehide ordering, or a frame pending in CompareWorkspace's separate requestAnimationFrame publisher. Those are timing boundaries to retain in any final acceptance claim; no reproducible loss was established here. No new browser pass was added, per assignment.
