# plantWater — Phase B resolution

Both original findings are locally fixed. Phase A evidence is unchanged. Qualified-pass models `plasmolysis`, `stomata` and `plantLongDistanceTransport` were not edited.

- **plantWater-01:** Chloroplasts now follow a rounded cortical path with disk orientation coupled to the turn. This replaces the sequence that first drove the disk into a wall and then rotated it. Whole organelles retain their size and structure; both genotype accumulation paths are corrected, and wild-type avoidance reverses the safe route. Starting order also avoids bringing two chloroplasts to a shared corner position.
- **plantWater-02:** Corrected the existing Nature article's author prefix to **Jarillo et al.** The title and DOI/URL remain unchanged, consistent with the publisher evidence recorded in Phase A.

`science.test.mjs` passed **404 progress inputs × 2 genotypes × 16 complete plastids**. It checks transformed shell/rim/connector vertices and every grana instance, not just centers. Minimum cell-wall clearance was **0.0678 model units**. A conservative box enclosing each full plastid remains outside the normalized vacuole sphere (minimum distance **1.0455**); this establishes separation of intervening triangles and volume rather than assuming a nearest vertex is a surface distance. Geometry and instance buffers remain identical throughout the sweep, and scene/resource identities and repeated seeks are stable.

Both legacy bad transforms are included as negative controls and are rejected by the containment check. Low-light and both high-light branch endpoints, and the corrected bibliographic combination, are asserted.

Validation: local science regression, existing four-model smoke checks and isolated esbuild all passed. Only the corrected model and new scientific test were formatted. No global files, thumbnails or browser state were changed.

Changed files: `chloroplastMovementProcess.js`, new `science.test.mjs`, and these two resolution documents. The route is an explanatory illustration; local tests do not replace root screenshot review or prove all biological details. No unresolved original finding remains.
