# Frozen process-cache A reference

These 11 source files are a complete local-import closure of the four tested
process definitions from commit `ae697be5f252c1df58b34b57a6e9a8e1c014acf4`.
Each file is copied byte for byte by `git show <commit>:<path>` into the same
relative path below this directory. No source edits or import rewrites were made.
`manifest.json` records every original source path, SHA-256, byte count and import.
The only external dependency is `three`, shared with the current implementation.

`tests/process-geometry-cache-exact.mjs` validates these source hashes and the
unchanged historical pose fixture before importing either implementation. It
compares the frozen and optimized implementations in the same Node runtime,
using every field of the existing exact snapshot helper. Historical output
hashes remain in the original JSON as evidence; they are not cross-platform
numeric expectations. All 862 historical poses run twice, retaining parameter
changes, boundary samples, reverse seeks and repeated updates.

Do not regenerate or reformat this source to make a regression pass. Any
intentional baseline change requires an explicit new provenance review.
