# RNA group · default-condition rendered still review · 2026-10-04

Scope: read-only review of the four sheets indexed by `evidence/browser/gallery-index.json`, plus three original 960×640 WebP frames. English, first registered root, default controls only. The integrator reports complete native playback capture; this reviewer inspected the saved stage stills and **did not view the complete video or operate the browser**. No product/test/audit edits were made.

| Process | Root / condition | Images actually inspected | Still-review result |
| --- | --- | --- | --- |
| rnaProcessing | cell / no controls | 7-frame sheet, p=0, .145, .305, .475, .705, .915, 1 | Qualified still pass; no new confirmed visual defect |
| nuclearTransport | cell / NLS exposed | 7-frame sheet, p=0, .175, .355, .575, .765, .935, 1; original p=1 | One new P2 label identity issue; geometry remains visually coherent |
| motorTransport | cell / kinesin, ATP available | 7-frame sheet, p=0, .165, .315, .495, .715, .915, 1; original p=.715 | Default kinesin qualified still pass; repaired dynein interface is not in this evidence |
| organelleImport | plant / transit present | 7-frame sheet, p=0, .175, .355, .565, .775, .925, 1; original p=.565 | Qualified still pass; no new confirmed visual defect |

## New finding: 20261004-rna-rendered-01 · P2 · Importin label does not separate after α/β dissociate

- Visible evidence: `evidence/browser/full-a-retry-007-nuclearTransport-cell-end.webp`, p=1, original 960×640. The violet β crescent and Ran-GDP are in the cytosol at left. The separate gold α helix remains in the nucleoplasm at right. The cytosolic leader still reads **Importin α / β**. The same mismatch is visible at p=.935 in the sheet.
- Code confirmation: `src/processes/modules/rna/nuclearTransportProcess.js:358` creates the permanently combined α/β label. Lines 389–390 keep α nuclear after p=.73; lines 407–408 continuously attach the combined label to β. This can imply that both receptors recycle together, despite the correctly drawn separated geometry and the stage text's explicit omitted α/CAS route.
- Suggested repair: when the receptors have separated, identify the returning receptor as Importin β and separately identify retained nuclear Importin α if label density permits. Preserve the actual trajectories and CAS omission. Recheck the p=.765/.935/1 stills plus the binding/transit stages; verify both languages in source and render the changed default English frames.
- Status: reported to integrator; this read-only image task does not authorize a product change. The earlier audit and resolution records remain intact; this is a supplemental rendered finding.

## Per-process observations

**RNA processing.** The precursor is recognizable as one strand with two differently colored exons and an intervening intron. Cap arrival, spliceosome assembly, lariat formation/release and poly(A) product appear in their expected stage sequence. At the terminal still, the exons and tail remain visually continuous while the lariat is separate below; the cap, exon, tail and lariat labels are fully on-screen. p=.705 has projected overlap among spliceosome, lariat and ligated product, but the later resolved lariat is clear, and the previously measured 3D linkage is not contradicted by the projection. No new break or crop was observed. Static frames cannot assess enzyme appearance/disappearance smoothness or the segment growth cadence.

**Nuclear transport.** Double-envelope cutaway, central channel and basket remain recognizable; cargo and receptors are visible on the expected sides before and after transport. Ran-GDP and returned β are readable at the end; no important geometry or label is cropped. The combined receptor label is the new issue above. The supplied sampled stages skip the exact middle of the cargo crossing, so these frames supplement the prior vertex-clearance evidence rather than independently showing every crossing frame.

**Motor transport.** All supplied frames show Kinesin-1, not dynein. The early cargo-to-stalk gap is consistent with the documented docking stage; it is closed by the ATP/transport stage. At p=.715, the original frame clearly shows the stalk/cargo attachment, a planted head at the track and the lifted partner. Track polarity labels remain readable, the trajectory runs toward the displayed plus end, and final cargo remains in frame. The dynein MT-binding-domain repair (`20261004-rna-01`) therefore retains its earlier triangle-test evidence but **has no rendered acceptance from this gallery**. Required follow-up is dynein with ATP, including both planted and swing configurations, and the depleted branch.

**Chloroplast import.** The two envelope membranes, intermembrane region and separate TOC/TIC route are visible. The original p=.565 image shows an extended chain crossing the central route and emerging next to the stromal chaperone; it does not visibly pass through the lipid sheets. The later stills separate the transit peptide from the folding mature chain in the stroma. Labels, substrate and folded product remain in frame. At p=.775 the chain is still near the early cleavage transition, so that particular still alone cannot prove the complete cutting motion. No new defect was confirmed.

## Files actually viewed

- `evidence/browser/sheets/full-a-retry-006-rnaProcessing-cell.jpg`
- `evidence/browser/sheets/full-a-retry-007-nuclearTransport-cell.jpg`
- `evidence/browser/sheets/full-a-retry-008-motorTransport-cell.jpg`
- `evidence/browser/sheets/full-a-retry-009-organelleImport-plant.jpg`
- `evidence/browser/full-a-retry-007-nuclearTransport-cell-end.webp`
- `evidence/browser/full-a-retry-008-motorTransport-cell-stage-5.webp`
- `evidence/browser/full-a-retry-009-organelleImport-plant-stage-4.webp`

Other roots, Chinese rendering, masked-NLS, dynein, ATP-depleted and absent-transit combinations were not visually inspected in this supplement. No full-motion, frame-time, physical-device or all-conditions acceptance claim is made.

## Later authorized repair addendum

The identity issue `20261004-rna-rendered-01` is now fixed locally. The subsequent concrete-object sweep added `20261004-rna-rendered-02`; 18 detached original anchors were confirmed and repaired. See `resolutions/rna.json` and `evidence/rna/repair-discoveries.md` for source changes, 1,218 actual surface checks / 14 root-condition configurations and negative replays. The original visual observations above remain the pre-repair evidence; post-repair rendered acceptance is pending root.

## Final sampled rendered verification

All 14 RNA root/control cases now have sampled-frame review. Eight non-NPC cases use the original final batch A; all six NPC cases were recaptured in Chinese as `conditions-final-e-000..005`. Their six seven-frame sheets and each exposed root's p=.765/.935 native 960×640 originals were opened. Beta now points to the purple beta helix, Ran-GTP to the Ran complex, and retained alpha to the separate nuclear alpha structure. All masked branches preserve cytosolic cargo/receptor identity and nuclear Ran-GTP. No new defect was confirmed.

The accepted set contains 98 sampled frames in 14 cases. Discovery plus replacement review covered 20 sheets / 140 captured frames and 17 additionally opened originals. This is native irregular-seek evidence, not continuous playback of every case. See `resolutions/rna-rendered-all-cases.md` for every case, image counts, languages and remaining acceptance boundaries.
