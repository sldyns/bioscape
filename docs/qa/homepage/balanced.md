# Balanced homepage information density

2026-10-03 follow-up to the user's request for a middle ground between the original dense homepage and the sparse revision.

## Changes

- Restored one concise, model-specific sentence below each of the nine exact scientific model names.
- Restored one short explanation for each of the six featured processes, identifying the mechanism or sequence shown.
- Added no section preambles, corner labels, numbered kickers, repeated prompts, closing promotions, or additional buttons. The hero sentence, compact toolbar, functional Resume primary link, palette and section layout are unchanged.
- Desktop descriptions use 12px text, #737984 and 1.65–1.7 line height. Below 520px, two-column model descriptions use 11px / 1.6; they wrap naturally instead of clipping or shrinking. A single editorial sentence is not forced onto one physical line on narrow screens. Process descriptions remain 12px in single-column cards.
- English text is also concise; titles retain their exact catalog names.

## Integration verification

- The final Chinese homepage removes terminal full stops from headings, short model/process descriptions, feature captions and the footer note. Internal punctuation in longer scientific content is unchanged.
- Fresh production-build review at 926 × 865: all nine model descriptions and six featured process descriptions present; no Chinese terminal full stops in homepage headings/paragraphs.
- Fresh 390 × 844 review: two-column descriptions wrap without clipping or horizontal page overflow. English typography checked separately in the same narrow viewport.
- Evidence: `balanced-processes-926.png`, `balanced-models-390.png`, `balanced-models-390-en.png`.
- Full project check passed during integration. Final Studio refinements were followed by 26 focused tests, targeted format checks, a fresh build and release asset checks.
