# Frozen secretion performance reference

These two files are exact copies of the deployed `ae697be` process and its
helper, retained for the portable `tests/secretion-performance-equivalence.mjs`
regression. Only the process file extension is changed from `.js` to `.mjs`;
its contents and relative helper import remain unchanged.

| Fixture | Original path | SHA-256 |
| --- | --- | --- |
| `secretionProcess.mjs` | `src/processes/secretionProcess.js` | `0c3ca513491442f08cf2963637e1696354e47d36f3c5b040d26684296bedb1dc` |
| `secretoryDetails.js` | `src/processes/secretoryDetails.js` | `7229d640920a7d9108e3f7e1132c495c6dd6c1dd9fe47ae44bce96cbca5348e4` |

No temporary checkout, Git history, network request, generated snapshot, or
browser is required. The fixture uses the same installed Three.js dependency
as the candidate so the test isolates the process implementation. Preserve the
original source and helper when changing the optimized implementation.
