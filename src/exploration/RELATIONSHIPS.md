# Structure and process relationships

`relationships.js` contains explicit biological locations for all 84 current
processes across their 114 supported root/process combinations. It imports only
the structure hierarchy and process metadata. Process geometry remains lazy.

## Navigation contract

- `getProcessesForStructure(path)` accepts a valid, root-prefixed structure path
  array. It returns unique `{ id, structurePath, entryProgress, relation }` cards.
  Exact locations precede the nearest mapped ancestor, then mapped descendants.
  `structurePath` preserves the actual entry path, including the alternative
  animal cytoplasm route, for the return action. Root views list all supported
  processes from the beginning; root-only links never populate unrelated parts.
- `getStructuresForProcess(rootId, processId)` returns independent copies of
  `{ path, at, label? }`. Paths include the root. Specific locations precede a
  root fallback. `at` is an actual normalized stage boundary in the current
  definition, not a duration in seconds. An optional bilingual `label` qualifies
  a different specimen, a particular control branch, or an unavailable location.
- Invalid paths and unsupported root/process pairs return an empty array.
  Shared node names never permit crossing into another species tree.

The mapping follows each current process's introduction and stage descriptions,
with the source references retained in its process definition. It does not add
new claims about organism universality. Its stage anchors track the explanatory
sequence; they do not imply measured biological timing or an exclusive location
for every step in the broader pathway.

## Specialized specimen continuity

The three specialized structure roots retain their own process routes. Their
selected definitions do not branch on `rootId`, and use the existing process
directory without redirecting navigation through `cell`.

| Root          | Process           | Specific structure destinations and stage anchors                                                                                                                                                               |
| ------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `neuron`      | `actionPotential` | `neuronAxon` at 0.42, regeneration in adjacent membrane. A root-specific introduction states that the process shows continuous conduction in an unmyelinated axon, while the structural specimen is myelinated. |
| `neuron`      | `synapse`         | `neuronTerminals` at 0.38, release; `neuronDendrites` at 0.56, postsynaptic AMPA response. The context introduces the partner neuron and astrocyte and limits the example to a glutamatergic synapse.           |
| `muscleFibre` | `muscle`          | `muscleFibreSarcomere` at 0, resting sarcomere; `muscleFibreMyofibrils` at 0.43, the power stroke and sarcomere shortening.                                                                                     |
| `erythrocyte` | `osmoticBalance`  | `erythrocyteMembrane` at 0.38, net water movement; `erythrocyteCytosol` at 0.18, exchange with the intracellular solution. The existing process explicitly models a mature mammalian red cell.                  |

Neither neuronal process models nuclear events, myelination or saltatory
conduction; there are no links from the neuron nucleus, myelin or nodes of
Ranvier. The muscle process omits membrane excitation and nuclear regulation,
so it does not link to the sarcolemma or peripheral myonuclei. Mature
erythrocytes receive only the osmotic-response process: no transcription,
mitochondrial respiration or precursor differentiation is attached to them.

## Deliberate scope boundaries

Thirteen combinations expose a qualified root fallback because an accurate
descendant is unavailable:

| Root         | Processes                                                                        | Boundary                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Plant        | `doubleFertilization`                                                            | The leaf mesophyll specimen has no ovule or gamete structure views.                                                                   |
| Phage        | `transduction`, `phageLysogenic`                                                 | P1/lambda examples must not lead to the structural specimen's contractile sheath.                                                     |
| Bacterium    | `bacterialSporulation`                                                           | The E. coli specimen does not form B. subtilis endospores.                                                                            |
| Bacterium    | `bacterialPhotosynthesis`                                                        | The structure tree lacks a cyanobacterial thylakoid; it is neither a chloroplast nor the bacterial plasma membrane.                   |
| Bacterium    | `biofilm`                                                                        | The P. aeruginosa PAO1 extracellular matrix is absent from the structure tree.                                                        |
| Yeast        | `translation`, `proteinFolding`, `proteasome`, `glycolysis`, `yeastFermentation` | There is no separate yeast cytosol or free-ribosome node. These processes must not be redirected to the nucleus, ER or mitochondrion. |
| Yeast/fungus | `fungalHyphae`                                                                   | N. crassa hyphal-tip growth is not S. cerevisiae budding.                                                                             |
| Paramecium   | `translation`                                                                    | The tree has no separate cytosol or ribosome view.                                                                                    |

Other deliberate restrictions include:

- F-plasmid conjugation links to plasmid DNA, not the structure's FimA/FimH
  adhesion-pilus children.
- Nuclear replication, transcription and repair do not link to mitochondrial or
  plastid DNA. Pol II RNA processing does not link to the nucleolus as a location.
- NLS protein import is not presented as mRNA export.
- Photorespiration links to the available chloroplast and plant-mitochondrial
  locations. No animal peroxisome is substituted for the missing plant node.
- C4 plasmodesmata and CAM vacuolar-storage destinations state the control branch
  they describe. Guard-cell, neuronal, skeletal-muscle and erythroid examples
  retain their specialized scope, rather than asserting that every generic cell
  performs those processes.
- Endocytosis stops at early-endosome sorting. The current model does not justify
  attaching a later lysosomal-degradation stage.

## Verification

Run `node tests/exploration-relationships.mjs`. The test checks coverage against
the live catalogue, every hierarchy edge, each stage anchor against all current
process definitions, inverse discovery, path aliases, return-path preservation,
invalid inputs and focused species/compartment exclusions. The build metafile
also rejects an eager Three.js or process-geometry dependency. For the three
specialized roots it server-renders the actual process directories, then checks
78 model/control/stage states against the established animal-cell dispatch,
including finite geometry and backward seeking. This does not replace browser
interaction checks or independently validate all biology in the existing models.
