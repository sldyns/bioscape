# Homepage catalog and content QA

Date: 2026-10-03. Scope: homepage metadata, bilingual introductions, process entry routes and static preview availability. This is not a rendered-browser or scientific-model acceptance report.

## Verified

`node tests/home-catalog.mjs` passes with 9 model families, 182 unique reachable structure IDs (including the roots), and 84 distinct process IDs. The same totals are derived from current catalogs at runtime; the homepage does not hardcode them.

- Nine models preserve the existing root order. Titles use the structure metadata, including **Budding yeast**, **T2 bacteriophage**, **Mature human erythrocyte**, **Myelinated multipolar neuron**, and **Human skeletal muscle fibre**. Short bilingual introductions describe those specimens; phage is explicitly identified as a non-cellular virus.
- All 84 process titles and summaries match the source process catalog exactly. Every process has a supported root, round-trips through `parsePath`, `parseExperience` and `parseProcess`, and has an existing rendered WebP preview in `public/process-thumbnails/rendered/`.
- Action potential and synaptic transmission enter the supported neuron route; muscle contraction enters muscleFibre; erythrocyte osmotic response enters erythrocyte. Other processes use supported source root mappings rather than inferred destinations.
- Six featured entries are transcription, mitosis, photosynthesis, actionPotential, respiration and phageLytic. They cover five process categories. All six current source categories are exported without renaming.
- An esbuild metadata dependency check confirms that the homepage catalog import graph contains no Three.js or process-scene builders.
- Homepage source filtering searches both languages' titles and summaries. The Featured tab expands its search to the full process catalog; a selected subject category continues to constrain searches. The empty-state recovery resets both the query and category to expose all processes.

## Scientific scope boundaries retained

Process routes group related subjects; they do not assert that a process depicts the exact structure specimen. The action-potential summary explicitly says **unmyelinated** while the structure model is **myelinated**. Phage processes explicitly retain T4, lambda and P1 labels while the structure is T2. The fungal hyphal-growth process retains its Neurospora scope under the supported yeast family. Bacterial processes retain organism-specific names, including B. subtilis, cyanobacteria and S. pyogenes, rather than becoming claims about the Gram-negative rod structure. Plant processes likewise retain guard-cell, companion-cell, tissue or ovule context instead of silently becoming mesophyll-cell claims.

The homepage uses “model families” rather than calling all nine models cells. The 182 count describes structure nodes, not separate experimental structures or shared true-scale reconstructions. The footer states that geometry, scale and timing are simplified.

## Findings sent to the integrator

1. Initial English collection heading “All full of life” includes phage and risks implying that the virus has independent living-cell status. A neutral heading avoids this ambiguity.
2. Initial lowercase-only search does not normalize scientific superscripts/subscripts or diacritics: ordinary `C4`, `CO2`, `Ca2+`, and `Kalanchoe` do not match source `C₄`, `CO₂`, `Ca²⁺`, and `Kalanchoë`. Normalize both the query and search text with NFKD and remove combining marks to support those inputs while retaining the accurate displayed text.

## Browser verification limitation

The catalog QA agent could not obtain a browser surface: both IAB and Chrome tab creation reported “Browser is not available”; the surface inventory returned no browser providers; native Google Chrome accessibility timed out twice (`-10005 timeoutReached`). Therefore featured/category/search rendering, empty-state recovery and the actual set of 84 DOM anchors remain assigned to the integrator's working browser session. No viewport override or application build was performed by this agent.
