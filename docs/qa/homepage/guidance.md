# Homepage guidance follow-up · 2026-10-03

Restored the requested first-screen guidance while keeping the compact headline and description:

- The 09 / 182 / 84 metrics each have a label and one short explanatory line, in Chinese and English.
- Start exploring always opens the default animal cell. When a previous scene exists, Continue exploring appears in the desktop header; on narrow screens it appears below the primary actions with the saved scene name.
- Scroll to discover moves to the model gallery and focuses its section. It uses the existing reduced-motion-aware navigation helper.

Browser verification on the production preview at `http://127.0.0.1:4201/#/`:

- A fresh visit has Start exploring and no Continue link. Visiting the plant scene and returning reveals Continue, which restores the saved plant URL and camera. Start still opens `#/cell`.
- The scroll prompt moves to the model gallery and focuses `home-models`.
- Chinese at 390 px and English at 320 px have no horizontal overflow. The English metric text wraps within each column. The English header also fits at 820 px.
- The mobile Continue link restores the scene with English selected. Desktop viewport and Chinese language were restored after testing.
- The final desktop hero reports ready, and the browser console has no warnings or errors.

Evidence: [desktop](guidance-desktop.png), [390 px Chinese](guidance-390-zh.png), [320 px English metrics](guidance-320-en.png).

Validation: existing homepage catalog and navigation tests, production build, release asset checks, formatting and whitespace checks passed. These are browser viewport checks, not physical-device acceptance. This record describes the local acceptance before publication; subsequent deployment status is recorded by the repository's GitHub Pages workflow.
