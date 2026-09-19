# plantSignals — Phase B correction record

All four Phase A findings are fixed in the owned module. Phase A evidence remains unchanged. Visual acceptance is reserved for root review.

| Issue | Correction | Local evidence |
| --- | --- | --- |
| plantSignals-01 | Replace the empty TIR1 ring with a selected experimental 2P1Q binding site; keep TIR1, IAA and IAA7 in one coordinate transform. | Every atom preserves deposited assembly geometry. Actual triangle-surface gaps at binding: receptor–IAA −0.01712 and degron–IAA +0.01300; multi-atom contact assertions pass. |
| plantSignals-02 | Transfer the same four ubiquitins to recycling, remove their substrate link and preserve their scale independently of substrate loss. | p=.48–.80 retains four original UUIDs and radius .085; no link after .63; low-auxin branch lacks induced chain. |
| plantSignals-03 | Flexible intracellular links permit actual receptor kinase contact; BIK1 contacts receptor before release and RBOHD before phosphorylation. | Triangle ray intersections at new phosphomarks show gaps −0.00198, −0.01643 and −0.00246. Earlier frames and no-ligand branch lack these marks. |
| plantSignals-04 | Keep BAK1 within the patch and move lipid exclusions with it. | Both branches, 202 frames: transmembrane containment and restored vacated lipid slots pass. |

`node src/processes/modules/plantSignals/science.test.mjs` passes all four regressions plus finite geometry/bounds, deterministic seeking, stable resources and owned-module browser bundles. These are targeted invariant checks, not proof of all biological details. No browser or global test was run.

The [2P1Q deposited coordinates](https://files.rcsb.org/download/2P1Q.pdb) supply 161 heavy atoms in 19 TIR1 contact residues, all 114 modeled IAA7 atoms and 13 IAC atoms. Original chain/residue/atom identity and Å coordinates are retained; waters and IHP are omitted. The local binding site is experimental; surrounding SCF, full Aux/IAA, kinase docking poses and animated travel remain labeled teaching schematics. [The structure record](https://www.rcsb.org/structure/2P1Q) is added to model sources. Phase A sources still support deubiquitination and the FLS2–BAK1–BIK1–RBOHD relay.

Modified files: `auxinProcess.js`, `plantDefenseProcess.js`, `structures.js`; new `tir1Pocket.js`, `2p1q-pocket.json`, `science.test.mjs`, and these resolution records. No unresolved issue IDs.
