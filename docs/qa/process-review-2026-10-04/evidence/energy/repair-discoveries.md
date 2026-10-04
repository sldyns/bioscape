# Energy rendered repair discovery

`20261004-energy-07` · P2 · incorrect concrete-object leader endpoints across four models.

Thirty stage frames across four default root/condition scenes show concrete labels ending in empty space or near another object. Examples: respiration IV anchor is 0.925 scene units from its membrane-domain center; glycolysis carbon labels sit 0.6 above their actual chains; bacterial Q anchor is 0.940 from the visible Q carrier; cyanobacterial FNR anchor is 0.671 from FNR and visually nearer the ATP-synthase head. Full pre-fix measurements are preserved in label-before.json.

Legacy text-placement offsets become scientific leader endpoints in the current annotation renderer. A named protein, carrier or substrate must point to that object rather than a former text margin. Region descriptions may remain regional.

Bind concrete labels to transformed actual mesh-surface points. Moving carriers, glycolytic carbons, NAD and adenylates track their geometry. Branch-specific NDH/oxidase labels use the selected visible protein. Reword ion-reaction labels as named reaction sites and the cyanobacterial ATP label as F1. Keep compartment/accounting descriptions regional.

New labels.test.mjs: 1760 actual transformed-surface endpoint checks across 15 root/condition contexts, a translated real-protein test, and negative controls restoring photographed offsets. Legacy science, transport continuity, finite/stable-resource and deterministic-seek smoke all pass. New rendered frames still required for final visual acceptance.

Detailed per-model measurements and frame provenance: [repair-discoveries.json](repair-discoveries.json), [label-before.json](label-before.json). Original Phase A audit and images remain unchanged.
