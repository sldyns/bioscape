# Regulation Phase A audit — 2026-10-04

Baseline: `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`. Product/test files remain unchanged.

| Model | Actual roots | Conditions | Verdict | New confirmed issues |
| --- | --- | --- | --- | --- |
| promoterRegulation | cell | intact / altered TATA | qualified_pass | 0 |
| enhancerRegulation | cell | competent / impaired coactivator | qualified_pass | 0 |

Both verdicts have medium confidence within a mechanistic, procedural schematic scope. Browser playback, render quality and GPU smoothness remain the integrator's separate gate.

## promoterRegulation

Traced two DNA strands, upstream TATA placement/TBP bend, assembly factors, local XPB opening, catalytic RNA attachment and promoter escape. The altered scenario does not create productive opening or RNA. The two-language text limits the case to a mammalian TATA promoter and one unstable-binding example. Phosphorylation and atomic folds are explicitly outside scope.

Actual RNA geometry retains its 3′ end at the catalytic world coordinate, the initial hybrid segment follows the opened template, and template motion has the stated direction. Existing exact segment-clearance regression passes. The late escape motion is faster than the assembly motion but remains continuous in the checks; no substantiated discontinuity was found.

## enhancerRegulation

Traced all seven histone octamers, left-handed wrapped duplex, all eight two-stranded linkers, local enhancer/promoter markers, Mediator recruitment, both local transcription episodes and both retained RNA products. Actual linker endpoints remain on the corresponding wrapped strand; exact cross-parameter segment tests pass. Productive RNA remains catalytically anchored until each release, and release preserves its full path.

Both conditions share global chromatin movement; impaired recruitment produces no burst in this illustrative window. Text does not claim that enhancer proximity universally predicts, or never matters for, transcription. Specimen/scope wording agrees with the source boundary.

Render-review focus: polymerase recycling around progress 0.79–0.82 rotates relatively quickly (peak sampled 0.607 rad over 0.005 progress, about 0.17 seconds). The ±1e-7 boundary probes tend to zero and show no jump. Do not report the speed alone as a scientific or continuity defect; inspect it during root playback review.

## Current evidence

- Independent `continuity-diagnostic.mjs`: 201 frames for each of four condition cases; all stage/mechanism boundaries; finite sampled buffers; stable scene/GPU inventory; irregular seeks and condition switches reconstruct the same state.
- `smoke.mjs`: PASS for both models, both controls, bilingual stages, bounds, deterministic buffers, resources and browser bundling.
- `science.test.mjs`: PASS, including exact RNA anchoring and release-path checks, condition-specific productive opening, actual template advancement, and the existing 201-frame duplex/linker checks. This legacy focused script also includes transcription regression checks; no shared code was modified.
- Full numeric output is in `../evidence/regulation/continuity-diagnostic.json`; concise run logs are alongside it. No whole-workspace suite, browser automation or benchmark was run by this reviewer.

## Primary scientific evidence opened

- [Patel et al., 2018](https://pubmed.ncbi.nlm.nih.gov/30442764/): TFIID promoter recognition and TBP loading; abstract and figure captions read.
- [Aibara et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33902107/): mammalian PIC, XPB translocation and downstream DNA opening; abstract read.
- [Barnes et al., PDB 5C44](https://www.rcsb.org/structure/5C44): complete transcription-bubble and RNA/DNA scaffold. The source is yeast; used for conserved topology, not as a literal mammalian atomic model.
- [Rengachari et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33902108/): Mediator recruitment and PIC-facing module organization; abstract read.
- [Alexander et al., 2019](https://elifesciences.org/articles/41769.pdf), corroborating [PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/31124784/): live-cell Sox2 burst/proximity result in embryonic stem cells. PDF initially opened; later full-text requests met a client challenge. Do not generalize beyond the paper's locus.
- [Davey et al., PDB 1KX5](https://www.rcsb.org/structure/1KX5): 147-bp nucleosome structural reference.

Nature/PMC direct full-text requests encountered access challenges, so successful primary PubMed/RCSB records and the opened eLife PDF were used. Detailed atomic fidelity, exact protein secondary-structure counts, measured kinetics, rendered occlusion and physical-device performance were not claimed.

No confirmed issues require Phase B repairs from this audit. Await root reconciliation and rendered feedback.
