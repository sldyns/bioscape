# Project information and export credit — 2026-10-03

## Delivered

- Image and video compositions retain the `BioScape` project mark and scientific context, without `Kun Qian` in the artwork. Legacy saved `attribution` preferences no longer restore a name watermark.
- Homepage authorship now explicitly says **设计与开发 / Designed & developed by** above a larger, darker **Kun Qian** link. The author's existing homepage and copyright notice remain available.
- The footer contains **关于项目 / About the project**, **使用许可 / License**, and **商用联系 / Commercial enquiries**. The first two open a compact dialog with project, license, and third-party sections. Commercial contact uses the email already published in `LICENSE`; no message was sent.
- The license view includes a short Chinese/English explanation and displays the complete `LICENSE.txt` text inside the scrollable dialog. Third-party notices are likewise shown in full. Both can also be opened separately.
- Legal document text is fetched only when its section is opened. The dialog component and CSS load on demand. Existing rendering quality, models, and loading caches are unaffected.

## Licensing boundary

The governing `LICENSE` was not changed. Sections 3 and 4 already require prior written commercial permission and allow media credit in an appropriate credits or accompanying-notes section. The UI therefore removes the **embedded author-name watermark**, while explaining the existing sharing/attribution conditions. Chinese descriptions are summaries; the English license governs. Third-party materials retain their own licenses.

The UI treatment keeps the footer concise and the full documents accessible on request. Dialog behavior follows the [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): labeled content, focus inside the dialog, Escape dismissal and return to the opener. A native `<dialog>` supplies background inertness, with explicit Tab cycling for consistent keyboard behavior.

## Validation

- `tests/studio.mjs`: **18 passed**, including still/video composition and migration from both old credit settings; project mark and scale note retained, author-name text absent.
- Homepage catalog and navigation/resume/deployment-base checks passed.
- Production build, release asset checks (**84 processes, 9 homepage models, 3 homepage motion previews, 374 files**), targeted formatting and `git diff --check` passed.
- Actual browser: desktop at 1280 × 720; mobile layout at 390 × 844, Chinese and English. The mobile dialog is 366 px wide with no horizontal overflow. Temporary viewport override was cleared and Chinese restored.
- Complete displayed license: **4,743 characters, exactly equal to `LICENSE`**. Third-party text: **5,764 characters, exactly equal to `docs/legal/THIRD_PARTY_NOTICES.md`**.
- Real scrolling reached the end of the license. Tab/Shift+Tab cycle within the dialog; Escape closes it and restores focus to the opener. Page scroll locking is restored on close.
- Actual **1920 × 1920 PNG** generated via Download PNG, 2,124,144 bytes. It was visually inspected and has no author-name watermark. A temporary observation hook was removed afterward.
- Actual **1920 × 1920 MP4**, 6.091 seconds, recorded successfully. A full-resolution decoded frame was visually inspected and likewise contains no author name. Recording resolution and composition were preserved.
- No warning/error entries in the checked homepage or Studio browser console.

## Evidence

- `footer-desktop.png`, `footer-mobile.png`: homepage identity and compact entry points.
- `about-desktop.png`, `about-mobile.png`, `about-mobile-en.png`: project and creator presentation.
- `license-desktop.png`, `license-mobile.png`, `license-end.png`: license summary and readable full text.
- `export-no-author-1920.png`, `video-frame-no-author-1920.png`: original-resolution export checks.
- `video-no-author.png`, `export-check.json`, `browser-checks.json`: recording and browser verification.
- Focused logs: `/tmp/bioscape-project-info-studio.log`, `/tmp/bioscape-project-info-home-tests.log`, `/tmp/bioscape-project-info-build.log`, `/tmp/bioscape-project-info-release.log`, `/tmp/bioscape-project-info-format-check.log`.

Local preview only; no external deployment was performed. This pass checks the footer/dialog/export-credit changes, not a fresh scientific audit of every model.
