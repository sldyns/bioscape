# Homepage copy and hierarchy refinement · 2026-10-03

User direction: keep the approved composition and light palette, reduce the amount and fragmentation of visible guidance, and let the models lead. This follow-up changes homepage presentation and its primary resume link; it does not change the models or scientific catalog.

Later update: the [guidance follow-up](guidance.md) restores selected metric descriptions, separate Start and Continue actions, and the scroll prompt at the user's request. The notes below record the earlier minimal version.

## Changes

- Keep the two-line hero headline, one short description and two actions. Returning visitors use the primary action to continue their saved scene; its native link and click action both follow the selected language. Remove the duplicate header action, separate resume sentence and scroll prompt.
- Combine hero model selection, pause and open-model actions into one toolbar. Preserve accessible button names, selected/pressed states, reduced-motion behavior and independent manual rotation. Remove repeated selected-model labels and instructions.
- Reduce each metric to its number and short label. Remove section numbers, introductory side paragraphs, card numbering and category corner labels.
- Model and process cards show their genuine render and precise title. Descriptions remain in the catalog and remain searchable; full explanations are available after entering the scene. Search/category controls and the three motion previews are retained. A result count appears when filtering or searching, without the default promotional sentence.
- Retain exploration/comparison/creation cards, each with a short title and one compact description. Remove repeated calls to action and the final promotional block. Retain a concise teaching-model note and author credit.
- Remove CSS belonging to deleted elements and adjust spacing, type and toolbar sizing for desktop and narrow viewports.

## Verification

- Same-language visible text measurement using rendered `document.body.innerText`, whitespace removed: 1,106 characters before and 324 after, approximately 71% less. Hero text changed from 175 to 57 characters. This measures visible text in the default Chinese homepage, including navigation and footer, rather than catalog size.
- Actual 1280×720 desktop, 390×844 Chinese and 320×740 English layouts: no document-wide horizontal overflow; the compact hero toolbar fits completely. Models and processes retain their original images and title labels.
- Hero plant selection updates the selected state and the accessible open action; opening enters the plant scene. Return home → switch to English → primary Continue restores the plant scene, its camera and English language. Native resume href also carries the selected language.
- At 320px, searching `C4` returns the real C₄/CAM process. A nonsense query shows zero results; recovery restores all 84 cards and returns focus to search. Featured restores the six cards and removes the unnecessary default count line.
- The simplified transcription card still activates one silent video on hover and plays to its end without a media error. Final production checks confirm all nine model cards, six featured process cards, three exploration actions and all 15 images loaded. The production console contained no warnings or errors during the pass.
- Final build, homepage catalog/navigation/search checks, release integrity checks, formatting and `git diff --check` pass. Full scientific playback and physical-device tests were not repeated for this presentation-only follow-up. The earlier scientific acceptance records remain applicable within their recorded scope.

## Evidence

- [Desktop homepage](refined-desktop-final.jpg) · [Full page](refined-fullpage-final.jpg)
- [Model cards](refined-models-desktop.jpg) · [Process cards](refined-processes-desktop.jpg)
- [390px Chinese](refined-390-zh.jpg) · [320px English](refined-320-en.jpg)

The local production preview was rebuilt at `http://127.0.0.1:4201/#/`. No commit, push or deployment was performed. Temporary viewport overrides were reset.
