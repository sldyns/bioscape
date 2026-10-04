# README presentation review — 2026-10-04

The English and Chinese repository READMEs now use the current homepage as their cover, a complete nine-model gallery, paired structure/process illustrations and shorter feature descriptions. Comparison imagery, introductory films and export details are expandable. Scientific scope, author credit and licensing remain visible.

## Checks

- The application catalog confirms 9 model types, 182 structure nodes and 84 processes.
- Both editions have all 9 correct model routes, 3 catalog-verified process routes and 21 existing relative link/image targets.
- GitHub's Markdown API renders all 13 images and one native video player per edition. The existing language-specific attachment URLs are unchanged.
- Local visual review uses that API-rendered HTML and GitHub's current stylesheets. Checked desktop at 1280 px, English/dark and Chinese/light at 390 px, and English/light and Chinese/dark at 320 px. Images loaded; neither the document nor its tables exceeded the available content width. Optional hyphens keep long English gallery labels readable at 320 px.
- The expanded English native player loaded with controls, readyState 4 and no media error. This pass did not repeat a full film/audio review or the application's earlier science and performance checks.
- `git diff --check` and the focused README route, asset, count, attribution and video checks passed.

The two new [cover files](../../media/readme/README.md) retain their original 1280 × 720 capture resolution. Local detailed evidence is in `evidence/` (rendered HTML, validation and layout JSON, and review screenshots); raw responses and preview dependencies are intentionally not part of this documentation commit.
