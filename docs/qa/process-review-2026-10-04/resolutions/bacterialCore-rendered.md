# bacterialCore integration-stage rendered review

Reviewed the four entries in `evidence/browser/gallery-index.json`, all under `bacterium`. Each sheet contains start, five intermediate stages and end: **28 rendered frames total**. Inspected four additional 960×640 original images at native resolution. These are the supplied pre-annotation-repair images; this report does not claim that the updated labels have already been recaptured.

| Process | All rendered progress values reviewed | Native-resolution witness | Result |
| --- | --- | --- | --- |
| bacterialExpression | 0, .195, .355, .515, .665, .855, 1 | `full-a-stable-040-bacterialExpression-bacterium-end.webp` | RNA, peptide and strand leaders visibly end outside the named structures. Fixed as -04. |
| bacterialDivision | 0, .185, .445, .535, .695, .915, 1 | `full-a-stable-041-bacterialDivision-bacterium-stage-2.webp` | Replication-fork and chromosome leaders end in empty space. Fixed as -05. |
| conjugation | 0, .175, .355, .505, .815, .925, 1 | `full-a-stable-042-conjugation-bacterium-stage-4.webp` | Leading-T-strand, junction and new-strand leaders miss their targets; a pilus annotation is present before extension. Fixed as -06. |
| transformation | 0, .175, .345, .525, .705, .915, 1 | `full-a-stable-043-transformation-bacterium-stage-4.webp` | ComEC/RecA/chromosome leaders retain free-space offsets; environmental label outlives its DNA. Fixed as -07. |

All image paths above are beneath `docs/qa/process-review-2026-10-04/evidence/browser/`; sheets are beneath its `sheets/` folder. Original resolution and existing evidence were preserved.

The visible mechanisms remain recognizable across their stages: expression progresses from RNAP docking to nascent RNA/peptide, division retains cutaway layers and separated daughter DNA, conjugation transfers a leading strand and completes both plasmids, and transformation shows ssDNA uptake followed by RecA docking and a final heteroduplex. No further mechanism defect is established by these representative views. They do not replace the earlier arbitrary-progress geometry review or continuous-playback gate.

The annotation repair uses actual molecular endpoints, visible protein components and membrane vertices. Both languages share these anchors. Combined envelope/specimen annotations identify the displayed cell or envelope; blocked-division and unmatched-transformation wording explicitly identify a division site or retained chromosome rather than a nonexistent reaction product. Visibility is tied to actual molecular presence, including undeployed pili, consumed environmental DNA, sigma absence and blocked oriT transfer.

Verification after repair:

- `label-anchors.science.test.mjs`: **208 states**, both options for all four controls, actual-world target checks, deterministic arbitrary seeking, four anchor-offset and two stale-label negative controls.
- Independent witness gaps change from `.25 / 2.006588546 / 1.259410612 / .783022988` world units to **zero**. The unextended-pilus and exhausted-environment labels are now inactive.
- Complete owned-group scientific suite passes, retaining all prior backbone, membrane, D-loop, handedness, finite-buffer, resource-inventory, determinism and mutation checks. Log: `evidence/bacterialCore/rendered-repair-science.log`.

**Remaining gate:** root refreshes the four scenes after this code freeze and reviews continuous playback plus annotation layout in both languages. Supplied screenshots cover the default scenarios; alternative controls were checked geometrically here. This worker did not operate a browser or run the full-workspace suite.
