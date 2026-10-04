# Full process review · 2026-10-04

User request: review every biological process again, use all available parallel agents, correct errors, and make continuous playback smooth. Scope is all 84 current process IDs, every registered organism/root context, every condition option and relevant combination. Do not expand the catalog or reduce model detail to make checks pass.

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. The working tree was clean. Earlier audit and acceptance records are historical evidence, not proof that the current version has no defects.

## Ownership

The root integrator owns the four original processes (secretion, transcription, photosynthesis, infection), shared player/renderer behavior, integration and browser review. Twenty-two reviewers each own one `src/processes/modules/<group>/` folder. Reviewers must not spawn further agents, edit shared code, run full-workspace tests, or operate the browser. Shared defects go to the integrator with exact evidence.

## Phase A: independent audit

Read `.github/CONTRIBUTING.md`, `docs/science-audit/REVIEW_STANDARD.md`, `docs/science-audit/CORRECTION_STANDARD.md`, and the applicable process contracts. The phase/ownership rules in this current plan take precedence over old task-specific paths or pair-delivery limits. Phase A is read-only for product and test files. Write only `docs/qa/process-review-2026-10-04/audits/<group>.json` and `.md`, plus bounded diagnostic artifacts within that group's evidence folder. Do not overwrite earlier audits.

For every assigned process:

1. Trace mechanism, organism/specimen, compartments, molecular identity, direction, attachment/continuity, relevant stoichiometry and causal order through actual geometry and update code.
2. Review Chinese and English introductions, stages, controls, labels, legends, sources and root-specific overrides. Get actual registered roots from `processesByRoot`, including specialized neuron, muscle and erythrocyte routes beyond entries.js roots.
3. Inspect all condition combinations and the full progress interval, especially stage boundaries, visibility changes, recycling loops, modulus/floor switches and terminal states. Separate intentional schematic omission from false topology or causality. Existing tests and metadata alone are not evidence of geometric correctness.
4. Browse and open primary scientific sources for the mechanism claims being assessed. Preserve exact source support and uncertainty. Avoid unsupported absolute guarantees, fabricated defects and speculative scientific detail.
5. Perform focused numeric diagnostics as useful: actual world geometry/attachments, finite buffers, repeated irregular seeks, stable node/material/geometry inventories, visible-motion continuity. Be selective with costly dense samples while other agents work; no all-suite tests or broad benchmarks. A state jump, visibility switch or repeated flow is not automatically a defect; establish a concrete misleading or visible failure.
6. Each process gets `confirmed_issue`, `qualified_pass`, or `unresolved`, with confidence and explicit limits. Report findings before editing. Root releases Phase B after reconciling all 84 audit entries.

Audit JSON: `{group, baseline, models:[{id, roots:[], verdict, scope, checks:[], sources:[{url,title,supports}], findings:[{issueId,severity,kind,file,location,evidence,whyWrong,fix,verification,sourceUrls:[]}], continuity:{checked,findings:[],limits:[]}, limitations:[], confidence}]}`. Use stable issue IDs `20261004-<group>-01`. Severity P1 for scientific falsehood, misleading topology/causality or broken playback; P2 for important ambiguity or a visible discontinuity. Include all processes, including passes.

Send a concise Phase A completion summary to root with model count, issues and exact report paths. Do not start repairs until root releases Phase B.

## Phase B: evidence-backed repair

After release, edit only the assigned module folder and that group's new resolution/evidence reports. Fix confirmed issues and verify actual geometric/biological invariants; meaningful regressions should reject the original defect. Preserve detail, provenance, organism differences, deterministic arbitrary seeking and all material disposal inventories. No geometry/material/node allocation inside update. Do not weaken old regressions or hide a problem with a disclaimer. Escalate any shared-code change to root. Format owned files only.

Write `resolutions/<group>.json` and `.md`, accounting for every issue exactly once, with changed files, tests, sources and remaining limits. Root performs rendered and continuous playback review and may return further defects. A passing unit test is not rendered or scientific acceptance.

## Evidence and completion

Keep complete logs, response bodies, arrays and geometry measurements in local artifacts, with compact summaries and paths in conversation. Do not emit image data or binary buffers. Retain original source/reference resolution and prior scientific evidence. Never delete historical evidence or unowned work.

Root will track audit coverage, correction status, continuous playback, condition/root coverage and final integration separately. No publication is part of this review request. Physical-device and fixed-performance claims require their own measurements.

## Phase B released

All 84 unique process audits and all 114 registered root contexts were reconciled without missing/duplicate IDs or root mismatches. Phase A found 60 process definitions with confirmed issues and 24 qualified passes; no unresolved model remains at this audit boundary. Including shared-player and final original-protein placement findings, 88 unique issues are now tracked (45 P1, 43 P2). Further rendered findings may be added separately rather than rewriting this audit baseline.

Each reviewer may now repair their assigned module and write resolution/evidence reports, following the invariants above. Root owns shared code, including player cadence and membrane issue05 in conditionNotes.js. Explicit supplementary ownership: regulation reviewer owns secretionProcess.js and a new original-secretion regression; division reviewer owns phageProcess.js and a new original-infection regression; traffic reviewer owns photosynthesisProcess.js and a new original-photosynthesis regression, in addition to its traffic module. These reviewers write separate original-process resolution files, keyed to the original issue IDs. plantSignals retains structures.js shared-helix ownership. Root integrates all new regressions into scripts/verify.mjs and performs browser acceptance. Do not edit that shared test runner.

Do not add motion to intentionally inactive controls just to satisfy a generic test. turnover may replace its outdated inactive-proteasome distinct-stage smoke assertion with stronger invariant checks for unchanged untagged substrate, absent products and retained active-case motion, leaving all science regressions intact.
