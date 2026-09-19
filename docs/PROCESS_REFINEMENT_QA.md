# Process visual refinement — 2026-09-19

This pass responds to the rejection of the initial process expansion as too coarse. No process IDs were added. Existing transcription remains the accepted reference; the other 83 models received mechanism-specific structural refinements. Changes for each of the 22 groups are recorded in `src/processes/modules/<group>/REFINEMENT.md`.

## What changed

- Membranes now show paired leaflets, lipid components, cut edges and openings; organelles have readable lumina and internal membrane organization.
- Protein scenes expose mechanism-specific domains, clefts, helices/sheets and complexes. Nucleic acids have nucleotide/base-pair/backbone detail. These are sourced teaching structures, not claimed atomic reconstructions.
- Secretion now has open cisternal views, bilayer detail, lumen enzymes, folded cargo and visible carrier interiors. Golgi sacs and all attached detail fade together during maturation. The budding neck opens before cargo approaches the narrow rim.
- Action potential uses a large local channel view alongside the axon propagation overview, with a marked correspondence and synchronized gating.
- Directory previews are actual WebGL renders of each scene rather than the prior flat SVG diagrams. All 84 are 640×640 WebP files, about 1.7 MB in total. Cards use lazy image loading; no extra WebGL contexts are created for thumbnails. Old diagrams remain source assets.

## Visual review

All 84 actual models were captured and visually inspected in a fixed 640×640 studio. The manifest `process-rendered-previews.json` lists the exact process, root, representative frame, preview page and delivered image for each. Selected processes also received additional-frame review. This is a representative scene review, not frame-by-frame validation of every biological condition.

The first review found and corrected:

- Abnormally long lipid tails around the phage host: a mutated normalized vector was accidentally reused as a length. Both tails now remain inside their own membrane leaflets, with an explicit instance-level regression.
- Golgi cut edges and enzymes remained visible after the cisterna faded; all related materials now fade and hide together.
- Secretion cargo approached a narrow still-closed rim; opening timing and lumen width were adjusted and reviewed independently.
- Action-potential channels were too small at the overall scene scale; a local magnification was added.
- The new dense secretion membranes initially hid the tracked cargo; a genuine front cutaway restores visibility.

Desktop and 390×844 viewport checks cover directory images, hierarchical entry/back navigation, stage selection, timeline end state, Chinese/English text, playback and layout. The mobile-width checks do not constitute physical phone testing; no device is connected.

## Reproduction

- Run the Vite dev server; open `process-preview.html?process=<id>&frame=<0..1>`.
- The studio uses the same `ProcessScene` and definition as the product. It only hides HTML labels for the preview image.
- Capture the studio together with its DOM-observed frame rectangle into matching `<id>.png` and `<id>.json` files.
- Run `python3 scripts/build-rendered-thumbnails.py /path/to/captures` with Pillow installed. This crops only the captured model region, preserves its features and normalizes whitespace into square WebP cards.
- `npm run verify` checks process contracts, deterministic seeking and existing structural models; `npm run build` checks production integration. Individual groups also contain local geometry/instance/resource tests.

Detailed scope limits in `PROCESS_COVERAGE_AUDIT.md` still apply. A model's presence does not mean all submechanisms of that biological topic are covered.

## Final results

- `npm run build`: passed.
- `npm run format:check`: passed.
- `npm run verify`: passed on the final implementation. 84 process definitions / 2,675 seeks; 80 extension definitions / 105 root cases / 215 condition combinations / 1,720 progress checks; no issues. Existing structural checks: 163 nodes / 241 routes / 160 detail transfers, no errors.
- Integrated secretion regression passes for cargo containment, every cisternal material fading together, recycling and arbitrary seeks. Independently restoring the old defects in memory caused the new assertions to fail.
- Production preview at localhost:4173 loaded the refined translation model and rendered directory assets. English and Chinese, stage/end/play/return/search, 390×844 layout and visible image decoding were verified. Desktop translation proof: `/tmp/atlas-refinement-translation-desktop.png`.
