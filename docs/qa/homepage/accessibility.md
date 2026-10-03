# Homepage accessibility and usability audit

Date: 2026-10-03. Scope: homepage only; production source was reviewed read-only. Audit owns this report only. Browser target: independent background IAB tab at `http://localhost:5174/#/`; no user tab or viewport setting changed.

## Source findings reported to implementation owners

1. **Reduced-motion scroll inconsistency.** In the initial `HomePage.jsx` source, the wordmark calls `window.scrollTo({ top: 0, behavior: "smooth" })` unconditionally. Section navigation already checks `prefers-reduced-motion`. Reproduction: enable reduced motion, scroll down, activate the BioScape wordmark. Expected: immediate return, consistent with section jumps. Initial evidence: `HomePage.jsx:46`, compared with `jump()` at lines 22–25. Source-proven; not yet exercised with a reduced-motion browser setting.
2. **Reduced-motion toggle accessible name disagrees with state.** In the initial `HeroScene.jsx` source, reduced motion disables rotation and the button, and shows a play icon, but `aria-label` still says “Pause rotation” when `paused` is false. Its `title` correctly explains reduced motion. Expected: the accessible name communicates the reduced-motion state. Initial evidence: `HeroScene.jsx:90–94`. Source-proven; not yet exercised with a reduced-motion browser setting.
   - **Fixed in source during this audit:** the button now has a stable “Automatic rotation” name, `aria-pressed` state, and a reduced-motion-specific accessible name when applicable. Normal-mode keyboard toggle was verified in the browser; reduced-motion preference emulation was not performed.
3. **Small informational text is low contrast.** Browser computed style confirms model descriptions use `10px #969ba4` on white (calculated contrast 2.79:1), process summaries use `10px #969da7` on white (2.74:1), and inactive category buttons use `10px #939aa4` on `#f7f8fa`. Reproduction: visit the model collection/process section at the normal desktop viewport and read the supporting description/category text. The visual screenshots show visibly pale small text; exact computed colors corroborate this. Reported to integrator to darken these functional/informational labels while retaining the light composition. This is a specific finding, not a full-page contrast certification.

## Source checks with no finding

- Skip link and all section navigation call `jump()`, which scrolls and focuses the destination with `preventScroll`. Main and section destinations have `tabIndex={-1}`. This is a complete focus-transfer path in source; visual focus awaits CSS/browser verification.
- Category controls are native buttons in a named group, with mutually exclusive `aria-pressed` state. Search has a localized accessible label; result count is a `role="status"` region.
- Clear search restores input focus. Empty-state recovery selects All, clears the query, and restores input focus.
- Search matches both Chinese and English titles and summaries, trims whitespace and ignores case. A nonempty query broadens Featured to the whole catalog; an explicit category remains a constraint. This follows the implemented product behavior and is not treated as a defect.
- Model/process cards use native links with informative visible titles and summaries; preview images use empty alt text to avoid repeating card content. Modified clicks are left to native link behavior.
- Language changes update the document `lang` and title in `HomeRouter.jsx`; both languages have localized search, group, navigation and action labels.
- Hero rotation is conditional on `!paused && visible && !reduced`; preference changes are observed. Manual pause and explicit open-model controls exist. This does not certify full 3D viewer keyboard accessibility.
- Footer identity link uses the existing `project.homepage` value, `https://sldyns.github.io/`, with `target="_blank"` and `rel="noreferrer"`; no unexpected destination was introduced by the homepage.

## Browser verification status

Initial browser visit displayed the Vite import overlay because `src/home/home.css` was still being written by the integrator. After the stylesheet landed, the homepage rendered successfully and the following checks were performed in the independent background tab:

| Check | Action and observed result |
| --- | --- |
| First keyboard focus | Fresh page → Tab focused “Skip to content”; screenshot showed a clear blue outline and visible skip control. |
| Skip target | Enter focused `#home-main`; the next Tab focused “Start exploring”, bypassing header navigation. |
| Section jump | Keyboard Enter on “Processes” focused `#home-processes`; after smooth scrolling settled, its top was 76.6 px, below the fixed header. Next Tab focused Featured. |
| Focus treatment | Featured button computed outline was `rgb(0, 113, 227) solid 2px`; screenshot visibly showed it. |
| Empty search | Filled `no-such-process-qa`: status showed 0 matching processes, no cards remained, recovery button appeared. |
| Empty-state recovery | Keyboard Enter on “View all processes”: All became pressed, 84 processes appeared, query cleared, input regained focus. |
| Category keyboard state | Space on “Genes & regulation”: it became pressed, count changed to 24, focus stayed on the category control. |
| Search within category | Filled `  DNA  `: 8 matching processes appeared, preserving Genes & regulation. Card href remained a specific process route. |
| Clear search | Keyboard Enter on “Clear search”: input became empty and focused; Genes & regulation remained selected. |
| Language | English → Chinese changed `documentElement.lang` to `zh-CN`, localized document title, heading, search label and selected category. Restored English after the check. |
| Hero motion control | Space toggled Automatic rotation from pressed=true to false (title “Start rotation”), then back to true (title “Pause rotation”). |
| Card names | Browser accessibility tree exposed descriptive model/process link names including title and summary; images did not duplicate those names. |

Screenshots were inspected through the browser tool for skip focus and process/category focus; no screenshot file was saved by this audit. No build was run and no production source file was edited by the auditor.

Not claimed: screen-reader speech testing, OS-level reduced-motion testing, mobile/device acceptance, contrast certification, production release validation.
