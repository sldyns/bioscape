# Design and validation record

## Concept

`design-concept.png` generated using the built-in Image Gen tool. Brief: a full desktop CELL ATLAS animal-cell explorer, dark green (#07120f), ivory type and lime (#d0ed9c) controls, a left structure catalog, central transparent cutaway cell, right educational inspector, bottom protein journey. The 3D cell must be implemented with interactive geometry, not a screenshot. Chinese interface; the user's subsequent requirement adds complete English switching.

## Visual comparison

Inspected the concept and the rendered desktop screenshot with `view_image`, after browser capture in Codex IAB. Checked 1536 × 1024 desktop and 390 × 844 phone viewports, plus the normal app-panel viewport. No Playwright browser fallback was needed; browser-native Playwright locators were used through IAB.

| Item | Evidence and decision |
| --- | --- |
| Composition | Retained header, left catalog, central model, right inspector and bottom learning route. Phone uses a scrollable catalog and stacked content. |
| Palette | Retained dark green canvas, sage secondary text, lime selection and action controls. Corrected overbright 3D lighting and desaturated membrane. |
| Typography | Serif display headings and intentionally sized sans-serif controls; English uses shorter labels and responsive sizing. |
| Controls | Retained whole/cutaway/explode, label and rotation controls. Added required zoom, reset, visibility and isolation interactions. |
| Content | Replaced concept placeholder prose with reviewed educational text. Added cytoskeleton, scientific sources, schematic-scale notes and full bilingual data. |
| Model | Deliberately uses real-time procedural 3D with schematic smooth geometry rather than the photorealistic concept image. Colors and organelle identities match the visual direction, but it is not a photorealistic replica of the concept. |
| Assets | Bottom route uses small code-native icons rather than noninteractive organelle thumbnails; inspector uses a color marker instead of a raster crop. |
| Mobile | Fixed grid minimum-width overflow; moved the model below the heading; checked both languages. |

Above-the-fold copy review: main headline and navigation are retained in Chinese. Intentional additions are the requested language switch, the twelfth structure, exploration progress, scale note, and functional view controls. Scientific content was rewritten for correctness rather than preserving generated placeholder claims.

The layout, color, hierarchy and interaction patterns were verified against the concept. The real-time schematic geometry and small icon substitutes are intentional deviations, not a claim of pixel-identical photographic fidelity.

## Functional verification in IAB

- Production build passes.
- Chinese ↔ English changes navigation, educational content and projected 3D labels; language persists after reload.
- Exploded view works; keyboard End sets the native range and React state to 100. Camera pulls back for separation.
- All five learning-path steps advance and open the knowledge challenge.
- All five correct answers show explanations and yield 5 / 5; reset starts a new challenge.
- Catalog selection changes inspector; isolation hides other groups and repositions the camera.
- Direct canvas clicking selected the Golgi apparatus and updated its inspector; dragging visibly rotated the model in 3D.
- About dialog opens/closes on mobile; science links and model limitations are included.
- Mobile document width does not exceed viewport (390px viewport; 375px layout width with scrollbar).
- Browser console had no warnings or errors at the verification checkpoint.

Not a claim of laboratory or cell-type-specific reconstruction. No external publication or deployment was performed.
